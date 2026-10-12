// eslint-disable-next-line missing-direction-wiring
// SplitFrame intentionally does NOT call useDirection. The outer frame has no
// driftable content of its own — all animation is delegated to the pane
// templates, each of which reads its own _direction from its inlined data.
// The _direction field in SplitFrameDataSchema is present for pipeline
// consistency (generate_manifest.py emits it for every segment) but is unused
// at the SplitFrame render level. Future: could be used for outer background
// mode override or global pacing scale applied to both panes.

/**
 * SplitFrame — generalized side-by-side composition primitive.
 *
 * Renders any two registered templates side by side, synchronized. Designed
 * to replace hand-built per-pair split layouts across Parallax episodes.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Each pane renders its template at native 1920×1080, then scales it down via
 * CSS transform to fit the pane width. The pane container clips the scaled
 * template to its bounds (overflow: hidden). Label badges and captions are
 * positioned on the PANE (not inside the scaled template).
 *
 * Scale math (50/50 split, PANE_GAP=4):
 *   leftW = (1920 - 4) × 0.5 = 958px
 *   scale = 958 / 1920 ≈ 0.499
 *   scaledH = 1080 × 0.499 ≈ 539px
 *   verticalOffset = (1080 - 539) / 2 ≈ 270px    ← card floats in center
 *
 * No Ken Burns / no exit fade on the outer frame — child templates handle
 * their own animation. useCompositionAnimation is intentionally NOT called
 * here.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CIRCULAR IMPORT AVOIDANCE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * PANE_COMPONENTS imports templates DIRECTLY (same pattern as ComparisonPair).
 * SplitFrame itself is NOT in PANE_COMPONENTS — no recursive splits.
 * TitleTransition and MorphTransition are excluded (not content panes).
 *
 * When a new template is added to templateRegistry's TEMPLATE_COMPONENTS, add it
 * here too if it should be usable as a pane. Keep both lists alphabetically
 * sorted for ease of diffing.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SYNC STRATEGIES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * "simultaneous" (default):
 *   Both templates see the same frame clock. Animate in together.
 *   Use for: two data states of the same moment (GDP 1990 | GDP 2024).
 *
 * "sequential":
 *   Left plays for leftDurFrames (derived from left.data.durationSec),
 *   then right's clock starts. Left template is still visible but frozen
 *   at its final frame while right animates.
 *   Use for: "first we establish context, then the contrast lands."
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  radii,
} from "../../design/theme";
import { areSeamsOwnedByEpisode, fadeIn, slideIn } from "../../utils/animation";
import { Background } from "../../components/Background";

// ── Pane template imports ────────────────────────────────────────────────────
//
// All templates that can serve as SplitFrame panes — imported directly to
// avoid a circular dependency through templateRegistry's TEMPLATE_COMPONENTS.
// Keep alphabetically sorted. Add new templates here when they should be
// usable as panes (mirror templateRegistry.ts TEMPLATE_COMPONENTS, minus the
// three excluded entries at the bottom of PANE_COMPONENTS).

import { AnnotatedImage } from "../AnnotatedImage/AnnotatedImage";
import { ArchivalReel } from "../ArchivalReel/ArchivalReel";
import { ArcDiagram } from "../ArcDiagram/ArcDiagram";
import { AtlasPlate } from "../AtlasPlate/AtlasPlate";
import { AxiomList } from "../AxiomList/AxiomList";
import { BayesianUpdate } from "../BayesianUpdate/BayesianUpdate";
import { BeeswarmChart } from "../BeeswarmChart/BeeswarmChart";
import { BulletChart } from "../BulletChart/BulletChart";
import { BumpChart } from "../BumpChart/BumpChart";
import { CalendarHeatmap } from "../CalendarHeatmap/CalendarHeatmap";
import { CartogramMap } from "../CartogramMap/CartogramMap";
import { CausalLoopDiagram } from "../CausalLoopDiagram/CausalLoopDiagram";
import { ChoroplethMap } from "../ChoroplethMap/ChoroplethMap";
import { CinematicMap } from "../CinematicMap/CinematicMap";
import { ComparisonPair } from "../ComparisonPair/ComparisonPair";
import { ConditionalArgument } from "../ConditionalArgument/ConditionalArgument";
import { ConnectedScatterplot } from "../ConnectedScatterplot/ConnectedScatterplot";
import { CounterfactualPath } from "../CounterfactualPath/CounterfactualPath";
import { DataChart } from "../DataChart/DataChart";
import { DecisionTree } from "../DecisionTree/DecisionTree";
import { DensityMap } from "../DensityMap/DensityMap";
import { DialecticFlow } from "../DialecticFlow/DialecticFlow";
import { DuelingFrameworks } from "../DuelingFrameworks/DuelingFrameworks";
import { DumbbellPlot } from "../DumbbellPlot/DumbbellPlot";
import { EscalationLadder } from "../EscalationLadder/EscalationLadder";
import { FrameworkDiagram } from "../FrameworkDiagram/FrameworkDiagram";
import { GameBoard } from "../GameBoard/GameBoard";
import { HandwrittenLetter } from "../HandwrittenLetter/HandwrittenLetter";
import { HorizonChart } from "../HorizonChart/HorizonChart";
import { HorizontalTimeline } from "../HorizontalTimeline/HorizontalTimeline";
import { ImageComposite } from "../ImageComposite/ImageComposite";
import { IsotypeChart } from "../IsotypeChart/IsotypeChart";
import { KineticTypography } from "../KineticTypography/KineticTypography";
import { KPICard } from "../KPICard/KPICard";
import { MarimekkoChart } from "../MarimekkoChart/MarimekkoChart";
import { NetworkDiagram } from "../NetworkDiagram/NetworkDiagram";
import { NewspaperHeadlineRotator } from "../NewspaperHeadlineRotator/NewspaperHeadlineRotator";
import { OutcomePartition } from "../OutcomePartition/OutcomePartition";
import { PhotoMontage } from "../PhotoMontage/PhotoMontage";
import { PopulationPyramid } from "../PopulationPyramid/PopulationPyramid";
import { PrimarySourceReveal } from "../PrimarySourceReveal/PrimarySourceReveal";
import { PricingWaterfall } from "../PricingWaterfall/PricingWaterfall";
import { ProbabilityGauge } from "../ProbabilityGauge/ProbabilityGauge";
import { ProportionalSymbolMap } from "../ProportionalSymbolMap/ProportionalSymbolMap";
import { RadarChart } from "../RadarChart/RadarChart";
import { RankChangeDotPlot } from "../RankChangeDotPlot/RankChangeDotPlot";
import { RidgelinePlot } from "../RidgelinePlot/RidgelinePlot";
import { RouteAnimation } from "../RouteAnimation/RouteAnimation";
import { SankeyFlow } from "../SankeyFlow/SankeyFlow";
import { Slopegraph } from "../Slopegraph/Slopegraph";
import { SmallMultiples } from "../SmallMultiples/SmallMultiples";
import { SpiralTimeline } from "../SpiralTimeline/SpiralTimeline";
import { SplitComposition } from "../SplitComposition/SplitComposition";
import { StatReveal } from "../StatReveal/StatReveal";
import { StepLine } from "../StepLine/StepLine";
import { Streamgraph } from "../Streamgraph/Streamgraph";
import { StrategicLandscape } from "../StrategicLandscape/StrategicLandscape";
import { Syllogism } from "../Syllogism/Syllogism";
import { TelegramCable } from "../TelegramCable/TelegramCable";
import { TernaryPlot } from "../TernaryPlot/TernaryPlot";
import { TilegramUSMap } from "../TilegramUSMap/TilegramUSMap";
import { TimeSeriesChart } from "../TimeSeriesChart/TimeSeriesChart";

import type { SplitFrameData, SplitPane } from "./types";

// ── Pane component dispatch table ─────────────────────────────────────────────
//
// Excluded: SplitFrame (no recursion), TitleTransition (not content),
//           MorphTransition (transition primitive).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PANE_COMPONENTS: Record<string, React.ComponentType<{ data: any }>> = {
  AnnotatedImage,
  ArchivalReel,
  ArcDiagram,
  AtlasPlate,
  AxiomList,
  BayesianUpdate,
  BeeswarmChart,
  BulletChart,
  BumpChart,
  CalendarHeatmap,
  CartogramMap,
  CausalLoopDiagram,
  ChoroplethMap,
  CinematicMap,
  ComparisonPair,
  ConditionalArgument,
  ConnectedScatterplot,
  CounterfactualPath,
  DataChart,
  DecisionTree,
  DensityMap,
  DialecticFlow,
  DuelingFrameworks,
  DumbbellPlot,
  EscalationLadder,
  FrameworkDiagram,
  GameBoard,
  HandwrittenLetter,
  HorizonChart,
  HorizontalTimeline,
  ImageComposite,
  IsotypeChart,
  KineticTypography,
  KPICard,
  MarimekkoChart,
  NetworkDiagram,
  NewspaperHeadlineRotator,
  OutcomePartition,
  PhotoMontage,
  PopulationPyramid,
  PrimarySourceReveal,
  PricingWaterfall,
  ProbabilityGauge,
  ProportionalSymbolMap,
  RadarChart,
  RankChangeDotPlot,
  RidgelinePlot,
  RouteAnimation,
  SankeyFlow,
  Slopegraph,
  SmallMultiples,
  SpiralTimeline,
  SplitComposition,
  StatReveal,
  StepLine,
  Streamgraph,
  StrategicLandscape,
  Syllogism,
  TelegramCable,
  TernaryPlot,
  TilegramUSMap,
  TimeSeriesChart,
};

// ── Layout constants ──────────────────────────────────────────────────────────

/** Width of the gold divider line between panes, in px. */
const PANE_GAP = 4;

