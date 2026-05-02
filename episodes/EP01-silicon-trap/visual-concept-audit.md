# VISUAL CONCEPT AUDIT REPORT
## Script: episodes/EP01-silicon-trap/script-v4-production.md
## Date: April 27, 2026

---

## Summary

EP01's visual layer is **approximately 75% producible as-is** — most footage searches are plausible and the template assignments are reasonable. However, three significant tool-assignment mismatches exist: the chess/go metaphor is assigned to FrameworkDiagram when we now have a purpose-built **GameBoard** template with explicit chess and go variants; the AI timeline decision tree is assigned to FrameworkDiagram when **DecisionTree** is the exact template for branching scenarios; and the SMIC yield "line chart" is assigned to DataChart, which can only do bars — **TimeSeriesChart** handles time-series data. Beyond mismatches, the biggest risk is MG density in Beats 2-3, where 4-6 consecutive motion graphics violate the 3-MG ceiling (Playbook VIS-02), and Beat 3's uniform conflict treatment on all Chinese footage risks visual threat-coding (Playbook PER-01).

---

## Visual Rhythm Map

```
OPENING:
  [TITLE 5s]

BEAT 1 — The Paradox (3:00):
  [FOOTAGE·P1 6s] [KINETIC·P2 3s] [FOOTAGE·P1 18s] [KINETIC·P2 4s] 
  [FOOTAGE·P2 20s] [CHART·P1 4s] [FOOTAGE·P3 10s]
  ✅ Good alternation. Footage-dominant with MG punctuation.

BEAT 2 — The Logic of Denial (4:00):
  [TITLE 2s] [IMAGE·P1 12s] [TIMELINE·P1 10s] [TRANSITION 1s] [TIMELINE 8s] 
  [IMAGE·P2 8s] [KINETIC·P2 5s] [CHART·P2 6s] [CHOROPLETH·P2 8s] 
  [FRAMEWORK·P2 8s] [IMAGE·P3 6s]
  ⚠️ Mid-beat: KINETIC → CHART → CHOROPLETH → FRAMEWORK = 4 consecutive MGs (~27s)

BEAT 3 — The Other Side of the Wall (5:30):
  [TITLE 2s] [KINETIC·P1 5s] [FOOTAGE·P1 4s+3s+4s] [FOOTAGE·P3 8s] 
  [KINETIC·P2 4s] [CHART·P1 8s] [CHART·P2 5s] [FRAMEWORK·P1 6s] 
  [FOOTAGE·P3 4s] [IMAGE·P2 6s] [KINETIC·P2 5s] [HOLD 2s] [FOOTAGE·P3 8s]
  ⚠️ Mid-beat: KINETIC → CHART → CHART → FRAMEWORK = 4 consecutive MGs (~23s)

BEAT 4 — The Trap (3:00):
  [TITLE 2s] [FRAMEWORK·P1 8s] [FRAMEWORK·P1 8s] [TRANSITION 1s] 
  [ROUTE·P1 12s] [KINETIC·P2 3s] [CHOROPLETH·P2 10s] [KINETIC·P1 5s] 
  [FOOTAGE·P3 8s]
  ⚠️ Opening: FRAMEWORK → FRAMEWORK = same type back-to-back (16s)
  ⚠️ ROUTE → KINETIC → CHOROPLETH → KINETIC = 4 MGs (~30s) before footage

BEAT 5 — Your Chips (2:00):
  [TITLE 2s] [FRAMEWORK·P2 10s] [FOOTAGE·P1 9s] [FOOTAGE·P2 8s] 
  [ROUTE·P2 10s] [FOOTAGE·P3 8s] [HOLD 3s] [TITLE·P1 4s]
  ✅ Good rhythm — MG/footage/MG alternation works well.
```

**Overall mode balance estimate:**
- Footage + archival: ~175s → ~55% of visual time ✅ (target: 50-70%)
- Motion graphics: ~130s → ~40% ⚠️ (target: 20-30% — over by ~10 points)
- Layered: ~0s → 0% (target: 5-15% — none used)

The script doesn't use any `[LAYERED:]` mode at all. Several moments would benefit from footage+MG compositing — particularly the hero stats in Beat 1 (see Lens 5).

---

## Lens 1: Template Coverage

