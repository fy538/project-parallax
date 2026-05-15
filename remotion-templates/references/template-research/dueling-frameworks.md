# DuelingFrameworks — Research Dossier

> Expanded from stub: May 15, 2026. Companion dossiers: [`framework-diagram.md`](./framework-diagram.md), [`split-composition.md`](./split-composition.md). Update when new outlet conventions are observed.

## 1. The form's editorial purpose

DuelingFrameworks earns its frame when **the editorial point is that two competing theoretical lenses explain the same phenomenon differently, and the episode arrives at a judgment about which fits better — or deliberately withholds that judgment**. The form makes the structure of an academic debate legible at video scrubbing speed: two named frameworks, a shared phenomenon they are both trying to explain, their contrasting claims (tenets), and a scoring / verdict phase that either resolves the debate or names it as unresolved. Use it whenever the narration says "realists would say X, liberals would say Y — which fits?" or "Dependency Theory and Modernization Theory make opposite predictions; here is which one the historical record supports."

Distinct from **SplitComposition** (a visual / image opposition without competing claims or scoring — pure atmospheric contrast), from **FrameworkDiagram comparison** (attribute-by-attribute table where both frameworks are treated as complementary layers, not competing explanations), and from **BifurcationRoute** (a temporal fork of one historical system, not a simultaneous clash of two independent analytical models). The DuelingFrameworks form implies a *verdict* — even if the verdict is "both have purchase here."

### When *not* to reach for it

| Alternative | When it wins over DuelingFrameworks |
|---|---|
| **FrameworkDiagram** | The episode is explaining one framework's structure, not comparing two. |
| **SplitComposition** | The contrast is atmospheric / visual (then vs. now, before vs. after) — no competing theoretical claims. |
| **DataChart** | The comparison is empirical and quantitative — two countries, two time periods, two measurable outcomes. |
| **BifurcationRoute** | One historical system split at a turning point — same phenomenon, different paths, not different analytical models. |
| **DecisionTree** | The decision logic is conditional, not a head-to-head comparison of explanatory models. |

## 2. Canonical idioms

### a. Economist "Free Exchange" / "Briefing" — scored verdict with a suppressed bar

**The Economist** "Free Exchange" column and "Briefing" pages regularly run competing-framework comparisons on economic debates: Keynesian vs. supply-side, comparative advantage vs. strategic trade theory. Key feature, documented by Economist chart editors: **the scoring bar is suppressed in the print edition** because it "insults both frameworks" — the prose does the synthesis. The digital edition retains a scoring affordance for interactivity. This produces the editorial tension mirrored in the template's `score` field: the score is available, but whether to render it is an editorial judgment, not a data-formatting decision. The no-score convention applies when the episode is building deliberative tension ("the reader should decide") or when the frameworks are near-equal and a score would imply false precision.

*Works because:* readers trust the prose verdict more than a numerical score when the comparison involves contested theoretical frameworks. The score can appear to lend quantitative authority to what is actually an editorial judgment. *Fails when:* omitting the score leaves the viewer with no signal about which framework the episode endorses — use it when the episode explicitly wants deliberation; always provide `verdict` even when `score` is suppressed.

### b. FT "Economics" section — "common ground first" parallel-column structure

**Financial Times** economics section parallel-column comparisons (2018–present): Keynesianism vs. MMT on inflation, Ricardian equivalence vs. deficit spending. Standard format: a brief shared-phenomenon description at top naming what both frameworks are being asked to explain, then parallel columns. Crucially, the structure always opens with **what the two frameworks agree on before naming what they disagree on**. The "common ground first" editorial rule prevents the comparison from reading as pure opposition and signals analytical sophistication — the Parallax register exactly.

*Works because:* naming agreement first lowers the viewer's defenses before introducing the disagreement, making the argument easier to evaluate fairly. The phenomenon description at top is structurally mandatory in the FT form — it anchors what the debate is *about*. *Fails when:* the "common ground" is trivial ("both agree the Soviet Union existed") — if there is no genuine agreement, skip the convention rather than padding it.

### c. RAND research reports — realism vs. liberalism tenet comparison, no numerical score

**RAND Corporation** international-relations policy reports (e.g., "Countering China's Adventurism over Taiwan," 2017; "The Future of Deterrence," 2020) routinely compare Realist vs. Liberal institutional perspectives on strategic behavior. Typical form: 3–4 tenets per framework in parallel bullet lists, with the phenomenon named in the section title. No numerical score — the verdict is narrative, delivered in the report body, not attached to the framework table. The RAND house convention is that a numerical score on a framework comparison implies precision the analysis cannot support.

