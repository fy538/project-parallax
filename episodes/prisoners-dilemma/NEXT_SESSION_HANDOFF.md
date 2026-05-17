# Prisoners Dilemma — Next Session Handoff

> Purpose: pick up immediately without re-deriving context.
>
> Last updated: 2026-05-10

---

## 1. Where things stand

### System (all green)

- **Committed:** `745a8d7` (render-hardening: schemas, BeatFlash, SegmentErrorBoundary, beat timestamps,
  full test suite) + `aa72658` (Day 1 harness cleanup: render retry, sample data fixes, dotenv, handoff doc)
- **Tests:** `./scripts/test.sh` → 535 passed / 6 skipped. TypeScript clean. Lint 0 errors.
- **Beat timestamps correct** in both manifests:
  - `prisoners-dilemma`: beat2=138.4s · beat3=270.2s · beat4=454.4s · beat5=631.2s (totalDurationSec=891.8s)
  - `silicon-trap`: beat2=112.0s · beat3=291.8s · beat4=522.0s · beat5=683.6s (totalDurationSec=812.8s)

### Episode asset state

| Category | Count | Status |
|---|---|---|
| AI-GEN clips (existing, aigen-01..17) | 17 | ✅ On disk + wired to public/ |
| AI-GEN clips (new, aigen-01b..17a) | 12 | ❌ Not yet generated |
| Morph clips (Kling/Hailuo) | 15 | ❌ None done |
| Archival stills (Nash, RAND, Reagan-Gorb) | 3 | ❌ Not yet sourced |
| FOOTAGE segments with no `src` in manifest | 25 | ❌ Waiting on assets above |
| HOLD segments (dead air placeholders) | 49 | ❌ Will fill as assets wire in |
| Remotion template data files | 36 | ✅ All present, all pass Zod |

The 17 existing clips cover the "easy" beats. The 12 new stills + 15 morphs + 3 archival stills are what fills the remaining 49 HOLDs and wires the 25 blank FOOTAGE slots.

---

## 2. Remaining asset work

### Phase A — Generate 12 new stills in ChatGPT

Open `chatgpt-prompts.md` for the episode style block and the 4 episode reference images in `assets/ep-refs/`. Generate these in the same ChatGPT conversation, one at a time, uploading prior frames where noted.

| ID | Beat | Description | Notes |
|---|---|---|---|
| `aigen-01b` | 1 | RAND office detail — paper grids + cooperate/defect tally marks on table | Upload aigen-01 as prior frame |
| `aigen-02b` | 1 | Equation rays straightening into directional beams toward sky | Upload aigen-02 as prior frame |
| `aigen-04a` | 2 | Chalkboard close-up — hand finishing PD matrix in chalk | Morph target, camera FIXED to aigen-04 |
| `aigen-04b` | 2 | Corridor end — bright doorway at terminus, figure mid-distance | Upload aigen-04 as prior frame |
| `aigen-permeation-01` | 2 | Library archive corridor, endless bookshelves, papers spilling. "2,000+ articles" as physical space | Insert G; can be still + Ken Burns if tight |
| `aigen-06b` | 3 | Grid tightened — at convergence, gridlines form a stylized table. No figures yet | See bakeoff/scene-c-prompts.md for the full 4-frame chain context |
| `aigen-11b` | 4 | Forest clearing — hunters together, stag at their feet, dawn light through canopy | Upload aigen-11 as prior frame; cooperative outcome |
| `aigen-12a` | 4 | Stone-walled alpine pasture — Swiss commons, sheep, stone shelters | Upload aigen-12 as prior frame; HERO morph midpoint |
| `aigen-14b` | 5 | Same city street, lower angle — two figures meeting at center, hands extending | Upload aigen-14 as prior frame |
| `aigen-forecast-01` | 5 | Same horizon as aigen-15 — two diplomatic figures on clifftop, walking parallel | Upload aigen-15 as prior frame |
| `aigen-16a` | 5 | Tighter — single student's notebook open to PD matrix sketch, hand mid-writing | Upload aigen-16 as prior frame |
| `aigen-17a` | 5 | Tighter — single mannequin figure at edge of channel, looking across. Conflict palette | Upload aigen-17 as prior frame |

Save each to: `episodes/prisoners-dilemma/assets/stills/aigen-{id}-{slug}.png`

### Phase B — Generate 15 morph clips (Kling / Hailuo)

Full intent descriptions are in `shot-list.json` → `morph_pairs`. Prompting rules in `visual-pipeline.md` → "Pika Prompting Rules" (same discipline applies to Kling/Hailuo).

**Kling (11 pairs) — figure-driven, camera moves:**

