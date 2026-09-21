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

## What's new in v1.10.1

**A full correctness audit of the music theory.** Every quiz question in
every lesson, every placement question, every puzzle and the prose of all
forty lessons, checked against the theory. The answer keys were right — all
of them. Four sentences were imprecise and are now fixed: a dominant
seventh's tritone was described as resolving "outward and inward" (with the
third below the seventh it is a diminished fifth, and it contracts); only
the *adjacent* intervals of a diminished seventh are identical; the two
resolving voices of V7 land on the root and third of the tonic chord rather
than "the tonic"; and E–G–A♭ is the *inversion* of C–C♯–E, not a
transposition of it.

**Quiz corrections can now reach you.** The app builds its lesson content on
update, but quizzes, exercises and the placement test were only ever written
when none existed — so a corrected answer key could never have reached an
installed copy. That was the one kind of content where being wrong actively
teaches the wrong thing, and the one kind that could not be fixed. It is
fixed now, and your quiz history is untouched.

**Two new checks run over the content.** One derives intervals, chord
spellings, scale patterns and transposing-instrument distances from first
principles and compares them to what the app says. The other checks the
notation engine's key signatures against signatures written out by hand.
Reading prose for a wrong interval does not work — the eye agrees with what
it expects.

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

## What's new in v1.10.2

**Your rank grows with you.** The question you answered on your first day —
"how much music do you know?" — set a permanent ceiling. Answer "no experience"
honestly and 22 of the 40 lessons and 10 of the 15 dungeon areas were sealed
forever, because nothing ever raised that answer no matter how much of the
Academy you finished. It is now a starting point rather than a cap: what you
have completed counts, the rank on your hall and profile rises as you earn it,
and every lesson and every area is reachable from a standing start.

**The roadmap is walkable in order.** Five lessons asked you to finish
something that appeared *later* in the Academy — Sharps and Flats wanted the
keyboard lesson from the next unit, and unit 3.1 wanted a Composer's Craft
lesson that sorts after all thirty-one numbered units. Each now builds on a
lesson that genuinely precedes it. Lesson requirements no longer jump up and
back down the list either, so the gate stops closing on you and reopening
further down.

**Fixes** — the Academy's counter said "0 Open" on your first visit while three
lessons were waiting; it now reads "Started", which is what it counts. Content
corrections that remove a lesson's prerequisite now reach installed copies
instead of leaving that lesson gated on the old one.

## What's new in v1.10.3

**Eleven achievements could never fire when you earned them.** The achievement
check only ran when something awarded XP — and collecting an artifact, joining
a house, posting to the guild, publishing a piece, finding a secret room and
unlocking a specialization award none. Claim the fifth artifact and *Magpie*
stayed locked; it would appear later, unannounced, the next time you happened
to finish a lesson. A player who only collected and shared would never have
seen it at all. Each of those now runs the check where it belongs.

**Passing a quiz first try paid nothing.** The quiz's own XP — thirty per cent
of the lesson — was awarded only when you had *failed* that quiz before, which
is precisely backwards: the code recorded the attempt and then asked whether
you had already passed, having just written down that you had. Practice
exercises were worse: their twenty per cent had never been awarded to anyone,
because the check read back a flag the same call had just set. Half of every
lesson's XP was unreachable on a clean run. Both now pay once, the first time
you earn them, whatever order you get there in.

**Fixes** — solving a puzzle checked that its *area* was open but not the room's
own level, the one place of three that did not; no room in the game is
reachable that way today, but a future one would have been, and puzzles pay by
room level. A new check runs over both of these classes — award-once guards,
and achievements earned without XP — because neither fails loudly: the app just
quietly pays nothing.

## What's new in v1.10.4

**The update that broke the app on launch.** If you had Composer's Dungeon
before September, updating left it opening straight onto *"Something Broke Down
Here"*. Four changes since then added things to the database — the houses of
the Guild, the "every tool at once" switch, secret rooms, and the accessibility
settings — and each one shipped without telling the updater how to add them to
a database that already existed. So the update swapped in an app that asked for
columns your copy had never been given: the content refresh stopped halfway
through, and every page that read your profile failed on the first query it
made. The Entrance Hall is the page it opens to, which is why that is where you
saw it.

The updater no longer needs to be told. Every build now carries a description
of the database it expects, and the update compares that against the database
you actually have and adds whatever is missing — tables, columns and indexes —
before it touches any content. Nothing is dropped or rewritten; your
compositions, levels, streaks and progress are read-only to it. **If you are
seeing this error, just launch the app: it repairs itself on the way in.**

