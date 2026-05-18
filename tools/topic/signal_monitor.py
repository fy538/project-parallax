#!/usr/bin/env python3
"""
signal_monitor.py — poll a configured set of RSS / Atom sources and
emit a weekly signal digest for review.

The IDEAS.md Signal Watch List is currently maintained by hand from a
weekly scan of 5–7 sources (ForeignAffairs RSS, FT, Kalshi contract
activity, Google Trends, Metaculus, etc.). If the scan gets skipped,
the watch list goes stale and the topic pipeline weakens. This tool
automates the FETCH side — pulls each source, surfaces items posted
since the last run, and emits a markdown digest.

The tool is INTENTIONALLY read-only. It never writes to IDEAS.md
directly — the operator reviews the digest and decides which items
warrant promotion to the Signal Watch List. Auto-editing IDEAS.md
would risk corrupting hand-authored editorial context that the
parser has no model of.

State (which items have already been surfaced) is tracked in
`data/signal-watch-state.json` so re-runs only show new entries.

Configuration: `data/signal-sources.json` lists each source as
`{name, url, type ("rss" | "atom"), arc (optional hint)}`.

Usage:
    python3 tools/topic/signal_monitor.py
    python3 tools/topic/signal_monitor.py --since 2026-05-10
    python3 tools/topic/signal_monitor.py --config data/signal-sources.json
    python3 tools/topic/signal_monitor.py --json

Exit codes:
    0 — digest produced (may be empty if no new items)
    1 — one or more sources failed to fetch
    2 — usage / missing config
"""

from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Callable, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
DATA_DIR = ROOT / "data"
DEFAULT_CONFIG_PATH = DATA_DIR / "signal-sources.json"
DEFAULT_STATE_PATH = DATA_DIR / "signal-watch-state.json"

# ── Tunables ─────────────────────────────────────────────────────────────────

# How many days back to surface items when no prior state exists.
# Matches the weekly signal-monitoring cadence — 14d (the v1 default)
# meant the first-run digest carried 2× the review burden.
DEFAULT_LOOKBACK_DAYS = 7

# Network timeout per source — prevents one stuck feed from blocking
# the whole digest run.
FETCH_TIMEOUT_SEC = 15.0

# Cap the digest entries per source so a noisy feed doesn't drown the
# digest. The signal-watch operator's review budget is finite.
MAX_ITEMS_PER_SOURCE = 12


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class SignalItem:
    """One feed entry surfaced in the digest."""
    source: str                    # human-readable source name
    title: str
    url: str
    published_iso: str             # YYYY-MM-DD; empty if not parseable
    summary: str = ""              # first ~280 chars of description
    arc_hint: str = ""             # from config — optional arc tag


@dataclass
class SourceFetch:
    """One source's fetch outcome."""
    name: str
    url: str
    items: list[SignalItem] = field(default_factory=list)
    error: str = ""                # populated on fetch / parse failure


@dataclass
class DigestReport:
    """Top-level digest output."""
    generated_at: str
    since: str                     # ISO date — items newer than this
    new_item_count: int
    fetches: list[SourceFetch] = field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        return any(f.error for f in self.fetches)


# ── HTTP fetch (pluggable for tests) ───────────────────────────────────────


# Tests inject a fake fetcher so they don't hit the network.
HttpFetcher = Callable[[str], bytes]


