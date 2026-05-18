/**
 * OutcomePartition — 2D scenario field, recursively partitioned.
 *
 * Aesthetic C from the research report (2026-05-17). The decision space is
 * a rectangle; each decision is a single thin rule that subdivides the
 * rectangle. Each terminal region is a labeled outcome. Severity = fill
 * darkness (paper → walnut). Probability = area.
 *
 * Visual register: RAND Robust Decision Making partition plots + De Stijl
 * compositional logic. Pure position + thin rules. POLISH.md D1 by
 * construction — no card chrome possible.
 *
 * Reveal animation: rules draw progressively (0 → full length) per
 * `revealStep`, then leaf labels fade in over their region centroid.
 * Excellent for video — the geometric act of subdivision IS the reveal.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  layout,
  sec,
  textMaxWidth,
  titleHeight,
} from "../../design/theme";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { fadeIn, exitFade } from "../../utils/animation";
import type { OutcomePartitionData, Region } from "./types";

// ── Flattening helpers ──────────────────────────────────────────────────────

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResolvedSplit {
  rect: Rect;
  axis: "horizontal" | "vertical";
  at: number;
  cutX1: number;
  cutY1: number;
  cutX2: number;
  cutY2: number;
  revealStep: number;
  label?: string;
}

interface ResolvedLeaf {
  rect: Rect;
  label: string;
  sublabel?: string;
  severity: number;
  color?: string;
  revealStep: number;
  highlighted: boolean;
}

interface Resolved {
  splits: ResolvedSplit[];
  leaves: ResolvedLeaf[];
  /** Highest revealStep we saw, for auto-sequencing. */
  maxStep: number;
}

// Allocate a reveal step for one region. When the caller provided an
// explicit `revealStep`, honor it AND advance the cursor past it so any
// auto-assigned steps later in the walk don't collide with it. Without the
// `Math.max` bump, an explicit `revealStep: 5` followed by an implicit
// region would both land on step 5 — two reveals on the same beat.
const consumeRevealStep = (
  explicit: number | undefined,
  stepCursor: { value: number },
): number => {
  if (explicit !== undefined) {
    stepCursor.value = Math.max(stepCursor.value, explicit + 1);
    return explicit;
  }
  return stepCursor.value++;
};

const resolveRegion = (
  region: Region,
  rect: Rect,
  stepCursor: { value: number },
): { splits: ResolvedSplit[]; leaves: ResolvedLeaf[] } => {
  if (region.kind === "leaf") {
    const step = consumeRevealStep(region.revealStep, stepCursor);
    return {
      splits: [],
      leaves: [{
        rect,
        label: region.label,
        sublabel: region.sublabel,
        severity: region.severity ?? 0,
        color: region.color,
        revealStep: step,
        highlighted: Boolean(region.highlighted),
      }],
    };
  }
  // Split
  const step = consumeRevealStep(region.revealStep, stepCursor);
  let leftRect: Rect;
  let rightRect: Rect;
  let cutX1: number, cutY1: number, cutX2: number, cutY2: number;
  if (region.axis === "horizontal") {
    // Horizontal axis = vertical cut → divides left vs right
    const cutX = rect.x + rect.width * region.at;
    leftRect = { x: rect.x, y: rect.y, width: rect.width * region.at, height: rect.height };
    rightRect = { x: cutX, y: rect.y, width: rect.width * (1 - region.at), height: rect.height };
    cutX1 = cutX; cutY1 = rect.y; cutX2 = cutX; cutY2 = rect.y + rect.height;
  } else {
    // Vertical axis = horizontal cut → divides top vs bottom
    const cutY = rect.y + rect.height * region.at;
    leftRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height * region.at };
    rightRect = { x: rect.x, y: cutY, width: rect.width, height: rect.height * (1 - region.at) };
    cutX1 = rect.x; cutY1 = cutY; cutX2 = rect.x + rect.width; cutY2 = cutY;
  }
  const split: ResolvedSplit = {
    rect,
    axis: region.axis,
    at: region.at,
    cutX1, cutY1, cutX2, cutY2,
    revealStep: step,
    label: region.label,
  };
  const leftResolved = resolveRegion(region.children[0], leftRect, stepCursor);
  const rightResolved = resolveRegion(region.children[1], rightRect, stepCursor);
  return {
    splits: [split, ...leftResolved.splits, ...rightResolved.splits],
    leaves: [...leftResolved.leaves, ...rightResolved.leaves],
  };
};

