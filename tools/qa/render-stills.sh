#!/usr/bin/env bash
#
# render-stills.sh — Render frame stills for every Remotion composition.
#
# Captures frame 0 (entrance state) and a midpoint frame (steady state)
# for each registered composition. Output goes to tools/qa/stills/.
#
# These stills are consumed by the visual-qa skill for AI-powered
# screenshot analysis against POLISH.md rules.
#
# Usage:
#   ./render-stills.sh                  # render all compositions
#   ./render-stills.sh DataChart        # render one composition
#   ./render-stills.sh --list           # list available compositions
#   ./render-stills.sh --clean          # remove previous stills
#
# Requirements: npx remotion must work in the remotion-templates/ directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REMOTION_DIR="$PROJECT_DIR/remotion-templates"
STILLS_DIR="$SCRIPT_DIR/stills"

# All registered composition IDs (from Root.tsx)
COMPOSITIONS=(
    TitleTransition
    ChoroplethMap
    RouteAnimation
    TimelineComparison
    DataChart
    TimeSeriesChart
    SankeyFlow
    ProbabilityGauge
    KineticTypography
    FrameworkDiagram
    NetworkDiagram
    SplitComposition
    DecisionTree
    GameBoard
    ImageComposite
    PhotoMontage
    KineticShort
    DataChartShort
    SplitShort
)

# Default midpoint frames per composition (based on typical duration)
# These land ~40% into the composition where content is fully revealed
declare -A MIDPOINTS=(
    [TitleTransition]=45
    [ChoroplethMap]=90
    [RouteAnimation]=120
    [TimelineComparison]=90
    [DataChart]=75
    [TimeSeriesChart]=90
    [SankeyFlow]=75
    [ProbabilityGauge]=60
    [KineticTypography]=90
    [FrameworkDiagram]=75
    [NetworkDiagram]=75
    [SplitComposition]=60
    [DecisionTree]=75
    [GameBoard]=75
    [ImageComposite]=60
    [PhotoMontage]=75
    [KineticShort]=45
    [DataChartShort]=45
    [SplitShort]=45
)

# ─── Functions ───────────────────────────────────────────────────────────────

usage() {
    echo "Usage: render-stills.sh [OPTIONS] [COMPOSITION...]"
    echo ""
    echo "Options:"
    echo "  --list    List available compositions"
    echo "  --clean   Remove previous stills"
    echo "  --help    Show this help"
    echo ""
    echo "Renders frame 0 (entrance) and midpoint (steady state) for each composition."
    echo "Output: tools/qa/stills/<CompositionId>-frame<N>.png"
}

list_compositions() {
    echo "Available compositions:"
    for comp in "${COMPOSITIONS[@]}"; do
        mid=${MIDPOINTS[$comp]:-60}
        echo "  $comp  (midpoint: frame $mid)"
    done
}

render_still() {
    local comp=$1
    local frame=$2
    local output="$STILLS_DIR/${comp}-frame${frame}.png"

    echo "  📸 $comp frame $frame → $(basename "$output")"

    npx remotion still \
        --comp="$comp" \
        --frame="$frame" \
        --output="$output" \
        --log=error \
        2>&1 | grep -v "^$" || true
}

render_composition() {
    local comp=$1
    local mid=${MIDPOINTS[$comp]:-60}

    echo ""
    echo "━━━ $comp ━━━"

    # Frame 0: entrance state
    render_still "$comp" 0

    # Midpoint: steady state (content fully revealed)
    render_still "$comp" "$mid"
}

# ─── Main ────────────────────────────────────────────────────────────────────

cd "$REMOTION_DIR"

# Parse arguments
if [[ $# -gt 0 ]]; then
    case "$1" in
        --help|-h)
            usage
            exit 0
            ;;
        --list)
            list_compositions
            exit 0
            ;;
        --clean)
            echo "Cleaning stills directory..."
            rm -rf "$STILLS_DIR"
            echo "Done."
            exit 0
            ;;
    esac
fi

# Create output directory
mkdir -p "$STILLS_DIR"

# Determine which compositions to render
if [[ $# -gt 0 ]]; then
    # Render only specified compositions
    TARGETS=("$@")
else
    # Render all
    TARGETS=("${COMPOSITIONS[@]}")
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Remotion Still Renderer — POLISH.md Visual QA Pipeline  ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Compositions: ${#TARGETS[@]}                                        ║"
echo "║  Frames per:   2 (entrance + midpoint)                   ║"
echo "║  Output:       tools/qa/stills/                          ║"
echo "╚════════════════════════════════════════════════════════════╝"

TOTAL=0
FAILED=0

for comp in "${TARGETS[@]}"; do
    # Verify composition exists in our list
    if [[ ! -v "MIDPOINTS[$comp]" ]] && ! printf '%s\n' "${COMPOSITIONS[@]}" | grep -qx "$comp"; then
        echo "⚠️  Unknown composition: $comp (skipping)"
        ((FAILED++)) || true
        continue
    fi

    render_composition "$comp"
    ((TOTAL++)) || true
done

echo ""
echo "──────────────────────────────────────────────────────────────"
STILL_COUNT=$(find "$STILLS_DIR" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
echo "  ✅ Rendered $TOTAL compositions → $STILL_COUNT stills in tools/qa/stills/"
if [[ $FAILED -gt 0 ]]; then
    echo "  ⚠️  $FAILED compositions skipped (unknown ID)"
fi
echo "  Next: run visual-qa skill to analyze stills against POLISH.md"
echo "──────────────────────────────────────────────────────────────"
