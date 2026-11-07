# Update 1.19 — Composer's Dungeon is online

The last devlog here was Update 1.0. Since then there have been 42 releases, and
the game has changed enough that "update" undersells it. The Academy has nearly
twice the lessons. The Dungeon is almost twice the size. The Studio turned into a
real notation program. And the headline: **the game is no longer something that
runs only on your own PC.**

Here is the whole of it, grouped by what you'd actually notice.

---

## The big one: one shared world

Every version before this shipped a private copy of the game. Your Guild was a
building with your name on every door — because the only accounts that could
ever exist in it were the ones you made yourself. That was never the intention;
it was just what a local database can do.

**Now there is one world and everyone is in it.** Guilds, posts, boosts,
collaborative pieces and raid bosses are shared with whoever else is playing.
Found a house and someone else can actually join it.

**You can play in your browser:** <https://composers-dungeon.vercel.app>

The Windows app and the browser are the same game against the same account —
sign in from either one and your composer, your progress and your guild are
there. Install it on a desktop, open it in a tab on a laptop, same character.

**Offline play is still here, and it's now a choice you make.** When the server
can't be reached the app tells you and offers to retry, play offline, or quit,
instead of quietly dropping you into a world only your PC can see. The two are
separate saves and nothing moves between them, so being put in the wrong one
without being told was the one thing worth a dialog for.

> **Please read this if you've been playing offline.** A character built on your
> own machine does not transfer to the shared world. It lives in a file on that
> PC; signing in online starts a new composer. There's no way around it — the two
> worlds were never connected. Sorry. It's the one cost of the change.

---

## The Academy: 25 lessons → 46

**It's a roadmap now,** not a list. Six levels and 37 numbered units, walkable in
order, with The Composer's Craft sitting beside it rather than buried in it. The
sixth — **The Full Score** — sits above Virtuoso, for people who finished
everything else.

**Every unit ends in an exam.** 37 of them, 322 questions, and the exam is
checked to actually cover the unit it closes rather than merely claiming to.
Failing doesn't say "62%, try again" — it lists the sections to go back to. No
answer key is ever sent to your browser.

**Every section of every lesson has a figure, and every figure plays.** 153 of
them. Press play and the figure runs, lighting up as it goes: a picture of a
minor third teaches half of what a minor third is, and the ear does the rest.
Eight kinds, each for what it's good at.

**The lessons teach what they were testing.** Basic Intervals explained how to
count letter names and never used the words major, minor or perfect. Minor Scales
covered natural minor and never harmonic or melodic — which the next harmony
lesson assumes you know. Triads named the diminished chord without saying what
one is. Note Values never mentioned the dot. Twenty new sections fix all of that.

**And 21 lessons had no depth at all** — no key terms, no common mistakes, nothing
to listen to, no practice routine — including the very first lesson in the game
and every orchestration lesson, while the lessons either side of them had all
four. All 46 carry it now: **210 key terms, 115 common mistakes with fixes, 99
recordings with a reason to hear each one, 139 practice steps.**

**Every lesson points at the drill that trains it.** 28 of them do. And none
sends you to a drill whose vocabulary it hasn't taught yet.

**Every question in the game was read by hand** — 159 lesson questions and 322
exam questions. Two real defects came out of it: one question asked word-for-word
in two different lessons at two different difficulties, and an exam pool whose
correct answers all sat in the same position — safe only because the sitting
shuffles them, which is now actually asserted instead of assumed.

---

## The Studio: from note editor to notation program

This is where most of the work went.

**The keyboard has its whole range** — a real piano's A0 to C8, where it used to be
three octaves fixed around middle C. It also can't write pitches outside what MIDI
has room for any more, which it previously could, silently producing files no
other program would open.

**Chord symbols are real harmony.** 29 qualities, picked by root, quality and slash
bass, with a preview as you build one — rather than text that happens to look like
a chord.

