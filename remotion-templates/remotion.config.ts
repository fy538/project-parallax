import { Config } from "@remotion/cli/config";

// PNG intermediate frames (lossless) instead of JPEG (~85% quality default).
// Parallax is text- and graphics-heavy: hairline dividers, small-cap metadata,
// the bone-on-ink type. JPEG quantization artifacts show up on those edges
// before the H.264 encoder gets to them, so we eliminate them at the source.
// Trade-off: ~20-30% slower local renders. Worth it.
Config.setVideoImageFormat("png");

// Be explicit about the YouTube-target pixel format. Default is yuv420p
// (4:2:0 chroma subsampling) which is the H.264 spec for broad playback
// compatibility. We don't go higher (yuv422p / yuv444p) because YouTube
// re-transcodes to 420p anyway and 422 in the master only helps if we
// also distribute that master, which we don't.
Config.setPixelFormat("yuv420p");

Config.setOverwriteOutput(true);
