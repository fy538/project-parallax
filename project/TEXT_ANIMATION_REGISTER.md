# Parallax — Text Animation Register

## Purpose

This document names Parallax's eight canonical text-animation techniques and matches each to its editorial context. It exists so that script-writing and visual-spec skills can select the right technique for a given moment — not by guessing from a generic palette, but by following clear use-case rules grounded in the channel's editorial register.

Created: May 15, 2026

**Related docs:**
- **PROJECT_VISION.md** — the channel's "educated mysticism" register and mid-century editorial lineage
- **CONTENT_IDENTITY.md** — episode formats; the bounded-analogy signature form
- **DIRECTING_LANGUAGE.md** — `DIR:` annotations for camera, reveal, hold, cut, mood
- **VISUAL_LANGUAGE.md** — three-register system (analytical / atmospheric / grounding)
- **remotion-templates/src/catalog/TextAnimationShowcase.tsx** — live side-by-side reference of all eight techniques

---

## Why a register, not a palette

Text animation is a *register choice*. Choosing the wrong technique reads as a category error — a typewriter on a channel-voice headline mis-claims that someone *typed* a Parallax statement; a Number Ticker on a year value mis-claims that the year *arrived at* its value. The wrong choice doesn't just look off, it makes a *wrong factual claim* about how the text exists in the world.

The eight techniques below each carry an implicit claim about WHAT KIND OF TEXT this is:

| Technique | Implicit claim |
|---|---|
| Number Ticker | "this value was COMPUTED" |
| Tracking-In | "this text is COMPOSED — typeset with intent" |
| Reveal Mask | "this text was CONCEALED until now" |
| Underline Draw | "this phrase carries WEIGHT we are marking" |
| Typewriter | "this text is TRANSCRIBED — quoted, archival, or first-person written" |
| Backspace | "this text is being REVISED in real time" |
| Scramble | "this text was OBSCURED and is now decoded" |
| Word Cascade | "this text is being READ to the viewer" (default narration register) |

When an editorial moment matches a technique's claim, the animation reinforces the meaning. When it doesn't, it competes with the meaning. **Pick the one whose implicit claim matches the editorial intent.**

---

## The eight techniques (quick reference)

| # | Name | One-line | Implementation status |
|---|---|---|---|
| 1 | **Number Ticker** | Value counts up to target with eased deceleration | Inline in `DataChart.tsx`; standalone version in `TextAnimationShowcase.tsx` |
| 2 | **Tracking-In** | Letter-spacing collapses wide → normal as opacity fills in | Showcase only |
| 3 | **Reveal Mask** | Text wipes in from below via clip-path | Showcase only |
| 4 | **Underline Draw** | Hairline grows under emphasized phrase, left-to-right | Showcase only |
| 5 | **Typewriter** | Character-by-character with blinking cursor + punctuation pauses | Showcase only |
| 6 | **Backspace** | Type wrong text → backspace → type correction | Showcase only |
| 7 | **Scramble** | Block-hash characters resolve to real letters left-to-right | Showcase only |
| 8 | **Word Cascade** | Word-by-word fade-up with eased settle | `AnimatedText` component (`src/components/AnimatedText.tsx`) |

All eight render side-by-side on real Parallax content in `Catalog → Editorial → TextAnimation-showcase` in Studio.

---

## 01 · Number Ticker

**What it does.** A numeric value counts from 0 (or a baseline) to its target over ~30–50 frames, with eased deceleration. The final value optionally gets a subtle hero-color glow at settle.

**Implicit claim.** *This value was computed. The number you see is the result of a calculation that just completed.*

### Use for

- **Hero stat reveals** — the editorial pull-out number for a beat
- **Cumulative counts** approaching their final magnitude ("by 1975, **2,000+** scholarly articles")
- **Yield curves arriving at threshold** ("yields went from **38% → 68%**")
- **Financial figures** that should feel *accumulated* not declared (CHIPS Act funding sequence)
- **Approached thresholds** ("**85%** competitive threshold")
- Any moment where the *act of arriving at the conclusion* should feel earned

