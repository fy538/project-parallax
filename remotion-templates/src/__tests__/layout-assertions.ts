/**
 * layout-assertions.ts — Generic zone integrity helpers for Parallax layout QA.
 *
 * These helpers operate on `NamedBox` objects (a BoundingBox with a display name)
 * and throw descriptive errors on failure. They are intentionally template-agnostic
 * so they can be reused across chartLayout, templateLayout, or any future
 * layout system that produces named rectangular zones.
 *
 * Usage:
 *   import { assertZoneIntegrity } from "./layout-assertions";
 *   const zones = toNamedBoxes(chartLayout({ hasLegend: true, hasSource: true }));
 *   assertZoneIntegrity(zones, layout.width, layout.height);
 *
 * Design rule: functions collect all violations before throwing so a single
 * failure shows every problem at once rather than stopping at the first one.
 */

/** Minimal bounding box — matches chartLayout's BoundingBox and useTemplateLayout's Rect core. */
export interface ZoneRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface NamedBox {
  name: string;
  box: ZoneRect;
}

// ── Internal geometry helpers ─────────────────────────────────────────────────

function rectBottom(r: ZoneRect): number {
  return r.top + r.height;
}

function rectRight(r: ZoneRect): number {
  return r.left + r.width;
}

function isActive(r: ZoneRect): boolean {
  return r.height > 0 && r.width > 0;
}

/**
 * Returns true if two active (non-zero) boxes overlap in 2D space.
 * Uses strict inequality: touching edges (bottom == top) are NOT an overlap.
 */
function overlaps2D(a: ZoneRect, b: ZoneRect): boolean {
  if (!isActive(a) || !isActive(b)) return false;
  const vertOverlap = a.top < rectBottom(b) && b.top < rectBottom(a);
  const horizOverlap = a.left < rectRight(b) && b.left < rectRight(a);
  return vertOverlap && horizOverlap;
}

// ── Public assertion functions ────────────────────────────────────────────────

/**
 * Assert that no two named boxes overlap in 2D space.
 * Zero-height or zero-width boxes are skipped (not rendered).
 */
export function assertNoOverlap(zones: NamedBox[]): void {
  const issues: string[] = [];
  const active = zones.filter((z) => isActive(z.box));

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (overlaps2D(a.box, b.box)) {
        issues.push(
          `"${a.name}" collides with "${b.name}"\n` +
            `    ${a.name}: top=${a.box.top} h=${a.box.height} → bottom=${rectBottom(a.box)}\n` +
            `    ${b.name}: top=${b.box.top} h=${b.box.height} → bottom=${rectBottom(b.box)}`
        );
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `Zone collision(s) detected:\n  · ${issues.join("\n  · ")}`
    );
  }
}

/**
 * Assert that all named boxes fit inside the canvas frame.
 * Zero-height/zero-width boxes are skipped.
 */
export function assertInBounds(
  zones: NamedBox[],
  canvasWidth: number,
  canvasHeight: number
): void {
  const issues: string[] = [];

  for (const { name, box } of zones) {
    if (!isActive(box)) continue;

    if (box.top < 0) {
      issues.push(`"${name}" top (${box.top}) is above the canvas`);
    }
    if (box.left < 0) {
      issues.push(`"${name}" left (${box.left}) is left of the canvas`);
    }
    if (rectBottom(box) > canvasHeight) {
      issues.push(
        `"${name}" bottom (${rectBottom(box)}) exceeds canvas height (${canvasHeight})`
      );
    }
    if (rectRight(box) > canvasWidth) {
      issues.push(
        `"${name}" right edge (${rectRight(box)}) exceeds canvas width (${canvasWidth})`
      );
    }
  }

  if (issues.length > 0) {
    throw new Error(`Out-of-bounds zone(s):\n  · ${issues.join("\n  · ")}`);
  }
}

/**
 * Assert that no named box has negative width or height.
 */
export function assertPositiveDimensions(zones: NamedBox[]): void {
  const issues: string[] = [];

  for (const { name, box } of zones) {
    if (box.width < 0) {
      issues.push(`"${name}" has negative width (${box.width})`);
    }
    if (box.height < 0) {
      issues.push(`"${name}" has negative height (${box.height})`);
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `Negative dimension(s) detected:\n  · ${issues.join("\n  · ")}`
    );
  }
}

/**
 * Assert that a zone is horizontally centered within the canvas (±tolerance px).
 * Useful for full-width centered layouts; not applicable to split or offset zones.
 */
export function assertCentered(
  zone: NamedBox,
  canvasWidth: number,
  tolerance = 2
): void {
  const { name, box } = zone;
  const leftMargin = box.left;
  const rightMargin = canvasWidth - rectRight(box);
  const drift = Math.abs(leftMargin - rightMargin);

  if (drift > tolerance) {
    throw new Error(
      `"${name}" is not centered: left margin=${leftMargin}px, right margin=${rightMargin}px, ` +
        `drift=${drift}px (tolerance=${tolerance}px)`
    );
  }
}

/**
 * Assert that a zone has at least `minHeight` pixels of height.
 * Catches layout configs so dense they crush the chart area to nothing.
 */
export function assertMinHeight(zone: NamedBox, minHeight: number): void {
  const { name, box } = zone;
  if (box.height < minHeight) {
    throw new Error(
      `"${name}" is too short to be usable: ${box.height}px (minimum ${minHeight}px)`
    );
  }
}

/**
 * Composite integrity check: positive dimensions → in bounds → no overlaps.
 *
 * This is the single-call check for test suites that just want "is this layout
 * sane?" without caring which specific assertion failed first.
 */
export function assertZoneIntegrity(
  zones: NamedBox[],
  canvasWidth: number,
  canvasHeight: number
): void {
  assertPositiveDimensions(zones);
  assertInBounds(zones, canvasWidth, canvasHeight);
  assertNoOverlap(zones);
}
