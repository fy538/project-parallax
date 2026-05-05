#!/usr/bin/env bash
# Run all tests (Python + TypeScript typecheck).
# Used by AGENTS.md and the pre-commit hook.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "→ Python tests (all tools/) + coverage"
python3 -m pytest tools/ --cov=tools --cov-report=term -q

echo "→ TypeScript typecheck (strict)"
(cd remotion-templates && npx tsc --noEmit)

echo "→ Vitest unit tests (pure-function suites; visual regression has its own command)"
(cd remotion-templates && npx vitest run \
  src/__tests__/useCameraStagger.test.ts \
  src/__tests__/EpisodeSeries.test.ts \
  src/__tests__/lint-conventions.test.ts 2>&1 | tail -10)

echo "✓ All tests passed"
