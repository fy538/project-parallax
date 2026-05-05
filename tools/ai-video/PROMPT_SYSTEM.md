# Parallax — Flux 2 Pro Prompt Generation System

## Purpose

This document defines how AI video briefs (from the visual-spec skill) get automatically converted into optimized Flux 2 Pro prompts for reference frame generation. The system encodes best practices from BFL's official documentation so every prompt is production-quality without manual prompt engineering.

**The pipeline:**
```
Script [AI-GEN:] tag → visual-spec skill → AI video brief (JSON) → THIS SYSTEM → Flux 2 Pro prompt → reference frame → Kling 3.0 animation
```

Created: May 2, 2026

---

## Key Flux 2 Pro Principles (from BFL docs)

These rules are baked into the prompt generation logic:

1. **Front-load the subject.** Flux 2 weights earlier tokens more heavily. Non-negotiable elements go first.
2. **Natural prose, not keywords.** Write as you'd describe an image to a person. No comma-separated keyword lists.
3. **No negative prompts.** Describe what IS present, not what isn't. "Sharp focus throughout" not "no blur."
4. **30-80 words is the sweet spot.** Short enough for coherence, long enough for specificity.
5. **Camera specs dramatically improve realism.** "Shot on Sony A7IV, 35mm f/1.4" > "professional photo."
6. **Hex colors for brand accuracy.** Associate colors with specific objects. Include the keyword "color" or "hex."
7. **Lighting is the #1 quality lever.** Specific type + direction + quality > generic "good lighting."
8. **JSON structure for complex scenes.** When a scene has multiple subjects, use structured format for precision.

---

## Prompt Generation Templates

### Template A: Simple Scene (Single Environment, ≤2 Figures)

Use natural prose format. ~50-70 words.

**Structure:**
```
[Primary subject/environment in detail]. [Lighting type, direction, quality].
[Figure description with mannequin face specification]. [Atmospheric/mood details].
[Camera: shot type, lens, depth of field]. Photorealistic rendering. 16:9 aspect ratio.
```

**Slot definitions:**

| Slot | Source (from AI brief) | Flux 2 Best Practice |
|------|----------------------|---------------------|
| Primary subject | `scene.environment` | Front-load — this is what matters most |
| Lighting | `scene.mood` + use case type | Be specific: type (ambient/directional/volumetric) + direction (upper left/overhead/backlit) + quality (soft/hard/diffused) |
| Figures | `scene.figures` | Always include "completely smooth featureless face, mannequin-like, no eyes or mouth" — positive phrasing |
| Atmosphere | `scene.mood` | Emotional descriptors that guide overall feel |
| Camera | `camera.lens` + `camera.angle` + `camera.depthOfField` | Use real camera/lens refs: "Shot on [camera], [focal length] f/[aperture]" |

**Example generation:**

Input brief:
```json
{
  "scene": {
    "environment": "Semiconductor fabrication cleanroom, advanced node",
    "figures": "Two workers in bunny suits",
    "mood": "Precision, sterility, quiet intensity"
  },
  "camera": { "lens": "35mm", "angle": "Medium wide, hip level", "depthOfField": "Shallow" }
}
```

Generated prompt:
```
Interior of an advanced semiconductor fabrication cleanroom with yellow lithography lighting casting warm amber glow across white surfaces and HEPA-filtered ceiling. Two workers in full white bunny suits with completely smooth featureless faces behind clear shields, mannequin-like with no facial features, operating wafer handling equipment with practiced precision. Atmosphere of extreme sterility and quiet intensity. Shot on Sony A7IV, 35mm f/2.0, shallow depth of field, medium wide from hip level. Photorealistic rendering. 16:9 aspect ratio.
```

---

### Template B: Complex Scene (Multiple Subjects, Specific Spatial Layout)

Use JSON-structured prompt format. Flux 2 parses this natively for precise spatial control.

**Structure:**
```json
{
  "scene": "[Overall environment description]",
  "subjects": [
    {
      "description": "[Subject 1 with mannequin face spec]",
      "position": "[foreground/midground/background] [left/center/right]",
      "action": "[what they're doing]"
    }
  ],
  "style": "Cinematic documentary photography",
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "lighting": "[Specific lighting setup]",
  "mood": "[Emotional atmosphere]",
  "camera": {
    "angle": "[angle description]",
    "lens": "[focal length] f/[aperture]",
    "distance": "[shot type]"
  }
}
```

