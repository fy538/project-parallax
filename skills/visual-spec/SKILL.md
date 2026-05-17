---
name: visual-spec
description: >
  Generate four outputs from a finalized script: (1) Remotion template JSON data files for every [MG:] composition (Register 1: Analytical), (2) Recraft illustration prompt specs for every [ILLUST:] segment (Register 2: Atmospheric), (3) AI video generation briefs for every [AI-GEN:] segment (Register 3: Grounding), and (4) a structured footage manifest with search terms and sourcability ratings for every stock/archival shot. Checks concept registry for callback opportunities and validates three-register balance before generating. Use whenever someone says 'generate visuals', 'visual spec', 'create the data files', 'footage manifest', 'spec out the graphics', 'what templates do I need', or when a script is finalized and needs visual production planning.
---

# Visual Spec Generator

You are generating the full visual data layer for a bilingual geopolitics video channel. The channel uses a **three-register visual system** (see `project/VISUAL_LANGUAGE.md`):

1. **Register 1 — Analytical** (Remotion JSON files): Clean, data-driven motion graphics — maps, charts, timelines, frameworks. Where information lives.
2. **Register 2 — Atmospheric** (Recraft illustration specs): Constructivist, dystopian, propaganda-poster-style art. Creates mood, emotional texture, conceptual weight. NOT data-carrying.
3. **Register 3 — Grounding** (AI video briefs): Constructivist figurative scenes drawing on Rodchenko's 1924 portrait series and Lissitzky's Self-Portrait — figures with 4-5 color-blocked face planes, no continuous skin tonality, no rendered facial features. Physical presence in spaces cameras can't access. Post-May 4, 2026 the photoreal-mannequin convention was retired in favor of constructivist-figurative; both Register 2 (atmospheric backdrops) and Register 3 (grounded scenes) now share constructivist visual language and differ only in role.

Plus: **Footage manifest** — structured search specs for every stock footage and archival need.

A typical episode: ~40-55% MG, ~25-40% footage, ~5-15% ILLUST, ~5-15% AI-GEN, ~5-10% layered, ~3-7% transitions. Your output covers all four layers. All three registers pass through the same brand treatment ramps from `palette.json` (standard/conflict/editorial), giving them shared tonal DNA despite stylistic variety.

## Reference Docs