*Works because:* the tenet structure is exactly what an IR framework comparison requires — it maps directly to the template's `tenets` array. The RAND form is the source of the "3–5 tenets per framework, parallel in grammar, no score" recommendation that the template defaults toward. *Fails when:* tenets are not genuinely parallel — "structural anarchy" as a tenet on the realist side needs "international institutions" as a tenet at the same level on the liberal side, not a vague "norms matter."

### d. NYT Magazine "The Argument" — fast, few tenets, verdict withheld

**NYT Magazine** "The Argument" format (and its podcast sibling): two positions argued head-to-head, typically 2–3 tenets per side, verdict explicitly withheld to leave the reader deliberating. Episodes use this format when the editorial point is "this debate is live and unresolved" — notably different from the Economist format where the editorial page usually arrives at a verdict. The DuelingFrameworks `cinematicMode: true` is calibrated for this format: the camera tracks between frameworks before landing on a held center-frame that implies a question mark rather than an answer.

*Works because:* withholding the verdict is itself a rhetorical move — it signals "this question is hard enough that reasonable people disagree." *Fails when:* the episode actually HAS a verdict and withholding it reads as evasiveness rather than intellectual honesty. Parallax editorial doctrine requires naming the strongest version of each framework even when endorsing one — the verdict should not be withheld because the research hasn't earned it.

### e. Bilingual framework comparison — Sino-foreign intellectual history

