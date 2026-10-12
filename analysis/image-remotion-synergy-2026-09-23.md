# Image generation × Remotion: the next Parallax experiment

**Research follow-up, 24 September:** [current illustration-to-video workflows](illustration-to-video-workflows-2026-09-24.md) compares image-to-video, performance references, video restyling, keyframes, and independently animated panels, with primary sources and a bounded test plan.

**Current status:** the user rejected the rigid SVG grove and then the motion/transition in the [illustrated-cutout test](illustrated-cutout-motion-2026-09-23.md). Neither is the selected motion direction. The latest proposal below moves the decision upstream to illustration, staging, and editing. It has not yet been tested with a video model. The earlier recommendation and implementation notes are retained as experiment history.

23 September 2026. Working production proposal, based on the current checkout and the two constructivist range studies. No video-generation service is required.

## Latest direction: design the illustration for the intended motion

The user's four-panel suggestion changes the production question: what scene can communicate the idea through a few clear illustrated states and a small amount of believable action? Choose the actor, framing, starting pose, and edit together before generating the art. Preserve the constructivist illustration language; simplify the requested action rather than flattening the image into generic symbols.

The earlier implementation imposed a literal planting simulation on artwork about a dense measured plot surrounded by depleted land. Repeatedly replanting one tree and neglecting the wider ecosystem are different failure mechanisms. Select one mechanism before locking narration. For this storyboard, the mechanism is repeated credit for the same tree, and the person represents an agent in a fictional reward-rule example.

### A four-panel storyboard to test

Use one person, one distinctive sapling, the same soil patch, and the same camera angle. Keep clothing, leaf silhouette, and a recognizable ground landmark consistent. Label the panels as successive moments in Remotion so they do not read as four different workers or sites. This is a new simplified toy sequence, not the old four-new-trees / twelve-events trace.

| Panel | Illustrated state | Small motion candidate | Meaning carried by the edit / code |
|---|---|---|---|
| 1. Plant | Person kneeling beside the already seated sapling, hands close to the soil. | Brief soil press; no full planting choreography. | First planting completed: score 1, one tree present. |
| 2. Lift | Same person already gripping the sapling; root ball partly exposed above the same hole. | Short upward movement, with no grip change. | It is the same tree. No score increase for lifting. |
| 3. Replant | Root ball just above the same hole, person already in the lowering pose. | Short downward movement. | Another completed planting: score 2, still one tree. |
| 4. Outcome | Same planted tree and unchanged surroundings; person rests beside it. | A hold is sufficient. | Compare score 2 with one tree present. No new growth is implied. |

These are hypotheses for motion, not guarantees. Hands, roots, and soil contact may still drift; splitting the action reduces the demand but does not remove it. The still sequence must already make the causal story understandable. Avoid repeating a planting clip under a live counter unless each replay deliberately represents another event.

### Tool ownership and simplest next test

- **Image generation:** composition, geometric illustration style, character, and a readable pose for each moment. Use the selected character/scene as references when deriving later poses; inspect continuity rather than assuming it.
- **AI video:** one short local action within a single shot. It may carry meaningful action, not just atmospheric leaf movement. Test whether it preserves this illustration style.
- **Remotion:** fixed panel crops, gutters, sequence labels, score, timing, and the final comparison. Only one panel moves at a time initially; the others hold. This enforces panel boundaries, but cannot fix malformed motion inside a panel.
- **Editing:** imply the unshown parts of the action through cuts between poses. Do not require a model to execute a complete plant → lift → replant cycle or invent the transition between panels.

A generated 2×2 sheet is useful for approving composition and continuity. For motion, use separate panel images/clips and assemble the grid in Remotion. Do not rely on one full-collage video prompt to prevent cross-panel changes. The grid is a candidate layout, not a requirement: at phone size, show the active panel larger and finish with the grid if four small illustrations are hard to read.

**Next bounded experiment:** review the four still states first, then animate only the lift panel, which tests the difficult contact and identity preservation. Review that short clip at normal speed. Allow two video attempts before changing the pose/framing or using the still cut. Generate the remaining clips only if that test is convincing. Compare whether motion adds useful human gesture and clarity against the still sequence, and record preparation/retry time. No new Remotion library or mandatory video stage is implied.

