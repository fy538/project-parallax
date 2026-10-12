# PrimarySourceReveal — Research Dossier

> Created May 19, 2026. The "reading-the-text-closely" form — historical
> document foregrounded with timed analytical annotations.

## 1. The form's editorial purpose

PrimarySourceReveal foregrounds a primary-source text (treaty clause, speech excerpt, diplomatic cable, legal opinion, historical correspondence) and layers timed analytical annotations — underlines, circles, margin notes, strikes, translations, numbered footnotes — to do the reading. The argument the form makes is *"look at what this document actually says: now look at it again with these specific words highlighted; now consider this gloss in the margin."* Reach for it when the editorial point is that a single passage of historical text carries the weight the narrator is making — Article 231 of the Treaty of Versailles, Kennan's Long Telegram, the Mukden incident report, the Cuban-missile-crisis ExComm transcripts. This is the form that distinguishes academic-documentary register (Adam Curtis, Errol Morris, Ken Burns' close-read sequences) from explainer-channel register (which paraphrases instead of quoting).

## 2. Canonical idioms

**Marginalia + scholar's gloss.**
The medieval/early-modern academic tradition: a central text block with margin notes pointing to specific passages via leader lines. Used in modern editorial form by *London Review of Books*, *New York Review of Books*, and most academic historical documentary (Ken Burns' *The Civil War* close-reads of letters, Adam Curtis' *Hypernormalisation* document reveals). The marginalia register is high-trust, scholarly, slow.
Failure mode: too many marginalia stacked at once produces visual clutter; ideally one or two notes visible at any moment with timed entries/exits.

**Underlined-and-numbered (FT / Bloomberg "annotated quote" idiom).**
Used by FT and Bloomberg in explainer infographics: the quote sits in a card with key phrases underlined and superscript numbers (1)(2)(3) referring to a footnote ledger below. Recent example: Bloomberg *"The five most important sentences in Yellen's testimony"* (2023). Clean, news-room register.
Failure mode: numbered references require eye to dart between text and ledger — slower scan than inline annotations.

**Translated parallel text.**
Used in historical documentary when the original text is non-English: original text in serif, translation in italic below or above each line. Most rigorous in academic-translation publications (Loeb Classical Library bilingual editions) and modern outlets: NYT's translation of the Hamas Charter (2023), Atlantic translations of Chinese policy texts. The translation IS the reading — it surfaces choices the translator made (which English word approximates "Verantwortlichkeit"? which carries the editorial weight?).
Failure mode: tiny translation text below the original is unreadable in video format; treat each translation as a first-class annotation needing its own reveal beat.

**Highlight-and-narrate (PBS / Frontline idiom).**
Animated highlights move across the text as the narrator reads — sentence-by-sentence yellow highlight tracking the voice. Used heavily in legal-document explainers (PBS Frontline pieces on court decisions). Tight sync to narration; works only when the script and the document are designed together.
Failure mode: continuous highlight movement reads as karaoke; reserve for moments where the editorial point IS "the narrator is reading this text now."

## 3. General principles

The form encodes the editorial argument *across two visual layers*: the **base text** (low data-ink, recessive, set in body face) and the **annotation layer** (high data-ink, accent colours, prominent typography). The annotations are the analysis; the text is the evidence. Cleveland would call this "marker overlay on a stable substrate" — fundamentally a positional encoding (annotations point to specific text spans).

Tufte's "small multiples of insight" applies inverse: instead of repeating a chart with different data, you repeat a single text with different analytical overlays. The text doesn't change; the reading does.

Munzner's "what-why-how" framework: the *what* is text + spans; the *why* is to enable close reading; the *how* is timed overlays in distinct visual channels (underline = emphasis, circle = focal phrase, margin note = scholar's gloss, strike = excised text, translate = gloss across languages, numbered = footnote reference).

## 4. Recommendation for Parallax

