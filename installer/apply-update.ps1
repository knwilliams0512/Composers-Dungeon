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
    [switch]$CheckOnly,
    # Fetch and lay down the current version's files even though the version
    # number says there is nothing to do. Used when the launcher finds the
    # install itself is incomplete - antivirus quarantining the database
    # engine, or an install that did not finish - where "already up to date"
    # is true and useless.
    [switch]$Repair
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

<#
    Is an app directory actually usable?

    The updater used to check one file - server.js - before moving the live
    install aside. Everything else it trusted. So an extraction that dropped
    files, or a rollback that half-deleted the directory, still ended with the
    new app in place and the app unable to start, which is not what "your
    existing copy is untouched" promises.

    This is the same list the launcher checks at startup, so "the updater was
    happy" and "the launcher is happy" cannot disagree.
#>
function Test-AppComplete($appDir) {
    $missing = @()
    foreach ($item in @(
            @{ path = "server.js"; name = "the app server (server.js)" },
            @{ path = ".next\BUILD_ID"; name = "the build id (.next\BUILD_ID)" },
            @{ path = ".next\server"; name = "the built pages (.next\server)" },
            @{ path = ".next\static"; name = "the built assets (.next\static)" },
            @{ path = "node_modules\.prisma\client"; name = "the database client" }
        )) {
        # -LiteralPath throughout: built route folders are named things like
        # [roomId], and PowerShell reads square brackets in a -Path as a
        # wildcard character class, so a real directory tests as absent.
        if (-not (Test-Path -LiteralPath (Join-Path $appDir $item.path))) { $missing += $item.name }
    }
    $engine = Get-ChildItem -LiteralPath (Join-Path $appDir "node_modules\.prisma\client") `
        -Filter "query_engine-windows.dll.node" -ErrorAction SilentlyContinue
    if (-not $engine) { $missing += "the database engine" }
    elseif ($engine.Length -lt 1MB) { $missing += "the database engine (truncated)" }
    return $missing
}

<#
    Unpack the package ourselves rather than through Expand-Archive.

    Expand-Archive gives no account of what it did: a short extraction and a
    complete one look the same from the outside. Walking the entries means the
    file count can be compared against the archive, and every path is handled
    literally.
#>
function Expand-Package($zipPath, $destination) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $expected = 0
        $written = 0
        foreach ($entry in $archive.Entries) {
            # A directory entry has an empty Name; only files are counted.
            if ([string]::IsNullOrEmpty($entry.Name)) { continue }
            $expected++
            $target = Join-Path $destination ($entry.FullName -replace "/", "\")
            $parent = Split-Path $target -Parent
            if (-not (Test-Path -LiteralPath $parent)) {
                New-Item -ItemType Directory -Force -Path $parent | Out-Null
            }
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
            if (Test-Path -LiteralPath $target) { $written++ }
        }
        return @{ Expected = $expected; Written = $written }
    }
    finally { $archive.Dispose() }
}

<#
    Put the previous app back, by renaming only.

    The rollback this replaces did "Remove-Item $AppDir -Recurse -Force
    -ErrorAction SilentlyContinue" and then moved the backup over. When that
    delete only partly succeeded - a file held open by antivirus or by a
    process that had not finished exiting - the errors were swallowed, the
    destination still existed, and the move could not land. What was left was
    an app directory with its locked files still in it and everything
    deletable gone: node_modules present, .next missing, nothing that runs.

    Renaming cannot half-happen. The broken copy is moved aside first, the
    known-good one is moved back, and only then is the broken copy deleted -
    and if that delete fails it costs disk space, not the install.
#>
function Restore-Previous($backup, $appDir) {
    if (-not (Test-Path -LiteralPath $backup)) {
        Write-Log "nothing to roll back to - the previous app is not on disk"
        return $false
    }
    $discard = "$appDir.broken-$(Get-Date -Format 'yyyyMMddHHmmss')"
    try {
        if (Test-Path -LiteralPath $appDir) {
            Move-Item -LiteralPath $appDir -Destination $discard
        }
        Move-Item -LiteralPath $backup -Destination $appDir
    }
    catch {
        Write-Log "rollback failed: $($_.Exception.Message)"
        return $false
    }
    Remove-Item -LiteralPath $discard -Recurse -Force -ErrorAction SilentlyContinue
    $still = @(Test-AppComplete $appDir)
    if ($still.Count -gt 0) {
        Write-Log ("rolled back, but the restored app is itself incomplete: {0}" -f ($still -join "; "))
        return $false
    }
    Write-Log "previous app restored"
    return $true
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

if ($Repair) {
    Write-Log "repair requested - reinstalling $($manifest.version) over the current files"
}
elseif ((Compare-Version $manifest.version $current) -le 0) {
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

# Three tries: a home connection drops a 15 MB transfer often enough that one
# failure is not an answer, and the alternative the person is offered is
# reinstalling the whole app.
$downloadError = $null
for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        Invoke-WebRequest -Uri $manifest.url -OutFile $zip -UseBasicParsing -TimeoutSec 600
        $downloadError = $null
        break
    }
    catch {
        $downloadError = $_.Exception.Message
        Write-Log "download attempt $attempt failed: $downloadError"
        Start-Sleep -Seconds (2 * $attempt)
    }
}
if ($downloadError) {
    Fail "The download didn't finish after three tries. $downloadError"
}

$hash = (Get-FileHash -Path $zip -Algorithm SHA256).Hash
if ($hash -ne $manifest.sha256.ToUpper()) {
    Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
    Fail "The download didn't match its published checksum, so it was discarded."
}
Write-Log "checksum verified"

$unpacked = Join-Path $staging "unpacked"
try {
    $counts = Expand-Package $zip $unpacked
    Write-Log ("unpacked {0} of {1} files" -f $counts.Written, $counts.Expected)
    if ($counts.Written -lt $counts.Expected) {
        Fail ("Only {0} of the package's {1} files could be written. Something on this PC is removing them as they arrive - usually antivirus." -f $counts.Written, $counts.Expected)
    }
}
catch {
    Fail "The update package couldn't be unpacked. $($_.Exception.Message)"
}

# Nothing has been touched yet, and nothing will be until the new copy is
# known to be complete. An update that cannot produce a working app must leave
# the working app alone - that is the whole promise of the dialog above.
$newApp = Join-Path $unpacked "app"
$packageMissing = @(Test-AppComplete $newApp)
if ($packageMissing.Count -gt 0) {
    Fail ("The downloaded update is incomplete, so it was not installed:`n  - " +
        ($packageMissing -join "`n  - "))
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
    if (Test-Path -LiteralPath $AppDir) { Move-Item -LiteralPath $AppDir -Destination $backup }
    Move-Item -LiteralPath $newApp -Destination $AppDir
}
catch {
    # Put the old app back rather than leaving a half-updated install.
    if (-not (Test-Path -LiteralPath $AppDir) -and (Test-Path -LiteralPath $backup)) {
        Move-Item -LiteralPath $backup -Destination $AppDir
    }
    Fail "The new files couldn't be put in place (something may still be running)."
}

