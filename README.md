# 🕯️ Composer's Dungeon

**The Academy teaches you. The Dungeon tests you.**

Composer's Dungeon is an educational music theory & composition platform fused
with an RPG progression game. A complete beginner can start with no theory
knowledge, learn through structured Academy lessons, then descend into a
fantasy Dungeon: composition challenges, theory puzzles, creative Curses,
collectible artifacts, musical bosses with health bars, XP, per-skill leveling,
composer specializations — all the way to the Cathedral of Composition and the
final boss, **The Forgotten Composer**.

## Tech Stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 14 (App Router) + React 18 + TypeScript     |
| Styling    | Tailwind CSS (dark, cinematic custom theme)         |
| Database   | SQLite via Prisma ORM (zero-setup; swappable)       |
| Auth       | NextAuth (credentials, bcrypt, JWT sessions)        |
| Validation | zod — every mutation validated server-side          |

All XP, levels, skill progression, boss damage, achievements, artifacts, and
streaks are computed **exclusively server-side** (`src/lib/progression.ts`).
Clients submit actions, never numbers.

## Install on Windows

**One file. Double-click it. Done.**

Grab **`ComposersDungeonSetup.exe`** from the
[Releases page](https://github.com/knwilliams0512/Composer-s-Dungeon/releases)
and run it. It installs for your account only — no administrator password, no
Node.js, no Git, no npm, no build step, no internet connection. The Node
runtime, the compiled app and a database already stocked with all 25 lessons,
9 dungeon areas, 4 bosses, 8 artifacts and 15 achievements are inside the
installer. Setup takes about a minute and ends with **Composer's Dungeon** on
your Desktop and in your Start menu.

### Windows will warn you — this is expected

The installer isn't code-signed (a certificate costs a few hundred dollars a
year), so Windows treats it like any other unsigned program:

1. **Downloading:** your browser may say *"this file may be unsafe"* or
   *"isn't commonly downloaded"*. Click the **⋯** next to the download →
   **Keep** → **Keep anyway**.
2. **Running:** a blue **"Windows protected your PC"** box appears. Click
   **More info**, then **Run anyway**.

Both prompts mean "we don't recognise the publisher", not "we found something
bad." Nothing is downloaded at install time and the app never opens a network
port beyond `127.0.0.1`.

### Updates install themselves

You never reinstall. Every launch, the app quietly asks the release feed
whether there is a newer version; if there is, it downloads the update package,
**verifies its SHA-256 against the published checksum**, stops the server,
swaps the app directory, applies any pending database migrations, re-runs the
(idempotent) content seed so new lessons and areas appear, and starts up — all
before the window opens. If the check fails, times out, or you are offline, it
starts normally: an update is never the reason the app will not open. A failed
swap rolls back to the previous copy.

Your data is never part of that: compositions, levels, streaks and guild posts
live in `data\` and are not touched. **Settings → Updates** shows the installed
version, checks on demand, and installs on request.

### Using it

Launch from the Desktop or Start-menu shortcut. It opens in its own window —
no address bar, no tabs, no browser. Closing the window stops the server, like
any normal program. The app is entirely local: your compositions, levels and
streaks live in `%LOCALAPPDATA%\ComposersDungeon\data`, and nothing leaves
your PC.

**Demo account:** `bard@composersdungeon.demo` / `dungeon-demo-1` — a
mid-progress composer with skills, completed lessons, and a public guild post.
Or sign up fresh to go through onboarding and the adaptive Placement Trial.

**Pin it to the taskbar:** once open, use the window's `…` menu →
**Install Composer's Dungeon**. Windows then gives it a Start-menu entry and
jump-list shortcuts straight to the Academy, the Dungeon and today's Daily
Trial. (There's also an **Install as App** button in the sidebar.)

**Uninstall:** Settings → Apps → Composer's Dungeon, or the Start-menu entry.
It asks before deleting your save, and backs it up to your Desktop first.

### Building the installer yourself

Runs on Linux or macOS — no Windows machine required:

```bash
sudo apt-get install -y nsis      # or: brew install makensis
npm ci
scripts/windows/build-installer.sh
# -> dist/ComposersDungeonSetup.exe
```

The script fetches a Windows Node runtime, generates the Prisma client with
the Windows query engine, builds the Next.js standalone server, seeds a fresh
database to ship, and compiles everything into one NSIS installer. Pushing a
`v*` tag runs the same script in CI and attaches the result to a GitHub
Release (`.github/workflows/windows-installer.yml`).

### Installing from source instead

If you'd rather run the code directly than install a binary, the repo also
carries a scripted setup: unzip a **Code → Download ZIP** and double-click
**`Install Composers Dungeon.bat`**, or paste this into PowerShell (works once
the repository is public):

```powershell
irm https://raw.githubusercontent.com/knwilliams0512/Composer-s-Dungeon/HEAD/scripts/windows/install.ps1 | iex
```

That route installs Node and Git via winget, then builds from source. Note
that browsers block `.bat` downloads, so download the whole ZIP rather than
the single file.

| Task | Do this |
| --- | --- |
| Update a source install | `npm run win:update` (progress is preserved) |
| Run on a different port | `npm run win:start -- -Port 3005` |
| Force-stop a stuck server | `npm run win:stop` |
| Remove a source install | `npm run win:uninstall -- -RemoveFiles` |

## Quick Start (macOS, Linux, or manual)

```bash
# 1. Configure environment
cp .env.example .env
# edit .env — at minimum set a real NEXTAUTH_SECRET:
#   openssl rand -base64 32

