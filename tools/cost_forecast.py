#!/usr/bin/env python3
"""
cost_forecast.py — project pre-production spend before committing.

`cost_tracker.py` records what was SPENT (post-hoc ledger). This tool
projects what WILL be spent given the shot list + script + audio plan,
so the operator can see the cost picture before the AI-gen and
mastering credits start burning.

Inputs scanned:
  · `episodes/<slug>/shot-list.json`   — asset counts by type/priority
  · `episodes/<slug>/ai-gen-briefs.md` — count of AI-fallback shots
                                          (those without stock hits)
  · `episodes/<slug>/script-production.md` — word count → narration min
  · `remotion-templates/data/episodes/<slug>/assembly-manifest.json`
                                          — total runtime (optional)

Per-service rate doctrine (from `episodes/COST_LOG.md` Per-episode
targets table + published platform pricing as of May 2026):

  · Stock photo/video (Pexels/Pixabay/Wikimedia)  — $0  per asset
  · Recraft V3 still                              — $0.04  per image
  · Flux 2 Pro still                              — $0.045 per image
  · Pika (short still→video)                      — $0.30  per 5s clip
  · Kling 3.0 (still→video, Pro)                  — $0.50  per clip
  · Sora 2 (with ChatGPT Pro subscription)        — $0     incremental
  · Runway Gen-4 (mid-tier)                       — $0.40  per clip
  · Seedance 2.0 Fast                             — $0.022 per sec
  · Auphonic (mastering, $35/mo plan)             — $0.15  per minute
                                                    (free tier ≤2h/mo)
  · Claude (deep research / iterative scripting)  — $5–15 per episode
                                                    (variable)

Each rate has LOW / MID / HIGH bands. The MID is the proposer's best
single-number guess; LOW assumes everything routes to the cheapest
tool and Sora/Pixabay carry the load; HIGH assumes Kling for every
AI-video and Claude usage trends to the upper end of the range.

Usage:
    python3 tools/cost_forecast.py <slug>
    python3 tools/cost_forecast.py <slug> --ai-video-tool kling --json
    python3 tools/cost_forecast.py <slug> --compare-actual
        # Adds a row per service comparing forecast vs spend-to-date

Exit codes:
    0 — forecast produced
    1 — forecast exceeds --budget AND --strict
    2 — usage / missing inputs
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"
COST_LOG_PATH = EPISODES_DIR / "COST_LOG.md"

# ── Rate doctrine ───────────────────────────────────────────────────────────
# Each tuple is (low, mid, high) in USD. LOW/HIGH bands let the forecast
# show a realistic range, not a falsely precise single number.

RATES = {
    # Recraft V3 stills (per image). Same price across bands; the only
    # variation is how many iterations the prompt needs.
    "recraft_still": (0.04, 0.04, 0.06),
    # Flux 2 Pro stills via fal.ai.
    "flux_still":    (0.045, 0.045, 0.06),
    # Pika short still→video clip (5-8s).
    "pika_clip":     (0.20, 0.30, 0.50),
    # Kling 3.0 image-to-video on Pro plan.
    "kling_clip":    (0.50, 0.50, 1.00),
    # Sora 2 (included with ChatGPT Pro subscription — incremental $0).
    "sora_clip":     (0.0, 0.0, 0.0),
    # Runway Gen-4.
    "runway_clip":   (0.30, 0.40, 0.60),
    # Seedance 2.0 Fast tier per 6s clip ($0.022/sec).
    "seedance_clip": (0.10, 0.13, 0.18),
    # Auphonic mastering per minute (free up to 2h/mo on subscription).
    "auphonic_min":  (0.0, 0.15, 0.20),
    # Claude deep research + iterative scripting (per episode).
    "claude_episode": (5.0, 10.0, 15.0),
}

# Asset-type → default AI-video tool when promoted from stock.
# Operator can override with `--ai-video-tool {pika,kling,sora,runway,seedance}`.
DEFAULT_AI_VIDEO_TOOL = "kling"

AI_VIDEO_TOOL_RATE_KEY = {
    "pika": "pika_clip",
    "kling": "kling_clip",
    "sora": "sora_clip",
    "runway": "runway_clip",
    "seedance": "seedance_clip",
}

# Explicit map: service display label → COST_LOG service token. Used by
# render_forecast_md to pull spend-to-date per service. The substring
# match approach (v1) double-counted when two service labels shared a
# substring (e.g. future "Kling stills" + "Kling clips" both matched
# the `kling` ledger token).
SERVICE_LABEL_TO_LEDGER_KEY = {
    "Recraft stills": "recraft",
    "Flux stills": "flux",
    "Pika clips": "pika",
    "Kling clips": "kling",
    "Sora clips": "sora",
    "Runway clips": "runway",
    "Seedance clips": "seedance",
    "Auphonic mastering": "auphonic",
    "Claude (research + scripting)": "claude",
    # Stock has multiple ledger keys (pexels/pixabay/etc); sum them all.
    # Handled specially below since multiple keys → one display row.
}

# Narration WPM for word-count → runtime estimation (matches the
# rest of the pipeline's default).
DEFAULT_WPM = 150


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class ServiceForecast:
    """One service's projected spend. Actual spend (when --compare-actual
    is set) lives on the parent `CostForecast.actual_by_service` keyed
    by SERVICE_LABEL_TO_LEDGER_KEY, not on this dataclass."""
    service: str                     # human-readable label
    unit: str                        # "image" | "clip" | "minute" | "episode"
    units_projected: float
    low: float                       # USD low band
    mid: float                       # USD mid band
    high: float                      # USD high band
    note: str = ""


@dataclass
class CostForecast:
    slug: str
    services: list[ServiceForecast] = field(default_factory=list)
    actual_by_service: dict[str, float] = field(default_factory=dict)
    sources: dict[str, str] = field(default_factory=dict)  # which file informed each line

    @property
    def total_low(self) -> float:
        return round(sum(s.low for s in self.services), 2)

    @property
    def total_mid(self) -> float:
        return round(sum(s.mid for s in self.services), 2)

    @property
    def total_high(self) -> float:
        return round(sum(s.high for s in self.services), 2)

    @property
    def actual_total(self) -> float:
        return round(sum(self.actual_by_service.values()), 2)


# ── Input loaders ───────────────────────────────────────────────────────────


def load_shot_list(slug: str) -> Optional[dict]:
    path = EPISODES_DIR / slug / "shot-list.json"
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def load_assembly_manifest(slug: str) -> Optional[dict]:
    path = REMOTION_DATA / slug / "assembly-manifest.json"
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def count_ai_gen_briefs(slug: str) -> tuple[int, int]:
    """Count AI-fallback shots in ai-gen-briefs.md, split by intended
    tool. Each `## <asset-id>` heading is one shot. Returns
    (still_count, video_count) by reading the `Target tool:` line that
    `zerohit_fallback.py` writes for each brief.

    Priority is OPTIONAL — pre-fix the regex required `(P1|P2|P3)` and
    missed P4 / lowercase / missing-priority cases, silently
    under-projecting. Now matches any `## <id>` heading after the
    front-matter header line.
    """
    path = EPISODES_DIR / slug / "ai-gen-briefs.md"
    if not path.is_file():
        return 0, 0
    text = path.read_text(encoding="utf-8")
    still_count = 0
    video_count = 0
    # Walk top-level `## ` blocks, skipping the front-matter `# title`.
    blocks = re.split(r"^##\s+", text, flags=re.MULTILINE)[1:]
    for block in blocks:
        # The "Target tool: Recraft (still)" / "Target tool: Kling (image-to-video)"
        # / "Target tool: Flux 2 Pro (still)" line tells us the tool.
        # Default to still when the field is absent — most fallback
        # promotions are stills per `zerohit_fallback.py`'s default
        # routing.
        tool_match = re.search(
            r"\*\*Target tool\*\*:\s*([^\n(]+)\(([^)]+)\)",
            block,
        )
        if tool_match:
            kind = tool_match.group(2).strip().lower()
            if "video" in kind:
                video_count += 1
            else:
                still_count += 1
        else:
            still_count += 1
    return still_count, video_count


def find_script(slug: str) -> Optional[Path]:
    """Canonical script-production.md, then highest versioned."""
    ep_dir = EPISODES_DIR / slug
    canonical = ep_dir / "script-production.md"
    if canonical.is_file():
        return canonical
    versioned = sorted(ep_dir.glob("script-v*-production.md"))
    return versioned[-1] if versioned else None


# Curly-brace claim tags / production annotations: `{✅}`, `{verified}`,
# `{?:check}`, `{NEW}`, `{needs-source}`. Per the EDITORIAL_PLAYBOOK
# convention these are editorial metadata, not narration — they must
# not inflate the word count → Auphonic-minute projection.
_CLAIM_TAG_RE = re.compile(r"\{[^}]*\}")


def count_script_words(script_path: Path) -> int:
    """Coarse word count for the script. Counts narration-column words
    only by looking for two-column table rows — strips the visual
    column. Falls back to total word count if no tables found.

    Claim tags (`{✅}`, `{verified}`, etc.) are stripped before counting
    so they don't inflate the runtime → Auphonic projection.
    """
    text = script_path.read_text(encoding="utf-8")
    narration_words = 0
    table_rows = 0
    for line in text.splitlines():
        if not line.lstrip().startswith("|"):
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) < 2:
            continue
        # Skip header / separator rows
        if parts[0].upper() == "NARRATION":
            continue
        if all(re.fullmatch(r":?-{2,}:?", p) for p in parts):
            continue
        narration = _CLAIM_TAG_RE.sub("", parts[0])
        narration_words += len([w for w in narration.split() if any(c.isalpha() for c in w)])
        table_rows += 1
    if table_rows == 0:
        # Fallback for scripts not yet in table format
        cleaned = _CLAIM_TAG_RE.sub("", text)
        return sum(1 for w in cleaned.split() if any(c.isalpha() for c in w))
    return narration_words


# ── Forecast computation ───────────────────────────────────────────────────


def _band_sum(rate_key: str, units: float) -> tuple[float, float, float]:
    low, mid, high = RATES[rate_key]
    return round(low * units, 2), round(mid * units, 2), round(high * units, 2)


def forecast_stills(
    ai_image_count: int, tool: str = "recraft",
) -> ServiceForecast:
    """Recraft (default) or Flux still-image cost projection."""
    rate_key = "flux_still" if tool == "flux" else "recraft_still"
    low, mid, high = _band_sum(rate_key, ai_image_count)
    return ServiceForecast(
        service=f"{tool.capitalize()} stills",
        unit="image",
        units_projected=ai_image_count,
        low=low, mid=mid, high=high,
        note=(
            f"~{ai_image_count} AI stills × ${RATES[rate_key][1]:.3f} each. "
            f"Default routes to Recraft V3; use --still-tool flux for the "
            f"realism cases."
        ),
    )


def forecast_ai_video(
    ai_video_count: int, tool: str = DEFAULT_AI_VIDEO_TOOL,
) -> ServiceForecast:
    """AI-video clip cost projection. Tool defaults to Kling per
    GENERATION_WORKFLOW.md; --ai-video-tool override changes the rate."""
    if tool not in AI_VIDEO_TOOL_RATE_KEY:
        raise ValueError(
            f"Unknown ai-video tool '{tool}' — expected one of "
            f"{sorted(AI_VIDEO_TOOL_RATE_KEY)}."
        )
    rate_key = AI_VIDEO_TOOL_RATE_KEY[tool]
    low, mid, high = _band_sum(rate_key, ai_video_count)
    return ServiceForecast(
        service=f"{tool.capitalize()} clips",
        unit="clip",
        units_projected=ai_video_count,
        low=low, mid=mid, high=high,
        note=(
            f"~{ai_video_count} AI-video clips × ${RATES[rate_key][1]:.2f} each. "
            f"Sora 2 is $0 incremental if you already have ChatGPT Pro; "
            f"swap with --ai-video-tool sora."
        ),
    )


def forecast_auphonic(narration_runtime_min: float) -> ServiceForecast:
    """Auphonic per-minute mastering. Free up to 2h/month on subscription
    so low band = 0; mid band assumes pay-per-minute; high band assumes
    a full re-master after pickup edits."""
    low, mid, high = _band_sum("auphonic_min", narration_runtime_min)
    # HIGH band assumes one full re-master after pickup edits — that's
    # 2× the per-minute rate, not the prior 1.5× (Auphonic re-runs
    # bill the full process, not a partial)
    high = round(high * 2.0, 2)
    return ServiceForecast(
        service="Auphonic mastering",
        unit="minute",
        units_projected=round(narration_runtime_min, 1),
        low=low, mid=mid, high=high,
        note=(
            f"{narration_runtime_min:.1f} min of narration. LOW band assumes "
            f"the 2h/mo free cap covers this episode (true for the first "
            f"~9 min/month at the standard subscription); HIGH band assumes "
            f"one full re-master after pickup edits (2× per-minute rate)."
        ),
    )


def forecast_research_and_scripting() -> ServiceForecast:
    """Claude usage for deep research + iterative scripting + audits.
    The variability dominates the cost picture for the first few
    episodes; widens the LOW/HIGH band accordingly."""
    low, mid, high = RATES["claude_episode"]
    return ServiceForecast(
        service="Claude (research + scripting)",
        unit="episode",
        units_projected=1,
        low=low, mid=mid, high=high,
        note=(
            "Deep Research is a one-shot at the top of the pipeline; "
            "the rest is iterative drafting + audit cycles. Calibrate "
            "this LOW/HIGH band against COST_LOG after 3-5 episodes."
        ),
    )


def forecast_stock_assets(stock_count: int) -> ServiceForecast:
    """Stock photo/video sourcing — all major sources are free for
    YouTube use. Carrying the line keeps the cost picture honest."""
    return ServiceForecast(
        service="Stock (Pexels / Pixabay / Wikimedia / Archive)",
        unit="asset",
        units_projected=stock_count,
        low=0.0, mid=0.0, high=0.0,
        note=(
            f"{stock_count} stock asset(s). Free across the canonical "
            f"sources; cost only kicks in if you license premium tracks "
            f"or Pond5 footage (not in scope here)."
        ),
    )


# ── Top-level orchestration ────────────────────────────────────────────────


def build_forecast(
    slug: str,
    ai_video_tool: str = DEFAULT_AI_VIDEO_TOOL,
    still_tool: str = "recraft",
    include_research: bool = True,
    wpm: int = DEFAULT_WPM,
    compare_actual: bool = False,
) -> CostForecast:
    """Full forecast pipeline: scan inputs, project per-service spend."""
    if ai_video_tool not in AI_VIDEO_TOOL_RATE_KEY:
        raise ValueError(
            f"Unknown ai-video tool '{ai_video_tool}' — expected one of "
            f"{sorted(AI_VIDEO_TOOL_RATE_KEY)}."
        )

    shot_list = load_shot_list(slug)
    manifest = load_assembly_manifest(slug)
    sources: dict[str, str] = {}

    # Asset counts
    photo_count = 0
    stock_video_count = 0
    ai_image_count = 0
    ai_video_count = 0
    if shot_list:
        sources["shot_list"] = str(EPISODES_DIR / slug / "shot-list.json")
        for asset in shot_list.get("assets", []):
            t = (asset.get("type") or "").lower()
            if t == "photo":
                photo_count += 1
            elif t == "video":
                stock_video_count += 1
            elif t in ("ai-generate", "ai-image"):
                ai_image_count += 1
            elif t == "ai-video":
                ai_video_count += 1
    # AI-fallback shots: those for which stock returned zero hits get
    # promoted to AI generation. We've already counted explicit ai-*
    # types; ai-gen-briefs.md adds the *promoted* ones on top.
    # The promoted split comes from the `Target tool:` line each brief
    # carries (zerohit_fallback.py writes Recraft for stills, Kling/Flux
    # for video) so we don't need a heuristic 80/20 fallback.
    promoted_stills, promoted_video = count_ai_gen_briefs(slug)
    if promoted_stills + promoted_video > 0:
        sources["ai_gen_briefs"] = str(
            EPISODES_DIR / slug / "ai-gen-briefs.md"
        )
        ai_image_count += promoted_stills
        ai_video_count += promoted_video

    # Narration runtime
    narration_runtime_min = 0.0
    if manifest:
        sources["manifest"] = str(REMOTION_DATA / slug / "assembly-manifest.json")
        narration_runtime_min = float(manifest.get("totalDurationSec", 0)) / 60
    else:
        # Fall back to script word-count / wpm
        script_path = find_script(slug)
        if script_path:
            sources["script"] = str(script_path)
            words = count_script_words(script_path)
            narration_runtime_min = words / wpm

    # Build the forecast
    services: list[ServiceForecast] = []
    if include_research:
        services.append(forecast_research_and_scripting())
    if photo_count + stock_video_count > 0:
        services.append(forecast_stock_assets(photo_count + stock_video_count))
    if ai_image_count > 0:
        services.append(forecast_stills(ai_image_count, tool=still_tool))
    if ai_video_count > 0:
        services.append(forecast_ai_video(ai_video_count, tool=ai_video_tool))
    if narration_runtime_min > 0:
        services.append(forecast_auphonic(narration_runtime_min))

    forecast = CostForecast(
        slug=slug, services=services, sources=sources,
    )
    if compare_actual:
        forecast.actual_by_service = load_actual_spend(slug)
    return forecast


def load_actual_spend(slug: str) -> dict[str, float]:
    """Read the cost-tracker ledger and aggregate spend per service for
    one slug. Service names normalized to lower-case."""
    if not COST_LOG_PATH.is_file():
        return {}
    row_re = re.compile(
        r"^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|\s*(\w+)\s*\|"
        r"\s*([\d.]+)\s*\|\s*([^|]*?)\s*\|\s*$"
    )
    totals: dict[str, float] = {}
    for line in COST_LOG_PATH.read_text(encoding="utf-8").splitlines():
        m = row_re.match(line)
        if not m:
            continue
        _, ep, svc, amt, _ = m.groups()
        if ep.strip() != slug:
            continue
        try:
            totals[svc.strip().lower()] = totals.get(svc.strip().lower(), 0.0) + float(amt)
        except ValueError:
            continue
    return totals


# ── Rendering ───────────────────────────────────────────────────────────────


def render_forecast_md(
    forecast: CostForecast, budget: Optional[float] = None,
) -> str:
    lines = [
        f"# Cost Forecast — {forecast.slug}",
        "",
        "_Pre-production spend projection. Bands are LOW (everything routes "
        "cheap, Sora-via-subscription carries AI video, Auphonic stays under "
        "free tier) / MID (operator's expected best guess) / HIGH (Kling for "
        "every AI clip, Auphonic re-master after pickups, Claude usage to "
        "upper-band)._",
        "",
    ]
    if forecast.sources:
        lines.append("**Inputs scanned:**")
        for k, v in forecast.sources.items():
            try:
                rel = Path(v).relative_to(ROOT)
            except ValueError:
                rel = Path(v)
            lines.append(f"- {k}: `{rel}`")
        lines.append("")

    lines.extend([
        "## Per-service projection",
        "",
        "| Service | Units | LOW | MID | HIGH |"
        + (" Actual to date |" if forecast.actual_by_service else ""),
        "|---|---|---|---|---|"
        + ("---|" if forecast.actual_by_service else ""),
    ])
    for s in forecast.services:
        row = (
            f"| {s.service} | {s.units_projected:g} {s.unit}(s) | "
            f"${s.low:.2f} | ${s.mid:.2f} | ${s.high:.2f} |"
        )
        if forecast.actual_by_service:
            actual = 0.0
            if s.service.startswith("Stock"):
                # Stock spans multiple free-source ledger tokens
                for k in ("pexels", "pixabay", "unsplash", "wikimedia"):
                    actual += forecast.actual_by_service.get(k, 0.0)
            else:
                ledger_key = SERVICE_LABEL_TO_LEDGER_KEY.get(s.service)
                if ledger_key:
                    actual = forecast.actual_by_service.get(ledger_key, 0.0)
            row += f" ${actual:.2f} |"
        lines.append(row)

    lines.extend([
        f"| **Totals** | — | **${forecast.total_low:.2f}** | "
        f"**${forecast.total_mid:.2f}** | **${forecast.total_high:.2f}** |"
        + (f" **${forecast.actual_total:.2f}** |"
           if forecast.actual_by_service else ""),
        "",
    ])

    if budget is not None:
        lines.extend(["## Budget check", ""])
        if forecast.total_mid <= budget:
            lines.append(
                f"🟢 MID projection (${forecast.total_mid:.2f}) is within "
                f"budget (${budget:.2f})."
            )
        elif forecast.total_low <= budget:
            lines.append(
                f"🟡 LOW projection (${forecast.total_low:.2f}) fits budget "
                f"(${budget:.2f}) but MID (${forecast.total_mid:.2f}) "
                f"exceeds it. Tight."
            )
        else:
            lines.append(
                f"🔴 Even LOW projection (${forecast.total_low:.2f}) "
                f"exceeds budget (${budget:.2f}). Re-scope or raise budget."
            )
        lines.append("")

    lines.extend([
        "## Per-service detail",
        "",
    ])
    for s in forecast.services:
        lines.extend([
            f"### {s.service}",
            "",
            f"- **Units:** {s.units_projected:g} {s.unit}(s)",
            f"- **Cost band:** ${s.low:.2f} (LOW) — ${s.mid:.2f} (MID) — ${s.high:.2f} (HIGH)",
            f"- _{s.note}_",
            "",
        ])

    lines.extend([
        "---",
        "",
        "_Pair with `python3 tools/cost_tracker.py summary --episode "
        f"{forecast.slug}` to compare against actual spend, or re-run with "
        "`--compare-actual` to embed the comparison in this report._",
        "",
    ])
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    # Module docstring's first non-empty line is the description. Prior
    # code used split[1] which was the empty line after the title.
    parser = argparse.ArgumentParser(
        description=next(
            (ln for ln in __doc__.splitlines() if ln.strip()),
            "Project pre-production spend.",
        ),
    )
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument(
        "--ai-video-tool", default=DEFAULT_AI_VIDEO_TOOL,
        choices=list(AI_VIDEO_TOOL_RATE_KEY.keys()),
        help=f"Preferred AI-video generator (default {DEFAULT_AI_VIDEO_TOOL}).",
    )
    parser.add_argument(
        "--still-tool", default="recraft", choices=("recraft", "flux"),
        help="Preferred AI-still generator (default recraft).",
    )
    parser.add_argument(
        "--no-research", action="store_true",
        help="Exclude the Claude research/scripting line (e.g. if research "
             "is already complete and you only want forward-looking spend).",
    )
    parser.add_argument(
        "--wpm", type=int, default=DEFAULT_WPM,
        help=f"WPM for word-count → narration-runtime fallback "
             f"(default {DEFAULT_WPM}, only used when assembly manifest absent).",
    )
    parser.add_argument(
        "--budget", type=float,
        help="Compare totals against this budget; emit 🟢/🟡/🔴 banner.",
    )
    parser.add_argument(
        "--strict", action="store_true",
        help="Exit 1 if MID projection exceeds --budget.",
    )
    parser.add_argument(
        "--compare-actual", action="store_true",
        help="Add per-service spend-to-date column from COST_LOG.md.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write report to file.")
    args = parser.parse_args()

    try:
        forecast = build_forecast(
            args.slug,
            ai_video_tool=args.ai_video_tool,
            still_tool=args.still_tool,
            include_research=not args.no_research,
            wpm=args.wpm,
            compare_actual=args.compare_actual,
        )
    except ValueError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    forecast_status = "ok"
    if not forecast.services:
        forecast_status = "no_inputs"
        print(
            f"⚠ no cost-relevant inputs found for {args.slug} — "
            f"shot-list.json, ai-gen-briefs.md, assembly-manifest.json, "
            f"and script-production.md are all absent or empty.",
            file=sys.stderr,
        )

    # If the operator picked Sora as the AI-video tool, the LOW band is
    # $0 *only because the ChatGPT Pro subscription amortizes it
    # elsewhere*. Warn so the headline number isn't misread as "this
    # episode is free of AI-video cost".
    if args.ai_video_tool == "sora" and any(
        s.service.startswith("Sora") for s in forecast.services
    ):
        print(
            "ℹ note: Sora 2 LOW/MID bands are $0 because the cost is "
            "amortized via ChatGPT Pro ($200/mo). If you don't already "
            "have that subscription, the true cost-per-episode is "
            "non-zero — re-run with --ai-video-tool kling for the "
            "explicit per-clip rate.",
            file=sys.stderr,
        )

    # --strict without --budget is meaningless; warn and don't fail.
    if args.strict and args.budget is None:
        print(
            "⚠ --strict has no effect without --budget — pass --budget N "
            "to gate the exit code.",
            file=sys.stderr,
        )

    if args.json:
        out = json.dumps({
            "slug": forecast.slug,
            "forecast_status": forecast_status,
            "totals": {
                "low": forecast.total_low,
                "mid": forecast.total_mid,
                "high": forecast.total_high,
                "actual": forecast.actual_total if forecast.actual_by_service else None,
            },
            "services": [asdict(s) for s in forecast.services],
            "actual_by_service": forecast.actual_by_service,
            "sources": forecast.sources,
        }, indent=2)
    else:
        out = render_forecast_md(forecast, budget=args.budget)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    if args.strict and args.budget is not None and forecast.total_mid > args.budget:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