### Issue 1.1 — Chess/Go metaphor: FrameworkDiagram → GameBoard [HIGH]
**Location:** Beat 4, compositions #15 and #16
**Problem:** The chess board and go board are assigned to two separate FrameworkDiagram (comparison variant) compositions. We now have a **GameBoard** template with explicit `chess` and `go` variants — animated piece placement, phased captures, proper board rendering with grid lines.
**Impact:** FrameworkDiagram would render these as static column comparisons with text labels. GameBoard renders an actual chess board with pieces being captured (labeled with company names) and a go board with stones being placed in surrounding patterns. The visual difference is dramatic — it's the difference between *describing* the games and *showing* them.
**Suggestion:** Replace both FrameworkDiagram compositions with two GameBoard compositions: one `variant: "chess"` (US strategy — targeted captures of Nvidia, ASML, etc.) and one `variant: "go"` (China strategy — patient stone placement surrounding territory). These can be consecutive since they're intentionally contrasted, and the visual *change from chess board to go board* becomes part of the argument.

### Issue 1.2 — AI timeline: FrameworkDiagram → DecisionTree [HIGH]
**Location:** Beat 5, composition #21 (framework-ai-timeline.json)
**Problem:** The "Fast AI (2-3 years) → controls work vs Slow AI (10+ years) → controls backfire" scenario is assigned to FrameworkDiagram (flow variant). We now have a **DecisionTree** template purpose-built for branching scenarios with probability annotations and highlighted paths.
**Impact:** FrameworkDiagram would render this as a static flow chart. DecisionTree renders an animated branching tree with probability labels on branches, optional Kalshi market price annotations, and a highlighted "most likely" path. For a moment that's explicitly about probabilistic futures, this template is dramatically more appropriate.
**Suggestion:** Replace with DecisionTree. Root node: "AI arrival timeline." Two main branches: "Fast (2-3 years)" and "Slow (10+ years)." Each branch leads to consequence nodes ("Controls succeeded" vs "Controls backfired"). Can add probability labels if research brief has estimates.

### Issue 1.3 — SMIC yield: DataChart → TimeSeriesChart [MEDIUM]
**Location:** Beat 3, composition #16 (chart-smic-yield.json)
**Problem:** The script calls for a "Line chart: SMIC 7nm yield improvement (<40% → 60-70%) over time." DataChart does bars and comparisons — it cannot render line charts or show trends over time. We now have **TimeSeriesChart** for exactly this.
**Impact:** The current data file works around this by using bars, but a yield improvement story is fundamentally a *trend over time* — viewers expect to see a line rising. A bar chart misrepresents the data's nature.
**Suggestion:** Replace with TimeSeriesChart showing yield improvement trajectory: Q1 2024 (~38%), Q3 2024 (~50%), Q1 2025 (~62%), Q2 2025 (~68%). Include a reference line at 85% labeled "competitive threshold" to show the ceiling the narration describes.

### Issue 1.4 — Empty visual specs [LOW]
**Location:** Beat 2 ("Let the absurdity land"), Beat 3 ("The question is whether that approach works"), Beat 5 ("That might sound like someone else's problem")
**Problem:** Several narration paragraphs have empty right columns — no visual spec at all. Per SCRIPT_FORMAT.md, every ~5 seconds needs a visual entry.
**Impact:** In practice these are brief pauses (1-2 seconds) or will be covered by the previous visual HOLDing. Not truly empty gaps, but should be marked explicitly as `[HOLD]` in the right column for the assembly manifest generator.
**Suggestion:** Add explicit `HOLD · 2s` entries for each pause beat so generate_manifest.py handles them correctly.

---

## Lens 2: Stock Footage Likelihood

### ✅ High Confidence (no changes needed)
| # | Search Terms | Rationale |
|---|---|---|
| 2 | "semiconductor cleanroom wafer handling" | Abundant on Pexels/Storyblocks |
| 4 | "world map connections network global" | Generic, plentiful |
| 5 | "semiconductor chip macro" | Easy tier per FOOTAGE_SOURCING.md |
| 6 | "China high speed rail" | Well-covered on free platforms |
| 7 | "Shenzhen skyline technology" | Good coverage (moderate tier) |
| 8 | "AI data center servers" | Abundant |
| 9 | "semiconductor wafer macro" | Easy tier |
| 11-14 | Consumer electronics montage | Easy tier (car dashboard, smartphone, MRI, server rack) |
| 16 | "world map night lights satellite" | NASA public domain + stock |

