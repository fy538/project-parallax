# What we count — second visual pilot

**When the score becomes the goal** is a 79-second follow-up to *Promise and copy*. A machine receives one point for each planting. Four new plantings enlarge the grove; eight replants raise its score without adding trees. The ending asks what our measures leave out.

The same world stays on screen. New motion carries the argument: trees arrive, one tree lifts and returns, the two counters separate, then the numerical rule gives way to questions about values.

## Watch and edit

Output: `remotion-templates/out/what-we-count/what-we-count.mp4`.

In the running Studio, open http://localhost:3000/what-we-count, or **Prototypes → what-we-count**. Start Studio from `remotion-templates/` with `npm start -- --no-open --port=3000` if needed.

In **Props → Schema**, edit the title, four labels, machine/forest horizontal positions, passage pauses, final hold, and voice volume. Commit text with Tab/blur and numbers with Enter. Studio writes the inline `defaultProps` in `src/Root.tsx`; allow source synchronization to finish before closing the tab. It may compact the object onto one line.

Pauses shift narration **and the tree-action sequence** together. The toy rule is fixed at one point per completed planting, including replants. Label edits change display text, not that rule or the spoken words. The grove stays code-rendered so its visible trees match the counters.

To change the script, edit `narration.json`, then run from `remotion-templates/`:

```sh
node scripts/promise-copy-scratch.mjs what-we-count
npx remotion render src/index.ts what-we-count out/what-we-count/what-we-count.mp4 --concurrency=4 --crf=18
```

The scratch script now serves both pilots; omitting the argument still regenerates the first pilot. It uses local macOS Samantha, ffmpeg, and ffprobe. Included audio renders without macOS. Narration is **synthetic scratch voice**, labeled in the film. Timing uses measured passage lengths; the action placements within passages are authored, not word-level alignment.

## Reuse and verification

Both pilots now use `../shared/` for the editorial canvas, narration track, timeline calculation, machine symbol, curved connections, and tree artwork. The second scene adds the grove arrangement, deterministic planting trace, and counters. No new packages, AI image calls, or video-generation services.

- Nine targeted tests pass across the two pilots: counters match completed events, replants preserve the grove, seeking is deterministic, pause changes move audio/actions together, and narration assets match the scripts.
- TypeScript passes. The first pilot's frame 780 is **pixel-identical** before and after the shared-component extraction (zero changed pixels).
- Studio test: changed the grove label and increased the loophole pause by two seconds. Both saved to source and survived reload; duration increased by exactly 60 frames. Final values restored through Studio.
- Full H.264/AAC render, 1920×1080 at 30 fps; 48 kHz audio. Composition: 2,369 frames / 78.967 seconds. Container duration: 79.019 seconds including audio padding. Decode completed without errors. Planting, lift, diagnosis, proposed measure, and closing frames inspected.
- Scratch generation took **6.61 seconds** locally. The first complete render took **38.73 seconds** and the final render **39.03 seconds**. Logs are under `out/what-we-count/`. These are unattended machine times, not writing or review estimates.

There is no comparable human-time baseline for pilot one, so this does not establish a percentage production speedup. It does show concrete reuse: the second film needed no new asset-sourcing workflow, narration system, or editor. This remains a standalone visual study, outside the episode manifest pipeline.

## Editorial grounding

The forest story is invented. No AI was trained or observed doing this; the animation plays an authored event sequence. Its numbers are counts of those events, not empirical AI or forestry data. The four initial trees plus four new trees make eight throughout the replanting loop.

The underlying concept is **specification gaming**: meeting a stated objective while missing the intended result. See Krakovna et al., [Specification gaming: the flip side of AI ingenuity](https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/) (DeepMind, April 21, 2020). The source supports the concept and gives observed examples; our tree story is an original illustration.

The proposed surviving-tree measure is left as a question. The film neither simulates ecological outcomes nor claims that a better counter solves alignment. Its final move—from a misspecified reward to examining our own values—is an editorial reflection.
