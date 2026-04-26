# Visual Regression Testing Infrastructure

This directory contains the automated visual regression test suite for all 14 Remotion compositions in the project.

## Overview

The test infrastructure uses:
- **Vitest** for test runner and assertions
- **@remotion/renderer** for rendering still frames at frame 30
- **Playwright Chromium** as the headless browser backend
- **Pixel-level comparison** with file size tolerance to detect visual changes

## Files

### `setup.ts`
Core test configuration and browser initialization:
- Finds and launches Playwright Chromium browser
- Manages browser lifecycle (init/close)
- Ensures baseline directory exists

### `render-helper.ts`
Rendering and comparison utilities:
- `initBundler()` - Bundles the entry point once before tests
- `renderCompositionFrame()` - Renders a specific frame from a composition
- `comparePNGs()` - File-size based comparison with 5% tolerance
- `saveBaseline()` - Saves a render as a baseline reference

### `templates.test.ts`
Main test suite that runs all 14 compositions:
- Tests: ChoroplethMap, RouteAnimation, TimelineComparison, DataChart
- Tests: KineticTypography, FrameworkDiagram, TitleTransition, DecisionTree
- Tests: SplitComposition, ProbabilityGauge, ImageComposite
- Tests: KineticShort, DataChartShort, SplitShort

Each test:
1. Renders frame 30 of the composition
2. On first run: saves the render as a baseline
3. On subsequent runs: compares against the baseline with 5% size tolerance
4. Fails if visual regression is detected

### `baselines/` directory
Stores baseline PNG references for each composition (created on first run):
```
baselines/
├── ChoroplethMap-frame-30.png
├── RouteAnimation-frame-30.png
├── TimelineComparison-frame-30.png
├── ...
└── SplitShort-frame-30.png
```

## Setup & Installation

### 1. Install dependencies

```bash
npm install
```

This will install:
- `vitest` - test runner
- `playwright` - headless browser (with bundled Chromium)
- `@remotion/bundler` - for bundling the entry point
- `@remotion/renderer` - for rendering still frames

### 2. Verify Playwright is installed

```bash
npx playwright install
```

This ensures Chromium is available in `~/.cache/ms-playwright/`.

## Running Tests

### First run (create baselines)

```bash
npm test
```

This will:
1. Bundle `src/index.ts`
2. Render frame 30 from each of the 14 compositions
3. Save renders as baseline PNGs in `src/__tests__/baselines/`
4. Print a summary of baseline creation

Expected output:
```
=== Visual Regression Test Suite ===

[Setup] Initializing browser...
[Setup] Bundling entry point...
[Setup] Creating baseline directory...
[Render] Rendering ChoroplethMap frame 30 -> ...
[Baseline] Creating baseline for ChoroplethMap...
[Result] ChoroplethMap: BASELINE CREATED (1245632 bytes)
...
[Cleanup] Test suite complete.
```

### Subsequent runs (regression detection)

```bash
npm test
```

This will:
1. Re-bundle and re-render each composition
2. Compare file sizes against baselines (5% tolerance)
3. Report PASS for matches, FAIL for regressions

Expected output:
```
[Result] ChoroplethMap: PASS (baseline: 1245632 bytes, current: 1245632 bytes, diff: 0 bytes)
[Result] RouteAnimation: VISUAL DIFFERENCE DETECTED (baseline: 2048576 bytes, current: 2100000 bytes, diff: 51424 bytes)
```

### Watch mode (development)

```bash
npm run test:watch
```

Automatically re-runs tests when files change (useful during template development).

### UI mode (visual inspection)

```bash
npm run test:ui
```

Opens a Vitest UI dashboard at `http://localhost:51204/__vitest__/` to view test results, logs, and timing.

### Regenerate baselines

If you intentionally change a composition's visual appearance:

```bash
npm run test:baseline
```

This deletes the current baselines and creates new ones from the updated templates. Review the renders carefully before committing!

## How Regression Detection Works

### File Size Comparison

The test suite uses **file size comparison with 5% tolerance** to detect visual changes:

1. Render current frame 30 as PNG
2. Read file size of current render
3. Read file size of baseline PNG
4. Calculate difference: `|baseline - current| / baseline`
5. **Pass** if difference ≤ 5%
6. **Fail** if difference > 5%

This approach is:
- **Fast** - no pixel-by-pixel operations needed
- **Reliable** - catches major visual changes (layouts, colors, animations)
- **Tolerant** - allows for minor compression artifacts and rendering variations
- **Simple** - no external image processing libraries needed

### Why File Size?

PNG file size is tightly correlated with visual content:
- **Same visuals** → similar file sizes (minor variation from compression)
- **Different colors** → noticeably different file sizes
- **Different layouts** → significantly different file sizes
- **Animation changes** → different rendered frames → different sizes

The 5% tolerance accounts for:
- DEFLATE compression variation in PNG encoder
- Font rasterization differences across OS/browser versions
- Antialiasing edge effects

