---
description: Walk the operator through a narration recording session — generate read-doc + pronunciation guide, then QA the recorded WAV.
argument-hint: <slug>
---

Run the narration recording workflow for episode **$1**. This is the orchestrator across the three Tier 1 narration tools (`format_for_reading.py`, `pronunciation_guide.py`, `audio_qa.py`) — the operator's single entry-point for "I'm about to record this episode" or "I just finished recording, what do I need to fix."

## Mode A — pre-recording prep (default if no `narration.wav` yet)

If `episodes/$1/assets/narration.wav` does NOT exist, do the prep flow:

1. **Confirm the script.** Show which script the tools will read from:
   ```bash
   python3 -c "import sys; sys.path.insert(0, 'tools/narration'); from format_for_reading import find_script; p = find_script('$1'); print('script:', p)"
   ```
   If `None`, abort and surface the production-pipeline state — the operator needs a `script-production.md` or `script-v*-production.md` first.

2. **Generate the read-doc:**
   ```bash
   python3 tools/narration/format_for_reading.py $1
   ```
   Writes `episodes/$1/narration-readable.md`. Open this on the tablet or second monitor — it's what Tiger reads from, NOT the production script.

3. **Generate the pronunciation guide:**
   ```bash
   python3 tools/narration/pronunciation_guide.py $1 --merge
   ```
   The `--merge` flag preserves any IPA values the operator already filled in from a previous pass. Writes `episodes/$1/pronunciation-guide.md`.

4. **Surface what still needs filling in.** Read the pronunciation guide and report:
   - How many terms came from the bundled lexicon (those are pre-verified).
   - How many still need an IPA entry filled in before recording. Surface the top 5-10 by frequency so the operator knows which matter most.
   - Direct attention to the "Needs verification" section.

5. **Print the recording checklist** to remind the operator of the physical setup before they press record:
   - Mic at fist-distance from mouth, 30° off-axis
   - Recording at -18 to -12 dBFS average, peaks ≤ -6 dBFS
   - Wear closed-back headphones during recording
   - Record a 10-second room-tone clip at the start (critical for post noise reduction)
   - Output target: `episodes/$1/assets/narration.wav` (48 kHz / 24-bit / mono PCM)

   Don't pad this with explanation — the operator knows the why; they just need the reminder.

## Mode B — post-recording QA (if `narration.wav` exists)

If `episodes/$1/assets/narration.wav` exists, run the audit flow:

1. **Run the audio QA:**
   ```bash
   python3 tools/narration/audio_qa.py $1
   ```
   Writes `episodes/$1/assets/_audio-qa.md` and prints a summary line.

2. **Read the QA report and surface findings.** For each finding, restate the problem in plain English and quote the exact fix command. Group by severity:
   - 🔴 errors — must fix before assembly (peaks above 0 dBTP, wrong sample rate, < 10s file)
   - 🟡 warnings — should fix but won't break rendering (LUFS off target, long silences, mono violations)
   - 🟢 clean — call it out clearly so the operator can move on

3. **If LUFS is off by > 2.0**, suggest running through Auphonic or a one-pass ffmpeg loudnorm:
   ```bash
   ffmpeg -i episodes/$1/assets/narration.wav \
          -af loudnorm=I=-14:TP=-1.0:LRA=11 \
          episodes/$1/assets/narration-mastered.wav
   ```

4. **If there are silence-gap warnings**, list them with timestamps so the operator can jump to those spots in the DAW for surgical edits — don't make them re-skim the QA file.

5. **If clean:** advise the operator to refresh the assembly manifest in precise mode now that real narration timing is available:
   ```bash
   python3 tools/assembly/generate_manifest.py $1 --audio
   ```
   This promotes the manifest from `estimate` to `precise` mode (Whisper-aligned timings).

## Mode C — both (if user explicitly asks for it)

If the operator says "regenerate both" or "rerun prep + QA," do Mode A then Mode B. Useful after re-recording.

## Notes

- All three underlying tools are idempotent — re-running them is always safe. The `--merge` flag on `pronunciation_guide.py` is the only thing that preserves operator state across runs.
- The exact-command philosophy from `polish_lint.py` and `pipeline_validator.py` carries over here: never describe a fix in prose where a copy-pasteable command would do.
- If `$1` is missing, default to listing available episodes from `pipeline-state.json` and asking the operator to pick one.
- This command does NOT commit anything. The operator decides when to stage `narration-readable.md`, `pronunciation-guide.md`, `_audio-qa.md`, and `narration.wav`.
