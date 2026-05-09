# Parallax — AI-Generated Video Pipeline

## What this document is

The production specification for AI-generated video content in Parallax episodes. Covers the aesthetic philosophy, tool selection, generation workflow, prompting patterns, brand treatment integration, and editorial guardrails.

AI-generated video is the **fourth visual mode** (`[AI-GEN:]`), sitting between footage and motion graphics on the concreteness spectrum. It visualizes things that are physically real but unsourceable — restricted facilities, historical moments without cameras, conceptual spaces made literal.

Created: May 2, 2026
Updated: May 4, 2026 — Cross-linked to three-register visual system and prompt preamble layer.
Updated: May 4, 2026 — Replaced photoreal-mannequin "Stylized Realism" aesthetic with "Stylized Constructivism." Registers 2 and 3 now share constructivist visual language; differ only in role (background vs. foreground figurative). Added per-scene typography-tradition parameter and realism-dosage sub-mode.

**Related docs:**
- **VISUAL_LANGUAGE.md** — *when* to use AI-GEN vs. the other three modes. Defines the three visual registers (Analytical / Atmospheric / Grounding); this pipeline produces Register 3.
- **PROMPT_PREAMBLES.md** — the prompt-level brand layer that pairs with this generation pipeline. Documents the `--register grounding` preamble in `tools/recraft/recraft.py` for stills, and the `treat_video.py` LUT pass for clips. Two-stage brand unification.
- **FOOTAGE_SOURCING.md** — sourcing tiers; AI-GEN replaces many "Unsourceable" entries.
- **SCRIPT_FORMAT.md** — the `[AI-GEN:]` tag specification for the right column.
- **BRAND.md / palette.json** — treatment pipeline that AI-GEN footage passes through.
- **EDITORIAL_PLAYBOOK.md** — VIS-09 (three registers present) and VIS-10 (register × treatment pairings).

---

## Register Identity

This pipeline is the implementation of **Register 3 (Grounding)** from the three-register visual system in VISUAL_LANGUAGE.md. Everything in this document — the stylized-realism aesthetic, the mannequin-face convention, the photoreal environments, the Kling/Sora/Runway tool selection — produces Grounding-register content.

The brand unification for this register operates in two stages:

1. **Prompt-level (recraft.py / Flux 2 Pro reference frames).** When generating reference frames or photoreal stills via `recraft.py`, invoke with `--register grounding` to apply the canonical preamble (warm tungsten lighting, mannequin convention, heavy chiaroscuro, palette anchoring, negative prompts against Adobe-stock cleanliness). The full preamble text and design rationale live in PROMPT_PREAMBLES.md. Reference frames generated through Flux 2 Pro should mirror the same preamble vocabulary so they feed into Kling/Sora image-to-video with on-brand source images.

2. **Treatment-level (treat_video.py / treat.py).** Generated clips and stills pass through the brand LUT (standard / conflict / editorial) plus grain and vignette. With the prompt-level pass already pushing source material into the warm-umber palette, the LUT does final 10% polish rather than 60% color rescue. The pairing rules between treatment and register are formalized as VIS-10 in EDITORIAL_PLAYBOOK.md — for grounding, all three treatment ramps are valid (standard = present-day, conflict = adversarial, editorial = historical reconstruction).

The other two registers are produced elsewhere: Register 1 (Analytical) lives in code-locked Remotion templates, Register 2 (Atmospheric) is generated via `recraft.py --register atmospheric` (constructivist illustrations). All three share tonal DNA through palette.json. When in doubt about *which* register a moment needs, consult VISUAL_LANGUAGE.md's decision heuristic.

---

## The Aesthetic: Stylized Constructivism

### Philosophy

Parallax AI-generated video occupies a deliberate visual register: **everything is rendered in a unified constructivist illustration vocabulary** — environments and figures share the same graphic language, drawing on Soviet constructivism (Rodchenko, Lissitzky, Klutsis), German political photomontage (Heartfield, Höch), and 20th-century industrial woodcut traditions (Frans Masereel, Lynd Ward). This isn't decoration; it's an editorial register. The viewer reads constructivist illustration as "this is interpreted, structured, analytical content" — not documentary footage, not Adobe-stock cleanliness, not the AI-mannequin aesthetic that's become the genre default.

The constructivist aesthetic serves the same function as The Economist's red-and-white illustrations or Kurzgesagt's simplified characters — an honesty marker that says "editorial illustration, not evidence." But it goes further: it carries *political-aesthetic gravity* (the constructivist tradition has always been about state power, technology, mobilization) that fits Parallax's analytical subject matter, and it's massively differentiated from the AI-photoreal-mannequin look that's become generic across the geopolitics-explainer space.

This replaces the prior "Stylized Realism" approach (photoreal environments + smooth mannequin faces). The shift was made May 4, 2026, before any episode shipped. Migration rationale: (1) the mannequin convention had become a category marker for AI-channels broadly — viewers were starting to read smooth-face-AI = generic-AI-channel. (2) The constructivist vocabulary unifies Register 2 (atmospheric backgrounds) and Register 3 (grounded scenes) into a single visual language, dramatically simplifying brand-coherence work. (3) The aesthetic has demonstrated range in testing — it holds at monumentalist industrial scale *and* at intimate domestic scale, controlled by a per-scene realism dosage knob.

### Visual Parameters

**Unified visual language across both registers.** Constructivist illustration in the Rodchenko / Heartfield / Masereel tradition. Bold compositional confidence, color-blocked forms with no soft shading or gradients, restricted warm palette (ink, walnut, umber, gold, rust, bone, paper — per palette.json), graphic monumentalism in industrial scenes, intimate restraint in domestic scenes.