### ⚠️ Uncertain (search term refinement needed)
| # | Search Terms | Issue | Suggestion |
|---|---|---|---|
| 1 | "TSMC Arizona construction aerial drone" | Specific facility — stock won't have branded TSMC footage | Lead with "semiconductor factory construction aerial" > "large factory construction desert" > "industrial construction site aerial". Accept that it won't show the *actual* TSMC site — the brand treatment unifies it. |
| 3 | "Arizona desert housing construction workers" | Very specific scenario — temporary worker housing in desert is niche | Lead with "temporary housing construction site" > "worker accommodation industrial" > "desert suburban development". Consider: this shot might be more effective as a *contrast cut* (cleanroom → mundane housing) where generic housing footage works fine. |
| 15 | "empty car dealership 2021" > "auto factory shutdown" | Date-specific searches rarely work on stock platforms | Lead with "empty car lot" > "auto dealership empty" > "closed factory". The year doesn't need to be in the search — narration provides context. |

### ❌ Unlikely (rethink needed)
| # | Search Terms | Issue | Alternative |
|---|---|---|---|
| 10 | "world map divided split" > "geopolitical divide concept" | Abstract concept — no camera can film "geopolitical divide." | **Cut this footage entry entirely.** The route-bifurcation.json RouteAnimation (already generated for Beat 5) shows the supply chain splitting into two networks. Use that visualization here instead — or add a brief HOLD on the preceding Morris Chang quote, which is the emotional climax and deserves breathing room, not generic footage. |

### Archival Image Assessment
| # | Description | Feasibility |
|---|---|---|
| 1 | "FDR signing embargo order, 1941" | ⚠️ The specific signing photo may not exist. FDR executive orders from 1941 exist at National Archives, but finding the *oil embargo* signing specifically is uncertain. Fallback: "FDR at desk 1941" (abundant in Library of Congress). |
| 2 | "Jake Sullivan speaking" | ✅ Press photos readily available (White House, Wikimedia). |
| 3 | "DeepSeek AI logo or Chinese AI lab" | ⚠️ DeepSeek is new — press kit may be limited. Fallback: generic "Chinese tech company office." |
| 4 | "Space launch (Chinese)" | ✅ CNSA imagery available via Wikimedia. |
| 5 | "Ballpoint pen tip macro" | ✅ Easy macro photography subject — abundant on Pexels. |

---

## Lens 3: Visual Monotony

### Issue 3.1 — Beat 2 MG cluster [HIGH] (Playbook: VIS-02)
**Location:** Beat 2, mid-section: KINETIC(5s) → CHART(6s) → CHOROPLETH(8s) → FRAMEWORK(8s)
**Problem:** Four consecutive motion graphics spanning ~27 seconds with no footage break. Violates VIS-02 (max 3 consecutive MGs).
**Impact:** By the time the viewer reaches the COCOM framework, their analytical attention is depleted. The COCOM comparison is actually important — it's the "one precedent for success" — but it arrives after 20+ seconds of unbroken data delivery.
**Suggestion:** Insert a footage break between the CHIPS Act chart and the COCOM choropleth. The narration at that transition is: *"So — does technology denial ever actually work?"* This question deserves a pause. A 6-8 second footage segment here (suggestion: archival Cold War footage or generic "Iron Curtain" imagery — search "Berlin Wall" / "Cold War border" / "government classified documents") would reset the viewer's attention before the COCOM reveal.

### Issue 3.2 — Beat 3 MG cluster [HIGH] (Playbook: VIS-02)
**Location:** Beat 3, mid-section: KINETIC(4s) → CHART(8s) → CHART(5s) → FRAMEWORK(6s)
**Problem:** Four consecutive MGs spanning ~23 seconds. The two charts back-to-back (lithography comparison + yield improvement) are the worst pair — both are DataChart with similar visual language.
**Impact:** The lithography passes comparison (34 vs 9) is a P1 hero moment — it's the visual proof that brute-force engineering works but at enormous cost. Followed immediately by another chart, its impact is diluted.
**Suggestion:** After the lithography chart, insert the "typewriter" narration paragraph as a **footage moment** — the narration says *"It's like writing a novel by punching out one letter at a time on a typewriter when everyone else has a word processor."* Search: "vintage typewriter typing" / "typewriter closeup" (Easy tier, abundant). This gives the metaphor a visual anchor, breaks the MG run, and makes the yield chart that follows feel like a payoff rather than a repetition.

