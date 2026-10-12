# Sourced by .githooks/pre-commit, scripts/lint.sh and scripts/test.sh.
#
# The tools need the project's Python packages (pyproject.toml). The default `python3`
# is not always the interpreter that has them: on Tiger's machine it is a newer Homebrew
# Python with none of them, while python3.13 has them all. Without this, the first
# `pytest tools/` fails at import and every commit that touches a .py file is refused.
#
# This puts an interpreter that can import the core packages first on PATH as `python3`
# for the rest of the calling script. Set PARALLAX_PYTHON to choose one yourself.
_parallax_pick_python() {
  local c
  for c in "${PARALLAX_PYTHON:-}" python3 python3.13 python3.12 python3.11; do
    [ -n "$c" ] || continue
    command -v "$c" >/dev/null 2>&1 || continue
    if "$c" -c 'import jsonschema, requests, pytest' >/dev/null 2>&1; then
      command -v "$c"
      return 0
    fi
  done
  command -v python3
}
_parallax_py=$(_parallax_pick_python)
_parallax_shim=$(mktemp -d)
ln -s "$_parallax_py" "$_parallax_shim/python3"
export PATH="$_parallax_shim:$PATH"
trap 'rm -rf "$_parallax_shim"' EXIT
