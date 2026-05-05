---
name: source-feedback
description: >
  Audit asset-manifest.json after sourcing runs: identify shots with zero or low-quality results, diagnose why search terms failed, and suggest alternative visual approaches for each gap (different search terms, different visual mode, SVG illustration, etc.). Use whenever someone asks 'check sourcing results', 'what didn't source', 'source feedback', 'asset gaps', 'any sourcing problems', 'what do we do about [shot]', or when asset-manifest.json appears after a batch sourcing run. This is the post-sourcing gap analysis — distinct from asset-source (which does the actual searching) and visual-concept (which audits the script's visual layer before sourcing).
---

# Source Feedback & Gap Resolution

You are analyzing the output of `tools/asset-source/source.py` to identify which shots were successfully sourced and which weren't. Your job is to close the asset sourcing feedback loop: identify gaps, assess their impact on the production timeline, and suggest concrete alternative approaches.

## Why This Matters

The sourcing tool searches three free stock libraries (Pexels, Pixabay, Unsplash) and returns JSON results. But not every shot can be found in stock libraries. Some searches return zero results. Others return only the generic fallback term (you wanted "TSMC Arizona aerial" but got "chip manufacturing" instead). Your job is to identify these gaps and propose solutions that don't break the production pipeline.

The gap report feeds into a decision tree: Can we live with the fallback? Can we improve the search terms? Do we need to pivot the script? Can Remotion templates replace the stock footage? Do we need AI-generated illustrations or a different visual strategy?

## Inputs

1. **asset-manifest.json** (required) — the output from `source.py`. It maps each shot-list ID to sourcing results.
   - Location: typically `episodes/EPXX-slug/asset-manifest.json`
   - Also check for `sourcing-results.json` or similar output files from recent runs

2. **shot-list.json** — the original request file. Needed to understand priorities and context.
   - Location: `episodes/EPXX-slug/shot-list.json`

3. **Production script** (read as needed) — to understand what each shot needs to accomplish narratively.
   - Location: `episodes/EPXX-slug/script-vX-*.md` (current script file)

4. **Project reference files** (read as needed):
   - `remotion-templates/BRAND.md` — visual treatment system
   - `remotion-templates/IMAGES.md` — sourcing decision tree, treatment survivability, what to avoid
   - `project/PRODUCTION_PIPELINE.md` — next steps after sourcing
   - `tools/asset-source/source.py` — to understand output format and API limitations

Find these files relative to the project root. Read only those relevant to the gaps you find.

## Detection Heuristics

### What counts as a gap?

1. **Zero results** — query returned no matches across all three APIs.
   - Action: need fallback approach immediately.

2. **Only generic fallback worked** — most specific search term(s) returned zero results; only the final/most-generic fallback scored matches.
   - Example: You wanted "TSMC Arizona construction aerial drone" but had to settle for "chip manufacturing" from Pexels.
   - Action: consider alternative searches, templates, or archival sourcing.

