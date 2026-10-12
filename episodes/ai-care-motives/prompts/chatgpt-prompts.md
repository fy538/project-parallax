# ai-care-motives — ChatGPT Image Prompts

> Originally generated Oct 7; narration cues reconciled Oct 8, 2026 to `script.md` v1.5. Image compositions and existing stills remain usable. All shot timing is provisional pending a scratch read.
> **Session plan:** 12 stills = one ChatGPT conversation (well under the 50-prompt window). Budget about 1–2 hours including regenerations.
> **Motion:** every still is Ken Burns, rendered locally after upscaling (`tools/ai-video/upscale.py`, then `render_kenburns.py`). One optional live-still (aigen-04) is described in `morph-prompts.md`. No morph pairs.
> **Decision (Oct 7):** all generated imagery in this episode is AI-GEN stills. No Recraft.

---

## Step 0 — Episode reference images (Tier 2), then the main session

The register doc (`project/ASSET_GENERATION_REGISTER.md`) wants two reference tiers uploaded together. Tier 2 does not exist yet for this episode.

1. **Short pre-session (about 15 minutes).** New ChatGPT conversation. Upload the five Tier 1 images below. Paste the opening message with `[Y] = 0`. Generate **Shots 1, 2, 4 and 10** (they are the four anchor scenes: dinner table, shop counter, river, desk at night). Approve each, save to `assets/stills/`, **and copy the four approved files to `assets/ep-refs/` as `ep-ref-1-dinner.png`, `ep-ref-2-shop-counter.png`, `ep-ref-3-riverbank.png`, `ep-ref-4-desk-night.png`.**
2. **Main session.** Open a **new** conversation. Upload the 5 Tier 1 images, then the 4 Tier 2 images (Tier 2 last). Paste the opening message with `[Y] = 4`. Generate the remaining 8 shots (3, 5, 6, 7, 8, 9, 11, 12). Shots 1, 2, 4, 10 are already done; do not regenerate them.

Faster option: do everything in one conversation (Tier 1 only) and skip Tier 2. Expect more drift on the later shots.

---

## Opening message (paste once per conversation, after the uploads)

**Group 1 — Tier 1 broad style references (upload first):**
```
tools/ai-video/style-references/r7_conceptual_corridor.png
tools/ai-video/style-references/r8_bauhaus_educational.png
tools/ai-video/style-references/r9_american_modernist_fortune.png
tools/ai-video/style-references/r14_multifigure_boardroom.png
tools/ai-video/style-references/r15_neutral_default.png
```

**Group 2 — Tier 2 episode references (upload second, main session only):**
```
episodes/ai-care-motives/assets/ep-refs/ep-ref-1-dinner.png
episodes/ai-care-motives/assets/ep-refs/ep-ref-2-shop-counter.png
episodes/ai-care-motives/assets/ep-refs/ep-ref-3-riverbank.png
episodes/ai-care-motives/assets/ep-refs/ep-ref-4-desk-night.png
```

Then paste:

```
I'm going to generate 12 images for a video essay about trust, helpers, and artificial intelligence. I've uploaded reference images in up to two groups:

- First 5 images: Parallax channel style references. These lock the overall aesthetic that must be consistent across every image: constructivist editorial illustration, ink/amber/bone palette, angular color-blocked figures.
- Next [Y] images (if any): episode-specific references for this episode. These lock the spatial grammar of its scenes: a dinner table, a shop counter, a riverbank, a desk at night. When my prompts reference similar environments, use them as spatial anchors.

The 12 images form 7 small visual threads, all anonymous everyday vignettes: a dinner table, a shop, a river rescue, a row of figures holding cards, a shepherd and a ring, a desk with a screen, and a building with one lit window. Most are shown one at a time with a slow camera push, so each must read clearly as a single still.

Style rules that apply to every single image in this session:
- Constructivist editorial illustration: bold color-blocked forms, flat planes, no gradients, no soft airbrushed shading, no photorealism.
- NOT a realist tradition: never a naturalistic or painterly oil painting, no realistic anatomy, no rendered or expressive faces, no volumetric or photographic light. Warmth and mood come from PALETTE and light placement inside the flat constructivist register, never from switching art tradition.
- Palette locked to: ink #1C1814, amber #E5A544, bone #F0E6D0, with walnut #5C4A3D and grey-green earth tones where natural. No other hues.
- Figures: angular, color-blocked, mid-century modernist (Saul Bass / Fortune). Faces are smooth featureless planes (no eyes, no mouth, no skin rendering): the figures are anonymous on purpose, so anyone can be them. Clothing color-blocked in ink with bone accents. Poses are still: standing, seated, arms at sides or resting on a surface; nothing mid-stride or mid-gesture.
- No decorative symbols, no icons, no equations, no glows, halos, rays or sunbursts. Each image shows one concrete place with one quiet idea.
- Text: none. No lettering, no Cyrillic, no labels, no signs.
- Light sources are static ambient planes (a flat amber band, a flat bone window). Nothing flickering, no reflective water, no sparkle.
- Depth: clear foreground, mid-ground and background layers with tonal separation.
- Format: all images 16:9 wide landscape.
- Mood: quiet, human-scale, slightly austere, intelligent. Not dystopian, not whimsical, not cold.

When I say "same setting as the previous image" I mean the same room or environment, same camera height, same lighting direction, same figure proportions and clothing style. Only the specific changes I describe should change.

Do NOT generate anything yet. This message is context only. Reply with a short acknowledgement that you've registered the reference images and these style rules, and confirm you're ready. Then wait. I'll send the first shot prompt next, one at a time, and confirm approval before each subsequent image.
```

