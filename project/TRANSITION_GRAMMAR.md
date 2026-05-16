# Parallax — Segment-to-Segment Transition Grammar

## Purpose

This document names Parallax's eight canonical segment-to-segment transitions and matches each to its editorial context. It exists so that script-writing and visual-spec skills can select the right transition for a given seam — not by guessing from a 12-option menu, but by picking the one whose *implicit claim* about the relationship between two segments matches the editorial intent.

**Transitions are the smallest editorial sentence in a video.** Every seam between two segments either says *"same thought, next breath"* (cut), *"same thought, gentler delivery"* (dissolve), *"new chapter"* (fade-to-black), *"same geography, different scale"* (match-cut on a location), or *"new register entirely"* (color-wash). Picking the wrong transition doesn't just look wrong — it makes a *wrong claim* about the relationship.

Created: May 16, 2026

**Related docs:**
- **PROJECT_VISION.md** — the channel's mid-century editorial lineage; transitions inherit the same restraint principle
- **TEXT_ANIMATION_REGISTER.md** — sibling doctrine (how text reveals *within* a segment); same structure
- **HOLD_MOTION_REGISTER.md** — sibling doctrine (what happens *during* a held segment); same structure
- **DIRECTING_LANGUAGE.md** — `DIR: cut(<transition>)` directive vocabulary
- **AUDIO_DESIGN.md** — J/L-cut audio bridges live in audio-spec, not the visual transition layer
- **POLISH.md** — `D21` is the rule-form of this doc (pending)
- **remotion-templates/references/template-research/transition-grammar.md** — outlet research dossier (NYT VI, FT, Bloomberg, Economist, Reuters, Rex Studio / Cardia case)
- **remotion-templates/src/components/Transitions.tsx** — `TransitionType` union, `TRANSITION_CATALOG`, and `TransitionWrapper` (the technical surface)
- **tools/assembly/generate_manifest.py** → `apply_default_transitions()` — the implicit-default engine that picks a transition when the script doesn't

---

## Why a register, not a palette

A transition is a *register choice*. Picking the wrong one is a *category error*. A cross-dissolve between a casualty-list card and the next analytical chart implies *"the casualties soften into the analysis"* — wrong, undignified. A hard cut between a 1950s archival photograph and a 2026 chart implies *"no time passed between them"* — also wrong. A whip-pan between two pieces of evidence implies *"this is sports broadcast or Vice News"* — wrong register entirely.

The eight transitions below each carry an implicit claim about WHAT KIND OF RELATIONSHIP the two segments have:

| Transition | Implicit claim |
|---|---|
| **Hard cut** | "same thought, next breath" |
| **Cross-dissolve** | "elaboration of the same thought, gentler delivery" |
| **Fade-through-black** | "new chapter / time-jump / silence beat" |
| **Match cut** | "same subject, different scale — continuity across a logical seam" |
| **Color-wash** | "register shift — we're entering a new editorial mode" |
| **Iris-in / iris-out** | "cinematic open or close, deliberately theatrical" |
| **Audio-bridged cut (J/L)** | "invisible continuity — the sound carries the seam" |
| **Chapter card / slate** | "this section is named; pause to take it in" |

When the seam's editorial intent matches a transition's implicit claim, the transition *disappears* — viewer doesn't notice it because it agrees with what their brain expected. When the claim mismatches, the transition *competes* with the meaning. **Pick the one whose implicit claim matches the editorial relationship. Default-on-everything is itself a wrong choice.**

---

## The eight transitions (quick reference)

| # | Transition | Code mapping | Default duration | Used in production? |
|---|---|---|---:|---|
| 01 | Hard cut | `cut` | 0s | ✅ heavily (default within-beat) |
| 02 | Cross-dissolve | `dissolve` | 0.5s | ✅ heavily (default beat-boundary) |
| 03 | Fade-through-black | `fade` | 0.6s | ✅ for title cards |
| 04a | Match cut (zoom) | `match-cut` | 0.4s | ✅ Phase 4 — opt-in via `DIR: cut(match-cut)` |
| 04b | Match cut (composition-locked) | `match-cut-still` | 0.35s | ✅ Phase 4 — implicit default for same-template AtlasPlate / ChoroplethMap / AnnotatedImage / RouteAnimation / PhotoMontage seams in same beat |
| 05 | Color-wash | `color-wash` | 0.7s | ✅ rare register-shifts |
| 06 | Iris-in / Iris-out | `iris` | 0.8s | ✅ rare cinematic moments |
| 07 | Audio-bridged cut | **not a `TransitionType`** — audio-spec | 0.5–1.0s overlap | ❌ doctrine missing — wire in audio-spec |
| 08 | Chapter card / slate | **not a `TransitionType`** — `TitleTransition` segment | 1.5–2.5s hold | ✅ via `[TRANSITION:] TitleTransition` |

