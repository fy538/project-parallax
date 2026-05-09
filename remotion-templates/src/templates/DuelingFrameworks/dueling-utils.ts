/**
 * Shared helpers and canvas/camera constants for DuelingFrameworks.
 */

import { fonts } from "../../design/theme";
import { layout } from "../../design/theme";

// ── Helper: detect Chinese characters ───────────────────────────────────
export const CHINESE_REGEX = /[一-鿿㐀-䶿]/;
export const hasChinese = (text: string): boolean => CHINESE_REGEX.test(text);

// ── Helper: get appropriate font family ────────────────────────────────
export const getFontFamily = (text: string): string => {
  return hasChinese(text) ? fonts.chinese : fonts.display;
};

// ── Helper: get secondary font (body) for bilingual content ─────────────
export const getBodyFont = (text: string): string => {
  return hasChinese(text) ? fonts.chinese : fonts.body;
};

// ── Cinematic mode canvas/camera constants ────────────────────────────────

export const CANVAS_WIDTH = layout.width * 2.2; // wide canvas for camera travel
export const VIEWPORT_WIDTH = layout.width;
export const VIEWPORT_HEIGHT = layout.height;

// Camera positions on the wide canvas
export const CAMERA_POS = {
  frameworkA: VIEWPORT_WIDTH * 0.35,   // left third
  center: CANVAS_WIDTH / 2,            // dead center (VS moment)
  frameworkB: CANVAS_WIDTH - VIEWPORT_WIDTH * 0.35, // right third
  overview: CANVAS_WIDTH / 2,          // pulled back (zoomed out)
};

export const CAMERA_ZOOM = {
  focused: 1.15,    // zoomed in on individual framework
  center: 1.0,      // neutral at VS moment
  overview: 0.72,   // pulled back to show both
};
