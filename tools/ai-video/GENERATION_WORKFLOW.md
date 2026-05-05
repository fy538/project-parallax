# Parallax — AI Image/Video Generation Workflow

> Created: May 4, 2026
> Companion to: tools/ai-video/PROMPT_SYSTEM.md (prompt-engineering specifics)
> Related: AI_VIDEO_PIPELINE.md (aesthetic spec), PROMPT_PREAMBLES.md (preamble architecture), TYPOGRAPHY_TRADITIONS.md (per-scene typography), tools/ai-video/style-references/PROMPTS.md (canonical reference library)

## What this document is

The operational guide for using AI image and video generation tools in Parallax production. Covers *how to drive the tools through the production pipeline* — reference-first discipline, tool-to-use-case mapping, multi-shot consistency techniques, cost optimization, and failure-mode recovery. Where PROMPT_SYSTEM.md is about *what to write in the prompt*, this doc is about *how to run the production cycle*.

Read this before running EP01's first AI-GEN sequence. Re-consult when adding a new tool to the stack, when running multi-shot sequences, or when troubleshooting unexpected output.

## Core operating principle: reference frames are the most leveraged asset

Every production decision in the AI-GEN pipeline cascades from one upstream artifact: the reference frame. A reference frame that lands clean produces a video clip that lands clean. A reference frame with a problem produces seven seconds of magnified problem at high cost to fix. The single most important workflow discipline is **iterate aggressively on the reference frame, then commit to video only after validation**.

The economics make this stark. Reference frame generation through Recraft V3 costs ~$0.04 per image; through Flux 2 Pro ~$0.045. Video generation through Kling 3.0 costs ~$0.50-1.00 per clip; through Sora 2 ~$0 incremental (within ChatGPT Pro) but limited generation budget. Iterating 6 times on a reference frame costs $0.25; one bad video re-generation costs $0.50-1.00. The arithmetic always favors reference iteration.

The discipline: generate 4-6 reference frame variations, pick the strongest, run it through `treat.py` to validate the LUT pass, iterate the prompt if the LUT fights the reference, only then send to video generation.

## Tool-to-use-case mapping

Different tools excel at different production needs. Match the tool to the job rather than defaulting to one.

### Stills (reference frames and stills-only assets)

**Recraft V3 — primary tool post-May 4 migration.** Native vector_illustration and digital_illustration styles, calibrated for graphic illustration. Strongest at the constructivist aesthetic the channel uses for both Register 2 (atmospheric backdrops) and Register 3 (grounded scenes). Style ID system locks visual conditioning across multiple generations. Cost ~$0.04/image. Use as default for ~90% of stills.

**Flux 2 Pro — secondary, used for `realism: grounded` only.** Photorealism strength makes it the right choice for the rare grounded-realism reconstruction stills (restricted-facility interiors that need photographic spatial detail). Pay-per-image (~$0.045 at 1920×1080 via fal.ai). Iterating in Flux is cheap; subscription unnecessary.

**GPT Image 2 — drafting tool only.** Free with ChatGPT Pro. Use for fast compositional iteration before committing to a final Recraft or Flux generation. Known limitation: tends to scoop faces inward when prompted for featureless surfaces — finalize in Recraft (constructivist) or Flux (photoreal) for production references.

### Video (animated clips)

**Kling 3.0 — primary tool for environment-driven scenes.** Native 4K output, smooth camera moves, strong with architecture and industrial environments. "Bind Subject" treats reference frames as 3D anchors for multi-shot consistency. Image-to-video mode is the canonical workflow: reference frame → motion prompt → 5-8 second clip. Cost ~$0.50/clip on Pro plan ($37/month).

**Sora 2 — multi-shot sequences.** Director Mode lets you re-shoot the same scene from different camera angles using the same reference. Storyboard mode accepts up to 5 keyframes with auto-interpolated transitions. Best when a beat needs wide-establish → medium → detail shots of the same space. Included with ChatGPT Pro ($200/month) — no incremental per-clip cost if subscription already exists.

