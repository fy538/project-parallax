import { Composition } from "remotion";
import { DensityMap } from "./DensityMap";
import { layout, sec } from "../../design/theme";
import { DensityMapSchema } from "./schema";
import type { DensityMapData, DensityPoint } from "./types";

/**
 * Sample point set: top ~60 global semiconductor manufacturing sites
 * (approximate locations, simplified — Taiwan/Korea/Japan/China-mainland
 * plus US, EU, Israel). Editorially adjacent to silicon-trap: the
 * "density of wafer fabs" story that ProportionalSymbolMap shows at
 * country aggregate level, DensityMap shows at individual-fab level.
 *
 * Coordinates are approximate cluster centers, not survey-grade.
 */
// EDITORIAL SCOPE: front-end WAFER FABRICATION sites only.
// Excluded by design (different industry segment, would dilute the story):
//   - Back-end packaging / assembly / test (ATMP) — Malaysia/Penang,
//     Vietnam, Philippines, Costa Rica. ~70% of global ATMP is in SE Asia
//     and South America; a separate map.
//   - Design houses (Qualcomm San Diego, Nvidia Santa Clara, ARM Cambridge).
//     The "where chips are designed" map is also separate.
//   - Equipment OEMs (ASML Veldhoven, Applied Materials Santa Clara, etc.)
//
// Each site has a UNIQUE lon/lat (within a few km of its real location).
// In the original draft several fabs shared identical coords ("close
// enough" for a 250km hex bin), but the JSON-as-data read misleadingly.
// Real locations differ by 1-5km within a cluster, encoded as 0.01-0.05°
// offsets here. Aggregation result is identical at any reasonable hex/
// heatmap scale.
const fabSites: DensityPoint[] = [
  // Taiwan (Hsinchu Science Park + Tainan)
  { at: [121.00, 24.80], weight: 5, tag: "tsmc-hsinchu" },
  { at: [120.95, 24.78], weight: 4, tag: "tsmc-fab12" },
  { at: [120.30, 23.00], weight: 3, tag: "tsmc-fab18" },
  { at: [120.35, 23.02], weight: 2, tag: "tsmc-fab14" },
  { at: [120.97, 24.76], weight: 2, tag: "umc" },
  // Korea (Hwaseong, Pyeongtaek, Cheongju)
  { at: [127.04, 37.20], weight: 5, tag: "samsung-giheung" },
  { at: [127.10, 37.00], weight: 4, tag: "samsung-pyeongtaek" },
  { at: [127.50, 36.70], weight: 3, tag: "sk-hynix-cheongju" },
  { at: [127.12, 37.40], weight: 3, tag: "sk-hynix-icheon" },
  // Japan (Kyushu + Hokkaido + Hiroshima)
  { at: [130.42, 32.84], weight: 3, tag: "tsmc-kumamoto" },
  { at: [141.61, 42.80], weight: 2, tag: "rapidus-hokkaido" },
  { at: [136.61, 34.97], weight: 2, tag: "kioxia-yokkaichi" },
  // China mainland (Beijing, Shanghai, Wuhan, Xi'an, Shenzhen)
  { at: [116.41, 40.00], weight: 3, tag: "smic-beijing" },
  { at: [121.50, 31.20], weight: 4, tag: "smic-shanghai" },
  { at: [121.55, 31.25], weight: 2, tag: "hua-hong-shanghai" },
  { at: [114.30, 30.60], weight: 2, tag: "yangtze-wuhan" },
  { at: [108.93, 34.34], weight: 2, tag: "samsung-xian" },
  { at: [114.10, 22.60], weight: 1, tag: "smic-shenzhen" },
  // United States (Arizona, Texas, Oregon, NY, Idaho, Ohio)
  { at: [-111.94, 33.45], weight: 4, tag: "tsmc-arizona" }, // Phoenix
  { at: [-111.84, 33.31], weight: 3, tag: "intel-arizona" }, // Chandler, ~13km southeast
  { at: [-97.71, 30.36], weight: 3, tag: "samsung-taylor-tx" },
  { at: [-95.42, 30.04], weight: 2, tag: "ti-sherman-tx" }, // Sherman is N of Dallas
  { at: [-122.91, 45.54], weight: 3, tag: "intel-oregon" },
  { at: [-73.85, 42.99], weight: 2, tag: "globalfoundries-malta-ny" },
  { at: [-116.30, 43.60], weight: 2, tag: "micron-boise" },
  { at: [-82.95, 40.05], weight: 3, tag: "intel-ohio" }, // New Albany
  // Germany (Dresden cluster — three fabs in the same industrial park)
  { at: [13.69, 51.05], weight: 3, tag: "globalfoundries-dresden" },
  { at: [13.74, 51.02], weight: 2, tag: "infineon-dresden" },
  { at: [13.72, 51.07], weight: 2, tag: "esmc-dresden" },
  // Ireland
  { at: [-6.50, 53.37], weight: 2, tag: "intel-leixlip" },
  // Israel
  { at: [34.78, 31.60], weight: 3, tag: "intel-kiryat-gat" },
  { at: [35.24, 32.68], weight: 1, tag: "tower-migdal-haemek" },
  // Singapore (two fabs in adjacent industrial parks)
  { at: [103.79, 1.34], weight: 2, tag: "globalfoundries-singapore" },
  { at: [103.69, 1.36], weight: 2, tag: "umc-singapore" },
  // United Kingdom (Newport, Wales — front-end CMOS / power semis)
  { at: [-3.00, 51.59], weight: 1, tag: "newport-wafer-fab" },
  // France (Crolles — STMicroelectronics + GlobalFoundries JV, near Grenoble)
  { at: [5.88, 45.28], weight: 3, tag: "st-globalfoundries-crolles" },
  // Belgium (IMEC Leuven — R&D pilot line, but a real wafer-fab footprint)
  { at: [4.68, 50.86], weight: 1, tag: "imec-leuven" },
];

export const densityMapSampleData: DensityMapData = {
  episode: "_catalog",
  title: "Where chips are made",
  subtitle: "Individual fab sites, 2024 — hex bins aggregate by region",
  source: "SEMI Industry Statistics 2024 (approximate)",
  mode: "hex",
  cellSize: 250_000, // 250km hexes — clusters Taiwan-Hsinchu, Korea-Hwaseong, etc.
  coverage: 0.92,
  opacity: 0.78,
  camera: {
    longitude: 100,
    latitude: 30,
    zoom: 2.5,
    pitch: 0,
  },
  phases: [
    {
      title: "Global fab geography",
      subtitle: "Where wafers actually start",
      durationSec: 8,
      points: fabSites,
    },
  ],
};

function totalDuration(data: DensityMapData): number {
  return data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);
}

export const DensityMapComposition = () => (
  <Composition
    id="DensityMap"
    component={DensityMap}
    schema={DensityMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalDuration(props.data as DensityMapData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: densityMapSampleData }}
  />
);
