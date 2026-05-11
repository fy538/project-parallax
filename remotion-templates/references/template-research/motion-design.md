# Motion Design for Editorial Video — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.
>
> Not a per-template dossier — this is a cross-cutting research artifact covering motion conventions across all templates. Read in conjunction with `POLISH.md` Editorial Doctrine (especially the substrate-motion-identity decision) and the per-template dossiers.

## 1. The editorial purpose of motion

Motion in editorial video does three things narration cannot:
1. **Reveals structure sequentially** — showing relationships build, not just exist
2. **Directs attention** — the eye follows motion before it follows text
3. **Encodes time** — a line drawing left-to-right is itself an argument about chronology

**Motion is gratuitous when:** it merely decorates a static fact. When narration already states "GDP rose 4%" and an animated number rolls up to 4%, motion is redundant.

**Motion is essential when:** it carries information the still cannot — cause-and-effect (A moves, then B responds), comparison emerging from accumulation (bars rising in sequence reveals which crossed the threshold first), geographic flow (arrows tracing a supply chain no static map shows).

**NYT video team's rule:** motion exists to **show change**, not to show that the producer can afford After Effects.

## 2. Canonical motion patterns

### a. Draw-in with terminal label
- **NYT Visual Investigations** "Day of Rage" 2021
- **FT** Climate Graphic Detail series

A line chart draws left-to-right over 600–1200ms; the value label fades in at the terminal point on settle.

*Used when:* the *trajectory* is the argument. *Wrong when:* comparing two unrelated series — viewer can't watch both draw simultaneously.

### b. Ribbon glide on Sankey / flow diagrams
- **Bloomberg Originals** "How China Built..." 2023
- **Pudding** video adaptations

Flow paths animate width-first along their stroke at 800ms–1.4s, easing out.

*Used to show:* volume of movement. *Wrong for:* static categorical relationships.

### c. Editorial type slide-in
- **FT Video**
- **Economist** "Drone Wars" series 2024

Headline-weight type enters from off-screen (usually 40–80px), settling on a baseline grid in 350–500ms with `ease-out-quart`.

*Used for:* chapter markers, pull-quotes, attribution. *Wrong for:* body labels — they should fade, not slide.

### d. Pulse on landing
- **Economist Video Graphics** 2022–present

Data point lands, then pulses once (scale 1.0→1.08→1.0) over ~400ms.

*Used to:* confirm an arrival — "this is the point you should look at." *Wrong if:* it continues pulsing; one pulse is punctuation, repeated pulse is anxiety.

### e. Morphing geography
- **Pudding** "Human Terrain" 2018
- **Kurzgesagt** territorial sequences

A country/region shape tweens between historical boundaries over 1.5–3s.

*Used when:* the shape itself is the story. *Wrong as:* a transition; only correct when the morph is the point.

### f. Ken Burns with diagram overlay
- **Wendover Productions**
- **Real Life Lore**

A 3–6% scale push over 8–12 seconds on a still photo, with vector annotations fading in on the static layer above.

*Used to:* keep archival material alive under sustained narration. *Wrong above:* 6% — at 8%+ the artifact becomes visible and the register cheapens.

## 3. Timing and rhythm conventions

**The canonical reveal envelope for editorial work is 400–800ms.**
- Below 250ms: registers as a cut, not a reveal
- Above 1.2s: viewer's attention has already moved on
- Line draws are the exception: 600–1500ms is normal because the act of drawing is the information

**Pace by frame length:**
- 10-second editorial frame: supports one primary reveal + one secondary
- 60-second exploratory frame: supports a build of 4–6 staged reveals at ~8s intervals

**Narration sync is the master clock.** Elements should land on stressed syllables, never between them.

### The "anticipatory reveal" rule

**The Economist video team times reveals to start ~150ms BEFORE the narrator names the thing**, so the element is *settled* (not landing) when the word arrives. This is the single most professional move in the format.

## 4. Easing curves

| Easing | When to use |
|---|---|
| `ease-out-cubic` / `ease-out-quart` | **Editorial default** — fast departure, soft arrival, mimics physical settling |
| `ease-in-out` | Continuous traversals (camera pan, sustained morph) |
| `linear` | Mechanical motion only (clock hands, tickers, anything diegetically uniform) |
| Springs (>1.0 overshoot) | Almost never. Only for percussive physical-impact emphasis (rarely in editorial) |

### Forbidden in editorial register

- **Bouncy springs** (>1.0 overshoot)
- **Elastic**
- **Back-ease**
- **Anticipation curves**

These belong to product UI and children's content; they read as enthusiasm, which is the opposite of authority. **3Blue1Brown** uses smooth-step almost exclusively. **CGP Grey** uses near-linear with hard cuts. **Polymatter** uses `ease-out` and almost nothing else. None of them bounce.

## 5. Recommendation for Parallax

### The substrate-motion identity is correct and uncommon — keep it.

**Polymatter** and **FT Video** both demonstrate that intellectual register tolerates very little element motion when narration is dense; the page must feel alive through ambient means (grain, drift, light wobble) so that *deliberate* element motion reads as significant. The instinct to make the substrate breathe while elements hold is the same instinct behind Polymatter's static-with-cinemagraph aesthetic and the Economist video team's "settled page" philosophy.

### Refinements

