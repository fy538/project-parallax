# Template Research Dossier — PhotoMontage

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

PhotoMontage is the right answer when the editorial point is **a sequence of load-bearing photographs presented in rhythmic succession** — an era collage (1950 → 1990 → 2024), a series of leaders, a sequence of crisis-moment dispatches. The form encodes *evidence-over-time* rather than a single moment. Distinct from ImageComposite (single image) and AnnotatedImage (single image with positioned callouts). Each image in the montage receives the full BrandImage treatment (duotone + grain + composite).

## Canonical idioms

- **Era collage with date stamps** — 3+ images spanning a time range, each with a date stamp in `secondaryOverlay` and a contextual label in `overlay`. Right for "look at how this place changed." (TODO: NYT Visual Investigations, Retro Report references.)
- **Sequence of figures or leaders** — three or more portraits with name + title overlays, dissolved between. Right for "the line of succession," "the architects of policy." (TODO: references.)
- **Crisis-moment dispatches** — three or more on-the-ground photographs with stat or caption overlays, cut between for pace. Right for "the day everything changed" beats. (TODO: references.)

## Parallax defaults

- Minimum 3 images. PhotoMontage with 1–2 images should be ImageComposite or two staged ImageComposites.
- Minimum 1.5s `durationSec` per image at scrubbing speed — below that, the viewer can't absorb the image before it dissolves. Cap typical montages at 4–6 images so the sequence doesn't outlast its analytical weight.
- Use `transition: "dissolve"` for atmospheric / archival sequences; `"cut"` for stark / rhythmic sequences; `"wipe-left"` sparingly (it implies forward motion / time advance).
- Set `kenBurns: true` (the default) for held archival images so the eye doesn't perceive frozen footage; set `kenBurns: false` for diagrammatic or document images where motion reads as gimmick.
- Per-image `treatment` should be consistent across the montage unless the editorial point is treatment-shift (e.g., archival "editorial" duotone → contemporary "standard"). Mixed treatments without editorial reason fragment the sequence.
- Always provide `source` at the data level when images come from named archives — provenance is required for evidence register.
- Use `overlay.style: "stat"` for statistic captions, `"label"` for short identifiers, `"caption"` for sentence-length context. Pick one style per montage unless the editorial register demands variety.

## Failure mode flags

- **Fewer than 3 images** — wrong template; use ImageComposite or two staged compositions.
- **Per-image `durationSec` below ~1.5s** — viewer can't absorb the image at scrub speed. Lengthen or drop images.
- **Decorative stock images** in the sequence — demotes the form's evidence register. Replace with load-bearing images or downgrade to an ILLUST sequence.
- **Mixed `treatment` across the montage without editorial reason** — fragments the sequence; reads as inconsistent rather than intentional.
- **`transitionDurationSec` set too long** (> ~0.6s) — the transitions outweigh the images. Default 0.3s is calibrated.
- **Missing `source`** when images come from named archives — provenance break.
- **Inconsistent `overlay.style` across images** without editorial reason — visual rhythm breaks; the eye loses its anchor for where to read.
- **`kenBurns: true` on diagrammatic or document images** — slow drift reads as gimmick on non-photographic content.

## Current template alignment

No runtime `warnIf` exists yet for the failure modes above — caught by `typography-audit` skill or visual review. The Typography SELECTOR's mode-flags table lists `transitions: "dissolve" | "wipe"` — that's stale relative to `types.ts`. Actual field is `transition` (singular) with values `"cut" | "dissolve" | "wipe-left"`. TODO: full canonical-idioms research and references for the era-collage / leader-sequence genres.

## References

- `TYPOGRAPHY_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/PhotoMontage/types.ts` — schema reference
- `IMAGES.md` — BrandImage pipeline reference
- `typography-audit` skill — runtime audit lens
