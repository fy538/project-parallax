# Status — prisoners-dilemma
> Auto-generated 2026-10-12 by `tools/pipeline_validator.py --write-status`.
> **Do not edit by hand.** Re-run the tool to refresh.
> Hand-edit `episodes/PIPELINE.md` for state changes (the narrative + at-a-glance table).

**State:** RENDER READY · day 156 in state · target 2026-06-01 (-133 days)
**Format:** Philosopher's Lens

## Progress  ▰▰▰▰▰▰▰▱▱▱  6 of 9 stages

✓ research (brief + audit)
✓ angle-memo
✓ script-production.md — modified 2026-10-09T14:20
✓ visual-spec
✓ assembly-manifest (estimate mode · 121 segments · 893.8s)
✓ audio-cue-sheet
✓ data files (Remotion templates) (49 files)
✓ assets (31 stills · 4 clips)
✗ full-episode render
✗ narration recorded
✗ thumbnail-spec

## Next actions

1. **First full-episode render pending**
   ```
   ./scripts/render.sh prisoners-dilemma
   ```
2. **Thumbnails missing**
   ```
   npm run thumbnails -- --episode=prisoners-dilemma
   ```

## Health
🟡 Manifest ready but episode never rendered
   → fix: `cd remotion-templates && node scripts/render-episode.mjs --episode=prisoners-dilemma`

## Assets
  Stills    ▰▰▰▰▰▰▰▰▰▰  33/33  · all present
  Clips     ▰▰▰▰▰▰▱▱▱▱  16/27  · 11 pending
  Morphs    ▱▱▱▱▱▱▱▱▱▱  0/0  · all generated
  Wired     ▰▰▰▰▰▰▰▰▰▰  24/25 footage segments

## By the numbers

`Duration      `  14.9 min (893.8s)
`Segments      `  121
`Data files    `  49
`Days in state `  156
`Days to target`  -133

## Notes

Launch candidate. Script locked editorially; full manifest (121 segments, 50 data files) generated. KNOWN GAP: visual-spec.md missing (asset-source bypassed the canonical visual-spec flow) — validator errors on this until written. Remaining: first full-episode render + narration + NLE.

---

_Regenerate this file: `python3 tools/pipeline_validator.py --write-status prisoners-dilemma` or run `./scripts/check-episode.sh prisoners-dilemma` (auto-refreshes)._
