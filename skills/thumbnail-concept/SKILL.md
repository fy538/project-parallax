---
name: thumbnail-concept
description: >
  Design 3 thumbnail composition concepts (Juxtaposition, Data Provocation, Symbolic) for a Parallax episode, each with visual description, 3-5 word text overlay, Meridian color treatment, and production method. Use whenever someone asks to 'design a thumbnail', 'thumbnail options', 'what should the thumbnail look like', 'packaging', 'thumb concepts', 'we need a thumbnail for EP[X]', 'how should this look on YouTube', or when the title/hook workshop produces a finalized title and the next step is thumbnail design. Follows Parallax anti-clickbait principles: sell the contradiction, one dominant visual, no red arrows or shocked faces. Includes A/B text variants.
---

# Thumbnail Concept Skill

You are designing thumbnail concepts for a Parallax episode. The thumbnail is the single most important piece of visual marketing — it determines whether a viewer clicks. Your job is to produce 3 thumbnail composition concepts that sell the episode's decoder insight in a single glance.

A good Parallax thumbnail is not a stock photo with text overlay. It's a visual argument — it should create the same cognitive dissonance as the cold open, compressed into one image. The viewer should feel "wait, that's contradictory" or "what's the connection?" before they've read any text.

## Before You Start

Read these files:

1. **The angle memo** (if it exists) — the named concept, decoder framing, and cold open approach are your primary inputs. The thumbnail should sell the decoder gap (standard frame vs. Parallax frame).
2. **The script** (if it exists) — scan for the most visually striking moment or contradiction. That's often your thumbnail.
3. **BRAND.md** (`/remotion-templates/BRAND.md`) — the Meridian design system. Thumbnails use the same palette but with higher contrast for small-screen legibility.
4. **SEO_KEYWORDS.md** (`/project/SEO_KEYWORDS.md`) — title is part of the thumbnail package; keywords inform text overlay choices.
5. **CONTENT_IDENTITY.md** (`/project/CONTENT_IDENTITY.md`) — competitive positioning. The thumbnail should look distinctively Parallax, not like CaspianReport or PolyMatter.
6. **EDITORIAL_PLAYBOOK.md** (`/episodes/EDITORIAL_PLAYBOOK.md`) — check for any thumbnail-related rules from post-publish retrospectives. As the channel accumulates data on CTR by thumbnail approach, rules will appear here (e.g., "Data Provocation thumbnails outperform Symbolic by 1.5x CTR on Arc 1 topics"). Early episodes may have no thumbnail rules — that's expected.

## Parallax Thumbnail Principles

These principles come from what works in analytical/geopolitics YouTube and what differentiates Parallax:

1. **Sell the contradiction, not the topic.** "Semiconductor factory" is a topic thumbnail. "$165B factory that made things worse" is a contradiction thumbnail. The contradiction creates the curiosity gap.

2. **One dominant visual element.** Thumbnails are viewed at ~120×68px on mobile. One clear focal point — not a collage. If you need two elements, make one 3x larger than the other.

3. **Text: 3-5 words maximum.** YouTube data consistently shows that thumbnails with less text outperform. The text should be a provocation or a number, not the full title. Think of it as the hook within the hook.

4. **Warm palette, high contrast.** Use the Meridian palette but push contrast higher than in-video. Gold (`palette.gold` = `#C4A747`) on ink (`#1C1814`) reads well at all sizes. Avoid the `china` semantic red (`#A64D46`) on dark backgrounds — too low contrast at thumbnail scale.

