# VISUAL CONCEPT AUDIT REPORT
## Script: script-v2-production.md
## Date: May 3, 2026

## Summary

This script is **highly feasible** — approximately 90% of visuals are immediately producible with existing tools. The visual layer has a clear signature: the evolving equilibrium-dot motif (GameBoard template) creates genuine narrative through-line via geometry. The single biggest risk is **GameBoard overextension** — the template is asked to do 11 different things, some of which push beyond its `payoff-matrix` variant's designed vocabulary (world maps with replicated dots, POV entry animations). The second risk is a monotony cluster in Beat 3 where four consecutive MG compositions create a dense analytical stretch. Stock footage is conservatively assigned and high-confidence throughout — no sourcing blockers anticipated.

---

## Visual Rhythm Map

```
BEAT 1 (0:00-3:30):
[FOOTAGE 8s] [GAMEBOARD 10s P1] [KINTYPO 5s P1] [FOOTAGE 4s] [KINTYPO 4s] [LAYERED 5s P1] [FRAMEWORK 6s] [GAMEBOARD 6s P1]

BEAT 2 (3:30-7:30):
[DATACHART 12s P1] [FOOTAGE 8s] [GAMEBOARD 8s] [FOOTAGE 6s] [FOOTAGE 4s] [FRAMEWORK 15s P1] [FOOTAGE 5s] [KINTYPO 4s] [KINTYPO 8s]

BEAT 3 (7:30-11:30):
[FOOTAGE 5s] [FOOTAGE 4s] [GAMEBOARD 8s] [GAMEBOARD 6s] [KINTYPO 5s P1] [KINTYPO 4s P1] [DATACHART 8s] [GAMEBOARD 10s P1] ← ⚠️ 4 MG in a row
[FOOTAGE 6s] [FRAMEWORK 6s] [KINTYPO 5s] [KINTYPO 7s]

BEAT 4 (11:30-15:30):
[FOOTAGE 5s] [GAMEBOARD 12s P1] [GAMEBOARD 10s P1] [KINTYPO 6s] [FRAMEWORK 6s] [FOOTAGE 5s] [CHOROPLETH 12s P1] [FRAMEWORK 10s] [FRAMEWORK 10s P1] [KINTYPO 5s] [FOOTAGE 6s]

BEAT 5 (15:30-18:00):
[FOOTAGE 4s] [GAMEBOARD 8s] [GAMEBOARD 10s P1] [FRAMEWORK 8s] [KINTYPO 8s P1] [DATACHART 8s] [FOOTAGE 5s] [FOOTAGE 6s] [GAMEBOARD 5s] [FOOTAGE 5s] [GAMEBOARD 5s P1]
```

**Overall pattern:** Good alternation between footage (grounding) and templates (analysis). Beat 4 has the strongest rhythm — the Ostrom map and principles section breathes well. Beat 3 middle section has the densest MG cluster.

---

## Lens 1: Template Coverage

### Issues

**ISSUE 1 — GameBoard asked to render world map (Beat 3, Beat 5)**
- **Location:** Beat 3: "The single equilibrium dot from Beat 1 now replicates across a world map. Same dot appears in Washington, Beijing, Geneva, Brussels." / Beat 5: similar.
- **Problem:** GameBoard's `payoff-matrix` variant renders a 2×2 matrix grid. It has no world map capability — that's ChoroplethMap territory.
- **Impact:** visual-spec will either produce a broken composition or require a fundamentally new GameBoard variant that doesn't exist.
- **Suggestion:** This is a creative hybrid: use ChoroplethMap with minimal country highlighting (just dots at city coordinates via a `points` overlay) combined with the brand-color equilibrium dot motif. Alternatively, create this as a FrameworkDiagram `flow` variant with four nodes positioned at cardinal points (representing "Washington," "Beijing," etc.) each containing the single equilibrium dot. The flow variant supports positioned nodes and could render this as a conceptual geography rather than literal map. Either approach preserves the motif while staying within toolkit. **Recommended:** FrameworkDiagram with 4 labeled nodes in a spatial arrangement — it captures "this pattern is now everywhere" without requiring cartographic accuracy.

**ISSUE 2 — GameBoard "POV entering the payoff matrix" (Beat 3)**
- **Location:** "POV entering the payoff matrix. The single equilibrium dot (mutual defection) pulses."
- **Problem:** GameBoard renders a static payoff matrix with phase-based highlights. "POV entering" implies a zoom/perspective animation that isn't in the template's vocabulary.
- **Impact:** Minor — visual-spec will likely interpret this as "matrix appears with dot already highlighted," which works fine. The POV description is a mood note, not a technical spec.
- **Suggestion:** Reframe the right column to: "GameBoard — PD payoff matrix. Defection cell highlights. Single equilibrium dot pulses amber. Arrows animate toward it from both player axes." This is achievable with the phase system.

