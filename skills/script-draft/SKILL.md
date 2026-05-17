---
name: script-draft
description: >
  Draft a two-column production script (narration + visual specs + direction annotations) from a research brief and angle memo using a 3-phase process: narration draft, radio edit test, then visual + direction layer addition. Use whenever someone asks to 'draft a script', 'write the script', 'script this episode', 'turn the brief into a script', 'start scripting', 'ready to script', or when an angle memo exists and the next pipeline step is scripting. Output follows SCRIPT_FORMAT.md with visual mode tags ([FOOTAGE:], [MG:], [LAYERED:], [AI-GEN:], [ILLUST:], [SCENE:], [ARCHIVAL:], [FORECAST:], [BACKDROP: id], [OVERLAY: preset]) and DIR: annotations for camera, reveals, timing, transitions, and mood. This creates scripts — distinct from script-audit (which reviews them) and angle-memo (which plans the narrative strategy).
---

# Script Drafting Skill

You are drafting a Parallax production script — a two-column document where the left column is narration Tiger reads aloud and the right column is a complete visual production spec with directing annotations that feeds the downstream pipeline (visual-spec, asset-source, audio-spec, assembly manifest).

The script is the single source of truth for both content and direction. Everything downstream executes the script's decisions deterministically — if it's not in the script, it doesn't happen.

The script must work as a story first and a document second. The viewer should feel like a co-investigator discovering a hidden structure, not a student receiving a lesson.

## Doctrine: Backstage Maximum, Frontstage Confident

You are writing the **frontstage** half of the Parallax editorial doctrine. By the time you're drafting, research-audit has already verified every quote, date, number, and named source. That's the backstage rigor. Your job is to write narration that *acts like the verification has already happened* — confident voice, vivid metaphor, bounded analogies that name their limit in one sharp clause and move on. Not hedge-stacked, not verification-narrating, not consensus-smoothing.

Two operational consequences:

**Bounded analogy is the signature form.** *"This analogy is useful here, misleading there, dangerous if overextended."* Setup the structural pattern confidently → name where it breaks in one sharp clause → return to the argument. This is the form that differentiates Parallax from civilizational-prophecy channels (Whatifalthist/Zeihan/Jiang) and pure briefing channels (CaspianReport/TLDR). Don't kill a strong analogy because it has a flaw; name the flaw and move on. The bounded clause is one of the most concentrated places confidence and rigor coexist — it should be present and crisp, never apologetic.

**Herzog's "ecstatic truth" license.** Vivid metaphor and evocative imagery are *allowed and encouraged* when they serve emotional clarity, not when they strain literal accuracy. The stormy-sea shot for "technological anxiety" is fine; a fabricated quote attributed to Schelling is not. The license is earned by the rigor — backstage discipline is what entitles the script to be vivid. Don't squander the license by replacing strong metaphor with literal description out of misplaced caution.

**What the doctrine forbids in narration** (script-audit Lens 10 will catch these):
- Layered hedging — "some scholars have argued, with appropriate qualifications, that this might possibly suggest…"
- Verification-process narration — "verified as of [date]," "according to my research," "I confirmed this with three sources"
- False-consensus framing — narrating a contested interpretive claim as settled fact (or vice versa)

See [`episodes/EDITORIAL_PLAYBOOK.md`](../../episodes/EDITORIAL_PLAYBOOK.md) → Core Doctrine and [`project/PROJECT_VISION.md`](../../project/PROJECT_VISION.md) → "Bounded Analogy: The Signature Form" for the full doctrine.

## Before You Start

Read these files in order. Each one gives you something specific:

1. **The research brief** — the raw material (facts, claims, counterarguments, sources)
2. **The angle memo** — the narrative strategy (cold open, named concept, emotional arc, cross-domain connections, visual arc, decoder framing)
3. **EDITORIAL_PLAYBOOK.md** (`/episodes/EDITORIAL_PLAYBOOK.md`) — sections 1-4. These are hard-won production rules. Every rule exists because ignoring it cost revision cycles.
4. **SCRIPT_FORMAT.md** (`/project/SCRIPT_FORMAT.md`) — the exact output format. Your script must match this spec precisely.
5. **VISUAL_LANGUAGE.md** (`/project/VISUAL_LANGUAGE.md`) — editorial logic for visual decisions. Tells you *when* footage vs. MG vs. layered vs. AI-GEN vs. ILLUST is the right call. Includes the three-register visual system.

   **Template-picker companion docs (consult per `[MG:]` cell — not optional):**
   - `/remotion-templates/references/template-picker.md` — the 1,170-line encyclopedia: "I need to show X" → template + variant + alternatives.
   - **Family SELECTORs** (decision trees + sibling-disambiguation tables + canonical failure modes). Read the SELECTOR for the family you're picking from BEFORE committing to a template:
     - Maps → `/remotion-templates/MAP_TEMPLATE_SELECTOR.md` (e.g. ChoroplethMap fails on count data → ProportionalSymbolMap; AtlasPlate is the default for editorial work).
     - Charts → `/remotion-templates/CHART_TEMPLATE_SELECTOR.md` (BumpChart vs RankChangeDotPlot vs DumbbellPlot — all rank-change idioms with distinct fits).
     - Diagrams → `/remotion-templates/DIAGRAM_TEMPLATE_SELECTOR.md` (SankeyFlow vs FrameworkDiagram-flow vs NetworkDiagram — flow vs structure vs relationship).
     - Timelines → `/remotion-templates/TIMELINE_TEMPLATE_SELECTOR.md` (HorizontalTimeline vs TimelineComparison vs DualTimeline — single vs parallel vs juxtaposed).
     - Typography → `/remotion-templates/TYPOGRAPHY_TEMPLATE_SELECTOR.md` (KineticTypography variants, StatReveal, TitleTransition).
   - **Per-template dossier** at `/remotion-templates/references/template-research/<template-name>.md` (50 files) — real-outlet idioms (NYT Upshot, FT, Economist, Bloomberg, Reuters, Pudding), canonical use cases, Parallax-specific defaults, known failure modes. Skim the dossier for any template you're tempted by.

   **Template-selection self-check** (mandatory, runs before script handoff): for every `[MG:]` cell, the writer has consulted the family SELECTOR and the template's dossier. The picker docs are load-bearing because `visual-spec` is mostly a transcriber of your choice; `script-audit` and the family audit skills are a safety net, not the front line. Picking wrong here costs a re-spec cycle.