/** Vertical padding inside each pane, above and below the scaled template card. */
const PANE_V_PADDING = 48;

/** Height of the label badge strip above the scaled template. */
const LABEL_STRIP_H = 52;

/** Height of the caption strip below the scaled template. */
const CAPTION_STRIP_H = 64;

/** `paneFit: "cover"` — height of the caption strip under the picture. */
const COVER_CAPTION_H = 190;

/** Inset of a label badge from a pane edge that is not a frame edge. */
const BADGE_INNER_INSET = 24;

/** `paneFit: "cover"` — how dark the veil is before a pane's `revealAtSec`. */
const COVER_VEIL_OPACITY = 0.45;

// ── PaneUnknown — placeholder for unregistered component names ───────────────

const PaneUnknown: React.FC<{ name: string }> = ({ name }) => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "center",
      background: palette.midnight,
    }}
  >
    <span
      style={{
        fontFamily: fonts.mono,
        fontSize: fontSizes.body,
        color: palette.umber,
        letterSpacing: letterSpacing.meta,
      }}
    >
      Unknown pane component: {name}
    </span>
  </AbsoluteFill>
);

// ── LabelBadge — corner era / context label on the pane ──────────────────────

const LabelBadge: React.FC<{
  label: string;
  position: NonNullable<SplitPane["labelPosition"]>;
  frame: number;
  /** Which side of the frame this pane sits on. */
  side: "left" | "right";
  /** Distance from the pane's bottom edge for bottom-anchored badges. */
  bottomInset: number;
  /** Frame at which the badge appears. */
  startFrame?: number;
  accentColor?: string;
}> = ({ label, position, frame, side, bottomInset, startFrame = 0, accentColor = palette.gold }) => {
  const isTop = position.startsWith("top");
  const isLeft = position.endsWith("left");
  // A badge on the frame's outer edge keeps to the title-safe area (it used
  // to sit 16px from the corner, outside it); one against the divider only
  // needs a small inset.
  const onFrameEdge = (side === "left") === isLeft;
  const insetX = onFrameEdge ? layout.safeArea.left + 16 : BADGE_INNER_INSET;

  return (
    <div
      style={{
        position: "absolute",
        top: isTop ? layout.safeArea.top - 8 : undefined,
        bottom: isTop ? undefined : bottomInset,
        left: isLeft ? insetX : undefined,
        right: isLeft ? undefined : insetX,
        fontFamily: fonts.mono,
        fontSize: 28, // content floor; was 18
        fontWeight: fontWeights.semibold,
        letterSpacing: letterSpacing.meta,
        textTransform: "uppercase" as const,
        color: accentColor,
        background: "rgba(28,24,20,0.72)",
        padding: "8px 16px",
        borderRadius: radii.sm,
        border: `1px solid ${accentColor}40`,
        opacity: fadeIn(frame, startFrame, sec(0.5)),
        zIndex: 2,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      {label}
    </div>
  );
};

// ── DividerBadge — centered "vs" / "→" label on the divider line ─────────────

const DividerBadge: React.FC<{
  label: string;
  frame: number;
}> = ({ label, frame }) => (
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontFamily: fonts.mono,
      fontSize: fontSizes.label,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacing.meta,
      textTransform: "uppercase" as const,
      color: palette.paper,
      background: palette.gold,
      padding: "8px 10px",
      borderRadius: radii.sm,
      whiteSpace: "nowrap" as const,
      writingMode: "horizontal-tb" as const,
      opacity: fadeIn(frame, sec(0.3), sec(0.4)),
    }}
  >
    {label}
  </div>
);

