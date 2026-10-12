import { Composition } from "remotion";
import { NewspaperHeadlineRotator } from "./NewspaperHeadlineRotator";
import { standardMetadata } from "../../utils/composition";
import { NewspaperHeadlineRotatorSchema } from "./schema";
import type { NewspaperHeadlineRotatorData } from "./types";

// Default props — for the catalog preview, we ship without external masthead
// URLs (those require asset sourcing per-episode). Editors will hot-swap
// `mastheadImageUrl` with real Library-of-Congress / Wikimedia crops when
// authoring an episode. The preview falls back to typeset publication names.
export const newspaperHeadlineRotatorSampleData: NewspaperHeadlineRotatorData = {
  episode: "fall-of-berlin-wall-1989",
  title: "THE WORLD WOKE TO ONE STORY",
  subtitle: "Front pages, 10 November 1989.",
  source: "Library of Congress, Chronicling America (sample crops pending)",
  headlines: [
    {
      mastheadImageUrl: "", // editors replace with LOC crop
      publicationName: "The New York Times",
      headlineText: "EAST GERMANY OPENS FRONTIER TO THE WEST FOR MIGRATION OR VISITS",
      deck: "Border posts removed; thousands cross to West Berlin and West Germany overnight.",
      dateline: "NEW YORK · NOV 10 1989",
    },
    {
      mastheadImageUrl: "",
      publicationName: "The Times",
      headlineText: "BERLIN WALL FALLS",
      deck: "Three decades of Cold War division end as East German citizens stream into the West.",
      dateline: "LONDON · NOV 10 1989",
    },
    {
      mastheadImageUrl: "",
      publicationName: "Le Monde",
      headlineText: "LE MUR S'OUVRE",
      deck: "À Berlin, les frontières s'effacent dans la nuit.",
      dateline: "PARIS · 10 NOV 1989",
    },
    {
      mastheadImageUrl: "",
      publicationName: "Bild",
      headlineText: "DIE MAUER IST OFFEN!",
      deck: "Berliner umarmen sich an den Grenzübergängen.",
      dateline: "HAMBURG · 10 NOV 1989",
    },
  ],
  transition: "crossfade-scale",
  holdSec: 3.5,
  durationSec: 16,
};

export const NewspaperHeadlineRotatorComposition = () => (
  <Composition
    id="NewspaperHeadlineRotator"
    component={NewspaperHeadlineRotator}
    schema={NewspaperHeadlineRotatorSchema}
    calculateMetadata={standardMetadata<NewspaperHeadlineRotatorData>(16)}
    defaultProps={{ data: newspaperHeadlineRotatorSampleData as NewspaperHeadlineRotatorData }}
  />
);
