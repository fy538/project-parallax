# VISUAL CONCEPT AUDIT REPORT
## Script: script-v4-production.md
## Date: May 5, 2026

## Summary

The script is approximately **85% visually producible** with the current toolkit. The core visual storytelling — the equilibrium dot motif evolving across beats, the narrowing-conditions counterpoint, the Ostrom world map visual-first — is strong and well-matched to Remotion templates. Three issues need resolution before visual-spec: (1) a DataChart used for a line chart it can't render, (2) multiple violations of the "max 3 consecutive MG" pacing rule, and (3) the ILLUST/AI-GEN entries are doing similar editorial work in this episode, creating a distinction without much difference for the viewer. The biggest visual risk is MG monotony in Beats 3-5 where the script runs 4+ consecutive motion graphics without a footage/illustration break.

## Visual Rhythm Map

```
Beat 1: [AI-GEN 7s] [MG:GB 10s] [FTG 5s] [MG:KT 5s] [ILLUST 7s] [MG:KT 5s] [MG:FD 6s] [MG:GB 6s]
                                                                     ─── 3 MG ─── (borderline ✅)

Beat 2: [TRANS 2s] [MG:DC 12s] [FTG 5s] [AI-GEN 7s] [MG:GB 8s] [FTG 3s] [MG:FD 15s] [MG:KT 4s] [MG:KT 8s]
                                                                            ─── 3 MG ─── (borderline ✅)

Beat 3: [TRANS 2s] [ILLUST 7s] [AI-GEN 7s] [MG:GB 10s] [MG:KT 5s] [MG:KT 4s] [MG:DC 8s] [MG:FD 10s] [FTG 6s] [MG:FD 8s] [MG:KT 5s] [MG:KT 8s]
                                             ──────── 4 MG ──────── ❌                       ─── 2 MG ─── ✅

Beat 4: [TRANS 2s] [ILLUST 7s] [FTG 5s] [MG:GB 12s] [MG:GB 10s] [MG:KT 6s] [MG:FD 6s] [FTG 5s] [MG:CM 14s] [MG:FD 12s] [MG:KT 5s] [FTG 6s]
                                          ──────── 4 MG ──────── ❌                        ─── 3 MG ─── (borderline ✅)

Beat 5: [TRANS 2s] [FTG 4s] [MG:FD 8s] [MG:FD 10s] [MG:FD 8s] [MG:KT 8s] [MG:KT 7s] [FTG 5s] [FTG 6s] [MG:GB 5s] [ILLUST 7s] [MG:GB 5s]
                              ─────────────── 5 MG ─────────────── ❌

Key: GB=GameBoard, KT=KineticTypography, FD=FrameworkDiagram, DC=DataChart, CM=ChoroplethMap, FTG=Footage, TRANS=Transition
```

## Lens 1: Template Coverage

### Issues

**VC-1 · DataChart vol-smile — template mismatch** (Beat 3)
- **Location:** Beat 3, "Implied volatility: flat line 1976–1987... then permanent skew post-crash"
- **Problem:** DataChart supports bar, comparison, and horizontal variants. It cannot render line/area charts showing trends over time.
- **Impact:** Visual-spec will either force this into a bar chart (losing the continuous line that makes the "smile" legible) or fail to generate valid JSON.
- **Suggestion:** Use **TimeSeriesChart** instead — it supports draw animation for lines over time, which is exactly what the volatility smile needs. The `reveal(draw, over:3s)` DIR: annotation is already perfect for TimeSeriesChart's capabilities.

**VC-2 · GameBoard side-by-side PD vs. stag hunt** (Beat 4)
- **Location:** Beat 4, "Side-by-side: PD matrix (one dot) vs. Stag Hunt (two dots)"
- **Problem:** GameBoard renders one game at a time. A side-by-side comparison of two different payoff matrices would need either: (a) SplitComposition wrapping two GameBoard instances, or (b) a single GameBoard that transitions between states.
- **Impact:** If visual-spec tries to generate a single GameBoard JSON with two matrices, it won't render correctly.
- **Suggestion:** Use **SplitComposition** with the ∴ divider — left panel shows PD matrix (one dot), right shows stag hunt (two dots). This is exactly what SplitComposition was designed for and the visual contrast will be stronger than trying to cram both into one template. Alternatively, use a sequential GameBoard that shows PD first, then morphs to stag hunt — but the simultaneous comparison is more powerful.

