"""
Unit tests for tools/narration/pickup_script.py.

Covers:
  · _split_into_sentences (abbrev-aware)
  · _find_sentence_containing
  · merge_adjacent_issues — fuses within window, respects beat boundaries
  · _build_context — lead/pickup/trail from synthetic beats
  · build_pickup_chunks — single + multi-issue groups
  · run_pickup_pass with --alignment-json (no Whisper)
  · render_pickup_md — clean-take vs flagged-take output
  · render_audacity_labels — TSV format
  · CLI smoke (missing inputs, --alignment-json path, --labels output)
"""

from __future__ import annotations

import json
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pickup_script as ps  # type: ignore[import-not-found]
import whisper_alignment as wa  # type: ignore[import-not-found]


# ── Sentence helpers ────────────────────────────────────────────────────────


class TestSplitIntoSentences:
    def test_basic_split(self):
        out = ps._split_into_sentences("First. Second. Third.")
        assert len(out) == 3

    def test_respects_abbrev(self):
        out = ps._split_into_sentences("Dr. Smith said hi. Then he left.")
        assert len(out) == 2

    def test_empty(self):
        assert ps._split_into_sentences("") == []


class TestFindSentenceContaining:
    def test_finds_exact_match(self):
        text = "Alpha is first. Beta is second. Gamma is third."
        idx, sentences = ps._find_sentence_containing(text, "Beta is second")
        assert idx == 1

    def test_first_three_words_fallback(self):
        text = "Alpha is first. The cat sat there. Gamma is third."
        # Needle that's a partial overlap — first 3 words should match
        idx, _ = ps._find_sentence_containing(
            text, "The cat sat on the mat over there",
        )
        # First 3 words "The cat sat" match sentence 2
        assert idx == 1

    def test_not_found_returns_minus_one(self):
        text = "Alpha. Beta. Gamma."
        idx, _ = ps._find_sentence_containing(text, "zeta omicron rho")
        assert idx == -1

    def test_empty_needle_returns_minus_one(self):
        text = "Alpha. Beta."
        idx, _ = ps._find_sentence_containing(text, "")
        assert idx == -1

    def test_best_overlap_picks_better_sentence(self):
        # The needle "rational actor decides quickly today" shares more
        # words with sentence 1 than the "rational actor" mention in
        # sentence 0. Pre-fix, first-substring-match picked sentence 0.
        text = (
            "A rational actor exists. "
            "The rational actor decides quickly today in this case."
        )
        idx, _ = ps._find_sentence_containing(
            text, "rational actor decides quickly today",
        )
        # Best overlap should pick sentence 1, not the first substring hit
        assert idx == 1


# ── merge_adjacent_issues ───────────────────────────────────────────────────


def _make_issue(beat, start, end, script="some text", spoken="other text"):
    return wa.AlignmentIssue(
        kind="missed", severity="major", script_text=script, spoken_text=spoken,
        audio_start_sec=start, audio_end_sec=end, beat_number=beat,
    )


class TestMergeAdjacentIssues:
    def test_empty(self):
        assert ps.merge_adjacent_issues([]) == []

    def test_far_apart_not_merged(self):
        issues = [
            _make_issue(1, 0.0, 1.0),
            _make_issue(1, 60.0, 61.0),
        ]
        groups = ps.merge_adjacent_issues(issues, window_sec=15)
        assert len(groups) == 2

    def test_close_together_merged(self):
        issues = [
            _make_issue(1, 0.0, 1.0),
            _make_issue(1, 5.0, 6.0),
            _make_issue(1, 8.0, 9.0),
        ]
        groups = ps.merge_adjacent_issues(issues, window_sec=15)
        assert len(groups) == 1
        assert len(groups[0]) == 3

    def test_different_beats_not_merged(self):
        # Two issues 1 sec apart but in different beats — keep separate
        issues = [
            _make_issue(1, 0.0, 1.0),
            _make_issue(2, 2.0, 3.0),
        ]
        groups = ps.merge_adjacent_issues(issues, window_sec=15)
        assert len(groups) == 2

    def test_sorts_by_audio_start(self):
        issues = [
            _make_issue(1, 10.0, 11.0),
            _make_issue(1, 0.0, 1.0),
            _make_issue(1, 5.0, 6.0),
        ]
        groups = ps.merge_adjacent_issues(issues, window_sec=15)
        # All within window → single group, sorted internally
        assert len(groups) == 1
        starts = [i.audio_start_sec for i in groups[0]]
        assert starts == sorted(starts)