**Runway Gen-4 — character consistency.** 95% identity lock from a single reference image. For Parallax this matters less than it used to (depersonalized constructivist figures don't carry specific identity), but if a recurring figure needs to read as the same person across multiple shots, Runway is the right tool. Mid-tier pricing.

**Seedance 2.0 — budget tier.** $0.022/sec on Fast tier (~5x cheaper than Kling). Up to 12 file inputs for consistency anchoring across multi-shot sequences. Native audio sync. Use for P3 ambient/supporting clips where Kling is overkill — establishing shots, atmospheric backgrounds, transition moments.

### Tool selection decision tree

```
Is this a still or a video clip?
├─ Still
│  ├─ Constructivist aesthetic (default)? → Recraft V3
│  ├─ Photoreal needed (realism: grounded only)? → Flux 2 Pro
│  └─ Quick draft/iteration before committing? → GPT Image 2
└─ Video clip
   ├─ Single-shot, environment-driven, P1/P2? → Kling 3.0
   ├─ Multi-angle of same scene, P1? → Sora 2 Director Mode
   ├─ Multi-keyframe sequence with explicit timing? → Sora 2 Storyboard
   ├─ Same figure across multiple shots? → Runway Gen-4
   └─ P3 ambient/supporting, cost-sensitive? → Seedance 2.0
```

## Reference image support per tool

Every tool in the stack supports reference images, with different specifics. Understanding what each tool's reference system actually does is what makes the workflow efficient.

| Tool | Reference Mode | What It Does | Best For |
|------|---------------|--------------|----------|
| Recraft V3 | `style_id` | Locks visual conditioning across generations. Generate one canonical reference, capture the style ID, pass to all subsequent calls. | Maintaining constructivist consistency across all Register 2/3 stills in an episode |
| Recraft V3 | `image_to_image` | Direct conditioning on a source image. New generation starts from the reference. | Iterating on a specific composition while preserving brand language |
| Flux 2 Pro | `image-to-image` | Use reference as starting point for img2img. Strength controls how much the reference dominates. | Iterating on a near-final reference frame, refining specific details |
| Kling 3.0 | image-to-video + Bind Subject | Reference frame becomes the 3D anchor for the animated clip. Bind Subject extends this anchor across multiple shots in a session. | Single-shot generation; multi-shot fab/facility consistency |
| Sora 2 | Director Mode | Same scene anchor, multiple camera angles. Sora preserves spatial coherence across angles. | "Wide → medium → detail" of the same space |
| Sora 2 | Storyboard | Up to 5 reference keyframes with auto-interpolated transitions between them. | Multi-keyframe sequences with explicit timing control |
| Runway Gen-4 | Reference | 95% character identity lock from a single image. Style reference system separately transfers visual aesthetic across generations. | Same figure across multiple clips; channel-wide style consistency |
| Seedance 2.0 | Multi-input (up to 12) | Anchor on up to 12 reference images simultaneously for consistency across long sequences. | Long narrative sequences where consistency would otherwise drift |

The pattern: for stills, use Recraft's style_id system to lock the canonical aesthetic and then style-transfer it across every generation in the episode. For video, use the most reference-rich mode each tool offers — image-to-video for Kling, Director/Storyboard for Sora, Reference for Runway, multi-input for Seedance.

## End-to-end workflow

For every AI-GEN segment in a shot list, the production cycle goes:

### 1. Visual-spec emits the brief

The visual-spec skill reads the script's `[AI-GEN:]` entries and produces a structured brief at `tools/ai-video/briefs/epXX/<slug>.json`. The brief specifies register, realism, text_treatment, camera direction, treatment ramp, duration target, generation tool, and quality gate criteria. This is the contract — every downstream step references it.

### 2. Generate reference frame

For constructivist scenes (90% of cases): `python tools/recraft/recraft.py generate "scene description" --register grounding --realism flat --text-treatment chinese_propaganda -o reference.svg` (adapting register / realism / text_treatment to the brief).

For photoreal grounded-realism stills (rare): `python tools/ai-video/generate_style_refs.py --ref <name> --prompt "scene description"` (uses Flux 2 Pro).

Generate 4-6 variations of the same prompt — Recraft is non-deterministic enough that small variations produce meaningfully different outputs. Pick the strongest. If none lands, iterate the prompt.

### 3. Validate the reference frame before animating

Run the chosen reference through `treat.py` with the brief's treatment ramp:

```
python tools/brand-treatment/treat.py reference.png --ramp standard -o reference_treated.png
```

If the LUT pass produces clean Meridian-palette output, the reference is ready. If the LUT fights the source (cross-talk in shadows, clipped highlights, palette mush), the reference's underlying generation is too far off-brand — iterate the prompt and regenerate. Going to video generation with a reference the LUT can't land is throwing money away.

Visual checks at this step:
- Constructivist DNA present (color-blocked forms, restricted palette, no soft shading)
- Faces are planar (4-5 color-blocked planes, no continuous skin tonality)
- Typography parses correctly in its source language (Tiger verifies Chinese; for Russian/Japanese, native review or fall back to minimal/none)
- Treatment-pairing follows VIS-10 (no atmospheric+editorial)

### 4. Generate the video clip

Pass the validated reference to the chosen video tool with the brief's camera direction as the motion prompt.

For Kling 3.0:
- Upload reference frame as source image
- Enable Bind Subject if other shots in this episode use the same reference
- Write motion prompt translating the brief's `camera.movement` field
- Set duration (5-8 seconds typical)
- Generate at 4K, 30fps (60fps if slow-motion source needed)

For Sora 2 Director Mode (multi-angle of same scene):
- Define 3-5 keyframes describing the same space from different angles
- Upload reference frame as style anchor
- Generate the sequence; Sora handles transitions
- Split output into individual clips for the NLE timeline

For Runway Gen-4 (recurring character):
- Upload character reference frame; capture identity lock
- Generate each shot using the locked identity
- Use the Style Reference system to also lock visual aesthetic across all shots

For Seedance 2.0 (budget/long sequences):
- Upload up to 12 anchor images
- Generate the sequence with native audio if useful
- Strong narrative coherence across long takes

### 5. Brand treatment

Every clip — Kling, Sora, Runway, Seedance, anything — passes through `treat_video.py` with the appropriate LUT ramp before assembly:

```
python tools/brand-treatment/treat_video.py --input clip.mp4 --treatment standard --output clip_treated.mp4
```

The constructivist preamble produces close-to-brand output. The LUT lands the final 10%. Skipping treatment is the single biggest reason an AI clip reads as "imported from a different video" — not because the generation was bad, but because the unification step didn't run.

### 6. Render-qa checks

The render-qa skill runs structured/binary checks against the assembly manifest:
- Animation-flat rule (load-bearing): if the asset is animated, was `realism: flat` used?
- Register × treatment pairing follows VIS-10
- Planar face quality (visual judgment delegated to visual-qa via Claude vision)
- Typography accuracy on non-Latin text
- File presence, format match, treatment application

Flag any HIGH PRIORITY violation before assembly. Animation drift on a non-flat asset is the most expensive failure mode in the pipeline — re-generation cost plus timeline shift.

### 7. NLE assembly

Treated clip drops into DaVinci Resolve / Premiere Pro / Final Cut Pro alongside Remotion exports and stock footage. From the NLE's perspective, AI-GEN clips are MP4 files. No special handling needed beyond the standard timeline placement. The assembly manifest specifies start time, duration, and any per-clip overrides.

## Multi-shot consistency: the hardest specific challenge

When the same scene appears across multiple shots — three different angles of the same fab, the same room at three different moments, the same figure in five clips — naive generation produces three different fabs / rooms / figures pretending to be the same one. This is the most common failure mode in AI-GEN production, and it has explicit techniques to prevent.

**Technique 1: Lock a master reference per recurring scene.** Generate one canonical reference frame for "the fab" at the highest quality you can. This becomes the master. Every subsequent fab shot in the episode references it as the style anchor. Save the seed; if you need to regenerate, the seed + same prompt produces a consistent output.

**Technique 2: Use Sora 2 Director Mode for multi-angle sequences.** When a beat needs wide-establish → medium → detail of the same space, Sora's Director Mode is purpose-built. Define the scene once; Sora preserves spatial coherence as you re-shoot from different angles. Better than generating each angle independently.

**Technique 3: Use Kling's Bind Subject for episode-wide consistency.** When the same fab appears in Beats 2, 4, and 6 with different camera moves, Kling's Bind Subject feature treats the reference frame as a 3D anchor across the session. All three shots inherit the same spatial conditioning.

**Technique 4: Use Seedance multi-input for narrative sequences.** When a long sequence needs consistency across 8-10 shots, Seedance accepts up to 12 anchor images. Pre-generate 3-4 master reference frames covering different angles; pass all of them as anchors; generate the sequence. Seedance will preserve coherence across the full sequence.

**Technique 5: Recraft style_id for stills consistency.** All Register 2 atmospheric backdrops in an episode should pull from the same style_id. All Register 3 grounded scenes likewise. This locks the visual conditioning at the still-generation step before any shot enters the animation pipeline.

The general principle: **explicit anchoring is always better than hoping the model remembers**. Tools have memory across a session; sessions don't persist; episodes span sessions. Anchor explicitly at every transition.

## Camera direction integration

The script-draft skill emits `DIR:` annotations for P1/P2 visual moments — `cam(push-in, over:7s)`, `mood(dense, particles:15)`, `hold(2s)`, etc. visual-spec parses these into video-tool prompt language. Don't override unless the tool can't execute the directive.

The mapping table:

| DIR: directive | Kling 3.0 prompt | Sora 2 prompt | Runway Gen-4 prompt |
|---|---|---|---|
| `cam(push-in, over:7s)` | "Slow forward dolly over 7 seconds" | Describe in keyframe progression | "Slow dolly forward, controlled" |
| `cam(static)` | "Locked-off static frame, no camera movement" | Single keyframe held | "Static shot, no camera move" |
| `cam(orbit)` | "Slow orbital tracking around subject" | Multi-keyframe orbit progression | "Camera orbits subject 90 degrees" |
| `cam(pan-right, over:5s)` | "Steady pan right over 5 seconds" | Two-keyframe horizontal pan | "Pan right smoothly" |
| `mood(dense, particles:15)` | Add to atmosphere description | Add to scene description | Add to mood field |
| `mood(dim:0.5)` | "Low ambient lighting, isolated pool of light" | "Dim atmospheric lighting" | Same |
| `hold(2s)` | Increase durationTarget by 2s | Hold final keyframe 2s longer | Add to clip duration |
| `cut()` transitions | Handled in assembly manifest, not generation | Same | Same |

For directives the tool can't execute (Kling can't do extreme orbital camera; Sora struggles with very long single-take dollies), fall back to a static or simpler shot with subject motion. Or ask the script writer to soften the directive in the next revision. Don't generate a clip you know will fail and hope.

