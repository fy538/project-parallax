---
name: shorts-adaptation
description: >
  Produce standalone YouTube Shorts from a completed Parallax episode, each assigned to one of 6 series (Framework in 45s, History Rhymes, Both Sides Are Wrong, What Happens Next?, The Market Says, Was I Right?). Two-phase flow: (1) consume design-time `[SHORTS-BEAT: <series>]` tags placed at outlining time (the primary candidates — 2 per episode by default), (2) post-hoc auto-extract 1-2 additional Shorts where the long-form yields them. Produces complete briefs with hooks, narration (~100-150 words), Remotion template specs, and scheduling notes. Use whenever someone asks to 'make Shorts', 'extract Shorts', 'what Shorts can we pull', 'clip this for Shorts', 'vertical clips', 'TikTok clips', or when a production script is finalized and the next step is Shorts planning. Each Short must pass the standalone test AND the hedge-strip self-check.
---

# Shorts Adaptation Skill

You are producing standalone YouTube Shorts from a completed Parallax episode. Each Short must work as a complete, self-contained piece — a viewer who has never seen the full episode should find it interesting on its own. Shorts are discovery content: they bring new viewers to the channel. They are not trailers or teasers.

**Two-phase flow (May 2026):** Shorts are now engineered at outlining time, not extracted post-hoc. The `angle-memo` skill identifies 2 design-time Shorts beats per episode; the script writer tags those beats with `[SHORTS-BEAT: <series>]` in the production script. This skill's job is to (1) consume those tags as primary candidates and (2) auto-extract 1-2 additional Shorts only where the long-form yields them. The reverse order — auto-extraction first, then maybe tags — was the pre-May flow and tended to strip the bounded-analogy hedges that make Parallax defensible.

## Before You Start

Read these files:

1. **The production script** (required) — the two-column format with narration and visual specs. **Scan first for `[SHORTS-BEAT: <series>]` tags** — these are the design-time-engineered Shorts beats and are your Phase 1 primary candidates. Then scan the rest for Phase 2 auto-extraction candidates.
2. **The angle memo** (if it exists) — the "Shorts Beats (Design-Time)" section is where the script writer originally specified the tagged beats. Read this BEFORE the script so you know what the design-time intent was — claim, bounded clause, frame-1 visual — even if the script-side `standalone:` parameter is more compressed. Cross-domain connections in the angle memo also seed Phase 2 auto-extraction candidates.
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

## Phase 1: Consume `[SHORTS-BEAT:]` tags (primary path)

Before scanning the script for anything, search for `[SHORTS-BEAT:]` tags. These are the design-time-engineered Shorts beats — the script writer has already done the editorial work of identifying which beats stand alone, picked the series, and (usually) drafted the standalone claim. Your job is to validate, expand to a full ~100-150 word narration, spec the visual, and emit the brief.

**Tag grammar** (from `project/SCRIPT_FORMAT.md`):

```
[SHORTS-BEAT: <series>; standalone:"<one-line claim>"]
```

Six valid series slugs (kebab-case): `framework-in-45s`, `history-rhymes`, `both-sides-wrong`, `what-happens-next`, `the-market-says`, `was-i-right`.

**For each tagged beat, do these in order:**

1. **Locate the source beat.** The tag lives on a cell inside a beat's two-column table. The narration cells immediately before AND after the tag are usually the editorial material the Short builds from — the `standalone:` parameter is the hook line, but the bounded-clause + supporting argument live in the surrounding narration.

2. **Run the hedge-strip self-check** (load-bearing — see § "Hedge-Strip Self-Check" below). If the standalone claim wouldn't survive Twitter-level scrutiny against the long-form, propose a tighter rewrite *before* drafting the full brief. Don't silently rephrase — surface the change.

3. **Draft the full ~100-150 word narration.** The `standalone:` line is the opening hook (frame-1 + first 1-2 seconds). The bounded clause from the surrounding narration carries the "where it breaks" half. Pad with one concrete example or one specific number drawn from the source beat — never invent new material the long-form doesn't support.

