# Color Storytelling Guide

> Layer 3 — Ambient emotional temperature shifts across an episode.

## How It Works

Every template now accepts an optional `backgroundTint` field — a hex color that creates a subtle radial wash (6-10% opacity) over the background. This shifts the ambient mood without changing any content colors.

The effect is subliminal: viewers won't consciously see "the background turned blue," but they'll *feel* the analytical perspective shift.

## Color Map

| Narrative Focus | Tint Color | Hex | When to Use |
|----------------|-----------|-----|-------------|
| US / Western perspective | Cool blue | `#3266AD` | US policy analysis, Western strategic thinking, ASML/TSMC from Western lens |
| China / Eastern perspective | Warm red | `#C23B22` | China's response, 举国体制, SMIC analysis, Eastern strategic thinking |
| Tension / Confrontation | Amber | `#E5A544` | Direct conflict moments, sanctions, embargos, "the trap" framing |
| Neutral / Structural | None (omit field) | — | Historical background, both-sides analysis, framework introductions |
| Danger / Escalation | Deep red | `#D64545` | Worst-case scenarios, military implications, Pearl Harbor parallels |
| Resolution / Hope | Soft green | `#5DAA68` | Cooperation possibilities, diplomatic openings, positive outcomes |

## Usage in JSON Data Files

```json
{
  "episode": "EP01",
  "title": "SMIC's 7nm Breakthrough",
  "backgroundTint": "#C23B22",
  ...
}
```

## EP01 Color Arc

The Silicon Trap's emotional journey:

1. **Opening / Episode title** — No tint (neutral, establishing)
2. **Beat 1: Your Chips** — `#3266AD` (US perspective: "we depend on TSMC")
3. **Beat 2: Logic of Denial** — Amber `#E5A544` → transitions to `#3266AD` (US policy, sanctions)
4. **Beat 3: The Other Side of the Wall** — `#C23B22` (China's response, 举国体制, SMIC)
5. **Beat 4: The Trap** — `#E5A544` (mutual entanglement, neither side wins)
6. **Closing** — No tint (pull back to neutral, reflective)

## Implementation Notes

- The tint is applied by the `Background` component as a radial gradient overlay
- It uses hex opacity notation (`color10` = ~6% opacity) for subtlety
- The tint is purely additive — it doesn't change text colors, chart colors, or any semantic coding
- For maps (ChoroplethMap, RouteAnimation), the tint layers on top of the map-variant background
- The visual-spec skill should assign tints based on the narrative focus of each visual segment