### Issue 3.3 — Beat 4 framework × framework [MEDIUM]
**Location:** Beat 4, compositions #15-16 (chess board then go board)
**Problem:** Two consecutive FrameworkDiagram compositions of the same type.
**Impact:** If both render as FrameworkDiagram comparison columns, they look identical in structure — differing only in labels. The viewer sees "another comparison chart" rather than "a fundamentally different game."
**Note:** This issue is **resolved if Issue 1.1 is accepted** — GameBoard chess and GameBoard go are visually distinct (different board patterns, different piece types, different placement animations). Two GameBoards in sequence would *work* because the visual contrast between chess and go boards is the entire point.

### Issue 3.4 — No layered mode used [LOW]
**Problem:** The entire 18-minute script uses zero `[LAYERED:]` visual moments. Mode balance: 55% footage, 40% MG, 0% layered (target: 5-15% layered).
**Impact:** The script misses the most impactful visual technique — compositing data over reality. Several Beat 1 moments are natural candidates: "92% YIELD" composited over cleanroom footage, "$165 BILLION" over desert construction aerials.
**Suggestion:** Convert 2-3 moments in Beat 1 from standalone KineticTypography to layered composites using the footage already specified:
- "92% YIELD" → overlay on the P1 cleanroom footage
- "7% of US chip demand" → overlay on the Arizona aerial footage
This would bring layered mode to ~5% and use the strongest technique at the episode's opening, front-loading visual impressiveness for the critical first 3 minutes.

### Issue 3.5 — Treatment monotony [LOW]
**Problem:** 12 of 16 footage entries use `standard` treatment. Only 3 use `conflict` (all in Beat 3 — China). No footage uses `editorial` treatment.
**Impact:** The color palette is monotonous across Beats 1, 2, 4, and 5 (all amber/bronze), with a sudden shift to rust only in Beat 3 (China). This is both visually flat and politically problematic (see Lens 4).
**Suggestion:** Beat 2's historical segments (1941 oil embargo, COCOM Cold War) are natural candidates for `editorial` treatment — archival, institutional, documentary feel. This adds a third visual register and makes the timeline feel historically distinct from the present-day analysis.

---

## Lens 4: Treatment-Narrative Alignment

### Issue 4.1 — Conflict treatment only on Chinese footage [HIGH] (Playbook: PER-01)
**Location:** Beat 3 — all three footage segments use `conflict` treatment (ink → rust)
**Problem:** Conflict treatment is exclusively applied to Chinese footage (high-speed rail, Shenzhen skyline, semiconductor wafer in China context). No US or neutral footage uses conflict treatment. The visual layer says "China = danger" even though the narration goes to great lengths to show China's internal logic sympathetically (卡脖子 framing, ballpoint pen parable).
**Impact:** Wei (Chinese diaspora persona) will notice immediately. The narration is balanced; the visual palette is not. This undercuts the episode's most distinctive editorial choice — presenting China's perspective on its own terms (Playbook NAR-06).
**Suggestion:** Two approaches, both valid:
- **Option A:** Use `standard` treatment for Beat 3 Chinese footage. The narration itself carries the tension — rust treatment is redundant.
- **Option B:** Use `conflict` treatment in Beat 2 *as well*, on the US export control imagery (Jake Sullivan, the "20% → 15%" revenue deal moment). This makes conflict treatment mean "geopolitical tension" rather than "China" — it appears on both sides. This is the editorially stronger choice because it matches the episode's thesis: *both sides are trapped*.

