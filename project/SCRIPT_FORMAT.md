# Parallax — Two-Column Script Format

## Purpose
The production script format for Parallax episodes. Every script serves two audiences simultaneously: **Tiger** (who reads the left column aloud) and **the production pipeline** (which executes the right column into rendered video). A script isn't done until both columns are complete.

Created: April 26, 2026
Updated: May 4, 2026

**Related docs:**
- **VISUAL_LANGUAGE.md** — *when* to use footage vs. motion graphics vs. both. Read that first for the editorial logic.
- **DIRECTING_LANGUAGE.md** — *how* to direct camera, reveals, timing, transitions, and mood via `DIR:` annotations. The complete syntax reference.
- **PACING_SYSTEM.md** — proportional camera paths, Whisper sync loop, and `PACE:` visual density annotations. The timing coordination spec.
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

The right column carries five mode tags for production granularity, but conceptually these collapse to **three content types** (per VISUAL_LANGUAGE.md → "The Three Content Types"): Remotion (analytical), AI-generated (constructivist illustration in atmospheric or grounded role), and Footage (real-world capture — archival or screen recording). The three-type model is the simpler mental map for script-drafting; the five tags below encode editorial role distinctions even when the underlying content type is shared.

Tag each entry to make the mode explicit — downstream tools (visual-spec, asset-source, assembly) parse these tags to route work correctly.

### Mode tags

- **`[FOOTAGE:]`** — non-substitutable real-world capture. Two sub-types:
  - `[FOOTAGE: archival]` (default if unspecified) — stock video, archival imagery, or a held photograph of named real figures or specific real events. Roosevelt signing the embargo, Xi Jinping at a party congress, real news moments. Sourced from Pexels / Pixabay / Unsplash for general-purpose footage; from Wikimedia Commons / Library of Congress / public domain archives for named historical figures and specific events.
  - `[FOOTAGE: screen]` — screen recordings of actual software interfaces or product UIs. ChatGPT running, DeepSeek's chat UI, a Bloomberg terminal, an actual model output. Captured rather than generated; carries documentary credibility unique to "I literally ran this." Treatment preserves UI legibility — slight grain to match treated footage tonally, vignette to focus on the relevant region, NEVER full duotone (the UI must remain readable). Used for tech-heavy episodes covering AI products, software, financial tools, real interfaces.

  This is the default for establishing context, story beats, breathing room, and emotional landing. **Post-May 4 displacement principle:** generic stock footage (cleanrooms, skylines, trading floors not depicting specific real moments) should mostly be replaced by AI-generated atmospheric or grounded scenes — they're more brand-distinctive. Reserve `[FOOTAGE:]` for the non-substitutable archival and screen-recording cases.

