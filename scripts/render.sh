#!/usr/bin/env bash
# render.sh — composite render wrapper: preflight → render-episode → postflight
#
# Chains three steps into one command with a permanent per-episode render log:
#   1. preflight.py  — verify asset paths + manifest integrity (hard gate)
#   2. render_log.py — wrap render-episode.mjs with tee'd log to episodes/<slug>/render-logs/
#   3. postflight.py — QA the rendered output (soft; render exit code takes precedence)
#
# Usage:
#   ./scripts/render.sh <episode-slug> [render-episode options...]
#   ./scripts/render.sh silicon-trap
#   ./scripts/render.sh silicon-trap --preview
#   ./scripts/render.sh silicon-trap --only=05,06,07
#   ./scripts/render.sh silicon-trap --from=16
#   ./scripts/render.sh silicon-trap --skip-preflight   # bypass preflight gate
#
# Exit codes:
#   0 — render succeeded (postflight warnings do not change this)
#   1 — preflight failed (no render attempted) OR render failed
#   2 — usage error

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS="$ROOT/tools"
SCRIPTS="$ROOT/remotion-templates/scripts"

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

# ── Argument parsing ──────────────────────────────────────────────────────────

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <episode-slug> [render-episode options...]" >&2
  echo "       $0 silicon-trap" >&2
  echo "       $0 silicon-trap --preview" >&2
  echo "       $0 silicon-trap --only=05,06 --from=16" >&2
  echo "       $0 silicon-trap --skip-preflight" >&2
  exit 2
fi

SLUG="$1"
shift

# Separate our flags from flags forwarded to render-episode.mjs
SKIP_PREFLIGHT=false
RENDER_ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--skip-preflight" ]]; then
    SKIP_PREFLIGHT=true
  else
    RENDER_ARGS+=("$arg")
  fi
done

# ── Banner ────────────────────────────────────────────────────────────────────

printf "\n${BOLD}╔═══════════════════════════════════════════════════════════╗${RESET}\n"
printf "${BOLD}║  render: %-49s ║${RESET}\n" "$SLUG"
printf "${BOLD}╚═══════════════════════════════════════════════════════════╝${RESET}\n"

# ── Step 1: Preflight ─────────────────────────────────────────────────────────

if [[ "$SKIP_PREFLIGHT" == "true" ]]; then
  warn "Preflight skipped (--skip-preflight)"
else
  step "Preflight — asset paths + manifest integrity"
  PREFLIGHT_EXIT=0
  python3 "$TOOLS/preflight.py" "$SLUG" || PREFLIGHT_EXIT=$?

  if [[ $PREFLIGHT_EXIT -eq 1 ]]; then
    fail "Preflight failed — fix errors before rendering"
    printf "\n${RED}${BOLD}  Render aborted. Run without --skip-preflight once errors are resolved.${RESET}\n\n"
    exit 1
  elif [[ $PREFLIGHT_EXIT -eq 2 ]]; then
    fail "Preflight usage error (unknown episode or missing manifest?)"
    exit 1
  else
    # Exit 0: all assets found (pending assets reported informally above)
    pass "Preflight passed"
  fi
fi

# ── Step 2: Render (wrapped in render_log.py for permanent log) ───────────────

step "Render — node remotion-templates/scripts/render-episode.mjs"

# Always pass --skip-preflight here: preflight was already run (or explicitly
# skipped by the user). This prevents a redundant second preflight run inside
# render-episode.mjs since render.sh owns the preflight step.
RENDER_CMD=(node "$SCRIPTS/render-episode.mjs" "$SLUG" --skip-preflight "${RENDER_ARGS[@]+"${RENDER_ARGS[@]}"}")

RENDER_EXIT=0
python3 "$TOOLS/render_log.py" \
  --episode "$SLUG" \
  --label "render" \
  -- "${RENDER_CMD[@]}" || RENDER_EXIT=$?

# ── Step 3: Postflight ────────────────────────────────────────────────────────

# Postflight is a soft gate: render exit code is what matters.
# We run postflight regardless (it surfaces silent MP4 corruption).
# postflight.py requires an MP4 path as its first positional arg;
# without --output we skip it since we don't know the canonical output path
# for multi-clip episode renders (each clip has its own MP4).
step "Postflight — QA summary"

OUT_DIR="$ROOT/remotion-templates/out/$SLUG"
if [[ -d "$OUT_DIR" ]]; then
  POSTFLIGHT_EXIT=0
  python3 "$TOOLS/postflight.py" "$OUT_DIR" --episode "$SLUG" 2>/dev/null || POSTFLIGHT_EXIT=$?
  if [[ $POSTFLIGHT_EXIT -ne 0 ]]; then
    warn "Postflight reported anomalies (non-blocking — render exit code takes precedence)"
  else
    pass "Postflight passed"
  fi
else
  warn "Output directory $OUT_DIR not found — postflight skipped"
fi

# ── Summary ───────────────────────────────────────────────────────────────────

printf "\n${BOLD}══════════════════════════════════════════════════════════════${RESET}\n"
if [[ $RENDER_EXIT -eq 0 ]]; then
  printf "${GREEN}${BOLD}  ✓ Render complete — $SLUG${RESET}\n"
  printf "${GREEN}    Outputs: $OUT_DIR/${RESET}\n"
  printf "${GREEN}    Log:     $ROOT/episodes/$SLUG/render-logs/${RESET}\n"
else
  printf "${RED}${BOLD}  ✖ Render failed — $SLUG (exit $RENDER_EXIT)${RESET}\n"
  printf "${RED}    Check per-clip .error.log files in: $OUT_DIR/${RESET}\n"
fi
printf "${BOLD}══════════════════════════════════════════════════════════════${RESET}\n\n"

exit $RENDER_EXIT
