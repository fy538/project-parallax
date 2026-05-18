"""
Shared assembly-manifest loaders for Parallax production tools.

Single source of truth for reading `remotion-templates/data/episodes/<slug>/
assembly-manifest.json`. Replaces six near-identical re-implementations that
had drifted across the codebase:

  · tools/check_audio_cues.py             load_manifest(slug) → dict | None
  · tools/check_script_manifest.py        load_manifest(slug) → dict | None
  · tools/cost_forecast.py                load_assembly_manifest(slug) → dict | None
  · tools/episode_watch/episode_watch.py  load_manifest(path) → dict | None
  · tools/sourcing/source_sheet.py        load_manifest(path) → dict | None
  · tools/publish/shorts_proposer.py      load_manifest(path) → dict  (strict)
  · tools/migrate_manifest.py             load_manifest(path) → (dict|None, err|None)

The pre-existing copies handled None / encoding / error reporting slightly
differently — each was correct in isolation but the collective drift meant
"is this manifest loadable?" had six possible answers depending on which
tool you asked. This module fixes that.

Import pattern (matches `paths.py`):

    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parent / "shared"))
    from manifests import load_manifest, manifest_path_for

Or with absolute import when the caller is itself inside tools/shared/:

    from manifests import load_manifest
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import overload

from paths import get_project_root


def manifest_path_for(slug: str) -> Path:
    """Canonical path: remotion-templates/data/episodes/<slug>/assembly-manifest.json.
    Does not assert existence — call `is_file()` on the result if needed."""
    return get_project_root() / "remotion-templates" / "data" / "episodes" / slug / "assembly-manifest.json"


@overload
def load_manifest(source: str) -> dict | None: ...
@overload
def load_manifest(source: Path) -> dict | None: ...


def load_manifest(source: str | Path) -> dict | None:
    """Load an episode's assembly-manifest.json. Returns the parsed dict, or
    None on missing-file / malformed-JSON.

    Accepts either:
      · a slug string  — resolves to manifest_path_for(slug)
      · a Path object  — read directly (for non-standard locations, tmpdir
                         tests, or migration tooling)

    Encoding is UTF-8 (matches what `generate_manifest.py` writes).

    Errors other than missing-file / JSON-decode bubble — an OSError
    (permission denied, locked file, etc.) should fail loudly, not return
    a confusing None. Use `load_manifest_with_error` if you need to
    distinguish all three states.
    """
    path = source if isinstance(source, Path) else manifest_path_for(source)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def load_manifest_with_error(
    path: Path,
) -> tuple[dict | None, str | None]:
    """Diagnostic variant — returns (data, error_message). Used by
    migration / repair tools that need to distinguish "doesn't exist" from
    "corrupt JSON" from "unreadable" in their reporting.

    Returns:
      (data, None)        — successfully loaded
      (None, "invalid JSON: ...")        — file present but unparseable
      (None, "could not read: ...")      — OSError (missing, permissions, ...)
    """
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON: {exc}"
    except OSError as exc:
        return None, f"could not read: {exc}"


def load_manifest_strict(path: Path) -> dict:
    """Load and parse; let everything bubble. For read-only tools that
    tolerate partial manifests but want a hard failure on a missing or
    corrupt file rather than a None to thread through downstream logic.
    Used by shorts_proposer."""
    return json.loads(path.read_text(encoding="utf-8"))
