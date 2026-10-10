# Putting Composer's Dungeon online

The desktop app keeps everything in a SQLite file on the player's own PC. That
is why its guilds only ever contain "the other composers on your PC" — not
because the social features are missing, but because each copy has a database
nobody else can reach.

Every multiplayer feature already exists and is already written against the
database: guilds, membership, guild chat, the Guild Hall, collaboration
projects, the three raid bosses, following other composers. **Going online is a
database and hosting change, not a feature build.** Point the same app at one
shared Postgres and players find each other.

Nothing here changes the Windows app. It keeps its own SQLite file, its own
installer and its own updater, and is unaffected by anything below.

---

## What you need

| | |
|---|---|
| A Postgres database | Where everyone's accounts and guilds live |
| Somewhere to run the app | A Node server, or a Docker host |
| A `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| A public URL | Reset links are built from it |

You also want a sender for email, configured in-app under **Settings → Email**.
Without one, a hosted instance cannot reset anybody's password — it will say so
plainly rather than pretend otherwise. Set `CD_ADMIN_EMAIL` to the address you
sign up with: on a server, only that account may change the sender, because the
sender decides where every reset mail goes and any other player who could
change it could point them all at a mailbox of their own.

---

## The cheapest path — about $0 to start

**Vercel Hobby (free) + Neon (free).**

Be aware of two real limits before you pick it:

- **Vercel Hobby is licensed for non-commercial personal use.** Fine while the
  game is free. The moment you charge for anything, it is Pro at $20/user/month
  billed annually, or $24 monthly.
- **Neon's free tier gives 100 compute-hours a month.** Its smallest always-on
  compute is 0.25 CU, so that buys roughly 400 hours of non-idle database out
  of the 730 in a month. With players spread through the day the database
  rarely gets to sleep and you run dry around day 16. Storage is a non-issue
  (a fully seeded database is a couple of megabytes).

So: genuinely free, genuinely fine for getting online and playing with a dozen
or so people, not a home for a game with players on most of the day.

### Steps

1. **Create a Neon project.** Copy both connection strings it gives you: the
   *pooled* one and the *direct* one.
2. **Create the schema and content.** With a `NEON_API_KEY` in the environment
   there is a script for it, which reads both connection strings, pushes the
   schema, seeds the content and writes `.env.hosted.local` with everything the
   host needs:

   ```sh
   NEON_API_KEY=... ./scripts/neon-bootstrap.sh
   ```

   A note on Neon's own onboarding steps, which do not all apply here:
   `neon login` signs in through a browser and cannot complete in a headless
   session — the API key is the documented non-interactive path. And
   `neon config init` + `neon deploy` apply a `neon.ts` policy of services,
   functions and auth to a branch; they do not host a Next.js app, so they do
   not replace Vercel, and the scaffolded policy's `auth: true` enables Neon
   Auth, a second identity system this app has no use for — it already
   authenticates with NextAuth against its own `User` table.

   To do the same by hand instead:
   ```sh
   export DATABASE_URL="<neon DIRECT url>"
   export DIRECT_DATABASE_URL="$DATABASE_URL"
   npm run make:pg-schema
   npm run db:push:hosted
   npx prisma generate --schema prisma/schema.postgres.prisma
   npx tsx prisma/seed.ts
   ```
   Use the **direct** URL here. A pooler cannot run the statements that create
   tables.
3. **Import the repo into Vercel.** Set the Build Command to
   `npm run build:hosted` and add these environment variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Neon **pooled** URL, with `?pgbouncer=true&connection_limit=1` |
   | `DIRECT_DATABASE_URL` | the Neon **direct** URL |
   | `DATABASE_PROVIDER` | `postgresql` |
   | `CD_HOSTED` | `1` |
   | `NEXTAUTH_URL` | your Vercel URL, no trailing slash |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `CD_ADMIN_EMAIL` | the address you will sign up with |

   The pooled URL is what the running app uses, because a serverless function
   must not hold a real Postgres connection open. The direct URL is what
   migrations use.
4. **After every deploy that changes the schema or the lessons**, re-run step 2
   against the direct URL. Vercel will not do it for you.

---

## The path I'd actually pick — about $5/month

**Railway Hobby**, which takes the `Dockerfile` in this repo as-is.

$5/month including $5 of usage credit (a card is required since March 2026). No
commercial-use clause, no cold starts, no compute-hour cliff, app and Postgres
in one project — and because it runs the standalone server the same way the
desktop app does, it is the smallest change of any option. A moderate Next.js
app is commonly reported at $8–15/month under real traffic; a game this size
with light traffic should sit inside the credit or just over it.

### Steps

1. New Railway project → **Add Postgres**.
2. **Deploy from this repo.** Railway detects the `Dockerfile`.
3. Set these variables on the app service:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `DIRECT_DATABASE_URL` | the same value |
   | `NEXTAUTH_URL` | your Railway domain, no trailing slash |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `CD_ADMIN_EMAIL` | the address you will sign up with |

   `DATABASE_PROVIDER`, `CD_HOSTED`, `PORT` and `HOSTNAME` are already set by
   the Dockerfile.
4. Deploy. That is all — the container brings the database up to the build and
   seeds the content itself on first boot.

The same Dockerfile runs unchanged on Render, Fly.io or any VPS.

---

## What the container does on boot

`scripts/docker-entrypoint.sh` runs two steps before starting the server, every
time:

1. `prisma db push` against `prisma/schema.postgres.prisma` — additive. It adds
   what this build expects and *refuses*, rather than performs, a change that
   would drop data.
2. the seed — written to be re-run. It upserts the curriculum and replaces only
   content rows (quiz questions, exercises, exam papers).

So a redeploy delivers new lessons, areas and fixes to everyone already
playing without touching a single account, composition, membership or guild
post. That was verified against a database holding real accounts, guild
memberships and posts: every row survived. It is the same thing
`installer/upgrade.js` does for the desktop app, so a hosted instance and an
installed copy stay on the same content by the same means.

---

## How the two builds stay in step

`prisma/schema.prisma` (SQLite) is the single source of truth.
`prisma/schema.postgres.prisma` is **generated** from it by
`npm run make:pg-schema` — Prisma forbids `env()` in a datasource provider, so
one file genuinely cannot serve both.

`npm run check:schemas` proves the generated file is exactly what the source
derives to and that the two differ in nothing but the datasource block. It runs
as part of `npm run check:all` and inside the Docker build, so the hosted
instance and the desktop app cannot end up describing different tables.

**Never edit `prisma/schema.postgres.prisma`.** Edit the SQLite schema and
re-run `npm run make:pg-schema`.

---

## Two differences between the engines that the app handles

- **`LIKE` and case.** SQLite ignores case, Postgres does not, so without help
  the library search would stop finding "Fugue in D" when you type "fugue".
  `src/lib/db-provider.ts` picks the right filter from `DATABASE_PROVIDER`.
  Set that variable, or search quietly breaks with no error.
- **Password resets.** On a desktop copy the app can hand you a reset link
  through a file on your own disk. On a server nobody can read that file, so
  with `CD_HOSTED=1` the app never writes one — it requires a configured
  sender, and says clearly when there isn't one. It also gives the same answer
  whether or not an account exists, including when sending fails, so a broken
  mail setup cannot be used to discover who has an account.

---

## Running it locally against Postgres

```sh
export DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/composers_dungeon"
export DIRECT_DATABASE_URL="$DATABASE_URL"
export DATABASE_PROVIDER=postgresql
export CD_HOSTED=1
export NEXTAUTH_URL="http://127.0.0.1:3000"
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"

npm run make:pg-schema
npm run db:push:hosted
npx prisma generate --schema prisma/schema.postgres.prisma
npx tsx prisma/seed.ts
npm run build
node .next/standalone/server.js
```

To go back to desktop/SQLite development afterwards, regenerate the client
against the SQLite schema:

```sh
npx prisma generate
```
