#!/usr/bin/env python3
"""
check_visual_hook.py — verify every episode's viability.md articulates
its cold-open visual hook.

Borrows Veritasium's discipline: no topic crosses from INCUBATING to
VIABLE without a defensible cold-open visual concept on paper. The
most expensive failure mode in the pipeline is "script locked, visuals
don't land" — this lint defends against it by requiring the hook to be
documented at the viability stage.

Required sections in each `viability.md` (or `viability-check.md`):
  · `### 6. Cold Open Visual Hook` (or any heading matching "Cold Open Visual")
  · Within that section: a non-empty visual description
  · `**Visual sourcing estimate:** [Easy / Moderate / Hard / Speculative]`

Severity rules:
  · Episodes in state VIABLE or beyond (per pipeline-state.json) → ERROR if missing
  · Episodes in state INCUBATING → WARN if missing (visual may not be defined yet)
  · Episodes with no viability.md at all → ERROR (every episode should have one)

Usage:
    python3 tools/lint/check_visual_hook.py
    python3 tools/lint/check_visual_hook.py --episode prisoners-dilemma
    python3 tools/lint/check_visual_hook.py --strict     # warn-only becomes error
    python3 tools/lint/check_visual_hook.py --json
    python3 tools/lint/check_visual_hook.py --soft       # always exit 0 (informational)

Exit codes:
    0 — every episode passes (or only warns + not --strict)
    1 — at least one ERROR or (with --strict) WARN found
    2 — usage error / pipeline-state.json missing
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
PIPELINE_STATE_JSON = EPISODES_DIR / "pipeline-state.json"

# Episode states past which the visual hook is mandatory.
# Deliberately excludes PUBLISHED and RETROED — once an episode has shipped,
# erroring on a missing viability-stage visual-hook section is noise: the
# gate's purpose is "don't cross from INCUBATING → VIABLE without this,"
# not "retroactively block already-published episodes from passing lint."
# Operator can still backfill historical viability docs voluntarily.
MANDATORY_STATES = {"VIABLE", "RESEARCHING", "RESEARCH READY", "DRAFTING",
                    "RENDER READY", "IN POST"}

# Heading patterns recognized as the visual-hook section. Tolerant to
# numbering / wording variations so legacy docs that called it
# "Visual Hook" or "Cold Open" still pass.
_VISUAL_HOOK_HEADING_RE = re.compile(
    r"^#+\s*(?:\d+\.?\s*)?(?:Cold[\s-]?Open\s*Visual|Visual\s*Hook|"
    r"Cold[\s-]?Open\s*Hook|Visual\s*Hook\s*\(.*\))",
    re.IGNORECASE | re.MULTILINE,
)
# Required line within the visual-hook section. The verdict is one of
# the four canonical values. The colon may be inside or outside the
# `**bold**` markers — both `**Visual sourcing estimate:** Easy` (template
# form) and `**Visual sourcing estimate**: Easy` (markdown-renderer-
# variant form) are accepted. `\b` ensures a word boundary so an
# unbracketed verdict followed by newline still matches.
_SOURCING_ESTIMATE_RE = re.compile(
    r"\*\*Visual\s*sourcing\s*estimate:?\*\*\s*:?\s*"
    r"\[?\s*(Easy|Moderate|Hard|Speculative)\b",
    re.IGNORECASE,
)
# Detects the unfilled template (square brackets surrounding the verdict).
_TEMPLATE_PLACEHOLDER_RE = re.compile(
    r"\*\*Visual\s*sourcing\s*estimate:?\*\*\s*:?\s*"
    r"\[\s*Easy\s*/\s*Moderate\s*/\s*Hard\s*/\s*Speculative\s*\]",
    re.IGNORECASE,
)


@dataclass
class Finding:
    level: str           # "error" | "warn" | "ok"
    slug: str
    state: str
    message: str


@dataclass
class CheckResult:
    findings: list[Finding] = field(default_factory=list)

    @property
    def errors(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "error"]

    @property
    def warnings(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "warn"]


# ── Loading ─────────────────────────────────────────────────────────────────


def _load_pipeline_state() -> dict[str, str]:
    """Return {slug: state} from pipeline-state.json. Hard-fails on JSON
    parse errors — silently returning `{}` would make the lint vacuously
    pass for every episode, hiding real problems."""
    if not PIPELINE_STATE_JSON.is_file():
        return {}
    try:
        data = json.loads(PIPELINE_STATE_JSON.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(
            f"✗ {PIPELINE_STATE_JSON} failed to parse: {e}",
            file=sys.stderr,
        )
        sys.exit(2)
    return {e["slug"]: e["state"] for e in data.get("episodes", []) if "slug" in e}


def _find_viability_doc(ep_dir: Path) -> Path | None:
    """Episodes use either viability.md or viability-check.md — accept either."""
    for name in ("viability.md", "viability-check.md"):
        p = ep_dir / name
        if p.is_file():
            return p
    return None


# ── Check helpers ───────────────────────────────────────────────────────────


def _extract_visual_hook_section(text: str) -> str | None:
    """Locate the visual-hook section in viability.md text. Returns the
    section body (between the heading and the next same-or-higher level
    heading), or None if no visual-hook heading is found."""
    match = _VISUAL_HOOK_HEADING_RE.search(text)
    if match is None:
        return None
    start = match.end()
    # Find the next heading at the same level or higher. Use a generic
    # markdown heading regex — anything starting with one or more `#`.
    next_heading_re = re.compile(r"^#+\s+", re.MULTILINE)
    next_match = next_heading_re.search(text, pos=start)
    end = next_match.start() if next_match else len(text)
    return text[start:end].strip()


def check_visual_hook(text: str) -> tuple[bool, list[str]]:
    """Pure: given a viability.md body, return (passes, issues).

    Passes = True when both: visual-hook section present AND
    sourcing estimate line present AND non-template-placeholder.
    """
    section = _extract_visual_hook_section(text)
    issues: list[str] = []
    if section is None:
        issues.append(
            "no Cold Open Visual Hook section found "
            "(expected a heading like '### 6. Cold Open Visual Hook')"
        )
        return False, issues

    # Must contain a sourcing estimate verdict (not the unfilled template).
    if _TEMPLATE_PLACEHOLDER_RE.search(section):
        issues.append(
            "Visual sourcing estimate is still the template placeholder "
            "`[Easy / Moderate / Hard / Speculative]` — fill in one of those values"
        )
        return False, issues

    if not _SOURCING_ESTIMATE_RE.search(section):
        issues.append(
            "no Visual sourcing estimate found — must include "
            "`**Visual sourcing estimate:** Easy` (or Moderate/Hard/Speculative)"
        )
        return False, issues

    # Body must have a real description, not just the template scaffold.
    # Strip ALL markdown structural markers so the word count reflects
    # operator-supplied prose, not the bold question prompt, instructional
    # brackets, glossary bullets, or italic blockquote notes that ship
    # with the template. Without this, the unfilled template (which has
    # the bold question "What does the viewer SEE...?") clears the
    # 10-word floor on its own — the gate becomes a false-pass.
    clean = section
    # Drop the sourcing estimate line entirely (handled by the regex above)
    clean = re.sub(r"\*\*Visual\s*sourcing\s*estimate.*", "", clean, flags=re.IGNORECASE | re.DOTALL)
    # Drop any `**bold**` runs — covers the question prompt + glossary keys
    clean = re.sub(r"\*\*[^*]+\*\*", "", clean)
    # Drop any `_italic_` runs — covers blockquote-style instructional notes
    clean = re.sub(r"_[^_\n]+_", "", clean)
    # Drop bracketed instructions like `[1-3 sentences describing...]`
    clean = re.sub(r"\[[^\]]+\]", "", clean)
    # Drop any list items (the glossary bullets)
    clean = re.sub(r"^\s*[-*]\s+.*", "", clean, flags=re.MULTILINE)
    # Drop any leftover headings
    clean = re.sub(r"^\s*#+\s+.*", "", clean, flags=re.MULTILINE)
    word_count = sum(1 for w in clean.split() if any(c.isalpha() for c in w))
    if word_count < 10:
        issues.append(
            "visual hook description too thin (under 10 words of plain prose) — "
            "describe the concrete image the viewer sees, not just 'a hook'. "
            "The template's bold question prompt and instructional brackets "
            "don't count toward the threshold."
        )
        return False, issues

    return True, []


# ── Per-episode evaluation ──────────────────────────────────────────────────


def check_episode(slug: str, state: str) -> Finding:
    """Evaluate one episode's viability doc."""
    ep_dir = EPISODES_DIR / slug
    # Path-traversal hardening: an operator-supplied `--episode "../etc"`
    # would resolve outside EPISODES_DIR. Reject before reading anything.
    try:
        ep_dir_resolved = ep_dir.resolve(strict=False)
        if not str(ep_dir_resolved).startswith(str(EPISODES_DIR.resolve())):
            return Finding(
                "error", slug, state,
                f"invalid slug — path traversal rejected (resolved to {ep_dir_resolved})",
            )
    except (OSError, RuntimeError):
        return Finding("error", slug, state, "invalid slug — path resolution failed")
    if not ep_dir.is_dir():
        return Finding("error", slug, state, "episode directory missing")

    viability_path = _find_viability_doc(ep_dir)
    if viability_path is None:
        # No viability doc at all
        if state in MANDATORY_STATES:
            return Finding("error", slug, state,
                           "no viability.md or viability-check.md found")
        return Finding("warn", slug, state,
                       "no viability.md found (acceptable for INCUBATING)")

    text = viability_path.read_text(encoding="utf-8")
    passes, issues = check_visual_hook(text)
    if passes:
        return Finding("ok", slug, state, f"visual hook documented in {viability_path.name}")

    # Render the path relative to repo root for readability, but only if
    # the file actually lives under the repo (tests use tmp_path which
    # doesn't); otherwise show the absolute path.
    try:
        rel = viability_path.relative_to(ROOT)
        path_display = str(rel)
    except ValueError:
        path_display = str(viability_path)
    msg = "; ".join(issues) + f" (file: {path_display})"
    severity = "error" if state in MANDATORY_STATES else "warn"
    return Finding(severity, slug, state, msg)


