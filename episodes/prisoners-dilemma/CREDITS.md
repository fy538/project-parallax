# Prisoners' Dilemma — Asset Credits

> Required attribution for Creative Commons-licensed assets used in this
> episode. The CC BY-SA licenses obligate us to (a) credit the photographer,
> (b) link the license, (c) note any modifications, and (d) license any
> derivative under the same terms. This file is the authoritative record;
> on-screen credits during the close-card sequence cite each photographer
> by name.

## Wikimedia Commons photographs — Beat 4 Ostrom triptych

### 1. Valencia · Tribunal de las Aguas
- **File:** `episodes/prisoners-dilemma/assets/stills-ostrom-triptych/valencia-tribunal.jpg`
- **Public-bundle:** `remotion-templates/public/episodes/prisoners-dilemma/stills/valencia-tribunal.jpg`
- **Source:** [The_Tribunal_de_las_Aguas_of_Valencia.jpg](https://commons.wikimedia.org/wiki/File:The_Tribunal_de_las_Aguas_of_Valencia.jpg)
- **Photographer:** José Jordan
- **Original credit:** José Jordan / UNESCO
- **License:** [CC BY-SA 3.0 IGO](https://creativecommons.org/licenses/by-sa/3.0/igo/deed.en)
- **Modifications applied:** Resized to 1920×1279 px (lossy JPEG, q88). Duotone treatment (ink → umber → gold) applied at render time via `BrandImage` SVG filter (not baked into the file on disk — the file in `public/` is the un-treated original).
- **Used in:** `data/episodes/prisoners-dilemma/annotated-image-valencia.json`, Beat 4 segment `beat4-seg44b-valencia`.

### 2. Törbel · Alpine Commons
- **File:** `episodes/prisoners-dilemma/assets/stills-ostrom-triptych/torbel-alps.jpg`
- **Public-bundle:** `remotion-templates/public/episodes/prisoners-dilemma/stills/torbel-alps.jpg`
- **Source:** [Törbel_(unten)_und_die_Berner_Alpen.jpg](https://commons.wikimedia.org/wiki/File:T%C3%B6rbel_(unten)_und_die_Berner_Alpen.jpg)
- **Photographer:** Daniel Reust
- **License:** [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/deed.en)
- **Modifications applied:** Resized to 1920×1080 px (lossy JPEG, q88). Duotone treatment applied at render time.
- **Used in:** `data/episodes/prisoners-dilemma/annotated-image-torbel.json`, Beat 4 segment `beat4-seg44c-torbel`.

### 3. Maine · Lobster Harbor Gangs
- **File:** `episodes/prisoners-dilemma/assets/stills-ostrom-triptych/maine-buoys.jpg`
- **Public-bundle:** `remotion-templates/public/episodes/prisoners-dilemma/stills/maine-buoys.jpg`
- **Source:** [Lobster-Trap-Buoys_Kennebunkport_Maine_USA.jpg](https://commons.wikimedia.org/wiki/File:Lobster-Trap-Buoys_Kennebunkport_Maine_USA.jpg)
- **Photographer:** Marc-Lautenbacher
- **License:** [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/deed.en)
- **Modifications applied:** Resized to 1920×1280 px (lossy JPEG, q88). Duotone treatment applied at render time.
- **Used in:** `data/episodes/prisoners-dilemma/annotated-image-maine.json`, Beat 4 segment `beat4-seg44d-maine`.

## Closing-card on-screen credits (to be rendered)

The Parallax close-card template (`TitleTransition`, `mode: "end-card"`) needs to surface these three photo credits during the closing credits beat. Recommended line:

```
Photography credits:
  Valencia Water Tribunal — José Jordan / UNESCO (CC BY-SA 3.0 IGO)
  Törbel alpine vista — Daniel Reust (CC BY-SA 4.0)
  Maine lobster buoys — Marc-Lautenbacher (CC BY-SA 4.0)
  All via Wikimedia Commons. Derivatives licensed CC BY-SA 4.0.
```

When the closing TitleTransition is built (currently `title-end-card.json`), inject these lines as a `caption` block. The CC BY-SA share-alike clause means the episode itself (or at least the segments containing these photos) inherits CC BY-SA 4.0 licensing, which is compatible with YouTube distribution but worth documenting if the episode is ever republished.

## Wikimedia entries pending sourcing (Beat 1, Beat 2, Beat 5)

These three archival stills still need Wikimedia sourcing — listed here for parallel tracking:

- **Beat 1 (beat1-seg08):** John Nash portrait (~1950, Princeton). Search `Category:John_Forbes_Nash`.
- **Beat 2 (beat2-seg16):** RAND Corporation HQ exterior, Santa Monica, 1950s. Search `Category:RAND_Corporation`.
- **Beat 5 (beat5-seg57):** Reagan-Gorbachev summit, Reykjavik 1986 or Washington 1987. Search `Category:Reagan-Gorbachev_summits`.

When sourced, add entries to this file, update the manifest segments (currently `source: "wikimedia-commons"` with `file: null`), and add credit lines to the closing-card recommendation above.
