import React, { useMemo } from "react";
import { DrawOnPath } from "../../components/DrawOnPath";
import { fonts, palette } from "../../design/theme";

export type Point = { x: number; y: number };

export const Mind: React.FC<{ position: Point; label: string; note: string; opacity: number; accent: string }> = React.memo(function Mind({ position, label, note, opacity, accent }) {
  return (
    <g transform={`translate(${position.x} ${position.y})`} opacity={opacity}>
      <circle r="71" fill={palette.paper} stroke={accent} strokeWidth="1" opacity="0.55" />
      <path d="M-89 0 H-73 M73 0 H89 M0 -89 V-73 M0 73 V89" stroke={accent} strokeWidth="1" />
      <rect x="-36" y="-36" width="72" height="72" transform="rotate(45)" fill={palette.paper} stroke={accent} strokeWidth="2.5" />
      <path d="M-16 -16 H16 V16 H-16Z M-8 -30 V-17 M8 -30 V-17 M-8 17 V30 M8 17 V30 M-30 -8 H-17 M17 -8 H30 M-30 8 H-17 M17 8 H30" fill="none" stroke={accent} strokeWidth="2" />
      <circle r="5" fill={accent} />
      <text y="119" textAnchor="middle" fill={palette.ink} fontFamily={fonts.body} fontSize="30" fontWeight="500">{label}</text>
      <text y="151" textAnchor="middle" fill={palette.umber} fontFamily={fonts.metadata} fontSize="18">{note}</text>
    </g>
  );
});

export const Link: React.FC<{ from: Point; to: Point; progress: number; opacity: number; color: string }> = React.memo(function Link({ from, to, progress, opacity, color }) {
  const d = useMemo(() => {
    const middleX = (from.x + to.x) / 2;
    return `M${from.x} ${from.y} C${middleX} ${from.y} ${middleX} ${to.y} ${to.x} ${to.y}`;
  }, [from.x, from.y, to.x, to.y]);
  return <g opacity={opacity}><DrawOnPath d={d} progress={progress} color={color} strokeWidth={2} showGhost={false} /></g>;
});

export const PineTree: React.FC<{ color: string; opacity: number }> = React.memo(function PineTree({ color, opacity }) {
  return <>
    <path d="M0 16 V-114" stroke={palette.walnut} strokeWidth="3" />
    <path d="M0 -156 L-28 -94 L-16 -98 L-44 -43 L-29 -49 L-58 5 L0 -7 L55 5 L28 -48 L42 -42 L15 -97 L28 -93Z" fill={color} opacity={opacity} />
    <path d="M0 -125 V-9 M0 -63 L21 -41 M0 -34 L-26 -8" stroke={palette.bone} opacity="0.24" strokeWidth="1.3" fill="none" />
  </>;
});