def run_check(episode_filter: str | None = None) -> CheckResult:
    """Run the check across every episode in pipeline-state.json."""
    state_map = _load_pipeline_state()
    result = CheckResult()
    for slug, state in state_map.items():
        if episode_filter and slug != episode_filter:
            continue
        result.findings.append(check_episode(slug, state))
    return result


# ── Rendering ───────────────────────────────────────────────────────────────


_ICON = {"error": "🔴", "warn": "🟡", "ok": "🟢"}


def render_report_md(result: CheckResult) -> str:
    lines: list[str] = [
        "# Visual Hook Lint",
        "",
        "_Veritasium discipline: no topic crosses from INCUBATING → VIABLE without "
        "articulating its cold-open visual hook._",
        "",
        f"**Results:** {len(result.errors)} 🔴 error · "
        f"{len(result.warnings)} 🟡 warn · "
        f"{sum(1 for f in result.findings if f.level == 'ok')} 🟢 ok",
        "",
    ]
    if not result.findings:
        lines.append("_No episodes found in pipeline-state.json._")
        return "\n".join(lines) + "\n"

    lines.append("| Slug | State | Verdict | Detail |")
    lines.append("|---|---|---|---|")
    for f in result.findings:
        icon = _ICON.get(f.level, "·")
        lines.append(f"| `{f.slug}` | {f.state} | {icon} {f.level.upper()} | {f.message} |")
    lines.append("")
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--episode", help="Check a single episode by slug.")
    parser.add_argument(
        "--strict", action="store_true",
        help="Treat warnings as errors (upgrade WARN → ERROR for exit code).",
    )
    parser.add_argument(
        "--soft", action="store_true",
        help="Always exit 0 (informational). Useful as a soft pre-commit check.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of markdown.")
    args = parser.parse_args()

    if not PIPELINE_STATE_JSON.is_file():
        print(f"✗ pipeline-state.json not found at {PIPELINE_STATE_JSON}", file=sys.stderr)
        return 2

    result = run_check(episode_filter=args.episode)

    if args.json:
        payload = [
            {"slug": f.slug, "state": f.state, "level": f.level, "message": f.message}
            for f in result.findings
        ]
        sys.stdout.write(json.dumps(payload, indent=2))
        return 0

    sys.stdout.write(render_report_md(result))

    if args.soft:
        return 0
    if result.errors:
        return 1
    if args.strict and result.warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
