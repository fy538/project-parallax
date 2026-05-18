#!/usr/bin/env python3
"""
migrate_manifest.py — versioned migration framework for assembly-manifest.json.

Right now there's exactly one schema version (1.0) and zero migrations to
apply. This script is a stub: the framework exists so the FIRST schema
evolution doesn't become an ad-hoc one-off — instead it lands as a registered
migration that runs across every shipped episode in one command.

How to evolve the schema (the intended workflow):
  1. Update `remotion-templates/data/assembly-manifest.schema.json` to v1.1
     (or whatever the next version is). Update the `version` const accordingly.
  2. Register a new migration in `MIGRATIONS` below: `("1.0", "1.1"): _your_fn`.
     The function takes a parsed manifest dict and returns the migrated dict.
     Keep it side-effect-free and idempotent.
  3. Run `python3 tools/migrate_manifest.py --to-version 1.1 --dry-run` to see
     what changes per episode. When the diff looks right, re-run with `--write`.
  4. Commit the migrated manifests + the new migration in the same change.
  5. (Optional) Once every shipped episode is at the new version, you may
     prune the old `("0.x", ...)` migration entries — but only after a release
     where no older manifests can possibly exist.

Why not "just edit the JSONs directly":
  - One missed file silently breaks rendering at the bad-version segment.
  - There's no audit trail of WHICH transformation produced the current shape.
  - The next migration won't know whether earlier work has already run.

Usage:
    python3 tools/migrate_manifest.py                    # status: list versions of all manifests
    python3 tools/migrate_manifest.py --episode silicon-trap
    python3 tools/migrate_manifest.py --to-version 1.0 --dry-run    # no-op today
    python3 tools/migrate_manifest.py --to-version 1.0 --write      # would apply, idempotent
    python3 tools/migrate_manifest.py --json

Exit codes:
    0 — clean run (status mode: every manifest at target version; migrate mode: success)
    1 — at least one manifest can't be migrated to the target (no path in registry)
    2 — usage error / target version unknown / manifest file invalid
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EPISODES_DIR = REPO_ROOT / "remotion-templates" / "data" / "episodes"

# Bump this when the canonical schema version advances. The `version` field
# in assembly-manifest.schema.json must match.
CURRENT_VERSION = "1.0"


# ─── Migration registry ──────────────────────────────────────────────────────

# Each migration is a function: (manifest_dict) -> migrated_dict.
# The function should mutate-then-return a deep-copyable dict, set
# `version` to the target, and be idempotent if applied twice.

Migration = Callable[[dict], dict]


def _migrate_noop(manifest: dict) -> dict:
    """No-op migration. Kept as the canonical pattern example.

    When the FIRST real migration lands (e.g. 1.0 → 1.1 renames a field),
    its function would look like:

        def _migrate_1_0_to_1_1(m: dict) -> dict:
            m = copy.deepcopy(m)
            for seg in m.get("segments", []):
                if "oldFieldName" in seg:
                    seg["newFieldName"] = seg.pop("oldFieldName")
            m["version"] = "1.1"
            return m

    Returning a deep-copied dict (instead of mutating in place) keeps the
    caller's input untouched, which matters for --dry-run diff display.
    """
    return manifest  # no transformation today; identity by design


# Keyed by (from_version, to_version) so the planner can compose chains.
# Today's registry is empty; the noop entry is illustrative only.
MIGRATIONS: dict[tuple[str, str], Migration] = {
    # Example registration (kept commented so we don't introduce a fake hop):
    # ("1.0", "1.1"): _migrate_1_0_to_1_1,
    # ("1.1", "1.2"): _migrate_1_1_to_1_2,
}


# ─── Planner ─────────────────────────────────────────────────────────────────


def plan_migration(from_version: str, to_version: str) -> list[tuple[str, str]] | None:
    """
    Return the ordered list of (from, to) hops needed to go from `from_version`
    to `to_version`, or None if no path exists. Identity hop is an empty list.

    BFS over the registry — each step must be a direct entry in MIGRATIONS.
    Linear (a→b→c) is the realistic case but we don't assume it.
    """
    if from_version == to_version:
        return []

    # BFS over forward edges only — we don't auto-derive reverse migrations.
    visited = {from_version}
    queue: list[tuple[str, list[tuple[str, str]]]] = [(from_version, [])]
    while queue:
        current, path = queue.pop(0)
        for (src, dst), _ in MIGRATIONS.items():
            if src != current or dst in visited:
                continue
            new_path = path + [(src, dst)]
            if dst == to_version:
                return new_path
            visited.add(dst)
            queue.append((dst, new_path))
    return None


def apply_migrations(manifest: dict, hops: list[tuple[str, str]]) -> dict:
    """Apply each hop's migration function in order. No mutation of the input."""
    current = manifest
    for hop in hops:
        fn = MIGRATIONS[hop]
        current = fn(current)
    return current


