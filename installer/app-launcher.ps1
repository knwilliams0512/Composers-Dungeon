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

<#
    The end of a log file, for putting inside the dialog.

    Naming a path and stopping there asks the person least able to debug this
    to go and find a file in a folder they have no reason to know about. The
    error is three lines long and they are looking straight at a dialog box;
    put it in the dialog.
#>
function Get-LogTail($path, [int]$lines = 14) {
    if (-not (Test-Path $path)) { return $null }
    try {
        $tail = Get-Content $path -Tail $lines -ErrorAction Stop |
            Where-Object { $_ -and $_.Trim() -ne "" }
        if (-not $tail) { return $null }
        # Long stack frames make the box unreadable; keep the message lines.
        return ($tail | ForEach-Object {
                if ($_.Length -gt 150) { $_.Substring(0, 150) + "..." } else { $_ }
            }) -join "`n"
    }
    catch { return $null }
}

<# Everything the app needs to be on disk before it is worth starting. #>
function Test-Install($root, $appDir) {
    $missing = @()
    foreach ($item in @(
            @{ path = (Join-Path $root "node.exe"); name = "the Node runtime (node.exe)" },
            @{ path = (Join-Path $appDir "server.js"); name = "the app server (app\server.js)" },
            @{ path = (Join-Path $appDir ".next"); name = "the built pages (app\.next)" },
            @{ path = (Join-Path $appDir "node_modules\.prisma\client"); name = "the database client" }
        )) {
        if (-not (Test-Path $item.path)) { $missing += $item.name }
    }
    # The database engine is a native library; antivirus quarantines it more
    # often than anything else here, and without it the server exits at once.
    $engine = Get-ChildItem -Path (Join-Path $appDir "node_modules\.prisma\client") `
        -Filter "query_engine-windows.dll.node" -ErrorAction SilentlyContinue
    if (-not $engine) { $missing += "the database engine (query_engine-windows.dll.node)" }
    elseif ($engine.Length -lt 1MB) { $missing += "the database engine (it is there but truncated)" }

    # Files in a OneDrive-synced folder can be placeholders: the name is on
    # disk and Test-Path says yes, but the bytes are still in the cloud. Node
    # cannot load a native library in that state, and the Desktop is synced by
    # default on a Windows 11 machine signed into a Microsoft account.
    foreach ($f in @((Join-Path $root "node.exe"), $engine.FullName)) {
        if (-not $f -or -not (Test-Path $f)) { continue }
        try {
            $attr = (Get-Item $f -Force -ErrorAction Stop).Attributes
            if ($attr -band [System.IO.FileAttributes]::Offline) {
                $missing += "$(Split-Path $f -Leaf) (OneDrive has not downloaded it yet)"
            }
        }
        catch {}
    }
    # Returned through @() at every call site: PowerShell unrolls an empty
    # array on return, and $null.Count is not something to rely on.
    return $missing
}

# An incomplete install is not a dead end. The app can fetch its own files:
# the update package carries exactly the app folder, so laying it down again
# restores whatever went missing. Antivirus quarantining the database engine
# is the usual reason, and telling someone to reinstall is a poor answer when
# the app is perfectly capable of doing it itself.
$damage = @(Test-Install $Root $AppDir)

# Before reaching for the network: an update that went wrong leaves the copy it
# replaced right here as app.previous. Putting that back is instant, works
# offline, and is the difference between "launch it again" and "download 15 MB
# or reinstall" for someone whose app just stopped opening.
if ($damage.Count -gt 0) {
    $previous = Join-Path $Root "app.previous"
    if ((Test-Path -LiteralPath $previous) -and
        (Test-Path -LiteralPath (Join-Path $previous ".next")) -and
        (Test-Path -LiteralPath (Join-Path $previous "server.js"))) {
        Add-Content -Path (Join-Path $DataDir "update.log") `
            -Value ("[{0}] install incomplete ({1}) - restoring app.previous" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), ($damage -join "; ")) `
            -ErrorAction SilentlyContinue
        try {
            $aside = "$AppDir.broken-$(Get-Date -Format 'yyyyMMddHHmmss')"
            if (Test-Path -LiteralPath $AppDir) { Move-Item -LiteralPath $AppDir -Destination $aside }
            Move-Item -LiteralPath $previous -Destination $AppDir
            Remove-Item -LiteralPath $aside -Recurse -Force -ErrorAction SilentlyContinue
            $damage = @(Test-Install $Root $AppDir)
            if ($damage.Count -eq 0) {
                # These files are whatever the last working version was, and
                # version.json may already have been rewritten to the newer
                # number. Claiming a version we are not running would mean the
                # updater sees nothing to do and the restored copy never moves
                # forward again, so record that we no longer know: 0.0.0 makes
                # the next launch fetch the current build.
                try {
                    [System.IO.File]::WriteAllText(
                        (Join-Path $Root "version.json"),
                        '{"version":"0.0.0"}',
                        (New-Object System.Text.UTF8Encoding($false)))
                }
                catch {}
                Add-Content -Path (Join-Path $DataDir "update.log") `
                    -Value ("[{0}] restored the previous version - it will update again next launch" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) `
                    -ErrorAction SilentlyContinue
            }
        }
        catch {
            Add-Content -Path (Join-Path $DataDir "update.log") `
                -Value ("[{0}] could not restore app.previous: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $_.Exception.Message) `
                -ErrorAction SilentlyContinue
        }
    }
}