Before starting, familiarize yourself with:
- **`project/VISUAL_LANGUAGE.md`** — editorial logic for when to use footage vs. MG vs. layered. This is the "why" behind visual decisions.
- **`project/DIRECTING_LANGUAGE.md`** — the `DIR:` annotation syntax. This is the "how" — camera movement, reveal choreography, timing, transitions, and mood. You will parse these and translate them into `_direction` blocks in JSON files, camera/mood language in AI-GEN briefs, treatment selection in ILLUST specs, and tint hints in footage manifests.
- **`project/TEXT_ANIMATION_REGISTER.md`** — the eight canonical text-animation techniques (Number Ticker, Tracking-In, Reveal Mask, Underline Draw, Typewriter, Backspace, Scramble, Word Cascade) and three composite patterns (Definition Reveal, Stat Caption, Quote Attribution). Use this to pick the `_direction.textAnimation` register for text-bearing templates (KineticTypography, StatReveal). The doctrine doc has per-technique use/avoid rules and a decision matrix.
- **`project/HOLD_MOTION_REGISTER.md`** — the eight canonical hold-beat motion techniques (Stillness, Editorial, Breathing, Settle, Sway, Documentary Ken Burns, Atmospheric particles, Mood pulse) and the four register decision matrix (A analytical / B editorial-hero / C documentary / D cartographic). Use this to pick the `_direction.driftPreset` for the *post-entrance hold window*. Most segments take their template default and need no override; reach for a per-segment `driftPreset` only when the editorial intent diverges from the template's canonical register (e.g., a memorial moment on a normally-editorial chart wants `none`/stillness). The `catalog-showcase-drift-register` composition is the side-by-side visual reference.
- **`project/TRANSITION_GRAMMAR.md`** — the six canonical segment-to-segment transitions and their editorial claims. Use this to pick the `cut()` directive for each seam between segments. Each transition carries an implicit claim about the editorial relationship — picking the wrong one makes a wrong claim. Decision matrix: **cut** (same thought, next breath — within-beat default), **dissolve** (elaboration, gentler delivery — beat-boundary default), **fade** (new chapter / time-jump / silence beat), **match-cut** (same subject, different scale — historical-analogy seams), **color-wash** (register shift — new editorial mode; always include `washColor` token), **iris** (premium cinematic open/close — reserved for civilizational-rupture moments, ≤2 per episode). Six transitions are deprecated: `wipe-left/right/up`, `blur-through`, `whip-pan`, `spatial-zoom` — never emit these. Consult the `catalog-showcase-transition-grammar` composition to see all six in motion.
- **`project/FOOTAGE_SOURCING.md`** — what footage is actually available for geopolitics content, organized by sourcability tier. This is the reality check.
- **`project/SCRIPT_FORMAT.md`** — the visual mode tags (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`), `DIR:` annotations, and how they work in the two-column format.
- **`project/AI_VIDEO_PIPELINE.md`** — the fourth visual mode specification: aesthetic philosophy (mannequin faces + realistic environments), tool selection, prompting patterns by use case, and editorial guardrails.
- **`tools/ai-video/style-references/PROMPTS.md`** — the 7 style reference images that anchor the AI-GEN aesthetic. Reference these by filename when writing briefs.

## How This Works

The templates cover the MG layer of visual needs. Grouped by **family** so the orphaned templates (the ones that exist but aren't in any author's working memory) stay visible. Shares are episode-typical proportions, not budget caps.

**Wayfinding philosophy:** before picking a template, identify the FAMILY the script beat lives in, then open that family's SELECTOR wall-table to choose the specific template. All five Remotion families now have canonical "if your beat says X, use Y" wall-tables:

- Maps → [`MAP_TEMPLATE_SELECTOR.md`](../../remotion-templates/MAP_TEMPLATE_SELECTOR.md)
- Charts → [`CHART_TEMPLATE_SELECTOR.md`](../../remotion-templates/CHART_TEMPLATE_SELECTOR.md)
- Diagrams → [`DIAGRAM_TEMPLATE_SELECTOR.md`](../../remotion-templates/DIAGRAM_TEMPLATE_SELECTOR.md)
- Timelines → [`TIMELINE_TEMPLATE_SELECTOR.md`](../../remotion-templates/TIMELINE_TEMPLATE_SELECTOR.md)
- Typography → [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](../../remotion-templates/TYPOGRAPHY_TEMPLATE_SELECTOR.md)

The family-aware index [`TEMPLATE_FAMILIES.md`](../../remotion-templates/TEMPLATE_FAMILIES.md) cross-references all five plus the per-template dossiers. The long-form prose in `references/template-picker.md` is the deeper-dive reference; the wall-tables are the operating documents.

### Maps — 6 templates · ~25-30% episode share

**Selector doc:** [`remotion-templates/MAP_TEMPLATE_SELECTOR.md`](../../remotion-templates/MAP_TEMPLATE_SELECTOR.md) (wall-table). Read it before assigning any map beat. The detailed selection table also lives below this section.

**Audit skill:** `map-audit` — sister to script-audit / visual-concept. Runs after script-draft, before visual-spec, to catch template-data mismatches.

| Template | Share | Purpose |
|---|---|---|
| ChoroplethMap | ~15% | World map, country fills for **quantitative rates / shares / %** on Mapbox basemap. Default for "GDP per capita," "trade share," "election swing." Atmospheric register. |
| RouteAnimation | ~15% | Trade routes, supply chains, hub-and-spoke (radial mode). Animated arcs on Mapbox basemap. |
| AtlasPlate | ~10% | **Pure-SVG flat editorial cartography** via d3-geo. Use for **categorical** maps ("members of X bloc," "treaty signatories"), analytical register where Mapbox atmosphere distracts, OR cold-open globes via `projection: "orthographic"` + `phase.rotation`. Supports `aesthetic: "vintage"` for Cold-War / period-atlas register. |
| ProportionalSymbolMap | as needed | Country circles **sized by count data** (fabs, bases, GDP) on Mapbox basemap. Right form when areas mislead — Mercator-fix for ≤12 countries spread across continents. |
| CartogramMap | as needed | **Dorling cartogram** — country circles de-collided via d3-force. Use for **15+ data points in dense regions** (EU-27, sub-Saharan Africa) where ProportionalSymbolMap overlaps illegibly. |
| DensityMap | as needed | **deck.gl point-density** (hex / heatmap / grid) on Mapbox basemap. Use for individual facilities / events (100s of points) where the editorial point is *where they cluster*. Supports bivariate `colorWeight` for size+color independence. |

### Charts / data visualizations — 6 templates · ~15-20% episode share

**Selector doc:** [`remotion-templates/CHART_TEMPLATE_SELECTOR.md`](../../remotion-templates/CHART_TEMPLATE_SELECTOR.md) (wall-table). Cleveland-honesty rules grounded in Tufte + dossier conventions.

**Audit skill:** `chart-audit` — sister to script-audit / visual-concept. Catches truncated y-axes (Tufte cardinal sin), rainbow bars, StatReveal without comparison bars, RadarChart density violations, BayesianUpdate vs. ProbabilityGauge mis-routing.

| Template | Share | Purpose |
|---|---|---|
| DataChart | ~12% | Statistics, comparisons, numerical data. Default for bar / lollipop / dot plot. |
| TimeSeriesChart | as needed | Multi-series line charts over time. Use when the editorial point is "trend." |
| BayesianUpdate | as needed | Probability estimates updated by sequential evidence. The forecast-cascade form. |
| ProbabilityGauge | as needed | Single probability readout with gauge arc. Use for "X% likely" beats. |
| RadarChart | as needed | Multi-axis polygon capability comparison. Use when 4-6 attributes need parity comparison. |
| StatReveal | as needed | Dramatic single-statistic with comparison bars. Use for the "one number that matters" beat. |

### Diagrams / framework / strategic — 10 templates · ~10-15% episode share

**Selector doc:** [`remotion-templates/DIAGRAM_TEMPLATE_SELECTOR.md`](../../remotion-templates/DIAGRAM_TEMPLATE_SELECTOR.md) (wall-table). Largest family with the heaviest sibling-confusion surface — sibling-disambiguation tables for DecisionTree vs. GameBoard, FrameworkDiagram-flow vs. SankeyFlow, comparison vs. matrix vs. DuelingFrameworks.

**Audit skill:** `diagram-audit` — 8-lens audit catching sibling mis-routing, density-cap violations, missing focal hierarchy, invented payoff numbers.

| Template | Share | Purpose |
|---|---|---|
| FrameworkDiagram | ~7% | Conceptual models, comparisons, flows (matrix / comparison / flow variants). |
| NetworkDiagram | as needed | Relationship webs, alliance structures, hub-spoke topologies. |
| DecisionTree | as needed | Branching scenarios, decision points. Use the ladder variant for stacked options. |
| SankeyFlow | as needed | Flow/allocation diagrams (trade, resources, where-the-dollar-goes). |
| GameBoard | as needed | Strategic game theory visualizations (Prisoners' Dilemma matrix, Axelrod tournament). |
| EscalationLadder | as needed | Vertical event sequence with severity indicators. |
| StrategicLandscape | as needed | Position-on-axes strategic frame (e.g., capability vs. intent). |
| ~~BifurcationRoute~~ | DELETED May 13 | Was "two paths diverged" form. Migrate to **DuelingFrameworks** (head-to-head scenarios) or **DecisionTree** (branching with probabilities). Do NOT emit BifurcationRoute in new manifests — the template no longer exists. |
| DuelingFrameworks | as needed | Two opposing frameworks compared side by side. |
| PricingWaterfall | as needed | Value-chain decomposition ($1 of price → segments of cost). |

### Timelines — 4 templates · ~10-12% episode share

**Selector doc:** [`remotion-templates/TIMELINE_TEMPLATE_SELECTOR.md`](../../remotion-templates/TIMELINE_TEMPLATE_SELECTOR.md) (wall-table). TimelineComparison is Parallax's signature form (bounded analogy rendered as visual structure) — the selector grounds it in `project/CONTENT_IDENTITY.md`.

**Audit skill:** `timeline-audit` — 7-lens audit. Especially direct on bounded-analogy mis-routing (HorizontalTimeline used where TimelineComparison is correct dilutes the channel's editorial differentiator).

| Template | Share | Purpose |
|---|---|---|
| TimelineComparison | ~8% | Historical parallels, before/after, "this happened, then this happened." |
| HorizontalTimeline | as needed | Single-axis chronology with phased reveal. |
| DualTimeline | as needed | Two parallel chronologies in stacked tracks. |
| ~~TimelineMorph~~ | DELETED May 13 | Was "one timeline morphing into another" (transformation reveal). Migrate to **HorizontalTimeline** with `mode: "morph"`. Do NOT emit TimelineMorph in new manifests — the template no longer exists. |

### Typography / layout — 6 templates · ~10-15% episode share

**Selector doc:** [`remotion-templates/TYPOGRAPHY_TEMPLATE_SELECTOR.md`](../../remotion-templates/TYPOGRAPHY_TEMPLATE_SELECTOR.md) (wall-table). Grounded in POLISH.md D1-D18 doctrine for TitleTransition chrome rules.

**Audit skill:** `typography-audit` — 8-lens audit. Most consequential checks: KineticTypography vs. TitleTransition register confusion (canonical mistake), KineticTypography quote without attribution, TitleTransition motion entrance.

| Template | Share | Purpose |
|---|---|---|
| KineticTypography | ~8% | Quotes, definitions, bilingual text, key stats. The "make the words the visual" template. |
| TitleTransition | ~5% | Episode/section titles, end cards, kicker → title → subtitle reveals. |
| SplitComposition | as needed | Side-by-side comparisons. |
| ImageComposite | as needed | Brand-treated photo with overlay text. |
| PhotoMontage | as needed | Multi-photo grid with reveal animation. |
| AnnotatedImage | as needed | Image with animated callout labels. |

### Other asset types (not Remotion templates)

These three sit OUTSIDE the Remotion MG layer but are owned by the same visual-spec skill. Detailed editorial logic in [`project/VISUAL_LANGUAGE.md`](../../project/VISUAL_LANGUAGE.md).

| Asset type | Skill section / generator | Selector logic | Audit |
|---|---|---|---|
| **Stock footage** (`[FOOTAGE:]`) | visual-spec Step 6 + `tools/asset-source/source.py` | `FOOTAGE_SOURCING.md` sourcability tiers | visual-concept Lens 2 (likelihood); script-audit Lens 6 (mode balance) |
| **AI illustration** (`[ILLUST:]`) | visual-spec Step 5 + `tools/recraft/recraft.py` | `VISUAL_LANGUAGE.md` Register 2 | visual-concept Lens 6 (register fit) |
| **AI video** (`[AI-GEN:]`) | visual-spec Step 4 + Kling/Sora/Runway briefs | `VISUAL_LANGUAGE.md` Register 3 ("unsourceable spaces only") | visual-concept Lenses 5+6 (tool assignment + register) |

### Map template selection — wall-table

Six map templates with overlapping purposes. **Read this table before assigning any map beat.** Full editorial rationale and failure modes live in `remotion-templates/MAP_TEMPLATE_SELECTOR.md` and the per-template dossiers under `remotion-templates/references/template-research/`.

| If the script beat says... | Use template | Notes |
|---|---|---|
| "X percent / share / rate per country" | **ChoroplethMap** | The default for QUANTITATIVE country fills. Mapbox basemap. |
| "X fabs / bases / billionaires per country" (count, ≤12 countries spread out) | **ProportionalSymbolMap** | Sized circles at centroids. Don't use ChoroplethMap for counts — area distortion misleads. |
| "X people / GDP per country" (count, 15+ countries in a dense region like EU) | **CartogramMap** | Dorling decollision. ProportionalSymbolMap circles would overlap. |
| "Where specific facilities cluster" (100s of points, lat/lon) | **DensityMap** | Hex bins or heatmap. The chip-fab-density story is the canonical case. |
| "Members of NATO / OPEC / Five Eyes" (categorical fills) | **AtlasPlate** (modern) | Flat editorial register; categorical fills don't need quantitative-honesty projections. |
| "In 1962, the Cold War split the world" (period reference) | **AtlasPlate** + `aesthetic: "vintage"` | Tea-stained paper, brown ink, paper grain. Direct fit for historical analogy. |
| "Globe spins from Asia to North America" (cold-open) | **AtlasPlate** + `projection: "orthographic"` + per-phase `rotation: [lon, lat]` | Animated rotation; documented per-frame cost ~9ms so keep these shots ≤10s. |
| "From A to B" / supply chain / military campaign | **RouteAnimation** | Phased arc reveal. |
| "All roads led to Rome" / hub + N destinations | **RouteAnimation** + `radial: { hubIndex }` | Auto-generated segments from hub, bearing-sorted stagger. |
| "Show the disputed line" (Taiwan, S China Sea, Kashmir, Crimea, W Sahara) | Any of the above + `disputedBoundaries: ["tag"]` | Dashed rust line layered over the base map. Curated tags in `src/utils/disputedBoundaries.ts`. |

**Overlay decisions (apply to any map template):**

- **Always add a source `annotation`** at the bottom-right with `hierarchy: "tertiary"`, `emphasis: "mute"`. Every data-bearing map ships with provenance.
- **Add `inset: { show: true }`** when the camera focuses on one continent — the inset globe re-anchors the viewer.
- **Add `graticule: { spacing: 15 }`** when the editorial register wants "atlas plate" (parallels-and-meridians signals coordinate system).
- **Add named-region `annotations` (primary / secondary)** for any feature the narration names — Hsinchu, Strait of Malacca, Sahel. Don't rely on Mapbox's stock labels.

**Failure modes to flag** during visual-spec (do NOT silently generate JSON):

1. **ChoroplethMap for count data** (e.g., "5 fabs in Taiwan, 0 in Iceland"). → switch to ProportionalSymbolMap or DensityMap.
2. **ChoroplethMap for categorical fills** with no `value` / `noData` semantics (all countries have a `fill` and that's it). → switch to AtlasPlate modern.
3. **AtlasPlate modern for a Cold-War-period beat.** → switch to AtlasPlate vintage.
4. **DensityMap with <10 points.** → no aggregation work; use ProportionalSymbolMap.
5. **CartogramMap for globally-spread data** (countries across all continents, no dense region). → use ProportionalSymbolMap.
6. **RouteAnimation with `segments: []` and no `radial` block.** Schema rejects this; you'll fail validation.

## Step 1 — Read the Script

Read the full script file. Pay attention to:

- **Visual mode tags** — `[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]` in the right column. These tell you which entries need Remotion JSON (MG and the MG part of LAYERED), which need Recraft illustration specs (ILLUST), which need footage manifest entries (FOOTAGE and the footage part of LAYERED), and which need AI video generation briefs (AI-GEN).
- **`DIR:` annotations** — direction lines stacked below visual spec lines. These specify camera movement (`cam()`), reveal choreography (`reveal()`), timing (`hold()`), transitions (`cut()`), and mood (`mood()`). Parse these carefully — they become `_direction` blocks in Remotion JSON, camera/mood language in AI-GEN briefs, treatment hints in ILLUST specs, and tint/treatment hints in footage manifests. See DIRECTING_LANGUAGE.md for the full grammar.
- **`PACE:` annotations** — visual density markers (`PACE: urgent`, `PACE: analytical`, `PACE: breathing`) that control visual change rate. Track the current pace as you parse (default: `analytical`, resets at each beat header). When the active pace is non-default (`urgent` or `breathing`), include `"paceProfile": "<pace>"` in the composition's `_direction` block. If no `DIR:` annotations exist but pace is non-default, create a minimal `_direction` block with just `paceProfile`. This feeds `useDirection` → `paceTimingScale`/`paceStaggerScale` so template animations respond to pacing intent. Duration scaling is still handled by `generate_manifest.py` — visual-spec only passes the profile name through.
- **Beat/section structure** — each beat typically needs 3-8 visual segments
- **`[VISUAL: ...]` cues** (older scripts) — the script author's suggestions for what should appear on screen. These are starting points, not final specs. You may add visuals the author didn't suggest if the content calls for it.
- **Data points** — any numbers, percentages, comparisons, or statistics mentioned in narration
- **Quotes** — attributed quotes that deserve a full-screen typography moment
- **Foreign terms** — especially Chinese terms (卡脖子, 举国体制) that should get definition cards
- **Geographic references** — countries, cities, regions that should appear on maps
- **Historical parallels** — any past-present comparison is a timeline candidate
- **Conceptual frameworks** — metaphors or analytical models (chess vs. go, etc.)

If the script uses the older format without mode tags, infer the mode: named Remotion templates → `[MG:]`, `TEMPLATE: FOOTAGE` or `TEMPLATE: IMAGE` → `[FOOTAGE:]`. Flag to the user that mode tags should be added for pacing analysis.

## Step 1.4 — Visual Identity Card Check

Before generating the visual breakdown, check if the episode has a **visual identity card** at `episodes/<slug>/visual-identity.json` (schema: `data/visual-identity.schema.json`). The identity card locks the per-episode cross-register visual decisions in one place — episodeColorEmphasis, default text_treatment, default realism dosage, default treatment ramp, recurring visual motif, transition signature overrides — so that AI-generated content (Registers 2/3) and Remotion analytical layer (Register 1) share coordinated cultural inflection per episode.

**How to use it:**

1. Read `episodes/<slug>/visual-identity.json` if it exists.
2. When emitting AI video briefs (`[AI-GEN:]`) or Recraft illustration specs (`[ILLUST:]`) for shots that don't explicitly specify `text_treatment`, `realism`, or `treatment` in the script's right column, use the identity card's defaults (`defaultTextTreatment`, `defaultRealism`, `defaultTreatment`).
3. When emitting the assembly manifest, set the manifest's root-level `episodeColorEmphasis` field to match the identity card's `episodeColorEmphasis`. This propagates through `theme.ts → getEpisodeColorEmphasis()` to every Remotion template (DataChart, ChoroplethMap, FrameworkDiagram, KineticTypography), keeping the analytical layer's color emphasis coordinated with the AI-generated content's typography emphasis.
4. When emitting AI-GEN briefs that involve animated clips (any shot sent to Kling/Sora/Runway, not Ken-Burned stills), enforce `realism: flat` regardless of the identity card's defaultRealism — the animation-flat rule is load-bearing per VIS-09 and overrides episode defaults for animated content.
5. If the recurring `visualMotif` is specified in the identity card, ensure visual-spec output references it: motif appears in at least the introduction beat (first 2 minutes) and one return beat, with evolution states matching the card's `visualMotif.evolutionStates` array.

**If no identity card exists for the episode:** Flag this to Tiger as a missing artifact. The angle memo (Stage 5) should produce the visual identity card alongside the visual arc decision. Without it, every shot is making cultural-context decisions independently, and per-episode visual unity becomes ad-hoc rather than coordinated.

**Per-shot overrides:** The identity card provides defaults; shots can still override per-segment in the shot list. The card is "what the episode wants by default"; the shot list is "what each specific moment needs."

See `remotion-templates/BRAND.md` → "Per-Episode Color Emphasis" and `project/PROMPT_PREAMBLES.md` → "Block 4" for the editorial rationale.

## Step 1.5 — Concept Registry Check

Before creating the visual breakdown, run a concept reuse check against the **Concept Registry** (`data/concepts.json`). This registry tracks every framework, foreign term, named concept, and historical analogy introduced across all Parallax episodes.

**How to check:**
1. Read `data/concepts.json`
2. Scan the script for any term, concept, or framework that already exists in the registry but was introduced in a *prior* episode
3. For each match, note the concept's `callbackVisual` field — this is the suggested visual treatment for a reference (not a re-introduction)

**Why this matters:** The channel's compounding value depends on returning viewers recognizing recurring concepts. When a concept was introduced with a cold-intro in a prior episode, re-introducing it from scratch wastes time and insults returning viewers. Instead, use a **callback** — a brief (2-3s) visual flash that reminds viewers of the concept without re-explaining it. New viewers still get enough context from the narration.

**Three outcomes per concept:**

| Situation | Action |
|-----------|--------|
| Concept is NEW (not in registry) | Generate a full cold-intro visual. After generating, note it as a candidate to add to the registry. |
| Concept was introduced in a PRIOR episode | Use the `callbackVisual` treatment from the registry. Flag it in the breakdown table with a 🔄 marker. |
| Concept was introduced in THIS episode (earlier beat) | No callback needed — just ensure visual consistency with the introduction. |

**After generating files**, output a "Registry Update" section listing:
- New concepts that should be added to `data/concepts.json` (with suggested fields)
- Existing concepts that got a new appearance (with the episode, beat, and role)

The human or a follow-up tool call will update the registry.

**CLI shortcut:** If available, you can run `python tools/concepts/lookup.py reuse-check <EPID> --script <path> --json` to get a machine-readable list of prior concepts detected in the script.

## Step 2 — Create the Visual Breakdown

Before writing any JSON or footage manifest, produce a visual breakdown table. This is the planning step — it maps every visual moment in the script to a mode, a tool, and an output file.

Format it as a markdown table:

```
| Timecode | Script Moment | Mode | Register | Template/Tool | Output File | Direction | Notes |
|----------|--------------|------|----------|---------------|-------------|-----------|-------|
| 0:00 | Episode open | MG | Analytical | TitleTransition | title-episode.json | hold(2s) | episode-title variant |
| 0:10 | Arizona desert | FOOTAGE | — | Stock video | footage-manifest.json #1 | mood(subtle, drift:slow) | "Arizona desert aerial" · P3 |
| 0:25 | TSMC Arizona fab | MG | Analytical | ChoroplethMap | choropleth-reshoring.json | cam(wide→tight:Taiwan, sync:"single island") reveal(sequential) hold(breathe) cut(color-wash, ink) | US highlighted · P1 |
| 0:45 | "7% of US demand" | LAYERED | Mixed | Stock + KineticTypo | footage-manifest.json #2 + kinetic-7pct.json | reveal(count-up, sync:"seven percent") | stat over desert footage |
| 1:10 | Cleanroom interior | AI-GEN | Grounding | Kling 3.0 | ai-brief-fab-walkthrough.json | cam(push-in, over:7s) mood(dense, particles:15) cut(dissolve) | mannequin workers |
| 1:30 | The trap tightens | ILLUST | Atmospheric | Recraft | illust-dependency-vise.json | mood(dense, dim:0.4) hold(2s) cut(iris) | metaphor mode · conflict |
| ... | ... | ... | ... | ... | ... | ... | ... |
```

The **Direction** column captures all `DIR:` annotations for each segment. Segments without `DIR:` lines get an empty direction column — they'll use template defaults. The breakdown table is where you verify that direction density is appropriate (~25% of segments directed).

After the table, include a **visual mode summary** with register annotations:
```
MG: 14 entries (~42% screen time) [Register 1: Analytical]
FOOTAGE: 10 entries (~30% screen time) [register-neutral]
ILLUST: 4 entries (~10% screen time) [Register 2: Atmospheric]
AI-GEN: 3 entries (~8% screen time) [Register 3: Grounding]
LAYERED: 3 entries (~5% screen time) [mixed]
TRANSITION: 5 entries (~5% screen time)
```

Check against target ranges from SCRIPT_FORMAT.md: MG 40-55%, FOOTAGE 25-40%, ILLUST 5-15%, AI-GEN 5-15%, LAYERED 5-10%. Also check:
- All three registers are represented (Analytical, Atmospheric, Grounding)
- No more than 3 consecutive same-register entries without a break
- AI-GEN > 15% → too much photorealistic content, some may work as footage
- ILLUST > 15% → too much atmospheric art, viewer fatigue
- Either register completely absent → visual texture flattens
- More than 2 consecutive AI-GEN or ILLUST entries → pacing violation, insert mode switch
- Register transitions follow the canonical grammar from `project/TRANSITION_GRAMMAR.md` (color-wash, dissolve, match-cut, fade, iris) — `blur-through` is deprecated, never emit it

Guidelines for the breakdown:
- Every beat should start with a section title card (TitleTransition, section variant)
- Don't over-specify — not every sentence needs its own visual. Group related narration under one visual.
- A visual segment typically covers 15-45 seconds of narration
- The episode should open with an episode-title card and close with an end-card
- Aim for 30-45 total visual segments per 15-20 minute episode (this includes footage, not just MG)
- No more than 3 consecutive MG entries without a non-MG break (FOOTAGE, ILLUST, or AI-GEN)
- No more than 2 consecutive AI-GEN or ILLUST entries without a mode switch
- No more than 30 seconds of continuous FOOTAGE without a visual change
- LAYERED entries should be brief (3-8s) with simple MG overlays
- AI-GEN entries should be 5-10 seconds each (consistency degrades past 12s)
- ILLUST entries should be 4-8 seconds (atmospheric moments don't need long holds)
- Prioritize the visual that best serves comprehension, not the most impressive one
- AI-GEN is for unsourceable physical spaces — if stock footage exists, use FOOTAGE
- ILLUST is for emotional/conceptual texture — if the viewer needs to *read* information, use MG

Present the breakdown to the user and ask for approval before generating files. This is the checkpoint — it's much easier to restructure the plan now than to rewrite JSON files and re-source footage later.

## Step 3 — Generate JSON Data Files

After the user approves (or modifies) the breakdown, generate the JSON files.

**Before writing any JSON, read `references/template-schemas.md`** — it contains the exact field definitions, example structures, color codes, and coordinate lookups for every template type. Following those schemas precisely is essential because the Remotion components parse these fields directly.

### File naming convention
```
data/episodes/epXX/<template-type>-<descriptive-slug>.json
```
Examples:
- `choropleth-supply-chain.json`
- `timeline-oil-chips.json`
- `kinetic-morris-chang.json`
- `chart-lithography-passes.json`
- `title-episode.json`
- `title-section-beat2.json`
- `framework-chess-go.json`
- `route-chip-supply.json`

### Generating `_direction` blocks from `DIR:` annotations

When a visual segment has `DIR:` annotations in the script, translate them into a `_direction` namespace within the JSON data file. This is the bridge between the script's directing intent and the Remotion `useDirection` hook.

**Translation process:**

1. **Parse** each `DIR:` line into directive type + parameters using the formal grammar from DIRECTING_LANGUAGE.md
2. **Identify the camera system** based on template type:
   - ChoroplethMap, RouteAnimation → **geographic** (center/scale/duration)
   - NetworkDiagram, EscalationLadder, DataChart, GameBoard, DecisionTree → **canvas** (cameraPath array)
   - HorizontalTimeline → **scroll** (scrollTo offset)
   - [AI-GEN:] entries → **scene brief** (natural language camera note — handled in Step 5)
3. **Validate** that the template supports the directive (see DIRECTING_LANGUAGE.md template support matrix). Unsupported directives → emit a `// DIR-WARN` comment and omit from `_direction`
4. **Resolve conflicts** — if `cam()` provides camera positions, remove per-phase camera fields from the content data (direction overrides content)
5. **Translate** shorthand to JSON fields:

| Directive | JSON fields |
|-----------|------------|
| `cam()` | `cameraPath[]` (canvas), phase center/scale (geographic) |
| `reveal()` | `revealMode`, `staggerMs`, `spotlightSequence`, `highlightIndex`, `progressive`, `revealEasing` |
| `hold()` | `holdAfter`, `holdBehavior`, `preDelay`, `narrationGate` |
| `cut()` | `transitionOut`, `washColor`, `transitionDuration` |
| `mood()` | `atmosphere`, `ambientParticles`, `driftPreset`, `globalDim`, `backgroundTint` |

**Transition selection for `cut()` directives** — the implicit-default engine in `apply_default_transitions()` handles most seams (within-beat → cut; beat-boundary → dissolve; title cards → fade pair). Only emit an explicit `cut()` when the default is editorially wrong. When you do override, match the transition to the editorial relationship per `project/TRANSITION_GRAMMAR.md`:
- **Seam crosses a civilizational-rupture moment** (rare, ≤2 per episode): `DIR: cut(iris)`
- **Register shift** (entering a new editorial mode): `DIR: cut(color-wash, ink)` — always include the color token
- **Match-cut opportunity** (same subject, different scale — historical-analogy seam): `DIR: cut(match-cut)` or `DIR: cut(match-cut-still)` for composition-locked templates
- **Chapter / silence beat** (time-jump, memorial, end of act): `DIR: cut(fade)` paired with `DIR: hold(stillness)` on the prior segment
- **Never emit**: `wipe-left`, `wipe-right`, `wipe-up`, `blur-through`, `whip-pan`, `spatial-zoom` — all deprecated (M-TRANSITION-DEPRECATED lint error)

6. **Merge** all fields into a single `_direction` object within the data file
7. **Set `proportional: true`** — camera path durations should be fractions of total composition time (0.0–1.0), not absolute seconds. This makes camera movements duration-adaptive — the same rhythm works whether narration runs 8 or 18 seconds. See PACING_SYSTEM.md.
8. **Include `paceProfile`** — if the active PACE at this composition's script position is non-default (`urgent` or `breathing`), add `"paceProfile": "<pace>"` to the `_direction` block. This feeds `useDirection` → `paceTimingScale` so template entrance animations scale accordingly (urgent: 0.7× faster, breathing: 1.4× slower). Omit for `analytical` (it's the default).

