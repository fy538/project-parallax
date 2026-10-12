---
name: ground-motion
description: >
  Ground each shot's motion prompt in the ACTUAL generated still (not the script
  intent), using vision. Run AFTER stills are generated or regenerated and BEFORE
  the Hailuo / clip pass. Catches named-but-absent elements (hallucination risk),
  wrong motion verb for the pose, wrong technique for the content, and style/era
  continuity breaks between shots that cut/dissolve into each other. Use whenever
  someone says "ground the motion prompts", "check the live-still prompts against
  the stills", "do the stills match the prompts", "pre-Hailuo QA", "re-verify
  motion after regen", or after any wholesale still regeneration.
---

# Ground Motion — vision pass that ties motion prompts to the real stills

You make each shot's `live_still_motion` / `cinemagraph_motion` describe **what is
actually in the generated still**, not what the script imagined. This is the gate that
stops the failures we keep hitting:

- **Named-but-absent → hallucination.** `aigen-07` said "papers" on an empty table → the
  model would spawn papers. Anything you name that isn't in the frame gets invented in.
- **Wrong verb for the pose → warp.** `aigen-11` said figures move "slowly" over a frozen
  **sprint** → slow-motion limb warp.
- **Wrong technique for the content.** Dynamic action poses (sprint, lunge, big gesture,
  close articulated hands) are bad live-still candidates → ken-burns or cinemagraph.
- **Continuity breaks across seams.** `aigen-11 → 11b` cross-dissolve mixed modern-painterly
  hunters with ancient-faceted spearmen — two unrelated images, not one scene resolving.

`gen_motion_prompts.py` is deterministic templating with **no vision** — it can only echo
the shot-list. You are the vision step that runs upstream of it.

## When to run
After stills exist (or were regenerated) and before generating Hailuo/cinemagraph clips.
A wholesale still regen **invalidates** every motion prompt — re-run this pass then.

## Before you start, read
1. **`project/CHAINED_STILL_LESSONS.md`** — the motion doctrine: the "ground in the actual
   still" rule, the Hailuo-native prompt structure, three-tool model, organic/geometric split.
2. **`tools/ai-video/perceive.md`** — the perception schema you fill per still.
3. **`episodes/{slug}/shot-list.json`** — current `motion_technique`, `live_still_motion`,
   `cinemagraph_motion`, `hailuo_model`, and the `seams[]` (for continuity neighbours).
4. The episode **script** beat headings — 1–2 line context per shot (thread, register).

## Step 1 — Enumerate
From `shot-list.json`: list every non-retired `live-still` and `cinemagraph` shot (these
have authored motion prompts to ground). Note `ken-burns` shots too — they have no i2v
prompt, but their stills still feed continuity checks. Build the `seams[]` neighbour map.

## Step 2 — Perceive each still (vision)
For each shot, open its still in `assets/stills/` with the **Read tool** and fill the
`perceive.md` record from what is *actually visible* — features, not opinions. Pay special
attention to the ★ fields added for this pass:
- **`named_elements`** — every distinct thing in frame, literally ("two figures walking
  toward the table", "empty table", "rows of students, backs to camera"). This is the
  allow-list the motion prompt must stay inside.
- **`dynamic_action`** — true if figures are frozen mid-sprint / lunge / big gesture.
- **`style_register`** + **`era`** — for continuity.
Write all records to `episodes/{slug}/development/still-analysis.json`.

## Step 3 — Decide technique
Run `python3 tools/ai-video/motion_director.py {slug}` (consumes the perception + script
context, applies the hard gates) **or** apply its logic directly:
- `dynamic_action.present` → **ken-burns** (camera push) or **cinemagraph** (hold figures,
  animate ambient) — NOT live-still.
- a single maskable ambient element, everything else static → **cinemagraph**.
- otherwise → **live-still**.
A technique change vs the current shot-list value is a **FLAG** (Step 6), never auto-applied.

## Step 4 — Ground the motion prompt
Rewrite each `live_still_motion` / `cinemagraph_motion` so it is Hailuo-native AND grounded:
- **Name only items in `named_elements`.** Drop anything in the old prompt that the still
  doesn't contain (the "papers" fix).
- **Match the verb to the perceived pose** (mid-stride → "walk/continue"; standing →
  "shift subtly"; frozen action → hold the pose + animate only ambient).
- **Hailuo-native** (per CHAINED_STILL_LESSONS.md): lead with the camera state (lock or a
  `[Truck/Push]` Director bracket), no negative prompt, ≤~20 words, `subtle`/`slightly` on
  figure motion, **faces hold** if a close face is visible, and name the crawl-prone surface
  to freeze (floors/tiles/signage/board text). Confirm the `hailuo_model` tag
  (`I2V-01-Live` for subject motion, `I2V-01-Director` for a camera move).

## Step 5 — Continuity check across seams
For every `seams[]` pair whose technique is `cut`, `cross-dissolve`, or `match-cut`, compare
the two shots' `style_register`, `era`, and framing/light. A mismatch (e.g. faceted vs
painterly, contemporary vs ancient) is a **FLAG** with a recommended fix: which still to
regenerate, in which style/era, generated sequentially so the second inherits the first.

## Step 6 — Apply policy (auto-apply low-risk, flag the rest)

**AUTO-APPLY** (mechanical, write straight into `shot-list.json`):
- Dropping named-but-absent elements from a prompt.
- Verb-to-pose correction **within the same technique**.
- Hailuo-native reformat (remove neg-prompt remnants, camera-led, terse, freeze clause,
  faces-hold) and setting/confirming `hailuo_model`.

**FLAG — do NOT change without approval** (write to the report; apply only on approval):
- **Technique reclassification** (live-still → ken-burns / cinemagraph).
- **Continuity breaks** across a seam (style/era/framing) + regen recommendation.
- **Aesthetic**: figure count over ~6 (crowding → flat faces) or `flat-vector` where the
  thread expects `faceted`/`painterly` → recommend a regen with a **reference-image lock**.
- Any "looks fakish / off-register" subjective call.

Mirror `motion_director.py`'s gate: flagged items land in `motion-proposal.json` and are
only written when someone sets `"approved": true` (then `--apply`).

## Step 7 — Write through, regenerate, validate
- Apply the auto-fixes to `shot-list.json`.
- `python3 tools/validate_data.py --files episodes/{slug}/shot-list.json`
- `python3 tools/ai-video/gen_motion_prompts.py {slug}` (re-templates the prompt docs).

## Output — the report
Write `episodes/{slug}/development/motion-grounding-report.md`:
- **Auto-applied** table: shot · what changed (one line each).
- **Flags** table: shot · type (technique / continuity / aesthetic) · finding · recommended
  fix. Continuity and regen flags get a ready-to-paste revised ChatGPT prompt where useful.
- **Re-run reminder**: any flagged regen, once done, requires re-running this skill on those
  shots (a new still stales its prompt).

Then report to the user: N auto-applied, M flagged (by type), and the single highest-value
next action.

## What you do NOT do
- Don't generate stills or clips — you write/ground prompts and flag.
- Don't auto-change `motion_technique`, regenerate stills, or resolve continuity/aesthetic
  flags without approval.
- Don't invent motion the still can't support — when in doubt, less motion (or ken-burns).

## Promotion to an automated tool (later)
This skill uses the agent's native vision for perception. When batch scale justifies it,
promote it to `tools/ai-video/ground_motion.py`: call the Anthropic vision API per still to
emit the `perceive.md` record, reuse `motion_director.py` for the technique gate + apply
loop, and keep the same auto-apply/flag policy. The skill is the spec; the tool is the
batch/CI implementation of the same contract.
