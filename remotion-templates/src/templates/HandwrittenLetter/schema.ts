/**
 * Zod schema for HandwrittenLetter template.
 *
 * Dual-mode handwritten-correspondence visualisation:
 *
 *   1. PHOTOGRAPH mode (canonical, default): a real archival image of the
 *      letter is held still while the camera slowly pans (Ken Burns), with
 *      paragraph fade-ins synced to the narrator reading the text. This
 *      matches the Burns/Curtis documentary canon — the artifact IS the
 *      argument; the camera moves, the letter doesn't.
 *
 *   2. TYPESET mode (fallback): when no archival photograph survives, render
 *      the text in a script font (Caveat by default) on aged paper. Each
 *      paragraph fades in at its scripted timestamp; optionally use ink-trail
 *      draw-on for a heightened editorial moment. (Write-on is overused in
 *      explainer YouTube — reserve for unusual emphasis.)
 *
 * Editorial use case: Eisenhower-to-Khrushchev / Stalin-to-Truman /
 * Lord Salisbury-to-Hicks-Beach moments — primary-source correspondence
 * where the editorial weight comes from the letter being a real artifact.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — HandwrittenLetter entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Paragraph ──────────────────────────────────────────────────────────────

export const HandwrittenParagraphSchema = z.object({
  /**
   * Paragraph text. In typeset mode, rendered directly. In photograph mode,
   * shown as a side-panel transcription that fades in at `appearAtSec` so
   * the viewer can read along with the narrator without straining at the
   * sometimes-illegible original script.
   */
  text: z.string(),
  /** Reveal time in seconds. */
  appearAtSec: z.number().nonnegative(),
  /**
   * Hold duration after reveal. Optional — defaults to "until the next
   * paragraph appears, or end of clip if last paragraph."
   */
  holdSec: z.number().positive().optional(),
  /**
   * Optional emphasis. When "key", the paragraph gets a slight scale bump
   * + accent underline (used sparingly — at most one per letter).
   */
  emphasis: z.enum(["normal", "key"]).optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const HandwrittenLetterDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Total duration in seconds. Default 16s. */
  durationSec: z.number().positive().optional(),

  /**
   * Render mode. Default "photograph" — the canonical documentary register.
   */
  mode: z.enum(["photograph", "typeset"]).optional(),

  // ── Photograph mode ─────────────────────────────────────────────────────
  /**
   * URL or path to the archival photograph of the letter. Required when
   * `mode === "photograph"`. Public-domain sources: Library of Congress,
   * National Archives, Wikimedia Commons typically have presidential and
   * historical correspondence.
   */
  imageUrl: z.string().optional(),
  /**
   * Ken Burns motion. Camera slowly zooms + pans across the still letter.
   * The motion is the editorial signal that this is studied attention; the
   * letter itself doesn't move.
   *
   *   • fromZoom/toZoom — scale factor at clip start/end (default 1.0 → 1.08)
   *   • panToX/panToY   — final pan offset in % of image dimensions
   *                       (default 0 → start centered, end centered)
   */
  kenBurns: z
    .object({
      fromZoom: z.number().positive().optional(),
      toZoom: z.number().positive().optional(),
      panToX: z.number().min(-50).max(50).optional(),
      panToY: z.number().min(-50).max(50).optional(),
    })
    .optional(),
  /**
   * Aging treatment on the image — duotone/sepia tint at 0-1 strength.
   * Default 0 (no treatment; archival image is shown as-is). Set 0.3-0.5
   * when the original photograph is too clean for the period register.
   */
  imageTreatment: z.number().min(0).max(1).optional(),

  // ── Typeset mode ────────────────────────────────────────────────────────
  /**
   * Full text of the letter. Required when `mode === "typeset"`. Use
   * paragraph breaks (\n\n) to separate paragraphs; each becomes a
   * fade-in unit. The first paragraph appears immediately.
   */
  text: z.string().optional(),
  /**
   * Optional ink-trail draw-on per paragraph (instead of fade-in). Use
   * sparingly — write-on animation reads as kitsch in documentary register.
   * Reserve for moments where the editorial point IS the act of writing.
   * Default false.
   */
  inkTrail: z.boolean().optional(),

  // ── Common metadata strip ───────────────────────────────────────────────
  /** Salutation rendered above the letter ("My dear Mr. President,"). */
  salutation: z.string().optional(),
  /** Closing rendered below the letter ("Yours faithfully, / D.D. Eisenhower"). */
  signature: z.string().optional(),
  /** Dateline rendered in small caps mono ("WASHINGTON · 22 OCT 1962"). */
  dateline: z.string().optional(),

  /**
   * Ordered paragraph fade-ins. Pre-computed by visual-spec or hand-authored.
   * Required — without paragraphs the letter sits inert.
   */
  paragraphs: z.array(HandwrittenParagraphSchema).min(1),

  /** Optional editorial title overlay (rare — usually the letter speaks for itself). */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Archive citation, shown in bottom-right. */
  source: z.string(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const HandwrittenLetterSchema = z.object({
  data: HandwrittenLetterDataSchema,
});
