# Worlds, objects and overlays — eight-study comparison

Open the [complete gallery](index.html) to compare eight settled stills and eight six-second Remotion clips. Use **Play both from start** for paired motion, **Compare stills** for visual comparison, and **Enlarge still** for detail.

This batch extends the existing painted constructivist direction into scenery, isolated objects, overlays and analytical backgrounds. It is an exploratory set; no treatment has been selected for production.

| Pair | What changes | What is held consistent |
| --- | --- | --- |
| 01–02 Scenery | Observed landscape versus simplified architectural theatre | River crossing motif, camera and six-second movement; generated geometry varies |
| 03–04 Objects | Ordinary ochre cup versus surreal architectural interior | Comparable visible size, paper field, arrival, whole-object drift and authored shadow; silhouettes vary slightly |
| 05–06 Overlays | Analytical drawing versus theatrical foreground wings and pale wash | Identical source PNG and fixed camera |
| 07–08 Backgrounds | Light versus dark painted field; foreground colors adjusted for contrast | Identical chart geometry, labels, synthetic values and animation timing |

## Current assessment

Architectural theatre is a stronger continuation of the graphic identity than the natural landscape. The latter is attractive but familiar, with more foliage, masonry and water detail than the brief intended. The first architectural edit retained too much of that description; the gallery uses the more economical **02b** revision and retains the first attempt for comparison. The revision has four visible piers despite a prompt requesting three; its support is readable, but exact-count compliance is imperfect.

The cup cutaway is the most distinctive conceptual image in this batch. It gives us a vocabulary for inner worlds and hidden structures without depending on difficult character interaction. Its interior is deliberate fantasy, not a factual diagram. Both cups have stronger material texture than our flatter character studies; they still need a consistency decision before becoming recurring assets.

The analytical overlay is the most useful connection between painted scenery and explanation. The theatrical foreground can frame a point of view, but is less generally useful and can feel imposed on the scene. The light painted field is the most immediately reusable background. Both chart plates reserve the middle for evidence; the dark plate may benefit from less texture when graphics become dense.

The [combined 26-second Remotion sequence](../combined-sequence/index.html) now tests ordinary object → impossible interior → analytical annotations → diagram on matching painted paper. It is picture only, with draft narration cues. Scenery, recorded narration and consistency with the character treatment remain further integration tests.

## Assets and motion

Seven raster outputs were made with the **built-in image generation tool**: six requested source paintings plus one retained architectural revision. The tool does not expose an exact model identifier or seed. Originals remain in the generated-images directory; project copies preserve their bytes. [studies.json](studies.json) records the full prompts, input images, original paths, dimensions, hashes and source mapping. The exact prompt files are in [prompts/](prompts/).

The generated object alpha channels are preserved. The apparent halo in the raw preview is absent when composited over the tested light and dark fields; see the [cutout check](qa/alpha.html). No programmatic image cleanup was applied.

All eight clips use the installed **Remotion 4.0.457**, at 1920×1080, 30 fps, 180 frames, without audio. H.264, CRF 16, yuv420p and BT.709 tags; PNG frame intermediates. The camera, shadow, SVG overlays, type and chart are authored. Shared palette, type and motion constants come from the existing Parallax design system. Chart values C=80, B=60, A=35 are explicitly synthetic and appear only as a layout test.

The scenery is flattened. The objects move as whole cutouts. This is a compositing and authored-motion test, not AI image-to-video, internal object animation, independent water motion or segmented scenery parallax. There were no fal.ai calls in this batch.

## Reproduce

Source: [isolated Remotion entry](../../../../remotion-templates/research/world-objects-overlays/entry.tsx), [renderer](../../../../remotion-templates/research/world-objects-overlays/render.mjs), [gallery builder](../../../../remotion-templates/research/world-objects-overlays/gallery.mjs), [QA script](../../../../remotion-templates/research/world-objects-overlays/qa.mjs).

From `remotion-templates/`:

```sh
node node_modules/typescript/bin/tsc -p research/world-objects-overlays/tsconfig.json
node research/world-objects-overlays/render.mjs
node research/world-objects-overlays/gallery.mjs
node research/world-objects-overlays/qa.mjs
```

The render and QA scripts accept `PARALLAX_BROWSER` to override the installed local Chromium path. The renderer supports `--only=3,4` and `--stills-only`. A lossless FFmpeg pass completes H.264 color metadata after rendering; `PARALLAX_FFMPEG` overrides its local executable path. The isolated entry leaves production registrations and episode manifests untouched. The temporary `.bundle/` is ignored locally and can be rebuilt by the renderer.

Verification results: [QA report](qa/report.md), [machine-readable checks](qa/checks.json), [render log](qa/render.log).

Earlier context: [all identity directions](../../2026-10-10/all-directions.md) and [character pose-reference test](../character-motion/pose-first-test/index.html).
