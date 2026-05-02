# Parallax — Visual Language Guide

## What this document is

The editorial framework for deciding what appears on screen at any moment in a Parallax video. Not a format spec (that's SCRIPT_FORMAT.md), not a sourcing guide (that's FOOTAGE_SOURCING.md) — this is the *why* behind visual decisions.

The core insight: viewers process footage and motion graphics differently. Footage creates *presence* — the feeling of being somewhere, seeing something real. Motion graphics create *understanding* — making invisible structures visible. The art is knowing which one a moment needs, and when both together create something neither could alone.

Created: April 26, 2026

---

## The Three Visual Modes

### Mode 1: Footage Only

**What the viewer experiences:** Grounding. Emotional texture. Physical reality. The brain processes footage as "this is real, this happened, this place exists." Even generic stock footage of a cleanroom establishes that chip fabrication is a physical process with real humans in bunny suits, not an abstraction.

**When to use it:**

- **Story beats.** When the narration is telling a story — the ballpoint pen parable, the Jensen/Trump negotiation, the Pearl Harbor pivot — footage anchors the story in reality. The viewer needs to *see* the world being described.
- **Establishing context.** The opening of a beat, the shift to a new geography or time period. Aerial shots of Shenzhen, archival footage of 1941 Washington, a factory floor. These orient the viewer before the analysis begins.
- **Breathing room.** After a data-dense MG sequence (chart → framework → chart), the viewer's analytical brain needs a rest. Ten seconds of footage with narration over it resets the cognitive load before the next data block.
- **Emotional landing.** When a beat reaches its emotional peak — the Morris Chang quote, the "0 successful training runs" reveal — sometimes the most powerful visual is a held shot of a real place or person, not a designed graphic.

**Duration guidance:** Footage-only segments typically run 8-25 seconds. Shorter than 5 seconds feels like a flash that didn't register. Longer than 30 seconds without a visual change risks losing attention.

**What footage is bad at:** Communicating precise data, showing structural relationships, comparing things that don't physically coexist, making abstract concepts concrete. If you find yourself writing "footage of supply chain complexity" — that's not a thing a camera can capture. You need a motion graphic.

---

### Mode 2: Motion Graphic Only

**What the viewer experiences:** Clarity. Structure. "Now I see the pattern." The brain processes MGs as designed information — it knows someone built this to communicate something specific. This gives MGs authority for data communication but makes them feel "synthetic" when overused.

**When to use it:**

- **Data reveals.** Statistics, comparisons, timelines, trends. Anything with numbers. The "92% YIELD" stat, the CHIPS Act funding funnel, the lithography passes comparison — these are MG moments because the data *is* the content.
- **Structural arguments.** When the narration explains a relationship, comparison, or framework — COCOM vs. China, chess vs. go, the bifurcation decision tree — the viewer needs to see the structure laid out spatially.
- **Geographic arguments.** When the point is about *which countries* and *what connections* — supply chain routes, alliance maps, caught-in-between nations — the map or route animation communicates geography more precisely than any footage could.
- **Definition moments.** The 卡脖子 and 举国体制 cards. When introducing a foreign term or key concept, a designed typography card commands attention and says "this is important, remember this."
- **Dramatic punctuation.** Short MG hits — "A TRAP FOR EVERYONE" — that land like a visual exclamation point. These work best when they're brief (2-4 seconds) and surrounded by footage.

**Duration guidance:** Full-screen MGs typically run 3-12 seconds. Charts and maps can go longer (up to 18 seconds if phased/animated). Typography cards should be short (3-5 seconds). More than 20 seconds of continuous MG without footage feels like a slideshow.

**What MGs are bad at:** Creating emotion, establishing physical reality, conveying scale (you can say "$165 billion" but footage of a massive construction site *shows* what that money looks like). If you find yourself using a motion graphic to illustrate something that exists in the physical world — consider whether footage would land harder.

---

### Mode 3: Footage + Motion Graphic Layered

**What the viewer experiences:** "This abstract thing is real." The footage provides the emotional grounding and the MG provides the analytical overlay. This is the most impactful mode when used sparingly — it says "this data point matters in the real world."

**When to use it:**

- **Hero stat over context.** A key number composited over footage of what that number represents. "92% YIELD" over cleanroom footage. "7% of US chip demand" over the Arizona desert. The footage gives the stat a home.
- **Geographic data over geography.** Data overlays on aerial footage or map imagery — country labels, trade flow arrows, highlight outlines appearing over real satellite or stock footage of the region.
- **Transition moments.** When pivoting from a story to analysis, layering a subtle MG element over fading footage creates a visual bridge. The footage says "here's the real world," the MG says "and here's the pattern inside it."

**When NOT to use it:**

