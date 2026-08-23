@echo off
title Composer's Dungeon - Installer
echo.
echo   Composer's Dungeon - Windows setup
echo   ----------------------------------
echo   This installs everything the app needs and puts a shortcut on your
echo   Desktop. It takes a few minutes the first time. Leave it running.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\install.ps1"
echo.
pause