### Avoid for

- ❌ **Years or dates.** Years aren't *arrived at* — they're labels. Ticking "1950 → 1975 → 2026" reads as a stopwatch, not a citation.
- ❌ **Sublabels and incidental numbers.** If the number isn't the editorial point, don't ticker it. Reserve for moments that earn the attention.
- ❌ **Negative or descending counts as a "countdown."** A ticker descending reads as countdown timer (techno-thriller register). If you need to show decline, use a flat reveal and let the chart's bar/line do the work.
- ❌ **Ranges or distributions.** A ticker shows one number arriving; it can't show "30–40%."
- ❌ **More than one ticker on screen simultaneously.** They compete; the eye can only watch one number arrive at a time.

### Parallax examples (from real episodes)

**silicon-trap:**
- `"0 successful training runs"` — the dramatic stat-reveal at 8:09 (silence + 0 ticker = ⭐ canonical moment)
- `"34 vs 9 lithography passes"` — SMIC vs EUV (ticker on the 34, the "extra cost" number)
- `"$6B"` — CHIPS Act disbursement after the descending sequence ($52B → $30.9B → $6B); ticker arrives at the punchline value
- `"7%"` — US chip demand fraction

**prisoners-dilemma:**
- `"2,000+ scholarly articles"` — Beat 2 diffusion chart climax
- `"82%"` — Round 1 cooperation rate (the headline finding)
- `"14 / 60"` — Flood-Dresher cooperation count from RAND 1950

### Technical brief

```
duration: 30–60 frames (1.0–2.0s at 30fps)
easing: Easing.out(Easing.poly(4))  // strong deceleration — value "lands"
hero glow at settle: optional, on the final value only
typography: display sans, bold, large size
unit: smaller, separated by hair-space (e.g. "82" big + "%" smaller)
```

---

## 02 · Tracking-In (letter-spacing collapse)

**What it does.** Headline appears with very loose letterspacing (~8–12px), and the spacing tightens to normal over ~20–30 frames as opacity fills in. The letters "find their place" in the word.

**Implicit claim.** *This text is composed. It was typeset deliberately — not delivered, not transcribed.*

### Use for

- **Episode titles** — opening cards, "The Silicon Trap", "How a Failed Model Conquered the World"
- **Section openers** — "BEAT 1: THE FAILED EXPERIMENT", "BEAT 4: THE WRONG GAME"
- **Hero headlines for editorial frames** — when the typography itself is the visual identity
- **Quiet, deliberate openings** where the channel's voice is establishing register before content begins
- **End-card statements** — closing sentence that lands as the last word

### Avoid for

- ❌ **Body text / paragraphs.** Tracking-in on body copy reads theatrical and slows comprehension.
- ❌ **Mid-sentence emphasis.** Use Underline Draw, not letter-spacing collapse.
- ❌ **High-energy / urgent moments.** Tracking-in is contemplative. For urgent register, use Reveal Mask or instant pop.
- ❌ **Numbers and data.** Numbers are tabular; letter-spacing them reads as broken alignment.
- ❌ **Lowercase text in body register.** The mid-century-formal effect implies title case, all-caps, or display-weight sentence case. On lowercase body type it looks like a font bug.

### Parallax examples

**silicon-trap:**
- Episode title card: `"The Silicon Trap"` (display, title case)
- Beat opener: `"BEAT 4 — TRAPPED ALLIES"` (mono, all-caps, tracked)
- Cold open final line: `"And once you see it, you can't unsee it."` (only the closing beat, never mid-narration)

**prisoners-dilemma:**
- Episode title: `"How a Failed Model Conquered the World"` (display)
- Section openers: `"THE WRONG GAME"`, `"WHY IT WORKED ANYWAY"` (mono, tracked, all-caps)
- Closing thesis: `"Built for: anonymous one-shots / Applied to: everything"`

