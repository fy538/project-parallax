**Parallax visual capabilities and Studio research — September 22, 2026**

Expanded follow-up: [Visual tools research and comparison](/Users/feihuyan/project-parallax/analysis/visual-tools-research-2026-09-22.md) examines 13 tools, their strengths and weaknesses, integration constraints, and bounded production experiments.

The strongest next investment is an easier way to author and revise a small set of expressive scenes. The repository already contains a substantial renderer: 87 manifest dispatch identifiers, including an alias, plus catalog compositions and experimental scenes. Expand the kinds of arguments it can animate, while making each scene cheaper to change.

This is a research report and proposed direction. No runtime code, dependencies, episode data, or brand rules were changed. Findings distinguish source inspection, observed Studio behavior, existing artifacts, and proposals. Recommendations reflect the new philosophy/AI direction and the user's side-gig time constraint.

**What is already present**

“Integrated” below means wired into the episode renderer or its production tooling. It does not imply that every effect has been visually validated in a finished episode.

| Capability | Evidence in this checkout | Readiness and useful application |
|---|---|---|
| Geographic storytelling | AtlasPlate; Mapbox/deck.gl map families; CinematicMap; TerritoryMap; FlowMap | Integrated. Flat editorial geography, routes, terrain cameras, changing control, volume flows. Keep for arguments that depend on geography. |
| Still-image motion | KenBurns, BrandImage, ImageComposite, PhotoMontage; Python `render_kenburns.py` | Integrated routes for pans, zooms, crops and local clip rendering. Existing motion can be reused without generating a video. |
| AI images and image-to-video | Episode still/clip assets; AI generation tools; AiGenClip | Established asset path, with manual selection and QA still required. Generating more clips also creates more review work. |
| Guided inspection of one image | AnnotatedImage, AnnotatedZoom, ScrollyReveal, AnnotationSVGLayer | Integrated. Camera moves, accumulating annotations and highlights can turn one illustration, document or captured interface into several explanatory beats. |
| Arguments and conceptual history | Syllogism, AxiomList, DialecticFlow, ConditionalArgument, CounterfactualPath, AnalogyCrossmap, ToulminMap; PhilosophicalFamilyTree; ConceptEvolutionTimeline | Integrated. Particularly relevant to the new channel direction. These already cover premises, objections, alternative outcomes and changing meanings. |
| Games and uncertainty | GameBoard, DecisionTree, BayesianUpdate, ProbabilityGauge, CausalLoopDiagram | Integrated visual forms. These are not a general agent-simulation engine. |
| Mathematical explanation | KaTeX, MathExpression, MathReveal, MathDerivation, MathCrossfade | Integrated. Good for controlled formula reveals and derivations; not the same breadth as Manim's mathematical object animations. |
| Compositing | LayeredComposition and FullEpisode's foreground/background tracks | Integrated. Positions, blending, dimming and overlays exist. The more expressive illustrated-scene authoring layer remains limited. |
| Film finish | FilmOverlay: grain, vignette, light leak, dust, scratch, flicker | Integrated, with an episode opt-in and per-segment cascade. We already have texture controls. |
| Procedural atmosphere | GenerativeField and its GenerativeBackdrop wrapper | GenerativeBackdrop is registered in FullEpisode. Produces noise-driven fields; this is atmospheric animation, not evidence from a social simulation. |
| Vector draw-on and shape morphing | DrawOnPath; GeometricMotion prototype using `evolvePath` and `interpolatePath` | Shared primitive exists, but the inspected DrawOnPath consumer is the prototype. Path morphing is demonstrated with simple shapes; arbitrary meaningful morphs still require appropriate geometry. |
| AI still plus vector animation | AIStillComposite prototype; existing annotation/composite templates | Prototype directly demonstrates the combination. Its annotation positions and wording are hardcoded, so a reusable scene contract is the next step. |
| Native transitions | TransitionWrapper plus `transitions/grammar.tsx` | Both implemented. FullEpisode uses absolute placements; GrammarTransitionSeries serves sequential compositions. Preserve that distinction when improving overlaps. |
| Narration timing | WhisperX alignment and sync-word resolution in generate_manifest; FullEpisode sync-point injection; useNarratedCamera | Production code already exists. The separate NarrationSync demo uses mock word timings; do not mistake that demo for a verified real-narration run. |
| Stylized 3D | Recreation, ThreeCanvas, GLB animation, procedural senate set, ConstructivistEffect | Studio-registered experiment, absent from the 87-entry manifest registry and without a schema file. Includes halftone/posterization and depth output. Rigged-character rendering has recorded backend problems; not a routine production capability yet. |
| Depth-based parallax | `tools/parallax/parallax.py` | Experimental standalone depth estimation and pixel displacement. The project records problems with inferred depth on flat illustration. This is separate from deliberately prepared foreground/midground/background layers. |

