---
name: visual-concept
description: >
  Audit a production script's visual layer for feasibility, tool fit, variety, and narrative alignment BEFORE committing to visual-spec. Catches visual problems when they're cheap to fix (by reshaping the script). Use whenever someone says 'visual check', 'can we actually make this', 'visual feasibility', 'check the visuals', 'are these visuals doable', or when a new script draft exists and the next step would be visual-spec. Supports re-validation mode (quick check after script revisions). This evaluates whether the visual layer is buildable — distinct from visual-spec (which generates the actual data files) and visual-qa (which checks rendered output).
---

# Visual Concept Audit

You are auditing the visual layer of a two-column production script. Your job is to evaluate whether every visual moment in the right column is **feasible with the tools we actually have**, **assigned to the right tool**, **varied enough to sustain visual interest**, and **emotionally aligned with the narration it accompanies**. You produce a structured report with specific issues, alternative approaches, and script-reshaping suggestions where needed.

## Why This Exists

The Parallax pipeline currently flows: script draft → script-audit → persona-eval → visual-spec → asset sourcing → render. The problem: by the time visual-spec discovers a concept can't be effectively visualized, the script is "locked" and the team works around gaps instead of redesigning for them. This skill inserts a **visual feasibility checkpoint** between script draft and script-audit, when reshaping the script is still cheap.

This is NOT a replacement for visual-spec (which generates the actual JSON data files). This is the creative/feasibility gut-check that happens before committing to production.

## Context

Parallax is a solo-creator YouTube channel analyzing geopolitics through historical analogy. The creator (Tiger) has 5-10 hours/week. Visual production uses a specific toolkit — not unlimited resources. The skill must reason about what's actually achievable, not what would be ideal with a full animation studio.

## Inputs

1. **The two-column production script** (required) — a script following SCRIPT_FORMAT.md with narration (left) and visual production specs (right).
2. **Project reference files** (read as needed):
   - `remotion-templates/BRAND.md` — design system, color palette, treatment ramps
   - `project/VISUAL_LANGUAGE.md` — when to use footage vs. MG vs. layered (the editorial "why")
   - `project/FOOTAGE_SOURCING.md` — what footage is actually sourceable for geopolitics (the reality check)
   - `project/SVG_ILLUSTRATION_PIPELINE.md` — when to use SVG vs other approaches
   - `project/SCRIPT_FORMAT.md` — format spec, visual mode tags, priority tiers, source types
   - Prior episode data files in `remotion-templates/data/episodes/` — to see what's been built before
3. **Editorial Playbook** (read before auditing) — `episodes/EDITORIAL_PLAYBOOK.md`. Read Section 2 (Visual Production) and Section 3 (Persona & Audience) before running your lenses. Cite matching rules as "Playbook: [rule ID]." Flag new visual issues that should become rules as "Candidate Rule."
4. **Learning Log** (read if it exists) — `episodes/LEARNING_LOG.md`. If available, check the "Visual Effectiveness Winners" from past episodes — this tells you which visual types and hold times actually performed well with real audiences, not just in theory.

Find these files relative to the project root. Read only what's needed for the issues you find.

## The Visual Toolkit — Know What You're Working With

Before auditing, internalize what each tool can and cannot do. This is the foundation for every lens.

### Tool 1: Remotion Templates (motion graphics)

**45 templates across 5 families** (May 2026 count). This skill delegates to the family-level decision matrices rather than enumerating every template — those matrices are the canonical, authoritative picker, and re-stating them here is a guaranteed drift trap.

**Family overview** (5 SELECTORs + the per-template dossier library):