**China Institute / Fairbank Center** academic comparisons of Chinese and Western theoretical frameworks (the Tributary System vs. Westphalian Sovereignty debate, Yan Xuetong's moral realism vs. Waltzian structural realism). The template's `nameCn` / `verdictCn` / `tenets[].textCn` fields are designed for this register. Naming a framework only in English when the originating theorists wrote in Chinese is a register break that signals ignorance — the bilingual affordance exists precisely so Parallax can engage Yan Xuetong's work, Zhao Tingyang's Tianxia framework, or Wang Huning's civilizational theory without anglicizing them.

*Works because:* the bilingual display signals to Chinese-literate viewers that the analysis engaged the primary-language scholarship, not a translation. *Fails when:* Chinese text is appended as a label rather than chosen for its original precision — only use `nameCn` / `textCn` when the Chinese phrasing is genuinely the canonical form.

## 3. General principles

The DuelingFrameworks form is a **forced comparison under a shared denominator** — the phenomenon. Without the shared denominator, viewers cannot evaluate the frameworks against each other: both sides are just making claims into the void. The Cleveland / Munzner perceptual hierarchy applies obliquely: the most load-bearing encoding is **spatial position** (framework A is always on the left; framework B is always on the right; the center divider is the "debate point") and **typographic weight** (tenet text that carries the most analytical weight should be the most prominently styled). The score, when shown, uses a horizontal bar whose visual argument is position along a common scale — the same encoding that makes the PricingWaterfall and DataChart legible.

Tufte's data-ink discipline applies to the tenet structure: every tenet should carry a specific claim, not just a framework name used as an abstraction. "States pursue relative gains" is a tenet; "Realism focuses on power" is a category label. The form works analytically only when the tenets are claims that can be adjudicated against the phenomenon — which is how the `score` and `verdict` fields earn their meaning.

The `score` field's range (0–100) creates a trap: scores at 90+ compress all visual differentiation between the bar and its maximum. A framework that explains a phenomenon at 90% vs. one at 75% should produce a visually meaningful gap. The editorial safe range is **55–80** — enough room for differentiation, not so extreme as to imply a framework explains nothing. A 50/50 score is editorially valid ("both equally partial") and preferable to two 90+ scores.

## 4. Recommendation for Parallax

**Default:** **4 tenets per framework**, `phenomenon` field mandatory, `score` shown only for empirical comparisons. For theoretical IR comparisons (Realism vs. Liberalism, Tributary System vs. Westphalian), follow the RAND no-score convention — use `verdict` text only. For empirical comparisons (two historical analogies scored on fit, two economic models judged against data), show the scoring bar in the 55–80 range.

**Phenomenon framing:** The `phenomenon` field should name a *historical event*, not a theory: "The collapse of the Soviet Union" not "State behavior after hegemonic decline." The phenomenon is what the viewer already knows; the frameworks are the analytical tools being applied to explain it. The more specific the phenomenon, the more the tenet adjudication carries editorial weight.

**Tenet count guidance:**
- 3 tenets: use only when the episode's argument is genuinely two-pillar per side. Fewer than 3 looks thin and implies the framework hasn't been taken seriously.
- 4 tenets: the standard. Enough to show structural depth; few enough to read in the composition's display window.
- 5 tenets: for the episode's climactic analytical moment only — when this comparison IS the main argument.
- Never go above 5 — tenet stacks become illegible at video scrubbing speed above this.

**Tenet count balance:** counts should be equal or differ by at most 1. The template warns when the difference exceeds 2. Asymmetric tenet counts read as editorial bias even when none is intended — the framework given more shelf space appears to be taken more seriously.

**Color assignment:** distinguish frameworks by accent color. IR Realism: `palette.rust` (power, conflict, zero-sum). IR Liberalism: `palette.amber` (institutions, norms, positive-sum). Chinese frameworks: `oxblood` when they represent the PRC state position; `amber` when they are independent scholarly work. Never let both frameworks share an accent color — the visual opposition collapses.

**Scoring bar — when to show:**
- Show: empirical comparisons (two historical analogies, two economic models, two predictive claims tested against outcomes).
- Suppress: Realism vs. Liberalism on any current event (RAND convention — numerical score implies precision the analysis cannot support); any comparison where the verdict is "both have partial purchase."
- Show with 50/50: when the episode explicitly wants to name the debate as unresolved. 50/50 is not a cop-out — it is a verdict ("this question is genuinely contested").

**Mode selection:**
- `cinematicMode: false` (default): for reference and analytical sequences. The static five-phase reveal (title → framework A → framework B → scoring → exit) suits survey beats and 101-explainer moments.
- `cinematicMode: true`: when the framework comparison is the emotional peak of the episode — the moment where the narration stakes everything on the analytical verdict. Reserve for one composition per episode.

**Duration:** `durationSec: 10–14` for cinematic mode; `durationSec: 6–8` for static reference.

## 5. Current template alignment

The existing `DuelingFrameworks` template (`src/templates/DuelingFrameworks/`):

- `warnIf` fires for: missing `phenomenon`, tenet count imbalance >2, and both scores >90. These cover the three most common structural failures. Runtime warnings are the correct mechanism (per CLAUDE.md performance guidance) — they fire once on mount, not every frame.
- Cinematic mode is a separate component (`CinematicDuelingFrameworks.tsx`) from the static mode (`StaticDuelingFrameworks.tsx`) — the router in `DuelingFrameworks.tsx` delegates based on `data.cinematicMode`. This is the correct architecture; the two modes have different enough layout and camera logic to warrant separate implementations.
- Bilingual support is complete: `titleCn`, `subtitleCn`, `phenomenonCn`, `verdictLabelCn`, `frameworkA.nameCn`, `frameworkB.nameCn`, `frameworkA.verdictCn`, `frameworkB.verdictCn`, and per-tenet `textCn`. This matches the channel's requirement for engaging Chinese-language scholarship without anglicizing it.
- **Score suppression:** no built-in `showScore: boolean` field. To suppress the scoring bar, omit `score` from the schema — but the Zod schema makes `score` required (no `.optional()`). **Diverges from canon:** the Economist no-score convention for theoretical IR comparisons cannot currently be honored without overriding the schema. A `showScore?: boolean` field (defaulting to `true`) would allow suppression without removing the data.
- `cinematicMode: true` sets `ambientParticles: true` by default. Static mode does not. This is the correct distinction — cinematic sequences earn the atmospheric depth treatment; reference cards do not.
- **Diverges from canon:** no "common ground" structural affordance. The FT "common ground first" convention has no UI slot — there is no `commonGround?: string[]` field for tenets that both frameworks share before the disagreement is named. This limits the template's ability to model a nuanced comparison where frameworks partially agree.

## 6. Specific upgrades proposed

1. **`showScore?: boolean` field (default: `true`).** Allows the data file to suppress the scoring bar without removing the `score` values (which may still drive the verdict comparison logic). Essential for implementing the Economist / RAND no-score convention on theoretical IR comparisons. Effort: small; impact: high — enables a major editorial convention the template currently can't express. **(small effort / high impact)**

2. **`commonGround?: string[]` tenet field — shared premise before disagreement.** Optional list of claims both frameworks agree on, rendered in a neutral center strip above the parallel columns (or as a shared prefix block in static mode). Implements the FT "common ground first" convention. Effort: medium; impact: medium — adds analytical nuance for sophisticated comparisons. **(medium effort / medium impact)**

3. **Tenet parallel-grammar linter in `warnIf`.** Beyond counting tenets, check whether frameworkA and frameworkB tenets at each index start with the same grammatical form (e.g., both "States..." or both gerund phrases). Heuristic: if frameworkA.tenets[0] starts with a noun phrase and frameworkB.tenets[0] starts with a verb, flag a warning. Effort: small; impact: small but catches the most common straw-man failure. **(small effort / small impact)**

4. **Score range recommendation in `warnIf`.** Fire a soft warning when either score is < 40 or either score is > 85. The < 40 case implies the episode is using the framework as a straw man to defeat; the > 85 case compresses visual differentiation. Both are editorial red flags. Effort: trivial; impact: medium. **(trivial effort / medium impact)**

5. **`cinematicMode` camera-hold duration per tenet.** Currently the cinematic camera dwells on each tenet for a fixed interval. Add optional `tenet.dwellSec` to let visual-spec writers give more air to complex tenets without overriding the entire camera path. Matches the pattern proposed for EscalationLadder's rung-level dwell control. Effort: medium; impact: medium for cinematic climax sequences. **(medium effort / medium impact)**

## 7. Failure mode flags (always catch in audit)

- **Missing `phenomenon`** — the template warns. The comparison floats; viewer doesn't know what the frameworks are competing to explain. Every DuelingFrameworks composition must have a phenomenon named as a specific historical event or situation.

- **Straw-manning** — stating the weaker version of a framework to favor the other. Parallax editorial standard (from `episodes/EDITORIAL_PLAYBOOK.md`): "write the strongest version of each framework." The `tenet` text audit in visual review should catch tenets that are caricatures rather than canonical claims (e.g., "Liberals think everyone is friendly" rather than "Liberals believe international institutions can make cooperation self-sustaining").

- **Score theater** — assigning scores when the episode hasn't earned the verdict. The scoring bar should appear only when the narration has built to a judgment through the tenet comparison. If the score appears before the tenets have been analyzed, the verdict reads as asserted rather than argued. Withhold the scoring bar if the episode is building deliberative tension.

- **Both scores >90** — the template warns. Two frameworks both explaining 90%+ of a phenomenon is analytically incoherent — if both explained it equally well, there would be no "dueling." Use the 55–80 range for differentiation; 50/50 for genuine ambiguity.

- **Non-parallel tenet lists** — the template warns at imbalance >2. Asymmetric tenet counts imply editorial bias. Parallel grammar within corresponding tenet pairs is equally important and not yet auto-checked — catch manually in review.

- **Too many tenets (>5 per framework)** — the comparison becomes illegible at scrub speed. Collapse related tenets ("states pursue relative gains" and "anarchy forces zero-sum calculation" are one claim, not two).

- **Verdict without supporting tenet contrast** — judgment arrives without evidence visible in the composition; viewer can't see WHY one framework wins. The verdict should be the culmination of an argument visible in the tenets, not a conclusion dropped from outside.

- **`cinematicMode: true` on every DuelingFrameworks beat** — the dramatic camera loses its weight. Reserve for one peak per episode; use static mode for all other framework comparisons in the same episode.

- **Color collision** — both frameworks in the same or similar accent colors. The visual opposition between frameworks IS the form's structural argument; without color differentiation, the head-to-head collapses into a single panel of claims.

- **English-only framework names when originating theorists wrote in Chinese** — register break. Set `frameworkA.nameCn` / `frameworkB.nameCn` when engaging Yan Xuetong's "moral realism," Zhao Tingyang's Tianxia theory, or Wang Huning's cultural conservatism. Use the `textCn` field on tenets when the Chinese phrasing is the canonical form.

## TL;DR

**4 tenets per framework, `phenomenon` as a historical event (not a theory name), scoring bar suppressed for Realism vs. Liberalism debates (RAND convention — use `showScore: false` once the field ships), shown in 55–80 range for empirical comparisons. Write the strongest version of each framework. `cinematicMode` reserved for the episode's analytical peak. `palette.rust` for Realism, `palette.amber` for Liberalism.**

Last updated: May 15, 2026
