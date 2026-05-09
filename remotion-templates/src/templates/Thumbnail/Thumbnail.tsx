/**
 * Thumbnail — static 1280×720 composition.
 *
 * Three layout modes driven by ThumbnailData.layout:
 *   juxtaposition    — left image panel / right dual stats (Concept A)
 *   data-provocation — full-frame hero stat over faded image (Concept B)
 *   symbolic         — centered illustration + title (Concept C)
 *
 * This is a still composition (durationInFrames: 1). All layout is CSS-only;
 * no frame-based animation is used. useCompositionAnimation is called with
 * noDrift: true to satisfy the L44 lint rule while keeping the frame static.
 *
 * Render a PNG:
 *   npx remotion still Thumbnail \
 *     --props='{"data":{...}}' \
 *     --output episodes/<slug>/thumbnails/concept-a.png
 */

import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { palette, fonts, fontSizes, layout, cjk } from "../../design/theme";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { BrandImage } from "../../components/BrandImage";
import type { ThumbnailData } from "./types";

// ── Thumbnail-specific constants ──────────────────────────────────────────────
// Safe area: 1280×720 inner 960×540 → 160px H, 90px V per BRAND.md
const SAFE_X = 80;  // narrowed from 160 so stats have room
const SAFE_Y = 48;
const HEADER_FS = 11;
// Thumbnail-specific type scale (no theme.ts equivalents at these sizes — thumbnail
// uses non-standard bold stat sizes optimised for 1280×720 at-a-glance legibility)
const THUMB_STAT_FS = 88;       // primary hero stat — between display(96) and h1(64)
const THUMB_SUBTEXT_FS = 30;    // sub-caption — between h3(36) and body(22)
const THUMB_MARK_FS = 20;       // ∴ brand mark glyph — between label(18) and body(22)
// Thumbnail-specific spacing (canvas is 1280×720, not 1920×1080)
const THUMB_STAT_PAD_L = 28;   // right-panel left inset — fits narrow stat column
const THUMB_SEP_GAP = 20;       // gap flanking hairline separator — between sm(16)/md(24)

// ── Shared: brand header strip ────────────────────────────────────────────────

const ThumbnailHeader: React.FC<{ episodeLabel?: string }> = ({ episodeLabel }) => (
  <div
    style={{
      position: "absolute",
      top: SAFE_Y,
      left: SAFE_X,
      right: SAFE_X,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 20,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: HEADER_FS,
        fontWeight: 600,
        color: palette.gold,
        letterSpacing: 2.5,
        textTransform: "uppercase",
      }}
    >
      ∴ PARALLAX
    </div>
    {episodeLabel && (
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: HEADER_FS,
          fontWeight: 400,
          color: palette.taupe,
          letterSpacing: 2.5,
          textTransform: "uppercase",
        }}
      >
        {episodeLabel}
      </div>
    )}
  </div>
);

// ── Layout A: Juxtaposition ───────────────────────────────────────────────────