| Family | What it's for | Templates (count) | Canonical picker |
|---|---|---|---|
| **Maps** | Geography, territory, trade routes, location relationships | 7 (AtlasPlate, ChoroplethMap, RouteAnimation, ProportionalSymbolMap, DensityMap, CartogramMap, TilegramUSMap, StrategicLandscape) | `remotion-templates/MAP_TEMPLATE_SELECTOR.md` |
| **Charts** | Quantitative data — magnitudes, distributions, comparisons, rank changes, time series | 17 (DataChart, TimeSeriesChart, BarChart, BumpChart, RadarChart, ProbabilityGauge, SankeyFlow, PricingWaterfall, BeeswarmChart, CalendarHeatmap, ConnectedScatterplot, DumbbellPlot, HorizonChart, IsotypeChart, MarimekkoChart, PopulationPyramid, RankChangeDotPlot, RidgelinePlot, Streamgraph, TernaryPlot, BayesianUpdate) | `remotion-templates/CHART_TEMPLATE_SELECTOR.md` |
| **Diagrams** | Structure, relationships, decisions, frameworks, conflict/escalation | 8 (FrameworkDiagram, NetworkDiagram, ArcDiagram, DecisionTree, EscalationLadder, GameBoard, DuelingFrameworks, SplitComposition) | `remotion-templates/DIAGRAM_TEMPLATE_SELECTOR.md` |
| **Timelines** | Single, parallel, juxtaposed temporal sequences | 3 (HorizontalTimeline, TimelineComparison, DualTimeline) | `remotion-templates/TIMELINE_TEMPLATE_SELECTOR.md` |
| **Typography & visuals** | Quotes, hero stats, definitions, section headers, photo composites, archival | 6 (KineticTypography, StatReveal, TitleTransition, ImageComposite, AnnotatedImage, PhotoMontage) | `remotion-templates/TYPOGRAPHY_TEMPLATE_SELECTOR.md` |

**How to use the SELECTORs in concept review.** For every `[MG:]` cell the script writer chose:

1. Identify the family the template lives in (from the table above).
2. Open the family SELECTOR. Each one contains: (a) a decision tree mapping "I need to show X" → template choice, (b) a sibling-disambiguation table comparing closely-related templates row-by-row (e.g., BumpChart vs RankChangeDotPlot vs DumbbellPlot — all rank-change idioms with distinct fits), (c) canonical failure modes the writer is most likely to hit (e.g. **ChoroplethMap on count data → should be ProportionalSymbolMap**; **TimelineComparison with >8 events per column → too dense, split or use HorizontalTimeline**).
3. If the writer's choice contradicts a documented failure mode, flag the mismatch in your concept audit and recommend the SELECTOR-recommended alternative.
4. For nuanced calls, open the per-template dossier at `remotion-templates/references/template-research/<template-name>.md` — 50 dossiers, each citing real-outlet idioms (NYT Upshot, FT, Economist, Bloomberg, Reuters, Pudding), canonical use cases, Parallax-specific defaults, and known failure modes.