# 2. Install deps, create prisma/dev.db, seed lessons/dungeons/bosses
npm run setup

# 3. Start
npm run dev                  # development, http://localhost:3000
npm run build && npm start   # production
```

Same demo account as above. On macOS and Linux you can install it as a desktop
app the same way: open it in Chrome or Edge and use the address bar's install
icon (or **⋮ → Cast, save and share → Install page as app**).

### Migrations

This project uses `prisma db push` for friction-free local setup. For
migration-tracked workflows:

```bash
npm run db:migrate     # prisma migrate dev
npm run db:reset       # drop, re-push, re-seed
```

To move to PostgreSQL, change `provider = "postgresql"` in
`prisma/schema.prisma` and set `DATABASE_URL`; the string-based enum fields can
then be promoted to native Prisma enums (their canonical values live in
`src/lib/enums.ts`).

## What's Inside

### The Composer (everywhere you write)
Composition happens **inside the app**. A trial hands you a finished brief —
key, mode, meter, length, instrument, tempo — and a grid where every row is a
note that belongs to that key, so a beginner cannot play a wrong note. Click to
place, click again to remove, press play to hear it through a Web Audio
synthesiser built into the page. A harmony lane adds one chord per bar, named
in Roman numerals.

Beside it, **The Standard**: the machine-checkable requirements this piece must
meet, updating live as you write. Fills every bar, stays in key, ends on the
tonic, one clear climax, mostly stepwise, leaps resolved, a motif that returns,
strong beats on chord tones, a V–I cadence — sixteen checks in
`src/lib/score.ts`, assembled per trial by difficulty and by the skill the area
trains. **Submitting runs those same checks server-side**, and a piece that
does not meet them does not pass the level. Nothing is taken on trust.

Freedom is earned. The **Apprentice** tier gives one octave, in key, two note
lengths — deliberately small, because a blank page with infinite options is the
main reason beginners write nothing. Levelling or finishing lessons unlocks
eighth notes and harmony, then two octaves and all seven diatonic chords, then
chromatic notes and control of the setup, up to **Virtuoso**: three octaves,
thirty-two bars, nothing held back.

### The Workshop (`/workshop`)
The custom-level area: no trial, no judge. Choose your own key, mode, meter,
length, tempo and instrument (as your tier allows), optionally hold yourself to
any of the standards, and write. Everything saves to the Library, where each
piece plays back and draws itself as a piano roll.

### The Academy (`/academy`)
25 seeded lessons spanning seven experience tiers — from *What Are Musical
Notes?* to *Writing Virtuoso Repertoire* (including the difference between
musically effective difficulty, idiomatic virtuosity, and physically
unrealistic writing). Every lesson: concept → examples → quiz (server-graded,
70% to pass) → practice exercise → composition exercise → XP + skill rewards.
Prerequisite chains gate progression. Every lesson also carries the depth a
good teacher adds around a concept: a **summary** of what you walk away with,
a **vocabulary** list, the **mistakes everyone makes first** and how to fix
them, **recordings to go and listen to** with a line on why each one matters,
and a **five-minute drill**. The composition exercise opens the composer with a
setup chosen to suit the lesson — the minor-scales lesson in A minor, the
time-signature lesson in 3/4 — and standards that check you applied the idea.

### The Dungeon (`/dungeon`)
Nine areas (Hall of Melody, Crypt of Harmony, Tower of Rhythm, Hall of the
Virtuoso, Ancient Conservatory, Impressionist Gardens, Frozen Conservatory,
Inferno of Virtuosity, Cathedral of Composition) with level/tier gating.
Room types: Challenge, Puzzle (interactive, solutions checked server-side),
Curse (creative restrictions), Treasure (artifacts), Rest, and Boss rooms.
A weighted **challenge generator** assembles endless challenges from 60+
database components (keys, meters, lengths, instruments, styles, requirements,
restrictions) while filtering nonsense combinations, then turns each one into a
composer brief and a gradeable standard. Areas carry lore, a danger rating and
survival advice; the **Ancient Motif** artifact grants rerolls.

### Bosses (`/bosses`)
Four bosses with HP, phases, objectives, tactics, backstory and artifact
rewards — The Pale
Soprano, The Iron Metronome, The Chromatic Serpent, and the five-movement
final encounter **The Forgotten Composer**. Objectives deal damage; the final
blow requires submitting the finished composition.

### Progression
- Overall Composer Level (`100 · n^1.4` XP curve)
- Nine individual skills (Melody, Harmony, Rhythm, Form, Technique,
  Expression, Instrumentation, Counterpoint, Orchestration) with their own
  levels and meters
- **Creative Flame** daily streak: +10% XP while burning, milestone rewards at
  1/7/30/100 days, and forgiving **Rest Days** that protect a missed day
- Encouraging recommendation engine (weakest skill → matching dungeon area)
- 15 achievements, 8 artifacts, 5 unlockable composer specializations
  (Virtuoso, Impressionist, Classicist, Cinematic, Experimentalist)
- **Daily Dungeon Challenge** generated fresh each UTC day

### Onboarding
Experience tier selection (7 tiers up to Virtuoso Repertoire), multi-goal
selection, an **adaptive Placement Trial** (difficulty follows your answers;
result recommends a tier, strongest/weakest skill, and a dungeon), and musical
interest selection — all persisted to the profile.

### The Library (`/library`)
Compositions (with public/private toggle and free submissions), challenge
history, completed lessons, boss victories, artifact collection, achievements —
searchable and sortable.

### The Composer's Guild (`/guild`)
Posts (optionally with an attached **public** composition), likes, comments,
follows, and public composer profiles. Private profiles and private
compositions are never exposed — enforced in queries, not just UI.

## Project Layout

```
public/
  manifest.webmanifest # PWA manifest — makes it installable as a desktop app
  sw.js                # minimal service worker (installability + offline page)
  icons/               # icon.svg source + rendered PNG/ICO
