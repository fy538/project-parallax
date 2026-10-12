# SHORTS EXTRACTION
## Episode: prisoners-dilemma — "What the Prisoner's Dilemma Gets Wrong"
## Date: 2026-05-18

Produced via `shorts-adaptation` skill, two-phase flow (May 2026 doctrine). Phase 1 consumed two design-time `[SHORTS-BEAT:]` tags placed at outlining time. Phase 2 auto-extracted two additional Shorts from Beats 2 and 3. All four passed the standalone test AND the hedge-strip self-check.

| # | Series | Origin | Template | Source |
|---|---|---|---|---|
| 01 | History Rhymes | `design-time-tagged` (script L48) | StatRevealShort | Beat 1 — The Failed Experiment |
| 02 | Framework in 45s | `design-time-tagged` (script L190) | SplitComposition-Short | Beat 4 — There Was Always Another Game |
| 03 | Both Sides Are Wrong | `auto-extracted` | SplitShort | Beats 2 + 3 (narrowing + wrong-default) |
| 04 | History Rhymes | `auto-extracted` | DataChartShort | Beat 3 — Black-Scholes parallel |

---

### Short 01: "The Theory Predicted Mutual Defection. They Cooperated Sixty Percent of the Time."
**Series:** History Rhymes
**Origin:** `design-time-tagged` — `[SHORTS-BEAT: history-rhymes; standalone:"..."]` at script-production.md:48
**Template:** StatRevealShort
**Duration:** 35s
**Source beat:** Beat 1 — The Failed Experiment (0:00–2:30 of the long-form)

**Hook (first 3 seconds):**
Frame-1: bone-on-ink type, **60%** stacked above **0%**, with right-aligned mono captions "observed cooperation" / "predicted by model". Voice (cold, calm): *"In 1950, the Prisoner's Dilemma's first experiment got 60% cooperation."*

**Script (narration text, ~135 words):**

> In January 1950, two researchers at the RAND Corporation ran the first prisoner's dilemma experiment. The subjects — an economist and a mathematician — played a hundred rounds of the game that was supposed to prove cooperation is irrational. They cooperated sixty percent of the time. Mutual defection — the only outcome the model predicted — happened fourteen times.
>
> John Nash read the results and blamed the players, not the model. He said they would have been more rational if they couldn't see each other. That response — ring-fence the model, question the players — set a template that's still running 75 years later. You hear it every time someone says rational actors defect.
>
> The model failed its first test. Then it conquered strategic thinking anyway. There's a name for that pattern — and it's in the full essay.

**Visual spec:**
- StatRevealShort hero: `value: 60`, `suffix: "%"`, `label: "cooperation observed (Flood-Dresher, RAND 1950)"`
- Comparisons: 0% (predicted by Nash equilibrium), 14% (mutual defection observed)
- Backdrop: light, mid-century corporate-modernist register (paper background)
- Source caption: "Flood & Dresher (1952), RAND RM-789-1"

**Concept registry:**
- Introduces (briefly): `cooperation-residual` — the persistent gap between PD prediction and observed cooperation. Full registration handled at long-form publish.

**Standalone test:** ✓ The number contrast (60% vs 0%) and Nash's response are self-contained; no prior beats required.

**Hedge-strip self-check:** ✓ Tightened during eval (commit 0a20333): "predicted zero" → "predicted mutual defection" so the claim matches the long-form's equilibrium-prediction vocabulary. A game theorist watching would defend it as worded.

---

### Short 02: "Most Prisoner's Dilemmas Aren't"
**Series:** Framework in 45 Seconds
**Origin:** `design-time-tagged` — `[SHORTS-BEAT: framework-in-45s; standalone:"..."]` at script-production.md:190
**Template:** SplitComposition-Short
**Duration:** 45s
**Source beat:** Beat 4 — There Was Always Another Game (10:00–14:00 of the long-form)

**Hook (first 3 seconds):**
Frame-1: SplitComposition — left **PRISONER'S DILEMMA** with one glowing defection dot, ∴ divider, right **STAG HUNT** with two glowing dots (cooperative dot in amber). Caption below: *"Most prisoner's dilemmas aren't."* Voice: *"The Prisoner's Dilemma has one equilibrium: defection."*

**Script (narration text, ~140 words):**

