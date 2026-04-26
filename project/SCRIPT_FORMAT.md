# Parallax — Two-Column Script Format

## Purpose
The production script format for Parallax episodes. Every script serves two audiences simultaneously: **Tiger** (who reads the left column aloud) and **the production pipeline** (which executes the right column into rendered video). A script isn't done until both columns are complete.

Created: April 26, 2026

---

## Format Structure

Each beat of the script is a table with two columns:

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| What Tiger says | What appears on screen |

### Left Column: Narration

The spoken script. Same quality bar as before — conversational, tension-driven, no lecture patterns. Includes:

- Full narration text
- `[Beat.]` or `[Pause.]` for deliberate silence
- `(Voice note: ...)` for delivery guidance — tone, pace, emphasis
- Timing estimates per beat

### Right Column: Visual Production

For **every paragraph or visual moment** in the narration, the right column specifies:

```
TEMPLATE: [Remotion template name] or FOOTAGE or IMAGE or TRANSITION
SOURCE: [specific asset reference or search terms]
TREATMENT: [standard / conflict / editorial] (default: standard)
COMPOSITE: [background / inset / antipode] (default: background)
DURATION: [seconds, or "match narration"]
NOTES: [any special instructions]
```

#### Source Types and How to Specify Them

**Remotion templates** — reference the template + data description:
```
TEMPLATE: ChoroplethMap
SOURCE: Phase animation — US/allies blue, China/allies red, contested amber
DATA: [link to JSON or "generate via visual-spec"]
DURATION: 12s
```

**Stock footage** — provide search terms ranked by specificity:
```
TEMPLATE: FOOTAGE
SOURCE: "TSMC cleanroom wafer handling" > "semiconductor cleanroom" > "chip manufacturing"
LIBRARY: Pexels, Pixabay
TREATMENT: standard
COMPOSITE: background @ 35%
DURATION: match narration (~8s)
```

**Archival/historical images** — be specific about what you want:
```
TEMPLATE: IMAGE
SOURCE: "1941 Pearl Harbor Japanese planes" OR "FDR signing embargo order"
LIBRARY: Wikimedia Commons, Library of Congress, public domain
TREATMENT: standard
COMPOSITE: inset @ 70%
DURATION: 4s
```

**AI reference art** — engraved style only per BRAND.md:
```
TEMPLATE: IMAGE
SOURCE: AI-GENERATE "Copperplate engraving style: global supply chain as interconnected clockwork mechanism"
TREATMENT: standard
COMPOSITE: background @ 30%
```

**Screen recordings / data** — for specific websites, charts, documents:
```
TEMPLATE: IMAGE
SOURCE: SCREENSHOT "Kalshi prediction market — China EUV capability by 2028"
TREATMENT: editorial
COMPOSITE: inset @ 80%
```

**Transitions** — between beats:
```
TEMPLATE: TitleTransition
SOURCE: Beat title card
DATA: { "title": "THE LOGIC OF DENIAL", "subtitle": "3:00" }
DURATION: 2s
```

---

## Visual Density Target

Every **5 seconds of narration** should have a corresponding visual specification. This doesn't mean a new asset every 5 seconds — it means no 5-second stretch should be unspecified. Visual specs can cover ranges:

```
TEMPLATE: FOOTAGE
SOURCE: "Shenzhen tech district aerial" > "Chinese city skyline technology"
DURATION: match narration (~25s)  
NOTES: Slow zoom. This is ambient texture under narration, not the focus.
```

---

## Asset Priority Tiers

Not all visuals are equally important. Tag each with a priority:

- **P1 — Hero visual.** This is the shot the viewer remembers. The moment that sells the insight. Must be specific, must be sourced. Examples: the chess vs. go boards, the TSMC aerial, the split-screen timeline.
- **P2 — Supporting visual.** Adds context or rhythm. Can be from stock or template. Examples: cleanroom B-roll, supply chain map, data overlays.
- **P3 — Ambient texture.** Background treatment under narration. Can be generic stock with brand treatment applied. Examples: city skylines, tech industry footage, archival texture.

