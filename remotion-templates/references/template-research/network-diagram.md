# Template Research Dossier — NetworkDiagram

> **Status: stub.** This dossier currently captures only the known failure modes from stress testing. Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale, recommended Parallax defaults) is still TODO. See `_FORMAT.md` for the target structure.

## Failure mode flags

> **Safe-count range (NetworkDiagram hub-spoke, May 2026 stress-test):** 4–7 spokes at typical label length (≤ 25 chars per node, optional ≤ 30-char sublabel). Above 7 spokes OR with long labels (60+ chars), node CIRCLES still place cleanly on the radial layout (uniform angular spacing scales arbitrarily), but the LABELS at 3-o'clock and 9-o'clock positions collide with adjacent spokes and the hub stat reads through them. The stress build (12 spokes × 60-char labels) showed two failure layers: (i) horizontal-axis labels overlap each other end-to-end at radii smaller than the longest label, and (ii) the hub's `stat` callout ("92% of advanced-node chips") gets crossed through by the 3-o'clock and 9-o'clock spoke labels.
>
> The form's editorial argument *is* the spoke count — "every leading-edge designer goes through TSMC" reads at 5–6 spokes; above that the visual collapses into "many entities in a circle" with no protagonist legibility. If an episode needs to enumerate ≥ 8 dependent entities, route to a Sankey (where width carries volume) or to a tabular DataChart variant rather than fighting the radial-label layout.

---

*(Future sections — editorial purpose, canonical idioms, treatment conventions, recommendation for Parallax, current template alignment, specific upgrades — to be written when the template gets full polish work.)*
