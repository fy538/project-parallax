# Parallax — Prompt Preambles

> Created: May 4, 2026
> Updated: May 4, 2026 — Migrated from photoreal-mannequin (3 isolated preambles) to unified constructivist (1 base + 3 component blocks).
> Owner: tools/recraft/recraft.py (`CONSTRUCTIVIST_BASE_PREAMBLE` + component dicts)
> Related: VISUAL_LANGUAGE.md (registers), AI_VIDEO_PIPELINE.md ("Stylized Constructivism" aesthetic), TYPOGRAPHY_TRADITIONS.md (per-scene typography), palette.json (colors), tools/brand-treatment/ (LUT pass).

## What this document is

The design rationale and architecture of the prompt preambles that get composed for every Recraft API call. This is the *prompt-level* half of Parallax's two-stage brand unification architecture.

## Why this exists

The brand-treatment LUT pipeline (`treat.py`, `treat_video.py`) was originally the only mechanism for unifying source imagery to brand. That works but has limits: when the source image is far off-brand (cool corporate blue, fluorescent cleanroom, generic stock-photo aesthetic), the LUT has to do heavy color rescue, which produces obvious cross-talk, muddy shadows, and clipped highlights — the "obvious LUT" feel.

The fix: do brand work earlier in the pipeline. If the source image already lands in the warm-umber-amber zip code with constructivist composition, the LUT does the final 10% polish instead of 60% rescue. Result: more naturalistic outputs, more cohesion across registers.

This is how cinematographers think about it. You light *for* the grade, not against it. Roger Deakins' Sicario lighting palette is already 80% of the final film look; the colorist nudges, doesn't transform.

## Architecture: two stages

```
   Description (from script right column)
              │
              ▼
   ┌──────────────────────────────────┐
   │  STAGE 1: Prompt-level (here)    │
   │                                  │
   │  CONSTRUCTIVIST_BASE_PREAMBLE    │
   │   + REGISTER_FOCUS_BLOCKS[r]     │
   │   + REALISM_DOSAGE_BLOCKS[d]     │
   │   + TYPOGRAPHY_BLOCKS[t]         │
   │   + description                  │
   │   + context                      │
   │   + NEGATIVE_PROMPT_BLOCK        │
   └──────────────────────────────────┘
              │
              ▼
       Recraft V3 API
              │
              ▼  (raw on-brand-ish output)
   ┌──────────────────────────────────┐
   │  STAGE 2: Treatment-level        │
   │                                  │
   │  treat.py (raster) /             │
   │  treat_video.py (video) /        │
   │  apply_duotone_svg (vector)      │
   │    Duotone LUT                   │
   │    Grain overlay                 │
   │    Vignette                      │
   └──────────────────────────────────┘
              │
              ▼
   Brand-locked asset → Remotion / NLE
```

Either stage alone is weaker than both together. The May 4 migration also unified Stage 1 across registers: the prior architecture had three separate preambles (atmospheric, grounding, analytical) with completely different aesthetics; the current architecture has *one* base aesthetic (constructivist) and three composition blocks that vary by parameter (register, realism, typography). This collapse simplifies coherence work and makes the channel's visual identity radically more distinctive.

## The unified constructivist aesthetic

Per VISUAL_LANGUAGE.md, Registers 2 (atmospheric backgrounds) and 3 (grounded figurative scenes) now share the same visual language: constructivist illustration drawing on Alexander Rodchenko, El Lissitzky, John Heartfield, and Frans Masereel. Bold compositional confidence, color-blocked forms with no soft shading or gradients, restricted warm palette anchored to palette.json. This replaces the earlier split (atmospheric = constructivist, grounding = photoreal mannequin) — see "May 4 migration" below for the rationale.

The constructivist tradition is uniquely fit for Parallax because it can render *both* atmospheric mood (industrial systems, civilizational scale) *and* grounded subjects (workers in fabs, signings, meetings) in the same vocabulary. Heartfield's photomontages did this exact trick — political abstraction and reportage in one visual language. So the channel isn't improvising; it's reaching for a tradition that's already solved this exact problem.

## The four composition blocks

Each Recraft prompt is composed from four blocks that compose into a single text string. The full block text lives in `tools/recraft/recraft.py`; this section is the explanatory layer.

### Block 1: `CONSTRUCTIVIST_BASE_PREAMBLE`

The unified aesthetic vocabulary. Always present. Contains:
- Style anchors (Rodchenko, Lissitzky, Heartfield, Masereel)
- Compositional principles (bold, color-blocked, no soft shading)
- Restricted palette with explicit hex codes from palette.json (ink, walnut, umber, gold, rust, bone, paper)