- **Elements should fade in, not slide in**, with one exception — *chronological elements* (timeline events, sequential data points) may draw or extend in their reading direction, because the motion *is* the chronology.
- **No element should animate after revealing** except:
  - A line chart's one-time draw-in, which is itself the reveal
  - The single-pulse confirmation on a data point the narrator just named
- **Hold otherwise.**

### Sync to narration always.

Independent motion schedules read as PowerPoint. Use the **150ms-anticipatory rule**: motion completes at the named word, not after it.

### Default timings

| Element | Duration | Easing | Notes |
|---|---|---|---|
| Static element entrance | 350ms | `ease-out-quart` | Opacity fade, no movement vector |
| Line chart draw-in | 800ms | `ease-out-cubic` | Label fades in at 600ms |
| Sankey/flow ribbon | 1200ms | `ease-out-cubic` | Single pass, no loop |
| Type slide-in (headline only) | 400ms | `ease-out-quart` | Body labels just fade |
| Pulse on landing | 400ms | sine | Scale 1.0→1.08→1.0, one pulse only |
| Ken Burns | 8–12s | `linear-ok` | Scale change ≤6% |

## 6. Failure mode flags (always catch in audit)

- Bouncy or elastic easing on any chart, label, or diagram entrance
- Multiple independent elements animating simultaneously in a single frame (the "busy moment")
- Ken Burns scale change exceeding 6% or running longer than 12s
- Reveal duration unmatched to narration — element lands 800ms after the narrator named it, or 1.5s before
- Continuous post-entrance motion (pulsing, breathing, drifting) on data elements
- Slide-in entrances on body labels or annotation text (only headline-weight type earns slide)
- Number roll-ups that duplicate narrated values
- Linear easing on anything that isn't mechanically uniform
- Reveals shorter than 250ms (reads as cut) or longer than 1.5s (reads as lag) outside the line-draw exception
- Transitions between frames using motion instead of cuts (editorial cuts; it does not wipe)

## 7. Current template alignment

The existing animation utilities + substrate motion system:
- ✅ Substrate motion identity (grain + drift + sub-pixel wobble) — aligned with canon
- ✅ `useCompositionAnimation()` provides Ken Burns drift + exit fade
- ✅ Most templates use `fadeIn` + `slideIn` from `utils/animation.ts`
- ✅ POLISH.md A1 lint rule catches linear interpolation without easing
- ✅ Linear suppression via `// linear-ok:` comment

**Diverges from canon:**
- ~~No documented `anticipatoryReveal()` helper for narration-synced timing~~ → **built May 11, 2026**. `anticipatoryReveal(frame, narrationCueFrame, settleFrames?, anticipateFrames?)` in `utils/animation.ts` returns opacity 0→1 settling 5 frames (150ms) before the cue. Sibling `anticipatoryStartFrame()` returns the start frame for use with `fadeIn`/`slideIn`/`scaleReveal` etc. Unit-tested.
- Slide-in is used on body labels in some templates (canon says fade-only for body)
- Default entrance is `sec(0.4)` = 12 frames at 30fps ≈ 400ms — already aligned with canon's 350ms ✓
- Some templates have continuous post-entrance pulse/breathe on data elements

## 8. Specific upgrades proposed

1. **Document the substrate-motion-identity decision** in POLISH.md or BRAND.md as the canonical motion philosophy. Already implemented; needs codification.
2. **Audit slide-in usage on body text.** Body labels should fade, not slide. Find and fix templates using `slideIn` on body-weight text.
3. ~~**Anticipatory reveal helper.** Add `anticipatoryReveal(frame, narrationCueFrame, settleFrames=12, anticipateFrames=5)` to `utils/animation.ts` — wraps `fadeIn` with the 150ms-pre-narration timing.~~ **Done — May 11, 2026.** `anticipatoryReveal()` and `anticipatoryStartFrame()` shipped in `utils/animation.ts`; covered by `src/__tests__/anticipatoryReveal.test.ts`. Adoption next: thread through templates as narration cues come online via Whisper-resolved sync points (see `useBeatSync` integration pattern).
4. **Continuous-motion audit.** Find templates with `Math.sin(frame * 0.X)` or similar continuous pulse on data elements. Replace with single-pulse-on-landing.
5. ~~**Document forbidden easings** in POLISH.md A1 expansion. Currently A1 catches "no easing"; add "bouncy/elastic/back-ease forbidden in editorial register."~~ **Done — May 11, 2026.** Shipped as `polish_lint.py` rule **A2 — Forbidden easing (bounce/elastic/back)**. Catches `Easing.bounce`, `Easing.elastic(...)`, `Easing.back(...)` and asks for `ease-out-cubic/quartic` instead. Suppression via `// easing-ok: <reason>`. 51/51 templates clean today; rule prevents future regressions.

## TL;DR

**Parallax's motion register:** substrate-alive, elements-held, reveals-anticipatory.

**Default reveal animation:** 350–400ms opacity fade with `ease-out-quart`, landing 150ms before the narrator names the element. Line charts draw in 800ms with `ease-out-cubic`.

**Forbidden patterns:** bouncy/elastic easing, slide-in body labels, continuous post-entrance motion on data elements, Ken Burns above 6%, multi-element simultaneous entrances, motion not clocked to narration.
