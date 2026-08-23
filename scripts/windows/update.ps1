<#
.SYNOPSIS
    Updates an installed Composer's Dungeon to the latest code.

.DESCRIPTION
    Pulls the branch, reinstalls dependencies, applies any new database
    columns, re-seeds content (the seed is idempotent - your progress, your
    compositions and your streak are preserved) and rebuilds.
#>
[CmdletBinding()]
param([switch]$NoLaunch)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Yellow }
function Invoke-Tool($file, [string[]]$toolArgs, $what) {
    & $file @toolArgs
    if ($LASTEXITCODE -ne 0) { Write-Host "`n!!  $what failed." -ForegroundColor Red; exit 1 }
}

if (-not (Test-Path (Join-Path $Root ".git"))) {
    Write-Host "This copy isn't a git checkout, so there's nothing to pull." -ForegroundColor Red
    exit 1
}

Write-Step "Pulling the latest code"
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
git pull --ff-only origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n!!  Pull failed - you may have local changes. Resolve them and retry." -ForegroundColor Red
    exit 1
}

Write-Step "Updating dependencies"
Invoke-Tool "npm.cmd" @("install", "--no-audit", "--no-fund") "npm install"

Write-Step "Migrating and re-seeding content"
Invoke-Tool "npx.cmd" @("--yes", "prisma", "generate") "prisma generate"
Invoke-Tool "npx.cmd" @("--yes", "prisma", "db", "push", "--skip-generate") "prisma db push"
Invoke-Tool "npm.cmd" @("run", "db:seed") "db:seed"

Write-Step "Rebuilding"
Invoke-Tool "npm.cmd" @("run", "build") "npm run build"

Write-Host "`n  Up to date. Your progress is untouched." -ForegroundColor Green
if (-not $NoLaunch) {
    Start-Process "wscript.exe" -ArgumentList "`"$(Join-Path $PSScriptRoot 'launch.vbs')`""
}
