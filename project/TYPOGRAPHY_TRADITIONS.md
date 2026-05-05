# Parallax — Typography Traditions

> Created: May 4, 2026
> Updated: May 4, 2026 — Added palette emphasis and compositional emphasis per tradition. Each typography block now carries cultural counterweight to the base preamble's default Soviet/German constructivist lean. The brand palette range stays constant; per-tradition emphasis specifies which colors to foreground and how to compose.
> Owner: Editorial decision per episode (specified in angle memo, recorded in shot-list `text_treatment` field)
> Related: VISUAL_LANGUAGE.md (three-register system), AI_VIDEO_PIPELINE.md (constructivist aesthetic), PROMPT_PREAMBLES.md (prompt-level brand layer), tools/recraft/recraft.py (`--text-treatment` flag).

## What this document is

The canonical visual grammars for the typography traditions Parallax draws on. The channel's grounded illustrations (Register 3) and atmospheric backgrounds (Register 2) share a unified constructivist aesthetic — but the *typography* within each scene varies by what the scene depicts. A 1980s Beijing apartment uses Chinese typography; a Soviet-bloc historical episode uses Russian Constructivist typography; a US industrial scene uses American midcentury modernist typography.

This isn't decoration. It's analytical. The typography of each civilization is part of how that civilization communicates power, mobilization, and identity. Rendering each in its own visual rhetoric makes the visual layer participate in the cross-cultural argument the channel is uniquely positioned to make.

## The three editorial modes

Per scene, the typography decision picks one of three modes:

**Pragmatic** — minimal or stylized-neutral text, period-natural signage only (calendars, equipment labels, document headers). Used when text would compete with the visual or when no political-language association serves the moment. Default for quiet scenes, atmospheric backgrounds, transitional moments. Most scenes live here.

**Contextual-by-episode** — typography tradition matched to the scene's geography and era. Chinese for Chinese-coded scenes, Russian Constructivist for Soviet-bloc scenes, English Modernist for American scenes, Japanese Showa for Japanese mid-century scenes. Default for grounded scenes that establish location or carry cultural specificity. Most-used mode after pragmatic.

**Sophisticated** — deliberate typographic mismatch as commentary. Soviet Constructivist text on a US scene to argue a structural parallel. Japanese Showa on a contemporary scene to argue historical recurrence. Reserved for peak analytical moments, 1-2 per episode maximum. When it works, it's unmistakably Parallax.

The mode is a per-scene editorial decision specified in the angle memo and recorded in the shot list. The `text_treatment` field on each shot encodes which typographic tradition the scene uses.

## Why typography blocks also carry palette + compositional cues

Post-May 4, 2026, each typography block does three things, not one: it specifies the typography itself (script, weight, period), the palette emphasis (which subset of the brand palette to foreground for that culture), and the compositional emphasis (which graphic-grammar rules to apply). This three-fold responsibility solves a problem that surfaced during the Silicon Valley test (Test 4 in VERSATILITY_TESTS.md): the constructivist BASE preamble defaults to Soviet/German intensity (Rodchenko, Heartfield, Masereel, full revolutionary palette, diagonal monumentalist composition), so a scene with English Modernist typography on a 2026 Silicon Valley office still *visually* read as Soviet propaganda — the colors and composition came from the base, not the typography.

The fix: the base preamble stays unchanged (constructivist core), and each typography block provides cultural counterweight when the scene's geography doesn't match Soviet revolutionary aesthetic. American mid-century scenes pull the palette toward softer walnut/umber/gold (Saul Bass / Push Pin / Charley Harper restraint) and shift composition to balanced asymmetric editorial layouts. Chinese scenes pull the red toward Chinese vermillion (lacquer-influenced, distinct from Soviet crimson) and emphasize vertical orientation. Japanese Showa minimizes to black/red/cream with vertical compositions. Russian Constructivist keeps the full Soviet intensity (this is what the base preamble already defaults to).

The brand palette range itself stays constant — same colors are available everywhere. What varies is which subset gets foregrounded in any given scene. This preserves channel-wide tonal coherence (every Parallax visual still pulls from palette.json) while allowing cultural specificity (Soviet scenes look Soviet, American scenes look American, Chinese scenes look Chinese).

