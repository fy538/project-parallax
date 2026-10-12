# Visual Spec — Prisoners' Dilemma
*"The Wrong Game: How a Failed Model Conquered the World"*

> **Status:** Retroactive planning document (May 21, 2026). All 50 data files and the assembly manifest are already built. This document captures the visual logic, register decisions, and thread design behind those files for institutional memory and pre-render QA reference.
>
> Episode duration: **893.8s (~14.9 min)** · **121 segments** · 50 template data files
> Beats: 5 · data files per template family below.
>
> **⚠ Revised 2026-05-24 — morphs dropped for ep1.** Written (May 21) when chained morphs were the plan. Ep1 now uses single-still motion only — live-still (Hailuo i2v) or ken-burns — with **cut / cross-dissolve** seams (see `project/CHAINED_STILL_LESSONS.md` and the canonical `shot-list.json`). Below, read "morph" as "cross-dissolve or cut"; `aigen-02b` and `aigen-04b` are **retired**.

---

## 1. Editorial premise

This episode makes one argument: the Prisoner's Dilemma is a useful analytic lens *and* a historically dangerous one — not because it's wrong, but because it was applied where its own assumptions don't hold. The visual layer must make both sides of that bounded analogy legible.

**Visual strategy:** Build the world the model created (Beats 1–3 as rising, analytical, slightly sinister) and then dismantle it (Beats 4–5 as expansive, tonal, hopeful). The MG layer carries the analytical load; the AI footage layer carries the emotional temperature. The episode should feel like waking from a very elegant trap.

---

## 2. Three-register balance

Per `project/VISUAL_LANGUAGE.md`: every episode targets ~45% Analytical / ~30% Atmospheric / ~25% Grounding.

| Register | Templates used | Beat concentration |
|---|---|---|
| **Analytical** | GameBoard, FrameworkDiagram, ArcDiagram, DataChart, TimeSeriesChart, SplitComposition, ProportionalSymbolMap, ProbabilityGauge, AnnotatedImage | Beats 1–3 heavy; Beats 4–5 taper |
| **Atmospheric** | HOLD + AI footage (aigen-* live-stills + ken-burns) | All beats; heavier in 4–5 |
| **Grounding** | KineticTypography, TitleTransition, ARCH archival footage | Scattered anchors per beat |

**Register arc by beat:**

| Beat | Dominant register | Notes |
|---|---|---|
| Beat 1 — THE FAILED EXPERIMENT | Atmospheric → Analytical | Opens with AI footage (RAND interior); analytical emerges with GameBoard |
| Beat 2 — HOW IT CONQUERED | Analytical | ArcDiagram (lineage) + DataChart (diffusion) + FrameworkDiagram (narrowing conditions) |
| Beat 3 — THE WRONG GAME | Analytical + Atmospheric | GameBoard (trap mechanism) + AI scene (wrong-game-establish); deliberately claustrophobic |
| Beat 4 — ANOTHER GAME | Atmospheric expanding | AI cooperation arc (Thread E hero cross-dissolves) breaks the MG density |
| Beat 5 — YOUR GAME | Grounding + Atmospheric | KineticTypography grounds the claim; AI footage (Thread F) keeps it modern and open |

---

## 3. Visual thread design

The AI footage layer is organized into 6 thematic threads plus 2 atmospheric inserts. Full design rationale in `development/visual-thread-design.md`; production scenes in `development/scenes/`.

### Thread A — The Building (Beats 1–2)
**Function:** RAND interior as a continuous walkable space; the model is *born here* and *escapes* at Beat 2's close.
**Shots:** aigen-01, aigen-01b, aigen-04a, aigen-04, aigen-05 — each a single-still clip (live-still or ken-burns). `aigen-04b` retired.
**Seams:** cuts / cross-dissolves between shots (was: 5 Kling morphs); match-cut at 01b→04a on the grid pattern.
**Beat 2 note:** Requires reorder — Nuclear PD GameBoard moves to *after* aigen-05 (doorway exit) so the interior journey is uninterrupted. Narration "It applies almost nowhere" doesn't bind to a specific corridor moment.