### When to Update Baselines

Update baselines when you intentionally change a composition:

1. Modify the template code
2. Run tests - they fail
3. Visually inspect the new renders in `.temp-renders/`
4. If the changes look good, run: `npm run test:baseline`
5. Commit the new baselines to git

## Troubleshooting

### "Chromium binary not found"

**Problem:** Tests fail with "Chromium binary not found in ~/.cache/ms-playwright"

**Solution:**
```bash
npm install
npx playwright install
npm test
```

### "Bundle not initialized"

**Problem:** Tests fail early with "Bundle not initialized"

**Solution:** This is usually a transient network issue. Try:
```bash
rm -rf node_modules/.vite
npm test
```

### Tests timeout after 60 seconds

**Problem:** A composition takes longer than 60 seconds to render

**Solution:** 
1. Check if your template uses expensive operations (large datasets, complex calculations)
2. Optimize the template code
3. If unavoidable, increase `testTimeout` in `vitest.config.ts` and `templates.test.ts`

### "Failed to bundle entry point"

**Problem:** TypeScript/bundling errors during test initialization

**Solution:**
1. Verify no TypeScript compilation errors: `npx tsc --noEmit`
2. Check that all imports in `src/index.ts` and compositions are correct
3. Ensure all dependencies are installed: `npm install`

## Advanced: Custom Comparison

The current implementation uses file size comparison. To add pixel-level comparison:

1. Install `pixelmatch`:
   ```bash
   npm install --save-dev pixelmatch jimp
   ```

2. Modify `render-helper.ts` `comparePNGs()` function to use pixelmatch:
   ```typescript
   import Jimp from "jimp";
   import pixelmatch from "pixelmatch";

   export async function comparePNGs(baselinePath: string, currentPath: string) {
     const baseline = await Jimp.read(baselinePath);
     const current = await Jimp.read(currentPath);
     const diff = new Jimp({ width: baseline.bitmap.width, height: baseline.bitmap.height, color: 0xffffffff });
     
     const mismatch = pixelmatch(
       baseline.bitmap.data,
       current.bitmap.data,
       diff.bitmap.data,
       baseline.bitmap.width,
       baseline.bitmap.height,
       { threshold: 0.1 }
     );
     
     return { match: mismatch === 0, mismatch };
   }
   ```

3. Update `templates.test.ts` to handle the new return type.

## Configuration Files

### `vitest.config.ts`
Vitest test runner configuration:
- `environment: "node"` - Run tests in Node (not browser)
- `testTimeout: 60000` - 60 second timeout per test
- `threads: false` - Run sequentially to avoid browser contention
- Path aliases to match `tsconfig.json`

### `tsconfig.json`
Already configured with path aliases that vitest inherits.

### `package.json` scripts
```json
{
  "test": "vitest run",           // Run once and exit
  "test:watch": "vitest",         // Watch mode
  "test:ui": "vitest --ui",       // Dashboard UI
  "test:baseline": "rm -rf src/__tests__/baselines && vitest run"  // Regenerate
}
```

## Integration with CI/CD

To run tests in GitHub Actions or similar:

```yaml
name: Visual Regression Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npx playwright install
      
      - run: npm test
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-renders
          path: src/__tests__/.temp-renders/
```

This ensures:
1. Baselines are committed to git
2. Each PR renders and compares against baselines
3. Failed renders are uploaded as artifacts for manual review

## Notes

- Tests run sequentially (no parallelization) because they share a single browser instance
- Each test takes 15-45 seconds depending on composition complexity
- Full suite takes ~7-10 minutes on modern hardware
- Baselines should be committed to git alongside code changes
- Frame 30 is arbitrary - you can change it in `templates.test.ts` (line: `const TEST_FRAME = 30`)

## FAQ

**Q: Why frame 30 specifically?**
A: It's arbitrary. Frame 30 allows animations to show meaningful progress without being too late in the sequence. Choose any frame that represents a "typical" state of the composition.

**Q: Can I test multiple frames per composition?**
A: Yes! Modify `templates.test.ts` to loop over multiple frames:
```typescript
const TEST_FRAMES = [0, 15, 30, 60];
TEST_FRAMES.forEach(frame => {
  COMPOSITIONS.forEach(compositionId => {
    it(`${compositionId} frame ${frame}`, async () => { ... });
  });
});
```

**Q: What if I have dynamic/random content?**
A: Set `randomSeed` in composition props to ensure deterministic renders. Add to default props in each composition's `index.tsx`:
```typescript
defaultProps={{ data: sampleData, randomSeed: 12345 }}
```

**Q: How do I debug a failing test?**
A: 
1. Check the temp render: `open src/__tests__/.temp-renders/CompositionName-frame-30.png`
2. Compare against baseline: `open src/__tests__/baselines/CompositionName-frame-30.png`
3. Check console logs for render errors
4. Use `npm run test:watch` and add `console.log()` to templates