A failed update also used to put the old app back but leave the database as the
half-finished upgrade had left it, which is worse than either version alone and
is why the error came back every single launch. The database is now backed up
first and restored with the app, so a failed update leaves the copy you had.

**One window, not a handful.** Two things were stacking windows up. The app
runs in its own browser profile, and Edge and Chrome reopen the previous
session after anything they judge a crash — which the error above counted as —
so every launch restored the last set of windows on top of the new one. That
profile is now marked as having closed cleanly before each launch, and session
restore is turned off: the app always opens at the Entrance Hall and has
nothing worth restoring. Separately, two launches close together could race,
both start a server, and end up with two of them writing to the same file;
startup is now serialised so the second one simply uses the first one's server.
And closing one window no longer stops a server another window is still using —
which is what made an untouched window show the error page.

## What's new in v1.10.5

**The repair no longer depends on the update working.** v1.10.4 taught the
updater how to bring an older database up to date — but it could only help if
the update step itself ran, and for anyone whose update was failing, that was
the one part that never got the chance. The app now runs the same check every
single time it starts, before it serves a page: it compares your database
against the shape this build expects and adds anything missing. On a database
that is already current it does nothing and costs a fraction of a second.
**Launch the app and it fixes itself — no reinstall, nothing to download.**

**The error page tells you what actually happened.** It used to show a
reference number and point at a log file inside a folder most people have no
reason to know how to open, which is a strange thing to do in an app where the
person reading the error is the person who could act on it. It now shows the
real message — the version, the database, and the end of the app's own error
log — with a button to copy the lot.

## What's new in v1.11.0

**The Proving Grounds.** A new place in the sidebar, and a different kind of
work from anywhere else in the app. The Academy explains a minor sixth and the
Dungeon asks you to write with one; neither ever asks you to *recognise* one,
at speed, which is the thing that separates knowing the name from knowing the
sound. Six drills, one question at a time, and a combo that builds while you
are right and resets the moment you are not.

- **Interval Ear** — two notes sound; name the distance between them.
- **Chord Colour** — a chord sounds; major, minor, diminished, augmented, and
  the five sevenths once you are past the triads.
- **The Seven Doors** — a scale runs past; name the mode it came from, through
  all seven and harmonic minor.
- **Sight of the Staff** — a note on the treble or bass staff, ledger lines
  and all; name it before the next one arrives.
- **The Gatekeeper's Seal** — sharps and flats at the clef; name the key, major
  or relative minor, out to seven of each.
- **Echo of the Drum** — a rhythm is struck; strike it back, with the button or
  the space bar.

Each drill gets harder while you are on a run: more choices to pick between,
and material you have not been asked for yet — the sevenths, the far keys, the
off-beats. Every answer tells you what the right one was and why, so a wrong
guess is still a lesson. Rounds are 45 to 75 seconds, each keeps a personal
best, and the XP goes into the skill the drill actually trains.

**Seven new achievements** for the Grounds, including two that ask for a
flawless round of ten or more rather than just a big number.

Nothing else changed. Your compositions, progress, streaks and everything in
the Academy and the Dungeon are exactly where you left them.

## What's new in v1.11.1

**When it won't start, it now tells you why.** The failure dialog used to name
a log file and stop there, which asks the person least equipped to debug it to
go and find a three-line error inside a folder they have no reason to know
about. It now puts the error in the dialog itself.

It also checks the install before starting rather than after failing, and names
exactly what is wrong: a missing Node runtime, missing built pages, a missing
or truncated database engine — and, specifically, a file Windows has left in
the cloud. A copy installed under Desktop, Documents or OneDrive can end up
with its large files synced rather than downloaded; the name is on disk and
everything looks present, but the bytes are not there, and the app cannot load
a database engine in that state. If that is what has happened, the dialog now
says so and suggests installing somewhere plain instead.

If Windows blocks Node from running at all — antivirus, or a folder programs
are not allowed to run from — that now produces a clear message rather than a
silent failure.

**Fixes** — `version.json` is written without a byte-order mark, so any JSON
parser that is not PowerShell's can read it. A new check runs over both
PowerShell scripts for structural errors and for the specific traps already
hit once (a BOM-writing `Set-Content`, a path matched with `-like` where
brackets are wildcards, a function called with parentheses that PowerShell
would read as a single array argument).

## What's new in v1.11.2

**If it won't start, the log now opens by itself.** A dead app cannot sensibly
ask you to go and find a text file inside a folder you have never opened — so
when the server fails to start, the error is quoted in the dialog *and* the
full log opens in Notepad. Nothing to hunt for.

