# Status — silicon-trap
> Auto-generated 2026-10-08 by `tools/pipeline_validator.py --write-status`.
> **Do not edit by hand.** Re-run the tool to refresh.
> Hand-edit `episodes/PIPELINE.md` for state changes (the narrative + at-a-glance table).

**State:** RENDER READY · day 160 in state · target 2026-05-25 (-136 days)
**Format:** Wargamer

## Progress  ▰▰▰▰▰▰▰▱▱▱  6 of 9 stages

✓ research (brief + audit)
✗ angle-memo
✓ script-production.md — modified 2026-05-16T11:08
✓ visual-spec
⚠ assembly-manifest (estimate mode · 99 segments · 812.8s)
✓ audio-cue-sheet
✓ data files (Remotion templates) (28 files)
✗ assets (21 zero-hit shots — no assets generated yet)
✗ full-episode render
✗ narration recorded
✓ thumbnail-spec

## Next actions

1. **Regenerate stale manifest**
   ```
   python3 tools/assembly/generate_manifest.py silicon-trap
   ```
2. **Resolve 21 zero-hit shots**
   ```
   python3 tools/asset-source/zerohit_fallback.py silicon-trap
   ```
3. **Angle memo missing — run `angle-memo` skill**

## Health
🔴 M-MANIFEST-STALE  script (2026-05-16T11:08) > manifest (drift 4.5 d)
   → fix: `python3 tools/assembly/generate_manifest.py silicon-trap`
🟡 21 zero-hit shots in episodes/silicon-trap/assets/
   → fix: `python3 tools/asset-source/zerohit_fallback.py silicon-trap`
🟡 Manifest ready but episode never rendered
   → fix: `cd remotion-templates && node scripts/render-episode.mjs --episode=silicon-trap`

## Assets
  Stills    ▱▱▱▱▱▱▱▱▱▱  0/27  · 27 missing
  Clips     ▱▱▱▱▱▱▱▱▱▱  0/27  · 27 pending
  Morphs    ▱▱▱▱▱▱▱▱▱▱  0/0  · all generated
  Wired     ▱▱▱▱▱▱▱▱▱▱  0/21 footage segments

  **Generation sequence:**
  1. AI-GEN stills — ChatGPT (`prompts/chatgpt-prompts.md`):
       · beat3-smic-fab-interior
       · beat4-trap-encirclement
  2. After each new file in public/: run `pipeline_validator.py --write-status silicon-trap`

## By the numbers

`Duration      `  13.5 min (812.8s)
`Segments      `  99
`Data files    `  28
`Days in state `  160
`Days to target`  -136

## Notes

Editorially production-ready. The wall is 21 zero-hit FOOTAGE slots — ai-gen-briefs.md exists but the briefs haven't been actioned. Narration not recorded.

---

_Regenerate this file: `python3 tools/pipeline_validator.py --write-status silicon-trap` or run `./scripts/check-episode.sh silicon-trap` (auto-refreshes)._
