# Parallax — Two-Column Script Format

## Purpose
The production script format for Parallax episodes. Every script serves two audiences simultaneously: **Tiger** (who reads the left column aloud) and **the production pipeline** (which executes the right column into rendered video). A script isn't done until both columns are complete.

Created: April 26, 2026
Updated: May 4, 2026

**Related docs:**
- **VISUAL_LANGUAGE.md** — *when* to use footage vs. motion graphics vs. both. Read that first for the editorial logic.
- **DIRECTING_LANGUAGE.md** — *how* to direct camera, reveals, timing, transitions, and mood via `DIR:` annotations. The complete syntax reference.
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

**Atmospheric illustrations** — constructivist/dystopian via Recraft (Register 2):
```
TEMPLATE: ILLUST
MODE: metaphor
PROMPT: "Technological dependency as a tightening vise — factory skyline trapped in mechanical jaws, workers as anonymous silhouettes"
STYLE: vector_illustration
TREATMENT: standard
COMPOSITE: background @ 40%
DURATION: 6s
NOTES: Emotional texture under narration — NOT data-carrying. Viewer should feel unease, not read information.
```

**AI-generated video** — stylized footage for unsourceable spaces:
```
TEMPLATE: AI-GEN
SCENE: "Interior of advanced semiconductor cleanroom, yellow lithography lighting, two workers in bunny suits with mannequin faces operating wafer handlers"
CAMERA: slow forward dolly, shallow depth of field, 35mm
STYLE-REF: style-ref_interior_cleanroom-warm_v1.png
TOOL: kling-3.0 (image-to-video)
TREATMENT: standard
DURATION: 7s
NOTES: Mannequin faces must remain smooth — reject if features drift toward realism
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
- **`[AI-GEN:]`** — AI-generated video with stylized (mannequin-face) figures (Register 3: Grounding). Used for physically real but unsourceable spaces (restricted facilities, historical reconstructions, conceptual scenes made literal). Clips are 5-10 seconds, generated via Kling 3.0 / Sora 2 from reference frames, then passed through `treat_video.py` brand treatment. Never for named individuals or claimed specific events. See AI_VIDEO_PIPELINE.md for full spec.
- **`[ILLUST:]`** — AI-generated constructivist/atmospheric illustration (Register 2: Atmospheric). Used for emotional texture, dystopian mood, propaganda-poster-style conceptual art, and trippy abstract visuals that create *feeling* rather than communicate *data*. Generated via Recraft V3 API (`tools/recraft/recraft.py`), output as SVG, then passed through duotone brand treatment (`--treat standard|conflict|editorial`). These are NOT data-carrying — use `[MG:]` for anything the viewer needs to *read*. See VISUAL_LANGUAGE.md "Three Visual Registers" section.

When a visual column entry has no mode tag, the pipeline infers it from context: `TEMPLATE: FOOTAGE` or `TEMPLATE: IMAGE` → footage mode; a named Remotion template → MG mode; `SOURCE: AI-GEN` → AI-GEN mode; Recraft/illustration reference → ILLUST mode. Explicit tags are preferred because they make the editorial intent unambiguous and help script-audit catch visual monotony.

### How the tags look in the table

```
| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| The Arizona desert stretches out...  | **P3** · [FOOTAGE:] "Arizona desert aerial" > "southwest US aerial" · Pexels · standard · 10s |
| TSMC's first fab hit a 92% yield — | **P1** · [LAYERED:] FOOTAGE "cleanroom wafer handling" + KineticTypography "92% YIELD" · amber accent · 6s |
|                                      | DIR: reveal(count-up, sync:"ninety-two", pulse) |
|                                      | DIR: hold(land) |
| That number matters because... | **P1** · [MG:] DataChart — lithography passes comparison · [ep01/chart-litho.json] · 8s |
|                                | DIR: cam(overview → element:0, sync:"matters", track) |
|                                | DIR: reveal(stagger:300ms, hero:0) |
| *[Beat.]* | **P2** · [ILLUST:] metaphor · "Industrial machine consuming smaller machines — dependency as digestion" · standard · 6s |
|           | DIR: mood(dense, dim:0.4) |
|           | DIR: hold(2s) |
| The trap tightens invisibly... | **P2** · [AI-GEN:] "Dimly lit boardroom, suited mannequin figures around table, one gripping a microchip" · slow push · kling-3.0 · conflict · 7s |
|                                | DIR: cam(push-in, over:7s) |
|                                | DIR: mood(dense, particles:15) |
|                                | DIR: cut(blur-through) |
```

`DIR:` lines stack below the visual spec line they belong to. Most compositions need 0-2 direction lines; hero moments may have 3-4. See "Direction Annotations" below for the full rules.

### Pacing constraints

These come from VISUAL_LANGUAGE.md and should be checked by script-audit:

- No more than **3 consecutive `[MG:]`** entries without a `[FOOTAGE:]`, `[ILLUST:]`, or `[AI-GEN:]` break.
- No more than **30 seconds** of continuous `[FOOTAGE:]` without a visual change (new shot, overlay, or cut to MG).
- No more than **2 consecutive `[AI-GEN:]`** clips without a mode switch. AI-GEN inherits footage's pacing role but its stylized quality fatigues faster.
- No more than **2 consecutive `[ILLUST:]`** entries without a mode switch. Atmospheric register creates mood but fatigues if sustained.
- Each beat should roughly follow: footage (establish) → MG (analyze) → footage (breathe) → MG or layered (climax) → footage (land). AI-GEN and ILLUST slot in wherever footage would go — AI-GEN for physical spaces, ILLUST for emotional/conceptual texture.
- `[LAYERED:]` entries should be brief (3-8 seconds) with simple overlays — complex charts need the viewer's full attention and belong in `[MG:]`.
- `[AI-GEN:]` should account for no more than 10-20% of episode runtime (~60-120 seconds per 13-minute episode).
- `[ILLUST:]` should account for no more than 10-15% of episode runtime (~50-100 seconds per 13-minute episode).

### Register transition grammar

When switching between visual registers, use the appropriate transition to maintain flow (see VISUAL_LANGUAGE.md for the full table):

- **Analytical → Grounding** (`[MG:]` → `[AI-GEN:]`): color-wash transition — the clean analytical space bleeds into the textured physical world.
- **Grounding → Atmospheric** (`[AI-GEN:]` → `[ILLUST:]`): blur-through — the photorealistic scene dissolves into stylized abstraction.
- **Atmospheric → Analytical** (`[ILLUST:]` → `[MG:]`): iris — the illustration contracts to a focal point, then the data visualization opens from that point.
- **Analytical → Atmospheric** (`[MG:]` → `[ILLUST:]`): dissolve — softer transition, the clean data fades into mood.
- **Grounding → Analytical** (`[AI-GEN:]` → `[MG:]`): color-wash or cut — the physical world yields to analysis.
- **Same register adjacent**: standard cut. No special transition needed.

### Sourcability check

Before finalizing the right column, every `[FOOTAGE:]` and `[LAYERED:]` entry should pass the source-check from FOOTAGE_SOURCING.md:

1. Does this physically exist as something a camera could capture? If not → change to `[MG:]`.
2. Is it generic or specific? Generic → free platforms / Storyblocks. Specific → check the "Hard to Source" table.
3. Named person? → Wikimedia Commons press photo, accept a still.
4. Historical? → Library of Congress, National Archives, Archive.org first.
5. Chinese-specific? → Growing libraries on Pexels/Storyblocks for cities; named Chinese facilities and individuals are hardest.

If a footage call fails the source-check, rewrite the visual spec as MG or flag it with a `[SOURCING: HARD]` tag so the producer knows to budget extra time.

---

## Direction Annotations (`DIR:`)

Direction annotations control *how* visuals appear — camera movement, element choreography, timing, transitions, and atmosphere. They turn a flat visual specification into a directed sequence where the visuals respond to the narration.

**Full syntax reference:** See **DIRECTING_LANGUAGE.md** for the complete grammar, all five directive types, parameter tables, template support matrix, and JSON output examples. This section covers how direction integrates into the script format.

### Where direction goes

`DIR:` lines appear in the right column, immediately below the visual spec line they modify:

```
| The entire world's advanced chips    | **P1** · [MG:] ChoroplethMap · supply-chain.json · 12s |
| come from a single island.           | DIR: cam(wide → tight:Taiwan, sync:"single island", track) |
|                                       | DIR: reveal(sequential, per-phase:3s, settle) |
|                                       | DIR: hold(breathe) |
|                                       | DIR: mood(subtle) |
|                                       | DIR: cut(color-wash, ink) |
```

Each `DIR:` line contains one directive. Multiple directives stack — they address different dimensions (camera, reveal, timing, transition, mood) and don't conflict.

### The five directive types

| Directive | Controls | Example |
|-----------|----------|---------|
| `cam()` | Camera position, movement, zoom | `cam(wide → tight:Taiwan, sync:"single island")` |
| `reveal()` | How data elements appear | `reveal(stagger:300ms, hero:0, pulse)` |
| `hold()` | Extra time, pauses, delays | `hold(breathe)` or `hold(pre:1s, 2s)` |
| `cut()` | Transition to next composition | `cut(color-wash, ink, 0.7s)` |
| `mood()` | Background atmosphere and drift | `mood(dense, particles:20, drift:slow)` |

### When to direct

Not every visual needs direction. Target ~25% of compositions — the moments that matter:

- **Always direct:** P1 hero visuals, emotional peaks, register transitions, data reveals synced to narration words
- **Usually direct:** P2 supporting visuals carrying analytical weight, visual-first or counterpoint timing moments
- **Rarely need direction:** P3 ambient texture, title cards, simple quote/definition cards

For a 12-14 minute episode (~50 visual segments), expect ~20-35 individual `DIR:` lines across ~8-12 segments. If you're writing more than 4 `DIR:` lines on one composition, simplify.

### Narration sync — the key feature

The most powerful aspect of direction is syncing visual events to spoken words:

```
DIR: cam(wide → tight:Taiwan, sync:"single island")
DIR: reveal(hero:0, sync:"ninety-two", pulse)
DIR: hold(until:"but")
```

`sync:"word"` anchors a camera move or reveal to the moment that word is spoken. Before narration recording, timing is estimated at 150 WPM. After recording, Whisper produces frame-accurate timestamps that replace estimates.

### Direction and visual modes

Direction applies differently depending on the visual mode:

| Mode | `cam()` | `reveal()` | `hold()` | `cut()` | `mood()` |
|------|---------|------------|----------|---------|----------|
| `[MG:]` | ✅ (per template) | ✅ (per template) | ✅ | ✅ | ✅ |
| `[FOOTAGE:]` | ❌ (baked into footage) | ❌ | ✅ | ✅ | ✅ (tint, dim) |
| `[AI-GEN:]` | ✅ (scene brief) | ❌ | ✅ | ✅ | ✅ |
| `[ILLUST:]` | ❌ (static image) | ❌ | ✅ | ✅ | ✅ (atmosphere, dim) |
| `[LAYERED:]` | ❌ | ❌ | ✅ | ✅ | ✅ |

For `[AI-GEN:]`, `cam()` becomes natural-language camera direction in the generation brief (e.g., `cam(push-in, over:7s)` → "slow push-in over 7 seconds"). For `[MG:]`, the visual-spec skill translates `cam()` into the correct JSON shape based on the template's camera system (geographic for maps, canvas for diagrams, scroll for timelines).

### How direction flows downstream

```
Script (DIR: lines)
     ↓ visual-spec parses
