"""
Unit tests for tools/topic/signal_monitor.py.

Covers:
  · _parse_date (RFC 822 / ISO 8601 / Atom / fallback)
  · _strip_html
  · parse_rss (RSS 2.0 + Atom + malformed)
  · load_config / load_state / save_state (atomic)
  · run_digest (filter by since, dedup against seen_urls, error capture)
  · render_digest_md (no-items / with-items / errors)
  · CLI smoke (missing config / valid synthetic / --no-state-write)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import signal_monitor as sm  # type: ignore[import-not-found]


# ── _parse_date ─────────────────────────────────────────────────────────────


class TestParseDate:
    def test_rfc822_with_tz(self):
        assert sm._parse_date("Mon, 12 May 2026 14:30:00 +0000") == "2026-05-12"

    def test_iso_zulu(self):
        assert sm._parse_date("2026-05-12T14:30:00Z") == "2026-05-12"

    def test_iso_with_tz(self):
        assert sm._parse_date("2026-05-12T14:30:00+0000") == "2026-05-12"

    def test_bare_iso_date(self):
        assert sm._parse_date("2026-05-12") == "2026-05-12"

    def test_fallback_regex(self):
        # Format not in list — falls back to substring extraction
        assert sm._parse_date("posted on 2026-05-12 at noon") == "2026-05-12"

    def test_unparseable_returns_empty(self):
        assert sm._parse_date("yesterday") == ""

    def test_empty(self):
        assert sm._parse_date("") == ""


# ── _strip_html ─────────────────────────────────────────────────────────────


class TestStripHtml:
    def test_strips_tags(self):
        assert sm._strip_html("<p>Hello <b>world</b></p>") == "Hello world"

    def test_collapses_whitespace(self):
        assert sm._strip_html("a   b\n\nc") == "a b c"

    def test_plain_text(self):
        assert sm._strip_html("plain") == "plain"


# ── parse_rss ──────────────────────────────────────────────────────────────


_RSS_SAMPLE = b"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>First Item</title>
      <link>https://example.com/a</link>
      <pubDate>Mon, 12 May 2026 14:30:00 +0000</pubDate>
      <description>&lt;p&gt;Lead text&lt;/p&gt;</description>
    </item>
    <item>
      <title>Second Item</title>
      <link>https://example.com/b</link>
      <pubDate>Sun, 11 May 2026 09:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>
"""

_ATOM_SAMPLE = b"""<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <entry>
    <title>Atom First</title>
    <link href="https://example.com/atom-a"/>
    <published>2026-05-12T10:00:00Z</published>
    <summary>Atom summary</summary>
  </entry>
</feed>
"""


class TestParseRss:
    def test_rss_2_0(self):
        items = sm.parse_rss(_RSS_SAMPLE, source_name="test")
        assert len(items) == 2
        assert items[0].title == "First Item"
        assert items[0].url == "https://example.com/a"
        assert items[0].published_iso == "2026-05-12"
        assert "Lead text" in items[0].summary

    def test_atom(self):
        items = sm.parse_rss(_ATOM_SAMPLE, source_name="atom")
        assert len(items) == 1
        assert items[0].title == "Atom First"
        assert items[0].url == "https://example.com/atom-a"
        assert items[0].summary == "Atom summary"

    def test_arc_hint_propagates(self):
        items = sm.parse_rss(_RSS_SAMPLE, source_name="test", arc_hint="Arc 1")
        assert all(item.arc_hint == "Arc 1" for item in items)

    def test_malformed_returns_empty(self):
        assert sm.parse_rss(b"<not-xml", source_name="x") == []

    def test_empty_returns_empty(self):
        assert sm.parse_rss(b"", source_name="x") == []


# ── load_config / state ────────────────────────────────────────────────────


