# ProbabilityGauge — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (NYT Upshot, FiveThirtyEight, Kalshi/Polymarket, RAND/CNA, The Economist); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**One named source, one time horizon, one number — the arc is just the container.** The gauge form earns its rectangle only when a probability can be cited from a forecasting model, prediction market, or published assessment; without attribution it is epistemic theater (D7). Use `gauge` for 1–2 values, `strip` for 3–4 source comparisons on a shared axis, `shift` for before/after transitions with an explicit trigger, `scorecard` for a track record, `forecast` for the full 6-layer superforecasting card with base rate, key driver, disconfirmer, benchmark, and resolution criteria. `palette.amber` for probabilities above 60%, `palette.rust` below 30%, neutral for the 30–60% zone where honest uncertainty lives.

---

## § 1 Editorial purpose

### When to reach for it

The ProbabilityGauge earns its place on screen when the narration is making a **quantitative epistemic claim** — not just "this seems likely" but "Kalshi prices this at 64%" or "Metaculus median forecast is 41%." The gauge is the visual translation of that claim: a number, its source, and its time horizon, in that order of importance. The arc or strip is geometry wrapping the argument; the number is the argument.

Use it when:
- A named prediction market or forecast model can be cited (Kalshi, Polymarket, Metaculus, Good Judgment Open, RAND, CNA).
- The episode is delivering a Parallax probability estimate that the narration defends with base-rate and key-driver reasoning.
- Multiple sources disagree on the same probability and the spread is the editorial point (`strip` variant).
- A decision or disclosure triggered a measurable probability shift (`shift` variant).
- Parallax is demonstrating calibration over multiple past predictions (`scorecard` variant).

### When not to reach for it

| Alternative | When it wins over ProbabilityGauge |
|---|---|
| **KineticTypography** | The probability is a rhetorical intensifier ("arguably 50/50") rather than a cited figure. Don't wrap vibes in a gauge. |
| **DataChart (bar)** | You have a time series of probabilities (e.g., approval tracking). A bar chart or line encodes change; a static gauge loses the temporal signal. |
| **FrameworkDiagram** | The claim is structural ("this creates a trap") rather than probabilistic. Structural claims belong in frameworks, not gauges. |
| **SplitComposition** | You want "possibility A vs. possibility B" as a framing device, not a numeric comparison. Gauges imply quantification; if the numbers aren't there, use split framing. |

**Editorial red flag:** any gauge that lacks a `source` field is an uncited claim dressed as data. D7 doctrine — no fake quantification.

---

## § 2 Canonical idioms

### a. NYT Upshot presidential approval tracker
- **NYT Upshot** approval and election-probability gauges (2012–present): single arc with a percentage label dominating the center; confidence interval rendered as arc-width variation at the tails of the distribution; source attribution flush-right below the arc.
- Key editorial convention: **the number is the hero, the arc is the container.** The arc's job is to give the eye a shape to anchor; the number carries the argument. Upshot never lets arc animation outrun the number label — both animate together.
- *Works because:* readers have a pre-existing mental model of a progress bar / dial. The arc translates directly. *Fails when:* the confidence interval is hidden (giving false precision) or when the number is absent and the arc extent alone must encode value (perceptually unreliable).

### b. FiveThirtyEight probability comparisons
- **FiveThirtyEight** win-probability gauges, 2016–2022 electoral seasons: side-by-side gauge pairs (Candidate A vs. Candidate B; outcome X vs. outcome Y); party-color coding (blue vs. red) drives the visual argument.
- Key editorial convention: FiveThirtyEight always showed **both** sides of the probability (A + B = 100%), which prevents cherry-picking the favorable side and forces honest zero-sum framing.
- *Parallax diverges:* do NOT use blue/red party coding. Use `palette.amber` vs. `palette.rust` for analytical framing — these carry Parallax's editorial register (amber = opportunity/signal; rust = risk/conflict) without importing US partisan color coding that would read as advocacy. For two-actor comparisons, `strip` variant on a shared axis preserves the "both sides sum" transparency without the paired-arc density.

