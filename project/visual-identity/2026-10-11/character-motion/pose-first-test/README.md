# Assisted step pose reference test

October 11, 2026

[Open the complete gallery](index.html). Nine generated images compare text-only pose studies, whole-body reference studies, painted treatment and river context. The reference-based poses are easier to read in this small batch. **None is approved for production or animation:** the finished branch still has nose-like contours and inner-ear anatomy, and its fine contact geometry needs review.

## What the comparison shows

| Stage | Result |
| --- | --- |
| A1 and A2, identical text-only prompt | Connected arm paths and visible footing, but extra rows of finger shapes at the clasp. Neither was selected. |
| B1 and B2, same prompt plus a photograph and reference-role prefix | Simpler two-hand arrangements with more traceable wrists. B1 was selected provisionally for style testing. Ear marks remain in these diagnostic studies. |
| C1, paint applied to B1 | Overall pose and clasp arrangement survive the treatment. The heads have nose-like contours and inner-ear marks. |
| C2 and C3, head edits | C2 barely changes the defects. C3 softens them but still fails at enlarged scale. |
| D1, river added to C3 | Rear boot on a shallow stone, front boot on the bank and braced helper make the assisted step legible. The head defects remain; the terrain is also too busy and naturalistic. |
| D2, another head-reference edit | Larger painted head planes, but profile breaks and ear anatomy persist or become clearer. Not selected over D1. |

The four pose samples have no exposed shared seed. Their difference supports trying whole-body guidance for this scene; it cannot establish a general success rate or prove a model-wide advantage. Style and context are sequential edits, with small changes to the drawing. They are not independent trials. All assessments are visual judgments rather than biomechanical measurements.

[Four enlarged monochrome grips](contact-review.html) · [Painted heads and contact details](paint-detail.html) · [Earlier rejected rebuild](../qa/assisted-pull/rebuild.html) · [Research and prompt audit](../qa/assisted-pull/prompting-research.md)

## Where to go from here

Review B1 and D1 for the intended action before designing an ending. This is an assisted step with both feet supported, using a different camera and body arrangement from the rejected river pull. A suspended rescue would require a different whole-body reference. Do not infer that this pose solves the original action unchanged.

Keep the pose-first workflow, but do not lock its contact as anatomically correct. Review which fingers and palm belong to each wrist. The finished branch also needs a controllable head redraw and quieter scenery. Repeated small verbal head corrections have not solved the constraints in this test. An ending pose and motion trial should follow a source drawing that passes these checks.

## Generation and references

All nine outputs use **built-in image generation and editing**, with an opaque background. Exact model version, seed and enforced pose/depth controls are not exposed. No new video was generated. Files are unmodified copies of their generated originals; original paths, dimensions, SHA-256 hashes, reference roles, exact prompt text and individual review status are in [studies.json](studies.json).

Exact prompt set: [A](prompts/a-pose-only.txt), [B](prompts/b-whole-pose-reference.txt), [C1](prompts/c-painted-treatment.txt), [C2](prompts/c2-featureless-heads.txt), [C3](prompts/c3-redrawn-heads.txt), [D1](prompts/d-river-context.txt), [D2](prompts/d2-geometric-heads.txt).

Pose photograph: [Helping Hand on Old Rag](https://commons.wikimedia.org/wiki/File:Helping_Hand_on_Old_Rag_(22310055090).jpg), Shenandoah National Park / Katy Cain, October 26, 2015. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/); Commons also lists US public domain as an NPS work. The [saved photograph](references/old-rag-pose.jpg) is unmodified. Generated adaptations change clothing, scenery, medium and heads; no endorsement is implied.

Style input: [daylight desk study](../../../2026-10-10/character-and-storyboard/06-desk-daylight.png). Later head-only references: [faceted desk head](../../../2026-10-10/context-tests/02c-desk-faceted-face.png) and [blank profile study](../01-head-end.png). These guide medium or head design rather than body pose.

Gallery detail panels magnify originals with CSS. The palette comes from the parent gallery's canonical palette file; Arial is a local fallback for IBM Plex. [render-gallery.cjs](render-gallery.cjs) checks image loading, local links, enlargement and desktop/mobile overflow, and saves preview screenshots and [gallery-checks.json](gallery-checks.json).
