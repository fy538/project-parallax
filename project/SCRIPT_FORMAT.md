# Parallax — Two-Column Script Format

## Purpose
The production script format for Parallax episodes. Every script serves two audiences simultaneously: **Tiger** (who reads the left column aloud) and **the production pipeline** (which executes the right column into rendered video). A script isn't done until both columns are complete.

Created: April 26, 2026
Updated: April 26, 2026

**Related docs:**
- **VISUAL_LANGUAGE.md** — *when* to use footage vs. motion graphics vs. both. Read that first for the editorial logic.
- **FOOTAGE_SOURCING.md** — *where* to get footage, organized by visual need. Consult when specifying stock footage.
- **BRAND.md / IMAGES.md** — treatment pipeline that all footage and images pass through before use.

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
- `{✅}` / `{⚠️}` / `{NEW}` claim verification tags (see below)

#### Claim Verification Tags

Every factual claim in the narration should carry a verification status inherited from the research brief's claims table. This prevents script-audit from re-verifying claims that were already confirmed in the brief, and flags new claims introduced during scripting that haven't been checked at all.

**Tags** (inline, after the claim):
- `{✅}` — Confirmed in brief's verification table. Script-audit can skip this.
- `{⚠️}` — Unverified or "likely correct" in the brief. Script-audit should flag if load-bearing.
- `{NEW}` — Claim not in the brief. Introduced during scripting. Needs verification before recording.

**Usage:**
```
In December 2025, TSMC's first Arizona fab hit a 92% chip yield {✅} — four 
percentage points higher than the equivalent line in Taiwan {⚠️}. That fab 
covers about seven percent of US chip demand {✅}. The chips cost fifty percent 
more than the ones made in Taiwan {NEW}.
```

**Rules:**
- Tag only specific factual claims (numbers, dates, percentages, attributed quotes, historical facts). Don't tag opinions, framing, or analysis.
- Inherit statuses directly from the brief's Key Claims + Verification Status table. If a claim appears in the brief as ✅ CONFIRMED, it gets `{✅}` in the script.
- Any claim that appears in the narration but NOT in the brief's verification table gets `{NEW}` — these are the most dangerous because nobody flagged them for checking.
- Script-audit's Claim Audit lens should focus its verification effort on `{⚠️}` and `{NEW}` claims, especially those that are load-bearing (anchor a key beat or support the thesis).
- Before recording, all `{NEW}` claims on load-bearing beats should be resolved to `{✅}` or removed.
- The tags are stripped before narration — they're metadata for the production pipeline, not text Tiger reads aloud.

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

## Visual Modes

Every visual moment in the right column falls into one of three modes. Tag each entry to make the mode explicit — downstream tools (visual-spec, asset-source, assembly) parse these tags to route work correctly.

### Mode tags

- **`[FOOTAGE:]`** — footage only. The viewer sees stock video, archival imagery, or a held photograph. No motion graphic overlay. This is the default for establishing context, story beats, breathing room, and emotional landing.
- **`[MG:]`** — motion graphic only. The viewer sees a Remotion template (chart, map, framework, typography card). No footage underneath. This is the default for data reveals, structural arguments, geographic arguments, and definitions.
- **`[LAYERED:]`** — footage with MG composited on top. A key stat over cleanroom footage, a label over an aerial shot, a highlight outline over satellite imagery. Use sparingly (2-3 per beat max) — the technique loses punch through overuse.

When a visual column entry has no mode tag, the pipeline infers it from context: `TEMPLATE: FOOTAGE` or `TEMPLATE: IMAGE` → footage mode; a named Remotion template → MG mode. Explicit tags are preferred because they make the editorial intent unambiguous and help script-audit catch visual monotony.

### How the tags look in the table

```
| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| The Arizona desert stretches out...  | **P3** · [FOOTAGE:] "Arizona desert aerial" > "southwest US aerial" · Pexels · standard · 10s |
| TSMC's first fab hit a 92% yield — | **P1** · [LAYERED:] FOOTAGE "cleanroom wafer handling" + KineticTypography "92% YIELD" · amber accent · 6s |
| That number matters because... | **P1** · [MG:] DataChart — lithography passes comparison · [ep01/chart-litho.json] · 8s |
| *[Beat.]* | **P3** · [FOOTAGE:] "tech industry office ambient" · breathing room · 5s |
```

### Pacing constraints

These come from VISUAL_LANGUAGE.md and should be checked by script-audit:

- No more than **3 consecutive `[MG:]`** entries without a `[FOOTAGE:]` break.
- No more than **30 seconds** of continuous `[FOOTAGE:]` without a visual change (new shot, overlay, or cut to MG).
- Each beat should roughly follow: footage (establish) → MG (analyze) → footage (breathe) → MG or layered (climax) → footage (land).
- `[LAYERED:]` entries should be brief (3-8 seconds) with simple overlays — complex charts need the viewer's full attention and belong in `[MG:]`.

### Sourcability check

Before finalizing the right column, every `[FOOTAGE:]` and `[LAYERED:]` entry should pass the source-check from FOOTAGE_SOURCING.md:

1. Does this physically exist as something a camera could capture? If not → change to `[MG:]`.
2. Is it generic or specific? Generic → free platforms / Storyblocks. Specific → check the "Hard to Source" table.
3. Named person? → Wikimedia Commons press photo, accept a still.
4. Historical? → Library of Congress, National Archives, Archive.org first.
5. Chinese-specific? → Growing libraries on Pexels/Storyblocks for cities; named Chinese facilities and individuals are hardest.

