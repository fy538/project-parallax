# Parallax — Pacing Register

## Purpose

This document names Parallax's three canonical pacing profiles and matches each to its editorial context. It exists so that script-writing and visual-spec skills can assign the right pacing register to a given beat — not by leaving timing to default, but by following clear use-case rules grounded in the channel's editorial argument.

**Pacing is not a timing dial.** Choosing `analytical` for a tension-building beat doesn't just make the visuals slightly slow — it makes a *wrong factual claim* about what kind of argument this moment is. A breathing-paced cold open claims "there is time for reflection here" when there isn't yet; an urgent-paced emotional landing claims "this revelation requires speed" when it requires weight. The wrong pacing profile reads as a category error, not a technical miscalibration.

Created: May 19, 2026

**Related docs:**
- **PACING_SYSTEM.md** — technical implementation: `PACE:` annotation syntax, `PACE_MULTIPLIERS`, manifest generator, Whisper sync loop, proportional camera paths
- **VISUAL_LANGUAGE.md** — three-register system (Analytical / Atmospheric / Grounding); pacing interacts with register choices
- **DIRECTING_LANGUAGE.md** — `DIR:` annotation vocabulary; `PACE:` annotations live alongside `DIR:` in the script right column
- **HOLD_MOTION_REGISTER.md** — sibling doc (hold-beat motion); each pacing profile pairs with specific hold techniques
- **TEXT_ANIMATION_REGISTER.md** — sibling doc (text animation); animation technique selection responds to pacing
- **TRANSITION_GRAMMAR.md** — pace-driven transition duration rules; urgent compresses, breathing stretches

---

## Why a register, not a timer

Pacing is a **register choice**. Each profile carries an implicit claim about what kind of argument this moment is making:

| Profile | Implicit claim |
|---|---|
| **Urgent** | "Evidence is arriving faster than comfortable; the viewer must keep pace with the argument" |
| **Analytical** | "There is enough time to read this carefully; the argument trusts the viewer's attention" |
| **Breathing** | "Something has just been revealed; the viewer needs space before the next move" |

When the moment matches the profile's claim, pacing *amplifies* the argument. The rapid-fire evidence sequence feels relentless because it is relentless. The held emotional reveal feels weighty because the frame is not rushing away from it. When the moment mismatches the profile, pacing *competes* — urgency applied to the major reveal makes the revelation feel like trivia; breathing applied to the evidence cascade makes the evidence feel obvious.

**The wrong pacing profile doesn't look wrong — it argues wrong.**

---

## Quick reference

| Profile | Multiplier | Target change rate | Best for | Avoid when |
|---|---|---|---|---|
| `urgent` | 0.7× | 2–4s per visual change | Cold open hook, tension build, evidence cascade, escalation sequence | The argument requires the viewer to read carefully; complex charts; emotional peaks |
| `analytical` | 1.0× | 4–6s per visual change | Framework explanation, data presentation, geographic argument, most of the episode body | Anything building pure emotional tension; anything requiring post-reveal absorption |
| `breathing` | 1.4× | 6–10s per visual change | Major reveal, emotional landing, bounded-analogy moment, chapter close | Episode cold open; evidence piling up; anything where lingering reads as pacing failure |

**Default:** `analytical`. Segments without a `PACE:` annotation receive the 1.0× baseline. See PACING_SYSTEM.md for annotation syntax.

---

## 01 · Urgent

**Multiplier:** 0.7× (30% shorter than baseline composition durations)

**Target rate:** 2–4 seconds per visual change

**Implicit claim:** "Evidence is arriving faster than comfortable; the viewer must keep pace with the argument."

### What it signals to the viewer

Urgent pacing communicates accumulation. When cuts arrive before the viewer finishes processing, the brain interprets the sequence as *more evidence than can be held* — which is often the editorial point. The feeling is cognitive momentum, not anxiety; the narrator is staying ahead of the viewer by design. Used correctly, urgent pacing is disciplined acceleration, not chaos.

