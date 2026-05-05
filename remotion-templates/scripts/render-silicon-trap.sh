#!/usr/bin/env bash
#
# render-silicon-trap.sh — Render all 28 silicon-trap compositions to individual clips
#
# Usage:
#   cd remotion-templates/
#   bash scripts/render-silicon-trap.sh              # Render all clips as MP4
#   bash scripts/render-silicon-trap.sh --preview    # Render stills (frame 90) for QA
#   bash scripts/render-silicon-trap.sh --concat     # Also concatenate into preview reel
#
# Output:
#   out/silicon-trap/01-title-episode.png (or .mp4)
#   out/silicon-trap/02-kinetic-92-yield.png
#   ... etc ...

set -uo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

EPISODE="silicon-trap"
DATA_DIR="data/episodes/${EPISODE}"
OUT_DIR="out/${EPISODE}"
ENTRY="src/index.ts"
LOG_FILE="${OUT_DIR}/render.log"

# Detect browser executable
BROWSER_ARGS=()
PLAYWRIGHT_CHROME=""
for search_dir in "$HOME/Library/Caches/ms-playwright" "$HOME/.cache/ms-playwright"; do
  if [ -d "$search_dir" ]; then
    PLAYWRIGHT_CHROME=$(find "$search_dir" -name "headless_shell" 2>/dev/null | head -1)
    [ -n "$PLAYWRIGHT_CHROME" ] && break
    PLAYWRIGHT_CHROME=$(find "$search_dir" -name "Google Chrome for Testing" 2>/dev/null | head -1)
    [ -n "$PLAYWRIGHT_CHROME" ] && break
  fi
done

if [ -n "${PLAYWRIGHT_CHROME}" ]; then
  BROWSER_ARGS=("--browser-executable=${PLAYWRIGHT_CHROME}")
  echo "Using Playwright Chromium: ${PLAYWRIGHT_CHROME}"
elif [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  BROWSER_ARGS=("--browser-executable=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
  echo "Using system Chrome"
else
  echo "Using Remotion's default browser"
fi

# Parse flags
PREVIEW_MODE=false
CONCAT_MODE=false
for arg in "$@"; do
  case $arg in
    --preview) PREVIEW_MODE=true ;;
    --concat)  CONCAT_MODE=true ;;
  esac
done

# ─── Sequence Definition (v5 production script) ────────────────────────────
#
# Format: SEQ_NUM|COMPOSITION_ID|JSON_FILE|DESCRIPTION
# Matches SiliconTrap.tsx clips array — this IS the source of truth for render order.

SEQUENCES=(
  # Opening
  "01|TitleTransition|title-episode.json|Episode title"

  # Beat 1 — Opening stats
  "02|KineticTypography|kinetic-92-yield.json|92% yield stat"
  "03|KineticTypography|kinetic-165b.json|$165B market stat"
  "04|DataChart|chart-7pct-demand.json|7% demand chart"

  # Beat 2 — The Logic of Denial
  "05|TitleTransition|title-section-denial.json|Section: Denial"
  "06|DualTimeline|dual-timeline-oil-chips.json|Oil embargo vs chip controls"
  "07|KineticTypography|kinetic-revenue-deal.json|Revenue deal quote"
  "08|DataChart|chart-chips-act.json|CHIPS Act chart"
  "09|ChoroplethMap|choropleth-cocom.json|CoCom map"
  "10|FrameworkDiagram|framework-cocom-china.json|CoCom vs China framework"

  # Beat 3 — The Other Side of the Wall
  "11|TitleTransition|title-section-wall.json|Section: The Wall"
  "12|KineticTypography|kinetic-kabozi.json|Kabozi definition"
  "13|KineticTypography|kinetic-juguo.json|Juguo tizhi definition"
  "14|DataChart|chart-lithography.json|Lithography passes"
  "15|TimeSeriesChart|timeseries-smic-yield.json|SMIC 7nm yield trajectory"
  "16|FrameworkDiagram|framework-kirin-teardown.json|Kirin teardown"
  "17|KineticTypography|kinetic-deepseek-zero.json|DeepSeek zero-shot"

  # Beat 4 — The Trap
  "18|TitleTransition|title-section-trap.json|Section: The Trap"
  "19|GameBoard|gameboard-chess.json|Chess metaphor"
  "20|GameBoard|gameboard-go.json|Go metaphor"
  "21|RouteAnimation|route-chip-supply.json|Supply chain route"
  "22|KineticTypography|kinetic-trap.json|Trap quote"
  "23|ChoroplethMap|choropleth-caught-between.json|Caught between map"
  "24|KineticTypography|kinetic-morris-chang.json|Morris Chang quote"

  # Beat 5 — Your Chips
  "25|TitleTransition|title-section-chips.json|Section: Your Chips"
  "26|DecisionTree|decisiontree-ai-timeline.json|AI timeline decision tree"
  "27|RouteAnimation|route-bifurcation.json|Bifurcation route"

  # Closing
  "28|TitleTransition|title-endcard.json|End card"
)