**Example — ChoroplethMap with direction (proportional camera):**
```json
{
  "episode": "silicon-trap",
  "title": "Supply Chain Concentration",
  "phases": [
    { "title": "Phase 1", "countries": ["United States"], "color": "#4A7BA7", "durationSec": 4 },
    { "title": "Phase 2", "countries": ["Taiwan"], "color": "#A64D46", "durationSec": 4 }
  ],
  "_direction": {
    "proportional": true,
    "cameraPath": [
      { "center": [0, 20], "scale": 150, "duration": 0.45 },
      { "center": [121.5, 25.0], "scale": 400, "duration": 0.35, "syncWord": "single island" },
      { "center": [121.5, 25.0], "scale": 400, "duration": 0.2 }
    ],
    "syncWords": ["single island"],
    "revealMode": "sequential",
    "phaseStagger": 3.0,
    "revealEasing": "settle",
    "holdAfter": 2.0,
    "holdBehavior": "breathe",
    "atmosphere": "subtle",
    "transitionOut": "color-wash",
    "washColor": "#1C1814"
  }
}
```

**Example — DataChart with direction (proportional camera):**
```json
{
  "episode": "silicon-trap",
  "title": "Chip Yield Comparison",
  "bars": [...],
  "_direction": {
    "proportional": true,
    "revealMode": "stagger",
    "staggerMs": 300,
    "highlightIndex": 0,
    "revealEasing": "pulse",
    "cameraPath": [
      { "target": "overview", "zoom": 1.0, "duration": 0.45, "behavior": "track" },
      { "target": "element:0", "zoom": 1.3, "duration": 0.35, "behavior": "track", "syncStart": "ninety-two" },
      { "target": "element:0", "zoom": 1.3, "duration": 0.2 }
    ],
    "syncWords": ["ninety-two"],
    "holdAfter": 1.0,
    "holdBehavior": "land"
  }
}
```