### Thread B — The Institution (Beat 1)
**Function:** Equation worship → institutional convergence. "The model conquers."
**Shots:** aigen-02 → (KT: Model Conquers) → aigen-03. `aigen-02b` retired — the tilt-up bridge folded into aigen-02's live-still camera move.
**Seams:** cut / cross-dissolve; the KT card sits between aigen-02 and aigen-03.

### Thread C — The Capture (Beat 3) — validated scene
**Function:** The model reshapes reality. Grid projected on landscape → negotiation room resolves from the gridlines.
**Shots:** aigen-06 (grid on landscape) → aigen-06b (grid + table) → aigen-07 (negotiation room) — single-still clips.
**Seams:** 06→06b cross-dissolve (grid tightens, table resolves in); 06b→07 cut. (Was a Pika morph chain.)
**Transition in:** `DIR: cut(iris, origin:center)` from prior KT card
**Transition out:** `DIR: cut(color-wash, ink)` into trap-mechanism GameBoard
**Full scene spec:** `development/scenes/wrong-game-establish.md`

### Thread D — The Markets Parallel (Beat 3)
**Function:** Black-Scholes and OPEC concession share a rust/amber palette signature — the model conquered both finance and diplomacy. Not spatially continuous; the palette is the connection.
**Shots:** aigen-08 (stock exchange) and aigen-09 (oil infrastructure) — existing stills, no new shots
**NLE discipline:** Cuts in/out of aigen-08 and aigen-09 should land on similar palette frames (warm rust inbound, ink outbound) so the two shots read as bookends.

### Thread E — The Cooperation Arc (Beat 4) — hero scene
**Function:** "Another game was always available." Progressive tonal arc from Stag Hunt dawn through Ostrom commons to oceanic scaling limit.
**Shots:** aigen-10 (sunrise) → aigen-11 (stag hunt) → aigen-11b (aftermath) → aigen-12 (terraces) → aigen-12a (alpine commons, NEW) → aigen-13 (ocean)
**Hero dissolve:** aigen-12a → aigen-13 (alpine pasture cross-dissolves into boundless ocean). The stone walls dissolving into open ocean *is* the Ostrom caveat made visual.
**Full scene spec:** `development/scenes/cooperation-arc.md`

### Thread F — The Stakes (Beat 5)
**Function:** Modern present day. You're inside the model. Contemporary urban register.
**Shots:** aigen-14 → aigen-14b → aigen-15 → aigen-forecast-01 → aigen-16 → aigen-16a → ARCH Reagan-Gorbachev → aigen-17 → aigen-17a
**Seams:** cuts / cross-dissolves (14→14b, 15→forecast-01, 16→16a, 17→17a were morphs; now single-still clips joined by seams) + cross-dissolve 16a→ARCH (across registers, NLE).

### Insert G — Permeation (Beat 2)
**Function:** "2,000+ articles" rendered as physical volume — library archive corridor. Breaks the 33s MG stretch (Narrowing → 2000 Articles → Something Working → Checkpoint).
**Shot:** aigen-permeation-01 (5s static with subtle push-in)
**Position:** Between Narrowing Framework MG and 2000 Articles KT

### Insert H — Forecast Window (Beat 5)
**Function:** Human scale added to aigen-15's "two landmasses" composition — diplomatic figures on clifftop. Breaks the 33s MG stretch (Falsification → Probability Gauge → Watch Signals).
**Shot:** aigen-forecast-01 (also part of Thread F)
**Position:** Between aigen-15 and Falsification Framework MG

---

## 4. Beat-by-beat visual breakdown

### Beat 1 — THE FAILED EXPERIMENT (0–138s, 23 segments)

**Editorial premise:** Cold open with misconception — Alchian/Williams 60% cooperation rate. Defect was the prediction; reality cooperated anyway. Reveal the experimental setup, then the payoff matrix.

