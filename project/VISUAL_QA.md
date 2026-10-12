# Visual QA — measured polish checks

> Created October 10, 2026. Tool: `remotion-templates/scripts/qa-episode.mjs` (`npm run qa:episode -- --episode=<slug>`).

The division of labour: **code measures, the reviewer judges.** Vision models (and tired humans) are unreliable at pixel distances, small text and near-touching elements ([BlindTest, 2024](https://arxiv.org/abs/2407.06581); [small-detail study, 2025](https://arxiv.org/abs/2502.17422)), so everything with a number is checked by the script, and the review reads the report plus the contact sheets for hierarchy, template fit and taste.

## What the script checks

**Episode level** (from the manifest, data files and `script.md`; `--no-render` runs only this, in seconds):

| Check | Threshold | Basis |
|---|---|---|
| Text-card share of runtime | reported | — |
| Static text card held too long | > 15s (any template > 25s) | house rule |
| On-screen words vs hold time | hold ≥ 3s + 0.25s/word | [Clearcast supers guidance](https://www.4sales.com/index.php/_flysystem/s3filesystem/documents/Clearcast-Guide-to-Key-Supers-Changes%20%282%29.pdf) |
| Text card repeats the narration | ≥ 80% of key words also spoken (quotes and titles exempt; diagram labels noted, not flagged) | Mayer redundancy principle ([Mayer, Heiser & Lonn 2001](https://www.csus.edu/indiv/e/eppersonm/hist107/documents/mayer,%20heiser,%20&%20lonn%20(2001).pdf)) |
| Still reused | > 2 uses | house rule |
| Same template in a row | ≥ 3 | house rule (VISUAL_LANGUAGE monotony) |
| Dark↔light switches between cards | listed | house rule |
| Unsourced placeholders | listed | — |

**Frame level** (one settled frame per segment, rendered in QA mode; `<QaProbe>` logs every visible text node):

| Check | Threshold | Basis |
|---|---|---|
| Minimum text size | fail < 18px, warn < 28px (content); warn < 12px (sources) | 28px is where TV guidance and phone arithmetic agree for text that has to be read; 18px is about half of it (`analysis/youtube-encoding-research-2026-10-10.md` § 3). Raised from 22px on Oct 10, 2026. Use `fontSizes.readable` (28) wherever a graphic has room; `body` (22) and `label` (18) are for dense graphics and secondary lines |
| Safe area | text inside x 96–1824, y 54–1026 (brand chrome exempt) | [EBU R95](https://tech.ebu.ch/publications/r095) graphics-safe, 5% per edge |
| Contrast | 4.5:1, or 3:1 for ≥ 24px / ≥ 18.66px bold; measured against the rendered pixels behind the text; fail below ⅔ of the requirement | [WCAG 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) |
| Overlap | two text boxes overlapping > 15% of the smaller | — |
| Clipping | text extending past the frame or its `overflow: hidden` container | — |

QA mode (`inputProps.qa = true`, see `src/utils/qaMode.ts`) skips all audio, so missing music/ambient files don't block a still render. Chrome is tagged with `data-qa-role="chrome"` (HeaderStrip, FooterStrip, SectionIndicator, template episode watermarks) and sources with `data-qa-role="source"`; KaTeX text is role `math` and excluded from overlap checks.

The report also states how many font files the page registered (each must be fetched before a frame renders).

Three options for side runs: `--at=<sec>` measures each segment that long after it starts instead of at its settled frame (`--at=0.07` shows what every cut lands on); `--floor=<px>` adds a table of every piece of content text below that size (to size a change before making it), and `--tag=<name>` writes to `out/qa/<slug>-<name>/` so a partial run does not replace the main report.

## How the reviewer uses it

1. Run `--no-render` at storyboard time (right after visual-spec) — redundancy, holds, reuse and switching are all visible before anything is rendered.
2. After the data files exist, run the full pass. Fix every **fail** that is a real problem; a fail can be accepted, with the reason noted in the episode's `visual-spec.md`.
3. Review the contact sheets (`out/qa/<slug>/sheet-*.png`) for what the script can't judge: one focal point, hierarchy, whether the form matches the claim, whether a still would beat a card. Look at full-resolution frames before calling anything "too small" — contact sheets are ~⅙ scale.

## Known limits

- One frame per segment (late in the segment, before the exit fade). Problems that only exist mid-animation are not caught.
- Contrast samples the box behind each text run; over busy images the median background can flatter or penalise.
- Chrome size is reported once, not failed. Chrome level is set per episode (`ChromeLevelProvider` in `src/hooks/useChromeLevel.tsx`): `briefing` (default — wordmark, slug, REC timer, FILED date) or `wordmark` (the ∴ PARALLAX mark only). `ai-care-motives` uses `wordmark` (decided Oct 10, 2026).

## Components section (added Oct 11, 2026)

The report opens its segment tables with **Components**: what each second of the episode is made of, by two questions — where the picture comes from, and what moves it.

| Group | Kinds |
|---|---|
| AI illustration | camera move only (Ken Burns) · animated by a video model · static still · inside a Remotion layout · held under Remotion type |
| Real-world imagery | stock footage · photograph or document in a Remotion card · portrait with typed quotation |
| Motion graphics (Remotion only) | type card · list · argument or diagram · chart or statistic · timeline · equation · map |
| Not made yet | placeholder |

How a clip's kind is decided: a local clip is "animated by a video model" when `episodes/<slug>/assets/clips-i2v/<name>.json` exists (the sidecar `fal_i2v.py` writes), and "camera move only" when `episodes/<slug>/assets/clips-kenburns/<name>.mp4` exists. A template is "inside a Remotion layout" when its data points at a generated still, "held under Remotion type" when the segment has `layered.backgroundSegmentId`, and a photo card when its data points at any other image. Keep new clips in those two folders, or the report cannot tell them apart.

The section also gives the time split by what moves the picture (camera move, video model, filmed motion, Remotion animation) and a table of the stills behind the full-frame illustration time with their uses. Every row of the Segments table carries its kind. It needs no rendering: `npm run qa:episode -- --episode=<slug> --no-render --tag=components` writes it to `out/qa/<slug>-components/` without touching the main report.

