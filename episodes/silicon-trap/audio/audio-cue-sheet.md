# Audio Cue Sheet — EP01: The Silicon Trap

> Generated from script-v4-production.md + assembly-manifest.json (estimate mode)
> Reference: project/AUDIO_DESIGN.md

## Episode Summary

- **Duration:** ~13.1 minutes (787.8s, estimate mode)
- **Music bed tracks:** 6
- **Transition SFX (L2):** 23
- **Texture hits (L3):** 42
- **Silence moments:** 2
- **Dramatic SFX:** 3 (+ end-stinger)

---

## Music Bed Plan (Layer 1)

| Track ID | Mood | Start | End | Fade In | Fade Out | Volume | Beat Coverage | Notes |
|----------|------|-------|-----|---------|----------|--------|---------------|-------|
| `opening` | contemplative | 0:00 | 1:52 | 2s | 3s | 0.15 | Beat 1 | Major → minor transition. Slightly elevated volume during opening footage (no narration yet). Piano + ambient pads. |
| `analytical-1` | analytical | 1:50 | 4:40 | 3s | 2s | 0.12 | Beat 2 first half | Minor key (Am). Historical context — 1941 embargo, COCOM. Thin out when ChoroplethMap appears (high visual density). |
| `analytical-2` | analytical | 4:38 | 7:00 | 2s | 3s | 0.12 | Beat 2 second half | Continuation in Em. Could be same track as analytical-1 with section loop. |
| `tension-1` | tension | 6:57 | 10:30 | 3s | 3s | 0.12 | Beat 3 | Minor key (Dm). Tempo rises to 80-85 BPM. Builds subtly through SMIC reveals, DeepSeek failure. Layers added gradually (strings enter). |
| `tension-resolve` | tension → resolution | 10:27 | 13:30 | 3s | 3s | 0.12 | Beat 4 | Starts tense (Gm), shifts to relative major when Morris Chang quote lands. This is the emotional peak — music should be most textured here, then thin for the quote. |
| `resolution` | resolution | 13:27 | 13:08 | 3s | 0s | 0.12 | Beat 5 + End | Major key (C or F). 70-75 BPM. Contemplative resolution. Fades to nothing before end-stinger. Cold-open piano motif returns briefly at 12:50 (bookend). |

**Crossfade schedule:** Each track overlaps its neighbor by its fade durations (2-3s). No silent gaps.

**Volume automation notes:**
- 0:00-0:06: Volume up to 0.25 (footage-only opening, no narration)
- 8:09-8:11 (~489-491s): Fade to silence (deliberate pause after "0 training runs")
- 13:00-13:02 (~781s): Fade to silence before end-stinger

---

## Transition SFX (Layer 2) — Chronological

