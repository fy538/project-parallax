# Prisoners Dilemma — ChatGPT Image Prompts v4 (Full Fresh Session)

> **Start a brand new conversation.** All 29 shots — the 17 originals and 12 bridges — are generated together so the whole episode shares one consistent style.
>
> Shots are ordered by **thread**, not episode order. Each anchor is generated immediately before its bridge so ChatGPT's memory of the anchor is live — no re-uploads needed for adjacent pairs.
>
> **Motion model (v4, per `project/CHAINED_STILL_LESSONS.md`):** these stills feed THREE different motion techniques downstream, and only some pairs are morphs. The full per-shot/per-seam plan lives in `shot-list.json`. The short version:
> - **6 pairs are true MORPHS** (marked ⟳ below): `06→06b`, `06b→07`, `11→11b`, `12→12a`, `12a→13`, `15→forecast-01`. For these the two frames must be **spatially tight** — generate frame B by changing ONLY the described element so a video model can interpolate.
> - **Most other shots are Ken Burns** (camera push on one still, rendered locally — no AI video) or **live-stills** (subtle subject motion). For these, bridges just need to be a believable *closer/adjacent view in the same setting*; pixel-tight match isn't required.
> - **Faces:** CLOSE figures get planar stylized faces (skin-toned, simplified planes), NOT black silhouettes. Distant/small figures stay silhouettes.
>
> Thread C is a 3-shot version (06 → 06b → 07); it supersedes `development/scenes/wrong-game-establish.md`.
>
> After generation: save each image as the filename shown into `assets/stills/`. Ken Burns shots auto-render via `tools/ai-video/render_kenburns.py` (after `upscale.py`); the 6 morph pairs go to Pika per `development/visual-thread-design.md` §7.

---

## Opening — paste once at the start of the session

**Upload 9 reference images before pasting anything.** Two groups, in this order:

**Group 1 — Broad Parallax style refs (5 images, upload first):**
```
tools/ai-video/style-references/r7_conceptual_corridor.png
tools/ai-video/style-references/r8_bauhaus_educational.png
tools/ai-video/style-references/r9_american_modernist_fortune.png
tools/ai-video/style-references/r14_multifigure_boardroom.png
tools/ai-video/style-references/r15_neutral_default.png
```

**Group 2 — Episode-specific refs (4 images, upload second):**
```
episodes/prisoners-dilemma/assets/ep-refs/ep-ref-1-rand-interior.png
episodes/prisoners-dilemma/assets/ep-refs/ep-ref-2-game-board-landscape.png
episodes/prisoners-dilemma/assets/ep-refs/ep-ref-3-cooperative-assembly.png
episodes/prisoners-dilemma/assets/ep-refs/ep-ref-4-decision-threshold.png
```

Upload order matters — ChatGPT weights more-recent context more heavily, so the episode-specific refs should land last, right before this message.

