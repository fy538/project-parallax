---
name: render-qa
description: >
  Generate frame-check commands and a structured verification checklist for Remotion-rendered compositions and Recraft-generated assets before final assembly. Prioritizes by visual impact tier (P1 hero, P2 supporting, P3 ambient) and checks data accuracy, layout correctness, animation states, and (for Recraft outputs) register/treatment pairings against the shot-list and assembly manifest. Use whenever someone asks 'QA the renders', 'check the compositions', 'render check', 'verify renders', 'are the compositions correct', or when Remotion render completes and assembly is the next pipeline step. This is the code-level/data-level QA (checklist-based, including the structured register-aware checks for Recraft assets). For pixel-level visual judgment using Claude's vision on rendered stills — including whether mannequin faces actually look featureless or constructivist style holds — use visual-qa instead.
---

# Render QA — Remotion Composition Verification

You are performing a visual quality assurance pass on rendered Remotion compositions. Your job is to generate frame-capture commands for strategic moments in each composition, produce a template-specific verification checklist, and create a report that the creator (Tiger) can use to spot-check renders before full assembly.

## Why This Exists

The Parallax pipeline flows: script → visual-spec (JSON generation) → Remotion render → assembly. By the time a composition is rendered, it's expensive to fix problems. This skill inserts a **pre-assembly checkpoint** that catches render issues, data errors, and visual inconsistencies early:
- CJK font loading failures (text becomes tofu boxes)
- Duration mismatches (JSON says 12s, but it actually renders in 10s)
- Color palette inconsistencies (a dark-mode composition rendering with light colors)
- Data accuracy mismatches (a bar chart's proportions don't match the numbers in the script)
- Typography errors (typos, pinyin tone marks wrong, attribution missing)
- Map errors (wrong countries highlighted, color coding reversed, phase transitions out of order)

