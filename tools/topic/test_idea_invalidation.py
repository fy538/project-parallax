"""
Unit tests for tools/topic/idea_invalidation.py.

Covers:
  · _parse_iso_date (canonical / 'May 3' / 'May 3, 2026' / unparseable)
  · parse_ideas (Signal Watch table + per-arc table)
  · compute_freshness (fresh / review / stale / no-date)
  · build_search_query / build_search_url (URL-encoded, emoji-stripped)
  · search_youtube_api (mocked fetcher, error fallback)
  · run_invalidation end-to-end on synthetic IDEAS.md
  · render_invalidation_md (buckets / competing-coverage / capped)
  · CLI smoke (missing IDEAS / valid synthetic / --stale-only --strict)
  · Real IDEAS.md smoke
"""

from __future__ import annotations

import datetime
import json
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import idea_invalidation as ii  # type: ignore[import-not-found]


# ── _parse_iso_date ─────────────────────────────────────────────────────────


class TestParseIsoDate:
    def test_canonical_iso(self):
        assert ii._parse_iso_date("2026-05-12") == "2026-05-12"

    def test_short_month(self):
        # "May 3, 2026"
        assert ii._parse_iso_date("May 3, 2026") == "2026-05-03"

    def test_month_day_no_year_assumes_current(self):
        # "May 3" → assumes current year
        out = ii._parse_iso_date("May 3")
        assert out.endswith("-05-03")
        assert out.startswith(str(datetime.date.today().year))

    def test_substring_fallback(self):
        assert ii._parse_iso_date("posted 2026-05-12 today") == "2026-05-12"

    def test_unparseable_empty(self):
        assert ii._parse_iso_date("yesterday-ish") == ""
        assert ii._parse_iso_date("") == ""


# ── parse_ideas ─────────────────────────────────────────────────────────────


_SYNTHETIC_IDEAS = textwrap.dedent("""\
    # IDEAS

    ## Signal Watch List

    | Signal | Discovery Path | First Noticed | Sources | Potential Arc | Notes |
    |---|---|---|---|---|---|
    | New nuclear treaty silence | Inversion | May 3 | ACA | Arc 3 | Strong convergence |
    | Drone economics flip | Mechanism | May 3 | CFR | Arc 1 | Promoted earlier |

    ## Active Arcs

    ### Arc 1: Tech Competition

    | Slug | Format | Working Title | Thesis / Hook | State | Last Checked |
    |---|---|---|---|---|---|
    | silicon-trap | Detective | The Silicon Trap | $280B bet | 📋 DRAFT | May 2 |
    | ai-nuclear | Dialectic | Is AI the New Nuclear? | concentration vs diffusion | 📡 SIGNAL | Apr 26 |
""")


class TestParseIdeas:
    def test_extracts_signal_and_arc_topics(self):
        topics = ii.parse_ideas(_SYNTHETIC_IDEAS)
        titles = [t.title for t in topics]
        assert "New nuclear treaty silence" in titles
        assert "silicon-trap" in titles
        assert "ai-nuclear" in titles

    def test_section_attribution(self):
        topics = ii.parse_ideas(_SYNTHETIC_IDEAS)
        signal = next(t for t in topics if t.title == "New nuclear treaty silence")
        assert "Signal Watch" in signal.source_section
        arc_topic = next(t for t in topics if t.title == "silicon-trap")
        assert "Arc 1" in arc_topic.source_section

    def test_state_and_last_checked_extracted(self):
        topics = ii.parse_ideas(_SYNTHETIC_IDEAS)
        st = next(t for t in topics if t.title == "silicon-trap")
        assert "DRAFT" in st.state
        assert st.last_checked_iso  # not empty

    def test_signal_uses_first_noticed_for_date(self):
        topics = ii.parse_ideas(_SYNTHETIC_IDEAS)
        sig = next(t for t in topics if t.title == "New nuclear treaty silence")
        assert sig.last_checked_iso  # First Noticed populated last_checked_iso

    def test_empty_input(self):
        assert ii.parse_ideas("") == []

    def test_no_tables_no_topics(self):
        text = "# Just a doc\n\nNo tables here.\n"
        assert ii.parse_ideas(text) == []


# ── compute_freshness ──────────────────────────────────────────────────────


def _topic(last="", today="2026-05-18"):
    t = ii.TopicRow(
        title="x", source_section="x", state="", last_checked_iso=last,
    )
    ii.compute_freshness(t, today=datetime.date.fromisoformat(today))
    return t


class TestComputeFreshness:
    def test_fresh_under_30d(self):
        t = _topic(last="2026-05-10")  # 8 days ago
        assert t.freshness_verdict == "🟢"
        assert t.days_since_checked == 8

    def test_review_30_to_90(self):
        t = _topic(last="2026-03-20")  # 59 days ago
        assert t.freshness_verdict == "🟡"

    def test_stale_over_90(self):
        t = _topic(last="2025-12-01")  # ~169 days ago
        assert t.freshness_verdict == "🔴"

    def test_no_date(self):
        t = _topic(last="")
        assert t.freshness_verdict == "—"
        assert t.days_since_checked is None

    def test_unparseable_date(self):
        t = _topic(last="garbage")
        assert t.freshness_verdict == "—"


