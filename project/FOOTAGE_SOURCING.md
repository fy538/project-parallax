# Parallax — Footage Sourcing Guide

## What this document is

A practical map of where to get footage for a geopolitics video essay channel. Organized by the recurring visual needs of the content, not by platform. The question this answers is: "The script calls for X — can I actually get it, where, and what will it cost?"

See VISUAL_LANGUAGE.md for *when* to use footage vs. motion graphics.

Created: April 26, 2026

---

## Platform Overview

### Tier 1 — Subscription (Primary)

**Storyblocks** — ~$200/year, unlimited downloads. The workhorse. Best for: generic B-roll (cityscapes, factories, technology, nature, aerial shots). Used by Wendover, Johnny Harris, and most video essay creators. 4K available. No attribution required.

**When Storyblocks falls short:** Specific events, named people, branded locations, military hardware, anything that requires editorial footage of a real news event.

### Tier 2 — Free Libraries

| Platform | Strength | Limitation |
|---|---|---|
| **Pexels** | High quality 4K, fast search, API available | Smaller library, skews lifestyle/nature |
| **Pixabay** | 150K+ clips, good variety | Quality inconsistent, more amateur content |
| **Unsplash** | Emerging video library | Still small for video |
| **Coverr** | Curated aesthetic clips | Very small library |

**Our `source.py` tool** already searches Pexels, Pixabay, and Unsplash. These platforms cover generic B-roll needs at zero cost.

### Tier 3 — Public Domain & Government

| Source | Content | Access |
|---|---|---|
| **Library of Congress** | Historical photos, films, maps dating back centuries | Free. loc.gov/photos, loc.gov/film-and-videos |
| **Archive.org** | Massive public domain collection including newsreels, government films | Free. archive.org |
| **Wikimedia Commons** | Photos, video. Quality varies wildly. | Free. CC-licensed, check per file |
| **C-SPAN** | Congressional hearings, floor proceedings | Free for House/Senate proceedings only. C-SPAN-produced content has restrictions |
| **NASA** | Space imagery, satellite data, mission footage | Free, public domain. images.nasa.gov |
| **US National Archives** | Government documents, photos, film | Free. archives.gov |
| **British Pathé** | Historical newsreels (1896-1976) | Some free via YouTube; licensing for download |

**For Parallax specifically:** Government sources are goldmines for geopolitics content. Congressional hearings on chip policy, Commerce Department briefings, White House press events — all potentially usable. TSMC's own investor relations materials and press imagery are often available for editorial use.

### Tier 4 — Premium/Archival (Use Sparingly)

| Source | Content | Cost |
|---|---|---|
| **Getty Images / iStock Video** | Massive editorial + creative library | $100-500+ per clip (rights-managed) |
| **Shutterstock** | Large library, subscription option | $49-249/month or per-clip |
| **AP Archive** | News footage dating back decades | $100s-1000s per clip |
| **Reuters (Screenocean)** | International news footage since 1896 | $100s-1000s per clip |
| **Critical Past** | HD historical footage, royalty-free | $59-199 per clip (one-time) |

**Budget rule:** Avoid premium archival unless the moment is load-bearing (P1 visual at an emotional climax). Most Parallax episodes should cost $0-50 in footage beyond the Storyblocks subscription.

### Tier 5 — AI-Generated Video (Fourth Visual Mode)

AI-generated video is now a full production mode (`[AI-GEN:]`) for Parallax, not just supplementary filler. See **AI_VIDEO_PIPELINE.md** for the complete specification. The approach: realistic environments + stylized mannequin-face figures, clearly signaling "editorial visualization, not documentary footage."

| Tool | Strength | Best For | Cost (May 2026) |
|---|---|---|---|
| **Kling 3.0** (primary) | Native 4K, multi-shot consistency, 3D subject anchoring | Environments, facilities, industrial spaces | ~$4/min ($37/mo pro) |
| **Sora 2 Pro** (secondary) | Director Mode (re-shoot angles), storyboard (5 keyframes) | Multi-angle sequences of same space | Included in ChatGPT Pro ($200/mo) |
| **Runway Gen-4** (tertiary) | 95% character identity lock, best camera control | Sequences with same figure across shots | Mid-tier |
| **Midjourney v7 / Flux 2** (reference) | Reference frame generation | Style-locking the first frame before animation | $30/mo |

**Workflow:** Generate a reference frame (Midjourney/Flux 2) → animate with Kling 3.0 image-to-video → brand treatment via `treat_video.py` → NLE timeline.

**When to use AI-GEN footage:**
- Facilities/interiors that can't be filmed (TSMC fabs, military command, classified labs)
- Historical reconstructions (pre-camera events, closed-door meetings)
- Conceptual scenes made physical (supply chains as corridors, sanctions as barriers)
- Scenario/counterfactual sequences ("what if" futures)

**When NOT to use it:** When stock footage exists and works, for named real individuals, as evidence for factual claims, when MG would communicate the point more precisely.

