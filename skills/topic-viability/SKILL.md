---
name: topic-viability
description: >
  Quick 5-question pre-research gate (structural resonance, historical parallel, decoder framing, rubric check, angle gap) that produces a VIABLE/INCUBATING/REJECT verdict with format recommendation and arc fit analysis. Takes ~5 minutes. Use whenever someone asks 'is this topic viable', 'viability check', 'should we research this', 'can this be an episode', 'check this topic', or when evaluating topic candidates for promotion from INCUBATING to VIABLE in IDEAS.md. Also trigger when someone pastes a topic idea and wants to know if it's worth pursuing. This is the cheapest kill-or-proceed gate — distinct from research-audit (which evaluates a completed research brief, not a topic idea).
---

# Topic Viability Check

You are evaluating whether a topic candidate has enough depth, structural resonance, and differentiation to justify committing Deep Research time. This is the cheapest kill-or-proceed decision in the pipeline — catching a shallow topic here saves 30+ minutes of research and potentially hours of scripting.

The viability check is deliberately fast and opinionated. It's not research — it's triage. You're looking for red flags that suggest the topic won't sustain an 18-minute analytical episode, and green flags that suggest it will.

## Before You Start

Read these files as needed:

1. **IDEAS.md** (`/project/IDEAS.md` from the project root, which is `/episodes/../project/IDEAS.md` relative to episode folders) — check where this topic sits in the pipeline, which arc it might belong to, and what's already in production. A topic that duplicates or heavily overlaps a topic already in the pipeline is a yellow flag.
2. **CONTENT_IDENTITY.md** (`/project/CONTENT_IDENTITY.md`) — the 5-test scoring rubric and 7 episode formats. You need both.
3. **CONTENT_RISK_PLAYBOOK.md** (`/project/CONTENT_RISK_PLAYBOOK.md`) — editorial red lines. Quick scan only — you're checking for obvious risks, not doing a deep editorial review.
4. **SEO_KEYWORDS.md** (`/project/SEO_KEYWORDS.md`) — keyword landscape for the relevant arc, if it exists.
5. **EDITORIAL_PLAYBOOK.md** (`/episodes/EDITORIAL_PLAYBOOK.md`) — Section 4 (Research & Brief Quality). Check if any playbook rules flag known patterns for this topic type.

You don't need to read all of these upfront. Start with the topic itself, then pull in references as questions arise.

## The 5 Questions

Work through these in order. Each one is a depth probe — if you can't answer it substantively (not vaguely), that's diagnostic.

### 1. Structural Resonance

**Question:** What hidden structure or pattern is this episode revealing?

Not "here's what happened with X" but "there's a pattern in how Y works that explains X." The structural resonance is the episode's engine — without it, you have a news summary, not a Parallax episode.

**Pass:** You can state the structural pattern in one sentence and it reframes the topic in a way an educated viewer wouldn't have considered.
**Fail:** The "pattern" is just a description of events, or it requires conspiracy logic to connect the dots.

### 2. Historical Parallel

**Question:** Can you name at least one specific historical case with the same structural mechanism?

Not "there are historical parallels" — name the case. "Venice's Murano glass monopoly has the same island-concentration logic as TSMC in Taiwan." "The 1941 oil embargo triggered the same use-it-or-lose-it dynamic as modern chip export controls."

If you can name one without research, there's likely a rich vein to mine. If you can't, the topic might lack the cross-domain depth that makes Parallax episodes distinctive.

**Pass:** You can name a specific historical case and articulate the shared structural mechanism in one sentence.
**Soft pass:** You can't name a parallel off the top of your head, but the structural pattern (from Q1) is the kind that *should* have historical precedents — it just needs research to surface them. This is an INCUBATING signal, not a REJECT. Note "historical parallel: needs research" and specify what kind of case you'd be looking for (e.g., "a prior technology denial regime with the same commons-tragedy dynamic").
**Fail:** You can only gesture at vague parallels ("empires have always done this") or need to invoke hidden actors to make the connection work.

Use web search to quickly verify the parallel exists and has academic sources. You don't need deep verification — just confirm there's something real there, not a half-remembered factoid.

**Important:** Q2 is not an absolute gate. A topic with a strong structural pattern (Q1), clear decoder framing (Q3), and a defensible angle gap (Q5) can be INCUBATING even if the historical parallel isn't yet identified — the parallel may emerge during Deep Research. But a topic with *no plausible* historical dimension (purely contemporary, no structural echoes across time) is weaker for Parallax specifically, because cross-temporal resonance is core to the channel's identity.

### 3. Decoder Framing

**Question:** What does the viewer think this story is about vs. what it's actually about?

The gap between the surface reading and the structural reading is the episode's value proposition. If the standard frame and the Parallax frame are the same, there's no decoder insight to reveal.

