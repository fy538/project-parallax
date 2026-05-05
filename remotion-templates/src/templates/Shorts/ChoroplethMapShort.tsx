/**
 * ChoroplethMapShort — vertical 9:16 map data card for Shorts.
 *
 * Adapts ChoroplethMap for Shorts by using a text-based data card instead
 * of rendering the map itself. Shows phase title, countries + values, and source.
 * Focuses on the data story rather than the map visualization.
 */

import React, { useMemo } from "react";
import {
  palette,
  fonts,
  fontWeights,
  sec,
} from "../../design/theme";
import { fadeIn, slideIn } from "../../utils/animation";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import type { ChoroplethMapData } from "../ChoroplethMap/types";

export const ChoroplethMapShort: React.FC<{ data: ChoroplethMapData }> = ({
  data,
}) => {
  // Use the first phase as the active display
  const activePhase = useMemo(() => data.phases?.[0], [data.phases]);

  return (
    <ShortsWrapper
      title={data.title}
      subtitle={activePhase?.subtitle}
      mode="light"
    >
      {(vl, theme, frame, exit) => {
        if (!activePhase) {
          return null;
        }

        const startDelay = sec(0.3);
        const itemStagger = sec(0.2);
        const itemFadeDuration = sec(0.4);

        // Sort countries by value (descending) for visual impact
        const sortedCountries = useMemo(
          () =>
            [...activePhase.countries].sort((a, b) => (b.value || 0) - (a.value || 0)),
          [activePhase.countries]
        );

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
            {/* Phase title */}
            <div
              style={{
                opacity: fadeIn(frame, startDelay, itemFadeDuration) * exit,
              }}
            >
              <div
                style={{
                  fontSize: vl.fontSizes.h2,
                  fontWeight: fontWeights.bold,
                  color: palette.amber,
                  fontFamily: fonts.heading,
                  textShadow: theme.textShadow,
                  marginBottom: vl.spacing.sm,
                }}
              >
                {activePhase.title}
              </div>
            </div>

            {/* Countries data card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: vl.spacing.md,
              }}
            >
              {sortedCountries.map((country, idx) => {
                const itemStart = startDelay + (1 + idx) * itemStagger;
                const itemOpacity = fadeIn(frame, itemStart, itemFadeDuration) * exit;
                const itemTranslate = slideIn(frame, itemStart, 20, itemFadeDuration);

                return (
                  <div
                    key={`${country.name}-${idx}`}
                    style={{
                      opacity: itemOpacity,
                      transform: `translateX(${itemTranslate}px)`,
                      padding: vl.spacing.md,
                      borderRadius: 8,
                      background: country.fill ? `${country.fill}20` : `${palette.amber}15`,
                      border: `1px solid ${country.fill ? country.fill : palette.amber}40`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: vl.spacing.md,
                      }}
                    >
                      <div
                        style={{
                          fontSize: vl.fontSizes.label,
                          fontWeight: fontWeights.semibold,
                          color: theme.text.primary,
                          fontFamily: fonts.heading,
                          textShadow: theme.textShadow,
                          flex: 1,
                        }}
                      >
                        {country.name}
                        {country.iso3 && (
                          <span
                            style={{
                              fontSize: vl.fontSizes.caption,
                              color: theme.text.muted,
                              marginLeft: vl.spacing.sm,
                              fontFamily: fonts.data,
                            }}
                          >
                            ({country.iso3})
                          </span>
                        )}
                        {country.label && (
                          <div
                            style={{
                              fontSize: vl.fontSizes.caption,
                              color: theme.text.secondary,
                              marginTop: 4,
                              fontWeight: 400,
                              fontFamily: fonts.body,
                            }}
                          >
                            {country.label}
                          </div>
                        )}
                      </div>
                      {country.value !== undefined && (
                        <div
                          style={{
                            fontSize: vl.fontSizes.body,
                            fontWeight: fontWeights.bold,
                            color: country.fill || palette.amber,
                            fontFamily: fonts.data,
                            textShadow: theme.textShadow,
                          }}
                        >
                          {country.value}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Source attribution */}
            {data.phases && (
              <div
                style={{
                  marginTop: vl.spacing.lg,
                  opacity: fadeIn(
                    frame,
                    startDelay + (1 + sortedCountries.length) * itemStagger,
                    itemFadeDuration
                  ) * exit,
                }}
              >
                <div
                  style={{
                    fontSize: vl.fontSizes.caption,
                    color: theme.text.muted,
                    fontFamily: fonts.body,
                    textAlign: "center",
                    textShadow: theme.textShadow,
                  }}
                >
                  Phase {data.phases.findIndex((p) => p === activePhase) + 1} of{" "}
                  {data.phases.length}
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ShortsWrapper>
  );
};
