# YouTube encoding, grain and legibility: research for the first upload

> October 10, 2026. Web research by a sub-agent (text sources only; nothing downloaded, no videos watched), plus measurements on our own files: `ffprobe` on existing renders, three 30-frame test renders of `ai-care-motives-full` written to a scratch folder, and local re-encodes at streaming-like bitrates. The local re-encodes are not YouTube's encoder; they show direction only. No repo file was changed. Remotion advice is for the installed 4.0.457.

Labels: **[YT]** YouTube's own documentation · **[M]** published measurement with a method · **[C]** community report without a method · **[here]** measured in this session on our files · **[inf]** my inference. Anything dated before 2024 is marked *old*.

## 1. How YouTube assigns codecs and bitrates

### What YouTube documents

1. **Recommended upload** [YT, page undated, read Oct 10 2026]: MP4 with the moov atom at the front; H.264 High profile, progressive, 4:2:0, closed GOP of half the frame rate, 2 consecutive B-frames, CABAC, variable bitrate; AAC-LC or Opus at 48 kHz, stereo 384 kbps. Suggested SDR video bitrates at 24–30 fps: 1080p 8 Mbps, 1440p 16 Mbps, 2160p 35–45 Mbps. Colour: BT.709 for primaries, transfer and matrix; unspecified values are assumed to be BT.709; full range is converted to limited range. Bit depth is not mentioned. [Recommended upload encoding settings](https://support.google.com/youtube/answer/1722171)
2. **Also accepted** [YT]: ProRes, DNxHR, CineForm, HEVC, WebM, MOV. [Supported formats](https://support.google.com/youtube/troubleshooter/2888402). Limit 256 GB or 12 hours; uploads over 15 minutes need a verified account. [Upload limits](https://support.google.com/youtube/answer/71673)
3. **Processing** [YT]: low qualities appear first; 1080p and 4K can take hours (their example: a 60-minute 4K30 video, up to 4 hours). [Processing](https://support.google.com/youtube/answer/71674)
4. **Playback quality** [YT] depends on connection speed, player or screen size, and the upload's quality. The same page says 1080p and 4K may be missing on devices without VP9 support, which implies VP9 is how the higher qualities reach TVs. [Change video quality](https://support.google.com/youtube/answer/91449)
5. **How a codec is chosen per video or per channel is not documented anywhere I could find.** YouTube's infrastructure post says only that VP9 costs about five times the compute of H.264, and AV1 more. [YouTube blog, Apr 21 2021, *old*](https://blog.youtube/inside-youtube/new-era-video-infrastructure/)

### What others have measured

| Date | Source | Finding | Weight |
|---|---|---|---|
| Aug 2021, *old* | [Ozer, Streaming Learning Center](https://streaminglearningcenter.com/codecs/which-codecs-does-youtube-use.html) [M] | H.264 only below a few thousand views, VP9 above, AV1 for videos in the millions | Stale: the author's own Mar 2022 note calls it obsolete |
| Mar 2022, *old* | same page, author's update | Every video checked had a VP9 encode, but low-view videos were still *served* H.264; AV1 seen on videos with almost no views | Shows "encoded" and "served" are different questions |
| Mar 2021 – Mar 2022, *old* | [codejam.info](https://www.codejam.info/2021/03/getting-the-highest-video-quality-on-youtube.html), [OBS forum](https://obsproject.com/forum/threads/youtube-choosing-its-own-encoders-how-to-get-the-best-quality-1080p.154105/) [C] | Uploads above 1080p get VP9 at once; 1080p uploads from small channels get H.264 until they are popular | Repeated everywhere, never shown with data |
| Sep 2020, *old* | [And so begins](https://andsobegins.com/article/2020/09/22/VMAF-comparisons-for-2160-upscaled-Content-on-YouTube.html) [M] | Nine game clips. 1080p upload: H.264 stream, about 68 VMAF at 4.2 Mbps. Same clips upscaled to 2160p before upload: VP9 streams scoring about 92 | Confounded (codec, bitrate and resolution all change), and the author says so |
| Nov 24 2025 | [arXiv 2511.18686](https://arxiv.org/abs/2511.18686) | States as background that inputs of 1440p and above get VP9 whatever the channel size, and small channels otherwise get H.264 only | An uncited assertion in a paper about something else |
| Oct 15 2025 | [yt-dlp issue 14636](https://github.com/yt-dlp/yt-dlp/issues/14636) [M, a format listing] | One fairly static 1080p video: H.264 666 kbps, VP9 673 kbps, AV1 366 kbps, and a Premium-only 1080p VP9 at 1,226 kbps | Real 2025 numbers for static content; popularity of the video unknown |
| Jan 6 2026 (year from the title) | [Zeb Gardner](https://www.zebgardner.com/photo-and-video-editing/2026-update-best-upload-settings-for-youtube) [M] | Channel with a few hundred followers. Seven 10-second clips uploaded many ways, downloaded and scored against the master. The 1080p upload scored worst (VMAF 97.3, SSIM 89.1); 1440p (99.95 / 94.1) and 4K (99.92 / 94.3) were about equal. The 4K stream was VP9, 8-bit, 4:2:0, about 17 Mbps. A DNxHR upload scored best; 60 Mbps HEVC or AV1 close behind; 40 Mbps H.264 clearly lower | Best recent evidence, from a small channel. Each resolution was scored against its own master, so it does not isolate the 1080p rendition, and it does not report the 1080p codec |
| Jan 15 2025 | [Google's VP9 VOD guide](https://developers.google.com/media/vp9/settings/vod) (libvpx guidance, not YouTube's ladder) | Targets: 1080p30 1.8 Mbps, 1440p30 6 Mbps, 2160p30 12 Mbps | The step from 1080p to 1440p is 3.3 times the bits for 1.8 times the pixels |

Sources disagree on whether a small channel's 1080p upload ever gets VP9. The 2021–22 forum line says no; Ozer's 2022 recheck says the encodes exist but may not be served; the Oct 2025 listing shows all three codecs on one video. I trust none of them as a 2026 rule: the dated ones are old and the recent ones do not say how popular the video was. This is the first thing the test upload settles (five minutes with Stats for nerds).

### Does uploading above 1080p give a 1080p viewer a better stream?

- **Plausible, not proven for 2026.** The supporting evidence is the 2020 VMAF test (confounded), Gardner's 2026 result that 1080p uploads fared worst, and the unsourced codec claims. I found no 2025–26 test that compares the 1080p rendition of a 1080p upload with the 1080p rendition of a larger upload of the same picture.
- **Certain:** any viewer whose player selects 1440p or 2160p gets several times the bitrate (table above). TVs are now the largest share of YouTube viewing (section 3).
- **Cost** [YT]: "Videos are only eligible for an enhanced bitrate if they were uploaded in 1080p." [Premium benefits](https://support.google.com/youtube/answer/6308116). A 1440p or 4K upload gives up the 1080p Premium option; Premium viewers can pick 1440p or higher instead where their device offers it.
- For us it need not be an upscale. Remotion can re-render type and vectors at true 4K (section 4).

### Enhanced-bitrate tiers

- **1080p Premium** [YT]: higher-bitrate 1080p for Premium subscribers; not on Shorts, live streams, or uploads above or below 1080p. On the one video in the Oct 2025 listing it was about 1.8 times the standard VP9 rate.
- **1080p Enhanced** is a YouTube TV (live TV service) feature, not for uploads. [The FPS Review, Feb 7 2024](https://www.thefpsreview.com/2024/02/07/youtube-tv-adds-1080p-enhanced-option-delivers-our-highest-video-quality/)
- **Super Resolution** (AI upscaling) applies only to uploads below 1080p, with an opt-out. [9to5Google, Oct 29 2025](https://9to5google.com/2025/10/29/youtube-adds-ai-upscaled-super-resolution-for-low-quality-videos/)
- I found no creator-side setting that buys a higher bitrate.

## 2. Grain, banding and flat graphics under compression

### What is published about grain

- **Why grain is expensive.** It is random in space and in time, so prediction from neighbouring pixels and frames fails, and it is high-frequency, so the transform does not compact it. It either survives at a high bit cost or is zeroed and smeared. [Norkin (designer of AV1's grain tool), 2019, *old* but foundational](https://norkin.org/research/film_grain/index.html)
- **How much.** Across about 300 Netflix titles, sending grain as a description instead of as pixels cut average bitrate 36% at 1080p and above, but only about 10% below 1080p, because downscaling had already filtered the grain out. [IBC, Jul 9 2025](https://www.ibc.org/content-management/news/netflix-rolls-out-av1-film-grain-synthesis-for-classic-movies/22018) (Netflix's own post was not retrievable). Two lessons: real grain is roughly a third of the bits at HD, and fine grain does not survive a downscale.
- **Creator and vendor advice** is consistent but thin: on YouTube grain turns into blur or digital noise, and the encoder merges flat areas into bands and blocks; upload a high-bitrate intermediate such as ProRes, at 2K or 4K. [FilmConvert, May 2018, *old*](https://www.filmconvert.com/blog/avoiding-noise-youtube-uploads/); [PremiumBeat, Oct 2017, *old*](https://www.premiumbeat.com/blog/grain-overlays-affecting-youtube-upload/); [RGrain, undated](https://www.rgrain.com/tutorials/retain-the-film-grain-structure-on-vimeo-and-youtube); [Dehancer, undated](https://www.dehancer.com/learn/articles/how-does-film-grain-work-in-dehancer-ofx-plugin). None shows a controlled test.
- **On grain size the sources pull in opposite directions.** PremiumBeat reports a coarse, heavy overlay collapsing and recommends cleaner, finer grain; codec theory says the finest grain is the first thing discarded. Neither is a tested rule. A 2024 editors' thread reaches the same place: add grain only where banding appears after upload, and test with a real upload. [Lightworks forum, Jun 2024](https://forum.lwks.com/threads/considerations-for-automatically-controlling-film-grain-intensity-for-youtube-uploads.251406/)

### What our grain costs [here]

Measured on the `beat3-seg17` list card (flat paper, dark type) and on the full-episode preview render.

| Measure | Result |
|---|---|
| Grain strength on flat paper, lossless frame | About 1 code value out of 255 (high-pass standard deviation 0.95 in luma), plus colour noise of about 0.8. The colour noise comes from the fine grain layer in `Background.tsx`, which is not desaturated |
| The same card as 1080p30 H.264 at CRF 18 (Remotion's default) | 2.5–4 Mbps. Grain strength about halved (0.4–0.5); colour noise gone |
| CRF 14 / CRF 12 | 11 Mbps / 22 Mbps. Grain intact |
| ProRes HQ | 231 Mbps, 4:2:2 10-bit. Grain intact (0.88) |
| Same card rendered at 2x (3840x2160), CRF 18 | 18 Mbps |
| Whole episode preview at CRF 18 (1080p) | 11.5 Mbps average. Light cards 3.7–4.8, dark title cards 13, stills and clips 17.7 average with a 31 Mbps peak |
| Card re-encoded locally: VP9 at 1.5 Mbps / VP9 at 0.7 Mbps / AV1 at 0.5 Mbps | Frame-to-frame grain left: about 40% / 20% / 7% of what the CRF 18 file had. Dark type on paper stayed clean in all three (single frames inspected) |
| Dinner-table still (knit and weave textures, slow push) re-encoded locally: VP9 at 2.0 Mbps / VP9 at 1.0 Mbps / AV1 at 0.6 Mbps | SSIM 0.93 / 0.91 / 0.91 against the source; the knit texture visibly smoothed |

Reading: a near-static card needs about 11 Mbps at 1080p just to carry this grain. YouTube's 1080p stream is roughly a tenth of that (section 1), and its 2160p stream is about 12–17 Mbps for four times the pixels. The grain as designed cannot reach a 1080p viewer, and mostly cannot reach a 4K viewer either. Dark type on paper is robust. The textured stills in motion are where compression will show first.

### Banding

- Banding is false contours where a smooth region is quantised. It is still visible with current codecs, more so on large screens, and its visibility depends on encoder settings and on dither. [CAMBI paper, Netflix, Jan 2021, *old* but foundational](https://arxiv.org/abs/2102.00079)
- The standard fixes are light noise (1–5% in this source), a 16-bit project, and avoiding large soft gradients and lit solid backgrounds for web video. [ProVideo Coalition, Jun 2012, *old*](https://www.provideocoalition.com/remove-banding-in-after-effects/)
- Noise only helps if it survives the delivery encode. Ours largely does not at 1080p [here].
- Flat colour itself does not band. Soft low-contrast gradients do: the vignette in `EditorialSurface`, dimmed hold-under pictures, the wedge on the dark title card. `src/design/motion.ts` already records blurred low-alpha gradients on paper banding into rings after an 8-bit encode.

### 4:2:0 and coloured type

- 4:2:0 keeps brightness at full resolution and one colour sample per 2x2 pixels. YouTube delivers 4:2:0 whatever is uploaded (recommended settings; Gardner's stream metadata).
- Type that differs from its ground mainly in brightness (ink on paper, bone on ink) is carried at full resolution. Type or rules that differ mainly in hue or saturation carry their edges in the half-resolution colour channels and go soft or fringed when thin.
- Chroma subsampling is not visually lossless in every case. [Chan, SMPTE Motion Imaging Journal, May 2008, *old*](https://journal.smpte.org/periodicals/SMPTE%20Motion%20Imaging%20Journal/117/4/17/) (abstract only; the PDF did not parse).
- Practitioner fixes for red type that grows a dark fringe after H.264: lower the saturation 5–10%, add slight noise or a slight blur to the outline. [Adobe forum thread, 2019–2024](https://community.adobe.com/t5/after-effects-discussions/inner-shadow-or-bad-aliasing-black-outline-on-red-text-when-rendered/m-p/10791372) [C]
- For us [inf]: the palette's `goldText` and `dustblueText` are the right choice for small type because they are darker, so they have brightness contrast. Plain gold `#C4A747` on paper, china red, and 1 px coloured rules are the at-risk elements. A coloured stroke about 1.5 px wide (roughly an 18 px regular-weight stem) does not own a full colour sample at 1080p; the same stroke is 3 px in a 2160p stream.

### 8-bit and 10-bit

- YouTube's SDR streams are 8-bit (Gardner 2026). Its recommended settings do not mention bit depth.
- Gardner's 8-bit and 10-bit uploads of the same encode gave mixed results (8-bit better on PSNR and SSIM, worse on VMAF). No clear win.
- [here] Our frames are 8-bit sRGB. Converting 8-bit RGB to 8-bit limited-range YCbCr keeps only 16.5% of RGB colours exactly (counted over all 16.7 million; maximum error 2 levels). In 10-bit YCbCr all of them survive. So a 10-bit master removes one rounding step and hands YouTube our one-level grain intact. It cannot make YouTube's 8-bit output smoother by itself.

### What practitioners recommend for flat graphic work

Pulling the above together (evidence is thin and mostly old): upload above 1080p from a high-bitrate intermediate; avoid large soft gradients; add light noise only where banding shows; desaturate or thicken coloured type; judge on the platform. I found nothing first-hand from motion-design studios on grain settings for YouTube.

## 3. Legibility

### Where YouTube is watched

- In the US, TV overtook mobile as the primary device by watch time as of December 2024, with over a billion hours a day on TV screens. [Neal Mohan, YouTube blog, Feb 11 2025](https://blog.youtube/inside-youtube/our-big-bets-for-2025/) [YT]
- Across 20 countries, TV's share of YouTube viewing time rose from 28% to 35% between January 2024 and December 2025 while mobile fell from 35% to 31%; the remainder (computers, tablets, other) is not broken out. [Digital i, reported by Advanced Television, Jun 3 2026](https://www.advanced-television.com/?p=285968)
- A new channel's own split is unknown until YouTube Studio shows it (Analytics, Audience, Device type).

### Text size

No published minimum exists for 1080p video on phones, as `project/VISUAL_QA.md` already says. The nearest guidance:

| Source | Rule | In a 1080p frame |
|---|---|---|
| [Amazon Fire TV design guide](https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html) (last updated Oct 29 2020, *old*, still live) | Body text at least 14sp, viewed from 10 feet | 28 px |
| [Clearcast, UK legal supers](https://help.clearcast.co.uk/en/article/legal-supers-text-size) (undated; linked files from 2024) | Text height 30 lines preferred; 26 lines on an opaque single-colour block | 26–30 px of letter height, so a larger font size |
| [Android TV typography](https://developer.android.com/design/ui/tv/guides/styles/typography) | Larger type and no thin strokes at distance; no number given on the page | — |
| ISO 9241-303, via secondary sources | Character height 16 arc-minutes minimum, 20–22 preferred | see below |
| [Boccardo et al., PLoS One, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10096186/) (217 people) [M] | People set phone text at a mean of 17 arc-minutes (lower-case height) and hold the phone at 33 cm (under 40) or 40 cm (over 40) | see below |

Our sizes as visual angle [arithmetic; capital height taken as 0.7 of the font size, not re-measured for IBM Plex]:

| Font size in the 1080p frame | Phone, fullscreen landscape, 33 cm | Phone, portrait (video 65 mm wide) | 55-inch TV at 10 ft | 14-inch laptop, fullscreen, 55 cm |
|---|---|---|---|---|
| 18 px (current fail threshold) | 7.9′ | 4.4′ | 9.0′ | 12.7′ |
| 22 px (current warn threshold) | 9.7′ | 5.4′ | 11.0′ | 15.5′ |
| 28 px | 12.3′ | 6.9′ | 14.0′ | 19.8′ |
| 36 px | 15.8′ | 8.9′ | 18.0′ | 25.4′ |

Reading: 18 px text is about 8 arc-minutes on a phone and 9 on a TV, half the ISO minimum, and in portrait it sits at the limit of normal eyesight (a 20/20 letter is 5 arc-minutes). Measured by lower-case height, as Boccardo does, 18 px is about 6 arc-minutes on the phone, a third of what people choose for their own reading. The TV guidance and the phone arithmetic agree on roughly 28 px as the floor for text that has to be read and about 36 px for comfortable reading. The phone's own pixel count is not the limit (a current 6.1-inch phone has about 1,180 pixels on its short side for 1,080 video lines); the angle is. This does not change export settings, but it sets what compression has to protect: at 18 px a stem is one to two pixels wide.

## 4. Remotion specifics for an upload master (4.0.457)

Checked against the installed package, the docs and three test renders.

| Topic | Fact | Source |
|---|---|---|
| H.264 quality | CRF default 18, range 1–51. x264 preset default `medium` (`--x264-preset`). `--video-bitrate` replaces CRF. Hardware acceleration disables CRF | [Encoding guide](https://www.remotion.dev/docs/encoding); installed source |
| ProRes | Profiles proxy, light, standard, hq (default), 4444, 4444-xq. No CRF. [here] `--codec=prores --prores-profile=hq` gives `yuv422p10le`, about 231 Mbps at 1080p30 | [ProRes](https://www.remotion.dev/docs/prores); test render |
| Pixel formats | `yuv420p` (default), `yuv422p`, `yuv444p`, and 10-bit `yuv420p10le`, `yuv422p10le`, `yuv444p10le` | installed source |
| Frame format | Default JPEG at quality 80; our config sets PNG. Docs recommend PNG for colour accuracy | [color-space option](https://www.remotion.dev/docs/options/color-space) |
| Colour tagging | v4 default is the BT.601 matrix; `bt709` exists since 4.0.28 and converts pixels since 4.0.83; v5 makes it the default. [here] A CLI render with our config gives `yuv420p`, limited range, matrix `bt709`, with primaries and transfer left untagged. YouTube assumes BT.709 for untagged values, so this is safe for upload. A stream copy adds the full tags without re-encoding (tested): `ffmpeg -i in.mp4 -c copy -bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1 out.mp4`; for ProRes, `-c copy -color_primaries bt709 -color_trc bt709 -colorspace bt709` | test render; [YT] |
| Config scope | `remotion.config.ts` applies to the CLI only, not to `renderMedia()` | [Config](https://www.remotion.dev/docs/config) |
| Chromium colour | Remotion starts Chrome with `--force-color-profile=srgb`, so frames are sRGB whatever the display profile. Only the matrix is converted, not the tone curve; sRGB and BT.709 curves differ slightly, which can show as shadow contrast on a TV | installed source; [Remotion HDR page](https://www.remotion.dev/docs/hdr); [Canva engineering, Apr 17 2023, *old*](https://www.canva.dev/blog/engineering/a-journey-through-colour-space-with-ffmpeg/) |
| Rendering above 1080p | `--scale` up to 16. It raises the browser's device scale factor, so text, SVG and CSS are drawn at true higher resolution; images gain only if the source is large enough; embedded videos do not gain. Odd sizes are rounded automatically since 4.0.328. [here] `--scale=2` gave 3840x2160 with visibly cleaner type edges; 30 frames took about 97 s against 49 s at 1x, both including bundling | [Scaling](https://www.remotion.dev/docs/scaling); test render |
| Audio | With H.264 the default is AAC at 320 kbps, 48 kHz (`--audio-bitrate`, `--sample-rate` since 4.0.448). With ProRes the default is 16-bit PCM | installed source |
| Keyframes | Remotion passes no GOP settings, so x264 defaults apply (median 8.3 s between keyframes in the preview), not YouTube's suggested half-second closed GOP. YouTube re-encodes everything, so I expect no effect [inf] | `ffprobe` |

## 5. Found in our own pipeline while checking [here]

1. **The stills reach the episode through a low-quality generation.** `tools/ai-video/render_kenburns.py` writes 1920x1080 clips with ffmpeg's default x264 settings (CRF 23, no colour tags). The clips in `public/episodes/ai-care-motives/clips/` run 1.6–7.3 Mbps. FOOTAGE segments are 297 of 679 seconds (44%). The 6688x3764 sources exist in `episodes/ai-care-motives/assets/stills-4k/`. A 4K render cannot sharpen a 1080p clip, and the master re-encodes these clips' compression artefacts with grain on top.
2. **No render on disk carries full BT.709 tags.** The 17:03 full-episode preview is full-range `yuvj420p` with a BT.601 matrix (a `renderMedia()` call that did not pass a colour space; `preview-range.mjs` was changed during this research and the 17:34 preview has the BT.709 matrix). September pilot renders are untagged. Check the master with `ffprobe` before upload.
3. **The grain is two stacked layers**, both refreshed every second frame: `EditorialSurface` (frequency 0.45, 7.2% multiply, desaturated) and `Background` (frequency 1.6, 6% multiply, coloured). The second is per-pixel colour noise, which 4:2:0 and any encoder discard first.
4. **There is no master path for a manifest episode.** `preview-range.mjs` renders in QA mode (no audio, JPEG frames); `render-episode.mjs` is the older per-clip sequence.

## Not verified

- Which codec YouTube will give a 1080p upload from a new channel in October 2026, how long VP9 or AV1 takes to appear, and which codec phone apps are served.
- Whether the 1080p rendition of a 4K upload is better than the 1080p rendition of a 1080p upload of the same picture. No recent isolating test found.
- The bitrate YouTube will actually give our content at each resolution. The Oct 2025 listing is one video.
- Whether YouTube uses AV1 film-grain synthesis on uploads. Nothing found either way.
- Netflix's grain figures at source (blog blocked; taken from IBC). The Netflix CAMBI blog post (blocked; abstract of the paper only).
- Reports I saw only in search summaries and could not open: FilmDaft's counter-examples (a 1440p25 upload shown as H.264), a French ad-clearance rule of 22 px lower-case height, Time's December 2025 figure that half of YouTube viewing is on TV, AV1 becoming the default on Android in 2024, and the ISO 9241-303 wording.
- Any controlled comparison of grain size or strength on YouTube. None found.
- Whether YouTube's audio transcode differs between a PCM and an AAC upload.
- Render time for the whole episode at 2x (only a 30-frame sample), and whether maps or WebGL templates behave at 2x (none are in this episode).
- IBM Plex capital-height ratio (assumed 0.7) and stem width at 18 px (estimated).
- My local re-encodes use libx264, libvpx and SVT-AV1 at fixed bitrates. YouTube's encoders and rate control differ.

## What this changes for us

**Master format.** ProRes 422 HQ from the Remotion CLI (`--codec=prores --prores-profile=hq`, PNG frames and `bt709` from the existing config), 48 kHz PCM audio, then add the full BT.709 tags with a stream copy. It keeps the grain and all 8-bit colours; CRF 18 H.264 does neither. If the picture goes through an NLE, this is also the file to bring in. Confirm with `ffprobe`: `yuv422p10le`, `tv`, `bt709` three times.

**Render resolution.** 3840x2160 with `--scale=2`, not 1.33x: an integer factor keeps 1 px rules sharp. This needs the Ken Burns clips regenerated at 3840x2160 from `stills-4k/` with a high-quality codec (ProRes, or x264 at CRF 12 or lower), or the push done in Remotion from the stills; otherwise 44% of the runtime stays soft 1080p. If the test below shows no gain, fall back to 1080p and keep 1080p Premium eligibility.

**Upload settings.** Upload the 2160p ProRes file if the connection allows (on the order of 60–80 GB for 11 minutes, an estimate; the limit is 256 GB). Otherwise upload an H.264 High, 4:2:0, 8-bit MP4 made from it at CRF 12–14, preset `slow`, moov at the front, AAC-LC 48 kHz stereo at 384 kbps. Do not cap it at YouTube's suggested 35–45 Mbps: going by the card measurements in section 2, that is probably below what our picture needs to arrive intact [inf]. Upload unlisted, wait until 2160p appears in the quality menu, then publish.

**Grain.** Treat it as dither for the encoder, not as a look that viewers at 1080p will see.
- Remove or desaturate the fine coloured layer in `Background.tsx`. It costs bits and cannot survive.
- Keep one layer, the coarser `EditorialSurface` one, at its current strength as the default. At a 2x render its features span about twice as many pixels, which is the best chance it has at 2160p.
- Do not raise the strength to make it survive 1080p. It would have to be several times stronger, and it would then take bits from type and stills (a third of the bitrate is the published figure for real film grain).
- If the paper should feel tactile to phone and laptop viewers, the route to test is a static texture (fixed seed), which costs almost nothing after the first frame, with refreshing grain kept for stills and atmospheric segments.
- Keep soft gradients off flat paper where possible; they are what bands.

**Type.** Not an export setting, but it follows from the same numbers: 18 px is half of every published minimum on phone and TV. Consider 28 px as the floor for anything the viewer must read, and use the text-safe colours for coloured type below about 36 px.

**Test protocol (one session, unlisted uploads).** Build one test clip of about 100 seconds from three ranges of the current manifest, joined with ffmpeg: 52–66 s (still, dark title card, still), 227–240 s (network diagram with thin coloured lines), 355–425 s (quote card, AI clip, type over a dimmed picture, a dissolve, list card, textured still, archival photos, document with small text, coloured numerals). Grain variants need a temporary switch; grain is hard-coded in `FullEpisode.tsx` (`intensity={0.6}`) and `design/motion.ts`.

| Upload | What it is | Question it answers |
|---|---|---|
| A | 1080p, current look, H.264 CRF 12 | Baseline. Which codec does a 1080p upload get on our channel? |
| B | 2160p (`--scale=2`), current look, H.264 CRF 12 | Does a larger upload improve the 1080p stream? What do TV viewers get? |
| C | As B, both grain layers off | Does grain matter at all after YouTube? Does anything band without it? |
| D | As B, one static coarser paper texture at about twice the strength, no refreshing grain | Does a static texture survive where refreshing grain does not? |
| E (optional) | B as ProRes HQ | Is the large upload worth it over H.264 CRF 12? |

What to record, after the top quality has appeared, and again after 24 hours:
1. Desktop Chrome, Stats for nerds, quality forced to 1080p: the codec string for A and for B (`avc1`, `vp09` or `av01`). `yt-dlp -F <url>` lists every rendition with its bitrate without downloading anything.
2. Laptop, fullscreen, 1080p forced, A and B in two tabs: paper flatness (blotches, slow crawl, a pulse every few seconds), the vignette and the dark title card for rings or blocks, gold numerals and thin coloured lines for fringing, the knit and weave textures during the slow push, the dissolve.
3. Phone, YouTube app on Wi-Fi, B: fullscreen landscape on Auto, then portrait. Can the smallest text be read at arm's length? Is any grain visible (expected: no)? Compare B, C and D for whether the paper looks different at all.
4. 4K TV, YouTube app on Auto, from the sofa: A against B (the largest expected difference), then B, C and D for grain, banding on the dark card, and shadow contrast against the laptop.
5. Colour: screenshot the paper and a gold element in YouTube playback on the laptop and compare with a Remotion still using a colour picker (paper `#F5F0E8`, gold `#C4A747`).

Decisions:
- B's 1080p stream is a better codec than A's, or looks cleaner at forced 1080p, or the TV difference is clear: upload 2160p from now on. No visible difference anywhere: stay at 1080p.
- C shows no banding and looks the same as B on phone and laptop: drop refreshing grain on cards. C bands where B does not: keep the single layer as dither.
- D's texture is visible on the TV and laptop and type stays clean: adopt it for paper.
- E looks the same as B: upload H.264.
