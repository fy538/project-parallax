/**
 * Zod schema for PrimarySourceReveal template.
 *
 * A primary-source text passage with timed annotations. The text fades in,
 * then annotations layer on in sequence — underlines, circles, margin
 * notes, strike-throughs, translations. The argument is "look at what the
 * document actually says": the text holds the screen, the annotations are
 * the reading.
 *
 * Editorial use case: treaty clauses, speeches, diplomatic cables, legal
 * opinions, historical correspondence — any moment where the editorial
 * argument is "what this primary source means depends on how you read it."
 *
 * Annotation types:
 *   • underline       — bottom underline on a target span
 *   • circle          — hand-drawn-style ellipse around a span
 *   • highlight       — translucent yellow highlight (use sparingly)
 *   • strike          — strike-through (for excised or contested text)
 *   • margin-note     — small note in the right margin pointing at the span
 *   • translate       — second-language gloss appearing above the span
 *   • numbered        — small reference number that maps to a footnote
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — PrimarySourceReveal entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Annotation ─────────────────────────────────────────────────────────────

export const PrimarySourceAnnotationSchema = z.object({
  /**
   * Target text — must be an exact substring of `text`. The first occurrence
   * is annotated. Use `targetIndex` to address later occurrences.
   */
  target: z.string(),
  /**
   * 0-based occurrence index when the target string appears multiple times.
   * Default 0 (first match).
   */
  targetIndex: z.number().int().nonnegative().optional(),
  /** Annotation type. See module doc for descriptions. */
  type: z.enum([
    "underline",
    "circle",
    "highlight",
    "strike",
    "margin-note",
    "translate",
    "numbered",
  ]),
  /**
   * Note text — required for `margin-note`, `translate`, `numbered`.
   * Ignored for other types.
   */
  note: z.string().optional(),
  /** Reveal timestamp in seconds. */
  appearAtSec: z.number().nonnegative(),
  /**
   * Optional exit timestamp. When unset, annotation persists until the end.
   * Use to layer interpretations sequentially (highlight A, then remove A
   * and highlight B).
   */
  exitAtSec: z.number().nonnegative().optional(),
  /**
   * Optional explicit colour. When unset, falls back to palette accents
   * (gold for highlight, china for strike, dustblue for translate, ink for
   * other types).
   */
  color: z.string().optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const PrimarySourceDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /**
   * Source citation — shown beneath the document as small caps.
   * E.g., "Treaty of Versailles, Article 231 (1919)". An empty string draws
   * nothing (an exchange written for the video has no source to cite).
   */
  source: z.string(),
  /** Optional headline (above the document). */
  title: z.string().optional(),
  /** Optional sub-headline. */
  subtitle: z.string().optional(),
  /** Total clip duration in seconds. Default 14s. */
  durationSec: z.number().positive().optional(),

  /**
   * The text passage to display. May contain newlines (rendered as
   * paragraph breaks). Keep under ~400 words — readability degrades quickly.
   *
   * Annotations target exact substrings, so author this carefully.
   */
  text: z.string().min(1),

  /**
   * Show the document itself instead of a typeset transcription: a scan or
   * photograph of the passage, with highlight boxes laid over the lines.
   * `text` stays required as the transcript of what the image shows.
   * The image is multiplied onto the card (so a white page takes the paper
   * tone) and fades out at its top and bottom edges, which lets a crop that
   * starts mid-paragraph read as an excerpt. Crop the passage wide enough
   * that body text lands at 30px or more on screen.
   */
  image: z
    .object({
      /** Path under public/, e.g. "episodes/<slug>/stills/doc-….png". */
      src: z.string(),
      /** Pixel size of the image file — sets the aspect ratio. */
      width: z.number().positive(),
      height: z.number().positive(),
      /** Highlight boxes, in percent of the image. One per line of text. */
      highlights: z
        .array(
          z.object({
            x: z.number().min(0).max(100),
            y: z.number().min(0).max(100),
            w: z.number().min(0).max(100),
            h: z.number().min(0).max(100),
            /** When the box starts wiping in, left to right. */
            appearAtSec: z.number().nonnegative(),
          }),
        )
        .optional(),
    })
    .optional(),

  /**
   * Set the passage as an exchange between speakers. Each paragraph is one
   * turn written "Speaker: words"; the speaker's name becomes a small label
   * in its own column and the words hang beside it. Pair with
   * `paragraphAtSec` to let the turns arrive one at a time, and with
   * `paper: "plain"`, and say what kind of exchange it is with `label`.
   */
  dialogue: z.boolean().optional(),
  /**
   * With `dialogue`: what kind of exchange this is, set in small capitals
   * directly above the turns and visible for the whole card, e.g.
   * "Illustrative exchange · written for this video" or
   * "Reconstruction · Anthropic, 2025" (EDITORIAL_PLAYBOOK.md VIS-12).
   */
  label: z.string().optional(),
  /**
   * With `dialogue` and `paragraphAtSec`: type each turn out instead of
   * fading it in. The first speaker's turns are typed a character at a time;
   * every other speaker's arrive a word at a time, the way a model's reply
   * streams. The layout is fixed from the first frame, so nothing reflows and
   * annotations still land on their words. Time annotations after the turn
   * they mark has finished.
   */
  typeOut: z.boolean().optional(),
  /**
   * Speed of `typeOut` relative to the default (1). Use a value above 1 when
   * an exchange the viewer has already read is typed again.
   */
  typeSpeed: z.number().positive().optional(),
  /**
   * Type size for the passage, in px on a 1080p frame. By default the size
   * follows the length of `text` (44 up to 200 characters, 34 up to 400,
   * 26 beyond). Set it when a short passage with speaker labels or line
   * breaks deserves the larger size.
   */
  fontSize: z.number().positive().optional(),
  /**
   * When each paragraph of `text` appears, in seconds (paragraphs are
   * separated by a blank line). Lets an exchange or a list build line by line
   * while the layout stays fixed. Paragraphs without a time, and every
   * paragraph when this is omitted, appear with the document.
   */
  paragraphAtSec: z.array(z.number().nonnegative()).optional(),
  /**
   * A short key under the passage, set at reading size, for telling apart
   * what the highlights mean (pair each entry's `color` with an annotation's
   * `color`). Use it instead of margin notes when the labels must be read on
   * a phone. Two or three entries at most.
   */
  legend: z
    .array(
      z.object({
        label: z.string(),
        color: z.string().optional(),
        appearAtSec: z.number().nonnegative(),
      }),
    )
    .optional(),

  /**
   * Annotation sequence — timed analytical overlays on the text.
   * Optional: a bare document with no annotations is valid (a quiet reveal
   * of the source itself), but the editorial value is usually in the layer.
   */
  annotations: z.array(PrimarySourceAnnotationSchema).optional(),

  /**
   * Render the text as a serif body face (treaty / formal-document register).
   * Default true. Set false for sans (cable / wire-service register).
   */
  serif: z.boolean().optional(),
  /**
   * Document paper texture. Default "paper" (warm bone background simulating
   * archival paper); "plain" uses the background variant directly.
   */
  paper: z.enum(["paper", "plain"]).optional(),
  /**
   * Initial fade-in duration in seconds for the text itself. Default 1.2s.
   */
  textFadeInSec: z.number().nonnegative().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const PrimarySourceSchema = z.object({
  data: PrimarySourceDataSchema,
});
