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

# ─── Polish lint (Python over .tsx) — informational ───────────────────────
# polish_lint surfaces 29+ pre-existing findings across 14 templates (audit
# item #18: title-block + maxWidth burn-down). Run it for visibility but
# don't block — burning down is a separate workstream and we don't want CI
# red on day one of the aggregator. Re-enable as blocking once the audit's
# template-polish item lands.
echo ""
echo "→ polish_lint.py over remotion-templates/src/templates (informational)"
if python3 tools/lint/polish_lint.py >/dev/null 2>&1; then
  echo "  ✓ polish_lint clean"
else
  echo "  ⚠ polish_lint has pre-existing findings (audit item #18 burn-down)"
  echo "    run \`python3 tools/lint/polish_lint.py\` to see them"
fi

# ─── Concept registry ──────────────────────────────────────────────────────
run "concepts/lookup.py validate" \
  python3 tools/concepts/lookup.py validate

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
