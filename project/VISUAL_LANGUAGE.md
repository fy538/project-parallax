# Parallax — Visual Language Guide

## What this document is

The editorial framework for deciding what appears on screen at any moment in a Parallax video. Not a format spec (that's SCRIPT_FORMAT.md), not a sourcing guide (that's FOOTAGE_SOURCING.md) — this is the *why* behind visual decisions.

The core insight: viewers process footage and motion graphics differently. Footage creates *presence* — the feeling of being somewhere, seeing something real. Motion graphics create *understanding* — making invisible structures visible. The art is knowing which one a moment needs, and when both together create something neither could alone.

Created: April 26, 2026
Updated: May 3, 2026 — Added Three-Register Visual System, transition grammar, faceless figure convention
Updated: May 4, 2026 — Unified Registers 2 and 3 under constructivist aesthetic; replaced photoreal mannequin convention with constructivist-figurative approach. Added realism-dosage sub-mode and per-scene typography-tradition parameter.
Updated: May 4, 2026 — Codified the three-content-type mental model. Five script tags collapse to three content categories (Remotion / AI-generated / Footage); LAYERED is a composition pattern, not a fourth category. Calibration shifts: FOOTAGE budget drops toward archival-only, generic stock displaced by AI-generated content.
Updated: May 6, 2026 — Added Format-Specific Visual Rules. Philosopher's Lens episodes adopt a footage-free production path: three asset types (Remotion MG + Recraft→Pika AI-GEN + Wikimedia ARCHIVAL). Image-to-video pipeline: Recraft V3 generates constructivist reference frame, Pika 2.2 animates into 3-7s clip.

---

## The Three Content Types (the canonical mental model)

The script format encodes five visual mode tags (`[MG:]`, `[FOOTAGE:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`) for production granularity, but conceptually they collapse to **three content types**. This is the simpler mental model script writers should hold while drafting:

**1. Remotion** — code-locked analytical content. Maps, charts, framework diagrams, timelines, typography cards. The viewer's brain reads precise data, structural arguments, geographic relationships, foreign-term definitions. Brand-perfect by code, infinitely tunable, exactly repeatable across re-renders. Register 1 (Analytical). Script tag: `[MG:]`. Target: 40-55% of episode runtime per VIS-01.

**2. AI-generated** — constructivist illustration in two editorial roles, sharing the same visual vocabulary post-May 4 unification. Both rendered through Recraft V3 (stills) or Recraft → Kling/Sora (animated clips), pulling palette emphasis from the per-episode `episodeColorEmphasis` field. The two roles:

- **Atmospheric backdrop** (Register 2, script tag `[ILLUST:]`) — the constructivist illustration at 30-40% opacity behind narration, carrying mood and civilizational weight. Replaces what would otherwise be generic stock footage wallpaper.
- **Grounded scene** (Register 3, script tag `[AI-GEN:]`) — foreground figurative scene with planar-faceted figures in environments. Replaces what would otherwise be photoreal mannequin scenes (pre-migration) or unsourceable stock footage.

Same constructivist DNA, different cognitive function. Combined target: 15-30% of episode runtime (5-15% each per VIS-09).

**3. Footage** — non-substitutable real-world capture. Two sub-types:

- **Archival** — named figures and specific real events that AI-GEN cannot ethically substitute (Roosevelt, Xi Jinping, real news moments, specific signing ceremonies). Wikimedia, Library of Congress, public domain archives.
- **Screen recordings** — captured software interfaces, real product screens, actual model outputs (ChatGPT running, DeepSeek's chat UI, a Bloomberg terminal). Captured rather than generated; carries documentary credibility unique to "I literally ran this."

Script tag: `[FOOTAGE:]` with optional `[FOOTAGE: screen]` sub-tag. Target post-calibration: 15-25% of episode runtime, weighted heavily toward archival.

### Why LAYERED isn't a fourth category

The `[LAYERED:]` script tag indicates a *composition pattern* — typically MG element composited over footage (a stat over a real-world image). It's the intersection of types 1 and 3 (Remotion + Footage), not a separate content type. Production-level tag, not conceptual category. Target: 5-10% of episode runtime; sparing use only for hero data-over-real-world moments.

### The decision flow, simplified

When script-drafting and unsure which tag to use, the three-type test is:

1. **Does the viewer need to *read* this precisely?** (numbers, structure, comparison, framework) → Remotion `[MG:]`.
2. **Is this a real named person, real specific event, or actual software interface?** → Footage `[FOOTAGE:]` (archival or screen sub-type).
3. **Otherwise** — anything that needs to be *felt, inhabited, or moodily backdropped* — → AI-generated. Backdrop role uses `[ILLUST:]`; foreground figurative scene uses `[AI-GEN:]`.

The displacement principle post-migration: if generic stock footage was the default for a moment but no specific real person/event/UI is being depicted, prefer AI-generated. Generic stock now reads as "unfocused channel"; AI-generated reads as "intentional editorial choice."

### Format-Specific Visual Rules

Not every episode format uses all three content types equally. The displacement principle above is the general rule; these format-specific overrides codify how far the displacement goes.

**Philosopher's Lens episodes** (abstract frameworks, game theory, philosophical analysis): **footage-free production with AI-gen-forward visual rebalance** (committed May 9, 2026 per the channel-vs-category positioning shift in PROJECT_VISION.md). Three asset types only:

1. **Remotion MG** (target ~40-45%, was 45-55% pre-rebalance) — the analytical backbone. Charts, frameworks, game boards, typography, maps. Reduced from prior target to make room for the visual signature; analytical rigor is preserved through narration, FORECAST, and core MG structure, while atmospheric texture moves to AI-gen.
2. **AI-gen** (target ~35-40%, was 25-35% pre-rebalance) — all non-analytical visual texture, plus expanded use as background atmosphere under analytical content. Three sub-modes:
   - **`[AI-GEN:]` single-shot** — atmospheric punctuation, 5-12s clips. ChatGPT image generation + Hailuo 02 image-to-video.
   - **`[SCENE:]` chained-morph blocks** — sustained atmospheric scenes, 20-50s. ChatGPT 4-anchor reference + Pika 2.5 start+end-frame morphs. The channel's signature production technique. Per-episode cap relaxed in May 9 rebalance — see SCRIPT_FORMAT.md "Multi-Frame Scene Blocks" for current limits.
   - **`[ILLUST:]` atmospheric backdrop** — constructivist illustration at 30-40% opacity behind narration or layered under MG cards, providing atmospheric texture without displacing analytical content. Newly emphasized in the rebalance: prior versions used [ILLUST:] sparingly, the rebalance expects 6-10 [ILLUST:] backdrops per episode behind KineticTypography and FrameworkDiagram cards.
3. **Wikimedia ARCHIVAL** (~2-5%) — documentary stills of named historical figures or specific events only (e.g., Nash portrait, Reagan-Gorbachev summit photo). Ken Burns motion applied in Remotion. These carry documentary weight that illustration cannot substitute. The May 9 rebalance KEEPS archival as the documentary register — see `CHAINED_STILL_LESSONS.md` Section 9 thinking on why the texture hierarchy matters.

**The May 9 rebalance rationale.** The pre-rebalance MG-heavy ratio (45-55%) was inherited from analytical-essay genre conventions. The May 9 channel positioning commits to a third-category identity — analytical rigor PLUS distinctive constructivist visual signature — which requires more visual-layer real estate for the AI-gen register that NO other analytical channel uses. The narration stays analytical; the visual surface tilts atmospheric. This is the operational meaning of "thinks like a research analyst, looks like a Saul Bass / Adam Curtis fever dream."

**What this eliminates:** Stock footage sourcing (Pexels/Pixabay/Unsplash pipeline), brand treatment pipeline for video (`treat_video.py`), footage QA. Stock footage budget drops to zero.

**The image-to-video pipeline:** Recraft V3 gives precise compositional control (the reference frame locks brand palette, constructivist aesthetic, and scene layout). Pika 2.2 adds natural motion while preserving the frame's style. This two-step approach is more controllable than generating video from text alone — you approve the still before committing to animation. Cost: ~$0.08/image (Recraft) + ~$0.15-0.30/clip (Pika) = ~$5-7 per episode for 15-17 clips.

**When this does NOT apply:** Detective format (specific real-world investigations requiring documentary footage), Time Collapse (historical footage carrying documentary authority), any episode where specific real footage is editorially necessary. Those formats retain the full three-content-type model with stock footage.

**Pacing rule adjustment:** The standard "max 3 consecutive `[MG:]` without a break" still applies, but the break can be `[AI-GEN:]` or `[ARCHIVAL:]` — no `[FOOTAGE:]` needed.

---

## The Three Visual Registers

Before deciding *which visual mode* to use (footage, MG, layered, AI-GEN), understand which **visual register** the moment belongs to. Registers are the aesthetic languages of the channel — each serves a different narrative function, and all three are unified by the brand treatment pipeline.

### Register 1: Analytical (Remotion Templates)

**Aesthetic:** Clean, geometric, programmatic. IBM Plex Sans typography (Franklin Gothic-derived, mid-century editorial — was Space Grotesk pre-May 10, 2026), precise data, spring-physics animations, ambient particles. The most controlled visual surface — every pixel is brand-locked through theme.ts.

**Narrative function:** Understanding. "Here's the pattern. Here's the data. Here's the structure." The viewer's brain shifts into analytical mode. These moments carry the intellectual argument.

**Sources:** All Remotion templates — DataChart, FrameworkDiagram, ChoroplethMap, RouteAnimation, BayesianUpdate, KineticTypography, GameBoard, NetworkDiagram, SankeyFlow, HorizontalTimeline, etc.

**Treatment:** None needed. Templates are inherently brand-consistent — palette, typography, animation language are all code-enforced.

**Texture:** No grain, no vignette. Clean surfaces. This is deliberate — the absence of film texture signals "designed information" as distinct from "observed world."

### Register 2: Atmospheric (Constructivist Backdrop)

**Aesthetic:** Constructivist illustration in the Parallax house style — drawing on the broader 20th-century constructivist family (Bauhaus design school, American mid-century editorial modernism via Saul Bass / Push Pin Studios / Fortune magazine, British industrial modernism via E. McKnight Kauffer, Japanese Showa-era graphic design via Kamekura, alongside Soviet Constructivism via Rodchenko / Lissitzky and German political photomontage via Heartfield / Masereel). The base aesthetic is the *shared graphic discipline* this family carries: bold compositional confidence, color-blocked forms with no soft shading or gradients, geometric clarity, restrained palette, editorial publication weight. Cultural inflection (Soviet revolutionary intensity, American mid-century restraint, Chinese vermillion, Japanese Showa minimalism, literati ink-wash) is supplied by the per-scene typography emphasis, not by the base. Restricted warm palette per palette.json — ink, walnut, umber, gold, rust, bone on paper background.

**Narrative function:** Feeling. "This is what the system feels like from inside." These visuals carry the emotional weight of the subject — industrial power, technological dependency, civilizational stakes, systemic threat. They don't communicate data; they communicate dread, ambition, scale, and entrapment. The subject is *systems and forces*, not specific people.

**Sources:** Recraft V3 API (`tools/recraft/recraft.py --register atmospheric`) with the unified constructivist preamble. Generated as PNG or SVG, then treated.

**Treatment:** Brand duotone ramp via `treat.py` or the `--treat` flag in `recraft.py`. Two ramps are valid for atmospheric (per VIS-10):
- `standard` (ink → bronze → amber): default warmth, industrial ambition
- `conflict` (ink → oxblood → rust): rare, max 1-2 per episode — high-tension constructivist
- `editorial`: ✗ FORBIDDEN — desaturates the constructivist palette into mush

Plus grain overlay (0.10-0.12 intensity) and vignette (0.18 strength). The grain connects atmospheric backgrounds to grounded scenes (which share the same texture treatment) and to treated photography.

**In Remotion:** Rendered through ImageComposite (background variant with Ken Burns drift) or PhotoMontage (rapid sequence). At 30-40% opacity as backgrounds, they replace generic stock footage wallpaper with something visually distinctive and brand-ownable.

### Register 3: Grounding (Constructivist Figurative)

**Aesthetic:** The same constructivist illustration vocabulary as Register 2 — Rodchenko, Heartfield, Masereel — but applied to *figurative* subjects: people in environments, scenes with humans navigating systems, situated moments. Figures rendered with simplified planar features (geometric facets suggesting facial structure, eyes obscured by lens shadow or hat brim or visor reflection, no realistic detail). Bodies and clothing rendered with constructivist-graphic clarity. Environments range from monumentalist (industrial, propaganda-poster) to intimate (domestic, eye-level) depending on the realism dosage chosen for the scene.

This replaces the prior photoreal mannequin convention. The depersonalization is now *editorial through stylization* rather than uncanny through smoothing. Same three editorial purposes — honesty signal, depersonalization (role-not-person), AI-face quality safeguard — solved through reduction-to-graphic-form rather than smooth-mannequin-face.

**Narrative function:** Presence. "There are humans in this system." The simplified planar figures serve the same depersonalization purpose as the prior mannequin convention: they invite pattern recognition rather than identification with individuals. "This is The Engineer, The Diplomat, The Worker, The Operator." For geopolitics content about systemic actors rather than individual characters, this is the right editorial choice.

**Sources:** Recraft V3 API (`tools/recraft/recraft.py --register grounding`) with the unified constructivist preamble. For animated clips: Recraft generates reference frame → Kling 3.0 / Sora 2 animates the constructivist illustration → `treat_video.py` applies brand LUT. See AI_VIDEO_PIPELINE.md.

**Realism dosage:** Grounding scenes have a per-scene realism parameter (`realism: flat | balanced | grounded`). Critically, the dosage controls *environment* realism only — figures stay fully flat-constructivist (4-5 color-blocked face planes drawing on Rodchenko's 1924 portrait series and Lissitzky's Self-Portrait, no continuous skin tonality, no rendered features) regardless of dosage. Only the environment varies.

- `flat` — both figure AND environment fully color-blocked, no photographic texture anywhere. **Required for animated AI-GEN clips** because animation stability needs maximum flatness; color-blocked forms track reliably across frames whereas photographic textures drift. Best for monumentalist industrial scenes, propaganda-poster moments, and any clip that will be animated by Kling / Sora / Runway.
- `balanced` (default for stills) — figure stays flat-constructivist; environment may have selective material texture (paper grain, light gradients, wood grain on furniture, dust haze in industrial spaces). The figure is never photoreal; the environment may approach photographic detail at the edges.
- `grounded` — figure remains constructivist (no skin tonality, no rendered features) but with slightly more anatomical specificity; environment rendered with photographic spatial detail. **Stills only** — animation drift is severe at this dosage. Best for restricted-facility reconstructions that get Ken-Burned, never animated.

The dosage is an editorial knob the script uses to control how *interpreted* a scene feels and — equally important — whether the asset can be safely animated. Quiet domestic stills often want `balanced` (intimate environment, flat figure). Industrial mobilization clips that will be animated must use `flat`. Restricted-facility reconstruction stills can use `grounded` for spatial presence. The May 4 v1 Beijing-apartment reference produced an under-stylized face at `balanced`; v2 references should validate the tightened figure spec.

**Typography tradition:** Grounding scenes typically include period-and-region-appropriate typography per the `text_treatment` field — Chinese propaganda poster typography for Chinese-coded scenes, Russian Constructivist for Soviet-bloc scenes, English Modernist for American mid-century scenes, etc. See TYPOGRAPHY_TRADITIONS.md for the full vocabulary. The typography is part of the analytical content, not decoration — rendering each civilization in its own visual rhetoric is core to Parallax's cross-cultural decoder posture.

**Treatment:** Same brand pipeline as Register 2 (duotone ramp + grain + vignette). All three treatment ramps are valid for grounding (per VIS-10):
- `standard` — present-day reconstruction (default for fab interiors, command centers, contemporary scenes)
- `conflict` — adversarial scene (military, sanctions, contested moments)
- `editorial` — historical reconstruction (pre-1980s — embargo signings, Cold War, archival feel)

**In Remotion:** Rendered through ImageComposite with the existing BrandImage pipeline. The `portrait` variant with name strip remains purpose-built for the depersonalized-figure convention: show the figure, label the archetype.

### Why Two Constructivist Registers + One Analytical Register Work Together

The visual system collapses to two languages: code-clean Remotion (Analytical) and constructivist illustration (everything else). The earlier three-aesthetic system (Analytical / Atmospheric / Photoreal-Grounding) had a structural seam — photoreal scenes carried different DNA than illustrated ones, and unifying them required heavy LUT work. The unified constructivist approach removes that seam entirely. Atmospheric and grounding now differ only in *role* (background-mood vs. foreground-scene), not in *visual language*.

The coherence model:

1. **A locked color palette.** All three registers pass through the same duotone ramps from `palette.json`. An amber DataChart accent, an amber-tinted constructivist factory background, and a constructivist Beijing apartment scene share tonal DNA. This is unchanged.

2. **A unified illustrated grammar.** Registers 2 and 3 now share the same visual vocabulary — Rodchenko/Heartfield/Masereel constructivism — and differ only in subject and role. This dramatically simplifies the brand-coherence work compared to the prior system. There's no longer a stylistic gap between an atmospheric backdrop and a grounded scene; they're the same aesthetic at different scales.

3. **A consistent motion rhythm.** The transition library in FullEpisode.tsx provides the motion language. The same iris, dissolve, and color-wash transitions connect all three registers. Viewers recognize timing and rhythm unconsciously.

4. **A deliberate texture hierarchy.** Registers 2 and 3 get grain + vignette treatment. Register 1 does not. This creates a visual hierarchy: *grainy = the world* (illustrated, emotional, spatial), *clean = the analysis* (data, structure, argument). The texture difference becomes a signal.

5. **Typography as analytical content.** Per-scene typography traditions (Chinese, Russian, English Modernist, Japanese Showa) make the visual rhetoric of each civilization part of the channel's cross-cultural argument. The typography choice IS analysis. See TYPOGRAPHY_TRADITIONS.md.

6. **Editorial posture: decoder, not explainer.** Mixing registers (and typographic traditions within them) signals intellectual honesty. "This topic requires multiple ways of seeing — and the visual rhetoric of each civilization is part of how we read it." Each carries a different kind of truth.

### Transition Grammar Between Registers

Use these transition types consistently across every episode. Viewers learn the motion vocabulary even if they can't name it.

**Channel signature transitions (codified in BRAND.md → "Cross-Pillar Transition Signatures").** Three classes of transition based on the texture-and-source-character profile of the two pillars being bridged:

**Class A — Within a pillar (soft or hard transitions, both valid):**

| Direction | Signature transition | Duration |
|---|---|---|
| Within Analytical (Remotion ↔ Remotion) | Cut, or wipe at register-defined corner | 1 frame to 200-300ms |
| Within Constructivist (Atmospheric ↔ Grounding) | Cross-dissolve | 300-500ms |
| Within Footage (Archival ↔ Archival, Screen ↔ Screen, Archival ↔ Screen) | Cut or cross-dissolve | 1 frame to 400ms |

**Class B — Cross-pillar with texture gap (clean Remotion ↔ either grainy pillar; always uses color-wash + grain transition; hard cuts forbidden):**

| Direction | Signature transition | Duration |
|---|---|---|
| Analytical → AI-generated | Amber color-wash with illustrated-grain-fade-in | 600-800ms |
| AI-generated → Analytical | Dissolve with illustrated-grain-fade-out and ink iris-in | 500-700ms |
| Analytical → Footage | Sepia color-wash with photographic-grain-fade-in | 600-800ms |
| Footage → Analytical | Dissolve with photographic-grain-fade-out and bone iris-in | 500-700ms |

**Class C — Cross-pillar with source-character gap only (both grainy, illustrated vs. photographic):**

| Direction | Signature transition | Duration |
|---|---|---|
| AI-generated ↔ Footage | Warm cross-dissolve through walnut | 400-500ms |

**Beat boundaries** (any → any): Fade through bone or ink (mode-dependent), 400-600ms.

The mnemonic: amber color-wash means "into illustrated world," sepia color-wash means "into documented world," ink/bone iris-in means "back to analytical." Walnut cross-dissolve marks "interpreted ↔ documented" within the grain-textured pillars. Viewers learn these unconsciously across episodes.

Rules:
- **Never hard-cut Class B (clean ↔ grainy across pillars).** Always use the signature transition. render-qa flags any Class B hard-cut as a likely error.
- **Class A hard cuts are valid** within any single pillar; same texture and same source character, no bridge needed.
- **Class C tolerates hard cuts** when editing rhythm explicitly calls for it, but the warm walnut cross-dissolve is the channel default since the source-character gap (illustrated vs. photographic) is real even when texture is shared.
- **Register 2 in foreground appears max twice per beat.** As background at 30-40% opacity it can appear longer, but visual intensity in the foreground is a spice, not a main course.
- **Per-episode signature override:** an episode's `visual-identity.json` may override the default signatures (e.g., conflict-treatment episodes use rust color-wash instead of amber for Class B Analytical → AI-generated). Defaults defined in BRAND.md; per-episode overrides documented in the visual identity card.

### Voiceover Discipline for Culturally-Loaded Visual Language

When an episode deploys Soviet Constructivist, Chinese propaganda, Japanese Showa-era, or otherwise politically-loaded visual emphasis, the narration must analytically frame the imagery rather than presenting it celebratorily. This is the Adam Curtis precedent — propaganda visual language can be deployed analytically (with sophistication) or aesthetically (with confusion). The difference is whether the voiceover engages with the visual rhetoric explicitly.

**Why this matters editorially.** The constructivist illustration tradition has political-aesthetic gravity that can be misread as ideological alignment. The May 4 risk-mitigation calibration broadened the channel's base aesthetic from Soviet/German-leaning to the whole 20th-century constructivist family, which dramatically softens the default reading. But when an episode *does* deploy Soviet/Chinese/Japanese propaganda emphasis (because the content is explicitly about Soviet/Chinese/Japanese state power), the visual rhetoric requires analytical framing in the narration to prevent ambiguity. Without explicit framing, viewers may read the channel as endorsing the propaganda tradition; with explicit framing, viewers read it as commentary.

**The voiceover discipline rule:**

When the visual layer renders Soviet Constructivist / Chinese propaganda / Japanese Showa imagery (per the typography emphasis in the shot list), the script's narration must include at least one of these analytical framings within the same beat:

1. **Name the visual rhetoric explicitly.** "This is the visual language Soviet workers themselves saw" / "Cultural Revolution propaganda traditions" / "Showa-era state imagery." The viewer reads the channel as making the rhetoric visible for analysis, not channeling it.

2. **Make the recurrence the argument.** Pair the loaded imagery with structurally parallel imagery from a different regime. "The Soviets used this visual rhetoric for industrial mobilization in 1972; the United States is using parallel rhetoric for semiconductor mobilization in 2026." The visual juxtaposition becomes the structural argument the episode is making.

3. **Include falsification.** Per NAR-19, name what would change your mind about the parallel being drawn. "If the structural recurrence holds, watch for X; if X doesn't appear, the parallel is weaker than I think." Explicit falsifiability anchors analytical posture.

4. **Pull back to personal stakes.** Per NAR-05, end the beat or episode on concrete personal implications, not propaganda intensity. The closing voiceover should be in the channel's own voice (smart-friend register), not the propaganda tradition's voice.

**The anti-pattern.** Showing Soviet imagery without naming it as such; using Cultural Revolution propaganda aesthetic in a beat about contemporary Chinese tech without analytically engaging with that rhetoric; ending an episode on monumentalist propaganda intensity rather than personal stakes. These read as channel ideology rather than channel commentary.

**Implementation.** The script-draft skill should check that any beat with Soviet/Chinese/Japanese typography emphasis in the shot list also includes one of the four framing moves above in the corresponding narration. The script-audit skill checks for this in its visual-narration alignment lens.

**Exception.** When the entire episode is about state-power visual rhetoric explicitly (rare, but possible — e.g., a Predictive History episode on "How states use propaganda to mobilize"), the loaded imagery is the subject, and the framing rule applies at the episode level rather than the beat level. In those cases, the cold open should establish the analytical posture and subsequent beats can deploy the imagery freely.

### The Depersonalized Figure Convention

When depicting systemic actors (not named individuals), use constructivist-figurative figures with simplified planar faces — geometric facets suggesting facial structure, eyes obscured by lens shadow or hat brim or visor reflection, no realistic detail. This replaces the prior photoreal mannequin convention; the editorial purpose is identical, but the depersonalization happens through *graphic stylization* rather than uncanny smoothing.

The shift from mannequin to constructivist-figurative was made May 4, 2026, before any episode shipped. The mannequin convention had become a genre marker for AI-geopolitics-explainer channels broadly; constructivist-figurative is differentiated, brand-coherent (matches Register 2's atmospheric vocabulary), and editorially intentional rather than uncanny-by-default.

**When to use depersonalized figures:**
- Generic decision-makers, executives, diplomats, military personnel
- Workers in facilities (cleanrooms, factories, data centers)
- Crowds, populations, anonymous actors in systems

**When NOT to use:**
- Named historical figures (use archival photos instead)
- The narrator / host (use real footage)
- When a real person's identity is the point of the narration

**Labeling convention:** When a depersonalized figure represents a category, use the ImageComposite portrait variant with a name strip labeling the archetype: "The Regulator," "The Engineer," "The Executive." This turns the stylization from a deficit into a deliberate editorial device — the viewer understands they're seeing a role, not a person.

**Realism dosage interacts with this convention.** A `flat` rendering produces the most graphically depersonalized figure (image-4-style). A `grounded` rendering preserves the planar facets but adds spatial realism. A `balanced` rendering (default) sits between. Pick the dosage that serves the moment; the depersonalization signal holds across all three.

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

**What the viewer experiences:** Immersion in an inaccessible space. The brain processes these sequences as "this place is interpreted but spatially real" — a visualization that's more concrete than a motion graphic but more honest than stock footage pretending to be something it isn't. The constructivist illustration vocabulary (planar-faceted figures, restricted palette, color-blocked forms) signals editorial illustration, not documentary evidence.

**When to use it:**

- **Unsourceable interiors.** When the narration describes a specific facility or space that no stock library covers — TSMC cleanrooms, military command centers, classified research labs. Generic cleanroom stock exists, but AI-GEN can show an *advanced node* fab with contextually accurate equipment.
- **Historical reconstructions.** Pre-camera events or moments where no footage survives. The 1941 embargo signing, Deng Xiaoping's 1992 Shenzhen visit, closed-door Cold War negotiations. The editorial LUT treatment signals "reconstruction."
- **Conceptual spaces.** When an abstract idea benefits from being made physical — supply chains as corridors, sanctions as sealed doors, bifurcation as a literally splitting path. More immersive than MG, but the constructivist illustration vocabulary (planar-faceted figures, restricted palette) prevents it from being mistaken for reality.
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
- **No more than 2 consecutive AI-GEN single-shot clips without a mode switch.** AI-GEN single shots are immersive but their stylized quality becomes fatiguing if overused. One clip is a window into an inaccessible world. Three in a row starts to feel like a video game cutscene. **This rule does NOT apply to multi-frame [SCENE:] blocks** (see SCRIPT_FORMAT.md → "Multi-Frame Scene Blocks") — a chained scene of 3-5 frames morphed into one continuous ~24-40s shot reads to the viewer as a single atmospheric unit, not as multiple consecutive clips. The fatigue concern is "successive cuts to different AI-illustrated worlds," not "one continuous AI-illustrated scene that breathes for 30 seconds."
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

### Sustained Atmospheric Stretches (added May 9, 2026)

Sometimes a scene earns more than 10 seconds of continuous atmospheric or grounding visual time — a multi-frame chained scene that reads as one extended shot rather than a sequence of cuts. The May 2026 chained-still-morph workflow (see CHAINED_STILL_LESSONS.md) makes this technically achievable for the channel; this section governs *when* it's editorially appropriate.

**The 60-second guideline (synthesized, not yet validated on Parallax retention data).** Atmospheric or grounding stretches up to ~60 seconds are defensible without retention loss IF and ONLY IF all three of the following guardrails hold:

1. **Continuous narration carries analytical content over the stretch.** The atmosphere amplifies the argument; it doesn't replace it. The Adam Curtis model — long archival sequences with voice-of-god narration making the analytical case — is the precedent. Atmosphere without analytical narration is decoration; atmosphere with analytical narration is a form of argument.
2. **Something visually changes every 15–20 seconds inside the stretch.** Even a single "scene" should breathe — a camera move, a figure entering, a palette shift, a new compositional element resolving. Total stillness for 60 seconds is hypnotic in archive footage but feels stalled in illustrated content. The chained-morph technique makes this rule easy to honor: each morph clip in a chain is a 6-10s "change event."
3. **The stretch ends on analytical re-engagement, not a fade.** Cut from the atmospheric scene back into MG (data, framework, typography card) at the moment the narration calls for it. Fading out of a long atmospheric stretch creates a "we lost the thread" feeling; cutting back to analysis makes the atmospheric stretch read retroactively as deliberate breath, not drift.

Stretches over 60 seconds without one of those guardrails go past where any published data supports. The MrBeast-school view treats any 30-60s stretch as retention risk by default — that's the wrong model for Parallax content but worth knowing as the dominant counter-position. Empirical retention data on the channel's specific audience, post-launch, is the authoritative source; the 60-second guideline is provisional and should be revised as analytics accumulate.

**Pacing budget per episode.** A 15-20 minute Philosopher's Lens episode can typically support **1-3 sustained atmospheric stretches of 30-60s each**, no more. Two reasons: (a) more than that and the analytical channel is effectively off for too much of the episode, breaking the channel's "rigorous decoder" register; (b) atmospheric stretches are expensive to produce at the chained-still-morph quality bar, so the production budget naturally constrains them.

**When NOT to use a sustained atmospheric stretch:**
- The scene is a 5-8s atmospheric punctuation moment — use a single AI-GEN clip instead, much cheaper and faster.
- The arc requires figure motion (figures walking, gesturing) rather than figure resolution — single-shot I2V handles motion better than chain-morphs.
- The narration over the stretch is analytical-data-dense (numbers, citations, frameworks) — viewers can't simultaneously process atmospheric visual change and analytical-data-dense audio. Reserve sustained atmospheric stretches for narratively-paced or emotionally-charged narration.

**Production technique:** See CHAINED_STILL_LESSONS.md for the validated workflow (ChatGPT chained stills + Pika 2.5 morphs) and SCRIPT_FORMAT.md for the `[SCENE:]` script-block notation that encodes a sustained atmospheric stretch as a first-class unit.

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

## On-Screen Text vs. Narration

Parallax is a narration-first channel. The narrator is the protagonist; visuals are evidence. On-screen text earns its place only when narration can't do the job — never as a duplicate of what the voice will already say.

**The test:** *can the narrator say this faster and more naturally than the screen can show it?* If yes, narration. On-screen text wins only when it's persistent (data labels viewers re-read), provenance (source attribution — narrator wouldn't say "Source: World Bank"), or framing (kicker / byline magazine convention). Otherwise it competes for attention and locks narration to a specific phrasing.

| Always on-screen | Selectively on-screen | Almost never on-screen |
|---|---|---|
| Title (one short headline) | Kicker (1-3 words above headline) | Narrated sentences duplicated |
| Source attribution | Hero stat callout | Multi-line explanations |
| Axis labels, data labels, glyph legends | Italic context note (one short line) | Multi-paragraph analysis |
| Date stamp | Editorial frame (kicker / byline structure for hero moments) | Anything narration can say clearly |

**Where text wins:** quote cards and KineticTypography (the words *are* the visual), title cards (they *are* the message), stat reveals (the number is the punchline; narration confirms), and `EditorialFrame` hero variants (magazine-spread idiom for cold opens or major section transitions). Use sparingly — these are *hero moments*, not the default mode.

**Cognitive cost:** two competing information streams (text on screen + narration) split attention. The Economist's video team has documented this: aggressive cuts to on-screen text once narration covers it. Match that discipline.

**Practical implication for templates:** the standard chart frame ships with title + subtitle + axis labels + source. That's the right baseline. Anything beyond — kicker, hero stat, context note, in-frame annotation — is a per-frame editorial decision, not a template default. Don't pad templates with explanatory text that narration will deliver better.

---

## Map vs. Network Diagram: Is the Geography Meaningful?

A recurring template-selection mistake: rendering geographically-anchored relationships (trade routes, military alliances tied to territory, road or rail networks) as a schematic NetworkDiagram instead of as a real map. The schematic throws away latitude, distance, neighbouring borders, and every other editorial signal the real geography carries — "all roads led to Rome" is *literally a fact about geography*, and "Londinium in Britain, Alexandria in Egypt, Carthago in North Africa" is the editorial weight that a hub-and-five-bubbles diagram silently deletes.

**The decision rule:** *is the spatial position editorially meaningful?*

| Yes — geography matters | No — relationship matters |
|---|---|
| Trade routes, supply lanes | Supply-chain chokepoints (TSMC ↔ chip designers) |
| Military alliances anchored to territory | Coalition / alignment / dependency structures |
| Road, rail, sea-lane networks | Influence networks (intellectual lineage, citation graphs) |
| Infrastructure topology where adjacency matters | Causation diagrams (multiple trends → one outcome) |
| Anywhere "near vs far" or "on the way to" carries meaning | Organizational hierarchies (politburo, cabinet, board) |
|  | Concept maps (a central idea and its sub-claims) |

**Yes →** `ChoroplethMap` (regional values), `RouteAnimation` (paths through space).
**No →** `NetworkDiagram` (relationship structure).

**Test:** if you find yourself naming geographic places (Lyon, Cairo, Constantinople), the schematic is almost always wrong. If your nodes are abstract entities (TSMC, the Federal Reserve, a school of thought, a causal driver), the schematic is almost always right.

---

## Relationship to Other Docs

- **SCRIPT_FORMAT.md** — the syntax for specifying visuals in the script's right column. This doc tells you *what* to write; that doc tells you *how* to write it.
- **FOOTAGE_SOURCING.md** — where to actually get footage. This doc tells you *when* footage is the right choice; that doc tells you *whether* you can actually get it.
- **POLISH.md** — the quality spec for motion graphics. Covers animation, composition, and brand identity for the MG layer.
- **BRAND.md** — the image treatment pipeline. Stock footage, archival images, and AI-generated stills get brand treatment (duotone, grain, vignette) before they go into the video.
- **AI_VIDEO_PIPELINE.md** — the full spec for AI-generated video (Register 3 animated clips). Covers aesthetic, tools, workflow, prompting, and editorial guardrails.
- **SVG_ILLUSTRATION_PIPELINE.md** — *deprecated May 4, 2026*. The Claude SVG generation path is retired in favor of `tools/recraft/recraft.py` (Recraft V3 API). Recraft's `vector_illustration` style covers the analytical/diagrammatic content this path previously served and integrates with the per-typography palette emphasis architecture (see PROMPT_PREAMBLES.md). The doc is kept for reference but should not drive new production.
- **tools/recraft/recraft.py** — CLI tool for generating Register 2 (atmospheric) illustrations and Register 3 (grounding) photorealistic stills via Recraft V3 API. Includes brand duotone treatment and batch mode.
- **tools/brand-treatment/treat.py** — the color unification pipeline. All three registers pass through this to share tonal DNA. The single most important tool for making mixed-media feel cohesive.
