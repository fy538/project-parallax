/**
 * resolveSeams — what each segment's entry and exit actually render as on the
 * episode timeline.
 *
 * FullEpisode places every segment at an absolute start time. Manifest
 * segments never overlap, so a transition that needs the outgoing picture
 * underneath the incoming one cannot be drawn by animating each segment's own
 * frames: it would fade up from the paper surface ("cut to blank cream, then
 * fade"). The resolver therefore decides, per seam, what is actually drawn,
 * and where a real overlap is needed it gives the outgoing segment a short
 * `tailSec` — extra time it stays on screen, frozen on its last frame, while
 * the incoming segment starts on schedule.
 * See project/TRANSITION_GRAMMAR.md § "On the episode timeline".
 *
 * Rules:
 *   1. cut, and anything unknown → cut.
 *   2. fade → dip through ink (the grammar's fade-through-black).
 *   3. color-wash keeps its own washColor.
 *   4. A dip is symmetric: when only one side of a seam asks for one, the
 *      adjoining side gets the matching half, so the outgoing picture fades
 *      into the colour instead of cutting to it.
 *   5. dissolve → a real cross-dissolve when the two segments abut. The
 *      outgoing segment gets a tail the length of the dissolve; whichever
 *      segment is drawn on top does the fading (a foreground card fades OUT
 *      over an incoming picture; in every other pairing the incoming segment
 *      fades IN over the held outgoing one). A dip on the same seam wins.
 *   6. Hold-under: a foreground segment whose `layered.backgroundSegmentId`
 *      names the background segment that ends where it starts sits over that
 *      picture — the picture's tail runs for the whole foreground segment.
 *   7. iris → cut, always (retired Oct 10 2026). match-cut / match-cut-still
 *      → cut until their paired zoom is rebuilt on top of the overlap.
 *
 * Deprecated tokens (wipes, blur-through, whip-pan, spatial-zoom) pass through
 * untouched — M-TRANSITION-DEPRECATED already flags them at lint time.
 */

import type { TransitionType } from "../components/Transitions";
import { palette } from "../design/theme";

export interface SeamSegment {
  id: string;
  startSec: number;
  endSec: number;
  /** Render layer; foreground segments draw above background ones. */
  layer?: "foreground" | "background" | string;
  /** Layered foregrounds name the background segment they sit over. */
  layered?: { backgroundSegmentId?: string } | null;
  transition?: {
    in?: TransitionType;
    out?: TransitionType;
    durationSec?: number;
    washColor?: string;
  };
}

export interface ResolvedSeam {
  transitionIn: TransitionType;
  transitionOut: TransitionType;
  inDurationSec?: number;
  outDurationSec?: number;
  inWashColor?: string;
  outWashColor?: string;
  /**
   * Seconds this segment stays on screen past its `endSec`, frozen on its
   * last frame, so the next segment can dissolve over (or under) it.
   */
  tailSec?: number;
  /**
   * True for a foreground segment that sits over the still-held picture of
   * the background segment before it (rule 6). FullEpisode renders it with a
   * transparent ground and does not mount a second copy of the background.
   */
  holdUnder?: boolean;
}

/**
 * Tokens that resolve to a cut on the episode timeline: iris is retired, and
 * the match-cuts wait on a paired zoom. `dissolve` is handled per seam below.
 */
const RESOLVES_TO_CUT: ReadonlySet<TransitionType> = new Set<TransitionType>([
  "dissolve",
  "iris",
  "match-cut",
  "match-cut-still",
]);

/** Default length of a cross-dissolve when the manifest gives none. */
export const DEFAULT_DISSOLVE_SEC = 0.5;

/** Two segments abut when the gap between them is under one frame at 30fps. */
const ABUT_EPSILON_SEC = 1 / 30;

interface Side {
  type: TransitionType;
  durationSec?: number;
  washColor?: string;
}

const resolveSide = (
  type: TransitionType | undefined,
  durationSec: number | undefined,
  washColor: string | undefined,
): Side => {
  if (!type || type === "cut" || RESOLVES_TO_CUT.has(type)) {
    return { type: "cut" };
  }
  if (type === "fade") {
    return { type: "color-wash", durationSec, washColor: palette.ink };
  }
  if (type === "color-wash") {
    return { type, durationSec, washColor };
  }
  return { type, durationSec, washColor };
};

export const resolveSeams = (
  segments: readonly SeamSegment[],
): Record<string, ResolvedSeam> => {
  const ordered = [...segments].sort((a, b) => a.startSec - b.startSec);
  const sides = ordered.map((seg) => ({
    in: resolveSide(
      seg.transition?.in,
      seg.transition?.durationSec,
      seg.transition?.washColor,
    ),
    out: resolveSide(
      seg.transition?.out,
      seg.transition?.durationSec,
      seg.transition?.washColor,
    ),
  }));

  const tails = ordered.map(() => 0);
  const holdUnder = ordered.map(() => false);

  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const abuts = Math.abs(b.startSec - a.endSec) < ABUT_EPSILON_SEC;
    if (!abuts) continue;
    const out = sides[i].out;
    const into = sides[i + 1].in;
    if (into.type === "color-wash" && out.type === "cut") {
      sides[i].out = { ...into };
      continue;
    }
    if (out.type === "color-wash" && into.type === "cut") {
      sides[i + 1].in = { ...out };
      continue;
    }
    if (out.type === "color-wash" || into.type === "color-wash") continue;

    // Rule 6 — hold-under: the picture stays for the whole foreground segment.
    const sitsOver =
      b.layer === "foreground" &&
      a.layer === "background" &&
      b.layered?.backgroundSegmentId === a.id;
    if (sitsOver) {
      holdUnder[i + 1] = true;
      tails[i] = Math.max(tails[i], b.endSec - b.startSec);
    }

    // Rule 5 — real cross-dissolve. The incoming side owns the seam if both ask.
    const wantsDissolve =
      b.transition?.in === "dissolve" || a.transition?.out === "dissolve";
    if (!wantsDissolve) continue;
    const dur =
      (b.transition?.in === "dissolve"
        ? b.transition?.durationSec
        : a.transition?.durationSec) ?? DEFAULT_DISSOLVE_SEC;
    tails[i] = Math.max(tails[i], dur);
    const outgoingOnTop = a.layer === "foreground" && b.layer === "background";
    if (outgoingOnTop) {
      sides[i].out = { type: "fade", durationSec: dur };
    } else {
      sides[i + 1].in = { type: "fade", durationSec: dur };
    }
  }

  // Rule 6, continued — a hold-under card that dissolves into what follows has
  // a tail of its own; its picture has to stay under it for that long too,
  // or the type would finish the dissolve over bare paper.
  for (let i = 0; i < ordered.length - 1; i++) {
    if (holdUnder[i + 1] && tails[i + 1] > 0) tails[i] += tails[i + 1];
  }

  const resolved: Record<string, ResolvedSeam> = {};
  ordered.forEach((seg, i) => {
    resolved[seg.id] = {
      transitionIn: sides[i].in.type,
      transitionOut: sides[i].out.type,
      inDurationSec: sides[i].in.durationSec,
      outDurationSec: sides[i].out.durationSec,
      inWashColor: sides[i].in.washColor,
      outWashColor: sides[i].out.washColor,
      ...(tails[i] > 0 ? { tailSec: tails[i] } : {}),
      ...(holdUnder[i] ? { holdUnder: true } : {}),
    };
  });
  return resolved;
};
