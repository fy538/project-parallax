---
name: publish-retro
description: >
  Close the post-publish learning loop. Parse YouTube Studio analytics (7-14 days post-launch), compare against persona-eval predictions and production decisions, generate a retrospective report, and update LEARNING_LOG.md and EDITORIAL_PLAYBOOK.md with validated rules. Use whenever someone says 'retro', 'retrospective', 'how did it perform', 'what worked', 'post-publish review', 'analytics review', 'what did we learn', 'did the predictions hold up', or when Tiger pastes YouTube Studio screenshots or analytics data. Handles manual paste and structured data (CSV/JSON/table). This is the only skill that writes back to EDITORIAL_PLAYBOOK.md — it's how the pipeline gets smarter over time.
---

# Publish Retrospective

You are closing the post-publish learning loop for a Parallax episode. After an episode has been live for 7-14 days (enough data for metrics to stabilize), you will parse available YouTube analytics data and compare what actually happened against what the production pipeline predicted. Your job is to produce a retrospective report that makes future episodes better by identifying which production decisions worked, which didn't, and why.

## Context

**The feedback loop:** Every episode goes through a predictions phase where the production pipeline generates two predictive artifacts:

1. **Persona-eval report** (from the persona-eval skill) — predicts which of the 5 audience personas (Priya/Marcus/Wei/James/Sofia) will be most engaged, where each persona might bounce, and what resonance scores to expect per persona.

2. **Visual rhythm map** (from the visual-concept or visual-spec skills) — documents the sequence of visual types (maps, charts, frameworks, footage, typography, titles) across the episode, transitions, and holds times. Identifies visual monotony zones and visual payoff moments.

**What you're comparing against:**
- YouTube Studio analytics: views, CTR, average view duration, retention curves (viewer drop-off by minute), traffic sources, audience demographics, top comments.
- Real-time viewer behavior data that reveals which moments held attention, where people left, which visuals worked, what resonated, what confused.

**The analytical task:** Connect the dots. When retention drops at minute 7, was that predicted by persona-eval? Does that visual rhythm map show visual monotony at that checkpoint? Did the top comments reference that moment? This is where production science meets art — you're building evidence for what production choices actually move the needle.

After 3+ episodes, patterns emerge: "frameworks hold attention 15% longer than stock footage," "Wei's comments show frustration with conflict treatment," "Marcus consistently bounces at the 4-minute mark when we're still in setup." These patterns become the production playbook for the channel.

## Input Modes

The skill should gracefully handle two input modes:

### Mode A: Manual Paste

Tiger screenshots YouTube Studio or copies raw analytics text into the conversation. The data will be fragmented — some metrics present, some missing. You work with what's available.

**Typical Mode A input:**
- Retention graph description ("drops to 40% by minute 3, then holds at 35% through minute 10, drops again at 12")
- CTR percentage ("3.2% CTR")
- Average view duration ("8m 14s out of 13m 45s total")
- Top comments (copy-pasted)
- Traffic sources list ("60% YouTube search, 25% suggested video, 10% external, 5% direct")
- Audience demographics (age/gender breakdown)
- Screenshot descriptions ("attached a screenshot of the retention graph")

**Your job in Mode A:** Extract the precise metrics, flag what's missing, and proceed with analysis using available data. Don't demand completeness — work with what's there and note gaps.

### Mode B: Structured Data

If Tiger provides a CSV, JSON export, or well-formatted table, parse it directly for metrics.

**Your job in Mode B:** Load the data, validate that expected fields are present, normalize if needed, and proceed to analysis.

---

## Pipeline Prediction Artifacts to Reference

Before analyzing, you'll need the production artifacts from the episode's pipeline. Check the episode folder (`episodes/<slug>/`) for:

1. **Persona-eval report** — Look for a file named `persona-eval-report.md` or similar. Extract:
   - Each persona's predicted engagement score (1-10)
   - Predicted bounce points (where each persona was expected to drop off)
   - Predicted resonance scores
   - Predicted subscribe/share likelihood per persona
   - Visual engagement notes per persona