| Segment | Template | Data file | Register | Notes |
|---|---|---|---|---|
| Episode title | TitleTransition | title-episode.json | Grounding | Fade in/out, 5s |
| Standard analytical frame | FrameworkDiagram | framework-standard-frame.json | Analytical | Sets the "Philosopher's Lens" framing |
| Can't explain KT | KineticTypography | kinetic-cant-explain.json | Grounding | Misconception-first opener |
| Model conquers KT | KineticTypography | kinetic-model-conquers.json | Grounding | Stakes set |
| RAND footage | HOLD (AI) | Thread A: aigen-01, 01b | Atmospheric | The experiment space; camera pushes into grids |
| Flood-Dresher GameBoard | GameBoard | gameboard-flood-dresher.json | Analytical | `pd-canonical` variant; Alchian vs Williams |
| ARCH Nash | HOLD (ARCH) | archival Nash footage | Grounding | Archival anchor |
| Nash Quote KT | KineticTypography | kinetic-nash-quote.json | Grounding | Quote card |
| Thread B AI | HOLD (AI) | aigen-02, 02b | Atmospheric | Equation as poster → tilt to rays |
| (KT) | KineticTypography | kinetic-model-conquers.json | Grounding | (Script position: between 02b and 03) |
| Thread B aerial | HOLD (AI) | aigen-03 | Atmospheric | Institutions from above |
| Every Negotiation KT | KineticTypography | kinetic-every-negotiation.json | Grounding | |
| Motif Beat 1 GameBoard | GameBoard | gameboard-motif-beat1.json | Analytical | Recurring motif — canonical PD payoffs |

**Register balance B1:** ~40% Analytical / ~40% Atmospheric / ~20% Grounding — intentionally atmospheric-forward to establish the experiential cold open before revealing the structure.

**Transition signature:** Episode opens on fade (0→5s). AI footage uses hard cuts. GameBoard enters via color-wash (ink). KT cards enter via direct cut from footage.

---

### Beat 2 — HOW A FAILED MODEL CONQUERED THE WORLD (138–270s, 19 segments)

**Editorial premise:** Failed 60/40 → became global standard. Mechanism: the model didn't win because it was right; it won because it was *useful as a stripping device* for institutional complexity. FrameworkDiagram: the Narrowing.

| Segment | Template | Data file | Register | Notes |
|---|---|---|---|---|
| Beat 2 title | TitleTransition | title-section-beat2.json | Grounding | 2s flash — `DIR: chapter("HOW A FAILED MODEL CONQUERED THE WORLD")` |
| PD intellectual lineage | ArcDiagram | arc-pd-lineage.json | Analytical | Flood/Dresher → Nash → RAND → policy adoption |
| Diffusion chart | DataChart | chart-diffusion.json | Analytical | 2,000+ articles over decades |
| Thread A continuation | HOLD (AI) | aigen-04a, 04, 04b, 05 | Atmospheric | RAND corridor walk; Beat 2 reorder positions Nuclear PD after aigen-05 |
| Nuclear PD GameBoard | GameBoard | gameboard-nuclear.json | Analytical | After doorway — "it escaped the building" |
| Insert G (permeation) | HOLD (AI) | aigen-permeation-01 | Atmospheric | Archive corridor; breaks 33s MG stretch |
| Narrowing Framework | FrameworkDiagram | framework-narrowing.json | Analytical | Conditions stripped: `flow` variant; 5 red nodes → 5 gray eliminations → 1 gold remainder |
| 2000 Articles KT | KineticTypography | kinetic-2000-articles.json | Grounding | |
| Something Working KT | KineticTypography | kinetic-something-working.json | Grounding | |
| Checkpoint Beat 2 | KineticTypography | kinetic-checkpoint-beat2.json | Grounding | Beat anchor |

**Register balance B2:** ~55% Analytical / ~30% Atmospheric / ~15% Grounding — analytically heaviest beat. This is intentional; the mechanism must be rigorous before we interrogate it.

