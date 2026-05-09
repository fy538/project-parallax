# Prisoners Dilemma — Visual Generation Pipeline

> Updated: May 8, 2026
> Status: In production (stills complete, animation in progress)

## Overview

This episode uses a ChatGPT + Pika/NLE pipeline to generate 17 AI-GEN clips:

```
Tier 1: 4 Episode Reference Stills (ChatGPT, with style constraint block)
         ↓  reference images anchor all subsequent generation
Tier 2: 17 Production Stills (ChatGPT, one-at-a-time in same conversation)
         ↓  route each still to Pika or NLE
Tier 3a: ~8 Pika 2.2 Clips (stills with real depth layers, no figure issues)
Tier 3b: ~9 NLE Ken Burns (flat compositions, text-heavy, or crowd scenes)
```

## Tool Selection — Why ChatGPT, Not Recraft

We tested Recraft V4 Pro against ChatGPT with identical prompts. ChatGPT produced better results for this episode's needs:

- **Grounded institutional scenes** (offices, corridors, lecture halls) — ChatGPT's compositions feel lived-in; Recraft's felt generic
- **Constructivist editorial style** — ChatGPT captured the Saul Bass / Fortune magazine register more naturally
- **Palette discipline** — ChatGPT adhered to ink/amber/bone with less drift
- **Recraft V4 Pro limitations discovered**: no style_id support, no substyle support, different size presets than V3. These made the 3-tier style cascade (channel refs → episode style → production style) impossible.

**Cost**: ChatGPT Plus subscription ($20/mo), ~50 image prompts per 3-hour rolling window. No per-image API cost.

## Tier 1 — Episode References

4 reference images generated in ChatGPT, uploaded at the start of the production conversation. These anchor the visual style for all 17 stills.

**Files**: `assets/ep-refs/ep-ref-{1-4}-*.png`

**Opening message** (paste with 4 reference images attached):
See `chatgpt-prompts.md` for the full opening message with style constraints.

