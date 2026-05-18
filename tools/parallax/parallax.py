#!/usr/bin/env python3
"""
parallax.py — AI depth-based parallax video from a single still image.

Uses Depth Anything V2 (via HuggingFace transformers) to estimate depth,
then renders a Ken Burns parallax video with configurable camera motion.

Setup (one-time):
    pip install torch torchvision transformers pillow numpy

Usage:
    python parallax.py input.png output.mp4 --motion zoom_in --duration 6 --intensity 0.3
    python parallax.py input.png output.mp4 --motion pan_left --duration 4
    python parallax.py input.png output.mp4 --motion dolly_in --duration 7 --intensity 0.5

Motions: zoom_in, zoom_out, pan_left, pan_right, tilt_up, tilt_down, dolly_in, dolly_out
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from video_config import get_video_config  # noqa: E402

_EPISODE = get_video_config("episode")

# Lazy imports for torch/transformers (heavy)
_pipe = None

def get_depth_pipe():
    """Load Depth Anything V2 pipeline (cached after first call)."""
    global _pipe
    if _pipe is None:
        print("Loading Depth Anything V2 model (first run downloads ~350MB)...")
        import torch
        from transformers import pipeline
        device = "mps" if torch.backends.mps.is_available() else "cpu"
        _pipe = pipeline(
            "depth-estimation",
            model="depth-anything/Depth-Anything-V2-Small-hf",
            device=device,
        )
        print(f"Model loaded on {device}")
    return _pipe


def estimate_depth(image: Image.Image) -> np.ndarray:
    """Return normalized depth map (0-1 float, 0=near 1=far)."""
    pipe = get_depth_pipe()
    result = pipe(image)
    depth = np.array(result["depth"]).astype(np.float32)
    # Normalize to 0-1
    depth = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)
    return depth


def render_frame(
    image: np.ndarray,
    depth: np.ndarray,
    t: float,
    motion: str,
    intensity: float,
    width: int,
    height: int,
) -> np.ndarray:
    """
    Render a single parallax frame by displacing pixels based on depth.

    t: progress 0.0 to 1.0
    motion: camera motion type
    intensity: how strong the parallax effect is (0.1 = subtle, 1.0 = aggressive)
    """
    h, w = image.shape[:2]

    # Create meshgrid for pixel coordinates
    y_coords, x_coords = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
    x_coords = x_coords.astype(np.float32)
    y_coords = y_coords.astype(np.float32)

    # Displacement based on depth and motion type
    # Deeper pixels move less, closer pixels move more
    # depth: 0 = near (moves a lot), 1 = far (moves less)
    displacement_strength = (1.0 - depth) * intensity * min(w, h) * 0.05

    # Ease in-out for smooth motion
    t_eased = 0.5 - 0.5 * np.cos(t * np.pi)

    # Center the motion around 0 (goes from -0.5 to +0.5)
    t_centered = t_eased - 0.5

    if motion == "zoom_in":
        # Closer pixels spread outward from center
        cx, cy = w / 2, h / 2
        dx = (x_coords - cx) * displacement_strength * t_centered * 0.02
        dy = (y_coords - cy) * displacement_strength * t_centered * 0.02
    elif motion == "zoom_out":
        cx, cy = w / 2, h / 2
        dx = -(x_coords - cx) * displacement_strength * t_centered * 0.02
        dy = -(y_coords - cy) * displacement_strength * t_centered * 0.02
    elif motion == "pan_left":
        dx = displacement_strength * t_centered
        dy = np.zeros_like(dx)
    elif motion == "pan_right":
        dx = -displacement_strength * t_centered
        dy = np.zeros_like(dx)
    elif motion == "tilt_up":
        dx = np.zeros_like(displacement_strength)
        dy = displacement_strength * t_centered
    elif motion == "tilt_down":
        dx = np.zeros_like(displacement_strength)
        dy = -displacement_strength * t_centered
    elif motion == "dolly_in":
        cx, cy = w / 2, h / 2
        dx = (x_coords - cx) * displacement_strength * t_centered * 0.03
        dy = (y_coords - cy) * displacement_strength * t_centered * 0.03
    elif motion == "dolly_out":
        cx, cy = w / 2, h / 2
        dx = -(x_coords - cx) * displacement_strength * t_centered * 0.03
        dy = -(y_coords - cy) * displacement_strength * t_centered * 0.03
    else:
        raise ValueError(f"Unknown motion: {motion}")

    # Apply displacement via remapping
    map_x = np.clip(x_coords + dx, 0, w - 1).astype(np.float32)
    map_y = np.clip(y_coords + dy, 0, h - 1).astype(np.float32)

    # Bilinear interpolation
    x0 = np.floor(map_x).astype(int)
    y0 = np.floor(map_y).astype(int)
    x1 = np.minimum(x0 + 1, w - 1)
    y1 = np.minimum(y0 + 1, h - 1)

    fx = map_x - x0
    fy = map_y - y0

    fx3 = fx[:, :, np.newaxis]
    fy3 = fy[:, :, np.newaxis]

    frame = (
        image[y0, x0] * (1 - fx3) * (1 - fy3)
        + image[y0, x1] * fx3 * (1 - fy3)
        + image[y1, x0] * (1 - fx3) * fy3
        + image[y1, x1] * fx3 * fy3
    )

    return np.clip(frame, 0, 255).astype(np.uint8)


def generate_parallax_video(
    input_path: str,
    output_path: str,
    motion: str = "zoom_in",
    duration: float = 5.0,
    intensity: float = 0.3,
    fps: int = _EPISODE.fps,
    width: int = _EPISODE.width,
    height: int = _EPISODE.height,
):
    """Generate a parallax video from a single still image."""

    # Load image
    print(f"Loading {input_path}...")
    image = Image.open(input_path).convert("RGB")
    image = image.resize((width, height), Image.Resampling.LANCZOS)
    image_np = np.array(image)

    # Estimate depth
    print("Estimating depth map...")
    depth = estimate_depth(image)
    # Resize depth to match image
    depth_img = Image.fromarray((depth * 255).astype(np.uint8))
    depth_img = depth_img.resize((width, height), Image.Resampling.LANCZOS)
    depth = np.array(depth_img).astype(np.float32) / 255.0

    # Save depth map for inspection
    depth_path = Path(output_path).with_suffix(".depth.png")
    depth_img_save = Image.fromarray((depth * 255).astype(np.uint8))
    depth_img_save.save(depth_path)
    print(f"Depth map saved to {depth_path}")

    # Render frames
    total_frames = int(duration * fps)
    print(f"Rendering {total_frames} frames ({duration}s @ {fps}fps)...")

    with tempfile.TemporaryDirectory() as tmpdir:
        for i in range(total_frames):
            t = i / (total_frames - 1)
            frame = render_frame(image_np, depth, t, motion, intensity, width, height)
            frame_img = Image.fromarray(frame)
            frame_img.save(f"{tmpdir}/frame_{i:05d}.png")

            if (i + 1) % 30 == 0 or i == total_frames - 1:
                print(f"  Frame {i+1}/{total_frames}")

        # Encode with ffmpeg
        print(f"Encoding to {output_path}...")
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(fps),
            "-i", f"{tmpdir}/frame_%05d.png",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-crf", "18",
            "-preset", "medium",
            output_path,
        ]
        subprocess.run(cmd, capture_output=True, check=True)

    print(f"Done! Output: {output_path}")


def batch_process(shot_list_path: str, stills_dir: str, output_dir: str, motions: dict):
    """Process multiple stills with different motion settings."""
    import json

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    with open(shot_list_path, encoding="utf-8") as f:
        shots = json.load(f)

    for shot in shots:
        shot_id = shot["id"]
        duration = shot.get("duration_sec", 5)

        # Find the still file
        stills = list(Path(stills_dir).glob(f"{shot_id}-*.png"))
        if not stills:
            print(f"WARNING: No still found for {shot_id}, skipping")
            continue

        still_path = str(stills[0])
        output_path = str(Path(output_dir) / f"{shot_id}.mp4")

        # Get motion settings (from motions dict or defaults)
        settings = motions.get(shot_id, {"motion": "zoom_in", "intensity": 0.3})

        print(f"\n{'='*60}")
        print(f"Processing {shot_id} — {settings['motion']} ({duration}s)")
        print(f"{'='*60}")

        generate_parallax_video(
            input_path=still_path,
            output_path=output_path,
            motion=settings["motion"],
            duration=duration,
            intensity=settings.get("intensity", 0.3),
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI depth-based parallax video from a still image")
    sub = parser.add_subparsers(dest="command")

    # Single image mode
    single = sub.add_parser("single", help="Process a single image")
    single.add_argument("input", help="Input image path (PNG/JPG)")
    single.add_argument("output", help="Output video path (MP4)")
    single.add_argument("--motion", default="zoom_in",
                       choices=["zoom_in", "zoom_out", "pan_left", "pan_right",
                                "tilt_up", "tilt_down", "dolly_in", "dolly_out"],
                       help="Camera motion type")
    single.add_argument("--duration", type=float, default=5.0, help="Duration in seconds")
    single.add_argument("--intensity", type=float, default=0.3, help="Parallax intensity (0.1-1.0)")
    single.add_argument("--fps", type=int, default=_EPISODE.fps, help="Frame rate")
    single.add_argument("--width", type=int, default=_EPISODE.width, help="Output width")
    single.add_argument("--height", type=int, default=_EPISODE.height, help="Output height")

    # Batch mode
    batch = sub.add_parser("batch", help="Process all shots from shot-list.json")
    batch.add_argument("shot_list", help="Path to shot-list.json")
    batch.add_argument("stills_dir", help="Directory containing still images")
    batch.add_argument("output_dir", help="Output directory for videos")
    batch.add_argument("--motions-json", help="JSON file mapping shot IDs to motion settings")

    args = parser.parse_args()

    if args.command == "single":
        generate_parallax_video(
            input_path=args.input,
            output_path=args.output,
            motion=args.motion,
            duration=args.duration,
            intensity=args.intensity,
            fps=args.fps,
            width=args.width,
            height=args.height,
        )
    elif args.command == "batch":
        import json
        motions = {}
        if args.motions_json:
            with open(args.motions_json, encoding="utf-8") as f:
                motions = json.load(f)
        batch_process(args.shot_list, args.stills_dir, args.output_dir, motions)
    else:
        parser.print_help()