The wrong read of urgent is "fast = exciting." Fast on thin content reads as frantic. Fast on dense content with no shared argument reads as confusing. Urgent pacing only amplifies argument when the underlying visual content is already sequentially organized — each cut is the next piece of a coherent accumulation, not the next random image.

### How it interacts with the three visual registers

- **Analytical (Register 1):** The home register for urgent. Charts, maps, typography cards in rapid succession, each landing one new fact. The analytical visual surface handles urgency because the design is self-explanatory at a glance — axis labels, headline, data. A DataChart at 3 seconds still communicates its central stat; a FrameworkDiagram at 3 seconds does not.
- **Atmospheric (Register 2):** Dangerous at urgent pacing. Constructivist illustration at 30-40% opacity behind narration can tolerate urgent cutting only when the narration is doing all the work; the atmospheric image should not be the primary communicant if the viewer has only 2-3 seconds with it. Reserve: 1-2 atmospheric beats maximum in an urgent stretch.
- **Grounding (Register 3):** Use very sparingly. Depersonalized figurative scenes need 4-6 seconds minimum to register the spatial argument. Urgent-paced grounding scenes flash past as mood texture, not argument. Acceptable for rapid montage (pre-1980s industrial sequence), not acceptable for scenes carrying spatial or narrative weight.

### Episode arc placement

- **Cold open (BEAT 0):** The home position for urgent in most episodes. Silicon Trap opens with rapid juxtaposition — TSMC Arizona aerial, 5nm cross-section, $25 trillion figure — because the hook argument ("something enormous is at stake before you understand why") requires accumulation faster than comprehension. Prisoners' Dilemma cold open cuts between Nash's memoir, Rand's Santa Monica offices, and today's strategy memos at urgent pace to establish that "a 1950 thought experiment is running today's world."
- **Evidence cascade (mid-body):** The second natural home. When Beat 2 or Beat 3 lays out five supporting data points in sequence, each one building the case, urgent pacing prevents the cascade from feeling like a list.
- **Escalation sequence:** An EscalationLadder revealing rungs one by one at urgent pace makes the ladder feel like it climbs faster than it should — which is the argument. Blockades & Leaks BEAT 3 (the leak acceleration) uses this.

### Transition interaction

At urgent pace, the manifest generator compresses transition durations by ×0.6. A cross-dissolve that would take 0.5s at analytical takes 0.3s at urgent. Consequence: **dissolve transitions become nearly invisible at urgent pace**, which is correct — the seam should feel like a fast cut with a hint of continuity. Avoid iris transitions at urgent pace; their 0.8s default duration becomes a brake on momentum even at ×0.6.

Hard cuts are the default at urgent pace. Audio bridges (narrationLeadIn) are reduced from 0.7s to ~0.4s. See PACING_SYSTEM.md Rule 7 and TRANSITION_GRAMMAR.md for the full compression rules.

### Hold-motion interaction

Urgent pace pairs with Editorial drift (technique 02 from HOLD_MOTION_REGISTER.md). The 1.02 scale over a short composition is barely perceptible — which is correct, since at 2-3 seconds the hold window is too brief for motion to register meaningfully anyway. Breathing motion (technique 03) is contraindicated at urgent pace: the sinusoidal ~8s cycle can't complete within a 2-3 second window and produces only a fraction of a pulse — reads as jitter, not intent. Settle (technique 04) works well at urgent pace for structural headers because it completes its lock in the first 0.6s regardless of total duration.

### What can go wrong

**Urgency on complex content.** A FrameworkDiagram or BayesianUpdate template at 3-second composition duration gives the viewer 2 seconds of reading time after the entrance animation. If the diagram has four labeled nodes, they won't all register. Urgent pacing on complex multi-element templates produces the "I saw it but didn't read it" failure. Reserve urgent for analytical content that communicates a single fact — a title card, a single-stat reveal, a simple bar chart.