# ─── I/O ─────────────────────────────────────────────────────────────────────


@dataclass
class ManifestStatus:
    slug: str
    path: Path
    version: str | None
    error: str | None = None


@dataclass
class MigrationResult:
    slug: str
    from_version: str
    to_version: str
    hops: list[tuple[str, str]]
    changed: bool
    dry_run: bool
    error: str | None = None


def find_manifests(episode_filter: str | None = None) -> list[Path]:
    paths: list[Path] = []
    if not EPISODES_DIR.is_dir():
        return paths
    for episode_dir in sorted(EPISODES_DIR.iterdir()):
        if not episode_dir.is_dir():
            continue
        if episode_filter and episode_dir.name != episode_filter:
            continue
        m = episode_dir / "assembly-manifest.json"
        if m.is_file():
            paths.append(m)
    return paths


def load_manifest(path: Path) -> tuple[dict | None, str | None]:
    try:
        return json.loads(path.read_text()), None
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON: {exc}"
    except OSError as exc:
        return None, f"could not read: {exc}"


def manifest_status(path: Path) -> ManifestStatus:
    data, err = load_manifest(path)
    slug = path.parent.name
    if err:
        return ManifestStatus(slug=slug, path=path, version=None, error=err)
    return ManifestStatus(slug=slug, path=path, version=data.get("version"))


# ─── Operations ──────────────────────────────────────────────────────────────


def run_status(episode_filter: str | None) -> tuple[int, list[ManifestStatus]]:
    statuses = [manifest_status(p) for p in find_manifests(episode_filter)]
    # Non-zero only if a manifest couldn't even be loaded.
    rc = 1 if any(s.error for s in statuses) else 0
    return rc, statuses


def run_migration(
    target_version: str,
    episode_filter: str | None,
    dry_run: bool,
) -> tuple[int, list[MigrationResult]]:
    results: list[MigrationResult] = []
    rc = 0
    for path in find_manifests(episode_filter):
        slug = path.parent.name
        data, err = load_manifest(path)
        if data is None:
            results.append(MigrationResult(
                slug=slug, from_version="?", to_version=target_version,
                hops=[], changed=False, dry_run=dry_run, error=err,
            ))
            rc = 1
            continue

        from_version = data.get("version", "?")
        plan = plan_migration(from_version, target_version)
        if plan is None:
            results.append(MigrationResult(
                slug=slug, from_version=from_version, to_version=target_version,
                hops=[], changed=False, dry_run=dry_run,
                error=(
                    f"no migration path from {from_version} → {target_version} "
                    f"(register one in MIGRATIONS in migrate_manifest.py)"
                ),
            ))
            rc = 1
            continue

        if not plan:
            # Already at target — nothing to do, not an error.
            results.append(MigrationResult(
                slug=slug, from_version=from_version, to_version=target_version,
                hops=[], changed=False, dry_run=dry_run,
            ))
            continue

        migrated = apply_migrations(data, plan)
        if not dry_run:
            try:
                path.write_text(json.dumps(migrated, indent=2) + "\n")
            except OSError as exc:
                results.append(MigrationResult(
                    slug=slug, from_version=from_version, to_version=target_version,
                    hops=plan, changed=False, dry_run=dry_run,
                    error=f"could not write: {exc}",
                ))
                rc = 1
                continue
        results.append(MigrationResult(
            slug=slug, from_version=from_version, to_version=target_version,
            hops=plan, changed=True, dry_run=dry_run,
        ))
    return rc, results


# ─── Output ──────────────────────────────────────────────────────────────────


