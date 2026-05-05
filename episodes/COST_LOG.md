# Cost Log

> Per-episode burn. Update after each meaningful spend (research session, asset sourcing, render batch). Aggregated by `tools/cost-tracker.py`.

## Conventions

- One row per spend event. Don't aggregate manually — the tool does that.
- `service`: `claude` | `recraft` | `pexels` | `pixabay` | `unsplash` | `mapbox` | `lambda` | `kling` | `sora` | `runway` | `other`
- `amount_usd`: actual USD spent (not credits, not tokens — converted)
- `note`: 5–15 words. What was the spend for?
- Keep the table sorted newest-first.

## Ledger

| date | episode | service | amount_usd | note |
|---|---|---|---|---|
| 2026-05-05 | (system) | other | 0.00 | cost log initialized |

## Per-episode targets (rough)

These are guideposts, not budgets. Adjust as data accumulates.

| Stage | Target | Notes |
|---|---|---|
| Research (Deep Research) | $5–15 | One-shot per episode; reusable across follow-ups |
| Script drafting (skills) | $2–8 | Iterative — auditing adds runs |
| Visual spec generation | $1–3 | Mostly cheap text ops |
| Asset sourcing | $0–$10 | Free APIs preferred; AI illustration costs |
| AI illustrations (Recraft) | $0–$5 | ~$0.04/image; 10–30 illust per episode |
| AI video (Kling/Sora/Runway) | $0–$50 | Optional; only for [AI-GEN:] segments |
| Lambda renders | $1–4 | If used; local renders are free |
| **Total per episode** | **~$10–80** | Wide range; optimize as data accumulates |

## Watching

- If a service jumps significantly week-over-week → check whether it's a new pattern or a one-off spike.
- If total per-episode trends up across 3+ episodes → revisit which stages are expanding (likely AI assets or research re-runs).
- Re-runs of Deep Research on the same topic should be rare; if frequent, the brief template needs improvement.
