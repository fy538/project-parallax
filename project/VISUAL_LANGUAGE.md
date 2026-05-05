# Parallax — Visual Language Guide

## What this document is

The editorial framework for deciding what appears on screen at any moment in a Parallax video. Not a format spec (that's SCRIPT_FORMAT.md), not a sourcing guide (that's FOOTAGE_SOURCING.md) — this is the *why* behind visual decisions.

The core insight: viewers process footage and motion graphics differently. Footage creates *presence* — the feeling of being somewhere, seeing something real. Motion graphics create *understanding* — making invisible structures visible. The art is knowing which one a moment needs, and when both together create something neither could alone.

Created: April 26, 2026
Updated: May 3, 2026 — Added Three-Register Visual System, transition grammar, faceless figure convention

---

## The Three Visual Registers

Before deciding *which visual mode* to use (footage, MG, layered, AI-GEN), understand which **visual register** the moment belongs to. Registers are the aesthetic languages of the channel — each serves a different narrative function, and all three are unified by the brand treatment pipeline.

### Register 1: Analytical (Remotion Templates)

**Aesthetic:** Clean, geometric, programmatic. Space Grotesk typography, precise data, spring-physics animations, ambient particles. The most controlled visual surface — every pixel is brand-locked through theme.ts.

**Narrative function:** Understanding. "Here's the pattern. Here's the data. Here's the structure." The viewer's brain shifts into analytical mode. These moments carry the intellectual argument.

**Sources:** All Remotion templates — DataChart, FrameworkDiagram, ChoroplethMap, RouteAnimation, BayesianUpdate, KineticTypography, GameBoard, NetworkDiagram, SankeyFlow, HorizontalTimeline, etc.

**Treatment:** None needed. Templates are inherently brand-consistent — palette, typography, animation language are all code-enforced.

**Texture:** No grain, no vignette. Clean surfaces. This is deliberate — the absence of film texture signals "designed information" as distinct from "observed world."

### Register 2: Atmospheric (Constructivist Illustrations)

**Aesthetic:** Soviet constructivist meets psychedelic art deco. Dystopian, trippy, propaganda-poster energy. Flowing organic forms (smoke, cables, ribbons) meet brutal industrial geometry (factories, towers, pipes). Warm palette: deep umber, burnt amber, rust, bone. Bold compositional confidence.

**Narrative function:** Feeling. "This is what the system feels like from inside." These visuals carry the emotional weight of the subject — industrial power, technological dependency, civilizational stakes, systemic threat. They don't communicate data; they communicate dread, ambition, scale, and entrapment.

**Sources:** Recraft V3 API (`tools/recraft/recraft.py`) with the constructivist style prefix. Generated as static SVG or PNG, then treated.

**Treatment:** Brand duotone ramp via `treat.py` or the `--treat` flag in `recraft.py`. Three ramps map to narrative tone:
- `standard` (ink → bronze → amber): default warmth, industrial ambition
- `conflict` (ink → oxblood → rust): threat, tension, antagonism
- `editorial` (dark bone → light bone): neutral analysis, breathing room

Plus grain overlay (0.10-0.12 intensity) and vignette (0.18 strength). The grain is the crucial connector — it gives illustrations the same film-like texture as treated photographs, making them feel like they belong in the same documentary rather than being imported from a different medium.

**In Remotion:** Rendered through ImageComposite (background variant with Ken Burns drift) or PhotoMontage (rapid sequence). The existing duotone SVG filter, KenBurns component, and composition animation pipeline handle these natively. At 30-40% opacity as backgrounds, they replace generic stock footage wallpaper with something visually distinctive and brand-ownable.

### Register 3: Grounding (Photorealistic AI Scenes)

**Aesthetic:** Photorealistic environments and figures with deliberately featureless faces — smooth skin where eyes/nose/mouth would be, hair and body fully rendered. The uncanny valley is the point. These images read as "editorial reconstruction" — clearly not real footage, but immersive enough to create spatial presence. Think mannequins in real rooms.

**Narrative function:** Presence. "There are humans in this system." The faceless figures serve a specific editorial purpose: they depersonalize to universalize. A real person's face invites identification with an individual. A faceless figure invites pattern recognition — "this is The Executive, The Regulator, The Engineer, The Soldier." For geopolitics content about systemic actors rather than individual characters, facelessness is the right editorial choice.

**Sources:** Recraft V3 API (realistic_image style) for stills. For animated clips: Recraft generates reference frame → Kling 3.0 / Sora 2 animates → `treat_video.py` applies brand LUT. See AI_VIDEO_PIPELINE.md.

