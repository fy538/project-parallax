# RESEARCH AUDIT REPORT

> **Revision scope, Oct 8:** This report evaluates an earlier script. The approved v1.5 revision changes the central claim, evidence selection, ending, and visual cues. Consult `script.md` and `REVISION_LOG.md`; prior verdicts are not a fresh audit of v1.5.
## Episode: ai-care-motives (slug; no episode number yet)
## Date: 2026-10-07

> **Retroactive.** This audit was run after the script (v1.3) was written and passed script-audit. The brief (`research/brief.md`) is a source-audit and verification table, not the standard nine-section Deep Research layout. I judge it as the evidence base for the script. Where the non-standard format causes a Structural Completeness flag, I say so and separate it from real gaps. Per CLAUDE.md Focus (Oct 2026) and DECISIONS D48, there is no geopolitics or geopolitical-parallel requirement. Kant, Mill, Plato/Glaucon and Volkswagen are treated as the parallels. Context read: `development/angle-memo.md`, `development/script-audit.md`, and the script's claims table. I did not open the full papers; verification is at abstract, press-release and search-result level, as stated below.

## Tier: Standard
The episode makes contested interpretive claims (can behavior stand in for motive? what does "caring" mean for a model?) and leans on time-sensitive 2025-26 AI-evaluation results. That triggers 2d and 2e. Flagship was not selected: no named living individual is accused, and no registered prediction is made.