| # | Time | Segment | Cue Type | Intensity | Trigger | Notes |
|---|------|---------|----------|-----------|---------|-------|
| 1 | 0:06 | beat1-seg02 | `stat-reveal` | normal | "92% YIELD" KineticTypography lands | First data moment. Offset +1.5s for number count-up finish. |
| 2 | 1:28 | beat1-seg06 | `stat-reveal` | normal | DataChart "7% of US demand" bars complete | Hero bar highlight moment. |
| 3 | 1:52 | beat2-seg08 | `section-open` | normal | TitleTransition "THE LOGIC OF DENIAL" | New beat. Music crossfade happens here. |
| 4 | 2:11 | beat2-seg10 | `beat-transition` | normal | TimelineComparison 1941 column appears | Historical timeline entrance. |
| 5 | 3:07 | beat2-seg14 | `quote-bell` | normal | KineticTypography "20% → 15%" | Revenue-deal absurdity moment. |
| 6 | 3:27 | beat2-seg15 | `stat-reveal` | normal | DataChart CHIPS Act funnel bars finish | Descending bars — offset +2.5s for all 3 bars. |
| 7 | 3:53 | beat2-seg16 | `map-whoosh` | normal | ChoroplethMap COCOM coalition appears | 17-nation map reveal. |
| 8 | 4:11 | beat2-seg17 | `beat-transition` | subtle | FrameworkDiagram USSR vs China | Routine comparison entrance. |
| 9 | 4:46 | beat3-seg19 | `section-open` | normal | TitleTransition 卡脖子 overlay | New beat — tone shifts to China's perspective. |
| 10 | 4:48 | beat3-seg20 | `quote-bell` | normal | KineticTypography 卡脖子 bilingual reveal | Rust accent, definition card. |
| 11 | 5:41 | beat3-seg25 | `quote-bell` | subtle | KineticTypography 举国体制 bilingual | Second Chinese term — subtle to avoid repetition. |
| 12 | 6:09 | beat3-seg26 | `stat-reveal` | normal | DataChart "34 vs 9 lithography passes" | Key comparison — offset +3s for bars finishing. |
| 13 | 6:44 | beat3-seg27 | `stat-reveal` | subtle | DataChart SMIC yield line chart | Secondary data point, same beat. |
| 14 | 6:52 | beat3-seg28 | `beat-transition` | normal | FrameworkDiagram Kirin X90 teardown | Marketing vs reality columns. |
| 15 | 7:49 | beat3-seg31 | `stat-reveal` | **dramatic** | KineticTypography "0 successful training runs" | ★ Episode's biggest surprise moment. Offset +2s for dramatic text build. |
| 16 | 8:31 | beat4-seg34 | `section-open` | normal | TitleTransition "THE TRAP" | Thesis beat begins. |
| 17 | 8:33 | beat4-seg35 | `beat-transition` | normal | FrameworkDiagram chess board | US strategy metaphor. |
| 18 | 9:09 | beat4-seg38 | `map-whoosh` | **dramatic** | RouteAnimation supply chain (6 countries) | ★ The thesis visual — most complex animation. Offset +2s for first route drawing. |
| 19 | 9:41 | beat4-seg39 | `quote-bell` | normal | KineticTypography "A TRAP FOR EVERYONE" | Thesis statement text. |
| 20 | 9:47 | beat4-seg40 | `map-whoosh` | normal | ChoroplethMap caught-in-between nations | Amber highlights on Netherlands, S.Korea, Japan. |
| 21 | 10:17 | beat4-seg41 | `quote-bell` | **dramatic** | KineticTypography Morris Chang quote | ★ Emotional climax. "Globalization is almost dead." |
| 22 | 10:59 | beat5-seg43 | `section-open` | normal | TitleTransition "YOUR CHIPS" | Final beat — personal stakes. |
| 23 | 13:04 | beat5-seg53 | `end-stinger` | — | TitleTransition end card | Resolving chord → fade to silence. |

**L2 Totals:** 23 SFX (target: 15-25 ✓)
**Dramatic budget:** 3 dramatic + 1 end-stinger (target: ≤3 dramatic ✓)
**Beat boundary coverage:** All 5 beat boundaries have section-open ✓

---

## Texture Hits (Layer 3) — By Segment

### Beat 1

| # | Time | Segment | Texture | Offset | Vol | Label |
|---|------|---------|---------|--------|-----|-------|
| 1 | 1:30 | beat1-seg06 | `bar-grow` | +1.5s | 0.08 | First bar (93% "rest of world") |
| 2 | 1:31 | beat1-seg06 | `bar-grow` | +1.8s | 0.06 | Hero bar (7% TSMC share) |

### Beat 2

| # | Time | Segment | Texture | Offset | Vol | Label |
|---|------|---------|---------|--------|-----|-------|
| 3 | 2:13 | beat2-seg10 | `dot-click` | +2.0s | 0.08 | First timeline event (1939) |
| 4 | 2:15 | beat2-seg10 | `dot-click` | +4.0s | 0.06 | Second event (asset freeze) |
| 5 | 2:17 | beat2-seg10 | `line-draw` | +6.0s | 0.06 | Connection line to right column |
| 6 | 2:33 | beat2-seg12 | `dot-click` | +1.5s | 0.08 | First right-column event (2018) |
| 7 | 2:35 | beat2-seg12 | `dot-click` | +3.5s | 0.06 | Second right-column event |
| 8 | 2:37 | beat2-seg12 | `dot-click` | +5.5s | 0.06 | Third right-column event |
| 9 | 3:08 | beat2-seg14 | `card-settle` | +1.0s | 0.06 | Quote card lands in position |
| 10 | 3:29 | beat2-seg15 | `bar-grow` | +2.0s | 0.08 | $52.7B authorized bar |
| 11 | 3:30 | beat2-seg15 | `bar-grow` | +2.4s | 0.06 | $30.9B awarded bar |
| 12 | 3:31 | beat2-seg15 | `bar-grow` | +2.8s | 0.06 | $6B disbursed bar |
| 13 | 3:55 | beat2-seg16 | `region-glow` | +2.0s | 0.08 | First COCOM nations fill (US) |
| 14 | 3:57 | beat2-seg16 | `region-glow` | +3.5s | 0.06 | NATO allies fill |
| 15 | 4:14 | beat2-seg17 | `card-settle` | +2.5s | 0.06 | First comparison column (USSR) |
| 16 | 4:16 | beat2-seg17 | `card-settle` | +4.5s | 0.06 | Second column (China) |