**When to use JSON vs. prose:**
- **Prose** (Template A): Single subject, straightforward environment, ≤2 figures. Most Parallax scenes.
- **JSON** (Template B): 3+ subjects, specific spatial relationships between elements, or when exact positioning matters for narrative clarity.

**Example generation:**

Input brief (conceptual corridor scene):
```json
{
  "scene": {
    "environment": "Modern corridor splitting into two paths",
    "figures": "Single figure at junction point",
    "mood": "Decision tension, diverging futures"
  },
  "camera": { "lens": "24mm", "angle": "Wide, one-point perspective", "depthOfField": "Deep" }
}
```

Generated prompt (JSON format):
```json
{
  "scene": "A long modern corridor with polished concrete floors that physically splits into two diverging paths ahead",
  "subjects": [
    {
      "description": "A person in a neutral gray suit with completely smooth featureless mannequin-like face, no eyes or mouth, natural human proportions and warm skin tone",
      "position": "midground center at the junction point",
      "action": "Standing with arms slightly raised in a gesture of weighing options"
    }
  ],
  "style": "Cinematic documentary photography, photorealistic",
  "color_palette": ["#E5A544", "#3266AD", "#1C1814"],
  "lighting": "Left path warm amber light hex #E5A544, right path cool blue light hex #3266AD, dramatic contrast at the split point",
  "mood": "Decision tension, two diverging futures made physical",
  "camera": {
    "angle": "Eye level, one-point perspective with vanishing point at the split",
    "lens": "24mm f/8",
    "distance": "Wide shot"
  }
}
```

---

### Template C: Historical Reconstruction

Adds period-specific cues and the editorial tone that signals "this is a reconstruction."

**Structure:**
```
[Period-specific interior/exterior with accurate furnishing details]. [Period-appropriate lighting — often warm, soft, suggesting vintage optics].
[Figures in era-correct clothing with completely smooth featureless mannequin-like faces].
[Period details that sell the era — objects, technology, materials]. Slightly desaturated color palette suggesting aged [film stock/photography].
Shot on vintage lens with soft edges, [focal length] equivalent. Documentary framing, [shot type]. Photorealistic rendering. 16:9 aspect ratio.
```

**Period-specific camera cues:**

| Era | Camera Reference | Color Cue | Detail Cues |
|-----|-----------------|-----------|-------------|
| 1940s | "Shot on vintage Leica lens, soft edges" | "Desaturated, warm sepia undertone" | Rotary phones, fountain pens, brass, venetian blinds |
| 1960s | "Shot on Kodak Ektachrome film" | "Rich but slightly muted, period Kodachrome quality" | Rotary dial, chrome, teak furniture, era-specific cars |
| 1970s-80s | "Shot on Kodak Portra 400 film" | "Warm grain, slightly faded" | Wood paneling, early CRT monitors, beige/brown tones |
| 1990s | "Shot on Canon EOS-1, 50mm f/1.4" | "Clean but pre-digital, film grain visible" | Chunky monitors, fax machines, early cell phones |
| 2000s-10s | "Shot on Nikon D3, 24-70mm" | "Early digital, slightly over-processed" | Flat screens, BlackBerries, modern but dated |

---

## Parallax-Specific Prompt Components

### The Mannequin Face Clause

Every prompt involving human figures MUST include one of these phrases (pick based on context):

**Close-up/medium shot (face prominent):**
```
completely smooth featureless face with no eyes, mouth, or nose detail, just gentle contours suggesting the planes of a human face, warm matte skin tone, mannequin-like
```

**Full body/wide shot (face smaller in frame):**
```
smooth featureless mannequin-like face with no facial features, natural human proportions and warm skin tone
```

**Behind mask/shield (cleanroom, military):**
```
completely smooth and featureless face behind [the shield/visor/mask], mannequin-like, no facial features visible
```

**Multiple figures (crowd/background):**
```
all figures have smooth featureless mannequin-like faces with no facial features, warm varied skin tones, natural body proportions
```

### Meridian Palette Color Codes

When brand colors appear in the scene, use hex codes with the "hex" keyword for precision:

| Color | Hex | When to Use |
|-------|-----|-------------|
| Ink | hex #1C1814 | Deep shadows, dark surfaces |
| Amber | hex #E5A544 | Warm highlights, accent lighting |
| Rust | hex #C23B22 | Tension elements, Chinese-associated |
| Bone | hex #F0E6D0 | Light surfaces, historical paper |
| Paper | hex #F5F0E8 | Bright backgrounds, clean surfaces |
| Oxblood | hex #6B1D1D | Dark accent, editorial emphasis |
| US Blue | hex #3266AD | American/Western-associated elements |
| China Red | hex #C23B22 | Chinese-associated elements |

