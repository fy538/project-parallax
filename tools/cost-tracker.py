#!/usr/bin/env python3
"""
cost-tracker.py — read episodes/COST_LOG.md, aggregate spend per episode and service.

The ledger is hand-maintained markdown (so it's diff-able and reviewable in PRs).
This tool reads it and produces summaries.

Usage:
  python3 tools/cost-tracker.py summary
  python3 tools/cost-tracker.py summary --episode silicon-trap
  python3 tools/cost-tracker.py summary --service claude
  python3 tools/cost-tracker.py add --episode silicon-trap --service claude \
                                    --amount 12.50 --note "deep research, 3 passes"
"""

import argparse
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG_PATH = ROOT / "episodes" / "COST_LOG.md"

VALID_SERVICES = {
    "claude", "recraft", "pexels", "pixabay", "unsplash",
    "mapbox", "lambda", "kling", "sora", "runway", "other",
}

# Match a row: | YYYY-MM-DD | episode | service | 12.50 | note |
ROW_RE = re.compile(
    r"^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|\s*(\w+)\s*\|\s*([\d.]+)\s*\|\s*([^|]*?)\s*\|\s*$"
)


def parse_log() -> list[dict]:
    if not LOG_PATH.exists():
        print(f"Error: {LOG_PATH} not found", file=sys.stderr)
        sys.exit(1)
    rows = []
    for line in LOG_PATH.read_text(encoding="utf-8").splitlines():
        m = ROW_RE.match(line)
        if not m:
            continue
        d, ep, svc, amt, note = m.groups()
        # Skip system/init rows
        if ep.strip() in ("(system)", "episode"):
            continue
        try:
            amount = float(amt)
        except ValueError:
            continue
        rows.append({
            "date": d,
            "episode": ep.strip(),
            "service": svc.strip().lower(),
            "amount": amount,
            "note": note.strip(),
        })
    return rows


def cmd_summary(args):
    rows = parse_log()
    if args.episode:
        rows = [r for r in rows if r["episode"] == args.episode]
    if args.service:
        rows = [r for r in rows if r["service"] == args.service]
    if not rows:
        print("No matching entries.")
        return 0

    by_episode = defaultdict(float)
    by_service = defaultdict(float)
    total = 0.0
    for r in rows:
        by_episode[r["episode"]] += r["amount"]
        by_service[r["service"]] += r["amount"]
        total += r["amount"]

    print(f"\n{len(rows)} entries · ${total:.2f} total\n")
    print("By episode:")
    for ep, amt in sorted(by_episode.items(), key=lambda kv: -kv[1]):
        print(f"  {ep:24s}  ${amt:8.2f}")
    print("\nBy service:")
    for svc, amt in sorted(by_service.items(), key=lambda kv: -kv[1]):
        print(f"  {svc:12s}  ${amt:8.2f}")
    return 0


def cmd_add(args):
    if args.service not in VALID_SERVICES:
        print(
            f"Error: invalid service '{args.service}'. "
            f"Valid: {', '.join(sorted(VALID_SERVICES))}",
            file=sys.stderr,
        )
        return 1
    today = args.date or date.today().isoformat()
    new_row = (
        f"| {today} | {args.episode} | {args.service} | {args.amount:.2f} | {args.note} |"
    )
    text = LOG_PATH.read_text(encoding="utf-8")
    # Insert after the header row (the line starting with "| date" or right after the second --- separator)
    lines = text.splitlines()
    inserted = False
    for i, line in enumerate(lines):
        if line.startswith("|---|---|---|---|---|"):
            # Insert immediately after the separator
            lines.insert(i + 1, new_row)
            inserted = True
            break
    if not inserted:
        print(
            "Error: could not find ledger header in COST_LOG.md. "
            "Expected a row '|---|---|---|---|---|' separator.",
            file=sys.stderr,
        )
        return 1
    LOG_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"✓ Added: {new_row}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Parallax cost tracker.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_sum = sub.add_parser("summary", help="Aggregate spend by episode and service.")
    p_sum.add_argument("--episode", help="Filter to one episode.")
    p_sum.add_argument("--service", help="Filter to one service.")

    p_add = sub.add_parser("add", help="Append a new spend entry.")
    p_add.add_argument("--episode", required=True)
    p_add.add_argument("--service", required=True)
    p_add.add_argument("--amount", type=float, required=True)
    p_add.add_argument("--note", required=True)
    p_add.add_argument("--date", help="ISO date (default: today)")

    args = parser.parse_args()
    if args.cmd == "summary":
        return cmd_summary(args)
    elif args.cmd == "add":
        return cmd_add(args)
    return 1


if __name__ == "__main__":
    sys.exit(main())