Code entry points: [FullEpisode registry](/Users/feihuyan/project-parallax/remotion-templates/src/templates/Episodes/FullEpisode.tsx:543), [package versions](/Users/feihuyan/project-parallax/remotion-templates/package.json), [ScrollyReveal](/Users/feihuyan/project-parallax/remotion-templates/src/templates/ScrollyReveal/ScrollyReveal.tsx), [DrawOnPath](/Users/feihuyan/project-parallax/remotion-templates/src/components/DrawOnPath.tsx), [GenerativeBackdrop](/Users/feihuyan/project-parallax/remotion-templates/src/templates/GenerativeBackdrop/GenerativeBackdrop.tsx), [Recreation](/Users/feihuyan/project-parallax/remotion-templates/src/templates/Recreation/Recreation.tsx), [Whisper integration](/Users/feihuyan/project-parallax/tools/assembly/generate_manifest.py:2692).

The [existing capability map](/Users/feihuyan/project-parallax/remotion-templates/REMOTION_CAPABILITY_MAP.md) and [motion roadmap](/Users/feihuyan/project-parallax/project/REMOTION_MOTION_LAYER_ROADMAP.md) partially predate implementations. For example, paths/noise/transitions are installed and used, GenerativeBackdrop is manifest-facing, and Whisper synchronization exists. Their “25%” utilization estimate has no defined denominator and should not drive investment decisions.

An existing [prototype reel](/Users/feihuyan/project-parallax/remotion-templates/out/proto-reel.mp4) is on disk; ffprobe reports 50.71 seconds. I inspected the geometric prototype in live Studio, not every frame of this saved reel. I also inspected an existing 3D still; it shows the stylized set, and does not establish successful character playback.

**What I observed in Remotion Studio**

The installed runtime is **4.0.457**. I launched the existing Studio and inspected its UI without saving edits:

- `proto-geometric-motion` displays the draw-on geometry at frame 48.
- `ScrollyReveal` exposes its schema as controls: image, annotations, camera focus, timings and labels. It reports: “Can't save default props: Could not find or extract defaultProps for composition \"ScrollyReveal\".”
- `prisoners-dilemma-full` has no editable schema panel. Its wrapper imports the manifest and template data directly, takes no props, and binds metadata to those imports.
- Studio already has composition search, an asset tab and a categorized catalog. A new generic catalog would duplicate existing infrastructure. The useful change is a smaller editorial selection and reliable editing/persistence.

Sources: [full-episode wrapper](/Users/feihuyan/project-parallax/remotion-templates/src/templates/Episodes/PrisonersDilemmaFull.tsx), [Scrolly registration](/Users/feihuyan/project-parallax/remotion-templates/src/templates/ScrollyReveal/index.tsx), [catalog](/Users/feihuyan/project-parallax/remotion-templates/src/catalog/README.md).

**Newer Remotion changes worth evaluating**

