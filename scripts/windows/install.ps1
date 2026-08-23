<#
.SYNOPSIS
    One-shot Windows installer for Composer's Dungeon.

.DESCRIPTION
    Installs prerequisites (Git + Node.js LTS via winget), fetches the code,
    creates a .env with a real generated secret, installs dependencies, builds
    the database and production bundle, then creates Desktop and Start-menu
    shortcuts that launch the app in its own window.

    Run it straight from GitHub:

        irm https://raw.githubusercontent.com/knwilliams0512/composer-s-dungeon/claude/composers-dungeon-fullstack-8aire4/scripts/windows/install.ps1 | iex

    ...or, from a downloaded copy, double-click "Install Composers Dungeon.bat".

.PARAMETER InstallDir
    Where to install. Defaults to %LOCALAPPDATA%\ComposersDungeon, or the
    existing checkout when this script is run from inside one.

.PARAMETER Branch
    Branch to install. Defaults to the app's release branch.

.PARAMETER NoLaunch
    Finish without starting the app.
#>
[CmdletBinding()]
param(
    [string]$InstallDir,
    [string]$Repo = "https://github.com/knwilliams0512/composer-s-dungeon.git",
    [string]$Branch = "claude/composers-dungeon-fullstack-8aire4",
    [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Yellow }
function Write-Ok($text) { Write-Host "    $text" -ForegroundColor DarkGray }
function Write-Fail($text) { Write-Host "`n!!  $text" -ForegroundColor Red }

function Stop-Install {
    param([string]$Message, [string]$Hint)
    Write-Fail $Message
    if ($Hint) { Write-Host "    $Hint" -ForegroundColor Red }
    # Piped from the web (irm | iex): exiting would close the user's console
    # before they can read any of this.
    if (-not $PSScriptRoot) { Read-Host "`nPress Enter to close" | Out-Null }
    exit 1
}

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Sync-Path {
    # winget-installed tools land in PATH only for *new* shells; refresh ours.
    $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = ($machine, $user | Where-Object { $_ }) -join ";"
}

function Install-Dependency($command, $wingetId, $friendly, $downloadUrl) {
    if (Test-Command $command) {
        Write-Ok "$friendly found."
        return
    }
    if (-not (Test-Command "winget")) {
        Stop-Install "$friendly is not installed, and winget isn't available to install it." `
            "Install it from $downloadUrl and run this script again."
    }
    Write-Ok "$friendly not found - installing with winget (this can take a few minutes)..."
    winget install --id $wingetId --source winget --accept-package-agreements --accept-source-agreements --silent 2>&1 | Out-Null
    Sync-Path
    if (-not (Test-Command $command)) {
        Stop-Install "$friendly still isn't on PATH." `
            "Close this window, open a new PowerShell, and run the installer again."
    }
    Write-Ok "$friendly installed."
}

function Invoke-Tool($file, [string[]]$toolArgs, $what) {
    & $file @toolArgs
    if ($LASTEXITCODE -ne 0) {
        Stop-Install "$what failed (exit code $LASTEXITCODE)." `
            "Scroll up for the underlying error."
    }
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor DarkYellow
Write-Host "        C O M P O S E R ' S   D U N G E O N   " -ForegroundColor Yellow
Write-Host "            Windows installer                 " -ForegroundColor DarkYellow
Write-Host "  ============================================" -ForegroundColor DarkYellow

# --- 0. Where does this live? ------------------------------------------------
# Running from inside a checkout (…\scripts\windows\install.ps1) installs in
# place; running piped from the web installs to LOCALAPPDATA.
if (-not $InstallDir) {
    if ($PSScriptRoot) {
        $candidate = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
        if (Test-Path (Join-Path $candidate "prisma\schema.prisma")) { $InstallDir = $candidate }
    }
}
if (-not $InstallDir) {
    $InstallDir = Join-Path $env:LOCALAPPDATA "ComposersDungeon"
}
Write-Ok "Install location: $InstallDir"

# --- 1. Prerequisites --------------------------------------------------------
Write-Step "Checking prerequisites"
Install-Dependency "node" "OpenJS.NodeJS.LTS" "Node.js" "https://nodejs.org"
$nodeMajor = ((node --version) -replace "[^0-9.]", "").Split(".")[0] -as [int]
if ($nodeMajor -lt 18) {
    Stop-Install "Node.js 18 or newer is required (found $(node --version))." `
        "Update it from https://nodejs.org and run the installer again."
}
Write-Ok "Node $(node --version), npm $(npm --version)"

# --- 2. Get the code ---------------------------------------------------------
Write-Step "Fetching Composer's Dungeon"
# Git is only needed to download or update a checkout — a downloaded ZIP
# doesn't need it at all, so don't install it for nothing.
if (-not (Test-Path (Join-Path $InstallDir "package.json"))) {
    Install-Dependency "git" "Git.Git" "Git" "https://git-scm.com/download/win"
}

if ((Test-Path (Join-Path $InstallDir ".git")) -and (Test-Command "git")) {
    Push-Location $InstallDir
    git fetch origin $Branch --quiet
    git checkout $Branch --quiet
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Stop-Install "Couldn't switch to $Branch - you probably have uncommitted changes in $InstallDir." `
            "Commit or discard them, then run this again."
    }
    git pull --ff-only origin $Branch --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Ok "Couldn't fast-forward - continuing with the code you already have."
    }
    else {
        Write-Ok "Updated existing install to the latest $Branch."
    }
    Pop-Location
}
elseif (Test-Path (Join-Path $InstallDir "package.json")) {
    Write-Ok "Using the copy already at $InstallDir (no git checkout here - skipping update)."
}
else {
    New-Item -ItemType Directory -Force -Path (Split-Path $InstallDir -Parent) | Out-Null
    git clone --branch $Branch --depth 1 $Repo $InstallDir --quiet
    if ($LASTEXITCODE -ne 0) {
        Stop-Install "Couldn't download the app from GitHub." `
            "Check your internet connection, then run the installer again."
    }
    Write-Ok "Cloned into $InstallDir."
}

Set-Location $InstallDir

# --- 3. Environment file -----------------------------------------------------
Write-Step "Preparing configuration"
$envPath = Join-Path $InstallDir ".env"
if (Test-Path $envPath) {
    Write-Ok ".env already exists - leaving your settings alone."
}
else {
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    @(
        '# Generated by the Composer''s Dungeon Windows installer.',
        'DATABASE_URL="file:./dev.db"',
        "NEXTAUTH_SECRET=`"$secret`"",
        'NEXTAUTH_URL="http://localhost:3000"'
    ) | Set-Content -Path $envPath -Encoding UTF8
    Write-Ok "Wrote .env with a freshly generated NEXTAUTH_SECRET."
}

# --- 4. Dependencies, database, build ---------------------------------------
Write-Step "Installing dependencies (a few minutes the first time)"
Invoke-Tool "npm.cmd" @("install", "--no-audit", "--no-fund") "npm install"

Write-Step "Building the dungeon database"
Invoke-Tool "npx.cmd" @("--yes", "prisma", "generate") "prisma generate"
Invoke-Tool "npx.cmd" @("--yes", "prisma", "db", "push", "--skip-generate") "prisma db push"
Invoke-Tool "npm.cmd" @("run", "db:seed") "seeding lessons, dungeons and bosses"

Write-Step "Compiling the app (this is the slow one)"
Invoke-Tool "npm.cmd" @("run", "build") "npm run build"

# --- 5. Shortcuts ------------------------------------------------------------
Write-Step "Creating shortcuts"
$launcher = Join-Path $InstallDir "scripts\windows\launch.vbs"
$icon = Join-Path $InstallDir "public\icons\composers-dungeon.ico"
$shell = New-Object -ComObject WScript.Shell

function New-AppShortcut($path) {
    New-Item -ItemType Directory -Force -Path (Split-Path $path -Parent) | Out-Null
    $lnk = $shell.CreateShortcut($path)
    $lnk.TargetPath = "wscript.exe"
    $lnk.Arguments = "`"$launcher`""
    $lnk.WorkingDirectory = $InstallDir
    $lnk.Description = "Composer's Dungeon - learn music theory, descend, compose"
    if (Test-Path $icon) { $lnk.IconLocation = $icon }
    $lnk.Save()
    Write-Ok $path
}

New-AppShortcut (Join-Path ([Environment]::GetFolderPath("Desktop")) "Composer's Dungeon.lnk")
New-AppShortcut (Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Composer's Dungeon.lnk")

# --- 6. Done -----------------------------------------------------------------
Write-Host ""
Write-Host "  The dungeon is ready." -ForegroundColor Green
Write-Host ""
Write-Host "  Launch it       : Desktop or Start-menu shortcut 'Composer's Dungeon'" -ForegroundColor Gray
Write-Host "  Demo account    : bard@composersdungeon.demo / dungeon-demo-1" -ForegroundColor Gray
Write-Host "  Pin to taskbar  : once open, use the browser menu -> Install," -ForegroundColor Gray
Write-Host "                    then right-click the window -> Pin to taskbar" -ForegroundColor Gray
Write-Host "  Update later    : run scripts\windows\update.ps1" -ForegroundColor Gray
Write-Host "  Remove          : run scripts\windows\uninstall.ps1" -ForegroundColor Gray
Write-Host ""

if (-not $NoLaunch) {
    Write-Step "Opening Composer's Dungeon"
    Start-Process "wscript.exe" -ArgumentList "`"$launcher`""
}
