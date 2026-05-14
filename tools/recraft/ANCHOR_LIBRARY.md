# Recraft Anchor Library

Seven canonical reference images that anchor the Parallax visual aesthetic for **Recraft-side** illustration generation. Use these as `--style-ref` inputs when batch-generating per-episode stills — they keep palette, composition, and figure-stylization on-brand across episodes without re-tuning prompts from scratch each time.

This is the **Recraft** anchor set. There is a separate, larger **Flux/fal.ai** anchor set at [`tools/ai-video/style-references/`](../ai-video/style-references/) (15 images) that serves the Kling / Sora / Pika animation pipeline. Both are Tier 1 of the 3-tier visual cascade documented in `recraft.py`'s docstring.

## The 7 anchors

| ID | Name | Register | Realism | Treatment | Primary use |
|---|---|---|---|---|---|
| A1 | Imperial transition | atmospheric | flat | editorial | Civilizational decline, succession crisis, fall-of-empire analogies |
| A2 | Industrial chokepoint | atmospheric | flat | standard | Supply chain dependency, fab interiors, energy infrastructure |
| A3 | Strategic plate | grounding | balanced | standard | War rooms, decision-maker tableaus, policy committees |
| A4 | Archival document | atmospheric | balanced | editorial | Declassified files, treaty drafts, source provenance moments |
| A5 | Solitary thinker | grounding | balanced | standard | Philosopher's Lens cold opens, framework introductions |
| A6 | Conceptual corridor | atmospheric | flat | standard | Lock-in, bifurcation, trap-as-physical-space metaphors |
| A7 | Civic crowd | atmospheric | flat | standard | Anonymous masses, mobilization, legitimacy beats |

Full prompts, negative prompts, and per-anchor notes live in [`anchor-library.json`](./anchor-library.json).

### Why 7, why these

The set is sized to cover roughly the 80% case of cross-episode atmospheric/grounding needs without overlapping the Flux library (which is organized by typography tradition and cultural emphasis). These 7 are organized by **content function** — what kind of visual moment each anchor unlocks — so the choice is `"what is this beat doing?"` rather than `"which culture is this?"`.

Coverage logic:

- **A1, A2, A6** — atmospheric environmental anchors covering the three recurring system shapes (decline, productive capture, structural lock-in).
- **A3, A5** — grounding figurative anchors covering the two recurring human-scale framings (group deliberation, solitary contemplation).
- **A4** — document/archival texture anchor (a recurring need that isn't a scene or an environment).
- **A7** — population-scale anchor for legitimacy / mobilization beats.

The user's original brief suggested categories including "diplomatic ceremony" and "imperial transition." Diplomatic ceremonies are almost always archival (real signing photos exist on Wikimedia for the events Parallax covers), so an AI anchor would duplicate the wrong tier. The freed slot went to **A5 Solitary thinker** because Philosopher's Lens episodes are the channel's lead format and need a brand-coherent contemplative cold-open visual.

## How to generate (one-time per refresh)

```bash
cd tools/recraft
export RECRAFT_API_KEY="..."

# Dry-run first — prints prompts, no API calls
./generate-anchor-library.sh --preview

# Generate all 7, 3 candidates each (recommended for human curation)
./generate-anchor-library.sh --variants 3

# Regenerate just one or two anchors
./generate-anchor-library.sh A1 A4 --variants 4
```

The script reads `anchor-library.json`, calls `recraft.py generate` once per anchor with the matching `--register`, `--realism`, `--text-treatment`, and `--treat` flags, and writes outputs to `tools/recraft/anchor-library/`. Outputs land as candidates; **a human picks the canonical one** before promoting it to overwrite the existing anchor file. Never auto-promote.

Cost: ~$0.08/image × 7 × variants. A 3-variant full refresh is ~$1.70.

## How to use downstream

Once the canonical anchors exist in `tools/recraft/anchor-library/`, episodes use them in two ways.

**Direct style reference (simple case).** For one-off batch runs that don't merit an episode-specific style:

```bash
python recraft.py generate "TSMC cleanroom interior with workers in bunny suits" \
  --register grounding --realism balanced \
  --style-ref tools/recraft/anchor-library/A3-strategic-plate.svg \
  -o episodes/silicon-trap/stills/cleanroom-01.png
```

**Episode-specific style (Tier 2 cascade).** For episodes with a distinct mood, create an episode style by combining the relevant anchors first, then batch-generate against that:

```bash
# Create a per-episode style from A1 (decline) + A4 (archival) for an Ottoman analogy
python recraft.py create-style --name "ottoman-arc-ep" --base-style digital_illustration \
  tools/recraft/anchor-library/A1-imperial-transition.svg \
  tools/recraft/anchor-library/A4-archival-document.svg
# → returns style_id abc123

# Batch the episode's shot list against that style
python recraft.py batch episodes/ottoman-arc/shot-list.json --style-id abc123 --output episodes/ottoman-arc/stills/
```

The point of the anchors is to keep the visual ground stable across episodes while leaving episode-specific tone tunable. Episode 1 and Episode 12 should look like the **same channel**, even though one is about Silicon Valley and one is about Byzantine succession; that's what these anchors enforce.

## Refresh policy

Regenerate the full library when any of the following happen:

1. **Brand color change** in `tools/brand-treatment/palette.json` (the prompts reference specific hex values).
2. **Major Recraft model bump** (e.g. V3 → V4 introduced a new style namespace; a future V5 will need a fresh pass).
3. **Channel base aesthetic shift** — comparable to the May 4, 2026 mannequin → constructivist migration. Anchors built against the prior aesthetic stop working as style references once the aesthetic moves.
4. **Annual freshness pass** — every ~12 months, regenerate to drift-check against the current state of the prompt preambles in `recraft.py` (the preambles get tuned over time; old anchors may diverge from the current preamble's output).

Individual anchors can be regenerated singly when one specific anchor underperforms in production review — pass its ID to the script directly. Bump `version` in `anchor-library.json` on every refresh: major for aesthetic shifts, minor for prompt refinements, patch for re-renders of the same prompt. Keep prior files in git history — never delete.

## Related

- [`anchor-library.json`](./anchor-library.json) — prompts, negative prompts, and metadata for the 7 anchors
- [`generate-anchor-library.sh`](./generate-anchor-library.sh) — generation script
- [`PROMPT_PREAMBLES.md`](./PROMPT_PREAMBLES.md) (if present) — design rationale for the register/realism/typography preamble system
- [`recraft.py`](./recraft.py) — the underlying Recraft V3/V4 CLI
- [`../ai-video/style-references/INDEX.md`](../ai-video/style-references/INDEX.md) — the complementary Flux/fal.ai animation-anchor library (15 images, organized by typography tradition)
- [`../../project/VISUAL_LANGUAGE.md`](../../project/VISUAL_LANGUAGE.md) — the three-register visual system the anchors operationalize
