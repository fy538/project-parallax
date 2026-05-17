# Script Revision Log — Prisoners' Dilemma

> Required pipeline artifact per `project/PRODUCTION_PIPELINE.md` Stage 6 (script development). Documents the substantive changes between script versions during the human-rewrite checkpoint, so future-Tiger / future-agent / a research-audit can verify *why* the script took the shape it did.

**Episode slug:** prisoners-dilemma
**Format:** Philosopher's Lens
**Arc:** 3 — The Diplomacy of Deception (opener)
**Current version:** v5.9 (May 16, 2026) — render-ready
**Author:** Tiger + Claude (collaborative drafting)
**Log opened:** May 12, 2026 (retroactive)

---

## v1 → v2 (May 2 → May 2, 2026) — initial draft

**State at v1:** First narration-only pass produced by `script-draft` skill from `angle-memo.md` + the three research-pass briefs. ~3,100 words, 5 beats, narration only — no visual specs.

**Why a v2 was needed:** v1 over-explained the historical setup and under-delivered the "wrong game" reframe. The Flood-Dresher experiment got 600+ words in Beat 1; the actual Skyrms/Ostrom turn was buried at the end of Beat 4. Decoder-posture audit (Lens 7) flagged 11 "let me explain to you" lines.

**Substantive changes in v2:**
- Beat 1 cut from ~620w → ~340w. Flood-Dresher experiment compressed; the 60-cooperate/14-defect scoreboard now lands in a single visual cell, not a 4-paragraph narration.
- Beat 3 promoted: "I call this The Wrong Game" moved from mid-Beat-4 to Beat-3 opening. The named concept now lands at the structural inversion point (~40% runtime), per discovery-shape spec.
- Beat 5 prediction reformatted to the 6-layer FORECAST contract (probability + watch signals + falsification + disconfirmer + base rate + reflection trigger).
- 11 decoder-posture violations rewritten (mostly stripping "what you need to understand is" / "the key insight is" introductions).

---

## v2 → v3 (May 3, 2026) — visual-concept revision

**Why v3:** First visual-concept audit (`drafts/visual-concept-v2.md`) found that the v2 visual layer was MG-heavy (~58% Analytical) with almost no Grounding register. The Ostrom moment had no visual anchor; the Beat 5 close was a typography card on a card. Three-register variety was failing.