# ── build_search_query / url ───────────────────────────────────────────────


class TestSearchQuery:
    def test_strips_emoji(self):
        t = ii.TopicRow(title="📡 silicon-trap", source_section="", state="",
                        last_checked_iso="")
        assert "📡" not in ii.build_search_query(t)
        assert "silicon-trap" in ii.build_search_query(t)

    def test_strips_leading_article(self):
        t = ii.TopicRow(title="The Silicon Trap", source_section="", state="",
                        last_checked_iso="")
        assert ii.build_search_query(t) == "Silicon Trap"

    def test_caps_length(self):
        t = ii.TopicRow(title="x" * 500, source_section="", state="",
                        last_checked_iso="")
        assert len(ii.build_search_query(t)) <= 120

    def test_url_encodes_query(self):
        url = ii.build_search_url("a b c")
        assert "a+b+c" in url or "a%20b%20c" in url
        assert url.startswith("https://www.youtube.com/results")

    def test_strips_markdown_link_syntax(self):
        # Topic title like `[silicon-trap](episodes/silicon-trap)` should
        # become `silicon-trap`, not include the parens and path
        t = ii.TopicRow(
            title="[silicon-trap](episodes/silicon-trap)",
            source_section="", state="", last_checked_iso="",
        )
        q = ii.build_search_query(t)
        assert "silicon-trap" in q
        assert "[" not in q and "]" not in q
        assert "(" not in q and ")" not in q
        assert "episodes/" not in q


# ── search_youtube_api (mocked) ────────────────────────────────────────────


_API_SEARCH_RESPONSE = json.dumps({
    "items": [
        {
            "id": {"videoId": "abc123"},
            "snippet": {
                "title": "The Silicon Trap explained",
                "channelTitle": "TestChannel",
                "publishedAt": "2026-04-01T12:00:00Z",
            },
        },
    ],
}).encode()

_API_STATS_RESPONSE = json.dumps({
    "items": [{"id": "abc123", "statistics": {"viewCount": "1500000"}}],
}).encode()


class TestSearchYoutubeApi:
    def test_returns_competing_with_views(self):
        responses = {
            "search": _API_SEARCH_RESPONSE,
            "stats": _API_STATS_RESPONSE,
        }
        def fake_fetcher(url: str) -> bytes:
            if "/search?" in url:
                return responses["search"]
            if "/videos?" in url:
                return responses["stats"]
            raise OSError("unexpected url")
        out = ii.search_youtube_api("silicon trap", "TESTKEY", fetcher=fake_fetcher)
        assert len(out) == 1
        assert out[0].title == "The Silicon Trap explained"
        assert out[0].channel == "TestChannel"
        assert out[0].view_count == 1500000
        assert out[0].url.endswith("abc123")
        assert out[0].published_iso == "2026-04-01"

    def test_api_error_returns_empty(self):
        def boom(url: str) -> bytes:
            raise OSError("api down")
        out = ii.search_youtube_api("x", "TESTKEY", fetcher=boom)
        assert out == []

    def test_quota_exceeded_raises_marker(self):
        # API responds with an error.errors with reason quotaExceeded
        quota_response = json.dumps({
            "error": {
                "code": 403,
                "errors": [{"reason": "quotaExceeded", "message": "Quota exceeded."}],
            },
        }).encode()
        def fetcher(url: str) -> bytes:
            return quota_response
        with pytest.raises(RuntimeError, match=ii.QUOTA_EXCEEDED_MARKER):
            ii.search_youtube_api("x", "TESTKEY", fetcher=fetcher)

    def test_other_api_error_returns_empty(self):
        # Non-quota error (e.g. bad key) returns [] silently — distinct
        # from quota path
        bad_key_response = json.dumps({
            "error": {
                "code": 400,
                "errors": [{"reason": "badRequest", "message": "Bad request."}],
            },
        }).encode()
        def fetcher(url: str) -> bytes:
            return bad_key_response
        # Does NOT raise — just returns empty
        result = ii.search_youtube_api("x", "TESTKEY", fetcher=fetcher)
        assert result == []

    def test_stats_failure_still_returns_search_hits(self):
        def fetcher(url: str) -> bytes:
            if "/search?" in url:
                return _API_SEARCH_RESPONSE
            raise OSError("stats endpoint down")
        out = ii.search_youtube_api("x", "TESTKEY", fetcher=fetcher)
        # Search hits still surface; view_count just defaults to 0
        assert len(out) == 1
        assert out[0].view_count == 0


# ── run_invalidation end-to-end ────────────────────────────────────────────


