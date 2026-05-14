/**
 * Catalog — TemplatePreview.
 *
 * A generic single-template preview that takes `templateId` + `emphasis`
 * as inputProps and renders the named template inside an
 * EpisodeColorEmphasisProvider with the given emphasis. The script
 * scripts/render-emphasis-contact-sheet.mjs invokes this composition
 * once per (template × emphasis) pair to build the per-template
 * emphasis contact sheet — so QA can see how every meaningful template
 * looks under every emphasis without rendering full episodes.
 *
 * Why a single dynamic comp instead of N×6 hand-registered comps:
 *   - Hand-registering would mean 5 templates × 6 emphases = 30
 *     compositions in Root.tsx — noise for what's a QA tool, not
 *     production work.
 *   - inputProps-driven means the script can sweep new emphases or
 *     additional templates without touching the catalog scaffolding.
 *
 * Data fixtures: pulled from the existing catalog data exports
 * (catalogDataData, catalogDiagramsData, etc.) so the preview matches
 * what's already in the catalog comps. No duplicate fixtures to maintain.
 */

import React from "react";
import { Composition, AbsoluteFill } from "remotion";
import { z } from "zod";

import { layout, sec, EMPHASIS_VALUES, type EpisodeColorEmphasis } from "../design/theme";
import {
  EpisodeColorEmphasisProvider,
} from "../hooks/useEpisodeColorEmphasis";

import { DataChart } from "../templates/DataChart/DataChart";
import { FrameworkDiagram } from "../templates/FrameworkDiagram/FrameworkDiagram";
import { StatReveal } from "../templates/StatReveal/StatReveal";
import { TitleTransition } from "../templates/TitleTransition/TitleTransition";
import { AtlasPlate } from "../templates/AtlasPlate/AtlasPlate";

import { catalogDataData } from "./Data";
import { catalogDiagramsData } from "./Diagrams";
import { catalogTitlesData } from "./Titles";
import { catalogMapsData } from "./Maps";

import { catalogId } from "./helpers";

// ── Template registry ───────────────────────────────────────────────────────
//
// The contact sheet covers 5 representative templates that span the visual
// spectrum: a chart (DataChart), a framework comparison (FrameworkDiagram),
// a hero stat (StatReveal), a title card (TitleTransition), and a map
// (AtlasPlate — migrated from ChoroplethMap May 13, 2026 per the
// Mapbox→AtlasPlate doctrine; see MAP_TEMPLATE_SELECTOR.md). Adding more
// templates here makes them available to the contact-sheet script
// automatically.

interface PreviewEntry {
  // Loose typing — each template has its own data shape and the union
  // would be unwieldy here. The script always passes data matching the
  // template; the runtime guard at render time catches mismatches.
  Component: React.ComponentType<{ data: any }>;
  data: any;
}

const PREVIEW_REGISTRY: Record<string, PreviewEntry> = {
  DataChart: {
    Component: DataChart,
    data: catalogDataData.chartMountains,
  },
  FrameworkDiagram: {
    Component: FrameworkDiagram,
    data: catalogDiagramsData.fwComparison,
  },
  StatReveal: {
    Component: StatReveal,
    data: catalogDataData.statApollo,
  },
  TitleTransition: {
    Component: TitleTransition,
    data: catalogTitlesData.titleEpisode,
  },
  AtlasPlate: {
    Component: AtlasPlate,
    data: catalogMapsData.atlasG7,
  },
};

/** Exposed for the contact-sheet script — keeps the source list canonical. */
export const PREVIEW_TEMPLATES = Object.keys(PREVIEW_REGISTRY);

// ── Component ───────────────────────────────────────────────────────────────

const TemplatePreviewSchema = z.object({
  templateId: z.string(),
  // z enum from the canonical EMPHASIS_VALUES tuple. Keeps the inputProps
  // contract aligned with the rest of the codebase.
  emphasis: z.enum(EMPHASIS_VALUES as readonly [string, ...string[]]),
});

// Use z.infer so Composition's inputProps shape matches exactly. Casting
// emphasis to the canonical EpisodeColorEmphasis happens inside the
// component (the schema enum already constrains the values).
type TemplatePreviewProps = z.infer<typeof TemplatePreviewSchema>;

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  templateId,
  emphasis,
}) => {
  const entry = PREVIEW_REGISTRY[templateId];
  if (!entry) {
    return (
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1C1814",
          color: "#E5A544",
          fontFamily: "IBM Plex Mono, monospace",
          fontSize: 24,
        }}
      >
        ⚠️ Unknown templateId: {templateId}
      </AbsoluteFill>
    );
  }

  const { Component, data } = entry;
  return (
    <EpisodeColorEmphasisProvider value={emphasis as EpisodeColorEmphasis}>
      <Component data={data} />
    </EpisodeColorEmphasisProvider>
  );
};

// ── Composition entry ───────────────────────────────────────────────────────

const PREVIEW_DURATION_SEC = 4;

export const CatalogTemplatePreview = () => (
  <Composition
    id={catalogId("TemplatePreview", "emphasis-grid")}
    component={TemplatePreview}
    schema={TemplatePreviewSchema}
    durationInFrames={Math.round(PREVIEW_DURATION_SEC * layout.fps)}
    fps={layout.fps}
    width={layout.width}
    height={layout.height}
    defaultProps={{
      templateId: PREVIEW_TEMPLATES[0],
      emphasis: "neutral",
    }}
  />
);
