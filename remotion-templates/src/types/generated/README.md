# `src/types/generated/`

Auto-generated TypeScript type definitions from the JSON Schemas under
`data/*.schema.json`. **Do not edit by hand** — the next `npm run gen:types`
will overwrite your changes.

## When to regenerate

Whenever you edit:
- `data/concept-registry.schema.json`
- `data/shot-list.schema.json`
- `data/predictions-log.schema.json`
- `data/visual-identity.schema.json`

CI runs `npm run gen:types -- --check` and fails if the committed copies
are stale. Local dev workflow: edit schema → `npm run gen:types` → commit.

## Why these and not others

The assembly-manifest schema is NOT in this set — TypeScript consumes the
assembly manifest via `z.infer` through `src/templates/Episodes/templateSchemas.ts`.
The JSON Schema for assembly-manifest is for Python-side validation only
(`tools/validate_data.py`).
