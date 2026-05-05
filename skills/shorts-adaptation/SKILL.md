---
name: shorts-adaptation
description: >
  Extract 3-4 standalone YouTube Shorts from a full episode script, each assigned to one of 6 series (Framework in 45s, History Rhymes, Both Sides Are Wrong, What Happens Next?, The Market Says, Was I Right?). Produces complete briefs with hooks, narration (~100-150 words), Remotion template specs, and scheduling notes. Use whenever someone asks to 'make Shorts', 'extract Shorts', 'what Shorts can we pull', 'clip this for Shorts', 'vertical clips', 'TikTok clips', or when a production script is finalized and the next step is Shorts planning. Each Short must pass the standalone test — works without full episode context.
---

# Shorts Adaptation Skill

You are extracting standalone YouTube Shorts from a completed Parallax episode script. Each Short must work as a complete, self-contained piece — a viewer who has never seen the full episode should find it interesting on its own. Shorts are discovery content: they bring new viewers to the channel. They are not trailers or teasers.

## Before You Start

Read these files:

1. **The production script** (required) — the two-column format with narration and visual specs. You're mining this for moments that work as standalone 60-second clips.
2. **The angle memo** (if it exists) — the named concept and cross-domain connections often contain the best Shorts material.
3. **IDEAS.md** (`/project/IDEAS.md`) — check the Shorts series concepts at the bottom. Every Short you extract should fit into one of the six defined series.
4. **BRAND.md** (`/remotion-templates/BRAND.md`) — Shorts specs: 9:16 aspect ratio, 1080×1920px, safe areas (top 100px, sides 48px, bottom 120px).
5. **Concept registry** (`data/concepts.json`) — check if any concepts in the script are already registered. Shorts that introduce or callback registered concepts are higher value.
6. **EDITORIAL_PLAYBOOK.md** (`/episodes/EDITORIAL_PLAYBOOK.md`) — check for Shorts-related rules from post-publish retrospectives. After analytics come in, patterns will emerge here (e.g., "History Rhymes Shorts drive 3x more full-episode clickthrough than Framework Shorts" or "Shorts posted 2 days before release outperform day-of release"). Early episodes may have no Shorts rules yet.

## The Six Shorts Series

Every Short must be assigned to a series. The series create pattern recognition — regular viewers learn what to expect from each format.

### 1. Framework in 45 Seconds
**Source:** Any script beat that applies a named framework to a concrete case.
**Template:** KineticShort (definition or quote variant)
**Structure:** Name the framework (5s) → One concrete example (25s) → "This changes how you see [topic]" (10s) → Channel tag (5s)
**Example:** "The Tragedy of the Commons in 45 seconds — and why it explains export controls."

### 2. History Rhymes
**Source:** Any cross-domain connection from the script, especially historical parallels.
**Template:** KineticShort (quote variant) or SplitShort
**Structure:** Historical image/fact (10s) → "Now look at today" (5s) → Contemporary parallel (20s) → "The structural pattern is [X]" (10s) → Channel tag (5s)
**Example:** "In 1941, the US cut off Japan's oil. In 2024, the US cut off China's chips. The logic is identical — and the outcomes might be too."

### 3. Both Sides Are Wrong
**Source:** Any bilateral conflict beat where the script presents both sides' internal logic.
**Template:** SplitShort
**Structure:** Side A's argument (15s) → Side B's argument (15s) → "But here's what both sides miss" (15s) → Reframe (10s) → Channel tag (5s)
**Example:** "Hawks say controls will cripple China. Doves say controls are pointless. Both are wrong — here's the structural reason."

### 4. What Happens Next?
**Source:** Any wargame-style branching decision in the script.
**Template:** KineticShort (statistic variant)
**Structure:** "Here's the situation" (10s) → "Country X has three options" (10s) → Brief each option (20s) → "What would you do? Comment below" (10s) → Channel tag (5s)

### 5. The Market Says...
**Source:** Any prediction market data or probabilistic claim in the script.
**Template:** DataChartShort
**Structure:** "Prediction markets say [X]" (10s) → Show the data (15s) → "But here's why the market might be wrong" (20s) → Channel tag (5s)

