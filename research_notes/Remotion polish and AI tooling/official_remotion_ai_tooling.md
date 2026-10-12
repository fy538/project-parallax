# Official Remotion ecosystem for AI-assisted video creation, and 2024–2026 platform features relevant to polish (state as of 10 October 2026)

Provenance notes for the report writer (not a section): everything below was checked on 2026-10-10 against primary sources: remotion.dev pages fetched as Markdown, the docs source in the `remotion-dev/remotion` monorepo (`main` branch), the `remotion-dev/skills` repository, GitHub release notes (latest 60 releases, v4.0.474–v4.0.534) and the npm registry. Version-to-date mappings come from npm publish timestamps. The docs on `main` are slightly ahead of npm: a few items are tagged v4.0.535, which is not published yet. Guidance from skill files is paraphrased closely with exact API names, flags and commands preserved; follow the links for verbatim wording. Items from 2026 are marked **[2026]**. Secondary sources are marked as such.

## 1. What is "Remotion Skills" / agent skills for Remotion, what do they contain, when were they released, and how are they used with Claude Code, Cursor or Codex?

### Takeaway
Remotion Agent Skills are the official, maintainer-written instruction set for coding agents, published at `remotion-dev/skills` (repo created 19 Jan 2026) and installed with `npx skills add remotion-dev/skills` or `npx remotion skills add`. Since a July 2026 rewrite they are 12 slash-skills with `remotion-best-practices` as a router and `remotion-markup` holding about 35 rule files; the early `charts`, `text-animations` and `animations` rule files no longer exist at HEAD, and the current rules assume the newest Remotion APIs (v4.0.534).

### Cited Findings

