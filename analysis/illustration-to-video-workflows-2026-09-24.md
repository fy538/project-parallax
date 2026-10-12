# Current illustration-to-video workflows for Parallax

Research checked 24 September 2026. Scope: distinctive constructivist illustration, modest believable action, stable editorial layout, and a sustainable solo workflow. This is a review of primary documentation and a filmmaker interview, not a new video bakeoff. Recommendations below are our synthesis; vendor quality claims are not measured Parallax results.

Related user-provided research, saved unchanged on 25 September: [Communicating AI Alignment Without Creating False Confidence](../project/research/2026-09-25-communicating-ai-alignment-deep-research.md). This report concerns audience understanding and editorial design; it is separate from the video-tool workflow research below.

User-provided workflow report, also saved unchanged on 25 September: [A Sustainable Illustration-to-Motion Workflow for Parallax](../project/research/2026-09-24-illustration-to-motion-deep-research.md), dated 24 September. Its exported citation markers have no accompanying source URLs; preserve it as supplied and verify implementation-specific claims against primary documentation before use.

## Recommendation

Plan the illustration, action, and edit together. Keep our image generator and Remotion. Test short image-to-video shots first; add a motion reference when a particular gesture or interaction matters. Use separate generated shots inside a code-controlled grid. Treat each shot as replaceable so a failed generation does not force us to remake an entire sequence.

The most useful current development is the range of **reference controls**: separate references for appearance, composition, movement, and selected moments. Having those controls does not guarantee good animation. The workflow should ask the model to invent only the parts for which we can tolerate variation.