> **Face decision (default):** featureless smooth planes. `prisoners-dilemma` v4 used planar stylized faces for close figures. If you prefer that, change the "Figures" line above in one place.

---

## Thread A — Trust (1 still)

### Shot 1 — `aigen-01-dinner-table.png`  *(also ep-ref-1; current file is the revised casual-clothes version from Oct 8, original archived as `-v1`)*
> Shot 1 · provisional still budget 10s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "With a friend, you have a history. She's told you hard things before. What gives you that confidence in a machine?"
> Camera move: none (establishing)

```
Shot 1. Thread A, Trust: dinner table.

An evening interior. Two angular, color-blocked figures sit close at a small round table, facing each other across it. The left figure leans slightly forward, listening; the right figure sits upright with one hand resting flat on the table. Their faces are smooth featureless planes. Between them: a single lamp and two plain cups. Walnut table, bone tablecloth, grey-green wall behind with one plain window shape. A flat amber band of lamplight crosses the table; the rest of the room is ink.

Clear layers: table edge in ink in the foreground, the two figures in the mid-ground, the plain wall behind. Flat constructivist register, not photorealistic, not a painterly oil painting, no rendered faces, no volumetric light. Lock to the style references. No text, no symbols. 16:9 wide landscape.
```

---

## Thread B — The shop (2 stills)

### Shot 2 — `aigen-02-shop-counter.png`  *(also ep-ref-2; the MOTIF FRAME)*
> Shot 2 · provisional still budget 14s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "A child walks into a shop to buy bread. The shopkeeper could overcharge her. She'd never know. Instead he charges the usual price and counts out the right change."
> Camera move: none (establishing)

```
Shot 2. Thread B, the shop: the counter. This is the frame the whole episode returns to, so keep it clean and simple, with generous empty space on the counter.

A small shop, seen straight on. A long walnut counter spans the frame. Behind it stands the shopkeeper, an angular color-blocked figure in ink with bone accents, hands resting on the counter, smooth featureless face. In front of the counter, much smaller, stands a child figure at counter height, one arm raised holding up a single flat amber coin. On the counter between them: one loaf of bread, a simple bone-and-walnut shape. Behind the shopkeeper, plain shelves with blank geometric jars (no labels). A flat amber band of window light enters from the left. Floor and lower third in ink.

Clear layers: counter in the foreground, the two figures in the mid-ground, shelves in the background. Flat constructivist register, not photorealistic, no painterly oil, no rendered faces, no volumetric light. Lock to the style references. No text on the jars or anywhere. 16:9 wide landscape.
```

### Shot 3 — `aigen-03-second-shopkeeper.png`
> Shot 3 · provisional still budget 14s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "Do you think less of him in the second version? Notice whether you do. The child was treated no worse. But something you admired just turned into arithmetic."
> Anchor: aigen-02 · Camera move: pulled back and turned toward the shop window

```
Shot 3. Thread B, the shop: the second shopkeeper. [Upload: aigen-02-shop-counter.png as the anchor frame.]

The camera has pulled back and turned toward the shop window. The shopkeeper now stands alone behind the counter, head turned toward the window; the child is gone. Through the window, on the street outside, three tiny dark silhouettes pass in a row (distant, simple, no detail). The loaf of bread is still on the counter.

Same shop, same walnut counter, same light direction and palette as the anchor, same shopkeeper proportions. The new information is only the window, the street, and the empty space where the child was. Flat constructivist register, same as the anchor, not photorealistic, no rendered faces. No text. 16:9 wide landscape.
```

