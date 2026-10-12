# Voice sync, word timing, render speed and captions: research for four queued changes

> October 10, 2026. Web research by a sub-agent (text sources only: official docs, release notes, repos, papers, and PyPI / Homebrew / conda-forge metadata read today; nothing installed, no videos watched). Repo findings were read from the files named in each section; the sync-word matcher was also called on made-up word lists, and the existing full preview render was inspected with `ffprobe`. No repo file was changed. Sources older than 2025 are marked **[old]**.

## A. Graphics that follow the voice

### A1. What our code does today (read, and tested where noted)

- **The re-time moves segment edges only.** `tools/assembly/retime_manifest.py` finds the first 8 words of each segment's `narrationRef` in the recording (forward-only fuzzy search), stretches every boundary through those anchors, scales cue offsets inside a segment, then calls `resolve_all_sync_points`. Data files are not touched. The sample report (`remotion-templates/out/retime/ai-care-motives/report.md`, made from synthetic word timings) goes 11:18.6 → 10:08.1 and lists 19 template slots now shorter than their data file's `durationSec`.
- **Almost no reveal is on a cue yet.** 2 of 56 segments carry `syncWords` (`beat4-seg22` "four days later", `beat6-seg31` "forty times"); none is resolved. The rest of the reveal timing is seconds typed into data files: `axioms[].atSec` (`three-checks.json`: 1.3 / 2.9 / 4.2), `left.revealAtSec` / `right.revealAtSec` (`shop-motif-reasons.json`: 4.6 / 10.4), `conditionAtSec`, `branchesAtSec`, `typingStartSec`, `statAtSec`, and `durationSec` (30 occurrences across the episode's 27 data files).
- **Templates are already told the slot length, in frames.** Inside a `<Sequence>`, `useVideoConfig().durationInFrames` returns the Sequence's own length (checked in `node_modules/remotion/dist/cjs/use-unsafe-video-config.js`), and `FullEpisode.tsx` wraps every segment in a Sequence of slot length. What goes stale after a re-time is `data.durationSec` and the typed seconds above. By a text count, `KineticTypography`, `SplitFrame`, `ImageComposite`, `DotPlot`, `PrimarySourceReveal` and `TitleTransition` read `data.durationSec`; `FrameworkDiagram`, `HorizontalTimeline`, `StatReveal`, `MathDerivation`, `NetworkDiagram` and `SplitComposition` read `durationInFrames` and so already adapt. The report's 19 rows therefore over-count: the real exposure is the typed seconds.
- **The sync-word matcher returns wrong words with full confidence.** `_find_sync_word` in `tools/assembly/generate_manifest.py` tries an exact word, then an exact phrase, then "either string contains the other". Tested on made-up lists: with the recording transcribed as "40 times", the cue "forty times" resolves to the word "times" (0.4s late in the test); with "4 days later", the cue "four days later" resolves to an earlier "Our" (2s early), because "our" is inside "four". A repeated word resolves to its first occurrence in the segment (the window also reaches 0.5s into the neighbours). A hit is always written with `confidence: 1.0`, because the code reads a `confidence` key and faster-whisper supplies `probability`. Both cues in `ai-care-motives` are number phrases.
- **One unresolved cue shifts all the others.** `FullEpisode.tsx` filters out sync points whose time is null before handing the array to the template, while seven templates read `syncPoints[i]` as "the cue for element i". A missed second cue makes element 2 reveal on cue 3's time.

### A2. How other toolchains do it

- **manim-voiceover** (v0.4.0, PyPI 2026-06-14, Python ≥3.11): the cue is a tag inside the narration text, `<bookmark mark='A'/>`, and the animation waits for it by name (`wait_until_bookmark`, `time_until_bookmark`). Word times come from the speech engine or from Whisper (`transcription_model`; the recorder service defaults to `base`). It does not search for words: it takes the bookmark's character offset in the script, scales it by transcript length ÷ script length, and interpolates over the word boundaries. [Quickstart](https://voiceover.manim.community/en/stable/quickstart.html), [API](https://voiceover.manim.community/en/stable/api.html), [tracker source](https://voiceover.manim.community/en/stable/_modules/manim_voiceover/tracker.html), [PyPI](https://pypi.org/project/manim-voiceover/) (all read Oct 10, 2026)
- **Motion Canvas** (stable v3.17.2, Dec 14, 2024 **[old]**; alpha Feb 2025): the code says `waitUntil('name')` with no duration; the time is set by dragging that event on the editor timeline against the voiceover. Moving one event moves all later ones unless SHIFT is held. `useDuration('name')` gives the length between events. A person resolves the cue; nothing is recognised. [Time events](https://motioncanvas.io/docs/time-events/), [releases](https://github.com/motion-canvas/motion-canvas/releases)
- **Remotion** has no cue system. Its convention is one captions JSON per audio file (word text with start and end in milliseconds), converted to frames in the composition; `createTikTokStyleCaptions()` groups words into pages by time. Its whisper.cpp wrapper says token-level timestamps (`--dtw`) are "Recommended to get actually accurate timings". Its Recorder ships a caption editor and an `autocorrect.ts` word remap for when "the AI makes the same mistake multiple times". The official skill says to keep timestamps relative to the source audio file, not the composition. [transcribe()](https://www.remotion.dev/docs/install-whisper-cpp/transcribe), [createTikTokStyleCaptions](https://www.remotion.dev/docs/captions/create-tiktok-style-captions), [Recorder captions](https://www.remotion.dev/docs/recorder/editing/captions), [skill: transcribe-captions](https://github.com/remotion-dev/skills/blob/main/skills/remotion-captions/transcribe-captions.md) (read Oct 10, 2026)
- **After Effects**: a marker's comment is its name, and an expression reads its time by name (`thisLayer.marker.key("name").time`), so keyframed motion follows hand-placed markers on the voice track. [Expression reference: MarkerProperty](https://ae-expressions.docsforadobe.dev/objects/marker-property/) (community-maintained reference; Adobe's own page returned 403)

**What they converge on.** A named cue lives in the content; its time comes from the recording; the animation refers to the name, never to a number of seconds. They differ in who resolves the name: a transcriber (manim-voiceover) or a person dragging a marker (Motion Canvas, After Effects). Remotion's own tools add a correction step on top of the transcriber.

### A3. What goes wrong in practice

- **Misheard words.** Remotion's Recorder needs both a per-caption editor and a global remap table. [Recorder captions](https://www.remotion.dev/docs/recorder/editing/captions)
- **Numerals and symbols.** WhisperX's README lists words such as "2014." or "£13.60" as not alignable; its CLI has `--suppress_numerals` "since wav2vec2 cannot align them correctly"; current code gives such characters a wildcard and fills missing word times from the nearest neighbour. [README](https://github.com/m-bain/whisperX), [`__main__.py`](https://github.com/m-bain/whisperX/blob/main/whisperx/__main__.py), [`alignment.py`](https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py) (read Oct 10, 2026). Our matcher fails on exactly this (A1).
- **Proportional mapping drifts.** manim-voiceover's character-offset scaling is only as good as the transcript's length matches the script's; a dropped phrase or a digit string moves every later bookmark a little. (From its source, above.)
- **Loose word times from Whisper itself.** See B2: with Whisper's default method only about 40% of word ends fall within 50ms.
- **Invented text in pauses.** About 1% of Whisper transcriptions in one study contained hallucinated phrases, more often around long non-speech stretches. [Koenecke et al., Feb 2024](https://arxiv.org/abs/2402.08021) **[old]**
- **Repeated phrases.** None of the sources addresses this; in our code the first occurrence wins (A1).

### A4. Recommended design for our templates

1. **A cue is a place in the script, not a word to search for.** When the manifest is built, resolve each `sync:"…"` phrase to a token span inside that segment's own narration text (exact match after normalising case and punctuation). If the phrase occurs twice, require an occurrence number; if it does not occur, fail the lint. This check runs before anything is recorded. Store the span next to `syncWords`.
2. **Time comes from one script-to-recording alignment per take.** Every script token gets a time: directly from a forced aligner, or by aligning script tokens to transcript tokens once for the whole take and filling unmatched tokens (numerals, misheard names) from their neighbours. A cue's time is its first token's time. This removes the per-cue fuzzy search, and with it the misheard-word, numeral and repeated-phrase failures.
3. **Keep `syncPoints` positional and complete.** Never drop an entry in `FullEpisode.tsx`; an unresolved cue gets a proportional estimate marked `estimated: true`. Read `probability` for confidence.
4. **Use the same cues before recording.** In estimate mode a cue's time is its token position at 150 words a minute. The picture is then built on cues from day one, and a re-time only swaps the times.
5. **Slot length: yes, pass it, by making `durationSec` true.** Where `ForegroundSegment` builds `dataWithSync`, set `durationSec` to the slot's seconds and keep the authored value beside it. Templates that read `durationInFrames` need nothing.
6. **Typed seconds become a fallback.** Where a row must land on a word, give the row a cue (the `syncs:[…]` list already maps one-to-one to elements). Where there is no cue, scale the typed start times by slot ÷ authored duration at dispatch, the same rule as proportional camera paths in `project/PACING_SYSTEM.md`. Scale start times only, not entrance durations. The re-time tool then never needs to rewrite a data file.
7. **A hand override and a report.** A `syncOverrides` entry in the manifest wins over the aligner (the Motion Canvas and After Effects lesson). The re-time report lists each cue with the words either side, its time and probability, and the `preview-range.mjs --segment` command for any cue under a threshold.

## B. A transcriber or aligner on this machine

**Machine (checked locally):** Apple M4 Max, 14 cores, 36 GB, macOS 26.5. `python3` is 3.14.6; Homebrew also has `python3.13` and `python3.11`. `uv`, `pipx` and conda are not installed. Homebrew `ffmpeg` 8.1.1 has VideoToolbox but no `whisper` filter. `tools/narration/whisper_alignment.py` and `retime_manifest.py --audio` import `faster_whisper`; `retime_manifest.py --words` already reads WhisperX, openai-whisper, faster-whisper and whisper.cpp JSON.

### B1. Options

Package versions, dates and wheel lists are from PyPI's JSON metadata, read Oct 10, 2026. "Installs on 3.14" means every compiled dependency publishes a `cp314` or `abi3` macOS arm64 wheel; nothing was installed to confirm.

| Option | Current release | Install route | Python 3.14 | How it times words | Speed on Apple Silicon |
|---|---|---|---|---|---|
| **faster-whisper** | 1.2.1 (2025-10-31) | `pip install faster-whisper` | Yes by metadata (ctranslate2 4.8.2, onnxruntime 1.31.0, av 19.0.1, tokenizers 0.23.3 all have wheels) | Whisper's own attention-based word times | CPU only (README names only CUDA for GPU). 6.96s on a short clip, slowest of nine in the benchmark below |
| **whisper.cpp** | 1.9.5 (Oct 6); Homebrew bottle 1.9.4 | `brew install whisper-cpp`; model files separate | No Python | `-ml 1 -sow` word output, labelled "experimental"; `--dtw` for token-level times | Runs "fully on the GPU via Metal"; Core ML encoder is a source-build option. 1.23s in the benchmark |
| **mlx-whisper** | 0.4.3 (2025-08-29) | `pip install mlx-whisper` | Yes by metadata, but it pulls in torch, numba and scipy | Same method as Whisper (`word_timestamps=True`) | Fastest Whisper tested: 1.02s |
| **WhisperX** | 3.8.6 (2026-05-25) | `pip install whisperx` | **No**: requires `>=3.10,<3.14`. Use the installed `python3.13` (its pins, torch 2.8, torchaudio 2.8 and pyannote-audio ≥4, publish 3.13 arm64 wheels) | faster-whisper transcript, then forced alignment with a wav2vec2 model (`WAV2VEC2_ASR_BASE_960H` for English) | CPU on a Mac (`--device cpu --compute_type int8`). No Apple Silicon figure found |
| **Montreal Forced Aligner** (known text) | 3.4.3 (conda-forge 2026-10-09; Kaldi arm64 build 2026-05-30) | `conda create -n aligner -c conda-forge montreal-forced-aligner`; pip alone is not enough | Own conda environment, so 3.14 is irrelevant | Kaldi acoustic model plus a pronunciation dictionary | Not measured |
| **Qwen3-ForcedAligner** (known text) | model Jan 2026; `mlx-audio` 0.5.8 (2026-10-05) | `pip install mlx-audio` | Probably (mlx, scipy and miniaudio have wheels; the rest was not checked) | Model predicts a time per word; 300s per call | Not measured |

Sources: [faster-whisper README](https://github.com/SYSTRAN/faster-whisper); [whisper.cpp README](https://github.com/ggml-org/whisper.cpp), [CLI options](https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md), [releases](https://github.com/ggml-org/whisper.cpp/releases), `brew info whisper-cpp`; [mlx-whisper README](https://github.com/ml-explore/mlx-examples/tree/main/whisper); [WhisperX README](https://github.com/m-bain/whisperX); [MFA install](https://montreal-forced-aligner.readthedocs.io/en/latest/installation.html), [MFA alignment](https://montreal-forced-aligner.readthedocs.io/en/latest/user_guide/workflows/alignment.html); [mlx-audio README](https://github.com/Blaizzy/mlx-audio). Speed figures: [mac-whisper-speedtest](https://github.com/anvanvan/mac-whisper-speedtest), MacBook Pro M4 24 GB, one short sentence, large-v3-turbo, undated.

Other aligners that take known text, and why they are not in the table:

- **`ctc-forced-aligner`**: the well-known project (MahmoudAshraf97, MMS model) installs from git, needs torch, and its default model is CC-BY-NC 4.0. The PyPI package of that name (1.0.2, 2025-02-09) is a different, small fork. [Repo](https://github.com/MahmoudAshraf97/ctc-forced-aligner), [fork](https://github.com/deskpai/ctc_forced_aligner)
- **torchaudio `forced_align`**: kept after the 2.9 removals (maintainers' update of Jan 21, 2026); torchaudio 2.11.0 has 3.14 wheels. It is a function, not a tool: we would write the script. [Announcement thread](https://github.com/pytorch/audio/issues/3902)
- **stable-ts `align()`**: the repository was archived on May 30, 2026 ("Development on this repository is indefinitely paused"). [Repo](https://github.com/jianfch/stable-ts)
- **aeneas**: last release March 2017 **[old]**. Not credible today.
- Also seen, with no timing-accuracy figures: `parakeet-mlx` 0.5.3 (0.50s in the benchmark above; the model card claims accurate word times without a number), Apple's on-device transcriber through `yap` (`brew install yap`, macOS 26, `--json --word-timestamps`), `whisperkit-cli` 1.1.0. [parakeet-mlx](https://github.com/senstella/parakeet-mlx), [model card](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2), [yap](https://github.com/finnvoor/yap)

### B2. Word-timing accuracy as reported

| Method | Share of word boundaries within 50ms / 100ms | Source and method |
|---|---|---|
| Whisper's own word times (default attention heads) | 41% / 67% (TIMIT); 40% / 67% (LibriSpeech) | Yeh, Meng & Tang, Sept 2025: F1 on word-end times, word must also match, Whisper medium |
| WhisperX (wav2vec2 forced alignment) | 80% / 91% (TIMIT); 80% / 89% (LibriSpeech) | same paper |
| WhisperX | 82% / 94% (TIMIT), median error 23.5ms | Rousso et al., Interspeech 2024 **[old]**: hand-aligned corpora, correctly recognised words only |
| Montreal Forced Aligner | 89% / 97% (TIMIT), median 12.5ms; 91% / 98% in the 2025 paper | both papers |
| Qwen3-ForcedAligner | mean shift 37.5ms on English, against 92.1ms for WhisperX | Qwen report, Jan 2026: the vendor's own test, on labels produced by MFA, which is also what the model was trained on |

[Yeh et al.](https://arxiv.org/abs/2509.09987), [Rousso et al.](https://arxiv.org/abs/2406.19363), [Qwen3-ASR report](https://arxiv.org/abs/2601.21337). The Whisper row was measured on OpenAI's implementation; faster-whisper, mlx-whisper and whisper.cpp use the same idea, and no separate figures were found for them. Our working tolerance is roughly 100ms (a judgment from the 5-frame anticipation in `animation.ts`, not a measured threshold). On these numbers Whisper's own times miss that for about one word in three; forced alignment misses it for about one in ten.

### B3. Recommendation

**Primary: WhisperX 3.8.6 in its own Python 3.13 environment.** It is the only pip-installable option here with independent accuracy evidence for forced alignment, `normalise_words` already reads its output, and `project/PACING_SYSTEM.md` already assumes it. It cannot run on 3.14.

```bash
/opt/homebrew/bin/python3.13 -m venv ~/.venvs/parallax-whisperx
~/.venvs/parallax-whisperx/bin/pip install "whisperx==3.8.6"
~/.venvs/parallax-whisperx/bin/whisperx narration.wav --model large-v3-turbo --language en \
  --device cpu --compute_type int8 --suppress_numerals \
  --output_format json --output_dir remotion-templates/out/retime/<slug>/
python3 tools/assembly/retime_manifest.py <slug> --words remotion-templates/out/retime/<slug>/narration.json
```

The first run downloads model weights. WhisperX's `align()` also accepts our own script lines with rough start and end times, which is the route to aligning the known text itself (A4, point 2).

**Fallback: faster-whisper 1.2.1 on Python 3.14.** It is what both repo tools already call and needs no torch. Use it if the WhisperX install fails, and accept looser word times (the segment anchors of a re-time tolerate that; individual cues should then be checked by eye).

```bash
/opt/homebrew/bin/python3 -m venv ~/.venvs/parallax-asr
~/.venvs/parallax-asr/bin/pip install "faster-whisper==1.2.1"
~/.venvs/parallax-asr/bin/python tools/assembly/retime_manifest.py <slug> --audio narration.wav --model large-v3-turbo
```

If no Python route works: `brew install whisper-cpp`, fetch a model file, and run `whisper-cli -m <model.bin> -f narration-16k.wav -ml 1 -sow -oj`; `--words` reads that JSON too. MFA is the most accurate option on paper, but it needs conda and a dictionary entry for every name (Glaucon, Wolfsburg), which is more upkeep than one narrator and ten minutes of clean audio justify.

## C. Render speed

### C1. What the existing render tells us (checked locally)

- **Installed Remotion is 4.0.457; current is 4.0.534 (Oct 7, 2026).** [Release](https://github.com/remotion-dev/remotion/releases/tag/v4.0.534)
- **The 50–80 minute render went through the Node API, not the config file.** `out/preview/ai-care-motives/0.0-678.6.mp4` has 20,358 frames, so the render ran at about 4–7 frames a second. Default concurrency in this version is half the threads, capped at 8, so 7 tabs here: roughly 1.0–1.7 seconds of tab time per frame.
- **`remotion.config.ts` does not apply to `preview-range.mjs`.** "The configuration file has no effect when using SSR APIs." [Config docs](https://www.remotion.dev/docs/config). So that render used JPEG frames at quality 80, let Chrome choose the GL backend, and tagged the file BT.601: `ffprobe` shows `yuvj420p` and `bt470bg`, not the `yuv420p` / `bt709` the config sets. No render script passes `chromiumOptions`. Any master made this way has the colour shift the config comment warns about.
- **Where the frames are.** Clips through `OffthreadVideo` are 40% of the runtime (273s in 25 segments), each under `BrandImage`'s tiled-noise `overlay` blend and vignette (its SVG colour filter applies to stills, not to the clips). `EditorialSurface` draws a second, full-frame grain over every frame of the episode, generated live: `feTurbulence`, 3 octaves, a new seed every 2 frames, `multiply` blend. `Background.tsx` adds 80–100px blurs. `backdrop-filter` appears only in `SplitFrame` (3.7% of this episode).

### C2. Remotion's guidance, item by item

- **GL backend.** In Remotion 4 the default is `null` ("lets Chrome decide"); `angle` is recommended on a desktop and becomes the default in 5.0. "In headless mode, Chromium disables the GPU, leading to a significant slowdown." The caveat: "Memory leaks are a known problem with angle", so long renders should be split into parts. [GL options](https://www.remotion.dev/docs/gl-options), [GPU](https://www.remotion.dev/docs/gpu)
- **What uses the GPU.** WebGL, video decoding, `box-shadow`, `text-shadow`, gradients, `filter: blur()`, `drop-shadow()`, `transform`, most 2D canvas. Remotion's advice where there is no GPU is to replace the effect with a precomputed image. SVG filters, blend modes and backdrop filters are not on its list. [GPU](https://www.remotion.dev/docs/gpu), [Performance](https://www.remotion.dev/docs/performance). A Chromium design note says a filter declared on an SVG element, which is how our grain is drawn, renders on the CPU path. [Filter Effects](https://www.chromium.org/developers/design-documents/image-filters/) (about 2013 **[old]**; seen through a search summary only)
- **Concurrency.** Too high a value has "diminishing returns" and can crash a render; `npx remotion benchmark` compares values. The maximum here is 14. [Concurrency](https://www.remotion.dev/docs/terminology/concurrency), [benchmark](https://www.remotion.dev/docs/cli/benchmark)
- **`scale`.** "Higher resolutions make renders slower"; `--scale` (or `scale` in `renderMedia`) renders at a fraction. 0.5 gives 960×540, a quarter of the pixels. [Performance](https://www.remotion.dev/docs/performance)
- **Intermediate frames.** JPEG is the default and fastest (quality 80); PNG is slower and only required for transparency. Our config chooses PNG for CLI renders and estimates the cost at 20–30%. [renderMedia](https://www.remotion.dev/docs/renderer/render-media)
- **Shared-memory capture (4.0.534).** Frames go to FFmpeg as bitmaps, skipping the JPEG or PNG encode and decode that the docs call "pure overhead"; `imageFormat` and `jpegQuality` then "have no effect". Supported on Apple Silicon with macOS 15 or later, for video renders only. Parallel encoding is on by default from the same version. No speed figure is published. [Shared-memory capture](https://www.remotion.dev/docs/shared-memory-capture), [Parallel encoding](https://www.remotion.dev/docs/parallel-encoding)
- **Hardware encoding.** VideoToolbox H.264 on macOS since 4.0.236: `--hardware-acceleration if-possible`. No CRF; files are larger unless a bitrate is set (`--video-bitrate=8M` for size parity at 1080p). Not available on Lambda. [Hardware acceleration](https://www.remotion.dev/docs/hardware-acceleration)
- **`OffthreadVideo`.** Each frame is extracted outside the browser with FFmpeg and shown as an image (a bitmap by default; PNG if `transparent`, which is slower). The current docs call it "not optimized" and recommend `<Video>` from `@remotion/media` ("Fastest" against "Fast"), which falls back to `OffthreadVideo` for unsupported media. `@remotion/media` was marked "stable and recommended" in 4.0.491 (Jul 18, 2026), after our version. [Video tags](https://www.remotion.dev/docs/video-tags), [OffthreadVideo](https://www.remotion.dev/docs/offthreadvideo), [release 4.0.491](https://github.com/remotion-dev/remotion/releases/tag/v4.0.491)
- **Chunks.** Render frame ranges with identical options and join them with `combineChunks()`: every chunk the same number of frames except the last, codec `h264-ts` for the parts and `h264` for the join. From 4.0.502 the CLI also accepts `--frames=0-99,150-199`. [Distributed rendering](https://www.remotion.dev/docs/distributed-rendering), [CLI render](https://www.remotion.dev/docs/cli/render)
- **Finding slow frames.** `renderMedia()` returns `slowestFrames`, the ten slowest as `{frame, time}`; the CLI prints them with `--log=verbose`. `preview-range.mjs` discards the return value. From 4.0.530 (Sept 29, 2026) the figure is each frame's own render time; the same release has a "small breaking change": `durationInFrames` applies before `playbackRate`. [renderMedia](https://www.remotion.dev/docs/renderer/render-media), [release 4.0.530](https://github.com/remotion-dev/remotion/releases/tag/v4.0.530)

### C3. Remotion Lambda for an 11-minute 1080p render

- **Remotion's own example:** a 10-minute HD composition playing a remote video cost $0.103 and took 56s warm (2048 MB, us-east-1, Remotion 4.0.381). Scaled to our 20,358 frames that is about $0.15. [Cost examples](https://www.remotion.dev/docs/lambda/cost-example)
- **Our frames are heavier.** That example works out to about 0.27 function-seconds per frame; ours take 1.0–1.7 tab-seconds on an M4 Max. Lambda has no GPU ("it is not possible to use it") and slower cores. **Estimate, not a quote:** at 2–4 times our local per-frame time, a full render costs about $1–4 at the Arm rate of $0.0000133334 per GB-second, and finishes in roughly 5–15 minutes with the full 200 functions running at once. [GPU](https://www.remotion.dev/docs/gpu), [AWS pricing](https://aws.amazon.com/lambda/pricing/)
- **Limits that matter.** At most 200 functions per render, 15 minutes per function, 10 GB of memory. The default account limit is 1,000 concurrent executions but "might be lower for new accounts"; with fewer than about 200 available, our chunks as they stand risk running past 15 minutes. Our `deploy` and `render:lambda` scripts are scaffolded but dormant. [Limits](https://www.remotion.dev/docs/lambda/limits), [renderMediaOnLambda](https://www.remotion.dev/docs/lambda/rendermediaonlambda)

### C4. Options ranked by expected gain for our case

Gains are estimates until the first row has been run.

| # | Change | Expected gain | Basis |
|---|---|---|---|
| 0 | Measure: log `slowestFrames`; render one clip segment, one diagram, one card on their own; repeat with grain off | None by itself; it orders everything below | Our frames cost several times Remotion's example and we do not know which layer is responsible |
| 1 | Pass `chromiumOptions.gl: "angle"`, `colorSpace` and `pixelFormat` in the Node render scripts | Possibly the largest; also fixes the colour tags | The script path most likely rendered without the GPU; blurs, gradients, transforms and video decoding are all on Remotion's GPU list |
| 2 | Review renders at `scale: 0.5` (or 0.667 for 720p) | About 2–3× on review renders | A quarter of the pixels; the existing 720p file was scaled down after a full-size render |
| 3 | Replace per-frame `feTurbulence` grain with a few pre-rendered grain plates cycled every 2 frames | Unknown; likely material | Full-frame noise is regenerated 15 times a second for the whole episode; Remotion's advice is a precomputed image, and `BrandImage` already does this with `assets/noise-512.png` |
| 4 | Render by beat and join; re-render only beats that changed | A one-beat change re-renders about an eighth | 8 beats; also the documented answer to `angle` memory leaks |
| 5 | Upgrade to 4.0.534 or later, then switch clip playback to `<Video>` from `@remotion/media` | Unquantified by Remotion | No per-frame image encode and decode; faster video path for 40% of the runtime. 77 patch releases to cross: run the 75-baseline visual test |
| 6 | Benchmark concurrency (7 now, up to 14) | Small to moderate | `npx remotion benchmark` |
| 7 | JPEG frames for previews on the CLI path | 20–30% there, by our own config comment | Moot after the upgrade |
| 8 | VideoToolbox encoding for previews | Small | At 4–7 frames a second the encoder is not the limit |
| 9 | Lambda | 5–15 minutes and $1–4 per render, after setup | No GPU, quota risk, dormant scripts; revisit once local frames are cheap |

## D. Captions

### D1. Standards

- **Netflix (English).** 42 characters per line, two lines at most, up to 20 characters per second for adult programmes. Break lines after punctuation and before conjunctions and prepositions; do not split an article or adjective from its noun, a first name from a last name, or a verb from its subject pronoun or auxiliary. [English Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide) (change log to 2025-12-19)
- **Netflix timing.** Start on the first frame of audio ("within 1-2 frames … is acceptable"); end ideally at least half a second after the audio ends; at least 2 frames between captions; gaps of 3–11 frames (at 24fps) closed to 2; none shorter than 20 frames; none longer than 7 seconds. [Subtitle timing guidelines](https://partnerhelp.netflixstudios.com/hc/en-us/articles/360051554394-Timed-Text-Style-Guide-Subtitle-Timing-Guidelines) (2025-07-04), [General requirements](https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements) (change log to 2022-10-07 **[old]**)
- **BBC.** 160–180 words a minute, about 0.3 seconds per word on screen, two lines (three if nothing important is covered), line length up to 68% of a 16:9 frame online, breaks at natural linguistic points. These are from a secondary summary; the BBC page could not be fetched. [Clevercast summary](https://clevercast.com/bbc-subtitling-guidelines) (Sept 2023 **[old]**)
- **For us.** Narration at about 150 words a minute is roughly 15 characters a second, under both limits, so captions can be verbatim.

### D2. From word times to caption lines

1. Use the script's text (its punctuation, capitals and numerals) with times from the alignment, not the transcriber's text.
2. Cut cues at sentence ends first, then at clause punctuation, then before a conjunction or preposition, then at a pause in the word times. Keep each cue to 84 characters and 7 seconds.
3. If a cue is over 42 characters, break it into two lines at the allowed break nearest the middle.
4. Start at the first word's start, snapped to a frame. End at the last word's end plus up to half a second, stopping 2 frames before the next cue. Enforce the minimum length, then check characters per second.

### D3. SRT or VTT, and what YouTube does with the file

- **Format.** YouTube suggests SubRip (`.srt`) or SubViewer for people new to captions because they "only require basic timing info"; for SRT, "No style info (markup) is recognized." WebVTT is "In initial implementation": positioning works, styling is limited to bold, italic and underline. We need no styling, so SRT; VTT only if captions ever have to be moved off a lower third. [Supported files](https://support.google.com/youtube/answer/2734698?hl=en) (read Oct 10, 2026)
- **An uploaded file with timing** is shown with our time codes. A transcript uploaded without timing is synced by YouTube (not recommended over an hour or with poor audio). The API's `sync` option was deprecated on March 13, 2024; Studio still offers it. [Add subtitles](https://support.google.com/youtube/answer/2734796?hl=en), [Captions API](https://developers.google.com/youtube/v3/docs/captions)
- **Automatic captions** are machine-generated, "the quality of the captions may vary", are published automatically when available, exist only in the video's default language, and may be missing after a long silence at the start. YouTube: "We encourage creators to add professional captions first." [Automatic captions](https://support.google.com/youtube/answer/6373554?hl=en)
- **The two tracks coexist.** An uploaded track does not delete the automatic one; the automatic track can be unpublished, and editing it makes a copy that can overwrite the uploaded file. [3Play Media](https://www.3playmedia.com/blog/remove-automatic-captions-youtube-videos/) (Nov 2021 **[old]**, vendor)

### D4. Do uploaded captions help discovery?

**The evidence is weak.** The figure everyone cites is one vendor case study from about 2013–14: Discovery Digital Networks captioned 125 of 334 videos with 3Play Media's service and reported 7.32% more views overall, 13.48% in the first 14 days, and no effect on shares or other engagement. Its search evidence is a single query for a phrase found only in the transcript. No significance test, no description of how videos were assigned, no independent repeat found. [Case study](https://www.3playmedia.com/why-3play/case-studies/discovery-digital-networks/) **[old]**. YouTube's own help pages speak of reaching "a larger audience", including deaf and hard-of-hearing viewers, and say nothing about ranking. Upload captions for accuracy on names and terms (Glaucon, Kant, "defeat device"), for viewers watching without sound, and as the base for translation. Do not plan on a ranking lift.

### D5. Remotion helpers

`@remotion/captions` (since 4.0.216; not installed in this repo) has `createTikTokStyleCaptions()`, which groups words into pages by time only, and `serializeSrt({lines})`, which writes one cue per inner array of words. Neither applies line-break rules. For a sidecar file a small Python writer beside the re-time tool is simpler; the Remotion helpers are for captions burned into the picture, which is a Shorts question. [serializeSrt](https://www.remotion.dev/docs/captions/serialize-srt), [createTikTokStyleCaptions](https://www.remotion.dev/docs/captions/create-tiktok-style-captions)

## Not verified

- Nothing was installed or run from section B. "Installs on 3.14" rests on published wheels. Not checked: whether WhisperX's pinned `torchcodec` works with Homebrew FFmpeg 8.1.1, whether its default voice-activity model needs a Hugging Face login, whether `large-v3-turbo` is accepted as a model name (if not, `large-v3`), and how long ten minutes of audio takes on this CPU.
- That faster-whisper, mlx-whisper and whisper.cpp match the accuracy measured for OpenAI's Whisper word times. The published figures are for word ends; reveals use word starts, which may be better.
- The Qwen3 aligner's accuracy outside its vendor's report, and its 80ms time step (secondary source).
- Every render gain in C4. In particular, that `preview-range.mjs` rendered without the GPU (inferred from the docs and the missing option, not observed), and how much the grain layer costs. Remotion's docs do not discuss SVG filters, blend modes or backdrop filters; the only source found on Chromium's handling of SVG filters is a design note from about 2013.
- The Lambda cost and time for our composition (an estimate from local timings), and whether Remotion Lambda bills at the Arm rate.
- The BBC numbers against the BBC's own page, including its rule on gaps (secondary sources disagree: 1 second or 1.5 seconds).
- Which caption track YouTube's player selects by default when an uploaded and an automatic track both exist, and whether YouTube uses either track in ranking. No official statement was found.
- Where Motion Canvas stores event times, and Adobe's own marker documentation (403).

## What this changes for us

| | Recommended approach | First concrete step | Rough size |
|---|---|---|---|
| **A. Voice sync** | Cues are positions in the script, timed by one script-to-recording alignment; `syncPoints` stays positional and complete; `durationSec` is set to the slot at dispatch; typed seconds scale as a fallback; hand overrides win | Fix the three bugs in A1: remove the "contains" fallback and normalise numerals in `_find_sync_word`, read `probability`, stop `FullEpisode.tsx` dropping unresolved entries. Then give the two existing cues and the `atSec` rows in `three-checks.json` and `shop-motif-reasons.json` real cues | Half a day for the fixes; 2–3 days for script-position cues, estimate-mode cues and dispatch-time scaling; then per template as episodes need it |
| **B. Word timing** | WhisperX 3.8.6 in a Python 3.13 environment; faster-whisper 1.2.1 on 3.14 as fallback | Run the four WhisperX commands in B3 on a scratch read of one beat and pass the JSON to `retime_manifest.py --words` | 1–2 hours including the model download; half a day more for a known-text alignment script |
| **C. Render speed** | Measure, then fix the local path before considering the cloud | In `preview-range.mjs`: log `slowestFrames`, pass `chromiumOptions.gl: "angle"`, `colorSpace: "bt709"`, `pixelFormat: "yuv420p"`, and add a `--scale` flag; time one clip segment and one diagram segment before and after | Half a day for measuring and script options; half a day for grain plates; up to a day for the upgrade with visual tests; a day for per-beat rendering |
| **D. Captions** | SRT from the script text and the aligned word times, cut by the rules in D2 (42 characters, 2 lines, 20 characters a second, 2-frame gaps); upload it and unpublish the automatic track if it is worse | Write `tools/captions/make_srt.py` reading the manifest's `narration.words` after a re-time, with a check that prints any cue over the limits | Half a day, plus a ten-minute read-through per episode |

The shortest path to a finished `ai-care-motives`: B first (everything else depends on word times), the half-day of fixes in A, the script options in C, then D once the take is final.
