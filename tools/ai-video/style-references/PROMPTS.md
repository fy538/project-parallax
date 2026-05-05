# Parallax — AI Video Style Reference Library

## Purpose

These 7 reference images define the "Parallax AI-GEN look." They're generated once in **Flux 2 Pro** (primary) or GPT Image 2 (for quick drafts), then used as style anchors across all episodes. Each image locks a specific aspect of the aesthetic — the mannequin face level, the environmental detail, the lighting approach.

**Workflow:** Draft in GPT Image 2 (free iterations via ChatGPT Pro) → generate final in Flux 2 Pro (~$0.045/image at 1920×1080) → review output → iterate until it matches the Parallax editorial feel → save as the canonical reference → feed to Kling 3.0 / Seedance 2.0 / Sora 2 / Runway Gen-4 as style/image references.

**Important:** After generating, run each through `treat_video.py` (as a still frame) to verify the LUT pass produces clean Meridian-palette results. If the raw generation fights the LUT (too saturated, wrong color temperature), adjust the prompt.

**API access for Flux 2 Pro:** Via fal.ai ($0.03/MP), DeepInfra (OpenAI-compatible endpoint), or BFL directly. No subscription — pay per image. Set resolution to 1920×1080 for 16:9 reference frames.

---

## Reference 1: Mannequin Face (Close-Up)

**Locks:** The exact level of facial stylization across all AI-GEN content.

**Filename:** `style-ref_face_mannequin-neutral_v1.png`

**Flux 2 Pro Prompt:**
```
Close-up portrait photograph of a realistic department store mannequin head on a human body. The face is a smooth, gently convex surface that protrudes forward naturally like a real face shape — prominent forehead, protruding nose ridge, forward cheekbones, defined jawline — but the entire surface is completely smooth with no eyes, no mouth, no nostrils, no wrinkles, no pores in the face area. Skin-colored matte plastic or ceramic finish on the face only. The rest of the body is a real human: warm natural skin on neck and ears, dark short hair with realistic texture, crisp white dress shirt with fabric detail. Studio portrait lighting from upper left, soft shadows on the smooth facial surface revealing its three-dimensional contour. Shot on Canon EOS R5, 85mm f/1.4, shallow depth of field, warm gray background. 16:9 aspect ratio.
```

**Key constraints:**
- Frame as "mannequin head on human body" NOT "person without a face" (prevents concave/collapsed faces)
- Face must be CONVEX — protruding outward like a real skull, just with no features carved in
- NO pupils, iris, or eye definition
- NO mouth or lip definition
- Nose is a ridge/protrusion, not defined nostrils
- Skin tone is warm and natural (not white/plastic)
- Everything else (hair, clothing, skin texture on neck/hands) is photorealistic
- This sets the "how stylized?" bar for all other references

**Iteration notes (from GPT Image 2 testing):**
- "Person with a smooth face" → models make concave/scooped faces (bad)
- "Department store mannequin head on a human body" → models build outward from mannequin shape (good)
- Always emphasize "convex," "protrudes forward," "three-dimensional contour"

---

## Reference 2: Industrial Interior (Warm) — Semiconductor Cleanroom

**Locks:** Environmental detail level and warm-lighting approach for tech/industrial scenes.

**Filename:** `style-ref_interior_cleanroom-warm_v1.png`

**Flux 2 Pro Prompt:**
```
Interior of an advanced semiconductor fabrication cleanroom with yellow lithography lighting casting warm amber glow hex #E5A544 across white surfaces and HEPA-filtered ceiling panels. Raised floor with perforated tiles, wafer handling equipment in foreground, FOUP carriers on automated track receding into background. Two workers in full white bunny suits with clear polycarbonate face shields — behind each shield, a smooth featureless mannequin-like face with no eyes or mouth, just the blank convex shape of a department store mannequin head. Bunny suit fabric is crisp and realistic with seam detail. Atmosphere of extreme sterility and quiet precision. Shot on Sony A7IV, 35mm f/2.0, medium wide from hip level, shallow depth of field softening the background. Photorealistic rendering. 16:9 aspect ratio.
```