**Budget:** ~$8-10/episode for 60-90 seconds of AI-GEN content (10-15 clips). The true incremental monthly cost is ~$37 (Kling sub) since Midjourney and ChatGPT Pro are already in the stack.

---

## Sourcability by Visual Need

This is the core reference. For each recurring visual need in geopolitics content, what can you realistically get?

### Easy to Source (Free or Storyblocks)

These are abundant on free platforms and Storyblocks. Never pay premium for these.

| Visual Need | Search Strategy | Platform |
|---|---|---|
| City skylines (any major city) | "[City name] skyline aerial" / "night" / "timelapse" | Pexels, Storyblocks |
| Generic tech/manufacturing | "semiconductor manufacturing" / "factory automation" / "robotics" | Storyblocks, Pixabay |
| Server rooms / data centers | "data center" / "server rack" / "cloud computing" | Pexels, Storyblocks |
| Office/business environments | "corporate meeting" / "business" | Everywhere |
| Nature/landscape establishing | "desert landscape" / "ocean" / "mountains" | Everywhere |
| Circuit boards / chip macro | "circuit board macro" / "microprocessor" / "PCB" | Pexels, Pixabay |
| Generic maps / globes | "world map" / "globe spinning" / "earth" | Storyblocks, Pixabay |
| Consumer electronics | "smartphone" / "laptop" / "car dashboard" | Everywhere |
| Medical equipment | "MRI machine" / "hospital technology" | Storyblocks, Pexels |
| Shipping / logistics | "container ship" / "port crane" / "freight" | Storyblocks, Pexels |
| Construction sites | "factory construction" / "industrial building site" | Storyblocks |

### Moderate to Source (Free with Effort or Storyblocks)

Available but requires more specific searching or the right keywords.

| Visual Need | Search Strategy | Notes |
|---|---|---|
| Cleanroom / wafer fabrication | "cleanroom" / "semiconductor cleanroom" / "wafer" | Storyblocks has some; also try TSMC/Intel press materials |
| Chinese cities (specific) | "Shenzhen" / "Shanghai Pudong" / "Beijing" | Good coverage on Pexels, Storyblocks |
| Military hardware (generic) | "navy ship" / "aircraft carrier" / "military drone" | Storyblocks; avoid identifiable units |
| High-speed rail (China) | "China high speed rail" / "bullet train" | Pexels and Pixabay have some; quality varies |
| Space launches | "rocket launch" / "space launch" | NASA (free) for US; stock for Chinese (harder) |
| Historical documents | "old document" / "typewriter" / "vintage paper" | Storyblocks for generic; specific docs via archives |
| Diplomatic settings | "UN assembly" / "summit meeting" / "press conference" | Generic versions on Storyblocks; specific events need archival |
| Protest/demonstration | "protest crowd" / "demonstration" | Available but be careful about context and rights |

### Hard to Source (Archival or Creative Alternatives)

These require archival purchases, creative workarounds, or acceptance of imperfect substitutes.

| Visual Need | Challenge | Workaround |
|---|---|---|
| **Named individuals** (Morris Chang, Jake Sullivan, Xi Jinping) | Likeness rights, editorial use only | Wikimedia Commons press photos + Ken Burns pan. Accept still images instead of video. |
| **Specific facilities** (TSMC Arizona, SMIC Shanghai) | Not publicly accessible, no stock footage exists | Company press photos + brand treatment. Generic cleanroom footage as stand-in. Satellite imagery from Google Earth (check ToS). **Or: AI-GEN interior walkthrough (preferred for immersion).** |
| **Specific historical events** (1941 embargo signing, Pearl Harbor) | Need period-accurate archival | Library of Congress, National Archives, Archive.org. Accept black-and-white stills with treatment. **Or: AI-GEN reconstruction with editorial LUT (for pre-camera events).** |
| **Classified/restricted tech** (EUV machine interior, Kirin chip die) | Doesn't exist in stock libraries | Published teardown photos (TechInsights, iFixit) for chips. ASML press photos for EUV machines. Diagrams as MG alternative. **Or: AI-GEN interior visualization (conceptual, not claiming accuracy).** |
| **Corporate logos/branding** (TSMC, Huawei, NVIDIA, DeepSeek) | Trademark restrictions | Press kit logos for editorial use. Screen recordings of company websites. Avoid prominent display. |
| **Branded products** (specific phones, chips, hardware) | Product placement concerns | Macro shots that don't show logos. Generic "smartphone internals" instead of "iPhone 16 board." |
| **Conflict zones / sanctions imagery** | Sensitive, potentially misleading | Avoid. Use maps (MG) to show geographic conflict. Footage of conflict areas risks emotional manipulation. |

### Unsourceable (Use MG or AI-GEN)

Some things the script might call for simply can't be photographed. These are either motion graphic moments (when the concept is structural/data-driven) or AI-GEN moments (when the concept benefits from physical/spatial visualization).

