#!/usr/bin/env bash
# TypeScript strict-mode typecheck for the Remotion project.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/remotion-templates"
exec npx tsc --noEmit
