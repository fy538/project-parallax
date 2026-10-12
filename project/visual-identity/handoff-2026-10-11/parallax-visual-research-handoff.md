# Parallax visual research handoff

**Research period:** October 10 and 11 2026, America New York time. The final Remotion work occurred on October 12 UTC but October 11 locally. Earlier episode-image work is included as background and is not counted as work from these two days.

**Prepared for:** Another agent reviewing the creative direction, technical progress and next experiments. **Prepared by:** Codex from the Visual Research conversation and saved project artifacts. **Repository:** `/Users/feihuyan/project-parallax`. **Conversation:** `01a126bb-ab38-7011-956c-716c88861642`.

## 1 Current position and purpose of this handoff

The leading working direction is painted constructivism with featureless faceted people, selective detail, quieter environments and occasional purposeful surrealism. The user likes the underlying constructivist language and has responded positively to richer painted facial form, while repeatedly rejecting literal facial anatomy. The most promising recurring storytelling operation is a change of viewpoint that reveals a relationship. This is a direction under development, not a final channel identity or a set of production-approved assets.

Over these two days we moved from a broad survey of alternatives to several connected tests: thirteen alternative illustration directions, five surreal mechanisms, refinements of the preferred face treatment, contemporary scenes, character sheets, an episode board, three spatial reveals, a fourteen-second authored reveal, three paid image-to-video character trials, a rejected anatomy rebuild, nine pose-reference experiments, eight Remotion studies of scenery and objects, and a twenty-six-second combined Remotion sequence.

The work now establishes useful visual ingredients and demonstrates that paintings can coexist with exact authored graphics. It provides limited evidence that the painted characters can perform actions. It does not establish repeatable generation, comparative animation reliability across styles or models, distinctive audience recognition, or a complete production workflow. The strongest action result is the two-coin transfer. The hardest unresolved problems are featureless profiles during motion, readable interacting hands and convincing shared effort.

The incoming agent should review the actual images and clips, challenge the current shortlist, identify which elements belong in one system and propose a small set of decisive next tests. Preserve the user's face constraint and the rejected status of the pull attempts. A successful render, attractive texture or continued contact between hands is insufficient evidence of a usable shot.

### Suggested first reading route

1. Read this document, especially Sections 2, 10, 13 and 16.
2. Browse the [complete alternative-direction index](../2026-10-10/all-directions.md), which now links the subsequent studies.
3. Inspect the [liked faceted face](../2026-10-10/context-tests/02c-desk-faceted-face.png) and [corrected constructivist shadow scene](../2026-10-10/surrealism-variations/s04e-constructivist-shadows-featureless.png).
4. Watch the [fourteen-second opening-panel proof](../2026-10-10/reveal-comparisons/index.html) and the [three character-motion trials](../2026-10-11/character-motion/index.html).
5. Review the [pull prompt audit](../2026-10-11/character-motion/qa/assisted-pull/prompting-research.md) and [nine-image pose comparison](../2026-10-11/character-motion/pose-first-test/index.html).
6. Compare the [eight scenery object overlay and background studies](../2026-10-11/world-objects-overlays/index.html), then watch the [combined twenty-six-second sequence](../2026-10-11/combined-sequence/index.html).

## 2 User brief and preferences that must carry forward

The user opened this fork to explore an artsy identity that feels designed, differentiated and less recognizably AI generated, without becoming photorealistic. They liked the constructivist direction already in use and wanted credible alternatives, rather than an assumption that the existing look must remain unchanged. They also wanted research into what makes an illustrated image suitable for image-to-video and which drawing choices support animation.

The user explicitly chose **a mix of motion including more ambitious movement when the story needs it**. Do not reduce the project brief to camera pushes on still people. Quiet holds and exact diagram animation are useful, but physical action remains an intended capability.

The user repeatedly asked for more detail. Their corrections establish the distinction that matters: more facial form is welcome, but eyes, nose, mouth and other facial parts are not. When a bread edit became too realistic and a face edit introduced features, the user rejected those changes. After the stronger asymmetric face planes in `02c-desk-faceted-face.png`, they replied “better.” After the corrected constructivist shadow scene, they said “i think this is better.” These are positive preferences for those treatments, not blanket production approvals for every derivative.

The face rule developed into the following working constraint: no eyes, eyebrows, eyelids or eye sockets; no nose, nostrils or nasal ridge; no mouth, lips or teeth; no inner-ear lines or holes. Profiles must avoid nose or lip protrusions. Shadows and reflections need the same review. A simple filled outer ear silhouette may remain. Richness comes from unequal painted planes, contour, light, brush marks and head volume. Facial anatomy cannot be reintroduced to make a particular motion tool easier to use.

The user's later concern about the two-person pull adds an equally important requirement: ordinary anatomy and physical relationships must be believable underneath the stylization. A painted figure can have an anonymous faceted head while retaining coherent shoulders, elbows, wrists, palms, legs and support. “Realistic” in that correction meant structurally plausible, not photographic rendering.

The user also wanted a complete place to inspect the work. An early index included only five generated directions and eight researched references; they noticed the mismatch and requested completion. The full thirteen-direction sample gallery was then created. Maintain complete galleries and retain unsuccessful attempts with clear status rather than silently showing only successes.

## 3 Episode and repository context

The experiments use `ai-care-motives`, whose production title is **The Unwatched Test: Trusting an AI You Can't Check**, as a narrative test bed. The current script file identifies itself as v1.7 from October 8 2026, with eight beats, approximately 1499 spoken words and a target of ten to twelve minutes. It explicitly says that the revision is not recording-locked. The hand-wired assembly manifest currently has `handWired: true` and `totalDurationSec: 678.6`; that duration is not evidence of final narration alignment.

The editorial distinction is that helpful conduct, moral credit and justified reliance can come apart. The recurring shop encounter presents the same fair transaction under different explanations, including duty and prudence or reputation. The rescue distinguishes the benefit of help from admiration for its motive. Changes in the surrounding street establish social context; an empty street asks what happens when perceived assessment is absent. Visuals must not quietly supply an answer that the argument has left open.

The earlier [ChatGPT prompt document](../../../episodes/ai-care-motives/prompts/chatgpt-prompts.md) is a baseline source. It contains twelve still-image prompts and a two-tier reference workflow. It dates its narration reconciliation to script v1.5 on October 8 and contains older motion assumptions. This fork's new boards and research reference v1.7. Do not treat the old prompt header as the latest technical or editorial specification.

Before this two-day exploration, twelve episode stills were generated across dinner, shop, river, rating-card, ring, notes and desk/window motifs. The inherited conversation also records three revised stills for the dinner, rating-card and outlined-figure images. Those are background assets, not newly demonstrated animation work from October 10 and 11. Existing production images remain under `episodes/ai-care-motives/assets/`; the new exploration is primarily under the two dated `project/visual-identity/` directories.

