# AI video generation: where the field is, and where Parallax under-uses it

> October 10, 2026. Four parallel research passes: repo inventory, model landscape, production workflows, policy and reception. Supersedes the model picks in `analysis/illustration-to-video-workflows-2026-09-24.md` and the May rankings in `project/AI_VIDEO_PIPELINE.md`.
>
> **Evidence note.** Leaderboards, Google pricing, MiniMax, ByteDance, Runway changelog and fal model pages were fetched directly. Most other model details come from search summaries of third-party pages. Nothing here was tested on Parallax art.

## Bottom line

Parallax is under-using AI video, and the reason is historical rather than principled. The "stills plus Ken Burns" doctrine rests on May 2026 tests of Pika 2.2/2.5 and Hailuo 01/02. No AI motion clip has been generated since May 23, and none of the models that now lead the field has ever been run on the constructivist style. The one question that decides how far to go (does a current model keep flat shapes and featureless faces, or drift to photoreal and invent features?) has no published answer for any current model, so it has to be tested here. That test is small.

## 1. Where the repo stands

- 20 AI motion clips exist, all single-still image-to-video from May, all built from stills that were later regenerated. `ai-care-motives` has 230s of AI imagery (34% of runtime), all Ken Burns.
- Models named as current in repo docs: Kling 3.0 (never run), Hailuo I2V-01-Live (last pick), Pika 2.5 (shelved), Sora 2, Runway Gen-4, Seedance 2.0, Veo 3.1 (spec only).
- Failure modes that drove the conservative choices, with dates:
  - May 4–8: faces drift to realistic; any humanoid shape gets animated; edge text turns to gibberish (Pika 2.2).
  - May 9: palette drifts across a chain; drift in the last 1–2s of 10s clips (Pika 2.5).
  - May 21: start/end-frame morph smeared fine detail; separately generated endpoints did not line up.
  - May 21 (assumed, not tested): no usable programmatic API.
  - May 23: Hailuo 02 added photoreal texture to flat art; morphs flashed when objects appeared.
  - Sept 23: Tiger rejected the motion in the SVG and raster-cutout tests. This one is taste, not a model limit.
- The repo's own Sept 24 review already called the May rankings dated and proposed a one-shot test. It was never run.

## 2. The model landscape (as of Oct 10, 2026)

"6s clip" = one 6-second image-to-video clip via API, 1080p unless noted.

| Model | Released | Max clip | First + last frame | Reference images | Cost, 6s clip |
|---|---|---|---|---|---|
| MiniMax H3 / H3 Max (Hailuo 3.0) | Jul 31 / Aug 2026 | 15s | yes | 9 | ~$0.60–1.00 (fal) |
| Gemini Omni 1.1 Flash | Aug 27, 2026 | 10s, extends to 40s | yes | 5 | ~$0.60 at 720p |
| Vidu Q4 Preview | Oct 7, 2026 | 16s | reference-driven | 15 | unsettled ($0.045–0.39/s by resolution) |
| Kling 3.0 Pro | Feb 5, 2026 | 15s | yes, plus Motion Brush and camera panel | saved "elements" | ~$0.67 (fal) |
| Seedance 2.5 | Jul 31, 2026 | 30s | yes | 30 | ~$1.40 at 720p, ~$7 at 1080p |
| Wan 3.0 (closed weights) | Aug 24, 2026 | 30s | n/c | n/c | ~$1.20 |
| Runway Gen-4.5 + Aleph 2.0 | Dec 2025 / May 2026 | Aleph edits 2–30s clips | multi-keyframe (5) | yes | ~$0.72; Aleph $0.28/s |
| Luma Ray3.2 | Jun 9, 2026 | 20s | 16+ keyframes | — | ~$1.20 per 5s |
| Veo 3.1 (API) | — | 8s | yes | yes | $2.40 (Fast $0.72) |