const LayoutJuxtaposition: React.FC<{ data: ThumbnailData }> = ({ data }) => {
  const SPLIT = 0.46;
  const contrastColor = data.statContrastColor ?? palette.rust;

  return (
    <>
      {/* Left panel: brand-treated image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${SPLIT * 100}%`,
          height: "100%",
        }}
      >
        {data.imageSrc ? (
          <BrandImage
            src={staticFile(data.imageSrc)}
            ramp={data.imageRamp ?? "standard"}
            composite="inset"
          />
        ) : (
          // Placeholder grid when image not yet sourced
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(160deg, ${palette.walnut}50 0%, ${palette.umber}30 60%, ${palette.ink} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                color: palette.taupe,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              image pending
            </div>
          </div>
        )}

        {/* Gradient fade at top for title legibility */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 160,
            background: `linear-gradient(180deg, ${palette.ink} 0%, ${palette.ink}99 30%, transparent 100%)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Amber divider */}
      <div
        style={{
          position: "absolute",
          left: `${SPLIT * 100}%`,
          top: "12%",
          width: 2,
          height: "76%",
          background: `linear-gradient(180deg, transparent 0%, ${palette.gold} 12%, ${palette.gold} 88%, transparent 100%)`,
        }}
      />

      {/* Title — spans full width, top */}
      {data.titleText && (
        <div
          style={{
            position: "absolute",
            top: SAFE_Y + 28,
            left: 0,
            width: "100%",
            textAlign: "center",
            fontFamily: fonts.heading,
            fontSize: fontSizes.h2,
            fontWeight: 700,
            color: palette.bone,
            letterSpacing: 5,
            textTransform: "uppercase",
            zIndex: 10,
            textShadow: `0 2px 12px ${palette.ink}, 0 0 32px ${palette.ink}`,
          }}
        >
          {data.titleText}
        </div>
      )}

      {/* Right panel: stats */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: `${(SPLIT + 0.04) * 100}%`,
          width: `${(0.96 - SPLIT - 0.04) * 100}%`,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingLeft: THUMB_STAT_PAD_L,
          gap: 0,
        }}
      >
        {data.statPrimary && (
          <div
            style={{
              fontFamily: fonts.data,
              fontSize: THUMB_STAT_FS,
              fontWeight: 700,
              color: palette.gold,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {data.statPrimary}
          </div>
        )}
        {data.statPrimaryLabel && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.label,
              fontWeight: 400,
              color: palette.bone,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 6,
            }}
          >
            {data.statPrimaryLabel}
          </div>
        )}

        {/* Hairline separator */}
        {data.statPrimary && data.statContrast && (
          <div
            style={{
              width: "80%",
              height: 1,
              background: `linear-gradient(90deg, ${palette.bone}50 0%, transparent 100%)`,
              marginTop: THUMB_SEP_GAP,
              marginBottom: THUMB_SEP_GAP,
            }}
          />
        )}

        {data.statContrast && (
          <div
            style={{
              fontFamily: fonts.data,
              fontSize: cjk.fontSizes.h1,
              fontWeight: 700,
              color: contrastColor,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {data.statContrast}
          </div>
        )}
        {data.statContrastLabel && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.label,
              fontWeight: 400,
              color: palette.bone,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 6,
            }}
          >
            {data.statContrastLabel}
          </div>
        )}
      </div>
    </>
  );
};

// ── Layout B: Data Provocation ────────────────────────────────────────────────

const LayoutDataProvocation: React.FC<{ data: ThumbnailData }> = ({ data }) => (
  <>
    {/* Faded background image */}
    {data.imageSrc && (
      <BrandImage
        src={staticFile(data.imageSrc)}
        ramp={data.imageRamp ?? "standard"}
        composite="background"
        opacity={0.18}
      />
    )}

    {/* Bottom-half gradient for depth */}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "50%",
        background: `linear-gradient(180deg, transparent 0%, ${palette.ink}90 100%)`,
        pointerEvents: "none",
      }}
    />

    {/* Hero stat + sub text — vertically centered, offset up slightly */}
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: layout.spacing.lg,
      }}
    >
      {data.heroText && (
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: cjk.fontSizes.display,
            fontWeight: 700,
            color: palette.gold,
            lineHeight: 1,
            letterSpacing: -3,
            textAlign: "center",
            maxWidth: 1000,
            textShadow: `0 4px 24px ${palette.ink}`,
          }}
        >
          {data.heroText}
        </div>
      )}
      {data.subText && (
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: THUMB_SUBTEXT_FS,
            fontWeight: 400,
            color: palette.bone,
            letterSpacing: 3,
            textAlign: "center",
            textTransform: "uppercase",
            marginTop: THUMB_SEP_GAP,
            textShadow: `0 2px 12px ${palette.ink}`,
          }}
        >
          {data.subText}
        </div>
      )}
    </AbsoluteFill>
  </>
);

// ── Layout C: Symbolic ────────────────────────────────────────────────────────

const SymbolicPlaceholder: React.FC = () => (
  // Grid of cells evoking a chip cross-section / Go board
  <div
    style={{
      width: 480,
      height: 360,
      display: "grid",
      gridTemplateColumns: "repeat(10, 1fr)",
      gridTemplateRows: "repeat(8, 1fr)",
      gap: 3,
      opacity: 0.6,
    }}
  >
    {Array.from({ length: 80 }).map((_, i) => {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const isNode = (row % 3 === 1 && col % 3 === 1) || (row === 4 && col === 4);
      const isLine = row % 3 === 1 || col % 3 === 1;
      return (
        <div
          key={i}
          style={{
            background: isNode
              ? palette.gold
              : isLine
              ? `${palette.bone}60`
              : "transparent",
            border: `1px solid ${palette.umber}40`,
            borderRadius: isNode ? "50%" : 1,
          }}
        />
      );
    })}
  </div>
);

const LayoutSymbolic: React.FC<{ data: ThumbnailData }> = ({ data }) => (
  <>
    {/* Standalone ∴ accent — upper right */}
    <div
      style={{
        position: "absolute",
        top: SAFE_Y,
        right: SAFE_X,
        fontFamily: fonts.body,
        fontSize: THUMB_MARK_FS,
        color: palette.rust,
        letterSpacing: 1,
        zIndex: 10,
      }}
    >
      ∴
    </div>

    {/* Illustration + title */}
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: layout.spacing.lg,
        paddingTop: layout.spacing.sm,
      }}
    >
      {data.illustrationSrc ? (
        <Img
          src={staticFile(data.illustrationSrc)}
          alt={data.symbolTitle ?? "Illustration"}
          style={{ width: 480, height: 360, objectFit: "contain" }}
        />
      ) : (
        <SymbolicPlaceholder />
      )}

      {data.symbolTitle && (
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: fontSizes.h2,
            fontWeight: 700,
            color: palette.bone,
            letterSpacing: 6,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {data.symbolTitle}
        </div>
      )}
    </AbsoluteFill>
  </>
);

// ── Main component ────────────────────────────────────────────────────────────

export const Thumbnail: React.FC<{ data: ThumbnailData }> = ({ data }) => {
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  return (
    <AbsoluteFill
      style={{
        ...compStyle,
        background: palette.ink,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {data.layout === "juxtaposition" && <LayoutJuxtaposition data={data} />}
      {data.layout === "data-provocation" && (
        <LayoutDataProvocation data={data} />
      )}
      {data.layout === "symbolic" && <LayoutSymbolic data={data} />}

      <ThumbnailHeader episodeLabel={data.episodeLabel} />
    </AbsoluteFill>
  );
};
