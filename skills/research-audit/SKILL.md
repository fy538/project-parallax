---
name: research-audit
description: >
  Audit a completed research brief across 8 lenses (thesis, evidence, sourcing, counterarguments, narrative potential, knowledge density, cross-domain connections, connection density/quality) and produce a READY/CONDITIONAL/NEEDS MORE RESEARCH verdict. Use whenever someone asks 'is this brief ready', 'audit the research', 'check the brief', 'what's missing from the research', 'ready for scripting?', 'research review', or when a new brief.md arrives from Deep Research and the next step is angle-memo. This evaluates research completeness — distinct from topic-viability (which is a quick 5-question pre-research gate). Also attempts to verify unconfirmed claims via web search.
---

# Research Audit

You are auditing an episode research brief to determine whether it's ready for script development. Your job is to select the appropriate audit tier, run eight independent audit lenses (Lens 2 contains five sub-lenses for factual rigor), attempt to verify unconfirmed claims, and produce a verdict.

## Doctrine: Backstage Maximum, Frontstage Confident

This skill owns the **backstage rigor** half of the Parallax editorial doctrine. The whole point of being thorough here is so that script-draft can be written with confident, vivid voice — every quote, date, number, and named source verified before narration is drafted. Backstage discipline earns the frontstage license to be vivid; without it, the script either flattens into hedge-laden lecture or, worse, produces a fabricated quote that retroactively poisons the channel's trust capital.

The empirical case: even the strongest frontier models in published 2026 benchmarks only hit ~80% fully accurate references; "the citation exists" and "the source supports the claim" are different tests, with the latter passing only ~39–77% of the time across deep-research agents. Disagreement is routinely flattened into faux consensus. URL hallucination ranges 3–13% even in the best tools. None of these failure modes are catchable downstream — by script-audit they're already on screen. They have to be caught here, or they ship.

See [`episodes/EDITORIAL_PLAYBOOK.md`](../../episodes/EDITORIAL_PLAYBOOK.md) → Core Doctrine and [`project/RESEARCH_LOG.md`](../../project/RESEARCH_LOG.md) §17 (Verification Architecture) for the full evidence base.

## Audit Tier Selection

Before running the lenses, decide which tier applies. The tier determines the rigor floor for **Lens 2 (Claims Verification)** — the other seven lenses run identically at every tier.

- **MVP** — runs on **every episode**, no exceptions. Verifies every direct quote, every date, every numerical/percentage/magnitude claim, every named paper/book/study, and the lead claim of every paragraph. This is the non-negotiable floor. Do not advance an episode past research-audit without MVP passing.
- **Standard** — adds the Disagreement and Freshness sub-lenses (2d, 2e). Use when the episode makes a contested interpretive claim, depends on time-sensitive data, or contradicts a widely held view. Most analytical Parallax episodes should run Standard.
- **Flagship** — adds a **private evidence appendix** to the brief: source excerpts, page references, or screenshot URLs for every nontrivial on-screen factual assertion. Reserved for episodes where being wrong on a single fact would damage trust disproportionately — controversial claims, the launch episode, episodes that name specific named figures or make specific numerical predictions.

State the tier at the top of the audit report. If you're unsure between MVP and Standard, choose Standard. If you're unsure between Standard and Flagship, ask Tiger — the Flagship tier requires Tiger's time as well as the auditor's.

## Verdict Criteria

The verdict is the single most important output. Apply these criteria strictly — the whole point of this skill is to prevent bad briefs from entering the scripting phase and wasting Tiger's limited time.

**READY FOR SCRIPTING** — All of these must be true:
- All 8 sections present and substantive (not just headers)
- ≥80% of load-bearing claims verified (✅)
- Historical parallels include explicit break-point analysis
- Counterarguments section exists with genuinely strong steelmans
- No epistemic red flags (overconfident language, forced analogies)
- Scoring rubric ≥18/25

**CONDITIONAL** — The brief is mostly complete but has specific, enumerable gaps that a script writer could work around or that can be fixed with light editing (not new research). Examples: 2-3 unverified but non-load-bearing claims, a counterargument that's adequate but could be stronger, minor hedging needed. The script writer would need to mark specific passages as "TK — verify before recording."