An 18-minute video typically needs: ~5-8 P1 visuals, ~10-15 P2 visuals, and ~8-12 P3 ambient textures.

---

## Beat Structure Template

Copy this for each beat:

```markdown
---

### BEAT [N] — [TITLE] ([start]–[end])

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| *Opening paragraph of narration...* | **P2 — FOOTAGE** · "search terms" > "fallback terms" · Pexels · standard · background @ 35% · match narration |
| Continuation of narration with a key data point. | **P1 — ChoroplethMap** · Phase 1: highlight US allies blue · [ep01/choropleth-data.json] · 8s |
| *[Beat.]* | **TRANSITION** · 1s black · breathing room |
| Next paragraph where a quote lands. | **P1 — KineticTypography** · Quote: "Globalization is almost dead." — Morris Chang · amber accent · 4s hold |
| Closing paragraph of beat. | **P3 — FOOTAGE** · "semiconductor supply chain factory" · standard · background @ 30% · match narration |
```

---

## End-of-Script: Asset Summary Table

After all beats, include a consolidated table:

```markdown
## ASSET SUMMARY

### Remotion Compositions (generate via visual-spec)
| # | Template | Description | Data file |
|---|----------|-------------|-----------|
| 1 | ChoroplethMap | Supply chain integration phases | ep01/choropleth-supply-chain.json |
| 2 | TimelineComparison | 1941 embargo �� 2022 chip controls | ep01/timeline-embargo.json |
| ... | | | |

### Stock Footage Needed
| # | Priority | Search Terms | Library | Treatment | Duration |
|---|----------|-------------|---------|-----------|----------|
| 1 | P1 | "TSMC Arizona aerial construction" | Pexels | standard | 8s |
| 2 | P2 | "semiconductor cleanroom wafer" | Pixabay | standard | 12s |
| ... | | | | | |

### Images / Archival
| # | Priority | Description | Source | Treatment |
|---|----------|-------------|--------|-----------|
| 1 | P1 | FDR signing order, 1941 | Wikimedia Commons | standard |
| 2 | P2 | Morris Chang portrait | Reuters/AP (fair use) | standard |
| ... | | | | |

### AI Generations (engraved style only)
| # | Prompt | Treatment | Use |
|---|--------|-----------|-----|
| 1 | "Copperplate: global supply chain as clockwork" | standard | Beat 4 background |
| ... | | | |
```

---

## Workflow Integration

The two-column script replaces the current narration-only script in the pipeline:

```
Deep Research → research-audit → Script Draft (two-column) → script-audit → persona-eval
                                       ↓
                                  Asset Summary Table
                                       ↓
                              ┌────────┴────────┐
                              ↓                 ↓
                        visual-spec         asset-source
                        (Remotion JSON)     (stock footage download
                                            + image processing)
                              ↓                 ↓
                              └────────┬────────┘
                                       ↓
                                  Assembly + Render
```

The script-audit skill should be updated to also check:
- Every narration paragraph has a corresponding visual spec
- No 5+ second gaps without visual direction
- P1 visuals exist for each beat's key moment
- Asset summary table is complete

---

## Important Notes

- **The left column is Tiger's.** He reads it, he rewrites it, he owns the voice. Don't let visual planning contaminate narration quality.
- **The right column is the pipeline's.** It should be specific enough that a tool (or a person) can source every asset without interpretation.
- **Stock footage search terms should be ranked.** Most specific first, most generic last. The sourcing tool tries them in order.
- **Treatment defaults to "standard" and composite defaults to "background @ 35%."** Only specify when different.
- **"Match narration" is a valid duration.** The assembly step will sync visual timing to audio timestamps.
- **AI generations are last resort.** Stock footage > archival > AI. AI is for abstract concepts that have no photographic equivalent (e.g., "the concept of strategic interdependence as a physical mechanism").
