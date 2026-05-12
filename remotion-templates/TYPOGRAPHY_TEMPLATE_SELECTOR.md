# Typography / Layout Template Selector — Wall-Table

> One page. Pin it. When a script beat needs text-as-visual or image-with-text, look here BEFORE writing visual-spec JSON.
>
> Last updated: May 11, 2026

Six templates covering text emphasis, section structure, and image-as-evidence moments. Lowest-overlap family — each template has a distinct register — but still easy to misroute (the canonical mistake: KineticTypography used as a title-card stand-in).

Per-template dossier:
- [`title-card.md`](references/template-research/title-card.md) (covers TitleTransition)
- KineticTypography, SplitComposition, ImageComposite, PhotoMontage, AnnotatedImage — see `template-picker.md` § Typography + Images (lines 354-424)

---

## The selection question

```
What KIND of text / image moment → which TEMPLATE
```

| Moment | Editorial point | Template |
|---|---|---|
| Quote / definition / bilingual term / hero statistic (text IS the visual) | "Make the words the visual" | **KineticTypography** |
| Section / chapter / episode title (structural break) | "Here begins something new" | **TitleTransition** |
| Two visuals or concepts in stark opposition | "These are opposites" | **SplitComposition** |
| Single treated photograph with text overlay | "This is who / where" | **ImageComposite** |
| Photo with positioned callout labels pointing to specific parts | "Look at these details in this one image" | **AnnotatedImage** |
| Sequence of photos with phased reveals | "Look at this series over time/space" | **PhotoMontage** |

---

## Decision tree

```
Is the beat about TEXT taking center stage?
│
├─ Pull quote with attribution ───────────────────── KineticTypography (quote variant)
├─ Foreign term + pronunciation + definition ─────── KineticTypography (bilingual/definition)
├─ Single hero number (no comparison context) ────── KineticTypography (statistic)
│
│   (For hero number WITH comparison bars → StatReveal, different family)
│
Is the beat about STRUCTURE / section break?
│
├─ Episode opening (title + kicker + dek) ────────── TitleTransition (episode-title variant)
├─ Section break mid-episode ────────────────────── TitleTransition (section variant)
└─ End card / outro ──────────────────────────────── TitleTransition (end-card variant)
│
Is the beat about IMAGES / visual evidence?
│
├─ Single photo of person/place + identifying text ── ImageComposite
├─ Photo with multiple callouts (technical detail) ── AnnotatedImage
├─ Sequence of photos (era collage, montage) ──────── PhotoMontage
└─ Two visuals in stark opposition (left/right) ──── SplitComposition
```

---

## Sibling-template disambiguation

### KineticTypography vs. TitleTransition

| | KineticTypography | TitleTransition |
|---|---|---|
| Editorial register | Mid-essay emphasis moments | Structural moments (open, break, close) |
| Animation | Words animate with spring physics, attention-pulled | Static-after-entry; fade-only entrance and exit |
| Audio | Often paired with narration emphasis | NEVER paired with music sting; music enters AFTER card exits |
| Sample sentence | "And then Mao said: '帝国主义都是纸老虎'" | "Chapter Two: The Trap" |
| Wrong use | As section title (the kinetic motion breaks structural register) | For mid-essay quote (too quiet) |

### KineticTypography (statistic) vs. StatReveal

| | KineticTypography statistic | StatReveal |
|---|---|---|
| Family | Typography | Charts |
| Comparison bars | No | YES (mandatory) |
| Editorial point | Number stands alone, no context needed | Number's magnitude vs. history IS the point |
| Reveal duration | 3-4s | 4-5s (hero + bars) |
| Sample sentence | "$2 trillion." | "$2 trillion — 5× the previous record, 12× Apollo's budget" |

### ImageComposite vs. AnnotatedImage

| | ImageComposite | AnnotatedImage |
|---|---|---|
| Subject of attention | The whole image (person, place, scene) | Specific parts of the image |
| Text role | Identification (name, title, date) | Callout labels (positioned at coordinates) |
| Example | "Morris Chang, TSMC founder" | TSMC fab floor with Fab 12 / 18 / packaging hub labeled |
| Reveal | Image + text fade in together | Image first, callouts stagger in |

### AnnotatedImage vs. PhotoMontage

| | AnnotatedImage | PhotoMontage |
|---|---|---|
| Number of images | 1 | 3+ |
| Editorial point | "Look at these details in this one frame" | "Look at this series" |
| Reveal | Single image, callouts stagger | Sequence with transitions (dissolve, wipe) |
| Example | Satellite image with city markers | Era collage 1950 → 1990 → 2024 |

### SplitComposition vs. FrameworkDiagram (comparison) vs. DuelingFrameworks

