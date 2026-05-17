# PRODUCTION SCRIPT — "The Prisoner's Dilemma Is Wrong About Almost Everything"

**Episode slug:** prisoners-dilemma
**Format:** Philosopher's Lens
**Arc:** 3 — The Diplomacy of Deception (opener)
**Target length:** ~18 minutes (~2,800 words narration)
**Beats:** 5
**Named concept:** The Wrong Game
**Discovery shape:** Inversion (build the model, then break it — pivot at ~40-50% runtime)
**Script version:** v5.6 (May 9, 2026) — **Two `[SCENE:]` block conversions** under the May 9 chained-still-morph workflow:
- **Beat 3 opening** (Path A): `[SCENE: wrong-game-establish]`, 4 frames over ~30s. Replaces two scattered `[AI-GEN:]` cells (grid landscape + negotiation room). Validated by the May 9 Scene C bakeoff. Scene spec at `scenes/wrong-game-establish.md`.
- **Beat 4 close** (Path A): `[SCENE: cooperation-arc]`, 3 frames over ~26s. Restructured the Beat 4 ending: AI-GEN terraced (was line 170) and AI-GEN ocean (was line 184) migrate into the scene block as Frame A and Frame C; new Frame B (alpine commons, aigen-12a) bridges them with the hero morph (alpine → ocean = "boundedness vanishing"). The KineticTypography "Cooperation isn't a miracle. It's designed." card stays as the typography landing for the thesis line; the scene block carries the Ostrom caveat narration. Scene spec at `scenes/cooperation-arc.md`.

Narration unchanged from v5.4 (zero words rewritten across both conversions). Five Beat-4-close cells consolidated to four.

Visual pipeline updated: ChatGPT image generation + Pika 2.5 (chained morphs) for `[SCENE:]` blocks; existing single-shot `[AI-GEN:]` cells unchanged. The 13 single-shot Hailuo clips outside the two scene blocks remain production-ready as-is.

**v5.4** (superseded): v5.3 visual-spec complete + AI-GEN restored: Recraft→Pika 2.2 image-to-video pipeline for all scene/metaphor visuals, DataChart→TimeSeriesChart for vol-smile, GameBoard→SplitComposition for PD-vs-staghunt, MG run breaks inserted.
**Target behavior:** Subscribe (calm competence close — viewer walks away with a bounded analytical tool, not alarm)

---

## BEAT 1 — THE FAILED EXPERIMENT (0:00–3:30)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| The Prisoner's Dilemma is the most influential framework in the history of strategic thinking. It explains, according to those who apply it, why nations can't cooperate, why arms control fails, why rational actors produce collectively irrational outcomes. It is the lens through which the people managing international power look at each other. | **P2** · [MG:] FrameworkDiagram — "Standard Frame" label. PD payoff matrix, arrows converging on "mutual defection" cell. This is the model as the world receives it — authoritative, clean. · [prisoners-dilemma/framework-standard-frame.json] · 12s |
|  | DIR: reveal(sequential, per-phase:2s) |
|  | DIR: mood(subtle) |
| Here's what it can't explain: its own first experiment. | **P2** · [MG:] KineticTypography — "Here's what it can't explain: its own first experiment." · bone on ink, amber on "its own first experiment" · 4s |
|  | DIR: hold(land) |
| The question this episode is about — how a framework that failed on day one conquered everything — has a specific answer. And that answer changes how you read every conflict playing out right now. | **P2** · [MG:] KineticTypography — "How does a model that failed on day one conquer everything?" · amber question mark · 5s |
|  | DIR: hold(breathe) |
|  | DIR: cut(iris, origin:center) |
| *(Voice note: deliberate pace on these three paragraphs — the 4-beat cold open must complete before the RAND story begins.)* | |
| In January 1950, two researchers at the RAND Corporation ran the first-ever prisoner's dilemma experiment. {✅} | **P3** · [AI-GEN:] scene · "Constructivist mid-century research office: two geometric figures in shirtsleeves at a small table with paper grids, warm amber light through venetian-blind slats casting parallel shadows, color-blocked interior in bone and grey-green" · vector_illustration · standard · 7s · Pika: slow push-in, subtle light flicker through blinds |
|  | DIR: cam(static) |
|  | DIR: mood(subtle, drift:slow) |
| The subjects — an economist named Armen Alchian and a mathematician named John Williams — played a hundred rounds of the game that was supposed to prove cooperation is irrational. {✅} | continuation of above |
| They cooperated sixty percent of the time. {✅} | **P1** · [MG:] GameBoard — payoff matrix with animated scoreboard. 60 rounds light amber, 14 rounds muted grey. Counter animates up. · [prisoners-dilemma/gameboard-flood-dresher.json] · 10s |
|  | DIR: reveal(count-up, sync:"sixty percent", pulse) |
|  | DIR: cam(overview → element:0, sync:"sixty", track) |
|  | DIR: hold(land) |
|  | DIR: cut(color-wash, ink) |
| *(Voice note: let the number land. Slight pause after "fourteen times.")* | |
| Mutual defection — the only outcome the model predicted — happened fourteen times out of a hundred. {✅} | continuation — counter shifts to defection highlight |
| John Nash — the man whose equilibrium concept the experiment was testing — read the results. {✅} His response wasn't to question the model. It was to question the players. | **P2** · [ARCHIVAL:] John Nash portrait photograph, 1950s · Wikimedia Commons · standard · 5s |
|  | DIR: mood(subtle, dim:0.3) |
| Nash's verdict: they would have been more rational if they couldn't see each other. {✅} | **P1** · [MG:] KineticTypography — Nash's judgment, 1950: "They would have been more rational if they couldn't see each other." ⚠️ Verify exact phrasing against Flood 1952 (RAND RM-789-1) before production. · bone text on ink · 5s hold |
|  | DIR: hold(land) |
| *[Beat.]* | |
| That response — blame the players, not the model — set a template. The most influential framework in strategic thinking was contradicted by its own first experiment. It conquered the world anyway. | **P2** · [AI-GEN:] metaphor · "Constructivist propaganda poster: a mathematical equation radiating outward like sunbeams over silhouetted institutions — university, military headquarters, stock exchange — all turning toward the equation as if worshipping it" · vector_illustration · standard · 7s · Pika: slow radial light pulse from equation center, institutions casting lengthening shadows |
|  | DIR: mood(dense, drift:slow) |
|  | DIR: hold(breathe) |
|  | DIR: cut(iris, origin:center) |
| And right now, it is shaping every negotiation that will determine your future. | **P1** · [MG:] KineticTypography — "Every negotiation that will determine your future." · amber accent on ink · 5s hold |
|  | DIR: hold(land) |
| *(Voice note: direct address on "your future." This is the stakes sentence.)* | |
| The standard story is that the Prisoner's Dilemma explains why cooperation between nations is so hard. That it reveals a deep truth about rational self-interest. | **P3** · [AI-GEN:] scene · "Constructivist aerial view: geometric building complex with national flags as abstract color bars, figures as small dots converging on entrance, overhead perspective, color-blocked in ink and bone with amber accent on central hall" · vector_illustration · standard · 6s · Pika: slow drift down, tiny figures moving toward entrance |
| But that's not what's going on. The Prisoner's Dilemma doesn't describe the game we're playing. It *creates* the game we're playing. And once you see how — you can't unsee it. | **P1** · [MG:] GameBoard — A single Nash equilibrium dot (glowing amber) appears alone in a payoff matrix. Visual motif: first appearance. · [prisoners-dilemma/gameboard-motif-beat1.json] · 6s |
|  | DIR: reveal(instant, hero:0, glow) |
|  | DIR: mood(subtle) |
|  | DIR: hold(breathe) |

