#!/usr/bin/env python3
"""
episode_watch.py — editorial AI pass over the assembled MP4.

`script-audit` audits the script. `visual-spec` audits individual
stills. `polish_lint` audits the manifest. But nothing in the
pipeline today watches the FINISHED VIDEO — so problems that only
emerge at assembly (pacing flatlines, visual register monotony,
missed callback opportunities, dead zones where nothing changes for
30s) ship undetected.

This tool wraps Twelve Labs' Pegasus 1.2 — a video-native LLM that
reasons over the full temporal arc with Marengo 3.0 multimodal
embeddings (visual + audio + OCR + conversation). It uploads the
rendered MP4, runs a structured Parallax-doctrine prompt, parses the
response into findings keyed to assembly-manifest segment IDs, and
emits an editorial report.

What it surfaces:
  · Pacing dead zones (visual register doesn't change for ≥ 25s)
  · Monotony stretches (consecutive segments of same template type)
  · Missed callbacks (concept introduced in early beat but not paid off)
  · Audio-visual desync (narration says X, visual shows Y)
  · Energy drops in the closing third

Cost (May 2026 pricing): ~$0.50 indexing + ~$0.30 per generate query
for a 13-min episode. Re-runs against the same `--video-id` skip the
indexing pass.

Usage:
    python3 tools/episode_watch/episode_watch.py <slug> --mp4 PATH
    python3 tools/episode_watch/episode_watch.py <slug> --video-id <id>
    python3 tools/episode_watch/episode_watch.py <slug> --mp4 PATH --dry-run

Set `TWELVELABS_API_KEY` env var for live API calls. `--dry-run`
prints the structured prompt that would be sent (no upload).

Exit codes:
    0 — report produced
    1 — material findings (≥ 1 🔴) AND --strict
    2 — usage / missing inputs / API key absent for non-dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from manifests import load_manifest as _shared_load_manifest  # noqa: E402
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"

# ── Tunables ─────────────────────────────────────────────────────────────────

TWELVELABS_API_BASE = "https://api.twelvelabs.io/v1.3"
DEFAULT_INDEX_ID = os.environ.get("TWELVELABS_INDEX_ID", "")

# Poll cadence for indexing-task status. Indexing a 13-min mp4 typically
# completes in 60-180s; polling every 10s is enough resolution without
# burning quota.
POLL_INTERVAL_SEC = 10.0
POLL_TIMEOUT_SEC = 900.0   # 15 min — generous for long episodes / queue depth

# Severity bands for findings.
SEVERITY_MATERIAL = "🔴"  # ships a meaningful flaw — fix before render
SEVERITY_NOTICEABLE = "🟡"  # worth reviewing — operator judgment
SEVERITY_OK = "🟢"

# Categorical finding types — the structured-output schema we ask
# Pegasus to fill. Each maps to a doctrine concern.
FINDING_CATEGORIES = (
    "pacing_dead_zone",
    "visual_monotony",
    "missed_callback",
    "av_desync",
    "energy_drop",
)


# ── Prompt construction ─────────────────────────────────────────────────────


def build_pegasus_prompt(
    slug: str, episode_title: str, beats: list[dict],
) -> str:
    """Render the editorial-review prompt Pegasus receives alongside
    the indexed video. The prompt names Parallax's doctrine explicitly
    so the LLM evaluates against the channel's signature form, not
    generic video-quality heuristics.
    """
    beat_lines = "\n".join(
        f"- Beat {i + 1} ({b.get('id', '?')}): "
        f"{b.get('title', '?')} — {float(b.get('startSec', 0)):.0f}s to "
        f"{float(b.get('endSec', 0)):.0f}s"
        for i, b in enumerate(beats)
    )
    return f"""You are a senior video editor reviewing an assembled Parallax episode for structural problems that only emerge in the finished video.

EPISODE: "{episode_title}" (slug: {slug})

BEAT STRUCTURE (timecodes from the assembly manifest):
{beat_lines or '(beats not provided)'}

PARALLAX EDITORIAL DOCTRINE — what to evaluate against:

1. PACING: Visual register must change at least every 25s in the body of the episode. Hold beats are intentional but a stretch of >25s with no visual transition is a "pacing dead zone."