| | SplitComposition | FrameworkDiagram comparison | DuelingFrameworks |
|---|---|---|---|
| Family | Typography | Diagrams | Diagrams |
| Mode | VISUAL opposition (image/concept) | ATTRIBUTE rows compared | Two full frameworks side-by-side |
| Editorial point | "These are opposites" | "These differ on X, Y, Z" | "Here are two competing models" |
| Example | Soviet factory vs. American factory photos | Capitalism vs. state-capitalism tenets | Realism vs. liberalism IR theory |

---

## Mode flags by template

| Template | Common flags / variants |
|---|---|
| KineticTypography | `variant: "quote" \| "bilingual" \| "definition" \| "statistic"`; `attribution`; `emphasis` (which words get accent) |
| TitleTransition | `variant: "episode-title" \| "section" \| "end-card" \| "editorial"`; `kicker`; `dek`; `episodeNumber` |
| SplitComposition | `protagonistMode` (which side is the focus); `tags[]` per side; `accentColor` per side |
| ImageComposite | `variant: "full-bleed" \| "inset" \| "portrait"`; `treatment` (duotone/grain/vignette); text overlay positions |
| AnnotatedImage | `callouts[]` (each with `x`, `y` as % of image, `label`, optional `detail`, `placement`); stagger is automatic by index |
| PhotoMontage | `transitions: "dissolve" \| "wipe"`; per-image hold duration; optional date/name overlay |

---

## Mandatory rules

1. **TitleTransition NEVER uses motion entrance** (slide-in, scale-in). Fade-only. Motion breaks editorial register.
2. **TitleTransition NEVER triggers music sting on landing.** Music enters AFTER the card exits.
3. **TitleTransition hold duration** is 2.0s (default) — shorter feels flashed, longer feels forgotten.
4. **KineticTypography quote MUST have attribution.** Quote without attribution = context evaporates.
5. **KineticTypography bilingual** never animates Chinese + English simultaneously. Stagger so the eye knows where to land.
6. **AnnotatedImage callouts** stagger automatically by index — so over-density (>6) is the failure to flag, not simultaneity.
7. **SplitComposition is exactly 2 sides.** Three or more breaks the stark-division register; use FrameworkDiagram comparison.
8. **ImageComposite avoids generic stock.** The image should be the actual moment/person, not decoration.

---

## Quick-fail checklist (read before generating JSON)

- [ ] Is this an emphasis moment (KineticTypography) or a structural moment (TitleTransition)?
- [ ] If KineticTypography quote: is there attribution?
- [ ] If statistic with comparison context: switch to StatReveal (Charts family).
- [ ] If image: does it have load-bearing meaning (the person, the moment) or is it decorative?
- [ ] If AnnotatedImage: do the callouts stagger?
- [ ] If PhotoMontage: do images carry editorial weight (not stock-photo decoration)?
- [ ] If SplitComposition: is it exactly 2 sides, with parallel tag/title structure?

---

## Common mistakes — flagged by `typography-audit` skill

1. **KineticTypography quote without attribution** → P0 reject.
2. **KineticTypography statistic with comparison context** → wrong template; use StatReveal.
3. **TitleTransition with motion entrance** → fade-only is canonical; reject sliding/scaling.
4. **TitleTransition with music sting on landing** → music enters AFTER, not WITH.
5. **TitleTransition with accent color on title type** → accent reserved for ∴ glyph; reject.
6. **SplitComposition with 3+ sides** → use FrameworkDiagram (comparison or matrix).
7. **SplitComposition with identical visual weight on both sides when one is protagonist** → use `protagonistMode`.
8. **ImageComposite with generic stock photo** → use specific image of the actual subject.
9. **ImageComposite with cluttered overlays** → reduce to one primary text element.
10. **AnnotatedImage with 7+ callouts** → leader-line collision even with auto-stagger; split into staged compositions.
11. **AnnotatedImage with callouts on low-contrast image regions** → relocate or add scrim.
12. **PhotoMontage with transitions too fast to absorb** → minimum 1.5s per image at scrub speed.
13. **PhotoMontage with decorative stock images** → demote to ILLUST or FOOTAGE register; reserve PhotoMontage for load-bearing evidence.
14. **KineticTypography used as section title** → use TitleTransition; motion breaks structural register.

---

## References

- `references/template-picker.md` — long-form selection prose (Typography lines 354-369, Images 385-424)
- `references/template-research/title-card.md`
- `TEMPLATE_FAMILIES.md` — cross-family wayfinding
- `BRAND.md` — typography system (IBM Plex superfamily, Burtin/Bayer lineage)
- `POLISH.md` — D1-D18 editorial doctrine (drop card chrome, no motion entrance on titles, music-after-card)
