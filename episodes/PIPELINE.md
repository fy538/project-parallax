# Episode Pipeline State

> Source of truth for "what episode is at what stage right now." Update this file when an episode advances or stalls. Agents read this on session start.

## Current state

| Slug | State | Days in state | Format | Next action | Blocked on | Target publish | Artifacts |
|---|---|---|---|---|---|---|---|
| `prisoners-dilemma` | RESEARCHING | 2 | Philosopher's Lens | Complete Pass 2 + Pass 3 (research-bridge output ready) | — | 2026-05-18 | [dir](prisoners-dilemma/) |
| `silicon-trap` | RENDER READY | 8 | Wargamer | Source 21 stock clips, then narrate | Stock footage not yet sourced | 2026-05-25 | [dir](silicon-trap/) |
| `blockades-leak` | INCUBATING | 52 | TBD | Re-run topic-viability gate | Low historical depth on v1 research | — | [dir](blockades-leak/) |

## Session start (2 min)

Run this at the top of every work session before opening any episode files:

1. **Read the current state table** — which episodes are blocked, and what's blocking them?
2. **Flag stalls** — any episode with `Days in state` > 7 that isn't `BLOCKED` needs a decision: advance it, formally block it, or demote it.
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

**Canonical outputs** use the plain filename. **Draft/versioned outputs** use a version suffix. When a gate passes, rename the accepted version to the canonical name.

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

**Rule:** skills that read prior outputs (review-package reading script-audit, etc.) should always open the canonical filename, not a versioned file. If the canonical file is missing, that's a signal the gate hasn't been formally accepted yet.

---

## Backlog (not yet promoted to state)

Topics that have passed the signal-watch gate but are still pre-`INCUBATING`. See [`project/IDEAS.md`](../project/IDEAS.md) for the full topic pipeline including `Signal Detected` entries.
