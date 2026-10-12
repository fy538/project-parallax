# Why the river pull images still fail

October 11, 2026

The rebuilt pair remains rejected. Its main defect is the connection between the hands and wrists: more shading and finger marks made it look finished without making each person's hand easy to identify. Prompting contributed by preserving this flawed connection and trying to repair isolated parts around it. The next useful experiment is to establish a believable whole pose from a matched visual reference, then apply the painted identity.

[Compare the images](rebuild.html) · [Inspect the hands and arms](rebuilt-detail.html) · [Original prompts and generation history](../../rebuild.json)

## What fails in the current images

These are visual judgments from the saved stills, rather than a biomechanical measurement or a claim about the generator's internal architecture.

- **Hand ownership remains ambiguous.** In both rebuilt poses, the two grasping hands form one large, similarly colored cluster. The broad hand surfaces, surrounding fingers and wrist transitions are difficult to assign to their respective forearms. Some lower finger shapes read as loops or detached segments. Counting the visible marks alone cannot establish an exact anatomical finger count because some digits should be hidden.
- **The reference is genuine but difficult to simplify.** The [photographed mutual wrist grip](https://wholebeinginstitute.com/courageous-act/) already has substantial overlap. Converting it into our flatter treatment weakens the depth cues that distinguish its hands. It also supplies no shoulders, elbows, torso or supporting legs. A valid close-up does not establish a valid pulling pose.
- **Support is visible, but effort is weakly communicated.** The helper has planted supports, yet remains almost unchanged between the poses. The rising person's position changes considerably. This reads more like a person rising beside a stationary grip than an exchange of effort between two bodies. Visible contact alone does not demonstrate convincing load or counterweight.
- **The ending pose inherits the starting problem.** The new ending retains the ambiguous grip, while the reaching arm becomes visually compressed. Exposing skin helped with the sleeve issue, but did not make the complete shoulder–elbow–wrist–palm chain consistently convincing.

There is also a finish problem: the hands have relatively soft, rounded shading while much of the clothing and landscape carries dense angular texture. Extra surface detail can draw attention to a poorly constructed joint. The painted medium and featureless faces can remain; structural readability needs its own review.

## What our prompts did wrong

The sequence contains seven generation or edit attempts, including ear cleanup. The large starting reconstruction used 547 words, the first ending reconstruction 476, the photo-guided grip edit 296, and the selected ending edit 320. Length alone does not prove a prompt caused failure; these were sequential changes with different inputs, not a controlled comparison.

| Prompt choice | Why it hindered this repair | Better instruction or workflow |
| --- | --- | --- |
| The ending called the grip “EXACT correctly drawn” and said “Do not redraw or simplify those hands.” | It explicitly protected the part the user still finds wrong. This is the clearest avoidable prompting error. | Approve contact geometry before preserving it. Allow the entire faulty connection to be replaced. |
| Grip corrections preserved forearm lengths, shoulder and elbow positions, then allowed only small wrist adjustments. | Correcting a grasp may require changing the linked arm pose. We gave the generator little room to reconcile those changes. | Permit hands, wrists, elbows and shoulders to change together around a whole-pose reference. |
| The selected ending held both forearms fixed while asking for a raised shoulder, bent reaching elbow and new knee support. | This imposes several dependent geometric conditions without a solved reference pose. It is restrictive, although not necessarily physically impossible. | Supply the intended ending pose; preserve identity and medium while allowing a coherent repositioning of the body. |
| The workflow switched from a one-way wrist hold to a reciprocal wrist grip. | The story remained the same, but the contact structure changed. The new reference introduced another occluded hand arrangement. | Choose one clearly staged contact arrangement before generation and use it consistently. |
| We repeatedly specified palms, thumbs, fingers and forbidden defects in a wide, fully detailed landscape. | Those words name the desired anatomy without defining its projected shape. They also mix anatomical construction, style, scene detail and face cleanup. | Solve pose and contact in a simple study, then introduce style and scenery in separate steps. |
| Review treated continuous contact and additional finger detail as evidence of correctness. | A connection can persist while remaining malformed or unreadable. | Require each arm and hand to be traceable before selecting a source for animation. |

The negative constraints were mostly reasonable, including the face rule. There is no evidence that saying “no eyes, nose or mouth” caused the hand failure. There is also no basis for claiming that a specific prompt length, JSON format or stronger adjective would reliably fix it.

## What the research supports

**Hands require spatial structure, not just an anatomy label.** HandRefiner explains why joint articulation and occlusion make hands difficult, and repairs them using reconstructed mesh depth plus conditional inpainting. Its authors also report difficulty with complex intertwined fingers. Their hand evaluation filters some small and intersecting-hand cases. This makes it useful evidence for the problem, rather than a guaranteed repair for our two-person grip. [HandRefiner, ACM Multimedia 2024, introduction, evaluation and limitations](https://arxiv.org/html/2311.17957v2)

**Explicit hand representations can help.** HanDiffuser conditions image generation on body and hand parameters, including joint positions, orientations and shapes. Its results support testing structural guidance instead of relying only on increasingly detailed prose. Its experiments do not establish performance for our built-in generator or this painted identity. [HanDiffuser, CVPR 2024](https://arxiv.org/abs/2403.01693)

**Pose and depth are different controls.** ControlNet demonstrates image generation conditioned on human pose, depth, edges and other spatial inputs. A body skeleton can specify elbows and wrists, while overlapping hands need additional shape and depth information. A reference photo passed to our current tool is softer guidance than an enforced pose or depth control. [ControlNet, ICCV 2023](https://arxiv.org/abs/2302.05543)

**Close interaction requires coordinating both bodies.** GNOCHI studies close human interactions in 3D and explicitly addresses contact and collision. This is related evidence for treating the two figures as one coordinated pose, rather than generating two individually plausible people. It is not a benchmark of our still-image tool. [GNOCHI, SCA 2026](https://arxiv.org/abs/2607.10408)

**Prompting should make edits and references unambiguous.** Official OpenAI documentation recommends clear subject/action descriptions, separate change and preservation instructions, explicit roles for reference images, and one change per iteration. It warns that repeated edits can drift. We followed the reference-role convention, but preserved geometry before it deserved approval. [Official image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)

**Precise placement remains a limitation.** OpenAI documents remaining composition-control and consistency limitations. The built-in image tool used here does not expose its exact model version, seed, masks or pose-control settings. We cannot attribute these failures to a particular architecture, prove a training-data cause, or assume an API quality setting would fix them. [Official image generation limitations](https://developers.openai.com/api/docs/guides/image-generation#limitations)

**Effort should be designed before polish.** Joseph White's push-and-pull tutorial starts with live-action reference and thumbnails, then blocks contact and weight transfer. Anthony Wong's posing tutorial evaluates meaning, silhouette, line of action and counter-pose. Applied here, those principles suggest selecting a camera and body arrangement that communicate assistance clearly before adding texture. [Push and pull body mechanics](https://www.animationmentor.com/blog/tutorial-animating-pushing-and-pulling-motions/), [Building readable character poses](https://www.animationmentor.com/blog/tutorial-building-appealing-character-poses-for-animation/)

## A better prompting approach

1. Obtain a full-pose reference or a simple posed 3D study showing both people, the intended contact, supporting limbs and the intended camera. Choose an angle where the wrists and palms remain distinguishable. Treat the current close-up as supplemental only if its grip actually matches that pose.
2. Generate a simple figure study with a quiet background. Keep the heads featureless. Specify the interaction and support points concisely, with permission to reconstruct the linked limbs. Avoid preserving the rejected picture's geometry.
3. Review the whole pose and magnified contact. Reject an image when the hands cannot be traced to their arms, even when its shading is attractive. Preserve natural occlusion; showing all ten fingers would usually make this grip less plausible.
4. Apply the selected painted identity using a separate style reference. Recheck anatomy after that edit. Introduce the river setting after the pose survives the treatment.
5. Establish the ending from an actual ending-pose reference. Allow a small, believable helper weight shift. A grip may maintain its relationship while moving through space; it does not need to occupy identical screen coordinates.

One older repository checklist also uses the phrase “no realistic anatomy” when describing the flat style. The working brief should distinguish believable structure from photographic rendering: **anatomically coherent bodies and contact, rendered with matte painted planes and entirely featureless heads.** That older wording does not appear as an instruction in the audited rebuild prompts, so it is a documentation conflict rather than a demonstrated cause of these outputs.

## Controlled test before another finished rebuild

| Condition | Input and change | What it tests |
| --- | --- | --- |
| A | Concise pose-only prompt, quiet monochrome treatment, no image reference | Whether simpler wording and reduced scene demands produce readable anatomy |
| B | The identical A prompt plus a matched whole-pose reference and one line assigning its role | Whether visual pose guidance improves over text alone |
| C | A selected B output as the edit target, plus the painted style reference | Whether the desired treatment preserves an already readable pose |

Generate two or three independent candidates for A and B when this test is run. Keep framing, action and background requirements fixed. The built-in tool does not expose a seed, so this is a practical comparison rather than a deterministic ablation. A few candidates can guide the next attempt; they cannot establish a general success rate. C depends on a B candidate passing anatomical review.

For each candidate, record whether both arm chains are traceable, palms and thumbs have clear ownership, visible fingers fit the occlusion, support and effort read convincingly, and the action remains clear at gallery size. C must also retain matte painted planes and featureless heads. If B repeatedly fails, revise the reference/camera or use a workflow with explicit geometry control or manual drawing; do not continue accumulating “correct anatomy” phrases.

The next reference-based prompt can be this concise, once a suitable full-pose reference exists:

> Image 1 is the whole-pose anatomy reference. Create a simple monochrome figure study of the same assisted rise, using its camera, limb arrangement, hand contact and support points. Show both adults fully against a quiet pale background. Preserve the reference's natural overlaps so each wrist connects visibly to its own palm. Let the shoulders, elbows, wrists and hands form one coherent pose. Use simple matte drawn shapes and normal adult proportions. Heads are plain painted volumes with no facial parts or inner-ear marks. Keep scenery minimal; no text or inset.

The research stage ran no new generations. The subsequent [pose-reference experiment](../../pose-first-test/index.html) now retains nine image outputs and all exact prompts. Its reference-based studies have simpler grips in this small batch, but the painted branch still fails the featureless-head constraint. No new video was generated. The earlier rebuilt pair remains rejected.