**Beat 1 word count:** ~310 words · **Est. runtime:** ~3:30 (including visual holds)

---

## BEAT 2 — HOW A FAILED MODEL CONQUERED THE WORLD (3:30–7:30)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| **TRANSITION** · TitleTransition · "HOW A FAILED MODEL CONQUERED THE WORLD" · 2s |
| | PACE: analytical |
| Thomas Schelling put it in a diplomacy textbook. {✅} William Hamilton imported it into biology to explain why animals compete. {✅} Economists used it to model why cartels cheat. {✅} Robert Axelrod ran computer tournaments to evolve cooperative strategies. {✅} Douglas Hofstadter put it in *Scientific American*. {✅} | **P1** · [MG:] ArcDiagram — Citational lineage of the PD across eight named figures, 1950→1983: Flood & Dresher (RAND experiment) → Nash (equilibrium response) → Schelling (diplomacy) → Hamilton (biology) → Trivers (reciprocal altruism) → Maynard Smith (ESS) → Axelrod & Hamilton (tournaments) → Hofstadter (popularization). Arcs encode disciplinary jumps. · [prisoners-dilemma/arc-pd-lineage.json] · 8s |
|  | DIR: reveal(sequential, per-node:1s) |
|  | DIR: cam(overview, settle) |
| By 1975 — twenty-five years after it failed that first experiment — there were over two thousand scholarly articles on the Prisoner's Dilemma. {✅} | **P1** · [MG:] DataChart — Animated bar chart: 1950 (1) → 1960 (~50) → 1975 (2,000+). The numeric punch landing after the lineage. · [prisoners-dilemma/chart-diffusion.json] · 6s |
|  | DIR: reveal(stagger:300ms, pulse) |
|  | DIR: cam(overview → element:4, sync:"two thousand", track) |
|  | DIR: hold(breathe) |
| A model that couldn't predict two people in a room was explaining everything from nuclear war to evolution. | continuation — hold on final state |
| How? Because of where it was born. | **P2** · [ARCHIVAL:] RAND Corporation headquarters exterior, Santa Monica, 1950s · Wikimedia Commons · standard · 5s |
| Not a university. Not a think tank the way we use the word now. RAND Corporation — a defense contractor for *ideas*, funded by the Air Force, staffed with mathematicians, tasked with one job: making nuclear war thinkable. {✅} | **P2** · [AI-GEN:] scene · "Constructivist institutional corridor: fluorescent light bars as geometric strips, lone figure in suit walking past chalkboards dense with game matrices, color-blocked walls in grey-green and cream, figure rendered as angular silhouette" · vector_illustration · standard · 7s · Pika: slow push-in along corridor, figure walking forward, fluorescent lights humming |
|  | DIR: cam(push-in, over:7s) |
|  | DIR: mood(normal, drift:slow) |
|  | DIR: cut(color-wash, ink) |
| Game theory had a special status there. John von Neumann was a consultant. {✅} The whole enterprise ran on one premise: Soviet decision-making could be modeled mathematically, and the math would reveal the optimal American response. The Prisoner's Dilemma fit this perfectly — a two-player game. No communication. No trust. No future. Just two rational actors and the cold logic of self-interest. | **P2** · [MG:] GameBoard — Classic PD matrix with "COOPERATE/DEFECT" labels. Nuclear warhead icons replacing abstract payoffs. Clean, analytical register. · [prisoners-dilemma/gameboard-nuclear.json] · 8s |
|  | DIR: reveal(sequential, per-phase:2s) |
| Nuclear strategy in miniature. | continuation — hold |
| And then it escaped the building. | **P3** · [AI-GEN:] metaphor · "Constructivist doorway: dark geometric interior frame opening onto bright amber exterior, light rays as sharp triangular beams, threshold as clean dividing line between shadow and light" · vector_illustration · standard · 3s · Pika: light beams slowly sweeping across threshold, dust motes in amber light |
| | PACE: urgent |
| *[COUNTERPOINT]* Every discipline that adopted it had to narrow something to make the model fit. Drop the reputation — it's a one-shot game now. Remove the communication channel — players can't talk. Strip the institutions — there's no referee. | **P1** · [MG:] FrameworkDiagram — "Conditions of Application" header. Each assumption appears as a filter gate. As each one appears, real-world scenarios get eliminated below: "diplomacy" vanishes at "one-shot," "trade" at "no reputation," until a single dot remains: "OPEC quota meeting, maybe." · [prisoners-dilemma/framework-narrowing.json] · 15s |
|  | DIR: reveal(sequential, per-phase:2s, progressive) |
|  | DIR: cam(overview → element:6, over:12s, track) |
|  | DIR: mood(subtle, dim:0.4) |
| *(Voice note: narrate slowly. The visual carries the argument — let the viewer count the disappearing scenarios.)* | |
| The model spread everywhere. It applies almost nowhere. | **P2** · [MG:] KineticTypography — "2,000+ articles. 14 applications." · amber/ink split · 4s |
|  | DIR: hold(land) |
| Which raises the question this episode is actually about: if the model failed its first test and applies almost nowhere — why does cooperation keep happening anyway? Something is working. The PD can't see it. | **P2** · [MG:] KineticTypography — "Something is working. / The PD can't see it." · bone text, amber on last line · 6s |
|  | DIR: hold(breathe) |
| | PACE: analytical |
| Checkpoint. A model built for anonymous one-shot encounters became the default lens for all strategic thinking — not because it predicted well, but because it made the world legible to the people paying for the research. {✅} The experiment showed it didn't work on day one. It conquered the world anyway. The question is how that changes what it touches. | **P2** · [MG:] KineticTypography — Checkpoint: "Built for: anonymous one-shots / Applied to: everything / Survived because: institutional momentum" · bone text · 8s |
|  | DIR: hold(breathe) |