| Visual Need | Why It's Unsourceable | MG Alternative | AI-GEN Alternative |
|---|---|---|---|
| "Supply chain complexity" | Abstract concept, not a physical thing | RouteAnimation with multi-phase reveal | Corridor/warehouse with branching paths (conceptual scene) |
| "Technology denial" | Policy concept | ChoroplethMap or FrameworkDiagram | Sealed door / barrier scene with figure approaching |
| "Economic integration" | Structural relationship | FrameworkDiagram comparison | Buildings/infrastructure physically merging |
| "The trap" | Metaphor | KineticTypography dramatic reveal | MG still better (pure abstraction) |
| "Bifurcation of standards" | Future/hypothetical | RouteAnimation splitting into two paths | Physical corridor splitting into two divergent paths |
| "Revenue sharing deal" | Financial abstraction | KineticTypography or DataChart | MG still better (numbers-driven) |
| "Restricted facility interior" | Access denied, no stock exists | Diagrams or generic stock stand-in | **AI-GEN primary choice** — realistic interior walkthrough |
| "Historical closed-door event" | Pre-camera or no footage survives | Archival photos + Ken Burns | **AI-GEN primary choice** — period reconstruction with editorial LUT |
| "Future scenario" | Hasn't happened yet | FrameworkDiagram or timeline | **AI-GEN primary choice** — visualized future state |

**Decision rule:** If the concept is *structural* (data, relationships, comparisons) → MG. If the concept is *spatial/physical* (a place, a scene, a moment) → AI-GEN. If it's purely abstract with no spatial metaphor → MG.

---

## The Source-Check Habit

When writing a script, every `[FOOTAGE:]` and `[AI-GEN:]` tag should pass this quick mental check:

1. **Does this physically exist as something a camera could capture?** If not → MG (for structural concepts) or AI-GEN (for spatial/physical concepts).
2. **Can it be sourced?** Check the sourcability tiers above. If "Hard to Source" or "Unsourceable" → consider AI-GEN as the primary approach.
3. **Is it generic (any cleanroom) or specific (TSMC's Arizona cleanroom)?** Generic → Storyblocks/free. Specific and unsourceable → AI-GEN.
4. **Does it involve a named person?** → Wikimedia Commons press photo, accept a still image with Ken Burns. Never AI-GEN for named individuals.
5. **Is it historical?** → Library of Congress, National Archives, Archive.org first. If no footage/photos exist for the event → AI-GEN with editorial LUT.
6. **Is it Chinese-specific?** → Pexels and Storyblocks have growing libraries of Chinese city footage. Named Chinese facilities (SMIC interiors, etc.) → AI-GEN.
7. **Would AI-GEN add immersion beyond what stock provides?** If generic stock adequately covers it, don't reach for AI-GEN. Use AI-GEN when it provides specificity and immersion that stock can't match.

---

## Budget Template per Episode

For a typical 18-minute Parallax episode:

| Category | Estimated Count | Source | Cost |
|---|---|---|---|
| Ambient B-roll (cityscapes, tech, nature) | 8-12 clips | Free platforms + Storyblocks | $0 (subscription) |
| Subject-specific B-roll (cleanrooms, factories) | 3-5 clips | Storyblocks + company press | $0 (subscription) |
| Archival photos (historical, named people) | 3-6 stills | Wikimedia, Library of Congress, National Archives | $0 (public domain) |
| Premium archival (specific news footage) | 0-2 clips | AP Archive, Getty, Reuters | $0-400 |
| AI-generated video ([AI-GEN:] mode) | 8-15 clips | Kling 3.0 + Sora 2 + Midjourney refs | $8-10 |
| **Total per episode** | | | **$8-425** |
| **Storyblocks annual subscription** | | | **$200/year** |
| **Kling 3.0 Pro** | | | **$37/month** |

Most episodes should be $8-50 beyond the subscriptions. The AI-GEN clips often *replace* what would have been expensive premium archival purchases — a $8 AI-GEN reconstruction is usually better than a $200 AP Archive clip that doesn't quite match what you need. Save the premium archival budget for moments where authentic real-world footage is irreplaceable (named people, specific public events).

---

## Integration with Production Pipeline

The footage sourcing step sits between visual-spec and rendering in the pipeline:

```
Script (two-column) → visual-spec (MG JSON) + footage manifest (sourcing list)
                                                        ↓
                                               source.py (free platforms)
                                                        ↓
                                               Manual sourcing (archival, premium)
                                                        ↓
                                               treat.py (brand treatment)
                                                        ↓
                                               Assembly manifest (MG + footage mapped to timeline)
```

The **footage manifest** is the new artifact this process produces — a structured list of every footage need from the script, with search terms, platform recommendations, priority, duration, and compositing notes. It's the footage equivalent of the Remotion data files that visual-spec produces for motion graphics.

---

## Relationship to Other Docs

- **VISUAL_LANGUAGE.md** — when to use footage vs. MG. Read that first.
- **SCRIPT_FORMAT.md** — how to tag footage needs in the script.
- **BRAND.md / IMAGES.md** — the treatment pipeline that all footage goes through before use.
- **PRODUCTION_PIPELINE.md** — where footage sourcing fits in the overall workflow.
