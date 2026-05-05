---
description: Scaffold a new Remotion template (types, schema, component, registration)
argument-hint: <TemplateName>
---

Scaffold a new Remotion template `$1` at `remotion-templates/src/templates/$1/`.

Steps:
1. Create `types.ts` with a `$1Data` interface. Include `durationSec?: number` and `backgroundVariant?: "light" | "dark"` at minimum.
2. Create `schema.ts` with a Zod schema for `$1Data` matching the interface. Use `z.optional()` on optional fields.
3. Create `$1.tsx` following the pattern in [remotion-templates/CLAUDE.md "How to create a new template"](../remotion-templates/CLAUDE.md):
   - `useCurrentFrame()`, `useCompositionAnimation()`, `<Background>`, `AbsoluteFill`
   - Wrap any per-frame `Math.max`/`Math.min`/`.sort`/`.filter` over data props in `useMemo`
   - Pull animation timing from `theme.ts` (`timing.entrance.*`); don't hardcode `sec(0.4)`
4. Create `index.tsx` with `<Composition>` registration, including `calculateMetadata` that derives `durationInFrames` from `data.durationSec`.
5. Register the composition in `remotion-templates/src/Root.tsx` inside the appropriate `<Folder>`.
6. Run `./scripts/typecheck.sh` to confirm strict mode passes.
7. Add a one-line entry to `remotion-templates/references/template-schemas.md` under the relevant category.

If `remotion-templates/src/templates/$1/` already exists, abort.
