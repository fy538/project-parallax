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

### Tier 5 — AI-Generated (Supplementary)

| Tool | Strength | Limitation |
|---|---|---|
| **Runway Gen-3/4** | Best quality, good motion | $12-76/month, ~10s clips |
| **Kling** | Good for cinematic establishing shots | Quality varies, longer gen times |
| **Sora** | High quality when available | Limited access |
| **Pika** | Quick, stylized | Less photorealistic |

**When to use AI footage:** Abstract establishing shots where photorealism isn't critical — "circuit board landscape at dawn," "abstract data flowing through networks," atmospheric backgrounds behind MG overlays. Not for anything that needs to look like a real place or person.

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
| **Specific facilities** (TSMC Arizona, SMIC Shanghai) | Not publicly accessible, no stock footage exists | Company press photos + brand treatment. Generic cleanroom footage as stand-in. Satellite imagery from Google Earth (check ToS). |
| **Specific historical events** (1941 embargo signing, Pearl Harbor) | Need period-accurate archival | Library of Congress, National Archives, Archive.org. Accept black-and-white stills with treatment. |
| **Classified/restricted tech** (EUV machine interior, Kirin chip die) | Doesn't exist in stock libraries | Published teardown photos (TechInsights, iFixit) for chips. ASML press photos for EUV machines. Diagrams as MG alternative. |
| **Corporate logos/branding** (TSMC, Huawei, NVIDIA, DeepSeek) | Trademark restrictions | Press kit logos for editorial use. Screen recordings of company websites. Avoid prominent display. |
| **Branded products** (specific phones, chips, hardware) | Product placement concerns | Macro shots that don't show logos. Generic "smartphone internals" instead of "iPhone 16 board." |
| **Conflict zones / sanctions imagery** | Sensitive, potentially misleading | Avoid. Use maps (MG) to show geographic conflict. Footage of conflict areas risks emotional manipulation. |

### Unsourceable (Use MG Instead)

Some things the script might call for simply can't be photographed. These are motion graphic moments in disguise.

| Visual Need | Why It's Unsourceable | MG Alternative |
|---|---|---|
| "Supply chain complexity" | Abstract concept, not a physical thing | RouteAnimation with multi-phase reveal |
| "Technology denial" | Policy concept | ChoroplethMap or FrameworkDiagram |
| "Economic integration" | Structural relationship | FrameworkDiagram comparison |
| "The trap" | Metaphor | KineticTypography dramatic reveal |
| "Bifurcation of standards" | Future/hypothetical | RouteAnimation splitting into two paths |
| "Revenue sharing deal" | Financial abstraction | KineticTypography or DataChart |

---

## The Source-Check Habit

When writing a script, every `[FOOTAGE:]` tag should pass this quick mental check:

1. **Does this physically exist as something a camera could capture?** If not → MG.
2. **Is it generic (any cleanroom) or specific (TSMC's Arizona cleanroom)?** Generic → Storyblocks/free. Specific → check "Hard to Source" table.
3. **Does it involve a named person?** → Wikimedia Commons press photo, accept a still image with Ken Burns.
4. **Is it historical?** → Library of Congress, National Archives, Archive.org first. Check public domain status.
5. **Is it Chinese-specific?** → Pexels and Storyblocks have growing libraries of Chinese city footage. Named Chinese facilities and individuals are the hardest to source.

---

## Budget Template per Episode

For a typical 18-minute Parallax episode:

| Category | Estimated Count | Source | Cost |
|---|---|---|---|
| Ambient B-roll (cityscapes, tech, nature) | 8-12 clips | Free platforms + Storyblocks | $0 (subscription) |
| Subject-specific B-roll (cleanrooms, factories) | 3-5 clips | Storyblocks + company press | $0 (subscription) |
| Archival photos (historical, named people) | 3-6 stills | Wikimedia, Library of Congress, National Archives | $0 (public domain) |
| Premium archival (specific news footage) | 0-2 clips | AP Archive, Getty, Reuters | $0-400 |
| AI-generated establishing shots | 0-3 clips | Runway, Kling | $0-15 |
| **Total per episode** | | | **$0-415** |
| **Storyblocks annual subscription** | | | **$200/year** |

Most episodes should be $0-50 beyond the subscription. Save the premium archival budget for 1-2 hero moments per episode that absolutely need authentic footage.

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
