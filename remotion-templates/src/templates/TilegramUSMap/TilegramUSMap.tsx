/**
 * TilegramUSMap — US states as a hex grid where every state is equal size.
 *
 * The editorial form for US electoral / policy stories where geographic
 * area would otherwise distort the visual weight. Wyoming and California
 * occupy the same hex; the only thing that varies across tiles is fill
 * color (data) and the postal abbreviation.
 *
 * Animation sequence:
 *   1. Title fades in (handled by TitleBlock)
 *   2. Hex tiles appear top-to-bottom with row stagger + small per-col
 *      offset, each tile fades in and scales from 0.7 → 1.0
 *   3. Legend fades in after the last row settles
 *   4. Ken Burns drift + exit fade (via useCompositionAnimation)
 *
 * Hex geometry: pointy-top hexagons. For hex size s (distance from center
 * to a vertex), width = sqrt(3)*s, height = 2s. Layout uses odd-row
 * horizontal stagger so rows interlock cleanly. Vertical pitch between
 * rows = 1.5*s (height * 0.75) so hexes nest without gaps.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  letterSpacing,
  layout,
  sec,
  contentArea,
  timing,
} from "../../design/theme";
import {
  fadeIn,
  exitFade,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { MapTitleFrame } from "../../components/MapTitleFrame";
import { resolveCartoucheCorner } from "../../utils/mapTitlePlacement";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { checkChartDataCommon } from "../../utils/dataWarnings";
import type {
  TilegramUSMapData,
  USStateCode,
  TilegramColorScale,
} from "./types";

// ── Canonical NPR-style US tilegram (row, col) coordinates ─────────────
// Row 0 = top of map (Alaska & Maine at the corners), Row 7 = bottom
// (Texas & Florida). 8 rows × 12 columns; not every cell is filled.
// Result is a recognizable US outline with every state at equal weight.
const HEX_GRID: Record<USStateCode, { row: number; col: number }> = {
  AK: { row: 0, col: 0 },
  ME: { row: 0, col: 10 },

  VT: { row: 1, col: 9 },
  NH: { row: 1, col: 10 },

  WA: { row: 2, col: 1 },
  ID: { row: 2, col: 2 },
  MT: { row: 2, col: 3 },
  ND: { row: 2, col: 4 },
  MN: { row: 2, col: 5 },
  IL: { row: 2, col: 6 },
  WI: { row: 2, col: 7 },
  MI: { row: 2, col: 8 },
  NY: { row: 2, col: 9 },
  MA: { row: 2, col: 10 },

  OR: { row: 3, col: 1 },
  UT: { row: 3, col: 2 },
  WY: { row: 3, col: 3 },
  SD: { row: 3, col: 4 },
  IA: { row: 3, col: 5 },
  IN: { row: 3, col: 6 },
  OH: { row: 3, col: 7 },
  PA: { row: 3, col: 8 },
  NJ: { row: 3, col: 9 },
  CT: { row: 3, col: 10 },
  RI: { row: 3, col: 11 },

  CA: { row: 4, col: 1 },
  NV: { row: 4, col: 2 },
  CO: { row: 4, col: 3 },
  NE: { row: 4, col: 4 },
  MO: { row: 4, col: 5 },
  KY: { row: 4, col: 6 },
  WV: { row: 4, col: 7 },
  VA: { row: 4, col: 8 },
  MD: { row: 4, col: 9 },
  DE: { row: 4, col: 10 },

  AZ: { row: 5, col: 2 },
  NM: { row: 5, col: 3 },
  KS: { row: 5, col: 4 },
  AR: { row: 5, col: 5 },
  TN: { row: 5, col: 6 },
  NC: { row: 5, col: 7 },
  SC: { row: 5, col: 8 },
  DC: { row: 5, col: 9 },

  HI: { row: 6, col: 0 },
  OK: { row: 6, col: 4 },
  LA: { row: 6, col: 5 },
  MS: { row: 6, col: 6 },
  AL: { row: 6, col: 7 },
  GA: { row: 6, col: 8 },

  TX: { row: 7, col: 4 },
  FL: { row: 7, col: 8 },
};

const GRID_ROWS = 8;
const GRID_COLS = 12;

const ALL_STATE_CODES = Object.keys(HEX_GRID) as USStateCode[];

const SQRT3 = Math.sqrt(3);

// Brand-token resolver — matches the pattern used elsewhere (ArcDiagram).
const resolveColorToken = (
  raw: string | undefined,
  fallback: string,
  accent: string,
  muted: string,
): string => {
  if (!raw) return fallback;
  if (raw === "accent") return accent;
  if (raw === "muted") return muted;
  return raw;
};

// Lightweight relative-luminance check (sRGB). Used to pick black vs
// white text fill for adequate contrast on the hex.
const hexToLuminance = (hex: string): number => {
  const m = hex.replace("#", "");
  if (m.length !== 3 && m.length !== 6) return 0.5;
  const full =
    m.length === 3
      ? m.split("").map((c) => c + c).join("")
      : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  // Perceptual luminance (Rec. 709 weights)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// ── Pointy-top hex polygon points ──────────────────────────────────────
// For hex size s (center → vertex), the 6 vertices of a pointy-top hex:
//   top, upper-right, lower-right, bottom, lower-left, upper-left
const hexPoints = (cx: number, cy: number, s: number): string => {
  const w = SQRT3 * s; // hex width (flat-side to flat-side)
  const h = 2 * s;     // hex height (point to point)
  const halfW = w / 2;
  const halfH = h / 2;
  const quarterH = h / 4; // s / 2
  return [
    `${cx},${cy - halfH}`,
    `${cx + halfW},${cy - quarterH}`,
    `${cx + halfW},${cy + quarterH}`,
    `${cx},${cy + halfH}`,
    `${cx - halfW},${cy + quarterH}`,
    `${cx - halfW},${cy - quarterH}`,
  ].join(" ");
};

// ── Resolve color scale → {min, max, low, mid?, high} ─────────────────
const resolveColorScale = (
  cfg: TilegramUSMapData["colorScale"],
  values: number[],
): TilegramColorScale => {
  // Object form — pass-through with token resolution handled at fill-time.
  if (cfg && typeof cfg === "object") return cfg;

  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 1;

  if (cfg === "diverging") {
    const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal), 1);
    return {
      min: -absMax,
      max: absMax,
      low: semantic.china,    // muted rust
      mid: palette.bone,
      high: semantic.us,      // muted blue
    };
  }

  // Sequential default: bone → gold warm ramp.
  return {
    min: minVal,
    max: maxVal === minVal ? minVal + 1 : maxVal,
    low: palette.bone,
    high: palette.gold,
  };
};

// Linear value-to-color across the scale stops.
const scaleFill = (
  value: number,
  scale: TilegramColorScale,
): string => {
  const { min, max, low, mid, high } = scale;
  if (max === min) return mid ?? low;
  // Use interpolateColors with a synthetic "frame" axis. Remotion's
  // interpolateColors is the same engine we use elsewhere for perceptual
  // sRGB interpolation, so palette tokens stay calibrated.
  const stops = mid ? [min, (min + max) / 2, max] : [min, max];
  const colors = mid ? [low, mid, high] : [low, high];
  return interpolateColors(value, stops, colors);
};

export const TilegramUSMap: React.FC<{ data: TilegramUSMapData }> = ({
  data,
}) => {
  checkChartDataCommon("TilegramUSMap", data);

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  const accent = palette.amber;

  // Content area sized for "content" title variant with generous safe
  // margins — matches the channel-wide default.
  const area = useMemo(() => contentArea("content", "generous"), []);

  // ── Hex sizing ───────────────────────────────────────────────────────
  // For a pointy-top hex of size s:
  //   grid width  = (cols + 0.5) * sqrt(3) * s  (the +0.5 accounts for
  //                                              odd-row horizontal stagger)
  //   grid height = (rows - 1) * 1.5 * s + 2 * s  =  (1.5 * rows + 0.5) * s
  //
  // We reserve a slim band beneath the grid for the color legend (~80px)
  // and shrink the available height accordingly. Then pick s so the
  // grid fits the smaller of width / height constraints.
  const legendBandHeight = 80;
  const gridAreaHeight = area.height - legendBandHeight;

  const hexSize = useMemo(() => {
    const sFromWidth = area.width / ((GRID_COLS + 0.5) * SQRT3);
    const sFromHeight = gridAreaHeight / (1.5 * GRID_ROWS + 0.5);
    return Math.floor(Math.min(sFromWidth, sFromHeight));
  }, [area.width, gridAreaHeight]);

  // Grid extent at this hex size — used to center the grid in the content
  // area horizontally and vertically (above the legend band).
  const gridPxWidth = (GRID_COLS + 0.5) * SQRT3 * hexSize;
  const gridPxHeight = (1.5 * GRID_ROWS + 0.5) * hexSize;

  const gridOriginX =
    area.left + (area.width - gridPxWidth) / 2 + (SQRT3 * hexSize) / 2;
  const gridOriginY =
    area.top + (gridAreaHeight - gridPxHeight) / 2 + hexSize;

  // ── State value lookup + color resolution ───────────────────────────
  const stateByCode = useMemo(() => {
    const m: Partial<Record<USStateCode, (typeof data.states)[number]>> = {};
    for (const s of data.states) m[s.state] = s;
    return m;
  }, [data.states]);

  const values = useMemo(
    () => data.states.map((s) => s.value),
    [data.states],
  );

  const scale = useMemo(
    () => resolveColorScale(data.colorScale ?? "sequential", values),
    [data.colorScale, values],
  );

  // ── Timing ──────────────────────────────────────────────────────────
  // Stagger primarily by row (the editorial point: the country reveals
  // top-to-bottom). A small extra delay by column adds organic texture
  // without competing with the row narrative.
  const rowStagger = sec(0.12);
  const colJitter = sec(0.02);
  const tileEntrance = timing.entrance.crisp; // sec(0.4)
  const baseStart = sec(0.4);
  const lastTileStart = baseStart + (GRID_ROWS - 1) * rowStagger;
  const legendStart = lastTileStart + tileEntrance + sec(0.1);

  const exitOp = exitFade(frame, durationInFrames, 15);

  // Resolve scale endpoint colors once (for legend swatch + token tokens
  // referenced via "accent"/"muted").
  const lowColor = resolveColorToken(scale.low, palette.bone, accent, theme.text.muted);
  const midColor = scale.mid
    ? resolveColorToken(scale.mid, palette.bone, accent, theme.text.muted)
    : undefined;
  const highColor = resolveColorToken(scale.high, palette.gold, accent, theme.text.muted);
  const resolvedScale: TilegramColorScale = {
    min: scale.min,
    max: scale.max,
    low: lowColor,
    mid: midColor,
    high: highColor,
  };

  // Empty / no-data tile fill — should read as distinct from the lowest
  // value bin. A muted neutral works well in both modes.
  const noDataFill = bgVariant === "dark" ? palette.midnight : palette.sand;

  // ── Smart title placement ─────────────────────────────────────────────────
  // Score each corner against the screen-space hex centers of every state
  // (all states are "highlighted" in a tilegram — they're the whole signal).
  // Default is "auto" — explicit `mapTitle.placement: <corner>` overrides.
  const resolvedCartoucheCorner = useMemo(() => {
    const placement = data.mapTitle?.placement ?? "auto";
    if (placement !== "auto") return undefined;
    const pts = ALL_STATE_CODES.map((code) => {
      const pos = HEX_GRID[code];
      const cx =
        gridOriginX +
        pos.col * SQRT3 * hexSize +
        (pos.row % 2 === 1 ? (SQRT3 * hexSize) / 2 : 0);
      const cy = gridOriginY + pos.row * 1.5 * hexSize;
      return { x: cx, y: cy };
    });
    return resolveCartoucheCorner(pts);
  }, [data.mapTitle, gridOriginX, gridOriginY, hexSize]);

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip
          mode={bgVariant}
          scale={data.source ? `Source: ${data.source}` : undefined}
        />

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <MapTitleFrame
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            config={data.mapTitle}
            syncPoints={direction.syncPoints}
            resolvedCartoucheCorner={resolvedCartoucheCorner}
          />
        </div>

        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {/* ── Hex tiles ───────────────────────────────────────────────
              Iterate over the full state list (not the data.states array)
              so unmentioned states still render as neutral tiles — the
              editorial promise of "every state equal weight" depends on
              the full outline always being visible. */}
          {ALL_STATE_CODES.map((code) => {
            const pos = HEX_GRID[code];
            const datum = stateByCode[code];

            // Pointy-top hex layout with odd-row horizontal stagger.
            const cx =
              gridOriginX +
              pos.col * SQRT3 * hexSize +
              (pos.row % 2 === 1 ? (SQRT3 * hexSize) / 2 : 0);
            const cy = gridOriginY + pos.row * 1.5 * hexSize;

            // Tile fill. Override color > scale color > no-data fill.
            const tileFill = datum
              ? resolveColorToken(
                  datum.color,
                  scaleFill(datum.value, resolvedScale),
                  accent,
                  theme.text.muted,
                )
              : noDataFill;

            // Auto-contrast text color against the tile fill. Below ~0.55
            // luminance we use the bone/paper text token; above we use ink.
            const lum = hexToLuminance(tileFill);
            const textFill = lum < 0.55 ? palette.bone : palette.ink;

            // Entrance: row stagger + small column jitter.
            const start =
              baseStart + pos.row * rowStagger + pos.col * colJitter;
            const op =
              fadeIn(frame, start, tileEntrance) * exitOp;
            const scaleAnim = interpolate(
              frame,
              [start, start + tileEntrance],
              [0.7, 1],
              CLAMP_CUBIC,
            );

            const points = hexPoints(cx, cy, hexSize);
            const labelFontSize = Math.max(10, Math.round(hexSize * 0.42));
            const subLabelFontSize = Math.max(
              8,
              Math.round(hexSize * 0.28),
            );

            return (
              <g
                key={`hex-${code}`}
                style={{
                  opacity: op,
                  transformOrigin: `${cx}px ${cy}px`,
                  transform: `scale(${scaleAnim})`,
                }}
              >
                <polygon
                  points={points}
                  fill={tileFill}
                  stroke={theme.bg.base}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                <text
                  x={cx}
                  y={datum?.label ? cy - 2 : cy + labelFontSize * 0.35}
                  textAnchor="middle"
                  fill={textFill}
                  fontSize={labelFontSize}
                  fontFamily={fonts.mono}
                  fontWeight={600}
                  letterSpacing={letterSpacing.label}
                  style={{ textTransform: "uppercase" }}
                >
                  {code}
                </text>
                {datum?.label && (
                  <text
                    x={cx}
                    y={cy + subLabelFontSize + 4}
                    textAnchor="middle"
                    fill={textFill}
                    fontSize={subLabelFontSize}
                    fontFamily={fonts.data}
                    fontWeight={400}
                    opacity={0.85}
                  >
                    {datum.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Color legend ──────────────────────────────────────────
              Horizontal gradient swatch beneath the grid. Anchored to
              area.bottom region; uses an SVG linear gradient with 2 or 3
              stops depending on whether the scale is diverging. */}
          {(() => {
            const legendOp = fadeIn(frame, legendStart, sec(0.4)) * exitOp;
            const swatchW = Math.min(area.width * 0.42, 480);
            const swatchH = 12;
            const swatchX = area.left + (area.width - swatchW) / 2;
            const swatchY =
              area.top + gridAreaHeight + (legendBandHeight - swatchH) / 2 + 6;
            const gradientId = "tilegram-legend-gradient";

            const formatTick = (n: number): string => {
              if (Math.abs(n) >= 1000)
                return `${(n / 1000).toFixed(1)}k`;
              if (Number.isInteger(n)) return `${n}`;
              return n.toFixed(1);
            };

            return (
              <g style={{ opacity: legendOp }}>
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor={lowColor} />
                    {midColor && (
                      <stop offset="50%" stopColor={midColor} />
                    )}
                    <stop offset="100%" stopColor={highColor} />
                  </linearGradient>
                </defs>

                {data.valueLabel && (
                  <text
                    x={area.left + area.width / 2}
                    y={swatchY - 14}
                    textAnchor="middle"
                    fill={theme.text.muted}
                    fontSize={fontSizes.meta}
                    fontFamily={fonts.mono}
                    fontWeight={400}
                    letterSpacing={letterSpacing.meta}
                    style={{ textTransform: "uppercase" }}
                  >
                    {data.valueLabel}
                  </text>
                )}

                <rect
                  x={swatchX}
                  y={swatchY}
                  width={swatchW}
                  height={swatchH}
                  fill={`url(#${gradientId})`}
                  rx={2}
                />

                {/* Min / mid / max ticks */}
                <text
                  x={swatchX}
                  y={swatchY + swatchH + 18}
                  textAnchor="start"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.data}
                >
                  {formatTick(resolvedScale.min)}
                </text>
                {midColor && (
                  <text
                    x={swatchX + swatchW / 2}
                    y={swatchY + swatchH + 18}
                    textAnchor="middle"
                    fill={theme.text.muted}
                    fontSize={fontSizes.meta}
                    fontFamily={fonts.data}
                  >
                    {formatTick((resolvedScale.min + resolvedScale.max) / 2)}
                  </text>
                )}
                <text
                  x={swatchX + swatchW}
                  y={swatchY + swatchH + 18}
                  textAnchor="end"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.data}
                >
                  {formatTick(resolvedScale.max)}
                </text>
              </g>
            );
          })()}
        </svg>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={1.4}
        />
      </AbsoluteFill>
    </Background>
  );
};