**Fermatas, pedal lines, fingering and repeat navigation.** Four fermata shapes
that hold for four different lengths. All three pedals with retake notches. Segno,
coda, D.C., D.S., To Coda, Fine, volta brackets and "play n times" — all printing,
and all exporting with the instruction a playing program obeys, not just the words
a reader sees.

**Holds hold and crescendos grow.** Playback used to be tick times a constant,
which is correct for a score with one tempo and no fermatas, and wrong for
everything else. A fermata printed and didn't hold. A hairpin printed and the
sound stayed exactly where the last dynamic left it. Both sound now, in the app
and in exported MIDI. An unresolved crescendo stays where it got to instead of
snapping back.

**Dynamics work.** Clicking *pp* then *ff* used to leave only *ff* — the mark went
in at the cursor, clicking didn't move the cursor, and two on the same beat
replaced each other, so however many you clicked the score kept exactly one.
Dynamics now go on the notes you've selected.

**Notes sound like notes.** Each instrument used to be a fixed stack of
oscillators, so every note had one unchanging tone and playing harder only made it
louder. There's a filter now that opens at the attack and closes across the note;
velocity changes brightness rather than just volume; there's a breath or bow or
hammer sound at the onset; high struck notes die faster than low ones; and
sections are very slightly detuned the way a real section is.

**Export carries the score now, not a sketch of it.** MusicXML was losing almost
everything above the notes — ties went out with a start and no stop, and
articulations, ornaments, tuplets, grace notes, dynamics, hairpins, octave lines,
lyrics, clef changes and mid-score key and time changes were all dropped.
Sixty-four notation features are now checked to survive the trip. MIDI was going out as bare
pitches: no time signature, no key signature, every tie retriggering as two notes,
printed dynamics ignored, the mix thrown away. **And every MIDI export in 6/8,
3/8, 2/2 or 12/8 played at the wrong speed** — the tempo was written as though the
marking were a quarter note, when it means one beat of the written metre. A 6/8
export ran at double speed.

**A score prints as sheets of music.** Printing used to hand you the app's
interface with the page furniture still attached.

---

## The Dungeon: 9 areas → 16

**93 rooms, up from 33, and 15 of them are secret** — and a secret is not a
locked door you can see. Six of the new areas exist specifically
to train skills the old map never tested.

**The Hall of a Hundred Staves** is the deepest area in the game, at level 25.

**Boss fights ask for music.** Every other place the game wanted a piece from you
took one; the bosses didn't. They do now, and the deep trials at difficulty 8 and
above are written on a full score rather than a single stave.

**10 bosses, up from 4** — and three of them are raids a *guild* fights rather than
a composer: **The Two Galleries**, **The Grand Dispute** and **The Work of Many
Lifetimes**.

**The six deepest areas were rated as the least dangerous in the game.** They had
no danger rating at all, and a missing rating defaulted to 1 — the same as the
first room you ever walk into. They have real ratings, lore and survival tips now,
and so do the six bosses that had no tactics written for them, which happened to
be the hardest fights in the game.

**21 artifacts, up from 8. 58 achievements, up from 15.** The old achievement set
could only ask about a handful of things; the engine learned eight new counts to
support the rest.

---

## Guilds became places

Joining a house used to add a label to your profile. Now it's somewhere you go:

- **A board** — post to your guild rather than to everyone.
- **A room** — live conversation with the rest of the house, which is a different
  thing from a board and now behaves like one.
- **Boosts** — lift a guildmate by name, with a note saying what you're lifting
  them for.
- **Pieces written together** — start a collaboration, one piece split into parts,
  and write it with the house.
- **Raids** — the three bosses above.

---

## The Proving Grounds

A new wing, and a different kind of challenge: **six timed recognition drills.**
It's the only place in the game that asks you to identify something by ear under
pressure. Seven achievements live there, two of which ask for a streak.

---

## Then and now

