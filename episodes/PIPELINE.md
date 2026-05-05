# Episode Pipeline State

> Source of truth for "what episode is at what stage right now." Update this file when an episode advances or stalls. Agents read this on session start.

## Current state

| Slug | State | Format | Next action | Last touched |
|---|---|---|---|---|
| `prisoners-dilemma` | RESEARCH READY | Philosopher's Lens | Run Deep Research (3-pass) | 2026-05-04 |
| `silicon-trap` | RENDER READY | Wargamer | Source 21 stock clips, then narrate | 2026-04-28 |
| `blockades-leak` | INCUBATING | TBD | Re-run topic-viability gate | 2026-03-15 |

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

## Update protocol

When an episode changes state:
1. Update the row in the table above.
2. Update `Last touched` to today's absolute date (e.g. `2026-05-05`, not "today").
3. If the state is one a skill knows about (e.g. `RESEARCH READY` → `script-draft` runs next), the skill reads this file to find what to act on.
4. When an episode publishes, also update [`episodes/publish-order.json`](./publish-order.json) with the assigned episode number.

## Backlog (not yet promoted to state)

Topics that have passed the signal-watch gate but are still pre-`INCUBATING`. See [`project/IDEAS.md`](../project/IDEAS.md) for the full topic pipeline including `Signal Detected` entries.
