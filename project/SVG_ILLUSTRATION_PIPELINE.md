# SVG Illustration Pipeline

> How to identify, generate, polish, and integrate SVG illustrations into Parallax video production using Claude. Companion to IMAGES.md (stock photography) and BRAND.md (design system). Together, these three documents cover all visual sourcing.
>
> SVG illustrations fill gaps that stock footage and Remotion templates cannot: conceptual metaphors, abstract information design, data-narrative hybrids, and structural visualizations that don't exist as photographs. All SVG generation uses Claude directly — no external APIs required.
>
> Last updated: April 2026

---

## Where This Fits in the Pipeline

```
PRODUCTION_PIPELINE.md — Stage 5: Visual Production

Track A: Remotion Templates ← visual-spec skill → JSON → render
Track B: Stock Footage      ← source.py → treat.py → assets/
Track C: Image Treatment    ← treat.py or BrandImage component
Track D: SVG Illustrations  ← THIS DOCUMENT → .svg → Remotion
```

Track D runs in parallel with Tracks A-C. Its output is SVG files that either:
1. Render directly inside Remotion compositions (as React components importing SVG)
2. Export as static frames composited in the NLE alongside narration

---

## 1. Identifying What Needs an Illustration

Not every visual gap needs an SVG. The decision tree:

```
Can a Remotion template handle this?
├─ YES (data chart, map, timeline, framework, typography) → Track A
└─ NO
   Can stock footage handle this?
   ├─ YES (real places, people, events, establishing shots) → Track B
   └─ NO
      Is the concept geometric, diagrammatic, or information-rich?
      ├─ YES → SVG Illustration (this pipeline)
      └─ NO
         Does it require organic shapes, artistic texture, or scene composition?
         ├─ YES → Simplify the concept into geometric form, or hold on
         │        narration over a Remotion template / stock shot instead.
         │        (Raster API generation is a future option — see Appendix B.)
         └─ NO → Reconsider whether you need a visual at all.
               Narration over a held composition is fine.
```

### SVG Sweet Spot

SVG illustrations excel when the visual is **information that happens to be beautiful**, not beauty that happens to contain information. The best SVG illustrations for Parallax are ones where removing any element would lose meaning.

Strong candidates:
- Flow diagrams showing constriction, expansion, or redirection (Sankey, funnel)
- Network graphs showing dependencies, chokepoints, or cascading failure
- Before/after or side-by-side structural comparisons
- Abstract metaphors expressed through geometry (chess vs go positions, trap diagrams)
- Icon compositions representing stages, actors, or components in a system
- Annotated schematics with data callouts

Not suitable for Claude SVG (simplify or defer):
- Anything requiring human figures with anatomical detail or facial features
- Historical scene recreation ("what it looked like")
- Textured or painterly illustrations
- Complex organic shapes (nature, landscapes, realistic objects)
- Anything where the art style IS the point, not the information

### Identifying Illustration Needs from the Script

When reading a two-column production script, look for right-column entries tagged:
```
TEMPLATE: IMAGE
SOURCE: AI-GENERATE "..."
```

Also look for visual moments where the right column says something like "Conceptual visualization of...", "Abstract representation of...", "Diagram showing...", or "Visual metaphor for..." — these are SVG candidates. Additionally, scan for narration moments that describe structural patterns, systems, or abstract relationships — these often benefit from illustration even when the script doesn't explicitly request one.

---

## 2. Visual Vocabulary

Consistency within and across episodes depends on a shared visual language. Every recurring element type has a canonical representation below. Prompts should reference these conventions by name rather than describing elements from scratch each time.

The principle: **same concept, same visual, every time.** A "nation" always looks the same whether it appears in EP01 or EP50. A "flow" always uses the same visual grammar. This is what makes the channel feel like a brand rather than a collection of one-offs.

### Actors & People

Claude SVG should never attempt realistic human figures. People are represented through geometric abstraction.

**Individual actor** — geometric bust: circle (head) + trapezoid (shoulders), no facial features, no limbs. Differentiated by label, not appearance.
```xml
<!-- Standard actor icon, 48×64 -->
<g class="actor">
  <circle cx="24" cy="16" r="12" fill="#F0E6D0" opacity="0.85"/>
  <path d="M4,64 Q4,36 24,32 Q44,36 44,64" fill="#F0E6D0" opacity="0.65"/>
</g>
<!-- Label below in IBM Plex Mono 14px -->
```

