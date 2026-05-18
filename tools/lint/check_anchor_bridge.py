#!/usr/bin/env python3
"""
check_anchor_bridge.py — script-audit lens for the Johnny Harris discipline.

Every analytical beat needs an identifiable visual ANCHOR (footage,
archival, AI-gen scene, map, chart, framework diagram) that the
narration BRIDGES between — not a wall of typography cards. When a
beat is mostly KineticTypography (text overlays), the viewer is
reading the same words twice (spoken + written), which reduces the
"this is real" credibility signal that anchor-bridge editing supplies.

This lens classifies each beat's visual cells by tag, computes the
typographic ratio (text-heavy / total), and flags two failure modes:

  🟡 wall of typography — > 60% text-heavy cells AND no concrete
     anchor cell (footage, archival, AI-gen scene, scene block,
     specific MG template like DataChart / FrameworkDiagram / Map).
     Editorially: viewer is reading what they're hearing; bridge into
     a concrete visual.

  🔴 no anchor at all — zero anchor cells in a beat with substantial
     narration (≥ 100 words). The beat is delivered entirely through
     text on screen.

The doctrine source: Johnny Harris's published process (Medium /
podcast interviews) — real-footage "anchors" carry the editorial
weight; narration "bridges" between them. The Parallax adaptation
relaxes "real footage" to include any concrete visual evidence
(framework diagram, data chart, map, AI-gen scene) — the editorial
intent is the same.

Usage:
    python3 tools/lint/check_anchor_bridge.py <slug>
    python3 tools/lint/check_anchor_bridge.py <slug> --script <path>
    python3 tools/lint/check_anchor_bridge.py <slug> --stdout
    python3 tools/lint/check_anchor_bridge.py <slug> --json
    python3 tools/lint/check_anchor_bridge.py <slug> --strict
        # exit 1 on warnings as well as errors

Exit codes:
    0 — every beat has at least one anchor (or only warns under --no-strict)
    1 — at least one beat has no anchor (red), or --strict with warnings
    2 — usage error / script not found
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "narration"))
import format_for_reading as ffr  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# ── Tunables ─────────────────────────────────────────────────────────────────

TYPOGRAPHIC_RATIO_THRESHOLD = 0.6   # >60% text-heavy = "wall of typography"
NO_ANCHOR_MIN_WORD_COUNT = 100      # below this, missing-anchor is just a short beat

# ── Cell classification ─────────────────────────────────────────────────────

# Anchor tags — visual cells that supply concrete-evidence weight.
ANCHOR_TAGS = {
    "FOOTAGE",      # real-world capture (anchor)
    "ARCHIVAL",     # historical photo / document (anchor)
    "AI-GEN",       # constructivist scene (figurative anchor)
    "SCENE",        # chained morph scene (sustained anchor)
    "FORECAST",     # probability gauge — visual data, concrete
}

# Templates that count as anchors when wrapped in [MG:].
ANCHOR_MG_TEMPLATES = {
    "FrameworkDiagram", "DataChart", "GameBoard", "TimeSeriesChart",
    "ChoroplethMap", "ProportionalSymbolMap", "ArcDiagram", "BumpChart",
    "BeeswarmChart", "DumbbellChart", "DuelingChart", "EscalationLadder",
    "HorizontalTimeline", "NetworkDiagram", "Sankey", "Marimekko",
    "TernaryPlot", "Tilegram", "Cartogram", "AnnotatedImage",
    "SplitComposition",   # diagram comparison — concrete
    "RouteMap", "AtlasMap",
}

# Templates explicitly text-heavy — count toward typographic ratio.
TEXT_HEAVY_MG_TEMPLATES = {
    "KineticTypography", "Quote", "Definition", "TitleTransition",
    "StatCaption", "QuoteAttribution", "DefinitionReveal",
}


@dataclass
class VisualCell:
    """One visual cell from the production column."""

    tag: str             # primary tag: MG / FOOTAGE / AI-GEN / etc.
    template: str        # template name if [MG:], else empty
    raw: str             # raw text of the cell (truncated)
    is_anchor: bool
    is_text_heavy: bool


@dataclass
class BeatVisualReport:
    beat_number: int
    beat_title: str
    word_count: int               # narration word count for this beat
    cells: list[VisualCell] = field(default_factory=list)

    @property
    def total_cells(self) -> int:
        return len(self.cells)

    @property
    def anchor_count(self) -> int:
        return sum(1 for c in self.cells if c.is_anchor)

    @property
    def text_heavy_count(self) -> int:
        return sum(1 for c in self.cells if c.is_text_heavy)

    @property
    def typographic_ratio(self) -> float:
        if self.total_cells == 0:
            return 0.0
        return self.text_heavy_count / self.total_cells


@dataclass
class Finding:
    level: str       # "ok" | "warn" | "error"
    beat_number: int
    message: str


@dataclass
class AnchorBridgeReport:
    slug: str
    script_path: str
    beats: list[BeatVisualReport] = field(default_factory=list)
    findings: list[Finding] = field(default_factory=list)

    @property
    def errors(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "error"]

    @property
    def warnings(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "warn"]


# ── Parsing the visual column ───────────────────────────────────────────────


# Match a leading [TAG:] or [TAG] at the start of the cell, capturing the
# tag name (without brackets, without trailing colon).
_TAG_RE = re.compile(r"\[([A-Z][A-Z-]*)\s*[:|\]]", re.IGNORECASE)
# After the tag, look for the first PascalCase template name. In the real
# Parallax script format, [MG:] (closing bracket immediately) is followed
# by a template name after whitespace, e.g. `[MG:] KineticTypography — ...`
# so we cannot anchor at start of post_tag. The first PascalCase token
# wins; subsequent PascalCase words in a cell description (e.g. proper
# nouns) lose to the template that appears first.
_TEMPLATE_RE = re.compile(r"\b([A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)*)\b")


def classify_cell(raw: str) -> Optional[VisualCell]:
    """Parse one visual-column cell. Returns None for cells that aren't
    visual specs (PACE: lines, DIR: continuation lines, etc.)."""
    stripped = raw.strip()
    if not stripped:
        return None
    # Skip pure-direction lines and PACE annotations — they don't add a cell.
    if re.match(r"^(DIR:|PACE:|EMOTIONAL:|CAMERA:|FRAMES:|HERO|continuation)", stripped, re.IGNORECASE):
        return None
    # Skip TRANSITION cells (structural, not anchor/text classification)
    if "TRANSITION" in stripped[:30].upper():
        return None

    tag_match = _TAG_RE.search(stripped)
    if not tag_match:
        return None
    tag = tag_match.group(1).upper()

    template = ""
    # For [MG:], try to find the template name right after the tag.
    if tag == "MG":
        post_tag = stripped[tag_match.end():]
        tmpl_match = _TEMPLATE_RE.search(post_tag)
        if tmpl_match:
            template = tmpl_match.group(1)

    is_anchor = False
    is_text_heavy = False

    if tag in ANCHOR_TAGS:
        is_anchor = True
    elif tag == "MG":
        if template in ANCHOR_MG_TEMPLATES:
            is_anchor = True
        elif template in TEXT_HEAVY_MG_TEMPLATES:
            is_text_heavy = True
        else:
            # Unknown MG template — neutral (neither anchor nor text-heavy).
            # Counting unknowns as text-heavy used to silently penalize any
            # script that adopted a brand-new template; neutral is the safer
            # default and surfaces via the "template not classified" register
            # if we later want to add a warning.
            pass
    elif tag == "LAYERED":
        # LAYERED is footage/MG plus a typography overlay — it carries both
        # anchor evidence AND text density. Treat as neutral (similar to
        # ILLUST) so it neither pads the typographic ratio nor counts as a
        # full anchor. Heuristic refinement opportunity if we later want to
        # parse the inner tags.
        pass
    elif tag == "ILLUST":
        # ILLUST is atmospheric background — neither anchor nor text-heavy
        # (it carries mood, not content)
        pass

    return VisualCell(
        tag=tag, template=template, raw=stripped[:120], is_anchor=is_anchor,
        is_text_heavy=is_text_heavy,
    )


def parse_visual_cells(script_path: Path) -> list[BeatVisualReport]:
    """Walk the script's table rows. For each beat, collect classified
    visual cells. Returns one BeatVisualReport per beat."""
    # Re-use format_for_reading's parser to get beats with narration word counts
    beats = ffr.parse_script(script_path)
    beat_reports = {
        b.number: BeatVisualReport(
            beat_number=b.number, beat_title=b.title,
            word_count=b.word_count,
        )
        for b in beats
    }

    # Walk the raw script for table rows; assign visual cells to the
    # current beat by tracking beat headers.
    current_beat: Optional[int] = None
    inside_table = False

    for raw_line in script_path.read_text(encoding="utf-8").splitlines():
        # Beat header
        bh = ffr.BEAT_HEADER_RE.match(raw_line)
        if bh:
            current_beat = int(bh.group(1))
            inside_table = False
            continue
        # Stop at asset summary
        if ffr.ASSET_SUMMARY_HEADER_RE.match(raw_line):
            break
        if current_beat is None:
            continue

        cells = ffr._split_table_row(raw_line)
        if cells is None:
            inside_table = False
            continue
        if ffr._is_table_separator(raw_line):
            continue
        if ffr._is_narration_header(cells):
            inside_table = True
            continue
        if not inside_table:
            continue
        # Visual cell lives in column [1]; column [0] is narration
        if len(cells) < 2:
            continue
        visual_cell = classify_cell(cells[1])
        if visual_cell is None:
            continue
        beat_reports[current_beat].cells.append(visual_cell)

    return list(beat_reports.values())


# ── Lint logic ──────────────────────────────────────────────────────────────


def lint_beats(beat_reports: list[BeatVisualReport]) -> list[Finding]:
    """Apply the anchor-bridge doctrine. Returns findings (ok/warn/error)."""
    findings: list[Finding] = []
    for b in beat_reports:
        # Skip beats with zero visual cells (transitions-only beats, etc.)
        if b.total_cells == 0:
            continue

        if b.anchor_count == 0 and b.word_count >= NO_ANCHOR_MIN_WORD_COUNT:
            findings.append(Finding(
                "error", b.beat_number,
                f"Beat {b.beat_number} '{b.beat_title}' has NO anchor visuals "
                f"({b.word_count} words narration, "
                f"{b.text_heavy_count}/{b.total_cells} text-heavy cells). "
                f"Add at least one concrete visual (footage / archival / AI-gen scene / "
                f"data chart / framework diagram / map) so the narration has something "
                f"to bridge between."
            ))
            continue

        if b.typographic_ratio > TYPOGRAPHIC_RATIO_THRESHOLD and b.anchor_count <= 1:
            findings.append(Finding(
                "warn", b.beat_number,
                f"Beat {b.beat_number} '{b.beat_title}' is "
                f"{int(b.typographic_ratio * 100)}% text-heavy "
                f"({b.text_heavy_count}/{b.total_cells} typography-style cells, "
                f"{b.anchor_count} anchor). Viewer is reading the same words "
                f"they're hearing — consider breaking up with archival / AI-gen / "
                f"data-chart cells that supply concrete evidence."
            ))
            continue

        findings.append(Finding(
            "ok", b.beat_number,
            f"Beat {b.beat_number}: {b.anchor_count} anchor(s), "
            f"{b.text_heavy_count} text-heavy ({int(b.typographic_ratio * 100)}% typographic)."
        ))

    return findings


# ── Rendering ───────────────────────────────────────────────────────────────


_ICON = {"ok": "🟢", "warn": "🟡", "error": "🔴"}


def render_report_md(report: AnchorBridgeReport) -> str:
    lines: list[str] = [
        f"# Anchor-Bridge Audit — {report.slug}",
        "",
        f"_Doctrine source: Johnny Harris's anchor-bridge editorial method. "
        f"Every analytical beat needs at least one concrete visual ANCHOR "
        f"(footage / archival / AI-gen scene / data chart / framework diagram / "
        f"map) for the narration to BRIDGE between. Walls of typography "
        f"(>60% text-heavy cells with no anchor) reduce the credibility "
        f"signal that real evidence supplies._",
        "",
        f"**Results:** {len(report.errors)} 🔴 error · "
        f"{len(report.warnings)} 🟡 warn · "
        f"{sum(1 for f in report.findings if f.level == 'ok')} 🟢 ok",
        "",
        "## Per-beat breakdown",
        "",
        "| Beat | Title | Words | Anchors | Text-heavy | Typographic % | Verdict |",
        "|---|---|---|---|---|---|---|",
    ]
    for b in report.beats:
        finding = next((f for f in report.findings if f.beat_number == b.beat_number), None)
        icon = _ICON.get(finding.level, "·") if finding else "—"
        verdict = f"{icon} {finding.level.upper()}" if finding else "— (no visual cells)"
        lines.append(
            f"| {b.beat_number} | _{b.beat_title[:35]}_ | {b.word_count} | "
            f"{b.anchor_count} | {b.text_heavy_count} | "
            f"{int(b.typographic_ratio * 100)}% | {verdict} |"
        )
    lines.append("")

    # Detail per finding
    if report.errors or report.warnings:
        lines.append("## Findings")
        lines.append("")
        for f in report.findings:
            if f.level == "ok":
                continue
            icon = _ICON.get(f.level, "·")
            lines.append(f"### {icon} Beat {f.beat_number}")
            lines.append("")
            lines.append(f.message)
            lines.append("")

    lines.extend([
        "---",
        "",
        "_Run: `python3 tools/lint/check_anchor_bridge.py "
        f"{report.slug}`_",
    ])
    return "\n".join(lines) + "\n"


# ── Top-level ───────────────────────────────────────────────────────────────


def run_audit(slug: str, script_path: Path) -> AnchorBridgeReport:
    """Full audit pipeline."""
    beats = parse_visual_cells(script_path)
    findings = lint_beats(beats)
    return AnchorBridgeReport(
        slug=slug, script_path=str(script_path),
        beats=beats, findings=findings,
    )


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path.")
    parser.add_argument(
        "--strict", action="store_true",
        help="Exit 1 on warnings as well as errors.",
    )
    parser.add_argument("-o", "--output", help="Output path (default: stdout).")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of markdown.")
    args = parser.parse_args()

    if args.script:
        script_path = Path(args.script).resolve()
    else:
        script_path = ffr.find_script(args.slug)
        if script_path is None or not script_path.is_file():
            print(f"✗ no script found for {args.slug}", file=sys.stderr)
            return 2

    report = run_audit(args.slug, script_path)

    if args.json:
        payload = {
            "slug": report.slug, "script_path": report.script_path,
            "beats": [asdict(b) for b in report.beats],
            "findings": [asdict(f) for f in report.findings],
        }
        out = json.dumps(payload, indent=2)
    else:
        out = render_report_md(report)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    if report.errors:
        return 1
    if args.strict and report.warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