Remotion JSON (_direction block)  ──→  Templates read via useDirection hook
     ↓ also feeds
AI-GEN briefs (camera/mood → prompt language)
ILLUST specs (mood → treatment selection)
FOOTAGE search terms (mood → tint/treatment hints)
Audio cue sheet (cut/hold/mood → transition SFX + texture hits)
     ↓ assembly manifest generator reads
Assembly manifest (holdAfter, preDelay, transitionOut, narrationGate)
```

Direction annotations in the script are the single source of truth for *how* the video is edited. Everything downstream executes those decisions deterministically.

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

## Scenario + Prediction Beat

Most episodes should include a forward-looking beat (typically the penultimate beat, before the closing). This operationalizes the Oracle identity direction and the speculative implications from the research brief (Section 9).

**What this beat does:** Takes the episode's structural analysis and pushes it forward — "if this pattern holds, here's what to watch for." This is what separates Parallax from retrospective analysis channels. The viewer doesn't just understand the past; they have a framework for watching the future unfold.

**Structure options (pick one per episode):**

1. **Named scenarios (most common).** Present 2-3 named scenarios with rough probabilities. Each scenario should follow from the episode's structural analysis and cross-domain connections. "If the Venice parallel holds — call it the Murano Scenario, maybe 40% — then watch for X. But if the COCOM parallel is more apt — the Boomerang Scenario, roughly 35% — then Y happens instead." Visuals: FrameworkDiagram or GameBoard showing scenario branches.

2. **Single falsifiable prediction.** When the analysis points clearly in one direction, state it directly with a timeframe and falsification criteria. "The structural incentives point toward X happening within 18 months. If Y happens instead, this thesis is wrong — and I'll tell you." Visuals: KineticTypography with the prediction + timeframe.

3. **Watch signals.** When the situation is too uncertain for scenarios, give the viewer 2-3 specific, observable things to track. "Here's what I'm watching: the next ASML earnings call, the Kalshi contract on [X], and whether [policy Y] gets renewed." Visuals: DataChart or text list.

**In all cases, include at least one "what would change my mind" moment.** This is the strongest credibility signal in the episode — it shows you're reasoning, not advocating.

**Angle memo decides:** The angle-memo step (before drafting) includes a "speculation budget" decision that determines which structure this beat uses and how far out the episode speculates.

---

## Beat Structure Template

Copy this for each beat:

```markdown
---

