#!/usr/bin/env bash
# check-docs.sh — repo-wide doc consistency lint.
#
# Wraps `tools/lint/check_docs.py` for shell-style invocation. Catches the
# four drift classes the May-17 audits surfaced:
#   1. Template names referenced in SELECTORs that don't exist on disk
#   2. Palette hex values in BRAND.md that disagree with palette.json
#   3. `npm run X` mentions in docs that aren't real scripts in package.json
#   4. Persona names in personas.json that don't appear in both persona-eval
#      and publish-retro skills
#
# Usage:
#   ./scripts/check-docs.sh              # report violations
#   ./scripts/check-docs.sh --strict     # exit 1 on any violation (CI mode)
#   ./scripts/check-docs.sh --check=palette  # one specific check
#
# Wire into CI or run before any commit that touches docs.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec python3 "$ROOT/tools/lint/check_docs.py" "$@"