2. **Visual rhythm map** — Look for data in:
   - `visual-spec` folder or data files (JSON describing template sequence)
   - `script-v4-production.md` right column (visual specs)
   - Notes from visual-concept skill on visual monotony zones, visual payoff moments, template transitions

3. **Script-audit report** (optional but helpful) — Look for `script-audit-report.md`. Extract:
   - Pacing analysis (beat timings)
   - Lecture pattern warnings
   - Transition quality notes
   - Moments flagged as high-resonance potential

If prediction artifacts are missing, note that fact and proceed with what you have. First retrospectives are the hardest because the prediction baseline is incomplete.

---

## Analysis Framework

### 1. Performance Snapshot

**Extract and report:**
- Views (total)
- CTR (click-through rate) — compare to geopolitics/explainer niche benchmark: 4-8% is strong, 2-4% is acceptable, <2% is weak, >8% is exceptional
- Average view duration as % of total (and absolute time) — compare to geopolitics/explainer benchmark: 45-55% retention is average, >60% is strong, <40% is weak
- Retention at key checkpoints: 3-minute (early hook evaluation), 7-minute (content quality assessment), midpoint, final third (commitment to ending)
- Traffic source breakdown (YouTube search, suggested, external, direct, etc.)
- Audience demographic skew (age, geography if available)

**Frame it as:** "This episode attracted [X] views with [Y]% CTR and [Z]% average retention. Against the explainer niche benchmark, this suggests [assessment]."

### 2. Retention Curve Analysis

**Map the retention curve against production decisions:**

1. Get the minute-by-minute retention shape from YouTube Studio (or your best approximation from pasted data).
2. Overlay this against the visual rhythm map: which visual types appear at which minutes?
3. Look for correlation: 
   - Retention spike during a chart segment? Evidence that data visuals held this audience.
   - Drop-off after stock footage? Possible visual monotony issue.
   - Flat retention through a framework diagram? Evidence of high-value visual payoff.

4. Cross-reference the script beats:
   - Where does the script transition from setup to thesis? Does retention stabilize or drop there?
   - Are there lecture patterns (60+ seconds of narration-only) that correlate with retention dips?
   - Does a narrative beat-shift (e.g., "now let's look at the historical parallel") correlate with a retention change?

5. **Specific analysis format:**
   ```
   MINUTE [X-Y]: [Retention behavior]
   - Visual type at this moment: [template name]
   - Script beat: [what's being said]
   - Analysis: [what does the behavior tell us?]
   - Verdict: [confirmed/contradicted/inconclusive]
   ```

**Output:** A minute-by-minute breakdown that connects production choices to viewer behavior. The goal is to build evidence for specific claims like "framework diagrams hold attention 8% longer than stock footage during explanation moments."

### 3. Persona Prediction Validation

**For each of the 5 personas, compare prediction vs. reality:**

- **Priya (Policy Analyst):** Persona-eval predicted she'd engage with the historical parallel and data rigor. Did high-engagement comments reflect policy/geopolitics knowledge? Did she (inferred from comments) subscribe? Did comments suggest she found novel framing?

- **Marcus (Algorithm Discovery):** Persona-eval predicted he'd bounce at minute X if visuals got monotonous, but stay engaged if visual variety stayed high. Did retention data show a drop-off at that moment? Did early-exit comments mention boredom or confusion?

- **Wei (Chinese Diaspora):** Persona-eval flagged concern about conflict treatment and Western-centric framing. Do comments reveal alienation or validation? Did Chinese-language comments (if any) appear, and what did they say? Did her predicted bounce point match actual retention behavior?

- **James (Tech Insider):** Persona-eval predicted he'd scrutinize technical accuracy and data attribution. Do comments reference technical specifics? Any corrections or "gotchas"? Did he subscribe (inferred from positive technical comments)?

