# Parallax Remotion studio

This is the video workspace for Parallax. The active philosophy/AI pilots are `what-we-count` and `promise-and-copy`. The older geopolitics compositions and template library remain available for reuse; the Studio sidebar separates them from current work.

From this directory:

```bash
npm install
npm start
```

Studio opens the compositions registered in [`src/Root.tsx`](src/Root.tsx). **Current** holds the two pilots. **Legacy-Episodes** holds earlier complete episodes. **Templates** is the reusable visual library (including Shorts and thumbnails); **Catalog** holds example/reference compositions; **Experiments** holds capability prototypes, the `philosophy-style-lab` and `philosophy-mark-lab` comparisons, and the twelve-second `continuity-record-study`; **Tests** holds rendering fixtures. The pilots' defaults are intentionally inline in `Root.tsx` to support Studio's Save to code.

Render a pilot from this directory:

```bash
npx remotion render src/index.ts what-we-count out/what-we-count/what-we-count.mp4
npx remotion render src/index.ts promise-and-copy out/promise-and-copy/promise-and-copy.mp4
```

Pilot sources are in [`src/pilots/`](src/pilots/) and their scratch narration helper is [`scripts/promise-copy-scratch.mjs`](scripts/promise-copy-scratch.mjs). Before rendering, review the composition in Studio and run `npm run typecheck`, `npm run lint`, and `npm run test:unit`. Use `npm run test:visual` when changing established template visuals; its reference images live under `src/__tests__/baselines/` and are not disposable cache.

New reusable templates belong under `src/templates/<Name>/`. Start with `node scripts/create-template.mjs Name`, then follow its printed registration checklist. Manifest-driven episode playback is [`src/templates/Episodes/FullEpisode.tsx`](src/templates/Episodes/FullEpisode.tsx); template dispatch is [`templateRegistry.ts`](src/templates/Episodes/templateRegistry.ts) and data validation is [`templateSchemas.ts`](src/templates/Episodes/templateSchemas.ts). Keep those two registries aligned when making a template usable from assembly manifests. Data and assets are in `data/episodes/` and `public/`.

[`../scripts/clean.sh`](../scripts/clean.sh) is selective: `--tests` removes temporary test renders, `--cache` removes build/Python caches, and `--renders` removes finished output under `out/`. Run it without arguments for help. The older `scripts/render-episode.mjs` is a silicon-trap sequence renderer, not a general replacement for `npx remotion render`.

For design rules and deeper production context, see [`BRAND.md`](BRAND.md), [`POLISH.md`](POLISH.md), [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md), and [`CLAUDE.md`](CLAUDE.md). The new [philosophy style study](../analysis/philosophy-visual-style-study-2026-09-22.md) records the image, SVG, and font comparisons. Tool research is in [`../analysis/visual-tools-research-2026-09-22.md`](../analysis/visual-tools-research-2026-09-22.md).
