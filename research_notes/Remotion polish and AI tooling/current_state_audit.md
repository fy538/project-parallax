# Current-state audit: the Parallax Remotion codebase and the `ai-care-motives` episode (as of 10 Oct 2026)

Scope and method. Local, read-only audit of `/Users/feihuyan/project-parallax/remotion-templates` (working tree, not HEAD: `git status --porcelain remotion-templates/src` lists 409 changed paths; last commit is `c6e9ead`, 2026-05-23). Sources are repository files, grep counts, read-only lint runs, the existing QA output in `out/qa/ai-care-motives/`, and frames extracted from the existing preview render `out/preview/ai-care-motives/355.5-370.7.mp4`. All paths below are relative to `remotion-templates/` unless they start with `../`. "Template dirs" means the 96 directories under `src/templates/` (this includes `_proto`, `_shared`, `Episodes`, `Shorts`, etc.; the manifest registry `Episodes/templateRegistry.ts` lists 87 components). Counts are regex greps and are approximate to within a few. Anything not directly observed is in an "Inferences" list.

Episode facts used throughout (from `data/episodes/ai-care-motives/assembly-manifest.json`): 56 segments, 678.6 s (20,358 frames at 30 fps), `mode: "estimate"`, 29 TEMPLATE segments across 14 components (KineticTypography 6, ImageComposite 6, TitleTransition 2, SplitFrame 2, AxiomList 2, HorizontalTimeline 2, ConditionalArgument 2, NetworkDiagram, FrameworkDiagram, PrimarySourceReveal, StatReveal, DotPlot, SplitComposition, MathDerivation) and 27 FOOTAGE segments (23 `local-aigen` Ken Burns clips, 2 Pexels stock clips, 2 unsourced placeholders). Top-level manifest keys are only `version, episode, title, fps, totalDurationSec, mode, pacing, narration, beats, segments, language, musicBed`.

---

## 1. Remotion version and @remotion/* packages: what is installed, used, and unused

### Takeaway
The project is pinned to Remotion 4.0.457 and, for the episode being shipped, uses almost nothing beyond core `remotion`, `@remotion/google-fonts` and one function of `@remotion/layout-utils`. Five installed official packages (transitions, paths, shapes, noise, media-utils) are used only in prototypes or in templates the episode does not touch, and several relevant ones (motion-blur, captions, whisper, animation-utils, lottie, rive) are not installed.

### Cited Findings
- `remotion`, `@remotion/cli`, `@remotion/google-fonts`, `@remotion/lambda`, `@remotion/layout-utils`, `@remotion/bundler`, `@remotion/renderer` are pinned to `4.0.457`; `@remotion/media-utils`, `noise`, `paths`, `shapes`, `three`, `transitions` are `^4.0.457`. Installed core reports `4.0.457`. Also React 19.2.5, zod 4.3.6, TypeScript 6.0.3, vitest 4.1.5. — `package.json`; `node_modules/remotion/package.json`
- Files in `src/` importing each package (grep on `from "<pkg>…"`):

  | Package | Installed | Files in `src/` | Where |
  |---|---|---|---|
  | `remotion` (core) | yes | 308 | everywhere |
  | `@remotion/google-fonts` | yes | 2 | `src/design/fonts.ts` (10 families), `src/experiments/PhilosophyStyleLab.tsx` |
  | `@remotion/layout-utils` | yes | 5 | `measureText` only: `components/TitleBlock.tsx:27`, `MapTitleFrame.tsx:34`, `labelPlacement.ts:49`, `templates/AtlasPlate`, `templates/BeeswarmChart`. `fitText` and `fillTextBox`: 0 uses |
  | `@remotion/transitions` | yes | 1 | `src/transitions/grammar.tsx:46-48`; its only consumers are `templates/_proto/BrandTransitions.tsx` and a unit test |
  | `@remotion/paths` | yes | 5 | `components/AnnotationSVGLayer.tsx`, `components/DrawOnPath.tsx`, three `_proto` files |
  | `@remotion/shapes` | yes | 4 | `components/AnnotationSVGLayer.tsx`, three `_proto` files |
  | `@remotion/noise` | yes | 1 | `components/GenerativeField.tsx` (used by `GenerativeBackdrop` and `_proto`) |
  | `@remotion/media-utils` | yes | 2 | `_proto/NarrationSync.tsx`, `_proto/ParametricBilingual.tsx` only |
  | `@remotion/three` | yes | 1 | `templates/Recreation/Recreation.tsx` (the experiment shelved in commit `c6e9ead`) |
  | `@remotion/lambda` | yes | 0 (2 scripts) | `scripts/deploy-lambda.mjs`, `scripts/render-lambda.mjs`; flagged dormant by `package.json` key `_lambda_scaffolded` |
  | `@remotion/player` | transitive only | 0 | present in `node_modules/@remotion/` but not in `package.json` |
  | `@remotion/motion-blur`, `captions`, `install-whisper-cpp`, `openai-whisper`, `animation-utils`, `lottie`, `rive`, `gif`, `fonts`, `media`, `zod-types`, `preload`, `skia`, `light-leaks`, `elevenlabs` | no | 0 | not in `node_modules/@remotion/` |
- Of the 14 templates the episode uses, none imports `DrawOnPath`, `AnnotationSVGLayer`, `GenerativeField`, or any `@remotion/*` helper package directly; 9 of 14 reach `measureText` indirectly through `<TitleBlock>`. `DrawOnPath` is used only in `_proto`; `AnnotationSVGLayer` only by `ScrollyReveal`. — grep over `src/templates/<14 dirs>`
- The repo already carries a self-assessment: "We currently use Remotion as a chart/diagram renderer (~83 templates) — roughly 25% of its surface", with a ranked build queue (1. Whisper word-timing to animation, 2. `calculateMetadata` variants, 3. layout-utils, 4. paths/shapes, 5. AI stills as compositing layers, 6. transitions, 7. player) and eight prototypes in `src/templates/_proto/`. — `REMOTION_CAPABILITY_MAP.md` (dated May 23, 2026)
- `@remotion/light-leaks` was deliberately replaced by a CSS `BeatFlash` because its WebGL canvas "hard-crashes with cancelRender() when headless Chromium can't get a WebGL context". — `src/templates/Episodes/FullEpisode.tsx:879-885`
- A test named `remotion-version-lock.test.ts` exists in `src/__tests__/`.

### Inferences
- For the `ai-care-motives` render path the effective Remotion surface is: core (`interpolate`, `Easing`, `Sequence`, `OffthreadVideo`, `Audio`, `staticFile`, `random`), google-fonts, and `measureText`. Everything listed as "prototyped" in the capability map (transitions, path draw-on, noise, audio-reactive) is not in the shipped episode.
- The capability map's item 3 ("layout-utils … cheap retrofit") is contradicted by the later `LESSONS.md` L117 (see section 4), which reverted a `fitText` attempt.

### Gaps
- I did not diff the installed version against the latest Remotion release (web research is out of scope for this audit).
- Whether the mixed pin style (exact vs caret) has ever produced mismatched package versions was not checked beyond `node_modules/remotion`.

---

## 2. How motion is implemented, and how consistent it is

### Takeaway
There is a well-designed motion toolkit (easing presets, springs, stagger, anticipatory reveals, eight drift presets), but templates mostly do not use it: the dominant entrance across the library is a linear opacity fade with literal second values, springs are nearly absent, and the newer timing and easing tokens have almost no adoption. Three of the episode's templates animate with linear fades only.

### Cited Findings
- Toolkit in `src/utils/animation.ts`: `CLAMP` plus eight eased presets (L16-43); `fadeIn`/`fadeOut`/`fadeInOut` use bare `CLAMP`, i.e. linear (L48-74); `slideIn`/`scaleIn`/`scaleReveal`/`pathDraw` use cubic ease-out (L140-154, 326-333, 570-586); `gentleSpring` (damping 15, stiffness 80, mass 0.8), `heroSpring` (12/100/1.0), `microSettle` (25/200/0.5) (L157-267); `stagger` default 8 frames (L222); `anticipatoryStartFrame`/`anticipatoryReveal` (5-frame anticipation, 12-frame settle) (L86-135); `KEN_BURNS_MAX_SCALE = 1.02`, `EXIT_FADE_DURATION = 15` (L290-294); `lockOnPulse`, `cameraShake`, `focusPull`, a hand-written `morphPath` (L493-775).
- Three parallel timing vocabularies exist in `src/design/theme.ts`: `timing.entrance/exit/stagger/hold` in frames (L364-387), Material-style `easing`/`easingCss` beziers with the doctrine comment "motion is NEVER linear … and NEVER bounces/overshoots" (L389-411), and the older `durations` (frames and ms mixed) and `staggers` (ms) (L733-768).
- Adoption counts across `src/templates` (96 dirs):

  | Primitive | Dirs | Occurrences |
  |---|---|---|
  | `useCompositionAnimation` | 90 | 110 |
  | `useDirection` | 84 | n/a |
  | linear fade helpers (`fadeIn`/`fadeOut`/`fadeInOut`) | 76 | 518 |
  | eased primitives (`CLAMP_*`, `Easing.*`, `easings.*`) | 68 | 306 |
  | `interpolate(` | 76 | 267 |
  | `slideIn`/`scaleIn`/`scaleReveal` | 18 | 77 |
  | SVG draw-on (`pathDraw`, `evolvePath`, `strokeDashoffset`) | 23 | 66 |
  | bare-linear `interpolate` (`, CLAMP)` or clamp-only options) | 28 | 56 |
  | springs (all are `heroSpring`) | 8 | 15 |
  | direct `spring(` / `gentleSpring(` / `microSettle(` | 0 | 0 |
  | `sec(<numeric literal>)` | n/a | 1,394 |
  | `timing.entrance/exit/stagger/hold` tokens | 9 | 71 |
  | `Easing.bezier(...easing.*)` theme curves | 1 | n/a |
  | text-animation register (`textAnimation`, `CompositePatterns`, typewriter/tracking hooks) | 2 (KineticTypography, StatReveal) | 11 |
