# Parallax Style References — Index

Quick-map of the canonical style reference library. Full prompt details in [PROMPTS.md](PROMPTS.md). Generate via `python ../generate_style_refs.py --all` (uses Flux 2 Pro on fal.ai).

| # | Name | Filename | Locks | LUT |
|---|------|----------|-------|-----|
| 1 | constructivist-face | `r1_constructivist_face.png` | Planar-face standard for grounded scenes | standard |
| 2 | cleanroom-flat | `r2_cleanroom_flat.png` | `realism: flat` + Chinese propaganda typography | standard |
| 3 | cleanroom-grounded | `r3_cleanroom_grounded.png` | `realism: grounded` (same scene, more spatial detail) | standard |
| 4 | atmospheric-trap | `r4_atmospheric_trap.png` | Register 2 backdrop usage at low opacity | standard |
| 5 | domestic-intimate | `r5_domestic_intimate.png` | Constructivist at conversational human scale + chinese_minimal typography | standard |
| 6 | historical-modernist | `r6_historical_modernist.png` | Historical reconstruction + English Modernist typography | editorial |
| 7 | conceptual-corridor | `r7_conceptual_corridor.png` | Physical metaphor for abstract concepts | standard |
| 8 | bauhaus-educational | `r8_bauhaus_educational.png` | Bauhaus design-school discipline (educational/framework scenes) | standard |
| 9 | american-modernist-fortune | `r9_american_modernist_fortune.png` | Fortune-magazine / Saul Bass / Push Pin American mid-century | standard |
| 10 | japanese-showa-modernist | `r10_japanese_showa.png` | Kamekura / Tanaka post-war Japanese modernism (NOT pre-war propaganda) | editorial |
| 11 | russian-constructivist-canonical | `r11_russian_constructivist.png` | Soviet Constructivist canonical (deployed deliberately for Soviet content) | conflict |
| 12 | chinese-traditional-scholar | `r12_chinese_traditional.png` | Pre-revolutionary Chinese / classical scholarly (literati ink-wash) | standard |
| 13 | adversarial-warroom | `r13_adversarial_warroom.png` | Non-Soviet adversarial scene (American military, conflict-treatment palette without revolutionary coding) | conflict |
| 14 | multi-figure-boardroom | `r14_multifigure_boardroom.png` | Multi-figure group dynamics (4-6 figures, diplomatic / corporate / institutional) | standard |
| 15 | neutral-channel-default | `r15_neutral_default.png` | Channel's neutral default visual identity (no specific cultural geography); channel art, banner, default thumbnail anchor | standard |

## Coverage matrix

What's tested:

| Aspect | Where it's locked |
|---|---|
| Planar facial stylization | #1 (close-up), #2-14 (in scene; #15 has no figures) |
| `realism: flat` dosage | #2, #4, #7, #11, #15 |
| `realism: balanced` dosage | #5, #8, #9, #10, #12, #13, #14 |
| `realism: grounded` dosage | #3, #6 |
| `text_treatment: none` | #1, #4, #7, #15 |
| `text_treatment: english_minimal` | #8 (Bauhaus typography minimal labels), #14 (boardroom signage) |
| `text_treatment: english_modernist` | #6, #9 |
| `text_treatment: russian_constructivist` | #11 |
| `text_treatment: chinese_propaganda` | #2, #3 |
| `text_treatment: chinese_minimal` | #5 |
| `text_treatment: chinese_traditional` | #12 |
| `text_treatment: japanese_showa` | #10 |
| Register 2 (atmospheric backdrop) | #4, #15 |
| Register 3 (grounded figurative) | #1, #2, #3, #5, #6, #7, #8, #9, #10, #11, #12, #13, #14 |
| `treatment: standard` LUT | #1-5, #7, #8, #9, #12, #14, #15 |
| `treatment: editorial` LUT | #6, #10 |
| `treatment: conflict` LUT | #11, #13 |
| Cultural emphasis: soviet | #11 |
| Cultural emphasis: american-modernist | #6, #9, #14 (and base for #15) |
| Cultural emphasis: chinese-state | #2, #3 |
| Cultural emphasis: chinese-traditional | #12 |
| Cultural emphasis: japanese-showa | #10 |
| Cultural emphasis: neutral | #1, #4, #7, #8, #15 |
| Multi-figure group dynamics (4+ figures) | #13 (5 figures), #14 (6 figures) |
| Single-figure intimate scenes | #5, #12 |
| Industrial/monumentalist scenes | #2, #3, #11 |
| Conceptual / metaphor scenes | #4, #7 |
| Historical reconstruction | #6 (American 1941), #11 (Soviet 1930), #12 (Chinese 1923) |
| Adversarial / conflict scenes | #11 (Soviet), #13 (American non-Soviet) |
| Channel default (no cultural geography) | #15 |

Post-May 4 calibration round 3: the canonical library now covers all major content types the channel will encounter in EP01-EP10. References #1-7 establish the foundational anchors. References #8-11 broaden the 20th-century constructivist family beyond Soviet/German political-art lineage. References #12-15 close coverage gaps (chinese_traditional for classical Chinese content, adversarial-warroom for non-Soviet conflict scenes, multi-figure-boardroom for group dynamics, neutral-channel-default for the channel's identity anchor).

## What's not yet covered (deferred until production demand materializes)

When the channel grows beyond Arc 1 and the topic queue expands beyond the current cultural-context coverage, these are likely v2 additions:

- British industrial modernism reference (E. McKnight Kauffer / Edward Bawden — for British-coded content; partially covered by general American Modernist tradition until British-specific episodes warrant)
- Mexican muralism reference (Rivera / Orozco — for Latin American content)
- Polish Poster School / Czech avant-garde reference (1950s-70s Eastern European poster art — distinct from Soviet propaganda)
- Vietnamese / Korean / South-Asian references — fold into typography vocabulary as those geographies enter the topic queue
- Pure landscape / no-figure reference (mountain pass, urban skyline, coastline — covered partially by #4 atmospheric-trap and #15 neutral-channel-default but a literal landscape anchor could help)
- Action / motion reference (industrial protest, dynamic poses — currently all references are static-pose figures; might be needed for occasional protest/action scenes)

These are deliberately deferred until production demand materializes. Generating speculative references commits to aesthetic decisions ahead of the editorial questions that should drive them. The current 15-reference library is complete for the foreseeable production cycle.

## Maintenance

When a reference is regenerated:

1. Bump the version suffix (e.g., `_v1` → `_v2`) and keep the previous version for git history.
2. If the regeneration changes the canonical aesthetic in a meaningful way (not just a minor iteration), update the prompt in `generate_style_refs.py` and document the change in PROMPTS.md.
3. If the aesthetic shift is large enough to affect existing rendered episodes, add a note to `EDITORIAL_PLAYBOOK.md` revision history.
