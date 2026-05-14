import { Composition } from "remotion";
import { MarimekkoChart } from "./MarimekkoChart";
import { layout, palette, sec } from "../../design/theme";
import { MarimekkoChartSchema } from "./schema";
import type { MarimekkoChartData } from "./types";

// Sample data: energy mix by G7 economy.
//
// Width = share of G7 GDP (first dimension — economic scale).
// Height = energy-source composition per economy (second dimension —
// composition of the energy mix). The US dominates the chart by width
// because of its ~50% share of G7 GDP; France's nuclear share reads as
// a tall amber band; Germany's renewable share reads as a tall olive
// band. The story the chart tells in one glance: the G7's biggest
// economy is still the most fossil-dependent.
//
// Width values sum to 100 (percent mode). Each column's segments also
// sum to 100 (percent mode — column reads as 100% composition).
const sampleData: MarimekkoChartData = {
  episode: "catalog",
  title: "Energy Mix by G7 Economy",
  subtitle:
    "Width = share of G7 GDP; height = source composition within each economy",
  columns: [
    {
      id: "us",
      label: "United States",
      sublabel: "≈ 50% of G7 GDP",
      width: 50,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 80 },
        { key: "nuclear", label: "Nuclear", value: 8 },
        { key: "renewable", label: "Renewables", value: 12 },
      ],
    },
    {
      id: "germany",
      label: "Germany",
      sublabel: "≈ 10%",
      width: 10,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 55 },
        { key: "nuclear", label: "Nuclear", value: 5 },
        { key: "renewable", label: "Renewables", value: 40 },
      ],
    },
    {
      id: "japan",
      label: "Japan",
      sublabel: "≈ 10%",
      width: 10,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 78 },
        { key: "nuclear", label: "Nuclear", value: 6 },
        { key: "renewable", label: "Renewables", value: 16 },
      ],
    },
    {
      id: "uk",
      label: "United Kingdom",
      sublabel: "≈ 7%",
      width: 7,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 65 },
        { key: "nuclear", label: "Nuclear", value: 15 },
        { key: "renewable", label: "Renewables", value: 20 },
      ],
    },
    {
      id: "france",
      label: "France",
      sublabel: "≈ 7%",
      width: 7,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 50 },
        { key: "nuclear", label: "Nuclear", value: 35 },
        { key: "renewable", label: "Renewables", value: 15 },
      ],
    },
    {
      id: "italy",
      label: "Italy",
      sublabel: "≈ 5%",
      width: 5,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 75 },
        { key: "nuclear", label: "Nuclear", value: 0 },
        { key: "renewable", label: "Renewables", value: 25 },
      ],
    },
    {
      id: "canada",
      label: "Canada",
      sublabel: "≈ 11%",
      width: 11,
      segments: [
        { key: "fossil", label: "Fossil fuels", value: 60 },
        { key: "nuclear", label: "Nuclear", value: 14 },
        { key: "renewable", label: "Renewables", value: 26 },
      ],
    },
  ],
  widthMode: "percent",
  // Editorial color binding: fossil → rust (the story-villain),
  // nuclear → gold (precision / industrial), renewable → olive
  // (umber, "growth" mid-tone). Same key across columns gets the same
  // color, so the eye can track "fossil" as a horizontal band.
  segmentColorMap: {
    fossil: palette.rust,
    nuclear: palette.gold,
    renewable: palette.olive,
  },
  source: "BP Statistical Review of World Energy 2024; IEA",
  durationSec: 14,
};

export const MarimekkoChartComposition = () => (
  <Composition
    id="MarimekkoChart"
    component={MarimekkoChart}
    schema={MarimekkoChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as MarimekkoChartData).durationSec ?? 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as MarimekkoChartData }}
  />
);
