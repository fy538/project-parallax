# AI image and video generation tools, October 2026: capabilities beyond "one still, one camera move"

Research date: 2026-10-11. All prices are US dollars as observed on that date unless a different date is given.

Evidence labels used throughout:
- **[official]** = read directly from the maker's or API host's own page in this pass.
- **[3rd-party]** = a reseller, aggregator, review or news page; not confirmed against the maker's page.
- **[first-party test]** = the creator's own logged tests in the repo file `analysis/ai-video-landscape-2026-10-10.md` (6 clips, MiniMax H3 Max, on this channel's flat constructivist stills). These are the only tests found anywhere that use this art style.

Pages I could not open (HTTP 403): OpenAI's announcement post and help-centre articles, Midjourney's docs. Claims about them rest on search summaries and secondary coverage and are marked.

---

## 1. Image models: consistency across a series, targeted edits, wide outpainting, transparent or layered output, multi-panel sheets, vector output

### Takeaway
Reference-driven consistency (4 to 14 reference images per call) and instruction-based editing are now standard across OpenAI, Google, Black Forest Labs, ByteDance and Recraft, and two things are genuinely new for cut-out and parallax work: transparent-background output is back in OpenAI's current models, and layered output exists as a hosted product (Qwen-Image-Layered at $0.05 per image on fal; Seedream 5.0 Pro "Layers"). No vendor documents multi-panel sheets or pixel-exact preservation outside an edit as a guaranteed feature; OpenAI's own guide still lists recurring-character consistency, mask precision and layout as weak points.

### Cited Findings

