# Segment-to-Segment Transition Grammar — Research Dossier

> What happens at the seam between two visual segments — the cut, fade,
> dissolve, wipe, or match-cut that moves the viewer from BEAT 1's chart
> to BEAT 2's photo plate, from a title card into a stat reveal, or from
> an analytical map into an atmospheric establisher.
>
> Created: May 16, 2026. Sibling to `hold-motion.md` (what happens
> *during* a held segment) and to the in-progress text-animation
> research that became `TEXT_ANIMATION_REGISTER.md` (how text reveals
> *within* a segment). This dossier covers the third leg: how one
> segment hands off to the next.
>
> Motivated by the audit finding that of the 12 transition types wired
> into `Transitions.tsx`, only 5 are reached for in production scripts
> (cut, fade, dissolve, color-wash, iris). The 7 unused
> (blur-through, match-cut, spatial-zoom, whip-pan, wipe-left,
> wipe-right, wipe-up) are either over-built for editorial register
> or under-promoted — this dossier sorts which.

## 1. The editorial purpose of segment-to-segment transitions

A transition is the smallest editorial sentence in a video. Every
seam between two segments either says *"same thought, next breath"*
(cut), *"same thought, gentler delivery"* (dissolve), *"new chapter"*
(fade-to-black), *"same geography, different scale"* (match-cut on a
location), or *"new register entirely"* (color-wash). Picking the
wrong transition for the seam doesn't just look wrong; it makes a
*wrong claim* about the relationship between the two segments. A
dissolve between a casualty-list card and the next analytical chart
implies "the casualties soften into the analysis" — wrong. A hard cut
between a 1950s archival photograph and a 2026 chart implies "no time
passed" — also wrong.

What a segment-to-segment transition does:

1. **Encodes the relationship between the two segments.**
   Continuation (cut), elaboration (cut), illustration (cut),
   contrast (cut or fade), parallel example (cut), time-shift (fade
   or dissolve), register-shift (color-wash or fade), scale-shift
   (match-cut), section break (fade-to-black or chapter card),
   discovery (iris or scramble). The transition declares which.
2. **Sets the pace.** Cuts move forward; dissolves slow down; fades
   to black insert a beat of silence. The cumulative transition
   density across a 14-minute episode determines whether the piece
   feels watchable or breathless.
3. **Bridges sound across the seam.** Per Curtis, Morris, and the
   broader documentary tradition, the most invisible transition is
   *audio bridging* (J-cut/L-cut) — the next scene's audio starts
   before the picture cuts. Visual transitions are coupled to audio
   transitions, never separate.
4. **Marks editorial weight.** A fade-to-black mid-episode lands
   harder than ten dissolves. Reserved transitions accrue value
   precisely because the channel doesn't reach for them often.

What segment-to-segment transitions are **not** for:

- **Compensating for unclear segment boundaries.** A whip-pan can't
  fix a script that doesn't justify why we're moving from segment A
  to segment B. The transition makes the seam *legible*; it can't
  make the *argument*.
- **Telegraphing production effort.** Match-cut, iris, and spatial-
  zoom all attract attention. If they don't earn it editorially,
  they're just "look, I have After Effects."
- **Standing in for analytical structure.** Beat boundaries deserve
  visible punctuation (a chapter card, a fade, a section dissolve);
  transitions alone don't create structure where the script doesn't
  have it.

The doctrine pattern Parallax should aim for, given the
mid-century-newsroom register: **most seams are cuts; a small set
of seams are dissolves or fades; one or two seams per episode are
match-cuts or chapter cards.** The cumulative effect is restraint —
the rare transition reads as deliberate.

---

## 2. Canonical idioms

Eight named transitions assembled from how editorial-video outlets
actually edit. Each entry: name, 2–3 real-world references, the
implicit-claim phrasing (matching the hold-motion / text-animation
register style), use cases, failure modes, and current Parallax
palette mapping.

### 2a. Hard cut — "same thought, next breath"

