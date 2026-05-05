# Parallax Style References — Index

Quick-map of the canonical style reference library. Full prompt details in [PROMPTS.md](PROMPTS.md). Generate via `python ../generate_style_refs.py --all` (uses Flux 2 Pro on fal.ai).

| # | Name | Filename | Locks | LUT |
|---|------|----------|-------|-----|
| 1 | constructivist-face | `style-ref_face_planar-neutral_v1.png` | Planar-face standard for grounded scenes | standard |
| 2 | cleanroom-flat | `style-ref_industrial_cleanroom-flat_v1.png` | `realism: flat` + Chinese propaganda typography | standard |
| 3 | cleanroom-grounded | `style-ref_industrial_cleanroom-grounded_v1.png` | `realism: grounded` (same scene, more spatial detail) | standard |
| 4 | atmospheric-trap | `style-ref_atmospheric_trap-encirclement_v1.png` | Register 2 backdrop usage at low opacity | standard |
| 5 | domestic-intimate | `style-ref_domestic_beijing-apartment_v1.png` | Constructivist at conversational human scale + chinese_minimal typography | standard |
| 6 | historical-modernist | `style-ref_historical_1941-american_v1.png` | Historical reconstruction + English Modernist typography | editorial |
| 7 | conceptual-corridor | `style-ref_conceptual_corridor-splitting_v1.png` | Physical metaphor for abstract concepts | standard |

## Coverage matrix

What's tested:

| Aspect | Where it's locked |
|---|---|
| Planar facial stylization | #1 (close-up), #2-7 (in scene) |
| `realism: flat` dosage | #2, #4, #7 |
| `realism: balanced` dosage | #5 |
| `realism: grounded` dosage | #3, #6 |
| `text_treatment: none` | #1, #4, #7 |
| `text_treatment: chinese_minimal` | #5 |
| `text_treatment: chinese_propaganda` | #2, #3 |
| `text_treatment: english_modernist` | #6 |
| Register 2 (atmospheric backdrop) | #4 |
| Register 3 (grounded figurative) | #1, #2, #3, #5, #6, #7 |
| `treatment: standard` LUT | #1-5, #7 |
| `treatment: editorial` LUT | #6 |
| `treatment: conflict` LUT | (gap — add as #8 if needed for adversarial-scene reconstruction) |

## What's not yet covered (future references)

When the channel grows beyond Arc 1, these are likely v2 additions:

- `russian_constructivist` typography reference (no Soviet-bloc episode yet, so not generated yet)
- `japanese_showa` typography reference (similar — not needed until a Japan-focused episode)
- `chinese_traditional` typography reference (pre-revolutionary Chinese — for future episodes about classical Chinese thought)
- Adversarial scene reference (military command, sanctions enforcement) — would use conflict LUT
- A Vietnamese or Korean reference — fold into typography vocabulary as those geographies enter the topic queue

These are deliberately deferred until production demand materializes. Generating speculative references commits to aesthetic decisions ahead of the editorial questions that should drive them.

## Maintenance

When a reference is regenerated:

1. Bump the version suffix (e.g., `_v1` → `_v2`) and keep the previous version for git history.
2. If the regeneration changes the canonical aesthetic in a meaningful way (not just a minor iteration), update the prompt in `generate_style_refs.py` and document the change in PROMPTS.md.
3. If the aesthetic shift is large enough to affect existing rendered episodes, add a note to `EDITORIAL_PLAYBOOK.md` revision history.
