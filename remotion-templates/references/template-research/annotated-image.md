# AnnotatedImage — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (NYT Upshot photo annotation guidelines, Reuters AP photo caption conventions, The Economist map annotation style, Bloomberg satellite analysis graphics); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**Brand-treated image fills the frame; callout dots appear sequentially (dot → crosshair hairlines → elbow leader line draws → paper-stamp label fades in); maximum 6 callouts (the template `warnIf`s above this). Default dark-mode (atmospheric image register). Dot: 6px filled circle with lock-on pulse ring. Leader: 1.5px elbow line. Label: Plex Semi-bold with paper-background stamp and 0.6px oxblood border. Always attribute the image source.**

---

## 1. The form's editorial purpose

AnnotatedImage earns its rectangle when **a real image (satellite, archival, technical) contains specific visual features that are the evidence for the editorial argument, and those features need to be named for a viewer who cannot identify them unaided**. The viewer's takeaway should be: *"I can see what the analyst sees — that specific feature at that specific location in this real-world image is the point."* Use it when narration says "note the construction here," "this facility," "this port," "this face" — when pointing is the editorial act.

Differentiated from PhotoMontage (ambient visual texture, no specific annotation needed, image IS the atmosphere) and from ImageComposite (structured analytical layout where image is one panel among several data elements). AnnotatedImage says: "the image is the evidence; the callouts are the analysis."

### When not to reach for it

| Alternative | When it wins over AnnotatedImage |
|---|---|
| **PhotoMontage** | The image is atmospheric background texture, not evidence being analyzed. |
| **ImageComposite** | The image needs to be placed alongside charts, text, or other data — the composition is the analysis, not the image alone. |
| **AtlasPlate / MapGL** | The "image" is actually a geographic map — use the map templates, not AnnotatedImage. |
| **KineticTypography** | The analysis can be stated in words without the visual evidence — the image is illustrative, not evidentiary. |

**AnnotatedImage's superpower fires when:** the image is hard evidence (satellite imagery of a military installation, a chip die photo annotating etching layers, an archival photo identifying historical figures, aerial photography of a port showing construction activity) and the viewer cannot read the visual without guided annotation.

---

## 2. Canonical idioms

### a. NYT photo annotation

The New York Times's canonical callout style, most visible in conflict-zone analysis, archaeological site interpretations, and satellite imagery breakdowns. Key visual grammar: callout lines as thin hairlines (0.5px) extending from text labels to specific regions; a small filled dot (3–4px) at the terminus point; label in a white-background pill (no border); text in sans-serif at 11–13px. No arrowheads — the terminus dot is the pointer.

NYT's restrained approach: labels use sentence case, not all-caps; leader lines are straight, not elbowed. The editorial register is analytical but not militaristic.

*Works because:* the white pill on any image background (dark or light) is always legible — it's self-backgrounded. *The Parallax adaptation:* the template uses a paper-background stamp with an oxblood border instead of a white pill — more archival, more consistent with the briefing-document aesthetic.

### b. Reuters/AP photo caption annotation

Bolder callout style used in news agency wire images where multiple individuals in crowd photos need identification. Reuters style: bracket rather than hairline leader (a corner-bracket frames the identified person); label in bold sans-serif below the bracket; no dot terminus. The bracket creates an identification zone rather than a precise point.

Not directly applicable to Parallax's analytical use cases (which need precise point annotation, not zone identification) but relevant to know: the bracket approach is the journalistic standard for person-in-crowd identification, while the dot-and-leader approach is the analytical standard for feature-in-image identification.

### c. The Economist map annotation

Geographic feature labels with leader lines — same form as photo annotation but on a map substrate. The Economist's map callout style: thin lines (0.5px), mono-weight sans-serif in small caps, no pill background (labels sit directly on the map with a subtle text shadow). The leader line is straight, not elbowed.

For Parallax's map annotation needs, this convention is implemented in the `MapAnnotations` component and documented in `map-annotations.md`. `AnnotatedImage` is for non-map images; use `MapAnnotations` or `AtlasPlate.annotations` for geographic annotation.

### d. Bloomberg "chart within image" — satellite analysis

Bloomberg Graphics and Bloomberg Intelligence have developed a signature form for satellite and aerial photo analysis: an annotated satellite photo with production/activity data overlaid (circular markers scaled to production capacity, colored by output type, leader lines to labeled areas). Examples: semiconductor fab analysis from Maxar imagery, Russian military equipment tracking, Chinese military base construction.

