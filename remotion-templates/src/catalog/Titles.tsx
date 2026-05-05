/**
 * Catalog — Title cards (TitleTransition × 3).
 *
 * Three variants: episode-title, section, end-card.
 * Subjects are placeholder-channel-themed.
 */

import { Composition } from "remotion";
import { TitleTransition } from "../templates/TitleTransition/TitleTransition";
import { TitleTransitionSchema } from "../templates/TitleTransition/schema";
import type { TitleTransitionData } from "../templates/TitleTransition/types";
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

const titleEpisode: TitleTransitionData = {
  episode: CATALOG_EPISODE,
  variant: "episode-title",
  episodeLabel: "EPISODE 00",
  seriesName: "Parallax",
  title: "The Catalog",
  subtitle: "A library of every visual the channel can build",
  accentColor: "#E5A544",
  durationSec: 5,
};

const titleSection: TitleTransitionData = {
  episode: CATALOG_EPISODE,
  variant: "section",
  sectionNumber: "II",
  sectionTitle: "Where the Argument Turns",
  accentColor: "#C23B22",
  durationSec: 4,
};

const titleEndCard: TitleTransitionData = {
  episode: CATALOG_EPISODE,
  variant: "end-card",
  ctaText: "Subscribe for more analytical lenses on contemporary geopolitics.",
  nextEpisodeTeaser: "Next: The Map That Wasn't",
  accentColor: "#3266AD",
  durationSec: 5,
};

const titleComp = (id: string, data: TitleTransitionData) => (
  <Composition
    id={id}
    component={TitleTransition}
    schema={TitleTransitionSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as TitleTransitionData).durationSec || 4),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogTitleEpisode = () => titleComp(catalogId("TitleTransition", "episode"), titleEpisode);
export const CatalogTitleSection = () => titleComp(catalogId("TitleTransition", "section"), titleSection);
export const CatalogTitleEndCard = () => titleComp(catalogId("TitleTransition", "end-card"), titleEndCard);

export const catalogTitlesData = {
  titleEpisode, titleSection, titleEndCard,
};
