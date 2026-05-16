# GameBoard — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (NYT chess column, FT go coverage, Axelrod 1984, RAND game-theoretic briefings, Tucker 1950); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**Four analytical registers for four kinds of strategic interaction.** Chess (`chess`) for sequential territorial moves; go (`go`) for patient territorial accumulation; payoff matrix (`payoff-matrix`) for simultaneous choice under uncertainty; Prisoner's Dilemma canonical form (`pd-canonical`) for the Tucker framing with T/R/P/S labels, best-response arrows, ∴ Nash glyph, and moral/analytical hero treatments; iterated play (`iterated-play`) for Axelrod-tournament round-by-round choice history. The key editorial distinction is strategic form vs. extensive form: the payoff matrix is the simultaneous-move, strategic-form argument; chess is the sequential, extensive-form argument. `pd-canonical` is the canonical Parallax form for the Prisoner's Dilemma episode — it implements Tucker's original framing with full game-theoretic anatomy. For crisis analysis, `backgroundVariant: "dark"`. For comparative political economy, `"light"`.

---

## § 1 Editorial purpose

### When to reach for it

The GameBoard template earns its place when the argument is about **strategic interaction** — not just what an actor chooses, but how that choice depends on what other actors choose. This is game theory in its original sense: the outcome for any actor is a function of the full strategy profile, not of any single decision in isolation.

Four variants map to four analytical registers:
- **`chess`** — sequential strategic moves, targeted capture. Use when the argument is "Actor A saw Actor B's position and responded with a move that directly attacked it." The board encodes positional information; the phases encode the move sequence. Chess is extensive-form: each player acts with knowledge of prior moves.
- **`go`** — territorial accumulation, patient encirclement. Use when the argument is about surrounding, not capturing — incremental presence that makes territory control inevitable. Go is the correct metaphor for Mackinder-style control-of-the-margins arguments.
- **`payoff-matrix`** — simultaneous choice under uncertainty. Use when both actors choose without observing the other's choice, and the outcome depends on the combination. The classic tariff game, the security dilemma, the technology-race decision. This is strategic form: the matrix encodes the outcome space.
- **`pd-canonical`** — Tucker's Prisoner's Dilemma framing with full game-theoretic anatomy: T/R/P/S labels, best-response arrows, Nash equilibrium marked with ∴, moral hero (mutual cooperation, bone+amber) and analytical hero (Nash, oxblood) treated distinctly. Use for the Prisoner's Dilemma episode and any composition where the structural inevitability of defection is the argument.
- **`iterated-play`** — Axelrod-tournament round-by-round choice history as small-multiples. Use when the argument is about how strategies evolve across repeated interaction — the emergence of cooperation, the collapse of trust, the tit-for-tat equilibrium.

### When not to reach for it

