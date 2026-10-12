# Audio Cue Sheet — "The Unwatched Test: Trusting an AI You Can't Check"

**Episode slug:** ai-care-motives
**Generated:** October 10, 2026 · **Thinned:** October 10, 2026, after `analysis/sound-under-narration-research-2026-10-10.md`
**Script version:** v1.7
**Est. runtime:** 11:18.6

> Every timecode is an estimate from the script. After the narration is recorded, re-time the manifest with `tools/assembly/retime_manifest.py` (it moves the music edges and cue offsets in `manifest-audio.json` too) and update the timecodes here; the triggers stay the same.
> No audio files exist yet. This sheet is the spec for the edit; the files to source are listed at the end.

## Episode summary

- Music: 6 cues from 3 files, covering about 42% of the runtime (it was one near-continuous bed over 88%). Nothing before 1:04.
- Transition sounds (Layer 2): 4 (was 23). Beat boundaries are carried by a music entry, change or exit, not by a sound.
- Texture hits (Layer 3): 2, both optional and to be judged by ear (was 41).
- Unscored: the cold open, both quotation passages, all of Beat 4, the ten seconds before the definition, and Beat 7 up to the turn into Beat 8.

**Why it was thinned.** Music under narrated explanation has a measured cost to recall and no measured benefit to engagement; people who score narrated argument for a living run cues of about a minute and leave about as much unscored; a sound placed on a seam marks the seam; and nothing supports small sounds on graphic reveals. The reasoning, sources and the limits of the evidence are in the research note.

---

## Layer 1: Music cues

| Cue | Timecode | File | Mood | Vol | In / out |
|---|---|---|---|---|---|
| shop | 1:04–1:54 | bed-contemplative | contemplative | 0.12 | Enters as the shop appears, after the title card has left. Out over 2s before Kant is quoted. |
| rescue | 2:23–2:49 | bed-contemplative | contemplative | 0.12 | Enters with the river. Out over 2s before Mill is quoted. |
| ring | 5:24–5:58 | bed-contemplative | contemplative | 0.11 | Enters with Plato; the shop motif returns with the shopkeeper's question. Fades over 1.5s into the silence before the definition. |
| return | 6:08.2–6:40.2 | bed-contemplative | contemplative | 0.11 | Lands with "THE UNWATCHED TEST", no fade-in. Crossfades into the car cue across the beat boundary. |
| car | 6:36.2–7:46.2 | bed-tension | tension | 0.13 | The one urgent stretch; builds to the 40× figure. Cuts out, no fade, one second before Beat 7. |
| demand | 9:53.6–11:12 | bed-resolution | resolution | 0.12 | Enters two seconds before Beat 8. Thins from 10:58.6 and is out before the end stinger. |

Cue entries are quick (half a second), not slow fades: music arrives at a chosen spot. `bed-analytical` is no longer needed.

**One automation note, by ear:** at 1:38, as the captions change to "Same bread. Same price. Same change.", try thinning the shop cue to half and bringing it back over a second.

## Where there is no music

| Timecode | Length | What is on screen | Why |
|---|---|---|---|
| 0:00–1:04 | 64s | Cold open and title card | Narration over room tone; the title lands in silence (POLISH.md D18). |
| 1:54–2:23 | 29s | Kant portrait and quotation | The quotation is the point of the passage. |
| 2:49–5:24 | 155s | Mill quotation, the machine in the rescuer's place, the checkpoint, all of Beat 4 (street network, who-checks-whom table, rollback timeline) | A diagram and the narration are both carrying new reasoning. |
| 5:58–6:08.2 | 10.2s | The street empties | The thesis is about to be named. The first seconds have no narration either. |
| 7:46.2–9:53.6 | 127s | All of Beat 7: the evaluation-awareness chart, the training experiment, car against model, the 36 + 59 trace | The hardest explanation in the episode. The earlier plan added a drone here; that is cut. |
| 11:12–11:18.6 | 6.6s | End card | Only the end stinger. |

---

## Chronological cue sheet

Offsets inside a segment are already added into the timecode.

