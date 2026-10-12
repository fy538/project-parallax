# Parallax visual identity exploration

This brief covers the first five directions. [Open the complete gallery with generated samples for all 13 directions](all-directions.md).

Develop a recognizable illustration system for philosophical video essays: artsy, humane, visibly designed, and capable of both quiet observation and substantial action. The strongest directions to develop are layered paper theatre, charcoal with spot color, and the bolder graphic risograph. Woodcut offers continuity with the existing constructivist direction; gouache offers warmth but needs more distinctive composition.

These are illustration studies generated with the built-in image tool on October 10, 2026. Animation assessments below are design hypotheses, pending video trials. The six PNGs are native 1672 × 941 drafts. Exact generation prompts and original output locations are in [studies.json](studies.json).

## Illustration directions

| Direction | Visual character and potential identity | Motion opportunities to test | Main weakness to address |
| --- | --- | --- | --- |
| [Modern woodcut](01-modern-woodcut.png) | Strong black masses, broad carved marks, angular architecture and organic figures. Closest continuation of the current work. | Graphic gestures, directional cuts, controlled camera moves. | Dense gouges may crawl during motion. The current bakery feels nostalgic; compositions need more surprise. |
| [Layered paper theatre](02-paper-theatre.png) | Matte silhouettes, shallow depth, visible overlaps. A stage whose scenery can move as an argument changes. | Layer shifts, articulated gestures, entrances and scene transformations. | AI may inflate flat paper into soft 3D. The current treatment needs a sharper palette and less storybook gentleness. |
| [Charcoal with spot color](03-charcoal-spot-color.png) | Searching contours, dark masses, clean paper and one accent. Intimate, reflective and emotionally observant. | Expressive human gestures, controlled redraws, atmospheric movement. | Fine strokes may boil or disappear. Clean fields and deliberately chosen marks matter. |
| [Editorial gouache](04-editorial-gouache.png) | Opaque paint, organic forms, broad strokes and warm human storytelling. | Body movement and environmental changes within a painted world. | Familiar illustrated-book territory. The sample also merges the adult's resting hands; fix that before animation. |
| [Graphic risograph](05b-graphic-risograph.png) | Indigo and vermilion, large printed shapes, abundant empty paper. The strongest departure in this batch. | Shape choreography, graphic transitions and simple articulated actions. | Elongated figures can drift toward generic editorial vector art. Give profiles, proportions and line endings more personality. |

The [first risograph attempt](05-two-color-risograph.png) is retained for comparison. It drifted toward vintage textured illustration. The revised print changes both shape language and palette, so it also tests a color departure rather than isolating medium alone.

The paper study has the clearest separation of objects. The charcoal study has the strongest feeling of a person observing a scene. The graphic print has the strongest immediate silhouette and color identity. These are aesthetic judgments about this batch, not measured animation results.

## A recognizable Parallax system

Make a change of viewpoint the recurring visual gesture. At an argumentative turn, a foreground plane slides, a frame opens, or a second view exposes a relationship that was previously hidden. Tie the reveal to the narration's actual claim. Reserve the gesture for meaningful changes so it retains its force.

Three possible systems follow from the shortlist:

- **Paper theatre:** bone paper, dark ink, amber and a restrained cool accent; organic human profiles within angular architecture; deliberate overlaps and shallow stage shadows. Changes of scenery reveal context.
- **Charcoal:** mostly clean bone paper, a few dark masses, searching contours and one spot color. A line can be redrawn or an area erased when an interpretation changes.
- **Graphic print:** two strong inks, expressive silhouettes, sparse linework and deliberate overprints. Separate printed planes align or diverge as competing explanations are introduced.

Each system needs consistent rules for proportions, edge quality, empty space, palette and motion. A medium name alone will not distinguish the channel. Preserve selective detail: one observed hand or bread crust can carry more character than equally elaborate patterns across faces, clothing and walls.

