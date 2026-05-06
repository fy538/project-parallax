# Parallax — Oracle Track

> Created: May 5, 2026
> Status: Active from launch
>
> The Oracle track is a compounding credibility asset. Every prediction made and logged
> before an episode publishes becomes a timestamped record that accrues value over time.
> The "Was I Right?" retrospective is the mechanism that converts that record into content.

---

## What the Oracle Track Is

A systematic practice of:
1. Making explicit, falsifiable predictions embedded in episodes (with numeric probabilities)
2. Logging those predictions to the concept registry before publish (timestamp = accountability)
3. Benchmarking estimates against Kalshi/Polymarket market prices at prediction time
4. Running quarterly "Was I Right?" retrospectives that score and publicly update the record

The differentiator: nobody on YouTube does this systematically for geopolitical analysis. Confident pundits (Zeihan, Jiang) make predictions but never score themselves. The Oracle track turns epistemological humility into content.

---

## Where Predictions Come From

Predictions are generated at two pipeline points:

**Primary: Research Pass 3 (Speculative Implications)**
The Pass 3 deep research prompt explicitly asks for:
- 2-3 named scenarios with rough probabilities
- 1-2 falsifiable predictions with timeframes and resolution criteria
- "What would change my mind" factors
- Watch signals the audience can track

These are the raw materials. The research-bridge skill auto-generates the Pass 3 prompt.

**Secondary: Script-Draft phase**
During narration drafting, the bounded verdict close (per SCRIPT_FORMAT.md) requires a watchpoints section. These watchpoints often contain implicit predictions — the script-draft self-check now includes a bounded verdict close checklist item. When the writer identifies a prediction-quality watchpoint (specific, falsifiable, time-bounded), it should be elevated to a formal prediction entry.

**Both sources feed the same output:** entries in `data/concepts.json` with `type: "prediction"`.

---

## Prediction Quality Criteria

A prediction qualifies for the registry when it satisfies all four:

| Criterion | Test |
|---|---|
| **Specific** | The claim is unambiguous — a third party reading it should reach the same verdict on whether it was confirmed or falsified |
| **Time-bounded** | Resolution date is explicit (ISO quarter or date, e.g., `2027-Q4`) |
| **Falsifiable** | There is a specific observable event that would prove it wrong |
| **Probabilistic** | A numeric probability is assigned (e.g., 0.65, not "likely") |

**Not a prediction:** "The US-China tech rivalry will intensify." (not specific, not falsifiable)
**Is a prediction:** "China will not achieve commercial-scale 7nm production (>50K wafers/month) by Q4 2027. Probability: 65%." (specific, time-bounded, falsifiable, probabilistic)

---

## Probability Calibration Standards (Tetlock)

From the superforecasting research (`project/psychology/06-calibration-superforecasting.md`):

- Use numeric probabilities, never verbal: "I think this is quite likely" is meaningless. "I assign 70% probability" is a testable claim.
- Reference class first: before estimating, ask "what's the base rate for this type of event?"
- Distinguish inside view from outside view: start with the base rate, then adjust for case-specific factors
- Never use round numbers as defaults: 0.5 and 0.7 are lazy. 0.52 and 0.67 are calibrated.
- State the probability at prediction time AND note the Kalshi/Polymarket market price if a relevant contract exists

**Calibration benchmark:** Track Brier scores over time. Brier = (probability − outcome)². Perfect = 0. Uninformative (always 50%) = 0.25. A calibrated forecaster over many predictions converges to <0.18.

---

## The Concept Registry Entry

File predictions to `data/concepts.json` during or immediately after script-draft, before the episode publishes. Use `type: "prediction"` and the `prediction` sub-object.