- **`[MG:]`** — motion graphic only. The viewer sees a Remotion template (chart, map, framework, typography card). No footage underneath. Code-locked, brand-perfect, exactly repeatable. This is the default for data reveals, structural arguments, geographic arguments, and definitions.
- **`[LAYERED:]`** — footage with MG composited on top. A key stat over cleanroom footage, a label over an aerial shot, a highlight outline over satellite imagery. Composition pattern combining `[MG:]` and `[FOOTAGE:]`, not a separate content type. Use sparingly (2-3 per beat max) — the technique loses punch through overuse.
- **`[AI-GEN:]`** — AI-generated grounded scene (Register 3: Grounding). Constructivist figurative illustration with planar-faceted figures (4-5 color-blocked face planes, eyes obscured, no rendered features) drawing on Rodchenko's 1924 portrait series and Lissitzky's Self-Portrait. Used for physically real but unsourceable spaces (restricted facilities, historical reconstructions, conceptual scenes made literal). Reference frames generated via `tools/recraft/recraft.py --register grounding --realism balanced --text-treatment <tradition>`; animated clips via Kling 3.0 / Sora 2 from reference frames at `realism: flat` (animation-flat rule per VIS-09); all assets passed through `treat_video.py` brand treatment. Never for named individuals or claimed specific events. See AI_VIDEO_PIPELINE.md for full spec.
- **`[ILLUST:]`** — AI-generated atmospheric backdrop (Register 2: Atmospheric). Same constructivist illustration vocabulary as `[AI-GEN:]` but used as background mood at 30-40% opacity behind narration, rather than as foreground figurative scene. Carries civilizational weight, industrial dread, conceptual scale. Generated via Recraft V3 API (`tools/recraft/recraft.py --register atmospheric`), output as SVG/PNG, passed through duotone brand treatment (`--treat standard|conflict|editorial` per VIS-10 pairing rules). NOT data-carrying — use `[MG:]` for anything the viewer needs to *read*. Combined with `[AI-GEN:]` they share constructivist visual language; differ only in editorial role (background mood vs. foreground scene). See VISUAL_LANGUAGE.md "Three Visual Registers" and "Three Content Types" sections.

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
- `[AI-GEN:]` should account for 5-15% of episode runtime (~40-120 seconds per 13-minute episode).
- `[ILLUST:]` should account for 5-15% of episode runtime (~40-120 seconds per 13-minute episode).
- Combined `[AI-GEN:]` + `[ILLUST:]` target: 15-30% of episode runtime per VIS-01 (post-May 4 calibration). The displacement principle: generic stock footage that previously filled "real-world wallpaper" should mostly move to atmospheric or grounded AI-generated content, since those are more brand-distinctive and culturally specific per the per-episode emphasis architecture.
- `[FOOTAGE:]` post-calibration target: 15-25% of episode runtime, weighted heavily toward archival of named figures/real events plus `[FOOTAGE: screen]` for software interfaces. Generic stock should be the exception, not the default.

### Visual density annotations (`PACE:`)

`PACE:` lines control how fast visuals change within a section. They sit in the visual column on their own row (empty narration column, like `DIR:` continuation lines) and apply to all subsequent rows until the next `PACE:` line.

Three profiles are available:

| Profile | Multiplier | Visual change rate | When to use |
|---------|-----------|-------------------|-------------|
| `PACE: urgent` | 0.7× | Faster cuts, compressed holds | Crisis escalation, rapid-fire evidence, tension building |
| `PACE: analytical` | 1.0× | Default rate (~3-5s absorption window) | Data analysis, argument construction, standard narration |
| `PACE: breathing` | 1.4× | Slower transitions, extended holds | Emotional peaks, reflection moments, philosophical pauses |

**How it works:** When no explicit visual duration is specified (e.g., "match narration"), the PACE multiplier scales how long a visual stays on screen. "Breathing" holds visuals 40% longer; "urgent" cuts 30% faster. Explicit durations (e.g., "8s") are never modified — PACE only affects duration-unspecified segments.

**Format in script:**

```
|                                      | PACE: breathing |
| The weight of that number settles... | **P1** · [MG:] StatReveal · "92% Yield" · amber · [ep01/stat-yield.json] |
|                                      | DIR: reveal(count-up, sync:"ninety-two", pulse) |
|                                      | DIR: hold(land) |
| ...three more rows at breathing pace... | ... |
|                                      | PACE: analytical |
| But the economics tell a different story. | **P1** · [MG:] DataChart · cost comparison · [ep01/chart-cost.json] · 8s |
```

**Guidelines:**
- Default is `analytical` — don't write `PACE: analytical` at the start of every beat.
- Use 2-4 PACE changes per episode. More than that defeats the purpose — it should mark structural shifts, not individual shots.
- `PACE: breathing` pairs naturally with `DIR: hold()` and `DIR: mood(dense)` — slow pacing + held visuals + atmospheric mood creates the "let it sink in" effect.
- `PACE: urgent` pairs with quick cuts and minimal direction — the speed itself is the editorial signal.
- PACE affects the assembly manifest's duration estimates. In Whisper mode (post-recording), actual narration timing takes precedence but PACE still scales visual holds.

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

## Psychological Architecture of the Narration

