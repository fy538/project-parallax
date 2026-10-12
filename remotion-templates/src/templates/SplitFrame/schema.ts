/**
 * SplitFrame schema — generalized side-by-side composition.
 *
 * Each pane can hold ANY registered template. The template's own data object
 * is inlined as `pane.data: unknown` — the Zod union in each template's own
 * schema validates it at render time. This mirrors the pattern ComparisonPair
 * uses for its 10 splittable templates, extended to the full ~60-template roster.
 *
 * Sync strategies
 * ───────────────
 *   simultaneous (default) — both panes start at frame 0. Duration = durationSec.
 *                            Each template sees the same frame clock.
 *   sequential             — left pane plays in full; then right pane starts.
 *                            Total duration = left.data.durationSec + right.data.durationSec
 *                            (SplitFrame reads durationSec from inlined pane data).
 *
 * Layout
 * ──────
 *   ratio (default 0.5) — fraction of total width assigned to left pane.
 *   divider (default true) — 4px gold vertical line between panes.
 *   dividerLabel — optional centered badge on the divider ("vs", "→", "↓").
 *
 * Pane labels
 * ───────────
 *   label — short era/context badge ("1914", "2024", "THEN", "NOW").
 *   labelPosition — corner of the PANE (not inside the scaled template).
 *   caption — italic caption below the scaled template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Pane ─────────────────────────────────────────────────────────────────────

export const SplitPaneSchema = z.object({
  /**
   * Template component name — must match a key in PANE_COMPONENTS
   * (see SplitFrame.tsx). Unknown names render as an empty placeholder
   * with a console.warn; lint catches them at manifest-gen time.
   */
  component: z.string(),

  /**
   * The template's own data, inlined. Shape is validated by the template's
   * own Zod schema at render time (via PANE_COMPONENTS dispatch).
   * Use the same JSON structure you would put in a standalone data file.
   */
  data: z.unknown(),

  /**
   * Short era or context label displayed as a corner badge on the pane.
   * Examples: "1914", "2024", "WESTERN LENS", "THEN", "NOW".
   */
  label: z.string().optional(),

  /**
   * Which corner of the pane the label badge appears in.
   * Default: "top-left" for left pane, "top-right" for right pane.
   */
  labelPosition: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
    .optional(),

  /**
   * Italic caption below the scaled template — source attribution,
   * era description, or an editorial note. Max ~60 chars.
   */
  caption: z.string().optional(),

  /**
   * `paneFit: "cover"` only — horizontal centre of the crop, as a fraction of
   * the template's width (0 = left edge, 1 = right edge). Default 0.5.
   */
  focusX: z.number().min(0).max(1).optional(),

  /**
   * When this pane "arrives", in seconds from the start of the card: its
   * label badge and caption appear then (caption 0.8s later), and with
   * `paneFit: "cover"` the picture sits under a veil until that moment.
   * Use it to bring each half in on the sentence that introduces it.
   * Default: 0 (everything present from the start).
   */
  revealAtSec: z.number().min(0).optional(),

  /**
   * Replace this pane's caption at `atSec`: the first caption fades out and
   * this one rises in at the same place. Use it when the picture should hold
   * and only the words change — instead of cutting to a second card with the
   * same picture, which restarts its drift and makes it jump.
   */
  captionSwap: z
    .object({ text: z.string(), atSec: z.number().min(0) })
    .optional(),
});

// ── SplitFrame data ───────────────────────────────────────────────────────────

export const SplitFrameDataSchema = z.object({
  episode: z.string(),

  /** Optional outer title rendered above the split (rare — most panes self-title). */
  title: z.string().optional(),

  /** Source attribution rendered at the bottom of the outer frame. */
  source: z.string().optional(),

  /**
   * Total composition duration in seconds.
   *
   * Simultaneous mode: both panes run for this duration.
   * Sequential mode: left runs for left.data.durationSec, right for
   * right.data.durationSec; total = sum; this field is ignored if omitted.
   *
   * Default: 12s.
   */
  durationSec: z.number().positive().optional(),

  left: SplitPaneSchema,
  right: SplitPaneSchema,

  /**
   * How each pane's template is fitted.
   *
   * "contain" (default) — the full 16:9 template is scaled to the pane's
   *    width and letterboxed. Right for charts and diagrams, where nothing
   *    may be cropped.
   * "cover" — the template is scaled to the pane's HEIGHT and cropped at the
   *    sides (see `focusX`), so each half of the frame is filled. Right for
   *    full-bleed image panes; captions sit in a strip under the picture.
   */
  paneFit: z.enum(["contain", "cover"]).optional(),

  /**
   * Fraction of total frame width assigned to the left pane (0.2–0.8).
   * Default: 0.5 (equal split).
   * Example: 0.4 gives 40/60 split (smaller left, larger right).
   */
  ratio: z.number().min(0.2).max(0.8).optional(),

  /**
   * Show a vertical divider between panes.
   * Default: true. Set false for a seamless edge-to-edge split.
   */
  divider: z.boolean().optional(),

  /**
   * Short label centered on the divider badge.
   * Examples: "vs", "→", "vs →", "↓", "THEN/NOW".
   * Omit for a bare divider line.
   */
  dividerLabel: z.string().optional(),

  /**
   * How frame timing is coordinated between panes.
   *
   * "simultaneous" (default) — both panes start at frame 0, share clock.
   *    Use for: side-by-side comparison of the SAME moment in time.
   *    Example: GDP 1990 | GDP 2024 (both animate in together).
   *
   * "sequential" — left pane plays fully, then right pane starts.
   *    Use for: "first we establish context, then the contrast lands."
   *    Example: historical setup (left), contemporary parallel (right).
   */
  syncStrategy: z.enum(["simultaneous", "sequential"]).optional(),

  backgroundVariant: z.enum(["light", "dark"]).optional(),

  _direction: DirectionBlockSchema.optional(),
});

export const SplitFrameSchema = z.object({
  data: SplitFrameDataSchema,
});
