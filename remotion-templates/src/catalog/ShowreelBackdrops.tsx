/**
 * ShowreelBackdrops — second catalog showreel demonstrating templates rendered
 * over AI-generated atmospheric backdrops (the `SegmentBackdrop` system).
 *
 * The main `CatalogShowreel` renders every template on the default paper
 * substrate — that's what the catalog evaluates against and what most
 * episode segments use. This separate composition pairs ~10 distinctive
 * templates with thematically apt backdrops from `BACKDROP_MANIFEST` so
 * authors can SEE how the AI-gen backdrop register reads in production
 * (which compositions hold up over photographic backgrounds, which feel
 * over-decorated, which need their own paper substrate to stay legible).
 *
 * Each segment:
 * - Applies the `transparent()` helper (combines `still()` drift override
 *   with `transparentBackground: true`) so the template's own paper
 *   substrate gets punched through.
 * - Renders a `SegmentBackdrop` underneath so the AI-gen image shows.
 *
 * For the editorial reading of when each backdrop fits which segment,
 * see `data/backdrop-manifest.json` (each backdrop declares its register +
 * recommendedPreset). The pairings below are illustrative — adjust per
 * episode's actual visual-spec choices.
 */

import React from "react";
import { Composition, Series, AbsoluteFill } from "remotion";
import { z } from "zod";
import { layout, sec } from "../design/theme";
import { Slate } from "./Slate";
import { FilmOverlay } from "../components/FilmOverlay";
import {
  EditorialSurface,
  SegmentBackdrop,
} from "../components/EditorialSurface";
import { still } from "../utils/direction";

// ── Template components used in this showcase ──────────────────────────
import { TitleTransition } from "../templates/TitleTransition/TitleTransition";
import { StatReveal } from "../templates/StatReveal/StatReveal";
import { IsotypeChart } from "../templates/IsotypeChart/IsotypeChart";
import { KineticTypography } from "../templates/KineticTypography/KineticTypography";
import { DataChart } from "../templates/DataChart/DataChart";
import { BeeswarmChart } from "../templates/BeeswarmChart/BeeswarmChart";
import { NetworkDiagram } from "../templates/NetworkDiagram/NetworkDiagram";
import { ArcDiagram } from "../templates/ArcDiagram/ArcDiagram";
import { DecisionTree } from "../templates/DecisionTree/DecisionTree";
import { TilegramUSMap } from "../templates/TilegramUSMap/TilegramUSMap";

// ── Catalog data references ────────────────────────────────────────────
import { catalogDataData } from "./Data";
import { catalogDiagramsData } from "./Diagrams";
import { catalogTitlesData } from "./Titles";
import { catalogTypographyData } from "./Typography";
import { catalogScenariosData } from "./Scenarios";
import { catalogMapsData } from "./Maps";

// ── Transparency helper ────────────────────────────────────────────────
/**
 * Combine `still()` (no drift) with `transparentBackground: true` so the
 * template renders without its paper substrate, letting the SegmentBackdrop
 * underneath show through. Optional `backgroundVariant` lets you switch the
 * template to dark-mode text colors when the backdrop is dark (otherwise
 * the template's dark-on-light text vanishes against the dark backdrop —
 * known failure mode caught in May 2026 render review).
 */
const transparent = <T extends { _direction?: unknown }>(
  data: T,
  backgroundVariant: "light" | "dark" = "light",
): T => ({
  ...still(data),
  backgroundVariant,
  transparentBackground: true,
} as T);

/**
 * Backdrop registers — keep this in sync with which `data/backdrop-manifest.json`
 * entries are visually light vs. dark. Pairings against dark backdrops need
 * `backgroundVariant: "dark"` on the template so its text reads in light tones.
 */
const DARK_BACKDROPS = new Set([
  "night-operations",
  "archive-nocturne",
  "abyss-depth",
  "foundry-ember",
  "city-noir",
  "night-grid",
  "switchyard-night",
  "rift-silhouette",
  "constellation-grid",
  "twilight-skyline",
]);

/** Pick the right `backgroundVariant` for a given backdrop. */
const variantFor = (backdropId: string): "light" | "dark" =>
  DARK_BACKDROPS.has(backdropId) ? "dark" : "light";

// ── Segment structure ──────────────────────────────────────────────────

interface BackdropSegment {
  durationSec: number;
  /** Backdrop id from `data/backdrop-manifest.json`. */
  backdropId: string;
  /** The rendered template. */
  render: () => React.ReactNode;
  /** Slate metadata (shown briefly before the segment). */
  slate: { template: string; variant: string; backdrop: string };
}

const SLATE_SEC = 2.0;

