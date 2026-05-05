# Concept Registry — lookup.py

CLI for the Parallax concept registry (`data/concepts.json`).

## Commands

```bash
# Search by term, tag, type, or definition text
python lookup.py search "cocom"
python lookup.py search "china"
python lookup.py search "framework"

# List all concepts introduced in an episode
python lookup.py episode EP01

# Check a new script for concepts from prior episodes (callback detection)
python lookup.py reuse-check EP02 --script episodes/EP02/script-v1.md

# Show full detail for one concept
python lookup.py show chess-vs-go

# Registry statistics
python lookup.py stats

# Concept relationship graph
python lookup.py graph

# Validate registry (broken links, missing fields, ID format)
python lookup.py validate

# List all tags with counts
python lookup.py tags

# Add a concept interactively
python lookup.py add
```

## JSON output

Add `--json` to any command for machine-readable output (used by visual-spec skill):

```bash
python lookup.py --json reuse-check EP02 --script episodes/EP02/script-v1.md
```

## How it fits in the pipeline

1. **Script drafting** — after writing a script, run `reuse-check` to find concepts that should get callbacks instead of cold intros
2. **visual-spec** (Step 1.5) — the skill checks concepts.json before generating visuals; each prior-episode concept gets a callback treatment from its `callbackVisual` field
3. **After visual-spec** — new concepts are added to the registry (manually or via `add`)

## Schema

See `data/concept-registry.schema.json` for the full JSON Schema definition.
