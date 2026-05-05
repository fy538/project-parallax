#!/bin/bash
# render-prisoners-dilemma.sh
# Renders the prisoners-dilemma showcase composition to a single MP4.
#
# Usage:
#   cd ~/project-parallax/remotion-templates
#   bash scripts/render-prisoners-dilemma.sh
#
# Output: out/prisoners-dilemma-showcase.mp4 (~4 min, all 33 compositions in sequence)
#
# Note: ChoroplethMap (Ostrom's cases) renders as a placeholder in headless mode
# because WebGL isn't available. Preview it live in Remotion Studio instead.
#
# For quick frame-by-frame preview instead:
#   npx remotion studio
#   → Navigate to Episodes > prisoners-dilemma-showcase
#   → Scrub through timeline (each clip labeled with beat/description)

set -e

cd "$(dirname "$0")/.."

echo "╔══════════════════════════════════════════════════════╗"
echo "║  Rendering: prisoners-dilemma-showcase              ║"
echo "║  33 compositions → single MP4                      ║"
echo "║  (ChoroplethMap = placeholder; preview in Studio)  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

mkdir -p out

# Full video render
# --timeout=60000 gives extra time for font loading
# --concurrency=2 reduces memory pressure from parallel tabs
npx remotion render prisoners-dilemma-showcase \
  out/prisoners-dilemma-showcase.mp4 \
  --codec=h264 \
  --crf=18 \
  --timeout=60000 \
  --concurrency=2

echo ""
echo "✅ Done: out/prisoners-dilemma-showcase.mp4"
echo ""
echo "To render just a section (e.g., first 30 seconds):"
echo "  npx remotion render prisoners-dilemma-showcase out/preview.mp4 --frames=0-900"
echo ""
echo "To preview ChoroplethMap live (needs WebGL):"
echo "  npx remotion studio → Episodes → prisoners-dilemma-showcase"
