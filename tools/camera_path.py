#!/usr/bin/env python3
"""
camera_path.py — Generate CinematicMap keyframe JSON from human-readable waypoints.

Takes named place waypoints (geocoded via Nominatim), a target altitude + pitch,
a total duration, and a path preset, then outputs a `keyframes` array ready to
paste into a CinematicMap data JSON file.

Usage:
    python tools/camera_path.py \
      --waypoints "Kabul,Afghanistan" "Peshawar,Pakistan" "Lahore,Pakistan" \
      --altitude 40000 \
      --pitch 62 \
      --duration 12 \
      --style mountain-approach \
      [--output-file path/to/data.json]

Presets (--style):
    mountain-approach  Start high/pulled-back, push in and pitch up as you approach
    coastal-sweep      Low altitude, parallel to coastline, steady bearing
    valley-follow      Medium altitude, path follows terrain between two waypoints
    orbital            Orbit a fixed point at constant altitude (uses lookAt)
    reveal             Start overhead → pitch from 0° to 50° → push in (cold-open opener)

Output:
    JSON array to stdout. Each element: { sec, center, altitudeM, pitch, bearing, easing }
    When --output-file is given, writes the full data file template to that path.

Geocoding:
    Uses Nominatim (OpenStreetMap) — no API key required.
    Falls back to manual coordinates when geocoding fails.
    Rate-limited to 1 request/sec per Nominatim ToS.

Dependencies:
    pip install requests   (standard; already in most Python environments)
"""

import argparse
import json
import math
import sys
import time
from typing import Optional

try:
    import requests
except ImportError:
    requests = None  # type: ignore[assignment]


# ── Geocoding ──────────────────────────────────────────────────────────────────

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_HEADERS = {
    "User-Agent": "parallax-camera-path/1.0 (project-parallax; geopolitics channel)"
}


def geocode(place: str) -> Optional[tuple[float, float]]:
    """Return (longitude, latitude) for a place string via Nominatim. None on failure."""
    if requests is None:
        print(
            f"[camera_path] WARNING: `requests` not installed — cannot geocode '{place}'. "
            "Install with: pip install requests",
            file=sys.stderr,
        )
        return None

    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": place, "format": "json", "limit": 1},
            headers=NOMINATIM_HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        results = resp.json()
        if not results:
            print(
                f"[camera_path] WARNING: Nominatim found no results for '{place}'",
                file=sys.stderr,
            )
            return None
        r = results[0]
        lng, lat = float(r["lon"]), float(r["lat"])
        print(
            f"[camera_path] Geocoded '{place}' → ({lng:.4f}, {lat:.4f})",
            file=sys.stderr,
        )
        # Nominatim ToS: max 1 request/sec
        time.sleep(1.0)
        return (lng, lat)
    except Exception as exc:
        print(
            f"[camera_path] WARNING: Geocoding failed for '{place}': {exc}",
            file=sys.stderr,
        )
        return None


def parse_coord_string(s: str) -> Optional[tuple[float, float]]:
    """Try parsing 'lng,lat' or 'lat,lng' manual coordinate format."""
    parts = [p.strip() for p in s.split(",")]
    if len(parts) == 2:
        try:
            a, b = float(parts[0]), float(parts[1])
            # Heuristic: if first value is in [-90, 90] and second is [-180, 180],
            # treat as lat,lng (the common "Google Maps" order). Otherwise lng,lat.
            if -90 <= a <= 90 and -180 <= b <= 180:
                return (b, a)  # swap to lng,lat
            return (a, b)
        except ValueError:
            pass
    return None


def resolve_waypoints(
    waypoints: list[str],
) -> list[tuple[float, float]]:
    """Resolve a list of waypoint strings to (lng, lat) tuples."""
    resolved = []
    for wp in waypoints:
        # Try manual coordinate format first
        coord = parse_coord_string(wp)
        if coord is not None:
            print(
                f"[camera_path] Parsed manual coord: {wp} → {coord}",
                file=sys.stderr,
            )
            resolved.append(coord)
            continue
        # Try Nominatim geocoding
        coord = geocode(wp)
        if coord is None:
            print(
                f"[camera_path] ERROR: Could not resolve waypoint '{wp}'. "
                "Use 'lng,lat' format for manual coordinates.",
                file=sys.stderr,
            )
            sys.exit(2)
        resolved.append(coord)
    return resolved


# ── Haversine distance ─────────────────────────────────────────────────────────

def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Great-circle distance in km between two (lng, lat) points."""
    R = 6371.0
    lng1, lat1 = math.radians(a[0]), math.radians(a[1])
    lng2, lat2 = math.radians(b[0]), math.radians(b[1])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def bearing_deg(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Initial bearing from point a to point b in degrees (0=N, 90=E)."""
    lng1, lat1 = math.radians(a[0]), math.radians(a[1])
    lng2, lat2 = math.radians(b[0]), math.radians(b[1])
    dlng = lng2 - lng1
    x = math.sin(dlng) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlng)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


# ── Path presets ───────────────────────────────────────────────────────────────

