/**
 * PrimarySourceReveal — historical document with timed annotations.
 *
 * The text holds the screen as the primary visual. Annotations layer in by
 * timestamp: underlines draw, circles enclose, margin notes slide in,
 * strike-throughs cancel, translations appear above the original.
 *
 * Architecture:
 *   • Text is rendered as a flowing block — each annotation locates its
 *     target via substring match and overlays an SVG layer aligned to the
 *     measured DOM span position.
 *   • Span measurements happen on first render via useLayoutEffect — the
 *     measured rects persist for the life of the composition.
 *   • Animations are pure-CSS transforms driven by useCurrentFrame.
 *
 * @composition-animation: useCompositionAnimation({ noDrift: true })
 *   No Ken Burns drift — the editorial register is "studied stillness."
 *   The document should sit still so the eye can read. Exit fade is
 *   retained (noExit not set) so episode-level cinematic transitions
 *   apply normally.
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
  Img,
  useCurrentFrame,
  interpolate,
  delayRender,
  continueRender,
} from "remotion";
import { Background } from "../../components/Background";
import { resolveAssetSrc } from "../../utils/assetPath";
import { CLAMP_DECELERATE, areSeamsOwnedByEpisode } from "../../utils/animation";
import { TitleBlock } from "../../components/TitleBlock";
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
  semantic,
} from "../../design/theme";
import { textAccent } from "../../utils/colorUtils";
import type {
  PrimarySourceAnnotation,
  PrimarySourceData,
} from "./types";

/** How long a paragraph or legend entry takes to appear (`paragraphAtSec`, `legend`). */
const PARAGRAPH_FADE_SEC = 0.5;
/** `typeOut`: characters a second for a typed turn and for a streamed reply. */
const TYPE_CPS = 28;
const STREAM_CPS = 48;
/** `typeOut`: how long the caret stays after a turn has finished. */
const CARET_LINGER_SEC = 0.35;
/** Exchange layout: width of the speaker column and the gap beside it. */
const DIALOGUE_LABEL_WIDTH = 330;
const DIALOGUE_LABEL_GAP = 40;

// ── Component ──────────────────────────────────────────────────────────────