**VC-3 · FrameworkDiagram Ostrom-vs-PD complexity** (Beat 4)
- **Location:** Beat 4, "Split layout: left shows Ostrom's 8 principles; right shows PD assumptions. Lines connect each principle to the assumption it dissolves."
- **Problem:** This is 16 nodes (8+8) with 8 connecting lines in a single composition. FrameworkDiagram's "Cannot Do" includes "diagrams with >12 nodes." At 16 nodes this is borderline — it'll be visually dense.
- **Impact:** Text may be too small to read at 1920×1080. The connecting lines will create visual clutter.
- **Suggestion:** Split into two sequential compositions: (1) FrameworkDiagram showing Ostrom's 8 principles (established first, ~6s), then (2) the *same* layout with PD assumptions appearing on the right and lines drawing to connect them (~6s). This gives the viewer time to absorb each side. Use `reveal(progressive)` on the second to show connections one at a time. Total: same 12s, but comprehension doubles.

### Strengths

- GameBoard is used excellently for the equilibrium dot motif — same template, evolving data across beats. This is exactly how parametric templates should work.
- KineticTypography is appropriately used for quotes, checkpoint summaries, and statistical reveals — all within its sweet spot.
- ChoroplethMap for the Ostrom world map is a natural fit — country-level highlighting with a counter.

## Lens 2: Stock Footage Likelihood

| # | Search Terms | Confidence | Notes |
|---|-------------|------------|-------|
| 1 | "1950s academic portrait black and white" | ⚠️ Moderate | Wikimedia likely has Nash-era math portraits. Generic fallback fine. |
| 2 | "RAND Corporation building 1950s" | ⚠️ Moderate | Specific building — Wikimedia has some RAND photos. Fallback to generic mid-century office works. |
| 3 | "office door opening to sunlight" | ✅ Easy | Abundant on Pexels |
| 4 | "oil refinery industrial sunset" | ✅ Easy | Abundant |
| 5 | "forest canopy morning light" | ✅ Easy | Abundant |
| 6 | "traditional farming terraced fields" | ✅ Easy | Abundant |
| 7 | "ocean aerial vastness" | ✅ Easy | Abundant |
| 8 | "city street crowd walking evening" | ✅ Easy | Abundant |
| 9 | "university lecture hall students" | ✅ Easy | Abundant |
| 10 | "Reagan Gorbachev summit handshake" | ⚠️ Moderate | Wikimedia has INF Treaty signing photos. Accept still. |

**Verdict:** No ❌ entries. All footage is either easy or moderately sourceable with clear fallbacks. This is a low-risk footage list — appropriate for a Philosopher's Lens episode that's inherently MG-heavy.

## Lens 3: Visual Monotony

### Critical Issue: MG Run Violations

**VC-4 · Beat 3 mid-section: 4 consecutive MG** (GameBoard → KinTypo → KinTypo → DataChart)
- After the AI-GEN negotiation room and the GameBoard trap animation, the script runs through "prediction came true" (KT) → "THE WRONG GAME" (KT) → volatility smile (DC) → motif multiplication (FD) before hitting the OPEC footage break. That's four MG entries in a row covering ~27 seconds.
- **Fix:** Insert a [FOOTAGE:] or [ILLUST:] break between the "WRONG GAME" title card and the volatility smile. Suggestion: 3-4s of footage ("trading floor screens" > "financial data displays") to bridge the Black-Scholes transition. This grounds the finance parallel in a physical space before the chart appears.

**VC-5 · Beat 4 stag hunt section: 4 consecutive MG** (GameBoard × 2 → KinTypo → FrameworkDiagram)
- The stag hunt introduction runs: stag hunt matrix (GB 12s) → PD vs. stag hunt comparison (GB 10s) → "Iterated PD = Stag Hunt" (KT 6s) → old question → new question (FD 6s). That's 34 seconds of unbroken MG.
- **Fix:** The Rousseau parable narration ("a group of hunters...") is currently over footage then immediately into the first GameBoard. Consider letting the footage breathe longer — extend the forest footage to match the full Rousseau narration (~10s), so the stag hunt matrix enters as a reveal after the story setup. This reduces the consecutive MG run to 3.

**VC-6 · Beat 5 opening: 5 consecutive MG** (FrameworkDiagram × 3 → KinTypo × 2)
- The most severe violation. After the opening footage (4s), the script runs: motif pulsing (FD 8s) → final motif (FD 10s) → falsification (FD 8s) → prediction (KT 8s) → watch signals (KT 7s). That's 41 seconds of unbroken MG.
- **Fix:** Insert a footage break after the final motif completion (the visual climax). The narration transitions from "Different possibilities" to "Here's what would change my mind" — this is a natural mode switch. A brief atmospheric [FOOTAGE:] or [ILLUST:] break (3-5s) between the motif payoff and the prediction section lets the visual climax breathe before the analytical prediction beats begin.