**References:**
- NYT Visual Investigations *Day of Rage* (Jan 2021) — the editing
  baseline is hard cuts across thousands of source clips, with audio
  J/L bridges providing the continuity. Dissolves are reserved for
  the rare time-jump or perspective shift; cuts otherwise.
  ([NYT VI playlist](https://www.youtube.com/playlist?list=PL4CGYNsoW2iAZt9-UzPyPZOH-AlRMxcIE))
- NYT VI *Exposing the Russian Military Unit Behind a Massacre in
  Bucha* (2022) — same doctrine; locator maps, annotations, and
  evidence chains are joined by cuts. Motion graphics are
  *"designed to be both elegant and functional, with locators,
  annotations, and maps used sparingly, providing support to the
  edit and consistently orienting viewers"* per Cardia/Rex Studio
  case notes.
- The Economist Daily Charts video, recurring — within-beat chart
  reveals are cuts; the chart updates, the camera doesn't.
- Most documentary editing pedagogy. *"A hard cut is when one piece
  of video abruptly switches to another with no in-between
  animations… particularly useful for communicating feelings."*
  ([UD Library, 2024](https://library.udel.edu/news/2024/02/05/a-guide-to-video-transitions-the-hard-cut/))

**Implicit claim.** *Same thought, next breath. The two segments
belong to the same paragraph of the argument.*

**Use for:**
- Within-beat segment-to-segment — chart → callout → adjacent chart
- Continuation moves where the narration runs straight across the seam
- Cause/effect joins where the second segment is the consequence of the first
- Default for ~70% of all editorial seams (per the NYT VI baseline)

**Avoid for:**
- Time-jumps spanning decades or eras (use fade or dissolve)
- Register shifts (analytical → atmospheric — use color-wash or fade)
- Beat boundaries (use dissolve or chapter card)
- Cuts onto a title card from a non-title segment (use fade)

**Parallax palette mapping.** Exists: `cut`. The default within-beat
transition in `apply_default_transitions`. Correct doctrine.

### 2b. Cross-dissolve — "elaboration, same register"

**References:**
- FT Films and FT *Big Read* video adaptations — chapter-internal
  transitions and same-topic-different-angle joins use a 0.6–0.8s
  dissolve. The Press Gazette interview with the FT video team
  notes their "craft editor" pedigree and tight storytelling
  doctrine; the result on screen is dissolves where ABC News or Vox
  would jump-cut. ([Press Gazette, FT video](https://pressgazette.co.uk/publishers/broadcast/financial-times-video-journalism-youtube/))
- The Economist Films and Daily Charts video — beat-to-beat shifts
  on data plates are dissolves, not cuts; the data argument
  *evolves* across the seam rather than restarting.
- Errol Morris *The Fog of War* (2003) — extensive dissolves between
  archive sequences and McNamara interview, used to imply
  "this thread continues" while the visual subject changes.
- Documentary editing pedagogy in general. *"A cross dissolve…
  is usually used to imply a greater passing of time or a more
  profound change of location or storyline than would be achieved
  with a normal cross fade."* ([Adobe Cross Dissolve](https://www.adobe.com/creativecloud/video/post-production/transitions/dissolve.html))

**Implicit claim.** *Elaboration. Same register; the next segment is
the next paragraph of the same argument.*

**Use for:**
- Beat boundaries where the next beat is the continuation of the
  current beat (not a register or chapter break)
- Two analytical segments arguing different facets of the same point
- Photo-to-photo within an archival montage (where the photos belong
  to the same era and subject)
- Within-beat seam where pacing is `breathing` and a hard cut would
  feel too fast

**Avoid for:**
- Within-beat fast pacing (the dissolve drags the pace)
- Time-jumps spanning decades (the dissolve under-claims the gap;
  use fade to black)
- Cuts into title cards (use fade — see §2c)
- Casualty list / memorial moment to next segment (use fade)
- More than ~30% of seams across an episode (dissolve fatigue)

**Parallax palette mapping.** Exists: `dissolve` (opacity crossfade
+ subtle 1.02 scale shift for depth). Currently the default at beat
boundaries via `apply_default_transitions` Rule 1. Correct doctrine.

### 2c. Fade-through-black — "section break / time-jump / silence beat"

**References:**
- The Economist Films — chapter breaks fade to black for ~0.4–0.6s
  before the next chapter card appears. The black holds beat counts
  the silence beat.
- PBS *Frontline* — sustained-investigative documentaries use
  fade-to-black between acts; the black is part of the editorial
  punctuation, not just a transition.
- NYT VI *Day of Rage* and *Bucha* — fade-to-black appears at the
  major structural breaks (start of an act, the end of the
  investigation, the moment a witness's testimony begins). Reserved
  punctuation, not connective tissue.
- Adam Curtis BBC documentaries — fades-to-black mark thematic
  breaks; the absence of visual + music dip is itself a beat.

**Implicit claim.** *Section break. The current argument has closed;
the next one begins after a beat of silence.*

**Use for:**
- Cold-open → episode title card
- Title card → first segment of the body
- Major chapter break (BEAT 2 → BEAT 3 where the chapters are
  fundamentally different arguments, not continuations)
- The end-card fade-in (per `apply_default_transitions` Rule 6)
- Memorial / casualty moment to next segment (the silence is
  editorial)
- Any seam where the audio bed also dips to silence

**Avoid for:**
- Within-beat continuation (use cut or dissolve)
- Frequent use — every fade is a punctuation mark; cumulative effect
  dilutes; ~3–5 per 14-minute episode is the upper bound
- Dissolves where what you really want is a beat of silence (don't
  dissolve through black; fade through black with held silence)

**Parallax palette mapping.** Exists: `fade` (opacity crossfade, no
scale). Currently used by `apply_default_transitions` Rule 2 for
title cards. Correct doctrine — but the documentation should
emphasize that `fade` is the *section-break* transition, not just
the title-card-mood transition.

### 2d. Match cut — "visual continuity across a logical seam"

**References:**
- NYT VI *Day of Rage* — match cuts from rioter cellphone footage to
  CCTV footage of the same physical space, holding the geographic
  registration so the viewer doesn't lose orientation across the
  seam. *"The maps and the 3D models of the Capitol building became
  invaluable in giving viewers space to breathe and reorient
  themselves between the footage."*
  ([Berkeley News, Day of Rage](https://news.berkeley.edu/2022/01/26/day-of-rage-film-coproduced-by-berkeley-alumna-on-oscar-shortlist/))
- NYT *Greenland Is Melting Away* (Derek Watkins, 2015) — satellite
  imagery match-cuts down through scales (continent → ice sheet →
  research camp). The match is on geographic registration; the
  argument is about scale.
- Errol Morris *The Fog of War* — visual analogies including the
  domino sequence are essentially match-cuts: the dominoes match
  the geographic position of the Communist incursion theory map.
- Match cut pedagogy generally. *"A cut from one shot to another in
  which the composition of the two shots are matched by the action
  or subject and subject matter… match cuts form the basis for
  continuity editing."*
  ([Match cut — Wikipedia](https://en.wikipedia.org/wiki/Match_cut))

**Implicit claim.** *Visual continuity across the seam. The two
segments share a geometric or geographic anchor; the argument moves
without breaking spatial registration.*

**Use for:**
- Photograph → map of the same location (e.g., Taiwan photograph →
  Taiwan in a supply-chain RouteAnimation)
- Map at one scale → map at another scale of the same region (e.g.,
  Eurasia → Taiwan Strait)
- Chart → chart that shares the same axis or y-range (e.g.,
  pre-CHIPS-Act funding chart → post-CHIPS-Act funding chart at the
  same y-axis)
- AtlasPlate → ChoroplethMap of the same projection
- Two photographs of the same subject at different points in time

**Avoid for:**
- Within-beat continuation where the seam isn't actually a match
  (the technique implies a relationship that isn't there)
- Forced matches where the geometry only kind-of aligns
  (reads as "almost a match-cut" — distracting)
- Title cards (no underlying geometry to match)
- Decorative use — match-cut is high editorial weight, ~1–3 per
  episode at most

**Parallax palette mapping.** Exists in code: `match-cut` (synced
zoom for visual continuity — push in on exit, pull out on entry).
**Currently zero production uses.** Underutilized. Per the research,
this is one of the highest-leverage editorial transitions in the
NYT VI / NYT Magazine longform vocabulary, and Parallax's
historical-analogy structure is *exactly* the use case (cold-open
photograph → analytical map of the same region; map at world scale
→ same map zoomed to the chokepoint country). Promote.

### 2e. Color-wash — "register shift"

**References:**
- Bloomberg Quicktake brand identity (2021, Territory Studio) —
  *"explored 'processing' as a graphic trope with a palette that
  uses the concept of 'light' to convey illumination and insight."*
  Color floods are used at register shifts (live news → analysis,
  analysis → opinion). ([designboom interview](https://www.designboom.com/design/bloomberg-quicktake-creative-director-disrupting-the-traditional-tv-news-model-04-27-2021/))
- NYT VI dark-cinema beats — when the register shifts from
  analytical-light to investigation-dark, the seam often runs
  through a brief color wash (typically rust or ink) rather than a
  plain dissolve. The wash carries the register change explicitly.
- The Economist *Off the Charts* video pieces — brief amber wash on
  the seam between the data section and the speculation/forecast
  section. The wash signals "we're shifting register."

**Implicit claim.** *Register shift. The next segment is in a
different editorial register from the current one — analytical to
atmospheric, present to archival, fact to forecast.*

**Use for:**
- Analytical (paper register) → atmospheric (dark cinematic register)
- Present → archival (color wash in oxblood or ink)
- Forecast / speculation segments preceded by data segments
- "And now we shift" moments where the register itself is editorial
- Beat boundaries that coincide with register shift (cumulative
  signal — both the beat and the register change)

**Avoid for:**
- Default beat boundaries (use dissolve)
- Within-beat continuation (use cut)
- Frequent use — color-wash is the loudest transition Parallax has;
  ~1–2 per episode at most
- Bright/saturated colors — wash should be in palette (amber, rust,
  ink, oxblood); a teal or magenta wash is out-of-register

**Parallax palette mapping.** Exists: `color-wash`. Currently used
sparingly; should be elevated to the *canonical register-shift
transition*. Document that the wash color encodes the *destination*
register (amber → light/editorial; ink/oxblood → dark/investigation).

### 2f. Iris-in / iris-out — "cinematic open or close"

**References:**
- The Economist Films opening sequences — episode title appears
  through an iris reveal on a few productions; reserved for the
  cinematic-opener register.
- Adam Curtis BBC documentaries occasionally use iris transitions
  on archival material; reads as a 1920s newsreel quotation.
- Conventional documentary opener pedagogy treats the iris as
  vintage / pre-sound-era reference. *"Cinematic opener"* is the
  default `TRANSITION_CATALOG` description in code.

**Implicit claim.** *Cinematic open or close. This segment is being
opened or closed with intent, framed as a beginning or an ending.*

**Use for:**
- Episode cold-open → episode title card
- Final segment → end card (iris-out)
- Archival-pastiche moments deliberately invoking 1920s newsreel
  register (rare; episode-specific)
- The dramatic-open beat where the channel wants to claim
  "documentary opener" register explicitly

**Avoid for:**
- Within-beat (always wrong — iris breaks the analytical register)
- Beat boundaries (use dissolve or color-wash; iris is too theatrical)
- Casual use — iris is among the highest-weight transitions
  Parallax has; budget ~0–1 per episode

**Parallax palette mapping.** Exists: `iris` (circular reveal from
center with accent ring). Currently used at episode opens. Correct
doctrine; should be explicitly documented as opener-only.

### 2g. Audio-bridged cut (J-cut / L-cut) — "invisible continuity"

**References:**
- Errol Morris *The Fog of War* (2003) — McNamara's audio runs
  across cuts to archival footage and back, threading the
  testimony across visually unrelated b-roll. The audio bridge IS
  the editorial argument that "this all belongs to one thought."
  ([Senses of Cinema, Morris interview](https://www.sensesofcinema.com/2004/politics-and-the-documentary/errol_morris_interview/))
- Documentary editing pedagogy at large. *"J-cuts and L-cuts are
  fundamentally designed to improve flow… they help prevent editing
  from feeling abrupt or 'staccato.' By providing an auditory bridge
  across the visual cut, they act as a buffer, easing the
  transition between shots… creating a more fluid viewing
  experience."* ([Soundstripe, J/L cuts](https://www.soundstripe.com/blogs/a-video-editors-guide-to-j-cuts-and-l-cuts))
- NYT VI standard practice — narrator audio from segment N+1 begins
  ~0.5–1.0s before the visual cut; the next segment "arrives
  spoken-into" rather than "arrives cold."

**Implicit claim.** *Invisible continuity. The cut is real, but the
audio carries the viewer across the seam so the visual change feels
inevitable rather than introduced.*

**Use for:**
- The default within-beat transition for narration-led editorial
- Any seam where the narration runs straight across the cut
- The seam *before* a section card (audio bed dips just before the
  fade-to-black; the next chapter's first word lands on the title
  card)
- Photo → chart seams where the narrator names what's on the chart
  before the chart appears

**Avoid for:**
- Memorial / silence beats (the audio bridge fights the silence)
- Title-card → segment seams where the title is meant to land in
  its own beat of silence
- Casualty-list segments (silence is the point)

**Parallax palette mapping.** **Does not exist as a `TransitionType`**
and shouldn't — J-cut/L-cut is an audio scheduling decision, not a
visual transition. Lives in the audio-spec layer, not the
`Transitions.tsx` palette. *Worth documenting as a doctrine even
though it isn't a `TransitionType` entry* — the implicit-default
visual transition (cut) is almost always paired with an audio bridge
in real editing, and authors should know to schedule it.

### 2h. Chapter card / slate — "this section is named"

**References:**
- FT *Big Read* video adaptations — chapter titles appear as
  full-canvas cards between beats; the typography tracks in and
  holds, the page itself doesn't drift.
- The Economist Films — section dividers are typography-centric
  cards held in silence for 1.5–2.5 seconds; preceding seam is a
  fade-to-black, following seam is a fade-in to the first segment.
- PBS *Frontline* — major-act dividers are slate cards held with
  music dip; same fade-to-black framing on either side.
- NYT Magazine longform video — chapter cards function as
  punctuation; held longer than a title (~3s) and named with the
  chapter theme rather than just a number.

**Implicit claim.** *This section is named. The next stretch of
material is grouped under this header.*

**Use for:**
- Beat boundaries that are genuinely chapter-scale (BEAT 1 → BEAT 2
  of a four-beat episode, not segment 5 → segment 6 within a beat)
- The episode title card (a chapter card for the whole piece)
- Per-beat section openers (current Parallax doctrine — see
  `title-section-*.json` files in silicon-trap)
- The final end-card

**Avoid for:**
- Within-beat segment-to-segment (too heavy)
- Decorative subtitles or kickers (too heavy; use SectionHeader)
- Frequent use mid-episode — chapter cards accrue weight by being
  rare; 4–6 per episode (one per beat) is the upper bound

**Parallax palette mapping.** This isn't a `TransitionType` — it's a
*segment* (the `TitleTransition` template). But it's the editorial
equivalent of a transition because it sits *between* beats and
declares the seam. The transitions *around* the chapter card (fade
in, fade out) are the actual `Transitions.tsx` work; the card
itself is content. Document the pair: chapter card always preceded
by fade and followed by fade.

---

## 3. General principles

The design-theory backbone for segment-to-segment transitions:

- **Most seams are cuts.** Walter Murch's *In the Blink of an Eye*
  (1995): the cut is the default because human visual perception
  already cuts during blinks. Smoother transitions (dissolves,
  fades) read as motivated — they say "the relationship between
  these two shots is *not* the default." This sets the editorial
  load: cuts free the dissolve to mean something.
- **Audio leads visual.** The J-cut/L-cut tradition is universal in
  documentary editing. The narrator's audio from segment N+1
  starting ~0.5–1.0s before the visual cut to segment N+1 is what
  makes the cut feel inevitable rather than introduced. Visual
  transitions without audio coupling read as music-video, not
  editorial.
- **Editorial register limits the palette.** Wipes, whip-pans, and
  spatial zooms are common in sports broadcast and YouTube
  explainer; they don't appear in NYT VI, FT Films, or The
  Economist Films. The asymmetry is institutional: mid-century
  editorial register treats every cut as a sentence, every wipe as
  a shout. Parallax sits squarely in the editorial register.
- **Transition density correlates with pace, not quality.** A
  14-minute analytical essay with 100 segments has ~99 seams. At
  NYT VI baseline (~70% hard cut, ~20% dissolve, ~5% fade, ~3%
  match-cut, ~2% color-wash or special), that's ~5 dissolves, ~3
  fades, ~1 match-cut, ~1 color-wash per episode. Anything denser
  than that reads as restless.
- **The transition encodes the relationship, not the contrast.**
  Two segments with very different content can be joined by a cut
  if the *argumentative relationship* is continuation. Two
  segments with very similar content can be joined by a fade if
  the *argumentative relationship* is a beat break. The visual
  similarity isn't the cue; the editorial relationship is.
- **Restraint compounds.** Per the bounded-analogy doctrine in
  PROJECT_VISION: Parallax buys credibility through restraint. The
  more conservative the transition palette in 90% of seams, the
  more weight accrues to the 10% where a match-cut, color-wash, or
  iris does appear. A channel that whip-pans every other segment
  can't whip-pan dramatically; a channel that cuts 70% of the time
  can match-cut once per episode and have it land.

---

## 4. Recommendation for Parallax

**Doctrine: cuts default, dissolves for beats, fades for chapters,
match-cuts for geographic/scale continuity, color-wash for register
shifts.** Wipes and whip-pans are out-of-register for Parallax and
should be deprecated. Match-cut is undervalued and should be
promoted.

### Context A — Within-beat segment-to-segment

**Default:** `cut` (paired with audio bridge in the audio spec).

The narration runs across the seam; segment B is the next breath
of segment A. The cut is invisible because the audio carries the
viewer. This is the editorial baseline — NYT VI uses hard cuts for
~70% of all seams, and Parallax should match.

**Alternative:** `dissolve` (0.3s) when pace is `breathing` or when
segment B is the *consequence* of segment A and the script wants
the seam to feel slower. The pace-driven upgrade in
`apply_default_transitions` Rule 7 already does this correctly.

**Forbidden:** wipes, whip-pans, blur-through. They read as
PowerPoint or YouTube explainer in the analytical register.

### Context B — Beat-boundary segment-to-segment

**Default:** `dissolve` (0.5s) when the next beat is a continuation
of the same argument. The dissolve says "elaboration, same register."

**Alternative 1:** Chapter card + `fade` (0.6s in / 0.6s out) when
the next beat is a genuine section break. The fade-card-fade pattern
is the chapter-card grammar; document explicitly that beat
boundaries fall into "continuation" or "chapter break" categories
and the transition choice follows.

**Alternative 2:** `match-cut` (0.4s) when the next beat opens with
a visual that shares geometric/geographic registration with the
last segment of the current beat (e.g., end of BEAT 2 is the supply
chain RouteAnimation on Eurasia; BEAT 3 opens on a Taiwan
AtlasPlate at the same map projection). High editorial weight;
~1–2 per episode max.

**Forbidden:** hard cut at beat boundaries. The cut under-claims
the structural shift; the viewer registers the beat boundary by the
narration content alone, not the visual rhythm. (The current
`apply_default_transitions` Rule 1 — dissolve at beat boundary —
is correct; document why.)

### Context C — Title-card transitions (into and out of)

**Into a title card** (the segment *before* the card):
- **Default:** `fade` (0.5s) on the outgoing segment.
- The outgoing segment fades to background; the title card
  appears clean against the cleared screen.
- Pair with an audio dip — the audio bed drops to silence ~0.3s
  before the visual fade completes, so the title card lands in
  silence (D18 cold-open doctrine).

**Out of a title card** (the segment *after* the card):
- **Default:** `fade` (0.6s) on the title card and the incoming
  segment.
- The title card holds for its full duration in silence; then
  fades, and the first segment of the named beat fades in.
- Pair with the audio bed restarting ~0.2s into the fade-in (so
  the music lands as the visual content becomes legible).

**Alternative:** `iris-in` for the cold-open → episode title card
seam, and `iris-out` for the final segment → end-card seam.
Reserved for the highest-weight title-card moments (the episode's
two outermost seams). Per `apply_default_transitions` Rule 6,
end-card already gets a longer fade-in; the iris is the upgraded
alternative for episodes that want a more cinematic close.

**Forbidden:** hard cut into or out of a title card. (The current
Rule 2 — title cards always fade — is correct.)

### Context D — Register-shift transitions

**Default:** `color-wash` (0.7s) when the seam crosses from one
visual register to another (analytical light → atmospheric dark,
present → archival, fact → forecast).

The wash color encodes the *destination* register:
- Amber wash → into editorial / analytical (the channel's home
  register)
- Ink or oxblood wash → into investigation / dark cinematic
- Rust wash → into tension / urgency (Beat 4 climax moments)
- Paper / bone wash → into archival (mid-century document
  register)

**Alternative:** `fade` (through black) when the register shift is
also a major structural beat. Black is the universal silence; pair
with audio dip.

**Forbidden:** `cut` across a register shift. The cut under-claims
the shift; viewer doesn't register that something has changed
until 1–2 seconds into segment B.

### Specific cross-context rules

1. **Audio bridges every hard cut.** Hard cut as a `TransitionType`
   is paired with a J/L audio schedule in the audio spec. The
   `audio-spec` skill should know to start segment N+1's narration
   ~0.5–1.0s before segment N+1's visual cut. *Not currently
   enforced.* Should be a default in `generate_audio_manifest.py`.
2. **Every chapter card is fade-card-fade.** The card itself holds
   in silence (D18); the seams on either side are `fade`. The
   `apply_default_transitions` Rule 2 + Rule 2-addendum already
   does this. Keep.
3. **Match-cut requires explicit script-side opt-in.** The
   technique is too high-weight to auto-default. The script
   directive `DIR: cut(match)` (already supported by the parser)
   is the correct surface; the `visual-spec` skill should look for
   geometric continuity opportunities and emit `DIR: cut(match)`
   when adjacent segments share a registration anchor.
4. **Color-wash requires explicit script-side opt-in.** Same
   reasoning. Surface: `DIR: cut(color-wash, color=amber)`.
5. **Iris is opener-only.** Surface: `DIR: cut(iris)` only on the
   episode's cold-open → title-card seam and the final segment →
   end-card seam. Anywhere else, lint should flag.
6. **Forbidden transitions don't appear in the script directive
   vocabulary.** Wipes, whip-pan, blur-through, spatial-zoom
   should not be reachable via `DIR: cut(...)`. Either remove them
   from `Transitions.tsx` or move them to a `legacy/` subfolder
   and remove from the `TransitionType` union.

---

## 5. Current template alignment

### `apply_default_transitions` — six rules audited

| # | Rule | Verdict | Notes |
|---|---|---|---|
| 0 | DIR directive on previous segment wins | ✓ correct | Highest priority — author overrides should always win |
| 1 | Beat boundaries → dissolve (0.5s) | ✓ correct | NYT VI baseline matches; dissolve is the right "elaboration, same register" default |
| 2 | Title cards → fade (0.6s in/out) | ✓ correct | Universal editorial convention; chapter card grammar |
| 3 | Within-beat → cut | ✓ correct | NYT VI baseline; the editorial default |
| 4 | Template → template (same layer) → brief dissolve (0.3s) | ⚠ revisit | Conflates "same layer continuation" with "elaboration"; many same-layer same-beat seams should be hard cuts. Consider narrowing to "template → template where prev's component changed" |
| 5 | HOLD segments → no transition | ✓ correct | Holds sustain; transitioning a hold defeats the hold |
| 6 | End-card → longer fade-in (0.8s) | ✓ correct | Cinematic close; matches the iris-out alternative when used |
| 7 | Pace-driven adjustments (urgent / breathing) | ✓ correct | Good editorial wiring; the upgrade dissolves are right for breathing pace |

**Rule 4 deserves a closer look.** The current condition is `prev_is_template && curr_is_template && !is_title && !beat_changed` — i.e., any two template segments in the same beat get a 0.3s dissolve. In practice, this means most within-beat seams between a chart and the next chart get dissolved when the NYT VI baseline would cut. Proposed revision: tighten to *only* dissolve when the previous template's `component` differs from the current's *and* both belong to different visual registers (e.g., chart → photo, photo → map). Same-register chart → chart should be a cut.

### Twelve transitions in code — usage audit

Production-used (5 of 12):

| Transition | Used in | Doctrine fit |
|---|---|---|
| `cut` | Default within-beat, 70%+ of seams | ✓ canonical |
| `fade` | Title cards, end-card, chapter breaks | ✓ canonical |
| `dissolve` | Beat boundaries, pace=breathing | ✓ canonical |
| `color-wash` | Register shifts (rare) | ✓ canonical |
| `iris` | Episode cold-open, end-card | ✓ canonical |

Production-unused (7 of 12):

| Transition | Doctrine assessment |
|---|---|
| `match-cut` | **Under-promoted.** Highly leveraged in NYT VI / NYT Magazine longform. The historical-analogy structure of Parallax (cold-open photo of Taiwan → Taiwan supply chain map; world map → chokepoint country zoom) is the canonical use case. Promote to script-side directive `DIR: cut(match)` with `visual-spec` skill auto-detecting geographic registration matches. |
| `wipe-left` | **Off-register.** Reads as PowerPoint / sports broadcast. Deprecate. |
| `wipe-right` | **Off-register.** Same. Deprecate. |
| `wipe-up` | **Off-register.** Same. Deprecate. |
| `whip-pan` | **Off-register for editorial; in-register for cinematic.** Aggressive, energetic, fast-paced — works for Vice News / sports highlight reels. Out-of-character for Parallax's mid-century-newsroom register. Deprecate from the doctrine vocabulary; keep in code if any future Shorts work wants the energy register. |
| `blur-through` | **Over-built.** Reads as dream sequence / memory transition (cinematic, not editorial). No NYT VI / FT / Economist precedent in this dossier's research. Deprecate. |
| `spatial-zoom` | **Over-built and off-register.** Reads as After Effects template; the editorial outlets reach for `match-cut` instead when they want depth/scale continuity (the match-cut already includes a synced zoom; spatial-zoom over-claims). Deprecate. |

**Net.** The five used transitions form the canonical editorial palette. Of the seven unused, one (`match-cut`) is the most valuable in the codebase and should be promoted, not deprecated. The other six are either off-register (wipes, whip-pan) or over-built (blur-through, spatial-zoom) and should be removed from the active vocabulary.

---

## 6. Specific upgrades proposed

Ranked by impact/effort ratio.

### Upgrade 1 — Promote `match-cut` to first-class editorial transition

**Effort:** ~half day (skill wiring + 2 episode backfills + doc).
**Impact:** Unlocks the most-leveraged editorial transition in the
NYT VI vocabulary; gives the channel a signature visual-continuity
move that fits the historical-analogy form perfectly.

Work:
1. Add `match-cut` to the `VALID_DIR_TRANSITIONS` whitelist in
   `tools/assembly/generate_manifest.py` if not already (it's
   parsed as a `TransitionType` but not promoted).
2. Update the `visual-spec` skill to look for geographic /
   geometric registration matches between adjacent segments. When
   segment N ends on a Taiwan map and segment N+1 opens on a Taiwan
   AtlasPlate or photograph at similar framing, propose
   `DIR: cut(match)` on segment N's outgoing transition.
3. Backfill two episodes (silicon-trap, prisoners-dilemma) with the
   1–2 canonical match-cut opportunities each. For silicon-trap:
   end-of-cold-open Taiwan photo → BEAT 1 Taiwan map (proposed
   match-cut). For prisoners-dilemma: end-of-BEAT-2 RAND
   photograph → BEAT 3 Flood-Dresher chessboard at the same scale.
4. Document in this dossier (already in §2d) and in
   `DIRECTING_LANGUAGE.md` (the existing `DIR: cut(...)`
   vocabulary entry).

### Upgrade 2 — Deprecate off-register transitions

**Effort:** ~1 hr. **Impact:** Cleans the palette; reduces the
chance script authors reach for a wrong transition.

Work:
1. Move `wipe-left`, `wipe-right`, `wipe-up`, `whip-pan`,
   `blur-through`, `spatial-zoom` out of the active `TransitionType`
   union. Either:
   - **Option A (recommended):** Remove from the union and from
     `TRANSITION_CATALOG`. Keep the implementation code commented
     in `Transitions.tsx` under a `// Legacy — see
     transition-grammar.md` heading in case a future Shorts work
     wants the energy register.
   - **Option B (conservative):** Keep in the union but mark
     `deprecated: true` in `TRANSITION_CATALOG` metadata; have lint
     flag `DIR: cut(<deprecated>)` directives as warnings.
2. Update `generate_manifest.py`'s `VALID_DIR_TRANSITIONS` set to
   exclude the deprecated names.
3. Document the deprecation here and in `POLISH.md` if a doctrine
   rule is added.

### Upgrade 3 — Promote `color-wash` to the canonical register-shift transition

**Effort:** ~2 hr (parser extension + skill wiring + 1 episode
backfill). **Impact:** Gives the channel a deliberate register-shift
move with a documented color vocabulary.

Work:
1. Extend `DIR: cut(color-wash, color=<palette-name>)` parsing in
   `generate_manifest.py` to accept palette color names (amber,
   rust, ink, oxblood, paper, bone) and resolve them via
   `palette.json`.
2. Update the `visual-spec` skill to look for register shifts in
   the script (annotated via `REGISTER:` markers if they exist, or
   inferred from `[OVERLAY: preset]` shifts). When a shift is
   detected, propose `DIR: cut(color-wash, color=<dest-register>)`.
3. Backfill silicon-trap: BEAT 1 (analytical) → BEAT 2 (atmospheric
   COCOM Cold War context) is a register shift currently rendered
   as plain dissolve; should be `color-wash` in ink.
4. Document in this dossier (already in §2e) and in
   `DIRECTING_LANGUAGE.md`.

### Upgrade 4 — Tighten `apply_default_transitions` Rule 4

**Effort:** ~1 hr. **Impact:** Closer to NYT VI baseline; fewer
gratuitous within-beat dissolves.

Work:
1. Narrow Rule 4 from "any two template segments → 0.3s dissolve"
   to "two template segments where the components differ AND
   belong to different visual registers (analytical / atmospheric
   / grounding) → 0.3s dissolve."
2. Add a new Rule 4b: same-register, different-component template
   pairs (e.g., DataChart → BumpChart) → `cut` (no transition).
3. Audit silicon-trap and prisoners-dilemma manifests for cases
   where Rule 4 currently inserts a dissolve that should be a cut;
   either accept the change or pin the dissolve explicitly via
   `DIR: cut(dissolve)`.

### Upgrade 5 — Document and wire J-cut / L-cut audio bridge as default

**Effort:** ~half day (audio-spec extension + doc). **Impact:**
Makes the editorial baseline (audio-led cuts) automatic rather than
manual.

Work:
1. Extend `generate_audio_manifest.py` to schedule the narration
   for segment N+1 to start ~0.5–1.0s before segment N+1's visual
   cut, *unless* the seam is a `fade` (in which case the audio
   should hold silence until ~0.3s after the fade lands) or the
   previous segment is HOLD with `driftPreset: "none"` (silence
   beat).
2. Document the J-cut/L-cut doctrine in `AUDIO_DESIGN.md`.
3. Add a `DIR: audio(land)` directive for the rare seam where the
   audio should land *with* the visual cut rather than bridge it
   (used for stat reveals where the narrator says the number
   simultaneously with the ticker landing).

### Upgrade 6 — Add `slate-card` directive sugar (chapter card pattern)

**Effort:** ~2 hr. **Impact:** Codifies the chapter-card grammar
explicitly instead of relying on `TitleTransition` segments getting
the right transition treatment by Rule 2.

Work:
1. Add a `DIR: chapter(<title>)` directive that emits a
   `TitleTransition` segment with `fade` in/out at 0.6s, audio bed
   dip to silence during the card, and 2.0s hold duration.
2. The script writer doesn't have to remember the fade pairing,
   the audio dip, or the hold duration; the directive owns the
   chapter-card grammar.
3. Backfill silicon-trap's BEAT openers (currently manual
   `title-section-*.json` files) to use the directive.

### Upgrade 7 — Catalog showcase of all transitions on identical content

**Effort:** ~3 hr. **Impact:** Visual reference card for
script-writers; closes the gap that text-animation and hold-motion
both have catalog showcases and transitions doesn't.

Work:
1. Create `catalog/TransitionGrammarShowcase.tsx` rendering 7–8
   compositions showing the same two-segment pair (a chart +
   photo, or two beat openers) joined by each of the canonical
   transitions: cut, dissolve, fade, color-wash, match-cut,
   iris, chapter card.
2. Live in Studio at Catalog → Editorial → TransitionGrammar.
3. Document inline which transition each pair demonstrates and
   the implicit-claim phrasing.

### Upgrade 8 — Lint rules for transition doctrine

**Effort:** ~2 hr. **Impact:** Catches doctrine violations at audit
time rather than after render.

Work:
1. **M-TRANS-DEPRECATED:** flag any segment with a transition in
   the deprecated set (wipes, whip-pan, blur-through,
   spatial-zoom).
2. **M-TRANS-IRIS-MISUSE:** flag any `iris` transition that isn't
   on the cold-open → title-card or final → end-card seam.
3. **M-TRANS-WASH-COLOR:** flag any `color-wash` whose color isn't
   in the palette (amber, rust, ink, oxblood, paper, bone).
4. **M-TRANS-MATCH-NO-ANCHOR:** flag any `match-cut` where neither
   segment provides a visible registration anchor (no map, no
   shared geography, no axis match). Soft warning.
5. **M-TRANS-CHAPTER-CARD-FADE:** flag any TitleTransition segment
   that doesn't have `fade` on both incoming and outgoing seams.

---

## 7. Failure mode flags

These should always trigger an audit finding when seen:

- **Hard cut at a beat boundary.** Under-claims the structural
  shift; viewer registers the beat boundary only from the
  narration content, not the visual rhythm. Beat boundaries
  default to `dissolve` per Rule 1; explicit author override is
  required to opt out.
- **Dissolve at a chapter / section break.** Over-claims
  continuation when the seam is actually a section break. Use
  `fade` (with chapter card) instead.
- **Cut into a title card.** Title cards should always be entered
  by `fade` (Rule 2). A hard cut into a title card reads as
  PowerPoint slide flip.
- **Wipes anywhere in an editorial Parallax episode.** The
  canonical PowerPoint / sports-broadcast anti-pattern. Should be
  caught by M-TRANS-DEPRECATED lint.
- **`color-wash` in a non-palette color.** A teal, magenta, or
  cyan wash is out-of-register. Wash colors live in `palette.json`.
- **`iris` outside the episode opener and end-card.** Iris is
  high-weight and budgeted at 0–2 per episode; misuse is the
  After-Effects-template signature.
- **`match-cut` without geometric continuity.** When the two
  segments don't actually share a registration anchor (no map, no
  shared axis, no spatial match), the match-cut reads as forced.
  The technique implies a relationship that isn't there.
- **`spatial-zoom` or `blur-through` use.** Both transitions
  read as After Effects template, not editorial. Deprecate from
  the active palette.
- **Whip-pan within the analytical register.** The whip-pan is
  energetic / Vice-News / sports-broadcast; out of character for
  Parallax. If a moment genuinely needs energetic urgency, use
  the script's pace=urgent + dissolve→cut downgrade (already wired
  in Rule 7), not a whip-pan.
- **Dissolves >30% of all seams.** Dissolve fatigue. The
  cumulative effect is "every cut is the same cut"; the dissolve
  loses meaning. NYT VI baseline is ~20% dissolves at most.
- **Color-wash on a within-beat seam.** Color-wash is a register-
  shift transition; within-beat seams don't shift register. Reads
  as gratuitous.
- **Audio bridge absent on a hard cut.** Per §3, every hard cut
  should have a J-cut/L-cut audio bridge. Bare cuts with synced
  audio read as music-video, not editorial. Audio scheduling
  should be enforced at the audio-spec layer.
- **Match-cut + visible scale jump but no narration covering the
  scale.** Match-cut on its own implies "same scene, different
  angle"; if the script jumps scales (continent → country) without
  the narration noting the scale change, viewer registers the
  match-cut as a non-sequitur. Pair match-cuts with explicit
  scale-naming in the narration.
- **Chapter card without surrounding fade.** Title cards held
  against a hard-cut entry or exit lose the silence beat that
  makes them work as chapter punctuation. Always fade in, hold,
  fade out.
- **>1 iris per episode.** Iris is reserved for the cold-open
  opener and (optionally) the end-card close. Anything else is
  decorative.
- **`match-cut` between segments where the visual content
  diverges mid-transition.** The synced zoom assumes the two
  endpoints are visually compatible. If segment A's foreground is
  amber and segment B's foreground is ink, the zoom looks broken.
  Match-cut requires both visual and chromatic continuity at the
  seam.

---

## TL;DR

**Parallax's segment-to-segment transition palette, by editorial context:**

| Seam | Default | Why |
|---|---|---|
| Within-beat segment-to-segment | `cut` | NYT VI baseline; audio bridges the seam |
| Beat-boundary continuation | `dissolve` (0.5s) | "Elaboration, same register" |
| Beat-boundary chapter break | Chapter card + `fade` (0.6s) | "This section is named" |
| Beat-boundary scale/geographic shift | `match-cut` (0.4s) | Visual continuity across logical break |
| Title-card incoming | `fade` (0.5s) | Universal chapter-card grammar |
| Title-card outgoing | `fade` (0.6s) | Card lands and exits in silence |
| End-card | `fade` (0.8s) or `iris-out` | Cinematic close |
| Cold-open → title | `iris-in` or `fade` | Cinematic open |
| Register shift (analytical → atmospheric) | `color-wash` (amber/ink/oxblood) | "Register shift" |
| Time-jump (decades) | `fade` through black | Silence carries the jump |
| Memorial / casualty / silence beat to next | `fade` with audio dip | Silence is editorial |

**Eight canonical idioms** map to five existing `TransitionType`s
(cut, fade, dissolve, color-wash, iris) plus one promoted transition
(`match-cut`), one audio-spec move (J/L cut audio bridge), and one
non-transition convention (chapter card pattern).

**Seven existing `TransitionType`s should be deprecated** from the
active doctrine vocabulary: wipe-left, wipe-right, wipe-up,
whip-pan, blur-through, spatial-zoom (off-register or over-built).
Match-cut alone among the unused is the most valuable transition in
the entire palette and should be promoted aggressively.

**The doctrine work is palette curation + match-cut promotion +
color-wash documentation + J/L cut audio enforcement.** The
technical surface (twelve transitions implemented) is over-built
relative to the editorial register; the doctrine work shrinks the
active set, names what each remaining transition claims, and wires
the script-side directives so authors can reach for the right move
without re-deriving the doctrine each time.

---

## References

- NYT Visual Investigations playlist (2017–present): *Day of Rage*
  (2021), *Bucha* (2022), *Mariupol Drama Theatre* (2022).
  ([NYT VI playlist](https://www.youtube.com/playlist?list=PL4CGYNsoW2iAZt9-UzPyPZOH-AlRMxcIE))
- *Day of Rage* Berkeley News piece on the editorial method —
  "maps and the 3D models of the Capitol building became
  invaluable in giving viewers space to breathe and reorient
  themselves between the footage."
  ([Berkeley News](https://news.berkeley.edu/2022/01/26/day-of-rage-film-coproduced-by-berkeley-alumna-on-oscar-shortlist/))
- Rex Studio / Alexander Cardia case study on the NYT Visual
  Investigations design system — motion graphics are designed to
  be "elegant and functional, with locators, annotations, and
  maps used sparingly, providing support to the edit and
  consistently orienting viewers."
  ([Rex Studio](https://www.rex.studio/work/nyt))
- Watkins, D. & NYT Graphics. *Greenland Is Melting Away* (2015).
  Match-cuts across satellite scales — the editorial argument
  about scale carried by the matched geographic registration.
  ([Storybench](https://www.storybench.org/how-the-nyts-derek-watkins-designed-greenland-is-melting-away/))
- FT Films / FT *Big Read* video adaptations and FT video strategy
  interview — *Press Gazette* coverage on the FT video team's
  "craft editor" pedigree and tight-storytelling doctrine.
  ([Press Gazette](https://pressgazette.co.uk/publishers/broadcast/financial-times-video-journalism-youtube/))
- The Economist Films and Daily Charts video — section / chapter
  conventions and animation doctrine described in *Off the
  Charts* substack and Digiday's launch coverage.
  ([Digiday](https://digiday.com/media/economist-films-uk-magazine-launches-first-film-studio/))
- Bloomberg Quicktake brand & motion identity, Territory Studio
  (2021). "Processing" graphic trope; light/illumination palette
  approach. ([designboom interview](https://www.designboom.com/design/bloomberg-quicktake-creative-director-disrupting-the-traditional-tv-news-model-04-27-2021/))
- Vox Atlas — combination of Google Earth Studio orbits with
  GEOlayers 3 plug-in; "3D camera track backward with a touch of
  blur" as the canonical Vox transition idiom.
  ([Storybench](https://www.storybench.org/vox-atlas-producer-sam-ellis-on-his-map-animations/),
  [Google Earth Medium](https://medium.com/google-earth/how-vox-video-uses-earth-studio-for-dynamic-visual-storytelling-703fc871766e))
- Morris, E. *The Fog of War* (2003) — Interrotron-driven
  interviews, slow-motion / fast-motion overlay analogy work,
  jump cutting across archival footage. *Senses of Cinema*
  interview.
  ([Senses of Cinema](https://www.sensesofcinema.com/2004/politics-and-the-documentary/errol_morris_interview/))
- Curtis, A. (BBC) — *Pandora's Box* (1992), *HyperNormalisation*
  (2016), *TraumaZone* (2022). Whiplash digressions, atmospheric
  scoring, archive juxtaposition. Sound-stings as scene
  transitions ("sudden, jarring, industrial sounds"). *The
  Drift* essay on *TraumaZone*'s shift to silence + captions.
  ([The Drift](https://www.thedriftmag.com/all-roll-is-b-roll/),
  [Adam Curtis — Wikipedia](https://en.wikipedia.org/wiki/Adam_Curtis))
- Match cut — Wikipedia (definition and continuity-editing
  context). *"A cut from one shot to another in which the
  composition of the two shots are matched by the action or
  subject and subject matter."*
  ([Wikipedia](https://en.wikipedia.org/wiki/Match_cut))
- J-Cut / L-Cut — documentary editing pedagogy. *"Auditory bridge
  across the visual cut… acts as a buffer, easing the transition
  between shots… creating a more fluid viewing experience."*
  ([Soundstripe J/L cuts](https://www.soundstripe.com/blogs/a-video-editors-guide-to-j-cuts-and-l-cuts),
  [Adobe L and J Cut](https://www.adobe.com/creativecloud/video/post-production/cuts-in-film/l-and-j-cut.html))
- Hard cut definition. *"A hard cut is when one piece of video
  abruptly switches to another with no in-between animations or
  opacity changes."* ([UD Library, 2024](https://library.udel.edu/news/2024/02/05/a-guide-to-video-transitions-the-hard-cut/))
- Cross-dissolve definition. *"Usually used to imply a greater
  passing of time or a more profound change of location or
  storyline than would be achieved with a normal cross fade."*
  ([Adobe Cross Dissolve](https://www.adobe.com/creativecloud/video/post-production/transitions/dissolve.html))
- Whoosh / transition audio. Sound design pedagogy on whoosh-on-
  match-cut and whoosh-on-whip-pan; sports vs cinematic
  transitions. ([Lens Distortions Whooshes](https://lensdistortions.com/sfx/category/whooshes/),
  [Pixflow whoosh guide](https://pixflow.net/blog/cinematic-whoosh-sound-effects/))
- Murch, W. *In the Blink of an Eye* (1995, 2001) — the cut as the
  perceptual default; smoother transitions as motivated rather
  than neutral.
- *project/HOLD_MOTION_REGISTER.md* — sibling doctrine doc; this
  dossier parallels its structure.
- *project/TEXT_ANIMATION_REGISTER.md* — sibling doctrine doc.
- *remotion-templates/src/components/Transitions.tsx* — the
  technical surface this dossier evaluates.
- *tools/assembly/generate_manifest.py* `apply_default_transitions`
  — the six implicit-default rules audited in §5.
