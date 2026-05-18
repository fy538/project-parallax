# KenBurns Component — Quick Start Guide

## What It Does

Adds cinematic slow pan/zoom to images. The Ken Burns effect — named after the documentary filmmaker — creates subtle camera motion that adds visual depth.

## Installation

Already built and integrated into:
- ✓ PhotoMontage template (alternating directions)
- ✓ AnnotatedImage template (gentle drift for backgrounds)

To use in your own template:

```tsx
import { KenBurns } from "../../components/KenBurns";
```

## Basic Usage

```tsx
// Default: slow zoom-in
<KenBurns>
  <img src="photo.jpg" />
</KenBurns>

// Pan left (camera moves left)
<KenBurns direction="pan-left" intensity={3}>
  <img src="photo.jpg" />
</KenBurns>

// Subtle drift (zoom-in + diagonal pan) — good for backgrounds
<KenBurns direction="drift" intensity={2}>
  <BrandImage src={path} />
</KenBurns>

// Strong zoom (dramatic effect)
<KenBurns direction="zoom-out" intensity={8}>
  <img src="hero.jpg" />
</KenBurns>
```

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `direction` | string | `"zoom-in"` | `zoom-in`, `zoom-out`, `pan-left`, `pan-right`, `pan-up`, `drift` |
| `intensity` | number | `3` | 1-10 scale (1=subtle, 10=dramatic) |
| `startScale` | number | — | Optional initial scale override |
| `style` | CSSProperties | — | Extra CSS for outer container |
| `children` | ReactNode | — | Content to animate (image, component, etc.) |

## Directions Explained

| Direction | Effect | Use Case |
|-----------|--------|----------|
| `zoom-in` | Slow zoom toward center | Emphasize subject, draw attention |
| `zoom-out` | Slow zoom away | Establish context, reveal surroundings |
| `pan-left` | Camera drifts left | Flow with reading direction (left→right) |
| `pan-right` | Camera drifts right | Reverse flow, alternative variety |
| `pan-up` | Camera drifts upward | Vertical imagery, reveal details above |
| `drift` | Zoom-in + diagonal pan | Backgrounds, realistic handheld feel |

## Intensity Recommendations

- **1-2**: Backgrounds with text/annotations (minimal distraction)
- **3-4**: Default for photos, balanced visual interest
- **5-6**: Dramatic imagery, noticeable but not jarring
- **7-10**: Hero images, full-frame subjects, cinematic emphasis

## Real-World Examples

### Image Montage
```tsx
const images = [
  { src: "img1.jpg", duration: 2 },
  { src: "img2.jpg", duration: 2 },
  { src: "img3.jpg", duration: 2 },
];

// Alternate directions for visual variety
const directions = ["zoom-in", "pan-left", "zoom-out", "pan-right"];

{images.map((img, i) => (
  <KenBurns
    key={i}
    direction={directions[i % directions.length]}
    intensity={3}
  >
    <img src={img.src} />
  </KenBurns>
))}
```

### Background with Callouts
```tsx
// Keep background subtle while callouts stay anchored
<KenBurns direction="drift" intensity={2}>
  <BrandImage src={mapImage} composite="background" />
</KenBurns>

{/* Callouts render on top, motion stays gentle */}
<svg>{/* Callout dots + labels */}</svg>
```

### Dramatic Hero Image
```tsx
<KenBurns direction="zoom-in" intensity={7}>
  <img src="hero-landscape.jpg" style={{ width: "100%", height: "100%" }} />
</KenBurns>
```

## How It Works Under the Hood

1. **Reads current frame** via `useCurrentFrame()`
2. **Calculates progress** (0 → 1) over composition duration
3. **Interpolates** scale/translate based on direction
4. **Applies CSS transform** (GPU-accelerated, smooth)

Example for `zoom-in` with intensity 3:
- Frame 0: `scale(1.0)`
- Frame 50%: `scale(1.015)`
- Frame 100%: `scale(1.03)`

## Performance Tips

- ✓ GPU-accelerated (CSS transforms)
- ✓ No per-frame allocations
- ✓ Safe for multiple KenBurns on screen
- ✓ Works with Lambda rendering (no special requirements)

## Opting Out (PhotoMontage Only)

Set `kenBurns: false` in image data to disable:

```json
{
  "src": "assets/image.jpg",
  "durationSec": 2.5,
  "treatment": "standard",
  "compositeMode": "background",
  "kenBurns": false
}
```

## Common Mistakes

❌ **Wrong:** Don't nest overflow: hidden
```tsx
<div style={{ overflow: "hidden" }}>
  <KenBurns>{/* overflow: hidden already in component */}</KenBurns>
</div>
```

❌ **Wrong:** Don't apply transform to KenBurns children
```tsx
<KenBurns>
  <img style={{ transform: "rotate(5deg)" }} />  {/* Conflicts! */}
</KenBurns>
```

✓ **Right:** Let KenBurns handle transforms
```tsx
<KenBurns direction="zoom-in">
  <img src="..." />  {/* Let component manage motion */}
</KenBurns>
```

## FAQ

**Q: Can I combine KenBurns with other animations?**  
A: Yes, wrap KenBurns in another container with opacity/scale animations. KenBurns handles the internal transform.

**Q: Does it work with video?**  
A: Yes! Wrap any content: images, video, BrandImage component, etc.

**Q: Can I change intensity per-frame?**  
A: Not directly, but you can nest multiple KenBurns with different start/end timing.

**Q: Which direction is best?**  
A: **drift** for backgrounds (safe, organic). **zoom-in** for emphasis. Alternate directions in montages for variety.

## See Also

- Main component: `src/components/KenBurns.tsx`
- Implementation guide: `project/_archive/KENBURNS_IMPLEMENTATION.md` (archived post-implementation; the component itself is the source of truth)
- PhotoMontage example: `src/templates/PhotoMontage/PhotoMontage.tsx` (lines 316-390)
- AnnotatedImage example: `src/templates/AnnotatedImage/AnnotatedImage.tsx` (lines 156-176)
