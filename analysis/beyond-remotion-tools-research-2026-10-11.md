# Beyond Remotion: which outside tools earn a place, and how an episode gets finished

> October 11, 2026. Research by a sub-agent in two parts. The repo: files read, none changed, plus two read-only local checks (which editors are in `/Applications`, which audio filters the installed `ffmpeg` has). The web: text sources only (official docs, licence pages, release notes, package registries, GitHub metadata), all read today unless a date is given; nothing installed, no accounts, no audio or video played. *(excerpt)* marks a source seen only as a search excerpt; *(3P)* a third-party page not confirmed against the maker's own; **[old]** a source from before 2025. Learning and per-shot times are my estimates, not measurements. This note builds on and does not repeat `analysis/visual-tools-research-2026-09-22.md` (13 animation libraries, each with a trial), `project/3D_RECREATION_FINDINGS.md`, `reports/AI stills beyond Ken Burns.md`, and this week's notes on sound, encoding and voice sync.

## Bottom line

- **The largest gains outside Remotion are in sound and finishing, not in another animation tool.** The picture pipeline has 90-odd templates and a seam engine; the sound pipeline has a cue sheet, complete code, and no audio file of any kind.
- **Finish in code.** Remotion already carries narration, music and effects in one render. What is missing is a master script, a loudness step and a way to listen. An editing program is worth keeping only as an optional mixing desk for audio, fed by a small timeline export; the cut should never live there.
- **One animation tool is worth an evening: Manim**, for the rare shot where a mathematical object has to move. Everything else on the list either duplicates what our code does, cannot be rendered from a command line, or is a craft that takes weeks.
- **Three things changed this year that matter here:** DaVinci Resolve's free edition lost Python scripting in 21.1 (September 2026); GSAP became free including its former paid plugins (April 2025), though Remotion's adapter does not load plugins yet; Cavalry became free (April 2026) and at the same time lost its command-line renderer.

## 1. The repo as it stands

1. **A Remotion render is built to carry the whole soundtrack.** `FullEpisode.tsx` plays the narration file with `<Audio>` (lines 1390–1397) and hands music cues, transition sounds and texture hits to `AudioLayer.tsx`, which fades each music cue and adjusts its level by segment type. No editor is needed for the code to work.
2. **The documents still assume an editor.** `PRODUCTION_PIPELINE.md` Stage 9 keeps DaVinci Resolve "for final polish: audio mastering, color grading tweaks" and reserves a path for `master.drp`; `AUDIO_DESIGN.md` calls the cue sheet a document "consumed during NLE assembly"; the manifest's `narrationLeadIn` is typed as "NLE metadata" and nothing in the render reads it.
3. **Nothing exports the manifest to an editor.** No OpenTimelineIO, FCPXML or EDL code exists anywhere in the repo; `take_selector.py` says outright that it writes no EDL. The only mention of OTIO is a note on Remotion's own export skill in `research_notes/`.
4. **The sound path has never run.** `ai-care-motives` has no narration (`narration.words` is empty, mode `estimate`), no music files, and an empty `public/assets/audio/sfx/`. `preview-range.mjs` and `render-upload-test.mjs` render muted. There is still no master script for a manifest episode; `render-episode.mjs` is the old per-clip sequence.
5. **Narration tooling is ahead of everything else.** `tools/narration/` already has a loudness and true-peak check (`audio_qa.py`), a local ffmpeg mastering chain with two-pass loudness (`local_master.py`), an Auphonic client (`auphonic_submit.py`), script-to-recording diffing, pickup and splice plans written as Audacity label tracks, and take ranking. `tools/publish/` covers the description, chapters, Shorts proposals and a pre-publish gate. None of it touches the mix.
6. **Of the programs I looked for, this Mac has only GarageBand** (no Resolve, Final Cut, Premiere, Reaper, Audacity or Blender in `/Applications`). The installed ffmpeg 8.1.1 has `loudnorm`, `ebur128`, `afftdn`, `arnndn`, `anlmdn`, `deesser`, `adeclick`, `speechnorm`, `alimiter` and `sidechaincompress`. OpenTimelineIO, Manim and a transcriber were not found on the default Python or the PATH.

**Found while checking**

- **The music would rise under narrated stills.** `AudioLayer` multiplies a cue's level by 1.65 (about +4 dB) during FOOTAGE segments on the assumption that the narrator is silent there. In `ai-care-motives` all 25 FOOTAGE segments (278 s) carry narration. Read from code, not heard.
- **The six sounds the thinned cue sheet needs already exist.** `tools/generate_sfx.py` synthesised 22 transition and 7 texture WAV files into `public/audio/sfx/`, a folder `AudioLayer` calls retired. The player looks for `public/assets/audio/sfx/<type>-<intensity>.mp3`. `section-open-dramatic`, `tension-rise-normal`, `stat-reveal-dramatic`, `end-stinger`, `card-settle` and `page-turn` are all there under the old names. They are ours, so they carry no licence at all.
- **Two narration tools disagree on the target.** `audio_qa.py` checks the narration file against −14 LUFS; `take_comparator.py` scores takes against −16. −14 belongs to the finished mix (see `sound-under-narration-research-2026-10-10.md` § 7), not to the voice alone.
- **A clip in a FOOTAGE slot plays from frame 0 at native speed with no alpha.** `FullEpisode` passes no `transparent`, trim or `playbackRate` to `<OffthreadVideo>`. Any clip made in an outside tool has to be rendered to the slot's exact length, and opaque unless one flag is added.

