/**
 * Catalog — Scenarios category.
 *
 * DecisionTree × 1 (branching scenario)
 * GameBoard × 3 (chess, payoff-matrix, pd-canonical)
 * BifurcationRoute × 1 (network split)
 */

import { Composition } from "remotion";
import { DecisionTree } from "../templates/DecisionTree/DecisionTree";
import { DecisionTreeSchema } from "../templates/DecisionTree/schema";
import type { DecisionTreeData } from "../templates/DecisionTree/types";
import { GameBoard } from "../templates/GameBoard/GameBoard";
import { GameBoardSchema } from "../templates/GameBoard/schema";
import type { GameBoardData } from "../templates/GameBoard/types";
// BifurcationRoute template removed May 13, 2026.
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

// ─── DecisionTree × 1 ─────────────────────────────────────────────────────

// Italian Opening — edgeLabels carry the qualitative branch character
// ("Quiet", "Sharp", "Tactical"); node labels carry the move/move-name. NYT
// / FT extensive-form canon places transition labels on edges, state labels
// on nodes. Removed numeric "100%" probability on root (it's a tautology and
// numeric, which the new gate strips anyway). `highlightColor` removed so
// the per-episode `useEpisodeColorEmphasis` accent (defaults to oxblood)
// drives the chosen-path color — the prior #5DAA68 green was off-palette.
// May 13, 2026 polish refactor.
const treeChessOpening: DecisionTreeData = {
  episode: CATALOG_EPISODE,
  title: "The Italian Opening",
  subtitle: "How a 16th-century chess opening branches",
  nodes: [
    { id: "root", label: "1. e4 e5 2. Nf3 Nc6 3. Bc4", children: ["italian", "evans", "two-knights"] },
    { id: "italian", label: "Bc5 — Giuoco Piano", edgeLabel: "Quiet game", children: ["italian-classic", "italian-modern"] },
    { id: "evans", label: "Bc5 4. b4 — Evans Gambit", edgeLabel: "Sharp", children: [] },
    { id: "two-knights", label: "Nf6 — Two Knights", edgeLabel: "Tactical", children: [] },
    { id: "italian-classic", label: "Classical c3+d3", edgeLabel: "Mainline" },
    { id: "italian-modern", label: "Modern d3 setup", edgeLabel: "Modern", highlighted: true, active: true },
  ],
  rootId: "root",
  highlightedPath: ["root", "italian", "italian-modern"],
  source: "ECO opening encyclopedia",
  durationSec: 12,
};

// Decision-ladder demo — ExComm 1962, the canonical Allison-style frame.
// Six options on the table, the chosen path runs root → blockade → quarantine.
// See: references/template-research/game-theory.md § A2
const treeExCommLadder: DecisionTreeData = {
  episode: CATALOG_EPISODE,
  title: "ExComm Options, October 1962",
  subtitle: "Six paths Kennedy's National Security Council weighed",
  variant: "ladder",
  nodes: [
    { id: "root", label: "Soviet missiles in Cuba — what to do?", children: ["do-nothing", "diplomacy", "secret", "blockade", "airstrike", "invasion"] },
    { id: "do-nothing", label: "Do nothing", children: ["accept-parity"] },
    { id: "accept-parity", label: "Accept strategic parity; let the missiles stay." },
    { id: "diplomacy", label: "Open diplomatic channels", children: ["khrushchev-letter"] },
    { id: "khrushchev-letter", label: "Private negotiation with Khrushchev for missile withdrawal." },
    { id: "secret", label: "Secret approach to Castro", children: ["castro-defect"] },
    { id: "castro-defect", label: "Bypass Moscow; lever Castro toward removal directly." },
    { id: "blockade", label: "Naval quarantine", highlighted: true, children: ["quarantine", "intercept-rules"] },
    { id: "quarantine", label: "Stop Soviet ships from delivering more weapons.", highlighted: true },
    { id: "intercept-rules", label: "ROE: stop, board, inspect — fire only if fired upon." },
    { id: "airstrike", label: "Surgical airstrike", children: ["missile-only", "limited-air"] },
    { id: "missile-only", label: "Strike only the missile sites — minimal escalation." },
    { id: "limited-air", label: "Wider strike on Cuban air defenses + missiles." },
    { id: "invasion", label: "Full invasion", children: ["mass-amphibious"] },
    { id: "mass-amphibious", label: "Amphibious landing + airborne — regime change." },
  ],
  rootId: "root",
  highlightedPath: ["blockade", "quarantine"],
  source: "Allison, Essence of Decision (1971); ExComm transcripts",
  durationSec: 14,
};

// ─── GameBoard × 2 ────────────────────────────────────────────────────────

