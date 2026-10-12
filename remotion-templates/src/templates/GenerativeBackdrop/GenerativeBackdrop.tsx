/**
 * GenerativeBackdrop — generative flow-field hold-beat segment.
 *
 * Manifest-facing wrapper around the shared GenerativeField component. The
 * field IS the motion, so useCompositionAnimation runs with `noDrift: true`
 * (Ken Burns off; the exit fade is preserved). Optional kicker/title overlay.
 *
 * @title-block: none — full-bleed atmospheric backdrop with a minimal custom
 * kicker/title overlay; intentionally does not use the centered TitleBlock.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { palette } from "../../design/theme";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { GenerativeField } from "../../components/GenerativeField";
import type { GenerativeBackdropData } from "./types";

const DENSITY_GAP: Record<NonNullable<GenerativeBackdropData["density"]>, number> = {
  quiet: 68,
  medium: 52,
  busy: 40,
};

export const GenerativeBackdrop: React.FC<{ data: GenerativeBackdropData }> = ({ data }) => {
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const gap = DENSITY_GAP[data.density ?? "medium"];

  return (
    <AbsoluteFill style={{ ...compStyle }}>
      <GenerativeField gap={gap} driftSpeed={data.driftSpeed} />
      {(data.kicker || data.title) && (
        <div style={{ position: "absolute", left: 120, top: 110, fontFamily: "Helvetica, Arial, sans-serif" }}>
          {data.kicker && (
            <div style={{ color: palette.walnut, fontSize: 24, letterSpacing: 8, textTransform: "uppercase" }}>
              {data.kicker}
            </div>
          )}
          {data.title && (
            <div style={{ color: palette.bone, fontSize: 64, fontWeight: 800, marginTop: 6 }}>{data.title}</div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
