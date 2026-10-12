/**
 * TelegramCable — diplomatic cable register with bureaucratic chrome.
 *
 * Architecture mirrors PrimarySourceReveal (DOM-measured spans for
 * annotations + redactions, canvas-level SVG overlay, delayRender lifecycle),
 * but with cable-specific chrome instead of editorial chrome:
 *
 *   • Header block (FROM/TO/SUBJECT/DATE/FILE NUMBER)
 *   • Classification rubber stamps (TOP/SECRET/CONFIDENTIAL) top + bottom
 *   • DECLASSIFIED diagonal overstamp
 *   • Body: ALL-CAPS typewriter, double-spaced, optional numbered paragraphs
 *   • BEGIN/END markers
 *   • Onionskin / carbon-copy / plain paper substrate
 *   • 3-hole binder punches on left margin
 *   • Redactions: solid black bars at x-height + exemption code in margin
 *   • Annotations: underline, circle, highlight, margin-note, numbered
 *
 * @composition-animation: useCompositionAnimation({ noDrift: true })
 *   Cable register is "primary-source unfiltered" — no Ken Burns drift on
 *   top. Exit fade retained for episode-level transitions.
 */

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  delayRender,
  continueRender,
} from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import {
  ArchivalPaper,
  RubberStamp,
  PunchHoles,
  archivalPalette,
} from "../../components/ArchivalChrome";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import {
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  semantic,
  sec,
  zIndex,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import type {
  CableAnnotation,
  CableRedaction,
  TelegramCableData,
} from "./types";

// ── Span key (same pattern as PrimarySourceReveal) ─────────────────────────

function annotationSpanKey(anno: CableAnnotation): string {
  return `a:${anno.targetIndex ?? 0}:${anno.target}`;
}
function redactionSpanKey(red: CableRedaction): string {
  return `r:${red.targetIndex ?? 0}:${red.target}`;
}

// ── Segment building ───────────────────────────────────────────────────────

interface Segment {
  type: "text" | "break";
  text: string;
  spanKey?: string;
  /** Either an annotation, a redaction, or undefined (plain text). */
  anno?: CableAnnotation;
  redaction?: CableRedaction;
}

function buildCableSegments(
  rawBody: string,
  annotations: ReadonlyArray<CableAnnotation>,
  redactions: ReadonlyArray<CableRedaction>,
  preserveCase: boolean,
  numbered: boolean,
): Segment[] {
  // Apply ALL-CAPS transformation if needed (matches the rendered case
  // so substring matching against annotation/redaction targets works).
  let body = preserveCase ? rawBody : rawBody.toUpperCase();

  // Number paragraphs.
  if (numbered) {
    const paras = body.split(/\n\n+/);
    body = paras
      .map((p, i) => `${i + 1}. ${p.trim()}`)
      .join("\n\n");
  }

  type Range = {
    start: number;
    end: number;
    spanKey: string;
    anno?: CableAnnotation;
    redaction?: CableRedaction;
  };
  const ranges: Range[] = [];
  const seen = new Set<string>();

  function findOcc(target: string, occIdx: number): number {
    const needle = preserveCase ? target : target.toUpperCase();
    let searchFrom = 0;
    let count = 0;
    while (true) {
      const at = body.indexOf(needle, searchFrom);
      if (at === -1) return -1;
      if (count === occIdx) return at;
      count += 1;
      searchFrom = at + needle.length;
    }
  }

  // Redactions take priority (they're physically blacked out — annotations
  // on redacted text don't make sense).
  redactions.forEach((r) => {
    const occ = r.targetIndex ?? 0;
    const at = findOcc(r.target, occ);
    if (at === -1) return;
    const key = redactionSpanKey(r);
    if (seen.has(key)) return;
    const range: Range = {
      start: at,
      end: at + r.target.length,
      spanKey: key,
      redaction: r,
    };
    const overlap = ranges.some(
      (rr) => !(range.end <= rr.start || range.start >= rr.end),
    );
    if (!overlap) {
      ranges.push(range);
      seen.add(key);
    }
  });

  annotations.forEach((a) => {
    const occ = a.targetIndex ?? 0;
    const at = findOcc(a.target, occ);
    if (at === -1) return;
    const key = annotationSpanKey(a);
    if (seen.has(key)) return;
    const range: Range = {
      start: at,
      end: at + a.target.length,
      spanKey: key,
      anno: a,
    };
    const overlap = ranges.some(
      (rr) => !(range.end <= rr.start || range.start >= rr.end),
    );
    if (!overlap) {
      ranges.push(range);
      seen.add(key);
    }
  });

  ranges.sort((x, y) => x.start - y.start);

  const segments: Segment[] = [];
  let cursor = 0;
  function push(slice: string, range?: Range): void {
    const parts = slice.split(/(\n\n+|\n)/);
    parts.forEach((part) => {
      if (part === "") return;
      if (/^\n\n+$/.test(part)) {
        segments.push({ type: "break", text: "" });
      } else if (part === "\n") {
        segments.push({ type: "text", text: " " });
      } else if (range) {
        segments.push({
          type: "text",
          text: part,
          spanKey: range.spanKey,
          anno: range.anno,
          redaction: range.redaction,
        });
      } else {
        segments.push({ type: "text", text: part });
      }
    });
  }
  ranges.forEach((r) => {
    if (r.start > cursor) push(body.slice(cursor, r.start));
    push(body.slice(r.start, r.end), r);
    cursor = r.end;
  });
  if (cursor < body.length) push(body.slice(cursor));
  return segments;
}

// ── Component ──────────────────────────────────────────────────────────────

export const TelegramCable: React.FC<{ data: TelegramCableData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const fps = layout.fps;
  const t = frame / fps;
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const mode = data.backgroundVariant ?? "light";
  const emphasis = useEpisodeColorEmphasis();

  const preserveCase = data.preserveCase ?? false;
  const numbered = data.numberedParagraphs ?? true;
  const paper = data.paper ?? "onionskin";
  const punchHoles = data.punchHoles ?? true;
  const aged = data.aged ?? 0.25;

  const segments = useMemo(
    () =>
      buildCableSegments(
        data.body,
        data.annotations ?? [],
        data.redactions ?? [],
        preserveCase,
        numbered,
      ),
    [data.body, data.annotations, data.redactions, preserveCase, numbered],
  );

  // ── Measurement (mirrors PrimarySourceReveal pattern) ──────────────────
  const textBoxRef = useRef<HTMLDivElement | null>(null);
  const [rectsByKey, setRectsByKey] = useState<Map<string, DOMRect>>(
    new Map(),
  );
  const [measureHandle] = useState(() =>
    delayRender("TelegramCable: measuring annotation + redaction spans"),
  );

  useLayoutEffect(() => {
    const box = textBoxRef.current;
    if (!box) return;
    const nextRects = new Map<string, DOMRect>();
    const spans = box.querySelectorAll<HTMLSpanElement>("[data-span-key]");
    spans.forEach((s) => {
      const key = s.dataset.spanKey;
      if (!key) return;
      const r = s.getBoundingClientRect();
      nextRects.set(key, new DOMRect(r.left, r.top, r.width, r.height));
    });
    setRectsByKey(nextRects);
  }, [segments]);

  useEffect(() => {
    const id = setTimeout(() => {
      const box = textBoxRef.current;
      if (box) {
        const nextRects = new Map<string, DOMRect>();
        const spans = box.querySelectorAll<HTMLSpanElement>("[data-span-key]");
        spans.forEach((s) => {
          const key = s.dataset.spanKey;
          if (!key) return;
          const r = s.getBoundingClientRect();
          nextRects.set(key, new DOMRect(r.left, r.top, r.width, r.height));
        });
        setRectsByKey(nextRects);
      }
      continueRender(measureHandle);
    }, 200);
    return () => clearTimeout(id);
  }, [measureHandle]);

  // ── Layout ─────────────────────────────────────────────────────────────
  const topPad = data.title ? 240 : 100;
  const bottomPad = 100;
  const cardHeight = layout.height - topPad - bottomPad;
  const cardWidth = layout.width * 0.72;
  const cardLeft = (layout.width - cardWidth) / 2;
  const punchHoleLeft = 24;
  const contentPadLeft = punchHoles ? 96 : 56;
  const contentPadRight = 56;
  const contentPadTop = 36;
  const contentPadBottom = 36;

  // Era-based typewriter: pre-1961 uses Special Elite (uneven baseline);
  // post-1961 IBM Selectric era uses cleaner Plex Mono.
  // We default to Special Elite for the period register; authors can
  // override by tweaking the dateTimeGroup to imply era and re-rendering.
  const typewriterFont = fonts.typewriter;

  const accentColor = emphasis.primaryAccent ?? semantic.china;

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

        {/* The cable card */}
        <div
          style={{
            position: "absolute",
            top: topPad,
            left: cardLeft,
            width: cardWidth,
            height: cardHeight,
            opacity: fadeIn(frame, 0, sec(0.6)),
          }}
        >
          <ArchivalPaper
            width={cardWidth}
            height={cardHeight}
            // ArchivalPaper variants: letter / newsprint / onionskin / carbon.
            // Map TelegramCable's "plain" → "letter" (cleanest of the cream
            // variants — closest match to modern declassified facsimile look).
            variant={paper === "plain" ? "letter" : paper}
            aged={aged}
            seed={11}
          >
            {/* Punch holes on left margin. */}
            {punchHoles && (
              <PunchHoles
                height={cardHeight}
                left={punchHoleLeft}
                radius={9}
                count={3}
              />
            )}

            {/* Top classification rubber stamp. */}
            {data.classification && (
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: cardWidth / 2 - 110,
                  zIndex: zIndex.overlay,
                  opacity: fadeIn(frame, sec(0.2), sec(0.5)),
                }}
              >
                <RubberStamp
                  label={data.classification}
                  color={archivalPalette.classificationRed}
                  rotation={-5}
                  scale={0.85}
                />
              </div>
            )}

            {/* Content area — header + body. */}
            <div
              style={{
                position: "relative",
                padding: `${contentPadTop + (data.classification ? 50 : 0)}px ${contentPadRight}px ${contentPadBottom}px ${contentPadLeft}px`,
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header block (FROM/TO/SUBJECT/DATE/FILE NUMBER). */}
              <CableHeader
                header={data.header}
                fileNumber={data.header.fileNumber}
                transmissionType={data.header.transmissionType ?? "INCOMING TELEGRAM"}
                font={typewriterFont}
                frame={frame}
              />

              {/* BEGIN marker (if specified). */}
              {data.beginEndMarkers && (
                <div
                  style={{
                    fontFamily: typewriterFont,
                    fontSize: fontSizes.body,
                    fontWeight: fontWeights.semibold,
                    color: palette.ink,
                    marginTop: 18,
                    marginBottom: 12,
                    letterSpacing: 2,
                    opacity: fadeIn(frame, sec(0.7), sec(0.4)),
                  }}
                >
                  BEGIN {data.beginEndMarkers.begin.toUpperCase()}
                </div>
              )}

              {/* Body — typewriter ALL-CAPS, double-spaced. */}
              <div
                ref={textBoxRef}
                style={{
                  fontFamily: typewriterFont,
                  fontSize: fontSizes.label,
                  lineHeight: 2.0,
                  color: palette.ink,
                  letterSpacing: 0.2,
                  marginTop: data.beginEndMarkers ? 0 : 18,
                  flex: 1,
                  whiteSpace: "pre-wrap",
                  opacity: fadeIn(frame, sec(0.8), sec(0.5)),
                }}
              >
                {segments.map((seg, i) => {
                  if (seg.type === "break") {
                    return <div key={`b-${i}`} style={{ height: "1em" }} />;
                  }
                  if (seg.spanKey) {
                    // Span carries an annotation or redaction lookup key.
                    return (
                      <span
                        key={`s-${i}`}
                        data-span-key={seg.spanKey}
                        style={
                          seg.redaction
                            ? {
                                // Hide the underlying text — the redaction
                                // bar SVG overlay will cover it visually.
                                color: "transparent",
                              }
                            : undefined
                        }
                      >
                        {seg.text}
                      </span>
                    );
                  }
                  return <span key={`s-${i}`}>{seg.text}</span>;
                })}
              </div>

              {/* END marker (if specified). */}
              {data.beginEndMarkers && (
                <div
                  style={{
                    fontFamily: typewriterFont,
                    fontSize: fontSizes.body,
                    fontWeight: fontWeights.semibold,
                    color: palette.ink,
                    marginTop: 16,
                    letterSpacing: 2,
                  }}
                >
                  END {data.beginEndMarkers.end.toUpperCase()}
                </div>
              )}
            </div>

            {/* Bottom classification rubber stamp. */}
            {data.classification && (
              <div
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: cardWidth / 2 - 110,
                  zIndex: zIndex.overlay,
                  opacity: fadeIn(frame, sec(0.3), sec(0.5)),
                }}
              >
                <RubberStamp
                  label={data.classification}
                  color={archivalPalette.classificationRed}
                  rotation={5}
                  scale={0.85}
                />
              </div>
            )}

            {/* DECLASSIFIED diagonal overstamp. */}
            {data.declassified && (
              <div
                style={{
                  position: "absolute",
                  top: cardHeight / 2 - 60,
                  left: cardWidth / 2 - 200,
                  zIndex: zIndex.transition,
                  opacity: fadeIn(frame, sec(1.5), sec(0.5)) * 0.85,
                }}
              >
                <RubberStamp
                  label="DECLASSIFIED"
                  subLabel={data.declassifiedDate}
                  color={archivalPalette.declassifiedBlack}
                  rotation={-18}
                  scale={1.4}
                  opacity={0.7}
                />
              </div>
            )}
          </ArchivalPaper>
        </div>

        {/* Annotation overlay — canvas-level SVG using absolute viewport
            coords (mirrors PrimarySourceReveal pattern). */}
        {rectsByKey.size > 0 && (
          <svg
            width={layout.width}
            height={layout.height}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              overflow: "visible",
              zIndex: zIndex.attribution,
            }}
          >
            {(data.annotations ?? []).map((anno, i) => {
              const key = annotationSpanKey(anno);
              const rect = rectsByKey.get(key);
              if (!rect) return null;
              const annoT = t - anno.appearAtSec;
              if (annoT < 0) return null;
              if (anno.exitAtSec && t >= anno.exitAtSec) return null;
              const p = Math.min(1, annoT / 0.45);
              const color = anno.color ?? accentColor;
              return (
                <AnnotationOverlay
                  key={`an-${i}`}
                  anno={anno}
                  rect={rect}
                  progress={p}
                  color={color}
                />
              );
            })}
            {(data.redactions ?? []).map((red, i) => {
              const key = redactionSpanKey(red);
              const rect = rectsByKey.get(key);
              if (!rect) return null;
              return (
                <RedactionBar
                  key={`rd-${i}`}
                  rect={rect}
                  exemptionCode={red.exemptionCode}
                />
              );
            })}
          </svg>
        )}

        {/* Margin notes (canvas-absolute positioned divs). */}
        {rectsByKey.size > 0 && (
          <MarginNotesLayer
            annotations={data.annotations ?? []}
            rectsByKey={rectsByKey}
            t={t}
            accentColor={accentColor}
          />
        )}

        {/* Numbered footnote ledger (bottom-left). */}
        <NumberedLedger
          annotations={data.annotations ?? []}
          t={t}
          mode={mode}
          accentColor={accentColor}
        />

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
      </AbsoluteFill>
    </Background>
  );
};