**Figures (constructivist-figurative):**
- Bodies and clothing rendered with constructivist-graphic clarity — color-blocked planes, geometric simplification, period/context-appropriate details (uniforms, suits, bunny suits, etc.)
- Faces rendered with simplified planar features — geometric facets suggesting facial structure (jaw planes, cheekbone planes), eyes obscured by lens shadow / hat brim / visor reflection / hairfall, no realistic detail
- The depersonalization signal is *editorial through stylization* rather than uncanny through smoothing. Replaces the prior smooth-mannequin-face convention.
- Skin tone and body type still convey demographic specificity where relevant (Chinese workers in Chinese-coded scenes, etc.)
- Figures move naturally in animation (walking, gesturing, operating equipment) — motion is naturalistic, only the rendering is graphic

**Environments:**
- Industrial/technological scenes: monumentalist, propaganda-poster compositions. Stacked geometric machinery, workstations as architectural forms, low horizon lines, heroic angles. Best at `flat` realism dosage.
- Domestic/intimate scenes: eye-level, restrained scale, period-detail integration (calendars, books, teacups, framed photographs). Best at `balanced` realism dosage.
- Restricted-facility reconstructions: spatial detail preserved through `grounded` realism dosage — environments rendered with more photographic detail while figures remain stylized planar forms.

### Realism Dosage (per-scene knob)

Grounding scenes accept a `realism` parameter. **The dosage controls environment realism only — figures stay fully flat-constructivist (4-5 color-blocked face planes drawing on Rodchenko's 1924 photomontage portraits and Lissitzky's 1924 Self-Portrait, no continuous skin tonality, no rendered facial features) at all three dosages.** This is the most important refinement in the constructivist spec: realism on figures is the failure mode that produced the unsatisfying May 4 v1 Beijing-apartment generation; realism on environments is fine and often editorially useful.

- **`flat`** — Both figure AND environment fully color-blocked. No photographic texture anywhere, no shading, no gradients. **Required for animated AI-GEN clips** — animation stability needs maximum flatness because color-blocked forms track reliably across frames whereas photographic textures (skin, fabric weave, atmospheric haze) drift severely. Use for monumentalist industrial scenes, propaganda-poster moments, atmospheric backdrops, and any clip that will be animated.
- **`balanced`** — Figure stays flat-constructivist (same standard as flat). Environment may have selective material texture: paper grain on backgrounds, warm light gradient on a desk lamp's pool, subtle wood grain on furniture, dust haze in industrial spaces. Default dosage for stills; works for most scenes from intimate domestic to industrial.
- **`grounded`** — Figure stays constructivist (planar planes, no skin tonality, no rendered features) but may carry slightly more anatomical specificity. Environment rendered with photographic spatial detail: atmospheric perspective, material texture on machinery, deeper spatial recession. **Stills only** — animation drift becomes severe because the photographic environment surfaces fail to track consistently across frames. Use for restricted-facility reconstruction stills that will be Ken-Burned in NLE, never sent to Kling/Sora.

**The animation-flat rule** is load-bearing: when an AI-GEN asset will be animated, the shot list `realism` must be `flat`. The visual-spec skill should enforce this when emitting shot lists; render-qa should flag any animated entry with non-flat realism as a likely mistake.

The dosage is decided in the script's visual column or the angle memo, recorded in the shot list as `realism: flat | balanced | grounded`, and consumed by `recraft.py` and the visual-spec skill. Default for stills is `balanced`. Default for animated clips is `flat`.

### Typography Tradition (per-scene parameter)

A defining feature of the constructivist approach: typography is *contextual to the scene's geography and era*, not a fixed channel default. A 1980s Beijing apartment includes Chinese typography of that period; a Soviet-bloc historical episode uses Russian Constructivist typography; a US industrial mobilization scene uses American midcentury modernist typography (Push Pin Studios / Saul Bass / *Fortune* magazine industrial-modernism).

This isn't decoration. The typographic rhetoric of each civilization is part of how that civilization communicates power and identity. Rendering each in its own visual rhetoric makes the visual layer participate in the cross-cultural argument — which is core to Parallax's translator-decoder identity.

The typography decision is recorded as the `text_treatment` field on each shot. Available values, full visual grammars, and editorial guidance: see TYPOGRAPHY_TRADITIONS.md. Default for grounded scenes is contextual-to-the-region; default for atmospheric backgrounds is `none` or minimal.

### Color and Mood

All AI-generated clips pass through the same `treat_video.py` brand treatment as stock footage:
- Standard LUT (warm umber shadows → amber highlights) for most content — present-day reconstructions, default mood
- Conflict LUT (ink shadows → rust highlights) for adversarial moments — military, sanctions, contested
- Editorial LUT (desaturated, bone tones) for historical reconstructions — pre-1980s, Cold War, archival feel

The constructivist aesthetic is calibrated to land in the warm-umber palette pre-LUT (the preamble locks the palette explicitly), so the LUT does final 10% polish rather than 60% color rescue. This is the prompt-level half of the brand unification architecture — see PROMPT_PREAMBLES.md.

Per VIS-10, atmospheric register + editorial treatment is forbidden — the editorial ramp's desaturation destroys the constructivist palette. All other register × treatment pairings are valid.

---

## Tool Selection (May 2026)

**Note on the constructivist shift:** The May 4, 2026 migration from photoreal-realism to stylized-constructivism changes which tools are best-fit for which step. Recraft V3 becomes the **primary stills tool** because it's strongest at the constructivist illustration aesthetic that's now the channel default. Flux 2 Pro remains useful for the rare scenes that need photographic grounding (`realism: grounded` in grounded scenes), but the bulk of stills work moves to Recraft. Video tools (Kling, Sora, Runway, Seedance) animate the Recraft-generated reference frames; their underlying photorealism strength matters less now that the source frames are constructivist illustrations.

