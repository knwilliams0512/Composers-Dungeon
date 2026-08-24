<#
.SYNOPSIS
    Launches Composer's Dungeon as a desktop app on Windows.

.DESCRIPTION
    Starts the local production server on the first free port from 3000 up,
    waits for it to answer, then opens it in a chromeless Edge/Chrome app
    window. Closing that window stops the server, so the app behaves like any
    other desktop program.

    Self-healing: if dependencies or the build are missing, it runs the
    installer first.

.PARAMETER KeepRunning
    Leave the server running after the app window closes.

.PARAMETER Port
    Force a specific port instead of auto-selecting.

.PARAMETER NoWindow
    Start the server only; don't open a browser window.
#>
[CmdletBinding()]
param(
    [int]$Port = 0,
    [switch]$KeepRunning,
    [switch]$NoWindow
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

function Show-Problem($message) {
    Write-Host $message -ForegroundColor Red
    $null = (New-Object -ComObject WScript.Shell).Popup(
        $message, 0, "Composer's Dungeon", 16)
    exit 1
}

# --- Make sure the app is actually built ------------------------------------
if (-not (Test-Path (Join-Path $Root "node_modules")) -or
    -not (Test-Path (Join-Path $Root ".next")) -or
    -not (Test-Path (Join-Path $Root ".env"))) {
    Write-Host "First run detected - setting up Composer's Dungeon..." -ForegroundColor Yellow
    & powershell.exe -NoProfile -ExecutionPolicy Bypass `
        -File (Join-Path $PSScriptRoot "install.ps1") -InstallDir $Root -NoLaunch
    if ($LASTEXITCODE -ne 0) { Show-Problem "Setup failed. Run scripts\windows\install.ps1 in a PowerShell window to see why." }
}

# --- Port selection ----------------------------------------------------------
function Test-PortFree([int]$candidate) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
        $listener.Start()
        $listener.Stop()
        return $true
    }
    catch { return $false }
}

function Test-DungeonAlive([int]$candidate) {
    # Asking for the manifest answers both questions at once: is the server up,
    # and is it *ours*? (Some other dev server on 3000 must not be adopted.)
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$candidate/manifest.webmanifest" `
            -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -ne 200) { return $false }
        $body = if ($r.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($r.Content) } else { "$($r.Content)" }
        return $body -match "Composer"
    }
    catch { return $false }
}

$startedServer = $false
if ($Port -eq 0) {
    $Port = 3000
    while ($Port -lt 3020 -and -not (Test-PortFree $Port)) {
        if (Test-DungeonAlive $Port) { break }   # our own instance, reuse it
        $Port++
    }
    if ($Port -ge 3020) { Show-Problem "No free port between 3000 and 3019. Close some apps and try again." }
}

$url = "http://localhost:$Port"

# --- Start the server --------------------------------------------------------
$portFree = Test-PortFree $Port
if (-not $portFree -and -not (Test-DungeonAlive $Port)) {
    Show-Problem "Port $Port is already in use by another program.`n`nClose it, or launch with:  npm run win:start -- -Port 3005"
}

if ($portFree) {
    $logDir = Join-Path $Root "logs"
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $log = Join-Path $logDir "server.log"

    # Process env wins over .env, so the auth URL always matches the real port.
    $env:NEXTAUTH_URL = $url
    $env:PORT = "$Port"
    $env:NODE_ENV = "production"

    $next = Join-Path $Root "node_modules\next\dist\bin\next"
    # -NoNewWindow (rather than -WindowStyle Hidden) is the combination that
    # reliably pairs with output redirection on both PowerShell 5.1 and 7.
    $server = Start-Process -FilePath "node.exe" `
        -ArgumentList @("`"$next`"", "start", "-p", "$Port") `
        -WorkingDirectory $Root -NoNewWindow -PassThru `
        -RedirectStandardOutput $log -RedirectStandardError "$log.err"
    $startedServer = $true

    $deadline = (Get-Date).AddSeconds(90)
    while (-not (Test-DungeonAlive $Port)) {
        if ($server.HasExited) {
            Show-Problem "The Composer's Dungeon server stopped unexpectedly.`n`nSee $log for details."
        }
        if ((Get-Date) -gt $deadline) {
            try { $server.Kill() } catch {}
            Show-Problem "The server didn't start within 90 seconds.`n`nSee $log for details."
        }
        Start-Sleep -Milliseconds 400
    }
}

if ($NoWindow) {
    Write-Host "Composer's Dungeon is running at $url" -ForegroundColor Green
    return
}

# --- Open the app window -----------------------------------------------------
function Find-Browser {
    $candidates = @(
        "$env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    foreach ($c in $candidates) { if ($c -and (Test-Path $c)) { return $c } }
    return $null
}

$browser = Find-Browser
if ($browser) {
    # A dedicated profile keeps this a real, separately-closable app window
    # (and keeps you logged in between launches).
    $profileDir = Join-Path $Root ".app-profile"
    $window = Start-Process -FilePath $browser -PassThru -ArgumentList @(
        "--app=$url/hall",
        "--user-data-dir=`"$profileDir`"",
        "--no-first-run",
        "--autoplay-policy=no-user-gesture-required",
        "--no-default-browser-check",
        "--window-size=1280,860"
    )
    if (-not $KeepRunning -and $startedServer) {
        $window.WaitForExit()
        Start-Sleep -Milliseconds 500
        try { if (-not $server.HasExited) { $server.Kill() } } catch {}
    }
}
else {
    # No Edge or Chrome: fall back to the default browser in a normal tab. The
    # server is left running, since there's no app window whose lifetime we
    # could tie it to.
    Start-Process $url
    Write-Host "Composer's Dungeon is running at $url" -ForegroundColor Green
    Write-Host "Stop it with: scripts\windows\stop.ps1" -ForegroundColor DarkGray
}