Parallax combines Markdown content, Python pipeline tools and Remotion React video templates. Read [AGENTS](../../../AGENTS.md), then [CLAUDE](../../../CLAUDE.md), and the [Remotion context](../../../remotion-templates/CLAUDE.md) before changing production code. The palette is defined in [palette JSON](../../../tools/brand-treatment/palette.json) and consumed by [theme TS](../../../remotion-templates/src/design/theme.ts). Current typography uses IBM Plex Sans for headings and body, IBM Plex Mono for metadata, IBM Plex Serif for long prose and JetBrains Mono for data. Earlier HTML proofs use Arial as a local fallback; the new Remotion studies use shared Plex tokens.

The original prompt block says “no realistic anatomy” while rejecting a realist medium. That wording conflicts with the user's demand for plausible body structure. Future briefs should say anatomically coherent bodies and contact rendered in matte painted planes with featureless heads. The prompt audit found that the disputed phrase was not present in the failed rebuild prompts; it is a documentation conflict, not a demonstrated cause of those failures.

## 4 Broad survey of alternative identities

The [main gallery](../2026-10-10/all-directions.md) contains thirteen alternative directions alongside the existing constructivist baseline. Fourteen selected images appear because risograph includes an initial and revised version. There are sixteen root PNGs in the directory, including retained earlier architectural and pinscreen attempts. These numbers describe gallery and archive contents, not independent experiments or a generation success rate.

The first five directions were generated first. Eight additional directions were initially researched without generated samples, then completed after the user's request. The [first brief](../2026-10-10/README.md), [additional research](../2026-10-10/additional-directions.md), [main provenance](../2026-10-10/studies.json) and [additional provenance](../2026-10-10/additional-studies.json) preserve the development.

### Modern woodcut

[Sample](../2026-10-10/01-modern-woodcut.png). Broad carved marks, strong dark masses, angular architecture and more organic people provide continuity with constructivism. It was an early candidate for keeping graphic authority while adding a handmade surface. The sample can feel nostalgic, and dense gouges could crawl during movement. Neither the animation risk nor a reliability advantage was measured.

### Layered paper theatre

[Sample](../2026-10-10/02-paper-theatre.png). Matte silhouettes, shallow stage depth and overlapping scenery suggest an identity in which layers shift as an argument changes viewpoint. This was the initial leading recommendation. Its risks are storybook gentleness and AI inflation of flat paper into soft three-dimensional forms. The generated sample is flattened; it does not contain editable character or scenery layers. Lotte Reiniger's articulated silhouettes provide an artistic precedent, not validation of current AI video performance.

### Charcoal with spot color

[Sample](../2026-10-10/03-charcoal-spot-color.png). Searching contours, a few dark masses, clear paper and one accent give this option a reflective and observant character. The assistant judged it especially strong in human feeling. Fine marks may boil or disappear, and the scene needs a deliberate mark vocabulary to avoid generic sketchbook illustration. No animation trial of this direction was run.

### Editorial gouache

[Sample](../2026-10-10/04-editorial-gouache.png). Opaque paint and warm observation offer humane storytelling, but the result risks familiar illustrated-book territory. The sample also merges the adult's resting hands. That defect matters because an attractive medium cannot excuse unclear anatomy before animation. The style remains a reference alternative rather than the current leading system.

### Graphic risograph

[Revised sample](../2026-10-10/05b-graphic-risograph.png) and [first attempt](../2026-10-10/05-two-color-risograph.png). Indigo and vermilion, strong silhouettes, sparse marks and empty paper gave the revised version the clearest immediate color departure in the first batch. The first version leaned toward vintage textured illustration. The revision changed both palette and shape language, so a preference cannot be attributed to printing style alone. Character proportions and line endings would need development to avoid generic editorial vector art.

### Modernist cel animation

[Sample](../2026-10-10/06-modernist-cel.png). UPA informed the exploration of irregular ink contours, simplified settings, expressive poses and broad color fields. It offers an explicit motion language for entering, hesitating and reaching. The sample has a strong retro character, which could become another familiar genre unless proportions, contours and geometry become specific to Parallax. A still inspired by animation is not evidence that the drawing animates well in an AI model.

### Conceptual line drawing

[Sample](../2026-10-10/07-conceptual-line.png). Steinberg's use of drawing as reasoning suggested contours that extend, connect, erase or change role during an explanation. Precise logical changes suit authored animation. The direction remains valuable as an analytical layer inside the leading painted system. Its risks are stock whiteboard-explainer conventions and unstable fine lines under generative motion.

### Architectural surrealism

[Selected sample](../2026-10-10/08b-architectural-surrealism-flat.png). Simplified architecture, purposeful contradictions, strong shadows and shifting viewpoints became a particularly relevant candidate. The initial assistant shortlist paired it with paper theatre. The opportunity is to let space carry a philosophical relationship, while keeping people emotionally present. Generic uncanny stairs or arbitrary perspective distortions would weaken the argument. The earlier more descriptive attempt remains in the archive.

### Ink wash with crisp figures

[Sample](../2026-10-10/09-ink-wash-crisp-figures.png). Tyrus Wong's atmospheric restraint informed broad washes and empty space around more sharply drawn people. The direction suggested a useful division between quiet environments and consequential detail. It risks decorative generic watercolor. A future controlled scene would need distinct figure and atmosphere layers if their movement must be exact.

### Drawn surreal collage

[Sample](../2026-10-10/10-drawn-surreal-collage.png). Max Ernst's recombined printed illustrations informed coherent drawn fragments, changes of scale and domestic scenes opening into institutional or analytical spaces. The current sample emphasizes printed surface and cut boundaries more than a strong spatial transformation. Dense engraving and unrelated symbolic fragments could overwhelm both the argument and temporal stability.

### Rotoscope inspired editorial drawing

[Sample](../2026-10-10/11-rotoscope-inspired-editorial.png). Flat Black Films and TED-Ed supplied precedents for translating observed performance into selected lines and painted planes. This remains a candidate workflow for difficult body movement because performance can be established first. The generated sample was not traced from footage. AI restyling, traditional rotoscoping and a simple video filter are different processes and should not be treated as interchangeable evidence.

### Pinscreen inspired tonal worlds

[Selected sample](../2026-10-10/12b-pinscreen-tonal-world-simplified.png). Jacques Drouin and NFB references suggested velvety monochrome, luminous edges and soft relief. A first version was too photographic; the simplified version is retained as the selected sample. This could suit reflective or unsettling passages. Tonal texture may become noisy fog, and precise contact is a separate challenge. No physical pinscreen production or AI video trial was performed.

### Paint on glass

[Sample](../2026-10-10/13-paint-on-glass.png). Caroline Leaf's practice suggested broad revised paint marks and one image becoming another. It could support transitions in which an interpretation changes. The generated sample simulates the appearance of paint on glass; it is not a record of that physical technique. Artistically changing marks do not justify arbitrary AI warping, and recurring characters would require a consistency method.