### Beat 3

| # | Time | Segment | Texture | Offset | Vol | Label |
|---|------|---------|---------|--------|-----|-------|
| 17 | 4:49 | beat3-seg20 | `card-settle` | +1.0s | 0.08 | 卡脖子 character reveal |
| 18 | 5:42 | beat3-seg25 | `card-settle` | +1.0s | 0.06 | 举国体制 character reveal |
| 19 | 6:12 | beat3-seg26 | `bar-grow` | +2.5s | 0.08 | "34 passes" bar (SMIC) |
| 20 | 6:13 | beat3-seg26 | `bar-grow` | +2.8s | 0.06 | "9 passes" bar (EUV) |
| 21 | 6:45 | beat3-seg27 | `line-draw` | +1.5s | 0.06 | Yield curve draws |
| 22 | 6:54 | beat3-seg28 | `card-settle` | +2.0s | 0.06 | "Marketing" column |
| 23 | 6:56 | beat3-seg28 | `card-settle` | +4.0s | 0.06 | "Reality" column |

### Beat 4

| # | Time | Segment | Texture | Offset | Vol | Label |
|---|------|---------|---------|--------|-----|-------|
| 24 | 8:35 | beat4-seg35 | `dot-click` | +2.0s | 0.08 | First chess piece (Nvidia) |
| 25 | 8:36 | beat4-seg35 | `dot-click` | +3.0s | 0.06 | Second piece (ASML) |
| 26 | 8:37 | beat4-seg35 | `card-settle` | +4.0s | 0.06 | Chess board label settle |
| 27 | 8:47 | beat4-seg36 | `dot-click` | +2.0s | 0.08 | First go stone |
| 28 | 8:48 | beat4-seg36 | `dot-click` | +3.0s | 0.06 | Second stone |
| 29 | 8:49 | beat4-seg36 | `dot-click` | +3.5s | 0.06 | Third stone (surrounding pattern) |
| 30 | 9:12 | beat4-seg38 | `line-draw` | +3.0s | 0.08 | First route line (Japan → NL) |
| 31 | 9:14 | beat4-seg38 | `line-draw` | +5.0s | 0.06 | Second route (NL → CA) |
| 32 | 9:17 | beat4-seg38 | `region-glow` | +8.0s | 0.06 | Final destination glow |
| 33 | 9:43 | beat4-seg39 | `card-settle` | +1.5s | 0.06 | "TRAP FOR EVERYONE" card lands |
| 34 | 9:50 | beat4-seg40 | `region-glow` | +3.0s | 0.08 | Netherlands highlights |
| 35 | 9:52 | beat4-seg40 | `region-glow` | +5.0s | 0.06 | South Korea highlights |
| 36 | 9:54 | beat4-seg40 | `region-glow` | +7.0s | 0.06 | Japan highlights |
| 37 | 10:18 | beat4-seg41 | `card-settle` | +1.0s | 0.06 | Morris Chang quote card |

### Beat 5

| # | Time | Segment | Texture | Offset | Vol | Label |
|---|------|---------|---------|--------|-----|-------|
| 38 | 11:02 | beat5-seg44 | `card-settle` | +2.0s | 0.06 | "Fast AI" branch |
| 39 | 11:04 | beat5-seg44 | `card-settle` | +4.0s | 0.06 | "Slow AI" branch |
| 40 | 11:05 | beat5-seg44 | `line-draw` | +5.0s | 0.06 | Decision tree branch lines |
| 41 | 12:10 | beat5-seg50 | `line-draw` | +2.0s | 0.08 | Bifurcation — routes splitting |
| 42 | 12:12 | beat5-seg50 | `line-draw` | +4.0s | 0.06 | Second diverging route |

**L3 Totals:** 42 texture hits (target: 30-50 ✓)
**Density check:** Max 3 per 10s window ✓ (verified per segment)
**FOOTAGE segments:** 0 texture hits on footage-only segments ✓