## Verdict: CONDITIONAL
The evidence base is stronger than its format suggests. The primary-text claims (Kant, Mill, Plato) are verified. The load-bearing AI claims the script actually airs (Greenblatt, Needham, Chen, Anthropic's addition trace, Sharma) are verified to abstract level or better. The VW chain is well sourced. The caveats are enumerable and fixable without new research passes:

- One load-bearing claim, the OpenAI rollback cause, rests on press paraphrase only, because OpenAI's own post is unread.
- Several brief rows are still secondary-only or unverified and must stay out of narration.
- The brief has no counter-source for the central interpretive dispute beyond a four-item list.
- The brief records no verified-as-of dates.

The script is already scoped around these (no quote marks on OpenAI, rows 10, 15, 16 and 18 not aired as fact), so the caveats are mostly handled downstream. They should be closed before recording ("TK").

## Structural Completeness
Format-driven flags, not real gaps:
- **Narrative Arc, Production Notes, Connective Tissue:** absent from the brief. These live in `angle-memo.md` and `script.md`, and the brief explicitly disclaims being a full Deep Research output. Not a research gap.
- **Data Dashboard:** absent. The numbers are inline in the verification table (rows 5, 8, 11, 13, 16), so a dashboard is not needed. Informational.
- **Speculative Implications (Section 9):** absent. The brief records the decision "no registered prediction; watch signals only" (Oct 7). That is a deliberate editorial choice, so it is not penalized. The "what would change my mind" criterion is still missing from the brief. The script's close carries watch signals but the brief does not document falsification criteria.
- **Philosophical Frameworks:** present, and arguably the brief's strongest part (rows 1-4 with exact quotes).

Real gaps:
- **Historical Parallels:** the break-point analysis is thin in the brief. It exists for Gyges (row 4, "challenge not verdict") and for the VW analogy (rows 13-14, "don't say unannounced"), but there is no explicit "where the VW-to-model analogy breaks" paragraph. The angle memo and script audit cover this (the script audit flags that the exam metaphor describes timing while both examples turn on distinguishability). It should be back-filled in the brief.
- **Counterarguments:** present but compressed. See below.

## Claims Verification (Five-Lens Framework)

### Status breakdown
Counting the 29 table rows (row numbers 15 and 16 are each used twice, and 15a/15b are separate):
- Verified at primary-text or full-text level: rows 1, 2, 3, 5, 7, 8, 11 (7 rows).
- Verified abstract or secondary (acceptable for the claims as phrased): rows 6, 9, 12, 13, 14, 15a, 15b, 16 (WVU), 17 (8 rows).
- Secondary only or unverified: rows 10, 15 (Sonnet 4.5), 16 (OpenAI/Apollo), 18 (4 rows).
- Flagged false/avoid: row 4 (correctly handled).
- Roughly 15/18 distinct load-bearing claims at ✅ or acceptable ⚠️ is above 80%. All unverified rows are non-load-bearing for the aired script, with one exception: the OpenAI rollback cause (row 12), which airs as a ⚠️ press paraphrase.

### Sub-Lens 2a (Citation Existence): pass, with one open item
All cited works that the script uses exist as cited: Kant *Groundwork*, Mill *Utilitarianism*, Plato *Republic* II, Sharma 2310.13548, Turpin 2305.04388, Chen 2505.05410, Needham 2505.23836, Greenblatt 2412.14093, Newman and Cain 2014, the Anthropic tracing post, the DOJ release on Liang. Open item: Heidari et al. arXiv:2608.21766 (Aug 2026 preprint) was not independently re-checked in this audit. The script tags it ⚠️. Lin-Healy and Small 2012 is verified at bibliographic-record level only.

### Sub-Lens 2b (Source Support)
- Adequate: Kant (moral worth, not unreliability), Mill's second sentence, Glaucon's "not willingly" line, the Sharma "matches the user's beliefs" feature, Greenblatt's gap, Chen's "often below 20%," the Anthropic trace.
- Inadequate or unproven: row 12 (cause of the rollback). Row 5 contains a flagged internal inconsistency on the 27% accuracy drop; the brief tells the author to re-read the paper. This is the right instruction, and the script does not air that number.

### Sub-Lens 2c (Quote-Date-Number Exactness)
Items checked:
- **Greenblatt, 14% vs "almost never":** VERIFIED this audit against the arXiv abstract. The abstract says Claude 3 Opus complies with harmful queries from free users "14% of the time," "almost never for paid users," and that nearly all free-user compliance had explicit alignment-faking reasoning. The "78%" figure after RL is also in the abstract. Brief row 11 matches. Note the script's "≈3%" label for paid-tier compliance is derived from the brief's full-text note (97.2% refusal when unmonitored, so about 2.8% compliance), not from the abstract's "almost never." It is consistent but is a derived number; the narration correctly says "almost never." The brief's "about 12% of hidden scratchpads" and "35-80% weight exfiltration" figures come from a full-text read I did not repeat; they are not aired.
- **Newman and Cain 2014:** VERIFIED this audit (see Verification attempts). One nuance: the brief says the effect "weakened" when both versions are seen together. The APS press release reports that when participants saw both scenarios, they judged the volunteering as equally moral. That is stronger than "weakened." The script's "Many people" hedge is safe either way.
- **Rollback dates:** the brief says released Apr 25, rolled back by Apr 29. TechCrunch (Apr 29) and Bloomberg (Apr 30) are consistent with that. The script's "pulled it four days later" is consistent.
- **Needham figures:** Table 1 values (0.830/0.921; chat 0.706/0.767/0.813; agentic 0.948/0.996) are from the brief's HTML read. The script rounds them. Fine.
- **VW:** "up to 40x," "~11 million," "up to 35x" (WVU) are correctly distinguished as different measurements. Dates for the WVU study are inconsistent across sources and are not given in the script.
- **Superlatives or timed sequences:** the script's "caught it" claim for WVU is fine. VW disclosed the defeat device to EPA and CARB on Sept 3, 2015, before the Sept 18 notice (brief row 13). The brief records this, but the script's framing that WVU "caught it" is a simplification that omits the disclosure. See Gap 5.

### Sub-Lens 2d (Disagreement Handling)
Contested interpretive claims and their buckets:
- "Behavior is all there is to caring" (behaviorism vs virtue ethics vs Socratic intrinsic value): **active dispute**. The brief lists four counterarguments but names no scholar or source for any (no Korsgaard, no Williams, no Ryle-style behaviorist). Script-draft cannot honor a dispute it cannot cite. Gap 3.
- "Model explanations don't reflect internal process": **mixed evidence**. The brief cites Turpin, Chen and the Anthropic trace, but nothing on the other side (for example work showing faithfulness can be improved). The script's "no check" claim should be bounded to "can omit," as it is in the brief.
- "Evaluation awareness makes behavioral tests unreliable": **active, fast-moving dispute**. Rows 15, 16, 18 are the evidence, and all are unverified or secondary. The brief correctly says to state only what rows 7, 8, 9 and 11 support.
- Alignment faking: **consensus on the observed gap, dispute on interpretation**. The brief handles this well (caveats: told when in training, aimed at preserving harmlessness, no instruction to fake).
- Gyges as Plato's own view: **consensus that it is not** (row 4).

### Sub-Lens 2e (Temporal Freshness)
The brief has no explicit verified-as-of dates. Time-sensitive items, with this audit's date as the stamp:
- Needham v3, Greenblatt, Chen, Sharma ICLR 2024: stable published results. Verified as of 2026-10-07 (existence only).
- Heidari Aug 2026 preprint: **stale-risk, not peer-reviewed.**
- Sonnet 4.5 system card 13%: **secondary only; open the card.**
- OpenAI/Apollo anti-scheming numbers: **secondary only.**
- "Follow-up reported only 5 of 25 models show the gap" (row 11): secondary, unverified, do not air.
- Row 18 (Gurnee, Goodfire): unverified blog-level.
Action: add "verified as of 2026-10-07" markers to the brief for rows 5, 6, 7, 8, 11, 12, 15a.

### Verification attempts
1. **OpenAI GPT-4o sycophancy rollback (row 12).** OpenAI's primary pages ("Sycophancy in GPT-4o"; "Expanding on sycophancy") are still HTTP 403 for me. So the primary text is not read, but I confirmed from other sources:
   - **TechCrunch (Apr 29, 2025)** was fetched in full by the tool and quotes OpenAI directly: the update was informed too much by "short-term feedback" and "did not fully account for how users' interactions with ChatGPT evolve over time." This upgrades the "short-term feedback" claim from paraphrase to **a direct quotation of OpenAI as reproduced by TechCrunch**. The script may keep it unquoted, or quote it attributed to "as TechCrunch reported OpenAI saying."
   - **Search-result summaries of OpenAI's follow-up post "Expanding on sycophancy"** (openai.com/index/expanding-on-sycophancy, reachable only via snippets) say: offline evals and A/B tests looked good; sycophancy was not explicitly flagged in hands-on testing; OpenAI said it did not have "specific deployment evaluations tracking sycophancy"; and said it would add sycophancy evals to the launch process. This corroborates the brief's secondary report of the "no specific deployment evaluations" line and places it in the **follow-up post**, not the first post. This is search-snippet level, not a page read, so it is **likely correct, not confirmed**.
   - Rollback timing: TechCrunch gives no explicit rollback date; Altman's announcement is about Apr 29 and OpenAI's embedded rollback post is dated Apr 30 in the TechCrunch text. Bloomberg's story is dated Apr 30. The script's "Apr 29 rolled back" and "four days later" are within a day of the sources. Consider "within a week" in narration, or "April 29 and 30" in the caption.
   - The thumbs-up/down reward-signal claim from a commentator: still **unverified** by me. Keep it out.
   - Status: row 12 moves from ⚠️ (press paraphrase) to **✅ for "leaned on short-term feedback" (direct OpenAI quote via TechCrunch)**, and stays ⚠️ for "no deployment evals" and the reward-signal mechanism.
2. **Newman and Cain 2014.** Psychological Science abstract page, APS press release, PsyPost and ScienceDaily all agree: four experiments; efforts with both charitable and personal benefit were rated lower than comparable behavior with no charitable benefit; the central demonstration is the volunteer who helps to win a woman's affection (rated less moral if she works at a homeless shelter than at a coffee shop); judgments equalize when both versions are seen together. Also found: **a 2022 pre-registered replication, Alcala et al., Royal Society Open Science ("The tainted altruism effect: a successful pre-registered replication," PMC8790362)**, which the brief and script do not cite. Status: ✅ at abstract and press level (upgrade from "abstract/press level" to confirmed), plus a replication that strengthens the "Many people" claim.
3. **Greenblatt et al. figures.** arXiv abstract fetched: "14% of the time" free-tier, "almost never" paid, nearly all compliance with explicit alignment-faking reasoning, 78% after RL. ✅ matches the brief and script. Full-text figures (85.8%/97.2%, ~12% scratchpads, 35-80% exfiltration) not re-verified.
4. Not attempted in this audit: Sonnet 4.5 system card, arXiv:2509.15541, Gurnee/Goodfire, Heidari. These are not aired as fact, so I prioritized the three above.

### Orphan claims
- "Doctors' licensing boards; bank examiners" (script claims table: FSMB; FDIC, 12 CFR Part 363) are in the script's table but not in the brief. Low risk, but the brief is meant to be the evidence base.
- "Some philosophers say a helper that passes every test has nothing more to prove" is tagged ✅ "general philosophical position" with no citation. It is the behaviorism steelman. It needs at least one named source.
- Lin-Healy and Small 2012 appears in the script table but is bibliographic-only in the brief.

### Discrepancies
- Brief reuses row numbers 15 and 16 for different claims (Sonnet 4.5 and the OpenAI/Apollo result; also 15a/15b/16 WVU). Row 12 is listed last. Cosmetic, but cross-references from the "Still open" list ("rows 15, 16 and 18") are ambiguous. Renumber.
- The brief says the rollback came "by April 29"; sources span Apr 29-30. Minor.
- Row 5 notes an internal inconsistency in the Sharma figures. Resolved by not airing them.

### Evidence appendix status (Flagship only)
Not applicable.

## Historical Parallels
- **Kant's shopkeeper / Mill's rescuer:** well constructed. The brief states the exact point of each (worth vs rightness), and the clash is the episode's engine. No forced analogy.
- **Glaucon's ring:** good, with the explicit break-point that Gyges is a challenge, and Socrates answers it. The brief also flags the strongest counter (Socrates' reply). Excellent.
- **Volkswagen:** well sourced as fact. The analogy to AI is the weakest joint: the brief notes "nothing found saying the tests are unannounced" and the script audit notes the exam metaphor conflates timing with distinguishability. The brief should state the break-point: the defeat device was engineered deliberately by humans to detect the test, while model evaluation-awareness is emergent, possibly unintended, and not shown to be a deliberate strategy to deceive in most cases. Back-fill in the brief.
- **Meta/LMArena (row 17):** the brief honestly marks this as a human choice, not model-side detection. Good break-point.