Additional references included Bauhaus theatre for geometric bodies and spatial choreography, and direct-film abstraction for line, color and rhythmic transitions. These were researched precedents, not additional completed Parallax identity studies. The historical references and exact source links remain in the two research briefs.

## 5 Surreal mechanisms and the return to constructivism

The [five surrealism variations](../2026-10-10/surrealism-variations/README.md) used the same broad shop encounter but varied staging, so they are exploratory proposals rather than a controlled medium comparison. Their warmer ink-drawn people, blue ivory copper palette and gentler tone differed from the current constructivist work.

| Mechanism | What the image explores | Main unresolved issue |
| --- | --- | --- |
| Quiet impossible architecture | A warm encounter in skewed geometric space | The contradiction is subtle and may read as ordinary design |
| Folded space | A counter rises into a fold beneath the loaf | A physical fold reads more clearly than simultaneous viewpoints |
| Monumental distance | A vast room and long counter separate the people | Human intimacy decreases as scale increases |
| Independent shadows | Real hands remain apart while wall shadows meet | Narration must define the interpretation the shadow represents |
| Continuous surfaces | Counter wall and window frame share a surface | Material continuity needs a clearer change of meaning in motion |

Independent shadows was judged the clearest immediate storytelling mechanism. Continuous surfaces was a promising recurring operation. Quiet architecture remained useful as an everyday baseline so surreal moments would retain emphasis.

The direct [shadow comparison](../2026-10-10/surrealism-variations/shadow-comparison.md) then translated the blue scene into the constructivist palette and shapes. The assistant judged constructivism stronger as the overall identity and the surreal studies stronger as a source of narrative operations. The user liked that combination and asked for more detail.

The refinement chain is important. `s04b` established the constructivist rendering. `s04c` added seams, buttons, grouped hair, hand contours and joinery. `s04d` made the loaf more painted but also added eyes and mouth marks; the user corrected this. `s04e` restored featureless heads modeled through painted planes and became the preferred baseline. The earlier face-feature attempt remains explicitly superseded.

The broader research later identified nose-like and lip-like notches in the shadow silhouettes themselves. The face constraint therefore cannot be checked only on the foreground heads. The connecting shadows also carry an editorial risk: they can suggest real care or a known motive unless narration frames them as a possible interpretation. They should not serve as evidence of an unseen mental state.

## 6 Contemporary scenes texture and the preferred face

The [context studies](../2026-10-10/context-tests/README.md) moved beyond the bakery into a contemporary desk, dinner and river rescue. Four scene/texture tests were followed by two face refinements. Exact inputs and prompts are in [the manifest](../2026-10-10/context-tests/studies.json).

The rich desk and selective desk form an edit-based comparison with broadly preserved figure, furniture and lighting. Reducing fine marks on the desktop and dark wall gave the figure greater presence in the assistant's assessment. The amber vertical plane stayed textured, so this was a selective reduction rather than a fully flat version. The desk's continuous wall can read as an ordinary curved corner; the proposed surreal operation was not yet unmistakable.

`02b-desk-featureless-detail.png` added a lighter edge and stronger broad tonal form. `02c-desk-faceted-face.png` went further with asymmetric angular light and shadow planes. The user's “better” response makes `02c` the strongest explicit face reference from this conversation. It is a reference for how richness can exist without facial parts, not a guarantee that every generated derivative complies.

The dinner scene tested attention and hesitation through forward lean and a paused hand. The rescue tested urgency through bracing, a diagonal bank and connected hands. The rescue needed a face correction, and the generated grip was a hand/wrist clasp rather than the reciprocal forearm grip originally requested. Its mechanics were already noted as needing scrutiny. The exterior also retained more small landscape marks than intended.

Three five-second motion tests were proposed for rich desk, selective desk and rescue, with the desk pair sharing prompt and seed. **Those older trials remain unrun.** They are not the three videos later generated on October 11. Consequently, we have no controlled motion evidence that reducing texture improves this identity's temporal stability. The proposed settings and prompts remain under `context-tests/motion/`.

## 7 Research into character space detail and movement

The [visual language research](../2026-10-10/visual-language-research.md) addressed four related areas: consistent characters, composition, distribution of facets and surreal storytelling. It used museum, animator, studio, research-paper and official-tool references. The artistic applications were proposals; the source material did not rank our generated identities by animation reliability.

For characters, the proposed anchors were head proportions, hair mass and hairline, neck length, shoulder width, body proportions and clothing. The head's unequal planes should describe a turning volume, rather than become permanent colored identity patches. Fixed graphic patches versus coherently repainted planes under new lighting remains an unrun comparison. Bodies need expressive silhouettes, clear lines of action and believable weight because facial expression is unavailable.

For composition, the research proposed close encounters, small people in large systems, groups with different attitudes, daylight, obstructed views and contemporary institutions. Daylight was subsequently tested; a controlled set covering all six compositions was not. Distinctiveness should survive thumbnail reduction and removal of grain. Strong focal relationships and quieter surrounding fields are more important than making every object equally elaborate.

For facets, Feininger's related planes suggested three treatments: local facets concentrated in people, a few related architectural/light planes, and extensive facets across the scene. The assistant preferred the middle proposal, but a controlled three-way comparison was not completed. Keep material differences between skin, cloth, wood and empty space; uniform triangles across every surface risk flattening the hierarchy.

For surrealism, Magritte, De Chirico, Escher and Steinberg supplied different mechanisms. The preferred Parallax application was one deliberate contradiction tied to a change in the argument. The research recommended establishing enough ordinary reality for the change to matter and allowing a recognition hold. A wider view should add context while leaving the original event understandable.

The animation research separated input-image design from motion prompting. Official Runway guidance assigned composition, subjects, light and style primarily to the starting image and recommended beginning with essential movement. Input flaws can intensify. VBench++ distinguishes consistency, flicker, smoothness and dynamic degree; a nearly frozen clip can be stable without completing an action. VBench 2.0 treats human fidelity, physics and controllability separately. These support review categories, not a claim that our preferred style is easiest to animate.

Movement-first restyling with Runway Aleph or Luma Ray3 Modify remained an option to test for ambitious actions. Runway Act-Two's published preference for defined eyes and mouth conflicted with this identity's featureless design, so it was not a straightforward recommended solution. No Aleph, Luma or Act-Two experiment was run in this conversation.

The initial proposed two-style video comparison would use three takes for each of three tasks: quiet camera movement, one gesture and a contact transfer. That eighteen-clip comparison was not executed. The actual later paid batch was one take of each of three different scenes in one style and one model.

## 8 Character sheets and six frame episode board

The [character and storyboard gallery](../2026-10-10/character-and-storyboard/index.html) developed the preferred faceted desk figure into five head views and three acting poses, then tested scenes and analytical graphics across a six-frame board. The [README](../2026-10-10/character-and-storyboard/README.md) and [provenance](../2026-10-10/character-and-storyboard/studies.json) preserve selected and superseded attempts.

