#!/usr/bin/env python3
"""
validate-data.py — JSON validation for the Parallax repo.

Two layers:
  1. Well-formedness — every *.json under data/, episodes/, and remotion-templates/data/
     parses as valid JSON.
  2. Schema validation (when jsonschema is installed) — assembly manifests, the concept
     registry, and shot lists are checked against their JSON Schemas.

Usage:
  python3 tools/validate-data.py                      # validate everything
  python3 tools/validate-data.py --files <a> <b>      # validate specific files (pre-commit)
  python3 tools/validate-data.py --episode <slug>     # validate one episode

Exits non-zero on any failure. Designed to be cheap enough for pre-commit.
"""

import argparse
import json
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

    if failures:
        print(f"\n{failures} file(s) failed validation.", file=sys.stderr)
        return 1
    print(f"✓ {len(files)} JSON file(s) validated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
