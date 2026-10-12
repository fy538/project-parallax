# VISUAL RE-VALIDATION
## Script: episodes/EP01-silicon-trap/script-v5-production.md (revision from v4)
## Date: April 27, 2026
## Prior audit: visual-concept-audit.md (v4, same date)

---

## Changes Detected

v4 → v5 touched all five beats. Changes grouped by type:

**Template swaps (3):**
- Beat 3: DataChart → TimeSeriesChart (SMIC yield) ✅ resolves Issue 1.3
- Beat 4: 2× FrameworkDiagram → 2× GameBoard (chess/go) ✅ resolves Issue 1.1
- Beat 5: FrameworkDiagram → DecisionTree (AI timeline) ✅ resolves Issue 1.2

**Layered mode additions (2):**
- Beat 1: "92% YIELD" KineticTypography → LAYERED over cleanroom footage ✅ resolves Issue 3.4 / Reshape 3
- Beat 1: "$165 BILLION" KineticTypography → LAYERED over Arizona aerial ✅ resolves Issue 3.4 / Reshape 3

**Treatment changes (2):**
- Beat 2: Jake Sullivan image `standard` → `conflict (ink → rust)` ✅ resolves Issue 4.1 (Option B)
- Beat 2: "20% → 15%" KineticTypography → `rust accent · conflict treatment` ✅ resolves Issue 4.1

**Footage insertions (2):**
- Beat 2: Cold War archival footage inserted between CHIPS Act chart and COCOM choropleth ✅ resolves Issue 3.1 / Reshape 1
- Beat 3: Typewriter footage inserted between lithography chart and yield chart ✅ resolves Issue 3.2 / Reshape 2

**Footage removal (1):**
- Beat 4: "geopolitical divide" footage → chip macro IMAGE ✅ resolves Issue 5.6

**Narration changes (5):**
- Beat 2: COCOM bridge sentence added ("Three years of escalating controls...")
- Beat 3: 卡脖子 flipped to illustrate-then-name (pen tip story first)
- Beat 3: 举国体制 transition smoothed ("activated something deeper — the reflex to mobilize")
- Beat 4: Jake Sullivan name added to chess metaphor
- Beat 5: Opening tightened ("Everything I've just described...")

**Declined suggestions (2):**
- SplitComposition ∴ thesis beat (Issue 5.4 / Reshape 4) — skipped, narration carries thesis
- ProbabilityGauge for Beat 5 uncertainty (Issue 5.5) — skipped

---

## Check 1: Template-Narration Drift

Walking every changed beat:

### Beat 1 — LAYERED mode conversions
**"92% YIELD" LAYERED:** Narration: *"TSMC's first Arizona fab hit a 92% chip yield — four percentage points higher than the equivalent line in Taiwan."* Visual: composited over continuing cleanroom footage, KineticTypography overlay @ 85% opacity. ✅ **Aligned.** The stat text matches the narration exactly. The "continuing cleanroom footage" reference is correct — P1 footage of cleanroom wafer handling precedes it. Opacity at 85% ensures readability over the footage.

**"$165 BILLION" LAYERED:** Narration: *"One hundred and sixty-five billion dollars in total investment. The most expensive foreign direct investment project in American history."* Visual: composited over TSMC Arizona aerial drone footage. ✅ **Aligned.** The stat and subtext match. The reference to "continuing from opening" aerial footage is correct — the opening P1 is the Arizona aerial.

⚠️ **Minor note:** The LAYERED spec says "TSMC Arizona aerial drone footage (continuing from opening)" but the actual opening aerial is P1 at 6s, followed by cleanroom footage at 18s, then the LAYERED "92% YIELD" at 3s, then more cleanroom at 18s. The "$165 BILLION" LAYERED is ~45s after the opening aerial. For the assembly manifest, this should specify either (a) cutting back to the aerial drone footage or (b) using new footage of the Arizona exterior. Current spec assumes the aerial is still available — this is a **footage re-cue**, not a continuation. Flag for visual-spec to handle.

