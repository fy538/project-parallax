#!/usr/bin/env python3
"""
intake.py — Batch-intake downloaded assets into an episode's asset-registry.json.

The operator downloads files into a staging directory (e.g. ~/Downloads/silicon-trap-assets/)
and this tool matches filenames to registry entries, copies/moves files to the right place,
validates dimensions, and marks assets as resolved.

Usage:
  python3 tools/asset-source/intake.py <slug> --from-dir <dir>
  python3 tools/asset-source/intake.py <slug> --from-dir <dir> --dry-run
  python3 tools/asset-source/intake.py <slug> --from-dir <dir> --move
  python3 tools/asset-source/intake.py <slug> --from-dir <dir> --min-width 3840 --min-height 2160

Exit codes:
  0 — success (all files matched)
  1 — partial success (some files unmatched — investigate)
  2 — usage error (missing registry, bad path, etc.)
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import warnings
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# ── Bootstrap shared path resolution ──────────────────────────────────────────

_SHARED = Path(__file__).resolve().parent.parent / "shared"
sys.path.insert(0, str(_SHARED))
from paths import get_episode_dir, get_project_root  # noqa: E402

# ── Optional PIL import ────────────────────────────────────────────────────────

try:
    from PIL import Image as _PILImage

    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# ── Constants ──────────────────────────────────────────────────────────────────

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"}
VIDEO_EXTS = {".mp4", ".mov", ".webm"}
ALL_EXTS = IMAGE_EXTS | VIDEO_EXTS

MATCH_THRESHOLD = 0.6  # minimum word-overlap ratio to consider a match


# ── Data structures ────────────────────────────────────────────────────────────


@dataclass
class RegistryAsset:
    """Thin wrapper around one entry in assets-registry.json assets[]."""

    idx: int  # position in the registry list (for in-place update)
    id: str
    description: str
    status: str
    # Normalised tokens for matching
    id_tokens: frozenset[str] = field(default_factory=frozenset)
    desc_tokens: frozenset[str] = field(default_factory=frozenset)


@dataclass
class IntakeResult:
    """Result of attempting to intake one downloaded file."""

    file: Path
    matched_id: Optional[str] = None
    confidence: float = 0.0
    is_image: bool = True
    width: Optional[int] = None
    height: Optional[int] = None
    dim_warning: bool = False
    dim_skip: bool = False  # PIL not available, skipped dim check
    copied: bool = False
    dest_path: Optional[Path] = None
    error: Optional[str] = None


# ── Text normalisation ─────────────────────────────────────────────────────────


def _normalise(text: str) -> frozenset[str]:
    """Lowercase, split on non-alphanumeric, drop empty tokens, return frozenset."""
    text = text.lower()
    tokens = re.split(r"[^a-z0-9]+", text)
    return frozenset(t for t in tokens if t)


def _match_score(file_tokens: frozenset[str], asset_tokens: frozenset[str]) -> float:
    """Return overlap ratio: |intersection| / |union| (Jaccard-style).

    Additionally give a bonus if any file token is a substring of any asset
    token or vice-versa (handles partial-word matches like 'tsmc' in 'beat1-tsmc-aerial').
    """
    if not file_tokens or not asset_tokens:
        return 0.0

    # Exact Jaccard
    inter = file_tokens & asset_tokens
    union = file_tokens | asset_tokens
    jaccard = len(inter) / len(union)

    if jaccard >= MATCH_THRESHOLD:
        return jaccard

    # Substring bonus: if any file token appears *in* any asset token (or vice versa)
    # this catches 'cleanroom' matching 'beat1-cleanroom-aerial'
    for ft in file_tokens:
        for at in asset_tokens:
            if ft in at or at in ft:
                # Use the substring match as a partial score boost
                sub_score = min(len(ft), len(at)) / max(len(ft), len(at))
                jaccard = max(jaccard, sub_score * 0.8)

    return jaccard


def _find_best_match(
    file_tokens: frozenset[str],
    assets: list[RegistryAsset],
) -> tuple[Optional[RegistryAsset], float]:
    """Return (best_asset, best_score) or (None, 0.0) if nothing clears threshold."""
    best_asset: Optional[RegistryAsset] = None
    best_score = 0.0

    for asset in assets:
        # Score against id tokens
        score_id = _match_score(file_tokens, asset.id_tokens)
        # Score against description tokens
        score_desc = _match_score(file_tokens, asset.desc_tokens)
        score = max(score_id, score_desc)

        if score > best_score:
            best_score = score
            best_asset = asset

    if best_score >= MATCH_THRESHOLD:
        return best_asset, best_score
    return None, best_score


# ── Dimension check ────────────────────────────────────────────────────────────


def _get_dimensions(path: Path) -> Optional[tuple[int, int]]:
    """Return (width, height) or None if PIL is unavailable or read fails."""
    if not PIL_AVAILABLE:
        return None
    try:
        with _PILImage.open(path) as img:
            return img.size  # (width, height)
    except Exception:
        return None


# ── Core intake logic ──────────────────────────────────────────────────────────


def _intake_file(
    src: Path,
    asset: RegistryAsset,
    episode_dir: Path,
    slug: str,
    dry_run: bool,
    move: bool,
    min_width: int,
    min_height: int,
) -> IntakeResult:
    """Attempt to copy/move src into the episode assets directory."""
    ext = src.suffix.lower()
    is_image = ext in IMAGE_EXTS

    result = IntakeResult(
        file=src,
        matched_id=asset.id,
        confidence=0.0,
        is_image=is_image,
    )

    # Dimension check for images
    if is_image:
        if not PIL_AVAILABLE:
            result.dim_skip = True
        else:
            dims = _get_dimensions(src)
            if dims is not None:
                result.width, result.height = dims
                if result.width < min_width or result.height < min_height:
                    result.dim_warning = True

    # Destination path
    assets_dir = episode_dir / "assets"
    dest = assets_dir / f"{asset.id}{ext}"
    result.dest_path = dest

    if dry_run:
        result.copied = False
        return result

    # Create assets directory if needed
    assets_dir.mkdir(parents=True, exist_ok=True)

    try:
        if move:
            shutil.move(str(src), dest)
        else:
            shutil.copy2(src, dest)
        result.copied = True
    except OSError as exc:
        result.error = str(exc)

    return result


def intake(
    slug: str,
    from_dir: Path,
    dry_run: bool,
    move: bool,
    min_width: int,
    min_height: int,
) -> int:
    """Main intake routine. Returns exit code (0, 1, or 2)."""

    # ── Validate episode dir and registry ─────────────────────────────────────
    try:
        episode_dir = get_episode_dir(slug)
    except RuntimeError as exc:
        print(f"✗ error: {exc}", file=sys.stderr)
        return 2

    if not episode_dir.is_dir():
        print(
            f"✗ error: episode directory not found: {episode_dir}",
            file=sys.stderr,
        )
        return 2

    registry_path = episode_dir / "asset-registry.json"
    if not registry_path.exists():
        print(
            f"✗ error: asset-registry.json not found at {registry_path}\n"
            f"  Run: python3 tools/assembly/init_asset_registry.py {slug}",
            file=sys.stderr,
        )
        return 2

    # ── Load registry ─────────────────────────────────────────────────────────
    try:
        registry: dict = json.loads(registry_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"✗ error: could not parse {registry_path}: {exc}", file=sys.stderr)
        return 2

    raw_assets: list[dict] = registry.get("assets", [])

    # Build RegistryAsset objects with pre-computed token sets
    registry_assets: list[RegistryAsset] = []
    for idx, entry in enumerate(raw_assets):
        asset_id = entry.get("id", "")
        description = entry.get("description", "")
        registry_assets.append(
            RegistryAsset(
                idx=idx,
                id=asset_id,
                description=description,
                status=entry.get("status", "missing"),
                id_tokens=_normalise(asset_id),
                desc_tokens=_normalise(description),
            )
        )

    # ── Validate from-dir ─────────────────────────────────────────────────────
    if not from_dir.is_dir():
        print(
            f"✗ error: --from-dir is not a directory: {from_dir}",
            file=sys.stderr,
        )
        return 2

    # ── Scan files ────────────────────────────────────────────────────────────
    candidate_files = [
        f for f in sorted(from_dir.iterdir())
        if f.is_file() and f.suffix.lower() in ALL_EXTS
    ]

    if not candidate_files:
        print(f"⚠  No image/video files found in {from_dir}")
        return 0

    if not PIL_AVAILABLE:
        print(
            "⚠  PIL not installed — dimension validation skipped.\n"
            "   Run: pip install Pillow"
        )

    mode_label = "move" if move else "copy"
    dry_label = " [DRY RUN]" if dry_run else ""
    print(
        f"\nIntaking {len(candidate_files)} file(s) for episode '{slug}'{dry_label}"
        f"  ({mode_label} mode, min {min_width}×{min_height})\n"
    )

    # ── Match and process ─────────────────────────────────────────────────────
    results: list[IntakeResult] = []
    matched_ids: set[str] = set()  # avoid double-mapping

    for src in candidate_files:
        stem_tokens = _normalise(src.stem)
        # Exclude ids already matched in this run
        available = [a for a in registry_assets if a.id not in matched_ids]
        best_asset, best_score = _find_best_match(stem_tokens, available)

        if best_asset is None:
            result = IntakeResult(file=src, confidence=best_score)
            results.append(result)
            continue

        result = _intake_file(
            src=src,
            asset=best_asset,
            episode_dir=episode_dir,
            slug=slug,
            dry_run=dry_run,
            move=move,
            min_width=min_width,
            min_height=min_height,
        )
        result.confidence = best_score
        results.append(result)
        matched_ids.add(best_asset.id)

        # Update registry in memory (not written yet if dry_run)
        if not dry_run and result.copied and result.dest_path is not None:
            entry = raw_assets[best_asset.idx]
            rel_dest = result.dest_path.relative_to(get_project_root())
            ext = src.suffix.lower()
            if ext in IMAGE_EXTS:
                entry["stillPath"] = str(rel_dest)
            else:
                entry["videoPath"] = str(rel_dest)
            entry["status"] = "resolved"

    # ── Print results table ───────────────────────────────────────────────────
    matched_results = [r for r in results if r.matched_id is not None]
    unmatched_results = [r for r in results if r.matched_id is None]
    dim_warnings = [r for r in matched_results if r.dim_warning]
    errors = [r for r in matched_results if r.error]

    print("─" * 72)
    print(f"  {'FILE':<36}  {'MATCH':<28}  CONF   STATUS")
    print("─" * 72)

    for r in results:
        fname = r.file.name
        if len(fname) > 35:
            fname = "…" + fname[-34:]

        if r.matched_id is None:
            match_col = "—"
            conf_col = f"{r.confidence:.2f}"
            status_col = "✗ no match"
        elif r.error:
            match_col = r.matched_id
            conf_col = f"{r.confidence:.2f}"
            status_col = f"✗ error: {r.error}"
        elif dry_run:
            match_col = r.matched_id
            conf_col = f"{r.confidence:.2f}"
            dim_note = " ⚠ dim" if r.dim_warning else (" (dim skip)" if r.dim_skip else "")
            status_col = f"→ would {mode_label}{dim_note}"
        else:
            match_col = r.matched_id
            conf_col = f"{r.confidence:.2f}"
            dim_note = " ⚠ dim" if r.dim_warning else (" (dim skip)" if r.dim_skip else "")
            status_col = f"✓ {mode_label}d{dim_note}"

        print(f"  {fname:<36}  {match_col:<28}  {conf_col}  {status_col}")

    print("─" * 72)

    # ── Summary ───────────────────────────────────────────────────────────────
    n_files = len(results)
    n_matched = len(matched_results)
    n_copied = len([r for r in matched_results if r.copied or dry_run])
    n_unmatched = len(unmatched_results)

    print(
        f"\nSummary: {n_files} file(s) scanned — "
        f"{n_matched} matched, {n_unmatched} unmatched"
        + (f", {len(dim_warnings)} dimension warning(s)" if dim_warnings else "")
        + (f", {len(errors)} error(s)" if errors else "")
    )

    if dim_warnings:
        print("\n⚠  Dimension warnings (below minimum):")
        for r in dim_warnings:
            dims = f"{r.width}×{r.height}" if r.width and r.height else "unknown"
            print(f"   {r.file.name} — {dims} (minimum: {min_width}×{min_height})")

    if unmatched_results:
        print("\n✗  Unmatched files (no registry entry found):")
        for r in unmatched_results:
            print(f"   {r.file.name}  (best score: {r.confidence:.2f})")
        print(
            "   Tip: Check that the filename contains words from an asset id\n"
            "   (e.g. 'beat1-tsmc-aerial.jpg' matches id 'beat1-tsmc-aerial')."
        )

    if errors:
        print("\n✗  File operation errors:")
        for r in errors:
            print(f"   {r.file.name} → {r.error}")

    # ── Write updated registry ────────────────────────────────────────────────
    if not dry_run and n_matched > 0:
        registry_path.write_text(
            json.dumps(registry, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"\n✓ Updated {registry_path}")

    if dry_run:
        print("\n(Dry run — no files copied/moved and registry not updated.)")

    return 0 if n_unmatched == 0 else 1


# ── CLI ────────────────────────────────────────────────────────────────────────


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="intake.py",
        description=(
            "Batch-intake downloaded assets into an episode's asset-registry.json.\n\n"
            "Scans --from-dir for image/video files, matches each to a registry entry\n"
            "by filename similarity, copies (or moves) to episodes/<slug>/assets/,\n"
            "validates image dimensions, and marks matched assets as resolved."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python3 tools/asset-source/intake.py silicon-trap \\\n"
            "      --from-dir ~/Downloads/silicon-trap-assets\n\n"
            "  python3 tools/asset-source/intake.py silicon-trap \\\n"
            "      --from-dir ~/Downloads/silicon-trap-assets --dry-run\n\n"
            "  python3 tools/asset-source/intake.py silicon-trap \\\n"
            "      --from-dir ~/Downloads/silicon-trap-assets --move --min-width 3840\n"
        ),
    )
    parser.add_argument(
        "slug",
        help="Episode slug (e.g. silicon-trap)",
    )
    parser.add_argument(
        "--from-dir",
        required=True,
        metavar="DIR",
        help="Directory containing downloaded files to intake",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would happen without copying/moving or updating registry",
    )
    parser.add_argument(
        "--move",
        action="store_true",
        help="Move files instead of copy (default: copy)",
    )
    parser.add_argument(
        "--min-width",
        type=int,
        default=1920,
        metavar="PX",
        help="Minimum pixel width for image validation (default: 1920)",
    )
    parser.add_argument(
        "--min-height",
        type=int,
        default=1080,
        metavar="PX",
        help="Minimum pixel height for image validation (default: 1080)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    return intake(
        slug=args.slug,
        from_dir=Path(args.from_dir).expanduser().resolve(),
        dry_run=args.dry_run,
        move=args.move,
        min_width=args.min_width,
        min_height=args.min_height,
    )


if __name__ == "__main__":
    sys.exit(main())
