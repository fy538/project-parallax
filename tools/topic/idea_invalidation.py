#!/usr/bin/env python3
"""
idea_invalidation.py — weekly cull of stale topics in project/IDEAS.md.

MKBHD's "video board" discipline: persistent in-flight + queued topics
get killed the moment a competitor covers the angle well, or the angle
decays. Active pruning, not just a backlog. Parallax's existing
invalidation engine handles ASSET drift (this manifest references a
deleted file); this tool handles TOPIC drift (this incubating idea
just got covered by someone with 2M subscribers).

What the tool does:
  1. Parses `project/IDEAS.md` for both the Signal Watch List and the
     per-arc topic tables.
  2. Computes a freshness verdict per topic from the "Last Checked"
     date column: 🟢 fresh (< 30d), 🟡 review (30-90d), 🔴 stale (≥ 90d).
  3. For each topic, generates a YouTube search URL the operator can
     click to scan for competing coverage. If the YOUTUBE_API_KEY env
     var is set, ALSO calls the YouTube Data API and surfaces the top
     3 hits (title + channel + view count + published date) so
     competitive coverage is visible at a glance.
  4. Emits a markdown digest grouped by freshness verdict. The
     operator reviews and decides: keep / kill / re-research.

Like signal_monitor, this tool is INTENTIONALLY read-only. It never
edits IDEAS.md — that's a doc with hand-authored editorial context
the parser has no model of. The operator updates the "Last Checked"
date manually after acting on the verdict.

Usage:
    python3 tools/topic/idea_invalidation.py
    python3 tools/topic/idea_invalidation.py --stale-only
    python3 tools/topic/idea_invalidation.py --json

Set YOUTUBE_API_KEY env var to enable competitive-coverage lookups.

Exit codes:
    0 — report produced
    1 — stale topics found AND --strict
    2 — usage / missing IDEAS.md
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
IDEAS_PATH = ROOT / "project" / "IDEAS.md"

# ── Tunables ─────────────────────────────────────────────────────────────────

# Days since "Last Checked" before the topic is flagged.
FRESH_DAYS = 30           # 🟢 below this
REVIEW_DAYS = 90          # 🟡 between FRESH and this; 🔴 above

YOUTUBE_SEARCH_URL = (
    "https://www.youtube.com/results?search_query={query}"
    "&sp=CAISBAgBEAE%3D"  # filter: this year + medium-length
)

YOUTUBE_API_SEARCH_URL = (
    "https://www.googleapis.com/youtube/v3/search?part=snippet"
    "&type=video&maxResults=3&order=relevance&q={query}&key={key}"
)
YOUTUBE_API_STATS_URL = (
    "https://www.googleapis.com/youtube/v3/videos?part=statistics"
    "&id={ids}&key={key}"
)

# Cap API timeout so a slow/broken Google response doesn't stall the
# whole digest.
API_TIMEOUT_SEC = 10.0

# Cap topics per digest section so the operator's review budget is finite.
MAX_TOPICS_PER_BUCKET = 30


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class CompetingVideo:
    """One YouTube search hit surfaced for an in-flight topic."""
    title: str
    channel: str
    url: str
    published_iso: str
    view_count: int = 0


# Sentinel string surfaced when the API call hit the daily quota cap
# (vs. a generic network/parse error). Lets the operator distinguish
# "wait 24h" from "fix your key".
QUOTA_EXCEEDED_MARKER = "quota_exceeded"


@dataclass
class TopicRow:
    """One topic extracted from IDEAS.md (Signal Watch or Arc table)."""
    title: str
    source_section: str           # "Signal Watch" | "Arc 1" | etc.
    state: str                    # raw state cell (e.g. "📡 SIGNAL")
    last_checked_iso: str         # YYYY-MM-DD or empty
    notes: str = ""               # last column / hook / etc.
    days_since_checked: int | None = None
    freshness_verdict: str = ""   # 🟢 / 🟡 / 🔴
    search_query: str = ""
    search_url: str = ""
    competing: list[CompetingVideo] = field(default_factory=list)
    competing_error: str = ""     # populated on API failure


@dataclass
class InvalidationReport:
    """Top-level digest."""
    generated_at: str
    ideas_path: str
    topics: list[TopicRow] = field(default_factory=list)

    @property
    def fresh(self) -> list[TopicRow]:
        return [t for t in self.topics if t.freshness_verdict == "🟢"]

    @property
    def review(self) -> list[TopicRow]:
        return [t for t in self.topics if t.freshness_verdict == "🟡"]

    @property
    def stale(self) -> list[TopicRow]:
        return [t for t in self.topics if t.freshness_verdict == "🔴"]


# ── IDEAS.md parsing ──────────────────────────────────────────────────────


# Match "## H2 heading" and "### H3 heading" for the section context.
_H2_RE = re.compile(r"^##\s+(.+?)\s*$")
_H3_RE = re.compile(r"^###\s+(.+?)\s*$")
# Markdown table separator like `|---|---|`
_TABLE_SEP_RE = re.compile(r"^\|[\s\-:|]+\|$")


def _split_row(line: str) -> list[str]:
    return [c.strip() for c in line.strip().strip("|").split("|")]


def _is_separator(line: str) -> bool:
    return bool(_TABLE_SEP_RE.match(line.strip()))


def _parse_iso_date(raw: str) -> str:
    """Accept 'May 3' / 'May 3, 2026' / '2026-05-03' / 'Apr 26' formats.
    Returns YYYY-MM-DD; empty if unparseable."""
    s = (raw or "").strip()
    if not s:
        return ""
    # Try canonical ISO first
    try:
        return datetime.date.fromisoformat(s).isoformat()
    except ValueError:
        pass
    # Try "May 3, 2026" / "May 3". For year-less formats we explicitly
    # append the current year before parsing — Python 3.15 will start
    # raising on year-less month-day formats (DeprecationWarning today).
    current_year = datetime.date.today().year
    for fmt_with_year in ("%b %d, %Y", "%B %d, %Y"):
        try:
            return datetime.datetime.strptime(s, fmt_with_year).date().isoformat()
        except ValueError:
            continue
    for fmt_no_year in ("%b %d", "%B %d"):
        try:
            return datetime.datetime.strptime(
                f"{s} {current_year}", f"{fmt_no_year} %Y",
            ).date().isoformat()
        except ValueError:
            continue
    # Substring fallback
    m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", s)
    return m.group(1) if m else ""


def parse_ideas(text: str) -> list[TopicRow]:
    """Walk IDEAS.md and extract topic rows from both the Signal Watch
    List table and each Active Arc table. Each table has a distinct
    column layout; we detect the header row to determine which columns
    map to title / state / last_checked / notes.

    Header detection: the row IMMEDIATELY followed by a separator
    (`|---|---|`) is the header. This avoids re-arming `in_table` on a
    data row whose first cell happens to be the literal string "state"
    or "signal" mid-table.
    """
    topics: list[TopicRow] = []
    current_h2 = ""
    current_h3 = ""
    in_table = False
    header_cols: list[str] = []
    section = ""
    # Look-ahead by iterating with index over splitlines
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        h2 = _H2_RE.match(line)
        if h2:
            current_h2 = h2.group(1)
            current_h3 = ""
            in_table = False
            section = current_h2
            i += 1
            continue
        h3 = _H3_RE.match(line)
        if h3:
            current_h3 = h3.group(1)
            in_table = False
            section = f"{current_h2} / {current_h3}" if current_h2 else current_h3
            i += 1
            continue
        if not line.lstrip().startswith("|"):
            in_table = False
            i += 1
            continue
        if _is_separator(line):
            i += 1
            continue
        cells = _split_row(line)
        if len(cells) < 3:
            i += 1
            continue
        # Detect header: this row + next row is a separator.
        next_line = lines[i + 1] if i + 1 < len(lines) else ""
        is_header_candidate = not in_table and _is_separator(next_line)
        if is_header_candidate:
            header_cols = [c.lower() for c in cells]
            # Warn if no recognized columns — table will parse to zero
            # topics, which is usually a sign of a renamed header.
            recognized = {"slug", "signal", "state", "last checked",
                          "first noticed", "working title", "notes"}
            if not (set(header_cols) & recognized):
                print(
                    f"⚠ idea_invalidation: table header in section "
                    f"'{section}' has no recognized columns ({header_cols}) — "
                    f"topics in this table will be skipped. Has the column "
                    f"convention changed?",
                    file=sys.stderr,
                )
            in_table = True
            i += 1
            continue
        if not in_table:
            i += 1
            continue
        # Map cells to fields based on column index in header_cols.
        # Use `col_idx` not `i` for the inner loop — `i` is the outer
        # while-loop counter and shadowing it would break iteration.
        title = ""
        state = ""
        last_checked = ""
        notes = ""

        for col_idx, h in enumerate(header_cols):
            if col_idx >= len(cells):
                break
            val = cells[col_idx]
            if h in ("slug", "signal") or h in ("working title",) and not title:
                title = val
            elif h == "state":
                state = val
            elif h == "last checked" or h in ("first noticed",) and not last_checked:
                last_checked = _parse_iso_date(val)
            elif h in ("notes", "thesis / hook", "thesis", "hook"):
                notes = val

        if title:
            topics.append(TopicRow(
                title=title, source_section=section, state=state,
                last_checked_iso=last_checked, notes=notes,
            ))
        i += 1
    return topics


# ── Freshness ──────────────────────────────────────────────────────────────


def compute_freshness(
    topic: TopicRow, today: datetime.date | None = None,
) -> None:
    """Set `days_since_checked` and `freshness_verdict` on the topic
    in-place. Skips items with no Last Checked date (verdict stays empty
    → those land in their own "no date" bucket in the render)."""
    if today is None:
        today = datetime.date.today()
    if not topic.last_checked_iso:
        topic.days_since_checked = None
        topic.freshness_verdict = "—"
        return
    try:
        checked = datetime.date.fromisoformat(topic.last_checked_iso)
    except ValueError:
        topic.days_since_checked = None
        topic.freshness_verdict = "—"
        return
    days = (today - checked).days
    topic.days_since_checked = days
    if days < FRESH_DAYS:
        topic.freshness_verdict = "🟢"
    elif days < REVIEW_DAYS:
        topic.freshness_verdict = "🟡"
    else:
        topic.freshness_verdict = "🔴"


# ── Search-query + URL ────────────────────────────────────────────────────


def build_search_query(topic: TopicRow) -> str:
    """Distill the topic's title + key noun phrases for a YouTube search.
    Keeps it short (avoids site:/quote noise that overfits)."""
    base = topic.title.strip()
    # Strip markdown link syntax `[label](url)` → keep just the label
    base = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", base)
    # Strip emoji/state markers that sometimes contaminate the title
    base = re.sub(r"[📡🔄✅🔬📋📺🎬🟢🟡🔴]", "", base).strip()
    # Strip leading "The" + "A " for cleaner search
    base = re.sub(r"^(The|A|An)\s+", "", base, flags=re.IGNORECASE)
    return base[:120]


def build_search_url(query: str) -> str:
    return YOUTUBE_SEARCH_URL.format(
        query=urllib.parse.quote_plus(query),
    )


# ── YouTube Data API (optional) ────────────────────────────────────────────


# Pluggable fetcher so tests don't hit the network.
HttpFetcher = Callable[[str], bytes]


def _http_fetch(url: str, timeout: float = API_TIMEOUT_SEC) -> bytes:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return resp.read()


def search_youtube_api(
    query: str, api_key: str, fetcher: HttpFetcher = _http_fetch,
) -> list[CompetingVideo]:
    """Hit the YouTube Data API for the top 3 hits. Returns [] on any
    API failure (rate limit / bad key / network error) so a flaky API
    doesn't kill the whole digest.

    Raises `RuntimeError(QUOTA_EXCEEDED_MARKER)` specifically when the
    response carries a `quotaExceeded` error reason — the caller catches
    this distinctly so the digest can surface "wait 24h" vs. a generic
    "API error" message.
    """
    search_url = YOUTUBE_API_SEARCH_URL.format(
        query=urllib.parse.quote_plus(query),
        key=urllib.parse.quote_plus(api_key),
    )
    try:
        raw = fetcher(search_url)
    except (urllib.error.URLError, OSError):
        return []
    try:
        search_data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    # Detect quota-exceeded distinctly so the operator knows to wait
    # vs. fix their key.
    err = search_data.get("error", {})
    if err:
        reasons = [
            e.get("reason", "") for e in err.get("errors", [])
        ]
        if "quotaExceeded" in reasons or "dailyLimitExceeded" in reasons:
            raise RuntimeError(QUOTA_EXCEEDED_MARKER)
        return []
    items = search_data.get("items", [])
    if not items:
        return []
    video_ids = [it["id"]["videoId"] for it in items if "videoId" in it.get("id", {})]
    # Stats lookup for view counts
    stats: dict[str, int] = {}
    if video_ids:
        stats_url = YOUTUBE_API_STATS_URL.format(
            ids=",".join(video_ids),
            key=urllib.parse.quote_plus(api_key),
        )
        try:
            stats_data = json.loads(fetcher(stats_url))
            for s in stats_data.get("items", []):
                stats[s["id"]] = int(s.get("statistics", {}).get("viewCount", 0))
        except (urllib.error.URLError, OSError, json.JSONDecodeError, KeyError, ValueError):
            pass
    out: list[CompetingVideo] = []
    for it in items:
        vid_id = it.get("id", {}).get("videoId", "")
        if not vid_id:
            continue
        sn = it.get("snippet", {})
        pub_raw = sn.get("publishedAt", "")
        # Truncate to date
        pub = pub_raw.split("T", 1)[0] if pub_raw else ""
        out.append(CompetingVideo(
            title=sn.get("title", ""),
            channel=sn.get("channelTitle", ""),
            url=f"https://www.youtube.com/watch?v={vid_id}",
            published_iso=pub,
            view_count=stats.get(vid_id, 0),
        ))
    return out


# ── Top-level ──────────────────────────────────────────────────────────────


def run_invalidation(
    ideas_path: Path = IDEAS_PATH,
    today: datetime.date | None = None,
    api_key: str | None = None,
    fetcher: HttpFetcher = _http_fetch,
    stale_only: bool = False,
) -> InvalidationReport:
    """Full pipeline. If `api_key` is None we skip the YouTube API call
    and emit only search URLs."""
    if not ideas_path.is_file():
        raise FileNotFoundError(f"IDEAS.md not found: {ideas_path}")
    text = ideas_path.read_text(encoding="utf-8")
    topics = parse_ideas(text)
    for t in topics:
        compute_freshness(t, today=today)
        t.search_query = build_search_query(t)
        t.search_url = build_search_url(t.search_query)
        if stale_only and t.freshness_verdict != "🔴":
            continue
        if api_key:
            try:
                t.competing = search_youtube_api(t.search_query, api_key, fetcher)
            except RuntimeError as e:
                if str(e) == QUOTA_EXCEEDED_MARKER:
                    # Stop API calls for the rest of this run — daily
                    # quota is shared across the digest, no point burning
                    # more attempts.
                    t.competing_error = (
                        "YouTube API daily quota exceeded — wait 24h, "
                        "or upgrade the project's quota at "
                        "console.cloud.google.com"
                    )
                    api_key = None  # stop further attempts this run
                else:
                    t.competing_error = f"{type(e).__name__}: {e}"
            except Exception as e:  # noqa: BLE001 — defensive boundary
                t.competing_error = f"{type(e).__name__}: {e}"
    if stale_only:
        topics = [t for t in topics if t.freshness_verdict == "🔴"]
    return InvalidationReport(
        generated_at=(today or datetime.date.today()).isoformat(),
        ideas_path=str(ideas_path),
        topics=topics,
    )


# ── Rendering ──────────────────────────────────────────────────────────────


def _format_views(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.0f}K"
    return str(n)


def render_invalidation_md(report: InvalidationReport) -> str:
    lines = [
        f"# Idea Invalidation Digest — {report.generated_at}",
        "",
        f"_Scanned `{report.ideas_path}`. Topics are flagged by "
        f"freshness verdict (🟢 < {FRESH_DAYS}d / 🟡 {FRESH_DAYS}-{REVIEW_DAYS}d "
        f"/ 🔴 ≥ {REVIEW_DAYS}d since last check). Click each search "
        f"URL to scan YouTube for competing coverage; decide keep / "
        f"kill / re-research, then update the **Last Checked** column "
        f"in IDEAS.md._",
        "",
        f"**Total topics tracked:** {len(report.topics)}  ·  "
        f"🟢 {len(report.fresh)}  ·  🟡 {len(report.review)}  ·  "
        f"🔴 {len(report.stale)}",
        "",
    ]
    for label, bucket, doctrine in (
        ("🔴 Stale — review NOW", report.stale,
         "Last checked ≥ 90 days ago. Highest-priority cull pass — competing coverage may have shipped."),
        ("🟡 Review soon", report.review,
         "Last checked 30-90 days ago. Schedule a re-check in this digest cycle."),
        ("🟢 Fresh", report.fresh,
         "Recently checked. No action required this cycle."),
    ):
        if not bucket:
            continue
        capped = bucket[:MAX_TOPICS_PER_BUCKET]
        lines.append(f"## {label} ({len(bucket)})")
        lines.append("")
        lines.append(f"_{doctrine}_")
        lines.append("")
        for t in capped:
            age = f"{t.days_since_checked}d ago" if t.days_since_checked is not None else "no date"
            lines.append(f"### {t.freshness_verdict} {t.title} — _{age}_")
            lines.append("")
            lines.append(f"- **Section:** {t.source_section}")
            if t.state:
                lines.append(f"- **State:** {t.state}")
            if t.last_checked_iso:
                lines.append(f"- **Last Checked:** {t.last_checked_iso}")
            lines.append(f"- **YouTube search:** [`{t.search_query}`]({t.search_url})")
            if t.competing:
                lines.append("")
                lines.append("**Competing coverage (top hits):**")
                for v in t.competing:
                    views = _format_views(v.view_count)
                    lines.append(
                        f"- [{v.title}]({v.url}) — _{v.channel}_, "
                        f"{v.published_iso}, {views} views"
                    )
            elif t.competing_error:
                lines.append(f"  ⚠ _API error: {t.competing_error}_")
            lines.append("")
        if len(bucket) > MAX_TOPICS_PER_BUCKET:
            lines.append(f"_… and {len(bucket) - MAX_TOPICS_PER_BUCKET} more._")
            lines.append("")
    lines.extend([
        "---",
        "",
        "_Run: `python3 tools/topic/idea_invalidation.py`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description=next(
            (ln for ln in __doc__.splitlines() if ln.strip()),
            "Idea invalidation digest.",
        ),
    )
    parser.add_argument("--ideas", default=str(IDEAS_PATH), help="Path to IDEAS.md.")
    parser.add_argument(
        "--stale-only", action="store_true",
        help="Only report 🔴 stale topics (skip 🟡 and 🟢).",
    )
    parser.add_argument(
        "--strict", action="store_true",
        help="Exit 1 if any 🔴 stale topics exist.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write to file.")
    parser.add_argument(
        "--quiet", action="store_true",
        help="Suppress informational stderr notes (e.g. the no-API-key note).",
    )
    args = parser.parse_args()

    api_key = os.environ.get("YOUTUBE_API_KEY")

    try:
        report = run_invalidation(
            ideas_path=Path(args.ideas).resolve(),
            api_key=api_key,
            stale_only=args.stale_only,
        )
    except FileNotFoundError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    if not api_key and not args.quiet:
        print(
            "ℹ no YOUTUBE_API_KEY env var set — competing-coverage lookups "
            "skipped. Each topic row includes a YouTube search URL the "
            "operator can click manually. (Pass --quiet to suppress.)",
            file=sys.stderr,
        )

    if args.json:
        out = json.dumps({
            "generated_at": report.generated_at,
            "ideas_path": report.ideas_path,
            "fresh_count": len(report.fresh),
            "review_count": len(report.review),
            "stale_count": len(report.stale),
            "topics": [asdict(t) for t in report.topics],
        }, indent=2)
    else:
        out = render_invalidation_md(report)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    if args.strict and report.stale:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
