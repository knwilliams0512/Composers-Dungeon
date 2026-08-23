; Composer's Dungeon — Windows installer.
;
; Per-user install (no admin rights, no UAC prompt). Everything the app needs
; ships inside: a Node runtime, the pre-built server, and a seeded database,
; so installation is a file copy and the app runs offline forever after.
;
; Built on Linux with makensis — see scripts/windows/build-installer.sh.

Unicode true
ManifestDPIAware true

!define APP_NAME      "Composer's Dungeon"
!define APP_SLUG      "ComposersDungeon"
!define APP_PUBLISHER "Composer's Dungeon"
!ifndef APP_VERSION
  !define APP_VERSION "1.0.0"
!endif

Name "${APP_NAME}"
OutFile "${OUT_FILE}"
InstallDir "$LOCALAPPDATA\${APP_SLUG}"
InstallDirRegKey HKCU "Software\${APP_SLUG}" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 64
ShowInstDetails hide
ShowUnInstDetails hide
BrandingText "${APP_NAME}"

VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName"     "${APP_NAME}"
VIAddVersionKey "FileDescription" "${APP_NAME} installer"
VIAddVersionKey "FileVersion"     "${APP_VERSION}"
VIAddVersionKey "ProductVersion"  "${APP_VERSION}"
VIAddVersionKey "CompanyName"     "${APP_PUBLISHER}"
VIAddVersionKey "LegalCopyright"  "${APP_PUBLISHER}"

!include "MUI2.nsh"
!include "FileFunc.nsh"

!define MUI_ICON   "${PAYLOAD}\app\public\icons\composers-dungeon.ico"
!define MUI_UNICON "${PAYLOAD}\app\public\icons\composers-dungeon.ico"
!define MUI_ABORTWARNING

!define MUI_WELCOMEPAGE_TITLE "Install ${APP_NAME}"
!define MUI_WELCOMEPAGE_TEXT  "The Academy teaches you. The Dungeon tests you.$\r$\n$\r$\nThis installs ${APP_NAME} for your account only, so it needs no administrator rights.$\r$\n$\r$\nEverything is included: 25 music theory lessons, 9 dungeon areas, 4 bosses, and the app's own Node runtime. Nothing is downloaded, and nothing leaves your PC.$\r$\n$\r$\nIt takes about a minute."

!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION LaunchDungeon
!define MUI_FINISHPAGE_RUN_TEXT "Descend into the dungeon now"
!define MUI_FINISHPAGE_TEXT "${APP_NAME} is installed.$\r$\n$\r$\nLaunch it from the Desktop or Start menu whenever you like.$\r$\n$\r$\nTry the demo composer:$\r$\n    bard@composersdungeon.demo$\r$\n    dungeon-demo-1$\r$\n$\r$\nOr sign up fresh to start from your very first note."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; Stop a running instance so its files can be replaced. The launcher records
; the server's PID, which beats guessing at node.exe processes.
!macro StopDungeon
  ; Labels rather than relative jumps: this macro is inserted into both the
  ; install and uninstall sections, and miscounted offsets fail silently.
  IfFileExists "$INSTDIR\data\server.pid" 0 stop_done
    ClearErrors
    FileOpen $0 "$INSTDIR\data\server.pid" r
    IfErrors stop_done
    FileRead $0 $1
    FileClose $0
    nsExec::Exec 'taskkill /F /PID $1'
    Pop $2
    Delete "$INSTDIR\data\server.pid"
    Sleep 700
  stop_done:
!macroend

Function LaunchDungeon
  Exec '"$WINDIR\System32\wscript.exe" "$INSTDIR\launch\launch.vbs"'
FunctionEnd

Section "Composer's Dungeon" SecMain
  SectionIn RO
  !insertmacro StopDungeon

  SetOutPath "$INSTDIR"
  File "${PAYLOAD}\node.exe"
  File "${PAYLOAD}\version.json"

  SetOutPath "$INSTDIR\app"
  File /r "${PAYLOAD}\app\*.*"

  SetOutPath "$INSTDIR\launch"
  File /r "${PAYLOAD}\launch\*.*"

  ; The seeded database is a template. Player progress lives in data\, which
  ; upgrades never touch.
  SetOutPath "$INSTDIR\seed"
  File /r "${PAYLOAD}\seed\*.*"

  CreateDirectory "$INSTDIR\data"

  ; Shortcuts
  CreateShortcut "$SMPROGRAMS\${APP_NAME}.lnk" "$WINDIR\System32\wscript.exe" \
    '"$INSTDIR\launch\launch.vbs"' "$INSTDIR\app\public\icons\composers-dungeon.ico" 0 \
    SW_SHOWNORMAL "" "Learn music theory. Descend. Compose."
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$WINDIR\System32\wscript.exe" \
    '"$INSTDIR\launch\launch.vbs"' "$INSTDIR\app\public\icons\composers-dungeon.ico" 0 \
    SW_SHOWNORMAL "" "Learn music theory. Descend. Compose."

  ; Add/Remove Programs (per-user)
  WriteRegStr HKCU "Software\${APP_SLUG}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "DisplayIcon" "$INSTDIR\app\public\icons\composers-dungeon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "NoRepair" 1

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
    "EstimatedSize" "$0"
SectionEnd

Section "Uninstall"
  !insertmacro StopDungeon

  Delete "$SMPROGRAMS\${APP_NAME}.lnk"
  Delete "$DESKTOP\${APP_NAME}.lnk"

  RMDir /r "$INSTDIR\app"
  RMDir /r "$INSTDIR\launch"
  RMDir /r "$INSTDIR\seed"
  Delete "$INSTDIR\node.exe"
  Delete "$INSTDIR\version.json"
  RMDir /r "$INSTDIR\update-staging"
  RMDir /r "$INSTDIR\app.previous"
  Delete "$INSTDIR\Uninstall.exe"

  ; Compositions, levels and streaks live in data\ — never delete them without
  ; asking, and back them up when we do.
  IfFileExists "$INSTDIR\data\dungeon.db" 0 no_save
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "Also delete your saved progress — compositions, levels, streaks and guild posts?$\r$\n$\r$\nChoose No to keep it for a future reinstall." \
      IDYES delete_save IDNO no_save
    delete_save:
      CopyFiles /SILENT "$INSTDIR\data\dungeon.db" "$DESKTOP\composers-dungeon-backup.db"
      MessageBox MB_OK|MB_ICONINFORMATION \
        "A copy of your progress was saved to your Desktop as composers-dungeon-backup.db."
      RMDir /r "$INSTDIR\data"
  no_save:

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}"
  DeleteRegKey HKCU "Software\${APP_SLUG}"
  RMDir "$INSTDIR"
SectionEnd