**Key design choice — FrameworkDiagram "Narrowing":** The `flow` variant was chosen over `comparison` because the argument is sequential stripping, not side-by-side contrast. Five red nodes on the left (the assumptions) → five gray "eliminated" nodes on the right → one gold remainder (the OPEC meeting as the only real-world near-case). Color coding: `#A64D46` (china-red) for the assumptions being stripped, `#888780` (neutral) for what's eliminated, `#C4A747` (gold) for the survivor.

---

### Beat 3 — THE WRONG GAME (270–454s, 24 segments)

**Editorial premise:** The model didn't just describe existing games — it *created* the game conditions it then analyzed. Self-confirming mechanism. Two parallel examples: Black-Scholes (finance) and OPEC concessions (diplomacy). The visual layer makes the "capture" argument literal via the wrong-game-establish scene.

| Segment | Template | Data file | Register | Notes |
|---|---|---|---|---|
| Beat 3 title | TitleTransition | title-section-beat3.json | Grounding | |
| Thread C scene (4 frames) | HOLD (AI) | wrong-game-establish-A/B/C/D | Atmospheric | Chained scene (cross-dissolve + cut): grid → table → negotiation room |
| Trap Mechanism GameBoard | GameBoard | gameboard-trap-mechanism.json | Analytical | Self-referential payoff structure |
| Prediction Believed KT | KineticTypography | kinetic-prediction-believed.json | Grounding | |
| Wrong Game title KT | KineticTypography | kinetic-wrong-game-title.json | Grounding | THE WRONG GAME — editorial revelation |
| Thread D: aigen-08 | HOLD (AI) | — | Atmospheric | Stock exchange (rust palette anchor) |
| Vol Smile chart | TimeSeriesChart | chart-vol-smile.json | Analytical | Black-Scholes volatility smile post-1987 |
| Motif Beat 3 | FrameworkDiagram | framework-motif-beat3.json | Analytical | Recurring cycle motif |
| Thread D: aigen-09 | HOLD (AI) | — | Atmospheric | Oil infrastructure (rust palette echo) |
| Cycle vs Question | FrameworkDiagram | framework-cycle-vs-question.json | Analytical | Is the cycle self-reinforcing or interrogable? |
| Wrong Game Real KT | KineticTypography | kinetic-wrong-game-real.json | Grounding | |
| Checkpoint Beat 3 | KineticTypography | kinetic-checkpoint-beat3.json | Grounding | |

**Register balance B3:** ~45% Analytical / ~35% Atmospheric / ~20% Grounding. The Thread C scene (4 frames, ~30s) is the emotional peak of Beat 3 — placed at the beat opening as a "show before tell" for the self-confirming mechanism argument.

**Key design choice — Thread C scene placement:** The scene plays *before* the Trap Mechanism GameBoard, not after. "Show the dread, then name its structure." The grid→room scene runs under the narration "It's remaking the world in its own image," then the GameBoard explains the mechanism explicitly. If the scene ran after the GameBoard, it would illustrate something the viewer already understood analytically — which wastes the emotional charge.

**Key design choice — Thread D palette discipline:** No new shots needed; palette coherence is the editorial move. NLE operator instruction: cut in/out of aigen-08 and aigen-09 on matching palette frames (rust warm tones inbound, ink outbound). The two shots bookend the "markets bowed to math" beat without requiring spatial continuity.

**Transition signature:** Thread C scene entry: `DIR: cut(iris, origin:center)`. Thread C scene exit: `DIR: cut(color-wash, ink)`. Iris-in connects the KT revelation (wrong-game-title) to the visual scene — the grammar says "this is an opening moment." Color-wash-out marks the beat re-entering analytical mode (Trap Mechanism).

---

### Beat 4 — THERE WAS ALWAYS ANOTHER GAME (454–631s, 28 segments)

