# A painted argument — combined Remotion study

[Watch and inspect the sequence](index.html) · [Download the MP4](renders/painted-argument.mp4)

A 26-second, picture-only sequence connects the ordinary cup, architectural cutaway, analytical overlay and light painted field from the [eight-study batch](../world-objects-overlays/index.html). Its argument is qualitative: different possible reasons can produce the same outward action. The interior is explicitly imagined; the diagram does not diagnose an AI's motives.

| Time | Visual and editorial purpose |
| --- | --- |
| 0–6s | Ordinary cup establishes a familiar material object. |
| 6–11s | Direct cut to an impossible interior creates the conceptual turn. |
| 11–18s | The cup settles smaller, allowing drawn leaders to separate observation from interpretation. |
| 18–26s | The cup moves aside while concern and incentive converge on a helpful act in an authored diagram. |

The fixed paper plate, palette, typography and contact shadow hold the sequence together. Object placement, line reveals and pacing are deterministic Remotion animation. The two cup silhouettes differ slightly; this is a registered editorial cut between paintings, not a continuous opening or a morph.

The optional narration in [story.json](story.json) is a draft timing aid. It has no recorded voice, word alignment or episode-script approval. “Concern” and “incentive” are illustrative, can overlap and do not exhaust possible reasons. The cup is an editorial metaphor rather than a literal mechanical model.

## Integration implications

This isolated entry uses the existing shared palette, IBM Plex fonts, timing constants and easing. It does not register a new production template or change episode manifests. The study establishes a visual approach that could later be expressed through ImageComposite for object placement, AnnotationSVGLayer for authored leaders and FrameworkDiagram for the explanation. Those production components would need a paint-preserving asset path and explicit timing/data adapters; this study has not implemented those adapters.

The cup's material shading is more detailed than the existing faceted characters. The sequence tests coherence among these three source paintings; consistency with people, other episodes and recorded narration remains to be assessed. Scenery is intentionally absent from this first combined test so the cup can carry one uninterrupted thought.

## Reproduce

From `remotion-templates/`:

```sh
node node_modules/typescript/bin/tsc -p research/combined-sequence/tsconfig.json
node research/combined-sequence/render.mjs
node research/combined-sequence/gallery.mjs
node research/combined-sequence/qa.mjs
```

The renderer supports `--stills-only` and `--video-only`, and `PARALLAX_BROWSER` can override the local Chromium path. It shares the [BT.709 metadata helper](../../../../remotion-templates/research/world-objects-overlays/color.mjs). Render specification: 1920×1080, 30 fps, 780 frames, H.264 CRF 16, PNG intermediates, yuv420p, limited-range BT.709, no audio. `PARALLAX_FFMPEG` and `PARALLAX_FFPROBE` can override the local binaries.

The three source PNGs are referenced directly from the prior batch, with no cleanup or pixel edits. [provenance.json](provenance.json) records their hashes; original prompts and generation provenance remain in [the source batch](../world-objects-overlays/studies.json). No new image generation, AI video generation or paid API calls were made.

Verification: [QA record](qa/report.md), [checks](qa/checks.json), [render log](qa/render.log). Sources: [entry](../../../../remotion-templates/research/combined-sequence/entry.tsx), [renderer](../../../../remotion-templates/research/combined-sequence/render.mjs), [gallery builder](../../../../remotion-templates/research/combined-sequence/gallery.mjs), [QA script](../../../../remotion-templates/research/combined-sequence/qa.mjs).