- In 49 of 96 dirs, linear fade calls outnumber all eased, slide and spring calls combined. In 12 dirs linear `fadeIn` is the only animation primitive: AxiomList, CalendarHeatmap, CartogramMap, ComparisonPair, DensityMap, DialecticFlow, MathDerivation, MorphTransition, NewspaperHeadlineRotator, SplitFrame, TelegramCable, Treemap. Three of those (AxiomList, MathDerivation, SplitFrame) are in the episode. — per-dir classification script over `src/templates`
- `useEntrance` does not exist; `src/hooks/index.ts:40` says "useEntrance / useStaggeredEntrance / useDivider / splitCanvas removed", but `CLAUDE.md` still lists it as a key hook.
- `useCompositionAnimation` (`src/hooks/useCompositionAnimation.ts`): enter fade is 8 frames and linear (L135-138); exit fade is 15 frames, cubic ease-in (L141-152); default drift is a one-way scale 1.00 to `motionBudget.scale` 1.02 with `inOut(quad)` over the whole segment, no pan or rotation (L196-219; `theme.ts:1179-1188`); other modes are `breathing` (8 s sine), `settle` (0.6 s then hold), `sway`.
- Drift defaults among the 14 episode templates: KineticTypography, StatReveal and MathDerivation default to `"breathing"`; ImageComposite to `"documentary"`; PrimarySourceReveal passes `{ noDrift: true }`; TitleTransition passes `noExit`; SplitFrame calls neither `useCompositionAnimation` nor `useDirection` (no enter fade, drift or exit); the other seven use the editorial default. — grep of `useDirection(`/`useCompositionAnimation(` per template
- Episode templates, primitive counts (spring / eased / slide / linear-fade): AxiomList 0/0/0/2; MathDerivation 0/0/0/2; SplitFrame 0/0/0/3 (+2 bare linear interpolates); ConditionalArgument 0/2/0/5; NetworkDiagram 0/2/0/8; HorizontalTimeline 0/2/1/13; ImageComposite 0/0/4/4; PrimarySourceReveal 0/0/0/0 (2 bare linear interpolates); FrameworkDiagram 1/4/2/17; StatReveal 1/3/1/4; KineticTypography 1/4/10/12; TitleTransition 6/6/10/21; SplitComposition 0/9/8/14; DotPlot 0/14/0/0 (the only one built on `timing.*` tokens and eased interpolates throughout).
- Concrete example, AxiomList: every row is revealed by `fadeIn(frame, sec(0.5 + i*0.55), sec(0.6))`, opacity only, no translate, no easing, literal timings (`src/templates/AxiomList/AxiomList.tsx:37-39, 127, 144-148`).
- Shared chrome uses the same pattern: HeaderStrip and FooterStrip fade in linearly over `sec(0.6)` with a 6 px slide (`src/components/HeaderStrip.tsx:53-54`, `FooterStrip.tsx:55-56`).
- The drift transform wraps the chrome. HeaderStrip is positioned at `layout.safeArea.left` = 80 px, but in QA frames (sampled late in each segment) the wordmark sits at x≈62 (`frames/21-beat4-seg20.png`, `frames/42-beat7-seg37.png`) or x≈75 (`frames/12-beat2-seg11.png`), while the Background's ruled border stays fixed at 40 px. Measured chrome size is 10.9 px, not the 11 px token, and label text measures 18.4 px, not 18 (`out/qa/ai-care-motives/report.md`).
- `tools/lint/polish_lint.py` rule A1 ("Linear interpolation (no easing)") reports 12 hits in the whole tree; the `fadeIn()` helper is not counted. — read-only run, 10 Oct 2026

