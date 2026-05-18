#!/usr/bin/env python3
"""
validate_data.py — JSON validation for the Parallax repo.

Three hard layers (failures exit non-zero):
  1. Well-formedness — every *.json under data/, episodes/, and remotion-templates/data/
     parses as valid JSON.
  2. Schema validation (when jsonschema is installed) — assembly manifests, the concept
     registry, and shot lists are checked against their JSON Schemas.
  3. Palette compliance (L19) — every #RRGGBB string in template data files must be a
     value that appears in tools/brand-treatment/palette.json. Catches off-brand hex
     values pasted into JSON before they make it into a render.

Plus one soft layer (warnings, do not fail the run):
  4. Audio asset existence — for every assembly-manifest.json, check that referenced
     music-bed / SFX / texture audio files exist under remotion-templates/public/.
     Reports missing files so a render doesn't hang waiting for an asset that was
     never sourced. Soft because audio assets are typically pre-launch work-in-progress.

Usage:
  python3 tools/validate_data.py                      # validate everything (Layers 1-3 + soft 4)
  python3 tools/validate_data.py --files <a> <b>      # validate specific files (pre-commit)
  python3 tools/validate_data.py --episode <slug>     # validate one episode
  python3 tools/validate_data.py --no-palette         # skip palette check (Layer 3)
  python3 tools/validate_data.py --no-audio           # skip audio existence check (Layer 4)
  python3 tools/validate_data.py --audio-strict       # fail on missing audio files

Exits non-zero on hard-layer failure. Designed to be cheap enough for pre-commit.
"""

import argparse
import json
import re
import sys
from pathlib import Path

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
        "data/predictions-log.json",
        "data/predictions-log.schema.json",
    ),
    (
        "episodes/*/shot-list.json",
        "data/shot-list.schema.json",
    ),
    # Visual-identity files were schema-less when Tier 4 wired up
    # `npm run gen:types` for the cross-language types. The TS side
    # (`remotion-templates/src/types/generated/visual-identity.d.ts`) was
    # locked to the schema while the Python producer side wasn't — half-
    # wired contract. Audit P1 fix May 18, 2026.
    (
        "episodes/*/visual-identity.json",
        "data/visual-identity.schema.json",
    ),
]

# Palette source of truth (L19). Hex values here are normalized lowercase.
PALETTE_PATH = ROOT / "tools" / "brand-treatment" / "palette.json"
PUBLIC_DIR = ROOT / "remotion-templates" / "public"

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


def find_json_files(filter_paths: list[Path] | None = None) -> list[Path]:
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


def validate_wellformed(path: Path) -> str | None:
    """Return None on success, or an error string."""
    try:
        with open(path, encoding="utf-8") as f:
            json.load(f)
        return None
    except json.JSONDecodeError as e:
        return f"{e.lineno}:{e.colno}: {e.msg}"
    except OSError as e:
        return f"read error: {e}"


def schema_for(path: Path) -> Path | None:
    """Return the schema path that applies to this file, if any."""
    rel = path.relative_to(ROOT)
    for pattern, schema_rel in SCHEMAS:
        if rel.match(pattern):
            schema_path = ROOT / schema_rel
            if schema_path.exists():
                return schema_path
    return None


def validate_schema(path: Path, schema_path: Path) -> str | None:
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
    except (jsonschema.SchemaError, json.JSONDecodeError, OSError) as e:
        # SchemaError: the schema itself is malformed (vs the data). Modern
        # jsonschema (>=4.18) raises this for unresolvable $refs too, so a
        # separate RefResolutionError catch is redundant + deprecated.
        # JSONDecodeError: the data or schema file isn't valid JSON.
        # OSError: schema or data file couldn't be read.
        # Other exceptions (e.g. a TypeError from our own conversion code)
        # bubble — that's a bug we want to see, not "schema validation crashed."
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


def validate_palette(path: Path, allowed: set[str]) -> str | None:
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


# ── Layer 4: Audio asset existence ──────────────────────────────────────────


def _expected_audio_files(manifest: dict, episode_slug: str) -> set[str]:
    """Compute every audio file path the AudioLayer would request for this manifest.

    Returns a set of paths relative to public/ — the same shape staticFile()
    receives in AudioLayer.tsx (music beds, transition SFX, texture hits).
    """
    paths: set[str] = set()
    music = manifest.get("musicBed", {}) or {}
    for track in music.get("tracks", []) or []:
        f = track.get("file")
        if f:
            paths.add(f"episodes/{episode_slug}/{f}")
    for seg in manifest.get("segments", []) or []:
        for cue_key in ("soundCue", "soundCueSecondary"):
            cue = seg.get(cue_key)
            if not cue:
                continue
            cue_type = cue.get("type")
            intensity = cue.get("intensity", "normal")
            if cue_type:
                paths.add(f"audio/sfx/transitions/{cue_type}-{intensity}.wav")
        for hit in seg.get("textureCues", []) or []:
            t = hit.get("type")
            if t:
                paths.add(f"audio/sfx/textures/{t}.wav")
    return paths


def check_audio_assets(manifest_path: Path) -> tuple[int, list[str]]:
    """Layer 4 — soft check that referenced audio files exist on disk.

    Returns (count_referenced, list_of_missing_paths). The caller decides
    whether to surface as a warning or fail the validation run.
    """
    if not PUBLIC_DIR.exists():
        return (0, [])
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return (0, [])
    slug = manifest.get("episode", manifest_path.parent.name)
    referenced = _expected_audio_files(manifest, slug)
    missing = sorted(p for p in referenced if not (PUBLIC_DIR / p).exists())
    return (len(referenced), missing)


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
    parser.add_argument(
        "--no-audio",
        action="store_true",
        help="Skip Layer 4 (audio asset existence) check.",
    )
    parser.add_argument(
        "--audio-strict",
        action="store_true",
        help="Treat missing audio files as failures (default: soft warnings).",
    )
    args = parser.parse_args()

    filter_paths: list[Path] | None = None
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

    # Layer 4 (soft): audio asset existence on assembly manifests
    audio_warnings = 0
    audio_referenced_total = 0
    audio_missing_total = 0
    if not args.no_audio:
        for path in files:
            if path.name != "assembly-manifest.json":
                continue
            referenced, missing = check_audio_assets(path)
            audio_referenced_total += referenced
            audio_missing_total += len(missing)
            if missing:
                rel = path.relative_to(ROOT)
                marker = "✗" if args.audio_strict else "⚠"
                print(
                    f"{marker} {rel}: {len(missing)}/{referenced} audio file(s) missing",
                    file=sys.stderr,
                )
                for m in missing[:5]:  # cap noise; first 5 is enough to act on
                    print(f"    – public/{m}", file=sys.stderr)
                if len(missing) > 5:
                    print(f"    … and {len(missing) - 5} more", file=sys.stderr)
                if args.audio_strict:
                    failures += 1
                else:
                    audio_warnings += 1

    if failures:
        print(f"\n{failures} file(s) failed validation.", file=sys.stderr)
        return 1
    extras = []
    if palette_files_checked:
        extras.append(f"palette: {palette_files_checked}")
    if audio_referenced_total:
        present = audio_referenced_total - audio_missing_total
        extras.append(f"audio: {present}/{audio_referenced_total}")
    extra_str = f" ({', '.join(extras)})" if extras else ""
    msg = f"✓ {len(files)} JSON file(s) validated{extra_str}."
    if audio_warnings:
        msg += f"  [{audio_warnings} manifest(s) reference missing audio — see warnings above]"
    print(msg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
