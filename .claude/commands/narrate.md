---
description: Walk the operator through a narration recording session — generate read-doc + pronunciation guide, then QA the recorded WAV.
argument-hint: <slug>
---

Run the narration recording workflow for episode **$1**. This is the orchestrator across the narration toolchain (`format_for_reading.py`, `pronunciation_guide.py`, `pre_render_cue_sheet.py`, `audio_qa.py`, `whisper_alignment.py`, `take_selector.py`, `splice_plan.py`, `local_master.py`, `auphonic_submit.py`) — the operator's single entry-point for "I'm about to record this episode" or "I just finished recording, what do I need to fix."

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

5. **Generate the printable cue sheet** for live markup during the session:
   ```bash
   python3 tools/narration/pre_render_cue_sheet.py $1
   ```
   Writes `episodes/$1/cue-sheet.md`. Tell the operator to **print this** before the session — it lists every take with a recognizable cue line, word count, cumulative timestamp, and a checkbox to mark live (✓ clean / ⚠ re-take / 𝗫 skip). The marked-up paper is the index into the post-record pickup work; it's strictly additive to the digital `narration-diff.md` whisper alignment produces in Mode B.

6. **Print the recording checklist** to remind the operator of the physical setup before they press record:
   - Mic at fist-distance from mouth, 30° off-axis
   - Recording at -18 to -12 dBFS average, peaks ≤ -6 dBFS
   - Wear closed-back headphones during recording
   - Record a 10-second room-tone clip at the start (critical for post noise reduction)
   - Output target: `episodes/$1/assets/narration.wav` (48 kHz / 24-bit / mono PCM)

   Don't pad this with explanation — the operator knows the why; they just need the reminder.

## Mode B — post-recording QA (if `narration.wav` exists)

If `episodes/$1/assets/narration.wav` exists, run the full audit flow. This is a three-stage funnel: signal QA first (is the file usable at all?), then content QA (did we say what the script said?), then optional mastering (Auphonic).

### Stage 1 — signal QA

1. **Run the audio QA:**
   ```bash
   python3 tools/narration/audio_qa.py $1
   ```
   Writes `episodes/$1/assets/_audio-qa.md` and prints a summary line.

2. **Read the QA report and surface findings.** For each finding, restate the problem in plain English and quote the exact fix command. Group by severity:
   - 🔴 errors — must fix before assembly (peaks above 0 dBTP, wrong sample rate, < 10s file)
   - 🟡 warnings — should fix but won't break rendering (LUFS off target, long silences, mono violations)
   - 🟢 clean — call it out clearly so the operator can move on

3. **If there are silence-gap warnings**, list them with timestamps so the operator can jump to those spots in the DAW for surgical edits — don't make them re-skim the QA file.

### Stage 2 — content QA (the big time-saver)

**First, detect multi-take vs single-take.** Always run this check explicitly — do not infer from filename conventions; actually list the directory:

```bash
ls episodes/$1/assets/narration-take-*.wav 2>/dev/null | wc -l
```

If the count is ≥ 2, take the multi-take branch. Otherwise, the single-take branch.

#### Single-take branch

Run the Whisper alignment to generate a pickup-take shopping list:

```bash
python3 tools/narration/whisper_alignment.py $1
```

#### Multi-take branch (2+ full reads detected)

Run the comparison so the operator gets a per-beat best-take pick:

```bash
python3 tools/narration/take_selector.py $1 \
    --takes episodes/$1/assets/narration-take-*.wav
```

Writes `episodes/$1/take-comparison.md` — overall ranking, per-beat winner, and a splice cheat-sheet when no single take wins everything. Use this to choose which file becomes the canonical `narration.wav` (or which segments to splice in the DAW). After picking, alias the winner to `narration.wav` and continue.

#### Either path

This auto-discovers `episodes/$1/assets/narration.json` (transcript) or runs Whisper on `narration.wav` if `faster-whisper` is installed. If neither is available:

- Tell the operator how to generate the transcript externally:
  ```bash
  # Option 1: openai-whisper (CPU/GPU, free, runs locally)
  pip install openai-whisper
  whisper episodes/$1/assets/narration.wav --model medium --output_format json \
      --output_dir episodes/$1/assets/
  # Then re-run the alignment.
  ```
- Or fall back to running on Tiger's own machine before re-invoking `/narrate`.

The output is `episodes/$1/narration-diff.md`. **Read it and surface:**

