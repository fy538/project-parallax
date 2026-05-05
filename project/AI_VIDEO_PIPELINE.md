# Parallax — AI-Generated Video Pipeline

## What this document is

The production specification for AI-generated video content in Parallax episodes. Covers the aesthetic philosophy, tool selection, generation workflow, prompting patterns, brand treatment integration, and editorial guardrails.

AI-generated video is the **fourth visual mode** (`[AI-GEN:]`), sitting between footage and motion graphics on the concreteness spectrum. It visualizes things that are physically real but unsourceable — restricted facilities, historical moments without cameras, conceptual spaces made literal.

Created: May 2, 2026
Updated: May 4, 2026 — Cross-linked to three-register visual system and prompt preamble layer.

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

## The Aesthetic: Stylized Realism

### Philosophy

Parallax AI-generated video occupies a deliberate visual register: **environments and materials are realistic; human figures are stylized with anonymous/mannequin faces.** This isn't a compromise with current AI limitations — it's an editorial choice that signals to the viewer: "this is a visualization of something real but inaccessible, not documentary footage."

The stylized face serves the same function as The Economist's red-and-white illustrations or Kurzgesagt's simplified characters: it's an honesty marker that says "editorial illustration, not evidence." This aligns with Parallax's epistemic stance — we present analytical lenses, not claims of objective truth.

### Visual Parameters

**Environments (realistic):**
- Architectural spaces rendered with accurate lighting, materials, reflections
- Industrial/technological environments with correct equipment proportions
- Natural lighting preferred (global illumination, bounce light, soft shadows)
- Period-appropriate details for historical reconstructions
- Camera work mimics documentary cinematography (handheld subtle drift, rack focus, slow dolly)

**Human figures (stylized):**
- Clothing, gear, and body proportions are realistic and period/context-appropriate
- Faces are deliberately featureless — smooth mannequin-like surfaces, no attempt at realistic facial features
- Skin tone and body type should still convey demographic diversity where relevant
- Figures move naturally (walking, gesturing, operating equipment) — motion is realistic, only the face is abstracted
- Hair can be present but simplified — suggests the style without strand-level detail

**The line:** Environments tell the viewer "this place is real." Faces tell the viewer "this person is a stand-in." Both are true — the semiconductor fab exists, but we're not claiming to show you who works there.

### Color and Mood

All AI-generated clips pass through the same `treat_video.py` brand treatment as stock footage:
- Standard LUT (warm umber shadows → amber highlights) for most content
- Conflict LUT (ink shadows → rust highlights) for tension/adversarial moments
- Editorial LUT (desaturated, folder-to-bone tones) for historical/archival feel

Pre-generation, prompts should target a neutral color grade — slightly desaturated, natural lighting — so the LUT pass brings it into Meridian palette cleanly. Avoid generating footage that's already heavily graded (no teal-and-orange, no extreme contrast) since the LUT will fight it.

---

## Tool Selection (May 2026)

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

For each AI-GEN segment, generate a reference frame using Flux 2 Pro (or GPT Image 2 for quick drafts). For lower-stakes shots or rapid iteration, `recraft.py --register grounding` (which uses Recraft's `realistic_image` style) is also viable and applies the canonical Grounding preamble automatically — see PROMPT_PREAMBLES.md. Flux 2 Pro remains preferred for hero P1 reference frames where photorealism quality is critical.

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

### Step 4: Brand Treatment

Run generated clips through the same treatment pipeline as stock footage:

```bash
python treat_video.py --input [clip.mp4] --treatment standard --output [treated_clip.mp4]
```

The three treatment options:
- `standard` — warm umber shadows → amber highlights. Default for most AI-GEN content.
- `conflict` — ink shadows → rust highlights. For adversarial/tension content (military standoffs, sanctions enforcement).
- `editorial` — desaturated, bone/folder tones. For historical reconstructions (pre-1980s events, archival feel).

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

### The Mannequin Rule

The stylized face is a non-negotiable element of the Parallax AI-GEN aesthetic. It serves as both:
- **An honesty signal** — the viewer immediately knows this isn't documentary footage
- **A quality safeguard** — removing faces from the generation task means the AI excels at everything else (environment, lighting, clothing, motion)

If a clip comes out with faces that look too realistic, it gets re-generated or blurred in post. The mannequin face is a feature, not a limitation.

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

1. **Mannequin face close-up** — the exact level of stylization (smooth surface, slight suggestion of eye sockets but no pupils/iris, nose as gentle ridge, no mouth detail)
2. **Industrial interior (warm)** — semiconductor-adjacent space, warm overhead lighting, ready for standard LUT
3. **Industrial interior (cool)** — military/tech space, blue-screen ambient, ready for conflict LUT
4. **Historical interior** — mid-20th century government/institutional space, ready for editorial LUT
5. **Figure in motion** — full body, mannequin face, realistic professional clothing, natural walking pose
6. **Aerial/wide environment** — urban development or industrial campus, showing environmental detail level target
7. **Conceptual corridor** — the "physical metaphor" style for abstract concepts

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
| **render-qa** | Verifies AI-GEN clips before assembly (mannequin faces held, no drift, LUT applied) |
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
    ├── raw/                  # Generated clips before treatment
    │   └── ep01/
    └── treated/              # After treat_video.py pass
        └── ep01/
```

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

1. **Mannequin face specificity:** How stylized? Full smooth sphere vs. subtle facial structure with no features? Need to test both and see what reads as "intentional" vs. "broken AI."
2. **Audio sync:** Some AI tools (Veo 3.1, Kling 3.0) can generate synchronized audio. Do we want ambient sound from AI-GEN clips, or always replace with designed audio in post?
3. **Viewer perception study:** After EP01 launches, should we test audience response to AI-GEN segments specifically? (Retention data from publish-retro will show if viewers drop off during these moments.)
4. **Shorts adaptation:** Do AI-GEN clips work in 9:16? The mannequin aesthetic might be more jarring at phone viewing distance.
5. **Scaling the style library:** As episodes span different time periods and geographies, the style reference library grows. At what point do we need "era-specific" or "region-specific" sub-libraries?