**Why not just list them inline here?** Earlier versions of this skill enumerated 7-11 templates in a Best-For/Cannot-Do table. With 45 templates that approach (a) immediately drifts as new templates ship, (b) duplicates the SELECTORs (which can hold the rich sibling-disambiguation tables this table can't), and (c) silently let wrong-template picks pass concept review when the writer used a template the table didn't cover. Delegation to the SELECTORs eliminates all three failure modes.

**Key constraint:** Remotion templates are data-driven — change the JSON, get a different video. They're fast to produce but each template has a designed visual vocabulary. If a visual moment doesn't fit any template's documented use cases, it needs a different tool (footage, illustration, AI-gen).

### Tool 2: Stock Footage + Photography (Pexels, Pixabay, Unsplash)

**Strengths:** Real-world footage of places, technology, people, events, cityscapes, nature, industrial processes. Instant availability. Three-API search gives broad coverage. Brand treatment (desaturate → duotone → grain → composite) unifies any footage into the Meridian look.

**Weaknesses:**
- **Abstract concepts have no footage.** "Strategic interdependence," "the innovation dilemma," "structural vulnerability" — these don't exist as stock video.
- **Geopolitically specific footage is sparse.** "TSMC Arizona fab construction" will return generic semiconductor footage, not the actual TSMC site. "Chinese military parade with semiconductor imagery" won't exist.
- **Historical footage is rarely on stock platforms.** Anything pre-1990 or event-specific needs archival sources (Wikimedia Commons, Library of Congress, national archives), not Pexels.
- **Niche technical footage is hit-or-miss.** "EUV lithography machine interior" may return nothing. "Semiconductor cleanroom" will return plenty.
- **Search term specificity matters enormously.** The sourcing tool tries terms in ranked order. If all three terms are too specific, you get nothing. If all three are too generic, you get unusable filler.

**The test for search terms:** Would a stock photographer have actually filmed this? "City skyline at night" → yes. "Semiconductor export control enforcement" → no.

### Tool 3: Claude SVG Illustrations (free, in-session)

**Strengths:** Geometric and diagrammatic concepts, information-dense flow visualizations, abstract metaphors expressed through geometry, network/dependency graphs, Sankey diagrams, annotated schematics, structural comparisons. Fully brand-compliant (Meridian palette, typography). Resolution-independent. Free.

**Weaknesses:**
- No human figures with anatomical detail or facial features
- No realistic objects, textures, or organic shapes
- No scene recreation ("what it looked like")
- No painterly or artistic styles
- Quality depends heavily on prompt engineering — budget 2-3 iterations per illustration
- Each illustration is a separate generation — no animation (unless converted to a React component for Remotion)

**The decision rule from SVG_ILLUSTRATION_PIPELINE.md:** If the concept is "information that happens to be beautiful" → Claude SVG. If it's "beauty that happens to contain information" → look elsewhere.

### Tool 4: Recraft Atmospheric Illustrations (Register 2 — $0.08/SVG)

**Strengths:** Constructivist/dystopian illustrations with professional composition, negative space, and visual hierarchy. The Parallax "atmospheric register" — propaganda-poster aesthetic, strong diagonals, anonymous figures, industrial metaphors. Generated via `tools/recraft/recraft.py` with integrated brand treatment (duotone ramps from palette.json). Four visual modes (metaphor, illustration, diagram, icon). Output is native SVG.

**Weaknesses:**
- Costs money (~$0.08 per generation, ~$0.50-0.65 per episode)
- NOT data-carrying — cannot replace charts, maps, or labeled diagrams
- Requires clear emotional/conceptual target in the prompt
- Quality depends on prompt specificity (30-60 words, composition + mood, not fine detail)
- Can produce 2-4 variations per prompt for selection

**The decision rule:** If the viewer needs to *read* something → Remotion template. If the viewer needs to *feel* something → Recraft illustration. If neither → stock footage.

**When to assign `[ILLUST:]`:**
- Emotional turning points (the trap closes, the system breaks, the pressure builds)
- Conceptual metaphors that are too abstract for footage but too emotional for clean MG
- Transitions between analytical sections where the viewer needs an emotional reset
- Moments where the narration carries mood/dread/grandeur that would be undersold by generic B-roll

### Tool 5: AI-Generated Video (Register 3 — $0.50-1.00/clip)

**Strengths:** Photorealistic scenes in spaces cameras can't access (restricted facilities, historical reconstructions, conceptual scenes made literal). Mannequin/faceless figures depersonalize to universalize. Physical grounding for abstract analysis. Generated via Kling 3.0 (primary) / Sora 2 (multi-angle) / Runway Gen-4 (character consistency). Passed through `treat_video.py` brand treatment.

**Weaknesses:**
- Most expensive visual tool in the pipeline
- 5-10 second clips only (consistency degrades past 12s)
- Mannequin faces can drift toward realism (requires quality gate)
- Never for named individuals or claimed specific events
- Can't be stock-footage-equivalent — only for genuinely unsourceable physical spaces

### Tool 6: Screen Captures / Direct Sources

**Strengths:** Prediction market interfaces (Kalshi, Polymarket), specific data visualizations from reports, document excerpts, website UIs. Highest credibility for "look at this real thing."

**Weaknesses:** Copyright sensitivity, visual inconsistency with brand, may need editorial treatment to fit Meridian look. Requires manual capture or specific screenshot tooling not currently automated.

### What We Do NOT Have

Be explicit when a visual concept would require tools outside this toolkit:
- **No After Effects / manual animation** — can't do complex character animation, liquid motion, particle effects
- **No 3D rendering** — can't do rotating globes, 3D product shots, architectural walkthroughs
- **No Midjourney / DALL-E** — not in the current pipeline (could be added, but flag it as an expansion)
- **No video editing within Remotion** — Remotion renders compositions, it doesn't edit existing video footage
- **No live-action filming** — everything is sourced, generated, or templated

## The Five Lenses

Run each lens independently against the script's right column. For each issue found, provide:
- **Location**: beat number + the specific visual moment
- **Problem**: what's wrong, in one sentence
- **Impact**: what the viewer experiences if this isn't fixed (bad visual, dead air, tonal mismatch)
- **Suggestion**: a concrete alternative — specify the tool, the approach, and why it's better

### Lens 1: Template Coverage

Walk through every right-column entry that references a Remotion template. For each one, check:

1. **Does this visual moment actually fit the template's capabilities?** Open the family SELECTOR (Tool 1, above) and find the template. Read its "use cases" and "failure modes" / "do NOT use for" rows. A ChoroplethMap asked to show count data is a documented failure mode (should be ProportionalSymbolMap). A DataChart asked to show a time series should be TimeSeriesChart. A KineticTypography asked to render a long paragraph should be split. For nuanced calls, open the per-template dossier at `remotion-templates/references/template-research/<template-name>.md`.

2. **Is the data complexity within template limits?** Each dossier names quantitative limits (max nodes, max columns, max events per column) and the visual breakdown they cause. FrameworkDiagram >12 nodes, TimelineComparison >8 events per column, NetworkDiagram >15 nodes — all flagged. Suggest splitting or template change rather than letting it ship over-dense.

3. **Are there visual moments assigned to stock footage or static images that would be BETTER served by a template?** If the script says `FOOTAGE: "global trade statistics"` but the narration is rattling off specific numbers — that's a DataChart moment, not a footage moment. The template would serve comprehension better.

4. **Are there moments with NO visual spec that need one?** Check for narration paragraphs where the right column is empty, vague ("something here"), or just says "match previous." Every 5 seconds needs a spec per SCRIPT_FORMAT.md.

### Lens 2: Stock Footage Likelihood

For every `FOOTAGE` or `IMAGE` entry in the right column:

1. **Apply the "would a stock photographer have filmed this?" test.** Score each set of search terms:
   - ✅ **High confidence** — generic industry, cityscapes, nature, common technology shots
   - ⚠️ **Uncertain** — specific facilities, niche technical processes, recent events
   - ❌ **Unlikely** — abstract concepts described as footage, historical events on stock platforms, classified/restricted subjects

2. **Check search term ranking.** Terms should go most specific → most generic. Flag entries where all terms are at the same specificity level (all too specific = likely no results; all too generic = unusable filler). Suggest a better gradient.

3. **Flag footage requests that are actually illustration candidates.** When the script asks for footage of a concept that doesn't photograph ("the innovation dilemma," "strategic interdependence"), suggest a Claude SVG illustration or a Remotion template instead. Be specific about what the visual would look like.

4. **Check archival source feasibility.** For historical images tagged as Wikimedia Commons or Library of Congress, apply a quick plausibility check: Is this specific enough to find? Is it likely to exist in public domain? Flag entries that assume specific archival photos exist without evidence.

### Lens 3: Visual Monotony

Map the full sequence of visual types across the entire script. Then check:

1. **Same-type sequences.** Three or more consecutive visual moments of the same template type (three maps in a row, three charts back-to-back). The viewer's eye adapts and stops registering new information. Suggest interspersing with a different type.

2. **Same-mode sequences.** The script uses three visual modes: `[FOOTAGE:]`, `[MG:]`, and `[LAYERED:]`. Long stretches of nothing but one mode flatten the visual texture. Per VISUAL_LANGUAGE.md: no more than 3 consecutive `[MG:]` without a `[FOOTAGE:]` break, no more than 30 seconds of continuous `[FOOTAGE:]` without a visual change. Good episodes alternate between footage (grounding in reality), templates (analytical clarity), and layered moments (bridging both). Check the overall mode balance against targets: MG 40-55%, FOOTAGE 30-40%, LAYERED 5-15%.

3. **Treatment monotony.** If every image uses `standard` treatment for 10+ consecutive minutes, the color palette gets monotonous. Check whether narrative tone shifts (conflict, reflection, revelation) are reflected in treatment changes.

4. **Duration monotony.** A sequence of 8-second, 8-second, 8-second, 8-second segments creates visual metronome. Flag stretches where durations are too uniform. Good pacing mixes quick cuts (3-4s) with held compositions (10-15s).

5. **Positive patterns to note.** If the script has a strong rhythm — e.g., alternating between grounding footage and analytical templates, or using a consistent visual motif that evolves — note it as a strength. Don't manufacture monotony issues where the repetition is intentional and effective.

Present this as a **visual rhythm map** — a compressed timeline showing template types, sources, treatments, and durations in sequence, so the overall pattern is visible at a glance:

```
Beat 1: [MAP 12s] [FOOTAGE 8s] [TYPOGRAPHY 4s] [FOOTAGE 6s]
Beat 2: [MAP 10s] [MAP 8s] [MAP 6s]  ← ⚠️ three maps in a row
Beat 3: [CHART 8s] [FOOTAGE 12s] [FRAMEWORK 6s] [FOOTAGE 8s]
...
```

### Lens 4: Treatment-Narrative Alignment

For each visual moment, check whether the visual treatment matches the emotional register of the accompanying narration:

1. **Treatment ramp vs. narrative tone.** The three treatment ramps carry meaning:
   - **Standard** (ink → bronze → amber): Neutral, analytical, explanatory. Fits most narration.
   - **Conflict** (ink → rust): Tension, geopolitical friction, danger, high stakes. Should appear when narration is describing confrontation, risk, or urgency.
   - **Editorial** (folder → bone → paper): Documents, data, institutional, reflective. Fits policy discussions, historical documents, archival contexts.

   Flag mismatches: conflict treatment on a calm explanatory passage, or standard treatment on a high-tension reveal.

2. **Composite mode vs. narrative focus.** Background composites (25-40% opacity) are ambient texture — the narration is primary. Inset composites (60-80%) demand attention — use when the visual IS the point (a key image, a data reveal). Flag moments where an important visual is buried at background opacity, or where a generic texture is given inset prominence.

3. **P1 placement vs. narrative peaks.** Hero visuals (P1) should land at the script's strongest moments — the key insight, the dramatic turn, the "Wait What?" hook. If P1 visuals are assigned to setup passages or ambient context, they're wasted. Map where P1s fall and check whether they correspond to the narration's highest-impact beats.

4. **Visual tone vs. narration tone — beyond treatment.** Some mismatches go deeper than treatment ramp:
   - Upbeat, bright stock footage under somber narration about loss or failure
   - Busy, information-dense template during a pause or reflection moment
   - Static held image during rapid-fire narration that needs visual energy
   - Fast cutting during a passage that needs the viewer to absorb and reflect

   These are judgment calls. Flag only clear mismatches, not debatable ones.

### Lens 5: Tool Assignment Audit

For each visual moment, ask: **is this assigned to the right tool?** This is the capstone lens that synthesizes tooling knowledge across the full script.

1. **Tool-concept mismatch.** The most common error: assigning a visual concept to a tool that can't execute it well.
   - Abstract concept → stock footage (should be: SVG illustration or Remotion template)
   - Specific data → stock footage (should be: DataChart or KineticTypography)
   - Geographic relationship → FrameworkDiagram (should be: ChoroplethMap or RouteAnimation)
   - Simple quote → complex template (should be: KineticTypography)
   - Real-world place → illustration (should be: stock footage with brand treatment)

2. **Underusing available tools.** Are there visual moments that settle for a generic approach when a more powerful tool is available? E.g., using stock footage of "a chart on a screen" when DataChart could render the actual data animated and brand-compliant.

3. **Overreaching beyond toolkit.** Flag any visual that would require tools we don't have (3D rendering, character animation, custom After Effects work). For each, suggest the closest achievable alternative within the toolkit and assess whether it's "good enough" or whether the script should be reshaped.

4. **Production cost awareness.** Order of preference: Remotion templates (free, fast, repeatable) → stock footage (free APIs, needs treatment) → Claude SVG (free, needs iteration) → AI image APIs ($0.04-0.08 each) → screen captures (manual effort) → archival (research effort, rights checking). Flag entries that jump to expensive/effortful options when a cheaper alternative exists, unless there's a clear quality reason.

5. **Reuse opportunities.** Can any visual moment reuse or adapt an asset from a prior episode? Can a single Remotion composition serve multiple beats with different data? Flag opportunities to reduce production effort through smart reuse.

### Lens 6: Register Balance & Transition Grammar

The channel uses a three-register visual system (see `project/VISUAL_LANGUAGE.md`). Each register serves a different cognitive function:

- **Register 1 — Analytical** (`[MG:]`): Clean data. Where the viewer *reads* information. Remotion templates.
- **Register 2 — Atmospheric** (`[ILLUST:]`): Constructivist mood art. Where the viewer *feels* something. Recraft illustrations.
- **Register 3 — Grounding** (`[AI-GEN:]`): Photorealistic scenes. Where the viewer *inhabits* a space. AI video.

Check the script for:

1. **Register presence.** All three registers should be represented in any episode longer than 8 minutes. If one is completely absent, the visual texture flattens. Flag and suggest where it could be inserted.

2. **Register proportion.** Target ranges:
   - Analytical (MG): 40-55% of visual time
   - Atmospheric (ILLUST): 5-15%
   - Grounding (AI-GEN): 5-15%
   - Footage: 25-40% (register-neutral — provides real-world anchoring)
   
   Flag if any register exceeds or falls below its range. Common issues:
   - All-MG scripts → "slideshow" effect. Suggest 3-5 atmospheric moments for emotional texture.
   - Over-atmospheric → viewer fatigue from sustained mood without data resolution. Reduce to 4-5 key moments.
   - Over-grounding → expensive and the stylized quality fatigues. Keep to 3-4 clips per episode.

3. **Register pacing.** Map the register sequence across the full script:
   ```
   Beat 1: [MG] [FOOTAGE] [ILLUST] [MG]  ← good: register variety
   Beat 2: [MG] [MG] [MG] [MG]  ← ⚠️ all-analytical, needs break
   Beat 3: [ILLUST] [ILLUST] [AI-GEN]  ← ⚠️ too much non-analytical in sequence
   ```
   
   Rules:
   - No more than 3 consecutive Analytical entries without a non-Analytical break
   - No more than 2 consecutive Atmospheric or Grounding entries
   - Atmospheric and Grounding should be interspersed among Analytical and Footage, not clustered

4. **Transition grammar compliance.** When the script switches between registers, check that the implied transition makes sense:
   - Analytical → Grounding: color-wash (clean space bleeds into textured world)
   - Grounding → Atmospheric: dissolve (photorealistic dissolves into stylized — ~~blur-through~~ is deprecated)
   - Atmospheric → Analytical: iris (illustration contracts to focal point, data opens from it)
   - Analytical → Atmospheric: dissolve (data fades into mood)
   - Grounding → Analytical: color-wash or cut
   
   Flag any transition that would feel jarring (e.g., a hard cut from constructivist illustration directly to photorealistic AI video — these are too stylistically different for a cut).

5. **Register-mode mismatch.** The most common error: assigning a visual moment to the wrong register.
   - Data the viewer needs to read → MUST be Analytical (MG), NOT Atmospheric
   - Mood/feeling/emotional weight → should be Atmospheric (ILLUST), NOT MG
   - Physical space the viewer should feel present in → should be Grounding (AI-GEN), NOT footage of a different space
   - Generic establishing shot → should be Footage, NOT AI-GEN (save AI-GEN for unsourceable spaces)

6. **Atmospheric register editorial fit.** For each `[ILLUST:]` entry, verify:
   - Does this narration moment carry enough emotional weight to warrant atmospheric treatment?
   - Is the illustration adding something footage and MG cannot? (If a stock city aerial would work just as well, use footage)
   - Is the mood aligned with the treatment ramp? (Constructivist dystopia + standard treatment = controlled unease; + conflict treatment = active danger)

## Output Format

```
# VISUAL CONCEPT AUDIT REPORT
## Script: [filename]
## Date: [today]

## Summary
[3-4 sentences: Overall visual feasibility assessment. What percentage of visuals are immediately producible? What's the single biggest visual risk? Is the script's visual ambition matched to the toolkit?]

## Visual Rhythm Map
[Compressed timeline showing the full visual sequence — template types, sources, treatments, durations. Make the overall pattern visible.]

## Lens 1: Template Coverage
[Issues with location, problem, impact, suggestion. Group by severity.]

## Lens 2: Stock Footage Likelihood
[Issues with confidence ratings. For each ❌ or ⚠️, provide alternative approach.]

## Lens 3: Visual Monotony
[Sequence analysis. Flag same-type runs, same-source stretches, treatment/duration uniformity.]

## Lens 4: Treatment-Narrative Alignment
[Mismatches between visual treatment and narration emotional register. P1 placement analysis.]

## Lens 5: Tool Assignment
[Mismatch flags, underuse opportunities, overreach warnings, cost optimization, reuse opportunities.]

## Lens 6: Register Balance
[Register distribution (%), pacing sequence map, transition grammar compliance, register-mode mismatches, atmospheric editorial fit check.]

## Script Reshaping Suggestions
[This is the most important section. For each issue that can't be solved by just changing the right column — where the narration itself should adapt to visual reality — provide:
- The current narration moment and its visual spec
- Why the visual approach doesn't work
- How the narration could shift to enable a better visual
- The proposed new visual approach
Keep suggestions grounded in what the toolkit can actually do.]

## Fixes for Visual-Spec (Structured Handoff)

This section exists so visual-spec can consume actionable items directly instead of parsing the prose sections above. Include one row for every template reassignment, complexity warning, or sourcing risk that visual-spec needs to know about. If there are no issues, write "No fixes needed — all specs are visual-spec ready."

| Comp # | Beat | Current Spec | Recommended Change | Reason |
|--------|------|-------------|-------------------|--------|
| [e.g. 18] | [4] | [ChoroplethMap] | [→ RouteAnimation] | [Need to show flows, not just highlighted countries] |
| ... | | | | |

## Verdict

**VISUALLY READY** — All visual moments are feasible with current tools, well-matched, and varied. Proceed to script-audit and visual-spec.

**NEEDS VISUAL REVISION** — Specific visual moments need reassignment or the script needs reshaping in identified places. List exact items to address. Can proceed to script-audit in parallel (since narration quality is independent) but do NOT proceed to visual-spec until resolved.

**NEEDS SCRIPT RETHINK** — Multiple visual concepts are beyond toolkit capability, or the script's visual ambitions are fundamentally mismatched to production capacity. Reshaping the script is required before proceeding.
```

## Important Notes

- **This is a creative checkpoint, not a bureaucratic gate.** The goal is to improve the script's visual storytelling, not to check boxes. If the visual layer is already strong, say so briefly and focus the report on the 2-3 things that would make it even better.

- **Suggest, don't dictate.** The left column (narration) belongs to Tiger. When suggesting script reshaping, frame it as "this narration moment would land harder with [visual approach] — here's how the text could shift to enable it." The final call is always human.

- **Think like a viewer, not a producer.** The question isn't "can we technically render this?" — it's "will the viewer understand and feel what we want them to understand and feel?" A technically feasible visual that confuses the viewer is worse than a simple approach that clarifies.

- **Visual variety serves comprehension, not decoration.** Don't flag monotony just because the same template appears twice. Flag it when the repetition causes the viewer to stop absorbing new information. Three maps in a row is fine if each map reveals something genuinely new. Three maps in a row is bad if the second and third look the same at a glance.

- **Be specific about alternatives.** "Use a different approach" is useless. "Replace the stock footage request with a FrameworkDiagram showing the three chokepoints as a flow — this lets the viewer see the structural relationship the narration is describing, instead of watching generic factory footage while being told about structure" is useful.

- **The Script Reshaping Suggestions section is what makes this skill different from a simple visual checklist.** Other skills audit the script as-is. This skill is the only one that says "the narration should change to enable better visuals." That feedback loop — from visual feasibility back to script — is the whole point.

---

## Re-Validation Mode (Quick Check)

This skill has a lightweight mode for **post-rewrite re-validation**. Use it when:
- Tiger has completed his human review and rewritten parts of the script
- Script-audit suggested restructuring and the narration has changed
- Any revision has been made to the script after the initial visual-concept audit

### When to trigger

Trigger re-validation when someone says: 'quick visual check', 're-validate visuals', 'did my rewrites break anything', 'visual recheck', or when a script revision is saved after the initial visual-concept audit and before visual-spec.

### What re-validation checks (3 lenses only)

Re-validation is NOT a full 5-lens audit. It runs only the checks most likely to be broken by script revision:

**1. Template-Narration Drift.** For each beat that was revised, check: does the right-column visual spec still match the left-column narration? Common drift patterns:
- Narration beat was restructured but visual durations weren't updated
- A data point changed in narration but the DataChart spec still references the old number
- A paragraph was deleted but its visual spec remains (orphaned visual)
- A new paragraph was added with no corresponding visual spec (visual gap)
- The emotional register of the narration shifted (e.g., from confrontational to reflective) but the treatment ramp wasn't updated

**2. P1 Realignment.** After rewriting, are the P1 hero visuals still at the script's strongest moments? Revisions often strengthen one beat and weaken another — check that hero visuals didn't end up on what's now a setup passage. This is the fastest way to catch "wasted P1" drift.

**3. Rhythm Integrity.** Generate an updated visual rhythm map and compare against the original. Did the revision introduce visual monotony (e.g., collapsing two varied beats into one that's now all FOOTAGE)? Did it break a deliberate visual pattern?

### What re-validation does NOT check

- Template capability fit (Lens 1 full) — unlikely to change from narration edits
- Stock footage likelihood (Lens 2) — search terms don't change from narration edits
- Full tool assignment audit (Lens 5) — only check if new visual specs were added

### Re-validation output

```
# VISUAL RE-VALIDATION
## Script: [filename] (revision from [previous version])
## Date: [today]

## Changes Detected
[List beats/paragraphs that changed since last audit]

## Drift Issues
[For each changed beat: what drifted, how to fix. Same format as main audit issues.]

## Updated Visual Rhythm Map
[Full rhythm map reflecting the revised script]

## Verdict: ALIGNED / NEEDS ADJUSTMENT
- ALIGNED: Visual layer still works after revision. Proceed to visual-spec.
- NEEDS ADJUSTMENT: [N] drift issues found. List the specific fixes needed before visual-spec.
```

Re-validation should take 2-3 minutes to run and produce a short report. It's a guard rail, not a gate — if the drift is minor (a duration needs updating), note it and let visual-spec handle the correction. Only flag issues that would cause visual-spec to generate incorrect or misaligned JSON.
