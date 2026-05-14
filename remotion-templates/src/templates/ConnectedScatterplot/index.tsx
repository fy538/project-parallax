import { Composition } from "remotion";
import { ConnectedScatterplot } from "./ConnectedScatterplot";
import { layout, sec } from "../../design/theme";
import { ConnectedScatterplotSchema } from "./schema";
import type { ConnectedScatterplotData } from "./types";

// Sample data: the Phillips curve, 1973–2024. Each (year, unemployment,
// inflation) is an annual observation. The editorial point is the
// trajectory's shape — the late-70s stagflation loop, the Volcker
// disinflation, the long quiet of 1990–2019, and the post-pandemic jag.
const sampleData: ConnectedScatterplotData = {
  episode: "catalog",
  title: "The Phillips Curve, Then and Now",
  subtitle:
    "US inflation vs unemployment — fifty years of broken promises",
  points: [
    { year: 1973, x: 4.9, y: 6.2 },
    { year: 1975, x: 8.5, y: 9.1, highlight: true, label: "stagflation" },
    { year: 1980, x: 7.1, y: 13.5, highlight: true, label: "Volcker shock" },
    { year: 1982, x: 9.7, y: 6.1 },
    { year: 1985, x: 7.2, y: 3.5 },
    { year: 1990, x: 5.6, y: 5.4 },
    { year: 1995, x: 5.6, y: 2.8 },
    { year: 2000, x: 4.0, y: 3.4 },
    { year: 2005, x: 5.1, y: 3.4 },
    { year: 2008, x: 5.8, y: 3.8 },
    { year: 2010, x: 9.6, y: 1.6 },
    { year: 2015, x: 5.3, y: 0.1 },
    { year: 2019, x: 3.7, y: 1.8 },
    { year: 2020, x: 8.1, y: 1.2, highlight: true, label: "pandemic" },
    { year: 2021, x: 5.4, y: 4.7 },
    { year: 2022, x: 3.6, y: 8.0, highlight: true, label: "post-pandemic inflation" },
    { year: 2023, x: 3.6, y: 4.1 },
    { year: 2024, x: 4.0, y: 2.9 },
  ],
  xAxisLabel: "Unemployment (% of labor force)",
  yAxisLabel: "Inflation (CPI YoY %)",
  xUnit: "%",
  yUnit: "%",
  source: "BLS, FRED",
  durationSec: 14,
};

export const ConnectedScatterplotComposition = () => (
  <Composition
    id="ConnectedScatterplot"
    component={ConnectedScatterplot}
    schema={ConnectedScatterplotSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(
        (props.data as ConnectedScatterplotData).durationSec ?? 12,
      ),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as ConnectedScatterplotData }}
  />
);