### BEAT [N] — [TITLE] ([start]–[end])

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| *Opening paragraph of narration...* | **P2** · [FOOTAGE:] "search terms" > "fallback terms" · Pexels · standard · background @ 35% · match narration |
|                                      | DIR: mood(subtle, drift:slow) |
| Continuation of narration with a key data point. | **P1** · [MG:] ChoroplethMap · Phase 1: highlight US allies blue · [ep01/choropleth-data.json] · 8s |
|                                                   | DIR: cam(wide → tight:Taiwan, sync:"single point", track) |
|                                                   | DIR: reveal(sequential, per-phase:3s, settle) |
|                                                   | DIR: hold(breathe) |
| *[Beat.]* | **TRANSITION** · 1s black · breathing room |
| Next paragraph where a quote lands. | **P1** · [MG:] KineticTypography · Quote: "Globalization is almost dead." — Morris Chang · amber accent · 4s hold |
|                                      | DIR: hold(land) |
|                                      | DIR: cut(dissolve) |
| The implication is staggering. | **P1** · [LAYERED:] FOOTAGE "Arizona desert construction" + KineticTypography "7% OF US DEMAND" · 5s |
|                                | DIR: reveal(count-up, sync:"seven percent", pulse) |
| Closing paragraph of beat. | **P3** · [FOOTAGE:] "semiconductor supply chain factory" · standard · background @ 30% · match narration |
```

Note: Only the P1/P2 hero moments carry `DIR:` lines. The P3 ambient closer uses template defaults — this is the right balance (~40% of entries directed in this beat).

---

## End-of-Script: Asset Summary Table

After all beats, include a consolidated summary. Start with a visual mode breakdown — this is the quick health check for pacing balance.

```markdown
## ASSET SUMMARY