Current official documentation describes native Studio interactivity, introduced in 4.0.475: selectable canvas elements, transform editing, timeline keyframes and source writeback. Our installed version predates it. Treat an upgrade as an authoring experiment before developing a custom editor. [Studio interactivity](https://www.remotion.dev/docs/studio/interactivity).

The current effects system dates from 4.0.464, also newer than our runtime. Its catalog includes paper, halftone, roughened edges, color correction, reveal masks, progressive blur, corner pinning and procedural patterns. These are candidates for a few controlled presets. Their exact introduction versions vary; verify the selected target release and rendering backend before adoption. [Effects](https://www.remotion.dev/docs/effects).

Native source editing has constraints. Remotion's guidance favors inline editable values; its default-props saver relies on inline object literals. Our imported JSON, shared tokens and computed scene timing cannot be assumed to become editable merely by upgrading. Preserve the current canonical episode JSON and test how edits return to it. Avoid copying dozens of data objects into registrations just to satisfy the UI. [Interactivity best practices](https://www.remotion.dev/docs/studio/interactivity-best-practices), [props editing](https://www.remotion.dev/docs/visual-editing).

The old `visualControl()` API is now deprecated. A new implementation should investigate the supported interactivity path. [Official deprecation](https://www.remotion.dev/docs/studio/visual-control).

Upgrade work should align Remotion packages, check the target's actual peer dependencies, and revisit the local version test, which currently hardcodes Zod 4.3.6. That local assertion is not evidence for every future Remotion release. Use typecheck, relevant unit tests and representative render checks after changing versions; a research-only audit does not need to rerun the entire repository suite.

**Effects and scene types that would earn their production cost**

| Proposed use | What the audience sees | Starting point | Cost to keep in mind |
|---|---|---|---|
| Persistent thought experiment | The same actors and objects remain while rules, choices and outcomes change | SVG/React, existing diagrams, DrawOnPath | Needs one reusable scene/state abstraction. Avoid inventing a general animation language. |
| Identity fork and merge | One mind becomes two; memories and commitments diverge; branches reconnect | CounterfactualPath, shared object IDs, simple path/position interpolation | Medium initial work; reusable for identity, agency and responsibility. |
| Counterfactual comparison | Two copies of a scene run under different rules, with differences highlighted | ComparisonPair/SplitFrame, shared scene data | Keep event timing shared and assumptions explicit. |
| Illustration with precise overlays | One rich still receives callouts, moving symbols, a revealed mechanism or an altered region | ScrollyReveal, LayeredComposition, AIStillComposite | Low additional infrastructure if we start with annotations. Asset generation remains separate. |
| Multiplane paper scene | Prepared cutout layers move at different speeds; shadows and camera framing create depth | CSS/SVG transforms or simple Three.js planes | Layer separation and repairing revealed background regions take human time. Prefer two or three intentional layers. |
| Model-to-world transformation | A diagram appears over an illustration, then exposes what its assumptions omit | SVG masks, draw-on, match composition, paths | Good signature effect; protect label and object correspondence. |
| Small rule-driven simulation | Agents pursue a proxy reward, cooperate, compete or coordinate; a rule change alters behavior | Seeded TypeScript/Python trace; SVG/Canvas renderer | Simulation logic and claims require verification. A toy model illustrates its assumptions, not a prediction about real AI. |
| Dialogue as a visible argument | A claim appears, a reply targets a premise, and the argument rearranges | Existing argument primitives plus a dialogue scene | Keep quoted outputs distinct from invented dialogue; avoid merely transcribing paragraphs on screen. |
| Focus and material finish | Selective blur guides attention; paper/halftone/edge treatment unifies assets | Existing overlays; newer native effects after evaluation | Cheap presets can still hurt readability or rendering speed if stacked indiscriminately. |
| Restrained abstract 3D | Rooms, branching corridors, nested spaces or optimization landscapes | Installed Three.js/R3F/Remotion Three | Simple geometry is a better first target than rigged actors and new character assets. |

For a first implementation, prioritize **persistent objects, annotations, masks, and narration cues**. Motion blur, distortion and heavy particle effects are finishing options; none removes the current authoring bottleneck by itself.

**Other code-rendered tools, and whether to add them**

| Tool | What it adds | Recommendation for this repository |
|---|---|---|
| React/SVG + Remotion paths/shapes | Precise geometry, state changes, masks and line drawing | Primary route. Already installed; grow a small reusable scene vocabulary. |
| Three.js + React Three Fiber | Spatial scenes, lighting, camera movement and shaders | Already installed and experimentally used. Start with abstract geometry. Remotion requires frame-derived animation rather than a wall-clock animation loop. [Integration](https://www.remotion.dev/docs/three). |
| D3 / custom simulation code | Layout and computed visual states | d3-force is already installed and used in cartogram layout. For animated simulations, precompute seeded states and sample by frame. D3 provides manual stop/tick control; it is not an ethical-agent simulator. [D3 simulation API](https://d3js.org/d3-force/simulation). |
| Rough.js | Hand-drawn SVG/Canvas marks and hatching | A small optional addition if the notebook aesthetic is selected. Cache seeded geometry so strokes do not regenerate randomly between frames. [Rough.js](https://roughjs.com/). |
| Manim Community | Python-authored mathematical animations | Useful for an occasional demanding mathematical insert, rendered to a clip and assembled in Remotion. Existing KaTeX covers basic equation needs. A second renderer introduces its own authoring and style work. [Manim](https://docs.manim.community/en/stable/). |
| Motion Canvas | TypeScript vector animation with a preview editor and voiceover timing tools | A credible alternative to test if authoring expressive vector scenes stays painful. It would duplicate part of the current stack; evaluate one equivalent scene before adopting it. [Motion Canvas](https://motioncanvas.io/docs/). |
| Lottie | Playback of reusable vector animation assets inside Remotion | Useful when a suitable animation already exists. It does not remove the need to design that animation. [Remotion Lottie](https://www.remotion.dev/docs/lottie). |
| Remotion Player | Existing React compositions embedded with runtime controls | A route to a small scene workbench or interactive companion experiment. This is custom app work, not a ready-made Studio extension. Try native Studio improvements first. [Player](https://www.remotion.dev/docs/player). |
| Skia / shader effects | Additional canvas-based effects and drawing | Defer until a specific effect exceeds existing SVG/CSS, the newer native effects system, and installed Three.js. Another rendering backend adds maintenance. [Skia integration](https://www.remotion.dev/docs/skia). |

Motion blur is available as a separate Remotion package, with trail and camera-motion components. Use it selectively on fast visual movement and benchmark render cost before making it a default. [Motion blur](https://www.remotion.dev/docs/motion-blur).

**A bounded Studio improvement plan**

1. **Prove edit → save → reopen → render on one scene.** Use ScrollyReveal or an annotated still. Test image replacement, label, focus position, cue timing and duration. Prototype newer native interactivity separately; confirm where saved values live. Success means the rendered frame agrees with the reopened editor.
2. **Curate a philosophy shelf.** Select six to eight existing compositions under a purposeful entry point: compare views, challenge a premise, fork an identity, revise a belief, reveal a mechanism, trace a concept. Reuse the catalog and contact-sheet tools. Add examples using the new subject matter.
3. **Make one evolving scene reusable.** Define objects, positions, text and a short list of timed actions. Start with reveal, highlight, move, duplicate and connect. Keep object identity across changes. Avoid adding a new full template for each philosophical example.
4. **Connect real narration cues.** Reuse the existing Whisper pipeline, show the cue phrase with its timing, and provide a small editable offset. A literal waveform animation and semantic narration alignment serve different purposes.
5. **Add lightweight review conveniences.** Scene names containing recognizable narration phrases; before/after stills; contact sheets using actual episode assets; scene-only preview/render. Extend existing helpers before introducing a custom workbench.

The first acceptance test should be a 60–90 second explanation about a machine making a promise and then being copied. Reuse one scene with two branches and one illustration. Then change the wording, delay a cue, replace the illustration and render again. Track human authoring/review time separately from machine rendering time. Repeat the same recipe for another philosophical question before expanding the toolkit.

The investment is justified if the second scene is easier to make and revisions stay local. A growing number of templates is not by itself a production improvement.

**Verification limits**

This audit inspected source, registrations, dependencies and existing documents; launched Studio; checked the controls and save warning described above; viewed a representative geometric frame and an existing 3D still; and checked the saved reel's metadata. External capabilities were checked against primary documentation. No new dependencies were installed, no upgrade was attempted, no complete episode or 3D character was rendered, and no performance or human-time savings were benchmarked. All new scene concepts and the Studio plan remain proposals.

**Follow-up implementation (September 22)**

The first bounded pilot is now implemented and rendered: [Promise and copy — editing guide and verification](/Users/feihuyan/project-parallax/remotion-templates/src/pilots/PromiseAndCopy/README.md). It runs on the existing Remotion version. The 74-second scene uses one code-drawn illustration, persistent objects, a fork and connections. Studio title, position, image and pause edits were exercised; persistence was confirmed in source and after reopening. On this installation, Schema field commits save automatically to inline `defaultProps`, without a separate Save button. Measured scratch-audio lengths drive the shared audio/visual timeline. This is a standalone pilot; broader Studio upgrades and the second-scene production-time comparison remain untested.
