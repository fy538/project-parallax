# Visual Thread Design — Prisoners Dilemma v6

> Redesign of the AI-gen visual layer to fix the "PowerPoint with scattered postcards" problem. Replaces the 17 standalone shots with **5 connected threads + 2 atmospheric inserts** built from start+end-frame video generation.
>
> Status: design proposal. Existing 17 stills/clips remain valid as anchor frames; this design adds 12 new shots (bridges + thread extensions + atmospheric inserts) and reorders nothing in the script.
>
> Created: May 9, 2026.

---

## 1. The diagnosis

Watching the preview render exposed three structural problems in the AI-gen layer:

**Problem 1 — single-shot islands.** 12 of the 17 AI-gen shots sit alone between MG sequences with no other AI shot adjacent. The viewer's eye registers each as a one-off illustration, not a scene. The two existing pairs (aigen-06+07 in Beat 3, aigen-10+11 in Beat 4) are the only places where the AI layer breathes for more than 7 seconds.

**Problem 2 — broken thematic threads.** Three shots are clearly about the RAND building (aigen-01 office, aigen-04 corridor, aigen-05 doorway), but they're separated by 30+ seconds of unrelated MG. By the time the corridor appears in Beat 2, the viewer has lost the spatial memory of the office in Beat 1. The same fragmentation hits the cooperation arc in Beat 4 (aigen-10/11/12/13 form a tonal sequence but are scattered across 90 seconds).

**Problem 3 — long Remotion-only stretches.** Four MG runs of 25–34 seconds with no breathing room:
- Beat 2 close: 33s (Narrowing framework → 3 KT cards)
- Beat 3 mid: 25s (Cycle vs Question → 2 KT cards)
- Beat 4 mid: 34s (Stag Hunt GameBoard → Split → Iterated KT → Reframe)
- Beat 4 mid-late: 31s (Choropleth Ostrom → Ostrom vs PD → Cooperation Designed KT)
- Beat 5 mid: 33s (Falsification → Probability Gauge → Watch Signals KT)

Per the channel pacing rule (max 3 consecutive MGs), each of these is over-stuffed.

---

## 2. The strategy

Rather than re-render the existing 17 shots, **pair them with bridge shots that morph one anchor frame into the next using start+end-frame video generation** (Kling 3.0 primary, Hailuo 02 fallback).

The technique: still A is the existing anchor, still B is a new ChatGPT-generated frame in the same scene/setting/palette, and the video tool generates a 6–10s clip that morphs A → B. The result is a single continuous "shot" that contains two compositions, giving the AI layer the spatial memory it currently lacks.

This solves the postcard problem without throwing away any existing work:
- **Threads form** because two adjacent shots now share a setting and the camera "moves through" it.
- **Long MG stretches break** because a bridge shot inserted mid-stretch is short (5–6s) but feels load-bearing — it's not a one-off cut, it's the next frame of a sequence the viewer has already been tracking.
- **Cost stays modest** — 12 new ChatGPT stills + 12 new video clips ≈ $5–10 with Kling free tier.

The five threads are organized around what each section of the episode emotionally needs:

| Thread | Function | Beats | Existing shots | New shots |
|---|---|---|---|---|
| **A — The Building** | Where the model was born; the model "escapes" | 1–2 | aigen-01, 04, 05 | 01b, 04a, 04b |
| **B — The Institution** | The model conquers the world | 1 | aigen-02, 03 | 02b |
| **C — The Capture** | Reality reshapes itself to fit the model | 3 | aigen-06, 07 | 06b |
| **D — The Markets Parallel** | Black-Scholes / OPEC color thread (parallel, not continuous) | 3 | aigen-08, 09 | — |
| **E — The Cooperation Arc** | Another game was always available | 4 | aigen-10, 11, 12, 13 | 11b, 12a |
| **F — The Stakes** | Modern present-day; you're inside this | 5 | aigen-14, 15, 16, 17 | 14b, 16a, 17a |

Plus two atmospheric insert shots that don't belong to any thread but break long MG runs:

| Insert | Function | Beat |
|---|---|---|
| **G — Permeation** | "2,000+ articles" made spatial — library archive corridor | 2 |
| **H — Forecast Window** | Diplomatic figures on cliff (visual rhyme with aigen-15) | 5 |

---

## 3. Current rhythm map