**Usage rule:** Don't force brand colors into every prompt — most scenes should use natural lighting and let the LUT pass handle brand alignment. Only specify hex colors when the scene inherently features brand-relevant color (e.g., the warm/cool split in a conceptual corridor, or a display screen casting blue light in a command center).

### Camera Presets by Scene Type

| Scene Type | Camera Spec | Rationale |
|---|---|---|
| Facility walkthrough | "Shot on Sony A7IV, 35mm f/2.0" | Natural perspective, moderate DoF |
| Close-up detail | "Shot on Canon EOS R5, 85mm f/1.4" | Shallow DoF isolates subject |
| Wide establishing | "Shot on Sony A7IV, 24mm f/8" | Deep focus, everything sharp |
| Command center/tension | "Shot on Arri Alexa, 24mm f/2.8, slight dutch angle" | Cinematic tension |
| Historical reconstruction | "Shot on vintage [era] lens, 50mm, soft edges" | Period feel |
| Aerial/development | "Shot from helicopter, 70mm equivalent, f/5.6" | Aerial distance compression |
| Conceptual/metaphor | "Shot on Sony A7IV, 24mm f/8, one-point perspective" | Deep focus, spatial clarity |

### Lighting Presets by Treatment Type

These map to the three `treat_video.py` LUT passes:

| Treatment | Pre-LUT Lighting Guidance | Why |
|---|---|---|
| `standard` | "Warm natural lighting, slight amber cast from overhead sources, soft shadows" | The standard LUT pushes warm — start neutral-warm for clean result |
| `conflict` | "Cool blue ambient from screens/displays, dim overall exposure, harsh directional pools" | The conflict LUT pushes rust/red — cool blue input creates dramatic contrast |
| `editorial` | "Soft diffused daylight through windows, slightly flat exposure, minimal contrast" | The editorial LUT desaturates — start with low-contrast neutral for archival feel |

---

## Automated Prompt Generation Algorithm

When the visual-spec skill generates an AI video brief, it should automatically construct the Flux 2 Pro prompt using this logic:

```python
def generate_flux2_prompt(brief: dict) -> str:
    """
    Convert an AI video brief into an optimized Flux 2 Pro prompt.
    Follows BFL best practices: front-load subject, natural prose,
    camera specs, specific lighting, 50-70 words, positive phrasing only.
    """
    
    # 1. Determine template type
    num_figures = count_figures(brief["scene"].get("figures", ""))
    has_spatial_layout = brief.get("useCase") == "conceptual_scene"
    use_json = num_figures >= 3 or has_spatial_layout
    
    # 2. Select camera preset
    camera_spec = CAMERA_PRESETS[brief["useCase"]]
    if brief["camera"].get("lens"):
        camera_spec = f"Shot on Sony A7IV, {brief['camera']['lens']} f/{aperture_from_dof(brief['camera']['depthOfField'])}"
    
    # 3. Select lighting preset based on treatment
    lighting = LIGHTING_PRESETS[brief["treatment"]]
    
    # 4. Get mannequin clause based on figure proximity
    mannequin = get_mannequin_clause(brief["camera"]["angle"])
    
    # 5. Check if brand colors are needed
    colors = get_relevant_hex_codes(brief)
    
    # 6. Get period cues if historical
    period_cues = ""
    if brief["scene"].get("period") != "contemporary":
        period_cues = PERIOD_CAMERA[brief["scene"]["period"]]
    
    # 7. Assemble prompt (front-loaded subject, then details)
    if use_json:
        return assemble_json_prompt(brief, camera_spec, lighting, mannequin, colors)
    else:
        return assemble_prose_prompt(brief, camera_spec, lighting, mannequin, colors, period_cues)


def assemble_prose_prompt(brief, camera_spec, lighting, mannequin, colors, period_cues) -> str:
    """
    Assemble a natural prose prompt following the structure:
    Environment → Lighting → Figures → Atmosphere → Camera → Format
    Target: 50-70 words.
    """
    parts = []
    
    # Front-load: environment (most important)
    parts.append(brief["scene"]["environment"])
    
    # Lighting (biggest quality lever)
    parts.append(lighting)
    
    # Figures with mannequin clause (if present)
    if brief["scene"].get("figures"):
        parts.append(f"{brief['scene']['figures']}, {mannequin}")
    
    # Mood/atmosphere
    parts.append(f"Atmosphere of {brief['scene']['mood'].lower()}")
    
    # Camera specification (proven realism boost)
    if period_cues:
        parts.append(period_cues)
    else:
        parts.append(camera_spec)
    
    # Mandatory suffix
    parts.append("Photorealistic rendering. 16:9 aspect ratio.")
    
    return ". ".join(parts)
```