### Primary: Kling 3.0

**Why it's the default for Parallax:**
- Native 4K output (3840×2160) without upscaling artifacts — matches our delivery spec
- Multi-shot consistency via "Bind Subject" — treats reference images as 3D anchors
- Best cost-per-minute for the quality tier (~$4/min at $37/month pro plan)
- Strong with environments, architecture, industrial spaces, cinematic lighting
- 60fps capability for slow-motion or smooth camera movements
- Standard MP4 output — drops directly into `treat_video.py` pipeline

**Best for:** Establishing shots of facilities, industrial environments, architectural walkthroughs, equipment close-ups, atmospheric scenes.

**Limitations:** Character consistency degrades past 12-15 seconds. Plan for 5-8 second clips stitched in the NLE, not single long takes.

**Workflow:** Image-to-video mode. Generate a reference frame first (see below), then animate it with motion prompts.

### Secondary: Seedance 2.0

**Why it's a strong complement to Kling:**
- Multi-shot storytelling with up to 12 file inputs for consistency anchoring
- Native audio generation (ambient sound sync)
- Production-grade quality at ~5x cheaper than Kling ($0.022/sec on Fast tier)
- Strong narrative coherence across clip sequences

**Best for:** Longer sequences where cost matters, narrative-driven content, scenes where ambient audio generation saves post-production time. Test head-to-head with Kling for environment quality.

**Limitations:** Newer model, less proven for the specific mannequin-face aesthetic. Worth testing before committing to production use.

### Tertiary: Sora 2 Pro

**Why it's useful as complement:**
- "Director Mode" — define a scene and re-shoot from different angles without losing consistency
- Storyboard mode — up to 5 keyframes with automatic transitions between scenes
- Global illumination engine produces industry-best lighting
- Included with ChatGPT Pro ($200/month) — no incremental per-clip cost if already subscribed

**Best for:** Multi-angle sequences (wide → medium → detail of same space), cinematic transitions, scenarios where you need 3-4 shots of the same environment from different perspectives.

**Limitations:** Standard output is 1080p (upscaled to 4K). Maximum 25 seconds per storyboard generation.

### Quaternary: Runway Gen-4

**Why it's worth having in the toolkit:**
- 95% character identity lock from a single reference image
- Style reference system transfers a consistent visual aesthetic across all generations
- Best camera motion control — smooth dollies, pans, crane shots

**Best for:** Sequences where the same figure appears in multiple shots and needs to be recognizable (even with a mannequin face, body/clothing consistency matters for narrative clarity).

**Limitations:** Mid-tier pricing, shorter clip durations than Kling.

### Reference Frame Generation: Flux 2 Pro (Primary) + GPT Image 2 (Iteration)

Before video generation, create a single **reference frame** that locks:
- The exact environment/space
- Lighting direction and quality
- The mannequin-face character style
- Composition and framing
- Color temperature (neutral, ready for LUT pass)

This image becomes the "source of truth" for the video generation step. It's the quality control gate — if the still frame doesn't look right, don't animate it.

**Primary: Flux 2 Pro** (Black Forest Labs)
- Best photorealism available — skin textures, lighting physics, material accuracy indistinguishable from DSLR photography
- Pay-per-image pricing, no subscription required
- Output is optimized as input for Kling/Sora image-to-video (photorealistic anchors animate better)
- Zero-configuration: no inference steps or guidance scales to tune
- Current model family: FLUX.2 with variants (Pro, Flex, Klein). No Flux 3 yet as of May 2026.

**Flux 2 Pro API Providers (as of May 2026):**

| Provider | ~Cost at 1920×1080 | Pricing Model | Notes |
|---|---|---|---|
| **fal.ai** (recommended) | ~$0.045 | $0.03/MP | Fastest latency, simple SDK (`pip install fal-client`) |
| **BFL direct** | ~$0.045 | $0.03 first MP + $0.015/extra MP | Official API, batch support |
| **Together AI** | ~$0.055 | Per-MP | Image-to-image support, free trial credits for new users |
| **Replicate** | ~$0.055 | Per-MP | Simple API, popular with indie devs |
| **DeepInfra** | ~$0.055 | Per-MP | OpenAI-compatible endpoint format |

All providers serve the same underlying FLUX.2 Pro model. Price difference per image is pennies — pick by API ergonomics, not cost. For Parallax's volume (~10-15 images/episode), the total monthly spend is $1-2 regardless of provider.

**Parallax default: fal.ai** — fastest, cheapest tier, simple Python SDK, well-documented.

**Secondary: GPT Image 2** (via ChatGPT Pro)
- Already in the stack ($200/month ChatGPT Pro subscription)
- Best for rapid compositional iteration (free, instant results)
- Known limitation: tends to generate concave/scooped faces when prompted for featureless mannequin faces. Flux 2 Pro handles the convex mannequin surface more literally.
- Use for drafting compositions; always finalize in Flux 2 Pro for production reference frames.

**When to use Midjourney v8 instead:**
- When the reference needs a more *stylized/cinematic* mood that Flux 2's clinical photorealism doesn't capture
- For conceptual/metaphorical scenes where artistic atmosphere matters more than material accuracy
- But note: for most Parallax AI-GEN (environments, facilities, reconstructions), Flux 2's photorealism is the stronger starting point

**Recommended:** Build a small library of "Parallax style reference" images that establish the mannequin-face aesthetic, the lighting approach, and the environmental detail level. Feed these as style references to maintain consistency across episodes. See `tools/ai-video/style-references/PROMPTS.md` for the 7 canonical reference prompts and `tools/ai-video/PROMPT_SYSTEM.md` for the automated prompt generation system.

