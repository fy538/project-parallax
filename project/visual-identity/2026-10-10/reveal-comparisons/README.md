# Parallax surreal reveal comparisons

October 10, 2026

[Interactive gallery](index.html) · [Watch the motion study](opening-panel-motion.mp4) · [Exact prompts and references](studies.json) · [All identity directions](../all-directions.md)

The opening panel is the leading candidate in this round. Turning the window-wall into a thin painted page makes the spatial contradiction clearer than the previous cutaway. The three comparisons share the same original shop encounter and explore how a wider view introduces the surrounding social setting.

## Three before and after pairs

![Three comparisons with the identical starting shop encounter above each wider endpoint](comparison-overview.png)

| Version | Operation | Assessment | Full endpoint |
| --- | --- | --- | --- |
| A · Opening panel | The window-wall folds like a painted page | Most explicit material change; selected for the first authored motion study | [Folded page](a-opening-panel-two-coins.png) |
| B · Continuous surface | One broad counter edge becomes the paving beneath the neighbors | Strong connection to the street, with a possible raised-walkway reading | [Counter and street](b-continuous-surface.png) |
| C · Ordinary wider view | The existing architectural cutaway reveals the street | Clear context with a largely ordinary spatial reading | [Retained cutaway](c-pullback.png) |

The [common starting image](before.png) is an unmodified copy of the selected shop transaction. A and B use that image and C as references. Their endpoints closely match the wider composition, with small generated drawing differences. This is an art-direction comparison, not a pixel-identical change of a single variable.

Both foreground faces retain asymmetric painted planes without literal facial parts. The neighbors face away. Bread and coins remain within the painted medium. An extra coin-like disk in A's first attempt was corrected; that attempt is retained with its prompt.

## Fourteen second motion study

[Watch the silent 1080p MP4](opening-panel-motion.mp4) · [Play or scrub the authored source](motion.html)

![Keyframes from the opening-panel motion study](motion-contact-sheet.png)

| Time | Action |
| --- | --- |
| 0–2 seconds | Hold on the transaction |
| 2–6 seconds | Pull back as the painted window-wall opens |
| 6–8 seconds | Hold on the wider social setting |
| 8–8.5 seconds | Brief dip through ink |
| 8.5–14 seconds | Reveal the shopkeeper, customers, neighbors and competitor in the diagram, then hold |

The animation uses a reconstructed [backing plate](motion-background.png), a [transparent window-wall](motion-page.png) and a [transparent foreground](motion-foreground.png). The figures and transaction hold while the camera and page move. This tests authored composition, occlusion and timing; character movement and AI image-to-video stability remain to be tested.

The local proof approximates A with a hinged plane and a plain painted reverse side. It does not reproduce every diagonal crease in the still. The layers are separately generated close matches rather than an exact segmentation of the original.

The reveal adds information about the shop's surroundings. It supplies no access to the shopkeeper's motive, and the diagram's connections supply no automatic trust verdict.

## Review focus

Check whether the page movement is understandable without its description, whether attention stays on the transaction before shifting to the street, and whether the diagram feels like a continuation of the same visual language. If the page reads as a door, the next refinement should strengthen the fold and material change. If it attracts more attention than the argument, reduce its scale or duration.

## Files and verification

Painted edits and layers use the built-in image tool. [studies.json](studies.json) preserves every exact prompt, input role, retained attempt and selection. The tool does not expose its model version or seed.

Motion is authored in HTML/Canvas/SVG. Playwright exports each frame directly from the canvas, then ffmpeg encodes the MP4. A projected mesh turns the painted page; the generated layer files are unchanged. [motion-canvas.js](motion-canvas.js) defines the native frame renderer; [record-motion.cjs](record-motion.cjs) exports the MP4; [render-study.cjs](render-study.cjs) recreates the still previews. The palette stylesheet is generated from the canonical [palette.json](../../../../tools/brand-treatment/palette.json). This preview uses Arial as a fallback for intended Plex typography.

[Gallery checks](preview-checks.json) cover all six comparison panels, image loading, enlargement and desktop/mobile overflow. [Video checks](video-checks.json) record dimensions, duration, frame count, color tags and measured changes between decoded MP4 keyframes. The [render log](../../../../episodes/ai-care-motives/render-logs/20261010T200000-identity-opening-panel-canvas.log) records this export. Its automatic episode-duration comparison expects the full 678.6-second episode; the separate [clip postflight](../../../../episodes/ai-care-motives/render-logs/20261010T200237-identity-opening-panel-verified.log) passes, and the frame exporter verifies the study's own 14-second duration.
