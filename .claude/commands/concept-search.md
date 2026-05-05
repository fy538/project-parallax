---
description: Search the concept registry for a term, framework, or named concept
argument-hint: <query>
---

Run `python3 tools/concepts/lookup.py search "$1"` and summarize the matches.

If a high-confidence match exists in a previous episode, surface:
- The episode/beat/template where it was introduced
- Its accent color
- The `callbackVisual` field (suggested visual treatment for callbacks)
- Related concepts in the registry

This helps detect reuse opportunities so the current episode can do a callback instead of a cold intro. The `visual-spec` skill runs this check automatically at Step 1.5; this command is for ad-hoc lookups during drafting.