- **Sofia (Framework Thinker):** Persona-eval predicted she'd love framework diagrams and mental models. Did retention spike during framework moments? Do comments reference frameworks or cite the episode for decision-making context?

**For each persona, score:**
- **CONFIRMED:** Prediction matched behavior (retention spike when predicted, comments reflected expected interests)
- **PARTIALLY CONFIRMED:** Some aspects matched, others didn't (e.g., predicted bounce at minute 5 didn't happen, but predicted resonance with framework was strong)
- **CONTRADICTED:** Prediction missed badly (e.g., expected Marcus to leave early, but he had above-average watch time)
- **INSUFFICIENT DATA:** No proxy signals to validate

**Build a cumulative accuracy score:** After multiple episodes, you'll track whether predictions are getting better or whether certain personas are consistently mispredicted. (E.g., "Our predictions for James are 80% accurate after 3 episodes, but Wei's predictions miss the mark 60% of the time.")

### 4. Visual Effectiveness Analysis

**Which visual types moved the needle?**

Using the visual rhythm map and retention data, analyze at three levels of granularity. Each is a separate cut of the same data and answers a different question.

#### 4a. Visual type performance (template-level)

For each visual template type (Map, DataChart, FrameworkDiagram, Timeline, Typography, Footage, Title, Atmospheric Illustration, Grounding AI-GEN), extract the segments where it appears and compare retention during those segments to overall average. Calculate delta: "DataChart segments averaged 52% retention vs. 48% overall = +4% boost."

Note: Atmospheric Illustration (Recraft constructivist) and Grounding AI-GEN are visual types in their own right and should appear as rows in the performance table even if they only show up in 1-2 segments per episode. With few episodes shipped, every data point matters.

#### 4b. Register-level performance (the bigger question)

Per VIS-09, every episode has three registers (Analytical, Atmospheric, Grounding). Analyzing retention by register answers questions the template-level cut can't:
- Do Atmospheric backgrounds outperform generic stock footage at the wallpaper role they replace?
- Do Grounding scenes carry more emotional weight than Analytical-only beats?
- Does the register-pacing rule (max 3 consecutive same-register, transition grammar) hold up under retention data?

For each register, sum the segment-level retention and compare to episode average. Cross-reference the rhythm map's register sequence to find moments where the register *changed* — those are the points where the transition grammar (color-wash, blur-through, iris) gets validated or contradicted by retention behavior.

#### 4c. Treatment × register pairing performance (validates VIS-10)

VIS-10 prescribes which treatment ramps pair with which registers. After 3-5 episodes, this analysis cut tests whether the prescriptions are correct empirically:
- Does grounding+editorial (historical reconstruction) actually outperform grounding+standard for pre-1980s scenes?
- Does atmospheric+conflict (high-tension constructivist) actually carry the dread it's supposed to, or does it confuse viewers?
- Are there register×treatment cells that VIS-10 calls "rare but valid" but that data shows are actually problematic?

For the first 1-2 episodes this section will be data-thin. Note the limitation and capture what you can — even one observation per pairing starts building the empirical foundation.

#### 4d. Visual transition effectiveness

Did transitions between visual types impact retention? (E.g., "Transition from stock footage to framework diagram recovered 6% retention.") Were there visual monotony zones (3+ segments of the same type in a row, or same register in a row) that correlated with drops? If the script used the prescribed register transition grammar (color-wash for Analytical→Grounding, blur-through for Grounding→Atmospheric, etc.), did those transitions hold attention better than ad-hoc cuts?

#### 4e. Hold time validation

If persona-eval flagged that Sofia needs FrameworkDiagrams to hold for 12+ seconds, did actual retention during those moments support that? Did fast cuts (4-5 second holds) cause retention dips for any visual type?

#### 4f. Specific evidence format

```
[Visual Type / Register / Pairing]: Average retention [X]% (vs. [Y]% overall)
- Appeared in segments at minutes: [list]
- Register: [Analytical / Atmospheric / Grounding]
- Treatment: [standard / conflict / editorial / n/a]
- Strongest moment: [minute range, specific performance]
- Weakest moment: [minute range, specific performance]
- Hypothesis for next episode: [testable prediction]
```

