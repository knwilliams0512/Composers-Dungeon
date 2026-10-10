# Where this is, and the two things left

Written overnight on 2026-10-10. Delete this file once both boxes are ticked.

## The short version

The game is **online and serving** at <https://composers-dungeon.vercel.app>,
against a Neon Postgres holding the full curriculum. Accounts really are
created there — the overnight test signed two up and found both in the
database.

It is **not usable yet**, for exactly one reason: the Vercel project is missing
its environment variables. Nothing is wrong with the code or the database.

## What the live site says is wrong

The verification run reports, from the site itself:

```
FAIL  Smoke Test Aria signed up and holds a session
      last seen at /api/auth/error
      page said: Server error — There is a problem with the server
                 configuration. Check the server logs for more information.
```

That is NextAuth's message for a missing `NEXTAUTH_SECRET`. Without it nothing
can sign a session cookie, so signing up writes the account and then leaves the
player signed out, and every page that needs a session turns them away.

## ☐ 1. Give the Vercel project its environment

Two ways. Either finishes it.

**A — let the workflow do it (one secret).**

The deploy has now failed four times on the same thing, and the fifth run
finally said what it was. It prints a fingerprint of the secret before using
it:

```
secret fingerprint: 60 characters, starts "vcp_"
Error: The token provided via `--token` argument is not valid.
```

Well-formed, right length, right prefix, no stray whitespace — and rejected.
That combination means the token is **revoked**, and 60 characters is the
length of the very first token, the one that was revoked after being pasted
into a chat. So the secret was never actually replaced.

The likely cause is clicking **New repository secret** rather than the
**pencil** beside the existing row. Creating one that already exists fails, and
the error is easy to miss.

So:

1. Make a token at vercel.com → avatar → Settings → Tokens. In the **Scope**
   picker, **Nexus** has a `>` and opens a submenu — choose **All Projects**
   inside it. Not `composers-dungeon`: a token's scope is an account or a team,
   never a project, and a project-scoped one cannot do the team-level work a
   deploy needs.
2. At
   <https://github.com/knwilliams0512/Composers-Dungeon/settings/secrets/actions>
   click the **pencil** on the existing `VERCEL_TOKEN` row, paste, **Update
   secret**.
3. Check the row then reads **"Updated now"**. If it still shows an old
   timestamp, it did not save, and that is the whole problem.
4. Dispatch **Deploy the online game**. It sets all six variables from Neon,
   deploys, and checks the result serves.

If the row says "Updated now" and it is still rejected, the `All Projects`
scope is not producing a token the CLI can authenticate with; remake it as
**Full Account**.

**B — by hand.** In the Vercel project → Settings → Environment Variables, for
Production:

| Variable | Value |
|---|---|
| `NEXTAUTH_SECRET` | 32 random bytes, base64 — see below |
| `CD_HOSTED` | `1` |
| `DATABASE_PROVIDER` | `postgresql` |
| `CD_ADMIN_EMAIL` | `haelan544@gmail.com` |

and add the **Neon integration** for `DATABASE_URL` / `DIRECT_DATABASE_URL`
rather than pasting a connection string, so the pooled-vs-direct distinction is
right. Then redeploy.

```powershell
$b = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
[Convert]::ToBase64String($b)
```

`NEXTAUTH_URL` is deliberately not needed — the app falls back to Vercel's own
production domain.

Then dispatch **Verify the online guild** with the site URL. It signs up two
players in separate browsers, has them join one guild, posts as one and checks
the other sees it. Fourteen checks; it fails loudly if any of them does.

## ☐ 2. Turn GitHub Pages on, for the download page

**Settings → Pages → Build and deployment → Source: GitHub Actions**, then
re-run **Download site**.

Five runs have failed on `Not Found` from the Pages API, which means no Pages
site exists for the repository. Nothing in the repo can create one. On a free
plan Pages also needs the repository to be public; that screen says which of
the two is stopping it.

## What changed overnight

- **Signed-out players were being sent to next-auth's own generic page** rather
  than this app's login screen, on all twelve protected routes. `middleware.ts`
  re-exported next-auth's default, which silently ignores configuration.
- **Two checks in the live test could never fail** — one looked for text the
  app does not contain, the other asked a question that is true when signed
  out. Both had been printing `ok` since they were written.
- **The README and the landing page said things that were not true**: nine
  areas and four bosses against sixteen and ten, fifteen achievements against
  fifty-eight. The three guild raid bosses were missing from the landing page
  entirely — the one feature that needs other people, absent from the pitch.
  `npm run check:claims` now holds every count to the seed data.
- Workflow fixes: a deploy could report success when it failed, dispatch inputs
  were interpolated into shell scripts, and a curl fallback made the error
  message for a wrong hostname unreachable.

19 checkers pass, the typecheck is clean, and both the desktop (SQLite) and
hosted (Postgres) builds compile.

## Still open, not blocking

The **Windows desktop app** keeps its own local SQLite file, so a player on the
installer has a separate world from the web version. Whether it should also
point at the hosted server — same account and guild everywhere, but needing
internet — is a design decision, not a bug.