**ISSUE 3 — DataChart used as a list (Beat 5, "Watch signals")**
- **Location:** Beat 5: "Watch signals" list with 3 items.
- **Problem:** DataChart renders bar charts and comparisons. A 3-item textual list is a KineticTypography job, not a DataChart.
- **Impact:** The visual would either render as an awkward chart with text labels, or visual-spec would have to jury-rig the DataChart to show text rather than data.
- **Suggestion:** Change to KineticTypography — 3-line stack: "1. NPT RevCon language / 2. AISI joint publications / 3. Track 1.5 communiqué vocabulary." This template handles multi-line text cards natively.

**ISSUE 4 — FrameworkDiagram Ostrom-vs-PD connector (Beat 4)**
- **Location:** "Split: left shows Ostrom's 8 principles, right shows the PD assumptions from Beat 2. Lines connect each principle to the assumption it resolves."
- **Problem:** FrameworkDiagram's `comparison` variant puts items in columns. Drawing connecting *lines between specific items across columns* is not a standard feature — it's closer to a Sankey or network diagram.
- **Impact:** Medium — the composition might render as two static columns without the connecting lines, losing the "maps onto" argument that makes this the episode's most powerful analytical visual.
- **Suggestion:** This is achievable if we treat it as a `flow` variant with dual source/target columns and labeled arrows. The flow variant supports nodes and arrowLabels. Structure: 8 nodes (left: Ostrom principles) → 6 nodes (right: PD assumptions eliminated) with arrows connecting them. This is within FrameworkDiagram flow capabilities but will need careful data design in visual-spec. Flag as **high-priority for visual-spec** — this P1 visual needs extra JSON attention.

### Positive Notes

- **GameBoard payoff-matrix variant used for core PD mechanics** — perfect template fit. The 2×2 matrix with cell highlights and phase-based reveals is exactly what this template was designed for.
- **KineticTypography for quotes and named concepts** — well-matched throughout. The "bone on ink" and "amber on ink" treatments create visual hierarchy between the climactic thesis statement and supporting phrases.
- **ChoroplethMap for Ostrom's 800 cases** — ideal use. Country highlighting with dot overlays at case locations is within capabilities.

---

## Lens 2: Stock Footage Likelihood

All 17 footage entries assessed:

| # | Search Terms | Confidence | Notes |
|---|---|---|---|
| 1 | "1950s Santa Monica office building" > "1950s California office" | ⚠️ | Specific era+location. Will likely return generic mid-century office, which works. |
| 2 | "academic office papers desk 1950s" > "vintage office documents" | ✅ | Generic vintage office — abundant. |
| 3 | "RAND Corporation Santa Monica building" > "1950s think tank office" | ⚠️ | Actual RAND building: unlikely on stock. Wikimedia backup is wise. Accept a mid-century institutional building. |
| 4 | "1960s government office" > "vintage office desk papers" | ✅ | Generic, highly sourceable. |
| 5 | "narrow corridor hallway perspective" > "tunnel perspective" | ✅ | Abundant on all platforms. |
| 6 | "empty conference table" > "diplomatic meeting room" | ✅ | Very common stock footage. |
| 7 | "chess pieces shadows" > "dark strategy game pieces" | ✅ | Extremely common. |
| 8 | "oil refinery industrial" > "OPEC meeting room" | ✅ | Oil refinery: easy. OPEC meeting: unlikely but fallback is fine. |
| 9 | "sunrise over farmland" > "morning landscape wide shot" | ✅ | Abundant. |
| 10 | "traditional farming irrigation" > "rural community cooperation" | ✅ | Irrigation footage is common. |
| 11 | "ocean aerial vastness" > "open ocean horizon" | ✅ | Abundant. |
| 12 | "person walking city street thinking" > "urban contemplation" | ✅ | Very common. |
| 13 | "university lecture hall" > "classroom academic" | ✅ | Very common. |
| 14 | "Reagan Gorbachev meeting" > "Cold War summit diplomacy" | ⚠️ | Archival — Wikimedia source is appropriate. Will find stills easily; video unlikely on Wikimedia. Accept still image with pan. |
| 15 | "earth from space" > "globe earth overview" | ✅ | Abundant. |
| 16 | "United Nations general assembly hall" | ✅ | Highly available on stock. |
| 17 | "diplomats entering negotiation room" > "business meeting formal" | ✅ | Common B-roll. |