### Technical brief

```
duration: 20–30 frames (~0.7–1.0s)
letter-spacing: 8–12px → 0px
easing: Easing.out(Easing.cubic)
opacity: 0 → 1, slightly slower than spacing (so letters "appear in place")
typography: display weight, h1 or h2 size
case: title case for editorial; all-caps + mono for section markers
```

---

## 03 · Reveal Mask (wipe-in from below)

**What it does.** Text doesn't fade in — it's *uncovered* by a horizontal mask sliding upward (or sideways). The letters appear behind the moving edge of the mask, fully formed, never half-visible.

**Implicit claim.** *This text was concealed and is now visible. The act of revealing it is part of the meaning.*

### Use for

- **Full-canvas section openers** where the title emerges with cinematic weight
- **The reveal beat** in a narrative arc — the moment the answer comes out
- **Mid-episode chapter breaks** that need to feel more substantial than a fade
- **Pull-quotes** rendered at full visual scale (less appropriate for inline quote in a chart)
- **Architectural / structural labels** when they're the dominant visual element

### Avoid for

- ❌ **Body text.** The wipe is too theatrical for paragraph-level content.
- ❌ **Repeated frequent use.** A reveal-mask in every section opener loses impact. Reserve for ~2–3 per episode max.
- ❌ **Single short words** (under 6 characters). The wipe needs horizontal expanse to read; on a single word it looks like a typo.
- ❌ **Inline mid-sentence emphasis.** Use Underline Draw.
- ❌ **Numbers and stats** (use Number Ticker).
- ❌ **Quotes.** A quote being *uncovered* implies a documentary frame the channel doesn't usually claim about transcribed speech (use Typewriter).

### Parallax examples

**silicon-trap:**
- Cold open `"Just as the old crisis returns"` (sub-headline beneath the title card)
- `"BEAT 4 — TRAPPED ALLIES"` section opener at full canvas (mono, tracked, all-caps)
- The closing thesis card: `"The trap is the trap is the trap."`

**prisoners-dilemma:**
- `"THE WRONG GAME"` — Beat 3 opener, full canvas, thesis-level reveal
- Architectural label `"COOPERATION THEORY"` as a register identifier on hero frames
- `"Something is working. The PD can't see it."` — Beat 2 closing line at full bleed

### Technical brief

```
duration: 20–30 frames (~0.7–1.0s)
mask: SVG clipPath rect translating from text-bottom to text-top
easing: Easing.out(Easing.cubic)
optional accent: hairline rule (gold) draws beneath after wipe completes
                  (frame after wipe progress ≥ 0.7, taking 0.3 to fill)
typography: display or mono, large size, single line ideally
```

---

## 04 · Underline Draw (emphasis without weight shift)

**What it does.** A hairline (typically 1.5–2px) draws from left to right beneath an emphasized phrase, ~0.6s, optionally ending with a small endpoint dot. Marks the load-bearing clause without bolding, italicizing, or color-shifting the text.

**Implicit claim.** *This phrase carries the weight of the sentence. We are marking it editorially.*

### Use for