---

## Generation Workflow

### Step 1: Identify AI-GEN Segments (during visual-spec)

When running the visual-spec skill, segments tagged `[AI-GEN:]` in the script get a different output than `[MG:]` segments:
- Instead of Remotion JSON data files → generate an **AI video generation brief**
- The brief includes: scene description, reference image prompt, motion/camera prompt, duration target, treatment (standard/conflict/editorial)

### Step 2: Generate Reference Frames

For each AI-GEN segment, generate a reference frame using **Recraft V3 as the primary tool** for constructivist scenes (the channel default). Invoke via:

```
python tools/recraft/recraft.py generate "scene description" \
    --register grounding \
    --realism balanced \
    --text-treatment chinese_propaganda \
    -o reference_frame.png
```

The `--register`, `--realism`, and `--text-treatment` flags compose the full constructivist preamble per PROMPT_PREAMBLES.md — palette anchoring, typography tradition, dosage, negative prompts. Most scenes work at `--realism balanced`. Use `--realism flat` for monumentalist industrial scenes and `--realism grounded` for restricted-facility reconstructions where spatial presence matters.

**Flux 2 Pro remains the secondary tool**, used specifically for hero P1 reference frames where photographic grounding is critical and the scene benefits from `realism: grounded` more than the constructivist default. After May 4, 2026, expect ~70% of reference frames to come from Recraft and ~30% from Flux 2 Pro (was previously ~100% Flux). Adjust the budget allocation accordingly — Recraft pricing applies via subscription rather than pay-per-image, so heavy Recraft use is essentially free at the channel's volume.

**Flux 2 Pro prompt structure:**
```
[environment description]. [lighting description]. [camera angle and lens].
[figure description with "completely smooth featureless face, mannequin-like, no eyes or mouth"].
[mood/atmosphere]. Photorealistic, shot on [lens]mm, [depth of field]. 16:9 aspect ratio.
```

Flux 2 Pro uses natural language prompts (no `--` flags like Midjourney). Be descriptive and specific — Flux excels at literal prompt-following.

**Example for EP01 TSMC fab walkthrough:**
```
Interior of an advanced semiconductor fabrication cleanroom. Yellow
lithography lighting casting warm amber glow across white surfaces and
equipment. Medium shot from hip level, 35mm lens, shallow depth of field.
Two workers in full white bunny suits with clear face shields — their
faces are completely smooth and featureless behind the shields, mannequin-like,
no eyes or mouth visible. Wafer handling equipment in foreground, FOUP
carriers on automated track in background. Atmosphere of extreme precision
and sterility. Photorealistic rendering, cinematic photography. 16:9 aspect ratio.
```

**GPT Image 2 (for quick iteration):**
Same prompt works — paste it into ChatGPT and ask for the image. Lower quality than Flux 2 but instant feedback on composition and framing. Once the composition is right, generate the final version in Flux 2 Pro.

**Quality gate:** Review the reference frame. Does it look like it belongs in a Parallax video after a LUT pass? If not, iterate the prompt before moving to video generation.

### Step 3: Generate Video Clips

Feed the approved reference frame to Kling 3.0 (or Sora 2) in image-to-video mode:

**Kling 3.0 workflow:**
1. Upload reference frame as source image
2. Enable "Bind Subject" to lock the composition
3. Write a motion prompt describing camera movement and subject action
4. Set duration (5-8 seconds recommended for consistency)
5. Generate at 4K, 30fps (or 60fps if slow-motion needed)
6. Review for temporal consistency — faces staying mannequin-smooth, no drift into realism

**Motion prompt examples:**
- "Slow forward dolly through the cleanroom, workers moving deliberately in background"
- "Camera pans left to right revealing rows of equipment, figure walks across frame"
- "Static wide shot, subtle camera drift, machinery operating in background"

**Sora 2 storyboard workflow (for multi-shot sequences):**
1. Define 3-5 keyframes describing the same space from different angles
2. Upload reference frame as style anchor
3. Generate the full sequence — Sora handles transitions
4. Split the output into individual clips for the NLE timeline

### Step 4: Post-Video Treatment

Raw AI-generated clips need a multi-stage treatment pass before assembly. The AI output is *too clean* — modern generative video has zero grain, no film texture, no spatial noise — which actively fights the constructivist editorial register, a tradition that lives on offset-printed paper (Fortune, Push Pin, Saul Bass) with inherent surface noise. The post-video stack also handles palette unification, temporal stabilization, and resolution upscaling.

Stages run in sequence: LUT → texture/grain → (optional) frame interpolation → upscaling. Skip stages 4c and 4e by default; include 4a, 4b, 4d on every production clip.

#### 4a. LUT + grain + vignette — `tools/brand-treatment/treat_video.py`

The same brand-treatment tool that processes footage handles AI-gen output. The tool's default mode applies four steps in sequence: desaturate → duotone (per LUT) → grain → vignette. Apply one of three brand LUTs based on the scene's treatment band:

- `standard` — warm umber shadows → amber highlights. Default for present-day reconstructions.
- `conflict` — ink shadows → rust highlights. For adversarial moments (military, sanctions, contested).
- `editorial` — desaturated, bone tones. For historical reconstructions (pre-1980s, archival feel).

The constructivist preamble already lands source clips in the warm-umber palette, so the LUT does final 10% polish rather than 60% color rescue. Per VIS-10, atmospheric register + editorial treatment is forbidden.

```bash
python tools/brand-treatment/treat_video.py raw/ep01/beat2_fab.mp4 \
    -r standard \
    -o treated/ep01/
```

