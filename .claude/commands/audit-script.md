---
description: Audit a production script with the script-audit skill (10 lenses + mechanical lint)
argument-hint: <path-to-script> [quick]
---

Audit the script at `$1`.

- Default: follow `skills/script-audit/SKILL.md` in this session (full report with Priority Fixes and suggested rewrites).
- If `$2` is `quick`: delegate to the `script-reviewer` subagent for a verdict-only pass.

Either way, run `python3 tools/lint/script_lint.py $1` first. The lens definitions live only in the skill — do not restate them here.
