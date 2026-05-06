/**
 * Catalog — EmphasisShowcase.
 *
 * Renders one DataChart sequentially under each of the six episode color
 * emphases (neutral, soviet, american-modernist, chinese-state,
 * chinese-traditional, japanese-showa) so the EpisodeColorEmphasis system
 * is visually documented in one place. Each emphasis gets a 4-second window
 * in its own <Sequence> wrapper, which scopes the template's animation
 * timing to that window (frame 0 inside each emphasis = entrance start).
 *
 * Why a single template (DataChart) instead of a grid of different
 * templates: the goal is to isolate the emphasis variable. Same chart,
 * same data, six emphases — drift in any non-color dimension would
 * confuse the comparison. Pick a different template and re-render to
 * compare across templates.
 *
 * Use this when:
 *   - Reviewing whether an emphasis "feels right" for an upcoming episode
 *   - QAing the EMPHASIS_MAP after a palette change
 *   - Explaining the emphasis system to collaborators
 */

import React from "react";
import {
  AbsoluteFill,
  Composition,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DataChart } from "../templates/DataChart/DataChart";
import type { DataChartData } from "../templates/DataChart/types";
import {
  EpisodeColorEmphasisProvider,
} from "../hooks/useEpisodeColorEmphasis";
import {
  EMPHASIS_VALUES,
  type EpisodeColorEmphasis,
  fonts,
  fontSizes,
  layout,
  palette,
  sec,
} from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

// ── Demo data ───────────────────────────────────────────────────────────────
// Plain 5-bar chart, no per-bar colors so the emphasis chartFillSequence +
// primaryAccent can drive every visible color choice. The reference line
// also has no explicit color, so it picks up emphasis.primaryAccent.

const DEMO: DataChartData = {
  episode: CATALOG_EPISODE,
  title: "Color Emphasis Showcase",
  subtitle: "Same chart, six per-episode color identities",
  variant: "bar",
  dataPoints: [
    { label: "Sample A", value: 42 },
    { label: "Sample B", value: 65 },
    { label: "Sample C", value: 38 },
    { label: "Sample D", value: 71 },
    { label: "Sample E", value: 54 },
  ],
  highlightIndex: 3,
  unit: "%",
  referenceLine: { value: 50, label: "Threshold" },
  durationSec: 4,
};

const PER_EMPHASIS_SEC = 4;
const TOTAL_SEC = PER_EMPHASIS_SEC * EMPHASIS_VALUES.length;

// ── Emphasis label overlay ───────────────────────────────────────────────────

const EmphasisLabel: React.FC<{ name: EpisodeColorEmphasis }> = ({ name }) => {
  const frame = useCurrentFrame();
  // Soft fade-in so the label arrives just after the chart's title block lands.
  const opacity = Math.min(1, Math.max(0, (frame - 6) / 12));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: layout.safeAreaTier.generous.top,
          right: layout.safeAreaTier.generous.right,
          fontSize: fontSizes.label,
          fontFamily: fonts.mono,
          fontWeight: 600,
          color: palette.ink,
          backgroundColor: `${palette.bone}E6`,
          padding: "8px 14px",
          borderRadius: 4,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          opacity,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {name}
      </div>
    </AbsoluteFill>
  );
};

// ── Showcase composition ─────────────────────────────────────────────────────

export const EmphasisShowcase: React.FC = () => {
  const { fps } = useVideoConfig();
  const perEmphasisFrames = Math.round(PER_EMPHASIS_SEC * fps);

  return (
    <AbsoluteFill>
      {EMPHASIS_VALUES.map((name, i) => (
        <Sequence
          key={name}
          from={i * perEmphasisFrames}
          durationInFrames={perEmphasisFrames}
          name={`emphasis-${name}`}
        >
          <EpisodeColorEmphasisProvider value={name}>
            <DataChart data={DEMO} />
            <EmphasisLabel name={name} />
          </EpisodeColorEmphasisProvider>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ── Composition entry ────────────────────────────────────────────────────────

export const CatalogEmphasisShowcase = () => (
  <Composition
    id={catalogId("EmphasisShowcase", "all-six")}
    component={EmphasisShowcase}
    durationInFrames={Math.round(TOTAL_SEC * layout.fps)}
    fps={layout.fps}
    width={layout.width}
    height={layout.height}
  />
);