### Duration Monotony

The KineticTypography entries cluster around 5-8 seconds, which is fine individually but creates a metronomic pulse when they appear consecutively. The alternation between long compositions (10-15s GameBoard/Framework/ChoroplethMap) and short typography hits (4-8s) provides decent rhythm within beats, but the MG runs above flatten this.

### Positive Patterns

- The ILLUST entries are spaced well: Beat 1, Beat 3, Beat 4, Beat 5 — one per beat in the middle episodes, providing periodic visual texture breaks.
- The AI-GEN entries are front-loaded (Beats 1-3), which makes sense — the historical/institutional setup benefits from spatial grounding, while the analytical back half (Beats 4-5) is correctly MG-dominant.

## Lens 4: Treatment-Narrative Alignment

### P1 Placement Analysis

P1 visuals appear at:
- Beat 1: Flood-Dresher scoreboard (60% reveal) ✅ — the core surprise
- Beat 1: Nash quote ✅ — the founding moment
- Beat 1: Stakes sentence ("every negotiation") ✅ — personal implication
- Beat 1: Equilibrium dot motif first appearance ✅ — visual motif establishment
- Beat 2: Publication diffusion chart ✅ — scale of the problem
- Beat 2: Narrowing conditions ✅ — the counterpoint visual
- Beat 3: Trap mechanism (GameBoard) ✅ — the decoder reveal
- Beat 3: "Prediction came true because you believed it" ✅ — the thesis statement
- Beat 3: "THE WRONG GAME" naming ✅ — the named concept crystallization
- Beat 3: Motif multiplication ✅ — visual arc midpoint
- Beat 4: Stag hunt introduction ✅ — the structural turn
- Beat 4: PD vs. stag hunt comparison ✅ — the key contrast
- Beat 4: Ostrom world map ✅ — visual-first data reveal
- Beat 4: Ostrom vs. PD connected ✅ — structural proof
- Beat 5: Final motif completion ✅ — visual climax
- Beat 5: Prediction text ✅ — the falsifiable commitment
- Beat 5: Final two dots ✅ — the closing image

**Verdict:** P1 placement is excellent. Every P1 lands at a genuine narrative peak. No wasted P1s on setup passages.

### Treatment Alignment

- **Standard treatment** dominates appropriately for a Philosopher's Lens episode (analytical posture).
- **Conflict treatment** appears only on the Beat 5 ILLUST (two cityscapes) — correct, this is the highest-stakes moment.
- **Oxblood tint** on the Beat 3 motif multiplication is a strong choice — the tint encodes growing unease as the PD spreads.
- **No editorial treatment used.** The Beat 1 archival/1950s footage might benefit from editorial treatment (folder → bone → paper) to signal "historical document" register. Minor suggestion, not critical.

### Tone-Visual Mismatch

**VC-7 · Beat 4 relief beat: forest footage feels generic** (minor)
- The transition from ILLUST (constructivist sunrise) to "forest canopy morning light" footage is tonally correct (relief, nature, renewal) but the footage is generic. Since Rousseau's stag hunt is the content, footage of actual deer/forest hunting could be more resonant — though this risks being too literal.
- **Suggestion:** Keep as-is. The generic nature footage is fine as P3 ambient texture. The ILLUST sunrise already carries the emotional weight.

## Lens 5: Tool Assignment

### Issues

