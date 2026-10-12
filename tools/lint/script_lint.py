#!/usr/bin/env python3
"""
script_lint.py — deterministic script-stage checks, so the LLM audit can spend
its attention on judgment (see skills/script-audit/SKILL.md).

Everything here is mechanical: a phrase list, a count, a regex over `DIR:` /
`PACE:` / mode tags. Judgment lenses (transitions, human moments, connection
density, psychological architecture, claim audit) stay in the skill.

Rules:
  S-VERIFY-NARRATION    error  verification-process narration in VO (Lens 10, F3)
  S-SIGNPOST            warn   lecture signpost phrases in VO (Lens 2)
  S-HEDGE-L3            warn   Level-3 vague-uncertainty phrases (Lens 9)
  S-HEDGE-DENSITY       warn   >15% of declarative sentences hedged (Lens 10, F4)
  S-NEGATION-PIVOT      warn   "That doesn't X. It Y." / "It's not X, it's Y" (AI-sounding tell)
  S-DIR-DEPRECATED      error  cut(wipe-*|blur-through|whip-pan|spatial-zoom)
  S-DIR-IRIS-OVERUSE    warn   more than 2 cut(iris) per episode
  S-DIR-IRIS-RETIRED    warn   any cut(iris): retired Oct 10 2026, renders as a cut
  S-DIR-COLOR-WASH      warn   cut(color-wash) with no color token
  S-PACE-INVALID        error  PACE: value not urgent|analytical|breathing
  S-MG-RUN              warn   more than 3 consecutive [MG:] visuals

Input formats (auto-detected):
  · two-column production script (`| NARRATION | VISUAL PRODUCTION |` table)
  · spoken-draft essay with `<!-- narration:start -->` / `<!-- narration:end -->`
  · otherwise: the whole file is treated as narration

Usage:
    python3 tools/lint/script_lint.py <script.md> [--json] [--strict]

Exit 0 unless an error-severity issue is found (or any issue with --strict).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HEDGE_DENSITY_THRESHOLD = 0.15
MAX_IRIS = 2
MAX_MG_RUN = 3

VALID_PACE = {"urgent", "analytical", "breathing"}
DEPRECATED_CUTS = {"wipe-left", "wipe-right", "wipe-up", "blur-through", "whip-pan", "spatial-zoom"}

VERIFY_PHRASES = [
    r"verified as of",
    r"according to my research",
    r"i confirmed (this|that|it)",
    r"after cross-checking",
    r"survived audit",
    r"i double-checked",
]

SIGNPOST_PHRASES = [
    r"here'?s the (problem|thing|point)",
    r"here'?s the (critical|key|important) difference",
    r"think about what that means",
    r"let'?s be honest about",
    r"here'?s what we know",
    r"it'?s important to understand",
    r"the key takeaway",
    r"what this means is",
    r"but here'?s (why|the thing)",
]

# Level-3 vague uncertainty (CALIBRATION_LANGUAGE.md) — flagged anywhere in VO.
LEVEL3_PHRASES = [
    r"\bmaybe\b",
    r"\bperhaps\b",
    r"it'?s complicated",
    r"who knows",
    r"only time will tell",
    r"arguments on both sides",
    r"could go either way",
    r"i'?m not sure but",
]

# Hedge markers for density only (broader than Level 3).
HEDGE_MARKERS = re.compile(
    r"\b(might|perhaps|maybe|arguably|possibly|seems?|appears?|suggests?|could be)\b"
    r"|it'?s possible that|one could argue",
    re.IGNORECASE,
)

# "It's not X, it's Y" inside one sentence.
NEGATION_INLINE = re.compile(
    r"\b(it|this|that)(?:'?s| is) not\b[^.?!;]{1,80}?[,;—–-]\s*(?:it|this|that)(?:'?s| is)\b",
    re.IGNORECASE,
)
# Sentence opening that denies something, followed by a sentence that pivots.
NEGATION_OPEN = re.compile(
    r"^(that|this|it|he|she|they|the \w+)\s+(doesn'?t|does not|isn'?t|is not|wasn'?t|was not|didn'?t|did not|won'?t|can'?t)\b",
    re.IGNORECASE,
)
PIVOT_OPEN = re.compile(r"^(it|he|she|they|that|this|but|what)\b", re.IGNORECASE)

DIR_CUT = re.compile(r"DIR:\s*cut\(\s*([a-z-]+)\s*(?:,\s*([^)]*))?\)", re.IGNORECASE)
# PACE: must be the whole visual cell, so prose that mentions "PACE: annotations" is ignored.
PACE_RE = re.compile(r"^\|[^|]*\|\s*PACE:\s*([A-Za-z-]+)\s*\|?\s*$")
MG_TAG = re.compile(r"\[MG:\]")
OTHER_TAG = re.compile(r"\[(FOOTAGE|LAYERED|AI-GEN|ILLUST|SCENE|ARCHIVAL)(?::\]|:\s*[^\]]+\])")


def _issue(rule: str, severity: str, line: int, message: str) -> dict:
    return {"rule": rule, "severity": severity, "line": line, "message": message}


def narration_lines(text: str) -> list[tuple[int, str]]:
    """Return (line_number, narration_text) pairs, whatever the input format."""
    lines = text.splitlines()
    out: list[tuple[int, str]] = []

    if any("<!-- narration:start -->" in ln for ln in lines):
        inside = False
        for i, ln in enumerate(lines, 1):
            if "<!-- narration:start -->" in ln:
                inside = True
            elif "<!-- narration:end -->" in ln:
                inside = False
            elif inside and ln.strip():
                out.append((i, ln.strip()))
        return out

    if any(re.match(r"\|\s*NARRATION\s*\|", ln, re.IGNORECASE) for ln in lines):
        for i, ln in enumerate(lines, 1):
            if not ln.startswith("|") or re.match(r"\|[-\s|:]+$", ln):
                continue
            cell = ln.split("|")[1].strip() if ln.count("|") >= 2 else ""
            if not cell or cell.upper() == "NARRATION":
                continue
            if cell.startswith("*(") or cell.startswith("*["):  # voice/stage notes
                continue
            cell = re.sub(r"\{[^}]*\}", "", cell).strip()
            if cell:
                out.append((i, cell))
        return out

    return [(i, ln.strip()) for i, ln in enumerate(lines, 1) if ln.strip()]


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p for p in parts if p.strip() and not p.strip().endswith("?")]


def lint_narration(lines: list[tuple[int, str]]) -> list[dict]:
    issues: list[dict] = []
    declarative = 0
    hedged = 0

    for lineno, text in lines:
        low = text.lower()
        for pat in VERIFY_PHRASES:
            if re.search(pat, low):
                issues.append(_issue("S-VERIFY-NARRATION", "error", lineno,
                                     f"verification-process narration ({pat}) — belongs in the research memo"))
        for pat in SIGNPOST_PHRASES:
            if re.search(pat, low):
                issues.append(_issue("S-SIGNPOST", "warn", lineno, f"lecture signpost ({pat})"))
        for pat in LEVEL3_PHRASES:
            if re.search(pat, low):
                issues.append(_issue("S-HEDGE-L3", "warn", lineno, f"Level-3 vague uncertainty ({pat})"))
        for s in _sentences(text):
            declarative += 1
            if HEDGE_MARKERS.search(s):
                hedged += 1

    flat = [(n, sent) for n, text in lines for sent in re.split(r"(?<=[.!?])\s+", text) if sent.strip()]
    for (n1, a), (_, b) in zip(flat, flat[1:]):
        if NEGATION_OPEN.match(a) and not a.endswith("?") and PIVOT_OPEN.match(b):
            issues.append(_issue("S-NEGATION-PIVOT", "warn", n1, f"deny-then-pivot: \"{a[:40]}…\" → \"{b[:30]}…\""))
    for lineno, text in lines:
        if NEGATION_INLINE.search(text):
            issues.append(_issue("S-NEGATION-PIVOT", "warn", lineno, "inline \"it's not X, it's Y\" construction"))

    if declarative:
        density = hedged / declarative
        if density > HEDGE_DENSITY_THRESHOLD:
            issues.append(_issue("S-HEDGE-DENSITY", "warn", 0,
                                 f"{hedged}/{declarative} declarative sentences hedged "
                                 f"({density:.0%} > {HEDGE_DENSITY_THRESHOLD:.0%})"))
    return issues


def lint_directions(text: str) -> list[dict]:
    issues: list[dict] = []
    iris_lines: list[int] = []
    pace_changes: list[tuple[int, str]] = []
    mg_run = 0
    mg_run_start = 0

    for i, ln in enumerate(text.splitlines(), 1):
        for m in DIR_CUT.finditer(ln):
            kind, rest = m.group(1).lower(), (m.group(2) or "").strip()
            if kind in DEPRECATED_CUTS:
                issues.append(_issue("S-DIR-DEPRECATED", "error", i, f"deprecated transition cut({kind})"))
            if kind == "iris":
                iris_lines.append(i)
                issues.append(_issue("S-DIR-IRIS-RETIRED", "warn", i,
                                     "cut(iris) is retired and renders as a cut; use cut(cut), or cut(fade) at a chapter break"))
            if kind == "color-wash" and not re.match(r"[A-Za-z#]", rest):
                issues.append(_issue("S-DIR-COLOR-WASH", "warn", i, "cut(color-wash) missing color token"))

        pm = PACE_RE.search(ln)
        if pm:
            value = pm.group(1).lower()
            pace_changes.append((i, value))
            if value not in VALID_PACE:
                issues.append(_issue("S-PACE-INVALID", "error", i, f"PACE: {value} is not one of {sorted(VALID_PACE)}"))

        if MG_TAG.search(ln):
            if mg_run == 0:
                mg_run_start = i
            mg_run += 1
            if mg_run == MG_RUN_LIMIT_PLUS_ONE:
                issues.append(_issue("S-MG-RUN", "warn", mg_run_start,
                                     f"more than {MAX_MG_RUN} consecutive [MG:] visuals starting here"))
        elif OTHER_TAG.search(ln):
            mg_run = 0

    if len(iris_lines) > MAX_IRIS:
        issues.append(_issue("S-DIR-IRIS-OVERUSE", "warn", iris_lines[MAX_IRIS],
                             f"{len(iris_lines)} cut(iris) in episode (max {MAX_IRIS})"))
    return issues


MG_RUN_LIMIT_PLUS_ONE = MAX_MG_RUN + 1


def lint_text(text: str) -> list[dict]:
    issues = lint_narration(narration_lines(text)) + lint_directions(text)
    return sorted(issues, key=lambda d: (d["line"], d["rule"]))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("script", type=Path)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true", help="fail on warnings too")
    args = ap.parse_args(argv)

    issues = lint_text(args.script.read_text(encoding="utf-8"))
    if args.json:
        print(json.dumps(issues, indent=2, ensure_ascii=False))
    else:
        for d in issues:
            loc = f"{args.script}:{d['line']}" if d["line"] else str(args.script)
            print(f"{loc}: {d['severity']} {d['rule']}: {d['message']}")
        errs = sum(d["severity"] == "error" for d in issues)
        print(f"{len(issues)} issue(s), {errs} error(s)")
    failing = [d for d in issues if d["severity"] == "error" or args.strict]
    return 1 if failing else 0


if __name__ == "__main__":
    sys.exit(main())
