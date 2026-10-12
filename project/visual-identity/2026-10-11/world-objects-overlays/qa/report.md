# Visual research QA — 11 October 2026

The final scripted checks passed: seven source records, eight clips and eight gallery studies. See [checks.json](checks.json) for the measured results.

- Every project PNG matches its retained original and recorded SHA-256.
- All eight clips: H.264, 1920×1080, 30 fps, 180 frames, six seconds, yuv420p, no audio, BT.709 matrix/transfer/primaries.
- Three decoded samples per clip (0.5, 3.5 and 5.5 seconds) show the expected motion/reveal changes. The [decoded-frame sheet](motion-frames.html) was visually reviewed.
- All gallery images and videos load. Paired playback, pause, still/motion switching, enlarge and Escape-to-close passed. No broken local gallery links or page errors were found.
- No horizontal overflow at 1440 px desktop or 390 px mobile width. The final [desktop](gallery-desktop.png) and [mobile](gallery-mobile.png) captures use viewport-sized screenshots; a full-page still-mode capture timed out.
- Strict TypeScript checking of the isolated entry and JavaScript syntax checks passed. Production episode files were not changed, so episode-wide tests were not run.

The initial Remotion outputs included only the color matrix tag. Their H.264 metadata was completed by a lossless FFmpeg bitstream pass. This step is now part of the renderer. One supplementary single-study regeneration attempt returned a local Remotion server error after saving its still; the completed eight-clip set was retained and passed final verification. The full successful render log is [render.log](render.log).

## Visual inspection

All eight settled Remotion frames were reviewed. The near-bank label backing was widened after the first render so the full label fits. The cutaway cup was lowered to align its foot with the shared contact shadow. Final object labels use 32 px type. Chart and overlay typography are authored, not generated into the paintings.

The original object PNGs were composited on paper and ink in [alpha.html](alpha.html) and reviewed in [alpha.png](alpha.png). Their silhouettes and handle openings read cleanly in both. Most cup-body alpha values are 245–254, with max 254 rather than 255; the files have been preserved as generated. The broad halo seen in the raw image-tool preview is absent in actual browser compositing.

## Artistic limitations

- The natural landscape is familiar and relatively busy; the architectural revision is more distinctive.
- The selected architectural revision has four visible piers although the prompt requested three. No exact-count compliance is claimed.
- Object material texture is more realistic than the existing flatter character language. The cutaway is an intentional fantasy.
- The spatial overlay is theatrical framing. The underlying scene is a single PNG; no separated scenery parallax was tested.
- Chart values are synthetic. The background test uses the same authored chart in both modes, with colors adjusted for legibility.
- No AI image-to-video, new anatomy study or production identity selection is claimed.
