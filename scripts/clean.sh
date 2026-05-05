#!/usr/bin/env bash
# Wipe regenerable build artifacts. None of this affects git-tracked work.
#
# Removes:
#   remotion-templates/out/            (rendered MP4s, ~100M+)
#   remotion-templates/.cache/         (Remotion bundler cache)
#   remotion-templates/.vite/          (Vite cache)
#   remotion-templates/dist/           (TS build output)
#   .coverage / coverage.xml / htmlcov (Python coverage artifacts)
#   __pycache__/ + *.pyc               (Python bytecode)
#
# Use when: disk fills up, render cache is stale, or you want a clean rebuild.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bytes_before=$(du -sk remotion-templates/out remotion-templates/.cache remotion-templates/.vite remotion-templates/dist 2>/dev/null | awk '{sum+=$1} END {print sum+0}')

echo "→ removing render output (remotion-templates/out/)"
rm -rf remotion-templates/out

echo "→ removing build caches (.cache, .vite, dist)"
rm -rf remotion-templates/.cache remotion-templates/.vite remotion-templates/dist

echo "→ removing Python coverage artifacts"
rm -f .coverage coverage.xml
rm -rf htmlcov

echo "→ removing Python bytecode"
find tools -name __pycache__ -type d -exec rm -rf {} + 2>/dev/null || true
find tools -name "*.pyc" -delete 2>/dev/null || true

mb_freed=$(awk "BEGIN { printf \"%.1f\", ${bytes_before:-0}/1024 }")
echo ""
echo "✓ Cleaned. ~${mb_freed} MB freed."
echo "  Re-render with: cd remotion-templates && node scripts/render-episode.mjs --episode=<slug>"
