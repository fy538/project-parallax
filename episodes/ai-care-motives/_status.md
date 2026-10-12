# Status — ai-care-motives
> Auto-generated 2026-10-12 by `tools/pipeline_validator.py --write-status`.
> **Do not edit by hand.** Re-run the tool to refresh.
> Hand-edit `episodes/PIPELINE.md` for state changes (the narrative + at-a-glance table).

**State:** DRAFTING · day 5 in state
**Format:** Philosopher's Lens
**Waiting on:** Tiger: (1) audio files; (2) record the narration

## Progress  ▰▰▰▰▰▰▱▱▱▱  5 of 9 stages

✓ research (brief + audit)
✓ angle-memo
✓ script-production.md — modified 2026-10-12T14:24
✓ visual-spec
✓ assembly-manifest (precise mode · 89 segments · 575.7s)
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

`Duration     `  9.6 min (575.7s)
`Segments     `  89
`Data files   `  8
`Days in state`  5

## Notes

First episode under the Oct 2026 AI alignment/ethics focus (D48). Two-column script v1.7 (spoken draft v7, about 1,500 words, roughly 11 min estimate); visual-concept and script-audit run (earlier versions) with fixes applied; retroactive research-audit CONDITIONAL; independent fact-check of v6 (Oct 8) found no failures; its wording fixes and clarity fixes are applied in v7. All 12 stills generated (Oct 7-8) and upscaled 4x (Real-ESRGAN, stills-4k; local, git-ignored). Visual-spec done (Oct 8-11): 28 Remotion data files and a hand-wired assembly manifest (D49; first wired as 53 segments on an 11:19 estimate; no placeholders). Its 22 still segments are drawn in Remotion from the full-resolution stills with a framing per use (StillFrame); it also has one AI image-to-video clip and two stock clips. Measured visual QA (npm run qa:episode): see _status and remotion-templates/out/qa/ai-care-motives/report.md for the run after the Oct 12 re-cut. Archival photos, the EPA notice and two stock clips sourced Oct 10 (asset-manifest.json). The two 36 + 59 slots are typed reconstruction cards; their wording is a paraphrase until the exact lines are confirmed. Audio plan written Oct 10 and thinned Oct 11 (audio/audio-cue-sheet.md: 6 music cues, 4 transition sounds, 2 texture hits; no audio files sourced yet). The manifest is timed to a synthetic scratch read re-paced to 160 words a minute (Oct 12; 9:36, 89 segments). Its mode reads precise, but the word timings are a machine read, a timing aid only: no narration is recorded and no voice file is referenced. Tiger's own read replaces it through tools/assembly/retime_manifest.py. Pace and cutting (Oct 12, adopted by Tiger after comparing two cuts): eighteen stills are cut into 2 to 5 framings each on sentence boundaries (one cut every 6.5 s, no still held longer than 7 s) and two clips from the toolbox exploration are in (the river pull, the walk away). The current cut with the synthetic voice is remotion-templates/out/preview/ai-care-motives/density-pass-SYNTHETIC-VOICE.mp4. Face rule (Oct 12): an audit found a breach in eleven of the twelve stills; by Tiger's decision only the three heads that read as a face part were fixed (both figures in aigen-08, the glasses in aigen-06), and the rule applies in full from the new look onward (project/visual-identity/face-audit-2026-10-12/). The two 36 + 59 cards are statements in our own words, subtitled Our summary of a published example · Anthropic, 2025 (Oct 12, Tiger's choice; they replaced a typeset exchange whose wording was a paraphrase). Remaining: audio sourcing, Tiger's narration (then retime_manifest.py, not generate_manifest.py), final render.

---

_Regenerate this file: `python3 tools/pipeline_validator.py --write-status ai-care-motives` or run `./scripts/check-episode.sh ai-care-motives` (auto-refreshes)._
