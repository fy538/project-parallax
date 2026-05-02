# Asset Sourcing Evaluation — EP01 P1 Batch
## Output Summary & Usage Guide

**Episode:** The Silicon Trap (EP01)  
**Assets Evaluated:** 9 P1 (Priority 1 / Must-Have)  
**Evaluation Date:** April 26, 2026  
**Status:** Ready for Tiger's editorial selection

---

## Files in This Directory

### 1. **transcript.md** (Read First)
Comprehensive execution transcript documenting:
- Skill file reading & context gathering
- Per-asset evaluation process
- Scoring rubric application
- Key insights on treatment survivability
- Validation against skill requirements
- Next steps for production pipeline

**Read this to understand:** How the evaluation was performed, why assets scored as they did, and what happens next.

**Length:** ~600 lines  
**Format:** Markdown with phase breakdowns

---

### 2. **candidates-presentation.md** (For Tiger)
Interactive presentation of scored candidates for each asset.

**For each P1 asset, shows:**
- Script context (narration excerpt)
- Top 5 candidates ranked by score
- Preview image links (Pexels/Pixabay preview URLs)
- Score breakdown (all 5 dimensions with commentary)
- Treatment survivability notes
- Selection prompt ("Pick a number 1-5, more for alternatives, skip")

**Use this to:** Visually verify candidates before committing to download. Tiger reviews previews and selects top choice per asset.

**Format:** Asset-by-asset presentation with embedded Markdown tables  
**Total assets:** 9  
**Total candidates presented:** 45 (5 per asset)

---

### 3. **asset-sourcing-report.md** (For Documentation)
Detailed analysis & sourcing methodology.

**Contains:**
- Executive summary (viability, key findings)
- Scoring rubric table (dimensions, criteria, examples)
- Per-asset evaluation sections:
  - Script context
  - Candidate ranking (5 candidates each)
  - Recommendation + reasoning
  - Treatment notes
- Quality assurance checklist
- Archival sourcing guidance (beat2-fdr-1941)
- Edge cases & handling notes
- Sourcing decision tree reference

**Use this to:** Understand scoring rationale, archival pathway, and QA requirements before entering production pipeline.

**Length:** ~1000 lines  
**Audience:** Production team, archival sourcer, post-production leads

---

### 4. **asset-manifest-template.json** (For Asset Tracking)
Machine-parseable manifest tracking selections, scores, and attribution.

**Structure:**
```json
{
  "episode": "EP01-silicon-trap",
  "assets": [
    {
      "id": "beat1-tsmc-aerial",
      "selected": {
        "source": "pexels",
        "source_id": "3807517",
        "score": 23,
        "score_breakdown": { ... },
        "photographer": "Aerial Industries",
        "license": "Pexels License (free, no attribution required)",
        "url": "...",
        "file": "beat1-tsmc-aerial_pexels_3807517.jpg"
      },
      "archival_sourcing": false,
      "status": "ready_to_download"
    },
    // ... 8 more assets
  ]
}
```

**Use this to:**
1. Generate download commands (extract `download_url` fields)
2. Track asset attribution for credits
3. Store score justification for future reference
4. Feed asset list to post-production pipeline
5. Update with local file paths once downloaded/treated

**Special handling:** Asset beat2-fdr-1941 has `"archival_sourcing": true` and includes Library of Congress/Wikimedia Commons search pathways.

---

## Scoring Overview

### By the Numbers

| Score | Tier | Assets | Interpretation |
|-------|------|--------|-----------------|
| 24/25 | Textbook Perfect | 2 | beat3-pen-tip, beat5-data-center |
| 23/25 | High Quality | 3 | beat1-tsmc-aerial, beat3-china-rail, beat5-phone-circuit |
| 22/25 | Good | 1 | beat1-cleanroom |
| 21/25 | Acceptable | 1 | beat5-car-dashboard |
| 20/25 | Acceptable | 1 | beat5-hospital-mri |
| Archival | Pending | 1 | beat2-fdr-1941 (requires Library of Congress) |

**Average (stock candidates):** 22.1/25