Default to the **marginalia + scholar's gloss** idiom with the **highlight-and-narrate** layer for moments of narrator-reads-aloud. Specifically:
- Document card with paper-bone background, slight drop shadow, generous internal padding (60px top/bottom, 64px left/right)
- Text in Plex Serif (formal-document register) at fontSize 26, lineHeight 1.55 — generous for video readability
- Underline + circle annotations on the text itself (Tier 1 — text-level emphasis)
- Margin notes in the right gutter, italic serif, with dashed leader lines to the highlighted span (Tier 2 — scholar's voice)
- Translations appearing above the original span in dustblue italic (Tier 3 — gloss across languages, e.g., Verantwortlichkeit→liability)
- Numbered superscripts with a bottom-left footnote ledger (Tier 4 — full historiographical context, sized small, only one or two per shot)
- Strikes for excised text (rare — use only when the document has been altered editorially or politically)

Title in IBM Plex Sans at fontSize h2, subtitle in serif italic. Source citation in mono small-caps at the bottom in `— SOURCE NAME —` format (the dashes are the editorial signal "this is the citation, not commentary").

## 5. Current template alignment

`PrimarySourceReveal` ships with the recommended idiom. 7 annotation types implemented (underline, circle, highlight, strike, margin-note, translate, numbered). Document card + text rendering correct. Margin notes positioned via DOM-measured span rects, with leader lines drawn dynamically. Multiple annotations can target the same text span (e.g., circle + translate + margin-note on "responsibility" all share a single DOM measurement).

Two implementation details worth knowing:
1. **`delayRender` lifecycle**: span measurement happens in `useLayoutEffect` after first paint; the result feeds state, which triggers re-render. Without `delayRender`, Remotion's still renderer captures the screenshot before the second-render state propagates, and annotations vanish. The template holds a delay handle until measurement completes.
2. **Absolute viewport coords**: spans are measured as absolute coordinates (not box-relative). The annotation SVG is rendered as a canvas-level sibling (not nested under the text), avoiding fragile nested-SVG sizing issues.

Diverges from the canon by avoiding the highlight-and-narrate continuous-tracking variant — that requires Whisper-precise timing per word, which Parallax's authoring workflow doesn't easily support yet. Phrase-level highlights via `appearAtSec` are supported.

## 6. Specific upgrades proposed

1. **Multi-language text** (medium effort, high impact for historical episodes) — render Chinese, Russian, Arabic, German text in their native scripts. Schema has `textLang` field reserved but unimplemented. Requires CJK / RTL-aware font loading.
2. **Image-of-document substrate** (medium effort, high impact) — schema reserves `documentImage` field for embedding a scan of the actual archival document with text overlaid. Useful for treaty signatures, hand-written cables, photographed documents. Currently unimplemented.
3. **Sentence-level highlight-and-narrate mode** (high effort, medium impact) — opt-in continuous highlight tracking driven by `syncPoints[]`. Useful for narrator-reads-document moments.
4. **Footnote pagination** (low effort, low impact) — when more than 3 numbered footnotes appear, the bottom-left legend overflows. Implement a 2-column layout or "and 2 more (see show notes)" cutoff.
5. **Translate annotation alignment** (low effort, medium impact) — currently translates appear ABOVE the original span. For longer translations they'd benefit from a flowing reflow into the right margin alongside margin notes. Add `translate.position: "above" | "margin"` option.

## 7. Failure mode flags

- **Text > 400 words** → reading speed too slow for video; cut to the load-bearing passage. PrimarySourceReveal is the magnifying-glass form, not the document-reader form.
- **No annotations** ("just show the text and let the narrator read it") → use a `KineticTypography` quote card instead; PrimarySourceReveal's editorial power comes from the layered analysis.
- **Annotation target text doesn't exist verbatim in `text`** → the substring match fails silently and the annotation never appears. Audit: validate every annotation target against the text at parse time.
- **Overlapping annotations on DIFFERENT spans** (e.g., underline "A B C" and circle "B C D") → the buildSegments logic drops the second annotation. Author them as sequential (with `exitAtSec` between) or restructure the targets to not overlap.
- **Too many simultaneous annotations** (>3 active at the same `t`) → visual overload, eye can't process. Use timed exits (`exitAtSec`) to maintain ≤2 active annotations at any moment.
- **Non-archival document** ("contemporary tweet", "ChatGPT output") → the editorial register of PrimarySourceReveal implies historical/primary authority. Modern social-media text deserves a different template (KineticTypography with quote-attribution).

## Image mode: show the document itself (added Oct 10, 2026)

A typeset transcription on a paper panel is a quote card dressed as a document. When the page exists, show the page. Set `image: { src, width, height, highlights[] }` and the template renders the scan in place of the typeset card; `text` stays required as the transcript.

- The image is multiplied onto the card, so a white page takes the paper tone and no rectangle shows. It fades out at its top and bottom edges, which lets a crop that starts mid-paragraph read as an excerpt.
- `highlights[]` are boxes in percent of the image, one per line of text, each wiping in left to right from its `appearAtSec`.
- Crop the passage, not the page: body text should land at 30px or more on screen. A US Letter page rendered at 300dpi and cropped to about 2200px wide gives roughly 34px type at full card width.
- Check the passage and the page number against the rendered page when the scan has no text layer.

First use: `ai-care-motives/epa-nov-reveal.json` (EPA Notice of Violation, page 3). Preparing the crop: `pdftoppm -r 300 -f 3 -l 3 -png <pdf> page`, then crop with ffmpeg.