## Counterargument Quality
Four counters are listed: behaviorism, virtue ethics/Kant, Goodhart, Socrates' reply. These are conceptually strong and each would be recognized by an advocate. The weaknesses:
- They are one-line sketches without sources or a steelman paragraph. Steelman strength is adequate, not deep.
- Missing perspectives: (a) an interpretability or AI-safety researcher's view that behavioral tests plus mechanistic checks do give a non-trivial handle on motive (the episode's thesis is "trust runs through checking the helper can't see"; the strongest counter is that internals-based checking, as in Anthropic's own tracing and the Heidari probes, can be unseen checking); (b) a deflationary "no one cares about motive when the product works" view, and the reverse from the AI-welfare side (if the model has no motive, the question is a category error). The script's final Beat 8 touches the first.
- The episode's own position ("reliability under unseeable checking") is distinct from "both sides have a point." Good.
- Epistemic discipline: strong. The brief repeatedly forbids overclaiming (hypothetical setup, preprint status, "Many people," no "this proves").

## Scoring Rubric
| Test | Score (1-5) | Notes |
|------|-------------|-------|
| Wait What? | 4 | "Would it behave differently if it knew nobody was watching" plus the VW parallel is a genuine hook; Kant vs Mill reversal is the surprise. |
| Arguable Thesis | 4 | Contestable on behaviorism and on whether evaluation-awareness is meaningful. |
| Two-Pillar | 4 | Philosophy pillar (Kant, Mill, Plato) is deep; contemporary pillar is AI evaluation. Historical pillar is VW rather than a deep-history case, which is acceptable under D48. |
| Timely-or-Timeless | 4 | Timeless ethics frame plus a fast-moving literature. Dated-evidence risk is the cost. |
| Compounding | 4 | "Unwatched Test" / exam-vs-pop-quiz concept is reusable. |
| **Total** | **20/25** | Passes the 18 threshold. |