Cut-paper has a useful animation lineage. Lotte Reiniger describes individually articulated limbs and backgrounds made from transparent paper layers. That supports the artistic logic of a theatre system; it does not establish its reliability in current AI video models. [Reiniger's firsthand account, reprinted by BFI](https://www.bfi.org.uk/sight-and-sound/features/scissors-make-films-lotte-reiniger-creating-her-magical-animations).

## What the technical research supports

The starting image supplies composition, subjects, light and style; the video prompt can concentrate on movement. Runway advises starting simply and warns that flaws in hands or faces can become more pronounced in video. [Runway image to video guide](https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide).

VBench++ evaluates subject identity, background consistency, flicker, smoothness and movement amount separately. It identifies local fine detail as a source of temporal inconsistency and explains why an almost frozen clip can score well on consistency. Our tests should therefore require the action to happen as well as preserve the drawing. [VBench++ paper, temporal quality dimensions](https://arxiv.org/html/2411.13503v1).

For larger movement, controls beyond text are worth testing. Firefly documents camera motion references and first or last frame inputs. A camera reference guides the viewpoint; character choreography needs its own suitable control or carefully staged keyframes. [Adobe camera motion reference documentation](https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-video/match-camera-motion-to-reference-video.html).

Visual plausibility also needs a separate check from physical correctness. VBench 2.0 evaluates human fidelity, controllability, physics and commonsense, among other dimensions. That distinction matters when a hand must grasp a coin or one person must support another. [VBench 2.0 paper](https://arxiv.org/abs/2503.21755).

## Practical design hypotheses to test

1. **Make the action legible in the starting frame.** Separate hands, limbs and props; keep the acting hand visible; leave space for the ending pose. Anonymous faces still need coherent jaws, ears, necks and body proportions.
2. **Use detail at a scale that can survive movement.** Prefer chosen brush marks, broad gouges and calm color fields. Test fine hatching and stipple carefully. A stable paper texture added in compositing may be more controllable than asking a generator to reconstruct dense grain in every frame.
3. **Match camera motion to the medium.** Lateral shifts and shallow pushes suit a planar illustration. A large orbit asks the model to invent unseen sides and may turn a print into a different-looking object.
4. **Build larger actions around readable poses.** Plan approach, contact and outcome. Split a river rescue into purposeful shots when one long generation cannot make the mechanics clear. The cut should follow the story's action.
5. **Choose the animation method per shot.** Remotion can provide exact pans, layer shifts, typography and diagram changes. Generative video can handle selected human and environmental actions. Preserve the same visual rules across both.

The paper study is a flattened PNG, not a file containing editable layers. Deterministic parallax would require separate cutouts and clean background plates.

## A small video comparison

Normalize two finalist styles to the same layout, starting poses and prop positions before testing. The current studies differ in staging, so a direct comparison would confound medium with composition.

Use one video model and version, the same output dimensions, duration and control settings, and three independent attempts for each of these tasks. A proposed five-second duration gives 18 clips for two styles. Choose seeds in advance if supported, and keep failed attempts in the record.

| Task | Shared motion prompt | What to inspect |
| --- | --- | --- |
| Quiet baseline | The camera makes a gentle forward push toward the counter. Both people hold their poses. | Silhouette and palette retention, line or grain flicker, unintended gestures. |
| One gesture | The child extends the hand holding the coin toward the shopkeeper and pauses. The shopkeeper watches. The camera stays fixed. | Coherent arm and hand, coin retention, appropriate motion range. |
| Contact stress test | The child offers the coin. The shopkeeper reaches out and takes it, then holds it above the counter. The camera stays fixed. | One coin throughout, readable transfer, believable contact, distinct hands and bodies. |

Record action completion, subject continuity, style retention, flicker, contact correctness and usable duration separately. Also record retries and time spent fixing the starting image. Judge the full set rather than only the best clip.

After this comparison, test the finalist on a different scene with substantial movement, such as a river rescue, and on an abstract explanation. A visual identity needs to work across the channel's stories.

![Modern woodcut study](01-modern-woodcut.png)

![Layered paper theatre study](02-paper-theatre.png)

![Charcoal and spot color study](03-charcoal-spot-color.png)

![Editorial gouache study](04-editorial-gouache.png)

![Graphic risograph study](05b-graphic-risograph.png)