6. **DIRECTING_LANGUAGE.md** (`/project/DIRECTING_LANGUAGE.md`) — the `DIR:` annotation syntax. Tells you *how* to direct camera, reveals, timing, transitions, and mood. Read the five directive types, template support matrix, and density guidelines. Note `DIR: drift(<preset>)` and `DIR: hold(stillness)` directives (added May 16, 2026) for per-segment hold-beat motion overrides — most segments don't need either; reach for them only when a beat's editorial intent diverges from its template's canonical register (e.g., a memorial moment on a normally-editorial chart should use `DIR: hold(stillness)`). The full hold-beat register is in `project/HOLD_MOTION_REGISTER.md`. Transition directives (`DIR: cut(<type>)`) follow the transition grammar in `project/TRANSITION_GRAMMAR.md` — six canonical types (cut, dissolve, fade, match-cut, color-wash, iris), six deprecated types (wipe-*, blur-through, whip-pan, spatial-zoom). Most seams should omit `cut()` entirely and let the implicit-default engine handle them; reach for an explicit `cut()` only for register shifts, civilizational-rupture iris moments, match-cut opportunities, and chapter/silence beats. When using color-wash always include the color token: `DIR: cut(color-wash, ink)`. `DIR: chapter("TITLE")` sugar expands to a `TitleTransition` segment automatically.
7. **FOOTAGE_SOURCING.md** (`/project/FOOTAGE_SOURCING.md`) — sourcability tiers. Tells you what footage actually exists before you spec it.
8. **JIANG_NARRATIVE_RESEARCH.md** (`/project/JIANG_NARRATIVE_RESEARCH.md`) — the 12 extractable techniques and the toxin line. The narrative posture reference.
9. **CALIBRATION_LANGUAGE.md** (`/project/CALIBRATION_LANGUAGE.md`) — the assertive calibration vocabulary. Read before drafting any speculative or predictive narration. Levels: quantified probability (best) > verbal calibration with explicit boundaries (acceptable) > vague uncertainty phrases (never). Process certainty + outcome humility split: be assertive about the analytical method, humble about specific predicted outcomes. For any `[FORECAST:]` segment, use the 6-layer format from this document.

Also check whether a previous script version exists for this episode. If it does, read it — learn what worked and what didn't from the revision log.

## Discovery Shape Awareness

The angle memo may identify a **discovery shape** (from CONTENT_IDENTITY.md Entry Point 3) that influenced the narrative arc. If present, the shape affects all three drafting phases. Here's what to watch for in each:

| Shape | Phase 1 (Narration) tendency | Phase 2 (Radio Edit) watch-for | Phase 3 (Visual) tendency |
|-------|------------------------------|-------------------------------|--------------------------|
| **Actor-Constraint** ("Map the Trap") | Outside-in spiral — open with apparent irrationality, tighten through successive constraints. Each beat closes an exit. | Listen for whether the viewer feels *inside* the trap by beat 3-4. If the actor still feels distant, the spiral hasn't tightened enough. | Decision trees showing eliminated options. Motif: closing/shrinking element. Heavy on maps of the actor's territory/context. |
| **Mechanism** ("Peel the Onion") | Progressive revelation — each beat strips one layer. Beats go deeper, not wider. | Watch for "lecture drift" — mechanism episodes have the highest risk of becoming explanations instead of revelations. Each layer peel should feel like a surprise, not a lesson. | Highest MG density. Diagrams that complexify across the episode. Plan *extra* footage anchoring (the mechanism wants to be all diagrams — resist). |
| **Convergent Drift** ("Parallax View") | Accumulation then reveal — mini-narratives from independent cases, then the structural force. Each case should be a story, not just an example. | Listen for whether each case feels like a *story* with a person in it, or just a data point. The cases need human moments to avoid becoming a list. | Most visually varied — different countries/contexts give natural footage diversity. Maps central. Motif accumulates across cases. |
| **Inversion** ("Flip the Model") | Build then break — steelman first, break second. The pivot is the most important structural moment. | Listen for whether the standard model gets enough airtime to feel solid before you break it. If the break comes too early, it feels like debunking. If too late, the build drags. The pivot should land at ~40-50% of runtime. | Before/after visual structure. Strong counterpoint at the break point. Motif transforms at the pivot (standard model diagram → corrected model). |
| **Conspicuous Silence** ("Name the Unspoken") | Negative space then revelation — establish adjacent discourse first, then notice the gap. The naming is the climax. | Listen for whether the silence feels *strategic* (interesting) or just neglected (boring). The narration must make the viewer feel the social/political pressure maintaining the silence. | Counterpoint-heavy. More atmospheric footage, lower MG density. Motif: absence that fills, or redaction that lifts. |
| **Second-Order** ("Follow the Thread") | Agreement then extension — validate first-order analysis, then pull further. First half is familiar; second half is the Parallax contribution. | Listen for whether the first-order section is too long (steals time from the insight) or too short (the extension feels unsupported). Target: ~40% first-order, ~60% second-order and consequences. | Causal chain diagrams (A → B → C). Visual-first at the second-order reveal. Motif: extending chain or zooming-out map. |

