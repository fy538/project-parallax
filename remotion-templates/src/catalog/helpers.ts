/**
 * Catalog helpers — shared utilities for registering demo Composition entries.
 *
 * Catalog comps follow a strict convention:
 *   - id = `catalog-<template-kebab>-<variant-kebab>`
 *   - Same calculateMetadata behavior as the production comp
 *   - Demo data is Parallax-themed but episode-neutral (never silicon-trap)
 *   - episode field on data uses "catalog" as a sentinel value
 *
 * If the production comp uses calculateMetadata to derive duration from
 * data.durationSec or data.phases, the catalog comp must do the same.
 */

// Empty string so the metadata strip's "episode" slot stays blank rather than
// repeating "CATALOG" both top-right and bottom-left of every demo.
// Schema requires `episode: z.string()` — empty string passes validation.
export const CATALOG_EPISODE = "" as const;

/**
 * Build a catalog composition id from a template name and variant slug.
 *
 * @example
 *   catalogId("StatReveal", "big-number") → "catalog-stat-reveal-big-number"
 */
export function catalogId(template: string, variant: string): string {
  const templateKebab = template
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  return `catalog-${templateKebab}-${variant}`;
}
