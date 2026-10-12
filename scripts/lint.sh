#!/usr/bin/env bash
# Aggregator lint — runs every static-check the repo has, in order from
# cheapest to most expensive. Replaces the prior one-line wrapper that only
# ran the Remotion convention linter (which left Python, manifest, concepts,
# polish, and direction-field lints unenforced unless run by hand).
#
# Used by CI (`./scripts/lint.sh`) and available locally for the same
# guarantee. The pre-commit hook still runs a CHANGED-FILES subset of these
# checks for speed — this script runs the full suite for CI / pre-push.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Use a Python that has the project's packages (see scripts/_python.sh).
# shellcheck source=scripts/_python.sh
. scripts/_python.sh

# Tally failures rather than failing fast, so an operator running this
# locally sees all problems in one pass instead of fix-rerun-fix-rerun.
failures=0
run() {
  local label="$1"; shift
  echo ""
  echo "→ $label"
  if "$@"; then
    echo "  ✓ $label"
  else
    echo "  ✗ $label FAILED"
    failures=$((failures + 1))
  fi
}

# ─── Dev hook installation guard (advisory, non-blocking) ──────────────────
# The pipeline auto-sync (stateEnteredAt stamping + dashboard refresh + the
# source-consistency gate) lives in .githooks/pre-commit and only fires when
# core.hooksPath points at .githooks. A fresh clone defaults to .git/hooks and
# silently skips it, so the "automatic" tracking is dormant. Warn rather than
# fail — CI runs this script directly and never commits.
HOOKS_PATH="$(git config --get core.hooksPath || echo '')"
if [ "$HOOKS_PATH" != ".githooks" ]; then
  echo ""
  echo "  ! git hooks NOT installed (core.hooksPath='${HOOKS_PATH:-<default>}', expected '.githooks')."
  echo "    Pipeline auto-sync + dashboard refresh on commit are DORMANT. Activate with:"
  echo "      ./scripts/bootstrap.sh"
fi

# ─── Python ────────────────────────────────────────────────────────────────
# ruff baseline is zero — anything new should fail this. Per pyproject.toml.
if python3 -m ruff --version >/dev/null 2>&1; then
  run "ruff check tools/" python3 -m ruff check tools/
else
  echo "  ! ruff not installed; skipping. install with: pip install -e '.[dev]'"
fi

# ─── Remotion convention lint (TypeScript) ─────────────────────────────────
run "remotion lint-conventions.mjs" \
  bash -c "cd remotion-templates && npm run lint --silent"

# ─── Direction-field audit ─────────────────────────────────────────────────
run "remotion audit-direction-fields.mjs --strict" \
  bash -c "cd remotion-templates && npm run lint:direction --silent"

# ─── Polish lint (Python over .tsx) — blocking ────────────────────────────
# Promoted from "informational" to "blocking" May 18, 2026 (audit #18) once
# the 9 pre-existing missing-title-block errors were resolved (8 by adding
# EditorialFrame/MapTitleFrame delegation detection to polish_lint, 1 by
# adding @title-block: delegated pragma to AtlasAnnotation). Polish_lint
# exits 0 on warnings only; the 20 remaining L9 maxWidth warnings don't
# fail CI. They're a separate workstream tracked in POLISH.md.
run "polish_lint.py over remotion-templates/src/templates" \
  python3 tools/lint/polish_lint.py

# ─── Concept registry ──────────────────────────────────────────────────────
run "concepts/lookup.py validate" \
  python3 tools/concepts/lookup.py validate

# ─── Brand-mark literal guard (Python sibling of TS no-literal-brand-mark) ─
# Blocks new hardcoded `∴` in tools/*.py. The glyph is centralized in
# palette.json::brandMark.glyph (read via tools.brand.get_brand_mark()).
run "check_brand_mark.py (no hardcoded `∴` in tools/)" \
  python3 tools/lint/check_brand_mark.py

# ─── Status-emoji guard (no hardcoded 🟢/🟡/🔴 outside tools/status_emoji.py) ─
run "check_status_emoji.py (no hardcoded 🟢/🟡/🔴 in tools/)" \
  python3 tools/lint/check_status_emoji.py