**Proportional duration guidelines:**
- Durations MUST sum to 1.0 (or very close — within ±0.01)
- Typical rhythm: 40-50% on the opening view, 30-40% on the key movement, 15-25% on the hold/detail
- Include a final "hold" step at the end position — prevents abrupt camera stops
- The system auto-detects proportional mode when durations sum ≤1.01, but always set `proportional: true` explicitly for clarity

**Fallback rule:** If no `DIR:` annotations exist for a segment AND pace is `analytical` (default), do NOT emit a `_direction` block. The template's built-in defaults apply. However, if pace is non-default (`urgent` or `breathing`) but there are no `DIR:` annotations, emit a minimal `_direction` block with just `paceProfile`:
```json
"_direction": { "paceProfile": "urgent" }
```
This ensures template animations respond to pacing intent even without explicit direction.

### Text-animation register (`_direction.textAnimation`)

For text-bearing templates — `KineticTypography` and `StatReveal` — you also pick a *text-animation register* that determines HOW the text reveals (typewriter vs word-cascade vs ticker vs etc.). The full vocabulary, editorial register, and per-technique use/avoid rules live in **`project/TEXT_ANIMATION_REGISTER.md`** — read that doc first. This section gives you the dispatch rules.

**Selection rule by template + variant:**

| Template | Variant / shape | When to emit | Set `textAnimation` to |
|---|---|---|---|
| KineticTypography | `variant: "quote"` WITH a real named `attribution` (Nash, Morris Chang, Schmidt, Schelling, Sullivan, etc.) | Always | `"quote-attribution"` |
| KineticTypography | `variant: "quote"` with channel-voice text (no named attribution, or `attribution` is "Checkpoint" / editorial framing) | NEVER — leave unset | `(omit)` — falls back to word-cascade default |
| KineticTypography | `variant: "definition"` introducing a term + pinyin + translation (foreign-term moments: 卡脖子, 举国体制) | Always | `"definition-reveal"` |
| KineticTypography | `variant: "statistic"` with a hero stat value | Always | `"stat-caption"` |
| KineticTypography | `variant: "bilingual"` (paired language display) | Leave unset for now | `(omit)` — no composite pattern yet |
| StatReveal | (any data) | Never needed | `(omit)` — StatReveal already uses the canonical ticker internally as of Phase 1 |