### c. Kalshi / Polymarket prediction market chips
- **Kalshi** and **Polymarket** contract UIs (2021–present): compact probability chip — a small arc or filled bar with the current market price as percentage, plus "as of [timestamp]" in small mono underneath.
- Key editorial convention: prediction markets always surface the timestamp because the price is a continuous variable and showing a stale price without a date is materially misleading. This is the **epistemic hygiene** standard.
- *Parallax application:* the `marketSource` field on `GaugeItem` (e.g., `marketSource: "Kalshi · May 2026"`) is mandatory whenever a prediction market is cited. The `strip` variant renders it in mono below each row label — the canonical chip form adapted to a documentary timeline.

### d. RAND/CNA defense probability assessments
- **RAND Corporation** and **CNA** (Center for Naval Analyses) policy reports (2015–present): scorecard tables rating multiple scenarios by likelihood ("Low," "Moderate," "High," occasionally percentages); Brier score calibration referenced in footnotes when the analysts are using a structured forecasting protocol.
- Key editorial convention: RAND assessments always pair the probability with **the analyst's reasoning** — the base rate, the key driver, and at least one disconfirming scenario. A probability without this scaffolding reads as a wild guess.
- *Parallax application:* the `forecast` variant's 6-layer card (base rate, key driver, disconfirmer, benchmark, resolution) is the video equivalent of the RAND scaffolding. The `scorecard` variant's calibration banner (correct / total, calibration %) mirrors the Brier-score epistemic hygiene.

### e. The Economist "Probability of..." sidebar
- **The Economist** uses a single-value gauge as a sidebar graphic in its data-journalism spreads (2018–present): one arc or bar, a one-sentence source attribution underneath, and — crucially — an explanatory sentence describing what would move the probability up or down.
- Key editorial convention: **used sparingly.** The Economist only reaches for a probability graphic when a quantitative estimate can be sourced from a named model. When they have only "analysts believe this is more likely than not," they use prose, not a gauge.
- *Parallax application:* this is the D7 check — if the narration can't cite a source, don't render the gauge. The Economist's editorial restraint is the right prior.

---

## § 3 General principles

**Cleveland & McGill (1984):** position on a common scale is the most accurate visual encoding. This is why the `strip` variant outperforms multiple arcs for 3+ sources: all dots land on the same horizontal axis, enabling precise visual comparison. Paired arcs (the FiveThirtyEight pattern) require the eye to read two different arc extents and compare them — a degraded encoding compared to a shared axis.

**The gauge's unique payoff:** for a *single* value, the arc's sweep provides a gestalt confidence reading that a dot-on-a-line cannot match. The viewer reads "three-quarters filled" as a holistic assessment in under 200ms. For one-or-two values, the semi-circular arc is the right form. For three-plus, the `strip` wins on accuracy.

**Epistemic layering:** the best prediction-market UX and the best policy-assessment documents share a structure: (1) the number, (2) the verbal anchor ("above even odds"), (3) the historical base rate, (4) the key driver, (5) the disconfirming evidence, (6) the resolution criteria. The `forecast` variant implements this cascade in full. Showing only steps 1–2 is the bare minimum (gauge variant); anything in between is partial. Never show step 1 alone — that is D7 territory.

**The "as of" convention:** any probability derived from a market or model is a time-indexed reading, not a stable fact. The `source` field should always include the date. Omitting it creates false temporal certainty — the number looks like a fixed property of the world rather than a market snapshot.

---

## § 4 Recommendation for Parallax

**Default:**
- `gauge` variant for 1–2 probabilities per composition; cap at 4 (template enforces this via `warnIf`).
- `strip` variant for 3–4 source comparisons on the same probability; all dots on a shared 0–100% axis (Cleveland & McGill position-on-scale).
- `forecast` variant for Parallax's own probability estimates — always uses the 6-layer card; never skip a layer.
- `scorecard` variant for periodic calibration reviews (quarterly, post-publish) demonstrating track record.

**Attribution (mandatory):**
- The `source` field is not optional for any composition where a number is shown. A gauge without attribution is D7-violating advocacy dressed as analysis.
- Format: `"Kalshi · May 2026"` or `"Good Judgment Open forecast, April 2026"` or `"Parallax estimate (base rate: ~40%, key driver: X)"`.

