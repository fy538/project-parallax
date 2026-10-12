# SplitFrame Template Dossier

> Last updated: May 19, 2026
> Template path: `src/templates/SplitFrame/`
> Catalog ID: `SplitFrame`

---

## What it does

Renders any two registered templates side by side in a single composition frame. The primary composition primitive for Parallax's "then vs now" / "here vs there" / "A versus B" editorial register. Replaces all hand-built per-pair split layouts with a single data-driven primitive.

---

## When to use

**Use SplitFrame when:**
- The argument IS the comparison — two data states, two analytical lenses, two historical moments
- The contrast is visual, not just statistical — two rendered templates tell more together than either does alone
- You need exact symmetry or asymmetry (ratio) between the two sides
- The same template on both sides (DataChart vs DataChart, StatReveal vs StatReveal)
- Different templates on each side (Syllogism on left, DialecticFlow on right)

**Use SplitComposition (v1) instead when:**
- Both sides are *text-content* only (title + items[] + subtitle)
- You need the cinematic "spotlight" focus-per-side animation
- The content is authored as `{ left: SplitSide, right: SplitSide }` prose

**Use ComparisonPair instead when:**
- You want a pane-label + caption layout with vertical centering and consistent scaling
- Both sides use one of ComparisonPair's 10 supported templates
- You want the panes centered in the frame (not full-bleed)

---

## Editorial reference

Bloomberg's election-night split screen (two state maps), NYT Upshot's "then vs now" population pyramids, FT's "two economies compared" DataChart duets, Reuters' "before/after" annotated-image splits. All follow the same editorial principle: juxtaposition within a single frame is more visually powerful than two sequential cuts.

The key distinction from a simple cut: the viewer sees both states *simultaneously*, enabling direct comparison of scale, proportion, and visual weight. A sequential cut requires memory; a split frame requires only perception.

---

## Pane scaling

Each pane renders its template at native **1920×1080** then CSS-scales it to fit the pane width:

```
scale = paneWidth / 1920
scaledH = 1080 × scale
verticalOffset = (1080 − scaledH) / 2   ← centers the card in the pane
```

For the default 50/50 split:
- `paneWidth` = (1920 − 4px divider) / 2 = 958px
- `scale` ≈ 0.499 (≈50%)
- `scaledH` ≈ 539px — card floats with ~270px of background above/below

The pane container has `overflow: hidden`, so the child template's chrome (HeaderStrip, FooterStrip) is visible at scale but contained within the pane boundary. This is the "two editorial cards on a desk" aesthetic.

### `paneFit: "cover"` (added Oct 10, 2026)

The default above (`"contain"`) is right for charts and diagrams, where nothing may be cropped. For full-bleed **image** panes it leaves two small letterboxed pictures in a mostly empty frame. `"paneFit": "cover"` scales each template to the pane's **height** instead and crops the sides:

```
windowH = 1080 − 190px caption strip (0 when the pane has no caption)
scale   = windowH / 1080          ← ≈0.82 with a caption
crop    = centred on pane.focusX  ← fraction of the template's width, default 0.5
```

Captions sit in the strip under the picture at 36px serif italic. The paper's ruled border is dropped. Use `focusX` per pane to keep the subject in the half-width window (a 16:9 still shows about 61% of its width). First use: `ai-care-motives/shop-motif-reasons.json`.

---

## Pane labels

Labels appear as corner badges on the PANE (not inside the scaled template). They're full-size text positioned above/below the template card.

```json
"label": "1914",
"labelPosition": "top-left"   // "top-left" | "top-right" | "bottom-left" | "bottom-right"
```

Defaults: left pane → `top-left`, right pane → `top-right`.

`captionSwap: { text, atSec }` (per pane, added Oct 10, 2026) replaces a pane's caption in place. Use it when the picture should hold and only the words change, instead of cutting to a second card with the same picture (which restarts its drift and makes it jump).

`revealAtSec` (per pane, added Oct 10, 2026) brings a half in on the sentence that introduces it: its badge appears then, its caption 0.8s later, and with `paneFit: "cover"` the picture sits under a 45% ink veil until that moment.

A badge on the frame's outer edge is inset to the title-safe area (96px from the side, 72px from the top); a badge against the divider is inset 24px. Move a badge to the other corner when it would cover a face.

Good label values: era years ("1914", "2024"), short lens names ("WESTERN", "CHINESE"), states ("THEN", "NOW"), ordinals ("ACT I", "ACT II").

---

## Sync strategies

### `"simultaneous"` (default)
Both templates share the same Remotion frame clock. Both animate in together at frame 0. Duration = `data.durationSec`.

