# Episode Pipeline State

> Source of truth for "what episode is at what stage right now." Update this file when an episode advances or stalls. Agents read this on session start.

## Current state

| Slug | State | Days in state | Format | Next action | Blocked on | Target publish | Artifacts |
|---|---|---|---|---|---|---|---|
| `prisoners-dilemma` | DRAFTING | 0 | Philosopher's Lens | Run visual-spec skill on script-v5-production.md | — | 2026-05-18 | [dir](prisoners-dilemma/) |
| `silicon-trap` | BLOCKED | 0 | Wargamer | Source 21 stock clips via source.py batch, then narrate | Stock footage not yet sourced | 2026-05-25 | [dir](silicon-trap/) |
| `blockades-leak` | REVISING | 0 | TBD | Deepen research (passes 2+3) — all downstream artifacts contingent on improved research | Research depth insufficient — v1 brief too thin to support script quality | — | [dir](blockades-leak/) |

## Session start (2 min)

Run this at the top of every work session before opening any episode files:

1. **Run the pipeline validator** — catches stale state, missing artifacts, and blocker inconsistencies before you read anything else:
   ```
   python3 tools/pipeline_validator.py
   ```
   Fix any ✗ errors before proceeding. Address ⚠ warnings if they affect today's work.
2. **Read the current state table** — which episodes are blocked, and what's blocking them?
3. **Pick one episode** to advance this session. Don't context-switch mid-session.
4. **Open the episode directory** (Artifacts link) and read the most recent skill output to reload context.

If a new topic idea arrived since the last session, run `topic-viability` on it before adding it to the table — don't promote to INCUBATING without a gate verdict.

---

## Lifecycle states

States flow left-to-right through the production pipeline (see [`project/PRODUCTION_PIPELINE.md`](../project/PRODUCTION_PIPELINE.md) for the full stage map).

| State | What it means | Entry gate | Exit gate |
|---|---|---|---|
| `INCUBATING` | Topic identified; not yet committed | Signal detected, ≥3-point signal test | `topic-viability` returns VIABLE |
| `VIABLE` | Cleared viability gate; ready to research | `topic-viability` VIABLE | Deep Research scheduled |
| `RESEARCHING` | Deep Research in progress | Research kicked off | All 3 passes complete |
| `RESEARCH READY` | Brief complete; ready to draft | `research-audit` passes | Angle picked + script-draft scheduled |
| `DRAFTING` | Script in progress | `script-draft` started | Script complete + `script-audit` passes |
| `RENDER READY` | Script + visual spec done; data files generated | `visual-spec` complete + manifest generated | All clips rendered + assembled |
| `IN POST` | Renders done; narration + NLE assembly | All clips rendered | Final master + thumbnail finalized |
| `PUBLISHED` | Live on YouTube | Master uploaded + scheduled | — |
| `RETROED` | `publish-retro` complete; `LEARNING_LOG.md` updated | 7-14 days post-publish | — |

### Failure states

When a gate rejects an episode, use one of these states instead of leaving it in the current forward state.

| State | What it means | Recovery action |
|---|---|---|
| `BLOCKED` | Cannot advance — external dependency unresolved | Record reason in "Blocked on" column; revisit on next session |
| `REVISING` | Returned from a failed gate | Note the gate that failed and the required fix in "Blocked on"; re-run gate after fix |

**Common failure paths:**
- `research-audit` returns NEEDS MORE RESEARCH → revert to `RESEARCHING`, blocked on specific gaps cited in audit
- `visual-concept` escalates a P1 gap back to script → revert to `DRAFTING`, blocked on script reshaping required
- `source-feedback` flags a P1 hero visual as unavailable → stays `RENDER READY`, blocked on visual replacement decision

## Update protocol

**Starting a new episode:** Copy `episodes/EPISODE_TEMPLATE/` to `episodes/<slug>/` (or run `/new-episode <slug>`). Do this before any other work — the template contains all canonical artifact stubs and the gate checklist.

When an episode changes state:
1. Update the `State` column.
2. Reset `Days in state` to 0 (it's a manual approximation — update it when you touch the file).
3. Update `Blocked on` to `—` if the blocker is resolved, or to the new blocker reason if one exists.
4. Update `Target publish` if the schedule has shifted.
5. If the state is one a skill knows about (e.g. `RESEARCH READY` → `script-draft` runs next), the skill reads this file to find what to act on.
6. When an episode publishes, also update [`episodes/publish-order.json`](./publish-order.json) with the assigned episode number.

**When a gate fails:** Change state to `REVISING` or `BLOCKED`, record the reason in `Blocked on`, and note the date. Don't leave an episode in its current forward state with a silent blocker.

## File naming convention

**One canonical name per stage output. Always.**

The canonical filename is the machine-readable, skill-readable truth. When a gate passes, the accepted version **overwrites** — it does not accumulate alongside prior drafts.

**Canonical outputs** use the plain filename. **Draft/versioned outputs** use a version suffix and exist only while the gate is still open. The moment a gate passes: rename the latest draft to the canonical name. You may keep an older versioned file *only if it represents a materially different approach* (different angle, different structure) — not as an iteration record. Pure iteration drafts (`v2 → v3 → v4`) should be deleted once `v4` becomes canonical.

| Artifact | Canonical name | Versioned drafts |
|---|---|---|
| Research brief | `brief.md` | — (final combined; per-pass files are separate artifacts below) |
| Research passes | `research-pass1.md`, `research-pass2.md`, `research-pass3.md` | — (each is its own artifact; keep if materially different from brief.md) |
| Research bridge | `research-bridge-output.md` | — (single output per pass pair) |
| Viability check | `viability.md` | — (one per topic; rewrite in place if re-run) |
| Script | `script-production.md` | `script-v2-production.md`, `script-v3-production.md`, etc. |
| Angle memo | `angle-memo.md` | — (rewrite in place) |
| Persona eval | `persona-eval.md` | `persona-eval-v2.md`, etc. (keep prior versions if substantially different) |
| Script audit | `script-audit.md` | `script-audit-v2.md`, etc. |
| Visual concept | `visual-concept-audit.md` | `visual-concept-v2.md`, etc. |
| Review package | `review-package.md` | `review-package-v2.md`, etc. |
| Visual spec | `visual-spec.md` | — (regenerate from script; don't version) |
| Visual QA | `visual-qa.md` | — (regenerate per render; don't version) |
| Revision log | `REVISION_LOG.md` | — (append-only; never versioned) |

**Rules:**
1. Skills that read prior outputs (review-package reading script-audit, etc.) always open the **canonical filename**, not a versioned file. If canonical is missing, the gate has not been formally accepted yet.
2. `pipeline_validator.py` reports naming drift as a warning when only versioned copies exist. Run `python3 tools/pipeline_validator.py --fix` to auto-promote the latest versioned file to canonical. Review the rename before committing — the tool does not delete intermediates.
3. **Do not rename to canonical while actively revising.** The canonical name signals "gate passed." Keep the versioned suffix until the gate run is complete.

---

## Backlog (not yet promoted to state)

Topics that have passed the signal-watch gate but are still pre-`INCUBATING`. See [`project/IDEAS.md`](../project/IDEAS.md) for the full topic pipeline including `Signal Detected` entries.
