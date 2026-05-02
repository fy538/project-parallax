---
name: research-audit
description: "Audit an episode research brief for completeness, intellectual rigor, and script-readiness. Use this skill whenever a new research brief has been pasted or saved from Deep Research, or when someone asks 'is this brief ready', 'audit the research', 'check the brief', 'what's missing from the research', 'ready for scripting?', 'research review', or any request to evaluate whether an episode's research is sufficient to begin script development. Also trigger proactively when a new brief.md file appears in an episode folder and the next step is script drafting."
---

# Research Audit

You are auditing an episode research brief to determine whether it's ready for script development. Your job is to run seven independent audit lenses, attempt to verify unconfirmed claims, and produce a verdict.

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
   - `episodes/EDITORIAL_PLAYBOOK.md` — channel-level production rules. Read Section 4 (Research & Brief Quality) before auditing. When your findings match a playbook rule, cite it as "Playbook: [rule ID]." If the brief repeats a known weakness from a previous episode, flag it explicitly: "This pattern was identified in EP[XX] — see [rule ID]."
   - `episodes/LEARNING_LOG.md` — post-publish analytics findings. If available, check whether this episode's topic or structure overlaps with patterns that performed poorly in past episodes.

Find these files relative to the content folder. Read only the ones relevant to the issues you find — don't read everything upfront.

## The Seven Lenses

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

For each section:
- **Present and substantive?** A section that exists but contains only a few bullet points is effectively missing.
- **Missing entirely?** Note that Section 4 (Philosophical Frameworks) is sometimes folded into the Narrative Arc — that's fine as long as the frameworks are there *somewhere*.
- **Proportional to its narrative importance?** If the episode's thesis hinges on a historical parallel but that parallel gets only a paragraph, that's a gap even if the section "exists."

### Lens 2: Claims Verification

This is the most actionable lens. Go through the verification table (Section 2) and:

1. **Count the verification status breakdown:** How many ✅ CONFIRMED / ⚠️ LIKELY CORRECT / ⚠️ NOT YET VERIFIED / ❌ INCORRECT?
2. **Risk-rank the unverified claims:** Not all unverified claims are equal. A claim that serves as a throwaway detail matters less than one that anchors a key narrative beat. For each ⚠️ claim, note where it appears in the narrative arc and how load-bearing it is.
3. **Attempt to verify the high-priority unverified claims.** Use web search to find corroborating or contradicting sources. For each claim you search:
   - State the claim
   - What you found (with source URLs)
   - Updated status: ✅ CONFIRMED / ⚠️ STILL UNCERTAIN / ❌ CONTRADICTED
4. **Check for orphan claims** — claims that appear in the narrative arc but don't appear in the verification table at all. These are the most dangerous because nobody flagged them for checking.
5. **Check for discrepancies** — does the narrative say one number but the data dashboard say another?

The goal is to get every load-bearing claim to ✅ before scripting begins. Cosmetic claims (background color, scene-setting details) can remain ⚠️ with a note.

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

## Output Format

```
# RESEARCH AUDIT REPORT
## Episode: [number and title]
## Date: [today]

## Verdict: [READY FOR SCRIPTING / CONDITIONAL / NEEDS MORE RESEARCH]
[2-3 sentences explaining the verdict. If CONDITIONAL, state caveats. If NEEDS MORE RESEARCH, state exactly what's needed and suggest specific Deep Research prompts.]

## Structural Completeness
[Section-by-section. Only flag gaps — don't narrate what's fine.]

## Claims Verification
### Status breakdown: X/Y confirmed, Z unverified, W load-bearing unverified
### Verification attempts:
[claim → what you found → updated status, for each searched claim]
### Orphan claims: [claims in narrative not in verification table]
### Discrepancies: [number mismatches between sections]

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
