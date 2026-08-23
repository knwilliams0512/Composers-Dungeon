<#
    Composer's Dungeon — in-place updater.

    Replaces the installed app with a newer build without reinstalling and
    without touching the player's data. Runs detached from the app, because
    stopping the app is the first thing it does.

    Steps:
      1. read the update feed and compare versions
      2. download the update package and verify its SHA-256 against the feed
      3. stop the running server
      4. swap app\ for the new one, keeping the old copy until we're sure
      5. run upgrade.js: apply pending migrations, then re-seed new content
      6. relaunch (when -Relaunch was passed)

    Nothing is replaced until the hash matches. If any step fails, the previous
    app directory is put back, so a failed update leaves a working install.

    Parameters:
      -Root      install directory (default: this script's parent's parent)
      -Silent    no dialogs; used by the launcher's automatic check
      -Relaunch  start the app again when finished
      -CheckOnly print the available version and exit
#>
[CmdletBinding()]
param(
    [string]$Root,
    [switch]$Silent,
    [switch]$Relaunch,
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
$AppDir = Join-Path $Root "app"
$DataDir = Join-Path $Root "data"
$NodeExe = Join-Path $Root "node.exe"
$LogPath = Join-Path $DataDir "update.log"

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

function Write-Log($message) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $message
    Add-Content -Path $LogPath -Value $line -ErrorAction SilentlyContinue
    Write-Host $line
}

function Fail($message) {
    Write-Log "FAILED: $message"
    if (-not $Silent) {
        $null = (New-Object -ComObject WScript.Shell).Popup(
            "The update could not be installed.`n`n$message`n`nYour existing copy is untouched - just launch it again.",
            0, "Composer's Dungeon", 16)
    }
    exit 1
}

# --- Current version ---------------------------------------------------------
$versionFile = Join-Path $Root "version.json"
$current = "0.0.0"
if (Test-Path $versionFile) {
    try { $current = (Get-Content $versionFile -Raw | ConvertFrom-Json).version } catch {}
}

$feed = "https://github.com/knwilliams0512/Composer-s-Dungeon/releases/latest/download/latest.json"
$configFile = Join-Path $Root "launch\update-config.json"
if (Test-Path $configFile) {
    try {
        $cfg = Get-Content $configFile -Raw | ConvertFrom-Json
        if ($cfg.feedUrl) { $feed = $cfg.feedUrl }
        if ($cfg.enabled -eq $false -and $Silent) { Write-Log "auto-update disabled"; exit 0 }
    }
    catch {}
}

function Compare-Version($a, $b) {
    try {
        $va = [Version]($a -replace '^v', '')
        $vb = [Version]($b -replace '^v', '')
        return $va.CompareTo($vb)
    }
    catch { return 0 }
}

# --- Feed --------------------------------------------------------------------
Write-Log "checking $feed (installed $current)"
try {
    $manifest = Invoke-RestMethod -Uri $feed -TimeoutSec 12 -Headers @{ Accept = "application/json" }
}
catch {
    if ($Silent) { Write-Log "feed unreachable - continuing offline"; exit 0 }
    Fail "Couldn't reach the update server. Check your internet connection."
}

if (-not $manifest.version -or -not $manifest.url -or -not $manifest.sha256) {
    if ($Silent) { Write-Log "malformed feed - ignoring"; exit 0 }
    Fail "The update server returned something unexpected."
}
if ($manifest.url -notmatch '^https://') {
    Fail "The update package must be served over HTTPS."
}

if ((Compare-Version $manifest.version $current) -le 0) {
    Write-Log "already up to date"
    if ($CheckOnly) { Write-Output "uptodate $current" }
    exit 0
}
if ($CheckOnly) { Write-Output ("available " + $manifest.version); exit 0 }

Write-Log ("update available: {0} -> {1}" -f $current, $manifest.version)

# --- Download and verify -----------------------------------------------------
$staging = Join-Path $Root "update-staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path $staging | Out-Null
$zip = Join-Path $staging "update.zip"

try {
    Invoke-WebRequest -Uri $manifest.url -OutFile $zip -UseBasicParsing -TimeoutSec 600
}
catch {
    Fail "The download didn't finish. $($_.Exception.Message)"
}

$hash = (Get-FileHash -Path $zip -Algorithm SHA256).Hash
if ($hash -ne $manifest.sha256.ToUpper()) {
    Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
    Fail "The download didn't match its published checksum, so it was discarded."
}
Write-Log "checksum verified"

try {
    Expand-Archive -Path $zip -DestinationPath (Join-Path $staging "unpacked") -Force
}
catch {
    Fail "The update package couldn't be unpacked."
}

$newApp = Join-Path $staging "unpacked\app"
if (-not (Test-Path (Join-Path $newApp "server.js"))) {
    Fail "The update package was missing the application."
}

# --- Stop the running app ----------------------------------------------------
$pidFile = Join-Path $DataDir "server.pid"
if (Test-Path $pidFile) {
    $serverPid = (Get-Content $pidFile -Raw).Trim()
    if ($serverPid) {
        Write-Log "stopping server pid $serverPid"
        Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
}
Start-Sleep -Milliseconds 900

# --- Swap --------------------------------------------------------------------
$backup = Join-Path $Root "app.previous"
if (Test-Path $backup) { Remove-Item $backup -Recurse -Force -ErrorAction SilentlyContinue }

try {
    if (Test-Path $AppDir) { Move-Item $AppDir $backup }
    Move-Item $newApp $AppDir
}
catch {
    # Put the old app back rather than leaving a half-updated install.
    if (-not (Test-Path $AppDir) -and (Test-Path $backup)) { Move-Item $backup $AppDir }
    Fail "The new files couldn't be put in place (something may still be running)."
}

# The launcher scripts travel with the update too, when the package carries them.
$newLaunch = Join-Path $staging "unpacked\launch"
if (Test-Path $newLaunch) {
    Copy-Item (Join-Path $newLaunch "*") (Join-Path $Root "launch") -Recurse -Force -ErrorAction SilentlyContinue
}
$newSeed = Join-Path $staging "unpacked\seed"
if (Test-Path $newSeed) {
    Copy-Item (Join-Path $newSeed "*") (Join-Path $Root "seed") -Recurse -Force -ErrorAction SilentlyContinue
}

# --- Migrate + re-seed -------------------------------------------------------
Write-Log "running database upgrade"
$upgrade = Join-Path $AppDir "upgrade.js"
if ((Test-Path $upgrade) -and (Test-Path $NodeExe)) {
    $out = & $NodeExe $upgrade $Root 2>&1
    Write-Log ($out -join "`n")
    if ($LASTEXITCODE -ne 0) {
        Write-Log "upgrade script failed - rolling back"
        Remove-Item $AppDir -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path $backup) { Move-Item $backup $AppDir }
        Fail "The database upgrade failed, so the previous version was restored."
    }
}

# --- Finish ------------------------------------------------------------------
@{ version = $manifest.version } | ConvertTo-Json | Set-Content -Path $versionFile -Encoding UTF8
Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $backup -Recurse -Force -ErrorAction SilentlyContinue
Write-Log ("updated to " + $manifest.version)

if ($Relaunch) {
    Start-Process "wscript.exe" -ArgumentList "`"$(Join-Path $Root 'launch\launch.vbs')`""
}