2. VISUAL REGISTER VARIETY: The episode uses three registers — Analytical (charts/frameworks), Atmospheric (mood footage), Grounding (constructivist scenes). A run of >40s entirely in one register (e.g. four consecutive typography cards) is "monotony" worth flagging.

3. BOUNDED ANALOGY: Parallax's signature form is "this analogy is useful here, misleading there, dangerous if overextended." If you see an analogy or concept set up early but NOT named where it breaks, flag as a "missed callback."

4. AUDIO-VISUAL ALIGNMENT: Narration and visuals should reinforce, not contradict. If the narrator says "the chart on the right" but no chart appears, that's "av_desync."

5. CLOSING ENERGY: The final third of any Parallax episode should land — confidence + resolution. If energy flattens noticeably in the closing third (slow pacing + low visual variety), flag as "energy_drop."

OUTPUT FORMAT — return a JSON object with this exact shape:

{{
  "findings": [
    {{
      "category": "pacing_dead_zone" | "visual_monotony" | "missed_callback" | "av_desync" | "energy_drop",
      "severity": "🔴" | "🟡" | "🟢",
      "timecode_sec": <number — start of the issue, in seconds from episode start>,
      "duration_sec": <number — how long the issue persists>,
      "beat_number": <integer — which beat is affected>,
      "description": "<one-sentence operator-facing description>",
      "evidence": "<what you actually saw / heard in the video that triggered the finding>"
    }},
    ...
  ],
  "overall_verdict": "ready_to_publish" | "fix_then_publish" | "material_rework_needed",
  "rationale": "<one paragraph summarizing the strongest signals>"
}}

🔴 = material flaw, fix before publishing.
🟡 = worth reviewing, operator judgment.
🟢 = noted but not blocking.