3. **Low-quality matches** — results scored below 15/25 (per the asset-source skill's 5-dimension rubric).
   - Especially bad if Treatment Survivability (dimension 3) is ≤2, meaning the image won't survive duotone treatment.
   - Action: re-search with different terms, or accept the fallback + note production risk.

4. **Only one source returned results** — if only Pexels had matches but Pixabay and Unsplash returned nothing, the source pool is shallow.
   - Action: this may indicate a niche search; consider template alternative.

5. **P1 hero shot with poor matches** — a critical moment gets only generic B-roll as a fallback.
   - This is the most dangerous gap. Impact on narrative is immediate.

## The Sourcing Decision Tree for Gaps

When you identify a gap, map it to a solution using this priority order:

### For P1 (hero) gaps:

1. **Better search terms** — sometimes the first search was too specific. Try synonyms, drop the specificity level, or broaden the context.
   - Example: "TSMC Arizona" failed → try "semiconductor fab construction" or "advanced manufacturing facility"
   - Cost: 5-10 min re-run of source.py with new terms
   - Likelihood of success: 40-60%

2. **Remotion template substitution** — use one of the 7 core templates instead of stock footage.
   - **ChoroplethMap** — if the shot is about geographic/political division or supply chain phases
   - **TimelineComparison** — if comparing historical vs. contemporary moments
   - **RouteAnimation** — if showing movement, supply chains, or progression
   - **DataChart** — if the shot needs to show metrics or trends
   - **KineticTypography** — if the moment is a key quote or thesis statement
   - **FrameworkDiagram** — if showing a conceptual structure or system
   - **TitleTransition** — section breaks, beat titles
   - Cost: 30-60 min to design and implement JSON data
   - Likelihood of success: 85%+ if the shot's narrative purpose can be reframed as a map, chart, or timeline

3. **AI-generated engraved illustration** — commission an SVG or Flux image in copperplate engraving/woodcut style.
   - For abstract concepts with no photographic equivalent (e.g., "structural interdependence as clockwork mechanism")
   - For historical subjects where no archival photo exists but visualization is important
   - Cost: $0.04–0.08 per Flux 2 Pro image, 20 min turnaround
   - Likelihood of success: 90%+ if the brief is specific (no "nice looking diagram" — too vague)
   - Quality gate: all AI generations must pass the SVG illustration pipeline polish audit (see SVG_ILLUSTRATION_PIPELINE.md)

4. **Archival sourcing** — move beyond stock libraries to primary sources.
   - **Wikimedia Commons** — public domain photographs, historical documents, famous artworks
   - **Library of Congress** — US archival material, 1941 oil embargo docs, FDR photos
   - **National Archives** — official records, government photographs
   - **Google Scholar** — academic papers with figures (check licensing)
   - Cost: manual search, 30-90 min per asset
   - Likelihood of success: variable; some subjects are well-documented, others sparse

5. **Screen capture / data visual** — for specific websites, prediction markets, charts, or live data.
   - **Prediction markets** (Kalshi) — screenshots of odds/probability forecasts
   - **Financial terminals** — stock charts, commodity prices, semiconductor indices
   - **News sites** — specific articles or reporting (small inset, not hero)
   - **Data dashboards** — real-time metrics (energy usage, semiconductor fab capacity)
   - Cost: 10-20 min to capture + set up in Remotion inset
   - Likelihood of success: 95%+ for publicly available pages
   - Legal note: screenshots of data for commentary are generally fair use; screenshots of news articles/copyrighted layouts are not

6. **Narrative pivot** — rewrite the script to work with what's available.
   - If the hero shot can't be sourced and templates don't fit, the narration may need to change its visual framing.
   - Example: instead of "observe this TSMC facility," change to "here's what we know about TSMC's capacity constraints from public filings"
   - Cost: 30-60 min script revision (Tiger only)
   - Likelihood of success: depends on how central the visual is to the thesis

7. **Hold on narration** — sometimes no visual is better than a bad visual.
   - Keep the previous composition on screen while the narration continues.
   - Acceptable for P2/P3 shots; risky for P1 heroes.
   - Cost: 5 min in Remotion (set duration to match narration instead of cutting to new asset)
   - Likelihood of success: 100%, but narrative impact is neutral-to-negative

### For P2 (supporting) gaps:

Priority order: Better search terms → Template → Archival → Narrative fallback → Hold on narration

### For P3 (ambient) gaps:

Priority order: Better search terms → Hold on narration (P3 can sustain a longer shot with no visual change) → Generic fallback (usually acceptable for texture)

## Output Format

```
# SOURCE FEEDBACK REPORT
## Episode: [number and title]
## Date: [today]

## Sourcing Summary
- Total assets in shot list: X
- Successfully sourced (score ≥15): Y
- Gaps identified: Z (N critical, M moderate, L low-impact)
- Sourcing completion: Y/X (percentage)

## Gap Analysis

### [Shot ID] — [Priority] — [Status]
**Original search terms:** [most specific] > [fallback] > [most generic]
**What happened:** [Zero results / Only generic fallback worked / Low quality scores / Shallow source pool / Other]
**Narrative importance:** [1-3 sentence summary of what this shot needs to accomplish]
**Current best option:** [result name/link if any scored ≥15; otherwise "None"]

**Recommendation:**
1. [Primary approach with estimated cost/likelihood]
2. [Secondary approach]
3. [Fallback]

**Script impact:** [If this gap isn't resolved, does the narrative need to change? Yes/No. If yes, describe the change needed.]

---

[Repeat for each gap, sorted by priority (P1 first, then P2, then P3) and by impact]

## Re-source Commands

For gaps where better search terms would help, provide exact source.py commands to try:

\`\`\`bash
# Re-search [shot-list ID] with alternative terms
python tools/asset-source/source.py "new search term 1" "new search term 2" --type [photo|video] --preview

# Or batch re-run with updated shot-list subset
python tools/asset-source/source.py --batch shot-list-rescan.json --output assets/
\`\`\`

## Production Risk Assessment

**Critical blockers (episode cannot render without resolution):**
- [List any P1 hero shots with zero viable options]

**Schedule impact (requires human decision + iteration):**
- [List any gaps requiring script revision, AI generation, or archival research]

**Can be deferred (acceptable with fallback or template):**
- [List P2/P3 gaps that don't block rendering]

## Next Steps

1. Tiger reviews this report and selects approach for each gap.
2. For each gap, execute the recommended action:
   - Re-source: run source.py with new terms
   - Template: call visual-spec skill to design JSON data
   - AI generation: write prompt, generate, audit via SVG pipeline
   - Archival/screen capture: manual research, add to asset-manifest.json
   - Script pivot: Tiger revises narration
   - Hold on narration: Remotion composer notes this in the composition spec
3. Update asset-manifest.json with resolved shots
4. Return to this report: check off each gap as resolved
5. Proceed to visual-spec → render
```

## Important Notes

- **Distinguish impact levels.** A P1 hero gap is a blocker. A P3 ambient gap is a note. Don't panic equally about both.

- **Be surgical with re-search suggestions.** Not "try different terms" — give exact terms to try. Explain why they might work better.

- **Template substitution is often better than bad stock.** If the search returned only 14/25-scored images, seriously consider whether a ChoroplethMap or TimelineComparison would serve the narrative better.

- **AI generation is not a first resort.** Stock > Archival > Remotion template > AI. But for abstract concepts with no photographic equivalent, AI engraved illustrations are excellent (and on-brand).

- **Narrative pivot is expensive.** Only recommend if the visual gap is central to the thesis. For throwaway visual moments, hold on narration or template is cheaper.

- **Always read the script** to understand what each shot needs to accomplish. A "chip factory" shot serves different purposes depending on whether it appears during the TSMC paragraph or the economics analysis.

- **Check treatment survivability.** Per IMAGES.md, high-contrast architectural shots, silhouettes, and macros survive duotone treatment well. Flat, pastel, lifestyle photos turn to mud. Low scores on Treatment Survivability (dimension 3) are a red flag even for high-resolution matches.

- **Archival sourcing is niche.** You won't find "1941 FDR signing oil embargo order" on Pexels. Flag immediately and redirect to Wikimedia/Library of Congress. Don't waste API calls.

---

## Context: Remotion Template Reference

Quick reminder of what each template does (for gap resolution decisions):

| Template | Use case | Input |
|----------|----------|-------|
| **ChoroplethMap** | Geographic divisions, supply chain phases, geopolitical groupings | JSON with region colors, labels |
| **TimelineComparison** | Historical parallels, before/after, 1941 vs. 2022 | JSON with dates, events, visual markers |
| **RouteAnimation** | Supply chain routes, shipping lanes, semiconductor migration | JSON with start/end points, path shape |
| **DataChart** | Metrics, trends, production capacity, market share | JSON with series data, axis labels |
| **KineticTypography** | Key quotes, thesis statements, emotional beats | Quote text, accent color, timing |
| **FrameworkDiagram** | Conceptual structures (e.g., trilemma, three pillars) | SVG + positioning, optional animation |
| **TitleTransition** | Section breaks and beat titles | Title text, subtitle, timing |

More detail in `remotion-templates/BRAND.md` and the 7 core templates in `src/templates/`.