**VC-8 · ILLUST and AI-GEN doing similar work** (structural observation)
- This echoes the conversation Tiger raised before the audit. In this episode, the three AI-GEN entries (1950s office, corridor, negotiation room) are not reconstructing specific unreachable spaces — they're generic scene-setting. The four ILLUST entries (propaganda poster, grid-on-landscape, sunrise, cityscapes) are constructivist mood pieces. Both categories provide "stylized non-photographic texture between MG sequences."
- **Impact:** The viewer won't perceive a meaningful register difference between "constructivist video of generic figures in a corridor" and "constructivist still image of institutions worshipping an equation." Both read as "artistic, non-photographic visual."
- **Production impact is real:** Kling video clips cost more, take longer to generate, and need separate QA versus Recraft SVG stills with Ken Burns motion. The question is whether the camera movement in AI-GEN (dolly, push-in) adds enough viewer value over ILLUST with Ken Burns to justify the production cost.
- **Suggestion for this episode:** Consider converting AI-GEN #1 (1950s office) and #3 (negotiation room) to ILLUST with Ken Burns motion — they're generic enough that a constructivist illustration would serve the same editorial purpose. Keep AI-GEN #2 (RAND corridor) if the dolly camera movement adds spatial immersion the narration benefits from. This reduces AI-GEN production work by 2/3 and consolidates the constructivist visual register.
- **Suggestion for the pipeline:** Defer the ILLUST/AI-GEN taxonomy decision to after this episode ships. Test whether viewers notice or care about the difference. If they don't, merge the registers for Philosopher's Lens episodes and keep the split only for geopolitical/industrial episodes where AI-GEN reconstructs specific facilities.

**VC-9 · No [LAYERED:] entries at all**
- The script has 0% LAYERED, missing the compositing mode entirely. The v3 had one (UN assembly hall + "EVERY NEGOTIATION" overlay) that was cut.
- **Suggestion:** Re-add 1-2 LAYERED entries at key moments:
  - Beat 1: The stakes sentence — footage of a diplomatic setting + KineticTypography "EVERY NEGOTIATION" overlay. This was in v3 and worked.
  - Beat 4: Ostrom cases narration — terraced fields footage + counter overlay "800+ cases" as a LAYERED entry before the full ChoroplethMap takes over. This creates a footage-to-MG bridge.

**VC-10 · Reuse opportunity: Flood-Dresher GameBoard callback** (Beat 5)
- The script correctly callbacks to the Beat 1 GameBoard in Beat 5. Visual-spec can reuse the same JSON data file (`gameboard-flood-dresher.json`) — no new asset needed. Just flagging this as a confirmed reuse opportunity.

## Script Reshaping Suggestions

### Reshaping 1: Break the Beat 5 MG wall (highest priority)

**Current:** After 4s of opening footage, Beat 5 runs 41 seconds of unbroken MG (framework → framework → framework → typography → typography) covering the motif completion, falsification, prediction, and watch signals.

**Why it doesn't work:** The motif completion is the visual climax of the episode. It needs breathing room after it lands — not an immediate pivot to more analytical graphics. The viewer needs a beat of reflection before the prediction section begins.

**Proposed reshaping:** After the final motif completion and the narration "Different possibilities" — insert a 5-second [FOOTAGE:] or [ILLUST:] bridge. The narration can absorb this with the existing `[Beat.]` pause. Then: "Here's what would change my mind" enters cleanly on a new analytical sequence.

Narration doesn't need to change — the visual column just needs a mode break at the natural pause point.

### Reshaping 2: DataChart → TimeSeriesChart for vol-smile (required)

**Current:** `[MG:] DataChart — Implied volatility: flat line 1976–1987`

**Fix:** Change template reference to TimeSeriesChart. The `reveal(draw, over:3s)` DIR: annotation already works perfectly with TimeSeriesChart's draw mode. No narration change needed.

### Reshaping 3: GameBoard comparison → SplitComposition (recommended)

**Current:** `[MG:] GameBoard — Side-by-side: PD matrix vs. Stag Hunt`

**Fix:** Change to `[MG:] SplitComposition — Left: PD matrix (one equilibrium dot), Right: Stag Hunt matrix (two dots), ∴ divider`. The GameBoard data goes into each panel. This is cleaner architecturally and visually — the ∴ divider between the two games reinforces the channel brand at the episode's key structural turn.

## Verdict

**NEEDS VISUAL REVISION** — The script is close to visually ready. Three specific items must be addressed before visual-spec:

1. **VC-1:** Change volatility smile from DataChart → TimeSeriesChart (template mismatch)
2. **VC-4/5/6:** Break MG runs in Beats 3, 4, and 5 by inserting footage/ILLUST breaks (pacing rule violations)
3. **VC-2:** Change PD vs. stag hunt from single GameBoard → SplitComposition (template limitation)

Three items are recommended but not blocking:

4. **VC-3:** Split Ostrom-vs-PD into two sequential compositions (complexity management)
5. **VC-8:** Consider converting 2 of 3 AI-GEN entries to ILLUST (production cost optimization)
6. **VC-9:** Re-add 1-2 LAYERED entries (mode variety)

Can proceed to **script-audit** in parallel (narration quality is independent of visual fixes). Do NOT proceed to **visual-spec** until items 1-3 are resolved.