**NEEDS MORE RESEARCH** — Any of these triggers this verdict:
- Any required section is missing or skeletal (a few bullet points instead of substantive content)
- A load-bearing claim is unverified or contradicted by evidence
- Historical parallels lack break-point analysis (where the analogy fails)
- Counterarguments section is missing entirely
- The thesis is stated with false certainty (no hedging, no acknowledgment of uncertainty)
- Scoring rubric <15/25
- More than 40% of claims are unverified

When in doubt between CONDITIONAL and NEEDS MORE RESEARCH, choose NEEDS MORE RESEARCH. It's cheaper to do one more research pass than to build a script on a weak foundation and discover the problems at script-audit stage.

## Context

This brief was produced by Claude.ai Deep Research, which can process 100-250+ web sources per query. The briefs are comprehensive but sometimes have gaps: forced analogies, unverified claims stated confidently, missing counterarguments, or sections that are thin relative to their importance in the narrative. Your audit catches these problems *before* a script is written, when they're cheap to fix — not after, when they require rewriting.

The brief feeds into a production pipeline: **Deep Research → research-audit (you) → Script Draft → script-audit → persona-eval → visual-spec → render**. Problems you miss cascade downstream. A script built on a weak brief will fail the script-audit, waste time, and potentially publish something intellectually dishonest.

## Inputs

1. **The brief file** (required) — look for `brief.md` in the episode folder, or whatever file the user points you to.
2. **Project reference files** (read as needed):
   - `project/CONTENT_IDENTITY.md` — identity directions, format repertoire, scoring rubric, negative filters
   - `project/CONTENT_RISK_PLAYBOOK.md` — editorial red lines, monetization triggers, propaganda risk
   - `project/IDEAS.md` — arc structure, to check arc coherence
   - `project/SEO_KEYWORDS.md` — keyword targets for this episode, if defined
   - `project/RESEARCH_WORKFLOW.md` — the 8-section brief structure definition
   - Prior episode briefs in `episodes/` — to check for redundancy or contradiction with past episodes
   - `episodes/EDITORIAL_PLAYBOOK.md` — channel-level production rules. Read Section 4 (Research & Brief Quality) before auditing. When your findings match a playbook rule, cite it as "Playbook: [rule ID]." If the brief repeats a known weakness from a previous episode, flag it explicitly: "This pattern was identified in [episode-slug] — see [rule ID]."
   - `episodes/LEARNING_LOG.md` — post-publish analytics findings. If available, check whether this episode's topic or structure overlaps with patterns that performed poorly in past episodes.

Find these files relative to the content folder. Read only the ones relevant to the issues you find — don't read everything upfront.

## The Eight Lenses

Run each lens independently. For each issue found, provide the section reference, the specific problem, and a concrete action (not vague advice).

### Lens 1: Structural Completeness

Check whether the brief has all expected sections with substantive content. The canonical structure is:

1. **Narrative Arc** — beat-by-beat structure with timing, content, emotion, and visual opportunities
2. **Key Claims + Verification Status** — table with source, status (✅/⚠️), notes
3. **Historical Parallels** — each with period, mechanism, analogy fit, what to emphasize, what to acknowledge (where the analogy breaks)
4. **Philosophical Frameworks** — named frameworks applied to the topic (may be woven into Narrative Arc instead)
5. **Data Dashboard** — key numbers for graphics
6. **Counterarguments + Steelman** — strongest case for each side, the episode's own position, epistemic notes
7. **Production Notes** — visual opportunities, B-roll, graphics specs, CN localization
8. **Connective Tissue** — unifying metaphor, core tension, closing question
9. **Speculative Implications** — 2-3 named scenarios with probabilities, 1-2 falsifiable predictions, "what would change my mind" criteria, watch signals

For each section:
- **Present and substantive?** A section that exists but contains only a few bullet points is effectively missing.
- **Missing entirely?** Note that Section 4 (Philosophical Frameworks) is sometimes folded into the Narrative Arc — that's fine as long as the frameworks are there *somewhere*. Section 9 (Speculative Implications) is new — for briefs produced before this section was added, note the absence but don't penalize severely. For new briefs, this section is required.
- **Proportional to its narrative importance?** If the episode's thesis hinges on a historical parallel but that parallel gets only a paragraph, that's a gap even if the section "exists."

