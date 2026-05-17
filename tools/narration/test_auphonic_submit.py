"""
Unit tests for tools/narration/auphonic_submit.py.

Strategy: never hit the real Auphonic API.
  · Pure-function parsers (production response, presets response, output
    file selection) tested with synthetic JSON.
  · HTTP client tested by injecting a fake `opener` whose `open()`
    returns canned responses; we assert the request urls / headers /
    methods.
  · Polling loop tested with injectable sleep + status callback so it
    exercises terminal-state detection and timeout without real time.
"""

from __future__ import annotations

import io
import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path
from unittest.mock import MagicMock

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import auphonic_submit as au  # type: ignore[import-not-found]


# ── parse_production_response ────────────────────────────────────────────────


class TestParseProductionResponse:
    def test_parses_wrapped_data_field(self):
        body = {
            "data": {
                "uuid": "abc123",
                "status": 3,
                "status_string": "Done",
                "title": "Test",
                "output_files": [{"filename": "out.wav"}],
            }
        }
        p = au.parse_production_response(body)
        assert p.uuid == "abc123"
        assert p.status == 3
        assert p.is_done
        assert p.is_terminal
        assert len(p.output_files) == 1

    def test_parses_unwrapped_body(self):
        # Some API endpoints don't wrap in `data`. Parser should tolerate both.
        body = {"uuid": "x", "status": 1, "status_string": "Waiting"}
        p = au.parse_production_response(body)
        assert p.uuid == "x"
        assert not p.is_done

    def test_error_status_recognised_as_terminal(self):
        p = au.parse_production_response({"data": {"uuid": "x", "status": 2, "status_string": "Error", "error_message": "oops"}})
        assert p.is_terminal
        assert not p.is_done
        assert p.error_message == "oops"

    def test_missing_fields_default_sanely(self):
        p = au.parse_production_response({})
        assert p.uuid == ""
        assert p.status == -1
        assert p.output_files == []


# ── parse_presets_response ───────────────────────────────────────────────────


class TestParsePresetsResponse:
    def test_handles_list_in_data(self):
        body = {"data": [
            {"uuid": "p1", "preset_name": "Narration", "description": "VO chain"},
            {"uuid": "p2", "preset_name": "Podcast"},
        ]}
        presets = au.parse_presets_response(body)
        assert len(presets) == 2
        assert presets[0].uuid == "p1"
        assert presets[0].preset_name == "Narration"

    def test_handles_results_pagination_shape(self):
        body = {"data": {"results": [{"uuid": "p1", "preset_name": "X"}]}}
        presets = au.parse_presets_response(body)
        assert len(presets) == 1

    def test_filters_non_dict_items(self):
        body = {"data": [{"uuid": "x", "preset_name": "OK"}, "junk", None]}
        presets = au.parse_presets_response(body)
        assert len(presets) == 1


# ── first_wav_output ─────────────────────────────────────────────────────────


class TestFirstWavOutput:
    def _prod(self, files):
        return au.Production(uuid="x", status=3, status_string="Done", title="",
                             output_files=files)

    def test_picks_wav_format(self):
        out = au.first_wav_output(self._prod([
            {"filename": "x.mp3", "format": "mp3"},
            {"filename": "x.wav", "format": "wav"},
        ]))
        assert out["filename"] == "x.wav"

    def test_falls_back_to_extension(self):
        out = au.first_wav_output(self._prod([
            {"filename": "master.wav"},
        ]))
        assert out["filename"] == "master.wav"

    def test_falls_back_to_first_when_no_wav(self):
        out = au.first_wav_output(self._prod([
            {"filename": "x.flac", "format": "flac"},
        ]))
        assert out["filename"] == "x.flac"

    def test_empty_returns_none(self):
        assert au.first_wav_output(self._prod([])) is None


# ── AuphonicClient with mocked HTTP ──────────────────────────────────────────


class _FakeResponse:
    """Pretend to be a urlopen-returned context manager."""

    def __init__(self, body: bytes):
        self._body = body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, *args):
        if args:
            n = args[0]
            chunk = self._body[:n]
            self._body = self._body[n:]
            return chunk
        return self._body


def _make_client_with_opener(canned_responses: list[bytes]) -> tuple[au.AuphonicClient, MagicMock]:
    """Build an AuphonicClient whose opener returns canned bytes in order.
    Returns (client, opener_mock) so the test can inspect calls."""
    opener = MagicMock()
    # Each call to opener.open returns the next canned response.
    opener.open.side_effect = [_FakeResponse(body) for body in canned_responses]
    return au.AuphonicClient(api_key="test-key", opener=opener), opener