**Urgency without narrative connective tissue.** Three urgent-paced cuts in a row where each one is a different kind of argument (economic data → geographic map → historical quote) don't accumulate — they disorient. Urgent pacing requires parallelism: each cut extends the same argument, adds another instance, or builds one more step of the same ladder.

---

## 02 · Analytical

**Multiplier:** 1.0× (baseline; no adjustment)

**Target rate:** 4–6 seconds per visual change

**Implicit claim:** "There is enough time to read this carefully; the argument trusts the viewer's attention."

### What it signals to the viewer

Analytical pacing is the channel's default register. It communicates institutional confidence: the argument is well-structured enough that it doesn't need rush. At 4-6 seconds per visual change, viewers have time to read axis labels, locate a country on a map, process a framework matrix, and hear the narrator confirm what they're seeing. This is the pacing the channel spends the majority of its runtime in.

The wrong read of analytical is "slow = boring." At analytical pace, a well-constructed DataChart is not slow — it's efficient. The viewer reads the chart in 2 seconds, the narration spends 3 more seconds making the analytical argument, and the cut arrives as the argument completes. That rhythm is not boring; it's the reading experience of a long-form magazine piece.

### How it interacts with the three visual registers

- **Analytical (Register 1):** The home register. Every chart type, every framework diagram, every geographic argument works at analytical pace. The 4-6 second window is calibrated to the reading time of a typical Remotion template.
- **Atmospheric (Register 2):** Works well as the background layer behind analytical-paced narration. The 4-6 second window is long enough for the constructivist illustration to register its mood before the cut arrives.
- **Grounding (Register 3):** The minimum viable pace for grounding scenes. At analytical pace, a figurative scene communicates its spatial argument before the cut. Shorter than this and the spatial register doesn't land.

### Episode arc placement

Analytical is the body's backbone. In Silicon Trap, every Beat 1–3 segment that isn't specifically marked urgent or breathing runs at analytical pace: the COCOM regime map, the lithography passes comparison, the TSMC yield trajectory. In Prisoners' Dilemma, the game-theoretic framework diagrams, the diffusion chart through academia, the iterated-PD mechanism explanation — all analytical. If you're not sure which pace to assign, analytical is almost always correct.

The beat-level pacing map for a typical 15-20 minute Parallax episode has analytical as the filler between the beats of urgency and breathing. It's the connective tissue.

### Transition interaction

No adjustment. Cross-dissolve at 0.5s, hard cut at 0s, fade at 0.6s — all defaults. Analytical pace is what the transition grammar was calibrated against. The transitions don't need to accelerate or stretch because the rhythm is already balanced.

### Hold-motion interaction

Analytical pace pairs with Editorial drift (technique 02) as the default, exactly as the HOLD_MOTION_REGISTER prescribes. The 4-6 second composition window makes the 1.02 scale over composition duration visible as a very gentle alive-ness — which is correct. At this window length, Breathing (technique 03) starts to become appropriate for hero-stat and quote segments, because the sinusoidal cycle can complete a partial cycle (½–¾) that reads as intentional. Settle (technique 04) is also well-suited: the 0.6s settle lands cleanly within the 4-6 second hold window with time to spare.

### What can go wrong

**Analytical pace on emotional peaks.** Cutting away from a major reveal at analytical pace (5 seconds) is too fast. The viewer just received a large piece of information; their processing hasn't finished. The instinct is to keep moving because 5 seconds "feels like enough," but for the Morris Chang quote, or for the "0 successful training runs" beat, analytical pacing makes the revelation feel like one more data point. That beat needs breathing.

**Uniform analytical pace.** If every beat in the script has `PACE: analytical` (or no annotation at all), the episode feels flat — a sequence of well-paced arguments that never vary their metabolic rate. Urgency and breathing must break the analytical baseline. See Decision Rules below.

---

## 03 · Breathing

**Multiplier:** 1.4× (40% longer than baseline)

