# StatReveal — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (NYT Upshot, Bloomberg Graphics, FiveThirtyEight, The Economist, Reuters); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**Big number center-left, comparison bars right, hairline vertical divider — count-up with quartic easing to a held figure, bars grow in with 60ms stagger. One accent-colored hero number (episode emphasis primary), bars in categorical palette. 6–8s single stat; 8–12s with comparisons. Always attribute.**

---

## 1. The form's editorial purpose

StatReveal earns its rectangle when **a single quantity is the argument**. The viewer's takeaway should be: *"that number is so much larger (or smaller) than I expected — and now I have three anchors to frame it."* The count-up animation communicates confidence — it says "we computed this from data, not invented it" — while the comparison bars supply the calibration that prevents the number from floating context-free. Use it when narration lands on a key figure and the argument needs that figure to *land* visually, not just be spoken.

### When not to reach for it

| Alternative | When it wins over StatReveal |
|---|---|
| **KineticTypography (statistic variant)** | You have a hero number but no meaningful comparisons to show — pure impact, no calibration. |
| **DataChart** | You have four or more quantities at comparable scale that all deserve equal visual weight. |
| **TimeSeriesChart** | The argument is about change over time, not the current value. |
| **IsotypeChart** | The argument is about human-scale counts ("8 of 10 chips from one company"), not an aggregate figure. |

**StatReveal's superpower fires when:** one number is the punchline (a GDP figure, a casualty count, a chip concentration percentage) AND the narration says that number out loud AND two to four comparisons give the viewer calibration.

---

## 2. Canonical idioms

### a. NYT/Bloomberg "big number" reveal

The standard form for data journalism's "holy shit" moment. A single large numeral at display scale (96–120px) with a short descriptor below; count-up animation with slight overshoot (the number dials past target, settles back). The overshoot communicates algorithmic confidence — "the model computed, then landed." Bloomberg's best examples: chip market cap comparisons, trade deficit callouts, defense spending reveals. NYT's: displacement counts ("47 million"), unemployment rate reveals, budget-gap numbers.

*Works because:* the eye can track a number climbing and experience the landing; reading a static figure feels like a caption. *Fails when:* the count-up runs too long (>3 seconds) — suspense curdles into impatience. The sweet spot is 1.5–2 seconds for the count-up, then hold.

### b. FiveThirtyEight inline stat

Number + sparkline in the same horizontal register; the sparkline provides temporal context without requiring a full chart. Used when the trend matters as much as the current value — "the 73% today vs. where we were a year ago." 538's house style: number large and left, sparkline right in a subdued color, trend arrow at the terminus.

*Works because:* two data objects in one glance — magnitude and direction. *Fails when:* the sparkline is too small to read at video scrubbing speed; the sparkline needs to be at least 200px wide at 1080p to convey meaningful shape.

### c. The Economist "The World in Numbers" sidebar

Number + single comparison bar below it (this year vs. last year, country vs. world average); uses color only for the delta. The comparison bar is a thin horizontal rule — not a full bar chart. Used in print and in Economist Films for GDP, inflation, and trade figures where the year-on-year change is the editorial point.

*Works because:* extreme restraint. The single comparison bar carries one claim ("up from X"), the number carries another ("currently Y"), and neither competes with the other. *Fails when:* the bar's scale baseline isn't zero — the delta bar implies a ratio it doesn't represent.

### d. Reuters "Data Dive" large-number callout

Full-screen number reveal at documentary pace: number fades in, label types in below over 2–3 seconds; used for emotional impact moments ("47 million displaced," "230,000 dead"). Reuters' editorial standard: no count-up for casualty figures — the number appears fully formed, as if placing a gravestone. The static reveal communicates gravity; a count-up would feel disrespectful.

*Works because:* the choice of static vs. count-up is itself editorial. For statistics that represent human lives, arriving fully formed is the respectful form. *Fails when:* applied to economic figures where the count-up would signal "calculated from data" — static GDP figures feel like unverified assertions.

### e. Parallax StatReveal

Number (left 40%) + comparison bars (right 55%) + hairline vertical divider. The template supports all of the above idioms; the count-up with quartic easing is the standard; static (via `holdAfterRevealSec: 0, durationSec` shortened) is available for casualty figures. The `comparisons[]` array is mandatory — the template `warnIf`s when it's empty and redirects to KineticTypography for context-free hero numbers.

---

## 3. General principles

The big-number reveal is the most perceptually direct form in data journalism. Cleveland & McGill's perceptual hierarchy puts position-along-a-common-scale at the top — but a single number with a label doesn't even need that; it uses *symbolism* (the digit itself), which is the most direct channel available for quantity. The count-up animation recruits the viewer's temporal sense to make the number feel computed rather than asserted.

