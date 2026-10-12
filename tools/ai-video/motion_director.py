#!/usr/bin/env python3
"""
motion_director.py — Phase 2b: propose motion techniques from perception.

Consumes the Phase-2a perception (`development/still-analysis.json`) plus the
shot-list (thread order, shot descriptions, authored morphs) and proposes a
`motion_technique` per shot, applying the two-layer design from
`project/MOTION_DIRECTOR_SPEC.md`:

  1. HARD GATES + candidate generation — deterministic; flat-art bans are implicit
     (we never emit auto-depth / ai-3d-camera). A shot's safe candidate set.
  2. JUDGMENT — pick within the safe set. Unambiguous shots auto-assign; shots
     that qualify for multiple specialized techniques (or a lone-hand borderline)
     are resolved by a beat-keyword heuristic AND flagged for human review.
  Plus BUDGETS (parallax-2.5d <= 2) and the MONOTONY rule (no technique 3x in a row).

It does NOT read the existing `motion_technique` from the shot list (that would be
cheating); it decides from perception + structure + descriptions, then backtests
its proposals against the hand-assigned tags.

Authored morphs (seams with technique == "morph") are respected, not re-decided.

Output: development/motion-proposal.json + development/motion-review.md, and a
printed backtest table.

Usage:
  python3 tools/ai-video/motion_director.py <episode-slug>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
EPISODES = REPO / "episodes"

MASKABLE = ("flame", "flames", "smoke", "cloud", "foliage", "tree", "water",
            "reel", "flare", "glow", "steam", "dust", "fire")
# beat keywords that favor an emergence/depth move over a flat ambient one
EMERGENCE_KW = ("escape", "threshold", "doorway", "open", "horizon", "reveal",
                "emerge", "vast", "boundless", "panorama")
PARALLAX_CAP = 2


def maskable_ambient(p: dict) -> bool:
    return any(any(k in a.lower() for k in MASKABLE) for a in p.get("ambient_elements", []))


def candidates(p: dict) -> set[str]:
    """Safe candidate techniques for one perceived still. ken-burns is always safe."""
    c = {"ken-burns"}
    f, fig = p["faces"], p["figures"]
    h = p.get("hands_or_partial_limbs", {})
    if fig["count"] > 0:
        c.add("live-still")                       # any figure can carry subtle motion (head-hold if face close)
    if h.get("present") and h.get("action") not in (None, "none"):
        c.add("live-still")                       # a writing/pointing hand
    if fig["count"] == 0 and maskable_ambient(p):
        c.add("cinemagraph")
    if fig["count"] == 0 and p["depth"]["structure"] in ("one-point", "layered") \
            and len(p["depth"]["clear_layers"]) >= 2:
        c.add("parallax-2.5d")
    return c


def is_lone_hand(p: dict) -> bool:
    h = p.get("hands_or_partial_limbs", {})
    return bool(h.get("present")) and p["figures"]["count"] == 0 and p["faces"]["count"] == 0


def beat_pick(specialized: set[str], desc: str) -> str:
    """Resolve a contested set using a beat-keyword heuristic."""
    d = desc.lower()
    emergence = any(k in d for k in EMERGENCE_KW)
    if "parallax-2.5d" in specialized and emergence:
        return "parallax-2.5d"
    if "cinemagraph" in specialized:
        return "cinemagraph"
    if "live-still" in specialized:
        return "live-still"
    return sorted(specialized)[0]


DARK_KW = ("conflict", "trap", "dread", "war", "collapse", "menace", "bleak",
           "siege", "reshaping", "captured", "prison")


def propose_treatment(desc: str) -> dict:
    """Treatment is FINISH, not recolor. Default = documentary (grain + halation
    + vignette, color preserved). Dark/menace beats get flagged as optional
    duotone-accent candidates (a manual editorial call — not auto-applied)."""
    if any(k in desc.lower() for k in DARK_KW):
        return {"finish": "documentary", "duotone_accent_candidate": True}
    return {"finish": "documentary"}


def decide(p: dict, desc: str) -> dict:
    cands = candidates(p)
    spec = cands - {"ken-burns"}
    flags, review = [], False

    if not spec:
        tech, conf = "ken-burns", 0.9
    elif is_lone_hand(p) and spec == {"live-still"}:
        tech, conf, review = "ken-burns", 0.55, True
        flags.append("lone hand — ken-burns (push on the work) vs live-still (hand completes the gesture); beat decides")
    elif len(spec) == 1:
        tech = next(iter(spec))
        conf = 0.85
        if tech == "parallax-2.5d":
            conf, review = 0.7, True
            flags.append("hero 2.5d — confirm budget + that the beat earns the premium move")
    else:
        tech = beat_pick(spec, desc)
        conf, review = 0.6, True
        flags.append(f"contested {sorted(spec)} — picked {tech} by beat keywords; confirm")

    if p["resolution"].get("needs_upscale_for_kenburns") and tech in ("ken-burns", "parallax-2.5d"):
        flags.append("needs upscale before local render (source < 1920w)")
    if not p.get("palette_on_brand", True):
        review = True
        flags.append("palette off-brand — regenerate the still before animating")
    return {"technique": tech, "candidates": sorted(cands), "confidence": conf,
            "needs_human_review": review, "flags": flags,
            "treatment": propose_treatment(desc)}


def propose(slug: str) -> int:
    ep = EPISODES / slug
    per_path = ep / "development" / "still-analysis.json"
    sl = json.loads((ep / "shot-list.json").read_text())
    if not per_path.is_file():
        print(f"no perception yet: run Phase 2a -> {per_path}", file=sys.stderr)
        return 2
    per = {s["shot_id"]: s for s in json.loads(per_path.read_text())["stills"]}

    amap = {a["id"]: a for a in sl["assets"]}
    hand = {a["id"]: a.get("motion_technique") for a in sl["assets"]}  # for backtest only
    morph_eps = {s["from"] for s in sl.get("seams", []) if s.get("technique") == "morph"} | \
                {s["to"] for s in sl.get("seams", []) if s.get("technique") == "morph"}

    proposals, parallax_used = [], 0
    seen: set[str] = set()  # some shots (e.g. forecast-01) belong to two threads
    # iterate thread by thread to enforce monotony within a thread
    for thread, ids in sl["thread_summary"].items():
        recent: list[str] = []
        for sid in ids:
            a = amap.get(sid, {})
            if a.get("motion_technique") == "retired" or sid in seen:
                continue
            seen.add(sid)
            desc = a.get("description", "")
            if sid in morph_eps:
                proposals.append({"shot_id": sid, "thread": thread, "technique": "morph-endpoint",
                                  "candidates": ["morph-endpoint"], "confidence": 1.0,
                                  "needs_human_review": False, "flags": ["authored transform — respected, not re-decided"],
                                  "treatment": propose_treatment(desc)})
                recent.append("morph-endpoint")
                continue
            if sid not in per:
                proposals.append({"shot_id": sid, "thread": thread, "technique": None,
                                  "candidates": [], "confidence": 0.0, "needs_human_review": True,
                                  "flags": ["no perception — run Phase 2a on this still"],
                                  "treatment": propose_treatment(desc)})
                continue
            d = decide(per[sid], a.get("description", ""))
            # budget: parallax-2.5d cap
            if d["technique"] == "parallax-2.5d":
                if parallax_used >= PARALLAX_CAP:
                    alt = "cinemagraph" if "cinemagraph" in d["candidates"] else "ken-burns"
                    d["flags"].append(f"parallax-2.5d budget ({PARALLAX_CAP}) exhausted -> downgraded to {alt}")
                    d["technique"], d["needs_human_review"] = alt, True
                else:
                    parallax_used += 1
            # monotony: no 3x in a row within the thread
            if len(recent) >= 2 and recent[-1] == recent[-2] == d["technique"]:
                alts = [c for c in d["candidates"] if c != d["technique"]]
                if alts:
                    pick = beat_pick(set(alts) - {"ken-burns"} or {"ken-burns"}, a.get("description", ""))
                    d["flags"].append(f"monotony break: 3rd {d['technique']} in a row -> {pick}")
                    d["technique"], d["needs_human_review"] = pick, True
            d.update({"shot_id": sid, "thread": thread})
            proposals.append(d)
            recent.append(d["technique"])

    # ── write outputs ──
    out_json = ep / "development" / "motion-proposal.json"
    out_json.write_text(json.dumps({"slug": slug, "proposals": proposals}, indent=2) + "\n")

    md = ["# Motion Director — Proposals (Phase 2b, auto-generated)\n",
          "> Proposed by `tools/ai-video/motion_director.py` from perception + structure.",
          "> Review the flagged rows; approved tags go into shot-list.json, then regenerate prompts.\n",
          "| Shot | Proposed | Treatment | Conf | Review? | Candidates | Flags |",
          "|---|---|---|---|---|---|---|"]
    for p in proposals:
        rv = "⚠️ yes" if p["needs_human_review"] else "—"
        tr = p.get("treatment", {})
        tr_s = tr.get("finish", "?") + (" +duotone?" if tr.get("duotone_accent_candidate") else "")
        md.append(f"| `{p['shot_id']}` | {p['technique']} | {tr_s} | {p['confidence']:.2f} | {rv} | "
                  f"{', '.join(p['candidates'])} | {'; '.join(p['flags']) or '—'} |")
    (ep / "development" / "motion-review.md").write_text("\n".join(md) + "\n")

    # ── backtest vs hand plan (only shots we actually decided + that have a hand tag) ──
    decided = [p for p in proposals if p["technique"] and p["technique"] != "morph-endpoint"
               and hand.get(p["shot_id"]) and hand[p["shot_id"]] != "retired"]
    exact = sum(1 for p in decided if p["technique"] == hand[p["shot_id"]])
    print(f"{'shot':12s} {'proposed':16s} {'hand':16s} {'review':8s} match")
    for p in decided:
        h = hand[p["shot_id"]]
        m = "OK" if p["technique"] == h else "DIFF"
        rv = "flagged" if p["needs_human_review"] else ""
        print(f"{p['shot_id']:12s} {p['technique']:16s} {h:16s} {rv:8s} {m}")
    flagged_diffs = sum(1 for p in decided if p["technique"] != hand[p["shot_id"]] and p["needs_human_review"])
    print(f"\nbacktest: {exact}/{len(decided)} exact match; "
          f"{len(decided)-exact} differ ({flagged_diffs} of those were correctly flagged for review)")
    print(f"wrote: {out_json.relative_to(REPO)} + motion-review.md")
    print("\nnext: review motion-review.md. To accept, run with --apply.")
    print("  flagged rows are NOT written unless you set \"approved\": true on them in motion-proposal.json")
    return 0


# ─── Phase 2c: write-through after approval ──────────────────────────────────────

PARAM_KEY = {"ken-burns": "ken_burns", "live-still": "live_still_motion",
             "cinemagraph": "cinemagraph_motion", "parallax-2.5d": "parallax_2_5d"}
ALL_PARAM_KEYS = set(PARAM_KEY.values())


def _focus_xy(region: str) -> tuple[float, float]:
    x = {"left": 0.35, "right": 0.65}.get(region, 0.5)
    y = {"upper": 0.40, "lower": 0.60}.get(region, 0.5)
    return x, y


def starter_params(tech: str, p: dict) -> dict:
    """Auto-fill a starter param block from perception (human refines later)."""
    if tech == "ken-burns":
        fx, fy = _focus_xy(p.get("dominant_subject_region", "center"))
        return {"ken_burns": {"start_scale": 1.0, "end_scale": 1.15, "focus_x": fx,
                              "focus_y": fy, "duration_sec": 4, "_autofilled": True}}
    if tech == "live-still":
        face_close = p["faces"]["max_scale"] in ("close", "mid")
        moving = []
        h = p.get("hands_or_partial_limbs", {})
        if h.get("present"):
            moving.append(f"the {h.get('action', 'hand')} hand")
        moving += list(p.get("ambient_elements", []))
        if p["figures"]["implied_action"] in ("walking", "working", "gesturing"):
            moving.append(f"the {p['figures']['implied_action']} figure")
        m = ", ".join(moving) or "subtle subject motion"
        prefix = "heads HOLD (faces visible — do not animate); " if face_close else ""
        return {"live_still_motion": f"{prefix}animate only {m}; camera holds. [autofilled — refine]"}
    if tech == "cinemagraph":
        amb = ", ".join(p.get("ambient_elements", [])) or "the ambient element"
        return {"cinemagraph_motion": f"mask only {amb} — gentle motion; figures, text, and "
                                      f"reflective surfaces hold static. [autofilled — refine]"}
    if tech == "parallax-2.5d":
        spec = {"layers": p["depth"]["clear_layers"],
                "move": "slow push through — foreground slides past as background grows",
                "_autofilled": True}
        if p.get("reflective_surfaces"):
            spec["static_layer_caveat"] = f"keep {', '.join(p['reflective_surfaces'])} in a static layer"
        return {"parallax_2_5d": spec}
    return {}


def apply(slug: str) -> int:
    import subprocess
    ep = EPISODES / slug
    prop_path = ep / "development" / "motion-proposal.json"
    if not prop_path.is_file():
        print(f"no proposal yet — run `motion_director.py {slug}` first", file=sys.stderr)
        return 2
    proposals = json.loads(prop_path.read_text())["proposals"]
    per_path = ep / "development" / "still-analysis.json"
    per = {s["shot_id"]: s for s in json.loads(per_path.read_text())["stills"]} if per_path.is_file() else {}
    sl_path = ep / "shot-list.json"
    sl = json.loads(sl_path.read_text())
    amap = {a["id"]: a for a in sl["assets"]}

    applied = changed = pending = 0
    notes, pend = [], []
    for pr in proposals:
        tech = pr.get("technique")
        if not tech or tech == "morph-endpoint":
            continue
        sid = pr["shot_id"]
        a = amap.get(sid)
        if not a or a.get("motion_technique") == "retired":
            continue
        approved = (not pr["needs_human_review"]) or pr.get("approved") is True
        if not approved:
            pending += 1
            pend.append(sid)
            continue
        applied += 1
        old = a.get("motion_technique")
        if old != tech:
            for k in ALL_PARAM_KEYS:
                a.pop(k, None)
            a["motion_technique"] = tech
            if sid in per:
                a.update(starter_params(tech, per[sid]))
            changed += 1
            notes.append(f"{sid}: {old} → {tech} (starter params autofilled)")
        elif PARAM_KEY[tech] not in a and sid in per:
            a.update(starter_params(tech, per[sid]))
            changed += 1
            notes.append(f"{sid}: kept {tech}, autofilled missing params")
        # write/refresh the treatment block (documentary finish + accent flags)
        if pr.get("treatment") and a.get("treatment") != pr["treatment"]:
            a["treatment"] = pr["treatment"]
            changed += 1
            notes.append(f"{sid}: treatment = {pr['treatment'].get('finish')}")

    if changed:
        sl_path.write_text(json.dumps(sl, indent=2) + "\n")
        print(f"shot-list.json updated ({changed} change(s)):")
        for n in notes:
            print(f"  • {n}")
        subprocess.run([sys.executable, str(Path(__file__).parent / "gen_motion_prompts.py"), slug], check=False)
    else:
        print("shot-list.json unchanged (approved proposals already match — idempotent).")
    print(f"\napplied {applied} approved proposal(s); {pending} still pending approval"
          + (f": {', '.join(pend)}" if pend else ""))
    if pend:
        print("  → resolve each: set \"approved\": true (and optionally change \"technique\") in motion-proposal.json, then re-run --apply")
    return 0


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description="Motion director — propose (default) or --apply approved proposals.")
    ap.add_argument("slug")
    ap.add_argument("--apply", action="store_true",
                    help="write approved proposals into shot-list.json + regenerate prompts (Phase 2c)")
    args = ap.parse_args()
    return apply(args.slug) if args.apply else propose(args.slug)


if __name__ == "__main__":
    raise SystemExit(main())