## The traditions

Each tradition is a tradition-and-style pair — visual grammar developed within a specific civilizational moment. The notes below capture the key markers Recraft and Flux 2 Pro need to land each tradition correctly.

### `none`

No typography elements in scene. Pure visual constructivism. Use for scenes where text would be a distraction or where the composition carries the entire meaning.

### `english_minimal`

Period-appropriate English signage only where naturally diegetic — calendars, equipment labels, clipboards, document headers. No bold propaganda-style typography. Subdued, integrated into the scene's reality.

**Use for:** Most American scenes, contemporary technology scenes, neutral environments. Default for transitional moments and scenes where typography would distract.

**Visual markers:** Helvetica or period-appropriate sans-serif at small scale, integrated with realistic objects (printed labels, monitor displays, document headers). No bold color blocks, no compositional dominance, no slogans.

**Palette emphasis:** Neutral subset of the brand range — walnut (#5C4A3D), umber (#8B7355), bone (#F0E6D0), paper (#F5F0E8). Avoid bold accents. This is everyday signage integrated into realistic scenes, not propaganda.

**Compositional emphasis:** Small scale, no compositional dominance. Text integrates with realistic objects (calendar pages, document headers, equipment labels). Subway signage in Test 10 is the canonical use case.

### `english_modernist`

American midcentury modernist propaganda-poster typography. Push Pin Studios, Saul Bass title sequences, *Fortune* magazine industrial-modernism, Herb Lubalin layouts.

**Use for:** Mid-20th-century American industrial mobilization scenes (Cold War, postwar manufacturing), corporate-power scenes, contemporary American tech (Silicon Valley, Wall Street, modern corporate), scenes where American mid-century optimism or industrial confidence is the editorial subject.

**Visual markers:** Geometric sans-serif (Helvetica-adjacent, Futura, Avant Garde), bold weight variations, slab-block letter compositions, iconographic integration. Typography often anchored bottom-left or anchored to architectural elements. English text in short imperative or declarative phrases. References: Bass for *The Man with the Golden Arm*, *Fortune* covers from the 1950s-60s, Push Pin's *Push Pin Almanack*, Charley Harper's geometric wildlife illustrations, Jim Flora's RCA covers.

**Sample phrases (period-appropriate):** "INDUSTRY · INNOVATION · ENTERPRISE," "THE AMERICAN CENTURY," "PROGRESS," "FREE WORLD," "BUILD · ITERATE · SCALE" (contemporary tech).

**Palette emphasis:** Pull from the brand's softer range — walnut (#5C4A3D), umber (#8B7355), gold (#C4A747), bone (#F0E6D0), paper (#F5F0E8) — with rust (#A64D46) as a SINGLE sparing accent only, never the dominant color. Avoid the saturated revolutionary red palette of Soviet constructivism. Think Saul Bass's restrained mid-century palette (Anatomy of a Murder posters), Charley Harper's wildlife illustrations, Jim Flora's RCA covers, Mad Men interiors — American mid-century optimism, NOT revolutionary mobilization. This is the explicit fix for the May 4 v1 Silicon Valley failure where the rust palette dominance made an American tech scene read as Soviet propaganda.

**Compositional emphasis:** Balanced asymmetric layouts typical of American mid-century editorial design — Push Pin Studios' deliberate white-space discipline, Saul Bass's confident negative space, the Eames-era flat-modernist grid. Avoid the diagonal compositional axis of Soviet constructivism (which reads as revolutionary intensity). Composition feels intentional and architectural, not heroic and monumentalist. The result should look like a Saul Bass poster of the scene rather than a Rodchenko poster of the scene.

### `russian_constructivist`

Soviet Constructivist propaganda typography. Alexander Rodchenko, Gustav Klutsis, El Lissitzky, the *October* magazine tradition (1917-1935) and its neo-revivals.

**Use for:** Soviet-bloc historical scenes, episodes covering Russian or Eastern European geopolitics, scenes about state-driven industrial mobilization, scenes about ideological state systems. Also valid for the Sophisticated commentary mode when the editorial argument is about structural parallels between Soviet and contemporary state-power moves.

**Visual markers:** Sans-serif geometric (often custom-cut block letters), diagonal compositional axis, red and black dominant with bone accents, bold heavy weights, frequent vertical column treatment, frequent integration with photographic elements (photomontage). Cyrillic text in Russian — short imperative slogans, declarations, dates as monumental design elements. Letterforms often built from rectangles and circles. Composition is dynamic and asymmetric.

**Sample phrases (period-appropriate, 1920s-30s):** "ЕДИНСТВО" (Unity), "ПЯТИЛЕТКУ В ЧЕТЫРЕ ГОДА" (Five-Year Plan in Four Years), "ИНДУСТРИАЛИЗАЦИЯ" (Industrialization), "ПОБЕДА" (Victory), "ЭНЕРГИЯ" (Energy), "ПРОГРЕСС" (Progress). For neo-revival contemporary use: "ТЕХНОЛОГИЯ," "СТРАТЕГИЯ."

**Palette emphasis:** Full saturated revolutionary palette — heavy red (rust #A64D46 dominant), gold (#C4A747) accents, deep ink (#1C1814) structural elements, bone (#F0E6D0) for highlights. This is the default Soviet emphasis the base preamble already pushes toward; revolutionary intensity is the goal, not something to soften. Soviet 1972 rocket factory test (Test 1 in VERSATILITY_TESTS.md) is the canonical example — rust + gold dominance reads correctly as Soviet-state.

**Compositional emphasis:** Diagonal compositional axis (signature Soviet constructivist move), monumentalist scale, low horizon line, propaganda-poster dynamism. Heroic figures rendered in low-angle shots. Full Rodchenko / Klutsis intensity. This is the *only* tradition where the diagonal monumentalist composition is the right choice — every other tradition pulls back from it.

**Avoid:** Cyrillic script that doesn't actually parse (mock-Cyrillic gibberish reads as parody). When uncertain about Russian phrasing, use `none` or fall back to a different tradition.

### `chinese_propaganda`

Chinese propaganda poster typography. Cultural Revolution (1966-1976) tradition and its post-Mao Reform Era (1978-2000s) variants. Heavy bold heiti (黑体) sans-serif, often with slogans pulled from Maoist or Reform-era political rhetoric.

**Use for:** Chinese-coded scenes covering the PRC era — industrial mobilization, technology policy, state-directed economics, Cultural Revolution episodes, contemporary Chinese state-rhetoric scenes. The most-used contextual treatment for the channel given Parallax's China focus.

**Visual markers:** Bold sans-serif heiti (黑体) at large scale, red as dominant accent color, gold/yellow secondary, frequent vertical text orientation (top-to-bottom right column), imperative slogan tone, integration with revolutionary or industrial iconography. Often combined with stylized portrait elements (workers, peasants, soldiers tradition) or industrial silhouettes. Text typically renders in Simplified Chinese (post-1956) for PRC content; Traditional Chinese for Taiwanese/Hong Kong/pre-1949 content.

**Sample phrases (period-appropriate):**
- Cultural Revolution era: "为人民服务" (Serve the People), "工业现代化" (Industrial Modernization), "自力更生" (Self-Reliance)
- Reform Era: "改革开放" (Reform and Opening), "科学技术是第一生产力" (Science and Technology are the Primary Productive Force)
- Contemporary: "中国制造" (Made in China), "科技自立" (Technological Self-Reliance), "微米" (Micron — for semiconductor scenes), "芯片" (Chip)

**Palette emphasis:** Chinese vermillion red (slightly warmer and more lacquer-influenced than Russian crimson — closer to traditional Chinese pigments and Chinese New Year red) plus gold (#C4A747) and deep ink (#1C1814), with ivory paper (#F5F0E8) background. The red reads Chinese-state, NOT generic-communist or Soviet revolutionary. Cultural Revolution posters used pigment characteristics distinct from Soviet propaganda — more saturated golden-yellow, more calligraphic black emphasis, traditional vermillion rather than industrial crimson. Critical for Parallax's US-China geopolitics content: Chinese fab interiors should not visually echo Soviet rocket factories.

**Compositional emphasis:** Vertical orientation common (top-to-bottom right column for vertical text), often with stylized portrait elements (workers, peasants, soldiers tradition) integrated into the composition. Imperative slogan tone supported by bold heiti sans-serif at large scale. More frontal/symmetric composition than Soviet diagonal — reads as state-poster rather than revolutionary agitprop. The compositional difference is subtle but real: Soviet constructivism tilts on diagonal axes; Chinese propaganda tends to anchor frontally with vertical text columns.

**Avoid:** Mock-Chinese characters that don't parse (immediately legible to Chinese-reading viewers as broken). When uncertain about phrasing, default to `chinese_minimal` or `none`. Tiger should review all Chinese text in Recraft outputs before assembly.

### `chinese_minimal`

Period-natural Chinese signage only — calendars, document headers, scientific/technical labels, equipment markings. No bold propaganda typography.

**Use for:** Quiet Chinese-coded scenes, intimate domestic settings, scenes where political rhetoric would distract.

**Visual markers:** Subdued integration of Chinese text into realistic objects — calendar pages, newspaper headers, book spines, document text. Smaller scale, no compositional dominance. Period-appropriate calligraphic or print styles (mid-20th century printed Chinese, brush-style for older periods).

**Palette emphasis:** Neutral subset of the brand range — walnut (#5C4A3D), umber (#8B7355), bone (#F0E6D0), paper (#F5F0E8). Restrained presence; NOT propaganda intensity. Reserves the saturated red palette for scenes that actually warrant it (chinese_propaganda).

**Compositional emphasis:** Subtle integration into realistic objects (calendar pages, newspaper headers, book spines, document text). Small scale, no compositional dominance. The Beijing apartment intimate scene is the canonical use case.

### `chinese_traditional`

Pre-revolutionary Chinese typography — brush calligraphy aesthetic, classical typesetting, scholarly traditions.

**Use for:** Pre-1949 Chinese scenes, scenes about classical Chinese thought (Legalism, Confucianism, Daoism), scenes about Taiwan or Hong Kong cultural specificity, scenes where the Chinese intellectual tradition (rather than PRC state) is the editorial subject.

**Visual markers:** Vertical text orientation (right-to-left columns), brush calligraphy texture or classical printed style, restrained scale, black ink on bone background. Traditional Chinese characters (繁體). Often paired with classical iconography (scrolls, pavilions, scholar's objects).

**Palette emphasis:** Ink wash dominant — deep ink (#1C1814) on paper (#F5F0E8) background, with sparse rust (#A64D46) only as red seal accents (chops, signatures). Avoid amber/gold dominance of propaganda traditions; this is scholarly restraint. Closest equivalent: classical scroll painting, scholar's study aesthetics, literati ink tradition.

**Compositional emphasis:** Vertical orientation (right-to-left columns for text), restrained scale, contemplative composition. Negative space is content — extensive empty areas as deliberate aesthetic choice. NOT propaganda intensity; this is literati restraint. Often paired with classical iconography (scrolls, scholar's objects, pavilions).

### `japanese_showa`

Japanese Showa-era propaganda typography (1930s-40s) and its postwar industrial variants.

**Use for:** Pre-1945 Japanese imperial scenes, postwar Japanese industrial mobilization scenes (1950s-80s electronics-era), scenes about Japanese technological strategy. Use sparingly — this is a less-frequent tradition for the channel.

**Visual markers:** Vertical text orientation, bold rendering, frequent integration with traditional Japanese iconography (rising sun motif, geometric flag elements, kanji integration with sans-serif Latin). Bold kanji at monumental scale, sometimes paired with hiragana subtext. Japanese imperial-era typography has specific historical associations — use only when the editorial subject is the Showa-era Japan; for contemporary or postwar Japan, use a more neutral treatment.

**Sample phrases (period-appropriate):** "技術" (Technology), "産業" (Industry), "国家" (Nation), "進歩" (Progress).

**Palette emphasis:** Extremely minimal — black/deep ink (#1C1814), single bold red (closer to traditional Japanese red, slightly orange-leaning — between rust #A64D46 and gold #C4A747), cream/bone (#F0E6D0). Often just 2-3 colors total. Avoid amber/gold dominance of Soviet propaganda; the Showa-era palette is deliberately stripped down.

**Compositional emphasis:** Vertical orientation strongly preferred, geometric flag/sun motif integration, bold kanji at monumental scale. Rising sun radial composition is a signature element when appropriate to the historical moment. Less industrial than Soviet, more emblematic and graphic.

### `mixed`

Multiple typographic traditions in one frame. Rare. Use only for scenes that explicitly compare or juxtapose civilizations — split-screen power-broker moments, side-by-side comparisons, episodes whose argument is the comparison itself.

**Visual markers:** Two or more typographic traditions deliberately co-present, with clear spatial separation (split frame, foreground-vs-background, left-vs-right). The juxtaposition is the editorial point.

**Palette emphasis:** Each half uses its tradition's palette emphasis (see individual blocks above). The contrast between palettes is part of the editorial argument — a Soviet/American comparison should *visually* show the Soviet half in revolutionary rust+gold and the American half in restrained walnut+umber, with the contrast itself carrying analytical weight.

**Compositional emphasis:** Clear vertical or horizontal split-line establishes the comparison. Each half follows its tradition's compositional grammar (Soviet half diagonal monumentalist; American half balanced asymmetric editorial). Symmetric framing supports analytical comparison; asymmetric supports argumentative juxtaposition.

## How to choose for a given scene

The decision logic per scene, in order:

1. **Does this scene need typography at all?** If text would distract or compete with the visual, use `none`. Default for atmospheric backgrounds, abstract metaphors, intimate moments where composition does the work.

2. **If yes, is the scene grounded in a specific geography/era?** If yes, use the contextual treatment matched to that geography/era. (Contextual-by-episode mode — most common for grounded scenes.)

3. **If yes but the scene is a transitional or neutral environment without strong geographic specificity?** Use the minimal variant (`english_minimal`, `chinese_minimal`).

4. **Is the typographic *mismatch* itself the editorial argument?** Then deliberately pair a non-matching tradition (Soviet Constructivist on a US scene, Japanese Showa on a contemporary scene). This is the Sophisticated mode — use 1-2 times per episode at peak analytical moments.

The decision is recorded in the angle memo (visual arc section) and committed to the shot list as the `text_treatment` field on each AI-generated entry.

## Quality gate: language accuracy

Recraft and Flux 2 Pro will sometimes generate broken text — Cyrillic that doesn't parse, Chinese characters that aren't real, Japanese kanji that mean nothing. **Tiger must review all rendered text in non-English traditions before any asset enters the timeline.** A Chinese viewer who reads broken characters will read the channel as inauthentic immediately. The political-typography risk only pays off if the typography is real.

For Russian and Japanese, when uncertain about period-appropriate phrasing, fall back to `none` or use the minimal variant. For Chinese, Tiger's bilingual fluency is the quality gate — all Chinese text gets a manual readability check.

## Maintenance

When adding a new tradition (new region, new era, new visual grammar) to Parallax's vocabulary:

1. Add an entry to this doc with: editorial use cases, visual markers, sample phrases, avoidance notes.
2. Add the value to the `text_treatment` enum in `data/shot-list.schema.json`.
3. Add the corresponding typography block to `tools/recraft/recraft.py`'s `TYPOGRAPHY_BLOCKS` dict.
4. Note the change in EDITORIAL_PLAYBOOK.md if the addition reflects a meaningful editorial direction shift.

When retiring a tradition (because it's not editorially fit, or it's been consolidated into another):

1. Mark the entry here as `[RETIRED]` with the reason and what replaced it.
2. Don't remove the enum value — preserve it for backward compatibility with existing shot lists.
3. The typography block in recraft.py can fall through to a default (probably `none`).