| Alternative | When it wins over GameBoard |
|---|---|
| **FrameworkDiagram** | The strategic argument is about stages or levers, not about an opponent's best response. If there's only one actor's choices, use a decision framework. |
| **DecisionTree** | The argument is about sequential choice under uncertainty for a SINGLE actor (e.g., a country's escalation options). GameBoard implies two or more interacting actors. |
| **EscalationLadder** | The argument is specifically about escalation levels in a conflict, not about strategic form vs. extensive form. The ladder's severity colors carry meaning GameBoard cannot replicate. |
| **NetworkDiagram** | The actors are nodes in an influence graph, not players in a game with a defined payoff structure. |

---

## § 2 Canonical idioms

### a. NYT chess column diagrams
- **New York Times** chess column (2000–present, particularly the Kasparov/computer analyses and the Carlsen championship columns): silhouette-only pieces (Unicode chess glyphs in solid fill), 1px ink border on the board, light/dark squares in two values of bone/paper or paper/bronze — **no colored squares except for the highlighted move** (a single amber square or faint amber overlay on the last-moved-to square).
- Key editorial convention: **no wooden textures, no 3D rendering, no drop-shadow stacks on pieces.** The NYT chess column is a diagram, not a game. The silhouette piece on a flat square is the information unit; decoration competes with it. This is the editorial standard — professional chess journalism has converged on flat silhouettes since the 1970s.
- *Parallax application:* the `PieceCircle` component now implements the chess register (silhouette) vs. token register (disk+ring). Chess-glyph labels (K, Q, R, etc.) trigger the silhouette path; raw text labels trigger the disk+ring path for abstract markers. The NYT standard is met: no disk, no ring, drop-shadow on the wrapper (not the glyph).

### b. FT go diagrams
- **Financial Times** occasional go diagrams in Asian affairs coverage (2016–present, particularly the AlphaGo series): radial gradient stone with specular highlight upper-left and shadow lower-right (simulating a real stone sitting on the board); hoshi (star) points marked as small dots; territory fill at ~15% opacity after the strategic point is made.
- Key editorial convention: the go stone is **the only element in editorial graphics that warrants faux-3D treatment** — because go stones ARE dimensional objects and readers' mental model of go includes the tactile stone texture. The specular highlight is not decoration; it is category recognition.
- *Parallax alignment:* the `GoBoard` component uses `radial-gradient(circle at 35% 30%, ...)` for both black and white stones — specular at upper-left. Hoshi positions for 9×9 boards are hardcoded at `[2,2], [2,6], [6,2], [6,6], [4,4]`. Territory fill at 15% opacity (applied post-strategic-reveal) would be added as an upgrade (currently the template places stones but does not compute territory).

### c. Prisoner's Dilemma payoff matrix (Economist style)
- **The Economist** uses 2×2 payoff matrices for game-theoretic explanations (2012–present, particularly in game theory explainers and arms-race coverage): payoff pairs in each cell in tabular-nums mono, the Nash equilibrium cell bolded or outlined in an accent color, row/column player labels in small-caps mono above/left of the grid — no gradient fills, no card chrome.
- Key editorial convention: **the 2×2 is the maximum for editorial clarity.** The Economist never uses a 3×3 or larger matrix in a mainstream explanation; larger matrices require sub-game analysis that cannot fit in a single composition. When a game has more than 2 strategies per player, the article reduces it to the 2×2 that captures the central tension.
- *Parallax application:* `pd-canonical` variant's 2×2 with Tucker's framing (T=Temptation/Defect-Cooperate, R=Reward/both-Cooperate, P=Punishment/both-Defect, S=Sucker/Cooperate-Defect) is the validated editorial form. The `∴` Nash glyph in oxblood marks the analytical hero; the bone+amber moral hero (mutual cooperation) marks what should happen. The Economist convention — bolded/outlined Nash cell — is implemented as the `heroRole: "analytical"` cell.

### d. Axelrod iterated play visualization
- **Robert Axelrod**, *The Evolution of Cooperation* (1984) and subsequent round-tournament visualizations: round-by-round choice history, cooperation shown in one color and defection in another, accumulating score alongside. The canonical visual for "why does tit-for-tat win?" is a panel sequence: Round 1 (cooperation), Round 5 (first defection), Round 20 (stable cooperative equilibrium), with the score differential widening as the cooperative strategy accumulates advantage.
- Key editorial convention: **reveal rounds progressively, hold on cumulative score.** The argument is that cooperation isn't naive — it is a winning strategy across time. This argument requires seeing the accumulation, not just the round result.
- *Parallax application:* `iterated-play` variant renders a small-multiples grid of 2×2 matrices labeled "Round 1 / Round 5 / Round 20..." — each panel shows the same matrix with the round's active cell highlighted. The `counterAnimation` field on `GamePhase` (for `chess`/`go`/`payoff-matrix` variants) counts up cooperation vs. defection tallies — the score accumulation idiom.

### e. RAND game-theoretic briefing diagrams
- **RAND Corporation** crisis game-analysis reports (1958 Chicken game analysis, Cuban Missile Crisis reconstruction 1987, contemporary crisis game-theory briefings): payoff matrices with probability-weighted expected values annotated alongside cells, best-response arrows in red (pointing from dominated to dominant strategy), Nash equilibrium circled.
- Key editorial convention: **best-response arrows are the load-bearing analytical element** — not decoration. Without them, the viewer must manually compute "given the other player's strategy, what would I prefer?" With them, the Nash equilibrium is revealed visually as the cell with no outgoing arrows (the only cell from which no player has an incentive to deviate).
- *Parallax application:* the `computeBestResponseArrows` function infers best-response arrows from cell value strings in "row, col" format. Arrows are rendered in `palette.rust` at 72% opacity, with perpendicular offsets so row-player and col-player arrows don't overlap. The `∴` glyph marks the Nash equilibrium as a brand-mark confirmation — the visual proof that logical inevitability (∴) leads here.

---

## § 3 General principles

**Strategic form vs. extensive form:** the payoff matrix (`payoff-matrix`, `pd-canonical`, `iterated-play`) is the **strategic form** — players choose simultaneously, and the matrix encodes all outcome combinations. Chess is the **extensive form** — players choose sequentially, and the tree of moves is the structure. Go occupies a middle register: the rules are sequential (players alternate), but the strategic argument is holistic (territory control is the measure). The variant choice should match the form of the argument: "they made these choices simultaneously" → matrix; "they responded to each other's moves" → chess or go.

**Nash equilibrium visual convention:** the Nash equilibrium is the cell from which no player has a unilateral incentive to deviate. Best-response arrows point from each non-Nash cell toward the Nash cell. The Nash cell has no outgoing arrows. The `∴` glyph at the Nash cell renders this as logical inevitability — the Parallax brand mark in its most analytical application.

**Moral vs. analytical hero (pd-canonical):** Tucker's original Prisoner's Dilemma framing distinguishes two cells that both demand visual prominence for different reasons — mutual cooperation (what should happen, bone+amber treatment) and mutual defection (what will happen, Nash, oxblood+∴ treatment). These two cells are **simultaneously present on screen** and must be visually distinct yet equally prominent. The design solution: moral hero gets warm fill (bone) + amber underline + amber payoff text; analytical hero gets neutral fill + oxblood border (2.5px vs. 1px) + ∴ glyph + oxblood payoff text.

**Animated choice-revelation:** for video, the progressive reveal of moves (phases in `chess`/`go`), cell highlights (phases in `payoff-matrix`/`pd-canonical`), or round panels (`iterated-play`) is more analytically powerful than a static matrix. The viewer experiences the game as it unfolds, not as a post-hoc summary. This is the medium's unique advantage over print.

**`pd-canonical` payoff parsing:** the `parsePayoffs` function handles Unicode minus (−) and en-dash (–) normalization alongside ASCII hyphens, so display strings can use proper typographic minus characters ("−5, 0") without breaking the best-response arrow computation. This matters editorially: payoff values in a video template should use proper typography.

---

## § 4 Recommendation for Parallax

**Chess:**
- Editorial silhouette style — no wooden textures, no 3D pieces. The `PieceCircle` chess register (Unicode glyph, drop-shadow, no disk) is correct.
- Highlight only the key move (1–2 highlighted squares per phase via `highlights`). Over-highlighting destroys the "move-by-move" clarity.
- `backgroundVariant: "dark"` for Cold War geopolitical chess metaphors; `"light"` for economic chess (trade, sanctions positioning).
- `boardSize: 8` (default); use `cinematicMode: true` to zoom to the active region per phase.

**Go:**
- Radial-gradient stones are the correct editorial treatment — the FT standard.
- Use 9×9 boards (default) for editorial clarity; 19×19 is analytically accurate but reads as texture at video resolution.
- Show territory (15% opacity fill) only after the strategic point is made, not before.
- `backgroundVariant: "dark"` for Asian geopolitics / technology territory arguments.

**Payoff matrix:**
- 2×2 is the Parallax standard; larger matrices need sub-game reduction. `cellSize: 200` (set at 140→200 in the May 13, 2026 pass) makes the matrix occupy editorial weight on a 1920×1080 canvas.
- Use `payoff-matrix` for generic simultaneous-choice arguments; use `pd-canonical` for Prisoner's Dilemma specifically.

**`pd-canonical`:**
- Always set `showBestResponseArrows: true` (default) — arrows are the load-bearing analytical element.
- Always set `showNashGlyph: true` (default) — the ∴ confirms logical inevitability.
- Set `payoffUnits` when the abstract payoffs can be anchored to a real referent (years, $ billions, military sorties).
- Moral hero (mutual cooperation) gets `heroRole: "moral"`, analytical hero (Nash/mutual defection) gets `heroRole: "analytical"`.

**Iterated play:**
- Reveal rounds progressively (`durationSec` should allow ~0.5s per panel + hold time).
- Use `counterAnimation` on the final phase of a `chess`/`go`/`payoff-matrix` composition to show the cumulative cooperation/defection tally.
- `backgroundVariant: "dark"` for crisis contexts; `"light"` for academic/theoretical expositions.

**Duration:**
- `chess`/`go`: `durationSec` = sum of `phase.durationSec` values; each phase typically 3–5s.
- `payoff-matrix`/`pd-canonical`: `durationSec: 10–14` — cells settle (1.5s), best-response arrows appear (1.6s), TPRS legend (2.2s), hold.
- `iterated-play`: `durationSec: 12–18` — panels stagger in at 0.5s each; final hold on full grid.

---

## § 5 Current template alignment

**Variants:**
- ✅ `chess`, `go`, `payoff-matrix`, `pd-canonical`, `iterated-play` — all five implemented.
- ✅ `warnIf` for chess with no piece data and no phases — empty board guard.
- ✅ `warnIf` for payoff-matrix/pd-canonical with no cell data.
- ✅ `warnIf` for iterated-play with no rounds data.

**Chess variant (`ChessBoard`):**
- ✅ `React.memo` wrapping — performance guard for per-frame re-renders.
- ✅ Unicode chess glyph registry (`CHESS_GLYPHS`) with `toChessGlyph` normalization — handles K/Q/R/B/N/P, full words, color-prefixed (wK/bK), and "white king"/"black queen" forms.
- ✅ Chess register in `PieceCircle` — silhouette glyph (no disk, no ring), drop-shadow on wrapper. NYT editorial standard met. Unchanged by the May 16 token-register refinement.
- ✅ **Token register in `PieceCircle` — precision-marker refinement (May 16, 2026, commit `b4bbe41`).** Strategic-actor markers in the chess variant (NVIDIA, ASML, US-style country/firm labels — anything that hits `toChessGlyph`'s raw-text fallback) replaced their pill-chip rendering with a precision-marker stack: small filled colored dot + hairline outer ring + vertical tether line + uppercase IBM Plex Mono label below. This aligns the chess-variant strategic-actor case with the precision-marker aesthetic shared by NetworkDiagram and ArcDiagram (POLISH.md D19) and removes the "game piece in a pill" register break that was inconsistent with the silhouette-glyph chess pieces above it. The chess-glyph branch (wK/bK actual chess pieces) and `PayoffMatrix` / `PDCanonicalMatrix` / `IteratedPlayMatrix` / `GoBoard` are unchanged — the token-register refinement is scoped to the chess-variant raw-text marker case where pill chrome was the failure mode.
- ✅ Alternating `palette.paper`/`palette.bronze` squares — warm, non-skeuomorphic. Dropped the accent (amber) ring from the board edge (May 13, 2026 pass); thin ink border replaces.
- ✅ Piece spring physics (`heroSpring`) — weighted landing for initial piece placement.
- ✅ Capture animation — fade + translateY slide for captured pieces.

**Go variant (`GoBoard`):**
- ✅ `React.memo` wrapping.
- ✅ Radial-gradient stones (upper-left specular, lower-right shadow) — FT standard.
- ✅ Hoshi positions hardcoded for 9×9 boards.
- ✅ Glass-stone box-shadow composite: `shadows.subtle + inset -1px -1px 2px rgba(0,0,0,0.3) + inset 1px 1px 2px rgba(255,255,255,...)` — commented in source as non-brand rgba values for glass refraction.
- ⚠️ Territory fill (15% opacity after strategic reveal) not implemented — stones are placed but territory is not computed or rendered. The FT/editorial standard includes territory marking; this is the most significant gap in the `go` variant.
- ⚠️ Board is always 9×9 (uses `boardSize || 9` but `gridSize` is fixed at 500×500 without adapting to the board size).

**Payoff matrix (`PayoffMatrix`):**
- ✅ `React.memo` wrapping.
- ✅ `cellSize: 200` (bumped from 140 in May 13, 2026 pass) — editorial weight on 1920×1080.
- ✅ Phantom right-side gutter to balance the row-label column — optical centering fix (May 13, 2026).
- ✅ Per-episode accent via `useEpisodeColorEmphasis` — active-cell highlight follows episode identity.

**PD-Canonical (`PDCanonicalMatrix`):**
- ✅ T/R/P/S kicker labels in top-left of each cell — Tucker framing anatomy.
- ✅ `∴` Nash glyph in `palette.oxblood` + `fonts.data` (JetBrains Mono) for the `heroRole: "analytical"` cell.
- ✅ Moral hero treatment — `palette.bone` fill + amber underline + amber payoff text.
- ✅ Analytical hero treatment — `palette.oxblood` border (2.5px) + ∴ glyph + oxblood payoff text.
- ✅ `computeBestResponseArrows` — infers arrows from "row, col" payoff strings with unicode-minus normalization.
- ✅ Best-response arrows in `palette.rust` at 72% opacity — RAND convention (rust, not red-primary, to stay within palette).
- ✅ Perpendicular arrow offsets — row-player and col-player arrows don't overlap.
- ✅ TPRS legend strip with `payoffUnits` suffix — Tucker anchoring.
- ✅ Phantom left/right gutters for optical centering (May 13, 2026 visual-register pass).
- ✅ `anticipatoryStartFrame` wiring — first cell/piece reveal lands settled at sync point 0.

**Iterated play (`IteratedPlayMatrix`):**
- ✅ Small-multiples grid (2/3/4 columns auto-sized by round count).
- ✅ Panels stagger in at `sec(0.5) + panelIdx * sec(0.5)`.
- ✅ Per-panel round label in Plex Mono uppercase.
- ✅ Per-panel annotation in italic body type.
- ✅ Active cell highlighted in `palette.amber` with glow.

**Main component:**
- ✅ `React.memo` wrapping on all sub-components.
- ✅ `useCompositionAnimation({ noDrift: true })` called for exit-fade wiring; `kenBurnsDrift` applied manually in main div transform for cinematic mode compatibility.
- ✅ `cinematicMode` — per-phase zoom to active board region (1.0 → 1.12 over first 20% of phase, hold, ease back over last 20%).
- ✅ `anticipatoryStartFrame` wiring for sync-point-aligned first reveal.
- ✅ `phases` coerced to `[]` for variants that use `rounds` instead — iterated-play doesn't crash on missing `phases`.

---

## § 6 Specific upgrades

[Shipped May 16, 2026 — commit `b4bbe41`]: chess-variant token-register precision-marker refinement (pill chip → dot + hairline ring + tether + mono label below) for strategic-actor markers that hit the raw-text branch of `toChessGlyph`. Chess-glyph register and non-chess variants unchanged.

1. **Territory rendering for `go` variant.** Add a post-reveal territory fill at 15% opacity using a simple flood-fill or convex-hull approximation around clusters of same-color stones. This is the editorial standard (FT, go journalism) and the most significant gap in the current `go` variant — stones placed without territory makes the board look mid-game with no argument. Even a simplified "region fill around stone clusters" approximation would be editorially correct for the compositions Parallax produces (simplified 9×9 boards with 10–20 stones). Effort: medium (flood-fill on a grid is not trivial but is well-understood). Impact: enables the "territorial encirclement" argument that `go` is intended for. **(medium effort / high editorial impact)**

2. **`highlightSquares` field for chess variant.** Add `highlightSquares?: Array<[number, number]>` to `GamePhase` — squares to highlight with a faint amber overlay (12% fill + 1px amber border) per NYT convention (the last-moved-to square). Currently the chess variant highlights pieces but not squares; the NYT standard highlights the destination square, not just the piece. Effort: small (render a highlighted div per square before pieces, same grid geometry). Impact: completes the NYT editorial chess diagram standard. **(low effort / medium impact)**

3. **`forecastedPayoff` annotation on `payoff-matrix` cells.** Add an optional `expectedValue?: number` field to `PayoffCell` — the expected-value computation when the probability of the other player's strategy is known. Rendered as a small Plex Mono number below the payoff pair (e.g., "EV: 2.3"). This is the RAND crisis-game briefing convention — payoffs annotated with expected values when the analyst has a prior probability for each outcome. Effort: small (one additional text element per cell, computed from data). Impact: unlocks the RAND briefing register for crisis-game analysis compositions. **(low effort / medium editorial impact)**

4. **`boardSize`-adaptive `gridSize` for `go` variant.** The current `GoBoard` renders on a fixed 500×500 grid regardless of `boardSize`. For a 19×19 full board (which Parallax may use for historical AlphaGo or China-strategy compositions), the intersections at `500/(19-1) ≈ 27.8px` spacing are too tight for 24px stones. Make `gridSize` a function of `boardSize` and cap `stoneSize` at `intersection_spacing * 0.85` so stones never overlap at any board size. Effort: small (replace two constants with computed values). Impact: enables 19×19 boards for comprehensive go-metaphor compositions. **(trivial effort / medium future impact)**

---

## § 7 Failure mode flags

- **Chess pieces rendered with disk+ring (token register) instead of silhouette glyph** — occurs when piece labels are not recognized by `toChessGlyph` (e.g., "USA", "China"). The editor registers these as raw-text labels and uses the token register. For chess compositions, use standard piece labels (K, Q, R, B, N, P or full words) and add country-specific labels to `ChessPiece.label` separately from the glyph lookup. Audit: inspect frame 30 for disk+ring chess pieces.
- **`pd-canonical` without `heroRole` on moral/analytical cells** — the template renders both the moral hero and analytical hero with identical chrome (neutral fill, neutral border) if `heroRole` is omitted. The T/R/P/S labels will be present but the visual distinction between "what should happen" and "what will happen" disappears. Audit: every `pd-canonical` composition must have exactly one `heroRole: "moral"` and one `heroRole: "analytical"` cell.
- **`iterated-play` without progressive round revelation** — if all rounds have `panelStart = sec(0.5)`, they all appear simultaneously, which reads as a static grid. Verify the `panelIdx * sec(0.5)` stagger is active (it is the default, but data files that override `durationSec` to very short values may compress the stagger below 1 frame).
- **Payoff strings not in "row, col" format** — `computeBestResponseArrows` returns no arrows for malformed strings. This silently omits the arrows, which are the load-bearing analytical element. Audit: verify all `PayoffCell.value` strings match `"number, number"` format (with optional sign and unicode minus).
- **`cinematicMode` zoom with hard-to-read phase labels** — the 1.12× zoom on a 200×200 cell matrix pushes labels toward the canvas edge. Audit: verify phase labels, annotations, and source attribution are within safe area at maximum `cinematicZoom`.
- **Go stones without territory** — the most common editorial gap. A 9×9 board showing stone placement without territory fill reads as an incomplete game diagram, not an argument. Audit: flag any `go` composition where the editorial claim is about territorial control rather than a specific stone placement.
- **`payoff-matrix` with more than a 2×2 or 3×3 matrix** — larger matrices require sub-game analysis that cannot fit in a 1920×1080 composition. The `cellSize: 200` makes a 4×4 matrix 800×800 + label columns = too wide for the canvas. Audit: `rowOptions.length * colOptions.length ≤ 9` is the practical maximum; 2×2 is strongly preferred.
- **Best-response arrows not appearing in `pd-canonical`** — `showBestResponseArrows` defaults to `true` but payoff-string parsing can fail silently. Audit: render frame 90 (after `arrowsStartFrame`) and verify rust-colored arrows are visible pointing from non-Nash cells toward Nash cell.

---

Last updated: May 15, 2026

Last revised: May 16, 2026 — chess-variant token register migrated to the POLISH.md D19 precision-marker aesthetic; strategic-actor markers (NVIDIA / ASML / country labels) now render as dot + hairline ring + tether + mono label rather than pill chip.
