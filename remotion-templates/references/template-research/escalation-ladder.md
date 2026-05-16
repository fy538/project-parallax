# EscalationLadder — Research Dossier

> Expanded from stub: May 15, 2026. Companion dossiers: [`game-theory.md`](./game-theory.md), [`decision-tree.md`](./decision-tree.md). Update when new outlet conventions are observed.

## 1. The form's editorial purpose

An escalation ladder earns its frame when **the editorial argument is about thresholds, not merely a sequence**. The ladder form is descended directly from Herman Kahn's nuclear-escalation schema: it names each rung so the distance between rungs can be read and the boundary lines (thresholds) between qualitatively different states of violence can be visualized. The form says: *"We are here on the ladder, and crossing the next threshold changes the nature of the conflict, not merely its intensity."* Use it whenever the narration names a tier of action that is qualitatively different from the one below it — not just "more sanctions," but "crossing from economic to military measures." Distinct from `HorizontalTimeline` (which encodes events in chronological sequence without severity hierarchy), `GameBoard` (which encodes strategic payoffs, not escalation states), and `FrameworkDiagram` (which encodes causal or conceptual links, not a progression through ordered states).

### When *not* to reach for it

| Alternative | When it wins over EscalationLadder |
|---|---|
| **HorizontalTimeline** | You need to enumerate many events with overlapping timing or different actors. The ladder forces a single severity axis; timelines allow heterogeneous event types. |
| **FrameworkDiagram (flow)** | Escalation is bidirectional or cyclical — feedback loops don't fit the linear-rung model. |
| **DataChart** | You want to show numerical escalation over time (e.g., troop counts, missile deployments). That's a time series, not a ladder. |
| **SplitComposition** | You want to contrast two parallel tracks (e.g., US doctrine vs. Russian doctrine) — the ladder only encodes one track natively. |

**The ladder's superpower fires when:** there is a genuine qualitative discontinuity between rungs — not merely "more of the same" but a threshold that changes the character of the conflict. If all your rungs are the same severity color, you should reconsider the form.

## 2. Canonical idioms

### a. Kahn's 44-rung nuclear escalation ladder — RAND / *On Escalation* (1965)

**Herman Kahn**, *On Thermonuclear War* (1960) and *On Escalation* (1965, Hudson Institute / RAND). Kahn's ladder ran 44 rungs from "ostensible crisis" (Rung 1) through "exemplary attacks on population" (Rung 40) to "spasm or insensate war" (Rung 44). The canonical form: vertical arrangement, rungs numbered top-to-bottom, explicit horizontal rules at threshold crossings: "the nuclear threshold," "the city-targeting threshold," "the no-cities threshold." Rung labels in full capitals ("NUCLEAR THRESHOLD") following the convention that boundary labels should be typographically heavier than rung labels.

*Works because:* Kahn's core insight was that naming thresholds explicitly does more to deter than leaving them implicit — if both parties know which actions cross a threshold, crossing one sends an unambiguous signal. The ladder form embeds this deterrence logic into the visualization itself. *Fails when:* taken at face value as a sequence of rational steps — Kahn was critiqued for implying that nuclear war could be conducted rationally at every rung.

### b. Reuters / Economist crisis-briefing ladder — modern editorial (2014–present)

**Reuters Graphics** and **The Economist** nuclear-deterrence explainers covering North Korea (2017), Iran (2018–2020), and Russia-Ukraine nuclear signaling (2022–2023). Modern usage converges on 5–8 rungs, with explicit color-zone coding by severity (green/yellow/orange/red), and a "current position" marker prominent — often a chevron or pulsing indicator. Reuters tends to add a horizontal gradient bar alongside the ladder for magazine/web contexts; The Economist uses the ladder standalone with a brief annotation per rung. Both drop Kahn's numbering for editorial brevity.

*Works because:* the "current position" marker does the editorial work — the viewer immediately reads where the situation sits today, not merely what the theoretical space looks like. *Fails when:* the current marker is missing, leaving the viewer to wonder: "but where ARE we?"

### c. Arms Control Association / Bulletin of the Atomic Scientists — dual-track parallel ladders

