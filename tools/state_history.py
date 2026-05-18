"""
state_history.py — append-only state-transition log per episode.

Pipeline-state.json tracks the CURRENT state + when it was entered. It
doesn't remember how an episode got there: "blockades-leak has been
INCUBATING for 60 days" is the same shape whether it spent all 60 days
there or bounced through RESEARCHING and back.

This module adds per-episode `_state-history.jsonl` — one JSON line per
transition, append-only. Lets the dashboard show a real timeline ("entered
RESEARCHING on May 2 → promoted to RESEARCH READY on May 5 → demoted back
on May 9 → currently RESEARCHING since"). Lets future analytics ask
"average days in DRAFTING across published episodes?"

File shape (one episode):
  episodes/<slug>/_state-history.jsonl
    {"date":"2026-03-18","from":null,"to":"INCUBATING","reason":"bootstrap"}
    {"date":"2026-05-02","from":"INCUBATING","to":"RESEARCH READY","reason":"v1 script + viability passed"}
    ...

Records that already exist on disk are never rewritten — append-only is
the audit trail. The bootstrap call (re-runnable) writes a single
synthetic entry from pipeline-state.json::stateEnteredAt if no history
exists, so existing episodes get a starting point.

Usage:
  · `python3 tools/state_history.py --bootstrap` — one-time backfill for
    every episode in pipeline-state.json, writing a single entry per
    episode from its current state + stateEnteredAt
  · `python3 tools/state_history.py --record <slug> <new-state> [reason]`
    — append a transition. Call this from sync_pipeline_state.py when
    state changes are detected.
"""

from __future__ import annotations

import argparse
import datetime
import json
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPISODES_DIR = ROOT / "episodes"
PIPELINE_STATE_JSON = EPISODES_DIR / "pipeline-state.json"


@dataclass
class StateTransition:
    """One row of an episode's _state-history.jsonl."""
    date: datetime.date
    from_state: str | None       # None for the bootstrap row
    to_state: str
    reason: str = ""

    @classmethod
    def from_jsonl(cls, line: str) -> StateTransition:
        obj = json.loads(line)
        return cls(
            date=datetime.date.fromisoformat(obj["date"]),
            from_state=obj.get("from"),
            to_state=obj["to"],
            reason=obj.get("reason", ""),
        )

    def to_jsonl(self) -> str:
        # Compact + stable ordering for line-diff friendliness
        return json.dumps(
            {
                "date": self.date.isoformat(),
                "from": self.from_state,
                "to": self.to_state,
                "reason": self.reason,
            },
            ensure_ascii=False,
        )


def history_path(slug: str) -> Path:
    return EPISODES_DIR / slug / "_state-history.jsonl"


def load_history(slug: str) -> list[StateTransition]:
    """Read all transitions for one episode, oldest first.
    Returns empty list if no history file exists."""
    p = history_path(slug)
    if not p.is_file():
        return []
    out: list[StateTransition] = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(StateTransition.from_jsonl(line))
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # One bad line shouldn't take down the whole history view.
            # Log to stderr but continue.
            print(
                f"state_history: skipping malformed row in {p}: {e}",
                file=sys.stderr,
            )
            continue
    return out


def append_transition(
    slug: str,
    to_state: str,
    *,
    from_state: str | None = None,
    date: datetime.date | None = None,
    reason: str = "",
) -> StateTransition:
    """Append one transition. If `from_state` not given, infers from the
    last entry in the history file (None on bootstrap)."""
    if from_state is None:
        existing = load_history(slug)
        from_state = existing[-1].to_state if existing else None
    t = StateTransition(
        date=date or datetime.date.today(),
        from_state=from_state,
        to_state=to_state,
        reason=reason,
    )
    p = history_path(slug)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as f:
        f.write(t.to_jsonl() + "\n")
    return t


def bootstrap_from_pipeline_state() -> list[tuple[str, bool]]:
    """One-time backfill: for every episode in pipeline-state.json that
    has no _state-history.jsonl, write a single entry from its current
    state + stateEnteredAt. Returns (slug, did_write) tuples.

    Re-runnable: episodes with existing history are skipped (no overwrite).
    The bootstrap row has from_state=None and reason='bootstrap'.
    """
    if not PIPELINE_STATE_JSON.is_file():
        return []
    data = json.loads(PIPELINE_STATE_JSON.read_text(encoding="utf-8"))
    results: list[tuple[str, bool]] = []
    for ep in data.get("episodes", []):
        slug = ep["slug"]
        existing = load_history(slug)
        if existing:
            results.append((slug, False))
            continue
        try:
            entered_at = datetime.date.fromisoformat(ep["stateEnteredAt"])
        except (KeyError, ValueError):
            results.append((slug, False))
            continue
        append_transition(
            slug,
            ep["state"],
            from_state=None,
            date=entered_at,
            reason="bootstrap from pipeline-state.json",
        )
        results.append((slug, True))
    return results


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Per-episode state-transition history (append-only).",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("bootstrap", help=(
        "Backfill _state-history.jsonl from current pipeline-state.json. "
        "Idempotent — skips episodes that already have history."
    ))

    p_record = sub.add_parser("record", help="Append one transition.")
    p_record.add_argument("slug")
    p_record.add_argument("to_state")
    p_record.add_argument("--from", dest="from_state", default=None,
                          help="Override the previous state (default: read from history file).")
    p_record.add_argument("--reason", default="", help="Free-text annotation.")
    p_record.add_argument("--date", default=None,
                          help="Override the transition date (ISO YYYY-MM-DD; default: today).")

    p_show = sub.add_parser("show", help="Print one episode's history to stdout.")
    p_show.add_argument("slug")

    args = parser.parse_args()

    if args.cmd == "bootstrap":
        results = bootstrap_from_pipeline_state()
        wrote = [s for s, did in results if did]
        skipped = [s for s, did in results if not did]
        if wrote:
            print(f"✓ wrote bootstrap entries for: {', '.join(wrote)}")
        if skipped:
            print(f"  (skipped — history already exists: {', '.join(skipped)})")
        if not results:
            print("✗ pipeline-state.json missing or empty", file=sys.stderr)
            return 2
        return 0

    if args.cmd == "record":
        date = datetime.date.fromisoformat(args.date) if args.date else None
        t = append_transition(
            args.slug,
            args.to_state,
            from_state=args.from_state,
            date=date,
            reason=args.reason,
        )
        print(f"✓ recorded {args.slug}: {t.from_state or '∅'} → {t.to_state} on {t.date}")
        return 0

    if args.cmd == "show":
        history = load_history(args.slug)
        if not history:
            print(f"No history for {args.slug} — run `state_history.py bootstrap` first.")
            return 0
        for t in history:
            from_str = t.from_state or "∅"
            reason = f"  ({t.reason})" if t.reason else ""
            print(f"  {t.date}  {from_str:<18} → {t.to_state}{reason}")
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
