---
description: Log this session's API/asset spend to episodes/COST_LOG.md (Claude, Recraft, fal.ai, etc.) and refresh per-episode dashboards.
argument-hint: [<slug>]
---

Walk the user through logging one or more cost entries for **$1** (or whichever episode they specify if no slug argument).

The single source of truth is `episodes/COST_LOG.md`, which `tools/cost_tracker.py` reads. Per-episode totals also surface in `episodes/<slug>/_status.md` via `pipeline_validator.py`.

## Steps

1. **Confirm the episode.** If `$1` is provided, use it as the default. Otherwise ask which episode. Validate it exists by checking `episodes/<slug>/` — if not, surface the typo before adding a phantom ledger row.

2. **Ask what was spent.** Surface a structured prompt covering the most common services:
   - Claude API (research, drafting, audit) — usually $1–15 per long session
   - Recraft (stills) — $0.04–0.20 per generated still
   - fal.ai / Flux (video clips) — $0.10–0.40 per 5s clip
   - Pexels / Pixabay / Unsplash — free; usually skip
   - Mapbox — $1.00 per 1k tile-loads on Studio styles; estimate generously
   - Lambda / Kling / Sora / Runway — variable; check vendor receipt
   - Other — for any anomaly (color grading API, narration TTS, etc.)

   Let the user batch-list entries (e.g. "Claude $8, Recraft $2.40"). Don't pester one entry at a time.

3. **For each entry, run:**
   ```bash
   python3 tools/cost_tracker.py add \
     --episode <slug> \
     --service <claude|recraft|pexels|pixabay|unsplash|mapbox|lambda|kling|sora|runway|other> \
     --amount <USD> \
     --note "<one-line context — what session/asset/feature>"
   ```
   Valid services are pinned in `tools/cost_tracker.py:VALID_SERVICES`; if the user names something not in the list, ask whether to bucket as `other` or extend the allowlist (the latter requires a code edit).

4. **After all entries are logged, refresh the dashboard** so the new total shows up in `_status.md`:
   ```bash
   python3 tools/pipeline_validator.py --write-status <slug> --update-tracker
   ```

5. **Show the running total** for the episode:
   ```bash
   python3 tools/cost_tracker.py summary --episode <slug>
   ```

6. **Stage the changes** (do NOT commit — let the operator decide when):
   ```bash
   git add episodes/COST_LOG.md episodes/<slug>/_status.md episodes/PIPELINE.md
   ```
   Mention the files staged so the operator knows what's ready.

## Notes

- Amounts are USD with 2-decimal precision. If the operator quotes credits or tokens, convert first using the vendor's published rate.
- The `--note` field is searchable later when reconstructing per-feature spend (e.g. "research pass 2" vs "script audit"). Encourage one-clause specificity.
- If `$1` isn't provided AND the user can't recall the slug, list the episodes from `pipeline-state.json` so they can pick:
  ```bash
  python3 -c "import json,pathlib; d=json.loads(pathlib.Path('episodes/pipeline-state.json').read_text()); [print(' ', e['slug'], '·', e['state']) for e in d['episodes']]"
  ```
- This command is read-only on every file EXCEPT `episodes/COST_LOG.md` and the dashboards. It does NOT touch `pipeline-state.json` or any script/spec.