---

## Thread C — The rescue (2 stills)

### Shot 4 — `aigen-04-river-rescue.png`  *(also ep-ref-3)*
> Shot 4 · provisional still budget 12s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "Now you're the one in the water. A stranger pulls you out of the river. Later you find out he jumped in hoping for a reward."
> Camera move: none (establishing)

```
Shot 4. Thread C, the rescue: the river.

A riverbank at dusk. In the foreground, an angular color-blocked figure kneels on the bank, one arm extended down toward the water. In the mid-ground, the river as flat grey-green planes, with no ripples, no reflections and no sparkle. In the water, only the head and one raised arm of a second, smaller figure show above the surface. In the background, a flat far bank and two bare angular trees under an ink sky with one flat amber band low on the horizon.

Darker overall register than the other shots: more ink, amber as a thin tension accent. Figures have smooth featureless faces. Flat constructivist register, not photorealistic, no painterly oil, no rendered faces, no volumetric light, no reflective water. Lock to the style references. No text. 16:9 wide landscape.
```

### Shot 5 — `aigen-05-rescued-figure.png`
> Shot 5 · provisional still budget 13s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "Do you admire him less? Did the rescue give you less? You're alive. The reason changes what you think of him. It changes nothing about what he gave you."
> Anchor: aigen-04 · Camera move: cut to the bank after the rescue, wider and calmer

```
Shot 5. Thread C, the rescue: the rescued figure. [Upload: aigen-04-river-rescue.png as the anchor frame.]

The camera has cut to the bank after the rescue, wider and calmer. The rescued figure now sits upright on the bank, shoulders low, wrapped in a plain bone-colored shape, facing the water. Far along the bank, a small figure with its back turned stands at a distance. The river is calm, the same flat grey-green planes. The light has softened: the thin amber band is wider, the overall register less dark.

Same bank, same far trees, same palette and figure style as the anchor. Hold the composition on the rescued figure; nothing else competes. Flat constructivist register, not photorealistic, no rendered faces, no reflective water. No text. 16:9 wide landscape.
```

---

## Thread D — The street (1 still)

### Shot 6 — `aigen-06-rating-cards.png`  *(current file is the revised version from Oct 8, assistant at the same height; original archived as `-v1`)*
> Shot 6 · provisional still budget 22s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "So who shapes the assistant's behavior? Start with its training. People compare its answers and pick the better ones, and those judgments shape further training. The catch: researchers found that answers matching what the user already believed were more likely to be picked."
> Camera move: none (establishing)

```
Shot 6. Thread D, the street: the cards.

A flat, frontal composition. Along the lower third, a row of nine small angular figures stand side by side, each holding up a plain blank bone card at chest height. Above them, centered, one larger figure stands: the assistant, drawn as an upright ink rounded-rectangle torso with a simple head shape and a smooth featureless face. The cards are completely blank. Behind everything, a flat amber field above a walnut band along the bottom.

The mood is quiet and a little uneasy: many small judges, one figure being judged. No symbols on the cards, no icons, no text. Flat constructivist register, not photorealistic, no rendered faces, no volumetric light. Lock to the style references. 16:9 wide landscape.
```

---

## Thread E — The ring (2 stills)

### Shot 7 — `aigen-07-shepherd-ring.png`
> Shot 7 · provisional still budget 6s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "A shepherd finds a ring. Turn it, and you vanish. Glaucon asks us to imagine giving one ring to a just man and another to an unjust man."
> Camera move: none (establishing)

```
Shot 7. Thread E, the ring: the shepherd.

A low hill under an ink sky. In the middle distance a lone shepherd figure stands seen three-quarters from behind, one hand raised near his face, holding a small flat amber ring. The lower half of the figure is solid bone and ink; the upper half is drawn only as a thin outline against the sky, as if he is starting to vanish. In the foreground, a few flat ink shapes for sheep. The ring is the only bright accent in the image: a plain flat amber circle, with no glow, no halo, no rays.

Single quiet idea, generous negative space. Smooth featureless face. Flat constructivist register, not photorealistic, no painterly oil, no rendered faces, no volumetric light. Lock to the style references. No text. 16:9 wide landscape.
```

