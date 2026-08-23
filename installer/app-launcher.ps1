<#
    Composer's Dungeon — installed-app launcher.

    Ships inside the installed folder, not the source repo. Everything it needs
    is right there: a bundled Node runtime, a pre-built server, and a seeded
    database template. No Node install, no npm, no build, no network.

    Responsibilities:
      - create the per-user database and auth secret on first run
      - pick a free loopback port
      - start the bundled server and wait for it to answer
      - open it in a chromeless Edge/Chrome window
      - stop the server when that window closes
#>
[CmdletBinding()]
param(
    [int]$Port = 0,
    [switch]$KeepRunning,
    [switch]$NoWindow,
    [switch]$SkipUpdate
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Root = Split-Path -Parent $PSScriptRoot     # ...\ComposersDungeon
$AppDir = Join-Path $Root "app"
$DataDir = Join-Path $Root "data"
$NodeExe = Join-Path $Root "node.exe"

function Get-InstalledVersion {
    $file = Join-Path $Root "version.json"
    if (Test-Path $file) {
        try { return (Get-Content $file -Raw | ConvertFrom-Json).version } catch {}
    }
    return "0.0.0"
}

function Show-Problem($message) {
    $null = (New-Object -ComObject WScript.Shell).Popup($message, 0, "Composer's Dungeon", 16)
    exit 1
}

if (-not (Test-Path $NodeExe)) { Show-Problem "This install looks damaged (node.exe is missing).`n`nReinstall Composer's Dungeon." }

# The database engine is a native DLL that needs the Microsoft Visual C++
# runtime. Nearly every PC has it (games install it constantly), but on a
# clean machine its absence surfaces as a cryptic server error — catch it
# here with an actionable message instead.
$vcrt = Join-Path $env:SystemRoot "System32\vcruntime140.dll"
if (-not (Test-Path $vcrt)) {
    Show-Problem ("Composer's Dungeon needs the Microsoft Visual C++ Runtime, which this PC doesn't have yet.`n`n" +
        "Install it (free, one minute) from:`n" +
        "https://aka.ms/vs/17/release/vc_redist.x64.exe`n`n" +
        "Then launch Composer's Dungeon again.")
}

# --- First run: database + secret -------------------------------------------
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

$dbPath = Join-Path $DataDir "dungeon.db"
if (-not (Test-Path $dbPath)) {
    $seed = Join-Path $Root "seed\dungeon-seed.db"
    if (-not (Test-Path $seed)) { Show-Problem "This install looks damaged (the seed database is missing).`n`nReinstall Composer's Dungeon." }
    Copy-Item $seed $dbPath
}

$secretPath = Join-Path $DataDir "secret.txt"
if (-not (Test-Path $secretPath)) {
    # One random secret per installation — never a shipped default.
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    [Convert]::ToBase64String($bytes) | Set-Content -Path $secretPath -Encoding ASCII -NoNewline
    try { (Get-Item $secretPath).Attributes = "Hidden" } catch {}
}
$secret = (Get-Content $secretPath -Raw).Trim()

# --- Automatic update --------------------------------------------------------
# Runs before the server starts, so an update is applied to files nothing is
# holding open. Offline, feed down, or no new version: it exits quietly and the
# app starts as normal. -Relaunch is not passed - we continue into launch below.
if (-not $SkipUpdate) {
    $updater = Join-Path $PSScriptRoot "apply-update.ps1"
    if (Test-Path $updater) {
        try {
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $updater -Root $Root -Silent
        }
        catch {
            # An update must never be the reason the app won't open.
        }
    }
}

# --- Port -------------------------------------------------------------------
function Test-PortFree([int]$candidate) {
    try {
        $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
        $l.Start(); $l.Stop(); return $true
    }
    catch { return $false }
}

function Test-DungeonAlive([int]$candidate) {
    # Answers "is it up" and "is it ours" in one request.
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$candidate/manifest.webmanifest" -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -ne 200) { return $false }
        $body = if ($r.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($r.Content) } else { "$($r.Content)" }
        return $body -match "Composer"
    }
    catch { return $false }
}

