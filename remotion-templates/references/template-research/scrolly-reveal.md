# ScrollyReveal — Template Dossier

**Template:** `ScrollyReveal`  
**Family:** Typography & visuals  
**Schema:** `src/templates/ScrollyReveal/schema.ts`  
**Component:** `src/templates/ScrollyReveal/ScrollyReveal.tsx`  
**Shared component:** `src/components/AnnotationSVGLayer.tsx`  
**Shipped:** May 20, 2026

---

## Editorial argument

**Progressive disclosure on a fixed visual.** The base image anchors the viewer; annotations appear sequentially as the narration names each element. The key editorial discipline: the visual is revealed *in the order the argument requires*, not all at once.

This is the video adaptation of "scrollytelling" — the form popularized by NYT Graphics, The Pudding, and Reuters Graphics for web articles where scrolling triggers annotation reveals. In video, `revealAtSec` replaces scroll position.

**Distinction from AnnotatedImage:**
- **AnnotatedImage:** All callouts fixed; moderate stagger (a few tenths of a second per callout); static image; editorial function is "here are the things in this image."
- **ScrollyReveal:** Steps can span many seconds; each step can include a pan/zoom focus transition to a region; editorial function is "let me build the argument by directing your attention in sequence."

Use when:
- The argument requires showing 3+ distinct elements of a visual in sequence, with enough time (≥1s) between each for the narrator to make a point
- The visual requires guiding the viewer's eye to specific regions (focus pan/zoom)
- The build-up IS the editorial argument ("first here, then here, then here — and now you see the whole pattern")

---

## State-of-the-art editorial reference

**NYT Graphics** canonical form: a satellite or documentary photograph that gets progressively labeled as voiceover names each element. Examples:
- "A drone's-eye view of the battlefield" — satellite imagery with 4-6 sequentially revealed location callouts
- "The anatomy of a market crash" — chart with 5 annotated moments, revealed over ~20s of narration

**Reuters Graphics / AP Visual** use a similar progressive-annotation form for maps: a region map that gets labeled districts, then tactical positions, then supply routes — each appearing as the narrator names it.

**The Pudding** uses CSS scroll-triggered reveals in web format; ScrollyReveal is the direct video equivalent.

Key conventions from these references:
- **One focus per step** — don't zoom to multiple regions in a single step; one cognitive unit per beat
- **Accumulate by default** — previous annotations remain visible; "replace" mode loses the cumulative argument
- **Gold/accent callouts for primary elements** — neutral gray for context elements the narrator mentions but doesn't emphasize
- **Highlight type for regions, callout type for points** — a city gets a dot+leader; a territory gets a semi-transparent rect
- **3–6 steps is optimal** — fewer than 3 could just be AnnotatedImage; more than 6 becomes hard to follow without a visual legend

---

## Parallax defaults

| Field | Default | Rationale |
|-------|---------|-----------|
| `durationSec` | `14` | 3–4 steps at ~3–4s each |
| `backgroundVariant` | `"dark"` | Image-based compositions pop on dark; annotations are more legible |
| `annotationMode` | `"accumulate"` | Cumulative argument — previous annotations ground the viewer |
| `focus.durationSec` | `0.6` | Enough to read as intentional motion; too slow (>1s) breaks rhythm |
| `annotation.color` | `palette.gold` | Primary element color |
| `annotation.placement` | `"top"` | Default; most legible when dot is in the lower half of the image |

---

## `AnnotationSVGLayer` shared component

`src/components/AnnotationSVGLayer.tsx` — reusable full-canvas SVG annotation overlay.

**Used by:** ScrollyReveal (primary). Future templates that need progressive annotation can import it directly rather than re-implementing callout geometry.

**Annotation types:**
- `"callout"` (default) — filled dot (r=7px) + 60px leader line + label text + optional detail
- `"highlight"` — semi-transparent rect (25% opacity fill + 60% opacity stroke) approximating a region

**Reveal stages** (per `revealProgress` 0→1):
- 0.0–0.3: dot appears
- 0.3–0.6: leader line draws (linear interpolation on endpoint)
- 0.6–1.0: label fades in

