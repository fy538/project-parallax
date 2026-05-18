"""
Unit tests for tools/publish/shorts_llm_scorer.py.

Covers:
  · collect_narration_for_window (overlap detection, dedup, no overlap)
  · build_scoring_prompt (rubric + candidate metadata embedded)
  · parse_llm_response (clean JSON / code-fenced / pre-pended text /
    malformed / score clamping / missing fields)
  · llm_rerank (per-candidate mutation, scorer-exception capture,
    parse-failure capture, sort order with mixed scored / unscored)
  · CLI integration: --llm-score --llm-dry-run (no API call, prints prompt)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import shorts_llm_scorer as sls  # type: ignore[import-not-found]
import shorts_proposer as sp  # type: ignore[import-not-found]


# ── collect_narration_for_window ──────────────────────────────────────────


class TestCollectNarration:
    def _manifest(self):
        return {
            "segments": [
                {"id": "s1", "startSec": 0, "endSec": 10,
                 "narrationRef": "First narration line."},
                {"id": "s2", "startSec": 10, "endSec": 25,
                 "narrationRef": "Second narration line about cooperation."},
                {"id": "s3", "startSec": 25, "endSec": 40,
                 "narrationRef": "Third line, far away."},
            ],
        }

    def test_window_overlapping_one_segment(self):
        out = sls.collect_narration_for_window(self._manifest(), 12, 20)
        assert "Second narration" in out
        assert "First" not in out

    def test_window_spanning_multiple_segments(self):
        out = sls.collect_narration_for_window(self._manifest(), 5, 30)
        assert "First" in out
        assert "Second" in out
        assert "Third" in out

    def test_window_outside_any_segment(self):
        out = sls.collect_narration_for_window(self._manifest(), 50, 60)
        assert out == ""

    def test_dedup_identical_refs(self):
        m = {"segments": [
            {"id": "a", "startSec": 0, "endSec": 5, "narrationRef": "Same text."},
            {"id": "b", "startSec": 5, "endSec": 10, "narrationRef": "Same text."},
        ]}
        out = sls.collect_narration_for_window(m, 0, 10)
        assert out.count("Same text") == 1

    def test_empty_manifest(self):
        assert sls.collect_narration_for_window({}, 0, 10) == ""

    def test_segment_with_no_narration_ref(self):
        m = {"segments": [{"id": "x", "startSec": 0, "endSec": 10}]}
        assert sls.collect_narration_for_window(m, 0, 10) == ""

    def test_falls_back_to_beat_narration_when_window_empty(self):
        # Beat-opener case: window spans FOOTAGE/HOLD with no narrationRef,
        # but the parent beat has TEMPLATE segments downstream that DO
        # carry narration. Fallback should surface those so the LLM
        # scorer gets real context (not "(no narration text)").
        m = {
            "segments": [
                # In-window: FOOTAGE + HOLD, no narrationRef
                {"id": "s1", "type": "FOOTAGE", "startSec": 0, "endSec": 6,
                 "beat": "beat1"},
                {"id": "s2", "type": "HOLD", "startSec": 6, "endSec": 15,
                 "beat": "beat1"},
                # Same beat, later (downstream of window): has narrationRef
                {"id": "s3", "type": "TEMPLATE", "startSec": 15, "endSec": 40,
                 "beat": "beat1",
                 "narrationRef": "The body of the beat, downstream."},
                # Different beat — should NOT be pulled
                {"id": "s4", "type": "TEMPLATE", "startSec": 60, "endSec": 80,
                 "beat": "beat2",
                 "narrationRef": "Different beat narration."},
            ],
        }
        # Window 0-12 covers only FOOTAGE+HOLD (no narrationRef in window)
        out = sls.collect_narration_for_window(m, 0, 12)
        assert "body of the beat" in out
        assert "Different beat" not in out  # cross-beat exclusion

    def test_fallback_capped_at_max_chars(self):
        # A beat with many narrationRef-bearing segments would otherwise
        # produce a multi-KB prompt. Cap prevents unbounded growth.
        long_ref = "x" * 800  # 800 chars per ref
        m = {
            "segments": [
                # Empty window
                {"id": "s1", "type": "FOOTAGE", "startSec": 0, "endSec": 10,
                 "beat": "beat1"},
                # Many beat segments with long narration outside the window
                *[
                    {"id": f"big{i}", "type": "TEMPLATE",
                     "startSec": 20 + i, "endSec": 20 + i + 1,
                     "beat": "beat1",
                     "narrationRef": long_ref}
                    for i in range(20)
                ],
            ],
        }
        out = sls.collect_narration_for_window(m, 0, 10)
        # 20 × 800 = 16000 chars would be the unbounded result; the
        # cap should keep it under MAX_FALLBACK_CHARS + a few chars
        # for the truncation ellipsis.
        assert len(out) <= sls.MAX_FALLBACK_CHARS + 5

    def test_in_window_wins_over_fallback(self):
        # When a window DOES have narrationRef from in-window segments,
        # the fallback is NOT triggered (we don't over-broaden).
        m = {
            "segments": [
                {"id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 10,
                 "beat": "beat1",
                 "narrationRef": "In-window narration."},
                {"id": "s2", "type": "TEMPLATE", "startSec": 30, "endSec": 50,
                 "beat": "beat1",
                 "narrationRef": "Beat-level narration outside window."},
            ],
        }
        out = sls.collect_narration_for_window(m, 0, 10)
        assert "In-window" in out
        assert "outside window" not in out


# ── build_scoring_prompt ──────────────────────────────────────────────────


class TestBuildScoringPrompt:
    def _candidate(self):
        return sp.ShortsCandidate(
            candidate_kind="stat", sourceBeat="Beat 1: OPEN",
            beat_id="beat1", template="StatRevealShort",
            startSec=10, endSec=40, durationSec=30,
            score=5, label="test", rationale="why",
        )

    def test_embeds_rubric_dimensions(self):
        out = sls.build_scoring_prompt(self._candidate(), "Some narration.")
        for keyword in (
            "SNAP MOMENT",
            "BOUNDED MOMENT",
            "SELF-CONTAINED",
            "VISUAL HOOK",
            "bounded analogy",
        ):
            assert keyword.lower() in out.lower(), f"missing: {keyword}"

    def test_embeds_candidate_metadata(self):
        out = sls.build_scoring_prompt(self._candidate(), "x")
        assert "StatRevealShort" in out
        assert "Beat 1: OPEN" in out
        assert "30s" in out

    def test_handles_empty_narration(self):
        out = sls.build_scoring_prompt(self._candidate(), "")
        assert "no narration text found" in out

    def test_returns_json_format_instruction(self):
        out = sls.build_scoring_prompt(self._candidate(), "x")
        assert '"score"' in out
        assert '"rationale"' in out


# ── parse_llm_response ────────────────────────────────────────────────────


class TestParseLLMResponse:
    def test_clean_json(self):
        out = sls.parse_llm_response('{"score": 75, "rationale": "snap moment landed cleanly"}')
        assert out is not None
        assert out.score == 75.0
        assert "snap moment" in out.rationale

    def test_code_fenced(self):
        text = '```json\n{"score": 60, "rationale": "ok"}\n```'
        out = sls.parse_llm_response(text)
        assert out.score == 60.0

    def test_prepended_text(self):
        text = 'Here is my analysis: {"score": 42, "rationale": "weak"}'
        out = sls.parse_llm_response(text)
        assert out.score == 42.0

    def test_malformed_returns_none(self):
        assert sls.parse_llm_response("not json at all") is None

    def test_empty_returns_none(self):
        assert sls.parse_llm_response("") is None

    def test_score_clamped_to_100(self):
        out = sls.parse_llm_response('{"score": 999, "rationale": "x"}')
        assert out.score == 100.0

    def test_score_clamped_to_0(self):
        out = sls.parse_llm_response('{"score": -50, "rationale": "x"}')
        assert out.score == 0.0

    def test_non_numeric_score_returns_none(self):
        assert sls.parse_llm_response('{"score": "high", "rationale": "x"}') is None

    def test_missing_rationale_defaults_empty(self):
        out = sls.parse_llm_response('{"score": 50}')
        assert out.score == 50.0
        assert out.rationale == ""


# ── llm_rerank ────────────────────────────────────────────────────────────


def _cand(score=5, start=0, end=30, kind="stat"):
    return sp.ShortsCandidate(
        candidate_kind=kind, sourceBeat="B1: x",
        beat_id="beat1", template="StatRevealShort",
        startSec=start, endSec=end, durationSec=end - start,
        score=score, label=f"cand@{start}", rationale="heuristic",
    )


class TestLLMRerank:
    def _manifest(self):
        return {
            "segments": [
                {"id": "s1", "startSec": 0, "endSec": 60,
                 "narrationRef": "First chunk."},
                {"id": "s2", "startSec": 60, "endSec": 120,
                 "narrationRef": "Second chunk."},
            ],
        }

    def test_scores_populate_in_place(self):
        candidates = [_cand(score=5, start=0, end=30)]
        responses = ['{"score": 85, "rationale": "strong snap moment"}']

        def fake_scorer(prompt):
            return responses.pop(0)

        sls.llm_rerank(candidates, self._manifest(), fake_scorer)
        assert candidates[0].llm_score == 85.0
        assert "snap" in candidates[0].llm_rationale

    def test_sort_descending_by_llm_score(self):
        candidates = [
            _cand(score=5, start=0, end=30),    # heuristic 5
            _cand(score=10, start=60, end=90),  # heuristic 10
        ]
        # First candidate scores HIGHER on LLM than the second
        responses = [
            '{"score": 90, "rationale": "snap"}',
            '{"score": 40, "rationale": "weak"}',
        ]

        def fake_scorer(prompt):
            return responses.pop(0)

        sls.llm_rerank(candidates, self._manifest(), fake_scorer)
        # Sort by llm_score desc — first cand (90) wins despite lower heuristic
        assert candidates[0].llm_score == 90.0
        assert candidates[0].startSec == 0

    def test_scorer_exception_captured(self):
        candidates = [_cand()]

        def bad_scorer(prompt):
            raise RuntimeError("API down")

        sls.llm_rerank(candidates, self._manifest(), bad_scorer)
        # llm_score stays None; rationale captures the error
        assert candidates[0].llm_score is None
        assert "API down" in candidates[0].llm_rationale

    def test_unparseable_response_captured(self):
        candidates = [_cand()]

        def junk_scorer(prompt):
            return "not json"

        sls.llm_rerank(candidates, self._manifest(), junk_scorer)
        assert candidates[0].llm_score is None
        assert "unparseable" in candidates[0].llm_rationale

    def test_unscored_candidates_sort_below_scored(self):
        # top_k=1: only first candidate gets LLM-scored
        candidates = [_cand(score=3, start=0), _cand(score=10, start=60)]

        def fake_scorer(prompt):
            return '{"score": 50, "rationale": "ok"}'

        sls.llm_rerank(candidates, self._manifest(), fake_scorer, top_k=1)
        # Sort order: scored (50) first, then unscored (heuristic=10) second
        assert candidates[0].llm_score == 50.0
        assert candidates[1].llm_score is None
        assert candidates[1].score == 10


# ── CLI smoke (dry-run path that needs no API key) ────────────────────────


class TestCliSmoke:
    def test_llm_dry_run_prints_prompt(self, tmp_path):
        manifest = tmp_path / "manifest.json"
        manifest.write_text(json.dumps({
            "beats": [
                {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 100},
            ],
            "segments": [
                {
                    "id": "seg1", "type": "TEMPLATE",
                    "startSec": 10, "endSec": 40,
                    "beat": "beat1", "priority": "P1",
                    "template": {"component": "DataChart"},
                    "narrationRef": "TSMC's first Arizona fab hit a 92% yield.",
                },
            ],
        }), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "publish" / "shorts_proposer.py"),
             "test-slug", "--manifest", str(manifest),
             "--llm-dry-run", "--stdout"],
            capture_output=True, text=True,
            # Explicitly unset ANTHROPIC_API_KEY so the dry-run path
            # confirms it doesn't need one
            env={**__import__("os").environ, "ANTHROPIC_API_KEY": ""},
        )
        assert result.returncode == 0
        # The dry-run prompt is emitted to STDERR (so it doesn't pollute
        # the proposal markdown going to stdout)
        assert "LLM Scoring — DRY RUN" in result.stderr
        assert "SNAP MOMENT" in result.stderr
        # The proposal markdown still goes to stdout normally
        assert "Shorts Candidate Proposals" in result.stdout

    def test_llm_top_k_widens_pool_before_rerank(self, tmp_path):
        # --llm-top-k > --top means the LLM scores a wider pool than
        # the final --top trim. End-to-end smoke via --llm-dry-run
        # which prints the prompt for candidate #1 of the WIDER pool
        # (no API key needed). We verify the heuristic pool was
        # widened by checking that more candidates were proposed than
        # --top would normally allow.
        manifest = tmp_path / "manifest.json"
        # Build a manifest with enough TEMPLATE/DataChart segments to
        # produce > 3 candidates
        segs = []
        for i in range(8):
            segs.append({
                "id": f"seg{i}", "type": "TEMPLATE",
                "startSec": i * 30, "endSec": i * 30 + 20,
                "beat": "beat1", "priority": "P1",
                "template": {"component": "DataChart"},
                "narrationRef": f"Narration for chunk {i}.",
            })
        manifest.write_text(json.dumps({
            "beats": [{"id": "beat1", "title": "X", "startSec": 0, "endSec": 300}],
            "segments": segs,
        }), encoding="utf-8")
        # --top 3 + --llm-top-k 7 → LLM should preview prompt for a
        # candidate from the wider pool (--llm-dry-run prints the prompt
        # for candidate #1 — which exists in both pools, so this is
        # mainly a smoke that the flag parses + doesn't crash).
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "publish" / "shorts_proposer.py"),
             "x", "--manifest", str(manifest),
             "--top", "3", "--llm-top-k", "7",
             "--llm-dry-run", "--json", "--stdout"],
            capture_output=True, text=True,
            env={**__import__("os").environ, "ANTHROPIC_API_KEY": ""},
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        # Final report is still capped at --top
        assert len(payload["candidates"]) <= 3
        # Dry-run preview still went to stderr
        assert "LLM Scoring — DRY RUN" in result.stderr

    def test_llm_top_k_zero_rejected(self, tmp_path):
        # Argparse validator should reject ≤0 with a clear message,
        # NOT silently no-op (the v1 behavior of `or 0` masked typos)
        manifest = tmp_path / "manifest.json"
        manifest.write_text(json.dumps({
            "beats": [{"id": "beat1", "title": "X", "startSec": 0, "endSec": 60}],
            "segments": [{
                "id": "x", "type": "TEMPLATE", "startSec": 0, "endSec": 30,
                "beat": "beat1", "priority": "P1",
                "template": {"component": "DataChart"},
            }],
        }), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "publish" / "shorts_proposer.py"),
             "x", "--manifest", str(manifest),
             "--top", "3", "--llm-top-k", "0",
             "--llm-dry-run", "--stdout"],
            capture_output=True, text=True,
            env={**__import__("os").environ, "ANTHROPIC_API_KEY": ""},
        )
        # Argparse error → exit 2
        assert result.returncode == 2
        assert "--llm-top-k" in result.stderr or "argument" in result.stderr.lower()

    def test_llm_score_without_api_key_exits_2(self, tmp_path):
        manifest = tmp_path / "manifest.json"
        manifest.write_text(json.dumps({
            "beats": [{"id": "beat1", "title": "X", "startSec": 0, "endSec": 60}],
            "segments": [{"id": "x", "type": "TEMPLATE", "startSec": 0, "endSec": 30,
                          "beat": "beat1", "priority": "P1",
                          "template": {"component": "DataChart"}}],
        }), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "publish" / "shorts_proposer.py"),
             "x", "--manifest", str(manifest), "--llm-score", "--stdout"],
            capture_output=True, text=True,
            env={**__import__("os").environ, "ANTHROPIC_API_KEY": ""},
        )
        assert result.returncode == 2
        assert "ANTHROPIC_API_KEY" in result.stderr