### Beat 2 — COCOM bridge + conflict treatment
**Bridge narration:** *"Three years of escalating controls — and the policy had gone from weapon to tax to political football. Which raises a question nobody in Washington seemed to be asking: has this kind of thing ever actually worked?"* Visual: Cold War checkpoint/Berlin Wall archival footage, editorial treatment, 7s. ✅ **Aligned.** The narration pivots from present to historical; the editorial treatment (ink → bone → paper) visually marks the time-shift. The search terms are appropriate (archival, Easy-to-Moderate tier).

**Jake Sullivan conflict treatment:** Visual spec now reads `conflict (ink → rust)` with note: *"Symmetric treatment — US escalation gets the same visual tension as China's response in Beat 3."* ✅ **Aligned with decision.** The narration here describes the "small yard, high fence" escalation — conflict treatment matches the confrontational posture being described.

**Revenue deal conflict treatment:** Visual spec adds `conflict treatment` to the "20% → 15%" KineticTypography. ✅ **Aligned.** The narration describes a national security instrument becoming a tax — the tension register justifies rust accent.

**One narration line removed:** v4 had *"So — does technology denial ever actually work?"* as a single-line transition. v5 replaces it with the fuller bridge sentence and separates the question into the Cold War footage beat. The COCOM choropleth that follows now leads with *"Once. For forty-five years..."* — this flows correctly. ✅ **No orphaned visual.**

### Beat 3 — 卡脖子 flip + typewriter + 举国体制
**卡脖子 reordering:** The KineticTypography bilingual card has moved from *before* the pen tip footage to *after* it. In v4, the sequence was: KINETIC(卡脖子) → FOOTAGE(train/space/pen). In v5: FOOTAGE(train/space/pen) → KINETIC(卡脖子). ✅ **Aligned.** The narration now introduces the story first (*"There's a story that became a kind of national parable..."*) and names the concept after (*"The Chinese have a phrase for this: 卡脖子"*). Visual matches perfectly.

**New Shenzhen footage entry:** v5 adds a P3 footage segment between 卡脖子 KineticTypography and 举国体制 KineticTypography: *"Shenzhen skyline technology district" · conflict · 4s.* ✅ **Aligned.** This provides a visual breath between two consecutive KineticTypography cards. Duration trimmed from v4's 8s to 4s, which makes sense — it's a bridge, not a feature.

⚠️ **However:** The narration row for this footage is empty — the footage entry sits in a row with no left-column narration. This means in the assembly manifest it needs to be treated as a HOLD-with-visual over the preceding narration's tail end, or as a silent visual insert. Visual-spec should note this.

**举国体制 transition:** Narration changed from *"So when the US imposed export controls, it didn't just threaten China's tech industry. It activated a deep reflex — what the Chinese call 举国体制"* to *"It activated something deeper — the reflex to mobilize. The Chinese call it 举国体制."* Visual spec unchanged (same KineticTypography card). ✅ **Aligned.** The illustrate-then-name pattern is reflected in the visual spec's new annotation: *"'mobilize' sets the emotional register before the Chinese term lands."*

**Typewriter footage:** Inserted between lithography DataChart and SMIC yield TimeSeriesChart. Narration: *"It's like writing a novel by punching out one letter at a time on a typewriter when everyone else has a word processor."* Visual: typewriter closeup, standard treatment, inset @ 65%, 6s. ✅ **Aligned.** The metaphor gets its own visual home. The narration sentence was split from the preceding paragraph (previously part of the lithography description). The split is clean — no orphaned content.

### Beat 4 — GameBoard + Jake Sullivan + footage swap
**GameBoard chess:** Narration: *"The US plays chess — the strategy Jake Sullivan laid out in that 2022 speech. Target specific companies. Capture specific pieces."* Visual: GameBoard variant "chess", pieces labeled Nvidia/ASML/Huawei, US-blue color. ✅ **Aligned.** The Sullivan name addition in the narration doesn't affect the visual spec — the chess board still shows company pieces being captured.

**GameBoard go:** Narration unchanged from v4. Visual: GameBoard variant "go", 9×9 board, China-red, animated stone placement. ✅ **Aligned.** The annotation *"Show enough complexity (reading, territory) to respect the game — Wei will notice"* is a helpful spec note for visual-spec.