The narration column must satisfy four structural requirements grounded in the six-report psychology
synthesis at `project/psychology/SYNTHESIS.md`. These determine whether the audience enters the
right cognitive state for belief updating, stays through the episode, and returns for the next one.

### Cold Open: Four-Beat Structure

Every cold open must hit these four beats in order, within the first 90 seconds:

1. **Schema** — Activate a prior belief the audience already holds. ("You probably think X is true.")
2. **Violation** — Introduce a case that should not fit that belief. ("But this happened — and it shouldn't have.")
3. **Narrowing** — Reduce the puzzle to one closeable unknown. ("The real question isn't whether X. It's why the system produced X.")
4. **Solvability promise** — Signal the route to closure, explicitly. ("By the end of this, you'll have the framework.")

Do not open with topic announcement, context, or definitions. The viewer must feel the gap before
receiving any information. The solvability promise is mandatory — without it, anxiety tips into
avoidance rather than inquiry.

**Emotional target:** diagnostic unease, not ambient doom. One destabilizing contradiction with
concrete stakes. Not a montage of threats.

**What to avoid:** stacking multiple threats in the cold open (anxiety overshoots the productive range);
enthusiasm hooks ("this is so fascinating") which reinforce existing loyalties instead of activating
the inquiry state needed for genuine belief updating; framing events as someone's fault (anger
activation) rather than something that doesn't add up (anxiety/surveillance activation).

### Emotional Arc

The episode must follow this sequence:

- **Cold open → ~3 min**: Bounded anxiety. One broken expectation. Concrete stakes. Framework promise
  within the first 60–90 seconds.
- **~3–12 min**: Anxiety converted to inquiry. Each beat closes a local question and opens a deeper
  one. Viewer stays in the surveillance/inquiry state through structured uncertainty — not sustained dread.
- **~12 min → close**: Restored epistemic efficacy. The viewer can now track this class of problem
  more intelligently.

**Terminal emotional state determines viewer behavior:**

| End state | Primary behavior |
|---|---|
| Calm competence + trust + mild curiosity | Subscribe |
| High arousal + "this explains what others are missing" | Share |
| Unfinished curiosity under trust | Return visit |
| Lingering dread without resolution | Disengage |

Design each episode knowing which behavior it needs to drive. The default target is subscribe (launch
episodes, first-in-arc episodes). Viral/share episodes should escalate arousal at the main insight
beat and close sharply. Arc-mid episodes should end with the unfinished-curiosity state.

### Assertive Calibration Language

Conclusions and analytical claims must use assertive calibration, not hedging.

**Avoid (hedge-as-analysis):**
- "Maybe this explains..." / "Perhaps..." / "It's complicated" / "Who knows" / "Only time will tell"

**Use instead:**
- "The most defensible reading is..."
- "What the evidence supports strongly is..."
- "What remains open is..."
- "The highest-uncertainty variable here is..."
- "Three developments would change this assessment."

These phrasings deliver closure at the level of model boundaries — satisfying the audience's need
for structure without overclaiming on facts. Confidence attaches to the analytical procedure, not
to specific predicted outcomes. This is the defining voice register of Parallax.

**The anger/anxiety check:** Scan every causal framing. "Something doesn't add up here — the
structural incentives produced this outcome" activates the surveillance/inquiry system. "Here's who
is responsible for this" activates the anger/grievance system (punitive information seeking, closed
to updating). Parallax exclusively uses structural/incentive framing. Every causal claim should
point to mechanisms and incentive structures, never to coordinated intent of hidden agents.

### Bounded Verdict Close

The final beat must deliver a bounded verdict — not "only time will tell" and not false certainty.

**Three-part structure:**
1. **Best current reading** — the strongest interpretation the evidence supports, stated assertively
2. **Confidence boundary** — where the model holds and where it fails
3. **Watchpoints** — 2–3 specific, observable developments that would force a revision

This gives procedural closure (I now know how to think about this class of problem) while preserving
factual honesty (the specific outcome remains uncertain). The watchpoints convert passive viewers
into active pattern-watchers — which is the correct definition of what Parallax delivers.

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