**Summary:** 13/17 entries are high-confidence (✅). The 3 moderate entries (⚠️) all have workable fallbacks already specified in the search term chain. No ❌ entries. **No sourcing blockers for this episode.**

---

## Lens 3: Visual Monotony

### Sequences Flagged

**⚠️ Beat 3 middle section: 4 consecutive MG (GameBoard → GameBoard → KineticTypography → KineticTypography)**
- Location: "POV entering matrix" → "Second player defects" → "Prediction came true" → "THE WRONG GAME"
- The footage break before the GameBoard trap (`[FOOTAGE:] diplomats entering negotiation room · 4s`) helps, but after that it's four straight template compositions (8s + 6s + 5s + 4s = 23s continuous MG).
- **Mitigation:** This is the thesis crystallization moment — the viewer is supposed to be locked into the mechanism. The density is deliberate and arguably correct. However, VIS-02 says max 3 consecutive MG without footage break. The existing footage break before the GameBoard sequence means we're actually at 4 MGs after it. 
- **Suggestion:** The script already has a `[Beat.]` pause between "Prediction came true" and "I call this The Wrong Game." Insert a 2-3s footage hold there — `[FOOTAGE:] "close-up hands folded at table" · 3s` — to let the thesis sentence breathe visually before the title card lands. This keeps the emotional momentum while respecting VIS-02.

**✅ Beat 4 GameBoard sequence: 2 consecutive (stag hunt → side-by-side comparison)**
- This is fine — the two serve different analytical purposes (introduction vs. comparison) and the visual content is genuinely different (one matrix vs. two matrices side by side).

**✅ Beat 5 closing: GameBoard → Footage → GameBoard**
- Well-paced. The callback to Beat 1 scoreboard → earth from space → final choice creates a satisfying sequence.

### Treatment Uniformity

All footage uses `standard` treatment throughout the episode. For a Philosopher's Lens format analyzing *one* framework (not a geopolitical conflict), this is appropriate. The script doesn't have "conflict zones" or "editorial document" passages that would demand treatment ramp shifts. **No issue here.**

### Duration Pattern

Good variety: the script mixes 4-5s quick cuts (footage B-roll, short typography) with 10-15s held compositions (framework diagrams, choropleth, GameBoard reveals). No metronome runs detected.

---

## Lens 4: Treatment-Narrative Alignment

### P1 Placement Analysis

| P1 Visual | Beat | Narrative Moment | Alignment |
|---|---|---|---|
| GameBoard: Flood-Dresher scoreboard | 1 | "Cooperated 60% of the time" — the hook revelation | ✅ Perfect |
| KineticTypography: Nash quote | 1 | "Question the experiment, not the model" — character reveal | ✅ Good |
| LAYERED: UN assembly + "EVERY NEGOTIATION" | 1 | Stakes sentence — "shaping your future" | ✅ Perfect |
| GameBoard: single dot motif | 1 | Thesis plant — "creates the game" | ✅ Perfect |
| DataChart: PD diffusion | 2 | "2,000 articles for a failed model" — the surprise | ✅ Perfect |
| FrameworkDiagram: narrowing assumptions | 2 | Core visual argument — assumptions eliminate reality | ✅ Strongest use |
| KineticTypography: "Prediction came true" | 3 | Thesis crystallization — the key insight | ✅ Perfect |
| KineticTypography: "THE WRONG GAME" | 3 | Named concept reveal | ✅ Perfect |
| GameBoard: motif multiplies | 3 | Scale of the problem — worldwide | ✅ Good |
| GameBoard: stag hunt | 4 | The turn — "two equilibrium dots" | ✅ Strongest moment |
| ChoroplethMap: Ostrom's 800 cases | 4 | Evidence at scale — proof it works | ✅ Perfect |
| FrameworkDiagram: Ostrom vs. PD | 4 | Structural argument — principles undo assumptions | ✅ Perfect |
| GameBoard: second dot appears | 5 | Visual climax — motif completes | ✅ Perfect |
| KineticTypography: prediction | 5 | Forward-looking claim — audience engagement | ✅ Good |
| GameBoard: final choice | 5 | Closing image — viewer's decision | ✅ Perfect |

**Assessment:** P1 placement is excellent. Every hero visual lands at a genuine narrative peak. No wasted P1s on setup passages.

### One Mismatch Noted