const segmentDuration = (s: BackdropSegment): number =>
  SLATE_SEC + s.durationSec;

// ── Curated pairings ────────────────────────────────────────────────────
//
// Each template is paired with a backdrop whose register supports the
// editorial intent of the demo. The pairing logic:
//
//   - Cinematic title moments → `horizon` / `twilight-skyline` (open sky)
//   - Semiconductor / industrial stats → `fab-interior` / `industrial-yard`
//   - Strategic decision frames → `strategy-grid` / `situation-board`
//   - Lineage / archival reveals → `archive-vault` (dim, paper-rich)
//   - Map register → `cartographic` (echoes the form)
//   - Quote / typography → `reading-room` (paper + light)
//
// Don't over-decorate: backdrops carry mood; templates carry argument.
// Backdrops that fight the foreground (high contrast, busy texture) are
// the failure mode. The ones below were chosen for low/medium texture
// against legible-by-default templates.

const SEGMENTS: BackdropSegment[] = [
  // 1. Title intro under open horizon — cinematic opening register.
  {
    durationSec: catalogTitlesData.titleEpisode.durationSec ?? 4,
    backdropId: "horizon",
    slate: {
      template: "TitleTransition",
      variant: "episode",
      backdrop: "horizon",
    },
    render: () => (
      <TitleTransition data={transparent(catalogTitlesData.titleEpisode, variantFor("horizon"))} />
    ),
  },

  // 2. IsotypeChart "92% TSMC" over a cleanroom — content-resonant.
  {
    durationSec: catalogDataData.isotypeChips.durationSec ?? 10,
    backdropId: "fab-interior",
    slate: {
      template: "IsotypeChart",
      variant: "tsmc-chip-share",
      backdrop: "fab-interior",
    },
    render: () => (
      <IsotypeChart data={transparent(catalogDataData.isotypeChips, variantFor("fab-interior"))} />
    ),
  },

  // 3. NetworkDiagram bipartite (TSMC chokepoint) over network-graph —
  //    the AI mesh echoes the chart's structural argument.
  {
    durationSec: catalogDiagramsData.nwBipartite.durationSec ?? 12,
    backdropId: "network-graph",
    slate: {
      template: "NetworkDiagram",
      variant: "bipartite",
      backdrop: "network-graph",
    },
    render: () => (
      <NetworkDiagram data={transparent(catalogDiagramsData.nwBipartite, variantFor("network-graph"))} />
    ),
  },

  // 4. StatReveal "Apollo cost" over night-operations — space-program mood.
  {
    durationSec: catalogDataData.statApollo.durationSec ?? 9,
    backdropId: "night-operations",
    slate: {
      template: "StatReveal",
      variant: "apollo-cost",
      backdrop: "night-operations",
    },
    render: () => (
      <StatReveal data={transparent(catalogDataData.statApollo, variantFor("night-operations"))} />
    ),
  },

  // 5. KineticTypography quote over a reading-room — paper-register mood.
  {
    durationSec: catalogTypographyData.quoteHeraclitus.durationSec ?? 6,
    backdropId: "reading-room",
    slate: {
      template: "KineticTypography",
      variant: "quote-heraclitus",
      backdrop: "reading-room",
    },
    render: () => (
      <KineticTypography
        data={transparent(catalogTypographyData.quoteHeraclitus, variantFor("reading-room"))}
      />
    ),
  },

  // 6. BeeswarmChart (military spending) over situation-board — war-room.
  {
    durationSec: catalogDataData.beeswarmMilitarySpending.durationSec ?? 12,
    backdropId: "situation-board",
    slate: {
      template: "BeeswarmChart",
      variant: "military-spending",
      backdrop: "situation-board",
    },
    render: () => (
      <BeeswarmChart
        data={transparent(catalogDataData.beeswarmMilitarySpending, variantFor("situation-board"))}
      />
    ),
  },

  // 7. DataChart (speeds-bar / mountains) over desert-horizon — landscape scale.
  {
    durationSec: catalogDataData.chartMountains.durationSec ?? 8,
    backdropId: "desert-horizon",
    slate: {
      template: "DataChart",
      variant: "speeds-bar",
      backdrop: "desert-horizon",
    },
    render: () => (
      <DataChart data={transparent(catalogDataData.chartMountains, variantFor("desert-horizon"))} />
    ),
  },

  // 8. ArcDiagram (grand-strategy lineage) over archive-vault — lineage archived.
  {
    durationSec: catalogDiagramsData.arcDiagramGrandStrategy.durationSec ?? 14,
    backdropId: "archive-vault",
    slate: {
      template: "ArcDiagram",
      variant: "grand-strategy",
      backdrop: "archive-vault",
    },
    render: () => (
      <ArcDiagram
        data={transparent(catalogDiagramsData.arcDiagramGrandStrategy, variantFor("archive-vault"))}
      />
    ),
  },

  // 9. DecisionTree (chess opening) over strategy-grid — decision matrix.
  {
    durationSec: catalogScenariosData.treeChessOpening.durationSec ?? 12,
    backdropId: "strategy-grid",
    slate: {
      template: "DecisionTree",
      variant: "chess-opening",
      backdrop: "strategy-grid",
    },
    render: () => (
      <DecisionTree
        data={transparent(catalogScenariosData.treeChessOpening, variantFor("strategy-grid"))}
      />
    ),
  },

  // 10. TilegramUSMap (2024 electoral) over cartographic — map-on-map.
  {
    durationSec: catalogMapsData.tilegramElectoral2024.durationSec ?? 12,
    backdropId: "cartographic",
    slate: {
      template: "TilegramUSMap",
      variant: "electoral-2024",
      backdrop: "cartographic",
    },
    render: () => (
      <TilegramUSMap
        data={transparent(catalogMapsData.tilegramElectoral2024, variantFor("cartographic"))}
      />
    ),
  },

  // 11. Closing title over twilight-skyline.
  {
    durationSec: catalogTitlesData.titleEndCard.durationSec ?? 4,
    backdropId: "twilight-skyline",
    slate: {
      template: "TitleTransition",
      variant: "end-card",
      backdrop: "twilight-skyline",
    },
    render: () => (
      <TitleTransition data={transparent(catalogTitlesData.titleEndCard, variantFor("twilight-skyline"))} />
    ),
  },
];

