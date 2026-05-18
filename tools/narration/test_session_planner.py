"""
Unit tests for tools/narration/session_planner.py.

Covers:
  · _fmt_min_sec / _fmt_minutes
  · _compute_segments — break boundaries respect break_every + MIN_SEGMENT
  · _compute_warmup_order — easiest beat first
  · plan_session — end-to-end on synthetic script
  · plan_session input validation (wpm, overhead, break_every)
  · render_plan_md — overview, per-beat table, segments, warmup
  · CLI smoke (--json, --wpm override, missing script)
  · Real-script smoke
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
import session_planner as sp  # type: ignore[import-not-found]


# ── Formatters ──────────────────────────────────────────────────────────────


class TestFormatters:
    def test_fmt_min_sec(self):
        assert sp._fmt_min_sec(0) == "0:00"
        assert sp._fmt_min_sec(125) == "2:05"
        assert sp._fmt_min_sec(60) == "1:00"

    def test_fmt_minutes(self):
        assert sp._fmt_minutes(60) == "1.0 min"
        assert sp._fmt_minutes(150) == "2.5 min"


# ── _compute_segments ───────────────────────────────────────────────────────


def _beat(num, session_sec):
    """Quick BeatPlan factory for segmentation tests."""
    return sp.BeatPlan(
        beat_number=num, beat_title=f"B{num}", word_count=0,
        estimated_runtime_sec=0, estimated_session_sec=session_sec,
        sayability_flagged_count=0, sayability_max_score=0,
        avg_sayability=0,
    )


class TestComputeSegments:
    def test_single_segment_under_target(self):
        beats = [_beat(1, 60), _beat(2, 60), _beat(3, 60)]  # 3 min total
        segs = sp._compute_segments(beats, break_every_min=15)
        assert len(segs) == 1
        assert segs[0].beats == [1, 2, 3]

    def test_splits_at_target(self):
        # 4 beats × 5min = 20 min; break every 10 → 2 segments
        beats = [_beat(i, 300) for i in range(1, 5)]
        segs = sp._compute_segments(beats, break_every_min=10)
        assert len(segs) == 2
        # First segment hits ~10 min
        assert segs[0].session_minutes == pytest.approx(10.0, abs=0.5)

    def test_respects_min_segment(self):
        # First beat is tiny (2 min); shouldn't immediately propose break
        beats = [_beat(1, 120), _beat(2, 600), _beat(3, 600)]
        segs = sp._compute_segments(beats, break_every_min=5)
        # Beat 1 should fold into segment 1 (don't open new at < MIN_SEGMENT)
        assert segs[0].beats[0] == 1
        assert 1 in segs[0].beats

    def test_empty_input(self):
        assert sp._compute_segments([], break_every_min=10) == []

    def test_long_beat_alone_in_segment(self):
        # 25-min single beat preceded + followed by 1-min beats. Pre-fix,
        # beat 1 + beat 2 fused into a 26-min segment. Post-fix: the
        # oversized beat lands alone in its own 25-min segment (single
        # beats can't be split — 25 min is the floor).
        beats = [_beat(1, 60), _beat(2, 1500), _beat(3, 60)]
        segs = sp._compute_segments(beats, break_every_min=15)
        assert len(segs) >= 3
        # Find the segment containing beat 2 — it should be alone there.
        beat2_seg = next(s for s in segs if 2 in s.beats)
        assert beat2_seg.beats == [2], (
            f"Oversized beat 2 should be alone in its segment, "
            f"not fused with neighbors. Got: {beat2_seg.beats}"
        )

    def test_tiny_then_huge_beat_does_not_fuse(self):
        # Specific reproduction of the P0 bug: a tiny beat followed by
        # a 25-min beat used to share a segment, producing 26 minutes
        # with no break.
        beats = [_beat(1, 60), _beat(2, 1500)]
        segs = sp._compute_segments(beats, break_every_min=15)
        # The huge beat should be alone in its own segment after the
        # tiny one closes via the post-append boundary check.
        assert any(s.session_minutes > 20 for s in segs), \
            "Huge beat should land somewhere"
        max_seg = max(s.session_minutes for s in segs)
        assert max_seg <= 25.1  # ≤ 25 min (the beat itself), not 26+


# ── _compute_warmup_order ───────────────────────────────────────────────────


class TestWarmupOrder:
    def test_easiest_beat_first(self):
        # Beat 2 is easiest; should come first
        b1 = _beat(1, 60); b1.avg_sayability = 50.0
        b2 = _beat(2, 60); b2.avg_sayability = 20.0
        b3 = _beat(3, 60); b3.avg_sayability = 40.0
        order = sp._compute_warmup_order([b1, b2, b3], warmup_count=1)
        assert order == [2, 1, 3]

    def test_warmup_count_zero(self):
        b1 = _beat(1, 60); b1.avg_sayability = 50.0
        b2 = _beat(2, 60); b2.avg_sayability = 20.0
        # warmup_count=0 → just script order
        order = sp._compute_warmup_order([b1, b2], warmup_count=0)
        assert order == [1, 2]

    def test_empty(self):
        assert sp._compute_warmup_order([]) == []


# ── plan_session ────────────────────────────────────────────────────────────


def _fixture_script(tmp_path, body: str) -> Path:
    script = tmp_path / "script.md"
    script.write_text(body, encoding="utf-8")
    return script


class TestPlanSession:
    def test_e2e_basic(self, tmp_path):
        script = _fixture_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Open (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world this is a short opening line. | [FOOTAGE: x] |

            ## BEAT 2 — Body (1:00–3:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Another line of narration here. | [FOOTAGE: y] |
        """))
        plan = sp.plan_session("test", script, wpm=150, overhead=1.5)
        assert plan.total_words > 0
        assert len(plan.beats) == 2
        # Session = runtime × overhead
        assert plan.total_session_sec == pytest.approx(
            plan.total_runtime_sec * 1.5, rel=0.01,
        )
        # Each beat got its own BeatPlan
        assert plan.beats[0].beat_number == 1
        assert plan.beats[1].beat_number == 2

    def test_invalid_wpm_raises(self, tmp_path):
        script = _fixture_script(tmp_path, "## BEAT 1 — x\n")
        with pytest.raises(ValueError, match="wpm"):
            sp.plan_session("x", script, wpm=0)

    def test_invalid_overhead_raises(self, tmp_path):
        script = _fixture_script(tmp_path, "## BEAT 1 — x\n")
        with pytest.raises(ValueError, match="overhead"):
            sp.plan_session("x", script, overhead=0.5)

    def test_invalid_break_every_raises(self, tmp_path):
        script = _fixture_script(tmp_path, "## BEAT 1 — x\n")
        with pytest.raises(ValueError, match="break_every"):
            sp.plan_session("x", script, break_every_min=0)


