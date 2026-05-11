#!/usr/bin/env python3
"""
One-page backdrop pick list from remotion-templates/data/backdrop-manifest.json.

Agents / humans filter by tag (e.g. dark-register) or tone prefix before choosing
[BACKDROP: id] for generate_manifest.py.

Examples:
  python tools/assembly/print_backdrop_catalog.py
  python tools/assembly/print_backdrop_catalog.py --dark-register
  python tools/assembly/print_backdrop_catalog.py --tag dark-register --tag grid
  python tools/assembly/print_backdrop_catalog.py --tone-prefix dark --markdown
  python tools/assembly/print_backdrop_catalog.py --chart-at-least high
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_TOOLS_SHARED = Path(__file__).resolve().parent.parent / "shared"
sys.path.insert(0, str(_TOOLS_SHARED))
from backdrop_manifest import (  # noqa: E402
    CHART_FIT_HINT,
    CHART_RANK,
    derive_chart_fit,
    passes_chart_at_least,
)


def _manifest_path() -> Path:
    return Path(__file__).resolve().parents[2] / "remotion-templates" / "data" / "backdrop-manifest.json"


def load_backdrops() -> list[dict[str, Any]]:
    path = _manifest_path()
    if not path.is_file():
        print(f"Backdrop manifest not found: {path}", file=sys.stderr)
        sys.exit(1)
    with path.open(encoding="utf-8") as f:
        payload = json.load(f)
    rows = payload.get("backdrops")
    if not isinstance(rows, list):
        print("Invalid backdrop-manifest.json: missing backdrops[]", file=sys.stderr)
        sys.exit(1)
    return rows


def passes_filters(
    row: dict[str, Any],
    *,
    require_tags: frozenset[str],
    tone_prefix: str | None,
) -> bool:
    tags_raw = row.get("tags") or []
    tags = frozenset(str(t).lower() for t in tags_raw if isinstance(t, str))
    if require_tags:
        if not require_tags <= tags:
            return False
    if tone_prefix:
        tone = row.get("tone")
        if not isinstance(tone, str) or not tone.lower().startswith(tone_prefix.lower()):
            return False
    return True


def format_plain(rows: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for row in rows:
        bid = row.get("id", "?")
        tone = row.get("tone", "")
        anchor = row.get("anchor", "")
        variant = row.get("variant", "")
        density = row.get("density", "")
        cf = derive_chart_fit(row)
        tags = row.get("tags") or []
        tag_s = ", ".join(tags) if isinstance(tags, list) else ""
        brief = row.get("selectionBrief", "")
        lines.append(f"{bid}")
        lines.append(
            f"  tone={tone}  anchor={anchor}  variant={variant}  density={density}  chartFit={cf}",
        )
        lines.append(f"  foreground: {CHART_FIT_HINT[cf]}")
        if tag_s:
            lines.append(f"  tags: {tag_s}")
        lines.append(f"  {brief}")
        lines.append(f"  script: [BACKDROP: {bid}]")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def format_markdown(rows: list[dict[str, Any]]) -> str:
    chunks: list[str] = []
    for row in rows:
        bid = row.get("id", "?")
        tone = row.get("tone", "")
        anchor = row.get("anchor", "")
        variant = row.get("variant", "")
        density = row.get("density", "")
        cf = derive_chart_fit(row)
        tags = row.get("tags") or []
        tag_s = ", ".join(tags) if isinstance(tags, list) else ""
        brief = row.get("selectionBrief", "")
        chunks.append(f"### `{bid}`\n")
        meta = (
            f"**tone** {tone} · **anchor** {anchor} · **variant** {variant} · "
            f"**density** {density} · **chartFit** {cf}"
        )
        chunks.append(meta + "\n\n")
        chunks.append(f"*foreground:* {CHART_FIT_HINT[cf]}\n\n")
        if tag_s:
            chunks.append(f"*tags:* {tag_s}\n\n")
        chunks.append(f"{brief}\n\n")
        chunks.append(f"`[BACKDROP: {bid}]`\n\n")
    return "".join(chunks).rstrip() + "\n"


def format_json(rows: list[dict[str, Any]]) -> str:
    enriched = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        copy = dict(row)
        copy["chartFitResolved"] = derive_chart_fit(row)
        enriched.append(copy)
    return json.dumps({"backdrops": enriched}, indent=2, ensure_ascii=False) + "\n"


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Print backdrop catalog pick list.")
    parser.add_argument(
        "--tag",
        action="append",
        default=[],
        metavar="TAG",
        help="Require TAG in backdrop tags (repeatable; all required).",
    )
    parser.add_argument(
        "--dark-register",
        action="store_true",
        help='Shorthand for --tag dark-register.',
    )
    parser.add_argument(
        "--tone-prefix",
        metavar="PREFIX",
        help="Keep backdrops whose tone starts with PREFIX (case-insensitive), e.g. dark",
    )
    parser.add_argument(
        "--markdown",
        action="store_true",
        help="Emit Markdown instead of plain text.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        dest="as_json",
        help="Emit JSON (filtered rows only).",
    )
    parser.add_argument(
        "--chart-at-least",
        metavar="LEVEL",
        choices=("low", "medium", "high"),
        help=(
            "Keep backdrops whose resolved chartFit supports at least this foreground "
            "complexity (low ⊂ medium ⊂ high)."
        ),
    )
    args = parser.parse_args(argv)

    require: set[str] = {t.strip().lower() for t in args.tag if t.strip()}
    if args.dark_register:
        require.add("dark-register")

    filtered = [
        row
        for row in load_backdrops()
        if isinstance(row, dict)
        and passes_filters(row, require_tags=frozenset(require), tone_prefix=args.tone_prefix)
        and passes_chart_at_least(row, args.chart_at_least)
    ]

    if args.as_json:
        sys.stdout.write(format_json(filtered))
    elif args.markdown:
        sys.stdout.write(format_markdown(filtered))
    else:
        sys.stdout.write(format_plain(filtered))


if __name__ == "__main__":
    main()