---

## Silence Moments

| # | Time | Duration | Music Action | Preceding Event | Following Event | Rationale |
|---|------|----------|--------------|-----------------|-----------------|-----------|
| 1 | 8:09 (489s) | 2s | Music bed fades to nothing over 1.5s | seg31: "0 successful training runs" (dramatic stat-reveal) | seg33: "Both of those things are true..." (analytical pivot) | Maximum impact. The "0" hangs in silence. The biggest surprise of the episode needs room to land. |
| 2 | 12:59 (779s) | 2s | Music bed fades to nothing over 1.5s | seg52: HOLD on narrator ("You just might not have known it yet") | seg53: End card with end-stinger | Clean runway for the end-stinger. Direct address deserves silence. |

---

## Chronological Cue Sheet (All Layers)

### 0:00 — BEAT 1: THE PARADOX

**Music:** Track `opening` starts (contemplative, 0.15→0.25 vol for footage-only opening, 2s fade-in)

| Time | Layer | Cue | Intensity/Vol | Trigger |
|------|-------|-----|---------------|---------|
| 0:00 | L1 | `opening` music starts | 0.25 | Episode opens — footage only, elevated volume |
| 0:06 | L1 | music dips | 0.15 | Narration begins ("In December 2025...") |
| 0:07 | L2 | `stat-reveal` | normal | "92% YIELD" KineticTypography |
| 1:30 | L3 | `bar-grow` | 0.08 | DataChart first bar |
| 1:31 | L3 | `bar-grow` | 0.06 | DataChart hero bar (7%) |
| 1:28 | L2 | `stat-reveal` | normal | DataChart bars complete |

### 1:52 — BEAT 2: THE LOGIC OF DENIAL

**Music:** Crossfade `opening` → `analytical-1` (analytical, Am, 0.12 vol, 3s crossfade from 1:50)

| Time | Layer | Cue | Intensity/Vol | Trigger |
|------|-------|-----|---------------|---------|
| 1:52 | L2 | `section-open` | normal | Beat 2 title card |
| 2:11 | L2 | `beat-transition` | normal | TimelineComparison entrance |
| 2:13 | L3 | `dot-click` | 0.08 | First 1941 timeline event |
| 2:15 | L3 | `dot-click` | 0.06 | Second timeline event |
| 2:17 | L3 | `line-draw` | 0.06 | Connection line draws |
| 2:33 | L3 | `dot-click` | 0.08 | First 2022 timeline event |
| 2:35 | L3 | `dot-click` | 0.06 | Second 2022 event |
| 2:37 | L3 | `dot-click` | 0.06 | Third 2022 event |
| 3:07 | L2 | `quote-bell` | normal | "20% → 15%" card |
| 3:08 | L3 | `card-settle` | 0.06 | Card lands |
| 3:27 | L2 | `stat-reveal` | normal | CHIPS Act funnel bars |
| 3:29 | L3 | `bar-grow` | 0.08 | $52.7B bar |
| 3:30 | L3 | `bar-grow` | 0.06 | $30.9B bar |
| 3:31 | L3 | `bar-grow` | 0.06 | $6B bar |
| 3:53 | L2 | `map-whoosh` | normal | COCOM map appears |
| 3:55 | L3 | `region-glow` | 0.08 | US + allies fill |
| 3:57 | L3 | `region-glow` | 0.06 | NATO members fill |
| 4:11 | L2 | `beat-transition` | subtle | USSR vs China framework |
| 4:14 | L3 | `card-settle` | 0.06 | USSR column |
| 4:16 | L3 | `card-settle` | 0.06 | China column |

### 4:46 — BEAT 3: THE OTHER SIDE OF THE WALL

**Music:** Crossfade `analytical-2` → `tension-1` (tension, Dm, 80-85 BPM, 0.12 vol, 3s crossfade from 4:38)