def print_status_human(statuses: list[ManifestStatus]) -> None:
    BOLD = "\033[1m"; GREEN = "\033[32m"; RED = "\033[31m"; DIM = "\033[2m"; RESET = "\033[0m"
    print(f"\n{BOLD}manifest versions (target: {CURRENT_VERSION}){RESET}\n")
    if not statuses:
        print(f"{DIM}  (no assembly-manifest.json files found under data/episodes/){RESET}\n")
        return
    for s in statuses:
        if s.error:
            print(f"  {RED}✖{RESET} {s.slug}: {s.error}")
            continue
        on_target = s.version == CURRENT_VERSION
        marker = f"{GREEN}✓{RESET}" if on_target else f"{RED}✖{RESET}"
        version_str = s.version if s.version else f"{RED}(no version field){RESET}"
        print(f"  {marker} {s.slug}: {version_str}")
    print()


def print_migration_human(results: list[MigrationResult]) -> None:
    BOLD = "\033[1m"; GREEN = "\033[32m"; RED = "\033[31m"; YELLOW = "\033[33m"; DIM = "\033[2m"; RESET = "\033[0m"
    mode = "DRY RUN — no files modified" if results and results[0].dry_run else "WRITE"
    print(f"\n{BOLD}migrate_manifest — {mode}{RESET}\n")
    for r in results:
        if r.error:
            print(f"  {RED}✖{RESET} {r.slug}: {r.error}")
            continue
        if not r.hops:
            print(f"  {DIM}·{RESET} {r.slug}: already at {r.to_version} (no-op)")
            continue
        hops_str = " → ".join([r.hops[0][0]] + [dst for _, dst in r.hops])
        marker = f"{YELLOW}~{RESET}" if r.dry_run else f"{GREEN}✓{RESET}"
        print(f"  {marker} {r.slug}: {hops_str}{' (would write)' if r.dry_run else ' (written)'}")
    print()


def print_status_json(statuses: list[ManifestStatus]) -> None:
    out = {
        "currentVersion": CURRENT_VERSION,
        "manifests": [
            {"slug": s.slug, "version": s.version, "error": s.error}
            for s in statuses
        ],
        "registeredMigrations": [
            {"from": src, "to": dst} for (src, dst) in MIGRATIONS
        ],
    }
    print(json.dumps(out, indent=2))


def print_migration_json(results: list[MigrationResult]) -> None:
    out = {
        "results": [
            {
                "slug": r.slug,
                "fromVersion": r.from_version,
                "toVersion": r.to_version,
                "hops": [{"from": h[0], "to": h[1]} for h in r.hops],
                "changed": r.changed,
                "dryRun": r.dry_run,
                "error": r.error,
            }
            for r in results
        ],
    }
    print(json.dumps(out, indent=2))


# ─── CLI ─────────────────────────────────────────────────────────────────────


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="migrate_manifest.py",
        description="Versioned migration framework for assembly-manifest.json. Run with no flags for status.",
    )
    parser.add_argument(
        "--to-version",
        help="Target schema version. If set, runs the migration planner. Default action without this flag is status-only.",
    )
    parser.add_argument(
        "--write", action="store_true",
        help="Without this flag, migrations are dry-run (no files modified).",
    )
    parser.add_argument("--episode", help="Limit to a single episode slug")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args(argv)

    # No `--to-version`: status mode.
    if args.to_version is None:
        rc, statuses = run_status(args.episode)
        if args.json:
            print_status_json(statuses)
        else:
            print_status_human(statuses)
        return rc

    # Migration mode.
    if args.to_version != CURRENT_VERSION and (args.to_version, CURRENT_VERSION) not in MIGRATIONS:
        # The target isn't current AND we don't have an entry directly involving
        # it. This isn't necessarily fatal (the planner can chain), but we
        # short-circuit the obvious case: target version completely unknown.
        known_versions = {CURRENT_VERSION}
        for src, dst in MIGRATIONS:
            known_versions.add(src)
            known_versions.add(dst)
        if args.to_version not in known_versions:
            print(
                f"migrate_manifest: target version '{args.to_version}' is not registered. "
                f"Known: {sorted(known_versions)}",
                file=sys.stderr,
            )
            return 2

    rc, results = run_migration(args.to_version, args.episode, dry_run=not args.write)
    if args.json:
        print_migration_json(results)
    else:
        print_migration_human(results)
    return rc


if __name__ == "__main__":
    sys.exit(main())
