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

## Install on Windows (as an app)

**One line. Nothing else needed** — not even Node or Git; the installer fetches
them for you. Open **PowerShell** (Start menu → type "PowerShell" → Enter) and
paste:

```powershell
irm https://raw.githubusercontent.com/knwilliams0512/composer-s-dungeon/claude/composers-dungeon-fullstack-8aire4/scripts/windows/install.ps1 | iex
```

It installs Git + Node.js LTS if they're missing, downloads the app to
`%LOCALAPPDATA%\ComposersDungeon`, generates a real `NEXTAUTH_SECRET`, builds
the database with all 25 lessons / 9 dungeon areas / 4 bosses, compiles the
production bundle, and puts **Composer's Dungeon** on your Desktop and Start
menu. First run takes a few minutes; after that it opens in seconds.

*Prefer clicking to typing?* Download the repo
(**Code → Download ZIP**), unzip it, and double-click
**`Install Composers Dungeon.bat`**.

### Using it

Launch from the Desktop or Start-menu shortcut. The app opens in its own
window with no browser chrome, address bar or tabs — closing the window shuts
the server down, like any normal program. `Play Composers Dungeon.bat` does the
same thing if the shortcut ever goes missing.

**Pin it to the taskbar / Start:** once it's open, use the window's `…` menu →
**Install Composer's Dungeon**. Windows then treats it as a proper installed
app — taskbar pinning, its own Start-menu entry, jump-list shortcuts straight
to the Academy, the Dungeon and today's Daily Trial. (There's also an
**Install as App** button at the bottom of the sidebar.)

**Demo account:** `bard@composersdungeon.demo` / `dungeon-demo-1` — a
mid-progress composer with skills, completed lessons, and a public guild post.
Or sign up fresh to go through onboarding and the adaptive Placement Trial.

| Task | Do this |
| --- | --- |
| Update to the latest version | `npm run win:update` (progress is preserved) |
| Run on a different port | `npm run win:start -- -Port 3005` |
| Start the server without a window | `npm run win:start -- -NoWindow` |
| Force-stop a stuck server | `npm run win:stop` |
| Remove shortcuts | `npm run win:uninstall` |
| Remove everything | `npm run win:uninstall -- -RemoveFiles` (backs your database up to the Desktop first) |

Everything runs on your own machine. Nothing is uploaded, and nobody else can
reach it — the Guild is populated by accounts created on this install.

### If Windows gets in the way

| What you see | What to do |
| --- | --- |
| "Windows protected your PC" (SmartScreen) | **More info → Run anyway.** It fires for any unsigned script downloaded from the internet. |
| "running scripts is disabled on this system" | You launched the `.ps1` directly. Use the `.bat` or the `irm … \| iex` line — both bypass execution policy for that one run. |
| Installer can't find winget | You're on an older Windows 10. Install [Node.js LTS](https://nodejs.org) and [Git](https://git-scm.com/download/win) by hand, then run the installer again. |
| Nothing happens when you click the shortcut | Something already owns port 3000. Run `npm run win:start -- -Port 3005`, or `npm run win:stop` to clear a stuck server. |
| It opened in a normal browser tab | Edge and Chrome are both missing. Install either one for the windowed app experience. |
| Server errors on launch | Look in `logs\server.log` inside the install folder. |

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

### The Academy (`/academy`)
25 seeded lessons spanning seven experience tiers — from *What Are Musical
Notes?* to *Writing Virtuoso Repertoire* (including the difference between
musically effective difficulty, idiomatic virtuosity, and physically
unrealistic writing). Every lesson: concept → examples → quiz (server-graded,
70% to pass) → practice exercise → composition exercise → XP + skill rewards.
Prerequisite chains gate progression.

### The Dungeon (`/dungeon`)
Nine areas (Hall of Melody, Crypt of Harmony, Tower of Rhythm, Hall of the
Virtuoso, Ancient Conservatory, Impressionist Gardens, Frozen Conservatory,
Inferno of Virtuosity, Cathedral of Composition) with level/tier gating.
Room types: Challenge, Puzzle (interactive, solutions checked server-side),
Curse (creative restrictions), Treasure (artifacts), Rest, and Boss rooms.
A weighted **challenge generator** assembles endless challenges from 60+
database components (keys, meters, lengths, instruments, styles, requirements,
restrictions) while filtering nonsense combinations. The **Ancient Motif**
artifact grants rerolls.

### Bosses (`/bosses`)
Four bosses with HP, phases, objectives, and artifact rewards — The Pale
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
scripts/windows/
  install.ps1          # one-shot installer (prereqs → build → shortcuts)
  start.ps1            # launcher: free port → server → app window
  launch.vbs           # runs start.ps1 with no console flash
  update.ps1 / stop.ps1 / uninstall.ps1
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
  components/          # UI by feature (academy, dungeon, bosses, guild, …)
  lib/                 # domain logic:
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
