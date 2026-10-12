/**
 * DrawOnPath — reusable "the line draws itself" primitive.
 *
 * Promoted from the GeometricMotion prototype (REMOTION_CAPABILITY_MAP.md #4).
 * An SVG path strokes itself on via @remotion/paths `evolvePath`, with optional
 * waypoint nodes placed EXACTLY on the path (`getPointAtLength`) that pop in as
 * the line reaches them. The deterministic, eased, non-gooey alternative to AI
 * morph for map-FREE routes: a line of reasoning, an abstract supply chain, a
 * process flow, a campaign arc — anywhere the *drawing* is the argument.
 *
 * The caller owns timing: pass `progress` (0..1), already eased (default reveal
 * easing is decelerate — see design/theme `easing`). This component is geometry
 * only; it adds no Background/chrome so it can layer into any template or map.
 *
 * For routes on a real geographic basemap, use RouteAnimation instead — this is
 * the schematic/diagrammatic cousin.
 */
import React, { useMemo } from "react";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { palette } from "../design/theme";

export interface DrawOnNode {
  /** Fraction along the path, 0..1. */
  at: number;
  /** Marker is a rotated square ("diamond", default) or a circle. */
  shape?: "diamond" | "circle";
  /** Override fill (defaults: endpoints = gold, interior = bone). */
  color?: string;
  /** Marker size in px. Default 34 (diamond) / 16 (circle radius). */
  size?: number;
}

export interface DrawOnPathProps {
  /** SVG path `d` string. */
  d: string;
  /** Draw progress 0..1 (caller-eased). */
  progress: number;
  color?: string;
  strokeWidth?: number;
  /** Faint full-path "ghost" behind the drawing line. Default true. */
  showGhost?: boolean;
  ghostColor?: string;
  ghostWidth?: number;
  /** Waypoint markers placed on the path; appear as the line reaches them. */
  nodes?: DrawOnNode[];
  /** Fill for the first & last node (the endpoints). Default gold. */
  endNodeColor?: string;
  /** Fill for interior nodes. Default bone. */
  midNodeColor?: string;
}

/** Smoothstep 0..1 over [edge0, edge1]. */
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const DrawOnPath: React.FC<DrawOnPathProps> = ({
  d,
  progress,
  color = palette.gold,
  strokeWidth = 11,
  showGhost = true,
  ghostColor = palette.walnut,
  ghostWidth = 3,
  nodes = [],
  endNodeColor = palette.gold,
  midNodeColor = palette.bone,
}) => {
  const placed = useMemo(() => {
    if (nodes.length === 0) return [];
    const len = getLength(d);
    return nodes.map((n) => {
      const p = getPointAtLength(d, len * n.at);
      return { ...n, x: p.x, y: p.y };
    });
  }, [d, nodes]);

  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, d);

  return (
    <>
      {showGhost && (
        <path d={d} fill="none" stroke={ghostColor} strokeWidth={ghostWidth} opacity={0.35} />
      )}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
      {placed.map((n, i) => {
        // Node appears just as the line reaches its fraction.
        const appear = smoothstep(n.at - 0.04, n.at + 0.02, progress);
        if (appear <= 0) return null;
        const isEnd = i === 0 || i === placed.length - 1;
        const fill = n.color ?? (isEnd ? endNodeColor : midNodeColor);
        if ((n.shape ?? "diamond") === "circle") {
          const radius = (n.size ?? 16) * appear;
          return <circle key={i} cx={n.x} cy={n.y} r={radius} fill={fill} />;
        }
        const s = (n.size ?? 34) * appear;
        return (
          <rect
            key={i}
            x={n.x - s / 2}
            y={n.y - s / 2}
            width={s}
            height={s}
            fill={fill}
            transform={`rotate(45 ${n.x} ${n.y})`}
          />
        );
      })}
    </>
  );
};