#### 4b. Why grain matters specifically for AI-gen

The grain and vignette steps in `treat_video.py` are non-optional for AI-gen, even though they're sometimes skipped on footage when an NLE is doing it manually. AI video output is forensically clean — no grain, no gate weave, no surface texture — which actively *fights* the channel's editorial-magazine register because the constructivist tradition lives on offset-printed paper with inherent noise, not on pristine digital surfaces. A clean AI clip with the LUT applied but no grain still reads as "generative AI." A clean AI clip with the LUT plus grain reads as "printed editorial page in motion."

Tunable consideration: footage default grain is 8-12%; for AI-gen, **err toward the lighter end of that range (~6-8%)**. The constructivist style is already a strong visual signal, and stacking heavy grain on top of strong graphic flatness can muddy the color blocks. Optionally extend `treat_video.py` with an `--ai-gen` preset that locks lighter grain + slightly tighter vignette as a per-source-type tunable.

If a clip is going through the NLE for finer control, use `--lut-only-treatment` and apply DaVinci Resolve's "Film Grain" effect (intensity ~5-7) at assembly time. Same effect, different surface — pick the path that matches whether you're batching or hand-tuning.

#### 4c. Frame interpolation / temporal stabilization — case-by-case

AI video at 24fps can have subtle "boiling" — color blocks shimmering at their edges as the model regenerates content frame-to-frame. Two paths to mitigate:

- **Frame interpolation to 60fps** via **RIFE** (free, open-source). RIFE smooths motion enough to mask boiling without softening the geometry. GUI wrappers (FlowFrames) make this a one-command operation. Best for clips with visible boiling on hard edges.
- **Temporal denoising** via DaVinci Resolve's built-in temporal denoiser, or Neat Video (standalone, paid). Locks color blocks without softening edges. Best when motion is already smooth but edges shimmer.

This stage is **case-by-case, not mandatory**. Run it only if visible boiling fails the QA bar. Render-qa should flag clips where edge stability is suspect; if flagged, run interpolation or denoising. Pika 2.5 outputs in initial 480p testing have not shown significant boiling, but compression at 480p partly masks the issue — re-evaluate after the first 1080p production runs.

#### 4d. Upscaling — required for production output

Free-tier Pika output is 480p. Production deliverables target 1080p minimum (4K is future-proof and gives recrop flexibility for Shorts). Upscaler recommendations:

- **Topaz Video AI** ($299 one-time, paid). Use the **Artemis** or **Iris** models for stylized content — these preserve hard edges better than the photo-tuned alternatives. Best quality for the channel's flat illustration aesthetic.
- **Real-ESRGAN-Video** (free, open-source). Slightly less crisp on flat color blocks but adequate for non-hero shots.

**Upscaler model choice matters:** photo-portrait upscaling models (Topaz's "Proteus" or its face-enhance variants) will actively re-render planar faces toward photorealism — they assume the input *should* look like a photograph. Use illustration-aware models exclusively. Test once on a single r12 clip before committing to a model preset.

Stage ordering: do upscale AFTER LUT and grain. The LUT applies at native resolution where dynamic range is correct, and grain is added at the upscaled resolution where it can be controlled at the right pixel scale.

#### 4e. (Deferred) Re-stylization pass — last-resort fix

If post-treatment clips show photoreal creep that survived the original I2V generation, a second pass through a stylization-tuned model (Veo 3.1, or img2img through Flux 2 with the constructivist preamble applied per-frame) can push output back toward planar discipline.

This is a **last-resort fix, not a routine stage**. Most clips should land in the right register from the I2V step. If a clip needs re-stylization to look on-brand, the source reference image was probably too soft and should be regenerated instead. Document the failure in render-qa output so the upstream issue gets fixed rather than masked.

---

### Effects to Avoid

The post-video stack is deliberately minimal. The following are aesthetically tempting but break Parallax's analytical-rhetorical positioning:

| Effect | Why it's wrong for Parallax |
|---|---|
| Glitch / RGB split / datamoshing | Reads as "vaporwave video essayist" — wrong genre |
| Heavy motion blur | Fights flat 2D, signals 3D simulation |
| Lens flares, light leaks | Too cinematic / Instagram, breaks editorial-magazine register |
| Particle effects, dust, atmospheric overlays | Signals "this is digital video" not "printed page in motion" |
| Heavy parallax / 2.5D depth | Fights flat illustration discipline |
| Aggressive color grading on top of LUT | Breaks per-emphasis palette discipline (palette.json + EMPHASIS_MAP) |
| Speed ramps, whip pans, hard zooms | Effect-driven momentum mismatches the proportional pacing system |
| AI face-enhance / detail upscale | Reintroduces photorealism that planar-face discipline exists to prevent |

The post-treatment philosophy: **make the AI-gen feel like a printed editorial page that happens to be in motion**, not like a video with effects. LUT + grain + temporal stability achieves this. Anything more elaborate fights the channel.

---

### Adam Curtis Precedent

Curtis's post-treatment grammar is mostly *restraint*, which fits Parallax exactly. Worth borrowing where applicable — note these are edit-time, not stage-4 effects:

- **Hard cuts** without transitions (formalized as Class A within-pillar transitions in BRAND.md)
- **Generous holds** — letting a frame breathe 3-5 seconds while narration lands
- **Match cuts** between pillars (Class C source-character-gap transitions)
- **Brand-mark wipes** — using ∴ as a structural transition element, not a digital effect
- **Period-appropriate degradation** — slight tape-style noise, gate weave on Cold War footage. **For footage only, not AI-gen.** AI-gen already gets the constructivist editorial signal from the planar treatment; adding period-degradation on top reads as costume.

### Step 5: Assembly

Treated clips drop into the NLE timeline identically to stock footage. From DaVinci/Premiere's perspective, they're just MP4 files on the timeline.

In the assembly manifest, AI-GEN segments use the same schema as FOOTAGE:
```json
{
  "type": "footage",
  "subtype": "ai-generated",
  "source": "kling-3.0 | seedance-2.0 | sora-2 | runway-gen4",
  "file": "ep01_beat2_fab_walkthrough_treated.mp4",
  "start": 0,
  "duration": 7.2,
  "treatment": "standard"
}
```

---

## Prompting Patterns by Use Case

### Unsourceable Spaces

Facilities, interiors, and environments that exist but can't be filmed.

| Scene Type | Prompt Approach | Camera |
|---|---|---|
| Semiconductor cleanroom | Yellow lithography light, bunny suits, wafer handlers, extreme cleanliness | Slow dolly forward, shallow DoF |
| Military command center | Dim blue screen light, uniforms, radar displays, focused figures | Handheld subtle drift, over-shoulder |
| Government situation room | Wood paneling, long table, suits, documents, tension | Static wide, slow push-in |
| Data center interior | Blue/green LED rows, server racks, cable management, cold | Tracking shot along aisle |
| Classified research lab | White coats, equipment, specimen trays, institutional light | Medium shot, rack focus |

### Historical Reconstructions

Events that happened but weren't captured (or footage doesn't survive).

