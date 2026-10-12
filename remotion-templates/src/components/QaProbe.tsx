/**
 * QaProbe — measures rendered text for `scripts/qa-episode.mjs`.
 *
 * Mounted by FullEpisode only in QA mode (see utils/qaMode.ts). After fonts
 * load and layout settles, it walks every visible text node in the frame and
 * logs one `QA_PROBE <json>` console line: box, effective font size (after
 * CSS transforms), colour, effective opacity, weight, nearest clipping box and
 * a role (`chrome` / `source` / `content`) taken from the nearest
 * `data-qa-role` ancestor. The QA script reads it via renderStill's
 * `onBrowserLog` and does all pass/fail logic in Node, where the rendered
 * pixels are available for contrast.
 */
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";

interface ProbeItem {
  /** Index of the source text node; lines of one wrapped run share it. */
  node: number;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontPx: number;
  weight: number;
  color: string;
  opacity: number;
  role: string;
  clip: [number, number, number, number] | null;
}

function effectiveOpacity(el: Element | null): number {
  let o = 1;
  let cur: Element | null = el;
  while (cur && cur !== document.body) {
    const v = parseFloat(getComputedStyle(cur).opacity);
    if (!Number.isNaN(v)) o *= v;
    cur = cur.parentElement;
  }
  return o;
}

function roleOf(el: Element): string {
  if (el.closest(".katex")) return "math";
  const tagged = el.closest("[data-qa-role]");
  return tagged?.getAttribute("data-qa-role") ?? "content";
}

function clipBoxOf(el: Element): [number, number, number, number] | null {
  let cur: Element | null = el.parentElement;
  while (cur && cur !== document.body) {
    const cs = getComputedStyle(cur);
    if (cs.overflow === "hidden" || cs.overflowX === "hidden" || cs.overflowY === "hidden") {
      const r = cur.getBoundingClientRect();
      return [r.left, r.top, r.right, r.bottom];
    }
    cur = cur.parentElement;
  }
  return null;
}

function transformScale(el: HTMLElement | SVGElement): number {
  // Ratio of rendered width to layout width captures ancestor scale() transforms
  // (e.g. SplitFrame panes rendered at ~0.5).
  if (el instanceof HTMLElement && el.offsetWidth > 0) {
    return el.getBoundingClientRect().width / el.offsetWidth;
  }
  return 1;
}

function measure(): ProbeItem[] {
  const items: ProbeItem[] = [];
  let nodeIndex = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const opacity = effectiveOpacity(el);
    if (opacity < 0.05) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    // One box per rendered line: a run that wraps has a bounding rect spanning
    // every line it touches, which reads as a false overlap with its neighbours.
    const lines: Array<{ l: number; t: number; r: number; b: number }> = [];
    for (const cr of Array.from(range.getClientRects())) {
      if (cr.width < 1 || cr.height < 1) continue;
      const same = lines.find((ln) => Math.abs(ln.t - cr.top) < cr.height / 2);
      if (same) {
        same.l = Math.min(same.l, cr.left);
        same.r = Math.max(same.r, cr.right);
        same.t = Math.min(same.t, cr.top);
        same.b = Math.max(same.b, cr.bottom);
      } else {
        lines.push({ l: cr.left, t: cr.top, r: cr.right, b: cr.bottom });
      }
    }
    if (!lines.length) continue;
    const fontPx = parseFloat(cs.fontSize) * transformScale(el);
    const shared = {
      node: nodeIndex++,
      text: text.slice(0, 120),
      fontPx: Math.round(fontPx * 10) / 10,
      weight: parseInt(cs.fontWeight, 10) || 400,
      color: cs.fill && el instanceof SVGElement ? cs.fill : cs.color,
      opacity: Math.round(opacity * 100) / 100,
      role: roleOf(el),
      clip: clipBoxOf(el),
    };
    for (const ln of lines) {
      items.push({
        ...shared,
        x: Math.round(ln.l),
        y: Math.round(ln.t),
        w: Math.round(ln.r - ln.l),
        h: Math.round(ln.b - ln.t),
      });
    }
  }
  return items;
}

export const QaProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender("QaProbe measuring"));
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      // Two rAFs: let any frame-driven layout settle before measuring.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (cancelled) return;
          // eslint-disable-next-line no-console
          console.log(`QA_PROBE ${JSON.stringify({ frame, items: measure(), fontFaces: document.fonts.size })}`);
          continueRender(handle);
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [frame, handle]);
  return null;
};
