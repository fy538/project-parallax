**Visual tools for Parallax's philosophy and AI channel**

Research date: September 22, 2026. Scope: the five tools discussed—Three.js, D3, Rough.js, Manim, and Motion Canvas—plus eight adjacent options. This is a decision document, not an installation plan.

The aim is to make interesting arguments visible while keeping a solo side project affordable in human time. Recommendations below are editorial and engineering judgments based on official documentation and this checkout. They are not comparative performance benchmarks.

**Recommendation**

Keep Remotion as the main composition and rendering system. Develop the existing illustrated scenes, add computed behavior when the argument needs it, and use another renderer for a specific sequence that earns the extra workflow.

The strongest next candidates are:

- **D3 with small custom simulations:** make rules and their consequences visible.
- **Simple Three.js scenes:** explain ideas that depend on perspective, space, or dimensions.
- **Rough.js:** test an illustrated notebook treatment on existing artwork.
- **GSAP inside Remotion:** investigate whether complex choreography becomes easier to revise.
- **ELK.js:** investigate only when arranging an evolving argument diagram becomes time-consuming.

Manim and Blender are useful specialist production routes. Motion Canvas deserves an equivalent-scene comparison if choreography remains a bottleneck. The remaining options serve particular asset, scale, or effects needs.

**What we already have**

Local inspection confirms these installed versions: Remotion and @remotion/three 4.0.457; Three.js 0.184.0; React Three Fiber 9.6.1; d3-force 3.0.0; d3-geo 3.1.1. The other JavaScript candidates in this document are not declared direct dependencies in the Remotion package. That does not establish whether a desktop application or unrelated environment is installed.

Evidence: [package declarations](/Users/feihuyan/project-parallax/remotion-templates/package.json), [D3 cartogram layout](/Users/feihuyan/project-parallax/remotion-templates/src/utils/dorling.ts), [Three.js experiment](/Users/feihuyan/project-parallax/remotion-templates/src/templates/Recreation/Recreation.tsx).

The two existing pilots use React/SVG and share the canvas, narration track, timeline calculation, machine symbol, connections, and tree artwork. The second pilot already demonstrates counts, persistent objects, and changing consequences without a new graphics package. Its planting sequence is authored; it is not a trained agent or an observed AI experiment. See [Promise and copy](/Users/feihuyan/project-parallax/remotion-templates/src/pilots/PromiseAndCopy/README.md) and [What we count](/Users/feihuyan/project-parallax/remotion-templates/src/pilots/WhatWeCount/README.md).

That is the baseline each new tool should improve. The second pilot's recorded render took about 39 seconds, but we have no comparable human-authoring baseline. Render speed alone cannot establish production savings.

**How these tools fit together**

Remotion provides the video timeline, React composition, audio placement, preview, and export. The tools below work at different layers:

| Layer | Tools | What they contribute |
|---|---|---|
| Compute positions or behavior | D3, ELK.js, our own simulation code | Data, layouts, and sequences of states to visualize |
| Draw inside a composition | Three.js, Rough.js, PixiJS, p5.js, Skia | Different graphics capabilities or visual treatments |
| Choreograph existing elements | GSAP | A different way to sequence motion within Remotion |
| Play authored animation assets | Lottie, Rive | Reusable animation files made elsewhere |
| Author and render separate sequences | Manim, Motion Canvas, Blender | Specialist scenes imported into the final assembly |

These layers can be combined. For example, custom rules could generate a belief-network trace, D3 could position its nodes, Rough.js could draw its edges, and Remotion could synchronize the scene with narration. That combination is a possible design, not a recommendation to install all three at once.

**Comparison at a glance**

“Friction” estimates the extra setup, authoring knowledge, and maintenance for this repository. Low/medium/high are qualitative assessments; a complex scene can make any tool expensive.