if ($damage.Count -gt 0 -and -not $SkipUpdate) {
    $updater = Join-Path $PSScriptRoot "apply-update.ps1"
    if (Test-Path $updater) {
        Add-Content -Path (Join-Path $DataDir "update.log") `
            -Value ("[{0}] install incomplete ({1}) - repairing" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), ($damage -join "; ")) `
            -ErrorAction SilentlyContinue
        try {
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $updater -Root $Root -Silent -Repair
        }
        catch {
            # Offline, or the feed is down. The message below still stands.
        }
        $damage = @(Test-Install $Root $AppDir)
        if ($damage.Count -eq 0) {
            Add-Content -Path (Join-Path $DataDir "update.log") `
                -Value ("[{0}] repair succeeded" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) `
                -ErrorAction SilentlyContinue
        }
    }
}
if ($damage.Count -gt 0) {
    Show-Problem ("Composer's Dungeon is missing some of its own files:`n  - " +
        ($damage -join "`n  - ") +
        $(
            # The updater logs exactly why it could not fetch them. Quoting it
            # turns "could not" into something a person can act on.
            $whyRepairFailed = Get-LogTail (Join-Path $DataDir "update.log") 6
            if ($whyRepairFailed) { "`n`nThe app tried to download them again. What happened:`n$whyRepairFailed" }
            else { "`n`nThe app tried to download them again and could not." }
        ) +
        "`n`nSo it is either offline, or something on this PC is removing the files as fast" +
        " as they arrive. The usual cause is antivirus: allow the Composer's Dungeon folder" +
        " in its settings." +
        $(if ($Root -match "OneDrive" -or $Root -match "\\Desktop\\" -or $Root -match "\\Documents\\") {
            "`n`nThis copy is installed under a folder Windows may be syncing to OneDrive," +
            " which can leave large files in the cloud rather than on the disk." +
            " Installing to a plain folder such as C:\Users\$env:USERNAME\ComposersDungeon" +
            " avoids that."
        } else { "" }) +
        "`n`nReinstall from ComposersDungeonSetup.exe - your compositions, levels and" +
        " streaks live in the data folder and are not touched by installing over the top.")
}

# The database engine is a native DLL that needs the Microsoft Visual C++
# runtime. Nearly every PC has it (games install it constantly), but on a
# clean machine its absence surfaces as a cryptic server error — catch it
# here with an actionable message instead.
# vcruntime140.dll alone was not enough to check: the engine also links
# vcruntime140_1.dll (added in VS2019) and msvcp140.dll, and a PC can easily
# have the first without the other two. Missing either, the engine fails to
# load and the server exits before it prints anything useful.
$vcParts = @("vcruntime140.dll", "vcruntime140_1.dll", "msvcp140.dll")
# The app ships its own copies beside node.exe, and Windows searches the
# running executable's own directory first, so those are what actually get
# loaded. Only a PC missing them BOTH locally and in System32 has a problem -
# and since 1.11.4 that should not happen, because the installer and the
# update both lay them down.
$vcMissing = @($vcParts | Where-Object {
        -not (Test-Path (Join-Path $Root $_)) -and
        -not (Test-Path (Join-Path $env:SystemRoot "System32\$_"))
    })