# ── _build_context ──────────────────────────────────────────────────────────


def _make_beat(num, take_text):
    take = ffr_take(take_text)
    b = wa.ffr.Beat(number=num, title=f"Beat {num}", timing="")
    b.takes.append(take)
    return b


def ffr_take(text: str):
    import format_for_reading as ffr
    return ffr.Take(kind="narration", text=text, word_count=len(text.split()))


class TestBuildContext:
    def test_finds_lead_and_trail(self):
        beat = _make_beat(1, (
            "First sentence opens. The middle sentence is the pickup target. "
            "Trail sentence closes."
        ))
        issue = _make_issue(1, 0.0, 1.0, script="middle sentence is the pickup target")
        lead, pickup, trail = ps._build_context(issue, [beat])
        assert "First sentence opens" in lead
        assert "middle sentence" in pickup
        assert "Trail sentence" in trail

    def test_no_lead_at_start(self):
        beat = _make_beat(1, "Only sentence here. Trail after.")
        issue = _make_issue(1, 0.0, 1.0, script="Only sentence here")
        lead, pickup, trail = ps._build_context(issue, [beat])
        assert lead == ""
        assert "Only sentence" in pickup

    def test_no_beat_match_returns_fallback(self):
        beat = _make_beat(1, "Some text.")
        issue = _make_issue(99, 0.0, 1.0, script="missing material")
        lead, pickup, trail = ps._build_context(issue, [beat])
        assert lead == ""
        assert "missing material" in pickup

    def test_empty_script_text_uses_insertion_label(self):
        beat = _make_beat(1, "Some text.")
        issue = _make_issue(1, 0.0, 1.0, script="", spoken="ad-lib")
        lead, pickup, trail = ps._build_context(issue, [beat])
        # Spoken text used as fallback when script_text is empty
        assert pickup  # not blank


# ── build_pickup_chunks ─────────────────────────────────────────────────────


class TestBuildPickupChunks:
    def _make_align_report(self, issues):
        return wa.AlignmentReport(
            issues=issues, script_word_count=100, transcript_word_count=100,
            transcript_duration_sec=60.0, estimated_script_duration_sec=60.0,
        )

    def test_no_pickups_no_chunks(self):
        report = self._make_align_report([])
        chunks = ps.build_pickup_chunks(report, [])
        assert chunks == []

    def test_single_pickup_one_chunk(self):
        beat = _make_beat(1, "Lead one. Pickup target here. Trail two.")
        issue = _make_issue(1, 10.0, 12.0, script="Pickup target here")
        report = self._make_align_report([issue])
        chunks = ps.build_pickup_chunks(report, [beat])
        assert len(chunks) == 1
        assert chunks[0].beat_number == 1
        assert chunks[0].audio_start_sec == 10.0
        assert "Pickup target" in chunks[0].pickup_text

    def test_two_close_pickups_merged(self):
        beat = _make_beat(1, (
            "Open. First pickup target. Middle. Second pickup target. Close."
        ))
        i1 = _make_issue(1, 5.0, 6.0, script="First pickup target")
        i2 = _make_issue(1, 8.0, 9.0, script="Second pickup target")
        report = self._make_align_report([i1, i2])
        chunks = ps.build_pickup_chunks(report, [beat], merge_window=15)
        assert len(chunks) == 1
        assert chunks[0].audio_start_sec == 5.0
        assert chunks[0].audio_end_sec == 9.0
        # Both pickup texts combined
        assert "First pickup" in chunks[0].pickup_text
        assert "Second pickup" in chunks[0].pickup_text


