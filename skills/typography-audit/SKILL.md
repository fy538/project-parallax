---
name: typography-audit
description: >
  Audit the typography / layout / image shots in a Parallax production script
  against the 6 templates in the family (KineticTypography, TitleTransition,
  SplitComposition, ImageComposite, AnnotatedImage, PhotoMontage) and their
  data files. Catches register confusions (KineticTypography used as section
  title, TitleTransition with motion entrance), missing attribution on quotes,
  parallel-structure violations on SplitComposition, generic stock photos on
  image templates, and overlapping callout/montage density caps. Sister to
  script-audit and visual-concept; runs after script-draft, before or
  alongside visual-spec.

  Use whenever someone asks to "check the typography", "audit the title cards",
  "are the right typography/image templates picked", "typography review", or
  when finalizing a script with multiple text-as-visual or image-as-evidence
  beats. Trigger proactively when [MG:] beats use KineticTypography (most
  often confused with TitleTransition) or when title cards have motion
  entrance flags (TitleTransition canon is fade-only).
---

# Typography Audit

You are auditing the **typography, layout, and image shots** in a Parallax production script for template-fit, editorial-register correctness, attribution completeness, parallel-structure integrity, and image load-bearing weight. The typography family has the lowest cross-template overlap but the highest register-confusion rate — KineticTypography mis-used as a title-card stand-in is the canonical mistake.

## Context

The canonical "if your text/image moment looks like X, use template Y" lookup is `remotion-templates/TYPOGRAPHY_TEMPLATE_SELECTOR.md` — read it BEFORE running the audit. The 6 templates cover emphasis moments (KineticTypography), structural breaks (TitleTransition), visual opposition (SplitComposition), photo-with-text (ImageComposite), photo-with-callouts (AnnotatedImage), and photo sequences (PhotoMontage).

You are NOT generating new visual-spec JSON. You are reading what's already there and flagging issues with concrete remediation suggestions.

## When to use this skill

- After `script-draft` produces a draft with typography/image beats.
- Before `visual-spec` so any reshape is done while it's cheap.
- When porting older episode data to the current registry.
- Standalone "are my title cards right" check at any pipeline stage.

Sister skills: `script-audit`, `visual-concept`, `map-audit`, `chart-audit`, `diagram-audit`, `timeline-audit`, `visual-spec`.

## Inputs

1. **The script file** (required).
2. **The data files** (when they exist).
3. **TYPOGRAPHY_TEMPLATE_SELECTOR.md** (read at start).
4. **Per-template dossier** — `remotion-templates/references/template-research/title-card.md` (covers TitleTransition).
5. **POLISH.md → D1-D18 editorial doctrine** — for title-card chrome and motion rules.

## The eight audit lenses

Run each lens INDEPENDENTLY. For each issue: **Location**, **Problem**, **Replacement**.

### Lens 1 — KineticTypography vs. TitleTransition register confusion

The canonical mistake. KineticTypography is for **emphasis moments mid-essay**. TitleTransition is for **structural breaks** (episode open, section, end card).

→ Flag: KineticTypography used as a section title (e.g., "Chapter Two: The Trap"). Motion breaks the structural register.
→ Replacement: TitleTransition with `variant: "section"`, fade-only entrance.

→ Flag: TitleTransition used for a mid-essay quote (too quiet, too structural).
→ Replacement: KineticTypography `variant: "quote"` with attribution.

### Lens 2 — TitleTransition motion / chrome violations (POLISH D1-D18)

POLISH doctrine: TitleTransition is **fade-only entrance, fade-only exit, no motion, no music-on-landing, no accent on title type**.

The template itself enforces fade-only — there is no schema field that would let a data file request motion entrance. So this lens is a **cross-doc check**, not a data-file field check:

→ Flag: any `DIR:` annotation in the script asking for `slide-in`, `scale-in`, `whip`, or other motion entrance on a TitleTransition beat. The DIR will be dropped by the renderer; flag so the script author either accepts fade or switches templates.
→ Flag: TitleTransition beat where the audio-spec or `_direction.musicCue` lands music ON the title frame. Music should enter AFTER the card exits. Replacement: shift the music cue +2.0s (card hold duration).
→ Flag: TitleTransition data file with `accentColor` applied to the title type (vs. the ∴ glyph). Replacement: remove `accentColor` from title; the ∴ already carries the accent.
→ Flag: TitleTransition with explicit `holdSec` deviation from 2.0s without an editorial-reason note in `_direction.notes`. Shorter feels flashed; longer feels forgotten.

### Lens 3 — KineticTypography attribution + bilingual rules

**3a. Quote without attribution.**
KineticTypography quote MUST have attribution. Quote without attribution = context evaporates.
→ Flag: any `variant: "quote"` data file without `attribution` field. P0.

**3b. Bilingual / definition simultaneity.**
KineticTypography bilingual never animates Chinese + English simultaneously. The eye needs to know where to land.
→ Flag: bilingual variant with both languages on the same entrance frame.
→ Replacement: stagger by 0.5-1s.

### Lens 4 — KineticTypography statistic vs. StatReveal cross-family

KineticTypography statistic is the **context-free hero number**. If narration provides comparison context ("3× the previous record"), use StatReveal (Charts family).

→ Flag: KineticTypography statistic with comparison narration. Cross-family flag — refer to `chart-audit` for StatReveal migration.

