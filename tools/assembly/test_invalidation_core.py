"""
Unit tests for tools/assembly/_invalidation_core.py.

Pure-function module — all tests run without git or filesystem access.
The CLI in invalidate.py is tested separately via integration tests.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _invalidation_core as ic  # type: ignore[import-not-found]

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


# ── PathPattern.to_regex / match ─────────────────────────────────────────────


class TestPathPatternMatch:
    def test_literal_match(self):
        p = ic.PathPattern("episodes/prisoners-dilemma/script-production.md")
        assert p.match("episodes/prisoners-dilemma/script-production.md") == {}

    def test_literal_no_match(self):
        p = ic.PathPattern("episodes/prisoners-dilemma/script-production.md")
        assert p.match("episodes/silicon-trap/script-production.md") is None

    def test_slug_capture(self):
        p = ic.PathPattern("episodes/{slug}/script-production.md")
        assert p.match("episodes/prisoners-dilemma/script-production.md") == {"slug": "prisoners-dilemma"}

    def test_slug_capture_no_cross_slash(self):
        # {slug} should match one path segment only — not "prisoners-dilemma/v6"
        p = ic.PathPattern("episodes/{slug}/script-production.md")
        assert p.match("episodes/prisoners-dilemma/v6/script-production.md") is None

    def test_single_star_within_segment(self):
        # * matches within a single segment (no slashes)
        p = ic.PathPattern("episodes/{slug}/script-v*-production.md")
        assert p.match("episodes/x/script-v5-production.md") == {"slug": "x"}
        assert p.match("episodes/x/script-v5/production.md") is None

    def test_double_star_crosses_segments(self):
        # ** matches across path segments
        p = ic.PathPattern("remotion-templates/src/templates/**/*.tsx")
        assert p.match("remotion-templates/src/templates/Foo/Foo.tsx") is not None
        assert p.match("remotion-templates/src/templates/x/y/z.tsx") is not None

    def test_multiple_captures(self):
        p = ic.PathPattern("episodes/{slug}/assets/{asset}.wav")
        assert p.match("episodes/ep1/assets/narration.wav") == {
            "slug": "ep1", "asset": "narration",
        }

    def test_unclosed_brace_raises(self):
        with pytest.raises(ValueError, match="Unclosed brace"):
            ic.PathPattern("episodes/{slug/script-production.md").to_regex()

    def test_invalid_variable_name_raises(self):
        with pytest.raises(ValueError, match="Invalid pattern variable"):
            ic.PathPattern("episodes/{has-dash}/x.md").to_regex()

    def test_escapes_regex_metacharacters_in_literal_parts(self):
        # File names with dots / parens should still match literally
        p = ic.PathPattern("foo.bar")
        assert p.match("foo.bar") == {}
        assert p.match("fooXbar") is None  # the dot should not be a metachar

    def test_double_star_with_trailing_slash_matches_empty_segment(self):
        """Regression for the silent-failure bug where `**/x` only matched
        `a/x` but not bare `x`. Standard glob says `**/x` covers both."""
        p = ic.PathPattern("**/foo.tsx")
        assert p.match("foo.tsx") is not None       # zero prefix segments
        assert p.match("a/foo.tsx") is not None     # one segment
        assert p.match("a/b/foo.tsx") is not None   # multiple segments

    def test_double_star_inside_pattern_matches_empty_segment(self):
        # luts/**/*.cube should match both luts/foo.cube AND luts/sub/foo.cube
        p = ic.PathPattern("luts/**/*.cube")
        assert p.match("luts/foo.cube") is not None
        assert p.match("luts/sub/foo.cube") is not None
        assert p.match("luts/a/b/foo.cube") is not None

    def test_repeated_var_uses_backreference(self):
        """Regression for the crash-at-compile bug: `{slug}` appearing
        twice in one pattern previously raised PatternError. Now uses
        a backreference so consistent slugs match and inconsistent ones
        are rejected — the natural semantics for `episodes/{slug}/drafts/{slug}-v.md`."""
        p = ic.PathPattern("episodes/{slug}/drafts/{slug}-v.md")
        # Compiles without error
        p.to_regex()
        # Consistent slug matches
        assert p.match("episodes/x/drafts/x-v.md") == {"slug": "x"}
        # Inconsistent slug is rejected (the natural intent)
        assert p.match("episodes/x/drafts/y-v.md") is None


# ── PathPattern.substitute ──────────────────────────────────────────────────


class TestPathPatternSubstitute:
    def test_basic_substitution(self):
        p = ic.PathPattern("episodes/{slug}/script-production.md")
        assert p.substitute({"slug": "x"}) == "episodes/x/script-production.md"

    def test_missing_var_left_in_place(self):
        # Derived patterns sometimes use {var}s the rule didn't capture —
        # we leave them as wildcards rather than crashing
        p = ic.PathPattern("episodes/{slug}/{asset}.wav")
        assert p.substitute({"slug": "x"}) == "episodes/x/{asset}.wav"

    def test_wildcards_preserved(self):
        # * and ** in artifact patterns aren't variables — substitute() ignores them
        p = ic.PathPattern("remotion-templates/out/{slug}-*.mp4")
        assert p.substitute({"slug": "x"}) == "remotion-templates/out/x-*.mp4"


# ── DependencyGraph.from_dict ───────────────────────────────────────────────


class TestDependencyGraph:
    def test_loads_minimal_graph(self):
        data = {
            "version": "1.0",
            "rules": [
                {
                    "source": "episodes/{slug}/script-production.md",
                    "derives": [
                        {"artifact": "episodes/{slug}/narration-readable.md",
                         "regen": "python3 tools/narration/format_for_reading.py {slug}"},
                    ],
                    "why": "test edge",
                    "confidence": "high",
                }
            ],
        }
        graph = ic.DependencyGraph.from_dict(data)
        assert graph.version == "1.0"
        assert len(graph.rules) == 1
        rule = graph.rules[0]
        assert rule.confidence == "high"
        assert len(rule.derives) == 1
        assert rule.derives[0].artifact == "episodes/{slug}/narration-readable.md"

    def test_loads_real_dependency_graph(self):
        # Belt-and-suspenders: the shipped dependency-graph.json should
        # load without errors and have a sensible structure
        path = REPO_ROOT / "tools" / "assembly" / "dependency-graph.json"
        if not path.is_file():
            pytest.skip("dependency-graph.json not present")
        graph = ic.DependencyGraph.from_json_file(path)
        assert len(graph.rules) >= 5  # we have ~13 rules
        # Every rule should have a source pattern that compiles
        for rule in graph.rules:
            rule.source.to_regex()
        # Every derived-artifact pattern should also compile
        for rule in graph.rules:
            for d in rule.derives:
                ic.PathPattern(d.artifact).to_regex()

    def test_defaults_when_metadata_missing(self):
        data = {"rules": [{"source": "x", "derives": []}]}
        graph = ic.DependencyGraph.from_dict(data)
        assert graph.rules[0].why == ""
        assert graph.rules[0].confidence == "medium"


# ── find_invalidations ───────────────────────────────────────────────────────


@pytest.fixture
def basic_graph():
    return ic.DependencyGraph.from_dict({
        "rules": [
            {
                "source": "episodes/{slug}/script-production.md",
                "derives": [
                    {"artifact": "episodes/{slug}/narration-readable.md",
                     "regen": "python3 format_for_reading.py {slug}"},
                    {"artifact": "remotion-templates/data/episodes/{slug}/assembly-manifest.json",
                     "regen": "python3 generate_manifest.py {slug}"},
                ],
                "confidence": "high",
            },
            {
                "source": "episodes/{slug}/assets/narration.wav",
                "derives": [
                    {"artifact": "episodes/{slug}/assets/_audio-qa.md",
                     "regen": "python3 audio_qa.py {slug}"},
                ],
                "confidence": "high",
            },
        ]
    })


class TestFindInvalidations:
    def test_single_path_matches_single_rule(self, basic_graph):
        invs = ic.find_invalidations(
            ["episodes/x/script-production.md"], basic_graph,
        )
        assert len(invs) == 1
        inv = invs[0]
        assert inv.source_path == "episodes/x/script-production.md"
        assert inv.captured_vars == {"slug": "x"}
        assert len(inv.stale_artifacts) == 2
        artifacts = [a for a, _ in inv.stale_artifacts]
        assert "episodes/x/narration-readable.md" in artifacts
        assert "remotion-templates/data/episodes/x/assembly-manifest.json" in artifacts

    def test_regen_command_has_slug_substituted(self, basic_graph):
        invs = ic.find_invalidations(
            ["episodes/foo/script-production.md"], basic_graph,
        )
        regen_cmds = [r for _, r in invs[0].stale_artifacts]
        assert "python3 format_for_reading.py foo" in regen_cmds
        assert "python3 generate_manifest.py foo" in regen_cmds

    def test_path_matching_no_rules_returns_empty(self, basic_graph):
        invs = ic.find_invalidations(
            ["some/unrelated/file.txt"], basic_graph,
        )
        assert invs == []

    def test_multiple_paths_aggregate(self, basic_graph):
        invs = ic.find_invalidations(
            [
                "episodes/x/script-production.md",
                "episodes/x/assets/narration.wav",
            ],
            basic_graph,
        )
        # Two paths, each matching one rule → 2 invalidations
        assert len(invs) == 2

    def test_path_matching_multiple_rules_emits_all(self):
        # A path that matches more than one rule (e.g. both a script rule
        # AND a versioned-script rule) emits one invalidation per rule
        graph = ic.DependencyGraph.from_dict({
            "rules": [
                {
                    "source": "episodes/{slug}/script-v*-production.md",
                    "derives": [{"artifact": "x", "regen": "y"}],
                },
                {
                    "source": "episodes/{slug}/script-*.md",
                    "derives": [{"artifact": "z", "regen": "w"}],
                },
            ]
        })
        invs = ic.find_invalidations(
            ["episodes/x/script-v6-production.md"], graph,
        )
        assert len(invs) == 2


# ── minimum_regen_commands ──────────────────────────────────────────────────


class TestMinimumRegen:
    def test_deduplicates_repeated_commands(self, basic_graph):
        # Editing two scripts in two episodes should produce TWO regen
        # commands (slugs differ), not collapse them
        invs = ic.find_invalidations(
            [
                "episodes/x/script-production.md",
                "episodes/y/script-production.md",
            ],
            basic_graph,
        )
        cmds = ic.minimum_regen_commands(invs)
        assert "python3 format_for_reading.py x" in cmds
        assert "python3 format_for_reading.py y" in cmds

    def test_preserves_first_seen_order(self):
        # Stable output ordering is important for diff-friendly reports
        graph = ic.DependencyGraph.from_dict({
            "rules": [
                {
                    "source": "{slug}.md",
                    "derives": [
                        {"artifact": "out/{slug}", "regen": "cmd-a {slug}"},
                        {"artifact": "out/{slug}.html", "regen": "cmd-b {slug}"},
                    ],
                }
            ]
        })
        invs = ic.find_invalidations(["alpha.md", "beta.md"], graph)
        cmds = ic.minimum_regen_commands(invs)
        assert cmds == [
            "cmd-a alpha", "cmd-b alpha", "cmd-a beta", "cmd-b beta",
        ]

    def test_empty_input_returns_empty(self):
        assert ic.minimum_regen_commands([]) == []
