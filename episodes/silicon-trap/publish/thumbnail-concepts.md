# THUMBNAIL CONCEPTS

> ⚠️ Typography references below predate D40 (May 10, 2026). "Space Grotesk" mentions in this file are stale — the display face is now **IBM Plex Sans** (Plex Bold/Black for headlines). Substitute when implementing; the layout and color guidance is otherwise current.

## Episode: EP01 — The Silicon Trap / 硅陷阱
## Date: May 2, 2026

---

### Concept A: The Juxtaposition

**Visual:** Left side: gleaming blue semiconductor wafer on a white laboratory surface (extreme macro, ~150px wide). Right side: bold numerical contrast — large amber "$165B" stacked above rust "$0 profit" or "7% output" (2-3x larger than wafer image). The wafer and numbers should feel like they're pushing against each other, not balanced. Thin amber dividing line down the center. Dark ink background (#1C1814).

**Text overlay:** "TRIUMPH & TRAP" — Space Grotesk, all caps, 48pt, bone color (#F0E6D0), centered above the composition. Positioned in the upper third of the frame to leave safe area.

**Color treatment:** Meridian palette — ink background (primary), amber for the divider and "$165B" (primary accent), rust for the "0% success" or "7% share" stat (conflict accent), bone for text (highest contrast on dark background). The warm umber background makes the amber and rust sing.

**Why it works:** The left-right tension creates immediate cognitive dissonance: a perfect chip / a failed strategy. The $165B figure anchors the contradiction. The viewer's brain resolves "that's a lot of money" and "but it didn't work" in the first 300ms. This is the episode's core paradox compressed into physics.

**Production method:** BrandImage component (Remotion) with SVG overlay: macro stock photo of silicon wafer (treated with conflict mode for subtle ink wash), vector typography layer, and thin geometric divider. Can also be produced as a Figma export → PNG if static rendering is preferred. Total complexity: moderate (wafer sourcing + typography positioning).

---

### Concept B: The Data Provocation

**Visual:** Dominant center text: "$165 BILLION" in very large amber (#E5A544) type (62pt+, bold, Space Grotesk). Below it in smaller bone text: "→ 7% solution" or "← Same problem" (22pt). Background is split: top half shows a subtle, darkened close-up of a wafer under a lithography machine (very dark, minimal detail, 30% opacity); bottom half is pure ink black. No additional graphics — text is the sole visual hierarchy.

**Text overlay:** None (the stat IS the overlay). The bottom of the frame holds the "7%" subtext.

**Color treatment:** Meridian palette — ink background, amber for the hero stat, bone for the supporting text. The wafer background fades to black, creating depth. Ultra-high contrast: amber on ink is the gold standard for thumbnail legibility at 120×68px.

**Why it works:** The "$165B" creates immediate "wait, what?" curiosity. The arrow or ambiguous reference ("same problem") below it creates the semantic gap. The viewer is compelled to click to understand why the largest investment produced the smallest strategic result. This is a pure numbers-based contradiction hook — no metaphor required.

**Production method:** Typography-only layout with background video fade or darkened still image. Can be created as a simple Remotion DataChart variant or a designed Figma tile. No complex sourcing required. Fastest to produce of the three concepts.

---

### Concept C: The Symbolic

**Visual:** Center composition: a detailed line-drawn geometric illustration of a chip cross-section (overhead perspective) rendered in amber (#E5A544) and bone (#F0E6D0) on an ink (#1C1814) background. The chip design should resemble a Go board in its grid structure — simultaneous suggestion of both microchip architecture and the game metaphor. Single ∴ (therefore) brand mark positioned in the upper right corner, subtle rust color (#C23B22). Composition is clean, symmetric, high-craft. No extraneous elements.

**Text overlay:** "THE SILICON TRAP" in Space Grotesk, bone color, all caps, 40pt, positioned below the chip illustration. Minimal, centered, letting the visual carry weight.

**Color treatment:** Meridian Dark mode — ink background, amber and bone for the geometric pattern (high contrast geometric illustration), rust for the ∴ mark (subtle brand accent). The composition should feel like a precision instrument or a technical diagram — no soft gradients or emotional texture. This is "analytical rigour made visible."

**Why it works:** Viewers who care about *design* and *concept* over urgency are drawn to this. The chip-as-go-board motif visually encodes the episode's core metaphor before the viewer reads any text. It's the least clickable of the three (no urgency, no contradiction stat) but the most brand-building — viewers will recognize "that's a Parallax thumbnail" because of the geometric craft and the play between silicon and strategy. Elevates the channel's perceived quality and uniqueness in a crowded space. Best for mid-funnel retention rather than cold-acquisition discovery.

**Production method:** Claude SVG generation (geometric symmetry, line-based illustration — within Claude SVG strengths). Prompt: "Overhead view of a semiconductor chip with a grid structure that subtly echoes a Go board. Use only geometric shapes, straight lines, and clean angles. Include the ∴ mark in the upper right. Meridian palette: amber (#E5A544) and bone (#F0E6D0) lines on ink (#1C1814) background." Production time: ~15 minutes (SVG + Remotion integration).

---

## Recommendation

**Test Concept A first** (The Juxtaposition).

*Rationale:* It directly sells the episode's cognitive hook (technical triumph / strategic failure) without requiring the viewer to already understand the chip-vs-go metaphor. A/B testing should run this against Concept B for 48 hours, then evaluate click-through rates. Concept C can be tested as a secondary variant once the channel has more data on how "design-first" branding performs.

The Juxtaposition balances EDITORIAL_PLAYBOOK.md's anti-clickbait stance (no red arrows, no shocked faces) with high click-motivation (visual contradiction = natural curiosity gap). It leverages the Meridian palette's warmth and the episode's immediate narrative tension.

---

## Text Overlay Variants

### For Concept A (The Juxtaposition) — A/B test these text alternatives:

**Variant 1 (Recommended):** "TRIUMPH & TRAP"
- Captures both the paradox and the named concept
- 3 words (within range), dramatic but not sensational
- Sets up the decoder question: "How can success and failure coexist?"

**Variant 2:** "THE PARADOX"
- Shorter, more mysterious
- Leans into the "something doesn't add up" feeling
- Risk: less specific to the episode's uniqueness

**Variant 3:** "$165B PROBLEM"
- Leads with the largest, most concrete number from the script
- Shorter, clickable, data-first
- Risk: obscures the paradox (why is a large investment a problem?)

**Variant 4:** "SUCCESS = FAILURE"
- Equation-based, philosophical
- Echoes the decoder posture (contradiction resolved through reframing)
- Risk: too abstract for cold discovery; better for subscribers who already know Parallax's voice

**Variant 5:** "BUILT TO FAIL"
- Four words, loaded inference
- Shorter than Variant 1, more provocative
- Risk: reads slightly clickbaity; could imply conspiracy framing (NAR-13 toxin line) if not careful — recommend only if paired with visual clarity (the chip + stats make it clear this is structural, not intentional conspiracy)

**Recommendation:** Start with **Variant 1** ("TRIUMPH & TRAP"). If CTR plateaus after 48h, test Variant 3 or 5 against it. Variants 2 and 4 are stronger for retargeted audiences who already follow the channel.

---

## Technical Notes

**Resolution:** 1280×720 (YouTube standard)

**Safe area:** All text and critical visual elements must be within the inner 960×540 (leaving 160px margin on each side). YouTube overlays "WATCH LATER" button in bottom-right corner and timestamp in bottom-right corner.

**File format:** PNG (maximum compression — thumbnails are cached at multiple sizes; 150KB+ causes slower delivery on mobile)

**Rendering system:** 
- Concept A & B: Remotion BrandImage + typography components, or Figma → PNG export
- Concept C: Claude SVG → Remotion ShortsWrapper integration → rendered PNG

**Mobile legibility check:** At 120×68px (typical mobile YouTube home feed), the text overlay must remain readable. Test by zooming out to 15% in Figma or exporting as 120×68 and verifying. Amber on ink meets this requirement; bone text at 40pt+ will also read clearly.

**Competitive differentiation:** Parallax thumbnails should never include:
- Curved arrows (CaspianReport standard)
- Red borders or panic color treatment (generic geopolitics YouTube)
- Fragmented layouts with 4+ elements
- Dropped shadows (reads as lower production value)
- Any use of "SHOCKING," "REVEALED," "SECRET," or ALL CAPS urgency language

All three concepts avoid these anti-patterns. The visual hierarchy comes from contrast and composition, not sensationalism.

---

## Next Steps

1. **Tiger reviews this document** (reading time: ~5 min)
2. **Pick a concept** or suggest a hybrid (e.g., "Concept A text with Concept C's geometric chip illustration")
3. **Select text variant** for A/B testing (default: Variant 1 for Concept A)
4. **Source/generate the selected concept** (wafer macro sourcing for A, wafer fade for B, Claude SVG for C)
5. **Produce the 1280×720 PNG** using selected method
6. **Export 3-4 size variants** (240×135, 480×270, 1280×720) for testing across YouTube surfaces
7. **Publish alongside EP01 video** and track CTR/impression data via YouTube Studio
8. **Retro loop:** After 7 days, compare CTR across concepts (if A/B tested). Feed results into EDITORIAL_PLAYBOOK.md as a new thumbnail-related rule for future episodes (see LEARNING_LOG.md template structure).
