# Decision Records (ADRs)

Going forward, significant architectural or editorial decisions get their own file in this directory rather than being appended to the flat [`../DECISIONS.md`](../DECISIONS.md). Individual files are easier for agents to retrieve, easier to link to from other docs, and easier to update without merge conflicts.

## Convention

- File name: `NNNN-kebab-case-slug.md` (e.g. `0001-slug-vs-numbered-episodes.md`).
- Numbering is monotonic. Don't renumber.
- Use [`TEMPLATE.md`](./TEMPLATE.md) as the starting structure.
- Keep each ADR under 200 lines. If longer, the topic probably needs to be split.

## When to write an ADR

Write one when:
- A choice has long-term consequences (architecture, schema, naming convention)
- A reasonable person might propose the alternative six months from now (preempt the rehash)
- The decision is contingent on context that won't be obvious from the code alone

Don't write one for:
- Routine implementation choices
- Anything fully captured by a CHANGELOG entry
- Topic-level editorial choices (those go in `episodes/EDITORIAL_PLAYBOOK.md`)

## Status values

- `Proposed` — under discussion
- `Accepted` — in effect
- `Superseded by NNNN` — replaced; link to the replacement
- `Deprecated` — no longer in effect, but no replacement was needed

## Relationship to DECISIONS.md

The flat `DECISIONS.md` (39 entries as of 2026-05) stays as historical record. New decisions go here. If you reference an old decision frequently, consider migrating it to its own ADR.

## Index

(empty — first ADR pending)