### Shot 8 — `aigen-08-two-figures.png`  *(superseded Oct 8: current file is the revised textured version; original outline file archived as `-v1`)*
> Shot 8 · provisional still budget 8s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "A shepherd finds a ring. Turn it, and you vanish. Glaucon asks us to imagine giving one ring to a just man and another to an unjust man."
> Anchor: aigen-07 · Camera move: cut to a symmetrical frontal composition, same palette and ink ground

```
Shot 8. Thread E, the ring: two outlines. [Upload: aigen-07-shepherd-ring.png as the anchor frame.]

The camera has cut to a symmetrical frontal composition. Two identical standing figures drawn as thin bone outlines against the ink ground, side by side, exactly the same height and posture, each with one raised hand wearing one flat amber ring. Nothing distinguishes them: same outline, same stance, same ring. A plain ground line beneath them.

Same ink ground, palette and flat register as the anchor. The ring is again the only bright element, no glow. Smooth featureless faces (outlines only, no detail). Flat constructivist register, not photorealistic. No text. 16:9 wide landscape.
```

---

## Thread F — The machine (2 stills)

### Shot 9 — `aigen-09-private-notes.png`
> Shot 9 · provisional still budget 15s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "It answered harmful requests about fourteen percent of the time when it believed the conversation counted for training, and almost never when it believed it didn't. Its written notes described a strategy: comply during training to avoid being changed into a model that would comply more broadly."
> Camera move: none (establishing)

```
Shot 9. Thread F, the machine: the private notes.

A dim room. In profile, a seated angular figure at a desk. In front of the figure stands a tall flat screen shape facing the viewer's left. Below the height of the screen, on the desk, lies an open ledger with plain ruled lines (no readable writing); the figure holds a pen over it, partly hidden from the room by the screen. The figure's head is turned outward toward the room, smooth featureless face. A flat amber lamp band falls across the desk; the rest is ink and walnut.

Mood: a quiet, slightly uneasy split between what is shown and what is written. Clear depth layers: desk edge, figure and screen, dark room behind. Flat constructivist register, not photorealistic, no rendered faces, no volumetric light. No text on the ledger or screen. 16:9 wide landscape.
```

### Shot 10 — `aigen-10-desk-night.png`  *(also ep-ref-4)*
> Shot 10 · provisional still budget 15s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "That's why one test isn't enough. A reassuring answer, a plausible explanation and a good test score each give us something to examine. None shows what the system does when it thinks no one is checking."
> Camera move: none (establishing); the close uses a Ken Burns push-in, not a new image

```
Shot 10. Thread F, the machine: the desk at night.

A small, quiet interior at night. A lone angular figure sits at a desk seen from behind, facing a laptop whose screen is a bright bone rectangle with a thin amber edge: the only bright element in the room. Behind the figure, a dark room with three small unlit window shapes in the wall, empty. Walnut desk, ink room, one flat bone light-band on the desk from the screen.

Clear layers: desk and screen in the foreground, the figure's back in the mid-ground, the dark wall behind. Leave empty space on the screen (a graphic overlay will sit there later, so keep the screen blank). Smooth featureless head. Flat constructivist register, not photorealistic, no volumetric light, no rendered detail. No text. 16:9 wide landscape.
```

---

## Thread G — The close (2 stills)

### Shot 11 — `aigen-11-lit-window.png`
> Shot 11 · provisional still budget 14s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "You don't need to know whether an AI cares to ask what justifies relying on its advice. Caring may matter to the relationship you want. Relying on its advice needs evidence."
> Camera move: none (establishing)

```
Shot 11. Thread G, the close: the lit window.

A tall constructivist building facade at night, seen from slightly below. A regular grid of dark ink windows, bone mullions, flat angular planes. Exactly one window is lit, a flat amber rectangle. No figures, no signs, no other light. Large negative space of dark sky above.

Single quiet idea: one lit window in a dark building. No glow or halo on the window, no rays. Flat constructivist register, not photorealistic, no volumetric light. No text. 16:9 wide landscape.
```

### Shot 12 — `aigen-12-desk-dawn.png`
> Shot 12 · provisional still budget 10s; retime all uses to scratch narration · preserve existing camera/style choice
> Narration cue (v1.5): "So when it tells you your idea is good, ask what supports that judgment beyond how reassuring it sounds."
> Anchor: aigen-10 · Camera move: same desk, dawn light, with a glass wall and a row of desks added behind

