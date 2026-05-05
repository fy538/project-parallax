#!/usr/bin/env python3
"""
validate_data.py — JSON validation for the Parallax repo.

Three layers:
  1. Well-formedness — every *.json under data/, episodes/, and remotion-templates/data/
     parses as valid JSON.
  2. Schema validation (when jsonschema is installed) — assembly manifests, the concept
     registry, and shot lists are checked against their JSON Schemas.
  3. Palette compliance (L19) — every #RRGGBB string in template data files must be a
     value that appears in tools/brand-treatment/palette.json. Catches off-brand hex
     values pasted into JSON before they make it into a render.

Usage:
  python3 tools/validate_data.py                      # validate everything
  python3 tools/validate_data.py --files <a> <b>      # validate specific files (pre-commit)
  python3 tools/validate_data.py --episode <slug>     # validate one episode
  python3 tools/validate_data.py --no-palette         # skip palette check (Layer 3)

Exits non-zero on any failure. Designed to be cheap enough for pre-commit.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent

# Schema mappings: glob pattern → schema path
SCHEMAS = [
    (
        "remotion-templates/data/episodes/*/assembly-manifest.json",
        "remotion-templates/data/assembly-manifest.schema.json",
    ),
    (
        "data/concepts.json",
        "data/concept-registry.schema.json",
    ),
    (
        "episodes/*/shot-list.json",
        "data/shot-list.schema.json",
    ),
]

# Palette source of truth (L19). Hex values here are normalized lowercase.
PALETTE_PATH = ROOT / "tools" / "brand-treatment" / "palette.json"

# Hex values always allowed: pure black, pure white, fully transparent.
HEX_ALLOWED_ALWAYS = {"#000000", "#ffffff", "#00000000", "#ffffffff"}

# Regex matching #RRGGBB or #RRGGBBAA (case-insensitive). #RGB shortform is rare in
# this codebase and intentionally skipped — be explicit.
HEX_RE = re.compile(r"#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?")


def load_palette_hex_set() -> set[str]:
    """Return every hex value that appears anywhere in palette.json, lowercased."""
    if not PALETTE_PATH.exists():
        return set()
    try:
        data = json.loads(PALETTE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return set()
    hex_values: set[str] = set()

    def walk(node: object) -> None:
        if isinstance(node, dict):
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
        elif isinstance(node, str):
            for m in HEX_RE.finditer(node):
                hex_values.add(m.group(0).lower())

    walk(data)
    return hex_values


def find_json_files(filter_paths: Optional[list[Path]] = None) -> list[Path]:
    """Return all JSON files under the project, optionally filtered to a given list."""
    candidates: list[Path] = []
    for sub in ("data", "episodes", "remotion-templates/data"):
        d = ROOT / sub
        if d.exists():
            candidates.extend(d.rglob("*.json"))
    # Skip schemas themselves (they're meta)
    candidates = [p for p in candidates if not p.name.endswith(".schema.json")]
    # Skip node_modules
    candidates = [p for p in candidates if "node_modules" not in p.parts]
    if filter_paths:
        wanted = {p.resolve() for p in filter_paths}
        candidates = [p for p in candidates if p.resolve() in wanted]
    return sorted(candidates)


def validate_wellformed(path: Path) -> Optional[str]:
    """Return None on success, or an error string."""
    try:
        with open(path, encoding="utf-8") as f:
            json.load(f)
        return None
    except json.JSONDecodeError as e:
        return f"{e.lineno}:{e.colno}: {e.msg}"
    except OSError as e:
        return f"read error: {e}"


def schema_for(path: Path) -> Optional[Path]:
    """Return the schema path that applies to this file, if any."""
    rel = path.relative_to(ROOT)
    for pattern, schema_rel in SCHEMAS:
        if rel.match(pattern):
            schema_path = ROOT / schema_rel
            if schema_path.exists():
                return schema_path
    return None


def validate_schema(path: Path, schema_path: Path) -> Optional[str]:
    """Validate against JSON Schema. Returns None on success, error string on failure."""
    try:
        import jsonschema  # type: ignore[import-untyped]
    except ImportError:
        return None  # silently skip — well-formedness check still ran
    try:
        with open(schema_path, encoding="utf-8") as f:
            schema = json.load(f)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        jsonschema.validate(data, schema)
        return None
    except jsonschema.ValidationError as e:
        # Truncate huge validator output; show the path that failed and the message
        loc = "/".join(str(x) for x in e.absolute_path) or "<root>"
        return f"schema error at {loc}: {e.message}"
    except Exception as e:
        return f"schema validation crashed: {e}"


def is_template_data_file(path: Path) -> bool:
    """Heuristic: only template data files (Remotion JSON inputs) need palette compliance.
    Skip schemas, manifests, registries, and config files where hex values may legitimately
    appear for tooling reasons (e.g. palette.json itself, concept registry accent overrides).
    """
    rel = path.relative_to(ROOT)
    s = str(rel)
    if s.endswith(".schema.json"):
        return False
    if "assembly-manifest.json" in s:
        return False
    # Skip archived/deprecated data files — they're snapshots, not active assets.
    if "_deprecated" in rel.parts or any("_deprecated" in p for p in rel.parts):
        return False
    # Concepts registry has accentColor strings that must come from palette anyway,
    # but schema validation already covers it. Don't double-flag.
    if rel == Path("data/concepts.json"):
        return False
    return s.startswith("remotion-templates/data/episodes/")


def validate_palette(path: Path, allowed: set[str]) -> Optional[str]:
    """Layer 3: scan a template data file for hex values not in palette.json."""
    if not allowed:
        return None  # palette didn't load; skip silently
    text = path.read_text(encoding="utf-8")
    bad: list[str] = []
    seen: set[str] = set()
    for m in HEX_RE.finditer(text):
        hex_val = m.group(0).lower()
        if hex_val in HEX_ALLOWED_ALWAYS or hex_val in allowed:
            continue
        # 8-char #RRGGBBAA: if the RRGGBB prefix is in the palette, accept (alpha overlay)
        if len(hex_val) == 9 and hex_val[:7] in allowed:
            continue
        if hex_val in seen:
            continue
        seen.add(hex_val)
        bad.append(hex_val)
    if not bad:
        return None
    return f"off-palette hex value(s): {', '.join(sorted(bad))}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Parallax JSON data files.")
    parser.add_argument(
        "--files",
        nargs="*",
        type=Path,
        help="Validate only these specific files (used by pre-commit hook).",
    )
    parser.add_argument(
        "--episode",
        help="Validate only files under episodes/<slug>/ and remotion-templates/data/episodes/<slug>/.",
    )
    parser.add_argument(
        "--no-palette",
        action="store_true",
        help="Skip Layer 3 (palette compliance) check.",
    )
    args = parser.parse_args()

    filter_paths: Optional[list[Path]] = None
    if args.files:
        filter_paths = [p for p in args.files if p.suffix == ".json"]
        if not filter_paths:
            return 0  # no JSON in changeset
    elif args.episode:
        filter_paths = []
        for sub in (
            ROOT / "episodes" / args.episode,
            ROOT / "remotion-templates" / "data" / "episodes" / args.episode,
        ):
            if sub.exists():
                filter_paths.extend(sub.rglob("*.json"))
        if not filter_paths:
            print(f"No JSON files found for episode '{args.episode}'", file=sys.stderr)
            return 1

    files = find_json_files(filter_paths)
    if not files:
        print("No JSON files to validate.")
        return 0

    failures = 0
    palette_allowed = set() if args.no_palette else load_palette_hex_set()
    palette_files_checked = 0

    for path in files:
        rel = path.relative_to(ROOT)
        # Layer 1: well-formedness
        err = validate_wellformed(path)
        if err:
            print(f"✗ {rel}: malformed JSON — {err}", file=sys.stderr)
            failures += 1
            continue
        # Layer 2: schema (if applicable and library installed)
        schema_path = schema_for(path)
        if schema_path:
            err = validate_schema(path, schema_path)
            if err:
                print(f"✗ {rel}: {err}", file=sys.stderr)
                failures += 1
        # Layer 3: palette compliance (template data files only)
        if palette_allowed and is_template_data_file(path):
            palette_files_checked += 1
            err = validate_palette(path, palette_allowed)
            if err:
                print(f"✗ {rel}: {err}", file=sys.stderr)
                failures += 1

    if failures:
        print(f"\n{failures} file(s) failed validation.", file=sys.stderr)
        return 1
    extra = f" (palette: {palette_files_checked})" if palette_files_checked else ""
    print(f"✓ {len(files)} JSON file(s) validated{extra}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