### Issue 4.2 — P1 placement is mostly strong [POSITIVE]
**P1 visuals land at:**
- Opening aerial (cinematic first impression) ✅
- Cleanroom wafer handling (showing what a fab IS) ✅
- 7% demand chart (the paradox crystallized) ✅
- 1941 oil embargo image (historical anchor for key parallel) ✅
- TimelineComparison (the structural parallel — episode's core device) ✅
- 卡脖子 reveal (emotional centerpiece of China section) ✅
- 34 vs 9 lithography chart (brute-force proof) ✅
- Kirin teardown framework (marketing vs reality) ✅
- Chess/go metaphor (structural thesis of Beat 4) ✅
- Supply chain route (the trap visualized) ✅
- Morris Chang quote (emotional climax) ✅
- Consumer electronics montage (personal stakes) ✅
- End card ✅

**Assessment:** P1 placement is strong — hero visuals consistently align with narrative peaks. No wasted P1s on setup passages.

### Issue 4.3 — Background composite on important footage [LOW]
**Location:** Beat 1, footage #3 (Arizona housing, background @ 35%) and Beat 3, footage #7 (Shenzhen skyline, background @ 30%)
**Problem:** Both of these shots carry narrative weight — the Arizona housing *is* the story (engineers in temporary housing proves the human cost of reshoring), and the Shenzhen skyline establishes the scale of China's tech ecosystem. But both are at background opacity (25-40%), meaning they're barely visible visual wallpaper.
**Suggestion:** Bump Arizona housing to `inset @ 55%` — the viewer needs to see the contrast between cleanroom precision and mundane desert housing. Keep Shenzhen at background — the narration is carrying the load there.

---

## Lens 5: Tool Assignment

### Issue 5.1 — GameBoard for chess/go [HIGH] (repeat of 1.1)
**Current:** 2× FrameworkDiagram (comparison variant)
**Better:** 2× GameBoard (chess variant + go variant)
**Why:** Purpose-built template with board rendering, animated piece placement/capture, proper game piece visuals. The current assignment is like using a bar chart to show a chess position — technically possible but missing the point entirely. The script's narration explicitly describes moves and strategy; the visual should show a board with moves happening.
**Cost difference:** Same (both are Remotion templates, same production effort).

### Issue 5.2 — DecisionTree for AI timeline [HIGH] (repeat of 1.2)
**Current:** FrameworkDiagram (flow variant)
**Better:** DecisionTree
**Why:** Branching scenario with probability annotations, highlighted paths, and optional market prices. The narration describes exactly this: "If it comes fast... if it takes a decade..." This is a decision tree, not a flow diagram.
**Cost difference:** Same.

### Issue 5.3 — TimeSeriesChart for yield trend [MEDIUM] (repeat of 1.3)
**Current:** DataChart (bar variant)
**Better:** TimeSeriesChart
**Why:** Yield improvement over time is a time-series story. Viewers intuitively read trend lines as "improving" — bars don't convey trajectory as naturally.
**Cost difference:** Same.

### Issue 5.4 — Underused: SplitComposition for Beat 4 "both sides trapped" [LOW]
**Location:** Beat 4, between the chess/go sequence and the supply chain route
**Opportunity:** The narration says *"The problem is that both players are trapped."* This thesis moment — the episode's core argument stated explicitly — has only a 1-second transition (boards freeze and dim). A **SplitComposition** with the ∴ divider could hold this beat: left side "US: targeting chokepoints" / right side "China: surrounding territory" / divider "∴ both trapped." This makes the thesis *visible* rather than just narrated.
**Suggestion:** Add a 4-5 second SplitComposition between the go board and the supply chain route. This gives the thesis statement a visual home.

### Issue 5.5 — Underused: ProbabilityGauge for export control uncertainty [LOW]
**Location:** Beat 5, "How quickly will transformative AI arrive?"
**Opportunity:** The narration is explicitly about uncertain probabilities. If the research brief has any probability estimates or Kalshi/Polymarket prices for relevant questions (AI timelines, semiconductor self-sufficiency), a **ProbabilityGauge** (gauge variant showing 2-3 arc gauges) would be a powerful visual companion to the DecisionTree.
**Suggestion:** Consider adding a ProbabilityGauge composition before or after the DecisionTree to anchor the uncertainty in concrete market-priced probabilities. This activates the "Oracle" format element from CONTENT_IDENTITY.md. Check the research brief for prediction market data.

### Issue 5.6 — Footage #10 "geopolitical divide" → cut or replace [MEDIUM]
**Current:** P3 footage, "world map divided split" > "geopolitical divide concept"
**Problem:** Abstract concept masquerading as footage search (Playbook VIS-03). No camera can film a "geopolitical divide."
**Better:** Either (a) extend the Morris Chang quote hold — it's the emotional climax and 5 seconds is short, or (b) use the route-bifurcation RouteAnimation from Beat 5 as an early visual foreshadow with the supply chain starting to split.

### Issue 5.7 — Production cost note: all visuals achievable [POSITIVE]
The script uses no AI image generation, no premium archival footage, no tools outside the current toolkit. All 24 Remotion compositions, 16 stock footage clips, and 5 archival images are producible with existing tools at near-zero marginal cost. The only cost items are potential Storyblocks subscription (~$200/year) and time.

---

## Script Reshaping Suggestions

### Reshape 1: Beat 2 — Insert footage break before COCOM

**Current narration flow (continuous):**
> "...horrible." → "So — does technology denial ever actually work? Once. For forty-five years..." → [CHOROPLETH: COCOM]

**Suggested reshaping:**
> "...horrible." → [FOOTAGE: Cold War archival, 6-8s, editorial treatment] → "Does technology denial ever actually work?" → [CHOROPLETH: COCOM]

The question "does technology denial ever actually work?" is a pivot moment — the narration shifts from present-day chaos to historical precedent. A footage beat here (Cold War imagery, archival Berlin Wall, declassified documents) creates a visual time-shift that matches the narrative time-shift. It also solves Issue 3.1 (4 consecutive MGs).

No narration rewrite needed — just a visual insertion. The assembly manifest would add a 6-8s FOOTAGE segment with editorial treatment.

### Reshape 2: Beat 3 — Give the typewriter metaphor a visual home

**Current flow:**
> [CHART: 34 vs 9 lithography] → *"It's more expensive. It's slower. And it works."* → [CHART: yield improvement]

**Suggested reshaping:**
> [CHART: 34 vs 9 lithography] → [FOOTAGE: typewriter closeup, standard treatment, 6s] → *"It's more expensive. It's slower. And it works."* → [TIMESERIES: yield improvement]

The typewriter metaphor is one of the script's best human-scale explanations. Currently it's narrated over a chart — giving it its own visual moment (a real typewriter, the physical act of pressing keys one at a time) makes it land with sensory impact. The yield chart (now TimeSeriesChart) follows as the payoff: "and here's the proof it's working." Also solves Issue 3.2 (4 consecutive MGs).

### Reshape 3: Beat 1 — Use layered mode for opening stats

**Current flow:**
> [FOOTAGE: cleanroom 18s] → [KINETIC: 92% YIELD 3s] → [back to separate footage]

**Suggested reshaping:**
> [FOOTAGE: cleanroom] → [LAYERED: "92% YIELD" composited over cleanroom footage, 3s] → [continue footage]

The "92% YIELD" stat is more powerful *over* the cleanroom than beside it. The viewer sees the physical reality of chipmaking and the number simultaneously — the stat has a visual home. This is a visual mode change, not a narration rewrite. Same principle applies to "$165 BILLION" over the desert construction aerial.

### Reshape 4: Beat 4 — Add SplitComposition thesis beat

**Current flow:**
> [GAMEBOARD: go 8s] → [TRANSITION: both boards freeze 1s] → [ROUTE: supply chain 12s]

**Suggested reshaping:**
> [GAMEBOARD: go 8s] → [SPLIT: "US: targeting chokepoints" vs "China: surrounding territory" ∴ both trapped, 4s] → [ROUTE: supply chain 12s]

This gives the episode's thesis — "both players are trapped" — its own visual moment instead of burying it in a 1-second transition. The SplitComposition's ∴ divider is literally the Parallax brand mark being used at the moment of maximum thematic resonance.

---

## Verdict

**NEEDS VISUAL REVISION** — The script's narration is strong (confirmed by the revision log's thorough v2→v3 restructuring). The visual layer has good bones but needs targeted fixes before visual-spec generation:

### Must fix before visual-spec (5 items):
1. **Reassign chess/go to GameBoard template** (Issue 1.1/5.1)
2. **Reassign AI timeline to DecisionTree template** (Issue 1.2/5.2)
3. **Reassign SMIC yield to TimeSeriesChart** (Issue 1.3/5.3)
4. **Break Beat 2 MG cluster** with Cold War footage insertion (Issue 3.1 / Reshape 1)
5. **Fix conflict treatment imbalance** — apply to both sides or neither (Issue 4.1)

### Should fix (improve quality, 4 items):
6. Break Beat 3 MG cluster with typewriter footage (Issue 3.2 / Reshape 2)
7. Add 2-3 layered mode moments in Beat 1 (Issue 3.4 / Reshape 3)
8. Add SplitComposition thesis beat in Beat 4 (Issue 5.4 / Reshape 4)
9. Cut footage #10 "geopolitical divide" (Issue 5.6)

### Nice to have (2 items):
10. Add explicit HOLD entries for pause beats (Issue 1.4)
11. Consider ProbabilityGauge for Beat 5 uncertainty (Issue 5.5)

Proceed to **script-audit** in parallel (narration quality is independent of visual assignments). Do NOT proceed to **visual-spec** until items 1-5 are resolved.