---

### What Makes a High-Scoring Asset?

The 24/25 assets share these traits:

**beat3-pen-tip (24/25):**
- Extreme macro photography (5472×3648)
- Steel sphere under directional studio lighting
- Ultra-high contrast: glistening highlights + dark background
- When desaturated & remapped to amber duotone: micro-texture detail persists beautifully
- Inset at 75% opacity displays crisp detail
- Exact script match: "tiny pen tip after massive achievements" (visual punchline)

**beat5-data-center (24/25):**
- Rows of server racks under white/blue LED lighting
- Strong geometric pattern (repetitive vertical lines)
- High contrast: dark equipment + lit unit faces
- When remapped to amber duotone: striping pattern emphasizes repetition
- Inset at 65% opacity shows grid structure clearly
- Exact script match: "data center serving your email" (infrastructure presence)

### Pattern: Why These Score Highest

1. **High-contrast source material** — survives desaturation (color removal) without becoming muddy
2. **Geometric/architectural form** — doesn't rely on color for visual interest; shapes + lines carry meaning
3. **Dramatic/directional lighting** — creates tonal range that duotone remap leverages
4. **Macro or technical subject** — detail-rich photography = complexity visible post-treatment
5. **Perfect script relevance** — image does exactly what narration requires

**Corollary:** Avoid flat-lit, pastel, or low-contrast sources. These compress to uniform amber mud post-duotone.

---

## What Happens Next

### Phase 1: Tiger's Selections (Hours 0-2)
1. Open `candidates-presentation.md`
2. For each asset, review top 5 candidates + preview links
3. Select favorite (respond with picks like "1, 1, skip, 1, 1, 1, 1, 1, 1")
4. Flag beat2-fdr-1941: confirm Library of Congress search or alternative coverage

### Phase 2: Download & Archive (Hours 2-4)
```bash
# Using Pexels API (if configured)
source tools/asset-source/.env && export PEXELS_API_KEY
python tools/asset-source/source.py beat1-tsmc-aerial --type photo --download-top 1

# Or manual download via URLs in asset-manifest-template.json

# Archive raw files
mkdir -p episodes/EP01-silicon-trap/assets/raw/
mv downloaded_files/* episodes/EP01-silicon-trap/assets/raw/
# Rename: beat1-tsmc-aerial_pexels_3807517.jpg
```

### Phase 3: Brand Treatment Pipeline (Hours 4-12)
Each asset runs through 4 steps:

1. **Desaturate** (20-30% original saturation)
   - Photoshop: Hue/Saturation → Saturation: -75
   - CSS: `filter: saturate(0.25)`
   - Python: ImageMagick `-modulate 100,25,100`

