#!/usr/bin/env bash
# clean-episode-cruft.sh — remove .DS_Store noise and report duplicate version files.
#
# Usage:
#   ./scripts/clean-episode-cruft.sh                  # all episodes (report-only by default)
#   ./scripts/clean-episode-cruft.sh prisoners-dilemma
#   ./scripts/clean-episode-cruft.sh --apply          # actually delete .DS_Store (default is dry-run)
#
# What it does:
#   1. Lists/deletes .DS_Store files under episodes/<slug>/ (always gitignored;
#      they're disk clutter, not git clutter, but they pollute `ls` output).
#   2. Reports duplicate version files (foo-v2.json next to foo.json, etc.).
#      Does NOT auto-promote — promotion is a content decision.
#
# Exit codes:
#   0 — clean (no .DS_Store, no duplicate versions detected)
#   1 — issues found (in report mode) — useful as a CI nudge
#   2 — usage error

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EPISODES="$ROOT/episodes"

APPLY=false
SLUG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=true; shift ;;
    -h|--help)
      head -16 "${BASH_SOURCE[0]}" | tail -15
      exit 0 ;;
    *) SLUG="$1"; shift ;;
  esac
done

if [[ -n "$SLUG" ]]; then
  if [[ ! -d "$EPISODES/$SLUG" ]]; then
    echo "Error: episode directory not found: $EPISODES/$SLUG" >&2
    exit 2
  fi
  TARGETS=("$EPISODES/$SLUG")
else
  TARGETS=("$EPISODES"/*/)
fi

FOUND_ISSUES=0

for target in "${TARGETS[@]}"; do
  # Strip trailing slash for prettier output
  slug="$(basename "${target%/}")"
  # Skip non-directories and known non-episode dirs
  [[ ! -d "$target" ]] && continue
  [[ "$slug" == "EDITORIAL_PLAYBOOK.md" ]] && continue
  [[ "$slug" == "LEARNING_LOG.md" ]] && continue
  [[ "$slug" == "PIPELINE.md" ]] && continue

  # .DS_Store cleanup (bash-3.2 compatible — macOS default; no `mapfile`)
  ds_count=0
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    ds_count=$((ds_count + 1))
    $APPLY && rm -f "$f"
  done < <(find "$target" -name ".DS_Store" 2>/dev/null)
  if [[ $ds_count -gt 0 ]]; then
    FOUND_ISSUES=$((FOUND_ISSUES + ds_count))
    if $APPLY; then
      echo "[$slug] removed $ds_count .DS_Store file(s)"
    else
      echo "[$slug] would remove $ds_count .DS_Store file(s) (use --apply)"
    fi
  fi

  # Duplicate-version detection (report only — promotion is a content call)
  while IFS= read -r v2; do
    [[ -z "$v2" ]] && continue
    base="${v2/-v2/}"
    if [[ -f "$base" ]]; then
      FOUND_ISSUES=$((FOUND_ISSUES + 1))
      echo "[$slug] DUPLICATE: $(basename "$v2") next to $(basename "$base") — review and promote manually"
    fi
  done < <(find "$target" -maxdepth 1 \( -name "*-v2.json" -o -name "*-v2.md" \) 2>/dev/null)
done

if [[ $FOUND_ISSUES -eq 0 ]]; then
  echo "✓ no cruft detected"
  exit 0
else
  echo ""
  echo "Found $FOUND_ISSUES issue(s)."
  $APPLY && echo "Re-run without --apply for a dry-run report, or with --apply again to confirm."
  exit 1
fi