def build_mountain_approach(
    coords: list[tuple[float, float]],
    altitude_m: float,
    pitch: float,
    duration_sec: float,
) -> list[dict]:
    """
    mountain-approach: Start high/pulled-back, push in and pitch up as you approach.
    Works with 2+ waypoints. Each segment: altitude halves, pitch increases by ~15°.
    """
    if len(coords) < 2:
        print("[camera_path] mountain-approach needs ≥ 2 waypoints", file=sys.stderr)
        sys.exit(1)

    total_dist = sum(haversine_km(coords[i], coords[i + 1]) for i in range(len(coords) - 1))
    keyframes = []
    elapsed = 0.0

    for i, coord in enumerate(coords):
        frac = i / (len(coords) - 1)  # 0.0 → 1.0
        # Altitude: starts at 4× target, descends to target altitude
        alt = altitude_m * (4.0 - 3.0 * frac)
        # Pitch: starts at 20°, ramps to target pitch
        current_pitch = 20 + (pitch - 20) * frac

        if i == 0:
            t = 0.0
        elif i == len(coords) - 1:
            t = duration_sec
        else:
            dist_to_here = sum(
                haversine_km(coords[j], coords[j + 1]) for j in range(i)
            )
            t = (dist_to_here / total_dist) * duration_sec if total_dist > 0 else elapsed

        bear = bearing_deg(coord, coords[min(i + 1, len(coords) - 1)]) if i < len(coords) - 1 else bearing_deg(coords[-2], coords[-1])

        keyframes.append({
            "sec": round(t, 1),
            "center": [round(coord[0], 4), round(coord[1], 4)],
            "altitudeM": round(alt),
            "pitch": round(current_pitch, 1),
            "bearing": round(bear, 1),
            "easing": "ease-in-out",
        })
        elapsed = t

    return keyframes


def build_coastal_sweep(
    coords: list[tuple[float, float]],
    altitude_m: float,
    pitch: float,
    duration_sec: float,
) -> list[dict]:
    """
    coastal-sweep: Low altitude, parallel to coastline. Camera sweeps steadily.
    Bearing stays approximately perpendicular to the path direction.
    """
    if len(coords) < 2:
        print("[camera_path] coastal-sweep needs ≥ 2 waypoints", file=sys.stderr)
        sys.exit(1)

    total_dist = sum(haversine_km(coords[i], coords[i + 1]) for i in range(len(coords) - 1))
    keyframes = []

    for i, coord in enumerate(coords):
        if i == 0:
            t = 0.0
        elif i == len(coords) - 1:
            t = duration_sec
        else:
            dist_to_here = sum(haversine_km(coords[j], coords[j + 1]) for j in range(i))
            t = (dist_to_here / total_dist) * duration_sec if total_dist > 0 else 0

        # Bearing follows the path direction
        if i < len(coords) - 1:
            bear = bearing_deg(coord, coords[i + 1])
        else:
            bear = bearing_deg(coords[-2], coords[-1])

        keyframes.append({
            "sec": round(t, 1),
            "center": [round(coord[0], 4), round(coord[1], 4)],
            "altitudeM": round(altitude_m),
            "pitch": round(pitch, 1),
            "bearing": round(bear, 1),
            "easing": "ease-in-out",
        })

    return keyframes


def build_valley_follow(
    coords: list[tuple[float, float]],
    altitude_m: float,
    pitch: float,
    duration_sec: float,
) -> list[dict]:
    """
    valley-follow: Medium altitude, path follows terrain between waypoints.
    Similar to coastal-sweep but bearing tracks valley axis (perpendicular to
    the dominant flow direction for a river/valley read).
    """
    # For simplicity, valley-follow is the same as coastal-sweep with a
    # slightly higher pitch (terrain fills more of the frame).
    adjusted_pitch = min(pitch + 10, 80)
    return build_coastal_sweep(coords, altitude_m, adjusted_pitch, duration_sec)


def build_orbital(
    coords: list[tuple[float, float]],
    altitude_m: float,
    pitch: float,
    duration_sec: float,
) -> list[dict]:
    """
    orbital: Orbit a fixed center point. Uses the first coord as the center
    and second as initial bearing reference. Camera sweeps 360° (or partial).
    Uses lookAt to keep the center in frame.
    """
    center = coords[0]
    # Generate 4 bearing positions around the orbit (0°, 90°, 180°, 270°)
    orbit_steps = 4
    keyframes = []
    for i in range(orbit_steps + 1):
        t = (i / orbit_steps) * duration_sec
        bear = (i / orbit_steps) * 360
        keyframes.append({
            "sec": round(t, 1),
            "center": [round(center[0], 4), round(center[1], 4)],
            "altitudeM": round(altitude_m),
            "pitch": round(pitch, 1),
            "bearing": round(bear, 1),
            "easing": "ease-in-out",
        })
    return keyframes


