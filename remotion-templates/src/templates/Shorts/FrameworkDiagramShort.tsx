/**
 * FrameworkDiagramShort — vertical 9:16 framework diagram for Shorts.
 *
 * Adapts FrameworkDiagram for vertical layout using ShortsWrapper.
 * Stacks columns/nodes vertically with staggered fadeIn animation.
 */

import React from "react";
import {
  palette,
  fonts,
  fontWeights,
  sec,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import type { FrameworkDiagramData } from "../FrameworkDiagram/types";

export const FrameworkDiagramShort: React.FC<{ data: FrameworkDiagramData }> = ({
  data,
}) => {
  return (
    <ShortsWrapper
      title={data.title}
      subtitle={data.subtitle}
      mode={data.backgroundVariant}
    >
      {(vl, theme, frame, exit) => {
        const startDelay = sec(0.3);
        const itemStagger = sec(0.25);
        const itemFadeDuration = sec(0.4);

        if (data.variant === "comparison" && data.columns) {
          // Comparison columns — stack vertically
          return (
            <div
              style={{
                position: "absolute",
                top: vl.contentTop,
                left: vl.safeArea.left,
                right: vl.safeArea.right,
                bottom: vl.safeArea.bottom,
                display: "flex",
                flexDirection: "column",
                gap: vl.spacing.lg,
              }}
            >
              {data.columns.map((column, colIdx) => {
                const itemStart = startDelay + colIdx * itemStagger;
                const itemOpacity = fadeIn(frame, itemStart, itemFadeDuration) * exit;
                const bgColor = column.color || palette.amber;

                return (
                  <div
                    key={colIdx}
                    style={{
                      opacity: itemOpacity,
                      padding: vl.spacing.md,
                      borderRadius: 8,
                      background: `${bgColor}20`,
                      borderLeft: `4px solid ${bgColor}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: vl.fontSizes.label,
                        fontWeight: fontWeights.semibold,
                        color: theme.text.primary,
                        fontFamily: fonts.heading,
                        marginBottom: vl.spacing.sm,
                        textShadow: theme.textShadow,
                      }}
                    >
                      {column.icon && <span style={{ marginRight: 8 }}>{column.icon}</span>}
                      {column.title}
                    </div>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {column.items.map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          style={{
                            fontSize: vl.fontSizes.body,
                            color: theme.text.secondary,
                            fontFamily: fonts.body,
                            textShadow: theme.textShadow,
                          }}
                        >
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        }

        if (data.variant === "flow" && data.nodes) {
          // Flow nodes — stack vertically with arrow labels
          return (
            <div
              style={{
                position: "absolute",
                top: vl.contentTop,
                left: vl.safeArea.left,
                right: vl.safeArea.right,
                bottom: vl.safeArea.bottom,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: vl.spacing.lg,
              }}
            >
              {data.nodes.map((node, nodeIdx) => {
                const nodeStart = startDelay + nodeIdx * itemStagger;
                const nodeOpacity = fadeIn(frame, nodeStart, itemFadeDuration) * exit;
                const nodeColor = node.color || palette.amber;

                return (
                  <div key={nodeIdx} style={{ opacity: nodeOpacity, width: "100%" }}>
                    <div
                      style={{
                        padding: vl.spacing.md,
                        borderRadius: 8,
                        background: `${nodeColor}30`,
                        border: `2px solid ${nodeColor}`,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: vl.fontSizes.label,
                          fontWeight: fontWeights.semibold,
                          color: theme.text.primary,
                          fontFamily: fonts.heading,
                          textShadow: theme.textShadow,
                        }}
                      >
                        {node.label}
                      </div>
                      {node.sublabel && (
                        <div
                          style={{
                            fontSize: vl.fontSizes.caption,
                            color: theme.text.muted,
                            fontFamily: fonts.body,
                            marginTop: 4,
                            textShadow: theme.textShadow,
                          }}
                        >
                          {node.sublabel}
                        </div>
                      )}
                    </div>

                    {/* Arrow label between nodes */}
                    {nodeIdx < data.nodes.length - 1 && data.arrowLabels?.[nodeIdx] && (
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: vl.fontSizes.caption,
                          color: theme.text.muted,
                          fontFamily: fonts.body,
                          marginTop: vl.spacing.sm,
                          marginBottom: vl.spacing.sm,
                          textShadow: theme.textShadow,
                        }}
                      >
                        ↓ {data.arrowLabels[nodeIdx]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        if (data.variant === "matrix" && data.cells) {
          // Matrix as text-based table — simple rows
          const rows = data.rowHeaders || [];
          const cols = data.colHeaders || [];

          return (
            <div
              style={{
                position: "absolute",
                top: vl.contentTop,
                left: vl.safeArea.left,
                right: vl.safeArea.right,
                bottom: vl.safeArea.bottom,
                display: "flex",
                flexDirection: "column",
                gap: vl.spacing.md,
              }}
            >
              {/* Column headers */}
              {cols.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: vl.spacing.sm,
                    opacity: fadeIn(frame, startDelay, itemFadeDuration) * exit,
                  }}
                >
                  <div style={{ flex: 0.5 }} />
                  {cols.map((col, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        fontSize: vl.fontSizes.caption,
                        fontWeight: fontWeights.semibold,
                        color: theme.text.primary,
                        fontFamily: fonts.heading,
                        textShadow: theme.textShadow,
                      }}
                    >
                      {col}
                    </div>
                  ))}
                </div>
              )}

              {/* Row with cells */}
              {rows.map((rowLabel, rowIdx) => {
                const rowStart = startDelay + (1 + rowIdx) * itemStagger;
                const rowOpacity = fadeIn(frame, rowStart, itemFadeDuration) * exit;

                return (
                  <div
                    key={rowIdx}
                    style={{
                      display: "flex",
                      gap: vl.spacing.sm,
                      opacity: rowOpacity,
                    }}
                  >
                    <div
                      style={{
                        flex: 0.5,
                        fontSize: vl.fontSizes.caption,
                        fontWeight: fontWeights.semibold,
                        color: theme.text.primary,
                        fontFamily: fonts.heading,
                        textShadow: theme.textShadow,
                      }}
                    >
                      {rowLabel}
                    </div>
                    {cols.map((_, colIdx) => {
                      const cell = data.cells?.find(
                        (c) => c.row === rowIdx && c.col === colIdx
                      );
                      const cellColor = cell?.color || palette.amber;
                      const bgColor = cell?.highlight
                        ? `${cellColor}40`
                        : `${cellColor}15`;

                      return (
                        <div
                          key={`${rowIdx}-${colIdx}`}
                          style={{
                            flex: 1,
                            padding: vl.spacing.sm,
                            borderRadius: 4,
                            background: bgColor,
                            border: `1px solid ${cellColor}40`,
                            fontSize: vl.fontSizes.caption,
                            color: theme.text.secondary,
                            fontFamily: fonts.body,
                            textAlign: "center",
                            textShadow: theme.textShadow,
                          }}
                        >
                          {cell?.label || "—"}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        }

        return null;
      }}
    </ShortsWrapper>
  );
};