**Group / population** — cluster of 3-5 circles at varying sizes (12-20px radius), loosely packed. The cluster reads as "many" without specifying a count.

**Named leader or decision-maker** — same bust icon, but with an amber (#E5A544) accent ring around the head circle and a bold label. Never attempt portraits or faces.

### Nations & Regions

**In network diagrams** — labeled circle node. Fill color is semantic: amber for highlighted/protagonist nation, rust (#C23B22) for antagonist/conflict side, bone (#F0E6D0) for neutral parties. Border: 1.5px stroke in same color at 50% opacity.

**In geographic contexts** — simplified geometric map outline. These don't need to be cartographically precise — recognizable shape is enough. Fill with semantic color, stroke with a slightly lighter variant. For small nations (Taiwan, Singapore), use a circle node with a geographic label instead of attempting a tiny map outline.

**No flag icons.** Flags are too fiddly at video resolution and don't survive SVG rendering well. Nations are differentiated by semantic color (amber/rust/bone on the border) + text label. This is sufficient — the narration provides context.

### Flows & Connections

**Use straight lines.** Curved bezier paths cause visual noise — lines that don't clearly connect to nodes, overlapping ambiguously, visual spaghetti. Straight lines are clearer, easier to align, and easier for Claude to place precisely. If the layout requires a bend, use a single right-angle elbow, not a curve.

**Trade / supply flow** — straight line with arrowhead marker. Default color: amber (#E5A544) at 40% opacity, 2px stroke. Width does NOT encode volume (too hard to control in SVG) — use labels or data callouts instead.
```xml
<!-- Arrow marker definition -->
<marker id="arrowAmber" viewBox="0 0 10 8" refX="10" refY="4" 
        markerWidth="10" markerHeight="8" orient="auto">
  <path d="M 0,0 L 10,4 L 0,8 Z" fill="#E5A544" opacity="0.5"/>
</marker>
<!-- Straight flow line, node edge to node edge -->
<line x1="288" y1="480" x2="492" y2="480" 
      stroke="#E5A544" stroke-width="2" opacity="0.4" 
      marker-end="url(#arrowAmber)"/>
```

**Contested / restricted flow** — same straight line but dashed (`stroke-dasharray="8 4"`) and rust color (#C23B22). Used for relationships under threat, sanction, or uncertainty.

**Chokepoint / control point** — small labeled box inline on the flow line, breaking it into two segments. The flow enters solid on one side and exits dashed on the other (control weakens it). Rust border, ink fill, short label inside (e.g., "CTRL", "BAN").
```xml
<!-- Flow splits around control box -->
<line x1="896" y1="480" x2="1020" y2="480" stroke="#E5A544" stroke-width="2" opacity="0.4"/>
<rect x="1020" y="470" width="80" height="20" rx="3" fill="#1A1A2E" stroke="#C23B22" stroke-width="1" opacity="0.6"/>
<text x="1060" y="484" font-family="'IBM Plex Mono'" font-size="9" fill="#C23B22" text-anchor="middle">CTRL</text>
<line x1="1100" y1="480" x2="1144" y2="480" stroke="#E5A544" stroke-width="2" opacity="0.25" stroke-dasharray="6 4" marker-end="url(#arrowAmber)"/>
```

**Blockage** — a small X (two crossing lines, 1.5-2px, rust) placed on a flow line. The flow should visibly weaken (lower opacity, switch to dashed) after the blockage point.

### Institutions & Systems

Represented as labeled geometric icons, never as buildings or realistic objects:
- **Government** — pentagon or shield outline
- **Industry / corporation** — hexagon (connotes manufacturing, networks)
- **Military / security** — diamond
- **Legal / regulatory** — rounded rectangle with label (avoid complex shapes like scales)
- **International org** — circle with inner ring (suggests globe)

All institution icons should be 40-56px and use a consistent 1.5px stroke weight with the relevant semantic color.

### Data & Statistics

**Large statistics** — always JetBrains Mono, 64-96px, weight 700, amber color for positive/highlighted, rust for negative/alarming, bone for neutral.

**Trend indicator** — simple triangle arrow: ▲ (up) or ▼ (down), 16-24px, colored by valence (amber = positive change being discussed, rust = negative).

**Percentage or proportion** — horizontal bar with fill ratio, never a pie chart (too complex for SVG precision). Bar background at 15% opacity, fill at 85%.

### Conflict & Tension

These conventions apply across all illustration types:
- **Rust (#C23B22)** is the universal conflict accent — sanctions, military action, geopolitical tension, competitive pressure
- **Dashed lines** signal contested, uncertain, or threatened connections
- **X marks** (two crossing lines, 2px rust) signal blockages or cancellations
- **Glow effects** (feGaussianBlur filter) on rust elements signal active/escalating conflict
- **Opacity reduction** signals weakening — a relationship losing strength fades from 0.8 to 0.3

### Consistency Rules

1. **Same element, same look.** If "China" appears in 3 illustrations in one episode, it's the same circle node with the same rust fill and the same label placement every time.
2. **Size encodes importance.** Primary actors/nations are 25-30% larger than secondary ones. Don't make everything the same size.
3. **Color encodes meaning, not decoration.** Every color choice should be traceable to the Meridian semantic system. Random color variation breaks the brand.
4. **Labels over cleverness.** If there's any ambiguity about what a shape represents, add a label. The narration provides context, but the visual should be parseable on its own within 5 seconds.
5. **Reuse SVG snippets.** When generating a new illustration, reference prior illustrations from the same episode to maintain consistency. Copy the exact `<g>` groups for recurring elements.

---

## 3. Writing Effective SVG Prompts

The quality of the SVG is 80% determined by the prompt. A vague prompt produces a vague illustration.

### Prompt Template

```
Create an SVG illustration for a Parallax video frame (1920×1080, dark mode).

CONCEPT: [One sentence: what analytical point does this communicate?]

SCRIPT CONTEXT: [The narration line(s) that play over this visual]

VISUAL APPROACH: [The diagram type — Sankey flow, network graph, before/after 
split, annotated schematic, icon composition, etc.]

CONTENT:
- [Specific elements that must appear, referencing visual vocabulary]
  e.g., "China (rust circle node), US (amber circle node), 
  TSMC (hexagon, amber accent), connected by tapered supply flow"
- [Key data points or labels]
- [What the viewer understands at a glance vs. on closer look]

VISUAL VOCABULARY NOTES:
- [Reference any canonical elements: "Use standard actor busts for 
  Xi and Biden," "Flows use Sankey convention from Section 2," etc.]
- [Note any elements that appear in other illustrations this episode 
  and must match]

BRAND (Meridian Dark):
- Background: radial gradient #1A1A2E → #0D0D1A (never flat)
- Palette: amber #E5A544, rust #C23B22, bronze #8B5E2B, 
  oxblood #6B1D1D, bone #F0E6D0, muted #B8AE9C, dim #6A6458
- Fonts: Space Grotesk 700 (titles), IBM Plex Mono 500 (labels), 
  JetBrains Mono 700 (statistics), Noto Sans SC 700 (Chinese, +15%)

LAYOUT:
- 80px safe area on all sides
- All spacing on 8px grid
- 3 text tiers only: primary ≥48px, secondary 22-28px, tertiary 14-18px
- Content ≤80% of safe area
- Source attribution bottom-right, muted

ANIMATION NOTES: [Optional — how this would animate in Remotion]
```

### What Makes a Good Prompt

The prompt should answer five questions:
1. **What's the single analytical point?** If you can't state it in one sentence, the illustration is doing too much — split it.
2. **What reads at 2 seconds?** The macro shape, the big numbers, the dominant color relationship.
3. **What reads at 5 seconds?** Labels, annotations, specific data points.
4. **What's the hierarchy?** Biggest/brightest → smallest/dimmest.
5. **Is every text element necessary?** Narration carries the explanation — the visual carries the structure.

### Common Prompt Mistakes

- **Describing aesthetics instead of information.** "Make it look elegant" produces nothing. "Show 6 input streams narrowing to 2 through a labeled chokepoint" produces information design.
- **Too many elements.** SVG illustrations work best with 5-15 distinct elements. More than that → use a Remotion template (DataChart, FrameworkDiagram) instead.
- **Inventing new visual conventions.** If the visual vocabulary defines how "nation" or "flow" looks, use that — don't invent a new representation. Consistency across the episode matters more than any single frame's cleverness.
- **Requesting organic shapes.** "Draw a realistic hand gripping a chip" will produce something awkward. "Show a narrowing gate constricting a supply flow" achieves the same analytical point with geometric strength.
- **Forgetting the narration context.** The illustration doesn't need to be self-explanatory. The viewer is hearing narration. The visual supports comprehension, it doesn't replace it.

---

## 4. Generation Workflow

All SVG generation happens in Cowork via Claude. This is free, immediate, and iterative.

### Process

1. **Write the prompt** using the template above, referencing the visual vocabulary.
2. **Generate at 1920×1080** from the start. Don't sketch at 700px and upscale — proportions shift.
3. **Audit the first draft** against the polish checklist (Section 5). First drafts typically nail the concept but miss spacing/typography details.
4. **Revise.** Common cycle: round 1 = concept, round 2 = spacing + typography + grid, round 3 = polish (shadows, glows, gradient fades). Expect 2-3 rounds.
5. **Cross-check vocabulary consistency.** If this episode already has illustrations, compare recurring elements (nation nodes, flow styles, icon sizes) against earlier frames.

### When a Concept Doesn't Work as SVG

If after 2 revision rounds the illustration still looks awkward — usually because the concept demands organic shapes or artistic texture — don't force it. Options:

- **Reframe geometrically.** "A hand strangling a chip" → "A narrowing gate constricting a supply flow." Same analytical point, SVG-native form.
- **Decompose into simpler parts.** A complex scene might work as 2-3 sequential frames, each showing one relationship.
- **Fall back to other tracks.** Use a stock photo (Track B) with brand treatment, or a Remotion template (Track A) that handles the data differently.
- **Hold on narration.** A well-designed title card or Remotion composition held for 4-6 seconds while narration carries the weight is completely fine. Not every moment needs a bespoke illustration.

---

## 5. Polish Process

Every SVG illustration must pass the same quality gate as Remotion templates. A sloppy illustration breaks the brand faster than no illustration.

### Polish Audit Checklist

Run this against every illustration before it enters production:

**Layout (from POLISH.md)**
- [ ] Canvas is 1920×1080
- [ ] 80px safe area respected on all sides
- [ ] All spacing values are multiples of 8
- [ ] Content fills ≤80% of safe area
- [ ] Title-to-content gap is 48px
- [ ] Source attribution at bottom-right in muted text

**Typography (from POLISH.md)**
- [ ] Exactly 3 text tiers (no more, no less)
- [ ] Primary: ≥48px, Space Grotesk 700, letter-spacing 2px+
- [ ] Secondary: 22-28px, Space Grotesk 400-500
- [ ] Tertiary: 14-18px, IBM Plex Mono or JetBrains Mono
- [ ] Statistics use JetBrains Mono at 64-96px, weight 700
- [ ] Chinese text is Noto Sans SC at +15% size
- [ ] Color hierarchy: bone → #B8AE9C → #6A6458

**Visual Depth (from POLISH.md)**
- [ ] Background is gradient, not flat
- [ ] Content elements have subtle shadow or glow where appropriate
- [ ] Dividers use gradient fade at edges
- [ ] Accent elements have colored glow (feGaussianBlur filter)
- [ ] No flat rectangles on flat background — everything has depth

**Brand Compliance (from BRAND.md)**
- [ ] Only Meridian palette colors used (no stray hex values)
- [ ] ∴ brand mark appears in metadata strip
- [ ] Episode and beat reference in footer
- [ ] Semantic colors used correctly (rust for conflict, amber for highlight)

**Visual Vocabulary Compliance (from Section 2)**
- [ ] Recurring elements match their canonical form
- [ ] Same element looks the same as in other illustrations this episode
- [ ] Color encodes meaning consistently (same nation = same color everywhere)
- [ ] Icon sizes follow the importance hierarchy (primary 25-30% larger)

**Information Design**
- [ ] The analytical point is clear at a 2-second glance
- [ ] Every text element earns its place
- [ ] Visual hierarchy guides the eye: biggest/brightest → smallest/dimmest
- [ ] No orphaned labels (every label clearly connects to what it describes)
- [ ] Data is accurate (cross-reference against research brief)

### Common Polish Fixes

These come up in almost every first draft:

1. **Spacing not on 8px grid.** Eyeballed values like y="175" or font-size="13". Fix: round to nearest 8px multiple for positions, use the type scale for sizes.
2. **Too many opacity levels.** Creates visual noise. Limit to 4 distinct opacity values per illustration (e.g., 0.85, 0.55, 0.3, 0.15).
3. **Flat background.** Easy to forget. Always: `<radialGradient>` from #1A1A2E center to #0D0D1A edges.
4. **Labels too small or too large.** Tertiary tier (14-18px) is for labels. If labels are at 7-9px, invisible on video. If at 24px+, competing with secondary tier.
5. **No breathing room.** The illustration feels cramped. Delete the least important element. If everything is important, the illustration is doing too much.
6. **Inconsistent line weights.** Primary structural lines: 1.5-2px. Secondary detail: 0.5-0.8px. Decorative: 0.2-0.3px. Avoid exactly 1px (splits pixels at 1080p).
7. **Visual vocabulary drift.** A nation node that was 48px in illustration 1 is suddenly 36px in illustration 3. Cross-check.
8. **Curved lines that don't connect.** Bezier curves are hard to align with node edges. Default to straight lines. If a curve is truly needed (rare), verify both endpoints visually connect to their target nodes.
9. **Decorative shapes that read as noise.** Triangles, wedges, and complex polygons often look like rendering artifacts at video resolution. Stick to circles, rectangles, hexagons, and straight lines. If a shape isn't immediately recognizable, simplify it.
10. **Flag icons.** Never attempt miniature flags — they're illegible at 1080p and add visual noise. Semantic color on the node border + text label is sufficient.

---

## 6. Remotion Integration

### Option A: Static SVG Frame (simplest)

Save the SVG to `remotion-templates/public/illustrations/<slug>/` and reference it as a static image in a composition.

```tsx
import { Img, staticFile } from 'remotion';

<Img src={staticFile('illustrations/ep01/chokepoint-flow.svg')} 
     style={{ width: '100%', height: '100%' }} />
```

Best for: illustrations that appear as full-screen backgrounds or insets without internal animation.

### Option B: Animated SVG Composition (recommended)

Convert the SVG into a React component where individual elements animate with Remotion's `useCurrentFrame()`, `interpolate()`, and `spring()`.

Animation strategy mirrors POLISH.md rules A1-A7:
1. **Structure first** — background, grid, dividers fade in (frames 0-15)
2. **Primary content** — main visual elements enter with spring physics (frames 10-40)
3. **Data layer** — labels, annotations, statistics enter with stagger (frames 30-60)
4. **Ken Burns hold** — subtle scale drift 1.00→1.02 over remaining duration
5. **Exit** — last 15 frames fade opacity to 0

### Option C: Hybrid (SVG + Remotion overlay)

Use the static SVG as a background layer, then overlay Remotion-animated elements (MetadataStrip, Crosshair, animated annotations). Gets the visual quality of a polished SVG with Remotion's animation capabilities.

### File Organization

```
remotion-templates/
├── public/illustrations/
│   └── ep01/
│       ├── chokepoint-flow.svg              ← polished static SVG
│       ├── chess-vs-go.svg
│       └── supply-chain-network.svg
├── src/illustrations/
│   └── ep01/
│       ├── ChokepointFlow.tsx              ← animated React version
│       └── SupplyChainNetwork.tsx
└── data/episodes/ep01/
    └── illustration-manifest.json          ← maps script moments to files
```

### illustration-manifest.json

```json
{
  "episode": "EP01",
  "illustrations": [
    {
      "id": "chokepoint-flow",
      "beat": 3,
      "script_moment": "Semiconductor supply chain constriction",
      "file_svg": "public/illustrations/ep01/chokepoint-flow.svg",
      "file_component": "src/illustrations/ep01/ChokepointFlow.tsx",
      "integration": "animated-component",
      "duration_sec": 8,
      "animation_notes": "Flow bands draw in L→R, gate narrows at 1s, stats count up at 2s"
    }
  ]
}
```

---

## 7. Quality Examples

### What "production-ready" looks like

A production-ready SVG illustration for Parallax:
- Communicates its analytical point in 2 seconds at 1080p
- Has exactly 3 typography tiers, all on the type scale
- Uses ≤4 colors from the Meridian palette (plus their opacity variants)
- Has breathing room — ≥20% of safe area is negative space
- Has depth — gradient background, subtle glows, no flat-on-flat
- Has a clear visual hierarchy — your eye goes to the right place first
- Uses visual vocabulary consistently — same elements look the same as elsewhere in the episode
- Includes metadata strip (episode, beat, brand mark)
- Every element earns its place — nothing decorative without information value

### What "not ready" looks like

- Text at non-standard sizes (7px, 13px, 37px)
- Flat #1A1A2E background with no gradient
- Spacing that doesn't align to 8px grid
- More than 3 text size tiers
- Cramped layout with <10% negative space
- Orphaned labels not clearly connected to their referent
- Colors outside the Meridian palette
- Organic shapes that look mechanical (hands, faces, nature)
- Visual vocabulary inconsistency (China is rust in frame 1, amber in frame 3)
- Missing metadata strip

---

## Appendix A: SVG Technical Reference

### Fonts in SVG

SVG `<text>` elements reference fonts by family name. For Remotion rendering, fonts must be loaded via `@remotion/google-fonts` or `@remotion/fonts`.

```
Display/titles:  font-family="'Space Grotesk', sans-serif"
Labels/data:     font-family="'IBM Plex Mono', monospace"
Statistics:      font-family="'JetBrains Mono', monospace"
Chinese:         font-family="'Noto Sans SC', sans-serif"
```

### SVG Filters for Depth

Standard depth effects as reusable SVG filter definitions:

```xml
<!-- Drop shadow for content panels -->
<filter id="panelShadow">
  <feDropShadow dx="0" dy="2" stdDeviation="12" flood-color="#000" flood-opacity="0.25"/>
</filter>

<!-- Accent glow for highlighted elements -->
<filter id="accentGlow">
  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
  <feColorMatrix in="blur" type="matrix"
    values="0 0 0 0 0.90  0 0 0 0 0.65  0 0 0 0 0.27  0 0 0 0.3 0" result="glow"/>
  <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>

<!-- Rust/conflict glow -->
<filter id="conflictGlow">
  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
  <feColorMatrix in="blur" type="matrix"
    values="0 0 0 0 0.76  0 0 0 0 0.23  0 0 0 0 0.13  0 0 0 0.35 0" result="glow"/>
  <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
```

### Background Template

Every dark-mode illustration starts with this:

```xml
<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgVig" cx="50%" cy="45%" r="58%">
      <stop offset="0%" stop-color="#1A1A2E"/>
      <stop offset="100%" stop-color="#0D0D1A"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bgVig)"/>
  
  <!-- Safe area: 80px inset → content within 80,80 to 1840,1000 -->
  <!-- Title block: y=80 to y=200 -->
  <!-- 48px gap -->
  <!-- Content area: y=248 to y=880 -->
  <!-- Metadata strip: y=1000+ -->
</svg>
```

---

## Appendix B: Future — Raster API Generation

When the channel is ready to expand beyond Claude SVG, external image generation APIs can handle concepts that require organic shapes, artistic texture, or scene composition. This is documented here for future reference but is **not part of the current workflow**.

Candidates researched (April 2026 pricing):
- **Recraft V4** — $0.08/vector, $0.04/raster. True SVG output from prompts. Best for artistic vector illustration.
- **Flux 2 Pro** — $0.055/image. Detailed raster output. Would go through treat.py for brand treatment.
- **GPT Image 1.5** — ~$0.07/image. Strong text rendering within images.

At 5-10 illustrations per episode, cost would be $1.50-4/episode — negligible. The trigger to add this tier: when Claude SVG consistently can't handle a recurring visual need across multiple episodes.