**Substantive changes in v3:**
- Added Beat 4 ChoroplethMap segment for Ostrom's 800+ documented cases (Valencia, Switzerland, Japan, Maine, +dozens).
- Added Beat 1 Nash portrait `[ARCHIVAL:]` (Wikimedia) to anchor the human element.
- Beat 5 Reagan-Gorbachev moment added (`[ARCHIVAL:]`) — the "it has been done" counterpoint.
- Six MG cells migrated to `[AI-GEN:]` Grounding register (RAND interior, traders' floor, lecture hall, etc.) for atmospheric / grounding presence.
- Visual mode balance recalibrated: MG 46%, AI-GEN 23%, ARCHIVAL 2%, KineticTypography (within MG) reduced to 32% of MG.

---

## v3 → v4 (May 5, 2026) — full pipeline rewrite (DIR: + PACE: annotations)

**Why v4:** v3 was the first version that passed all five audits (script, visual-concept, persona, review-package, claim-verification), but it predated the `DIR:` / `PACE:` annotation system being canonical (per `project/DIRECTING_LANGUAGE.md` and `project/PACING_SYSTEM.md`). Render output would have been a flat sequence of templates with template-default animation — no narration sync, no camera direction, no register-transition cues.

**Substantive changes in v4:**
- Three-register visual layer formalized: Analytical (`[MG:]`) / Atmospheric (`[ILLUST:]`) / Grounding (`[AI-GEN:]`). Six cells reclassified between Atmospheric and Grounding based on editorial role.
- 55 `DIR:` annotations added across 22 segments (46% of compositions directed — slightly above the 25% target; flagged for v5 trim).
- 7 `PACE:` annotations placed at structural shifts: `urgent` at the Beat 1 hook, `breathing` at the Beat 4 reveal, `analytical` defaults elsewhere.
- `sync:` clauses added on 18 reveals for narration-anchored visual events (e.g., `cam(overview → element:0, sync:"single island")`).
- Register-transition `cut()` directives specified at 9 of the 10 boundary moments (analytical→grounding `color-wash`, etc.).
- Pacing density audit: 5 over-directed segments simplified.

---

## v4 → v5 series (May 7–9, 2026) — three substantive technical revisions

### v5.0 → v5.3 (May 7–8, 2026) — visual-spec convergence

- v5.0: Realigned MG cell selections against the family-aware template inventory after `references/template-research/` dossiers landed for game-theory, choropleth-map, motion-design, etc.
- v5.1: DataChart→TimeSeriesChart migration for the Black-Scholes vol-smile moment (Beat 3) — a single static bar chart didn't carry the model-vs-reality time-series the narration described.
- v5.2: Psychology audit (Lens 9) fixes — cold-open 4-beat pattern verified, `[FRAMEWORK UNLOCK]` and `[MAIN REVEAL]` markers added at Beat 3 and Beat 4 headers respectively, anxiety-to-inquiry conversion confirmed before midpoint.
- v5.3: GameBoard→SplitComposition for the PD-vs-staghunt comparison (Beat 4). Adding MG-run breaks (no more than 3 consecutive `[MG:]` cells without a register switch) per `script-audit` Lens 6.

### v5.4 (May 8, 2026) — AI-GEN pipeline restoration

After the May 4 deprecation of the Claude SVG path, `[ILLUST:]` and `[AI-GEN:]` were both nominally pointed at Recraft V3 (`tools/recraft/recraft.py`). v5.4 specified the actual production stack: Recraft → Pika 2.2 image-to-video for all atmospheric/grounding cells. 17 single-shot clips planned. No narration changes.

### v5.5 → v5.6 (May 9, 2026) — `[SCENE:]` block introduction

The May 9 prisoners-dilemma Scene C bakeoff validated chained-still-morph as a first-class production technique (see `project/CHAINED_STILL_LESSONS.md`). v5.5–v5.6 converted two stretches of consecutive `[AI-GEN:]` cells into multi-frame `[SCENE:]` blocks:

- **Beat 3 opening (`[SCENE: wrong-game-establish]`)** — 4 frames over ~30s, ChatGPT + Pika 2.5 chain. Replaces the two scattered `[AI-GEN:]` cells covering "grid landscape → table forms → negotiation room appears." Spec at `scenes/wrong-game-establish.md`.
- **Beat 4 close (`[SCENE: cooperation-arc]`)** — 3 frames over ~26s, ChatGPT + Pika 2.5 chain. The HERO morph of the episode: alpine commons → ocean ("boundedness vanishing"). Restructured Beat 4's ending: existing AI-GEN terraced + AI-GEN ocean cells migrate into the scene block as Frame A and Frame C; new Frame B (aigen-12a alpine commons) bridges them. Spec at `scenes/cooperation-arc.md`.

Narration unchanged from v5.4 across both conversions. Five Beat-4-close cells consolidated to four. The 13 single-shot `[AI-GEN:]` cells outside the two scene blocks remain unchanged. Pacing budget: 2 `[SCENE:]` blocks against the post-May 9 max of 5 ✓.

---

## v5.6 → v5.7 (planned, May 12, 2026) — data-layer pipeline drift polish

Not a script-narration change; a Tier-1 data-layer pass after the May 11–12 pipeline drift audit ([see related decision in this file's git log](../../project/DECISIONS.md) and the third-pass audit report). Narration is unchanged. Changes:

- 4 GameBoard cells migrated from `variant: "payoff-matrix"` → `variant: "pd-canonical"` (motif-beat1, flood-dresher, nuclear, trap-mechanism). Adds T/R/P/S cell labels, best-response arrows, Nash ∴ glyph, hero treatment on (C,C) moral cell and (D,D) analytical cell. `gameboard-staghunt.json` and `gameboard-final-choice.json` deliberately retained as `payoff-matrix` (different editorial intent: stag hunt has two equilibria, final-choice presents both as a meta-question).
- New `gameboard-iterated-play.json` added — Skyrms moment at Beat 4 (line 172) now has a visual proof of "it always was [an equilibrium]" via small-multiples across rounds 1/10/50/200. Inserted as `beat4-seg41b-iterated-play` in the assembly manifest. One script line added at line 173.
- `manifest.filmOverlay: { preset: "documentary", intensity: 0.45 }` activated at the episode top level.
- 11 lon/lat-anchored `MapAnnotations` added to `choropleth-ostrom.json` covering Valencia, Swiss Alps, Japan, Maine across the three phases + a tertiary source attribution.

---

## v5.7 → v5.8 (May 16, 2026) — Beat 2 lineage upgrade (ArcDiagram)

Strategic visual upgrade flagged by the May 16 ambitious-re-strategy audit. Beat 2 segment 14 was previously a single 14s `DataChart` bar count of PD publications across disciplines. The script's actual argument in that segment is *citational lineage* — "Schelling put it in a diplomacy textbook. Biologists imported it. Economists used it." — which is the structural form ArcDiagram exists to render. The bar chart hedged the lineage into a quantity. ArcDiagram commits the lineage as named figures and named jumps.

Changes:

- New `arc-pd-lineage.json` — 8 named figures (Flood & Dresher / Nash / Schelling / Hamilton / Trivers / Maynard Smith / Axelrod & Hamilton / Hofstadter), 9 arcs encoding the disciplinary jumps. Three eras: "RAND origins" (1950), "Disciplinary capture" (1960–1973), "Synthesis & popularization" (1981–1983). Sources verified from `brief.md` Section 2 (Mirowski 2002; Amadae 2016; Poundstone 1992; Axelrod & Hamilton 1981).
- `beat2-seg14` (DataChart, 14s) split into:
  - `beat2-seg14` (ArcDiagram, 8s) — the lineage
  - `beat2-seg14b` (DataChart, 6s) — the "2,000+ articles" numeric punch (chart-diffusion.json `durationSec` shortened 12 → 6)
- Script narration extended to name Hamilton, Axelrod, and Hofstadter explicitly (line 75). Word count +10. Pacing: each new figure name lands as its node settles on the arc.
- `ArcDiagram` registered in three places it was missing from: `TEMPLATE_COMPONENTS` in `FullEpisode.tsx`, `data/assembly-manifest.schema.json` component enum, manifest import.

---

## v5.8 → v5.9 (May 16, 2026) — Beat 4 Ostrom place-anchoring (ProportionalSymbolMap)

Second strategic upgrade from the May 16 ambitious-re-strategy audit. Beat 4 segment 44 previously used `ChoroplethMap` (country fills) for Ostrom's 800+ documented commons. Country fills imply nation-state aggregation — the wrong unit for community-scale Ostromian institutions. ProportionalSymbolMap places a single symbol per named case, sized by years of documented continuous operation, with leader-line annotations to specific cities. The case is the data point; the country is just where it happens to be.

Changes:

- New `proportional-symbol-ostrom.json` — six named commons across four continents: Valencia huertas (750+ yrs, Tribunal de las Aguas since 1273), Swiss Törbel alpine commons (800+ yrs, charter 1224), Japanese iriaichi forests (400+ yrs, Edo period), Maine lobster harbor gangs (140+ yrs, 1880s onward), Filipino zanjeras (400+ yrs, Spanish colonial era), Nepalese pani panchayats (300+ yrs). Three phases mirroring the prior ChoroplethMap structure: Europe close-up (2 cases) → +Japan+Maine global (4 cases) → +Philippines+Nepal comprehensive (6 cases). Symbol AREA encodes years of documented operation — bigger circle = stronger evidence of institutional durability. Sources: Ostrom (1990) *Governing the Commons*; Wade (1988); Acheson (1988).
- `framework-ostrom-vs-pd.json` demoted to *legend* role via new `protagonist: 0` field. The 8-principles diagram now visibly emphasizes the Ostrom side (the thesis) while the PD-assumptions column recedes. Editorially correct — Ostrom IS the protagonist of Beat 4.
- `ProportionalSymbolMap` registered in `TEMPLATE_COMPONENTS` (FullEpisode.tsx) and `assembly-manifest.schema.json` component enum. Was registered in `Root.tsx` for Studio use but missing from the full-episode renderer.
- `beat4-seg44` manifest entry: `ChoroplethMap` / `choropleth-ostrom.json` → `ProportionalSymbolMap` / `proportional-symbol-ostrom.json`. Same 14s duration, same beat positioning.
- Script line 182 updated to reference the new template + named cases. Asset Summary table (line 319) updated.

`choropleth-ostrom.json` retained on disk as a fallback / reference (not deleted), per the existing convention for orphaned-but-valid data files.

Verification: render-still of proportional-symbol-ostrom.json at frame 210 (phase 2 "Across four continents") renders correctly — four amber circles sized by years (Törbel 800 largest, Valencia 750, Japan 400, Maine 140 smallest), leader-line annotations to specific cities, brand chrome, source attribution. All 36 episode-integrity tests pass.

**Queued for next session (requires manual asset sourcing):**

The audit also recommended an `AnnotatedImage` triptych — three real Wikimedia photographs (Valencia huerta channel; Swiss Törbel alpine meadow with stone walls; Maine lobster trap line on a working harbor) each annotated with the Ostrom principle it embodies (clear boundaries / graduated sanctions / collective-choice arrangements). This would convert the Ostrom segment from "academic citation with map visual" to "documentary proof anchored in named places with photographs." Skipped here because it requires manual Wikimedia Commons sourcing of three CC-licensed photos. When sourced: author three new `annotated-image-valencia.json` / `-torbel.json` / `-maine.json` data files; insert as new manifest segments interspersed between beat4-seg44 (the map) and beat4-seg46 (the principles diagram); each ~6s; sequence: map → Valencia photo → Törbel photo → Maine photo → principles diagram (now as legend). Total Beat 4 runtime extension: ~18s. See the May 16 ambitious-re-strategy audit Opportunity #1 for callout design.

---

## Compliance gates closed at v5.7 prep (May 12, 2026)

Per pipeline Stage 10 publishing gates and Stage 7 visual-prod handoff:

- ✓ Oracle prediction registered in `data/predictions-log.json` and `data/concepts.json` (id `us-china-ai-communique-shared-vocab-2026`, probability 30%, December 2026 resolution window).
- ✓ Four new named concepts registered in `data/concepts.json` (`the-wrong-game`, `model-colonization`, `ostromian-cooperation`, `cooperation-residual`). All marked `_status: "draft"` per the published-vs-draft convention.
- ✓ This REVISION_LOG.md.

## Outstanding pre-publish work (not script-revision; tracked here for handoff continuity)

- 3 unverified claims marked `{⚠️}` in v5.6 — Black-Scholes MacKenzie source citation (Beat 3 line 132), Reagan-Gorbachev "never cooperated strategically" framing (Beat 5 line 227), NPT Review Conference timing (Beat 5 line 213). Need backstage verification before narration recording.
- Asset generation: 12 new AI-GEN single-shot stills + 15 Kling/Hailuo morph clips (with the HERO alpine→ocean morph as the priority shot) + 3 Wikimedia archival stills (Nash, RAND HQ, Reagan-Gorbachev). See `NEXT_SESSION_HANDOFF.md` for the latest production state.
- Narration recording (~25 min human time) — unblocks Whisper-sync from `mode: estimate` to `mode: precise`.
- Render QA / visual QA reports (no full straight-through render yet watched).
