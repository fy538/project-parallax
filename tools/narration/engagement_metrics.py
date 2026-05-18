#!/usr/bin/env python3
"""
engagement_metrics.py — compute objective, measurable engagement signals
from a production script. Used standalone for diagnostics, and as the
metrics engine underneath `script_diff.py` (A/B comparison).

The metrics here come from the engagement-research playbook:
  · Cold-open hook position (target: pivot lands within 15s)
  · Bridge-sentence density per beat (mid-act transition smoothness)
  · Pattern-interrupt density (visual changes per minute)
  · Direct-address frequency (you/your/we/us — viewer activation)
  · Caveat density (bounded-analogy moves — rigor signal)
  · Sentence-length distribution (pacing rhythm)
  · Proper-noun density (cognitive load proxy)
  · Word counts + estimated runtime per beat
  · Pivot-word presence in cold open (misconception-first signature)

None of these prove engagement directly — actual retention proves that.
What they provide is a CONSISTENT, AUTHOR-INDEPENDENT measurement of
the structural features research has identified as engagement-correlated.
Pre-publish, they let us compare versions objectively; post-publish,
they let us calibrate (which metrics actually predicted retention?).

Usage:
    python3 tools/narration/engagement_metrics.py <slug>
    python3 tools/narration/engagement_metrics.py <slug> --script <path>
    python3 tools/narration/engagement_metrics.py <slug> --stdout
    python3 tools/narration/engagement_metrics.py <slug> --json
"""

from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402
import pronunciation_guide as pg  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# ── Heuristic vocabularies ───────────────────────────────────────────────────

# Words that signal a pivot/misconception-first move in the cold open.
# A take containing any of these (case-insensitive) marks "the pivot has
# landed." Position of the FIRST take with one of these = hook position.
PIVOT_SIGNAL_PATTERNS = [
    r"\bit'?s also wrong\b",
    r"\bit'?s wrong\b",
    r"\balmost every (word|sentence|thing) of that is wrong\b",
    r"\bbut (actually|here'?s)\b",
    r"\bturns out\b",
    r"\bthat'?s not (true|what'?s going on|right)\b",
    r"\bexcept (it|that)'?s\b",
    r"\bhere'?s (the thing|what)\b",
    r"\bnot (the math|the conclusion|exactly)\b",
    r"\bisn'?t actually\b",
    r"\bdoesn'?t actually\b",
    r"\bwhat (it|that) (can'?t|cannot) explain\b",
    r"\bthe proof that it'?s wrong\b",
]
_PIVOT_RE = re.compile("|".join(PIVOT_SIGNAL_PATTERNS), re.IGNORECASE)

# Bridging connectives — sentences starting with these signal narrative
# transitions rather than expository continuation. Counted PER BEAT.
BRIDGE_OPENERS = [
    "so", "and then", "but", "but to", "but here", "but here'?s",
    "how", "how does", "why", "why does", "the answer", "the answer is",
    "which raises", "which means", "which is why",
    "here'?s (the thing|what|why|the answer|the question)",
    "now that", "and now", "and that", "and that'?s",
    "for that", "because", "because of",
]
_BRIDGE_RE = re.compile(
    r"^\s*(?:"
    + "|".join(BRIDGE_OPENERS)
    + r")\b",
    re.IGNORECASE,
)

# Bounded-analogy / caveat markers — sentences containing these signal
# explicit editorial calibration (the "this is useful here, misleading
# there" doctrine). Counted across the whole script.
CAVEAT_PATTERNS = [
    r"\bisn'?t wrong about everything\b",
    r"\bone (important )?caveat\b",
    r"\bthe (model|theory|argument|framework) (says|isn'?t|doesn'?t)\b",
    r"\bnot that .{1,60} but that\b",  # "not that X, but that Y" form
    r"\bnot because .{1,60} but because\b",
    r"\bwhat (it can'?t|the evidence) (establish|prove|explain)\b",
    r"\bwhat (would|could) change my mind\b",
    r"\bharder limit\b",
    r"\bnot the math\b",
    r"\bunless\b",
    r"\bthe puzzle (is|shifts)\b",
    r"\bwithin (very )?specific (ways|constraints)\b",
    r"\bbarely existed\b",
]
_CAVEAT_RE = re.compile("|".join(CAVEAT_PATTERNS), re.IGNORECASE)

