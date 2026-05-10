/**
 * EditorialTest compositions — Remotion Studio registrations.
 *
 * Three compositions demonstrating the EditorialFrame + EditorialSurface system:
 *   EditorialFrameHeroTest   — hero variant, prisoner's dilemma cooperation data
 *   EditorialFrameAsideTest  — aside variant, defection rate data
 *   EditorialFrameMinimalTest — minimal variant (passthrough + ∴ mark)
 */

import { Composition } from "remotion";
import { layout, sec } from "../../design/theme";
import { EditorialFrameHeroTest } from "./EditorialFrameHeroTest";
import { EditorialFrameHeroFlippedTest } from "./EditorialFrameHeroFlippedTest";
import { EditorialFrameAsideTest, EditorialFrameMinimalTest } from "./EditorialFrameVariantsTest";

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
