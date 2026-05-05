---
description: Render preview stills (frame 90) for all clips in an episode
argument-hint: <episode-slug>
---

Render preview stills for episode `$1`.

Steps:
1. Verify `remotion-templates/data/episodes/$1/` exists and contains JSON data files.
2. Run `node remotion-templates/scripts/render-episode.mjs --episode=$1 --preview` from the repo root.
3. The script writes PNGs to `remotion-templates/out/$1/` named `01-<filename>.png` etc.
4. Report any failures with the relevant clip name and short error.
5. Don't fall back to MP4 rendering — `--preview` mode is intentionally fast (single still per clip).

If the episode directory doesn't exist, list available episodes from `remotion-templates/data/episodes/` and stop.