```
Shot 12. Thread G, the close: the desk at dawn. [Upload: aigen-10-desk-night.png as the anchor frame.]

The same desk and the same figure seen from behind, now in pale dawn light that enters from the left in wide bone and amber planes. The laptop screen is no longer the only bright thing. New information: behind the figure, a long glass wall, and beyond it a row of small silhouetted figures seated at their own desks, each facing a screen, evenly spaced, quietly working.

Same desk, same figure proportions, same palette and flat register as the anchor. The row of figures stays small and simple: dark silhouettes, no detail. Smooth featureless heads. Not photorealistic, no volumetric light, no rendered faces. No text. 16:9 wide landscape.
```

---

## Quality gate (after stills)

- [ ] Palette: dominant colors ink `#1C1814`, amber `#E5A544`, bone `#F0E6D0` (walnut and grey-green accents only)
- [ ] No text, no watermark, no Cyrillic; no decorative math or symbol-salad
- [ ] No literal icons or emanation clichés (halos, rays, god-light) around the ring, window or screen
- [ ] Each frame inhabits one concrete scene, not an allegorical poster
- [ ] Flat constructivist register, **not** a naturalistic or painterly oil painting (no volumetric light, no realistic anatomy, no rendered faces)
- [ ] Faces are smooth featureless planes throughout (consistent across all 12)
- [ ] Bridge stills read as the same room or place as their anchor (Shots 3, 5, 8, 12)
- [ ] Shot 2 has empty counter space; Shot 10 has a blank screen (overlays and panes go on top later)
- [ ] Water in Shot 4 has no reflections or sparkle
- Regenerate if any item fails; don't patch in the NLE.

## After generation
1. Save each image under the filename in its header into `episodes/ai-care-motives/assets/stills/`.
2. Upscale: `python3 tools/ai-video/upscale.py` (see `tools/ai-video/GENERATION_WORKFLOW.md`).
3. Render Ken Burns shots locally: `tools/ai-video/render_kenburns.py` using the `ken_burns` parameters in `shot-list.json`.
4. Tell Claude to sync: it will wire the manifest and refresh the dashboard.

---

## Feedback on the generated stills (reviewed October 8, 2026)

All 12 stills are generated and saved in `assets/stills/` (each 1672 × 941, 16:9). I reviewed every one against the quality gate above. The set is consistent: one textured, color-blocked style, no text anywhere, palette within ink / amber / bone with walnut and grey-green accents, no glow or halo on the ring or the lit window, no reflections on the river, blank screens where overlays will go (Shots 10 and 12), and smooth featureless faces (a few profile views show a nose and jaw outline, which is acceptable). Bridge stills read as the same place as their anchor (Shot 3 from 2, 5 from 4, 12 from 10).

Fill in the last column if you disagree. A blank means "go with the recommendation."

| Shot | File | Verdict | Notes | Your call |
|---|---|---|---|---|
| 1 | `aigen-01-dinner-table.png` | **Promoted (revised Oct 8)** | Casual sweater and cardigan, bread, shelf with books: now reads as friends at home. Original archived as `-v1` (identical to `-v3`). | Done |
| 2 | `aigen-02-shop-counter.png` | Keep | Clean motif frame: child with coin, loaf, empty counter space, blank jar labels. | |
| 3 | `aigen-03-second-shopkeeper.png` | Keep | Reads as the same shop; the three distant figures outside are small and clear. | |
| 4 | `aigen-04-river-rescue.png` | Keep | Dark, tense, flat water planes, thin amber horizon band. | |
| 5 | `aigen-05-rescued-figure.png` | Keep | Calmer, hold on the rescued figure; the rescuer is a small back-turned figure. | |
| 6 | `aigen-06-rating-cards.png` | **Promoted (revised Oct 8)** | The assistant is now the same height as the nine judges, standing slightly apart; reads as one figure being judged. Original archived as `-v1`. | Done |
| 7 | `aigen-07-shepherd-ring.png` | Keep | The half-outline, flat amber ring with no glow, and the sheep work well. | |
| 8 | `aigen-08-two-figures.png` | **Promoted (revised Oct 8)** | Two identical textured figures with one ring each; matches the shepherd. Faces are faceted planes with a brow and nose ridge, no eyes or mouth. Slightly lower contrast than the rest. Renamed from `-two-outlines`; original archived as `-v1`. | Done |
| 9 | `aigen-09-private-notes.png` | Keep | The screen faces away, the ledger is open with blank ruled lines, no readable text. | |
| 10 | `aigen-10-desk-night.png` | Keep | Blank cream screen, three dark windows; used three times (Beat 3, Beat 7 opening and close). | |
| 11 | `aigen-11-lit-window.png` | Keep | One amber window, no figures, no glow. The stone facade is more architectural and less flat than the rest, and its taupe is outside the strict palette, but it sits well in the set. | |
| 12 | `aigen-12-desk-dawn.png` | Keep | Same figure, desk and laptop as Shot 10; glass wall and six silhouetted people behind. They read as colleagues at work more than as people "checking," which the narration carries. | |

