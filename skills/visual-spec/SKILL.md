---
name: visual-spec
description: >
  Generate Remotion template JSON data files AND a footage manifest from a video script. This skill
  reads a narration script and produces two outputs: (1) motion graphic specs as JSON files for Remotion,
  and (2) a structured footage manifest listing every stock footage and archival image need with search
  terms, platform recommendations, sourcability ratings, and compositing notes. Use this skill whenever
  someone says 'generate visuals', 'visual spec', 'create the data files', 'footage manifest',
  'what visuals does this script need', 'spec out the graphics', or any request to turn a script
  into renderable video assets and a footage sourcing plan. Also trigger when a new script version is
  finalized and needs visual planning, or when someone asks 'what templates do I need for this episode'.
---

# Visual Spec Generator

You are generating the full visual data layer for a bilingual geopolitics video channel. This means two things:

1. **Remotion JSON files** — data files that drive each motion graphic composition (maps, charts, typography, etc.)
2. **Footage manifest** — a structured JSON file listing every stock footage and archival image need, ready for the `source.py` tool and manual sourcing

The Remotion project at `remotion-templates/` contains React components that render animated video segments. Each component reads from a JSON data file — change the data, get a different video. But motion graphics are only part of the picture: a typical episode is ~55% footage, ~30% MG, ~8% layered (footage + MG composited), and ~7% transitions. Your output covers both the MG and footage layers.

## Reference Docs

