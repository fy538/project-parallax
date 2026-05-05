#!/usr/bin/env bash
# Spin up (or remove) a git worktree for parallel work.
# Useful when one agent is rendering an episode while another drafts a different one.
#
# Usage:
#   scripts/worktree.sh new <slug>      # creates worktrees/<slug>/ on branch wt/<slug>
#   scripts/worktree.sh remove <slug>   # removes the worktree and deletes the branch
#   scripts/worktree.sh list            # show active worktrees
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CMD="${1:-}"
SLUG="${2:-}"

case "$CMD" in
  new)
    if [ -z "$SLUG" ]; then
      echo "Usage: $0 new <slug>" >&2
      exit 1
    fi
    mkdir -p worktrees
    git worktree add "worktrees/$SLUG" -b "wt/$SLUG"
    echo ""
    echo "→ Worktree: worktrees/$SLUG"
    echo "→ Branch:   wt/$SLUG"
    echo ""
    echo "Note: each worktree shares .git but has its own working tree."
    echo "      node_modules and Python deps install separately per worktree."
    ;;
  remove)
    if [ -z "$SLUG" ]; then
      echo "Usage: $0 remove <slug>" >&2
      exit 1
    fi
    git worktree remove "worktrees/$SLUG"
    git branch -D "wt/$SLUG" 2>/dev/null || true
    echo "→ Removed worktrees/$SLUG and branch wt/$SLUG"
    ;;
  list)
    git worktree list
    ;;
  *)
    echo "Usage: $0 {new|remove|list} [slug]" >&2
    exit 1
    ;;
esac
