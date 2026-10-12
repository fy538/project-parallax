# Illustrated cutouts instead of the SVG grove

23 September 2026. The user rejected the earlier forest comparison because the SVG was too rigid. Its abrupt shift from a rich constructivist image to generic triangle trees dropped the visual language we had selected.

**Review outcome:** the user subsequently rejected this test's motion/transition as well. Replacing SVG trees with raster cutouts preserved more of the illustration style but did not resolve the staging problem. This remains an experiment record, not an approved production approach. The [follow-up proposal](image-remotion-synergy-2026-09-23.md#latest-direction-design-the-illustration-for-the-intended-motion) plans illustrated poses, short actions, and cuts together; the user's four-panel idea is the next storyboard candidate.

## New test

The same 44.7-second narrated thought experiment now uses a generated background plate and a transparent generated sapling throughout. Remotion positions four original plants, adds four new ones, and lifts/replants the last plant eight times. The same event trace drives the counters: 12 planting events, four new trees, eight plants in the counted plot. No video model redraws the artwork. The lower root ball is hidden by a code-defined soil baseline when planted and exposed during lifting. A small rotation accompanies the lift; otherwise each cutout keeps its silhouette.

Render: [forest-argument-cutout-v1.mp4](../remotion-templates/out/style-lab/forest-argument-cutout-v1.mp4). Studio: **Experiments → forest-argument-cutout**. Sources: [IllustratedGrove.tsx](../remotion-templates/src/experiments/IllustratedGrove.tsx) and [shared study](../remotion-templates/src/experiments/ForestArgumentStudy.tsx).

Project assets, generated using the built-in image tool:

- [Empty ground](../remotion-templates/public/style-lab/forest-empty-ground-v1.png)
- [Sapling with alpha](../remotion-templates/public/style-lab/forest-sapling-cutout-v1.png)

Both use [the approved forest study](../remotion-templates/public/style-lab/constructivist-forest-score-v2.png) as a style reference. The background retains distant tree silhouettes despite the prompt's exclusion; these are outside the explicitly labeled counted plot. Exact planting counts refer only to the code-placed saplings.

The first composite keeps the material and spatial character much better than the SVG grove. It is still limited cutout animation: the plant's leaves do not articulate, and the same asset is reused with small size differences and horizontal mirroring. Two generated assets plus eight placement coordinates are additional preparation work. This tests a practical route for a recurring scene; it does not prove that every image should be decomposed into layers or that the workflow is faster.

Verification: TypeScript passed; the five existing planting/timeline tests passed; the 1920×1080, 30 fps H.264/AAC export decoded without error. Opening, eight-plant state, maximum lift, final state, and a 480×270 phone-scale frame were inspected. The decoded audio hash matches both earlier cuts. The full video duration is 44.714667 seconds, including AAC padding. These technical checks did not establish motion quality; the subsequent user review rejected it.

## Exact prompts

**Ground plate.** Input: approved forest study, style reference only.

> Use case: stylized-concept. Asset type: an unlettered 16:9 background plate for a Parallax editorial animation. The attached forest illustration is a STYLE REFERENCE, not an edit target. Create an EMPTY planting ground in the same distinctive constructivist print language: layered angular soil strata, ambitious diagonal composition, shallow cutaway depth, warm ivory, walnut, charcoal and sand, subtle restrained ink texture. A broad empty dark-soil planting bed occupies the lower center of the frame; its top face is a generous clear trapezoid, approximately from 15% to 88% of image width and from 53% to 78% of image height, viewed slightly from above. The near edge is gently diagonal. Leave generous empty pale air above it, where separate sapling cutouts will be composited later. Show the depleted surrounding land using just two strong stump silhouettes at the far outer edges. Keep the front cutaway face in 2–3 broad soil planes with very few details. The image should feel spacious and authored, not a generic flat icon or game asset. No living plants or trees anywhere, no roots, no planting holes, no gold score line, no circles, no sun, no text, no numerals, no labels, no grids, no arrows, no people. No photorealism, no glossy 3D, no dense speckles, no decorative scratch texture. Return a single full-frame opaque landscape illustration, not a sprite sheet.

**Sapling.** Input: approved forest study, style reference only.

> Use case: stylized-concept. Asset type: a single transparent sapling cutout for a Parallax Remotion animation. The attached image is a STYLE REFERENCE only. Generate ONE young broadleaf tree matching the reference's foreground saplings: a slender warm walnut stem, an asymmetrical arrangement of a few angular muted olive and dark walnut leaves, leaves built from overlapping cut-paper planes, subtle restrained print texture, irregular authored edges. The silhouette must have life and asymmetry, not be a stack of identical triangles or a generic SVG icon. At its base include a small compact dark soil root ball, integrated with the trunk, so the complete plant can be lifted and replanted. Tree, leaves and root ball are one cohesive cutout. Show the entire sapling upright at a slight natural lean, front view, center it with a small clean margin, fill most of a portrait-oriented canvas. GENUINELY TRANSPARENT background with alpha, no white rectangle, no checkerboard rendered into the art, no scene, no ground plane, no cast shadow, no extra plant, no pot, no text, no watermark. No photorealism, no glossy 3D, no painterly blur, no dense scratch texture. Keep the illustrated warm geometric character of the reference.
