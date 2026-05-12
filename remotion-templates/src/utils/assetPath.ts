/**
 * Asset-path utilities shared across image-bearing templates.
 *
 * Used by `ImageComposite`, `PhotoMontage`, `AnnotatedImage`, and any
 * other template that receives a user-provided image URL (relative or
 * absolute) and feeds it into Remotion's `<Img>` element.
 */

import { staticFile } from "remotion";

/**
 * Resolve an image src to a render-safe URL for Remotion `<Img>`.
 *
 * - `http://` / `https://` paths pass through as-is (Remotion handles them natively).
 * - All other paths (relative, e.g. `assets/sample.png`) are wrapped with
 *   `staticFile()` to resolve from `public/`.
 *
 * Without this guard, passing an absolute URL to `staticFile()` throws a
 * TypeError synchronously, and passing a relative path raw to `<Img>` 404s
 * at render time on the Remotion bundle's webserver. Catalog comps and
 * episode data files use relative paths for portability, so every consumer
 * that accepts user-supplied image paths should route them through this
 * helper.
 */
export const resolveAssetSrc = (src: string): string =>
  src.startsWith("http://") || src.startsWith("https://")
    ? src
    : staticFile(src);