**A real gap in the startup check.** The app checked this PC for
`vcruntime140.dll` before starting, but the database engine also links
`vcruntime140_1.dll` and `msvcp140.dll`, and a PC can easily have the first
without the other two. Missing either, the engine fails to load and the server
exits before printing anything you could act on. All three are checked now, and
the message names which one is absent.

**If the app will not start and updating has not helped**, install over the top
with `ComposersDungeonSetup.exe` from the release page. That replaces the
launcher itself — which an automatic update cannot always do — and your
compositions, levels and streaks live in the data folder, which installing does
not touch.

## What's new in v1.11.3

**The app repairs itself when files go missing.** The startup check added in
1.11.1 did its job — it reported an install missing its built pages, its
database client and its database engine — but then it could only suggest a
reinstall, which is a poor answer when the app is perfectly capable of fetching
those files itself. The update package *is* the app folder, so it now downloads
and lays it down again, and carries on starting if that worked.

The most common reason for files to vanish from a working install is antivirus
quarantining the database engine, which is a 19 MB unsigned native library and
exactly the shape of thing a scanner dislikes. If the repair cannot stick —
because the files are removed again as fast as they arrive — the message now
says so and points at the real fix: allow the Composer's Dungeon folder in your
antivirus settings.

## What's new in v1.11.4

**The actual reason it would not start.** Composer's Dungeon opens its database
through a small native library, and that library needs three Microsoft runtime
files. This PC had two of them and not the third — `vcruntime140_1.dll` — so
the database engine could not load, the server stopped before it printed
anything, and all you ever saw was "Composer's Dungeon couldn't start."

Nothing to install, and no need to know any of that: **the app now carries
those three files itself**, next to its own copy of Node. Windows looks in a
program's own folder before anywhere else, so they are simply found. No
administrator rights, no Microsoft download, and nothing on your PC is changed.

They come with the installer and with the update, so an existing copy is fixed
by launching it. If they ever go missing, the app fetches them back the same
way it now repairs any other missing file.

Five releases were spent on this without seeing it, because the app kept
reporting a symptom — a page that would not load, a server that would not
start — instead of the one line that mattered. The checks that finally caught
it are permanent now: the startup check names what is absent, the failure
dialog carries the error and opens the log, and a build that forgets to ship
the runtime fails.

## What's new in v1.11.5

**Clicking Proving Grounds no longer drops you at the sign-in page.** Four
routes — the Proving Grounds, the Workshop, the Studio and Settings — were
missing from the list of pages that require a signed-in session. That did not
make them public: each page still checks for itself. What it did was change
*when* the check happens. A listed page redirects before anything is drawn; an
unlisted one draws the app shell first, sits on "Lighting the torches…", and
only then throws you to sign in. All four are on the list now, so they behave
like every other page.

**The Proving Grounds no longer needs the database to have caught up.** If a
copy had the new app but not yet the table that stores your scores, the page
failed outright rather than showing an empty scoreboard. It now opens either
way — the scores appear once the table is there, which the app sets up on the
next launch.

A new check fails the build if a page is ever added without being added to that
list, which is how these four drifted out of it unnoticed.

## What's new in v1.12.0

**Boss fights ask for music now.** Every other place the game wants a piece —
a lesson exercise, a dungeon trial — hands you the composer and judges what
you write. The boss fight, which is the end of all of it, accepted a title
typed into a box. Each of the six bosses now sets a brief drawn from its own
phases: the Chromatic Serpent wants a theme and its transformation, the Iron
Metronome fights in 7/8 and wants varied rhythm with room to breathe, the Pale
Soprano wants a shaped, singable line, and the Forgotten Composer wants melody,
harmony, rhythm, counterpoint and form at once. The final blow is graded by
the same engine as everything else, and tells you which standards you missed.

**Two exercises could not be completed by anyone.** The lesson on note values
asks for three different note lengths while limiting you to the Apprentice
toolbar, which offers two — there was no way to pass it. And any rhythm trial
in 2/4 at difficulty 2 asked for more notes than a 2/4 bar can hold at that
level, *and* for a second note length, *and* for a rest, which is three demands
on the same handful of beats. Both are fixed at the root: an exercise now
raises its own toolbar to whatever its standards need, and the note count is
capped below what the meter can actually hold.

Finding those meant teaching the checks to compose. A new check writes a real
piece for every exercise in the game — all 40 lesson exercises, every dungeon
trial, all 7,857 combinations the trial generator can produce, and all six boss
briefs — using only the tools that exercise actually grants. If it cannot write
one, the build fails.

**One bad row no longer takes a page down with it.** Four places read stored
data with nothing to catch a row saved by an older version of the app. A
lesson's quiz dropped the whole page if a single question was unreadable; a
puzzle room fell over instead of saying the riddle was worn away; and the
Placement Trial could break on a new player's very first screen. Each failure
is now local to the thing that failed.

