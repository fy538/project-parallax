"""
Shared path utilities for Parallax production tools.

Single source of truth for resolving the project root and common
sub-directories. Import this from any tool under tools/:

    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
    from paths import get_project_root, get_episode_dir, get_remotion_data_dir

If the project root cannot be found, get_project_root() raises RuntimeError
with a helpful message that includes the current working directory, so silent
"file not found" failures are replaced with an actionable message.
"""

from pathlib import Path


# Sentinel file that uniquely identifies the project root.
_SENTINEL = "AGENTS.md"

# Resolved once at import time from this file's own location.
# tools/shared/paths.py → parent → tools/ → parent → project root
_RESOLVED_ROOT: Path = Path(__file__).resolve().parent.parent.parent


def get_project_root() -> Path:
    """Return the absolute path to the project root.

    Resolution order:
      1. Two directories up from this file (tools/shared/ → tools/ → root).
         Correct when tools are run from anywhere inside the repo tree.
      2. Walk up from cwd looking for the sentinel file.
         Fallback for unusual invocation patterns.

    Raises RuntimeError with cwd and expected path if root cannot be found.
    """
    if (_RESOLVED_ROOT / _SENTINEL).exists():
        return _RESOLVED_ROOT

    # Fallback: walk up from cwd
    cwd = Path.cwd().resolve()
    candidate = cwd
    while True:
        if (candidate / _SENTINEL).exists():
            return candidate
        parent = candidate.parent
        if parent == candidate:
            break
        candidate = parent

    raise RuntimeError(
        f"Project root not found (expected {_SENTINEL} at {_RESOLVED_ROOT}).\n"
        f"Current directory: {Path.cwd()}\n"
        f"Run from anywhere inside the project tree."
    )


def get_episode_dir(slug: str) -> Path:
    """Return the episodes/<slug>/ path. Does not assert existence."""
    return get_project_root() / "episodes" / slug


def get_remotion_data_dir(slug: str | None = None) -> Path:
    """Return remotion-templates/data/episodes/ or .../episodes/<slug>/."""
    base = get_project_root() / "remotion-templates" / "data" / "episodes"
    return base / slug if slug else base