# ── render_plan_md ──────────────────────────────────────────────────────────


class TestRenderPlanMd:
    def test_contains_overview_and_table(self, tmp_path):
        script = _fixture_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Open (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world this is the opening. | [FOOTAGE: x] |
        """))
        plan = sp.plan_session("test", script)
        out = sp.render_plan_md(plan)
        assert "Narration Session Plan" in out
        assert "Per-beat estimate" in out
        assert "Suggested segments" in out
        assert "Suggested warm-up order" in out


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_slug_exits_2(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "session_planner.py"),
                "definitely-not-an-episode-xyz",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_json_emits_valid_json(self, tmp_path):
        script = _fixture_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Open (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | [FOOTAGE: x] |
        """))
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "session_planner.py"),
                "x", "--script", str(script), "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["slug"] == "x"
        assert "beats" in payload
        assert "segments" in payload
        assert "warmup_order" in payload

    def test_wpm_override_affects_runtime(self, tmp_path):
        script = _fixture_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Open (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world this is a longer line for testing. | [FOOTAGE: x] |
        """))
        # 150 wpm vs 300 wpm → 300 should produce half the runtime
        r150 = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "session_planner.py"),
             "x", "--script", str(script), "--wpm", "150", "--json", "--stdout"],
            capture_output=True, text=True,
        )
        r300 = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "session_planner.py"),
             "x", "--script", str(script), "--wpm", "300", "--json", "--stdout"],
            capture_output=True, text=True,
        )
        p150 = json.loads(r150.stdout)
        p300 = json.loads(r300.stdout)
        assert p150["total_runtime_sec"] == pytest.approx(
            p300["total_runtime_sec"] * 2, rel=0.01,
        )

    def test_invalid_overhead_via_cli_exits_2(self, tmp_path):
        script = _fixture_script(tmp_path, "## BEAT 1 — x\n")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "session_planner.py"),
             "x", "--script", str(script), "--overhead", "0.5", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_real_prisoners_dilemma_smoke(self):
        script_dir = REPO_ROOT / "episodes" / "prisoners-dilemma"
        if not (
            (script_dir / "script-production.md").is_file()
            or list(script_dir.glob("script-v*-production.md"))
        ):
            pytest.skip("prisoners-dilemma script not present in this checkout")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "session_planner.py"),
             "prisoners-dilemma", "--json", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["total_words"] > 1000
        assert len(payload["beats"]) == 5
        assert payload["total_session_sec"] > payload["total_runtime_sec"]