// ── CableHeader ────────────────────────────────────────────────────────────

const CableHeader: React.FC<{
  header: TelegramCableData["header"];
  fileNumber?: string;
  transmissionType: string;
  font: string;
  frame: number;
}> = ({ header, fileNumber, transmissionType, font, frame }) => {
  const opacity = fadeIn(frame, sec(0.4), sec(0.4));
  const rowStyle: React.CSSProperties = {
    display: "flex",
    gap: 12,
    fontFamily: font,
    fontSize: fontSizes.caption,
    color: palette.ink,
    letterSpacing: 0.3,
  };
  const labelStyle: React.CSSProperties = {
    width: 92,
    fontWeight: fontWeights.semibold,
    flexShrink: 0,
  };
  return (
    <div
      style={{
        opacity,
        borderBottom: `1.5px solid ${palette.ink}`,
        paddingBottom: 14,
        marginBottom: 10,
      }}
    >
      {/* Top row — DEPARTMENT OF STATE / TRANSMISSION TYPE / FILE NUMBER. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: font,
          fontSize: fontSizes.label,
          fontWeight: fontWeights.semibold,
          color: palette.ink,
          letterSpacing: 1,
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        <span>Department of State</span>
        <span>{transmissionType}</span>
        {fileNumber ? <span>{fileNumber}</span> : <span />}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>FROM:</span>
        <span>{header.from.toUpperCase()}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>TO:</span>
        <span>{header.to.toUpperCase()}</span>
      </div>
      {header.subject && (
        <div style={rowStyle}>
          <span style={labelStyle}>SUBJECT:</span>
          <span>{header.subject.toUpperCase()}</span>
        </div>
      )}
      <div style={rowStyle}>
        <span style={labelStyle}>DTG:</span>
        <span>{header.dateTimeGroup}</span>
      </div>
    </div>
  );
};

// ── AnnotationOverlay (SVG) ────────────────────────────────────────────────

const AnnotationOverlay: React.FC<{
  anno: CableAnnotation;
  rect: DOMRect;
  progress: number;
  color: string;
}> = ({ anno, rect, progress: p, color }) => {
  if (anno.type === "underline") {
    const lineY = rect.top + rect.height + 1;
    return (
      <line
        x1={rect.left}
        y1={lineY}
        x2={rect.left + rect.width * p}
        y2={lineY}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    );
  }
  if (anno.type === "circle") {
    const padX = 8;
    const padY = 4;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = rect.width / 2 + padX;
    const ry = rect.height / 2 + padY;
    const approxLen = 2 * Math.PI * Math.max(rx, ry);
    return (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={approxLen}
        strokeDashoffset={approxLen * (1 - p)}
      />
    );
  }
  if (anno.type === "highlight") {
    return (
      <rect
        x={rect.left - 3}
        y={rect.top - 1}
        width={(rect.width + 6) * p}
        height={rect.height + 2}
        fill={color}
        opacity={0.28}
      />
    );
  }
  return null;
};

// ── RedactionBar ───────────────────────────────────────────────────────────

const RedactionBar: React.FC<{
  rect: DOMRect;
  exemptionCode?: string;
}> = ({ rect, exemptionCode }) => {
  // Bar at x-height — typically 65-70% of full line height (line-height is
  // 2.0 = 36px; x-height portion is ~22px). We center the bar vertically.
  const barHeight = Math.max(14, rect.height * 0.6);
  const barY = rect.top + (rect.height - barHeight) / 2;
  return (
    <g>
      <rect
        x={rect.left - 2}
        y={barY}
        width={rect.width + 4}
        height={barHeight}
        fill="#0a0a0a"
      />
      {exemptionCode && (
        <text
          x={rect.left + rect.width + 18}
          y={rect.top + rect.height / 2 + 4}
          fontFamily="'Special Elite', monospace"
          fontSize={11}
          fill="#7a4040"
          letterSpacing={1}
        >
          {exemptionCode}
        </text>
      )}
    </g>
  );
};

// ── MarginNotesLayer ───────────────────────────────────────────────────────

const MarginNotesLayer: React.FC<{
  annotations: ReadonlyArray<CableAnnotation>;
  rectsByKey: Map<string, DOMRect>;
  t: number;
  accentColor: string;
}> = ({ annotations, rectsByKey, t, accentColor }) => {
  const marginX = layout.width * 0.86 + 40;
  return (
    <>
      {annotations.map((anno, i) => {
        if (anno.type !== "margin-note" || !anno.note) return null;
        const key = annotationSpanKey(anno);
        const rect = rectsByKey.get(key);
        if (!rect) return null;
        const annoT = t - anno.appearAtSec;
        if (annoT < 0) return null;
        if (anno.exitAtSec && t >= anno.exitAtSec) return null;
        const slide = interpolate(annoT, [0, 0.5], [10, 0], {
          extrapolateRight: "clamp",
        });
        const fade = Math.min(1, annoT / 0.4);
        const labelTop = rect.top - 4;
        const leaderWidth = Math.max(
          12,
          marginX - (rect.left + rect.width + 12),
        );
        return (
          <div
            key={`mn-${i}`}
            style={{
              position: "absolute",
              top: labelTop,
              left: marginX,
              width: 220,
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.caption,
              lineHeight: 1.3,
              color: accentColor,
              opacity: fade,
              transform: `translateX(${slide}px)`,
            }}
          >
            <svg
              width={leaderWidth}
              height={12}
              style={{
                position: "absolute",
                top: 6,
                left: -leaderWidth,
              }}
            >
              <line
                x1={0}
                y1={6}
                x2={leaderWidth - 4}
                y2={6}
                stroke={accentColor}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.7}
              />
            </svg>
            <span>{anno.note}</span>
          </div>
        );
      })}
    </>
  );
};

// ── NumberedLedger ─────────────────────────────────────────────────────────

const NumberedLedger: React.FC<{
  annotations: ReadonlyArray<CableAnnotation>;
  t: number;
  mode: "light" | "dark";
  accentColor: string;
}> = ({ annotations, t, mode, accentColor }) => {
  const numbered = annotations
    .map((a, idx) => ({ a, idx }))
    .filter((x) => x.a.type === "numbered" && x.a.note);
  if (numbered.length === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: layout.spacing.xl,
        width: 320,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {numbered.map(({ a, idx }, n) => {
        const annoT = t - a.appearAtSec;
        if (annoT < 0) return null;
        if (a.exitAtSec && t >= a.exitAtSec) return null;
        const fade = Math.min(1, annoT / 0.4);
        return (
          <div
            key={`leg-${idx}`}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              fontFamily: fonts.serifBody,
              fontSize: fontSizes.caption,
              color: mode === "dark" ? palette.bone : palette.ink,
              opacity: fade,
              lineHeight: 1.3,
            }}
          >
            <span
              style={{
                display: "inline-block",
                minWidth: 22,
                height: 22,
                borderRadius: "50%",
                background: accentColor,
                color: palette.paper,
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta + 1,
                fontWeight: fontWeights.semibold,
                textAlign: "center",
                lineHeight: "22px",
                flexShrink: 0,
              }}
            >
              {n + 1}
            </span>
            <span>{a.note}</span>
          </div>
        );
      })}
    </div>
  );
};