# Direct-address tokens — viewer activation signal. Counted as
# proportion of total words.
DIRECT_ADDRESS_TOKENS = {"you", "your", "you're", "you've", "you'll", "you'd",
                          "we", "our", "we're", "we've", "we'll", "we'd",
                          "us", "let's"}

# Visual-mode tags counted for pattern-interrupt density. Includes both
# explicit `[MG:]`-style tags and `DIR: cut(...)` direction lines.
_VISUAL_TAG_RE = re.compile(
    r"\[(?:MG|AI-GEN|ILLUST|SCENE|ARCHIVAL|FOOTAGE|LAYERED|FORECAST|BACKDROP|OVERLAY)[:|\]]",
    re.IGNORECASE,
)
_DIR_CUT_RE = re.compile(r"^\s*DIR:\s*cut\(", re.IGNORECASE | re.MULTILINE)

# Words per minute for runtime estimates (shared with format_for_reading).
DEFAULT_WPM = ffr.DEFAULT_WPM


# ── Data models ──────────────────────────────────────────────────────────────


@dataclass
class BeatMetrics:
    """Per-beat measurable signals."""

    number: int
    title: str
    word_count: int
    estimated_runtime_sec: float
    take_count: int
    sentence_count: int
    sentence_length_mean: float
    sentence_length_median: float
    bridge_sentence_count: int  # sentences opening with a bridge connective
    direct_address_count: int   # you/your/we/us tokens
    direct_address_per_100w: float
    caveat_count: int           # bounded-analogy markers
    proper_noun_candidate_count: int  # reuses pronunciation_guide extraction


@dataclass
class EngagementMetrics:
    """Full structural snapshot of a script."""

    slug: str
    script_path: str
    total_word_count: int
    total_runtime_sec: float
    beat_count: int
    beats: list[BeatMetrics] = field(default_factory=list)

    # Cold-open / hook signals
    cold_open_word_count: int = 0       # words from beat-1 start to first take with pivot signal
    hook_position_sec: float | None = None  # cold_open_word_count / wpm * 60
    hook_take_index: int | None = None  # which take within Beat 1 fired the pivot
    has_pivot_signal: bool = False

    # Cross-beat aggregate signals
    pattern_interrupt_count: int = 0    # visual tags + DIR: cut() across whole script
    pattern_interrupts_per_min: float = 0.0
    visual_tag_count: int = 0           # subset: just [MG:]/[AI-GEN:] etc.
    dir_cut_count: int = 0              # subset: just DIR: cut()

    @property
    def total_runtime_min(self) -> float:
        return self.total_runtime_sec / 60.0

    @property
    def total_direct_address_per_100w(self) -> float:
        total_direct = sum(b.direct_address_count for b in self.beats)
        return (total_direct / self.total_word_count * 100) if self.total_word_count else 0.0

    @property
    def total_caveat_density_per_1000w(self) -> float:
        total_caveats = sum(b.caveat_count for b in self.beats)
        return (total_caveats / self.total_word_count * 1000) if self.total_word_count else 0.0

    @property
    def total_bridge_count(self) -> int:
        return sum(b.bridge_sentence_count for b in self.beats)


# ── Sentence splitting ──────────────────────────────────────────────────────
# Conservative sentence splitter — same regex family as format_for_reading's
# breath-mark splitter. Drops abbreviation edge cases so mean-length doesn't
# pick up phantom sentences from "Dr. Smith" or "U.S. policy".

_SENT_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"'“”‘’])")