| Scene Type | Prompt Approach | Camera |
|---|---|---|
| Pre-camera historical events | Period-appropriate clothing, architecture, objects. "Editorial" color tone. | Static or slow pan, archival feel |
| Closed-door meetings | Appropriate room, era-correct furnishings, seated figures | Wide establishing, then medium |
| Industrial/development montage | Construction, early-stage factories, workers, period vehicles | Multiple quick cuts, documentary |
| Cold War-era facilities | 1960s-70s equipment aesthetic, institutional green/gray | Slightly degraded, steady |

**Key rule for historical:** Push the color treatment toward "editorial" (desaturated, bone tones) to signal "this is a reconstruction, not footage." The LUT does this automatically with `--treatment editorial`.

### Conceptual Scenes

Abstract ideas made physical — the most unique capability of AI-GEN for Parallax.

| Concept | Visualization | Camera |
|---|---|---|
| Supply chain fragility | Physical corridor with glass walls/floor, showing cracks | Slow dolly, walls cracking as camera passes |
| Technology denial / sanctions | Locked doors, sealed shipping containers, barricades | Tracking shot, figure approaches closed barrier |
| Economic integration | Buildings/infrastructure physically merging, shared foundations | Aerial pull-back revealing connections |
| Bifurcation of standards | Road/corridor physically splitting into two paths | Following shot, path diverges ahead |
| Innovation race | Parallel workshops, different approaches to same problem | Split-screen or alternating angles |

**Key rule for conceptual:** These are visual metaphors. They should be immediately readable as "this represents an idea" — the mannequin faces help signal this. Keep the environment realistic but the *situation* slightly surreal.

### Scenario Sequences

"What if" futures and counterfactual moments.

| Scenario | Visualization | Camera |
|---|---|---|
| Future disruption | Modern facility going dark, equipment powering down | Slow, ominous, lights cutting out |
| Alternative history | Period environment with one anachronistic element | Static, the "wrong" element draws focus |
| Escalation | Same space progressively more militarized/restricted | Jump cuts, same angle, mounting tension |
| Resolution/cooperation | Shared facility, mixed insignia, collaborative posture | Wide, warm light, stability |

---

## Editorial Guardrails

### Disclosure

Every Parallax video using AI-generated footage includes a disclosure. Two levels:

1. **Video description (always):** "Some sequences in this video use AI-generated visualization to illustrate environments not accessible to cameras."
2. **On-screen indicator (for extended AI-GEN sequences >10s):** A subtle "∴ Visualized" watermark in the lower corner during AI-GEN segments. Uses the existing ∴ brand mark. Small, unobtrusive, but present.

### What AI-GEN Is Never Used For

- **Named real individuals.** Never generate footage purporting to show Xi Jinping, Morris Chang, Jake Sullivan, etc. — even with stylized faces. Named people get archival photos/footage only.
- **Specific claimed events.** Never present AI footage as depicting a real event that occurred ("This is what the meeting looked like"). Frame as "what a space like this looks like" not "what happened here."
- **Evidence for claims.** AI footage supports the narrative visually — it doesn't constitute evidence for factual claims. The narration carries the truth claims; the visuals illustrate.
- **Misleading context.** Don't use AI footage of military hardware in a way that implies a specific real military operation. Generic/illustrative only.

### The Planar Face Rule (replaces the prior Mannequin Rule)

The simplified planar face is a non-negotiable element of the Parallax AI-GEN aesthetic post-May 4, 2026. Faces in grounded scenes are rendered with geometric facets (jaw planes, cheekbone planes), eyes obscured by lens shadow / hat brim / visor reflection / hair fall, and no realistic detail. This serves three purposes:

- **An honesty signal** — the viewer immediately knows this is editorial illustration, not documentary footage
- **Depersonalization through stylization** — figures read as roles (The Engineer, The Operator) rather than individuals, without the uncanny smoothness of the prior mannequin convention
- **A quality safeguard** — graphic faces are something AI handles reliably; realistic faces are the failure mode. The constructivist aesthetic plays to AI's strengths.

If a clip comes out with faces that drift toward photorealism (visible eye detail, realistic skin texture, identifiable individual features), it gets re-generated. The planar face is a feature, not a limitation. The aesthetic was specifically validated on the intimate-domestic test case (Beijing apartment, May 4, 2026) where the planar facets + lens-shadow-eyes combination demonstrated the depersonalization signal holds at conversational human scale.

