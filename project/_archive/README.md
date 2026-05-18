# `project/_archive/`

Non-tool project artifacts that served their purpose and are no longer in active circulation. Kept here (not deleted) for provenance so a future "did we ever have a doc on X?" search lands in one place.

**Sibling of `tools/_archive/`** — that directory holds dormant CLI scripts; this one holds dormant docs, decks, source-of-truth artifacts that have been superseded by tracked Markdown.

Promote out only by moving back to `project/` (or wherever the active copy belongs) with a fresh purpose.

---

## Inventory

### `Scriptwriting_Infrastructure.docx`

April 2026 working doc on the scriptwriting tooling stack — superseded by the tracked Markdown chain (`project/PRODUCTION_PIPELINE.md`, `project/SCRIPT_FORMAT.md`, `project/DIRECTING_LANGUAGE.md`, `episodes/EDITORIAL_PLAYBOOK.md`). Kept because the original outline informed the current pipeline structure.

### `KENBURNS_IMPLEMENTATION.md`

May 2, 2026 implementation memo for the KenBurns component (slow pan/zoom for stills). Component lives at `remotion-templates/src/components/KenBurns.tsx`; the operator-facing quick-start at `remotion-templates/src/components/KENBURNS_QUICK_START.md` is the canonical reference now. The implementation memo is kept because it documents the original design tradeoffs (six directional modes, scale/offset interpolation).

### `asset-scores.json`

April 26, 2026 one-off scoring of Pexels stock for the original silicon-trap prep. Output of a manual review pass; superseded by the live asset-sourcing pipeline (`tools/asset-source/source.py` + `tools/sourcing_brief.py`). Kept as a reference for the scoring rubric format.

### `claude-design-prompt-visual-identity.md`

April 25, 2026 brief used during the initial Claude Design exploration of the channel's visual identity. Output became the foundation for `project/PROJECT_VISION.md` + `remotion-templates/BRAND.md`. Kept because the original prompt documented constraints that still shape the design system.

### `visual-treatment-poc.html`

May 2, 2026 standalone HTML proof-of-concept for image-treatment effects (duotone / grain / vignette). 5.7 MB because it bundles sample images inline. Superseded by the live `tools/brand-treatment/treat.py` pipeline + LUT generator. Kept (despite the size) because it captures the visual exploration that informed `IMAGES.md`. Open in a browser to see the live demo.
