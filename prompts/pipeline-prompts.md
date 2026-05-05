# Parallax — Pipeline Prompt Templates

> Copy-paste prompts that run full pipeline phases in one shot.
> Each prompt chains the relevant skills automatically. Cowork runs everything
> and only surfaces the output you need to act on.
>
> Last updated: April 26, 2026

---

## How to Use

Your production week has **5 interaction points** with Cowork. At each one, paste the relevant prompt, point it at the right file, and let it run. You'll get back a single actionable output — not intermediate reports.

```
MONDAY      → (Claude.ai: Topic Radar — no Cowork needed)
TUESDAY     → (Claude.ai: Episode Research — no Cowork needed)
WEDNESDAY   → Prompt 1: Audit the Brief
              Prompt 2: Draft + Audit the Script ← biggest prompt, runs 5 skills
THURSDAY    → Prompt 3: Post-Review Production Prep ← after your 30-min rewrite
FRIDAY      → Prompt 4: QA the Production ← after renders complete
SUNDAY      → (Publish manually)
+14 DAYS    → Prompt 5: Run the Retro
```

---

## Prompt 1: Audit the Brief

**When:** After you copy the research brief from Claude.ai into the episode folder.
**What it does:** Runs research-audit (7 lenses, claim verification, 25-point rubric).
**What you get back:** A verdict (READY / CONDITIONAL / NEEDS MORE RESEARCH) and specific gaps to fix.
**Your time:** ~10 min to review the verdict and decide whether to proceed or send back for more research.

```
I've saved the research brief for [episode-slug] at episodes/<slug>/brief.md.

Run the research-audit skill on this brief. Give me the full audit report
with verdict. If it's CONDITIONAL, tell me exactly what's missing and whether
I can work around it during scripting or need another research pass first.
```

---

## Prompt 2: Draft + Audit the Script

**When:** After the brief passes research-audit (READY or CONDITIONAL).
**What it does:** Drafts a two-column production script, then runs the full audit chain: visual-concept → script-audit → persona-eval → review-package. Five skills in sequence.
**What you get back:** The review-package output — one document with priority fixes, persona-visual cross-analysis, and decision points.
**Your time:** ~30 min to read the review package and rewrite.

```
The research brief for [episode-slug] is at episodes/<slug>/brief.md.

Here's what I need you to do, in this order:

1. Before drafting, read episodes/EDITORIAL_PLAYBOOK.md (Sections 1-4)
   and episodes/LEARNING_LOG.md (if it has entries). These contain
   production rules from past episodes — patterns to follow and
   anti-patterns to avoid. Then draft a two-column production script
   following SCRIPT_FORMAT.md. Include claim verification tags
   ({✅}/{⚠️}/{NEW}) inherited from the brief's verification table.
   Save it to episodes/<slug>/script-v1-production.md.

2. Run visual-concept on the draft. Don't show me the full report —
   just fix any NEEDS VISUAL REVISION issues directly in the script
   and note what you changed.

3. Run script-audit on the revised script. Keep the report for synthesis.

4. Run persona-eval on the same script. Keep the report for synthesis.

5. Run review-package to synthesize all three audits into a single
   review document. THIS is what I want to read.

Save the review package to episodes/<slug>/review-package.md.
Save the script to episodes/<slug>/script-v1-production.md.

I only need to see the review package and the script. Don't show me
the intermediate audit reports — fold everything into the review package.
```

### Variant: Audit an existing script (skip drafting)

```
I've written a script at episodes/<slug>/script-v[N]-production.md.

Run the full audit chain on it:
1. visual-concept (fix any obvious issues directly, note what you changed)
2. script-audit
3. persona-eval
4. review-package (synthesize all three)

Save the review package to episodes/<slug>/review-package.md.
Show me only the review package.
```

---

## Prompt 3: Post-Review Production Prep

**When:** After your 30-minute rewrite session. You've revised the script based on the review package.
**What it does:** Runs visual-concept re-validation (quick-check), generates visual-spec JSON files, generates the shot list, and produces asset sourcing commands.
**What you get back:** Re-validation verdict, JSON data files ready for Remotion, and source.py batch command to run.