## Brand treatment chain

The constructivist preamble + the LUT pass form a two-stage brand unification system. Both stages are required.

Stage 1 (prompt-level, in `recraft.py`): the constructivist preamble pushes generation toward warm umber palette, planar figures, restricted color, brand composition. This does ~80% of the brand work.

Stage 2 (treatment-level, in `treat.py` / `treat_video.py`): the duotone LUT + grain + vignette pass lands the final 10% — pulls any remaining off-brand drift into Meridian palette, applies the texture hierarchy that signals "world" vs. "analysis" to the viewer, unifies AI-GEN clips with treated stock footage.

The treatment ramps follow VIS-10 (treatment × register pairings):

| Register | standard | conflict | editorial |
|---|---|---|---|
| atmospheric | ✓ default | ✓ rare (max 1-2/ep) | ✗ FORBIDDEN |
| grounding | ✓ default (present-day) | ✓ adversarial scenes | ✓ historical (pre-1980s) |
| analytical | ✓ omit/default | ✗ rare | ✗ rare |

render-qa enforces this matrix. Any forbidden pairing flagged before assembly.

## The animation-flat rule (load-bearing)

Any AI-GEN asset that will be animated to video must use `realism: flat`. This is not editorial preference — it's a production fact: animation models track color-blocked forms reliably across frames whereas photographic textures (skin tonality, fabric weave, atmospheric haze, material gradients) drift severely.