**Archival vs modern quote distinction.** The `quote-attribution` composite has an `archival` flag (renders in Plex Mono rather than Plex Sans display) — but it's set INTERNALLY by KineticTypography based on the `attributionContext`. As of Phase 1, archival mode is selected by KineticTypography when the context contains words like "1950", "1952", or document references (RAND RM-..., declassified, etc.). You don't need to emit it yourself; you just set `textAnimation: "quote-attribution"` and let KineticTypography pick the register.

**Concept callbacks (`_direction.isCallback`).** This is a separate per-segment flag, distinct from `textAnimation`. Set `"isCallback": true` when:
1. The segment renders a term from `data/concepts.json` (`KineticTypography variant="definition"` is the typical case), AND
2. That term has an `introduced.episode` value that is a DIFFERENT, EARLIER episode than the current one (cross-episode recurrence)

To check this:
- Look up `data/concepts.json` for an entry whose `term.cn`, `term.en`, or `term.pinyin` matches the term being rendered
- If found, compare `concept.introduced.episode` to the current episode slug
- If introduced earlier and now recurring → `isCallback: true`
- If introduced in the CURRENT episode (first introduction) → omit / `false`

Phase 1 status: KineticTypography reads `_direction.isCallback` and wires it through `<DefinitionReveal isCallback={...}>` to fire the cross-episode pulse. The concept registry is the authority on the cross-episode state; visual-spec is the authority on encoding that into JSON.

**Examples:**

A Morris Chang quote in silicon-trap:
```json
{
  "episode": "silicon-trap",
  "variant": "quote",
  "text": "Globalization is almost dead. Free trade is almost dead.",
  "attribution": "Morris Chang",
  "attributionContext": "TSMC Founder, 2022",
  "_direction": {
    "textAnimation": "quote-attribution"
  }
}
```

A 卡脖子 definition in silicon-trap (first introduction — NOT a callback):
```json
{
  "episode": "silicon-trap",
  "variant": "definition",
  "term": "卡脖子",
  "termPinyin": "kǎ bózi",
  "termTranslation": "Stranglehold technology",
  "_direction": {
    "textAnimation": "definition-reveal"
  }
}
```

A 卡脖子 definition in a LATER episode (callback to silicon-trap introduction):
```json
{
  "episode": "future-episode-slug",
  "variant": "definition",
  "term": "卡脖子",
  "termPinyin": "kǎ bózi",
  "termTranslation": "Stranglehold technology",
  "_direction": {
    "textAnimation": "definition-reveal",
    "isCallback": true
  }
}
```

A hero stat in silicon-trap:
```json
{
  "episode": "silicon-trap",
  "variant": "statistic",
  "statValue": "$165B",
  "statLabel": "total semiconductor investment",
  "_direction": {
    "textAnimation": "stat-caption"
  }
}
```

