import { Composition } from "remotion";
import { SplitFrame } from "./SplitFrame";
import { SplitFrameSchema } from "./schema";
import { layout, sec } from "../../design/theme";
import type { SplitFrameData } from "./types";

/**
 * Sample: StatReveal (US defense 1914) ↔ StatReveal (US defense 2024).
 *
 * StatReveal data is compact and guaranteed to render without external assets —
 * ideal for a standalone catalog composition. For real episode use, replace
 * `component` + `data` with any template from PANE_COMPONENTS.
 *
 * The catalog fixtures (data/episodes/catalog/split-frame-*.json) show
 * DataChart vs DataChart and AnnotatedImage vs AnnotatedImage examples.
 */
export const splitFrameSampleData: SplitFrameData = {
  episode: "catalog",
  durationSec: 10,
  dividerLabel: "vs",
  backgroundVariant: "dark",
  left: {
    component: "StatReveal",
    label: "1914",
    caption: "U.S. annual defense expenditure at the eve of WWI",
    data: {
      episode: "split-frame-sample",
      title: "Defense at the Eve of WWI",
      source: "Historical Statistics of the United States",
      durationSec: 10,
      backgroundVariant: "dark",
      stat: {
        value: 17,
        prefix: "$",
        suffix: "B",
        label: "U.S. defense budget, 1914",
        decimals: 0,
        countUp: true,
      },
      comparisons: [
        { label: "Germany", value: 44, color: "#888780" },
        { label: "UK", value: 76, color: "#888780" },
        { label: "U.S.", value: 17, color: "#C4A747" },
      ],
      heroIsMax: false,
    },
  },
  right: {
    component: "StatReveal",
    label: "2024",
    caption: "U.S. annual defense expenditure — the largest in world history",
    data: {
      episode: "split-frame-sample",
      title: "Defense in 2024",
      source: "Stockholm International Peace Research Institute (SIPRI)",
      durationSec: 10,
      backgroundVariant: "dark",
      stat: {
        value: 886,
        prefix: "$",
        suffix: "B",
        label: "U.S. defense budget, 2024",
        decimals: 0,
        countUp: true,
      },
      comparisons: [
        { label: "China", value: 296, color: "#A64D46" },
        { label: "Russia", value: 109, color: "#888780" },
        { label: "U.S.", value: 886, color: "#C4A747" },
      ],
      heroIsMax: true,
    },
  },
};

/**
 * Duration logic:
 *   simultaneous (default) — `durationSec ?? 12` drives both panes.
 *   sequential             — total = left.data.durationSec + right.data.durationSec.
 *                            `durationSec` at the top level is ignored when omitted;
 *                            if explicitly set it overrides the sum.
 */
function splitFrameMetadata({ props }: { props: { data: SplitFrameData } }) {
  const data = props.data;
  let durationSec: number;
  // eslint-disable-next-line no-bare-durationSec
  if (data.durationSec != null) {
    // Explicit override always wins. (null-guarded above — not a bare access)
    // eslint-disable-next-line no-bare-durationSec
    durationSec = data.durationSec;
  } else if (data.syncStrategy === "sequential") {
    const leftDur = (data.left.data as { durationSec?: number }).durationSec ?? 6;
    const rightDur = (data.right.data as { durationSec?: number }).durationSec ?? 6;
    durationSec = leftDur + rightDur;
  } else {
    durationSec = 12;
  }
  return {
    durationInFrames: Math.max(1, Math.round(sec(durationSec))),
    fps: layout.fps,
    width: layout.width,
    height: layout.height,
  };
}

export const SplitFrameComposition = () => (
  <Composition
    id="SplitFrame"
    component={SplitFrame}
    schema={SplitFrameSchema}
    calculateMetadata={splitFrameMetadata}
    defaultProps={{ data: splitFrameSampleData as SplitFrameData }}
  />
);
