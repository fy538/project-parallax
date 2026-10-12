# VISUAL CONCEPT AUDIT REPORT

> **Revision scope, Oct 8:** This report evaluates an earlier script. The approved v1.5 revision changes the central claim, evidence selection, ending, and visual cues. Consult `script.md` and `REVISION_LOG.md`; prior verdicts are not a fresh audit of v1.5.
## Script: episodes/ai-care-motives/script.md (v1 two-column)
## Date: 2026-10-07

## Summary
The visual plan is mostly producible: about 70% of entries use templates that exist and fit. The biggest risk is the **shop-counter motif**, the visual spine of the episode. Its forms 2 and 3 are assigned to `CounterfactualPath` and `ConditionalArgument`, which draw logic diagrams, not a counter with a panel that fades. Second risks: P1 is over-tagged (23 vs a target of 5–8), `[MG:]` is about 63% of runtime, six side-by-side layouts crowd the episode, and the AI-GEN vs ILLUST choice for hypothetical scenes is unresolved (Tiger's call). Nothing requires tools outside the toolkit. Verdict: **NEEDS VISUAL REVISION**, not a script rethink.

*Checked against schemas: ComparisonPair, SplitFrame, ConditionalArgument, CounterfactualPath, IsotypeChart, MathDerivation, plus the KineticTypography dossier. Not checked: AxiomList, DotPlot and FrameworkDiagram dossiers.*

## Visual Rhythm Map
```
B1 (70s):  [KT 14] [KT 6] [SplitComp 8] [AI-GEN 16] [SplitComp 8] [KT 6] [TitleT 6]
B2 (70s):  [AI-GEN 12] [SplitFrame 19] [hold 3] [AI-GEN 11] [ARCH 6] [KT-quote 16] [hold 4]
B3 (70s):  [AI-GEN 10] [AI-GEN 12] [ARCH 5] [KT-quote 16] [KT 16] [AxiomList 11]   ← ⚠️ 43s of text cards
B4 (75s):  [AI-GEN 3] [Network 14] [KT 7] [Framework 16] [ILLUST 17] [Timeline 14] [ILLUST 7]
B5 (74s):  [ARCH 5] [ILLUST 12] [SplitFrame 9] [KT-quote 12] [ILLUST 12] [CFPath 6] [KT-def 13] [SplitComp 7]
B6 (63s):  [FOOT 10] [PSR 8] [Stat 13] [FOOT 10] [Timeline 16] [KT 5]
B7 (146s): [AI-GEN 3] [DataChart 19] [CondArg 22] [ILLUST 14] [ComparisonPair 26] [SCREEN 12] [Math 14] [KT 6] [Isotype 7] [SCREEN 8] [AI-GEN 12 + LAYERED 8]
B8 (82s):  [CondArg 24] [AxiomList 20] [ILLUST 11] [AI-GEN 17] [TitleT 10]
```
Strengths: no `[MG:]` run over 3; all three registers present; the shop and desk stills are reused; two visual-first moments, one counterpoint, one design-time Shorts beat per planned. Weak spots: Beat 3's tail, Beat 7's long static holds (19s, 22s, 26s), and 11 KineticTypography cards.

## Lens 1: Template Coverage
1. **Motif forms 2 and 3 (high).** `CounterfactualPath` is a year-based branching timeline (`branchYear`, `branchEvent`, outcomes), and `ConditionalArgument` is an IF box with two consequence branches. Neither renders "the same counter with a panel that dims." *Impact:* the motif becomes labeled boxes and the visual idea doesn't land. *Suggestion:* (a) re-label as structure: pre-branch "Shopkeeper, watched" → branch event "The watching stops" → outcomes "Fair change" vs a dashed "?" (the dashed 12/6, 45% register is a good fit), keeping the shop still as a quiet image in the title area; or (b) build one small bespoke `ObserverPanel` composition that serves all three forms. I recommend (a) first and (b) only if it reads thin in a render.
2. **ComparisonPair (medium).** Panes must come from 10 templates (DataChart, StatReveal, KineticTypography, FrameworkDiagram …). "VW car looks clean" vs "model worse when it counts" works with two KineticTypography panes or two FrameworkDiagrams; it can't take a car image. Or use `SplitFrame` (any template).
3. **SplitFrame form 1 (OK).** Panes can be any template, so two `ImageComposite` panes using the counter still, each with a reason caption, are buildable.
4. **DataChart for AUC (medium).** Bars at 0.50 / 0.83 / 0.92 sit on a metric whose floor is chance (0.5), so bars invite the truncated-axis problem. *Suggestion:* a three-entity `DotPlot` with a reference line at 0.5 ("chance"), where position is the argument; also shortens the 19s hold.
5. **IsotypeChart (medium, accuracy).** The finding is "often below 20%." One highlighted icon in five reads as exactly 20%. *Suggestion:* label "at most 1 in 5," or use a KineticTypography stat-caption "often under 20%."
6. **AxiomList for the watch signals (low).** AxiomList is for foundational claims; the three signals are things to track. *Suggestion:* FrameworkDiagram (3-item list/flow) or KineticTypography stack; verify the variant in the dossier.
7. **MathDerivation (OK).** Steps with annotations can show "carry the 1" then a simplified two-path version with `\underbrace`. Label it "simplified schematic," since the real mechanism is internal features, not arithmetic.
8. **StatReveal (OK with a note).** Needs comparison bars (specified for 40×). The second stat, ~11 million, shares the same row; give it its own beat or drop it from the visual.
9. **Gaps:** no empty-narration stretches found.

## Lens 2: Stock Footage Likelihood
- **"diesel car emissions test dynamometer" — ⚠️/❌.** The gradient (specific → generic) is right, but expect few hits on a dynamometer. *Alternative:* Wikimedia Commons press and protest photographs of the 2015 scandal as `[ARCHIVAL:]`, then generic "car exhaust pipe" / "mechanic diagnostic car" stock. Avoid prominent branding (FOOTAGE_SOURCING).
- **"car driving highway" — ✅.**
- **Archival portraits (Kant, Mill, Plato) — ✅ plausible** in Wikimedia Commons (public-domain engravings, photograph, and a Roman-copy bust). Confirm the exact files at sourcing.
- **Screen recording of an assistant (Beat 7) — feasible.** Crop interface chrome and any account details; a prominent product UI raises the same concern FOOTAGE_SOURCING flags for corporate branding.
- **EPA Notice of Violation page** — document exists publicly; confirm reuse terms and that it can be shown at readable resolution.

## Lens 3: Visual Monotony
- **KineticTypography appears 11 times,** including four quote-attribution cards. Reduce two: fold the "heart/street" card (4.2) into the NetworkDiagram, and let the Beat 3 "help is real" card share the AxiomList.
- **Side-by-side layouts appear six times** (SplitComposition ×3, SplitFrame ×2, ComparisonPair ×1). The viewer starts to read every beat as A vs B. Convert two to single-frame (suggest the Beat 1 "Yes/Yes" and Beat 5 "just/unjust").
- **Beat 3 tail:** quote card → text card → AxiomList is 43s of text with no image. Insert the river still or Mill portrait between them.
- **Beat 7 holds:** 19s, 22s and 26s on single compositions are long; add `cam()` movement or split the ComparisonPair.
- Positive: the repeated counter frame is an intentional, effective motif.

## Lens 4: Treatment-Narrative Alignment
- **Treatment ramps are unspecified.** Suggest: conflict (ink → rust) for the VW stats and the free-tier experiment; editorial (folder → bone → paper) for the Kant, Mill, Glaucon and EPA document moments; standard elsewhere.
- **P1 over-tagging:** 23 P1 entries vs a 5–8 target. Proposed P1 set: the ring illustration, the observer-dims moment, the Unwatched Test definition, the VW "40×" stat, the free-tier ConditionalArgument, the carry-the-one MathDerivation, the final motif form, the closing line. Demote the rest to P2/P3.
- **Missed peaks:** "A true yes and a kind yes read the same" (Beat 1) and "Same bread. Same price. Same change." (Beat 2, currently a 3s hold at P2) are the episode's strongest lines and deserve P1.
- Tone: no clear mismatches. The rescue's breathing pace and static hold fit.

## Lens 5: Tool Assignment
- **AI-GEN vs ILLUST for hypothetical scenes (medium, awaiting Tiger).** The shop, river, dinner and second-shopkeeper stills are anonymous vignettes with no physical referent, which fits ILLUST (Recraft, native SVG, cheaper) at least as well as AI-GEN, which is the most expensive manual tool and is meant for unsourceable physical spaces. Repo precedent (`prisoners-dilemma`) does use AI-GEN constructivist scenes, so this is a taste and cost call. If AI-GEN stays, keep to 4 stills: counter, river, desk, desk at dawn.
- **Overreach: none.** No 3D, no character animation.
- **Reuse:** the counter and desk stills are reused (good); reuse one Recraft rating-card illustration in Beat 4 instead of generating two.
- **Cost:** MG-heavy plan is the cheap path; the main hidden costs are the screen recording and the EPA document.

## Lens 6: Register Balance and Transition Grammar
| Register | Share | Target | Status |
|---|---|---|---|
| Analytical `[MG:]` | ~63% | 40–55% | over |
| Atmospheric `[ILLUST:]` | ~11% | 5–15% | OK |
| Grounding `[AI-GEN:]` | ~15% | 5–15% | at the top edge |
| Footage + archival + screen | ~8% | 15–25% (post-May-4 calibration) | under |

- **Why MG is high:** it's an argument-structure episode and real footage is scarce. Two mitigations: reduce side-by-side and text cards (Lens 3), and add 1–2 portrait or document images (archival) as P3 breaks.
- **Pacing:** no `[MG:]` run over 3; no more than 2 consecutive AI-GEN or ILLUST.
- **Transition grammar:** Analytical → Grounding with color-wash ✓; Grounding → Atmospheric with dissolve ✓. Atmospheric → Analytical currently uses color-wash in four places; the grammar calls for iris (≤2, rupture peaks only). Suggest one iris at Beat 5 ("Take away the watching," ring → test) if `CounterfactualPath` has a focal point at the branch, otherwise dissolve. Do not use iris on chart-category templates.
- **Editorial fit of atmospheric entries:** ring (strong), private notes behind a screen (strong), lit window (strong). The "two figures arguing at a table" (5.2) carries little emotional weight; cut it and hold the Glaucon quote, or swap in a `DialecticFlow` (thesis → antithesis → synthesis) if you want it visual, with a break placed elsewhere.

## Script Reshaping Suggestions
1. **Beat 7, "ask it why" → screen recording.** The recording is the strongest visual in the episode only if the assistant's answer says "carry the 1." Do a dry run before recording; if the output varies, lock the wording of the question.
2. **Beat 6, "Only then did it switch on the full pollution controls."** The document highlight must match this sentence. If the EPA notice's wording differs, adjust the narration to the document's phrasing (it's a paraphrase now).
3. **Beat 4 rollback timeline.** "Four days later" is on screen as two dates; that's enough. Consider cutting the OpenAI quote from the visual and keeping it only in narration.

## Fixes for Visual-Spec (Structured Handoff)

| Comp # | Beat | Current Spec | Recommended Change | Reason |
|---|---|---|---|---|
| 2.2 | 2 | SplitFrame (counter panes) | SplitFrame with `ImageComposite` panes + caption | Panes must be registered templates |
| 5.3 | 5 | CounterfactualPath (street panel fades) | CounterfactualPath re-labeled as branch "the watching stops," or bespoke `ObserverPanel` | Template draws a timeline, not a scene |
| 8.1 | 8 | ConditionalArgument (blurred panel) | ConditionalArgument as IF/THEN text, or `ObserverPanel` | Same |
| 7.1 | 7 | DataChart bars (AUC) | DotPlot with 0.5 reference line | Truncated-axis risk; position is the argument |
| 7.5c | 7 | IsotypeChart 1 of 5 | Label "at most 1 in 5" or stat-caption "under 20%" | Accuracy |
| 7.3 | 7 | ComparisonPair (car vs model) | Two KineticTypography/FrameworkDiagram panes, or SplitFrame | Pane whitelist |
| 8.2 | 8 | AxiomList (watch signals) | FrameworkDiagram or KT stack | AxiomList is for claims |
| 6.1 | 6 | FOOTAGE dynamometer | Wikimedia 2015 scandal photos + generic exhaust stock | Low likelihood |
| 5.2 | 5 | ILLUST two figures arguing | Cut, hold the quote | Weak atmospheric fit |
| all | 1–8 | P1 ×23 | P1 ×8 as listed in Lens 4 | Hero count |
| all | 1–8 | no treatment ramps | conflict / editorial / standard as in Lens 4 | Alignment |

## Verdict
**NEEDS VISUAL REVISION.** Resolve the motif approach (Lens 1, item 1), the P1 set, and the side-by-side and text-card clustering before visual-spec. Tiger's open decision: AI-GEN vs ILLUST for the hypothetical scenes. Safe to proceed to script-audit in parallel; narration is unchanged by these fixes.

## Resolution status (script v1.1, Oct 7, 2026)
Applied: P1 reduced from 23 to 8; motif forms rebuilt on supported templates (form 1 `SplitFrame` with `ImageComposite` panes; form 2 `CounterfactualPath` re-labelled; form 3 `ConditionalArgument` as exam vs pop quiz), with a bespoke `ObserverPanel` as fallback; side-by-side layouts reduced from 6 to 3; Beat 3 text-card run broken with a reused still; DataChart replaced by DotPlot; IsotypeChart labelled "at most 1 in 5"; ComparisonPair replaced by sequential SplitFrame with KineticTypography panes; AxiomList on the watch signals replaced by FrameworkDiagram; dynamometer footage replaced by archival photographs plus generic stock; weak atmospheric entry cut; one iris added at the Glaucon quote; treatment ramps added; StatReveals split. MG share fell from about 63% to about 58%.
Open: AI-GEN vs ILLUST for hypothetical scenes (Tiger); first-render check of motif forms 2 and 3; screen recording; EPA document image and reuse terms; wording match in Beat 6.

**Decision (Tiger, Oct 7):** all generated imagery is AI-GEN stills; the six `[ILLUST:]` entries were converted to `[AI-GEN:]`. No `[ILLUST:]` in this episode (Register 2 presence waived). AI-GEN is now about 30% of runtime (combined AI-GEN + ILLUST target 15-30% post-calibration), about 12 distinct stills, none of it in a run longer than two.