TOTAL=${#SEQUENCES[@]}

# ─── Render Loop ─────────────────────────────────────────────────────────────

mkdir -p "${OUT_DIR}"
echo "═══════════════════════════════════════════════════════" | tee "${LOG_FILE}"
echo "  Silicon Trap Render — $(date)" | tee -a "${LOG_FILE}"
echo "  Mode: $(${PREVIEW_MODE} && echo 'PREVIEW (stills)' || echo 'FULL (MP4)')" | tee -a "${LOG_FILE}"
echo "  Compositions: ${TOTAL}" | tee -a "${LOG_FILE}"
echo "  Output: ${OUT_DIR}/" | tee -a "${LOG_FILE}"
echo "═══════════════════════════════════════════════════════" | tee -a "${LOG_FILE}"

RENDERED=0
FAILED=0
SKIPPED=0

for entry in "${SEQUENCES[@]}"; do
  IFS='|' read -r SEQ COMP_ID JSON_FILE DESC <<< "$entry"

  SLUG="${JSON_FILE%.json}"
  JSON_PATH="${DATA_DIR}/${JSON_FILE}"

  if [ ! -f "${JSON_PATH}" ]; then
    echo "  [SKIP] #${SEQ} ${DESC} — ${JSON_FILE} not found" | tee -a "${LOG_FILE}"
    ((SKIPPED++))
    continue
  fi

  # Build props file
  PROPS_FILE="${OUT_DIR}/_props-${SEQ}.json"
  python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
with open(sys.argv[2], 'w') as f:
    json.dump({'data': data}, f)
" "${JSON_PATH}" "${PROPS_FILE}"

  MAX_RETRIES=2
  ATTEMPT=0
  SUCCESS=false

  if ${PREVIEW_MODE}; then
    OUTPUT="${OUT_DIR}/${SEQ}-${SLUG}.png"
    echo -n "  [${SEQ}/${TOTAL}] Still: ${DESC}..." | tee -a "${LOG_FILE}"

    while [ $ATTEMPT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
      if npx remotion still "${ENTRY}" "${COMP_ID}" \
        --frame=90 \
        "--props=${PROPS_FILE}" \
        "${BROWSER_ARGS[@]}" \
        "--output=${OUTPUT}" 2>>"${LOG_FILE}"; then
        SUCCESS=true
      else
        ((ATTEMPT++))
        if [ $ATTEMPT -lt $MAX_RETRIES ]; then
          echo -n " (retry)..." | tee -a "${LOG_FILE}"
          sleep 2
        fi
      fi
    done
  else
    OUTPUT="${OUT_DIR}/${SEQ}-${SLUG}.mp4"
    echo -n "  [${SEQ}/${TOTAL}] MP4: ${DESC}..." | tee -a "${LOG_FILE}"

    while [ $ATTEMPT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
      if npx remotion render "${ENTRY}" "${COMP_ID}" \
        "--props=${PROPS_FILE}" \
        "${BROWSER_ARGS[@]}" \
        "${OUTPUT}" 2>>"${LOG_FILE}"; then
        SUCCESS=true
      else
        ((ATTEMPT++))
        if [ $ATTEMPT -lt $MAX_RETRIES ]; then
          echo -n " (retry)..." | tee -a "${LOG_FILE}"
          sleep 2
        fi
      fi
    done
  fi

  if $SUCCESS; then
    echo " ✓" | tee -a "${LOG_FILE}"
    ((RENDERED++))
  else
    echo " ✗ FAILED" | tee -a "${LOG_FILE}"
    ((FAILED++))
  fi

  rm -f "${PROPS_FILE}"
  sleep 1
done

echo "═══════════════════════════════════════════════════════" | tee -a "${LOG_FILE}"
echo "  Done: ${RENDERED} rendered, ${FAILED} failed, ${SKIPPED} skipped" | tee -a "${LOG_FILE}"
echo "═══════════════════════════════════════════════════════" | tee -a "${LOG_FILE}"

# ─── Concatenation (optional) ───────────────────────────────────────────────

if ${CONCAT_MODE} && ! ${PREVIEW_MODE}; then
  echo "" | tee -a "${LOG_FILE}"
  echo "Concatenating into preview reel..." | tee -a "${LOG_FILE}"

  CONCAT_LIST="${OUT_DIR}/concat.txt"
  > "${CONCAT_LIST}"

  for entry in "${SEQUENCES[@]}"; do
    IFS='|' read -r SEQ _ JSON_FILE _ <<< "$entry"
    SLUG="${JSON_FILE%.json}"
    MP4="${OUT_DIR}/${SEQ}-${SLUG}.mp4"
    if [ -f "${MP4}" ]; then
      echo "file '$(basename "${MP4}")'" >> "${CONCAT_LIST}"
    fi
  done

  REEL="${OUT_DIR}/silicon-trap-preview-reel.mp4"

  if ffmpeg -y -f concat -safe 0 -i "${CONCAT_LIST}" \
    -c copy "${REEL}" 2>>"${LOG_FILE}"; then
    echo "  Preview reel: ${REEL}" | tee -a "${LOG_FILE}"
  else
    echo "  Re-encoding for concat..." | tee -a "${LOG_FILE}"
    ffmpeg -y -f concat -safe 0 -i "${CONCAT_LIST}" \
      -c:v libx264 -preset fast -crf 18 \
      -pix_fmt yuv420p "${REEL}" 2>>"${LOG_FILE}" && \
      echo "  Preview reel: ${REEL}" | tee -a "${LOG_FILE}"
  fi

  rm -f "${CONCAT_LIST}"
fi

echo ""
echo "All outputs in: ${OUT_DIR}/"
