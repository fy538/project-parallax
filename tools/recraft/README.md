# Recraft SVG Generation Tool

Generate production-quality vector illustrations for Parallax episodes via the [Recraft V3 API](https://www.recraft.ai/docs/api-reference/).

## Why Recraft over Claude SVG?

Claude generates SVG *code* — geometrically correct but visually flat. Recraft is a visual model trained on design conventions that outputs native SVG with professional composition, negative space, and visual hierarchy. Quality ceiling is dramatically higher for illustrations, conceptual metaphors, and anything that needs to "look designed."

**When to use Recraft:**
- Conceptual metaphors (trap diagrams, strategic game states)
- Editorial illustrations (geopolitical scenes, abstract systems)
- Icon sets for a sequence
- Anything where the script says `[AI-GEN:]` and needs vector output

**When NOT to use Recraft (use Remotion templates instead):**
- Data charts, graphs, timelines → DataChart, TimeSeriesChart, HorizontalTimeline
- Framework diagrams with labeled nodes → FrameworkDiagram
- Maps and routes → ChoroplethMap, RouteAnimation
- Network/flow diagrams → NetworkDiagram, SankeyFlow
- Any visual that's fundamentally *data-driven*

## Setup

```bash
# 1. Get an API key
#    → https://www.recraft.ai/docs/api-reference/getting-started

# 2. Set environment variable
export RECRAFT_API_KEY="your-key-here"

# 3. Install dependency
pip install requests --break-system-packages
```

## Usage

```bash
# Generate a single illustration
python recraft.py generate "geopolitical network with trade flows between nations" -o trade-network.svg

# Use a specific visual mode (shapes the prompt for Parallax brand)
python recraft.py generate "semiconductor chokepoint" --mode diagram -o chokepoint.svg
python recraft.py generate "prisoner's dilemma as a physical trap" --mode metaphor -o trap.svg

# Generate with a specific Recraft style
python recraft.py generate "chip factory schematic" --style flat_2.0 -o factory.svg

# Apply brand duotone treatment after generation
python recraft.py generate "strategic encirclement" --treat standard -o encirclement.svg

# Generate 4 variations to pick from
python recraft.py generate "game theory payoff matrix" -n 4 -o matrix.svg

# Preview only (print URLs, don't download)
python recraft.py generate "test prompt" --preview

# Raw prompt (bypass brand prefix)
python recraft.py generate "exact prompt for recraft" --raw -o custom.svg

# Batch generate from shot list
python recraft.py batch episodes/silicon-trap/shot-list.json --output assets/ --treat standard

# List all available styles
python recraft.py styles
```

## Visual Modes

The `--mode` flag shapes the prompt prefix for brand consistency:

| Mode | Best for | Default style |
|------|----------|---------------|
| `illustration` | Editorial scenes, conceptual visuals | `vector_illustration` |
| `diagram` | System diagrams, schematics, flows | `flat_2.0` |
| `icon` | Icon sets, symbolic representations | `pictogram` |
| `metaphor` | Abstract concepts, visual metaphors | `vector_illustration` |

## Brand Treatment

The `--treat` flag applies the Parallax duotone ramp to the generated SVG:

- `standard` — ink → bronze → amber (default warm palette)
- `conflict` — ink → oxblood → rust (tension/antagonist)
- `editorial` — dark bone → light bone (neutral/analytical)

This remaps all colors in the SVG to sit within the brand's tonal range.

## Batch Mode

Shot list JSON format (same entries work with `source.py` for stock footage):

```json
[
  {
    "id": "shot-15",
    "description": "Abstract visualization of technological dependency trap",
    "type": "ai-generate",
    "visual_mode": "metaphor",
    "context": "Narration about how cheap technology creates lock-in",
    "style": "vector_illustration"
  }
]
```

Only entries with `"type": "ai-generate"` (or `"ai-gen"`, `"svg"`) are processed.

## Cost

~$0.08 per SVG generation. A typical episode with 5-8 AI illustrations = ~$0.50-0.65.

## Integration with Pipeline

```
Script right column: [AI-GEN:] "conceptual viz of..."
    → visual-spec skill identifies AI-GEN entries
    → Shot list JSON with type: "ai-generate"
    → recraft.py batch → SVG files
    → Brand treatment (--treat)
    → Remotion staticFile() or NLE import
```
