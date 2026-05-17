#!/usr/bin/env bash
#
# new-episode.sh — Scaffold a new Parallax episode
#
# Creates the episode working directory, Remotion data directory,
# and a render script. Everything uses slug-based naming.
# Episode numbers are assigned at publish time via publish-order.json.
#
# Usage:
#   bash tools/new-episode.sh prisoners-dilemma "The Prisoner's Dilemma Is Wrong About Almost Everything"
#   bash tools/new-episode.sh my-topic "Working Title"
#
# Run from the project root (project-parallax/).

set -euo pipefail

# ─── Arguments ──────────────────────────────────────────────────────────────

if [ $# -lt 1 ]; then
  echo "Usage: bash tools/new-episode.sh <slug> [title]"
  echo ""
  echo "  slug   — kebab-case identifier (e.g. prisoners-dilemma)"
  echo "  title  — optional working title (e.g. \"The Prisoner's Dilemma Is Wrong\")"
  echo ""
  echo "Creates:"
  echo "  episodes/<slug>/                          — episode working directory"
  echo "  remotion-templates/data/episodes/<slug>/   — Remotion JSON data files"
  echo "  remotion-templates/scripts/render-<slug>.sh — episode render script"
  exit 1
fi

SLUG="$1"
TITLE="${2:-$SLUG}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Validate slug format
if [[ ! "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: slug must be kebab-case (lowercase, hyphens only). Got: $SLUG"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "  New Episode: $SLUG"
echo "  Title: $TITLE"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── 1. Episode working directory ───────────────────────────────────────────

EP_DIR="$PROJECT_ROOT/episodes/$SLUG"

if [ -d "$EP_DIR" ]; then
  echo "  [EXISTS] episodes/$SLUG/ — skipping"
else
  mkdir -p "$EP_DIR"
  mkdir -p "$EP_DIR/drafts"
  mkdir -p "$EP_DIR/research"

  # Stub revision log
  cat > "$EP_DIR/REVISION_LOG.md" << EOF
# $TITLE — Revision Log

## v1
- **Date:** $(date +%Y-%m-%d)
- **Changes:** Initial draft
- **Rationale:** First pass from brief + angle memo
EOF

  echo "  [CREATED] episodes/$SLUG/"
  echo "            ├── REVISION_LOG.md"
  echo "            ├── drafts/"
  echo "            └── research/"
fi

# ─── 2. Remotion data directory ─────────────────────────────────────────────

DATA_DIR="$PROJECT_ROOT/remotion-templates/data/episodes/$SLUG"

if [ -d "$DATA_DIR" ]; then
  echo "  [EXISTS] remotion-templates/data/episodes/$SLUG/ — skipping"
else
  mkdir -p "$DATA_DIR"
  echo "  [CREATED] remotion-templates/data/episodes/$SLUG/"
fi

# ─── 3. Render script ──────────────────────────────────────────────────────

RENDER_SCRIPT="$PROJECT_ROOT/remotion-templates/scripts/render-${SLUG}.sh"

if [ -f "$RENDER_SCRIPT" ]; then
  echo "  [EXISTS] scripts/render-${SLUG}.sh — skipping"
else
  cat > "$RENDER_SCRIPT" << 'SCRIPT_HEADER'
#!/usr/bin/env bash
#
SCRIPT_HEADER

  cat >> "$RENDER_SCRIPT" << EOF
# render-${SLUG}.sh — Render all compositions for "${TITLE}"
#
# Usage:
#   cd remotion-templates/
#   bash scripts/render-${SLUG}.sh              # Render all clips as MP4
#   bash scripts/render-${SLUG}.sh --preview    # Render stills (frame 90) for QA
#   bash scripts/render-${SLUG}.sh --concat     # Also concatenate into preview reel
#
# Output:
#   out/${SLUG}/01-title-episode.png (or .mp4)
#   ... etc ...

set -uo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

EPISODE="${SLUG}"
DATA_DIR="data/episodes/\${EPISODE}"
OUT_DIR="out/\${EPISODE}"
ENTRY="src/index.ts"
LOG_FILE="\${OUT_DIR}/render.log"

# Detect browser executable
BROWSER_ARGS=()
PLAYWRIGHT_CHROME=""
for search_dir in "\$HOME/Library/Caches/ms-playwright" "\$HOME/.cache/ms-playwright"; do
  if [ -d "\$search_dir" ]; then
    PLAYWRIGHT_CHROME=\$(find "\$search_dir" -name "headless_shell" 2>/dev/null | head -1)
    [ -n "\$PLAYWRIGHT_CHROME" ] && break
    PLAYWRIGHT_CHROME=\$(find "\$search_dir" -name "Google Chrome for Testing" 2>/dev/null | head -1)
    [ -n "\$PLAYWRIGHT_CHROME" ] && break
  fi
done

if [ -n "\${PLAYWRIGHT_CHROME}" ]; then
  BROWSER_ARGS=("--browser-executable=\${PLAYWRIGHT_CHROME}")
  echo "Using Playwright Chromium: \${PLAYWRIGHT_CHROME}"
elif [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  BROWSER_ARGS=("--browser-executable=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
  echo "Using system Chrome"
else
  echo "Using Remotion's default browser"
fi

# Parse flags
PREVIEW_MODE=false
CONCAT_MODE=false
for arg in "\$@"; do
  case \$arg in
    --preview) PREVIEW_MODE=true ;;
    --concat)  CONCAT_MODE=true ;;
  esac
done

# ─── Sequence Definition ────────────────────────────────────────────────────
#
# Format: SEQ_NUM|COMPOSITION_ID|JSON_FILE|DESCRIPTION
#
# INSTRUCTIONS: After visual-spec generates JSON data files, populate this
# array with one entry per composition. The format matches render-ep01.sh.
#
# Example:
#   "01|TitleTransition|title-episode.json|Episode title"
#   "02|KineticTypography|kinetic-opening-stat.json|Opening statistic"
#   "03|FrameworkDiagram|framework-main.json|Core framework"

SEQUENCES=(
  # ── Opening ──
  "01|TitleTransition|title-episode.json|Episode title"

  # Add compositions here after visual-spec runs.
  # Each line: "SEQ_NUM|COMPOSITION_ID|JSON_FILE|DESCRIPTION"

  # ── Closing ──
  # "NN|TitleTransition|title-endcard.json|End card"
)

TOTAL=\${#SEQUENCES[@]}

# ─── Render Loop ─────────────────────────────────────────────────────────────

mkdir -p "\${OUT_DIR}"
echo "═══════════════════════════════════════════════════════" | tee "\${LOG_FILE}"
echo "  ${TITLE} Render — \$(date)" | tee -a "\${LOG_FILE}"
echo "  Mode: \$(\${PREVIEW_MODE} && echo 'PREVIEW (stills)' || echo 'FULL (MP4)')" | tee -a "\${LOG_FILE}"
echo "  Compositions: \${TOTAL}" | tee -a "\${LOG_FILE}"
echo "  Output: \${OUT_DIR}/" | tee -a "\${LOG_FILE}"
echo "═══════════════════════════════════════════════════════" | tee -a "\${LOG_FILE}"

RENDERED=0
FAILED=0
SKIPPED=0

for entry in "\${SEQUENCES[@]}"; do
  IFS='|' read -r SEQ COMP_ID JSON_FILE DESC <<< "\$entry"

  SLUG_FILE="\${JSON_FILE%.json}"
  JSON_PATH="\${DATA_DIR}/\${JSON_FILE}"

  if [ ! -f "\${JSON_PATH}" ]; then
    echo "  [SKIP] #\${SEQ} \${DESC} — \${JSON_FILE} not found" | tee -a "\${LOG_FILE}"
    ((SKIPPED++))
    continue
  fi

  # Build props file
  PROPS_FILE="\${OUT_DIR}/_props-\${SEQ}.json"
  python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
with open(sys.argv[2], 'w') as f:
    json.dump({'data': data}, f)
" "\${JSON_PATH}" "\${PROPS_FILE}"

  MAX_RETRIES=2
  ATTEMPT=0
  SUCCESS=false

  if \${PREVIEW_MODE}; then
    OUTPUT="\${OUT_DIR}/\${SEQ}-\${SLUG_FILE}.png"
    echo -n "  [\${SEQ}/\${TOTAL}] Still: \${DESC}..." | tee -a "\${LOG_FILE}"

    while [ \$ATTEMPT -lt \$MAX_RETRIES ] && [ "\$SUCCESS" = false ]; do
      if npx remotion still "\${ENTRY}" "\${COMP_ID}" \\
        --frame=90 \\
        "--props=\${PROPS_FILE}" \\
        "\${BROWSER_ARGS[@]}" \\
        "--output=\${OUTPUT}" 2>>"\${LOG_FILE}"; then
        SUCCESS=true
      else
        ((ATTEMPT++))
        if [ \$ATTEMPT -lt \$MAX_RETRIES ]; then
          echo -n " (retry)..." | tee -a "\${LOG_FILE}"
          sleep 2
        fi
      fi
    done
  else
    OUTPUT="\${OUT_DIR}/\${SEQ}-\${SLUG_FILE}.mp4"
    echo -n "  [\${SEQ}/\${TOTAL}] MP4: \${DESC}..." | tee -a "\${LOG_FILE}"

    while [ \$ATTEMPT -lt \$MAX_RETRIES ] && [ "\$SUCCESS" = false ]; do
      if npx remotion render "\${ENTRY}" "\${COMP_ID}" \\
        "--props=\${PROPS_FILE}" \\
        "\${BROWSER_ARGS[@]}" \\
        "\${OUTPUT}" 2>>"\${LOG_FILE}"; then
        SUCCESS=true
      else
        ((ATTEMPT++))
        if [ \$ATTEMPT -lt \$MAX_RETRIES ]; then
          echo -n " (retry)..." | tee -a "\${LOG_FILE}"
          sleep 2
        fi
      fi
    done
  fi

  if \$SUCCESS; then
    echo " ✓" | tee -a "\${LOG_FILE}"
    ((RENDERED++))
  else
    echo " ✗ FAILED" | tee -a "\${LOG_FILE}"
    ((FAILED++))
  fi

  rm -f "\${PROPS_FILE}"
  sleep 1
done

echo "═══════════════════════════════════════════════════════" | tee -a "\${LOG_FILE}"
echo "  Done: \${RENDERED} rendered, \${FAILED} failed, \${SKIPPED} skipped" | tee -a "\${LOG_FILE}"
echo "═══════════════════════════════════════════════════════" | tee -a "\${LOG_FILE}"

# ─── Concatenation (optional) ───────────────────────────────────────────────

if \${CONCAT_MODE} && ! \${PREVIEW_MODE}; then
  echo "" | tee -a "\${LOG_FILE}"
  echo "Concatenating into preview reel..." | tee -a "\${LOG_FILE}"

  CONCAT_LIST="\${OUT_DIR}/concat.txt"
  > "\${CONCAT_LIST}"

  for entry in "\${SEQUENCES[@]}"; do
    IFS='|' read -r SEQ _ JSON_FILE _ <<< "\$entry"
    SLUG_FILE="\${JSON_FILE%.json}"
    MP4="\${OUT_DIR}/\${SEQ}-\${SLUG_FILE}.mp4"
    if [ -f "\${MP4}" ]; then
      echo "file '\$(basename "\${MP4}")'" >> "\${CONCAT_LIST}"
    fi
  done

  REEL="\${OUT_DIR}/${SLUG}-preview-reel.mp4"

  if ffmpeg -y -f concat -safe 0 -i "\${CONCAT_LIST}" \\
    -c copy "\${REEL}" 2>>"\${LOG_FILE}"; then
    echo "  Preview reel: \${REEL}" | tee -a "\${LOG_FILE}"
  else
    echo "  Re-encoding for concat..." | tee -a "\${LOG_FILE}"
    ffmpeg -y -f concat -safe 0 -i "\${CONCAT_LIST}" \\
      -c:v libx264 -preset fast -crf 18 \\
      -pix_fmt yuv420p "\${REEL}" 2>>"\${LOG_FILE}" && \\
      echo "  Preview reel: \${REEL}" | tee -a "\${LOG_FILE}"
  fi

  rm -f "\${CONCAT_LIST}"
fi

echo ""
echo "All outputs in: \${OUT_DIR}/"
EOF

  chmod +x "$RENDER_SCRIPT"
  echo "  [CREATED] scripts/render-${SLUG}.sh"
fi

# ─── 4. Update publish-order.json ───────────────────────────────────────────

PUBLISH_ORDER="$PROJECT_ROOT/episodes/publish-order.json"

if [ -f "$PUBLISH_ORDER" ]; then
  # Check if slug already exists in the queue
  if python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
slugs = [e['slug'] for e in data.get('queue', [])] + [e['slug'] for e in data.get('published', [])]
sys.exit(0 if sys.argv[2] in slugs else 1)
" "$PUBLISH_ORDER" "$SLUG" 2>/dev/null; then
    echo "  [EXISTS] $SLUG already in publish-order.json — skipping"
  else
    python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
data['queue'].append({
    'slug': sys.argv[2],
    'title': sys.argv[3],
    'state': 'draft'
})
with open(sys.argv[1], 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write('\n')
" "$PUBLISH_ORDER" "$SLUG" "$TITLE"
    echo "  [UPDATED] publish-order.json — added $SLUG to queue"
  fi
fi

# ─── Summary ────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Episode scaffolded: $SLUG"
echo ""
echo "  Next steps:"
echo "    1. Run viability check (if not done)"
echo "    2. Deep Research in Claude.ai → save brief to episodes/$SLUG/brief.md"
echo "    3. Run research-audit skill"
echo "    4. Run angle-memo skill → save to episodes/$SLUG/angle-memo.md"
echo "    5. Run script-draft skill → iterate through audit pipeline"
echo "    6. Run visual-spec → populates remotion-templates/data/episodes/$SLUG/"
echo "    7. Update scripts/render-${SLUG}.sh SEQUENCES array"
echo "    8. Render and assemble"
echo "═══════════════════════════════════════════════════════"