### Visual Mode Breakdown
| Mode | Count | Est. Screen Time | % of Episode | Register |
|------|-------|-------------------|--------------|----------|
| [MG:] | 14 | ~5:30 | ~42% | Analytical |
| [FOOTAGE:] | 12 | ~4:00 | ~31% | — (real world) |
| [ILLUST:] | 4 | ~1:15 | ~10% | Atmospheric |
| [AI-GEN:] | 3 | ~1:00 | ~8% | Grounding |
| [LAYERED:] | 3 | ~0:40 | ~5% | Mixed |
| TRANSITION | 5 | ~0:35 | ~4% | — |

Target ranges: MG 40-55%, FOOTAGE 25-40%, ILLUST 5-15%, AI-GEN 5-15%, LAYERED 5-10%, TRANSITION 3-7%.
The three registers (Analytical/Atmospheric/Grounding) should all be present in most episodes. If any register is completely absent, the visual texture flattens. Footage is register-neutral — it provides real-world grounding but isn't part of the three-register system.

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

### Atmospheric Illustrations (Recraft — Register 2)
| # | Mode | Prompt | Style | Treatment | Use |
|---|------|--------|-------|-----------|-----|
| 1 | metaphor | "Technological dependency as tightening vise" | vector_illustration | standard | Beat 2 texture |
| 2 | illustration | "Surveillance state as panopticon factory" | vector_illustration | conflict | Beat 4 mood |
| ... | | | | | |

### AI-Generated Video (Register 3)
| # | Scene | Camera | Style-Ref | Tool | Treatment | Duration |
|---|-------|--------|-----------|------|-----------|----------|
| 1 | "Interior cleanroom, yellow light, bunny suits" | slow dolly | cleanroom-warm_v1.png | kling-3.0 | standard | 7s |
| ... | | | | | | |
```

The **Sourcability** column in the stock footage table maps to FOOTAGE_SOURCING.md's tiers: Easy (free/Storyblocks), Moderate (available with effort), Hard (archival or creative workaround needed). Any "Hard" entry should have a fallback plan noted.

---

## Workflow Integration

The two-column script replaces the current narration-only script in the pipeline:

```
Deep Research → research-audit → Script Draft (two-column + DIR:) → script-audit → persona-eval
                                       ↓
                                  Asset Summary Table
                                       ↓
                              ┌────────┴─────────────────────┐
                              ↓                              ↓
                        visual-spec                    asset-source
                        (Remotion JSON + _direction     (stock footage download
                         + AI-GEN briefs                + image processing)
                         + ILLUST specs
                         + footage manifest)
                              ↓
                        audio-spec
                        (3-layer cue sheet:
                         DIR: cut/hold/mood →
                         transition SFX + texture hits)
                              ↓                              ↓
                              └──────────┬───────────────────┘
                                         ↓
                                  generate_manifest.py
                                  (assembly manifest consumes
                                   _direction: holdAfter, preDelay,
                                   transitionOut, narrationGate)
                                         ↓
                                  Remotion Render + NLE Assembly