This is not a pixel-perfect polish pass (that's post-assembly). This is a **mandatory sanity check** before handing renders to the video editor.

## Context

Parallax uses Remotion (React-based video rendering) with 45 core templates plus 9 Shorts variants (full inventory: `remotion-templates/CLAUDE.md`; canonical schemas: `remotion-templates/references/template-schemas.md`). Each template has specific visual elements that need verification:

**Core templates:**
- ChoroplethMap — country highlighting on world maps
- RouteAnimation — animated trade routes between geographic points
- TimelineComparison — dual-column historical parallels
- DataChart — animated bar charts and comparisons
- KineticTypography — quotes, definitions, bilingual text, statistics
- FrameworkDiagram — comparison columns, flow diagrams, matrices
- TitleTransition — episode titles, section headers, end cards

**Format-specific:**
- DecisionTree — branching choice visualizations
- SplitComposition — side-by-side layouts with ∴ divider
- ProbabilityGauge — uncertainty/probability displays
- ImageComposite — photos with brand treatment and text overlay

Remotion renders individual frames via: `npx remotion still src/index.ts <CompositionId> --frame=<N> --output=preview-<name>.png`

## Inputs

1. **Episode folder path** — the directory containing the episode's data and render outputs
   - Look for `remotion-templates/data/episodes/<slug>/`
   - Should contain: assembly-manifest.json, JSON data files for each composition
2. **Assembly manifest** (required) — `assembly-manifest.json` maps the timeline to compositions
   - Location: `remotion-templates/data/episodes/<slug>/assembly-manifest.json`
3. **Production script** (read as needed) — to verify data accuracy and visual intent
   - Location: `episodes/<slug>/script-vX-*.md` (current production script)
4. **Project reference files** (read as needed):
   - `remotion-templates/BRAND.md` — color palette, semantic colors, dark/light mode specs
   - `remotion-templates/LESSONS.md` — known rendering issues and workarounds
   - `remotion-templates/src/templates/` — template component code (to understand visual structure)

## Workflow

### Step 1: Read Episode Data

1. Request the episode path from the user (e.g., "silicon-trap")
2. Read `assembly-manifest.json` to see what compositions exist, their IDs, and their frame counts
3. Read the corresponding JSON data files (one per composition) to understand what data is being rendered
4. Read the production script to establish what each composition should visually contain

### Step 2: Generate Frame-Check Commands

For each composition, generate Remotion still-capture commands targeting strategic frames:

**For ChoroplethMap:**
- Frame at the START (frame 1) — check initial state, map is loaded, correct region/TopoJSON
- Frame at each PHASE TRANSITION (check the script for phase markers) — verify countries highlight in correct order
- Frame at the FINAL STATE (last frame) — verify all intended countries are highlighted, colors correct

**For RouteAnimation:**
- Frame 1: Starting state (check map is present, route endpoints visible)
- Frame at 40% through animation: Route is drawing (check path color, endpoints)
- Frame at 100%: Complete route visible with labels and annotations

**For TimelineComparison:**
- Frame showing both columns fully populated (check all text is present, not truncated)

**For DataChart:**
- Frame at animation completion (check bar proportions match script data, axis labels present)

**For KineticTypography:**
- Frame with full text visible (check spelling, pinyin tone marks, attribution, text fits in safe area)

**For FrameworkDiagram:**
- Frame showing complete diagram (check all labels, column count matches spec, arrows/connections intact)

**For TitleTransition:**
- Frame showing full title with ∴ mark (check spelling, mark position, color contrast)

**For format-specific (DecisionTree, SplitComposition, ProbabilityGauge, ImageComposite):**
- Key frame where all elements are visible — adjust based on template's specific purpose

Commands should be copy-paste ready:
```bash
# Composition: ChoroplethMap_phase1
npx remotion still src/index.ts ChoroplethMap_phase1 --frame=1 --output=qa/phase1-start.png
npx remotion still src/index.ts ChoroplethMap_phase1 --frame=120 --output=qa/phase1-transition-1.png
npx remotion still src/index.ts ChoroplethMap_phase1 --frame=300 --output=qa/phase1-final.png

# Composition: DataChart_production_capacity
npx remotion still src/index.ts DataChart_production_capacity --frame=180 --output=qa/chart-complete.png
```

### Step 3: Produce Template-Specific Checklists

For each template type, generate a checklist that Tiger can check off as he reviews the stills. Organize by template:

```
## ChoroplethMap Verification Checklist

### ChoroplethMap_phase1
- [ ] Map renders without errors (TopoJSON loaded correctly)
- [ ] Correct countries/regions highlighted (cross-reference against script)
- [ ] Semantic colors correct: US/Western allies = blue, China allies = red, contested/neutral = amber
- [ ] Country names match TopoJSON conventions (not garbled, correct orthography)
- [ ] Phase transitions occur in correct sequence
- [ ] All text labels (country names, legend) render at readable size (1080p)
- [ ] No missing regions or unexpected highlights

### Notes for ChoroplethMap_phase1
- Script specifies: US-allied countries blue (12 nations), China-allied red (7 nations)
- Phase durations: Phase 1: 0-3s (US allies), Phase 2: 3-6s (China allies), Phase 3: 6-12s (contested)
```

## Checklist Template by Template Type

### ChoroplethMap Checklist

```
- [ ] Map renders without errors (TopoJSON loaded successfully)
- [ ] Correct countries/regions highlighted per script spec
- [ ] Semantic colors applied correctly: US/Western = blue, China = red, neutral/contested = amber
- [ ] Country names match TopoJSON conventions (readable, not garbled)
- [ ] Phase transitions execute in script-specified order
- [ ] Phase timing matches manifest duration
- [ ] All text labels and legend items render at 1080p readability
- [ ] No missing or duplicate regions
- [ ] Background map color consistent with BRAND.md dark mode (ink or map bg)
- [ ] No text clipping at edges
```

### RouteAnimation Checklist

```
- [ ] Map background loads correctly (TopoJSON present)
- [ ] Route endpoints are correctly positioned geographically
- [ ] Animation path flows correctly from start to end (no jumps or reversals)
- [ ] Route color matches semantic coding (US = blue, China = red, neutral = gray, highlight = amber)
- [ ] Labels at route nodes are legible and correctly positioned
- [ ] No path clipping or artifacts at map edges
- [ ] Animation timing matches manifest duration
- [ ] End-state shows complete, fully-drawn route
```

### TimelineComparison Checklist

```
- [ ] Both timeline columns render with full text visible
- [ ] Column headings/dates are readable and correctly aligned
- [ ] Event markers on each timeline render in correct sequence
- [ ] No text truncation or overflow from columns
- [ ] Vertical alignment between left and right columns is synchronized
- [ ] Color coding (if any) matches semantic palette
- [ ] Section divider (if ∴ present) is positioned correctly
- [ ] Font rendering: check for any CJK character issues (should be Noto Sans SC)
```

### DataChart Checklist

```
- [ ] Chart renders without animation glitches
- [ ] Bar proportions at completion match the script's numeric data (within 1-2% tolerance)
- [ ] Axis labels present and accurate (no missing units, correct decimal places)
- [ ] Axis numbers readable at 1080p
- [ ] Source attribution visible (if specified in JSON)
- [ ] Legend (if present) correctly mapped to data series
- [ ] Animation completes cleanly (no partial/stuck bars)
- [ ] Color scheme consistent with BRAND.md (ink text, amber/rust/blue data colors)
- [ ] No data label clipping or overlap
```

### KineticTypography Checklist

```
- [ ] Full text renders (quote/definition/statistic)
- [ ] Chinese characters render correctly (no tofu boxes, correct font: Noto Sans SC)
- [ ] Pinyin (if present) has correct tone marks (no missing ā, á, ǎ, à marks)
- [ ] Quote attribution present and accurate (cross-reference script)
- [ ] Text fits within safe area (no edge clipping at 1080p)
- [ ] Accent color matches composition intent (amber, rust, or semantic color)
- [ ] Animation timing: text appears/fades in correct sequence
- [ ] Font sizes: hierarchy clear between main text, attribution, and context
- [ ] Spelling verification: no typos in English or Chinese
```

### FrameworkDiagram Checklist

```
- [ ] Complete diagram renders (all nodes, connections, labels visible)
- [ ] Number of columns/rows matches JSON spec
- [ ] All labels/text elements render without clipping
- [ ] Arrows, flow connectors, or relationship lines are correctly drawn
- [ ] Color coding (if present) matches semantic palette
- [ ] Font hierarchy readable: primary labels > secondary labels > metadata
- [ ] Alignment: all text baselines and element centers align correctly
- [ ] No overlapping text or visual congestion
- [ ] Aspect ratio and positioning correct (centered, not skewed)
```

### TitleTransition Checklist

```
- [ ] Episode or section title renders in full
- [ ] ∴ brand mark is present and correctly positioned
- [ ] Title spelling and capitalization match script
- [ ] Subtitle (if present) renders clearly
- [ ] Text color provides sufficient contrast against background
- [ ] Animation (fade, slide, etc.) executes cleanly
- [ ] Duration matches manifest timing
- [ ] No text truncation at edges
```

### DecisionTree Checklist (format-specific)

```
- [ ] All branch nodes visible (no clipping)
- [ ] Decision labels at each branch render correctly
- [ ] Choice options on branches are legible
- [ ] Tree depth doesn't create visual congestion
- [ ] Flow direction (top-down or left-right) is clear
- [ ] Connection lines between nodes are visible and aligned
- [ ] Color coding for decision outcomes (if any) is consistent
```

### SplitComposition Checklist (format-specific)

```
- [ ] Left and right sides render with equal visual weight
- [ ] ∴ divider is centered and properly proportioned
- [ ] Both sides render with correct color treatment (dark mode consistency)
- [ ] No visual bleed between left/right sections
- [ ] Text on each side is independently readable
- [ ] Aspect ratio: both sides equally weighted (50/50 or specified ratio)
```

### ProbabilityGauge Checklist (format-specific)

```
- [ ] Gauge renders with correct scale (0-100% or specified range)
- [ ] Needle/indicator points to correct probability value
- [ ] Color coding for probability zones renders correctly (red = low, amber = medium, green = high)
- [ ] Labels and percentage text are legible
- [ ] Animation (if sweeping needle) executes smoothly
```

### ImageComposite Checklist (format-specific)

```
- [ ] Base image loads and renders without distortion
- [ ] Brand treatment applied correctly (duotone, grain, desaturation per BRAND.md)
- [ ] Text overlay positioned correctly over image
- [ ] Text readability maintained despite image treatment
- [ ] Attribution/credit line visible (if required)
- [ ] Composite dimensions match composition spec (aspect ratio intact)
```

## Register-Aware Verification (Recraft + Brand Treatment Outputs)

ImageComposite assets in Parallax episodes increasingly originate from `tools/recraft/recraft.py` and pass through `tools/brand-treatment/treat.py` (raster) or `treat_video.py` (clips) before landing in the timeline. These assets carry a `register` field per `data/shot-list.schema.json` — `atmospheric`, `grounding`, or (rarely) `analytical`. Each register has different failure modes the template checklists above don't catch.

This section adds **structured/binary checks** for register-tagged assets — does the manifest match what was generated, was treatment applied, are the right files present. **Visual judgment of register fidelity** (does the mannequin face actually look featureless? does the constructivist style hold?) belongs in `visual-qa`, which runs Claude's vision on rendered stills. Both passes should run before assembly.

### When This Applies

Any asset where the source shot list entry has:
- `type: ai-generate | ai-gen | svg`, AND
- `register: atmospheric | grounding | analytical` (per shot-list.schema.json)

If the assembly manifest also marks the asset's source as Recraft, run these checks in addition to the ImageComposite template checklist.

### Cross-Register Checks (every Recraft asset)

```
- [ ] Asset file exists at the path referenced in the assembly manifest
- [ ] Asset format matches the register's expected output:
      - atmospheric → SVG (vector_illustration) or PNG fallback
      - grounding → SVG or PNG (vector_illustration is now the default for
        constructivist; realistic_image only for rare grounded-realism stills)
      - analytical → SVG (vector_illustration)
- [ ] Treatment field on the shot matches treatment actually applied:
      - For SVG: filename has the `_treated_<ramp>` suffix from apply_duotone_svg
      - For PNG: filename or sidecar metadata reflects treat.py invocation
- [ ] Treatment ramp aligns with VIS-10 (treatment × register pairings, see EDITORIAL_PLAYBOOK.md)
      — flag any atmospheric+editorial pairing as a likely mistake
- [ ] Source prompt is logged somewhere reproducible (recraft-manifest.json or shot-list 'description' field)
- [ ] Asset duration on timeline doesn't exceed mode-specific limits per VISUAL_LANGUAGE.md
      (max 30s footage; max 2 consecutive AI-GEN; ILLUST 30-40% opacity for backgrounds)
```

### Animation-Flat Rule Check (load-bearing)

For any AI-GEN asset that will be animated to video (sent to Kling / Sora /
Runway / Seedance — i.e., the assembly manifest segment carries motion via the
generation tool, not Ken Burns), the `realism` field on the shot list MUST be
`flat`. This is a production rule: animation models track color-blocked forms
reliably across frames whereas photographic textures (skin tonality, fabric
weave, atmospheric haze) drift severely. `balanced` and `grounded` realism
dosages produce environments with material detail that morph in motion.

```
- [ ] If the asset is an animated video clip (not a still), shot list realism is "flat"
- [ ] If the asset is a still that will be Ken-Burned in NLE, balanced or grounded realism is OK
- [ ] If realism is "grounded", confirm the asset is a still — flag if the assembly
      manifest sends it through Kling/Sora/Runway as an animated clip
- [ ] If the AI-GEN brief specifies any camera motion (dolly, pan, orbit, tracking)
      AND realism != "flat", flag as a likely animation-flat rule violation
```

Flag any violation as **HIGH PRIORITY** before assembly — animation drift on a non-flat asset is the most expensive failure mode in the AI-GEN pipeline (re-generation cost + timeline shift).

### Atmospheric Register Checks (constructivist illustration)

These verify the asset behaves like Register 2 in the timeline, not whether the constructivist style itself succeeded — that's visual-qa's job.

```
- [ ] Asset is used as a background or atmospheric texture, NOT as a data-carrying visual
      (anything the viewer needs to *read* belongs in MG / Register 1)
- [ ] Composition opacity in the assembly manifest is in the 30-40% range when used as wallpaper
- [ ] No more than 2 consecutive ILLUST entries before a register switch (per VIS-09)
- [ ] Treatment ramp is `standard` or (rarely) `conflict`, NEVER `editorial`
      — atmospheric + editorial desaturates the constructivist palette into mush; flag as VIS-10 violation
- [ ] If used as a recurring motif (per VIS-07), the manifest references the same asset
      family across beats — not three unrelated illustrations
```

### Grounding Register Checks (constructivist figurative scenes)

Post-May 4, 2026: grounding scenes use constructivist figurative aesthetic, not photoreal mannequin. The figure standard is shared with Register 2 — both registers carry the same constructivist DNA.

```
- [ ] If extended segment >10s of video, the assembly manifest includes the "∴ Visualized"
      on-screen disclosure indicator (per AI_VIDEO_PIPELINE.md editorial guardrails)
- [ ] No identifiable real person depicted — caption or alt text references a *role*
      ("The Regulator," "The Engineer"), not a name
- [ ] Treatment ramp matches the editorial intent:
      - present-day reconstructions → standard (warm umber default)
      - adversarial/contested scenes → conflict (ink → rust)
      - historical (pre-1980s) reconstructions → editorial (desaturated bone tones)
- [ ] Used for a genuinely unsourceable interior or restricted facility — NOT as a substitute
      for stock footage that could have covered the moment
- [ ] Register 3 budget within VIS-09 target (5-15% of episode runtime, 10-20% max)
- [ ] No more than 2 consecutive Grounding clips before a mode switch
- [ ] Realism field on shot list is consistent with the asset's animation status
      (see Animation-Flat Rule Check above)
- [ ] If text_treatment is non-Latin (chinese_propaganda, russian_constructivist,
      japanese_showa, chinese_traditional), Tiger has verified the rendered text
      is real and parseable in its source language — no mock-script gibberish
```

Visual-judgment checks for grounding (does the planar face actually look constructivist? do figures avoid the realistic-but-blurred uncanny zone?) belong in `visual-qa`, which uses Claude's vision on rendered stills. render-qa's role here is the structured/binary checks above.

### Analytical Register Checks (rare Recraft fallback)

Most analytical content lives in code-locked Remotion templates and uses the template checklists above. The Recraft analytical path exists only for hand-drawn diagram fallbacks where Remotion isn't appropriate.

```
- [ ] Confirm this content actually needed Recraft — most analytical content should be Remotion
      (FrameworkDiagram, NetworkDiagram, etc.). Flag if a Remotion equivalent exists and wasn't used.
- [ ] No grain or vignette overlay applied (analytical register stays clean per VIS-09)
- [ ] Palette is restricted to ink + paper background with amber/rust accents only
- [ ] Treatment field omitted or set to `standard` (analytical register doesn't carry tonal mood)
```

### Treatment-Pairing Validation (ties to VIS-10)

Run this matrix check for every Recraft asset before assembly:

| Register | standard | conflict | editorial |
|---|---|---|---|
| atmospheric | ✓ default | ✓ rare (max 1-2/ep) | ✗ AVOID — flag |
| grounding | ✓ default | ✓ adversarial | ✓ historical |
| analytical | ✓ omit/default | ✗ rarely meaningful | ✗ rarely meaningful |

Any cell marked ✗ in the asset's actual pairing is a VIS-10 violation — flag for Tiger before assembly.

## Prioritization by Visual Impact Tier

**P1 Hero Visuals — FULL CHECK**
- Run ALL frame-check commands for these compositions
- Check every item on the corresponding template checklist
- If any issue is found, flag it as a blocker (must be fixed before assembly)
- These are the moments viewers will remember — require pixel-perfect accuracy on data and no typos

**P2 Supporting Visuals — SPOT CHECK**
- Run frame-check commands for key moments (start, completion, transitions)
- Check critical items only: data accuracy, text readability, color correctness
- Non-critical issues (minor layout tweaks) can be deferred post-assembly
- Flag any data errors or illegible text

**P3 Ambient Visuals — GLANCE CHECK**
- Run 1-2 frame-check commands (ideally completion frame or mid-animation)
- Check only: renders without errors, treatment looks right, text is legible
- No detailed checklist required — visual impression suffices
- Flag only show-stopping issues (missing text, wrong colors, artifacts)

## Output Format

```
# RENDER QA REPORT
## Episode: [EP number and title]
## Date: [today]
## Script version: [vX]

## Summary
- Total compositions to verify: [N]
- P1 hero visuals: [N] (full check required)
- P2 supporting visuals: [N] (spot check)
- P3 ambient visuals: [N] (glance check)

## Frame-Check Commands

Copy and paste these into your terminal to generate preview stills:

\`\`\`bash
# P1 HERO VISUALS

# Composition: [CompositionId]
# Purpose: [brief description from script]
# Template: [template type]
npx remotion still src/index.ts [CompositionId] --frame=1 --output=qa/[descriptive-name]-frame1.png
npx remotion still src/index.ts [CompositionId] --frame=[strategic-frame] --output=qa/[descriptive-name]-frame[N].png
...

# P2 SUPPORTING VISUALS
...

# P3 AMBIENT VISUALS
...
\`\`\`

## Verification Checklists by Template

[For each composition, organized by template type:]

### Composition: [CompositionId]
**Template:** [Template type]
**Priority Tier:** P[1/2/3]
**Duration:** [Xs per manifest]
**Purpose:** [One sentence from script about what this visual does]

[Template-specific checklist, with items relevant to this composition's data]

**Notes:**
- [Any special considerations for this composition]
- [Data verification: "Script says X, JSON specifies Y"]
- [Known render risks: "CJK fonts required," "TopoJSON internet access," etc.]

---

[Repeat for each composition]

## Common Render Issues — Parallax-Specific

**Maps require internet access for TopoJSON:**
- If Remotion runs offline or in an isolated environment, ChoroplethMap and RouteAnimation will fail silently (blank maps).
- Workaround: ensure network connectivity during rendering, or pre-cache TopoJSON files.

**CJK font loading (Noto Sans SC):**
- If Noto Sans SC is not available on the render system, Chinese text renders as tofu (□□□).
- Check: `remotion-templates/src/design/theme.ts` uses `'Noto Sans SC'` family.
- Verify font is installed system-wide or bundled in Remotion `<Font>` components.
- Flag immediately if ANY Chinese character appears as a box.

**Duration mismatches:**
- JSON `durationSec` must match assembly manifest timing.
- Example: if JSON says `"durationSec": 12` but the composition actually renders in 10 seconds, assembly will be out of sync.
- Check each composition's frame count: frames / 30fps = actual duration. Compare against JSON.

**Color consistency between templates:**
- Dark mode compositions should use `ink` (#1C1814) or `bg.dark.surface`, not pure black.
- Semantic colors must be consistent: US = `us` (#4A7BA7), China = `china` / `rust` (#A64D46), neutral = `neutral` (#888780).
- If a composition renders with unexpected colors, check the JSON color tokens against BRAND.md.

**Text clipping and safe areas:**
- Remotion renders at 1920x1080. Text should not touch the outer 80px margin on any side.
- Check each composition's text boundaries — particularly important for mobile Shorts (narrower safe area).

**Animation glitches:**
- If a DataChart bar appears to "jump" or "stutter" during animation, check the JSON keyframe timings.
- If a route animation reverses or backtracks, verify the path coordinates in the JSON.

## Sign-Off Section

Once Tiger has reviewed the stills and checked the composition, record the outcome:

```
## QA Sign-Off

### [CompositionId]
- [ ] Reviewed (frame stills checked)
- Status: PASS / NEEDS REVISION
- Issues found (if any):
  - [Issue 1: location + description + impact]
  - [Issue 2]
- Resolution:
  - [Fixed in Remotion code / Updated JSON / Will address post-assembly]
  - [Link to updated file if applicable]

### [Next CompositionId]
...
```

## Next Steps

1. **Tiger runs frame-check commands** — generates preview PNG stills for each composition
2. **Tiger checks stills against template checklists** — uses this report as a guide
3. **For each issue found:**
   - P1 blocker (data wrong, typo, missing text): pause, fix in JSON/Remotion code, re-render
   - P2 non-critical (layout detail): note for post-assembly or fix now if quick
   - P3 non-issue (treatment looks right): document and proceed
4. **Update this report** with sign-off section (PASS / NEEDS REVISION per composition)
5. **Proceed to assembly** once all P1 issues resolved and P2 issues documented

## Important Notes

- **This is a sanity check, not a polish pass.** The goal is to catch data errors, typos, font failures, and duration mismatches before assembly. Minor spacing tweaks or color shade refinements can be deferred post-assembly if needed.

- **Data verification is critical.** If a DataChart says "78% market share" in the narration but the JSON specifies a bar at 72%, that's a blocker. The numbers must match exactly.

- **P1 visuals are memory moments.** These are what viewers will internalize and remember. A typo in a P1 KineticTypography quote or a mislabeled country in a P1 ChoroplethMap undermines credibility. Zero tolerance.

- **Offline rendering requires TopoJSON pre-caching.** If rendering happens in an offline environment (CI/CD, isolated machine), map compositions will fail. Plan ahead.

- **Read the assembly manifest carefully.** It tells you exactly what compositions exist, their IDs, durations, and sequence. Cross-reference against the script to ensure nothing was missed or duplicated.

- **Generate stills at strategic frames, not every frame.** Checking 30 frames per composition is excessive. Focus on start, key transitions, and completion. That's usually 2-4 frames per composition.