**Key constraints:**
- Yellow/amber lithography light is the dominant color cast (pre-LUT) — hex #E5A544
- Equipment should look plausibly like real semiconductor tools (not generic sci-fi)
- Figures are mid-ground, faces behind shields (eases mannequin rendering — shield partly obscures)
- Detail level high enough that after LUT pass, it reads as "real facility" minus faces
- Material textures matter: perforated tile, polycarbonate shield, crisp bunny suit fabric

---

## Reference 3: Industrial Interior (Cool) — Military/Tech Command

**Locks:** Blue-screen ambient lighting approach for adversarial/military content.

**Filename:** `style-ref_interior_command-cool_v1.png`

**Flux 2 Pro Prompt:**
```
Interior of a military strategic operations room, dark and tense. Multiple large display screens casting cool blue light hex #3266AD as the primary illumination source, overhead fluorescent panels switched off. Three figures in generic military uniforms seated at workstations — each has a smooth featureless mannequin-like face with no eyes or mouth, the blank convex shape of a department store mannequin head with warm skin tone. Uniforms are photorealistic with pressed fabric, epaulettes, and generic insignia. Radar displays and situation maps glow on screens, cable management and keyboard detail visible at workstations. Institutional drop ceiling, rubber floor tiles. Shot on Arri Alexa, 24mm f/2.8, slight dutch angle for tension, deep focus keeping all three figures sharp. Photorealistic rendering. 16:9 aspect ratio.
```

