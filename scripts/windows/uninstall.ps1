<#
.SYNOPSIS
    Removes Composer's Dungeon shortcuts, and optionally the app itself.

.PARAMETER RemoveFiles
    Also delete the install folder. Your database (prisma\dev.db) goes with it,
    so back it up first if you want to keep your progress.
#>
[CmdletBinding()]
param([switch]$RemoveFiles)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$shortcuts = @(
    (Join-Path ([Environment]::GetFolderPath("Desktop")) "Composer's Dungeon.lnk"),
    (Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Composer's Dungeon.lnk")
)
foreach ($s in $shortcuts) {
    if (Test-Path $s) { Remove-Item $s -Force; Write-Host "Removed $s" -ForegroundColor DarkGray }
}

# Stop a running instance.
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$Root*" } |
    ForEach-Object {
        Write-Host "Stopping server (PID $($_.ProcessId))" -ForegroundColor DarkGray
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

if ($RemoveFiles) {
    $db = Join-Path $Root "prisma\dev.db"
    if (Test-Path $db) {
        $backup = Join-Path ([Environment]::GetFolderPath("Desktop")) "composers-dungeon-backup.db"
        Copy-Item $db $backup -Force
        Write-Host "Your progress was backed up to $backup" -ForegroundColor Yellow
    }
    Set-Location $env:USERPROFILE
    Remove-Item $Root -Recurse -Force
    Write-Host "Removed $Root" -ForegroundColor Green
}
else {
    Write-Host "`nShortcuts removed. The app is still at:`n  $Root" -ForegroundColor Green
    Write-Host "Re-run with -RemoveFiles to delete it entirely." -ForegroundColor DarkGray
}