If you find nothing material, return findings=[] and overall_verdict="ready_to_publish".
"""


# ── Data shapes ─────────────────────────────────────────────────────────────


@dataclass
class Finding:
    """One structural problem Pegasus surfaced."""
    category: str
    severity: str                  # 🔴 / 🟡 / 🟢
    timecode_sec: float
    duration_sec: float
    beat_number: int
    description: str
    evidence: str
    segment_id: str = ""           # filled in by map_findings_to_segments


@dataclass
class EpisodeWatchReport:
    slug: str
    episode_title: str
    video_id: str                  # Twelve Labs video ID
    findings: list[Finding] = field(default_factory=list)
    overall_verdict: str = ""
    rationale: str = ""
    prompt_used: str = ""

    @property
    def material(self) -> list[Finding]:
        return [f for f in self.findings if f.severity == SEVERITY_MATERIAL]

    @property
    def noticeable(self) -> list[Finding]:
        return [f for f in self.findings if f.severity == SEVERITY_NOTICEABLE]


# ── Pegasus response parsing ────────────────────────────────────────────────


def parse_pegasus_response(text: str) -> tuple[list[Finding], str, str]:
    """Pegasus returns a structured JSON object (per prompt). The LLM
    sometimes wraps it in markdown code fences (```json ... ```) or
    prepends a one-line summary; we tolerate both.

    Returns (findings, overall_verdict, rationale).
    """
    if not text:
        return [], "", ""
    # Strip markdown code fences if present
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    else:
        # Find the first { and last } for un-fenced JSON
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start:end + 1]
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return [], "", ""
    raw_findings = data.get("findings", []) or []
    findings: list[Finding] = []
    for f in raw_findings:
        # Tolerant: accept missing fields with safe defaults, skip
        # entries that don't even have a category.
        cat = f.get("category", "")
        if not cat:
            continue
        try:
            tc = float(f.get("timecode_sec", 0))
            dur = float(f.get("duration_sec", 0))
            beat = int(f.get("beat_number", 0))
        except (TypeError, ValueError):
            continue
        sev = f.get("severity", SEVERITY_NOTICEABLE)
        if sev not in (SEVERITY_MATERIAL, SEVERITY_NOTICEABLE, SEVERITY_OK):
            sev = SEVERITY_NOTICEABLE
        findings.append(Finding(
            category=cat, severity=sev,
            timecode_sec=tc, duration_sec=dur,
            beat_number=beat,
            description=str(f.get("description", "")),
            evidence=str(f.get("evidence", "")),
        ))
    return (
        findings,
        str(data.get("overall_verdict", "")),
        str(data.get("rationale", "")),
    )


def map_findings_to_segments(
    findings: list[Finding], manifest: dict,
) -> None:
    """Attach manifest segment_id to each finding in-place. Picks the
    segment whose [startSec, endSec] window contains the finding's
    timecode_sec."""
    segments = manifest.get("segments", []) or []
    for f in findings:
        for s in segments:
            start = float(s.get("startSec", 0))
            end = float(s.get("endSec", 0))
            if start <= f.timecode_sec < end:
                f.segment_id = s.get("id", "")
                break


# ── HTTP layer (pluggable for tests) ───────────────────────────────────────


HttpFn = Callable[[str, dict], bytes]


def _http_post_json(url: str, payload: dict, headers: dict) -> bytes:
    """Real-network POST with JSON body. Tests inject a fake instead."""
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def _http_get(url: str, headers: dict) -> bytes:
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


# ── Twelve Labs API wrappers ───────────────────────────────────────────────


def upload_video(
    mp4_path: Path, api_key: str, index_id: str,
    post_fn: HttpFn = _http_post_json,
    get_fn: Callable[[str, dict], bytes] = _http_get,
    poll_interval: float = POLL_INTERVAL_SEC,
    poll_timeout: float = POLL_TIMEOUT_SEC,
    sleep_fn: Callable[[float], None] = time.sleep,
) -> str:
    """Upload + index a video; poll until ready; return the video_id.

    Twelve Labs accepts video uploads via /tasks endpoint. Real
    multipart upload requires a different content type than our
    JSON-only helper, so this wrapper uses the `video_url`/`video_file`
    workflow they document. For simplicity here, we expect the operator
    to pass a public URL OR for tests to stub the whole upload.

    Raises RuntimeError on indexing failure or timeout.
    """
    headers = {"x-api-key": api_key}
    create_resp = post_fn(
        f"{TWELVELABS_API_BASE}/tasks",
        {"index_id": index_id, "video_file": str(mp4_path)},
        headers,
    )
    try:
        task = json.loads(create_resp)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"upload: malformed response: {e}") from e
    task_id = task.get("_id") or task.get("id")
    if not task_id:
        raise RuntimeError(f"upload: no task id in response: {task}")
    # Poll until ready / failed / timed out. Unknown statuses
    # (anything other than ready/failed/queued/processing/pending)
    # are tolerated up to MAX_UNKNOWN_STATUSES then surfaced as an
    # error — prevents an unexpected backend response from silently
    # consuming the full 15-min poll budget.
    MAX_UNKNOWN_STATUSES = 5
    KNOWN_PENDING = {"queued", "pending", "processing", "indexing", ""}
    unknown_count = 0
    deadline = time.monotonic() + poll_timeout
    while time.monotonic() < deadline:
        status_resp = get_fn(f"{TWELVELABS_API_BASE}/tasks/{task_id}", headers)
        try:
            status_data = json.loads(status_resp)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"poll: malformed response: {e}") from e
        status = status_data.get("status", "")
        if status == "ready":
            video_id = status_data.get("video_id") or status_data.get("_id")
            if not video_id:
                raise RuntimeError(f"task ready but no video_id: {status_data}")
            return video_id
        if status == "failed":
            raise RuntimeError(f"indexing failed: {status_data}")
        if status not in KNOWN_PENDING:
            unknown_count += 1
            if unknown_count >= MAX_UNKNOWN_STATUSES:
                raise RuntimeError(
                    f"indexing returned unknown status {status!r} "
                    f"{MAX_UNKNOWN_STATUSES} times in a row — aborting "
                    f"before poll timeout. Last response: {status_data}"
                )
        else:
            unknown_count = 0
        sleep_fn(poll_interval)
    raise RuntimeError(f"indexing did not complete in {poll_timeout}s")


def query_pegasus(
    video_id: str, prompt: str, api_key: str,
    post_fn: HttpFn = _http_post_json,
) -> str:
    """Send the structured prompt to Pegasus 1.2 against the indexed
    video. Returns the raw response text (caller parses)."""
    headers = {"x-api-key": api_key}
    resp_bytes = post_fn(
        f"{TWELVELABS_API_BASE}/generate",
        {"video_id": video_id, "prompt": prompt, "stream": False},
        headers,
    )
    try:
        data = json.loads(resp_bytes)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"pegasus: malformed response: {e}") from e
    return str(data.get("data", "") or data.get("text", ""))


# ── Top-level orchestration ────────────────────────────────────────────────


def _default_mp4_candidates(slug: str) -> list[Path]:
    """Where to look for an episode's rendered mp4 (matches the
    publish_state convention)."""
    ep = EPISODES_DIR / slug
    out: list[Path] = []
    for dirname in ("output", "render-output", "renders"):
        for p in (ep / dirname).glob("*.mp4") if (ep / dirname).is_dir() else []:
            out.append(p)
    return sorted(out, key=lambda p: -p.stat().st_size)


def _default_manifest_path(slug: str) -> Path:
    return REMOTION_DATA / slug / "assembly-manifest.json"


def load_manifest(path: Path) -> dict | None:
    """Delegates to tools/shared/manifests.load_manifest (May 2026 audit #6)."""
    return _shared_load_manifest(path)


def run_episode_watch(
    slug: str,
    mp4_path: Path | None = None,
    video_id: str | None = None,
    manifest_path: Path | None = None,
    api_key: str | None = None,
    index_id: str = DEFAULT_INDEX_ID,
    dry_run: bool = False,
    post_fn: HttpFn = _http_post_json,
    get_fn: Callable[[str, dict], bytes] = _http_get,
    sleep_fn: Callable[[float], None] = time.sleep,
) -> EpisodeWatchReport:
    """End-to-end. `dry_run` skips upload+query and returns a report
    with just the prompt (no findings)."""
    manifest = load_manifest(manifest_path) if manifest_path else None
    beats = (manifest or {}).get("beats", []) if manifest else []
    episode_title = (manifest or {}).get("title", slug)
    prompt = build_pegasus_prompt(slug, episode_title, beats)

    report = EpisodeWatchReport(
        slug=slug, episode_title=episode_title,
        video_id=video_id or "", prompt_used=prompt,
    )

    if dry_run:
        return report

    if not api_key:
        raise RuntimeError(
            "TWELVELABS_API_KEY env var required for live calls "
            "(or pass --dry-run)"
        )

    # Index the video if no video_id was provided
    if not video_id:
        if mp4_path is None:
            raise RuntimeError("either --mp4 or --video-id is required")
        if not index_id:
            raise RuntimeError(
                "TWELVELABS_INDEX_ID env var required (or pass --index-id) — "
                "set up an index at twelvelabs.io once, then re-use"
            )
        video_id = upload_video(
            mp4_path, api_key, index_id,
            post_fn=post_fn, get_fn=get_fn, sleep_fn=sleep_fn,
        )
        report.video_id = video_id

    response_text = query_pegasus(video_id, prompt, api_key, post_fn=post_fn)
    findings, verdict, rationale = parse_pegasus_response(response_text)
    if manifest:
        map_findings_to_segments(findings, manifest)
    report.findings = findings
    report.overall_verdict = verdict
    report.rationale = rationale
    return report


# ── Rendering ─────────────────────────────────────────────────────────────


def _fmt_mmss(sec: float) -> str:
    total = int(round(abs(sec)))
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def render_report_md(report: EpisodeWatchReport) -> str:
    lines = [
        f"# Episode Watch — {report.episode_title}",
        "",
        "_Editorial AI pass over the assembled MP4 via Twelve Labs "
        "Pegasus 1.2. Surfaces pacing dead zones, visual register "
        "monotony, missed callbacks, AV desync, and closing-third "
        "energy drops — problems that only emerge at assembly._",
        "",
        f"**Video ID:** `{report.video_id or '(dry-run, no video indexed)'}`",
        "",
    ]
    if report.overall_verdict:
        lines.extend([
            f"## Overall verdict: **{report.overall_verdict}**",
            "",
        ])
    if report.rationale:
        lines.extend([report.rationale, ""])

    if not report.findings:
        lines.extend([
            "## ✅ No findings",
            "",
            "_Either the assembly is clean or this is a dry-run preview "
            "(no API call was made). Re-run without `--dry-run` once "
            "the rendered MP4 is ready._",
            "",
        ])
    else:
        lines.append(
            f"**Findings:** {len(report.material)} 🔴  ·  "
            f"{len(report.noticeable)} 🟡  ·  "
            f"{len(report.findings)} total"
        )
        lines.append("")
        lines.append("| # | Severity | Category | Beat | Time | Description |")
        lines.append("|---|---|---|---|---|---|")
        for i, f in enumerate(report.findings, 1):
            lines.append(
                f"| {i} | {f.severity} | {f.category} | {f.beat_number} | "
                f"{_fmt_mmss(f.timecode_sec)} | {f.description[:60]} |"
            )
        lines.extend(["", "## Per-finding detail", ""])
        for i, f in enumerate(report.findings, 1):
            lines.extend([
                f"### {f.severity} Finding {i} — _{f.category}_",
                "",
                f"- **Beat:** {f.beat_number}"
                + (f" · segment `{f.segment_id}`" if f.segment_id else ""),
                f"- **Time:** {_fmt_mmss(f.timecode_sec)} "
                f"(+{f.duration_sec:.0f}s)",
                "",
                f"**Description:** {f.description}",
                "",
                f"**Evidence:** {f.evidence}",
                "",
            ])

    lines.extend([
        "---",
        "",
        f"_Run: `python3 tools/episode_watch/episode_watch.py {report.slug} "
        f"--video-id {report.video_id}`_" if report.video_id else
        f"_Run: `python3 tools/episode_watch/episode_watch.py {report.slug} "
        f"--mp4 PATH`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ───────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description=next(
            (ln for ln in __doc__.splitlines() if ln.strip()),
            "Episode watch.",
        ),
    )
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--mp4", help="Path to rendered MP4 (will be uploaded + indexed).")
    parser.add_argument(
        "--video-id",
        help="Reuse a previously-indexed video_id (skip upload).",
    )
    parser.add_argument(
        "--manifest",
        help="Explicit assembly manifest path (default: remotion-templates/.../assembly-manifest.json).",
    )
    parser.add_argument(
        "--index-id",
        help="Twelve Labs index ID (default: TWELVELABS_INDEX_ID env).",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print the structured prompt that would be sent to Pegasus, "
             "don't upload or query. No API key required.",
    )
    parser.add_argument(
        "--strict", action="store_true",
        help="Exit 1 if any 🔴 material findings are reported.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write to file.")
    args = parser.parse_args()

    api_key = os.environ.get("TWELVELABS_API_KEY", "")
    index_id = args.index_id or DEFAULT_INDEX_ID

    mp4_path: Path | None = None
    if args.mp4:
        mp4_path = Path(args.mp4).resolve()
        if not mp4_path.is_file():
            print(f"✗ MP4 not found: {mp4_path}", file=sys.stderr)
            return 2
    elif not args.video_id and not args.dry_run:
        # Auto-discover the largest mp4 in episodes/<slug>/output/
        candidates = _default_mp4_candidates(args.slug)
        if candidates:
            mp4_path = candidates[0]
        else:
            print(
                f"✗ no --mp4 / --video-id passed and no mp4 found under "
                f"episodes/{args.slug}/output/. Pass --dry-run to preview "
                f"the prompt without uploading.",
                file=sys.stderr,
            )
            return 2

    manifest_path = (
        Path(args.manifest).resolve() if args.manifest
        else _default_manifest_path(args.slug)
    )

    try:
        report = run_episode_watch(
            args.slug,
            mp4_path=mp4_path, video_id=args.video_id,
            manifest_path=manifest_path,
            api_key=api_key, index_id=index_id,
            dry_run=args.dry_run,
        )
    except RuntimeError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    if args.json:
        out = json.dumps({
            "slug": report.slug,
            "episode_title": report.episode_title,
            "video_id": report.video_id,
            "overall_verdict": report.overall_verdict,
            "rationale": report.rationale,
            "material_count": len(report.material),
            "noticeable_count": len(report.noticeable),
            "findings": [asdict(f) for f in report.findings],
            "prompt_used": report.prompt_used if args.dry_run else "",
        }, indent=2)
    else:
        if args.dry_run:
            # In dry-run mode the operator wants to see the prompt
            out = (
                "# Episode Watch (DRY RUN)\n\n"
                "_Below is the structured prompt that would be sent to "
                "Twelve Labs Pegasus 1.2 alongside the indexed video. "
                "Set TWELVELABS_API_KEY + TWELVELABS_INDEX_ID and re-run "
                "without --dry-run to get findings._\n\n"
                "## Prompt\n\n```\n"
                f"{report.prompt_used}"
                "\n```\n"
            )
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

    if args.strict and report.material:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