**Target rate:** 6–10 seconds per visual change

**Implicit claim:** "Something has just been revealed; the viewer needs space before the next move."

### What it signals to the viewer

Breathing pacing claims that the channel trusts the weight of the moment enough to sit in it. At 6-10 seconds per visual change, the viewer's eye has finished the primary scan of the visual element before the narrator has finished speaking — which creates a secondary layer of attention available for the argument. The narrator can say something more subtle, more considered, more interpretive, because the viewer is no longer in reading mode. This is the register for bounded analogy, for emotional peaks, and for the "let that land" beats after major reveals.

The wrong read of breathing is "slow = more emotional." A breathing beat that arrives before anything has been revealed reads as stalling — the viewer hasn't received anything worth sitting with. Breathing pacing is a *response* to something that already happened, not a technique for creating drama from nothing.

### How it interacts with the three visual registers

- **Analytical (Register 1):** Works for post-reveal moments. A DataChart or StatReveal that just delivered the episode's central figure can hold at breathing pace while the narrator unpacks the implication. But more than one analytical segment in a row at breathing pace starts to feel like the episode forgot to cut.
- **Atmospheric (Register 2):** The best register for breathing pacing. Constructivist illustration at 30-40% opacity behind narration, with 6-10 seconds to absorb the atmospheric meaning — this is the Adam Curtis mode, where the image is processing chamber rather than information delivery. The Prisoners' Dilemma Beat 4 close, holding on the constructivist RAND-corridor illustration while Tiger narrates the "and now the model runs everything" conclusion, earns its 8 seconds.
- **Grounding (Register 3):** Works for the emotional climax of a grounding scene — the figurative scene has resolved, the spatial argument has landed, and the character is holding in stillness while the narrator draws the implication. But a grounding scene introduced at breathing pace (not yet established) can feel slow-pitched.

### Episode arc placement

Three natural positions:

- **After the major reveal (mid-episode peak):** Silicon Trap's "0 successful training runs" beat breathes for ~8 seconds before the next argument begins. Prisoners' Dilemma's "82% cooperation rate" reveal breathes before the "but why?" beat opens.
- **Bounded-analogy moment:** Parallax's signature form requires time. "This analogy holds here, breaks there." The break clause needs space to register — rushing past the limit clause makes the analogy feel unexamined. Breathing pace on the bounded-analogy beat gives the narrator time to name the limit clearly and the viewer time to process it before the argument moves on.
- **Conclusion and chapter close:** The final beat of any episode should breathe. Not every individual segment needs `PACE: breathing`, but the beat-level pacing target should be 7-9 seconds per change. The last thing the viewer experiences should not be urgent.

### Transition interaction

At breathing pace, the manifest generator stretches transition durations by ×1.5. A cross-dissolve that takes 0.5s at analytical takes 0.75s at breathing. Hard cuts stay hard cuts: since Oct 10, 2026 the generator no longer upgrades a cut to a dissolve at breathing pace (pace sets how long a seam takes, not what it claims). Where a breathing beat wants a soft seam, write `DIR: cut(dissolve)`. The iris was retired on the same date and is not available at any pace; see TRANSITION_GRAMMAR.md § 06.

### Hold-motion interaction

Breathing pace pairs with the Breathing hold technique (technique 03 from HOLD_MOTION_REGISTER.md) for hero-stat and quote segments — the name is not coincidental. At 6-10 second composition durations, the sinusoidal cycle (~8s) has room to complete, and the "alive but stationary" feel is fully realized. Documentary Ken Burns (technique 06) is also appropriate at breathing pace for photo plates: the full scale-and-pan motion (1.0→1.06 over the composition duration) becomes a slow, deliberate cinematic hold rather than a rushed pan. Stillness (technique 01) pairs with the longest breathing-pace beats — the chapter close, the eulogy moment, the casualty-list hold — where motion would read as inappropriate.

### What can go wrong