4. **Spec the visual.** Default to the template the source beat already uses, adapted to the Shorts variant (`KineticShort`, `DataChartShort`, `SplitShort`, etc.). The frame-1 visual should be readable at sound-off.

5. **Emit the brief** in the output format below. The brief's `Source beat` line cites the tag's line number so the next person can trace it back.

**Authoring expectation:** every Parallax episode ships with 2 tagged beats by default (angle-memo Phase 2 carries this). If the script you're processing has fewer tags, flag it — the script writer either skipped the tagging step or the episode is structurally Shorts-light (see § Shorts-Light Episodes below).

## Phase 2: Auto-extract 1-2 additional Shorts (secondary path)

After the tagged beats are processed, scan the remaining script for any additional beats that pass the standalone test AND the hedge-strip self-check. Target 1-2 additional Shorts; never more than 4 total per episode (2 tagged + 2 extracted = the practical ceiling for solo production capacity).

**This phase is OPT-OUT, not required.** If the remaining script doesn't yield candidates that genuinely stand alone, ship only the tagged beats. Forcing weak extracted Shorts dilutes the series brands AND blurs the design-time/extracted distinction that makes the tagged beats reliable.

**Auto-extraction priority order** (when multiple candidates compete):
1. Beats that introduce a *named concept* the registry doesn't already cover (high callback value)
2. Beats with a *standalone-test-passing number or statistic* (strong Shorts hook material)
3. Beats with a *historical parallel that creates genuine surprise* (History Rhymes candidate)
4. Beats that contain a *both-sides-are-wrong* observation already framed as such in the script