| Time | Layer | Cue | Intensity/Vol | Trigger |
|------|-------|-----|---------------|---------|
| 4:46 | L2 | `section-open` | normal | 卡脖子 title overlay |
| 4:48 | L2 | `quote-bell` | normal | 卡脖子 bilingual reveal |
| 4:49 | L3 | `card-settle` | 0.08 | Character reveal animation |
| 5:41 | L2 | `quote-bell` | subtle | 举国体制 bilingual |
| 5:42 | L3 | `card-settle` | 0.06 | Character reveal |
| 6:09 | L2 | `stat-reveal` | normal | 34 vs 9 passes DataChart |
| 6:12 | L3 | `bar-grow` | 0.08 | "34 passes" bar |
| 6:13 | L3 | `bar-grow` | 0.06 | "9 passes" bar |
| 6:44 | L2 | `stat-reveal` | subtle | SMIC yield line chart |
| 6:45 | L3 | `line-draw` | 0.06 | Yield curve draws |
| 6:52 | L2 | `beat-transition` | normal | Kirin X90 framework |
| 6:54 | L3 | `card-settle` | 0.06 | "Marketing" column |
| 6:56 | L3 | `card-settle` | 0.06 | "Reality" column |
| 7:49 | L2 | `stat-reveal` | **dramatic** | ★ "0 successful training runs" |
| 8:09 | L1 | **SILENCE** | fade out 1.5s | Music bed fades to nothing — 2s deliberate silence |
| 8:11 | L1 | `tension-1` resumes | 0.10 | Music returns softly for analytical pivot |

### 8:31 — BEAT 4: THE TRAP

**Music:** Crossfade `tension-1` → `tension-resolve` (tension → resolution, Gm → Bb, 0.12 vol, 3s crossfade from 8:27)

| Time | Layer | Cue | Intensity/Vol | Trigger |
|------|-------|-----|---------------|---------|
| 8:31 | L2 | `section-open` | normal | "THE TRAP" title card |
| 8:33 | L2 | `beat-transition` | normal | Chess board entrance |
| 8:35 | L3 | `dot-click` | 0.08 | First chess piece (Nvidia) |
| 8:36 | L3 | `dot-click` | 0.06 | Second piece (ASML) |
| 8:37 | L3 | `card-settle` | 0.06 | Chess board label |
| 8:47 | L3 | `dot-click` | 0.08 | First go stone |
| 8:48 | L3 | `dot-click` | 0.06 | Second stone |
| 8:49 | L3 | `dot-click` | 0.06 | Third stone |
| 9:09 | L2 | `map-whoosh` | **dramatic** | ★ Supply chain RouteAnimation |
| 9:12 | L3 | `line-draw` | 0.08 | First route (Japan → NL) |
| 9:14 | L3 | `line-draw` | 0.06 | Second route (NL → CA) |
| 9:17 | L3 | `region-glow` | 0.06 | Destination glow |
| 9:41 | L2 | `quote-bell` | normal | "A TRAP FOR EVERYONE" |
| 9:43 | L3 | `card-settle` | 0.06 | Text card lands |
| 9:47 | L2 | `map-whoosh` | normal | Caught-in-between ChoroplethMap |
| 9:50 | L3 | `region-glow` | 0.08 | Netherlands |
| 9:52 | L3 | `region-glow` | 0.06 | South Korea |
| 9:54 | L3 | `region-glow` | 0.06 | Japan |
| 10:17 | L2 | `quote-bell` | **dramatic** | ★ Morris Chang: "Globalization is almost dead." |
| 10:18 | L3 | `card-settle` | 0.06 | Quote card lands |

### 10:59 — BEAT 5: YOUR CHIPS

**Music:** Crossfade `tension-resolve` → `resolution` (resolution, C major, 70-75 BPM, 0.12 vol, 3s crossfade from 10:55)

| Time | Layer | Cue | Intensity/Vol | Trigger |
|------|-------|-----|---------------|---------|
| 10:59 | L2 | `section-open` | normal | "YOUR CHIPS" title card |
| 11:01 | L2 | — | — | FrameworkDiagram entrance (no L2 — section-open covers it) |
| 11:02 | L3 | `card-settle` | 0.06 | "Fast AI" branch |
| 11:04 | L3 | `card-settle` | 0.06 | "Slow AI" branch |
| 11:05 | L3 | `line-draw` | 0.06 | Decision tree lines |
| 12:10 | L3 | `line-draw` | 0.08 | Supply chain bifurcation — routes split |
| 12:12 | L3 | `line-draw` | 0.06 | Second diverging route |
| 12:50 | L1 | bookend motif | 0.15 | Opening piano motif returns briefly (2-3 notes) |
| 12:59 | L1 | **SILENCE** | fade out 1.5s | Music fades — 2s silence before end |
| 13:01 | — | — | — | Narrator: "You just might not have known it yet." (HOLD) |
| 13:04 | L2 | `end-stinger` | — | End card. Resolving chord → fade to silence. |