`realism: balanced` and `realism: grounded` produce environments with material detail that fail to track consistently in motion, creating visible morphing across the clip. Reserve these dosages for stills only — assets that will be Ken-Burned in NLE rather than animated.

The rule's enforcement points:
1. visual-spec sets `realism: flat` by default for any brief that will produce animated output
2. recraft.py's flat dosage block carries the explicit "REQUIRED FOR ANIMATED AI-GEN CLIPS" instruction in the prompt
3. shot-list.schema.json documents the rule in the realism field description
4. render-qa flags violations as HIGH PRIORITY before assembly

Trust the rule even when a particular reference looks "too flat" to your eye. Animation will reveal that the flat version was right.

## Cost optimization

Budget allocation per episode (13 minutes, ~90 seconds AI-GEN):

| Item | Tool | Cost per Episode |
|---|---|---|
| Reference frame iteration | Recraft V3 (~$0.04 × 30-50 attempts) | $1.20 - $2.00 |
| Reference frame iteration (rare grounded) | Flux 2 Pro (~$0.045 × 5-10 attempts) | $0.25 - $0.50 |
| Video clip generation | Kling 3.0 (10-15 clips × $0.50) | $5.00 - $7.50 |
| Multi-shot sequences | Sora 2 (within ChatGPT Pro) | $0 incremental |
| Budget P3 clips | Seedance 2.0 (~30s × $0.022) | $0.66 |
| Brand treatment | Local processing | $0 |
| **Total per episode** | | **$7-11** |

