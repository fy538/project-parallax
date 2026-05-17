#!/usr/bin/env python3
"""
zerohit_fallback.py — emit AI-gen briefs for stock-search zero-hit shots.

Failure mode this closes: every silicon-trap FOOTAGE slot returned
`"total_results": 0` from Pexels/Pixabay (asset-manifest.json), and there
was no auto-handoff to the local AI-gen pipeline (Recraft for stills, Flux 2
Pro on fal.ai for video). Prisoners-dilemma solved the same problem by
hand-maintaining a sibling AI-gen workflow (video-prompts.md,
chatgpt-prompts-v2.md, bakeoff/) that wasn't wired to the canonical asset-
source flow. This tool wires that fallback in.

Pipeline position:
   asset-source/source.py  →  asset-manifest.json (zero hits surface here)
   zerohit_fallback.py     →  ai-gen-briefs.md   (this file)
   recraft.py / fal.ai     →  generated stills/clips
   brand-treatment         →  final treated assets

For each zero-hit shot (or shot with `downloaded: []`), emits a structured
brief block: shot id, original search terms, production notes from the shot
list, recommended anchor (Recraft, A1-A7) + style ref (Flux, r1-r15), an
aspect/LUT suggestion, and a prose generation prompt seeded from shot notes.
The full anchor and style-ref catalogs are appended as a picker reference.

Usage:
    python3 tools/asset-source/zerohit_fallback.py silicon-trap
    python3 tools/asset-source/zerohit_fallback.py silicon-trap --output briefs.md
    python3 tools/asset-source/zerohit_fallback.py silicon-trap --count
    python3 tools/asset-source/zerohit_fallback.py --list

Exit codes:
    0 — brief generated (or zero zero-hits to brief in --count mode)
    1 — there ARE zero-hit shots (in --count mode; useful for CI gating)
    2 — usage error / missing episode / missing manifest
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
EPISODES_DIR = REPO_ROOT / "episodes"
ANCHOR_LIBRARY = REPO_ROOT / "tools" / "recraft" / "anchor-library.json"
STYLE_REF_INDEX = REPO_ROOT / "tools" / "ai-video" / "style-references" / "INDEX.md"


# ── Heuristic anchor/style-ref selection ──────────────────────────────────────
#
# Simple keyword routing. Not authoritative — the appended catalogs let the
# producer override. The goal is to give a good default so 80% of shots
# need no manual picking.

ANCHOR_KEYWORDS: dict[str, list[str]] = {
    # Anchor id → keyword bag (lowercase, substring match against search terms + notes)
    "A1": ["ruin", "empire", "fall", "decline", "ancient", "ottoman", "qing", "roman"],
    "A2": ["factory", "industrial", "construction", "chokepoint", "semiconductor",
           "fab", "manufacturing", "shipyard", "refinery", "plant"],
    "A3": ["map", "geography", "atlas", "satellite", "terrain", "border", "strait",
           "ocean", "continent", "region"],
    "A4": ["archival", "historical", "vintage", "newsreel", "footage", "1940",
           "1950", "1960", "1970", "1980"],
    "A5": ["protest", "crowd", "rally", "demonstration", "march", "uprising"],
    "A6": ["leader", "summit", "diplomat", "boardroom", "meeting", "press"],
    "A7": ["weapon", "military", "warship", "tank", "aircraft", "drone"],
}

STYLE_REF_KEYWORDS: dict[str, list[str]] = {
    "r1": ["face", "portrait", "close-up", "figure"],
    "r2": ["cleanroom", "lab", "sterile", "fab", "wafer"],
    "r3": ["cleanroom", "interior", "factory floor"],
    "r4": ["atmospheric", "haze", "dusk", "trap", "tension"],
    "r5": ["domestic", "home", "family", "intimate", "kitchen"],
    "r6": ["historical", "modernist", "vintage", "1950"],
    "r7": ["corridor", "abstract", "metaphor", "concept"],
    "r8": ["education", "school", "diagram", "instructional"],
    "r9": ["american", "fortune", "boardroom", "us"],
    "r10": ["japanese", "showa", "tokyo", "japan"],
    "r11": ["soviet", "constructivist", "russian", "ussr"],
    "r12": ["chinese", "literati", "ink-wash", "traditional china"],
    "r13": ["military", "warroom", "adversarial", "pentagon"],
    "r14": ["multi-figure", "group", "boardroom", "summit"],
    "r15": [],  # neutral default — fallback only
}


def _score_keywords(haystack: str, bag: list[str]) -> int:
    hl = haystack.lower()
    return sum(1 for kw in bag if kw in hl)


def suggest_anchor(search_terms: list[str], notes: str) -> str:
    """Return best-match Recraft anchor id, or 'A1' (channel default) if no hit."""
    haystack = " ".join(search_terms) + " " + (notes or "")
    scores = {aid: _score_keywords(haystack, kws) for aid, kws in ANCHOR_KEYWORDS.items()}
    best_id = max(scores, key=lambda k: scores[k])
    return best_id if scores[best_id] > 0 else "A1"


def suggest_style_ref(search_terms: list[str], notes: str) -> str:
    """Return best-match Flux style ref id, or 'r15' (neutral) if no hit."""
    haystack = " ".join(search_terms) + " " + (notes or "")
    scores = {rid: _score_keywords(haystack, kws) for rid, kws in STYLE_REF_KEYWORDS.items() if kws}
    best_id = max(scores, key=lambda k: scores[k])
    return best_id if scores[best_id] > 0 else "r15"


# ── Data loading ──────────────────────────────────────────────────────────────

def load_asset_manifest(slug: str) -> tuple[Path, dict]:
    """Find the most recent asset-manifest.json under episodes/<slug>/assets/."""
    ep_dir = EPISODES_DIR / slug
    if not ep_dir.is_dir():
        sys.exit(f"Error: episode directory not found: {ep_dir}")

    manifests = list(ep_dir.rglob("asset-manifest.json"))
    if not manifests:
        sys.exit(f"Error: no asset-manifest.json under {ep_dir} — run asset-source/source.py first.")
    # Pick the most recently modified one (handles multi-batch episodes).
    manifest_path = max(manifests, key=lambda p: p.stat().st_mtime)
    with open(manifest_path, encoding="utf-8") as f:
        return manifest_path, json.load(f)


def load_shot_list(slug: str) -> dict:
    """Build a dict of shot_id → shot entry (from shot-list.json)."""
    ep_dir = EPISODES_DIR / slug
    # Canonical filename. (Historical fallback to `shot-list-v2.json` dropped
    # May 17, 2026 — prisoners-dilemma promotion folded v2 into the canonical
    # name; no surviving consumers should produce v2-suffixed shot lists.)
    for fname in ("shot-list.json",):
        path = ep_dir / fname
        if path.is_file():
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            shots = data.get("assets") or data.get("shots") or []
            return {s["id"]: s for s in shots if "id" in s}
    return {}


def load_anchor_catalog() -> list[dict]:
    if not ANCHOR_LIBRARY.is_file():
        return []
    with open(ANCHOR_LIBRARY, encoding="utf-8") as f:
        return json.load(f).get("anchors", [])


def load_style_ref_catalog() -> str:
    """Return the INDEX.md content (as embedded reference). Empty if missing."""
    if not STYLE_REF_INDEX.is_file():
        return ""
    return STYLE_REF_INDEX.read_text(encoding="utf-8")


# ── Zero-hit detection ────────────────────────────────────────────────────────

def find_zero_hit_shots(manifest: dict) -> list[dict]:
    """Return asset entries with zero results OR zero successful downloads."""
    zero_hits = []
    for entry in manifest.get("assets", []):
        search = entry.get("search", {})
        total = search.get("total_results", 0)
        downloaded = [d for d in entry.get("downloaded", []) if d.get("status") != "failed"]
        if total == 0 or not downloaded:
            zero_hits.append(entry)
    return zero_hits


# ── Brief rendering ───────────────────────────────────────────────────────────

def render_shot_brief(entry: dict, shot_meta: dict, anchors: list[dict]) -> str:
    """Render a single zero-hit shot as a Markdown brief block."""
    shot_id = entry["id"]
    priority = entry.get("priority", "P?")
    search_terms = entry.get("search", {}).get("search_terms", [])
    media_type = entry.get("search", {}).get("media_type", "photo")
    notes = shot_meta.get("notes", "") if shot_meta else ""

    anchor_id = suggest_anchor(search_terms, notes)
    style_ref_id = suggest_style_ref(search_terms, notes)
    anchor = next((a for a in anchors if a.get("id") == anchor_id), None)
    anchor_name = anchor.get("name", "") if anchor else ""

    aspect = "1920×1080 still" if media_type == "photo" else "16:9 video, 5-8s"
    tool = "Recraft (still)" if media_type == "photo" else "Flux 2 Pro on fal.ai (video)"

    lines = [
        f"## {shot_id} ({priority})",
        "",
        f"**Original search** (zero hits on stock platforms):",
    ]
    for term in search_terms:
        lines.append(f"- `{term}`")
    lines.append("")
    if notes:
        lines.append(f"**Shot-list notes**: {notes}")
        lines.append("")
    lines.extend([
        f"**Suggested anchor** (Recraft): `{anchor_id}` — {anchor_name}",
        f"**Suggested style ref** (Flux): `{style_ref_id}` — see `tools/ai-video/style-references/{style_ref_id}_*.png`",
        f"**Target tool**: {tool}",
        f"**Format**: {aspect}",
        "",
        "**Generation prompt** (seed from anchor + shot context — edit before running):",
        "",
        "```",
    ])
    # Seed the prompt with the first search term + shot notes (producer edits).
    seed_subject = search_terms[0] if search_terms else shot_id
    lines.append(f"{seed_subject}. {notes}".strip())
    lines.append("```")
    lines.append("")
    lines.append("**Post-gen**: route through `tools/brand-treatment/treat.py` with `--ramp standard` (or `conflict`/`editorial` per shot register).")
    lines.append("")
    return "\n".join(lines)


def render_full_brief(slug: str, zero_hits: list[dict], shots: dict,
                      anchors: list[dict], style_ref_index: str) -> str:
    """Render the complete ai-gen-briefs.md content."""
    sections = []
    sections.append(f"# AI-Gen Briefs — `{slug}`")
    sections.append("")
    sections.append(f"_Generated by `tools/asset-source/zerohit_fallback.py`._")
    sections.append("")
    sections.append(
        f"**{len(zero_hits)} shot{'s' if len(zero_hits) != 1 else ''}** in this episode returned "
        "zero stock hits or zero successful downloads. Each entry below is a starter "
        "brief for the AI-gen fallback pipeline (Recraft for stills, Flux 2 Pro on fal.ai "
        "for video). Edit the prompts before generating — they're heuristic seeds, not "
        "production-ready copy."
    )
    sections.append("")
    sections.append("---")
    sections.append("")

    for entry in zero_hits:
        sections.append(render_shot_brief(entry, shots.get(entry["id"], {}), anchors))
        sections.append("---")
        sections.append("")

    # Appendix: full anchor catalog
    sections.append("# Appendix — Recraft Anchor Catalog (A1-A7)")
    sections.append("")
    sections.append("Override the heuristic suggestion above when none of the matches fit.")
    sections.append("")
    for anchor in anchors:
        sections.append(f"### `{anchor.get('id')}` — {anchor.get('name', '')}")
        use_cases = anchor.get("useCases", [])
        if use_cases:
            sections.append(f"_Use for_: {', '.join(use_cases)}")
        sections.append("")

    # Appendix: style ref index pointer
    if style_ref_index:
        sections.append("# Appendix — Flux Style Reference Catalog (r1-r15)")
        sections.append("")
        sections.append("Full index (with locks and LUT) at `tools/ai-video/style-references/INDEX.md`.")
        sections.append("")

    return "\n".join(sections)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", nargs="?", help="Episode slug")
    parser.add_argument("--output", "-o", type=Path,
                        help="Write to file instead of stdout (default: <ep>/ai-gen-briefs.md)")
    parser.add_argument("--count", action="store_true",
                        help="Print zero-hit count only; exit 1 if any exist (CI gate)")
    parser.add_argument("--list", action="store_true",
                        help="List episode slugs with an asset-manifest.json")
    args = parser.parse_args()

    if args.list:
        for ep_dir in sorted(EPISODES_DIR.iterdir()):
            if ep_dir.is_dir() and list(ep_dir.rglob("asset-manifest.json")):
                print(ep_dir.name)
        return 0

    if not args.slug:
        parser.error("episode slug required (or pass --list)")

    manifest_path, manifest = load_asset_manifest(args.slug)
    zero_hits = find_zero_hit_shots(manifest)

    if args.count:
        print(f"{args.slug}: {len(zero_hits)} zero-hit shot(s) of {len(manifest.get('assets', []))} total")
        return 1 if zero_hits else 0

    if not zero_hits:
        print(f"# AI-Gen Briefs — {args.slug}\n\nNo zero-hit shots — every asset has at least one successful download. Nothing to brief.\n")
        return 0

    shots = load_shot_list(args.slug)
    anchors = load_anchor_catalog()
    style_ref_index = load_style_ref_catalog()
    content = render_full_brief(args.slug, zero_hits, shots, anchors, style_ref_index)

    if args.output:
        out_path = args.output
    else:
        out_path = EPISODES_DIR / args.slug / "ai-gen-briefs.md"

    out_path.write_text(content, encoding="utf-8")
    # Graceful fallback when out_path lives outside the repo (e.g. test tmp_path)
    def _safe_rel(p: Path) -> str:
        try:
            return str(p.relative_to(REPO_ROOT))
        except ValueError:
            return str(p)
    print(f"Wrote {len(zero_hits)} brief(s) to {_safe_rel(out_path)}")
    print(f"(source manifest: {_safe_rel(manifest_path)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
