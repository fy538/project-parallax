/**
 * MorphTransition — animated state-change between two data states of
 * the SAME embedded template.
 *
 * Timing layer:
 *   [ hold FROM ] → [ morph ] → [ hold TO ]
 *      holdFromSec    morphSec    holdToSec
 *
 * Below the embedded template, an animated state label transitions from
 * FROM label to TO label during the morph window.
 *
 * Architecture:
 *   • Schema discriminated union over morphable templates (DataChart,
 *     TimeSeriesChart, StatReveal) ensures FROM and TO data shape match
 *     the embedded template
 *   • Per-template interpolator (see `interpolate.ts`) computes the
 *     intermediate data state for a given eased progress 0-1
 *   • MorphTransition dispatches to the embedded template with the
 *     interpolated data each frame
 *
 * @composition-animation: useCompositionAnimation
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate as remotionInterp } from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import {
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  sec,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";

// Embedded template imports.
import { DataChart } from "../DataChart/DataChart";
import { TimeSeriesChart } from "../TimeSeriesChart/TimeSeriesChart";
import { StatReveal } from "../StatReveal/StatReveal";

// Interpolators.
import {
  ease,
  interpolateDataChartData,
  interpolateStatRevealData,
  interpolateTimeSeriesChartData,
} from "./interpolate";

import type { MorphState, MorphTransitionData } from "./types";
import type { DataChartData } from "../DataChart/types";
import type { TimeSeriesChartData } from "../TimeSeriesChart/types";
import type { StatRevealData } from "../StatReveal/types";

// ── Dispatch ──────────────────────────────────────────────────────────────

/**
 * Render the embedded template with the interpolated data for the given
 * progress. Type-narrowing is enforced by the discriminator on `state.template`.
 */
function renderMorphed(
  from: MorphState,
  to: MorphState,
  easedT: number,
): React.ReactElement | null {
  // Both states share the same template name (enforced by schema superRefine).
  if (from.template !== to.template) return null;

  switch (to.template) {
    case "DataChart": {
      const fromData = from.data as DataChartData;
      const toData = to.data as DataChartData;
      const interp = interpolateDataChartData(fromData, toData, easedT);
      return <DataChart data={interp} />;
    }
    case "TimeSeriesChart": {
      const fromData = from.data as TimeSeriesChartData;
      const toData = to.data as TimeSeriesChartData;
      const interp = interpolateTimeSeriesChartData(fromData, toData, easedT);
      return <TimeSeriesChart data={interp} />;
    }
    case "StatReveal": {
      const fromData = from.data as StatRevealData;
      const toData = to.data as StatRevealData;
      const interp = interpolateStatRevealData(fromData, toData, easedT);
      return <StatReveal data={interp} />;
    }
    default:
      return null;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export const MorphTransition: React.FC<{ data: MorphTransitionData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = emphasis.primaryAccent ?? palette.gold;

  const holdFrom = sec(data.holdFromSec ?? 2);
  const morphLen = sec(data.morphSec ?? 3);
  const morphEasing = data.morphEasing ?? "ease-in-out";

  // Compute raw progress (0-1) through the morph window.
  // Before `holdFrom`, progress is 0 (FROM state).
  // After `holdFrom + morphLen`, progress is 1 (TO state).
  const rawProgress = remotionInterp(
    frame,
    [holdFrom, holdFrom + morphLen],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const easedProgress = ease(rawProgress, morphEasing);

  // State label crossfades during the morph window. We render both the
  // FROM label and TO label stacked; FROM is opaque at progress 0,
  // TO is opaque at progress 1, both partially visible mid-morph.
  const fromLabelOpacity = 1 - easedProgress;
  const toLabelOpacity = easedProgress;

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        {/* Embedded template with interpolated data. */}
        <AbsoluteFill>
          {renderMorphed(data.from, data.to, easedProgress)}
        </AbsoluteFill>

        {/* State label — top-right, mono small caps, crossfades during morph. */}
        {(data.from.label || data.to.label) && (
          <div
            style={{
              position: "absolute",
              top: data.title ? 210 : 90,
              right: layout.spacing.xl,
              minWidth: 140,
              textAlign: "right",
              opacity: fadeIn(frame, 0, sec(0.5)),
            }}
          >
            <div style={{ position: "relative", height: 64 }}>
              {data.from.label && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    fontFamily: fonts.display,
                    fontSize: fontSizes.h2,
                    fontWeight: fontWeights.semibold,
                    color: accentColor,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    opacity: fromLabelOpacity,
                  }}
                >
                  {data.from.label}
                </div>
              )}
              {data.to.label && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    fontFamily: fonts.display,
                    fontSize: fontSizes.h2,
                    fontWeight: fontWeights.semibold,
                    color: accentColor,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    opacity: toLabelOpacity,
                  }}
                >
                  {data.to.label}
                </div>
              )}
            </div>
          </div>
        )}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
      </AbsoluteFill>
    </Background>
  );
};