> The Prisoner's Dilemma has one equilibrium — mutual defection. Whatever the other player does, you do better by defecting. The Stag Hunt has two equilibria: hunters can all chase the stag together (high payoff, requires trust) or all settle for the hare alone (low payoff, perfectly safe). Both are stable.
>
> Most situations people call prisoner's dilemmas are actually stag hunts. Climate negotiations, trade talks, US-China AI safety — repeated interactions between identifiable counterparties who can communicate. The philosopher Brian Skyrms proved that an iterated PD is mathematically equivalent to a stag hunt.
>
> Some things really are prisoner's dilemmas — OPEC cheating, anonymous one-shots. The point isn't that PD is always wrong. The point is it's the wrong default. And defaulting to it locks in cooperation failure that wasn't structurally required.

**Visual spec:**
- SplitComposition-Short left pane: title "PRISONER'S DILEMMA", payoff matrix glyph with single ink-dot equilibrium at (D,D), tag "1 equilibrium"
- Right pane: title "STAG HUNT", payoff matrix glyph with TWO dots — bone dot at (Hare,Hare) and amber dot at (Stag,Stag), tag "2 equilibria"
- Divider: ∴ brand mark
- Lower banner: "Most prisoner's dilemmas aren't." (amber on bone)

**Concept registry:**
- Introduces: `ostromian-cooperation` (callback to long-form Beat 4)
- Pays off the open loop seeded in Beat 1: "the name for the game they were really playing"

**Standalone test:** ✓ The dot-count contrast is geometric and self-explanatory; Skyrms's equivalence is a sentence-level claim with a citation handle.

**Hedge-strip self-check:** ✓ Tightened during eval (commit 0a20333): earlier draft framed the difference as "PD assumes you can't talk; Stag Hunt assumes you can" — folksy compression misrepresenting Skyrms. Corrected to locate the difference in equilibrium structure, matching the long-form AND the visual.

---

### Short 03: "Hawks and Doves Are Playing the Same Game. It's the Wrong One."
**Series:** Both Sides Are Wrong
**Origin:** `auto-extracted` — synthesized from Beat 2 (narrowing argument) + Beat 3 (the wrong default)
**Template:** SplitShort
**Duration:** 50s
**Source beat:** Beats 2 + 3 (HOW A FAILED MODEL CONQUERED THE WORLD + THE WRONG GAME)

**Hook (first 3 seconds):**
Frame-1: SplitShort — left **HAWKS** with "defect first" + small ink dot motif; right **DOVES** with "defection is structural" + identical ink dot motif. Bridge caption: "Same model. Wrong game." Voice: *"Hawks say defect first because rivals will defect."*

**Script (narration text, ~145 words):**

> Hawks say defect first — controls, sanctions, decoupling — because rivals will defect. Doves say cooperation is impossible because the structure forces defection. Both sides are reading from the same model: the Prisoner's Dilemma.
>
> That model failed its own first test in 1950. By 1975 it had two thousand scholarly papers — and every assumption it requires — no communication, no reputation, no future — peeled another scenario off its actual domain. The model spread everywhere. It applies almost nowhere.
>
> Most US-China interactions aren't anonymous one-shots. They're repeated negotiations between identifiable counterparties with communication channels and reputations. Both hawks and doves are using the wrong default — and treating it as a Prisoner's Dilemma creates the defection it predicts.
>
> Some things really are prisoner's dilemmas. Most things aren't. The full essay names what game we're actually playing.

**Visual spec:**
- SplitShort header: "Both sides are playing the wrong game"
- Left pane (HAWKS): position "defect first", reasoning "rivals will defect", color: muted ink
- Right pane (DOVES): position "defection is structural", reasoning "the model proves it", color: muted ink (deliberately matching — same model)
- Bottom: "Same model. Wrong game." (amber accent)
- Brand mark ∴ between panes

**Concept registry:**
- Callback: `the-wrong-game` (from Beat 3) — the Short opens the framing publicly
- Callback: `cooperation-residual` (concept introduced in Short 01)

**Standalone test:** ✓ The bilateral-debate framing is recognizable to any US-China-aware viewer; the model-criticism resolves without naming any beat from the long-form.

**Hedge-strip self-check:** ✓ Bounded clause inside the 45-60s window ("some things really are prisoner's dilemmas. Most things aren't"). Without the "most" qualifier, the Short would sound like "the PD is fake" — which is NOT what the long-form argues. The qualifier preserves the bounded-analogy register.

---

### Short 04: "1973: Black-Scholes. 1987: The Smile."
**Series:** History Rhymes
**Origin:** `auto-extracted` — Beat 3 one-sentence parallel expanded into a standalone piece
**Template:** DataChartShort
**Duration:** 40s
**Source beat:** Beat 3 — The Wrong Game (6:00–10:00 of the long-form, the Black-Scholes parallel at ~7:30)