**The 9 refs are uploaded ONCE, with the opening message below.** Individual shot prompts do NOT need new ref uploads — ChatGPT carries the style from these 9 plus the image it generated immediately before. (The only re-upload you'd ever do is if a shot drifts badly and you want to re-anchor it.)

**Which ep-ref anchors which shots** (all 4 stay loaded the whole session — this is just where each is most relevant):

| Ep-ref | Anchors these shots |
|---|---|
| `ep-ref-1-rand-interior` | Thread A office + corridor (Shots 1–6); Thread C room interior (Shot 13) |
| `ep-ref-2-game-board-landscape` | Thread C grid-landscape (Shots 11–12); panoramas (Shots 28–29) |
| `ep-ref-3-cooperative-assembly` | Thread E cooperation arc (Shots 16–21); Thread D markets (Shots 14–15) |
| `ep-ref-4-decision-threshold` | doorway (Shot 6); horizon/cliff (Shots 24–25); figure-at-edge (Shot 29) |

The 5 broad style refs apply to **every** shot (they lock the house aesthetic, not a specific scene).

Then paste:

```
I'm going to generate 29 images for a geopolitics video essay. I've uploaded 9 reference images in two groups:

- First 5 images: Parallax channel style references. These lock the overall aesthetic that must be consistent across all 29 images — constructivist editorial illustration, ink/amber/bone palette, angular color-blocked figures.
- Next 4 images: Episode-specific references for this episode (The Prisoner's Dilemma). These lock the spatial grammar of this episode's particular environments — the RAND office interior, game-board landscape compositions, cooperative outdoor scenes, and threshold/decision-point compositions. When my prompts reference these scene types, use these as spatial anchors.

The 29 images form 6 thematic visual threads. Most shots will be animated with a camera move or joined by a cut, but SIX specific pairs will be animated as MORPHS (I'll mark each one). For a morph pair, the two frames must be spatially tight — same composition, same camera, only the one element I describe changes — so a video model can interpolate between them. For every other consecutive shot, keep the same setting, lighting, and palette for visual continuity, but exact spatial match is not required.

Style rules that apply to every single image in this session:
- Constructivist editorial illustration — bold color-blocked forms, flat planes, no gradients, no soft airbrushed shading, no photorealism
- Palette locked to: ink #1C1814, amber #E5A544, bone #F0E6D0, with walnut #5C4A3D and grey-green earth tones where natural. No other hues.
- Figures: angular, color-blocked, mid-century-modernist (Saul Bass / Fortune). CLOSE figures have **planar stylized faces** — skin-toned, with simplified eyes/brow/jaw planes — NOT black silhouettes, NOT photoreal. DISTANT or small figures may stay as silhouettes. Clothing color-blocked.
- No Cyrillic text anywhere. Minimal English text only where editorially correct (matrix labels, journal spines, office signage) — never decorative.
- All images 16:9 landscape ratio.
- Mood: intellectual, slightly austere, historically serious — not dystopian, not warm, not whimsical.

When I say "same setting as the previous image" I mean: same room or environment, same camera height, same lighting direction, same figure proportions and clothing style. Only the specific changes I describe should change — nothing else.

**Do NOT generate anything yet.** This message is context only. Reply with a short acknowledgement that you've registered the 9 reference images and these style rules, and confirm you're ready. Then wait — I'll send the first shot prompt next, one at a time, and confirm approval before each subsequent image.
```

---

## THREAD A — The Building
*The RAND Corporation interior as a continuous space the model is born in and escapes from. 6 shots across Beats 1–2. Generate consecutively so each shot remembers the space.*

---

### Shot 1 — `aigen-01-rand-office.png`
**Beat 1 · Thread A position 1 · anchor for Shot 2**

```
Shot 1. Thread A — The Building, opening frame.

A 1950s research office interior — the RAND Corporation, Santa Monica. Two angular figures sit across a small table covered in graph paper grids. The figures are constructivist style: angular, color-blocked, with **planar stylized faces** — skin-toned, simplified eyes/brow/jaw planes (Saul Bass / Fortune editorial), NOT black silhouettes, NOT photoreal. White shirts with ink ties. Between them on the table: hand-drawn paper grids tracking cooperate/defect rounds — tally marks in columns, not yet decipherable but visibly systematic. A reel-to-reel tape recorder sits on a shelf behind them. Venetian blind slats on the windows cast parallel amber light bands across the table and floor.

Lighting: warm amber from the window, above-left. Dominant colors: grey-green walls, ink figures, bone paper, amber light bands. The mood is concentrated, slightly clinical — two professionals running an experiment neither fully understands.

No text legible. No Cyrillic. 16:9 landscape.
```

---

### Shot 2 — `aigen-01b-grids-closeup.png`
**Beat 1 · Thread A position 2 · closer view, CUT from Shot 1 (Ken Burns — not a morph)**

```
Shot 2. Thread A — The Building, same room as Shot 1. Camera dollies in toward the table.

Same RAND office as Shot 1. The two figures are now out of frame above — we see only the table surface. The graph paper grids fill the frame: tally marks in two columns headed "C" and "D" (cooperate / defect), hash marks counting rounds — 60 cooperate marks, roughly 40 defect. A coffee cup at one corner, a slide rule at the other edge. The parallel amber light bands from the venetian blinds still cross the table surface diagonally.

Only the camera position has changed from Shot 1 — everything else is the same room, same light, same palette. Dominant colors: bone paper, amber light bands, ink tally marks. Minimal legible English text on the column headers is editorially correct.

16:9 landscape.
```

---

### Shot 3 — `aigen-04a-chalkboard.png`
**Beat 2 · Thread A position 3 · anchor for Shot 4**

```
Shot 3. Thread A — The Building, same building as Shots 1–2, different room.

Tight close-up on a chalkboard surface filling most of the frame. A 2×2 payoff matrix is being chalked in — "C" and "D" column/row headers, four cells with payoff numbers. A hand and forearm enter from the right side of frame, mid-stroke, finishing the last number in the lower-right cell. Chalk dust on the tray below. The hand is constructivist style: angular, color-blocked in ink with bone cuff, no skin detail.

On the left edge of frame, just barely visible: grey-green wall, the lower corner of a second chalkboard. Same grey-green institutional wall color as the office in Shots 1–2 — same building. Lighting from above: fluorescent strip lights, cool overhead white (not the amber from the office — this is a different room deeper in the building). Color-blocked in grey-green, ink, and bone with chalk-white accents.

Minimal legible English text on the matrix labels is editorially correct. No Cyrillic. 16:9 landscape.
```

---

### Shot 4 — `aigen-04-rand-corridor.png`
**Beat 2 · Thread A position 4 · match-CUT from Shot 3 (Ken Burns) · anchor for Shot 5**

```
Shot 4. Thread A — The Building, same building, pulling back from the chalkboard to the corridor.

A long institutional corridor in one-point perspective. Chalkboards line both walls — the one from Shot 3 is now on the left, the hand has lowered. A lone angular figure walks away from the camera down the center of the corridor, mid-distance, constructivist style. Overhead fluorescent strip lights every few meters. Grey-green walls. The corridor is deep — the vanishing point is in the far middle distance, slightly dark.

Same building as Shots 1–3: same grey-green institutional walls, same fluorescent overhead light. The corridor is not the office — it's the hallway between rooms. No windows, no amber. Color-blocked in grey-green and ink with bone accents on the figure. The mood: the model is moving through the building.

No legible text. No Cyrillic. 16:9 landscape.
```

---

### Shot 5 — `aigen-04b-corridor-doorway-end.png`
**Beat 2 · Thread A position 5 · match-CUT from Shot 4 (Ken Burns) · anchor for Shot 6**

```
Shot 5. Thread A — The Building, same corridor as Shot 4, camera has pushed forward.

Same one-point-perspective corridor as Shot 4. The camera has moved forward along the hallway — the same walking figure from Shot 4 is now further ahead, smaller, approaching the vanishing point. At the very end of the corridor — the far terminus — a bright doorway is visible, glowing amber against the grey-green walls. The doorway is small in the frame but clearly present: a rectangle of warm amber light at the end of the cool fluorescent hall.

Only the camera position has changed: everything else is the same corridor. The contrast between the cool fluorescent corridor and the warm amber doorway is the visual subject of this frame. Color-blocked in grey-green, ink, and amber (concentrated at the doorway terminus only).

No legible text. No Cyrillic. 16:9 landscape.
```

---

### Shot 6 — `aigen-05-doorway-threshold.png`
**Beat 2 · Thread A position 6 · match-CUT from Shot 5 (Ken Burns) · Thread A closes**

```
Shot 6. Thread A — The Building, same corridor as Shots 4–5, camera now at the doorway.

The doorway from the end of the corridor in Shot 5 now fills most of the frame. We are standing at the threshold — the doorway frame takes up about 60% of the frame height. Beyond it: warm amber exterior light, a glimpse of sky or an open courtyard, the world outside the building. The grey-green corridor walls are visible only at the edges of the frame. The lone figure from Shots 4–5 is not present — they have already passed through, or this is the camera's point of view as it arrives at the threshold.

The amber light beyond the doorway is the brightest element in the frame — it reads as an escape, an exit. Same grey-green walls as the full corridor. Color-blocked in grey-green fading into amber. The mood: the model has left the building.

No legible text. No Cyrillic. 16:9 landscape.
```

---

## THREAD B — The Institution
*The model is ADOPTED by the institutions — shown as concrete scenes of institutional life, NOT symbolic posters (per the sophistication rules in ASSET_GENERATION_REGISTER.md). 2 active shots in Beat 1 (02b retired).*

---

### Shot 7 — `aigen-02-institution-adoption.png`
**Beat 1 · Thread B position 1 · live-still (boardroom)**
*Rewritten May 23, 2026 — the old "equation-sun over labeled buildings" was the canonical tacky shot (fake math + god-rays + `$`-on-tower). Sophistication rules: show the scene where the idea lives, not a poster about it.*
*Re-rewritten May 24, 2026 — v1 boardroom came back flat-vector with "fakish" under-modeled faces (8 figures → no detail budget). Fix: **upload `aigen-01-rand-office.png` as a style reference**, cut to 5 figures, lock the faceted-but-painterly look (don't over-specify "polygons" — let the ref carry it).*

```
Boardroom, mid-century modernist. Render in the SAME style as the reference image:
a faceted, planar editorial-illustration look (Saul Bass / mid-century Fortune
lineage) — figures and surfaces shaped by broad angular planes and hard directional
chiaroscuro, finished with a soft painterly grain. Faces modeled in clear
light-and-shadow planes (brow, cheekbone, jaw) — dimensional and characterful, not
smooth flat fills. Let the reference set the faceting and the level of face detail;
don't exaggerate into hard low-poly.

Five figures only: a standing presenter beside a projector screen, pointing at a
2x2 payoff matrix (columns C / D, rows C / D; values 3,3 — 0,5 — 5,0 — 1,1), and
four seated figures around a dark table studying it. Few figures so each face is
fully modeled. Warm institutional light; one tall window with a faint domed-capitol
silhouette outside. Palette: ink, umber, amber, bone. No Cyrillic; no legible text
except the matrix. 16:9 landscape.
```

---

### Shot 8 — `aigen-02b` — RETIRED (do not generate)

Retired May 23, 2026. The equation/rays concept was cut entirely (sophistication rules — no fake-math poster, no god-rays). Thread B is now just `02 (boardroom) → 03 (aerial)`. **Skip this shot.**

---

### Shot 9 — `aigen-03-aerial-complex.png`
**Beat 1 · Thread B position 3 · Thread B closes**

```
Shot 9. Thread B — The Institution, closing frame.

Aerial view looking straight down on a large institutional building complex — government or academic in character. Multiple wings, with courtyards and plazas between them. Worked into the plazas and courtyard paving — subtly, as if part of the original architecture — is the same rectilinear grid/matrix motif from the model: faint amber gridlines and a 2×2 division echoing the payoff matrix, now built into the ground itself.

The mood: the model is no longer on a chalkboard — it has been built into the institutions' very architecture. One idea, restrained. Geometric color-blocked: bone and grey-green rooftops, ink seams between wings, amber courtyard lines. NO flags, NO labels, no text. No Cyrillic. Color-blocked aerial in bone, grey-green, ink, amber. 16:9 landscape.
```

---

## INSERT G — Permeation
*Atmospheric standalone — "2,000+ articles" made spatial. Beat 2.*

---

### Shot 10 — `aigen-permeation-01-archive.png`
**Beat 2 · Insert G · standalone atmospheric**

```
Shot 10. Atmospheric insert — no thread. Standalone frame.

A library or archive corridor in deep one-point perspective. Endless bookshelves on both sides reaching to a high ceiling. The shelves are packed with bound academic journals — uniform spines, English titles too small to read but clearly in the format "Journal of..." or "International Review of...". A few volumes are pulled out, papers spilling onto the shelf and floor. Dust motes in the beams of overhead lights.

No figures. The mood is overwhelming accumulated weight — quiet, dense, slightly oppressive. Two thousand articles made into physical space. Color-blocked in walnut shelving, ink shadows, bone paper spines, amber pools of overhead light. No legible text. No Cyrillic. 16:9 landscape.
```

---

## THREAD C — The Capture
*The model reshapes reality — grid on landscape becomes a negotiation room. 3 shots in Beat 3. Generate consecutively.*

---

### Shot 11 — `aigen-06-grid-landscape.png`
**Beat 3 · Thread C position 1 · anchor for Shot 12**

```
Shot 11. Thread C — The Capture, opening frame.

Eye-level view across a wide landscape: distant mountains on the horizon, mid-ground hills, foreground meadow. From above and behind the camera's viewpoint, a geometric grid is being projected onto the land — like a spotlight beam, but rectilinear. Where the grid touches the ground, the terrain is starting to flatten: rectangular fields replacing organic curves, rivers straightening into geometric channels. The organic landscape still visible at the edges of frame.

The gridlines are amber on the ink-and-bone landscape. No figures, no buildings. Lighting from above-left, amber wash. The mood is eerie control — the land is being redrawn by the model. Color-blocked in ink, amber gridlines, bone terrain. No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 12 — `aigen-06b-grid-with-table.png`
**Beat 3 · Thread C position 2 · ⟳ MORPH from Shot 11 (shared base — change ONLY the grid→table) · anchor for Shot 13**

```
Shot 12. Thread C — The Capture, same eye-level landscape as Shot 11. Camera position unchanged.

Same landscape as Shot 11. The projected grid has intensified and tightened — gridlines are sharper, more rigid, spaced more densely. At the convergence point near the center of the frame, the gridlines have begun to form the rectangular outline of a stylized table — geometric, austere, the table's edges emerging directly from the gridlines themselves. The landscape around the table is now fully gridded: no organic curves remaining anywhere in the middle ground. The very edges of frame still show the original terrain.

No figures yet. The mood: the model has nearly finished reshaping the landscape into a game. Color-blocked in amber gridlines and ink. The table outline is amber. Same mountains hold in the far background. No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 13 — `aigen-07-negotiation-room.png`
**Beat 3 · Thread C position 3 · ⟳ MORPH from Shot 12 (shared base — figures arrive into the formed table) · Thread C closes**

```
Shot 13. Thread C — The Capture, the landscape has become a room.

The gridded landscape from Shots 11–12 has fully resolved into a negotiation room interior. The distant mountains are now the far wall. The table from Shot 12 is now fully present at the center — amber surface, geometric and austere. Two angular figures in dark ink suits have entered from opposite sides and are approaching the table, one from each end, not yet seated. The figures are mid-distance — the architecture dominates but the faces read. Constructivist style: angular, color-blocked, with **planar stylized faces** (skin-toned, simplified planes, NOT black silhouettes). No props on the table.

The lighting: same above-left amber wash, now reading as an overhead room light rather than a landscape spotlight. The walls are bone-on-ink. The floor is a flat ink plane. The mood: they walked into a room that was designed before they arrived.

No text. No Cyrillic. Color-blocked in ink, amber, bone. 16:9 landscape.
```

---

## THREAD D — The Markets Parallel
*Black-Scholes and OPEC share a rust/amber palette signature. 2 standalone shots in Beat 3. No morph between them — palette is the thread.*

---

### Shot 14 — `aigen-08-stock-exchange.png`
**Beat 3 · Thread D position 1 · standalone (palette thread)**

```
Shot 14. Thread D — The Markets Parallel, first frame.

A stock exchange trading floor — stylized and constructivist, not photorealistic. Angular figures at trading posts, arms extended in trading gestures, screens showing line charts as simplified geometric forms. The floor is wide and deep, one-point perspective. The dominant palette is rust and amber — the screens glow amber, the trading post surfaces are rust-red, the figures are ink silhouettes. The overall mood is controlled urgency: a system running itself.

No legible numbers, no ticker symbols. Color-blocked in rust, amber, ink, and bone. The palette should feel warmer and slightly more dangerous than the earlier RAND shots — this is the model that conquered finance. No Cyrillic. 16:9 landscape.
```

---

### Shot 15 — `aigen-09-oil-infrastructure.png`
**Beat 3 · Thread D position 2 · standalone (palette echo of Shot 14)**

```
Shot 15. Thread D — The Markets Parallel, second frame.

Oil infrastructure: pipelines, pumping stations, refineries rendered in constructivist geometric forms. A wide landscape view — the infrastructure fills the mid-ground from edge to edge. In the distance, flare stacks burn amber flames. Angular figures at control panels in the foreground, small relative to the machinery.

The palette echoes Shot 14: rust-red for the pipelines and tank surfaces, amber for the flames and sky near the flares, ink for shadows and figures. The mood: industrial scale, cooperative infrastructure, the OPEC system. The palette should immediately read as kin to the stock exchange in Shot 14 — same rust/amber register. No legible text. No Cyrillic. Color-blocked in rust, amber, ink. 16:9 landscape.
```

---

## THREAD E — The Cooperation Arc
*Dawn → stag hunt → cooperative outcome → terraced commons → alpine commons → ocean. 6 shots in Beat 4. The hero morph is Shot 20 → Shot 21 (alpine to ocean). Generate consecutively.*

---

### Shot 16 — `aigen-10-sunrise-cooperative.png`
**Beat 4 · Thread E position 1 · anchor for Thread E tone**
*Still-QA May 24, 2026: KEEP AS-IS (do not regen). It reads smoother/Benton-painterly than the faceted rest of Thread E, but (a) `10 → 11` is a hard CUT, which absorbs the style difference, and (b) it's the strongest, warmest shot of the arc. Regenerating a working still for a marginal consistency gain isn't worth the risk.*

```
Shot 16. Thread E — The Cooperation Arc, opening frame. Tone: dawn, possibility.

A wide landscape at dawn. In the mid-ground, a group of angular constructivist figures are working together on a large timber frame — a barn raising or collective structure. The frame is tall, its geometric beams visible against the sky. The figures are distributed around it, some lifting, some guiding, none individualized. Dawn light from the right edge: amber sky, long horizontal shadows, the warmest palette of the episode so far.

No individualized figures — they read as a collective action. Color-blocked in amber sky, ink ground, bone and grey-green timber. The mood is the opposite of the PD trap: cooperation that costs something and delivers something. No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 17 — `aigen-11-forest-stag-hunt.png`
**Beat 4 · Thread E position 2 · anchor for Shot 18**
*Amended May 24, 2026 — the existing prompt was already on-register; pinned the primitive-hunter era (so 11/11b match) and added the style-lock (ref image + explicit forbid-realism) per ASSET_GENERATION_REGISTER.md rule 7. Upload `aigen-01-rand-office.png` as the style reference.*

```
Shot 17. Thread E — The Cooperation Arc, second frame. The Stag Hunt.

Flat constructivist editorial style — angular, color-blocked, stylized figures; match the
reference image. NOT photorealistic, NOT a naturalistic / painterly oil painting; no
realistic anatomy, no rendered faces, no volumetric light. Warmth from palette only.

A forest interior — geometric vertical tree trunks forming a one-point corridor, dawn light
filtering through the canopy in amber rays from upper left. Angular constructivist hunters —
primitive, in simple tunic-and-fur shapes with wooden spears — converge on a stylized stag in
the mid-distance, their paths meeting. One hunter at the right edge has peeled off, diverging
toward a small hare crouching in the foreground right.

The stag is central with faint amber backlight; emphasis on the convergence, the defection
visible but small. Color-blocked: ink tree trunks, amber canopy rays, bone figures and stag.
No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 18 — `aigen-11b-stag-aftermath.png`
**Beat 4 · Thread E position 3 · cross-dissolve from Shot 17 (same forest, regroup figures) · generate sequentially right after Shot 17**
*Amended May 24, 2026 — de-morphed the header (ep1 dropped morphs → cross-dissolve); pinned the SAME primitive hunters + style-lock so it matches Shot 17 across the dissolve.*

```
Shot 18. Thread E — The Cooperation Arc, same forest as Shot 17. The cooperative outcome.

SAME flat constructivist style, palette, forest, and SAME primitive hunters (tunics, furs,
spears) as Shot 17 — keep the angular, color-blocked rendering identical; not realistic or
painterly. Only the figures' arrangement changes.

Same geometric tree trunks, same dawn amber light through the canopy. The pursuit is over: the
hunters stand together in a small clearing at center, gathered around the stylized stag now
lying at their feet, spears lowered — quiet completion, no celebration. The hunter who diverged
toward the hare is gone from the frame.

Color-blocked in bone and ink with amber rays. Same wide framing as Shot 17 so the two read as
one place a moment later. No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 19 — `aigen-12-terraced-farmland.png`
**Beat 4 · Thread E position 4 · anchor for Shot 20**

```
Shot 19. Thread E — The Cooperation Arc, fourth frame. Ostrom commons — terraces.

A steep hillside of terraced farmland. Geometric stepped terraces rise from the foreground to the upper frame — the engineering of the terracing is as visually prominent as the crops. Angular irrigation channels run along the terrace edges, water made geometric. Small cooperative figures work at different levels: one at the irrigation inlet, two on the terrace face, one managing the channel above. They are small relative to the landscape.

Warm amber overhead light — mid-day or late afternoon. The stepped geometry of the terraces is the visual argument: this is engineered cooperation, not spontaneous. Color-blocked in grey-green crops, bone terrace faces, ink channels, amber light. No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 20 — `aigen-12a-alpine-commons.png`
**Beat 4 · Thread E position 5 · ⟳ MORPH from Shot 19 (shared base — terraces→alpine terrain) · anchor for Shot 21 (HERO)**

```
Shot 20. Thread E — The Cooperation Arc, fifth frame. Alpine commons.

A stone-walled alpine pasture — higher altitude than Shot 19's terraces, harder land. Low stone walls divide the sloped meadow into pasture lots — these walls are ancient, weathered, their edges softened by decades. Small stone shelters dot the slope. Abstract sheep as small geometric color-blocked forms scatter across the meadow. A few small cooperative figures in the mid-distance tend the sheep or repair a wall — same constructivist angular style as Shot 19's farmers.

Distant mountain peaks rise behind the meadow with atmospheric perspective — fading toward the horizon. The horizon sits roughly at mid-frame. The mood: older institution, different terrain, same underlying logic as the terraces — bounded cooperation, identifiable people, clear edges.

Color-blocked in grey-green meadow, bone stone walls and shelters, ink peaks, amber overhead light. No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 21 — `aigen-13-ocean-vastness.png`
**Beat 4 · Thread E position 6 · ⟳ MORPH from Shot 20 (HERO — alpine walls dissolve to ocean) · Thread E closes**

```
Shot 21. Thread E — The Cooperation Arc, closing frame. The scaling limit.

Open ocean, vast and borderless. Repeating geometric waves as angular forms stretching to the horizon — the ocean rendered as pattern, not as texture. A single tiny boat at the horizon, a geometric dot: the only human presence in a frame that has no edges, no walls, no channels, no steps. Warm amber light on the horizon and reflecting off the wave peaks; ink depth in the troughs.

The transition from Shot 20: everything bounded — stone walls, alpine pasture, sheep lots — has dissolved. No walls, no identifiable people, no clear boundaries. The commons is too large. The PD is not entirely wrong.

Color-blocked in ink and bone waves, amber horizon reflection, grey-blue tint at the edges. No text. No Cyrillic. 16:9 landscape.
```

---

## THREAD F — The Stakes
*Modern present day — you are inside the model. 8 shots in Beat 5. Generate consecutively.*

---

### Shot 22 — `aigen-14-city-street.png`
**Beat 5 · Thread F position 1 · anchor for Shot 23**
*Rewritten May 24, 2026 — v1 was a crowded "commuters" stock illustration (~10 even figures) in flat-vector. Fix: fewer figures + more atmosphere, and **upload `aigen-01-rand-office.png` as a style reference** to lock the faceted register. Emptiness reinforces the "invisible coordination" point.*

```
Shot 22. Thread F — The Stakes, opening frame. Modern present-day.

Faceted low-poly constructivist style — EVERY surface built from angular
triangulated polygon facets (building facades, pavement, figures), dramatic
low-key chiaroscuro, painterly film grain. Match the rendering of the reference
image: same faceting, same hard planar light.

A wide commercial city street at dusk, nearly empty. Only three or four solitary
figures, well separated, walk in parallel along the sidewalk — small and distant,
faceted silhouettes receding into a soft evening haze that swallows the far end of
the street. The emptiness IS the subject: ordinary life quietly structured by an
invisible order. Streetlights cast a regular procession of amber pools on the
pavement; between them, deep ink shadow. Facades are bone and grey-green angular
planes fading into haze with distance. Generous negative space — empty pavement
and sky. Contemplative, still, faintly eerie.

Contemporary clothing, color-blocked. Figures small and distant (faceted
silhouettes, minimal facial detail). No legible signs. No Cyrillic. Palette: ink,
amber streetlight pools, bone facades, atmospheric haze. 16:9 landscape.
```

---

### Shot 23 — `aigen-14b-street-meeting.png`
**Beat 5 · Thread F position 2 · CUT from Shot 22 (live-still: only the hands meet, heads hold)**
*Rewritten May 24, 2026 — v1 buried the handshake (the actual point) in a background crowd. Fix: strip the crowd so the meeting is the only event; keep `aigen-01` as style ref. **Generate this as a continuation/edit of the new Shot 22** so the street is identical across the cut.*

```
Shot 23. Thread F — The Stakes, same city street as Shot 22. A coordination move.

Faceted low-poly constructivist style, identical to Shot 22 and the reference
image — angular triangulated polygon facets on every surface, faces modeled in
distinct planes (brow, cheekbone, jaw), hard chiaroscuro, painterly grain.

The same dusk street and facades as Shot 22, now nearly deserted. At center, lit
by a single amber streetlight pool, two figures have stopped facing each other,
hands extended toward a handshake — the only event on an empty street. The two are
mid-distance, close enough to read as faceted planar faces (held in the
animation). The rest of the street recedes into haze and ink shadow; at most one
lone faceted silhouette far in the distance. Parallel streetlight shadows still
stripe the empty pavement. The isolation makes the meeting feel consequential —
the move that breaks the default.

Only the two central figures are added vs Shot 22 — same street, facades, light
pools. Contemporary clothing, color-blocked. No text. No Cyrillic. Palette: ink,
amber, bone, atmospheric haze. 16:9 landscape.
```

---

### Shot 24 — `aigen-15-horizon-landmasses.png`
**Beat 5 · Thread F position 3 · anchor for Shot 25 (forecast-01)**
*Regenerated May 24, 2026 — v1 was ultra-flat minimalist (symmetric landmasses + two glowing dots), which clashed with the faceted `forecast-01` across their cross-dissolve (still-QA flag). Re-generated AS `forecast-01` minus the figures so the dissolve aligns — confirmed on-register. **Upload `aigen-forecast-01-cliff-figures.png` as the reference.***

```
Generate the SAME scene as the reference image (aigen-forecast-01-cliff-figures.png), with
the two figures removed.

Faceted low-poly constructivist style, identical to the reference: angular triangulated facets
on the water, sky and rock. A warm amber sun low on the horizon between two distant faceted
shorelines reaching in from left and right; calm faceted water with a long amber sun-reflection.
The rocky cliff foreground is present but EMPTY — no figures, no people. Same palette (ink,
amber, bone, grey-green) and same warm light as the reference.

The establishing wide of the strait — two landmasses facing each other across the water, human
scale not yet present. No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 25 — `aigen-forecast-01-cliff-figures.png`
**Beat 5 · Thread F position 4 + Insert H · cross-dissolve from Shot 24 (add the two figures to the same horizon) · generate Shot 24 from this frame**
*Note May 24, 2026 — de-morphed header (ep1 dropped morphs). This still already exists and is the style anchor; Shot 24 (`aigen-15`) was regenerated FROM it with the figures removed, so the dissolve aligns (only the figures fade in).*

```
Shot 25. Thread F — The Stakes, same horizon as Shot 24. Human scale enters.

Same faceted horizon as Shot 24 — same two distant shorelines, same strait, same warm sun low on the horizon, same amber water-reflection. A rocky cliff edge sits in the lower foreground. Two diplomatic figures stand on the cliff — angular constructivist style, dark ink suits — walking parallel to the edge, not facing each other, not facing the camera. Walking the line, looking out across the water. They are small relative to the frame; the horizon dominates.

Only the foreground figures differ from Shot 24: the empty cliff now has the two figures on it. The horizon, sun and water reflection hold. The mood: the abstraction has human scale now, but the decision hasn't happened yet. Color-blocked in ink, bone, amber. No text. No Cyrillic. 16:9 landscape.
```

---

### Shot 26 — `aigen-16-lecture-hall.png`
**Beat 5 · Thread F position 5 · anchor for Shot 27**

```
Shot 26. Thread F — The Stakes, fifth frame. The model being taught.

A university lecture hall, wide, full of students. Angular constructivist figures fill the tiered seats, facing forward. At the front, on a large chalkboard or projection: a 2×2 payoff matrix — "C" and "D" headers, four cells with payoff numbers. The matrix is legible from the front of the hall — the students face it. The professor or instructor is a small ink silhouette at the board; the students are repeated constructivist forms in the seats.

The mood: the model is now curriculum. The next generation is learning a game as if it is natural law. Color-blocked in grey-green hall, ink figures, bone chalkboard, amber matrix cells. Minimal legible English text on the matrix is editorially correct. No Cyrillic. 16:9 landscape.
```

---

### Shot 27 — `aigen-16a-notebook-closeup.png`
**Beat 5 · Thread F position 6 · CUT from Shot 26 (Ken Burns — detail zoom; do NOT morph)**

```
Shot 27. Thread F — The Stakes, same lecture hall as Shot 26. Camera zooms to a desk.

Tight close-up looking down at a single student's desk. An open notebook on the desk surface, with a hand-drawn 2×2 payoff matrix sketched in pencil — copying the one from the chalkboard in Shot 26. "C" and "D" headers, four cells, payoff numbers filling in. A hand is mid-writing, completing one of the cells. The hand is constructivist — angular, color-blocked, no skin detail. A coffee cup at the desk edge. The amber glow from the front of the lecture hall reflects off the notebook page.

Only the scale has changed from Shot 26: we are at desk level now, not room level. Same palette, same hall context. Minimal legible English matrix text is editorially correct — the act of copying is the subject. No Cyrillic. Color-blocked in bone paper, ink lines, amber glow. 16:9 landscape.
```

---

### Shot 28 — `aigen-17-panorama-cityscapes.png`
**Beat 5 · Thread F position 7 · anchor for Shot 29**

```
Shot 28. Thread F — The Stakes, seventh frame. Two players at scale.

A wide panoramic view at dusk: two vast cityscapes face each other across a real strait of dark water. Each cityscape is a forest of geometric towers in bone and grey-green. In the water between them — caught only in the reflections and the faint wakes — a rectilinear grid is *just barely* suggested: a 2×2 division you sense more than see, as if the strait itself were faintly a board. Restrained — the grid is a whisper in the water, NOT a glowing billboard or an architectural-scale diagram.

The mood: the scale at which the game is now played — two civilizations across a channel. Color-blocked in bone and grey-green towers, ink water with a faint amber grid suggestion in the reflection only, dusk sky. No identifiable skylines, no flags, no text. No Cyrillic. 16:9 landscape.
```

---

### Shot 29 — `aigen-17a-single-figure-edge.png`
**Beat 5 · Thread F position 8 · CUT from Shot 28 (Ken Burns — reframe zoom; do NOT morph) · Thread F closes**

```
Shot 29. Thread F — The Stakes, same panorama as Shot 28. Camera zooms to one edge.

Same panorama as Shot 28 — same two cityscapes, same glowing game-matrix channel between them. The camera has zoomed significantly toward the right edge of the channel. One of the cityscapes is now in the background. At the foreground edge of the channel stands a single mannequin figure — angular, constructivist, color-blocked in ink — looking across the water toward the other cityscape. The figure is small relative to the buildings but unmistakably the focal point.

The amber game-matrix glow from below is more intense now — this is the conflict palette: darker overall, more ink, amber as tension rather than warmth. The mood: you are this figure. You are standing at the edge of a game that was designed before you arrived. Color-blocked in ink and bone with amber tension accent. No text. No Cyrillic. 16:9 landscape.
```

---

## After the session

**Save discipline:** After each shot is approved, immediately save it with the filename shown before moving to the next. Do not batch-download at the end — if a shot drifts in a later round, you need to know which version of the anchor was used.

**Place in:** `episodes/prisoners-dilemma/assets/stills/`

**Verify the 6 MORPH pairs (the only ones that need pixel-tight matching):** Shots `11→12`, `12→13`, `17→18`, `19→20`, `20→21`, `24→25`. Drop each pair into a 2-up and confirm same environment, lighting angle, and palette ratio — only the one described element should differ. If a morph's frame B has drifted, regenerate it before Pika; the morph tool will not save a misaligned pair. (The other consecutive shots are Ken Burns or cuts — visual continuity is nice but exact match is not required.)

**Then split by technique (per `shot-list.json` → `motion_technique`):**
- **Ken Burns shots** (`01b, 02b, 03, 04a, 04, 04b, 05, 15, 16a, 17, 17a, permeation-01`): just save the still — `tools/ai-video/upscale.py` then `tools/ai-video/render_kenburns.py` do the rest locally. No AI video.
- **Live-still shots** (`01, 08→cinemagraph, 09→cinemagraph, 10, 14, 14b, 16`): Pika/Hailuo single-image mode, micro-motion only; on faced shots hold the head.
- **6 morph pairs:** `development/visual-thread-design.md` §7 (Pika 2.5 start+end frame).

**Thread C note:** Thread C (Shots 11→12→13) supersedes the bakeoff protocol in `development/scenes/wrong-game-establish.md`. Two morphs (11→12 grid→table, 12→13 figures-arrive) carry it.
