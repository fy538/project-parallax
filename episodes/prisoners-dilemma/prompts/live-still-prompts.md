# Live-Still Prompts (Hailuo image-to-video)

> One image in, NO end frame. The model adds subtle subject / camera motion.
> Auto-generated from shot-list.json — do not hand-edit; change the shot list and regenerate.

**Model per shot is tagged below:**
- `I2V-01-Live` — animate the SUBJECT, camera holds. Purpose-built for flat 2D art (won't 3D-ify color blocks).
- `I2V-01-Director` — the CAMERA moves; takes bracketed commands (`[Truck left]`, `[Push in, slow]`). `Truck` = lateral slide (real parallax); prefer it over a pan.
- **Never Hailuo 02 for live-stills** — it's photoreal-trained and adds realistic texture to flat art.

**Rules (every shot):**
- **⚠ Ground the prompt in the ACTUAL still, not the script.** Open the still first; name ONLY elements visible in the frame, and match the motion verb to the figures' actual poses. Anything you name that isn't there will be hallucinated in (see CHAINED_STILL_LESSONS.md). Re-verify after any still regen. *This tool only echoes the shot-list — it cannot see the image.*
- **No negative prompt — Hailuo ignores it.** Restraint is 100% prompt language (there is no motion-intensity slider).
- **Lead with the camera state** (a lock OR a bracketed move) — that clause is your only intensity control.
- Keep it terse: ≤~20 words, ≤3 motion ideas. `subtle`/`slightly` on every figure motion.
- **Faces hold** if a close face is visible — animate hands / body / props only. Distant / back-turned figures may move freely.
- Name the crawl-prone surface to freeze (floors, tiles, signage, board text) — that's where drift shows; re-roll if it crawls.

---

## `aigen-01` — 1950s RAND research office — Flood-Dresher experiment
**Still:** `aigen-01-rand-office.png` · **~6s** · **Model:** `I2V-01-Director`

```
[Truck left, very slow]. Faces hold. Only the writing hand moves slightly; fine dust drifts in the shaft of light. Desk, papers and reels stay still.
```

---

## `aigen-02` — Institutional committee room — figures study the PD payoff matrix on an easel (the model adopted as doctrine)
**Still:** `aigen-02-institution-adoption.png` · **~6s** · **Model:** `I2V-01-Director`

```
[Push in, slow] toward the matrix. Faces hold. One standing figure's arm gestures slightly at a cell; seated figures barely shift. Warm light steady.
```

_Note: REWRITTEN May 23, 2026 from the tacky 'equation-sun over labeled buildings' poster -> a concrete boardroom-adoption scene (sophistication rules). 02b retired. Threads the real PD matrix motif with 04a + 16._

---

## `aigen-04` — RAND institutional corridor — lone figure, chalkboards
**Still:** `aigen-04-rand-corridor.png` · **~6s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. A lone figure walks away down the corridor, back to camera, natural stride. Checkerboard floor and chalkboard text stay perfectly still.
```

_Note: back-view distant walk is safe for live-still despite 'no walking' default — none of the risk drivers (face, close hands, large scale) are present. Replaces the old 04→04b push pair._

---

## `aigen-05` — Doorway threshold — escape moment
**Still:** `aigen-05-doorway-threshold.png` · **~6s** · **Model:** `I2V-01-Director`

```
[Push in, slow] through the doorway toward the bright city skyline beyond. Scene holds still; only the soft daylight shifts. Floor reflections stay still.
```

---

## `aigen-07` — Negotiation room — two figures approaching table
**Still:** `aigen-07-negotiation-room.png` · **~6s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. Faces hold. The two figures walk slowly toward the empty table from opposite sides. Table, walls and floor stay perfectly still.
```

---

## `aigen-08` — Stock exchange floor — Black-Scholes parallel
**Still:** `aigen-08-stock-exchange.png` · **~6s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. Trading-floor figures gesture subtly; screens flicker faintly. Floor and signage text stay still.
```

---

## `aigen-10` — Sunrise — cooperative figures, tone shift
**Still:** `aigen-10-sunrise-cooperative.png` · **~6s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. Figures work the timber frame with small, slow motions. Dawn light steady; ground and structure stay still.
```

---

## `aigen-11` — Forest stag hunt — converging on stag, one diverging to hare
**Still:** `aigen-11-forest-stag-hunt.png` · **~6s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. The hunters HOLD their forward-leaning, advancing poses; only the shafts of sunlight flicker and fine dust drifts between the trees. Figures, stag and forest stay still.
```

---

## `aigen-11b` — Forest clearing — hunters together, stag at their feet, dawn light through canopy. Cooperative outcome.
**Still:** `aigen-11b-stag-aftermath.png` · **~6s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. The gathered figures shift subtly; dawn light filters through the trees. Stag, ground and foliage stay still.
```

---

## `aigen-14` — City street — present day evening, parallel pedestrians
**Still:** `aigen-14-city-street.png` · **~4s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. A few distant figures walk slowly in parallel along the sidewalk; faint evening haze drifts. Buildings, pavement and light pools stay perfectly still.
```

---

## `aigen-14b` — Same street, lower angle — two figures meeting at center, hands extending. Coordination move visible.
**Still:** `aigen-14b-street-meeting.png` · **~5s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. Faces hold. Only the two central figures' hands meet in a handshake; faint haze drifts and one distant silhouette walks past. Everything else stays still.
```

---

## `aigen-forecast-01` — Same horizon — two diplomatic figures on clifftop, walking parallel along the edge. Doubles as Insert H atmospheric breathing.
**Still:** `aigen-forecast-01-cliff-figures.png` · **~5s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. The two distant figures walk slowly along the clifftop in parallel, backs to camera. Sky, sea and rock stay perfectly still.
```

---

## `aigen-16` — Lecture hall — students facing chalkboard with PD matrices
**Still:** `aigen-16-lecture-hall.png` · **~5s** · **Model:** `I2V-01-Live`

```
Static locked camera, tripod. Students shift subtly in their seats; the instructor's arm gestures slightly at the board. Board text and seats stay still.
```

---
