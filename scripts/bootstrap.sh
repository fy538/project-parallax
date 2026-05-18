#!/usr/bin/env bash
# bootstrap.sh — one-shot setup for a fresh clone (or a clone where the
# hooks path drifted back to default). Idempotent: safe to re-run.
#
# What it does:
#   1. Points git at .githooks/ so the documented pre-commit gate actually
#      fires. By default git uses .git/hooks/, which doesn't see our
#      tracked hook — meaning every documented gate (schema validation,
#      manifest doctrine, concept registry, pipeline auto-sync) is dormant
#      on commit unless this script has been run.
#   2. Verifies the Python deps declared in pyproject.toml are importable,
#      and prints a one-line install hint if not.
#   3. Reports the current state of both checks.
#
# Run once after cloning, or any time `core.hooksPath` looks off:
#   ./scripts/bootstrap.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "→ bootstrap: setting up project-parallax dev environment"

# ─── 1. Pre-commit hook ────────────────────────────────────────────────────
current_hooks_path=$(git config --get core.hooksPath || echo "")
if [ "$current_hooks_path" = ".githooks" ]; then
  echo "  ✓ git core.hooksPath already → .githooks"
else
  git config core.hooksPath .githooks
  echo "  ✓ git core.hooksPath set → .githooks (was: ${current_hooks_path:-<default>})"
fi

# Sanity: hook file exists and is executable
if [ ! -x ".githooks/pre-commit" ]; then
  echo "  ! .githooks/pre-commit missing or not executable — fixing"
  chmod +x .githooks/pre-commit
fi

# ─── 2. Python deps spot-check ─────────────────────────────────────────────
echo "→ bootstrap: checking core Python deps"
missing=$(python3 -c "
import importlib, sys
missing = []
for mod in ('jsonschema', 'requests', 'pytest'):
    try:
        importlib.import_module(mod)
    except ImportError:
        missing.append(mod)
print(' '.join(missing))
" 2>/dev/null || echo "PYTHON_BROKEN")

if [ "$missing" = "PYTHON_BROKEN" ]; then
  echo "  ✗ python3 invocation failed — install Python 3.10+ first"
  exit 1
elif [ -n "$missing" ]; then
  echo "  ! missing required Python packages: $missing"
  echo "    install with:  pip install -e '.[dev]'"
  echo "    (or for core only:  pip install -e .)"
else
  echo "  ✓ core Python deps importable"
fi

# ─── 3. Node deps spot-check (informational only) ──────────────────────────
if [ ! -d "remotion-templates/node_modules" ]; then
  echo "  ! remotion-templates/node_modules missing — run:  cd remotion-templates && npm install"
fi

echo "✓ bootstrap complete"
echo ""
echo "  Verify:  git config core.hooksPath  # should print: .githooks"
echo "  Hook fires on: .ts/.tsx/.py/.json changes (see .githooks/pre-commit)"