**Beat 2 word count:** ~480 words · **Est. runtime:** ~4:00

---

## BEAT 3 — THE WRONG GAME (7:30–11:30) <!-- [FRAMEWORK UNLOCK] -->

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| **TRANSITION** · TitleTransition · "THE WRONG GAME" · 2s |
| | PACE: breathing |
| A model that failed its first experiment, applied to everything, still spreading. That alone is a curiosity — an academic footnote about institutional momentum. But the Prisoner's Dilemma isn't just mislabeling the world. It's *remaking* the world in its own image. | **P1** · [SCENE: wrong-game-establish] · 4 frames over ~30s · register=grounding · arc=linear · See: scenes/wrong-game-establish.md |
|  | EMOTIONAL: dread → recognition → resignation |
|  | CAMERA: eye-level, fixed throughout · world resolves around fixed viewpoint |
|  | DIR: cut(iris, origin:center) — entry transition from prior KT |
|  | DIR: mood(dense, drift:slow) — applies across the chain |
|  | DIR: cut(color-wash, ink) — exit transition into trap-mechanism GameBoard |
| | PACE: analytical |
| You walk into a negotiation. You've been trained — explicitly or implicitly, through textbooks and policy memos and a half-century of strategic culture — to assume your counterpart will defect. That the rational move is to defect first. That cooperation is naive. | continuation of [SCENE: wrong-game-establish] — narration runs over the chain, with Frame A on "remaking the world," Frame B on "trained to assume," Frame C on "rational to defect first," Frame D on "cooperation is naive" |
| So you defect. And your counterpart — trained by the same textbooks, shaped by the same culture — sees your defection and concludes the model was right all along. | **P1** · [MG:] GameBoard — POV of the payoff matrix. Both players' arrows converge on defection. The equilibrium dot brightens. "Model confirmed" fades in. · [prisoners-dilemma/gameboard-trap-mechanism.json] · 10s |
|  | DIR: reveal(sequential, per-phase:3s) |
|  | DIR: cam(overview → element:0, sync:"defect", track) |
|  | DIR: hold(land) |
| The prediction came true. But it came true *because you believed it*. | **P1** · [MG:] KineticTypography — "The prediction came true because you believed it." · bone on ink · 5s hold |
|  | DIR: hold(linger) |
| *[Beat.]* | |
| I call this The Wrong Game. | **P1** · [MG:] KineticTypography — "THE WRONG GAME" · large, amber on ink, centered · 4s hold |
|  | DIR: hold(land) |
|  | DIR: mood(dense) |
| | **P3** · [AI-GEN:] metaphor · "Constructivist stock exchange floor: geometric traders as angular silhouettes reaching upward, ticker tape as flowing ribbon of numbers, equation hovering above like a sun, color-blocked in amber and ink" · vector_illustration · standard · 4s · Pika: ticker tape flowing, traders' arms rising, slow drift up |
| It's the same mechanism that hit finance. In 1973, Fischer Black and Myron Scholes wrote an equation for how options should be priced. {⚠️} Within a decade, traders had reorganized their behavior around the equation — and market prices converged to match its predictions. The model didn't describe reality. Reality rearranged itself to match the model. Until October 1987, when it couldn't anymore. {⚠️} | **P2** · [MG:] TimeSeriesChart — Implied volatility: flat line 1976–1987 labeled "model = reality," then permanent skew post-crash labeled "the smile." · [prisoners-dilemma/chart-vol-smile.json] · 8s |
|  | DIR: reveal(draw, over:3s) |
| *(Voice note: one-sentence parallel — plant and move on.)* | |
| The Prisoner's Dilemma has the same structure. Assume defection is rational. Build institutions around that assumption. Train diplomats in it. Staff think tanks with people who think in it. And then observe — with great scientific satisfaction — that people defect. | **P1** · [MG:] FrameworkDiagram — Four nodes spatially arranged (diamond): "Washington," "Beijing," "Geneva," "Brussels." Each contains a single glowing equilibrium dot (the motif multiplying). · [prisoners-dilemma/framework-motif-beat3.json] · 10s |
|  | DIR: reveal(stagger:500ms, pulse) |
|  | DIR: cam(overview, zoom:1.0) |
|  | DIR: mood(normal, tint:oxblood) |
|  | DIR: hold(breathe) |
| The Prisoner's Dilemma isn't wrong about everything. There are situations where it applies — cartels trying to hold production quotas, for instance. OPEC has genuine defection problems, and the PD captures them cleanly. {✅} | **P3** · [AI-GEN:] scene · "Constructivist oil infrastructure: geometric refinery towers as angular columns against amber sunset, pipeline as bold horizontal line, smoke as stylized spiral forms, color-blocked in rust and ink" · vector_illustration · standard · 6s · Pika: slow pan right, smoke spirals rising, sunset light shifting |
| What I'm arguing is that the Prisoner's Dilemma became the *default* — the game we assume we're playing until someone proves otherwise. And that default has a cost. Because when you're actually in a coordination game — where cooperation is rational, where the puzzle is trust, not domination — treating it as a Prisoner's Dilemma creates the very defection it predicts. | **P2** · [MG:] FrameworkDiagram — Two-panel: left shows "PD as default → defection → 'confirmed'" cycle; right shows "What if the game is different?" with question mark · [prisoners-dilemma/framework-cycle-vs-question.json] · 12s |
| That's The Wrong Game. Not that the PD is always wrong — but that it's the wrong *default*. And playing the wrong game makes the wrong game real. | **P2** · [MG:] KineticTypography — "Playing the wrong game makes the wrong game real." · amber accent · 5s hold |
|  | DIR: hold(land) |
| Checkpoint. This isn't conspiracy — nobody sat in a room and decided to mislead the world. The mechanism is subtler. A model that fit one institution's funding needs became canonical through momentum. Canonization changed behavior. Behavior confirmed the model. A self-reinforcing loop — not a plot, a trap. | **P2** · [MG:] KineticTypography — Checkpoint: "Not conspiracy: institutional momentum / The model changes behavior by becoming canonical / Self-reinforcing loop — not a plot, a trap" · 8s |
|  | DIR: hold(breathe) |

