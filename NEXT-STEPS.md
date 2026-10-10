# Where this is, and the one thing left

Updated 2026-10-10. Delete this file once the box below is ticked.

## The online game is live and verified

<https://composers-dungeon.vercel.app>

The two-player test ran against it at 21:37 UTC and all fourteen checks
passed. Two accounts signed up in separate browsers, both joined The
Composer's Guild, one posted, and the other saw the post with the right
author on it. The test accounts were deleted afterwards.

```
ok    both accounts exist in the live database
ok    both joined the SAME guild
ok    the second player sees the first player's post
ok    and sees who wrote it
ok    the updater is hidden on a hosted instance
ok    CD_HOSTED is set on the deployment
```

Getting here took three fixes beyond the code: the deploy was reading a
revoked token (see below), the project was missing `NEXTAUTH_SECRET`, and
Vercel's deployment protection was bouncing every visitor to a Vercel login.
All three are settled.

Because the desktop launcher now points at this same server, a player on the
Windows installer and a player in a browser share one account system, one
guild and one library.

## ☐ Turn GitHub Pages on, for the download page

**Settings → Pages → Build and deployment → Source: GitHub Actions**, then
re-run **Download site**.

Every run so far has failed with `Not Found` from the Pages API, which means no
Pages site exists for the repository yet. Nothing in the repo can create one.
On a free plan Pages also needs the repository to be public; that screen says
which of the two is stopping it.

## What is set on the Vercel project

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled, with `pgbouncer=true&connection_limit=1` |
| `DIRECT_DATABASE_URL` | Neon direct |
| `DATABASE_PROVIDER` | `postgresql` |
| `CD_HOSTED` | `1` |
| `NEXTAUTH_SECRET` | generated in the run, never printed |
| `CD_ADMIN_EMAIL` | `knwilliams0512@gmail.com` |

`CD_ADMIN_EMAIL` is the only account allowed to configure the mail sender, and
without a sender nobody can reset a password — so sign up with that address
first. An earlier version of this note named a different address, which was
wrong; this is the one the deploy actually set. If you want it to be a
different mailbox, it is one field in Vercel's environment variables, or one
re-dispatch of the deploy with another value.

`NEXTAUTH_URL` is deliberately unset — the app falls back to Vercel's own
production domain, which is known to it without anyone having to learn the URL
before the first deploy produced it.

## What changed, and what it fixed

- **The deploy was reading a revoked token.** GitHub refuses to create a secret
  whose name already exists, so the replacement token landed beside the old one
  as `VERCEL_TOKEN_` rather than over the top of `VERCEL_TOKEN`. Six runs died
  on a token that could never work. Both names are now tried and whichever
  Vercel accepts is used. Asking Vercel is the only test that separates them: a
  revoked token keeps its length and its `vcp_` prefix, so the fingerprint the
  workflow printed called it well-formed right up to the point it was refused.
- **A latent bug that fix exposed.** The three steps that deploy each declared
  `VERCEL_TOKEN` in their own `env:`, and a step-level `env:` entry overrides
  `$GITHUB_ENV` — so the trimmed, verified value was being silently replaced by
  the raw secret further down the job. They inherit it now.
- **Signed-out players were sent to next-auth's own generic page** rather than
  this app's login screen, on all twelve protected routes. `middleware.ts`
  re-exported next-auth's default, which silently ignores configuration.
- **The installed Windows app now joins the shared world** instead of running a
  private SQLite copy, and falls back to local play when the server cannot be
  reached. `check-launcher.mjs` enforces that no database credential is ever
  shipped to a player's machine.
- **Two checks in the live test could never fail** — one looked for text the app
  does not contain, the other asked a question that is true when signed out.
  Both had been printing `ok` since they were written.
- **The README and landing page stated counts that were wrong.**
  `npm run check:claims` now holds every one of them to the seed data.

19 checkers pass, the typecheck is clean, and both the desktop (SQLite) and
hosted (Postgres) builds compile.
