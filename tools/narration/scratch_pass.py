#!/usr/bin/env python3
"""
scratch_pass.py — record a SCRATCH narration early (before visual-spec),
then run the manifest through Whisper-precise mode so downstream visual
production works against real narration timing instead of 150-wpm
estimates.

Wendover's discipline: record narration immediately after script lock,
treat the WAV as the timing manifest, build visuals to it. Versus our
default flow (visual-spec → record → re-derive precise timing →
potentially re-rework visuals), this is a structural improvement that
the SOTA research surfaced as one of the highest-leverage workflow
borrows from outside the channel.

What scratch_pass does:
  1. Verifies a scratch narration WAV exists (default:
     episodes/<slug>/assets/narration-scratch.wav; --wav overrides)
  2. Runs whisper_alignment.py to verify content + timing alignment
     against the script (catches "wrong file" / "huge drift" / etc.)
  3. Invokes generate_manifest.py --audio <scratch.wav> to promote
     the assembly manifest from estimate → precise mode
  4. Reports the drift between estimate and scratch-derived timing
     so the operator sees by how much (and where) the narration
     diverges from the 150-wpm assumption

Caveats:
  · The scratch WAV is NOT the final narration. Quality bar is "good
    enough for timing." Re-recording the final later runs the same
    flow with --wav narration.wav (default).
  · Whisper alignment may flag a few content discrepancies — for
    scratch passes, treat as informational; the goal is timing, not
    a clean read.

Usage:
    python3 tools/narration/scratch_pass.py <slug>
    python3 tools/narration/scratch_pass.py <slug> --wav <path>
    python3 tools/narration/scratch_pass.py <slug> --skip-alignment
    python3 tools/narration/scratch_pass.py <slug> --no-manifest
    python3 tools/narration/scratch_pass.py <slug> --output <report>

Exit codes:
    0 — scratch pass complete (manifest promoted to precise)
    1 — alignment quality issues or manifest generation failed
    2 — missing inputs (script, scratch WAV, etc.)
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402
import whisper_alignment as wa  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"

# Acceptable drift between scratch timing and 150-wpm estimate before
# we surface it as a finding worth examining. Below this band, scratch
# basically confirms the estimate; above, the visual-spec timing needs
# to be redone against the precise timing.
ACCEPTABLE_DRIFT_PCT = 5.0


@dataclass
class ScratchPassReport:
    """Outcome of one scratch-pass run."""

    slug: str
    scratch_wav_path: Path
    script_path: Path

    alignment_ran: bool = False
    alignment_pickup_count: int = 0
    alignment_minor_issues: int = 0

    manifest_promoted: bool = False
    manifest_path: Optional[Path] = None

    script_estimated_sec: float = 0.0     # at 150 wpm
    actual_runtime_sec: float = 0.0       # measured from scratch wav transcript
    drift_pct: float = 0.0                # actual vs estimate

    warnings: list[str] = field(default_factory=list)


# ── Helpers ──────────────────────────────────────────────────────────────────


def _default_scratch_wav(slug: str) -> Path:
    return EPISODES_DIR / slug / "assets" / "narration-scratch.wav"


def _default_manifest_path(slug: str) -> Path:
    return REMOTION_DATA / slug / "assembly-manifest.json"


def _drift_severity(pct: float) -> str:
    """Classify drift magnitude for the report."""
    if abs(pct) < ACCEPTABLE_DRIFT_PCT:
        return "🟢 within tolerance"
    if abs(pct) < ACCEPTABLE_DRIFT_PCT * 2:
        return "🟡 noticeable — visual-spec timing may need light touch-ups"
    return "🔴 material — visual-spec timing should be regenerated against precise mode"


# ── Pipeline steps ───────────────────────────────────────────────────────────


def run_alignment_pass(
    script_path: Path, scratch_wav: Path,
) -> tuple[wa.AlignmentReport, int, int]:
    """Run whisper_alignment.py against the scratch WAV. Returns (report,
    pickup_count, minor_issue_count)."""
    try:
        transcript = wa.transcribe_wav(scratch_wav)
    except (ImportError, RuntimeError, OSError) as e:
        # faster-whisper missing OR model load / WAV decode failed — fall
        # back to a side-by-side transcript JSON if one exists, otherwise
        # surface the underlying error so the caller can record it.
        transcript_path = scratch_wav.with_suffix(".json")
        if transcript_path.is_file():
            transcript = wa.load_transcript_from_json(transcript_path)
        else:
            raise RuntimeError(
                f"{type(e).__name__}: {e}\nNo {transcript_path.name} alongside "
                "the scratch WAV either. Provide one (pre-generated transcript) "
                "or install/repair faster-whisper."
            ) from e

    report = wa.run_alignment(script_path, transcript, low_conf_threshold=0.5)
    return report, len(report.pickup_candidates), len(report.minor_issues)


def run_manifest_promotion(
    slug: str, script_path: Path, scratch_wav: Path, manifest_out: Path,
) -> None:
    """Invoke generate_manifest.py --audio. Raises RuntimeError on failure."""
    manifest_out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        str(ROOT / "tools" / "assembly" / "generate_manifest.py"),
        "--script", str(script_path),
        "--episode", slug,
        "--audio", str(scratch_wav),
        "--output", str(manifest_out),
    ]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=ROOT, timeout=600,
        )
    except subprocess.TimeoutExpired as e:
        raise RuntimeError(
            f"generate_manifest.py timed out after 600s — Whisper likely "
            f"stalled on the scratch WAV. Inspect {scratch_wav} and re-record "
            f"if corrupt."
        ) from e
    if result.returncode != 0:
        raise RuntimeError(
            f"generate_manifest.py failed (exit {result.returncode}):\n"
            f"stdout: {result.stdout[-500:]}\n"
            f"stderr: {result.stderr[-500:]}"
        )


# ── Top-level orchestrator ──────────────────────────────────────────────────


def run_scratch_pass(
    slug: str, scratch_wav: Path,
    skip_alignment: bool = False, skip_manifest: bool = False,
    script_override: Optional[Path] = None,
) -> ScratchPassReport:
    """The full scratch-pass workflow as a pure function (returns the report)."""
    script_path = script_override or ffr.find_script(slug)
    if script_path is None or not script_path.is_file():
        raise FileNotFoundError(
            f"no production script found for {slug} "
            f"(expected episodes/{slug}/script-production.md)"
        )

    report = ScratchPassReport(
        slug=slug, scratch_wav_path=scratch_wav, script_path=script_path,
    )

    # Estimate based on script word count (150 wpm)
    beats = ffr.parse_script(script_path)
    total_words = sum(b.word_count for b in beats)
    report.script_estimated_sec = total_words / ffr.DEFAULT_WPM * 60

    # 1. Alignment pass
    if not skip_alignment:
        try:
            alignment_report, pickup_count, minor_count = run_alignment_pass(
                script_path, scratch_wav,
            )
            report.alignment_ran = True
            report.alignment_pickup_count = pickup_count
            report.alignment_minor_issues = minor_count
            report.actual_runtime_sec = alignment_report.transcript_duration_sec
            if pickup_count > 10:
                report.warnings.append(
                    f"{pickup_count} pickup candidates — high for a scratch take. "
                    "Run whisper_alignment.py separately for the full diff."
                )
        except (RuntimeError, FileNotFoundError) as e:
            report.warnings.append(f"alignment skipped: {e}")

    # 2. Drift calculation (needs actual runtime from alignment)
    if report.script_estimated_sec > 0 and report.actual_runtime_sec > 0:
        report.drift_pct = (
            (report.actual_runtime_sec - report.script_estimated_sec)
            / report.script_estimated_sec * 100
        )

    # 3. Manifest promotion
    if not skip_manifest:
        manifest_out = _default_manifest_path(slug)
        try:
            run_manifest_promotion(slug, script_path, scratch_wav, manifest_out)
            report.manifest_promoted = True
            report.manifest_path = manifest_out
        except RuntimeError as e:
            report.warnings.append(f"manifest promotion failed: {e}")

    return report


# ── Rendering ───────────────────────────────────────────────────────────────


def _fmt_mmss(sec: float) -> str:
    total = int(round(abs(sec)))
    return f"{total // 60}:{total % 60:02d}"


def render_report_md(r: ScratchPassReport) -> str:
    lines: list[str] = [
        f"# Scratch Pass — {r.slug}",
        "",
        f"**Scratch WAV:** `{r.scratch_wav_path}`",
        f"**Script:** `{r.script_path.relative_to(ROOT) if r.script_path.is_relative_to(ROOT) else r.script_path}`",
        "",
    ]

    if r.alignment_ran:
        lines.extend([
            "## Alignment",
            "",
            f"- Pickup candidates: **{r.alignment_pickup_count}** "
            f"(re-record opportunities — see `whisper_alignment.py` for the full diff)",
            f"- Minor issues: {r.alignment_minor_issues}",
            "",
        ])
    else:
        lines.extend(["## Alignment", "", "_Skipped._", ""])

    if r.alignment_ran and r.actual_runtime_sec > 0:
        lines.extend([
            "## Timing drift",
            "",
            f"- Script estimate at {ffr.DEFAULT_WPM} wpm: **{_fmt_mmss(r.script_estimated_sec)}**",
            f"- Scratch actual runtime: **{_fmt_mmss(r.actual_runtime_sec)}**",
            f"- Drift: **{r.drift_pct:+.1f}%** — {_drift_severity(r.drift_pct)}",
            "",
            "_If drift is material (≥ 10%), the visual-spec timing budgets that were "
            "set against the 150-wpm estimate will be off by the same proportion. "
            "Re-derive visual durations against the precise-mode manifest before "
            "rendering._",
            "",
        ])
    else:
        lines.extend([
            "## Timing drift",
            "",
            f"- Script estimate at {ffr.DEFAULT_WPM} wpm: **{_fmt_mmss(r.script_estimated_sec)}**",
            f"- Scratch actual runtime: _not measured (alignment skipped or unavailable)_",
            "",
        ])

    if r.manifest_promoted:
        rel = r.manifest_path.relative_to(ROOT) if (
            r.manifest_path and r.manifest_path.is_relative_to(ROOT)
        ) else r.manifest_path
        lines.extend([
            "## Manifest promoted to precise mode",
            "",
            f"✓ Updated `{rel}` with Whisper-aligned timestamps from the scratch WAV.",
            "",
        ])
    else:
        lines.extend([
            "## Manifest",
            "",
            "_Manifest promotion skipped (or failed — see warnings)._",
            "",
        ])

    if r.warnings:
        lines.append("## Warnings")
        lines.append("")
        for w in r.warnings:
            lines.append(f"- ⚠ {w}")
        lines.append("")

    lines.extend([
        "---",
        "",
        "## Workflow context",
        "",
        "Scratch-pass is the Wendover-borrowed discipline: record narration "
        "EARLY (right after script lock, before visual-spec finalizes timing) "
        "so downstream visual production works against real Whisper-aligned "
        "timestamps instead of 150-wpm estimates. Without this, late narration "
        "drift (which can be 10%+) forces visual-spec rework.",
        "",
        f"Next steps:",
        "1. If pickup count is high, refine the scratch take OR proceed knowing "
        "   the final recording will improve.",
        "2. Use the precise-mode manifest to inform visual-spec timing budgets.",
        "3. When the final narration is recorded, re-run with `--wav narration.wav` "
        "   (or just run `generate_manifest.py --audio` directly) to update the "
        "   manifest with the final timestamps.",
    ])
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument(
        "--wav",
        help="Path to scratch narration WAV (default: "
             "episodes/<slug>/assets/narration-scratch.wav).",
    )
    parser.add_argument("--script", help="Explicit script path (overrides slug auto-discovery).")
    parser.add_argument(
        "--skip-alignment", action="store_true",
        help="Skip the whisper_alignment step (e.g. if you've already run it separately).",
    )
    parser.add_argument(
        "--no-manifest", action="store_true",
        help="Run alignment only; don't promote the assembly manifest to precise mode.",
    )
    parser.add_argument("-o", "--output", help="Write the report to a file.")
    parser.add_argument("--stdout", action="store_true", help="Print report to stdout.")
    args = parser.parse_args()

    # Resolve scratch WAV
    scratch_wav = (
        Path(args.wav).resolve() if args.wav
        else _default_scratch_wav(args.slug)
    )
    if not scratch_wav.is_file():
        print(
            f"✗ scratch WAV not found: {scratch_wav}\n"
            f"  Expected at episodes/{args.slug}/assets/narration-scratch.wav, "
            f"or pass --wav <path>.",
            file=sys.stderr,
        )
        return 2

    script_override = Path(args.script).resolve() if args.script else None

    try:
        report = run_scratch_pass(
            args.slug, scratch_wav,
            skip_alignment=args.skip_alignment,
            skip_manifest=args.no_manifest,
            script_override=script_override,
        )
    except FileNotFoundError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    rendered = render_report_md(report)
    if args.stdout:
        sys.stdout.write(rendered)
    elif args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(rendered, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        print(f"✓ wrote {rel}")
    else:
        # Default: write to the episode dir
        out_path = EPISODES_DIR / args.slug / "scratch-pass-report.md"
        out_path.write_text(rendered, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        print(f"✓ wrote {rel}")
        print(f"  drift {report.drift_pct:+.1f}% · "
              f"{report.alignment_pickup_count} pickups · "
              f"manifest promoted: {report.manifest_promoted}")

    # Exit codes
    if report.warnings and not report.manifest_promoted:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