The five views are front, three-quarter, a more side-on view, looking up and looking down. The side-on view still needs a stricter ninety-degree profile. This is not the eight-view model sheet originally proposed in the research. Hair, neck and clothing provide continuity; the sheet is not yet a complete production turnaround.

The three poses intend to communicate listening, hesitation and determination through lean, shoulders and hand spacing. Those readings have not been tested with uncaptioned viewers. The study suggests an acting vocabulary, but its labels are intended readings rather than measured audience recognition.

| Board frame | Narrative job | Method and qualification |
| --- | --- | --- |
| Ordinary help | Usual price and correct change | Generated shop scene with selected painted detail |
| Two accounts | Different explanations of identical conduct | The exact same selected PNG is repeated in both typeset panels |
| Surrounding street | Show social context around the transaction | Generated wider scene that reads chiefly as an ordinary cutaway |
| A fact about the street | Customers neighbors and competitor | Authored SVG diagram showing context rather than hidden motive |
| Watching removed | Ask about behavior without perceived assessment | Close generated foreground match with empty street and no supplied outcome |
| Return to the viewer | Broaden the identity into contemporary daylight | Generated daylight desk with quieter walls |

The board samples different beats of v1.7; it is not six consecutive shots, a finished edit or a replacement for the production visual specification. The identical-image two-accounts comparison is a particularly sound editorial choice because interpretations change while visible behavior stays literally fixed. The empty-street edit is closely matched but not pixel-identical.

HTML and SVG supplied the analytical frames; Playwright rendered them. Preview checks covered six board frames, eight gallery images, enlargement and desktop/mobile overflow. These checks establish file and interface health, not character consistency or audience response.

## 9 Spatial reveals and the fourteen second authored proof

The [reveal comparison](../2026-10-10/reveal-comparisons/index.html) addressed the previous street cutaway's weak surreal reading. It compared three endpoints using the same shop transaction as the common before image: an opening window-wall like a painted page, a counter that becomes street paving, and an ordinary wider architectural view.

The assistant preferred the opening panel because its material change is more explicit. The continuous counter gives a strong connection to the street but can read as a raised walkway. The ordinary wider view is a useful baseline for deciding whether surrealism adds anything. A first opening-panel image contained an extra coin-like disk and was corrected; the first attempt remains archived.

The [fourteen-second silent clip](../2026-10-10/reveal-comparisons/opening-panel-motion.mp4) holds the transaction for two seconds, pulls back and opens the page during seconds two through six, holds the social setting through eight, dips briefly through ink, and reveals the street diagram from 8.5 seconds through the end. It is 1920 by 1080 at 24 fps.

This proof used a separately generated backing plate, transparent page and transparent foreground. HTML Canvas and SVG authored the camera, page mesh and diagram; Playwright exported frames and FFmpeg encoded them. It is not a Remotion composition and it is not AI image-to-video. Characters remain still. The layers are close generated matches rather than an exact segmentation of the original.

The moving plane approximates a hinge and a painted reverse side, not every diagonal crease in the selected endpoint. It may still read as a door instead of folded paper. Several earlier recording approaches stalled or produced unusable startup/blank frames; the final direct-canvas export supersedes those attempts. The generation manifest and render logs preserve that history.

One automatic postflight compared the short proof against the full episode's 678.6 seconds and therefore was not the right duration test. Separate clip postflight and video checks verified the fourteen-second deliverable. Do not misread the episode-duration log as proof the final clip is corrupt, or ignore the earlier rejected recording attempts.

## 10 Three actual character motion trials

The [October 11 gallery](../2026-10-11/character-motion/index.html) contains three completed fal.ai trials: a front-to-profile head turn, a two-coin hand transfer and a supported river pull. Six selected start/end PNGs and three motion prompts were prepared. The source still work included seven generation/edit outputs plus one unchanged bakery-image copy, with superseded attempts retained.

The user explicitly approved uploads of those six frames and three prompts with a two-dollar total cap and no automatic retries. One generation per scene was submitted through `minimax/h3-max/image-to-video`, requesting five seconds at 1080P, seed 41111 and prompt expansion disabled. All three completed, with no retries. [Trial records](../2026-10-11/character-motion/trials.json) include commands, request IDs and log paths.

The historical price check was 0.096 dollars per requested second, or an estimated 0.48 dollars each and 1.44 dollars total. This is an estimate; no billing receipt was returned. The recorded promotional price ended October 15 and must not be assumed for later work. That approval covered this particular three-job batch; it is not a continuing budget for another provider, payload or retries.

Actual output files are 1916 by 1080, 24 fps, 124 frames and 5.184 seconds container duration. Width follows the supplied aspect ratio. Raw files contain audio, while gallery players default to muted. The originals were kept without audio removal, retiming or image cleanup. Use actual media metadata rather than silently describing these as exact 1920-wide five-second deliverables.

### Head turn

The torso, framing and hair identity remain broadly stable, and the head reaches a profile. However, a nose-like contour appears around 1.5 to 2.5 seconds and inner-ear detail appears during the turn. The late profile is cleaner. This take fails the face requirement even though the intended turn occurs. Featureless endpoints did not constrain all intermediate views.

### Two coin exchange

The adult lowers and rolls the hand, places both coins in the child's palm and withdraws empty. The visible transfer is the strongest action evidence in the batch. Fine finger shapes change at contact, existing source ear marks remain and distant window figures drift. This is a promising prototype, not a final approved shot or a general guarantee of correct hand interaction.

### Supported pull

The right person rises and contact continues; knee support becomes readable around three seconds. The supporting free palm slides and the weight shift is restrained. Subsequent close review found the original source grip ambiguous in both stills and the helper's forearm obscured in the ending. The generated motion preserves that ambiguity. The source pair was rejected, and the old MP4 still uses those original sources.

The initial review was too generous about coherent hand/arm ownership. It was corrected after the user identified the problem. The [current review JSON](../2026-10-11/character-motion/review.json), [anatomy comparison](../2026-10-11/character-motion/qa/assisted-pull/anatomy.html) and later README carry the correction. Do not reuse an earlier positive sentence as the current verdict.

Review inspected twenty-two decoded frames per clip at quarter-second intervals plus the final frame, with dense consecutive-frame inspection around head and coin-contact problems. The pull was sampled rather than certified at every frame. Normal-speed playback is available. No clip is signed off for final production, and one take per scene does not establish success rates or provider/style comparisons.

## 11 Rejected pull rebuild and prompting lessons

The user asked for the pull to be rebuilt. Seven generation/edit attempts produced a new start and supported ending, including exposed forearms, a mutual wrist grip, ear cleanup, knee placement and several hand corrections. A photographed grip was used as an anatomy input. The user rejected the rebuilt pair too. The current [rebuild record](../2026-10-11/character-motion/rebuild.json) marks it rejected after user review, with production and animation acceptance both false.