| From | → To | Duration | Intent |
|---|---|---|---|
| aigen-01 | aigen-01b | 6s | Dolly-in to grids |
| aigen-04a | aigen-04 | 6s | Pull-back from chalkboard to corridor |
| aigen-04 | aigen-04b | 6s | Push along corridor toward doorway |
| aigen-04b | aigen-05 | 6s | Push through doorway |
| aigen-02 | aigen-02b | 6s | Tilt up to sky-rays |
| aigen-06 | aigen-06b | 8s | Grid sharpens, table emerges |
| aigen-11 | aigen-11b | 8s | Pursuit resolves to gathering around stag |
| aigen-14 | aigen-14b | 8s | Parallel pedestrians become meeting figures |
| aigen-15 | aigen-forecast-01 | 6s | Diplomatic figures appear on cliff |
| aigen-16 | aigen-16a | 8s | Lecture wide to notebook close |
| aigen-17 | aigen-17a | 8s | Panorama wide to single mannequin at edge |

**Hailuo (4 pairs) — geometry-driven transitions:**

| From | → To | Duration | Intent |
|---|---|---|---|
| aigen-02b | aigen-03 | 8s | Rays land on aerial buildings |
| aigen-06b | aigen-07 | 6s | Figures arrive into formed table |
| aigen-12 | aigen-12a | 8s | Terraces transition to alpine pasture |
| aigen-12a | aigen-13 | 10s | **HERO MORPH** — stone walls dissolve to ocean |

Save each to: `episodes/prisoners-dilemma/assets/clips/{from}-to-{to}.mp4`
Then copy to: `remotion-templates/public/episodes/prisoners-dilemma/clips/`

### Phase C — Source 3 archival stills (Wikimedia Commons)

All three are free-use. Apply the brand LUT (ink/amber/bone treatment) before wiring.

| ID | What to find | Search terms |
|---|---|---|
| `arch-nash` | John Nash portrait photograph, 1950s | "John Nash mathematician" Wikimedia |
| `arch-rand-hq` | RAND Corporation HQ exterior, Santa Monica, ~1950s | "RAND Corporation Santa Monica" |
| `arch-reagan-gorbachev` | Reagan-Gorbachev summit, Reykjavik 1986 or INF Treaty signing 1987 | "Reykjavik Summit 1986" or "INF Treaty signing 1987" Wikimedia |

Save to: `episodes/prisoners-dilemma/assets/stills/arch-{slug}.jpg`
Copy treated version to: `remotion-templates/public/episodes/prisoners-dilemma/stills/`

### Phase D — Wire assets into manifest

After each batch of assets lands, update the 25 FOOTAGE segments that currently have no `src`:

```
data/episodes/prisoners-dilemma/assembly-manifest.json
```

Set `segment.asset.src` to `episodes/prisoners-dilemma/clips/{filename}.mp4` (or `stills/` for archival).

Also do the **Beat 2 showcase resequence**: move the Nuclear PD GameBoard from after `aigen-04` (corridor) to after `aigen-05` (doorway). Described in `visual-thread-design.md` § "Script + showcase implementation notes".

---

## 3. Execution order

1. **Phase C first** (archival) — fastest win, no generation queue, unblocks 3 FOOTAGE slots immediately
2. **Phase A** (12 new stills) — ~2–3 ChatGPT sessions of ~4 stills each, respecting the 50-prompt rolling window
3. **Phase B** (morphs) — starts as stills complete; Kling and Hailuo can run in parallel for their respective sets
4. **Phase D** (wire + resequence) — do incrementally as each asset batch lands, not all at once at the end
5. **Re-render** — once all 25 FOOTAGE slots are filled and HOLDs are eliminated

---

## 4. What "done" looks like for the next session

- All 3 archival stills sourced, treated, and wired
- At minimum, Phase A complete (12 stills generated)
- At minimum, the HERO morph chain (aigen-12 → aigen-12a → aigen-13) done — that's the single most
  important visual moment in the episode
- Manifest has no FOOTAGE segments with empty `src`
- Beat 2 resequence done
- A fresh full render exists and has been watched straight through
- A punchlist of any remaining ship-blockers (not nice-to-haves)

---

## 5. Explicit non-goals

- Do not add new Remotion templates unless the episode is literally blocked
- Do not broaden work to `silicon-trap` this session
- Do not start another system-polish sweep

---

## 6. Opening sequence next time

```bash
git log --oneline -5          # confirm both Day 1 commits are in place
./scripts/test.sh             # confirm green
```

Then:
1. Open `episodes/PIPELINE.md` — confirm `prisoners-dilemma` is still `RENDER READY`
2. Open `episodes/prisoners-dilemma/shot-list.json` — source of truth for asset IDs and morph pairs
3. Start Phase C (archival sourcing) — fastest unblock
4. Queue Phase A (ChatGPT stills) while archival downloads