- When the MG is complex (multi-bar charts, dense frameworks). Complex graphics need the viewer's full attention — footage behind them becomes visual noise.
- When the footage is visually rich (dramatic archival, high-action). Overlaying a graphic on strong footage diminishes both.
- More than 2-3 times per beat. The technique loses its punch through overuse.

**Duration guidance:** Layered segments work best at 3-8 seconds. The MG element should be simple — a single stat, a label, a highlight — not a full chart.

---

## Pacing: The Rhythm Between Modes

A well-paced video essay alternates between visual modes the way music alternates between verses and choruses. The goal is *rhythm variation* — never too long in one mode.

### The Fatigue Rules

- **No more than 3 consecutive full-screen MGs without a footage break.** Two charts back-to-back is fine. Three feels like a lecture. Four is a slideshow. Insert even 5-8 seconds of footage between MG clusters.
- **No more than 30 seconds of footage-only without a visual change.** Footage is restful, but too much becomes TV B-roll wallpaper. Cut to a different shot, add a text overlay, or transition to an MG.
- **Alternate density within each beat.** A beat should follow a rough arc: establish with footage → analyze with MG → breathe with footage → climax with MG or layered → land with footage. Not every beat will follow this exactly, but the pattern prevents monotony.

### Beat Cadence Template

A typical 3-4 minute beat in a Parallax episode:

```
Footage (establishing, 8-15s)
  → MG: section title card (2-3s)
  → Footage (story/context, 15-25s)
  → MG: data reveal (5-10s)
  → Footage (breathing room, 5-10s)
  → MG: framework or map (8-15s)
  → Layered: hero stat over footage (3-6s)
  → Footage (emotional landing, 8-15s)
```

This isn't a rigid formula — it's a tendency. Some beats are data-heavy (Beat 3's SMIC analysis) and skew toward MG. Some beats are narrative-heavy (Beat 4's trap metaphor) and skew toward footage. The template is a center of gravity, not a rule.

### The 10-Second Principle

No visual element should go unspecified for more than 10 seconds. This doesn't mean a new asset every 10 seconds — a 25-second footage shot is fine as long as the script explicitly calls for it. What it prevents is the accidental void: narration playing over nothing because the script writer forgot to specify a visual.

---

## The Decision Heuristic

When writing the visual column and unsure which mode to use, ask these questions in order:

1. **Is the narration telling a story about something that physically exists?** → Footage. (A factory, a person, a place, an event.)
2. **Is the narration explaining a number, a structure, or a comparison?** → MG. (Data, frameworks, timelines, geographic relationships.)
3. **Is the narration making a surprising claim about something physical?** → Layered. (A stat that reframes something the viewer can see.)
4. **Is the narration transitioning, reflecting, or building emotional weight?** → Footage (ambient) or hold on previous visual.

If you're still unsure: default to footage. Footage is forgiving — a slightly wrong stock clip is less jarring than a slightly wrong motion graphic. And footage gives the viewer's brain room to process the narration, which is often more valuable than another visual competing for attention.

---

## Visual Vocabulary by Content Type

These are the recurring visual needs for geopolitics video essays, mapped to their best mode:

| Content Type | Best Mode | Why |
|---|---|---|
| Named person speaking/acting | Footage or archival image | Viewers need to see the human |
| Named place/facility | Footage | Physical presence > abstract label |
| Historical event | Archival image + Ken Burns | Period-appropriate imagery grounds the story |
| Statistic or data point | MG (KineticTypography or DataChart) | Numbers need designed presentation |
| Country/alliance relationships | MG (ChoroplethMap) | Geography needs a map |
| Supply chain or trade flow | MG (RouteAnimation) | Connections need visual lines |
| Conceptual framework | MG (FrameworkDiagram) | Abstractions need spatial layout |
| Foreign term or definition | MG (KineticTypography) | Typography commands attention |
| Before/after or parallel | MG (TimelineComparison) | Juxtaposition needs designed layout |
| Establishing mood/context | Footage (ambient) | Atmosphere comes from the real world |
| Quick montage (everyday items) | Footage (rapid cuts) | Physical objects need physical images |
| Emotional climax | Footage or layered | Data alone can't carry emotion |
| Dramatic punctuation | MG (short typography hit) | Clean, bold, brief |
| Breathing room between dense sections | Footage (ambient) | Let the brain rest |

---

## Relationship to Other Docs

- **SCRIPT_FORMAT.md** — the syntax for specifying visuals in the script's right column. This doc tells you *what* to write; that doc tells you *how* to write it.
- **FOOTAGE_SOURCING.md** — where to actually get footage. This doc tells you *when* footage is the right choice; that doc tells you *whether* you can actually get it.
- **POLISH_V2.md** — the quality spec for motion graphics. Covers animation, composition, and brand identity for the MG layer.
- **BRAND.md** — the image treatment pipeline. Stock footage and archival images get brand treatment (duotone, grain, vignette) before they go into the video.
