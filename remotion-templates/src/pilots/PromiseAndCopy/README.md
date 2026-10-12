# Promise and copy — visual workflow pilot

A 73.8-second thought experiment: a machine promises to protect a forest, then two successors inherit its memories. The same illustration and objects remain while their relationships change. This is a fictional philosophical prompt, not a claim about current AI consciousness or a demonstration of alignment.

The visual vocabulary is deliberately small: a code-drawn forest, persistent mind symbols, a fork, drawn connections, emphasis changes, and brief annotations. It uses the existing Meridian palette, Plex fonts, `DrawOnPath`, and anticipatory reveals. No new dependencies, model calls, paid assets, or Remotion upgrade.

## Watch or edit

The rendered film is `remotion-templates/out/promise-and-copy/promise-and-copy.mp4` (1920×1080, 30 fps, H.264/AAC). The voice is **synthetic scratch narration**, generated locally with macOS Samantha for pacing. The film labels it accordingly.

From `remotion-templates/`:

```sh
npm start -- --no-open --port=3000
```

Open http://localhost:3000/promise-and-copy, or choose **Current → promise-and-copy**. Open **Props → Schema** if the right panel is hidden.

| Control | What changes |
|---|---|
| `title`, `labels` | Main title, promise, actor names, forest label |
| `imageSrc` | A replacement image path relative to `public/`, e.g. `pilots/my-forest.png`. Empty restores the code-drawn forest. |
| `positions` | Actor coordinates, forest center and size; connections follow their endpoints |
| `pauses` | Seconds of silence **before each named passage**; later audio and visual cues shift together |
| `endingHoldSec` | Final reflection time after the last sentence |
| `narrationVolume` | Scratch voice level, including zero for a silent visual review |

**Persistence:** on the installed Remotion 4.0.457, committing a Schema field (Tab/blur for text, Enter for a number) writes its value to the inline `defaultProps` in `src/Root.tsx`. There is no separate Save button in this tested form. Studio may compact the object onto one line. Close and reopen the tab to confirm changes. Command-line renders then use the same saved values. Keep these default props as an inline literal; replacing them with an imported constant can break Studio's source writer.

The range constraints prevent obvious out-of-frame placement, but this is not an automatic layout engine. Review a frame after moving objects or making labels longer. Image paths require an existing file under `public/`; this pilot has no asset-upload UI. Label edits do not rewrite spoken audio.

## Change the narration

Edit `narration.json` here, then run from `remotion-templates/`:

```sh
node scripts/promise-copy-scratch.mjs
```

Requires macOS `say`, `ffmpeg`, and `ffprobe`. It regenerates six WAVs under `public/pilots/promise-and-copy/` and their measured durations/text in `audio-manifest.json`. The included WAVs render on other platforms without `say`. Optional environment variables: `PILOT_VOICE` and `PILOT_RATE` (defaults Samantha and 150).

The timeline combines measured clip lengths with the saved pauses. Audio and visual state use that single timeline; changing a passage length moves every later cue. Each clip rounds up to whole frames to preserve its final syllable. Reveals settle before the passage begins. **These are passage cues, not word-level Whisper alignment.** A final human voice pass would require replacing the clips and updating measured durations, or integrating the existing Whisper pipeline.

The fixed six-part narrative structure, chapter headlines, and explanatory notes live in `PromiseAndCopy.tsx`. This pilot is a standalone composition, not a new episode or a general template registered in the assembly-manifest pipeline.

## Render and check

```sh
npx tsc --noEmit
npx vitest run src/__tests__/promise-and-copy.test.ts
npx remotion render src/index.ts promise-and-copy out/promise-and-copy/promise-and-copy.mp4 --concurrency=4 --crf=18
```

For a fast frame check:

```sh
npx remotion still src/index.ts promise-and-copy out/promise-and-copy/question.png --frame=780
```

## Tested on September 22, 2026

- Title changed through Studio, committed to `Root.tsx`, and verified after reload; final wording restored.
- Successor A moved from x=810 to x=830 and the question pause changed from 1.8 to 3.8 seconds. Both survived closing and reopening the tab. Studio duration increased by exactly 60 frames. Final layout and pauses restored through the same controls.
- The illustration was replaced with an existing local PNG through `imageSrc`, visually verified, then restored to the SVG forest.
- Narration passage three was rewritten. Regenerating all six scratch clips took **5.19 seconds of machine time** locally. Its measured duration changed from 10.56 to 10.43 seconds, shifting all later cues by four frames without editing scene code.
- TypeScript passed; four targeted tests passed (timing propagation, no audio overlap/truncation, script/audio consistency, invalid-pause rejection).
- Full MP4 rendered successfully. Stream inspection: 1920×1080 at 30 fps, H.264 video plus 48 kHz AAC audio. Composition length 73.8s; MP4 container 73.856s including audio padding. Opening, fork, question, alternatives, and closing frames inspected.

This proves the editing and render loop. It does **not** yet establish episode production time or audience appeal. Human review time was not benchmarked. The next useful test is a second short thought experiment using the same vocabulary; record writing, visual editing, and review time separately from unattended rendering. The later half of this pilot is visually restrained, so viewer feedback should determine whether it needs another meaningful scene change.

The second pilot is now available as **Current → what-we-count**; see `../WhatWeCount/README.md`. Both films share the canvas, narration track, measured timeline, machine/connection primitives and tree artwork under `../shared/`. This extraction preserved the first pilot's reference frame exactly. The original scratch-generation command and Studio controls still work.

## Generated forest trial (September 22, 2026)

The built-in image generator produced `public/pilots/promise-and-copy/forest-generated-v1.png` (1254×1254). It was tested through the existing `imageSrc` prop at frame 500 against the SVG forest; the two preview frames are `out/promise-and-copy/forest-generated-v1-frame-500.png` and `out/promise-and-copy/forest-svg-frame-500.png`. Both rendered at 1920×1080. The SVG remains the composition default, so the established film stays reproducible.

To try the image in Studio, set `imageSrc` to `pilots/promise-and-copy/forest-generated-v1.png`; clear the field to restore the SVG. The generated version adds depth and makes the forest feel like a place, while the SVG better matches the geometric language of the mind icons. The generated still works because it is restricted to the circular world window; the diagram remains code-drawn.

This used the built-in image-generation tool; its model ID was not exposed. The final prompt was:

> Use case: illustration-story. Asset type: a square still illustration that will be cropped into a 460-pixel circular window on the right side of a restrained 1920x1080 philosophy video. Create a quiet, contemplative pine forest with a single winding pale path entering from the foreground and disappearing into the grove. A muted sun sits above distant low hills. Editorial cut-paper and screenprint illustration: layered tree silhouettes, subtle paper grain, believable depth, deliberate negative space. Palette: warm ivory parchment, desaturated sand, taupe, walnut brown, charcoal, and a small muted-gold sun. The mood suggests a shared world and a promise to protect it, without showing a person, machine, or literal symbol. Center the path and grove so the main subject survives a circular crop. No text, letters, logos, border, frame, watermark, gradients, glossy 3D rendering, or photorealism.
