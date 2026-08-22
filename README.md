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

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env — at minimum set a real NEXTAUTH_SECRET:
#   openssl rand -base64 32

# 3. Initialize the database (creates prisma/dev.db)
npx prisma generate
npx prisma db push

# 4. Seed demo content (lessons, dungeons, bosses, artifacts, demo user)
npm run db:seed

# 5. Start
npm run dev        # development, http://localhost:3000
# or
npm run build && npm start   # production
```

One-liner: `npm run setup && npm run dev`

**Demo account:** `bard@composersdungeon.demo` / `dungeon-demo-1` — a
mid-progress composer with skills, completed lessons, and a public guild post.

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