**Treatment:** Full 4-step brand pipeline via `treat.py` (stills) or `treat_video.py` + LUT (video clips):
1. Desaturate (20-30% saturation retained)
2. Duotone remap through brand ramp
3. Grain + vignette overlay
4. Composite at specified opacity

After treatment, these images share the same tonal DNA as the constructivist illustrations. A rust-tinted military command room and a rust-tinted factory illustration feel like the same editorial eye, even though their source styles are completely different.

**In Remotion:** Rendered through ImageComposite (all variants — background, inset, portrait) with the existing BrandImage pipeline handling the duotone filter. The `portrait` variant with its name strip is purpose-built for the faceless figure convention: show the figure, label the archetype.

### Why Three Registers Work Together

The coherence model is **color and motion, not style matching.** This is the principle behind every successful mixed-media video essay (Vox, Adam Curtis, Johnny Harris): wildly different source materials feel unified when they share:

1. **A locked color palette.** All three registers pass through the same duotone ramps from `palette.json`. An amber DataChart accent, an amber-tinted factory illustration, and an amber-graded cleanroom scene share tonal DNA even though their styles diverge completely.

2. **A consistent motion rhythm.** The transition library in FullEpisode.tsx provides the motion language. The same iris, dissolve, and color-wash transitions connect all three registers. Viewers recognize timing and rhythm unconsciously — they don't register style switches when the motion grammar stays consistent.

3. **A deliberate texture hierarchy.** Registers 2 and 3 get grain + vignette treatment. Register 1 does not. This creates a visual hierarchy that viewers learn intuitively: *grainy = the world* (emotional, spatial, atmospheric), *clean = the analysis* (data, structure, argument). The texture difference becomes a signal — when grain appears, the viewer's brain shifts from processing information to experiencing a space.

4. **Visual heterogeneity as editorial posture.** Mixing registers isn't a weakness — it signals intellectual honesty. "This topic is complex enough to require multiple ways of seeing." The analytical register says "here's the data." The grounding register says "here are the humans affected." The atmospheric register says "here's what the system feels like." Each carries a different kind of truth.

### Transition Grammar Between Registers

Use these transition types consistently across every episode. Viewers learn the motion vocabulary even if they can't name it.

| Transition | From → To | Feeling |
|---|---|---|
| **color-wash** (amber or rust) | Analytical → Grounding | The data dissolves into the world it describes |
| **color-wash** (amber or rust) | Grounding → Analytical | The world crystallizes into a pattern |
| **blur-through** | Grounding → Atmospheric | Reality abstracts into feeling |
| **dissolve** | Atmospheric → Grounding | The feeling condenses into a specific place |
| **iris** | Atmospheric → Analytical | The emotional zooms into the precise |
| **cut** or **wipe** | Analytical → Analytical | Between data points (no register shift) |
| **fade** | Any → Any | Beat boundaries, section transitions |

Rules:
- Never hard-cut between Register 2 (atmospheric) and Register 1 (analytical). The style gap is too large without a transitional bridge. Always use color-wash, iris, or blur-through.
- Hard cuts between Register 3 (grounding) and Register 1 (analytical) are acceptable when the footage is at low opacity (background mode). The cut works because the footage is serving as texture, not carrying narrative weight.
- Register 2 should never appear more than twice per beat. Its visual intensity is a spice, not a main course.

### The Faceless Figure Convention

When depicting systemic actors (not named individuals), use photorealistic AI-generated figures with deliberately blank/smooth faces. This is an editorial choice, not a technical limitation.

**When to use faceless figures:**
- Generic decision-makers, executives, diplomats, military personnel
- Workers in facilities (cleanrooms, factories, data centers)
- Crowds, populations, anonymous actors in systems

**When NOT to use:**
- Named historical figures (use archival photos instead)
- The narrator / host (use real footage)
- When a real person's identity is the point of the narration

**Labeling convention:** When a faceless figure represents a category, use the ImageComposite portrait variant with a name strip labeling the archetype: "The Regulator," "The Engineer," "The Executive." This turns the facelessness from a deficit into a deliberate editorial device — the viewer understands they're seeing a role, not a person.

---

## The Four Visual Modes

### Mode 1: Footage Only

**What the viewer experiences:** Grounding. Emotional texture. Physical reality. The brain processes footage as "this is real, this happened, this place exists." Even generic stock footage of a cleanroom establishes that chip fabrication is a physical process with real humans in bunny suits, not an abstraction.

