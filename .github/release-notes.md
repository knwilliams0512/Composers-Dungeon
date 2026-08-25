## What's new in v1.5.0

**The Studio** — a dedicated composition workspace at *Studio* in the sidebar,
separate from the dungeon's own editor. Full multi-part notation: 70
instruments across nine families, twelve ensemble templates from a solo line
to a full orchestra, real engraved pages with brackets and braces, playback
with per-instrument mute, solo, volume and pan, an on-screen piano, fretboard
and drum pads, and export to MusicXML, MIDI and print.

**You can write chords now.** Placing a note used to clear everything it
sounded over, including notes starting on the same beat — so a second note on
a beat silently replaced the first. Notes that begin together are kept, and the
engraver draws them under one shared stem.

**Note spelling is fixed in the far keys.** F-sharp major spelled its seventh
degree "F", putting two different degrees on one staff line; D-flat and G-flat
minor asked for more flats than a signature can hold. Every key and mode now
gets the seven distinct letters it is entitled to.

**Fixes** — the Library no longer crashes on a Studio score, the Studio is
usable on a phone, and the app's Windows icons are real icon files rather than
PNGs wearing an .ico extension, so the taskbar and shortcut show the logo.

## Install on Windows

1. Download **`ComposersDungeonSetup.exe`** from **Assets** below.
2. If your browser warns the file "isn't commonly downloaded": **⋯ → Keep → Keep anyway**.
3. Double-click it. At *"Windows protected your PC"*: **More info → Run anyway**.
4. Launch **Composer's Dungeon** from your Desktop or Start menu.

No administrator rights, no Node.js, no Git, no build step, and no internet
connection needed after this. The Node runtime, the app and a database already
stocked with 25 lessons, 9 dungeon areas, 4 bosses, 8 artifacts and 15
achievements are all inside the installer. It takes about a minute.

Both Windows warnings appear because the installer isn't code-signed — they mean
"we don't recognise the publisher", not "we found something bad".

**Already have it installed? Do nothing.** The app updates itself from this
release the next time you launch it, and your compositions, levels and streaks
are untouched.

Full instructions for Windows, macOS, Linux, source installs, updating,
uninstalling and troubleshooting: **[INSTALL.md](https://github.com/knwilliams0512/Composer-s-Dungeon/blob/HEAD/INSTALL.md)**

### Assets

| File | What it's for |
| --- | --- |
| `ComposersDungeonSetup.exe` | The installer. This is the one you want. |
| `ComposersDungeon-*-update.zip` | The in-place update package, downloaded automatically by installed copies. |
| `latest.json` | The update feed: version, download URL and SHA-256 checksum. |