**Beat 4 closing footage → IMAGE:** Changed from `FOOTAGE · "world map divided split"` to `IMAGE · "semiconductor chip macro photography"`. ✅ **Aligned.** The narration here is about Miller's bifurcation prediction — the preceding RouteAnimation (supply chain map) and ChoroplethMap (caught-in-between nations) already show the geographic argument visually. A neutral chip macro is appropriate ambient texture for the closing narration. The annotation *"the route map that precedes this already shows bifurcation visually"* is accurate.

### Beat 5 — DecisionTree + tightened opening
**DecisionTree:** Narration: *"How quickly will transformative AI arrive? If it comes fast — two, three years... If it takes a decade..."* Visual: DecisionTree with root "AI arrival timeline", Branch A "Fast (2-3 years)" → "Controls succeeded", Branch B "Slow (10+ years)" → "Controls backfired", hold 12s. ✅ **Aligned.** The 12s hold (up from 10s in v4) matches the re-validation concern from persona-eval that Sofia needs time to absorb branching diagrams.

**Opening narration tightened:** Changed from *"There's a question underneath all of this that nobody can answer..."* to *"Everything I've just described — the controls, the brute-force engineering, the trapped allies, the trillion-dollar standoff — all of it turns on a single variable nobody can predict."* The DecisionTree visual spec doesn't reference the narration text, so this is a pure narration change with no visual drift. ✅ **Aligned.**

---

## Check 2: P1 Realignment

Mapping P1 visuals in v5:

| # | P1 Visual | Narrative Moment | Still a Peak? |
|---|-----------|-----------------|---------------|
| 1 | FOOTAGE: TSMC Arizona aerial | Opening cinematic | ✅ Yes |
| 2 | LAYERED: "92% YIELD" over cleanroom | First data reveal | ✅ Yes — upgraded from P2 |
| 3 | LAYERED: "$165 BILLION" over aerial | Scale of investment | ✅ Yes — upgraded from P2 |
| 4 | FOOTAGE: cleanroom wafer handling | What a fab IS | ✅ Yes |
| 5 | DataChart: 7% demand | The paradox crystallized | ✅ Yes |
| 6 | IMAGE: FDR 1941 | Historical anchor | ✅ Yes |
| 7 | TimelineComparison (×2) | Core structural parallel | ✅ Yes |
| 8 | FOOTAGE: Cold War archival | COCOM bridge | ✅ Yes — NEW, earns P1 |
| 9 | FOOTAGE: China high speed rail | Beat 3 opening visual | ✅ Yes |
| 10 | KineticTypography: 卡脖子 | Naming moment (now post-story) | ✅ Yes — stronger in new position |
| 11 | DataChart: 34 vs 9 | Brute-force proof | ✅ Yes |
| 12 | FOOTAGE: typewriter | Metaphor anchor | ✅ Yes — NEW, earns P1 |
| 13 | FrameworkDiagram: Kirin X90 | Marketing vs reality | ✅ Yes |
| 14 | GameBoard: chess | US strategy visualized | ✅ Yes — upgraded from FrameworkDiagram |
| 15 | GameBoard: go | China strategy visualized | ✅ Yes — upgraded |
| 16 | RouteAnimation: supply chain | The trap visualized | ✅ Yes |
| 17 | KineticTypography: Morris Chang | Emotional climax | ✅ Yes |
| 18 | FOOTAGE: consumer montage | Personal stakes | ✅ Yes |
| 19 | TitleTransition: end card | CTA | ✅ Yes |

**Assessment:** No wasted P1s. Two former P2s (stats in Beat 1) upgraded to P1 via layered mode — justified because they're now composited hero moments rather than standalone text cards. Two new P1 entries (Cold War bridge footage, typewriter footage) both earn their priority by anchoring critical transition moments.

---

## Check 3: Rhythm Integrity

### Updated Visual Rhythm Map