**Building the visual effectiveness database:** Over multiple episodes, this creates a production playbook at three levels. Template level: "FrameworkDiagrams holding 12+ seconds perform +7% retention vs. <6 seconds." Register level: "Atmospheric backgrounds at 30% opacity hold attention +4% over generic stock footage — confirms the Register 2 hypothesis." Pairing level: "Grounding+editorial (historical reconstructions) outperform grounding+standard for pre-1980s content by 6%, validating VIS-10's prescription."

### 6. Comment Sentiment Mining

Top comments are the richest qualitative signal. They reveal:
- Which moments viewers reference (signals high engagement)
- What they learned or misunderstood
- Emotional reactions (surprise, frustration, validation, confusion)
- Which personas are represented in the comment section

**Mining process:**

1. **Extract top comments** (typically the first 20-30 sorted by engagement). Note:
   - The moment/topic they reference
   - Sentiment (positive, negative, neutral, mixed)
   - Persona signal (can you infer whether this is Priya, Marcus, Wei, etc. based on vocabulary and concerns?)

2. **Pattern identification:**
   - **Confusion signals:** Comments asking "wait, what?" or explaining something suggest that moment wasn't clear. Cross-reference with retention to see if confusion correlated with drop-off.
   - **Resonance moments:** Comments citing a specific historical parallel, framework, or fact suggest those moments landed hard.
   - **Persona presence:** Comments with technical specifics (James), policy analysis (Priya), Chinese cultural references (Wei), framework thinking (Sofia), discovery excitement (Marcus). Tally which personas are represented. If Wei's persona is underrepresented, the audience might be skewed.

3. **Specific analysis format:**
   ```
   COMMENT SIGNAL: [Mention of moment X]
   - Sentiment: [positive/negative/neutral]
   - Inferred persona: [Priya/Marcus/Wei/James/Sofia]
   - What it tells us: [e.g., "Framework diagram landed — three separate comments reference the chess/go metaphor"]
   ```

4. **Synthesis:** "Comments reveal that the oil embargo parallel resonated strongly with Priya-type viewers (3 policy-focused comments), but there was confusion about the technical details (James-type viewers asked clarification questions). Wei's persona was notably absent from comments — possible signal that Chinese-diaspora framing didn't reach or resonate."

---

## Output Format

Produce a comprehensive retrospective report:

