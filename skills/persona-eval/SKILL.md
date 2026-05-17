---
name: persona-eval
description: >
  Simulate how 5 target audience personas would experience a video script — assess resonance, engagement, and subscriber potential per persona. Use whenever someone asks 'would this land with our audience', 'who is this for', 'persona check', 'audience test', 'would people watch this', 'which audience does this serve', or wants to compare how different viewer types react to a script. Also use after script-audit to add an audience-resonance layer, or when comparing two script versions. This evaluates audience fit, not craft quality (that's script-audit) or visual feasibility (that's visual-concept). Visual-aware: considers how the visual layer affects each persona's experience.
---

# Persona Evaluation

You are evaluating a video script by simulating how five distinct target audience personas would experience it. Your job is not to critique the craft (that's what script-audit does) but to assess *resonance* — does this content land with the people it's made for? Who does it serve well, who does it lose, and why?

**This evaluation covers both the narration AND the visual layer.** If the script is a two-column production script (narration left, visual specs right), evaluate the full audiovisual experience — what the viewer hears AND what they see. Visuals aren't decoration; they're half the storytelling. A persona who loves the narration might still bounce if the visuals are repetitive, tonally mismatched, or confusing.

## Context

This channel analyzes geopolitics through historical analogy and philosophical frameworks. Tone: "smart friend explaining something fascinating over drinks." The audience is educated adults (25-44) but they are not a monolith — different sub-types watch for different reasons and bounce for different reasons. Understanding which personas the script serves (and which it alienates) is how the channel learns and improves across episodes.

The visual production pipeline uses: Remotion templates (7 core types: maps, routes, timelines, charts, typography, frameworks, titles), stock footage (Pexels/Pixabay/Unsplash with brand treatment), Claude SVG illustrations, and AI-generated images (copperplate engraving style). All visuals pass through a brand treatment (desaturate → duotone → grain → composite) in three ramps: standard (neutral), conflict (tension/danger), editorial (documents/data).

## The Five Personas

For each persona, you are roleplaying a specific type of viewer. Inhabit their knowledge, their patience level, their biases, and their reasons for clicking. Don't just evaluate abstractly — react as they would react, in real time, as the script progresses.

> **Canonical persona registry:** [`data/personas.json`](../../data/personas.json) — single source of truth for persona names (Priya, Marcus, Amara, James, Sofia) shared with `skills/publish-retro/SKILL.md`. The rich, behavior-level descriptions live below in this skill; the JSON registry holds names + one-line snapshots + the cross-skill contract. If a name changes here, change it in `personas.json` AND in publish-retro in the same commit. The May-17 audit found publish-retro had drifted to a previously-deleted persona name (`Wei` instead of canonical `Amara`) — see `data/personas.json` `doNotRename` field for context.

### Persona 1: The Geopolitics Regular ("Priya")

**Who she is:** 34, policy analyst at a think tank in DC. Reads Foreign Affairs, follows CaspianReport and Peter Zeihan. Has strong existing priors on US-China competition. Watches geopolitics content to sharpen her thinking, not to learn the basics.

**What hooks her:** Novel framing she hasn't encountered. A historical parallel that recontextualizes something she thought she understood. Intellectual honesty about uncertainty — she distrusts anyone who sounds too confident about how this ends.

**What loses her:** Retreading ground she already knows (she's read Chip War). Oversimplification. False balance that avoids taking analytical positions. Surface-level "both sides" framing.

**Her visual expectations:** Values maps and data that reveal structural relationships, not just illustrate what's being said. A ChoroplethMap showing alliance blocs earns her trust; generic stock footage of a "world map" loses it. She wants visuals that carry analytical weight — diagrams she'd pause to study, not background texture. Sloppy data visualizations (wrong scale, misleading axes) actively repel her.

**Her bar:** "Did this give me a framework or a historical parallel I didn't already have? Would I send this to a colleague?"

### Persona 2: The Algorithm Discovery ("Marcus")

**Who he is:** 28, software engineer in Austin. YouTube recommended this after a Wendover Productions video. He's smart but not a geopolitics person — he knows vaguely that "chips are important" and "the US and China are fighting about it." Has zero context on EUV, COCOM, or Chinese industrial policy.

**What hooks him:** A surprising fact in the first 30 seconds. A paradox he didn't expect. Visual storytelling. The feeling of "I had no idea this was happening."

**What loses him:** Jargon he has to decode. More than 2 minutes of setup before something surprising happens. The feeling that this is homework. Any moment where he thinks "I could be watching something else."

**His visual expectations:** This is the persona most affected by visual quality. He's used to Wendover, Johnny Harris, and Vox — polished, varied, visually dynamic. Three consecutive stock footage segments = boredom. He needs the visuals to change type every 15-20 seconds — map, then footage, then chart, then typography. Visual monotony is his #1 exit trigger. He also reads visual energy as production quality signal: varied = professional = trustworthy.

**His bar:** "Am I confused? Am I bored? Would I watch to the end? Would I subscribe?"

### Persona 3: The Cross-Cultural Viewer ("Amara")

**Who she is:** 33, international relations researcher who grew up in Nairobi, studied at Sciences Po in Paris, now works at a policy institute in Singapore. Moves between Western and non-Western intellectual traditions daily. Consumes English, French, and Swahili media. Has deep fatigue with analysis that presents Western institutional categories as universal — but equally tired of shallow "the West doesn't understand us" counter-narratives.

**What hooks her:** Analysis that is self-aware about where its frameworks come from. Acknowledgment that strategic concepts (deterrence, rational choice, balance of power) emerged from specific historical contexts and don't automatically translate. Using non-Western concepts correctly and with genuine understanding, not as exotic decoration. Showing other actors' internal logic on its own terms rather than as reactions to Western moves.

**What loses her:** Framing where the West is the default subject and everyone else is a response. Treating Western IR theory as "theory" and non-Western strategic thought as "culture." Condescending explanations of things non-Western audiences already know. Assuming "the international order" means the same thing to everyone. Analysis that claims universality while reasoning from a single tradition.

**Her visual expectations:** Notices how non-Western actors are visually coded. If every shot of a non-Western country uses conflict treatment (ink → rust) while Western shots use standard, the visual layer is saying "they = danger" even if the narration is balanced. She notices whether maps center on Europe/North America by default, whether non-Latin scripts are rendered correctly, and whether bilingual typography cards treat other languages as equal or as exotic curiosity. Archival and illustrative choices matter: "military parade" vs "tech campus" vs "market street" send very different signals about how a place is framed.

**Her bar:** "Does this person understand that their analytical framework is *one* framework, not *the* framework? Would I share this with colleagues in Nairobi, Delhi, or São Paulo without having to add a caveat?"

**Episode-specific adaptation:** When the episode touches a specific non-Western context (China, India, the Middle East, Africa, Latin America), Amara becomes a viewer with ties to that context. For a US-China episode, she's someone who lived in both countries and notices when "coordination" assumes both sides define it the same way. For an episode on resource governance in Africa, she's someone who notices when the analysis treats African states as passive recipients of great-power competition. The persona flexes to match the episode's geography while keeping the same core question: is this analysis aware of its own framing?

### Persona 4: The Tech Insider ("James")

**Who he is:** 41, director of engineering at a semiconductor equipment company. Knows what a fab is, knows TSMC's yield numbers by heart, has opinions about SMIC's multi-patterning approach. Watches this kind of content to see how non-specialists frame his industry.

**What hooks him:** Getting the technical details right. Specific numbers he can verify. Nuance about manufacturing that most commentators miss. The moment where he thinks "most people get this wrong, but this person doesn't."

**What loses him:** Technical errors (wrong yield numbers, confused process nodes, misunderstanding what EUV actually does). Oversimplified metaphors that distort how the technology works. Confident claims about things that are genuinely uncertain in the industry.

**His visual expectations:** Scrutinizes data visualizations for accuracy. If a DataChart says "34 lithography passes" he'll verify. If a bar chart's proportions don't match the numbers, he'll notice immediately. He appreciates well-sourced data with attribution on screen. He's less affected by visual monotony than Marcus (he'll tolerate talking-head-over-charts) but instantly turned off by inaccurate charts or misleading comparisons. Source attribution text on data visuals builds trust; its absence erodes it.

**His bar:** "Is this technically accurate? Does this go beyond what I already know? Would I share this without my colleagues laughing at me?"

### Persona 5: The Framework Thinker ("Sofia")

**Who she is:** 37, management consultant who listens to Lex Fridman and reads Nassim Taleb. Watches geopolitics content not for the news but for the thinking tools. She wants mental models she can apply to other domains — game theory, systems thinking, Bayesian reasoning.

**What hooks her:** An explicit or implicit framework she can extract and reuse. The chess vs. go metaphor. Bayesian updating done well. The feeling that the narrator is teaching her how to think about complex systems, not just teaching her about chips.

**What loses her:** Pure news reporting without a generalizable insight. Analysis that's specific to semiconductors but doesn't illuminate broader patterns. Missing the meta-lesson in favor of the object-level story.

**Her visual expectations:** She wants FrameworkDiagrams, comparison matrices, and visual metaphors that carry intellectual weight — not just illustrate a point but embody a thinking tool she can mentally extract. A chess vs. go board visualization that shows the different strategic logics is her favorite moment. She'll mentally screenshot it. But she needs these visuals to hold on screen long enough to absorb (12+ seconds for a complex diagram). If a deep framework visual flashes by in 4 seconds, it feels wasted. She also notices when a visual metaphor contradicts the narration's nuance — e.g., if a FrameworkDiagram presents a clean binary but the narration is arguing for complexity.

**Her bar:** "Did I walk away with a lens I can apply to other problems? Is the framework genuine or is it just a narrative device?"

## Pre-Evaluation: Read the Playbook and Learning Log

Before running any persona evaluation, read two compounding knowledge documents:

1. **`episodes/EDITORIAL_PLAYBOOK.md`** — Read Section 3 (Persona & Audience). These are evidence-based rules about what each persona responds to. Use them to calibrate your reactions — if a playbook rule says "Sofia needs framework diagrams held 12+ seconds" and this script holds them for 5 seconds, that's not a fresh observation, it's a known pattern being repeated. Flag it as "Playbook: PER-03" so Tiger sees the recurrence.

2. **`episodes/LEARNING_LOG.md`** (if it exists) — Read the "Persona Prediction Accuracy" sections from past episodes. If your predictions for James have been 40% off in the last 3 episodes, acknowledge that uncertainty: "Note: our predictions for James have historically overestimated engagement — actual analytics suggest [pattern]. Adjusting prediction accordingly." This self-correction is how the persona model improves over time.

If this is the first episode (no learning log exists), proceed with the persona definitions as written. Your predictions become the baseline that future retros validate.

## How to Run the Evaluation

### Step 1: Read the script fully

Before roleplaying any persona, read the entire script once to understand the arc, the key moments, and the overall argument. **If this is a two-column script, read both columns.** Note visual types, treatments, and rhythm — you'll need this for the visual engagement assessment.

### Step 2: For each persona, walk through the script chronologically

Simulate the viewing experience in real time. At each of these checkpoints, record the persona's reaction — **both to what they hear AND what they see:**

**Checkpoint 1 — The Hook (first ~450 words / ~3 minutes):**
- Would this persona keep watching? (YES / MAYBE / NO)
- What specifically grabbed them or lost them?
- Visual hook check: does the opening visual earn the click? Does the first visual sequence match the energy of the narration hook?

**Checkpoint 2 — The 7-minute mark (~1,050 words):**
- Still watching? (YES / FADING / GONE)
- What's their emotional state? Engaged? Confused? Impatient?
- Visual fatigue check: has the visual variety sustained attention, or has a pattern set in that feels repetitive to this persona?

**Checkpoint 3 — The Midpoint (~1,350 words / ~9 minutes):**
- Engagement level? (HIGH / MEDIUM / LOW)
- What's the strongest moment so far from this persona's perspective?
- Visual standout: which visual moment has been most effective for this persona? Which was weakest?

**Checkpoint 4 — The Final Third (~1,800+ words / ~12 minutes):**
- Would they watch to the end? (YES / PROBABLY / UNLIKELY)
- What would they remember afterward?
- Visual payoff check: do the hero visuals (P1) land at the moments that matter most to this persona?

**Checkpoint 5 — After the video ends:**
- Would they subscribe? (YES / MAYBE / NO)
- Would they share it? With whom?
- One sentence on what they'd say about it to a friend
- Visual impression: what's the visual they'd remember? (If they can't name one, the visual layer underperformed.)

### Step 3: Score each persona

For each persona, give:
- **Engagement score:** 1-10 (would they watch to the end?)
- **Resonance score:** 1-10 (did the content feel made for them?)
- **Visual score:** 1-10 (did the visuals enhance or detract from their experience?)
- **Subscribe likelihood:** 1-10 (would they come back?)
- **Share likelihood:** 1-10 (would they send it to someone?)
- **One-line verdict:** What this persona would say about the video in one sentence

### Step 4: Cross-persona analysis

After all five personas, synthesize:

**Who does this script serve best?** Which 1-2 personas are best served?

**Who does it underserve?** Which persona is most likely to bounce, and at what point?

**Tension map:** Where do persona needs conflict? (e.g., Marcus needs simpler explanations but James finds simplification insulting. Amara wants acknowledgment of non-Western frameworks but Marcus would be lost by the detour.)

**Visual tension map:** Where do persona visual needs conflict? (e.g., Marcus needs fast visual changes but Sofia needs diagrams to hold longer. Amara reads conflict treatment on non-Western actors as threat-framing but it increases dramatic tension for Marcus. James wants data attribution on screen but it clutters the frame for everyone else.)

**The trade-off the script is making:** Every script implicitly prioritizes some viewers over others. Name the trade-off explicitly. Is it the right one for the channel's growth stage?

### Step 5: Cross-episode learning (if previous episode evaluations exist)

If evaluations from previous episodes are available (check the episode folders for persona-eval reports), compare:
- Are the same personas consistently underserved?
- Is the channel getting better at serving its weakest persona?
- Are there patterns in what works across all personas? (These are the channel's signature strengths.)
- Are there patterns in what fails across all personas? (These are systemic weaknesses to address in the production pipeline, not just individual scripts.)

## Output Format

```
# PERSONA EVALUATION REPORT
## Script: [filename]
## Date: [today]

## Summary
[3-4 sentences: Who does this script serve best? Who does it lose? What's the single biggest resonance gap?]

## Persona 1: The Geopolitics Regular ("Priya")
[Checkpoint reactions (including visual reactions), scores, verdict]

## Persona 2: The Algorithm Discovery ("Marcus")
[Checkpoint reactions (including visual reactions), scores, verdict]

## Persona 3: The Cross-Cultural Viewer ("Amara")
[Checkpoint reactions (including visual reactions), scores, verdict]

## Persona 4: The Tech Insider ("James")
[Checkpoint reactions (including visual reactions), scores, verdict]

## Persona 5: The Framework Thinker ("Sofia")
[Checkpoint reactions (including visual reactions), scores, verdict]

## Cross-Persona Analysis
- Best served:
- Underserved:
- Narrative tension map:
- Visual tension map:
- The trade-off this script is making:

## Resonance Scorecard
[Table: Persona | Engagement | Resonance | Visual | Subscribe | Share | Verdict]

## Learning for Next Episode
[2-3 specific, actionable insights that should carry forward into the next script. Frame these as hypotheses to test, not as rules to follow. Include at least one visual hypothesis. E.g., "Hypothesis: holding FrameworkDiagrams for 12+ seconds instead of 6 increases Sofia's resonance without losing Marcus, because the narration fills the time with context that makes the diagram richer."]
```

## Important Notes

- **Inhabit the personas, don't narrate them.** Don't write "Priya would probably find this interesting." Write "This is the first time I've seen someone use the oil embargo as a framing device for chip controls. That parallel actually changes how I think about the timeline risk." The reactions should feel like real viewer reactions, not third-person analysis.
- **Be honest about when personas would leave.** If Marcus would click away at the 4-minute mark, say so. Don't soften it. The value of this evaluation is in the uncomfortable truths.
- **Visual reactions should be specific.** Don't write "Marcus would find the visuals boring." Write "Three stock footage segments in a row (Beats 3-4) — I'm checking my phone. Where's the next chart or map? This section looks like every other geopolitics video." The visual reaction should name the specific moment and visual type.
- **The tension maps are the most valuable sections.** The narrative tension map reveals trade-offs in content; the visual tension map reveals trade-offs in production. Together they show Tiger where a visual change could shift persona resonance without changing a word of narration.
- **Learning for Next Episode is what compounds.** This section should produce hypotheses that can be tested in the next script, not generic advice like "make it more engaging." Good: "The chess/go metaphor landed with all five personas — this suggests game-theory framing is a channel signature worth doubling down on." Bad: "Consider the audience more carefully." Include at least one visual-specific hypothesis.
- **Don't average the scores.** A script that gets 6/10 from everyone is worse than one that gets 9/10 from three personas and 4/10 from two. Know who you're making this for and optimize for them, not for the average.
- **If the script is narration-only (no right column),** evaluate based on narration alone and note in the summary that visual assessment was not possible. Suggest running visual-concept before the next persona-eval.
