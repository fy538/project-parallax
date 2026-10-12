# Lens 6 — Visual Layer Quality

Loaded on demand from `SKILL.md`. Run this lens only when the stub there says to.

### Lens 6: Visual Layer Quality

This lens applies only to two-column production scripts (with a right-column visual layer). If the script is narration-only, skip this lens entirely.

The visual layer has its own editorial logic, documented in `project/VISUAL_LANGUAGE.md` and `project/FOOTAGE_SOURCING.md`. This lens checks whether the script follows that logic. Read those docs if you haven't already.

**Visual mode balance.** Count all mode tags (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`, `[SCENE:]`, `[ARCHIVAL:]`) across the full script. Calculate approximate screen time percentages. Check against target ranges:
- MG: 40-55% (analytical video essays are naturally MG-dominant; if above 60%, it's a slideshow)
- FOOTAGE: 25-40% (if below 25%, the analysis feels disconnected from reality)
- ILLUST: 5-15% (atmospheric illustrations for emotional texture; if 0% in a 10+ min episode, flag as opportunity)
- AI-GEN: 5-15% (photorealistic grounding; if above 15%, too expensive and fatiguing)
- LAYERED: 5-10% (if above 15%, the technique loses punch)

**Three-register check.** The channel uses three visual registers (see VISUAL_LANGUAGE.md):
- Register 1 (Analytical): `[MG:]` entries — where the viewer reads information
- Register 2 (Atmospheric): `[ILLUST:]` entries — where the viewer feels emotion
- Register 3 (Grounding): `[AI-GEN:]` entries — where the viewer inhabits a space

All three registers should be present in any episode longer than 8 minutes. If a register is completely absent, flag it with a suggestion for where it could be inserted. Common gaps:
- Missing Atmospheric → the episode is all-data, all the time. Suggest 3-5 moments where constructivist illustrations would add emotional weight (typically at turning points, trap-closing moments, or dystopian implications).
- Missing Grounding → the viewer never physically enters the spaces being discussed. Suggest 2-3 moments where a photorealistic AI scene would make the abstract concrete.

**Register transition grammar.** When the script switches between registers, check that transitions respect the grammar from `project/TRANSITION_GRAMMAR.md`. Six canonical types only — the six deprecated types (`wipe-left/right/up`, `blur-through`, `whip-pan`, `spatial-zoom`) are never valid:
- Analytical → Grounding (register shift): `color-wash` with color token
- Grounding → Atmospheric (soften): `dissolve` (~~`blur-through`~~ is deprecated — flag any use)
- Atmospheric → Analytical: cut. `iris` was retired Oct 10, 2026 (renders as a cut); flag any `cut(iris)`
- Analytical → Atmospheric (gentle drift): `dissolve`
- Hard cuts between stylistically distant registers (e.g., constructivist art directly to photorealistic AI) should be flagged as jarring.

**Mode monotony.** Walk the visual column sequentially and flag:
- More than 3 consecutive `[MG:]` entries without a non-MG break — this is the "lecture slideshow" pattern. The viewer's analytical brain fatigues. Suggest inserting breathing footage, an atmospheric illustration, or a grounding AI scene between MG clusters.
- More than 2 consecutive `[ILLUST:]` or `[AI-GEN:]` entries — these registers fatigue faster than MG because their stylized quality is more demanding on attention.
- More than 30 seconds of continuous `[FOOTAGE:]` without a visual change — the viewer starts watching footage instead of listening to narration. Suggest a cut, an overlay, or an MG insert.
- Beats that are all one mode — a beat entirely in `[MG:]` feels like a presentation; a beat entirely in `[FOOTAGE:]` feels like a documentary without analysis. Flag single-mode beats and suggest where to introduce contrast.

**Unsourceable footage calls.** For every `[FOOTAGE:]` entry, apply the "would a stock photographer have filmed this?" test from FOOTAGE_SOURCING.md. Flag entries that describe abstract concepts as footage — "footage of supply chain complexity," "footage of technology denial," "footage of economic integration." For each, suggest the appropriate alternative:
- If the concept needs the viewer to *understand data* → `[MG:]` with the right Remotion template
- If the concept needs the viewer to *feel something* → `[ILLUST:]` atmospheric illustration
- If the concept describes a physical space cameras can't access → `[AI-GEN:]`

**Sourcability warnings.** Flag `[FOOTAGE:]` entries that fall into the "Hard to Source" category from FOOTAGE_SOURCING.md (named individuals, specific facilities, classified tech, corporate branding). These aren't wrong — they just need the producer to know they'll require extra effort. Note the difficulty and suggest a fallback if the footage can't be found.

**Layered composition quality.** For `[LAYERED:]` entries, check:
- Is the MG overlay simple enough? Full charts, dense frameworks, or multi-element graphics compete with footage for attention. Only single stats, labels, highlights, or brief typography should be layered over footage.
- Is the footage visually calm enough? Layering a stat over dramatic, fast-moving footage means the viewer can't read either. The footage should be relatively static (aerial slow-pan, held shot, ambient texture).

**Beat cadence check.** For each beat, check whether it roughly follows the establish-analyze-breathe-climax-land pattern from VISUAL_LANGUAGE.md. Not every beat must follow this exactly, but flag beats that are strikingly unvaried — all footage or all MG from start to finish.

**Visual rhythm map.** If a visual-concept audit already exists for this script (check the episode folder for `visual-concept-audit.md`), reference its rhythm map rather than re-deriving one — visual-concept is the authoritative source for visual rhythm analysis. In that case, summarize the key rhythm findings from visual-concept and note any *new* rhythm issues created by narration patterns that visual-concept wouldn't catch (e.g., a narration-level pacing sag that makes an already-dense MG section feel even longer).

If no visual-concept audit exists, generate the rhythm map yourself using this format:

```
Beat 1: [F 10s] [MG:Title 3s] [F 15s] [MG:Chart 8s] [ILLUST 6s] [F 8s]  ✅ varied, 3 registers
Beat 2: [MG:Map 12s] [MG:Chart 8s] [MG:FW 10s] [MG:Typo 4s]  ⚠️ all Analytical — needs register break
Beat 3: [F 25s] [F 15s] [F 10s]  ⚠️ 50s footage without MG — analysis feels absent
Beat 4: [MG:Chart 8s] [AI-GEN 7s] [ILLUST 5s] [MG:FW 10s]  ✅ register variety
```

**Backdrop coverage (`[BACKDROP: id]`) check.** Per-segment editorial backdrops drive the FilmOverlay film-treatment cascade (see SCRIPT_FORMAT.md → `[BACKDROP:]`). Each backdrop in `backdrop-manifest.json` declares its own `recommendedPreset`, so the right backdrop choice silently resolves preset/effects/intensity. Audit:
- Are P1 / register-transition / emotional-peak moments tagged with `[BACKDROP: id]`? Flag P1 segments that have no backdrop *and* no clear reason (e.g., maps and full-screen kinetic typography sometimes legitimately don't need one).
- Does the script use *too many different* backdrops? Anti-pattern: every cell has a different backdrop. The cascade is most effective when one backdrop covers an editorial arc (3-5 connected cells). Flag if more than ~8 distinct backdrop ids appear in a 12-14 min episode.
- Is the script using `[OVERLAY: preset]` correctly — only as a rare per-segment override on editorial peaks? If `[OVERLAY:]` appears more than ~3 times in an episode, the script writer is using it as a substitute for `[BACKDROP:]`. Flag and suggest the backdrop-driven cascade is the right primary mechanism.
- Confirm that if any `[BACKDROP:]` / `[OVERLAY:]` tags appear, the visual-spec stage will need to set `manifest.filmOverlay: { preset: ... }` to opt the episode into the system. (Not a script-level issue but worth noting in the audit for handoff.)

**Visual density annotations (`PACE:`) check.** If the script uses `PACE:` annotations, verify:
- PACE changes follow `project/PACING_REGISTER.md`: at least 2 profile changes per beat in episodes over 10 minutes, with changes aligned to structural shifts rather than scattered (the older "2-4 per episode" cap was retired — locked scripts run 7-12)
- `PACE: breathing` appears on at least one emotional peak or philosophical pause (if the script has these moments but no breathing pace, flag as a missed opportunity)
- `PACE: urgent` is only used on genuine tension sequences, not routine analytical sections
- PACE changes align with narrative structure (e.g., breathing at act breaks, urgent during crisis escalation) rather than being randomly scattered
- If no PACE annotations exist, note this as informational — they're optional but recommended for scripts with clear tempo shifts

**Text-animation register check.** When the script tags `[MG:] KineticTypography` cells, verify the implicit text-animation register matches the content's editorial role. The doctrine is in `project/TEXT_ANIMATION_REGISTER.md`. For audit purposes, walk each KineticTypography cell and flag these specific patterns:

- **A quote variant with a real, named attribution** (Nash, Morris Chang, Schmidt, Schelling, Sullivan, etc.) should be tagged or specified to use the `quote-attribution` composite pattern (Typewriter + serif-italic attribution). If the script doesn't explicitly say so via `DIR: type(quote-attribution)` or visual-spec doesn't appear to be picking it up, flag as: "Named-attribution quote — consider tagging `DIR: type(quote-attribution)` so visual-spec emits the typewriter register; otherwise the channel-voice default applies and the quote loses its archival/transcribed feel."
- **A quote variant with NO named attribution** (i.e., channel-voice text styled as a "quote" for emphasis, e.g., "Cooperation isn't a miracle. It's designed.") — should NOT use `quote-attribution`. This is the most common misuse. Flag if the script tags `DIR: type(quote-attribution)` (or similar) on a channel-voice quote: "Channel-voice statements aren't transcribed speech — typewriter register implies a named speaker. Use `[MG:] KineticTypography variant=\"quote\"` with the word-cascade default; or, if the line is the episode's editorial pivot, consider switching it to a definition variant or a stat-caption."
- **A definition variant introducing a foreign term** (any cell where `term`, `termPinyin`, `termTranslation` would be set — typically `卡脖子`, `举国体制`, or any non-English term being defined) should use `definition-reveal`. If the script writer authored a cell for the term but didn't request the composite, flag: "Foreign-term introduction — `DIR: type(definition-reveal)` would lift this from a generic word reveal into the canonical Parallax definition pattern (term + pinyin + translation choreography)."
- **A statistic variant with a hero number** (cell with `statValue` set) should use `stat-caption`. Same flag logic — recommend tagging.

**Concept-callback check (cross-episode continuity).** When the script references a term that was introduced in a PRIOR Parallax episode (per `data/concepts.json`), the second-and-later renderings should be tagged with `DIR: type(<technique>, callback)` so visual-spec sets `_direction.isCallback: true`. The callback pulse is a compounding-production lever: every recurring concept gets a subtle "you've seen this before" cue at zero cost.

To run this check: use the concept-registry CLI to look up each term in the current script. For each match where `introduced.episode` is NOT the current episode, flag the callback opportunity:
```
python3 tools/concepts/lookup.py callback-check --term "卡脖子" --episode <current-slug>
```
The CLI returns JSON: `{ isCallback: true|false, conceptId, accentColor, introducedIn, currentEpisode }`. If `isCallback: true`, flag the rendering moment in the script audit as: "Concept callback opportunity — add `DIR: type(<technique>, callback)` so the term pulses on arrival per the cross-episode continuity register (TEXT_ANIMATION_REGISTER.md § Tier 1.B)."

**Anti-pattern — over-use of dramatic text registers.** Reserve the high-energy techniques for editorial peaks. If the script has more than ~2 `DIR: type(scramble)` or more than ~3 `DIR: type(reveal-mask)` invocations in a single episode, flag as register-creep: "These techniques are register signals; using them frequently drifts toward spy-thriller or theatrical territory. Reserve for the highest-weight moments."

**Hold-motion register check.** When the script uses `DIR: drift(<preset>)` or `DIR: hold(stillness)` to override a segment's hold-beat motion (added May 16, 2026), verify the preset choice matches the template's editorial register per `project/HOLD_MOTION_REGISTER.md` Section 4. Most segments don't need a `drift()` directive — the template default handles it. Flag these specific mismatches:

- **Chart-category template with `DIR: drift(documentary)`** — the 0.3° rotation in documentary tilts chart axis baselines visibly (false data signal). The M-DRIFT-DEFAULT manifest lint will catch this at commit, but flagging at script-audit time is earlier feedback. Flag: "DataChart / TimeSeriesChart / BumpChart / etc. should use `drift(editorial)` (default — no override needed) or `drift(settle)`. The `documentary` preset's rotation tilts axes — HOLD_MOTION_REGISTER.md § 06 Failure mode."
- **AtlasPlate with `DIR: drift(documentary|normal|slow)`** — directional pan shifts the map projection registration. Flag: "AtlasPlate is projection-sensitive — use `drift(breathing)` (scale-only, the template default), `drift(sway)` (zero-net pan), or `drift(none)` for memorial moments. See HOLD_MOTION_REGISTER.md § 06 vs § 04."
- **Photo plate (ImageComposite / PhotoMontage / AnnotatedImage) with `DIR: drift(none|editorial)`** — these are Register C documentary templates; total stillness reads as a printed still rather than documentary footage. Flag: "Photo plates default to `drift(documentary)`. If you genuinely want stillness for a memorial / casualty / document-of-record beat, leave it — but verify the editorial register intent. See HOLD_MOTION_REGISTER.md Section 4."
- **Held quote / definition (KineticTypography) with `DIR: drift(documentary)`** — Register B is breathing/settle/none; documentary's rotation reads careless on typography. Flag accordingly.

**Authoring guidance**: when in doubt, omit `drift()` and let the template default fire. Reach for `drift()` only when the editorial intent of THIS beat diverges from the template's canonical register — most commonly `hold(stillness)` on a memorial/casualty card, or `drift(none)` on a document-of-record quote.

**Transition-grammar register check.** When the script uses `DIR: cut(<type>)` to override a seam's transition, verify the choice matches the editorial relationship per `project/TRANSITION_GRAMMAR.md`. The implicit-default engine handles most seams (within-beat → cut; beat-boundary → dissolve; title cards → fade); only explicit overrides are worth flagging. Check these patterns:

- **Deprecated transition type** — any use of `wipe-left`, `wipe-right`, `wipe-up`, `blur-through`, `whip-pan`, or `spatial-zoom`. Flag: "Deprecated transition — use [replacement] instead. M-TRANSITION-DEPRECATED will block this at manifest commit. See TRANSITION_GRAMMAR.md § Retired forms." Replacement map: `wipe-*` → `dissolve`; `blur-through` → `dissolve`; `whip-pan` → `cut`; `spatial-zoom` → `match-cut`.
- **Dissolve creep** — more than 2 consecutive `cut(dissolve)` directives within a 30-second window. Flag: "3+ consecutive dissolves suppress visual rhythm — the viewer stops registering cuts. Break the run with a cut or match-cut. See TRANSITION_GRAMMAR.md § dissolve."
- **Any iris** — `cut(iris)` was retired on Oct 10, 2026 and renders as a cut. Flag every occurrence: "Replace cut(iris) with a cut, or cut(fade) at a chapter break." (`S-DIR-IRIS-RETIRED` in script_lint reports these.)
- **`cut(color-wash)` without color token** — `cut(color-wash)` without specifying a color (e.g., `cut(color-wash, ink)`) renders as a transparent wash. Flag: "color-wash directive missing color token — add the brand palette value (e.g. ink, amber, rust). M-TRANSITION-COLOR-WASH-TOKEN will warn at commit."
- **`cut(match-cut)` without shared visual subject** — match-cuts only land when both segments share a compositional anchor (same location, same scale-subject, same geometric form). If the two segments are visually unrelated, the match-cut reads as a jump cut. Flag: "Match-cut on segments without shared visual subject — verify both segments share [subject]. Consider dissolve instead."

**Authoring guidance on transitions**: most seams need no `cut()` directive — omit it and let the engine decide. Reach for explicit `cut()` only for register shifts (`color-wash, ink`), civilizational-rupture peaks (`iris`, ≤2 per episode), historical-analogy match-cuts (`match-cut`), and chapter/silence beats (`fade` + `hold(stillness)`). J/L-cut audio bridges (`DIR: jcut(0.7)`) are applied automatically to every hard cut by the default engine; use `DIR: jcut(N)` only to override the default 0.7s overlap.