def _http_fetch(url: str, timeout: float = FETCH_TIMEOUT_SEC) -> bytes:
    """Default real-network HTTP fetcher with a polite User-Agent.
    The Accept header tells modern CDNs (Substack, Cloudflare) to serve
    the RSS/Atom variant rather than a default HTML landing page."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Parallax-SignalMonitor/1.0 (+https://parallax.video)",
            "Accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.5",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


# ── RSS / Atom parsing (no third-party deps) ──────────────────────────────


# Match a few common date formats RSS / Atom feeds emit.
_DATE_FORMATS = (
    "%a, %d %b %Y %H:%M:%S %z",     # RFC 822 with TZ
    "%a, %d %b %Y %H:%M:%S %Z",     # RFC 822 with named TZ
    "%a, %d %b %Y %H:%M:%S",        # RFC 822 no TZ
    "%Y-%m-%dT%H:%M:%S%z",          # ISO 8601 with TZ
    "%Y-%m-%dT%H:%M:%SZ",           # ISO 8601 Zulu
    "%Y-%m-%dT%H:%M:%S",            # ISO 8601 no TZ
    "%Y-%m-%d",                     # bare ISO date
)


def _parse_date(raw: str) -> str:
    """Normalize various date formats to YYYY-MM-DD. Empty on failure."""
    if not raw:
        return ""
    s = raw.strip()
    for fmt in _DATE_FORMATS:
        try:
            dt = datetime.datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Last-ditch: extract the first YYYY-MM-DD substring
    m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", s)
    return m.group(1) if m else ""


def _strip_html(text: str) -> str:
    """Crude HTML-tag stripper for feed descriptions. Avoids html.parser
    dependency since RSS summaries are usually short + simple."""
    no_tags = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", no_tags).strip()


def parse_rss(xml_bytes: bytes, source_name: str, arc_hint: str = "") -> list[SignalItem]:
    """Parse an RSS 2.0 or Atom feed into SignalItems. Tolerant: skips
    malformed items rather than failing the whole feed."""
    items: list[SignalItem] = []
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return items

    # Strip Atom namespace if present so the same loop walks both formats.
    def _local(tag: str) -> str:
        return tag.split("}", 1)[-1] if "}" in tag else tag

    # RSS: <rss><channel><item>...
    # Atom: <feed><entry>...
    entry_paths = []
    for child in root.iter():
        if _local(child.tag) in ("item", "entry"):
            entry_paths.append(child)

    for entry in entry_paths:
        title = ""
        link = ""
        published = ""
        summary = ""
        for sub in entry:
            tag = _local(sub.tag)
            if tag == "title":
                title = (sub.text or "").strip()
            elif tag == "link":
                # Atom puts the URL in @href; RSS in .text
                link = sub.get("href") or (sub.text or "").strip()
            elif tag in ("pubDate", "published", "updated", "date"):
                if not published:
                    published = _parse_date(sub.text or "")
            elif tag in ("description", "summary", "content"):
                if not summary:
                    summary = _strip_html(sub.text or "")[:280]
        if not title and not link:
            continue
        items.append(SignalItem(
            source=source_name, title=title, url=link,
            published_iso=published, summary=summary, arc_hint=arc_hint,
        ))
    return items


# ── State + config ────────────────────────────────────────────────────────


def load_config(path: Path) -> list[dict]:
    """Load source-config JSON. Expected shape: [{name, url, arc?}, ...].
    Validates each entry has the required `name` and `url` keys, warning
    on entries that don't (still loaded so the operator sees them in
    the digest's error section)."""
    if not path.is_file():
        raise FileNotFoundError(f"signal-sources config not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"signal-sources config must be a JSON list, got {type(data).__name__}")
    for i, entry in enumerate(data):
        if not isinstance(entry, dict):
            raise ValueError(
                f"signal-sources entry {i} is not a dict: {entry!r}"
            )
        missing = [k for k in ("name", "url") if not entry.get(k)]
        if missing:
            print(
                f"⚠ signal_monitor: source entry {i} ({entry.get('name', '?')!r}) "
                f"missing required keys: {missing}",
                file=sys.stderr,
            )
    return data


def load_state(path: Path) -> dict:
    """Load the last-run state. Returns {} if missing or malformed."""
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_state(path: Path, state: dict) -> None:
    """Atomic write so a crash mid-write doesn't corrupt the state file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(state, indent=2), encoding="utf-8")
    tmp.replace(path)


# ── Top-level orchestrator ────────────────────────────────────────────────


def run_digest(
    config_path: Path = DEFAULT_CONFIG_PATH,
    state_path: Path = DEFAULT_STATE_PATH,
    since_override: Optional[str] = None,
    fetcher: HttpFetcher = _http_fetch,
    update_state: bool = True,
) -> DigestReport:
    """Full digest pipeline. Returns the report; writes state unless
    `update_state=False` (tests use this to avoid touching real state)."""
    sources = load_config(config_path)
    state = load_state(state_path)

    if since_override:
        since = since_override
    else:
        # Use the most recent prior run as the cutoff, else default lookback
        last_run = state.get("last_run", "")
        if last_run:
            since = last_run
        else:
            cutoff = datetime.date.today() - datetime.timedelta(days=DEFAULT_LOOKBACK_DAYS)
            since = cutoff.isoformat()

    fetches: list[SourceFetch] = []
    # Preserve insertion order so the FIFO cap (last N inserted) is
    # deterministic. Using `dict.fromkeys()` as an ordered set: O(1)
    # lookup + insertion-order preserved + automatic dedup.
    seen_urls_ordered: dict[str, None] = dict.fromkeys(
        state.get("seen_urls", []),
    )
    new_urls: list[str] = []

    for src in sources:
        name = src.get("name", "?")
        url = src.get("url", "")
        arc_hint = src.get("arc", "")
        sf = SourceFetch(name=name, url=url)
        if not url:
            sf.error = "config missing url"
            fetches.append(sf)
            continue
        try:
            xml_bytes = fetcher(url)
        except (urllib.error.URLError, OSError, TimeoutError) as e:
            sf.error = f"fetch failed: {type(e).__name__}: {e}"
            fetches.append(sf)
            continue
        items = parse_rss(xml_bytes, source_name=name, arc_hint=arc_hint)
        # Filter to items newer than `since` AND not previously seen
        keepers: list[SignalItem] = []
        for item in items:
            if item.url and item.url in seen_urls_ordered:
                continue
            if item.published_iso and item.published_iso < since:
                continue
            keepers.append(item)
            if item.url:
                new_urls.append(item.url)
            if len(keepers) >= MAX_ITEMS_PER_SOURCE:
                break
        sf.items = keepers
        fetches.append(sf)

    report = DigestReport(
        generated_at=datetime.date.today().isoformat(),
        since=since,
        new_item_count=sum(len(f.items) for f in fetches),
        fetches=fetches,
    )

    if update_state:
        # Merge new URLs into the ordered seen-set, then keep only the
        # MOST RECENT 2000 (FIFO trim by insertion order — was set-based
        # which dropped arbitrary entries on the first overflow).
        for u in new_urls:
            seen_urls_ordered.pop(u, None)  # move-to-end via re-insert
            seen_urls_ordered[u] = None
        combined = list(seen_urls_ordered.keys())[-2000:]
        # `--since` override is for retroactive scans; preserve the
        # prior last_run cursor so the next normal run picks up where it
        # left off. Without this guard, a one-time retroactive scan
        # would clobber forward progress.
        if since_override and state.get("last_run"):
            next_last_run = state["last_run"]
        else:
            next_last_run = report.generated_at
        save_state(state_path, {
            "last_run": next_last_run,
            "seen_urls": combined,
        })

    return report


# ── Rendering ──────────────────────────────────────────────────────────────


def render_digest_md(report: DigestReport) -> str:
    lines = [
        f"# Signal Digest — {report.generated_at}",
        "",
        f"_Items newer than **{report.since}** that haven't been surfaced "
        f"in a prior run. The operator reviews and promotes selected items "
        f"to `project/IDEAS.md` → Signal Watch List manually._",
        "",
        f"**Total new items:** {report.new_item_count} across "
        f"{len(report.fetches)} source(s)",
        "",
    ]
    if report.has_errors:
        lines.append("## ⚠ Fetch errors")
        lines.append("")
        for f in report.fetches:
            if f.error:
                lines.append(f"- **{f.name}** (`{f.url}`): {f.error}")
        lines.append("")

    if report.new_item_count == 0:
        lines.extend([
            "## ✅ Nothing new this cycle",
            "",
            "_No items posted since the last digest. Either the feeds are "
            "quiet or the cutoff (`--since`) is too recent. Try `--since "
            "2026-05-01` to widen the lookback._",
            "",
        ])

    for sf in report.fetches:
        if not sf.items:
            continue
        lines.append(f"## {sf.name}")
        lines.append("")
        for item in sf.items:
            date = item.published_iso or "?"
            arc = f" _(→ {item.arc_hint})_" if item.arc_hint else ""
            lines.append(f"- **{date}** — [{item.title}]({item.url}){arc}")
            if item.summary:
                lines.append(f"  > {item.summary}")
        lines.append("")

    lines.extend([
        "---",
        "",
        "_Run: `python3 tools/topic/signal_monitor.py`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description=next(
            (ln for ln in __doc__.splitlines() if ln.strip()),
            "Signal monitor.",
        ),
    )
    parser.add_argument(
        "--config", default=str(DEFAULT_CONFIG_PATH),
        help=f"Path to source config JSON (default {DEFAULT_CONFIG_PATH.relative_to(ROOT)}).",
    )
    parser.add_argument(
        "--state", default=str(DEFAULT_STATE_PATH),
        help=f"Path to state JSON (default {DEFAULT_STATE_PATH.relative_to(ROOT)}).",
    )
    parser.add_argument(
        "--since",
        help="ISO date cutoff (YYYY-MM-DD). Overrides last-run state.",
    )
    parser.add_argument(
        "--no-state-write", action="store_true",
        help="Don't update the state file (useful for previews).",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write to file.")
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    state_path = Path(args.state).resolve()

    try:
        report = run_digest(
            config_path=config_path,
            state_path=state_path,
            since_override=args.since,
            update_state=not args.no_state_write,
        )
    except (FileNotFoundError, ValueError) as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    if args.json:
        out = json.dumps({
            "generated_at": report.generated_at,
            "since": report.since,
            "new_item_count": report.new_item_count,
            "has_errors": report.has_errors,
            "fetches": [asdict(f) for f in report.fetches],
        }, indent=2)
    else:
        out = render_digest_md(report)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    return 1 if report.has_errors else 0


if __name__ == "__main__":
    sys.exit(main())
