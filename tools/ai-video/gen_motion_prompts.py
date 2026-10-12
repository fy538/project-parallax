#!/usr/bin/env python3
"""
gen_motion_prompts.py — emit per-technique motion-prompt docs from shot-list.json.

The shot list is the source of truth for the motion plan (each asset's
`motion_technique` + per-technique spec; the `seams` array for transitions).
This generator turns that structured plan into copy-paste-ready prompt docs,
one per AI-touched family, so the manual Pika/AE passes follow the current
plan instead of the stale hand-written prompt files.

Phase 1 of the "motion director" automation (project/CHAINED_STILL_LESSONS.md
→ the six-family taxonomy). Deterministic templating — no model calls.

Emits into episodes/<slug>/prompts/:
  - motion-plan.md          master table: every shot, technique, who, status
  - live-still-prompts.md   Pika single-image (subject motion)
  - cinemagraph-prompts.md  Pika masked ambient (one element moves)
  - morph-prompts.md        Pika start+end frame (the 6 transforms)
  - parallax-2.5d-brief.md  After Effects 2.5D briefs (if any)

Ken-burns shots get no prompt doc — they render locally via render_kenburns.py;
they're listed in motion-plan.md for completeness.

Usage:
  python3 tools/ai-video/gen_motion_prompts.py <episode-slug>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
EPISODES = REPO_ROOT / "episodes"

LIVE_NEG = ("flicker, morphing, warping, text drift, watermark, letters changing, "
            "jitter, face warp, feature change, palette shift, photoreal skin, camera shake")
MORPH_NEG = LIVE_NEG + (", smoke, dust, particles, atmospheric haze, fog, mist, "
                        "rising elements, fire, steam")

# motion_technique -> (who does it, where it's handled)
OWNER = {
    "ken-burns":     ("local", "render_kenburns.py (after upscale.py)"),
    "live-still":    ("you — Pika single-image", "live-still-prompts.md"),
    "cinemagraph":   ("you — Pika masked", "cinemagraph-prompts.md"),
    "parallax-2.5d": ("you — After Effects", "parallax-2.5d-brief.md"),
    "morph-endpoint":("you — Pika start+end", "morph-prompts.md"),
    "retired":       ("—", "retired"),
}


def find_still(stills: Path, aid: str) -> str:
    exact = stills / f"{aid}.png"
    if exact.is_file():
        return exact.name
    hits = sorted(p.name for p in stills.glob(f"{aid}-*.png") if "copy" not in p.name.lower())
    return hits[0] if hits else f"{aid}.png  (NOT FOUND on disk)"


def by_tech(assets: list[dict], tech: str) -> list[dict]:
    return [a for a in assets if a.get("motion_technique") == tech]


# ─── doc builders ──────────────────────────────────────────────────────────────

def motion_plan(assets, seams, stills) -> str:
    L = ["# Motion Plan (auto-generated from shot-list.json)\n",
         "> Master view of every shot's motion technique and who produces it.",
         "> Regenerate with `python3 tools/ai-video/gen_motion_prompts.py <slug>`.\n",
         "| Shot | Technique | Who | Still |", "|---|---|---|---|"]
    for a in assets:
        tech = a.get("motion_technique", "?")
        who = OWNER.get(tech, ("?", "?"))[0]
        still = "—" if tech == "retired" else find_still(stills, a["id"])
        L.append(f"| `{a['id']}` | {tech} | {who} | {still} |")
    L += ["\n## Seams (transitions, all handled in NLE)\n",
          "| From | To | Technique |", "|---|---|---|"]
    for s in seams:
        L.append(f"| `{s['from']}` | `{s['to']}` | {s['technique']} |")
    return "\n".join(L) + "\n"


def live_still_doc(assets, stills) -> str:
    rows = by_tech(assets, "live-still")
    L = ["# Live-Still Prompts (Hailuo image-to-video)\n",
         "> One image in, NO end frame. The model adds subtle subject / camera motion.",
         "> Auto-generated from shot-list.json — do not hand-edit; change the shot list and regenerate.\n",
         "**Model per shot is tagged below:**",
         "- `I2V-01-Live` — animate the SUBJECT, camera holds. Purpose-built for flat 2D art (won't 3D-ify color blocks).",
         "- `I2V-01-Director` — the CAMERA moves; takes bracketed commands (`[Truck left]`, `[Push in, slow]`). `Truck` = lateral slide (real parallax); prefer it over a pan.",
         "- **Never Hailuo 02 for live-stills** — it's photoreal-trained and adds realistic texture to flat art.\n",
         "**Rules (every shot):**",
         "- **⚠ Ground the prompt in the ACTUAL still, not the script.** Open the still first; name ONLY elements visible in the frame, and match the motion verb to the figures' actual poses. Anything you name that isn't there will be hallucinated in (see CHAINED_STILL_LESSONS.md). Re-verify after any still regen. *This tool only echoes the shot-list — it cannot see the image.*",
         "- **No negative prompt — Hailuo ignores it.** Restraint is 100% prompt language (there is no motion-intensity slider).",
         "- **Lead with the camera state** (a lock OR a bracketed move) — that clause is your only intensity control.",
         "- Keep it terse: ≤~20 words, ≤3 motion ideas. `subtle`/`slightly` on every figure motion.",
         "- **Faces hold** if a close face is visible — animate hands / body / props only. Distant / back-turned figures may move freely.",
         "- Name the crawl-prone surface to freeze (floors, tiles, signage, board text) — that's where drift shows; re-roll if it crawls.\n",
         "---\n"]
    for a in rows:
        still = find_still(stills, a["id"])
        model = a.get("hailuo_model", "I2V-01-Live")
        L.append(f"## `{a['id']}` — {a.get('description','')}")
        L.append(f"**Still:** `{still}` · **~{a.get('duration_sec','?')}s** · **Model:** `{model}`\n")
        L.append("```")
        L.append(a.get("live_still_motion", "(no live_still_motion in shot-list)"))
        L.append("```")
        if a.get("note"):
            L.append(f"\n_Note: {a['note']}_")
        L.append("\n---\n")
    return "\n".join(L)


def cinemagraph_doc(assets, stills) -> str:
    rows = by_tech(assets, "cinemagraph")
    L = ["# Cinemagraph Prompts (Pika masked / plotagraph — masked ambient)\n",
         "> ONE element moves (smoke, flare, glow, water, flag); everything else is frozen.",
         "> Auto-generated from shot-list.json.\n",
         "**Rules:** mask only the element named below; feather the mask; keep all figures, text, and reflective surfaces in the STATIC region.",
         f"Negative prompt: `-neg {LIVE_NEG}, motion outside masked region`\n",
         "---\n"]
    for a in rows:
        still = find_still(stills, a["id"])
        L.append(f"## `{a['id']}` — {a.get('description','')}")
        L.append(f"**Still:** `{still}` · **~{a.get('duration_sec','?')}s**\n")
        L.append("```")
        L.append(a.get("cinemagraph_motion", "(no cinemagraph_motion in shot-list)"))
        L.append("```\n---\n")
    return "\n".join(L)


def morph_doc(assets, seams, stills) -> str:
    amap = {a["id"]: a for a in assets}
    morphs = [s for s in seams if s.get("technique") == "morph"]
    L = ["# Morph Prompts (Pika 2.5 — start+end frame)\n",
         "> The ONLY 6 pairs that are morphs.\n",
         "## The rule: the two frames ARE the instruction. The prompt is NOT.",
         "In keyframe mode Pika interpolates between your two stills — they already encode the change.",
         "If you *also* describe the change in the prompt (\"a table forms\", \"grid sharpens\"), you hand",
         "the model a second, competing instruction, and **transformation verbs get dramatized as a flash /",
         "glow / sparkle / materialization.** That's the bug. So:",
         "- **Prompt = camera + mood ONLY.** Never name the changing element or any verb of arrival",
         "  (`forms`, `emerges`, `appears`, `sharpens`, `materializes`). The calm default below works for all 6.",
         "- **Keyframes drive the change**, so make them clean: (1) generate frame B by EDITING frame A",
         "  (shared pixels); (2) keep everything identical except the one delta; (3) **exposure-match the two",
         "  frames** (a brightness gap reads as a strobe/flash); (4) optionally ghost the new element at low",
         "  opacity in frame A so it fades in rather than spawns.",
         "- **Settings:** 1080p, motion strength LOW, shortest duration first, lock the seed once calm.\n",
         "**Default prompt for every pair (start minimal — only add a camera word if you want motion):**",
         "```",
         "Static locked camera. Calm, even, unchanging light. Still scene.",
         "```",
         "**Negative (short — long lists backfire in Pika):**",
         "```",
         "glow, light flash, sparkle, particles, bloom, smoke",
         "```\n",
         "---\n"]
    for s in morphs:
        a, b = s["from"], s["to"]
        bsrc = find_still(stills, b)
        asrc = find_still(stills, a)
        dur = s.get("duration_sec", "?")
        L.append(f"## `{a}` → `{b}`{'  (HERO)' if 'HERO' in s.get('intent','') else ''}")
        L.append(f"**Start:** `{asrc}` · **End:** `{bsrc}` · **{dur}s**")
        L.append(f"_What the keyframes achieve (do NOT put this in the prompt): {s.get('intent','')}_")
        sb = s.get("shared_base")
        if sb:
            L.append(f"**Shared base:** {sb} — {amap.get(b,{}).get('regen_note','generate frame B by editing frame A')}")
        if s.get("risk"):
            L.append(f"**Risk:** {s['risk']}" + (f" · fallback: {s['fallback']}" if s.get("fallback") else ""))
        L.append("→ use the default camera/mood prompt above. Do not describe the change.\n---\n")
    return "\n".join(L)


def parallax_doc(assets, stills) -> str:
    rows = by_tech(assets, "parallax-2.5d")
    if not rows:
        return ""
    L = ["# Parallax 2.5D Briefs (After Effects — manual layered depth)\n",
         "> Hand-layered camera move with real parallax. Auto-generated from shot-list.json.",
         "> Do NOT use auto-depth tools (LeiaPix/Immersity) — they fail on flat illustration.\n",
         "---\n"]
    for a in rows:
        still = find_still(stills, a["id"])
        spec = a.get("parallax_2_5d", {})
        L.append(f"## `{a['id']}` — {a.get('description','')}")
        L.append(f"**Still:** `{still}` · **~{a.get('duration_sec','?')}s**\n")
        if spec.get("layers"):
            L.append("**Layers (slice in Photoshop):**")
            for lyr in spec["layers"]:
                L.append(f"- {lyr}")
        if spec.get("move"):
            L.append(f"\n**Move:** {spec['move']}")
        if spec.get("static_layer_caveat"):
            L.append(f"\n**⚠ Static layer:** {spec['static_layer_caveat']}")
        if spec.get("optional"):
            L.append(f"\n**Optional:** {spec['optional']}")
        L.append("\n---\n")
    return "\n".join(L)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    slug = sys.argv[1]
    ep = EPISODES / slug
    sl = ep / "shot-list.json"
    if not sl.is_file():
        print(f"missing {sl}", file=sys.stderr)
        return 2
    data = json.loads(sl.read_text())
    assets = data.get("assets", [])
    seams = data.get("seams", [])
    stills = ep / "assets" / "stills"
    out = ep / "prompts"
    out.mkdir(parents=True, exist_ok=True)

    docs = {
        "motion-plan.md": motion_plan(assets, seams, stills),
        "live-still-prompts.md": live_still_doc(assets, stills),
        "cinemagraph-prompts.md": cinemagraph_doc(assets, stills),
    }
    # Morphs are deferred for ep1 (single-still + cut/dissolve only). If any seam
    # is still tagged "morph", emit the morph doc; otherwise skip it entirely.
    if any(s.get("technique") == "morph" for s in seams):
        docs["morph-prompts.md"] = morph_doc(assets, seams, stills)
    else:
        stale = out / "morph-prompts.md"
        if stale.exists():
            stale.unlink()
            print("  · removed stale morph-prompts.md (ep1 uses cut/dissolve, no morphs)")
    px = parallax_doc(assets, stills)
    if px:
        docs["parallax-2.5d-brief.md"] = px

    for name, body in docs.items():
        (out / name).write_text(body)
        n = sum(1 for ln in body.splitlines() if ln.startswith("## "))
        print(f"  ✓ {name:26s} ({n} shots/pairs)")
    print(f"\nwrote {len(docs)} docs -> {out.relative_to(REPO_ROOT)}/")
    print("note: ken-burns shots render locally (render_kenburns.py) — listed in motion-plan.md, no prompt doc.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