**Smaller fixes.** Deleting a guild post asks first, rather than doing it on
one click of an unlabelled ✕. The Library stops loading every piece you have
ever written at once. Buttons that show only a musical symbol — the note
lengths, the studio toolbar, the like button — now say what they are to a
screen reader instead of reading out as symbols. And a helper that could be
called from outside with anyone's account id is no longer reachable that way,
with a check to keep it that way.

## What's new in v1.13.0

**The app opens properly now.** Launching it used to mean a dark page and then,
abruptly, the Entrance Hall. Now five staff lines draw themselves across the
dark, a clef writes itself onto them and catches the light, and the title
strikes before the whole thing dissolves into the game. It plays once per
launch, never takes a click — you can sign in straight through it — and anyone
who has asked for less motion never sees it.

**Level 6: The Full Score.** A whole new level of the Academy, above Virtuoso,
for composers writing pages rather than lines. Six lessons: the score itself
and the order every player expects to find their staff in; transposing
instruments in both directions; divisi against double stops, what a hand can
actually reach, and harmonics; extended techniques notated so a performer can
play them; balance, the orchestral pyramid, and doubling as colour rather than
volume; and holding twenty minutes together with thematic transformation,
pacing and transitions that are prepared.

**The Hall of a Hundred Staves.** The deepest area in the dungeon, at level 25.
Eleven rooms — a half-copied score somebody has to finish, a transposing gate
where only one of four doors is in the right key, a vault of passages that were
written and then refused by an orchestra, a drawer that only opens once every
other door in the Hall has — and at the podium, the Silent Orchestra:
ninety-nine players who will play exactly what is on the page and nothing you
meant but did not write.

**The score maker is in the deep trials.** Trials at difficulty 8 and above,
and anything about orchestration, are now written on a real full score rather
than the piano roll — every part, every staff, the proper engraver, with the
page widened to give a score the room it needs. The dungeon learned to grade
one: your score is flattened to sounding pitch through each instrument's own
transposition, and the harmony read back out of what actually sounds, bar by
bar.

**Five of the twelve keys in the game were wrong.** The key reader understood
"F♯" but not "F-sharp", which is how the game writes them — so a trial that
said B-flat major was set, and graded, in B major. Every spelling is fixed and
checked.

**Smaller things.** XP counts up rather than simply being there. Levelling up
lights the card. Conquering a trial and felling a boss both get a burst of
light, and the boss's health bar takes the hit. And the score maker no longer
tries to draw a page with a negative width on a very narrow window.

## What's new in v1.13.1

**An update can no longer break the app.** Applying v1.13.0 could leave an
install with its built pages gone — the app would not start, and the only way
back was reinstalling. The cause was the rollback: it deleted the live app
folder with any errors ignored, then moved the saved copy over the remains. If
that delete only partly succeeded, because antivirus or a process still
shutting down held a file open, what was left was an app directory with the
locked files still in it and everything else missing. Sorry — that one was
mine.

Three things now stand between an update and your working copy:

- The downloaded files are checked for completeness **before** anything is
  replaced. If the download is short, the update refuses to install and your
  existing copy is genuinely untouched, which is what the message always
  claimed.
- Rolling back is renames only. A rename cannot half-happen, so there is no
  longer a moment where the app folder is partly deleted.
- The app is checked again after the swap, and put back if it is not right.

**And it can fix itself without the internet.** An update that goes wrong
leaves the version it replaced sitting right there on disk. The launcher now
puts that back automatically, so the app opens on the previous version and
updates again next time — instead of asking you to download it all again or
reinstall.

The unpacking was also rewritten to count what it writes, so files disappearing
as they arrive is reported rather than silently producing a broken install.

## What's new in v1.13.2

**A hiccup while adding new content can't cost you the app any more.** An
update does two things: it puts the new program in place, and it writes the
new lessons, areas and bosses into your database. Until now, if the second one
stumbled — and something as ordinary as antivirus holding the database open
for a second is enough — the updater treated it as "this version does not
work" and put the whole thing back. That was the trigger for the damage
v1.13.1 fixed.

Only the part that decides whether the app can run at all is allowed to fail
an update now. If the new content doesn't finish writing, the update still
stands, the game still opens, and it quietly finishes the content the next
time you launch it.

**And the release checks now run that half too.** The check that proves an
older database can be brought up to date never actually ran the content step —
the one place where a real player's database differs from a developer's. It
does now, against a database built from the schema at every version the game
has ever shipped, twice each, plus a deliberately failing content step to
prove a failure there costs nothing but a short wait.