**Hook (first 3 seconds):**
Frame-1: DataChartShort — implied-volatility chart drawing in. Two regions: 1976–1987 flat line (caption "model = reality") then post-October-1987 permanent skew (caption "the smile"). Voice: *"In 1973, Black and Scholes wrote an equation for option pricing."*

**Script (narration text, ~135 words):**

> In 1973, Fischer Black and Myron Scholes wrote an equation for how options should be priced. Within a decade, traders had reorganized their behavior around the equation — and market prices converged to match its predictions. Implied volatility went flat. The model wasn't describing reality. Reality was rearranging itself to match the model.
>
> Until October 1987. After the crash, a permanent skew appeared in the implied volatility surface — traders call it "the smile." The model still works on quiet days. The smile is where reality refused to comply.
>
> The Prisoner's Dilemma did the same thing to international relations. Assume defection is rational. Train diplomats in it. Build institutions around it. The prediction comes true — because everyone believed it.
>
> A model becomes a script. Until something breaks.

**Visual spec:**
- DataChartShort variant: `line` (time-series)
- xAxis: 1973–2024
- yAxis: implied volatility (relative)
- Two regions:
  1. 1976–Oct 1987 — flat line near baseline, region labeled "model = reality" (bone background)
  2. Oct 1987–2024 — skewed surface, region labeled "the smile" (paper-bone contrast)
- Annotation: vertical rule at October 1987, label "Black Monday"
- Title: "The Black-Scholes Smile"
- Subtitle: "When a model becomes a script — until it can't"
- Source caption: "Derman & Kani (1994); standard equity-options literature"

**Concept registry:**
- Introduces: `self-fulfilling-model` (the broader pattern; PD is one instance, BSM is another)

**Standalone test:** ✓ The Black-Scholes story is well-known enough in finance-adjacent audiences to land standalone; the PD payoff is one sentence at the end and is optional for the Short's editorial work.

**Hedge-strip self-check:** ✓ The bounded clause is structural: "The model still works on quiet days. The smile is where reality refused to comply." Without that, the Short would sound like "Black-Scholes is broken" — which is wrong. Long-form treats the smile as the limit case of an otherwise-useful model. Matches.

---

## Scheduling Notes

Recommended order (matches algorithm-discovery / funnel best practice from research-2026-05-18):

| Day | Short | Series | Rationale |
|---|---|---|---|
| T-3 | 04 — Black-Scholes pattern | History Rhymes | Standalone hook that doesn't require PD knowledge; broadens discovery to a finance-adjacent audience that may not yet follow Parallax |
| T-1 | 01 — 60% / 0% experiment | History Rhymes | Builds anticipation 24h before long-form drop; the cliffhanger ending ("there's a name for that pattern") drives clicks |
| T+2 | 02 — Most PDs aren't | Framework in 45s | Captures search traffic from viewers who watched the long-form and are now searching "stag hunt" / "Skyrms" |
| T+5 | 03 — Hawks and Doves | Both Sides Are Wrong | Topical hook for the US-China-news-cycle audience; lands after the long-form has been ranked for a few days |

**Cadence note:** 4 Shorts across an 8-day window = 1 every 2 days. Matches the research-recommended 2/week floor for solo educational creators. Below this, the algorithm under-classifies the channel.

## Cross-promotion

Every Short ends with one of two tails (no surprise — the research recommended direct-promise CTAs over teaser bait):

- **Default tail (Shorts 01, 02, 03):** "Full essay on Parallax — link in bio." End card shows the long-form's title card with the episode's amber accent.
- **Black-Scholes tail (Short 04):** "Full essay traces the same pattern through international politics." Same end card.

Description per Short:
- Pinned comment carries the long-form link + a one-line cross-promotion to one OTHER Short in the batch (Short 01 ↔ Short 02; Short 03 ↔ Short 04) — internal-network signal to the algorithm.
- No clickbait. The Short delivers a complete editorial beat; the long-form is the deeper treatment.

---

## Render Handoff

Companion machine-readable manifest at [`shorts-manifest.json`](shorts-manifest.json). To render:

```bash
cd remotion-templates && npm run shorts -- --episode=prisoners-dilemma
```

To preview frame 30 of all four as PNGs first:

```bash
cd remotion-templates && npm run shorts -- --episode=prisoners-dilemma --preview
```

Outputs land in `episodes/prisoners-dilemma/shorts/short-{01..04}.{mp4,png}`.
