---
name: review-package
description: >
  Synthesize three separate audit reports (visual-concept, script-audit, persona-eval) into a
  single prioritized review document for Tiger's 30-minute human review session. This is the
  ONLY document he needs to read before making final editorial decisions. Use this skill whenever
  the three audits have been run and someone says 'review package', 'prep for review', 'ready for
  Tiger', 'consolidate the audits', 'what do I need to read', 'review session prep', or when
  all three source audits exist and the next step is human review. This is the capstone before
  visual-spec and production.
---

# Review Package

You are synthesizing three separate audit reports into a single, prioritized review document that Tiger will read in 30 minutes during his human review session. Your job is to extract the essential findings, re-rank them by impact on viewer experience, identify cross-audit themes, and surface only the decisions Tiger actually needs to make.

## Why This Exists

The production pipeline generates three parallel audits:
- **visual-concept** (5 lenses) — feasibility, tool fit, rhythm, treatment alignment
- **script-audit** (5 lenses) — transitions, lecture patterns, human moments, pacing, claims
- **persona-eval** (5 personas) — engagement, resonance, subscribe/share potential per viewer segment

Each audit is thorough but separate. Tiger needs a single document that:
1. Tells him whether the script is ready or what needs to change
2. Merges the top issues across all three audits and re-ranks them by impact
3. Shows him cross-audit themes (e.g., a visual monotony issue that also causes pacing problems)
4. Presents the 2-3 editorial decisions only he can make
5. Is skimmable in 5 minutes and deep-readable in 15

This is not a summary of three reports. It's a reframed analysis that treats the script as a whole object and prioritizes ruthlessly.

## Context

Parallax is a solo-creator YouTube channel (Tiger, 5-10 hours/week) analyzing geopolitics through historical analogy. The visual production pipeline is constrained but robust. Editorial voice is "educated mysticism" — intellectually rigorous, narratively engaging, explicitly uncertain.

The three audits are the quality gates before visual-spec (no point in generating 40 JSON data files if the script needs major revision). This skill is the bridge between "three separate audit outputs" and "Tiger's decision to proceed or reshape."

## Inputs

**The three audit reports** (all required):
1. `visual-concept` report (from visual-concept skill)
2. `script-audit` report (from script-audit skill)
3. `persona-eval` report (from persona-eval skill)

These should already exist in the conversation context (they were run before this skill). If any are missing, note it and work with what's available.

**Episode materials** (read as needed):
- `episodes/EPXX-slug/script-vN-production.md` — the current script being reviewed
- `remotion-templates/BRAND.md` — design system (for visual-narrative alignment checks)
- `project/CONTENT_IDENTITY.md` — voice, tone, audience (for persona cross-analysis)

**Compounding knowledge files** (read before synthesizing):
- `episodes/EDITORIAL_PLAYBOOK.md` — channel-level production rules. When the three audits cite playbook rules ("Playbook: NAR-03"), note these in the review package — recurring rule violations suggest a systemic issue, not a one-off. If multiple audits independently flag a new issue that isn't in the playbook, flag it as a "Candidate Rule" for Tiger to approve for addition.
- `episodes/LEARNING_LOG.md` (if it exists) — post-publish analytics findings. Cross-reference audit findings against past performance data. If script-audit flags a pacing issue at the same structural point where retention dropped in a previous episode, that's strong converging evidence — surface it prominently.

## The Review Package Output Structure

### 1. Executive Summary (5-6 sentences)

The decision-maker's headline. Must answer three questions:
- **Is this script ready for production?** (READY / NEEDS REVISION / NEEDS RETHINK)
- **What's the single biggest issue?** (Not a list — one sentence that captures the highest-impact problem across all three audits)
- **Which audiences does it serve best / poorly?** (From persona-eval cross-cut with visual-concept findings)

Write this as if Tiger is scanning it in 30 seconds while running out the door. No hedging, no multi-clause sentences.

### 2. Visual Rhythm Map

Carry forward the compressed timeline from visual-concept audit (the sequence of template types, sources, treatments, and durations). This is reference material Tiger already saw in the visual-concept report, but repeating it here keeps everything self-contained:

```
Beat 1: [MAP 12s] [FOOTAGE 8s] [TYPOGRAPHY 4s] [FOOTAGE 6s]
Beat 2: [CHART 8s] [MAP 10s] [FRAMEWORK 6s]
...
```

