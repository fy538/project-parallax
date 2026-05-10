/**
 * Catalog — Cinematic category.
 *
 * ImageComposite × 1, PhotoMontage × 1, AnnotatedImage × 1.
 *
 * All three demos use public/assets/sample-historical.png as a placeholder so
 * polish can be evaluated before episode-specific photography is sourced.
 * The point is to verify treatment pipeline / callout layout / text overlays —
 * not the historical specificity of the imagery.
 */

import { Composition } from "remotion";
import { ImageComposite } from "../templates/ImageComposite/ImageComposite";
import type { ImageCompositeData } from "../templates/ImageComposite/types";
import { PhotoMontage } from "../templates/PhotoMontage/PhotoMontage";
import type { PhotoMontageData } from "../templates/PhotoMontage/types";
import { AnnotatedImage } from "../templates/AnnotatedImage/AnnotatedImage";
import type { AnnotatedImageData } from "../templates/AnnotatedImage/types";
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

const PLACEHOLDER_IMAGE = "assets/sample-historical.png";

// ─── ImageComposite × 1 ───────────────────────────────────────────────────

const compositeArchive: ImageCompositeData = {
  episode: CATALOG_EPISODE,
  imagePath: PLACEHOLDER_IMAGE,
  variant: "background",
  duotone: "editorial",
  textPosition: "bottom-left",
  title: "The archive remembers what the present forgets",
  subtitle: "Reference image — duotone editorial treatment",
  source: "Catalog placeholder",
  durationSec: 8,
};

// ─── PhotoMontage × 1 ─────────────────────────────────────────────────────

// Same source image cycled with three different treatments — diagnostic
// for the duotone pipeline more than for editorial variety.
const montageTreatments: PhotoMontageData = {
  episode: CATALOG_EPISODE,
  title: "Three Treatments, One Frame",
  subtitle: "duotone pipeline check",
  transition: "dissolve",
  transitionDurationSec: 0.4,
  durationSec: 12,
  images: [
    {
      src: PLACEHOLDER_IMAGE,
      durationSec: 4,
      treatment: "standard",
      compositeMode: "background",
      kenBurns: true,
      overlay: { text: "STANDARD", position: "bottom-left", style: "label" },
    },
    {
      src: PLACEHOLDER_IMAGE,
      durationSec: 4,
      treatment: "conflict",
      compositeMode: "background",
      kenBurns: true,
      overlay: { text: "CONFLICT", position: "bottom-left", style: "label" },
    },
    {
      src: PLACEHOLDER_IMAGE,
      durationSec: 4,
      treatment: "editorial",
      compositeMode: "background",
      kenBurns: true,
      overlay: { text: "EDITORIAL", position: "bottom-left", style: "label" },
    },
  ],
  source: "Catalog placeholder",
};

// ─── AnnotatedImage × 1 ───────────────────────────────────────────────────

const annotatedDemo: AnnotatedImageData = {
  episode: CATALOG_EPISODE,
  imageSrc: PLACEHOLDER_IMAGE,
  title: "Reading a frame",
  subtitle: "callout layout, leader lines, sequential reveal",
  duotoneRamp: "editorial",
  durationSec: 12,
  callouts: [
    { x: 22, y: 30, label: "Subject", detail: "Primary focal element", placement: "right" },
    { x: 70, y: 28, label: "Counterpoint", detail: "Secondary frame anchor", placement: "left" },
    { x: 35, y: 70, label: "Foreground", detail: "Spatial cue, depth", placement: "top" },
    { x: 78, y: 65, label: "Texture", detail: "Material, period", placement: "left" },
  ],
  source: "Catalog placeholder",
};

// ─── Composition registrations ────────────────────────────────────────────

const imageCompositeComp = (id: string, data: ImageCompositeData) => (
  <Composition
    id={id}
    component={ImageComposite}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as ImageCompositeData).durationSec || 8),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogImageArchive = () =>
  imageCompositeComp(catalogId("ImageComposite", "archive"), compositeArchive);

const photoMontageComp = (id: string, data: PhotoMontageData) => (
  <Composition
    id={id}
    component={PhotoMontage}
    calculateMetadata={({ props }) => {
      const d = props.data as PhotoMontageData;
      const computed = d.images.reduce((sum, img) => sum + img.durationSec, 0);
      return {
        durationInFrames: sec(d.durationSec ?? computed),
        fps: layout.fps,
        width: layout.width,
        height: layout.height,
      };
    }}
    defaultProps={{ data }}
  />
);

export const CatalogMontageTreatments = () =>
  photoMontageComp(catalogId("PhotoMontage", "treatments"), montageTreatments);

const annotatedImageComp = (id: string, data: AnnotatedImageData) => (
  <Composition
    id={id}
    component={AnnotatedImage}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as AnnotatedImageData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogAnnotatedDemo = () =>
  annotatedImageComp(catalogId("AnnotatedImage", "callout-demo"), annotatedDemo);

export const catalogCinematicData = {
  compositeArchive, montageTreatments, annotatedDemo,
};