**Section 9 quality checks (when present):**
- Are the scenarios structurally grounded in the episode's analysis, or just generic? A scenario named "Things Get Worse" with no structural mechanism is useless. "The Murano Scenario" with a specific parallel to Venice's glass monopoly and a falsifiable trigger event is good.
- Are probability estimates present? They don't need to be precise — rough gut-feel percentages are fine. The point is forcing the researcher to quantify uncertainty rather than hide behind "it's hard to say."
- Do the falsifiable predictions have timeframes? "X will happen eventually" is unfalsifiable. "If X hasn't happened by Q2 2028, this thesis is weakened" is useful.
- Is there at least one genuine "what would change my mind"? This is the strongest credibility signal in the entire brief.

### Lens 2: Claims Verification — The Five Sub-Lenses

This is the most actionable lens and the one where the audit tier matters. Run sub-lenses 2a–2c at every tier; add 2d–2e at Standard or Flagship; add the evidence appendix at Flagship.

The sub-lenses correspond to the documented failure modes in 2026 frontier-model evaluation: "the citation exists" and "the source supports the claim" are different tests; quote/date/number fidelity drifts even in citation-bearing outputs; disagreement gets flattened; freshness rots silently. Each sub-lens targets one failure mode.

**Before starting:** count the verification table breakdown (✅ CONFIRMED / ⚠️ LIKELY CORRECT / ⚠️ NOT YET VERIFIED / ❌ INCORRECT). Note orphan claims (in the narrative but not in the table — most dangerous because nobody flagged them) and discrepancies (narrative number ≠ data dashboard number).

#### Sub-Lens 2a: Citation Existence (every tier)

For every cited work, verify the source object exists *as cited*. Title, author, year, venue, DOI/ISBN/URL all match the same real object. This catches the three most common reference-level failures: total fabrication, partial attribute corruption (real paper with wrong year/author), and identifier hijacking (wrong DOI on a real-sounding citation).

Use web search to verify any citation you can't immediately confirm from memory. If a citation fails this gate, the brief does not advance unchanged — flag it for replacement or removal.

#### Sub-Lens 2b: Source Support (every tier)

For every paragraph in the brief, verify the cited source supports the **precise proposition** — not just the general topic. This is the single most important check, because a working URL on a topical page leaves enormous room for sentence-level claims that the source doesn't actually back. The 2026 source-attribution benchmarks put frontier models at only 39–77% factual accuracy on this exact test.

For load-bearing claims (anchor a key beat or thesis): open the cited source, locate the supporting passage, confirm it backs the specific phrasing in the brief. If the source supports a *related* claim but not the precise one in the brief, that's a fail — flag it for rewording or for finding a different source. If the brief uses a second LLM here, give it the raw claim *and* the source text, and make Tiger the final adjudicator.

For non-load-bearing claims, this can be sampled rather than exhaustive at MVP tier; at Standard or Flagship, exhaustive.

#### Sub-Lens 2c: Quote, Date, and Number Exactness (every tier)

Auto-extract every:
- **Direct quote** (anything in quotation marks attributed to a person)
- **Date** (year, month/day, decade marker)
- **Percentage / magnitude / numerical claim**
- **Superlative** ("largest," "first," "only," "earliest")
- **Timed causal sequence** ("after X, Y happened" — verify the temporal order)
- **Named paper, book, or study**

Line-check each against its source. This catches the BBC/EBU class of failure — quote distortions, off-by-a-year dates, percentages that drift between citation and narration. These are the most reputation-damaging errors because they're concrete, falsifiable, and frequently caught by viewers in comments.

For direct quotes specifically: confirm the exact wording, not the gist. "Globalization is almost dead" and "globalization is essentially over" are not the same quote. If the brief paraphrases but presents as direct, downgrade to indirect speech.

#### Sub-Lens 2d: Disagreement Handling (Standard and Flagship only)

For every nontrivial *interpretive* claim in the brief, force it into one of three buckets:
- **Consensus** — historians/economists/scholars broadly agree.
- **Active dispute** — there is a real disagreement among informed scholars; multiple credible positions exist.
- **Unclear / mixed evidence** — the data is genuinely insufficient to settle it.

Flag every claim where the brief presents an *active dispute* as if it were *consensus*, or vice versa. The most common failure: a contested historical interpretation gets narrated as settled fact because Deep Research smoothed over the disagreement. The fix is not necessarily to add hedging in narration — it's to ensure the *brief* names at least one credible counter-source for every contested interpretive claim, so the script-draft stage can decide how to honor that disagreement (per the bounded-analogy convention) without flattening it into faux consensus.

This is the strongest defense against "smoothed-over disagreement presented as singular truth."

