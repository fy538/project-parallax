# KenBurns Component Implementation — Parallax Remotion

**Status:** Complete  
**Date:** May 2, 2026  
**Component Location:** `/Users/feihuyan/project-parallax/remotion-templates/src/components/KenBurns.tsx`

---

## Overview

The KenBurns component adds cinematic slow pan and zoom effects to images and content in Remotion compositions. It creates subtle, continuous camera motion that adds visual depth and dynamism without distracting from content.

Named after the documentary filmmaker Ken Burns, who pioneered the "Ken Burns effect" (slow zoom and pan over still photographs), this component implements six directional modes:
- **zoom-in** — slow zoom toward center (default)
- **zoom-out** — slow zoom away from center
- **pan-left** — camera drifts left
- **pan-right** — camera drifts right
- **pan-up** — camera drifts up
- **drift** — subtle zoom-in + gentle diagonal pan (realistic, organic camera feel)

---

## Component Specification

### Props

```typescript
interface KenBurnsProps {
  direction?: "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "pan-up" | "drift";
  intensity?: number;        // 1-10, default 3
  startScale?: number;       // optional override for initial scale
  style?: React.CSSProperties; // optional CSS for outer container
  children: React.ReactNode; // content to animate
}
```

### Intensity Scale (1-10)

- **1-2** = very subtle (1-2% movement) — backgrounds with text, minimal distraction
- **3-4** = gentle (3-4% movement) — default for typical images, balanced effect
- **5-7** = moderate (5-7% movement) — dramatic imagery, noticeable but not jarring
- **8-10** = strong (8-10% movement) — hero images that can withstand motion

### Implementation Details

- **Animation Drive:** `useCurrentFrame()` + `interpolate()` from Remotion
- **Easing:** Linear (smooth, cinematic motion, no bouncing)
- **Extrapolation:** Clamped (values freeze at boundaries)
- **Transform Origin:** Center center (natural zoom/pan focal point)
- **Performance:** Uses CSS transforms (GPU-accelerated), `willChange: "transform"` optimization

### The "drift" Mode

The drift mode combines:
1. **Zoom-in** at half the specified intensity (subtle scale increase)
2. **Diagonal pan** using sine/cosine waves for organic-feeling motion
   - X movement: `sin(progress * π/2)` — starts fast, ends slow
   - Y movement: `cos(progress * π/2 + 0.5)` — inverse of X for diagonal feel

This creates a natural, handheld-camera effect perfect for backgrounds where callouts/annotations are anchored.

---

## Files Created / Modified

### Created
- **`src/components/KenBurns.tsx`** — the component (220 lines, fully documented)

### Modified
- **`src/templates/PhotoMontage/PhotoMontage.tsx`**
  - Added import: `import { KenBurns } from "../../components/KenBurns";`
  - Updated `renderImage()` function to wrap image with KenBurns
  - Alternates directions for visual variety: zoom-in → pan-left → zoom-out → pan-right
  - Makes KenBurns opt-in: only applies if `image.kenBurns !== false`

- **`src/templates/PhotoMontage/types.ts`**
  - Added field to `MontageImage`: `kenBurns?: boolean;` (default: true)

- **`src/templates/AnnotatedImage/AnnotatedImage.tsx`**
  - Added import: `import { KenBurns } from "../../components/KenBurns";`
  - Wrapped background image in `<KenBurns direction="drift" intensity={2}>`
  - Uses gentle (intensity 2) drift for subtle background motion without distracting callouts

---

## Usage Examples

### Basic Zoom-In (Default)
```tsx
<KenBurns>
  <img src="photo.jpg" />
</KenBurns>
```

### Gentle Pan with Background Image
```tsx
<KenBurns direction="pan-right" intensity={2}>
  <BrandImage src={imagePath} ramp="standard" />
</KenBurns>
```

### Dramatic Zoom with Annotation
```tsx
<KenBurns direction="zoom-out" intensity={7}>
  <img src="hero-image.jpg" />
</KenBurns>
```

### Drift for Callout Backgrounds
```tsx
<KenBurns direction="drift" intensity={2}>
  <BrandImage src={data.imageSrc} composite="background" />
</KenBurns>
```

### Opt-Out in PhotoMontage
```typescript
// In visual-spec or assembly manifest
{
  "src": "assets/ep01/image.jpg",
  "durationSec": 2.5,
  "treatment": "standard",
  "compositeMode": "background",
  "kenBurns": false  // Disables Ken Burns for this image
}
```

---

## Integration Points

### PhotoMontage Template

**What it does:**
- Wraps each image in KenBurns (unless explicitly disabled)
- Alternates directions for visual variety across image sequence
- Uses intensity 3 (gentle, default)

**When to opt-out:**
- Fast-cut montages where motion would feel jarring
- Images with text overlays that need stability
- When cross-fading to avoid double-motion effect

**Example sequence:**
1. Image 1 (zoom-in) → slow zoom toward subject
2. Image 2 (pan-left) → camera drifts left
3. Image 3 (zoom-out) → slow zoom away from subject
4. Image 4 (pan-right) → camera drifts right
5. (Pattern repeats if more images)

### AnnotatedImage Template

**What it does:**
- Wraps the background image in KenBurns with drift mode
- Very gentle (intensity 2) to keep callout dots anchored
- Creates subtle depth without movement that contradicts annotations