**Key constraints:**
- Cool blue dominant tone hex #3266AD (this will receive the "conflict" LUT)
- Dark overall exposure — screens provide most illumination
- Military uniforms should be generic/unidentifiable (no specific nation's insignia)
- Tension in the composition — dutch angle, blue wash, dark ambient
- Three figures tests mannequin face at medium distance with multiple subjects

---

## Reference 4: Historical Interior — Mid-Century Government

**Locks:** Period reconstruction aesthetic and the "editorial" treatment look.

**Filename:** `style-ref_interior_historical-gov_v1.png`

**Flux 2 Pro Prompt:**
```
Interior of a 1940s American government office or diplomatic meeting room. Dark wood paneling on walls, heavy green curtains, brass desk lamp casting a warm pool of light on a large mahogany desk. Stacked papers, fountain pen, brass ashtray, rotary telephone on the desk surface. Two men seated across from each other in period-correct double-breasted suits with wide lapels and pocket squares — both have smooth featureless mannequin-like faces with no eyes or mouth, the blank convex shape of department store mannequin heads with warm skin tones. Hands are realistic, resting on the desk. Filing cabinet in the corner, venetian blinds casting slats of warm light across the room. Slightly desaturated color palette with warm sepia undertone suggesting aged Kodachrome film stock. Shot on vintage Leica lens with soft edges, 50mm equivalent, medium shot. Documentary framing. Photorealistic rendering. 16:9 aspect ratio.
```

**Key constraints:**
- Period accuracy in furnishings, clothing, and objects (1940s specifically)
- Already somewhat desaturated in generation (the "editorial" LUT will push further)
- Slightly soft/warm rendering suggesting vintage optics — "shot on vintage Leica lens"
- Should read as "historical reconstruction" even before treatment
- Two seated figures tests mannequin face in a conversational/diplomatic context
- Material details sell the era: mahogany, brass, green curtains, heavy wool suits

---

## Reference 5: Figure in Motion — Professional Walking

**Locks:** Full-body mannequin-face figure with realistic movement and clothing.

**Filename:** `style-ref_figure_suit-walking_v1.png`

**Flux 2 Pro Prompt:**
```
Full body photograph of a person in a tailored dark navy suit walking through a modern glass-and-steel building lobby, captured mid-stride with natural walking posture and subtle arm swing. The figure has a smooth featureless mannequin-like face with no eyes or mouth — the blank convex shape of a department store mannequin head — with warm skin tone and dark short hair in a clean shape. Clothing is photorealistic: visible wool fabric texture, horn buttons, proper drape and movement in the jacket, crisp white shirt collar visible. Hands are realistic with five fingers in a natural mid-swing pose. Modern architectural interior with floor-to-ceiling windows, polished stone floor showing subtle reflections. Natural daylight streaming from windows with soft interior fill light. Shot on Sony A7IV, 50mm f/2.0, full body in frame with walking room ahead of the figure, slight motion suggestion. Photorealistic rendering. 16:9 aspect ratio.
```

**Key constraints:**
- Natural walking pose (not stiff or posed) — mid-stride with arm swing
- Clothing completely photorealistic — wool texture, buttons, drape, tailoring
- Hands are visible and realistic (5 fingers, natural pose)
- Face is the ONLY stylized element — at full-body scale the mannequin face is smaller and less prominent
- This reference proves the aesthetic works at full-body scale
- Floor reflections and window light add environmental realism

---

## Reference 6: Aerial/Wide Environment — Urban Development

**Locks:** Environmental detail level for wide establishing shots.

**Filename:** `style-ref_aerial_urban-development_v1.png`

**Flux 2 Pro Prompt:**
```
Aerial photograph of a massive semiconductor fabrication campus under construction in arid desert terrain. Multiple large white rectangular cleanroom buildings in various stages of completion, yellow construction cranes towering above, landscaped earthen berms separating construction zones, paved access roads with small white trucks and construction vehicles providing scale reference. Surrounding landscape transitions from raw desert scrub to graded earth to paved infrastructure. Late afternoon golden hour light casting long dramatic shadows from the buildings and cranes across the construction site. Sense of enormous industrial scale — each building is clearly hundreds of meters long based on vehicle sizes. Shot from helicopter at 500 feet altitude, 70mm equivalent lens, f/5.6, slightly angled down at 30 degrees. Clear desert air with mild atmospheric haze softening the distant mountains. No people visible at this scale. Photorealistic rendering. 16:9 aspect ratio.
```

**Key constraints:**
- No people visible (scale makes mannequin issue irrelevant)
- Environmental detail is the focus — this proves AI can generate convincing wide shots
- Golden hour lighting that works with standard LUT
- Could be TSMC Arizona, Samsung Taylor, Intel Ohio — intentionally non-specific
- Scale references (vehicles, roads, cranes) sell the enormity
- Atmospheric haze at distance adds realism and depth

---

## Reference 7: Conceptual Corridor — Physical Metaphor

**Locks:** The visual language for abstract-concept-as-physical-space scenes.

**Filename:** `style-ref_concept_corridor-splitting_v1.png`

**Flux 2 Pro Prompt:**
```
A long modern corridor with polished concrete floors that physically splits into two diverging paths ahead. The left path is bathed in warm amber light hex #E5A544, and through its glass walls shows a collaborative workspace with shared tables and equipment. The right path is bathed in cool blue light hex #3266AD, and through its glass walls shows isolated workstations separated by frosted glass barriers. At the split point stands a single figure in a neutral gray suit with a smooth featureless mannequin-like face — the blank convex shape of a department store mannequin head — arms slightly raised in a gesture of weighing options. Polished concrete floor with subtle expansion joints creating directional lines toward each path. Modern industrial ceiling with exposed silver ductwork. Shot on Sony A7IV, 24mm f/8, wide shot with one-point perspective, vanishing point at the corridor split, deep focus keeping everything sharp. Dramatic lighting contrast between the warm and cool paths. Photorealistic rendering. 16:9 aspect ratio.
```

**Key constraints:**
- The concept (bifurcation/choice) must be IMMEDIATELY readable
- Warm amber hex #E5A544 vs. cool blue hex #3266AD makes the two options visually distinct
- Glass walls reveal what each path "contains" — the metaphor is spatial
- Single figure at junction creates a decision-moment tension
- Slightly surreal but architecturally plausible — not fantasy
- Deep focus (f/8) keeps everything sharp — the spatial metaphor requires full clarity
- This is the most ambitious mode — tests whether AI can generate concept-as-space

---

## Generation Process

### Order of operations:
1. Generate Reference 1 (face) first — this is the quality gate for all others
2. Generate Reference 5 (full body) to verify the face works at different scales
3. Generate References 2, 3, 4 (interiors) — these test the face in context
4. Generate Reference 6 (aerial) — no face needed, tests environment quality
5. Generate Reference 7 (conceptual) — tests the most ambitious mode

### Recommended workflow:
1. **Draft in GPT Image 2** (free via ChatGPT Pro) — paste prompt, get instant result, iterate on composition/framing
2. **Final in Flux 2 Pro** (via fal.ai or BFL API) — once you like the composition, generate the production-quality version at 1920×1080
3. **LUT test** — run through treat_video.py to verify Meridian palette compatibility
4. **Save** — approved images become the canonical style references

### Iteration criteria:
- **Face concave/scooped inward?** Reframe as "department store mannequin head on a human body" — describe the shape as convex and protruding, not as a face with features removed. This is the #1 issue.
- **Face too realistic?** Add "completely smooth with no eyes, no mouth, no nostrils, ceramic-like surface"
- **Face too alien/robotic?** Add "warm skin tone, natural human head shape, anatomically proportional skull"
- **Environment too stylized?** Add "photorealistic, documentary photography, no artistic effects"
- **Lighting too dramatic?** Add "natural lighting, no dramatic color grading"
- **After LUT pass looks wrong?** Generate with less saturation, more neutral color temperature
- **Flux 2 being too literal?** Unlike Midjourney, Flux 2 follows prompts very literally. If you want more mood/atmosphere, be explicit about it ("soft atmospheric haze," "warm golden light quality")
- **GPT Image 2 vs Flux 2 Pro:** GPT Image 2 is better for compositional iteration (free, fast) but struggles with the mannequin face (tends concave). Flux 2 Pro follows prompts more literally and should handle "convex mannequin surface" better. Always finalize in Flux 2 Pro.

### Final check:
Run each approved reference through:
```bash
# Test still frame through video treatment pipeline
python tools/brand-treatment/treat_video.py --input style-ref_XX.png --treatment standard --output style-ref_XX_treated.png
python tools/brand-treatment/treat_video.py --input style-ref_XX.png --treatment conflict --output style-ref_XX_conflict.png
python tools/brand-treatment/treat_video.py --input style-ref_XX.png --treatment editorial --output style-ref_XX_editorial.png
```

The reference is approved when at least one treatment pass produces an image that looks like it belongs in a Parallax video.

### Cost for full library:
7 images × ~$0.045/image (1920×1080) = **~$0.32 total** via Flux 2 Pro. Even with 5-10 iterations per reference, the entire style library costs under $3.

---

## Usage in Production

When generating AI video for an episode:

1. Pick the closest style reference for your scene type
2. Upload it as a "style reference" or "image reference" to Kling 3.0 / Seedance 2.0 / Sora 2 / Runway Gen-4
3. Write your scene-specific prompt (environment, action, camera)
4. The style reference ensures consistent mannequin-face level and quality bar across all clips

For scenes that don't match any reference exactly, combine references:
- Military cleanroom? Reference 2 (cleanroom layout) + Reference 3 (cool lighting mood)
- Historical walking figure? Reference 5 (figure) + Reference 4 (period setting)
- Conceptual aerial? Reference 6 (aerial scale) + Reference 7 (conceptual metaphor elements)

### API Quick Start

**Recommended: fal.ai** (~$0.045/image at 1920×1080, fastest latency)

```bash
pip install fal-client
```

```python
import fal_client

result = fal_client.subscribe(
    "fal-ai/flux-2-pro",
    arguments={
        "prompt": "<your prompt here>",
        "image_size": {"width": 1920, "height": 1080},
        "num_images": 1
    }
)
image_url = result["images"][0]["url"]
```

**Alternative providers** (all serve the same FLUX.2 Pro model):

| Provider | ~Cost at 1920×1080 | Setup |
|---|---|---|
| fal.ai (recommended) | ~$0.045 | `pip install fal-client`, API key from fal.ai |
| BFL direct | ~$0.045 | API key from bfl.ai, batch support |
| Together AI | ~$0.055 | Free trial credits for new users |
| Replicate | ~$0.055 | Simple API, `pip install replicate` |
| DeepInfra | ~$0.055 | OpenAI-compatible endpoint |

Price differences are pennies per image. At Parallax's volume (~70 images to build the full style library with iterations), total cost is ~$3 regardless of provider.

**For drafting/iteration: GPT Image 2** (free via ChatGPT Pro) — paste prompt, get instant result, iterate on composition. Known limitation: tends to make mannequin faces concave. Always finalize in Flux 2 Pro.
