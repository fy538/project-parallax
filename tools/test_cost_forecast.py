"""
Unit tests for tools/cost_forecast.py.

Covers:
  · count_ai_gen_briefs (heading regex)
  · count_script_words (table-row narration extraction + fallback)
  · _band_sum (low/mid/high arithmetic)
  · forecast_stills / forecast_ai_video / forecast_auphonic /
    forecast_research_and_scripting / forecast_stock_assets
  · forecast_ai_video raises on unknown tool
  · build_forecast end-to-end on synthetic episode tree
  · load_actual_spend (parses cost-tracker ledger)
  · render_forecast_md (services / budget banner / compare-actual column)
  · CLI smoke (missing inputs / valid synthetic / --json / --strict over budget)
  · Real silicon-trap smoke
"""

from __future__ import annotations

import json
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import cost_forecast as cf  # type: ignore[import-not-found]


# ── count_ai_gen_briefs ─────────────────────────────────────────────────────


class TestCountAiGenBriefs:
    def test_counts_headings(self, tmp_path, monkeypatch):
        # Returns (still_count, video_count) — without a Target tool
        # line, all default to stills
        monkeypatch.setattr(cf, "EPISODES_DIR", tmp_path)
        ep = tmp_path / "x"
        ep.mkdir()
        (ep / "ai-gen-briefs.md").write_text(textwrap.dedent("""\
            # AI-Gen Briefs

            ## beat1-aerial (P1)

            **Target tool**: Recraft (still)

            ## beat2-grids (P3)

            **Target tool**: Kling (image-to-video)

            ## beat3-room (P2)

            **Target tool**: Recraft (still)
        """), encoding="utf-8")
        stills, video = cf.count_ai_gen_briefs("x")
        assert stills == 2
        assert video == 1

    def test_priority_optional(self, tmp_path, monkeypatch):
        # P4 / lowercase / missing-priority headings should count
        monkeypatch.setattr(cf, "EPISODES_DIR", tmp_path)
        ep = tmp_path / "x"
        ep.mkdir()
        (ep / "ai-gen-briefs.md").write_text(textwrap.dedent("""\
            # AI-Gen Briefs

            ## foo (P4)
            **Target tool**: Recraft (still)

            ## bar (p1)
            **Target tool**: Recraft (still)

            ## baz
            **Target tool**: Recraft (still)
        """), encoding="utf-8")
        stills, video = cf.count_ai_gen_briefs("x")
        assert stills == 3

    def test_missing_target_tool_defaults_still(self, tmp_path, monkeypatch):
        monkeypatch.setattr(cf, "EPISODES_DIR", tmp_path)
        ep = tmp_path / "x"
        ep.mkdir()
        (ep / "ai-gen-briefs.md").write_text(textwrap.dedent("""\
            # AI-Gen Briefs

            ## foo (P1)
            (no target tool line)
        """), encoding="utf-8")
        stills, video = cf.count_ai_gen_briefs("x")
        assert stills == 1
        assert video == 0

    def test_missing_file_zero(self, tmp_path, monkeypatch):
        monkeypatch.setattr(cf, "EPISODES_DIR", tmp_path)
        (tmp_path / "x").mkdir()
        assert cf.count_ai_gen_briefs("x") == (0, 0)


# ── count_script_words ─────────────────────────────────────────────────────