Length: ~500 chars. This is the single longest block and it's identical for every prompt. Recraft sees these literal hex codes and palette anchors and stays disciplined to brand.

### Block 2: `REGISTER_FOCUS_BLOCKS[register]`

The register's editorial role. Three values:

- **`atmospheric`** — Subjects: industrial systems, abstract forces, civilizational mood. Compositions are monumentalist, propaganda-poster scale. Used as background at 30-40% opacity.
- **`grounding`** — Subjects: figures in environments, people navigating systems. Figures rendered with simplified planar features (geometric facets, eyes obscured by lens shadow / hat brim / visor / hair). Foreground use.
- **`analytical`** — Subjects: diagrammatic, code-clean. Note: most analytical content should be Remotion, not Recraft — this block exists for the rare illustrated-diagram fallback.

Length: ~300-400 chars per block. The register block is what tells Recraft whether to depict a system (atmospheric) or a scene with people (grounding) — the visual grammar is shared but the subject focus differs.

### Block 3: `REALISM_DOSAGE_BLOCKS[realism]`

The realism dosage knob. Three values, with one critical distinction: **the dosage controls environment realism only — figures stay fully flat-constructivist at all three values.** This was the May 4 v1 lesson: the original "balanced" dosage allowed realism to leak into figures, which produced an under-stylized Beijing-apartment face that landed in the uncanny valley sideways. The fix was to lock the figure standard across all three dosages and let only the environment vary.

- **`flat`** — Both figure AND environment fully color-blocked. No photographic texture, no shading, no gradients. **Required for animated AI-GEN clips** — animation stability needs maximum flatness because color-blocked forms track reliably across frames whereas photographic textures drift severely. Best for monumentalist industrial scenes, propaganda-poster moments, atmospheric backgrounds, and any clip that will be animated.
- **`balanced`** (default for stills) — Figure stays flat-constructivist (4-5 color-blocked face planes, no skin tonality, no rendered features). Environment may have selective material texture: paper grain, light gradients, wood grain, dust haze. Most-used dosage; works for most scenes from intimate domestic to industrial.
- **`grounded`** — Figure stays constructivist; environment rendered with photographic spatial detail. **Stills only** — animation drift becomes severe at this dosage. Best for restricted-facility reconstruction stills that get Ken-Burned, never animated.

The dosage is the editorial knob the script uses to control how *interpreted* a scene feels and — equally important — whether the asset can be safely animated. The animation-flat rule means animated clips must use `flat`; visual-spec should enforce this and render-qa should flag violations.

**Why the figure stays flat at all dosages:** the May 4 v1 Beijing-apartment generation produced a face that *tried* for realism within constructivist palette constraints — visible nose contour, slight skin tonality, jawline reading as anatomically real. Tiger correctly identified this as worse than either pure photoreal or pure constructivist; it sat in the uncanny zone where the stylization wasn't doing real work. The fix: commit harder to graphic stylization. Faces become 4-5 distinct color-blocked planes (Rodchenko 1924 portrait series, Lissitzky Self-Portrait references in the preamble), no continuous skin tonality, no rendered features. This holds across all dosages because the failure mode (uncanny realism leak on figures) is the same regardless of environment realism.

### Block 4: `TYPOGRAPHY_BLOCKS[text_treatment]`

The per-scene typography tradition — and, post-May 4 architectural extension, the per-scene **palette emphasis** and **compositional emphasis** as well. Each block now does three things, not one. Nine values, full visual grammars in TYPOGRAPHY_TRADITIONS.md:

- `none` — no text in scene; uses brand default palette
- `english_minimal` — period-natural English signage only; neutral palette emphasis
- `english_modernist` — Push Pin / Saul Bass / Fortune typography; *softer* palette (walnut/umber/gold/bone, rust as sparing accent only); balanced asymmetric editorial composition
- `russian_constructivist` — Soviet propaganda typography; *full saturated* revolutionary palette; diagonal monumentalist composition
- `chinese_propaganda` — Cultural Revolution / Reform Era heiti; *Chinese vermillion* palette (warmer than Russian crimson, lacquer-influenced); frontal/vertical composition
- `chinese_minimal` — period-natural Chinese signage only; neutral palette
- `chinese_traditional` — pre-revolutionary Chinese (calligraphy, classical); *ink-wash* palette with sparse red seal accents only
- `japanese_showa` — Showa-era propaganda typography; *minimal* palette (black/red/cream only, 2-3 colors); vertical composition
- `mixed` — multiple traditions in one frame (rare); each half uses its tradition's palette + composition

