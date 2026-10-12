# Motion-Grounding Report — prisoners-dilemma

> Produced by the `ground-motion` skill (first dogfood run, 2026-05-24).
> Scope: the 5 stills regenerated this afternoon (`02, 11, 11b, 14, 14b`). The other
> live-stills (`01, 04, 05, 07, 08, 10, 16, forecast-01`) + cinemagraph `09` were
> grounded earlier this session and are unchanged. Perception records: `still-analysis.json`.

## Verdict: ✅ all 5 regenerations passed
Every regen came back on the constructivist register, every motion prompt names only
on-frame elements with a pose-matched verb, and **both continuity pairs are now consistent.**
The style-lock + era-pin + ref-image fixes from earlier this session worked.

## Auto-applied (low-risk, mechanical)
| Shot | Change |
|---|---|
| `aigen-11` | verb-to-pose: "forward-charging poses" → "forward-leaning, advancing poses" (the regen is a composed advance, not a sprint) |

No named-but-absent elements found in any of the 5 → no hallucination-risk drops needed.

## Flags (judgment calls) — none blocking
| Shot | Type | Finding | Action |
|---|---|---|---|
| — | — | none | — |

(For reference, the failures this pass is designed to catch — all **clear** on these 5:
hallucination risk = none; wrong-verb-for-pose = fixed on `11`; wrong-technique = none,
no dynamic sprint remains; style drift = none, all faceted/constructivist.)

## Continuity checks (cut/dissolve neighbours)
| Seam | Technique | Style / era / framing | Result |
|---|---|---|---|
| `11 → 11b` | cross-dissolve | both faceted · both primitive hunters (furs, spears) · same forest + dawn light | ✅ consistent (was the modern-painterly → ancient-faceted break — now fixed) |
| `14 → 14b` | cut | both faceted · both contemporary · same street/facades/light pools | ✅ consistent |

## Technique check
No reclassifications. `11` is now a composed advance (not the old sprint), so a held-pose +
ambient (light/dust) live-still is safe; `11b`/`02`/`14`/`14b` are calm scenes well-suited to
live-still. All `dynamic_action` flags resolved.

## Follow-up audit — `01 / 04 / 05` (added 2026-05-24, after they were flagged as unverified)
These three had been called "re-check" but not actually audited. Done now:
| Shot | Prompt vs. current still | Clip status |
|---|---|---|
| `aigen-01` | ✓ matches — reels/desk/papers + writing hand all in frame; truck-left, faces hold | **stale** (clip May 23 < still May 24) → re-run |
| `aigen-04` | ✓ matches — lone figure walking away, checkerboard floor + chalkboard matrix/network | **stale** → re-run |
| `aigen-05` | ✗ **was wrong** — prompt said "toward the bright **terrace**" but the regen shows a **city skyline**. Fixed → "toward the bright city skyline beyond." (The "terrace" was a stale carryover from the depth-parallax `05-doorway` fixture; the *generation* prompt Shot 6 says "world outside the building" and needs no change.) | **stale** → re-run |

All three existing Hailuo clips were built from pre-regen (May 23) stills → they animate the
old images and **must be re-run**, not reused.

## Re-run reminder
Any future still regen stales its motion prompt — re-run `ground-motion` on the changed
shots before spending Hailuo generations. The other live-stills + the `09` cinemagraph
were verified earlier and need no action unless regenerated.

## Net
All 13 live-still prompts + the cinemagraph are now grounded against the actual stills.
The episode's i2v queue (`prompts/live-still-prompts.md`) is clean to run.