### Lens 5 — SplitComposition parallel-structure integrity

SplitComposition is **exactly 2 sides** (structurally guaranteed) with **parallel tag/title/items structure**.

→ Flag: items count imbalance ≥2 between left/right sides. One side padded with placeholder breaks the "these are opposites" register.
→ Replacement: trim to parallel counts OR demote to FrameworkDiagram (comparison/matrix) for asymmetric typology.

→ Flag: asymmetric label register ("Capitalism" vs. "The doctrine of state-led development that…"). Use parallel grammar.

→ Flag: SplitComposition where one side is clearly the protagonist but `protagonistMode` is unset. Replacement: set `protagonistMode: "left"` or `"right"` for asymmetric weight.

### Lens 6 — Image template load-bearing weight

The image must carry editorial meaning, not decoration. Generic stock photography reads as filler.

→ Flag: ImageComposite / PhotoMontage with generic stock URLs (Unsplash random, Pexels filler). Replacement: source the actual moment/person, OR demote to FOOTAGE/ILLUST register where appropriate.

→ Flag: ImageComposite with cluttered overlays (3+ text elements competing). Replacement: reduce to one primary text element.

→ Flag: PhotoMontage where images don't have date/place provenance. Decorative collages dilute the form.

### Lens 7 — AnnotatedImage callout discipline

Callout stagger is **automatic** in the template (each callout enters at `index × stagger` frames) — there is no per-callout `appearAtSec` flag and stagger cannot be disabled. So the audit's role here is density + placement, not timing.

**7a. Density cap.**
AnnotatedImage caps at ~6 callouts. Above that, leader lines collide and viewer is overwhelmed even with auto-stagger.
→ Flag: data file with 7+ callouts in `callouts[]`. Replacement: split into staged compositions or demote to PhotoMontage with per-image focus.

**7b. Placement collisions / low-contrast regions.**
Multiple callouts clustered in the same image quadrant produce leader-line overlap that auto-stagger doesn't fix. Callouts on busy/low-contrast image regions become illegible (the template has no per-callout scrim).
→ Flag: 3+ callouts with `(x, y)` positions within 15% of each other. Replacement: redistribute around the image, or split into two compositions with different focus regions.
→ Flag: callouts with `(x, y)` positioned over the script-named "busy" regions of the image (when known from visual-concept). Replacement: relocate to image margins or pick a different reference image.

### Lens 8 — PhotoMontage pacing + transitions

→ Flag: per-image hold below 1.5s at scrub speed. Too fast to absorb.
→ Flag: transitions faster than the dossier-canonical defaults (1.0-1.5s dissolve). Choppy cuts break documentary register.

## Output format

```markdown
# Typography Audit — <episode slug>

**Typography/image beats in this episode:** <count>
**Issues found:** <P0> P0 (attribution / register violation), <P1> P1 (visually wrong), <P2> P2 (cosmetic)

---

## P0 — Attribution / register violations

### Beat <N>, line <X> — <one-line summary>
- **Current:** `TEMPLATE: KineticTypography` `variant: "quote"`, no `attribution` field
- **Problem:** Unattributed quote — context evaporates. Reads as authorial voice when it's a citation.
- **Replacement:** Add `attribution: "<speaker, source, date>"`. If the quote can't be sourced, demote to authorial paraphrase in narration.
- **Reference:** TYPOGRAPHY_TEMPLATE_SELECTOR.md § Mandatory rules #4

[... repeat per issue ...]

---

## P1 — Visually-wrong but renderable

[same format]

---

## P2 — Cosmetic / opportunity-cost

[same format]

---

## Summary

<2-3 sentences: overall typography-pipeline health, biggest pattern, recommended next action>
```

If no issues:

```markdown
# Typography Audit — <episode slug>

**Typography/image beats in this episode:** <count>
**Issues found:** 0 — templates correctly assigned, attribution present, registers match.
```

## Doctrine / failure modes to ALWAYS flag

1. **KineticTypography quote without attribution** — P0.
2. **KineticTypography statistic with comparison context** — P0 (use StatReveal).
3. **TitleTransition with motion entrance** — P0 (POLISH; fade-only canonical).
4. **TitleTransition with music sting on landing** — P0 (music enters AFTER).
5. **TitleTransition with accent color on title type** — P1 (accent reserved for ∴).
6. **KineticTypography used as section title** — P0 (use TitleTransition).
7. **SplitComposition items imbalance ≥2** — P1 (parallel structure breaks).
8. **ImageComposite generic stock photo** — P1 (load-bearing meaning required).
9. **AnnotatedImage callouts simultaneous reveal** — P1 (stagger).
10. **AnnotatedImage with >6 callouts** — P1 (split compositions).
11. **AnnotatedImage callouts on low-contrast regions** — P1.
12. **PhotoMontage with stock decoration** — P1 (demote to FOOTAGE/ILLUST register).
13. **PhotoMontage transition faster than 1.5s/image** — P2.

## Tone

Match the Parallax skill set: terse, surgical. Quote the script line. Cite the selector or POLISH/dossier reference. Suggest the specific replacement.

POLISH D-rules on TitleTransition are non-negotiable — flag any violation as P0 even if it would technically render. The structural-break register depends on the chrome staying disciplined.