The discipline that compounds: iterate aggressively on reference frames (free or near-free), validate before video generation (the $5-7.50 expensive step), use Sora 2 for multi-shot sequences (zero incremental within ChatGPT Pro), reserve Kling for hero P1/P2 single-shot environment work where its quality matters.

The bad pattern that wastes money: cheaping out on reference iteration ("this is good enough"), then burning $5-15 on video re-generations because the reference had a problem you didn't catch. Reference frame quality is the single highest-leverage decision in the whole pipeline.

## Common failure modes and recovery

**Failure: Face slides toward realism in animation.**
Diagnostic: rendered video clip shows visible eyes, mouth, photographic skin tonality across frames.
Cause: realism wasn't flat, or reference frame had realism leak that Kling amplified.
Fix: regenerate reference frame with `--realism flat`, ensure the constructivist preamble's tightened figure language is in the prompt (4-5 color-blocked planes, no continuous skin tonality, eyes obscured). Re-animate from the corrected reference.

**Failure: Environment morphs across the clip.**
Diagnostic: walls, equipment, or props change shape during the 5-7 second clip.
Cause: realism: balanced or grounded used for an animated clip; environment material detail can't track.
Fix: re-generate reference at realism: flat, re-animate. The animation-flat rule exists specifically to prevent this.

**Failure: Three different fabs across what should be the same fab.**
Diagnostic: each shot shows visibly different equipment / layout / lighting.
Cause: no explicit anchoring across shots; each generation defaulted independently.
Fix: lock a master reference for "the fab," use Kling's Bind Subject or Sora's Director Mode for subsequent shots, or use Recraft's style_id to pin all related stills.

**Failure: Chinese (or Russian / Japanese) text renders as gibberish.**
Diagnostic: characters look approximately right but don't actually parse.
Cause: Recraft and Flux both struggle with non-Latin scripts; mock-script is a frequent failure mode.
Fix: Tiger reviews all non-English text manually before render. If the rendered text is gibberish, regenerate the reference. If multiple regenerations fail, fall back to the minimal variant of the typography (chinese_minimal, russian_minimal-equivalent if added) or to `none`.