Six are direct `TransitionType` entries in `Transitions.tsx`. Two (audio-bridged cut, chapter card) are *adjacent register entries* that don't live as visual transitions per se — audio-bridged cut belongs in audio-spec; chapter card is a `TitleTransition` segment with a fade pair on either side. They're named here because they're often the right answer for a given seam, but they're implemented at different layers.

**Deprecated** (off-register; do not reach for): `wipe-left`, `wipe-right`, `wipe-up`, `whip-pan`, `blur-through`, `spatial-zoom`. See "Anti-patterns" section below.

---

## 01 · Hard cut

**Code mapping:** `cut` (zero-duration; instant switch)

**Implicit claim:** "Same thought, next breath."

### Use for
- Within-beat segment-to-segment transitions (the default — most analytical content cuts)
- Continuation of the same argument across visual modes (FOOTAGE → MG → LAYERED — all cuts unless the editorial register demands otherwise)
- Comparative beats where two pieces of evidence sit at the same register and need to read in sequence, not as a meditation

### Avoid for
- Beat-boundary transitions (use cross-dissolve or fade-to-black — a hard cut between BEAT 1 and BEAT 2 reads as accidentally-juxtaposed)
- Time-shift moments (archival → present-day; the absence of a transition implies no time passed)
- Casualty / memorial / document-of-record beats (hard cut into the next analytical segment reads disrespectful; use fade-to-black + a beat of silence)
- Moving into title cards (use fade — hard cut to a title card reads as scene-cut, not chapter)

### Parallax examples
- "TSMC's first Arizona fab hit a 92% chip yield" stat reveal → "A fab — a fabrication plant — is where chips are physically made" cleanroom footage = hard cut. Same thought, next breath.
- Step-by-step DataChart bar reveals where each segment elaborates the previous = hard cut.

### Real-world references
- **NYT Visual Investigations** — "Day of Rage" (2021) uses hard cuts between archival video segments. Motion graphics are "used sparingly, providing support to the edit." Cuts dominate within-act.
- **The Economist** Daily Charts video — within-piece transitions are cuts ~70% of the time per outlet research; the channel reserves fancier transitions for genuine register shifts.
- **FT Climate Graphic Detail** — chart-to-chart within an explanatory sequence: hard cuts.

### Technical brief
- Data: `_direction.transitionOut: "cut"` on the prior segment.
- Script: `DIR: cut(cut)` — though redundant; the implicit default for within-beat already cuts. Reach for explicit `cut(cut)` only to *override* a default that would otherwise dissolve.
- Wired via `TransitionWrapper` with `transitionIn={"cut"}` / `transitionOut={"cut"}` (zero duration, no animation).

### Failure mode
Looks accidental at register-shift moments. The viewer can't tell whether the editorial intent is "next breath" or "scene change." When in doubt at a register boundary, use cross-dissolve.

---

## 02 · Cross-dissolve

**Code mapping:** `dissolve` (0.5s opacity crossfade with subtle scale shift for depth)

**Implicit claim:** "Elaboration of the same thought, gentler delivery."

### Use for
- **Beat boundaries** (current implicit default, and the doctrine confirms it). BEAT 1 → BEAT 2 gets a dissolve.
- Photo-to-photo within an archival sequence (PhotoMontage between portraits)
- Map-to-map at the same scale showing temporal progression (e.g., 1962 NATO/Warsaw → 2026 alliance map)
- Moments where the editorial register stays constant but the *example* changes

### Avoid for
- Within-beat analytical transitions where the argument moves forward (use hard cut)
- Time-jumps across decades (use fade-to-black)
- Register shifts (use color-wash)
- Multi-segment dissolves in a row (dissolve creep — see anti-patterns)

### Parallax examples
- BEAT 1 closing chart → BEAT 2 opening title transition = dissolve (current default).
- Three NATO-bloc photographs in succession in a PhotoMontage = dissolves.

### Real-world references
- **FT Big Read video adaptations** — chapter-to-chapter dissolves (~0.5s) are the canonical FT move.
- **NYT Magazine longform video** — within-section elaboration uses dissolves.
- **Bloomberg Quicktake** — beat boundaries default to dissolve unless register shifts.

