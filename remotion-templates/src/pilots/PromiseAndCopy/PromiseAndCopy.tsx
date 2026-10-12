import React, { useMemo } from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Link, Mind } from "../shared/scene";
import { NarrationTrack, StudyFrame } from "../shared/StudyFrame";
import { fonts, layout, palette, timing } from "../../design/theme";
import { anticipatoryReveal } from "../../utils/animation";
import { Forest } from "./Forest";
import { PromiseAndCopyProps } from "./schema";
import { BEAT_KEYS, BeatKey, buildTimeline } from "./timeline";

const HEADLINES: Record<BeatKey, string> = {
  promise: "One promise. One promise-maker.",
  copy: "The memory now belongs to two minds.",
  question: "Does remembering make you responsible?",
  possibility: "Same past. Different rules for the future.",
  human: "You have changed, too.",
  closing: "What should survive when a mind changes?",
};
const between = (from: number, to: number, t: number) => from + (to - from) * t;

export const PromiseAndCopy: React.FC<PromiseAndCopyProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = useMemo(() => buildTimeline(props, fps), [props.pauses, props.endingHoldSec, fps]);
  const cues = useMemo(() => Object.fromEntries(timeline.beats.map((b) => [b.key, b.start])) as Record<BeatKey, number>, [timeline]);
  const reveal = (key: BeatKey) => anticipatoryReveal(frame, cues[key]);
  const split = anticipatoryReveal(frame, cues.copy, timing.entrance.slow);
  const question = reveal("question");
  const possibility = reveal("possibility");
  const human = reveal("human");
  const closing = reveal("closing");
  const { original, successorA, successorB, forest } = props.positions;
  const a = { x: between(original.x, successorA.x, split), y: between(original.y, successorA.y, split) };
  const b = { x: between(original.x, successorB.x, split), y: between(original.y, successorB.y, split) };
  const forestLeft = forest.x - forest.size / 2;
  // A continuous scene: only the relationships and the reading emphasis change.
  const agentEmphasis = 1 - human * 0.46 + closing * 0.2;
  const captions = timeline.beats.map((beat, i) => {
    const next = timeline.beats[i + 1];
    return { ...beat, text: HEADLINES[beat.key], opacity: reveal(beat.key) * (next ? 1 - reveal(next.key) : 1) };
  });

  return (
    <>
      <NarrationTrack beats={timeline.beats} volume={props.narrationVolume} />
      <StudyFrame title={props.title} number="001" topic="IDENTITY · OBLIGATION" captions={captions} progress={BEAT_KEYS.map(reveal)}>

        {/* The same illustration remains on screen through the whole argument. */}
        <div style={{ position: "absolute", left: forestLeft, top: forest.y - forest.size / 2, width: forest.size, height: forest.size, borderRadius: "50%", overflow: "hidden", outline: `1px solid ${palette.taupe}`, outlineOffset: 12 }}>
          {props.imageSrc ? <Img src={staticFile(props.imageSrc)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Forest />}
        </div>

        <svg width={layout.width} height={layout.height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Link from={{ x: original.x + 89, y: original.y }} to={{ x: forestLeft - 15, y: forest.y }} progress={reveal("promise")} opacity={1 - split} color={palette.gold} />
          <g opacity={agentEmphasis}>
            <Link from={{ x: original.x + 89, y: original.y }} to={{ x: a.x - 89, y: a.y }} progress={split} opacity={split * 0.7} color={palette.umber} />
            <Link from={{ x: original.x + 89, y: original.y }} to={{ x: b.x - 89, y: b.y }} progress={split} opacity={split * 0.7} color={palette.umber} />
            <Link from={{ x: a.x + 89, y: a.y }} to={{ x: forestLeft - 15, y: forest.y - 80 }} progress={split} opacity={split * (1 - question * 0.7 + possibility * 0.7)} color={palette.gold} />
            <Link from={{ x: b.x + 89, y: b.y }} to={{ x: forestLeft - 15, y: forest.y + 80 }} progress={split} opacity={split * (1 - question * 0.7 + possibility * 0.7)} color={palette.gold} />
            <Mind position={original} label={props.labels.original} note={split > 0.5 ? "before the copy" : "the promise-maker"} opacity={1 - split * 0.48} accent={palette.walnut} />
            <Mind position={a} label={props.labels.successorA} note="remembers the promise" opacity={split} accent={palette.walnut} />
            <Mind position={b} label={props.labels.successorB} note="remembers the promise" opacity={split} accent={palette.walnut} />
          </g>
          <text x={(original.x + forestLeft) / 2 + 40} y={original.y - 65} textAnchor="middle" fontFamily={fonts.serifBody} fontSize="36" fill={palette.walnut} opacity={reveal("promise") * (1 - split)}>“{props.labels.promise}”</text>
          <text x={forest.x} y={forest.y - forest.size / 2 - 44} textAnchor="middle" fontFamily={fonts.serifBody} fontSize="27" fill={palette.walnut} opacity={split}>“{props.labels.promise}”</text>
          <text x={forest.x} y={forest.y + forest.size / 2 + 66} textAnchor="middle" fontFamily={fonts.body} fontSize="30" fill={palette.ink}>{props.labels.forest}</text>
          <text x={forest.x} y={forest.y + forest.size / 2 + 98} textAnchor="middle" fontFamily={fonts.metadata} fontSize="18" fill={palette.umber}>one shared world</text>
          <g opacity={question * (1 - possibility)} fill={palette.walnut} fontFamily={fonts.serifBody} fontSize="45">
            <text x={(successorA.x + forestLeft) / 2 + 8} y={(successorA.y + forest.y - 80) / 2 - 16}>?</text>
            <text x={(successorB.x + forestLeft) / 2 + 8} y={(successorB.y + forest.y + 80) / 2 - 16}>?</text>
          </g>
        </svg>

        <div style={{ position: "absolute", left: 100, top: 914, color: palette.walnut, fontFamily: fonts.serifBody, fontSize: 29, opacity: possibility * (1 - human) }}>
          Inherit the obligation <span style={{ color: palette.taupe, margin: "0 24px" }}>/</span> Assign it by ability to act
        </div>
        <div style={{ position: "absolute", left: 100, top: 914, fontFamily: fonts.serifBody, fontSize: 35, color: palette.walnut, opacity: human * (1 - closing) }}>
          A different mind. An unfinished promise.
        </div>
        <div style={{ position: "absolute", left: 100, top: 910, fontFamily: fonts.serifBody, fontSize: 39, color: palette.ink, opacity: closing }}>
          And who gets to decide?
        </div>

      </StudyFrame>
    </>
  );
};
