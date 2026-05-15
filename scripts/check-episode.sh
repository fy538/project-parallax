#!/usr/bin/env bash
# check-episode.sh — end-to-end validator for a single episode.
#
# Chains every static check into one command so a production run can be
# gated with a single `./scripts/check-episode.sh <slug>`.
#
# HARD checks (exit non-zero if any fail):
#   1. JSON well-formedness + schema + palette compliance  (validate_data.py)
#   2. Assembly manifest doctrine rules                   (manifest_lint.py)
#   3. _direction orphan keys                             (audit-direction-fields.mjs)
#   4. Zod schema validation of all data files            (episode-integrity.test.ts)
#   5. Concept registry integrity                         (lookup.py validate)
#   6. TypeScript strict-mode typecheck                   (tsc --noEmit)
#   7. Convention lint (hex colours, hook rules, etc.)    (lint-conventions.mjs)
#   8. Asset-existence preflight                          (preflight.py)
#
# SOFT checks (warn but do not fail):
#   W1. Unreferenced JSON files in episode dir            (list_orphan_episode_json.py)
#   W2. Pending-sourcing assets                           (preflight.py --strict; non-blocking by default)
#   W3. Script ↔ manifest cross-reference drift           (check_script_manifest.py)
#   W4. Concept registry coverage                         (check_concept_coverage.py)
#   W5. Audio cue sheet ↔ manifest                        (check_audio_cues.py)
#
# Usage:
#   ./scripts/check-episode.sh silicon-trap
#   ./scripts/check-episode.sh prisoners-dilemma
#   ./scripts/check-episode.sh --list          # print known episode slugs
#
# Exit codes:
#   0  — all hard checks pass
#   1  — one or more hard checks failed
#   2  — invalid usage (no slug, unknown slug, missing tools)

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTION="$ROOT/remotion-templates"
TOOLS="$ROOT/tools"
DATA_EPISODES="$REMOTION/data/episodes"

# ── Helpers ───────────────────────────────────────────────────────────────────

BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
CYAN="\033[36m"
RESET="\033[0m"

step() { printf "\n${CYAN}▶ %s${RESET}\n" "$*"; }
pass() { printf "  ${GREEN}✓${RESET} %s\n" "$*"; }
fail() { printf "  ${RED}✖${RESET} %s\n" "$*"; }
warn() { printf "  ${YELLOW}⚠${RESET} %s\n" "$*"; }
info() { printf "  ${BOLD}ℹ${RESET} %s\n" "$*"; }

# Track failures across checks
FAILURES=()
WARNINGS=()

run_check() {
  # Usage: run_check <check-name> <cmd...>
  local name="$1"; shift
  step "$name"
  if "$@"; then
    pass "$name"
  else
    fail "$name"
    FAILURES+=("$name")
  fi
}

run_soft() {
  # Usage: run_soft <check-name> <cmd...>
  local name="$1"; shift
  step "$name (informational)"
  if "$@"; then
    pass "$name"
  else
    warn "$name reported issues (not blocking)"
    WARNINGS+=("$name")
  fi
}

# ── Argument parsing ──────────────────────────────────────────────────────────

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <episode-slug>" >&2
  echo "       $0 --list" >&2
  exit 2
fi

