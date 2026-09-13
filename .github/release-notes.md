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

## What's new in v1.7.0

**You can turn the training wheels off.** Settings has a new switch: *Give me
every tool at once*. The editor normally hands back one decision at a time as
you earn it — note lengths, then accidentals, then chords, then control of key
and meter. Flip the switch and all of it is there immediately, in lessons and
trials as well as the Workshop.

It comes with an honest warning rather than a decorative one, because two
things really do get confusing. You will be offered notation nobody has taught
you yet, and lessons that set their own key and length can now be changed out
from under their own wording — a brief asking for eight bars in G major will
still say so while you write four in D. Nothing is lost by trying it: turn it
back off and the tools return to what you have earned, with your compositions
untouched.

**The Entrance Hall, finished.** The banner now reads as a single row at any
window width instead of stacking, the piano behind it is lit rather than
washed out, and Create / Practice / Explore / Ascend stays legible over the
keys. The app itself is wider — the old measure left a third of a desktop
screen empty — while lesson text keeps its own narrower column so prose stays
readable.

## What's new in v1.8.0

**The mark is a treble clef.** In the sidebar, on the browser tab, and on the
Windows taskbar — one clef, drawn as a single continuous stroke the way the
glyph is actually written, so it still reads at 16 pixels.

**Every place in the app has its own mark, in its own colour.** The Academy's
open book, the Dungeon's arch, the Workshop's quill, the Bosses' skull, the
Studio's waveform, the Library's shelf, the Guild's crowd. They are filled
shapes now rather than thin grey outlines, so you can find a room by its
colour before you have read a single label. Stat tiles and skill meters use
the same filled set.

**The whole interface is lit.** The accents each gained about a step of
saturation and light where every icon, meter and pill lives, and the card
surfaces carry more blue — a card and the page behind it used to be nearly
the same near-black, which is why the layout looked flat. Two things were
doing real harm: the stat tiles mixed their colour toward transparent, which
over a near-black page leaves almost none of it, and *Enter the Dungeon* was
a translucent red that came through as muddy maroon, making the loudest
invitation in the app its dimmest button. Both are solid colour now, and the
figures on the tiles are plain white.

**Fixes** — between 1024 and 1280 pixels wide the Entrance Hall banner tried
to form its single row before there was room for one, pushing the Creative
Flame and the whole Create / Practice / Explore / Ascend list off the edge
where they were silently clipped. It stacks below that width now. A long
composer name no longer truncates mid-word.

## What's new in v1.9.0

**The dungeon is two-thirds bigger.** Fifteen areas and eighty-two rooms, up
from nine and fifty-two. The new areas were chosen by what was missing:
Instrumentation and Orchestration had no room anywhere in the game, and
Counterpoint had one. So the Instrument Menagerie, the Orchestral Abyss, the
Whispering Catacombs, the Loom of Variations, the Clockwork Bazaar and the
Garden of Forking Cadences — with two new bosses and ten new artifacts.

**There are secret rooms now.** Fifteen of them, and a secret is not a locked
door. A locked door tells you it is there and names its key; these are simply
absent until you have done the thing that reveals them — cleared an area,
carried the right artifact through, put a particular boss down, kept the
Creative Flame alive a week, or found five other secrets first. The room is
never sent to your browser before you find it, so there is nothing to read in
the page source and no total quietly hinting that something is missing.

**Fifty-one achievements, up from fifteen.** The old set could only ask about
eight things, so it rewarded studying and streaks and almost nothing else.
Now there are rewards for exploring, for collecting, for sharing work, for
finding secrets — and for being rounded rather than narrow: "raise every
skill to 10" is measured on your *weakest* skill, because that is the
question actually worth asking.

**Accessibility settings.** Text size, reduced motion, higher contrast, and a
reading font that swaps the body serif for your system's interface face while
leaving the headings alone. They are saved to your composer rather than to
one browser, so they follow you to any machine you sign in on. Reduce motion
defaults to following your operating system, which the app already honoured —
the switch is for people whose system setting is off who still want the app to
hold still. There is also a skip link now: ten navigation links used to stand
between the top of every page and its content.

**Creative Sparks in the Workshop.** Forty-four prompts you can take or
ignore. Nothing records whether you used one and no piece is worth more for
it — the moment a prompt is graded it is just another brief. They are
constraints rather than subjects ("only three pitches", "never land on the
tonic until the last note"), grouped by the kind of block you are facing,
and each one says why it works.

## What's new in v1.10.0

**The Academy is a roadmap now.** Five levels, thirty-one numbered units,
absolute beginner to virtuoso — and you can see the whole shape of it at
once. It used to be a flat list of twenty-five lessons sorted by difficulty,
which tells you what comes next but never what you are in the middle of.
"Level 3, unit 3.4" is somewhere you can say you are.

Level 1 is Absolute Foundations — sound, notation, rhythm, your first
scales, and nothing assumes you have read music before. Level 2 is Intervals
& Chords. Level 3 is How Music Moves: cadences, voice leading, function,
non-chord tones, modes. Level 4 is Advanced Harmony & Form. Level 5 is
Virtuoso & Professional, and it did not exist until now.

**Fifteen new lessons**, written to fill units that had nothing behind them:
what sound actually is, the staff, diatonic harmony, seventh chords, voice
leading, non-chord tones, modes, transposition, modulation techniques,
borrowed chords, extended and altered chords, jazz harmony, twentieth- and
twenty-first-century theory, advanced analysis, and ear training. Forty
lessons in total.

**The Composer's Craft** sits beside the roadmap rather than inside it.
Melody writing, phrasing and motivic development are craft, not theory — you
can know every unit of Level 4 and still not know how to start a tune — so
they are their own strand and assume no level.

**Fixes** — "The Lock Has No Secrets" asked you to solve fifteen puzzle
rooms when the game contains twelve, so it could never be earned. "Raise
every skill to 5" was measured only over skills you had already practised,
which meant six skills at 5 and three never started counted as every skill
at 5. And a secret room that opens at five secrets found could not open in
the same breath as the fifth — it needed a page refresh to notice.

## Install on Windows

1. Download **`ComposersDungeonSetup.exe`** from **Assets** below.
2. If your browser warns the file "isn't commonly downloaded": **⋯ → Keep → Keep anyway**.
3. Double-click it. At *"Windows protected your PC"*: **More info → Run anyway**.
4. Launch **Composer's Dungeon** from your Desktop or Start menu.

No administrator rights, no Node.js, no Git, no build step, and no internet
connection needed after this. The Node runtime, the app and a database already
stocked with 40 lessons, 15 dungeon areas, 82 rooms, 6 bosses, 18 artifacts
and 51 achievements are all inside the installer. It takes about a minute.

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