**Planning order:** viewer realization → visual states and plausible motion → illustrations → one motion test → narration timing and assembly. The factual argument remains fixed; its visual expression and narration can evolve together.

## Recommendation

Make **one 30–45 second narrated visual argument** before adding another template, effect, or model. Start from the researched specification-gaming question already used in *What We Count*: a system is rewarded for plantings while the forest does not recover. Use the selected [forest illustration](../remotion-templates/public/style-lab/constructivist-forest-score-v2.png) to establish the situation, then let Remotion reveal the measurement and its failure. Compare it with the existing [code-drawn pilot](../remotion-templates/src/pilots/WhatWeCount/README.md). The result should tell us whether a generated picture improves comprehension and identity enough to justify its production time.

The audience's motion bar is modest and strict: no unexplained visual changes, shape drift, or other obvious AI-video artifacts. A held image, clean cut, exact overlay, or slow deterministic camera move passes that bar. Do not make image-to-video a required pipeline stage.

## What the project has already proved

- The [Promise and Copy pilot](../remotion-templates/src/pilots/PromiseAndCopy/README.md) can swap a generated image through `imageSrc`, and Studio edits to title, position, pauses, and image survive reopening and rendering. Its generated forest works as a bounded world image; the logical fork remains code-drawn.
- The [What We Count pilot](../remotion-templates/src/pilots/WhatWeCount/README.md) shares canvas, narration timing, and visual primitives with the first pilot. It animates a deterministic planting trace. Its numbers are counts of authored events, not measurements of a real AI system.
- The [forest](constructivist-nonarchitectural-test-2026-09-23.md) and [human-cost](constructivist-human-test-2026-09-23.md) studies show a promising illustration family across environmental and social subjects. They are full-frame static assets in Studio; their motion, narration fit, and reuse cost have not been tested.
- The [AIStillComposite prototype](../remotion-templates/src/templates/_proto/AIStillComposite.tsx) demonstrates a raster scene plus exact vector annotation, but its positions and copy are hardcoded to a different image. The wider [Studio audit](visual-capabilities-and-studio-2026-09-22.md) already identified reusable scene authoring as the higher-value gap. This experiment should inform that interface, not presuppose it.

## Division of labor

| Need | Best current tool | Reason |
|---|---|---|
| A memorable place, person, situation, or metaphor | Generate one unlettered illustration | Rich authored composition and channel identity. |
| A claim, number, source, label, branch, relationship, or counterfactual | Remotion text/SVG/data | Must be exact, editable, and stable through time. |
| Movement of attention through one illustration | Remotion crop, opacity, mask, annotation, or restrained camera transform | Repeatable frames without redrawing the art. |
| A change in the world itself | Prefer a second authored still or code-defined layer; test AI video only if the change is genuinely organic | A model may alter unrelated details; the current bar makes that a bad default. |
| Empirical evidence or a named real event | Source material, chart, or clearly cited capture | A generated scene is an illustration, not evidence. |

The two tools should meet at a **scene contract**, not at pixel-perfect prompt instructions. Sketch the 16:9 layout first. Ask the image generator for a clear subject, a deliberate quiet area, no lettering, and at most one semantic accent. Typeset words and draw measured marks in Remotion's own regions. If a label only works after several coordinate nudges over unpredictable artwork, change the layout or the image. The [style study](philosophy-visual-style-study-2026-09-22.md) already exposed that failure with the promise-maker label.

## A minimal scene brief

Write this before generating or coding each hero beat:

1. **Question and source:** What is the viewer trying to understand? Which claim is documented, and which scene is invented to explain it?
2. **Visual proposition:** What should be legible in a still frame, before narration? For the forest: the local planted plot is dense while the surrounding forest is depleted.
3. **One temporal change:** What becomes newly visible, and why at that spoken moment? For the forest: the planting score climbs; a separate surviving-forest measure does not.
4. **Ownership:** Which part is raster, which part is code, and which part is narration? All exact numbers, labels, and source cues belong to code.
5. **Fallback:** What is the clean still-based version if motion weakens the shot? Usually a held image and a cut to the analytical graphic.
6. **Budget:** Two image candidates and one focused edit at most, one meaningful motion idea, one normal-speed review. Record human preparation/revision time separately from render time.