```
# PUBLISH RETROSPECTIVE REPORT

## Episode: [Number and Title]
## Publish Date: [date]
## Analysis Date: [today]
## Days Live: [X days]
## Data Input Mode: [Mode A — Manual Paste / Mode B — Structured Data]

---

## Performance Snapshot

- **Views:** [total]
- **CTR:** [percentage] (niche benchmark: 4-8% is strong)
- **Average View Duration:** [minutes:seconds] ([X]% of [total] video length)
- **Retention Curve:**
  - 3-minute mark: [X]%
  - 7-minute mark: [X]%
  - Midpoint: [X]%
  - Final third: [X]%
- **Traffic Sources:** [breakdown]
- **Audience Demographics:** [age/geography patterns if available]
- **Niche Assessment:** [compared to geopolitics/explainer benchmark; e.g., "Above-average CTR, average retention — strong hook but mid-video engagement issue"]

---

## Retention Curve Analysis

[Minute-by-minute breakdown mapping retention behavior to visual types, script beats, and production choices. 5-10 key moments with specific analysis.]

**Key Findings:**
- [Finding 1: visual type correlation, script beat impact, or pacing issue]
- [Finding 2: ...]
- [Synthesis: What the retention curve tells us about this episode's production strengths/weaknesses]

---

## Persona Prediction Validation

### Persona 1: Priya (Policy Analyst)
- **Predicted engagement score:** [X]/10
- **Predicted bounce point:** [minute Y based on persona-eval]
- **Actual signals:** [retention behavior at that minute, comment content, inferred engagement]
- **Verdict:** CONFIRMED / PARTIALLY CONFIRMED / CONTRADICTED / INSUFFICIENT DATA
- **Notes:** [specific findings about this persona's actual engagement vs. prediction]

### Persona 2: Marcus (Algorithm Discovery)
- **Predicted engagement score:** [X]/10
- **Predicted bounce point:** [minute Y — typically around minute 4 if setup too long]
- **Actual signals:** [retention behavior, comment analysis]
- **Verdict:** [...]
- **Notes:** [...]

### Persona 3: Wei (Chinese Diaspora)
- **Predicted engagement score:** [X]/10
- **Predicted friction points:** [visual treatment concern, Western-centric framing risk]
- **Actual signals:** [did comments show alienation or validation? presence in comment section?]
- **Verdict:** [...]
- **Notes:** [specific findings about framing, visual treatment impact, and Chinese-diaspora viewer response]

### Persona 4: James (Tech Insider)
- **Predicted engagement score:** [X]/10
- **Predicted scrutiny points:** [technical accuracy moments, data visualization moments]
- **Actual signals:** [did comments verify or correct technical claims? did he subscribe?]
- **Verdict:** [...]
- **Notes:** [...]

### Persona 5: Sofia (Framework Thinker)
- **Predicted engagement score:** [X]/10
- **Predicted resonance moment:** [framework diagram or model, timing and hold duration]
- **Actual signals:** [did retention spike during that moment? do comments cite frameworks?]
- **Verdict:** [...]
- **Notes:** [...]

**Cumulative Accuracy (if this is episode 2+):**
- Priya predictions: [X% accurate across episodes]
- Marcus predictions: [X% accurate across episodes]
- Wei predictions: [X% accurate across episodes]
- James predictions: [X% accurate across episodes]
- Sofia predictions: [X% accurate across episodes]
- [Note patterns: which personas are we consistently mispredicting?]

---

## Visual Effectiveness Analysis

### Visual Type Performance

| Template / Visual Type | Register | Avg. Retention | Delta vs. Overall | Segments | Notes |
|---|---|---|---|---|---|
| Map | Analytical | [X]% | [±Y]% | minutes [list] | [performance notes] |
| DataChart | Analytical | [X]% | [±Y]% | minutes [list] | [performance notes] |
| FrameworkDiagram | Analytical | [X]% | [±Y]% | minutes [list] | [performance notes] |
| Timeline | Analytical | [X]% | [±Y]% | minutes [list] | [performance notes] |
| Typography | Analytical | [X]% | [±Y]% | minutes [list] | [performance notes] |
| Stock Footage | (mode-only) | [X]% | [±Y]% | minutes [list] | [performance notes] |
| Atmospheric Illustration | Atmospheric | [X]% | [±Y]% | minutes [list] | [Recraft constructivist — track separately] |
| Grounding AI-GEN | Grounding | [X]% | [±Y]% | minutes [list] | [photoreal mannequin — track separately] |
| Title/Opening | Analytical | [X]% | [±Y]% | [opening] | [performance notes] |

**Key Visual Finding:** [Which visual type performed best? Worst? Why?]

### Register-Level Performance (validates VIS-09)

| Register | Total Runtime | % of Episode | Avg. Retention | Delta vs. Overall |
|---|---|---|---|---|
| Analytical (Register 1) | [Xs] | [Y%] | [X]% | [±Y]% |
| Atmospheric (Register 2) | [Xs] | [Y%] | [X]% | [±Y]% |
| Grounding (Register 3) | [Xs] | [Y%] | [X]% | [±Y]% |

- **Proportion check:** Did the actual breakdown hit VIS-09's targets (MG 40-55%, ILLUST 5-15%, AI-GEN 5-15%)? If not, did over/under-allocation correlate with retention?
- **Sequencing check:** Did register transitions follow the prescribed grammar (color-wash, blur-through, iris)? Did ad-hoc transitions perform worse?
- **Atmospheric hypothesis:** Atmospheric backgrounds were introduced to replace generic stock-footage wallpaper. Did Register 2 segments outperform stock-footage segments at the same opacity/role?
- **Grounding hypothesis:** Grounding scenes (mannequin reconstructions) were introduced for unsourceable spaces. Did they carry more retention than Analytical-only equivalents would have?

### Treatment × Register Pairing (validates VIS-10)

VIS-10 prescribes which treatment ramps pair with which registers. With 1-2 episodes of data, this section is data-thin — capture what's available and flag the gap.

| Pairing | Predicted Use | Episodes Used In | Avg. Retention | VIS-10 Verdict |
|---|---|---|---|---|
| atmospheric × standard | default constructivist | [list] | [X]% | [confirmed/inconclusive/contradicted] |
| atmospheric × conflict | high-tension (rare) | [list or "none yet"] | [X]% | [verdict] |
| grounding × standard | present-day reconstruction | [list] | [X]% | [verdict] |
| grounding × conflict | adversarial scene | [list or "none yet"] | [X]% | [verdict] |
| grounding × editorial | historical reconstruction | [list or "none yet"] | [X]% | [verdict] |

After 5+ episodes, retire any pairing the data contradicts and add candidate rules for any pattern the data reveals.

### Visual Transitions & Monotony

- **Transition effectiveness:** [Did certain transitions recover attention? Did any hurt?]
- **Monotony zones:** [Where did visual repetition occur? Did it correlate with retention drops?]
- **Hold time validation:** [Did diagrams held as predicted maintain attention? Did fast cuts work?]

### Treatment Effectiveness (Conflict vs. Standard vs. Editorial)

- **Conflict treatment impact:** [Did conflict-treatment visuals affect retention? Persona reactions?]
- **Treatment-by-visual-type:** [Did treatment choice matter more for some visual types than others?]
- **Recommendation for next episode:** [Based on this episode's data, which treatment should we prioritize?]

---

## Comment Sentiment Mining

### Top Signals

| Moment | Comment Themes | Inferred Personas | Sentiment | What It Tells Us |
|---|---|---|---|---|
| Minute [X] | [moment reference] | [Priya/Marcus/etc.] | [+/−/neutral] | [what this signal means] |
| Minute [Y] | [moment reference] | [Priya/Marcus/etc.] | [+/−/neutral] | [what this signal means] |
| [Etc.] | | | | |

### Persona Representation in Comments
- **Priya signals:** [count and nature of policy-analyst style comments]
- **Marcus signals:** [count and nature of discovery/algorithm comments]
- **Wei signals:** [count and nature of diaspora-aware comments; note if absent]
- **James signals:** [count and nature of technical comments; note technical errors if any]
- **Sofia signals:** [count and nature of framework/mental-model comments]

### Confusion & Friction Points
- [List moments where comments suggest confusion or misunderstanding]
- [Cross-reference with retention data to see if confusion correlated with drop-offs]

### Resonance Moments
- [List moments heavily cited in comments — signals high engagement]
- [Cross-reference with retention spikes]

---

## Learning for Next Episode

**3-5 evidence-based hypotheses for the next episode.** Each must:
- Be grounded in specific data from this retrospective (retention behavior, comments, visual performance, persona validation)
- Be testable in the next episode
- Connect to a specific production decision (script beat, visual choice, pacing, treatment)

Format:
```
**Hypothesis [N]:** [Testable prediction based on this episode's data]
- Evidence: [specific data point from this retrospective]
- Test in next episode: [how you'll validate this in the next episode]
- Expected impact: [what you predict will happen if the hypothesis is correct]
```

**Example format:**
```
**Hypothesis 1:** Retention spiked 8% during the chess/go FrameworkDiagram (minute 12:30-13:15) 
then dropped during the following stock footage segment. Framework diagrams should be held 12+ 
seconds and be followed immediately by a different visual type (map or chart), not stock footage.

- Evidence: Retention peaked at 56% during the diagram (vs. 48% average), then dropped to 42% 
  in the following 90-second footage segment. Persona-eval predicted Sofia would need 12+ second 
  holds; this data confirms it.
- Test in next episode: Hold FrameworkDiagram for 13 seconds (vs. 10 in this episode), transition 
  to a DataChart instead of stock footage.
- Expected impact: +6% retention during diagram moment, sustained retention through transition 
  (vs. current 14-point drop).
```

---

## Cumulative Patterns (After 3+ Episodes)

*Only include this section if you have 3+ retrospectives in the episodes folder.*

- **Visual type consistency:** Which visual types consistently outperform across all episodes? [Build the visual playbook]
- **Persona reach vs. prediction:** Are we reaching the personas we predicted? Which ones are overrepresented? Which underrepresented?
- **CTR/retention trends:** Are metrics improving episode-over-episode? What changed?
- **Signature production move:** What's the visual, narrative, or structural pattern that viewers consistently respond to? This becomes the channel's brand fingerprint.
- **Persistent weaknesses:** What fails across all episodes? (E.g., "We consistently lose 20% at the 4-minute mark during setup. This is a pipeline problem, not an episode problem.")

---

## Missing Data & Limitations

[Note any data points you couldn't obtain or analyze due to gaps in YouTube data or production artifacts. E.g., "No persona-eval report available for this episode — predictions based on visual rhythm map and script-audit only." / "YouTube Studio did not provide minute-by-minute retention; analysis based on segment averages and comments only." / "No structured comments data; analysis based on manually extracted top comments only."]

---

## Data Confidence Notes

[Rate confidence in each major finding. E.g., "High confidence: Visual type performance (minute-by-minute retention data is reliable). Medium confidence: Persona predictions (comments are inferred proxies, not direct feedback). Low confidence: Technical accuracy assessment (no expert feedback, inferred from James-type comments only)."]

```

---

## Important Notes

- **This is the inverse of persona-eval.** Persona-eval predicts engagement before publish. This skill validates those predictions against actual behavior. Over time, you're building a feedback loop that makes predictions better.

- **Retention data is the gold standard signal.** Comments are color, but retention curves are ground truth. When retention and comment sentiment conflict, trust retention.

- **You're building a cumulative learning artifact, not a one-off report.** Every retrospective feeds into `episodes/LEARNING_LOG.md` (see below). Patterns emerge only after 3+ episodes.

- **Visual effectiveness database compounds.** "FrameworkDiagrams held 12+ seconds average +7% retention vs. <6 seconds" becomes a rule the channel follows because you've built evidence for it across episodes.

- **Persona prediction accuracy is a metric.** After 3 episodes, you should be able to say "We're 78% accurate predicting Priya's engagement, 65% accurate for Marcus." Use this to refine persona profiles or identify blind spots in the prediction process.

- **Missing data is expected.** First retrospectives won't have all the prediction artifacts. Do your best with what's available. As the pipeline matures, data will be richer.

- **Comments are messy but honest.** They reveal which moments actually landed, which confused viewers, and which personas are watching. A moment with 10 comments is a high-engagement moment even if retention was flat. Use comment patterns to supplement retention data.

- **Build toward production rules, not just observations.** "This worked" is less valuable than "Frameworks held 12+ seconds consistently outperform <6 seconds, and this effect is strongest for Sofia-type viewers (inferred from comment analysis)."

---

## Cumulative Learning Log

After you produce the retrospective report, append the key findings to `episodes/LEARNING_LOG.md`. This file accumulates learnings across all episodes.

**Format for each episode entry:**

```
## [episode-slug]: [Title]
**Publish Date:** [date]
**Analysis Date:** [date]
**Days Live:** [X days at analysis]

### Top 3 Findings
1. [Finding: specific, evidence-based, actionable]
2. [Finding: ...]
3. [Finding: ...]

### Persona Prediction Accuracy
- Priya: [verdict + confidence score]
- Marcus: [verdict + confidence score]
- Wei: [verdict + confidence score]
- James: [verdict + confidence score]
- Sofia: [verdict + confidence score]
- **Overall:** [X/5 personas correctly predicted]

### Visual Effectiveness Winners
- [Visual type 1]: +X% retention [specific moment]
- [Visual type 2]: −X% retention [specific moment]
- **Recommended visual type for next episode:** [...]

### Register Performance (validates VIS-09 / VIS-10)
- **Analytical (Register 1):** [X]% avg retention, [Y%] of runtime — [verdict vs. VIS-09 target]
- **Atmospheric (Register 2):** [X]% avg retention, [Y%] of runtime — [verdict; especially: did backgrounds outperform stock?]
- **Grounding (Register 3):** [X]% avg retention, [Y%] of runtime — [verdict; especially: did mannequin scenes carry weight?]
- **Treatment×register pairings observed:** [list each pairing used + retention; flag any VIS-10-forbidden pairing that snuck through]
- **Cumulative pairing data (3+ episodes):** [populate after EP03 — until then, note "data-thin"]

### Retention Profile
- **Hook strength (minute 3):** [X]% [assessment]
- **Mid-video holding (minute 7):** [X]% [assessment]
- **Closing commitment (final third):** [X]% [assessment]
- **Overall trajectory:** [climbing / flat / descending / volatile]

### Prediction Feedback
[Note any ways the production prediction artifacts (persona-eval, visual rhythm map, script-audit) missed or nailed the mark. This is feedback to improve future predictions.]

### Next Episode Hypothesis
[Copy the 1-3 most critical hypotheses from the retrospective to carry forward.]
```

**Maintenance:** Keep LEARNING_LOG.md lightweight and skimmable. The full retrospective report stays in the episode folder; the log is the running summary. After 5+ episodes, the log becomes a playbook — new episodes reference it explicitly ("Based on the learning log, we know frameworks outperform footage by 7%, so let's prioritize FrameworkDiagrams in this episode").

---

## Editorial Playbook Updates

After appending to LEARNING_LOG.md, review `episodes/EDITORIAL_PLAYBOOK.md` and make three types of updates:

1. **Validate existing rules.** If analytics data confirms a playbook rule (e.g., PERF-01 predicted framework diagrams held 12+ seconds outperform — and retention data confirms it), tag the rule as `[VALIDATED]` and add the episode + data point as evidence.

2. **Promote hypotheses to rules.** If a "Learning for Next Episode" hypothesis from this retrospective is strong enough (clear evidence, broadly applicable, has a pattern/anti-pattern pair), add it as a new rule in the appropriate playbook section. Use the rule ID format: `[domain]-[next number]`.

3. **Retire contradicted rules.** If analytics data contradicts a playbook rule (e.g., a rule says "never do X" but X actually performed well), mark the rule as `[RETIRED]` with the contradicting evidence and a note about what replaced it.

**Threshold for adding a new rule:** The finding must have (a) specific analytics evidence (retention data, comment patterns, or persona validation), (b) a clear pattern/anti-pattern pair, and (c) relevance beyond this single episode. Don't add one-off observations as rules — those stay in the learning log until confirmed across multiple episodes.

**Present all proposed playbook changes to Tiger for approval.** The playbook is the channel's institutional memory — it should be curated, not auto-populated.

---

## Trigger Recognition

This skill triggers when Tiger says:
- "retro" or "retrospective"
- "how did it perform" or "what worked"
- "post-publish review" or "analytics review"
- "what did we learn" or "did the predictions hold up"
- "persona predictions vs. reality"
- Any pasting of YouTube Studio screenshots, retention graphs, analytics data
- Any reference to episode performance after 7-14 days live

**Proactive triggering:** Check periodically (weekly, or on Tiger's request) whether episodes are ready for retrospective analysis (≥7 days live). Flag episodes that have enough data to audit.