```
BEAT 1 — The Paradox (3:00):
  [FOOTAGE·P1 6s] [LAYERED·P1 3s] [FOOTAGE·P1 18s] [LAYERED·P1 4s]
  [FOOTAGE·P2 20s] [CHART·P1 4s] [FOOTAGE·P3 10s]
  ✅ Excellent. Two layered moments fuse stats to footage. No MG clusters.
  Mode: FOOTAGE ~54s, LAYERED ~7s, MG ~4s → 83% footage/layered, 6% MG

BEAT 2 — The Logic of Denial (4:00):
  [TITLE 2s] [IMAGE·P1 12s] [TIMELINE·P1 10s] [TRANSITION 1s] [TIMELINE 8s]
  [IMAGE·P2·conflict 8s] [KINETIC·P2·conflict 5s]
  [CHART·P2 6s] [FOOTAGE·P1·editorial 7s] [CHOROPLETH·P2 8s]
  [FRAMEWORK·P2 8s] [IMAGE·P3 6s]
  ✅ Fixed. Former 4-MG cluster (KINETIC→CHART→CHOROPLETH→FRAMEWORK) now
     broken by 7s Cold War footage: CHART → FOOTAGE → CHOROPLETH → FRAMEWORK
     = max 2 consecutive MGs after the footage break. VIS-02 satisfied.
  Conflict treatment on Sullivan image + revenue deal → symmetric with Beat 3.

BEAT 3 — The Other Side of the Wall (5:30):
  [TITLE 2s] [FOOTAGE·P1·conflict 4s+3s+4s] [KINETIC·P1 5s]
  [FOOTAGE·P3·conflict 4s] [KINETIC·P2 4s]
  [CHART·P1 8s] [FOOTAGE·P1 6s] [TIMESERIES·P2 6s]
  [FRAMEWORK·P1 6s] [FOOTAGE·P3 4s] [IMAGE·P2 6s] [KINETIC·P2 5s]
  [HOLD 2s] [FOOTAGE·P3 8s]
  ✅ Fixed. Former 4-MG cluster (KINETIC→CHART→CHART→FRAMEWORK) now
     broken by 6s typewriter footage: CHART → FOOTAGE → TIMESERIES → FRAMEWORK
     = max 2 consecutive MGs. VIS-02 satisfied.
  卡脖子 KineticTypography now arrives after footage montage (illustrate-then-name).
  Shenzhen footage (4s) provides breath between 卡脖子 and 举国体制 KineticTypography.

BEAT 4 — The Trap (3:00):
  [TITLE 2s] [GAMEBOARD·P1 8s] [GAMEBOARD·P1 8s] [TRANSITION 1s]
  [ROUTE·P1 12s] [KINETIC·P2 3s] [CHOROPLETH·P2 10s] [KINETIC·P1 5s]
  [IMAGE·P3 8s]
  ⚠️ Minor: GAMEBOARD → GAMEBOARD is same template type back-to-back (16s),
     but this is intentional — chess→go contrast IS the argument. Visually distinct
     (different board geometry, piece types, color schemes). Not a monotony issue.
  ⚠️ Minor: ROUTE → KINETIC → CHOROPLETH → KINETIC = 4 MGs (~30s) before closing
     IMAGE. This was present in v4 and not addressed by v5 fixes. However: the
     RouteAnimation is a 12s hero visual (the trap *shown*), the "A TRAP FOR EVERYONE"
     KineticTypography is 3s dramatic punctuation, the ChoroplethMap shows the caught-in-
     between nations, and the Morris Chang quote is the emotional climax. Each carries
     distinct content. The closing IMAGE provides the eventual footage break. This is
     acceptable — the sequence is dense but every element earns its place.

BEAT 5 — Your Chips (2:00):
  [TITLE 2s] [DECISIONTREE·P2 12s] [FOOTAGE·P1 9s] [FOOTAGE·P2 8s]
  [ROUTE·P2 10s] [FOOTAGE·P3 8s] [HOLD 3s] [TITLE·P1 4s]
  ✅ Good rhythm. DecisionTree hold extended to 12s (was 10s). MG/footage alternation.
```

### Mode Balance (v5 vs v4)

| Mode | v4 | v5 | Target | Status |
|------|----|----|--------|--------|
| Footage + archival | ~55% | ~52% | 50-70% | ✅ In range |
| Motion graphics | ~40% | ~35% | 20-30% | ⚠️ Still ~5pts over, but improved |
| Layered | 0% | ~5% | 5-15% | ✅ Now in range |