The illustration does not have to explain the full theory on its own. It should create a specific situation worth examining. Remotion can then expose the mechanism, including the part the image deliberately leaves ambiguous.

## The first test

Use the existing reward-hacking material because it already has a [grounded concept and narration](../remotion-templates/src/pilots/WhatWeCount/README.md), a code-drawn comparison, and a selected constructivist image. Build two cuts of the same 30–45 seconds:

- **A — code baseline:** excerpt or adapt the existing grove/counter animation.
- **B — hybrid:** establish the generated forest as an unlettered image, then use a stable Remotion region to show the planting count and the distinct condition of the forest. One reveal or one cut can carry the change. Do not animate the roots, stumps, or gold trace with a video model.

Review at normal playback speed and at phone size. Ask whether B makes the situation easier to remember, whether the analytical change remains unambiguous, whether the picture and graphic feel like one visual language, and how long B took to prepare and revise. If B wins only because it is richer, but takes much longer or obscures the distinction between score and outcome, keep the code baseline and revise the scene contract.

## Topic and research implication

The next bottleneck may be **choosing arguments that reward a visual scene**, not expanding the effects library. For a philosophy/AI episode candidate, make a one-page topic card before script or art: a sharp question, the surprising tension, one primary source or clearly identified thought experiment, one counterargument, and a visual proposition that can change over time. Favor questions where an image can establish a concrete situation and a code-rendered change can expose the hidden structure. “AI ethics” as a category is too broad to direct either research or imagery; “what happens when the score rises while the thing we care about declines?” gives both tools a job.

Keep the existing `project/IDEAS.md` topic pipeline and research-audit process; this is a small visual-production gate, not a new parallel editorial system. The older `project/VISUAL_LANGUAGE.md` still assumes high-volume AI video in places and quotes obsolete model workflows. Revise that doctrine only after a narrated hybrid test establishes a better default.

## Decision after the test

If the hybrid works, make a small reusable **illustrated-argument scene**: image path, safe type region, one or two code overlays, focus/hold timings, and narration cue. Build it from the existing image/composite primitives and test edit → save → reopen → render in Studio. If it does not work, improve the script or illustration concept before growing the library. No new template family, 3D pipeline, or video-generation subscription is justified by this test alone.

## Implemented comparison — 23 September

The bounded test is now rendered. Both cuts are 44.7 seconds, 1920×1080 at 30 fps, with identical decoded audio from the first six *What We Count* scratch-narration passages. They share title, captions, toy planting events, two exact counters, and a closing diagnosis. Source: [ForestArgumentStudy.tsx](../remotion-templates/src/experiments/ForestArgumentStudy.tsx). In Studio, open **Experiments → forest-argument-hybrid** or **forest-argument-code**.

- [Hybrid MP4](../remotion-templates/out/style-lab/forest-argument-hybrid.mp4): the generated forest establishes the situation through the goal and rule; one hard cut introduces the code grove when counting begins. All exact numbers and the diagnosis stay with the code scene.
- [Code-only MP4](../remotion-templates/out/style-lab/forest-argument-code.mp4): the same canvas, audio, typography, events, and counters, with the code grove throughout.
- [Comparison sheet](../remotion-templates/out/style-lab/forest-argument-comparison-sheet.png): representative frames at 3, 10, 16, 26, and 34 seconds from both final cuts.

The first hybrid render exposed a semantic mismatch: the generated art contains many saplings, so displaying the toy model's exact “4 new trees” beside it would imply the illustration depicts those four events. The final cut uses the illustration as a qualitative establishing image, then switches to the code grove for every counted action and the conclusion. This is a useful constraint for the reusable scene contract: generated art can establish a situation, but it cannot silently become a precise data visualization.

The hybrid opening is more distinctive than the code-only opening; the code-only cut has a more continuous visual register. The one cut between them is purposeful and legible in still review, but audience preference and normal-speed comprehension remain unmeasured. A 320×180 phone-scale frame exposed small metric labels; they were enlarged in the final exports so “planting events” and “new trees” remain distinguishable. No new image or video model was called. The scratch narration remains synthetic and is marked as such on screen. TypeScript passed; both full exports decoded without error; both have H.264 video and AAC audio. Their decoded audio hashes match. Human authoring/review time was not timed, so this test does not establish a production-speed improvement.