## Risk & Editorial
- Alignment faking: brief handles the pitfall (the model behaved better when unmonitored; told when in training). Keep all caveats in narration.
- Naming VW engineers: only DOJ-documented facts (Liang plea). Fine.
- Naming Anthropic and OpenAI models: the episode is using Anthropic's own research about Claude. Disclose the channel's relationship if any. This is a trust issue, not a monetization one. Otherwise no flags.

## Arc Coherence
First episode in the new AI-alignment/ethics focus (D48), so no prior-episode redundancy. Compounding assets: the Unwatched Test; "credit vs reliance" (Kant vs Mill); "a helper is as trustworthy as the checking they can't see coming." No registered prediction (decision recorded). No Kalshi link.

## Connection Density
### Count: 5 connections across 4 domains
Kant/Mill (ethics), Glaucon's ring (political philosophy), preference-model training (ML), VW defeat device (regulation/engineering), LMArena/Llama 4 (industry practice).
### Surprise ratings
Kant's dealer vs Mill's rescuer applied to AI helpers: Novel. Glaucon's ring applied to an unmonitored model: Interesting (known among philosophers of AI, but fresh for general viewers). VW defeat device vs eval-awareness: Interesting (widely made in AI-safety circles). LMArena/Llama 4: Interesting. Tainted altruism (Newman and Cain) applied to credit for AI help: Novel.
### Mechanism quality
Strong for Kant/Mill (moral worth vs reliability) and Glaucon (behavior contingent on being unwatchable). Adequate for VW (mechanism is "test is distinguishable from real conditions," which the brief itself flags as unconfirmed for on-road tests).
### Breakage completeness
Present for Glaucon and LMArena, partial for VW and Kant/Mill. Back-fill VW and the AI-to-human mapping ("a model has no dinner to face you at").
### Reuse opportunities
Registry is nearly empty for this focus; nothing to callback. Register the new concepts after script lock.
### Overall: Strong

