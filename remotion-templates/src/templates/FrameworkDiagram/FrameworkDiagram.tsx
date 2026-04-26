/**
 * FrameworkDiagram — conceptual framework visualizations.
 *
 * Three variants:
 * - "comparison": Side-by-side columns (e.g., Chess vs Go strategy)
 * - "flow": Sequential nodes with arrows (e.g., escalation ladder)
 * - "matrix": Grid with highlighted cells (e.g., 2×2 strategy matrix)
 *
 * EP01 use case: Chess vs Go — Western vs Chinese strategic thinking.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { palette, dark, semantic, fonts, fontSizes, layout, sec } from "../../design/theme";
import { fadeIn, slideIn, stagger } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { Background } from "../../components/Background";
import { FadeIn } from "../../components/FadeIn";
import type { FrameworkDiagramData, ComparisonColumn, FlowNode } from "./types";

// ── Comparison variant ─────────────────────────────────────────────────────

const ComparisonVariant: React.FC<{
  data: FrameworkDiagramData;
  frame: number;
}> = React.memo(({ data, frame }) => {
  const columns = data.columns || [];
  const colWidth = useMemo(
    () => (layout.width - layout.safeArea.left - layout.safeArea.right - 80) / columns.length,
    [columns.length]
  );

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top + 100,
        left: layout.safeArea.left + 40,
        right: layout.safeArea.right + 40,
        bottom: layout.safeArea.bottom + 20,
        display: "flex",
        gap: 40,
        justifyContent: "center",
      }}
    >
      {columns.map((col, ci) => {
        const colStart = stagger(ci, sec(0.6), sec(0.5));
        const colOpacity = fadeIn(frame, colStart, sec(0.5));

        return (
          <div
            key={ci}
            style={{
              width: colWidth,
              opacity: colOpacity,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Column header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: `3px solid ${col.color || palette.amber}`,
              }}
            >
              {col.icon && (
                <span style={{ fontSize: 36 }}>{col.icon}</span>
              )}
              <div
                style={{
                  fontSize: fontSizes.h2,
                  fontWeight: 600,
                  color: dark.text.primary,
                  fontFamily: fonts.heading,
                }}
              >
                {col.title}
              </div>
            </div>

            {/* Items */}
            {col.items.map((item, ii) => {
              const itemStart = colStart + stagger(ii, sec(0.3), sec(0.4));
              const itemOpacity = fadeIn(frame, itemStart, sec(0.3));
              const itemSlide = slideIn(frame, itemStart, 16, sec(0.3));

              return (
                <div
                  key={ii}
                  style={{
                    opacity: itemOpacity,
                    transform: `translateY(${itemSlide}px)`,
                    fontSize: fontSizes.body,
                    color: dark.text.primary,
                    lineHeight: 1.6,
                    marginBottom: 16,
                    paddingLeft: 16,
                    borderLeft: `2px solid ${col.color || palette.amber}33`,
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* VS divider for 2-column comparisons */}
      {columns.length === 2 && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: fontSizes.h3,
            color: dark.text.muted,
            fontWeight: 700,
            fontFamily: fonts.mono,
            opacity: fadeIn(frame, sec(1.2), sec(0.5)),
          }}
        >
          vs
        </div>
      )}
    </div>
  );
});

// ── Flow variant ───────────────────────────────────────────────────────────

