# Status — silicon-trap
> Auto-generated 2026-05-17 by `tools/pipeline_validator.py --write-status`.
> **Do not edit by hand.** Re-run the tool to refresh.
> Hand-edit `episodes/PIPELINE.md` for state changes (the narrative + at-a-glance table).

**State:** RENDER READY · day 16 in state · target 2026-05-25 (+8 days)
**Format:** Wargamer

## Progress  ▰▰▰▰▰▰▰▱▱▱  6 of 9 stages

✓ research (brief + audit)
✗ angle-memo
✓ script-production.md — v5, modified 2026-05-16T11:08
✓ visual-spec
⚠ assembly-manifest (estimate mode · 99 segments · 812.8s)
✓ audio-cue-sheet
✓ data files (Remotion templates) (32 files)
✗ assets (21 zero-hit shots — no assets generated yet)
✗ full-episode render
✗ narration recorded
✓ thumbnail-spec

## Health
🔴 M-MANIFEST-STALE  script (2026-05-16T11:08) > manifest (drift 4.5 d)
   → fix: `python3 tools/assembly/generate_manifest.py silicon-trap`
🟡 21 zero-hit shots in episodes/silicon-trap/assets/
   → fix: `python3 tools/asset-source/zerohit_fallback.py silicon-trap`
🟡 Manifest ready but episode never rendered
   → fix: `cd remotion-templates && node scripts/render-episode.mjs --episode=silicon-trap`

## By the numbers

`Duration      `  13.5 min (812.8s)
`Segments      `  99
`Data files    `  32
`Days in state `  16
`Days to target`  +8

## Notes

Editorially production-ready. The wall is 21 zero-hit FOOTAGE slots — ai-gen-briefs.md exists but the briefs haven't been actioned. Narration not recorded.

---

_Regenerate this file: `python3 tools/pipeline_validator.py --write-status silicon-trap` or run `./scripts/check-episode.sh silicon-trap` (auto-refreshes)._