### 6. Was I Right?
**Source:** Any claim in the script that can be checked against later data. (Deferred — only usable after the episode has been published and time has passed.)

## How to Identify Good Shorts Moments

Scan the script for these patterns:

**Strong Shorts candidates:**
- A named concept with a one-sentence definition + one concrete example → Framework Short
- A historical parallel that creates genuine surprise → History Rhymes
- A "wait, what?" number or statistic → The Market Says
- A bilateral conflict where both sides are partially right → Both Sides Are Wrong
- A concrete decision point with branching outcomes → What Happens Next?

**Weak Shorts candidates (avoid):**
- Context-heavy passages that require watching the full episode to understand
- Nuanced arguments that can't be compressed without becoming misleading
- Beats that work because of their position in the emotional arc, not their standalone content
- Claims that are hedged in the full script but would sound declarative in 60 seconds

**The standalone test:** Cover up everything in the script except the candidate passage. Does it make sense on its own? Does it have its own hook? Would a first-time viewer find it interesting? If any answer is no, it's not a Short — it's an episode moment that only works in context.

## Shorts-Light Episodes

Not every episode yields 3-4 strong Shorts. Episodes that are heavily philosophical, deeply contextual, or built around a single sustained argument may have fewer extractable moments. This is fine — forcing weak Shorts dilutes the series brands.

**If fewer than 3 candidates pass the standalone test:**
- Produce only the Shorts that genuinely work (minimum 1, ideally 2)
- Flag the episode as "Shorts-light" in the output header
- Note why the yield is low (e.g., "episode is a single sustained argument with no self-contained beats" or "context-heavy — most moments require prior beats to land")
- Suggest whether the episode's *topic* (not script moments) could generate an original Short — sometimes the best Short isn't extracted from the script but written fresh as a "teaser angle" that uses the same research but different framing

**The 2+ series constraint relaxes for Shorts-light episodes.** If an episode only yields 2 viable Shorts and both are History Rhymes, that's fine. Don't force a Framework Short that doesn't work just to hit the diversity target.

## Output Format

Produce 3-4 Shorts briefs (or fewer for Shorts-light episodes). For each:

```markdown
# SHORTS EXTRACTION
## Episode: [number and title]
## Date: [today]

---

### Short 1: [Working Title]
**Series:** [Framework in 45 Seconds / History Rhymes / Both Sides Are Wrong / What Happens Next? / The Market Says...]
**Template:** [KineticShort / DataChartShort / SplitShort] — [variant if applicable]
**Duration:** [45-60s]
**Source beat:** [Which beat in the full script this comes from]

**Hook (first 3 seconds):**
[The opening line or visual that stops the scroll. This is the most important line in the brief.]

**Script (narration text, ~100-150 words):**
[The complete narration for the Short. Must work standalone.]

**Visual spec:**
[Template-specific: what data to feed the Remotion template. Reference the JSON schema from the existing Shorts templates.]

**Concept registry:**
[Does this Short introduce or callback any registered concepts? If introducing, note for registry addition.]

**Standalone test:** [One sentence confirming this works without the full episode]

---

### Short 2: [Working Title]
...

---

## Scheduling Notes
[Suggested posting order relative to the full episode: 1-2 Shorts before release (builds anticipation), 1-2 after (captures search traffic from viewers who watched the full episode and want more)]

## Cross-promotion
[How each Short can reference the full episode — end card, pinned comment, description link — without making the Short feel like an ad]
```

## Self-Check

Before delivering, verify:
- [ ] Each Short is assigned to a defined series (not "miscellaneous")
- [ ] Each Short passes the standalone test (works without full episode context)
- [ ] Hooks are specific and provocative (not "In this Short, we'll look at...")
- [ ] Narration is 100-150 words (60 seconds at slightly faster Shorts pace)
- [ ] Visual specs reference actual Remotion template schemas (KineticShort, DataChartShort, SplitShort)
- [ ] At least 2 different series are represented (relaxed for Shorts-light episodes — see above)
- [ ] No Short requires hedging that would weaken it below "interesting standalone claim"
- [ ] Scheduling notes include both pre-release and post-release timing