const TOTAL_DURATION_SEC = SEGMENTS.reduce(
  (acc, s) => acc + segmentDuration(s),
  0,
);

// ── React component ─────────────────────────────────────────────────────

const ShowreelBackdropsSchema = z.object({
  enableFilmOverlay: z.boolean().default(true),
  filmIntensity: z.number().min(0).max(1).default(0.35),
});

type ShowreelBackdropsProps = z.infer<typeof ShowreelBackdropsSchema>;

const ShowreelBackdrops: React.FC<ShowreelBackdropsProps> = ({
  enableFilmOverlay = true,
  filmIntensity = 0.35,
}) => {
  // Each segment is: a slate card on plain paper, then the segment
  // contents wrapped with a SegmentBackdrop. The slate doesn't carry the
  // backdrop because Slate already has its own paper-card composition —
  // putting a photographic backdrop behind it would compete.
  const series = (
    <Series>
      {SEGMENTS.map((segment, i) => (
        <React.Fragment key={i}>
          <Series.Sequence durationInFrames={Math.max(1, sec(SLATE_SEC))}>
            <Slate
              category="Backdrops"
              template={segment.slate.template}
              variant={`${segment.slate.variant} · ${segment.slate.backdrop}`}
            />
          </Series.Sequence>
          <Series.Sequence
            durationInFrames={Math.max(1, sec(segment.durationSec))}
          >
            <AbsoluteFill>
              <SegmentBackdrop backdropId={segment.backdropId} />
              {segment.render()}
            </AbsoluteFill>
          </Series.Sequence>
        </React.Fragment>
      ))}
    </Series>
  );

  // EditorialSurface provides the paper-substrate-and-grain wrapper so the
  // slates still read on the channel's standard register. FilmOverlay adds
  // a uniform grain + vignette across everything (lower intensity than the
  // main showreel because backdrops already carry their own texture).
  const surfaced = (
    <EditorialSurface intensity={0.55}>{series}</EditorialSurface>
  );

  return enableFilmOverlay ? (
    <FilmOverlay effects={["grain", "vignette"]} intensity={filmIntensity}>
      {surfaced}
    </FilmOverlay>
  ) : (
    surfaced
  );
};

// ── Composition registration ───────────────────────────────────────────

export const CatalogShowreelBackdrops = () => (
  <Composition
    id="catalog-showreel-backdrops"
    component={ShowreelBackdrops}
    schema={ShowreelBackdropsSchema}
    defaultProps={{ enableFilmOverlay: true, filmIntensity: 0.35 }}
    durationInFrames={Math.max(1, sec(TOTAL_DURATION_SEC))}
    fps={layout.fps}
    width={layout.width}
    height={layout.height}
  />
);

export const SHOWREEL_BACKDROPS_TOTAL_SECONDS = TOTAL_DURATION_SEC;
export const SHOWREEL_BACKDROPS_SEGMENT_COUNT = SEGMENTS.length;