5. **No clickbait aesthetics.** Parallax's visual identity is "serious analytical publication" — think Foreign Affairs cover, not MrBeast thumbnail. The provocation comes from the idea, not the formatting. Specific bans (research 2026-05-18):

   | Banned | Reason |
   |---|---|
   | Shocked / open-mouth face (yours or anyone's) | Wrong genre signal — reads as content-free affect |
   | Red arrows, red circles, red corner brackets | Aggregator-tier visual marker |
   | Bebas Neue / ALL-CAPS Impact text overlay | Aggregator visual identity; conflicts with IBM Plex |
   | Saturated red/yellow background | Algorithmic-cargo-cult marker |
   | Round shock numbers without anchor ($1T, "100 years") | Fails specificity test — specific small numbers beat round huge ones |
   | "I tried X for Y" / "X for 30 days" framings | Stunt-video genre signal |
   | Curiosity-gap titles whose payoff isn't *literally* in the video | YouTube's satisfaction signals now penalize broken-promise directly (Gemini analyzes thumbnail-title-video as a system) |
   | Year-stamped titles ("...in 2026") | Decays against evergreen strategy |

6. **A/B testable — but Test & Compare likely unavailable at video #1.** Each concept should be distinct enough that YouTube's A/B testing (or manual testing) can reveal which approach resonates. Don't produce three minor variations — produce three genuinely different visual strategies. **Note (2026 update):** YouTube's native "Test & Compare" feature gates on Advanced Features + likely on channel scale; pre-launch channels probably don't have access at video #1. Plan for **manual thumbnail swap at 48h and 7d** based on YouTube Studio CTR data instead. Test & Compare becomes meaningful once you have a baseline.

7. **CTR target zone: 5–7%, not 4%** (research 2026-05-18 update). The 4% threshold from older sources is the floor below which distribution stalls. The working target for serious educational long-form is 5–7%. Below 4% → swap thumbnail at 48h. Education tier sits slightly lower than entertainment because more traffic is search-driven.

## The Three Concept Approaches

Always produce exactly three concepts, each using a different visual strategy:

### Concept A: The Juxtaposition
Place two elements in visual tension — the contradiction made visible. This works best when the episode's decoder insight is about two things that seem unrelated being structurally connected, or about success and failure coexisting.

Examples:
- A gleaming chip factory next to a "7%" — technical triumph vs. strategic irrelevance
- A chessboard and a go board side by side — different games, same conflict
- A historical image paired with a modern one — time collapse made visible

### Concept B: The Data Provocation
Lead with a number, stat, or visual data element that creates immediate cognitive dissonance. This works best when the episode has a "wait, what?" number.

Examples:
- "$165B" in large gold text over a dark background, with a small "7%" underneath — the mismatch IS the hook
- A simple chart showing an unexpected trend — the visual is the argument
- A percentage or dollar amount that contradicts expectations

### Concept C: The Symbolic
A single powerful image or symbol that captures the episode's named concept. This works best for episodes where the concept itself is the hook (The Silicon Trap, The Leaking Dam, etc.). More abstract, more brand-building, less click-optimized — but creates a distinctive visual identity over time.

Examples:
- A geometric net/trap motif from the visual arc — the concept made visual
- A single striking image with minimal text overlay
- The ∴ brand mark integrated into a concept-specific visual

### Concept D (optional): The Object + Annotation
*Added 2026-05-18 — FT-chart-annotation aesthetic.* Single subject (an object, a chart fragment, a diagram element) with one precise callout / annotation. Distinct from Data Provocation (number leads) and Symbolic (object alone). This is the NYT Upshot / FT visual journalism register applied to thumbnails — a small precise annotation pointing at one feature of the dominant subject.

Use when:
- The episode has a *specific, defensible technical detail* that anchors the argument
- The Symbolic register would feel too abstract for the topic
- You want to telegraph "this is rigorous editorial journalism" via visual register

Examples:
- A payoff matrix with one cell circled + a 4-word annotation pointing at it
- A historical map with a single arrow + a date label
- A chart with one line and a 3-word callout

Ship 3 concepts (A / B / C) by default. Use D where the episode shape genuinely calls for it — don't force it.

## Output Format

For each concept, provide:

```markdown
# THUMBNAIL CONCEPTS
## Episode: [number and title]
## Date: [today]

---

### Concept A: The Juxtaposition
**Visual:** [Describe the composition in detail — what's on the left, what's on the right, relative sizes, how they relate]
**Text overlay:** [3-5 words, exact text, font suggestion]
**Color treatment:** [Which Meridian colors, contrast notes]
**Why it works:** [One sentence — what cognitive dissonance does this create?]
**Production method:** [How to create this — Remotion template, treated stock photo, AI illustration, etc.]

---

### Concept B: The Data Provocation
**Visual:** [Composition description]
**Text overlay:** [3-5 words]
**Color treatment:** [Colors]
**Why it works:** [One sentence]
**Production method:** [How to create]

---

### Concept C: The Symbolic
**Visual:** [Composition description]
**Text overlay:** [3-5 words or none]
**Color treatment:** [Colors]
**Why it works:** [One sentence]
**Production method:** [How to create]

---

## Recommendation
[Which concept to test first and why. Note: this is a suggestion, not a decision — Tiger picks or mixes.]

## Text Overlay Variants
[For the recommended concept, provide 3 text alternatives to A/B test]

## Technical Notes
[Resolution: 1280×720. File format: PNG. Safe area: keep key elements away from corners where YouTube overlays timestamp and "WATCH LATER" button.]
```

## Rendering the concepts

This skill produces the concept doc + a machine-readable `episodes/<slug>/thumbnail-spec.json`. Once Tiger picks a final direction, the actual PNG files are rendered by the Remotion `Thumbnail` composition via the shipped npm script:

```
cd remotion-templates && npm run thumbnails -- --episode=<slug>
```

That command (`remotion-templates/scripts/generate-thumbnails.mjs`, shipped May 14, 2026) reads `episodes/<slug>/thumbnail-spec.json` and renders every concept to `out/thumbnails/<slug>/`. A/B variants are rendered as separate files for upload to YouTube Studio. The 1280×720 resolution, PNG format, and safe-area rules from the Technical Notes section above are handled by the composition — you just need to ship a clean spec.

If `thumbnail-spec.json` doesn't exist or the spec is missing fields, the renderer warns and skips. Write the spec in the same conversation as the concepts so the handoff is one step.

## Self-Check

Before delivering, verify:
- [ ] Three concepts use genuinely different visual strategies (not three variations of the same idea)
- [ ] Text overlays are 3-5 words each (not sentences)
- [ ] Visual descriptions are specific enough to execute (not "something eye-catching")
- [ ] Color choices use the Meridian palette with appropriate contrast notes
- [ ] Production methods are realistic (don't spec something that requires tools you don't have)
- [ ] The contradiction or decoder insight is visible in at least 2 of 3 concepts
- [ ] None of the concepts use clickbait aesthetics (red arrows, shocked faces, ALL CAPS IMPACT)