// Chess piece colors: white pieces use brand bone (#F0E6D0) so the
// PieceCircle component's `isLightPiece` heuristic detects them and
// renders ink-colored glyph on bone bg (standard editorial chess
// register). Black pieces use brand ink (#1C1814), rendering bone glyph
// on ink bg. Pre-May 13 the data used ink for white AND rust for black,
// which collapsed both into "dark piece" rendering and forced the raw-text
// fallback ("bK" / "wK" on colored disks — looked like UI debug badges).
const gameChess: GameBoardData = {
  episode: CATALOG_EPISODE,
  title: "An Endgame Study",
  subtitle: "Réti's 1921 study — the king reaches both targets",
  variant: "chess",
  boardSize: 8,
  initialPieces: [
    { position: [7, 7], label: "wK", color: "#F0E6D0" },
    { position: [0, 5], label: "wP", color: "#F0E6D0" },
    { position: [0, 0], label: "bK", color: "#1C1814" },
    { position: [7, 1], label: "bP", color: "#1C1814" },
  ],
  phases: [
    { label: "1. Kg7", durationSec: 2.5,
      pieces: [{ position: [6, 6], label: "wK", color: "#F0E6D0" }] },
    { label: "2. Kf6 — diagonal pursuit", durationSec: 2.5,
      pieces: [{ position: [5, 5], label: "wK", color: "#F0E6D0" }] },
    { label: "3. Ke5 — both queens reachable", durationSec: 3,
      pieces: [{ position: [4, 4], label: "wK", color: "#F0E6D0" }] },
  ],
  source: "Richard Réti, 1921",
  durationSec: 10,
};

const gamePayoff: GameBoardData = {
  episode: CATALOG_EPISODE,
  title: "Stag Hunt",
  subtitle: "Two hunters, two strategies, four outcomes",
  variant: "payoff-matrix",
  rowPlayer: "Hunter A",
  colPlayer: "Hunter B",
  rowOptions: ["Stag", "Hare"],
  colOptions: ["Stag", "Hare"],
  cells: [
    { row: 0, col: 0, value: "4, 4", highlight: true, color: "#5DAA68" },
    { row: 0, col: 1, value: "0, 3" },
    { row: 1, col: 0, value: "3, 0" },
    { row: 1, col: 1, value: "3, 3", highlight: true, color: "#E5A544" },
  ],
  phases: [
    { label: "Two equilibria", sublabel: "Both Stag (best) and both Hare (safe) are stable",
      durationSec: 5, highlights: [0, 3] },
  ],
  source: "Rousseau / Skyrms, illustrative",
  durationSec: 9,
};

// pd-canonical — Tucker 1950 framing with T/R/P/S labels, best-response arrows,
// distinct hero treatments for moral (C,C) vs analytical Nash (D,D). The
// reference visualization for the prisoners-dilemma launch episode.
// See: references/template-research/game-theory.md § B.
const gamePDCanonical: GameBoardData = {
  episode: CATALOG_EPISODE,
  title: "The Prisoners' Dilemma",
  subtitle: "Tucker, 1950 — the canonical 2×2",
  variant: "pd-canonical",
  rowPlayer: "Prisoner A",
  colPlayer: "Prisoner B",
  rowOptions: ["Stay silent", "Confess"],
  colOptions: ["Stay silent", "Confess"],
  cells: [
    { row: 0, col: 0, value: "−1, −1", cellType: "R", heroRole: "moral" },
    { row: 0, col: 1, value: "−10, 0", cellType: "S" },
    { row: 1, col: 0, value: "0, −10", cellType: "T" },
    { row: 1, col: 1, value: "−5, −5", cellType: "P", heroRole: "analytical" },
  ],
  showTPRSLegend: true,
  showBestResponseArrows: true,
  showNashGlyph: true,
  payoffUnits: "yrs",
  phases: [
    { label: "Four outcomes", durationSec: 3,
      annotation: "Payoffs in years of prison. Lower is worse." },
    { label: "Each prisoner's best response — confess", durationSec: 4,
      annotation: "Whatever the other does, confessing serves me better." },
    { label: "Both arrive at the same answer", durationSec: 4, highlights: [3],
      annotation: "Mutual confession is the only stable outcome — and worse for both than silence." },
  ],
  source: "Tucker 1950, illustrative payoffs",
  durationSec: 11,
  backgroundVariant: "light",
};

// Iterated-play demo — same PD matrix across rounds 1 / 10 / 50 / 200,
// equilibrium shifting visibly from "first move" to "settled mutual
// cooperation under shadow of the future." The Axelrod reveal compressed
// into four panels. See: references/template-research/game-theory.md § B3
const gameIteratedPD: GameBoardData = {
  episode: CATALOG_EPISODE,
  title: "When Repetition Changes the Game",
  subtitle: "PD across 200 rounds — the equilibrium learns",
  variant: "iterated-play",
  rowPlayer: "A",
  colPlayer: "B",
  rowOptions: ["Cooperate", "Defect"],
  colOptions: ["Cooperate", "Defect"],
  cells: [
    { row: 0, col: 0, value: "3, 3" },
    { row: 0, col: 1, value: "0, 5" },
    { row: 1, col: 0, value: "5, 0" },
    { row: 1, col: 1, value: "1, 1" },
  ],
  rounds: [
    {
      label: "Round 1",
      highlights: [3],
      annotation: "Both defect — the one-shot Nash holds.",
    },
    {
      label: "Round 10",
      highlights: [3, 0],
      annotation: "Trust starts probing as players remember.",
    },
    {
      label: "Round 50",
      highlights: [0, 3],
      annotation: "Tit-for-tat outscores Always-Defect; cooperation spreads.",
    },
    {
      label: "Round 200",
      highlights: [0],
      annotation: "Mutual cooperation is now the stable equilibrium.",
    },
  ],
  // Note: no `phases` array — iterated-play variant uses `rounds` instead.
  // Schema's superRefine enforces this gate.
  durationSec: 12,
  backgroundVariant: "light",
};