The central defect is ownership. Palms, thumbs, fingers and wrist transitions form a similarly colored cluster that is difficult to trace to the two forearms. Exposing skin improves visibility but does not solve the connected geometry. The helper remains nearly unchanged while the other person's body rises, so effort and counterweight read weakly. Contact points can exist while the coordinated action remains unconvincing.

The [prompt audit](../2026-10-11/character-motion/qa/assisted-pull/prompting-research.md) identifies a clear avoidable error: the ending prompt called the starting grip “EXACT correctly drawn” and instructed the model not to redraw or simplify it. That protected the very defect still under review. Other edits fixed shoulders, elbows and forearm positions while asking for new wrists or raised support, leaving little freedom to reconstruct a coherent linked pose.

The workflow also changed from a one-way wrist hold to a reciprocal grip. A close-up hand photograph provided a genuine reference but little information about shoulders, elbows, torso, feet or load. Its own overlap was difficult to translate into flatter painted shapes. Long descriptions of fingers did not supply their projected geometry. The audited prompts ranged from approximately 296 to 547 words, but length was not isolated experimentally and cannot be named as the sole cause.

The research cited HandRefiner for articulated-hand and occlusion difficulties, HanDiffuser for explicit body/hand representations, ControlNet for spatial conditioning, GNOCHI for coordinated close interaction, official image prompting guidance for clear reference roles and bounded edits, and animator tutorials for weight and readable poses. These sources support structural guidance and better staging. They do not prove that a particular model architecture or unseen training-data problem caused our outputs, or that one tool will automatically fix them.

The working correction is to solve a whole pose with quiet rendering first, inspect both arm chains and contact, apply the painted identity separately, then add scenery. Allow linked limbs to change together. Preserve anatomy only after it passes review. A maintained grip relationship may move through space; it need not remain at identical screen coordinates while the bodies rise. No new fal.ai video was generated for the rebuilt pair.

## 12 Nine image pose reference experiment

The subsequent [pose-first gallery](../2026-10-11/character-motion/pose-first-test/index.html) ran a small practical comparison. Two text-only monochrome pose outputs were followed by two outputs using the same prompt plus a whole-body reference. A selected reference-based image then received painted style, head corrections and river context. [Provenance](../2026-10-11/character-motion/pose-first-test/studies.json) contains nine outputs, prompts, references, hashes and statuses.

| Stage | Observed result | Current status |
| --- | --- | --- |
| A1 and A2 text only | Arm paths and footing read but clasp has extra finger-like rows | Rejected contact |
| B1 and B2 whole pose reference | Simpler two-hand arrangements and more traceable wrists | B1 selected only for style testing |
| C1 painted treatment | Overall pose largely survives with nose-like contours and ear anatomy | Superseded head failure |
| C2 head edit | Defects change very little | Failed correction |
| C3 broader head redraw | Some softening but enlarged faces still fail | Partial correction |
| D1 river context | Boots stone and bank make assistance legible but faces fail and scenery is busy | Preferred scene only for further review |
| D2 another head reference | Larger planes with persistent or clearer profile and ear defects | Failed correction |