#### Sub-Lens 2e: Temporal Freshness (Standard and Flagship only)

Any claim that depends on:
- Live institutions or roles ("the current Secretary of…")
- Recent events (last 24 months)
- Current officeholders or leadership
- Evolving casualty counts, economic indicators, election results
- Newly released archives or papers

…gets a time-stamp check. Mark each time-sensitive claim with **verified as of [YYYY-MM-DD]** *in the brief itself*. This date does **not** appear in narration — that's a frontstage failure (per script-audit Lens 6) — but it does appear in the brief so the script-draft stage knows what's stale-risk.

The 2026 deep-research evaluations show that deeper search often *increases* citation volume while introducing more stale or hallucinated URLs; freshness rot scales with research effort, not against it. So a brief built from a comprehensive research pass needs *more* freshness checking, not less.

#### Flagship Add-On: Evidence Appendix

For Flagship-tier audits only: produce a private evidence appendix (saved alongside the brief, never narrated). For every nontrivial on-screen factual assertion, the appendix contains either a verbatim source excerpt, a page reference, or a screenshot URL. The appendix exists so that if a claim is challenged in public, Tiger can produce the receipt within minutes. Cost: real, but smaller than the cost of one fabricated quote that ships.

### Lens 3: Historical Parallel Integrity

For each historical parallel in the brief:

1. **Is the analogy honest?** Does the brief clearly state where the parallel holds AND where it breaks? If it only presents the flattering comparison, the script will inherit that intellectual dishonesty.
2. **Is the break-point analysis substantive?** "Of course the situations are different" is not a break-point analysis. The brief should identify *which specific structural features* differ and *how those differences change the expected outcome*. EP01's treatment of Oil Embargo vs. COCOM is the benchmark — each has explicit "what to emphasize" and "what to acknowledge" sections.
3. **Could the parallel be accused of being forced?** Apply the "if I showed this to a skeptical historian, would they buy the structural connection?" test. Flag parallels where the surface similarity is strong but the structural mechanism is different.
4. **Are there obvious parallels the brief is missing?** Sometimes the best analogy isn't the one Deep Research found. If a more illuminating parallel exists, suggest it.

### Lens 4: Counterargument Quality

Read the Counterarguments + Steelman section with hostile eyes:

1. **Are the steelman arguments genuinely strong?** The test: would a smart advocate for that position recognize the steelman as their actual best argument, or would they say "that's not what we're arguing at all"? Weak steelmans are usually too narrow, attacking a specific detail rather than the structural case.
2. **Are there obvious counterarguments missing?** Think about what a well-informed critic from each relevant perspective would say. If the episode is about US-China tech competition, what would a hawkish DC policy analyst say? A Chinese tech entrepreneur? A European semiconductor executive? A development economist?
3. **Is the episode's own position (the synthesis) genuinely distinct from "both sides have a point"?** Wishy-washy synthesis is the most common failure mode. The position should reframe the question or identify a variable that changes the calculus — not split the difference.
4. **Epistemic discipline:** Does the brief use appropriately hedged language? "Structural resonance" not "this proves." "Suggests" not "demonstrates." Flag any language that overstates certainty.

### Lens 5: Scoring Rubric Check

Apply the 5-test universal scoring rubric from CONTENT_IDENTITY.md. Score the episode concept:

1. **Wait What? (the hook):** Does the hook create genuine cognitive dissonance? Would it stop a scroll?
2. **Arguable Thesis:** Could a smart, informed person disagree with the thesis? If not, it's too obvious.
3. **Two-Pillar Test:** Does the episode have both a historical/philosophical pillar AND a contemporary pillar?
4. **Timely-or-Timeless:** Is this either breaking-news relevant OR evergreen enough to generate views in 2 years?
5. **Compounding:** Does this episode create concepts, metaphors, or frameworks that future episodes can reference?

Score each 1-5. Overall score below 18/25 should trigger a flag. A low score doesn't mean "don't make this episode" — it means "here's where the concept is weakest." Sometimes the fix is a one-line reframe of the thesis.

### Lens 6: Risk and Editorial Check

Cross-reference against CONTENT_RISK_PLAYBOOK.md (read it if you spot potential issues):

