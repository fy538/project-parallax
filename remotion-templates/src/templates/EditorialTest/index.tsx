/**
 * EditorialTest compositions — Remotion Studio registrations.
 *
 * Compositions demonstrating the EditorialFrame + EditorialSurface system:
 *   EditorialFrameHeroTest      — hero variant, light mode, cartographic backdrop
 *   EditorialFrameHeroDarkTest  — hero variant, dark mode, night-grid backdrop
 *   EditorialFrameHeroFlippedTest — flipped hero, reading-room backdrop
 *   EditorialFrameAsideTest     — aside variant, defection rate data
 *   EditorialFrameMinimalTest   — minimal variant (passthrough + ∴ mark)
 */

import { Composition } from "remotion";
import { layout, sec } from "../../design/theme";
import { EditorialFrameHeroTest } from "./EditorialFrameHeroTest";
import { EditorialFrameHeroDarkTest } from "./EditorialFrameHeroDarkTest";
import { EditorialFrameHeroFlippedTest } from "./EditorialFrameHeroFlippedTest";
import { EditorialFrameAsideTest, EditorialFrameMinimalTest } from "./EditorialFrameVariantsTest";
import { BACKDROP_MANIFEST } from "../../components/EditorialSurface";
import { ForegroundBackdropFoundation } from "./ForegroundBackdropFoundation";

export const EditorialFrameHeroTestComposition = () => (
  <Composition
    id="EditorialFrameHeroTest"
    component={EditorialFrameHeroTest}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(14)}
    defaultProps={{}}
  />
);

export const EditorialFrameHeroDarkTestComposition = () => (
  <Composition
    id="EditorialFrameHeroDarkTest"
    component={EditorialFrameHeroDarkTest}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(14)}
    defaultProps={{}}
  />
);

export const EditorialFrameHeroFlippedTestComposition = () => (
  <Composition
    id="EditorialFrameHeroFlippedTest"
    component={EditorialFrameHeroFlippedTest}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(14)}
    defaultProps={{}}
  />
);

export const EditorialFrameAsideTestComposition = () => (
  <Composition
    id="EditorialFrameAsideTest"
    component={EditorialFrameAsideTest}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(10)}
    defaultProps={{}}
  />
);

export const EditorialFrameMinimalTestComposition = () => (
  <Composition
    id="EditorialFrameMinimalTest"
    component={EditorialFrameMinimalTest}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(10)}
    defaultProps={{}}
  />
);

/**
 * One composition per backdrop id (fixed defaultProps).
 * The parametrized `ForegroundBackdropFoundation` composition lives inline in Root.tsx
 * so Studio 💾 Save to code can find defaultProps.
 */
export const ForegroundBackdropShortcutCompositions = () => (
  <>
    {BACKDROP_MANIFEST.map((b) => (
      <Composition
        key={b.id}
        id={`ForegroundBackdrop-${b.id}`}
        component={ForegroundBackdropFoundation}
        width={layout.width}
        height={layout.height}
        fps={layout.fps}
        durationInFrames={sec(12)}
        defaultProps={{ backdropId: b.id }}
      />
    ))}
  </>
);
