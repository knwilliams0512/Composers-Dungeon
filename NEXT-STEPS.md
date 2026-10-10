# Where this is, and the one switch left

Updated 2026-10-10. Delete this file once both boxes are ticked.

## The short version

The deploy works end to end now. The run at 20:08 UTC authenticated with
Vercel, read both Neon connection strings, linked the project, set all six
environment variables, built in one minute and aliased the result to
<https://composers-dungeon.vercel.app>.

So the thing that blocked this all along — the Vercel project having no
`NEXTAUTH_SECRET` — **is fixed**. The site is built, configured and pointed at
the Neon database holding the full curriculum.

It is still not reachable by players, for one new reason, and it is a toggle
rather than a bug.

## ☐ 1. Let people in without a Vercel login

The deploy's own output said it:

```
! Deployment Protection is on for this project (Vercel Authentication).
```

and the check that follows saw the consequence:

```
attempt 1: /login -> 302
...
The deployment is not serving /login (last code 302).
```

Vercel switches Deployment Protection on for every new project. It means each
request is bounced to a Vercel SSO login, so only someone signed in to the
Nexus team can open the site. For a staging dashboard that is a sensible
default. For a game strangers are meant to sign up to, it keeps everybody out,
and no amount of correct code or environment would show anything but that 302.

**Vercel → the `composers-dungeon` project → Settings → Deployment Protection
→ Vercel Authentication → *Only Preview Deployments*** (or *Disabled*).

*Only Preview Deployments* is the better of the two: the production alias that
players are given is public, while preview builds stay behind the login.

Then dispatch **Deploy the online game** again, or go straight to **Verify the
online guild** with `https://composers-dungeon.vercel.app` — the deployment
already up is fine, it was only ever the door that was locked.

The deploy could do this itself through Vercel's projects API, and a step for
it was written and tested, but it is deliberately not in the repository:
automatically removing an access control is the owner's call, not something to
slip into a commit. The toggle above is the one place it belongs.

## ☐ 2. Turn GitHub Pages on, for the download page

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