**Beat 3 word count:** ~600 words · **Est. runtime:** ~4:00

---

## BEAT 4 — THERE WAS ALWAYS ANOTHER GAME (11:30–15:30) <!-- [MAIN REVEAL] -->

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| **TRANSITION** · TitleTransition · "THERE WAS ALWAYS ANOTHER GAME" · 2s |
| | PACE: breathing |
| But here's the relief. There was always another game available. And we have proof it works. | **P2** · [AI-GEN:] illustration · "Constructivist sunrise composition: geometric sun rays in amber and bone breaking through dark angular clouds, silhouetted landscape below with tiny cooperative figures — some carrying logs together, others building a structure — color-blocked in warm palette" · vector_illustration · standard · 7s · Pika: sun rays slowly expanding, clouds parting, figures in subtle motion carrying materials |
|  | DIR: mood(subtle, drift:slow) |
|  | DIR: hold(breathe) |
|  | DIR: cut(dissolve) |
| In 1755, Jean-Jacques Rousseau told a parable. {✅} A group of hunters face a choice. Each one can catch a hare alone — small reward, but guaranteed. Or they can all commit to hunting a stag — enormous reward, but only if nobody breaks ranks. If even one person peels off for the hare, the stag escapes and the cooperators get nothing. | **P3** · [AI-GEN:] scene · "Constructivist forest hunt: geometric trees as vertical columns, angular hunters with spears converging on a stylized stag in center, one hunter at edge turning toward a small hare, dawn light as amber rays through canopy, color-blocked in bone and ink" · vector_illustration · standard · 7s · Pika: slow push-in toward diverging hunter, hunter turning away from group, light rays shifting through canopy |
| | PACE: analytical |
| This is the stag hunt. And it looks like the Prisoner's Dilemma — but it is fundamentally different. | **P1** · [MG:] GameBoard — Stag hunt payoff matrix. TWO equilibrium dots glow — one at mutual cooperation (stag, high payoff), one at mutual defection (hare, low payoff). The motif now has a companion. · [prisoners-dilemma/gameboard-staghunt.json] · 12s |
|  | DIR: reveal(sequential, per-phase:4s, settle) |
|  | DIR: cam(overview → element:0, sync:"fundamentally", track) |
|  | DIR: hold(breathe) |
| *(Voice note: slow down — this is the turn. Viewer needs to feel the difference between two equilibria and one.)* | |
| In the Prisoner's Dilemma, mutual cooperation is not an equilibrium. Defection always pays more. In the stag hunt, mutual cooperation *is* an equilibrium — it's rational to cooperate, as long as you can trust that others will too. The puzzle shifts from domination to coordination. | **P1** · [MG:] SplitComposition — Left: PD matrix (one dot at mutual defection). ∴ divider. Right: Stag Hunt (two dots, cooperative dot highlighted amber). · [prisoners-dilemma/split-pd-vs-staghunt.json] · 10s |
|  | DIR: reveal(stagger:400ms, hero:0, pulse) |
|  | DIR: cam(overview → element:0, sync:"cooperation", track) |
|  | DIR: hold(land) |
| The philosopher Brian Skyrms proved something remarkable. {✅} An iterated Prisoner's Dilemma — the version people actually encounter, where you meet the same counterpart repeatedly — is mathematically equivalent to a stag hunt. The cooperative outcome is an equilibrium. It always was. {✅} | **P2** · [MG:] KineticTypography — "Iterated PD ≡ Stag Hunt" · Skyrms (2004) citation · amber · 6s |
|  | **P1** · [MG:] GameBoard — `iterated-play` variant. Same PD payoffs (3,3 / 0,5 / 5,0 / 1,1) replicated across rounds 1, 10, 50, 200 in small multiples. Highlight migrates from defect-defect (R1) → mixed (R10) → cooperation gaining (R50) → mutual cooperation locked (R200). Visual proof of "it always was" — the equilibrium emerges as memory accumulates. · [prisoners-dilemma/gameboard-iterated-play.json] · 10s |
|  | DIR: reveal(stagger:rounds, hero:final-round) |
|  | DIR: hold(land) |
| Which means the question was never "how do you escape the logic of defection?" It was always "how do you coordinate on the outcome you both prefer?" | **P2** · [MG:] FrameworkDiagram — Old question struck through: "How to escape defection?" → New question in amber: "How to coordinate on cooperation?" · [prisoners-dilemma/framework-reframe.json] · 6s |
|  | DIR: reveal(instant, hero:1, glow) |
| *[Beat.]* | |
| And we don't have to theorize. Elinor Ostrom spent thirty years documenting communities that solved this problem in practice. {✅} [VISUAL-FIRST: 3s] | **P1** · [MG:] ProportionalSymbolMap — Six named commons across four continents, symbol AREA encodes years of documented continuous operation: Valencia huertas (750+ yrs), Swiss Törbel alps (800+ yrs), Japanese iriaichi (400+ yrs), Filipino zanjeras (400+ yrs), Nepalese pani panchayats (300+ yrs), Maine lobster gangs (140+ yrs). Three phases: Europe close-up → +Japan+Maine → +Philippines+Nepal global. Replaces choropleth-ostrom (country-fill) with case-anchored evidentiary register. · [prisoners-dilemma/proportional-symbol-ostrom.json] · 14s |
|  | DIR: reveal(stagger:200ms) |
|  | DIR: cam(wide → tight:[0, 35], over:8s, track) |
|  | DIR: hold(breathe) |
| Spanish irrigation cooperatives in Valencia — still operating after six hundred years. {✅} Swiss alpine grazing commons with charters from the thirteenth century. {✅} Japanese mountain forest cooperatives. Maine lobster fisheries. {✅} | continuation — camera moves between highlighted regions |
| Ostrom documented what they shared: eight design principles. {✅} Clear boundaries. Graduated sanctions — first offense isn't a death sentence. The right to self-organize. Eight features total, and every single one of them builds something the Prisoner's Dilemma *assumes away*. | **P1** · [MG:] FrameworkDiagram — Split layout: left shows Ostrom's 8 principles as a structured list; right shows PD assumptions from Beat 2 (the narrowing gates). Lines connect each principle to the assumption it dissolves. · [prisoners-dilemma/framework-ostrom-vs-pd.json] · 12s |
|  | DIR: reveal(stagger:400ms, progressive) |
|  | DIR: cam(overview) |
|  | DIR: hold(breathe) |
| Communication. Reputation. Repeated interaction. Institutional context. Capacity for commitment. The model says cooperation requires a miracle. The evidence says cooperation is designed. | **P2** · [MG:] KineticTypography — "Cooperation isn't a miracle. It's designed." · amber · 8s hold |
|  | DIR: hold(land) |
|  | DIR: cut(dissolve) — into [SCENE: cooperation-arc] |
| One important caveat. Ostrom's cases are mostly community-scale — identifiable people, clear boundaries, face-to-face relationships. {✅} The global climate commons and oceanic fisheries resist her principles precisely because boundaries are unclear and monitoring is expensive. The PD isn't wrong about everything. But it's wrong about most of the things we've been applying it to. | **P1** · [SCENE: cooperation-arc] · 3 frames over ~26s · register=grounding · arc=tonal · See: scenes/cooperation-arc.md |
|  | EMOTIONAL: rooted → extended → unmoored |
|  | CAMERA: gentle drift across landscape · environmental morph carries the visual change |
|  | FRAMES: A=terraced (existing aigen-12) · B=alpine commons (NEW aigen-12a) · C=ocean (existing aigen-13) |
|  | HERO MORPH: B → C (alpine commons dissolves into ocean — "boundedness vanishing") |
|  | DIR: mood(subtle, drift:slow) — applies across the chain |
|  | DIR: cut(dissolve) — exit transition into Beat 5 TitleTransition |

