/**
 * BarChartRace — composition registration + sample data.
 *
 * Sample data: G7 + BRICS GDP race at PPP, 1990–2024.
 * Source: IMF World Economic Outlook Database, April 2024.
 */

import { Composition } from "remotion";
import { BarChartRace } from "./BarChartRace";
import { layout, sec } from "../../design/theme";
import { BarChartRaceSchema } from "./schema";
import type { BarChartRaceData } from "./types";

export const barChartRaceSampleData: BarChartRaceData = {
  episode: "great-power-competition",
  title: "THE GREAT POWER GDP RACE",
  subtitle: "GDP at PPP ($T, constant 2017 international $)",
  source: "IMF World Economic Outlook Database, April 2024",
  durationSec: 18,
  backgroundVariant: "light",
  durationPerPeriod: 1.5,
  topN: 8,
  valueFormat: "$%.1fT",
  periodLabelPosition: "bottom-right",
  defaultPalette: [
    "#4A7BA7",
    "#A64D46",
    "#C4A747",
    "#888780",
    "#8B7355",
    "#7AA3C9",
  ],
  periods: [
    {
      label: "1990",
      values: [
        { id: "usa",     label: "USA",     value: 10.6 },
        { id: "japan",   label: "Japan",   value: 4.2  },
        { id: "germany", label: "Germany", value: 2.6  },
        { id: "russia",  label: "Russia",  value: 2.5  },
        { id: "france",  label: "France",  value: 1.9  },
        { id: "uk",      label: "UK",      value: 1.8  },
        { id: "china",   label: "China",   value: 1.6  },
        { id: "india",   label: "India",   value: 1.3  },
      ],
    },
    {
      label: "2000",
      values: [
        { id: "usa",     label: "USA",     value: 15.2 },
        { id: "china",   label: "China",   value: 4.2  },
        { id: "japan",   label: "Japan",   value: 5.1  },
        { id: "india",   label: "India",   value: 2.4  },
        { id: "germany", label: "Germany", value: 3.1  },
        { id: "russia",  label: "Russia",  value: 1.8  },
        { id: "france",  label: "France",  value: 2.3  },
        { id: "uk",      label: "UK",      value: 2.2  },
      ],
    },
    {
      label: "2010",
      values: [
        { id: "usa",    label: "USA",    value: 18.1 },
        { id: "china",  label: "China",  value: 12.8 },
        { id: "india",  label: "India",  value: 5.3  },
        { id: "japan",  label: "Japan",  value: 5.6  },
        { id: "russia", label: "Russia", value: 3.8  },
        { id: "germany",label: "Germany",value: 3.8  },
        { id: "brazil", label: "Brazil", value: 3.2  },
        { id: "uk",     label: "UK",     value: 2.9  },
        { id: "france", label: "France", value: 2.8  },
      ],
    },
    {
      label: "2024",
      values: [
        { id: "china",   label: "China",   value: 35.3 },
        { id: "usa",     label: "USA",     value: 28.8 },
        { id: "india",   label: "India",   value: 14.6 },
        { id: "russia",  label: "Russia",  value: 6.4  },
        { id: "japan",   label: "Japan",   value: 5.0  },
        { id: "germany", label: "Germany", value: 5.3  },
        { id: "brazil",  label: "Brazil",  value: 4.0  },
        { id: "uk",      label: "UK",      value: 3.8  },
        { id: "france",  label: "France",  value: 3.8  },
      ],
    },
  ],
};

export const BarChartRaceComposition = () => (
  <Composition
    id="BarChartRace"
    component={BarChartRace}
    schema={BarChartRaceSchema}
    calculateMetadata={({ props }) => {
      // Duration derives from data: (N-1 transitions × durationPerPeriod) + hold last period.
      // A 4-period race at 1.5s/period → 3×1.5 + 1.5 = 6s total.
      // Explicit durationSec on the data object overrides the computed value.
      const d = props.data as BarChartRaceData;
      const periodDurSec = d.durationPerPeriod ?? 1.5;
      const numPairs = Math.max(0, d.periods.length - 1);
      const computedSec = numPairs * periodDurSec + periodDurSec;
      const durationSec = d.durationSec ?? computedSec;
      return {
        durationInFrames: Math.max(60, sec(durationSec)),
        fps: layout.fps,
        width: layout.width,
        height: layout.height,
      };
    }}
    defaultProps={{ data: barChartRaceSampleData }}
  />
);
