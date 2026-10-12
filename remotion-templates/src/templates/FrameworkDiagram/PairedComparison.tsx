/**
 * PairedComparison — the comparison variant laid out row by row.
 *
 * The default comparison variant stacks two independent lists side by side,
 * which suits "here are A's traits, here are B's". When the argument is in
 * the pairing — this helper is checked by that body; on this dimension the
 * car did X and the model did Y — the rows have to line up, and each pair has
 * to arrive together. Opt in with `comparisonLayout: "paired"`.
 *
 *   columns[0].items[i]  ←→  columns[1].items[i]      (same length)
 *   rowLabels[i]         optional label at the left of row i
 *   rowAtSec[i]          when row i arrives: one time for the pair, or
 *                        [left, right] to land each side on its own phrase
 *   connector            "arrow" (left is acted on by right) | "none"
 *   keyRow               index of the row that carries the point
 *
 * Column colours are ignored here on purpose: the two sides are told apart by
 * position and heading, and gold is kept for the key row.
 *
 * Rendered inside FrameworkDiagram, which owns the composition lifecycle.
 * @composition-animation: delegated
 */

import React from "react";
import { interpolate } from "remotion";
import { fonts, fontSizes, layout, palette, sec } from "../../design/theme";
import { CLAMP_DECELERATE, fadeIn, slideIn } from "../../utils/animation";
import type { FrameworkDiagramData } from "./types";

const ROW_RISE_PX = 14;
const HEADER_AT_SEC = 0.4;
const DEFAULT_FIRST_ROW_SEC = 1.2;
const DEFAULT_ROW_STEP_SEC = 1.6;
/** With an arrow, the right-hand cell follows the left by this much. */
const ARROW_LAG_SEC = 0.8;

interface PairedComparisonProps {
  data: FrameworkDiagramData;
  frame: number;
  isDark: boolean;
  textPrimary: string;
  /** Headings and row labels. Use the secondary text tone: muted fails contrast at this size. */
  textMuted: string;
  accentColor: string;
}

export const PairedComparison: React.FC<PairedComparisonProps> = ({
  data,
  frame,
  isDark,
  textPrimary,
  textMuted,
  accentColor,
}) => {
  const [left, right] = data.columns ?? [];
  if (!left || !right) return null;

  const rowCount = Math.min(left.items.length, right.items.length);
  const labels = data.rowLabels ?? [];
  const hasLabels = labels.length > 0;
  const arrow = (data.connector ?? "arrow") === "arrow";
  const roomy = rowCount <= 3;

  const labelW = hasLabels ? 270 : 0;
  const colW = hasLabels ? 590 : 540;
  const gutterW = arrow ? 150 : 90;
  const cellSize = roomy ? 44 : 34;
  const rowGap = roomy ? 48 : 30;
  const rule = isDark ? palette.walnut : palette.sand;

  const rowTimes = (i: number): [number, number] => {
    const at = data.rowAtSec?.[i];
    if (Array.isArray(at)) return [at[0], at[1]];
    const t = at ?? DEFAULT_FIRST_ROW_SEC + i * DEFAULT_ROW_STEP_SEC;
    return [t, t + (arrow ? ARROW_LAG_SEC : 0)];
  };

  const areaTop = 230;
  const areaBottom = layout.height - layout.safeAreaTier.generous.bottom;

  const headerOpacity = fadeIn(frame, sec(HEADER_AT_SEC), sec(0.6));
  const headerStyle: React.CSSProperties = {
    fontFamily: fonts.metadata,
    fontSize: fontSizes.readable, // was 22
    fontWeight: 500,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: textMuted,
    paddingBottom: 14,
    borderBottom: `1px solid ${rule}`,
    opacity: headerOpacity,
  };

  const cells: React.ReactNode[] = [];
  // Header row.
  if (hasLabels) cells.push(<div key="h-l" />);
  cells.push(
    <div key="h-a" style={headerStyle}>{left.title}</div>,
    <div key="h-g" />,
    <div key="h-b" style={headerStyle}>{right.title}</div>,
  );

  for (let i = 0; i < rowCount; i++) {
    const [tl, tr] = rowTimes(i);
    const isKey = data.keyRow === i;
    const leftStyle = reveal(frame, tl);
    const rightStyle = reveal(frame, tr);
    const cellStyle: React.CSSProperties = {
      fontFamily: fonts.serifBody,
      fontSize: isKey ? cellSize + 6 : cellSize,
      fontWeight: isKey ? 500 : 400,
      lineHeight: 1.25,
      letterSpacing: "-0.005em",
      color: textPrimary,
    };
    // Every row reserves the rail's width so first letters stay aligned;
    // only the key row paints it.
    const rail: React.CSSProperties = {
      borderLeft: `3px solid ${isKey ? accentColor : "transparent"}`,
      paddingLeft: 18,
      marginLeft: -21,
    };

    if (hasLabels) {
      cells.push(
        <div
          key={`l-${i}`}
          style={{
            ...leftStyle,
            ...rail,
            fontFamily: fonts.metadata,
            fontSize: fontSizes.readable, // was 22
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: textMuted,
            // Sit on the first line of the cell text beside it.
            paddingTop: cellSize * 0.42,
          }}
        >
          {labels[i] ?? ""}
        </div>,
      );
    }
    cells.push(
      <div key={`a-${i}`} style={{ ...cellStyle, ...leftStyle, ...(hasLabels ? {} : rail) }}>
        {left.items[i]}
      </div>,
      <div key={`g-${i}`} style={{ height: cellSize * 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {arrow && (
          <Arrow
            progress={interpolate(frame, [sec(tr - 0.5), sec(tr)], [0, 1], CLAMP_DECELERATE)}
            color={isKey ? accentColor : palette.umber}
            width={gutterW - 56}
          />
        )}
      </div>,
      <div key={`b-${i}`} style={{ ...cellStyle, ...rightStyle }}>
        {right.items[i]}
      </div>,
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: areaTop,
        height: areaBottom - areaTop,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${hasLabels ? `${labelW}px ` : ""}${colW}px ${gutterW}px ${colW}px`,
          columnGap: 0,
          rowGap,
          alignItems: "start",
        }}
      >
        {cells}
      </div>
    </div>
  );
};

/** Fade and rise a cell into place from `atSec`. */
function reveal(frame: number, atSec: number): React.CSSProperties {
  return {
    opacity: fadeIn(frame, sec(atSec), sec(0.6)),
    transform: `translateY(${slideIn(frame, sec(atSec), ROW_RISE_PX, sec(0.6))}px)`,
  };
}

const Arrow: React.FC<{ progress: number; color: string; width: number }> = ({
  progress,
  color,
  width,
}) => {
  if (progress <= 0) return null;
  const x = width * progress;
  return (
    <svg width={width} height={16} viewBox={`0 0 ${width} 16`} style={{ overflow: "visible" }}>
      <line x1={0} y1={8} x2={x} y2={8} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <path
        d={`M ${x - 9} 2 L ${x} 8 L ${x - 9} 14`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={progress}
      />
    </svg>
  );
};
