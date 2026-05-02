# Parallax — Editorial Playbook

> This is a living document. It accumulates production rules extracted from episode-specific learnings. Every rule here is grounded in evidence — either from revision logs, audit reports, audience analytics, or production experience. Skills in the pipeline read this document before they run.
>
> **Format:** Each rule is a pattern (what to do), an anti-pattern (what to avoid), the evidence (where we learned this), and the episode(s) that generated the insight. Rules are organized by production domain. New rules are appended at the end of each section; stale rules are marked `[RETIRED]` with a note about what replaced them.
>
> **Who reads this:** research-audit, script-audit, visual-concept, persona-eval, review-package, and the script drafting process. Each skill reads the sections relevant to its domain.
>
> **Who writes this:** publish-retro (appends evidence-backed rules after analytics validate them) and Tiger (approves candidate rules flagged by review-package, adds manual edits after rewrite sessions). review-package reads the playbook and flags candidate rules, but does not write to it. Nothing gets added without evidence and Tiger's approval.
>
> Created: April 27, 2026
> Last updated: April 30, 2026

---

## How to Use This Document

**If you're drafting a script:** Read Sections 1-4 before writing. These are the patterns that make scripts work and the anti-patterns that waste revision cycles.

**If you're running an audit skill:** Read the section relevant to your domain. Flag any violations as "Playbook: [rule ID]" in your report so Tiger can see which rules are being triggered.

**If you're running publish-retro:** After generating the retrospective report, check whether any finding is strong enough to become a new rule (see "When to Add a Rule" below).

**If you're running review-package:** When synthesizing audits, check whether recurring issues across audit lenses correspond to existing playbook rules. If an issue appears that *should* be a rule but isn't, flag it as a "Candidate Rule" in the review package for Tiger to approve.

### When to Add a Rule