Our success measure is **usable seconds per total production effort**, including image preparation, performance recording, retries, selection, and repair. A beautiful demo or broad model ranking does not answer that question for our aesthetic. VBench-2.0 explicitly separates visual plausibility from anatomy, physics, commonsense, and controllability; it is a useful evaluation framework, not a September 2026 ranking of these products. [VBench-2.0 paper](https://arxiv.org/abs/2503.21755)

## What current workflows actually offer

| Workflow | What we supply | Strength for Parallax | Weakness / hidden work | Priority |
|---|---|---|---|---|
| Illustrated still → short generated shot | Approved frame and one action | Least preparation; keeps illustration central | Model invents the motion and contacts; camera/style can drift | First test |
| Illustrated character + performance video | Art plus a short demonstration | Supplies gesture, posture, and rhythm | Reference preparation; stylized proportions and props may transfer poorly | Test if action is unreliable |
| Source video → illustrated video | Real or rendered action plus illustrated guide frames | Supplies a whole interaction and its staging | Restyling can change geometry or retain unwanted realism | Strong alternative for contact-heavy shots |
| First/last or multiple guide frames → video | Compatible illustrated states | Guides important poses or visual progression | Endpoints do not guarantee a sensible path; more stills to maintain | Selective use |
| Separate animated panels → editorial grid | Independently usable shots | Exact boundaries; cheap replacement of one panel; controlled attention | Four simultaneous shots can be small or busy | Good layout candidate |
| Pose/depth/mask-controlled open workflow | Control videos, references, models, preprocessing | More explicit structural inputs and repeatable setup | Compute, version compatibility, masks, and troubleshooting | Defer until repeat demand |

These priorities reflect our production constraints, not a universal quality ordering. Sources for the capability distinctions follow.

## 1. Prepare images that already contain the intended action

Runway's current image-to-video guide says the image establishes appearance and composition while the text describes motion. It warns that defects in hands/faces can become more visible in video, and that prompts fighting the motion implied by a pose need more iteration. It also explicitly acknowledges that requesting a locked camera may still require stabilization. [Runway image-to-video guide](https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide)

**Application:** illustrate the gardener already gripping the sapling, with the root ball partly exposed. Request one short lift. Leave enough space above the hands; make the silhouette and contact readable. Start with a medium view rather than a close-up of fingers. A held pose can finish the shot. None of this requires making the artwork generic or sparse.

For consistency, make one approved character/scene reference and derive subsequent poses from it. Runway's reference system supports both appearance references and sketches for composition, gaze, and object placement; its guide recommends iterating complex changes through separate reference paths. This supports separating the style reference from the staging reference. We can use that discipline with our existing image tool without adopting Runway for still generation. [Runway image references](https://help.runwayml.com/hc/en-us/articles/40042718905875-Creating-with-Gen-4-Image-References)

**Proposed motion prompt, not a tested preset:** “Locked camera. The kneeling gardener lifts the sapling a short distance, keeping the same grip, then holds it steady. The surrounding ground stays still.” Inspect the actual final image before using it; remove any instruction that contradicts the pose. Adapt wording to the chosen model rather than enforcing one universal prompt length.

## 2. Supply a performance when the action matters

Kling VIDEO 3.0 Motion Control accepts a character image and an action video. Its guidance distinguishes motion transfer from facial-element binding: the latter references the face, not clothing or props. API guidance recommends matching character proportions and framing, visible limbs, stable movement, and a continuous reference shot; unusually proportioned stylized characters can be less suitable. [Kling Motion Control guide](https://kling.ai/quickstart/motion-control-user-guide), [Kling API input guidance](https://kling.ai/document-api/api/video/motion-control/legacy)

**Application:** a short phone clip of someone making the lift could give our illustrated gardener a clearer physical performance. Keep camera angle, starting pose, and the object's scale close to the illustration. Use a representative prop if grip and weight matter. A generic dance reference would not establish the tree interaction.

Runway Act-Two is another performance-transfer option, but its documented best practices favor a visible face and waist-up framing. Image inputs also receive automatic environmental/camera movement. Those constraints make it a weaker first match for our faceless, kneeling gardener, even though it supports different visual styles. It may be more useful later for an illustrated speaker or a seated gesture. [Act-Two guidance](https://help.runwayml.com/hc/en-us/articles/42311337895827-Performance-Capture-with-Act-Two)

**Judgment:** performance transfer is worth trying when the gesture fails repeatedly, but recording and matching a performance must cost less effort than the retries it replaces. Body motion control alone is not evidence that the hand–tree–soil relationship will remain correct.

## 3. Preserve the action through video-to-video

Luma Ray3.2's current video-editing API accepts a source clip and illustrated guide frames at selected moments. It exposes pose, depth, surface-normal, trajectory, and face conditioning, plus an automatic control mode. The documentation recommends starting with automatic controls and using guide frames to steer appearance. That is a distinct route from asking a still-image model to invent an interaction. [Ray3.2 editing documentation](https://docs.agents.lumalabs.ai/guides/videos/editing/)

**Application:** record a simple lift and lowering movement; create an illustrated version of a matching source frame; use it to guide the restyle. The source carries staging and motion, while the guide supplies the Parallax look. If we later need a recurring machine, a rough 3D animation could serve a similar structural role—but building a character rig for this one shot would defeat our time budget.

**Tradeoff:** strong adherence may preserve too much of the original form, while strong restyling may weaken contacts or geometry. This is a testable compromise, not an assurance of exact preservation. Prefer this route over a long sequence of increasingly restrictive text prompts when the missing information is the movement itself.

## 4. Use keyframes and multi-shot features deliberately

Kling 3.0 documents first/last-frame generation, start-frame plus element references, and multi-shot generation. Its Omni workflow separates references for recurring subjects, scene/style, and video elements. These are useful controls, but their advertised consistency is not a guarantee of stable illustration or exact counts. [Kling 3.0 guide](https://kling.ai/quickstart/klingai-video-3-model-user-guide), [Omni reference workflow](https://kling.ai/blog/kling-video-3-omni-reference-workflows-multi-element?tab=product-features)

ByteDance's Seedance 2.0 documentation demonstrates mixed image/video/audio references and storyboard-conditioned sequences. More recently, Runway's API changelog added Seedance 2.5 on August 7 and 1080p support on August 15, alongside Hailuo 3.0 earlier in August. This makes our May provider assumptions unsuitable for current purchasing or integration decisions. Features must be checked for the exact host and model version. [Seedance 2.0 launch](https://seed.bytedance.com/en/blog/seedance-2-0-official-launch), [Runway API changelog](https://docs.dev.runwayml.com/api-details/api_changelog/)

**Application:** first/last frames can guide a small change within one composition. They are unnecessary for a cut from “tree planted” to “tree lifted.” A model-generated multi-shot sequence is an option for coverage, but couples several editorial decisions into one generation. For this four-panel test, independent shots let us replace a failure without regenerating the other moments.

Keyframe-conditioned generative video should not be described as simply optical-flow interpolation. Our older notes conflate these categories and overgeneralize a useful observation—fine geometric details warped in our trials—into an architectural claim about all models.

## 5. The grid is an editing decision

**Proposed Parallax workflow:** create the four still states for review, obtain separate panel-sized assets for motion, animate only the necessary panels, and composite them in Remotion. Keep sequence labels and counters outside the generated art. A border enforced by code cannot wander, although content inside it still can.

Begin with one moving panel at a time. Show that the panels are successive moments involving the same person/tree. If the action is too small at phone size, show the active shot larger and use the grid for the final comparison. Do not assume an image-to-video model will respect four independent regions because the prompt describes a collage.

Two useful alternatives to literal continuous animation:

- **Cut between poses:** show the planted tree, then the gardener already holding it. Narration and staging establish the connection.
- **Selective held frames:** choose a few good poses and control their timing. Test an intentionally limited-animation cadence only if it suits the artwork; reducing frame rate cannot repair a malformed pose.

A relevant production example is *Mars and Siv*. Its directors describe detailed illustrated assets, minimal movement, AI-generated motion used as a base, selected intermediate frames, and After Effects finishing. This is evidence for an authored hybrid aesthetic. It involved approximately twelve people and extensive manual work, so it does **not** establish that the same workflow is cheap for a solo channel. [Filmmakers' interview](https://runway.com/customers/the-making-of-mars-and-siv)

## 6. More technical controls exist, with real setup costs

- **Wan2.2 Animate / ComfyUI:** documented animation and character-replacement modes driven by a reference video. Requires model assets, preprocessing, and additional nodes in the documented workflow. A possible future route for repeated character work. [ComfyUI maintained workflow](https://github.com/Comfy-Org/docs/blob/main/tutorials/video/wan/wan2-2-animate.mdx)
- **VACE:** accepts source video, masks, reference images, and prompts; supports combinations involving pose, layout, and inpainting. This is closer to actual regional conditioning than asking for “only this corner moves.” Exact unchanged pixels should still be enforced through compositing when necessary. [Official VACE input guide](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md)
- **LTX family:** ComfyUI documents LTX-2 pose/depth/edge controls. The current official repository has moved its quick start to LTX-2.5, with separate older-model assets and explicit model/LoRA compatibility requirements. The documented default download is roughly 66 GiB. This is a substantial workflow commitment, not a small Remotion dependency. [ComfyUI LTX-2 controls](https://github.com/Comfy-Org/docs/blob/main/tutorials/video/ltx/ltx-2.mdx), [current Lightricks repository](https://github.com/Lightricks/LTX-2)

**Recommendation:** keep these as escalation routes. Do not install a node graph, train a style adapter, or build a rendering service before a small hosted test shows that the control solves a recurring need.

## Capability traps found during the research

- **Camera reference is different from action reference.** Adobe Firefly's motion-reference feature follows camera movement. It is not documented as character-performance transfer. Adobe's Generate Video and timeline-editor pages also describe different combinations of frames and controls; verify the actual surface instead of combining features from two guides. [Generate Video camera reference, updated August 18](https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-video/match-camera-motion-to-reference-video.html), [timeline-editor controls](https://helpx.adobe.com/firefly/web/firefly-video-editor/generate-videos/generate-video-using-firefly-models.html)
- **The highest-quality tier may lack the desired control.** Flow's current matrix lists ingredient references for Veo 3.1 Lite/Fast, but not Quality. It separately lists editing and reference features for Gemini Omni Flash 1.1. Choose the required control first, then a compatible model. [Current Flow feature matrix](https://support.google.com/flow/answer/16352836?hl=en)
- **A launch article may not describe today's API.** Luma's June Ray3.2 announcement says sixteen keyframes and clips up to twenty seconds; the current Agents model guide lists up to sixty-four anchors and five/ten-second generation options. Treat these as different dated/interface-specific specifications, not interchangeable promises. [June announcement](https://lumalabs.ai/news/introducing-ray-3-2), [current model guide](https://docs.agents.lumalabs.ai/guides/model)

## What to retain and correct in this repository

Keep the empirical findings in [CHAINED_STILL_LESSONS.md](../project/CHAINED_STILL_LESSONS.md): our tally-mark camera test warped; some large-shape transforms worked; motion prompts must be checked against the final image. Those observations remain more relevant to our style than an unrelated showcase.

Treat old rankings, prices, rigid tool-family bans, and mechanistic explanations as dated. The [May generation workflow](../tools/ai-video/GENERATION_WORKFLOW.md) includes an unsupported “95% identity lock” claim, “3D anchor” language, and unvalidated provider assumptions. The current sources reviewed here do not establish those guarantees.

[motion_director.py](../tools/ai-video/motion_director.py) currently chooses among Ken Burns, live still, cinemagraph, and 2.5D parallax based on a perceived image. It cannot decide whether a visual concept should use a different pose, an omitted action, a performance reference, or four shots. Keep that planning upstream. Do not expand the schema until a reference-driven test succeeds.

The [SVG and raster-cutout studies](illustrated-cutout-motion-2026-09-23.md) established technical renderability, but the user rejected their motion. This research does not turn those outputs into approved examples.

## Small next experiment

The question is: **can we show the same person lifting the same tree, in our illustration style, without distracting changes or excessive preparation?**

1. Make the four-state still storyboard already described in the [scene proposal](image-remotion-synergy-2026-09-23.md#latest-direction-design-the-illustration-for-the-intended-motion). Use one consistent character, tree, ground landmark, and camera angle. Check it at phone size before animation.
2. Test only the lift. Supply one approved frame and a simple action prompt to a current I2V option, such as Gen-4.5 or Kling 3.0. Generate the supported clip length and select a useful two-to-four-second action; do not stretch it to fill a narration paragraph.
3. If the action fails, make a short representative performance and test Kling Motion Control or Ray3.2 video editing. Use the same visual brief. The added preparation time counts against this route.
4. Compare with the still-cut version using the same narration and layout. Allow two attempts per tested route initially. This is a production decision, not enough trials to rank the models scientifically.
5. Generate the other panels only after one route works. Keep a still if motion adds no clarity. Let Remotion own timing, captions, exact scores, grid/crop, and cuts.

For each attempt record: input assets; host/model/mode; prompt and settings; preparation minutes; generation wait; actual credits/cost; usable duration; reason for rejection or selection. Judge readable action, stable identity/props, plausible contact, preserved illustration style, and background stability at normal playback speed. Inspect frames around the grip and soil contact as a secondary check.

No video generation, service purchase, package installation, or runtime change was performed in this research pass. The untested question is whether these controls preserve **our** artwork well enough at an acceptable total effort.
