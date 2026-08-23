' Composer's Dungeon launcher.
' Starts start.ps1 with no flashing console window. On a first run (nothing
' built yet) it shows the window instead, so setup progress is visible.

Option Explicit

Dim fso, shell, scriptDir, root, psCommand, visible, styleArg
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
root = fso.GetParentFolderName(fso.GetParentFolderName(scriptDir))

If fso.FolderExists(root & "\node_modules") And fso.FolderExists(root & "\.next") Then
    visible = 0                            ' normal launch: no console at all
    styleArg = " -WindowStyle Hidden"
Else
    visible = 1                            ' first run: show setup progress
    styleArg = ""
End If

shell.CurrentDirectory = root
psCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass" & styleArg & _
            " -File """ & scriptDir & "\start.ps1"""

shell.Run psCommand, visible, False
