# Parallax character and episode studies

October 10, 2026

[Open the interactive gallery](index.html) · [All identity directions](../all-directions.md) · [Exact prompts and retained attempts](studies.json)

[Follow-up reveal comparisons and motion study](../reveal-comparisons/README.md) develop the unresolved spatial reveal into three before-and-after pairs and a locally authored opening-panel animation.

This round develops the liked faceted desk figure into five head views, three acting poses and a six-frame episode board. The board samples [script v1.7](../../../../episodes/ai-care-motives/script.md) across several beats; it is an identity experiment rather than a consecutive sequence or a replacement for the production visual spec.

## Character views

![Five head views with rich asymmetric painted planes and no facial parts](01-head-turnaround.png)

Front, three-quarter, a more side-on view, looking up and looking down. Hair, long neck and ink crew-neck clothing provide the main identity anchors. The top-right view still needs a stricter 90-degree profile before this becomes a production turnaround.

All visible faces use painted volume without eyes, eyebrows, eye sockets, nose, mouth or lips. Plain outer ear silhouettes may remain.

## Acting through the body

![Three poses of the same featureless character](02-acting-strip.png)

Left to right, the intended readings are listening, hesitation and determination. Lean, shoulder position and the interval between hand and torso carry the difference. These are proposed readings; their clarity needs a viewer check without captions.

## Six-frame episode board

![Six-frame board showing the shop, two interpretations, surrounding street, analytical diagram, empty street and daylight desk](storyboard-overview.png)

| Frame | Narration context | Full-size image |
| --- | --- | --- |
| 1 · Ordinary help | Beat 2: usual price and correct change | [Shop encounter](03-shop-transaction.png) |
| 2 · Two accounts | Beat 2: duty and prudence interpret identical behavior | [Typeset comparison](board-02-two-accounts.png) |
| 3 · The surrounding street | Beat 4: other people change the context of the transaction | [Spatial reveal](04-street-reveal.png) |
| 4 · A fact about his street | Beat 4: customers, neighbors and a competitor | [Analytical graphic](board-04-street-diagram.png) |
| 5 · Watching removed | Beat 5: ask what happens when assessment seems absent | [Empty-street comparison](05-unwatched-window.png) |
| 6 · Return to the viewer | Beat 8: ask what supports a reassuring judgment | [Contemporary daylight desk](06-desk-daylight.png) |

Frame 2 repeats the exact same selected PNG in both panels. Frame 5 is a generated edit that closely matches the original foreground; it is not pixel-identical. Its empty street poses a question and supplies no dishonest or trustworthy outcome. Frame 4's lines show the surrounding social setting, not evidence of a hidden motive.

## Art-direction assessment

The heads and clothing suggest the same person across the sheet, acting strip and scenes. The bread remains painted, and the daylight desk supplies useful range beyond amber night interiors. The native graphic frames connect the geometry to a readable analytical register.

The street reveal is the weakest part of the surreal experiment: it reads chiefly as an architectural cutaway. A more explicit before-and-after panel design should establish the impossible change. Some shop surfaces also remain too uniformly textured; the daylight wall's quieter treatment is the stronger direction. Distinctiveness and performance under movement remain to be tested.

## Files and method

Painted images were generated and edited with the built-in image tool. The tool does not expose a model version or seed. All exact prompts, local reference roles, selected images and superseded attempts are recorded in [studies.json](studies.json).

The comparison is authored in [HTML](two-accounts.html), and the diagram in [SVG](street-diagram.svg), using the canonical palette from [palette.json](../../../../tools/brand-treatment/palette.json). Both were rendered locally with Playwright. This preview uses Arial as a fallback for the intended IBM Plex typography.

[Preview checks](preview-checks.json) confirm six board frames, eight loaded gallery images, functioning image enlargement and no horizontal overflow at desktop or mobile widths. [render-preview.cjs](render-preview.cjs) recreates the graphic PNGs and board preview using an installed Chromium headless shell.