**Editorial premise:** The Stag Hunt (Skyrms equivalence), Axelrod's iterated PD, Ostrom's commons. Cooperation isn't a miracle — it's designed. The bounded analogy: Ostrom works at community scale; fails at oceanic/global. The visual layer builds the cooperation arc from dawn (aigen-10) through to boundless ocean (aigen-13) as the hero thread of the episode.

| Segment | Template | Data file | Register | Notes |
|---|---|---|---|---|
| Beat 4 title | TitleTransition | title-section-beat4.json | Grounding | |
| Thread E: aigen-10, 11 | HOLD (AI) | — | Atmospheric | Sunrise barn-raising; stag hunt |
| Stag Hunt GameBoard | GameBoard | gameboard-staghunt.json | Analytical | The alternative structure |
| Split PD vs Stag Hunt | SplitComposition | split-pd-vs-staghunt.json | Analytical | Side-by-side payoff matrices |
| Thread E: aigen-11b | HOLD (AI) | — | Atmospheric | Cooperative outcome; breaks 34s MG run |
| Iterated Equiv KT | KineticTypography | kinetic-iterated-equiv.json | Grounding | Axelrod equivalence claim |
| Iterated GameBoard | GameBoard | gameboard-iterated-play.json | Analytical | Tit-for-tat dynamics |
| Reframe Framework | FrameworkDiagram | framework-reframe.json | Analytical | |
| Thread E: aigen-12 | HOLD (AI) | — | Atmospheric | Terraced farmland (Ostrom commons) |
| Ostrom cases map | ProportionalSymbolMap | proportional-symbol-ostrom.json | Analytical | 800+ case distribution |
| Thread E: aigen-12a | HOLD (AI) | — | Atmospheric | Alpine commons; breaks 31s MG run |
| Ostrom vs PD | FrameworkDiagram | framework-ostrom-vs-pd.json | Analytical | Design principles contrast |
| Ostrom case studies | AnnotatedImage × 3 | annotated-image-valencia/torbel/maine.json | Analytical | Specific community commons |
| Cooperation Designed KT | KineticTypography | kinetic-cooperation-designed.json | Grounding | "Cooperation isn't a miracle. It's designed." |
| Thread E hero: aigen-13 | HOLD (AI) | — | Atmospheric | Ocean vastness; Ostrom scaling limit |

**Register balance B4:** ~40% Analytical / ~45% Atmospheric / ~15% Grounding — inverted from Beat 2. The cooperation arc is felt before it's argued. This is intentional; the episode has earned this register shift by the rigor of Beats 1–3.

**Key design choice — Thread E positions:** aigen-11b breaks the 34s MG stretch (Stag Hunt GameBoard + Split PD/SH), aigen-12a breaks the 31s MG stretch (Choropleth + Ostrom vs PD + Cooperation KT). Without these breaks, Beat 4 would be the most MG-dense beat in the episode, undermining the "expansive" register the cooperation argument needs.

**Key design choice — ProportionalSymbolMap over Choropleth:** Ostrom's 800+ cases are not country-level data — they're community-scale institutions scattered worldwide. A ChoroplethMap would imply country-level effect. ProportionalSymbolMap (proportional dots at actual case locations) is semantically accurate: it shows *density and clustering* (mountain communities, river deltas, coastal fisheries) that a choropleth would smooth away.

**Key design choice — SplitComposition for PD vs Stag Hunt:** The `split-pd-vs-staghunt.json` uses SplitComposition to show both payoff matrices simultaneously with a centered divider. The viewer must be able to read both at once; sequential presentation would hide the structural contrast that is the beat's editorial core.

**Key design choice — AnnotatedImage for Ostrom case studies:** Valencia, Torbel, and Maine are specific *named* places with specific institutional histories. AnnotatedImage with callout annotations (not a map) emphasizes the *particularity* of each case — these aren't data points, they're institutions with names and governance rules. The annotations carry the specificity.

---

### Beat 5 — YOUR GAME (631–893s, 27 segments)