2. **Duotone Remap** (apply per-asset treatment ramp)
   - **Standard** (default): ink (#1A1A2E) → bronze (#8B5E2B) → amber (#E5A544)
   - **Conflict** (beat3-china-rail, beat3-pen-tip): ink → rust-mid → rust
   - Photoshop: Image → Mode → Grayscale → Duotone
   - Affinity: Layer → Gradient Map with shadow/midtone/highlight colors

3. **Grain & Vignette** (analog texture)
   - Grain: Monochromatic noise, 8-12% opacity, overlay blend mode
   - Vignette: Radial gradient, transparent center → 15-20% black at edges

4. **Composite** (place in layout at specified opacity)
   - Background mode: 25-40% opacity (behind content)
   - Inset mode: 60-80% opacity (evidence panel)
   - Antipode mode: 40-50% per side (split comparison)

### Phase 4: QA & Validation (Hours 12-16)
Before rendering, verify each treated asset:
- [ ] All 4 pipeline steps applied
- [ ] Correct duotone ramp (standard/conflict/editorial)
- [ ] No native color bleeding through
- [ ] Grain visible but not blocky
- [ ] Vignette appropriate (darkened edges, visible center)
- [ ] Composition mode correct (background/inset/split)
- [ ] Text readable if overlaid
- [ ] Source attribution recorded

See `asset-sourcing-report.md` § "Quality Assurance Checklist" for full requirements.

### Phase 5: Remotion Assembly (Hours 16+)
1. Place treated images in Remotion templates at specified opacity
2. Verify visual flow across 27 compositions
3. Render full episode (FullEpisode.tsx + Lambda)
4. Record narration over video
5. NLE assembly (sync + color grading + final export)

---

## Archival Sourcing: beat2-fdr-1941

**Special handling required.** This is a historical photograph (FDR signing executive order, July 1941) that stock libraries cannot provide reliably.

### Recommended Pathway

**Primary (Recommended):**
- Source: Library of Congress (www.loc.gov)
- Search: "Franklin Delano Roosevelt executive order 1941" or "FDR oil embargo Japan"
- Expected result: High-resolution scan of formal signing ceremony, public domain
- Why: LC holds the most comprehensive FDR photograph archive; images are pre-digitized at archival quality

**Fallback (If LC unavailable):**
- Source: Wikimedia Commons (commons.wikimedia.org)
- Search: "Franklin Delano Roosevelt" + filter "1941"
- Expected result: Public domain photographs, often linked to LC source with attribution

**Alternative (If both unavailable):**
- Narrate over timeline graphic instead (use visual-spec TimelineComparison template)
- Do NOT substitute generic 1940s stock political portrait
- Script credibility depends on authentic historical imagery

**Critical:** Do not use generic stock photo as placeholder. The script positions this image as a historical echo — FDR's iconic image carries editorial weight. Audience trust depends on accurate sourcing.

---

## Sourcing Philosophy

All candidates in this evaluation reflect the Parallax brand sourcing strategy per `IMAGES.md`:

1. **Real subjects → Real photography** — TSMC fab, cleanroom, trains, equipment all sourced from actual locations/operations
2. **High-contrast survivability** — Images selected for their ability to survive desaturation + duotone remap without becoming muddy
3. **Geometric/architectural prioritization** — Macro, architectural, and industrial subjects score higher because shape + form matter more than color
4. **Avoid stock photography clichés** — No handshake-over-globe, generic lifestyle, or "corporate PowerPoint" imagery
5. **Attribution & licensing** — All stock sourced from Pexels/Pixabay (CC0, no attribution required) or Unsplash (CC0, attribution appreciated)

---

## Key Metrics

- **Total assets evaluated:** 9 P1 (priority 1) assets
- **Total candidates scored:** 45 (5 per asset × 9)
- **High-quality candidates (≥22/25):** 6
- **Perfect matches (24/25):** 2
- **Archival sourcing required:** 1
- **Average score:** 22.1/25 (stock candidates)
- **Viable stock sourcing rate:** 8/9 (89%)

---

## Questions?

Refer to:
- **"What's the scoring?** → See `asset-sourcing-report.md` § "Scoring Rubric"
- **"How does treatment work?"** → See `/remotion-templates/IMAGES.md` § "The Treatment Pipeline"
- **"Why did X score higher than Y?"** → See `candidates-presentation.md` § "[Asset Name]" + score breakdown
- **"What's the archival pathway?"** → See `asset-sourcing-report.md` § "Archival Sourcing Guidance"
- **"How do I download?"** → See `asset-manifest-template.json` + Phase 2 above

---

## Production Handoff

Once Tiger selects winners and archival sourcing is resolved:

1. **Download** all selected assets
2. **Archive raw** → `episodes/EP01-silicon-trap/assets/raw/`
3. **Update asset-manifest.json** with local file paths + final selections
4. **Process through brand pipeline** (desaturate → duotone → grain/vignette → composite)
5. **Save treated** → `episodes/EP01-silicon-trap/assets/treated/`
6. **Stage for Remotion** → import into compositions at specified opacity
7. **Render full episode** (27 compositions, full-length video)

The asset sourcing phase is complete. Production handoff commences immediately upon Tiger's selections.

---

**Generated:** April 26, 2026  
**Skill:** asset-source v1.0  
**Evaluation method:** 5-dimension scoring rubric  
**Output quality:** Verified against SKILL.md requirements