if ($vcMissing.Count -gt 0) {
    # The app carries these itself, so reaching here means its own copies are
    # gone too - and the update can put them back.
    $runtimeRepaired = $false
    if (-not $SkipUpdate) {
        $updater = Join-Path $PSScriptRoot "apply-update.ps1"
        if (Test-Path $updater) {
            try {
                & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $updater -Root $Root -Silent -Repair
            }
            catch {}
            $vcMissing = @($vcParts | Where-Object {
                    -not (Test-Path (Join-Path $Root $_)) -and
                    -not (Test-Path (Join-Path $env:SystemRoot "System32\$_"))
                })
            $runtimeRepaired = $vcMissing.Count -eq 0
        }
    }
    if (-not $runtimeRepaired) {
        Show-Problem ("Composer's Dungeon needs these Microsoft runtime libraries, and they are" +
            " neither in its own folder nor on this PC:`n  - " + ($vcMissing -join "`n  - ") +
            "`n`nThe app normally ships its own copies, so something is removing them -" +
            " usually antivirus. Allowing the Composer's Dungeon folder in its settings fixes it." +
            "`n`nFailing that, installing the Microsoft Visual C++ Runtime puts them on the PC" +
            " for good:`nhttps://aka.ms/vs/17/release/vc_redist.x64.exe")
    }
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

# Two launches at once - a double-click on the shortcut, or the desktop and the
# Start menu in quick succession - used to race here: both would find the port
# free, both would start a server, and the two of them would be writing to the
# same SQLite file. Hold a mutex across the probe-and-start so the second one
# arrives after the first server exists and simply uses it.
$startupLock = $null
try {
    $startupLock = New-Object System.Threading.Mutex($false, "Local\ComposersDungeonLauncher")
    $null = $startupLock.WaitOne(60000)
}
catch { $startupLock = $null }

if ($Port -eq 0) {
    $Port = 3000
    while ($Port -lt 3020 -and -not (Test-PortFree $Port)) {
        if (Test-DungeonAlive $Port) { break }
        $Port++
    }
    if ($Port -ge 3020) {
        if ($startupLock) { try { $startupLock.ReleaseMutex() } catch {} }
        Show-Problem "Every port from 3000 to 3019 is busy. Close some apps and try again."
    }
}
$url = "http://localhost:$Port"

# --- Repair the database before serving from it ------------------------------
# Every launch, not just after an update. The update path is the one that broke
# people - it failed on a database missing columns nobody had written a
# migration for, rolled the app back, and left them opening onto an error page
# with no route to a fix. Doing the schema check here means the app repairs
# itself on the way in whatever state it was left in, and it is cheap: on a
# database that is already current it only reads.
if (Test-PortFree $Port) {
    $upgradeScript = Join-Path $AppDir "upgrade.js"
    if ((Test-Path $upgradeScript) -and (Test-Path $NodeExe)) {
        try {
            $repair = & $NodeExe $upgradeScript $Root --schema-only 2>&1
            if ($repair) {
                Add-Content -Path (Join-Path $DataDir "update.log") `
                    -Value ("[{0}] startup schema check: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), ($repair -join "; ")) `
                    -ErrorAction SilentlyContinue
            }
        }
        catch {
            # Never the reason the app will not open.
        }
    }
}

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

    try {
        $server = Start-Process -FilePath $NodeExe -ArgumentList @("`"$(Join-Path $AppDir 'server.js')`"") `
            -WorkingDirectory $AppDir -NoNewWindow -PassThru `
            -RedirectStandardOutput $log -RedirectStandardError "$log.err"
    }
    catch {
        Show-Problem ("Composer's Dungeon could not run its own server.`n`n" +
            "Windows said:`n$($_.Exception.Message)`n`n" +
            "This usually means antivirus is blocking node.exe, or the app folder is" +
            " somewhere Windows will not run programs from. Try installing to a plain" +
            " folder such as C:\Users\$env:USERNAME\ComposersDungeon.")
    }
    $startedServer = $true
    # The installer reads this to stop a running copy before replacing files.
    Set-Content -Path (Join-Path $DataDir "server.pid") -Value $server.Id -Encoding ASCII

    $deadline = (Get-Date).AddSeconds(60)
    while (-not (Test-DungeonAlive $Port)) {
        if ($server.HasExited) {
            $why = Get-LogTail "$log.err"
            if (-not $why) { $why = Get-LogTail $log }
            $missing = @(Test-Install $Root $AppDir)
            $detail = if ($missing.Count -gt 0) {
                "This install is missing:`n  - " + ($missing -join "`n  - ") +
                "`n`nThat usually means antivirus removed a file, or the install did not finish." +
                "`nReinstalling from ComposersDungeonSetup.exe will replace them. Your work is kept."
            }
            elseif ($why) { "What went wrong:`n`n$why" }
            else { "Details are in:`n$log" }
            # Open the log as well as quoting it. When the app is dead this is
            # the only thing the person can act on, and asking them to find a
            # file inside a folder they have never opened is how three rounds
            # of this went by without anyone seeing the actual error.
            try {
                $toOpen = if (Test-Path "$log.err") { "$log.err" } else { $log }
                if (Test-Path $toOpen) { Start-Process notepad.exe $toOpen -ErrorAction SilentlyContinue }
            }
            catch {}
            Show-Problem ("Composer's Dungeon couldn't start.`n`n" + $detail +
                "`n`nThe full log has been opened in Notepad, and is at:`n$log.err")
        }
        if ((Get-Date) -gt $deadline) {
            try { $server.Kill() } catch {}
            $why = Get-LogTail "$log.err"
            if (-not $why) { $why = Get-LogTail $log }
            Show-Problem ("Composer's Dungeon didn't start within a minute.`n`n" +
                $(if ($why) { "What went wrong:`n`n$why" } else { "Details are in:`n$log" }) +
                "`n`nFull log: $log.err")
        }
        Start-Sleep -Milliseconds 300
    }
}
if ($startupLock) { try { $startupLock.ReleaseMutex() } catch {} }

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