- **Gone or stalled:** Sora (app closed Apr 26, API ended Sep 24, 2026). Kling 4.0 is announced (30s, 4K, 10 keyframes) but only in a closed beta. No Midjourney Video V2 found.
- **Rankings.** Artificial Analysis image-to-video arena, live Oct 10: H3 Max 1195, H3 1181, Vidu Q4 1179, Gemini Omni Flash 1178, Seedance 2.0 1176, Wan 3.0 1164; Veo 3.1 is at 1082. Ranks 2–6 are a statistical tie. None of these boards measures style retention.
- **Standard now, and new since May:** first/last-frame pinning on most flagships; multi-image references; native synced audio on everything except Luma and Midjourney; scripted batch generation through fal or Replicate.
- **Still weak:** on-screen text (glyph correctness 46–58 in the Sept 2026 VidScribe preprint), hands, multi-character contact, fast crowds. Drift toward photorealism remains the default failure for illustrated inputs and grows with clip length.

## 3. How the good work is made

- Documented pipelines share one shape: script, shot list, locked still references, first-frame image-to-video one shot at a time, a normal editor, real sound and (usually) human voices. Gossip Goblin's *The Patchwright*: Midjourney stills, an image editor to build in-between frames, Kling first-frame i2v for all motion, about 150 generations for one 90-second dialogue scene, no upscaling.
- Consistency comes from a locked reference set reused on every shot, approving the first frame before paying for motion, and a fixed style block. Sources conflict on whether native references or a style LoRA holds a non-photoreal look better. A style LoRA is cheap ($2–25 on fal, plus about a day curating 30–100 images).
- What reliably works for illustrated stills: low-motion "living illustration" (fixed camera, one slow secondary movement, 3–5 seconds used per clip). Morphs between two stills work but cost attempts; one documented case kept 2 clips from 40.
- Keeper rates reported: 2.4 generations per kept shot at the low end, dozens at the high end.
- Diagrams, maps and text: keep them in code. The hybrid consensus is text-free AI clips as plates with code-rendered graphics on top.
- No essay or philosophy channel was found documented as using AI animation well. The acclaimed examples are narrative shorts.
- Cost for 2–4 minutes of AI-animated footage, solo: an estimate of $100–400 and 15–40 hours, the first episode at the top of that range.

## 4. Risk