**Why drift mode:**
- Combines zoom (draws eye inward) + diagonal pan (organic feel)
- Feels like realistic camera movement, not mechanical
- Works well with foreground elements (callouts) that stay fixed

---

## CSS Architecture

### Outer Container
```tsx
<div style={{
  overflow: "hidden",        // Clip transformed content
  width: "100%",
  height: "100%",
  ...style                   // User-provided CSS
}} />
```
- Establishes clipping boundary for transforms
- Allows custom positioning/sizing via style prop

### Transform Wrapper
```tsx
<div style={{
  width: "100%",
  height: "100%",
  transform: `scale(...) translate(...)`,
  transformOrigin: "center center",
  willChange: "transform"    // GPU acceleration hint
}} />
```
- Applies animations
- GPU hint for performance on lower-end devices

---

## Performance Considerations

1. **Per-frame calculation:** Minimal — only frame interpolation, no per-image processing
2. **GPU acceleration:** CSS transforms use hardware acceleration
3. **Memory:** No additional allocations per frame
4. **Stacking:** Safe to wrap multiple KenBurns components (each has independent transform)

### Optimization for Lambda Rendering
The component is fully compatible with Lambda/CPU-only renders:
- No filters or blur (see Background.noBlur for similar pattern)
- Pure CSS transforms (hardware or CPU fallback both work)
- No WebGL or canvas requirements

---

## Design Rationale

### Why These Directions?

- **zoom-in / zoom-out**: Classic Ken Burns effect, emotionally intuitive (move closer = emphasis, move away = context)
- **pan-left / pan-right**: Directional flow, guides eye across frame edge (left→right is natural reading direction)
- **pan-up**: Less common, useful for imagery with vertical composition
- **drift**: Realistic camera feel without obvious directionality, perfect for backgrounds where motion shouldn't be distracting

### Why Alternating in PhotoMontage?

Visual monotony is the enemy of rapid-fire image sequences. Rotating through four directions keeps the eye engaged while maintaining coherent pacing. The pattern is:
- Predictable (viewers subconsciously expect the cycle)
- Variety within rhythm (consistent but not repetitive)
- Works with transitions (wipe/dissolve feel less jarring after motion)

### Why Gentle intensity=2 for AnnotatedImage?

Callout dots and labels are fixed to image coordinates. If the background zooms/pans aggressively, the callouts appear to detach and re-anchor, creating cognitive dissonance. Gentle drift (intensity 2) adds depth without competing with foreground elements.

---

## Testing Checklist

- [x] Component compiles without errors
- [x] All six directions work (zoom-in, zoom-out, pan-left, pan-right, pan-up, drift)
- [x] Intensity clamping works (1-10 range enforced)
- [x] PhotoMontage renders with alternating directions
- [x] AnnotatedImage renders with drift mode
- [x] Opt-out works (kenBurns: false on images)
- [x] Transforms are GPU-accelerated (CSS transform, not JS animation)
- [x] Works with nested content (BrandImage, img, any React content)

---

## Future Extensions

### Potential Enhancements
1. **Per-direction intensity override** — specify `intensity-zoom-in={5}` separately
2. **Easing options** — support Easing.quad, Easing.cubic for different feels
3. **Phase offset** — for layered effects (foreground zooms in, background zooms out simultaneously)
4. **Automated direction selection** — based on image dominant color or composition analysis
5. **Oscillation mode** — zoom in then out, or zigzag pan (for longer-duration compositions)

### Integration with Assembly Manifest
The assembly manifest could include per-segment KenBurns config:
```json
{
  "segment": 5,
  "visualElement": {
    "type": "PhotoMontage",
    "kenBurnsConfig": {
      "enabled": true,
      "direction": "zoom-in",
      "intensity": 4
    }
  }
}
```

---

## Files & Paths Summary

| File | Purpose | Status |
|------|---------|--------|
| `src/components/KenBurns.tsx` | Component implementation | ✓ Created |
| `src/templates/PhotoMontage/PhotoMontage.tsx` | Integration + alternating directions | ✓ Modified |
| `src/templates/PhotoMontage/types.ts` | Added `kenBurns?: boolean` to MontageImage | ✓ Modified |
| `src/templates/AnnotatedImage/AnnotatedImage.tsx` | Drift mode for background image | ✓ Modified |

---

## Code Review Notes

### Quality Assurance
- **TypeScript:** Fully typed, no `any` types
- **Documentation:** JSDoc header + inline comments for complex logic
- **Error Handling:** Intensity clamped to valid range (1-10)
- **Accessibility:** No impact on semantic HTML, screen readers unaffected
- **Performance:** No unnecessary re-renders, GPU acceleration enabled

### Backward Compatibility
- ✓ PhotoMontage: KenBurns opt-in (disabled by setting `kenBurns: false`)
- ✓ AnnotatedImage: Replaces inline `kenBurnsDrift()` call with component
- ✓ No breaking changes to existing templates
- ✓ Graceful fallback if component not used

---

## Contact & Next Steps

This component is production-ready and fully integrated into PhotoMontage and AnnotatedImage templates. To use in other templates:

1. Import: `import { KenBurns } from "../../components/KenBurns";`
2. Wrap content: `<KenBurns direction="zoom-in" intensity={3}>{children}</KenBurns>`
3. Optional: Add `kenBurns?: boolean` field to template data types for opt-out

For questions or enhancements, see the component JSDoc or modify the defaults in the `KenBurnsProps` interface.
