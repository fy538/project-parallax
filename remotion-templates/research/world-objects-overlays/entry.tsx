/** Isolated visual research; does not register or alter production templates. */
import React from 'react';
import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {fonts, palette, timing} from '../../src/design/theme';
import {CLAMP_DECELERATE, CLAMP_QUAD_INOUT, kenBurnsDrift, panDrift} from '../../src/utils/animation';

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION = 6 * FPS;
const SCENE = '01-quiet-scenery.png';
const fit: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};
const reveal = (frame: number, start: number, length: number = timing.entrance.slow) =>
  interpolate(frame, [start, start + length], [0, 1], CLAMP_DECELERATE);

const Scene: React.FC<{architectural?: boolean; children?: React.ReactNode; fixed?: boolean}> = ({architectural, children, fixed}) => {
  const frame = useCurrentFrame();
  const scale = fixed ? 1 : kenBurnsDrift(frame, DURATION - 1);
  const x = fixed ? 0 : panDrift(frame, DURATION - 1);
  return <AbsoluteFill style={{backgroundColor: palette.bone, overflow: 'hidden'}}>
    <AbsoluteFill style={{transform: `translateX(${x}px) scale(${scale})`}}>
      <Img src={staticFile(architectural ? '02b-architectural-scenery.png' : SCENE)} style={fit}/>
      {children}
    </AbsoluteFill>
  </AbsoluteFill>;
};

const AnalyticalOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const trace = reveal(frame, timing.hold.short, timing.entrance.slow * 2);
  const label = reveal(frame, timing.hold.short + timing.entrance.slow * 2, timing.entrance.crisp);
  const bank = reveal(frame, timing.hold.medium + timing.entrance.slow * 2);
  return <svg viewBox="0 0 1920 1080" style={{width: '100%', height: '100%', position: 'absolute', inset: 0}}>
    <g fill="none" stroke={palette.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M 530 523 Q 720 520 905 506 Q 1045 519 1190 528" pathLength={1} strokeDasharray={1} strokeDashoffset={1-trace}/>
      <path d="M 908 495 L 908 285 L 1152 285" pathLength={1} strokeDasharray={1} strokeDashoffset={1-trace}/>
      <circle cx={908} cy={506} r={7} fill={palette.bone} opacity={trace}/>
      <path d="M 345 674 L 230 632 L 230 469" pathLength={1} strokeDasharray={1} strokeDashoffset={1-bank}/>
      <circle cx={345} cy={674} r={7} fill={palette.bone} opacity={bank}/>
    </g>
    <g fill={palette.ink} fontFamily={fonts.metadata} fontSize={34}>
      <g opacity={label}><rect x={960} y={214} width={294} height={56} fill={palette.bone}/><text x={978} y={253}>01 / CROSSING</text></g>
      <g opacity={bank}><rect x={170} y={399} width={330} height={56} fill={palette.bone}/><text x={188} y={438}>02 / NEAR BANK</text></g>
    </g>
  </svg>;
};

const SpatialOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, DURATION - 1], [0, 1], CLAMP_QUAD_INOUT);
  // Authored foreground wings; the source painting remains one flattened plate.
  return <svg viewBox="0 0 1920 1080" style={{width: '100%', height: '100%', position: 'absolute', inset: 0}}>
    <path d="M -80 -80 L 230 -80 L 210 240 L 175 620 L 140 1160 L -80 1160 Z" fill={palette.ink} opacity={0.84}
      transform={`translate(${-progress * 24} 0)`}/>
    <path d="M 1880 -80 L 2000 -80 L 2000 1160 L 1800 1160 L 1822 735 L 1850 380 Z" fill={palette.walnut} opacity={0.92}
      transform={`translate(${progress * 18} 0)`}/>
    <path d="M -80 1070 L 715 1027 L 1210 1080 L 2000 1038 L 2000 1160 L -80 1160 Z" fill={palette.ink} opacity={0.76}/>
    <path d="M 160 -80 L 790 -80 L 1260 1080 L 1030 1080 Z" fill={palette.bone}
      opacity={0.07 + progress * 0.035}/>
  </svg>;
};