Each beat below shows the existing sequence with proposed insertions in **bold**. Time estimates assume the existing 6s Hailuo durations for AI-gen and the script-spec durations for MG.

### Beat 1 — THE FAILED EXPERIMENT (~73s → ~78s)

```
01  Title (4s)                        MG
02  Standard Frame (12s)              MG
03  Can't Explain KT (4s)             MG
04  Every Negotiation KT (5s)         MG     ← 21s of MG before first AI
05  aigen-01 RAND Office (6s)         AI ←┐
05a NEW aigen-01b grids close-up (5s) AI ←┘  Thread A pair
06  Flood-Dresher GameBoard (10s)     MG
07  ARCH Nash (5s)                    ARCH
08  Nash Quote KT (5s)                MG
09  aigen-02 Equation Poster (6s)     AI ←┐
09a NEW aigen-02b rays beaming (5s)   AI ←┤  Thread B sequence
10  Model Conquers KT (5s)            MG    ← (script keeps KT here)
11  aigen-03 Aerial Complex (6s)      AI ←┘
12  Motif Beat 1 (6s)                 MG
```

Net change: +10s. Two anchor frames now have continuous follow-through (aigen-01 morphs to its detail, aigen-02 morphs through its rays into aigen-03).

### Beat 2 — HOW A FAILED MODEL CONQUERED (~80s → ~93s)

```
01  Title (2s)                        MG
02  Diffusion Chart (12s)             MG
03  ARCH RAND HQ (5s)                 ARCH
04  NEW aigen-04a chalkboard (5s)     AI ←┐
05  aigen-04 RAND Corridor (6s)       AI ←┤  Thread A continuation
06  NEW aigen-04b doorway end (5s)    AI ←┤  (4-shot mini-sequence inside the building)
07  aigen-05 Doorway Threshold (6s)   AI ←┘
08  Nuclear PD GameBoard (8s)         MG    ← script reorder: nuclear PD comes after doorway not before
09  Narrowing Framework (15s)         MG
10  NEW aigen-permeation-01 (5s)      AI ←   Insert G (atmospheric)
11  2000 Articles KT (4s)             MG
12  Something Working KT (6s)         MG
13  Checkpoint KT (8s)                MG    ← was 33s, now 23s + 5s break
```

**Script reorder needed in Beat 2**: the current script places aigen-04 (corridor) and the Nuclear PD MG between aigen-04 and aigen-05 (doorway). To form Thread A as a continuous interior journey, the Nuclear PD should land after the doorway exit ("and then it escaped the building"), not interrupt the walk through the building. This is a 1-shot rearrangement — see §6 implementation notes.

### Beat 3 — THE WRONG GAME (~94s → ~99s)

```
01  Title (2s)                        MG
02  aigen-06 Grid Landscape (6s)      AI ←┐
03  NEW aigen-06b grid+table (5s)     AI ←┤  Thread C pair (grid morphs to negotiation table)
04  aigen-07 Negotiation Room (6s)    AI ←┘
05  Trap Mechanism (10s)              MG
06  Prediction Believed KT (5s)       MG
07  WRONG GAME KT (4s)                MG
08  aigen-08 Stock Exchange (6s)      AI ←   (Thread D — color parallel, not continuous)
09  Vol Smile Chart (8s)              MG
10  Motif Beat 3 (10s)                MG
11  aigen-09 Oil Infrastructure (6s)  AI ←   (Thread D continued — palette echo aigen-08)
12  Cycle vs Question (12s)           MG
13  Wrong Game Real KT (5s)           MG
14  Beat 3 Checkpoint KT (8s)         MG
```