**Arms Control Association** (Fact Sheets on NATO-Russia nuclear posture, 2022–2023) and **Bulletin of the Atomic Scientists** (policy analysis pieces). Academic-public-intellectual usage. Often places two parallel ladders side by side — US doctrine ladder and Russian doctrine ladder — so readers can see where the doctrines diverge at each rung (e.g., Russia's lower nuclear threshold in official doctrine vs. US conventional response ladder). Rung labels carry full policy language ("tactical nuclear use in theater," "strategic deterrent release").

*Works because:* the parallel structure makes doctrinal asymmetry visible at a glance. *Fails when:* the rungs don't align horizontally — if the US rung 4 isn't the same moment in the escalation spectrum as Russia's rung 4, the side-by-side comparison lies. Note: **the EscalationLadder template does not natively support parallel tracks** — this is a known gap, requiring a `SplitComposition` wrapper with two ladder instances.

### d. International humanitarian law / Geneva Conventions severity tiers

The **IHL escalation framework** (ICRC legal analysis, Lawfare Institute pieces on threshold crossings) uses a level system rather than a numbered ladder: armed conflict / non-international armed conflict / international armed conflict / crimes against humanity / genocide. Each tier triggers different legal obligations and response norms. Not a traditional ladder but its structure — thresholds between qualitatively different legal and moral states — maps directly to the rung+threshold idiom.

*Works because:* the legal framework gives each threshold a precise definition that removes ambiguity. *Fails when:* applied mechanically to political situations that don't meet the legal definitions — the legal framework is prescriptive; the political reality rarely fits the rungs cleanly.

### e. De-escalation ladder — inverse form

RAND (Kahneman / Treisman et al., "How to De-escalate" series, 2022) and **Carnegie Endowment** crisis-management analyses. Same visual form inverted: the ladder runs downward from crisis peak to resolution, with the "current position" marker starting high and moving down as de-escalation milestones are reached. Useful for episodes covering diplomatic negotiation or conflict resolution.

*Works because:* visually reinforces the argument that de-escalation is an active deliberate descent, not merely an absence of escalation. The EscalationLadder template supports this via `direction: "de-escalation"`. *Fails when:* paired with `backgroundVariant: "dark"` and severity colors — the red-to-green ramp should invert to green-to-muted when direction is downward.

## 3. General principles

The perceptual rationale for the ladder form is **position along an ordered scale** — Cleveland & McGill's highest-ranking encoding for ordered categorical data. Each rung is positioned at a y-coordinate that encodes its rank in the escalation sequence; the severity color adds a redundant second channel that reinforces the same ordering. The vertical arrangement is load-bearing: it activates the viewer's physical intuition about "up is more intense" (Lakoff / Johnson, *Metaphors We Live By*, 1980 — the "more is up" conceptual metaphor). Horizontal escalation ladders lose this embodied reading.

The threshold lines (horizontal rules between severity zones) are the form's distinguishing feature. Without them, a ladder is just a colored timeline. With them, it encodes the Kahn insight: not all rungs are equivalent, and some crossings change the nature of the conflict. Tufte's data-ink discipline applies: each threshold line is load-bearing (it marks a qualitative boundary); each rung annotation carries the event label and optionally a brief detail. Source attribution is not optional when rungs describe real events.

## 4. Recommendation for Parallax

**Default:** **5–7 rungs** on a light background, using the `SEVERITY_COLORS` map as implemented (`low`=`semantic.success`, `moderate`/`elevated`=`palette.amber`, `high`=`palette.rust`, `critical`=`semantic.danger`). Never override these with arbitrary hex — the map encodes the channel's geopolitical color vocabulary. One rung marked `current: true` with the pulse indicator. Threshold labels in ALL CAPS, IBM Plex Mono, placed at the horizontal boundary between severity zones.

**Severity mapping for geopolitical contexts:**
- `low` — diplomatic tension, protests, expulsions of diplomats
- `moderate` — targeted sanctions, travel bans, proxy financial pressure
- `elevated` — proxy engagement, weapons supply to third parties, cyber operations
- `high` — direct conventional confrontation, blockade, limited strikes
- `critical` — nuclear signaling, declared posture change, use

**Duration:** `durationSec: 8–12` for static reference cards; `durationSec: 14–18` for `cameraPath`-enabled cinematic sequences where the camera climbs the ladder. The `hasCameraPath` mode auto-generates a camera sequence that dwells on each rung with increasing shake intensity; provide `cameraPath` explicitly only when the auto-generation doesn't match the narration beat timing.

**Threshold markers:** Mandatory for nuclear episodes. Optional for conventional-war episodes where the threshold distinctions are primarily descriptive rather than deterrence-relevant.

**Dark background:** Reserve `backgroundVariant: "dark"` for the cinematic camera-path mode. Static reference cards use light mode — the contrast between the severity-colored dot and the paper-toned background reads clearly; dark-mode severity colors (especially `semantic.success` green) are harder to parse at scrub speed on a dark field.

**Rung count discipline:** never exceed 8 rungs. Kahn's 44 rungs are a textual schema, not a one-frame visualization. Video-register canon converges on 5–7 because that is what reads at scrubbing speed without forcing the viewer to pause. If an episode needs more than 8 stages, consider collapsing adjacent rungs into composite phases ("Cold War nuclear standoff: 1947–1991") or splitting across two ladder slides on a `SplitComposition`.

## 5. Current template alignment

The existing `EscalationLadder` template (`src/templates/EscalationLadder/`):

**Doctrine cleanup (May 16, 2026, commit `a85ebb6`).** Three POLISH.md doctrine items applied to rung rendering:
- **D1 (drop card chrome).** Each rung no longer renders a tinted background fill, rounded corners, or a box-shadow halo behind the event card. Rungs sit directly on the paper substrate; severity color now carries through the **left accent rule** + the existing **severity dot on the spine** (T5-documented exception — color IS the editorial encoding here, so the accent rule survives the chrome drop). The Economist / Reuters editorial convention — no cards on rungs, color on the rule — is now met.
- **D4 (ordinal numbering).** Each step has an `"01"`/`"02"`/`"03"`... prefix in `fonts.mono` at caption size, weight 600, in the rung's severity color with metadata letter-spacing. Detail text indents 32px under the label so it aligns with the label, not under the ordinal. Forces the scrub-reader index that Kahn's 44-rung table implied through numbering — but at editorial-cap scale (5–7 rungs).
- **D8 (direction chevron).** A small CSS triangle ~20px past the terminal spine end, drawn in the terminal rung's severity color. `direction: "escalation"` points up at the top of the spine; `direction: "de-escalation"` points down at the bottom. Closes the false-ceiling visual ambiguity without requiring a `critical` rung — the chevron signals "the ladder keeps going" or "we are descending."

What matches canon:
- `SEVERITY_COLORS` map matches the canonical geopolitical palette: `low`=`semantic.success` (green), `moderate`/`elevated`=`palette.amber`, `high`=`palette.rust`, `critical`=`semantic.danger`. Do not override.
- `current: true` renders a pulsing ring around the severity dot — the "current position" marker that Reuters and Economist treat as mandatory.
- `hasCameraPath` mode triggers the cinematic vertical camera climb with shake intensity auto-scaled by `SEVERITY_SHAKE` (0 for low/moderate, 0.05 for elevated, 0.15 for high, 0.35 for critical). Ambient particle density and speed scale with `tensionProgress`. This is the designed form for editorial peaks.
- Heat-track (vertical gradient behind the spine) reverses the severity gradient — crisis at top in red, calm at bottom in green — which correctly mirrors the Kahn schema.
- `warnIf` fires for `rungs.length > 7` — matches the stress-tested safe-count range. Also fires for multiple `current` markers and for `high` severity without `critical` ("false ceiling" warning).
- `contentOffset` allows optical centering correction — documented in schema and JSDoc. The default auto-offset (`DEFAULT_OFFSET_X: 150`) was tuned empirically via bbox measurement. Episodes should verify via still render before final assembly.

What still diverges:
- **Thresholds (E3 prop):** the type definition does not yet include a `thresholds` array for named threshold lines between severity zones. With the chrome drop, threshold labels would now have visual room to span the spine cleanly — the editorial argument for adding them is stronger than before. Still the primary gap versus the Kahn lineage.
- `direction: "de-escalation"` now drives the terminal chevron correctly (points down), but the heat-track gradient itself is not yet inverted — green-at-top / red-at-bottom for de-escalation sequences would complete the editorial mirror.

## 6. Specific upgrades proposed

1. **`thresholds` array prop — named threshold lines between severity zones.** Add `thresholds?: Array<{ afterRung: number; label: string }>` to `EscalationLadderData`. Renders a horizontal rule (muted ink, 1px) with an ALL-CAPS IBM Plex Mono label spanning the spine. "NUCLEAR THRESHOLD," "DIRECT ENGAGEMENT," "CITY-TARGETING" are canonical forms. With the May 16 chrome drop, threshold labels now have the visual quietness they need to read as boundary markers (no card chrome competing). Effort: medium; impact: high — the form still can't distinguish rung-within-zone from zone-crossing without it. **(medium effort / high impact)**

2. **`direction: "de-escalation"` — invert heat-track gradient.** The chevron now points correctly; complete the inversion by reversing the heat-track gradient (green at top, red at bottom) and optionally reversing the rung stagger so entries build bottom-up. Effort: small; impact: medium for any episode covering diplomatic resolution or arms-control success. **(small effort / medium impact)**

3. **Parallel-ladder `SplitComposition` pattern — doctrinal comparison.** Document (in dossier and SELECTOR) the standard pattern for side-by-side doctrine ladders: two `EscalationLadder` compositions in a `SplitComposition` with `_direction.synchronize: true` so their animations lock-step. Composition-level recipe, not a template change. Effort: documentation only; impact: enables the Arms Control Association idiom without building a new template. **(trivial effort / medium impact)**

4. **`backgroundVariant: "dark"` severity color calibration.** The `semantic.success` green for `low` severity reads poorly on dark backgrounds — it blends into the heat-track gradient. Add a dark-mode override in `SEVERITY_COLORS` (or a `darkSeverityOverride` map) that bumps the low-severity color to `palette.bone` at reduced opacity. Effort: small; impact: small but eliminates a legibility regression for dark-mode cinematic sequences. **(small effort / small impact)**

5. **Camera-path auto-tune for rung duration.** The auto-generated camera path in `generateEscalationCameraPath` dwells on each rung for a fixed `duration: 2.5` seconds. For episodes where one rung has a long `detail` text that narration will read aloud, this is too short. Add an optional `dwellSec` per rung to let visual-spec writers override dwell time per rung without providing the full `cameraPath` array. Effort: small; impact: medium for cinematic sequences with text-dense rungs. **(small effort / medium impact)**

[Shipped May 16, 2026 — commit `a85ebb6`]: D1 chrome drop on rung cards; D4 ordinal "01"/"02"/... prefix in severity color; D8 direction chevron at terminal spine end.

## 7. Failure mode flags (always catch in audit)

- **>7 rungs, no split.** The `overflow: hidden` failure documented in the stub — trailing rungs are silently clipped below the safe area with no visual indicator. The template warns at `rungs.length > 7`; audit must enforce the cap or require a `SplitComposition` plan. Same failure pattern as `DecisionTree.LadderVariant` (see `game-theory.md` § A2).

- **False ceiling** — a ladder that tops out at `high` without a `critical` rung implies escalation is bounded. The template warns when `high` is present without `critical`. Always add a `critical` rung even if the episode doesn't use it — it closes the ceiling and signals that the analyst considered the full range.

- **Symmetric coloring** — all rungs the same severity level (e.g., all `elevated`) defeats the entire purpose of the form. Every rung with identical color reads as a timeline, not a ladder. Require at least two distinct severity levels per ladder.

- **Missing `current: true` marker** — without a current-position indicator, the viewer sees the theoretical space but has no orientation. The Reuters and Economist convention treats the current marker as mandatory. Any ladder used for a live-situation explainer must mark one rung `current: true`.

- **Multiple `current: true` markers** — the template warns. Only one rung can be the current position; multiple markers confuse the viewer and dilute the orientating function.

- **Threshold crossings unlabeled** — using color zones alone (e.g., amber rungs followed by red rungs) without an explicit threshold line doesn't distinguish a rung-within-zone from a zone-crossing. Until the `thresholds` prop is implemented (§6.1), at minimum add a `detail` annotation on the first rung of a new severity zone naming the threshold being crossed.

- **Too long `detail` text** — `detail` wrapping to 2+ lines collapses the rung height budget, pushing lower rungs off the safe area. Keep `detail` ≤ 60 characters. Use `label` for the event name (≤ 32 chars); `detail` for one short contextual phrase.

- **`palette.rust` used for `moderate` severity** — `moderate` maps to `palette.amber` in `SEVERITY_COLORS`. Overriding to rust makes moderate look like high, compressing the visual range at the top of the ladder. Never manually override severity color tokens.

- **`cameraPath` mode with `durationSec < 14`** — the auto-generated camera path for a 6-rung ladder requires ~16 seconds (1.5s overview + 6×2.5s rung dwells + 2s pullback). Setting `durationSec: 8` truncates the sequence mid-climb, cutting critical rungs before the camera reaches them.

## TL;DR

**5–7 rungs, `SEVERITY_COLORS` untouched, one `current` marker, threshold boundaries labeled in ALL-CAPS Mono. Static: 8–12s, light mode. Cinematic (`cameraPath`): 14–18s, dark mode, shake scales with severity. Never top out at `high` — always add `critical` to close the ceiling. Kahn's insight was that naming thresholds deters more than leaving them implicit; the template exists to encode that insight.**

Last updated: May 15, 2026

Last revised: May 16, 2026 — D1 chrome drop, D4 ordinals, D8 direction chevron applied to rung rendering; severity color now carries through accent rule + spine dot, not a tinted card behind the text.