The whole-body reference was [Helping Hand on Old Rag](https://commons.wikimedia.org/wiki/File:Helping_Hand_on_Old_Rag_(22310055090).jpg), credited to Shenandoah National Park and Katy Cain. Commons lists CC BY 2.0 and also US public-domain status as an NPS work. The unmodified input is saved under `pose-first-test/references/old-rag-pose.jpg`; preserve its attribution and source record.

This reference changes the action. It shows an assisted step with both feet supported, not the original suspended river pull. D1 places a rear boot on a shallow stone and a front boot on the bank. It cannot be presented as solving the original rescue unchanged. A suspended action needs a corresponding reference and support design.

The comparison has only two candidates per starting condition and no exposed shared seed. Its reference-based grips appear simpler in this small batch, but no general success rate or controlled causal advantage is established. The later style and context passes are sequential edits, not independent samples. No output is approved for production or animation, and no ending pose or new video was made. Repeated small verbal head corrections did not solve the face requirement.

## 13 Scenery objects overlays and backgrounds

The user then asked to broaden the system beyond people, specifically mentioning overlays, scenery, objects and backgrounds that work with Remotion. The [eight-study gallery](../2026-10-11/world-objects-overlays/index.html) compares four pairs, each with a settled frame and a six-second authored Remotion clip. Seven raster outputs were generated: six source paintings plus one retained architectural revision. The two overlay treatments are code-native graphics over the same scene.

| Pair | Change tested | Assistant assessment and limit |
| --- | --- | --- |
| Scenery 01 and 02 | Descriptive river landscape versus architectural theatre | Architecture is the stronger graphic fit; natural scenery is busier and more familiar |
| Objects 03 and 04 | Ordinary ochre cup versus cup with impossible stairs and interior | Cutaway is distinctive; ceramic shading is more detailed than the characters |
| Overlays 05 and 06 | Drawn analytical leaders versus theatrical foreground wings | Analytical drawing is more broadly useful; foreground wings can feel imposed |
| Backgrounds 07 and 08 | Light versus dark painted fields beneath one synthetic chart | Light is immediately reusable; dark may need less texture for dense information |

The first architectural scenery edit remained too descriptive. `02b-architectural-scenery.png` is the selected revision for study 02, with spare banks, a slab bridge, piers and distant cuboids. It has four visible piers despite a prompt asking for three. This is a useful count-compliance limitation to retain. The prior edit remains archived rather than disappearing from the record.

Both cups are 1536 by 1024 RGBA cutouts. Their alpha channels are preserved and were tested on light and dark backgrounds. A halo apparent in a raw preview is absent in the tested composites; no programmatic image cleanup was applied. The ordinary and cutaway source margins differ, so the Remotion entry normalizes visible size and foot position. The impossible interior is an intentional metaphor, not a factual mechanism.

The scenery is flattened. Study 05 adds exact line drawing and labels to a fixed painting. Study 06 adds authored side wings and a wash; it does not create true depth layers inside the source scene. The chart in studies 07 and 08 uses explicitly synthetic C 80, B 60 and A 35 values to compare layout and contrast. Those numbers are not episode evidence and must not be reused as factual data.

All eight clips are 1920 by 1080, 30 fps, 180 frames and six seconds, picture only. Motion, shadows, overlays, type and chart reveals are authored in Remotion 4.0.457. No AI image-to-video or fal.ai job was used. [Exact prompts and hashes](../2026-10-11/world-objects-overlays/studies.json), [alpha checks](../2026-10-11/world-objects-overlays/qa/alpha.html) and [QA report](../2026-10-11/world-objects-overlays/qa/report.md) provide evidence.

Architectural theatre, occasional impossible objects, restrained analytical drawing and the light paper field are the assistant's strongest recommendations from this batch. The user authorized making the experiments and moving on to an integration test; they have not selected every recommendation as a permanent channel rule.

## 14 Combined twenty six second Remotion sequence

The [combined study](../2026-10-11/combined-sequence/index.html) makes the proposed synergy concrete. It reuses the ordinary cup, architectural cup and light background without pixel edits or new generation. A single painted paper field connects four beats. The [timing and draft narration](../2026-10-11/combined-sequence/story.json), [source hashes](../2026-10-11/combined-sequence/provenance.json) and [source entry](../../../remotion-templates/research/combined-sequence/entry.tsx) are saved.

| Time | Picture and authored motion | Intended meaning |
| --- | --- | --- |
| 0 to 6 seconds | Ordinary cup arrives with the headline An act we can see | Establish an observable outward event |
| 6 to 11 seconds | Direct editorial cut to the cup interior with A reason we infer | Introduce a possible unseen explanation |
| 11 to 18 seconds | Cup settles smaller and two leaders distinguish observation and interpretation | Make the limit of the metaphor explicit |
| 18 to 26 seconds | Cup moves left and concern and incentive converge on a helpful act | Different possible reasons can produce the same result |

The first frame review tightened two details before the full render: the opening cup was reduced to leave room below the headline, and the diagram reveals were accelerated enough to leave approximately 2.3 seconds of settled final hold. A contact shadow was positioned beneath the cup's foot. The cup replacement is a cut between similar generated silhouettes, not a morph or continuous opening animation.

The clip is 1920 by 1080, 30 fps, 780 frames and twenty-six seconds. It is intentionally picture only. Optional narration cues are a draft read-through aid, not a recorded track, word alignment or an adopted revision of the episode script. Concern and incentive are illustrative possibilities that may overlap; they are not exhaustive categories or a diagnosis of AI motives. The interior is explicitly imagined.

The file uses H.264 CRF 16, PNG intermediates, yuv420p and limited-range BT.709. The isolated TypeScript entry passed typecheck. Full video decode passed; four decoded beat frames matched direct Remotion PNGs with mean RGB error around 0.9 to 1.03 out of 255. Gallery checks verified actual playback advancement after all four chapter jumps, image enlargement, Escape close, working local links and no desktop/mobile horizontal overflow. [QA record](../2026-10-11/combined-sequence/qa/report.md) distinguishes those technical checks from visual judgment.

The assistant's current judgment is that the painting and precise explanation graphics feel coherent. Consistency with the flatter faceted characters remains unresolved. Scenery was deliberately omitted from this first combined sequence to let one object carry the thought; scenery integration and recorded narration remain further tests. The user has seen the deliverable and asked for this handoff, but has not yet given a specific final aesthetic verdict on the combined clip.

## 15 How the work fits the Remotion system

There is a practical division of responsibilities. Generated paintings supply the material appearance, scenes, people and conceptual objects. Remotion supplies exact placement, timing, camera moves, callouts, type, diagrams and selected transitions. Generative video can be reserved for actions that benefit from articulated movement. Different production methods can share one visual system if contour, palette, detail hierarchy and motion grammar stay consistent.

The production code already contains useful pieces, but the research sequences do not prove that every asset is a direct drop-in. `ImageComposite` supports an image path and layout variants, including a paint-preserving duotone none mode; it is not a general multilayer object scene graph. `ScrollyReveal` combines camera movement with annotation leaders, while `AnnotatedImage` provides authored callouts. Their current image treatments apply brand duotone, so preserving the source painting needs an explicit adapter or mode. `AnnotationSVGLayer` supplies a useful native drawing primitive.

`EditorialSurface` and the episode backdrop mechanism provide routes for painted fields under analytical templates. Read `segmentBackdrop.ts` and `FullEpisode.tsx` before relying on transparent-background or over-picture behavior, particularly with dark backdrops. `FrameworkDiagram` is relevant to the qualitative many-to-one explanation. The combined study instead uses a custom isolated SVG diagram and shared design tokens; it has not implemented the production data/timing adapters.

True scenery parallax needs separate foreground, middle and background assets plus reconstruction of what becomes visible behind moving parts. A flattened landscape and two added foreground wings do not demonstrate that capability. The earlier opening-panel proof does demonstrate authored occlusion with prepared pieces, but its layers are generated approximations rather than exact separations.

The two Remotion research folders are `remotion-templates/research/world-objects-overlays/` and `remotion-templates/research/combined-sequence/`. They are isolated entries and leave production registrations and episode manifests untouched. Shared palette, fonts, timing constants and easing come from the existing design system. All motion is frame-derived; these are reproducible renders rather than browser CSS animation recordings.

### Reproduction and useful implementation details

From `remotion-templates/`, the combined study can be rebuilt with these commands. The older eight-study renderer uses the corresponding `world-objects-overlays` folder and supports `--only=3,4` and `--stills-only`. The combined renderer supports `--stills-only` and `--video-only`.

```sh
node node_modules/typescript/bin/tsc -p research/combined-sequence/tsconfig.json
node research/combined-sequence/render.mjs
node research/combined-sequence/gallery.mjs
node research/combined-sequence/qa.mjs
```

The installed local Chromium headless shell is under `/Users/feihuyan/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`. Use `PARALLAX_BROWSER` to override it. The default Playwright executable path was stale during this work; choosing the known installed executable avoided that issue. FFmpeg and FFprobe were under `/opt/homebrew/bin/`, with override variables documented in the READMEs.

Remotion's `colorSpace: bt709` did not alone populate all expected color metadata. The shared `world-objects-overlays/color.mjs` helper uses a lossless H.264 metadata remux to complete primaries, transfer and matrix tags. Keep that helper or verify an equivalent result with FFprobe. Avoid casually re-encoding a finished study just to change tags.

The isolated TypeScript configs explicitly set `rootDir` and Node/React types so shared design imports resolve under TypeScript 6. Literal token defaults need number annotations where a wider duration is accepted. The renderer opens and closes its own browser and uses a low render concurrency. A prior optional rerender encountered a transient local server failure; the completed assets and passing QA are the relevant deliverables. Viewport screenshots were more reliable than oversized full-page screenshots in these image-heavy galleries.

## 16 Decision ledger and evidence limits

| Topic | Authority and current position | What remains unresolved |
| --- | --- | --- |
| Artsy differentiated nonphotographic look | Explicit user goal | Audience recognition and durable differentiation |
| Constructivist foundation | User likes it and liked refinements | Final scope of alternative media in the system |
| More facial detail without parts | Repeated explicit user constraint and positive faceted-face feedback | Profile silhouette and temporal enforcement |
| Believable arms hands and support | Explicit user correction of the pull | A repeatable interaction workflow |
| Quieter fields and selected detail | Assistant recommendation supported by still comparisons | Controlled texture animation comparison |
| Purposeful surreal reveals | Assistant recommendation and user-authorized exploration | Unprompted comprehension and a final signature operation |
| Opening panel | Selected by assistant for the first authored proof | Fold versus door reading and narrative restraint |
| Coin transfer | Strongest first action prototype by visual review | Source ear cleanup fingers and repeatability |
| Original and rebuilt pull | Rejected after user review | New whole-pose design for the intended action |
| B1 and D1 pose experiment | Provisional diagnostic selections only | Contact head correction and ending pose |
| Architectural cup and light field | Strong assistant candidates | Material match with people and broader reuse |
| Combined cup sequence | Completed and technically checked | User verdict narration and production adapters |
| Final channel identity | No final lock in this conversation | A concise production visual bible and acceptance tests |

The status words selected, preferred and approved mean different things across older files. Selected for a style pass is not accepted for animation. Selected for motion preparation is not final production approval. User authorization to run a study is not a declaration that its result is good. Current rejection flags and later user corrections take precedence over earlier assistant praise.

Several comparisons vary composition, palette, reference images or geometry simultaneously. They help explore taste but do not isolate causal variables. The built-in image tool does not expose an exact model identifier, seed, enforced pose/depth conditioning or masks in this workflow. No provenance record should invent those values. Most image edits are close matches rather than pixel-locked modifications.

There has been no blinded audience test, competitor-recognition experiment, cross-model video comparison, repeated motion success-rate measurement or full narrated episode built in the new identity. No source establishes that featureless faces or constructivism is universally easiest for AI animation. The fact that a drawing contains fewer facial parts does not ensure that a video model will refrain from inventing them.

## 17 Recommended next review and experiments

These are recommendations for the incoming agent, not tasks already approved as a new paid batch. Begin with a critique of existing artifacts before generating more small variants.

First, assess the visual system as a whole. Compare the liked face, shadow scene, daylight desk, spare architectural scenery, cup and final diagram. Decide whether they share contour, material, scale of detail and emotional tone. The cup may need less ceramic modeling or the character world may need carefully chosen richer objects. Keep at least one serious alternative such as paper theatre available for comparison until the system choice is justified.

Second, identify the smallest unresolved character problem. A strict profile reference and a head-turn test with intermediate views may be more informative than another finished landscape. The existing repeated head-only edits did not meet the requirement, so consider a controllable redraw or explicit head geometry rather than more verbal variants of the same correction. Do not weaken the face rule to accommodate a tool.

Third, restage the required physical action. If the story needs a suspended rescue, find or create a whole-body reference for that action and camera; do not relabel the Old Rag assisted step as the same event. Review both shoulders through palms, natural occlusion, support, line of action and counterweight before painting. Use a quiet pose study, then style, then environment. Only establish an ending and pay for motion after a source drawing passes review.

Fourth, turn the successful Remotion approach into a small production adapter. Preserve painting colors, support transparent objects, expose authored leaders and drive a qualitative diagram from explicit data. Use actual episode narration to judge timing. The current draft cup metaphor should be reviewed for editorial fit before adoption, because the established episode motif is a shop transaction rather than a cup.

Fifth, test one meaningful signature reveal with viewers who have not read the explanation. Ask what changed and what the change lets them conclude. The opening panel's fold, the connecting shadows and the counter-to-street continuity each carry different claims. Their comprehension matters more than whether they look surreal.

Then run a small repeatability comparison with fixed inputs and recorded attempts. Track action completion, subject identity, facial-rule compliance, hand/contact correctness, texture flicker, camera stability, usable duration, retries and preparation time separately. Keep failures. If texture is the variable, hold composition and action fixed; if provider is the variable, keep controls comparable. Use qualitative review where no objective measurement exists rather than inventing scores.

An incoming critique should answer: Which direction best matches the user brief? Which existing samples should be references and which should be retired? What are the two or three highest-information next tests? What production work is needed before an episode can use the system? What evidence would justify a final identity choice?

## 18 Artifact map and source hierarchy

The Markdown copy is the portable agent-readable version of this handoff. The Word document embeds selected visual evidence. Both refer to existing source assets rather than duplicating the media archive. The [file inventory](inventory.json) records all non-bundle files in the two dated research folders plus the two isolated Remotion source folders, with sizes and SHA-256 hashes. It includes QA thumbnails and probes; those are not extra creative outputs. The [conversation excerpts](conversation-excerpts.json) preserve user and assistant final-message excerpts, with dates and historical caveats, not tool traces or private reasoning.

At snapshot time the dated folders contain 461 files: 98 under October 10 and 363 under October 11, excluding `.bundle` and `.DS_Store`. Counts include repeated review frames, source manifests, rendered previews and a color-tag probe, so they must not be reported as numbers of unique generated images. The intended motion deliverables are one fourteen-second reveal, three provider trials, eight six-second Remotion studies and one twenty-six-second combined sequence.

| Artifact family | Primary review entry | Exact history or verification |
| --- | --- | --- |
| Initial alternatives | [Complete gallery](../2026-10-10/all-directions.md) | [Main manifest](../2026-10-10/studies.json) and [additional manifest](../2026-10-10/additional-studies.json) |
| Artistic and animation research | [Initial brief](../2026-10-10/README.md) and [additional directions](../2026-10-10/additional-directions.md) | External references are linked in each brief |
| Surreal variations | [Five variations](../2026-10-10/surrealism-variations/README.md) and [shadow chain](../2026-10-10/surrealism-variations/shadow-comparison.md) | [Manifest](../2026-10-10/surrealism-variations/studies.json) |
| Context and face refinement | [Desk dinner rescue studies](../2026-10-10/context-tests/README.md) | [Manifest](../2026-10-10/context-tests/studies.json) and [unrun motion plan](../2026-10-10/context-tests/motion/trials.json) |
| Character and episode board | [Gallery](../2026-10-10/character-and-storyboard/index.html) | [Manifest](../2026-10-10/character-and-storyboard/studies.json) and [checks](../2026-10-10/character-and-storyboard/preview-checks.json) |
| Spatial reveals | [Gallery and fourteen second film](../2026-10-10/reveal-comparisons/index.html) | [Manifest](../2026-10-10/reveal-comparisons/studies.json) and [video checks](../2026-10-10/reveal-comparisons/video-checks.json) |
| Character video trials | [Three clip gallery](../2026-10-11/character-motion/index.html) | [Trials](../2026-10-11/character-motion/trials.json) and [corrected review](../2026-10-11/character-motion/review.json) |
| Rejected pull rebuild | [Comparison](../2026-10-11/character-motion/qa/assisted-pull/rebuild.html) | [Rebuild record](../2026-10-11/character-motion/rebuild.json) and [prompt audit](../2026-10-11/character-motion/qa/assisted-pull/prompting-research.md) |
| Whole pose reference test | [Nine image gallery](../2026-10-11/character-motion/pose-first-test/index.html) | [Manifest](../2026-10-11/character-motion/pose-first-test/studies.json) and [contact review](../2026-10-11/character-motion/pose-first-test/contact-review.html) |
| Worlds and analytical layers | [Eight study gallery](../2026-10-11/world-objects-overlays/index.html) | [Manifest](../2026-10-11/world-objects-overlays/studies.json) and [QA](../2026-10-11/world-objects-overlays/qa/report.md) |
| Combined Remotion sequence | [Film and chapter review](../2026-10-11/combined-sequence/index.html) | [Story](../2026-10-11/combined-sequence/story.json) and [QA](../2026-10-11/combined-sequence/qa/report.md) |

For current status, prefer explicit user corrections, the latest README/review and per-attempt status over older conversational praise. For exact reproduction, prefer prompt text and generation sidecars. For technical file health, use the appropriate media or gallery QA. Technical checks do not replace visual or editorial review.

The repository contains unrelated work in progress. This handoff is a documentation snapshot, not a commit or a synchronization of the whole production pipeline. The new Remotion studies did not change production episode manifests or template registrations. If narration later changes the hand-wired manifest, use the repository's retiming workflow rather than regenerating over it.

## 19 Research references worth reopening

The following are selected sources already cited in the saved research. They are included for the incoming agent to inspect, not presented as a new literature review performed for this handoff. Tool specifications and historical prices should be checked again before new production use.

- [Runway image to video prompting](https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide) for the relationship between source composition and motion description.
- [VBench plus plus](https://arxiv.org/html/2411.13503v1) and [VBench 2](https://arxiv.org/abs/2503.21755) for separate consistency dynamic degree human fidelity and physics dimensions.
- [HandRefiner](https://arxiv.org/html/2311.17957v2), [HanDiffuser](https://arxiv.org/abs/2403.01693), [ControlNet](https://arxiv.org/abs/2302.05543) and [GNOCHI](https://arxiv.org/abs/2607.10408) for hand structure spatial conditioning and interaction research with the limits noted in the prompt audit.
- [Animation Mentor on readable poses](https://www.animationmentor.com/blog/tutorial-building-appealing-character-poses-for-animation/) and [push and pull mechanics](https://www.animationmentor.com/blog/tutorial-animating-pushing-and-pulling-motions/) for performance reference contact and weight design.
- [OpenAI image prompting](https://developers.openai.com/api/docs/guides/image-prompting) and [generation limitations](https://developers.openai.com/api/docs/guides/image-generation#limitations) for reference roles edit instructions consistency and placement limits.
- [MoMA on De Chirico](https://www.moma.org/artists/1106-giorgio-de-chirico), [Whitney on Feininger](https://whitney.org/collection/works/386), [Steinberg Foundation](https://saulsteinbergfoundation.org/essay/drawing-table-reliefs/), [Magritte at NGA](https://www.nga.gov/artworks/70170-la-condition-humaine) and [Escher Relativity](https://escherinhetpaleis.nl/en/about-escher/masterpieces/relativity) for purposeful changes of represented space.
- [Reiniger through BFI](https://www.bfi.org.uk/sight-and-sound/features/scissors-make-films-lotte-reiniger-creating-her-magical-animations), [Tyrus Wong at the Disney Family Museum](https://www.waltdisney.org/blog/look-closer-concept-art-tyrus-wong), [Drouin at NFB](https://www.nfb.ca/film/mindscape/) and [Caroline Leaf at NFB](https://www.nfb.ca/film/the_street/) for distinct material and motion precedents.
- [Runway Aleph](https://help.runwayml.com/hc/en-us/articles/52150503729171-Aleph-2-0-Prompting-Guide), [Luma Ray3 Modify](https://lumalabs.ai/learning-hub/ray3-modify-user-guide) and [Act Two](https://help.runwayml.com/hc/en-us/articles/42311337895827-Performance-Capture-with-Act-Two) for untested movement-reference and performance routes.
- [fal model page](https://fal.ai/models/minimax/h3-max/image-to-video) and [API](https://fal.ai/models/minimax/h3-max/image-to-video/api) for the historical three-clip submission record.
- [Remotion animation documentation](https://www.remotion.dev/docs/animating-properties) for authored frame-based motion.

## 20 Brief for the incoming agent

Please review Parallax's October 10 and 11 visual research using this handoff and the linked galleries. The user wants an artsy distinctive nonphotorealistic channel identity and a mix of quiet and ambitious movement. They currently like painted constructivist shapes and asymmetric faceted heads, but insist on no facial parts and on plausible body structure.

Evaluate the leading combination of faceted featureless people, selected painted detail, quieter fields, purposeful spatial surrealism and precise Remotion graphics. Compare it against the strongest alternatives rather than assuming it is final. Inspect the actual clips, including the failed head turn and rejected pull. Preserve all rejection and provisional-selection statuses. The pose-reference scene changes the action to an assisted step and still fails head constraints.

Give a candid creative and production critique, a short list of reference assets to carry forward, any assets to retire and two or three decisive next experiments. Explain what each experiment would resolve and what an acceptable result would look like. Do not claim repeatability or audience differentiation without evidence. Treat the combined cup sequence as an isolated picture-only prototype, not a narrated production template. Consult the repository instructions before editing, and do not infer a continuing paid-video authorization from the completed historical batch.

## 21 Selected visual evidence

These plates are navigation aids, not new approvals. They embed existing files without modifying their pixels. Full-size images, exact prompts, retained attempts and motion remain available through the source links above.

### Preferred facial form and shadow direction

![Liked desk figure with asymmetric featureless painted head planes](../2026-10-10/context-tests/02c-desk-faceted-face.png)

The user replied better to this stronger faceted treatment. It establishes the intended distinction between painted facial volume and literal facial anatomy.

![Constructivist shadow scene after the face and bread correction](../2026-10-10/surrealism-variations/s04e-constructivist-shadows-featureless.png)

The corrected foreground heads and painted loaf were preferred. Shadow silhouettes still need the face constraint checked, and their connection needs an explicit interpretive role.

### Character and episode range

![Five head views of the faceted character](../2026-10-10/character-and-storyboard/01-head-turnaround.png)

Five views were completed. The more side-on view is not yet a rigorous ninety-degree production profile.

![Six frame episode board mixing scenes and native graphics](../2026-10-10/character-and-storyboard/storyboard-overview.png)

This samples six different episode jobs rather than six consecutive shots. The identical transaction appears twice in the interpretation comparison.

### Spatial reveal and character motion

![Three reveal endpoints compared with a common starting encounter](../2026-10-10/reveal-comparisons/comparison-overview.png)

The opening-panel candidate was chosen for the fourteen-second authored proof. The other endpoints remain useful comparison baselines.

![Six selected key poses for the three original character motion trials](../2026-10-11/character-motion/key-pose-overview.png)

These are the original submitted endpoints. The assisted-pull sources were later rejected; the MP4 does not show the subsequent rebuild.

### Pose reference findings and object integration

![Pose comparison between text only and whole body reference conditions](../2026-10-11/character-motion/pose-first-test/pose-comparison.png)

The two whole-body reference outputs have simpler-looking contact in this small batch. This is diagnostic evidence, not a general success-rate comparison.

![Final combined study with the cup and qualitative diagram](../2026-10-11/combined-sequence/renders/frame-750.png)

The final diagram holds on the same painted field as the cup. The clip is picture only and its concern/incentive branches are illustrative possibilities.
