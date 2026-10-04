#!/usr/bin/env bash
#
# Signs a Windows executable, if this build has a certificate to sign it with.
#
# The warning people see — "ComposersDungeonSetup.exe isn't commonly
# downloaded" — is Microsoft SmartScreen, and it is not an accusation. It means
# Microsoft has not seen this exact file often enough to have formed an
# opinion. An unsigned file earns that reputation per file, so every release
# starts from zero; a signed one earns it against the certificate, so the
# second release inherits what the first built up, and an EV certificate is
# trusted on sight.
#
# There is no way to remove the warning from inside the code. Renaming the
# file, changing its icon, shrinking it, adding a manifest: none of it does
# anything, and anything that did would be a bug in SmartScreen rather than a
# feature of the app.
#
# So this script does the one thing that works, when it can: it signs with a
# certificate supplied through the build's own secrets, and does nothing at all
# when there is none. A fork, a local build and today's release all keep
# working unsigned; the day a certificate is added the installer comes out
# signed with no further change.
#
#   WINDOWS_CERT_PFX_BASE64   the .pfx/.p12, base64-encoded
#   WINDOWS_CERT_PASSWORD     its password
#   WINDOWS_CERT_TIMESTAMP    optional RFC 3161 timestamp server
#
# Timestamping is not optional in practice, despite being an optional setting.
# A signature without one stops being trusted the day the certificate expires,
# which would turn every release already in the wild back into an unknown
# publisher. With one, the signature stays valid for the life of the timestamp.

set -euo pipefail

TARGET="${1:?usage: sign.sh <file.exe>}"
TS_URL="${WINDOWS_CERT_TIMESTAMP:-http://timestamp.digicert.com}"

if [ -z "${WINDOWS_CERT_PFX_BASE64:-}" ]; then
  echo "  no signing certificate configured - leaving $(basename "$TARGET") unsigned"
  exit 0
fi

if ! command -v osslsigncode >/dev/null 2>&1; then
  echo "  osslsigncode not installed - cannot sign $(basename "$TARGET")" >&2
  exit 1
fi

WORK="$(mktemp -d)"
# The certificate is a private key on disk for the length of one command. Make
# sure it leaves with the shell, including when the signing itself fails.
trap 'rm -rf "$WORK"' EXIT
PFX="$WORK/cert.pfx"
printf '%s' "$WINDOWS_CERT_PFX_BASE64" | base64 -d > "$PFX"
chmod 600 "$PFX"

echo "  signing $(basename "$TARGET")"
osslsigncode sign \
  -pkcs12 "$PFX" \
  -pass "${WINDOWS_CERT_PASSWORD:-}" \
  -n "Composer's Dungeon" \
  -i "https://github.com/knwilliams0512/Composer-s-Dungeon" \
  -ts "$TS_URL" \
  -h sha256 \
  -in "$TARGET" \
  -out "$TARGET.signed" >/dev/null

mv "$TARGET.signed" "$TARGET"

# Signing something that is not actually signed afterwards is worse than not
# signing: the release would claim a trust it does not have.
if ! osslsigncode verify -in "$TARGET" 2>&1 | grep -qi "signature.*ok\|Succeeded"; then
  echo "  the signature did not verify after signing - refusing to ship it" >&2
  exit 1
fi
echo "  signed and verified"