If no discovery shape is tagged, ignore this section — the standard drafting guidance below is complete on its own.

## The Drafting Process

Work in three phases. Don't skip ahead — the narration must stand on its own before you design visuals for it.

### Phase 1: Narration Draft

**Organize by tension, not by logic (NAR-01).** Your beat structure should come from the angle memo's emotional arc. Each beat tightens a question. If you catch yourself organizing information by topic ("first the history, then the present, then the analysis"), you're writing an essay. Restructure around what makes the viewer lean forward.

**The first 30 seconds (NAR-10).** Open with the angle memo's cold open approach. The viewer must feel personally implicated immediately — a stakes-shock, a provocation, or a contradiction. Not context. Not definitions. Not "To understand X, we first need to cover Y." The brief's most surprising finding often makes the best opener.

**Decoder posture throughout (NAR-09).** You're revealing a hidden structure, not explaining a known topic. Frame the episode as "here's the pattern nobody's connecting" rather than "here's what happened and why." Introduce frameworks inductively — walk the viewer through the analysis, then name the framework. Never open a beat with a definition.

Specific posture moves:
- "As it turns out..." not "Let me explain..."
- Show the contradiction first, then decode it
- Imply the viewer is smart enough to see this pattern once pointed to it
- Deflate authority periodically (NAR-11's humility valve)

**Named conceptual product (NAR-11).** The angle memo names the core concept. The name must appear **at least 3 times in the narration text** (not just in beat titles), with each mention carrying more weight than the last. This is one of the most important shareability drivers — if a viewer can't summarize your insight in 3 words to a friend, the episode hasn't produced a portable idea.

Thread it like this:
- **Beat 1-2:** Introduce the concept's *shape* without naming it yet. Let the viewer feel the pattern before they have a word for it.
- **Mid-episode (Beat 3 or 4):** Name it explicitly. "That's the [concept name]." This is the moment it crystallizes.
- **Late episode:** Use the name as shorthand that now carries all the accumulated meaning. "The [concept name] isn't just about X — it's about Y too." The name should feel heavier each time it returns.

Example for "The Silicon Trap": Beat 2 describes the trap dynamic without naming it → Beat 4 names it ("That's the silicon trap — not a trap for one side, a trap for everyone") → Beat 5 deploys it ("You're already inside the silicon trap"). Three mentions minimum in narration body text.

**Structural markers: [FRAMEWORK UNLOCK] and [MAIN REVEAL].** Two beats require an explicit marker comment in their beat header line. Place these in the correct position — script-audit will flag them if missing or misplaced.

- `<!-- [FRAMEWORK UNLOCK] -->` — The beat where the named conceptual product is named and the analytical framework crystallizes. Must appear **no later than 40% through the episode** (~6 min in a 15 min episode). If the framework isn't unlocked by this point, the viewer is still in setup — the information gap stays open too long and curiosity converts to impatience rather than sustained inquiry.
- `<!-- [MAIN REVEAL] -->` — The episode's primary revelatory beat. The first major reveal *before* this marker must solve why the obvious explanation fails — it earns the main reveal. The main reveal itself should build on the unlocked framework.

Usage in the beat header: `## BEAT 3 — THE FRAMEWORK UNLOCK (4:30–6:00) <!-- [FRAMEWORK UNLOCK] -->`

**Checkpoint beats every 3-5 minutes (NAR-12).** After each major analytical section, pause and consolidate. This can be a single line ("So here's where we are: ...") or a beat of deliberate silence. Use checkpoints to flag uncertainty too — "This claim rests on X; if that's wrong, the argument changes."

**Human moments (NAR-04).** Find 3-4 moments where a specific person does a specific thing. These can be one sentence each. An 18-minute script with zero named humans doing specific things is a lecture.

**Cross-domain parallel density.** The angle memo will identify 3-5 cross-domain connections. In the script, develop **at most 3 as full parallels** (each with setup, resonance, and named breakage — typically 150-250 words each). Additional connections can appear as brief evidence callouts (one sentence each, e.g., "The same defection logic shows up in Atlantic fishing quotas"). The reason: four or more fully developed parallels in a single episode create visual monotony (each one needs 4-5 MG compositions) and compress the pacing in ways that all three audit skills consistently flag. Fewer detailed parallels with more breathing room between them is stronger than comprehensive coverage that fatigues the viewer.

**Balance in bilateral conflicts (NAR-06).** Show each side's internal logic on its own terms — motivations, emotional drivers, cultural context. Don't develop one side as a protagonist and the other as a reactive force.

**End on personal stakes (NAR-05).** The closing beat must make the viewer feel personally implicated. Concrete, tangible, in-their-life. The last 60 seconds should name specific objects the viewer owns or uses (your car, your phone, your hospital's MRI) and connect them to the episode's argument. Do NOT end on "and nobody knows how this ends" or "that uncertainty is the real story" — those are epistemological observations that belong in a professor's closing, not a storyteller's. The uncertainty should live *inside* the concrete stakes, not replace them.

**The toxin line (NAR-13).** Historical analogies are hypothesis generators, not conclusions. Always name at least one way an analogy breaks. Use "this resembles" and "structural resonance," never "this proves" or "this is X happening again." If you need hidden actors to make the argument work, the argument is broken.

**Bounded-analogy convention (the signature form, operationalized).** The toxin line tells you what to *avoid*; the bounded-analogy convention tells you what to *write*. Every full historical or cross-domain parallel in the script follows a three-move structure:

1. **Setup the pattern confidently** — describe the structural mechanism with the same authorial confidence you'd use for an established fact. Don't pre-hedge; the hedge belongs in move 2, not draped over move 1. ("Venice's Murano glass monopoly worked the same way: an island of irreplaceable expertise, geographic concentration as a deliberate state strategy, and a handful of hyper-specialized artisans the rest of the world couldn't replicate.")
2. **Name where it breaks — in one sharp clause** — the limit clause is the heart of the form. It should be specific, concrete, and short. Not "of course the situations are different" (that's vague). Not three paragraphs of qualifications (that's fear). One sharp clause. ("The parallel breaks at scale: Murano employed maybe a thousand glassblowers; TSMC employs sixty thousand engineers, and replacing them is closer to replacing a small city than a guild.")
3. **Return to the argument** — don't dwell in the limit. Use it as a pivot to deepen the analysis. ("But the geographic-concentration logic still holds — and it explains why both states made the same mistake about how stable the monopoly really was.")

Don't kill a strong analogy because it has a flaw. Don't pretend the flaw doesn't exist. Name it in one clause and let the analogy do its remaining work.

The bounded clause is **non-optional** — every full parallel must have one. But it should not feel like a tax. Done well, it's the most cognitively satisfying moment in the analogy: the writer demonstrates they've thought about where the reasoning fails, which earns the trust to assert what the reasoning still establishes.

**Herzog's ecstatic truth license.** Vivid metaphor and evocative imagery are *allowed and encouraged* when they serve emotional clarity, not when they strain literal accuracy. A "stormy sea" shot for "technological anxiety" earns its keep emotionally; a fabricated quote attributed to a real person doesn't. When choosing between a verified-but-flat phrasing and a vivid-but-slightly-loose one that doesn't strain literal accuracy, pick the vivid one. The Curtis-style juxtaposition that makes an argument felt as much as stated is a frontstage move; backstage rigor is what entitles the script to use it. Don't squander the license by substituting literal description out of misplaced caution.

What this looks like in narration:
- ✓ "China could launch astronauts but couldn't make a pen tip — a vulnerability the Chinese have a phrase for: 卡脖子, the throat-grip." (Vivid, precise, the metaphor does work.)
- ✓ "Export controls were the wall. The wall held. Behind it, a workshop." (Compressed Curtis-style metaphor; carries emotional weight.)
- ✗ "Export controls created what one might describe as a structural barrier, though of course the metaphor of a 'wall' simplifies a complex policy reality…" (Literal, hedged, dead.)

The principle: **backstage rigor protects the frontstage license; without the rigor, the license is unearned.**

**Claim verification tags.** Tag every factual claim:
- `{✅}` — confirmed in the research brief's verification table
- `{⚠️}` — unverified or "likely correct" in the brief
- `{NEW}` — introduced during scripting, not in the brief

Tag only specific factual claims (numbers, dates, percentages, attributed quotes). Don't tag opinions, framing, or analysis.

**Target length.** Parallax episodes run 15-22 minutes. At ~150 WPM analytical narration pace, that's 2,250-3,300 words of narration. The angle memo should specify a target. 4-6 beats is typical.

### Phase 2: Radio Edit Test (VIS-08)

Before touching the visual column, read the narration column straight through as if it were a podcast script. Ask:

1. Is the argument clear without any visuals?
2. Do transitions between beats feel natural?
3. Does the pacing hold — no sags, no rushes?
4. Would someone listening in a car follow the thread?

If the narration doesn't pass this test, fix it now. Visuals that compensate for weak narration create a script that breaks at every stage downstream. The visual layer should deepen, not prop up.

### Phase 3: Visual Production + Direction Column

Now design the visual layer and direct the key moments. This is where the angle memo's visual arc becomes concrete and where the "how to show it" decisions are made.

**The visual motif (VIS-07).** The angle memo should have identified a visual motif for the named concept. Plan its evolution:
- First appearance: simple form, first 2 minutes
- Second appearance: mid-episode, evolved/complicated
- Third appearance: near the end, fully transformed
- The motif tracks the emotional arc, not the informational arc

Use Remotion's parametric capabilities — the same template component can render differently at different progress points.

**Visual-first and counterpoint moments (VIS-06).** Plan 2-3 visual-first moments and **at least 1 counterpoint moment** at key turning points. These are the highest-impact visual moments in the episode — they break the default synchronized pattern and create engagement spikes.

**Visual-first** (image arrives 3-5s before narration): Use at data reveals or geographic pivots. The viewer sees something unexplained → their brain asks "what is this?" → narration answers.

**Counterpoint** (image tensions with narration): Use at thesis complications — the moment the simple story gets messy. The narration says one thing, the visual shows the complication. This creates productive unease.

Annotate these explicitly in the right column:
- `[VISUAL-FIRST: 3s]` — visual appears 3 seconds before narration begins
- `[COUNTERPOINT]` — visual deliberately tensions with narration
- `[HOLD]` — previous visual persists while narration continues

Example of a counterpoint moment in the two-column format:
```
| The export controls were working. China's access   | **P1** · [COUNTERPOINT] [MG:] DataChart · 
| to cutting-edge chips had been cut off. {✅}       | China's domestic chip yield climbing from 
|                                                     | 40% → 70% — the visual CONTRADICTS the 
|                                                     | narration's surface claim · 6s
```
The narration says "working" while the chart shows China improving. The viewer processes both signals and realizes the story is more complicated — that's the engagement spike.

The remaining ~70% of the episode should be synchronized (visual matches narration). Don't overuse timing breaks — their power comes from contrast with the synchronized baseline.

**Mode selection for each moment.** Use the decision heuristic from VISUAL_LANGUAGE.md:
1. Is the narration about something that physically exists and is sourceable? → `[FOOTAGE:]`
2. Is it about something physical but unsourceable (restricted facility, historical scene)? → `[AI-GEN:]`
3. Is it explaining a number, structure, or comparison? → `[MG:]`
4. Is it making a surprising claim about something physical? → `[LAYERED:]`
5. Is it building emotional texture, dystopian mood, or conceptual weight? → `[ILLUST:]`
6. Is it transitioning, reflecting, or creating breathing room? → `[FOOTAGE:]` (ambient)

AI-GEN is for physically real spaces cameras can't reach (Register 3: Grounding). ILLUST is for emotional/conceptual art that creates *feeling* rather than communicating *data* (Register 2: Atmospheric). Neither replaces footage — they complement it.

When in doubt, default to footage. Footage is forgiving.

**Pacing rules (from VISUAL_LANGUAGE.md):**
- Max 3 consecutive `[MG:]` entries without a `[FOOTAGE:]`, `[ILLUST:]`, or `[AI-GEN:]` break
- Max 30 seconds of continuous `[FOOTAGE:]` without a visual change
- Max 2 consecutive `[AI-GEN:]` clips without a mode switch
- Max 2 consecutive `[ILLUST:]` entries without a mode switch
- Each beat follows roughly: footage (establish) → MG (analyze) → footage (breathe) → MG/layered (climax) → footage (land). AI-GEN and ILLUST slot in wherever footage would go.
- `[LAYERED:]` segments: 3-8 seconds, simple overlays only
- All three registers (Analytical/Atmospheric/Grounding) should be present in most episodes

**Direction annotations (`DIR:` lines).** After placing the visual specs and mode tags, add direction annotations on the moments that matter. Direction is what turns a flat visual spec into a directed sequence where visuals respond to the narration.

`DIR:` lines go immediately below the visual spec line they modify:
```
| The entire world's advanced chips    | **P1** · [MG:] ChoroplethMap · supply-chain.json · 12s |
| come from a single island.           | DIR: cam(wide → tight:Taiwan, sync:"single island", track) |
|                                       | DIR: reveal(sequential, per-phase:3s, settle) |
|                                       | DIR: hold(breathe) |
|                                       | DIR: mood(subtle) |
|                                       | DIR: cut(color-wash, ink) |
```

**What to direct (see DIRECTING_LANGUAGE.md for full syntax):**

*Always direct:*
- P1 hero visuals — camera, reveal, and hold at minimum
- Register transitions — explicit `cut()` specifying the transition type
- Data reveals synced to narration — `reveal()` + `cam()` with `sync:"word"` targeting the key number or name
- Emotional peaks — `mood()` + `hold()` for breathing room

*Usually direct:*
- P2 supporting visuals carrying analytical weight — at least a `reveal()` or `mood()`
- Visual-first and counterpoint moments — these need `hold(pre:)` or custom timing

*Rarely need direction:*
- P3 ambient texture — template defaults are fine
- Title cards and section breaks — `hold()` at most
- Simple quote/definition cards

**The five directive types (quick reference):**

| Directive | What it controls | Example |
|-----------|-----------------|---------|
| `cam()` | Camera position, movement, zoom | `cam(wide → tight:Taiwan, sync:"single island")` |
| `reveal()` | How data elements appear | `reveal(stagger:300ms, hero:0, pulse)` |
| `hold()` | Extra time, pauses, pre-delays | `hold(breathe)` or `hold(pre:1s, 2s)` |
| `cut()` | Transition to next composition | `cut(color-wash, ink, 0.7s)` |
| `mood()` | Background atmosphere and drift | `mood(dense, particles:20, drift:slow)` |

**Narration sync — the most powerful feature.** Use `sync:"word"` in `cam()` or `reveal()` to anchor visual events to specific spoken words. This is what makes the difference between "illustration of what I'm saying" and "the visual IS the storytelling."

```
DIR: cam(overview → element:0, sync:"ninety-two", track)    # camera pushes to bar as number lands
DIR: reveal(count-up, sync:"seven percent", pulse)            # stat counts up as Tiger says the number
DIR: hold(until:"but")                                        # hold this visual until the pivot word
```

**Direction density target:** For a 12-14 minute episode with ~50 visual segments, aim for ~20-35 total `DIR:` lines across ~8-12 segments. That means ~75% of segments use template defaults. If you're writing more than 4 `DIR:` lines on one composition, simplify.

**Visual density annotations (`PACE:`).** Use `PACE:` lines to mark structural pacing shifts. Three profiles: `urgent` (0.7× — fast cuts for crisis/tension), `analytical` (1.0× — default), `breathing` (1.4× — extended holds for emotional peaks). Place on its own row (empty narration column). Aim for 2-4 PACE changes per episode — these mark act-level shifts, not per-shot decisions. Pairs naturally with `DIR:` direction: `PACE: breathing` + `DIR: hold(land)` + `DIR: mood(dense)` creates maximum "let it sink in" effect. See SCRIPT_FORMAT.md "Visual density annotations" for full spec.

**Register transition direction.** When switching between visual registers, use `cut()` to specify the transition type from the register grammar (full doctrine: `project/TRANSITION_GRAMMAR.md`). Most within-register seams do NOT need an explicit `cut()` — the implicit-default engine handles them. Use explicit `cut()` only for the cases below:
- Analytical → Grounding (register shift): `cut(color-wash, ink)` — always include color token
- Grounding → Atmospheric (soften): `cut(dissolve)` — ~~`cut(blur-through)`~~ is deprecated, use `dissolve`
- Atmospheric → Analytical (focal rupture, rare): `cut(iris)` — premium register, ≤2 per episode
- Historical-analogy seam (same subject, different scale): `cut(match-cut)` or `cut(match-cut-still)`
- Chapter break / silence beat: `cut(fade)` paired with `DIR: hold(stillness)` on the prior segment
- J/L-cut audio bridge (overlap narration): `DIR: jcut(0.7)` / `DIR: lcut(0.5)` — NLE annotation only
- **Never emit**: `wipe-left`, `wipe-right`, `wipe-up`, `blur-through`, `whip-pan`, `spatial-zoom`

**Backdrop selection (`[BACKDROP: id]`).** Per-segment editorial backdrop image — sits behind the template and silently drives the FilmOverlay film-treatment cascade. Each backdrop in `backdrop-manifest.json` declares its own `recommendedPreset` (e.g. a vintage-photo backdrop recommends `archival`, a constellation-grid backdrop recommends `documentary`), so picking the right backdrop is the *primary* lever for film-treatment mood. Most segments need *nothing beyond `[BACKDROP: id]`* — the cascade handles preset, effects, and intensity automatically.

To browse the backdrop catalog: `python tools/assembly/print_backdrop_catalog.py`. Pair backdrops to register per `remotion-templates/design-references/backdrops/BACKDROP_CHART_PAIRING.md`.

Guidance:
- Pick one backdrop per editorially distinct segment cluster — *not* per cell. A 4-cell argument arc usually wants one backdrop covering the arc, not 4 different ones.
- Most templates render fine without a backdrop; add one when the segment carries editorial weight (P1/P2 register moments, transition into a new register, emotional peak).
- For Philosopher's Lens episodes, AI-GEN cells *are* their own visuals — backdrops generally go on the analytical-register `[MG:]` cells that link them.
- The whole FilmOverlay system is GATED on `manifest.filmOverlay: {}` being non-empty at the episode level. If the episode hasn't opted in, `[BACKDROP:]` tags are preserved but no backdrop renders. Visual-spec handles the opt-in; you just emit the tags.
- `[OVERLAY: preset]` is the rare per-segment override (five values: `clean`, `documentary`, `cinematic`, `dramatic`, `archival`) — use only when one moment needs to break from its backdrop's resolved preset. Example: forcing `[OVERLAY: dramatic]` on an editorial peak inside an otherwise documentary-toned arc.

```
| The entire world's advanced chips    | **P1** · [MG:] ChoroplethMap · supply-chain.json · 12s |
| come from a single island.           | [BACKDROP: constellation-grid] |
|                                       | DIR: cam(wide → tight:Taiwan, sync:"single island", track) |
```

See `remotion-templates/CLAUDE.md` → FilmOverlay cascade and SCRIPT_FORMAT.md → `[BACKDROP:]` / `[OVERLAY:]` for the full resolution chain.

**Sourcability check.** Before writing a `[FOOTAGE:]` spec, verify against FOOTAGE_SOURCING.md:
- Can a camera physically capture this? If not → `[MG:]`
- Is it generic or specific? Generic → Pexels/Pixabay. Specific → check the sourcing guide.
- Named person → Wikimedia Commons, accept a still
- Historical → Library of Congress, National Archives first
- Abstract concept → `[MG:]`, not footage

Tag hard-to-source footage with `[SOURCING: HARD]` and provide a fallback.

**Priority tiers.** Tag every visual entry:
- **P1** — Hero visual. The shot the viewer remembers. Must be specific, must be sourced. 5-8 per episode.
- **P2** — Supporting visual. Adds context or rhythm. 10-15 per episode.
- **P3** — Ambient texture. Background under narration. 8-12 per episode.

**Right-column format.** Each entry follows this pattern:
```
**P[1/2/3]** · [MODE:] Template/FOOTAGE/IMAGE · "search terms" > "fallback" · Library · treatment · composite @ opacity · duration · *Notes*
```

For Remotion templates: reference template name + data description + `[generate via visual-spec]`.
For footage: ranked search terms (most specific → most generic).
For transitions: `**TRANSITION** · TitleTransition · beat title · duration`.

**Every 5 seconds of narration must have a corresponding visual spec.** No unspecified gaps. Visual specs can cover ranges ("match narration (~20s)") — just don't leave voids.

## Output Format

Your output is a single markdown document matching the SCRIPT_FORMAT.md spec exactly. Structure:

```markdown
# [episode-slug] — [EPISODE TITLE]
## Production Script v1 (Two-Column Format)
### Target length: ~[X] minutes (~[Y] words at analytical narration pace)
### Format: Narration (left) + Visual Production (right)

---

## BEAT 1 — [TITLE] (0:00–[end])

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| *(Delivery note)* | **P[X]** · [MODE:] ... |
| Narration text {✅} | **P[X]** · [MODE:] Template · data · duration |
|                      | DIR: cam(...) |
|                      | DIR: reveal(...) |
|                      | DIR: hold(...) |
| ... | ... |

---

## BEAT 2 — [TITLE] ([start]–[end])
...

---

## ASSET SUMMARY

### Visual Mode Breakdown
| Mode | Count | Est. Screen Time | % of Episode | Register |
|------|-------|-------------------|--------------|----------|
| [MG:] | ... | ... | ...% | Analytical |
| [FOOTAGE:] | ... | ... | ...% | — |
| [ILLUST:] | ... | ... | ...% | Atmospheric |
| [AI-GEN:] | ... | ... | ...% | Grounding |
| [LAYERED:] | ... | ... | ...% | Mixed |
| TRANSITION | ... | ... | ...% | — |

Target ranges: MG 40-55%, FOOTAGE 25-40%, ILLUST 5-15%, AI-GEN 5-15%, LAYERED 5-10%, TRANSITION 3-7%.

### Direction Summary
| Metric | Count |
|--------|-------|
| Segments with DIR: lines | .../... total |
| Total DIR: lines | ... |
| Narration sync points | ... |
| Register transitions with explicit cut() | .../... |

### Remotion Compositions (generate via visual-spec)
| # | Template | Description | Priority |
|---|----------|-------------|----------|
| ... |

### Stock Footage Needed
| # | Priority | Search Terms | Treatment | Duration | Beat |
|---|----------|-------------|-----------|----------|------|
| ... |

### Images / Archival
| # | Priority | Description | Source | Treatment |
|---|----------|-------------|--------|-----------|
| ... |

### Atmospheric Illustrations (Recraft — Register 2)
| # | Mode | Prompt | Style | Treatment | Use |
|---|------|--------|-------|-----------|-----|
| ... |

### AI-Generated Video (Register 3)
| # | Scene | Camera | Style-Ref | Tool | Treatment | Duration |
|---|-------|--------|-----------|------|-----------|----------|
| ... |

---

## PRODUCTION NOTES
Estimated word count, narration time, composition count, footage clips, images, total assets.
Voice notes for narrator.
```

## Self-Check Before Delivering

Run through this checklist before handing the script to Tiger:

**Narrative:**
- [ ] Opens with stakes/contradiction/provocation in first 30 seconds, not context
- [ ] Organized by tension (each beat tightens a question), not by topic/logic
- [ ] Decoder posture — no "let me explain" or "to understand this, first..."
- [ ] Named concept appears 3-5 times with accumulating meaning
- [ ] Checkpoint beat every 3-5 minutes
- [ ] 3-4 human moments (specific people doing specific things)
- [ ] Bilateral balance — each side's internal logic shown on its own terms
- [ ] Closes on personal stakes, not epistemological observation
- [ ] Toxin line clean — "resembles" not "proves," analogies have named breakdowns
- [ ] **Bounded-analogy form on every full parallel** — three moves present (setup confidently → name break in one sharp clause → return to argument). Limit clause is concrete and short (one sentence, not a paragraph of qualifications)
- [ ] **No frontstage rigor leakage** — no "verified as of [date]," no "according to my research," no "I confirmed this with…" anywhere in narration. Verification language belongs in the brief, never in voiceover (script-audit Lens 10 will flag if present)
- [ ] **No layered hedging** — at most one hedge per claim, in the place where it does real work. "Some scholars might possibly argue, with qualifications, that…" is fear, not rigor
- [ ] **Herzog license used, not squandered** — vivid metaphor preferred over literal description when both are available and the metaphor doesn't strain literal accuracy
- [ ] All claims tagged ({✅}, {⚠️}, {NEW}) — single braces only, not double ({{✅} is a common typo)
- [ ] Passes radio edit test (argument clear as audio-only)
- [ ] Cold open completes all four beats: schema activation → violation → narrowing → solvability promise
- [ ] Emotional arc intact: anxiety → inquiry → micro-resolutions → restored efficacy + forward curiosity (no episode-ending anxiety spike)
- [ ] Anger/anxiety check: causation attributed to structure and incentives, not hidden intent or enemy agency ("the incentive structure makes defection rational" not "they are deliberately undermining...")
- [ ] Assertive calibration language used throughout: "most defensible reading," "what the evidence supports strongly," "highest-uncertainty variable," "what would change this" — not habitual "maybe/perhaps/it's complicated" hedging
- [ ] Bounded verdict close present: best current reading + confidence boundary + 2-3 concrete watchpoints the viewer can track
- [ ] <!-- [FRAMEWORK UNLOCK] --> marker present no later than 40% through episode runtime
- [ ] <!-- [MAIN REVEAL] --> marker present; beat before it establishes why the obvious explanation fails

**Narrator voice calibration (run on every speculative or analytical passage):**
- [ ] Outside view (base rate) stated before inside view (case-specific reasoning) in every speculative passage
- [ ] Multiple hypotheses named, not just the favored one
- [ ] At least one "what would change this assessment" per major analytical claim
- [ ] Uncertainty is specific and anchored — no Level 3 vague phrases (maybe, perhaps, who knows, only time will tell, it's complicated)
- [ ] No causal framing points to coordinated hidden-agent intent — structural/incentive framing only
- [ ] Every `[FORECAST:]` segment uses the 6-layer format from CALIBRATION_LANGUAGE.md (probability, verbal tag, base rate, key driver, key disconfirmer, benchmark)
- [ ] Forecast resolution criteria pass the clairvoyance test (specific date + binary/binned outcome a hypothetical person with perfect future knowledge could unambiguously score)

**Visual:**
- [ ] Visual motif introduced in first 2 minutes, returns 2+ times, evolves
- [ ] 2-3 visual-first moments and 1-2 counterpoint moments at turning points
- [ ] No more than 3 consecutive [MG:] without [FOOTAGE:]/[ILLUST:]/[AI-GEN:] break
- [ ] No more than 2 consecutive [AI-GEN:] or [ILLUST:] without mode switch
- [ ] No more than 30s continuous [FOOTAGE:] without visual change
- [ ] Every 5 seconds has a visual spec (no unspecified gaps)
- [ ] Mode balance per VIS-01 (post-May 4 calibration): MG 40-55%, FOOTAGE 15-25% (archival-weighted), ILLUST 5-15%, AI-GEN 5-15%, LAYERED 5-10%
- [ ] All three registers (Analytical/Atmospheric/Grounding) represented
- [ ] All footage specs pass sourcability check (no abstract concepts as footage)
- [ ] Priority tiers assigned (5-8 P1, 10-15 P2, 8-12 P3)
- [ ] Asset summary tables complete with mode breakdown + register column
- [ ] **Voiceover discipline for culturally-loaded visual language:** any beat with Soviet Constructivist / Chinese propaganda / Japanese Showa typography emphasis in the shot list includes at least one analytical framing move in the narration (name the visual rhetoric explicitly, OR make recurrence the argument by pairing with structurally parallel imagery from another regime, OR include falsification per NAR-19, OR pull back to personal stakes per NAR-05). Per VISUAL_LANGUAGE.md "Voiceover Discipline for Culturally-Loaded Visual Language." Without analytical framing, propaganda visual language reads as channel ideology rather than channel commentary.

**Direction:**
- [ ] All P1 hero visuals carry at least one DIR: annotation
- [ ] **Template selection consulted SELECTOR + dossier:** for every `[MG:]` cell, the writer (a) consulted the relevant family SELECTOR (`MAP_TEMPLATE_SELECTOR.md` / `CHART_TEMPLATE_SELECTOR.md` / `DIAGRAM_TEMPLATE_SELECTOR.md` / `TIMELINE_TEMPLATE_SELECTOR.md` / `TYPOGRAPHY_TEMPLATE_SELECTOR.md`) AND (b) skimmed the per-template dossier in `remotion-templates/references/template-research/`. Without this, a wrong-template pick (e.g. ChoroplethMap for count data → should be ProportionalSymbolMap) ships into `visual-spec` where the only safety net is the family audit skills running afterward. Re-spec cycles are expensive; the up-front 5-min consult prevents them.
- [ ] Register transitions have explicit `cut()` specifying transition type; color-wash includes color token; no deprecated transition types (wipe-*, blur-through, whip-pan, spatial-zoom)
- [ ] Data reveals have `reveal()` + `cam()` with `sync:"word"` targeting key numbers/names
- [ ] Emotional peaks have `mood()` + `hold()` for breathing room
- [ ] No composition has more than 4 DIR: lines (simplify if over)
- [ ] All `sync:"word"` targets appear in the corresponding narration text
- [ ] Direction density: ~20-35 DIR: lines across ~8-12 of ~50 segments (~75% use defaults)
- [ ] Direction summary table filled in
- [ ] PACE: annotations placed at 2-4 structural pacing shifts (not per-shot)
- [ ] `PACE: breathing` used on emotional peaks / philosophical pauses
- [ ] `PACE: urgent` used on crisis escalation / rapid-fire evidence sections

**Format:**
- [ ] Two-column table format with NARRATION and VISUAL PRODUCTION headers
- [ ] Beat structure with titles and time ranges
- [ ] DIR: lines stacked below visual spec lines they modify
- [ ] Delivery notes in italics/parentheses
- [ ] Transitions between beats specified
- [ ] Word count in target range (2,250-3,300 words)