**Beat 4 opening:** "sunrise over farmland" footage under "But here's the relief. There was always another game available." The footage is fine tonally (hope, opening, new day), but it's P3 — which means it's 5s of ambient filler at what is actually the emotional pivot of the entire episode (the moment of relief after 11 minutes of problem-building). Consider upgrading to P2 or choosing footage that carries more visual weight (e.g., "wide landscape dawn golden" with slightly warmer treatment).

---

## Lens 5: Tool Assignment

### Mismatches

**1. GameBoard as world map (see Lens 1, Issue 1)**
- Tool: GameBoard `payoff-matrix`
- Concept: Equilibrium dots replicating geographically
- Better tool: FrameworkDiagram `flow` with spatially positioned nodes, OR ChoroplethMap with dot overlays
- Severity: **HIGH** — this appears twice (Beat 3, Beat 5) and is the motif's climactic evolution moment

**2. DataChart as text list (see Lens 1, Issue 3)**
- Tool: DataChart
- Concept: Three textual watch-signal items
- Better tool: KineticTypography (3-line stack)
- Severity: LOW — easy reassignment, no script reshaping needed

### Underused Tools

- **TimelineComparison** isn't used anywhere, but the Beat 2 section describing PD's spread from 1950 to 1975 through multiple disciplines is a natural timeline candidate. However, the DataChart (animated bar showing exponential growth + domain labels) is actually a better choice here because it emphasizes *scale* (the number rising) rather than *chronology* (when each field adopted it). No change needed.

### Overreach

**No visuals require tools outside the toolkit.** This is a well-constrained Philosopher's Lens episode — the visual ambition matches the production capacity perfectly. Zero 3D, zero character animation, zero manual compositing required.

### Reuse Opportunities

- **GameBoard payoff-matrix variant** is the episode's workhorse (11 compositions). The visual-spec can define a single base matrix template with phase variations rather than building 11 from scratch. Data file design should establish a shared `baseMatrix` object that each composition inherits and modifies.
- **The "single dot → companion dot" motif** is essentially the same composition with a phase change. Compositions #4 (single dot), #19 (two dots), and #33 (final choice) can share structure with different phase configurations.

---

## Script Reshaping Suggestions

### Suggestion 1: Beat 3 motif multiplication — reshape for toolkit

**Current narration:** "The single equilibrium dot from Beat 1 now replicates across a world map. Same dot appears in Washington, Beijing, Geneva, Brussels."

**Current visual spec:** GameBoard — dots on world map.

**Why it doesn't work:** GameBoard has no map. ChoroplethMap has no "equilibrium dot motif" vocabulary.

**Proposed visual approach:** FrameworkDiagram `flow` variant — four nodes arranged in a diamond, each labeled with a city name, each containing a single glowing amber dot (the motif). Arrows radiate outward from center (the RAND origin) to each node. This reads as "the model spread everywhere" without requiring cartographic accuracy.

**How narration could shift (minimal):** No narration change needed — the viewer sees four labeled locations with the same dot pattern, which communicates "replicated globally" through repetition rather than geographic precision. The visual-spec brief should note: "arrange nodes spatially to suggest geography without requiring a literal map."

### Suggestion 2: Beat 3 VIS-02 compliance — insert breathing room

**Current:** 4 consecutive MG after the footage break at the "diplomats entering" shot.

**Proposed:** After "The prediction came true because you believed it" (P1 KineticTypography, 5s hold) and before "I call this The Wrong Game" — insert:

```
| [Beat.] | **P3** · [FOOTAGE:] "close-up hands on table negotiation" > "hands meeting table" · Pexels · standard · 3s |
```

This gives the thesis a 3-second visual exhale (human detail grounding the abstract mechanism) before the title card lands. It also brings Beat 3's post-footage MG run down from 4 to 2+1+1 (compliant).

---

## Verdict

**NEEDS VISUAL REVISION** (minor)

Two items to address before visual-spec:

1. **GameBoard "world map" compositions (Beat 3 gameboard-motif-beat3.json + Beat 5 gameboard-motif-beat5.json):** Reassign to FrameworkDiagram `flow` variant with spatially positioned city nodes. This preserves the motif's evolution while staying within toolkit.

2. **Beat 3 VIS-02 sequence:** Insert a 3s footage break between "Prediction came true" typography and "THE WRONG GAME" title card.

Optional (non-blocking):
- Reassign Beat 5 "watch signals" from DataChart to KineticTypography
- Consider upgrading Beat 4 opening footage from P3 to P2

Can proceed to script-audit review-package in parallel (narration quality is independent). Do NOT proceed to visual-spec until the two required items are resolved.
