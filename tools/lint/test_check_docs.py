"""Tests for tools/lint/check_docs.py."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_docs  # noqa: E402


# ── Check 1: template-name resolution ────────────────────────────────────────

class TestTemplateNameCheck:
    """check_template_names flags references to deleted templates that aren't
    bannered as historical. Live-template names pass."""

    def _setup(self, tmp_path, monkeypatch, templates_present, selector_content):
        """Build a fake repo with the listed templates and a single selector file."""
        tpl_dir = tmp_path / "remotion-templates" / "src" / "templates"
        tpl_dir.mkdir(parents=True)
        for t in templates_present:
            (tpl_dir / t).mkdir()
        selector = tmp_path / "remotion-templates" / "MAP_TEMPLATE_SELECTOR.md"
        selector.parent.mkdir(parents=True, exist_ok=True)
        selector.write_text(selector_content, encoding="utf-8")
        monkeypatch.setattr(check_docs, "REPO_ROOT", tmp_path)
        monkeypatch.setattr(check_docs, "TEMPLATES_DIR", tpl_dir)
        monkeypatch.setattr(check_docs, "SELECTOR_FILES", [selector])

    def test_live_template_passes(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    templates_present=["AtlasPlate"],
                    selector_content="| AtlasPlate | default for editorial work |\n")
        assert check_docs.check_template_names() == []

    def test_deleted_template_without_banner_fires(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    templates_present=["AtlasPlate"],
                    selector_content="| BifurcationRoute | live option |\n")
        vs = check_docs.check_template_names()
        assert len(vs) == 1
        assert vs[0].check == "template"
        assert vs[0].pointer == "BifurcationRoute"

    def test_deleted_template_with_DELETED_marker_passes(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    templates_present=["AtlasPlate"],
                    selector_content="| BifurcationRoute (DELETED May 13) | historical |\n")
        assert check_docs.check_template_names() == []

    def test_deleted_template_with_strikethrough_passes(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    templates_present=["AtlasPlate"],
                    selector_content="| ~~BifurcationRoute~~ | superseded |\n")
        assert check_docs.check_template_names() == []

    def test_deleted_template_with_now_part_of_passes(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    templates_present=["AtlasPlate"],
                    selector_content="TimelineMorph guardrails are now part of HorizontalTimeline mode.\n")
        assert check_docs.check_template_names() == []

    def test_typo_in_live_template_name_does_not_fire(self, tmp_path, monkeypatch):
        """A typo'd template name (not in known_names) is silently skipped — we
        don't flag generic CamelCase to avoid false positives."""
        self._setup(tmp_path, monkeypatch,
                    templates_present=["AtlasPlate"],
                    selector_content="| AtalsPlate (typo) | not a real template |\n")
        # Typo is invisible to this check; that's a different problem.
        assert check_docs.check_template_names() == []


# ── Check 2: palette consistency ─────────────────────────────────────────────

class TestPaletteCheck:
    def _setup(self, tmp_path, monkeypatch, palette_json, brand_md_content):
        palette_path = tmp_path / "tools" / "brand-treatment" / "palette.json"
        palette_path.parent.mkdir(parents=True)
        palette_path.write_text(json.dumps(palette_json), encoding="utf-8")
        brand_path = tmp_path / "remotion-templates" / "BRAND.md"
        brand_path.parent.mkdir(parents=True, exist_ok=True)
        brand_path.write_text(brand_md_content, encoding="utf-8")
        monkeypatch.setattr(check_docs, "REPO_ROOT", tmp_path)
        monkeypatch.setattr(check_docs, "PALETTE_JSON", palette_path)
        monkeypatch.setattr(check_docs, "BRAND_MD", brand_path)

    def test_matching_hex_passes(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    palette_json={"palette": {"gold": "#C4A747"}, "semantic": {}},
                    brand_md_content="| gold | #C4A747 | accent |\n")
        assert check_docs.check_palette_consistency() == []

    def test_mismatched_hex_fires(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    palette_json={"palette": {"gold": "#C4A747"}, "semantic": {}},
                    brand_md_content="| gold | #E5A544 | accent |\n")
        vs = check_docs.check_palette_consistency()
        assert len(vs) == 1
        assert vs[0].pointer == "gold"
        assert "#e5a544" in vs[0].message.lower()
        assert "#c4a747" in vs[0].message.lower()

    def test_unknown_color_name_skipped(self, tmp_path, monkeypatch):
        """Names not in palette.json are ignored (they could be CSS vars,
        non-palette refs, etc.). Avoids false positives."""
        self._setup(tmp_path, monkeypatch,
                    palette_json={"palette": {"gold": "#C4A747"}, "semantic": {}},
                    brand_md_content="| zinc | #C4A747 | some other color |\n")
        assert check_docs.check_palette_consistency() == []

    def test_case_insensitive(self, tmp_path, monkeypatch):
        """Hex comparisons are case-insensitive."""
        self._setup(tmp_path, monkeypatch,
                    palette_json={"palette": {"gold": "#C4A747"}, "semantic": {}},
                    brand_md_content="| gold | #c4a747 | lowercase |\n")
        assert check_docs.check_palette_consistency() == []