**When to use it:**

- **Story beats.** When the narration is telling a story — the ballpoint pen parable, the Jensen/Trump negotiation, the Pearl Harbor pivot — footage anchors the story in reality. The viewer needs to *see* the world being described.
- **Establishing context.** The opening of a beat, the shift to a new geography or time period. Aerial shots of Shenzhen, archival footage of 1941 Washington, a factory floor. These orient the viewer before the analysis begins.
- **Breathing room.** After a data-dense MG sequence (chart → framework → chart), the viewer's analytical brain needs a rest. Ten seconds of footage with narration over it resets the cognitive load before the next data block.
- **Emotional landing.** When a beat reaches its emotional peak — the Morris Chang quote, the "0 successful training runs" reveal — sometimes the most powerful visual is a held shot of a real place or person, not a designed graphic.

**Duration guidance:** Footage-only segments typically run 8-25 seconds. Shorter than 5 seconds feels like a flash that didn't register. Longer than 30 seconds without a visual change risks losing attention.

**What footage is bad at:** Communicating precise data, showing structural relationships, comparing things that don't physically coexist, making abstract concepts concrete. If you find yourself writing "footage of supply chain complexity" — that's not a thing a camera can capture. You need a motion graphic.

---

### Mode 2: Motion Graphic Only

**What the viewer experiences:** Clarity. Structure. "Now I see the pattern." The brain processes MGs as designed information — it knows someone built this to communicate something specific. This gives MGs authority for data communication but makes them feel "synthetic" when overused.

**When to use it:**

- **Data reveals.** Statistics, comparisons, timelines, trends. Anything with numbers. The "92% YIELD" stat, the CHIPS Act funding funnel, the lithography passes comparison — these are MG moments because the data *is* the content.
- **Structural arguments.** When the narration explains a relationship, comparison, or framework — COCOM vs. China, chess vs. go, the bifurcation decision tree — the viewer needs to see the structure laid out spatially.
- **Geographic arguments.** When the point is about *which countries* and *what connections* — supply chain routes, alliance maps, caught-in-between nations — the map or route animation communicates geography more precisely than any footage could.
- **Definition moments.** The 卡脖子 and 举国体制 cards. When introducing a foreign term or key concept, a designed typography card commands attention and says "this is important, remember this."
- **Dramatic punctuation.** Short MG hits — "A TRAP FOR EVERYONE" — that land like a visual exclamation point. These work best when they're brief (2-4 seconds) and surrounded by footage.

**Duration guidance:** Full-screen MGs typically run 3-12 seconds. Charts and maps can go longer (up to 18 seconds if phased/animated). Typography cards should be short (3-5 seconds). More than 20 seconds of continuous MG without footage feels like a slideshow.

**What MGs are bad at:** Creating emotion, establishing physical reality, conveying scale (you can say "$165 billion" but footage of a massive construction site *shows* what that money looks like). If you find yourself using a motion graphic to illustrate something that exists in the physical world — consider whether footage would land harder.

---

### Mode 3: Footage + Motion Graphic Layered

**What the viewer experiences:** "This abstract thing is real." The footage provides the emotional grounding and the MG provides the analytical overlay. This is the most impactful mode when used sparingly — it says "this data point matters in the real world."

**When to use it:**

- **Hero stat over context.** A key number composited over footage of what that number represents. "92% YIELD" over cleanroom footage. "7% of US chip demand" over the Arizona desert. The footage gives the stat a home.
- **Geographic data over geography.** Data overlays on aerial footage or map imagery — country labels, trade flow arrows, highlight outlines appearing over real satellite or stock footage of the region.
- **Transition moments.** When pivoting from a story to analysis, layering a subtle MG element over fading footage creates a visual bridge. The footage says "here's the real world," the MG says "and here's the pattern inside it."

**When NOT to use it:**

- When the MG is complex (multi-bar charts, dense frameworks). Complex graphics need the viewer's full attention — footage behind them becomes visual noise.
- When the footage is visually rich (dramatic archival, high-action). Overlaying a graphic on strong footage diminishes both.
- More than 2-3 times per beat. The technique loses its punch through overuse.

**Duration guidance:** Layered segments work best at 3-8 seconds. The MG element should be simple — a single stat, a label, a highlight — not a full chart.

---

### Mode 4: AI-Generated Video