### Word Count Check

After generation, verify the prompt is 50-80 words. If over 80:
- Cut atmospheric adjectives (keep 1-2 max)
- Merge figure and environment descriptions
- Remove redundant "photorealistic" mentions (once is enough)

If under 50:
- Add more environmental detail (materials, textures, objects)
- Specify lighting direction more precisely
- Add a secondary atmospheric cue

---

## Quality Patterns (What Makes a Good Prompt)

### DO ✓

- **Specify materials:** "polished concrete floor," "brushed steel panels," "heavy wool fabric"
- **Name light sources:** "HEPA-filtered fluorescent overhead," "brass desk lamp," "bank of display screens"
- **Use spatial language:** "foreground left," "receding into background," "overhead at 45 degrees"
- **Reference real camera gear:** "Shot on Sony A7IV, 35mm f/2.0" (proven to improve realism)
- **Include scale references:** "vehicles visible on access roads below" (for aerials), "figure dwarfed by equipment"
- **Describe motion frozen:** "mid-stride," "hands positioned on keyboard," "arm reaching for switch"

### DON'T ✗

- ~~"high quality, 4k, detailed"~~ → Flux 2 Pro always renders at max quality; these waste tokens
- ~~"no blur, no artifacts, no distortion"~~ → No negative prompts; use "sharp focus throughout" instead
- ~~"masterpiece, best quality, ultra-detailed"~~ → NovelAI/SD-era garbage; does nothing in Flux 2
- ~~Comma-separated keyword lists~~ → Write prose; Flux 2's VLM parses natural language
- ~~"realistic face"~~ → For Parallax, we ALWAYS want "featureless mannequin-like face"
- ~~Describing what's NOT in the scene~~ → Only describe what IS present
- ~~Generic lighting~~ → "well-lit" is useless; "warm overhead fluorescent with amber cast" is useful

---

## Integration with Visual-Spec Skill

The visual-spec skill should use this system when generating AI video briefs (Step 5). For each `[AI-GEN:]` segment, the skill outputs:

1. The structured brief (as before — scene, camera, treatment, etc.)
2. **A pre-generated Flux 2 Pro prompt** in the `generation.referenceFramePrompt` field

This means the production workflow becomes:
1. Run visual-spec → get briefs with prompts already written
2. Draft in GPT Image 2 (free via ChatGPT Pro) to iterate on composition
3. Finalize in Flux 2 Pro via fal.ai (~$0.045/image at 1920×1080) — see `style-references/PROMPTS.md` for full provider comparison
4. Review reference frame
5. If good → animate with Kling 3.0
6. If not → iterate prompt (usually: adjust lighting or add more environmental detail)

The skill should generate the prompt using Template A (prose) by default, and Template B (JSON) only when:
- The scene has 3+ distinct subjects with specific spatial relationships
- The scene requires precise color placement (e.g., the warm/cool corridor split)
- The brief explicitly notes complex composition requirements

---

## Prompt Iteration Playbook

When a generated reference frame doesn't look right, these are the most effective adjustments:

| Problem | Fix |
|---------|-----|
| Too dark/moody | Add "well-exposed, balanced lighting" and name the light sources explicitly |
| Colors too saturated | Add "neutral color temperature, subtle natural tones" |
| Face concave/scooped | Reframe as "department store mannequin head on a human body" — describe surface as convex and protruding. This is the #1 issue, especially in GPT Image 2. |
| Face too realistic | Strengthen: "completely smooth featureless face, absolutely no eyes or mouth, ceramic-like surface" |
| Face too alien | Add "natural human head shape, warm skin tone, anatomically proportional" |
| Environment looks CG | Add specific camera reference "Shot on [real camera model]" + add material textures |
| Wrong scale/perspective | Change focal length (wider = more spatial, telephoto = compressed) |
| Too many details/cluttered | Reduce word count, focus on 2-3 key elements, remove secondary objects |
| Lighting fights the LUT | Match pre-generation lighting to treatment type (see Lighting Presets table) |
| Lacks atmosphere | Add volumetric cue: "subtle haze," "dust catching the light," "steam from vents" |
| Composition boring | Specify shot rule: "rule of thirds," "one-point perspective," "leading lines" |
