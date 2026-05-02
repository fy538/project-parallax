# Transition Design Rules

> Cross-clip pacing for Parallax episodes. Applied automatically by `generate_manifest.py` and consumed by `FullEpisode.tsx` via the `FadeWrapper` component.

## Rules

**Rule 1 — Beat Boundaries → Dissolve (0.5s)**
When consecutive segments belong to different beats, use dissolve to signal a structural shift. Viewers unconsciously register beat changes through the visual rhythm.

**Rule 2 — Title Cards → Fade (0.6s)**
TitleTransition segments (section headers, episode title) always fade in and out. They're structural punctuation — a hard cut to a title card feels jarring. The *preceding* segment also gets `out: "fade"` so the two match.

**Rule 3 — Within a Beat → Cut**
Default. Analytical content moves fast; dissolves within the same argument slow things down.

**Rule 4 — Template → Template → Dissolve (0.3s)**
When two foreground templates follow each other within the same beat, a brief dissolve prevents the visual from feeling like a slideshow.

**Rule 5 — Hold Segments → No Transition**
HOLD sustains the previous visual (dramatic pause, let-it-land moment). Fading a hold defeats its purpose.

**Rule 6 — End Card → Fade (0.8s)**
The final segment (end card) gets a longer fade-in for cinematic close.

## FadeWrapper Enhancement

Dissolve transitions include a subtle scale shift for depth:
- **Dissolve in**: 1.02× → 1.0× (approaching)
- **Dissolve out**: 1.0× → 0.98× (receding)

Fade transitions are pure opacity (no scale).

## Where This Lives

- **Rules applied by**: `tools/assembly/generate_manifest.py` → `apply_default_transitions()`
- **Rendered by**: `src/templates/Episodes/FullEpisode.tsx` → `FadeWrapper`
- **Override**: Any segment can override auto-assigned transitions via the `transition` field in the assembly manifest
