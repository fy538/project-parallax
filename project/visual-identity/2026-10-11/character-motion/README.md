# Parallax: three character motion studies

October 11, 2026

[Watch all three in the gallery](index.html#results) · [Frame review](review.json) · [Video settings and exact commands](trials.json) · [Image prompts and attempts](studies.json) · [All identity directions](../../2026-10-10/all-directions.md)

All three original clips are generated. **The coin exchange is the strongest action prototype. The head turn violates the featureless-face rule; the original pull exposes weak hand/arm anatomy and sliding support.** The rebuilt pull still pair also remains rejected because its hand ownership and effort are unclear. The painted medium survives the trials, while face and contact control still need further motion testing.

## Rebuilt river-pull stills rejected

[Why the rebuild failed and what to test](qa/assisted-pull/prompting-research.md) · [Compare original and rebuilt poses](qa/assisted-pull/rebuild.html) · [Enlarge the new hands and arms](qa/assisted-pull/rebuilt-detail.html) · [Exact prompts, references and retained attempts](rebuild.json)

| New starting pose | New supported ending pose |
| --- | --- |
| [Rebuilt start](03-pull-start-v2.png) | [Rebuilt end](03-pull-end-v3.png) |

The rebuilt pair exposes both forearms and uses a mutual wrist grip guided by a [photographed hand reference](https://wholebeinginstitute.com/courageous-act/). The user rejected it: palms, thumbs, fingers and wrist transitions still form a difficult-to-read cluster. The ending prompt explicitly preserved this grip as “correctly drawn,” carrying the defect forward while the right person's body rose. Earlier claims that the hands and arms were clearly readable were too generous. The photograph supplies no whole-body pose and its own overlap is difficult to translate into flat painted shapes. It remains an anatomy input, not part of the delivered gallery.

The [research and test plan](qa/assisted-pull/prompting-research.md) separates observed failures from hypotheses, audits the exact prompts and cites official prompting guidance, hand-generation papers and animator practice. The next useful test compares a simple pose study with and without a matched whole-pose reference, then checks whether the painted treatment preserves the selected anatomy. No new images or videos were generated for this research.

These are **new stills only**. The existing MP4 below uses the original source poses. No new fal.ai generation was submitted. A future motion test still needs to inspect contact, fingers and weight throughout the rise. The generated pair is closely matched, not pixel-locked.

## First video results

| Study | Clip | What worked | What needs work |
| --- | --- | --- | --- |
| Head turn | [MP4](clips/01-head-turn.mp4) | Head turns to profile; torso, framing and hair identity remain broadly stable. | A nose-like contour appears around 1.5–2.5 s, with inner-ear detail during the turn. The late profile cleans up. This take fails the face rule. |
| Two-coin exchange | [MP4](clips/02-coin-exchange.mp4) | Both coins remain readable as the adult lowers and rolls the hand, places them in the child’s palm, then withdraws empty. | Fine finger shapes change during contact. Ear marks already present in the source remain; window figures drift slightly. Strong action result, with visual cleanup still needed. |
| Supported pull | [MP4](clips/03-assisted-pull.mp4) | The right person rises, contact persists and knee support becomes readable around 3 s. | Both original poses have an ambiguous merged grip; the ending pose obscures the helper’s forearm. The free palm also slides and the weight shift is restrained. The original source and the rebuilt pair above were both rejected. |

No clip is signed off as a final production shot. In particular, a successful action does not override the rule against eyes, nose, mouth or inner-ear anatomy. A closer review found ear marks in the shop and river source images: those need correction at the reference stage as well as control during video generation.

### Source anatomy correction

The user flagged strange arms and hands in the pull picture. [This enlarged comparison](qa/assisted-pull/anatomy.html) shows the problem in both submitted stills: the two palms and wrapping fingers merge into one difficult-to-read shape. In the ending pose, the helper’s forearm is swallowed by the sleeve, making the arm chain look shortened. The generated frame at 3 s preserves the ambiguity. My earlier “coherent limb ownership” assessment checked continuity too generously and is revised in [review.json](review.json). The subsequent rebuilt pair also failed still review; neither assessment changes the old video record.

**Working visual rule: believable anatomy and physical relationships underneath the painted style.** Before animation, trace each figure’s shoulder → elbow → wrist → palm; check whose fingers are visible and how they wrap; check that joint angles, foreshortening and support make the action readable. If overlapping limbs obscure these relationships, restage the picture or use a clearly posed reference. Featureless heads and unequal painted planes remain part of the identity.

### Review evidence

| Study | Full frame sequence | Detail sequence | Consecutive frames |
| --- | --- | --- | --- |
| Head | [Full frames](qa/head-turn/full.html) | [Face detail](qa/head-turn/detail.html) | [1.25–2.208 s](qa/head-turn/dense-1.html), [2.25–2.5 s](qa/head-turn/dense-2.html) |
| Coins | [Full frames](qa/coin-exchange/full.html) | [Hand detail](qa/coin-exchange/detail.html) | [1.75–2.708 s](qa/coin-exchange/dense-1.html), [2.75–3.708 s](qa/coin-exchange/dense-2.html), [3.75 s](qa/coin-exchange/dense-3.html) |
| Pull | [Full frames](qa/assisted-pull/full.html) | [Grip and support detail](qa/assisted-pull/detail.html), [original anatomy close-ups](qa/assisted-pull/anatomy.html) | — |

Review uses 22 decoded frames per clip at quarter-second intervals plus the final video frame, with closer consecutive-frame inspection of the head contour and coin contact. The pull is sampled, not certified frame by frame. Native players in the gallery let you judge timing and pacing at normal speed. Small texture flicker and brief faults outside the inspected intervals may remain.

## What this means for the identity

The combination of uneven painted face planes, selective hair/clothing detail and broad backgrounds can support meaningful character movement. We do not need to retreat to static people on the strength of these first takes. The coin exchange is especially useful evidence because the objects visibly cross between hands.

Source drawing and motion control both need attention. The rebuilt pair exposes forearms but still fails hand ownership and coordinated effort; it must not be used as an accepted source for another motion test. A second difficulty is control: a blank face in two endpoints does not keep the model from inventing anatomy between them, and a supported ending pose does not enforce fixed contact through a pull. Before another paid batch, revise the character reference to remove all ear marks, design a clearer smooth head contour through intermediate views, and show distinct palm planting/replanting when a hand must change position. Keep the painted identity; change one motion variable at a time.

This is one take per scene from one model. It does not establish a model-wide success rate, compare providers, or prove that this identity animates more reliably than the other directions. Broader style exploration and the earlier locally authored reveal tests remain separate evidence.

## Generation record

- Provider/model: fal.ai, `minimax/h3-max/image-to-video`.
- One take per study, five seconds requested, 1080P; six selected start/end PNGs and three exact motion prompts supplied.
- Seed 41111; prompt expansion disabled; no retries.
- Actual files: **1916 × 1080, 24 fps, 124 video frames, 5.184 s container duration** each. Width follows the supplied image aspect ratio.
- Raw outputs contain audio; gallery players default to muted. The originals are retained without audio removal, retiming or visual cleanup.
- User approved fal.ai uploads and a **$2 total cap**. Estimated cost **$0.48 each / $1.44 total** at the October 11 published rate. A provider billing receipt was not returned.
- Request IDs, commands, sidecars and generation logs: [trials.json](trials.json).
- Motion prompts: [head turn](prompts/01-head-turn.txt), [coin transfer](prompts/02-coin-exchange.txt), [assisted pull](prompts/03-assisted-pull.txt).

Pricing and accepted fields were verified against the [fal.ai model page](https://fal.ai/models/minimax/h3-max/image-to-video) and [API schema](https://fal.ai/models/minimax/h3-max/image-to-video/api). The advertised promotional 1080P rate is $0.096/second through October 15. Recheck before any later submission. The provider documents that output may run about 0.7 seconds longer than requested and that 1080P is refined from native 768P.

## Key poses and provenance

![Six selected key poses](key-pose-overview.png)

| Test | Starting pose | Target ending pose |
| --- | --- | --- |
| Head turn | [Front view](01-head-start.png) | [Left-facing profile](01-head-end.png) |
| Coin exchange | [Two coins in adult palm](02-coins-start.png) | [Two coins in child palm](02-coins-end.png) |
| Assisted pull | [Braced starting grip](03-pull-start.png) | [Supported rise onto bank](03-pull-end.png) |

All new painted assets were made with the built-in image tool, whose model version and seed are not exposed. [studies.json](studies.json) retains seven image generations/edits and the unchanged source-image copy, including two superseded attempts, references and exact prompts. The first head profile had inner-ear anatomy; its correction was the submitted endpoint. The first pull endpoint had ambiguous knee contact; its correction was submitted. The coin starting pose is an unmodified copy of the selected bakery image. Starting and ending poses are close generated matches, not pixel-identical controlled edits.

[Preflight](preflight.json) records dimensions and hashes for the six submitted frames. [Media checks](media-checks.json) and [postflight checks](postflight-checks.json) confirm readable video streams, actual resolution and basic file health; they do not judge the animation. [render-gallery.cjs](render-gallery.cjs) recreates native contact-sheet screenshots and checks the gallery’s six images, three video metadata loads, enlargement and desktop/mobile overflow. Results are saved in [gallery-checks.json](gallery-checks.json).

This batch does not run the older rich/selective-desk trials. No production manifest or existing source asset was replaced. Gallery styling uses the canonical Parallax palette; Arial is the local fallback for intended Plex typography.

## Completed pose reference test

[The new comparison gallery](pose-first-test/index.html) retains nine outputs: two text-only pose studies, two with a whole-body photograph, three painted/head passes and two river-context passes. The reference-based studies have simpler contact arrangements in this small batch. The painted scene still fails the featureless-head rule and needs contact review and quieter scenery; none is production- or animation-approved. No new video was generated. [Findings and exact prompts](pose-first-test/README.md).
