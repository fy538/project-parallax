#!/usr/bin/env bash
# Run the Remotion convention linter.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/remotion-templates"
exec npm run lint