**Failure: LUT pass produces muddy / clipped output.**
Diagnostic: shadows go muddy, highlights clip, palette feels wrong after treat.py.
Cause: the source generation was too far off-brand for the LUT to rescue; cross-talk between source colors and target palette.
Fix: regenerate the reference with stronger constructivist preamble or palette anchoring. Don't push the LUT harder — it's calibrated correctly. The source needs to land closer to brand pre-treatment.

**Failure: Face shows the "uncanny realistic-but-blurred" effect.**
Diagnostic: face has anatomical structure (visible nose contour, jawline reading as real) but rendered with constructivist palette, sitting in an in-between zone.
Cause: `realism: balanced` allowed the figure to drift toward realism; the May 4 v1 Beijing apartment was the validating example of this failure.
Fix: tightened post-May 4 — the preamble now specifies 4-5 distinct color-blocked planes and explicitly forbids continuous skin tonality. If this failure mode reappears, the prompt isn't being tightened enough; regenerate with the constructivist standard fully committed.

## Per-episode production checklist

Before starting AI-GEN production for an episode:

```
- [ ] visual-spec has emitted briefs for all [AI-GEN:] segments
- [ ] Each brief has register, realism, text_treatment, treatment, camera direction
- [ ] Animated clips have realism: flat (animation-flat rule)
- [ ] Stills-only clips can use balanced or grounded
- [ ] All non-Latin text in briefs is reviewed by Tiger (Chinese) or planned for native review
- [ ] Canonical reference library exists (run generate_style_refs.py if not)
- [ ] Recraft API key set (RECRAFT_API_KEY env var)
- [ ] fal.ai API key set if Flux 2 Pro will be used (FAL_KEY env var)
- [ ] Kling 3.0 / Sora 2 / Runway / Seedance access confirmed for the tools the briefs specify
```

During production, for each AI-GEN segment:

```
- [ ] Generate 4-6 reference frame variations in Recraft V3 (or Flux for rare grounded)
- [ ] Pick the strongest variation
- [ ] Run reference through treat.py to validate LUT pass
- [ ] If LUT fights the reference, iterate prompt and regenerate
- [ ] Pass validated reference to video tool with camera direction prompt
- [ ] Generate clip at brief's duration target
- [ ] Run clip through treat_video.py with brief's treatment ramp
- [ ] Run render-qa checks (animation-flat, register × treatment, planar face)
- [ ] Drop treated clip into NLE timeline
```

After the episode renders:

```
- [ ] Run visual-qa on rendered stills for visual judgment checks (planar face holds? constructivist style holds across motion?)
- [ ] Spot-check any flagged issues from render-qa
- [ ] Confirm AI-GEN budget within VIS-09 target (5-15% of episode runtime, 10-20% max)
- [ ] Confirm no more than 2 consecutive AI-GEN clips without a mode switch
- [ ] Note any failure modes encountered for the next episode's playbook update
```

## Maintenance

When a new tool enters the stack (e.g., Veo 4 launches and outperforms Kling 3.0 for some use cases):

1. Test the new tool on 3-5 reference scenes spanning the channel's needs (constructivist illustration, animated industrial, multi-shot, intimate domestic, historical reconstruction).
2. Compare outputs to the equivalent runs in the current tool set — quality, cost, reference image support, consistency.
3. If the new tool clearly outperforms in some category, add it to the tool-to-use-case mapping table and the decision tree.
4. If marginal, defer; switching tools mid-channel is expensive due to consistency drift.
5. Update this doc and AI_VIDEO_PIPELINE.md with the new tool's role.

When the constructivist aesthetic gets refined (e.g., post-EP01 retrospective surfaces failure patterns):

1. Update the prompt preambles in recraft.py
2. Regenerate the canonical reference library under the new preambles
3. Update PROMPTS.md and INDEX.md
4. Update this doc's failure-modes section with new patterns

When per-episode AI-GEN cost trends above $15/episode:

1. Audit the reference iteration ratio — too many iterations suggests the preamble isn't tight enough
2. Check if too many clips are using Kling when Seedance would suffice
3. Verify multi-shot consistency techniques are being used (no redundant generation)
4. Consider whether some AI-GEN entries should fall back to footage or MG instead