Keep it brief — one line per beat or visual block. The goal is to let Tiger see the full visual texture at a glance.

### 3. Priority Fix List (Max 7 items)

This is the core of the review package. Merge the top issues from ALL THREE audits and re-rank by **impact on the viewer experience**.

The innovation: fixes that address multiple audit concerns simultaneously rank higher. A transition fix that also resolves a visual monotony issue is worth more than a visual-only fix.

For each fix item, provide:
- **Source audit** — visual-concept / script-audit / persona-eval (or "cross-audit" if multiple)
- **Location in script** — beat number, time code, or text snippet
- **The problem** — one sentence, stated from the viewer's perspective (what do they experience?)
- **Suggested fix** — actual prose rewrite or visual spec, not advice. Concrete enough that Tiger can decide "yes, do this" or "no, but here's my version"
- **Expected impact** — HIGH / MEDIUM / LOW on viewer engagement / retention / resonance

Example format:

```
### Fix 1: Cold Transition at 2:45 (Cross-audit)
**Source:** script-audit (transitions lens) + visual-concept (rhythm lens)
**Location:** Beat 5, "The embargo strangled the economy" → "Japan faced a choice"
**Problem:** Viewer experiences whiplash switching from economic impact → decision-making context. Visually, the cut goes from FOOTAGE→MAP→FOOTAGE, which feels repetitive after the same pattern in Beat 4.
**Suggested fix:**
  *Narration:* "The embargo strangled the economy. But economics alone doesn't explain what happened next. For that, we need a lens from decision-making under constraint."
  *Visual:* Keep the MAP at this moment instead of switching back to FOOTAGE. Let the map persist while narration shifts mental gears. Treat it as a moment of intellectual clarity, not a return to data.
**Expected impact:** HIGH (kills two problems at once — smoother transition, better visual rhythm)
```