| | Update 1.0 | Update 1.19 |
|---|---|---|
| Lessons | 25 | **46** (153 sections, every one with a playable figure) |
| Unit exams | — | **37** (322 questions) |
| Dungeon areas | 9 (33 rooms) | **16** (93 rooms, 15 of them secret) |
| Bosses | 4 | **10** (7 solo, 3 guild raids) |
| Artifacts | 8 | **21** |
| Achievements | 15 | **58** |
| Ear-training drills | — | **6** |
| Instruments in the Studio | no Studio yet | **73** (12 ensemble templates) |
| Chord qualities | — | **29** |
| Players in your guild | you | **everyone** |

---

## Things that were quietly broken

Not features, but worth saying out loud:

- **Six rewards were being granted in silence.** Passing a quiz, finishing the
  practice, passing a unit exam — each awards XP and each said nothing, so your
  level could change without a word. Passing a unit, the biggest moment on the
  roadmap, announced itself with one grey line.
- **Eleven achievements could never fire** at the moment you earned them.
- **Passing a quiz first try paid nothing** — the quiz's own XP never arrived.
- **Five of the twelve keys in the game were spelled wrong** by the key reader.
- **Two composition exercises could not be completed by anybody.**
- **A full correctness audit of the music theory** — every quiz question, every
  exercise, every claim a lesson makes. The app now runs **32 automated checks**
  over its own content before any release: that every figure draws what its
  caption says, that no lesson is thinner than the one before it, that every
  chord symbol means what it prints, that holds hold, that every note the app
  can play is actually audible, and that every number the game states about
  itself is true.

That last one exists because the download page advertised 25 lessons, 9 areas and
4 bosses for several releases after all three had stopped being true. Numbers in
prose rot silently. Now they're checked.

---

## Accessibility

Text size, reduced motion, higher contrast, a reading font, and a skip link. In
Settings, from v1.9 onward.

Also: **you can turn the training wheels off.** Settings → *Give me the plain
version* drops the tier scaffolding if you'd rather just work.

---

## Getting this update

**In your browser:** nothing to do. <https://composers-dungeon.vercel.app>

**On Windows:** you need to install **v1.19.1** by hand, once. Copies from v1.19.0
and earlier have the self-updater switched off inside them — the releases it reads
were private at the time, so the feed returned nothing, and a check that silently
can't work is worse than no check. The repository is public now and the feed
serves, so the updater is back on.

**This is the last manual install.** After it, every launch checks for a newer
version, verifies the download against its published checksum, and swaps itself
out before the window appears.

Install it straight over your existing copy — your local save is kept. Windows
will warn you twice (the browser calling it uncommon, then SmartScreen); both mean
"we don't recognise the publisher", not "we found something bad" — the installer
isn't code-signed, which costs several hundred dollars a year. Every release
publishes its SHA-256 if you want to check the download yourself.

---

Thanks for playing. Eleven weeks, 42 releases, and the thing I'm happiest about
isn't any single feature — it's that the Guild finally has somebody else in it.

*— Composer's Dungeon*

<!-- ------------------------------------------------------------------------
FALLBACK — delete this whole comment block before posting.

itch.io's devlog editor is inconsistent about Markdown pipe tables. If the
"Then and now" table above renders as a wall of pipes, swap it for this:

**Then and now**

- Lessons: 25 → **46**, in 153 sections, every one with a playable figure
- Unit exams: none → **37**, with 322 questions
- Dungeon areas: 9 (33 rooms) → **16** (93 rooms, 15 of them secret)
- Bosses: 4 → **10** — 7 solo, 3 fought by a guild
- Artifacts: 8 → **21**
- Achievements: 15 → **58**
- Ear-training drills: none → **6**
- Instruments in the Studio: there was no Studio → **73**, with 12 ensemble templates
- Chord qualities: none → **29**
- Players who can be in your guild: you → **everyone**
------------------------------------------------------------------------- -->