# ─── Script-stage lint (per-episode, errors only) ──────────────────────────
# script_lint.py exits non-zero only on error-severity rules (deprecated cut()
# types, invalid PACE:, verification-process narration); warnings print but pass.
shopt -s nullglob
scripts=(episodes/*/script.md)
shopt -u nullglob
for sc in "${scripts[@]}"; do
  case "$sc" in *EPISODE_TEMPLATE*) continue;; esac
  run "script_lint.py ($sc)" python3 tools/lint/script_lint.py "$sc"
done

# ─── Assembly-manifest doctrine lint (per-episode) ─────────────────────────
# manifest_lint expects file path args. Find all current assembly manifests.
shopt -s nullglob
manifests=(remotion-templates/data/episodes/*/assembly-manifest.json)
shopt -u nullglob
if [ ${#manifests[@]} -gt 0 ]; then
  run "manifest_lint.py (${#manifests[@]} manifest(s))" \
    python3 tools/lint/manifest_lint.py "${manifests[@]}"
else
  echo "  (no assembly manifests found; skipping manifest lint)"
fi

# ─── Generated TypeScript types fresh (cross-language schema gate) ────────
# Schemas under data/*.schema.json drive both Python validation and
# TypeScript types via npm run gen:types. If a schema is edited but the
# .d.ts isn't regenerated, this fails — preventing Python/TS drift at
# the source-of-truth seam (audit #4).
run "gen:types:check (cross-language schema → .d.ts freshness)" \
  bash -c "cd remotion-templates && npm run gen:types:check --silent"

# ─── Math-formula validation (M-MATH-VALID) ────────────────────────────────
# Scans every JSON file under remotion-templates/data/episodes/** for
# math-render data shapes (MathReveal/MathDerivation) and runs each
# `formula` through KaTeX strict parser. Catches TeX typos before they
# surface as inline red errors in a render. Doctrine: MATH_RENDER_REGISTER.md.
run "lint-math-formulas (M-MATH-VALID — KaTeX parse check)" \
  bash -c "cd remotion-templates && node scripts/lint-math-formulas.mjs"

# ─── Pipeline dashboard HTML fresh ────────────────────────────────────────
# episodes/PIPELINE.html is auto-generated from pipeline-state.json +
# per-episode _status.md + project/IDEAS.md. If any source drifts ahead
# of the HTML, this fails — same "single source of truth" gate pattern
# as gen:types:check above. (HTML sits next to PIPELINE.md so the visual
# + Markdown surfaces stay together.)
run "pipeline_validator --emit-html --check (dashboard HTML freshness)" \
  python3 tools/pipeline_validator.py --emit-html --check

# ─── Pipeline dashboard Markdown fresh ────────────────────────────────────
# Same freshness contract for episodes/PIPELINE.md: the At-a-glance table
# (days-in-state + Health column) and the auto-Topics block must match what
# regeneration would produce. Catches the "committed table silently ages
# between manual check-episode.sh runs" failure mode.
run "pipeline_validator --update-tracker --check (dashboard MD freshness)" \
  python3 tools/pipeline_validator.py --update-tracker --check

# ─── Episode state source-of-truth consistency ────────────────────────────
# pipeline-state.json is canonical. The CLAUDE.md Status table and the
# IDEAS.md Launch-sequence table mirror it; this gate fails if either drifts
# so the three surfaces can never silently contradict each other again.
run "pipeline_validator --check-sources (state table consistency)" \
  python3 tools/pipeline_validator.py --check-sources

# ─── Doc-link sanity (cheap; checks cross-references) ──────────────────────
if [ -x ./scripts/check-docs.sh ]; then
  run "check-docs.sh" ./scripts/check-docs.sh
fi

# ─── Summary ───────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$failures" -eq 0 ]; then
  echo "✓ All lint checks passed"
else
  echo "✗ $failures check(s) failed — see above"
  exit 1
fi