Each block contains: typography (typeface, script, weight, period-appropriate phrases), **palette emphasis** (which subset of the brand palette to foreground), **compositional emphasis** (which graphic-grammar rules to apply), and accuracy guardrails ("real Cyrillic, not mock-script"). The block's length varies from 0 chars (`none`) to ~1100 chars (`english_modernist` is now the longest because of the explicit Soviet-counterweight language).

**Why the typography block does palette work too.** The May 4 v1 Silicon Valley test surfaced a real problem: the constructivist BASE preamble defaults to Soviet/German intensity (Rodchenko, Heartfield, Masereel, full revolutionary palette, diagonal monumentalist composition). A scene with English Modernist typography on a 2026 Silicon Valley office still *visually* read as Soviet propaganda — the colors and composition came from the base, not the typography. The fix: each typography block provides cultural counterweight when the scene's geography doesn't match Soviet revolutionary aesthetic. American mid-century pulls toward softer walnut/umber/gold (Bass/Push Pin/Harper restraint) and balanced asymmetric editorial layouts. Chinese pulls red toward vermillion (lacquer-influenced) and emphasizes verticality. Japanese Showa minimizes to black/red/cream with vertical compositions. Russian Constructivist keeps full Soviet intensity (this is what the base already defaults to). The brand palette range stays constant (palette.json); per-tradition emphasis specifies which colors to foreground.

The typography decision is per-scene editorial: see TYPOGRAPHY_TRADITIONS.md for the three editorial modes (pragmatic, contextual-by-episode, sophisticated) and the decision logic. The script's angle memo specifies which traditions the episode will use; the shot list records the per-shot value as `text_treatment`.

### Block 5: `NEGATIVE_PROMPT_BLOCK`

Shared across all prompts. Targets predictable failure modes: Adobe stock aesthetic, Memphis design, isometric perspective, photoreal mannequin smoothing (forbidden post-May 4), mock-script gibberish in non-English typography. Length: ~500 chars.

## Total prompt budget

A typical composed prompt is ~2000-2700 chars depending on which typography block is selected. This is well within Recraft V3's prompt limits and produces consistent outputs. The four-block composition means the channel can iterate on any single block (e.g., refining the constructivist base aesthetic) without rewriting all prompts — the parameterization is doing real work.

## Decision logic: composing a prompt

When a script needs an illustrated visual:

1. **Pick the register.** Atmospheric (system mood, background use) or grounding (figurative scene, foreground use)? Analytical (Remotion fallback) is rare.
2. **Pick the realism dosage.** Flat for propaganda-poster intensity; balanced for most scenes; grounded for spatial-presence moments.
3. **Pick the typography tradition.** Default to contextual-by-episode (Chinese for Chinese-coded scenes, Russian for Soviet-bloc, etc.). Use `none` or minimal variants for transitional moments. Use sophisticated mismatch (Soviet typography on US scene) for peak analytical moments — sparingly.
4. **Record on the shot list** as `register`, `realism`, `text_treatment` fields per `data/shot-list.schema.json`.
5. **Run** `python tools/recraft/recraft.py batch shot-list.json` to generate.
6. **Stage 2 LUT** runs after generation via `treat.py` or `treat_video.py` to land everything in brand palette finally.

## May 4, 2026 migration: from photoreal mannequin to constructivist

Before May 4, 2026, the architecture had three separate aesthetic preambles:
- Register 2 atmospheric: constructivist illustration
- Register 3 grounding: photoreal environments + smooth featureless mannequin faces
- Register 1 analytical: code-clean diagram fallback

The mannequin convention was abandoned for three reasons:

1. **It had become a category marker.** Every AI-geopolitics-explainer channel that emerged in 2024-2026 adopted the smooth-faceless-mannequin aesthetic. By May 2026, viewers were starting to read "smooth featureless face" as "AI-generated channel" — a genre marker, not an editorial choice. Parallax inherited that visual baggage by default.

2. **It created a coherence seam.** Atmospheric (illustrated) and Grounding (photoreal) had completely different visual DNA. Unifying them required heavy LUT work and was never fully successful — the photoreal scenes always read as imported from a different medium than the illustrated ones.