# ── run_pickup_pass via --alignment-json (no Whisper) ───────────────────────


class TestRunPickupPass:
    def test_from_alignment_json(self, tmp_path):
        # Set up a tiny script + a pre-built alignment JSON
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Lead sentence. Pickup target here. Trail sentence. | [FOOTAGE: x] |
        """), encoding="utf-8")
        align_json = tmp_path / "align.json"
        align_json.write_text(json.dumps({
            "issues": [{
                "kind": "missed", "severity": "major",
                "script_text": "Pickup target here", "spoken_text": "",
                "audio_start_sec": 10.0, "audio_end_sec": 12.0,
                "beat_number": 1,
            }],
            "script_word_count": 8,
            "transcript_word_count": 6,
            "transcript_duration_sec": 30.0,
            "estimated_script_duration_sec": 30.0,
        }), encoding="utf-8")
        report = ps.run_pickup_pass(
            "test", script, alignment_json=align_json,
        )
        assert report.chunk_count == 1
        assert "Pickup target" in report.chunks[0].pickup_text

    def test_no_inputs_raises(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text("## BEAT 1 — x", encoding="utf-8")
        with pytest.raises(ValueError, match="wav_path or alignment_json"):
            ps.run_pickup_pass("x", script)


# ── render_pickup_md ────────────────────────────────────────────────────────


class TestRenderPickupMd:
    def test_clean_take_message(self):
        report = ps.PickupReport(
            slug="x", wav_path="/tmp/x.wav", script_path="/tmp/x.md",
            total_alignment_issues=0, chunks=[],
        )
        out = ps.render_pickup_md(report)
        assert "No pickups needed" in out

    def test_renders_chunks_with_context(self):
        chunk = ps.PickupChunk(
            chunk_number=1, beat_number=2, beat_title="MIDDLE",
            audio_start_sec=65.0, audio_end_sec=70.0,
            lead_in="Lead-in sentence.",
            pickup_text="RECORD THIS LINE.",
            trail_out="Trail sentence.",
        )
        report = ps.PickupReport(
            slug="x", wav_path="/tmp/x.wav", script_path="/tmp/x.md",
            total_alignment_issues=1, chunks=[chunk],
        )
        out = ps.render_pickup_md(report)
        assert "Lead-in sentence" in out
        assert "RECORD THIS LINE" in out
        assert "Trail sentence" in out
        assert "1:05" in out and "1:10" in out  # audio timestamps


# ── render_audacity_labels ──────────────────────────────────────────────────


class TestRenderAudacityLabels:
    def test_emits_tab_separated_rows(self):
        chunk = ps.PickupChunk(
            chunk_number=1, beat_number=2, beat_title="x",
            audio_start_sec=10.5, audio_end_sec=15.25,
            lead_in="", pickup_text="Sample text.", trail_out="",
        )
        report = ps.PickupReport(
            slug="x", wav_path="", script_path="", total_alignment_issues=1,
            chunks=[chunk],
        )
        out = ps.render_audacity_labels(report)
        assert "10.500\t15.250\tPickup 1" in out

    def test_truncates_long_labels(self):
        long = "x" * 200
        chunk = ps.PickupChunk(
            chunk_number=1, beat_number=2, beat_title="x",
            audio_start_sec=0.0, audio_end_sec=1.0,
            lead_in="", pickup_text=long, trail_out="",
        )
        report = ps.PickupReport(
            slug="x", wav_path="", script_path="", total_alignment_issues=1,
            chunks=[chunk],
        )
        out = ps.render_audacity_labels(report)
        assert "…" in out
        # Label string itself shouldn't be the full 200 chars
        assert len(out) < 250


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_no_wav_no_json_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "pickup_script.py"),
             "prisoners-dilemma"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "wav" in result.stderr.lower() or "json" in result.stderr.lower()

    def test_missing_align_json_exits_2(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text("## BEAT 1 — x", encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "pickup_script.py"),
             "x", "--script", str(script),
             "--alignment-json", str(tmp_path / "no-such.json")],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_end_to_end_alignment_json_path(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Lead sentence. Pickup target here. Trail sentence. | [FOOTAGE: x] |
        """), encoding="utf-8")
        align = tmp_path / "align.json"
        align.write_text(json.dumps({
            "issues": [{
                "kind": "missed", "severity": "major",
                "script_text": "Pickup target here", "spoken_text": "",
                "audio_start_sec": 10.0, "audio_end_sec": 12.0,
                "beat_number": 1,
            }],
            "script_word_count": 8, "transcript_word_count": 6,
            "transcript_duration_sec": 30.0,
            "estimated_script_duration_sec": 30.0,
        }), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "pickup_script.py"),
             "x", "--script", str(script), "--alignment-json", str(align),
             "--json", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["chunk_count"] == 1
        assert "Pickup target" in payload["chunks"][0]["pickup_text"]

    def test_cli_empty_pickups_clean_take_message(self, tmp_path):
        # Alignment with no major issues → CLI returns 0, renders the
        # "no pickups needed" message.
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | [FOOTAGE: x] |
        """), encoding="utf-8")
        align = tmp_path / "align.json"
        # Only minor issues — these are NOT pickup_candidates
        align.write_text(json.dumps({
            "issues": [{
                "kind": "substituted", "severity": "minor",
                "script_text": "the", "spoken_text": "a",
                "audio_start_sec": 1.0, "audio_end_sec": 1.2,
                "beat_number": 1,
            }],
            "script_word_count": 2, "transcript_word_count": 2,
            "transcript_duration_sec": 5.0,
            "estimated_script_duration_sec": 5.0,
        }), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "pickup_script.py"),
             "x", "--script", str(script), "--alignment-json", str(align),
             "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "No pickups needed" in result.stdout

    def test_cli_malformed_alignment_json_exits_1(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text("## BEAT 1 — x", encoding="utf-8")
        align = tmp_path / "align.json"
        align.write_text("not valid json", encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "pickup_script.py"),
             "x", "--script", str(script), "--alignment-json", str(align),
             "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 1
        assert "alignment failed" in result.stderr

    def test_alignment_json_filters_unknown_fields(self, tmp_path):
        # Forward-compat: an alignment JSON with extra fields beyond what
        # AlignmentIssue currently has should still load (filtered out).
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Pickup target. | [FOOTAGE: x] |
        """), encoding="utf-8")
        align = tmp_path / "align.json"
        align.write_text(json.dumps({
            "issues": [{
                "kind": "missed", "severity": "major",
                "script_text": "Pickup target", "spoken_text": "",
                "audio_start_sec": 1.0, "audio_end_sec": 2.0,
                "beat_number": 1,
                # Future field that doesn't exist on AlignmentIssue today
                "future_field_not_in_dataclass": "ignored",
            }],
            "script_word_count": 2, "transcript_word_count": 1,
            "transcript_duration_sec": 5.0,
            "estimated_script_duration_sec": 5.0,
        }), encoding="utf-8")
        report = ps.run_pickup_pass(
            "x", script, alignment_json=align,
        )
        assert report.chunk_count == 1

    def test_labels_output_creates_file(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Lead. Pickup here. Trail. | [FOOTAGE: x] |
        """), encoding="utf-8")
        align = tmp_path / "align.json"
        align.write_text(json.dumps({
            "issues": [{
                "kind": "missed", "severity": "major",
                "script_text": "Pickup here", "spoken_text": "",
                "audio_start_sec": 5.0, "audio_end_sec": 7.0,
                "beat_number": 1,
            }],
            "script_word_count": 5, "transcript_word_count": 4,
            "transcript_duration_sec": 10.0,
            "estimated_script_duration_sec": 10.0,
        }), encoding="utf-8")
        labels = tmp_path / "labels.txt"
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "pickup_script.py"),
             "x", "--script", str(script), "--alignment-json", str(align),
             "--labels", str(labels), "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert labels.is_file()
        # TSV format: start\tend\tlabel
        content = labels.read_text(encoding="utf-8")
        assert "\t" in content
        assert "Pickup 1" in content