def _split_sentences(text: str) -> list[str]:
    """Split paragraph text into sentences. Returns non-empty strings."""
    parts = _SENT_SPLIT_RE.split(text.strip())
    out: list[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        # Filter sub-sentence fragments: ABBREV. before a capital triggers
        # a spurious split. Heuristic: if the previous part ends with a
        # short token + period (e.g. "Dr.", "U.S."), reattach. Cheap pass.
        if out and len(out[-1].split()[-1]) <= 4 and out[-1].endswith("."):
            out[-1] = out[-1] + " " + p
        else:
            out.append(p)
    return out


def _word_count(text: str) -> int:
    return sum(1 for tok in text.split() if re.search(r"\w", tok))


# ── Per-take + per-beat computations ─────────────────────────────────────────


def _direct_address_count(text: str) -> int:
    """Count direct-address tokens (you/your/we/us etc.) — viewer activation."""
    tokens = re.findall(r"\b[\w']+\b", text.lower())
    return sum(1 for t in tokens if t in DIRECT_ADDRESS_TOKENS)


def _caveat_count(text: str) -> int:
    """Count bounded-analogy marker matches across the text."""
    return len(_CAVEAT_RE.findall(text))


def _bridge_sentence_count(sentences: list[str]) -> int:
    """How many sentences open with a bridging connective?"""
    return sum(1 for s in sentences if _BRIDGE_RE.match(s))


def _has_pivot(text: str) -> bool:
    """Does the text contain a misconception-first pivot signal?"""
    return bool(_PIVOT_RE.search(text))


def compute_beat_metrics(beat: ffr.Beat, wpm: int = DEFAULT_WPM) -> BeatMetrics:
    """Pure: derive measurable signals from one parsed Beat."""
    narration_takes = [t for t in beat.takes if t.kind == "narration"]
    text = " ".join(t.text for t in narration_takes)
    sentences = _split_sentences(text)
    sentence_lengths = [_word_count(s) for s in sentences if _word_count(s) > 0]

    word_count = sum(t.word_count for t in narration_takes)
    runtime_sec = (word_count / wpm * 60) if wpm > 0 else 0.0

    return BeatMetrics(
        number=beat.number,
        title=beat.title,
        word_count=word_count,
        estimated_runtime_sec=runtime_sec,
        take_count=len(narration_takes),
        sentence_count=len(sentences),
        sentence_length_mean=statistics.mean(sentence_lengths) if sentence_lengths else 0.0,
        sentence_length_median=statistics.median(sentence_lengths) if sentence_lengths else 0.0,
        bridge_sentence_count=_bridge_sentence_count(sentences),
        direct_address_count=_direct_address_count(text),
        direct_address_per_100w=(_direct_address_count(text) / word_count * 100) if word_count else 0.0,
        caveat_count=_caveat_count(text),
        proper_noun_candidate_count=sum(pg.extract_candidates(text).values()),
    )


# ── Cold-open hook detection ────────────────────────────────────────────────


def detect_hook_position(
    cold_open_beat: ffr.Beat, wpm: int = DEFAULT_WPM,
) -> tuple[float | None, int | None, int, bool]:
    """Scan Beat 1's narration takes in order. Return (hook_sec, hook_take_idx,
    cold_open_word_count_when_hook_fired, has_pivot).

    Cold-open word count = sum of words from beat start UP TO AND INCLUDING
    the first take that contains a pivot signal. If no pivot signal ever
    appears in Beat 1, hook_sec = None.
    """
    cumulative_words = 0
    for idx, take in enumerate(cold_open_beat.takes):
        if take.kind != "narration":
            continue
        cumulative_words += take.word_count
        if _has_pivot(take.text):
            hook_sec = cumulative_words / wpm * 60 if wpm > 0 else 0.0
            return (hook_sec, idx, cumulative_words, True)
    return (None, None, 0, False)


# ── Pattern-interrupt counting (from raw markdown, not parsed beats) ────────


def count_pattern_interrupts(raw_script: str) -> tuple[int, int]:
    """Count visual-mode tags + DIR: cut() lines in the whole script.

    Returns (visual_tag_count, dir_cut_count). Pattern interrupts =
    visual_tag_count + dir_cut_count. We measure from the raw markdown
    rather than the parsed beats because the parser only retains
    narration cells; the visual column is where the interrupts live.
    """
    visual_tags = len(_VISUAL_TAG_RE.findall(raw_script))
    dir_cuts = len(_DIR_CUT_RE.findall(raw_script))
    return visual_tags, dir_cuts


# ── Top-level computation ───────────────────────────────────────────────────


def compute_engagement_metrics(
    script_path: Path, slug: str | None = None, wpm: int = DEFAULT_WPM,
) -> EngagementMetrics:
    """Parse a script, derive every measurable signal, return the snapshot."""
    raw = script_path.read_text(encoding="utf-8")
    beats = ffr.parse_script(script_path)
    beat_metrics = [compute_beat_metrics(b, wpm=wpm) for b in beats]

    total_words = sum(b.word_count for b in beat_metrics)
    total_runtime = sum(b.estimated_runtime_sec for b in beat_metrics)

    metrics = EngagementMetrics(
        slug=slug or script_path.parent.name,
        script_path=str(script_path),
        total_word_count=total_words,
        total_runtime_sec=total_runtime,
        beat_count=len(beats),
        beats=beat_metrics,
    )

    if beats:
        hook_sec, hook_idx, cold_open_wc, has_pivot = detect_hook_position(beats[0], wpm=wpm)
        metrics.cold_open_word_count = cold_open_wc
        metrics.hook_position_sec = hook_sec
        metrics.hook_take_index = hook_idx
        metrics.has_pivot_signal = has_pivot

    visual_tags, dir_cuts = count_pattern_interrupts(raw)
    metrics.visual_tag_count = visual_tags
    metrics.dir_cut_count = dir_cuts
    metrics.pattern_interrupt_count = visual_tags + dir_cuts
    metrics.pattern_interrupts_per_min = (
        (visual_tags + dir_cuts) / metrics.total_runtime_min if metrics.total_runtime_min else 0.0
    )

    return metrics


# ── Rendering ────────────────────────────────────────────────────────────────


def _fmt_mmss(seconds: float) -> str:
    total = int(round(seconds))
    return f"{total // 60}:{total % 60:02d}"


def render_metrics_md(m: EngagementMetrics) -> str:
    """Render the metrics as a human-readable markdown report."""
    lines: list[str] = [
        f"# Engagement Metrics — {m.slug}",
        "",
        f"**Script:** `{Path(m.script_path).name}`",
        f"**Total:** {m.total_word_count} words · est. {_fmt_mmss(m.total_runtime_sec)} at {DEFAULT_WPM} wpm",
        f"**Beats:** {m.beat_count}",
        "",
        "## Cold-open hook",
        "",
    ]
    if m.has_pivot_signal:
        lines.extend([
            f"- **Pivot detected:** ✓ at ~{_fmt_mmss(m.hook_position_sec or 0)} "
            f"({m.cold_open_word_count} words in)",
            f"- **Hook position target:** ≤15s (research-backed). "
            f"{'✓ on target' if (m.hook_position_sec or 0) <= 15 else '⚠ above target' if (m.hook_position_sec or 0) <= 30 else '🔴 well above target'}",
        ])
    else:
        lines.append(
            "- **Pivot signal:** ✗ not detected in Beat 1. "
            "Cold open may be premise-first rather than misconception-first."
        )
    lines.append("")

    lines.append("## Pattern interrupts")
    lines.append("")
    lines.append(
        f"- **Visual tag count:** {m.visual_tag_count} (`[MG:]`, `[AI-GEN:]`, "
        f"`[ILLUST:]`, `[SCENE:]`, `[ARCHIVAL:]`, etc.)"
    )
    lines.append(f"- **`DIR: cut()` lines:** {m.dir_cut_count}")
    lines.append(f"- **Total pattern interrupts:** {m.pattern_interrupt_count}")
    lines.append(
        f"- **Density:** {m.pattern_interrupts_per_min:.1f} per minute "
        f"(research target: every ~8s = 7.5/min)"
    )
    lines.append("")

    lines.append("## Per-beat metrics")
    lines.append("")
    lines.append(
        "| # | Title | Words | Runtime | Sentences | Bridges | "
        "Direct address | Caveats | Proper nouns | Mean sentence len |"
    )
    lines.append("|---|---|---|---|---|---|---|---|---|---|")
    for b in m.beats:
        lines.append(
            f"| {b.number} | {b.title[:30]} | {b.word_count} | "
            f"{_fmt_mmss(b.estimated_runtime_sec)} | {b.sentence_count} | "
            f"{b.bridge_sentence_count} | {b.direct_address_count} "
            f"({b.direct_address_per_100w:.1f}/100w) | {b.caveat_count} | "
            f"{b.proper_noun_candidate_count} | {b.sentence_length_mean:.1f} |"
        )
    lines.append("")

    lines.append("## Episode-wide aggregates")
    lines.append("")
    lines.append(
        f"- **Total bridge sentences:** {m.total_bridge_count} "
        f"(mid-act transition density signal)"
    )
    lines.append(
        f"- **Direct-address density:** {m.total_direct_address_per_100w:.2f} "
        f"per 100 words (viewer-activation proxy)"
    )
    lines.append(
        f"- **Caveat density:** {m.total_caveat_density_per_1000w:.2f} "
        f"per 1000 words (bounded-analogy doctrine signal)"
    )
    lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_Interpretation guide: these are CORRELATES of engagement, not")
    lines.append("engagement itself. Use for A/B comparison via `script_diff.py`,")
    lines.append("or as a pre-publish baseline to compare against actual retention")
    lines.append("data post-publish (via publish-retro calibration loop)._")
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", nargs="?", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path.")
    parser.add_argument(
        "--wpm", type=int, default=DEFAULT_WPM,
        help=f"Target words-per-minute (default: {DEFAULT_WPM}).",
    )
    parser.add_argument("-o", "--output", help="Output path (default: episodes/<slug>/engagement-metrics.md).")
    parser.add_argument("--stdout", action="store_true", help="Write to stdout.")
    parser.add_argument(
        "--json", action="store_true",
        help="Emit JSON instead of markdown (for downstream tooling).",
    )
    args = parser.parse_args()

    if args.script:
        script_path = Path(args.script).resolve()
        slug = args.slug or script_path.parent.name
    else:
        if not args.slug:
            print("✗ provide either a slug or --script <path>", file=sys.stderr)
            return 2
        slug = args.slug
        found = ffr.find_script(slug)
        if not found:
            print(f"✗ no script found for {slug}", file=sys.stderr)
            return 2
        script_path = found

    if not script_path.is_file():
        print(f"✗ script not found: {script_path}", file=sys.stderr)
        return 2

    metrics = compute_engagement_metrics(script_path, slug=slug, wpm=args.wpm)

    if args.json:
        payload = asdict(metrics)
        if args.stdout:
            sys.stdout.write(json.dumps(payload, indent=2))
            return 0
        out_path = Path(args.output).resolve() if args.output else (
            EPISODES_DIR / slug / "engagement-metrics.json"
        )
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        print(f"✓ wrote {rel}")
        return 0

    rendered = render_metrics_md(metrics)
    if args.stdout:
        sys.stdout.write(rendered)
        return 0
    out_path = Path(args.output).resolve() if args.output else (
        EPISODES_DIR / slug / "engagement-metrics.md"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
    print(f"✓ wrote {rel}")
    print(
        f"  {m_summary(metrics)}"
    )
    return 0


def m_summary(m: EngagementMetrics) -> str:
    """Quick one-line summary for stdout after a write."""
    hook = f"{m.hook_position_sec:.0f}s" if m.hook_position_sec else "no pivot detected"
    return (
        f"hook @ {hook} · {m.pattern_interrupts_per_min:.1f} interrupts/min · "
        f"{m.total_bridge_count} bridges · {m.total_caveat_density_per_1000w:.1f} "
        f"caveats/1k words"
    )


if __name__ == "__main__":
    sys.exit(main())