class TestAuphonicClient:
    def test_get_production_sends_bearer_auth(self):
        body = json.dumps({"data": {"uuid": "x", "status": 1, "status_string": "Waiting"}}).encode()
        client, opener = _make_client_with_opener([body])
        prod = client.get_production("x")
        assert prod.uuid == "x"
        # The Request passed to open() should carry the Authorization header.
        request = opener.open.call_args[0][0]
        assert request.get_header("Authorization") == "Bearer test-key"
        assert request.full_url.endswith("/api/production/x.json")

    def test_create_production_multipart_form(self, tmp_path):
        wav = tmp_path / "narration.wav"
        wav.write_bytes(b"RIFFfakeWAVdata")
        body = json.dumps({"data": {"uuid": "new-uuid", "status": 1, "status_string": "Waiting"}}).encode()
        client, opener = _make_client_with_opener([body])
        prod = client.create_production(wav, preset_uuid="preset-xyz", title="t")
        assert prod.uuid == "new-uuid"
        request = opener.open.call_args[0][0]
        # Should be a POST to /simple/productions.json
        assert request.method == "POST"
        assert request.full_url.endswith("/simple/productions.json")
        # Body should be multipart with the fake wav data in it.
        assert b"RIFFfakeWAVdata" in request.data
        assert b"preset-xyz" in request.data
        # Content-Type header should declare multipart with a boundary.
        ct = request.get_header("Content-type") or ""
        assert "multipart/form-data" in ct.lower()

    def test_list_presets_parses(self):
        body = json.dumps({"data": [{"uuid": "p1", "preset_name": "N"}]}).encode()
        client, _ = _make_client_with_opener([body])
        presets = client.list_presets()
        assert presets[0].uuid == "p1"

    def test_download_streams_to_disk(self, tmp_path):
        client, _ = _make_client_with_opener([b"audio bytes here"])
        out = tmp_path / "subdir" / "mastered.wav"
        client.download("https://example.com/x.wav", out)
        assert out.read_bytes() == b"audio bytes here"

    def test_http_error_raises_runtime(self):
        import urllib.error
        opener = MagicMock()
        opener.open.side_effect = urllib.error.HTTPError(
            "http://x", 500, "boom", {}, io.BytesIO(b'{"detail":"server down"}'),
        )
        client = au.AuphonicClient(api_key="k", opener=opener)
        with pytest.raises(RuntimeError) as exc:
            client.get_production("x")
        assert "500" in str(exc.value)


# ── poll_until_done ──────────────────────────────────────────────────────────


class TestPollUntilDone:
    def test_returns_immediately_when_done(self):
        client = MagicMock()
        client.get_production.return_value = au.Production(
            uuid="x", status=3, status_string="Done", title="", output_files=[],
        )
        sleep = MagicMock()
        result = au.poll_until_done(client, "x", sleep=sleep, timeout_sec=30)
        assert result.is_done
        assert sleep.call_count == 0  # we never slept

    def test_polls_until_terminal(self):
        client = MagicMock()
        # Three responses: waiting → processing → done
        client.get_production.side_effect = [
            au.Production(uuid="x", status=1, status_string="Waiting", title="", output_files=[]),
            au.Production(uuid="x", status=5, status_string="Processing", title="", output_files=[]),
            au.Production(uuid="x", status=3, status_string="Done", title="", output_files=[]),
        ]
        sleep = MagicMock()
        result = au.poll_until_done(client, "x", sleep=sleep, timeout_sec=30, poll_interval_sec=1)
        assert result.is_done
        assert sleep.call_count == 2  # slept twice before getting Done

    def test_status_callback_called_on_each_change(self):
        client = MagicMock()
        client.get_production.side_effect = [
            au.Production(uuid="x", status=1, status_string="Waiting", title="", output_files=[]),
            au.Production(uuid="x", status=1, status_string="Waiting", title="", output_files=[]),
            au.Production(uuid="x", status=3, status_string="Done", title="", output_files=[]),
        ]
        sleep = MagicMock()
        on_status = MagicMock()
        au.poll_until_done(client, "x", sleep=sleep, on_status=on_status, poll_interval_sec=1)
        # Two callbacks: first Waiting + Done. Mid-poll same-status doesn't fire.
        assert on_status.call_count == 2

    def test_times_out_when_never_terminal(self):
        client = MagicMock()
        client.get_production.return_value = au.Production(
            uuid="x", status=1, status_string="Waiting", title="", output_files=[],
        )
        sleep = MagicMock()
        # Use a tiny timeout — with monotonic-clock-based check the loop
        # exits after the second iteration.
        with pytest.raises(TimeoutError) as exc:
            au.poll_until_done(client, "x", sleep=sleep, timeout_sec=0.0,
                               poll_interval_sec=0.001)
        assert "Waiting" in str(exc.value)

    def test_error_status_returns_terminal(self):
        client = MagicMock()
        client.get_production.return_value = au.Production(
            uuid="x", status=au.STATUS_ERROR, status_string="Error",
            title="", output_files=[], error_message="bad input",
        )
        result = au.poll_until_done(client, "x", sleep=MagicMock(), timeout_sec=30)
        assert result.is_terminal
        assert not result.is_done


# ── CLI smoke (no network — only exit codes for arg validation) ─────────────


class TestCliSmoke:
    def test_missing_api_key_exits_2(self, monkeypatch):
        monkeypatch.delenv("AUPHONIC_API_KEY", raising=False)
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "auphonic_submit.py"),
                "some-slug",
            ],
            capture_output=True, text=True,
            env={k: v for k, v in os.environ.items() if k != "AUPHONIC_API_KEY"},
        )
        assert result.returncode == 2
        assert "AUPHONIC_API_KEY" in result.stderr

    def test_missing_wav_exits_2(self, tmp_path, monkeypatch):
        monkeypatch.setenv("AUPHONIC_API_KEY", "fake-key")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "auphonic_submit.py"),
                "--wav", str(tmp_path / "no-such.wav"),
            ],
            capture_output=True, text=True,
            env={**os.environ, "AUPHONIC_API_KEY": "fake-key"},
        )
        assert result.returncode == 2
        assert "not found" in result.stderr

    def test_no_slug_or_wav_exits_2(self, monkeypatch):
        monkeypatch.setenv("AUPHONIC_API_KEY", "fake-key")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "auphonic_submit.py"),
            ],
            capture_output=True, text=True,
            env={**os.environ, "AUPHONIC_API_KEY": "fake-key"},
        )
        assert result.returncode == 2