class TestRunInvalidation:
    def test_e2e_no_api(self, tmp_path):
        ideas = tmp_path / "IDEAS.md"
        ideas.write_text(_SYNTHETIC_IDEAS, encoding="utf-8")
        report = ii.run_invalidation(
            ideas_path=ideas, today=datetime.date.fromisoformat("2026-05-18"),
            api_key=None,
        )
        assert len(report.topics) >= 3
        # All topics get a search URL
        assert all(t.search_url for t in report.topics)
        # None have competing data (no API key)
        assert all(t.competing == [] for t in report.topics)

    def test_e2e_with_api(self, tmp_path):
        ideas = tmp_path / "IDEAS.md"
        ideas.write_text(_SYNTHETIC_IDEAS, encoding="utf-8")
        def fake_fetcher(url: str) -> bytes:
            if "/search?" in url:
                return _API_SEARCH_RESPONSE
            if "/videos?" in url:
                return _API_STATS_RESPONSE
            raise OSError("unexpected")
        report = ii.run_invalidation(
            ideas_path=ideas, today=datetime.date.fromisoformat("2026-05-18"),
            api_key="TESTKEY", fetcher=fake_fetcher,
        )
        # All topics got a competing-coverage list populated
        assert any(t.competing for t in report.topics)

    def test_stale_only_filter(self, tmp_path):
        ideas = tmp_path / "IDEAS.md"
        # All three topics dated 2025-01-01 → all stale
        old = _SYNTHETIC_IDEAS.replace("May 3", "Jan 1, 2025").replace(
            "May 2", "Jan 1, 2025").replace("Apr 26", "Jan 1, 2025")
        ideas.write_text(old, encoding="utf-8")
        report = ii.run_invalidation(
            ideas_path=ideas, today=datetime.date.fromisoformat("2026-05-18"),
            api_key=None, stale_only=True,
        )
        assert all(t.freshness_verdict == "🔴" for t in report.topics)

    def test_missing_ideas_raises(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            ii.run_invalidation(ideas_path=tmp_path / "no-such.md")


# ── render_invalidation_md ─────────────────────────────────────────────────


class TestRenderInvalidation:
    def _make_report(self, topics=None):
        return ii.InvalidationReport(
            generated_at="2026-05-18", ideas_path="/tmp/i.md",
            topics=topics or [],
        )

    def test_empty_renders_header(self):
        out = ii.render_invalidation_md(self._make_report())
        assert "Idea Invalidation Digest" in out

    def test_stale_bucket_renders(self):
        t = ii.TopicRow(
            title="stale-topic", source_section="Arc 1",
            state="📡 SIGNAL", last_checked_iso="2025-01-01",
            days_since_checked=500, freshness_verdict="🔴",
            search_query="stale topic",
            search_url="https://www.youtube.com/results?search_query=stale+topic",
        )
        out = ii.render_invalidation_md(self._make_report([t]))
        assert "🔴 Stale" in out
        assert "stale-topic" in out
        assert "youtube.com" in out

    def test_competing_coverage_renders(self):
        t = ii.TopicRow(
            title="x", source_section="Arc 1", state="", last_checked_iso="",
            freshness_verdict="🔴", search_query="x",
            search_url="https://example.com",
            competing=[ii.CompetingVideo(
                title="Big Coverage", channel="Veritasium",
                url="https://youtube.com/watch?v=abc",
                published_iso="2026-05-01", view_count=2500000,
            )],
        )
        out = ii.render_invalidation_md(self._make_report([t]))
        assert "Big Coverage" in out
        assert "Veritasium" in out
        assert "2.5M" in out


# ── CLI smoke ──────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_ideas_exits_2(self, tmp_path):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "topic" / "idea_invalidation.py"),
             "--ideas", str(tmp_path / "no-such.md"), "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_synthetic_ideas(self, tmp_path):
        ideas = tmp_path / "IDEAS.md"
        ideas.write_text(_SYNTHETIC_IDEAS, encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "topic" / "idea_invalidation.py"),
             "--ideas", str(ideas), "--json", "--stdout"],
            capture_output=True, text=True,
            # Make sure no YOUTUBE_API_KEY leaks from the host env
            env={**__import__("os").environ, "YOUTUBE_API_KEY": ""},
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert "topics" in payload
        assert len(payload["topics"]) >= 3

    def test_stale_only_with_strict_exits_1(self, tmp_path):
        ideas = tmp_path / "IDEAS.md"
        # Aged dates → all stale
        old = _SYNTHETIC_IDEAS.replace("May 3", "Jan 1, 2025").replace(
            "May 2", "Jan 1, 2025").replace("Apr 26", "Jan 1, 2025")
        ideas.write_text(old, encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "topic" / "idea_invalidation.py"),
             "--ideas", str(ideas), "--strict", "--stdout"],
            capture_output=True, text=True,
            env={**__import__("os").environ, "YOUTUBE_API_KEY": ""},
        )
        assert result.returncode == 1

    def test_real_ideas_md_smoke(self):
        # The real project/IDEAS.md should parse cleanly and report
        # > 0 topics tracked.
        ideas = REPO_ROOT / "project" / "IDEAS.md"
        if not ideas.is_file():
            pytest.skip("IDEAS.md not present in this checkout")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "topic" / "idea_invalidation.py"),
             "--json", "--stdout"],
            capture_output=True, text=True,
            env={**__import__("os").environ, "YOUTUBE_API_KEY": ""},
        )
        assert result.returncode in (0, 1)  # 0 or 1 (strict not set, so 0 expected)
        payload = json.loads(result.stdout)
        assert len(payload["topics"]) > 0
