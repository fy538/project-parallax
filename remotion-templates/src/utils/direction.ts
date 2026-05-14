/**
 * Direction-block utilities — small helpers for manipulating the `_direction`
 * block on template data objects. Originally introduced in
 * `src/catalog/Showreel.tsx` (the `still()` helper) and promoted to a shared
 * util on May 14, 2026 so contact sheets, episode-segment previews, and any
 * future "render this template at rest" workflow can reuse the same overrides.
 *
 * These helpers don't touch the `useDirection` hook — they're pure data
 * transformations applied BEFORE the data reaches a template. The hook
 * downstream resolves the resulting `_direction` block normally.
 */

import type { DirectionBlock } from "../hooks/useDirection";

/**
 * Type guard: the input data has the standard `_direction?: ...` shape.
 * All Parallax template data types satisfy this — it's part of the
 * template-data contract.
 */
type HasDirection = { _direction?: unknown };

/**
 * Merge a partial direction-block override into an existing data object.
 * Spreads any existing `_direction` fields first, then overrides with
 * the provided partial. Returns the same TypeScript type as the input.
 *
 * Internal helper for the named overrides below. Not exported.
 */
const overrideDirection = <T extends HasDirection>(
  data: T,
  override: Partial<DirectionBlock>,
): T => ({
  ...data,
  _direction: {
    ...(typeof data._direction === "object" && data._direction !== null
      ? (data._direction as Record<string, unknown>)
      : {}),
    ...override,
  },
});

/**
 * Force a template-data object to render WITHOUT camera drift.
 * Sets `_direction.driftPreset` to `"none"`, regardless of what the
 * input declared. Other `_direction` fields (atmosphere, syncPoints,
 * etc.) are preserved.
 *
 * Primary use case: showreels, contact sheets, and back-to-back demo
 * grids where cycling drift across many segments creates visible
 * snap-back jolts at segment boundaries. Episodes that want their
 * cinematic drift get it from their own `_direction` block — this
 * helper only affects the render path that wraps with it.
 *
 * Example:
 *   <BeeswarmChart data={still(catalogDataData.beeswarmMilitarySpending)} />
 */
export const still = <T extends HasDirection>(data: T): T =>
  overrideDirection(data, { driftPreset: "none" });

/**
 * Force a template-data object to render with the `breathing` drift
 * register (sinusoidal scale oscillation 1.0 ↔ 1.008 on an 8s cycle,
 * no pan, no rotation). For long-held stat reveals where you want
 * presence without slip.
 *
 * Example:
 *   <StatReveal data={breathe(data)} />
 */
export const breathe = <T extends HasDirection>(data: T): T =>
  overrideDirection(data, { driftPreset: "breathing" });

/**
 * Force a template-data object to render with the `settle` drift
 * register (one-time scale settle during entrance, then HOLD).
 * For title cards, section dividers, frames that should establish
 * their composition cleanly then sit still.
 *
 * Example:
 *   <TitleTransition data={settle(data)} />
 */
export const settle = <T extends HasDirection>(data: T): T =>
  overrideDirection(data, { driftPreset: "settle" });

/**
 * Force a template-data object to render with the `sway` drift
 * register (bidirectional sinusoidal pan, net displacement zero).
 * For atmospheric photo plates and paper-texture title backgrounds
 * where you want subtle handheld feel without directional slip.
 *
 * Example:
 *   <PhotoMontage data={sway(data)} />
 */
export const sway = <T extends HasDirection>(data: T): T =>
  overrideDirection(data, { driftPreset: "sway" });

/**
 * Force a template-data object to render with the explicit
 * `documentary` (full Ken Burns) drift register. For atmospheric /
 * photo-driven segments only — NOT for charts (the 0.3° rotation
 * tilts axis baselines).
 *
 * Example:
 *   <ImageComposite data={documentary(data)} />
 */
export const documentary = <T extends HasDirection>(data: T): T =>
  overrideDirection(data, { driftPreset: "documentary" });
