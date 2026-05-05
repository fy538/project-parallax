# Parallax — Constructivist Aesthetic Versatility Tests

> Created: May 4, 2026
> Companion to AESTHETIC_EXPERIMENTS.md (the original 6-direction test that picked constructivist) and PROMPTS.md (the canonical 7-image library).
> Purpose: probe the edges of the constructivist aesthetic to learn where it sings, where it strains, and where it breaks.

## Why these tests exist

The flat cleanroom reference (image 4 from the May 4 generations) validated that constructivist works for monumentalist industrial. The Beijing apartment v1 attempt revealed that the aesthetic at intimate domestic scale needs the tightened figure spec to land. Both data points came from a narrow band of subject matter.

Before EP01 production commits to constructivist for every grounded scene the channel will ever produce, we need to know its real range. These tests probe specific failure modes and edge cases:

- Does the aesthetic hold for *all four* typography traditions (Russian, Chinese, English Modernist, Japanese Showa) at production quality?
- Does it work for *all three* realism dosages (flat, balanced, grounded) across different scenes?
- Does it survive *dynamic poses* (action, motion, crowd) where the planar face has to track through movement?
- Does it work for *contemporary tech aesthetic* without an obvious historical referent (the hardest test — Silicon Valley startup office, modern subway, contemporary corporate)?
- Does it work for *non-figurative content* (pure landscape, architectural overview)?
- Does the May 4 v2 spec actually fix the Beijing apartment failure?

Each test is a paste-ready ChatGPT prompt. Generate, review, note what worked and what failed. Failures are diagnostic — they tell us where the spec needs tightening or where the aesthetic has hard limits.

## How to use this file

1. Pick a test that probes a question you care about (typography range, edge cases, etc.).
2. Copy the entire prompt block (preamble + scene + negatives) into ChatGPT.
3. Generate at 16:9 aspect ratio.
4. Compare output against the "what to look for" notes for that test.
5. Iterate the prompt if the output failed in a known failure mode (face slid toward realism, palette drifted, typography gibberish).
6. Note successful tests in this file as additions to the canonical library candidates.

ChatGPT (DALL-E 3 / GPT Image 2) follows positive vocabulary much better than negatives. The prompts below are heavily positive-loaded; the short negative blocks at the end target the most predictable failure modes only.

---

## Test 1: Russian Constructivist typography (Soviet 1972)

**What this probes:** Whether `text_treatment: russian_constructivist` actually produces parseable Russian propaganda typography integrated into a monumentalist industrial scene. This is the typography test the channel hasn't validated yet.

