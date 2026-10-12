#!/usr/bin/env bash
# narration-prep.sh — composite pre-booth preparation script.
#
# Chains all six narration-preparation tools in the correct order so
# the operator can run one command before a recording session and have
# every read-doc, cue sheet, and safety check ready.
#
# Steps (in order):
#   1. Sayability lint       — flags hard-to-say sentences before booth
#   2. Session planner       — writes audio/session-plan.md
#   3. Format for reading    — writes audio/narration-readable.md
#   4. Pronunciation guide   — writes audio/pronunciation-guide.md
#   5. Pre-render cue sheet  — writes audio/pre-render-cue-sheet.md
#   6. Staleness check       — warns if manifest/cue-sheet are stale
#
# Hard failure: sayability lint exits 1 (ERROR-level issues; fix script
# before recording). All other non-zero exits warn but do not abort.
#
# Usage:
#   ./scripts/narration-prep.sh <episode-slug>
#
# Exit codes:
#   0  — sayability passed + all steps succeeded or warned
#   1  — sayability found ERROR-level issues (not ready for booth)
#   2  — invalid usage (missing slug)

set -uo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS="$ROOT/tools"
NARRATION_TOOLS="$TOOLS/narration"
ASSEMBLY_TOOLS="$TOOLS/assembly"

# ── Helpers ───────────────────────────────────────────────────────────────────

BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
CYAN="\033[36m"
RESET="\033[0m"

step()  { printf "\n${CYAN}▶ %s${RESET}\n" "$*"; }
pass()  { printf "  ${GREEN}✓${RESET} %s\n" "$*"; }
fail()  { printf "  ${RED}✖${RESET} %s\n" "$*"; }
warn()  { printf "  ${YELLOW}⚠${RESET} %s\n" "$*"; }
info()  { printf "  ${BOLD}ℹ${RESET} %s\n" "$*"; }

# Track results across steps
STEP_RESULTS=()   # "pass" | "warn" | "skip"
STEP_NAMES=()
SAYABILITY_OK=true

run_step() {
  # Usage: run_step <step-name> <tool-path> <cmd...>
  local name="$1"; local tool="$2"; shift 2
  step "$name"
  STEP_NAMES+=("$name")

  if [[ ! -f "$tool" ]]; then
    warn "Tool not found: $tool (skipping)"
    STEP_RESULTS+=("skip")
    return 0
  fi

  if "$@"; then
    pass "$name"
    STEP_RESULTS+=("pass")
  else
    local rc=$?
    warn "$name exited $rc (non-blocking)"
    STEP_RESULTS+=("warn")
  fi
}

run_sayability() {
  # Sayability lint is the only hard-failure step.
  local name="$1"; local tool="$2"; shift 2
  step "$name"
  STEP_NAMES+=("$name")

  if [[ ! -f "$tool" ]]; then
    warn "Tool not found: $tool (skipping)"
    STEP_RESULTS+=("skip")
    return 0
  fi

  if "$@"; then
    pass "$name"
    STEP_RESULTS+=("pass")
  else
    fail "$name — ERROR-level issues found. Fix the script before recording."
    STEP_RESULTS+=("fail")
    SAYABILITY_OK=false
  fi
}

# ── Argument parsing ──────────────────────────────────────────────────────────

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <episode-slug>" >&2
  exit 2
fi

SLUG="$1"

# ── Banner ────────────────────────────────────────────────────────────────────

printf "\n${BOLD}╔═══════════════════════════════════════════════════════════╗${RESET}\n"
printf "${BOLD}║  narration-prep: %-41s ║${RESET}\n" "$SLUG"
printf "${BOLD}╚═══════════════════════════════════════════════════════════╝${RESET}\n"
info "Root:    $ROOT"
info "Episode: $ROOT/episodes/$SLUG"
printf "\n"

# ── Step 1: Sayability lint (hard failure) ────────────────────────────────────

run_sayability \
  "1/6  Sayability lint (pre-booth catch)" \
  "$NARRATION_TOOLS/sayability_lint.py" \
  python3 "$NARRATION_TOOLS/sayability_lint.py" "$SLUG"

