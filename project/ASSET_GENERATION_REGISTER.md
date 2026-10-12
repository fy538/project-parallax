# Asset Generation Register

> Canonical rules for generating AI-GEN stills and morph clips in Parallax episodes.
> Sibling of `TRANSITION_GRAMMAR.md`, `TEXT_ANIMATION_REGISTER.md`, and `HOLD_MOTION_REGISTER.md`.
>
> Last updated: 2026-05-21

---

## Pipeline position

```
visual-spec → shot-list.json (enriched with camera_move) → [asset-brief skill]
                                                                    ↓
                                                   chatgpt-prompts.md  +  morph-prompts.md
                                                                    ↓
                                                   Human pastes into ChatGPT / Kling / Hailuo
                                                                    ↓
                                           assets/stills/  →  reviewed  →  public/episodes/{slug}/
                                                                    ↓
                                                   Claude syncs: wires manifest, updates dashboard
```

The `asset-brief` skill generates the prompt documents. The generation itself (ChatGPT, Kling, Hailuo) is manual — these tools have no usable programmatic API. The sync after generation (disk scan → manifest wiring → dashboard update) is automated via `pipeline_validator.py`.

---

## Tool selection

| Asset type | Tool | Decision rule |
|---|---|---|
| New standalone still | ChatGPT | No anchor frame; establishing shot for a beat |
| Bridge still | ChatGPT | Anchor frame available; spatial continuation of existing still |
| Existing still → clip | Pika (preferred) / NLE Ken Burns fallback | Single still that needs subtle movement; Pika first, NLE if artifacts |
| Morph clip — figure/architecture-driven | Kling | Human figures, architectural spaces, camera push/pull/orbit; the change is spatial |
| Morph clip — geometry/texture-driven | Hailuo | Grid → table, terrain → interior, stone → ocean; the change is material/structural |
| Archival photo | Wikimedia Commons | Historical figures, real locations — never AI-generate archival content |

**Kling vs Hailuo decision rule:** if you can describe the transition as a camera move, use Kling. If you can only describe it as "X material becomes Y material," use Hailuo. Hybrid morphs (camera move + material change) default to Kling.

---

## ChatGPT — still generation

### Two-tier reference image system

Every ChatGPT generation session uses **two sets of reference images uploaded together at the start**. They do different jobs and both are required.

**Tier 1 — Broad style references** (`tools/ai-video/style-references/`)
15 images covering the full Parallax aesthetic vocabulary. Select 4–6 that match the episode's dominant registers. Upload these first.

| Episode register needed | Recommended refs |
|---|---|
| American institutional / constructivist (default) | r7, r8, r9, r14, r15 |
| Multi-figure diplomatic / corporate scenes | r14, r9, r7 |
| Conflict / adversarial scenes | r13, r9, r11 (use r11 only for explicit Soviet content) |
| Chinese subject matter | r2 or r5 (state) / r12 (classical) |
| Historical reconstruction | r6, r9 |

These refs lock the **Parallax house style** — the constructivist-editorial aesthetic that must be consistent across all episodes.

**Tier 2 — Episode-specific references** (`episodes/{slug}/assets/ep-refs/`)
4 images generated specifically for this episode. They lock the **spatial grammar** of this episode's particular scenes: lighting angles, setting types, figure scale, color balance in specific environments. Generate these before the main shot session by prompting ChatGPT for 4 representative scenes from the episode's visual world.

Upload order matters: **Tier 1 first, then Tier 2.** ChatGPT weights more-recent context more heavily, so the episode-specific refs should be the last thing it sees before your first shot prompt.

### Episode style block

Paste **once** at the start of each ChatGPT conversation, after uploading both tiers (Tier 1 broad refs first, then Tier 2 ep-refs):

