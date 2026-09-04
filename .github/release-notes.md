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

## What's new in v1.5.1

**The icons are real now.** Every size below 512 was a cropped fragment of the
artwork — a piece of the ring, no note — so Windows and the browser found
nothing recognisable and fell back to their own default. That is why the tab
kept showing the Microsoft logo. All sizes are regenerated from the source
drawing, both .ico files are genuine icon containers, and the service worker
cache was bumped so the corrected files can actually replace the old ones.

**The notation palette stands up.** Eight categories crushed into a strip gave
each one two words and no room to explain itself. The palette now runs down
the side of the score, with every tool showing its symbol, its name and what
it does — and it collapses to an icon rail when you want the width.

**Twenty ornaments, up from six.** Trills plain and with an accidental,
mordent and upper mordent, turn and inverted turn, tremolo at one, two and
three strokes, arpeggios with direction, grace note and appoggiatura, and the
five slides: glissando, portamento, bend, fall and doit.

**A keyboard in the lessons and dungeon trials.** The Studio's on-screen piano
is now in the game's own editor: keys write at the end of the music, shift
stacks a chord, and it opens on the octave your tier actually offers. Notation
also leads over the grid now, and the note lengths show their written symbol.

**The lights came on.** The colour drifting behind the app was drawn too faint
to see and the cards were too opaque to let it through, so everything read as
flat black. Both are fixed, the text ramp reaches the shades the app was
already asking for, and the entrance hall's stat tiles carry their own colour
and show progress instead of a grey number.

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
