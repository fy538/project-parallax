#!/usr/bin/env bash
# Run all tests (Python + TypeScript typecheck).
# Used by AGENTS.md and the pre-commit hook.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "→ Python tests (all tools/)"
python3 -m pytest tools/ -q

echo "→ TypeScript typecheck (strict)"
(cd remotion-templates && npx tsc --noEmit)

echo "✓ All tests passed"
