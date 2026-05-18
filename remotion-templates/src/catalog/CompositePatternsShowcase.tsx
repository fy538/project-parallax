/**
 * CompositePatternsShowcase — side-by-side view of the four high-level
 * editorial patterns, demonstrated on real Parallax content.
 *
 *   1. DefinitionReveal (first introduction: 卡脖子)
 *   2. DefinitionReveal (cross-episode callback: 卡脖子 returning)
 *   3. StatCaption (Axelrod 82% with caption + source)
 *   4. QuoteAttribution (Morris Chang quote — display register)
 *   5. QuoteAttribution (Nash quote — archival mono register)
 *
 * Each pattern fires with overlapping stagger so the eye can follow them
 * in motion, then everything holds in its settled state from ~12s for
 * static comparison.
 *
 * The companion atomic-techniques showcase lives at
 * `TextAnimationShowcase.tsx` — together they form the visual reference
 * for the doctrine doc `project/TEXT_ANIMATION_REGISTER.md`.
 */

import React from "react";
import {
  AbsoluteFill,
  Composition,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { BrandLockup } from "../components/BrandLockup";
import { EditorialSurface } from "../components/EditorialSurface";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import {
  DefinitionReveal,
  StatCaption,
  QuoteAttribution,
} from "../components/CompositePatterns";
import { layout, palette, fonts, fontSizes, sec, semantic } from "../design/theme";
import { CLAMP_SINE } from "../utils/animation";
import { catalogId } from "./helpers";

const INK = palette.ink;
const BODY_GREY = "#5C5046";

const fadeIn = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], CLAMP_SINE);

// ─── Row scaffold (shared with TextAnimationShowcase pattern) ──────────────

// Row layout: 5 rows must fit between ROWS_TOP (~130) and the footer
// (bottom ~70px including line-height). Available vertical ≈ 880px.
// 5 rows + 4 gaps × 16 ≤ 880  →  h ≤ 163. Pick h=160 with gap=16.
const ROW_HEIGHT = 160;
const ROW_GAP = 16;
const ROWS_TOP = 130;
const LABEL_COL_LEFT = 80;
const LABEL_COL_WIDTH = 280;
const DEMO_COL_LEFT = 380;
const HAIRLINE = "rgba(28, 24, 20, 0.18)";

const Row: React.FC<{
  index: number;
  label: string;
  caption: string;
  children: React.ReactNode;
  startFrame: number;
  frame: number;
}> = ({ index, label, caption, children, startFrame, frame }) => {
  const y = ROWS_TOP + (index - 1) * (ROW_HEIGHT + ROW_GAP);
  const labelOpacity = fadeIn(frame, Math.max(0, startFrame - sec(0.2)), sec(0.3)) * 0.85;

  return (
    <>
      {index > 1 && (
        <div
          style={{
            position: "absolute",
            top: y - ROW_GAP / 2,
            left: LABEL_COL_LEFT,
            right: 80,
            height: 1,
            background: HAIRLINE,
            opacity: 0.5,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: y + 22,
          left: LABEL_COL_LEFT,
          width: LABEL_COL_WIDTH,
          opacity: labelOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.caption,
            fontWeight: 700,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: INK,
            marginBottom: 6,
          }}
        >
          {String(index).padStart(2, "0")} · {label}
        </div>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 12,
            letterSpacing: 0.5,
            color: BODY_GREY,
            lineHeight: 1.4,
          }}
        >
          {caption}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: y,
          left: DEMO_COL_LEFT,
          right: 80,
          height: ROW_HEIGHT,
          display: "flex",
          alignItems: "center",
        }}
      >
        {children}
      </div>
    </>
  );
};


// ─── Stagger of row reveals ────────────────────────────────────────────────

const ROW_STARTS = [
  sec(0.6),  // 1 — DefinitionReveal (first intro)
  sec(2.5),  // 2 — DefinitionReveal (callback)
  sec(4.4),  // 3 — StatCaption
  sec(6.6),  // 4 — QuoteAttribution (display)
  sec(9.2),  // 5 — QuoteAttribution (archival)
];


// ════════════════════════════════════════════════════════════════════════════
// COMPOSITION
// ════════════════════════════════════════════════════════════════════════════

const CompositePatternsShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  useCompositionAnimation({ noDrift: true });

  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4}>
        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 50,
            left: LABEL_COL_LEFT,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            opacity: fadeIn(frame, 0, sec(0.5)),
          }}
        >
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 32,
              fontWeight: 700,
              color: INK,
              letterSpacing: -1,
            }}
          >
            Composite editorial patterns
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: BODY_GREY,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            five patterns · side-by-side
          </div>
        </div>

        {/* Row 1 — DefinitionReveal (first introduction) */}
        <Row
          index={1}
          label="Definition reveal · first introduction"
          caption="Term + pinyin + translation choreographed stagger. The 卡脖子 canonical pattern as it first appears in silicon-trap."
          startFrame={ROW_STARTS[0]}
          frame={frame}
        >
          <DefinitionReveal
            term="卡脖子"
            pinyin="kǎ bózi"
            translation="Stranglehold technology"
            citation="silicon-trap · Beat 3"
            startFrame={ROW_STARTS[0]}
            accentColor={semantic.china}
            isCallback={false}
            sizes={{ term: 48, pinyin: 18, translation: 20, citation: 11 }}
          />
        </Row>

        {/* Row 2 — DefinitionReveal (callback) */}
        <Row
          index={2}
          label="Definition reveal · concept callback"
          caption="Same pattern, but term pulses on arrival — signaling cross-episode recurrence per data/concepts.json appearances[]."
          startFrame={ROW_STARTS[1]}
          frame={frame}
        >
          <DefinitionReveal
            term="卡脖子"
            pinyin="kǎ bózi"
            translation="Stranglehold technology"
            citation="callback · originally introduced in silicon-trap"
            startFrame={ROW_STARTS[1]}
            accentColor={semantic.china}
            isCallback={true}
            sizes={{ term: 48, pinyin: 18, translation: 20, citation: 11 }}
          />
        </Row>

        {/* Row 3 — StatCaption */}
        <Row
          index={3}
          label="Stat + caption"
          caption="Number ticker + caption with eased stagger. Hero stat arrives first; caption explains it 0.3s after settle."
          startFrame={ROW_STARTS[2]}
          frame={frame}
        >
          <StatCaption
            value={82}
            unit="%"
            caption="Cooperation in Round 1 of Axelrod's iterated tournament — the one-shot model predicts 0%."
            source="Axelrod (1984)"
            startFrame={ROW_STARTS[2]}
            accentColor={palette.gold}
            sizes={{ value: 80, unit: 42, caption: 17, source: 11 }}
          />
        </Row>

        {/* Row 4 — QuoteAttribution (display register) */}
        <Row
          index={4}
          label="Quote + attribution · display register"
          caption="Typewriter quote in Plex Sans display + serif-italic attribution. Channel-voice quote of a named figure."
          startFrame={ROW_STARTS[3]}
          frame={frame}
        >
          <QuoteAttribution
            text="Globalization is almost dead. Free trade is almost dead."
            attribution="— Morris Chang"
            year="2022"
            startFrame={ROW_STARTS[3]}
            cps={28}
            sizes={{ quote: 26, attribution: 17 }}
          />
        </Row>

        {/* Row 5 — QuoteAttribution (archival mono register) */}
        <Row
          index={5}
          label="Quote + attribution · archival register"
          caption="Same pattern, but Plex Mono — historical document reproduction. RAND memo / declassified cable register."
          startFrame={ROW_STARTS[4]}
          frame={frame}
        >
          <QuoteAttribution
            text="They would have been more rational if they couldn't see each other."
            attribution="— Nash, on the Flood-Dresher experiment"
            year="RAND RM-789-1, 1950"
            startFrame={ROW_STARTS[4]}
            cps={22}
            archival
            sizes={{ quote: 21, attribution: 16 }}
          />
        </Row>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: LABEL_COL_LEFT,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            opacity: fadeIn(frame, sec(0.5), sec(0.5)) * 0.6,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: BODY_GREY,
              letterSpacing: 2,
            }}
          >
            <BrandLockup>parallax · editorial register · composite-patterns showcase</BrandLockup>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: BODY_GREY,
              letterSpacing: 2,
            }}
          >
            scrub to compare · hold from 13s
          </div>
        </div>
      </EditorialSurface>
    </AbsoluteFill>
  );
};


// ─── Composition registration ──────────────────────────────────────────────

export const CatalogCompositePatternsShowcase = () => (
  <Composition
    id={catalogId("CompositePatterns", "showcase")}
    component={CompositePatternsShowcase}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(17)}
    defaultProps={{}}
  />
);