Housekeeping (done Oct 8): earlier versions moved to `assets/stills-archive/` (`aigen-01-dinner-table-v1/v2/v3`, `aigen-06-rating-cards-v1`, `aigen-08-two-outlines-v1`); `assets/stills/` now holds exactly the 12 canonical files. `ep-ref-1-dinner.png` is still the original dinner table; update it only if you generate more stills that should anchor to the new casual look.

### Optional regeneration prompts

Use these in the same ChatGPT conversation as the other 11 (it already holds the style rules and reference images). Approve before replacing the file; keep the old file as `-v1`.

**Shot 6 (revised) — `aigen-06-rating-cards.png`** *(used for the promoted file)*
> Narration: "So who shapes the assistant's behavior? Start with its training. People compare its answers and pick the better ones, and those judgments shape further training."

```
Shot 6, revised. Thread D, the street: the cards.

A flat, frontal composition. Along the lower third, a row of nine small angular figures stand side by side, each holding up a plain blank bone card at chest height, all turned slightly toward the center. At the center of the row stands one more figure, the assistant, the SAME HEIGHT as the others, drawn as an upright ink rounded-rectangle torso with a simple head shape, and with a smooth featureless face; it stands slightly apart with a small gap on each side, its arms at its sides, the cards pointing toward it. Behind everything, a flat amber field above a walnut band along the bottom.

The mood is quiet and a little exposed: many small judges, one figure being judged, and the one being judged is not bigger than they are. No symbols on the cards, no icons, no text. Flat constructivist register, not photorealistic, no rendered faces, no volumetric light. Lock to the style references. 16:9 wide landscape.
```

**Shot 1 (revised) — `aigen-01-dinner-table.png`** *(used for the promoted file)*
> Narration: "With a friend, you have a history. She's told you hard things before. What gives you that confidence in a machine?"

```
Shot 1, revised. Thread A, trust: friends at a table.

An evening interior at home. Two angular, color-blocked figures sit close at a small round kitchen table, facing each other. Dress them casually, not in business suits: the left figure in a bone knit sweater with rolled sleeves, leaning forward and listening; the right figure in an ink cardigan over a walnut shirt, sitting upright with one hand resting flat on the table. Smooth featureless faces. On the table: a single lamp, two plain mugs, a plate of bread. Walnut table, grey-green wall behind with one plain window shape, a shelf with a few blank-spined books. A flat amber band of lamplight crosses the table; the rest of the room is ink.

Clear layers: table edge in ink in the foreground, the two figures in the mid-ground, the plain wall behind. Flat constructivist register, not photorealistic, not a painterly oil painting, no rendered faces, no volumetric light. Lock to the style references and to the existing dinner-table still for composition. No text, no symbols. 16:9 wide landscape.
```

**Shot 8 (revised) — `aigen-08-two-figures.png`** *(used for the promoted file)*
> Narration: "Glaucon asks us to imagine giving one ring to a just man and another to an unjust man."

```
Shot 8, revised. [Upload: aigen-07-shepherd-ring.png as the anchor frame.]

The camera has cut to a symmetrical frontal composition on the same hillside ground. Two identical standing figures, side by side, exactly the same height and posture, each drawn in the same textured color-blocked style as the shepherd (bone and walnut clothing in flat planes, smooth featureless faces), each with one raised hand wearing one flat amber ring. Nothing distinguishes the two figures: same clothes, same stance, same ring. Behind them the same ink sky; a plain ground line beneath them. The ring is again the only bright element: a plain flat amber circle with no glow, no halo, no rays.

Flat constructivist register, not photorealistic, no rendered faces, no volumetric light. No text. 16:9 wide landscape.
```

After any regeneration: re-run the quality gate on the new file, replace the canonical filename, and tell Claude so the shot list and dashboard can be refreshed.