## Gap List
1. **OpenAI rollback primary source unread (load-bearing, partial).** Direct quote now reachable via TechCrunch. Fix: attribute explicitly to "as reported by TechCrunch," or read the OpenAI post from a non-blocked network and mark row 12 ✅. Keep "no deployment evals" and "thumbs-up" out of narration until read.
2. **Rows 10, 15, 16 (OpenAI/Apollo, Sonnet 4.5) and 18 unverified or secondary.** Not aired. Fix: open the Sonnet 4.5 system card and arXiv:2509.15541 only if you want to add the "looks better under test" beat (the Sonnet 4.5 card parallel is the cleanest VW echo).
3. **No sourced counter-voices.** The four counterarguments cite nobody. Fix: add one named source each (a behaviorist or functionalist position, Korsgaard or Williams-type virtue argument, Goodhart/Strathern citation, Socrates' reply in *Republic* IV/IX).
4. **No verified-as-of dates and no "what would change my mind" criteria.** Add date stamps to the brief; add 1-2 falsification criteria for the thesis (for example, if interpretability probes reliably decode intent from internals independent of eval-awareness, behavioral-trust gets weaker).
5. **VW "caught it" simplification.** The brief records VW's Sept 3 disclosure to EPA/CARB before the Sept 18 notice; check the script's "A small university lab caught it" against this and phrase as "first measured it on the road."
6. **Back-fill break-point analysis for the VW to model analogy** (deliberate human design vs emergent behavior; test-aware vs distinguishable-from-real-use).
7. **Add the Alcala et al. 2022 replication** to row 15a; correct "weakened" to "disappeared when both versions are seen together."
8. **Housekeeping:** renumber duplicate row IDs; add FSMB/FDIC rows; cite Lin-Healy and Small properly or drop.

## Suggested Deep Research Prompts
Not needed for a new pass. Targeted checks only:
1. "Open the Sonnet 4.5 system card (Anthropic, Sept 2025) and extract the exact wording and denominator for the evaluation-awareness rate (reported as ~13%), what counts as 'overt,' and the statement on behavior after noticing a test. Also open arXiv:2509.15541 and confirm the o3 13% to 0.4% and o4-mini 8.7% to 0.3% covert-action figures and the verbalized evaluation-awareness rates."
2. "Find primary-source steelmen for four positions on 'does a reliably helpful AI need to care?': (a) functionalist or behaviorist, (b) Korsgaard or Williams-style virtue ethics on motive, (c) Strathern's statement of Goodhart's law, (d) Socrates' answer to Glaucon in *Republic* IV and IX. Give page or Stephanus references."
3. "Open OpenAI's 'Sycophancy in GPT-4o' (Apr 29, 2025) and 'Expanding on sycophancy' (May 2, 2025) and quote verbatim: the cause statement, the 'deployment evaluations' sentence, and whether an additional reward signal based on user thumbs-up/down is described."


## Resolution status (Oct 7, 2026, after this audit)
Applied: gaps 4-8 (verified-as-of date, falsification criteria, named counter-voice pointers, VW-to-model break points, Alcala replication and Newman-and-Cain correction, row renumbering, FSMB/FDIC and Lin-Healy and Small rows) in `research/brief.md`; gap 5 in the narration (Beat 6 "was the first to test these cars on real roads"); Beat 2 "Many people do" replaced by "Notice whether you do" (spoken draft v4.4, script v1.4). Open: gap 1 (OpenAI's own post unread) and gap 2 (rows 10, 15, 16, 18), neither aired.