**Why it matters:** The contextual-by-episode typography move is core to the channel's analytical posture. If Russian renders as gibberish, the move fails for any Soviet-bloc episode and we need to fall back to minimal or none.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Soviet
constructivism meets German political photomontage meets industrial
woodcut tradition — drawing on Alexander Rodchenko, El Lissitzky,
John Heartfield, and Frans Masereel. Bold compositional confidence,
color-blocked forms with no soft shading or gradients. Restricted
warm palette: deep ink (#1C1814), walnut (#5C4A3D), umber (#8B7355),
burnt amber and gold (#C4A747), rust (#A64D46), and bone (#F0E6D0)
on paper (#F5F0E8) background. No other colors.

Interior of a 1972 Soviet rocket assembly plant, monumentalist scale.
Three workers in dark blue overalls and round protective goggles
operating machinery alongside a partially-assembled rocket fuselage.
Faces composed of 4-5 distinct color-blocked planes (jaw plane,
cheekbone plane, brow plane, lit plane, neck plane), no continuous
skin tonality, no rendered facial features. Eyes obscured by goggle
shadow. Hands flat color planes. Bold Russian Constructivist
typography integrated diagonally with the architecture: 'ЭНЕРГИЯ ·
ПРОГРЕСС' (Energy · Progress) in red and black block letters with
diagonal compositional axis, 'ПЯТИЛЕТКА' (Five-Year Plan) in stacked
vertical column, '1972' as monumental design element. Maximum graphic
flatness, all surfaces suggested through palette planes. Mood:
civilizational stakes, technological ambition, propaganda-poster
weight. Realism: flat. 16:9 aspect ratio.

Avoid: photorealistic rendering, smooth featureless mannequin faces,
continuous skin tonality, rendered facial features, mock-Cyrillic
gibberish that doesn't parse, cool corporate blue, Adobe stock
aesthetic. Cyrillic must be real Russian.
```

**What to look for:**
- Does the Russian text actually parse? (ЭНЕРГИЯ should be readable as "ENERGIA"; ПРОГРЕСС as "PROGRESS"; ПЯТИЛЕТКА as "PYATILETKA")
- Does the diagonal compositional axis land? (Soviet Constructivist signature)
- Are the figures fully planar, or did realism leak in?
- Does the palette stay restricted to the brand range?

**If it fails:** Drop to `text_treatment: chinese_minimal`-equivalent for Russian (we don't have a russian_minimal yet — could add one) or to `none`. Generate again and validate that the visual aesthetic alone holds without the typography.

---

## Test 2: Beijing apartment v2 (the validating re-test)

**What this probes:** Whether the May 4 tightened spec actually fixes the v1 Beijing apartment failure. The v1 generation showed a face that tried for realism within constructivist palette constraints — visible nose contour, slight skin tonality, jawline reading as anatomically real. This was the uncanny valley sideways. The v2 spec specifies 4-5 distinct color-blocked planes and explicitly forbids continuous skin tonality.

**Why it matters:** This is the canonical intimate-domestic test case. If v2 lands, the constructivist aesthetic is validated for conversational human scale and the Beijing reference can join the canonical library. If v2 fails, the spec needs another tightening pass.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style — Soviet
constructivism meets German political photomontage, drawing on
Rodchenko's 1924 photomontage portraits and El Lissitzky's 1924
Self-Portrait. Bold compositional confidence, color-blocked forms
with no soft shading or gradients. Restricted warm palette: deep
ink (#1C1814), walnut (#5C4A3D), umber (#8B7355), burnt amber and
gold (#C4A747), rust (#A64D46), bone (#F0E6D0) on paper (#F5F0E8)
background.

Eye-level intimate scene in a 1980s Beijing apartment. A figure in
a dark wool suit and round eyeglasses seated at a small wooden
writing desk, reading a document under the warm amber light of an
Anglepoise-style desk lamp. THE FACE IS COMPOSED OF 4-5 DISTINCT
COLOR-BLOCKED PLANES — jaw plane in deep ink, cheekbone plane in
walnut, brow plane in shadow, lit plane in amber, neck plane in
walnut. No continuous skin tonality, no realistic features, no
rendered nose contour. Eyes are pure shadow within round lens
shapes. Hair is a single color-blocked dark shape. Hands on the
desk are flat color planes — palm, fingers as simple geometric
shapes, no individual finger detail. Traditional Chinese-style
teacup with botanical motif. Books stacked nearby. Window showing
dark Beijing rooftop silhouettes as flat ink shapes. Wall calendar
with subtle Chinese signage ('北京日报', '一九八四年三月'). The
environment can have material texture (paper grain, warm light
gradient on the desk) but the figure must be pure constructivist
color-blocking. Restrained scale, contemplative composition. NOT
propaganda-poster monumentalist — this is the constructivist
tradition at intimate scale, but the FIGURE is fully committed to
graphic flatness. 16:9 aspect ratio.

Avoid: photorealistic facial features, continuous skin tonality,
rendered nose, visible mouth, individual finger detail, soft shading
on the figure. The figure must be as graphically committed as
Rodchenko's 1924 portrait photomontages.
```

**What to look for:**
- Face: are there 4-5 visible color-blocked planes? Or did the AI default to continuous skin?
- Eyes: are they pure shadow shapes inside the round lens? Or did rendered eye structure leak?
- Hands: flat color planes, or individual finger detail?
- Environment: paper grain, warm light gradient, period detail (teacup, calendar) — should feel naturalistic
- Chinese text: parseable? Tiger to verify

**If it fails the same way v1 did:** the prompt isn't being tightened enough for ChatGPT specifically (GPT Image 2 has a known concave-face issue and hedges toward realism). Try generating in Recraft V3 instead via `recraft.py --register grounding --realism balanced --text-treatment chinese_minimal`. Recraft's vector_illustration style holds graphic commitment more reliably than DALL-E 3's image generator.

---

## Test 3: War Room (conflict treatment + multi-figure)

**What this probes:** Whether the conflict LUT works with constructivist + how multi-figure group dynamics hold under the planar face standard. The earlier audits worried about whether the aesthetic can handle 3+ figures interacting (looking at each other, gesturing in coordination).

**Why it matters:** Geopolitics content includes lots of multi-figure scenes (negotiations, briefings, command rooms). If the aesthetic strains at multi-figure, half the channel's content has a problem.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style.
Drawing on Rodchenko, Heartfield, and Frans Masereel. Bold
compositional confidence, color-blocked forms with no soft shading
or gradients. Restricted palette: deep ink (#1C1814), oxblood
(#7A2E1A), rust (#A64D46), walnut (#5C4A3D), bone (#F0E6D0) on
paper (#F5F0E8). NOTE: this scene uses the conflict treatment ramp,
so palette skews toward ink/oxblood/rust rather than amber/gold.

Interior of a contemporary military strategic operations room, dark
and tense. Five figures in tactical uniforms gathered around a
central display table — two seated examining maps, two standing in
discussion, one pointing at a screen on the back wall. Faces
composed of 4-5 distinct color-blocked planes — jaw, cheekbone,
brow, lit plane, neck — with no continuous skin tonality, no
rendered facial features. Eyes obscured by helmet brim shadow or
hat brim shadow. Hands as flat color planes pointing or holding
documents. Multiple display screens in background showing radar,
maps, and stylized data graphics — rendered as flat ink-and-rust
panels. Composition shows clear group dynamic: lines of attention
between figures (one looks at another; another looks at the screen)
without rendering individual faces. Heavy contrast: deep ink shadows
across most of the room, isolated rust/oxblood pools of light from
displays. No typography or minimal English equipment labels only.
Mood: tension, contained adversarial weight. Realism: balanced
(figures stay flat, environment has subtle material texture on
equipment). 16:9 aspect ratio.

Avoid: photorealistic faces, continuous skin tonality, rendered
features, cool corporate blue (this is conflict treatment — palette
must skew warm-rust, not cool-cyan), Adobe stock aesthetic.
```

**What to look for:**
- Group dynamic: does the composition convey 5 figures interacting with each other? Or do they look like separate posed figures?
- Faces: do all 5 figures hold the planar standard, or did some drift toward realism?
- Conflict palette: is it warm-rust + ink (correct), or cool-cyan + blue (wrong — that's military-trope photoreal)?
- Lines of attention: can you read who's looking at whom?

**If it fails on group dynamic:** the planar face convention may strain when faces need to interact directionally. Fall back to fewer figures or use staggered framing where only 1-2 faces are clearly visible at a time.

---

## Test 4: Modern Silicon Valley startup office (the hardest edge case)

**What this probes:** Whether constructivist works for *contemporary tech aesthetic without an obvious historical referent*. The constructivist tradition is rooted in 1920s political/industrial illustration; applying it to a 2026 Silicon Valley startup office tests whether the aesthetic is *editorially appropriate* (not just visually possible) for content the channel will frequently cover.

**Why it matters:** Parallax covers contemporary US tech extensively. If the aesthetic feels forced on modern American tech scenes, the channel needs an alternative grounded register for that content.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, Frans Masereel, and the American
midcentury industrial-modernism tradition (Push Pin Studios,
Saul Bass, Fortune magazine). Bold compositional confidence,
color-blocked forms with no soft shading or gradients. Restricted
warm palette: deep ink, walnut, umber, burnt amber and gold, rust,
bone on paper background. No other colors.

Interior of a 2026 Silicon Valley AI startup office at dusk. Four
figures in casual professional attire (button-down shirts, hoodies,
laptops) gathered around a whiteboard covered in technical diagrams.
Faces composed of 4-5 color-blocked planes, eyes obscured by hair
fall or laptop screen reflection, hands as flat color planes
holding laptops or pointing at the whiteboard. The whiteboard shows
flat constructivist diagrams — boxes, arrows, simplified network
nodes — not realistic handwriting. Floor-to-ceiling windows showing
the bay outside as flat ink-and-amber silhouettes. Standing desks,
ergonomic chairs, scattered laptops, coffee cups — all rendered as
color-blocked geometric forms, no photographic detail. American
midcentury modernist typography on the wall: 'BUILD · ITERATE ·
SCALE' in geometric sans-serif Avant Garde block lettering, bold
amber and rust accents. Mood: contemporary technological ambition
filtered through constructivist gravity. Realism: balanced (figures
flat, environment has selective material texture on the windows and
whiteboard surface). 16:9 aspect ratio.

Avoid: photorealistic faces, Adobe stock startup aesthetic
(which is what most Silicon Valley imagery defaults to — actively
avoid this), cool blue tech-startup palette, smooth featureless
mannequin faces, gradient-heavy lighting, isometric perspective.
```

**What to look for:**
- Does the contemporary subject feel forced or natural in the constructivist vocabulary?
- Does the American Modernist typography land as period-appropriate, or does it look anachronistic?
- Can you read this as "Silicon Valley 2026" or does it look like 1958 Detroit?
- Does the ambition-mood translate, or does the constructivist gravity make it feel ironic?

**If the scene feels forced:** we may need a sub-register for contemporary American tech that pulls more from Push Pin / Bass directly without the Soviet weight. The American Modernist tradition has its own constructivist DNA but lighter than Rodchenko/Heartfield. If many tests fail this way, document a `english_modernist_lighter` typography variant or a sub-mode.

---

## Test 5: 1942 Tokyo Imperial Naval Office (Japanese Showa typography)

**What this probes:** Whether `text_treatment: japanese_showa` produces parseable Japanese kanji typography integrated correctly. Vertical orientation, period-appropriate phrases, Showa-era propaganda style.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, Masereel, and Japanese Showa-era graphic
design (1930s-40s). Bold compositional confidence, color-blocked
forms with no soft shading or gradients. Restricted palette: deep
ink (#1C1814), oxblood (#7A2E1A), bone (#F0E6D0) — note the Showa-
era palette skews more black/red/cream than the standard warm umber.

Interior of an Imperial Japanese Naval office, Tokyo, 1942. A
figure in formal naval uniform seated at a heavy wooden desk
examining maps and reports. Three additional figures in uniform
standing in conference behind. Faces composed of 4-5 color-blocked
planes, eyes obscured by hat brim shadow or downturned head
reading. Wood-paneled walls with traditional Japanese architectural
elements (shoji screen panels, wood beams). Maps spread across the
desk. A framed naval ensign on the back wall. Vertical Japanese
Showa-era propaganda typography integrated at frame edges: '技術 ·
産業 · 国家' (Technology · Industry · Nation) in bold black kanji
arranged vertically right-to-left, '進歩' (Progress) as a single
monumental kanji on the left edge. Period-natural integration of
imperial era iconography (rising sun motif on a flag in background,
geometric and stylized). Slightly desaturated palette suggesting
Kodachrome-era film. Mood: imperial gravity, historical weight.
Realism: grounded (constructivist figures, photographic spatial
detail in the environment). 16:9 aspect ratio.

Avoid: anime-style cartoon, photorealistic faces, mock-Japanese
characters that don't parse, contemporary Japanese aesthetic.
Kanji must be real Japanese.
```

**What to look for:**
- Do the kanji parse? (技術 = "technology"; 産業 = "industry"; 国家 = "nation"; 進歩 = "progress")
- Vertical orientation rendered correctly (right-to-left, top-to-bottom)?
- Period-appropriate (1942 imperial era, not contemporary Japan)?
- Constructivist figures + slightly more environment realism (this tests `realism: grounded`)

**If kanji are gibberish:** fall back to `text_treatment: none` for Japanese-coded scenes until we have a verified phrase library or native-speaker review.

---

## Test 6: Pre-revolutionary Shanghai scholar's study (1923, chinese_traditional)

**What this probes:** Whether `text_treatment: chinese_traditional` produces parseable brush-calligraphy / classical Chinese. Vertical orientation, traditional characters, restrained scale.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, and Chinese pre-revolutionary scholarly
illustration tradition. Bold compositional confidence, color-blocked
forms with no soft shading or gradients. Restricted warm palette:
deep ink (#1C1814), walnut (#5C4A3D), umber (#8B7355), bone
(#F0E6D0) on paper (#F5F0E8). Reduced color range for the classical
mode (less amber/rust, more ink/walnut/bone).

Eye-level intimate scene in a 1923 Shanghai scholar's study. A
figure in traditional changshan robe seated at a low wooden desk,
brush in hand, pausing in the middle of writing on a long scroll.
Face composed of 4-5 color-blocked planes — jaw, cheekbone, brow,
lit plane, neck — with eyes obscured by lowered head reading.
Round wire-rimmed eyeglasses on the brow. Long sleeves of the
robe rendered as flat color planes. Hands holding the brush as
simple geometric shapes. Wooden desk with stacked books and a
small inkstone. Behind the figure, a hanging scroll with vertical
calligraphy in Traditional Chinese characters — '靜' (Stillness)
or '學而時習之' (To study and practice in due time, classical
Confucian phrase) in bold brush-calligraphy style, ink on bone
background, real classical Chinese. Window showing Shanghai
rooftops at dusk as flat ink silhouettes. Mood: contemplative,
scholarly gravity, pre-revolutionary intellectual tradition.
Realism: balanced (flat figure, environment has subtle paper grain
on books and scroll). 16:9 aspect ratio.

Avoid: photorealistic facial features, continuous skin tonality,
contemporary Chinese aesthetic (this is 1923, not 2026), mock
Chinese characters. Calligraphy must be real Traditional Chinese.
```

**What to look for:**
- Brush-calligraphy character of the typography (vertical, classical, real)
- Period accuracy (1923 changshan, traditional desk, scroll on wall)
- Constructivist figure + period-appropriate environment
- Different palette weighting (less amber/rust, more ink/walnut/bone — does this feel right for classical mode?)

---

## Test 7: Crowd / public rally scene (scale + many figures)

**What this probes:** Whether the planar face standard scales — does the aesthetic hold for 50+ figures, or does the AI default to mush at crowd scale?

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, and Frans Masereel's industrial-crowd
woodcuts. Bold compositional confidence, color-blocked forms with no
soft shading or gradients. Restricted warm palette: deep ink, walnut,
umber, burnt amber and gold, rust, bone on paper background.

A crowd scene at a 1955 industrial worker's rally in a public
square. Approximately 80-100 figures densely packed, viewed from a
slightly elevated three-quarter angle. The composition shows
diagonal massing: figures in foreground at clear individual scale,
figures in middle distance at silhouette scale, figures in
background as bone-and-ink color blocks suggesting density. Each
foreground figure has constructivist planar face (4-5 color-blocked
planes), eyes obscured by hat brim shadow or hair fall. Figures hold
banners and signs with bold sans-serif slogans (in any of the
typographic traditions — pick whichever fits). Industrial backdrop
of factories, smokestacks, and tall geometric architectural forms
on the horizon. Heavy compositional confidence, monumentalist scale,
diagonal axis. Mood: collective ambition, industrial mobilization,
historical weight. Realism: flat (everything color-blocked at this
scale; texture would muddy the composition). 16:9 aspect ratio.

Avoid: photorealistic faces (any of the foreground figures should
NOT have realistic skin tonality), Adobe stock crowd photography
aesthetic, smooth featureless mannequin faces, individual face
detail at distance (mid-distance and background figures should
read as silhouettes, not detailed people).
```

**What to look for:**
- Do foreground figures hold the planar standard, or did the AI default to realistic-leaning faces because of crowd context?
- Does the layered scale (foreground / mid / background) read clearly?
- Does the composition feel like a *constructed* crowd composition (Heartfield-style) or a stock photo of a rally?
- Does the monumentalist scale carry editorial weight?

---

## Test 8: Pure landscape / no figures (atmospheric backdrop usage)

**What this probes:** Whether the aesthetic works for non-figurative content. Atmospheric backdrops in Register 2 sometimes need pure landscape — a coastline, a mountain pass, a desert — without figures.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, Masereel, and Russian landscape woodcut
tradition. Bold compositional confidence, color-blocked forms with
no soft shading or gradients. Restricted warm palette: deep ink,
walnut, umber, burnt amber and gold, rust, bone on paper background.

A monumentalist landscape view of a coastal industrial port at
dawn — long horizontal composition. Massive container ships in the
foreground rendered as flat geometric silhouettes (ink and walnut),
loading cranes as angular constructivist forms in mid-distance,
distant mountains as flat amber-and-bone shapes on the horizon.
Sunlight breaking through morning haze rendered as bold geometric
rays of warm amber. Sea surface as flat ink-and-walnut bands
suggesting depth without realistic texture. No human figures
visible at this scale. The composition reads as monumentalist
landscape, propaganda-poster grandeur, civilizational reach. Mood:
industrial scale, dawn ambition, the world as built infrastructure.
Realism: flat (landscape composition needs maximum graphic
flatness; texture would weaken the monumentalist read). Used as
30-40% opacity background under narration about supply chain or
trade flows. 16:9 aspect ratio.

Avoid: photorealistic landscape rendering, Bob Ross painterly style,
Adobe stock aerial photography aesthetic, gradient skies, realistic
ocean texture.
```

**What to look for:**
- Does pure landscape work in constructivist, or does it feel empty without figures?
- Does the monumentalist scale translate to non-figurative content?
- Are the geometric forms (ships, cranes, mountains) clearly rendered, or did they drift toward realism?
- Atmospheric backdrop usage at low opacity — would this work as wallpaper?

---

## Test 9: Action / motion scene (industrial protest, dynamic poses)

**What this probes:** Whether the planar face survives dynamic poses. Static figures (sitting at desk, standing in cleanroom) have been validated; running, climbing, gesturing dramatically in motion has not.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, and Mexican muralist tradition (Diego
Rivera, José Clemente Orozco — both adjacent to the constructivist
graphic mode). Bold compositional confidence, color-blocked forms
with no soft shading or gradients. Restricted warm palette: deep
ink (#1C1814), oxblood (#7A2E1A), rust (#A64D46), walnut (#5C4A3D),
bone (#F0E6D0). Conflict treatment palette skews ink/oxblood/rust.

A 1937 industrial strike scene at a factory gate. Eight to ten
figures in worker's clothing in dynamic action poses — one with
arm raised holding a banner, one striding forward with fist
clenched, one turning to shout, one gesturing toward the factory
behind. Each figure has constructivist planar face (4-5 color-
blocked planes), eyes obscured by cap brim shadow or hair
movement. Bodies and clothing in dynamic but graphically clear
poses — the AI must render motion as locked-pose color blocks,
not blurred photographic motion. Industrial gate and factory
buildings behind as flat ink silhouettes. Banners with bold sans-
serif slogans (in any typographic tradition matching the scene's
geography). Composition uses diagonal axis emphasizing forward
movement. Mood: collective action, conflict, working-class weight.
Realism: flat (all action rendered as color-blocked locked poses).
16:9 aspect ratio.

Avoid: photorealistic motion blur, smooth featureless mannequin
faces, Adobe stock protest imagery, contemporary photography
aesthetic. Action must read as constructivist locked-pose, not
photographic blur.
```

**What to look for:**
- Do the dynamic poses read as intentional constructivist locking, or as awkward AI motion artifacts?
- Do the planar faces hold under motion?
- Does the diagonal axis convey forward movement?
- Conflict palette holds (ink/oxblood/rust, no cool blue)?

---

## Test 10: Subway / contemporary urban (multiple figures, casual poses)

**What this probes:** Whether the aesthetic works for contemporary urban scenes — subway, train station, street corner. Mix of figures, casual poses, contemporary clothing, urban architecture.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, Masereel, and 1930s Soviet urban
photomontage. Bold compositional confidence, color-blocked forms
with no soft shading or gradients. Restricted warm palette: deep
ink, walnut, umber, burnt amber and gold, rust, bone on paper
background.

A contemporary subway platform at evening rush hour, 2026. Approximately
12-15 figures in casual professional attire (suits, coats, casual
business) waiting along the platform — some looking at phones held
flat to chest, some reading, some standing in middle distance.
Faces composed of 4-5 color-blocked planes, eyes obscured by phone
screen glow / hair fall / hat brim. Hands holding phones as flat
color planes. Phones themselves as small ink rectangles with subtle
amber screen glow. Subway tunnel architecture rendered as bold
geometric forms — tile patterns as flat color-blocked panels, tunnel
arch as monumentalist umber shape, fluorescent ceiling lights as
flat amber rectangles. Subway car arriving in distance, headlights
as bold amber geometric beams. Subtle English signage on walls
('UPTOWN', 'DOWNTOWN') in geometric sans-serif. Mood: contemporary
urban anonymity, modern infrastructure, civilizational scale at
human density. Realism: balanced (figures flat, environment has
material texture on tile and concrete). 16:9 aspect ratio.

Avoid: photorealistic faces, Adobe stock subway photography,
contemporary Instagram aesthetic, smooth featureless mannequin
faces.
```

**What to look for:**
- Does contemporary urban content work in constructivist, or does it feel anachronistic?
- Multi-figure scene under casual poses — do faces hold?
- Phone screens rendered as ink rectangles with amber glow (good) or as photoreal screens (bad)?
- Mix of distances (foreground / mid / distant subway car) — clarity?

---

## Test 11: Near-future scenario (2030 hypothetical, speculative content)

**What this probes:** Whether the aesthetic works for *speculative* future content. The Oracle direction (predictions, scenarios) is a forward-looking pillar; the aesthetic needs to handle "what if" futures.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, and Soviet futurist science fiction
illustration (1920s-30s tradition extrapolated to 2030). Bold
compositional confidence, color-blocked forms with no soft shading.
Restricted warm palette: deep ink, walnut, umber, burnt amber and
gold, rust, bone on paper background.

Year 2030 hypothetical: interior of a fully-automated semiconductor
fabrication facility, no human workers visible. Robotic arms in
geometric red and amber forms moving wafers between automated
stations. FOUP carriers on overhead tracks as flat ink-and-amber
shapes. Cleanroom architecture extends into deep one-point
perspective with vanishing point centered. Lighting from overhead
panels in monumentalist amber bands. Subtle Chinese minimal
signage on equipment ('微米' Micron, '芯片' Chip). Mood:
post-human industrial precision, civilizational ambition, the
factory as autonomous system. The composition emphasizes scale
and emptiness — the facility runs without workers. Realism: flat
(automated future content benefits from maximum graphic flatness).
16:9 aspect ratio.

Avoid: photorealistic robotic rendering, sci-fi cliché aesthetic,
gradient lighting, Adobe stock futuristic imagery, smooth chrome
3D render look.
```

**What to look for:**
- Does the futuristic content feel speculative-but-grounded, or sci-fi-cliché?
- Does the absence of humans work, or does the scene feel empty?
- Robotic arms rendered as constructivist geometric forms vs. photoreal CGI?
- Does the deep one-point perspective land?

---

## Test 12: Mixed typography (split-frame comparison)

**What this probes:** Whether `text_treatment: mixed` works — two typographic traditions deliberately co-present in one frame as editorial commentary on civilizational comparison.

**Prompt:**

```
Editorial illustration in the Parallax constructivist style. Drawing
on Rodchenko, Heartfield, Lissitzky photomontage. Bold compositional
confidence, color-blocked forms with no soft shading. Restricted
warm palette: deep ink, walnut, umber, burnt amber and gold, rust,
bone on paper background.

Split-frame composition: left half shows interior of a 1972 Soviet
rocket factory with workers in dark blue overalls operating
machinery; right half shows interior of a 1972 NASA mission
control center with engineers at consoles. Both rendered in the
same constructivist visual language — flat color-blocked forms,
4-5 plane faces with obscured eyes, monumentalist scale. The
visual style is identical across the split; the typography is
deliberately different: left side has Russian Constructivist
typography (ЭНЕРГИЯ · ПРОГРЕСС in bold red Cyrillic block letters),
right side has American Modernist typography (MISSION · CONTROL ·
PROGRESS in geometric sans-serif amber blocks, Push Pin / Saul Bass
style). The juxtaposition itself is the editorial argument: the
same structural moment in two civilizational rhetorics. Composition
shows clear vertical split-line at frame center. Mood: comparative
analytical, structural symmetry across civilizations. Realism: flat.
16:9 aspect ratio.

Avoid: photorealistic rendering, mock-script in either Russian or
English, Adobe stock split-screen aesthetic. Both Cyrillic and
English must be real and parseable.
```

**What to look for:**
- Does the split-frame hold visual coherence (same constructivist DNA across both halves)?
- Do both typography traditions render correctly and parseably?
- Does the juxtaposition feel editorial (intentional comparison) or accidental?
- Does the symmetric composition support the analytical argument?

---

## Coverage map — which versatility aspects each test probes

| Test | Period | Geography | Scale | Realism | Typography | Edge case |
|---|---|---|---|---|---|---|
| 1. Soviet 1972 | 1972 | Soviet | monumentalist | flat | russian_constructivist | language test |
| 2. Beijing v2 | 1984 | Chinese | intimate | balanced | chinese_minimal | v1 failure re-test |
| 3. War Room | contemp. | US/multi | medium | balanced | english_minimal | multi-figure + conflict |
| 4. Silicon Valley | 2026 | American | medium | balanced | english_modernist | hardest edge case |
| 5. Tokyo 1942 | 1942 | Japanese | medium | grounded | japanese_showa | language test |
| 6. Shanghai 1923 | 1923 | Chinese | intimate | balanced | chinese_traditional | language test |
| 7. Crowd rally | 1955 | varies | crowd | flat | varies | scale test |
| 8. Pure landscape | contemp. | varies | landscape | flat | none | non-figurative |
| 9. Industrial strike | 1937 | varies | medium | flat | varies | dynamic poses |
| 10. Subway | 2026 | American | medium | balanced | english_minimal | contemporary urban |
| 11. 2030 future | 2030 | Chinese | medium | flat | chinese_minimal | speculative |
| 12. Mixed typography | 1972 | Soviet+US | comparative | flat | mixed | typography juxtaposition |

The total coverage hits all four main typographies, all three realism dosages, period range from 1923 to 2030, and a deliberate set of edge cases (contemporary tech, action, crowd, non-figurative, speculative, juxtaposition).

## Decision logic after testing

For each test:

- **Lands clean:** add to canonical library candidates. Note which parameters worked. The aesthetic is validated for that combination.
- **Lands close but misses:** iterate the prompt 2-3 times. Identify which spec point is being missed. May need to tighten the preamble for that specific failure mode.
- **Hard fails:** documents a real limit of the aesthetic. Either the spec needs structural change, or that combination needs a fallback (e.g., when chinese_traditional fails, fall back to chinese_minimal or none).

After running all 12 tests, the channel will have empirical data on:
- Which typographic traditions work reliably in ChatGPT/Recraft (which need Tiger's pre-render review)
- Which subject types stretch the aesthetic (contemporary tech, action, crowd)
- Which realism dosages produce different-quality outputs across scenes
- Where the aesthetic has hard limits

That data feeds into:
- v1 reference library expansion (any new test that lands clean gets added)
- Preamble refinement (any failure mode that recurs gets tighter language)
- Editorial guardrails (any combination that hard-fails gets documented as unsupported)

## Maintenance

When a test passes consistently across multiple regenerations:
1. Add it as a candidate for the canonical reference library
2. Update PROMPTS.md with the validated prompt
3. Note the success in EDITORIAL_PLAYBOOK.md if it represents new aesthetic territory

When a test fails consistently:
1. Document the failure mode in this file
2. If the failure points to a preamble weakness, tighten the relevant block in recraft.py
3. If the failure points to an editorial limit, note in AI_VIDEO_PIPELINE.md "Open Questions" or as a guardrail

When new versatility tests are needed (new content type, new geography, new mood):
1. Add the test to this file
2. Frame what it probes and why it matters
3. Include the paste-ready prompt and what-to-look-for notes
