#!/usr/bin/env bash
# contact_sheet.sh — review pictures side by side, or enlarge one region. Needs only ffmpeg.
#
# Tile pictures (or the first frame of clips) into one sheet:
#   tools/qa/contact_sheet.sh OUT.jpg COLS CELL_W CELL_H FILE [FILE...]
#   tools/qa/contact_sheet.sh sheet.jpg 4 480 270 stills/*.png
#
# Enlarge one region of a picture (a head, a pair of hands) to 1280 px wide:
#   tools/qa/contact_sheet.sh --crop X,Y,W,H OUT.jpg IN
#   tools/qa/contact_sheet.sh --crop 1010,150,260,260 head.jpg still.png
#
# Take one frame of a clip first if you need a moment other than the start:
#   ffmpeg -nostdin -ss 2.5 -i clip.mp4 -frames:v 1 frame.jpg
#
# Why this exists: project/PICTURE_RULES.md asks for every head and hand contact to be
# enlarged before a picture of a person is accepted. Run it with bash, from this file:
# zsh does not split "$var" into words and reads "$n:layout" as a modifier.
set -euo pipefail

if [ "${1:-}" = "--crop" ]; then
  [ $# -eq 4 ] || { echo "usage: $0 --crop X,Y,W,H OUT IN" >&2; exit 2; }
  IFS=, read -r x y w h <<<"$2"
  ffmpeg -nostdin -v error -y -i "$4" -vf "crop=${w}:${h}:${x}:${y},scale=1280:-2:flags=lanczos" -frames:v 1 -q:v 2 "$3"
  echo "$3"
  exit 0
fi

[ $# -ge 5 ] || { echo "usage: $0 OUT COLS CELL_W CELL_H FILE [FILE...]" >&2; exit 2; }
out=$1; cols=$2; cw=$3; ch=$4; shift 4
inputs=(); chain=""; n=0
for f in "$@"; do
  inputs+=(-i "$f")
  chain+="[${n}:v]scale=${cw}:${ch}:force_original_aspect_ratio=decrease,pad=${cw}:${ch}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[s${n}];"
  n=$((n + 1))
done
if [ "$n" -eq 1 ]; then
  ffmpeg -nostdin -v error -y "${inputs[@]}" -filter_complex "${chain%;}" -map "[s0]" -frames:v 1 -q:v 3 "$out"
else
  labels=""; layout=""
  for i in $(seq 0 $((n - 1))); do
    labels+="[s${i}]"
    layout+="$(( (i % cols) * cw ))_$(( (i / cols) * ch ))|"
  done
  ffmpeg -nostdin -v error -y "${inputs[@]}" -filter_complex "${chain}${labels}xstack=inputs=${n}:layout=${layout%|}:fill=black" -frames:v 1 -q:v 3 "$out"
fi
echo "$out"
