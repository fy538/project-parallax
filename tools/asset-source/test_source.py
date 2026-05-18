"""
Tests for tools/asset-source/source.py — stock photo/video sourcing.

Strategy: pure-function focus. The three search functions (pexels/pixabay/
unsplash) hit external APIs; we mock requests.get and assert the response
parsing logic produces the expected dict shape.

Run: pytest tools/asset-source/test_source.py -v
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import requests

sys.path.insert(0, str(Path(__file__).parent))

import source


# ── Fixtures ──────────────────────────────────────────────────────────────


def _mock_resp(json_data: dict, status: int = 200) -> MagicMock:
    """Build a mock Response object compatible with requests' API."""
    m = MagicMock()
    m.status_code = status
    m.json.return_value = json_data
    m.raise_for_status = MagicMock()
    return m


# ── search_pexels — response parsing ──────────────────────────────────────


def test_pexels_photo_response_parsing(monkeypatch):
    monkeypatch.setattr(source, "PEXELS_KEY", "fake-key")
    pexels_response = {
        "photos": [
            {
                "id": 12345,
                "url": "https://pexels.com/photo/12345",
                "src": {"medium": "https://pexels.com/m.jpg", "original": "https://pexels.com/o.jpg"},
                "width": 1920,
                "height": 1080,
                "photographer": "Jane Photographer",
            }
        ]
    }
    with patch("source.requests.get", return_value=_mock_resp(pexels_response)):
        results = source.search_pexels("chip factory", media_type="photo", count=1)
    assert len(results) == 1
    r = results[0]
    assert r["source"] == "pexels"
    assert r["type"] == "photo"
    assert r["id"] == 12345
    assert r["download"] == "https://pexels.com/o.jpg"
    assert r["preview"] == "https://pexels.com/m.jpg"
    assert r["photographer"] == "Jane Photographer"
    assert "Pexels License" in r["license"]


def test_pexels_video_response_parsing(monkeypatch):
    monkeypatch.setattr(source, "PEXELS_KEY", "fake-key")
    pexels_response = {
        "videos": [
            {
                "id": 999,
                "url": "https://pexels.com/video/999",
                "image": "https://pexels.com/preview.jpg",
                "duration": 12,
                "user": {"name": "Drone Co"},
                "video_files": [
                    {"quality": "sd", "link": "https://pexels.com/sd.mp4", "width": 640, "height": 360},
                    {"quality": "hd", "link": "https://pexels.com/hd.mp4", "width": 1920, "height": 1080},
                ],
            }
        ]
    }
    with patch("source.requests.get", return_value=_mock_resp(pexels_response)):
        results = source.search_pexels("aerial city", media_type="video")
    assert results[0]["type"] == "video"
    assert results[0]["download"] == "https://pexels.com/hd.mp4"  # picked HD over SD
    assert results[0]["duration"] == 12


def test_pexels_returns_empty_when_no_key(monkeypatch):
    monkeypatch.setattr(source, "PEXELS_KEY", "")
    assert source.search_pexels("anything") == []


def test_pexels_handles_network_error_gracefully(monkeypatch, capsys):
    """A connection error (RequestException subclass) is logged with the
    exception type name + URL context, then returns []. Bare `Exception` no
    longer matches the narrowed catch — that's the contract of `_fetch_json`."""
    monkeypatch.setattr(source, "PEXELS_KEY", "fake-key")
    with patch(
        "source.requests.get",
        side_effect=requests.ConnectionError("name resolution failure"),
    ):
        results = source.search_pexels("test")
    assert results == []
    err = capsys.readouterr().err
    assert "Pexels request failed" in err
    assert "ConnectionError" in err


def test_fetch_json_logs_http_status_on_4xx(monkeypatch, capsys):
    """4xx/5xx errors surface the status code so a bad key (401) reads
    differently from a rate limit (429) or a server issue (5xx)."""
    fake_resp = MagicMock()
    fake_resp.status_code = 401
    fake_resp.headers = {}
    err = requests.HTTPError("401 Client Error: Unauthorized")
    err.response = fake_resp
    fake_resp.raise_for_status = MagicMock(side_effect=err)
    with patch("source.requests.get", return_value=fake_resp):
        result = source._fetch_json("TestAPI", "https://example.com")
    assert result is None
    out = capsys.readouterr().err
    assert "TestAPI HTTP 401" in out


