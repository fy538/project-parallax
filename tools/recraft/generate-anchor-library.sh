#!/usr/bin/env bash
# Generate (or regenerate) the 7 Parallax Recraft anchor reference images.
#
# Reads tools/recraft/anchor-library.json, then runs `recraft.py generate` once
# per anchor with the matching --register, --realism, --text-treatment, and
# --treat flags. Outputs land at the anchor's outputPath (see anchor-library.json).
#
# Cost: ~$0.08/image × 7 = ~$0.56 for a full library refresh, plus whatever
# candidate variants you choose to generate via -n.
#
# Usage:
#   ./generate-anchor-library.sh                 # generate all 7 anchors
#   ./generate-anchor-library.sh A1 A4           # regenerate just A1 and A4
#   ./generate-anchor-library.sh --preview       # print prompts, don't call API
#   ./generate-anchor-library.sh --variants 4    # 4 candidates per anchor (human picks)
#
# Requirements:
#   - jq installed (brew install jq)
#   - RECRAFT_API_KEY exported
#   - python recraft.py runnable from this directory

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LIBRARY_JSON="${SCRIPT_DIR}/anchor-library.json"
RECRAFT_PY="${SCRIPT_DIR}/recraft.py"
OUTPUT_DIR="${SCRIPT_DIR}/anchor-library"

PREVIEW_FLAG=""
VARIANTS=1
declare -a TARGET_IDS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preview)
      PREVIEW_FLAG="--preview"
      shift
      ;;
    --variants)
      VARIANTS="$2"
      shift 2
      ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    A[1-7])
      TARGET_IDS+=("$1")
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required (brew install jq)" >&2
  exit 1
fi

if [[ ! -f "${LIBRARY_JSON}" ]]; then
  echo "error: anchor-library.json not found at ${LIBRARY_JSON}" >&2
  exit 1
fi

if [[ -z "${PREVIEW_FLAG}" && -z "${RECRAFT_API_KEY:-}" ]]; then
  echo "error: RECRAFT_API_KEY not set (or run with --preview to dry-run)" >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"

# If no specific IDs supplied, generate all anchors.
if [[ ${#TARGET_IDS[@]} -eq 0 ]]; then
  mapfile -t TARGET_IDS < <(jq -r '.anchors[].id' "${LIBRARY_JSON}")
fi

echo "==> Generating ${#TARGET_IDS[@]} anchor(s) with ${VARIANTS} variant(s) each"
echo "==> Output: ${OUTPUT_DIR}"
[[ -n "${PREVIEW_FLAG}" ]] && echo "==> Preview mode — no API calls will be made"
echo

for anchor_id in "${TARGET_IDS[@]}"; do
  entry=$(jq --arg id "${anchor_id}" '.anchors[] | select(.id == $id)' "${LIBRARY_JSON}")
  if [[ -z "${entry}" || "${entry}" == "null" ]]; then
    echo "  [skip] ${anchor_id}: not found in anchor-library.json" >&2
    continue
  fi

  name=$(echo "${entry}"          | jq -r '.name')
  register=$(echo "${entry}"      | jq -r '.register')
  realism=$(echo "${entry}"       | jq -r '.realism')
  text_treatment=$(echo "${entry}"| jq -r '.textTreatment')
  treatment=$(echo "${entry}"     | jq -r '.treatment')
  prompt=$(echo "${entry}"        | jq -r '.prompt')
  neg=$(echo "${entry}"           | jq -r '.negativePrompt')
  output_rel=$(echo "${entry}"    | jq -r '.outputPath')
  output_path="${REPO_ROOT}/${output_rel}"

  echo "  [${anchor_id}] ${name}"
  echo "         register=${register} realism=${realism} text=${text_treatment} treat=${treatment}"
  echo "         -> ${output_rel}"

  # Build the recraft.py invocation. Negative prompt is appended to the prompt
  # body as a "Negative:" tail — recraft.py's preamble composer treats this as
  # part of the user prompt block.
  full_prompt="${prompt}

Negative: ${neg}"

  python "${RECRAFT_PY}" generate \
    "${full_prompt}" \
    --register "${register}" \
    --realism "${realism}" \
    --text-treatment "${text_treatment}" \
    --treat "${treatment}" \
    -n "${VARIANTS}" \
    -o "${output_path}" \
    ${PREVIEW_FLAG}

  echo
done

echo "==> Done. Review candidates and promote one per anchor as canonical."
echo "    See tools/recraft/ANCHOR_LIBRARY.md for the curation flow."