### Frequency Budget

AI-GEN should not dominate the visual mix. Target allocation per episode:

| Visual Mode | Target % of Runtime |
|---|---|
| Footage (stock + archival) | 40-50% |
| Motion Graphics (Remotion) | 30-40% |
| Layered (footage + MG) | 5-10% |
| AI-Generated | 10-20% |

This means roughly 60-120 seconds of AI-GEN per 13-minute episode. Typically 8-15 clips of 5-10 seconds each.

**Pacing rule:** Never more than 2 consecutive AI-GEN clips without a mode switch. The viewer should experience AI-GEN as punctuation — immersive moments that pull them into an inaccessible space — not as the default texture.

---

## Cost Model

### Per-Episode Budget (13 minutes, ~90 seconds AI-GEN)

| Item | Tool | Cost |
|---|---|---|
| Reference frames (10-15) | Flux 2 Pro (~$0.045/image at 1920×1080) | ~$0.50-0.70/episode |
| Video clips (10-15 × 5-8s) | Kling 3.0 Pro ($37/month) | ~$6-8/episode |
| Budget clips (optional) | Seedance 2.0 Fast ($0.022/sec) | ~$1.50-2.50/episode (if used) |
| Multi-shot sequences (2-3) | Sora 2 (ChatGPT Pro $200/month) | $0 incremental |
| Quick draft iterations | GPT Image 2 (ChatGPT Pro) | $0 incremental |
| Brand treatment | treat_video.py (local) | $0 |
| **Total incremental per episode** | | **~$7-9** |

### Monthly Subscription Stack

| Service | Cost | What It Covers |
|---|---|---|
| Kling 3.0 Pro | $37/month | ~50 videos/month (3,000 credits) — primary video generator |
| ChatGPT Pro (includes Sora 2 + GPT Image 2) | $200/month | Sora storyboards + Director Mode + image iteration + all ChatGPT use |
| Flux 2 Pro via fal.ai (pay-per-image) | ~$1-2/month | Reference frames at ~$0.045/image at 1920×1080 — no subscription needed |
| Seedance 2.0 (pay-per-second) | ~$3-5/month | Budget video clips at $0.022/sec — use when Kling credits run low |
| **Total** | **~$240/month** | Covers all AI-GEN needs + other production use |

**Cost reduction vs. previous spec:** Dropping the Midjourney subscription ($30/month) and replacing with pay-per-image Flux 2 Pro saves ~$28/month while improving photorealistic quality for reference frames. Midjourney v8 ($30/month) remains optional for thumbnail concepts and cases where artistic mood matters more than material accuracy.

**The true incremental cost** of adding AI-GEN as a visual mode: ChatGPT Pro is already in the stack. The only new costs are Kling 3.0 Pro ($37/month) + negligible Flux 2 API usage (~$1-2/month). Total: **~$38-39/month incremental.**

---

## Style Library (To Build)

A persistent set of reference images that define the "Parallax AI-GEN look." Generated once, reused as style anchors across episodes.

### Required References (build before first AI-GEN episode)

Updated May 4, 2026 to reflect the constructivist aesthetic. Each reference locks a specific aspect of the visual language: realism dosage, scale, typography integration, register role.

1. **Constructivist face study (close-up)** — the exact level of facial planar simplification (geometric facets, eyes obscured by lens shadow or visor reflection, no realistic detail). Analogous to the prior mannequin-face reference but in the new constructivist vocabulary.
2. **Flat industrial scene (monumentalist)** — propaganda-poster cleanroom or factory at `realism: flat` dosage. Locks the maximum-graphic-flatness aesthetic. Image-4-style cleanroom is the canonical example.
3. **Grounded industrial scene** — same subject as #2 but at `realism: grounded` dosage with photographic spatial detail. Demonstrates the aesthetic's range.
4. **Atmospheric backdrop** — Register 2 atmospheric illustration (factory complex, supply chain network, or system metaphor) at low-opacity background usage. Locks the Register 2 background language.
5. **Intimate domestic scene** — eye-level, restrained scale, period detail. Beijing apartment is the canonical example. Locks the constructivist aesthetic at conversational human scale.
6. **Historical reconstruction** — pre-1980s setting (1941 Oval Office, Cold War situation room, or similar) with editorial-LUT-ready palette. Locks the historical-grounding mode.
7. **Conceptual metaphor** — abstract idea made physical (corridor splitting, system collapsing, network closing). Locks the metaphor mode for both atmospheric and grounded usage.

Each reference should be generated at multiple typography treatments (`none`, `chinese_propaganda`, `russian_constructivist`, `english_modernist`) so the typography parameter's effect on the same scene is documented.

### Naming Convention

```
style-ref_[category]_[description]_v[version].png

Examples:
style-ref_face_mannequin-neutral_v1.png
style-ref_interior_cleanroom-warm_v1.png
style-ref_figure_suit-walking_v1.png
style-ref_concept_corridor-splitting_v1.png
```

Store in: `tools/ai-video/style-references/`

---

## Integration Points

### Skills That Need to Know About AI-GEN

| Skill | How It Uses AI-GEN |
|---|---|
| **visual-spec** | Generates AI video briefs (prompt + camera + duration) for `[AI-GEN:]` segments instead of Remotion JSON |
| **visual-concept** | Evaluates AI-GEN feasibility — can this scene actually be generated well? |
| **script-audit** | Checks that AI-GEN isn't overused (frequency budget) and complies with editorial guardrails |
| **source-feedback** | After generation, flags clips that didn't meet quality bar and suggests alternatives |
| **render-qa** | Verifies AI-GEN clips at each post-video stage — planar faces held, LUT applied, grain non-destructive, no boiling on hard edges, upscale didn't reintroduce photorealism. Flags clips that would benefit from optional 4c stabilization. |
| **assembly manifest** | Treats AI-GEN clips as footage subtype in the manifest schema |

