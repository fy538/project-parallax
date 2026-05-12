# Template Research Dossier — ImageComposite

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

ImageComposite is the right answer when the editorial point is **a single treated photograph with identifying text** — "this is Morris Chang, TSMC founder," "this is the Yalta conference room, February 1945." The form privileges the *whole image* as the subject, with text playing identifying-caption role. Distinct from AnnotatedImage (which calls out specific parts of an image with positioned callouts) and from PhotoMontage (which sequences multiple images). The duotone pipeline aligns the photograph with the Meridian brand temperature.

## Canonical idioms

- **Portrait variant with name + title** — single person, biographical caption (`personName`, `personTitle`). Right for "founder of X," "general at Y." (TODO: NYT obituary-portrait, FT profile-photo references.)
- **Background variant with positioned text overlay** — full-frame treated photograph with `caption` text positioned bottom-left / bottom-right / center. Right for atmospheric establishing moments. (TODO: references.)
- **Inset variant** — image as bordered inset within the editorial frame, with title/subtitle alongside. Right for evidence-document moments (a photo of the actual treaty, the actual document). (TODO: references.)

## Parallax defaults

- Always set `variant` explicitly — the three variants render different layouts.
- Use `duotone: "standard"` by default. Reserve `"conflict"` for war / crisis register; reserve `"editorial"` for analytical / archival register. The treatment carries register weight, not decoration.
- Use the actual subject's photograph — Morris Chang, the actual Yalta room, the actual Politburo session. Generic stock ("businessman silhouette at sunset," "Beijing skyline") is a register break and should route to ILLUST or FOOTAGE rather than ImageComposite.
- For `variant: "portrait"`, both `personName` and `personTitle` should be set. A portrait without identifying text is just a photo.
- For `variant: "background"`, set `textPosition` to land the caption in a low-detail region of the photograph. If the photo has no low-detail region for type, switch to a different image or to `inset` variant.
- Use `grainOpacity` override sparingly — the default (0.12) is calibrated; values above ~0.20 read as period-piece pastiche.
- Always set `source` when the photograph cites an archive (Getty, AP, Wikimedia, family collection). Editorial register depends on provenance.

## Failure mode flags

- **Generic stock photography** — businessman silhouettes, generic city skylines. Demote to ILLUST tag or replace with the actual subject's image.
- **Cluttered overlays** — multiple text elements competing on a single composition. Reduce to one primary text element; if more text is needed, switch to AnnotatedImage (callouts) or a different template.
- **Portrait variant without `personName` / `personTitle`** — viewer doesn't know who they're looking at; the form's identification purpose evaporates.
- **Background variant with `textPosition` over high-detail image regions** — type unreadable. Relocate, add scrim, or pick a different image.
- **`grainOpacity` above ~0.20** — reads as period-piece pastiche rather than editorial treatment.
- **Missing `source` on archival photographs** — provenance break; reject in audit.
- **Decorative use** (image as visual filler when the script could carry without it) — demote to ILLUST or remove.

## Current template alignment

No runtime `warnIf` exists yet for these failure modes — caught by `typography-audit` skill or visual review. The Typography SELECTOR's mode-flags table currently lists `variant: "full-bleed" | "inset" | "portrait"` and a `treatment` field with `(duotone/grain/vignette)` values — that's stale relative to `types.ts`. Actual variants are `"background" | "inset" | "portrait"`, and treatment is split into a `duotone` field (`"standard" | "conflict" | "editorial"`) plus a separate `grainOpacity` number. No `vignette` field exists. TODO: full canonical-idioms research and outlet references for the portrait + atmospheric-establishing-photo genre.

## References

- `TYPOGRAPHY_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/ImageComposite/types.ts` — schema reference
- `IMAGES.md` — duotone pipeline reference
- `typography-audit` skill — runtime audit lens
