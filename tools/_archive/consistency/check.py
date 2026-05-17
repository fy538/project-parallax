#!/usr/bin/env python3
"""
Parallax Visual Consistency Checker — validate design system compliance across episodes.

Scans all JSON data files in remotion-templates/data/episodes/ and validates consistency
against the design system defined in BRAND.md and theme.ts.

Checks:
  1. Color palette compliance — hex values against approved palette
  2. Duration sanity — durationSec between 3-30 seconds
  3. Required fields — episode field matches folder name
  4. Background variant consistency — track usage across episode
  5. Text length limits — flag fields exceeding 80 characters
  6. Cross-file entity consistency — same entities use same colors

Usage:
  python check.py                    # Check all episodes
  python check.py --episode ep01     # Check specific episode
  python check.py --verbose          # Show passing checks too
  python check.py --fix-colors       # Suggest closest palette color for non-standard hex
"""

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Tuple, Set

# ── Configuration ────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = PROJECT_ROOT / "remotion-templates" / "data" / "episodes"

# Load palette from single source of truth
sys.path.insert(0, str(PROJECT_ROOT / "tools" / "brand-treatment"))
sys.path.insert(0, str(PROJECT_ROOT / "tools" / "shared"))
from palette_loader import load_palette, get_all_approved_colors  # noqa: E402
from color_utils import hex_to_rgb, euclidean_distance  # noqa: E402

_palette_data = load_palette()
PALETTE = {k: v.upper() for k, v in _palette_data["palette"].items()}
SEMANTIC = {k: v.upper() for k, v in _palette_data["semantic"].items()}

# Build complete approved color set from palette.json
APPROVED_COLORS: Set[str] = get_all_approved_colors()


def find_closest_color(hex_color: str, palette_dict: Dict[str, str]) -> Tuple[str, str, float]:
    """
    Find the closest approved color to a given hex value.

    Returns: (palette_name, hex_value, distance)
    """
    try:
        target_rgb = hex_to_rgb(hex_color)
    except ValueError:
        return ("unknown", "#000000", float("inf"))

    closest_name = None
    closest_hex = None
    closest_dist = float("inf")

    for name, hex_val in palette_dict.items():
        try:
            rgb = hex_to_rgb(hex_val)
            dist = euclidean_distance(target_rgb, rgb)
            if dist < closest_dist:
                closest_dist = dist
                closest_name = name
                closest_hex = hex_val
        except ValueError:
            continue

    return (closest_name, closest_hex, closest_dist)


def extract_colors_from_json(data: dict, path: str = "") -> Dict[str, List[str]]:
    """
    Recursively extract all color-like hex values from JSON structure.

    Returns: {field_path: [hex_colors]}
    """
    colors = defaultdict(list)

    if isinstance(data, dict):
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key

            if isinstance(value, str) and _looks_like_hex_color(value):
                colors[current_path].append(value)
            elif isinstance(value, (dict, list)):
                nested_colors = extract_colors_from_json(value, current_path)
                colors.update(nested_colors)

    elif isinstance(data, list):
        for idx, item in enumerate(data):
            current_path = f"{path}[{idx}]"
            if isinstance(item, str) and _looks_like_hex_color(item):
                colors[current_path].append(item)
            elif isinstance(item, (dict, list)):
                nested_colors = extract_colors_from_json(item, current_path)
                colors.update(nested_colors)

    return colors


def _looks_like_hex_color(value: str) -> bool:
    """Check if a string looks like a hex color."""
    if not isinstance(value, str):
        return False
    if not value.startswith("#"):
        return False
    hex_part = value[1:]
    return len(hex_part) == 6 and all(c in "0123456789ABCDEFabcdef" for c in hex_part)


def extract_text_fields(data: dict, path: str = "") -> Dict[str, List[str]]:
    """
    Recursively extract text fields that might be too long.

    Returns: {field_path: [text_values]}
    """
    texts = defaultdict(list)
    text_field_keywords = {"label", "title", "subtitle", "text", "name", "sublabel", "description"}

    if isinstance(data, dict):
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key

            # Capture text fields that could overflow
            if key in text_field_keywords and isinstance(value, str) and len(value) > 0:
                texts[current_path].append(value)

            # Recurse
            if isinstance(value, (dict, list)):
                nested = extract_text_fields(value, current_path)
                texts.update(nested)

    elif isinstance(data, list):
        for idx, item in enumerate(data):
            current_path = f"{path}[{idx}]"
            if isinstance(item, (dict, list)):
                nested = extract_text_fields(item, current_path)
                texts.update(nested)

    return texts