installer/
  composers-dungeon.nsi  # the .exe installer (per-user, no admin needed)
  app-launcher.ps1       # launcher shipped inside the installed app
  launch.vbs             # starts it with no console window
scripts/windows/
  build-installer.sh   # builds ComposersDungeonSetup.exe (runs on Linux)
  install.ps1          # source install: prereqs -> build -> shortcuts
  start.ps1            # source launcher: free port -> server -> app window
  launch.vbs / update.ps1 / stop.ps1 / uninstall.ps1
prisma/
  schema.prisma        # all models (see header note on enums)
  seed.ts              # idempotent seed
  seed-data/           # lessons, world (areas/bosses/artifacts), components
src/
  app/                 # App Router pages
    (auth)/            # login, signup, forgot/reset password
    (app)/             # authenticated shell: hall, academy, dungeon,
                       # bosses, library, guild, profile
    onboarding/
    api/auth/          # NextAuth route
  components/          # UI by feature (composer, academy, dungeon, bosses, …)
    composer/          #   ScoreEditor, ScorePlayer, Workshop
  lib/                 # domain logic:
    score.ts           #   the score format, music theory, and the check engine
    composer-freedom.ts#   what the editor lets you do, by tier
    challenge-brief.ts #   challenge -> composer brief + standard
    lesson-brief.ts    #   lesson -> composer brief + standard
    desktop.ts         #   installed-app awareness (version, update feed)
    enums.ts           #   canonical enum unions
    xp.ts              #   leveling math
    streak.ts          #   Creative Flame
    progression.ts     #   the award engine (transactional)
    achievements.ts    #   criteria evaluation
    challenge-generator.ts
    recommendations.ts
    daily.ts           #   daily challenge
    auth.ts / db.ts / validation.ts
  server/actions/      # "use server" mutations, all auth-checked + zod-validated
  middleware.ts        # route protection
```

Adding content requires no code changes for most cases: new lessons, bosses,
areas, artifacts, achievements, and challenge components are rows in
`prisma/seed-data/` — the systems that consume them are generic.

## Security Notes

- Passwords hashed with bcrypt; sessions are JWT via NextAuth
- Every server action resolves the user from the session (`requireUserId`)
  and checks ownership before writing
- Puzzle solutions and quiz answers never reach the client
- Password reset uses expiring one-time tokens (the link is surfaced in-app
  because no mailer is configured; wire `requestPasswordReset` to email for
  production)
- Set a strong `NEXTAUTH_SECRET` in production