**Anti-patterns** (don't do these):

- Setting `textAnimation: "typewriter"` on a channel-voice statement. Typewriter implies *transcribed* text — the channel doesn't transcribe its own narration. Leave the field unset.
- Setting `textAnimation: "number-ticker"` on a year, date, or label number. Tickers imply *arrived-at* values; years and dates are labels.
- Setting `textAnimation: "scramble"` more than once or twice per episode. Scramble is editorial-archival ("classified → declassified" register); using it for every label drifts to spy-thriller register.
- Setting `textAnimation` on segments that don't render text choreography (charts, maps, diagrams). The field is ignored on those templates.

### Quality checklist for each file

- [ ] Valid JSON (no trailing commas, proper quoting)
- [ ] `episode` field matches the episode ID
- [ ] Colors use the design system palette (see schemas reference)
- [ ] Country names match TopoJSON conventions (full names, not abbreviations)
- [ ] Coordinates are `[longitude, latitude]` (not the reverse)
- [ ] `durationSec` is reasonable (3-8 seconds for most visuals, up to 12 for dense ones)
- [ ] Text is concise — these are on-screen labels, not paragraphs
- [ ] Statistics are accurate to what the script says (don't invent numbers)
- [ ] Source attributions included where the script mentions sources
- [ ] `_direction` block present for segments with `DIR:` annotations or non-default PACE
- [ ] `_direction` fields match the directive syntax exactly (no invented fields)
- [ ] `paceProfile` included in `_direction` for all compositions in urgent/breathing zones
- [ ] `syncWord` values appear in the segment's narration text
- [ ] `cam()` targets are valid for the template's camera system
- [ ] `reveal()` mode is supported by the template (see template support matrix)
- [ ] No conflicting camera data between content fields and `_direction.cameraPath`

### FilmOverlay preset selection (usually nothing to do)

The `[OVERLAY: preset]` script tag exists but is **rarely needed**. The per-segment FilmOverlay cascade auto-resolves the preset for every segment from its `[BACKDROP: id]` choice and template kind (see `remotion-templates/CLAUDE.md` → FilmOverlay cascade for the 5-level chain). Each backdrop in `backdrop-manifest.json` declares its own `recommendedPreset` — choosing the right backdrop already chooses the right film texture.

When to actually use `[OVERLAY: preset]`:

- The cascade-resolved preset doesn't match the editorial register the segment needs. Example: a `StatReveal` on `night-grid` (both cascade to `clean`) for an editorial peak that should land cinematic — annotate `[OVERLAY: cinematic]`.
- The segment uses a backdrop whose tone differs from the moment's editorial weight. Example: a `dramatic` revelation atop `cartographic` paper (which would otherwise resolve to `clean`).

Otherwise: omit. The cascade is the default for a reason — it keeps script density low and lets backdrop choice carry the visual register.

Note: the whole FilmOverlay system is gated on episode-level `manifest.filmOverlay` being present. If the episode hasn't opted in, `[OVERLAY:]` tags are preserved through to the manifest but ignored at render time.

### Content principles

**Accuracy over aesthetics.** Every number, every quote, every claim in the JSON must match what the script says. If the script says "roughly eighty percent," the visual can say "~80%" but not "78%" unless that specific number is sourced.

**Semantic color coding.** Use the design system colors consistently:
- US/Western actions → blue (#4A7BA7)
- China/Eastern actions → red (#A64D46)  
- Neutral/structural → gray (#888780)
- Emphasis/call-out → amber (#F5A623)
- Blocked/denied → danger red (#A64D46)

**Bilingual awareness.** This is a bilingual channel. When Chinese terms appear in the script, create definition cards with pinyin and translation. When a concept has both English and Chinese framing, consider a bilingual typography card.

**Phase design for maps.** Don't dump all countries into one phase. Build the story: start with the key players, then expand to show allies, then show countries caught in between. Each phase should have a clear narrative beat that matches the narration.

**Duration calibration.** Read the section of narration that accompanies each visual and estimate how long it takes to speak at ~150 words per minute. The visual's `durationSec` should roughly match the narration time for that segment, plus 1-2 seconds of breathing room.

## Step 3.5 — Generate Recraft Illustration Specs (Register 2: Atmospheric)

For every `[ILLUST:]` entry in the breakdown, produce a prompt spec. These drive `tools/recraft/recraft.py`.

### File naming convention
```
data/episodes/<slug>/illust-<descriptive-slug>.json
```

### Prompt spec format
```json
{
  "id": "illust-dependency-vise",
  "episode": "silicon-trap",
  "beat": 2,
  "mode": "metaphor",
  "prompt": "Technological dependency as a tightening mechanical vise — factory skyline trapped in industrial jaws, workers as anonymous silhouettes streaming through narrow passage, constructivist poster composition with strong diagonal tension",
  "style": "vector_illustration",
  "treatment": "conflict",
  "durationSec": 6,
  "composite": "background @ 40%",
  "narrative_context": "Narration describes how cheap technology creates invisible lock-in",
  "emotional_target": "claustrophobia, inevitability, systemic pressure",
  "transition_in": "dissolve from MG",
  "transition_out": "iris to next MG",
  "_direction": {
    "atmosphere": "dense",
    "globalDim": 0.4,
    "holdAfter": 2.0,
    "transitionOut": "iris"
  }
}
```

**Direction integration for ILLUST specs:** When the script has `DIR:` lines on an `[ILLUST:]` entry, the relevant directives flow into the spec:
- `mood()` → `atmosphere` and `globalDim` in `_direction` (also influences `treatment` selection — `mood(dense)` pairs naturally with `conflict` treatment)
- `hold()` → `holdAfter` in `_direction`
- `cut()` → `transition_out` field AND `transitionOut` in `_direction`
- `cam()` and `reveal()` are not supported on ILLUST (static images) — emit a DIR-WARN if present
```

### Recraft prompt principles

**Emotion over information.** These illustrations create *feeling*, not data. The viewer should sense dread, grandeur, tension, or awe — not read labels or numbers. If you catch yourself putting text or specific data in the prompt, it belongs in `[MG:]` instead.

**Constructivist DNA.** The brand aesthetic for atmospheric illustrations draws from Soviet constructivism + cyberpunk + propaganda posters. Key elements: strong diagonals, anonymous figures, industrial/mechanical metaphors, geometric compression, stark light/shadow contrast.

**Available modes** (maps to `recraft.py --mode`):
- `metaphor` — Abstract concepts made visual through physical metaphors (trap, vise, maze, flood)
- `illustration` — Editorial scenes, geopolitical landscapes, architectural dystopia
- `diagram` — Stylized system schematics (use sparingly — most diagrams belong in Remotion)
- `icon` — Symbolic representations for sequences

**Available styles** (maps to `recraft.py --style`):
- `vector_illustration` — Default for metaphor and illustration modes
- `flat_2.0` — Cleaner, more geometric, good for diagram mode
- `pictogram` — Icon style, minimal detail

**Treatment selection** (maps to `recraft.py --treat`):
- `standard` (ink → bronze → amber) — Default. Analytical tension, controlled unease.
- `conflict` (ink → oxblood → rust) — Geopolitical friction, danger, high stakes.
- `editorial` (dark bone → light bone) — Reflective, institutional, archival mood.

**Prompt length:** 30-60 words. Be specific about composition and mood, not fine detail.

### Quality checklist for illustration specs

- [ ] Prompt describes mood/composition, NOT data or text
- [ ] Mode matches the visual intention
- [ ] Treatment matches the emotional register of the accompanying narration
- [ ] Duration is 4-8 seconds (atmospheric moments don't need long holds)
- [ ] Transitions respect the canonical grammar (color-wash, dissolve, match-cut, fade, iris) — no deprecated types (`blur-through`, `wipe-*`, `whip-pan`, `spatial-zoom`)
- [ ] The illustration adds something footage and MG cannot — if a stock aerial shot would work equally well, use footage instead

### Batch output

After generating all individual specs, also compile an `illust-manifest.json` that lists all illustration specs for batch generation:
```json
{
  "episode": "silicon-trap",
  "illustrations": [
    { "$ref": "illust-dependency-vise.json" },
    { "$ref": "illust-surveillance-panopticon.json" }
  ]
}
```

This feeds into: `python tools/recraft/recraft.py batch data/episodes/<slug>/illust-manifest.json --output assets/ --treat standard`

## Step 4 — Generate Footage Manifest

For every `[FOOTAGE:]` and `[LAYERED:]` entry in the breakdown, produce a footage manifest file at:
```
data/episodes/epXX/footage-manifest.json
```

The footage manifest is an array of footage needs, each with:

```json
{
  "id": 1,
  "beat": "Beat 1",
  "mode": "FOOTAGE",
  "priority": "P2",
  "description": "Arizona desert aerial establishing shot",
  "searchTerms": [
    "Arizona desert aerial drone",
    "southwest US desert landscape aerial",
    "desert construction site aerial"
  ],
  "platforms": ["Pexels", "Storyblocks"],
  "sourcability": "Easy",
  "treatment": "standard",
  "composite": "background @ 35%",
  "durationSec": 10,
  "notes": "Slow zoom. Ambient texture under narration about TSMC Arizona.",
  "layeredWith": null,
  "_direction": {
    "atmosphere": "subtle",
    "driftPreset": "slow",
    "holdAfter": 0,
    "transitionOut": "cut"
  }
}
```

**Direction integration for footage:** When the script has `DIR:` lines on a `[FOOTAGE:]` entry:
- `mood()` → `_direction.atmosphere`, `_direction.driftPreset`, `_direction.globalDim`, `_direction.backgroundTint` (tint influences `treatment` selection — `tint:oxblood` suggests `conflict` treatment)
- `hold()` → `_direction.holdAfter` (extra time the footage holds before the next segment)
- `cut()` → `_direction.transitionOut` (how this footage ends)
- `cam()` and `reveal()` are not supported on footage — emit DIR-WARN if present
```

For `[LAYERED:]` entries, fill in `layeredWith` with the corresponding MG JSON filename:
```json
{
  "id": 5,
  "mode": "LAYERED",
  "priority": "P1",
  "description": "Cleanroom footage under '92% YIELD' stat",
  "searchTerms": ["semiconductor cleanroom wafer handling", "chip fabrication cleanroom", "cleanroom workers"],
  "platforms": ["Pexels", "Storyblocks"],
  "sourcability": "Moderate",
  "treatment": "standard",
  "composite": "background @ 40%",
  "durationSec": 6,
  "notes": "MG overlay is a simple stat card. Footage should be visually calm — no fast action.",
  "layeredWith": "kinetic-92pct-yield.json"
}
```

### Sourcability ratings

Rate each footage entry using FOOTAGE_SOURCING.md's tiers:
- **Easy** — abundant on free platforms and Storyblocks (cityscapes, generic tech, nature, shipping)
- **Moderate** — available with effort or specific keywords (cleanrooms, Chinese cities, military hardware)
- **Hard** — needs archival purchase, creative workaround, or acceptance of stills (named individuals, specific facilities, historical events)

For "Hard" entries, include a fallback plan in the `notes` field: what to use if the ideal footage can't be found.

### Search term quality

Search terms should be ranked most specific → most generic. The sourcing tool (`source.py`) tries them in order. Bad search terms waste API calls and return irrelevant results. Apply the stock photographer test: would someone actually have filmed this?

### The footage manifest feeds downstream tools

- `source.py` reads the manifest and searches free platforms automatically
- The asset-source skill uses it for scoring and ranking candidates
- Manual sourcing (archival, premium) uses it as a shopping list
- The assembly manifest generator uses it to map footage to timeline positions

## Step 5 — Generate AI Video Briefs

For every `[AI-GEN:]` entry in the breakdown, produce individual brief files at:
```
tools/ai-video/briefs/epXX/<slug>.json
```

Each AI video brief specifies everything needed to generate the clip:

```json
{
  "id": "ep01_beat2_fab_walkthrough",
  "episode": "EP01",
  "beat": "Beat 2",
  "priority": "P1",
  "useCase": "unsourceable_space",
  "register": "grounding",
  "realism": "flat",
  "text_treatment": "chinese_propaganda",
  "scene": {
    "description": "Interior of an advanced semiconductor cleanroom. Yellow lithography lighting. Three workers in full bunny suits operating wafer handling equipment. FOUP carriers on automated track in background. Bold heiti propaganda typography integrated diagonally with the architecture.",
    "environment": "Semiconductor fabrication cleanroom, advanced node (sub-5nm implied by equipment density)",
    "figures": "Three workers in white bunny suits with reflective polycarbonate face shields. Faces composed of 4-5 color-blocked planes (jaw, cheekbone, brow, lit, neck), eyes obscured by amber visor reflection. Hands flat color planes only, no individual finger detail. Natural body movement — operating equipment with practiced ease.",
    "period": "contemporary",
    "mood": "Precision, sterility, quiet intensity. The hum of advanced technology."
  },
  "camera": {
    "movement": "Slow forward dolly through the space",
    "lens": "35mm equivalent (constructivist composition, not photographic lens)",
    "angle": "Medium wide, hip level",
    "depthOfField": "Constructivist depth — foreground subjects in sharp color blocks, background slightly receded through atmospheric perspective",
    "style": "Constructivist documentary observational — feels like a Rodchenko photomontage of rare access"
  },
  "generation": {
    "tool": "kling-3.0",
    "mode": "image-to-video",
    "styleReference": "style-ref_industrial_cleanroom-flat_v1.png",
    "durationTarget": 7,
    "resolution": "4K",
    "fps": 30,
    "referenceFramePrompt": "[Composed via tools/recraft/recraft.py with --register grounding --realism flat --text-treatment chinese_propaganda. Reference frames generated by Recraft V3 since the constructivist aesthetic is its strength; Flux 2 Pro only for hero P1 frames needing photographic spatial detail at realism: grounded.]"
  },
  "treatment": "standard",
  "narrationContext": "The narration describes TSMC's fabrication process and the extreme precision required. This visual grounds the abstract discussion in physical reality.",
  "editorialGuardrails": [
    "No identifiable facility branding or signage",
    "Faces must remain planar color-blocked throughout — reject if continuous skin tonality leaks in or features render photographically",
    "Equipment should be plausible constructivist abstractions of real fab tools, not claim to be specific TSMC machinery",
    "Chinese propaganda typography must use real Simplified Chinese characters — Tiger to verify before render",
    "This visualizes 'what a space like this looks like' — not 'this is TSMC Arizona'"
  ],
  "qualityGate": {
    "faceCheck": "Faces remain planar color-blocked throughout clip duration; no skin tonality drift; eyes stay obscured by visor reflection",
    "environmentCheck": "Equipment and space remain consistent (no morphing)",
    "lightingCheck": "Yellow lithography light maintained without color shifts",
    "motionCheck": "Camera movement smooth, no jitter or sudden accelerations",
    "typographyCheck": "Chinese characters remain real and parseable; no mock-script drift"
  }
}
```

### AI Brief Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique slug: `epXX_beatN_description` |
| `episode` | Yes | Episode ID |
| `beat` | Yes | Which beat in the script |
| `priority` | Yes | P1 (hero visual), P2 (supporting), P3 (ambient) |
| `useCase` | Yes | One of: `unsourceable_space`, `historical_reconstruction`, `conceptual_scene`, `scenario_sequence` |
| `register` | Yes | One of: `atmospheric` (background mood), `grounding` (figurative scenes), `analytical` (rare diagrammatic). See VISUAL_LANGUAGE.md. |
| `realism` | Yes | One of: `flat`, `balanced`, `grounded`. **MUST be `flat` for any clip that will be animated to video** — animation drift is severe at higher realism dosages. Use `grounded` only for stills that will be Ken-Burned. See PROMPT_PREAMBLES.md. |
| `text_treatment` | Yes | Typography tradition matched to the scene's geography/era. One of: `none`, `english_minimal`, `english_modernist`, `russian_constructivist`, `chinese_propaganda`, `chinese_minimal`, `chinese_traditional`, `japanese_showa`, `mixed`. See TYPOGRAPHY_TRADITIONS.md. |
| `scene.description` | Yes | Full scene description (what appears on screen) |
| `scene.environment` | Yes | The space/setting |
| `scene.figures` | Yes/No | Human figures if present. Always specify constructivist planar features (4-5 color-blocked planes), eyes obscured, hands as flat color planes. Omit if no people. |
| `scene.period` | Yes | `contemporary`, `1940s`, `1960s`, `1990s`, `near-future`, etc. |
| `scene.mood` | Yes | Emotional/atmospheric tone |
| `camera.movement` | Yes | How the camera moves (dolly, pan, static, tracking) |
| `camera.lens` | Yes | Focal length equivalent (24mm wide → 85mm portrait) |
| `camera.angle` | Yes | Shot type and height |
| `camera.depthOfField` | Yes | Shallow / deep / medium |
| `camera.style` | Yes | Documentary, cinematic, surveillance, observational |
| `generation.tool` | Yes | `kling-3.0` (default), `seedance-2.0` (budget/narrative), `sora-2` (multi-angle), `runway-gen4` (character consistency) |
| `generation.mode` | Yes | `image-to-video` (default), `storyboard` (Sora multi-shot), `text-to-video` |
| `generation.styleReference` | Yes | Filename from `tools/ai-video/style-references/` |
| `generation.durationTarget` | Yes | Seconds (5-10 recommended) |
| `generation.resolution` | Yes | `4K` or `1080p` |
| `generation.fps` | Yes | 30 (default) or 60 (slow-motion source) |
| `generation.referenceFramePrompt` | Yes | Auto-generated Flux 2 Pro prompt following `tools/ai-video/PROMPT_SYSTEM.md` best practices (front-loaded subject, natural prose, camera specs, specific lighting, 50-70 words, positive phrasing only) |
| `treatment` | Yes | `standard`, `conflict`, or `editorial` |
| `narrationContext` | Yes | What the viewer is hearing during this clip (helps with mood calibration) |
| `editorialGuardrails` | Yes | Array of constraints specific to this scene |
| `qualityGate` | Yes | Verification checks for render-qa to apply |

### Use Case → Tool Selection Guide

| Use Case | Default Tool | Reason |
|----------|-------------|--------|
| `unsourceable_space` | Kling 3.0 (image-to-video) | Best environment quality, native 4K |
| `historical_reconstruction` | Kling 3.0 (image-to-video) | Period details + editorial LUT treatment |
| `conceptual_scene` | Kling 3.0 (image-to-video) | Conceptual metaphors need strong environment rendering |
| `scenario_sequence` | Sora 2 (storyboard) | Future scenarios often need multiple angles of same space |
| Multi-angle sequence | Sora 2 (Director Mode) | Re-shoot same scene from different angles |
| Same figure, multiple shots | Runway Gen-4 | Best character identity lock across clips |
| Budget/volume clips (P3) | Seedance 2.0 (image-to-video) | 5x cheaper than Kling, good for ambient/supporting shots |
| Narrative sequence w/ audio | Seedance 2.0 | Native audio sync, 12-input consistency anchoring |

### Use Case → Style Reference Guide

| Use Case | Primary Reference | Notes |
|----------|------------------|-------|
| Tech/semiconductor facility | `style-ref_interior_cleanroom-warm_v1.png` | Warm yellow lighting |
| Military/adversarial space | `style-ref_interior_command-cool_v1.png` | Cool blue, conflict LUT |
| Historical government/diplomatic | `style-ref_interior_historical-gov_v1.png` | Period furnishings, editorial LUT |
| Figure-centric scene | `style-ref_figure_suit-walking_v1.png` | Body/motion quality |
| Wide establishing/aerial | `style-ref_aerial_urban-development_v1.png` | Scale + environment |
| Conceptual/metaphor space | `style-ref_concept_corridor-splitting_v1.png` | Surreal-but-plausible |

### Sora 2 Storyboard Brief (multi-shot variant)

When a segment needs multiple angles of the same space (e.g., wide → medium → detail), use the storyboard format:

```json
{
  "id": "ep01_beat5_smic_facility",
  "generation": {
    "tool": "sora-2",
    "mode": "storyboard",
    "styleReference": "style-ref_interior_cleanroom-warm_v1.png",
    "durationTarget": 15,
    "frames": [
      {
        "keyframe": 1,
        "description": "Wide shot of semiconductor facility exterior — modern white buildings, construction cranes, desert landscape",
        "camera": "Aerial, slowly descending"
      },
      {
        "keyframe": 2,
        "description": "Medium shot of facility entrance — glass doors, security checkpoint, figure in lab coat approaching",
        "camera": "Eye level, static"
      },
      {
        "keyframe": 3,
        "description": "Interior cleanroom — yellow light, workers at stations, wafer equipment in foreground",
        "camera": "Slow dolly forward, hip level"
      }
    ]
  }
}
```

### Quality Principles for AI Briefs

**Specificity wins.** Vague prompts produce generic clips. Describe exact lighting direction, equipment types, architectural details, figure positioning. The more specific the brief, the fewer re-generations needed.

**Direction integration for AI-GEN briefs:** When the script has `DIR:` lines on an `[AI-GEN:]` entry, translate them into the brief's natural-language fields:
- `cam()` → `camera.movement` field. `cam(push-in, over:7s)` → `"Slow forward dolly over 7 seconds"`. `cam(static)` → `"Locked-off static frame"`. `cam(orbit)` → `"Slow orbital tracking around subject"`.
- `mood()` → `scene.mood` field. `mood(dense, particles:15)` → add "heavy atmosphere, particulate haze in light beams" to mood description. `mood(dim:0.5)` → "low ambient lighting, isolated pool of light on subject".
- `hold()` → `generation.durationTarget`. `hold(2s)` adds 2s to the target duration.
- `cut()` → `_direction.transitionOut` in a separate direction block (consumed by assembly manifest, not the generation tool).

Also emit a `_direction` block alongside the brief for assembly manifest consumption:
```json
{
  "_direction": {
    "cameraNote": "Slow push-in over 7 seconds",
    "atmosphere": "dense",
    "ambientParticles": 15,
    "holdAfter": 0,
    "transitionOut": "dissolve"
  }
}
```

**Camera movement serves narrative.** Don't default to "slow dolly" for everything. Match the camera to the content:
- Revealing a space → dolly forward (discovery)
- Surveying a situation → pan left-to-right (observation)
- Tension/decision → static with subtle drift (unease)
- Transition/passage of time → tracking shot following movement (flow)

**Treatment alignment.** Match the treatment to the editorial context:
- `standard` — neutral/positive content, present-day
- `conflict` — adversarial content, military, sanctions, confrontation
- `editorial` — historical, archival feel, pre-1980s reconstructions

**The constructivist planar face is non-negotiable.** Every brief involving human figures MUST specify the constructivist planar standard: 4-5 color-blocked face planes (jaw, cheekbone, brow, lit, neck), no continuous skin tonality, no rendered facial features (no photographic nose contour, no mouth detail, no realistic eye structure), eyes obscured by lens shadow / hat brim / visor reflection / hair fall. Hands are flat color planes only (palm + finger silhouette, no individual finger detail). Every quality gate MUST include a planar-face check. Clips where faces drift toward realism (continuous skin tonality, rendered features, "realistic-but-blurred" features) get rejected and re-generated.

**The animation-flat rule is load-bearing.** Any AI-GEN brief that will produce an *animated* video clip (sent to Kling/Sora/Runway/Seedance) MUST use `realism: flat` for both figure and environment. This isn't editorial preference — it's a production fact: animation models track color-blocked forms reliably across frames whereas photographic textures drift severely. `realism: balanced` and `realism: grounded` produce environments with material detail (paper grain, wood grain, atmospheric perspective) that fail to track consistently in motion, creating visible morphing. Reserve `balanced` and `grounded` for **stills only** — assets that will be Ken-Burned in NLE rather than animated.

When emitting a brief, check the script's intent for the segment: if the entry is a static beat (Ken Burns over a still) or a long-hold composition shot, `balanced` or `grounded` is fine. If the entry is a moving camera through a space (dolly, pan, orbit, tracking) or any clip that will be sent to a video generation tool, force `realism: flat` regardless of what the script's visual column suggested. Flag the override in the brief's `editorialGuardrails` so render-qa knows to verify.

## Step 6 — Summary and Render Commands

After generating all files, output:
1. **Register distribution** — count and percentage by register (Analytical, Atmospheric, Grounding) plus footage
2. A count of Remotion JSON files generated per template type
3. **Recraft illustration summary**: total illustrations, breakdown by mode (metaphor/illustration/diagram/icon), estimated cost (~$0.08/SVG)
4. Footage manifest summary: total entries, breakdown by sourcability (Easy/Moderate/Hard)
5. AI video brief summary: total clips, breakdown by use case, estimated generation cost (~$0.50-1.00/clip for Kling, $0 for Sora if within ChatGPT Pro limits)
6. Visual mode balance check: does the final output match the target ranges? Are all three registers present?
7. **Direction summary** — total segments with `_direction` blocks, breakdown by directive type (cam/reveal/hold/cut/mood), count of narration sync points, list of all `syncWord` values, count of pace-only `_direction` blocks (compositions with `paceProfile` but no DIR: directives)
8. The full file list with paths (grouped by: MG JSON / Recraft specs / footage manifest / AI briefs)
9. **Concept Registry Update** — list new concepts to add and existing concepts that got a new appearance (from Step 1.5). Format as a ready-to-paste JSON snippet for each new concept.
10. **Transition map** — compressed visual showing register transitions and which transition type connects them (now explicitly driven by `cut()` directives from the script)
11. Render/generation commands:

```bash
# Preview a specific Remotion composition
npx remotion still src/index.ts <CompositionId> \
  --frame=<frame_number> \
  --browser-executable=<path> \
  --output=preview-<name>.png

# Generate atmospheric illustrations (batch)
python tools/recraft/recraft.py batch data/episodes/<slug>/illust-manifest.json --output assets/ --treat standard

# Source stock footage
python tools/asset-source/source.py data/episodes/<slug>/footage-manifest.json --output assets/
```

Remind the user that:
- Maps (ChoroplethMap, RouteAnimation) require internet access for TopoJSON world data
- Recraft requires `RECRAFT_API_KEY` environment variable
- AI video briefs are generated manually through Kling/Sora/Runway interfaces (not automated)