def load_json_file(path: Path) -> dict:
    """Load and parse JSON file."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        return {"_error": str(e)}


# ── Check Functions ─────────────────────────────────────────────────────────


class ConsistencyChecker:
    """Orchestrate all consistency checks for an episode."""

    def __init__(self, episode_id: str, verbose: bool = False, fix_colors: bool = False):
        self.episode_id = episode_id.lower()
        self.verbose = verbose
        self.fix_colors = fix_colors

        self.episode_dir = DATA_DIR / f"ep{episode_id.lstrip('ep').zfill(2)}"
        self.json_files: List[Path] = []
        self.results = {
            "palette": {"passed": 0, "failed": 0, "warnings": []},
            "duration": {"passed": 0, "failed": 0, "failures": []},
            "required_fields": {"passed": 0, "failed": 0, "failures": []},
            "bg_variants": {"variants": Counter(), "warnings": []},
            "text_lengths": {"passed": 0, "failed": 0, "failures": []},
            "entity_colors": {"passed": 0, "failed": 0, "conflicts": []},
        }
        self.entity_color_map = defaultdict(dict)  # {entity: {color: [files]}}

    def discover_files(self):
        """Find all JSON files to check."""
        if not self.episode_dir.exists():
            print(f"  Error: Episode directory not found at {self.episode_dir}")
            return False

        # Find all .json files except assembly manifest and deprecated
        self.json_files = [
            f
            for f in self.episode_dir.glob("*.json")
            if f.name != "assembly-manifest.json" and "_deprecated" not in str(f)
        ]

        if not self.json_files:
            print(f"  No JSON files found in {self.episode_dir}")
            return False

        return True

    def check_all(self):
        """Run all checks."""
        for json_file in self.json_files:
            data = load_json_file(json_file)

            if "_error" in data:
                print(f"  Error parsing {json_file.name}: {data['_error']}")
                continue

            self.check_palette(json_file, data)
            self.check_duration(json_file, data)
            self.check_required_fields(json_file, data)
            self.check_bg_variants(json_file, data)
            self.check_text_lengths(json_file, data)
            self.check_entity_colors(json_file, data)

    def check_palette(self, json_file: Path, data: dict):
        """Check 1: Color palette compliance."""
        colors = extract_colors_from_json(data)
        file_key = json_file.name

        for field_path, hex_list in colors.items():
            for hex_color in hex_list:
                hex_upper = hex_color.upper()
                if hex_upper in APPROVED_COLORS:
                    self.results["palette"]["passed"] += 1
                else:
                    self.results["palette"]["failed"] += 1
                    closest_name, closest_hex, distance = find_closest_color(
                        hex_upper,
                        {**PALETTE, **SEMANTIC},
                    )
                    warning = {
                        "file": file_key,
                        "field": field_path,
                        "hex": hex_upper,
                        "closest": closest_name,
                        "closest_hex": closest_hex,
                    }
                    self.results["palette"]["warnings"].append(warning)

    def check_duration(self, json_file: Path, data: dict):
        """Check 2: Duration range 3-30 seconds."""
        duration = data.get("durationSec")

        if duration is None:
            # Not all files have duration
            self.results["duration"]["passed"] += 1
        elif isinstance(duration, (int, float)):
            if 3 <= duration <= 30:
                self.results["duration"]["passed"] += 1
            else:
                self.results["duration"]["failed"] += 1
                self.results["duration"]["failures"].append(
                    {
                        "file": json_file.name,
                        "duration": duration,
                        "range": "3-30s",
                    }
                )
        else:
            self.results["duration"]["failed"] += 1
            self.results["duration"]["failures"].append(
                {
                    "file": json_file.name,
                    "duration": duration,
                    "error": "not a number",
                }
            )

    def check_required_fields(self, json_file: Path, data: dict):
        """Check 3: Required 'episode' field matches folder."""
        episode_field = data.get("episode", "").upper()
        expected_ep = f"EP{self.episode_id.lstrip('ep').zfill(2)}"

        # Accept variations like "EP01", "01", "ep01"
        if episode_field and expected_ep in episode_field.upper():
            self.results["required_fields"]["passed"] += 1
        else:
            self.results["required_fields"]["failed"] += 1
            self.results["required_fields"]["failures"].append(
                {
                    "file": json_file.name,
                    "episode_field": episode_field or "(missing)",
                    "expected": expected_ep,
                }
            )

    def check_bg_variants(self, json_file: Path, data: dict):
        """Check 4: Background variant consistency."""
        variant = data.get("backgroundVariant")
        if variant:
            self.results["bg_variants"]["variants"][variant] += 1

        # Track if too many variants
        if len(self.results["bg_variants"]["variants"]) > 2:
            if not self.results["bg_variants"]["warnings"]:
                self.results["bg_variants"]["warnings"].append(
                    f"More than 2 background variants used: {dict(self.results['bg_variants']['variants'])}"
                )

    def check_text_lengths(self, json_file: Path, data: dict):
        """Check 5: Text field length limits."""
        texts = extract_text_fields(data)
        file_key = json_file.name

        for field_path, text_list in texts.items():
            for text in text_list:
                if len(text) > 80:
                    self.results["text_lengths"]["failed"] += 1
                    self.results["text_lengths"]["failures"].append(
                        {
                            "file": file_key,
                            "field": field_path,
                            "length": len(text),
                            "text": text[:50] + "...",
                        }
                    )
                else:
                    self.results["text_lengths"]["passed"] += 1

    def check_entity_colors(self, json_file: Path, data: dict):
        """Check 6: Cross-file entity color consistency."""
        file_key = json_file.name

        # Extract entity-color pairs from common fields
        entities_in_file = self._extract_entities(data)

        for entity, color in entities_in_file:
            if entity:
                # Track which files use which color for this entity
                if color not in self.entity_color_map[entity]:
                    self.entity_color_map[entity][color] = []
                self.entity_color_map[entity][color].append(file_key)

    def _extract_entities(self, data: dict, parent_key: str = "") -> List[Tuple[str, str]]:
        """Extract (entity_name, color) pairs from JSON structure."""
        entities = []

        # Look for common entity+color patterns
        if isinstance(data, dict):
            # Pattern: points/locations with name and color
            if "points" in data and isinstance(data["points"], list):
                for point in data["points"]:
                    if isinstance(point, dict):
                        name = point.get("name") or point.get("label")
                        color = point.get("color")
                        if name and color:
                            entities.append((name, color))

            # Pattern: comparison groups with colors
            if "leftGroupColor" in data and "rightGroupColor" in data:
                left_name = data.get("leftGroupLabel", "left")
                right_name = data.get("rightGroupLabel", "right")
                entities.append((left_name, data["leftGroupColor"]))
                entities.append((right_name, data["rightGroupColor"]))

            # Pattern: sublabel items
            if "sublabel" in data and "color" in data:
                sublabel = data.get("sublabel")
                color = data.get("color")
                if sublabel and color:
                    entities.append((sublabel, color))

            # Recurse into nested structures
            for value in data.values():
                if isinstance(value, (dict, list)):
                    entities.extend(self._extract_entities(value, parent_key))

        elif isinstance(data, list):
            for item in data:
                if isinstance(item, (dict, list)):
                    entities.extend(self._extract_entities(item, parent_key))

        return entities

    def finalize_entity_check(self):
        """Check for entity color conflicts across files."""
        for entity, color_map in self.entity_color_map.items():
            if len(color_map) > 1:
                # Conflict: same entity, different colors
                self.results["entity_colors"]["failed"] += 1
                self.results["entity_colors"]["conflicts"].append(
                    {
                        "entity": entity,
                        "colors": {color: files for color, files in color_map.items()},
                    }
                )
            elif len(color_map) == 1:
                self.results["entity_colors"]["passed"] += 1

    def print_report(self):
        """Print formatted consistency check report."""
        ep_name = f"EP{self.episode_id.lstrip('ep').zfill(2)}"

        print()
        print("╔" + "═" * (len(ep_name) + 30) + "╗")
        print(f"║ Consistency Check: {ep_name:<{len(ep_name) + 10}}║")
        print("╚" + "═" * (len(ep_name) + 30) + "╝")
        print()

        # Color Palette
        print("✓ Color palette:")
        palette_passed = self.results["palette"]["passed"]
        palette_total = palette_passed + self.results["palette"]["failed"]
        print(f"  {palette_passed}/{palette_total} values from approved palette")

        if self.results["palette"]["warnings"]:
            for warn in self.results["palette"]["warnings"]:
                if self.fix_colors:
                    print(
                        f"  ⚠ {warn['file']}: {warn['hex']} "
                        f"→ {warn['closest']} ({warn['closest_hex']})"
                    )
                else:
                    print(f"  ⚠ {warn['file']}: {warn['hex']} (closest: {warn['closest']})")
        print()

        # Duration
        print("✓ Duration range (3-30s):")
        duration_passed = self.results["duration"]["passed"]
        duration_total = duration_passed + self.results["duration"]["failed"]
        if duration_total > 0:
            print(f"  {duration_passed}/{duration_total} files in valid range")
            if self.results["duration"]["failures"]:
                for failure in self.results["duration"]["failures"]:
                    duration = failure.get("duration", "?")
                    print(f"  ✗ {failure['file']}: {duration}s")
        else:
            print("  (no files with durationSec)")
        print()

        # Required Fields
        print("✓ Required fields (episode):")
        req_passed = self.results["required_fields"]["passed"]
        req_total = req_passed + self.results["required_fields"]["failed"]
        print(f"  {req_passed}/{req_total} files have valid episode field")
        if self.results["required_fields"]["failures"]:
            for failure in self.results["required_fields"]["failures"]:
                print(f"  ✗ {failure['file']}: found {failure['episode_field']}, expected {failure['expected']}")
        print()

        # Background Variants
        print("✓ Background variants:")
        variants = self.results["bg_variants"]["variants"]
        if variants:
            variant_str = ", ".join(f"{k} ({v})" for k, v in sorted(variants.items()))
            print(f"  {variant_str}")
            if len(variants) > 2:
                print(f"  ⚠ More than 2 variants detected (should be primarily 'light' + occasional 'dark')")
        else:
            print("  (no backgroundVariant fields)")
        print()

        # Text Lengths
        print("✓ Text length limits (≤80 chars):")
        text_passed = self.results["text_lengths"]["passed"]
        text_total = text_passed + self.results["text_lengths"]["failed"]
        print(f"  {text_passed}/{text_total} text fields within limits")
        if self.results["text_lengths"]["failures"]:
            for failure in self.results["text_lengths"]["failures"]:
                print(f"  ✗ {failure['file']} / {failure['field']}: {failure['length']} chars")
        print()

        # Entity Colors
        print("✓ Entity color consistency:")
        entity_passed = self.results["entity_colors"]["passed"]
        entity_total = entity_passed + self.results["entity_colors"]["failed"]
        if entity_total > 0:
            print(f"  {entity_passed}/{entity_total} entities consistent across files")
            if self.results["entity_colors"]["conflicts"]:
                for conflict in self.results["entity_colors"]["conflicts"]:
                    entity = conflict["entity"]
                    colors_info = " | ".join(
                        f"{color} in {', '.join(files)}"
                        for color, files in conflict["colors"].items()
                    )
                    print(f"  ✗ {entity}: {colors_info}")
        else:
            print("  (no entities with colors detected)")
        print()

        # Summary
        checks_total = 6
        checks_passed = sum(
            1
            for k in [
                "palette",
                "duration",
                "required_fields",
                "text_lengths",
                "entity_colors",
            ]
            if self.results[k].get("failed", 0) == 0
        )
        # bg_variants always passes (just warns if >2)
        if not self.results["bg_variants"]["warnings"]:
            checks_passed += 1

        warnings_total = (
            len(self.results["palette"]["warnings"])
            + len(self.results["duration"]["failures"])
            + len(self.results["required_fields"]["failures"])
            + len(self.results["text_lengths"]["failures"])
            + len(self.results["entity_colors"]["conflicts"])
        )

        print(f"Summary: {checks_passed}/{checks_total} checks passed, {warnings_total} warning(s)")
        print("╚" + "═" * 60 + "╝")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Parallax Visual Consistency Checker",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--episode",
        default="ep01",
        help="Episode to check (e.g., ep01, ep02) [default: ep01]",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show passing checks too",
    )
    parser.add_argument(
        "--fix-colors",
        action="store_true",
        help="Suggest closest palette color for non-standard hex values",
    )

    args = parser.parse_args()

    checker = ConsistencyChecker(args.episode, verbose=args.verbose, fix_colors=args.fix_colors)

    if not checker.discover_files():
        sys.exit(1)

    print(f"Checking {len(checker.json_files)} JSON file(s)...")

    checker.check_all()
    checker.finalize_entity_check()
    checker.print_report()


if __name__ == "__main__":
    main()
