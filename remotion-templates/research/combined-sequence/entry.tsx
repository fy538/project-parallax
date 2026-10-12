/** Isolated editorial motion study. Production episode templates are untouched. */
import React from 'react';
import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {fonts, palette, timing} from '../../src/design/theme';
import {CLAMP_DECELERATE, CLAMP_QUAD_INOUT} from '../../src/utils/animation';

const FPS = 30;
const DURATION = 26 * FPS;
const CUT = 6 * FPS;
const ANNOTATE = 11 * FPS;
const DIAGRAM = 18 * FPS;
const reveal = (frame: number, start: number, length: number = timing.entrance.slow) =>
  interpolate(frame, [start, start + length], [0, 1], CLAMP_DECELERATE);
const leave = (frame: number, start: number, length: number = timing.exit.medium) =>
  1 - reveal(frame, start, length);
const fullSvg: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%'};

const Heading: React.FC<{frame: number; start: number; end?: number; title: string; kicker: string}> =
  ({frame, start, end, title, kicker}) => {
    const arrival = reveal(frame, start, timing.entrance.medium);
    const opacity = arrival * (end === undefined ? 1 : leave(frame, end - timing.exit.medium));
    return <div style={{position: 'absolute', left: 260, top: 75, color: palette.ink, opacity,
      transform: `translateY(${(1-arrival)*12}px)`}}>
      <div style={{fontFamily: fonts.metadata, fontSize: 28, color: palette.walnut, marginBottom: 22}}>{kicker}</div>
      <div style={{fontFamily: fonts.heading, fontSize: 72, fontWeight: 500, lineHeight: 1.1}}>{title}</div>
    </div>;
  };

const Cup: React.FC<{frame: number}> = ({frame}) => {
  const arrival = reveal(frame, 0, timing.entrance.slow * 2);
  const space = interpolate(frame, [ANNOTATE, ANNOTATE + timing.entrance.slow * 2], [0, 1], CLAMP_QUAD_INOUT);
  const relocate = interpolate(frame, [DIAGRAM, DIAGRAM + timing.entrance.slow * 2], [0, 1], CLAMP_QUAD_INOUT);
  const scale = 0.94 - space * 0.12 - relocate * 0.32;
  const x = -415 * relocate;
  const y = (1-arrival)*18 - 60 * relocate;
  const ordinary = frame < CUT;
  // Normalize each painting's margins; this is an editorial cut, not a morph.
  const imageWidth = ordinary ? 1580 : 1260;
  return <AbsoluteFill style={{opacity: arrival}}>
    <div style={{position: 'absolute', inset: 0, transformOrigin: '925px 842px',
      transform: `translate(${x}px, ${y}px) scale(${scale})`}}>
      <svg viewBox="0 0 1920 1080" style={fullSvg}>
        <ellipse cx={845} cy={833} rx={230} ry={13} fill={palette.walnut} opacity={0.14}/>
      </svg>
      <Img src={staticFile(ordinary ? '03-painted-object.png' : '04-architectural-object.png')}
        style={{position: 'absolute', left: (1920-imageWidth)/2-(ordinary ? 70 : 66),
          top: ordinary ? -14 : 98, width: imageWidth, height: imageWidth*2/3}}/>
    </div>
  </AbsoluteFill>;
};

