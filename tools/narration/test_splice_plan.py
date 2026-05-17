"""
Unit tests for tools/narration/splice_plan.py.

Coverage:
  · build_splice_plan — positional matching, mismatch warnings, empty cases
  · Audacity label format renderer (tab-separated, 3-decimal times)
  · Label truncation (tabs/newlines stripped, length cap)
  · CLI smoke
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
import splice_plan as sp  # type: ignore[import-not-found]
import whisper_alignment as wa  # type: ignore[import-not-found]


# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_report(*candidates: tuple[float, float, str, str]) -> wa.AlignmentReport:
    """Build a minimal report with synthesized pickup candidates.

    Each tuple: (start_sec, end_sec, script_text, spoken_text).
    All candidates are major + missed/substituted so they count as pickups.
    """
    issues = [
        wa.AlignmentIssue(
            kind="missed" if not spoken else "substituted",
            severity="major", script_text=script, spoken_text=spoken,
            audio_start_sec=start, audio_end_sec=end, beat_number=1,
        )
        for start, end, script, spoken in candidates
    ]
    return wa.AlignmentReport(
        issues=issues, script_word_count=100, transcript_word_count=80,
        transcript_duration_sec=120, estimated_script_duration_sec=120,
    )


# ── build_splice_plan ────────────────────────────────────────────────────────


class TestBuildSplicePlan:
    def test_positional_matching(self, tmp_path):
        report = _make_report(
            (10.0, 12.0, "first missed line", ""),
            (30.0, 32.5, "second", ""),
        )
        p1 = tmp_path / "pickup-1.wav"; p1.write_bytes(b"x")
        p2 = tmp_path / "pickup-2.wav"; p2.write_bytes(b"y")
        marks, warnings = sp.build_splice_plan(report, [p1, p2], pad_sec=0)
        assert len(marks) == 2
        assert warnings == []
        assert marks[0].pickup_path == p1
        assert marks[0].start_sec == 10.0
        assert marks[1].pickup_path == p2
        assert marks[1].start_sec == 30.0

    def test_pad_expands_region(self, tmp_path):
        report = _make_report((10.0, 12.0, "x", ""))
        p = tmp_path / "p.wav"; p.write_bytes(b"")
        marks, _ = sp.build_splice_plan(report, [p], pad_sec=0.25)
        assert marks[0].start_sec == pytest.approx(9.75)
        assert marks[0].end_sec == pytest.approx(12.25)

    def test_pad_does_not_go_negative(self, tmp_path):
        report = _make_report((0.05, 1.0, "x", ""))
        p = tmp_path / "p.wav"; p.write_bytes(b"")
        marks, _ = sp.build_splice_plan(report, [p], pad_sec=0.5)
        assert marks[0].start_sec == 0.0  # clamped

    def test_more_pickups_than_candidates_warns_and_truncates(self, tmp_path):
        report = _make_report((10.0, 12.0, "x", ""))
        p1 = tmp_path / "1.wav"; p1.write_bytes(b"")
        p2 = tmp_path / "2.wav"; p2.write_bytes(b"")
        marks, warnings = sp.build_splice_plan(report, [p1, p2], pad_sec=0)
        assert len(marks) == 1
        assert any("extras ignored" in w for w in warnings)

    def test_fewer_pickups_than_candidates_warns(self, tmp_path):
        report = _make_report(
            (10.0, 12.0, "a", ""), (20.0, 22.0, "b", ""), (30.0, 32.0, "c", ""),
        )
        p = tmp_path / "p.wav"; p.write_bytes(b"")
        marks, warnings = sp.build_splice_plan(report, [p], pad_sec=0)
        assert len(marks) == 1
        assert any("only the first" in w for w in warnings)

    def test_no_candidates_returns_empty(self, tmp_path):
        report = _make_report()
        p = tmp_path / "p.wav"; p.write_bytes(b"")
        marks, warnings = sp.build_splice_plan(report, [p])
        assert marks == []
        assert any("nothing to splice" in w for w in warnings)


# ── _truncate_for_label ──────────────────────────────────────────────────────


class TestTruncateForLabel:
    def test_short_text_unchanged(self):
        assert sp._truncate_for_label("hello") == "hello"

    def test_strips_tabs_and_newlines(self):
        # Audacity labels are tab-separated; embedded tabs would break parsing.
        assert "\t" not in sp._truncate_for_label("hi\tworld\n!")

    def test_truncates_at_word_boundary(self):
        out = sp._truncate_for_label("alpha beta gamma delta epsilon zeta", max_chars=15)
        assert out.endswith("…")
        head = out[:-1].rstrip()
        for w in head.split():
            assert w in "alpha beta gamma delta epsilon zeta".split()


# ── render_audacity_labels ───────────────────────────────────────────────────


class TestRenderAudacityLabels:
    def test_format_is_tab_separated_with_three_decimals(self, tmp_path):
        report = _make_report((10.123456, 12.987654, "the missed line", ""))
        p = tmp_path / "pickup-1.wav"; p.write_bytes(b"")
        marks, _ = sp.build_splice_plan(report, [p], pad_sec=0)
        out = sp.render_audacity_labels(marks)
        # Tab between start and end, tab between end and label
        assert "10.123\t12.988\t" in out
        # 3-decimal precision in the output
        assert "10.1234" not in out

    def test_label_includes_pickup_index_and_filename(self, tmp_path):
        report = _make_report((1.0, 2.0, "hello", ""))
        p = tmp_path / "my-pickup.wav"; p.write_bytes(b"")
        marks, _ = sp.build_splice_plan(report, [p], pad_sec=0)
        out = sp.render_audacity_labels(marks)
        assert "PICKUP 1" in out
        assert "my-pickup.wav" in out
        assert "hello" in out

    def test_empty_marks_produces_empty_string(self):
        assert sp.render_audacity_labels([]) == ""

    def test_no_tabs_or_newlines_in_labels(self, tmp_path):
        # Even with messy script text, the label cell must be one line
        # without embedded tabs (Audacity uses tabs as column separators).
        report = _make_report((1.0, 2.0, "line with\ttab and\nnewline", ""))
        p = tmp_path / "p.wav"; p.write_bytes(b"")
        marks, _ = sp.build_splice_plan(report, [p], pad_sec=0)
        out = sp.render_audacity_labels(marks)
        lines = [l for l in out.splitlines() if l.strip()]
        for line in lines:
            cells = line.split("\t")
            assert len(cells) == 3, f"expected 3 cells, got {len(cells)}: {line!r}"


# ── CLI smoke ────────────────────────────────────────────────────────────────


class TestCliSmoke:
    @staticmethod
    def _make_script(tmp_path: Path) -> Path:
        p = tmp_path / "script-production.md"
        p.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world this is a test. | x |
            | A second sentence here. | x |
            | And a third. | x |
        """), encoding="utf-8")
        return p

    @staticmethod
    def _make_transcript(tmp_path: Path, words: list[tuple[str, float]]) -> Path:
        """words: list of (word, start_sec) tuples — duration is fixed at 0.4s."""
        wlist = [
            {"start": s, "end": s + 0.4, "word": w, "probability": 0.99}
            for w, s in words
        ]
        p = tmp_path / "transcript.json"
        p.write_text(json.dumps({
            "segments": [{
                "start": words[0][1] if words else 0,
                "end": (words[-1][1] + 0.4) if words else 0,
                "text": " ".join(w for w, _ in words),
                "words": wlist,
            }]
        }), encoding="utf-8")
        return p

    def test_writes_label_track_to_stdout(self, tmp_path):
        # Transcript matches only the first sentence; rest are missed.
        script = self._make_script(tmp_path)
        transcript = self._make_transcript(tmp_path, [
            ("Hello", 0.0), ("world", 0.5), ("this", 1.0),
            ("is", 1.5), ("a", 2.0), ("test.", 2.5),
        ])
        # One pickup file for the second sentence (which got missed)
        pickup = tmp_path / "pickup-1.wav"; pickup.write_bytes(b"x")

        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "splice_plan.py"),
                "smoke",
                "--script", str(script),
                "--transcript", str(transcript),
                "--pickups", str(pickup),
                "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        # Output should be tab-separated label format
        assert "\t" in result.stdout
        assert "PICKUP 1" in result.stdout

    def test_no_candidates_exits_1(self, tmp_path):
        """Clean alignment (transcript matches script perfectly) →
        nothing to splice → exit 1 to differentiate from success."""
        script = self._make_script(tmp_path)
        transcript = self._make_transcript(tmp_path, [
            ("Hello", 0.0), ("world", 0.5), ("this", 1.0), ("is", 1.5),
            ("a", 2.0), ("test.", 2.5), ("A", 3.0), ("second", 3.5),
            ("sentence", 4.0), ("here.", 4.5), ("And", 5.0), ("a", 5.5),
            ("third.", 6.0),
        ])
        pickup = tmp_path / "pickup-1.wav"; pickup.write_bytes(b"x")

        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "splice_plan.py"),
                "smoke",
                "--script", str(script),
                "--transcript", str(transcript),
                "--pickups", str(pickup),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 1
        assert "nothing to splice" in result.stderr

    def test_missing_pickup_file_exits_2(self, tmp_path):
        script = self._make_script(tmp_path)
        transcript = self._make_transcript(tmp_path, [("Hello", 0.0)])
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "splice_plan.py"),
                "smoke",
                "--script", str(script),
                "--transcript", str(transcript),
                "--pickups", str(tmp_path / "no-such.wav"),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "pickup not found" in result.stderr
