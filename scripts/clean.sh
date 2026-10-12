#!/usr/bin/env bash
# Remove selected, regenerable artifacts. No arguments only prints help.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

tests=false
cache=false
renders=false
dry_run=false
usage() {
  cat <<'HELP'
Usage: ./scripts/clean.sh [--tests] [--cache] [--renders] [--all] [--dry-run]

  --tests    Remove temporary test renders; keep visual baselines.
  --cache    Remove build caches, Python bytecode, and coverage output.
  --renders  Remove finished files under remotion-templates/out/.
  --all      Select all three groups (including finished renders).
  --dry-run  Show the selected paths without removing them.

No-argument invocation only shows this help. Select --renders explicitly before
removing finished episode or pilot videos.
HELP
}

if (($# == 0)); then usage; exit 0; fi
for arg in "$@"; do
  case "$arg" in
    --tests) tests=true ;;
    --cache) cache=true ;;
    --renders) renders=true ;;
    --all) tests=true; cache=true; renders=true ;;
    --dry-run) dry_run=true ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$arg" >&2; usage >&2; exit 2 ;;
  esac
done
if ! $tests && ! $cache && ! $renders; then usage; exit 0; fi

paths=()
if $tests; then
  paths+=(remotion-templates/src/__tests__/.temp-renders
          remotion-templates/src/__tests__/.temp-renders-catalog)
fi
if $cache; then
  paths+=(remotion-templates/.cache remotion-templates/.vite remotion-templates/dist
          .coverage coverage.xml htmlcov)
fi
if $renders; then paths+=(remotion-templates/out); fi

printf 'Selected paths:\n'
for item in "${paths[@]}"; do
  if [[ -e "$item" ]]; then
    du -sh "$item"
  else
    printf '  absent  %s\n' "$item"
  fi
done
if $cache; then
  printf '  Python bytecode under tools/\n'
fi
if $dry_run; then printf 'Dry run; nothing removed.\n'; exit 0; fi

for item in "${paths[@]}"; do rm -rf -- "$item"; done
if $cache; then
  find tools -type d -name __pycache__ -prune -exec rm -rf -- {} +
  find tools -type f -name '*.pyc' -delete
fi
printf 'Cleanup complete.\n'