3. **The constructivist alternative tested better.** Tiger generated four test scenes on May 4, 2026 — three industrial cleanroom variations and one intimate domestic Beijing-apartment scene. The constructivist aesthetic held across all four, with a usable realism dosage spectrum (image-4 flat to image-3 grounded) and demonstrated range from monumentalist propaganda-poster to eye-level intimate. The Beijing apartment specifically validated that the aesthetic doesn't force monumentalism on quiet scenes.

The migration cost was text edits across 8 files (recraft.py, shot-list.schema.json, VISUAL_LANGUAGE.md, AI_VIDEO_PIPELINE.md, EDITORIAL_PLAYBOOK.md, this doc, the silicon-trap shot list, and PROMPTS.md/generate_style_refs.py). No episodes had shipped yet, so no rendered assets needed regeneration. The cost would have been substantial after EP01 launched.

## Recommended A/B test (still valid post-migration)

To validate the prompt-level pass actually does work, run a four-way comparison on the same scene:

1. **Raw** — `recraft.py generate "scene description" --raw -o test_1_raw.png`
2. **Mode-only** (legacy) — `recraft.py generate "scene description" --mode illustration -o test_2_mode.png`
3. **Constructivist preamble only** — `recraft.py generate "scene description" --register grounding --realism balanced --text-treatment none -o test_3.png`
4. **Constructivist preamble + treat** — `recraft.py generate "scene description" --register grounding --realism balanced --text-treatment none -o test_4.png`, then `treat.py test_4.png --ramp standard -o test_4_treated.png`

Cohesion should improve monotonically: 4 > 3 > 2 > 1. If 4 ≈ 3 (treatment adds nothing), the preamble is over-constrained. If 3 ≈ 1 (preamble adds nothing), Recraft isn't following it — possibly too long, possibly too abstract.

## Maintenance

When updating preambles:

1. Edit the relevant block in `tools/recraft/recraft.py` (CONSTRUCTIVIST_BASE_PREAMBLE / REGISTER_FOCUS_BLOCKS / REALISM_DOSAGE_BLOCKS / TYPOGRAPHY_BLOCKS / NEGATIVE_PROMPT_BLOCK).
2. Regenerate any reference images that were generated under the old block text.
3. Update this doc and (if relevant) VISUAL_LANGUAGE.md / AI_VIDEO_PIPELINE.md / TYPOGRAPHY_TRADITIONS.md to match.
4. Note the change in DECISIONS.md or EDITORIAL_PLAYBOOK.md if it's a meaningful aesthetic shift.

When adding a new typography tradition:

1. Add the block to `TYPOGRAPHY_BLOCKS` in `tools/recraft/recraft.py`.
2. Add the value to the `text_treatment` enum in `data/shot-list.schema.json`.
3. Add the corresponding entry to TYPOGRAPHY_TRADITIONS.md (visual markers, sample phrases, avoidance notes).
4. Test the new block on a representative scene before committing to it editorially.

When updating the brand palette in `palette.json`:

The hex codes embedded in CONSTRUCTIVIST_BASE_PREAMBLE must be updated by hand. They are *deliberately* duplicated rather than imported, because Recraft sees the literal characters of the prompt and benefits from hex codes appearing inline. A future refactor could template these from `palette.json` at runtime, but it's not worth the indirection until palette changes happen frequently.

## Open questions

1. **Per-shot negative prompt overrides.** Some shots may need to relax a negative (e.g., an atmospheric piece that *should* have a single isometric element, or a grounded scene that *should* incorporate a Memphis-design poster as period detail). Current API only accepts the full negative block. Consider adding a `negative_override` field to shot-list.json.
2. **Style reference images vs. textual preambles.** Recraft V3 supports style reference images. Once the v0 reference library (per AI_VIDEO_PIPELINE.md) is generated under the new constructivist approach, test whether reference images replace or complement the textual preamble. Hypothesis: reference image + minimal textual preamble outperforms full textual preamble alone, because Recraft's visual conditioning is more reliable than its prompt-following for stylistic specifics.
3. **Conflict register flavor.** The LUT has three flavors (standard / conflict / editorial); the realism dosage has three values (flat / balanced / grounded). These are orthogonal but might want to interact — e.g., a `conflict` LUT shot might want a grimmer constructivist mood baked into the preamble too. Consider adding a fourth parameter (`mood` or `tone`) if the orthogonality stops working in production.
4. **Typography accuracy at scale.** As the channel covers more regions, the typography accuracy bar gets harder. Tiger's bilingual fluency is the quality gate for Chinese; for Russian/Japanese/other languages, what's the verification process? Native-speaker review per episode? Curated phrase library? Recraft fluency tests per release?