**Breathing on an unearned beat.** If the episode arrives at a breathing-paced beat without having delivered a significant reveal or emotional accumulation, the long hold reads as slow, not contemplative. The viewer's thought is "why aren't we moving?" rather than "I need a moment." Breathing pacing is the response to something, not the thing itself.

**Breathing as a substitute for emotional content.** Holding longer on an atmospheric illustration doesn't add weight to narration that isn't carrying weight. The Adam Curtis precedent only works because the narration is doing serious analytical and emotional work simultaneously. Breathing pacing on thin narration (filler bridging sentences, transitional observations) wastes runtime.

**Returning to urgent immediately after breathing.** See the Whiplash anti-pattern below.

---

## Episode arc template — 15-20 minute Parallax episode

A typical episode pacing map. Not a formula — a center of gravity.

```
Cold open (2-3 min)
  BEAT 0:          urgent           Hook juxtaposition, rapid evidence, "something is wrong"
  BEAT 0 close:    breathing        The cold open thesis lands; hold before the chapter card

Beat 1 (3-4 min) — Framework
  Body:            analytical       Framework explanation, historical setup
  Reveal moment:   breathing        The first bounded-analogy moment; the "this is the lens" beat

Beat 2 (3-4 min) — Evidence
  Open:            analytical       Data-driven argument establishes
  Evidence cascade: urgent          Rapid accumulation: chart → map → stat → quote
  Landing:         breathing        Major implication of the evidence; sits before Beat 3

Beat 3 (3-4 min) — Complication
  Body:            analytical       Framework stress-test, counter-evidence, the limit clause
  Tension peak:    urgent           Escalation sequence; the problem gets worse faster
  Chapter close:   breathing        The crisis beats; hold before the pivot

Beat 4 / Conclusion (2-3 min)
  Open:            analytical       Implication and synthesis
  Bounded analogy: breathing        The signature move; the analogy's break clause needs space
  Closing thesis:  breathing        Final statement holds; viewer absorbs before credits
```

**Episode-level check:** A well-paced 15-minute episode will have at minimum: 3 breathing beats (cold-open close, at least one mid-body peak, conclusion), 2 urgent sequences (cold open, one evidence cascade), and analytical as the remainder. If the pacing map has zero breathing or zero urgent annotations, something is missing.

---

## Decision rules

### Minimum variation
At least 2 profile changes per beat in episodes longer than 10 minutes. A 3-4 minute beat that runs at a single pace isn't wrong by definition, but in practice it means either the beat has no major reveal (analytical throughout) or the build is never released (urgent throughout) or the beat lacks forward momentum (breathing throughout). None of those is the target.

### Maximum duration at a single pace
**No more than 90 seconds at a single pace without a change.** This is the hard rule, not a guideline. The script-audit skill checks for violations (Lens 6). A 90-second urgent sequence at 3 seconds per visual change is 30 cuts — past the point where urgency reads as argument and starts reading as catalog. A 90-second breathing stretch without a pacing change reads as the episode stalling.

The exception: a chained atmospheric stretch (`[SCENE:]` block, 30-60 seconds of morphed constructivist stills) can run at breathing pace for its full duration even if it approaches 60 seconds, because the morph-chain technique provides internal visual change (each morph is a "change event") that satisfies the variation instinct even though the pacing annotation doesn't change. The 90-second rule applies to the script pacing annotation, not to internal visual changes within a sustained atmospheric stretch.

### The whiplash anti-pattern
**Never go urgent → breathing → urgent within a single beat.** This is the most common pacing error in draft scripts. It claims: "this is urgent (acceleration) ... now we need to pause (weight) ... now urgent again (acceleration)." The second urgent reads as editorial panic — the episode doesn't know what it wants. The breathing beat in the middle reads as a pause, not a reveal, because there's no place of arrival before the breathing starts.

The correct form of urgency followed by breathing followed by urgency is to end the first urgent sequence with a breathing landing, close the beat with a chapter card or fade, and open the next beat with urgency fresh. The breathing moment belongs at a beat boundary, not mid-beat between two urgent sequences.