### Technical brief
- Data: `_direction.transitionOut: "dissolve"`.
- Script: `DIR: cut(dissolve)`.
- Default duration 0.5s. For especially gentle moments, override to 0.7-0.8s.

### Failure mode
**Dissolve creep.** When every transition is a dissolve, the piece feels somnolent. The dossier flags this as the most common failure pattern. Cuts within-beat keep the argument moving; reserve dissolves for genuine elaboration moments and beat boundaries.

---

## 03 · Fade-through-black

**Code mapping:** `fade` (0.6s opacity to black, then up)

**Implicit claim:** "New chapter / time-jump / silence beat."

### Use for
- Major chapter breaks where you want a moment of pure black to land
- Time-jumps across decades or centuries (Cold War archival → present-day chart)
- Eulogy / memorial / casualty-list cards (the black beat is the silence — pair with audio silence)
- End-of-episode close into credits or end card
- Anywhere the editorial intent is *"take a breath before what comes next"*

### Avoid for
- Within-beat transitions (the black is too heavy; reads as commercial break)
- More than ~2-3 per episode (the technique loses weight the more it's used)
- Moments that already have a chapter card (the chapter card IS the fade-pair container; don't fade-to-black into a card that fades in)

### Parallax examples
- End of "Cold War context" segment → fade to black → BEAT 3 "Present-day chip controls" cold-open.
- Held memorial card → fade to black → next BEAT's analytical opener.
- Episode end card.

### Real-world references
- **NYT Op-Docs** — fades to black at section breaks, paired with audio silence.
- **PBS Frontline** — canonical use; every act break is a fade-through-black.
- **The Economist Films** — reserved for genuine chapter shifts.

### Technical brief
- Data: `_direction.transitionOut: "fade"`.
- Script: `DIR: cut(fade)`.
- Pair with `DIR: hold(stillness)` on the segment BEFORE the fade for editorial weight (a moment of stillness then black; the silence reads doubled).
- Audio: pair with music-bed gap per D18 (music holds until after the next segment lands).

### Failure mode
Used as a generic dissolve = devalues every other fade in the episode. The fade-to-black is the strongest punctuation mark; reserve it.

---

## 04 · Match cut

**Code mapping:** `match-cut` (currently implemented as synced zoom; the editorial doctrine is broader — see "Technical brief" below)

**Implicit claim:** "Same subject, different scale — continuity across a logical seam."

### Use for
- **Geography continuity**: archival photo of Pacific in 1941 → present-day Pacific map (same composition framing, different visual mode)
- **Object continuity**: silicon wafer in cleanroom footage → wafer diagram in MG chart
- **Composition continuity**: identical layout / center-of-mass across the seam
- **Scale shifts that preserve subject**: wide chart → close on one data point; world map → zoomed regional inset

### Avoid for
- Generic within-beat transitions (overuse cheapens the effect)
- Seams where the two segments DON'T share a visual subject (it'd be a forced match-cut and reads gimmicky)
- Casualty / memorial beats (too clever for the register)

### Parallax examples
- 1941 oil embargo archival photo → 2026 chip-export-control map at the same Pacific geography. **This is the canonical Parallax use case** — the channel's historical-analogy structure produces match-cut opportunities at every beat seam where a present-day claim parallels a historical one.
- Wide world map of TSMC's role → close inset on Taiwan with the same orientation.
- Silicon wafer in cleanroom footage → MG diagram of the wafer's lithography process.

**Currently zero production uses across Silicon Trap + Prisoners Dilemma.** This is the highest-leverage under-served transition in the channel.

### Real-world references
- **NYT Visual Investigations** — "Day of Rage" and "Bucha" use match cuts extensively to bridge between archival cell-phone footage and reconstructed maps at the same location/orientation.
- **NYT "Greenland Is Melting Away"** (Derek Watkins, 2015) — match-cut between archival photographs and modern drone footage of the same Greenland landscape.
- **FT Visual Storytelling** — supply-chain pieces use match-cuts to bridge between an MG diagram and the photo of the actual factory it represents.

### Technical brief — two variants (Phase 4 split, May 16, 2026)

Two `TransitionType` entries cover the editorial range:

**`match-cut` (zoom)** — 0.4s synced zoom (push-in on exit, pull-out on entry).
- Data: `_direction.transitionOut: "match-cut"`.
- Script: `DIR: cut(match-cut)`.
- Use for: *scale-shift* match-cuts where the second segment is the same subject at a different magnification (wide world map → close on Taiwan; cleanroom wafer footage → MG diagram of the same wafer).

**`match-cut-still` (composition-locked)** — 0.35s opacity-only crossfade, no scale.
- Data: `_direction.transitionOut: "match-cut-still"`.
- Script: `DIR: cut(match-cut-still)`.
- Use for: *layer-swap* match-cuts where the two segments share an exact composition (same map crop with a different overlay; same photo subject framed identically in both segments).
- **Implicit-default promotion**: `apply_default_transitions()` Rule 4a now defaults same-template same-beat seams on **AtlasPlate / ChoroplethMap / AnnotatedImage / RouteAnimation / PhotoMontage** to `match-cut-still` instead of the legacy 0.3s dissolve. Authoring requirement: those consecutive segments must genuinely share composition (same projection / crop / subject framing). If they don't, override with `DIR: cut(dissolve)` on the prior segment.

Authoring requirement (both variants): the two segments must share a visual subject. If they don't, the match-cut reads as forced cleverness.

### Failure mode
Forced match-cut on unrelated content (a chart and a photo with no shared subject) = gimmicky. The technique only works when the visual continuity is *real*. `match-cut-still` is especially intolerant of composition drift — even a small reframe between the two segments will read as a jump cut, not a seam.

---

## 05 · Color-wash

**Code mapping:** `color-wash` (0.7s solid color flood between segments; `washColor` from palette)

**Implicit claim:** "Register shift — we're entering a new editorial mode."

### Use for
- **Time-jumps with editorial intent**: present-day analytical mode → archival cold-war investigation mode (color: `ink` or `oxblood`)
- **Pivot from analytical to atmospheric**: chart sequence → photo plate (color: `paper` or `bone` for editorial restraint)
- **Pivot from descriptive to interrogative**: "here's the data" → "here's why it matters" (color: `amber` for editorial accent)
- **Genuine register changes** where a hard cut would feel jarring and a dissolve would feel underwhelming

### Avoid for
- Within-beat transitions (color-wash IS a register shift; using it within a register is contradictory)
- More than 2-3 per episode (becomes signature noise rather than punctuation)
- Without a deliberate `washColor` — defaulting to amber on every color-wash loses the editorial encoding

### Color vocabulary (added May 16, 2026)

The `washColor` is editorial — pick deliberately:

| Color | Token | When |
|---|---|---|
| `ink` (`#1C1814`) | dark | Investigation / Cold War / archival register |
| `oxblood` (`#6B1D1D`) | dark warm | Tension peak / conflict moment |
| `rust` (`#C23B22`) | mid warm | Tension rise / urgency |
| `amber` (`#E5A544`) | mid gold | Editorial-pivot / "here's the key" |
| `bone` (`#F0E6D0`) | light warm | Editorial restraint / softening |
| `paper` (`#F5F0E8`) | light cream | Pure substrate reset |

The `bone`/`paper` washes are unusual — they read as "the page itself flashes" rather than a colored flood. Use sparingly.

### Parallax examples
- Silicon Trap BEAT 2 closes with a present-day chart → `cut(color-wash, ink)` → BEAT 3 opens on Cold War COCOM archival photography. The ink wash IS the time-shift register marker.
- Prisoners Dilemma RAND scene → `cut(color-wash, amber)` → reveal of Nash equilibrium concept. The amber wash signals "this is the editorial pivot."

### Real-world references
- **NYT Op-Docs** — colored fades between acts are common; usually black but occasionally a register color.
- **The Economist Films** — uses paper-substrate flashes between archival and present-day footage.
- **FT Big Read** — chapter-shifts via color-wash where the next chapter has a different editorial register.

### Technical brief
- Data: `_direction.transitionOut: "color-wash", washColor: "ink"` (hex auto-resolved from token).
- Script: `DIR: cut(color-wash, ink)`. Color token from the palette set above.
- Default duration 0.7s.

### Failure mode
Used without a `washColor` choice = defaults to amber every time = signature noise. Choose color deliberately or don't use color-wash.

---

## 06 · Iris-in / Iris-out

**Code mapping:** `iris` (0.8s circular reveal from center; or close-to-center on exit)

**Implicit claim:** "Cinematic open or close — deliberately theatrical."

### Use for
- Episode opening (iris-in from black on the cold-open shot)
- Episode close (iris-out to black on the end card or last frame)
- Major reveals where the editorial weight justifies the cinematic gesture (rare)
- Discovery moments — "the answer is THIS" (paired with an editorial peak)

### Avoid for
- Within-beat transitions (too theatrical for analytical content)
- Beat boundaries (use dissolve or fade — iris is a *narrative* gesture, not a *structural* one)
- More than ~1-2 per episode (it's the rarest punctuation mark)

### Parallax examples
- Cold-open iris-in on the historical photograph that anchors the episode's analogy.
- End-card iris-out to black with the channel's `∴` symbol.

### Real-world references
- **NYT Op-Docs** — iris-in opens many short-form pieces.
- **The Economist Films** — feature-length pieces use iris pairs at episode open/close.
- **Documentary tradition** — Errol Morris, Werner Herzog use irises sparingly at editorial peaks.

### Technical brief
- Data: `_direction.transitionOut: "iris"` (or `transitionIn: "iris"` for an opener).
- Script: `DIR: cut(iris, origin:center)`.
- Default duration 0.8s.

### Failure mode
Used as a generic transition = cheesy / film-school-thesis. Reserve for genuine cinematic moments.

---

## 07 · Audio-bridged cut (J-cut / L-cut)

**Code mapping:** **NOT a `TransitionType`.** Lives in `audio-spec` skill / `soundCue.offsetSec` / `narrationGate`. The visual transition is a `cut`; the *audio* transitions earlier (J-cut: audio enters before video) or later (L-cut: audio extends past video).

**Implicit claim:** "Invisible continuity — the sound carries the seam."

### Use for
- **Default for hard cuts between two narrated segments.** Per NYT VI doctrine, every hard cut should have ~0.5-1.0s of next-segment narration audible BEFORE the visual cut. The audio bridges the seam so the cut disappears.
- Continuity across an editing seam where two segments share a narrative thread but different visuals
- Documentary tradition — Curtis, Morris, Frederick Wiseman use J/L-cuts pervasively

### Avoid for
- Hard cuts at register-shift moments (the audio bridge contradicts the visual register shift — use color-wash or fade instead)
- Beats where silence is the editorial intent (memorial moments, the thinking beat — pair `hold(stillness)` with NO audio bridge)
- More than the default rate (this isn't a "reach for it" technique — it's the implicit default for all within-beat cuts)

### Parallax examples
- Narrator says "Japan's navy had eighteen months of fuel reserves" — the next clause "That created a terrifying calculus" begins ~0.7s before the visual cuts from the timeline graphic to the archival photograph. The audio carries; the visual seam disappears.
- Hard cut between two analytical charts: next segment's narration leads in by 0.5s; the chart change registers as elaboration, not break.

### Real-world references
- **NYT Visual Investigations** — audio bridging is the *primary* editorial technique. The Rex Studio / Cardia case study notes: motion graphics provide "support to the edit"; the edit itself is audio-bridged.
- **Documentary tradition** — Adam Curtis (*Bitter Lake*), Errol Morris (*Fog of War*), Frederick Wiseman (*Welfare*) — J/L-cuts on every seam.
- **PBS Frontline** — every segment-to-segment cut has audio overlap.

### Technical brief
- **No `TransitionType` field.** Implementation lives in audio-spec:
  - `soundCue.offsetSec` already encodes audio-relative-to-visual timing
  - Need: per-segment `narrationLeadIn` field (positive number = audio leads visual by N seconds — J-cut)
  - Need: per-segment `narrationLagOut` field (audio extends past visual by N seconds — L-cut)
- Doctrine: every hard cut in `apply_default_transitions` should have a default `narrationLeadIn: 0.7` unless explicitly overridden (per Upgrade 5 in `transition-grammar.md` research dossier).
- Audio-spec skill needs to enforce this when generating audio cue sheets.

### Failure mode
Hard cuts with zero audio overlap = "edited by an algorithm" feel. The audio gap of even 0.2s at a hard cut reads as accidental. The bridge IS the polish — its absence is a noticeable failure.

---

## 08 · Chapter card / slate

**Code mapping:** **NOT a `TransitionType`.** Implemented as a `TitleTransition` segment with a `fade` transition pair on either side. The chapter title holds in silence per D18.

**Implicit claim:** "This section is named; pause to take it in."

### Use for
- **Beat dividers in long-form episodes** (10+ min): every BEAT gets a chapter card
- Major register shifts that need explicit naming ("THE LOGIC OF DENIAL", "WHAT THE PRECEDENT SHOWS")
- Episode openers (the episode title IS a chapter card variant)
- End cards (the closing chapter card)

### Avoid for
- Within-beat transitions (chapter card breaks flow if it's not a real section boundary)
- Every beat in a short piece (<8 min): chapter cards over-segment short episodes
- More than ~5-7 per episode at most (one per beat; not more)

### Parallax examples
- Silicon Trap: 8 beats × ~1 chapter card each = 8 chapter cards in a 14-minute episode.
- Prisoners Dilemma: BEAT divider "WHAT THE EXPERIMENT FOUND" between sections.

### Real-world references
- **NYT Op-Docs** — chapter cards delineate acts.
- **FT Big Read** — chapter cards as the canonical chapter break.
- **The Economist Films** — uses for full-length pieces; rare for short pieces.
- **Vox Atlas** — uses section titles as chapter cards.

### Technical brief
- **Not a `TransitionType`.** Encoded as a `TRANSITION` segment in the assembly manifest:
  - `type: "TRANSITION"`, `template: { component: "TitleTransition", dataFile: "..." }`
  - Adjacent segments get `transition.in: "fade"` (into the card) and `transition.out: "fade"` (out of the card)
  - The card itself uses `driftPreset: "settle"` (per HOLD_MOTION_REGISTER) for one-time scale lock
- **Proposed sugar** (Phase-6 of the transition-grammar work): `DIR: chapter("THE LOGIC OF DENIAL")` desugars to the full TitleTransition + fade-pair pattern in `generate_manifest.py`.
- Audio: music bed holds in silence per D18; sound cue at card landing is optional and discouraged.

### Failure mode
Chapter cards without silence = sitcom register. The held silence on the card IS the doctrine signal.

---

## Decision matrix — which transition for which context

### Context A — Within-beat segment-to-segment

Editorial intent: *the argument is moving forward; the segments elaborate one continuous thought*.

| Editorial relationship | Transition | Audio |
|---|---|---|
| Continuation of same thought | **Hard cut** | J-cut (default — audio leads ~0.7s) |
| Elaboration with gentler delivery | Cross-dissolve (0.5s) | J-cut |
| Same subject, different scale | Match cut (0.4s) | J-cut |
| New visual mode but same point | Hard cut | J-cut |

**Default**: hard cut with J-cut audio bridge. Most within-beat seams.

**`apply_default_transitions` Rule 4 revision** (per the dossier): the current default "any two template segments in same beat → 0.3s dissolve" is too aggressive. Revise to: same-beat template-to-template defaults to **cut**; only escalate to dissolve when the next segment's content is a *visualization of the same data* (chart→chart small-multiples, photo→photo within a montage). The visual-spec skill should set this explicitly when the case applies.

### Context B — Beat-boundary segment-to-segment

Editorial intent: *we're transitioning from one act to the next*.

| Editorial relationship | Transition |
|---|---|
| New chapter / new argument | Chapter card (with fade pair) |
| Time-jump across decades | Fade-through-black + optional color-wash on the way out |
| Same register, new example | Cross-dissolve (current default — keep) |
| Investigation register entry | Color-wash to `ink` or `oxblood` |
| Editorial-pivot register entry | Color-wash to `amber` |

**Default**: chapter card OR cross-dissolve. The choice between them is editorial — long-form 14-min episode = chapter cards; tighter 8-min piece = dissolves with no cards.

### Context C — Title card transitions (into and out of)

Editorial intent: *we're entering or leaving a named section / the episode itself*.

| Direction | Transition | Audio |
|---|---|---|
| Into chapter card | Fade-through-black | Music silence per D18 |
| Out of chapter card | Fade-through-black | Music swells AFTER card lands per D18 |
| Into episode title (cold-open close) | Fade-through-black | Hard silence |
| Out of episode title (BEAT 1 cold-open) | Fade-through-black | Music begins |
| Into end card | Iris-out or fade | Music bed wraps |

### Context D — Register-shift segment-to-segment

Editorial intent: *we're changing modes (analytical → atmospheric, present → archival, descriptive → interrogative)*.

| Register shift | Transition |
|---|---|
| Analytical → atmospheric | Color-wash to `bone` or `paper` |
| Present → archival (decades) | Fade-through-black, optionally color-wash to `ink` |
| Analytical → editorial pivot | Color-wash to `amber` |
| Sober → tense (rising stakes) | Color-wash to `rust` or `oxblood` |
| Tense → resolution | Color-wash to `bone` (softening), or dissolve |

---

## Combining transitions

**Allowed combinations:**

- **Hard cut + J-cut audio bridge** — the default for within-beat. Visual cuts; audio leads by ~0.7s. Invisible continuity.
- **Fade-through-black + chapter card + music silence** — the canonical chapter-divider pattern. Pair the visual transition with audio silence per D18.
- **Cross-dissolve + L-cut** — when transitioning between two photo plates in a PhotoMontage, the audio can extend past the visual seam for atmospheric continuity.
- **Color-wash + sting** (audio) — a register-shift color-wash can be paired with a brief audio sting per AUDIO_DESIGN.md; reserve for editorial peaks.

**Forbidden combinations:**

- **Match-cut + dissolve** — match-cut IS the transition; dissolving on top kills the seam clarity. Use one or the other.
- **Fade-through-black + audio bridging** — the silence is the point; bridging audio across the black contradicts the editorial register.
- **Multiple dissolves in a row** — dissolve creep. After more than 2 dissolves in sequence the piece feels somnolent. Cut to break the rhythm.
- **Iris on a chart** — irises are theatrical; charts are analytical. Mismatched register.

---

## Anti-patterns to watch for

### Wipes (left, right, up) — universally off-register

The dossier looked specifically for editorial outlets using wipes: zero hits across NYT, FT, Bloomberg, The Economist, Reuters. Wipes are PowerPoint / sports / YouTube-explainer register. **Do not reach for `wipe-left`, `wipe-right`, `wipe-up`** — they remain in `Transitions.tsx` for backward compatibility but should be deprecated (Upgrade 2 in the dossier; planned).

### Whip-pan — sports broadcast register

Energetic and high-information-density. Used by Vice News, sports broadcast, fast-cut explainer channels. Wrong for Parallax's mid-century editorial register. **Do not reach for `whip-pan`.**

### Blur-through — dream-sequence register

Cinematic and dreamy. Right for narrative-fiction transitions ("we're flashing back to a memory"). Wrong for analytical editorial — analysis isn't a dream. **Do not reach for `blur-through`.**

### Spatial-zoom — After Effects template

A signature of motion-graphics-template aesthetics. Match-cut covers the legitimate "continuity through depth" cases editorially. **Do not reach for `spatial-zoom`** — use `match-cut` instead.

### Dissolve creep

When every transition is a dissolve, the piece feels somnolent. Cuts within-beat keep the argument moving; reserve dissolves for beat boundaries and same-register elaboration. Watch for: episodes where more than ~30-40% of transitions are dissolves.

### Iris overuse

Iris is the rarest punctuation mark — 1-2 per episode at most. Using it generically devalues every iris in the channel's history. Reserve for genuine cinematic moments.

### Chapter card spam

Chapter cards every 90 seconds = sitcom register. Use them only at real beat boundaries; if a 14-minute episode has more than 7-8 chapter cards, the structure is over-segmented.

### Match-cut on unrelated content

Forced match-cut without shared visual subject = gimmicky. The technique only works when the visual continuity is real (shared geography, shared object, shared composition).

### Color-wash without `washColor` choice

Defaulting to amber on every color-wash loses the editorial encoding. Either pick a deliberate color (`ink`, `oxblood`, `rust`, `amber`, `bone`, `paper`) or use a different transition.

### Hard cuts without audio bridging

Per NYT VI doctrine, every hard cut should have ~0.5-1.0s of next-segment audio leading the visual cut. Hard cuts with zero audio overlap = "edited by an algorithm." The bridge IS the polish.

---

## Implementation status & extraction roadmap

### Already wired (technical surface mostly complete)

- `TransitionType` union (`Transitions.tsx` line 44–55) — 12 transitions, but 6 will be deprecated.
- `TRANSITION_CATALOG` with metadata for each.
- `TransitionWrapper` component renders any of them.
- `VALID_CUT_TYPES` Python set in `generate_manifest.py` — 3-way synced with TS.
- `apply_default_transitions()` — 6 implicit-default rules, mostly correct.
- `DIR: cut(<transition>)` parser in `parse_dir_lines`.

### Coverage gaps (Phases 3-9 of the transition-grammar work)

- ✅ **Phase 3 (deprecate 6 transitions, shipped May 16, 2026, commit `95258f1`)**: marked `wipe-left`, `wipe-right`, `wipe-up`, `whip-pan`, `blur-through`, `spatial-zoom` as deprecated in `TRANSITION_CATALOG` (TS) + `DEPRECATED_CUT_TYPES` (Python); `parse_dir_lines` emits one-shot stderr deprecation notice with canonical-replacement suggestion; `assembly-manifest.schema.json` descriptions split canonical / deprecated.
- ✅ **Phase 4 (promote match-cut, shipped May 16, 2026)**: split `match-cut` into the original zoom variant + new `match-cut-still` (composition-locked, opacity-only). Added Rule 4a to `apply_default_transitions()`: same-template same-beat seams on **AtlasPlate / ChoroplethMap / AnnotatedImage / RouteAnimation / PhotoMontage** now default to `match-cut-still` (0.35s) instead of dissolve (0.3s). Also fixed a pre-existing bug where Rule 4 wasn't checking for DIR overrides. Zero existing manifest pairs would shift (purely additive for future authoring).
- **Phase 5 (revise `apply_default_transitions` Rule 4)**: same-beat template-to-template → cut by default; only escalate to dissolve when visual-spec sets it explicitly.
- **Phase 6 (`DIR: chapter("…")` sugar)**: parser desugars to `[TRANSITION] TitleTransition` + fade pair; reduces 4 lines of authoring boilerplate to one.
- **Phase 7 (audio-spec J/L-cut wiring)**: per-segment `narrationLeadIn` / `narrationLagOut` fields; default `narrationLeadIn: 0.7` for all hard cuts unless overridden.
- **Phase 8 (catalog showcase)**: `catalog-showcase-transition-grammar` — 30s composition cycling through the 6 surviving transitions on identical content with labels.
- **Phase 9 (lint rule `M-TRANSITION-DEFAULT`)**: surface deprecated-transition usage, chart-to-chart with iris, beat-boundary with cut when narration register suggests dissolve, etc.

---

## How to use this doc when generating visual specs

When `visual-spec` is called on a segment, it should:

1. **Identify the editorial relationship** between the segment and its neighbor (continuation / elaboration / scale-shift / time-jump / register-shift / chapter break).
2. **Pick the transition** from the Section 4 decision matrix.
3. **For default cases**, don't emit a `cut()` directive — the implicit-default engine in `generate_manifest.py` will pick the right one.
4. **For override cases** (e.g., a within-beat match-cut on a historical-analogy seam), emit `_direction.transitionOut: "match-cut"` in the data file, OR `DIR: cut(match-cut)` in the script.
5. **For register-shift cases**, emit the color: `DIR: cut(color-wash, ink)` not just `cut(color-wash)`.

When `script-draft` is called and wants to express a transition in the script:

- Default: don't write a `cut()` directive; let the implicit-default engine handle it.
- Override: `DIR: cut(<transition>)` or `DIR: cut(color-wash, <color>)`.
- Chapter break: prefer `DIR: chapter("TITLE")` sugar (pending Phase 6).
- Memorial / silence beat: `DIR: cut(fade)` paired with `DIR: hold(stillness)` on the preceding segment.

When `script-audit` runs, it should:

- Flag use of deprecated transitions (`wipe-*`, `whip-pan`, `blur-through`, `spatial-zoom`) with a "use [recommended-replacement] instead" message.
- Flag dissolve creep (more than 2 dissolves in a 30-second window).
- Flag iris overuse (more than 2 per episode).
- Flag color-wash without explicit color token.
- Flag match-cut on segments without shared visual subject (judgment call — surface for review).

When `audio-spec` runs, it should:

- Enforce J-cut audio bridge on every hard cut (default `narrationLeadIn: 0.7`) unless `hold(stillness)` on the preceding segment indicates the bridge is editorially wrong.
- Pair color-wash transitions with optional sting per AUDIO_DESIGN.md.
- Pair fade-through-black with music silence per D18.

---

## Summary

Segment-to-segment transitions are editorial sentences, not decoration. The eight canonical transitions each carry an implicit claim about the relationship between the two segments they join; matching transition to claim is the work. The technical surface already exists in `Transitions.tsx` + `TRANSITION_CATALOG` + `apply_default_transitions` — the doctrine work is *assignment*, not *invention*. Six transitions in code are deprecated for editorial register (universal PowerPoint/sports/YouTube tells). Two adjacent treatments (J/L-cut audio bridges, chapter cards) live at other layers (audio-spec, `TitleTransition` segments) but belong in the transition register because they're often the right answer for a given seam.

The under-served transition is **match-cut**. Parallax's historical-analogy structure produces match-cut opportunities at every beat seam. Zero production uses currently. Promoting it from unused to first-class is the highest-leverage transition upgrade in the codebase.

Phases 3-9 of the planned work close the implementation gaps. After they land, every seam in every Parallax episode is a deliberate editorial choice — same compounding leverage as text animation and hold-motion before it.
