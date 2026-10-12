# Status — ai-care-motives
> Auto-generated 2026-10-11 by `tools/pipeline_validator.py --write-status`.
> **Do not edit by hand.** Re-run the tool to refresh.
> Hand-edit `episodes/PIPELINE.md` for state changes (the narrative + at-a-glance table).

**State:** DRAFTING · day 4 in state
**Format:** Philosopher's Lens

## Progress  ▰▰▰▰▰▰▱▱▱▱  5 of 9 stages

✓ research (brief + audit)
✓ angle-memo
✓ script-production.md — modified 2026-10-11T15:25
✓ visual-spec
✓ assembly-manifest (estimate mode · 53 segments · 678.6s)
✓ audio-cue-sheet
✓ data files (Remotion templates) (8 files)
⚠ assets (12 stills · 0 clips · 9 zero-hit shots unresolved)
✗ full-episode render
✗ narration recorded
✗ thumbnail-spec

## Next actions

1. **Resolve 9 zero-hit shots**
   ```
   python3 tools/asset-source/zerohit_fallback.py ai-care-motives
   ```
2. **First full-episode render pending**
   ```
   ./scripts/render.sh ai-care-motives
   ```

## Health
🟡 9 zero-hit shots in episodes/ai-care-motives/assets/
   → fix: `python3 tools/asset-source/zerohit_fallback.py ai-care-motives`
🟡 Manifest ready but episode never rendered
   → fix: `cd remotion-templates && node scripts/render-episode.mjs --episode=ai-care-motives`

## By the numbers

`Duration     `  11.3 min (678.6s)
`Segments     `  53
`Data files   `  8
`Days in state`  4

## Notes

First episode under the Oct 2026 AI alignment/ethics focus (D48). Two-column script v1.7 (spoken draft v7, about 1,500 words, roughly 11 min estimate); visual-concept and script-audit run (earlier versions) with fixes applied; retroactive research-audit CONDITIONAL; independent fact-check of v6 (Oct 8) found no failures; its wording fixes and clarity fixes are applied in v7. All 12 stills generated (Oct 7-8) and upscaled 4x (Real-ESRGAN, stills-4k; local, git-ignored). Visual-spec done (Oct 8-11): 28 Remotion data files and a hand-wired assembly manifest (D49; 53 segments, 11:19 estimate, no placeholders). Its 22 still segments are drawn in Remotion from the full-resolution stills with a framing per use (StillFrame); it also has one AI image-to-video clip and two stock clips. Measured visual QA at 0 fails (npm run qa:episode). Archival photos, the EPA notice and two stock clips sourced Oct 10 (asset-manifest.json). The two 36 + 59 slots are typed reconstruction cards; their wording is a paraphrase until the exact lines are confirmed. Audio plan written Oct 10 and thinned Oct 11 (audio/audio-cue-sheet.md: 6 music cues, 4 transition sounds, 2 texture hits; no audio files sourced yet). Remaining: scratch read-aloud, the exact 36 + 59 lines, audio sourcing, narration (then tools/assembly/retime_manifest.py, not generate_manifest.py), render (picture-only render works via --props noAudio).

---

_Regenerate this file: `python3 tools/pipeline_validator.py --write-status ai-care-motives` or run `./scripts/check-episode.sh ai-care-motives` (auto-refreshes)._