Net change: +5s. Thread C makes the "model creates negotiation rooms" argument visible in the cut. Thread D is a deliberately non-continuous "color thread" — the rust palette is the connection, not spatial continuity (the script's parallel between Black-Scholes and OPEC is conceptual, not architectural).

### Beat 4 — THERE WAS ALWAYS ANOTHER GAME (~95s → ~107s)

```
01  Title (2s)                        MG
02  aigen-10 Sunrise (6s)             AI ←┐
03  aigen-11 Forest Stag Hunt (6s)    AI ←┤  Thread E (existing pair)
04  Stag Hunt GameBoard (12s)         MG
05  Split PD vs Stag Hunt (10s)       MG
06  NEW aigen-11b stag aftermath (6s) AI ←   Thread E extension (breaks 34s MG run)
07  Iterated KT (6s)                  MG
08  Reframe Framework (6s)            MG
09  aigen-12 Terraced Farmland (6s)   AI ←┐
10  Choropleth Ostrom (14s)           MG    │  Thread E continues across MG block
11  NEW aigen-12a alpine commons (6s) AI ←┤  (breaks 31s MG run)
12  Ostrom vs PD Framework (12s)      MG    │
13  Cooperation Designed KT (5s)      MG    │
14  aigen-13 Ocean Vastness (6s)      AI ←┘  Thread E close (commons → boundless)
```

Net change: +12s. The 34s and 31s MG stretches both get broken. Thread E now has a clear arc: dawn → hunt → result → cultivation → mountain commons → ocean (= "limit of cooperation").

### Beat 5 — YOUR GAME (~98s → ~112s)

```
01  Title (2s)                        MG
02  aigen-14 City Street (4s)         AI ←┐
03  NEW aigen-14b street meeting (5s) AI ←┘  Thread F open (parallel paths → meeting)
04  Motif Beat 5 (8s)                 MG
05  Motif Final (10s)                 MG
06  aigen-15 Horizon (4s)             AI ←┐
07  NEW aigen-forecast-01 cliff (5s)  AI ←┘  Insert H — same horizon, with diplomatic figures
08  Falsification Framework (12s)     MG
09  Probability Gauge (14s)           MG
10  Watch Signals KT (7s)             MG    ← was 33s, now broken by Insert H above
11  aigen-16 Lecture Hall (5s)        AI ←┐
12  NEW aigen-16a notebook (5s)       AI ←┤  Thread F middle
13  ARCH Reagan-Gorbachev (6s)        ARCH ←┘ (notebook morphs to archival)
14  Evidence Establishes KT (10s)     MG
15  aigen-17 Panorama (6s)            AI ←┐
16  NEW aigen-17a single figure (5s)  AI ←┘  Thread F close (wide → single mannequin at edge)
17  Final Choice GameBoard (5s)       MG
18  End Card (4s)                     MG
```

Net change: +14s. Insert H reinforces aigen-15's symbolism by giving it human scale. Thread F now reads as "modern people inside the model" with a clear arc: parallel paths → meeting → student learning the model → archival proof of reframing → mannequin at the edge → final choice.

### Total runtime impact

Existing showcase: ~440s (~7:20).
With proposal: ~490s (~8:10).
Net: +50s. The script word count is unchanged — the added time is visual hold, which is what the over-MG'd stretches needed.

---

## 4. Thread definitions

### Thread A — The Building (Beats 1–2)

**Narrative function.** Show the RAND interior as a continuous space the model is born inside, and that it "escapes" at the end of Beat 2. Currently three disconnected interiors; proposed as a 6-shot mini-sequence the viewer walks through.

**Shot sequence:**

| Pos | Shot | Anchor | Beat | What viewer sees |
|---|---|---|---|---|
| 1 | aigen-01 | existing | 1 | Two figures at table with paper grids. Push-in. |
| 2 | **aigen-01b** | NEW | 1 | Same table, camera now on the grids themselves — tally marks of cooperate/defect rounds visible, the actual experiment. Morph from wide → grid. |
| 3 | **aigen-04a** | NEW | 2 | Chalkboard close-up, hand finishing a payoff matrix in chalk. The same handwriting style as the table grids. |
| 4 | aigen-04 | existing | 2 | Pull back to corridor, figure walking past chalkboards. Camera moves through. |
| 5 | **aigen-04b** | NEW | 2 | Corridor end — bright doorway visible at the terminus, small as a postage stamp. The figure in mid-distance. |
| 6 | aigen-05 | existing | 2 | At the doorway, light spilling. The escape moment. |

**Frame-pair morphs (Kling 3.0 start+end):**
- 01 → 01b: figures-at-table (wide) → table grids (close). Camera dollies in over 6s.
- 01b → 04a: paper grids → chalkboard grids. Match-cut on grid pattern. (Same composition logic, different surface.) Cross-dissolve, no morph needed — handle in NLE.
- 04a → 04: chalkboard close-up → corridor wide with chalkboard at left of frame. 6s pull-back.
- 04 → 04b: corridor mid-walk → corridor end with doorway visible. 6s push-forward.
- 04b → 05: doorway distant → doorway full frame. 6s push-through.

**Tool:** Kling 3.0 for all 5 morphs (figure-aware, holds vector style well). Fall back to Hailuo 02 if Kling drifts on chalkboard text.

### Thread B — The Institution (Beat 1)

**Narrative function.** The equation worship → the institutions converging. Currently one KT card sits between aigen-02 and aigen-03; the bridge shot makes the "rays of the equation reach the buildings" literal.

**Shot sequence:**

| Pos | Shot | Anchor | Beat | What viewer sees |
|---|---|---|---|---|
| 1 | aigen-02 | existing | 1 | Equation as sun radiating over silhouetted institutions (poster perspective). |
| 2 | **aigen-02b** | NEW | 1 | Camera tilts up — equation rays now beam into a sky we can see. The institutions shrink below the frame; the rays become directional. |
| 3 | (Model Conquers KT — script-required) | — | 1 | — |
| 4 | aigen-03 | existing | 1 | Aerial view of building complex with national flags as color bars. |

**Frame-pair morphs:**
- 02 → 02b: poster ground-level view → tilt-up to sky-rays. 6s. Kling.
- 02b → 03: rays-in-sky → aerial view of buildings (same rays now landing on roofs). 8s. Hailuo (atmospheric morph; Kling tends to lose roof geometry).

The KT card between 02b and 03 is acceptable because the rays from 02b "carry through" the typography moment and land on the buildings of 03. Test in NLE: if the KT breaks the visual continuity too hard, push the KT card to *after* aigen-03 and play 02 → 02b → 03 as a continuous 17s sequence.

### Thread C — The Capture (Beat 3)

**Narrative function.** The model reshapes the world → you walk into a negotiation pre-shaped by the model. Currently a hard cut from grid landscape to interior negotiation room. Proposed as one morph that uses the gridlines as the table.

**Shot sequence:**

| Pos | Shot | Anchor | Beat | What viewer sees |
|---|---|---|---|---|
| 1 | aigen-06 | existing | 3 | Grid projected on landscape, terrain reshaping. |
| 2 | **aigen-06b** | NEW | 3 | Grid intensifies and tightens. At the convergence point, a stylized table forms — the gridlines become its edges. No figures yet. |
| 3 | aigen-07 | existing | 3 | Negotiation room interior with the table from 06b, two figures arriving. |

**Frame-pair morphs:**
- 06 → 06b: grid-on-landscape → grid-with-table-emerging. 8s. Kling (geometric morph).
- 06b → 07: table-in-grid (no figures) → negotiation room with figures at table. 6s. Hailuo (better at adding figures into a static composition than Kling).

### Thread D — The Markets Parallel (Beat 3)

**Narrative function.** Black-Scholes parallel + OPEC concession share a rust/amber palette signature. Not continuous — script keeps the Vol Smile chart and Motif Beat 3 between them — but the audience reads them as kin because the palette is unified.

**No new shots.** Production discipline: in NLE, ensure the cuts in/out of aigen-08 and aigen-09 land on similar palette frames (warm rust on the inbound, ink on the outbound) so the two AI shots feel like bookends of the "markets bowed to math" beat.

### Thread E — The Cooperation Arc (Beat 4)

**Narrative function.** "Another game was always available." Currently 4 strong shots (aigen-10/11/12/13) scattered across 90s. Proposed as a 6-shot tonal arc with two extensions that also break the long MG runs.

**Shot sequence:**

| Pos | Shot | Anchor | Beat | What viewer sees |
|---|---|---|---|---|
| 1 | aigen-10 | existing | 4 | Sunrise, cooperative figures barn-raising. |
| 2 | aigen-11 | existing | 4 | Forest stag hunt — figures converging on stag, one diverging toward hare. |
| (MG block: Stag Hunt GameBoard, Split PD vs SH) | | | | |
| 3 | **aigen-11b** | NEW | 4 | Forest clearing — hunters together, stag at their feet, dawn light through canopy. The cooperative outcome. Same forest as aigen-11. |
| (MG block: Iterated KT, Reframe) | | | | |
| 4 | aigen-12 | existing | 4 | Terraced farmland, cooperative figures at irrigation channels. |
| (MG block: Choropleth Ostrom) | | | | |
| 5 | **aigen-12a** | NEW | 4 | Stone-walled alpine pasture — Swiss-style commons, sheep, stone shelters. Different commons type, complementary palette to terraces. |
| (MG block: Ostrom vs PD, Cooperation Designed KT) | | | | |
| 6 | aigen-13 | existing | 4 | Ocean vastness, no boundaries, tiny boat. The scaling limit. |

**Frame-pair morphs:**
- 10 → 11: existing — handle as cross-dissolve in NLE (different scenes, no morph needed).
- 11 → 11b: stag mid-pursuit → stag fallen, hunters around it. 8s. Kling (figure-heavy).
- 11b → 12: forest clearing → terraced farmland (cross-dissolve in NLE; the MG block sits between).
- 12 → 12a: terraced field → alpine pasture (terrain morph). 8s. Hailuo (atmospheric/landscape morph).
- 12a → 13: alpine pasture with stone walls → boundless ocean (the "scaling limit" made visual). 10s. **Hero morph of the cooperation arc.** Hailuo. The morph from contained-commons to no-boundaries IS the script's argument that Ostrom's principles fail at oceanic scale.

### Thread F — The Stakes (Beat 5)

**Narrative function.** Modern present day — you're inside the model. 4 existing shots tonally connected (modern, contemplative) but spatially scattered. Proposed as a thread with three internal pairings.

**Shot sequence:**

| Pos | Shot | Anchor | Beat | What viewer sees |
|---|---|---|---|---|
| 1 | aigen-14 | existing | 5 | City street evening, pedestrians walking parallel. |
| 2 | **aigen-14b** | NEW | 5 | Same street, camera lower — two figures meeting at center, shaking hands; others walk past. The coordination move made visible. |
| (MG block: Motif Beat 5, Motif Final) | | | | |
| 3 | aigen-15 | existing | 5 | Horizon, two landmasses, two dots. |
| 4 | **aigen-forecast-01** | NEW | 5 | Same horizon — diplomatic figures on a clifftop walking parallel along the edge. Insert H also. |
| (MG block: Falsification, Probability Gauge, Watch Signals KT) | | | | |
| 5 | aigen-16 | existing | 5 | Lecture hall, students facing chalkboard with PD matrices. |
| 6 | **aigen-16a** | NEW | 5 | Tighter — single student's notebook open to PD matrix sketch, hand mid-writing. The model being copied into a new generation. |
| 7 | ARCH Reagan-Gorbachev | existing | 5 | (Notebook morphs into archival photo via cross-dissolve.) |
| (MG block: Evidence Establishes KT) | | | | |
| 8 | aigen-17 | existing | 5 | Wide panorama, two cityscapes across game-matrix channel. |
| 9 | **aigen-17a** | NEW | 5 | Tighter — single mannequin figure at edge of channel, looking across. Same composition, micro-scale. |

**Frame-pair morphs:**
- 14 → 14b: parallel pedestrians → meeting at center. 8s. Kling (figure-driven).
- 15 → forecast-01: empty horizon → horizon with cliff figures. 6s. Kling.
- 16 → 16a: lecture hall wide → notebook close-up. 8s. Kling (zoom-in with detail emergence).
- 16a → ARCH Reagan-Gorbachev: cross-dissolve in NLE (no morph — across registers).
- 17 → 17a: panorama wide → mannequin close. 8s. Kling.

---

## 5. Atmospheric inserts (not threaded)

### Insert G — Permeation (Beat 2)

Breaks the 33s MG stretch (Narrowing → 2000 Articles → Something Working → Checkpoint).

**aigen-permeation-01.** Library archive corridor, endless rows of bookshelves in low light, bound journals visible, papers spilling from a few volumes. "2,000+ articles" rendered as physical volume. 5s. Static composition with subtle parallax push-in. Kling — but works as still + Ken Burns if budget tight.

Inserts between Narrowing Framework MG and 2000 Articles KT. The KT then "lands" the count we just felt as space.

### Insert H — Forecast Window (Beat 5)

Breaks the 33s MG stretch (Falsification → Probability Gauge → Watch Signals).

**aigen-forecast-01.** Two diplomatic figures on a clifftop overlooking the strait from aigen-15 — walking parallel to the edge, not toward each other. Reinforces aigen-15's "two landmasses" composition with human scale. 5s.

Inserts between aigen-15 and Falsification Framework MG. Doubles as the bridge inside Thread F.

---

## 6. Script + showcase implementation notes

**Beat 2 reorder.** Move the Nuclear PD GameBoard from after aigen-04 (corridor) to after aigen-05 (doorway). The narration "It applies almost nowhere" doesn't bind the Nuclear PD MG to a specific corridor moment; the MG works just as well after the "and then it escaped the building" line. This 1-position move is what allows Thread A's interior journey to flow uninterrupted from chalkboard → corridor → doorway-end → doorway-full.

**ChoroplethMap kept where it is.** The 800+ cases map needs to land mid-Beat 4, between aigen-12 (terraced) and aigen-12a (alpine) — the map "explodes outward" from the single farm to the world, then aigen-12a returns to a different specific farm. This is a natural rhythm.

**Showcase composition update.** `PrisonersDilemmaShowcase.tsx` will need:
- 12 new clip imports (aigen-01b through aigen-17a + permeation + forecast).
- Sequence updates per beat as shown in §3.
- The showcase preview will run ~50s longer (~8:10 vs ~7:20). Final episode runtime is unchanged — the AI pacing is for visual breathing, not time padding; in the assembled episode the narration will still be ~18 minutes.

**Asset folder layout.**

```
episodes/prisoners-dilemma/assets/
├── stills/
│   ├── aigen-01-rand-office.png            (existing)
│   ├── aigen-01b-grids-closeup.png         NEW
│   ├── aigen-02-equation-poster.png        (existing)
│   ├── aigen-02b-rays-beaming.png          NEW
│   ├── aigen-03-aerial-complex.png         (existing)
│   ├── aigen-04-rand-corridor.png          (existing)
│   ├── aigen-04a-chalkboard.png            NEW
│   ├── aigen-04b-corridor-doorway-end.png  NEW
│   ├── aigen-05-doorway-threshold.png      (existing)
│   ├── aigen-06-grid-landscape.png         (existing)
│   ├── aigen-06b-grid-with-table.png       NEW
│   ├── aigen-07-negotiation-room.png       (existing)
│   ├── aigen-08-stock-exchange.png         (existing)
│   ├── aigen-09-oil-infrastructure.png     (existing)
│   ├── aigen-10-sunrise-cooperative.png    (existing)
│   ├── aigen-11-forest-stag-hunt.png       (existing)
│   ├── aigen-11b-stag-aftermath.png        NEW
│   ├── aigen-12-terraced-farmland.png      (existing)
│   ├── aigen-12a-alpine-commons.png        NEW
│   ├── aigen-13-ocean-vastness.png         (existing)
│   ├── aigen-14-city-street.png            (existing)
│   ├── aigen-14b-street-meeting.png        NEW
│   ├── aigen-15-horizon-landmasses.png     (existing)
│   ├── aigen-forecast-01-cliff-figures.png NEW
│   ├── aigen-16-lecture-hall.png           (existing)
│   ├── aigen-16a-notebook-closeup.png      NEW
│   ├── aigen-17-panorama-cityscapes.png    (existing)
│   ├── aigen-17a-single-figure-edge.png    NEW
│   └── aigen-permeation-01-archive.png     NEW
└── clips/
    └── (matching .mp4 for each, including 12 new morph clips)
```

---

## 7. Production playbook

### Generate the 12 new stills (ChatGPT)

Continue in the existing ChatGPT conversation from `chatgpt-prompts.md` so style locks in. New prompt set in `chatgpt-prompts-v2.md` (see §8). Each prompt explicitly references the existing anchor frame ("same setting as Shot 4," "extension of Shot 11") to keep figures, lighting, and palette consistent.

**Anchor-frame references.** When generating each bridge frame, upload BOTH:
1. The 5 episode reference images (the original style refs from the opening prompt).
2. The specific anchor frame the bridge connects to (or the two anchors it sits between, for a 2-anchor bridge).

This is the key discipline. Without the anchor frame in the upload, ChatGPT will drift on small details (table shape, figure clothing, lighting angle) — those details break the morph because the video tool tries to interpolate between mismatched objects.

### Generate the morph clips (Kling 3.0 → Hailuo 02 fallback)

For each frame pair listed in §4, run the Kling start+end-frame workflow:

1. Upload start frame (existing or new still A).
2. Upload end frame (new still B).
3. Set duration: 6s for tight bridges, 8s for spatial morphs, 10s for the hero cooperation-arc transition (12a → 13).
4. Motion prompt: short, director-style. Examples below.
5. If Kling produces obvious morphing artifacts on figures (>2 attempts), switch to Hailuo 02 with the same frame pair.

**Motion prompts for the new clips:**

| Morph | Duration | Motion prompt |
|---|---|---|
| aigen-01 → 01b | 6s | `Slow camera dolly-in toward the table, holding on the paper grids. Figures hold position. Light steady.` |
| aigen-04a → 04 | 6s | `Slow pull-back from the chalkboard, revealing the wider corridor. Hand finishes the chalk stroke and lowers.` |
| aigen-04 → 04b | 6s | `Slow forward push along the corridor. Figure walks ahead at the same pace as the camera.` |
| aigen-04b → 05 | 6s | `Slow push-through toward the doorway, doorway grows in frame. Light from doorway intensifies.` |
| aigen-02 → 02b | 6s | `Slow tilt up. Equation rays straighten into directional beams toward the sky.` |
| aigen-02b → 03 | 8s | `Camera continues up and tilts forward into aerial view. Rays land on the building roofs.` |
| aigen-06 → 06b | 8s | `Grid lines tighten and intensify. At convergence point, table edges form from the gridlines. No figures.` |
| aigen-06b → 07 | 6s | `Camera moves into the room. Figures walk in from opposite sides and approach the table. Lighting hardens into overhead beams.` |
| aigen-11 → 11b | 8s | `Hunters slow their pursuit, gather around the stag now at their feet. Dawn light through canopy strengthens.` |
| aigen-12 → 12a | 8s | `Slow lateral drift. Terraced steps transition into stone-walled alpine pasture. Sheep emerge in distance.` |
| aigen-12a → 13 | 10s | `Slow zoom-out. Stone walls dissolve into open ocean horizon. Sheep replaced by single distant boat.` |
| aigen-14 → 14b | 8s | `Camera lowers to street level. Two pedestrians break from the parallel flow and meet at center, hands extending.` |
| aigen-15 → forecast-01 | 6s | `Two diplomatic figures appear on the cliff edge, walking in parallel along the horizon line. Water reflection holds.` |
| aigen-16 → 16a | 8s | `Slow zoom-in toward a single student's desk. Notebook opens revealing PD matrix sketch.` |
| aigen-17 → 17a | 8s | `Slow zoom-in toward the right edge of the channel. Single mannequin figure resolves at the edge, looking across.` |
| aigen-permeation-01 (single shot) | 5s | `Slow forward push down the archive corridor. Dust motes in the light. Books static.` |

**Negative prompt for all clips** (append to each):
```
-neg flicker, morphing, warping, text drift, watermark, letters changing, jitter, character feature change, palette shift, photoreal skin
```

### Cost estimate

- ChatGPT stills: 12 × ~$0 (existing subscription) = $0
- Kling 3.0 morphs: 16 × ~$0.30 (free tier first, then paid) ≈ $5
- Hailuo 02 fallback budget: 16 × ~$0.40 worst case ≈ $6
- **Total ceiling: ~$11.** Floor (free tiers): ~$0.

### Test order

Generate in this order to validate the technique before committing the full set:

1. **Thread C first** (aigen-06 → 06b → 07). Geometric morph, lowest figure-drift risk, best signal of whether Kling holds the constructivist style across morphs.
2. **Thread A** (5 shots in the building). Highest figure complexity — if this works, everything else works.
3. **Thread E hero morph** (12a → 13). The cooperative-arc finale; if the alpine-to-ocean morph lands, this single shot makes the case for the whole redesign.
4. Remaining bridges in any order.

If Thread C fails on Kling and Hailuo: the technique itself is wrong for this style, and we fall back to NLE Ken Burns + cross-dissolves between the new stills. The new stills are still useful in that fallback — they break the postcard problem even without the morph.

---

## 8. Output files

This design produces three outputs:

- **`visual-thread-design.md`** — this document.
- **`shot-list-v2.json`** — updated shot list with 12 new entries plus thread/bridge metadata for each existing shot. Replaces `shot-list.json` once approved.
- **`chatgpt-prompts-v2.md`** — addendum prompts for the 12 new stills, written to be pasted into the existing ChatGPT conversation that already has the 5 episode style refs locked in.

After approval, the showcase update (`PrisonersDilemmaShowcase.tsx`) is a separate mechanical step: import 12 new clips, splice into the sequence per §3, regenerate preview.