**What it is and where it lives**
- Remotion describes the skills as a maintained list of Agent Skills (agentskills.io format) that encode best practices for Remotion projects, aimed at agents such as Claude Code, Codex, Kimi Code and Cursor — [Agent Skills docs](https://www.remotion.dev/docs/ai/skills)
- **[2026]** The public repo `remotion-dev/skills` was created on 2026-01-19, last pushed 2026-10-07, and had 5,004 stars and 554 forks on 2026-10-10 — [GitHub API: remotion-dev/skills](https://api.github.com/repos/remotion-dev/skills)
- The docs point to the monorepo package `packages/skills` as the source; the public repo's history is 88 identically titled automated commits whose dates track Remotion releases, and it contains sync scripts — [Agent Skills docs](https://www.remotion.dev/docs/ai/skills); [skills repo](https://github.com/remotion-dev/skills)
- Each top-level skill carries a `version` field matching the Remotion release (currently 4.0.534), so skills are versioned with the framework — [remotion-markup SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/SKILL.md)
- There is no `@remotion/skills` package on npm (registry returns 404); distribution is via the GitHub repo and the `skills` CLI — [npm registry lookup](https://registry.npmjs.org/@remotion%2Fskills)

**Install and update**
- Install with `npx skills add remotion-dev/skills`; `bun create video` also offers to add skills during scaffolding — [Agent Skills docs](https://www.remotion.dev/docs/ai/skills)
- `npx remotion skills add` and `npx remotion skills update` wrap the same repo. Skills land in `.agents/skills`, and Claude Code compatibility is provided by symlinking `.claude/skills` to `.agents/skills` — [CLI skills docs](https://www.remotion.dev/docs/cli/skills)
- **[2026]** `npx remotion upgrade` updates project-local skills too (v4.0.503, 2026-07-31; opt out with `--skip-skills`), and the CLI and Studio detect outdated skills — [release v4.0.503](https://github.com/remotion-dev/remotion/releases/tag/v4.0.503); [upgrade CLI docs source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/cli/upgrade.mdx)
- **[2026]** Studio gained Agent Skills settings (v4.0.516), in-Studio skill installation (v4.0.525) and an upgrade/action menu for skills (v4.0.534) — [release v4.0.516](https://github.com/remotion-dev/remotion/releases/tag/v4.0.516); [release v4.0.525](https://github.com/remotion-dev/remotion/releases/tag/v4.0.525); [release v4.0.534](https://github.com/remotion-dev/remotion/releases/tag/v4.0.534)
- The recommended agent workflow is: scaffold with `npx create-video --yes --blank my-video`, run `npx remotion skills add`, start `npm run dev`, then start the agent (`claude`, `codex`, `kimi` or `opencode`) in a second terminal — [Coding agents docs](https://www.remotion.dev/docs/ai/coding-agents)

**Agent plugins (each bundles the skills)**
- **[2026]** Remotion maintains plugins for Codex (ChatGPT desktop app), Claude Code, Cursor (Cursor Marketplace), GitHub Copilot CLI and Kimi Code — [Plugins docs](https://www.remotion.dev/docs/ai/plugins)
- **[2026]** Claude Code plugin: `claude plugin marketplace add remotion-dev/claude-code-plugin` then `claude plugin install remotion@remotion`, or add it from the Claude desktop app plugin directory; skills are invoked namespaced, e.g. `/remotion:remotion-create` — [Claude Code plugin docs](https://www.remotion.dev/docs/ai/claude-code-plugin)
- **[2026]** The Claude Code and Kimi Code plugins shipped in v4.0.491 (2026-07-18); the Cursor plugin in v4.0.507 (2026-08-07); the Codex plugin docs page in v4.0.490 (2026-07-16) — [release v4.0.491](https://github.com/remotion-dev/remotion/releases/tag/v4.0.491); [release v4.0.507](https://github.com/remotion-dev/remotion/releases/tag/v4.0.507); [release v4.0.490](https://github.com/remotion-dev/remotion/releases/tag/v4.0.490)

**The 12 current skills**
- `/remotion-best-practices` (router for everything else), `/remotion-create`, `/remotion-markup`, `/remotion-studio`, `/remotion-render`, `/remotion-maps`, `/remotion-captions`, `/remotion-saas`, `/remotion-interactivity`, `/remotion-docs`, `/remotion-upgrade`, `/remotion-multimedia` — [Agent Skills docs](https://www.remotion.dev/docs/ai/skills)
- `remotion-markup` contains these rule files: 3d, audio-visualization, audio, calculate-metadata, compositions, connected-compositions, cropping, effects, embedding-videos, ffmpeg, gifs, google-fonts, html-in-canvas, images, light-leaks, local-fonts, lottie, measuring-dom-nodes, measuring-text, motion-blur, multi-scene-video, parameters, sequencing, sfx, silence-detection, text-highlights, timing-props, timing, transitions, video-editing, voiceover — [skills repo tree](https://github.com/remotion-dev/skills/tree/main/skills/remotion-markup)
- `remotion-captions` holds display-captions, import-srt-captions and transcribe-captions; `remotion-render` holds transparent-videos; `remotion-maps` holds techniques for Cesium, Mapbox, MapLibre, MapTiler and static maps, with render-stability references — [skills repo tree](https://github.com/remotion-dev/skills/tree/main/skills)

**History (matters because older tutorials describe a different layout)**
- **[2026]** At launch (19 Jan 2026) the layout was `skills/remotion/<topic>/SKILL.md` with topics 3d, animations, assets, audio, calculate-metadata, charts, compositions, fonts, gifs, images, lottie, measuring-dom-nodes, measuring-text, sequencing, tailwind, text-animations, timing, transitions, trimming and videos, plus a separate mediabunny skill — [skills repo at commit e6cc6359](https://github.com/remotion-dev/skills/tree/e6cc6359/skills)
- **[2026]** By March 2026 it was one `remotion-best-practices` skill with a `rules/` folder of about 38 files, including `charts.md`, `text-animations.md`, `animations.md`, `light-leaks.md`, `maps.md`, `subtitles.md`, `voiceover.md` and `transparent-videos.md` — [skills repo at commit d5d39558](https://github.com/remotion-dev/skills/tree/d5d395582c6227249cec74f53ab79aca77a4ff16/skills/remotion/rules)
- **[2026]** v4.0.488 (2026-07-11) split the single skill into multiple skills with the best-practices skill as router, and added SaaS and interactivity skills; v4.0.501 (2026-07-29) lists a full rewrite of the skills; `/remotion-docs` arrived in v4.0.490, `/remotion-upgrade` in v4.0.494, `/remotion-maps` in v4.0.499, `/remotion-studio` in v4.0.506 — [release v4.0.488](https://github.com/remotion-dev/remotion/releases/tag/v4.0.488); [release v4.0.501](https://github.com/remotion-dev/remotion/releases/tag/v4.0.501); [release v4.0.506](https://github.com/remotion-dev/remotion/releases/tag/v4.0.506)
- `charts.md`, `text-animations.md` and `animations.md` are absent from the current tree; in the skill files I read, the only remaining mention of charts is an incidental file path in an example — [skills repo tree](https://github.com/remotion-dev/skills/tree/main/skills)
- Secondary: launch-week coverage dates the public announcement to the week of 19–23 January 2026 and attributes a Claude Code demo video to Jonny Burger; install counts quoted by different articles conflict (about 3,600 at launch week versus 126,000 by March 2026) — [aihola.com (secondary)](https://aihola.com/article/remotion-agent-skills-video-creation); [aividpipeline.com (secondary)](https://aividpipeline.com/ko/blog/remotion-agent-skills-guide-2026)

**Most relevant concrete guidance in the current rules (paraphrased)**
- Animation driver: all motion must come from `useCurrentFrame()` and `interpolate()`; CSS `transition`/`animation` and Tailwind animation classes do not render correctly and must be refactored — [remotion-markup SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/SKILL.md)
- Timing units: derive `fps` from `useVideoConfig()` and express every duration as seconds times `fps` (including `from`, `trimBefore`, `durationInFrames`, `premountFor`) rather than hard-coded frame counts — [remotion-markup SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/SKILL.md)
- Easing: interpolate over an explicit frame range, clamp both `extrapolateLeft` and `extrapolateRight`, and shape timing with `Easing.bezier()` or `Easing.spring()`; the examples use `Easing.bezier(0.16, 1, 0.3, 1)` and `Easing.spring({damping: 200})` for a no-bounce push — [timing.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/timing.md)
- Scale: add `output: 'perceptual-scale'` to scale interpolations because linear scale output looks slower as it grows — [timing.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/timing.md)
- Multi-keyframe: pass several keyframes to one `interpolate()` and an array of `n - 1` easings; `posterize: N` samples every Nth frame for a deliberate low-frame-rate look — [timing.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/timing.md)
- Transforms: prefer the individual CSS properties `scale`, `translate`, `rotate` with the `interpolate()` call inline in `style`; use `transform` strings only for `skew()`, `perspective()` or order-sensitive chains — [timing.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/timing.md)
- Premounting: give every timed component that supports it `premountFor={fps}` (one second), including `<Sequence>`, `<Series.Sequence>`, `<TransitionSeries.Sequence>`, `<TransitionSeries.Overlay>` and media tags — [sequencing.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/sequencing.md)
- Sequencing: put `from`/`durationInFrames`/`trimBefore`/`playbackRate`/`loop` directly on components that support them and avoid redundant `<Sequence>` wrappers; use `<Sequence layout="none">` when no wrapper element is wanted. Order of operations is from, trimBefore, durationInFrames, playbackRate, loop — [timing-props.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/timing-props.md)
- Transitions: use `<TransitionSeries>`; a `Transition` overlaps two scenes and shortens the timeline, an `Overlay` sits on the cut without shortening it; an overlay cannot be adjacent to a transition or another overlay; compute total duration by subtracting `timing.getDurationInFrames({fps})` for each transition — [transitions.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/transitions.md)
- Fonts: `@remotion/google-fonts` is the recommended loader (type-safe, blocks rendering until ready); pass explicit `weights` and `subsets`; call `loadFont()` at module top level. Local files go through `loadFont()` from `@remotion/fonts` with `staticFile()` — [google-fonts.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/google-fonts.md); [local-fonts.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/local-fonts.md)
- Measuring text: use `measureText()`, `fitText()` (cap the result with `Math.min`) and `fillTextBox()` from `@remotion/layout-utils`; measure only after fonts load, set `validateFontIsLoaded: true`, use identical font properties for measuring and rendering, and use `outline` rather than `border` to avoid layout differences — [measuring-text.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/measuring-text.md)
- Text annotations: use `@remotion/rough-notation` (`<Highlight>`, `<Circle>`, `<Underline>`, `<StrikeThrough>`, `<CrossedOff>`, `<Box>`, `<Bracket>`) and drive `progress` from the frame — [text-highlights.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/text-highlights.md)
- Motion blur: `<HtmlInCanvasMotionBlur>` (v4.0.529+) is described as the preferred approach; `samples` default 8 (1–64), `shutterAngle` default 180; the animated child must call `useCurrentFrame()` itself — [motion-blur.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/motion-blur.md)
- Effects: prefer built-in `@remotion/effects` over CSS approximations where the target component accepts an `effects` prop; plain HTML, `<AbsoluteFill>` and `<Sequence>` must be wrapped in `<HtmlInCanvas>`; WebGL effects need `Config.setChromiumOpenGlRenderer("angle")` — [effects.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/effects.md)
- Compositions: register each independently editable composition as its own JSX node with inline metadata and inline `defaultProps`; programmatic registration is acceptable when the instances are deliberately controlled as one template — [compositions.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/compositions.md)
- `calculateMetadata`: use it only when duration, dimensions or props depend on input props, fetched data or asset metadata; it can also return `defaultOutName` and `defaultCodec`, and receives an `abortSignal` — [calculate-metadata.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/calculate-metadata.md)
- 3D: wrap content in `<ThreeCanvas>` with explicit `width`/`height`, never use `useFrame()` from React Three Fiber, and set `layout="none"` on any `<Sequence>` inside the canvas — [3d.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/3d.md)
- Maps (Mapbox): `interactive: false`, `fadeDuration: 0`, `preserveDrawingBuffer: true`, wrap loads and per-frame updates in `delayRender()`/`continueRender()`, render with `--gl=angle`, do not call `map.remove()` on cleanup, and check rendered pixels rather than Studio playback — [mapbox TECHNIQUE.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-maps/techniques/mapbox/TECHNIQUE.md)
- Maps (camera moves): per-frame `jumpTo()` can make basemap detail shimmer; the prescribed fix is a fixed, oversized map plate (largest dimension at or below 4096 px; 3840×2160 for a 1920×1080 composition) moved with CSS `translate` + `scale`, never scaled above 1, validated on a short MP4 at concurrency 1 — [render-stability.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-maps/techniques/mapbox/references/render-stability.md)
- Rendering etiquette: when asked to make a video, open Studio first and do not render unless the user explicitly asks; do not overwrite unexpected user edits — [remotion-best-practices SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/SKILL.md)
- Package installs: use `npx remotion add <package>` so versions match — [remotion-markup SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/SKILL.md)
- Voiceover: generate per-scene audio with ElevenLabs TTS into `public/`, then size the composition with `calculateMetadata` — [voiceover.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/voiceover.md)
- Captions: transcribe locally with `@remotion/whisper-webgpu` (needs a compatible GPU; not Linux arm64) — [transcribe-captions.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-captions/transcribe-captions.md)

**Guidance that existed in the March 2026 rules and was later removed (still retrievable by commit)**
- Charts: build with HTML, SVG or D3; disable all third-party library animations because they flicker; bar charts via staggered `spring()`; pie segments via `stroke-dashoffset` from 12 o'clock; line charts via `evolvePath()` from `@remotion/paths`, with markers following `getPointAtLength()`/`getTangentAtLength()` — [charts.md at d5d39558](https://github.com/remotion-dev/skills/blob/d5d395582c6227249cec74f53ab79aca77a4ff16/skills/remotion/rules/charts.md)
- Text animations: build typewriter effects by slicing the string per frame rather than fading individual characters; a word-highlight example was bundled — [text-animations.md at d5d39558](https://github.com/remotion-dev/skills/blob/d5d395582c6227249cec74f53ab79aca77a4ff16/skills/remotion/rules/text-animations.md)

### Inferences
- The current skills are optimised for hand-authored, Studio-editable JSX (inline values, one JSX node per editable item, `Interactive.*` wrappers). A template library driven by a JSON manifest is the case the rules themselves carve out as acceptable for programmatic loops, so the interactivity rules are optional for Parallax while the timing, transition, font, text-measurement and map-stability rules apply directly.
- Because the skills track the latest release, installing them into a project pinned to an older version will steer an agent toward APIs that do not exist there. Parallax's `remotion-templates/package.json` pins 4.0.457 (published 2026-05-04), which predates `Interactive` (4.0.475), `Easing.spring` (4.0.476), `output: 'perceptual-scale'` (4.0.490), timing props on most components, and `<HtmlInCanvasMotionBlur>` (4.0.529). Upgrade first, or vendor an older skills commit.
- The Parallax repo already has a real `.claude/skills` directory of project skills and no `.agents/skills`. Since the Remotion CLI's Claude Code support works by symlinking `.claude/skills` to `.agents/skills`, running `npx remotion skills add` there is a collision risk that should be tested on a branch; the Claude Code plugin route avoids touching the project folder.
- With `charts.md` and `text-animations.md` gone, there is currently no official chart-specific or kinetic-typography rule; Parallax's own template doctrine is ahead of the official skills in those areas.

### Gaps
- I did not access X/Twitter or YouTube directly, so the exact announcement post and date for the skills are unverified; the 19 January 2026 date is the repo creation timestamp.
- The last commit touching `rules/charts.md` is dated 2026-05-01; I did not confirm whether that commit deleted or moved the file.
- I did not read every rule file in full (not read: video-editing, connected-compositions, audio-visualization, gifs, images, silence-detection, the SaaS files, and most of the 18 KB interactivity skill).
- How `npx remotion skills add` behaves when `.claude/skills` already exists as a real directory was not tested.

## 2. What does Remotion's AI documentation offer (system prompt, MCP, llms.txt, Remotion Bits, AI SaaS / prompt-to-video templates, chat-with-docs, code-generation guidance and warnings)?

### Takeaway
The AI docs have shifted from "system prompt + MCP" to "skills + plugins + WebMCP": the hosted MCP server is deprecated in favour of the `/remotion-docs` skill, the system prompt survives as a plain text file, and every docs page is fetchable as Markdown. Guidance on LLM code generation and runtime compilation is aimed at people building prompt-to-video products, with explicit warnings about context rot, fenced output and running generated code unsandboxed.

### Cited Findings

**Index of the AI section**
- The AI docs index lists ten entries: Coding Agents, Agent Skills, Plugins, WebMCP, Chatbot, Bolt.new, Code generation with LLMs, Just-in-time compilation, AI SaaS Template, and Prompt to Video — [AI docs TableOfContents source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/ai/TableOfContents.tsx)
- The docs are built for agents: every page has a copy-as-Markdown button, appending `.md` to any docs URL returns raw Markdown, and the site honours an `Accept: text/markdown` header — [Building with Remotion and AI](https://www.remotion.dev/docs/ai)

**llms.txt**
- `remotion.dev/llms.txt` exists but is a short curated index (about 2.2 KB, roughly 25 links to `.md` pages grouped by topic), not a full-text dump; its AI section links only the AI index and the coding-agents page — [llms.txt](https://www.remotion.dev/llms.txt)

**System prompt**
- The official system prompt is served at `remotion.dev/system-prompt.txt` (about 11 KB) and is referenced from the code-generation and SaaS-template pages as the recommended starting point — [system-prompt.txt](https://www.remotion.dev/system-prompt.txt); [Code generation docs](https://www.remotion.dev/docs/ai/generate)
- Its content covers project structure, `<Composition>` defaults (30 fps, 1920×1080, id `MyComp`), `<Video>`/`<Audio>` from `@remotion/media` with `trimBefore`/`trimAfter`/`volume`, `<Img>`, `<Gif>`, `staticFile()`, `<AbsoluteFill>` layering, timing props, `<Series>`, `<TransitionSeries>` with `fade`/`wipe`, the ban on `Math.random()` in favour of seeded `random()`, `interpolate()` with clamping by default, `spring()` with `damping: 200`, and the render, still and Lambda commands — [system-prompt.txt](https://www.remotion.dev/system-prompt.txt)
- There is no longer a `/docs/ai/system-prompt` page: the `.md` URL returned 404 and no such file exists in the AI docs folder on `main` — [AI docs folder](https://github.com/remotion-dev/remotion/tree/main/packages/docs/docs/ai)

**MCP server**
- **[2026]** The Remotion MCP is deprecated. The docs tell users to install the skills and use `/remotion-docs`, state that the hosted MCP will shut down no earlier than 31 August 2026, and advise against new installs — [MCP docs](https://www.remotion.dev/docs/ai/mcp)
- The stated reasons: its data can lag the docs, Remotion pays the token costs, MCP servers are hard to install and agents do not call them reliably, and it duplicates the docs skill — [MCP docs](https://www.remotion.dev/docs/ai/mcp)
- `@remotion/mcp` was first published as v4.0.273 on 2025-03-07; the deprecation appears in the v4.0.491 release notes (2026-07-18); the package still receives fixes (v4.0.533) and is still published at 4.0.534 — [npm registry: @remotion/mcp](https://registry.npmjs.org/@remotion%2Fmcp); [release v4.0.491](https://github.com/remotion-dev/remotion/releases/tag/v4.0.491); [release v4.0.533](https://github.com/remotion-dev/remotion/releases/tag/v4.0.533)
- The replacement `/remotion-docs` skill has the agent query the docs' public search index, then fetch matching pages with the `.md` suffix and implement from current docs rather than memory — [remotion-docs SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-docs/SKILL.md)

**Chat with docs**
- The chatbot is built on CrawlChat and is reachable from the Ask AI button on the docs, at remotion.ai, and with Cmd/Ctrl+I inside Studio; it is positioned for simple questions, with Discord for harder ones — [Chatbot docs](https://www.remotion.dev/docs/ai/chatbot)

**Generating Remotion code with LLMs**
- The guide uses the Vercel AI SDK. Its sample system prompt asks for a named export, `useCurrentFrame()`/`useVideoConfig()`, `interpolate()` with `Easing` in preference to `spring()` unless physics is requested, and inline `interpolate()` calls using `scale`/`translate`/`rotate` — [Code generation docs](https://www.remotion.dev/docs/ai/generate)
- It warns that raw output often arrives wrapped in Markdown code fences and needs prompting or sanitising, and recommends structured output with a Zod schema (code, title, durationInFrames, fps) with automatic retries on schema mismatch — [Code generation docs](https://www.remotion.dev/docs/ai/generate)
- It warns about context rot as prompts grow, and recommends modular skills injected on demand (a cheap model classifies the request, then only the matching skill text is appended) instead of one large system prompt — [Code generation docs](https://www.remotion.dev/docs/ai/generate)

**Just-in-time (runtime) compilation**
- Generated component strings are transpiled in the browser with `@babel/standalone`, turned into a component with the `Function` constructor, and given Remotion APIs by explicit injection; import statements must be stripped because dependencies are passed as arguments — [Just-in-time compilation docs](https://www.remotion.dev/docs/ai/dynamic-compilation)
- The security warning: the code runs in the page's global scope with access to all globals, so production apps should use a sandboxed iframe and a content security policy — [Just-in-time compilation docs](https://www.remotion.dev/docs/ai/dynamic-compilation)

**Starter templates**
- Prompt to Motion Graphics SaaS: a Next.js starter (`npx create-video@latest --template prompt-to-motion-graphics`) with chat history, live Player preview, targeted-edit versus full-replace decisions, input validation, output sanitising, automatic retry on compile errors, and optional Lambda export. The docs say to use it to build a product and to use skills to make videos for yourself; it has no filesystem or OS access — [AI SaaS template docs](https://www.remotion.dev/docs/ai/ai-saas-template)
- That template's repo was created 2025-12-17 — [GitHub API: template-prompt-to-motion-graphics-saas](https://api.github.com/repos/remotion-dev/template-prompt-to-motion-graphics-saas)
- Prompt to Video: a template whose CLI generates a story script, images and voiceover with OpenAI and ElevenLabs and writes a `timeline.json` that the composition renders; aimed at short vertical story videos — [template-prompt-to-video README](https://github.com/remotion-dev/remotion/blob/main/packages/template-prompt-to-video/README.md)
- **[2026]** A browser-based motion graphics editor template (`template-vibe-code`) compiles code in a Web Worker with `@remotion/browser-bundler` and renders an editable canvas with `@remotion/sdk` — [template-vibe-code README](https://github.com/remotion-dev/remotion/blob/main/packages/template-vibe-code/README.md)

**Remotion Bits and other listed resources**
- Remotion Bits is a third-party project (github.com/av/remotion-bits, created 2026-01-23, 490 stars), not an official package; the official Resources page lists it as ready-made blocks for people and agents — [Resources docs source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/resources.mdx); [GitHub API: av/remotion-bits](https://api.github.com/repos/av/remotion-bits)
- The same page lists other third-party agent-oriented projects, including RemotionUI, video-shotcraft, BrewReel and audio-bed-check (a checker for loops, level jumps and speech-over-bed separation in a rendered mix) — [Resources docs source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/resources.mdx)

**Other official AI surfaces**
- Bolt.new has a Remotion starter for prompting videos online — [Bolt.new docs source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/ai/bolt.mdx)
- **[2026]** remotion.dev/new is a Studio that runs entirely in the browser (virtual file system, Rspack browser build); it cannot edit code, talk to an agent or save a project, and the docs recommend working locally with a real agent — [remotion.dev/new docs source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/studio/remotion-dev-new.mdx)
- **[2026]** Remotion states it will not build a consumer prompt-to-motion-graphics product, preferring to be the underlying technology, and notes that many people use Remotion with Claude Code — [position statement source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/lovable-for-motion-graphics.mdx)
- The official beginner video for prompting motion graphics with an agent is embedded on the coding-agents page — [Coding agents docs](https://www.remotion.dev/docs/ai/coding-agents)

### Inferences
- For a pipeline that authors templates in a repo (Parallax's case), skills plus the Markdown docs are the supported path; the code-generation and JIT-compilation pages matter only if templates were ever generated at runtime.
- The system prompt is now a compact fallback for agents without skills support; it encodes the newer API surface (`@remotion/media`, `trimBefore`/`trimAfter`), so it is also a quick checklist of deprecated habits in older code.
- Anything still pointing at the hosted MCP server should be migrated; the shutdown floor date has already passed.

### Gaps
- I could not confirm whether the hosted MCP endpoint has actually been switched off as of 10 October 2026 (the docs point to GitHub issue #9055 for updates, which I did not read).
- I did not check for an `llms-full.txt`.
- I did not inspect the Codex, Cursor, Copilot or Kimi plugin pages individually, or the prompt gallery at remotion.dev/prompts beyond its mention in the HTML-in-canvas guide.

## 3. Which official packages and APIs matter for polish and are often missed?

### Takeaway
The big 2026 additions for polish are a canvas post-processing layer (`<HtmlInCanvas>`, `@remotion/effects`, shader transitions, true multi-sample motion blur), richer `interpolate()` options (perceptual scale, posterize, `Easing.spring`), `<TransitionSeries.Overlay>`, hand-drawn text annotations and a deterministic GSAP bridge. Older but under-used basics remain: `@remotion/layout-utils` with font-load validation, `springTiming` with a low rest threshold, `@remotion/paths`, and strict frame-determinism rules.

### Cited Findings

**Install convention**
- `npx remotion add <package>` installs Remotion packages at the project's exact version; its `--package-manager` flag is tagged v4.0.367 (2025-10-27), and the command's own introduction version was not confirmed — [add CLI docs source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/cli/add.mdx)
- All `remotion` and `@remotion/*` packages must be on one identical version without `^` ranges — [skia docs source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/skia/skia.mdx)

**@remotion/transitions**
- Available from v4.0.53 (2023-10-21); `<TransitionSeries>` from v4.0.59 — [TransitionSeries docs](https://www.remotion.dev/docs/transitions/transitionseries)
- **[2026]** `<TransitionSeries.Overlay>` (v4.0.415, 2026-02-01) renders an effect over a cut without shortening the timeline — [TransitionSeries docs](https://www.remotion.dev/docs/transitions/transitionseries)
- Rules: a transition may not be longer than either neighbouring sequence; two transitions, two overlays, or a transition and an overlay may not be adjacent; at least one sequence must precede or follow — [TransitionSeries docs](https://www.remotion.dev/docs/transitions/transitionseries)
- Classic DOM presentations: `fade()`, `slide()`, `wipe()`, `flip()` (v4.0.54), `clockWipe()` (v4.0.74), `cube()`, `none()` (v4.0.177), `iris()` (v4.0.316, 2025-06-19) — [Presentations docs](https://www.remotion.dev/docs/transitions/presentations)
- **[2026]** Shader-based presentations built on HTML-in-canvas: `zoomBlur()` (v4.0.456), `zoomInOut()` (v4.0.457), `dissolve()` and `ripple()` (v4.0.465), `bookFlip()`, `crosswarp()`, `dreamyZoom()`, `linearBlur()`, `swap()` (v4.0.466), `crossZoom()` and `filmBurn()` (v4.0.467), `pushCut()` (v4.0.500), `blurSlide()` (v4.0.523) — [transitions docs folder](https://github.com/remotion-dev/remotion/tree/main/packages/docs/docs/transitions/presentations)
- **[2026]** Custom shader transitions use `makeHtmlInCanvasPresentation()` (v4.0.456); the guide covers adapting GLSL from gl-transitions.com — [Custom HTML-in-canvas presentations](https://www.remotion.dev/docs/transitions/presentations/custom-html-in-canvas)
- Timings: `linearTiming()` accepts an `easing`; `springTiming()` accepts a spring config, `durationInFrames`, `durationRestThreshold` and `reverse` (v4.0.144). The docs recommend lowering `durationRestThreshold` to 0.001 because the default 0.005 can leave a visible cut-off at the end of a transition — [springTiming docs source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/transitions/timings/springtiming.mdx)
- Custom timings and custom DOM presentations are documented; `useTransitionProgress()` (v4.0.177) exposes entering/exiting progress to child components — [Timings docs](https://www.remotion.dev/docs/transitions/timings); [useTransitionProgress source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/transitions/use-transition-progress.mdx)
- Audio on a transition is done by wrapping a presentation so its component also renders an `<Audio>` tag (works from v4.0.58) — [Transitioning with audio source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/transitions/audio-transitions.mdx)

**Motion blur**
- `@remotion/motion-blur` dates from v3.2.31 (2022-10); `<Trail>` and `<CameraMotionBlur>` from v3.2.39 — [motion-blur API](https://www.remotion.dev/docs/motion-blur/api)
- **[2026]** `<HtmlInCanvasMotionBlur>` (v4.0.529, 2026-09-25) is the recommended implementation; it needs HTML-in-canvas enabled for preview, and rendering needs no configuration — [Motion blur guide](https://www.remotion.dev/docs/motion-blur)
- `<CameraMotionBlur>` works without HTML-in-canvas but its layered blending can change colours and opacity; `<Trail>` repeats earlier positions and is not a realistic exposure — [Motion blur guide](https://www.remotion.dev/docs/motion-blur)
- Common mistake: these components alter the time context, so `useCurrentFrame()` must be called inside the wrapped child, not in the parent — [common mistake source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/motion-blur/common-mistake.mdx)

**HTML-in-canvas and @remotion/effects [2026]**
- `<HtmlInCanvas>` (v4.0.455, 2026-05-01) draws live DOM into a canvas for post-processing with Canvas 2D, WebGL or WebGPU. Preview needs Chrome 149+ with `chrome://flags/#canvas-draw-element`; rendering works out of the box because Remotion ships a Chrome build with the flag enabled — [HTML-in-canvas guide](https://www.remotion.dev/docs/html-in-canvas)
- Limits: the browser API is experimental and may change or be removed; nesting needs Chromium 157.0.8080.0 (server-side from v4.0.534); WebGL shaders need `--gl=angle` (or `swangle` without a GPU) — [HTML-in-canvas guide](https://www.remotion.dev/docs/html-in-canvas)
- Effects (v4.0.464, 2026-05-20) are functions passed to an `effects` array on `<Solid>`, `<HtmlInCanvas>`, `<Video>`, `<Img>`, `<CanvasImage>`, `<AnimatedImage>`, `<Gif>`, `<RemotionRiveCanvas>` and `@remotion/shapes` components (v4.0.474); they apply in order and are editable in Studio — [Effects docs](https://www.remotion.dev/docs/effects)
- Built-in families include colour and tone (`colorCorrection()`, `levels()`, `lut()`, `duotone()`, `whiteBalance()`), blur (`blur()`, `zoomBlur()`, progressive and region blurs), lighting (`glow()`, `dropShadow()`, `lightLeak()`, `vignette()`, `shine()`), distortion (`chromaticAberration()`, `cornerPin()`, `wave()`), textures (`paper()`, `halftone()`, `noise()`, `speckle()`, `scanlines()`), edges (`outline()`, `roughenEdges()`, `tear()`) and pixel transitions (`pixelDissolve()`, `venetianBlinds()`) — [remotion-markup SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/SKILL.md)
- `createEffect()` (v4.0.479) builds custom effects on Canvas 2D, WebGL2 or WebGPU — [Effects docs](https://www.remotion.dev/docs/effects)
- Colour grading: `colorCorrection()` combines common adjustments; `lut()` (v4.0.526, 2026-09-17) applies a `.cube` LUT; put correction before the LUT — [Color correction source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/color-correction.mdx)
- `@remotion/light-leaks` (v4.0.415) and `@remotion/starburst` (v4.0.435) are shown struck through in the docs; the current path is `lightLeak()` from `@remotion/effects/light-leak` on a `<Solid>`, which the skill says requires v4.0.500+ and WebGL2 — [light-leaks docs folder](https://github.com/remotion-dev/remotion/tree/main/packages/docs/docs/light-leaks); [light-leaks.md skill rule](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/light-leaks.md)

**Text layout and annotation**
- `@remotion/layout-utils` (v4.0.50, 2023-10): `measureText()`, `fillTextBox()` (v4.0.57), `fitText()` (v4.0.88), `fitTextOnNLines()` (v4.0.313, 2025-06-04) — [layout-utils docs folder](https://github.com/remotion-dev/remotion/tree/main/packages/docs/docs/layout-utils)
- Best practice: measure only after fonts load (a higher-order wrapper that mounts children once fonts are ready is the pattern for larger projects), enable `validateFontIsLoaded` (v4.0.136), match every font property, and beware borders, padding and whitespace — [layout-utils best practices](https://www.remotion.dev/docs/layout-utils/best-practices)
- **[2026]** `@remotion/rough-notation` (v4.0.490, 2026-07-16) provides hand-drawn highlight, underline, strike-through, crossed-off, box, bracket and circle annotations with `progress`, `seed`, `roughness` and related props — [Text highlights docs](https://www.remotion.dev/docs/text-highlights)
- `@remotion/rounded-text-box` (v4.0.360, 2025-10-14) computes the merged rounded path behind multi-line text — [rounded-text-box source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/rounded-text-box/index.mdx)

**Core animation primitives**
- `interpolate()` gained CSS transform string values (v4.0.472), numeric tuples (v4.0.473), `posterize` (v4.0.470), `output: 'perceptual-scale'` (v4.0.490), discrete strings (v4.0.509), `outputType` (v4.0.526) and booleans (v4.0.530), all **[2026]** — [interpolate docs](https://www.remotion.dev/docs/interpolate)
- **[2026]** `Easing.spring()` (v4.0.476, 2026-06-12) lets spring physics be used as an `interpolate()` easing — [Easing docs](https://www.remotion.dev/docs/easing)
- `spring()` supports `durationInFrames`, `durationRestThreshold`, `delay` and `reverse`; raising `damping` removes the default bounce; a playground lives at remotion.dev/timing-editor — [spring docs](https://www.remotion.dev/docs/spring)
- **[2026]** Posterization (v4.0.470) is available on `interpolate()`, `interpolateColors()` and `interpolateStyles()` — [Posterization source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/posterization.mdx)
- `<Series.Sequence>` supports `offset`, `premountFor` (v4.0.140), `trimBefore` (v4.0.497) and `playbackRate` (v4.0.528) — [Series docs](https://www.remotion.dev/docs/series)
- `<Sequence>` has `premountFor` (v4.0.140, 2024-04), `styleWhilePremounted` (v4.0.252), `postmountFor` (v4.0.340, 2025-08) and crop props (v4.0.500) — [Sequence docs](https://www.remotion.dev/docs/sequence)
- **[2026]** Timing props are standardised across `<AbsoluteFill>` (itself a sequence from v4.0.501), `Interactive.*`, image, shape, Lottie, Three, Rive and media components — [Timing docs](https://www.remotion.dev/docs/timing)
- Premounting is a preview-side feature: the v5 notes state it does not affect rendering, and v5 will default it to two seconds in Studio and Player — [v5 migration notes](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/5-0-migration.mdx)
- `useBufferState()` (v4.0.111, 2024-02) pauses Player/Studio playback while data loads and is a no-op during rendering; pair it with `delayRender()` when both are needed and release the handle on unmount — [useBufferState source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/use-buffer-state.mdx)

**`delayRender()` pitfalls**
- A handle must be cleared within 30 seconds by default or the render fails; labels identify the culprit; calls belong inside components, not at module top level, and must not be recreated on every React render; `useDelayRender()` (v4.0.342, 2025-09) is preferred; timeout and retries are configurable (v4.0.140) — [delayRender docs](https://www.remotion.dev/docs/delay-render)
- Flicker comes from animation not driven by the frame number or from unawaited assets; a component must give the same image for the same frame regardless of render order; `--concurrency=1` is only a workaround; avoid CSS `background-image` and `mask-image` for assets — [Flickering docs](https://www.remotion.dev/docs/flickering)

**Fonts**
- Options are `@remotion/google-fonts` (from v3.2.40), Google Fonts via CSS, `@remotion/fonts` for local files (from v4.0.164, 2024-05) and the raw `FontFace` API with `delayRender()`; multi-font projects should load fonts in one shared module and wait before rendering — [Fonts docs](https://www.remotion.dev/docs/fonts)
- v5 will require explicit weights and subsets in `@remotion/google-fonts` because loading everything can time out — [v5 migration notes](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/5-0-migration.mdx)

**Captions and transcription**
- `@remotion/captions` (v4.0.216, 2024-10-03) defines the `Caption` type plus `createTikTokStyleCaptions()`, `parseSrt()` and `serializeSrt()` — [captions API source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/captions/api.mdx)
- Transcription options: `@remotion/install-whisper-cpp` (server, free, offline), `@remotion/whisper-webgpu` (**[2026]** v4.0.518, browser or Node, GPU), `@remotion/whisper-web` (WASM, slow), `@remotion/openai-whisper` (paid API) and `@remotion/elevenlabs` (**[2026]** paid API); each has a converter to `Caption[]` — [Transcribing audio source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/captions/transcribing.mdx)

**Media tags**
- `<Video>` and `<Audio>` from `@remotion/media` (first published v4.0.351, 2025-09-22; declared stable and recommended in v4.0.491, 2026-07-18) are built on Mediabunny and WebCodecs, are frame-accurate, and fall back to `<OffthreadVideo>`/`<Html5Audio>` for unsupported media; the old `<Video>` is now `<Html5Video>` — [Video tags comparison](https://www.remotion.dev/docs/video-tags); [release v4.0.491](https://github.com/remotion-dev/remotion/releases/tag/v4.0.491)
- **[2026]** ProRes decoding in `@remotion/media` arrived in v4.0.487 and is opt-in — [@remotion/media docs](https://www.remotion.dev/docs/media)

**Vector, noise and style helpers**
- `@remotion/paths` offers path utilities usable outside Remotion; **[2026]** `interpolatePaths()` (v4.0.529) morphs between paths — [release v4.0.529](https://github.com/remotion-dev/remotion/releases/tag/v4.0.529)
- `@remotion/shapes` components are Arrow, Callout, Circle, Ellipse, Heart, Pie, Polygon, Rect, Spark, Star and Triangle — [effects.md skill rule](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/effects.md)
- `@remotion/noise` (v3.2.32) provides seeded `noise2D()`, `noise3D()`, `noise4D()` — [noise source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/noise/index.mdx)
- `@remotion/animation-utils` (v4.0.92, 2024-01) provides `interpolateStyles()` and `makeTransform()` — [animation-utils source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/animation-utils/index.mdx)

**Third-party runtimes**
- `@remotion/lottie` plays lottie-web animations; Lottie expressions may render non-deterministically and flicker, case by case — [Lottie docs](https://www.remotion.dev/docs/lottie)
- `@remotion/rive` `<RemotionRiveCanvas>` (v3.3.75) accepts `effects` from v4.0.464 — [RemotionRiveCanvas docs](https://www.remotion.dev/docs/rive/remotionrivecanvas)
- `@remotion/three` `<ThreeCanvas>` needs explicit `width`/`height` and frame-driven animation; **[2026]** `<ThreeWebGPUCanvas>` arrived in v4.0.503 — [ThreeCanvas docs](https://www.remotion.dev/docs/three-canvas); [ThreeWebGPUCanvas source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/three-webgpu-canvas.mdx)
- `@remotion/skia` integrates React Native Skia through a bundler override (`enableSkia()`) — [skia source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/skia/skia.mdx)
- **[2026]** `@remotion/gsap` (v4.0.517, 2026-08-25) builds a paused GSAP timeline and seeks it per frame; builders must be synchronous, callback-free and free of unseeded randomness — [release v4.0.517](https://github.com/remotion-dev/remotion/releases/tag/v4.0.517); [gsap docs folder](https://github.com/remotion-dev/remotion/tree/main/packages/docs/docs/gsap)

**Audio and ready-made assets**
- **[2026]** `@remotion/sfx` (v4.0.429, 2026-02-25) bundles sound effects; the skill lists hosted files such as whoosh, whip, page-turn, switch, mouse-click, shutter and ding — [sfx.md skill rule](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/sfx.md)
- **[2026]** Remotion Elements (announced in v4.0.506, 2026-08-04) is a gallery of installable items browsable inside Studio — [release v4.0.506](https://github.com/remotion-dev/remotion/releases/tag/v4.0.506)

### Inferences
- For editorial motion graphics, the lowest-risk polish adoptions are code-only and renderer-agnostic: `springTiming` with a 0.001 rest threshold, `output: 'perceptual-scale'` on scale tweens, `Easing.spring` inside `interpolate()`, `<TransitionSeries.Overlay>` for cut accents, `fitTextOnNLines()` with `validateFontIsLoaded`, and `@remotion/rough-notation` for underline and highlight draws.
- Effects, shader transitions and HTML-in-canvas motion blur add a GPU/WebGL dependency (`--gl=angle`) and rest on an experimental Chrome API, so they are better confined to a few hero beats than made a default; they also interact with Parallax's existing Mapbox/deck.gl WebGL usage and should be benchmarked.
- `premountFor` everywhere, as the skills demand, improves Studio and Player preview only; it is not a render-quality lever.
- Parallax's `package.json` mixes exact pins with `^` ranges on several `@remotion/*` packages, which the docs warn can cause version conflicts.

### Gaps
- I did not read the individual API pages for every presentation or effect, so default values beyond those listed are unverified.
- The built-in effect list in the skill has no entry named film grain; `noise()`, `speckle()` and `paper()` are the nearest names and I did not test their look.
- First-available versions for `@remotion/paths`, `@remotion/shapes` and `@remotion/lottie` are not stated on their index pages and were not looked up.
- I did not verify render-time cost of `<HtmlInCanvasMotionBlur>` or effects; the docs only say more samples cost more.

## 4. What changed in Remotion 4.x through 2026 (renderer, Studio, web renderer, Lambda/Cloud Run, licensing, performance, hardware acceleration, colour, ProRes, x264, audio codecs), and what is the current stable version?

### Takeaway
The current stable release is v4.0.534 (7 October 2026); Remotion 5.0 is still unreleased, and v4 ships two to three patch releases a week. 2026 was the year of Studio interactivity (visual edits written back to code), stable client-side rendering, a custom Chromium with shared-memory frame capture, NVENC encoding, and a pile of agent integrations, while colour (`bt709`), ProRes and codec options are long-standing but still non-default.

### Cited Findings

**Version status**
- npm `latest` for `remotion` is 4.0.534, published 2026-10-07; 684 versions of 4.0.x exist; 4.0.0 was published 2023-07-03 — [npm registry: remotion](https://registry.npmjs.org/remotion)
- Remotion 5.0 is not released; the migration page is explicitly a list of planned breaking changes — [v5 migration notes](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/5-0-migration.mdx)
- Docs on `main` already reference v4.0.535 features (for example dragging a LUT onto a video in Studio), which is not on npm — [Color correction source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/color-correction.mdx)

**Renderer and performance**
- **[2026]** v4.0.534 upgrades the bundled browser to Chromium 157.0.8080.0 and introduces shared-memory capture: bitmaps go straight to FFmpeg instead of being JPEG/PNG-encoded and decoded — [release v4.0.534](https://github.com/remotion-dev/remotion/releases/tag/v4.0.534); [Shared-memory capture docs](https://www.remotion.dev/docs/shared-memory-capture)
- It applies to video renders only (not stills, image sequences, GIFs or audio) on Apple Silicon with macOS 15+, Linux with glibc 2.35+, Amazon Linux 2023, and newly deployed Lambda/Cloud Run functions; Windows, Intel Macs and Chrome for Testing keep screenshots — [Shared-memory capture docs](https://www.remotion.dev/docs/shared-memory-capture)
- When active, `imageFormat` and `jpegQuality` have no effect; transparency follows the pixel format (`yuva420p`, `yuva444p10le`); opt out with `--disable-shared-memory-capture`; verify with `--log=verbose` — [Shared-memory capture docs](https://www.remotion.dev/docs/shared-memory-capture)
- **[2026]** Parallel encoding (encode while later frames render) is on by default from v4.0.534, costs roughly 30–80 MB extra memory at 1080p by Remotion's testing, and can be disabled with `--disallow-parallel-encoding` — [Parallel encoding docs](https://www.remotion.dev/docs/parallel-encoding)
- **[2026]** v4.0.515 added proper backpressure while encoding frames, and v4.0.530 made `slowestFrames` use each frame's own render time — [release v4.0.515](https://github.com/remotion-dev/remotion/releases/tag/v4.0.515); [release v4.0.530](https://github.com/remotion-dev/remotion/releases/tag/v4.0.530)
- **[2026]** Rspack stopped being experimental in v4.0.502 (still opt-in via `--rspack`) and became the default for new projects in v4.0.503 — [release v4.0.502](https://github.com/remotion-dev/remotion/releases/tag/v4.0.502); [release v4.0.503](https://github.com/remotion-dev/remotion/releases/tag/v4.0.503)
- **[2026]** v4.0.530 carries a small breaking change: `durationInFrames` now applies before `playbackRate` — [release v4.0.530](https://github.com/remotion-dev/remotion/releases/tag/v4.0.530)

**Hardware-accelerated encoding**
- Introduced in v4.0.228 (2024-11-07) for ProRes via VideoToolbox on macOS; H.264 and H.265 from v4.0.236 (2024-12-06); **[2026]** NVENC on Linux and Windows from v4.0.484 (2026-06-26) — [Hardware acceleration docs](https://www.remotion.dev/docs/hardware-acceleration)
- It is off by default; enable with `--hardware-acceleration if-possible` or `required`, or `Config.setHardwareAcceleration()`; it is unavailable on Lambda and Cloud Run — [Hardware acceleration docs](https://www.remotion.dev/docs/hardware-acceleration)
- CRF cannot be used with hardware encoders and files are much larger by default; the docs suggest `--video-bitrate=8M` for size parity on Full HD H.264 — [Hardware acceleration docs](https://www.remotion.dev/docs/hardware-acceleration)

**Colour management**
- `--color-space` was added in v4.0.28 (2023-08); real conversion (not just tagging) happens from v4.0.83; valid v4 values are `default`, `bt601`, `bt709`, `bt2020-ncl`; the option text recommends PNG frames for the most accurate conversion — [color-space option source](https://github.com/remotion-dev/remotion/blob/main/packages/renderer/src/options/color-space.tsx)
- In v4 the default is `default`, equivalent to `bt601`; the quality guide recommends exporting in `bt709`, which becomes the default in 5.0 — [Quality guide](https://www.remotion.dev/docs/quality); [v5 migration notes](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/5-0-migration.mdx)
- Frame capture defaults to JPEG at quality 80 unless shared-memory capture is active or `--image-format=png` is set — [Quality guide](https://www.remotion.dev/docs/quality)
- Text looks soft when a 1920×1080 video is shown on a high-density display; `--scale` renders at higher pixel density — [Quality guide](https://www.remotion.dev/docs/quality)

**Codecs, x264 and audio**
- Six video codecs: `h264` (default), `h265`, `vp8`, `vp9`, `av1`, `prores`; H.264 CRF runs 1–51 with default 18 — [Encoding guide](https://www.remotion.dev/docs/encoding)
- `--x264-preset` (v4.0.22, 2023-08) accepts ultrafast through placebo; default `medium`; Lambda's default changes to `veryfast` in v5 — [x264-preset option source](https://github.com/remotion-dev/remotion/blob/main/packages/renderer/src/options/x264-preset.tsx); [v5 migration notes](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/5-0-migration.mdx)
- Audio codecs are `pcm-16`, `aac`, `mp3`, `opus`; H.264 defaults to AAC and can take PCM-16 or MP3; ProRes defaults to PCM-16; audio-only export supports mp3, wav and aac — [audio-codec option source](https://github.com/remotion-dev/remotion/blob/main/packages/renderer/src/options/audio-codec.tsx); [Encoding guide](https://www.remotion.dev/docs/encoding)

**ProRes and transparent output for NLE handoff**
- ProRes (`--codec=prores`, `.mov`) is the recommended format for Final Cut Pro, Premiere Pro and DaVinci Resolve; profiles are proxy, light, standard, hq (default, about 220 Mbps), 4444 and 4444-xq; no CRF or bitrate control — [ProRes docs](https://www.remotion.dev/docs/prores)
- Transparent ProRes needs profile `4444` or `4444-xq`, PNG frames and `yuva444p10le`: `--image-format=png --pixel-format=yuva444p10le --codec=prores --prores-profile=4444` — [Transparent videos docs](https://www.remotion.dev/docs/transparent-videos)
- Transparent WebM uses VP8/VP9 with `yuva420p`; on Lambda it can flicker at chunk boundaries, so ProRes is preferred there — [Transparent videos docs](https://www.remotion.dev/docs/transparent-videos)
- Export defaults (`defaultCodec`, `defaultProResProfile`, `defaultPixelFormat`, `defaultVideoImageFormat`) can be set per composition through `calculateMetadata()` — [transparent-videos.md skill rule](https://github.com/remotion-dev/skills/blob/main/skills/remotion-render/transparent-videos.md)
- **[2026]** OpenTimelineIO export is handled by an agent skill (`/remotion-opentimeline`, v4.0.525) because a programmatic composition cannot be exported deterministically; unsupported visuals are pre-rendered (opaque ranges as ProRes, overlays as ProRes 4444, audio as WAV stems) and the `.otio` imports into DaVinci Resolve and Premiere 25.6+ — [Export to OpenTimelineIO source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/export-opentimeline.mdx); [release v4.0.525](https://github.com/remotion-dev/remotion/releases/tag/v4.0.525)

**Remotion Studio**
- **[2026]** Interactivity (v4.0.475, 2026-06-10): visual edits are written back to source, with undo/redo; selection of sequences, props, effects, keyframes and easing segments; canvas drag to move, scale and rotate; keyframe dragging; an easing editor that understands inline `Easing.bezier`, `Easing.spring` and exact Bézier-compatible helpers — [Interactivity docs](https://www.remotion.dev/docs/studio/interactivity)
- **[2026]** For Studio to edit code, styles must be inline plain objects, animations must be inline `interpolate()` calls with hard-coded ranges, and `scale`/`translate`/`rotate` must be used rather than `transform`; otherwise values are greyed out — [Interactivity best practices](https://www.remotion.dev/docs/studio/interactivity-best-practices)
- **[2026]** The props editor infers controls from `defaultProps` without a Zod schema (v4.0.516) and can save edits back when `defaultProps` is an inline object literal — [Visual editing docs](https://www.remotion.dev/docs/visual-editing)
- `visualControl()` (v4.0.292, 2025-04) is now deprecated in favour of built-in interactivity — [visualControl source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/studio/visual-control.mdx)
- **[2026]** v4.0.530 added composition tabs, a pre-compose action and left-only trims; v4.0.487 added canvas snapping for outlines — [release v4.0.530](https://github.com/remotion-dev/remotion/releases/tag/v4.0.530); [release v4.0.487](https://github.com/remotion-dev/remotion/releases/tag/v4.0.487)
- Studio can be deployed statically or on a server, and used as a parameterised motion design system; transparent ProRes export is not yet possible client-side — [Motion design systems source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/design-systems.mdx)

**Client-side (web) rendering**
- **[2026]** `@remotion/web-renderer` (first published v4.0.341, 2025-09-02) is stable from v4.0.491 (2026-07-18) with `renderMediaOnWeb()` and `renderStillOnWeb()`; Studio has a render-in-browser button from the same version — [Client-side rendering docs](https://www.remotion.dev/docs/client-side-rendering)
- It encodes with WebCodecs via Mediabunny, needs Chrome 94+, Firefox 130+ or Safari 26+, supports only a subset of HTML/CSS, has no multithreading, and always sends a telemetry event — [Client-side rendering docs](https://www.remotion.dev/docs/client-side-rendering); [Limitations](https://www.remotion.dev/docs/client-side-rendering/limitations)

**Lambda, Cloud Run, Vercel**
- Cloud Run is labelled alpha and not actively developed — [Cloud Run docs](https://www.remotion.dev/docs/cloudrun)
- Planned v5 Lambda changes: `overwrite` true by default, `veryfast` x264 preset, 10,240 MB default disk, client functions moving to `@remotion/lambda/client` — [v5 migration notes](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/5-0-migration.mdx)
- **[2026]** `@remotion/vercel` (first published v4.0.426, 2026-02-20) adds `renderMediaOnVercel()` and `renderStillOnVercel()` — [npm registry: @remotion/vercel](https://registry.npmjs.org/@remotion%2Fvercel)

**Licensing**
- Free for individuals, organisations of up to three people, non-profits and evaluation, with no functional difference from the paid licence — [License FAQ](https://www.remotion.dev/docs/license/faq)
- Company License: Remotion for Creators at $25/month per person who writes Remotion code directly or through agentic coding tools; Remotion for Automators at $0.01 per render with a $100/month minimum — [License FAQ](https://www.remotion.dev/docs/license/faq)
- An automation is owning code that programmatically calls render APIs or commands, including `npx remotion render` and `npx remotion still`; Studio and Player previews are not renders — [License FAQ](https://www.remotion.dev/docs/license/faq)
- `@remotion/licensing` (v4.0.237, 2024-12) reports usage when a `licenseKey` is passed to the render APIs (**[2026]** the `licenseKey` parameter name on its own functions is tagged v4.0.409); telemetry never blocks a render; from 5.0 it becomes mandatory for Automators — [Licensing docs](https://www.remotion.dev/docs/licensing); [Telemetry docs](https://www.remotion.dev/docs/telemetry)

**Planned v5 defaults worth pre-adopting**
- `bt709` colour space, `angle` GL renderer with `swangle` fallback, `validateFontIsLoaded: true` in layout-utils, mandatory Google Fonts weights/subsets, no `layout="none"` on `<TransitionSeries>`, and required `inputProps` on `selectComposition()` — [v5 migration notes](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/5-0-migration.mdx)

**2024–2025 milestones (for context)**
- Official blog posts in the period: deployable Studio (2024-03-05), faster Lambda (2024-03-21), Media Parser (2025-05-20), Editor Starter (2025-08-21), sponsoring Mediabunny (2025-09-01); there are no blog posts after that date in the repo — [blog folder](https://github.com/remotion-dev/remotion/tree/main/packages/docs/blog)
- Other dated additions (version tags from the docs, dates from npm): `useBufferState()` 2024-02, `premountFor` 2024-04, `@remotion/fonts` 2024-05, `@remotion/captions` 2024-10, hardware acceleration 2024-11, `--chrome-mode` 2025-01 (v4.0.248), `fitTextOnNLines()` and `iris()` 2025-06, `useDelayRender()` 2025-09, `@remotion/media` 2025-09 — [npm registry: remotion](https://registry.npmjs.org/remotion); [docs source folder](https://github.com/remotion-dev/remotion/tree/main/packages/docs/docs)

### Inferences
- Parallax is about 77 patch versions behind (4.0.457 versus 4.0.534). The upgrade unlocks multi-still `--frames`, shared-memory capture (the dev machine runs Darwin 25, which satisfies the macOS 15+ requirement; whether it is Apple Silicon was not checked), `Easing.spring`, perceptual scale and effects. The v4.0.530 `durationInFrames`/`playbackRate` ordering change is the main regression risk for existing templates, so the existing 75-baseline visual regression suite should be rerun across the upgrade.
- For NLE handoff with narration added later, the documented route is ProRes (`hq`, or `4444` with alpha for overlays) rather than H.264; setting `--color-space=bt709` now matches the announced v5 default and avoids a colour shift at upgrade time.
- With shared-memory capture, JPEG quality stops mattering for video renders on supported machines, but stills and image sequences still use screenshots, so still-based QA and final video frames can differ slightly in compression path.
- As a solo creator the channel falls under the Free License; the per-seat Creators plan explicitly counts people who author through agents, which only matters if the team grows past three.

### Gaps
- I only pulled full release notes for v4.0.474–v4.0.534; earlier 2024–2025 changes are dated from docs version tags plus npm timestamps, not from their release notes, so smaller renderer fixes in that period are not covered.
- A fix for progressive slowdown in long renders (v4.0.533) and several Studio items came from a model-summarised view of the releases page and were not all re-verified line by line.
- I did not verify Lambda pricing/performance changes or read the Lambda changelog in detail.
- `@remotion/sdk` is tagged v4.0.527 in the docs but first appears on npm at v4.0.533; I did not resolve which is correct.
- No announced date for Remotion 5.0 was found.

## 5. What does Remotion officially recommend for visual regression / snapshot testing, rendering stills, checking frames programmatically, and performance debugging?

### Takeaway
Remotion's official testing guidance is thin: treat components as ordinary React and mount them with `<Thumbnail>` at a chosen frame; there is no first-party visual-regression harness for user projects. The practical frame-checking primitives are `npx remotion still`, `renderStill()`, and since July 2026 `npx remotion render --frames=0,30,90` for several stills in one call, while performance work centres on `--log=verbose`, `npx remotion benchmark` and concurrency tuning.

### Cited Findings

**Testing**
- The testing page says to test Remotion components like any React component, using React Testing Library, Bun with Happy DOM, or Playwright for end-to-end tests — [Testing docs](https://www.remotion.dev/docs/testing)
- To supply Remotion's contexts and show a component at a specific frame, it recommends wrapping in `<Thumbnail>` from `@remotion/player`, with the `noSuspense` prop (v4.0.271, 2025-03) so markup is not delayed by Suspense — [Testing docs](https://www.remotion.dev/docs/testing)
- A text search of the downloaded docs (all top-level pages plus the CLI, renderer, Studio and package sections) for visual regression, snapshot testing, `toMatchSnapshot` and pixelmatch returned no matches, so there is no official visual-regression guide for user projects — [docs source folder](https://github.com/remotion-dev/remotion/tree/main/packages/docs/docs)
- Internally, the Remotion team tests the web renderer with visual snapshot tests in vitest: a fixture composition is rendered with `renderStillOnWeb()` to PNG and compared by test id — [web-renderer-test internal skill](https://github.com/remotion-dev/remotion/blob/main/.agents/skills/web-renderer-test/SKILL.md)
- The team's internal test-writing skill prefers a browser render, image comparison, pixel probe or produced frame for visual-effect changes, and argues one rendered-frame assertion can be worth more than many narrow unit assertions — [writing-tests internal skill](https://github.com/remotion-dev/remotion/blob/main/.agents/skills/writing-tests/SKILL.md)

**Rendering stills and checking frames**
- `<Still>` defines a single-frame composition; stills render through `npx remotion still`, `renderStill()`, `renderStillOnWeb()`, Lambda or Cloud Run; formats are png (default), jpeg, webp and pdf — [Still images source](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/stills.mdx)
- `npx remotion still` takes `--frame`, `--scale` (up to 16), `--props` and `--image-format` — [still CLI docs](https://www.remotion.dev/docs/cli/still)
- **[2026]** From v4.0.502 (2026-07-30), `npx remotion render <comp> out/frames --frames=0,30,90 --image-format=png` renders specific frames as an image sequence; ranges such as `--frames=0-99,150-199` are concatenated into one video, and frames and ranges can be mixed — [render CLI docs](https://www.remotion.dev/docs/cli/render)
- `--image-sequence-pattern` (v4.0.313) controls output file naming for sequences — [render CLI docs](https://www.remotion.dev/docs/cli/render)
- **[2026]** The official render skill tells agents to use `npx remotion still` for one frame and `render --frames` for several — [remotion-render SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-render/SKILL.md)
- For maps, the official guidance is to render a short MP4 rather than trust Studio, and to inspect static texture while the camera moves — [render-stability.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-maps/techniques/mapbox/references/render-stability.md)

**Performance debugging**
- Render with `--log=verbose` to list the slowest frames (the first frames per thread may be slow from initialisation), use `console.time` to find slow code, and run `npx remotion benchmark` to find the best `--concurrency` — [Performance docs](https://www.remotion.dev/docs/performance)
- `npx remotion benchmark` (v3.2.28) accepts `--runs` and `--concurrencies` plus the render flags — [benchmark CLI docs](https://www.remotion.dev/docs/cli/benchmark)
- GPU-dependent content (WebGL, 2D canvas, `box-shadow`, `text-shadow`, gradients, `filter: blur()`, `drop-shadow()`) is slow on GPU-less cloud instances; the docs suggest precomputed images there — [Performance docs](https://www.remotion.dev/docs/performance)
- PNG frames are slower than JPEG but required for transparency; VP8/VP9 encode slowly; `--scale` below 1 speeds up drafts; memoise expensive computation — [Performance docs](https://www.remotion.dev/docs/performance)
- The old video tags are described as not optimised; `<Video>` from `@remotion/media` is recommended for speed — [Performance docs](https://www.remotion.dev/docs/performance)
- Debugging failed renders: enable verbose logging, temporarily set `--concurrency=1` so logs appear once, add `console.log`, and remove components one at a time — [Debugging render failures](https://www.remotion.dev/docs/troubleshooting/debug-failed-render)
- Verbose logs also confirm whether shared-memory capture, parallel encoding and hardware acceleration are active — [Shared-memory capture docs](https://www.remotion.dev/docs/shared-memory-capture); [Hardware acceleration docs](https://www.remotion.dev/docs/hardware-acceleration)

### Inferences
- Parallax's existing PNG-baseline suite is already more rigorous than anything Remotion documents for users; the upstream contribution worth adopting is the multi-frame `--frames` call, which replaces N separate `still` invocations (each paying bundle and browser start-up) with one.
- The `<Thumbnail>` approach is a cheap way to add DOM-level assertions at specific frames (for example label text present at a sync point) without launching a render.
- Remotion's own team treats rendered-frame comparison as the right boundary for visual changes, which supports keeping pixel baselines as the primary gate.

### Gaps
- No official tolerance, diffing library or baseline-management recommendation exists for user projects; I found none to cite.
- I did not find official guidance on programmatic frame inspection beyond rendering images (for example histogram or contrast checks).
- The exact contents of verbose slow-frame output were not sampled.

## 6. Are there official or maintainer-endorsed examples of AI-driven review loops (an agent renders stills and inspects them) or of agents driving Remotion Studio?

### Takeaway
Yes, but lightly: the official skills tell agents to open Studio for visual checks or render one or several frames as images, and Studio now exposes WebMCP tools so an agent can read selection, HTML, element geometry and errors and can seek and play. WebMCP returns structure rather than pixels and, per the docs, works only with ChatGPT Codex today; there is no official, documented closed-loop "render, look, fix" example for Claude Code.

### Cited Findings

**Stills-based visual checks in the official skills**
- The markup skill's visual-checks section says that when a visual check is useful the agent should open Studio for an interactive preview, and may also render one or several frames as images — [remotion-markup SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/SKILL.md)
- **[2026]** That section was rewritten in v4.0.528 (2026-09-24) to include how to render multiple stills — [release v4.0.528](https://github.com/remotion-dev/remotion/releases/tag/v4.0.528)
- The Studio skill tells agents with an in-app browser to start `npx remotion studio --no-open`, open the printed URL (compositions are addressable at `/[composition-id]`), and verify that Studio and the video preview load — [remotion-studio SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-studio/SKILL.md); [remotion-best-practices SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/SKILL.md)

**Agents driving Studio: WebMCP [2026]**
- Studio exposes WebMCP tools from v4.0.518 (2026-08-26) that let an agent inspect and steer it — [WebMCP docs](https://www.remotion.dev/docs/ai/webmcp)
- Read tools: `get_compositions`, `get_composition`, `get_sequences`, `get_selection`, `get_canvas_html` (rendered HTML at the current frame, capped at 100,000 characters, canvas/WebGL pixels not represented), `get_outlines` (element bounding boxes in composition pixels with source file and line), `get_playback_state`, `get_guides`, `get_current_error` (v4.0.520, symbolicated stack frames) — [WebMCP docs](https://www.remotion.dev/docs/ai/webmcp)
- Control tools: `select_composition`, `select_sequence`, `seek_to_frame`, `play`, `pause`, `set_playback_rate`, `set_timeline_zoom`, `mute`/`unmute`, guide add/remove, `install_package`, `transcribe_asset`, `remove_video_background` (all three v4.0.523), `restart_studio`, `shut_down_studio` (v4.0.521) — [WebMCP docs](https://www.remotion.dev/docs/ai/webmcp)
- The tool input/output shapes are declared unstable, and WebMCP itself is a draft web platform API — [WebMCP docs](https://www.remotion.dev/docs/ai/webmcp)
- Compatibility, in the docs' words: "Out of the major harnesses, only ChatGPT Codex supports WebMCP." — [WebMCP docs](https://www.remotion.dev/docs/ai/webmcp)

**Other Studio-to-agent hand-offs [2026]**
- Studio has a default coding agent setting (v4.0.506; `--coding-agent` accepts codex, cursor, copilot, claude-code) — [default-coding-agent option source](https://github.com/remotion-dev/remotion/blob/main/packages/renderer/src/options/default-coding-agent.tsx)
- Context-copy actions for agents were added to composition menus (v4.0.518), inspector rows (v4.0.516), folder menus (v4.0.525) and multi-sequence menus (v4.0.533) — [release v4.0.518](https://github.com/remotion-dev/remotion/releases/tag/v4.0.518); [release v4.0.533](https://github.com/remotion-dev/remotion/releases/tag/v4.0.533)
- A generate-with-agent interaction arrived in v4.0.526, integration with the ChatGPT Codex annotation system in v4.0.533, and ChatGPT annotations on source and repair actions in v4.0.534 — [release v4.0.526](https://github.com/remotion-dev/remotion/releases/tag/v4.0.526); [release v4.0.533](https://github.com/remotion-dev/remotion/releases/tag/v4.0.533); [release v4.0.534](https://github.com/remotion-dev/remotion/releases/tag/v4.0.534)
- Studio actions can emit structured requests that the skills know how to fulfil, for example a pre-compose request naming a sequence and source location that the agent must turn into a connected composition — [remotion-markup SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/SKILL.md)
- The team added WebMCP-controlled React Scan recordings to its own tooling in v4.0.525 — [release v4.0.525](https://github.com/remotion-dev/remotion/releases/tag/v4.0.525)

**Maintainer practice and evaluation**
- Remotion keeps an internal `@remotion/skills-evals` package (scenarios, run comparison, a playground added in v4.0.490) to evaluate the skills; it is undocumented — [skills-evals README](https://github.com/remotion-dev/remotion/blob/main/packages/skills-evals/README.md); [release v4.0.490](https://github.com/remotion-dev/remotion/releases/tag/v4.0.490)
- The monorepo's `.agents/skills` folder holds about 70 agent skills (internal ones plus copies of the public ones); `video-report` simply has the agent render a reported video with verbose logging — [video-report internal skill](https://github.com/remotion-dev/remotion/blob/main/.agents/skills/video-report/SKILL.md)
- Secondary: third-party write-ups describe keeping Studio open in one terminal and the agent in another, and community skills exist that extract frames for agent review; none of these is an official Remotion example — [tella.com (secondary)](https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code); [mcpmarket.com listing (secondary)](https://mcpmarket.com/tools/skills/video-frame-inspector)

### Inferences
- Remotion's endorsed loop is human-in-the-loop: agent edits, human watches Studio and steers. The skills explicitly discourage rendering unless asked, so an autonomous "render stills, inspect with vision, fix" loop such as Parallax's `visual-qa` skill goes beyond official guidance rather than contradicting it; the official primitive it should build on is `render --frames`.
- For Claude Code specifically, WebMCP is not available today, so driving Studio means either a browser-automation tool pointed at the Studio URL or skipping Studio and using stills. `get_outlines` (bounding boxes plus source locations) would be the most valuable WebMCP tool for automated layout QA if support arrives, because it gives overlap and margin checks without vision.
- `get_canvas_html` excludes canvas and WebGL pixels, so map, Three.js and effects-heavy templates cannot be reviewed through WebMCP even where it is supported; rendered stills remain necessary.

### Gaps
- I found no maintainer post, video or doc demonstrating an agent autonomously rendering stills and critiquing them; X/Twitter and YouTube were not searched directly, so such a demo may exist there.
- The contents and scoring method of the internal skills evals are undocumented and were not inspected.
- I could not verify whether Claude Code, Cursor or others have added WebMCP support since the docs page was written.
