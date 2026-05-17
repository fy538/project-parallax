#!/usr/bin/env python3
"""
auphonic_submit.py — upload a narration WAV to Auphonic, poll for the
mastered output, download it alongside the original.

Auphonic (auphonic.com) is a cloud post-production service that runs the
canonical narration chain — noise reduction + adaptive leveling + filtering
+ loudness normalization to a chosen LUFS target — better than most home
chain configurations and faster than building the chain by hand. For the
solo creator workflow, it's the lowest-friction way to get a clean
broadcast-spec master from a rough raw take.

This tool is a thin client around the Auphonic REST API: POST the WAV +
preset, poll the production until status == "Done", download the master,
print a one-line summary.

Auth: set AUPHONIC_API_KEY in the environment. Get one at
https://auphonic.com/api/api_keys/ → "Create a new API Key" (OAuth Bearer
token, not the legacy username/password). Stored as a plain string; never
appears in the tool source.

Usage:
    AUPHONIC_API_KEY=... python3 tools/narration/auphonic_submit.py <slug>
        # uploads episodes/<slug>/assets/narration.wav with default preset
    python3 tools/narration/auphonic_submit.py <slug> --wav <path>
    python3 tools/narration/auphonic_submit.py <slug> --preset <uuid>
    python3 tools/narration/auphonic_submit.py <slug> --output <path>
        # default output: <wav-dir>/narration-mastered.wav
    python3 tools/narration/auphonic_submit.py --list-presets
        # print the account's available presets (UUID + name)

Exit codes:
    0 — mastered file downloaded successfully
    1 — production errored or polling timed out
    2 — missing API key / WAV / network unreachable
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid as uuid_mod
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

API_BASE = "https://auphonic.com/api"
DEFAULT_POLL_INTERVAL_SEC = 10.0   # be a polite API consumer
DEFAULT_POLL_TIMEOUT_SEC = 1800.0  # 30 min — long enough for a 20-min master
ENV_API_KEY = "AUPHONIC_API_KEY"

# Per-request socket timeouts. Without these, urllib.request.urlopen blocks
# indefinitely if the API stalls mid-response — which makes the
# `poll_until_done` wall-clock timeout a lie (it only checks elapsed time
# AFTER get_production() returns, not while it's hanging). Smaller for
# status pings, larger for downloads which can take a while on slow links.
API_REQUEST_TIMEOUT_SEC = 30.0      # POST / GET (status, presets)
DOWNLOAD_REQUEST_TIMEOUT_SEC = 300.0  # mastered file download

# Auphonic production status codes (per their API docs).
# Values we care about:
STATUS_DONE = 3
STATUS_ERROR = 2
TERMINAL_STATUSES = {STATUS_DONE, STATUS_ERROR}


@dataclass
class Production:
    """Snapshot of one Auphonic production."""

    uuid: str
    status: int
    status_string: str
    title: str
    output_files: list[dict[str, Any]]
    error_message: str = ""

    @property
    def is_done(self) -> bool:
        return self.status == STATUS_DONE

    @property
    def is_terminal(self) -> bool:
        return self.status in TERMINAL_STATUSES


@dataclass
class Preset:
    """Auphonic preset summary for --list-presets output."""

    uuid: str
    preset_name: str
    description: str = ""


# ── Parsers (pure — easy to unit-test) ───────────────────────────────────────


def parse_production_response(body: dict) -> Production:
    """Extract a Production from a `/api/production/<uuid>.json` body."""
    data = body.get("data", body)  # tolerant of wrapped/unwrapped responses
    return Production(
        uuid=data.get("uuid", ""),
        status=int(data.get("status", -1)),
        status_string=str(data.get("status_string", "")),
        title=str(data.get("title", "")),
        output_files=list(data.get("output_files", [])),
        error_message=str(data.get("error_message", "")),
    )


def parse_presets_response(body: dict) -> list[Preset]:
    """Extract preset list from a `/api/presets.json` body."""
    items = body.get("data", body)
    if isinstance(items, dict):
        items = items.get("results", []) or list(items.values())
    presets: list[Preset] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        presets.append(Preset(
            uuid=item.get("uuid", ""),
            preset_name=item.get("preset_name", item.get("title", "")),
            description=item.get("description", ""),
        ))
    return presets


def first_wav_output(production: Production) -> Optional[dict[str, Any]]:
    """Pick the WAV output from a finished production. Falls back to the
    first output if no WAV is present (operator's preset may emit FLAC/MP3)."""
    for f in production.output_files:
        if (f.get("format") or "").lower() == "wav":
            return f
        ext = Path(f.get("filename", "")).suffix.lower()
        if ext in {".wav", ".wave"}:
            return f
    return production.output_files[0] if production.output_files else None


# ── HTTP client ──────────────────────────────────────────────────────────────


class AuphonicClient:
    """Thin urllib-based client. Injectable for tests."""

    def __init__(self, api_key: str, base_url: str = API_BASE, opener=None):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        # Tests inject a fake opener; production uses urllib's default.
        self._opener = opener or urllib.request.build_opener()

    def _request(self, path: str, method: str = "GET", body: Optional[bytes] = None,
                 content_type: Optional[str] = None,
                 timeout: float = API_REQUEST_TIMEOUT_SEC) -> dict:
        url = f"{self.base_url}{path}"
        req = urllib.request.Request(url, data=body, method=method)
        req.add_header("Authorization", f"Bearer {self.api_key}")
        if content_type:
            req.add_header("Content-Type", content_type)
        try:
            # timeout= bounds the socket I/O; without it a stalled API holds
            # the process forever and poll_until_done's timeout never fires.
            with self._opener.open(req, timeout=timeout) as resp:
                raw = resp.read()
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                payload = {"raw": raw.decode("utf-8", errors="replace")}
            raise RuntimeError(
                f"Auphonic API {method} {path} failed with status {e.code}: {payload}"
            ) from e
        except urllib.error.URLError as e:
            # Covers socket.timeout (the urlopen timeout fires), DNS
            # failures, connection refused, TLS errors. Without this catch,
            # poll_until_done would let the URLError propagate past main's
            # `except RuntimeError`/`except TimeoutError` clauses and the
            # operator sees a Python traceback instead of a clean exit-1.
            raise RuntimeError(
                f"Auphonic API {method} {path} network error: {e.reason}"
            ) from e
        return json.loads(raw.decode("utf-8"))

    def create_production(
        self, wav_path: Path, preset_uuid: Optional[str] = None, title: Optional[str] = None,
    ) -> Production:
        """Upload a WAV via the Simple API and immediately start the production."""
        boundary = f"----auphonic{uuid_mod.uuid4().hex}"
        parts: list[bytes] = []

        def add_field(name: str, value: str) -> None:
            parts.append(f"--{boundary}\r\n".encode())
            parts.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
            parts.append(value.encode())
            parts.append(b"\r\n")

        def add_file(name: str, file_path: Path) -> None:
            parts.append(f"--{boundary}\r\n".encode())
            parts.append(
                f'Content-Disposition: form-data; name="{name}"; '
                f'filename="{file_path.name}"\r\n'.encode()
            )
            parts.append(b"Content-Type: audio/wav\r\n\r\n")
            parts.append(file_path.read_bytes())
            parts.append(b"\r\n")

        add_field("action", "start")
        if preset_uuid:
            add_field("preset", preset_uuid)
        if title:
            add_field("title", title)
        add_file("input_file", wav_path)
        parts.append(f"--{boundary}--\r\n".encode())
        body = b"".join(parts)
        response = self._request(
            "/simple/productions.json", method="POST", body=body,
            content_type=f"multipart/form-data; boundary={boundary}",
        )
        return parse_production_response(response)

    def get_production(self, production_uuid: str) -> Production:
        return parse_production_response(
            self._request(f"/production/{production_uuid}.json")
        )

    def list_presets(self) -> list[Preset]:
        return parse_presets_response(self._request("/presets.json"))

    def download(self, url: str, out_path: Path,
                 timeout: float = DOWNLOAD_REQUEST_TIMEOUT_SEC) -> None:
        """Stream a download URL to disk. Auth header is included so this
        works for private outputs. Per-socket timeout (default 5 min)
        bounds the total wait; for slow links bump via the `timeout` arg."""
        req = urllib.request.Request(url, method="GET")
        req.add_header("Authorization", f"Bearer {self.api_key}")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with self._opener.open(req, timeout=timeout) as resp, open(out_path, "wb") as fh:
            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                fh.write(chunk)


# ── Polling ──────────────────────────────────────────────────────────────────


def poll_until_done(
    client: AuphonicClient, production_uuid: str,
    poll_interval_sec: float = DEFAULT_POLL_INTERVAL_SEC,
    timeout_sec: float = DEFAULT_POLL_TIMEOUT_SEC,
    sleep=time.sleep,  # injectable for tests
    on_status=None,    # callback(production) for log/progress lines
) -> Production:
    """Poll the production endpoint until terminal state or timeout.

    Returns the final Production. Raises TimeoutError if it doesn't reach
    a terminal state in time. Both `sleep` and `on_status` are injectable
    so tests run instantly and can assert progress reporting."""
    start = time.monotonic()
    last_status_int: Optional[int] = None
    while True:
        production = client.get_production(production_uuid)
        if on_status and production.status != last_status_int:
            on_status(production)
            last_status_int = production.status
        if production.is_terminal:
            return production
        if time.monotonic() - start > timeout_sec:
            raise TimeoutError(
                f"Auphonic production {production_uuid} did not finish in "
                f"{timeout_sec:.0f}s (last status: {production.status_string!r})."
            )
        sleep(poll_interval_sec)


# ── CLI ──────────────────────────────────────────────────────────────────────


def _default_wav(slug: str) -> Path:
    return EPISODES_DIR / slug / "assets" / "narration.wav"


def _default_output(wav_path: Path) -> Path:
    return wav_path.parent / "narration-mastered.wav"


def _resolve_api_key() -> Optional[str]:
    return os.environ.get(ENV_API_KEY)


def _print_status(production: Production) -> None:
    """Default status callback — one line per status change."""
    print(f"  · status: {production.status_string} (code {production.status})")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", nargs="?", help="Episode slug.")
    parser.add_argument("--wav", help="Explicit WAV path.")
    parser.add_argument("--preset", help="Auphonic preset UUID (optional).")
    parser.add_argument("--output", help="Output path for the mastered WAV.")
    parser.add_argument("--title", help="Title to attach to the Auphonic production.")
    parser.add_argument(
        "--poll-interval", type=float, default=DEFAULT_POLL_INTERVAL_SEC,
        help=f"Polling interval in seconds (default: {DEFAULT_POLL_INTERVAL_SEC}).",
    )
    parser.add_argument(
        "--timeout", type=float, default=DEFAULT_POLL_TIMEOUT_SEC,
        help=f"Polling timeout in seconds (default: {DEFAULT_POLL_TIMEOUT_SEC}).",
    )
    parser.add_argument(
        "--list-presets", action="store_true",
        help="List available presets and exit (no upload).",
    )
    args = parser.parse_args()

    api_key = _resolve_api_key()
    if not api_key:
        print(
            f"✗ {ENV_API_KEY} not set. Generate one at "
            f"https://auphonic.com/api/api_keys/ and:\n"
            f"    export {ENV_API_KEY}=<your-token>",
            file=sys.stderr,
        )
        return 2

    client = AuphonicClient(api_key)

    # ── --list-presets path ──────────────────────────────────────────────
    if args.list_presets:
        try:
            presets = client.list_presets()
        except RuntimeError as e:
            print(f"✗ {e}", file=sys.stderr)
            return 1
        if not presets:
            print("No presets found on this account.")
            return 0
        print(f"\n{len(presets)} preset(s):\n")
        for p in presets:
            line = f"  {p.uuid}  {p.preset_name}"
            if p.description:
                line += f"  ({p.description[:50]})"
            print(line)
        return 0

    # ── Upload + poll + download ─────────────────────────────────────────
    if args.wav:
        wav_path = Path(args.wav).resolve()
    elif args.slug:
        wav_path = _default_wav(args.slug)
    else:
        print("✗ provide either a slug or --wav <path>", file=sys.stderr)
        return 2

    if not wav_path.is_file():
        print(f"✗ WAV not found: {wav_path}", file=sys.stderr)
        return 2

    title = args.title or f"Parallax narration — {args.slug or wav_path.stem}"
    output_path = Path(args.output).resolve() if args.output else _default_output(wav_path)

    print(f"→ Uploading {wav_path.name} to Auphonic …")
    try:
        prod = client.create_production(wav_path, preset_uuid=args.preset, title=title)
    except RuntimeError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 1
    print(f"  · production created: {prod.uuid} ({prod.status_string})")
    print(f"  · polling every {args.poll_interval:.0f}s (timeout: {args.timeout:.0f}s)")

    try:
        final = poll_until_done(
            client, prod.uuid,
            poll_interval_sec=args.poll_interval,
            timeout_sec=args.timeout,
            on_status=_print_status,
        )
    except TimeoutError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 1
    except RuntimeError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 1

    if not final.is_done:
        msg = final.error_message or final.status_string
        print(f"✗ Production failed: {msg}", file=sys.stderr)
        return 1

    output_file = first_wav_output(final)
    if not output_file:
        print("✗ Production complete but no output files attached.", file=sys.stderr)
        return 1

    download_url = output_file.get("download_url")
    if not download_url:
        print(f"✗ Output file has no download_url: {output_file}", file=sys.stderr)
        return 1

    print(f"→ Downloading {output_file.get('filename', 'master.wav')} → {output_path} …")
    try:
        client.download(download_url, output_path)
    except (RuntimeError, urllib.error.URLError) as e:
        print(f"✗ Download failed: {e}", file=sys.stderr)
        return 1

    size_mb = output_path.stat().st_size / (1024 * 1024)
    rel = output_path.relative_to(ROOT) if output_path.is_relative_to(ROOT) else output_path
    print(f"✓ wrote {rel} ({size_mb:.1f} MB)")
    print("  → re-run audio_qa.py on the mastered file to verify LUFS lands on target:")
    print(f"    python3 tools/narration/audio_qa.py --wav {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