# The swap is renames, so this should never fire - but "should never" is how
# the install this replaced ended up with its pages gone. Check what is
# actually on disk, and undo by renaming rather than by deleting.
$landedMissing = @(Test-AppComplete $AppDir)
if ($landedMissing.Count -gt 0) {
    Write-Log ("new app incomplete after swap ({0}) - restoring the previous one" -f ($landedMissing -join "; "))
    Restore-Previous $backup $AppDir
    Fail ("The new files did not survive being put in place:`n  - " + ($landedMissing -join "`n  - "))
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
# The Visual C++ runtime goes beside node.exe at the install root. Carried by
# the update as well as the installer, so a PC missing it is fixed by launching
# rather than by downloading a Microsoft redistributable.
$newRuntime = Join-Path $staging "unpacked\runtime"
if (Test-Path $newRuntime) {
    Copy-Item (Join-Path $newRuntime "*") $Root -Force -ErrorAction SilentlyContinue
    Write-Log "runtime libraries refreshed"
}

# --- Migrate + re-seed -------------------------------------------------------
Write-Log "running database upgrade"
$upgrade = Join-Path $AppDir "upgrade.js"
$dbFile = Join-Path $DataDir "dungeon.db"

# The rollback below used to put the old app back and leave the database as the
# failed upgrade had left it - which is worse than either version on its own,
# because the seed writes as it goes and stops wherever it broke. A player was
# then on the old app with a part-rewritten database, every launch retried the
# same failing update, and the app opened onto its own error page. Take a copy
# first so "rolled back" means the whole install, data included.
$dbBackup = Join-Path $DataDir "dungeon.db.preupdate"
if (Test-Path $dbFile) {
    try {
        Copy-Item $dbFile $dbBackup -Force
        Write-Log "database backed up before upgrade"
    }
    catch { Write-Log "could not back up the database: $_" }
}

if ((Test-Path $upgrade) -and (Test-Path $NodeExe)) {
    $out = & $NodeExe $upgrade $Root 2>&1
    Write-Log ($out -join "`n")
    if ($LASTEXITCODE -ne 0) {
        Write-Log "upgrade script failed - rolling back"
        Restore-Previous $backup $AppDir
        if (Test-Path $dbBackup) {
            try {
                Copy-Item $dbBackup $dbFile -Force
                Write-Log "database restored"
            }
            catch { Write-Log "could not restore the database: $_" }
        }
        Fail "The database upgrade failed, so the previous version was restored."
    }
}
Remove-Item $dbBackup -Force -ErrorAction SilentlyContinue

# --- Finish ------------------------------------------------------------------
# Written without a BOM: Windows PowerShell's -Encoding UTF8 adds one, and any
# JSON parser that is not PowerShell's chokes on it.
[System.IO.File]::WriteAllText(
    $versionFile,
    (@{ version = $manifest.version } | ConvertTo-Json),
    (New-Object System.Text.UTF8Encoding($false)))
Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $backup -Recurse -Force -ErrorAction SilentlyContinue
Write-Log ("updated to " + $manifest.version)

if ($Relaunch) {
    Start-Process "wscript.exe" -ArgumentList "`"$(Join-Path $Root 'launch\launch.vbs')`""
}