```

The script is the single source of truth: the left column is what Tiger says, the right column is what appears on screen AND how it's directed. Everything downstream executes those decisions.

The script-audit skill should check:
- Every narration paragraph has a corresponding visual spec with a mode tag
- No 5+ second gaps without visual direction
- P1 visuals exist for each beat's key moment
- Asset summary table is complete, including visual mode breakdown with register column
- Visual mode balance is within target ranges (MG 40-55%, FOOTAGE 25-40%, ILLUST 5-15%, AI-GEN 5-15%)
- No more than 3 consecutive `[MG:]` entries without a non-MG break
- No more than 2 consecutive `[ILLUST:]` or `[AI-GEN:]` entries without a mode switch
- No `[FOOTAGE:]` entries that fail the sourcability check (abstract concepts tagged as footage)
- `[LAYERED:]` entries have simple overlays (single stat, label, or highlight — not full charts)
- All three registers (Analytical, Atmospheric, Grounding) are represented across the episode
- Register transitions follow the transition grammar (see "Register transition grammar" above)
- `[ILLUST:]` entries are NOT data-carrying — anything the viewer needs to *read* belongs in `[MG:]`
- All P1 hero visuals carry at least one `DIR:` annotation (direction is mandatory for hero moments)
- Register transitions have explicit `DIR: cut()` specifying the transition type (don't leave register boundaries to defaults)
- `DIR: cam()` is only used on templates that support it (see DIRECTING_LANGUAGE.md template support matrix)
- `DIR: hold()` is present on data reveals and emotional peaks (these moments need breathing room)
- No compositions have more than 4 `DIR:` lines (over-directing — simplify)
- `sync:"word"` targets actually appear in the corresponding narration text

---

## Important Notes

- **The left column is Tiger's.** He reads it, he rewrites it, he owns the voice. Don't let visual planning contaminate narration quality.
- **The right column is the pipeline's.** It should be specific enough that a tool (or a person) can source every asset without interpretation.
- **Stock footage search terms should be ranked.** Most specific first, most generic last. The sourcing tool tries them in order.
- **Treatment defaults to "standard" and composite defaults to "background @ 35%."** Only specify when different.
- **"Match narration" is a valid duration.** The assembly step will sync visual timing to audio timestamps.
- **`[AI-GEN:]` is for unsourceable physical spaces; `[ILLUST:]` is for emotional texture.** Don't confuse them. AI-GEN renders realistic scenes with mannequin figures. ILLUST renders stylized constructivist art for mood and conceptual weight. Neither replaces footage — they complement it for subjects cameras can't capture.
- **Visual mode tags are mandatory.** Every right-column entry should carry `[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, or `[ILLUST:]`. These tags route work to the correct downstream tool and enable automated pacing checks. See the Visual Modes section above.
- **Direction annotations are optional but expected on hero moments.** `DIR:` lines control camera, reveals, timing, transitions, and mood. They're mandatory on P1 hero visuals and register transitions, recommended on P2, and rarely needed on P3. See the Direction Annotations section and DIRECTING_LANGUAGE.md for full syntax.
- **The script IS the edit.** After direction annotations are added, no directing decisions happen outside the script. If it's not in the script, it doesn't happen. This makes revision clean — change the script, the visual direction changes with it. Everything downstream (visual-spec JSON, AI-GEN briefs, audio cues, assembly manifest timing) executes the script's decisions deterministically.
- **The visual mode breakdown is a pacing diagnostic.** If the numbers look off (too much MG, too little footage), restructure the visual column before passing to visual-spec. It's much cheaper to rebalance now than to re-source footage later.
- **Consult FOOTAGE_SOURCING.md before writing footage specs.** The sourcability tables tell you what's actually available. Writing a `[FOOTAGE:]` spec for something that doesn't exist in stock libraries wastes everyone's time — use `[MG:]` instead and design a motion graphic that communicates the same thing.
