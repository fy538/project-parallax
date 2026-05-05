# Catalog

> A living gallery of every Remotion template, with multiple variants of each.
> Lives alongside production episode comps — never tied to a real episode.

## What this is

The `Episodes/` and per-template comps in `Root.tsx` show **production work**: real silicon-trap data, real shot list, render-ready. This `catalog/` folder is the opposite — it's the **toolkit view**, registering 2-4 evergreen demo variants of every template under a `Catalog` folder in Remotion Studio. Open `npm start`, click into `Catalog/` in the sidebar, and you can scrub through every template and every variant the toolkit supports.

There's also a `Showreel` composition (in `catalog/Showreel.tsx`) that sequences every catalog variant back-to-back with title cards between, so you can render one MP4 reel of the entire toolkit.

## When to use the catalog

- **Planning a new episode.** "What templates do I have for this beat?" → open the Maps or Diagrams folder, scrub.
- **Picking variants.** "Does StatReveal handle a percentage delta or do I need a custom comp?" → catalog has every variant.
- **Onboarding.** Show someone the channel's visual library in 5 minutes via the Showreel.
- **Hot-reload work.** Iterating on `StatReveal.tsx`? Open a catalog variant — neutral data, no dependency on episode files.

## Naming convention

Composition IDs use kebab-case with a `catalog-` prefix:

```
catalog-stat-reveal-big-number
catalog-stat-reveal-comparison
catalog-stat-reveal-percentage
```

Studio sidebar folders mirror the production category structure: Maps, Timelines, Data, Typography, Diagrams, Scenarios, Transitions, Cinematic.

## Demo data style

Parallax-themed but episode-neutral: subjects that fit the channel's voice ("The History of Time Zones," "Cartography as Power") but would never become real episodes. Goal: show the template's purpose at a glance, not be confused with production work.

## Adding a new template variant

1. Create a file in `catalog/<Category>/<TemplateName>.tsx` (or add to existing).
2. Export 2-4 `Composition` registrations with `id="catalog-<template>-<variant>"`.
3. Import in `catalog/index.tsx`.
4. Optionally add to `Showreel.tsx` if it's a marquee variant worth demoing in the reel.

Keep variants visually distinct — a third "another bar chart with different numbers" doesn't earn its slot. Each variant should answer a different question of the form "can it do X?"