// ── PaneContainer — clips + scales a child template ──────────────────────────

interface PaneContainerProps {
  x: number;
  paneW: number;
  pane: SplitPane;
  frame: number;
  defaultLabelPosition: NonNullable<SplitPane["labelPosition"]>;
  side: "left" | "right";
  fit: "contain" | "cover";
  isDark: boolean;
  children: React.ReactNode;
}

const PaneContainer: React.FC<PaneContainerProps> = ({
  x,
  paneW,
  pane,
  frame,
  defaultLabelPosition,
  side,
  fit,
  isDark,
  children,
}) => {
  const hasLabel = Boolean(pane.label);
  const hasCaption = Boolean(pane.caption);
  // The pane's badge and caption (and, in cover mode, its veil) key off this.
  const revealFrame = sec(pane.revealAtSec ?? 0);
  const captionFrame = revealFrame + sec(0.8);
  // Caption swap: the first caption leaves, the second arrives in its place.
  const swap = pane.captionSwap;
  const swapFrame = swap ? sec(swap.atSec) : 0;
  const firstCaptionOpacity =
    fadeIn(frame, captionFrame, sec(0.6)) * (swap ? 1 - fadeIn(frame, swapFrame, sec(0.3)) : 1);
  const swapCaptionFrame = swapFrame + sec(0.25);

  // ── Cover: fill the pane's height, crop the sides ────────────────────────
  if (fit === "cover") {
    const windowH = layout.height - (hasCaption ? COVER_CAPTION_H : 0);
    const coverScale = windowH / layout.height;
    const scaledW = layout.width * coverScale;
    const focusX = pane.focusX ?? 0.5;
    // Put the focus point at the pane's centre, without exposing an edge.
    const offsetX = Math.min(
      0,
      Math.max(paneW - scaledW, paneW / 2 - scaledW * focusX),
    );
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: 0,
          width: paneW,
          height: layout.height,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: paneW,
            height: windowH,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: offsetX,
              top: 0,
              width: layout.width,
              height: layout.height,
              transform: `scale(${coverScale})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
          {/* Veil: the picture waits, dimmed, until this pane's turn. */}
          {revealFrame > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: palette.ink,
                opacity: COVER_VEIL_OPACITY * (1 - fadeIn(frame, revealFrame, sec(0.8))),
              }}
            />
          )}
        </div>

        {hasLabel && (
          <LabelBadge
            label={pane.label!}
            position={pane.labelPosition ?? defaultLabelPosition}
            frame={frame}
            side={side}
            startFrame={revealFrame}
            bottomInset={(hasCaption ? COVER_CAPTION_H : layout.safeAreaTier.generous.bottom) + 16}
          />
        )}

        {hasCaption &&
          [
            {
              key: "caption",
              text: pane.caption,
              opacity: firstCaptionOpacity,
              rise: slideIn(frame, captionFrame, 12, sec(0.6)),
            },
            ...(swap
              ? [
                  {
                    key: "swap",
                    text: swap.text,
                    opacity: fadeIn(frame, swapCaptionFrame, sec(0.6)),
                    rise: slideIn(frame, swapCaptionFrame, 12, sec(0.6)),
                  },
                ]
              : []),
          ].map((c) => (
            <div
              key={c.key}
              style={{
                position: "absolute",
                top: windowH,
                left: side === "left" ? layout.safeAreaTier.generous.left : 40,
                right: side === "right" ? layout.safeAreaTier.generous.right : 40,
                height: COVER_CAPTION_H,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                paddingTop: 38,
                textAlign: "center",
                fontFamily: fonts.serifBody,
                fontStyle: "italic",
                fontSize: fontSizes.h3,
                lineHeight: 1.3,
                color: isDark ? palette.bone : palette.ink,
                opacity: c.opacity,
                transform: `translateY(${c.rise}px)`,
              }}
            >
              {c.text}
            </div>
          ))}
      </div>
    );
  }

  // ── Contain (default): scale to the pane's width, letterbox ──────────────
  const scale = paneW / layout.width;
  const scaledH = layout.height * scale;

  // Content block height: label strip + scaled template + caption strip + padding
  const contentH =
    (hasLabel ? LABEL_STRIP_H : 0) +
    scaledH +
    (hasCaption ? CAPTION_STRIP_H : 0) +
    PANE_V_PADDING * 2;

  // Center the content block vertically in the pane (1080px)
  const blockTopY = Math.max(0, Math.round((layout.height - contentH) / 2));

  // Top of the scaled template within the pane
  const templateTopY = blockTopY + PANE_V_PADDING + (hasLabel ? LABEL_STRIP_H : 0);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: paneW,
        height: layout.height,
        overflow: "hidden",
      }}
    >
      {/* Label strip — positioned above the scaled template */}
      {hasLabel && (
        <LabelBadge
          label={pane.label!}
          position={pane.labelPosition ?? defaultLabelPosition}
          frame={frame}
          side={side}
          startFrame={revealFrame}
          bottomInset={layout.safeArea.bottom - 8}
        />
      )}

      {/* Scaled template: native 1920×1080, scaled to paneW */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: templateTopY,
          width: layout.width,
          height: layout.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          // overflow visible inside this container; clipping happens at the
          // parent PaneContainer which has overflow: hidden.
        }}
      >
        {children}
      </div>

      {/* Caption strip — below the scaled template */}
      {hasCaption && (
        <div
          style={{
            position: "absolute",
            top: templateTopY + scaledH + 12,
            left: 24,
            right: 24,
            textAlign: "center",
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: 28, // content floor; was 22, and 14 before that
            lineHeight: 1.4,
            color: palette.walnut,
            opacity: firstCaptionOpacity,
            transform: `translateY(${slideIn(frame, captionFrame, 12, sec(0.6))}px)`,
          }}
        >
          {pane.caption}
        </div>
      )}
      {hasCaption && swap && (
        <div
          style={{
            position: "absolute",
            top: templateTopY + scaledH + 12,
            left: 24,
            right: 24,
            textAlign: "center",
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: 28,
            lineHeight: 1.4,
            color: palette.walnut,
            opacity: fadeIn(frame, swapCaptionFrame, sec(0.6)),
            transform: `translateY(${slideIn(frame, swapCaptionFrame, 12, sec(0.6))}px)`,
          }}
        >
          {swap.text}
        </div>
      )}
    </div>
  );
};

// ── SplitFrame ────────────────────────────────────────────────────────────────

export const SplitFrame: React.FC<{ data: SplitFrameData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mode = data.backgroundVariant ?? "dark";
  const isDark = mode === "dark";
  const dividerColor = palette.gold;

  // Pane widths
  const ratio = data.ratio ?? 0.5;
  const totalInner = layout.width - PANE_GAP;
  const leftW = Math.round(totalInner * ratio);
  const rightW = totalInner - leftW;

  const syncStrategy = data.syncStrategy ?? "simultaneous";

  // For sequential: derive left pane duration from inlined pane data
  const leftDurSec = useMemo(() => {
    if (syncStrategy !== "sequential") return 0;
    const d = data.left.data as { durationSec?: number } | null;
    return d?.durationSec ?? 10;
  }, [syncStrategy, data.left.data]);
  const leftDurFrames = Math.round(leftDurSec * fps);

  // Resolve components — warn + fall back to PaneUnknown for unknown names
  const LeftComponent = PANE_COMPONENTS[data.left.component];
  const RightComponent = PANE_COMPONENTS[data.right.component];

  const fit = data.paneFit ?? "contain";

  // Fade in the outer frame — standalone only. Inside an episode the seam
  // belongs to the transition wrapper; fading the whole card up from paper
  // here puts a blank cream frame on every hard cut into it.
  const outerOpacity = areSeamsOwnedByEpisode() ? 1 : fadeIn(frame, 0, sec(0.25));

  return (
    // Cover panes run edge to edge; the paper's ruled border would only show
    // as stray hairlines in the caption strip.
    <Background variant={mode} border={fit === "cover" ? false : undefined}>
    <AbsoluteFill style={{ opacity: outerOpacity }}>
      {/* ── Left pane ─────────────────────────────────────────────────────── */}
      <PaneContainer
        x={0}
        paneW={leftW}
        pane={data.left}
        frame={frame}
        defaultLabelPosition="top-left"
        side="left"
        fit={fit}
        isDark={isDark}
      >
        {syncStrategy === "sequential" ? (
          // Sequential: left plays in its own Sequence, right starts after
          <Sequence from={0} durationInFrames={leftDurFrames} name="pane-left">
            {LeftComponent ? (
              <LeftComponent data={data.left.data} />
            ) : (
              <PaneUnknown name={data.left.component} />
            )}
          </Sequence>
        ) : LeftComponent ? (
          <LeftComponent data={data.left.data} />
        ) : (
          <PaneUnknown name={data.left.component} />
        )}
      </PaneContainer>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      {data.divider !== false && (
        <div
          style={{
            position: "absolute",
            left: leftW,
            top: 0,
            width: PANE_GAP,
            height: layout.height,
            background: dividerColor,
            opacity: interpolate(frame, [0, sec(0.4)], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          {data.dividerLabel && (
            <DividerBadge label={data.dividerLabel} frame={frame} />
          )}
        </div>
      )}

      {/* ── Right pane ────────────────────────────────────────────────────── */}
      <PaneContainer
        x={leftW + PANE_GAP}
        paneW={rightW}
        pane={data.right}
        frame={frame}
        defaultLabelPosition="top-right"
        side="right"
        fit={fit}
        isDark={isDark}
      >
        {syncStrategy === "sequential" ? (
          // Sequential: right starts after left completes
          <Sequence from={leftDurFrames} name="pane-right">
            {RightComponent ? (
              <RightComponent data={data.right.data} />
            ) : (
              <PaneUnknown name={data.right.component} />
            )}
          </Sequence>
        ) : RightComponent ? (
          <RightComponent data={data.right.data} />
        ) : (
          <PaneUnknown name={data.right.component} />
        )}
      </PaneContainer>
    </AbsoluteFill>
    </Background>
  );
};
