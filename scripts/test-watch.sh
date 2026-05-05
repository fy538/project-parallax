#!/usr/bin/env bash
# Re-run Python tests on file changes. Requires `entr`:
#   brew install entr     # macOS
#   apt install entr      # Debian/Ubuntu
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v entr &>/dev/null; then
  echo "Error: entr not found. Install with: brew install entr" >&2
  exit 1
fi

echo "Watching tools/**/*.py — Ctrl-C to stop"
find tools -name '*.py' | entr -c python3 -m pytest tools/ -q