**Editorial premise:** The model you've been watching is the one structuring your decisions now. Falsification test (Axelrod's conditions), probability gauge (30% forecast for US-China AI safety communiqué by Dec 2026), evidence pass (Reagan-Gorbachev as proof of reframing), final choice GameBoard. The visual layer brings Thread F (modern stakes) and grounds the episode back at the starting GameBoard.

| Segment | Template | Data file | Register | Notes |
|---|---|---|---|---|
| Beat 5 title | TitleTransition | title-section-beat5.json | Grounding | |
| Thread F: aigen-14, 14b | HOLD (AI) | — | Atmospheric | City street; coordination moment |
| Motif Beat 5 | FrameworkDiagram | framework-motif-beat5.json | Analytical | Recurring motif |
| Motif Final | FrameworkDiagram | framework-motif-final.json | Analytical | Extended motif with final annotation |
| Thread F: aigen-15, forecast-01 | HOLD (AI) | — | Atmospheric | Two landmasses; diplomatic cliff figures (Insert H) |
| Falsification Framework | FrameworkDiagram | framework-falsification.json | Analytical | Test for PD applicability |
| Probability Gauge | ProbabilityGauge | forecast-pd-cooperation.json | Analytical | 30% US-China AI safety forecast |
| Watch Signals KT | KineticTypography | kinetic-watch-signals.json | Grounding | |
| Thread F: aigen-16, 16a | HOLD (AI) | — | Atmospheric | Lecture hall; notebook close-up |
| ARCH Reagan-Gorbachev | HOLD (ARCH) | — | Grounding | Cross-dissolve from notebook → archival |
| Evidence Establishes KT | KineticTypography | kinetic-evidence-establishes.json | Grounding | INF Treaty as evidence of reframing |
| GameBoard callback | GameBoard | gameboard-flood-dresher.json | Analytical | **Callback to Beat 1 opening** — same file |
| Thread F: aigen-17, 17a | HOLD (AI) | — | Atmospheric | Wide panorama; single figure at edge |
| Final Choice GameBoard | GameBoard | gameboard-final-choice.json | Analytical | Player names replaced with generic roles |
| End card | TitleTransition | title-end-card.json | Grounding | |

**Register balance B5:** ~35% Analytical / ~40% Atmospheric / ~25% Grounding — grounding rises (evidence, archival, KT) as the episode resolves. The ending is analytical (GameBoard) but preceded by the warmest atmospheric stretch.

