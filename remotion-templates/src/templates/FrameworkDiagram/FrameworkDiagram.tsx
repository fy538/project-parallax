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
  useVideoConfig,
  interpolate,
} from "remotion";
import { palette, light, semantic, fonts, fontSizes, layout, sec, contentArea, columnLayout, cardPadding, textMaxWidth, shadows } from "../../design/theme";
import { TitleBlock } from "../../components/TitleBlock";
import { fadeIn, slideIn, stagger, exitFade, scaleReveal, bloomIntensity, CLAMP_QUAD } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { Background } from "../../components/Background";
import { FadeIn } from "../../components/FadeIn";
import type { FrameworkDiagramData, ComparisonColumn, FlowNode } from "./types";

// ── Comparison variant ─────────────────────────────────────────────────────

const ComparisonVariant: React.FC<{
  data: FrameworkDiagramData;
  frame: number;
}> = React.memo(({ data, frame }) => {
  const { durationInFrames } = useVideoConfig();
  const columns = data.columns || [];
  const cols = useMemo(
    () => columnLayout(columns.length, { titleVariant: "content" }),
    [columns.length]
  );

  return (
    <div
      style={{
        position: "absolute",
        top: cols.top,
        left: cols.left,
        right: cols.right,
        bottom: cols.bottom,
        display: "flex",
        gap: cols.gap,
        justifyContent: "center",
      }}
    >
      {columns.map((col, ci) => {
        const colStart = stagger(ci, sec(0.6), sec(0.5));
        const colOpacity = fadeIn(frame, colStart, sec(0.5));
        // Cinematic: columns scale in from 110%
        const colScale = scaleReveal(frame, colStart, sec(0.6), 1.1, 1.0);
        const colColor = col.color || palette.amber;

        return (
          <div
            key={ci}
            style={{
              width: cols.columnWidth,
              opacity: colOpacity,
              transform: `scale(${colScale})`,
              transformOrigin: "top center",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Column header — with accent glow + scaleX underline */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: layout.spacing.sm,
                marginBottom: layout.spacing.md,
                paddingBottom: layout.spacing.sm,
                position: "relative",
              }}
            >
              {/* Animated underline — scaleX from left */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${colColor}, ${colColor}40)`,
                  transform: `scaleX(${interpolate(frame, [colStart + sec(0.2), colStart + sec(0.7)], [0, 1], CLAMP_QUAD)})`,
                  transformOrigin: "left center",
                }}
              />
              {/* Subtle glow under the header border */}
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: colColor,
                  filter: "blur(8px)",
                  opacity: fadeIn(frame, colStart + sec(0.3), sec(0.4)) * 0.5,
                }}
              />
              {col.icon && (
                <span style={{ fontSize: 36 }}>{col.icon}</span>
              )}
              <div
                style={{
                  fontSize: fontSizes.h2,
                  fontWeight: 600,
                  color: light.text.primary,
                  fontFamily: fonts.heading,
                  textShadow: `0 0 20px ${colColor}25`,
                  maxWidth: textMaxWidth.h2,
                }}
              >
                {col.title}
              </div>
            </div>

            {/* Items — more dramatic stagger with scale entrance */}
            {col.items.map((item, ii) => {
              const itemStart = colStart + stagger(ii, sec(0.12), sec(0.4));
              const itemOpacity = fadeIn(frame, itemStart, sec(0.4));
              const itemSlide = slideIn(frame, itemStart, 30, sec(0.5));
              const itemScale = scaleReveal(frame, itemStart, sec(0.4), 1.05, 1.0);
              const itemExit = exitFade(frame, durationInFrames, 15);
              const itemColor = col.color || palette.amber;

              return (
                <div
                  key={ii}
                  style={{
                    opacity: itemOpacity * itemExit,
                    transform: `translateY(${itemSlide}px) scale(${itemScale})`,
                    transformOrigin: "left center",
                    marginBottom: layout.spacing.sm,
                    padding: cardPadding.css,
                    borderRadius: 8,
                    backgroundColor: `${itemColor}12`,
                    border: `1px solid ${itemColor}25`,
                    borderLeft: `3px solid ${itemColor}80`,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
                  }}
                >
                  <div
                    style={{
                      fontSize: fontSizes.body,
                      color: light.text.primary,
                      lineHeight: 1.5,
                      textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    }}
                  >
                    {item}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* VS divider for 2-column comparisons — cinematic scale entrance */}
      {columns.length === 2 && (() => {
        const vsScale = scaleReveal(frame, sec(1.0), sec(0.5), 1.3, 1.0);
        const vsBloom = bloomIntensity(frame, sec(1.0), sec(0.3), 0.4);
        return (
          <>
            {/* Bloom behind VS badge */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 120,
                height: 120,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${palette.amber}30 0%, transparent 70%)`,
                opacity: vsBloom,
                filter: "blur(20px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${vsScale})`,
                fontSize: fontSizes.h3,
                color: light.text.accent,
                fontWeight: 700,
                fontFamily: fonts.mono,
                opacity: fadeIn(frame, sec(1.0), sec(0.4)),
                backgroundColor: light.bg.elevated,
                border: `1px solid ${palette.amber}30`,
                boxShadow: `0 0 30px ${palette.amber}30, 0 4px 20px rgba(0,0,0,0.4)`,
                padding: cardPadding.css,
                borderRadius: 8,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              vs
            </div>
          </>
        );
      })()}
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

  const area = contentArea("content");
  const nodeWidth = textMaxWidth.node;
  const arrowGap = layout.spacing.xxxl;
  const flowLayout = useMemo(() => {
    const totalWidth = nodes.length * nodeWidth + (nodes.length - 1) * arrowGap;
    const startX = (layout.width - totalWidth) / 2;
    return { totalWidth, startX };
  }, [nodes.length]);

  return (
    <div
      style={{
        position: "absolute",
        top: area.top,
        left: area.left,
        right: area.right,
        bottom: area.bottom,
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
            {/* Node — cinematic scale + slide entrance */}
            <div
              style={{
                opacity: nodeOpacity,
                transform: `translateX(${nodeSlide}px) scale(${scaleReveal(frame, nodeStart, sec(0.5), 1.1, 1.0)})`,
                transformOrigin: "center center",
                width: nodeWidth,
                padding: cardPadding.css,
                borderRadius: 8,
                border: `2px solid ${nodeColor}`,
                backgroundColor: `${nodeColor}15`,
                textAlign: "center",
                flexShrink: 0,
                boxShadow: `${shadows.subtle}, 0 0 20px ${nodeColor}15`,
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.h3,
                  color: light.text.primary,
                  fontWeight: 600,
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                }}
              >
                {node.label}
              </div>
              {node.sublabel && (
                <div
                  style={{
                    fontSize: fontSizes.caption,
                    color: light.text.muted,
                    marginTop: layout.spacing.xs,
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                  }}
                >
                  {node.sublabel}
                </div>
              )}
            </div>

            {/* Arrow between nodes — animated line draw + arrowhead */}
            {i < nodes.length - 1 && (() => {
              const arrowStart = stagger(i, sec(0.8), sec(0.5)) + sec(0.3);
              const arrowDraw = interpolate(
                frame,
                [arrowStart, arrowStart + sec(0.5)],
                [65, 0],
                CLAMP_QUAD
              );
              const arrowOpacity = fadeIn(frame, arrowStart, sec(0.3));
              // Arrowhead fades in after line finishes drawing
              const headOpacity = fadeIn(frame, arrowStart + sec(0.4), sec(0.2));
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: arrowGap,
                    flexShrink: 0,
                    opacity: arrowOpacity,
                  }}
                >
                  <svg width="80" height="24" viewBox="0 0 80 24">
                    <line
                      x1="0"
                      y1="12"
                      x2="65"
                      y2="12"
                      stroke={accentColor}
                      strokeWidth="2"
                      strokeDasharray="65"
                      strokeDashoffset={arrowDraw}
                    />
                    <polygon
                      points="65,6 77,12 65,18"
                      fill={accentColor}
                      opacity={headOpacity}
                    />
                  </svg>
                  {arrowLabels[i] && (
                    <div
                      style={{
                        fontSize: fontSizes.small,
                        color: light.text.muted,
                        marginTop: 4,
                        whiteSpace: "nowrap",
                        opacity: fadeIn(frame, arrowStart + sec(0.3), sec(0.3)),
                        transform: `translateY(${slideIn(frame, arrowStart + sec(0.3), 8, sec(0.3))}px)`,
                      }}
                    >
                      {arrowLabels[i]}
                    </div>
                  )}
                </div>
              );
            })()}
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
        top: contentArea("content").top,
        left: contentArea("content").left,
        right: contentArea("content").right,
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
                color: light.text.muted,
                fontWeight: 600,
                padding: `${layout.spacing.sm}px ${layout.spacing.xs}px`,
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
                color: light.text.muted,
                fontWeight: 600,
                textAlign: "right",
                paddingRight: layout.spacing.md,
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
              const cellOpacity = fadeIn(frame, cellStart, sec(0.4));
              const cellScale = scaleReveal(frame, cellStart, sec(0.4), 1.08, 1.0);
              const cellSlideY = slideIn(frame, cellStart, 16, sec(0.4));
              const cellColor = cell?.color || palette.midnight;
              const isHighlight = cell?.highlight;

              return (
                <div
                  key={ci}
                  style={{
                    width: cellSize,
                    height: cellSize * 0.6,
                    margin: layout.spacing.xs / 2,
                    borderRadius: 6,
                    border: `2px solid ${isHighlight ? accentColor : cellColor}44`,
                    backgroundColor: isHighlight
                      ? `${accentColor}20`
                      : `${cellColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: cellOpacity,
                    transform: `translateY(${cellSlideY}px) scale(${cellScale})`,
                    transformOrigin: "center center",
                    padding: cardPadding.css,
                    boxShadow: isHighlight
                      ? `0 2px 12px rgba(0,0,0,0.25), 0 0 16px ${accentColor}30`
                      : "0 2px 12px rgba(0,0,0,0.25)",
                  }}
                >
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      color: isHighlight ? accentColor : light.text.primary,
                      textAlign: "center",
                      fontWeight: isHighlight ? 600 : 400,
                      lineHeight: 1.4,
                      textShadow: "0 1px 3px rgba(0,0,0,0.5)",
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
  const bgVariant = data.backgroundVariant || "light";

  return (
    <Background variant={bgVariant} tint={data.backgroundTint}>
      <AbsoluteFill style={compStyle}>
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={bgVariant}
        />

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

        {/* Episode label — slideIn (no naked fade) */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            left: layout.safeArea.left,
            fontSize: fontSizes.label,
            color: light.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: fadeIn(frame, 0, sec(1)),
            transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
          }}
        >
          {data.episode}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
