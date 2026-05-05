/**
 * labelStack — collision-avoidance for chart annotations and inline labels.
 *
 * When labels cluster horizontally (multiple events in the same year on a
 * timeline, neighboring bar values, etc.), they overlap. This util computes
 * a vertical stack offset for each label so they push downward in steps
 * rather than colliding.
 *
 * Algorithm: sort labels by x position. For each label, look back through
 * earlier labels and increase its stack level by 1 for every prior label
 * within the collision threshold. Result: clusters cascade downward; lone
 * labels stay at level 0.
 *
 * Originally inline in TimeSeriesChart's annotation render. Extracted here
 * so DataChart bar values, NetworkDiagram callouts, and any future
 * chart-with-labels template can use the same logic.
 */

export interface StackableItem {
  /** Pixel x-position of the label's anchor */
  xPx: number;
}

export interface LabelStackOptions {
  /**
   * Two labels with x-positions within this many pixels of each other are
   * considered colliding. Default 80 — works well for ~150px label widths.
   */
  collisionThreshold?: number;
}

/**
 * Compute the stack level (0, 1, 2, ...) for each item. Multiply this by
 * your row height to get the vertical offset to apply.
 *
 * @returns array of stack levels in the same order as the input items
 *
 * @example
 *   const items = annotations.map(a => ({ xPx: getXPosition(a.x) }));
 *   const stacks = computeLabelStacks(items, { collisionThreshold: 80 });
 *   const yOffset = stacks[i] * 40;
 */
export function computeLabelStacks<T extends StackableItem>(
  items: T[],
  options: LabelStackOptions = {}
): number[] {
  const { collisionThreshold = 80 } = options;
  if (items.length === 0) return [];

  // Pair each item with its original index, then sort by x.
  const indexed = items.map((item, idx) => ({ item, idx }));
  indexed.sort((a, b) => a.item.xPx - b.item.xPx);

  const stacks: number[] = new Array(items.length).fill(0);
  for (let i = 0; i < indexed.length; i++) {
    let stack = 0;
    for (let j = 0; j < i; j++) {
      const dx = Math.abs(indexed[i].item.xPx - indexed[j].item.xPx);
      if (dx < collisionThreshold) {
        stack = Math.max(stack, stacks[indexed[j].idx] + 1);
      }
    }
    stacks[indexed[i].idx] = stack;
  }
  return stacks;
}
