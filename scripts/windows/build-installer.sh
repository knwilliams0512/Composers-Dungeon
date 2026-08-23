#!/usr/bin/env bash
#
# Builds ComposersDungeonSetup.exe — a single, self-contained Windows
# installer. Runs on Linux or macOS; no Windows machine required.
#
# The output bundles a Windows Node runtime, the Next.js standalone server,
# and a pre-seeded database, so the end user installs by double-clicking and
# never sees Node, npm, git or a build step.
#
#   Requires: node + npm, and makensis (Debian/Ubuntu: apt-get install nsis)
#   Usage:    scripts/windows/build-installer.sh [node-version]
#
set -euo pipefail

NODE_VERSION="${1:-22.22.2}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUILD="$ROOT/build/windows"
PAYLOAD="$BUILD/payload"
CACHE="$ROOT/build/cache"
OUT="$ROOT/dist/ComposersDungeonSetup.exe"
VERSION="$(node -p "require('$ROOT/package.json').version" 2>/dev/null || echo 1.0.0)"

say() { printf '\n\033[1;33m==> %s\033[0m\n' "$1"; }

command -v makensis >/dev/null || {
  echo "makensis not found. Install NSIS first (apt-get install nsis / brew install makensis)." >&2
  exit 1
}

cd "$ROOT"
rm -rf "$BUILD" "$OUT"
mkdir -p "$PAYLOAD" "$CACHE" "$ROOT/dist"

# --- 1. Windows Node runtime -------------------------------------------------
say "Fetching the Windows Node runtime (v$NODE_VERSION)"
NODE_ZIP="$CACHE/node-v$NODE_VERSION-win-x64.zip"
if [ ! -f "$NODE_ZIP" ]; then
  curl -sSL --fail -o "$NODE_ZIP" \
    "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-win-x64.zip"
fi
unzip -o -q "$NODE_ZIP" "node-v$NODE_VERSION-win-x64/node.exe" -d "$CACHE"
cp "$CACHE/node-v$NODE_VERSION-win-x64/node.exe" "$PAYLOAD/node.exe"

# --- 2. Build with the Windows Prisma engine --------------------------------
say "Generating the Prisma client (with the Windows query engine)"
# Temporary schema patch: contributors on Linux/macOS shouldn't pay for a
# 19 MB Windows engine on every generate.
cp prisma/schema.prisma "$BUILD/schema.prisma.orig"
trap 'cp "$BUILD/schema.prisma.orig" "$ROOT/prisma/schema.prisma" 2>/dev/null || true' EXIT
node -e '
  const fs = require("fs");
  const p = "prisma/schema.prisma";
  const s = fs.readFileSync(p, "utf8").replace(
    /generator client \{\s*provider\s*=\s*"prisma-client-js"\s*\}/,
    `generator client {\n  provider      = "prisma-client-js"\n  binaryTargets = ["native", "windows"]\n}`
  );
  fs.writeFileSync(p, s);
'
npx prisma generate >/dev/null

say "Building the production bundle"
rm -rf "$ROOT/.next"
npm run build >/dev/null

# --- 3. Seed a fresh database to ship ---------------------------------------
say "Seeding the database that ships with the app"
SEED_DB="$BUILD/dungeon-seed.db"
rm -f "$SEED_DB"
DATABASE_URL="file:$SEED_DB" npx prisma db push --skip-generate >/dev/null
DATABASE_URL="file:$SEED_DB" npx tsx prisma/seed.ts >/dev/null
mkdir -p "$PAYLOAD/seed"
cp "$SEED_DB" "$PAYLOAD/seed/dungeon-seed.db"

# --- 4. Assemble the app ----------------------------------------------------
say "Assembling the payload"
cp -r "$ROOT/.next/standalone/." "$PAYLOAD/app/"
mkdir -p "$PAYLOAD/app/.next"
cp -r "$ROOT/.next/static" "$PAYLOAD/app/.next/static"
cp -r "$ROOT/public" "$PAYLOAD/app/public"

# Everything the in-place updater needs after a swap: the migration files, a
# runner for them, and the seed compiled to plain JS so the bundled Node can
# run it without npm or TypeScript. Only @prisma/client stays external — it
# ships with the traced server; everything else is inlined, because Next's
# file tracing has no reason to keep seed-only dependencies around.
cp -r "$ROOT/migrations" "$PAYLOAD/app/migrations"
cp "$ROOT/installer/upgrade.js" "$PAYLOAD/app/upgrade.js"
npx esbuild "$ROOT/prisma/seed.ts" \
  --bundle --platform=node --format=cjs --target=node18 \
  --external:@prisma/client \
  --outfile="$PAYLOAD/app/seed-runner.js" --log-level=warning

# Never ship the developer's own .env — the standalone build copies it in.
rm -f "$PAYLOAD/app/.env"
# The Linux query engine is dead weight in a Windows installer.
find "$PAYLOAD/app" -name "libquery_engine-*.so.node" -delete
find "$PAYLOAD/app" -name "*.map" -delete

mkdir -p "$PAYLOAD/launch"
cp "$ROOT/installer/app-launcher.ps1" \
   "$ROOT/installer/launch.vbs" \
   "$ROOT/installer/apply-update.ps1" \
   "$ROOT/installer/update-config.json" \
   "$PAYLOAD/launch/"

# The installed app reads its own version from here; the updater rewrites it.
printf '{\n  "version": "%s"\n}\n' "$VERSION" > "$PAYLOAD/version.json"

# --- 5. Update package -------------------------------------------------------
# The same payload, minus the 87 MB Node runtime that never changes. This is
# what an installed copy downloads to update itself in place.
say "Packaging the in-place update"
UPDATE_DIR="$BUILD/update"
rm -rf "$UPDATE_DIR"
mkdir -p "$UPDATE_DIR"
cp -r "$PAYLOAD/app" "$UPDATE_DIR/app"
cp -r "$PAYLOAD/launch" "$UPDATE_DIR/launch"
cp -r "$PAYLOAD/seed" "$UPDATE_DIR/seed"

UPDATE_ZIP="$ROOT/dist/ComposersDungeon-$VERSION-update.zip"
rm -f "$UPDATE_ZIP"
( cd "$UPDATE_DIR" && zip -qr "$UPDATE_ZIP" app launch seed )
UPDATE_SHA="$(sha256sum "$UPDATE_ZIP" | cut -d" " -f1 | tr "a-f" "A-F")"

cat > "$ROOT/dist/latest.json" <<JSON
{
  "version": "$VERSION",
  "url": "https://github.com/knwilliams0512/Composer-s-Dungeon/releases/download/v$VERSION/ComposersDungeon-$VERSION-update.zip",
  "sha256": "$UPDATE_SHA",
  "publishedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "notes": "$(node -p "JSON.stringify(process.env.RELEASE_NOTES || 'Improvements and new content.').slice(1,-1)")"
}
JSON

# --- 6. Compile the installer ------------------------------------------------
say "Compiling the installer"
makensis -NOCD \
  "-DPAYLOAD=$PAYLOAD" \
  "-DOUT_FILE=$OUT" \
  "-DAPP_VERSION=$VERSION" \
  "$ROOT/installer/composers-dungeon.nsi" | tail -3

printf '\n\033[1;32m  Built %s (%s)\033[0m\n' "$OUT" "$(du -h "$OUT" | cut -f1)"
printf '\033[1;32m  Built %s (%s)\033[0m\n' "$UPDATE_ZIP" "$(du -h "$UPDATE_ZIP" | cut -f1)"
printf '\033[0;90m  Attach both, plus dist/latest.json, to the v%s release.\033[0m\n\n' "$VERSION"
