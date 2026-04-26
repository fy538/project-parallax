#!/usr/bin/env bash
#
# render-ep01.sh — Render all 24 EP01 compositions to individual MP4 clips
#
# Usage:
#   cd remotion-templates/
#   bash scripts/render-ep01.sh              # Render all clips
#   bash scripts/render-ep01.sh --preview    # Render stills (frame 90) for QA
#   bash scripts/render-ep01.sh --concat     # Also concatenate into preview reel
#
# Prerequisites:
#   - npm install (Remotion + dependencies)
#   - For local: Chromium via Remotion's default or system Chrome
#   - For sandbox: npx playwright install chromium
#
# Output:
#   out/ep01/01-title-episode.mp4
#   out/ep01/02-title-section-act1.mp4
#   ... etc ...
#   out/ep01/ep01-preview-reel.mp4  (if --concat)

set -uo pipefail  # no -e: we handle errors per-command

# ─── Configuration ───────────────────────────────────────────────────────────

EPISODE="ep01"
DATA_DIR="data/episodes/${EPISODE}"
OUT_DIR="out/${EPISODE}"
ENTRY="src/index.ts"
LOG_FILE="${OUT_DIR}/render.log"

# Detect browser executable
# macOS: ~/Library/Caches/ms-playwright   Linux: ~/.cache/ms-playwright
# Store as an array to handle paths with spaces correctly
BROWSER_ARGS=()
PLAYWRIGHT_CHROME=""
for search_dir in "$HOME/Library/Caches/ms-playwright" "$HOME/.cache/ms-playwright"; do
  if [ -d "$search_dir" ]; then
    PLAYWRIGHT_CHROME=$(find "$search_dir" -name "headless_shell" 2>/dev/null | head -1)
    [ -n "$PLAYWRIGHT_CHROME" ] && break
    # macOS may use "Google Chrome for Testing" binary instead
    PLAYWRIGHT_CHROME=$(find "$search_dir" -name "Google Chrome for Testing" 2>/dev/null | head -1)
    [ -n "$PLAYWRIGHT_CHROME" ] && break
  fi
done

if [ -n "${PLAYWRIGHT_CHROME}" ]; then
  BROWSER_ARGS=("--browser-executable=${PLAYWRIGHT_CHROME}")
  echo "Using Playwright Chromium: ${PLAYWRIGHT_CHROME}"
