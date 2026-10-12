#!/usr/bin/env bash
# backup-media.sh — copy the media that git ignores AND that cannot be remade for free.
#
# These folders hold pictures, clips and audio that were paid for (fal) or made by hand in
# ChatGPT or Codex. They are kept out of git on purpose and exist only on this machine:
#
#   episodes/*/assets/keyframes/        edited stills from fal
#   episodes/*/assets/clips-i2v/        image-to-video clips from fal
#   episodes/*/assets/scratch-voice/    synthetic scratch reads
#   project/visual-identity/            research images and clips
#
# Renders (remotion-templates/out/) and upscales (assets/stills-4k/) are left out: they
# can be made again from what is here and in git.
#
# Usage:
#   scripts/backup-media.sh DEST            copy into DEST/project-parallax-media/
#   scripts/backup-media.sh DEST --dry-run  list what would be copied, copy nothing
#
# Only files git ignores are copied, with their paths kept. Run it again at any time:
# files already there and unchanged are skipped.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[ $# -ge 1 ] || { echo "usage: $0 DEST [--dry-run]" >&2; exit 2; }
dest="$1/project-parallax-media"
dry=""
[ "${2:-}" = "--dry-run" ] && dry="--dry-run"

list=$(mktemp)
trap 'rm -f "$list"' EXIT
git ls-files --others --ignored --exclude-standard -- \
  ':(glob)episodes/*/assets/keyframes/**' ':(glob)episodes/*/assets/clips-i2v/**' \
  ':(glob)episodes/*/assets/scratch-voice/**' ':(glob)project/visual-identity/**' \
  | grep -v '\.DS_Store$' > "$list" || true

count=$(wc -l < "$list" | tr -d ' ')
size_kb=$(tr '\n' '\0' < "$list" | xargs -0 du -ck 2>/dev/null | awk '/total$/ {s += $1} END {print s + 0}')
echo "$count files, about $((size_kb / 1024)) MB, to $dest"
[ "$count" -gt 0 ] || exit 0

[ -n "$dry" ] || mkdir -p "$dest"
rsync -a $dry --files-from="$list" "$ROOT/" "$dest/"
if [ -n "$dry" ]; then
  echo "Dry run: nothing was copied."
else
  echo "Done. Copied into $dest"
fi