**What the viewer experiences:** Immersion in an inaccessible space. The brain processes these sequences as "this place is real, but I couldn't normally see it" — a visualization that's more concrete than a motion graphic but more honest than stock footage pretending to be something it isn't. The deliberately stylized (mannequin) faces signal editorial illustration, not documentary evidence.

**When to use it:**

- **Unsourceable interiors.** When the narration describes a specific facility or space that no stock library covers — TSMC cleanrooms, military command centers, classified research labs. Generic cleanroom stock exists, but AI-GEN can show an *advanced node* fab with contextually accurate equipment.
- **Historical reconstructions.** Pre-camera events or moments where no footage survives. The 1941 embargo signing, Deng Xiaoping's 1992 Shenzhen visit, closed-door Cold War negotiations. The editorial LUT treatment signals "reconstruction."
- **Conceptual spaces.** When an abstract idea benefits from being made physical — supply chains as corridors, sanctions as sealed doors, bifurcation as a literally splitting path. More immersive than MG, but the surreal situation + mannequin faces prevent it from being mistaken for reality.
- **Scenario sequences.** "What if" futures and counterfactuals that footage can't capture because they haven't happened. A next-gen facility powering up, an imagined disruption scenario.

**When NOT to use it:**

- When stock footage exists and works. Don't generate what you can source — real footage carries authenticity that AI cannot replicate.
- For named real people. Never generate footage of identifiable public figures, even with stylized faces.
- As evidence for claims. AI footage illustrates; it doesn't prove. The narration carries truth claims.
- When a motion graphic would communicate the point more precisely. Data, comparisons, and structural relationships still belong in Remotion templates.

**Duration guidance:** AI-GEN clips typically run 5-10 seconds. Shorter than 4 seconds doesn't justify the immersive quality. Longer than 12 seconds risks consistency drift (current tool limitation). Never more than 2 consecutive AI-GEN clips without a mode switch. Target 10-20% of episode runtime.

**Full specification:** See AI_VIDEO_PIPELINE.md for the generation workflow, prompting patterns, and tool details.

---

## Pacing: The Rhythm Between Modes

A well-paced video essay alternates between visual modes the way music alternates between verses and choruses. The goal is *rhythm variation* — never too long in one mode.

### The Fatigue Rules

- **No more than 3 consecutive full-screen MGs without a footage break.** Two charts back-to-back is fine. Three feels like a lecture. Four is a slideshow. Insert even 5-8 seconds of footage between MG clusters.
- **No more than 30 seconds of footage-only without a visual change.** Footage is restful, but too much becomes TV B-roll wallpaper. Cut to a different shot, add a text overlay, or transition to an MG.
- **No more than 2 consecutive AI-GEN clips without a mode switch.** AI-GEN is immersive but its stylized quality becomes fatiguing if overused. One clip is a window into an inaccessible world. Three in a row starts to feel like a video game cutscene.
- **Alternate density within each beat.** A beat should follow a rough arc: establish with footage → analyze with MG → breathe with footage → climax with MG or layered → land with footage. AI-GEN slots in where footage would go but can't be sourced — it inherits footage's pacing role. Not every beat will follow this exactly, but the pattern prevents monotony.

### Beat Cadence Template

A typical 3-4 minute beat in a Parallax episode:

```
Footage (establishing, 8-15s)
  → MG: section title card (2-3s)
  → Footage (story/context, 15-25s)
  → MG: data reveal (5-10s)
  → Footage (breathing room, 5-10s)
  → MG: framework or map (8-15s)
  → Layered: hero stat over footage (3-6s)
  → Footage (emotional landing, 8-15s)
```

This isn't a rigid formula — it's a tendency. Some beats are data-heavy (Beat 3's SMIC analysis) and skew toward MG. Some beats are narrative-heavy (Beat 4's trap metaphor) and skew toward footage. The template is a center of gravity, not a rule.

### The 10-Second Principle

No visual element should go unspecified for more than 10 seconds. This doesn't mean a new asset every 10 seconds — a 25-second footage shot is fine as long as the script explicitly calls for it. What it prevents is the accidental void: narration playing over nothing because the script writer forgot to specify a visual.

---

## The Decision Heuristic

When writing the visual column and unsure which mode to use, ask these questions in order:

1. **Is the narration telling a story about something that physically exists?** → Footage. (A factory, a person, a place, an event.)
2. **Is that physical thing unsourceable — restricted, historical, or classified?** → AI-GEN / Register 3 (Grounding). (A facility you can't film, an event no camera captured, a space that exists behind closed doors. Photorealistic with faceless figures.)
3. **Is the narration explaining a number, a structure, or a comparison?** → MG / Register 1 (Analytical). (Data, frameworks, timelines, geographic relationships.)
4. **Is the narration making a surprising claim about something physical?** → Layered. (A stat that reframes something the viewer can see.)
5. **Is the narration describing an abstract concept that would benefit from physical metaphor?** → AI-GEN / Register 3 (Grounding, conceptual). (Supply chains as corridors, sanctions as barriers — only if the metaphor is strong enough to warrant a full scene.)
6. **Is the narration building emotional weight, conveying systemic dread, or evoking the *feeling* of a system?** → Register 2 (Atmospheric). Constructivist illustration at 30-40% opacity behind narration. Use when the moment needs mood, not information — industrial ambition, technological entrapment, civilizational scale. This replaces generic stock footage wallpaper with brand-ownable visual identity.
7. **Is the narration transitioning, reflecting, or in breathing room between data-dense sections?** → Footage (ambient), Register 2 (atmospheric) at low opacity, or hold on previous visual.

If you're still unsure: default to footage. Footage is forgiving — a slightly wrong stock clip is less jarring than a slightly wrong motion graphic. And footage gives the viewer's brain room to process the narration, which is often more valuable than another visual competing for attention. AI-GEN and atmospheric illustrations are reserved for moments where stock footage would be generic, and where the visual register can carry emotional or spatial meaning that stock cannot.

---

## Visual Vocabulary by Content Type

These are the recurring visual needs for geopolitics video essays, mapped to their best mode:

| Content Type | Best Mode | Register | Why |
|---|---|---|---|
| Named person speaking/acting | Footage or archival image | — | Viewers need to see the human |
| Named place/facility | Footage | — | Physical presence > abstract label |
| Restricted/classified facility | AI-GEN (photorealistic) | Grounding | Can't film it; faceless figures signal reconstruction |
| Historical event (footage exists) | Archival image + Ken Burns | — | Period-appropriate imagery grounds the story |
| Historical event (no footage) | AI-GEN + editorial LUT | Grounding | Reconstruction signals "visualization" via faceless figures + desaturated treatment |
| Statistic or data point | MG (KineticTypography or DataChart) | Analytical | Numbers need designed presentation |
| Country/alliance relationships | MG (ChoroplethMap) | Analytical | Geography needs a map |
| Supply chain or trade flow | MG (RouteAnimation) | Analytical | Connections need visual lines |
| Conceptual framework | MG (FrameworkDiagram) | Analytical | Abstractions need spatial layout |
| Concept as physical metaphor | AI-GEN (conceptual) | Grounding | When the abstraction benefits from spatial/physical visualization over diagrams |
| Foreign term or definition | MG (KineticTypography) | Analytical | Typography commands attention |
| Before/after or parallel | MG (TimelineComparison) | Analytical | Juxtaposition needs designed layout |
| Systemic mood / civilizational scale | Constructivist illustration (bg) | Atmospheric | Carries the *feeling* of power, threat, ambition — not data. Replaces generic stock wallpaper |
| Industrial/technological dread | Constructivist illustration (bg) | Atmospheric | Dystopian factory scenes, dependency webs, flowing ribbons of control |
| Establishing mood/context | Footage (ambient) OR atmospheric illustration | — | Real-world grounding or brand-ownable atmospheric texture |
| Quick montage (everyday items) | Footage (rapid cuts) | — | Physical objects need physical images |
| Future scenario / counterfactual | AI-GEN (photorealistic) | Grounding | Can't film what hasn't happened; faceless figures signal speculation |
| Emotional climax | Footage or layered | — | Data alone can't carry emotion |
| Dramatic punctuation | MG (short typography hit) | Analytical | Clean, bold, brief |
| Breathing room between dense sections | Footage (ambient) OR atmospheric illustration | — | Let the brain rest with texture instead of data |

---

## Visual-Narrative Timing: When Visuals Lead, Follow, or Diverge

The sections above cover *what* appears on screen. This section covers *when* it appears relative to the narration — and what happens when the visual layer deliberately disagrees with the audio.

Most video essays default to "synchronized" mode: the visual illustrates whatever the narrator is saying. This is the safest approach and should remain the baseline. But the highest-impact moments come from breaking synchronization.

### Three Timing Modes

**Synchronized (default).** Visual matches narration. "The factory produced 10 million chips" plays over factory footage. This is clear, efficient, and should account for ~70% of any episode. No special planning needed — this is what the two-column script format naturally produces.

**Visual-first (the reveal).** The visual arrives 3-5 seconds before the narration explains it. The viewer sees a map border shift, a chart spike, or an unfamiliar image — their brain asks "what is this?" — and then the narration answers. This creates a micro-mystery that keeps attention locked. Remotion templates support this natively: animate the visual element in, hold for a beat, then start the narration. Use for data reveals, geographic pivots, and any moment where the viewer's curiosity should be activated before their understanding.

**Visual counterpoint (the tension).** The visual shows something that *disagrees with* or *complicates* the narration. The narrator says "The alliance held firm" while the map shows cracks forming. The narrator says "Everything was under control" while the chart shows a downward trend. This creates productive unease — the viewer processes two signals and synthesizes them, which is more engaging than receiving one signal passively. Use sparingly — 2-3 moments per episode maximum. Best deployed at turning points where the thesis gets complicated.

### Planning for Timing

The two-column script format doesn't currently encode timing relationships — both columns are read as simultaneous. When planning visual-first or counterpoint moments, add a timing note in the right column:

- `[VISUAL-FIRST: 3s]` — visual appears 3 seconds before narration begins
- `[COUNTERPOINT]` — visual deliberately tensions with narration at this moment
- `[HOLD]` — previous visual persists while narration continues (useful for letting a map or framework breathe)

These annotations are consumed by the assembly manifest generator and by Tiger during the NLE polish pass.

### Visual Motifs

A visual motif is a recurring visual element that evolves across the episode, giving the named conceptual product a visual identity. The "Silicon Trap" could be represented by a stylized net diagram that appears simple in Beat 1 and grows increasingly tangled as the episode progresses. When it returns in the final beat, its evolved form carries all the accumulated meaning.

Motifs work because they create visual memory — the viewer recognizes the element and tracks its transformation. This turns the visual layer into a parallel narrative rather than a sequence of illustrations.

**Planning motifs:**
- Identify the episode's named concept (from the angle memo)
- Design a simple visual representation (geometric, not literal)
- Define 3-4 evolution states across the episode
- The motif should be simple enough to work as a small overlay or full-screen moment
- Remotion's parametric `progress` prop makes this natural — the same component renders differently at different points in the episode

**Rules:**
- One primary motif per episode (more creates visual clutter)
- The motif must be introduced early (first 2 minutes) and return at least twice
- Evolution should track the emotional arc, not the informational arc
- The motif is not a logo or branding element — it's a narrative device

### The Radio Edit Test

Before finalizing the visual column, read the narration column alone as if it were a podcast script. If the narration works as audio-only — if the argument is clear, the story lands, the pacing holds — then the visual layer is free to be *additive* rather than load-bearing. This is the ideal state: visuals that deepen rather than prop up.

If the narration doesn't work without visuals (the argument is unclear, transitions feel abrupt, key points are missing), that's a narration problem, not a visual opportunity. Fix the words first.

This test is built into the production pipeline as a checkpoint between script draft and visual-concept audit (see PRODUCTION_PIPELINE.md, Stage 6).

---

## Relationship to Other Docs

- **SCRIPT_FORMAT.md** — the syntax for specifying visuals in the script's right column. This doc tells you *what* to write; that doc tells you *how* to write it.
- **FOOTAGE_SOURCING.md** — where to actually get footage. This doc tells you *when* footage is the right choice; that doc tells you *whether* you can actually get it.
- **POLISH.md** — the quality spec for motion graphics. Covers animation, composition, and brand identity for the MG layer.
- **BRAND.md** — the image treatment pipeline. Stock footage, archival images, and AI-generated stills get brand treatment (duotone, grain, vignette) before they go into the video.
- **AI_VIDEO_PIPELINE.md** — the full spec for AI-generated video (Register 3 animated clips). Covers aesthetic, tools, workflow, prompting, and editorial guardrails.
- **SVG_ILLUSTRATION_PIPELINE.md** — legacy Claude SVG workflow. For production illustration, use Recraft (`tools/recraft/recraft.py`) instead. Claude SVG remains useful for rapid ideation sketches only.
- **tools/recraft/recraft.py** — CLI tool for generating Register 2 (atmospheric) illustrations and Register 3 (grounding) photorealistic stills via Recraft V3 API. Includes brand duotone treatment and batch mode.
- **tools/brand-treatment/treat.py** — the color unification pipeline. All three registers pass through this to share tonal DNA. The single most important tool for making mixed-media feel cohesive.
