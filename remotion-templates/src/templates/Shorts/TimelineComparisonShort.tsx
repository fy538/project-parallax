/**
 * TimelineComparisonShort — vertical 9:16 timeline comparison for Shorts.
 *
 * Adapts TimelineComparison for vertical layout. Shows left (historical) events
 * then right (modern) events, interleaved with column headers. Staggered entrance.
 */

import React from "react";
import {
  palette,
  fonts,
  fontWeights,
  sec,
} from "../../design/theme";
import { fadeIn, slideIn } from "../../utils/animation";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import type { TimelineComparisonData } from "../TimelineComparison/types";

export const TimelineComparisonShort: React.FC<{ data: TimelineComparisonData }> = ({
  data,
}) => {
  return (
    <ShortsWrapper
      title="Timeline Comparison"
      subtitle={data.leftLabel}
      mode="light"
    >
      {(vl, theme, frame, exit) => {
        const startDelay = sec(0.3);
        const eventStagger = sec(0.3);
        const eventFadeDuration = sec(0.4);
        const leftColor = data.leftColor || palette.amber;
        const rightColor = data.rightColor || palette.rust;

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
              overflow: "hidden",
            }}
          >
            {/* Left column header */}
            <div
              style={{
                opacity: fadeIn(frame, startDelay, eventFadeDuration) * exit,
                display: "flex",
                alignItems: "center",
                gap: vl.spacing.sm,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: leftColor,
                }}
              />
              <div
                style={{
                  fontSize: vl.fontSizes.label,
                  fontWeight: fontWeights.semibold,
                  color: theme.text.primary,
                  fontFamily: fonts.heading,
                  textShadow: theme.textShadow,
                }}
              >
                {data.leftLabel}
              </div>
            </div>

            {/* Left events */}
            {data.leftEvents.map((event, idx) => {
              const eventStart = startDelay + (1 + idx) * eventStagger;
              const eventOpacity = fadeIn(frame, eventStart, eventFadeDuration) * exit;
              const eventTranslate = slideIn(frame, eventStart, 20, eventFadeDuration);

              return (
                <div
                  key={`left-${idx}`}
                  style={{
                    opacity: eventOpacity,
                    transform: `translateX(${eventTranslate}px)`,
                    paddingLeft: vl.spacing.lg,
                    borderLeftWidth: 3,
                    borderLeftColor: leftColor,
                    paddingBottom: vl.spacing.md,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: vl.spacing.sm,
                    }}
                  >
                    {event.icon && (
                      <div
                        style={{
                          fontSize: vl.fontSizes.body,
                          marginTop: 2,
                        }}
                      >
                        {event.icon}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: vl.fontSizes.label,
                          fontWeight: fontWeights.semibold,
                          color: theme.text.primary,
                          fontFamily: fonts.heading,
                          textShadow: theme.textShadow,
                        }}
                      >
                        {event.year}
                      </div>
                      <div
                        style={{
                          fontSize: vl.fontSizes.body,
                          color: theme.text.primary,
                          fontFamily: fonts.body,
                          marginTop: 4,
                          textShadow: theme.textShadow,
                        }}
                      >
                        {event.title}
                      </div>
                      {event.description && (
                        <div
                          style={{
                            fontSize: vl.fontSizes.caption,
                            color: theme.text.secondary,
                            fontFamily: fonts.body,
                            marginTop: 4,
                            textShadow: theme.textShadow,
                          }}
                        >
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Right column header */}
            <div
              style={{
                opacity: fadeIn(
                  frame,
                  startDelay + (1 + data.leftEvents.length) * eventStagger,
                  eventFadeDuration
                ) * exit,
                display: "flex",
                alignItems: "center",
                gap: vl.spacing.sm,
                marginTop: vl.spacing.lg,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: rightColor,
                }}
              />
              <div
                style={{
                  fontSize: vl.fontSizes.label,
                  fontWeight: fontWeights.semibold,
                  color: theme.text.primary,
                  fontFamily: fonts.heading,
                  textShadow: theme.textShadow,
                }}
              >
                {data.rightLabel}
              </div>
            </div>

            {/* Right events */}
            {data.rightEvents.map((event, idx) => {
              const eventStart = startDelay + (2 + data.leftEvents.length + idx) * eventStagger;
              const eventOpacity = fadeIn(frame, eventStart, eventFadeDuration) * exit;
              const eventTranslate = slideIn(frame, eventStart, 20, eventFadeDuration);

              return (
                <div
                  key={`right-${idx}`}
                  style={{
                    opacity: eventOpacity,
                    transform: `translateX(${eventTranslate}px)`,
                    paddingLeft: vl.spacing.lg,
                    borderLeftWidth: 3,
                    borderLeftColor: rightColor,
                    paddingBottom: vl.spacing.md,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: vl.spacing.sm,
                    }}
                  >
                    {event.icon && (
                      <div
                        style={{
                          fontSize: vl.fontSizes.body,
                          marginTop: 2,
                        }}
                      >
                        {event.icon}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: vl.fontSizes.label,
                          fontWeight: fontWeights.semibold,
                          color: theme.text.primary,
                          fontFamily: fonts.heading,
                          textShadow: theme.textShadow,
                        }}
                      >
                        {event.year}
                      </div>
                      <div
                        style={{
                          fontSize: vl.fontSizes.body,
                          color: theme.text.primary,
                          fontFamily: fonts.body,
                          marginTop: 4,
                          textShadow: theme.textShadow,
                        }}
                      >
                        {event.title}
                      </div>
                      {event.description && (
                        <div
                          style={{
                            fontSize: vl.fontSizes.caption,
                            color: theme.text.secondary,
                            fontFamily: fonts.body,
                            marginTop: 4,
                            textShadow: theme.textShadow,
                          }}
                        >
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }}
    </ShortsWrapper>
  );
};
