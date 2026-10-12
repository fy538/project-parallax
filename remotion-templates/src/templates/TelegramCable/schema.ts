/**
 * Zod schema for TelegramCable template.
 *
 * Diplomatic cable register with full bureaucratic chrome:
 *   • Header block: FROM, TO, SUBJECT, DATE/TIME-GROUP, FILE NUMBER
 *   • Classification stamps: TOP SECRET / SECRET / CONFIDENTIAL / RESTRICTED
 *     (rendered top + bottom, slightly skewed, semi-bled rubber-stamp look)
 *   • Optional DECLASSIFIED overstamp (black, diagonal)
 *   • Body: ALL-CAPS typewriter, double-spaced, numbered paragraphs
 *   • BEGIN/END markers (e.g., "BEGIN SUMMARY ... END SUMMARY")
 *   • Onionskin / carbon-copy / plain paper substrate
 *   • Punch holes on left margin (3-hole binder)
 *   • Optional redactions (solid black bars at x-height, exemption code in margin)
 *   • Optional analytical annotations (same shape as PrimarySourceReveal)
 *
 * Editorial use case: Zimmermann Telegram (1917), Kennan's Long Telegram
 * (1946), Cuban Missile Crisis ExComm cables (1962), Nixon-Kissinger
 * back-channels.
 *
 * Distinct from PrimarySourceReveal: that template is for formal document
 * text (treaties, speeches). TelegramCable is for bureaucratic document
 * register where the FORMAT itself carries weight as primary-source evidence.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — TelegramCable entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Annotation (same shape as PrimarySourceReveal) ─────────────────────────

export const CableAnnotationSchema = z.object({
  /** Exact substring of `body` to annotate. */
  target: z.string(),
  /** 0-based occurrence index when target appears multiple times. */
  targetIndex: z.number().int().nonnegative().optional(),
  /** Annotation type. */
  type: z.enum([
    "underline",
    "circle",
    "highlight",
    "margin-note",
    "numbered",
  ]),
  /** Note text — required for margin-note / numbered. */
  note: z.string().optional(),
  /** Reveal timestamp in seconds. */
  appearAtSec: z.number().nonnegative(),
  /** Optional exit timestamp. */
  exitAtSec: z.number().nonnegative().optional(),
  /** Optional explicit color. */
  color: z.string().optional(),
});

// ── Redaction ──────────────────────────────────────────────────────────────

export const CableRedactionSchema = z.object({
  /**
   * Exact substring of body to redact. Renders as a solid black bar at
   * x-height (NOT full line-height) covering the redacted text.
   */
  target: z.string(),
  /** 0-based occurrence when target appears multiple times. */
  targetIndex: z.number().int().nonnegative().optional(),
  /**
   * FOIA exemption code shown in the right margin next to the bar.
   * E.g., "(b)(1)" national security, "(b)(3)" statute, "(b)(5)" deliberative.
   */
  exemptionCode: z.string().optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const TelegramCableDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional title overlay. */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Total duration in seconds. Default 20s. */
  durationSec: z.number().positive().optional(),
  /** Archive citation. */
  source: z.string(),

  // ── Header block (bureaucratic routing) ─────────────────────────────────
  header: z.object({
    /** Originator: "AMERICAN EMBASSY MOSCOW", "STATE", etc. */
    from: z.string(),
    /** Addressee: "SECRETARY OF STATE WASHINGTON", "SECSTATE WASHDC". */
    to: z.string(),
    /** Subject line. Optional. */
    subject: z.string().optional(),
    /**
     * Date/time group. Diplomatic format: "DDHHMMZ MMM YY" (zulu time)
     * e.g., "220900Z FEB 46" = 22 Feb 1946, 09:00 Zulu.
     */
    dateTimeGroup: z.string(),
    /**
     * State Department decimal file number. E.g., "861.00/2-2246" =
     * country code 861 (USSR) / topic 00 / date 2-22-46.
     */
    fileNumber: z.string().optional(),
    /**
     * Transmission classification.
     *   • "INCOMING TELEGRAM" — received cables (most common)
     *   • "OUTGOING TELEGRAM" — sent cables
     *   • "AIRGRAM"           — slower, lower priority
     *   • "CABLE"             — generic
     * Default "INCOMING TELEGRAM".
     */
    transmissionType: z
      .enum(["INCOMING TELEGRAM", "OUTGOING TELEGRAM", "AIRGRAM", "CABLE"])
      .optional(),
  }),

  // ── Classification ──────────────────────────────────────────────────────
  /**
   * Original classification. Renders as red rubber-stamp top AND bottom of
   * the cable, slightly skewed. Set null for unclassified material.
   */
  classification: z
    .enum(["TOP SECRET", "SECRET", "CONFIDENTIAL", "RESTRICTED"])
    .nullable()
    .optional(),
  /**
   * Has this been declassified? When true, adds a black DECLASSIFIED
   * overstamp diagonally across the page.
   */
  declassified: z.boolean().optional(),
  /** Declassification date — shown in the DECLASSIFIED stamp sub-label. */
  declassifiedDate: z.string().optional(),

  // ── Body ────────────────────────────────────────────────────────────────
  /**
   * Cable body text. Rendered in typewriter mono. By default rendered as
   * ALL CAPS (the diplomatic cable convention pre-1990s); set
   * `preserveCase: true` for post-1990s cables that use mixed case.
   *
   * Use double-newline (\n\n) for paragraph breaks. Numbered paragraphs
   * auto-prepend "1.", "2." etc. when `numberedParagraphs: true`.
   */
  body: z.string(),
  /** Preserve mixed case (post-1990s cable convention). Default false (ALL CAPS). */
  preserveCase: z.boolean().optional(),
  /** Auto-prepend "1.", "2." paragraph numbers. Default true. */
  numberedParagraphs: z.boolean().optional(),
  /**
   * Optional BEGIN/END markers wrapping the body. E.g.,
   * `{ begin: "SUMMARY", end: "SUMMARY" }` produces:
   *   BEGIN SUMMARY
   *   ... body ...
   *   END SUMMARY
   */
  beginEndMarkers: z
    .object({
      begin: z.string(),
      end: z.string(),
    })
    .optional(),

  // ── Substrate ───────────────────────────────────────────────────────────
  /**
   * Paper substrate.
   *   • "onionskin"  — translucent pale grey (default — most cables)
   *   • "carbon"     — purple-grey carbon copy (file copy)
   *   • "plain"      — clean white-ish (modern declassified facsimile)
   */
  paper: z.enum(["onionskin", "carbon", "plain"]).optional(),
  /**
   * Aging amount 0-1. Default 0.25 (mild paper yellowing).
   * For pre-1950 cables try 0.5+; for post-1990 try 0.1.
   */
  aged: z.number().min(0).max(1).optional(),
  /** Show 3-hole binder punches on left margin. Default true. */
  punchHoles: z.boolean().optional(),

  // ── Optional overlays ───────────────────────────────────────────────────
  /** Analytical annotations layered on the body text. */
  annotations: z.array(CableAnnotationSchema).optional(),
  /** Redactions — solid black bars at x-height. */
  redactions: z.array(CableRedactionSchema).optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const TelegramCableSchema = z.object({
  data: TelegramCableDataSchema,
});