const Annotations: React.FC<{frame: number}> = ({frame}) => {
  const start = ANNOTATE + timing.entrance.slow * 2;
  const outer = reveal(frame, start, timing.entrance.slow * 2);
  const innerStart = start + timing.hold.medium + timing.entrance.slow;
  const inner = reveal(frame, innerStart, timing.entrance.slow * 2);
  const exit = leave(frame, DIAGRAM - timing.exit.slow, timing.exit.slow);
  return <svg viewBox="0 0 1920 1080" style={{...fullSvg, opacity: exit}}>
    <g fill="none" stroke={palette.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M 612 541 L 450 541 L 450 455 L 270 455" pathLength={1} strokeDasharray={1} strokeDashoffset={1-outer}/>
      <circle cx={612} cy={541} r={7} fill={palette.bone} opacity={outer}/>
      <path d="M 954 703 L 1360 703 L 1360 550 L 1460 550" pathLength={1} strokeDasharray={1} strokeDashoffset={1-inner}/>
      <circle cx={954} cy={703} r={7} fill={palette.bone} opacity={inner}/>
    </g>
    <g fill={palette.ink}>
      <g opacity={reveal(frame, start + timing.entrance.slow, timing.entrance.medium)}>
        <text x={270} y={365} fontFamily={fonts.metadata} fontSize={30} fill={palette.walnut}>OBSERVATION</text>
        <text x={270} y={423} fontFamily={fonts.body} fontSize={42}>An outward act</text>
      </g>
      <g opacity={reveal(frame, innerStart + timing.entrance.slow, timing.entrance.medium)}>
        <text x={1390} y={460} fontFamily={fonts.metadata} fontSize={30} fill={palette.walnut}>INTERPRETATION</text>
        <text x={1390} y={518} fontFamily={fonts.body} fontSize={42}>A possible reason</text>
      </g>
    </g>
    <text x={260} y={968} fill={palette.walnut} fontFamily={fonts.body} fontSize={36}
      opacity={reveal(frame, innerStart + timing.entrance.slow * 2)}>The interior is imagined. The uncertainty is real.</text>
  </svg>;
};

const ExplanationDiagram: React.FC<{frame: number}> = ({frame}) => {
  const start = DIAGRAM + timing.entrance.slow * 2;
  const reasons = reveal(frame, start, timing.entrance.medium);
  const firstLine = reveal(frame, start + timing.entrance.medium, timing.entrance.slow);
  const secondLine = reveal(frame, start + timing.entrance.medium + timing.hold.medium, timing.entrance.slow);
  const result = reveal(frame, start + timing.entrance.medium + timing.hold.medium + timing.entrance.slow);
  return <svg viewBox="0 0 1920 1080" style={fullSvg}>
    <defs><marker id="arrow" viewBox="0 0 12 12" refX={10} refY={6} markerWidth={12} markerHeight={12}
      markerUnits="userSpaceOnUse" orient="auto"><path d="M 2 1 L 10 6 L 2 11" fill="none" stroke={palette.ink} strokeWidth={2.5}/></marker></defs>
    <g fill={palette.ink}>
      <g opacity={reasons}>
        <text x={940} y={345} fontFamily={fonts.metadata} fontSize={28} fill={palette.walnut}>POSSIBLE REASONS</text>
        <text x={940} y={475} fontFamily={fonts.heading} fontSize={48}>Concern</text>
        <text x={940} y={690} fontFamily={fonts.heading} fontSize={48}>Incentive</text>
      </g>
      <g fill="none" stroke={palette.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 1170 460 C 1300 460 1280 560 1390 560" pathLength={1} strokeDasharray={1} strokeDashoffset={1-firstLine}/>
        <path d="M 1170 675 C 1300 675 1280 560 1390 560" pathLength={1} strokeDasharray={1} strokeDashoffset={1-secondLine}/>
        <path d="M 1390 560 L 1490 560" opacity={result} markerEnd="url(#arrow)"/>
      </g>
      <g opacity={result}>
        <text x={1530} y={535} fontFamily={fonts.metadata} fontSize={28} fill={palette.walnut}>VISIBLE RESULT</text>
        <text x={1530} y={595} fontFamily={fonts.heading} fontSize={44}>A helpful act</text>
      </g>
      <text x={510} y={862} textAnchor="middle" fontFamily={fonts.metadata} fontSize={28} fill={palette.walnut}
        opacity={reasons}>CONCEPTUAL CUTAWAY</text>
      <text x={260} y={968} fontFamily={fonts.body} fontSize={36} fill={palette.ink}
        opacity={reveal(frame, start + timing.hold.long + timing.entrance.slow)}>Behavior alone leaves the reason open.</text>
    </g>
  </svg>;
};

const CombinedSequence: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: palette.bone, overflow: 'hidden'}}>
    <Img src={staticFile('07-light-background.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}/>
    <Cup frame={frame}/>
    <Heading frame={frame} start={0} end={CUT} kicker="01 / THE FAMILIAR" title="An act we can see."/>
    <Heading frame={frame} start={CUT} end={ANNOTATE} kicker="02 / THE IMPOSSIBLE" title="A reason we infer."/>
    <Heading frame={frame} start={ANNOTATE} end={DIAGRAM} kicker="03 / THE DISTINCTION" title="An imagined interior."/>
    <Heading frame={frame} start={DIAGRAM} kicker="04 / THE EXPLANATION" title="Different reasons. Same act."/>
    {frame >= ANNOTATE && frame < DIAGRAM && <Annotations frame={frame}/>}
    {frame >= DIAGRAM && <ExplanationDiagram frame={frame}/>}
  </AbsoluteFill>;
};

const ResearchRoot: React.FC = () => <Composition id="PaintedArgument" component={CombinedSequence}
  width={1920} height={1080} fps={FPS} durationInFrames={DURATION}/>;
registerRoot(ResearchRoot);