const ObjectStudy: React.FC<{cutaway?: boolean}> = ({cutaway}) => {
  const frame = useCurrentFrame();
  const arrival = reveal(frame, 0, timing.entrance.slow * 2);
  const scale = kenBurnsDrift(frame, DURATION - 1);
  // Different source margins are normalized to comparable visible cup sizes.
  const imageWidth = cutaway ? 1260 : 1580;
  const imageHeight = imageWidth * 2 / 3;
  const x = (WIDTH - imageWidth) / 2 - (cutaway ? 66 : 70);
  const y = cutaway ? 98 : -14;
  return <AbsoluteFill style={{backgroundColor: palette.paper, overflow: 'hidden'}}>
    <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <ellipse cx={925} cy={852} rx={310 * scale} ry={20} fill={palette.walnut} opacity={arrival * 0.11}/>
    </svg>
    <Img src={staticFile(cutaway ? '04-architectural-object.png' : '03-painted-object.png')}
      style={{position: 'absolute', left: x, top: y, width: imageWidth, height: imageHeight,
        opacity: arrival, transform: `translateY(${(1-arrival)*32}px) scale(${scale})`}}/>
    <div style={{position: 'absolute', bottom: 84, left: 100, right: 100, display: 'flex', justifyContent: 'space-between',
      fontFamily: fonts.metadata, fontSize: 32, color: palette.walnut, opacity: reveal(frame, timing.entrance.slow)}}>
      <span>{cutaway ? 'AN IMPOSSIBLE INTERIOR' : 'AN OBSERVED OBJECT'}</span><span>OCHRE / CERAMIC</span>
    </div>
  </AbsoluteFill>;
};

const CHART = [{name: 'C', value: 80}, {name: 'B', value: 60}, {name: 'A', value: 35}] as const;
const CHART_X = 445;
const CHART_Y = 398;
const CHART_WIDTH = 1000;
const ROW_GAP = 139;

const ChartRow = React.memo(({name, value, index, dark, frame}: {name: string; value: number; index: number; dark: boolean; frame: number}) => {
  const start = timing.hold.short + index * timing.stagger.loose;
  const progress = reveal(frame, start, timing.entrance.slow * 2);
  const valueOpacity = reveal(frame, start + timing.entrance.slow * 2, timing.entrance.crisp);
  const foreground = dark ? palette.bone : palette.ink;
  const length = CHART_WIDTH * value / 100;
  return <g transform={`translate(0 ${CHART_Y + index * ROW_GAP})`}>
    <text x={CHART_X - 75} y={43} textAnchor="end" fontFamily={fonts.body} fontSize={42} fill={foreground}>{name}</text>
    <rect x={CHART_X} y={0} width={length * progress} height={62} fill={index === 0 ? palette.gold : dark ? palette.taupe : palette.walnut}/>
    <text x={CHART_X + length + 24} y={43} fontFamily={fonts.metadata} fontSize={38} fill={foreground} opacity={valueOpacity}>{value}</text>
  </g>;
});

const BackgroundStudy: React.FC<{dark?: boolean}> = ({dark = false}) => {
  const frame = useCurrentFrame();
  const foreground = dark ? palette.bone : palette.ink;
  const secondary = dark ? palette.sand : palette.walnut;
  const structure = reveal(frame, 0, timing.entrance.medium);
  return <AbsoluteFill style={{backgroundColor: dark ? palette.ink : palette.bone}}>
    <Img src={staticFile(dark ? '08-dark-background.png' : '07-light-background.png')} style={fit}/>
    <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <g opacity={structure}>
        <text x={300} y={175} fontFamily={fonts.metadata} fontSize={30} fill={secondary}>PARALLAX / BACKGROUND STUDY</text>
        <text x={300} y={278} fontFamily={fonts.heading} fontWeight={500} fontSize={72} fill={foreground}>Three values. One quiet field.</text>
        <line x1={CHART_X} x2={CHART_X+CHART_WIDTH} y1={840} y2={840} stroke={foreground} strokeWidth={2} opacity={0.4}/>
        {[0, 50, 100].map(value => <g key={value}>
          <line x1={CHART_X+CHART_WIDTH*value/100} x2={CHART_X+CHART_WIDTH*value/100} y1={840} y2={852} stroke={foreground} strokeWidth={2} opacity={0.5}/>
          <text x={CHART_X+CHART_WIDTH*value/100} y={893} textAnchor="middle" fontFamily={fonts.metadata} fontSize={32} fill={secondary}>{value}</text>
        </g>)}
        <text x={300} y={990} fontFamily={fonts.metadata} fontSize={28} fill={secondary}>SYNTHETIC VALUES / LAYOUT TEST ONLY</text>
      </g>
      {CHART.map((row, index) => <ChartRow key={row.name} {...row} index={index} dark={dark} frame={frame}/>)}
    </svg>
  </AbsoluteFill>;
};

const WorldStudy: React.FC<{study: number}> = ({study}) => {
  if (study === 1) return <Scene/>;
  if (study === 2) return <Scene architectural/>;
  if (study === 3) return <ObjectStudy/>;
  if (study === 4) return <ObjectStudy cutaway/>;
  if (study === 5) return <Scene fixed><AnalyticalOverlay/></Scene>;
  if (study === 6) return <Scene fixed><SpatialOverlay/></Scene>;
  return <BackgroundStudy dark={study === 8}/>;
};

const ResearchRoot: React.FC = () => <>
  {Array.from({length: 8}, (_, index) => <Composition key={index} id={`WorldStudy${index+1}`} component={WorldStudy}
    width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={DURATION} defaultProps={{study: index+1}}/>) }
</>;
registerRoot(ResearchRoot);