# ── Step 2: Session planner ───────────────────────────────────────────────────

run_step \
  "2/6  Session planner" \
  "$NARRATION_TOOLS/session_planner.py" \
  python3 "$NARRATION_TOOLS/session_planner.py" "$SLUG"

# ── Step 3: Format for reading ────────────────────────────────────────────────

run_step \
  "3/6  Format for reading" \
  "$NARRATION_TOOLS/format_for_reading.py" \
  python3 "$NARRATION_TOOLS/format_for_reading.py" "$SLUG"

# ── Step 4: Pronunciation guide ───────────────────────────────────────────────

run_step \
  "4/6  Pronunciation guide" \
  "$NARRATION_TOOLS/pronunciation_guide.py" \
  python3 "$NARRATION_TOOLS/pronunciation_guide.py" "$SLUG"

# ── Step 5: Pre-render cue sheet ──────────────────────────────────────────────

run_step \
  "5/6  Pre-render cue sheet" \
  "$NARRATION_TOOLS/pre_render_cue_sheet.py" \
  python3 "$NARRATION_TOOLS/pre_render_cue_sheet.py" "$SLUG"

# ── Step 6: Staleness check (soft) ───────────────────────────────────────────

run_step \
  "6/6  Staleness check (manifest / cue-sheet)" \
  "$ASSEMBLY_TOOLS/invalidate.py" \
  python3 "$ASSEMBLY_TOOLS/invalidate.py" --soft --episode "$SLUG"

# ── Summary ───────────────────────────────────────────────────────────────────

printf "\n${BOLD}══════════════════════════════════════════════════════════════${RESET}\n"

FAIL_COUNT=0
WARN_COUNT=0
SKIP_COUNT=0
for result in "${STEP_RESULTS[@]}"; do
  case "$result" in
    fail) (( FAIL_COUNT++ )) ;;
    warn) (( WARN_COUNT++ )) ;;
    skip) (( SKIP_COUNT++ )) ;;
  esac
done

printf "${BOLD}  Results:${RESET}\n"
for i in "${!STEP_NAMES[@]}"; do
  name="${STEP_NAMES[$i]}"
  result="${STEP_RESULTS[$i]}"
  case "$result" in
    pass) printf "  ${GREEN}  ✓${RESET} %s\n" "$name" ;;
    fail) printf "  ${RED}  ✖${RESET} %s\n" "$name" ;;
    warn) printf "  ${YELLOW}  ⚠${RESET} %s\n" "$name" ;;
    skip) printf "  ${YELLOW}  ⊘${RESET} %s (tool not found)\n" "$name" ;;
  esac
done

printf "\n${BOLD}  Files written (when steps succeeded):${RESET}\n"
info "episodes/$SLUG/audio/session-plan.md"
info "episodes/$SLUG/audio/narration-readable.md"
info "episodes/$SLUG/audio/pronunciation-guide.md"
info "episodes/$SLUG/audio/pre-render-cue-sheet.md"

printf "\n${BOLD}  Ready for booth?${RESET}\n"
if [[ "$SAYABILITY_OK" == "false" ]]; then
  printf "${RED}${BOLD}  ✗ NOT READY — sayability lint found ERROR-level issues.${RESET}\n"
  printf "${RED}    Revise the flagged sentences before recording.${RESET}\n"
elif [[ $WARN_COUNT -gt 0 || $SKIP_COUNT -gt 0 ]]; then
  printf "${YELLOW}${BOLD}  ⚠ REVIEW — sayability passed but %d step(s) warned / %d skipped.${RESET}\n" \
    "$WARN_COUNT" "$SKIP_COUNT"
  printf "${YELLOW}    Check output above before entering the booth.${RESET}\n"
else
  printf "${GREEN}${BOLD}  ✓ READY — all steps passed. Good luck in the booth.${RESET}\n"
fi

printf "${BOLD}══════════════════════════════════════════════════════════════${RESET}\n\n"

# Exit 1 only if sayability had hard errors
[[ "$SAYABILITY_OK" == "true" ]]