// BifurcationRoute template was deleted May 13, 2026 after the
// COCOM-bifurcation demo failed the visual register pass — the
// phylogenetic-tree form (nodes + arcs floating on paper) didn't fit
// Parallax's editorial voice. Institutional-bifurcation stories now use
// DuelingFrameworks (side-by-side structural comparison) or
// HorizontalTimeline dual mode (cadence-aligned parallel tracks).

// Horizontal layout demo — AI timeline branching, left-to-right, track-style
// path highlighting. Demonstrates the "horizontal" layout variant with a
// thick ribbon on the chosen path and muted thin lines for unchosen branches.
const treeAITimelineHorizontal: DecisionTreeData = {
  episode: CATALOG_EPISODE,
  title: "The AI Timeline Question",
  subtitle: "Everything turns on a single variable nobody can predict",
  rootId: "root",
  layout: "horizontal",
  backgroundVariant: "dark",
  durationSec: 14,
  probabilityWeights: true,
  highlightColor: "#C4A747",
  highlightedPath: ["root", "slow", "controls-backfire", "china-independent"],
  nodes: [
    { id: "root", label: "AI arrival timeline", color: "#C4A747", children: ["fast", "slow"], active: true },
    { id: "fast", label: "Fast (2–3 years)", edgeLabel: "35%", color: "#4A7BA7", children: ["controls-succeed"] },
    { id: "slow", label: "Slow (10+ years)", edgeLabel: "65%", color: "#A64D46", children: ["controls-backfire"], highlighted: true },
    { id: "controls-succeed", label: "Controls succeeded", color: "#4A7BA7", children: ["us-lead"] },
    { id: "controls-backfire", label: "Controls backfired", color: "#A64D46", children: ["china-independent"], highlighted: true },
    { id: "us-lead", label: "US keeps decisive lead", color: "#4A7BA7" },
    { id: "china-independent", label: "China achieved self-sufficiency", color: "#A64D46", highlighted: true },
  ],
  cameraPath: [
    { focus: "root", zoom: 1.8, duration: 2 },
    { focus: "root", zoom: 1.1, duration: 1.5 },
    { focus: "china-independent", zoom: 1.6, duration: 4, dimOthers: true, label: "Scenario B: Controls backfire" },
    { focus: "root", zoom: 1.0, duration: 2.5 },
  ],
  source: "Parallax analysis",
};

// ─── Composition registrations ────────────────────────────────────────────

export const CatalogTreeChess = () => (
  <Composition
    id={catalogId("DecisionTree", "chess-opening")}
    component={DecisionTree}
    schema={DecisionTreeSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DecisionTreeData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: treeChessOpening }}
  />
);

export const CatalogTreeExCommLadder = () => (
  <Composition
    id={catalogId("DecisionTree", "excomm-ladder")}
    component={DecisionTree}
    schema={DecisionTreeSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DecisionTreeData).durationSec || 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: treeExCommLadder }}
  />
);

export const DecisionTreeHorizontalComposition = () => (
  <Composition
    id="DecisionTree-Horizontal"
    component={DecisionTree}
    schema={DecisionTreeSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DecisionTreeData).durationSec || 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: treeAITimelineHorizontal }}
  />
);

export const CatalogGameChess = () => (
  <Composition
    id={catalogId("GameBoard", "chess-endgame")}
    component={GameBoard}
    schema={GameBoardSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as GameBoardData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: gameChess }}
  />
);

export const CatalogGamePayoff = () => (
  <Composition
    id={catalogId("GameBoard", "stag-hunt")}
    component={GameBoard}
    schema={GameBoardSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as GameBoardData).durationSec || 9),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: gamePayoff }}
  />
);

export const CatalogGamePDCanonical = () => (
  <Composition
    id={catalogId("GameBoard", "pd-canonical")}
    component={GameBoard}
    schema={GameBoardSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as GameBoardData).durationSec || 11),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: gamePDCanonical }}
  />
);

export const CatalogGameIteratedPD = () => (
  <Composition
    id={catalogId("GameBoard", "iterated-pd")}
    component={GameBoard}
    schema={GameBoardSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as GameBoardData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: gameIteratedPD }}
  />
);

// CatalogBifurcationCocom export removed May 13, 2026 with BifurcationRoute.

export const catalogScenariosData = {
  treeChessOpening, treeExCommLadder, treeAITimelineHorizontal, gameChess, gamePayoff, gamePDCanonical, gameIteratedPD,
};
