/**
 * BifurcationRoute barrel export + composition registration.
 *
 * Sample data demonstrates a supply chain bifurcation:
 * TSMC (unified) splits into US-aligned (ASML→Apple/NVIDIA→US Market)
 * and China-aligned (SMIC→Huawei→China Market) networks.
 */

import { Composition } from "remotion";
import { BifurcationRoute } from "./BifurcationRoute";
import { BifurcationRouteSchema } from "./schema";
import type { BifurcationRouteData } from "./types";

// Export component, schema, and types
export { BifurcationRoute };
export { BifurcationRouteSchema } from "./schema";
export type { BifurcationRouteData, BifurcationNode, BifurcationLink } from "./types";

// Sample data for Remotion Studio preview
const sampleData: BifurcationRouteData = {
  episode: "silicon-trap",
  title: "The Bifurcation",
  subtitle: "One supply chain becomes two",
  nodes: [
    { id: "tsmc", label: "TSMC", x: 50, y: 15, network: "unified", icon: "🏭" },
    { id: "asml", label: "ASML", x: 20, y: 35, network: "networkA" },
    { id: "smic", label: "SMIC", x: 80, y: 35, network: "networkB" },
    { id: "apple", label: "Apple", x: 15, y: 65, network: "networkA" },
    { id: "nvidia", label: "NVIDIA", x: 35, y: 65, network: "networkA" },
    { id: "huawei", label: "Huawei", x: 70, y: 65, network: "networkB" },
    { id: "us", label: "US Market", x: 25, y: 85, network: "networkA" },
    { id: "cn", label: "China Market", x: 75, y: 85, network: "networkB" },
  ],
  links: [
    { from: "tsmc", to: "asml", phase: "unified" },
    { from: "tsmc", to: "smic", phase: "unified" },
    { from: "tsmc", to: "apple", phase: "unified" },
    { from: "tsmc", to: "nvidia", phase: "unified" },
    { from: "tsmc", to: "huawei", phase: "unified" },
    { from: "asml", to: "apple", phase: "split", network: "networkA" },
    { from: "asml", to: "nvidia", phase: "split", network: "networkA" },
    { from: "nvidia", to: "us", phase: "split", network: "networkA" },
    { from: "apple", to: "us", phase: "split", network: "networkA" },
    { from: "smic", to: "huawei", phase: "split", network: "networkB" },
    { from: "huawei", to: "cn", phase: "split", network: "networkB" },
  ],
  forkNodeId: "tsmc",
  networkALabel: "US-Aligned",
  networkBLabel: "China-Aligned",
  source: "Parallax Analysis",
};

export const BifurcationRouteComposition = () => (
  <Composition
    id="BifurcationRoute"
    component={BifurcationRoute}
    schema={BifurcationRouteSchema}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ data: sampleData }}
  />
);