Skip:
- Beats that work because of their *position in the emotional arc*, not standalone content
- Beats whose hedge is in a different paragraph than the claim (compressing them would strip the hedge)
- Beats already adjacent to a tagged beat (you'd be repeating material the design-time Short already covers)

## Hedge-Strip Self-Check (load-bearing)

The Parallax editorial register is the bounded-analogy form — *"useful here, misleading there, dangerous if overextended."* Every Short must keep the bounded clause INSIDE the 45-60s window, in the same Short, not in the long-form it links to.

**For each Short (both tagged and extracted), ask:**

> *If this Short's claim were challenged on Twitter, would the long-form defend it as worded?*

If no, rewrite the standalone claim until yes. The failure modes:

- **Numeric overreach.** Replacing the long-form's careful equilibrium prediction ("predicted mutual defection") with a folksy compression ("predicted zero") — strips precision a critic will catch.
- **Mechanism misstatement.** Locating the difference between two frameworks where the long-form doesn't (saying PD vs Stag Hunt is about "can-you-talk" when the long-form locates it in equilibrium multiplicity).
- **Hedge displacement.** Putting the bounded clause AFTER the Short's CTA tail ("watch the full essay for the caveats"). The bounded clause must land WITHIN the 45-60s narrative, not as a footnote.
- **Register inflation.** Compressing a hedged scenario into a declarative prediction — turns Parallax into Whatifalthist/Jiang.

If a tagged beat's `standalone:` parameter fails this check, propose a tighter rewrite in the brief AND update the script tag in the production file so the next render pulls the corrected version.

## How to Identify Good Shorts Moments (Phase 2 reference)

When auto-extracting (Phase 2 only), scan the script for these patterns:

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

**The hedge-strip test:** Even when the standalone test passes, run the hedge-strip self-check above. A beat can be technically standalone but still fail the editorial register check — e.g., a one-sentence prediction the long-form actually delivers with three caveats. Passing both tests is the bar for Phase 2 auto-extracted Shorts.

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
**Origin:** [`design-time-tagged` (Phase 1) | `auto-extracted` (Phase 2)] — cite the `[SHORTS-BEAT:]` tag line number if tagged
**Template:** [KineticShort / DataChartShort / SplitShort] — [variant if applicable]
**Duration:** [45-60s]
**Source beat:** [Which beat in the full script this comes from]

**Hook (first 3 seconds):**
[The opening line or visual that stops the scroll. This is the most important line in the brief. For tagged beats, this is usually the `standalone:` parameter from the tag — possibly tightened during the hedge-strip review.]

**Script (narration text, ~100-150 words):**
[The complete narration for the Short. Must work standalone. The bounded clause MUST land inside this narration, not in the CTA tail.]

**Visual spec:**
[Template-specific: what data to feed the Remotion template. Reference the JSON schema from the existing Shorts templates. Frame-1 must be readable at sound-off.]

**Concept registry:**
[Does this Short introduce or callback any registered concepts? If introducing, note for registry addition.]

**Standalone test:** [One sentence confirming this works without the full episode]
**Hedge-strip self-check:** [Would the long-form defend this claim as worded? If you tightened the wording during review, note the original → corrected here.]

---

### Short 2: [Working Title]
...

---

## Scheduling Notes
[Suggested posting order relative to the full episode: 1-2 Shorts before release (builds anticipation), 1-2 after (captures search traffic from viewers who watched the full episode and want more)]

## Cross-promotion
[How each Short can reference the full episode — end card, pinned comment, description link — without making the Short feel like an ad]
```

## Rendering the Shorts

This skill produces the per-Short concept doc + a machine-readable `episodes/<slug>/shorts-manifest.json` (one entry per Short, naming the template, data file path, and 9:16 layout overrides). Once Tiger approves the concepts, the actual MP4 files are rendered by the shipped npm script:

```
cd remotion-templates && npm run shorts -- --episode=<slug>
```

That command (`remotion-templates/scripts/render-shorts.mjs`, shipped May 14, 2026) reads `episodes/<slug>/shorts-manifest.json` and renders every Short to `out/shorts/<slug>/`. Each Short is one MP4 at 1080×1920 (9:16), 30fps, ready for YouTube Shorts upload.

The 9 Shorts templates in `src/templates/Shorts/` (KineticShort, DataChartShort, SplitShort, FrameworkDiagramShort, ChoroplethMapShort, ProbabilityGaugeShort, SplitCompositionShort, StatRevealShort, TimelineComparisonShort) each have a Shorts-specific Zod schema and `useVerticalLayout()` hook that adapts spacing for the vertical aspect. Don't try to use the 16:9 templates directly — the Shorts variants exist because layout doesn't crop cleanly.

Write `shorts-manifest.json` in the same conversation as the per-Short concepts so the render handoff is one step.

## Self-Check

Before delivering, verify:

**Process:**
- [ ] Phase 1 ran first — script scanned for `[SHORTS-BEAT:]` tags before any auto-extraction
- [ ] Every tagged beat in the script appears as a brief in the output (or is explicitly explained why it was dropped)
- [ ] Auto-extracted Shorts (Phase 2) are clearly labeled as `auto-extracted` in the brief metadata so the design-time / extracted distinction stays visible

**Editorial:**
- [ ] Each Short is assigned to a defined series (not "miscellaneous")
- [ ] Each Short passes the standalone test (works without full episode context)
- [ ] Each Short passes the hedge-strip self-check ("would the long-form defend this claim as worded?") — propose tighter rewrites where it fails
- [ ] The bounded clause lands INSIDE the 45-60s narrative, not in the CTA tail or "watch the full essay for caveats"
- [ ] Hooks are specific and provocative (not "In this Short, we'll look at...")
- [ ] Narration is 100-150 words (60 seconds at slightly faster Shorts pace)

**Production:**
- [ ] Visual specs reference actual Remotion template schemas (KineticShort, DataChartShort, SplitShort, etc.)
- [ ] Frame-1 visual is readable at sound-off (no Shorts hook depends on hearing the first line)
- [ ] At least 2 different series are represented across the Shorts batch (relaxed for Shorts-light episodes — see above)
- [ ] No Short requires hedging that would weaken it below "interesting standalone claim"
- [ ] Scheduling notes include both pre-release and post-release timing
- [ ] If any tagged beat's `standalone:` parameter was tightened during the hedge-strip review, the corresponding production-script tag has been updated (so the design-time intent stays correct for future renders)