| Tool | Strongest contribution | Main weakness for us | Remotion route | Friction | Suggested use |
|---|---|---|---|---|---|
| Three.js + React Three Fiber | Spatial explanation and camera perspective | Modeling, lighting, and GPU/render debugging | Existing official integration | Medium; high for characters | Try simple geometry |
| D3 + custom rules | Computed layouts and evolving systems | Rules and scientific meaning remain our responsibility | Precomputed data → SVG/Canvas | Low–medium | High priority when behavior matters |
| Rough.js | Consistent drawn outlines and hatching | Style treatment does not create illustration or choreography | Seeded SVG/Canvas graphics | Low | Small aesthetic trial |
| Manim Community | Mathematical transformations | Separate Python/rendering and typography workflow | Render an insert | Medium–high | Use for demanding math |
| Motion Canvas | Sequential vector choreography with audio cues | Another scene system and editor | Render an insert or alternative pipeline | Medium–high | Conditional comparison |
| GSAP | Timelines, overlaps, and staggered motion | Official adapter has a restricted feature set; requires upgrade | Official integration from 4.0.517 | Medium initially | Test before changing animation systems |
| ELK.js | Directed diagrams and routed connections | Layout is not rendering; revisions can rearrange the scene | Precompute layout → SVG | Low–medium | Use when manual layout hurts |
| PixiJS | Dense 2D sprites and particles | Custom frame synchronization and GPU lifecycle | Custom Canvas integration | Medium–high | Use after a measured scale problem |
| p5.js | Generative drawing and rapid visual experiments | Typical sketches depend on a running loop and prior state | Adapt sketch or render separately | Medium | Exploration, selectively |
| Lottie | Reuse of existing vector animation | Asset editing and expression compatibility | Official integration | Low with a suitable asset | Opportunistic reuse |
| Rive | Reusable animated objects and visual authoring | Editor/export cost; wrapper does not document full state-machine control | Official animation playback | Medium | Recurring character/object |
| Blender | Detailed 3D, rigging, and drawn animation | Highest likely production and learning burden | Render an insert; optional asset export | High | Occasional signature scene |
| Skia | Custom pixel effects and procedural drawing | Another drawing API, WASM setup, and backend testing | Official integration | Medium–high | Only for a demonstrated effects gap |

Documentation supporting this summary appears beside the individual findings below.

**The original five tools**

**1. Three.js with React Three Fiber — spatial thought experiments**

**What it adds.** Three.js is a JavaScript 3D graphics library. React Three Fiber lets us describe its scenes using React; Remotion's ThreeCanvas connects those scenes to the video frame. We can work with geometry, cameras, materials, and lighting instead of manually suggesting depth with flat shapes. [Three.js project](https://github.com/mrdoob/three.js), [Remotion integration](https://www.remotion.dev/docs/three).

**Strengths for this channel.** Perspective can become part of the reasoning. A camera reveal can show that two apparently contradictory views belong to the same object. A navigable room, branching corridor, or reward surface can preserve spatial relationships across a whole explanation. Simple procedural objects remain easy to parameterize and reuse.

**Weaknesses and costs.** The library does not supply good models, composition, or lighting decisions. Readable labels in a moving space need deliberate placement. Detailed characters introduce rigging and asset work far beyond an abstract scene. Our existing Recreation experiment has recorded character/backend limitations; installed dependencies do not establish production readiness.

**Integration constraint.** Derive animation from Remotion's current frame rather than a normal live animation loop. The official integration also documents renderer configuration requirements, including ANGLE for its described rendering path. Test the actual target environment. [Integration and rendering notes](https://www.remotion.dev/docs/three).

**Proposed trial.** A 15-second “same object, different perspectives” scene with one simple object, two camera positions, and two labels. Change the camera timing and render again. Use Three.js if that reveal explains something a flat illustration obscures; do not begin with a rigged narrator.

**2. D3 and custom simulations — show rules producing outcomes**