If the narration structure genuinely requires tension → release → tension within one beat, the release should be analytical pacing (not breathing) and the second tension segment should be a new urgency build, not a resumption.

### Breathing at beat boundaries, urgent at beat openings
Breathing belongs at the *end* of beats (the reveal lands, the chapter closes). Urgent belongs at the *opening* of beats when the hook argument requires momentum (the cold open, the evidence cascade that opens a complication beat). Inverting these — opening a beat with breathing, closing with urgency — is possible but requires explicit editorial justification. "We breathe into this beat because the preceding revelation was so large" is a legitimate choice; "we open with breathing because the previous beat was urgent" is just emotional trajectory management, not an editorial claim.

---

## Interaction table — Pacing × Hold Motion × Transition

| Pace | Paired hold techniques | Transition behavior | Avoid |
|---|---|---|---|
| **Urgent** | Editorial drift (02), Settle (04) | Hard cut default; dissolve compresses to ~0.3s; iris contraindicated | Breathing motion (03), Documentary Ken Burns (06), iris |
| **Analytical** | Editorial drift (02), Settle (04), Breathing (03) for hero/quote segments | All defaults; no adjustment | N/A — the baseline |
| **Breathing** | Breathing (03), Stillness (01), Documentary Ken Burns (06) | Authored dissolves stretch to ~0.75s; hard cuts stay cuts; no iris (retired) | Multiple urgent-length sequences within the same breathing beat |

---

## Interaction with the visual registers

Pacing and visual register are orthogonal choices, but they interact:

**Urgent + Analytical (Register 1):** The dominant combination. Works when each visual element is self-explanatory at a glance. Fails when templates require sustained reading.

**Urgent + Atmospheric (Register 2):** Use cautiously. A constructivist backdrop at 2-3 seconds reads as mood texture, not argument. Acceptable in rapid montage sequences; not acceptable when the atmospheric image is supposed to deliver the beat's emotional meaning.

**Analytical + Atmospheric (Register 2):** The Adam Curtis mode — sustained narration-over-illustration at baseline rhythm. The atmospheric image enriches without competing; the 4-6 second window is long enough for mood to register, short enough that the episode doesn't stall.

**Breathing + Atmospheric (Register 2):** The highest-leverage combination for emotional peaks. Long hold on a constructivist illustration while the narrator makes the episode's most important interpretive claim. Silicon Trap's COCOM-becomes-a-trap close and Prisoners' Dilemma's "the model creates the game" conclusion both deserve this treatment.

**Breathing + Analytical (Register 1):** Use when a specific chart or typography card is the thing that needs to be absorbed — the "0 successful training runs" stat reveal held at 8 seconds. But do not use breathing pace on analytical register as the default; the visual surface doesn't carry the atmospheric weight to justify the extended hold.

---

## Related docs

| Document | Relationship |
|---|---|
| **PACING_SYSTEM.md** | Technical implementation — annotation syntax, `PACE_MULTIPLIERS`, lint rules, Whisper sync interaction |
| **HOLD_MOTION_REGISTER.md** | Per-technique hold-beat motion choices; pacing determines which techniques are appropriate |
| **TEXT_ANIMATION_REGISTER.md** | Text-animation technique selection responds to pacing context (urgent → Reveal Mask or instant pop; breathing → Typewriter, Tracking-In) |
| **TRANSITION_GRAMMAR.md** | Transition duration scaling rules at urgent (×0.6) and breathing (×1.5) pace |
| **VISUAL_LANGUAGE.md** | Three-register system; pacing × register interactions documented above |
| **DIRECTING_LANGUAGE.md** | `PACE:` annotation syntax lives in the script right column alongside `DIR:` annotations |
| **episodes/EDITORIAL_PLAYBOOK.md** | Compounding rules; pacing choices should be documented in post-publish retro when they work or fail |