If a footage call fails the source-check, rewrite the visual spec as MG or flag it with a `[SOURCING: HARD]` tag so the producer knows to budget extra time.

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
| *Opening paragraph of narration...* | **P2** · [FOOTAGE:] "search terms" > "fallback terms" · Pexels · standard · background @ 35% · match narration |
| Continuation of narration with a key data point. | **P1** · [MG:] ChoroplethMap · Phase 1: highlight US allies blue · [ep01/choropleth-data.json] · 8s |
| *[Beat.]* | **TRANSITION** · 1s black · breathing room |
| Next paragraph where a quote lands. | **P1** · [MG:] KineticTypography · Quote: "Globalization is almost dead." — Morris Chang · amber accent · 4s hold |
| The implication is staggering. | **P1** · [LAYERED:] FOOTAGE "Arizona desert construction" + KineticTypography "7% OF US DEMAND" · 5s |
| Closing paragraph of beat. | **P3** · [FOOTAGE:] "semiconductor supply chain factory" · standard · background @ 30% · match narration |
```

---

## End-of-Script: Asset Summary Table

After all beats, include a consolidated summary. Start with a visual mode breakdown — this is the quick health check for pacing balance.

```markdown
## ASSET SUMMARY

### Visual Mode Breakdown
| Mode | Count | Est. Screen Time | % of Episode |
|------|-------|-------------------|--------------|
| [FOOTAGE:] | 18 | ~7:30 | ~55% |
| [MG:] | 14 | ~4:00 | ~30% |
| [LAYERED:] | 5 | ~1:00 | ~8% |
| TRANSITION | 6 | ~1:00 | ~7% |

Target ranges: FOOTAGE 50-70%, MG 20-30%, LAYERED 5-15%, TRANSITION 5-10%.
If MG exceeds 35%, the episode will feel like a slideshow. If FOOTAGE exceeds 75%, analysis feels unsupported.

### Remotion Compositions (generate via visual-spec)
| # | Template | Description | Data file | Mode |
|---|----------|-------------|-----------|------|
| 1 | ChoroplethMap | Supply chain integration phases | ep01/choropleth-supply-chain.json | [MG:] |
| 2 | TimelineComparison | 1941 embargo �� 2022 chip controls | ep01/timeline-embargo.json |
| ... | | | |

### Stock Footage Needed
| # | Priority | Search Terms | Library | Treatment | Duration | Sourcability |
|---|----------|-------------|---------|-----------|----------|-------------|
| 1 | P1 | "TSMC Arizona aerial construction" | Pexels | standard | 8s | Moderate |
| 2 | P2 | "semiconductor cleanroom wafer" | Pixabay | standard | 12s | Easy |
| 3 | P1 | "Morris Chang speaking" | Wikimedia | standard | still | Hard — accept still |
| ... | | | | | | |

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

The **Sourcability** column in the stock footage table maps to FOOTAGE_SOURCING.md's tiers: Easy (free/Storyblocks), Moderate (available with effort), Hard (archival or creative workaround needed). Any "Hard" entry should have a fallback plan noted.

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

The script-audit skill should check:
- Every narration paragraph has a corresponding visual spec with a mode tag
- No 5+ second gaps without visual direction
- P1 visuals exist for each beat's key moment
- Asset summary table is complete, including visual mode breakdown
- Visual mode balance is within target ranges (FOOTAGE 50-70%, MG 20-30%)
- No more than 3 consecutive `[MG:]` entries without a `[FOOTAGE:]` break
- No `[FOOTAGE:]` entries that fail the sourcability check (abstract concepts tagged as footage)
- `[LAYERED:]` entries have simple overlays (single stat, label, or highlight — not full charts)

---

## Important Notes

- **The left column is Tiger's.** He reads it, he rewrites it, he owns the voice. Don't let visual planning contaminate narration quality.
- **The right column is the pipeline's.** It should be specific enough that a tool (or a person) can source every asset without interpretation.
- **Stock footage search terms should be ranked.** Most specific first, most generic last. The sourcing tool tries them in order.
- **Treatment defaults to "standard" and composite defaults to "background @ 35%."** Only specify when different.
- **"Match narration" is a valid duration.** The assembly step will sync visual timing to audio timestamps.
- **AI generations are last resort.** Stock footage > archival > AI. AI is for abstract concepts that have no photographic equivalent (e.g., "the concept of strategic interdependence as a physical mechanism").
- **Visual mode tags are mandatory.** Every right-column entry should carry `[FOOTAGE:]`, `[MG:]`, or `[LAYERED:]`. These tags route work to the correct downstream tool and enable automated pacing checks. See the Visual Modes section above.
- **The visual mode breakdown is a pacing diagnostic.** If the numbers look off (too much MG, too little footage), restructure the visual column before passing to visual-spec. It's much cheaper to rebalance now than to re-source footage later.
- **Consult FOOTAGE_SOURCING.md before writing footage specs.** The sourcability tables tell you what's actually available. Writing a `[FOOTAGE:]` spec for something that doesn't exist in stock libraries wastes everyone's time — use `[MG:]` instead and design a motion graphic that communicates the same thing.
