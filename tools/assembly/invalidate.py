#!/usr/bin/env python3
"""
invalidate.py — manifest-aware staleness reporter.

When any layer of the Parallax pipeline changes (script, narration WAV,
template data, palette, concepts) — downstream artifacts can quietly
become stale. The operator's mental model has to hold the whole
dependency graph: "I edited Beat 3 narration, which means the precise-
mode manifest needs regen, which means the AI-gen clip for the framework
reveal will drift by 200ms."

Kurzgesagt has documented animations cancelled mid-production because
of this failure mode. No commercial tool solves it. This is the
Parallax pipeline's structural advantage: the dependency graph is
declarative (tools/assembly/dependency-graph.json), the diff walker
is automated (this tool), and the result is a complete stale-artifact
report with exact regen commands.

Usage:
    # Compare working tree to HEAD (uncommitted changes)
    python3 tools/assembly/invalidate.py

    # Compare two refs
    python3 tools/assembly/invalidate.py --from=HEAD~3 --to=HEAD
    python3 tools/assembly/invalidate.py --from=v5-final --to=HEAD

    # Compare a single file's history
    python3 tools/assembly/invalidate.py --paths episodes/prisoners-dilemma/script-production.md

    # Filter the report to one episode
    python3 tools/assembly/invalidate.py --episode=prisoners-dilemma

    # JSON output for downstream tooling
    python3 tools/assembly/invalidate.py --json

Default behavior: compare working-tree (including untracked but
.gitignore-respected) against HEAD. The most common operator
workflow is "I just made some edits — what's now stale?"

Exit codes:
    0 — no stale artifacts identified (or --soft)
    1 — at least one high-confidence stale artifact identified
    2 — usage error / git missing / dependency graph not loadable
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from status_emoji import ERROR, OK, WARN  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _invalidation_core as ic  # noqa: E402

ROOT = get_project_root()
DEFAULT_GRAPH_PATH = ROOT / "tools" / "assembly" / "dependency-graph.json"


# ── Git diff helpers ────────────────────────────────────────────────────────


def _ensure_git() -> None:
    if shutil.which("git") is None:
        print("✗ git not on PATH", file=sys.stderr)
        sys.exit(2)


def git_diff_paths(from_ref: str | None, to_ref: str | None) -> list[str]:
    """Return changed paths between two refs.

    Modes:
      · from_ref=None, to_ref=None  → working tree vs HEAD (uncommitted),
                                       INCLUDING untracked-but-not-.gitignored
                                       files (the most common operator
                                       workflow: "I just dropped a new
                                       visual-spec.md, what's now stale?")
      · from_ref=X,   to_ref=None  → X to working tree
      · from_ref=X,   to_ref=Y     → X..Y
      · from_ref=None, to_ref=Y    → HEAD..Y

    Trailing `--` separator on git invocations locks argument parsing so
    a malicious ref can't masquerade as a path/option.
    """
    _ensure_git()
    if from_ref is None and to_ref is None:
        # Tracked changes vs HEAD
        cmd = ["git", "diff", "--name-only", "HEAD", "--"]
    elif to_ref is None:
        cmd = ["git", "diff", "--name-only", from_ref, "--"]
    else:
        base = from_ref or "HEAD"
        cmd = ["git", "diff", "--name-only", f"{base}..{to_ref}", "--"]

    try:
        result = subprocess.run(
            cmd, cwd=ROOT, capture_output=True, text=True, check=False,
        )
    except FileNotFoundError:
        print("✗ git invocation failed", file=sys.stderr)
        sys.exit(2)

    if result.returncode != 0:
        print(f"✗ git diff failed: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(2)

    paths = [p for p in result.stdout.splitlines() if p.strip()]

    # In working-tree mode also include untracked-but-not-ignored files.
    # `git diff` only sees tracked changes; the most common operator
    # workflow is dropping a NEW file into the tree (untracked) and asking
    # "what depends on this?" Without this, that workflow returns nothing.
    if from_ref is None and to_ref is None:
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            cwd=ROOT, capture_output=True, text=True, check=False,
        )
        if untracked.returncode == 0:
            paths.extend(p for p in untracked.stdout.splitlines() if p.strip())

    return paths


# ── Filtering ───────────────────────────────────────────────────────────────


def filter_invalidations_by_episode(
    invalidations: list[ic.Invalidation], episode_slug: str,
) -> list[ic.Invalidation]:
    """Keep only invalidations whose captured slug matches the given episode."""
    out: list[ic.Invalidation] = []
    for inv in invalidations:
        if inv.captured_vars.get("slug") == episode_slug:
            out.append(inv)
        elif not inv.captured_vars:
            # Cross-cutting changes (palette.json, concepts.json) — always
            # surfaced even with episode filter, because they may affect
            # the episode in question.
            out.append(inv)
    return out


# ── Rendering ───────────────────────────────────────────────────────────────


_CONFIDENCE_ICON = {"high": ERROR, "medium": WARN, "low": OK}


def render_report_md(
    invalidations: list[ic.Invalidation],
    changed_paths: list[str], from_ref: str | None, to_ref: str | None,
    episode_filter: str | None = None,
) -> str:
    """Render the staleness report as markdown — grouped by source path,
    with min-repro-set at the top + per-source detail."""
    lines: list[str] = [
        "# Pipeline Invalidation Report",
        "",
        f"**Diff:** `{_describe_diff(from_ref, to_ref)}`",
    ]
    if episode_filter:
        lines.append(f"**Filtered to episode:** `{episode_filter}`")
    lines.append("")

    if not invalidations:
        if changed_paths:
            lines.extend([
                "✓ No tracked dependencies invalidated.",
                "",
                f"_{len(changed_paths)} path(s) changed, but none matched dependency rules._",
                "",
            ])
        else:
            lines.append("✓ No changed paths — nothing to invalidate.")
            lines.append("")
        return "\n".join(lines) + "\n"

    # ── Min repro set ────────────────────────────────────────────────────
    min_set = ic.minimum_regen_commands(invalidations)
    high_conf_count = sum(1 for i in invalidations if i.rule.confidence == "high")
    other_conf_count = len(invalidations) - high_conf_count

    lines.extend([
        f"**{len(invalidations)} invalidation(s)** "
        f"({high_conf_count} {ERROR} high · {other_conf_count} {WARN}/{OK}) "
        f"across {len(changed_paths)} changed path(s).",
        "",
        "## Minimum reproduction set",
        "",
        f"Run these {len(min_set)} command(s) to refresh every stale artifact:",
        "",
        "```bash",
    ])
    for cmd in min_set:
        lines.append(cmd)
    lines.extend(["```", ""])

    # ── Per-source breakdown ────────────────────────────────────────────
    lines.append("## By source")
    lines.append("")

    by_source: dict[str, list[ic.Invalidation]] = defaultdict(list)
    for inv in invalidations:
        by_source[inv.source_path].append(inv)

    for source_path, invs in by_source.items():
        lines.append(f"### `{source_path}`")
        lines.append("")
        for inv in invs:
            icon = _CONFIDENCE_ICON.get(inv.rule.confidence, "·")
            confidence_label = inv.rule.confidence.upper()
            lines.append(f"{icon} **{confidence_label} confidence** — _{inv.rule.why}_")
            lines.append("")
            lines.append("| Stale artifact | Regen command |")
            lines.append("|---|---|")
            for artifact, regen in inv.stale_artifacts:
                lines.append(f"| `{artifact}` | `{regen}` |")
            lines.append("")

    lines.extend([
        "---",
        "",
        "## How to read this",
        "",
        f"- **{ERROR} high** confidence = the artifact is genuinely stale; regenerate.",
        f"- **{WARN} medium** = likely stale; review before regenerating.",
        f"- **{OK} low** = possibly stale; semantic dependency, operator decides.",
        "",
        "Patterns like `*.json` or `**/*.tsx` in stale-artifact paths mean ",
        "\"every file matching this pattern.\" The regen command may not ",
        "auto-resolve every match — operator may need to expand the wildcard.",
        "",
        "This report does NOT auto-regenerate anything. Run it before commits ",
        "(`pre-commit` is a good hook) and before recording sessions ",
        "(catch \"the manifest still references the old script\" before you ",
        "spend 20 minutes narrating to it).",
    ])
    return "\n".join(lines) + "\n"


def _describe_diff(from_ref: str | None, to_ref: str | None) -> str:
    if from_ref is None and to_ref is None:
        return "working tree vs HEAD"
    if to_ref is None:
        return f"{from_ref} vs working tree"
    base = from_ref or "HEAD"
    return f"{base}..{to_ref}"


def render_report_json(
    invalidations: list[ic.Invalidation], changed_paths: list[str],
    from_ref: str | None, to_ref: str | None,
) -> str:
    """JSON for downstream tooling."""
    payload = {
        "diff": _describe_diff(from_ref, to_ref),
        "changed_paths": changed_paths,
        "invalidation_count": len(invalidations),
        "minimum_regen_set": ic.minimum_regen_commands(invalidations),
        "invalidations": [
            {
                "source_path": inv.source_path,
                "rule": {
                    "source": inv.rule.source.pattern,
                    "why": inv.rule.why,
                    "confidence": inv.rule.confidence,
                },
                "captured_vars": inv.captured_vars,
                "stale_artifacts": [
                    {"artifact": artifact, "regen": regen}
                    for artifact, regen in inv.stale_artifacts
                ],
            }
            for inv in invalidations
        ],
    }
    return json.dumps(payload, indent=2)


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "--from", dest="from_ref",
        help="Git ref to diff FROM (default: HEAD).",
    )
    parser.add_argument(
        "--to", dest="to_ref",
        help="Git ref to diff TO (default: working tree).",
    )
    parser.add_argument(
        "--paths", nargs="+",
        help="Explicit list of paths to check (overrides git diff).",
    )
    parser.add_argument(
        "--episode", help="Filter to a single episode slug.",
    )
    parser.add_argument(
        "--graph", default=str(DEFAULT_GRAPH_PATH),
        help=f"Dependency graph JSON file (default: {DEFAULT_GRAPH_PATH.relative_to(ROOT)}).",
    )
    parser.add_argument("-o", "--output", help="Write to file instead of stdout.")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of markdown.")
    parser.add_argument(
        "--soft", "--no-fail", action="store_true", dest="soft",
        help="Always exit 0 — useful as an informational pre-commit hook. "
             "(`--no-fail` accepted as legacy alias for consistency with "
             "other tools' --soft convention.)",
    )
    args = parser.parse_args()

    # Load graph
    graph_path = Path(args.graph).resolve()
    if not graph_path.is_file():
        print(f"✗ dependency graph not found: {graph_path}", file=sys.stderr)
        return 2
    try:
        graph = ic.DependencyGraph.from_json_file(graph_path)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"✗ failed to load dependency graph: {e}", file=sys.stderr)
        return 2

    # Get changed paths
    if args.paths:
        changed_paths = args.paths
    else:
        changed_paths = git_diff_paths(args.from_ref, args.to_ref)

    # Find invalidations
    invalidations = ic.find_invalidations(changed_paths, graph)

    # Episode filter
    if args.episode:
        invalidations = filter_invalidations_by_episode(invalidations, args.episode)

    # Render
    if args.json:
        rendered = render_report_json(
            invalidations, changed_paths, args.from_ref, args.to_ref,
        )
    else:
        rendered = render_report_md(
            invalidations, changed_paths, args.from_ref, args.to_ref,
            episode_filter=args.episode,
        )

    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(rendered, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        print(f"✓ wrote {rel}")
        # One-line summary to stdout
        high = sum(1 for i in invalidations if i.rule.confidence == "high")
        print(f"  {len(invalidations)} invalidation(s); {high} {ERROR} high-confidence")
    else:
        sys.stdout.write(rendered)

    # Exit code
    if args.soft:
        return 0
    high_conf = sum(1 for i in invalidations if i.rule.confidence == "high")
    return 1 if high_conf > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