**Required fields:**
```json
{
  "id": "china-7nm-scale-2027",
  "term": { "en": "China 7nm commercial scale" },
  "type": "prediction",
  "definition": "China will not achieve commercial-scale 7nm chip production (>50K wafers/month) by Q4 2027.",
  "insight": "Export controls slow but don't stop — the question is rate. If SMIC can't scale 7nm by late 2027, controls succeeded in buying at least one generation of lead time.",
  "_status": "draft",
  "introduced": {
    "episode": "silicon-trap",
    "beat": 5,
    "timestamp": "16:00-18:00"
  },
  "prediction": {
    "claim": "China will not achieve commercial-scale 7nm chip production (>50,000 wafers/month) by Q4 2027.",
    "probability": 0.65,
    "timeframe": "2027-Q4",
    "falsification": "SMIC or another Chinese fab announces >50K wafers/month of 7nm-equivalent (N+2 or better) production, confirmed by TechInsights teardown or SMIC quarterly report.",
    "whatWouldChangeMyMind": "A credible TechInsights teardown showing 7nm yields above 70% on Chinese-built chips in volume before 2027, or SMIC's quarterly filings showing wafer count growth inconsistent with 7nm-only operation.",
    "status": "open",
    "watchSignals": [
      "SMIC quarterly earnings — wafer shipments by node",
      "TechInsights teardowns of Huawei/Chinese-brand flagship chips",
      "CSIS semiconductor tracker updates",
      "Kalshi: China advanced chip production contracts if listed"
    ]
  }
}
```

**Timing rule:** The entry must be committed to git before the episode is published. The git commit timestamp is the accountability anchor.

---

## How Predictions Appear in Episodes

Predictions should be embedded naturally in the bounded verdict close (last 2-3 minutes of each episode). Three formats, in order of preference:

**Format A — The Explicit Forecast Card (strongest Oracle signal)**
Narration states the prediction with probability while a visual card appears on screen showing: claim, probability, timeframe, key watch signal.
> "My best reading: China will not achieve commercial-scale 7nm production by the end of 2027. I'd put that at around 65%. Here's what to watch: SMIC's quarterly wafer counts and the next Huawei flagship teardown."

**Format B — Named Scenario with Probabilities**
Three named scenarios with rough probabilities. No single-point prediction, but a probability-weighted scenario map.
> "Three ways this plays out. The Murano Scenario — China achieves 7nm at scale, controls have only bought time: 35%. The COCOM Scenario — controls hold for a decade, China stays a generation behind: 45%. The Ostrom Scenario — the multilateral framework collapses and controls dissolve: 20%."

**Format C — Watchpoints Only (minimum Oracle signal)**
No numeric probability, but specific signals the viewer can track. Weakest form — use only when the prediction is genuinely too uncertain for a number.
> "Watch three things: SMIC's quarterly numbers for wafer-count anomalies, TechInsights teardowns of Chinese flagship phones, and Kalshi's contract on Taiwan conflict — if the market moves on that one, the incentive structure has shifted."

**Rule:** Every episode must include at least Format C. The Oracle track only compounds if it's consistent. An episode without any watchpoints is an Oracle miss.

---

## The "Was I Right?" Content Formats

### Short (45 seconds)

Structure:
- **0-5s**: Title card — "Was I Right?" + original prediction date + channel mark ∴
- **5-15s**: State the prediction verbatim, with original probability. Show original episode thumbnail.
- **15-30s**: What happened. Specific evidence — the actual numbers, the event, the TechInsights result.
- **30-40s**: Score it. "I said 65%. The market said 45%. The outcome was X. Brier score: 0.12 — better than the market on this one. Here's what my model got right."
- **40-45s**: The lesson in one sentence. Updated probability if still open. "Revised to 55% — one piece of evidence moved me."

Visual: Split-screen — original clip on left, evidence card on right. The Brier score appears as a running tally watermark.

### Quarterly Long-Form (15-20 minutes, "The Scorecard")

Published quarterly. Structure:
1. **Open predictions review** (10-12 min): Walk every open prediction. For each: original claim → original probability → Kalshi price at the time → current evidence → Brier update → decision (hold, revise, or close)
2. **Closed predictions** (2-3 min): Fully resolved ones from the quarter. Score, lesson, what I'd do differently
3. **Calibration assessment** (2 min): Running Brier average vs. baseline (always-50% strategy) and vs. Kalshi market prices as a group
4. **New predictions for next quarter** (1-2 min): 2-3 fresh predictions derived from current episode analysis, with explicit probabilities

