#!/bin/sh
# Gets the render library (Lemo-Opuscar, MIT licence, github.com/lemomo-ai/lemo-opuscar) and its tools,
# using the library's own installer.
#   sh setup.sh          → download/update the library, prints LIB=<path> on the last line
#   sh setup.sh deps     → Node packages, headless browser, Python audio tools (a few minutes the first time)
set -e
LIB="${LEMO_OPUSCAR_HOME:-$HOME/lemo-opuscar}"
if [ ! -f "$LIB/plugin/skills/lemo-opuscar/scripts/setup.sh" ]; then
  command -v git >/dev/null || { echo "✗ git kerak (macOS: xcode-select --install)"; exit 1; }
  [ -e "$LIB" ] && [ -n "$(ls -A "$LIB" 2>/dev/null)" ] && { echo "✗ $LIB band — LEMO_OPUSCAR_HOME bilan boshqa papka bering"; exit 1; }
  git clone --quiet --depth 1 https://github.com/lemomo-ai/lemo-opuscar.git "$LIB"
fi
command -v ffmpeg >/dev/null || echo "! ffmpeg topilmadi — macOS: brew install ffmpeg"
LEMO_OPUSCAR_HOME="$LIB" sh "$LIB/plugin/skills/lemo-opuscar/scripts/setup.sh" "$@"
