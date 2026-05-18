#!/usr/bin/env python3
"""
sayability_lint.py — score every sentence in a production script for
read-aloud difficulty BEFORE the booth.

Catches the tongue-twisters, breath-killers, and over-long sentences
that would otherwise cost 3+ takes to land. The cheapest fix is to
rewrite the sentence; the second-cheapest is to know which sentences
to slow down for. This tool surfaces both BEFORE recording so script-
draft can revise hot spots, instead of after when you're already
hoarse and the booth time is sunk.

What it scores per sentence:

  1. word_count        — too long = breath crisis
  2. syllables_per_word — rough cognitive load proxy
  3. alliteration      — repeated initial-consonant runs ("structural
                          stability suggested")
  4. consonant_clusters — words with ≥3 consecutive non-vowel chars
                          ("strengths," "thoughtful")
  5. sibilance         — density of s/sh/ch hits (whistles into the mic)
  6. unique_long_words — distinct words ≥9 chars per sentence (Latinate
                          load: "constructivist," "epistemological")
  7. comma_breath_gap  — longest stretch of words without a comma /
                          em-dash / colon (no pause = no breath)
  8. mid_sentence_caps — proper-noun density (names mid-sentence force
                          re-pronunciation effort)

Each metric contributes weighted points to a per-sentence "difficulty
score" (0–100). Sentences above a threshold are flagged for review.

Doctrine source: read-aloud rehearsal practice from broadcast voice
training + Wendover/CGP Grey commentary on script revision passes.
Both creators explicitly revise scripts for sayability before booth
time. The metrics here are heuristic proxies — a sentence flagged at
65 isn't impossible to read, it's just expensive in takes.

Usage:
    python3 tools/narration/sayability_lint.py <slug>
    python3 tools/narration/sayability_lint.py <slug> --threshold 60
    python3 tools/narration/sayability_lint.py <slug> --top 10
    python3 tools/narration/sayability_lint.py <slug> --json
    python3 tools/narration/sayability_lint.py <slug> --strict

Exit codes:
    0 — no sentences exceed --threshold (or --strict not set)
    1 — at least one sentence flagged AND --strict
    2 — usage / missing script
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402

ROOT = ffr.ROOT
EPISODES_DIR = ffr.EPISODES_DIR

# ── Tunables ─────────────────────────────────────────────────────────────────

# Threshold above which a sentence is flagged for review. Calibrated
# against the prisoners-dilemma v6.3 script (sentences scoring in the
# 50-60 band were noticeably harder to land in informal read-throughs;
# 65+ was where takes started multiplying).
DEFAULT_THRESHOLD = 60.0

# Word-count bands for the score component.
WORD_COUNT_EASY = 12       # below this: no points
WORD_COUNT_HARD = 30       # at this and above: max points (breath crisis)
WORD_COUNT_WEIGHT = 25

# Words without a breath punctuation (, ; : — .) — the longest such run
# within the sentence. A run of 18+ words is a real lung-buster.
BREATH_GAP_EASY = 10
BREATH_GAP_HARD = 25
BREATH_GAP_WEIGHT = 20

# Alliteration: runs of N consecutive content-words starting with the
# same letter (excluding articles/prepositions). 3+ is noticeable.
ALLITERATION_THRESHOLD = 3
ALLITERATION_WEIGHT = 10

# Consonant clusters: words with 3+ consecutive non-vowel chars. Each
# such word contributes; 3+ in a sentence is heavy.
CLUSTER_PER_SENTENCE_HARD = 4
CLUSTER_WEIGHT = 10

# Sibilance: density of /s/ʃ/tʃ initial sounds. > 0.25 = sssound show.
SIBILANCE_HARD_RATIO = 0.25
SIBILANCE_WEIGHT = 10

# Unique long words (≥9 chars). 4+ in one sentence = Latinate stack.
LONG_WORD_HARD = 5
LONG_WORD_WEIGHT = 15

# Syllables per word — heuristic via vowel-group count.
SYL_PER_WORD_HARD = 2.4
SYL_PER_WORD_WEIGHT = 10

# Don't count single-letter or 1-syllable function words in alliteration runs.
_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "of", "in", "on", "at", "by",
    "to", "for", "with", "as", "is", "was", "be", "are", "were", "it",
    "that", "this", "from", "we", "you", "i", "he", "she", "they",
}

_VOWEL_RE = re.compile(r"[aeiouy]+", re.IGNORECASE)
_CONSONANT_CLUSTER_RE = re.compile(r"[^aeiouy\s\W\d]{3,}", re.IGNORECASE)
# Sibilant-start: /s/, /ʃ/ (sh), /tʃ/ (ch), /ts/, /j/, /s/+vowel.
# Critically does NOT match /sk/ clusters (school, scope, scheme, scan)
# which are stops, not sibilants — the prior pattern over-fired on
# analytical scripts heavy with "structure / scheme / scope".
_SIBILANT_START_RE = re.compile(
    r"^(sh|s[aeiouy]|c[ei]|ts|ch|j[aeiouy])", re.IGNORECASE,
)
_BREATH_PUNCT_RE = re.compile(r"[,;:—–]")
_WORD_RE = re.compile(r"\b[a-zA-Z][a-zA-Z']*\b")
# Sentence terminators. Splits on `.!?` followed by whitespace, regardless
# of the next char's case. The previous lookahead required `[A-Z"'…]` next,
# which silently merged rhetorical-question + lowercase patterns like
# `"What is power? it is everywhere."` into a single sentence — a common
# Parallax script pattern. Abbreviation false-splits ("Dr. Smith")
# are prevented earlier via the `_mask_abbreviations` step.
_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class SentenceScore:
    """Per-sentence breakdown — every metric, every contribution, the
    total. JSON-friendly for downstream tools."""
    beat_number: int
    beat_title: str
    sentence: str
    word_count: int
    syllables_per_word: float
    breath_gap: int                  # longest run without comma/dash/colon
    alliteration_runs: int           # count of 3+ same-initial runs
    consonant_clusters: int
    sibilance_ratio: float
    unique_long_words: int
    score: float = 0.0
    contributions: dict = field(default_factory=dict)

    @property
    def severity(self) -> str:
        if self.score >= 75:
            return "🔴"
        if self.score >= 60:
            return "🟡"
        return "🟢"


@dataclass
class SayabilityReport:
    slug: str
    script_path: str
    threshold: float
    sentences: list[SentenceScore] = field(default_factory=list)

    @property
    def flagged(self) -> list[SentenceScore]:
        return [s for s in self.sentences if s.score >= self.threshold]

    @property
    def total_sentences(self) -> int:
        return len(self.sentences)


# ── Per-metric helpers (pure functions, easy to test) ───────────────────────


def count_syllables(word: str) -> int:
    """Rough English syllable count via vowel-group heuristic. Not
    linguistically perfect but consistent and fast — adequate as a
    relative-difficulty signal."""
    w = word.lower().strip("'\"")
    if not w:
        return 0
    groups = _VOWEL_RE.findall(w)
    syl = len(groups)
    # Silent trailing 'e' (cake → 1, not 2). Only if the word ends in 'e'
    # AND has at least one other vowel group before it.
    if w.endswith("e") and syl > 1 and not w.endswith("le"):
        syl -= 1
    return max(syl, 1)


def alliteration_run_count(words: list[str]) -> int:
    """Count distinct 3+ runs of content-words starting with the same
    letter. ['structural', 'stability', 'suggested'] → 1 run."""
    runs = 0
    i = 0
    while i < len(words):
        if words[i].lower() in _STOPWORDS or not words[i]:
            i += 1
            continue
        first = words[i][0].lower()
        run = 1
        j = i + 1
        while j < len(words):
            w = words[j]
            if not w:
                j += 1
                continue
            if w.lower() in _STOPWORDS:
                j += 1
                continue
            if w[0].lower() == first:
                run += 1
                j += 1
            else:
                break
        if run >= ALLITERATION_THRESHOLD:
            runs += 1
            i = j
        else:
            i += 1
    return runs


def consonant_cluster_count(words: list[str]) -> int:
    """Count words containing 3+ consecutive non-vowel chars."""
    return sum(1 for w in words if _CONSONANT_CLUSTER_RE.search(w))


def sibilance_ratio(words: list[str]) -> float:
    """Fraction of words starting with /s/ʃ/tʃ/ sounds."""
    if not words:
        return 0.0
    hits = sum(1 for w in words if _SIBILANT_START_RE.match(w))
    return hits / len(words)


def unique_long_word_count(words: list[str], min_len: int = 9) -> int:
    """Count of DISTINCT words at least `min_len` chars long."""
    return len({w.lower() for w in words if len(w) >= min_len})


def longest_breath_gap(sentence: str) -> int:
    """Longest run of words with no breath punctuation (comma, dash, colon).
    Splits on those marks; returns the max word count in any segment."""
    segments = _BREATH_PUNCT_RE.split(sentence)
    return max((len(_WORD_RE.findall(s)) for s in segments), default=0)


# ── Scoring ──────────────────────────────────────────────────────────────────


def _band_score(value: float, easy: float, hard: float, weight: float) -> float:
    """Linear ramp from `easy` (0 points) to `hard` (full weight)."""
    if value <= easy:
        return 0.0
    if value >= hard:
        return float(weight)
    return weight * (value - easy) / (hard - easy)


def score_sentence(sentence: str, beat_number: int = 0, beat_title: str = "") -> SentenceScore:
    """Compute the full sayability score for one sentence."""
    words = _WORD_RE.findall(sentence)
    word_count = len(words)

    if word_count == 0:
        return SentenceScore(
            beat_number=beat_number, beat_title=beat_title, sentence=sentence,
            word_count=0, syllables_per_word=0.0, breath_gap=0,
            alliteration_runs=0, consonant_clusters=0,
            sibilance_ratio=0.0, unique_long_words=0,
        )

    total_syl = sum(count_syllables(w) for w in words)
    syl_per_word = total_syl / word_count
    breath_gap = longest_breath_gap(sentence)
    allit = alliteration_run_count(words)
    clusters = consonant_cluster_count(words)
    sib = sibilance_ratio(words)
    long_words = unique_long_word_count(words)

    contribs = {
        "word_count": _band_score(word_count, WORD_COUNT_EASY, WORD_COUNT_HARD, WORD_COUNT_WEIGHT),
        "breath_gap": _band_score(breath_gap, BREATH_GAP_EASY, BREATH_GAP_HARD, BREATH_GAP_WEIGHT),
        # Band the alliteration penalty: 1 run = 5 pts, 2+ runs = full
        # weight. A single intentional rhetorical run shouldn't tip a
        # borderline sentence into the flagged band the same way three
        # accidental runs do.
        "alliteration": min(allit * 5, ALLITERATION_WEIGHT),
        "consonant_clusters": _band_score(clusters, 0, CLUSTER_PER_SENTENCE_HARD, CLUSTER_WEIGHT),
        "sibilance": _band_score(sib, 0.05, SIBILANCE_HARD_RATIO, SIBILANCE_WEIGHT),
        "unique_long_words": _band_score(long_words, 1, LONG_WORD_HARD, LONG_WORD_WEIGHT),
        "syllables_per_word": _band_score(syl_per_word, 1.5, SYL_PER_WORD_HARD, SYL_PER_WORD_WEIGHT),
    }
    total = sum(contribs.values())

    return SentenceScore(
        beat_number=beat_number, beat_title=beat_title, sentence=sentence,
        word_count=word_count, syllables_per_word=round(syl_per_word, 2),
        breath_gap=breath_gap, alliteration_runs=allit,
        consonant_clusters=clusters, sibilance_ratio=round(sib, 3),
        unique_long_words=long_words,
        score=round(total, 1), contributions={k: round(v, 1) for k, v in contribs.items()},
    )


# ── Sentence splitting ─────────────────────────────────────────────────────


def split_into_sentences(paragraph: str) -> list[str]:
    """Split a paragraph into sentences, respecting common abbreviations
    so 'Dr. Smith' stays one sentence."""
    # Mask abbreviations with a placeholder so the splitter doesn't break
    # on their internal periods.
    masked = paragraph
    for abbrev in ffr.ABBREV_PREFIXES:
        masked = masked.replace(abbrev, abbrev.replace(".", "\x00"))
    parts = _SENTENCE_SPLIT_RE.split(masked)
    # Restore the periods.
    return [p.replace("\x00", ".").strip() for p in parts if p.strip()]


# ── Top-level ───────────────────────────────────────────────────────────────


def run_audit(
    slug: str, script_path: Path, threshold: float = DEFAULT_THRESHOLD,
) -> SayabilityReport:
    """Walk every beat, score every narration sentence, return the report."""
    beats = ffr.parse_script(script_path)
    sentences: list[SentenceScore] = []
    for b in beats:
        for take in b.takes:
            if take.kind != "narration":
                continue
            for sent in split_into_sentences(take.text):
                sentences.append(score_sentence(sent, b.number, b.title))
    return SayabilityReport(
        slug=slug, script_path=str(script_path),
        threshold=threshold, sentences=sentences,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


def render_report_md(report: SayabilityReport, top: int = 0) -> str:
    """Markdown report. `top=N` limits the detailed-flagged section to
    the N highest-scoring sentences (0 = all flagged)."""
    flagged = sorted(report.flagged, key=lambda s: -s.score)
    if top:
        flagged = flagged[:top]
    by_beat: dict[int, list[SentenceScore]] = {}
    for s in report.flagged:
        by_beat.setdefault(s.beat_number, []).append(s)

    sev_counts = {"🔴": 0, "🟡": 0, "🟢": 0}
    for s in report.sentences:
        sev_counts[s.severity] += 1

    lines = [
        f"# Sayability Lint — {report.slug}",
        "",
        f"_Read-aloud difficulty scorer. Sentences above the threshold "
        f"({report.threshold:.0f}) are predicted to take 2+ takes to land "
        f"cleanly. The cheapest fix is to revise the sentence in script-draft "
        f"BEFORE the booth — not after, when you're already hoarse._",
        "",
        f"**Total sentences:** {report.total_sentences}  ·  "
        f"🔴 {sev_counts['🔴']} · 🟡 {sev_counts['🟡']} · 🟢 {sev_counts['🟢']}",
        f"**Flagged at threshold ≥{report.threshold:.0f}:** {len(report.flagged)}",
        "",
    ]

    if not report.flagged:
        lines.extend([
            "## ✅ No sentences exceed the threshold",
            "",
            "Either the script is read-aloud-friendly, or the threshold is too "
            "permissive. Try `--threshold 50` to see the top contenders.",
            "",
        ])
    else:
        lines.append("## Per-beat flagged-sentence breakdown")
        lines.append("")
        lines.append("| Beat | Title | Flagged | Worst score |")
        lines.append("|---|---|---|---|")
        for num in sorted(by_beat):
            beat_flagged = by_beat[num]
            worst = max(s.score for s in beat_flagged)
            title = beat_flagged[0].beat_title[:40]
            lines.append(f"| {num} | _{title}_ | {len(beat_flagged)} | {worst:.0f} |")
        lines.append("")

        lines.append(f"## Top {len(flagged)} flagged sentence(s)" if top
                     else f"## All {len(flagged)} flagged sentence(s)")
        lines.append("")
        for s in flagged:
            lines.extend([
                f"### {s.severity} {s.score:.0f} — Beat {s.beat_number}",
                "",
                f"> {s.sentence}",
                "",
                f"- **Words:** {s.word_count} · "
                f"**Syllables/word:** {s.syllables_per_word} · "
                f"**Breath gap:** {s.breath_gap}",
                f"- **Alliteration runs:** {s.alliteration_runs} · "
                f"**Consonant clusters:** {s.consonant_clusters} · "
                f"**Sibilance:** {s.sibilance_ratio:.2f} · "
                f"**Long words:** {s.unique_long_words}",
                "- _Contributions:_ "
                + ", ".join(f"{k}={v}" for k, v in s.contributions.items() if v > 0),
                "",
            ])

    lines.extend([
        "---",
        "",
        f"_Run: `python3 tools/narration/sayability_lint.py {report.slug}`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path override.")
    parser.add_argument(
        "--threshold", type=float, default=DEFAULT_THRESHOLD,
        help=f"Flag sentences scoring ≥ this (default {DEFAULT_THRESHOLD}).",
    )
    parser.add_argument(
        "--top", type=int, default=0,
        help="Limit detail to top-N flagged sentences (0 = all).",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of markdown.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write report to file.")
    parser.add_argument(
        "--strict", action="store_true",
        help="Exit 1 if any sentence is flagged.",
    )
    args = parser.parse_args()

    if args.script:
        script_path = Path(args.script).resolve()
        if not script_path.is_file():
            print(f"✗ script not found: {script_path}", file=sys.stderr)
            return 2
    else:
        script_path = ffr.find_script(args.slug)
        if script_path is None or not script_path.is_file():
            print(f"✗ no production script for {args.slug}", file=sys.stderr)
            return 2

    report = run_audit(args.slug, script_path, threshold=args.threshold)

    if args.json:
        payload = {
            "slug": report.slug, "script_path": report.script_path,
            "threshold": report.threshold,
            "total_sentences": report.total_sentences,
            "flagged_count": len(report.flagged),
            "sentences": [asdict(s) for s in report.sentences],
        }
        out = json.dumps(payload, indent=2)
    else:
        out = render_report_md(report, top=args.top)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    if args.strict and report.flagged:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