**What makes this different from generic "prediction recap" content:** The scoring is rigorous and public, including losses. The comparison to Kalshi market prices grounds it in a reference baseline. The explicit "what would change my mind" on still-open predictions invites the audience to challenge the analysis.

---

## Kalshi/Polymarket Integration

Prediction markets are the calibration benchmark and the analytical device, not a promotional tool. Two use cases:

**As benchmark:** When filing a prediction, check Kalshi/Polymarket for a relevant contract. Record the market price at prediction time alongside your own estimate. The divergence between your estimate and the market price is the story: either the market is missing something you see, or you're overconfident on something the market has priced correctly.

**As analytical puzzle:** When the market price diverges significantly from expert consensus, that divergence is a Detective episode hook in itself. "Kalshi prices a Taiwan strait incident at 8%. Most analysts say the risk is higher. Where is the money right? Where is it wrong?" This is the "The Market Says..." Shorts series.

**What to check:** Kalshi, Polymarket, Metaculus. For geopolitical questions, Metaculus tends to have more liquidity on niche questions. Kalshi has the most US regulatory legitimacy (CFTC-regulated). Cross-reference all three when relevant contracts exist.

**What NOT to do:** Do not embed Kalshi prices as endorsements or financial recommendations. Frame them as "the market consensus" and always note the limitations (thin markets, US-centric participant base, recency bias).

---

## Prediction Scoring Log

Beyond the concept registry, maintain a running scorecard at `data/predictions-log.json`. This is a flat list optimized for the quarterly retrospective, not for concept callbacks.

```json
{
  "predictions": [
    {
      "id": "china-7nm-scale-2027",
      "episode": "silicon-trap",
      "publishDate": "2026-Q3",
      "claim": "China will not achieve >50K wafers/month 7nm by Q4 2027",
      "probabilityAtPrediction": 0.65,
      "kalshiPriceAtPrediction": null,
      "metaculusPriceAtPrediction": null,
      "status": "open",
      "lastReviewed": "2026-Q3",
      "currentProbability": 0.65,
      "brierPartial": null,
      "resolutionDate": null,
      "outcome": null,
      "brierFinal": null,
      "lesson": null
    }
  ],
  "calibrationSummary": {
    "totalPredictions": 0,
    "closed": 0,
    "runningBrier": null,
    "kalshiBrier": null,
    "baselineBrier": 0.25
  }
}
```

The `publish-retro` skill should update this log when episodes close predictions.

---

## Pipeline Integration

**Where it lives in the pipeline:**

- **Stage 3 (Deep Research)**: Pass 3 prompt generates speculative implications including 1-2 falsifiable predictions. These are raw material.
- **Stage 5 (Angle Memo)**: Angle memo specifies which prediction(s) from Pass 3 to include and in which format (A/B/C above).
- **Stage 6 (Script Draft)**: Script-draft self-check includes "bounded verdict close present: best current reading + confidence boundary + 2-3 watchpoints." The writer elevates any prediction-quality watchpoints to the registry.
- **Before publish (Stage 10)**: Final check — at least one prediction entry for the episode must be committed to `data/concepts.json` and `data/predictions-log.json` before the YouTube upload begins.

**The non-negotiable rule:** If a prediction isn't in the registry before the episode publishes, it doesn't count as an Oracle prediction. Post-hoc filing is cheating. The git commit timestamp enforces this.

---

## Maintenance

- **Weekly**: Check Kalshi/Metaculus for any new contracts relevant to open predictions. Note price movements in `predictions-log.json`.
- **Quarterly**: Run "Was I Right?" long-form. Update all open predictions. Close resolved ones with Brier score.
- **Per episode**: File at least 1 prediction before publish. Check whether the episode resolves any prior prediction.
- **Annual**: Publish a "Year One Calibration Report" — all predictions made in year one, final Brier average, comparison to Kalshi baseline. This is the Oracle track's most powerful content.