- **YouTube policy:** disclosure is required only for photorealistic synthetic content; clearly stylized animation is exempt. The "inauthentic content" monetization rule (July 15, 2025) targets mass-produced templated output. Stylized AI illustration in a human-written, human-narrated essay sits outside both. Residual risk: automated misclassification (Kurzgesagt's hand-made video was flagged in Aug 2026).
- **Reception:** enthusiasm for AI creator content fell from 60% (2023) to 26% (2025) in one survey; backlashes hit AI visuals that looked generic or were discovered rather than declared (Coca-Cola, *On This Day… 1776*, Hank Green's AI diagram). An AI-ethics audience is plausibly the least forgiving; no direct data.
- **Legal:** raw AI clips are likely not copyrightable; the script, narration and edit are. MiniMax (Hailuo/H3) lost its motion to dismiss in Disney's suit on May 22, 2026, so do not depend on it alone. Use paid tiers; keep artist names out of prompts.
- **Practice:** documents, charts, quotes and photographs stay real; AI imagery stays plainly non-photoreal under one art direction; reconstructions are labelled; the description says what AI did.

## 5. Where Parallax could use more

1. **Living illustrations instead of Ken Burns.** The 12 stills carry a third of the episode and currently only pan. Fixed camera, one secondary motion (cloth, water, lamp light, people passing a window).
2. **Pinned first/last-frame hero moments.** Make the end frame by editing the start frame, so the two line up by construction (the May morph failure was endpoints that did not co-register). The obvious candidate is the episode's central idea: the shopkeeper's window with people passing, then the same frame with the street empty.
3. **AI plates in the house style instead of stock footage.** The two stock car slots in Beat 6 would otherwise break the illustrated world. Not for the evidence shots (EPA notice, VW photo), which stay real.
4. **Plates under Remotion graphics.** A text-free moving background with code-rendered words on top, for the handful of cards that survive.
5. **Scripted generation.** The repo already calls fal for style references (`tools/ai-video/generate_style_refs.py`, needs `FAL_KEY`; none is configured in the environment today). A small batch script on the same pattern would replace pasting prompts into web UIs and log cost per clip.

Not yet: character acting, walking, hand contact, on-screen text, long single takes.

## 6. Proposed test (bounded)

Three shots from `ai-care-motives`, one per use type, on four models:

| Shot | Use | Still |
|---|---|---|
| Rescued figure on the bank | living illustration (cloth, water) | `aigen-05` |
| Shop window, watched → unwatched | pinned first + last frame | `aigen-03` + an edited copy |
| Desk at night | plate (screen glow, slow light) | `aigen-10` |

Models: MiniMax H3 (fal), Kling 3.0 Pro, Gemini Omni 1.1 Flash, Vidu Q4 Preview. Two attempts each: about 24 clips, roughly $15–30.

Pass criteria: faces stay featureless, flat shapes stay flat, no texture crawl or flash, and the motion is something Tiger wants on screen. If nothing passes, Ken Burns stays and the docs get a dated "tested, not yet" note. If something passes, animate the remaining stills with that model and update the doctrine.

## 7. Repo docs that are now stale

`project/AI_VIDEO_PIPELINE.md`, `project/ASSET_GENERATION_REGISTER.md`, `tools/ai-video/GENERATION_WORKFLOW.md`: Sora 2 (discontinued), Hailuo I2V-01-Live (superseded by H3), Pika and Runway Gen-4 versions, "no programmatic API", per-clip prices.

## Sources

- Leaderboards: https://artificialanalysis.ai/video/leaderboard/image-to-video , https://artificialanalysis.ai/video/leaderboard/text-to-video , https://arena.ai/leaderboard/video/image-to-video
- MiniMax H3: https://minimax.io/blog/minimax-h3 , https://fal.ai/models/minimax/h3/image-to-video , review https://curiousrefuge.com/blog/minimaxh3-review
- Google: https://ai.google.dev/gemini-api/docs/pricing , https://ai.google.dev/gemini-api/docs/omni
- Seedance 2.5: https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5
- Wan 3.0: https://www.alibabacloud.com/blog/wan3-0-30-second-ai-video-generation-from-any-input_603452
- Kling: https://fal.ai/learn/tools/how-to-use-kling-3-0-pro , https://kling.ai/quickstart/motion-control-user-guide
- Runway: https://runway.com/changelog , https://runway.com/news/introducing-aleph-2-and-edit-studio
- Luma Ray3.2: https://lumalabs.ai/news/introducing-ray-3-2
- Vidu Q4: https://www.unite.ai/vidu-releases-q4-preview-of-next-generation-flagship-ai-video-model/
- Sora discontinuation: https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
- Text in video: https://arxiv.org/abs/2609.36598
- Workflows: https://pjace.beehiiv.com/p/gossip-goblin-s-crazy-workflow-for-building-original-worlds-200m-views , https://www.thedaringcreatives.com/creator-stories/how-ai-creators-make-videos/ , https://elements.envato.com/learn/a-face-only-a-mother-could-love , https://themikem.substack.com/p/i-spent-700-on-ai-credits-making , https://brianheming.substack.com/p/animating-a-scene-from-a-comic-threat , https://www.francisokafor.com/field-notes/what-ai-video-generation-is-actually-good-for
- Slop and reception: https://www.404media.co/ai-generated-boring-history-videos-are-flooding-youtube-and-drowning-out-real-history/ , https://www.emarketer.com/content/consumers-rejecting-ai-generated-creator-content , https://techcrunch.com/2026/08/01/youtuber-hank-green-says-his-ai-usage-is-not-healthy/ , https://kotaku.com/youtube-mistakenly-penalizes-popular-science-channel-kurzgesagt-for-ai-generated-slop-2000722702
- YouTube policy: https://support.google.com/youtube/answer/14328491 , https://blog.youtube/news-and-events/improving-ai-labels-viewers-creators/ , https://support.google.com/youtube/answer/1311392
- Legal: https://www.mayerbrown.com/en/insights/publications/2026/03/supreme-court-denies-review-in-ai-authorship-case , https://www.loeb.com/en/insights/publications/2026/06/disney-enterprises-inc-v-minimax , https://www.courtlistener.com/docket/70513159/disney-enterprises-inc-v-midjourney-inc/
- Documentary practice: https://www.indiewire.com/news/business/documentary-producers-generative-ai-best-practices-1234975160/

## 8. Prompting rules for image-to-video on this style (researched Oct 10)

Web sources are mostly third-party guides, not vendor documentation; the Parallax rules come from `project/CHAINED_STILL_LESSONS.md` (May tests on older models).

1. **Let the still carry the look; spend the prompt on what changes.** Do not re-describe the picture. (H3 and Runway guidance.)
2. **Lead with the camera state.** "Static locked-off tripod shot" for a living illustration; otherwise one move, stated as type + amplitude + speed. One camera move, one subject action per clip.
3. **Say "one continuous shot, no cuts."** H3 plans multi-shot sequences and splits chained actions into separate shots.
4. **Name only what is in the frame, with a verb that fits the pose.** Anything named gets animated; anything named but absent gets invented. Write the prompt while looking at the final still.
5. **State what must not change in one sentence**, including the style ("keep the image's flat illustrated style, textures and colours exactly as they are"). Use a positive anchor. Avoid realism vocabulary and avoid naming the face.
6. **Keep motion small and clips short.** Fixed camera, one or two secondary motions, about 5 seconds. Drift toward realism grows with length and motion.
7. **For first/last-frame shots, make the end frame by editing the start frame** and describe the change between them.
8. **Read the expanded prompt.** H3's expander rewrites the prompt and returns the result; check what it added.
9. **Label sound by type** (ambience, no music, no voices). Expect the mix to be very quiet.
10. **Draft cheap.** 768p costs half of 1080p or less; re-run keepers at full resolution.

## 9. First test (Oct 10): one clip

- **Input:** `aigen-05-rescued-figure.png`; MiniMax H3 Max via fal, 5s, 1080p, prompt expansion `balanced`. Prompt: `episodes/ai-care-motives/prompts/i2v/aigen-05-take1.txt`. Cost about $0.48; 15 seconds wall-clock.
- **Output:** `episodes/ai-care-motives/assets/clips-i2v/aigen-05-h3max-take1.mp4` (1916×1080, 24fps, 5.17s, with audio) plus a JSON sidecar holding the prompt and the expander's rewrite.
- **Held:** flat faceted style, palette, featureless planar face (no features invented), single shot with no cuts, locked camera. Sky and water are stable frame to frame (mean luma change 0.04 and 0.29 of 255); the faceted rocks do not crawl (0.65).
- **Did not follow the prompt:** the blanket billows widely around 1.7s (asked: "flutters very slightly"), and its faceting softens toward cloth shading while it moves; the hair blows although the figure was told to stay still.
- **Artifacts:** a visible pop between frame 0 (the pinned still) and frame 1 (the model's re-render); trim the first frames in the edit. Audio averages -44 dB.
- **Not yet judged:** whether the motion is wanted on screen (Tiger's call), a second take, any other model, the pinned first/last-frame shot.
- **Closer review (12 frames + crops):** the grass sways coherently and blades keep their identity; the distant figure and the hands are rock-steady. The blanket motion is a single gust that peaks at 1.3–1.7s and settles by about 3.3s, so the clip is one event, not ambient life, and does not loop. A small white fragment appears at the blanket's hem near the rocks during the gust and lingers for about a second. The frame brightens slowly (mean luma 73.5 → 76.1 over 5s) despite "the light does not change". Fine faceted texture is softer than the still wherever something moves. Output is 24fps; the timeline is 30fps.
- **Editorial read:** the clip animates the wrong thing. The script row is "the rescued figure on the bank, a second figure walking away; hold on the rescued figure". The motion that carries the beat is the rescuer leaving, not cloth in the wind.

## 10. Harder tests (Oct 10): four clips, MiniMax H3 Max, 1080p, expansion `balanced`

Prompts in `episodes/ai-care-motives/prompts/i2v/`; clips and JSON sidecars in `assets/clips-i2v/`. Video spend $2.02 for these four ($2.50 including the first take), plus about $0.14 of image edits.

| Clip | Test | Result |
|---|---|---|
| `aigen-05-walkaway` | Small back-turned figure walks away | **Fail on walking.** He shrinks and sinks in the same standing pose (a glide, no stride). The prompt fix worked: blanket and hair now stay still. |
| `aigen-03-headturn` | Face in motion | **Partial.** No eyes or mouth invented, but the head gains a nose ridge and brow shading (sculpted mannequin, not flat plane) and the hair loses its facets. The turn finishes in about 1.3s despite "slow". Street figures walk correctly behind the window bars. |
| `aigen-04-pull` | Two bodies in contact, water | **Mostly works** (expected to fail). Clasped hands hold with fingers intact; the swimmer is drawn up and turns; faces stay planar; ripples are thin graphic rings. But the motion is far larger than "small amplitude": the rescuer stands and his head leaves the top of frame, and the clip resolves the rescue the still only suspends. |
| `aigen-03-unwatched` | Pinned first + last frame | **Works.** The three figures walk out with real strides, pass behind the bars, the street ends empty and the clip lands on the pinned end frame. Nothing else in the room moves (right-hand region differs from the start still by 7.5 at the end vs 7.4 at the start, i.e. unchanged). 6.6s for a 6s slot. |

Common to all four: no cuts; static regions stable (0.2–0.5 mean luma change per frame); a pop between frame 0 and frame 1 (4.5–8.3); a slow brightening of about 1–1.4 luma over the clip; 24fps.

Lessons:
- **The model obeys "what stays still" and the direction of motion; it ignores amplitude and speed words.**
- **Whatever moves is redrawn in the model's smoother style; whatever is still keeps our texture.** Style drift scales with how much of the frame moves.
- **The drawn pose decides the motion.** Mid-stride figures walk; a standing figure glides. Matches the "verb to pose" rule in `CHAINED_STILL_LESSONS.md`.
- **A pinned end frame gives the most control** and is the first technique good enough to use. The end frame was made with `fal-ai/nano-banana-2/edit` and composited back onto the original through a feathered mask so everything outside the window is pixel-identical. `fal-ai/object-removal/mask` was tried first and produced a blurred smear.

## 11. Follow-ups (Oct 10)

- **Pinned clip wired into the episode.** `beat5-seg27` (10.2s slot: 3s lead-in, narration, 3s hold) now plays `clips/aigen-03-unwatched.mp4`: the i2v take with its first three frames trimmed (the pop), conformed to 30fps, the last frame held to fill the slot, a 3% slow push over the whole slot, and no audio track. Script row updated. Preview any segment in context with `node scripts/preview-range.mjs --episode=<slug> --segment=<id>`.
- **Pull retake (`aigen-04-pull-wide`).** Start frame widened first: the still scaled to 82% on the same canvas and the margins outpainted with `fal-ai/nano-banana-2/edit` (`assets/keyframes/aigen-04-wide.png`). Prompt added "stays on his knees the whole time and does not stand up". Result: the rescuer stays kneeling and both figures stay in frame; clasped hands hold; the swimmer comes up to the chest with a shirt and jacket that match his sleeve; both faces stay faceted blank planes; brightness steady (50.0 → 50.4). The "what does not change" phrasing controlled the motion where "small amplitude, slow" had not. Cost about $0.60 (edit + clip).
- **Technique that carried over:** edit the frame, then animate. Both successes (pinned end frame, widened start frame) came from fixing the image first and asking the video model for less.