Bloomberg's annotation grammar for satellite work: colored circles at feature locations (not dots — circles 8–20px depending on scale), thin leaders, label panels with key data (e.g., "Fab area: 1.2M sqm, Capacity: 40K wafers/month"). The annotation IS the analytical product; the underlying satellite image is the evidence substrate.

*Works because:* colored circles at different sizes encode two dimensions (location + magnitude) while the leader connects the circle to the specific feature it references. *Parallax adaptation:* circles with magnitude-encoding require a richer `Callout` type than the current 6px dot — this is an upgrade opportunity (see §6).

### e. Parallax use cases

**Satellite imagery analysis:** construction at a military installation (dots at specific structures, labeled "Missile storage," "Radar array," "Command bunker"). Always attribute the satellite imagery provider (Maxar, Planet, Sentinel-2).

**Military hardware identification:** archival or press photos of hardware with labeled components. "Hypersonic glide vehicle," "Terminal guidance seeker," "Booster separation ring."

**Urban conflict zone mapping:** aerial photography annotated with control lines, checkpoints, contested areas.

**Chip die photography:** semiconductor die photos from teardowns (Chipworks, TechInsights) annotated with core blocks ("GPU cluster," "HBM interface," "PCIe controller"). The `"chip"` icon in IsotypeChart serves the counting argument; AnnotatedImage serves the anatomical argument.

---

## 3. General principles

The annotated image form lives at the intersection of journalism and intelligence analysis. Its editorial register is the declassified briefing — "here is real imagery; here is what our analysis identifies." Every design choice should reinforce this register, not undermine it.

**Callout count discipline:** the template's `warnIf` at >6 callouts is enforced for a reason. Above 6 callouts on a single image, leader lines cross each other (the most common visual failure), labels compete for spatial territory, and the viewer's eye cannot follow the sequential revelation — the composition becomes noise rather than analysis. Six is the editorial maximum; three to four is the ideal range. If more than six features need annotation, split into two sequential compositions and use the narration to bridge them.

**Sequential revelation vs. simultaneous display:** the pop-in stagger (one callout every 1.2 seconds) is the editorial key. Each callout arrives as the narrator names it. The composition is not a static diagram to be read at the viewer's pace — it is a directed disclosure sequence. This is the form's video adaptation of the "pointing" act.

