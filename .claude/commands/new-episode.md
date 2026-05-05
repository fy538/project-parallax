---
description: Scaffold a new episode directory with research/script structure and add to PIPELINE.md
argument-hint: <slug>
---

Scaffold a new episode at `episodes/$1/`.

Steps:
1. Create the directory `episodes/$1/` with subdirs `drafts/` and `research/`.
2. Create `episodes/$1/brief.md` from the gold-standard template (see `episodes/silicon-trap/brief.md` for structure — Sections 1–9 including the speculation pipeline section).
3. Create `episodes/$1/shot-list.json` with an empty array `[]` and the schema reference comment.
4. Create `episodes/$1/REVISION_LOG.md` with a header and the standard "version, date, changes, rationale" table.
5. Add a row to `episodes/PIPELINE.md` with state `INCUBATING`, `Last touched` = today's absolute date.
6. Confirm by listing the created files.

If `episodes/$1/` already exists, abort and report what's already there.