def build_reveal(
    coords: list[tuple[float, float]],
    altitude_m: float,
    pitch: float,
    duration_sec: float,
) -> list[dict]:
    """
    reveal: Start overhead (pitch 0) → pitch up to target → push in.
    Classic "reveal" cold-open opener. Uses first coord as focal point.
    """
    if len(coords) < 1:
        print("[camera_path] reveal needs ≥ 1 waypoint", file=sys.stderr)
        sys.exit(1)

    focal = coords[0]
    # Start: 4× altitude, looking straight down
    # Mid: 2× altitude, pitching up
    # End: target altitude, full pitch
    keyframes = [
        {
            "sec": 0.0,
            "center": [round(focal[0], 4), round(focal[1], 4)],
            "altitudeM": round(altitude_m * 4),
            "pitch": 0,
            "bearing": 0,
            "easing": "ease-in",
        },
        {
            "sec": round(duration_sec * 0.5, 1),
            "center": [round(focal[0], 4), round(focal[1], 4)],
            "altitudeM": round(altitude_m * 1.8),
            "pitch": round(pitch * 0.65, 1),
            "bearing": 5,
            "easing": "ease-in-out",
        },
        {
            "sec": round(duration_sec, 1),
            "center": [round(focal[0], 4), round(focal[1], 4)],
            "altitudeM": round(altitude_m),
            "pitch": round(pitch, 1),
            "bearing": 10,
            "easing": "ease-out",
        },
    ]
    return keyframes


PRESET_BUILDERS = {
    "mountain-approach": build_mountain_approach,
    "coastal-sweep": build_coastal_sweep,
    "valley-follow": build_valley_follow,
    "orbital": build_orbital,
    "reveal": build_reveal,
}


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--waypoints",
        nargs="+",
        required=True,
        metavar="PLACE",
        help="One or more place names (geocoded) or 'lng,lat' coordinate strings",
    )
    parser.add_argument(
        "--altitude",
        type=float,
        default=40_000,
        metavar="METERS",
        help="Target camera altitude in meters (default: 40000). "
             "Reference: 8000m=mountain, 40000m=Khyber Pass, 80000m=strait width, "
             "500000m=sub-continental, 9000000m=full globe",
    )
    parser.add_argument(
        "--pitch",
        type=float,
        default=55,
        metavar="DEGREES",
        help="Target camera pitch 0-85° (default: 55). "
             "0=straight down, 60-70=valley-follow, 35-50=chokepoint reveal",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=12,
        metavar="SECONDS",
        help="Total duration in seconds (default: 12)",
    )
    parser.add_argument(
        "--style",
        choices=list(PRESET_BUILDERS.keys()),
        default="mountain-approach",
        help="Camera path preset (default: mountain-approach)",
    )
    parser.add_argument(
        "--output-file",
        metavar="PATH",
        help="When set, writes a full CinematicMap data JSON template to this file "
             "(adds episode, register, fogPreset, etc.). Otherwise prints keyframes only.",
    )
    parser.add_argument(
        "--episode",
        default="catalog",
        metavar="SLUG",
        help="Episode slug for the data file (default: catalog)",
    )
    parser.add_argument(
        "--register",
        choices=["dark", "light", "vintage", "toner"],
        default="dark",
        help="Map visual register (default: dark)",
    )
    parser.add_argument(
        "--fog",
        choices=["atmospheric", "editorial", "vintage", "none"],
        default="atmospheric",
        dest="fog_preset",
        help="Fog preset (default: atmospheric)",
    )
    parser.add_argument(
        "--light",
        choices=["day", "dawn", "dusk", "night"],
        default="dusk",
        dest="light_preset",
        help="Light preset (default: dusk)",
    )
    parser.add_argument(
        "--terrain-exaggeration",
        type=float,
        default=1.5,
        metavar="FACTOR",
        dest="terrain_exaggeration",
        help="Terrain exaggeration factor 0-3 (default: 1.5)",
    )

    args = parser.parse_args()

    # Resolve waypoints
    coords = resolve_waypoints(args.waypoints)

    # Build keyframes using the selected preset
    builder = PRESET_BUILDERS[args.style]
    keyframes = builder(coords, args.altitude, args.pitch, args.duration)

    if args.output_file:
        # Full data file template
        data = {
            "episode": args.episode,
            "source": "Mapbox · USGS · Natural Earth",
            "keyframes": keyframes,
            "register": args.register,
            "fogPreset": args.fog_preset,
            "lightPreset": args.light_preset,
            "terrain": True,
            "terrainExaggeration": args.terrain_exaggeration,
        }
        with open(args.output_file, "w") as f:
            json.dump(data, f, indent=2)
        print(f"[camera_path] Wrote CinematicMap data to: {args.output_file}", file=sys.stderr)
        print(
            f"[camera_path] {len(keyframes)} keyframes, {args.duration}s, "
            f"style={args.style}, altitude={args.altitude:.0f}m",
            file=sys.stderr,
        )
    else:
        # Just keyframes to stdout — paste into existing data file
        print(json.dumps(keyframes, indent=2))
        print(
            f"\n[camera_path] {len(keyframes)} keyframes, {args.duration}s, "
            f"style={args.style}, altitude={args.altitude:.0f}m",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