# ── Check 3: npm-script resolution ───────────────────────────────────────────

class TestNpmScriptCheck:
    def _setup(self, tmp_path, monkeypatch, scripts, doc_content):
        package_path = tmp_path / "remotion-templates" / "package.json"
        package_path.parent.mkdir(parents=True)
        package_path.write_text(json.dumps({"scripts": scripts}), encoding="utf-8")
        doc_path = tmp_path / "CLAUDE.md"
        doc_path.write_text(doc_content, encoding="utf-8")
        monkeypatch.setattr(check_docs, "REPO_ROOT", tmp_path)
        monkeypatch.setattr(check_docs, "PACKAGE_JSON", package_path)
        monkeypatch.setattr(check_docs, "NPM_DOC_SOURCES", [doc_path])

    def test_existing_script_passes(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    scripts={"test": "vitest run"},
                    doc_content="Run `npm run test` to test.\n")
        assert check_docs.check_npm_scripts() == []

    def test_missing_script_fires(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    scripts={"test": "vitest run"},
                    doc_content="Run `npm run render:lambda` for cloud render.\n")
        vs = check_docs.check_npm_scripts()
        assert len(vs) == 1
        assert vs[0].pointer == "render:lambda"

    def test_colon_in_script_name_resolves(self, tmp_path, monkeypatch):
        """npm script names can contain colons (e.g., test:real-data)."""
        self._setup(tmp_path, monkeypatch,
                    scripts={"test:real-data": "vitest run real-data"},
                    doc_content="Run `npm run test:real-data` for the heavy suite.\n")
        assert check_docs.check_npm_scripts() == []

    def test_no_docs_returns_empty(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch, scripts={"test": "x"}, doc_content="No npm refs here.\n")
        assert check_docs.check_npm_scripts() == []


# ── Check 4: persona consistency ─────────────────────────────────────────────

class TestPersonaCheck:
    def _setup(self, tmp_path, monkeypatch, personas, persona_eval_text, publish_retro_text):
        personas_path = tmp_path / "data" / "personas.json"
        personas_path.parent.mkdir(parents=True)
        personas_path.write_text(json.dumps({"personas": [{"name": n} for n in personas]}), encoding="utf-8")
        eval_path = tmp_path / "skills" / "persona-eval" / "SKILL.md"
        eval_path.parent.mkdir(parents=True)
        eval_path.write_text(persona_eval_text, encoding="utf-8")
        retro_path = tmp_path / "skills" / "publish-retro" / "SKILL.md"
        retro_path.parent.mkdir(parents=True)
        retro_path.write_text(publish_retro_text, encoding="utf-8")
        monkeypatch.setattr(check_docs, "REPO_ROOT", tmp_path)
        monkeypatch.setattr(check_docs, "PERSONAS_JSON", personas_path)
        monkeypatch.setattr(check_docs, "PERSONA_SKILLS", [eval_path, retro_path])

    def test_all_personas_in_both_skills_passes(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    personas=["Priya", "Amara"],
                    persona_eval_text="Priya is the regular. Amara is the cross-cultural viewer.",
                    publish_retro_text="Priya engagement and Amara engagement metrics.")
        assert check_docs.check_persona_consistency() == []

    def test_persona_missing_from_one_skill_fires(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    personas=["Priya", "Amara"],
                    persona_eval_text="Priya is the regular. Amara is the cross-cultural viewer.",
                    publish_retro_text="Priya engagement only.")  # Amara absent
        vs = check_docs.check_persona_consistency()
        assert len(vs) == 1
        assert vs[0].pointer == "Amara"
        assert "publish-retro" in vs[0].file

    def test_persona_missing_from_both_skills_fires_twice(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch,
                    personas=["Zed"],  # Canonical persona absent from both
                    persona_eval_text="No matching persona in this text.",
                    publish_retro_text="Or in this one.")
        vs = check_docs.check_persona_consistency()
        assert len(vs) == 2
        assert all(v.pointer == "Zed" for v in vs)