- The pickup-take shopping list at the top — these are the specific lines that need re-recording, with timestamps. Read them out so the operator knows exactly what to fix.
- The delivery skew note (delivered faster or slower than 150-wpm estimate, by how much). This is informational — manifests will be Whisper-realigned anyway.
- Any low-confidence spans (🟣) flagged as likely mispronunciations of foreign names — cross-reference with `pronunciation-guide.md` and confirm.

If the report shows zero pickup candidates, say so clearly — the operator can skip to Stage 3 or assembly.

**If pickup candidates exist**, surface the next-action splice workflow:

1. The operator records pickup takes — one short WAV per flagged line. Conventional naming: `pickup-1.wav`, `pickup-2.wav`, ... in `episodes/$1/assets/pickups/`, in the order they appear in `narration-diff.md`'s pickup table.
2. Run `splice_plan.py` to generate an Audacity label track:
   ```bash
   python3 tools/narration/splice_plan.py $1 \
       --pickups episodes/$1/assets/pickups/pickup-*.wav
   ```
   Writes `episodes/$1/splice-plan.txt`.
3. In Audacity: open the master narration.wav → File → Import → Labels → select `splice-plan.txt`. Markers appear at exact pickup positions. Drag pickup WAVs onto adjacent tracks, align to markers, crossfade at boundaries, export as the final `narration.wav` (replacing the original or to a new filename — operator's call).

The cache layer means re-running `whisper_alignment.py` after each splice iteration is ~200ms instead of minutes (transcripts are cached by file mtime + params).

### Stage 3 — mastering

If LUFS in the audio QA was off by > 2.0, **OR** the operator prefers an explicitly mastered output, run one of two paths. Both produce `episodes/$1/assets/narration-mastered.wav`. The original is preserved untouched.

#### Path A — local (default, no account required)

```bash
python3 tools/narration/local_master.py $1
# Or aggressive for noisy source:
python3 tools/narration/local_master.py $1 --preset aggressive
# Or safe (HPF + loudnorm only, no compression):
python3 tools/narration/local_master.py $1 --preset safe
```

Runs a two-pass ffmpeg chain (HPF → compression → loudnorm to -14 LUFS) and auto-verifies the output via `audio_qa.py`. No internet, no account, ~10-30s for a 15-min file. The standard preset matches what Auphonic's defaults produce within audible tolerance.

#### Path B — cloud (Auphonic, if you have an account)

```bash
# Requires: export AUPHONIC_API_KEY=... (https://auphonic.com/api/api_keys/)
python3 tools/narration/auphonic_submit.py $1
# Or with a specific preset:
python3 tools/narration/auphonic_submit.py $1 --preset <preset-uuid>
# List your account's presets:
python3 tools/narration/auphonic_submit.py --list-presets
```

Uploads to Auphonic, polls for completion (1-3 min for a 15-min file), downloads `narration-mastered.wav`. Use this when you want Auphonic's specific tuning (Adaptive Leveler, intelligent noise reduction) or you've already set up a custom preset there.

#### Either path

Re-run audio_qa on the mastered file to confirm LUFS is on target (local_master does this automatically):
```bash
python3 tools/narration/audio_qa.py --wav episodes/$1/assets/narration-mastered.wav
```

If the operator prefers in-DAW mastering instead, skip both — record clean and master in your DAW. The pipeline doesn't care which path produced the final WAV.

### Stage 4 — advance the manifest

When the WAV (mastered or raw) is clean and there are no major pickup candidates, refresh the assembly manifest in precise mode so visual timings sync to actual narration:

```bash
python3 tools/assembly/generate_manifest.py $1 --audio
```

This promotes the manifest from `estimate` to `precise` mode (Whisper-aligned timings).

## Mode C — both (if user explicitly asks for it)

If the operator says "regenerate both" or "rerun prep + QA," do Mode A then Mode B. Useful after re-recording.

## Notes

- All nine underlying tools (`format_for_reading`, `pronunciation_guide`, `pre_render_cue_sheet`, `audio_qa`, `whisper_alignment`, `take_selector`, `splice_plan`, `local_master`, `auphonic_submit`) are idempotent — re-running them is always safe. The `--merge` flag on `pronunciation_guide.py` is the only thing that preserves operator state across runs. `whisper_alignment` caches transcripts by file mtime + params, so iteration is fast.
- The exact-command philosophy from `polish_lint.py` and `pipeline_validator.py` carries over here: never describe a fix in prose where a copy-pasteable command would do.
- If `$1` is missing, default to listing available episodes from `pipeline-state.json` and asking the operator to pick one.
- This command does NOT commit anything. The operator decides when to stage `narration-readable.md`, `pronunciation-guide.md`, `_audio-qa.md`, and `narration.wav`.
