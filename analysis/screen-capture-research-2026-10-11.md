# Screen capture: filming pages, papers and interfaces at 2160p

> October 11, 2026. Research by a sub-agent in three parts: the repo as it stands (files read, none changed); web research (text sources; pages fetched directly, with OpenAI's three policy pages and Anthropic's research post read in a browser pane without signing in; search summaries are marked as such); and a local proof using the Playwright already installed, on a text page generated for the test, with no network. Proof files are in the session scratch folder `…/scratchpad/screen-capture-poc/` (about 430 MB), not in the repo. Section 7 is orientation, not legal advice. Prompted by the two empty screen slots in `ai-care-motives` (`beat7-seg41`, `beat7-seg43`).

## Bottom line

The repo can already produce true 3840×2160 footage of a page with exact frame timing, using tools that are installed: drive a headless browser with Playwright, set the page state for each frame, take a screenshot at a device scale factor (the number of physical pixels drawn per CSS pixel; 2 turns a 1920×1080 layout into a 3840×2160 picture), and join the frames with ffmpeg. The local proof captured a 3-second scroll in 14 seconds, and the clip survives a Remotion `--scale=2` render at full resolution. Every real-time recorder checked fails on one or both counts: Playwright's own recorder and the DevTools screencast deliver 1920×1080 pictures as the browser happens to draw them, and a screen recording on this Mac tops out at 3,456 pixels wide.

The two empty slots do not need footage of a live interface. The script asks for a labelled reconstruction of a published exchange, and the published original is a 1650×512 image that cannot be enlarged to a readable size at 2160p. They need a typeset reconstruction, which works today with an existing template; a short capture of the real Anthropic page is an optional opener for the first slot.

## 1. The two slots as the repo has them