**Use for:** Two data states of the same *moment in time* — both templates reveal together, creating visual symmetry.

Example: GDP 1990 | GDP 2024. Both DataCharts animate their bars together — the viewer's eye bounces between the two sizes simultaneously.

### `"sequential"`
Left pane plays for `left.data.durationSec` frames; then right pane's clock starts. Left template is still visible (frozen at last frame) while right animates.

**Use for:** "First establish context, then the contrast lands."

Example: historical source (left — TelegramCable of Kennan's Long Telegram, 12s), contemporary parallel (right — StatReveal of current NATO spending, 8s). The telegram reads first, then the budget number reveals into the waiting right pane.

---

## Ratio

`ratio` controls what fraction of the 1920px frame the left pane occupies. Default 0.5.

| ratio | Layout | Use case |
|-------|--------|----------|
| 0.5 | 50/50 | Symmetric comparison — equal analytical weight |
| 0.4 | 40/60 | Right side is the "answer"; left is the "setup" |
| 0.6 | 60/40 | Left side carries more editorial weight |
| 0.33 | 33/67 | Left is a thumbnail/context card; right is the main argument |

For asymmetric splits, consider which side the viewer's eye should rest on. The larger pane wins visual attention.

---

## Divider

The `4px` gold divider line is always full-height (1080px). Optional centered badge:

```json
"divider": true,
"dividerLabel": "vs"   // "vs" | "→" | "↔" | "THEN / NOW" | "" (bare line)
```

Set `"divider": false` for a seamless edge-to-edge split — no gold line, no badge. Use when both panes are the same template type and the visual contrast speaks for itself (no "vs" needed).

---

## Catalog fixtures

| Fixture | Left pane | Right pane | Demonstrates |
|---------|-----------|-----------|--------------|
| `split-frame-defense-budgets.json` | StatReveal ($17B, 1914) | StatReveal ($886B, 2024) | Same template, dramatic scale contrast |
| `split-frame-argument-forms.json` | Syllogism (Mearsheimer) | DialecticFlow (IR debate) | Different templates, argument juxtaposition |
| (index.tsx defaultProps) | StatReveal (1914 defense) | StatReveal (2024 defense) | Standalone catalog preview |

---

## PANE_COMPONENTS registry

SplitFrame.tsx imports templates directly (no dependency on FullEpisode's TEMPLATE_COMPONENTS — avoids circular imports). Current count: **~60 templates**.

Excluded from PANE_COMPONENTS:
- `SplitFrame` itself — no recursive splits
- `TitleTransition` — not a content template; it IS a transition
- `MorphTransition` — transition primitive, not standalone pane content

When adding a new template to the Parallax template library:
1. Add to `TEMPLATE_COMPONENTS` in `FullEpisode.tsx`
2. Add to `PANE_COMPONENTS` in `SplitFrame.tsx` if it should be usable as a pane
3. Add to `TEMPLATE_SCHEMAS` in `templateSchemas.ts`
4. Register in `Root.tsx`

---

## Known constraints

**Double chrome at small scales.** Each child template renders its own HeaderStrip and FooterStrip at 50% scale. At the default 50/50 split, these mini-chrome bars add visual texture to each pane card. This is intentional (the "two editorial documents" aesthetic) but can be suppressed in future work by passing a `noBrandChrome` prop if templates support it.

**Sequential mode — left pane freeze.** After `left.data.durationSec` frames, the left template is frozen at its final frame (Remotion's natural behavior for Sequences that have ended). The right pane then animates. The frozen left template remains visible as context — this is intentional.

**No recursive splits.** SplitFrame panes cannot be SplitFrame. Use ComparisonPair for nested grid layouts.

**Map templates require network.** Panes using ChoroplethMap, CinematicMap, DensityMap, etc. require Mapbox tile access. These work in Lambda and Studio but not in fully sandboxed environments. The LESSONS.md note on MapGL applies.

---

## generate_manifest.py wiring

In an assembly manifest, a SplitFrame segment looks like:

```json
{
  "type": "TEMPLATE",
  "startSec": 42.0,
  "endSec": 54.0,
  "template": {
    "component": "SplitFrame",
    "dataFile": "split-frame-defense-budgets.json"
  }
}
```

The `dataFile` must contain a valid `SplitFrameDataSchema` object. Both pane `data` objects are inlined within the SplitFrame data file — there are no separate pane data files to reference.

`TEMPLATE_AUDIO_MAP` entry in `generate_manifest.py`: `SplitFrame → ("section-open", "subtle", None, None)` — a quiet section-open cue at the entrance, no key-moment cue (pane templates handle their own animation events).