Tufte's data-ink principle applies hard: the number, the label, and the comparison bars carry all the data; everything else is chrome. The hairline divider between hero and bars is the minimum necessary to separate registers — it should be a gradient-fade rule, not a solid border.

The comparison bars serve a specific role that is often underbuilt: they provide the scale context that turns "280 billion" from an ungrounded assertion into a legible argument. The bars should answer one question: "compared to what?" Best comparisons are: (1) the same figure last year, (2) a single named competitor or baseline, (3) a commonly understood reference (US GDP, world average). More than four comparisons approaches a bar chart and the hero number loses dominance.

**POLISH D5 applies directly:** the hero stat is the protagonist and must visually dominate. The comparison bars support; they should never be wider than the hero number is tall. If a comparison bar is wider than the hero, the hero isn't the hero.

---

## 4. Recommendation for Parallax

**Default layout:** hero stat occupies left 40% of content area, centered vertically; comparison bars occupy right 55%; 1px gradient-fade hairline divider; source attribution bottom-right at muted text.

**Typography (D16 — Plex display/data hierarchy):**
- Hero number: JetBrains Mono 700 at 120px, episode-emphasis `primaryAccent` color. Large enough to read before the viewer processes any label.
- Hero label (below number): IBM Plex Sans 400 at `body` size (`22px`), `text.secondary` color. Tells the viewer what the number is; not competing with the number.
- Bar labels: IBM Plex Sans 500 at `label` size (`18px`), right-aligned in a fixed 200px column. Clean, aligned, not decorative.
- Bar values: JetBrains Mono at `label` size, `text.muted` color. The numbers on bars are supporting evidence, not heroes.

**Animation:**
- Count-up: quartic easing (the template uses `CLAMP_QUARTIC`), 2 seconds × `paceTimingScale`. Hold 0.5s after landing.
- Comparison bars: 60ms stagger (`paceStaggerScale`-scaled), each bar grows with quartic easing over 1s.
- Hero micro-settle: `heroSpring` at `heroStart + heroCountFrames` — a spring scale from 0.96→1.0 after the count finishes; communicates weight arriving.
- Exit: `exitFade` over 1.5s.

**Background:**
- `backgroundVariant: "dark"` for high-impact moments: casualty figures, record-breaking stats, crisis metrics. Dark mode's radial vignette and amber accent on `#1C1814` creates the candlelit-war-room register.
- `backgroundVariant: "light"` for analytical/comparative register: economic comparisons, trade figures, policy metrics.

**Duration:**
- Single stat with 2–3 bars: `durationSec: 6–8`.
- Single stat with 4+ bars: `durationSec: 8–12`.
- Use `holdAfterRevealSec` (default 0) to add a deliberate pause after bars finish for emphasis moments.

**Casualty/displacement figures:** omit the count-up by setting `durationSec` short enough that `heroStart + heroCountFrames` overshoots — the number appears fully formed. Document this as `// static reveal — casualty figure` in the data file.

**Attribution:** `source` field is always required when the stat comes from a named source (which is always). Source renders in `text.muted` + `fonts.body` bottom-right; fades in after bars finish.

---

## 5. Current template alignment