1. **Script (`episodes/ai-care-motives/script.md`, Beat 7, v1.7).** Both rows carry `[FOOTAGE: screen]` and a ~12s budget. The first asks for a reconstruction of the published 36 + 59 example, continuously labelled `Illustrative reconstruction · Anthropic, 2025`, built from a sourced excerpt or a marked paraphrase, and says a new chatbot response is not a reproduction of the study. It carries `DIR: hold(until:"carrying the one")`. The second (`[COUNTERPOINT]`) returns to the same reconstruction and must distinguish `Check the arithmetic` from `Explain the computation` without calling all explanations false.
2. **Source.** The claim table and `research/brief.md` (the file `analysis/ai-care-research-brief-2026-10-07.md` is now a one-line pointer to it) name [Anthropic, *Tracing the thoughts of a large language model*](https://www.anthropic.com/research/tracing-thoughts-language-model), March 27, 2025, mental-math section; model Claude 3.5 Haiku. The brief repeats the instruction to use a labelled reconstruction.
3. **What is published (page read Oct 11, 2026).** The section sits at the anchor `#mental-math`. Its second figure is a styled picture of a four-line exchange: the user asks for the sum in one word, the model answers 95, the user asks briefly how, and the model describes adding the ones, carrying the 1, and adding the tens. Its caption is "Claude says it uses the standard algorithm to add two numbers." The image file is 1650×512 pixels (the size is in its file name); the first figure, the pathway diagram, is 1650×855. Body text is 17px in a 640px column; at a 1920px-wide window the section runs about 1,330 CSS pixels and a 68px navigation bar stays pinned to the top. The footer reads © 2026 Anthropic PBC with no reuse licence.
4. **Manifest (`remotion-templates/data/episodes/ai-care-motives/assembly-manifest.json`, hand-wired, timings still estimates).** `beat7-seg41` runs 545.2–557.2s and `beat7-seg43` 569.2–581.2s. Both are `type: FOOTAGE`, `layer: background`, with `asset.source: null` and no file, so `FullEpisode` draws the paper placeholder with the first search term. `seg41` has `narrationGate.word: "carrying the one"`. Between them `beat7-seg42` is the `MathDerivation` card (`carry-the-one.json`); after them `beat7-seg44` dissolves in over 0.5s. Neither slot sets `treatment.opacity`, and a FOOTAGE segment without it renders at 35%; every resolved clip in this manifest sets `opacity: 1`.
5. **Other records.** `footage-manifest.json` ids 6 and 7 and `asset-candidates.md` both list these as a manual capture by Tiger, pending.

## 2. What the repo can already do with a page image

1. **The one existing document shot.** `epa-nov-reveal.json` uses `PrimarySourceReveal` in image mode. Per `visual-spec.md` §14 the image is a 300dpi crop of page 3 of the EPA notice, made by hand from `assets/sourced/doc-epa-nov_epa_2015-09-18.pdf` (no script in the repo produces it). The file is 2230×980. The template fits it into a card at most 1640px wide, multiplies it onto the paper tone, fades its top and bottom edges, pushes in 2.5% over the hold, and wipes two hand-placed highlight boxes (in percent of the image) across the sentence at 3.2s and 3.65s. The `text` field holds the transcript.
2. **Its resolution ceiling.** `pdfimages` shows the PDF is a 200ppi scan (1700×2200 per page, no text layer), so the 300dpi crop is already enlarged 1.5×. At a 2160p render the card is 3,280 pixels wide, about 2.2× the scan's own pixels. That is the scan's limit, not a fault in the method.
3. **`PrimarySourceReveal` text mode** typesets a passage and lays timed annotations over exact substrings: underline, circle, highlight, strike, margin note, translation, footnote number.
4. **`ScrollyReveal` and `AnnotatedZoom`** pan and zoom an image through timed steps (scale up to 2.5 and 5; `AnnotatedZoom` allows eight regions, labels and a crosshair). Both draw the image through `BrandImage` with a duotone ramp (there is no untreated option), at 70% opacity, cropped to fill 16:9. A white page of text would be tinted, dimmed and cropped.
5. **What none of them do.** Continuous scrolling of a tall page, moving between regions of a document in image mode, a cursor, typing, or anything driven by a live page.
6. **A captured clip drops in.** A FOOTAGE segment plays its file through `OffthreadVideo`, full frame; the duotone filter in `BrandImage` is applied only to its own image, not to the video (code read).
7. **Doctrine.**
   - `project/SCRIPT_FORMAT.md` defines `[FOOTAGE: screen]` as recordings of actual interfaces, valued because they were really run, treated with light grain and a vignette and never a full duotone. An older block in the same file specifies screenshots as `TEMPLATE: IMAGE … TREATMENT: editorial, COMPOSITE: inset @ 80%`, which would duotone them. The two disagree.
   - `project/VISUAL_LANGUAGE.md` routes any actual software interface to Footage.
   - `analysis/ai-imagery-trust-research-2026-10-10.md`: illustrate, never evidence. Published experiments keep real documents, footage and labelled reconstructions.
   - `analysis/youtube-encoding-research-2026-10-10.md` and `project/VISUAL_QA.md`: master at 3840×2160 with `--scale=2`; text below 28px on a 1080p frame is a warning and below 18px a failure; thin coloured strokes soften in delivery.

## 3. Capture tooling already installed

| Item | State |
|---|---|
| Playwright | `playwright` 1.59.1 in `remotion-templates` (declared `^1.40.0`). No Puppeteer. No Python Playwright. |
| Browsers | Playwright cache: Chrome for Testing 151 (full and headless shell, build 1234). Remotion's own headless shell 149 in `node_modules/.remotion`. Google Chrome 154 in Applications. |
| Mismatch | Playwright 1.59.1 looks for build 1217, so a plain `chromium.launch()` fails. The repo's test setup already works round this by finding a binary in the cache and passing its path. |
| ffmpeg | 8.1.1 (Homebrew); Playwright's bundled recorder ffmpeg; Remotion's compositor ffmpeg. |
| PDF | poppler 26.07 (`pdftoppm`, `pdfimages`). No `pdfjs-dist`, no `sharp`. |
| `tools/` | Nothing for screen or page capture. `scripts/snapshot.mjs` renders our own compositions only. |
| Displays | Built-in 3456×2234, external 3440×1440. Neither is 3,840 pixels wide. |

## 4. Local proof

Machine: Apple M4 Max. Page: 17,068 CSS pixels of generated text, body 28px, viewport 1920×1080 at factor 2 unless stated.

| Test | Result |
|---|---|
| 3s eased scroll, 90 frames, `page.screenshot` PNG | 3840×2160 frames in 13.9s (155 ms a frame), 54 MB |
| Same call through raw DevTools with its speed flag | 63 ms a frame (10-frame sample, still page). It returns 1920×1080 unless `clip.scale` is 2 |
| ffmpeg to H.264, CRF 12, 30fps, BT.709 | 6s to encode; 16.2 MB (43 Mbps); SSIM 0.9995 against the PNGs |
| ffmpeg to ProRes 422 HQ | 5.6s; 131 MB |
| Sharpness (crops viewed) | Text is drawn at true double resolution; the same frame captured at factor 1 and enlarged is visibly softer; the H.264 frame is indistinguishable from the PNG |
| Scroll precision | The browser snaps scroll, and plain CSS transforms on text, to whole device pixels. Text is crisp on every frame; a move slower than one pixel a frame will step |
| Playwright `recordVideo` | VP8, 25fps, 1.46 Mbps at 1080p. Asked for 3840×2160 at factor 2, it wrote a 3840×2160 file with the page at 1920×1080 in one corner and grey around it |
| DevTools screencast | 1920×1080 frames at factor 2; 261 frames in 3s, 5 to 117 ms apart |
| Full-page still | 3840×34,136 in 2.5s (9.2 MB), correct to the last line. Chrome then refused to decode it as one image. Cut into eight 3840×4320 tiles it loads in 0.4s, and the stack moves in sub-pixel steps with slight softening while it moves |
| Other sizes | 1097×617 at factor 3.5, 1280×720 at 3 and 960×540 at 4 all give 3840×2160 (110–125 ms a frame). 1920×1080 at factor 4 gives 7680×4320 (349 ms) |
| Typing plus a drawn cursor, stepped per frame | 60 frames at 74 ms each |
| A page that animates itself (one CSS animation, one script loop) | Stepped with Playwright's clock and by seeking the page's animations: positions advance exactly one frame at a time; two runs identical |
| Clip inside Remotion | A 1920×1080 composition holding the 2160p clip in `OffthreadVideo`, rendered as a still at `--scale=2`: 3840×2160, SSIM 0.999 against the source frame, and the right frame |

Side effect: the Remotion still wrote a 90 MB bundler cache folder under `remotion-templates/node_modules/.cache/webpack/`. It was moved to the scratch folder; nothing else in the repo was touched.

## 5. Capture methods and their limits

| Method | Exact frame timing | True 2160p text | Notes |
|---|---|---|---|
| Screenshot per frame at a device scale factor | Yes | Yes | Verified in §4. `scale: "device"` is Playwright's default (installed type definitions). |
| One tall still or PDF page, camera moved in Remotion | Yes | Yes, up to the still's own pixels | Sub-pixel motion works on images. Tall stills need tiling (§4). |
| Playwright `recordVideo` and `page.screencast` | No | No | Size defaults to the viewport scaled into 800×800 ([docs](https://playwright.dev/docs/videos), read Oct 11, 2026). Installed source fixes 25fps, VP8 and a 1 Mbit target. A request to expose quality settings was closed as a duplicate on May 12, 2026 ([issue 31424](https://github.com/microsoft/playwright/issues/31424)). Version 1.64 adds an `fps` option and VP9 ([release notes](https://playwright.dev/docs/release-notes)). `page.screencast` (since 1.59) hands out JPEG frames ([API](https://playwright.dev/docs/api/class-screencast)). |
| DevTools `Page.startScreencast` | No | No (§4) | Frames arrive when the browser happens to draw. |
| DevTools `HeadlessExperimental.beginFrame` | Yes | Not tested | One frame per call with the compositor paused; experimental ([protocol mirror](https://cdpstatus.reactnative.dev/devtools-protocol/tot/HeadlessExperimental)). HeyGen reports it works only on Linux and that they fall back to plain screenshots on macOS ([HeyGen, Jun 22, 2026](https://www.heygen.com/research/html-to-video)). |
| Replacing the page's clock | Yes | Yes | Replit swaps timers, animation frames and the date for a clock that advances one frame at a time, and seeks CSS animations ([Replit, Feb 26, 2026](https://replit.com/blog/browsers-dont-want-to-be-cameras)). Playwright's [clock](https://playwright.dev/docs/clock) covers the same script functions; `timecut` does it for Puppeteer and says CSS animations are not handled ([README](https://github.com/tungs/timecut)). |
| Puppeteer `page.screencast` | No (real time, 30fps default) | Unknown | WebM by default, quality as a rate factor, a `scale` option ([docs, v25.13.0](https://pptr.dev/api/puppeteer.screencastoptions)). Not installed. |
| A live page inside Remotion (`<IFrame>`) | No | Yes | Waits for load, but the page must not animate ([docs](https://www.remotion.dev/docs/iframe)). Remotion renders frames in parallel tabs, out of order ([docs](https://www.remotion.dev/docs/flickering)), so a scroll or click cannot carry from one frame to the next, and every render depends on the network. |
| macOS screen recording | No | No, on this Mac | The Screenshot toolbar and QuickTime offer no resolution or frame-rate control, only SDR H.264 or HDR HEVC on recent macOS ([Apple, Sep 14, 2026](https://support.apple.com/en-us/102618)). ScreenCaptureKit exposes width, height, minimum frame interval and cursor visibility to apps ([Apple](https://developer.apple.com/documentation/screencapturekit/scstreamconfiguration)); OBS captures through it ([OBS](https://obsproject.com/kb/macos-screen-capture-source)). The displays cap a recording at 3,456 pixels wide. |

Three practical limits that apply to the first two methods:

1. **Pictures inside a page do not gain from the scale factor.** Remotion's own [scaling page](https://www.remotion.dev/docs/scaling) says the same of images and video. The Anthropic figures are 1,650 pixels wide.
2. **Web body text is too small at a full-width window.** 16–17px text on a 1920-wide layout is 16–17px on a 1080p frame, under the failure line. Keep the window to about 1920 × (body size ÷ 28) CSS pixels wide (1,097 for 16px, 1,166 for 17px) and raise the scale factor to reach 3,840. Narrow windows can trigger a site's tablet layout.
3. **A headless browser draws no cursor.** One has to be drawn by the capture script or added in Remotion.

## 6. How people who make these films work

1. **Screen-based feature films rebuild the screen; they do not record it.** The editors of *Searching* said screen recordings would have pixelated on close shots, so the windows were redrawn, mostly as vector artwork, and animated; camera moves were keyframes on a nested picture of the whole desktop; cursor paths were drawn by hand, with pauses used to show hesitation ([Frame.io, Sep 10, 2018](https://blog.frame.io/2018/09/10/made-in-frame-searching/)). *Missing* worked the same way: temporary screenshots replaced by high-resolution artwork, a wide desktop nested and punched in ([Frame.io, Jan 23, 2023](https://blog.frame.io/2023/01/23/made-in-frame-missing-movie/)).
2. **The screen-film rules are about honesty to the device.** Bekmambetov's manifesto asks for one screen, real time, sound that comes from the computer, a constant frame, and a cursor that carries the character's state of mind ([MovieMaker, Apr 22, 2015](https://moviemaker.com/unfriended-rules-of-the-screenmovie-a-manifesto-for-the-digital-age/)). It says nothing about zoom.
3. **Desktop documentary treats searching as the argument.** Kevin B. Lee describes recording his screen while arranging windows and coming to see the desktop as both screen and camera ([True/False, Apr 30, 2015](https://truefalse.org/exploring-virtual-space-talking-transformers-the-premake-with-kevin-b-lee/)). Later scholarship lists typing, clicking, dragging and resizing as the form's gestures ([Lee and Avissar, NECSUS, Jun 7, 2023](https://necsus-ejms.org/desktop-documentary-as-scholarly-subjectivity-five-approaches/)). Neither gives guidance on zoom, hold length or legibility.
4. **One current first-hand account from an explainer.** Vox producer Nate Krieger prints documents and films his hands pointing at and circling details, in preference to zooming in the edit; avoids pictures that only repeat the narration; and gives every on-screen action a sound ([Press Club Institute, Jul 21, 2026](https://www.pressclubinstitute.org/2026/07/21/vox-video-producer-nate-krieger-on-how-to-create-engaging-visual-journalism/)).
5. **No first-hand account exists, that I could find, for how any YouTube essay or AI explainer channel captures papers and interfaces.** Searches for Johnny Harris, Wendover, LEMMiNO, Cleo Abram and paper-reading AI channels returned tutorials and template sellers only.
6. **How long to hold text.** The nearest published standard is subtitling: Netflix allows up to 20 characters a second for adults, 17 for children, and 42 characters a line ([English style guide, change log to Dec 19, 2025](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide)). A 200-character passage therefore needs about 10 seconds if the viewer must read all of it; the EPA card holds 9.5s for a 199-character sentence, of which 84 characters are highlighted. A highlight shortens the reading, because the viewer reads only the highlight.
7. **Readable on a phone.** Nothing new beyond our own 28px floor. Applied to captures it means choosing the window width before capture (§5), since enlarging afterwards costs sharpness.

## 7. Rights and terms (orientation only)

1. **Fair use is a four-factor judgment made case by case, with no safe amount** ([US Copyright Office, updated Jul 2026](https://www.copyright.gov/fair-use/)). Criticism and comment are named purposes. YouTube says only courts decide, and that credit or a disclaimer does not make a use fair ([YouTube Help, read Oct 11, 2026](https://support.google.com/youtube/answer/9783148)). UK fair dealing covers criticism, review and quotation and requires sufficient acknowledgement ([GOV.UK, Jan 4, 2021](https://www.gov.uk/guidance/exceptions-to-copyright)).
2. **Documentary practice.** The filmmakers' statement accepts copyrighted material shown as the object of critique or quoted to illustrate a point, if attributed, no longer than needed, and not a substitute for the original ([CMSI, Nov 2005](https://cmsimpact.org/code/documentary-filmmakers-statement-of-best-practices-in-fair-use/)).
3. **arXiv papers carry one of six licences; the common one grants nothing to third parties** ([arXiv licences](https://info.arxiv.org/help/license/index.html); [arXiv on reuse](https://info.arxiv.org/help/license/reuse.html)). For this episode (abstract pages read Oct 11, 2026):

   | Paper | Licence | Meaning |
   |---|---|---|
   | [Needham et al., 2505.23836 v3](https://arxiv.org/abs/2505.23836) | CC BY 4.0 | Pages and figures may be shown and adapted with credit, a licence link and a note of changes ([deed](https://creativecommons.org/licenses/by/4.0/)) |
   | [Sharma et al., 2310.13548 v4](https://arxiv.org/abs/2310.13548) | CC BY 4.0 | Same |
   | [Greenblatt et al., 2412.14093 v2](https://arxiv.org/abs/2412.14093) | arXiv non-exclusive | No reuse grant; showing a page rests on fair use or the authors' permission |

   All three have an arXiv HTML version, which captures as a web page with real text.
4. **Lab pages.** Anthropic's research post shows a copyright line and no licence; the companion paper on transformer-circuits.pub shows no licence statement in the text fetched.
5. **Provider terms: outputs are yours, the interface is not addressed, scripts are restricted.**
   - *Anthropic.* The [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) (effective Oct 8, 2025) assign outputs to the user, say nothing about recording or screenshots, prohibit scraping and access by bot or script other than through an API key, and require written permission to use the name or logos for other products or in a way that implies endorsement. The [trademark guidelines](https://www.anthropic.com/legal/trademark-guidelines) (effective Aug 1, 2024) allow marks only as approved, unaltered, and do not mention screenshots.
   - *OpenAI.* The [Terms of Use](https://openai.com/policies/terms-of-use/) (effective Jan 1, 2026) give the user ownership of output, prohibit automatic or programmatic extraction of data or output and passing output off as human-made, and bind users to the [sharing policy](https://openai.com/policies/sharing-publication-policy/) (updated Nov 14, 2022): posting your own prompts and completions and livestreaming are generally permitted if you review them, attribute them to yourself and make plain they are AI-generated. The [brand page](https://openai.com/brand/) covers logos and model names; its visible text does not mention interface screenshots.
   - *Google* (search summary): unaltered Search screenshots for instructional use need no permission; nothing found for Gemini. Its [books and media page](https://partnermarketinghub.withgoogle.com/brands/google/use-cases/books-and-media/) asks for an attribution line with product visuals and no implied endorsement.
6. **Model output itself probably has no US copyright.** The Copyright Office's report on copyrightability came out January 29, 2025 ([copyright.gov](https://www.copyright.gov/ai/)); the Supreme Court declined on March 2, 2026 to hear the case on works without a human author ([SCOTUSblog](https://www.scotusblog.com/cases/case-files/thaler-v-perlmutter/)). The lab's page, its figures and its interface design are protected in the ordinary way.
7. **Changed in 2025–2026:** the two terms versions above, the Supreme Court denial, and Playwright's recorder. I found nothing that moves the baseline for showing pages in commentary; the large 2025 rulings concern training, not display.

## Not verified

- The layout of the Anthropic post at any window width other than 1920.
- The exact wording of the exchange in the companion paper (seen only through a fetch summary, where the first prompt has its two sentences in the other order), and whether an interactive graph for this prompt is public.
- Whether a single scripted load of a public anthropic.com research page counts as the automated access its Consumer Terms prohibit. `robots.txt` on that site allows everything.
- `HeadlessExperimental.beginFrame` on macOS; Puppeteer's screencast; Playwright 1.64's recorder beyond its release notes.
- The 16,384-pixel ceiling on full-page screenshots: vendor blogs only, and not reproduced here.
- Where Chrome's image-decode limit lies: 17 megapixels loaded, 131 did not.
- `pdftoppm` at 600 or 1200dpi on an arXiv PDF: not run.
- How `PrimarySourceReveal` text mode looks with the four-line exchange and two margin notes: not rendered.
- Screen Studio's features (automatic zoom on clicks, cursor smoothing, export to 4K at 60fps), Google's screenshot rule, variable frame rate in QuickTime recordings (forum threads from 2017–2022), and a quotation attributed to *Missing*'s editors in Variety: search summaries only.
- The collapsed sections of OpenAI's brand page; OpenAI's EU and business terms; Anthropic's usage policy and commercial terms; Google's Gemini terms.
- The BBC subtitle guidelines (fetch refused) and Lee's 2015 Sussex masterclass (audio only).

## What this changes for us

### Recommended method

**(a) Documents and papers: do not film them. Rasterise the page once and move the camera in Remotion.**
- From a PDF with real text, `pdftoppm -r 600 -png`, cropped to the passage. The document card is 3,280 pixels wide in a 2160p render, so 600dpi covers a passage up to about 5.5 inches wide; use 1200dpi with crop flags for a single column, and never load a whole page at that size.
- Show it with `PrimarySourceReveal` image mode, as the EPA card does.
- Scans stay at their scan resolution. The EPA page is already past its own.
- Gap: image mode cannot move between regions. A paper that needs title, then abstract, then a table is three cards today, or a small addition of timed focus steps to image mode. `ScrollyReveal` and `AnnotatedZoom` are not usable for pages until they can skip the duotone, the dimming and the crop.

**(b) Long web pages: frame-by-frame screenshots at a device scale factor, joined at 30fps.**
- Window width from the text-size rule in §5, scale factor to reach 3,840.
- Scroll position computed per frame from an easing curve; nothing depends on the wall clock.
- For a hold with a slow push, capture one still, or one at double size, and let Remotion do the push.
- Save a full-page still, the address and the capture time with every clip. Pages change, and the record is our backstage proof.

**(c) Interactive interfaces: three cases.**
- *Public page, no account* (interactive research pages): the same tool with scripted steps, a drawn cursor, and the page's clock stepped one frame at a time. If the page draws to a canvas or plays video that will not step, record it in real time.
- *Product behind an account* (Claude, ChatGPT, Gemini): Tiger records by hand, in real time. No scripts: both sets of terms restrict them and the channel should not automate a signed-in session. Raise the browser zoom until text passes 28px, convert to a constant 30fps, and use the result as an inset or accept an enlargement of about 1.1× from this Mac's display. Label model output as AI-generated on screen; OpenAI's sharing policy asks for it and it costs nothing elsewhere.
- *A published exchange we did not run:* a reconstruction, typeset in our own type and labelled. Do not imitate the product's interface or use its logo.

### The smallest tool

A Node script beside the other render scripts, `remotion-templates/scripts/capture-page.mjs`, using the installed Playwright with an explicit browser path (the cached headless shell, or Remotion's).

- **Input:** one small JSON file per shot, kept with the episode (for example `episodes/<slug>/captures/<id>.json`): address or local file, window size, scale factor, duration, selectors to hide, and a timeline of steps (scroll to a selector over N seconds, hold, move the cursor, click, type).
- **Output:** `public/episodes/<slug>/clips/screen-<id>.mp4` at 3840×2160, 30fps, H.264 CRF 12 with BT.709 tags, which a FOOTAGE segment plays as it is; plus a sidecar with the address, capture time, browser version and a hash, and a full-page still saved under `assets/sourced/`.
- **Housekeeping it must do:** wait for fonts, scroll the page once to load lazy images, hide pinned bars and consent banners by selector, switch off the page's own animations unless they are the subject.
- **Place in the pipeline:** asset sourcing, after visual-spec. It resolves `[FOOTAGE: screen]` rows the way stock clips are resolved. A move tied to a spoken word must be re-captured after narration is recorded; that is about a minute per 12-second shot at the speeds measured.
- **Size of the work (estimate):** the scroll-and-hold core with housekeeping and the record is roughly 200–300 lines, half a day including one real page. Cursor, click, typing and clock stepping are about as much again. The proof scripts in the scratch folder already contain the frame loop, the encode settings and the stepping test.

### The two slots

**What both must show.** The four-line exchange from the second figure of the mental-math section, re-typeset in channel type with speaker labels (User; Claude 3.5 Haiku), the label `Illustrative reconstruction · Anthropic, 2025` on screen throughout, and a source line naming the post and its date. Copy the four lines from the figure when building; do not paraphrase them and do not take them from a new chat. The real figure cannot be the readable shot: at 1,650 pixels wide its lettering would be far under the text floor, or blurred if enlarged.

**How to build them: as cards, with `PrimarySourceReveal` text mode.** This works today, keeps the timing in JSON where narration re-timing can move it, and cannot be mistaken for a recording of a session we ran. It needs two data files and, in the manifest, a change of both segments from FOOTAGE to TEMPLATE. If the look of a screen is wanted instead, the same content can be a local HTML page captured with the tool into two clips; then set `asset.file`, `status: "resolved"` and `treatment.opacity: 1` on the existing segments.

| | `beat7-seg41` (12s) | `beat7-seg43` (12s) |
|---|---|---|
| Content | The exchange builds line by line | The complete exchange returns; no retyping |
| Motion | First question from 0.7s; the answer 95; the second question as the narration reaches the sum; the model's explanation appears whole; the phrase about carrying the 1 is highlighted on the gate word and held. No scroll; the house push at most | The tag `Check the arithmetic` attaches to the two sums in the explanation (they are correct). Then `Explain the computation` attaches to the claimed method, styled as an open question and not as an error. Hold, then the existing 0.5s dissolve into `seg44` |
| Colour | Use the red already used for the carried 1 in `carry-the-one.json`, so the next card picks it up | Same |
| Text size | The template sets 44px for a passage up to 200 characters and 34px up to 400 (code read); keep the label at 28px or more and put it in the title block so it is there from the first frames | Same |

**Optional opener for `seg41`, the only real screen footage in the episode (3 to 3.5s).**
- Capture `https://www.anthropic.com/research/tracing-thoughts-language-model#mental-math` at a 1097×617 window and scale factor 3.5 (body text about 30px on the 1080p frame).
- Start with the top of the second figure in the lower third, drift down 200–300 CSS pixels over 2.5s until the figure is centred, hold, then cut to the reconstruction with the exchange in the same place.
- Add a source line in Remotion naming the site and the publication date. The figure will be enlarged about 1.4× and slightly soft, which is acceptable for a shot that establishes where the exchange comes from.

**What blocks them.**
1. Nothing blocks the card version except authoring the two data files and the manifest change, which belongs to the session that owns the hand-wired manifest.
2. The opener needs the tool built, `seg41` split in two, and the script row reworded, since the real page is not a reconstruction and must not carry that label.
3. The opener also needs a decision on the scripted page load (see Not verified). Loading the page by hand and capturing a saved local copy avoids the question.
4. Timings are estimates until narration is recorded; the gate word will move.
5. `footage-manifest.json` ids 6 and 7 and `asset-candidates.md` still say manual capture and should be updated to whichever route is chosen.
6. `SCRIPT_FORMAT.md` should settle its two conflicting treatments for screen material, and say whether a typeset reconstruction keeps the `[FOOTAGE: screen]` tag or becomes `[MG:]`.