A finding becomes a rule when it has:
1. **Evidence from at least one episode** (revision log, audit report, or analytics data)
2. **A clear pattern/anti-pattern pair** (not just "this was bad" but "do this instead")
3. **Relevance beyond a single episode** (applies to the channel's content type broadly, not just one specific topic)

After 3+ episodes, rules supported by multiple episodes get tagged `[VALIDATED]`. Rules contradicted by new evidence get tagged `[RETIRED]` with an explanation.

### Rule ID Format

`[domain]-[number]`: e.g., `NAR-01` (narrative), `VIS-01` (visual), `PER-01` (persona/audience), `RES-01` (research), `PROD-01` (production/technical).

### Section Stability

Section numbers (1-6) are referenced by skills in their input instructions. New sections must be appended before the Appendix — never reorder or renumber existing sections, as this would break skill references.

---

## 1. Narrative Structure

Rules about how scripts are built — story architecture, pacing, voice, and the relationship between information and tension.

### NAR-01: Organize by tension, not by logic
**Pattern:** Every beat should tighten a question. Structure the script as a sequence of escalating tensions, not a sequence of information blocks.
**Anti-pattern:** Setup → history → present → analysis → conclusion. This is essay structure. It front-loads setup and back-loads the interesting parts — but YouTube viewers decide in 3-4 minutes whether to stay.
**Evidence:** EP01 v2→v3 restructure. v2 was logic-ordered (setup → history → present → analysis → conclusion). v3 reorganized to tension-order (paradox → denial logic → China's experience → the trap → personal stakes). The restructure solved multiple problems simultaneously: the 7-minute pacing sag, the back-loaded thesis, and the abstract ending.
**Source:** EP01 REVISION_LOG, v2→v3 section.

### NAR-02: Dissolve weak beats, don't compress them
**Pattern:** When a beat isn't working, redistribute its strongest insights into other beats where they serve as evidence within a story. The information survives — it just works harder.
**Anti-pattern:** Making a weak beat shorter. A compressed lecture is still a lecture. If a beat exists only to "deliver information," it probably shouldn't be a standalone beat.
**Evidence:** EP01 v2→v3. Old Beat 4 ("What We Thought vs. What Happened") was compressed from ~350 to ~250 words in v2 but still felt like a standalone analytical section. In v3 it was dissolved entirely — its best insights (Nvidia's $5.5B write-down, Huawei's profit surge, "controls constrained scale but not capability") were redistributed into Beats 2 and 3 where they appear as evidence inside the narrative.
**Source:** EP01 REVISION_LOG, v2→v3 lessons.

### NAR-03: Signpost phrases are a symptom, not the disease
**Pattern:** If you need "Here's the problem" or "Think about what that means" to keep the viewer oriented, the structure itself is too information-dense. Fix the structure; the signposts become unnecessary.
**Anti-pattern:** Removing signpost phrases without restructuring. The phrases exist because the audience would get lost without them — removing them without fixing the underlying density makes things worse.
**Evidence:** EP01 v2 had 6+ signpost phrases ("Here's the problem," "Here's the critical difference," "Think about what that means," etc.). All removed in v3 — but only after restructuring from logic-order to tension-order made them unnecessary.
**Source:** EP01 REVISION_LOG, v2→v3 lessons.

### NAR-04: Human moments don't have to be long
**Pattern:** A single sentence anchoring an abstraction to a specific person's experience is more effective than a paragraph of data. Find 3-4 human moments per episode — they can be one sentence each.
**Anti-pattern:** All-data, no-people scripts. If an 18-minute script has zero moments where a named human being does something specific, it's a lecture.
**Evidence:** EP01 v2→v3. v2 had one human moment (Jensen/Trump negotiation) in 18 minutes. v3 added three more: (1) Taiwanese engineers in temporary desert housing (one sentence), (2) SMIC engineers running 34 lithography passes with typewriter metaphor (two sentences), (3) Morris Chang declaring "globalization is almost dead" (one quote). None are longer than two sentences. All anchor abstractions to reality.
**Source:** EP01 REVISION_LOG, v2→v3 section.

### NAR-05: End on personal stakes, not epistemological observations
**Pattern:** The closing beat should make the viewer feel *personally implicated*. Concrete, tangible, in-their-life. "Your car has 3,000 chips" > "Nobody knows how this ends."
**Anti-pattern:** Ending on abstract philosophical contemplation. "And that uncertainty... is the real story" is a professor's closing, not a storyteller's. The uncertainty is still there — it lives inside the concrete stakes.
**Evidence:** EP01 v2→v3. v2 ended: "Nobody knows how this ends. And that uncertainty... is the real story." v3 replaced with concrete personal stakes: your car's 3,000 chips, COVID shortage as preview, app incompatibility across bifurcated ecosystems. Final line is direct address to the viewer.
**Source:** EP01 REVISION_LOG, v2→v3 section.

### NAR-06: Balance bilateral conflicts by showing internal logic, not equal airtime
**Pattern:** When covering a conflict between two sides, show each side's internal logic *on its own terms* — motivations, emotional drivers, cultural context. This creates genuine balance.
**Anti-pattern:** Underdeveloping one side. If China is only a "reactive player" responding to US actions, you've created a lecture about one side with footnotes about the other. Even if the word count is roughly equal, the analytical depth isn't.
**Evidence:** EP01 v1→v2. v1 treated China as reactive. v2 expanded China coverage by ~400 words: added 卡脖子 emotional framing, ballpoint pen parable, 举国体制 mobilization concept. The key wasn't more words — it was showing China's *internal emotional and strategic logic* rather than just its policy responses.
**Source:** EP01 REVISION_LOG, v1→v2 section.

### NAR-07: Beat 3 breathing room — max 3 stories per beat
**Pattern:** When a beat covers multiple examples or stories, limit to 3 and give each breathing room (silence around the strongest moments). The strongest beats have silence after them.
**Anti-pattern:** Packing 10+ topics into a single beat. The best moments (a striking parable, a counterintuitive fact, a whiplash reversal) can't land if they're rushed through.
**Evidence:** EP01 v2→v3. Beat 3 went from ~12 topics to 3 stories told with breathing room: SMIC's 34-pass method, the Kirin relabeling, the DeepSeek whiplash. Cut material was either moved (ASML/Korea/Japan → Beat 4) or dropped (Big Fund corruption details — interesting but not narrative).
**Source:** EP01 REVISION_LOG, v2→v3 section.

### NAR-08: Labeling your structure is essay writing
**Pattern:** Story structure should be felt, not labeled. If you find yourself writing "Parallel A" / "Parallel B" or "Case Study 1" / "Case Study 2," the framing itself is the problem.
**Anti-pattern:** Named structural sections within the narration. "The first parallel..." "The second case..." These are organizational crutches that signal essay, not story.
**Evidence:** EP01 v2→v3. The "Parallel A / Parallel B" framing for COCOM vs. export controls was cut. Instead, the oil embargo flows directly into present-day chip controls — same logic, same mistake, 80 years apart — without labeling the connection.
**Source:** EP01 REVISION_LOG, v2→v3 cuts section.

### NAR-09: Decode, don't explain — narrative posture is insider, not lecturer
**Pattern:** Frame every video as revealing a hidden structure, not explaining a known topic. The viewer should feel like a co-investigator being let in on a pattern, not a student receiving a lesson. Open with contradictions, stakes, or provocations — not context. Introduce frameworks inductively (apply first, name later) rather than deductively ("Today we'll discuss game theory").
**Anti-pattern:** "Let me explain the semiconductor situation." "To understand this, we first need to cover some background." "A fab — a fabrication plant — is where chips are physically made." These are explainer moves. They position the viewer as someone who needs to be caught up, not someone about to discover something.
**Evidence:** Jiang narrative research (April 2026). Comparative analysis of Predictive History vs. standard geopolitics channels (CaspianReport, TLDR, VisualPolitik). The core difference is posture: "here's what's actually going on" vs. "here's what happened and why." Same analytical content, completely different viewer contract. EP01 v4 opens with context-setting (what a fab is) rather than the contradiction ($165B spent, problem got worse). The content is strong; the framing undersells it.
**Source:** JIANG_NARRATIVE_RESEARCH.md, EP01 v4 analysis.

### NAR-10: Stakes in the first 30 seconds, not the last beat
**Pattern:** The viewer must feel personally implicated within the first 30 seconds. Lead with why this matters to *them*, then earn the right to explain the structure. Use a stakes-shock ("$165 billion, and it made the problem worse"), a provocation ("What if I told you…"), or a framework promise ("There's a pattern nobody's talking about").
**Anti-pattern:** Building context for 3 minutes before the viewer knows why they should care. Saving "Your Chips" (personal stakes) for Beat 5 of a 5-beat script. By minute 3-4, YouTube viewers have already decided whether to stay.
**Evidence:** Jiang narrative research — opening-hook taxonomy. His 6 verified opener types all ground stakes immediately. EP01 v4's personal-stakes content is in Beat 5 (15:30+). NAR-01 partially addresses this (tension over logic), but this rule is specifically about the *first impression*.
**Source:** JIANG_NARRATIVE_RESEARCH.md opening hooks section, YouTube retention research.

### NAR-11: Name your conceptual products
**Pattern:** Coin a memorable 2-3 word name for the core analytical insight of each episode. "The Silicon Trap" is good. Build a vocabulary of named ideas viewers can carry into the next news cycle and redeploy. Define each named concept rigorously, including where it breaks down.
**Anti-pattern:** Unnamed analysis. If the viewer can't summarize your insight in 3 words to a friend, the episode hasn't produced a portable idea. Also avoid totalizing brands that carry covert ideological payloads ("Empire of Evil," "Pax Judaica").
**Evidence:** Jiang narrative research — "named conceptual products" section. Jiang's named ideas ("Iran Trap," "Strategy Matrix," "Law of Asymmetry") function like business-book branding and are the #1 shareability driver. Parallax already does this with "The Silicon Trap" — formalize it as a rule.
**Source:** JIANG_NARRATIVE_RESEARCH.md.

### NAR-12: Checkpoint beats every 3-5 minutes
**Pattern:** Every 3-5 minutes, pause and reduce the preceding section to a 2-3 line summary. Can be visual (on-screen text), verbal ("Here's where we are"), or both. Use checkpoints to flag uncertainty as well as content ("This claim rests on the drone-cost figure; if that's off by 5x, the argument changes").
**Anti-pattern:** 18-minute analytical videos with no comprehension handholds. The viewer's working memory is limited; without periodic consolidation, earlier insights get lost as new ones arrive.
**Evidence:** Jiang narrative research — "Checkpoint Beat" technique. Recurring "Keep it simple. Checkpoint." beats every 3-5 minutes across Jiang's long-form content. Rare in geopolitics content and directly transferable.
**Source:** JIANG_NARRATIVE_RESEARCH.md, technique #8.

### NAR-13: The toxin line — structural resonance, never causal proof
**Pattern:** Historical analogies are hypothesis generators ("this resembles X — if the pattern holds, watch for Y"). Always name at least one way the analogy breaks. Use: "this resembles," "structural resonance," "an under-discussed factor," "what doesn't fit the standard frame."
**Anti-pattern:** Treating analogies as conclusions ("this IS X happening again"). Naming hidden agents instead of structural incentives. Using "what they don't want you to know" or "the real reason." Making unfalsifiable totalizing claims hedged with performed humility. If more than ~10% of "decoding" claims require believing in coordinated hidden actors, restructure.
**Evidence:** Jiang narrative research — toxin analysis. Critics (Free Press, SCMP, TripleAmpersand) converge on the same diagnosis: the tip from analysis to conspiracy happens when structural resonance is presented as causal proof and when named hidden agents replace incentive analysis. This is the line Parallax must never cross.
**Source:** JIANG_NARRATIVE_RESEARCH.md section 6, Parallax content philosophy ("educated mysticism").

---

## 2. Visual Production

Rules about visual pacing, tool assignment, mode balance, and the relationship between what's seen and what's heard.

### VIS-01: Footage 50-70%, MG 20-30%, Layered 5-15%
**Pattern:** The visual mode breakdown should stay within these ranges. If MG exceeds 35%, the episode feels like a slideshow. If footage exceeds 75%, analysis feels unsupported.
**Anti-pattern:** All-MG scripts (data visualization after data visualization) or all-footage scripts (stock footage with narration over it).
**Evidence:** Channel design principle from VISUAL_LANGUAGE.md. Based on competitive analysis of Wendover, Johnny Harris, Vox, CaspianReport visual approaches.
**Source:** VISUAL_LANGUAGE.md, D37.

### VIS-02: Max 3 consecutive MG entries without a footage break
**Pattern:** After 3 motion graphics in a row, cut to footage for breathing room. The viewer's analytical attention needs a reset.
**Anti-pattern:** 4+ consecutive charts, maps, or diagrams. Even if each is individually excellent, the cumulative effect is fatigue.
**Evidence:** VISUAL_LANGUAGE.md pacing rules. Reinforced by persona-eval: Marcus (algorithm discovery) treats visual monotony as exit trigger.
**Source:** VISUAL_LANGUAGE.md, persona-eval skill.

### VIS-03: Don't write footage specs for things cameras can't capture
**Pattern:** Before writing a `[FOOTAGE:]` spec, ask: "Could a camera physically capture this?" If the answer is an abstract concept, a hypothetical scenario, or an internal process — use `[MG:]` instead.
**Anti-pattern:** `[FOOTAGE:] "supply chain interdependence"` or `[FOOTAGE:] "strategic calculus"`. These concepts don't exist as things you can film.
**Evidence:** FOOTAGE_SOURCING.md sourcability tiers. Abstract concepts are "Unsourceable" tier.
**Source:** FOOTAGE_SOURCING.md, visual-concept skill Lens 2.

### VIS-04: Claude SVG for geometric/diagrammatic, never for organic
**Pattern:** Claude SVG excels at information-rich geometric visuals: network diagrams, flow charts, framework comparisons, data callouts. Lean into these strengths.
**Anti-pattern:** Asking Claude SVG for organic illustration (people, landscapes, emotional scenes). Spatial reasoning without visual feedback causes consistent failures (misaligned bezier paths, disconnected endpoints).
**Evidence:** Session 10 testing. Engraved hand illustration — rejected. Sankey flow diagram — approved. Curved bezier paths consistently misaligned; straight lines dramatically more reliable.
**Source:** D33, D35, Session 10 insights.

### VIS-05: Straight lines over curves in SVG
**Pattern:** All flow/connection lines in Claude-generated SVG should be straight. If a direction change is needed, use a single right-angle elbow.
**Anti-pattern:** Bezier curves for supply chain flows, trade routes, or connection diagrams. Endpoints consistently misalign with node edges.
**Evidence:** EP01 supply chain illustration — 4 iterations. v1 (curved lines — failed), v3 (curves still disconnecting), v4 (straight lines — clean).
**Source:** D35, Session 10.

---

## 3. Persona & Audience

Rules about serving the five target personas and managing the tension between their needs.

### PER-01: Wei requires visual balance, not just narrative balance
**Pattern:** If every shot of China uses conflict treatment (ink → rust) while US shots use standard treatment, the visual layer says "China = danger" even if the narration is balanced. Alternate treatments or use standard for both.
**Anti-pattern:** Unconscious visual threat-coding. Applying conflict treatment to one side of a bilateral story and standard to the other.
**Evidence:** Persona-eval skill definition. Wei (Chinese diaspora viewer) is "hypersensitive to how China is visually coded."
**Source:** persona-eval SKILL.md, Wei persona definition.

### PER-02: Marcus needs visual variety every 15-20 seconds
**Pattern:** For algorithm-discovery viewers (the largest potential audience), the visual type should change every 15-20 seconds — map, then footage, then chart, then typography. Visual monotony is the #1 exit trigger.
**Anti-pattern:** Three consecutive stock footage segments. Or three consecutive data charts. Even if content is strong, visual sameness reads as "low production quality" to this persona.
**Evidence:** Persona-eval skill definition. Marcus is "the persona most affected by visual quality."
**Source:** persona-eval SKILL.md, Marcus persona definition.

### PER-03: Sofia needs framework diagrams held 12+ seconds
**Pattern:** When a FrameworkDiagram or conceptual visual carries real intellectual weight, hold it on screen for 12+ seconds. Fill the time with narration that makes the diagram richer, not repetitive.
**Anti-pattern:** Flashing a complex framework for 4-6 seconds. Sofia mentally screenshots these — if they're gone before she's absorbed them, the visual layer underperformed for her.
**Evidence:** Persona-eval skill definition. "She needs these visuals to hold on screen long enough to absorb (12+ seconds for a complex diagram). If a deep framework visual flashes by in 4 seconds, it feels wasted."
**Source:** persona-eval SKILL.md, Sofia persona definition.
**Status:** Hypothesis — needs validation from EP01 analytics (publish-retro).

### PER-04: James scrutinizes data accuracy — source attribution builds trust
**Pattern:** Data visualizations should include source attribution on screen. Bar proportions must match stated numbers exactly. If a DataChart says "78% market share," the bar must represent exactly 78%.
**Anti-pattern:** Data charts without source attribution. Approximate bar heights that don't match narrated numbers. Missing units or decimal places on axes.
**Evidence:** Persona-eval skill definition. James (tech insider) "instantly turned off by inaccurate charts or misleading comparisons. Source attribution text on data visuals builds trust; its absence erodes it."
**Source:** persona-eval SKILL.md, James persona definition.

---

## 4. Research & Brief Quality

Rules about what makes a research brief script-ready and what causes downstream problems.

### RES-01: Missing counterarguments cascade into script problems
**Pattern:** The brief must include strong counterarguments to the episode's thesis. If these are missing, the script either becomes one-sided (fails PER-01/NAR-06) or the scripter invents unverified counterarguments ({NEW} claims).
**Anti-pattern:** A brief that only argues for the thesis without presenting the strongest opposing case.
**Evidence:** research-audit skill design. Without counterarguments, script-audit catches balance issues, but by then the script needs restructuring rather than minor edits.
**Source:** research-audit SKILL.md, D30.

### RES-02: Unverified load-bearing claims are the most expensive failure mode
**Pattern:** Every claim that anchors a key beat or supports the episode thesis must be verified in the brief's claims table. Catching a wrong number in the brief costs 2 minutes; catching it in a rendered DataChart costs an hour.
**Anti-pattern:** Marking claims as "likely correct" and hoping script-audit catches them. Script-audit should verify {⚠️} and {NEW} claims, but the brief should minimize how many need checking.
**Evidence:** research-audit skill design, claim verification tag system in SCRIPT_FORMAT.md.
**Source:** D30, SCRIPT_FORMAT.md claim verification section.

---

## 5. Production & Technical

Rules about the Remotion pipeline, asset sourcing, and production workflow.

### PROD-01: CJK font failures are silent and catastrophic
**Pattern:** Always verify Noto Sans SC renders correctly before full render. Chinese text silently becomes tofu boxes (□□□) if the font isn't available on the render system.
**Anti-pattern:** Assuming fonts are installed because they worked last time. Font availability can change between systems, Docker containers, or CI environments.
**Evidence:** render-qa skill design, LESSONS.md.
**Source:** render-qa SKILL.md, LESSONS.md.

### PROD-02: Maps require network access — plan for offline rendering
**Pattern:** ChoroplethMap and RouteAnimation load TopoJSON and Mapbox tiles via network. If rendering offline (CI/CD, isolated machine), maps fail silently (blank output).
**Anti-pattern:** Rendering in an offline environment without pre-cached tiles.
**Evidence:** LESSONS.md, render-qa skill design.
**Source:** LESSONS.md, render-qa SKILL.md.

### PROD-03: Timing model — narration is the clock, not visuals
**Pattern:** Visual segments accompany narration (simultaneous), they don't follow it (sequential). Duration estimates should be based on narration word count at ~150 WPM.
**Anti-pattern:** Summing visual durations to estimate episode length. This double-counts time where narration and visuals overlap, producing estimates at ~50-60% of actual.
**Evidence:** EP01 assembly manifest. First implementation had 8.9 min (summing visuals); corrected to 13.1 min (narration as clock).
**Source:** Session 9 insights, D32.

---

## 6. Analytics & Performance

*This section is populated by publish-retro after episodes go live. Empty until EP01 analytics are available.*

### Hypotheses awaiting EP01 validation

These are not active rules — they are testable predictions derived from persona definitions and EP01 production experience. publish-retro should validate or reject each after EP01 analytics are available. If validated, promote to an active rule with a PERF-[XX] ID.

- **Hypothesis A:** FrameworkDiagrams held 12+ seconds will outperform <6 second holds in retention. Derived from: PER-03.
- **Hypothesis B:** Visual type changes every 15-20 seconds will correlate with higher retention for algorithm-discovery viewers. Derived from: PER-02.
- **Hypothesis C:** The chess/go metaphor is a channel signature — game-theory framing will consistently resonate across all 5 personas. Derived from: EP01 REVISION_LOG (chess vs. go was the structural spine that worked from v1).

---

## Appendix: Rule Lifecycle

```
CANDIDATE → ACTIVE → VALIDATED → (or) RETIRED

CANDIDATE:  Flagged during production (review-package or Tiger).
            Has evidence from 1 episode. Not yet confirmed by analytics.

ACTIVE:     Accepted into the playbook. Skills reference it.
            Has evidence from 1-2 episodes.

VALIDATED:  Confirmed by analytics data across 3+ episodes.
            publish-retro tags rules as validated when data supports them.

RETIRED:    Contradicted by new evidence. Kept in the doc (struck through)
            with a note about what replaced it and why.
```

---

## Revision History

| Date | Change | Source |
|------|--------|--------|
| April 27, 2026 | Initial playbook created. 8 NAR rules, 5 VIS rules, 4 PER rules, 2 RES rules, 3 PROD rules seeded from EP01 REVISION_LOG and skill designs. | EP01 REVISION_LOG, skill definitions, DECISIONS.md |
| April 30, 2026 | Added NAR-09 through NAR-13: narrative posture (insider/decoder), stakes-first opens, named conceptual products, checkpoint beats, toxin line. All derived from Jiang narrative research. | JIANG_NARRATIVE_RESEARCH.md |
