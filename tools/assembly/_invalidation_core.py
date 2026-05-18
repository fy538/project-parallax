"""
Pure-function core of tools/assembly/invalidate.py.

Split out so the pattern-matching + dependency-traversal logic is testable
in isolation (no git, no fs side effects, no subprocess). The CLI sits on
top of these primitives.

Concepts:
  · PathPattern  — a pattern like "episodes/{slug}/script-production.md"
                   with {var} captures and *, ** wildcards
  · Rule         — one entry from dependency-graph.json (source pattern,
                   derives list, why/confidence metadata)
  · Invalidation — one (source_path, rule, captured_vars, derived_artifacts)
                   tuple — what got marked stale and why
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

# ── PathPattern ──────────────────────────────────────────────────────────────


# A path pattern is a string like "episodes/{slug}/script-production.md"
# or "remotion-templates/out/*-full*.mp4" or
# "remotion-templates/src/templates/**/*.tsx". We convert it to a regex
# with named capture groups for {var} tokens, '*' that matches a single
# path segment (no slashes), and '**' that matches across path segments
# (slashes allowed). Subsequent substitution lets us materialize derived
# artifact patterns once {slug}-style vars are known.


_VAR_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")


@dataclass(frozen=True)
class PathPattern:
    """A path pattern that can match a real filesystem path and capture
    {var} substitutions. Frozen so it's hashable and usable as a dict key."""

    pattern: str

    def to_regex(self) -> re.Pattern[str]:
        """Compile this pattern to a regex with named captures for {vars}.

        Rules:
          ·  {var}  becomes a named capture group matching one path segment
                    (no slashes). REPEATED {var} usage emits a backreference
                    `(?P=name)` to the first occurrence so identical slugs
                    must match (e.g. `episodes/{slug}/drafts/{slug}-v*.md`).
          ·  **/   matches zero-or-more slash-terminated path segments —
                    `**/x` covers both `x` (no prefix) and `a/b/x`
          ·  **    (without trailing slash) matches anything, slashes incl.
          ·  *     matches one path segment (no slashes)
          ·  any other character is matched literally (with re.escape)
        """
        out_parts: list[str] = []
        seen_vars: set[str] = set()
        i = 0
        p = self.pattern
        while i < len(p):
            ch = p[i]
            if ch == "{":
                # {var} capture or backreference
                end = p.find("}", i)
                if end < 0:
                    raise ValueError(f"Unclosed brace in pattern: {p}")
                var_name = p[i + 1:end]
                if not var_name.isidentifier():
                    raise ValueError(f"Invalid pattern variable {var_name!r} in {p}")
                if var_name in seen_vars:
                    # Backreference — repeated capture name must match the
                    # value bound by the first occurrence. Without this,
                    # `re.compile` raises `redefinition of group name`
                    # and the whole CLI hard-fails at graph load time.
                    out_parts.append(f"(?P={var_name})")
                else:
                    out_parts.append(f"(?P<{var_name}>[^/]+)")
                    seen_vars.add(var_name)
                i = end + 1
            elif ch == "*":
                # Check for ** (cross-segment glob).
                if i + 1 < len(p) and p[i + 1] == "*":
                    # **/ — zero-or-more slash-terminated segments. This is
                    # standard glob semantics: `dir/**/x` covers both
                    # `dir/x` and `dir/a/b/x`. The naive `.*` requires the
                    # trailing slash to match a character, so `dir/**/x`
                    # would NOT match `dir/x` (silently broken edge — would
                    # bite the moment a top-level .cube appears under luts/).
                    if i + 2 < len(p) and p[i + 2] == "/":
                        out_parts.append(r"(?:[^/]+/)*")
                        i += 3  # consume **/
                    else:
                        out_parts.append(r".*")
                        i += 2
                else:
                    out_parts.append(r"[^/]*")
                    i += 1
            else:
                out_parts.append(re.escape(ch))
                i += 1
        return re.compile("^" + "".join(out_parts) + "$")

    def match(self, path: str) -> dict[str, str] | None:
        """If `path` matches this pattern, return the captured {var} dict.
        Otherwise None. An empty match (pattern with no vars) returns {}."""
        m = self.to_regex().fullmatch(path)
        if m is None:
            return None
        return m.groupdict()

    def substitute(self, vars: dict[str, str]) -> str:
        """Replace {var} tokens in this pattern with the supplied values.

        Vars not present in the dict are left in place — useful when an
        artifact pattern uses {slug} from the source match but also has
        wildcards (* or **) the artifact itself uses to express "any of
        these files." Those wildcards stay as wildcards in the output.
        """
        def repl(m: re.Match[str]) -> str:
            name = m.group(1)
            return vars.get(name, m.group(0))
        return _VAR_RE.sub(repl, self.pattern)