```
I'm going to generate [N] images for a geopolitics video essay. I've uploaded
two sets of reference images:

- First [X] images: Parallax channel style references — these lock the overall
  aesthetic (constructivist editorial illustration, ink/amber/bone palette,
  angular figures). Maintain this style across every image.
- Next [Y] images: Episode-specific references — these lock the spatial grammar
  for this episode's particular scenes (lighting angles, settings, figure scale).
  Use them as scene anchors when my prompts reference similar environments.

Style rules that apply to every image:
- Constructivist editorial illustration — bold color-blocked forms, flat planes,
  no gradients, no soft airbrushed shading, no photorealism
- NOT a realist tradition: never a naturalistic or painterly oil painting, no
  realistic anatomy, no rendered/expressive faces, no volumetric or photographic
  light. Warmth and mood come from PALETTE and light WITHIN this flat constructivist
  register — never from switching art tradition.
- Palette locked to: ink #1C1814, amber #E5A544, bone #F0E6D0, with grey-green
  and walnut accents where natural. No other hues.
- Figures: angular, color-blocked silhouettes — no facial features, no skin
  rendering, no expressive detail. Clothing color-blocked in ink with bone accents.
- Cultural register: American mid-century institutional (Saul Bass, Fortune
  magazine, Push Pin Studios) — NOT Soviet propaganda unless explicitly requested
- Format: all images 16:9 wide landscape
- Text rule: English-only labels if any, or no text — no Cyrillic characters
- Treatment: [standard | conflict] — standard is default; conflict uses more ink,
  amber as tension accent, darker overall register

I'll generate one image at a time and tell you when each is approved before
moving to the next.
```

Replace `[N]`, `[X]`, `[Y]` with the actual numbers for your session.

### Per-shot prompt structure

**Standalone still** (no anchor frame): 3–5 sentences describing the scene, figures, light, color balance, mood. Number each: `Shot N.`

**Bridge still** (anchor frame available): open with the camera-move framing, then describe what's new.

```
Shot N. [Upload: aigen-XX-name.png as anchor frame.]
The camera has [dolly-in / pulled back / tilted up / pushed along / orbited right].
[Describe the new spatial focus — what's now in center frame that wasn't before.]
[Describe any new elements that appear at this scale/angle.]
[Color balance, light source, figure treatment — same register as anchor unless noted.]
```

### Pika-friendly design principles

Apply whenever the still will be animated (Pika or NLE Ken Burns):

1. **No detailed crowds.** Use abstract dots, color marks, or silhouette blobs — not recognizable figures with visible limbs. Pika animates humanoid shapes regardless of instructions.
2. **Figures must be dark silhouettes in static poses.** Standing, seated, arms at sides. Never mid-stride, mid-gesture, or running. Solid dark shapes with no facial features or visible hands.
3. **Minimize text.** Maximum 1–2 short labels, placed center-frame (not at edges). Text at edges will degrade to gibberish as the camera moves.
4. **Avoid deep one-point perspective.** It forces Pika to push-in. Use slight angles or flatter compositions.
5. **Create clear depth layers.** Distinct foreground / mid-ground / background with tonal separation — this drives Pika's parallax effect.
6. **No flickering light sources.** No candles, reflective water, sparkles, or anything that "should" move. Static ambient light only.

### Sophistication rules (anti-tacky) — read before writing any prompt

