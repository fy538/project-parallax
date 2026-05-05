#!/usr/bin/env bash
#
# render-silicon-trap.sh — DEPRECATED, redirects to render-episode.mjs
#
# This bash script used to carry its own copy of the silicon-trap clip list.
# That sequence is now in `scripts/sequences/silicon-trap.json` and the .mjs
# render script is the canonical entry point.
#
# Why deprecate the bash version: render-episode.mjs handles props-via-temp-file
# (no shell-escaping fragility, see L28), retry logic (L32 cold-start race),
# Playwright cache search across macOS + Linux paths (L31), and `--only` /
# `--from` partial render flags. Maintaining a bash equivalent is duplicate
# work for no benefit.
#
# Usage:
#   node scripts/render-episode.mjs silicon-trap              # all MP4s
#   node scripts/render-episode.mjs silicon-trap --preview    # stills @ frame 90
#   node scripts/render-episode.mjs silicon-trap --concat     # + preview reel
#   node scripts/render-episode.mjs silicon-trap --only=05,06 # specific clips
#   node scripts/render-episode.mjs silicon-trap --from=16    # from clip 16

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "→ Forwarding to: node scripts/render-episode.mjs silicon-trap $*"
exec node scripts/render-episode.mjs silicon-trap "$@"