# ── Rule + DependencyGraph ──────────────────────────────────────────────────


@dataclass
class DerivedArtifact:
    """One entry in a rule's derives list."""

    artifact: str   # pattern (may contain {var}, *, **)
    regen: str      # human-readable command to regenerate


@dataclass
class Rule:
    """One rule from dependency-graph.json — a source pattern with its
    derived-artifact patterns + metadata."""

    source: PathPattern
    derives: list[DerivedArtifact]
    why: str = ""
    confidence: str = "medium"  # high | medium | low


@dataclass
class DependencyGraph:
    """Loaded dependency manifest. The whole graph is just a list of rules
    — order doesn't matter for matching (we apply all matching rules)."""

    rules: list[Rule] = field(default_factory=list)
    version: str = "1.0"

    @classmethod
    def from_dict(cls, data: dict) -> DependencyGraph:
        rules: list[Rule] = []
        for r in data.get("rules", []):
            rules.append(Rule(
                source=PathPattern(r["source"]),
                derives=[
                    DerivedArtifact(artifact=d["artifact"], regen=d["regen"])
                    for d in r.get("derives", [])
                ],
                why=r.get("why", ""),
                confidence=r.get("confidence", "medium"),
            ))
        return cls(rules=rules, version=str(data.get("version", "1.0")))

    @classmethod
    def from_json_file(cls, path: Path) -> DependencyGraph:
        return cls.from_dict(json.loads(path.read_text(encoding="utf-8")))


# ── Invalidation ─────────────────────────────────────────────────────────────


@dataclass
class Invalidation:
    """The result of matching one source path against one rule.

    Each Invalidation captures: (source path that changed, the rule that
    matched, the variables extracted from the match, the list of derived
    artifacts now stale with their regen commands substituted).
    """

    source_path: str
    rule: Rule
    captured_vars: dict[str, str]
    stale_artifacts: list[tuple[str, str]]  # (artifact_path_pattern, regen_command)


def find_invalidations(
    changed_paths: list[str], graph: DependencyGraph,
) -> list[Invalidation]:
    """For each changed path, apply every matching rule and collect
    invalidations. A single path may match multiple rules (e.g. a script
    path matches both the script rule AND the per-template-json rule if
    the patterns overlap) — all matches are reported."""
    invalidations: list[Invalidation] = []
    for path in changed_paths:
        for rule in graph.rules:
            captured = rule.source.match(path)
            if captured is None:
                continue
            stale = [
                (
                    PathPattern(d.artifact).substitute(captured),
                    PathPattern(d.regen).substitute(captured),
                )
                for d in rule.derives
            ]
            invalidations.append(Invalidation(
                source_path=path, rule=rule, captured_vars=captured,
                stale_artifacts=stale,
            ))
    return invalidations


# ── Minimum reproduction set ────────────────────────────────────────────────


def minimum_regen_commands(invalidations: list[Invalidation]) -> list[str]:
    """Deduplicate regen commands across all invalidations. Preserves first-
    seen ordering so the output is stable + reviewable."""
    seen: set[str] = set()
    out: list[str] = []
    for inv in invalidations:
        for _artifact, regen in inv.stale_artifacts:
            if regen in seen:
                continue
            seen.add(regen)
            out.append(regen)
    return out
