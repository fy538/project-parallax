import { Composition } from "remotion";
import { PrimarySourceReveal } from "./PrimarySourceReveal";
import { standardMetadata } from "../../utils/composition";
import { PrimarySourceSchema } from "./schema";
import type { PrimarySourceData } from "./types";

// Default props — Article 231 of the Treaty of Versailles, the "war guilt
// clause" the German delegation was forced to sign. The annotation layer
// walks through the political consequences of each phrase choice.
export const primarySourceRevealSampleData: PrimarySourceData = {
  episode: "weimar-arc",
  title: "ARTICLE 231",
  subtitle: "The clause that would haunt the next two decades.",
  source: "Treaty of Versailles, Part VIII (1919)",
  text: "The Allied and Associated Governments affirm and Germany accepts the responsibility of Germany and her allies for causing all the loss and damage to which the Allied and Associated Governments and their nationals have been subjected as a consequence of the war imposed upon them by the aggression of Germany and her allies.",
  annotations: [
    {
      target: "Germany accepts",
      type: "underline",
      appearAtSec: 2.5,
    },
    {
      target: "responsibility",
      type: "circle",
      appearAtSec: 4.5,
    },
    {
      target: "responsibility",
      type: "translate",
      note: "Verantwortlichkeit — closer to 'liability' in the German text",
      appearAtSec: 6.5,
    },
    {
      target: "all the loss and damage",
      type: "highlight",
      appearAtSec: 9.5,
    },
    {
      target: "all the loss and damage",
      type: "margin-note",
      note: "Open-ended scope — used to justify the 1921 reparations figure of 132 billion gold marks.",
      appearAtSec: 11.5,
    },
    {
      target: "aggression",
      type: "numbered",
      note: "Disputed historiographically — see Fischer (1961), Clark (2012). The clause language drove German revisionist movements through the 1920s.",
      appearAtSec: 14,
    },
  ],
  durationSec: 22,
};

export const PrimarySourceRevealComposition = () => (
  <Composition
    id="PrimarySourceReveal"
    component={PrimarySourceReveal}
    schema={PrimarySourceSchema}
    calculateMetadata={standardMetadata<PrimarySourceData>(18)}
    defaultProps={{ data: primarySourceRevealSampleData as PrimarySourceData }}
  />
);