**OpenAI (ChatGPT Images 2.5; API `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`)**
- Released 8 September 2026 as "ChatGPT Images 2.5" with two API variants, Flare (fast, default) and Sunburst (slower, for editing precision) [3rd-party coverage of OpenAI's post, which returned 403 to me] — [9to5Mac](https://9to5mac.com/?p=1067783); [Let's Data Science](https://letsdatascience.com/news/openai-introduces-chatgpt-images-25-with-new-editing-tools-19e7c138); announcement URL: [OpenAI](https://openai.com/index/introducing-chatgpt-images-2-5/)
- Default API snapshot is `gpt-image-2.5-flare-2026-09-08`; quality settings `low, medium, high, xhigh, max, auto`; the only feature the model page lists is inpainting [official] — [OpenAI model page](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare)
- Sizes: any `WIDTHxHEIGHT` in multiples of 16; aspect ratio between 1:3 and 3:1; no edge above 3840 px; total pixels 655,360 to 8,294,400; above 2560x1440 is "experimental" [official] — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- Transparent output: both 2.5 models accept `background: "transparent"` with PNG or WebP output [official] — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- Masked edits are "entirely prompt-based" and the model "may not follow its exact shape with complete precision"; multi-turn editing works through the Responses API [official] — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- Stated limitations: it "can still struggle with precise text placement and clarity", "may occasionally struggle to maintain visual consistency" for recurring characters or brands, and has difficulty with "structured or layout-sensitive compositions"; complex prompts can take up to 2 minutes [official] — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- OpenAI's claims for 2.5: edits change "only what you've asked for", earlier edits stay consistent over long conversations, reference subjects are better preserved, latency down up to 50%. Coverage notes these are company claims, not independent benchmarks [3rd-party] — [Let's Data Science](https://letsdatascience.com/news/openai-introduces-chatgpt-images-25-with-new-editing-tools-19e7c138)
- ChatGPT-side tools added with 2.5: Sketch (draw a rough composition as a guide, `@Sketch`), comments placed on the image for targeted changes, Templates [3rd-party] — [Let's Data Science](https://letsdatascience.com/news/openai-launches-chatgpt-images-25-and-sketch-40be4950)
- API price: $5 per 1M text-input tokens, $8 per 1M image-input tokens, $30 per 1M image-output tokens ($15 batch) [official] — [OpenAI model page](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare). Third-party conversion for 1024x1024: about $0.006 low, $0.013 medium, $0.053 high, $0.211 max [3rd-party] — [LaoZhang](https://blog.laozhang.ai/en/posts/gpt-image-2-5-api-pricing)
- Earlier model `gpt-image-2` (snapshot `gpt-image-2-2026-04-21`) got transparent backgrounds in preview on 20 August 2026 — [OpenAI developer forum](https://community.openai.com/t/transparent-backgrounds-are-now-available-in-preview-for-gpt-image-2-in-the-api/1391541); [The Decoder](https://the-decoder.com/openais-gpt-image-2-can-now-generate-images-without-a-background/). A reseller note says transparency on the edit endpoint is a re-draw, not a trace of the original outline [3rd-party] — [APIYI](https://docs.apiyi.com/en/live/2026-08/gpt-image-2-transparent-background)
- fal hosts the 2.5 models; a third-party table lists about $0.053 per 1024x1024 high-quality image via fal [3rd-party] — [fal playground](https://fal.ai/models/openai/gpt-image-2.5/flare/text-to-image/playground); [Moda](https://moda.app/resources/models/gpt-image)

**Google (Nano Banana line)**
- Current models and IDs: Nano Banana 2.1 `gemini-nano-banana-2.1` (recommended for new projects), Nano Banana 2 `gemini-3.1-flash-image`, Nano Banana 2 Lite `gemini-3.1-flash-lite-image`, Nano Banana Pro `gemini-3-pro-image`; the original `gemini-2.5-flash-image` is legacy [official] — [Gemini API image generation docs](https://ai.google.dev/gemini-api/docs/image-generation)
- Reference images, up to 14 per request: 2.1 and 2 take 10 object + 4 character images; Pro takes 6 object + 5 character + 3 style images (the only one with a style-reference slot); Lite takes 14 object images and is "not optimized for multiple reference inputs or multi-turn sequential editing" [official] — [Gemini API image generation docs](https://ai.google.dev/gemini-api/docs/image-generation)
- Resolutions 1K, 2K, 4K; multi-turn conversation is "the recommended way to iterate on images"; transparent backgrounds are not mentioned [official] — [Gemini API image generation docs](https://ai.google.dev/gemini-api/docs/image-generation)
- Price per image (page last updated 2026-10-09): Nano Banana 2.1 $0.0336 (1K), $0.0504 (2K), $0.113 (4K); Nano Banana 2 $0.067 (1K), $0.101 (2K), $0.151 (4K); Pro $0.134 (1K/2K), $0.24 (4K); Lite $0.0336 (1K) [official] — [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Release dates: Nano Banana 2 on 26 February 2026; Nano Banana 2.1 general availability 6 October 2026 [3rd-party] — [gaga.art](https://gaga.art/blog/?p=1763); [OrcaRouter](https://www.orcarouter.ai/de/blog/gemini-nano-banana-2-1-ga)
- fal `fal-ai/nano-banana-2/edit` (the endpoint the creator already uses): $0.08 per image at 1K, 1.5x at 2K, 2x at 4K; 1 to 4 images per call; aspect ratios include 21:9 and the extreme 4:1, 1:4, 8:1, 1:8; PNG, JPEG or WebP [official] — [fal model schema](https://fal.ai/models/fal-ai/nano-banana-2/edit/llms.txt)

**Black Forest Labs (FLUX.2, FLUX.1 Kontext)**
- All FLUX.2 models support up to 4 MP, multi-reference editing and hex colour control. API prices (help centre, 12 June 2026): FLUX.2 [pro] $0.03/MP generate, $0.045/MP edit; [flex] $0.05/MP and $0.10/MP; [max] $0.07/MP; [klein] about $0.014 to $0.015 per image; FLUX.1 Kontext [pro] $0.04 and [max] $0.08 per image [official] — [BFL help centre](https://help.bfl.ai/articles/9364115800-flux-models-overview)
- FLUX.2 [pro] accepts up to 8 reference images, [klein] up to 4 [3rd-party listing] — [OpenRouter](https://openrouter.ai/black-forest-labs/flux.2-pro/apps). No "FLUX.3" was found.

**ByteDance (Seedream 5.0)**
- Seedream 5.0 in Runway takes up to 14 references with 2K or 3K output (15 July 2026); "Seedream 5.0 Pro Layers for layer-based image editing" was added 19 August 2026 [official Runway changelog] — [Runway changelog](https://runway.com/changelog)
- Seedream 5.0 Pro (launched about 8 to 9 July 2026) can split a render into 10 or more transparent PNG layers and fills in what the subject was covering; the API returns a base image plus up to 16 named, positioned layers, each billed at half the per-image rate [3rd-party] — [MagicShot](https://magicshot.ai/news/seedream-50-pro-lands-bytedances-new-flagship-image-model-explained); [Aireiter](https://aireiter.com/blog/seedream-5-0-pro-preview)
- Price via fal for Seedream 5.0 Pro Edit: $0.0675 per image up to 1536x1536 [3rd-party] — [MuAPI comparison](https://muapi.ai/comparison/bytedance-seedream-5.0-pro-edit)

**Alibaba (Qwen-Image-Layered, Qwen-Image-Edit)**
- Qwen-Image-Layered (paper 17 December 2025) is a diffusion model that decomposes one RGB image into a variable number of RGBA layers; trained on layers extracted from Photoshop files; code and weights at `QwenLM/Qwen-Image-Layered` — [arXiv 2512.15603](https://arxiv.org/abs/2512.15603)
- On fal: `fal-ai/qwen-image-layered`, 1 to 10 layers (default 4), PNG or WebP, $0.05 per image [official] — [fal model schema](https://fal.ai/models/fal-ai/qwen-image-layered/llms.txt). Runware lists $0.0141 [3rd-party] — [Runware](https://runware.ai/models/qwen-image-layered)
- A March 2026 paper argues segmentation-style models such as Qwen-Image-Layered treat layers as homogeneous objects and do not match illustration layers (line art, flat colour, shadow, highlight) — [arXiv 2603.14925](https://arxiv.org/abs/2603.14925v2)
- Qwen-Image-Edit 2511 on fal: about $0.031 to $0.037 per image; sources conflict [3rd-party] — [PricePerToken](https://pricepertoken.com/image/model/qwen-qwen-image-edit-2511)

**Recraft (vector and style)**
- API price per image: V4.1 raster $0.035, V4.1 vector (SVG) $0.08, V4.1 Pro raster (2K) $0.21, Pro vector $0.30; V4 $0.04 raster, $0.08 vector; style reference adds $0.005 per request; create style $0.005; vectorize a raster $0.01; remove background $0.01; V3 inpaint, outpaint and background replace $0.04; erase region $0.002; crisp upscale $0.004; creative upscale $0.25 [official] — [Recraft API pricing](https://www.recraft.ai/docs/api-reference/pricing)

**Ideogram**
- Ideogram 4.0 and 4.5 exist (added to Runway on 13 August and 2 October 2026) [official Runway changelog] — [Runway changelog](https://runway.com/changelog)
- Listed API rates (search summary of Ideogram's page; the live price table would not load for me): 3.0 Turbo $0.03, Default $0.06, Quality $0.09; with character reference $0.10, $0.15, $0.20; transparent-background generation $0.04, $0.07, $0.10; 4.0 at $0.03, $0.06, $0.10 — [Ideogram API pricing](https://ideogram.ai/api-pricing/)
- Style reference accepts up to 3 images [3rd-party] — [TechJack](https://techjacksolutions.com/ai-tools/ideogram/)

**Midjourney**
- V8.1 became the default on 11 June 2026; style reference (`--sref`) works on V8.1, but Omni Reference (`--oref`) and Character Reference remain V7-only [3rd-party; Midjourney docs returned 403] — [Blake Crosley guide](https://blakecrosley.com/en/guides/midjourney)

**Adobe Firefly**
- Firefly Image 5 (28 October 2025) generates natively at up to 4 MP; prompt-driven layered editing was announced as "in development" — [TechCrunch](https://techcrunch.com/2025/10/28/adobe-firefly-image-5-brings-support-for-layers-will-let-creators-make-custom-models/). I found no 2026 source confirming layered editing shipped.
- Adobe says Firefly includes its own models for images, video, audio and vectors, and that outputs carry Content Credentials [official] — [Adobe Firefly](https://www.adobe.com/products/firefly/)

**Multi-panel sheets and turnarounds**
- No vendor page documents grids or turnaround sheets as a feature. Third-party guides describe 3x3 storyboard grids and 4-angle turnarounds with Nano Banana Pro and quote consistency figures of 90 to 95% with no traceable method [3rd-party, low reliability] — [Invideo](https://invideo.io/faq/how-do-you-create-a-character-reference-sheet-using-nano/); [SelfieLab](https://selfielabstudio.com/blog/nano-banana-pro-consistent-character-sheets-guide-20260216)
- Video models consume such sets: Kling 3.0 "elements" take a frontal image plus further reference images per character [official] — [fal Kling v3 schema](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video/llms.txt)

### Inferences
- Capability map for the six sub-questions, from the findings above:

| Need | Works today | Notes |
|---|---|---|
| (a) Series consistency | Nano Banana 2.1/Pro (14 refs), FLUX.2 (up to 8), Seedream 5.0 (14), ChatGPT Images 2.5 multi-turn, Recraft styles, Midjourney `--sref` | Only Nano Banana Pro has a dedicated style-reference slot in Google's docs; OpenAI still lists recurring-character consistency as a limitation |
| (b) Change one thing | ChatGPT Images 2.5 (comments, masks), Nano Banana edit, FLUX.2 edit, Kontext, Qwen-Image-Edit, Seedream 5.0 Pro | None promise pixel-identical surroundings; compositing the edit back through a mask is what makes it exact |
| (c) Very wide panoramas | fal Nano Banana 2 edit (8:1), OpenAI (3:1, 3840 px edge), Recraft outpaint | 8:1 at 4K is the widest single-call option found |
| (d) Transparent or layered | OpenAI 2.5 (alpha PNG), Ideogram transparent generation, Recraft remove-background, Qwen-Image-Layered (1 to 10 RGBA layers), Seedream 5.0 Pro Layers (up to 16) | Layer models are the only route that also paints the hidden background |
| (e) Multi-panel sheets | Possible by prompt in any strong model | Undocumented and unmeasured |
| (f) Vector | Recraft V4/V4.1 vector, Recraft vectorize | Only native SVG generator found with public API pricing |

- For a creator whose stills are free through ChatGPT, the paid additions that open new techniques are small per use: a layer split ($0.05), a targeted edit ($0.03 to $0.08), a background removal ($0.01), a vectorize ($0.01).
- Google's direct price for Nano Banana 2.1 ($0.0336 at 1K) is less than half of fal's $0.08 for the Nano Banana 2 edit endpoint; whether fal hosts 2.1 was not checked.

### Gaps
- Whether transparent-background generation is exposed inside the ChatGPT app (as opposed to the API) on the creator's plan, and its limits. OpenAI's announcement and help pages returned 403.
- No independent measurement of how many pixels change outside the edited region for any editor.
- Ideogram's live API price table and the prices of its reframe (outpaint) and 4.x transparent generation.
- Whether Firefly Image 5 layered editing has shipped; current Firefly pricing.
- Midjourney's current official feature matrix, and whether it offers any public API.
- No reliable test of multi-panel sheet consistency for any model.
- How well Qwen-Image-Layered or Seedream Layers split a flat, faceted illustration (as opposed to posters and product shots) is untested.

---

## 2. Video models: keyframes, multi-shot, references, camera control, loops, region-only motion, restyling, alpha, extension

### Takeaway
Pinned first and last frames are now near-universal, multi-shot clips with cuts are available in Kling 3.0, MiniMax H3 and Seedance 2.5, clips run 15 to 30 seconds, and reference sets of 12 to 50 files are accepted; prices for a 5-second clip range from about $0.25 to $3. No flagship hosted model outputs an alpha channel, native looping is documented only for Midjourney, and none of the vendors or leaderboards reports how well a flat illustrated style is held.

### Cited Findings

**Leaderboard context (Artificial Analysis image-to-video arena, fetched 2026-10-11)**
- Top of the board by Elo: MiniMax H3 Max 1195 ($4.80 per minute at 1080p), MiniMax H3 1181 ($7.80), Vidu Q4 Preview 1179 ($5.04), Gemini Omni Flash 1178 ($6.00), Seedance 2.0 720p 1176 ($9.07), HiDream-O1-Video-1.0 1175 ($5.80), Wan 3.0 1164 ($12.00), HappyHorse-1.1 1104, Grok Imagine Video 1.5 1098, Veo 3.1 1082 ($24.00), Wan 2.7 1077, Veo 3.1 Lite 1071 ($4.80). Votes compare videos made from the same input image; the page says nothing about style retention or illustrated inputs — [Artificial Analysis](https://artificialanalysis.ai/video/leaderboard/image-to-video)

**Per-model capability and price**

| Model (release) | Clip length; resolution; fps | First + last frame | Multi-shot / more keyframes | References | Edit / restyle / extend | Price | Source |
|---|---|---|---|---|---|---|---|
| MiniMax H3 Max on fal (Aug 2026) | 5 to 15 s; 480p or 768p (1344x768); 24 fps | Yes: `image_url` + `end_image_url` | Yes, "CUT" markers in one prompt | Up to 12 files (image, video, audio) | Separate endpoints listed: relight, recast, turbo extend-video; lacks base H3's instruction editing and 2K | $0.05/s 480p, $0.08/s 768p; commercial use stated as allowed | [official] [fal guide, 1 Sep 2026](https://fal.ai/learn/tools/how-to-use-minimax-h3-max) |
| MiniMax H3 base (31 Jul 2026) | Up to 15 s; native 2K | Not stated on maker page | "Native multi-shot modeling" | Image, video, audio references | Natural-language editing; video-to-video motion transfer | About $0.13/s at 2K hosted | [official] [MiniMax blog](https://minimax.io/blog/minimax-h3); price [3rd-party] [Curious Refuge](https://curiousrefuge.com/blog/minimaxh3-review) |
| Kling 3.0 Pro on fal (Feb 2026) | 3 to 15 s; up to 1080p | Yes: `start_image_url` + `end_image_url` | Yes: `multi_prompt`, `shot_type` customize or intelligent | `elements`: frontal + reference images, or a video, per character | O3 ("Omni") adds video element referencing | $0.112/s no audio, $0.168/s with audio | [official] [fal schema](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video/llms.txt); [fal Kling page](https://fal.ai/kling-3) |
| Gemini Omni Flash `gemini-omni-1.1-flash` | Base length not stated; 720p default, 1080p and 4K upscaled; 16:9 or 9:16 | Yes (two input images) | Not stated | Subject images; up to 3 video refs of 3 s | Conversational editing; edit uploaded clips up to 10 s; extend by 3 to 10 s to 40 s total | About $0.10/s at 720p | [official] [Omni docs](https://ai.google.dev/gemini-api/docs/omni); [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Veo 3.1 / Fast / Lite (Jan to Mar 2026) | 4, 6 or 8 s; 720p, 1080p, 4K (8 s only above 720p; no 4K on Lite); 24 fps | Yes (`lastFrame` needs `image`) | No | Up to 3 "asset" images (not Lite) | Extend 7 s x 20, to 148 s, 720p only (not Lite) | $0.40/s (4K $0.60); Fast $0.10 / $0.12 / $0.30; Lite $0.05 / $0.08 | [official] [Veo docs](https://ai.google.dev/gemini-api/docs/veo); [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Seedance 2.5 (31 Jul 2026) | 4 to 30 s; 480p or 720p on fal | Start frame + optional end frame | Multi-shot and one-take; timed prompt segments (0 to 5 s, 6 to 10 s) | 30 images, 10 videos, 10 audio | Multi-round extension; timestamp-level editing; "green screen" editing listed | About $0.473/s at 720p on fal | [official] [ByteDance blog](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5); [fal comparison, 13 Aug 2026](https://fal.ai/learn/devs/seedance-2-5-vs-seedance-2-0) |
| Seedance 2.0 (Mar 2026) | 4 to 15 s; up to 1080p and 4K | Same | Timed segments | 12 files (9 images, 3 videos, 3 audio) | Reference video | $0.3034/s 720p, $0.2419 fast, $0.682 1080p on fal | [official] [fal comparison](https://fal.ai/learn/devs/seedance-2-5-vs-seedance-2-0) |
| Wan 3.0 (Aug 2026, closed) | Up to 30 s; 480p, 720p, 1080p | Not stated | "One-take sequences" | Reference-to-video (count not stated) | Edit visuals, plot, dialogue without full regeneration; extension | $0.05, $0.10, $0.20 per second | [official] [Alibaba Cloud blog](https://www.alibabacloud.com/blog/wan3-0-30-second-ai-video-generation-from-any-input_603452) |
| Vidu Q4 Preview (7 Oct 2026) | 3 to 16 s; 540p to 4K | Single start frame; no last frame mentioned | Automatic camera switching | Up to 15 images | Not stated | "From $0.014/s" at launch | [3rd-party] [Unite.AI](https://www.unite.ai/vidu-releases-q4-preview-of-next-generation-flagship-ai-video-model/) |
| Luma Ray3.2 (9 Jun 2026) | Up to 20 s; 1080p; HDR, 16-bit EXR | Yes | Up to 16 keyframes in one clip | Not named | Reframe (extend frame, replace background); API | Not on the page | [official] [Luma](https://lumalabs.ai/news/introducing-ray-3-2) |
| Runway Gen-4.5 + Aleph 2.0 | Not in changelog | First-frame image (21 Jan 2026) | Not in changelog | Not in changelog | Aleph 2.0 (21 May 2026): "edit one frame" and the change carries through the video | Gen-4.5 12 credits/s, Aleph 2.0 28 credits/s; Pro plan $35/month for 2,250 credits | [official] [Runway changelog](https://runway.com/changelog); prices [3rd-party] [Creatify, Aug 2026](https://creatify.ai/blog/runway-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay) |
| Midjourney Video V1 (Jun 2025) | 5 s, extend 4 s at a time to about 21 s; 480p, 720p HD; 24 fps | Yes (`--end`) | No | Start image only | Extend | GPU-minutes on a subscription | [3rd-party; docs 403] [Blake Crosley](https://blakecrosley.com/en/guides/midjourney); loop and end frame [official] [Midjourney updates](https://updates.midjourney.com/looping-and-end-frame-for-video-video-in-the-discord-bot/) |

- Kling multi-shot is reported as up to 6 camera cuts per generation [3rd-party] — [Apiframe](https://apiframe.ai/guides/kling-3-0-guide)
- Kling 4.0 is announced but not released: a lighter "4.0 Flash" tier entered limited early access on 28 September 2026 (20 s, 720p); the full model is described as up to 30 s, up to 10 keyframes anywhere on the timeline and 15 references, launching "in October", with no API or price. This comes from a reseller reading Kling's pages; I did not see the Kling pages [3rd-party] — [OrcaRouter, 4 Oct 2026](https://www.orcarouter.ai/blog/kling-4-0-release-date)
- Seedance 2.5 is offered at 1080p on Runway since 15 August 2026 although fal lists only 480p and 720p [official Runway changelog] — [Runway changelog](https://runway.com/changelog)
- Other models from fal's March 2026 guide: Kling 2.5 Turbo Pro $0.07/s with tail image; PixVerse v5.6 has a transition endpoint between two images, $0.35 to $0.75 per 5 s clip; LTX-2-19B takes an end image, about $0.20 for 121 frames at 720p; Wan Pro 1080p at 30 fps; Hailuo 2.3 Pro $0.49 per clip [official] — [fal guide, 13 Mar 2026](https://fal.ai/learn/tools/ai-image-to-video-generators)
- Vidu Q3: described as "excelling at anime"; $0.0735/s at 540p, $0.1617/s at 720p and 1080p; first and last frame supported [3rd-party API docs] — [Krea docs](https://www.krea.ai/docs/api-reference/video/vidu-q3.md); [Civitai docs](https://developer.civitai.com/orchestration/recipes/vidu)
- Sora is gone: app closed 26 April 2026 and the API ended 24 September 2026 [3rd-party] — [Invideo](https://invideo.io/blog/sora-ai-video-generator/); [Zilliz](https://zilliz.com/ai-faq/can-developers-still-use-the-sora-api)
- Open weights: the newest downloadable Wan is 2.2 (28 July 2025, Apache 2.0); Wan 2.5 to 3.0 are API-only [3rd-party] — [HowAIWorks](https://howaiworks.ai/blog/alibaba-wan-open-weights-stopped-at-2-2). LTX-2.3 (5 March 2026) and LTX-2.5 (11 August 2026) have open weights under an LTX community licence [3rd-party] — [LTX](https://ltx.io/llm-info); [Gradually](https://www.gradually.ai/en/ai-models/ltx-2-5/). HunyuanVideo 1.5 dates from November 2025 with no 2026 successor found [3rd-party] — [OSAI index](https://osai-index.eu/model/hunyuanvideo)

**Camera control**
- H3 Max has no camera parameter; camera is steered by prompt wording [official] — [fal guide](https://fal.ai/learn/tools/how-to-use-minimax-h3-max). Seedance 2.5 and 2.0 likewise list no camera parameter [official] — [fal comparison](https://fal.ai/learn/devs/seedance-2-5-vs-seedance-2-0). Kling 3.0 lets each shot carry its own duration, shot size and camera movement [official] — [fal Kling page](https://fal.ai/kling-3). Seedance 2.5 can take a textureless "clay render" as a camera-angle reference [official] — [ByteDance blog](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5)

**Loops**
- Midjourney: a "Loop" option reuses the start image as the end frame (`--loop`) [official] — [Midjourney updates](https://updates.midjourney.com/looping-and-end-frame-for-video-video-in-the-discord-bot/)
- fal's RIFE interpolation endpoint has a `loop` flag that blends the last frame back to the first [official] — [fal RIFE schema](https://fal.ai/models/fal-ai/rife/video/llms.txt)
- Luma's Ray3.2 page does not mention looping [official] — [Luma](https://lumalabs.ai/news/introducing-ray-3-2)
- The creator's H3 Max clip of a wind-blown blanket was "one event, not ambient life, and does not loop" [first-party test] — `analysis/ai-video-landscape-2026-10-10.md`

**Region-only motion and video inpainting**
- Kling 3.0 Motion Brush (paint a region, give it a direction) and Runway Gen-4.5 Multi-Motion Brush are described by resellers and reviewers; I did not confirm either on the makers' pages [3rd-party] — [Atlas Cloud](https://www.atlascloud.ai/blog/guides/kling-ai-motion-control); [Vantaige](https://vantaige.io/ai-tool/runway)
- Wan 2.1 VACE does masked video inpainting in ComfyUI and is hosted on fal — [ComfyUI workflow](https://comfy.org/workflows/video_wan_vace_flf2v-45c0ce6bcf2e/); [fal wan-vace](https://fal.ai/models/fal-ai/wan-vace). A May 2026 user report says VACE 14B inpainting corrupted the area outside the mask [3rd-party, anecdotal] — [Reddit snapshot](https://reddit.sentinel-team.org/posts/1tezktt/snapshots/2026-05-22T22%3A42%3A24.48386Z)
- H3 Max kept everything outside the moving region unchanged when the prompt said what must stay still (static-region luma change 0.2 to 0.5 of 255 per frame) [first-party test] — `analysis/ai-video-landscape-2026-10-10.md`

**Alpha or green-screen output**
- Wan-Alpha v1.0 (30 September 2025) generates RGBA video with soft edges and semi-transparency; text-to-video only, built on Wan 2.1 14B, Apache 2.0, runs in ComfyUI — [Hugging Face](https://huggingface.co/htdong/Wan-Alpha/blob/main/README.md); [arXiv 2509.24979](https://arxiv.org/pdf/2509.24979); [ComfyUI docs](https://docs.comfy.org/tutorials/video/wan/wan-alpha)
- Runway added "SAM3 Video Segmentation" that outputs transparent WebM (28 July 2026) and ProRes 4444 or PNG-sequence export for Gen-4.5 and Aleph 2 on Pro and above (10 August 2026) [official] — [Runway changelog](https://runway.com/changelog)

### Inferences
- Cost of a short clip computed from the per-second prices above (5 s unless the model's allowed lengths force otherwise): H3 Max 480p $0.25, 768p $0.40; Veo 3.1 Lite 720p $0.20 (4 s) or $0.30 (6 s), and 1080p only at 8 s ($0.64); Veo 3.1 Fast 720p $0.60 (6 s); Omni Flash 720p about $0.50; Kling 3.0 Pro silent $0.56; Wan 3.0 1080p $1.00; Seedance 2.0 720p $1.52; Seedance 2.5 720p $2.37; Veo 3.1 standard $2.40 (6 s).
- The creator's logged cost of about $0.48 for 5 s at 1916x1080 on H3 Max implies roughly $0.096/s, which does not match fal's guide (480p and 768p only, $0.08/s) or a third-party schema that lists a 1080P option at $0.16/s list price under a launch promotion ([Wireflow](https://www.wireflow.ai/docs/nodes/video--minimax_h3_max_i2v)). The 1080p tier and its steady-state price should be read off the live fal endpoint.
- Technique-to-feature map:
  - Controlled transition between two stills: first + last frame (H3 Max, Kling 3.0, Veo 3.1 including Lite, Omni Flash, Seedance, Ray3.2, Midjourney, PixVerse transition).
  - A path through three or more stills in one clip: Ray3.2 (16 keyframes) today; Kling 4.0 (10 keyframes) if it ships as described. Otherwise chain two-frame clips.
  - Cuts inside one clip: Kling 3.0 `multi_prompt`, H3 "CUT" prompts, Seedance timed segments.
  - Holding a look across many clips: reference sets (H3 Max 12, Seedance 2.5 up to 50, Kling elements, Vidu Q4 15, Veo 3.1 3).
  - Changing an existing clip rather than regenerating: Aleph 2.0, Omni Flash conversational editing, base H3, Wan 3.0.
  - Cinemagraph loops: no hosted flagship documents a loop switch; options are Midjourney's loop, start frame = end frame on any first/last-frame model (untested here), or masking a static plate over a moving region in the edit.
  - Alpha: not available natively from hosted flagships; the routes are Wan-Alpha self-hosted, segmentation to transparent WebM, or generating on a flat key colour.
- All the pinned-frame models output 24 fps where a rate is stated; a 30 fps timeline needs a conform step.

### Gaps
- Whether Kling Motion Brush and Runway Multi-Motion Brush exist in the current products and through any API; neither maker's documentation was reached.
- fal prices for Kling O3 reference-to-video and video edit; third-party figures conflict by a factor of two.
- Luma Ray3.2 and Vidu Q4 pricing; Pika's current model, Pikaframes limits and price (only low-quality secondary sources found).
- Runway's current keyframe, camera-control and motion-brush features (not in the 2026 changelog) and API prices.
- Whether start frame = end frame yields a clean loop on H3 Max, Kling 3.0 or Veo 3.1.
- Whether any hosted model returns alpha directly; whether Seedance 2.5's "green screen" editing produces a keyable plate.
- How well each model holds a flat illustrated style: no vendor, leaderboard or review reports it (see section 5).
- Existence and features of HiDream-O1-Video, HappyHorse and Grok Imagine Video beyond their leaderboard rows.

---

## 3. Supporting tools: interpolation, upscaling, matting, segmentation, layer separation, depth

### Takeaway
The supporting pieces are cheap and hosted: frame interpolation with a loop option, background removal for about a cent, segmentation to transparent video, and two layer-decomposition models. The weak link for parallax on flat art is depth: ordinary depth estimators assume physical scenes, and the research answer for illustrations is a layer-order prediction rather than metric depth, which is not yet a hosted product.

### Cited Findings
- **Frame interpolation.** fal `fal-ai/rife/video`: inserts 1 to 4 frames between each pair, optional scene detection, `loop` flag, explicit output fps up to 60; $0.0013 per compute second [official] — [fal RIFE schema](https://fal.ai/models/fal-ai/rife/video/llms.txt). Runway "Enhance Frame Rate" handles up to 4K and 5-minute clips at 25, 30, 48, 60, 120 or 59.94 fps on Max plans (17 September 2026) [official] — [Runway changelog](https://runway.com/changelog)
- **Upscaling.** Recraft crisp upscale $0.004 and creative upscale $0.25 per image [official] — [Recraft API pricing](https://www.recraft.ai/docs/api-reference/pricing). Topaz creative video upscaler on fal: $3.00 per 10 s up to 1080p, $5.00 per 10 s at 4K (search summary of the fal page) — [fal Topaz](https://fal.ai/models/topaz/upscale/video/creative). Omni Flash returns 1080p and 4K as upscales of a 720p generation [official] — [Omni docs](https://ai.google.dev/gemini-api/docs/omni)
- **Background removal and matting.** fal `fal-ai/birefnet/v2`: variants General (Light, Light 2K, Heavy, Dynamic), Matting and Portrait; operating resolution up to 2304x2304; can return the mask; billed per compute second (the page displays "$0") [official] — [fal BiRefNet v2 schema](https://fal.ai/models/fal-ai/birefnet/v2/llms.txt). Recraft remove background $0.01 [official] — [Recraft API pricing](https://www.recraft.ai/docs/api-reference/pricing). Bria RMBG-2.0 is $0.018 per image on fal and its open weights are CC BY-NC 4.0; Photoroom is $0.02 [3rd-party, prices dated 17 July 2026] — [Aireiter](https://aireiter.com/es/blog/best-background-removal-api)
- **Segmentation.** SAM 3 video segmentation is offered in Runway with transparent WebM output and an invert option (28 July 2026) [official] — [Runway changelog](https://runway.com/changelog)
- **Still to layers, hosted.** Qwen-Image-Layered on fal, 1 to 10 RGBA layers, $0.05 [official] — [fal schema](https://fal.ai/models/fal-ai/qwen-image-layered/llms.txt). ByteDance Seedream 5.0 Pro Layers, up to 16 layers with hidden areas filled in [3rd-party] — [Aireiter](https://aireiter.com/blog/seedream-5-0-pro-preview)
- **Still to layers, research.** LayerD (ICCV 2025) decomposes raster graphic designs by repeatedly extracting the top unoccluded layer; code and models are public — [LayerD paper](https://openaccess.thecvf.com/content/ICCV2025/papers/Suzuki_LayerD_Decomposing_Raster_Graphic_Designs_into_Layers_ICCV_2025_paper.pdf). A March 2026 framework splits anime illustrations into line art, flat colour, shadow and highlight — [arXiv 2603.14925](https://arxiv.org/abs/2603.14925v2)
- **Depth on flat art.** "Illustrator's Depth" (CVPR 2026) reframes depth "from a physical quantity to a creative abstraction": it predicts a per-pixel layer index, a discrete, globally consistent ordering trained on layered vector graphics, and is applied to vectorisation, depth-aware editing and 3D relief — [arXiv 2511.17454](https://arxiv.org/abs/2511.17454); [CVPR 2026](https://openaccess.thecvf.com/content/CVPR2026/html/Maruani_Illustrators_Depth_Monocular_Layer_Index_Prediction_for_Image_Decomposition_CVPR_2026_paper.html). A related paper on flat-coloured illustrations reports that existing image-to-3D methods "produce abnormally thin geometric structures" on such inputs — [Art3D, arXiv 2504.10466](https://arxiv.org/html/2504.10466v1)
- **Object removal.** fal `fal-ai/object-removal/mask` produced "a blurred smear" on this channel's art; editing with `nano-banana-2/edit` and compositing the result back through a feathered mask kept everything else pixel-identical [first-party test] — `analysis/ai-video-landscape-2026-10-10.md`

### Inferences
- Why depth is weak on flat art: a flat illustration carries no shading gradients, texture perspective or defocus, so a model trained to recover physical distance has little signal and the useful quantity is stacking order, not distance. This is my reading of the Illustrator's Depth framing and the Art3D result, not a quoted benchmark.
- For multiplane parallax the practical choice in October 2026 is a layer model (which also repaints occluded background) over a depth map plus displacement.
- Interpolation on flat art is lower risk than on photographs for large uniform fills but can smear hard edges that move far between frames; RIFE's scene-detection option exists for exactly the cut-boundary version of that problem. No source tested this on flat illustration.

### Gaps
- fal prices for SAM 3 and for the standard Topaz upscaler; whether FILM is hosted and at what price.
- No hosted endpoint found for Illustrator's Depth or the anime layer-decomposition framework; code availability for Illustrator's Depth is not stated in the abstract.
- Depth Anything 3's licence and any measured accuracy on illustrations (one third-party listing calls it non-commercial; unverified).
- No practitioner comparison of BiRefNet, RMBG-2.0 and SAM 3 on flat cut-out art.

---

## 4. What is new or materially better in 2026 versus 2024 and 2025, and what remains unreliable

### Takeaway
2026 added multi-shot generation, 15 to 30 second clips, large multimodal reference sets, conversational video editing, hosted layer decomposition and a steep price drop; first/last-frame control predates 2026 but is now nearly everywhere. Text, hands, multi-subject contact, obeying amplitude and speed words, mask precision and long-clip drift remain unreliable by the vendors' own admission and by test.

### Cited Findings
**New or materially better in 2026**
- Multi-shot in one generation arrived with Kling 3.0 (February 2026), which also raised clip length from 10 s (Kling 2.6) to 15 s; start and end frames were already baseline in 2.6 [3rd-party] — [PiAPI](https://piapi.ai/blogs/kling-3-0-api-vs-kling-2-6-api-2026)
- Clip length: 30 s single-pass in Seedance 2.5 (up from 15 s in 2.0) and Wan 3.0 [official] — [ByteDance blog](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5); [Alibaba Cloud blog](https://www.alibabacloud.com/blog/wan3-0-30-second-ai-video-generation-from-any-input_603452)
- Reference capacity: Seedance 2.5 takes 50 files against 12 in 2.0 [official] — [fal comparison](https://fal.ai/learn/devs/seedance-2-5-vs-seedance-2-0)
- Keyframes beyond two: 16 per clip in Luma Ray3.2 (June 2026) [official] — [Luma](https://lumalabs.ai/news/introducing-ray-3-2)
- Editing a finished clip by instruction: Runway Aleph 2.0 (May 2026), Gemini Omni Flash, MiniMax H3 (July 2026), Wan 2.7 onward [official] — [Runway changelog](https://runway.com/changelog); [Omni docs](https://ai.google.dev/gemini-api/docs/omni); [MiniMax blog](https://minimax.io/blog/minimax-h3); [Alibaba Cloud blog](https://www.alibabacloud.com/blog/wan3-0-30-second-ai-video-generation-from-any-input_603452)
- Layered image output as a product: Qwen-Image-Layered (paper December 2025, hosted on fal) and Seedream 5.0 Pro Layers (July to August 2026) — [arXiv 2512.15603](https://arxiv.org/abs/2512.15603); [Runway changelog](https://runway.com/changelog)
- Transparent backgrounds returned to OpenAI's current line (preview 20 August 2026; both 2.5 models) [official] — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- Price: Veo 3.1 Lite at $0.05/s (720p) and Veo 3.1 Fast cut to $0.10/s on 7 April 2026; Nano Banana 2.1 at $0.0336 per 1K image against $0.134 for Pro — [The Decoder](https://the-decoder.com/googles-veo-3-1-lite-cuts-video-generation-costs-by-more-than-half/); [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Speed: fal states 5 s of 768p H3 Max returns in under 3 seconds [official] — [fal guide](https://fal.ai/learn/tools/how-to-use-minimax-h3-max)
- Field changes: Sora discontinued in 2026 [3rd-party] — [Invideo](https://invideo.io/blog/sora-ai-video-generator/); Wan stopped releasing open weights after 2.2 [3rd-party] — [HowAIWorks](https://howaiworks.ai/blog/alibaba-wan-open-weights-stopped-at-2-2)

**Already present before 2026**
- Midjourney video with loop and end frame (June to July 2025) — [Midjourney updates](https://updates.midjourney.com/looping-and-end-frame-for-video-video-in-the-discord-bot/); Wan 2.2 first/last-frame and VACE workflows (2025) — [ComfyUI workflow](https://www.comfy.org/es/workflows/video_wan2_2_14B_flf2v-7016f027bcf1/); Wan-Alpha (September 2025) — [Hugging Face](https://huggingface.co/htdong/Wan-Alpha/blob/main/README.md); Firefly Image 5 (October 2025) — [TechCrunch](https://techcrunch.com/2025/10/28/adobe-firefly-image-5-brings-support-for-layers-will-let-creators-make-custom-models/)

**Still unreliable**
- OpenAI's guide: precise text placement, consistency of recurring characters, layout-sensitive compositions, exact mask shapes [official] — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- ByteDance on Seedance 2.5: "physical plausibility of complex motion" and stability with multiple interacting subjects still need work [official] — [ByteDance blog](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5)
- MiniMax H3 review (5 August): struggles with large-scale action; texture instability, facial distortions, inconsistent compositing, visual noise; multi-shot continuity breaks more often than Seedance [3rd-party hands-on] — [Curious Refuge](https://curiousrefuge.com/blog/minimaxh3-review)
- Seedance 2.0 multi-shot scripts shorter than 8 s reportedly fail [3rd-party, single author] — [Yotta Labs](https://www.yottalabs.ai/post/seedance-2-5-vs-seedance-2-0-differences-which-to-use-2026)
- H3 Max "obeys what stays still and the direction of motion; it ignores amplitude and speed words"; a standing figure asked to walk glides instead of striding [first-party test] — `analysis/ai-video-landscape-2026-10-10.md`

### Inferences
- The step change for this channel is not better single clips but control surfaces: a pinned end frame, cuts inside a clip, references, and post-hoc edits. Each replaces a regenerate-and-hope loop with a constrained request.
- Features that sound new but are not yet dependable through an API: more-than-two keyframes outside Luma, region motion brushes, native loops, alpha output.

### Gaps
- No dated source compares 2024, 2025 and 2026 models on the same inputs; the "new versus old" split is assembled from release notes.
- Kling 4.0's shipping feature set is unknown.

---

## 5. Failure modes that matter for flat stylised art

### Takeaway
There is no published, controlled test of flat-illustration image-to-video for any current model: leaderboards do not measure style retention and reviews test photoreal or anime. The only direct evidence is the creator's six H3 Max clips, which show the pattern clearly: whatever moves is redrawn in the model's smoother style, static regions keep the original texture, faces stay blank until they turn, and every clip has a first-frame pop and a slow brightening.

### Cited Findings
**First-party tests on this art style (MiniMax H3 Max, 1080p, 10 October 2026)** — all from `analysis/ai-video-landscape-2026-10-10.md`
- Style drift on moving regions: a blanket's faceting "softens toward cloth shading while it moves"; "whatever moves is redrawn in the model's smoother style; whatever is still keeps our texture"; drift scales with how much of the frame moves.
- Texture crawl: none on static regions (sky 0.04, water 0.29, faceted rocks 0.65 mean luma change per frame out of 255).
- Faceless figures: no eyes or mouth were invented in any clip; on a head turn the head gained "a nose ridge and brow shading (sculpted mannequin, not flat plane)" and the hair lost its facets.
- Hands and contact: clasped hands between two figures held with fingers intact.
- First-frame pop: a visible jump between frame 0 (the pinned still) and frame 1 in all clips (4.5 to 8.3 luma), handled by trimming the first three frames.
- Brightness creep: about 1 to 1.4 luma (one clip 2.6) of slow brightening over 5 s despite the prompt.
- Invented detail: a small white fragment appeared at a hem during motion and lingered about a second.
- Prompt obedience: amplitude and speed words ignored; "what does not change" sentences obeyed.
- Pinned first + last frame: worked; figures walked out with real strides and the rest of the room did not change.

**Third-party evidence**
- Hailuo 2.3 was described as strong at anime, ink wash and game-CG image-to-video "with remarkable consistency", with in-scene typography shimmering listed as a weakness [3rd-party guide] — [NoviAI](https://www.noviai.ai/video-tips/chinese-image-to-video-ai/)
- "Style consistency is the hardest thing to get right in AI-generated anime, and Seedance 2.0 handled it better than most" [3rd-party vendor review, no method shown] — [PixVerse](https://pixverse.ai/en/blog/seedance-2-0-review-prompts-and-use-cases)
- A WaveSpeed test cited by a comparison site scored Seedance 2.0 at 8.2/10 and Kling 3.0 at 4.4/10 with the largest gap on temporal consistency; methodology not seen [3rd-party, unverified] — [Morphed](https://morphed.app/blog/kling-alternatives)
- First-frames colour shift is reported outside H3: an LTX 2.3 user saw colours drop over the first half second, and a commenter attributed it to VAE encoding of the start image and suggested colour-matching to the first frame in post [3rd-party, anecdotal] — [Reddit snapshot](https://reddit.sentinel-team.org/posts/1rppl8c/snapshots/2026-03-13T21%3A28%3A18.36706Z). An Adobe community bug report describes image-to-video output becoming "much more saturated" than the source — [Adobe community](https://community.adobe.com/bug-reports-403/during-the-image-to-video-process-the-colour-changes-and-becomes-much-more-saturated-1482561)
- Text: OpenAI's image guide still warns about text placement and clarity [official] — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- Series consistency for stills: OpenAI's guide says the model may "struggle to maintain visual consistency" across generations [official] — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation); Google supports character consistency only through supplied reference images (4 or 5) [official] — [Gemini API image generation docs](https://ai.google.dev/gemini-api/docs/image-generation)
- The Artificial Analysis arena does not state that it measures style retention or uses illustrated inputs [official page, by omission] — [Artificial Analysis](https://artificialanalysis.ai/video/leaderboard/image-to-video)

### Inferences
- The first-frame pop and colour shift look like a general property of latent video models (the start image is re-encoded), not an H3 quirk, so trimming two or three frames and colour-matching should be assumed for every model until a test shows otherwise.
- Because drift is proportional to moving area, the safest uses of image-to-video on flat art are small-area motion with a locked camera, or motion fully specified by two pinned frames; large camera moves redraw the whole frame and should be expected to change the texture everywhere.
- Face invention risk rises when a head rotates or approaches camera; keeping heads still or small is a constraint the tools do not remove.
- Anime-focused praise does not transfer automatically: anime has outlines and trained-in conventions, while faceted constructivist shapes without outlines are rarer in training data.

### Gaps
- No test of this style on Kling 3.0, Veo 3.1, Gemini Omni Flash, Seedance, Vidu, Luma or Runway was found or run; the first-party evidence covers one model and six clips.
- No frame-level measurement of texture crawl or line-weight change on flat art in any published review.
- No data on whether reference-to-video (style references) reduces drift on moving regions.
- Whether interpolation from 24 to 30 fps introduces edge artefacts on this art is untested.

---

## 6. Terms that matter for a monetised YouTube channel

### Takeaway
Stylised, clearly non-realistic animation does not need YouTube's altered-content disclosure, but provenance marks are now embedded by the major generators (C2PA and SynthID from OpenAI, SynthID from Google, Content Credentials from Adobe) and YouTube can auto-label uploads that carry C2PA metadata, with no way to remove that label. Hosted APIs such as fal state commercial use is allowed, while several open-weight licences carry territorial or non-commercial limits.

### Cited Findings
**YouTube**
- Disclosure is required for realistic altered or synthetic content (a real person saying or doing something they did not, altered footage of a real event or place, a realistic scene that did not happen). Not required for clearly unrealistic content, including "AI-generated animation" in a fully animated video, or for production help such as scripts, thumbnails, titles, infographics, upscaling [official, fetched 2026-10-11] — [YouTube Help](https://support.google.com/youtube/answer/14328491)
- YouTube may automatically apply an AI label to content made with its own tools, content "containing C2PA metadata", or content its systems detect; labels from C2PA metadata, YouTube's own tools or manual review cannot be changed by the creator; other automatic labels can usually be corrected by answering "No" in the disclosure survey [official] — [YouTube Help](https://support.google.com/youtube/answer/14328491)
- Repeated failure to disclose can lead to manually applied labels, content removal or suspension from the Partner Program [official] — [YouTube Help](https://support.google.com/youtube/answer/14328491)
- YouTube says the more visible labels do not affect recommendations or monetisation, and automatic detection targets "significant photorealistic AI use" [3rd-party report of YouTube's statement] — [heise](https://heise.de/-11309100)

**Provenance marks by generator**
- OpenAI: images from ChatGPT, Codex and the API include both C2PA metadata and SynthID watermarks; a checker is at openai.com/verify (help article title and summary; page returned 403 to me) — [OpenAI Help](https://help.openai.com/my-mm/articles/8912793-c2pa-and-synthid-in-openai-generated-images). The SynthID addition is dated 19 May 2026 by secondary coverage [3rd-party] — [Let's Data Science](https://letsdatascience.com/news/openai-adopts-c2pa-and-synthid-for-image-verification-ed2f7b5f/)
- Google: "All generated images include a SynthID watermark" [official] — [Gemini API image generation docs](https://ai.google.dev/gemini-api/docs/image-generation); Veo videos are watermarked with SynthID [official] — [Veo docs](https://ai.google.dev/gemini-api/docs/veo); Omni Flash videos include SynthID [official] — [Omni docs](https://ai.google.dev/gemini-api/docs/omni)
- Adobe: Firefly outputs carry Content Credentials [official] — [Adobe Firefly](https://www.adobe.com/products/firefly/)
- fal's Nano Banana 2 edit page says nothing about watermarks or provenance [official, by omission] — [fal model schema](https://fal.ai/models/fal-ai/nano-banana-2/edit/llms.txt)

**Commercial-use statements**
- fal, H3 Max: "Anything you generate through it may be used in commercial projects, paid campaigns and client work included" [official] — [fal guide](https://fal.ai/learn/tools/how-to-use-minimax-h3-max). fal, Kling 3.0: videos generated through the API can be used in commercial projects, subject to fal's terms [official] — [fal Kling page](https://fal.ai/kling-3). fal lists Seedance as available for commercial use subject to its terms [official] — [fal comparison](https://fal.ai/learn/devs/seedance-2-5-vs-seedance-2-0). A third-party guide notes that on fal commercial terms follow each model's own licence [3rd-party] — [Techsy](https://techsy.io/en/blog/best-ai-video-providers)
- Ideogram: "We do not claim ownership of your generated images, and you're free to use them for any purpose, including commercial use" (consumer FAQ; the API has a separate developer agreement) [official] — [Ideogram pricing](https://ideogram.ai/pricing/?pricing_tab=api)
- Midjourney: commercial use permitted on paid tiers [3rd-party] — [Blake Crosley](https://blakecrosley.com/en/guides/midjourney)

**Open-weight licence traps**
- MiniMax H3 open weights use a community licence whose territory excludes the United States, European Union, United Kingdom and South Korea, for the weights and their outputs; commercial use elsewhere is free under $20M revenue with on-screen "MiniMax H3" attribution. The hosted product is covered by its own terms, not this licence [3rd-party] — [NYU Shanghai RITS](https://rits.shanghai.nyu.edu/ai/minimax-ships-h3-weights-with-the-us-and-eu-excluded/); [Curious Refuge](https://curiousrefuge.com/blog/minimaxh3-review)
- Wan 2.2 and Wan-Alpha are Apache 2.0 — [HowAIWorks](https://howaiworks.ai/blog/alibaba-wan-open-weights-stopped-at-2-2); [Hugging Face](https://huggingface.co/htdong/Wan-Alpha/blob/main/README.md). HunyuanVideo 1.5 uses a Tencent community licence, not an OSI licence [3rd-party] — [OSAI index](https://osai-index.eu/model/hunyuanvideo). Bria RMBG-2.0 open weights are CC BY-NC 4.0 [3rd-party] — [Aireiter](https://aireiter.com/es/blog/best-background-removal-api)

**Operational terms**
- Veo: generated videos are stored for 2 days; image-to-video, interpolation and reference modes are limited to `allow_adult` person generation [official] — [Veo docs](https://ai.google.dev/gemini-api/docs/veo)
- Recorded in the repo's 10 October notes and not re-fetched here: YouTube's "inauthentic content" monetisation rule (15 July 2025) targets mass-produced templated output, and MiniMax lost a motion to dismiss in Disney's suit on 22 May 2026 [first-party notes citing external pages] — `analysis/ai-video-landscape-2026-10-10.md`; underlying pages: [YouTube Help](https://support.google.com/youtube/answer/1311392); [Loeb](https://www.loeb.com/en/insights/publications/2026/06/disney-enterprises-inc-v-minimax)

### Inferences
- A channel whose pictures are plainly non-photoreal illustration sits in YouTube's stated exemption, but the C2PA route is mechanical: if metadata from a ChatGPT still survives into the uploaded file, an unremovable label could follow. Stills that pass through Remotion or an NLE are re-encoded into a new video file, which normally does not carry the source image's C2PA manifest; that is an engineering expectation, not something any source here confirms.
- SynthID is a pixel-level watermark intended to survive re-encoding; YouTube's help page names C2PA metadata and its own detection as label triggers and does not name SynthID.
- Using the hosted H3 Max through fal avoids the open-weight territorial clause; self-hosting H3 weights from the US would not.

### Gaps
- OpenAI's usage terms on ownership and commercial use of ChatGPT images and its C2PA help text could not be opened (403).
- fal's terms of service were not read directly; only fal's per-model statements were.
- Whether fal-hosted Google and OpenAI models preserve SynthID and C2PA marks in their outputs.
- Whether YouTube reads SynthID, and whether C2PA manifests in source stills ever survive a Remotion or NLE render.
- Kling, MiniMax, Luma, Vidu and Runway direct-plan commercial terms and any visible-watermark rules on free tiers were not checked.
