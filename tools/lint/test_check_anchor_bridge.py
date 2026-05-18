"""
Unit tests for tools/lint/check_anchor_bridge.py.

Covers:
  · classify_cell — each tag type, MG template variants, skip rules
  · parse_visual_cells against a synthetic two-column script
  · lint_beats — ok / wall-of-typography / no-anchor / short-no-anchor
  · render_report_md — table rows, findings section, headers
  · run_audit end-to-end on a temp script
  · CLI smoke (missing script, --json, --strict exit codes)
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
import check_anchor_bridge as cab  # type: ignore[import-not-found]


# ── classify_cell ───────────────────────────────────────────────────────────


class TestClassifyCell:
    def test_footage_is_anchor(self):
        c = cab.classify_cell("[FOOTAGE: dust over Beijing skyline]")
        assert c is not None
        assert c.tag == "FOOTAGE"
        assert c.is_anchor and not c.is_text_heavy

    def test_archival_is_anchor(self):
        c = cab.classify_cell("[ARCHIVAL: 1939 newsreel still]")
        assert c is not None
        assert c.is_anchor

    def test_ai_gen_scene_is_anchor(self):
        c = cab.classify_cell("[AI-GEN: constructivist boardroom]")
        assert c is not None
        assert c.tag == "AI-GEN"
        assert c.is_anchor

    def test_scene_is_anchor(self):
        c = cab.classify_cell("[SCENE: chained morph through three rooms]")
        assert c is not None
        assert c.is_anchor

    def test_forecast_is_anchor(self):
        c = cab.classify_cell("[FORECAST: gauge 0.6 → 0.4]")
        assert c is not None
        assert c.is_anchor

    def test_mg_framework_template_is_anchor(self):
        c = cab.classify_cell("[MG: FrameworkDiagram · priority=A]")
        assert c is not None
        assert c.tag == "MG"
        assert c.template == "FrameworkDiagram"
        assert c.is_anchor and not c.is_text_heavy

    def test_mg_data_chart_is_anchor(self):
        c = cab.classify_cell("[MG: DataChart showing trade flow]")
        assert c is not None
        assert c.template == "DataChart"
        assert c.is_anchor

    def test_mg_map_is_anchor(self):
        c = cab.classify_cell("[MG: ChoroplethMap]")
        assert c is not None
        assert c.is_anchor

    def test_mg_kinetic_typography_is_text_heavy(self):
        c = cab.classify_cell("[MG: KineticTypography 'the trap']")
        assert c is not None
        assert c.template == "KineticTypography"
        assert c.is_text_heavy and not c.is_anchor

    def test_mg_quote_is_text_heavy(self):
        c = cab.classify_cell("[MG: Quote 'all is flux' — Heraclitus]")
        assert c is not None
        assert c.is_text_heavy

    def test_mg_unknown_template_is_neutral(self):
        # Unknown templates are neutral (neither anchor nor text-heavy)
        # so new templates don't silently penalize scripts that adopt them.
        c = cab.classify_cell("[MG: SomeNewTemplateName]")
        assert c is not None
        assert not c.is_text_heavy and not c.is_anchor

    def test_layered_is_neutral(self):
        # LAYERED carries both anchor evidence AND text density — treat as
        # neutral so it doesn't false-positive the wall-of-typography check.
        c = cab.classify_cell("[LAYERED: footage + typography overlay]")
        assert c is not None
        assert c.tag == "LAYERED"
        assert not c.is_text_heavy and not c.is_anchor

    def test_illust_is_neutral(self):
        c = cab.classify_cell("[ILLUST: atmospheric dust particles]")
        assert c is not None
        assert c.tag == "ILLUST"
        assert not c.is_anchor and not c.is_text_heavy

    def test_dir_line_skipped(self):
        assert cab.classify_cell("DIR: cut(dissolve)") is None
        assert cab.classify_cell("PACE: dense") is None
        assert cab.classify_cell("CAMERA: hold") is None

    def test_blank_skipped(self):
        assert cab.classify_cell("") is None
        assert cab.classify_cell("   ") is None

    def test_transition_skipped(self):
        assert cab.classify_cell("TRANSITION → cut to title") is None

    def test_untagged_skipped(self):
        # No [TAG:] pattern at all — likely a continuation line
        assert cab.classify_cell("continuation of previous visual") is None

    def test_unknown_tag_skipped(self):
        # Prose-brackets ([actual], [bracketed-term]) would otherwise
        # mis-parse as fake tags. Only the documented vocabulary
        # (FOOTAGE, ARCHIVAL, AI-GEN, AI-VIDEO, B-ROLL, SCENE, FORECAST,
        # MG, LAYERED, ILLUST) is recognized.
        assert cab.classify_cell("the [actual] meaning here") is None
        assert cab.classify_cell("see [bracketed-term] above") is None

    def test_ai_video_is_anchor(self):
        c = cab.classify_cell("[AI-VIDEO: pika 5s clip]")
        assert c is not None
        assert c.tag == "AI-VIDEO"
        assert c.is_anchor

    def test_b_roll_is_anchor(self):
        c = cab.classify_cell("[B-ROLL: cutaway shot]")
        assert c is not None
        assert c.tag == "B-ROLL"
        assert c.is_anchor

    def test_priority_marker_prefix_parses_mg_template(self):
        # The dominant pattern in every shipped script: "**P2** · [MG:] TemplateName"
        c = cab.classify_cell("**P2** · [MG:] KineticTypography 'opening line'")
        assert c is not None
        assert c.tag == "MG"
        assert c.template == "KineticTypography"
        assert c.is_text_heavy


# ── parse_visual_cells ──────────────────────────────────────────────────────


def _synthetic_script(body: str) -> str:
    """Wrap a body of NARRATION|VISUAL rows in a beat header."""
    return body


class TestParseVisualCells:
    def test_collects_cells_per_beat(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — Cold Open (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | First line of narration here. | [FOOTAGE: skyline pan] |
            | Second line of narration here. | [MG: FrameworkDiagram] |

            ## BEAT 2 — Second Act (1:00–3:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Words words words. | [MG: KineticTypography 'big'] |
            | More words on screen. | [MG: KineticTypography 'small'] |
        """), encoding="utf-8")

        beats = cab.parse_visual_cells(script)
        by_num = {b.beat_number: b for b in beats}
        assert by_num[1].anchor_count == 2
        assert by_num[1].text_heavy_count == 0
        assert by_num[2].anchor_count == 0
        assert by_num[2].text_heavy_count == 2
        assert by_num[2].typographic_ratio == 1.0

    def test_stops_at_asset_summary(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | [FOOTAGE: x] |

            ## ASSET SUMMARY

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | should not be parsed | [MG: KineticTypography] |
        """), encoding="utf-8")

        beats = cab.parse_visual_cells(script)
        assert len(beats) == 1
        assert beats[0].anchor_count == 1
        assert beats[0].text_heavy_count == 0


# ── lint_beats ──────────────────────────────────────────────────────────────


def _beat(num, word_count, cells_spec):
    """Build a BeatVisualReport. cells_spec: list of (is_anchor, is_text_heavy)."""
    b = cab.BeatVisualReport(beat_number=num, beat_title=f"Beat {num}", word_count=word_count)
    for is_a, is_t in cells_spec:
        b.cells.append(cab.VisualCell(
            tag="X", template="", raw="", is_anchor=is_a, is_text_heavy=is_t,
        ))
    return b


class TestLintBeats:
    def test_no_cells_yields_no_finding(self):
        findings = cab.lint_beats([_beat(1, 100, [])])
        assert findings == []

    def test_ok_when_anchor_present(self):
        b = _beat(1, 200, [(True, False), (False, True), (False, False)])
        findings = cab.lint_beats([b])
        assert len(findings) == 1
        assert findings[0].level == "ok"

    def test_no_anchor_long_beat_is_error(self):
        b = _beat(1, 150, [(False, True), (False, True), (False, True)])
        findings = cab.lint_beats([b])
        assert findings[0].level == "error"
        assert "NO anchor" in findings[0].message

    def test_no_anchor_short_beat_passes(self):
        # Under the 100-word threshold — missing anchor not flagged as error
        b = _beat(1, 50, [(False, True), (False, True)])
        findings = cab.lint_beats([b])
        # Likely falls through to wall-of-typography warn (>60% text-heavy, 0 anchor ≤1)
        assert findings[0].level == "warn"

    def test_wall_of_typography_warn(self):
        # 4 cells: 1 anchor, 3 text-heavy → 75% > 60%, anchor_count ≤ 1
        b = _beat(1, 200, [(True, False), (False, True), (False, True), (False, True)])
        findings = cab.lint_beats([b])
        assert findings[0].level == "warn"
        assert "text-heavy" in findings[0].message

    def test_two_anchors_with_typography_is_ok(self):
        # >60% text-heavy but >1 anchor → OK (anchor count saves it)
        b = _beat(1, 200, [
            (True, False), (True, False), (False, True), (False, True),
            (False, True), (False, True),
        ])
        findings = cab.lint_beats([b])
        # 4 text-heavy / 6 = 66.7%, but 2 anchors → ok
        assert findings[0].level == "ok"


# ── render_report_md ────────────────────────────────────────────────────────


class TestRenderReport:
    def _make_report(self, beats, findings):
        return cab.AnchorBridgeReport(
            slug="test-ep", script_path="/tmp/x.md",
            beats=beats, findings=findings,
        )

    def test_header_and_summary(self):
        b = _beat(1, 200, [(True, False)])
        findings = cab.lint_beats([b])
        out = cab.render_report_md(self._make_report([b], findings))
        assert "Anchor-Bridge Audit" in out
        assert "test-ep" in out
        assert "🟢" in out

    def test_per_beat_table_row(self):
        b = _beat(1, 200, [(True, False), (False, True)])
        findings = cab.lint_beats([b])
        out = cab.render_report_md(self._make_report([b], findings))
        # Words / anchor count / text-heavy / typographic% all in row
        assert "200" in out
        assert "Beat 1" in out

    def test_findings_section_renders_errors(self):
        b = _beat(1, 200, [(False, True), (False, True)])
        findings = cab.lint_beats([b])
        out = cab.render_report_md(self._make_report([b], findings))
        assert "Findings" in out
        assert "🔴" in out

    def test_no_findings_section_when_all_ok(self):
        b = _beat(1, 200, [(True, False)])
        findings = cab.lint_beats([b])
        out = cab.render_report_md(self._make_report([b], findings))
        assert "## Findings" not in out


# ── run_audit ───────────────────────────────────────────────────────────────


class TestRunAudit:
    def test_end_to_end(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — Cold (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | [FOOTAGE: x] |
            | Another line. | [MG: DataChart] |
        """), encoding="utf-8")
        report = cab.run_audit("test-ep", script)
        assert report.slug == "test-ep"
        assert len(report.beats) == 1
        assert report.beats[0].anchor_count == 2
        assert len(report.errors) == 0


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_slug_exits_2(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "lint" / "check_anchor_bridge.py"),
                "definitely-not-an-episode-slug-xyz",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "no script" in result.stderr

    def test_json_emits_valid_json(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | [FOOTAGE: x] |
        """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "lint" / "check_anchor_bridge.py"),
                "synthetic", "--script", str(script), "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["slug"] == "synthetic"
        assert len(payload["beats"]) == 1

    def test_strict_exits_1_on_warnings(self, tmp_path):
        # All text-heavy short beat → warn (wall of typography)
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | A short line. | [MG: KineticTypography 'a'] |
            | Another short. | [MG: KineticTypography 'b'] |
            | Third short. | [MG: KineticTypography 'c'] |
        """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "lint" / "check_anchor_bridge.py"),
                "synthetic", "--script", str(script), "--strict", "--stdout",
            ],
            capture_output=True, text=True,
        )
        # warns under --strict → exit 1
        assert result.returncode == 1

    def test_real_prisoners_dilemma_script(self):
        # Snapshot test against the launch-candidate script. Asserts:
        #   · exit 0 (no doctrine errors)
        #   · all 5 beats present
        #   · per-beat anchor counts >= the v6.3-measured baseline
        # so a future classification regression that under-counts anchors
        # (e.g. someone breaks the AI-GEN tag recognition) gets caught.
        # Skip cleanly if the script has been moved/renamed.
        script_dir = REPO_ROOT / "episodes" / "prisoners-dilemma"
        if not (
            (script_dir / "script-production.md").is_file()
            or list(script_dir.glob("script-v*-production.md"))
        ):
            pytest.skip("prisoners-dilemma script not present in this checkout")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "lint" / "check_anchor_bridge.py"),
                "prisoners-dilemma", "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        by_num = {b["beat_number"]: b for b in payload["beats"]}
        assert set(by_num) == {1, 2, 3, 4, 5}
        # v6.3 baseline anchor counts (4, 6, 7, 10, 11). Use >= so
        # additions don't break the test, only regressions.
        assert by_num[1]["anchor_count"] >= 4
        assert by_num[2]["anchor_count"] >= 6
        assert by_num[3]["anchor_count"] >= 7
        assert by_num[4]["anchor_count"] >= 10
        assert by_num[5]["anchor_count"] >= 11
        # No 🔴 errors in v6.3
        errors = [f for f in payload["findings"] if f["level"] == "error"]
        assert errors == []

    def test_error_exits_1(self, tmp_path):
        # >100 words with no anchor → error
        long_narration = "word " * 120
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent(f"""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | {long_narration.strip()} | [MG: KineticTypography 'big'] |
        """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "lint" / "check_anchor_bridge.py"),
                "synthetic", "--script", str(script), "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 1
        assert "NO anchor" in result.stdout