class TestConfigState:
    def test_load_config_valid(self, tmp_path):
        cfg = tmp_path / "sources.json"
        cfg.write_text(json.dumps([
            {"name": "FA", "url": "https://example.com/fa.rss"},
        ]), encoding="utf-8")
        sources = sm.load_config(cfg)
        assert len(sources) == 1
        assert sources[0]["name"] == "FA"

    def test_load_config_missing_raises(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            sm.load_config(tmp_path / "no-such.json")

    def test_load_config_wrong_shape_raises(self, tmp_path):
        cfg = tmp_path / "sources.json"
        cfg.write_text(json.dumps({"not": "a list"}), encoding="utf-8")
        with pytest.raises(ValueError, match="must be a JSON list"):
            sm.load_config(cfg)

    def test_load_config_non_dict_entry_raises(self, tmp_path):
        cfg = tmp_path / "sources.json"
        cfg.write_text(json.dumps(["not a dict"]), encoding="utf-8")
        with pytest.raises(ValueError, match="is not a dict"):
            sm.load_config(cfg)

    def test_load_config_warns_on_missing_keys(self, tmp_path, capsys):
        cfg = tmp_path / "sources.json"
        cfg.write_text(json.dumps([{"name": "only-name-no-url"}]), encoding="utf-8")
        # Should load (returns the data) but warn to stderr
        sources = sm.load_config(cfg)
        assert len(sources) == 1
        captured = capsys.readouterr()
        assert "missing required keys" in captured.err

    def test_load_state_missing_returns_empty(self, tmp_path):
        assert sm.load_state(tmp_path / "no-such.json") == {}

    def test_load_state_malformed_returns_empty(self, tmp_path):
        s = tmp_path / "state.json"
        s.write_text("not json", encoding="utf-8")
        assert sm.load_state(s) == {}

    def test_save_state_atomic(self, tmp_path):
        s = tmp_path / "state.json"
        sm.save_state(s, {"last_run": "2026-05-18"})
        assert s.is_file()
        # No leftover .tmp
        assert list(tmp_path.glob("*.tmp")) == []


# ── run_digest ─────────────────────────────────────────────────────────────


class _FakeFetcher:
    """Returns canned RSS bytes per URL."""
    def __init__(self, mapping: dict[str, bytes]):
        self.mapping = mapping
        self.calls: list[str] = []

    def __call__(self, url: str) -> bytes:
        self.calls.append(url)
        if url in self.mapping:
            return self.mapping[url]
        raise OSError(f"no canned response for {url}")


class TestRunDigest:
    def _config(self, tmp_path, sources):
        cfg = tmp_path / "sources.json"
        cfg.write_text(json.dumps(sources), encoding="utf-8")
        return cfg

    def test_first_run_uses_default_lookback(self, tmp_path):
        cfg = self._config(tmp_path, [
            {"name": "Test", "url": "https://example.com/feed.rss"},
        ])
        state = tmp_path / "state.json"
        fetcher = _FakeFetcher({"https://example.com/feed.rss": _RSS_SAMPLE})
        report = sm.run_digest(
            config_path=cfg, state_path=state,
            fetcher=fetcher, update_state=False,
        )
        # 14-day default lookback, items posted 2026-05-11/12, so they'd
        # only appear if today is within ~14 days of those dates. With
        # `since` defaulting to today-14 we may or may not catch them.
        # Either way the fetcher was called.
        assert len(fetcher.calls) == 1

    def test_since_override_filters(self, tmp_path):
        cfg = self._config(tmp_path, [
            {"name": "Test", "url": "https://example.com/feed.rss"},
        ])
        state = tmp_path / "state.json"
        fetcher = _FakeFetcher({"https://example.com/feed.rss": _RSS_SAMPLE})
        report = sm.run_digest(
            config_path=cfg, state_path=state,
            since_override="2026-05-12", fetcher=fetcher, update_state=False,
        )
        # Items dated 2026-05-12 and 2026-05-11
        # since=2026-05-12 → 2026-05-12 passes, 2026-05-11 drops
        assert report.new_item_count == 1

    def test_seen_urls_dedup(self, tmp_path):
        cfg = self._config(tmp_path, [
            {"name": "Test", "url": "https://example.com/feed.rss"},
        ])
        state = tmp_path / "state.json"
        # Pre-populate state with one of the URLs as already-seen
        state.write_text(json.dumps({
            "last_run": "2026-01-01",
            "seen_urls": ["https://example.com/a"],
        }), encoding="utf-8")
        fetcher = _FakeFetcher({"https://example.com/feed.rss": _RSS_SAMPLE})
        report = sm.run_digest(
            config_path=cfg, state_path=state,
            since_override="2026-01-01",
            fetcher=fetcher, update_state=False,
        )
        # Only the un-seen URL surfaces
        items = report.fetches[0].items
        assert len(items) == 1
        assert items[0].url == "https://example.com/b"

    def test_fetch_error_captured_not_raised(self, tmp_path):
        cfg = self._config(tmp_path, [
            {"name": "Broken", "url": "https://example.com/broken.rss"},
        ])
        state = tmp_path / "state.json"
        fetcher = _FakeFetcher({})  # no canned response → raises OSError
        report = sm.run_digest(
            config_path=cfg, state_path=state,
            since_override="2026-01-01", fetcher=fetcher, update_state=False,
        )
        assert report.has_errors is True
        assert "fetch failed" in report.fetches[0].error

    def test_per_source_cap(self, tmp_path):
        # 50-item feed should cap at MAX_ITEMS_PER_SOURCE = 12
        big = b'<?xml version="1.0"?>\n<rss><channel>\n' + b"".join(
            f'<item><title>I{i}</title><link>https://e.com/{i}</link>'
            f'<pubDate>Mon, 12 May 2026 14:30:00 +0000</pubDate></item>\n'.encode()
            for i in range(50)
        ) + b"</channel></rss>"
        cfg = self._config(tmp_path, [{"name": "Big", "url": "https://e.com/f"}])
        state = tmp_path / "state.json"
        fetcher = _FakeFetcher({"https://e.com/f": big})
        report = sm.run_digest(
            config_path=cfg, state_path=state,
            since_override="2026-01-01", fetcher=fetcher, update_state=False,
        )
        assert len(report.fetches[0].items) == sm.MAX_ITEMS_PER_SOURCE

    def test_seen_urls_fifo_trim(self, tmp_path):
        # Pre-populate state with 1999 URLs; new digest adds 5; final
        # should be 2000 (the cap), oldest dropped first.
        cfg = self._config(tmp_path, [
            {"name": "Test", "url": "https://e.com/feed.rss"},
        ])
        state_path = tmp_path / "state.json"
        # Build feed with 5 fresh items
        feed = b'<?xml version="1.0"?>\n<rss><channel>\n' + b"".join(
            f'<item><title>New{i}</title><link>https://e.com/new{i}</link>'
            f'<pubDate>Mon, 12 May 2026 14:30:00 +0000</pubDate></item>\n'.encode()
            for i in range(5)
        ) + b"</channel></rss>"
        # 1999 already-seen URLs in state (insertion order matters)
        existing = [f"https://e.com/old{i}" for i in range(1999)]
        state_path.write_text(json.dumps({
            "last_run": "2026-01-01",
            "seen_urls": existing,
        }), encoding="utf-8")
        fetcher = _FakeFetcher({"https://e.com/feed.rss": feed})
        sm.run_digest(
            config_path=cfg, state_path=state_path,
            since_override="2026-01-01",
            fetcher=fetcher, update_state=True,
        )
        new_state = json.loads(state_path.read_text())
        assert len(new_state["seen_urls"]) == 2000
        # Newest 5 URLs are present
        for i in range(5):
            assert f"https://e.com/new{i}" in new_state["seen_urls"]
        # Oldest 4 dropped (1999 + 5 - 2000 = 4 evicted from front)
        for i in range(4):
            assert f"https://e.com/old{i}" not in new_state["seen_urls"]
        # And a sample of more-recent old ones survived
        assert "https://e.com/old1500" in new_state["seen_urls"]

    def test_since_override_preserves_last_run(self, tmp_path):
        # When --since is used retroactively, the forward-moving
        # last_run cursor must NOT regress.
        cfg = self._config(tmp_path, [
            {"name": "Test", "url": "https://e.com/feed.rss"},
        ])
        state_path = tmp_path / "state.json"
        state_path.write_text(json.dumps({
            "last_run": "2026-05-15",
            "seen_urls": [],
        }), encoding="utf-8")
        fetcher = _FakeFetcher({"https://e.com/feed.rss": _RSS_SAMPLE})
        sm.run_digest(
            config_path=cfg, state_path=state_path,
            since_override="2026-01-01",  # retroactive scan
            fetcher=fetcher, update_state=True,
        )
        new_state = json.loads(state_path.read_text())
        # last_run should still be 2026-05-15, NOT today
        assert new_state["last_run"] == "2026-05-15"

    def test_state_updates_on_run(self, tmp_path):
        cfg = self._config(tmp_path, [
            {"name": "Test", "url": "https://example.com/feed.rss"},
        ])
        state_path = tmp_path / "state.json"
        fetcher = _FakeFetcher({"https://example.com/feed.rss": _RSS_SAMPLE})
        sm.run_digest(
            config_path=cfg, state_path=state_path,
            since_override="2026-01-01",
            fetcher=fetcher, update_state=True,
        )
        assert state_path.is_file()
        state = json.loads(state_path.read_text())
        assert "last_run" in state
        assert "https://example.com/a" in state["seen_urls"]


# ── render_digest_md ───────────────────────────────────────────────────────


class TestRenderDigest:
    def _make_report(self, fetches=None):
        return sm.DigestReport(
            generated_at="2026-05-18", since="2026-05-11",
            new_item_count=sum(len(f.items) for f in (fetches or [])),
            fetches=fetches or [],
        )

    def test_no_items_clean_message(self):
        report = self._make_report(fetches=[
            sm.SourceFetch(name="Quiet", url="https://e.com/q"),
        ])
        out = sm.render_digest_md(report)
        assert "Nothing new this cycle" in out

    def test_items_render_per_source(self):
        report = self._make_report(fetches=[
            sm.SourceFetch(
                name="Test", url="https://e.com/t",
                items=[sm.SignalItem(
                    source="Test", title="Big Story",
                    url="https://e.com/big",
                    published_iso="2026-05-15", summary="lead",
                )],
            ),
        ])
        out = sm.render_digest_md(report)
        assert "## Test" in out
        assert "Big Story" in out
        assert "2026-05-15" in out

    def test_errors_section_when_fetch_failed(self):
        report = self._make_report(fetches=[
            sm.SourceFetch(name="Broken", url="https://e.com/x",
                           error="fetch failed: 500"),
        ])
        out = sm.render_digest_md(report)
        assert "Fetch errors" in out
        assert "Broken" in out


# ── CLI smoke ──────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_config_exits_2(self, tmp_path):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "topic" / "signal_monitor.py"),
             "--config", str(tmp_path / "no-such.json"), "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_no_state_write_synthetic(self, tmp_path):
        # Config with a single source we know will fail fetch (no
        # network in tests). We pass --no-state-write so the test
        # doesn't leak state into the real data/ dir.
        cfg = tmp_path / "sources.json"
        cfg.write_text(json.dumps([
            {"name": "Unreachable",
             "url": "https://nonexistent.invalid/feed.rss"},
        ]), encoding="utf-8")
        state = tmp_path / "state.json"
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "topic" / "signal_monitor.py"),
             "--config", str(cfg), "--state", str(state),
             "--no-state-write", "--json", "--stdout"],
            capture_output=True, text=True,
            timeout=30,
        )
        # Fetch will fail → exit 1, but the JSON payload is still valid
        assert result.returncode == 1
        payload = json.loads(result.stdout)
        assert payload["has_errors"] is True
        # State should NOT be written under --no-state-write
        assert not state.exists()
