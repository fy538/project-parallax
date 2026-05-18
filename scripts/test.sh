#!/usr/bin/env bash
# Run all tests (Python + TypeScript typecheck).
# Used by AGENTS.md and the pre-commit hook.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Bootstrap sanity check — the documented pre-commit gates only fire when
# git core.hooksPath points at .githooks/. Default-config clones silently
# skip every check. Warn loudly here (cheap, non-blocking) so the test
# command also doubles as a "is your dev env wired correctly?" beacon.
hooks_path=$(git config --get core.hooksPath || echo "")
if [ "$hooks_path" != ".githooks" ]; then
  echo "  ! WARNING: git core.hooksPath is '${hooks_path:-<default>}', should be '.githooks'"
  echo "    Pre-commit gate is NOT firing on this clone. Run:  ./scripts/bootstrap.sh"
fi

echo "→ Python tests (all tools/) + coverage"
python3 -m pytest tools/ --cov=tools --cov-report=term -q

echo "→ TypeScript typecheck (strict)"
(cd remotion-templates && npx tsc --noEmit)

echo "→ Vitest unit tests (npm run test:unit — pure-function suites)"
# Use the canonical npm script (which uses vitest.unit.config.ts) instead of
# a hardcoded file list. The hardcoded list went stale every time a new unit
# test was added — locally it'd pass `./scripts/test.sh` while CI's
# `npm run test:unit` would actually run them. Single source of truth wins.
# (Visual regression has its own command: `npm run test:visual`.)
(cd remotion-templates && npm run test:unit 2>&1 | tail -10)

echo "✓ All tests passed"
