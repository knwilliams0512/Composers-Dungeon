# Where this is

Updated 2026-10-10. Nothing here is blocking; it is the state of play.

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

## The installed app, and getting onto the server

Torchfire exists on the server at max level (200, all 9 skills), and the
deploy is green end to end: alias parsed, `/login` answering 200 on the
production alias.

**The installer is the part that lagged.** `serverUrl` support landed on
2026-10-10; the newest release, v1.18.1, was built on 2026-10-05. So no
installer anyone had ever downloaded contained the code that points the app
at the server, and the app on disk had been playing its own local SQLite
world the whole time -- correctly, because that is what it does when no
server is reachable. A build from this branch exists as an artifact on the
Windows installer run; installing it is what moves the app into the shared
world.

A local save does **not** migrate. An account made offline lives in the
SQLite file on that machine; signing in online is a separate character.
`scripts/grant-level.ts` exists partly to take the sting out of that.

## What this cost, and the check that was missing

Three things blocked the online game this week and none of them were in the
code: a revoked token stored under a near-miss secret name, Vercel's
deployment protection, and an installer predating the feature. Every one
looked identical to a code bug from inside the repository.

The deploy's own serving check then failed twice on deploys that were
serving players perfectly well, because it asked the per-deployment URL --
which Vercel keeps behind SSO by design, even when the alias is public. It
now asks whether ANY of the project's addresses serves, which is the
question that was always meant.

What is still missing is a check that starts at the installer rather than at
the server. Every check in this repository begins after the app is already
talking to something; none of them would have noticed that the shipped
launcher could not talk to anything at all.

## The download page is deliberately not published

itch.io is the download channel, and Steam is coming, so the GitHub Pages
page is not needed. It is also not possible as things stand: the repository
is private, and Pages requires either a public repository or GitHub Pro.

`site/` and `.github/workflows/pages.yml` are kept rather than deleted. The
workflow only runs on pushes that touch `site/**`, so it costs nothing sitting
there, and the cover art and copy are reusable for the itch.io page. If the
repository ever goes public, the page needs one switch: **Settings → Pages →
Build and deployment → Source: GitHub Actions**, then re-run **Download site**.

Two consequences of the repository being private, both already handled:

- **Release assets need a GitHub login**, so the installer cannot be
  downloaded from GitHub by a player. itch.io serves it instead.
- **The update feed lives on those releases**, so the shipped app can never
  reach it. `installer/update-config.json` has `enabled: false` rather than
  leaving a check that fails on every launch. The `feedUrl` is still there, so
  re-enabling is one word if releases ever become public.

## Hosting plans, and the one that could still bite

| | Plan | Status |
|---|---|---|
| Neon | paid | Fine. The free tier's 100 compute-hour monthly ceiling does not apply. |
| Vercel | Hobby | Fine **only while the game is free.** |
| GitHub | Free | Fine. Private repo, so no Pages. |

Vercel's Hobby plan is non-commercial only — their fair-use guidelines define
commercial use as any deployment serving "the financial gain of anyone
involved in any part of the production of the project". The game is free on
itch.io and will be free on Steam, so Hobby covers it today. **If it ever
becomes paid, the backend has to move to Vercel Pro ($20/user/mo) before
launch, not after.** That is the one item on this page that is a deadline
rather than a note.

Also for the Steam build: Steam patches games itself, so the shell updater
must stay off there. It is already off, but confirm it deliberately when
packaging rather than relying on that.

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

29 checkers pass, the typecheck is clean, and both the desktop (SQLite) and
hosted (Postgres) builds compile.
