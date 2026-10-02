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

mkdir -p "$TARGET"
# Keep the installed config.json (may hold a token) and cache/ (paid vibe encodings).
find "$TARGET" -mindepth 1 -maxdepth 1 ! -name config.json ! -name cache -exec rm -rf {} +
# Copy everything except a config.json and a cache from the repo.
(cd "$SRC" && find . -type f ! -name config.json ! -path './cache/*' -exec sh -c 'mkdir -p "$2/$(dirname "$1")" && cp "$1" "$2/$1"' _ {} "$TARGET" \;)

echo "NAI Studio plugin installed to $TARGET"
echo "Make sure enableServerPlugins: true is set in config.yaml (or env SILLYTAVERN_ENABLESERVERPLUGINS=true), then restart SillyTavern."