MG percentage dropped ~5 points (from two stats converting to layered mode + two footage insertions). Still slightly above the 30% ceiling, but the remaining MG density is concentrated in purposeful analytical sequences (Beat 4's trap argument), not in undifferentiated clusters. Acceptable.

### Rhythm Comparison: v4 → v5

| Issue | v4 Status | v5 Status |
|-------|-----------|-----------|
| Beat 2 MG cluster (4 consecutive, 27s) | ⚠️ VIS-02 violation | ✅ Fixed — Cold War footage breaks cluster |
| Beat 3 MG cluster (4 consecutive, 23s) | ⚠️ VIS-02 violation | ✅ Fixed — typewriter footage breaks cluster |
| Beat 4 FRAMEWORK×2 (same type, 16s) | ⚠️ Monotony risk | ✅ Resolved — GameBoard chess/go are visually distinct |
| Beat 4 trailing MG run (30s) | ⚠️ Present | ⚠️ Still present — acceptable (see note above) |
| Layered mode absent | ⚠️ 0% vs 5-15% target | ✅ Fixed — two layered moments in Beat 1 |
| Conflict treatment asymmetric | ⚠️ PER-01 violation | ✅ Fixed — symmetric across Beats 2+3 |

---

## Original Audit Issue Checklist

### Must-fix items (5/5 resolved):
1. ✅ Chess/go → GameBoard (Issue 1.1/5.1)
2. ✅ AI timeline → DecisionTree (Issue 1.2/5.2)
3. ✅ SMIC yield → TimeSeriesChart (Issue 1.3/5.3)
4. ✅ Beat 2 MG cluster broken (Issue 3.1)
5. ✅ Conflict treatment symmetric (Issue 4.1, Option B)

### Should-fix items (3/4 resolved, 1 declined):
6. ✅ Beat 3 MG cluster broken (Issue 3.2)
7. ✅ Layered mode added to Beat 1 (Issue 3.4)
8. ⊘ SplitComposition thesis beat — declined (Issue 5.4)
9. ✅ "Geopolitical divide" footage cut (Issue 5.6)

### Nice-to-have items (0/2 addressed):
10. ○ Explicit HOLD entries for pause beats (Issue 1.4) — can be handled by visual-spec
11. ○ ProbabilityGauge for Beat 5 (Issue 5.5) — declined

---

## Drift Issues

### Issue D1: "$165 BILLION" footage re-cue [LOW]
**Location:** Beat 1, LAYERED composition #2
**Problem:** The spec says "composited over TSMC Arizona aerial drone footage (continuing from opening)" but the opening aerial is 45+ seconds earlier with cleanroom footage and other shots between. This isn't a continuation — it's a re-cue of the aerial footage.
**Fix:** Visual-spec should either (a) specify this as a separate aerial footage segment with its own search terms, or (b) note that the same source clip should be re-cued at this point. Not a blocking issue — visual-spec can infer the correct approach.

### Issue D2: Empty narration row for Shenzhen footage [LOW]
**Location:** Beat 3, between 卡脖子 KineticTypography and 举国体制 paragraph
**Problem:** The Shenzhen skyline footage (4s, conflict treatment) sits in a table row with an empty left column. For the assembly manifest, this needs to be treated as a visual-only insert — either overlapping with the trailing narration from the 卡脖子 paragraph or as a deliberate silent visual breath.
**Fix:** Visual-spec should mark this as a HOLD-with-visual entry in the assembly manifest. Not a blocking issue.

### Issue D3: Beat 4 trailing MG run persists [LOW]
**Location:** Beat 4, compositions #17-20 (RouteAnimation → KineticTypography → ChoroplethMap → KineticTypography)
**Problem:** 4 consecutive MGs spanning ~30s before the closing IMAGE. This was flagged in the v4 audit but not addressed in v5.
**Assessment:** Each element is purposeful: the route map shows the trap, "A TRAP FOR EVERYONE" punctuates the thesis, the choropleth shows caught-in-between nations, Morris Chang's quote lands the emotional climax. Inserting footage between any of these would break the analytical momentum that builds to the Morris Chang payoff. **Recommend accepting this as an intentional dense sequence.** The IMAGE at the end provides the eventual reset.

---

## Verdict: ALIGNED

All 5 must-fix items from the original audit are resolved. 3 of 4 should-fix items are resolved (1 intentionally declined). The visual layer is correctly matched to the revised narration across all five beats. Two minor drift items (D1, D2) are cosmetic and can be handled downstream by visual-spec without script changes.

**The script is ready for visual-spec.**

Proceed to: `visual-spec` → regenerate JSON data files from v5 script.
