# 3D Recreation Exploration — Findings & Decision (SHELVED)

> **Status: SHELVED experiment.** Built and explored May 23–24, 2026; decided
> *not* the right direction. Code preserved (not deleted) for reference; do not
> invest further without revisiting this doc first.
>
> **One-line decision:** Don't build bespoke 3D for stylized "recreation" shots.
> A constructivist/woodcut look is a 2D print tradition — do it 2D/AI-native
> (AI-gen stills with style+character consistency + parallax), which lives in
> Parallax's existing 2D editorial + AI-gen strengths.

## Why we explored this

Competitor channel **IMPERIAL** (@IMPERIALYT) uses animated 3D historical
recreations (rigged period figures acting out scenes — Roman senate, the Ides
of March). Tiger admired the look and asked whether Parallax should match it.
We chased the capability end-to-end to find out.

## The arc (what we actually did)

1. Researched IMPERIAL; identified the one true capability gap = **3D acted
   recreations** (maps, archival, collage, stylized cartography were already in
   reach; the schematic `AtlasPlate` map was built as part of this and **shipped**).
2. Proved 3D can render *inside* Remotion via `@remotion/three` (built the
   `Recreation` template; rigged glTF animated deterministically off
   `useCurrentFrame`).
3. Sourced a character (Meshy free tier → `roman-walking.glb`), built a
   procedural senate set, added a "Mode B" depth-pass for AI restyle, drafted a
   `recreation-spec` director schema.
4. Pivoted the *look* to **constructivist NPR** (brand-coherent, not photoreal):
   `ConstructivistEffect` = hard-posterize flat ink/gold/bone + mid-band
   halftone + normal/depth ink edges + grain. Iterated ~6 polish passes.
5. Hit a quality ceiling ("clean, grand, *stylized* — but not *hero*"),
   questioned the tool, and researched tool-fit + the 2D alternative.

## Key findings

1. **AI-*video* can't hold multi-shot consistency** (Kling/Runway/Veo/Sora drift
   the same character/scene across separate shots). This is why pure gen-AI
   recreations don't work — and what first motivated the 3D route.
2. **AI-*image* with style + character references CAN hold consistency**
   (FLUX.2 multi-ref, Midjourney `--sref`/`--cref`). This is the consistency 3D
   promised — but on *stills*, dodging the video-morphing instability.
3. **Photoreal 3D-restyle is off-brand.** It's IMPERIAL's identity, not
   Parallax's (constructivist/editorial). A ChatGPT still proved photoreal is
   achievable but it's just our existing AI-GEN register in a photoreal coat.
4. **The constructivist/woodcut look is 2D by definition** (anti-volumetric:
   flat planes, hard edges, no depth/gradient). Rendering 3D then NPR-flattening
   = paying full 3D cost to *fight* the medium; it reads "cel-shaded 3D game,"
   not "linocut," because the look lives in **2D surface texture** (ink bleed,
   grain, carved mark), not geometry.
5. **three.js/WebGL NPR is structurally ceiling-limited** for hero stylized
   work: no real-time GI (flat lighting is the default), volumetric god-rays are
   WebGPU-only (headless = WebGL2 = degraded), and art-directable varied-weight
   line art is very hard in shaders. Not an effort gap — the asymptote.
6. **Blender is better for hero NPR but doesn't close the gap for a non-artist,
   and is still the wrong frame here.** Its line-art/EEVEE-NPR toolset is real,
   but hero quality comes from art *taste* (lighting/composition/lookdev);
   varied woodcut linework is exactly where the tools fight you; hero *animated*
   needs an artist or a year+.
7. **Comparable channels don't hand-build 3D for hero shots.** Vox/Johnny Harris
   = After Effects + motion graphics; Kurzgesagt = 2D flat (with ~70 people).
   Bespoke-3D recreation is a solo-creator trap; the audience rewards writing +
   clean 2D + archival, not mediocre cel-shaded 3D figures.

## The recommended path (if/when recreations are wanted)

**2D / AI-native, not bespoke 3D:**
- **AI-gen constructivist/woodcut stills** with locked style + character refs
  (FLUX.2 / MJ) as the hero recreations — gives cross-shot consistency.
- **Motion = gentle 2.5D parallax / image-to-video camera moves** on those
  stills (stable, not morphing) via existing `ImageComposite` / `ScrollyReveal`
  / Ken-Burns.
- **Cut-out rigs (Moho/AE) only when a figure must genuinely act.**
- Slots into the existing `ASSET_GENERATION_REGISTER` + 2D template strengths.
- The **constructivist recipe** below becomes an AI-gen *style reference*, not a
  shader.

Constructivist recipe (reusable as a style ref): flat **ink / gold / bone**
bands (hard posterize, no gradient); bold **varied-weight ink linework** as the
hero element; halftone only in mid-tones (sparingly); paper grain; high
contrast / chiaroscuro; *form via lighting, not detail*.

## What was built (shelved — `remotion-templates/src/templates/Recreation/`)

| File | What it is | Status |
|---|---|---|
| `Recreation.tsx` | `@remotion/three` template: rigged glTF, deterministic anim, procedural senate set, `renderMode: beauty \| constructivist \| depth` | shelved |
| `ConstructivistEffect.ts` | NPR post: posterize ink/gold/bone + mid-band halftone + normal/depth edges + grain | shelved (recipe reusable for AI style ref) |
| `recreationSpec.ts` + `data/recreation-spec.example.json` | Director-layer schema (cast/set/shots/Mode A-B) | shelved (concept reusable) |
| `public/assets/recreation/*.glb` | Stand-in chars (Meshy `roman-walking/running`, `cesium-man`, three.js `soldier`) | shelved (free-tier license — not for publish) |

Registered in `Root.tsx` as composition `Recreation` (+ catalog-allowlisted).
Renders on GPU only (skinned meshes need a real GPU; headless software-GL can't
draw them).

## Technical gotchas worth remembering

- **`@react-three/postprocessing` `wrapEffect` + React 19 = circular-JSON crash**
  if you pass a `ref` (the ref leaks into props; `JSON.stringify` hits an
  Object3D). Don't ref a wrapped effect; update uniforms another way.
- **Headless software-GL (`--gl=swangle`) can't render skinned meshes** (the set
  renders, the character doesn't). Use `--gl=angle` on a real GPU, or Studio.
- **Headless WebGPU isn't viable in 2026** → Remotion 3D = WebGL2/ANGLE only.
- **Hard posterize eats gradients** — fog / subtle GI / smooth ramps get
  quantized away. Don't expect atmospheric gradients to survive NPR banding.
- Split `node_modules` (root vs `remotion-templates`) caused duplicate
  `postprocessing` type identities → needed a cast in `wrapEffect` usage.

## If we ever revisit

Only revisit bespoke 3D if: (a) an episode genuinely needs *acted, consistent,
multi-angle* motion that 2D cut-out + AI-stills can't deliver, AND (b) there's
budget for an artist or a serious Blender ramp. Otherwise the 2D/AI-native path
above is cheaper, more authentic to the aesthetic, and on-brand. Default = use
2D.