The audience is smart; the channel's lineage is Saul Bass / Fortune / mid-century editorial,
which is sophisticated *because it is restrained and oblique, never literal*. The failure mode
is a still that *decorates the idea* instead of *inhabiting it* (the `aigen-02` "equation-sun
over labeled buildings" was the canonical offender — May 23, 2026).

1. **No decorative math or text.** Any equation/formula/symbol must be REAL and load-bearing
   (the actual PD payoff matrix), or absent. Fake "math-salad" (random Σ, integrals, Greek
   letters) is the #1 tell of fake-smart and instantly loses a rigorous audience.
2. **Show the scene, not the symbol.** Render the concrete place where the idea *lives* (a
   committee room adopting the model), not an allegorical poster *about* it. The channel's
   power is "you are there," not "behold the Concept."
3. **One idea per frame.** No stacking redundant metaphors. Cut to the single strongest image.
   Redundancy reads as insecure over-explaining.
4. **No emanation clichés** — god-rays, halos, sunbursts, glowing-concept-radiating-power.
5. **Concrete & specific over generic icons.** A researched object/place beats archetypes.
   Never literal symbol-icons (`$` = money, scales = justice, dome = government, crest = academia).
6. **Restraint = sophistication.** Negative space + one visual "turn." If a frame is *trying to
   look smart*, it isn't. Ground every abstraction in a real scene with one intervention
   (the grid-on-landscape works; the equation-poster doesn't).
7. **No realist-tradition style anchors (the worst register drift).** Never name a realist
   painter or movement in a per-shot prompt to get a "warmer" or "more painterly" look —
   "Thomas Hart Benton / WPA mural / Hudson River / naturalistic / painterly oil" all pull
   ChatGPT straight to photoreal (volumetric light, real anatomy, rendered faces), violating
   the flat constructivist register (the `aigen-11` stag-hunt regen was the canonical offender,
   May 24 2026). Every shot must (a) restate the constructivist register, (b) **explicitly
   forbid realism**, and (c) lock to a constructivist reference image (e.g. `aigen-01`). Warm
   threads (the cooperation arc) get warmth from **palette**, not a different art tradition.

### Quality gate — after stills

- [ ] Palette check: dominant colors are ink `#1C1814`, amber `#E5A544`, bone `#F0E6D0`
- [ ] No Cyrillic text, no watermark; **no fake/decorative math or symbol-salad** (sophistication rule 1)
- [ ] **No literal symbol-icons or emanation clichés** (god-rays, `$`, crests) — rules 4 + 5
- [ ] **The frame inhabits a concrete scene, not an allegorical poster** — rule 2
- [ ] **Flat constructivist register — NOT a naturalistic/painterly oil painting** (no volumetric light, no realistic anatomy/rendered faces) — rule 7
- [ ] Faces: planar stylized for close figures; silhouettes only for distant/back-turned
- [ ] Bridge/morph stills: frame B edited from frame A (shared base), shift readable at a glance
- Regenerate if any principle is violated — don't patch in NLE

---

## Kling — morph clip generation

Use Kling when the transition is **camera-driven or figure-driven**: a spatial shift between two frames that share the same scene.

### Session settings (apply to all pairs in a session)

```
Tool:              Kling 3.0 Standard (or Pro for hero morphs)
Mode:              Image-to-video — start frame + end frame
Resolution:        1080p
Motion intensity:  LOW  (these are subtle editorial morphs, not action)
```

### Duration selection

| Pair type | Duration |
|---|---|
| Subtle push / dolly / tilt — same space, small shift | 6s |
| Figure-emergence or architectural transformation | 8s |
| HERO morph — pivotal editorial moment, single most important visual | 10s |

Mark one morph per episode as HERO maximum. If none qualifies, use 8s as the ceiling.

### Per-pair prompt structure

The prompt describes **only the change** — Kling already sees both frames. Never describe what stays static (mentioning it causes Kling to animate it). Camera-move language only.

```
[Start frame: aigen-XX-name.png]
[End frame:   aigen-YY-name.png]
[Duration: Ns]

[2–3 sentences describing the camera movement or the spatial/material change.
Only describe what transitions — what holds, holds by not mentioning it.
Use director-style language: "Camera pushes in toward..." / "Background elements
hold as foreground tightens..." / "The [specific element] resolves from X into Y."]

-neg flicker, morphing, warping, text drift, watermark, jitter, [shot-specific additions]
```

### Standard negative prompt

Every pair gets this base:
```
-neg flicker, morphing, warping, text drift, watermark, jitter
```

**Shot-specific additions:**

| What's in the frame | Add to negative prompt |
|---|---|
| Human figures | `figure walking, figure shifting pose, figure dancing, character motion` |
| Architectural elements | `wall shift, ceiling change, geometry warp` |
| Text or labels | `text animation, letter drift, typography change` |
| Light sources | `light flicker, pulsing, brightness shift` |
| Color palette | `palette change, color drift, saturation shift` |
| No camera movement intended | `camera move, camera pan, camera zoom` |
| Anime/stylized risk | `anime style, cartoon, photoreal texture` |

### Quality gate — after Kling clips

- [ ] Color-pick dominant hex on frame 1 and frame N — must match within 15%
- [ ] Static elements hold position throughout (mountains don't shift, walls don't wobble)
- [ ] Figure emergence (if any) reads as "reveal" not "ghost-smear"
- [ ] The clip feels like one continuous shot, not a cross-dissolve
- Re-run up to 3× for figure-introduction shots (highest variance). Document which attempt you kept.
- **Fallback:** if Kling fails at figure introduction after 3 attempts, generate an intermediate frame (scene without figures) and split into two smaller morphs.

---

## Hailuo — geometry/texture morph generation

Use Hailuo when the transition is **material or structural**: one kind of thing becomes another kind of thing (grid → table, terrain → interior, stone → ocean). The change is not a camera move — it's a world-change.

### Session settings

```
Tool:             Hailuo MiniMax Video  
Mode:             Image-to-video — start frame + end frame (or reference-to-video for multi-frame)
Resolution:       1080p
Motion intensity: LOW
```

### Per-pair prompt structure

Describe the **material transformation**, not the camera. What does the geometry do? What element dissolves into what?

```
[Start frame: aigen-XX-name.png]
[End frame:   aigen-YY-name.png]
[Duration: Ns]

[2–4 sentences describing what structurally changes: the grid resolves into table edges,
the terrain dissolves into stone walls, the water surface becomes open ocean. Describe the
transformation as a physical material process, not as a camera move. Name the key element
that transforms. Camera holds static unless explicitly noted.]

-neg flicker, warping, camera move, palette change, watermark, [shot-specific additions]
```

### When to use Hailuo over Kling

- The start and end frames are completely different *types* of space (outdoors → indoors)
- The change is geometric / textural (shapes form, dissolve, or coalesce)
- There are no figures to introduce (pure environment morphs)
- The scene has Kling failed on already at figure-introduction

### Quality gate — after Hailuo clips

- [ ] The transformation feels organic, not like a hard cut or cross-dissolve
- [ ] Palette consistency across the clip (amber/ink/bone dominant throughout)
- [ ] The key transforming element (grid / terrain / texture) resolves cleanly by final frame
- [ ] No photoreal texture intrusion (Hailuo can drift toward photorealism — watch for it)

---

## Vidu Q1 — multi-frame reference (experimental)

Use for shots where Kling C→D fails on figure introduction: Vidu accepts up to 7 reference images and interpolates across all of them in one clip, which can distribute the figure-emergence risk across more frames.

```
Mode:             Reference-to-video (all frames in order)
Motion intensity: LOW
Prompt:           Describe the full arc across all frames in 3–5 sentences.
                  Constructivist editorial illustration. Bold color-blocked forms.
                  Ink, amber, bone palette. No gradients, no photoreal texture.
```

This is the fallback of last resort. Document what failed on Kling/Hailuo before reaching for Vidu.

---

## Failure modes and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| Figure-smear (ghost between poses) | Kling variance on figure introduction | Re-run 2× more; if still failing, generate intermediate frame without figures |
| Palette drift (amber becomes orange/yellow) | Hailuo or Kling color instability | Run a snap-to color grade in DaVinci after generation (pick ink + amber hex from frame 1, apply as snap) |
| Geometry warp (walls wobble, grid shimmers) | Motion intensity too high | Re-run with explicit `-neg geometry warp, wall shift` added |
| Text degrades to gibberish | Text in frame + camera move | Regenerate still without text, or use NLE Ken Burns zoom instead of Pika |
| Cross-dissolve feel (A fades out while B fades in) | Kling treating morph as transition | Re-run with explicit "Camera holds static" at start of prompt |
| Photoreal texture intrusion | Hailuo style drift | Add `-neg photoreal, photography, realistic skin, photograph` to negative prompt |

---

## Archival stills — intake workflow

Archival stills (Wikimedia Commons photographs) require a brand LUT treatment step before they
enter the render pipeline. Raw downloads are photorealistic; treated versions match the
ink / amber / bone register of the AI-GEN stills.

### Download and verify

1. Search Wikimedia Commons — prefer JPG ≥ 1280px wide, license CC-BY or PD.
2. Confirm no recognizable watermarks or restrictive non-commercial-only clauses.
3. Save to `episodes/{slug}/assets/stills/arch-{id}.jpg` (working copy — never commit raw).

### Apply the brand LUT

```bash
# Standard LUT treatment for archival stills (ink/amber/bone grade):
python3 tools/brand-treatment/treat_video.py \
    episodes/{slug}/assets/stills/arch-{id}.jpg \
    --ramp standard \
    -o /tmp/arch-{id}-treated.jpg

# Inspect the output in any image viewer before approving.
# If the original photo is already very dark, try --ramp conflict (heavier ink).
```

The `treat_video.py` tool applies the Parallax colour ramp (ink desaturation + amber push +
bone highlight). `--ramp standard` is right for most archival photographs. Use `--ramp conflict`
only if the treated result reads as washed-out (overexposed original photos may need the heavier
treatment to read correctly in the Meridian Dark register).

### Quality check after treatment

- [ ] Dominant colours shift toward ink `#1C1814` (shadows), amber `#C4A747` (midtones), bone `#F0E6D0` (highlights)
- [ ] Faces (if any) are legible — not crushed to silhouette
- [ ] No colour banding or LUT artefacts at highlight→shadow transitions
- If unsatisfied after treatment: re-run with `--saturation 0.6` (lower saturation = drier, more editorial feel)

### Approve and place

```bash
# Copy treated version to the render-ready public folder:
cp /tmp/arch-{id}-treated.jpg \
   remotion-templates/public/episodes/{slug}/stills/arch-{id}.jpg

# Wire into manifest (preferred: use --intake flag):
python3 tools/pipeline_validator.py --intake {slug} arch-{id}

# Or wire manually: find all FOOTAGE segments for this asset in assembly-manifest.json
# and set asset.file = "stills/arch-{id}.jpg", asset.status = "resolved",
# asset.source = "wikimedia-commons".
```

### Note on the `arch-nash.jpg` reference implementation

`remotion-templates/public/episodes/prisoners-dilemma/stills/arch-nash.jpg` was wired as a
raw download (untreated) as a quick win. Apply the LUT treatment before the final render:

```bash
python3 tools/brand-treatment/treat_video.py \
    remotion-templates/public/episodes/prisoners-dilemma/stills/arch-nash.jpg \
    --ramp standard \
    -o /tmp/arch-nash-treated.jpg
cp /tmp/arch-nash-treated.jpg \
   remotion-templates/public/episodes/prisoners-dilemma/stills/arch-nash.jpg
```

---

## Per-episode init checklist

When starting visual production for a new episode:

- [ ] `shot-list.json` created with all assets, including `status: "NEW"` bridge stills and `camera_move` field on each
- [ ] `morph_pairs[]` defined with `from`, `to`, `tool`, `duration_sec`, `intent`
- [ ] Select 4–6 broad style refs from `tools/ai-video/style-references/` matching episode registers → copy to `assets/style-refs-resized/`
- [ ] Generate 4 episode-specific refs in ChatGPT → save to `assets/ep-refs/ep-ref-{1-4}-*.png`
- [ ] Run `asset-brief` skill → generates `chatgpt-prompts.md` + `morph-prompts.md`
- [ ] `asset-registry.json` created (use `episodes/prisoners-dilemma/asset-registry.json` as template)
- [ ] Pipeline validator wired: `python3 tools/pipeline_validator.py --write-status {slug}`

---

## Reference files

| Document | Location | Purpose |
|---|---|---|
| Pika-friendly principles (extended) | `episodes/prisoners-dilemma/visual-pipeline.md` | Original source; superseded by this register |
| Bakeoff morph examples | `episodes/prisoners-dilemma/bakeoff/scene-c-morph-prompts.md` | Kling prompt structure reference |
| Prompt outputs (PD episode) | `episodes/prisoners-dilemma/prompts/chatgpt-prompts.md` (v3 — full fresh 29-shot session) + `prompts/morph-prompts.md` | Reference implementation |
| Broad style ref library | `tools/ai-video/style-references/` (15 images + INDEX.md) | Tier 1 refs; select 4–6 per episode |
| Episode-specific refs | `episodes/{slug}/assets/ep-refs/` (4 images) | Tier 2 refs; generated fresh per episode |
