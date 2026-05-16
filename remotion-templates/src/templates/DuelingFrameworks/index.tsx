import { Composition } from "remotion";
import { DuelingFrameworks } from "./DuelingFrameworks";
import { layout, sec } from "../../design/theme";
import { DuelingFrameworksSchema } from "./schema";
import type { DuelingFrameworksData } from "./types";
const sampleData = {
  data: {
    episode: "SAMPLE",
    title: "Realism vs. Liberalism",
    phenomenon: "Great power competition",
    durationSec: 12,
    backgroundVariant: "dark" as const,
    frameworkA: {
      name: "Realism",
      color: "#C23B22", // episode-specific — not a brand token
      tenets: [
        { text: "Power politics" },
        { text: "Security dilemma" },
        { text: "Self-help system" },
      ],
      score: 72,
      verdict: "Explains escalation logic",
    },
    frameworkB: {
      name: "Liberalism",
      color: "#3266AD", // episode-specific — not a brand token
      tenets: [
        { text: "Interdependence" },
        { text: "Institutions" },
        { text: "Democratic peace" },
      ],
      score: 55,
      verdict: "Explains restraint signals",
    },
  },
};

const editorialStyleData: DuelingFrameworksData = {
  episode: "CATALOG",
  title: "Why Empires Fall",
  subtitle: "Two diagnostic lenses on the same end-state",
  phenomenon: "Imperial collapse",
  durationSec: 12,
  backgroundVariant: "light",
  cardStyle: "editorial",
  frameworkA: {
    name: "Imperial Overstretch",
    color: "#C23B22",
    tenets: [
      { text: "Military commitments outrun the economic base" },
      { text: "Defense spending crowds out productive investment" },
      { text: "Relative decline becomes absolute" },
      { text: "The fiscal ceiling forces a strategic retreat" },
    ],
    score: 68,
    verdict: "Explains the tempo and timing",
  },
  frameworkB: {
    name: "Legitimacy Crisis",
    color: "#3266AD",
    tenets: [
      { text: "The ruling order loses its sacred authority" },
      { text: "Succession turns contested and violent" },
      { text: "Elite consensus fractures under pressure" },
      { text: "The periphery stops believing in the center" },
    ],
    score: 74,
    verdict: "Explains how the end actually arrives",
  },
  verdictLabel: "Which lens fits the late stage?",
};

export const DuelingFrameworksComposition = () => (
  <Composition
    id="DuelingFrameworks"
    component={DuelingFrameworks}
    schema={DuelingFrameworksSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DuelingFrameworksData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={sampleData as unknown as { data: DuelingFrameworksData }}
  />
);

export const DuelingFrameworksEditorialComposition = () => (
  <Composition
    id="DuelingFrameworks-Editorial"
    component={DuelingFrameworks}
    schema={DuelingFrameworksSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DuelingFrameworksData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: editorialStyleData }}
  />
);

const magazineStyleData: DuelingFrameworksData = {
  episode: "CATALOG",
  title: "Why Empires Fall",
  subtitle: "Two diagnostic lenses on the same end-state",
  phenomenon: "Imperial collapse",
  durationSec: 12,
  backgroundVariant: "light",
  cardStyle: "magazine",
  frameworkA: {
    name: "Imperial Overstretch",
    color: "#C23B22",
    tenets: [
      { text: "Military commitments outrun the economic base" },
      { text: "Defense spending crowds out productive investment" },
      { text: "Relative decline becomes absolute" },
      { text: "The fiscal ceiling forces a strategic retreat" },
    ],
    score: 68,
    verdict: "Explains the tempo and timing",
  },
  frameworkB: {
    name: "Legitimacy Crisis",
    color: "#3266AD",
    tenets: [
      { text: "The ruling order loses its sacred authority" },
      { text: "Succession turns contested and violent" },
      { text: "Elite consensus fractures under pressure" },
      { text: "The periphery stops believing in the center" },
    ],
    score: 74,
    verdict: "Explains how the end actually arrives",
  },
  verdictLabel: "Which lens fits the late stage?",
};

export const DuelingFrameworksMagazineComposition = () => (
  <Composition
    id="DuelingFrameworks-Magazine"
    component={DuelingFrameworks}
    schema={DuelingFrameworksSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DuelingFrameworksData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: magazineStyleData }}
  />
);
