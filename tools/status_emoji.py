"""
status_emoji.py — single source of truth for status emoji across Parallax tools.

The same three emoji (🟢 ok, 🟡 warning, 🔴 error) appear in ~18 Python tools:
the pipeline dashboard, the pipeline validator, cost forecaster, lint reports,
narration QA, episode watch, etc. Without a token, any one of them could
swap 🔴 for ❌ or 🟢 for ✅ and the dashboard / CLI ecosystem would render
inconsistent health indicators across surfaces.

This module IS the convention. Callers import the constants and interpolate
them; the lint rule `check_status_emoji.py` blocks bare literals outside the
canonical declaration + tests.

Usage:
    from tools.status_emoji import OK, WARN, ERROR

    health.append(f"{OK} No health issues detected")
    if rule.severity == "error":
        emit(f"{ERROR} {rule.message}")

The semantic mapping (severity → emoji) lives in `for_severity()` below so
lint tools don't reinvent it. If we ever shift the channel's palette to use
shaped icons (✅/⚠️/❌) instead of circles, that's a one-line change here.
"""

from __future__ import annotations

from typing import Literal

# ── Canonical emoji constants ─────────────────────────────────────────────
# The trailing space-friendly form: callers do `f"{OK} message"`, NOT
# `f"{OK_PADDED}message"`. Keeping the constant naked makes interpolation
# obvious and avoids two-token churn for adding a space.

OK: str = "🟢"
WARN: str = "🟡"
ERROR: str = "🔴"


# ── Semantic dispatch ─────────────────────────────────────────────────────

Severity = Literal["ok", "info", "warn", "error"]


_SEVERITY_MAP: dict[str, str] = {
    "error": ERROR,
    "warn":  WARN,
    "ok":    OK,
    # `info` collapses to OK because info-level findings don't deserve a
    # yellow-flag warning in dashboard summaries. Promote to WARN
    # explicitly at the call site if a particular `info` should stand out.
    "info":  OK,
}


def for_severity(severity: Severity) -> str:
    """Map a lint-style severity to the channel's status emoji.

    Raises `ValueError` on unknown severities — silently returning OK
    for a typo (`"errror"`) or made-up level (`"critical"`) would mask
    real failures behind a healthy-green indicator. The Literal type
    hint is static-only; this runtime guard makes the contract real.
    """
    try:
        return _SEVERITY_MAP[severity]
    except KeyError:
        raise ValueError(
            f"unknown severity {severity!r}; "
            f"valid: {sorted(_SEVERITY_MAP.keys())}"
        ) from None


# ── Compatibility shim ────────────────────────────────────────────────────
# Several tools previously used a local `_ICON = {"error": "🔴", ...}` map
# (notably tools/lint/check_visual_hook.py). Re-export the same dict shape
# so a one-line migration `from tools.status_emoji import ICON as _ICON`
# replaces the local declaration without touching call sites.

ICON: dict[str, str] = {"error": ERROR, "warn": WARN, "ok": OK}