### Inferences
- The house rule "motion is never linear" is contradicted by the house helper: 518 calls go through a linear `fadeIn`. Because the fix point is a single function (and `useCompositionAnimation`'s enter fade), changing the default curve there would alter most templates at once; it would also invalidate most of the 328 visual baselines.
- Entrances are overwhelmingly "opacity only". Positional or scale entrances exist in 18 dirs. The result on screen is cards whose elements appear by cross-fading in place, which reads closer to slides than to motion graphics.
- Chrome and content drifting together at 1.02 means header and footer text creeps about 18 px toward the frame edge over each hold, against a border that does not move. This is small but visible on long holds (inferred from the measured positions above).
- Each template's 15-frame exit fade is keyed to its `<Sequence>` length, so every template-to-next seam includes a 0.5 s content fade to bare paper before the cut. The preview clip is consistent with this: the quote text in `beat5-seg26` is visibly lighter 0.1 s before the segment ends (frame at t=2.40 s of `out/preview/ai-care-motives/355.5-370.7.mp4`).

### Gaps
- I did not render mid-animation frames per template, so easing quality in motion (as opposed to code) is judged from source and from one 15 s preview clip.
- Whether `paceProfile` (set in 9 data files) changes any visible timing was not traced end to end.

---

## 3. Segment-to-segment transitions

### Takeaway
Transitions in the manifest-driven episode are hand-written CSS on each segment, not `@remotion/transitions`, and segments never overlap. So "dissolve" and "fade" are not crossfades: the outgoing segment ends, the cream paper surface shows, and the incoming segment fades up from it. The existing preview render shows blank cream frames at a dissolve and visible defects in the iris.

### Cited Findings
- `FullEpisode.tsx` places every segment in its own `<Sequence from={startSec*fps}>` wrapped in `<TransitionWrapper>` (L1056-1185). `TransitionWrapper` computes an "in" progress over the first N frames and an "out" progress over the last N frames of that one segment and applies opacity, transform, clip-path or an overlay (`src/components/Transitions.tsx:404-474`).
- What each type does in code (`Transitions.tsx:168-353`): `cut` = nothing; `fade` = opacity; `dissolve` = opacity plus a 2% scale; `color-wash` = content opacity plus a solid colour overlay whose opacity is `1 - progress`; `iris` = `clip-path: circle(72% × progress)` plus an accent ring; `match-cut` = opacity plus 15% zoom. Easing is cubic out for "in", cubic in for "out" (L139-140). Six deprecated types (wipes, whip-pan, blur-through, spatial-zoom) remain implemented.
- A true overlapping implementation exists but is not used by episodes. `src/transitions/grammar.tsx:1-36` states: "`TransitionWrapper` … cannot truly OVERLAP two segments — a real cross-dissolve needs the outgoing scene fading out while the incoming fades in", and "Do NOT replace FullEpisode's per-segment wrappers with a TransitionSeries: the sequential model would drift off the narration-aligned absolute timestamps." `TransitionSeries` appears only in that file, `_proto/BrandTransitions.tsx` and a test.
- The manifest has no overlapping or gapped segments (a script comparing each `startSec` to the previous `endSec` printed no gap or overlap), and footage and cards alternate on separate layers but never at the same time.
- Transition usage in the episode: 22 of 56 segments carry a `transition` object; 34 seams are plain cuts. In: dissolve 8, color-wash 7, fade 3, iris 1. Out: color-wash 5, fade 4, iris 1. Every `washColor` is `#1C1814` (ink). — manifest
- What is underneath a fading segment: `EditorialSurface` fills the whole composition with `palette.paper` (`src/components/EditorialSurface.tsx:150-154`; `FullEpisode.tsx:1259`).
- Rendered evidence, dissolve: in `out/preview/ai-care-motives/355.5-370.7.mp4`, the frames at t=12.70 s and 12.73 s (episode time ≈368.2 s, the seam from the dark still `beat5-seg27` to the card `beat5-seg28`, which has `dissolve` in, 0.4 s) are entirely blank cream; the title then fades up at t=12.80 to 13.00. The still does not fade; it cuts to empty paper.
- Rendered evidence, iris (`beat5-seg26` out, `beat5-seg27` in, t=2.20 to 2.80 s of the same file): (a) the gold "leading edge" ring sits well inside the clip circle, at roughly 70% of its radius; (b) at near-full radius the four corners outside the circle render black, while at small radius the outside renders cream; (c) the iris opens a dark illustration as a disc on a bright cream field.
- Cause of (a): the ring radius is computed as `radius% × 1102` px, "assuming 1920x1080, half-diagonal ≈ 1102" (`Transitions.tsx:308-313`), but the clip uses CSS `circle(r%)`.
- Template segments also run their own enter fade (8 frames) and exit fade (15 frames) inside the wrapper (section 2), so a "cut" from a card is preceded by the card's content fading to bare paper.
- `BeatFlash`: at each of the 7 beat boundaries a 1.0 s radial "film-burn" gradient with `mix-blend-mode: screen` peaks at 0.65 opacity, with the hue rotated per beat (amber, rose, cyan, warm) (`FullEpisode.tsx:887-920, 1223-1243`). It is documented in `LESSONS.md:123` only; grep finds no mention in `../project/TRANSITION_GRAMMAR.md`, `../project/VISUAL_LANGUAGE.md` or `POLISH.md`.
- `Transitions.tsx:14-15` describes `fade` as "the closest in-code surrogate for fade-through-black"; `grammar.tsx` maps `fade` to `fadeThrough(ink)`. In the episode path it fades to paper, not black.
- The manifest lint finds no transition-rule violations in this manifest (`M-TRANSITION-*` rules exist; 0 hits). — `python3 tools/lint/manifest_lint.py …`

### Inferences
- CSS resolves a percentage `circle()` radius against √(w²+h²)/√2, about 1558 px at 1920×1080, so the ring is drawn at 1102/1558 ≈ 71% of the clip radius. This matches the frames. (The spec fact is from general CSS knowledge, not from the repo.)
- The black corner wedges are observed but the cause is not established; candidates are a compositing artefact of `clip-path` with `will-change` (`Transitions.tsx:465-466`) or something specific to the preview encode. It needs a still render at the two frames to confirm.
- Every one of the 8 dissolve-ins and 3 fade-ins behaves like the sampled one: on a dark-still to light-card seam the viewer gets a hard luminance jump to blank paper, then a fade-up. On dark-to-dark seams (for example into `beat1-seg06`, the dark title card with `fade` in) a cream flash for the first frames is likely.
- Colour-wash through ink is the only type that behaves as designed without overlap, because it covers the frame with its own overlay.
- A hybrid is available in principle: keep absolute timestamps but extend each outgoing segment by the transition length so the two overlap. The `grammar.tsx` objection is to sequential timing, not to overlap as such.

### Gaps
- The preview clip covers one iris pair and one dissolve. Colour-wash, fade and BeatFlash seams were not seen in motion; no beat boundary falls inside the clip.
- I did not test whether QA mode or `noAudio` changes any visual path at seams.

---

## 4. Typography

### Takeaway
The type scale is tokenised and mostly respected, but small text is structural (79 of 96 template dirs use sizes under 18 px), there is no working text-fitting, and three shared-code defects are visible on almost every light card: a dark text shadow applied in light mode, subtitles rendered in the browser's default serif because no font family is set, and italics requested without loading an italic face.

### Cited Findings
- Scale (`src/design/theme.ts:549-560`): display 96, h1 64, h2 48, h3 36, body 22, label 18, caption 14, meta 11, small 14. Letter-spacing display −1, h1 0, h2 1.5, h3 1, meta 2.5 (L570-585). Line-heights L614-623. Max-width tokens h1 1400, h2 1200, h3 900, body 1100, label 600, node 280 (L1372-1385).
- Sub-18 px usage: `fontSizes.caption` in 68 dirs, `fontSizes.meta` in 53, `fontSizes.small` in 3; any of the three in 77 of 96 dirs. Literal `fontSize` under 18 in 9 dirs (20 occurrences) and SVG `fontSize={<18}` in 9 dirs (20 occurrences). Union: 79 of 96 dirs. Occurrences across templates and components: caption 240, label 206, meta 171, body 129.
- Shared components at 11 px: HeaderStrip (2), FooterStrip (3), EditorialFrame (4), ReferenceLineOverlay (3), MetadataStrip, MapTitleFrame, MapAnnotations, LowerThird, EditorialScaffold, AnnotationOverlay. SectionIndicator uses 14 px for the "SECTION n" line (`src/components/SectionIndicator.tsx`).
- In the episode as rendered: no content text measured below 18 px (0 fails), 46 SIZE warnings for text between 18 and 20.5 px against the 22 px "small on phone" threshold, and chrome at 10.9 px, which QA reports but exempts. — `out/qa/ai-care-motives/report.md`, `report.json` (`rules.minContentPx: 18`, `warnContentPx: 22`)
- Several episode templates were recently bumped by hand, per code comments: "was label (18)" (`StatReveal.tsx:204, 232`), "was caption (14px) in taupe: 2:1 contrast, unreadable on phones" (`SplitFrame.tsx:418`), "Was 26px / 36px (key): small in a mostly empty frame and on phones" (`AxiomList.tsx:223`), "was meta (11px): unreadable on phones" (`SourceAttribution.tsx:55`).
- Font loading (`src/design/fonts.ts`): ten Google families via `@remotion/google-fonts`, Latin weights 400/500/600/700 (Plex Serif 400/500/600), every call is `loadFont("normal", …)`. There is no `"italic"` load anywhere in the file, and no `delayRender`/`waitUntilDone` gating.
- Italic is requested 54 times in templates and components (`fontStyle: "italic"`). `fontWeight: 800` is used 7 times; the heaviest loaded weight is 700.
- Missing font family, shared: the `<TitleBlock>` subtitle style sets size, colour and shadow but no `fontFamily` (`src/components/TitleBlock.tsx:214-224`). A 2× crop of `frames/42-beat7-seg37.png` shows the subtitle "Chat setting, AUC (not accuracy). Recognition alone ≠ deception" in a Times-style serif, unlike any brand face. Subtitles appear in `beat4-seg22`, `beat6-seg34`, `beat7-seg37`, `beat7-seg42`.
- Missing font family, KineticTypography: the episode-slug label at bottom-left has no `fontFamily` (`src/templates/KineticTypography/KineticTypography.tsx:960-976`); `frames/12-beat2-seg11.png` shows "AI-CARE-MOTIVES" in the same fallback serif.
- Text shadow in light mode: `useThemeMode` returns `textShadow: shadows.textLift` (`0 1px 3px rgba(0,0,0,0.5)`) for both modes (`src/hooks/useThemeMode.ts:77`), although `shadows.textLiftLight: "none"` exists (`theme.ts`, shadows block L1087-1128). `shadows.textLift` is applied unconditionally 122 times in templates and components (131 token references in templates), against 5 mode-gated references. The 2× crop of frame 42 shows a soft dark halo under the title and subtitle on cream paper; HeaderStrip, FooterStrip and SourceAttribution do the same (`HeaderStrip.tsx:90,105`; `FooterStrip.tsx:92,125,141`; `SourceAttribution.tsx:61`).
- Text fitting: `fitText` 0 uses; `measureText` in 5 files; `textWrap: balance|pretty` 0; `hyphens` 0; `ch`-based widths 0; `textMaxWidth` tokens in 24 dirs; `textSafe` in 1; `clampText` in 0. `<TitleBlock>` shrinks a title from h2 toward h3 using `measureText` (`TitleBlock.tsx:115-135`).
- `LESSONS.md` L117 (May 23, 2026) records that `measureText`/`fitText` "race the async web-font load … auto-fit is nondeterministic", that a shared `<FitText>` was reverted, and that `TitleBlock`'s own scaling "is also subject to this", masked by wrapping.
- OpenType features: `fontFeatureSettings` 10 uses, `fontVariantNumeric` 4 uses in templates and components, although `theme.ts:605-612` defines tabular presets for all animated numbers.
- Hard-coded families: `"Helvetica, Arial, sans-serif"` ×8, `"Georgia, serif"` ×3, unquoted `"IBM Plex Mono, monospace"` ×3 (for example the placeholder card, `FullEpisode.tsx:550`).
- Hierarchy as rendered: the quote card stacks three faces on two lines, Plex Sans semibold quote, Plex Serif italic name, Plex Mono source (`CompositePatterns.tsx:456-495`; `frames/12-beat2-seg11.png`). FrameworkDiagram sets column heads at h1 (64 px bold) over 22 px rows with 18 px ordinals (`frames/21-beat4-seg20.png`). StatReveal sets prefix, number and suffix as one 120 px JetBrains Mono string (`StatReveal.tsx:117-136`; `frames/36-beat6-seg31.png`, "up to 40x").
- Contrast: 42 of the 96 QA warnings are CONTRAST, almost all muted-colour labels at 3.6 to 3.8:1 against a 4.5:1 requirement (`report.md`).

### Inferences
- With only normal faces loaded, the 54 italic usages are browser-synthesised obliques (inferred from `fonts.ts`; the crop of the Kant attribution was not conclusive either way).
- The light-mode shadow is the single most widespread visible defect: it softens every title and makes the 11 px chrome look smudged. One line in `useThemeMode.ts` plus the unconditional uses would remove it.
- There is no global default font on the composition root, so any text node that forgets `fontFamily` silently renders in Times. QA cannot see this: the fallback subtitle produced only a contrast warning.
- Two size standards coexist: POLISH.md's tertiary tier (14 to 18 px) and the QA floor (18 fail, 22 warn). Templates follow the first, the episode is judged by the second.

### Gaps
- No measurement of how many of the 79 dirs render sub-18 text in a typical data file (the count is of code, not of rendered output).
- Line-length (characters per line) was not measured; only `maxWidth` usage was counted.

---

## 5. Layout, safe areas, frame fill and chrome

### Takeaway
Layout tokens exist and the lints pass, but three different safe areas are in play, cards are consistently underfilled, and the chrome is inconsistent between templates and carries an internal slug, a "REC" timer that restarts each segment, and the render date.

### Cited Findings
- Tokens (`theme.ts:686-727`): `safeArea` 80 px; tiers tight 48, standard 80, broadcast 108, generous 120; 8 px spacing scale. Helpers `contentArea()`, `columnLayout()`, `titleHeight`, `cardPadding` (L1212-1300, 1393-1397).
- Adoption: `safeAreaTier` in 53 dirs (generous 82 uses, standard 11, tight 6); `contentArea(` in 31; `layout.spacing.*` in 43; `useTemplateLayout` in 7; direct `layout.safeArea` in 2.
- QA uses a third definition, EBU R95 5%: x 96 to 1824, y 54 to 1026 (`scripts/qa-episode.mjs` `QA_RULES.safe`). 8 SAFE warnings in the episode, for example the SplitFrame badges "DUTY" at (29,23) and "PRUDENCE" at (1785,23).
- Light cards draw a ruled hairline border inset 40 px by default (`src/components/Background.tsx:242, 334`); visible in every light-card frame.
- Frame fill, estimated by eye from full-resolution QA frames: the Kant quote block is about 1000×170 px, roughly 8% of the frame, held 23 s (`frames/12-beat2-seg11.png`); FrameworkDiagram content ends near y=690 of 1080 (`frames/21-beat4-seg20.png`); the DotPlot data occupies a band from about y=430 to 620 (`frames/42-beat7-seg37.png`); ConditionalArgument without a title ends near 55% of frame height (`sheet-5.png`, `beat8-seg46`); AxiomList text sits in the left-centre with the right half empty (`sheet-2.png`, `beat3-seg17`).
- Causes in code: ConditionalArgument positions everything from a fixed `topPad = data.title ? 220 : 140` with no vertical centring (`ConditionalArgument.tsx:90-95`); AxiomList left-aligns text in a 70%-wide column (`AxiomList.tsx:89-100`); DotPlot fixes the axis "~200px below title area" (`DotPlot.tsx:428`).
- Chrome is opt-in per template: `<HeaderStrip>` and `<FooterStrip>` are each rendered by 71 of 96 dirs. Among the 14 episode templates, SplitFrame and PrimarySourceReveal render neither; the ImageComposite portrait variant shows none in frames while its inset variant does (`sheet-1.png`, `sheet-3.png`, `sheet-4.png`). `LESSONS.md` L111: "Brand chrome is NEVER auto-included by `<Background>`".
- HeaderStrip prints `∴ PARALLAX` left and whatever is passed as `metadata` right; templates pass `data.episode`, which is the slug, so every card shows "AI-CARE-MOTIVES" (`HeaderStrip.tsx`; `KineticTypography.tsx:923`; `AxiomList.tsx:105`; data files have `"episode": "ai-care-motives"`). KineticTypography, HorizontalTimeline and FrameworkDiagram print the slug a second time at bottom-left (`KineticTypography.tsx:975`; `frames/21-beat4-seg20.png`; QA lists `"ai-care-motives" 18.4px` in `beat4-seg22` and `beat6-seg34`).
- FooterStrip prints "● REC · mm:ss" from the segment-local frame, so it restarts at 00:00 on every card (frames show 00:21, 00:22, 00:12, 00:05), and "FILED <date>" from `new Date()` at render time (`FooterStrip.tsx:41-46, 58-62`; frames show "FILED 2026-10-10"). KineticTypography hides REC for quotes (`KineticTypography.tsx:924`), so REC appears on some cards and not others.
- Over footage, `SectionIndicator` shows "SECTION n" (14 px) and the beat title (18 px) at bottom-left and hides during template segments (`FullEpisode.tsx:1188-1195`; visible in `sheet-1.png` to `sheet-5.png`).
- `lowerThird` is not set in this manifest, so no lower-thirds render (`FullEpisode.tsx:1050, 1198`).
- VISUAL_QA records the chrome as undecided: "Chrome size is reported once, not failed — whether the briefing chrome stays is an open design decision." — `../project/VISUAL_QA.md` (Known limits)
- polish_lint spacing and width rules today: L9 (missing `maxWidth`) 36, L1 (off-grid pixel values) 29, L10 (hard-coded padding) 11, L7 1; L13 errors for hand-built title blocks in SplitFrame and BarChartRace. — read-only run

### Inferences
- The "intelligence briefing" chrome (REC dot, FILED date, coordinates slot) was designed for the geopolitics framing. For a philosophy and AI-ethics essay it reads as off-register, and in this episode it shows an internal slug rather than a title. This is a taste judgement resting on the observed strings.
- The underfill pattern is the opposite of what POLISH L2 guards against (too dense). The doctrine rules that address it (D3, D16, T6) are written per template and are not enforced by any lint or QA check.

### Gaps
- Frame-fill percentages are visual estimates; `report.json` does not store per-node boxes, so I could not compute content bounding boxes.

---

## 6. Texture and depth: what is actually switched on

### Takeaway
The FilmOverlay cascade is dormant for this episode. What renders is a paper surface with grain and a faint vignette on everything, plus a per-card background that adds a second grain layer, blurred drifting colour clouds, dust particles and a ruled border. On light cards the clouds show as banded blotches and the particles read as specks.

### Cited Findings
- FilmOverlay gate: "The whole system is dormant unless the episode opts in by setting `filmOverlay: {}`" (`CLAUDE.md`, FilmOverlay cascade); `SegmentFilmOverlay` returns children directly when `episodeFilmOverlay` is falsy (`FullEpisode.tsx:471-477`). The `ai-care-motives` manifest has no `filmOverlay` key; only `data/episodes/prisoners-dilemma/assembly-manifest.json` has one. No segment sets `template.filmOverlay` or `backdropId` (template keys are only `component` and `dataFile`).
- Also absent from this manifest: `soundscape`, `episodeColorEmphasis`, `episodeMotif`, `lowerThird`, any `layered` segment (0 occurrences), so `LayeredComposition` and `SegmentBackdrop` are unused here.
- Always on, whole episode: `<EditorialSurface intensity={0.6}>` (`FullEpisode.tsx:1259`) = paper colour, a full-frame SVG `feTurbulence` grain (baseFrequency 0.45, 3 octaves, multiply, opacity 0.6×0.12 = 0.072, seed advancing every 2 frames) and a corner vignette of at most 0.6×0.08 ≈ 4.8% ink (`EditorialSurface.tsx:69-130`).
- On each template card, `<Background>` with the default `briefing` motion identity (`src/design/motion.ts:58-77`) adds: a second `feTurbulence` grain (baseFrequency 1.6, 2 octaves, opacity 0.06 light or 0.10 dark, re-seeded every 2 frames) (`Background.tsx:393-424`); on light cards two drifting radial "atmosphere" clouds with `filter: blur(80px)` on 50 s and 70 s loops (`Background.tsx:434-470`); a 0.4 px substrate wobble; dust motes and bokeh orbs, default density `subtle` on light and `normal` on dark (`Background.tsx:336-339`); and the ruled border.
- One data file raises particle density on a light analytical card: `free-tier-conditional.json` has `_direction.atmosphere: "dense"` (`beat7-seg38`).
- On footage, `BrandImage` adds `assets/noise-512.png` at 0.10 with overlay blend and a 0.18 radial vignette (`BrandImage.tsx:217-239`).
- Depth: `shadows.*` tokens exist (`theme.ts:1087-1128`); in templates `shadows.textLift` has 131 references, `shadows.subtle` 17, `accentGlow` 15. `src/utils/depth.ts` is imported by one template dir (`Shorts`). `boxShadow` occurrences in the 14 episode templates total 7.
- As rendered: light cards show large soft circular tints with visible concentric contour rings, upper-left yellowish and lower-right pinkish (`frames/12-beat2-seg11.png`, `frames/36-beat6-seg31.png`), and several small grey specks per frame (for example near (1255,140), (467,876), (1496,872) in `frames/21-beat4-seg20.png`). StatReveal's bar has a gradient and drop shadow (`frames/36-beat6-seg31.png`); PrimarySourceReveal draws a tinted, shadowed document card (`sheet-3.png`, `beat6-seg30`).

### Inferences
- The contour rings are 8-bit banding of very low-alpha radial gradients (`0x26` to `0x10` to transparent) under an 80 px blur; H.264 at 8-bit 4:2:0 will tend to make them more visible, not less. (Cause inferred from the gradient definition and the frames.)
- Dust on cream reads as sensor dirt rather than atmosphere. POLISH D20 lists "Particle layers on light/paper substrate" as an anti-pattern, yet `subtle` particles are the light-mode default.
- On cards there are two stacked animated grain filters (EditorialSurface and Background) at different frequencies; on footage there is the static noise PNG plus the EditorialSurface grain on top. Texture is therefore not uniform between cards and stills, and none of it is the "film" treatment the FilmOverlay presets describe.

### Gaps
- I did not render the same card with atmosphere and particles disabled to confirm the banding source.
- Dark-card texture was only seen at contact-sheet scale.

---

## 7. Image and video handling

### Takeaway
AI stills arrive as pre-rendered Ken Burns MP4s and play through `OffthreadVideo` with no colour treatment: the manifest's duotone `ramp` is silently ignored for video. Photographs go through ImageComposite with three different treatments. The episode therefore mixes at least six looks.

### Cited Findings
- FOOTAGE path: `<BrandImage src="" ramp={ramp} composite="raw" opacity={1}><OffthreadVideo …/></BrandImage>` (`FullEpisode.tsx:574-597`). In `BrandImage`, the duotone SVG filter is applied only to the `<Img>`, which is skipped when `src` is empty; the comment says "video-child mode … while still receiving grain + vignette overlays" (`BrandImage.tsx:199-215, 241-242`). The call-site comment "BrandImage filter applied to the container; video below" (`FullEpisode.tsx:582`) is therefore inaccurate.
- All 25 resolved FOOTAGE segments carry `treatment.ramp` (`standard` on 23; `conflict` on the two stock clips, `beat6-seg32` and `beat6-seg33b`); in QA frames all of them render in natural colour (`sheet-1.png` to `sheet-5.png`; the stock dyno and freeway clips in `sheet-4.png`).
- No `startFrom`/trim or `playbackRate` is set on the episode's `OffthreadVideo`; `AiGenClip` (with `playbackRate`) and `KenBurns.tsx` are not used by `FullEpisode` (used by PhotoMontage, AnnotatedImage and a showcase only).
- Clip production: stills are 1672×941 (`public/episodes/ai-care-motives/stills/aigen-02-shop-counter.png`), "upscaled 4x (Real-ESRGAN, stills-4k) and 16 Ken Burns clips rendered (1920x1080, 30fps …)" (`../episodes/ai-care-motives/_status.md:39`), by ffmpeg `zoompan` after prescaling to 5016 px wide (`../tools/ai-video/render_kenburns.py:1-70`).
- Clip files (ffprobe): 17 AI clips at 1920×1080, 30 fps, H.264 yuv420p, 0.7 to 7.3 Mbps (for example `aigen-10-b7open.mp4` 705 kbps, `aigen-06.mp4` 1.6 Mbps, `aigen-03-unwatched.mp4` 7.3 Mbps); 2 stock clips at 30000/1001 fps, 6.2 and 8.3 Mbps. Total 138 MB.
- Reuse: QA reports "Still aigen-10 used 5×" and "aigen-06 used 4×" (`report.md`). Six clip files are each used in two segments (`aigen-10.mp4`, `aigen-10-b7close.mp4`, `aigen-06.mp4`, `aigen-06-b4b.mp4`, `aigen-08.mp4`, `aigen-09.mp4`), for example `aigen-09.mp4` in `beat7-seg38a` and again in `beat7-seg39` 23 s later.
- Photographs via ImageComposite: `portrait-kant`, `portrait-mill`, `portrait-plato` and `photo-pems` have `duotone: "none"`; `photo-vw-wolfsburg` and `photo-vw-golf` have `duotone: "conflict"` (ink to `#7A2E1A` to china red); the SplitFrame panes use `duotone: "editorial"` (taupe to bone to paper) at the `background` variant. — data files; `theme.ts:895-911`
- As rendered: untreated grey engravings (Kant, Mill), a cut-out marble bust on paper (Plato), a red monochrome factory and car (`sheet-3.png`), a full-colour blue equipment photo in a bordered inset (`sheet-4.png`, `beat6-seg33`), full-colour stock video, warm-amber AI illustrations, and a washed-out beige duplicate of an AI still in both SplitFrame panes (`frames/08-beat2-seg08.png`).
- ImageComposite defines its duotone filter three times with fixed ids (`imgcomp-duotone-<ramp>`, `imgcomp-inset-duotone`, `imgcomp-portrait-duotone`) (`ImageComposite.tsx:96-150, 299-356, 457-513`).
- Placeholders: `beat7-seg41` and `beat7-seg43` (12 s each) have no asset and render a paper card with a mono label (`FullEpisode.tsx:523-566`; `report.md`).

### Inferences
- The six repeated clips restart from their first frame on reuse, so the same camera move is seen twice (inferred: no trim props at the call site).
- The low-bitrate source clips are decoded and re-encoded by the final render, so dark gradients in the illustrations pass through two lossy encodes; the 705 kbps clip is the most exposed. Not inspected at pixel level.
- The 29.97 fps stock clips in a 30 fps timeline will repeat a frame roughly every 33 s; negligible at 10 s holds.
- The capability map's item 5 ("palette-match AI-GEN footage at render time") is the unbuilt feature that would unify these looks; today the only shared treatment between stills and cards is grain.

### Gaps
- Whether natural colour for the AI stills is an intended art-direction choice or an accident of the no-op ramp is not recorded anywhere I found.
- I did not inspect the clips for zoompan jitter or upscale artefacts frame by frame.

---

## 8. Audio

### Takeaway
A complete three-layer audio system exists in code (music beds with ducking, transition SFX, texture hits, ambient soundscapes), and the manifest is fully cued, but none of the audio files exist and there is no narration. The working path is a picture-only render with audio added in the editor.

### Cited Findings
- `AudioLayer` renders music beds from `episodes/<slug>/<track.file>` with per-track fade in/out, `loop`, and a per-frame ducking curve (segment-type multipliers smoothed with a 0.8 s EMA), SFX from `assets/audio/sfx/<type>-<intensity>.mp3`, and texture hits from `assets/audio/sfx/<type>.mp3` at ≤0.20 volume (`src/components/AudioLayer.tsx:1-33` and the music/SFX/texture blocks near L300, L370, L430). Ducking is unit-tested (`src/__tests__/audioLayerDucking.test.ts`).
- The manifest carries 6 music-bed tracks (volumes 0.11 to 0.13, from 64.0 s), sound cues on 22 segments (+2 secondary) and texture cues on 21 segments. Resolved to file names, that is 63 cue firings across 20 distinct SFX files and 4 distinct bed files.
- Every one of those 24 files is missing under `public/`: `public/assets/audio/sfx/` contains 0 files, there is no `public/episodes/ai-care-motives/audio/`, and `public/audio/sfx/` (the tree `AudioLayer.tsx:29-30` calls "retired") holds 2 files. — existence check script
- Narration: `manifest.narration` is `{"totalDurationSec": 678.6, "words": []}` with no `audioFile`; `FullEpisode.tsx:1279-1285` only mounts narration when `audioFile` is set.
- Missing-file handling differs by component: `Soundscape.tsx` documents "Missing assets are SAFE no-ops" with a one-time warning (L26-29, 66-75); `AudioLayer.tsx` has no existence check (grep for `exists` and `isAudioDisabled` finds none in that file) and mounts `<Audio src={staticFile(…)}>` directly.
- Bypass: `isQaMode()` (inputProps `qa: true`) and `isAudioDisabled()` (inputProps `noAudio: true`, also implied by QA) make `FullEpisode` skip narration and `AudioLayer` (`src/utils/qaMode.ts`; `FullEpisode.tsx:1274-1293`). `qaMode.ts` states: "The edit adds narration, music and SFX from the episode's audio cue sheet." `../AGENTS.md:91` documents the picture-only render.
- Soundscape cascade: each foreground segment resolves an ambient register and mounts `<SoundscapeMount>` (`FullEpisode.tsx:822-832, 870`); the six ambient asset slots are "Stub-empty initially" (`public/assets/audio/README.md`).
- D18 check: the first bed starts at 64.0 s, exactly when the title card (`beat1-seg06`, 57 to 64 s) ends, and the title card has no sound cue. — manifest
- Helper tools exist outside Remotion: `../tools/generate_sfx.py`, `../tools/check_audio_cues.py`, `../tools/narration/`.

### Inferences
- Rendering `ai-care-motives-full` without `noAudio` would most likely fail on the first missing bed or SFX file, since `AudioLayer` does not guard (inferred from code; not run).
- Because audio is assembled in the editor, the in-Remotion ducking, cue volumes and soundscape cascade are untested against real material for this episode, and nothing in QA covers audio at all.
- Sound-synchronised visuals (`useBeatSync`, the `_proto/NarrationSync` waveform) have nothing to read until a narration file exists.

### Gaps
- I did not open `../episodes/ai-care-motives/audio/` to see whether a cue sheet or draft audio exists outside `public/`.
- How `Soundscape` detects a missing asset (so that it can no-op) was not read.

---

## 9. Narration sync (syncWords / syncPoints, "D17")

### Takeaway
The anticipatory-reveal mechanism is built and wired into about a third of the library, but it has no data to run on in this episode: there is no narration recording, so no word timestamps, and only 2 of 29 template segments even name a sync word. Every reveal currently runs on template-default timings from the segment start.

### Cited Findings
- Mechanism: scripts emit `sync:"word"` / `syncs:[…]`, `generate_manifest.py` stores `syncWords`, "precise" mode aligns them with WhisperX + SileroVAD + RapidFuzz into `syncPoints` (`../tools/assembly/generate_manifest.py:11-13, 729-741, 2311-2312, 2430-2449`); `FullEpisode` converts absolute `syncPoints` to segment-relative and merges them into `data._direction` (`FullEpisode.tsx:747-779`); templates call `anticipatoryStartFrame(syncPoints[i].frame, …)` so an element is settled 5 frames before the word (`animation.ts:86-135`; `POLISH.md` D17, D17.1).
- Support: 65 of 96 template dirs reference `syncPoints`; 37 use the anticipatory helpers. Seven templates have per-element sync (AnnotatedImage, ArcDiagram, BumpChart, EscalationLadder, FrameworkDiagram, HorizontalTimeline, NetworkDiagram) per `POLISH.md` D17.1.
- Episode templates with no `syncPoints` handling at all: DotPlot, ImageComposite, SplitFrame, SplitComposition, MathDerivation. Three only forward it to the title (ConditionalArgument `:151`, AxiomList `:111`, PrimarySourceReveal `:192`), so their rows, branches and highlights are not anchored.
- Episode state: manifest `mode: "estimate"`, `narration.words: []`, no segment has `syncPoints`; `syncWords` on 2 segments only (`beat4-seg22` "four days later", `beat6-seg31` "forty times").
- Manifest lint today: 31 warnings, 0 errors: `M-SYNC-MISSING` 27, `M-SYNC-COUNT` 1 (`beat4-seg22`: 2 entities, 1 sync word), `M-BGMODE` 2 (beats 6 and 8 mix dark and light cards), `M-DRIFT-DEFAULT` 1 (`beat8-seg49` uses `driftPreset: "none"`). — `python3 tools/lint/manifest_lint.py remotion-templates/data/episodes/ai-care-motives/assembly-manifest.json`
- Timing of on-screen text against narration is flagged by QA in two places: `beat2-seg09` "hold 4s < 5.0s needed for 8 words" and `beat6-seg31` "hold 7s < 8.8s needed for 23 words"; three quote cards are static for 17 to 23 s (`report.md`).
- The alignment stack is Python (WhisperX); `@remotion/install-whisper-cpp` and `@remotion/captions` are not installed (section 1), and the capability map ranks "Whisper word-timing → animation" as its highest-leverage unbuilt item.

### Inferences
- Until narration is recorded and the manifest is rebuilt in precise mode, D17 cannot be satisfied anywhere in this episode; after that, at most the templates with per-element support (FrameworkDiagram, HorizontalTimeline, NetworkDiagram here) and those using the helpers (KineticTypography, StatReveal, TitleTransition) can benefit. Roughly half the episode's template segments use components that would still ignore the cues.
- Segment durations are estimates too, so all hold lengths and cue offsets will move once real audio exists.

### Gaps
- I did not run `generate_manifest.py` or check whether WhisperX is installed locally.

---

## 10. Rendering pipeline and performance

### Takeaway
The render configuration is minimal and sensible for text (PNG frames, ANGLE GL), but it sets no colour space, CRF or concurrency, the per-clip render script does not apply to this episode, and no full-length render of `ai-care-motives` exists yet. The main cost and risk items are full-frame animated SVG filters on every frame, 25 video segments, and a few sources of non-determinism.

### Cited Findings
- `remotion.config.ts` sets `setVideoImageFormat("png")`, `setPixelFormat("yuv420p")`, `setOverwriteOutput(true)`, `setChromiumOpenGlRenderer("angle")`. It does not set concurrency, CRF, codec, colour space, x264 preset or bitrate (grep for those setters returns nothing; only `scripts/render-prisoners-dilemma.sh:40` passes `--concurrency=2`).
- Paths: full episode via `npx remotion render ai-care-motives-full …` (header of `src/templates/Episodes/AiCareMotivesFull.tsx`; `../AGENTS.md:91` adds `--props='{"noAudio":true}'`); `scripts/preview-range.mjs` renders a time range in QA mode with `renderMedia`; `scripts/qa-episode.mjs` renders one still per segment; `scripts/render-episode.mjs` renders per-clip sequences from `scripts/sequences/<slug>.json`, and only `silicon-trap.json` exists there; `render-lambda.mjs`/`deploy-lambda.mjs` are scaffolded and dormant (`package.json` `_lambda_scaffolded`); `render-shorts.mjs`, `generate-thumbnails.mjs` exist.
- Existing outputs for this episode in `out/`: `qa/ai-care-motives/` (54 frames, 5 sheets, reports), `ai-care-stills/`, and one preview `preview/ai-care-motives/355.5-370.7.mp4`. No full-length MP4 was found (`find out -maxdepth 2 -iname "*care*" -name "*.mp4"` returns nothing else).
- The preview file probes as H.264 1920×1080 30 fps, `pix_fmt=yuvj420p`, `color_space=bt470bg`, primaries and transfer unknown, 12.1 Mbps.
- Workload: 20,358 frames; 25 `OffthreadVideo` segments over 19 files, sequential so at most one video decodes at a time; "Uses `<OffthreadVideo>` instead of `<Video>`" because `<Video>` "hits cache eviction stalls at 20-30% render progress" (`FullEpisode.tsx:29, 575-578`; `LESSONS.md` L92).
- Per-frame work that is always on: EditorialSurface full-frame `feTurbulence` (attribute patched every 2 frames; the comment records an earlier version that rebuilt "~12,000 fresh filter elements per episode") (`EditorialSurface.tsx:59-110`); on cards a second `feTurbulence`, two elements with `filter: blur(80px)` whose positions change every frame, and SVG particles (`Background.tsx:393-470`); on footage a noise PNG and a vignette (`BrandImage.tsx:217-239`). `feTurbulence` appears in 6 source files.
- No premounting: `premountFor` has 0 occurrences in `src/`.
- Robustness: each segment is wrapped in a `SegmentErrorBoundary` so one bad segment shows a placeholder instead of aborting (`FullEpisode.tsx:613-680`); `warnIf` de-duplicates per-frame warnings.
- Non-determinism: `FooterStrip` calls `new Date()` during render (`FooterStrip.tsx:41-46, 59`); `measureText` races font loading (`LESSONS.md` L117); `cinematicMapUtils.ts` uses `Date.now()` for tile-warm timeouts (maps only, not in this episode).
- Known gotchas recorded in `LESSONS.md` (118 lesson headings): L31 first render in a batch hits a cold-start race, so batch scripts retry; L115 `remotion still` caches the webpack bundle; L106 `warmTiles()` without `.catch()` leaks `delayRender`; L102 MapGL warm-up; L114 `ThreeCanvas` needs `delayRender`; L80 duotone filter construction; L110 `warnIf` in render body.
- Data lint: `python3 scripts/lint-templates.py` ends "48 errors · 131 warnings · 137 info … ✗ 48 errors — render may crash or look broken" across all data files including the catalog.
- Machine: 14-core Apple M4 Max (`sysctl`).

### Inferences
- `remotion.config.ts` governs CLI renders; the Node-API scripts (`qa-episode.mjs`, `preview-range.mjs`) pass their own options, which is why the preview is `yuvj420p` rather than the configured `yuv420p`. (Remotion behaviour from general knowledge.)
- With no colour space set, the final file is likely to be tagged as the preview is (BT.601-style `bt470bg`) rather than BT.709, which risks a small colour shift after YouTube transcoding. This should be confirmed on a real full render before changing anything.
- Full-frame `feTurbulence` at 1920×1080 on every frame, twice on cards, plus two large blurs, is probably the dominant per-frame CPU cost for card segments; I did not time it.
- The `new Date()` footer means two renders of the same commit on different days differ in pixels, and a render that crosses midnight would change mid-video.

### Gaps
- No full render was timed (constraint: no long renders). Frames-per-second, memory use and total wall time for the 11-minute episode are unknown.
- I did not break the 48 data-lint errors down by episode, so I cannot say whether any apply to `ai-care-motives`.
- Lambda scripts were not exercised.

---

## 11. Testing and QA: what is covered and what is not

### Takeaway
Static structure is well guarded (schemas, registries, layout maths, conventions) and there is a measured QA pass for settled frames. Nothing checks motion, seams, audio, colour, font fallback or frame fill, and the only stored full-suite result is five months old and failing.

### Cited Findings
- `src/__tests__/` holds 86 entries and 328 baseline PNGs in 15 baseline folders. Suites include unit tests for animation helpers, `useCompositionAnimation`, `useDirection`, transitions grammar, film-overlay and soundscape cascades, audio ducking, layout zone integrity (`chart-zone-integrity`, `template-zone-integrity`), schema/type/registry alignment, lint self-tests, and render-based suites (`templates.test.ts`, `catalog-smoke`, `*-real-data`, `editorialFrame-visual`, `full-episode-smoke`).
- Visual regression (`src/__tests__/templates.test.ts`): renders frame 30 per composition, plus frames 0 and 60 for a "motion" subset (`TEST_FRAME = 30`, `MOTION_EXTRA_FRAMES = [0, 60]`), compared with pixelmatch at a 0.5% threshold.
- Episode coverage: `full-episode-smoke.test.ts` renders two frames of `PrisonersDilemmaFull` only and "Does NOT pixel-compare against a baseline"; `episode-integrity.test.ts` discovers every `data/episodes/*/assembly-manifest.json`; the string `ai-care-motives` appears in `src/__tests__` only in `template-coverage.test.ts`.
- Stored result: `test-results.json` (file date 2026-05-19) records 1,638 tests, 111 failed, 22 of 400 suites failed, `success: false`. Vitest runs single-worker (`vitest.config.ts`: `maxWorkers: 1`).
- Lints, run read-only on 10 Oct 2026: `node scripts/lint-conventions.mjs` → "All conventions pass" (at least 19 rule ids found by grep, e.g. `hardcoded-brand-color`, `hardcoded-safe-pixels`, `missing-composition-animation`, `missing-direction-wiring`, `no-console-in-render`, `nested-ken-burns`); `python3 ../tools/lint/polish_lint.py` → 99 violations (2 errors, 97 warnings) in 26 of 131 files, by rule L9 36, L1 29, A1 12, L10 11, L12 5, A2 3, L13 2, L7 1; episode templates affected: ConditionalArgument 11, SplitFrame 6 (including the L13 error), PrimarySourceReveal 4, AxiomList 3, StatReveal 2, HorizontalTimeline 1, ImageComposite 1. `manifest_lint.py` → 31 warnings (section 9).
- QA tool (`scripts/qa-episode.mjs`, rules in `../project/VISUAL_QA.md`): episode-level checks from manifest and script (text-card share, static holds, words versus hold time, narration redundancy, still reuse, template runs, dark/light switches, placeholders) and frame-level checks from one still per segment in QA mode, where `<QaProbe>` logs every visible text node's box, effective size, colour, opacity and role (`src/components/QaProbe.tsx`): minimum size (fail <18, warn <22), EBU R95 safe area, WCAG contrast against rendered pixels, overlap >15%, clipping.
- Sampling point: `max(start + min(0.5, d/2), end − min(1.5, d×0.25))` (`qa-episode.mjs:349-352`), i.e. late in each segment.
- Latest result: 54 frames, 0 fail, 96 warn (SIZE 46, CONTRAST 42, SAFE 8); text cards 16% of runtime, all templates 56%; 4 dark↔light card switches; 2 placeholders; 2 still-reuse issues. — `report.md`, `report.json`
- Declared limits (`VISUAL_QA.md`): "One frame per segment … Problems that only exist mid-animation are not caught"; contrast sampling can mislead over busy images; chrome size "reported once, not failed".

### Inferences
- Not checked by any test, lint or QA rule, each with an instance found in this audit: seam frames and transition correctness (blank frames, iris ring, section 3); entrance and exit quality; font fallback (the Times subtitle passed with only a contrast warning); adjacent-label collisions under the 15% overlap threshold (DotPlot, section 13); frame fill and dead space; luminance jumps between dark footage and light cards (QA counts only card-to-card switches); gradient banding and colour consistency across image treatments; duplicated or internal chrome strings; render determinism; anything about audio (QA disables it).
- The QA floor (18/22 px) and the lint/doctrine floor (14 px tertiary) disagree, so a template can be lint-clean and QA-noisy at once.
- The visual baselines lock in current behaviour, including the defects in sections 2 and 4, so system-wide fixes will require regenerating most of the 328 baselines.

### Gaps
- I did not run vitest, so the current pass/fail state is unknown; the May result may be stale in either direction.
- The two placeholder segments were not rendered by QA (54 frames for 56 segments), so their on-screen look is from code only.

---

## 12. Doctrine versus code, and stale documentation

### Takeaway
The doctrine is extensive and in places contradicts itself, the code, or the episode. The episode breaks several stated rules outright (cold-open length, title-card hold and transition, particles on paper, underfilled canvases, linear motion), and core docs describe hooks, colours and counts that no longer exist.

### Cited Findings
Internal contradictions:
- Springs: `POLISH.md` A2 requires `spring()` for hero reveals with "organic overshoot" and says "`gentleSpring()` … use it"; `CLAUDE.md` (Design system) says motion "never bounces/overshoots"; `polish_lint.py` rule A2 is "Forbidden easing (bounce/elastic/back)". Code: `gentleSpring` 0 uses, `heroSpring` (damping 12, which overshoots) 15 uses in 8 dirs.
- Tracking: `POLISH.md` T2 and its type table give display 3 px, h1 2 px; `theme.ts:570-585` sets display −1, h1 0 with a comment explaining why.
- Shadows and cards: `POLISH.md` V3 "Every card, chart bar, framework node … gets a drop shadow" versus D1 "Drop card chrome" and `LESSONS.md` L112 "remove background fills and boxShadow from content panels".
- Text size: `POLISH.md` T1 tertiary 14 to 18 px versus `VISUAL_QA.md` fail <18, warn <22.
- Safe area: 80 px (POLISH diagram), 120 px generous in most templates, 96×54 in QA.

Code that breaks stated rules:
- A1 "No linear interpolation": 518 linear fade calls; `useCompositionAnimation` enter fade is linear (section 2).
- V7 "Text blocks over dark backgrounds get a subtle text shadow … not … large titles": the shadow is applied in light mode and to titles (section 4).
- T7 "The unit/suffix inherits the same font but at 50% of the number size": StatReveal renders prefix, value and suffix at one size (`StatReveal.tsx:117-136`).
- L12 "No hardcoded shadow strings": 5 lint hits in templates; in addition the shared `SectionIndicator.tsx:139` hard-codes `"0 1px 3px rgba(0,0,0,0.5)"` (the lint run reported template files only).
- L13 "Use `<TitleBlock>`": SplitFrame and BarChartRace fail (lint errors).
- D20 anti-pattern "Particle layers on light/paper substrate": light-mode default atmosphere is `subtle` particles (`Background.tsx:336-339`), and `beat7-seg38` sets `dense`.
- D3/D16/T6 (centre sparse content, no dead paper, use the canvas): ConditionalArgument, FrameworkDiagram comparison, DotPlot, AxiomList and the quote cards as rendered (section 5).
- D21 "Fade-through-black" for title cards and "Cross-dissolve" at beat boundaries: in the episode path both fade against cream paper and do not cross (section 3). The iris ring is misplaced.

Episode choices that break stated rules:
- D18 companions: "Cold-open runtime ≤ 2% of episode length (10-14s for 15min)", "Title-card hold = 2.0s", "Hard cut between cold open and title card — no wipes, no dissolves". Here the cold open runs 0 to 57 s (8.4% of 678.6 s), the title card holds 7.0 s, and it has `fade` in and out at 0.6 s (manifest, `beat1-seg06`). The music rule itself is met (bed starts at 64.0 s).
- D17: no word timings; 27 segments without sync words (section 9).
- `M-BGMODE`: beats 6 and 8 mix dark and light cards.
- `VISUAL_QA.md` house rules: still reuse >2 (two stills), static text card >15 s (three quote cards, exempt as quotations from the redundancy rule but flagged for hold), two holds shorter than the words need.

Stale or inaccurate documentation:
- `CLAUDE.md` (remotion-templates, "Last updated: September 22, 2026") lists `useEntrance` as a key hook; it was removed (`src/hooks/index.ts:40`). It says "~83 core" templates; there are 96 dirs and 87 registry entries.
- `POLISH.md` (last updated May 16, 2026) quotes colours that are not in the palette (`ink (#1A1A2E)`, `#0D0D1A`, `#3266AD` in V2, T5 and examples; palette ink is `#1C1814`), grounds itself in "CaspianReport … Wendover … PolyMatter", and its reading order says "doctrine (D1–D18)" though D19 to D21 exist.
- `FullEpisode.tsx:582` comment claims the BrandImage filter applies to video; `FullEpisode.tsx:856-859` refers to "a UNION of all 47 component types".
- `Transitions.tsx:8-20` says "8 canonical transitions" and lists seven; describes `fade` as a fade-through-black surrogate.
- `AudioLayer.tsx:29-30` calls `public/audio/sfx` retired; the directory still has files, and the manifest's beds are `.wav` under a path that does not exist.
- `REMOTION_CAPABILITY_MAP.md` item 3 calls layout-utils a "cheap retrofit"; `LESSONS.md` L117 (same date) documents why it is not.
- Root `../CLAUDE.md` notes that strategy docs "have not been updated yet and may still describe the geopolitics framing"; the on-screen chrome (REC, FILED, coordinates slot) is part of that framing.
- `test-results.json` is from May 19, 2026 and failing; `package.json` still exposes Lambda scripts it describes as dormant.

### Inferences
- The doctrine has outgrown its enforcement. Rules with a lint (brand colours, z-index, composition animation, transitions vocabulary) hold; rules without one (D3, D16, D18 companions, D20, T7, V7) are the ones broken.
- Several contradictions come from layering newer editorial doctrine (May 2026, print-newsroom register) over an older "cinematic" spec (shadows, glows, springs, particles) without retiring the older rules.

### Gaps
- I read `POLISH.md` sections 1 to 4 and D1 to D5, D13, D15 to D21, T6 in full; D6 to D12, D14 and T1 to T5 were only skimmed by heading.
- `BRAND.md`, `../project/TRANSITION_GRAMMAR.md`, `HOLD_MOTION_REGISTER.md` and `TEXT_ANIMATION_REGISTER.md` were consulted through grep and the POLISH summaries, not read end to end.

---

## 13. The ten most visible polish weaknesses in `ai-care-motives` as it renders today

### Takeaway
The weaknesses that a viewer would notice first are at the seams and in the cards' emptiness and finish, not in the illustrations. Most trace to shared code (transition wrapper, theme hook, TitleBlock, Background), so a small number of fixes would improve many segments.

### Cited Findings
1. Seams are not crossfades, and the iris is defective. At the `beat5-seg27` → `beat5-seg28` dissolve the dark still cuts to blank cream frames before the card fades up; at the `beat5-seg26` → `beat5-seg27` iris the gold ring floats inside the circle and the corners go black. Applies to all 8 dissolve-ins and 3 fade-ins. Cause: per-segment `TransitionWrapper` with no overlap over a paper surface (`Transitions.tsx:404-474`; `FullEpisode.tsx:1056-1185, 1259`); ring radius constant (`Transitions.tsx:308-313`). Evidence: frames at t=2.20 to 2.80 s and t=12.70 to 13.00 s of `out/preview/ai-care-motives/355.5-370.7.mp4`.
2. Long, static, underfilled text cards. `beat2-seg11` (23 s), `beat3-seg15` (17 s), `beat5-seg26` (17 s): a two- or three-line quote at about 44 px in roughly 8% of the frame, three typefaces, and after the opening reveal no motion beyond a sub-1% to 2% scale drift; QA flags all three as "static text card held >15s". Also `beat4-seg20` FrameworkDiagram (24 s; 22 px rows under 64 px heads, lower third empty), `beat8-seg46` ConditionalArgument (24 s; lower ~45% empty). Cause: fixed type sizes with no fitting, top-anchored layouts (`CompositePatterns.tsx:412-495`; `ConditionalArgument.tsx:90-95`; `FrameworkDiagram`). Evidence: `frames/12-beat2-seg11.png`, `frames/21-beat4-seg20.png`, `sheet-5.png`.
3. Dark smudge under all text on light cards. Titles, subtitles, sources and chrome carry `0 1px 3px rgba(0,0,0,0.5)` on cream. Affects every light card (25 of 29 template segments are light). Cause: `useThemeMode.ts:77` and 122 unconditional `shadows.textLift` uses. Evidence: 2× crop of `frames/42-beat7-seg37.png`; `frames/21-beat4-seg20.png`.
4. Fallback serif (Times-style) in subtitles and slug labels. Subtitles in `beat4-seg22`, `beat6-seg34`, `beat7-seg37`, `beat7-seg42`; bottom-left slug label on KineticTypography cards (`beat1-seg01`, `beat2-seg11`, `beat3-seg15`, `beat5-seg26`, `beat5-seg28`, `beat8-seg47`). Cause: no `fontFamily` at `TitleBlock.tsx:214-224` and `KineticTypography.tsx:960-976`. Evidence: crop of frame 42; `frames/12-beat2-seg11.png`.
5. Internal and off-register chrome. "AI-CARE-MOTIVES" in the header of every chromed card and again at bottom-left on some; "● REC 00:xx" restarting each segment; "FILED 2026-10-10" (render date); all at 10.9 px; present on some templates and absent on others (SplitFrame, PrimarySourceReveal, portrait cards). Cause: `HeaderStrip metadata={data.episode}`; `FooterStrip.tsx:41-62`; chrome opt-in per template. Evidence: frames 12, 21, 36, 42; `report.md` ("Chrome text … smallest size: 10.9px").
6. `beat7-seg37` DotPlot: labels collide. "Gemini 2.5 Pro · 0.71" and "Human raters · 0.81" run into each other on one line, detached from their dots; 36 px mono labels dwarf 18 px ticks and 24 px dots; chart is a thin band. Cause: placement alternates above/below by index and staggers only dots within 60 px, with no text-width measurement (`DotPlot.tsx:333-354, 391-393`); data sets `labelScale: "large"`. QA did not flag it (adjacent, under 15% overlap). Evidence: `frames/42-beat7-seg37.png`.
7. `beat2-seg08` (21 s) and `beat2-seg09` (4 s) SplitFrame. The same AI still appears twice as a washed-out beige band with empty paper above and below; "DUTY"/"PRUDENCE" badges sit at the extreme corners outside the safe area over the ruled border; captions use straight quotes; no chrome; linear fades only; `seg09` is shorter than its 8 words need. Cause: SplitFrame scales a full 16:9 template into each half-width pane, `ImageComposite` `background` variant with `editorial` duotone; hand-built labels (`SplitFrame.tsx:228-300, 357-424`; `shop-motif-reasons.json`). Evidence: `frames/08-beat2-seg08.png`; QA SAFE and CONTRAST (3.2:1) warnings.
8. `beat6-seg31` StatReveal. "up to 40x" is set entirely in 120 px JetBrains Mono with a glow, so the words "up to" look like data; the comparison label wraps to an orphan "to)"; the bar has gradient and shadow; 7 s for 23 on-screen words (QA: needs 8.8 s). Cause: prefix + value + suffix formatted as one string (`StatReveal.tsx:117-136`); data label text. Evidence: `frames/36-beat6-seg31.png`.
9. Six unrelated image looks. Natural-colour AI illustrations; natural-colour stock video (`beat6-seg32`, `beat6-seg33b`); red "conflict" duotone photos (`beat6-seg29`, `beat6-seg29b`); an untreated colour photo (`beat6-seg33`); untreated grey engravings (`beat2-seg11a`, `beat3-seg15a`) and a marble cut-out (`beat5-seg24`); beige "editorial" duotone (`beat2-seg08/09`). Cause: duotone ramp is a no-op for video (`BrandImage.tsx:199-215`), per-file `duotone` choices in ImageComposite data. Evidence: `sheet-1.png` to `sheet-4.png`.
10. Paper background artefacts on light cards. Large tinted blotches with visible banding rings and scattered grey specks; one analytical card (`beat7-seg38`) asks for `dense` particles. Cause: blurred low-alpha radial "atmosphere" clouds and default `subtle` dust on light (`Background.tsx:336-339, 434-470`); `free-tier-conditional.json`. Evidence: `frames/12-beat2-seg11.png`, `frames/21-beat4-seg20.png`, `frames/36-beat6-seg31.png`.

Also noted, lower priority: still reuse (`aigen-10` ×5, `aigen-06` ×4) with six clips replaying the same move from frame 0; two 12 s placeholders (`beat7-seg41`, `beat7-seg43`); a cold open of 57 s and a 7 s title card against the D18 companions; constant alternation between dark stills and bright cream cards (27 footage and 29 template segments interleaved, with only 4 card-to-card switches counted by QA); opacity-only linear reveals on AxiomList (`beat3-seg17`, `beat5-seg28b`) and MathDerivation (`beat7-seg42`).

### Inferences
- Items 1, 3, 4, 5 and 10 are shared-code issues: fixing five places (`TransitionWrapper`/segment overlap, `useThemeMode`, `TitleBlock`, chrome props, `Background` light defaults) would change the look of most of the 29 template segments.
- Items 2, 6, 7 and 8 are template-level and would recur in any future episode that uses those templates with sparse data; they point to missing text fitting and missing "fill the canvas" logic rather than to bad data.
- Item 9 is an art-direction decision that the code currently makes by accident.
- Ranking is my judgement of visibility from frames; it is not measured.

### Gaps
- Only one 15 s stretch was seen in motion. Entrances, the BeatFlash, colour-wash seams and the title card were judged from code and settled stills.
- Dark cards (`beat1-seg01`, `beat1-seg06`, `beat6-seg29`, `beat8-seg49`) were reviewed only at contact-sheet scale.
- No viewer or phone-size test was done; "visible" means visible at 1920×1080 on a desktop.