```
I've finished my rewrite. The updated script is at
episodes/<slug>/script-v[N]-production.md.

Here's what I need:

1. Run visual-concept in re-validation mode (quick-check) against the
   revised script. If there's drift, tell me what to fix before proceeding.

2. If re-validation passes (ALIGNED): run visual-spec to generate all
   Remotion JSON data files. Save them to
   remotion-templates/data/episodes/<slug>/.

3. Generate the shot-list.json from the script's asset summary table.
   Save to episodes/<slug>/shot-list.json.

4. Give me the source.py batch command to run for asset sourcing.

If re-validation finds drift issues, STOP and show me what needs fixing
before generating any production files.
```

---

## Prompt 4: QA the Production

**When:** After you've run source.py and Remotion renders.
**What it does:** Runs source-feedback on the asset manifest, then render-qa on the Remotion compositions.
**What you get back:** A gap report (what didn't source + alternatives) and a QA checklist with npx remotion still commands.

```
I've run source.py and Remotion for [episode-slug]. Files are at:
- Asset manifest: episodes/<slug>/asset-manifest.json
- Shot list: episodes/<slug>/shot-list.json
- Remotion data: remotion-templates/data/episodes/<slug>/
- Assembly manifest: remotion-templates/data/episodes/<slug>/assembly-manifest.json

Run these in order:

1. source-feedback — analyze the asset manifest, identify gaps, suggest
   alternatives for anything that didn't source well.

2. render-qa — generate still-frame commands for P1 and P2 compositions,
   produce the verification checklists.

Give me one combined report: sourcing gaps first, then render QA checklist.
Tell me if any sourcing gaps are blockers that need resolution before
I record narration.
```

---

## Prompt 5: Run the Retro

**When:** 7-14 days after publishing, when YouTube analytics have stabilized.
**What it does:** Runs publish-retro against YouTube data, compares with persona-eval predictions and visual rhythm map, appends to LEARNING_LOG.md.
**What you get back:** A retrospective with prediction validation, visual effectiveness analysis, and hypotheses for the next episode.

```
[episode-slug] has been live for [N] days. Here's the YouTube Studio data:

[Paste: retention curve description, views, CTR, avg view duration,
top 10 comments, traffic sources, audience demographics — whatever
you have from YouTube Studio]

The persona-eval report is at episodes/<slug>/review-package.md
(or in a previous conversation if not saved).

The script is at episodes/<slug>/script-v[N]-production.md.

Run publish-retro. Compare the analytics against our persona predictions
and visual choices. Append the key findings to episodes/LEARNING_LOG.md.

Tell me: what did we get right, what did we get wrong, and what should
we try differently on EP[next]?
```

---

## Quick Reference: What Runs When

```
Prompt 1 (brief audit):     research-audit
                             ─────────────────────────────────
Prompt 2 (script + audit):  draft → visual-concept → script-audit
                             → persona-eval → review-package
                             ─────────────────────────────────
Prompt 3 (post-review):     visual-concept (re-validate)
                             → visual-spec → shot-list
                             ─────────────────────────────────
Prompt 4 (QA production):   source-feedback → render-qa
                             ─────────────────────────────────
Prompt 5 (retro):           publish-retro → LEARNING_LOG.md
```

**Total skills across all prompts:** 10
**Total prompts you paste per episode:** 5
**Total human interaction points:** 5 (brief review, script review, post-review check, QA check, retro review)

---

## Tips

- **Prompt 2 is the workhorse.** It runs 5 skills and produces the most important output (review package). Give it 10-15 minutes to complete.

- **You can skip Prompt 1** if you're confident in the brief. But the ~10 minutes it costs has caught real issues (missing counterarguments, unverified load-bearing claims) that would have cascaded into script problems.

- **Prompt 3 is fast** — re-validation + visual-spec takes 5-10 minutes. But if re-validation finds drift, stop and fix before generating JSON. It's cheaper to fix a script line than to regenerate 24 data files.

- **Prompt 4 can be split** — if you want to resolve sourcing gaps before rendering (source-feedback first, then render-qa after Remotion runs), just split it into two prompts.

- **Prompt 5 gets better over time.** The first retro is a baseline. By episode 3-4, the LEARNING_LOG.md starts showing real patterns. By episode 10, it's a production playbook.

- **Always start a fresh Cowork session for each prompt.** The skills need clean context to run properly — don't chain Prompt 2 and Prompt 3 in the same session after your rewrite, because the session will have stale script content in context.