**Beat 4 word count:** ~640 words · **Est. runtime:** ~4:00

---

## BEAT 5 — YOUR GAME (15:30–18:00)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| **TRANSITION** · TitleTransition · "YOUR GAME" · 2s |
| | PACE: breathing |
|  | **P3** · [AI-GEN:] scene · "Constructivist city street: geometric pedestrian figures walking in evening light, angular building facades on both sides, long shadows as parallel lines, amber streetlight glow, color-blocked in ink and warm tones" · vector_illustration · standard · 4s · Pika: slow pan left, pedestrian figures walking, shadows lengthening |
|  | DIR: mood(subtle, drift:slow) |
| Most of the major negotiations happening right now — US-China AI governance, climate finance, the next round of nuclear arms control — are staffed by people trained on this model as their default lens. {NEW} People who've internalized the assumption that the other side will defect. People who see cooperation as naive and defection as rational. | **P2** · [MG:] FrameworkDiagram — Same four-node spatial arrangement from Beat 3: Washington, Beijing, Geneva, Brussels. All equilibrium dots pulse in synchronized rhythm. Same defection assumption, same game, everywhere. · [prisoners-dilemma/framework-motif-beat5.json] · 8s |
|  | DIR: mood(normal, tint:oxblood) |
| And the question the stag hunt asks — "can we coordinate on the outcome we both prefer?" — never gets posed. Because the game they're playing doesn't have that option. In the Prisoner's Dilemma, cooperation isn't an equilibrium. In the stag hunt, it is. Same situation. Different game. Different possibilities. | **P1** · [MG:] FrameworkDiagram — FINAL MOTIF: Same four nodes. A second equilibrium dot appears beside each existing dot — the cooperative equilibrium. Two dots where there was one. The cooperative equilibrium was always available. · [prisoners-dilemma/framework-motif-final.json] · 10s |
|  | DIR: reveal(stagger:600ms, hero:0, glow) |
|  | DIR: cam(overview, zoom:1.0) |
|  | DIR: mood(dense) |
|  | DIR: hold(linger) |
| *(Voice note: this is the visual climax — the motif completes. Let it breathe.)* | |
| *[Beat.]* | **P3** · [AI-GEN:] metaphor · "Constructivist horizon: two geometric landmasses separated by narrow strait, each with a single glowing dot (amber and grey), reflection in the water between them, still and contemplative, color-blocked in ink and bone" · vector_illustration · standard · 4s · Pika: subtle water reflection rippling, dots gently pulsing, slow drift |
| | PACE: analytical |
| Here's what would change my mind. If a major actor — say, the US or China in the AI governance space — explicitly reframed a PD-coded conflict as a coordination problem. Adopted stag-hunt language. Built the institutional scaffolding Ostrom describes. And nothing changed. If the reframing produced no shift in outcomes, then the model is descriptive, not constructive — the world really is a Prisoner's Dilemma and the game isn't creating itself. | **P2** · [MG:] FrameworkDiagram — "What would change my mind" header. Single condition: "Reframing → no outcome shift → model is descriptive, thesis weakens." · [prisoners-dilemma/framework-falsification.json] · 12s |
| I put the probability of a US-China joint AI safety communiqué with shared technical vocabulary by December 2026 at thirty percent. Below even odds. The structural incentives are stacked against it — not because cooperation is irrational, but because both establishments are playing the wrong game and don't have the vocabulary to play the right one. That's a testable claim. {NEW} | **P1** · [FORECAST:] ProbabilityGauge (forecast variant) · [prisoners-dilemma/forecast-pd-cooperation.json] · 14s |
|  | DIR: hold(land) |
| *(Voice note: state the probability matter-of-factly. The specificity IS the credibility. Don't dramatize it.)* | |
| Watch for the signals. The NPT Review Conference language — are they talking about *reciprocal restraint*, which is PD vocabulary, or *shared standards*, which is stag-hunt vocabulary? {⚠️} The AI Safety Institute publications from both countries. The frame tells you which game they think they're playing. | **P2** · [MG:] KineticTypography — "Watch signals" header, 3 items: "1. NPT RevCon vocabulary / 2. AISI joint publications / 3. Bilateral AI communiqué language" · amber header, bone text · 7s |
| | PACE: breathing |
| Games can be changed. It's not easy — seventy-five years of institutional momentum is real. The textbooks are written. The career incentives reward people who think in these terms. | **P3** · [AI-GEN:] scene · "Constructivist lecture hall: rows of geometric student figures facing a chalkboard covered in game matrices, angular professor silhouette at podium, overhead fluorescent strips, color-blocked in bone and grey with amber chalkboard highlights" · vector_illustration · standard · 5s · Pika: slow push-in toward chalkboard, professor gesturing, chalk dust floating |
|  | DIR: mood(subtle) |
| But it has been done before. In 1986, Reagan and Gorbachev walked into a summit that their entire strategic establishment had coded as a Prisoner's Dilemma. {⚠️} Two nuclear powers. Rational defection. Zero-sum logic. And they reframed it. Not as naive trust — as coordination. Common security. The result was the INF Treaty, which eliminated an entire class of nuclear weapons. | **P2** · [ARCHIVAL:] Reagan-Gorbachev summit photograph (Reykjavik 1986 or INF Treaty signing 1987) · Wikimedia Commons · standard · 6s |
|  | DIR: hold(breathe) |
| What the evidence establishes: the stag hunt was always available, cooperation is designed rather than miraculous, and the framing we use shapes the game we get. What it can't establish: whether reframing alone shifts outcomes without Ostrom's institutional scaffolding — boundaries, monitoring, graduated sanctions. And a harder limit: whether both parties share a vocabulary in which "coordination" means the same thing. US and Chinese strategic traditions may not agree on what "shared standards" requires — who sets them, what information sovereignty means. The stag hunt identifies the right question. It may not supply the complete vocabulary. | **P2** · [MG:] KineticTypography — "What the evidence establishes / What it can't establish" — two-column, bone text, amber headers; right column: (1) scaffolding gap, (2) vocabulary gap · 10s |
|  | DIR: hold(breathe) |
| The Prisoner's Dilemma failed its first experiment in 1950. Alchian and Williams cooperated sixty out of a hundred rounds — because they could see each other, because they had a future, because they were human beings and not the rational automatons the model required. | **P2** · [MG:] GameBoard — Callback: Beat 1 scoreboard. The 60 amber rounds glow again. · [prisoners-dilemma/gameboard-flood-dresher.json] · 5s |
|  | DIR: reveal(instant) |
|  | DIR: mood(subtle) |
| Seventy-five years later, the model that couldn't predict two people in a room is shaping how entire civilizations negotiate their shared future. | **P2** · [AI-GEN:] illustration · "Constructivist panorama: two vast geometric cityscapes facing each other across a narrow channel, the channel itself shaped like a game theory matrix, tiny mannequin figures standing at the edges looking across, amber light from below, ink sky above" · vector_illustration · conflict · 7s · Pika: slow lateral pan across channel, amber light flickering from below, figures still as sentinels |
|  | DIR: mood(dense, dim:0.4) |
|  | DIR: hold(linger) |
|  | DIR: cut(dissolve) |
| Now you can see it. The next time you hear that cooperation between rivals is impossible — you'll know which question wasn't asked: which game are they actually playing? | **P1** · [MG:] GameBoard — Final frame: two equilibrium dots side by side. One amber (cooperation). One grey (defection). Both available. · [prisoners-dilemma/gameboard-final-choice.json] · 5s hold |
|  | DIR: reveal(stagger:500ms, glow) |
|  | DIR: mood(none, drift:none) |
|  | DIR: hold(linger) |
| *(Voice note: end quiet. No flourish. Let the image hold.)* | |

**Beat 5 word count:** ~655 words · **Est. runtime:** ~2:45

---

## ASSET SUMMARY

### Visual Mode Breakdown
| Mode | Count | Est. Screen Time | % of Episode | Register |
|------|-------|-------------------|--------------|----------|
| [MG:] | 27 | ~8:20 | ~46% | Analytical |
| [AI-GEN:] (single-shot) | 13 | ~4:14 | ~23% | Atmospheric / Grounding |
| [SCENE:] (chained) | 2 | ~0:56 | ~5% | Grounding |
| [ARCHIVAL:] | 3 | ~0:16 | ~2% | Documentary |
| [FORECAST:] | 1 | ~0:14 | ~1% | Analytical |
| TRANSITION | 4 | ~0:08 | ~2% | — |

Visual pipeline (v5.6, May 9, 2026): all stock footage eliminated. **Two AI-gen subtypes:**
- **[AI-GEN:] single-shot** (13 cells, was 17 in v5.4 → 15 in v5.5 → 13 in v5.6) — atmospheric punctuation moments at 5-8s. Existing ChatGPT-generated stills + Hailuo 02 image-to-video clips. Production-ready as of v5.4. (Decrement: 4 single-shot cells migrated into the two `[SCENE:]` blocks.)
- **[SCENE:] chained** (2 blocks, new in v5.5–v5.6) — Beat 3 opening "wrong-game-establish" (4 frames, ~30s) + Beat 4 close "cooperation-arc" (3 frames, ~26s). Total ~56s of chained morph runtime. Generated via ChatGPT (4-anchor reference uploads, sequential generation, morph-aware prompting per `project/CHAINED_STILL_LESSONS.md`) + Pika 2.5 (start+end-frame, 8-10s clips, stability-verb motion prompts). Beat 3 validated in the May 9 Scene C bakeoff. Beat 4 hero morph (alpine commons → ocean) is the editorially most important shot under the new pipeline. See `scenes/wrong-game-establish.md` and `scenes/cooperation-arc.md`.

Three documentary stills retained as [ARCHIVAL:] (Nash portrait, RAND building, Reagan-Gorbachev — all Wikimedia Commons, heavy editorial-LUT treatment for visual unification with the constructivist register). Net effect: four asset categories (MG + AI-GEN + SCENE + ARCHIVAL). Per-episode pacing budget honored: 2 `[SCENE:]` blocks against the max of 3, 1 per beat ✓.

**Cost:** ~$5-7 for the 13 single-shot Hailuo clips (already incurred) + ~$1-3 for the 5 Pika 2.5 morph clips across both `[SCENE:]` blocks (free tier should cover most; hero morph budgeted for 3-4 attempts).

**Pending v5.6 production work:**
1. Beat 3 Pair 2 (Frame B → C) regen with smoke fix per `scenes/wrong-game-establish.md`.
2. Beat 4 Frame B (aigen-12a alpine commons) generation per `scenes/cooperation-arc.md`.
3. Beat 4 Morph A → B (terraces → alpine) — single attempt likely sufficient.
4. Beat 4 Morph B → C (alpine → ocean, HERO) — 3-4 attempts, pick best.
5. Archival sourcing (Nash, RAND HQ, Reagan-Gorbachev) — Wikimedia Commons.
6. Showcase update: `PrisonersDilemmaShowcase.tsx` re-sequence to consume the two `[SCENE:]` block chains.
7. Re-render `prisoners-dilemma-full` against May-9 upgraded templates.

### Direction Summary
| Metric | Count |
|--------|-------|
| Segments with DIR: lines | 22/~48 total (~46%) |
| Total DIR: lines | ~55 |
| Narration sync points | 8 |
| Register transitions with explicit cut() | 4/4 |
| PACE: annotations | 7 (across 4 structural shifts) |

⚠️ Direction density is slightly above target (~25% segments recommended, we have ~46%). Consider trimming mood() on P3 ILLUST entries where Ken Burns motion provides sufficient visual energy.

### Remotion Compositions (generate via visual-spec)
| # | Template | Description | Data file | Mode |
|---|----------|-------------|-----------|------|
| 1 | GameBoard | Flood-Dresher scoreboard (60 amber / 14 grey) | gameboard-flood-dresher.json | [MG:] |
| 2 | KineticTypography | Nash quote "more rational" | inline | [MG:] |
| 3 | KineticTypography | "Every negotiation" stakes line | inline | [MG:] |
| 4 | FrameworkDiagram | Standard Frame — PD payoff matrix | framework-standard-frame.json | [MG:] |
| 5 | GameBoard | Single equilibrium dot — motif first appearance | gameboard-motif-beat1.json | [MG:] |
| 6a | ArcDiagram | PD citational lineage 1950-1983 (8 named figures) | arc-pd-lineage.json | [MG:] |
| 6b | DataChart | "2,000+ articles" punch (numeric coda) | chart-diffusion.json | [MG:] |
| 7 | GameBoard | PD matrix with nuclear icons | gameboard-nuclear.json | [MG:] |
| 8 | FrameworkDiagram | Narrowing conditions (assumptions as filters) | framework-narrowing.json | [MG:] |
| 9 | KineticTypography | "2,000+ articles. 14 applications." | inline | [MG:] |
| 10 | KineticTypography | Beat 2 checkpoint | inline | [MG:] |
| 11 | GameBoard | Self-confirming mechanism (trap animation) | gameboard-trap-mechanism.json | [MG:] |
| 12 | KineticTypography | "Prediction came true because you believed it" | inline | [MG:] |
| 13 | KineticTypography | "THE WRONG GAME" title card | inline | [MG:] |
| 14 | TimeSeriesChart | Black-Scholes volatility smile | chart-vol-smile.json | [MG:] |
| 15 | FrameworkDiagram | Motif multiplies — four cities | framework-motif-beat3.json | [MG:] |
| 16 | FrameworkDiagram | PD cycle vs. "different game?" | framework-cycle-vs-question.json | [MG:] |
| 17 | KineticTypography | "Wrong game makes wrong game real" | inline | [MG:] |
| 18 | KineticTypography | Beat 3 checkpoint | inline | [MG:] |
| 19 | GameBoard | Stag hunt — two equilibrium dots | gameboard-staghunt.json | [MG:] |
| 20 | SplitComposition | PD vs. stag hunt side-by-side (∴ divider) | split-pd-vs-staghunt.json | [MG:] |
| 21 | KineticTypography | "Iterated PD ≡ Stag Hunt" | inline | [MG:] |
| 22 | FrameworkDiagram | Old question → new question reframe | framework-reframe.json | [MG:] |
| 23 | ProportionalSymbolMap | Six named Ostrom commons — area ∝ years of operation | proportional-symbol-ostrom.json | [MG:] |
| 24 | FrameworkDiagram | Ostrom principles vs. PD assumptions | framework-ostrom-vs-pd.json | [MG:] |
| 25 | KineticTypography | "Cooperation isn't a miracle. It's designed." | inline | [MG:] |
| 26 | FrameworkDiagram | Motif — synchronized defection | framework-motif-beat5.json | [MG:] |
| 27 | FrameworkDiagram | FINAL MOTIF — second equilibrium appears | framework-motif-final.json | [MG:] |
| 28 | FrameworkDiagram | "What would change my mind" | framework-falsification.json | [MG:] |
| 29 | ProbabilityGauge (forecast variant) | US-China AI communiqué — 6-layer forecast | forecast-pd-cooperation.json | [FORECAST:] |
| 30 | KineticTypography | Watch signals (3 items) | inline | [MG:] |
| 31 | GameBoard | Callback to Beat 1 scoreboard | callback | [MG:] |
| 32 | GameBoard | Final choice — two dots | gameboard-final-choice.json | [MG:] |

### Archival Stills (Wikimedia Commons)
| # | Priority | Description | Source | Treatment | Beat |
|---|----------|-------------|--------|-----------|------|
| 1 | P2 | John Nash portrait photograph, 1950s | Wikimedia Commons | standard | Beat 1 |
| 2 | P2 | RAND Corporation headquarters exterior, Santa Monica, 1950s | Wikimedia Commons | standard | Beat 2 |
| 3 | P2 | Reagan-Gorbachev summit photograph (Reykjavik 1986 or INF Treaty signing 1987) | Wikimedia Commons | standard | Beat 5 |

### AI-Generated Video (Recraft→Pika 2.2, constructivist style)
| # | Priority | Mode | Prompt (abbreviated) | Style | Treatment | Beat | Duration | Pika Motion |
|---|----------|------|---------------------|-------|-----------|------|----------|-----------|
| 1 | P3 | scene | 1950s research office, two figures at table with paper grids, venetian blinds | vector_illustration | standard | 1 | 7s | push-in |
| 2 | P3 | scene | Aerial view: geometric building complex with national flags as color bars | vector_illustration | standard | 1 | 6s | drift down |
| 3 | P2 | metaphor | Propaganda poster: equation radiating sunbeams over silhouetted institutions | vector_illustration | standard | 1 | 7s | — |
| 4 | P2 | scene | Institutional corridor, figure walking past chalkboards with game matrices | vector_illustration | standard | 2 | 7s | push-in |
| 5 | P3 | metaphor | Doorway: dark interior opening onto bright amber exterior, triangular light beams | vector_illustration | standard | 2 | 3s | — |
| 6 | P2 | metaphor | Grid projected from spotlight onto landscape, landscape reshaping to match | vector_illustration | standard | 3 | 7s | — |
| 7 | P2 | scene | Negotiation room: two angular figures from opposite doors, geometric shadows | vector_illustration | standard | 3 | 7s | pull-back |
| 8 | P3 | metaphor | Stock exchange floor: angular traders, ticker tape ribbon, equation as sun | vector_illustration | standard | 3 | 4s | drift up |
| 9 | P3 | scene | Oil infrastructure: geometric refinery towers, pipeline, stylized smoke spirals | vector_illustration | standard | 3 | 6s | pan right |
| 10 | P2 | illustration | Sunrise: geometric rays through angular clouds, cooperative figures below | vector_illustration | standard | 4 | 7s | — |
| 11 | P3 | scene | Forest hunt: vertical tree columns, angular hunters converging on stag | vector_illustration | standard | 4 | 7s | push-in |
| 12 | P3 | scene | Terraced farmland: stepped hillside, irrigation channels, cooperative figures | vector_illustration | standard | 4 | 5s | tilt up |
| 13 | P3 | scene | Ocean vastness: repeating angular waves, no boundaries, tiny boat | vector_illustration | standard | 4 | 6s | zoom out |
| 14 | P3 | scene | City street: geometric pedestrians, angular building facades, amber glow | vector_illustration | standard | 5 | 4s | pan left |
| 15 | P3 | metaphor | Horizon: two landmasses separated by strait, glowing dots, contemplative | vector_illustration | standard | 5 | 4s | drift |
| 16 | P3 | scene | Lecture hall: student figures, chalkboard with game matrices, professor | vector_illustration | standard | 5 | 5s | push-in |
| 17 | P2 | illustration | Panorama: two cityscapes across game-matrix channel, mannequin figures | vector_illustration | conflict | 5 | 7s | — |

---

## PRODUCTION NOTES

**Total narration word count:** ~2,855 (v5.3 — unchanged from v5.2; production simplification is visual-only)
**Estimated runtime:** ~18:00 (with visual holds, transitions, and breathing room)
**Named concept appearances:** "The Wrong Game" — mechanism shown Beat 3 (illustrate-then-name), named explicitly mid-Beat 3, deployed Beat 5 ("the wrong game, blocking the language"), returned in "playing the wrong game makes the wrong game real." (4 mentions with accumulating meaning) ✅
**Cross-domain connections:** 3 developed (Flood-Dresher origin, Ostrom commons, Skyrms stag hunt) + 1 one-sentence (Black-Scholes) ✅
**Human moments:** Alchian & Williams cooperating (Beat 1), Nash's dismissive response (Beat 1), Ostrom's specific communities named (Beat 4), Reagan-Gorbachev reframe (Beat 5) — 4 human moments ✅
**Checkpoint beats:** End of Beat 2 (~7:00), end of Beat 3 (~11:00) ✅
**Decoder posture:** Sustained — "here's what I think is actually going on" not "let me explain" ✅
**Speculation:** [FORECAST:] at 30% probability (6-layer format) + watch signals (NPT, AISI, bilateral language) + explicit falsification criteria ✅
**Psychology audit (Lens 9) — v5.2 fixes applied:**
- Cold open 4-beat: PASS (schema → violation → narrowing → solvability in first ~100 words)
- [FRAMEWORK UNLOCK] marker: PASS (Beat 3 header, 7:30 — 18s past 40% of 18min; acceptable)
- [MAIN REVEAL] marker: PASS (Beat 4 header)
- Anxiety-to-inquiry conversion: PASS (Beat 3, before midpoint)
- Anger/anxiety framing: PASS ("not a conspiracy, a trap" throughout)
- Assertive calibration: PASS (30% probability, explicit disconfirmer, no Level 3 vague phrases)
- Bounded verdict close: PASS (all 4 elements: best current reading + confidence boundary + watchpoints + reflection trigger)
- Title confidence check: PASS ("wrong about almost everything" matches "wrong about most of what we apply it to")
- Target behavior: Subscribe (calm competence close)
**Toxin line:** "I'm not claiming" / "what would change my mind" / OPEC concession / Ostrom scaling caveat ✅
**Discovery shape:** Inversion. PD built as serious framework (Beats 1-2), broken at pivot (Beat 3 ~40%), alternative presented (Beat 4), stakes returned (Beat 5) ✅
**Three asset types:** Remotion MG (~46%), Recraft→Pika AI-GEN (~30%), Wikimedia ARCHIVAL (~2%) ✅
**Visual pipeline (v5.4):** All stock footage eliminated. Scene/metaphor visuals use Recraft→Pika 2.2 image-to-video (constructivist reference frame → animated clip). Three archival stills retained (Nash, RAND, Reagan-Gorbachev). Eliminates: stock footage sourcing pipeline. Cost: ~$5-7 for 17 AI-GEN clips.
**Register transitions:** ILLUST→MG (iris, origin:center), MG→ILLUST (dissolve), ARCHIVAL→MG (color-wash, ink) ✅
**Direction density:** ~55 DIR: lines across ~22 segments — slightly over target. Trim P2/P3 mood() directives on ILLUST entries where Ken Burns provides sufficient energy.

### Voice Notes for Narrator
- Beat 1 opening: measured pace, let the numbers land
- Beat 1 close ("your future"): direct address, stakes commitment
- Beat 2 COUNTERPOINT: slow narration, let visual carry — the narrowing is the argument
- Beat 3 "The Wrong Game" naming: a beat of silence before and after
- Beat 3 Black-Scholes: parenthetical energy, plant-and-move-on
- Beat 4 stag hunt introduction: slower than usual — this is the structural turn
- Beat 4 Ostrom map: visual-first, narration follows the image
- Beat 5 prediction: matter-of-fact, not dramatic — credibility comes from specificity
- Beat 5 close: quiet. No flourish. Let the two dots hold.

### Claim Verification Summary
| Tag | Count | Notes |
|-----|-------|-------|
| {✅} | 19 | Confirmed in research brief |
| {⚠️} | 3 | Black-Scholes parallel, Reagan-Gorbachev characterization, NPT RevCon timing |
| {NEW} | 2 | "Most major negotiations" framing, prediction phrasing |