### File System Additions

```
tools/
└── ai-video/
    ├── style-references/     # Persistent style anchor images
    ├── briefs/               # Per-episode generation briefs (from visual-spec)
    │   └── ep01/
    │       ├── beat2_fab_walkthrough.json
    │       └── beat4_historical_embargo.json
    ├── raw/                  # I2V output from Pika/Kling/Sora — pre-treatment
    │   └── ep01/
    ├── processed/            # Intermediate post-video stages (kept for QA / debugging)
    │   └── ep01/
    │       ├── lut/          # 4a — after LUT pass
    │       ├── textured/     # 4b — after grain/weave pass
    │       ├── stable/       # 4c — after RIFE / denoise (only if applied)
    │       └── upscaled/     # 4d — after Topaz / Real-ESRGAN
    └── treated/              # Final post-treatment output ready for NLE assembly
        └── ep01/
```

The intermediate `processed/` tier is optional — single-pass pipelines can write directly to `treated/`. Keep the staged outputs when render-qa is iterating on a clip or when debugging which stage introduced an issue (e.g., did the grain pass push edges soft, or did the upscaler do it?).

### Assembly Manifest Schema Addition

Add to `data/assembly-manifest.schema.json`:
```json
{
  "type": "footage",
  "subtype": "ai-generated",
  "source": "kling-3.0 | seedance-2.0 | sora-2 | runway-gen4",
  "reference_frame": "style-ref_interior_cleanroom-warm_v1.png",
  "generation_prompt": "...",
  "file": "ep01_beat2_fab_walkthrough_treated.mp4",
  "start": 0,
  "duration": 7.2,
  "treatment": "standard | conflict | editorial"
}
```

---

## EP01 Candidates for AI-GEN

Looking at the current script-v4-production.md and shot-list.json, these segments are prime candidates for AI-GEN (currently tagged as FOOTAGE but sourcing difficulty is high):

| Beat | Current Spec | AI-GEN Opportunity |
|---|---|---|
| Beat 2: TSMC cleanroom | Generic cleanroom stock footage | AI-GEN: specific advanced node cleanroom walkthrough |
| Beat 2: EUV machine operation | ASML press photos | AI-GEN: interior view of lithography process (conceptual) |
| Beat 4: 1941 export embargo signing | Archival (hard to source) | AI-GEN: period reconstruction with editorial LUT |
| Beat 5: SMIC facility interior | No footage exists publicly | AI-GEN: Chinese semiconductor facility (stylized) |
| Beat 6: "Bifurcation" corridor | MG (FrameworkDiagram) | AI-GEN: physical corridor splitting into two paths |
| Beat 7: Future scenario | No footage possible | AI-GEN: next-gen facility powering up/going dark |

These would replace 6 segments currently using either hard-to-source footage or MG stand-ins, adding ~40-50 seconds of AI-GEN content to the episode.

---

## Iteration Plan

### Phase 1: Style Lock (before EP01 records)
- Generate style reference library (7 images)
- Test 3-4 clips through full pipeline (generate → treat → review)
- Confirm mannequin-face aesthetic reads correctly at YouTube resolution
- Verify LUT pass produces consistent Meridian look on AI-generated source

### Phase 2: EP01 Integration
- Generate 6 candidate segments from the table above
- A/B compare against current footage/MG alternatives in the script
- Tiger reviews: does AI-GEN enhance or distract?
- Final call on which segments use AI-GEN vs. original plan

### Phase 3: Pipeline Automation (EP02+)
- visual-spec skill outputs AI video briefs automatically
- Standardize prompting patterns per use case
- Build quality rubric for render-qa to evaluate AI-GEN clips
- Track viewer retention on AI-GEN segments via publish-retro

---

## Open Questions

1. **Planar face specificity:** How much geometric facet vs. how much smooth-plane suggestion? The Beijing-apartment reference (lens-shadow obscured eyes, jaw-plane facets) sets a target, but the parameter space is large. Worth testing variants on the same subject to see what reads as "intentionally constructivist" vs. "broken AI."
2. **Audio sync:** Some AI tools (Veo 3.1, Kling 3.0) can generate synchronized audio. Do we want ambient sound from AI-GEN clips, or always replace with designed audio in post?
3. **Animation of constructivist illustrations:** Kling/Sora/Runway are all calibrated for photoreal source frames. Animating constructivist illustration as the source produces a different challenge — the model has to preserve graphic flatness through motion rather than drift toward photorealism. Worth testing during Phase 1.
4. **Viewer perception study:** After EP01 launches, should we test audience response to AI-GEN segments specifically? (Retention data from publish-retro will show if viewers drop off during these moments. The register-level analytics added May 4 will surface whether constructivist outperforms the prior mannequin convention would have.)
5. **Shorts adaptation:** Do AI-GEN clips work in 9:16? The constructivist aesthetic translates better to phone viewing than the mannequin convention did — graphic flatness is more legible at small scale than photorealism. But worth verifying.
6. **Typography accuracy at scale:** As the channel ships more episodes covering more regions, the typography accuracy bar gets harder. Tiger's bilingual fluency is the quality gate for Chinese; for Russian/Japanese/other languages, what's the verification process? Native-speaker review per episode? Curated phrase library?
7. **Scaling the style library:** As episodes span different time periods and geographies, the style reference library grows. At what point do we need "era-specific" or "region-specific" sub-libraries?