def test_fetch_json_honors_retry_after_on_429(monkeypatch, capsys):
    """The Retry-After header on a 429 is surfaced so operators can
    throttle subsequent runs. Before this helper, every API error read
    identically — making rate-limit problems invisible until they cascaded."""
    fake_resp = MagicMock()
    fake_resp.status_code = 429
    fake_resp.headers = {"Retry-After": "60"}
    err = requests.HTTPError("429 Too Many Requests")
    err.response = fake_resp
    fake_resp.raise_for_status = MagicMock(side_effect=err)
    with patch("source.requests.get", return_value=fake_resp):
        result = source._fetch_json("Pexels", "https://example.com")
    assert result is None
    out = capsys.readouterr().err
    assert "HTTP 429" in out
    assert "Retry-After: 60s" in out


def test_fetch_json_handles_non_json_response(monkeypatch, capsys):
    """If the API returns 200 OK with non-JSON (e.g., HTML maintenance
    page), we log distinctly and return None — not the same as a 5xx."""
    fake_resp = MagicMock()
    fake_resp.status_code = 200
    fake_resp.raise_for_status = MagicMock()
    fake_resp.json.side_effect = ValueError("Expecting value: line 1 column 1")
    with patch("source.requests.get", return_value=fake_resp):
        result = source._fetch_json("Pexels", "https://example.com")
    assert result is None
    out = capsys.readouterr().err
    assert "Pexels returned non-JSON response" in out


def test_fetch_json_lets_programming_errors_bubble(monkeypatch):
    """TypeError from our own code is NOT a 'Pexels error.' Before the
    narrow, every Exception was swallowed and printed as if the API broke."""
    with patch("source.requests.get", side_effect=TypeError("not iterable")):
        import pytest
        with pytest.raises(TypeError):
            source._fetch_json("Pexels", "https://example.com")


# ── search_pixabay — response parsing ─────────────────────────────────────


def test_pixabay_photo_response_parsing(monkeypatch):
    monkeypatch.setattr(source, "PIXABAY_KEY", "fake-key")
    pixabay_response = {
        "hits": [
            {
                "id": 789,
                "pageURL": "https://pixabay.com/p/789",
                "webformatURL": "https://pixabay.com/wf.jpg",
                "largeImageURL": "https://pixabay.com/l.jpg",
                "imageWidth": 1920,
                "imageHeight": 1080,
                "user": "PixUser",
            }
        ]
    }
    with patch("source.requests.get", return_value=_mock_resp(pixabay_response)):
        results = source.search_pixabay("forest", media_type="photo")
    r = results[0]
    assert r["source"] == "pixabay"
    assert r["type"] == "photo"
    assert r["download"] == "https://pixabay.com/l.jpg"


def test_pixabay_returns_empty_when_no_key(monkeypatch):
    monkeypatch.setattr(source, "PIXABAY_KEY", "")
    assert source.search_pixabay("anything") == []


def test_pixabay_uses_params_dict_not_url_string(monkeypatch):
    """L19-related: API key must be passed via params dict, not interpolated into the URL.
    This prevents the key from being baked into log URLs / referer headers."""
    monkeypatch.setattr(source, "PIXABAY_KEY", "secret-key-do-not-leak")
    captured_kwargs = {}

    def fake_get(url, **kwargs):
        captured_kwargs.update(kwargs)
        captured_kwargs["url"] = url
        return _mock_resp({"hits": []})

    with patch("source.requests.get", side_effect=fake_get):
        source.search_pixabay("test")

    assert "params" in captured_kwargs
    assert captured_kwargs["params"]["key"] == "secret-key-do-not-leak"
    # The URL itself must NOT contain the key
    assert "secret-key-do-not-leak" not in captured_kwargs["url"]


# ── search_unsplash ────────────────────────────────────────────────────────