## 2. Other animation tools

Judged for flat editorial graphics and argument diagrams. The September note already profiled most of these; this table adds what each would give us that is hard today, whether it renders without a person clicking, and where it stands this month.

| Tool | The shot it adds | Scripted and rendered from a command line | Joins our timeline as | Learning / per shot (est.) | State, October 2026 | Verdict |
|---|---|---|---|---|---|---|
| **Manim CE** | A mathematical object transforming continuously: a curve or surface deforming, a distribution shifting, matched terms of an equation travelling | Yes. Python scenes; `manim render` takes `-r W,H`, `--fps`, `--format mov\|webm\|png-sequence` and `-t` for an alpha channel ([configuration](https://docs.manim.community/en/stable/guides/configuration.html)) | A clip in a FOOTAGE slot | One evening to a first clip for a Python user; 1–2 h a shot | 0.22.0 released Oct 8, 2026, Python ≥ 3.11 ([PyPI](https://pypi.org/project/manim/)) | **Try when a script needs it** |
| **Motion Canvas** | Sequential vector choreography with cues dragged against the voice | Scenes are TypeScript; rendering is a button in its editor that writes an image sequence, with no command line in the docs ([rendering](https://motioncanvas.io/docs/rendering/)). The Revideo fork adds a headless `renderVideo()` *(excerpt)* | An image sequence encoded to a clip | Days: a second scene system | Last stable 3.17.2 on Dec 14, 2024, one alpha since ([releases](https://github.com/motion-canvas/motion-canvas/releases)); repo last pushed Jul 2, 2026 | Ignore |
| **Theatre.js** | Hand-shaped curves and camera paths from a keyframe editor | It edits values; it has no renderer | A runtime inside React; no Remotion adapter found | Days | Public repo last pushed Aug 14, 2024; its README says development moved to a private repo and 1.0 is near ([repo](https://github.com/theatre-js/theatre)) | Ignore |
| **GSAP** | Timelines with labels, overlaps and staggers; shape morphing, stroke draw-on, per-letter type through its plugins | Yes, rendered by Remotion | A runtime inside Remotion, `@remotion/gsap` from 4.0.517 ([docs](https://www.remotion.dev/docs/gsap)); we are on 4.0.457 | 1–2 days | Free for commercial use including the former paid plugins since Apr 30, 2025 ([licence](https://gsap.com/community/standard-license/)). Remotion's adapter "does not support GSAP plugins yet" ([docs](https://www.remotion.dev/docs/gsap/use-gsap-timeline)) | Not now |
| **Rive** | A reusable rigged figure or object: bones, meshes, a state machine | No. The editor is a visual tool; video export runs on Rive's cloud renderer ([export](https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design)) | A runtime inside Remotion (`@remotion/rive`) or an exported clip | Days to rig; minutes per gesture after | Any export needs a paid plan: Cadet $17 a month or $108 a year ([pricing](https://rive.app/docs/account-admin/pricing)) | Ignore for now |
| **Lottie from After Effects** | Designer-made vector animation as a data file | Playback yes; authoring is After Effects | A runtime inside Remotion (`@remotion/lottie`) | Weeks; After Effects is a craft | After Effects about $23 a month on an annual plan *(3P)* | Ignore |
| **Cavalry** | Procedural 2D motion: duplicators, behaviours, layouts driven by data | JavaScript inside the app. The command-line tool "is not currently available in Cavalry 2.7 or above", and needed an Enterprise licence before that ([CLI](https://cavalry.studio/docs/applications/cavalry-cli/)) | A clip (its QuickTime codec list includes 4444) or a Lottie file | Days; about an hour a shot | Free for individuals, commercial work included, since Apr 16, 2026 after Canva bought it; 2.7 needs a Canva login ([CG Channel, Apr 17, 2026](https://www.cgchannel.com/2026/04/canva-makes-motion-graphics-and-animation-app-cavalry-free/)) | Ignore |
| **Blender** | A real camera through layered art; drawn animation in Grease Pencil; procedural structures from geometry nodes | Yes, fully: Python and background rendering | A clip from an image sequence with alpha | Weeks; hours a shot | 5.2 LTS on Jul 14, 2026, with new Grease Pencil fills and materials ([release](https://www.blender.org/download/releases/5-2/)) | Ignore |
| **TouchDesigner and other node or shader tools** | Generative fields, feedback, print-like textures | Node graph with Python. The free licence is capped at 1280×1280 and barred from paid work; Commercial is $600 *(excerpt of [Derivative's docs](https://docs.derivative.ca/TouchDesigner_Products), undated)* | A clip; or a fragment shader in the `ThreeCanvas` we already have | Weeks | — | Ignore |

**What the people who use them say**

- **Manim is for clips, not for the film.** Its author: "This is just a tool for making individual clips to be edited together later", "You should certainly use traditional video-editing software for as much as you can", and he worries when people ask how to sync narration inside it. He also points out that Blender and After Effects "can be made programmatic too". ([3Blue1Brown FAQ](https://www.3blue1brown.com/faq))
- **Motion Canvas says the same of itself:** a tool to "synchronize them with voice-overs" that is "not meant to be a replacement for traditional video editing software". ([docs](https://motioncanvas.io/docs/))
- **Kurzgesagt and Vox work in After Effects** with teams (cited in this week's sound and transitions notes). I found no first-hand account of anyone making narrated essays with Rive, Cavalry, Theatre.js or a node tool.

**Why Manim and nothing else**

- It is the only tool here whose shot is hard for us today, that renders from a command, and that fits skills already in the house (Python, mathematics). Our math register is KaTeX: it writes and steps equations but cannot deform a curve or a surface.
- The cost of the others is not the licence. Each adds a second place where timing lives. Our re-time tool moves a manifest; it cannot move a Cavalry scene or a Rive file, so every narration change means re-rendering those clips by hand.
- Rive is the only one that answers a gap we have admitted (figures that act). It still loses for now: export is paid, there is no command-line render, a rig takes days, and the one cut-out motion test we ran was rejected (`illustrated-cutout-motion-2026-09-23.md`).
- GSAP's best parts are the plugins, and those are exactly what the Remotion adapter leaves out. `@remotion/paths`, already installed, covers draw-on and path interpolation.

## 3. Finishing

### 3.1 What makers use

Evidence is thin and mostly about teams.

- **Vox (2020 [old]):** "We do everything in the Adobe Creative Suite"; Premiere is "our main edit—that's where we do our music and audio mix"; After Effects for all motion graphics; library music from APM. ([The Open Notebook](https://www.theopennotebook.com/2020/01/07/videogram-how-a-vox-video-explains-the-science-behind-the-first-photo-of-a-black-hole/))
- **3Blue1Brown:** clips from code, joined in an ordinary editor he does not name. ([FAQ](https://www.3blue1brown.com/faq))
- **Finishing in code is where the code-video tools are heading.** Remotion's Recorder covers captions, background music with automatic fades and export from a command, and says nothing about loudness ([docs](https://www.remotion.dev/docs/recorder)). HyperFrames, HeyGen's HTML-to-video framework, ships an audio skill for "voiceover ducking" and submix buses ([repo](https://github.com/heygen-com/hyperframes)).
- **Not found:** a first-hand account of a solo essay maker finishing a narrated film entirely in code, or of one naming Resolve. The claim that Resolve is the default for mid-sized channels comes from vendor blogs *(3P)*.

### 3.2 Editing programs

| | Price | Reads a timeline from | Scripting | For us |
|---|---|---|---|---|
| **DaVinci Resolve 21, free** | $0 | `.otio` from 18.5 (§ 3.3), also AAF, EDL, XML *(excerpt)* | Moved out in 21.1: "We have moved the ability to script in Python to the Studio version", because the API was "being used to hack studio features into the free version" ([readme, updated Sept 8, 2026](https://www.blackmagicdesign.com/support/content/readme/59dd4eef1f4941c29fb8dc48b33f5c87)). Puget reads this as scripting removed entirely ([Sept 10, 2026](https://www.pugetsystems.com/blog/2026/09/10/how-davinci-resolve-free-v21-1-scripting-changes-affect-puget-bench/)); Digital Production says the in-app console still works ([Sept 8, 2026](https://digitalproduction.com/2026/09/08/resolve-21-1-adds-mcp-and-finally-gets-presets/)) | A capable mixing desk (Fairlight, loudness meters, 25-plus audio effects). UHD at 60 fps and 8-bit at most; grain (Film Look Creator), noise reduction and voice isolation are Studio only ([comparison](https://www.blackmagicdesign.com/products/davinciresolve/studio)) |
| **Resolve Studio 21** | $295 once | same | Python and Lua, remote API, and from 21.1 a built-in MCP server that Claude Code can drive (Digital Production, above) | Only if the cut lived in Resolve, which it should not |
| **Final Cut Pro** | $299.99 once, or Apple Creator Studio at $12.99 a month from Jan 28, 2026 ([Apple, Jan 13, 2026](https://www.apple.com/newsroom/2026/01/introducing-apple-creator-studio-an-inspiring-collection-of-creative-apps/)) | FCPXML | — | OTIO's standard plugin set has no Final Cut X adapter ([PyPI](https://pypi.org/project/OpenTimelineIO-Plugins/)), so we would write FCPXML ourselves |
| **Premiere** | Subscription, not priced here | `.otio` from 25.6 ([Remotion docs](https://www.remotion.dev/docs/export-opentimeline)) | — | No advantage over Resolve for an audio-only job |
| **Reaper 7.82** | $60 for personal use or revenue under $20,000, $225 otherwise; 60 days' full evaluation ([purchase page](https://www.reaper.fm/purchase.php)) | — | Its own scripting | An audio program, which is all we need from an editor. Loudness-normalised rendering since 6.30, "except video" *(excerpt)* |
| **GarageBand** | Installed | — | — | Enough to record and splice |

### 3.3 Timeline interchange

- **OpenTimelineIO** is a documented JSON timeline: tracks, clips, source ranges, markers, transitions. Current release 0.18.1; the plugins package (Nov 9, 2025) bundles adapters for AAF, CMX 3600 EDL and Final Cut 7 XML ([PyPI](https://pypi.org/project/OpenTimelineIO-Plugins/)). Resolve 18.5 and later and Premiere 25.6 and later import `.otio` directly ([Remotion docs](https://www.remotion.dev/docs/export-opentimeline)).
- **It carries structure, not looks.** "OTIO does not standardize the result of generic effects", so gain, retiming and transforms cannot be trusted across programs (same page).
- **Remotion's own export is an agent skill, not an exporter:** "It is not possible to deterministically export a Remotion project to the OpenTimelineIO format." The `remotion-opentimeline` skill has an agent rebuild the timeline and pre-render what OTIO cannot express: opaque stretches as ProRes 422 Light, overlays as ProRes 4444, audio as WAV stems. The docs warn that "the output directory may be large". (same page; the project's own notes date the skill to 4.0.525, after our pin)
- **EDL** holds a single video track, with reel names of eight characters by default and no effects ([adapter](https://github.com/OpenTimelineIO/otio-cmx3600-adapter)). Too small to be worth writing.
- **Our case is easier than Remotion's general one.** The manifest already is a timeline of absolute times, and a finished picture needs one clip on one track. A deterministic exporter is small: picture on V1, narration on A1, each music cue as a clip on A2, effects on A3, a marker per beat and per segment id.
- **One known rough edge:** users report clips arriving unlinked when an `.otio` written by one program is opened in another, in one case traced to a `file://` prefix on paths ([Adobe beta forum](https://community.adobe.com/t5/premiere-pro-beta-discussions/now-in-beta-otio-import-and-export/m-p/15486920/highlight/true), excerpt). Test the import before relying on it.

### 3.4 Grain and colour belong in the render

- **Grain is dither here, and the render knows what it is dithering.** The encoding note found our grain cannot survive YouTube at 1080p and should be kept as one layer whose job is to stop banding. Which surface gets it (paper cards, stills, dimmed pictures) is known in the render and lost in a flattened file.
- **Resolve's grain is a Studio effect** (comparison page above). Adding grain or a look in any finishing step also means a second encode of the picture.
- **For flat graphics, colour work is colour management:** BT.709 tags on a ProRes master, checked with `ffprobe`. That is already specified in `youtube-encoding-research-2026-10-10.md`. The brand LUTs exist as `.cube` files for the rare clip that needs one.

### 3.5 Loudness mastering

| Tool | What it does | Limits |
|---|---|---|
| **ffmpeg `loudnorm`** (installed) | Two-pass normalisation to a loudness target with a true-peak ceiling. Local defaults read today: I −24, LRA 7, TP −2, `linear` on | Stays a plain gain change only if the target range is at least the source's and the peaks allow it; otherwise it switches to dynamic processing without saying so. Read `normalization_type` after pass 1. Dynamic mode outputs 192 kHz, so set the rate back to 48 kHz ([guide](https://dev.to/javidjamae/ffmpeg-loudnorm-filter-ebu-r128-loudness-normalization-guide-15d4), excerpt; [ffmpeg-user, Mar 2022](https://ffmpeg.org/pipermail/ffmpeg-user/2022-March/054425.html) **[old]**) |
| **`ffmpeg-normalize` 1.42.1** | A wrapper that runs the two passes; presets include `podcast` and `streaming-video` ([PyPI](https://pypi.org/project/ffmpeg-normalize/)) | Python ≥ 3.10; not installed; `local_master.py` already does the two passes |
| **Youlean Loudness Meter 2** | Free meter with integrated loudness, true peak and range, as an app or plug-in ([product page](https://youlean.co/youlean-loudness-meter/)) | Dropping a file in and the YouTube preset are in the paid version ($39–49 once) |
| **Auphonic** | Loudness target plus a true-peak limiter with 4× oversampling ([algorithms](https://auphonic.com/help/algorithms/singletrack.html)) | A cloud service; suited to the voice, not the mix |
| **Resolve Fairlight** | Loudness meters with a choice of standard; per-clip level analysis ([Fairlight page](https://www.blackmagicdesign.com/products/davinciresolve/fairlight)) | Loudness normalisation on export in the free edition: not confirmed |

## 4. Voice and sound

AI voice and AI music are ruled out (decision log; `ai-imagery-trust-research-2026-10-10.md`). That rule reaches further than it looks: several "enhancers" below rebuild the voice with a generative model.

### 4.1 Cleaning and levelling a home recording

| Tool | Good at | Bad at, or risk | Cost |
|---|---|---|---|
| **The room and the distance to the microphone** | Everything downstream. Auphonic's own advice for reverberant recordings is to keep the microphone close | — | — |
| **`local_master.py` (ffmpeg, in the repo)** | High-pass, gentle compression, two-pass loudness; offline and repeatable | No noise, reverb, click or sibilance treatment in its presets. Its "aggressive" preset adds a gate, which hides noise between words and leaves it under them | $0 |
| **Auphonic** | Levelling built for speech (it leaves breaths and noise out of the gain); a Static Denoiser for "reverb and stationary" noise with amount controls; voice equalisation with plosive reduction; an API our client already speaks ([algorithms](https://auphonic.com/help/algorithms/singletrack.html)) | Raw voice goes to a server. The free 2 hours a month now add an Auphonic jingle, so free is for tests ([pricing](https://auphonic.com/pricing)). Its Dynamic Denoiser removes "everything but voice and music" and Speech Isolation keeps speech alone, more than a quiet room needs. "Studio Voice (Beta)" reconstructs the voice: avoid | Free to test; paid credits, prices not shown on the page |
| **Adobe Podcast Enhance Speech** | Rescuing a recording from a bad room | It regenerates the speech. Reviewers and Adobe's forum describe "slightly robotic" voices and invented texture in silences ([review](https://gauravtiwari.org/adobe-podcast-review/), 3P). Free tier: 30 minutes and 500 MB a file, an hour a day *(3P)* | Free; Premium about $10 a month *(3P)* |
| **iZotope RX 12** (Apr 29, 2026) | Surgical repair of single faults: clicks, clipping, hum, one bump; a Repair Assistant; a rebuilt Dialogue Isolate ([ProSoundWeb](https://www.prosoundweb.com/izotope-unveils-new-rx-12-editing-restoration-suite/)) | Hand work per fault | Elements $99, Standard $399 |
| **Resolve** | Noise reduction and de-esser effects in the base app; a Dialogue Leveler in the free edition *(3P)* | Voice Isolation is Studio only | $0 / $295 |
| **Audacity 4.0.1** (Sept 30, 2026) | Free recording and splicing; our pickup tools write Audacity label tracks | 4.0 ships without the Macro Manager and the scripting pipe ([changelog](https://www.audacityteam.org/changelog/)); sources disagree on whether label tracks made it in | $0 |
| **DeepFilterNet** | An open-source speech denoiser with a command-line binary | Repo last pushed Oct 17, 2024 ([GitHub](https://github.com/Rikorose/DeepFilterNet)); not assessed | $0 |

**Order of work (my recommendation, no source):** splice takes and pickups on the raw recording; clean lightly; level the voice to a range of about 6 LU; leave it at one working loudness; align; mix; normalise the finished mix once.

### 4.2 Music and effects libraries for a monetised channel

| Source | If the subscription lapses | Copyright claims | AI | Checked against |
|---|---|---|---|---|
| **YouTube Audio Library** | No subscription | "Music and sound effects from the YouTube Audio Library are copyright-safe"; downloads should not be claimed. Creative Commons tracks need a credit in the description; standard-licence tracks do not | — | [YouTube Help](https://support.google.com/youtube/answer/3376882?hl=en) |
| **Epidemic Sound** | "Any content published during a free trial or active subscription remains cleared forever, even if you cancel." "Any content soundtracked after the subscription period won't be cleared" | Connect the channel to the account. Creator plan: one channel per platform, $17.99 a month or $9.99 billed yearly, stems included *(3P, Sept 2026)* | Catalogue described as human-made. "Adapt" (Sept 2025) is AI-assisted adaptation of those tracks. The company plans, "over time, fully generated audio" ([press release, Apr 21, 2026](https://corporate.epidemicsound.com/press-and-media/press-releases/2026/epidemic-sound-expands-beyond-music-catalog-as-it-builds-the-next-generation-creative-platform/)) | [Monetisation page](https://www.epidemicsound.com/how-it-works/how-to-monetize-your-content); help article returned 403 |
| **Artlist** | Published projects may stay up and be monetised "forever"; "any new projects will not be covered"; projects must be published "during an active subscription" | Clearlist: add the channel or each video while subscribed; nothing can be added after expiry *(excerpt; help pages returned 403)* | Assets may not be used to train AI. Artlist also sells AI generation beside the catalogue *(3P)* | [Licence page](https://help-center.artlist.io/privacy-terms/artlist-license): Social effective Jan 4, 2026, Pro effective Feb 15, 2026 |
| **Uppbeat** | Videos on a safelisted channel published while subscribed are "permanently cleared … even if your subscription ends" *(excerpt)* | Safelisting is for paid plans; free downloads need a credit *(excerpt)* | — | Not opened (rate-limited). Subscriptions begun on or after Sept 2, 2026 fall under new terms I could not read ([legacy licence](https://uppbeat.io/uppbeat-legacy-license), excerpt) |
| **Pixabay** | None | Free, no credit needed, but the summary warns that some content carries additional rights the user must check. Claims on Pixabay tracks, sometimes arriving after publication, are reported second-hand *(3P)* | Open uploads | [Licence summary](https://pixabay.com/service/license-summary/) |
| **Freesound** (effects) | None | CC0 and CC BY sounds can be used in monetised video (BY needs a credit); CC BY-NC cannot. Claims happen; processed sounds match less often | — | [FAQ](https://freesound.org/help/faq/) |
| **Our own synthesised effects** | — | None possible | — | Repo (§ 1) |

- **How YouTube handles a claim:** dispute it and the claimant has 30 days to answer; appeal a rejected dispute and they have 7; monetisation settings come back once every claim on the video is released. ([YouTube Help](https://support.google.com/youtube/answer/2797454?hl=en))
- **A trap for us (inference):** a Short cut from the episode and uploaded after a subscription lapses is new content "soundtracked after the subscription period". Publish Shorts inside the paid month, cut them without the music, or use Audio Library tracks.

## 5. What changed in 2025–2026 for a code-first solo creator

- **Resolve free can no longer be driven from Python** (21.1, September 2026), and Resolve Studio gained an MCP server in the same release. The free edition is now a manual tool.
- **Remotion can hand a project to an editor** through its OpenTimelineIO skill, and added a GSAP adapter (4.0.517), a LUT effect and faster capture (per `reports/Remotion polish and AI tooling.md`). All are past our pin of 4.0.457. The licence is unchanged in what matters to us: free for individuals ([pricing](https://www.remotion.dev/docs/license/pricing), excerpt).
- **GSAP is free, plugins included** (April 30, 2025). The licence's main bar is on tools that compete with Webflow's visual animation builder, which a rendered video is not.
- **Canva made Affinity free** (late October 2025, [CG Channel](https://www.cgchannel.com/?p=171450), excerpt) **and Cavalry free** (April 16, 2026). Both now need a Canva login; Cavalry's command-line tool is gone from 2.7.
- **Rive moved all exports to paid plans** (announced October 2025, [Rive blog](https://rive.app/blog/rive-s-new-9-mo-plan), excerpt).
- **HyperFrames** (HeyGen, Apache 2.0, created March 10, 2026, about 60,800 stars) renders plain HTML to video with headless Chrome and FFmpeg. It is a rival to Remotion built for coding agents, not an addition to it.
- **Stalled or wound down:** Motion Canvas has had no stable release since December 2024; Theatre.js's public repo has been still since August 2024; Adobe Animate was to be withdrawn on March 1, 2026 and was instead put into maintenance with no new features ([TechCrunch, Feb 4, 2026](https://techcrunch.com/2026/02/04/after-backlash-adobe-cancels-adobe-animate-shutdown-and-puts-app-on-maintenance-mode), excerpt).
- **New versions that do not change the decision:** Manim 0.22 (October 8), Blender 5.2 LTS (July 14), iZotope RX 12 (April 29), Audacity 4.0 (September 3), Apple Creator Studio (January 28), Reaper 7.82 (October 4).
- **Music libraries are adding AI.** Epidemic Sound launched AI adaptation (September 2025) and an AI soundtracking tool (November 2025) *(excerpts of its press releases)* and in April 2026 announced generated audio for later. Our rule against AI music now needs a check per track, not per library.

## 6. Not verified

- Anything by ear or eye: no tool here was installed, run or listened to. Every learning time, per-shot time and build estimate is mine.
- Whether Resolve free 21.1 keeps its in-app scripting console (two reports disagree), whether it normalises loudness on export, and whether it exports 10-bit ProRes on a Mac.
- How Resolve treats an `.otio` we write: audio track mapping, markers, relinking. No support matrix was found; the manual page I tried returned 404.
- Which codec Manim uses for a transparent `.mov` (the docs say only "Render scenes with alpha channel"; the source I read sets a pixel format for WebM alone), and whether IBM Plex renders correctly through its text engine.
- Whether a Remotion audio-only render skips drawing frames, and so how fast stems would be.
- Prices marked *(3P)*: Epidemic Sound, After Effects, Adobe Podcast. Epidemic's and Auphonic's pricing pages showed no figures to the fetch tool. Artlist and Premiere prices were not looked up. TouchDesigner's figures come from an undated page.
- Epidemic Sound's cancellation article and Artlist's Clearlist articles (403), Uppbeat's help centre and pricing (429), Uppbeat's terms for subscriptions from September 2, 2026, and Pixabay's own statement on Content ID.
- Whether any library labels AI-made or AI-adapted tracks in its catalogue.
- Musicbed, Soundstripe, Storyblocks, Envato and Sonniss: not checked. CapCut, Kdenlive and Shotcut: not checked.
- Audacity 4's label tracks (the official changelog does not list them as missing; the download page and a forum post suggest they are), which our pickup and splice tools depend on.
- Rive's state-machine control from Remotion, and whether Cavalry 2.7 exposes Lottie export and scripting to free accounts (the licence page I could read covers 2.6.1 and earlier).
- The ducking finding in § 1 was read from code; no audio exists to hear it.
- The Every Frame a Painting postmortem (page truncated) and any tool list from LEMMiNO, Wendover or other solo essayists: none retrieved.

## 7. What this changes for us

### Three things worth adopting

| | 1. A clean-and-level step for the voice | 2. Music with a paper trail | 3. Manim, for the shot that needs it |
|---|---|---|---|
| **Problem or shot** | A home recording has to sound like the most credible thing in the film. The local chain levels but does not clean | Three music files are needed, none exists, the channel is monetised, and AI music is out | A curve, surface or distribution that changes shape while the narrator explains why: a loss curve with a wrong minimum, behaviour that differs between test and use. KaTeX and our charts cannot deform one |
| **Choice** | Auphonic's leveller, Static Denoiser at a low amount and voice equalisation, tested blind against `local_master.py`. No Dynamic Denoiser, Speech Isolation or Studio Voice. No Adobe Enhance | YouTube Audio Library first. If nothing there passes the cue sheet's tests, one paid month of Epidemic Sound for stems, with the channel connected and the episode and its Shorts published inside that month | Manim Community 0.22 in its own Python 3.13 environment, used for single clips and nothing else |
| **First experiment (one evening)** | Record 90 seconds in the real room at the real distance: the cold open and one quotation. Make three versions: raw with gain, `local_master.py --preset standard`, Auphonic. Match their loudness, listen blind on headphones and a phone, run `audio_qa.py` on each. Keep the one you cannot tell from clean | Audition tracks against the cue sheet (sustained texture, nothing at the voice's pitch, able to stop dead; at least 50, 70 and 80 seconds). Lay each candidate under the 90-second recording at 18 LU below the voice with ffmpeg and listen on a phone. Write the track, source, licence and date into the asset record | One 12-second scene: a ball settling into the wrong dip of a curve as the curve changes. Paper background `#F5F0E8`, labels left to Remotion, no LaTeX. `manim render -r 1920,1080 --fps 30 --format mov <file> <Scene>`. Put it in a FOOTAGE slot, preview it in context, then change its length and one cue and render again to learn what a re-time costs |
| **How it joins the manifest** | The winner becomes `episodes/<slug>/assets/narration.wav`, the file the transcriber and `retime_manifest.py` already read | Files go where `musicBed.tracks[].file` already points (`public/episodes/<slug>/audio/music/<slug>/bed-*.wav`); cue times stay in the manifest and move with the re-time | A FOOTAGE segment with `asset.file` set to the clip, opaque on paper (alpha needs one flag passed to `<OffthreadVideo>`). A small wrapper should read the slot length and cue offsets from the manifest so the clip is re-rendered, not re-timed by hand. Keep the scene file and the command beside the clip |
| **Money** | $0 to test. After that, Auphonic credits (price not seen) or nothing if the local chain wins | $0, or about $18 for the month *(3P)* | $0 |
| **Time** | 2–3 hours | 2–3 hours | One evening for the test; 1–2 hours a shot after; skip it for any shot `TimeSeriesChart` or `MathDerivation` can already do |

Installing Manim and creating an Auphonic key or an Epidemic account are Tiger's to do; this research did neither.

### Finishing path: in code, with an optional mixing desk

**Recommendation.** One picture master and one audio master, both from the manifest, joined by ffmpeg. No editing program in the required path.

Why this and not Resolve:
- The cut lives in a hand-wired manifest that the re-time tool can move. A Resolve project would be a second copy of the timing that nothing can move.
- After thinning, the episode has about twelve audio events: six music cues from three files, four transition sounds, two optional hits. The targets are numbers (−14 LUFS, −1 dBTP, music 16–20 LU under the voice) and ffmpeg measures all of them.
- Free Resolve can no longer be scripted, is not installed, and reserves grain and voice isolation for the paid edition. It would be the same hand work every episode.
- What code cannot do is listen. Remotion Studio already plays the mix while scrubbing; it has no meters. So the build below adds measurement, and keeps a way out to a real mixing desk.

What has to be built, in order:
1. **A master script** (`scripts/render-master.mjs`; none exists). Picture: ProRes 422 HQ, muted, with the colour and GPU options from the encoding note. Audio: three WAV stems (voice, music, effects) by rendering with an audio codec and a new `audioSolo` input prop; today the only switch is `noAudio`. About half a day.
2. **A mix-and-master tool** (`tools/assembly/mix_master.py`, reusing the measuring code in `audio_qa.py`). Measure each stem; report how far each music cue sits under the voice over its own passage; sum; run two-pass `loudnorm` to −14 LUFS with a true-peak ceiling of −1 dBTP (−2 for margin, as the cue sheet says), with the range target set at or above the measured range so it stays a plain gain change; resample to 48 kHz; join to the picture without re-encoding it; fail if any number is out of range. Half a day to a day.
3. **Ducking that follows the voice.** Drive the music level from gaps in `narration.words`, not from segment type, or switch ducking off for this episode and trust the cue sheet's levels. About two hours.
4. **The six existing sounds in the place the player looks:** `public/assets/audio/sfx/`, named `<type>-<intensity>.mp3` (and `end-stinger-normal`), or let `AudioLayer` read the WAV files. Half an hour.
5. **Sound in previews.** `preview-range.mjs` hard-codes `muted: true`; add a flag so one cue can be heard in context at half scale. An hour.
6. **One working loudness for the voice** in `audio_qa.py` and `take_comparator.py`, with −14 kept for the mix. Minutes.
7. **Decide what `narrationLeadIn` means in a render.** With one continuous narration file, an early voice is only a later picture cut. Either have `retime_manifest.py` place the cut that many seconds after the incoming segment's first word, or drop the field. Two to three hours if kept.
8. **Only if a mix cannot be settled by numbers and Studio: a timeline export** (`tools/assembly/export_otio.py`, about 150 lines on the OpenTimelineIO library). Finished picture on one video track, the voice, each music cue and each effect as clips on three audio tracks, markers at beats and segment ids. Open it by hand in Resolve free, mix in Fairlight, export a WAV only, and give that WAV to step 2 in place of the summed stems. The picture never passes through the editor's encoder. Half a day including an import test.

Steps 1–6 are about two to three days of work and cost nothing. `PRODUCTION_PIPELINE.md` Stage 9 and `AUDIO_DESIGN.md` would then need their editor paragraphs rewritten; neither was touched.

### What to ignore

- **Motion Canvas (and Revideo):** a second scene system that draws what ours draws, renders from a button, and has had no stable release in 22 months. Its one good idea, named cues, is already in the voice-sync plan.
- **Theatre.js:** the public project has not moved since August 2024.
- **GSAP, for now:** free at last, but Remotion's adapter cannot load the plugins that would justify it, and it needs the upgrade first. Revisit after the upgrade if re-timing choreography is what hurts.
- **Rive:** the only route to a reusable acting figure, but export is paid, there is no command-line render, a rig takes days, and our cut-out motion test was rejected. Revisit if a recurring character is ever decided on.
- **After Effects and Lottie:** a subscription and a craft of its own to produce what the templates already draw. Lottie playback stays available if a designer ever hands us a file.
- **Cavalry:** newly free and well regarded, and a poor fit: no command-line render in the current version, a Canva login, and procedural tricks we already write in code. Its clips would be re-rendered by hand after every re-time.
- **Blender, Grease Pencil, geometry nodes:** free and fully scriptable, but the shelved 3D finding stands. The limit was taste and weeks, not tooling.
- **TouchDesigner and node or shader tools:** texture is not our bottleneck, and the free licence cannot be used for a monetised channel. A single effect can be a shader inside the canvas we have.
- **HyperFrames:** worth knowing about, not worth moving 90 templates to.
- **An editor as the place the cut lives** (Resolve, Final Cut, Premiere): it duplicates the manifest, and the free one can no longer be automated.
- **Resolve Studio for its MCP server:** $295 to automate a timeline we already generate.
- **Grain or colour work in a finishing step:** it belongs in the render, and adding it later costs a second encode.
- **Adobe Podcast Enhance, Auphonic Studio Voice, speech-isolation modes:** they rebuild the voice. That is close to the thing the channel decided against, and the artefacts are documented.
- **iZotope RX:** buy Elements ($99) only if a specific fault survives the chain, such as mouth clicks.
- **Artlist, Uppbeat, Pixabay music:** Artlist adds per-video clearing with no gain for one channel; Uppbeat's terms changed on September 2 and I could not read them; Pixabay tracks can be claimed after the fact.
- **A paid effects library:** this episode's six sounds are already synthesised in the repo.
- **EDL, FCPXML, and Remotion's agent-driven OTIO export:** too limited, tied to Final Cut, and non-deterministic, in that order. Our own exporter is smaller than any of them and only needed at step 8.
