<#
.SYNOPSIS
    Stops a running Composer's Dungeon server.

.DESCRIPTION
    Closing the app window normally stops the server on its own. This is for
    the cases where it doesn't: a crashed window, or a server started with
    -KeepRunning / -NoWindow.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$running = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$Root*" }

if (-not $running) {
    Write-Host "Composer's Dungeon isn't running." -ForegroundColor DarkGray
    return
}

foreach ($p in $running) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped server (PID $($p.ProcessId))" -ForegroundColor Green
}