export const PrimarySourceReveal: React.FC<{ data: PrimarySourceData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const fps = layout.fps;
  const t = frame / fps;
  // Resolve direction block to keep the data shape consistent with other
  // templates and surface the callback pulse if set; visual side-effects
  // are minimal because PrimarySourceReveal renders no drift.
  const direction = useDirection(data._direction);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();
  // Call useCompositionAnimation with both drift and exit suppressed —
  // PrimarySourceReveal's editorial register is "studied stillness," so
  // no Ken Burns drift. The call is retained so episode-level cinematic
  // exit fades still receive a wiring hook when added in the future.
  const { style: compStyle } = useCompositionAnimation({
    noDrift: true,
  });
  const serif = data.serif ?? true;
  const paper = data.paper ?? "paper";
  const textFadeIn = data.textFadeInSec ?? 1.2;

  const canvasW = layout.width;
  const canvasH = layout.height;

  // ── Text segmentation ────────────────────────────────────────────────────
  // We split text into spans so each annotation target gets its own DOM
  // element with a stable id we can measure. The naïve approach (split on
  // every annotated target) is sufficient since the text is typically
  // < 400 words and annotation count is < 12.

  const segments = useMemo(
    () => buildSegments(data.text, data.annotations ?? []),
    [data.text, data.annotations],
  );
  // Which paragraph each segment belongs to, for `paragraphAtSec`.
  const paragraphOf = useMemo(() => {
    let para = 0;
    return segments.map((seg) => (seg.type === "break" ? para++ : para));
  }, [segments]);
  // Exchange layout (`dialogue`): each paragraph is "Speaker: words".
  const turns = useMemo(() => {
    if (!data.dialogue) return [];
    const speakers: string[] = [];
    const out: { speaker: string; speakerIndex: number; parts: { text: string; annoKey?: string }[] }[] = [];
    let current: (typeof out)[number] | null = null;
    segments.forEach((seg) => {
      if (seg.type === "break") {
        current = null;
        return;
      }
      if (!current) {
        const m = seg.annoKey ? null : /^\s*([^:]{1,40}):\s+/.exec(seg.text);
        const speaker = m ? m[1].trim() : "";
        if (!speakers.includes(speaker)) speakers.push(speaker);
        current = { speaker, speakerIndex: speakers.indexOf(speaker), parts: [] };
        out.push(current);
        const rest = m ? seg.text.slice(m[0].length) : seg.text;
        if (rest) current.parts.push({ text: rest, annoKey: seg.annoKey });
        return;
      }
      current.parts.push({ text: seg.text, annoKey: seg.annoKey });
    });
    return out;
  }, [data.dialogue, segments]);
  /**
   * `typeOut`: how many characters of a turn are showing, and whether its
   * caret is. Null when the turn is not typed (show everything).
   */
  const turnTyping = (turn: number): { shown: number; caret: boolean } | null => {
    const at = data.paragraphAtSec?.[turn];
    if (!data.typeOut || at === undefined) return null;
    const full = turns[turn].parts.map((part) => part.text).join("");
    const elapsed = t - at;
    if (elapsed <= 0) return { shown: 0, caret: false };
    const streamed = turns[turn].speakerIndex !== 0;
    const cps = (streamed ? STREAM_CPS : TYPE_CPS) * (data.typeSpeed ?? 1);
    let shown = Math.min(full.length, Math.floor(elapsed * cps));
    if (streamed && shown < full.length) {
      // A reply arrives in words: hold back the word still being produced.
      shown = full.lastIndexOf(" ", shown) + 1;
    }
    const doneAt = full.length / cps;
    return { shown, caret: elapsed < doneAt + CARET_LINGER_SEC };
  };
  const legendStart = Math.min(...(data.legend ?? [{ appearAtSec: 0 }]).map((l) => l.appearAtSec));
  const turnOpacity = (turn: number): number => {
    const at = data.paragraphAtSec?.[turn];
    if (at === undefined) return 1;
    // A typed turn's label snaps on as the typing starts; its words do the rest.
    const fade = data.typeOut ? 0.15 : PARAGRAPH_FADE_SEC;
    return interpolate(t, [at, at + fade], [0, 1], CLAMP_DECELERATE);
  };
  const paragraphOpacity = (index: number): number => {
    const at = data.paragraphAtSec?.[paragraphOf[index]];
    if (at === undefined) return 1;
    return interpolate(t, [at, at + PARAGRAPH_FADE_SEC], [0, 1], CLAMP_DECELERATE);
  };

  // ── Measured span rects (after layout) ───────────────────────────────────

  // Type size follows excerpt length: a one-sentence quotation at the 26px
  // body size left the card mostly empty and the text small on a phone.
  const excerptFontSize =
    data.fontSize ?? (data.text.length <= 200 ? 44 : data.text.length <= 400 ? 34 : 26);
  // The right-hand column is reserved for margin notes; without any, the
  // card is centred.
  const hasMarginNotes = (data.annotations ?? []).some((a) => a.type === "margin-note");
  const textBoxRef = useRef<HTMLDivElement | null>(null);
  /**
   * Span rects stored as ABSOLUTE viewport coords. AnnotationLayer (rendered
   * in a canvas-sized SVG sibling, not nested under textBoxRef) and
   * MarginNotesLayer / TranslationsLayer (canvas-absolute positioned divs)
   * all use the same coordinate system, so no per-layer conversion.
   */
  const [rectsByKey, setRectsByKey] = useState<Map<string, DOMRect>>(
    new Map(),
  );
  /**
   * Per-line rects for each annotated span. A target phrase that wraps has a
   * bounding rect spanning every line it touches, so underline / highlight
   * drawn from `rectsByKey` would cover whole lines. These follow the text.
   */
  const [lineRectsByKey, setLineRectsByKey] = useState<Map<string, DOMRect[]>>(
    new Map(),
  );
  /**
   * Remotion `delayRender` handle — held open until span measurement
   * completes, so still renders capture the SECOND-render state (with
   * rectsByKey populated) rather than the FIRST (with it empty).
   * Without this, headless Chromium captures before useLayoutEffect's
   * state update propagates and ALL annotations vanish from the still.
   */
  const [measureHandle] = useState(() =>
    delayRender("PrimarySourceReveal: measuring annotation target spans"),
  );

  useLayoutEffect(() => {
    const box = textBoxRef.current;
    if (!box) return;
    const nextRects = new Map<string, DOMRect>();
    const spans = box.querySelectorAll<HTMLSpanElement>("[data-anno-key]");
    spans.forEach((s) => {
      const key = s.dataset.annoKey;
      if (!key) return;
      const r = s.getBoundingClientRect();
      nextRects.set(key, new DOMRect(r.left, r.top, r.width, r.height));
    });
    setRectsByKey(nextRects);
    setLineRectsByKey(measureLineRects(box));
  }, [segments]);

  // Re-measure after a tick — catches font-load layout shifts. After this
  // second measurement, release the delayRender handle so Remotion can
  // capture the still with fully-populated rects.
  useEffect(() => {
    const id = setTimeout(() => {
      const box = textBoxRef.current;
      if (box) {
        const nextRects = new Map<string, DOMRect>();
        const spans = box.querySelectorAll<HTMLSpanElement>("[data-anno-key]");
        spans.forEach((s) => {
          const key = s.dataset.annoKey;
          if (!key) return;
          const r = s.getBoundingClientRect();
          nextRects.set(key, new DOMRect(r.left, r.top, r.width, r.height));
        });
        setRectsByKey(nextRects);
        setLineRectsByKey(measureLineRects(box));
      }
      // Release Remotion's render lock — measurement is complete.
      continueRender(measureHandle);
    }, 200);
    return () => clearTimeout(id);
  }, [measureHandle]);

  // ── Visual tokens ────────────────────────────────────────────────────────

  const bgColor =
    paper === "paper"
      ? mode === "dark"
        ? palette.midnight
        : palette.bone
      : "transparent";
  const textColor = mode === "dark" ? palette.bone : palette.ink;
  // The second speaker's label takes the accent (text-safe on light grounds).
  const speakerAccent = textAccent(palette.gold, mode === "dark");
  // Inside an episode the document is already there when the cut lands; the
  // wrapper owns any fade (utils/animation.ts, "Seam ownership").
  const fadeAlpha = areSeamsOwnedByEpisode() ? 1 : Math.min(1, t / Math.max(0.01, textFadeIn));

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        {/* Canonical title block — POLISH.md L13. TitleBlock owns its own
            FadeIn entrance, so we don't gate it on the document-card fade. */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        {/* The document itself (image mode) — replaces the typeset card. */}
        {data.image && (
          <DocumentImage
            image={data.image}
            t={t}
            totalSec={data.durationSec ?? 14}
            hasTitle={Boolean(data.title || data.subtitle)}
            opacity={fadeAlpha}
            isDark={mode === "dark"}
          />
        )}

        {/* Document card */}
        <div
          style={{
            position: "absolute",
            top: data.title && data.subtitle ? 244 : data.title || data.subtitle ? 220 : 140,
            left: 200,
            right: hasMarginNotes ? 320 : 200,
            bottom: 140,
            background: bgColor,
            borderRadius: paper === "paper" ? 2 : 0,
            boxShadow:
              paper === "paper"
                ? mode === "dark"
                  ? "0 4px 24px rgba(0,0,0,0.5)"
                  : "0 4px 24px rgba(28,24,20,0.12)"
                : "none",
            padding: paper === "paper" ? "60px 64px" : "0",
            opacity: fadeAlpha,
            // Short excerpts sit centred in the card instead of clinging to
            // its top edge with the rest of the sheet empty.
            display: data.image ? "none" : "flex",
            alignItems: excerptFontSize > 26 ? "center" : "flex-start",
          }}
        >
          <div
            ref={textBoxRef}
            style={{
              fontFamily: serif ? fonts.serifBody : fonts.body,
              fontSize: excerptFontSize,
              lineHeight: excerptFontSize > 26 ? 1.4 : 1.55,
              color: textColor,
              letterSpacing: serif ? "0.005em" : "-0.005em",
              maxWidth: "100%",
            }}
          >
            {/* Text content — no nested SVG. The annotation SVG is rendered
                at canvas level (below) using measured absolute coords. */}
            {/* What kind of exchange this is (VIS-12), bound to the exchange. */}
            {data.dialogue && data.label && (
              <div
                style={{
                  marginLeft: DIALOGUE_LABEL_WIDTH + DIALOGUE_LABEL_GAP,
                  marginBottom: "1em",
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.readable,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                  color: theme.text.muted,
                }}
              >
                {data.label}
              </div>
            )}
            {/* Exchange layout: one row per turn, the speaker in its own column. */}
            {data.dialogue &&
              turns.map((turn, ti) => (
                <div
                  key={`turn-${ti}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${DIALOGUE_LABEL_WIDTH}px 1fr`,
                    columnGap: DIALOGUE_LABEL_GAP,
                    alignItems: "baseline",
                    marginTop: ti === 0 ? 0 : "0.75em",
                    opacity: turnOpacity(ti),
                  }}
                >
                  <div
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: fontSizes.readable,
                      fontWeight: fontWeights.medium,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      textAlign: "right",
                      lineHeight: 1.2,
                      color: turn.speakerIndex === 0 ? theme.text.muted : speakerAccent,
                    }}
                  >
                    {turn.speaker}
                  </div>
                  <div>
                    {(() => {
                      const typing = turnTyping(ti);
                      let offset = 0;
                      return turn.parts.map((part, pi) => {
                        const start = offset;
                        offset += part.text.length;
                        // Typed turns are set one character per span, all of
                        // them present from the first frame, so the line
                        // breaks never move as the text arrives.
                        const body = typing
                          ? Array.from(part.text).map((ch, ci) => {
                              const index = start + ci;
                              const isLast = typing.caret && index === typing.shown - 1;
                              return (
                                <span
                                  key={`c-${ci}`}
                                  style={{
                                    opacity: index < typing.shown ? 1 : 0,
                                    position: isLast ? "relative" : undefined,
                                  }}
                                >
                                  {ch}
                                  {isLast && (
                                    <span
                                      style={{
                                        position: "absolute",
                                        left: "100%",
                                        top: "0.14em",
                                        marginLeft: 3,
                                        width: 3,
                                        height: "1em",
                                        background: speakerAccent,
                                      }}
                                    />
                                  )}
                                </span>
                              );
                            })
                          : part.text;
                        return part.annoKey ? (
                          <span key={`p-${pi}`} data-anno-key={part.annoKey}>
                            {body}
                          </span>
                        ) : (
                          <span key={`p-${pi}`}>{body}</span>
                        );
                      });
                    })()}
                  </div>
                </div>
              ))}
            {!data.dialogue && segments.map((seg, i) => {
              if (seg.type === "break") {
                return <div key={`b-${i}`} style={{ height: "0.7em" }} />;
              }
              const isAnnotated = seg.annoKey !== undefined;
              const anno = seg.anno;
              const isStruck =
                anno?.type === "strike" &&
                t >= anno.appearAtSec &&
                (!anno.exitAtSec || t < anno.exitAtSec);
              const styleExtra: React.CSSProperties = isStruck
                ? {
                    textDecoration: "line-through",
                    textDecorationColor: semantic.china,
                    textDecorationThickness: 2,
                  }
                : {};
              const paraOpacity = paragraphOpacity(i);
              if (isAnnotated && seg.annoKey) {
                return (
                  <span
                    key={`s-${i}`}
                    data-anno-key={seg.annoKey}
                    style={{ ...styleExtra, opacity: paraOpacity }}
                  >
                    {seg.text}
                  </span>
                );
              }
              return (
                <span key={`s-${i}`} style={{ opacity: paraOpacity }}>
                  {seg.text}
                </span>
              );
            })}
            {/* Key to the highlights, at reading size. */}
            {data.legend && data.legend.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  marginTop: "1.1em",
                  paddingTop: "0.8em",
                  marginLeft: data.dialogue ? DIALOGUE_LABEL_WIDTH + DIALOGUE_LABEL_GAP : 0,
                  borderTop: `1px solid ${theme.text.muted}55`,
                  // The rule arrives with the first entry, not before it.
                  opacity: interpolate(
                    t,
                    [legendStart, legendStart + PARAGRAPH_FADE_SEC],
                    [0, 1],
                    CLAMP_DECELERATE,
                  ),
                  fontFamily: fonts.body,
                  fontSize: fontSizes.readable + 4,
                  lineHeight: 1.3,
                  color: theme.text.secondary,
                }}
              >
                {data.legend.map((item, li) => (
                  <div
                    key={`lg-${li}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      opacity: interpolate(
                        t,
                        [item.appearAtSec, item.appearAtSec + PARAGRAPH_FADE_SEC],
                        [0, 1],
                        CLAMP_DECELERATE,
                      ),
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: item.color ?? palette.gold,
                        flexShrink: 0,
                      }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Annotation SVG — rendered at canvas level, sibling of the
            document card, sized to full canvas. Uses measured absolute
            viewport coords from rectsByKey. This avoids fragile nested-SVG
            sizing issues that plagued the previous in-document layout. */}
        {rectsByKey.size > 0 && (
          <svg
            width={canvasW}
            height={canvasH}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              overflow: "visible",
              zIndex: 3,
            }}
          >
            {(data.annotations ?? []).map((anno, i) => {
              const key = spanKeyFor(anno);
              const rect = rectsByKey.get(key);
              if (!rect) return null;
              const annoT = t - anno.appearAtSec;
              if (annoT < 0) return null;
              const exitT = anno.exitAtSec ? t - anno.exitAtSec : -1;
              if (exitT >= 0) return null;
              const drawP = Math.min(1, annoT / 0.45);
              const color = resolveColor(anno, mode);
              return (
                <AnnotationLayer
                  key={`an-${i}`}
                  anno={anno}
                  rect={rect}
                  lines={lineRectsByKey.get(key)}
                  progress={drawP}
                  color={color}
                />
              );
            })}
          </svg>
        )}

        {/* Source citation (bottom) */}
        {data.source.trim() !== "" && (
          <div
            data-qa-role="source"
            style={{
              position: "absolute",
              bottom: layout.spacing.xl + 12, // clear of the graphics-safe bottom edge
              left: layout.spacing.xl,
              right: layout.spacing.xl,
              textAlign: "center",
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: fadeAlpha,
            }}
          >
            — {data.source} —
          </div>
        )}

        {/* Margin notes overlay (positioned absolutely off the document) */}
        <MarginNotesLayer
          annotations={data.annotations ?? []}
          rectsByKey={rectsByKey}
          t={t}
          mode={mode}
        />

        {/* Translation overlays (above original text) */}
        <TranslationsLayer
          annotations={data.annotations ?? []}
          rectsByKey={rectsByKey}
          t={t}
          mode={mode}
        />

        {/* Numbered footnotes legend (bottom-left corner) */}
        <NumberedLegendLayer
          annotations={data.annotations ?? []}
          t={t}
          mode={mode}
        />
      </AbsoluteFill>
    </Background>
  );
};

// ── Segment builder ────────────────────────────────────────────────────────

interface Segment {
  type: "text" | "break";
  text: string;
  annoKey?: string;
  anno?: PrimarySourceAnnotation;
}

/**
 * Span key — used for DOM measurement lookup. Based purely on
 * target + targetIndex so multiple annotations on the same text span
 * share a single DOM element (and thus a single rect).
 *
 * This is intentionally NOT tied to the annotation array index, so an
 * underline + margin-note + translate on the same word all measure
 * against the same rect rather than competing for distinct spans
 * (which would silently drop all but the first under the no-overlap
 * rule below).
 */
function spanKeyFor(anno: PrimarySourceAnnotation): string {
  return `${anno.targetIndex ?? 0}:${anno.target}`;
}

/**
 * Split `text` into segments where each unique (target, targetIndex)
 * tuple becomes its own <span data-anno-key> for DOM measurement.
 * Newlines become break segments.
 *
 * Algorithm:
 *   1. Find each annotation's target range in the text.
 *   2. Deduplicate ranges by spanKey so multiple annotations on the
 *      same text share one DOM span (and thus one measurement).
 *   3. Drop ranges that overlap an earlier *distinct* span — true
 *      nested annotations on different (but overlapping) text are
 *      still unsupported; author them sequentially via exitAtSec.
 */
function buildSegments(
  text: string,
  annotations: ReadonlyArray<PrimarySourceAnnotation>,
): Segment[] {
  type Range = {
    start: number;
    end: number;
    annoKey: string;
    anno: PrimarySourceAnnotation;
  };
  const ranges: Range[] = [];
  const seenSpanKeys = new Set<string>();
  annotations.forEach((anno) => {
    const occIdx = anno.targetIndex ?? 0;
    let searchFrom = 0;
    let occCount = 0;
    let pos = -1;
    while (true) {
      const next = text.indexOf(anno.target, searchFrom);
      if (next === -1) break;
      if (occCount === occIdx) {
        pos = next;
        break;
      }
      occCount += 1;
      searchFrom = next + anno.target.length;
    }
    if (pos === -1) return; // target not found; silently skip
    const key = spanKeyFor(anno);
    // If an annotation with the same span key already created a range,
    // skip — both annotations will look up rectsByKey by the same key.
    if (seenSpanKeys.has(key)) return;
    const range: Range = {
      start: pos,
      end: pos + anno.target.length,
      annoKey: key,
      anno,
    };
    // Drop if it overlaps an earlier range that has a DIFFERENT spanKey
    // (i.e., a true cross-annotation overlap on different text). This
    // rejects pathological nesting; identical-span overlap is handled
    // by the seenSpanKeys dedup above.
    const overlap = ranges.some(
      (r) => !(range.end <= r.start || range.start >= r.end),
    );
    if (!overlap) {
      ranges.push(range);
      seenSpanKeys.add(key);
    }
  });
  ranges.sort((a, b) => a.start - b.start);

  // Walk text producing segments.
  const segments: Segment[] = [];
  let cursor = 0;
  const pushText = (slice: string, anno?: PrimarySourceAnnotation, key?: string) => {
    // Convert raw newlines into break segments.
    const parts = slice.split(/(\n\n+|\n)/);
    parts.forEach((part) => {
      if (part === "") return;
      if (/^\n\n+$/.test(part)) {
        segments.push({ type: "break", text: "" });
      } else if (part === "\n") {
        segments.push({ type: "text", text: " " });
      } else {
        if (anno && key) {
          segments.push({ type: "text", text: part, annoKey: key, anno });
        } else {
          segments.push({ type: "text", text: part });
        }
      }
    });
  };

  ranges.forEach((r) => {
    if (r.start > cursor) pushText(text.slice(cursor, r.start));
    pushText(text.slice(r.start, r.end), r.anno, r.annoKey);
    cursor = r.end;
  });
  if (cursor < text.length) pushText(text.slice(cursor));
  return segments;
}

// ── Annotation layer ───────────────────────────────────────────────────────

function resolveColor(
  anno: PrimarySourceAnnotation,
  mode: "light" | "dark",
): string {
  if (anno.color) return anno.color;
  switch (anno.type) {
    case "highlight":
      return palette.gold;
    case "strike":
      return semantic.china;
    case "translate":
      return palette.dustblue;
    case "underline":
    case "circle":
    case "margin-note":
    case "numbered":
    default:
      return mode === "dark" ? palette.gold : palette.ink;
  }
}

const AnnotationLayer: React.FC<{
  anno: PrimarySourceAnnotation;
  /** Span's absolute viewport coords. The SVG container is sized to the
   * full canvas (no nested-SVG offset to worry about), so rect.left/top
   * map directly to SVG x/y. */
  rect: DOMRect;
  /** One rect per rendered line of the span; falls back to `rect`. */
  lines?: DOMRect[];
  progress: number;
  color: string;
}> = ({ anno, rect, lines, progress: p, color }) => {
  const lineRects = lines && lines.length > 0 ? lines : [rect];
  // Draw progress runs through the lines in reading order.
  const lineProgress = (i: number) =>
    Math.max(0, Math.min(1, p * lineRects.length - i));
  if (anno.type === "underline") {
    return (
      <>
        {lineRects.map((r, i) => {
          const lineY = r.top + r.height + 2;
          return (
            <line
              key={i}
              x1={r.left}
              y1={lineY}
              x2={r.left + r.width * lineProgress(i)}
              y2={lineY}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}
      </>
    );
  }
  if (anno.type === "circle") {
    const padX = 10;
    const padY = 6;
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
      <>
        {lineRects.map((r, i) => (
          <rect
            key={i}
            x={r.left - 4}
            y={r.top - 2}
            width={(r.width + 8) * lineProgress(i)}
            height={r.height + 4}
            fill={color}
            opacity={0.32}
          />
        ))}
      </>
    );
  }
  return null;
};

/** Per-line client rects for every annotated span in the text box. */
function measureLineRects(box: HTMLElement): Map<string, DOMRect[]> {
  const out = new Map<string, DOMRect[]>();
  box.querySelectorAll<HTMLSpanElement>("[data-anno-key]").forEach((s) => {
    const key = s.dataset.annoKey;
    if (!key) return;
    const lines: DOMRect[] = [];
    for (const cr of Array.from(s.getClientRects())) {
      if (cr.width < 1 || cr.height < 1) continue;
      const same = lines.find((ln) => Math.abs(ln.top - cr.top) < cr.height / 2);
      if (same) {
        const left = Math.min(same.left, cr.left);
        const right = Math.max(same.right, cr.right);
        lines[lines.indexOf(same)] = new DOMRect(left, same.top, right - left, same.height);
      } else {
        lines.push(new DOMRect(cr.left, cr.top, cr.width, cr.height));
      }
    }
    out.set(key, lines);
  });
  return out;
}

// ── Margin notes layer ─────────────────────────────────────────────────────

const MarginNotesLayer: React.FC<{
  annotations: ReadonlyArray<PrimarySourceAnnotation>;
  rectsByKey: Map<string, DOMRect>;
  t: number;
  mode: "light" | "dark";
}> = ({ annotations, rectsByKey, t, mode }) => {
  const marginX = layout.width - 290; // right margin column start
  // rectsByKey is empty on first paint; useLayoutEffect populates it.
  if (rectsByKey.size === 0) return null;
  return (
    <>
      {annotations.map((anno, i) => {
        if (anno.type !== "margin-note" || !anno.note) return null;
        const key = spanKeyFor(anno);
        const rect = rectsByKey.get(key);
        if (!rect) return null;
        const annoT = t - anno.appearAtSec;
        if (annoT < 0) return null;
        if (anno.exitAtSec && t >= anno.exitAtSec) return null;
        const slide = interpolate(annoT, [0, 0.5], [16, 0], {
          extrapolateRight: "clamp",
        });
        const fade = Math.min(1, annoT / 0.4);
        // rect.top is now stored as ABSOLUTE viewport coords, so it's
        // directly usable as canvas-Y (canvas == viewport in Remotion).
        const labelTop = rect.top - 2;
        const spanRightX = rect.left + rect.width;
        const leaderWidth = Math.max(12, marginX - spanRightX - 8);
        return (
          <div
            key={`mn-${i}`}
            style={{
              position: "absolute",
              top: labelTop,
              left: marginX,
              width: 260,
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: 16,
              lineHeight: 1.35,
              color: mode === "dark" ? palette.gold : palette.ink,
              opacity: fade,
              transform: `translateX(${slide}px)`,
            }}
          >
            <svg
              width={leaderWidth}
              height={14}
              style={{
                position: "absolute",
                top: 6,
                left: -leaderWidth,
              }}
            >
              <line
                x1={0}
                y1={7}
                x2={leaderWidth - 4}
                y2={7}
                stroke={palette.gold}
                strokeWidth={1.5}
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

// ── Translation layer (above original spans) ───────────────────────────────

const TranslationsLayer: React.FC<{
  annotations: ReadonlyArray<PrimarySourceAnnotation>;
  rectsByKey: Map<string, DOMRect>;
  t: number;
  mode: "light" | "dark";
}> = ({ annotations, rectsByKey, t, mode }) => {
  if (rectsByKey.size === 0) return null;
  return (
    <>
      {annotations.map((anno, i) => {
        if (anno.type !== "translate" || !anno.note) return null;
        const key = spanKeyFor(anno);
        const rect = rectsByKey.get(key);
        if (!rect) return null;
        const annoT = t - anno.appearAtSec;
        if (annoT < 0) return null;
        if (anno.exitAtSec && t >= anno.exitAtSec) return null;
        const fade = Math.min(1, annoT / 0.4);
        const drop = interpolate(annoT, [0, 0.4], [-6, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={`tr-${i}`}
            style={{
              position: "absolute",
              top: rect.top - 24,
              left: rect.left,
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: 14,
              color: mode === "dark" ? palette.dustblue : palette.dustblue,
              opacity: fade,
              transform: `translateY(${drop}px)`,
              maxWidth: Math.max(140, rect.width + 60),
              lineHeight: 1.2,
            }}
          >
            {anno.note}
          </div>
        );
      })}
    </>
  );
};

// ── Numbered legend layer (bottom-left ledger) ─────────────────────────────

const NumberedLegendLayer: React.FC<{
  annotations: ReadonlyArray<PrimarySourceAnnotation>;
  t: number;
  mode: "light" | "dark";
}> = ({ annotations, t, mode }) => {
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
              fontSize: 14,
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
                background: palette.gold,
                color: palette.ink,
                fontFamily: fonts.mono,
                fontSize: 12,
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

// ── DocumentImage — the real page, with highlight boxes ─────────────────────

const DOC_MAX_W = 1640;
const DOC_HIGHLIGHT_WIPE_SEC = 0.5;

const DocumentImage: React.FC<{
  image: NonNullable<PrimarySourceData["image"]>;
  t: number;
  totalSec: number;
  hasTitle: boolean;
  opacity: number;
  isDark: boolean;
}> = ({ image, t, totalSec, hasTitle, opacity, isDark }) => {
  // Fit the excerpt between the title block and the source line.
  const areaTop = hasTitle ? 210 : 110;
  const areaBottom = layout.height - 110;
  const aspect = image.width / image.height;
  const w = Math.min(DOC_MAX_W, (areaBottom - areaTop) * aspect);
  const h = w / aspect;
  const left = (layout.width - w) / 2;
  const top = areaTop + (areaBottom - areaTop - h) / 2;
  // A slow push keeps the page alive through the hold.
  const push = 1 + 0.025 * Math.min(1, t / Math.max(0.01, totalSec));
  const edgeFade =
    "linear-gradient(to bottom, transparent 0%, #000 9%, #000 91%, transparent 100%)";

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        opacity,
        transform: `scale(${push})`,
        transformOrigin: "center center",
        // Blend the whole group, not the <Img>: this div is a stacking
        // context (transform), so a blend mode on a child would only see the
        // group's empty backdrop. White page → card tone on paper; inverted
        // and screened on ink.
        mixBlendMode: isDark ? "screen" : "multiply",
      }}
    >
      <Img
        src={resolveAssetSrc(image.src)}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          filter: isDark ? "invert(1)" : undefined,
          maskImage: edgeFade,
          WebkitMaskImage: edgeFade,
        }}
      />
      {(image.highlights ?? []).map((hl, i) => {
        const wipe = interpolate(
          t,
          [hl.appearAtSec, hl.appearAtSec + DOC_HIGHLIGHT_WIPE_SEC],
          [0, 1],
          CLAMP_DECELERATE,
        );
        if (wipe <= 0) return null;
        return (
          <div
            key={`hl-${i}`}
            style={{
              position: "absolute",
              left: `${hl.x}%`,
              top: `${hl.y}%`,
              width: `${hl.w * wipe}%`,
              height: `${hl.h}%`,
              background: palette.gold,
              opacity: 0.42,
              mixBlendMode: isDark ? "normal" : "multiply",
            }}
          />
        );
      })}
    </div>
  );
};

