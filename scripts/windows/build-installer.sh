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

# Never ship the developer's own .env — the standalone build copies it in.
rm -f "$PAYLOAD/app/.env"
# The Linux query engine is dead weight in a Windows installer.
find "$PAYLOAD/app" -name "libquery_engine-*.so.node" -delete
find "$PAYLOAD/app" -name "*.map" -delete

mkdir -p "$PAYLOAD/launch"
cp "$ROOT/installer/app-launcher.ps1" "$ROOT/installer/launch.vbs" "$PAYLOAD/launch/"

# --- 5. Compile the installer ------------------------------------------------
say "Compiling the installer"
makensis -NOCD \
  "-DPAYLOAD=$PAYLOAD" \
  "-DOUT_FILE=$OUT" \
  "-DAPP_VERSION=$VERSION" \
  "$ROOT/installer/composers-dungeon.nsi" | tail -3

printf '\n\033[1;32m  Built %s (%s)\033[0m\n\n' "$OUT" "$(du -h "$OUT" | cut -f1)"
