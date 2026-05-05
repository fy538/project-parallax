"""
Tests for tools/validate_data.py — JSON well-formedness + schema validation.

Run: pytest tools/test_validate_data.py -v
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import validate_data as vd


# ── validate_wellformed — Layer 1 check ───────────────────────────────────


def test_wellformed_valid_json(tmp_path):
    p = tmp_path / "good.json"
    p.write_text('{"a": 1}', encoding="utf-8")
    assert vd.validate_wellformed(p) is None


def test_wellformed_malformed_json(tmp_path):
    p = tmp_path / "bad.json"
    p.write_text('{"a": 1,', encoding="utf-8")  # trailing comma, missing brace
    err = vd.validate_wellformed(p)
    assert err is not None
    assert "Expecting" in err or "delimiter" in err  # json.JSONDecodeError text


def test_wellformed_empty_file(tmp_path):
    p = tmp_path / "empty.json"
    p.write_text("", encoding="utf-8")
    err = vd.validate_wellformed(p)
    assert err is not None  # empty is not valid JSON


def test_wellformed_array_at_root(tmp_path):
    p = tmp_path / "arr.json"
    p.write_text('[1, 2, 3]', encoding="utf-8")
    assert vd.validate_wellformed(p) is None


def test_wellformed_unicode(tmp_path):
    p = tmp_path / "unicode.json"
    p.write_text('{"term": "卡脖子"}', encoding="utf-8")
    assert vd.validate_wellformed(p) is None


def test_wellformed_missing_file_returns_error(tmp_path):
    p = tmp_path / "ghost.json"
    err = vd.validate_wellformed(p)
    assert err is not None
    assert "read error" in err.lower() or "no such file" in err.lower()


# ── schema_for — pattern matching to schema files ─────────────────────────


def test_schema_for_assembly_manifest(tmp_path, monkeypatch):
    """If a path matches the assembly-manifest pattern, schema_for returns the schema path."""
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    schema = tmp_path / "remotion-templates/data/assembly-manifest.schema.json"
    schema.parent.mkdir(parents=True)
    schema.write_text("{}", encoding="utf-8")
    target = tmp_path / "remotion-templates/data/episodes/silicon-trap/assembly-manifest.json"
    target.parent.mkdir(parents=True)
    target.write_text("{}", encoding="utf-8")
    assert vd.schema_for(target) == schema


def test_schema_for_concepts(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    schema = tmp_path / "data/concept-registry.schema.json"
    schema.parent.mkdir(parents=True)
    schema.write_text("{}", encoding="utf-8")
    target = tmp_path / "data/concepts.json"
    target.write_text("{}", encoding="utf-8")
    assert vd.schema_for(target) == schema


def test_schema_for_no_match(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    target = tmp_path / "data/random-other.json"
    target.parent.mkdir(parents=True)
    target.write_text("{}", encoding="utf-8")
    assert vd.schema_for(target) is None


def test_schema_for_returns_none_when_schema_missing(tmp_path, monkeypatch):
    """If pattern matches but the schema file doesn't exist, return None (don't crash)."""
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    target = tmp_path / "data/concepts.json"
    target.parent.mkdir(parents=True)
    target.write_text("{}", encoding="utf-8")
    # Don't create the schema file
    assert vd.schema_for(target) is None


# ── validate_schema — Layer 2 check (uses jsonschema if installed) ────────


def test_schema_valid_data(tmp_path):
    schema = tmp_path / "schema.json"
    schema.write_text(json.dumps({
        "type": "object",
        "properties": {"x": {"type": "integer"}},
        "required": ["x"],
    }), encoding="utf-8")
    data = tmp_path / "data.json"
    data.write_text('{"x": 42}', encoding="utf-8")
    assert vd.validate_schema(data, schema) is None


def test_schema_violation_returns_error(tmp_path):
    schema = tmp_path / "schema.json"
    schema.write_text(json.dumps({
        "type": "object",
        "properties": {"x": {"type": "integer"}},
        "required": ["x"],
    }), encoding="utf-8")
    data = tmp_path / "data.json"
    data.write_text('{"x": "not an integer"}', encoding="utf-8")
    err = vd.validate_schema(data, schema)
    assert err is not None
    assert "schema error" in err.lower()


def test_schema_validation_includes_path_to_failure(tmp_path):
    """Error message should mention which field failed."""
    schema = tmp_path / "schema.json"
    schema.write_text(json.dumps({
        "type": "object",
        "properties": {
            "nested": {
                "type": "object",
                "properties": {"y": {"type": "string"}},
            }
        }
    }), encoding="utf-8")
    data = tmp_path / "data.json"
    data.write_text('{"nested": {"y": 123}}', encoding="utf-8")
    err = vd.validate_schema(data, schema)
    assert err is not None
    assert "y" in err  # path should mention 'y'


# ── find_json_files — directory traversal + filtering ─────────────────────


def test_find_json_files_skips_schemas(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    (tmp_path / "data/regular.json").write_text("{}")
    (tmp_path / "data/something.schema.json").write_text("{}")
    found = vd.find_json_files()
    names = [p.name for p in found]
    assert "regular.json" in names
    assert "something.schema.json" not in names


def test_find_json_files_skips_node_modules(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    (tmp_path / "data/regular.json").write_text("{}")
    (tmp_path / "remotion-templates/data/node_modules/foo").mkdir(parents=True)
    (tmp_path / "remotion-templates/data/node_modules/foo/pkg.json").write_text("{}")
    found = vd.find_json_files()
    paths = [str(p) for p in found]
    assert not any("node_modules" in p for p in paths)


def test_find_json_files_filter_paths(tmp_path, monkeypatch):
    """Filter to a subset — used by pre-commit hook."""
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    a = tmp_path / "data/a.json"
    b = tmp_path / "data/b.json"
    a.write_text("{}")
    b.write_text("{}")
    found = vd.find_json_files(filter_paths=[a])
    assert found == [a]


def test_find_json_files_returns_sorted(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    (tmp_path / "data/zebra.json").write_text("{}")
    (tmp_path / "data/apple.json").write_text("{}")
    found = vd.find_json_files()
    names = [p.name for p in found]
    assert names == sorted(names)


# ── Layer 3 — palette compliance ──────────────────────────────────────────


def test_load_palette_hex_set_extracts_all_hex(tmp_path, monkeypatch):
    palette = tmp_path / "palette.json"
    palette.write_text(json.dumps({
        "palette": {"ink": "#1C1814", "gold": "#C4A747"},
        "semantic": {"us": "#4A7BA7", "china": "#A64D46"},
    }), encoding="utf-8")
    monkeypatch.setattr(vd, "PALETTE_PATH", palette)
    s = vd.load_palette_hex_set()
    assert s == {"#1c1814", "#c4a747", "#4a7ba7", "#a64d46"}


def test_load_palette_hex_set_handles_nested_arrays(tmp_path, monkeypatch):
    palette = tmp_path / "palette.json"
    palette.write_text(json.dumps({
        "ramps": {"standard": {"shadows": ["#1C1814"], "highlights": ["#F5F0E8"]}},
    }), encoding="utf-8")
    monkeypatch.setattr(vd, "PALETTE_PATH", palette)
    s = vd.load_palette_hex_set()
    assert "#1c1814" in s
    assert "#f5f0e8" in s


def test_load_palette_hex_set_returns_empty_when_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "PALETTE_PATH", tmp_path / "ghost.json")
    assert vd.load_palette_hex_set() == set()


def test_load_palette_hex_set_returns_empty_on_malformed(tmp_path, monkeypatch):
    palette = tmp_path / "palette.json"
    palette.write_text("{ not valid json", encoding="utf-8")
    monkeypatch.setattr(vd, "PALETTE_PATH", palette)
    assert vd.load_palette_hex_set() == set()


def test_validate_palette_passes_compliant_hex(tmp_path):
    data = tmp_path / "data.json"
    data.write_text(json.dumps({"color": "#1C1814"}), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814", "#c4a747"})
    assert err is None


def test_validate_palette_flags_off_palette_hex(tmp_path):
    data = tmp_path / "data.json"
    data.write_text(json.dumps({"color": "#FF00FF"}), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814", "#c4a747"})
    assert err is not None
    assert "#ff00ff" in err


def test_validate_palette_allows_pure_black_and_white(tmp_path):
    data = tmp_path / "data.json"
    data.write_text(json.dumps({
        "stroke": "#000000",
        "fill": "#FFFFFF",
    }), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814"})
    assert err is None  # black/white always allowed


def test_validate_palette_accepts_rgba_when_rgb_in_palette(tmp_path):
    """8-char hex like #1C1814AA (with alpha) should pass if the RGB part is in the palette."""
    data = tmp_path / "data.json"
    data.write_text(json.dumps({"color": "#1C181480"}), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814"})
    assert err is None


def test_validate_palette_dedupes_repeated_offenders(tmp_path):
    data = tmp_path / "data.json"
    data.write_text(json.dumps({
        "a": "#FF00FF",
        "b": "#FF00FF",
        "c": "#FF00FF",
    }), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814"})
    assert err is not None
    # Same off-palette hex used 3 times should be reported once
    assert err.count("#ff00ff") == 1


def test_validate_palette_returns_none_when_palette_empty(tmp_path):
    """If palette didn't load (empty allowed set), skip Layer 3 silently rather than fail."""
    data = tmp_path / "data.json"
    data.write_text(json.dumps({"color": "#FF00FF"}), encoding="utf-8")
    assert vd.validate_palette(data, set()) is None


# ── is_template_data_file — which files Layer 3 applies to ─────────────────


def test_template_data_file_recognized(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "remotion-templates/data/episodes/foo/bar.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is True


def test_template_data_file_skips_assembly_manifest(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "remotion-templates/data/episodes/foo/assembly-manifest.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is False


def test_template_data_file_skips_deprecated_paths(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "remotion-templates/data/episodes/foo/_deprecated_v4/old.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is False


def test_template_data_file_skips_concepts_registry(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "data/concepts.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is False


def test_template_data_file_skips_schema_files(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "remotion-templates/data/episodes/foo.schema.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is False
