/** A silent, twelve-second style test for an imagined institutional artifact. */
import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { fonts, palette } from "../design/theme";

export const CONTINUITY_RECORD_DURATION = 360;

const reveal = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

export const ContinuityRecord: React.FC = () => {
  const frame = useCurrentFrame();
  // The landscape becomes the first impression; a copy is then revealed in
  // the second. This spatial continuity carries the idea, rather than a dissolve.
  const recordEntry = interpolate(frame, [78, 132], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const copy = reveal(frame, 150, 196);
  const memoryImprint = 1 - reveal(frame, 204, 237);
  const original = reveal(frame, 220, 238);
  const successor = reveal(frame, 238, 256);
  const forestLeft = 1090 - recordEntry * 180;
  const forestTop = 260 + recordEntry * 115;
  const forestSize = 510 - recordEntry * 210;
  const artifactLeft = 770 + (1 - recordEntry) * 1160;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: palette.paper, color: palette.ink }}>
      <div style={{ position: "absolute", top: 52, left: 104, fontFamily: fonts.metadata, fontSize: 20, letterSpacing: 2.4, color: palette.walnut }}>
        PARALLAX / THOUGHT EXPERIMENT
      </div>
      <div style={{ position: "absolute", top: 52, right: 104, fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 2, color: palette.umber }}>
        IMAGINED RECORD · 001
      </div>
      <div style={{ position: "absolute", left: 104, right: 104, top: 100, height: 1, background: palette.sand }} />

      <div style={{ position: "absolute", left: artifactLeft, top: 28, width: 1080, height: 1080 }}>
        <Img src={staticFile("style-lab/continuity-record-generated-v1.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      <div style={{ position: "absolute", left: forestLeft, top: forestTop, width: forestSize, height: forestSize, borderRadius: "50%", overflow: "hidden", opacity: memoryImprint, outline: `1px solid ${palette.taupe}`, outlineOffset: recordEntry ? 0 : 11 }}>
        <Img src={staticFile("style-lab/forest-riso-v1.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 1425, top: 375, width: 300, height: 300, borderRadius: "50%", overflow: "hidden", opacity: memoryImprint, clipPath: `inset(0 ${100 - copy * 100}% 0 0)` }}>
        <Img src={staticFile("style-lab/forest-riso-v1.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 1090, top: 819, width: 510, textAlign: "center", fontFamily: fonts.body, fontSize: 26, color: palette.walnut, opacity: 1 - reveal(frame, 78, 96) }}>
        one forest · one promise
      </div>

      <div style={{ position: "absolute", left: 855, top: 489, width: 350, textAlign: "center", fontFamily: fonts.body, fontSize: 29, fontWeight: 600, color: palette.walnut, opacity: original, transform: `translateY(${(1 - original) * 10}px)` }}>
        Promise-maker
      </div>
      <div style={{ position: "absolute", left: 1400, top: 489, width: 350, textAlign: "center", fontFamily: fonts.body, fontSize: 29, fontWeight: 600, color: palette.walnut, opacity: successor, transform: `translateY(${(1 - successor) * 10}px)` }}>
        Successor A
      </div>
      <div style={{ position: "absolute", left: 1200, top: 754, width: 325, textAlign: "center", fontFamily: fonts.metadata, fontSize: 18, letterSpacing: 1.5, color: palette.umber, opacity: reveal(frame, 198, 218) }}>
        MEMORY TRANSFERRED
      </div>

      {frame < 264 && <div style={{ position: "absolute", left: 104, top: 265, width: 670 }}>
        <div style={{ fontFamily: fonts.serifBody, fontSize: 79, lineHeight: 1.03, letterSpacing: -2, fontWeight: 500 }}>
          Who inherits<br />a promise?
        </div>
        <div style={{ marginTop: 43, width: 560, fontFamily: fonts.body, fontSize: 30, lineHeight: 1.35, color: palette.walnut, opacity: reveal(frame, 140, 155) }}>
          The successor remembers the forest.
        </div>
      </div>}
      {frame >= 264 && <div style={{ position: "absolute", left: 104, top: 265, width: 660 }}>
        <div style={{ fontFamily: fonts.serifBody, fontSize: 72, lineHeight: 1.07, letterSpacing: -2, fontWeight: 500 }}>
          The memory<br />survives.
        </div>
        {frame >= 283 && <div style={{ marginTop: 29, fontFamily: fonts.serifBody, fontSize: 63, lineHeight: 1.1, fontStyle: "italic", color: palette.walnut }}>
          Does the duty?
        </div>}
      </div>}

      <div style={{ position: "absolute", left: 104, bottom: 55, right: 104, height: 1, background: palette.sand }} />
      <div style={{ position: "absolute", left: 104, bottom: 25, fontFamily: fonts.metadata, fontSize: 15, letterSpacing: 1, color: palette.umber }}>
        A FICTIONAL CASE ABOUT IDENTITY AND OBLIGATION
      </div>
      <div style={{ position: "absolute", right: 104, bottom: 25, fontFamily: fonts.metadata, fontSize: 15, letterSpacing: 1, color: palette.umber }}>
        NO CLAIM ABOUT PRESENT AI EXPERIENCE
      </div>
    </div>
  );
};
