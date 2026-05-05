# Parallax

Production pipeline for **Parallax**, a solo YouTube channel analyzing contemporary geopolitics through historical analogy and philosophical frameworks.

> Pre-launch. AI-assisted research and production, human narration and editorial judgment.

## What's in this repo

- `episodes/` — per-episode work (research briefs, scripts, shot lists, revision logs)
- `project/` — strategy and pipeline docs (vision, content identity, decisions)
- `remotion-templates/` — Remotion (React → MP4) video template library
- `tools/` — Python CLIs for assembly, brand treatment, asset sourcing, AI illustration, concept registry
- `skills/` — version-controlled production skills
- `data/concepts.json` — cross-episode concept registry

Episode lifecycle: see [`episodes/PIPELINE.md`](./episodes/PIPELINE.md).

## Stack

- **Python 3.13** — CLI tooling, manifest generation, asset sourcing
- **TypeScript** (strict) + **Remotion 4** — video templates rendering at 1920×1080@30fps
- **Mapbox GL** + **deck.gl** — geographic visualizations
- **Pytest** + **Vitest** — Python unit tests + visual regression

## Quick start

```bash
# Run all tests (Python + TypeScript typecheck)
./scripts/test.sh

# Preview Remotion templates
cd remotion-templates && npm start

# Validate JSON data files (manifests, shot lists, concept registry)
python3 tools/validate_data.py
```

For everything else (build commands, code conventions, security boundaries, things-not-to-do): see [`AGENTS.md`](./AGENTS.md).

For project context (what's queued, channel identity, content philosophy): see [`CLAUDE.md`](./CLAUDE.md).

## License

Personal project. Not currently open for external contributions.