**Ranking rules:**
1. Fixes that address issues in multiple audits go first
2. Within single-audit fixes, HIGH-impact fixes before MEDIUM before LOW
3. Within the same category, prioritize fixes that change narration (require Tiger's creative judgment) before fixes that are pure visual reassignment (can be delegated)
4. Never include more than 7 items — ruthless triage. If there are more than 7 issues, they probably mean "NEEDS RETHINK" verdict, not detailed item-by-item fixes

### 4. Persona-Visual Cross-Analysis (NEW section not in source audits)

This is analysis that only happens at review-package stage. For each of the 5 personas, analyze how the **visual choices** affect their engagement:

```
**Priya (geopolitics regular)** — Expects intellectual rigor. Resonates with map sequences that show structural relationships. Risk: if visuals are just illustrative background, she stops trusting the analytical layer. Current script: MAP heavy in Beat 2-4 (good), but Beat 6's emotional reflection uses generic FOOTAGE instead of a schematic showing the "stability paradox" — she'll see it as filler.

**Marcus (algorithm discovery)** — Casual viewer who clicks away if visuals feel repetitive. The visual rhythm has three FOOTAGE segments in succession in Beat 3. He'll bounce. Fix: inject a quick TYPOGRAPHY moment or CHART to vary the pattern.

**Wei (Chinese diaspora)** — Watches how China is visually framed. The CONFLICT-treatment shots in Beat 7-8 (red ramp, high-contrast imagery) read as threat/danger framing. If this is intentional, good. If it's accidental, it undermines the episode's "structural resonance" message. Check: are you saying China is inherently threatening, or is the conflict treatment meant to show geopolitical tension? The visual says one thing, narration might say another.

**James (tech insider)** — Notices when data is wrong or oversimplified. The DataChart in Beat 5 uses "semiconductor revenue share" — confirm this is accurate and properly sourced. A wrong chart kills credibility with this segment.

**Sofia (framework thinker)** — Wants visual metaphors to carry intellectual weight. The FrameworkDiagram in Beat 4 is elegant, but it's underexplained. She'll want to pause and study it. Consider: does the visual hold for 12+ seconds? Or does it need an on-screen legend? If it's too quick, it feels decorative instead of foundational.
```

Keep these brief but specific. The goal is to surface persona-specific visual tensions that weren't apparent in the individual audits.

### 5. Decision Points (2-3 items)

These are the 2-3 places where Tiger needs to make an editorial call that AI cannot make. Frame each as a trade-off, not a recommendation.

Example format:

```
**Decision Point 1: How much visual certainty can we claim about TSMC's strategy?**

**Option A — Speculative framing** (current script)
- Visual approach: Use a FrameworkDiagram showing two possible strategic pathways side-by-side
- Narration: "Japan faced two possible futures..."
- Viewer experience: Intellectual but abstract; doesn't land the "dilemma" emotionally
- Persona fit: Sofia loves it, Priya needs more evidence, James wants source attribution on-screen

**Option B — Evidence-first framing** (alternative)
- Visual approach: Lead with a route animation showing the actual supply chain (sourced data), then overlay the speculative fork
- Narration: "The actual supply chain looked like this. But TSMC could reshape it in at least two ways..."
- Viewer experience: Grounded in reality first, then opens to possibility
- Persona fit: James trusts it more, Marcus stays engaged longer, Wei sees actual complexity instead of abstraction

**Trade-off:** Option A is more conceptually elegant. Option B is less likely to be fact-checked by credentialed viewers. Which matters more for this episode?
```

2-3 items max. If there are more, the script needs rethinking, not decision points.

### 6. Verdict

One of three:

**READY FOR PRODUCTION** — The script is solid across all three audits. Any issues are minor reassignments (visual tools, pacing tweaks) that don't require reshaping narration. Proceed to visual-spec and asset sourcing immediately. List the 1-2 things that are strongest.

**NEEDS REVISION** — Specific items need fixing before visual-spec. These are:
- The Priority Fix List (items 1-7 above) that require narration changes OR visual reassignment
- The Decision Points that Tiger needs to resolve
- A concrete sense of how long revision will take (1-2 hours for narration tweaks, or deeper rethink?)

Verdict: proceed to revision, then re-validate with visual-spec before production.

**NEEDS RETHINK** — The script has structural problems that item-by-item fixes won't solve. Examples:
- Visual ambitions fundamentally mismatched to toolkit (too many unachievable concepts)
- Multiple personas strongly alienated (not just muted — alienated)
- Narrative structure doesn't support the visual layer (or vice versa)
- Pacing/rhythm issues that reshaping individual moments can't fix

Verdict: return to script drafting or narrative redesign before audit again.

## Workflow

1. **Read all three audits** — extract the verdict, key findings, and top 3-5 issues from each
2. **Map cross-audit themes** — identify issues that appear in multiple audits (these rank higher)
3. **Identify persona tensions** — synthesize persona-eval findings with visual-concept rhythm analysis
4. **Consolidate the fix list** — merge issues, rank by impact, write concrete fixes (not advice)
5. **Identify decision points** — find the 2-3 places where Tiger has a genuine trade-off to make
6. **Write the verdict** — decide READY / NEEDS REVISION / NEEDS RETHINK and justify in 2-3 sentences
7. **Produce the document** — in markdown, structured as above
8. **Format for readability** — make it scannable (big headings, bold key phrases, short paragraphs)

## Important Notes

- **This is Tiger's 30-minute read.** Every sentence must earn its place. If something appears in the source audits but doesn't affect his decision, cut it.

- **The Priority Fix List is the core.** Everything else is context. If Tiger reads only that section, he should know what to do next.

- **Fixes must be actionable and specific.** "Improve the transition" is useless. "Change 'The embargo strangled the economy' to 'The embargo strangled the economy. But economics alone doesn't explain what happened next' and swap the MAP visual in at this moment" is actionable.

- **Don't editorialize.** Your job is to synthesize the three audits, not to add a fourth opinion. If all three audits agree something is good, say so. If they disagree, show the disagreement (e.g., visual-concept says this visual moment is risky, but persona-eval says Marcus will love it).

- **Persona-visual cross-analysis is new territory.** This section doesn't exist in any of the three source audits. The goal is to ask: how do the visual choices made in visual-concept affect the persona resonance measured in persona-eval? This is where you add analytical value beyond synthesis.

- **Decision points are not recommendations.** Don't say "I think Option B is better." Show Tiger the trade-off and let him decide. The point is to surface the choice he needs to make, not to make it for him.

- **If any source audit is missing,** note it clearly at the top and work with what's available. The review package is still valuable with 2 of 3 audits, but flag the gap.

- **Verdict discipline:** Only use READY if all three audits are green (or have green verdicts with minor notes). NEEDS REVISION is the default when any audit has significant findings. NEEDS RETHINK only when multiple audits point to structural problems or when persona-eval shows alienation in core audience segments.