**Palette:**
- `palette.amber` (#E5A544) for probabilities > 60% — signals above-even-odds, opportunity-register.
- `palette.rust` (#C23B22) for probabilities < 30% — signals low likelihood, risk register.
- Neutral (`theme.text.primary`) for 30–60% — honest uncertainty; no editorial tilt.
- **Do not** use party-political colors (blue/red). Do not use `semantic.success` / `semantic.danger` unless the outcome is already known (scorecard's RESOLVED / WRONG coloring is appropriate; pre-outcome gauges are not).

**Time horizon (mandatory):**
- Every gauge title or subtitle must state the time horizon: "Probability of X by 2027," "Kalshi market price as of May 2026." A probability without a horizon is a category error — it implies permanence where there is only a snapshot.

**Duration:**
- `gauge` / `strip`: `durationSec: 8–12` — allow the arc spring to settle (1.5s) and the number to count up; hold for narration to land.
- `forecast`: `durationSec: 12–16` — 5 rows stagger in after the number settles; narration should name each layer as it appears.
- `scorecard`: `durationSec: 10–14` — rows stagger in at 0.25s each; calibration banner needs 1s to count up and hold.

---

## § 5 Current template alignment

**Variants available:** `gauge`, `strip`, `shift`, `scorecard`, `forecast` — five total. All five are implemented.

**`gauge` variant:**
- ✅ Semi-circular arc with spring overshoot (overshoots to 103% then settles) — matches the NYT Upshot convention of showing momentary over-confidence.
- ✅ Beat sync (`useBeatSync`) amplifies overshoot up to 107% on a strong pulse — audio-reactive, unique to Parallax.
- ✅ Tick marks at 0/25/50/75/100 — mirrors the confidence interval markers from Upshot.
- ✅ Triangular pointer at arc terminus — editorial: locates the value precisely; standard in FiveThirtyEight probability displays.
- ✅ `marketSource` badge in Plex Mono uppercase below the gauge — epistemic hygiene, Kalshi/Polymarket chip convention.
- ✅ `warnIf` fires when gauge value is outside [0, 100] — prevents strokeDashoffset overflow.
- ✅ `warnIf` fires when > 4 gauges — enforces the legibility cap; directs to `strip` variant.
- ✅ `useEpisodeColorEmphasis` for per-episode accent — gauge fallback color follows episode identity, not hardcoded amber.
- ⚠️ No built-in time-horizon label field — the `subtitle` field carries it, but there's no schema enforcement that a time horizon be present. Editorial audit must catch naked probabilities.
- ⚠️ Confidence interval (arc width variation) is not implemented. NYT Upshot encodes uncertainty as arc-width variation at the tails. Currently the arc is fixed-width; uncertainty is text-only (in `subtitle` or `source`).

**`strip` variant:**
- ✅ Shared 0–100% axis — Cleveland & McGill position-on-scale, the correct encoding for multi-source comparison.
- ✅ Per-row dot travels to value with settle pulse — matches Kalshi/Polymarket's animated chip form.
- ✅ Spread annotation ("N-pt spread between forecasts") auto-shows when ≥2 items and spread ≥5 — the editorial argument often IS the disagreement.
- ✅ `marketSource` rendered in mono below each source label — chip convention.
- ✅ `warnIf` for value outside [0, 100] inherited from parent.

**`shift` variant:**
- ✅ Before → pause → after animation with sliding arrow indicator — the trigger text names the causal event.
- ✅ Direction-sensitive color (`semantic.success` for increase, `semantic.danger` for decrease) — correct when the direction has normative meaning (e.g., escalation risk).
- ⚠️ `isIncrease` uses `semantic.success`/`danger` unconditionally — sometimes an increasing probability is bad (risk of conflict). Consider a `colorMode: "signed" | "neutral"` option.

**`scorecard` variant:**
- ✅ Four-column layout (prediction / your estimate / market price / outcome) — mirrors the RAND scorecard table structure.
- ✅ Calibration banner counts up to the correct/total ratio — Brier-score-adjacent epistemic hygiene.
- ✅ Pending rows pulse continuously (`Math.sin(frame * 0.08)`) — the pending state IS the pulse; once resolved, it stops. Correct motion semantics per motion-design.md.
- ✅ Accent edge per row in outcome color — RESOLVED (green), WRONG (rust), PENDING (amber).

**`forecast` variant:**
- ✅ 6-layer card (base rate, key driver, disconfirmer, benchmark, resolution) — full RAND/superforecasting scaffold.
- ✅ Layers stagger in after the number settles — narration timing; each layer lands as the narrator names it.
- ✅ DISCONFIRMER label in `semantic.danger` color — distinguishes the falsifying evidence from the confirming evidence; the most important single field for epistemic credibility.
- ✅ RESOLUTION row renders in Plex Mono + amber — signals that this is the clairvoyance-test criterion, not prose.
- ✅ `ForecastData` type requires all 6 fields — schema enforces completeness; a gauge missing any layer reads as advocacy, not analysis.

---

## § 6 Specific upgrades

1. **Confidence interval band on `gauge` variant.** Add an optional `confidenceInterval?: [number, number]` field to `GaugeItem`. When present, render the CI as a translucent arc band at 25% opacity inside the track, matching NYT Upshot's convention. Effort: small (geometry is similar to the arc path; just two strokes with dashed caps). Impact: unlocks the full Upshot epistemic standard — probability + uncertainty in one glyph. **(low effort / high editorial impact)**

2. **`colorMode: "signed" | "neutral"` for `shift` variant.** The current `shift` variant uses `semantic.success`/`danger` based on direction unconditionally. For risk assessments where an increasing probability is bad (risk of war, escalation probability), the green "success" color is editorially wrong. A `colorMode: "neutral"` option would render the shift bar in `emphasis.primaryAccent` regardless of direction, letting the narration carry the valence. Effort: tiny (one conditional). Impact: prevents the "increase = good" color bug in crisis escalation compositions. **(trivial effort / medium impact)**

3. **Time-horizon field on schema.** Add `timeHorizon?: string` to `GaugeItem` (rendered below the percentage label in Plex Mono, smaller than the source badge) and enforce at the Zod level that either `timeHorizon` or the parent `subtitle` contains "by" or "as of" (warn if absent). This catches the most common D7 violation — showing a probability without a horizon — at data validation time rather than audit time. Effort: small. Impact: eliminates a recurring editorial error without requiring human checkers. **(low effort / high reliability impact)**

4. **`strip` variant range annotation.** When the spread between the lowest and highest source exceeds 20 percentage points, auto-annotate the range with a faint shaded band between min and max, and add a label ("20-pt uncertainty range"). The current spread annotation is text-only; the visual band is the Economist's standard for forecast disagreement. Effort: medium (requires bounding-box geometry for the band and careful z-ordering behind the dots). Impact: makes wide forecast spreads legible at scrubbing speed, not just readable at pause. **(medium effort / medium impact)**

---

## § 7 Failure mode flags

- **Gauge without `source` field** — D7: a number without a named source is advocacy dressed as data. Audit: check that `source` is non-empty and contains a named model, market, or analyst.
- **Probability without a time horizon** — "62% chance of X" without "by 2027" or "as of April 2026" implies permanence where there is only a snapshot. Audit: verify title, subtitle, or `source` contains "by" or "as of."
- **More than 4 arcs in `gauge` variant** — labels and arcs collide; template fires `warnIf`. Switch to `strip` for 3+ sources.
- **Using `semantic.success`/`danger` on the `shift` variant for risk-escalation contexts** — an escalating conflict probability is not a "success." Audit: flag any `shift` composition covering war risk or sanctions probability where the bar uses green.
- **`forecast` variant with any of the 6 layers omitted** — the `ForecastData` type enforces all 6 at TypeScript level, but JSON-only data files can omit optional-looking fields. Audit: verify all 6 rows render. A missing DISCONFIRMER row is the highest-risk omission — it makes the estimate look one-sided.
- **Party-political color coding on paired probabilities** — blue/red for US-vs-China or coalition-vs-challenger reads as partisan framing. Use palette tokens (amber/rust) instead.
- **`scorecard` calibration banner visible without resolved items** — if all items are "pending," the calibration shows 0% which reads as "Parallax is always wrong." Hide the calibration banner until at least one item resolves.
- **Arc animation outlasting the narration** — the arc spring takes 1.5s to settle; if `durationSec` is set to 5–6s, the arc is still settling when narration moves on. Minimum `durationSec: 8` for `gauge` variant.

---

Last updated: May 15, 2026
