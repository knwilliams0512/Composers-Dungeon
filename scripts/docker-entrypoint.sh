#!/bin/sh
# Brings the database up to this build, then starts the server.
#
# Both steps run on every boot, which is deliberate:
#
#   * `db push` is additive — it adds the tables and columns this build expects
#     and refuses, rather than performs, a change that would drop data.
#   * the seed is written to be re-run. It upserts the curriculum and replaces
#     only content rows (quiz questions, exercises, exam papers), so a redeploy
#     delivers new lessons and fixes to everyone already playing without
#     touching a single account, composition, membership or guild post. This
#     was verified against a database holding real accounts, guild memberships
#     and posts: every row survived.
#
# This mirrors what installer/upgrade.js does for the desktop app, so a hosted
# instance and an installed copy stay on the same content by the same means.
set -e

missing=""
[ -z "$DATABASE_URL" ] && missing="$missing DATABASE_URL"
# Without this every auth route returns a 500.
[ -z "$NEXTAUTH_SECRET" ] && missing="$missing NEXTAUTH_SECRET"
# Reset links are built from it. Unset, it falls back to http://localhost:3000
# and the app mails out links that work for nobody — a failure that looks like
# a healthy deploy until somebody forgets their password.
[ -z "$NEXTAUTH_URL" ] && missing="$missing NEXTAUTH_URL"
if [ -n "$missing" ]; then
  echo "Refusing to start. Not set:$missing" >&2
  echo "See DEPLOY.md for what each one wants." >&2
  exit 1
fi
# Prisma requires the variable to exist once the schema names it. With no
# connection pooler in front of Postgres it is simply the same URL.
export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"

PRISMA=/opt/tools/node_modules/.bin/prisma
TSX=/opt/tools/node_modules/.bin/tsx

echo "[boot] bringing the schema up to this build"
"$PRISMA" db push --schema prisma/schema.postgres.prisma --skip-generate

echo "[boot] refreshing lessons, areas, bosses and exams"
"$TSX" prisma/seed.ts

echo "[boot] starting the server"
exec "$@"
