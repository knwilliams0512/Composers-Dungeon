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

## What's new in v1.5.2

**Every subject has its colour back.** The app was one colour: six identical
grey tiles on the entrance hall, twenty-five identical cards in the Academy,
and a palette underneath that was keyed by subject but never allowed to show.
Melody is pink, Rhythm teal, Harmony blue, Form purple — on the cards
themselves now, not just a hairline on the edge.

**Cards have scenes behind them.** Twelve drawn vector scenes — a book, a
dungeon arch, a crown, a sheet of music, a crystal, a trophy, a keyboard, a
candle — each tinted to its card's own colour and faded out before it reaches
the text.

**The entrance hall's stat tiles** carry their colour through the border, the
ground and the icon, show progress as a bar rather than a number to read, and
name where they go on their face instead of leaving it to a hover.

**Locked things no longer drain.** Locked lessons, rooms, areas and bosses
were drawn desaturated, and since almost everything is locked early on, nearly
every page was grey on purpose. They step back on opacity now and keep the
colour that says what they are.

## What's new in v1.5.3

**The Entrance Hall matches its design.** The banner is one line now — who you
are, the climb to the next level, your total XP and the Creative Flame — and
every other page carries a banner of the same family in its own colour, with
its own drawn scene behind it.

**A bug that hid the Creative Flame.** The hall's banner was wider than the
card holding it, and the card clips what overflows — so the flame badge was
cut in half and anything after it was invisible. Every element's width is now
budgeted against the space actually available.

## What's new in v1.5.4

**Chords no longer wreck your score.** Writing a chord under a melody made the
grader read every stacked note as a melodic leap: the same stepwise tune
scored 100% stepwise as a single line and 0% the moment it was harmonised, and
a piece with real silence in it was told it had none. Shape is now read from
the line, and filled time is counted once however many notes stack on a beat.

**Exports that other programs can actually read.** MIDI files played every
instrument as a piano, because no program-change was ever written; a note
ending exactly where the next began could cut that new note off; and
instrument names with a flat sign in them wrote broken bytes. MusicXML could
not express a chord, a rest or a second staff at all — a harmonised part or a
grand staff came out wrong. All of it is fixed and checked against real
exported files.

**Shift-click builds the chord it promises.** The keyboard's own hint says
shift-click to build a chord, but clicking the root and then shift-clicking
the third and fifth left the root behind on its own and chorded the other two
together on the next beat.

**Cleared rooms agree with each other.** A treasure vault counted as cleared on
its own page but not on the map or the area list, and the map ignored bosses
the area page counted as beaten. All three now ask the same question.

**A wrong link no longer looks like a crash.** Missing rooms, lessons and
bosses fell through to a bare white page in an otherwise dark app.

## What's new in v1.6.0

**Guilds you can actually join.** The Guild was a feed with nobody in it. There
are six houses now, each standing for a way of working rather than a
difficulty tier: the Singing Line (melody), the Stacked Hand (harmony), the
Iron Pulse (rhythm), the Long Arch (form), the Quiet Room (expression), and the
Open Bench, which has no specialism and expects newcomers.

You belong to one at a time, so joining is a choice rather than a checkbox, and
switching is a single action. **You can found your own** — name, tagline,
description, emblem, colour and focus — and become its founder. A founder
disbands their house rather than walking out of it, which would leave it
orphaned, and disbanding releases every member.

**The Entrance Hall, rebuilt to its design.** One row: the level ring and your
name, the climb to the next level with its bar, Total XP and the Creative Flame
sharing a card, and Create / Practice / Explore / Ascend down the edge — over a
piano catching warm light and a curl of manuscript paper in the corner.

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