if ($Port -eq 0) {
    $Port = 3000
    while ($Port -lt 3020 -and -not (Test-PortFree $Port)) {
        if (Test-DungeonAlive $Port) { break }
        $Port++
    }
    if ($Port -ge 3020) { Show-Problem "Every port from 3000 to 3019 is busy. Close some apps and try again." }
}
$url = "http://localhost:$Port"

# --- Server -----------------------------------------------------------------
$startedServer = $false
if (Test-PortFree $Port) {
    $log = Join-Path $DataDir "server.log"

    # Prisma wants forward slashes; loopback-only binding keeps Windows
    # Firewall from ever prompting.
    $env:DATABASE_URL = "file:" + ($dbPath -replace "\\", "/")
    Add-Content -Path (Join-Path $DataDir "server.log") -Value ("[launcher] DATABASE_URL=" + $env:DATABASE_URL) -ErrorAction SilentlyContinue
    $env:NEXTAUTH_SECRET = $secret
    $env:NEXTAUTH_URL = $url
    $env:HOSTNAME = "127.0.0.1"
    $env:PORT = "$Port"
    $env:NODE_ENV = "production"

    # Desktop-only capabilities (the in-app updater) key off these; a plain
    # `next start` never sets them, so the web build stays inert.
    $env:CD_DESKTOP = "1"
    $env:CD_ROOT = $Root
    $env:CD_VERSION = Get-InstalledVersion
    $configFile = Join-Path $PSScriptRoot "update-config.json"
    if (Test-Path $configFile) {
        try {
            $cfg = Get-Content $configFile -Raw | ConvertFrom-Json
            if ($cfg.feedUrl) { $env:CD_UPDATE_FEED = $cfg.feedUrl }
        }
        catch {}
    }

    $server = Start-Process -FilePath $NodeExe -ArgumentList @("`"$(Join-Path $AppDir 'server.js')`"") `
        -WorkingDirectory $AppDir -NoNewWindow -PassThru `
        -RedirectStandardOutput $log -RedirectStandardError "$log.err"
    $startedServer = $true
    # The installer reads this to stop a running copy before replacing files.
    Set-Content -Path (Join-Path $DataDir "server.pid") -Value $server.Id -Encoding ASCII

    $deadline = (Get-Date).AddSeconds(60)
    while (-not (Test-DungeonAlive $Port)) {
        if ($server.HasExited) { Show-Problem "Composer's Dungeon couldn't start.`n`nDetails are in:`n$log" }
        if ((Get-Date) -gt $deadline) {
            try { $server.Kill() } catch {}
            Show-Problem "Composer's Dungeon didn't start within a minute.`n`nDetails are in:`n$log"
        }
        Start-Sleep -Milliseconds 300
    }
}

if ($NoWindow) { Write-Host "Composer's Dungeon is running at $url"; return }

# --- App window -------------------------------------------------------------
function Find-Browser {
    foreach ($c in @(
            "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
            "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
            "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
            "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
            "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")) {
        if ($c -and (Test-Path $c)) { return $c }
    }
    return $null
}

$browser = Find-Browser
if ($browser) {
    # Its own profile keeps this a separately-closable window whose lifetime we
    # can follow — and keeps you signed in between launches.
    $window = Start-Process -FilePath $browser -PassThru -ArgumentList @(
        "--app=$url/hall",
        "--user-data-dir=`"$(Join-Path $DataDir 'window')`"",
        "--no-first-run",
        "--no-default-browser-check",
        "--window-size=1280,860"
    )
    if (-not $KeepRunning -and $startedServer) {
        $window.WaitForExit()
        Start-Sleep -Milliseconds 400
        try { if (-not $server.HasExited) { $server.Kill() } } catch {}
        Remove-Item (Join-Path $DataDir "server.pid") -ErrorAction SilentlyContinue
    }
}
else {
    Start-Process $url
    Write-Host "Composer's Dungeon is running at $url"
}