**Key design choice — Flood-Dresher GameBoard callback:** `gameboard-flood-dresher.json` is reused at 849.4s (exactly the same data file as Beat 1's 61.2s). This is deliberate: the viewer has traveled 14 minutes with new analytical tools, and here is the same board. The callback `_direction.isCallback: true` triggers the accent pulse (color overlay + underline flash + indicator dot, 0.75 opacity peak) — the template recognizes the concept has been seen before. The editorial argument: *you know this now*.

**Key design choice — ProbabilityGauge for the 30% forecast:** The episode makes an explicit probability forecast (US-China AI safety cooperation communiqué by Dec 2026). A KineticTypography card would render this as assertion; a DataChart as a bar among bars. ProbabilityGauge makes the epistemic status of the claim visible — it's calibrated, not certain. The template was designed for exactly this use case: editorial probability claims that need to look like forecasts, not facts.

**Key design choice — Thread F arc:** 14 (city street) → 14b (coordination happening) establishes the "modern stakes" register. 15 (horizon) → forecast-01 (human scale) bridges the abstract forecast to human figures. 16 (lecture hall) → 16a (notebook) → ARCH Reagan-Gorbachev → cross-dissolve is the "evidence for reframing is real" sequence: a student *learning* the model, then an archival moment where the model was *overridden* by choice. 17 (panorama) → 17a (single figure at edge) closes with the scale question: the panorama is the system, the figure is the individual choice.

---

## 5. Template family summary

| Family | Templates used | Count | Key file |
|---|---|---|---|
| **GameBoard** | pd-canonical, flood-dresher, nuclear, trap-mechanism, stag-hunt, iterated-play, motif-beat1, final-choice | 8 files | gameboard-flood-dresher.json |
| **FrameworkDiagram** | standard-frame, narrowing, motif-beat3, motif-beat5, motif-final, cycle-vs-question, reframe, ostrom-vs-pd, falsification | 9 files | framework-narrowing.json |
| **KineticTypography** | cant-explain, model-conquers, nash-quote, every-negotiation, 2000-articles, something-working, checkpoint-beat2, prediction-believed, wrong-game-title, wrong-game-real, checkpoint-beat3, iterated-equiv, cooperation-designed, watch-signals, evidence-establishes | 15 files | kinetic-cooperation-designed.json |
| **TitleTransition** | episode, editorial, section-beat2–5, end-card | 7 files | title-episode.json |
| **DataChart / TimeSeriesChart** | diffusion, vol-smile, iterated-cooperation | 3 files | chart-diffusion.json |
| **ArcDiagram** | pd-lineage | 1 file | arc-pd-lineage.json |
| **SplitComposition** | pd-vs-staghunt | 1 file | split-pd-vs-staghunt.json |
| **ProportionalSymbolMap** | ostrom | 1 file | proportional-symbol-ostrom.json |
| **AnnotatedImage** | valencia, torbel, maine | 3 files | annotated-image-valencia.json |
| **ProbabilityGauge** | pd-cooperation forecast | 1 file | forecast-pd-cooperation.json |
| **TOTAL** | | **50 files** | |

---

## 6. Transition grammar summary

Full doctrine: `project/TRANSITION_GRAMMAR.md`. Episode-level choices:

| Transition | Used for | Frequency |
|---|---|---|
| `cut` (hard cut) | Between AI footage shots within a thread | ~60% of cuts |
| `fade` | Episode open and close; beat boundary exits | Beat edges |
| `color-wash (ink)` | AI scene → analytical MG (Thread C exit; key emotional pivots) | 4–5 instances |
| `cut(iris, origin:center)` | KT revelation → AI scene entry (Thread C entry; Thread E arc entry) | 3 instances |
| `dissolve` | Cross-register transitions (notebook → ARCH Reagan-Gorbachev) | 1 instance |
| `match-cut` | Thread A: 01b → 04a (grid pattern continuity across surfaces) | 1 instance |

**Iris usage audit:** 3 irises in 121 segments — within the M-TRANSITION-IRIS-OVERUSE lint limit (max 4 per episode). All 3 are on genuine "opening moments" (Thread C entry, Thread E arc entry, one KT revelation). None on chart-to-chart transitions (M-TRANSITION-IRIS-CHART compliance: ✅).

**Dissolve-creep check:** The one dissolve (notebook → archival) is cross-register (AI footage → ARCH), which is the canonical dissolve use case. No dissolve between same-template MG segments (M-TRANSITION-DISSOLVE-CREEP compliance: ✅).

---

## 7. DIR: annotation summary

Key `DIR:` annotations that shaped the visual and audio layer:

| Annotation | Location | Effect |
|---|---|---|
| `DIR: chapter("THE FAILED EXPERIMENT")` | Beat 1 header | Desugars to TitleTransition segment |
| `DIR: cut(iris, origin:center)` | Beat 3 → Thread C scene entry | Iris-in from wrong-game-title KT |
| `DIR: cut(color-wash, ink)` | Thread C scene exit → Trap Mechanism | Color-wash to re-enter analytical mode |
| `DIR: drift(still)` | ARCH footage segments | Stillness preset — no Ken Burns |
| `DIR: drift(ken-burns-slow)` | AI footage HOLD segments (narrative beats) | Slow atmospheric push for AI stills |
| `DIR: hold(breathing)` | Cooperation arc Thread E | Breathing drift for the commons sequence |
| `DIR: mood(contemplative)` | Beat 1 music bed | `bed-contemplative-1.wav` cue |
| `DIR: mood(analytical)` | Beats 2–3 music beds | `bed-analytical-2/3.wav` |
| `DIR: mood(resolution)` | Beat 4–5 music bed | `bed-resolution-4.wav` |

---

## 8. PACE: profile usage

| Profile | Used in | Segments approx. |
|---|---|---|
| `breathing` | Cooperation arc (Thread E), Thread F opens | ~15% |
| `analytical` | All MG-heavy segments (default) | ~75% |
| `urgent` | Trap Mechanism section (Beat 3 mid), Forecast section (Beat 5 mid) | ~10% |

The `urgent` profile in Beat 3's trap mechanism section (gameboard-trap-mechanism, kinetic-prediction-believed, kinetic-wrong-game-title) compresses the sequence slightly — the trap should feel fast and inescapable. The `urgent` profile in Beat 5's forecast section (falsification → probability-gauge) creates a brief pulse of tension before the resolution.

---

## 9. Pending asset gaps (as of May 21, 2026)

The following assets are needed before the first full render can be clean:

**AI stills to generate (ChatGPT, from `prompts/chatgpt-prompts.md` + v2 addendum):**
- aigen-01b (grids close-up — Thread A)
- aigen-04a (chalkboard — Thread A)
- aigen-06b = wrong-game-establish-B (grid with table forming — Thread C)
- aigen-07 → wrong-game-establish-D equivalents (validated in bakeoff)
- aigen-11b (stag aftermath — Thread E)
- aigen-12a (alpine commons — Thread E hero setup)
- aigen-14b (street meeting — Thread F)
- aigen-16a (notebook close-up — Thread F)
- aigen-17a (single figure at edge — Thread F)
- aigen-permeation-01 (archive corridor — Insert G)
- aigen-forecast-01 (cliff figures — Insert H / Thread F)

**Archival stills to source (Wikimedia):**
- arch-rand-hq (RAND Corporation HQ building exterior, 1950s)
- arch-reagan-gorbachev (INF Treaty signing, 1987)

**Motion clips to generate:** none are morphs (ep1 dropped morphs). Each shot is a single-still clip:
- **live-still** (Hailuo i2v) — prompts in `prompts/live-still-prompts.md` (13 shots, per-shot `I2V-01-Live` / `I2V-01-Director` tag)
- **ken-burns** — rendered locally via `tools/ai-video/render_kenburns.py` (13 shots; specs in `shot-list.json`)
- Seams (cut / cross-dissolve / match-cut) are assembled in the NLE, not generated.

**Status tracking:** See `asset-registry.json` for per-asset status. `_status.md` tracks overall state.

---

## 10. Concept registry callbacks

The concept registry (`data/concepts.json`) should be checked before render for callback opportunities. Key concepts introduced in this episode that may be referenced later:

- `prisoners-dilemma` — introduced here as the primary lens; any future episode invoking this concept should trigger the callback pulse
- `stag-hunt` — introduced here (Skyrms equivalence); callback if referenced in future game-theory episodes
- `ostrom-commons` — introduced here; callback if referenced in collective-action episodes
- `bounded-analogy` — Parallax's signature form, invoked explicitly in this episode's structure

---

## 11. Pre-render QA checklist

Before first full render (`./scripts/render.sh prisoners-dilemma`):

- [ ] All 50 data JSON files validate against schema (`python3 tools/validate_data.py`)
- [ ] Assembly manifest `mode` field updated from `"estimate"` to `"locked"` when narration timing is confirmed
- [ ] arch-rand-hq and arch-reagan-gorbachev sourced and in `assets/stills/`
- [ ] Thread C bakeoff clips moved to `assets/clips/` with production filenames (see `development/scenes/wrong-game-establish.md` § Asset locations)
- [ ] Beat 2 reorder confirmed in `PrisonersDilemmaShowcase.tsx` (Nuclear PD after aigen-05, not between 04 and 04b)
- [ ] Narration WAV recorded and at `audio/narration.wav`
- [ ] `tools/narration/audio_qa.py` pass on narration WAV
- [ ] `python3 tools/pipeline_validator.py --write-status --update-tracker` to refresh dashboards