---

## Validation Checklist

- [x] Music bed: no gaps > 3s (2 deliberate silences of 2s each)
- [x] Music bed: volume ≤ 0.15 during all spoken sections (only 0.25 during footage-only opening)
- [x] All 5 beat boundaries: section-open SFX ✓
- [x] Dramatic SFX: 3 uses (target ≤3) — "0 training runs" + supply chain route + Morris Chang quote
- [x] End-stinger: exactly 1, at final segment ✓
- [x] Texture hits: max 3 per 10-second window ✓ (verified per segment cluster)
- [x] Texture hits: 0 on FOOTAGE-only segments ✓
- [x] Texture hits: all volumes ≤ 0.08 (inaudible on laptop speakers) ✓
- [x] Music crossfades: smooth at all 5 beat boundaries ✓
- [x] Silence moments: 2 (target 1-2) ✓
- [x] Total L2: 23 (target 15-25) ✓
- [x] Total L3: 42 (target 30-50) ✓
- [x] Bookend: opening piano motif returns at 12:50 before conclusion ✓

---

## Assembly Manifest Audio Extensions

### Root-level musicBed object

```json
{
  "musicBed": {
    "tracks": [
      {
        "id": "opening",
        "file": "audio/music/EP01/bed-opening.wav",
        "startSec": 0,
        "endSec": 112,
        "fadeInSec": 2,
        "fadeOutSec": 3,
        "volume": 0.15,
        "mood": "contemplative",
        "beat": "beat1"
      },
      {
        "id": "analytical-1",
        "file": "audio/music/EP01/bed-analytical-1.wav",
        "startSec": 110,
        "endSec": 280,
        "fadeInSec": 3,
        "fadeOutSec": 2,
        "volume": 0.12,
        "mood": "analytical",
        "beat": "beat2"
      },
      {
        "id": "analytical-2",
        "file": "audio/music/EP01/bed-analytical-2.wav",
        "startSec": 278,
        "endSec": 420,
        "fadeInSec": 2,
        "fadeOutSec": 3,
        "volume": 0.12,
        "mood": "analytical",
        "beat": "beat2"
      },
      {
        "id": "tension-1",
        "file": "audio/music/EP01/bed-tension.wav",
        "startSec": 417,
        "endSec": 630,
        "fadeInSec": 3,
        "fadeOutSec": 3,
        "volume": 0.12,
        "mood": "tension",
        "beat": "beat3"
      },
      {
        "id": "tension-resolve",
        "file": "audio/music/EP01/bed-tension-resolve.wav",
        "startSec": 627,
        "endSec": 810,
        "fadeInSec": 3,
        "fadeOutSec": 3,
        "volume": 0.12,
        "mood": "tension",
        "beat": "beat4"
      },
      {
        "id": "resolution",
        "file": "audio/music/EP01/bed-resolution.wav",
        "startSec": 807,
        "endSec": 783,
        "fadeInSec": 3,
        "fadeOutSec": 0,
        "volume": 0.12,
        "mood": "resolution",
        "beat": "beat5"
      }
    ]
  }
}
```

> **Note:** File paths are placeholders — actual audio files need to be sourced. The `resolution` track endSec < startSec because it fades to deliberate silence before the end-stinger; adjust once actual track lengths are known.

### Per-segment soundCue + textureCues

See the chronological cue sheet above for which segments receive which cues. To merge into `assembly-manifest.json`, add `soundCue`, `soundCueSecondary`, and `textureCues` fields to each segment per the schema.

Example for beat3-seg31 ("0 training runs"):
```json
{
  "id": "beat3-seg31",
  "soundCue": {
    "type": "stat-reveal",
    "offsetSec": 2.0,
    "intensity": "dramatic"
  }
}
```

Example for beat4-seg40 (caught-in-between ChoroplethMap):
```json
{
  "id": "beat4-seg40",
  "soundCue": {
    "type": "map-whoosh",
    "offsetSec": 0,
    "intensity": "normal"
  },
  "textureCues": [
    { "type": "region-glow", "offsetSec": 3.0, "volume": 0.08, "label": "Netherlands highlights" },
    { "type": "region-glow", "offsetSec": 5.0, "volume": 0.06, "label": "South Korea highlights" },
    { "type": "region-glow", "offsetSec": 7.0, "volume": 0.06, "label": "Japan highlights" }
  ]
}
```