1. **Monetization triggers:** Does any content hit YouTube's demonetization triggers? Specific keywords, graphic descriptions, or partisan framing about active conflicts?
2. **Propaganda risk:** Could this episode be weaponized by either side? Does the framing inadvertently serve one geopolitical perspective? For a Chinese-American creator, this is especially important — the brief should not make it easy to clip a 30-second segment that looks like either pro-China or anti-China advocacy.
3. **Editorial red lines:** Check against the 7 "never do" items and 5 "always do" items in the playbook.
4. **Historical analogy shield:** Can the brief's historical parallels be framed using the 3-layer strategy (historical context first, pattern recognition second, contemporary application third)?

### Lens 7: Arc Coherence and Continuity

Check against IDEAS.md and any prior episode briefs:

1. **Arc fit:** If this episode belongs to a defined arc, does it advance the arc's macro question?
2. **Redundancy check:** Does this brief cover ground a prior episode already covered?
3. **Prediction market check:** Any prior probability estimates to update? Any Kalshi questions relevant?
4. **Compounding assets:** Does this episode create or extend reusable metaphors, frameworks, or concepts? Note them explicitly — these are valuable brand assets.

### Lens 8: Connection Density and Quality

The core product of Parallax is surprising cross-domain connections at high density. This lens evaluates whether the brief's connections menu gives the scriptwriter enough material to work with — and whether the connections are genuinely surprising rather than obvious.

1. **Count:** Does the brief contain at least 4 cross-domain connections? (The research workflow targets 4-5, the scriptwriter selects 2-3.) Fewer than 3 is a gap — the scriptwriter has no selection margin and the episode risks feeling thin.

2. **Domain diversity:** Do the connections span at least 3 different domains (history, philosophy, game theory, civilizational analysis, economics, literature, science)? A brief with 4 connections all from European political history has quantity but not diversity. The most memorable Parallax connections come from unexpected domain pairings — a biological metaphor applied to geopolitics, or a game-theoretic lens on a historical event.

3. **Surprise rating:** For each connection, apply the "educated viewer" test: would someone who reads Foreign Affairs and The Economist already know this connection? If yes, it's not surprising enough for Parallax. "Empires rise and fall" is obvious. "Venice's Murano glass monopoly shares island-concentration logic with TSMC in Taiwan" is surprising. Rate each connection: **Novel** (genuinely unexpected pairing), **Interesting** (known to specialists but not general audiences), or **Obvious** (common knowledge among educated viewers). A brief needs at least 2 Novel or Interesting connections among its top 3.

4. **Structural mechanism:** For each connection, check whether the brief identifies the shared *structural mechanism* — not just surface similarity ("both involved trade") but the underlying dynamic ("both cases show how geographic concentration of a critical resource creates leverage that the concentrating party initially benefits from but ultimately can't control"). If the mechanism is vague or missing, the connection is underdeveloped and will feel forced in the script.

5. **Break-point analysis:** Does every connection include explicit, substantive breakage — where the analogy fails? This is mandatory per NAR-13. "Of course the situations are different" doesn't count. The brief should identify which specific structural features differ and how those differences change the expected outcome. Missing breakage is the single most common connection quality failure.

6. **Concept registry check:** Run `tools/concepts/lookup.py reuse-check` against the brief (or manually check `data/concepts.json`) to see if any connections reference concepts already registered from *prior* episodes. At this stage, the current episode's concepts haven't been registered yet — that happens after script finalization. You're checking whether the brief references frameworks, terms, or analogies that returning viewers already know (e.g., "tragedy of the commons" if EP02 established it, then EP05 references it). Callbacks to existing concepts are more powerful than cold intros — flag reuse opportunities. For EP01 or early episodes with few registered concepts, this sub-check will naturally be thin; that's fine.

**Scoring guidance:**
- 4+ connections with 3+ domains, 2+ Novel/Interesting, all with mechanisms and breakage → **Strong**
- 3 connections or 2 domains or 1 missing breakage → **Adequate** (note the specific gaps)
- <3 connections or all obvious or multiple missing mechanisms/breakage → **Weak** (triggers CONDITIONAL or NEEDS MORE RESEARCH depending on severity)

A Weak connection density score by itself should trigger at minimum a CONDITIONAL verdict with a suggested Pass 2 cross-domain connection hunt prompt. If the brief has fewer than 3 connections total, it's NEEDS MORE RESEARCH — the scriptwriter literally doesn't have enough material.

## Output Format

**Canonical write path:** `episodes/<slug>/research-audit.md` — **required, not optional.** The report is the audit trail the next stage (angle-memo) consults. Without it the verdict happened only in chat and there's no record to diagnose a topic that fails later. Write the file before presenting the verdict in chat.