if [[ "$1" == "--list" ]]; then
  echo "Known episode slugs (have assembly-manifest.json):"
  for d in "$DATA_EPISODES"/*/; do
    slug="$(basename "$d")"
    [[ -f "$d/assembly-manifest.json" ]] && echo "  $slug"
  done
  exit 0
fi

SLUG="$1"

# Validate slug
EPISODE_DIR="$DATA_EPISODES/$SLUG"
if [[ ! -d "$EPISODE_DIR" ]]; then
  echo "Error: episode directory not found: $EPISODE_DIR" >&2
  echo "Run '$0 --list' to see available slugs." >&2
  exit 2
fi

HAS_MANIFEST=false
[[ -f "$EPISODE_DIR/assembly-manifest.json" ]] && HAS_MANIFEST=true

# ── Banner ────────────────────────────────────────────────────────────────────

printf "\n${BOLD}╔═══════════════════════════════════════════════════════════╗${RESET}\n"
printf "${BOLD}║  check-episode: %-42s ║${RESET}\n" "$SLUG"
printf "${BOLD}╚═══════════════════════════════════════════════════════════╝${RESET}\n"
info "Root:    $ROOT"
info "Episode: $EPISODE_DIR"
[[ "$HAS_MANIFEST" == "true" ]] && info "Manifest: found" || info "Manifest: not found (some checks will skip)"
printf "\n"

# ── Hard checks ───────────────────────────────────────────────────────────────

# 1. JSON well-formedness + schema + palette compliance
run_check "JSON validation (well-formed + schema + palette)" \
  python3 "$TOOLS/validate_data.py" --episode "$SLUG"

# 2. Assembly manifest doctrine (only when manifest exists)
if [[ "$HAS_MANIFEST" == "true" ]]; then
  # manifest_lint.py exits 1 on errors, 0 on warnings-only
  run_check "Manifest doctrine (M-D18, M-CROSSFADE, M-OVERLAP, M-DATAFILE)" \
    python3 "$TOOLS/lint/manifest_lint.py" --episode "$SLUG"
else
  warn "Manifest doctrine check skipped (no assembly-manifest.json)"
  WARNINGS+=("manifest-lint (skipped — no manifest)")
fi

# 3. _direction orphan keys
run_check "_direction field audit (no orphaned keys)" \
  node "$REMOTION/scripts/audit-direction-fields.mjs" --episode="$SLUG" --strict

# 4. Zod schema validation via episode-integrity test suite
if [[ "$HAS_MANIFEST" == "true" ]]; then
  run_check "Zod schema + integrity tests (episode-integrity.test.ts)" \
    bash -c "cd '$REMOTION' && EPISODE='$SLUG' npx vitest run src/__tests__/episode-integrity.test.ts --reporter=verbose"
else
  warn "Zod schema tests skipped (no assembly-manifest.json)"
  WARNINGS+=("episode-integrity (skipped — no manifest)")
fi

# 5. Concept registry integrity (repo-wide, not episode-scoped)
run_check "Concept registry integrity" \
  python3 "$TOOLS/concepts/lookup.py" validate

# 6. TypeScript strict-mode typecheck
run_check "TypeScript typecheck (strict)" \
  bash -c "cd '$REMOTION' && npx tsc --noEmit"

# 7. Convention lint
run_check "Convention lint (hex colours, hooks, composition)" \
  bash -c "cd '$REMOTION' && node scripts/lint-conventions.mjs"

# 8. Asset-existence preflight (HARD: broken paths fail; pending sourcing is soft)
if [[ "$HAS_MANIFEST" == "true" ]]; then
  run_check "Asset preflight (no broken file paths)" \
    python3 "$TOOLS/preflight.py" "$SLUG"
else
  warn "Asset preflight skipped (no assembly-manifest.json)"
  WARNINGS+=("preflight (skipped — no manifest)")
fi

# ── Soft checks ───────────────────────────────────────────────────────────────

run_soft "Unreferenced JSON files in episode dir" \
  python3 "$TOOLS/list_orphan_episode_json.py" --episode "$SLUG"

# Pending-sourcing assets — informational. Run preflight in --strict mode and
# report (but don't fail) so producers know how many FOOTAGE/AI_GEN slots are
# still pending before a real render.
if [[ "$HAS_MANIFEST" == "true" ]]; then
  run_soft "Pending asset sourcing (preflight --strict)" \
    python3 "$TOOLS/preflight.py" "$SLUG" --strict
fi

# Cross-document drift — all three are soft. They catch real issues, but
# legitimate drafts have legitimate drift; producers triage by reading the
# diff and deciding which side is canonical.
if [[ "$HAS_MANIFEST" == "true" ]]; then
  run_soft "Script ↔ manifest cross-reference (shotListId + dataFile drift)" \
    python3 "$TOOLS/check_script_manifest.py" "$SLUG" --strict
  run_soft "Concept registry coverage (terms in script)" \
    python3 "$TOOLS/check_concept_coverage.py" "$SLUG" --strict
  run_soft "Audio cue sheet ↔ manifest (moods, track count, SFX vocabulary)" \
    python3 "$TOOLS/check_audio_cues.py" "$SLUG" --strict
fi

# ── Summary ───────────────────────────────────────────────────────────────────

printf "\n${BOLD}══════════════════════════════════════════════════════════════${RESET}\n"

if [[ ${#FAILURES[@]} -eq 0 && ${#WARNINGS[@]} -eq 0 ]]; then
  printf "${GREEN}${BOLD}  ✓ All checks passed — $SLUG is render-ready.${RESET}\n"
elif [[ ${#FAILURES[@]} -eq 0 ]]; then
  printf "${YELLOW}${BOLD}  ⚠ All hard checks passed — $SLUG is render-ready.${RESET}\n"
  printf "${YELLOW}    Soft-check warnings (non-blocking):${RESET}\n"
  for w in "${WARNINGS[@]}"; do
    printf "${YELLOW}      • %s${RESET}\n" "$w"
  done
else
  printf "${RED}${BOLD}  ✖ $SLUG has ${#FAILURES[@]} failing check(s):${RESET}\n"
  for f in "${FAILURES[@]}"; do
    printf "${RED}      • %s${RESET}\n" "$f"
  done
  if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    printf "${YELLOW}    Soft-check warnings:${RESET}\n"
    for w in "${WARNINGS[@]}"; do
      printf "${YELLOW}      • %s${RESET}\n" "$w"
    done
  fi
fi

printf "${BOLD}══════════════════════════════════════════════════════════════${RESET}\n\n"

[[ ${#FAILURES[@]} -eq 0 ]]