const resolveAll = (root: Region, rect: Rect): Resolved => {
  const cursor = { value: 0 };
  const { splits, leaves } = resolveRegion(root, rect, cursor);
  const allSteps = [...splits, ...leaves].map((x) => x.revealStep);
  return { splits, leaves, maxStep: Math.max(0, ...allSteps) };
};

// ── Component ──────────────────────────────────────────────────────────────

export const OutcomePartition: React.FC<{ data: OutcomePartitionData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ noExit: true, ...direction.driftOptions });
  const { durationInFrames: totalFrames } = useVideoConfig();
  const mode = (data.backgroundVariant || "light") as "light" | "dark";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();
  const highlightColor = emphasis.primaryAccent;

  // Compute the partition rectangle (centered, leaving space for axis labels).
  const safe = layout.safeAreaTier.generous;
  const AXIS_LABEL_PAD = 60;
  const TOP_OFFSET = titleHeight.content + layout.spacing.xl;
  const rect: Rect = {
    x: safe.left + (data.yAxisLabel ? AXIS_LABEL_PAD : 0),
    y: safe.top + TOP_OFFSET,
    width: layout.width - safe.left - safe.right - (data.yAxisLabel ? AXIS_LABEL_PAD : 0),
    height:
      layout.height - safe.top - safe.bottom - TOP_OFFSET - (data.xAxisLabel ? AXIS_LABEL_PAD : 0) - 50,
  };

  const resolved = useMemo(() => resolveAll(data.root, rect), [data.root, rect.x, rect.y, rect.width, rect.height]);

  const exitOp = exitFade(frame, totalFrames, sec(0.5));

  // Reveal timing — each step lands ~0.55s apart, with the first at sec(0.4).
  const stepReveal = (step: number) => {
    const start = sec(0.4) + step * sec(0.55);
    return fadeIn(frame, start, sec(0.5));
  };
  // Line-draw progress 0..1 for splits.
  const lineDrawProgress = (step: number): number => {
    const start = sec(0.4) + step * sec(0.55);
    return interpolate(
      frame,
      [start, start + sec(0.7)],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) },
    );
  };

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={mode} metadata={data.episode} />
        <FooterStrip mode={mode} />

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={mode}
          safeAreaTier="generous"
          syncPoints={direction.syncPoints}
        />

        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            opacity: exitOp,
            overflow: "visible",
          }}
        >
          {/* Outer frame — a single hairline rect around the partition field.
              This is the only "chrome" — and it's a thin schematic boundary,
              not a card.  */}
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="none"
            stroke={theme.text.muted}
            strokeOpacity={0.35}
            strokeWidth={1}
          />

          {/* Leaf fills — drawn first so split rules sit above them */}
          {resolved.leaves.map((leaf, i) => {
            const op = stepReveal(leaf.revealStep);
            const fillColor =
              leaf.color ??
              (leaf.severity > 0
                ? palette.walnut
                : "transparent");
            const fillOpacity = leaf.color ? 0.15 : leaf.severity * 0.25;
            return (
              <rect
                key={`leaf-fill-${i}`}
                x={leaf.rect.x}
                y={leaf.rect.y}
                width={leaf.rect.width}
                height={leaf.rect.height}
                fill={fillColor}
                fillOpacity={fillOpacity * op}
              />
            );
          })}

          {/* Highlighted-leaf accent rule on the leading edge (left for
              horizontal splits, top for vertical splits — by convention
              the leading edge is where the eye enters the region) */}
          {resolved.leaves
            .filter((l) => l.highlighted)
            .map((leaf, i) => {
              const op = stepReveal(leaf.revealStep);
              return (
                <line
                  key={`leaf-accent-${i}`}
                  x1={leaf.rect.x}
                  y1={leaf.rect.y}
                  x2={leaf.rect.x}
                  y2={leaf.rect.y + leaf.rect.height}
                  stroke={highlightColor}
                  strokeWidth={3}
                  opacity={op}
                />
              );
            })}

          {/* Split rules — draw progressively, axis-aligned */}
          {resolved.splits.map((split, i) => {
            const progress = lineDrawProgress(split.revealStep);
            if (split.axis === "horizontal") {
              // Vertical line
              const drawY2 = split.cutY1 + (split.cutY2 - split.cutY1) * progress;
              return (
                <line
                  key={`split-${i}`}
                  x1={split.cutX1}
                  y1={split.cutY1}
                  x2={split.cutX2}
                  y2={drawY2}
                  stroke={theme.text.primary}
                  strokeOpacity={0.55}
                  strokeWidth={1.25}
                />
              );
            } else {
              const drawX2 = split.cutX1 + (split.cutX2 - split.cutX1) * progress;
              return (
                <line
                  key={`split-${i}`}
                  x1={split.cutX1}
                  y1={split.cutY1}
                  x2={drawX2}
                  y2={split.cutY2}
                  stroke={theme.text.primary}
                  strokeOpacity={0.55}
                  strokeWidth={1.25}
                />
              );
            }
          })}

          {/* Split labels — on the rule, mid-segment */}
          {resolved.splits
            .filter((s) => s.label)
            .map((split, i) => {
              const op = stepReveal(split.revealStep);
              const midX = (split.cutX1 + split.cutX2) / 2;
              const midY = (split.cutY1 + split.cutY2) / 2;
              const rotate = split.axis === "horizontal" ? -90 : 0;
              return (
                <g
                  key={`split-label-${i}`}
                  transform={`translate(${midX}, ${midY}) rotate(${rotate})`}
                  opacity={op}
                >
                  <rect
                    x={-70}
                    y={-9}
                    width={140}
                    height={18}
                    fill={mode === "dark" ? palette.midnight : palette.paper}
                    opacity={0.85}
                  />
                  <text
                    x={0}
                    y={4}
                    fontSize={fontSizes.meta}
                    fontFamily={fonts.metadata}
                    fill={theme.text.muted}
                    letterSpacing={1.2}
                    textAnchor="middle"
                  >
                    {split.label}
                  </text>
                </g>
              );
            })}

          {/* Leaf labels — centered in each region */}
          {resolved.leaves.map((leaf, i) => {
            const op = stepReveal(leaf.revealStep);
            const cx = leaf.rect.x + leaf.rect.width / 2;
            const cy = leaf.rect.y + leaf.rect.height / 2;
            const labelColor = leaf.highlighted
              ? highlightColor
              : theme.text.primary;
            return (
              <g key={`leaf-label-${i}`} opacity={op}>
                <text
                  x={cx}
                  y={cy}
                  fontSize={fontSizes.body}
                  fontFamily={fonts.display}
                  fontWeight={leaf.highlighted ? fontWeights.semibold : fontWeights.medium}
                  fill={labelColor}
                  textAnchor="middle"
                >
                  {leaf.label}
                </text>
                {leaf.sublabel && (
                  <text
                    x={cx}
                    y={cy + 22}
                    fontSize={fontSizes.caption}
                    fontFamily={fonts.body}
                    fill={theme.text.secondary}
                    textAnchor="middle"
                  >
                    {leaf.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Axis labels — outside the partition rectangle, in mono kicker */}
        {data.xAxisLabel && (
          <div
            style={{
              position: "absolute",
              top: rect.y + rect.height + 16,
              left: rect.x,
              width: rect.width,
              textAlign: "center",
              fontSize: fontSizes.meta,
              fontFamily: fonts.metadata,
              color: theme.text.muted,
              letterSpacing: 1.5,
              opacity: exitOp,
            }}
          >
            {data.xAxisLabel}
          </div>
        )}
        {data.yAxisLabel && (
          <div
            style={{
              position: "absolute",
              top: rect.y + rect.height / 2,
              left: rect.x - 40,
              transform: "translate(-50%, -50%) rotate(-90deg)",
              fontSize: fontSizes.meta,
              fontFamily: fonts.metadata,
              color: theme.text.muted,
              letterSpacing: 1.5,
              whiteSpace: "nowrap",
              opacity: exitOp,
            }}
          >
            {data.yAxisLabel}
          </div>
        )}

        {data.source && (
          <SourceAttribution source={data.source} mode={mode} prefix="Source: " />
        )}
      </AbsoluteFill>
    </Background>
  );
};