```
# RESEARCH AUDIT REPORT
## Episode: [number and title]
## Date: [today]

## Tier: [MVP / Standard / Flagship]
[1 sentence stating which tier was selected and why.]

## Verdict: [READY FOR SCRIPTING / CONDITIONAL / NEEDS MORE RESEARCH]
[2-3 sentences explaining the verdict. If CONDITIONAL, state caveats. If NEEDS MORE RESEARCH, state exactly what's needed and suggest specific Deep Research prompts.]

## Structural Completeness
[Section-by-section. Only flag gaps — don't narrate what's fine.]

## Claims Verification (Five-Lens Framework)
### Status breakdown: X/Y confirmed, Z unverified, W load-bearing unverified
### Sub-Lens 2a (Citation Existence): [pass / fail count + specific failures]
### Sub-Lens 2b (Source Support): [paragraphs with adequate / inadequate source support]
### Sub-Lens 2c (Quote-Date-Number Exactness): [extracted items checked, drifts found]
### Sub-Lens 2d (Disagreement Handling — Standard+ only): [contested claims flagged, missing counter-sources]
### Sub-Lens 2e (Temporal Freshness — Standard+ only): [time-sensitive claims with verified-as-of dates]
### Verification attempts:
[claim → what you found → updated status, for each searched claim]
### Orphan claims: [claims in narrative not in verification table]
### Discrepancies: [number mismatches between sections]
### Evidence appendix status (Flagship only): [complete / incomplete + gaps]

## Historical Parallels
[Per-parallel assessment. If well-constructed, one line and move on.]

## Counterargument Quality
[Steelman strength, missing perspectives, synthesis quality, epistemic discipline.]

## Scoring Rubric
| Test | Score (1-5) | Notes |
|------|-------------|-------|
| Wait What? | | |
| Arguable Thesis | | |
| Two-Pillar | | |
| Timely-or-Timeless | | |
| Compounding | | |
| **Total** | **/25** | |

## Risk & Editorial
[Only flag issues. If clean, say "No flags" and move on.]

## Arc Coherence
[Arc fit, redundancy, prediction market connections, compounding assets.]

## Connection Density
### Count: [X] connections across [Y] domains
### Surprise ratings: [per-connection ratings]
### Mechanism quality: [per-connection assessment]
### Breakage completeness: [which connections have/lack substantive breakage]
### Reuse opportunities: [any callbacks to existing concepts in the registry]
### Overall: [Strong / Adequate / Weak]

## Gap List
[Numbered list of every gap/issue, ranked by impact on script quality. Each item actionable.]

## Suggested Deep Research Prompts
[If CONDITIONAL or NEEDS MORE RESEARCH: 1-3 targeted prompts to paste into Deep Research.]
```

## Important Notes

- **The verdict is the most important output.** Tiger has 5-10 hours/week total. If the brief is good enough, say so and let him move to scripting. Don't manufacture issues to fill space. But equally important: don't be lenient on a brief that isn't ready. Sending a bad brief to scripting wastes more time than sending it back for another research pass. A brief missing its counterarguments section or with a skeletal verification table is NEEDS MORE RESEARCH, full stop — no matter how good the thesis is.

- **Distinguish load-bearing gaps from cosmetic gaps.** An unverified claim in a throwaway line is different from one that anchors the thesis. Rank everything by narrative impact.

- **Be specific about what's missing, not just that something is missing.** "The counterarguments are weak" is useless. "The steelman for 'controls will work' doesn't address the equipment maintenance argument — ASML machines need regular servicing that China can't source domestically, which is the strongest case for long-term control efficacy" is useful.

- **Verification searches should be efficient.** Focus on the 3-5 claims that are both unverified AND load-bearing. Don't search for obviously true claims or obviously unverifiable ones.

- **Cross-reference judiciously.** Read CONTENT_RISK_PLAYBOOK.md only if you spot risk issues. Read IDEAS.md only if arc coherence matters. The goal is thoroughness without waste.

- **Suggested Deep Research prompts should be surgical.** Don't suggest "research the history of X" — suggest "Find primary sources for the claim that Japan had 18 months of fuel reserves at the time of the 1941 oil embargo. Check: Eri Hotta's 'Japan 1941', Herbert Feis's 'The Road to Pearl Harbor', and the Navy Ministry's own wartime fuel estimates."