- **The load-bearing phrase in a body paragraph** — the clause the rest of the sentence supports
- **Definitions of terms** (underline grows under the term being defined as it's introduced)
- **Quote attributions** ("— Nash, 1950") — subtle underline under the attribution
- **Inline citations / source notes**
- **One emphasis per beat, max** — like a yellow highlighter in a book; multiple uses dilute it

### Avoid for

- ❌ **Multiple emphases in the same sentence.** One underline. The point is to mark THE pivot, not several pivots.
- ❌ **Headlines.** The headline IS the emphasis; underlining is redundant.
- ❌ **Single words.** A single underlined word reads as a hyperlink artifact (broken UI affordance). The underline needs to span a phrase.
- ❌ **Numbers.** Numbers carry their own weight; underlining them doubles up.
- ❌ **Quoted speech.** A quote is already set apart by quotation marks and (usually) typewriter or italic register; adding underline is excessive.

### Parallax examples

**silicon-trap:**
- `"Export controls — a national security instrument — had become a tax. *Possibly an unconstitutional one.*"` (underline under "Possibly an unconstitutional one")
- `"It's more expensive. It's slower. *And it works.*"` (underline under "And it works")
- `"Five to ten years behind, *for the entire Cold War.*"` (underline under "for the entire Cold War")

**prisoners-dilemma:**
- `"The Prisoner's Dilemma doesn't describe the game we're playing. *It creates the game we're playing.*"` (underline under "It creates the game we're playing")
- `"The model failed on its own first iteration."` (underline under "failed on its own first iteration") — ⭐ the channel's argumentative pivot beat
- `"The experiment showed it didn't work on day one. *It conquered the world anyway.*"` (underline under "It conquered the world anyway")

### Technical brief

```
duration: 15–25 frames (~0.5–0.85s)
stroke: 1.5–2px hairline, gold (palette.gold) or rust (semantic.china) per emphasis
easing: Easing.out(Easing.cubic) — confident draw, no overshoot
start: AFTER the underlined text has fully rendered (delay by ~0.3–0.5s)
endpoint: optional 3px dot at line end when progress ≥ 95%
typography: applies to body or serif italic body — not to mono/display
```

---

## 05 · Typewriter

**What it does.** Text appears character-by-character at ~18–22cps with a blinking cursor at the leading edge. Punctuation triggers small pauses (6 frames at commas, 14 at periods). Attribution (e.g. "— Nash, 1950") fades in after the quote completes; cursor persists briefly, then fades.

**Implicit claim.** *This text is transcribed. It exists as a written or spoken record — quoted, archival, or first-person editorial — and is being reproduced verbatim.*

### Use for

- **Historical quotes** from named figures (Nash, von Neumann, Schelling, Morris Chang, Eric Schmidt, FDR, Mao, Jake Sullivan)
- **Document reproductions** — RAND memos, declassified cables, government statements, treaty text
- **First-person narration moments** when Tiger-as-writer is foregrounded (rare; used for the most considered passages)
- **Archival reproductions** — "RAND Memorandum RM-789-1, January 1950" feels like it's being typed onto a memo form
- **On-the-record statements** being introduced (quoted speech with attribution)

### Avoid for

- ❌ **Channel-voice narration.** Tiger's editorial voice isn't transcribed — it's authored. Typewriter on channel statements is a category error: it claims the text was typed by someone *now*, when actually it's the channel's prepared editorial.
- ❌ **Headlines.** A typewriter'd headline reads mannered; use Tracking-In or Reveal Mask.
- ❌ **Data labels and chart annotations.** Numbers and structural labels shouldn't type.
- ❌ **Lists of items** (bulleted or otherwise).
- ❌ **Any text that conceptually wasn't *written*** — button-like labels, visual axis markers, etc.
- ❌ **More than one Typewriter on screen simultaneously** — they compete cognitively.

### Parallax examples

**silicon-trap:**
- Morris Chang quote: `"Globalization is almost dead. Free trade is almost dead."` — ⭐ the emotional climax of Beat 4
- Eric Schmidt statement on AI denial
- Jake Sullivan: `"As large a lead as possible."` (from his 2022 speech, single key phrase)

**prisoners-dilemma:**
- Nash 1950: `"They would have been more rational if they couldn't see each other."` — ⭐ Beat 1's load-bearing quote, with attribution
- RAND Memorandum reproduction: `"RAND RM-789-1 · Flood, M. · 1952"` (as document header, then content beneath)
- Schelling textbook excerpt being introduced

**Mid-century lineage moment:**
- Any reproduction of 1950s-era text (memos, papers, abstracts) should default to Typewriter — it's both editorially honest and visually congruent with the era

### Technical brief

```
characters per second: 18–22 (slower than real typing — emphasizes deliberation)
base interval: 2 frames/character at 30fps
punctuation pauses (frames):
  comma:    6
  semicolon/colon: 10
  period/question/exclaim: 14
cursor:
  blink rate: 2Hz (every 15 frames at 30fps)
  shape: ▌ (full-height block) or ▮ (3/4-height pillar)
  color: matches text color
  persists ~1s after quote completes, then fades over 0.3s
attribution: fades in 0.4s after quote completes, ~0.5s fade duration
typography: ideally monospace (Plex Mono) for explicit "typed" feel; falls back to display sans for non-archival quotes
sound design: triggers `quote-bell` SFX on cursor start (see AUDIO_DESIGN.md)
```

---

## 06 · Backspace (correction beat)

**What it does.** Types a sentence containing a wrong word, pauses, backspaces through the wrong word, then types the correction. The correction renders in gold (or whatever the accent color is) and bolds at the moment of settle.

**Implicit claim.** *This text is being revised in real time. The channel is reconsidering the framing as you watch.*

### Use for

- ⭐ **The bounded-analogy signature form** — Parallax's defining editorial move. "This analogy is useful here, misleading there." Backspace-and-retype is the *visual* of that move.
- **"You thought X, but actually Y" beats** when X is a sincere prior position, not a strawman
- **Live revision of a misconception** — the channel showing its work, not asserting from authority
- **The "wait, no" beat** in a narrative arc
- **Word-replacement transformations** where the editorial point is the change itself

### Avoid for

- ❌ **Anywhere there isn't a genuine intellectual correction.** Forced backspaces feel theatrical. Reserve for real reframing beats.
- ❌ **More than once per episode.** Loses impact. Pick the single most load-bearing correction.
- ❌ **Long correction chains** (X → Y → Z → W) — reads as indecisive, not deliberate. One correction, one settle.
- ❌ **Channel-voice headlines** (use Tracking-In or Reveal Mask).
- ❌ **Quote text.** A quote is fixed — you can't backspace someone's recorded words.
- ❌ **Numbers** (use Number Ticker if a value should arrive).

### Parallax examples

**silicon-trap:**
- `"Export controls work — until they don't"` (`work` → backspace → typed as struck-through `work`, then "they backfire" follows on a new line)
- `"The model that PREDICTS defection"` → backspace `"PREDICTS"` → type `"PRODUCES"` → final `"The model that PRODUCES defection"` (the model doesn't just predict — it creates the conditions)

**prisoners-dilemma:**
- ⭐ `"The Prisoner's Dilemma describes the game"` → backspace `"describes"` → type `"creates"` → final `"The Prisoner's Dilemma creates the game"` — this IS the episode's thesis, and Backspace is the only animation that delivers it correctly
- `"It failed on day one"` → backspace `"failed"` → type `"conquered"` → final `"It conquered on day one"` — the surprise inversion
- `"By 1975, 200 articles"` → backspace `"200"` → type `"2,000"` — the order-of-magnitude correction (note: this is the rare case where Backspace combines with Number Ticker on the new value)

### Technical brief

```
phases (timing per phase, in frames):
  1. type wrong:    chars * 2
  2. pause:         18 frames (~0.6s — eye reads the wrong word)
  3. backspace:     chars * 2 (slightly faster than typing)
  4. type correct:  chars * 2
  5. settle pause:  0 (let the next narration line move on naturally)
correction styling:
  color: HERO_COLOR (palette.gold) once typed
  weight: bold at settle (frame ≥ phase4End)
cursor:
  same as Typewriter — persists through all phases, fades after settle
audio: pair with `card-settle` texture cue at the moment the correction completes
```

---

## 07 · Scramble (hash → text)

**What it does.** Text initially renders as opaque block characters (`█████`). Block-by-block, left to right, the blocks resolve to their real characters. Final state: clean text.

**Implicit claim.** *This text was obscured and is now legible. The reveal IS the discovery.*

### Use for

- **Document reveals** — classified → declassified, redacted → unredacted
- **Source citations being introduced** — `"TD Cowen analysis, 2025"` resolving as the chart it backs animates
- **Statistics being uncovered** through investigation rather than calculated (use Number Ticker for calculated)
- **"Previously classified / now public"** moments
- **Archival document headers** when emphasizing the *discovery* rather than the transcription (otherwise prefer Typewriter)
- **Anything that should feel *discovered* rather than *delivered***

### Avoid for

- ❌ **Frequent use.** Scramble rapidly becomes spy-thriller cliché. Reserve for ~1–2 per episode max, and only for moments that genuinely involve concealment.
- ❌ **Narrative prose.** Nobody reads scrambled paragraphs — the technique only works on short atomic strings (titles, citations, document headers).
- ❌ **Numbers that should arrive** (use Number Ticker).
- ❌ **Channel-voice statements.** Parallax doesn't *discover* its own statements.
- ❌ **Long phrases** (over ~30 characters). The scramble effect doesn't scale beyond short headers.
- ❌ **Quoted speech.** A quote being scrambled implies the speaker was obscured — wrong claim.

### Parallax examples

**silicon-trap:**
- `"TSMC ARIZONA · MILE 2 OF 5 PROJECTED"` resolving as cold-open subtitle
- `"TD COWEN ANALYSIS, 2025"` resolving beneath the SMIC yield chart as source citation
- `"DEEPSEEK V3 · DEC 2024 · 671B PARAMETERS"` resolving as the failed-training-run stat-reveal context line

**prisoners-dilemma:**
- ⭐ `"RAND MEMO RM-789-1, JAN 1950"` — the original document header, resolving from blocks (matches the historical-discovery register)
- `"JSTOR CITATION ANALYSIS, 1960–1999"` resolving beneath the diffusion chart
- `"BLACK-SCHOLES MODEL · 1973 / 1987"` resolving as the financial-PD parallel introduces

### Technical brief

```
duration: 25–40 frames (~0.85–1.3s — proportional to character count)
resolution wave: left-to-right (each character resolves at start + (i / chars.length) * duration)
unresolved character: █ (full block, U+2588) at slightly lower opacity (50%) than resolved text
preserved characters: spaces never scramble (stay as actual whitespace)
typography: monospace (so block width matches resolved character width — prevents reflow)
case: ideally all-caps (block characters read more clearly against caps text rhythm)
size: caption to small body (technique loses clarity above ~32px)
```

---

## 08 · Word Cascade (current toolkit baseline)

**What it does.** Each word fades in and slides up (~20px → 0) in sequence, with weighted settle (longer words take slightly longer). Already implemented as `AnimatedText` with `mode="word"` and as the dominant pattern in production templates.

**Implicit claim.** *This text is being read to the viewer. Each word arrives in the order the narrator (and the eye) processes it.*

### Use for

- **General narration body text** — the default for any prose block that doesn't fit another technique
- **Definitions and explanations** — KineticTypography "definition" variant
- **Long-form prose passages** that need to feel "spoken" without specifically transcribed
- **Anywhere you want word-level reveal without typewriter's archival weight**
- **Bilingual paired displays** — both languages cascade in sync

### Avoid for

- ❌ **Quoted speech** (use Typewriter) — Word Cascade reads as channel-voice; quotes are someone else's voice
- ❌ **Hero stats** (use Number Ticker)
- ❌ **Headlines** (use Tracking-In or Reveal Mask) — Word Cascade is too word-level for a headline that should arrive as a single typographic unit
- ❌ **Inline mid-sentence emphasis** (use Underline Draw)
- ❌ **Document reproductions** (use Typewriter or Scramble) — Word Cascade doesn't carry archival weight
- ❌ **Channel-voice statements where the *delivery should be slower than word-by-word*** — for very deliberate prose, prefer a single-block fade-up with longer hold

### Parallax examples

**silicon-trap:**
- All non-quote KineticTypography variants: definitions, bilingual displays
- The setup paragraphs that introduce each beat
- "卡脖子" definition with pinyin and English (bilingual paired)

**prisoners-dilemma:**
- Beat-opening setup prose
- The "checkpoint" summaries at the end of each beat (long-form analytical passages)

### Technical brief

```
mode: "word" (separate by spaces) or "character" (for CJK)
frames per unit: 3–5 (word mode); 2–3 (character mode for Chinese)
eased stagger (logarithmic): use for Chinese terms — early chars fast, later chars slow
weighted settle: long words get ~50% more settle time than short ones
vertical travel: 20–28px (translateY)
scale entrance: 1.08 → 1.0 (subtle, NYT-style)
opacity: 0 → 1
easing: cubic out (default) or quintic out for hero-tier words
```

---

## Decision matrix — which technique for which moment

Use this table to pick by editorial context. Read left-to-right; the first match wins.

| If the text is... | And the editorial role is... | Use |
|---|---|---|
| A number | Stat reveal / climactic figure | **Number Ticker** |
| A number | Year, date, or incidental label | direct render (no ticker) |
| An episode/section title | Channel-voice headline | **Tracking-In** (or **Reveal Mask** for thesis-level) |
| A title or kicker | All-caps structural label | **Reveal Mask** (or Tracking-In for quieter) |
| A body sentence | Marking one load-bearing phrase | **Underline Draw** |
| A body sentence | General narration | **Word Cascade** |
| A quoted statement | Historical figure, named speaker | **Typewriter** |
| A document header | Archival, with explicit citation | **Typewriter** or **Scramble** |
| A document header | Emphasizing *discovery* of source | **Scramble** |
| Two phrases | One is wrong, one is the correction | **Backspace** |
| Inline definition | Term being introduced | **Word Cascade** + **Underline Draw** on the term |
| Bilingual paired text | Chinese + English of same concept | **Word Cascade** (character mode for CJK, word mode for English) |

---

## Combining techniques

Techniques can compose. Common pairings:

**Underline Draw + Word Cascade (most common)**
The body text cascades word-by-word; the underline draws under the load-bearing phrase ~0.5s after that phrase's last word lands. Used everywhere body text has emphasis.

**Backspace + Number Ticker (rare but powerful)**
Type the wrong number, backspace, then Number Ticker arrives at the correct value. Used when both *the framing was wrong* AND *the right value should be earned* (e.g., the "200 → 2,000" order-of-magnitude correction in prisoners-dilemma diffusion).

**Tracking-In + Number Ticker (hero stat treatment)**
Headline tracks in, then the hero stat tickers up in the same composition with a small offset. Used for "the answer is X" reveal beats.

**Typewriter + Underline Draw (archival quote with emphasis)**
A long quote typewriter-reveals; the underline grows under one key phrase after the quote completes. Used for quotes with internal emphasis (Nash, Morris Chang).

**Reveal Mask + Tracking-In (full-bleed section opener)**
The mask wipes in, AND the typography tracks in within the same animation. Used for the highest-weight section opener in an episode (usually one per episode).

---

## Anti-patterns to watch for

- **Two Typewriters on screen at once** — viewers can only track one act of transcription at a time. If two quotes are being introduced, stagger fully, don't overlap.
- **Number Ticker on a year** — claims the year *arrived at* its value, which is a category error. Years are labels.
- **Tracking-In on lowercase body text** — reads as a font bug.
- **Backspace on a quote** — quotes are fixed; you can't backspace someone's recorded words.
- **Scramble more than once or twice in an episode** — drifts into spy-thriller register.
- **Word Cascade on a quoted statement** — gives the quote channel-voice register instead of attributed-speech register.
- **Underline Draw on a headline** — redundant; the headline is already the emphasis.

---

## Implementation status & extraction roadmap

**Extracted primitives** (`src/components/textAnimation.tsx`):
- `useNumberTicker(target, startFrame, options)` — eased count-up hook
- `<Typewriter text startFrame cps cursor />` — char-by-char with cursor + punctuation pauses
- `useTrackingIn(startFrame, durationFrames, fromPx, toPx)` — letter-spacing collapse
- `<UnderlineDraw width startFrame ... />` — hairline emphasis grows under text

**Composite patterns** (`src/components/CompositePatterns.tsx`):
- `<DefinitionReveal>` — term + pinyin + translation + citation choreography (the 卡脖子 pattern)
- `<StatCaption>` — NumberTicker + caption + source with eased stagger
- `<QuoteAttribution>` — Typewriter quote + serif-italic attribution (display OR archival register)

**Cross-episode continuity** (`src/components/ConceptCallback.tsx`):
- `<ConceptCallback isCallback accentColor>` — pulse wrapper for terms that recur from prior episodes. Composes inside any text node; passthrough when `isCallback=false`. Visual-spec skill determines `isCallback` by checking `data/concepts.json` for prior `appearances[]` entries.

**Catalog showcases** (live in Studio under Catalog → Editorial):
- `TextAnimation-showcase` — all 8 atomic techniques side-by-side
- `CompositePatterns-showcase` — 5 high-level patterns (Definition reveal × 2 registers, Stat+caption, Quote × 2 registers)

**Still inline-only** (not yet extracted as components): Reveal Mask, Backspace, Scramble, Word Cascade (which exists as the older `AnimatedText` component).

**Phase 1 (next):** Extract the remaining techniques into proper APIs.

Recommended order:
1. `useNumberTicker(target, startFrame, options)` — already partially exists in `DataChart.tsx`; consolidate
2. `<Typewriter>` component — high-value, archival-quote register
3. `<Backspace>` component — unlocks the bounded-analogy beat
4. `useTrackingIn(startFrame, durationFrames, fromSpacingPx, toSpacingPx)`
5. `<UnderlineDraw>` component
6. `<RevealMask>` wrapper
7. `<Scramble>` component
8. (Word Cascade already exists as `AnimatedText`)

**Phase 2 (later):** Add `DIR: type(...)` directive to the directing language so scripts can specify technique inline:

```
[MG:] KineticTypography · nash-quote.json · 7s
DIR: type(typewriter, cursor:blink, attribution-delay:0.4s)
DIR: hold(2s)
```

This extends `DIRECTING_LANGUAGE.md` § directives and would be parsed by `tools/assembly/generate_manifest.py` into a `_direction.textAnimation` field.

**Phase 3 (eventually):** Per-template defaults. Each template type has a sensible default text-animation register (KineticTypography → Word Cascade by default, KineticTypography quote variant → Typewriter by default, etc.) so most segments don't need explicit `DIR: type()` at all.

---

## How to use this doc when generating visual specs

For script-writing or visual-spec skills selecting a text-animation register:

1. **Read the implicit-claim table at the top.** Pick the technique whose implicit claim matches the editorial intent of the text.
2. **Check the "Use for" list of your candidate.** Confirm one of the listed contexts matches.
3. **Check the "Avoid for" list.** If your moment matches any avoid item, reconsider.
4. **Look for a Parallax example** in the same or adjacent register. If your moment maps onto one of the listed examples, the technique is right.
5. **Consider combinations** only when both editorial elements (e.g., correction + new value) are independently load-bearing.
6. **Default to Word Cascade** when no specific technique fits — it's the editorial-safe baseline.

When in doubt, the wrong answer is almost always *more theater than the moment deserves*. Reserve the more dramatic techniques (Reveal Mask, Scramble, Backspace) for the highest-weight beats; let everything else cascade quietly.