else
  # Try system Chrome on macOS
  if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    BROWSER_ARGS=("--browser-executable=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    echo "Using system Chrome"
  else
    echo "Using Remotion's default browser"
  fi
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

# ─── Sequence Definition ────────────────────────────────────────────────────
#
# Format: SEQ_NUM|COMPOSITION_ID|JSON_FILE|DESCRIPTION
# Order matches SEQUENCE.md — this IS the source of truth for render order.

SEQUENCES=(
  # Opening
  "01|TitleTransition|title-episode.json|Episode title"

  # Beat 1 — The Paradox
  "02|TitleTransition|title-section-act1.json|Section I card"
  "03|ChoroplethMap|choropleth-reshoring.json|TSMC Arizona reshoring"
  "04|KineticTypography|kinetic-7pct.json|7% statistic"

  # Beat 2 — The Logic of Denial
  "05|TitleTransition|title-section-denial.json|Section II card"
  "06|TimelineComparison|timeline-oil-chips.json|Oil embargo vs chip controls"
  "07|DataChart|chart-export-controls.json|Export controls timeline"
  "08|FrameworkDiagram|framework-cocom-china.json|COCOM vs China"

  # Beat 3 — The Other Side of the Wall
  "09|TitleTransition|title-section-wall.json|Section III card"
  "10|KineticTypography|kinetic-kabozi.json|Kabozi definition"
  "11|DataChart|chart-pen-contrast.json|Ballpoint pen paradox"
  "12|KineticTypography|kinetic-juguo.json|Juguo tizhi definition"
  "13|DataChart|chart-lithography.json|Lithography passes comparison"
  "14|DataChart|chart-kirin-teardown.json|Kirin X90 teardown"
  "15|TimelineComparison|timeline-deepseek.json|DeepSeek triumph vs reality"

  # Beat 4 — The Trap
  "16|TitleTransition|title-section-trap.json|Section IV card"
  "17|FrameworkDiagram|framework-chess-go.json|Chess vs Go"
  "18|RouteAnimation|route-chip-supply.json|Supply chain route"
  "19|ChoroplethMap|choropleth-supply-chain.json|Global supply chain map"
  "20|KineticTypography|kinetic-morris-chang.json|Morris Chang quote"
  "21|ChoroplethMap|choropleth-bifurcation.json|Bifurcation map"

  # Beat 5 — Your Chips
  "22|TitleTransition|title-section-chips.json|Section V card"
  "23|DataChart|chart-chips-everywhere.json|Chips in everyday devices"

  # Closing
  "24|TitleTransition|title-endcard.json|End card + CTA"
)

# ─── Render Loop ─────────────────────────────────────────────────────────────

mkdir -p "${OUT_DIR}"
echo "═══════════════════════════════════════════════════════" | tee "${LOG_FILE}"
echo "  EP01 Render — $(date)" | tee -a "${LOG_FILE}"
echo "  Mode: $(${PREVIEW_MODE} && echo 'PREVIEW (stills)' || echo 'FULL (MP4)')" | tee -a "${LOG_FILE}"
echo "  Output: ${OUT_DIR}/" | tee -a "${LOG_FILE}"
echo "═══════════════════════════════════════════════════════" | tee -a "${LOG_FILE}"

RENDERED=0
FAILED=0
SKIPPED=0

for entry in "${SEQUENCES[@]}"; do
  IFS='|' read -r SEQ COMP_ID JSON_FILE DESC <<< "$entry"

  # Derive the output filename from the JSON filename
  SLUG="${JSON_FILE%.json}"
  JSON_PATH="${DATA_DIR}/${JSON_FILE}"

  # Read JSON data and wrap it as props (written to temp file to avoid shell escaping)
  if [ ! -f "${JSON_PATH}" ]; then
    echo "  [SKIP] #${SEQ} ${DESC} — ${JSON_FILE} not found" | tee -a "${LOG_FILE}"
    ((SKIPPED++))
    continue
  fi

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
    echo -n "  [${SEQ}/24] Rendering still: ${DESC}..." | tee -a "${LOG_FILE}"

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
          echo -n " (retry ${ATTEMPT})..." | tee -a "${LOG_FILE}"
          sleep 2
        fi
      fi
    done
  else
    OUTPUT="${OUT_DIR}/${SEQ}-${SLUG}.mp4"
    echo -n "  [${SEQ}/24] Rendering MP4: ${DESC}..." | tee -a "${LOG_FILE}"

    while [ $ATTEMPT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
      if npx remotion render "${ENTRY}" "${COMP_ID}" \
        "--props=${PROPS_FILE}" \
        "${BROWSER_ARGS[@]}" \
        "${OUTPUT}" 2>>"${LOG_FILE}"; then
        SUCCESS=true
      else
        ((ATTEMPT++))
        if [ $ATTEMPT -lt $MAX_RETRIES ]; then
          echo -n " (retry ${ATTEMPT})..." | tee -a "${LOG_FILE}"
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
  sleep 1  # Brief cooldown between renders to avoid port conflicts
done

echo "═══════════════════════════════════════════════════════" | tee -a "${LOG_FILE}"
echo "  Done: ${RENDERED} rendered, ${FAILED} failed, ${SKIPPED} skipped" | tee -a "${LOG_FILE}"
echo "═══════════════════════════════════════════════════════" | tee -a "${LOG_FILE}"

# ─── Concatenation (optional) ───────────────────────────────────────────────

if ${CONCAT_MODE} && ! ${PREVIEW_MODE}; then
  echo "" | tee -a "${LOG_FILE}"
  echo "Concatenating into preview reel..." | tee -a "${LOG_FILE}"

  # Build ffmpeg concat file
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

  REEL="${OUT_DIR}/ep01-preview-reel.mp4"

  if ffmpeg -y -f concat -safe 0 -i "${CONCAT_LIST}" \
    -c copy "${REEL}" 2>>"${LOG_FILE}"; then
    echo "  Preview reel: ${REEL}" | tee -a "${LOG_FILE}"
  else
    echo "  ffmpeg concat failed — clips may need re-encoding" | tee -a "${LOG_FILE}"
    echo "  Trying with re-encode..." | tee -a "${LOG_FILE}"
    ffmpeg -y -f concat -safe 0 -i "${CONCAT_LIST}" \
      -c:v libx264 -preset fast -crf 18 \
      -pix_fmt yuv420p "${REEL}" 2>>"${LOG_FILE}" && \
      echo "  Preview reel (re-encoded): ${REEL}" | tee -a "${LOG_FILE}"
  fi

  rm -f "${CONCAT_LIST}"
fi

echo ""
echo "All outputs in: ${OUT_DIR}/"
