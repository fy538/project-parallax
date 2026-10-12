# Combined sequence QA

PASS — automated media and gallery checks.

- Source PNG hashes match the original batch: 3/3.
- Video: 1920×1080, 30 fps, 780 frames, 26 seconds; H.264/yuv420p; limited-range BT.709 matrix, transfer and primaries.
- Audio: no audio stream; intentionally picture only.
- Full video decode: passed.
- Four decoded beat frames compared against the direct Remotion PNGs: 4/4; mean RGB error threshold < 5/255.
- Gallery: four beat controls, local video playback, enlarged still, Escape close, local links, desktop/mobile overflow and script errors.

Evidence: [checks](checks.json), [desktop](gallery-desktop.png), [mobile](gallery-mobile.png), [visual review](visual-review.md), [render log](render.log).