**Accumulate mode:** all annotations with index < activeCount visible at their revealProgress.  
**Replace mode:** only current step's annotations at full revealProgress; previous annotations fade to 0 over 0.3s after the next step fires.

---

## Focus pan/zoom mechanics

Each step can have a `focus` block that specifies a region to zoom into:

```json
"focus": {
  "centerX": 48,    // 0-100% of image width
  "centerY": 42,    // 0-100% of image height
  "scale": 1.4,     // zoom level (1.0 = full frame, max 2.5)
  "durationSec": 0.7
}
```

Implementation: CSS `transform: scale(S) translate(tx, ty)` on the image container, interpolated from the previous step's focus (or identity) using `Easing.out(Easing.cubic)` over `durationSec`. The transform centers the viewport on `(centerX%, centerY%)` of the image.

**Editorial guidance:**
- `scale: 1.0` = full frame (use for the "wide shot" to end an argument or show context)
- `scale: 1.3–1.5` = mild regional zoom — clearly different from full frame, doesn't feel too tight
- `scale: 2.0+` = close detail zoom — use sparingly; requires the image to have sufficient resolution for the focused region
- Avoid jumping from 1.0 directly to 2.5 — intermediate focus steps help the viewer track location

---

## `revealAtSec` authoring

Steps should be authored to match narration rhythm. Guidelines:
- First step: `revealAtSec: 1.0–2.0` — give the viewer time to see the base image before annotation
- Between steps: 3–5s minimum (time for narrator to make one argument point)
- Last step: should fire no later than `durationSec - 2.5` (leave time for final annotation to settle before exit fade)
- Steps must be in ascending `revealAtSec` order — schema `warnIf` validates this

**`syncPoints` integration (D17):**
When `_direction.syncPoints` is set, each syncPoint maps to a step's reveal time via `anticipatoryStartFrame`. The step's annotation settles 150ms before the narrator names it — the same pattern as AnnotatedImage callouts.

---

## Annotation mode selection

| `annotationMode` | When | Editorial effect |
|---|---|---|
| `"accumulate"` (default) | Argument builds on itself; all elements matter together | "Now you can see all three chokepoints simultaneously" |
| `"replace"` | Each step stands alone; previous context distracts | Documentary-style: show one thing clearly, then move on |

Use `"replace"` sparingly — it requires the viewer to hold previous context in memory. `"accumulate"` is almost always more editorial-clear for geopolitical analysis.

---

## Catalog fixtures

- `data/episodes/catalog/scrolly-reveal-taiwan-chokepoints.json` — Taiwan Strait: TSMC fabs → Port of Kaohsiung → Strait width (3 steps, accumulate, 14s, dark register)
- `data/episodes/catalog/scrolly-reveal-sanctions-mechanism.json` — Russia sanctions bypass anatomy (4 steps: energy cutoff → SWIFT exclusion → price cap → bypass routes), accumulate, 16s

---

## When NOT to use

- Small number of annotations (≤2) with no focus motion → **AnnotatedImage** (simpler, lighter)
- Non-image base (SVG diagram, map) → use a map template with `MapAnnotations` or a diagram template with `syncPoints`; ScrollyReveal is for photographic/raster image bases
- Side-by-side comparison needed → **ComparisonPair** or **SplitFrame**
- Annotations are the PRIMARY content (not overlays on an image) → **AnnotatedImage** or **FrameworkDiagram**
- More than 8 steps → split into two separate ScrollyReveal compositions; a single 8+ step scroll becomes hard to follow at video scrubbing speed

---

## Relationship to AnnotatedImage

AnnotatedImage and ScrollyReveal address the same visual form but at different editorial intensities:

| | AnnotatedImage | ScrollyReveal |
|---|---|---|
| **Step count** | Implicit (all callouts, staggered) | Explicit steps (min 1, recommended 3-6) |
| **Step timing** | Tight stagger (0.3–0.5s per callout) | Narrative-paced (3-5s per step) |
| **Pan/zoom** | No (static image, KenBurns at composition level) | Yes (per-step focus transform) |
| **Mode** | Always accumulate | Accumulate or replace |
| **When** | "Here are the things" | "Let me walk you through the argument" |