const FlowVariant: React.FC<{
  data: FrameworkDiagramData;
  frame: number;
}> = React.memo(({ data, frame }) => {
  const nodes = data.nodes || [];
  const arrowLabels = data.arrowLabels || [];
  const accentColor = data.accentColor || palette.amber;

  const nodeWidth = 240;
  const flowLayout = useMemo(() => {
    const totalWidth = nodes.length * nodeWidth + (nodes.length - 1) * 80;
    const startX = (layout.width - totalWidth) / 2;
    return { totalWidth, startX };
  }, [nodes.length]);

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top + 120,
        left: 0,
        right: 0,
        bottom: layout.safeArea.bottom,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
      }}
    >
      {nodes.map((node, i) => {
        const nodeStart = stagger(i, sec(0.8), sec(0.5));
        const nodeOpacity = fadeIn(frame, nodeStart, sec(0.4));
        const nodeSlide = slideIn(frame, nodeStart, 30, sec(0.4));
        const nodeColor = node.color || accentColor;

        return (
          <React.Fragment key={i}>
            {/* Node */}
            <div
              style={{
                opacity: nodeOpacity,
                transform: `translateX(${nodeSlide}px)`,
                width: nodeWidth,
                padding: "28px 20px",
                borderRadius: 8,
                border: `2px solid ${nodeColor}`,
                backgroundColor: `${nodeColor}15`,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.h3,
                  color: dark.text.primary,
                  fontWeight: 600,
                }}
              >
                {node.label}
              </div>
              {node.sublabel && (
                <div
                  style={{
                    fontSize: fontSizes.caption,
                    color: dark.text.muted,
                    marginTop: 8,
                  }}
                >
                  {node.sublabel}
                </div>
              )}
            </div>

            {/* Arrow between nodes */}
            {i < nodes.length - 1 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 80,
                  flexShrink: 0,
                  opacity: fadeIn(
                    frame,
                    stagger(i, sec(0.8), sec(0.5)) + sec(0.3),
                    sec(0.3)
                  ),
                }}
              >
                <svg width="80" height="24" viewBox="0 0 80 24">
                  <line
                    x1="0"
                    y1="12"
                    x2="65"
                    y2="12"
                    stroke={dark.text.muted}
                    strokeWidth="2"
                  />
                  <polygon
                    points="65,6 77,12 65,18"
                    fill={dark.text.muted}
                  />
                </svg>
                {arrowLabels[i] && (
                  <div
                    style={{
                      fontSize: fontSizes.small,
                      color: dark.text.muted,
                      marginTop: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {arrowLabels[i]}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

// ── Matrix variant ─────────────────────────────────────────────────────────

const MatrixVariant: React.FC<{
  data: FrameworkDiagramData;
  frame: number;
}> = React.memo(({ data, frame }) => {
  const rowHeaders = data.rowHeaders || [];
  const colHeaders = data.colHeaders || [];
  const cells = data.cells || [];
  const accentColor = data.accentColor || palette.amber;

  const cellSize = 200;
  const headerWidth = 180;

  const cellLookup = useMemo(() => {
    const map = new Map<string, typeof cells[number]>();
    for (const cell of cells) {
      map.set(`${cell.row}-${cell.col}`, cell);
    }
    return map;
  }, [cells]);

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top + 120,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div>
        {/* Column headers row */}
        <div style={{ display: "flex", marginLeft: headerWidth }}>
          {colHeaders.map((ch, ci) => (
            <div
              key={ci}
              style={{
                width: cellSize,
                textAlign: "center",
                fontSize: fontSizes.caption,
                color: dark.text.muted,
                fontWeight: 600,
                padding: "12px 8px",
                opacity: fadeIn(frame, stagger(ci, sec(0.3), sec(0.5)), sec(0.3)),
              }}
            >
              {ch}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rowHeaders.map((rh, ri) => (
          <div key={ri} style={{ display: "flex", alignItems: "center" }}>
            {/* Row header */}
            <div
              style={{
                width: headerWidth,
                fontSize: fontSizes.caption,
                color: dark.text.muted,
                fontWeight: 600,
                textAlign: "right",
                paddingRight: 20,
                opacity: fadeIn(
                  frame,
                  stagger(ri, sec(0.3), sec(0.5)),
                  sec(0.3)
                ),
              }}
            >
              {rh}
            </div>

            {/* Cells in this row */}
            {colHeaders.map((_, ci) => {
              const cell = cellLookup.get(`${ri}-${ci}`);
              const cellStart = stagger(
                ri * colHeaders.length + ci,
                sec(0.2),
                sec(0.8)
              );
              const cellOpacity = fadeIn(frame, cellStart, sec(0.3));
              const cellColor = cell?.color || palette.midnight;
              const isHighlight = cell?.highlight;

              return (
                <div
                  key={ci}
                  style={{
                    width: cellSize,
                    height: cellSize * 0.6,
                    margin: 4,
                    borderRadius: 6,
                    border: `2px solid ${isHighlight ? accentColor : cellColor}44`,
                    backgroundColor: isHighlight
                      ? `${accentColor}20`
                      : `${cellColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: cellOpacity,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      color: isHighlight ? accentColor : dark.text.primary,
                      textAlign: "center",
                      fontWeight: isHighlight ? 600 : 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {cell?.label || ""}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Main component ──────────────────────────────────────────────────────────

export const FrameworkDiagram: React.FC<{ data: FrameworkDiagramData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation();
  const bgVariant = data.backgroundVariant || "dark";

  return (
    <Background variant={bgVariant}>
      <AbsoluteFill style={compStyle}>
        {/* Title */}
        <FadeIn startFrame={0} direction="up" distance={20}>
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top,
            left: layout.safeArea.left,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h2,
              fontWeight: 600,
              color: dark.text.primary,
              fontFamily: fonts.heading,
            }}
          >
            {data.title}
          </div>
          {data.subtitle && (
            <div
              style={{
                fontSize: fontSizes.body,
                color: dark.text.muted,
                marginTop: 6,
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>
        </FadeIn>

        {/* Diagram content */}
        {data.variant === "comparison" && (
          <ComparisonVariant data={data} frame={frame} />
        )}
        {data.variant === "flow" && (
          <FlowVariant data={data} frame={frame} />
        )}
        {data.variant === "matrix" && (
          <MatrixVariant data={data} frame={frame} />
        )}

        {/* Episode label */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            left: layout.safeArea.left,
            fontSize: fontSizes.label,
            color: dark.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: fadeIn(frame, 0, sec(1)),
          }}
        >
          {data.episode}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
