#!/usr/bin/env sh
# Installs the NAI Studio server plugin into a SillyTavern folder (Linux/macOS, also a Docker host).
# Usage: ./install-server.sh /path/to/SillyTavern        (or the folder mounted as <ST>/plugins's parent)
# Then set enableServerPlugins: true in config.yaml and restart SillyTavern.
set -eu

ST_DIR="${1:?usage: install-server.sh <SillyTavern dir>}"
SRC="$(cd "$(dirname "$0")" && pwd)/server"
TARGET="$ST_DIR/plugins/nai-studio"

if [ ! -d "$ST_DIR/plugins" ] && [ ! -f "$ST_DIR/server.js" ]; then
    echo "Not a SillyTavern folder (no plugins/ or server.js): $ST_DIR" >&2
    exit 1
fi

SAVED=""
if [ -f "$TARGET/config.json" ]; then
    SAVED="$(mktemp)"
    cp "$TARGET/config.json" "$SAVED"
fi
rm -rf "$TARGET"
mkdir -p "$TARGET"
# Copy everything except a config.json from the repo (it may hold a token).
(cd "$SRC" && find . -type f ! -name config.json -exec sh -c 'mkdir -p "$2/$(dirname "$1")" && cp "$1" "$2/$1"' _ {} "$TARGET" \;)
if [ -n "$SAVED" ]; then
    cp "$SAVED" "$TARGET/config.json"
    rm -f "$SAVED"
fi

echo "NAI Studio plugin installed to $TARGET"
echo "Make sure enableServerPlugins: true is set in config.yaml (or env SILLYTAVERN_ENABLESERVERPLUGINS=true), then restart SillyTavern."