- ✅ Hero number at 120px JetBrains Mono, `emphasis.primaryAccent` color — episode emphasis consumed correctly
- ✅ Count-up with `CLAMP_QUARTIC` easing (quartic = fast acceleration, smooth deceleration — communicates precision arriving)
- ✅ Micro-settle via `heroSpring` after count finishes (scale 0.96→1.0 spring)
- ✅ Cinematic scale-reveal: number arrives at 1.3× and eases to 1.0× — "the figure lands" not "the figure appears"
- ✅ Beat sync via `useBeatSync` — Whisper-resolved sync points add ±5% scale kick on the hero figure land
- ✅ Anticipatory reveal (POLISH D17): `anticipatoryStartFrame()` shifts hero start so count-up finishes 5 frames before Whisper cue
- ✅ Comparison bars: per-bar categorical color via `getCategoricalColor`, gradient fill (V4 bar gradient), rounded radius, `shadows.subtle`
- ✅ Hairline divider: 1px gradient-fade rule, appears at `barsStart` — not present until bars enter (doesn't divide an empty canvas)
- ✅ `heroIsMax` flag correctly includes/excludes hero from bar scaling
- ✅ `holdAfterRevealSec` field for post-reveal pause
- ✅ `warnIf` fires when `comparisons` is empty — redirects to KineticTypography
- ✅ `_direction` consumed: `paceTimingScale`, `paceStaggerScale`, `syncPoints`, `atmosphereIntensity`, `backgroundTint`, `driftOptions`
- ✅ `<TitleBlock>`, `<HeaderStrip>`, `<FooterStrip>` brand chrome correct
- ⚠️ Bar labels are right-aligned in a fixed 200px column — long entity names (e.g., "United States of America") will overflow without ellipsis. The `textOverflow: "ellipsis"` is not on the bar label `<div>`.
- ⚠️ No `backgroundVariant` toggle in bar colors — comparison bars always use `getCategoricalColor` palette regardless of dark/light mode. Dark mode: categorical colors may lack sufficient contrast on `#1C1814` backgrounds for mid-palette hues.
- ❌ Static reveal pattern (Reuters casualty idiom) has no first-class data field — requires hacking `durationSec` to effectively skip the count-up. A `countUp: false` boolean would be cleaner.
- ❌ No sparkline option (FiveThirtyEight inline stat) — temporal context for a current figure cannot be added within this template; requires a separate TimeSeriesChart composition.

---

## 6. Specific upgrades proposed

1. **`countUp: false` field for static (gravestone) reveals.** When `countUp: false`, the hero number appears fully formed at `heroStart` via opacity fade only; the cinematic scale-reveal still plays (communicates weight without motion implying calculation). Applies the Reuters casualty-figure idiom cleanly. Effort: small; impact: every casualty/displacement moment stops requiring duration hacks. **(low effort / medium impact)**

2. **`ellipsis` overflow on bar labels.** Add `overflow: "hidden"`, `textOverflow: "ellipsis"`, `whiteSpace: "nowrap"` to the bar label `<div>`. The 200px column is already the constraint; just enforce the clip. Effort: trivial; impact: prevents label bleed into bar area on long entity names. **(trivial effort / medium safety impact)**

3. **Mode-aware bar color validation.** In dark mode, check that `getCategoricalColor(i)` achieves ≥4.5:1 contrast ratio against `bg.dark.surface` (#1C1814). Add a `warnIf` check per bar if the data-author-provided or auto-assigned color fails the WCAG threshold. Effort: small; impact: catches silent contrast failures. **(low effort / medium impact)**

4. **Sparkline sub-component for the FiveThirtyEight idiom.** Add an optional `sparkline?: { values: number[], unit?: string }` field. When provided, renders a compact SVG polyline (200px wide, 40px tall) below the hero label — trend direction at a glance. Effort: medium; impact: opens a new idiom (stat + direction in one composition). **(medium effort / medium impact)**

5. **`emphasis` field for comparison bars.** Add optional `ComparisonBar.emphasis?: "hero" | "muted"` to allow one bar to be the protagonist (e.g., "this year's figure") while others are deliberately muted. Implements POLISH D5 within the comparison panel. Today all bars render at equal visual weight unless a data-author manually chooses a contrasting color. Effort: small; impact: adds intentional hierarchy to multi-bar compositions. **(low effort / medium impact)**

---

## 7. Failure mode flags (always catch in audit)

- **No comparison bars** — the template `warnIf`s this; audit should enforce. A bare hero number with no calibration is context-free; switch to KineticTypography.
- **Too many comparison bars (>4)** — above 4 bars the hero number loses visual dominance and the template becomes an undifferentiated bar chart. Cap at 4; if more comparisons are needed, use DataChart instead.
- **Count-up too slow** — at `durationSec: 14` with default timing, the count-up runs 3+ seconds. Suspense becomes impatience. Count-up should finish in ≤2 seconds regardless of total duration; pad with `holdAfterRevealSec` instead.
- **Count-up on casualty/displacement figures** — counting up to "230,000 dead" is editorially disrespectful and factually wrong (the figure is a point estimate, not a calculation). Use `countUp: false` (or the workaround) for human-cost statistics.
- **Hero stat not the widest element** — if a comparison bar is wider than the hero number is tall, the hierarchy is broken. The hero must dominate; cap comparisons at values ≤ the hero, or set `heroIsMax: true`.
- **Missing `source`** — every stat that comes from a named source must attribute it. No exceptions. This is the backstage work that earns frontstage confidence per the editorial doctrine.
- **Comparison bars at same scale as hero when they shouldn't be** — e.g., comparing a $280B figure to $1T US GDP makes the $280B look tiny. The comparison bars' story should match the narration's framing; if the point is "comparable to," use values near the hero; if "dwarfed by," make the scale visible.
- **Wrong background variant** — `"light"` for a casualty figure flattens the emotional register. Dark mode's vignette and amber-on-ink treatment is the correct register for high-impact numbers.

Last updated: May 15, 2026
