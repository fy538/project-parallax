#!/usr/bin/env python3
"""
check_concept_coverage.py — verify concepts claimed in an episode actually appear in its script.

Failure mode this catches:
  The concept registry (`data/concepts.json`) declares that a concept is
  "introduced" in episode X. If the script for X never actually contains the
  term (English, Chinese, or pinyin), then either:
    (a) the registry has a typo or stale claim, OR
    (b) the script was edited and removed the moment that introduces the
        concept — breaking downstream callbacks in later episodes that
        depend on this introduction existing.

What we check:
  For each concept where `introduced.episode == slug` OR
  `appearances[].episode == slug`, verify that at least one of
  { term.en, term.cn, term.pinyin } appears in the production script.

  Pinyin matching is tone-mark-insensitive (`kǎ bózi` matches `ka bozi`) —
  scripts often lose diacritics in copy/paste.

Out of scope (not yet, not here):
  - Concepts MENTIONED in script but not in the registry. That's an "undocumented
    concept" check, which requires NLP to be useful (otherwise it would flag
    every domain noun). Worth doing once enough episodes are shipped.

Why this is informational by default (not a hard fail):
  Canonical registry terms are often DESCRIPTIVE labels ("1941 US oil embargo
  on Japan") that won't appear verbatim in a narrative script ("...we cut off
  Japan's oil in mid-1941..."). The tool surfaces every concept that claims
  introduction here but doesn't have an exact match — useful for registry
  curators to triage drift vs paraphrase — without blocking renders. Pass
  `--strict` to treat any missing concept as a failure (exit 1).

Usage:
    python3 tools/check_concept_coverage.py silicon-trap
    python3 tools/check_concept_coverage.py prisoners-dilemma --json
    python3 tools/check_concept_coverage.py silicon-trap --strict

Exit codes:
    0 — every claimed concept is referenced (or non-strict mode with warnings)
    1 — --strict and at least one concept claims this episode but isn't found
    2 — usage error / missing script / missing registry
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EPISODES_ROOT = REPO_ROOT / "episodes"
CONCEPTS_FILE = REPO_ROOT / "data" / "concepts.json"


def _relpath(p: Path) -> str:
    """Repo-relative when inside the tree, absolute otherwise (for tests)."""
    try:
        return str(p.relative_to(REPO_ROOT))
    except ValueError:
        return str(p)


# ─── Helpers ─────────────────────────────────────────────────────────────────


def find_script(slug: str) -> Path | None:
    """Match the lookup used by check_script_manifest.py — pick the highest
    versioned `script-v<N>-production.md` if no plain `script-production.md`.
    """
    episode_dir = EPISODES_ROOT / slug
    if not episode_dir.is_dir():
        return None
    canonical = episode_dir / "script-production.md"
    if canonical.is_file():
        return canonical
    versioned = sorted(
        episode_dir.glob("script-v*-production.md"),
        key=lambda p: int(re.search(r"v(\d+)", p.name).group(1)) if re.search(r"v(\d+)", p.name) else 0,
        reverse=True,
    )
    return versioned[0] if versioned else None


def strip_diacritics(s: str) -> str:
    """Decompose then drop combining marks so `kǎ` → `ka`, `bózi` → `bozi`."""
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


def term_appears_in_script(script_text: str, term: str) -> bool:
    """Case-insensitive, diacritic-insensitive substring match.

    For multi-word terms we collapse internal whitespace so `kǎ  bózi` in the
    registry and `Ka bozi` in the script both resolve to the same comparison
    key. We do NOT do word-boundary matching because Chinese terms have no
    spaces and English terms can appear in possessives ("cocom's", "ka-bozi's").
    """
    if not term:
        return False
    needle = strip_diacritics(term).lower().strip()
    haystack = strip_diacritics(script_text).lower()
    # Collapse multi-space in the needle to match relaxed copy/paste
    needle = re.sub(r"\s+", " ", needle)
    return needle in haystack


def claims_episode(concept: dict, slug: str) -> tuple[bool, list[str]]:
    """Return (claims_this_episode, reasons). reasons is for the report."""
    reasons: list[str] = []
    introduced = concept.get("introduced") or {}
    if introduced.get("episode") == slug:
        reasons.append("introduced")
    for ap in concept.get("appearances", []) or []:
        if (ap or {}).get("episode") == slug:
            reasons.append("appearance")
    return (bool(reasons), reasons)


# ─── Report ──────────────────────────────────────────────────────────────────


@dataclass
class MissingConcept:
    id: str
    reasons: list[str]
    searched_terms: list[str]


@dataclass
class CoverageReport:
    slug: str
    script_path: Path
    total_registry: int
    claimed: int
    matched: list[str] = field(default_factory=list)
    missing: list[MissingConcept] = field(default_factory=list)

    @property
    def has_failures(self) -> bool:
        return bool(self.missing)


# ─── Core check ──────────────────────────────────────────────────────────────


def check_coverage(slug: str) -> CoverageReport | None:
    script_path = find_script(slug)
    if script_path is None:
        return None

    if not CONCEPTS_FILE.is_file():
        return None

    try:
        registry = json.loads(CONCEPTS_FILE.read_text())
    except json.JSONDecodeError:
        return None

    script_text = script_path.read_text()
    concepts = registry.get("concepts", []) or []

    report = CoverageReport(
        slug=slug,
        script_path=script_path,
        total_registry=len(concepts),
        claimed=0,
    )

    for concept in concepts:
        cid = concept.get("id", "?")
        does_claim, reasons = claims_episode(concept, slug)
        if not does_claim:
            continue

        report.claimed += 1
        term = concept.get("term") or {}
        candidates = [term.get("en"), term.get("cn"), term.get("pinyin")]
        candidates = [c for c in candidates if c]

        if not candidates:
            # No discoverable form — can't match. Treat as missing so the
            # registry owner is forced to add at least term.en.
            report.missing.append(MissingConcept(
                id=cid, reasons=reasons,
                searched_terms=["(no term.en / term.cn / term.pinyin in registry)"],
            ))
            continue

        if any(term_appears_in_script(script_text, c) for c in candidates):
            report.matched.append(cid)
        else:
            report.missing.append(MissingConcept(
                id=cid, reasons=reasons, searched_terms=candidates,
            ))

    return report


# ─── Output ──────────────────────────────────────────────────────────────────


def print_human(report: CoverageReport, strict: bool) -> int:
    BOLD = "\033[1m"; RED = "\033[31m"; YELLOW = "\033[33m"; GREEN = "\033[32m"; DIM = "\033[2m"; RESET = "\033[0m"
    print(f"\n{BOLD}concept coverage: {report.slug}{RESET}")
    print(f"{DIM}  script:   {_relpath(report.script_path)}{RESET}")
    print(f"{DIM}  registry: {report.total_registry} concepts total, "
          f"{report.claimed} claimed by this episode, "
          f"{len(report.matched)} found, {len(report.missing)} missing{RESET}\n")

    if report.missing:
        color = RED if strict else YELLOW
        label = "ERROR" if strict else "WARN"
        print(f"{color}{BOLD}  {label}: {len(report.missing)} concept(s) claim this episode but their canonical term isn't in the script:{RESET}\n")
        for m in report.missing:
            print(f"    {color}•{RESET} {BOLD}{m.id}{RESET} ({', '.join(m.reasons)})")
            print(f"      {DIM}searched: {', '.join(repr(t) for t in m.searched_terms)}{RESET}")
        print(f"\n  {DIM}Triage: many concept term.en values are descriptive labels (\"1941 US oil "
              f"embargo on Japan\") that won't appear verbatim in narrative scripts. "
              f"For each row, decide:{RESET}")
        print(f"    {DIM}- Real drift (typo, renamed, removed)  → fix the script or the registry{RESET}")
        print(f"    {DIM}- Paraphrase OK                         → consider adding a term.cn / "
              f"alias variant to the registry{RESET}\n")
        return 1 if strict else 0

    print(f"{GREEN}{BOLD}  ✓ all {report.claimed} claimed concept(s) appear in the script.{RESET}\n")
    return 0


def print_json(report: CoverageReport, strict: bool) -> int:
    out = {
        "episode": report.slug,
        "script": _relpath(report.script_path),
        "registryTotal": report.total_registry,
        "claimedByEpisode": report.claimed,
        "matched": report.matched,
        "missing": [
            {"id": m.id, "reasons": m.reasons, "searchedTerms": m.searched_terms}
            for m in report.missing
        ],
        "strict": strict,
    }
    print(json.dumps(out, indent=2))
    if strict and report.has_failures:
        return 1
    return 0


# ─── CLI ─────────────────────────────────────────────────────────────────────


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="check_concept_coverage.py",
        description="Verify concepts claimed by an episode actually appear in its production script.",
    )
    parser.add_argument("episode", help="Episode slug")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    parser.add_argument(
        "--strict", action="store_true",
        help="Treat missing-term-in-script as a failure (exit 1). Default: informational warning only.",
    )
    args = parser.parse_args(argv)

    if not (EPISODES_ROOT / args.episode).is_dir():
        print(f"check_concept_coverage: episode dir not found: {EPISODES_ROOT / args.episode}", file=sys.stderr)
        return 2

    report = check_coverage(args.episode)
    if report is None:
        # Distinguish reasons for the operator
        script = find_script(args.episode)
        if script is None:
            print(f"check_concept_coverage: no production script found in {EPISODES_ROOT / args.episode}", file=sys.stderr)
        elif not CONCEPTS_FILE.is_file():
            print(f"check_concept_coverage: concept registry missing at {CONCEPTS_FILE}", file=sys.stderr)
        else:
            print("check_concept_coverage: concept registry is not valid JSON", file=sys.stderr)
        return 2

    return print_json(report, args.strict) if args.json else print_human(report, args.strict)


if __name__ == "__main__":
    sys.exit(main())