class TestCountScriptWords:
    def test_two_column_table_extracts_narration(self, tmp_path):
        script = tmp_path / "s.md"
        script.write_text(textwrap.dedent("""\
            # Script

            ## BEAT 1

            | NARRATION | VISUAL PRODUCTION |
            |---|---|
            | hello world this is narration | [FOOTAGE: x] |
            | another line of text here | [MG:] KineticTypography |
        """), encoding="utf-8")
        words = cf.count_script_words(script)
        # "hello world this is narration" = 5; "another line of text here" = 5
        assert words == 10

    def test_no_tables_fallback(self, tmp_path):
        script = tmp_path / "s.md"
        script.write_text("just some plain text here", encoding="utf-8")
        assert cf.count_script_words(script) == 5

    def test_claim_tags_stripped(self, tmp_path):
        # `{✅}` `{verified}` `{?:check}` are editorial metadata, not
        # narration. They must not inflate the word count → Auphonic
        # projection.
        script = tmp_path / "s.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1

            | NARRATION | VISUAL |
            |---|---|
            | hello world {verified} this is text {needs-source} | [x] |
        """), encoding="utf-8")
        # "hello world this is text" = 5; the {verified} and {needs-source}
        # tags are stripped before counting.
        assert cf.count_script_words(script) == 5


# ── _band_sum ───────────────────────────────────────────────────────────────


class TestBandSum:
    def test_arithmetic(self):
        low, mid, high = cf._band_sum("recraft_still", 10)
        # Recraft is (0.04, 0.04, 0.06)
        assert low == pytest.approx(0.40)
        assert mid == pytest.approx(0.40)
        assert high == pytest.approx(0.60)

    def test_zero_units(self):
        assert cf._band_sum("recraft_still", 0) == (0.0, 0.0, 0.0)


# ── Per-service forecasters ────────────────────────────────────────────────


class TestForecasters:
    def test_stills_default_recraft(self):
        s = cf.forecast_stills(20)
        assert s.service == "Recraft stills"
        assert s.units_projected == 20
        assert s.mid == pytest.approx(0.04 * 20)

    def test_stills_flux_tool(self):
        s = cf.forecast_stills(20, tool="flux")
        assert "Flux" in s.service
        assert s.mid == pytest.approx(0.045 * 20)

    def test_ai_video_kling_default(self):
        s = cf.forecast_ai_video(5)
        assert "Kling" in s.service
        assert s.mid == pytest.approx(0.50 * 5)

    def test_ai_video_sora_zero_incremental(self):
        s = cf.forecast_ai_video(5, tool="sora")
        assert s.low == 0.0 and s.mid == 0.0 and s.high == 0.0

    def test_ai_video_unknown_tool_raises(self):
        with pytest.raises(ValueError, match="Unknown ai-video tool"):
            cf.forecast_ai_video(1, tool="bogus")

    def test_auphonic_high_band_full_remaster(self):
        # MID = 10 min * 0.15 = 1.50; HIGH = 10 * 0.20 * 2.0 = 4.00
        # (re-master is a FULL re-process, so 2.0× per-min HIGH rate,
        # not the prior 1.5× heuristic)
        s = cf.forecast_auphonic(10.0)
        assert s.mid == pytest.approx(1.50)
        assert s.high == pytest.approx(4.00)

    def test_research_episode_band(self):
        s = cf.forecast_research_and_scripting()
        assert s.units_projected == 1
        assert s.low == 5.0 and s.mid == 10.0 and s.high == 15.0

    def test_stock_assets_free(self):
        s = cf.forecast_stock_assets(30)
        assert s.low == 0.0 and s.mid == 0.0 and s.high == 0.0
        assert "30" in s.note


# ── build_forecast end-to-end ───────────────────────────────────────────────


class TestBuildForecast:
    def _setup_episode(self, tmp_path, monkeypatch, slug="ep-a"):
        monkeypatch.setattr(cf, "EPISODES_DIR", tmp_path)
        monkeypatch.setattr(
            cf, "REMOTION_DATA", tmp_path / "_remotion" / "data" / "episodes",
        )
        ep = tmp_path / slug
        ep.mkdir(parents=True)
        rem = tmp_path / "_remotion" / "data" / "episodes" / slug
        rem.mkdir(parents=True)
        return ep, rem

    def test_e2e_with_all_inputs(self, tmp_path, monkeypatch):
        ep, rem = self._setup_episode(tmp_path, monkeypatch)
        (ep / "shot-list.json").write_text(json.dumps({
            "assets": [
                {"type": "photo", "priority": "P1"},
                {"type": "photo", "priority": "P2"},
                {"type": "video", "priority": "P1"},
                {"type": "ai-generate", "priority": "P2"},
                {"type": "ai-video", "priority": "P3"},
            ]
        }), encoding="utf-8")
        (rem / "assembly-manifest.json").write_text(json.dumps({
            "totalDurationSec": 600,  # 10 min
        }), encoding="utf-8")
        f = cf.build_forecast("ep-a")
        # All expected lines present
        service_names = [s.service for s in f.services]
        assert any("Claude" in n for n in service_names)
        assert any("Stock" in n for n in service_names)
        assert any("Recraft" in n for n in service_names)
        assert any("Kling" in n for n in service_names)
        assert any("Auphonic" in n for n in service_names)

    def test_no_inputs_empty_services(self, tmp_path, monkeypatch):
        self._setup_episode(tmp_path, monkeypatch)
        f = cf.build_forecast("ep-a", include_research=False)
        # No shot-list, manifest, or script — services list empty
        assert f.services == []

    def test_research_can_be_excluded(self, tmp_path, monkeypatch):
        ep, _ = self._setup_episode(tmp_path, monkeypatch)
        (ep / "shot-list.json").write_text(json.dumps({
            "assets": [{"type": "photo", "priority": "P1"}],
        }), encoding="utf-8")
        f = cf.build_forecast("ep-a", include_research=False)
        assert not any("Claude" in s.service for s in f.services)

    def test_ai_gen_briefs_inflates_ai_counts(self, tmp_path, monkeypatch):
        # Real split now comes from each brief's "Target tool:" line
        # (not the 80/20 heuristic the v1 used). 4 stills + 1 video by
        # explicit declaration:
        ep, _ = self._setup_episode(tmp_path, monkeypatch)
        (ep / "shot-list.json").write_text(json.dumps({
            "assets": [{"type": "photo", "priority": "P1"}],  # 1 stock
        }), encoding="utf-8")
        (ep / "ai-gen-briefs.md").write_text(textwrap.dedent("""\
            # Briefs
            ## a (P1)
            **Target tool**: Recraft (still)
            ## b (P2)
            **Target tool**: Recraft (still)
            ## c (P3)
            **Target tool**: Recraft (still)
            ## d (P1)
            **Target tool**: Recraft (still)
            ## e (P2)
            **Target tool**: Kling (image-to-video)
        """), encoding="utf-8")
        f = cf.build_forecast("ep-a", include_research=False)
        recraft = next((s for s in f.services if "Recraft" in s.service), None)
        kling = next((s for s in f.services if "Kling" in s.service), None)
        assert recraft is not None
        assert recraft.units_projected == 4
        assert kling is not None
        assert kling.units_projected == 1

    def test_unknown_tool_raises(self):
        with pytest.raises(ValueError, match="Unknown ai-video tool"):
            cf.build_forecast("x", ai_video_tool="bogus")

    def test_falls_back_to_script_when_no_manifest(self, tmp_path, monkeypatch):
        ep, _ = self._setup_episode(tmp_path, monkeypatch)
        (ep / "script-production.md").write_text(textwrap.dedent("""\
            ## BEAT 1

            | NARRATION | VISUAL |
            |---|---|
            | this is fifteen words of narration to give us a measurable runtime estimate via wpm | [x] |
        """), encoding="utf-8")
        f = cf.build_forecast("ep-a", include_research=False, wpm=150)
        # Auphonic line should appear from script word-count fallback
        auphonic = next((s for s in f.services if "Auphonic" in s.service), None)
        assert auphonic is not None


# ── load_actual_spend ──────────────────────────────────────────────────────


class TestLoadActualSpend:
    def test_aggregates_per_service(self, tmp_path, monkeypatch):
        log = tmp_path / "COST_LOG.md"
        log.write_text(textwrap.dedent("""\
            # Cost Log

            | date | episode | service | amount_usd | note |
            |---|---|---|---|---|
            | 2026-05-10 | ep-a | claude | 8.50 | research |
            | 2026-05-11 | ep-a | claude | 2.00 | follow-up |
            | 2026-05-12 | ep-a | recraft | 0.40 | 10 stills |
            | 2026-05-13 | ep-b | claude | 5.00 | other episode |
        """), encoding="utf-8")
        monkeypatch.setattr(cf, "COST_LOG_PATH", log)
        totals = cf.load_actual_spend("ep-a")
        assert totals["claude"] == pytest.approx(10.50)
        assert totals["recraft"] == pytest.approx(0.40)
        assert "ep-b" not in totals  # different episode

    def test_missing_log_returns_empty(self, tmp_path, monkeypatch):
        monkeypatch.setattr(cf, "COST_LOG_PATH", tmp_path / "no-such.md")
        assert cf.load_actual_spend("x") == {}


# ── render_forecast_md ─────────────────────────────────────────────────────


class TestRenderForecast:
    def _make_forecast(self, services=None, actual=None):
        return cf.CostForecast(
            slug="x", services=services or [],
            actual_by_service=actual or {},
        )

    def test_renders_table_and_totals(self):
        f = self._make_forecast(services=[
            cf.ServiceForecast(
                service="Test", unit="image", units_projected=10,
                low=0.10, mid=0.40, high=0.60, note="test note",
            ),
        ])
        out = cf.render_forecast_md(f)
        assert "Cost Forecast" in out
        assert "$0.40" in out
        assert "$0.60" in out
        assert "test note" in out
        assert "Totals" in out

    def test_budget_within_green(self):
        f = self._make_forecast(services=[
            cf.ServiceForecast(
                service="x", unit="a", units_projected=1,
                low=10, mid=20, high=30,
            ),
        ])
        out = cf.render_forecast_md(f, budget=50.0)
        assert "🟢" in out
        assert "within budget" in out

    def test_budget_over_red(self):
        f = self._make_forecast(services=[
            cf.ServiceForecast(
                service="x", unit="a", units_projected=1,
                low=100, mid=200, high=300,
            ),
        ])
        out = cf.render_forecast_md(f, budget=50.0)
        assert "🔴" in out

    def test_budget_tight_yellow(self):
        # LOW fits, MID doesn't — tight band
        f = self._make_forecast(services=[
            cf.ServiceForecast(
                service="x", unit="a", units_projected=1,
                low=40, mid=60, high=80,
            ),
        ])
        out = cf.render_forecast_md(f, budget=50.0)
        assert "🟡" in out

    def test_compare_actual_adds_column(self):
        f = self._make_forecast(
            services=[
                cf.ServiceForecast(
                    service="Recraft stills", unit="image", units_projected=10,
                    low=0.40, mid=0.40, high=0.60,
                ),
            ],
            actual={"recraft": 0.40},
        )
        out = cf.render_forecast_md(f)
        assert "Actual to date" in out

    def test_compare_actual_uses_explicit_map_no_substring_leak(self):
        # If the ledger has separate "kling" and unrelated "klingon"
        # rows (theoretical future drift), the substring approach would
        # have summed both INTO the Kling per-service row. The explicit
        # map fix keeps the per-service row clean — only the "kling"
        # key contributes to the Kling clips row.
        f = self._make_forecast(
            services=[
                cf.ServiceForecast(
                    service="Kling clips", unit="clip", units_projected=2,
                    low=1.0, mid=1.0, high=2.0,
                ),
            ],
            actual={"kling": 1.0, "klingon": 99.0},
        )
        out = cf.render_forecast_md(f)
        # Per-service Kling row pulls only the "kling" ledger entry ($1.00)
        # — pre-fix would have summed $100.00 via substring match
        # Match the row pattern explicitly.
        # Format: "| Kling clips | 2 clip(s) | ... | $1.00 |"
        assert "$1.00 |" in out
        # The Kling per-service row does NOT show $100.00
        # (the totals row separately sums actual_by_service.values() —
        # that's expected behavior, not substring leak)
        # Pull the Kling line explicitly and check
        kling_line = next(
            line for line in out.splitlines()
            if line.startswith("| Kling clips |")
        )
        assert "$100.00" not in kling_line
        assert "$1.00" in kling_line


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_unknown_slug_runs_with_warning(self):
        # No inputs found is a warn-not-error; exits 0 with empty services
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "cost_forecast.py"),
             "definitely-no-such-slug", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "no cost-relevant" in result.stderr or "Cost Forecast" in result.stdout

    def test_synthetic_episode(self, tmp_path):
        # Build an episode tree under tmp_path and shell out via the
        # CLI. Since the CLI reads EPISODES_DIR via constants in the
        # module, we need to write into the real episodes/ folder with
        # a guaranteed-unique slug, then clean up.
        slug = "cf-smoke-test"
        ep = REPO_ROOT / "episodes" / slug
        ep.mkdir(parents=True, exist_ok=True)
        (ep / "shot-list.json").write_text(json.dumps({
            "assets": [
                {"type": "photo", "priority": "P1"},
                {"type": "ai-generate", "priority": "P2"},
            ]
        }), encoding="utf-8")
        try:
            result = subprocess.run(
                [sys.executable, str(REPO_ROOT / "tools" / "cost_forecast.py"),
                 slug, "--json", "--stdout"],
                capture_output=True, text=True,
            )
            assert result.returncode == 0
            payload = json.loads(result.stdout)
            assert payload["slug"] == slug
            assert payload["totals"]["mid"] > 0
        finally:
            for f in ep.iterdir():
                f.unlink()
            ep.rmdir()

    def test_strict_over_budget_exits_1(self, tmp_path):
        slug = "cf-budget-test"
        ep = REPO_ROOT / "episodes" / slug
        ep.mkdir(parents=True, exist_ok=True)
        (ep / "shot-list.json").write_text(json.dumps({
            "assets": [
                {"type": "ai-video", "priority": "P1"}
                for _ in range(200)
            ]
        }), encoding="utf-8")
        try:
            # 200 Kling clips × $0.50 = $100. Budget $20 → MID over → exit 1.
            result = subprocess.run(
                [sys.executable, str(REPO_ROOT / "tools" / "cost_forecast.py"),
                 slug, "--budget", "20", "--strict", "--no-research", "--stdout"],
                capture_output=True, text=True,
            )
            assert result.returncode == 1
        finally:
            for f in ep.iterdir():
                f.unlink()
            ep.rmdir()

    def test_no_inputs_emits_status_in_json(self):
        # No-input slug → JSON includes forecast_status: "no_inputs"
        # so downstream tools don't misread MID=0 as "free episode".
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "cost_forecast.py"),
             "definitely-no-such-slug", "--json", "--stdout",
             "--no-research"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["forecast_status"] == "no_inputs"

    def test_strict_without_budget_warns(self):
        # --strict alone is meaningless — must warn (not fail)
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "cost_forecast.py"),
             "definitely-no-such-slug", "--strict", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "--strict has no effect" in result.stderr

    def test_real_silicon_trap_smoke(self):
        # Silicon-trap has a shot-list + ai-gen-briefs + manifest;
        # the forecast should produce a non-zero MID.
        if not (REPO_ROOT / "episodes" / "silicon-trap" / "shot-list.json").is_file():
            pytest.skip("silicon-trap shot-list not present")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "cost_forecast.py"),
             "silicon-trap", "--json", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["totals"]["mid"] > 0
        assert len(payload["services"]) > 0