**What it adds.** D3 provides visualization calculations; the installed d3-force computes node positions using forces. It supports stopping its automatic timer, advancing a chosen number of ticks, and controlling randomness. It mutates simulation nodes, so inputs need defensive handling. [Force simulation API](https://d3js.org/d3-force/simulation).

**Strengths for this channel.** Many connected objects can organize themselves without individually authored coordinates. We could show a network split into communities, a distribution change, or choices accumulate into an unexpected collective outcome. Separating the underlying state from its presentation makes alternative assumptions easier to compare.

**Weaknesses and costs.** D3 does not supply theories of belief, cooperation, ethics, or intelligent agents. We must write those rules and check what they imply. A force-directed cluster is a layout result, not evidence of real social clustering. Simulations also create a new editorial obligation: explain assumptions and avoid selecting only the most dramatic seed.

**Integration approach.** Keep React responsible for drawing; use D3 for calculations. Precompute a fixed trace or layout and select the appropriate state for each frame. Avoid a D3 timer changing the scene while Remotion seeks. Our cartogram utility already demonstrates manually stepped layout.

**Proposed trial.** Give 20 agents an explicit, simple rule for choosing neighbors. Render two runs differing in one parameter, with the rule visible. If the goal is reward gaming, implement the choice and reward calculation explicitly; neither animated dots nor the existing tree sequence demonstrate learning by themselves.

**3. Rough.js — an illustrated notebook surface**

**What it adds.** Rough.js produces imperfect geometric outlines and fills, including hatching, as SVG or Canvas graphics. Its options control roughness, curvature, stroke, fill, and a seed that reproduces a shape. [Official API and options](https://github.com/rough-stuff/rough/wiki).

**Strengths for this channel.** It can give our existing machines, trees, arrows, and thought-experiment diagrams a coherent drawn treatment while preserving exact object positions and labels. This is a relatively contained way to explore a less clinical aesthetic.

**Weaknesses and costs.** It does not invent an illustration, animate a hand, write handwriting, or decide the order of a reveal. Dense hatching can compete with text and make small diagrams harder to read. Applying the effect to every mark may make evidence, uncertainty, and decoration visually indistinguishable.

**Integration approach.** Generate geometry with stable object seeds, cache it, then animate transforms or masks in Remotion. A seed makes repeated generation stable for the same inputs; changing geometry every frame can still change the stroke appearance. For ordinary movement, transform the existing paths.

**Proposed trial.** Restyle one existing pilot frame and a ten-second movement without changing the script. Compare clean outlines, restrained rough outlines, and rough outlines with hatching at phone size. Adopt only the treatment that remains readable. Existing DrawOnPath can still handle the reveal.

**4. Manim Community — mathematical objects that transform meaningfully**

**What it adds.** A Python animation engine with mathematical objects, coordinate systems, geometric constructions, and transformations. TransformMatchingTex can associate matching formula fragments across equations; this is visual correspondence, not a symbolic proof checker. [Manim documentation](https://docs.manim.community/en/stable/), [formula transformation API](https://docs.manim.community/en/stable/reference/manim.animation.transform_matching_parts.TransformMatchingTex.html).

**Strengths for this channel.** Particularly useful when the explanation depends on a changing mathematical structure: probability distributions, vector transformations, geometry, or a derivation whose terms need to move visibly. It offers a more suitable object vocabulary than assembling every mathematical movement by hand.

**Weaknesses and costs.** It adds a Python environment, another render command, and another set of typography/layout conventions. LaTeX-based formulas require a TeX installation; current macOS installation guidance also calls for Cairo and pkg-config. A change to narration can require retiming and rerendering the insert. [Installation requirements](https://docs.manim.community/en/stable/installation/uv.html).

**Integration approach.** Render a self-contained sequence and assemble it in Remotion. Export at the project's chosen frame rate, dimensions, and color treatment. Keep any narration-cue timings in a shared input rather than independently hardcoding them in two projects.

**Proposed trial.** A 20-second Bayesian update showing a prior, evidence, and posterior with one equation transformation. Compare the work required with our existing BayesianUpdate and KaTeX-based MathReveal/MathDerivation templates. Use Manim when the transformation itself carries the explanation, rather than for a static formula.

**5. Motion Canvas — choreography organized around narration**

**What it adds.** A TypeScript animation library based on generators, plus a preview editor. Its time events let code wait for named cues whose positions can be adjusted in the editor; moving a cue can also shift later events. This is timing control, not automatic speech recognition. [Overview](https://motioncanvas.io/docs/), [time events](https://motioncanvas.io/docs/time-events/).

**Strengths for this channel.** Sequential actions can read like the intended story: introduce an object, pause, split it, move the copies, reconnect them. The cue editor directly addresses the annoyance of revising many timing constants after narration changes.

**Weaknesses and costs.** It introduces a different scene model and editor. Our React/SVG components would need adaptation or reimplementation. Brand tokens, scene objects, and timing conventions could then diverge between systems. Its visual repertoire substantially overlaps the diagrams we can already produce.

**Integration approach.** Treat it as a specialist authoring system or an alternative pipeline. The documented image-sequence export can be encoded into a clip and assembled in Remotion. Coordinate resolution and frame-rate settings explicitly. [Rendering workflow](https://motioncanvas.io/docs/rendering/).

**Proposed trial.** Recreate the same 15–20 seconds of the identity-fork pilot, then change three narration cues and one object label. Compare authoring and revision time against our existing approach and, if tested, GSAP. Keep the comparison equivalent: a beautiful unrelated demo would not establish that switching saves us time.

**Additional tools worth knowing**

**6. GSAP — richer choreography while keeping Remotion**

**What it adds.** GSAP organizes animations into timelines with labels, overlaps, nested sequences, and staggered starts. Remotion now provides an official adapter that pauses a GSAP timeline and seeks it from the current video frame. The adapter was introduced in **4.0.517**, newer than our installed **4.0.457**. [GSAP timelines](https://gsap.com/docs/v3/GSAP/Timeline/), [Remotion integration](https://www.remotion.dev/docs/gsap).

**Strengths for this channel.** This is a promising way to simplify a sequence such as “draw the connection, move the copy, reveal the second memory, then highlight the disagreement” while retaining our existing React/SVG artwork and final assembly.

**Weaknesses and constraints.** The current adapter does not support GSAP plugins. It also rejects callbacks, independent playback, asynchronous builders, and unseeded random patterns. Targets must be DOM/SVG elements; plain-object animation is unsuitable through this adapter. Long timelines have a per-frame cost because the adapter reconstructs their progress from the beginning. [Supported behavior and restrictions](https://www.remotion.dev/docs/gsap/use-gsap-timeline).

**Recommendation.** Test a small DOM/SVG sequence after a controlled Remotion upgrade. Do not assume that MorphSVG, DrawSVG, ScrollTrigger, or every technique from a general GSAP tutorial is supported. Keep simulation state and counters in our deterministic data model.

**Proposed trial.** Reauthor only the identity-fork choreography, preserving the artwork and cues. Measure how easily we change an overlap, reorder two movements, and lengthen a pause. GSAP deserves adoption if those revisions become clearer without spreading timing logic across two systems.

**7. ELK.js — automatic layout for structured arguments**

**What it adds.** A graph-layout engine derived from Eclipse Layout Kernel. Its layered layout suits directed node-and-edge diagrams, including explicit connection ports. It returns positions and routes; it supplies no drawing or styling. Browser workers and Node usage are documented. [ELK.js project and API](https://github.com/kieler/elkjs).

**Strengths for this channel.** Useful for an argument whose premises, objections, and dependencies are too numerous to arrange manually. It may reduce repetitive layout work while letting our existing SVG renderer retain the channel's visual style.

**Weaknesses and costs.** An algorithm cannot decide which premise deserves the viewer's attention. Adding a node can rearrange a diagram, disrupting visual continuity. Input label sizes still need to be measured, and the project documents worker/bundler integration issues.

**Integration approach.** Compute layouts ahead of rendering. Preserve object IDs, review the result, and interpolate between approved positions. For a progressive reveal, consider laying out the complete diagram once so existing nodes stay still.

**Proposed trial.** An eight-node argument gains one objection. Compare ELK with the current manually authored diagram. Prefer D3 for loose network clustering and ELK for a structured directional graph; a three-node argument probably needs neither.

**8. PixiJS — dense 2D worlds**

**What it adds.** A GPU-oriented 2D scene system for sprites, graphics, and particles. Its particle container reduces overhead by giving up features available on ordinary scene objects. The current documentation flags the particle API as experimental and subject to interface changes. [Render loop](https://pixijs.com/8.x/guides/concepts/render-loop), [particle capabilities and limits](https://pixijs.com/8.x/guides/components/scene-objects/particle-container).

**Strengths for this channel.** A candidate when an explanation needs thousands of visible tokens, samples, or agents. It could display a population-level result while Remotion supplies legible labels and narration.

**Weaknesses and costs.** We would need a custom integration that handles canvas creation, asset loading, cleanup, and exact-frame capture. A live ticker is not sufficient for deterministic rendering. GPU-oriented design does not guarantee faster MP4 output on our machine or render service.

**Integration approach.** Replace independent ticking with explicit frame-state updates and rendering; hold capture until the canvas is ready. Keep model behavior separate from sprites.

**Proposed trial.** Render the same fixed population trace through SVG and PixiJS, using several object counts and the same resolution. Introduce PixiJS only if a measured bottleneck or required visual density justifies it. The two current pilots are far too small to establish that need.

**9. p5.js — a sketchbook for generative visuals**

**What it adds.** A JavaScript creative-coding environment for drawing and visual experiments. It offers explicit redraw control and seeded random generation. [Project overview](https://p5js.org/), [redraw control](https://p5js.org/reference/p5/redraw/), [random seeds](https://p5js.org/reference/p5/randomSeed/).

**Strengths for this channel.** Useful for exploring patterns, repetitions, cellular worlds, and perceptual demonstrations. It offers a convenient place to try a visual idea before deciding whether it deserves a production component.

**Weaknesses and costs.** Many sketches accumulate state through successive draw calls. Pausing their animation loop does not make them seekable. A fixed random seed also does not reconstruct the correct state when a renderer jumps directly to a later frame. We already have noise-based GenerativeField/GenerativeBackdrop components, so simple atmospheric patterns may duplicate existing capability.

**Integration approach.** Either adapt a sketch so its output depends on explicit time and inputs, precompute its history, or render it as a separate asset. Prototype code and reusable production code may need different structures.

**Proposed trial.** A simple cellular pattern changes after one rule adjustment. Assess whether the pattern teaches something, how much adaptation exact-frame rendering requires, and whether existing Canvas/SVG code would be simpler.

**10. Lottie — reuse authored vector animation**

**What it adds.** Playback of animation data made elsewhere. Remotion's integration supports frame-controlled playback, speed changes, reverse playback, and metadata inspection. It currently uses the SVG renderer; expressions have limited support and can cause nondeterministic frames or flickering. [Integration, features, and limitations](https://www.remotion.dev/docs/lottie).

**Strengths for this channel.** Useful when we already have an appropriate, reusable animated symbol or a designer supplies one. A recurring machine gesture or small mechanism could be reused across episodes.

**Weaknesses and costs.** A file format does not remove the work of designing the animation. Changes to its internal structure may require the original authoring file. A collection of unrelated stock animations can weaken visual consistency. Check the particular asset's usage terms before incorporating it into a monetized channel.

**Integration approach.** Keep the source asset alongside a tested local export. Verify representative frames, reverse seeking, and playback speed changes through Remotion, especially if expressions are involved.

**Proposed trial.** Only test when a real candidate asset exists. Render its complete motion and revise one required detail. Creating a Lottie pipeline without an asset need would add little to the current SVG scenes.

**11. Rive — recurring expressive objects**

**What it adds.** A visual animation editor and runtime. Rive's state machines connect animations through authored transition logic. Separately, Remotion supplies a component that synchronizes a named Rive animation with video time. [Rive state machines](https://rive.app/docs/editor/state-machine/state-machine), [Remotion playback API](https://www.remotion.dev/docs/rive/remotionrivecanvas).

**Strengths for this channel.** A possible home for a recurring machine or character with carefully designed expressions and gestures. The same asset could also serve an interactive companion experience.

**Weaknesses and costs.** Visual authoring is another skill and source format to maintain. The documented Remotion component exposes artboard and animation selection, but not a state-machine input API; full interactive behavior should remain an unverified integration requirement. Rive's pricing documentation places runtime export in its paid Cadet tier, currently $17 per seat monthly or $108 per seat annually. Those are dated published prices, not a project budget or account-specific quote. [Plan and export details](https://rive.app/docs/account-admin/pricing).

**Integration approach.** Start with named timeline animations through the official wrapper. Test any newer Rive feature against the exact runtime used by the chosen Remotion package.

**Proposed trial.** One machine has three reusable gestures. Check whether revising them in Rive is easier than editing our SVG object. Its value depends on repeated use across episodes; a single icon does not justify the new workflow.

**12. Blender — specialist 3D and drawn animation**

**What it adds.** A full creation environment covering modeling, rigging, animation, rendering, and Python scripting, with Grease Pencil for drawn animation. It can render through the command line. [Blender manual overview](https://docs.blender.org/manual/en/dev/), [command-line workflow](https://docs.blender.org/manual/en/5.0/advanced/command_line/index.html), [Grease Pencil development notes](https://developer.blender.org/docs/release_notes/4.5/grease_pencil/).

**Strengths for this channel.** Appropriate for a memorable physical metaphor: a machine rebuilding itself, a room whose construction is revealed, or drawn elements inhabiting a spatial set. It provides substantial asset-authoring tools that Three.js itself does not.

**Weaknesses and costs.** Modeling, materials, lighting, rigging, and rendering can become a project within the episode. Code generation does not remove the need to inspect visual quality. Narration revisions can invalidate a finished shot. This is likely the largest human-time commitment among the candidates.

**Integration approach.** Render a bounded insert and composite it in Remotion. Exporting a model for Three.js is an alternative, but it needs a separate fidelity test: do not assume a Blender scene's modifiers, materials, or simulations transfer intact.

**Proposed trial.** Consider one ten-second scene only after simpler geometry cannot communicate the idea. Keep it independent enough that later script changes do not force a long rerender.

**13. Skia — custom image and drawing effects**

**What it adds.** Another drawing system integrated through @remotion/skia and React Native Skia. It supports programmable shaders using Skia's shader language, including parameterized and combined effects. [Remotion integration](https://www.remotion.dev/docs/skia), [shader documentation](https://shopify.github.io/react-native-skia/docs/shaders/overview/).

**Strengths for this channel.** A candidate for a distinctive visual mechanism: perception changing through a lens, an image separating into competing interpretations, or a continuously deforming field. It can express pixel-level operations that are awkward as many SVG elements.

**Weaknesses and costs.** Current Remotion setup documentation requires bundler configuration and loading the Skia WebAssembly binary before registering the root. Some effects have backend-sensitive performance. It adds shader knowledge and another rendering surface to maintain.

**Integration approach.** Use the official wrapper, frame-derived parameters, and explicit readiness handling. Benchmark on the intended render environment. First compare the requested effect with SVG masks, our installed Three.js shaders, and current Remotion effects.

**Proposed trial.** Reproduce one specific effect in a tiny isolated composition. Adopt only if it supplies a needed visual behavior more cleanly than the alternatives; ordinary blur or paper texture is not enough reason on its own.

**Before adding a library: current Remotion itself**

Our installed version predates several relevant features. Current documentation describes:

| Capability | Documented introduction | Potential benefit | Important boundary |
|---|---|---|---|
| Effects system | 4.0.464 | Reusable color, blur, texture, and reveal treatments | Applies to supported canvas-based components; do not assume every existing HTML/SVG subtree accepts an effects prop |
| Studio interactivity | 4.0.475 | Canvas/timeline edits written back to source | Editable source structure still matters |
| GSAP integration | 4.0.517 | More convenient sequencing of DOM/SVG animation | Restricted adapter; see the GSAP profile |

Sources: [effects and supported components](https://www.remotion.dev/docs/effects), [Studio interactivity](https://www.remotion.dev/docs/studio/interactivity), [GSAP introduction](https://www.remotion.dev/docs/gsap).

These version numbers mark introduction of the named systems, not a guarantee that every feature on today's documentation page existed at that version. Select one compatible target release, align Remotion package versions, and verify the chosen features before relying on them.

The current pilots already have editable schema props that persist to inline defaults. New Studio interactivity is a different capability; an upgrade should not be described as fixing a complete lack of editing. A useful test would establish whether it makes position, timing, and effect changes easier while preserving the canonical source data. This research did not upgrade anything.

**Choose by the explanatory job**

These are proposed applications, not existing implementations.

| What the viewer needs to understand | First approach | Escalate when needed |
|---|---|---|
| One mind becomes two, then their commitments diverge | Existing persistent SVG scene | GSAP for more elaborate choreography |
| A rule produces an unexpected group outcome | Explicit custom model + SVG; D3 if layout helps | PixiJS if visible population size creates a measured bottleneck |
| Two observers see different aspects of one object | Simple Three.js scene | Blender for a specific complex object or shot |
| An objection changes the structure of an argument | Existing argument templates | ELK for difficult layout and routing |
| An equation or distribution changes through reasoning | Existing math/probability templates | Manim for substantial geometric or mathematical transformation |
| The same world should feel drawn by one illustrator | Existing artwork with controlled textures | Rough.js for outlines/hatching; Blender for authored drawn animation |
| One recurring object needs expressive gestures | Existing SVG components | Rive or Lottie when reusable authored assets justify them |
| A perceptual distortion is itself the explanation | SVG masks or native effects | Skia or a Three.js shader for the specific missing operation |
| Retiming narration is the main source of work | Existing shared cues and editable pauses | GSAP/native Studio first; compare Motion Canvas if pain remains |

**A sustainable integration pattern**

Keep five concerns separable: the claim, the model or event sequence, the artwork, the narration cues, and the final composition. A new drawing tool should usually replace only the artwork/rendering step. A new layout library should return data to the existing scene. A specialist renderer should produce a bounded insert with known dimensions and timing.

For a stateful system, the proposed flow is:

**Rules + inputs + seed → precomputed states → frame lookup → visual scene → Remotion export.**

This is our engineering recommendation. It lets scrubbing backward or rendering frames out of order produce the same state. A live browser demo that looks correct during continuous playback does not establish that property. Remotion's GSAP documentation explicitly explains the out-of-order and multi-browser rendering issue. [Deterministic rendering constraints](https://www.remotion.dev/docs/gsap/use-gsap-timeline).

For offline inserts, keep the source project, parameters, cue times, exported media, and reproduction command together. Match the project's frame rate and resolution. If transparency is required, verify the actual export format and compositing path; do not assume an ordinary MP4 contains alpha.

AI can help write geometry, glue code, and model rules. It cannot establish that a visualization supports its narration merely by making it attractive. Each scene should make clear whether it is an authored illustration, a toy model under stated assumptions, or a visualization of observed data. This distinction matters especially for alignment explanations.

**Small experiments, with a stop condition**

The proposed caps below are planning limits for future experiments, not estimates, promises, or time already spent. Pick the experiment attached to the next script's actual need; this is not a queue to execute in full.

| Experiment | Suggested time cap | Deliverable | Evidence that would justify keeping it |
|---|---|---|---|
| Rough.js treatment | 60–90 minutes | Same frame and ten seconds of movement in three treatments | Clear aesthetic preference, readable at small size, no stroke flicker |
| D3/custom rule scene | 2–3 hours | One rule, two parameter settings, reproducible trace | The consequence is understandable and counters agree with events |
| Three.js perspective scene | 2–3 hours | One object, two viewpoints, one reveal | Depth explains the idea; timing changes remain local |
| GSAP choreography comparison | 2 hours after a separate upgrade check | Equivalent excerpt and three revisions | Less authoring/revision work, correct seeking, no loss of existing editing |
| ELK diagram | 60–90 minutes | Diagram before and after adding an objection | Less manual rearrangement without loss of visual continuity |
| Motion Canvas comparison | 3 hours | Same excerpt, cues, artwork scope, and revisions | A meaningful workflow advantage over the tested Remotion options |

Record human minutes for first authoring, narration retiming, label/layout revision, review, and repair. Record machine render time separately. Also note the number of files and source formats that a routine edit touches.

The initial scene can justify a second trial, but repeat use should establish the benefit. If a tool consumes its experiment budget mainly on adapters or dependencies, keep the result as research and return to the existing renderer. If it works, package the small successful technique—not a universal scene engine—so the next episode can reuse it.

**Evidence and remaining uncertainty**

- This pass inspected the current package declarations, installed versions, representative D3/Three source, existing capability research, and pilot documentation. It researched the 13 candidates through official documentation and maintainer repositories linked beside each finding.
- The two pilots and the installed D3/Three code are local evidence. Every new integration, aesthetic trial, and tool comparison in this document is a proposal. No candidate was installed or benchmarked in this research pass.
- Strengths described by tool authors establish available features, not the amount of time they will save us. Friction and priority assessments are our judgments for this project.
- State-machine compatibility, GPU behavior, asset import fidelity, and exact package compatibility remain scene-specific tests. We did not perform a repository-by-repository maintenance or security audit.
- Some direct Blender feature/manual URLs were unavailable during browsing. The Blender profile uses the accessible official manual overview, command-line documentation, and Grease Pencil release notes; it makes no recommendation about an exact Blender version.
- Revisit this document when an actual scene hits a limitation, an experiment produces measurements, or the Remotion version changes. Keep the source-inspection results distinct from tested production behavior.

Related: [initial capability and Studio audit](/Users/feihuyan/project-parallax/analysis/visual-capabilities-and-studio-2026-09-22.md).