Before starting, familiarize yourself with:
- **`project/VISUAL_LANGUAGE.md`** — editorial logic for when to use footage vs. MG vs. layered. This is the "why" behind visual decisions.
- **`project/FOOTAGE_SOURCING.md`** — what footage is actually available for geopolitics content, organized by sourcability tier. This is the reality check.
- **`project/SCRIPT_FORMAT.md`** — the visual mode tags (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`) and how they work in the two-column format.

## How This Works

The templates cover the MG layer of visual needs:

| Template | Share | Purpose |
|----------|-------|---------|
| ChoroplethMap | ~25% | Country highlighting, alliances, trade blocs |
| RouteAnimation | ~20% | Supply chains, trade routes, resource flows |
| TimelineComparison | ~15% | Historical parallels, before/after |
| DataChart | ~15% | Statistics, comparisons, numerical data |
| KineticTypography | ~10% | Quotes, definitions, bilingual text, key stats |
| FrameworkDiagram | ~8% | Conceptual models, comparisons, flows |
| TitleTransition | ~7% | Episode/section titles, end cards |

## Step 1 — Read the Script

Read the full script file. Pay attention to:

- **Visual mode tags** — `[FOOTAGE:]`, `[MG:]`, `[LAYERED:]` in the right column. These tell you which entries need Remotion JSON (MG and the MG part of LAYERED) and which need footage manifest entries (FOOTAGE and the footage part of LAYERED).
- **Beat/section structure** — each beat typically needs 3-8 visual segments
- **`[VISUAL: ...]` cues** (older scripts) — the script author's suggestions for what should appear on screen. These are starting points, not final specs. You may add visuals the author didn't suggest if the content calls for it.
- **Data points** — any numbers, percentages, comparisons, or statistics mentioned in narration
- **Quotes** — attributed quotes that deserve a full-screen typography moment
- **Foreign terms** — especially Chinese terms (卡脖子, 举国体制) that should get definition cards
- **Geographic references** — countries, cities, regions that should appear on maps
- **Historical parallels** — any past-present comparison is a timeline candidate
- **Conceptual frameworks** — metaphors or analytical models (chess vs. go, etc.)

If the script uses the older format without mode tags, infer the mode: named Remotion templates → `[MG:]`, `TEMPLATE: FOOTAGE` or `TEMPLATE: IMAGE` → `[FOOTAGE:]`. Flag to the user that mode tags should be added for pacing analysis.

## Step 2 — Create the Visual Breakdown

Before writing any JSON or footage manifest, produce a visual breakdown table. This is the planning step — it maps every visual moment in the script to a mode, a tool, and an output file.

Format it as a markdown table:

```
| Timecode | Script Moment | Mode | Template/Type | Output File | Notes |
|----------|--------------|------|---------------|-------------|-------|
| 0:00 | Episode open | MG | TitleTransition | title-episode.json | episode-title variant |
| 0:10 | Arizona desert | FOOTAGE | Stock video | footage-manifest.json #1 | "Arizona desert aerial" · Pexels · P3 |
| 0:25 | TSMC Arizona fab | MG | ChoroplethMap | choropleth-reshoring.json | US highlighted |
| 0:45 | "7% of US demand" | LAYERED | Stock + KineticTypo | footage-manifest.json #2 + kinetic-7pct.json | stat over desert footage |
| 1:10 | Cleanroom context | FOOTAGE | Stock video | footage-manifest.json #3 | "cleanroom wafer" · P2 |
| ... | ... | ... | ... | ... | ... |
```

After the table, include a **visual mode summary**:
```
FOOTAGE: 18 entries (~55% screen time)
MG: 14 entries (~30% screen time)
LAYERED: 5 entries (~8% screen time)
TRANSITION: 6 entries (~7% screen time)
```

Check against target ranges from SCRIPT_FORMAT.md: FOOTAGE 50-70%, MG 20-30%, LAYERED 5-15%. If the balance is off, flag it before proceeding.

Guidelines for the breakdown:
- Every beat should start with a section title card (TitleTransition, section variant)
- Don't over-specify — not every sentence needs its own visual. Group related narration under one visual.
- A visual segment typically covers 15-45 seconds of narration
- The episode should open with an episode-title card and close with an end-card
- Aim for 30-45 total visual segments per 15-20 minute episode (this includes footage, not just MG)
- No more than 3 consecutive MG entries without a FOOTAGE break
- No more than 30 seconds of continuous FOOTAGE without a visual change
- LAYERED entries should be brief (3-8s) with simple MG overlays
- Prioritize the visual that best serves comprehension, not the most impressive one

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

### Content principles

**Accuracy over aesthetics.** Every number, every quote, every claim in the JSON must match what the script says. If the script says "roughly eighty percent," the visual can say "~80%" but not "78%" unless that specific number is sourced.

**Semantic color coding.** Use the design system colors consistently:
- US/Western actions → blue (#3266AD)
- China/Eastern actions → red (#C23B22)  
- Neutral/structural → gray (#888780)
- Emphasis/call-out → amber (#F5A623)
- Blocked/denied → danger red (#D64545)

**Bilingual awareness.** This is a bilingual channel. When Chinese terms appear in the script, create definition cards with pinyin and translation. When a concept has both English and Chinese framing, consider a bilingual typography card.

**Phase design for maps.** Don't dump all countries into one phase. Build the story: start with the key players, then expand to show allies, then show countries caught in between. Each phase should have a clear narrative beat that matches the narration.

**Duration calibration.** Read the section of narration that accompanies each visual and estimate how long it takes to speak at ~150 words per minute. The visual's `durationSec` should roughly match the narration time for that segment, plus 1-2 seconds of breathing room.

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
  "layeredWith": null
}
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

## Step 5 — Summary and Render Commands

After generating all files, output:
1. A count of Remotion JSON files generated per template type
2. Footage manifest summary: total entries, breakdown by sourcability (Easy/Moderate/Hard), estimated footage cost
3. Visual mode balance check: does the final output match the target ranges?
4. The full file list with paths
5. Render commands for previewing key MG frames:

```bash
# Preview a specific composition
npx remotion still src/index.ts <CompositionId> \
  --frame=<frame_number> \
  --browser-executable=<path> \
  --output=preview-<name>.png
```

Remind the user that maps (ChoroplethMap, RouteAnimation) require internet access to load the TopoJSON world data, so they render fully only in Remotion Studio on their local machine or when the sandbox has CDN access.
