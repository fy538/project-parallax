# Lens 9 — Psychological Architecture

Loaded on demand from `SKILL.md`. Run this lens only when the stub there says to.

### Lens 9: Psychological Architecture

This lens audits against the six psychology-grounded requirements documented in `project/SCRIPT_FORMAT.md` (Psychological Architecture section) and `project/CALIBRATION_LANGUAGE.md`. These are non-negotiable structural requirements derived from NFC, AIT, Information Gap Theory, narrative transportation, and superforecasting research — not stylistic preferences.

**Cold open 4-beat structure:**
Verify the cold open completes all four beats within the first 60 seconds, in order:
1. Schema — activates a prior belief the viewer already holds
2. Violation — disrupts it with a single concrete contradiction
3. Narrowing — reduces to one closeable question
4. Solvability promise — signals the route to closure without giving the answer

Flag any beat that is missing or out of order. Narrowing without a solvability promise is the most common failure — it creates diffuse anxiety rather than directed curiosity. The solvability promise does not give away the answer; it promises the path exists.

**Structural markers — [FRAMEWORK UNLOCK] and [MAIN REVEAL]:**
- Does the script contain `<!-- [FRAMEWORK UNLOCK] -->` in a beat header? If yes, check that it falls at or before 40% of the total episode runtime (e.g., before 6:00 in a 15-minute episode). If it falls later, the information gap stays open too long — curiosity converts to impatience. If absent entirely, flag.
- Does the script contain `<!-- [MAIN REVEAL] -->` in a beat header? Check that at least one analytical beat *before* this marker establishes why the obvious explanation fails. The main reveal should land on already-prepared ground. If the [MAIN REVEAL] is the first beat to challenge the conventional framing, it's doing too much work alone.

**Anxiety-to-inquiry conversion before midpoint:**
Affective Intelligence Theory research shows that anxiety (surveillance system) produces careful processing and openness to updating — but only if converted to inquiry before it tips into dread. Check: is there a beat before the episode midpoint that transforms the initial disorientation/unease into a directed question the viewer wants answered? If the episode reaches its midpoint and the viewer is still in pure disorientation without a sense of trajectory, the anxiety hasn't been converted.

**Anger vs. anxiety framing (causal framing audit):**
For every "X happened because..." or "they did this because..." clause in the narration, the completion should name a mechanism, incentive structure, feedback loop, or structural pressure — NOT a coordinated hidden-agent decision. "The structural incentives produced this outcome" → anxiety (productive). "They planned this to happen" → anger (epistemically risky and credibility-costly).

Flag any causal claim that requires believing specific people coordinated in secret. These are not just toxin-line violations — they also activate the anger system and produce audiences that punish rather than analyze. Suggest a structural reframe for each flagged instance.

**Assertive calibration — no Level 3 vague uncertainty:**
Scan every speculative or predictive passage for Level 3 vague phrases from CALIBRATION_LANGUAGE.md:

| Flag | Problem |
|------|---------|
| "Maybe..." / "Perhaps..." | Unanchored — gives no structural information |
| "It's complicated" | Analytical abdication |
| "Who knows" / "Only time will tell" | Exit state — destroys forward pull |
| "There are arguments on both sides" | No analytical content |
| "This could go either way" | Equivalent to "who knows" |
| "I'm not sure but..." | Self-doubt as preamble |

For each flagged phrase, provide a Level 2 rewrite (verbal calibration with explicit boundary) or Level 1 rewrite (quantified probability with rationale) as appropriate. Also verify: is the outside view (base rate) stated before the inside view (case-specific reasoning) in any passage that makes a predictive claim?

**Bounded verdict close — all four elements:**
The episode close must deliver all four elements:
1. Best current reading — one defensible analytical position, stated confidently
2. Confidence boundary — explicit statement of what the analysis cannot establish
3. Watchpoints — 2-3 specific observable developments the viewer can track
4. Reflection trigger — a closing question or reframe prompting the viewer to apply the framework to their own mental model

Flag any element that is missing. The reflection trigger (element 4) is the most commonly absent — it's what makes post-episode memory and self-relevant reflection persist beyond the viewing session, which transportation research shows mediates belief change more than in-episode narration alone. A close that ends on element 3 (watchpoints) without a reflection trigger leaves the viewer as observer rather than participant.

**Title confidence check:**
If working titles are specified in the angle memo or script header, check: does any title make a stronger claim than the bounded verdict the episode actually delivers? A title that implies certainty ("How China Will Win the Chip War") attached to an episode that concludes with genuine uncertainty violates the implicit promise and damages trust when the viewer reaches the close. Flag mismatches and suggest a title-level fix (not a conclusion-level fix — the conclusion's epistemic honesty is correct; the title needs to match it).

**Target behavior check:**
Does the angle memo or episode close identify a target viewer behavior (subscribe / share / return visit)? If yes, check whether the closing beat's emotional state is designed for that target:
- Subscribe target → calm competence close (not urgency, not dread)
- Share target → high arousal close (awe, alarm, revelation that demands to be told to someone)
- Return visit → slight unfinished-question close (the series thread left open)

If the target behavior is "share" but the close is calm, or "subscribe" but the close is alarming, flag the mismatch.

**[FORECAST:] tag audit:**
For every `[FORECAST:]` tag in the script, verify all six layers are present:
1. PROBABILITY — whole number percentage
2. VERBAL TAG — anchored to the number, not replacing it
3. BASE RATE — outside view stated first
4. KEY DRIVER — single main case-specific factor
5. KEY DISCONFIRMER — evidence that would push the estimate opposite direction
6. BENCHMARK — a prediction market or comparable forecast, with one sentence on whether Parallax diverges and why

Also check: does the RESOLUTION line pass the clairvoyance test? (A hypothetical person with perfect knowledge of the future could unambiguously score this on the specified date.) Vague resolutions ("will China become more dominant?") fail; specific binary/binned resolutions ("will China achieve domestic EUV lithography at 7nm or below by January 2028?") pass. Flag missing layers and failed resolution tests.

**Output for this lens:**

```
Lens 9: Psychological Architecture

Cold open 4-beat: PASS / FAIL — [specific issue if fail]
[FRAMEWORK UNLOCK] timing: PASS / FAIL / ABSENT — [marker found at X% of runtime / missing]
[MAIN REVEAL] setup: PASS / FAIL / ABSENT — [setup beat present/absent]
Anxiety-to-inquiry conversion: PASS / FAIL — [conversion beat present at X% / absent]
Anger/anxiety framing: [N] causal claims checked — [N] structural, [N] flagged for hidden-agent framing
Assertive calibration: [N] Level 3 phrases found — [list phrases with rewrite suggestions]
Bounded verdict close: elements present: [1/2/3/4] — missing: [list missing elements]
Title confidence: PASS / FLAG — [description if flagged]
Target behavior: [subscribe / share / return / unspecified] — close designed for target: PASS / MISMATCH / UNSPECIFIED
[FORECAST:] tags: [N] tags — complete: [N], incomplete: [N] — [list missing layers and failed resolution tests]

Verdict: PASS / NEEDS WORK — [1-2 sentence summary of most critical psychological architecture issues]
```
