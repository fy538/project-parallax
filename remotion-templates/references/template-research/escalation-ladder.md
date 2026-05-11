# Template Research Dossier — EscalationLadder

> **Status: stub.** This dossier currently captures only the known failure modes from stress testing. Full canonical-idioms research (RAND nuclear-escalation ladder lineage, Kahn's 44-rung original, Reuters/Economist crisis-escalation visualizations, perceptual rationale, recommended Parallax defaults) is still TODO. See `_FORMAT.md` for the target structure.

## Failure mode flags

> **Safe-count range (EscalationLadder, May 2026 stress-test):** 5–7 rungs at typical label length (≤ 32-char rung label, ≤ 60-char detail). Above 7 rungs OR with long detail text wrapping to 2 lines, trailing rungs are silently clipped by the safe-area bottom — the rendered ladder shows only the top N rungs that fit, with no scroll, no pagination, no ellipsis, and no visual indication that more rungs exist below. The stress build (12 rungs spanning 1945–1991) showed only rungs 1–7 (Hiroshima → Bay of Pigs); the most editorially loaded entries (Cuban Missile Crisis, Able Archer 83, START I) vanished below the safe area.
>
> This is the same `overflow: hidden` failure pattern documented for `DecisionTree.LadderVariant` in `game-theory.md` § A2 — both templates use a vertical-stack container with a fixed top offset and no overflow handling. Kahn's original nuclear-escalation ladder had 44 rungs, but it was a textual schema, not a one-frame visualization; video-register canon (RAND, Reuters, Economist crisis briefings) converges on 5–7 rungs because that's what reads at scrubbing speed without forcing the viewer to pause.
>
> If an episode needs to enumerate ≥ 8 rungs, either (i) split across two ladder slides on a `SplitComposition` with a shared severity axis, (ii) collapse adjacent rungs into composite phases ("1945–55: monopoly broken" rather than four separate events), or (iii) switch form to `HorizontalTimeline` where horizontal layout absorbs more entries.

---

*(Future sections — editorial purpose, canonical idioms, treatment conventions, recommendation for Parallax, current template alignment, specific upgrades — to be written when the template gets full polish work.)*