**Leader line geometry:** the template uses an elbow leader (right-angle bend at 60% of the leader's length) rather than a straight diagonal. This is the intelligence-dossier convention — straight diagonals look like CAD drawings; elbowed lines look like briefing annotations. The elbow also reduces the probability of leader lines crossing when multiple callouts are placed on the same image.

**Image treatment and annotation:** the image must pass through the full brand treatment pipeline (desaturate → duotone → grain → composite) BEFORE annotation. The annotation layer sits on top of the treated image. This is enforced by the template's use of `<BrandImage>` + `<KenBurns>` before the SVG callout overlay. The duotone treatment darkens and mutes the image so annotation labels and leader lines are legible without additional background dimming.

**Placement discipline:** place callout dots at the actual feature location, not near it. If the satellite imagery is annotating a radar dome, the dot belongs at the center of the dome, not vaguely "near" it. Precise placement is the form's credibility foundation.

---

## 4. Recommendation for Parallax

**Default mode:** `backgroundVariant: "dark"` — the dark duotone treatment creates the atmospheric, analytical-intelligence register. Light mode is available for archival/editorial photography contexts but `"dark"` is the default for satellite and technical imagery.

**Duotone ramp:**
- `"standard"` (amber): neutral analytical content — chip dies, historical facilities, non-adversarial subjects.
- `"conflict"` (rust): adversarial imagery — military installations, Chinese military hardware, Russian equipment. The rust duotone tints toward the `semantic.china` color register.
- `"editorial"` (bone): archival press photography, historical figures, light-register documentary content.

**Callout construction:**
- Maximum 6 callouts per composition.
- Dot at the precise feature location (x/y as percentage of image dimensions, 0–100).
- `placement` (top/bottom/left/right) should be chosen to avoid label overlap with adjacent callouts and with the TitleBlock at the top of frame.
- `color`: default `emphasis.primaryAccent` (amber/gold). For conflict-register images, use `semantic.china` (rust) for enemy-actor features.
- `label`: IBM Plex Sans semibold at `label` size (18px) — short noun phrase, not a sentence. "Radar array" not "This is the radar array."
- `detail`: optional IBM Plex Sans at `caption` size (14px), muted color. Use for technical specs: "Estimated range: 1,200km" or "Capacity: 2 brigades."

**Attribution:** `source` is mandatory and carries extra editorial weight for imagery — always name the imagery provider (Maxar, Planet, Sentinel-2, Reuters, AP, CSIS imagery report). For satellite imagery, include the acquisition date if possible: "Maxar Technologies / CSIS, Oct 2024."

**Duration:** `durationSec: 8–12` for 3–4 callouts. `12–16` for 5–6 callouts. The 1.2s callout stagger means 6 callouts need 7.2s of callout time after the 1.5s image reveal. Add 1s for the title to settle and 1.5s for the exit.

**Navigation:**
- Lead with the most important callout (the one the narration names first) at index 0. The first callout starts after the image reveal + 0.3s; subsequent callouts follow at 1.2s intervals.
- Narration timing should be Whisper-resolved against `direction.syncPoints[]` — each callout's reveal should anticipate the narrator's naming of it by 5 frames (POLISH D17).

---

## 5. Current template alignment

- ✅ `<BrandImage>` with `ramp`, `composite: "background"` — full brand treatment pipeline applied
- ✅ `<KenBurns direction="drift" intensity={2}>` — subtle drift on image (atmospheric) while callouts are analytical overlays
- ✅ Callout animation sequence: dot scale-in (0→6px) + lock-on pulse ring → crosshair hairlines extend → elbow leader draws (two-leg reveal) → paper-stamp label fades in — correct sequential revelation
- ✅ Elbow leader line (right-angle bend at 60% of leader length, two-leg reveal) — intelligence-dossier convention
- ✅ Paper-stamp label backing: `palette.paper` fill + 0.6px `palette.oxblood` border + `rx: 2` rounded corners — archival briefing register
- ✅ `warnIf` at >6 callouts with redirect to PhotoMontage — critical legibility guard
- ✅ `emphasis.primaryAccent` for default callout color — episode emphasis consumed
- ✅ `duotoneRamp` field routes to `"standard"`, `"conflict"`, or `"editorial"` via `<BrandImage ramp={ramp}>`
- ✅ `<TitleBlock>` positioned with slide-in entrance and synchronized to `direction.syncPoints` — POLISH D17 anticipatory reveal
- ✅ `useCompositionAnimation` with `direction.driftOptions` — composition-level Ken Burns separate from image-level Ken Burns (no compounding)
- ✅ `<HeaderStrip>`, `<FooterStrip>` brand chrome correct
- ⚠️ Leader line length is hardcoded to `LEADER_LENGTH = 60px` (the elbow point is at 60% × 60 = 36px horizontal, then 24px further). Long labels extend beyond the leader's endpoint and may collide with image edges for right-edge callouts or bottom-edge callouts. No dynamic leader length based on available canvas space.
- ⚠️ Paper-stamp label width is estimated from character count (`charWidth = fontSizes.label * 0.55`) — this is an approximation that breaks for narrow characters (I, l, 1) and wide characters (W, M, %). Labels with mostly narrow or mostly wide characters will have a mismatched stamp size.
- ⚠️ Label font is `fonts.heading` (IBM Plex Sans) per the source code, but the dossier spec (§4) states Plex Mono for analytical contexts. These should be aligned: callout labels on satellite/military imagery should use `fonts.metadata` (Plex Mono) for the intelligence-briefing register; photographic portrait annotations can use `fonts.heading`.
- ❌ No `backgroundVariant` propagation to `TitleBlock` — `TitleBlock` receives `mode={data.backgroundVariant || "dark"}` correctly, but `FooterStrip` and `HeaderStrip` always receive the same mode string. If `backgroundVariant` is changed to `"light"`, the brand chrome switches correctly, but the image treatment remains dark-ramp by default (separate from `backgroundVariant`).
- ❌ No leader-line collision detection — when two callouts are placed near each other (< 80px apart), their leader lines can cross. No automatic path-routing to avoid crossings.
- ❌ No animation synchronization to `direction.syncPoints[]` at the individual callout level — the callout stagger is purely time-based (1.2s intervals from `calloutsStart`). Whisper-resolved cue synchronization would allow each callout to anticipate the narrator's naming of it.

---

## 6. Specific upgrades proposed

1. **Per-callout `syncPoint` from `direction.syncPoints[]`.** Add `Callout.syncFrame?: number` (or a label-matching mechanism) so each callout's reveal anticipates the narrator's naming of it by 5 frames via `anticipatoryStartFrame()`. This implements POLISH D17 for individual annotation reveals, not just the composition title. Effort: medium (requires Whisper-resolved cue matching in visual-spec); impact: high — the reveal landing before the narrator says the feature name is the editorial beat that makes annotations feel intentional. **(medium effort / high impact)**

2. **Dynamic `LEADER_LENGTH` based on placement and canvas position.** For callouts near the image edge, increase `LEADER_LENGTH` so the label clears the edge. For callouts near other callouts, decrease it so labels don't overlap. Requires computing a per-callout leader length based on (a) edge proximity and (b) other callout positions. Effort: medium; impact: eliminates the most common callout layout failure (label runs off canvas or overlides adjacent label). **(medium effort / high impact)**

3. **`fonts.mono` for callout labels in analytical register.** Switch the callout label `fontFamily` from `fonts.heading` (Plex Sans) to `fonts.metadata` (Plex Mono) for the `"standard"` and `"conflict"` duotone ramps. The mono font matches the intelligence-briefing register. Keep `fonts.heading` for `"editorial"` ramp (archival press photography). Effort: trivial; impact: corrects a register inconsistency. **(trivial effort / medium impact)**

4. **Magnitude circle variant.** Add optional `Callout.magnitude?: number` (1–5) that renders a circle (not a dot) at the callout location, with radius scaled to magnitude, as in Bloomberg's satellite analysis grammar. When `magnitude` is present, the dot is replaced by a filled circle (radius = `magnitude × 4px`), and the leader extends from the circle's edge rather than its center. Effort: small; impact: enables the Bloomberg satellite-analysis idiom for production capacity or military-strength arguments. **(low effort / medium impact)**

5. **Leader-line crossing detection with simple avoidance.** For each callout pair, compute whether their leader lines cross. If they do, apply a simple offset: push the shorter leader's endpoint up or down by 16px to avoid the crossing. This is not full path-routing (which is computationally complex) but handles the most common collision case (two adjacent dots with leaders extending in the same direction). Effort: medium; impact: reduces the #1 visual failure mode above 4 callouts. **(medium effort / high impact)**

---

## 7. Failure mode flags (always catch in audit)

- **>6 callouts** — the template warns; audit must enforce. Above 6, leader lines cross, labels compete for space, and the directed revelation sequence is incoherent. Split into two compositions or demote to PhotoMontage.
- **Callout dot not at the feature** — the dot must point to the actual feature (the dome, the vehicle, the face), not to a vague region. Audit the x/y coordinates against the image content. A callout that says "Missile storage" pointing to open ground is an editorial error.
- **Missing image `source`** — satellite imagery in particular requires provenance: Maxar, Planet, Sentinel-2, CSIS imagery, Reuters wire photo. Include the acquisition date when known. No `source` = no credibility anchor for the evidence.
- **Wrong duotone ramp for content** — `"standard"` (amber) for Chinese military installations fights the `semantic.china` (rust) register established in other templates. Use `"conflict"` (rust) for adversarial content; the duotone treatment signals the editorial framing before the viewer reads a label.
- **Leader lines crossing** — two callouts placed on the same side of the image with similar angles will produce crossing leaders. Reorder callouts by placement side (left-side callouts together, right-side callouts together) or alternate top/bottom/left/right to avoid crossings.
- **Callout stagger too fast** — if `calloutStagger` is reduced from 1.2s, callouts arrive before the narrator can name them. The 1.2s gap is the minimum for the narrator to say a 3–5 word label and pause. For complex technical features that need 10+ words of narration, extend the stagger by adjusting `_direction.paceTimingScale` upward.
- **Light mode for satellite/military imagery** — `backgroundVariant: "light"` applies the `"editorial"` duotone ramp and light-mode label colors. For satellite and military imagery, the dark mode + `"standard"` or `"conflict"` ramp is the correct register. Light mode is for archival press photography and historical portraits.
- **Unannotated "atmospheric" use** — if an episode uses AnnotatedImage with 0–1 callouts just for the image treatment, use PhotoMontage instead. AnnotatedImage's sequential callout revelation sequence is designed for analytical disclosure; PhotoMontage is designed for atmospheric ambient imagery. The template overhead is the same; the editorial register is different.
- **Image bleed into safe area** — the image is full-bleed by design (fills `layout.width × layout.height`). The TitleBlock and callout labels must respect the 80px safe area. If callouts are placed at x < 8% or x > 92% (approximately), their labels may overlap the safe area boundary.

Last updated: May 15, 2026