def test_unsplash_returns_empty_when_no_key(monkeypatch):
    monkeypatch.setattr(source, "UNSPLASH_KEY", "")
    assert source.search_unsplash("anything") == []


def test_unsplash_response_parsing(monkeypatch):
    monkeypatch.setattr(source, "UNSPLASH_KEY", "fake-key")
    unsplash_response = {
        "results": [
            {
                "id": "abc123",
                "links": {"html": "https://unsplash.com/p/abc123"},
                "urls": {"regular": "https://unsplash.com/r.jpg", "raw": "https://unsplash.com/raw.jpg"},
                "width": 1920,
                "height": 1080,
                "user": {"name": "UnsUser"},
            }
        ]
    }
    with patch("source.requests.get", return_value=_mock_resp(unsplash_response)):
        results = source.search_unsplash("mountain")
    assert results[0]["source"] == "unsplash"
    assert results[0]["id"] == "abc123"


# ── search_with_fallbacks — dedup logic ───────────────────────────────────


def test_search_with_fallbacks_dedupes_by_source_and_id(monkeypatch, capsys):
    # Mock search_all to return overlapping results across two terms
    call_count = {"n": 0}

    def fake_search_all(query, media_type="photo"):
        call_count["n"] += 1
        # Both terms return the same Pexels item (id=1) but different Pixabay items
        return [
            {"source": "pexels", "id": 1, "download": "x"},
            {"source": "pixabay", "id": call_count["n"] * 10, "download": "y"},
        ]

    monkeypatch.setattr(source, "search_all", fake_search_all)
    out = source.search_with_fallbacks(["term1", "term2"], "photo")

    # Pexels id=1 appears twice → should dedupe to once
    pexels_results = [r for r in out["results"] if r["source"] == "pexels"]
    assert len(pexels_results) == 1
    # Two distinct Pixabay results stay
    pixabay_results = [r for r in out["results"] if r["source"] == "pixabay"]
    assert len(pixabay_results) == 2
    assert out["total_results"] == 3


def test_search_with_fallbacks_returns_all_terms_in_metadata(monkeypatch):
    monkeypatch.setattr(source, "search_all", lambda q, mt="photo": [])
    out = source.search_with_fallbacks(["a", "b", "c"], "video")
    assert out["search_terms"] == ["a", "b", "c"]
    assert out["media_type"] == "video"
    assert out["results"] == []


def test_search_with_fallbacks_empty_terms(monkeypatch):
    monkeypatch.setattr(source, "search_all", lambda q, mt="photo": [{"source": "pexels", "id": 1}])
    out = source.search_with_fallbacks([], "photo")
    # No terms → no calls → no results
    assert out["total_results"] == 0


# ── search_all — orchestration ────────────────────────────────────────────


def test_search_all_skips_unsplash_for_video(monkeypatch):
    """Unsplash is photos-only — search_all should skip it for video media type."""
    calls = []

    def fake_pexels(q, mt, c=15):
        calls.append(("pexels", mt))
        return []

    def fake_pixabay(q, mt, c=15):
        calls.append(("pixabay", mt))
        return []

    def fake_unsplash(q, c=15):
        calls.append(("unsplash", "photo"))
        return []

    monkeypatch.setattr(source, "search_pexels", fake_pexels)
    monkeypatch.setattr(source, "search_pixabay", fake_pixabay)
    monkeypatch.setattr(source, "search_unsplash", fake_unsplash)

    source.search_all("test", "video")
    sources_called = [c[0] for c in calls]
    assert "unsplash" not in sources_called
    assert "pexels" in sources_called
    assert "pixabay" in sources_called


def test_search_all_includes_unsplash_for_photo(monkeypatch):
    calls = []
    monkeypatch.setattr(source, "search_pexels", lambda q, mt: calls.append("pexels") or [])
    monkeypatch.setattr(source, "search_pixabay", lambda q, mt: calls.append("pixabay") or [])
    monkeypatch.setattr(source, "search_unsplash", lambda q: calls.append("unsplash") or [])
    source.search_all("test", "photo")
    assert set(calls) == {"pexels", "pixabay", "unsplash"}
