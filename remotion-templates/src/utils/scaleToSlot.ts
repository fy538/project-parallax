/**
 * scaleDataToSlot — keep a graphic's own timeline in step with its slot.
 *
 * A template's data file is written against a slot of a certain length: its
 * `durationSec`, and reveal times typed in seconds (`atSec`, `rowAtSec`,
 * `paragraphAtSec`, `appearAtSec`, …). When the manifest is re-timed to
 * recorded narration the slot changes and those numbers do not, so a reveal
 * meant for the narrator's third sentence lands early, late, or after the
 * cut. Until every reveal is tied to a spoken word, this scales the typed
 * times by slot ÷ authored length at the moment the data is handed to the
 * template, and tells the template its real length.
 *
 * What moves: start times, the pace between narration-led rows, and step
 * holds. What does not: how long a fade or crossfade takes.
 */

/** Keys holding a time measured from the start of the segment. */
const START_TIME_KEY = /(^at|At)Sec$|^typingStartSec$|^holdSec$/;
/** Lengths that are slots themselves (the top-level one becomes the slot). */
const LENGTH_KEY = /^durationSec$/;
/** A stagger this long is paced by the narration, not a visual cascade. */
const NARRATED_STAGGER_SEC = 1;
/** Outside this range the two lengths are not the same shot; leave it alone. */
const MIN_FACTOR = 0.5;
const MAX_FACTOR = 2;

const round = (n: number): number => Math.round(n * 1000) / 1000;

const scaleValue = (value: unknown, factor: number): unknown => {
  if (typeof value === "number") return round(value * factor);
  if (Array.isArray(value)) return value.map((v) => scaleValue(v, factor));
  return value;
};

const walk = (node: unknown, factor: number): unknown => {
  if (Array.isArray(node)) return node.map((child) => walk(child, factor));
  if (node === null || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === "_direction") {
      out[key] = value; // sync points and directions are resolved elsewhere
    } else if (START_TIME_KEY.test(key) || LENGTH_KEY.test(key)) {
      out[key] = scaleValue(value, factor);
    } else if (key === "staggerSec" && typeof value === "number" && value >= NARRATED_STAGGER_SEC) {
      out[key] = round(value * factor);
    } else {
      out[key] = walk(value, factor);
    }
  }
  return out;
};

/**
 * @param data          template data as authored
 * @param slotSec       the segment's length on the timeline now
 * @param authoredSec   the slot length the data was written for, when the
 *                      data has no `durationSec` of its own (the manifest
 *                      records it at re-time as `authoredDurationSec`)
 */
export function scaleDataToSlot<T extends Record<string, unknown>>(
  data: T,
  slotSec: number,
  authoredSec?: number,
): T {
  const own = typeof data.durationSec === "number" ? data.durationSec : undefined;
  const basis = own ?? authoredSec;
  if (!basis || basis <= 0 || slotSec <= 0) return data;
  const factor = slotSec / basis;
  if (Math.abs(factor - 1) < 0.01) return data;
  if (factor < MIN_FACTOR || factor > MAX_FACTOR) return data;
  const scaled = walk(data, factor) as Record<string, unknown>;
  if (own !== undefined) scaled.durationSec = round(slotSec);
  return scaled as T;
}