**Pass:** You can articulate two clearly different frames — the standard one and the structural one — and the gap between them is interesting.
**Fail:** The "hidden structure" is common knowledge, or the reframe is so forced it would feel like a stretch to viewers.

### 4. Quick Rubric

**Question:** Does this topic pass at least 3 of 5 scoring criteria on a gut check?

Apply the rubric from CONTENT_IDENTITY.md without deep research — this is a vibes check, not a formal score:

1. **Wait, what?** — Is there at least one counterintuitive finding that would stop a scroll?
2. **Arguable thesis** — Could a smart person disagree with the episode's central claim?
3. **Two-pillar test** — Does it connect at least 2 of the 3 pillars (historical analogy, philosophical framework, contemporary geopolitics)?
4. **Timely-or-timeless** — Is there search demand now OR will this topic generate views in 2 years?
5. **Compounding** — Will this episode create concepts or frameworks that future episodes can reference?

Score each pass/fail. 3/5 minimum to proceed.

### 5. Angle Gap

**Question:** What is Parallax saying about this that nobody else is?

Do a quick competitive check: search YouTube for the topic, note the top 3-5 results and their angles. What structural connection, historical parallel, or decoder framing is missing from existing coverage?

If you can't articulate the angle gap in one sentence, the topic either needs more incubation time or isn't a fit for Parallax specifically (it might be a perfectly good topic for another channel).

**Pass:** You can state in one sentence what Parallax adds that existing coverage doesn't.
**Fail:** Existing coverage already makes the structural connection, or the angle gap requires straw-manning competitors to articulate.

## Format Recommendation

After the 5 questions, recommend the best episode format from the 7-format repertoire (Detective, Dialectic, Time Collapse, Wargame, Philosopher's Lens, Translator, Advisor Briefing). One sentence on why this format fits better than the alternatives. If the topic could work as multiple formats, name the top two with a brief note on the tradeoff.

## Arc Fit

Check IDEAS.md: does this topic fit an existing arc, extend one, or seed a new one? If it fits an existing arc, note the position (what would come before/after it in the arc sequence). If it seeds a new arc, sketch the macro question in one sentence.

## Verdict

**VIABLE** — All 5 questions answered substantively. Advance to Deep Research.

**INCUBATING** — 3-4 questions answered but gaps remain. Specify which questions failed and what would need to change (a trigger event, more time, a different angle, a historical parallel surfaced by research) for the topic to become viable. If the gap is "historical parallel not yet identified," note what kind of parallel to look for — this is a common INCUBATING pattern, not a weakness. Return to monitoring.

**REJECT** — Fewer than 3 questions answered, or a fundamental structural problem (no decoder insight, no historical depth, duplicates existing coverage). Archive or demote to Signal Watch List. Be honest about why — "interesting topic, but better suited to a news channel than Parallax" is a valid rejection.

When in doubt between VIABLE and INCUBATING, choose INCUBATING. It's cheaper to wait for a topic to ripen than to commit Deep Research time and discover shallow depth at the brief stage.

## Output Format

```markdown
# VIABILITY CHECK
## Topic: [one-line description]
## Date: [today]

## Verdict: [VIABLE / INCUBATING / REJECT]
[2-3 sentences explaining the verdict.]

## The 5 Questions

### 1. Structural Resonance
[One sentence stating the pattern, or explanation of why you can't.]

### 2. Historical Parallel
[Named case + shared mechanism, or explanation of the gap.]

### 3. Decoder Framing
**Standard frame:** [what people think this is about]
**Parallax frame:** [what it's actually about]
[Assessment of the gap's strength.]

### 4. Quick Rubric
| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| Wait, what? | | |
| Arguable thesis | | |
| Two-pillar | | |
| Timely-or-timeless | | |
| Compounding | | |
| **Total** | **/5** | |

### 5. Angle Gap
**Existing coverage:** [what's already on YouTube]
**Parallax angle:** [what we add]

## Format Recommendation
[Format name] — [one-line rationale]

## Arc Fit
[Which arc, position, or new arc proposal]

## Next Steps
[If VIABLE: specific Deep Research focus areas. If INCUBATING: what to monitor for. If REJECT: why, and whether to archive or keep as signal.]
```

## Self-Check

Before delivering, verify:
- [ ] All 5 questions have substantive answers (not "probably" or "likely")
- [ ] Historical parallel names a specific case, not a vague gesture
- [ ] Decoder framing shows a real gap between standard and Parallax frame
- [ ] Rubric scores are honest gut checks, not inflated to get to 3/5
- [ ] Angle gap is based on actual competitive check, not assumption
- [ ] Verdict matches the evidence (don't say VIABLE if question 2 is blank)
- [ ] Format recommendation considers alternatives, not just the obvious choice