| Time | Layer | Cue | Intensity / Vol | Trigger |
|---|---|---|---|---|
| 0:10.6 | L3, optional | `card-settle` | 0.15 | The assistant's reply arriving on the chat card. Keep only if it reads as a message; if kept it should be clearly audible. |
| 0:57 | — | none | — | Title card "THE UNWATCHED TEST" lands in silence. No sting, no early narration. |
| 1:04 | L1 | shop cue in | 0.12 | Beat 2: the shop counter. |
| 1:54 | L1 | shop cue out | — | Before "Immanuel Kant described a shop like this." |
| 2:23 | L1 | rescue cue in | 0.12 | Beat 3: the river. |
| 2:49 | L1 | rescue cue out | — | Before "John Stuart Mill made this exact point." |
| 3:44 | — | none | — | Beat 4 opens on a plain cut with no music either side. See "Only the ear can settle". |
| 5:24 | L1 | ring cue in | 0.11 | Beat 5: Plato. |
| 5:58 | L1 | ring cue out | — | Faded out as the street begins to empty. |
| 6:08.2 | L2 | `section-open` | dramatic | "THE UNWATCHED TEST" lands out of silence. |
| 6:08.2 | L1 | return cue in | 0.11 | With the definition, no fade. |
| 6:38.2 | L1 | return → car | 0.13 | Beat 6: the change of music marks the boundary. |
| 6:48.9 | L3, optional | `page-turn` | 0.15 | Paper as the EPA notice appears. Same test as the chat message. |
| 7:00.2 | L2 | `tension-rise` | normal | Rises under "nitrogen oxide emissions ran up to…" |
| 7:02.7 | L2 | `stat-reveal` | dramatic | The count-up settles on 40× at "forty times". |
| 7:46.2 | L1 | car cue cuts out | — | "The lab result had concealed a difference that road testing exposed." Then one second of nothing before Beat 7. |
| 9:53.6 | L1 | demand cue in | 0.12 | Two seconds before "You don't need to know whether an AI cares…" |
| 10:58.6 | L1 | demand cue thins | — | Under the dawn still; out by 11:12. |
| 11:14.1 | L2 | `end-stinger` | normal | After the last word of the closing question; resolves to silence. |

---

## Levels to mix to

- **Master:** −14 LUFS integrated for the full mix; true peak at or below −1 dBTP (−2 for margin through YouTube's transcode).
- **Narration** is the anchor. Keep its loudness range within about 6 LU.
- **Music under speech:** 16–20 LU below the narration, measured stem against stem over the same passage. Start at 18. Never closer than 10.
- **Music in the clear** (the first seconds of the return cue, the gap before 11:12): about 3 dB above its under-speech level.
- **Transition sounds:** at most two seconds, in a gap between phrases, never over a word that carries the argument.
- **Sync for any effect:** on the frame, or up to three frames late; never more than one frame early.
- The `Vol` numbers in this sheet and in the manifest are gain multipliers on files of unknown loudness. They are placeholders, not a mix: measure the stems.

## Only the ear can settle

- Whether a track sits on top of Tiger's voice (drop any track whose lead instrument is at the narrator's pitch).
- Whether 18 LU down reads as music or as murk on a phone speaker. Check phone, laptop, TV and headphones.
- Where each cue enters and leaves against the sentence.
- Whether the 3:44 seam into Beat 4 feels marked enough with no music and no sound. If it does not, the fallback is one subtle `beat-transition` there, nothing more.
- Whether 64 seconds without music at the top, and two minutes without it in Beat 7, read as deliberate.
- The two optional texture hits (0:10.6 and 6:48.9): keep each only if it means something.

## Narration overlaps

- The manifest asks for the incoming narration to start 0.7s before each hard cut (the standard J-cut).
- **Do not pre-roll into the title card (0:57) or the end card (11:08).** Both are fade-ins on a held frame; the end card follows the script's stillness hold.

## Files to source

**Music (3 files, instrumental, cleared for YouTube monetisation; stems if available):**

- bed-contemplative.wav — contemplative; shop, rescue, ring and return cues; longest single use 50s. Sustained texture under speech, piano saved for the gaps.
- bed-tension.wav — tension; the car cue; needs at least 70s. Must be able to stop dead.
- bed-resolution.wav — resolution; the demand cue; needs at least 80s.

**Transition sounds (4 files, in `remotion-templates/public/assets/audio/sfx/`, named type-intensity.mp3):**

section-open-dramatic, tension-rise-normal, stat-reveal-dramatic, end-stinger-normal

**Texture hits (2 files, optional, same folder, named type.mp3):**

card-settle, page-turn

## Quality checklist

- [ ] Music: nothing before 1:04; every cue enters and leaves on the timecodes above, not by drifting
- [ ] Music: 16–20 LU under the narration wherever both are present
- [ ] No music under either quotation, Beat 4, or Beat 7
- [ ] Transition sounds: 4, at 6:08.2, 7:00.2, 7:02.7 and 11:14.1; none on a within-beat cut
- [ ] Title card: silent. End stinger: once, resolving to silence
- [ ] Texture hits: at most the two listed, each clearly audible or removed
- [ ] Master −14 LUFS integrated, true peak ≤ −1 dBTP