$profileDir = Join-Path $DataDir "window"

# Whatever happened last time, this profile exited cleanly.
#
# Edge and Chrome record how the browser last exited. Anything they consider a
# crash - the app window closed while the server was being replaced by an
# update, the PC shut down with it open, a page that failed to render - makes
# the next start restore the previous session, so it reopens the windows that
# were up before ON TOP OF the one being asked for here. Do that a few times
# and the app opens to a fistful of windows. Nothing here needs restoring: the
# app always opens at the hall.
function Reset-BrowserSession {
    foreach ($prefs in @(
            (Join-Path $profileDir "Default\Preferences"),
            (Join-Path $profileDir "Preferences"))) {
        if (-not (Test-Path $prefs)) { continue }
        try {
            $raw = Get-Content $prefs -Raw -ErrorAction Stop
            $clean = $raw `
                -replace '"exit_type"\s*:\s*"[^"]*"', '"exit_type":"Normal"' `
                -replace '"exited_cleanly"\s*:\s*(true|false)', '"exited_cleanly":true'
            if ($clean -ne $raw) {
                # Not Set-Content -Encoding UTF8: Windows PowerShell writes a
                # BOM, and Chrome discards a Preferences file it cannot parse -
                # which would wipe the profile this is trying to preserve.
                [System.IO.File]::WriteAllText($prefs, $clean, (New-Object System.Text.UTF8Encoding($false)))
            }
        }
        catch {
            # A profile we cannot rewrite is not a reason to refuse to open.
        }
    }
}
Reset-BrowserSession

$browser = Find-Browser
if ($browser) {
    # Its own profile keeps this a separately-closable window whose lifetime we
    # can follow — and keeps you signed in between launches.
    $window = Start-Process -FilePath $browser -PassThru -ArgumentList @(
        "--app=$url/hall",
        "--user-data-dir=`"$profileDir`"",
        "--no-first-run",
        "--autoplay-policy=no-user-gesture-required",
        "--no-default-browser-check",
        # Never offer to restore a previous session, and never show the
        # "didn't shut down correctly" bar inside an app window.
        "--disable-session-crashed-bubble",
        "--hide-crash-restore-bubble",
        "--window-size=1280,860"
    )
    if (-not $KeepRunning -and $startedServer) {
        $window.WaitForExit()
        Start-Sleep -Milliseconds 400

        # Only the launcher that started the server stops it — but if a second
        # window is still open against the same server, closing the first one
        # must not pull the floor out from under it. That is what produced an
        # error page in a window the player had not touched.
        $stillOpen = $false
        try {
            $stillOpen = @(Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" -ErrorAction Stop |
                Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profileDir) -and $_.CommandLine.Contains("--app=") }).Count -gt 0
        }
        catch { $stillOpen = $false }

        if (-not $stillOpen) {
            try { if (-not $server.HasExited) { $server.Kill() } } catch {}
            Remove-Item (Join-Path $DataDir "server.pid") -ErrorAction SilentlyContinue
        }
    }
}
else {
    Start-Process $url
    Write-Host "Composer's Dungeon is running at $url"
}