**Key style constraints:**
- Constructivist editorial illustration with textured brushwork
- Palette: ink (#1C1814), amber (#E5A544), bone (#F0E6D0), grey-green accents
- Figures: angular, geometric, color-blocked in flat planes
- Cultural register: American mid-century institutional (Saul Bass, Fortune, Push Pin) — NOT Soviet propaganda
- All images: wide 16:9 landscape format
- No Cyrillic text — English only, or no text at all

## Tier 2 — Production Stills

17 stills generated one-at-a-time in the same ChatGPT conversation (maintains style consistency).

**Files**: `assets/stills/aigen-{01-17}-*.png`
**Prompts**: `chatgpt-prompts.md` (original 17) + `chatgpt-regen-prompts.md` (8 Pika-friendly regenerations)

### Pika-Friendly Still Design Principles

These principles must be applied when writing ANY ChatGPT image prompt destined for Pika animation:

1. **No detailed crowds.** Use abstract dots, color marks, or silhouette blobs instead of recognizable human figures with visible limbs. Pika sees humanoid shapes and animates them — even if you tell it not to.

2. **Figures must be dark silhouettes in static poses.** Standing, seated, arms at sides. NEVER mid-stride, mid-gesture, or running. Solid dark shapes with no facial features, no visible hands. Think shadow puppets.

3. **Minimize text.** Maximum 1-2 short labels. Keep text in the center of the composition (where zoom won't reveal new areas). Text at edges or on multiple surfaces WILL degrade to gibberish as the camera moves.

4. **Avoid deep one-point perspective.** It practically forces Pika to push-in, even when your prompt says otherwise. Use slight angles or flatter compositions that work with zoom.

5. **Create clear depth layers.** Distinct foreground / mid-ground / background with tonal separation. This is what makes Pika's parallax effect work — without it, you get the same result as NLE Ken Burns.

6. **No flickering light sources.** Avoid candles, reflective water, sparkles, or anything that looks like it "should" move. Use static ambient light.

### Stills That Need Regeneration

8 of 17 stills were generated before we understood Pika's limitations. Regeneration prompts are in `chatgpt-regen-prompts.md`:

| Still | Problem | Fix |
|-------|---------|-----|
| aigen-03 | 50+ tiny figures with visible limbs | Replace with abstract dots/diamond marks |
| aigen-04 | Deep 1-point perspective + text on 4 doors + mid-stride figure | Off-center angle, 1 label only, standing silhouette |
| aigen-07 | Two figures mid-stride | Standing silhouettes behind chairs |
| aigen-08 | 30+ traders with raised arms + text everywhere | Bird's-eye, crowd as abstract mass, no readable text |
| aigen-11 | 5 hunters running + stag + hare | Standing silhouette hunters, static poses |
| aigen-12 | 15 workers bending/hoeing/carrying | Standing silhouettes, terraces are the subject |
| aigen-14 | 10 pedestrians mid-stride | Standing silhouettes, corridor depth preserved |
| aigen-16 | Professor mid-gesture + 20 students + dense chalkboard text | Minimal chalkboard (grid + 4 numbers only), standing professor |

## Tier 3 — Animation (All Pika, NLE Fallback)

All 17 stills go through Pika first. If a specific clip has unacceptable artifacts (figure movement, text degradation, morphing), fall back to NLE Ken Burns zoom for that shot only.

| Still | Camera Move | Motion | Risk Level |
|-------|-------------|--------|------------|
| aigen-01 | Slow push-in | 1 | Low — seated figures |
| aigen-02 | Slow zoom-in | 1 | Low — no figures |
| aigen-03 | Slow drift down | 1 | Med — abstract dots (post-regen) |
| aigen-04 | Subtle zoom-in | 0 | Med — text on chalkboard (post-regen) |
| aigen-05 | Slow push-in | 1 | Low — no figures, clean geometry |
| aigen-06 | Slow push-in | 1 | Low — no figures, great depth |
| aigen-07 | Slow pull-back | 1 | Med — standing silhouettes (post-regen) |
| aigen-08 | Subtle zoom-in | 0 | Med — abstract crowd (post-regen) |
| aigen-09 | Slow pan right | 1 | Low — no figures, great depth |
| aigen-10 | Slow zoom-out | 1 | Low — small silhouettes |
| aigen-11 | Slow push-in | 1 | Med — standing silhouettes (post-regen) |
| aigen-12 | Slow tilt up | 1 | Med — standing silhouettes (post-regen) |
| aigen-13 | Slow zoom-out | 1 | Low — no figures |
| aigen-14 | Slow pan left | 1 | Med — standing silhouettes (post-regen) |
| aigen-15 | Barely perceptible drift | 0 | Low — no figures, near-static |
| aigen-16 | Subtle zoom-in | 0 | Med — minimal text (post-regen) |
| aigen-17 | Slow pan L→R | 1 | Low — tiny abstract sentinels |

**Fallback rule:** If Pika output has unacceptable artifacts after 2 attempts, use the still as-is with NLE Ken Burns matching the same camera direction and duration.

**Pika motion prompts**: `pika-prompts.md`

## Pika Prompting Rules

Learned through testing — these apply to ALL Pika image-to-video prompts:

1. **Only describe the motion you WANT.** Don't mention things you want frozen — Pika re-animates anything you name, even negatively. "Figures stay still" makes figures move.

2. **Keep prompts short.** 1-2 lines, director-style. Pika already sees the image — don't describe the scene. Long prompts cause text artifacts in output.

3. **Append negative prompt.** Every shot gets: `-neg flicker, morphing, warping, text, watermark, letters, jitter`. Add `character motion, figure moving` for shots with people. Add `pulsing` for shots with light sources.

4. **Use `-motion 0` for text-heavy or near-static shots.** Default `-motion 1` for everything else.

5. **"No text overlay." at the end of every prompt.** Prevents Pika from generating text artifacts in final frames.

6. **Fresh upload for each attempt.** Pika may cache previous prompts for the same image. Re-upload (or slightly crop) to force a fresh generation.

7. **Zoom ≠ push.** "Zoom-in" scales the image. "Push-in" generates new content. For text-heavy shots, use zoom only.

## Estimated Cost

- Tier 1-2 stills: ChatGPT Plus subscription (already have)
- Tier 3a Pika clips: ~9 clips × ~120 credits = ~1,080 credits (Pika Pro: 2,300 credits/mo at $28/mo)
- Tier 3b NLE clips: Free (Ken Burns in timeline)
- **Total incremental: ~$0** (within existing subscriptions)

## Quality Gates

1. **After Tier 1**: Do the 4 references establish consistent style? Amber/ink/bone palette? No Cyrillic text?
2. **After Tier 2**: Check each still against Pika-friendly principles before animating. Regenerate any that have detailed figures, heavy text, or deep 1-point perspective.
3. **After Tier 3a (Pika)**: Check for figure animation, text degradation, morphing geometry. Re-route to NLE if Pika can't handle it.
4. **After Tier 3b (NLE)**: Verify Ken Burns moves feel intentional, not like a slideshow. Match durations from shot list.
