#!/usr/bin/env bash
# Regenerate visual regression baselines.
#
# When to run:
#   - First time setup (currently: no baselines exist in src/__tests__/baselines/)
#   - After any intentional visual change (palette tune, animation timing,
#     template refactor that should change rendered output, React/Remotion upgrade)
#
# What it does:
#   - Wipes src/__tests__/baselines/ + .temp-renders/
#   - Renders frame 30 of every composition registered in Root.tsx
#   - Saves each as a baseline PNG
#   - Future `npm test` runs compare against these PNGs (5% size tolerance)
#
# Cost: ~3-5 min wall time. Needs Chromium (Playwright cache or system).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/remotion-templates"

echo "→ Regenerating visual regression baselines"
echo "  This renders every composition at frame 30. ~3-5 min."
echo ""

# Confirm before wiping
if [ -d "src/__tests__/baselines" ]; then
  count=$(find src/__tests__/baselines -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    echo "  Found $count existing baselines."
    read -p "  Overwrite? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "  Aborted."
      exit 1
    fi
  fi
fi

npm run test:baseline

echo ""
echo "✓ Baselines regenerated."
echo "  Commit them: git add remotion-templates/src/__tests__/baselines/"
echo "  Future regressions are now detected by: cd remotion-templates && npm test"
