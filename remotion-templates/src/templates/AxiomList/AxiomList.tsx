/**
 * AxiomList — numbered foundational claims.
 *
 * Stacked numbered propositions revealed in sequence. Each axiom = ordinal
 * + text + optional italic gloss. The "key" axiom gets accent left-rail
 * + heavier weight; "disputed" gets italic struck-through.
 *
 * @composition-animation: useCompositionAnimation
 */

import { textAccent } from "../../utils/colorUtils";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  sec,
  semantic,
} from "../../design/theme";
import { fadeIn, slideIn } from "../../utils/animation";
import type { Axiom, AxiomListData } from "./types";

// ── Reveal timing ──────────────────────────────────────────────────────────

const FRAMING_REVEAL_SEC = 0.3;
const AXIOMS_START_SEC = 0.5;
const AXIOM_STAGGER_SEC = 0.55;
/** Distance each row travels upward while it fades in. */
const AXIOM_RISE_PX = 14;

// ── Numeral formatter ─────────────────────────────────────────────────────

function formatOrdinal(
  i: number,
  scheme: "arabic" | "roman" | "lower-roman" | "decimal",
  decimalRoot: number,
): string {
  switch (scheme) {
    case "roman":
      return romanize(i + 1) + ".";
    case "lower-roman":
      return romanize(i + 1).toLowerCase() + ".";
    case "decimal":
      return `${decimalRoot}.${i + 1}`;
    case "arabic":
    default:
      return `${i + 1}.`;
  }
}
function romanize(n: number): string {
  const map: Array<[number, string]> = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let rem = n;
  for (const [v, s] of map) {
    while (rem >= v) {
      out += s;
      rem -= v;
    }
  }
  return out;
}

// ── Component ──────────────────────────────────────────────────────────────

export const AxiomList: React.FC<{ data: AxiomListData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();

  const numbering = data.numbering ?? "arabic";
  const decimalRoot = data.decimalRoot ?? 1;
  const accentColor = emphasis.primaryAccent ?? palette.gold;

  // Layout: the list is one block — as wide as its longest row, centred in
  // the space under the title. (Rows used to be spread over the full height
  // of a 70%-wide column: three short lines sat far apart and hard left.)
  const colWidth = layout.width * 0.7;
  const areaTop = data.title ? 220 : layout.safeArea.top + 40;
  const areaBottom = layout.height - layout.safeArea.bottom - 60;
  // Short lists carry bigger type; five or more fall back to the base scale.
  const roomy = data.axioms.length <= 4;
  const rowGap = roomy ? 44 : 22;
  const stagger = data.staggerSec ?? AXIOM_STAGGER_SEC;

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={mode} />
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: areaTop,
            height: areaBottom - areaTop,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: rowGap,
              maxWidth: colWidth,
            }}
          >
            {/* Framing line. */}
            {data.framing && (
              <div
                style={{
                  fontFamily: fonts.serifBody,
                  fontStyle: "italic",
                  fontSize: roomy ? fontSizes.body + 6 : fontSizes.body,
                  color: theme.text.secondary,
                  opacity: fadeIn(frame, sec(FRAMING_REVEAL_SEC), sec(0.6)),
                }}
              >
                {data.framing}
              </div>
            )}

            {/* Axioms — each rises a few pixels into place as it fades in. */}
            {data.axioms.map((ax, i) => {
              const startFrame = sec(ax.atSec ?? AXIOMS_START_SEC + i * stagger);
              return (
                <AxiomRow
                  key={`ax-${i}`}
                  axiom={ax}
                  ordinal={formatOrdinal(i, numbering, decimalRoot)}
                  roomy={roomy}
                  opacity={fadeIn(frame, startFrame, sec(0.6))}
                  rise={slideIn(frame, startFrame, AXIOM_RISE_PX, sec(0.6))}
                  theme={theme}
                  accentColor={accentColor}
                />
              );
            })}
          </div>
        </div>

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

// ── AxiomRow ───────────────────────────────────────────────────────────────

const AxiomRow = React.memo<{
  axiom: Axiom;
  ordinal: string;
  /** Short list: larger type scale. */
  roomy: boolean;
  opacity: number;
  /** Current upward-travel offset in px (0 once settled). */
  rise: number;
  theme: ReturnType<typeof useThemeMode>;
  accentColor: string;
}>(({ axiom, ordinal, roomy, opacity, rise, theme, accentColor }) => {
  const isKey = axiom.emphasis === "key";
  const isDisputed = axiom.emphasis === "disputed";
  const ordinalColor = isKey
    ? textAccent(accentColor, theme.isDark)
    : isDisputed
      ? semantic.china
      : theme.text.muted;
  const textColor = isDisputed ? semantic.china : theme.text.primary;
  const textSize = roomy ? 44 : fontSizes.h3;
  const ordinalSize = roomy ? 56 : fontSizes.h2;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 24,
        opacity,
        transform: `translateY(${rise}px)`,
        // Every row reserves the rail's width so ordinals stay aligned; only
        // the key row paints it.
        borderLeft: `3px solid ${isKey ? accentColor : "transparent"}`,
        paddingLeft: 18,
      }}
    >
      {/* Ornamental ordinal — large display-face numeral. */}
      <div
        style={{
          width: roomy ? 96 : 90,
          flexShrink: 0,
          textAlign: "right",
          fontFamily: fonts.display,
          fontSize: ordinalSize,
          fontWeight: fontWeights.regular,
          color: ordinalColor,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          paddingTop: 4,
        }}
      >
        {ordinal}
      </div>

      {/* Axiom text + optional gloss. */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: fonts.serifBody,
            // Was 26px / 36px (key): small in a mostly empty frame and on phones.
            fontSize: isKey ? textSize + 8 : textSize,
            fontWeight: isKey ? fontWeights.medium : fontWeights.regular,
            color: textColor,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            textDecoration: isDisputed ? "line-through" : undefined,
            textDecorationColor: isDisputed ? semantic.china : undefined,
            textDecorationThickness: 1.5,
          }}
        >
          {axiom.text}
        </div>
        {axiom.gloss && (
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: roomy ? 32 : fontSizes.body + 6,
              color: theme.text.secondary,
              marginTop: 6,
              lineHeight: 1.35,
            }}
          >
            {axiom.gloss}
          </div>
        )}
      </div>
    </div>
  );
});
