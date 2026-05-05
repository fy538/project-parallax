#!/usr/bin/env python3
"""
Parallax Asset Sourcing Tool

Searches free stock libraries (Pexels, Pixabay, Unsplash) for images and videos
matching search terms from the script's asset summary table.

Usage:
  # Search for a single term
  python source.py "TSMC cleanroom wafer handling" --type photo

  # Search with fallback terms (tries most specific first)
  python source.py "TSMC Arizona aerial" "semiconductor factory aerial" "chip factory" --type photo

  # Search for video footage
  python source.py "city skyline night technology" --type video

  # Batch mode from a JSON shot list
  python source.py --batch shot-list.json --output assets/ep01/

  # Just preview results (don't download)
  python source.py "Pearl Harbor 1941" --type photo --preview

Environment variables (set at least one):
  PEXELS_API_KEY    — Get free at https://www.pexels.com/api/
  PIXABAY_API_KEY   — Get free at https://pixabay.com/api/docs/
  UNSPLASH_ACCESS_KEY — Get free at https://unsplash.com/developers

Requires: pip install requests --break-system-packages
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus

import requests

# ── API Configuration ─────────────────────────────────────────────────────────

PEXELS_KEY = os.environ.get("PEXELS_API_KEY", "")
PIXABAY_KEY = os.environ.get("PIXABAY_API_KEY", "")
UNSPLASH_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "")

RESULTS_PER_SOURCE = 5  # Top N results from each source


# ── API Clients ───────────────────────────────────────────────────────────────

def search_pexels(query: str, media_type: str = "photo", count: int = RESULTS_PER_SOURCE) -> list:
    """Search Pexels for photos or videos."""
    if not PEXELS_KEY:
        return []

    headers = {"Authorization": PEXELS_KEY}

    if media_type == "video":
        url = f"https://api.pexels.com/videos/search?query={quote_plus(query)}&per_page={count}&orientation=landscape"
    else:
        url = f"https://api.pexels.com/v1/search?query={quote_plus(query)}&per_page={count}&orientation=landscape"

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        results = []
        items = data.get("videos" if media_type == "video" else "photos", [])
        for item in items:
            if media_type == "video":
                # Get the HD video file
                video_files = item.get("video_files", [])
                hd = next((f for f in video_files if f.get("quality") == "hd"), video_files[0] if video_files else None)
                results.append({
                    "source": "pexels",
                    "type": "video",
                    "id": item["id"],
                    "url": item.get("url", ""),
                    "preview": item.get("image", ""),
                    "download": hd["link"] if hd else "",
                    "width": hd.get("width", 0) if hd else 0,
                    "height": hd.get("height", 0) if hd else 0,
                    "duration": item.get("duration", 0),
                    "photographer": item.get("user", {}).get("name", "Unknown"),
                    "license": "Pexels License (free, no attribution required)",
                })
            else:
                results.append({
                    "source": "pexels",
                    "type": "photo",
                    "id": item["id"],
                    "url": item.get("url", ""),
                    "preview": item.get("src", {}).get("medium", ""),
                    "download": item.get("src", {}).get("original", ""),
                    "width": item.get("width", 0),
                    "height": item.get("height", 0),
                    "photographer": item.get("photographer", "Unknown"),
                    "license": "Pexels License (free, no attribution required)",
                })
        return results
    except Exception as e:
        print(f"  ⚠ Pexels error: {e}", file=sys.stderr)
        return []


def search_pixabay(query: str, media_type: str = "photo", count: int = RESULTS_PER_SOURCE) -> list:
    """Search Pixabay for photos or videos."""
    if not PIXABAY_KEY:
        return []

    # Pixabay requires the key as a query param (no header auth option)
    base_url = "https://pixabay.com/api/videos/" if media_type == "video" else "https://pixabay.com/api/"
    params: dict = {"key": PIXABAY_KEY, "q": query, "per_page": count, "orientation": "horizontal"}
    if media_type != "video":
        params["image_type"] = "photo"

    try:
        resp = requests.get(base_url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("hits", []):
            if media_type == "video":
                videos = item.get("videos", {})
                large = videos.get("large", videos.get("medium", {}))
                results.append({
                    "source": "pixabay",
                    "type": "video",
                    "id": item["id"],
                    "url": item.get("pageURL", ""),
                    "preview": f"https://i.vimeocdn.com/video/{item.get('picture_id', '')}_640x360.jpg",
                    "download": large.get("url", ""),
                    "width": large.get("width", 0),
                    "height": large.get("height", 0),
                    "duration": item.get("duration", 0),
                    "photographer": item.get("user", "Unknown"),
                    "license": "Pixabay License (free, no attribution required)",
                })
            else:
                results.append({
                    "source": "pixabay",
                    "type": "photo",
                    "id": item["id"],
                    "url": item.get("pageURL", ""),
                    "preview": item.get("webformatURL", ""),
                    "download": item.get("largeImageURL", ""),
                    "width": item.get("imageWidth", 0),
                    "height": item.get("imageHeight", 0),
                    "photographer": item.get("user", "Unknown"),
                    "license": "Pixabay License (free, no attribution required)",
                })
        return results
    except Exception as e:
        print(f"  ⚠ Pixabay error: {e}", file=sys.stderr)
        return []


def search_unsplash(query: str, count: int = RESULTS_PER_SOURCE) -> list:
    """Search Unsplash for photos (no video support)."""
    if not UNSPLASH_KEY:
        return []

    url = f"https://api.unsplash.com/search/photos?query={quote_plus(query)}&per_page={count}&orientation=landscape"
    headers = {"Authorization": f"Client-ID {UNSPLASH_KEY}"}

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("results", []):
            results.append({
                "source": "unsplash",
                "type": "photo",
                "id": item["id"],
                "url": item.get("links", {}).get("html", ""),
                "preview": item.get("urls", {}).get("small", ""),
                "download": item.get("urls", {}).get("full", ""),
                "width": item.get("width", 0),
                "height": item.get("height", 0),
                "photographer": item.get("user", {}).get("name", "Unknown"),
                "license": "Unsplash License (free, attribution appreciated)",
            })
        return results
    except Exception as e:
        print(f"  ⚠ Unsplash error: {e}", file=sys.stderr)
        return []


# ── Search orchestrator ───────────────────────────────────────────────────────

def search_all(query: str, media_type: str = "photo") -> list:
    """Search all configured sources for a query."""
    results = []
    results.extend(search_pexels(query, media_type))
    results.extend(search_pixabay(query, media_type))
    if media_type == "photo":
        results.extend(search_unsplash(query))
    return results


def search_with_fallbacks(terms: list[str], media_type: str = "photo") -> dict:
    """Try search terms in order of specificity. Return best results."""
    all_results = []
    for term in terms:
        print(f"  Searching: \"{term}\"...")
        results = search_all(term, media_type)
        if results:
            all_results.extend(results)
            print(f"    Found {len(results)} results")
        else:
            print(f"    No results")

    # Deduplicate by (source, id)
    seen = set()
    unique = []
    for r in all_results:
        key = (r["source"], r["id"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    return {
        "search_terms": terms,
        "media_type": media_type,
        "total_results": len(unique),
        "results": unique,
    }


# ── Download ──────────────────────────────────────────────────────────────────

def download_asset(result: dict, output_dir: Path, prefix: str = "") -> Optional[Path]:
    """Download a single asset to the output directory."""
    url = result.get("download", "")
    if not url:
        print(f"  ⚠ No download URL for {result['source']}:{result['id']}", file=sys.stderr)
        return None

    ext = "mp4" if result["type"] == "video" else "jpg"
    filename = f"{prefix}{result['source']}_{result['id']}.{ext}"
    output_path = output_dir / filename

    if output_path.exists():
        print(f"  ⏩ Already exists: {filename}")
        return output_path

    try:
        print(f"  ⬇ Downloading {filename}...")
        resp = requests.get(url, timeout=30, stream=True)
        resp.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"    ✓ Saved ({output_path.stat().st_size // 1024}KB)")
        return output_path
    except Exception as e:
        print(f"  ⚠ Download failed: {e}", file=sys.stderr)
        return None


# ── Batch mode ────────────────────────────────────────────────────────────────

def process_batch(batch_file: Path, output_dir: Path, preview_only: bool = False):
    """
    Process a JSON shot list file. Expected format:

    {
      "episode": "EP01",
      "assets": [
        {
          "id": "beat1-tsmc-aerial",
          "priority": "P1",
          "type": "photo",
          "search_terms": ["TSMC Arizona aerial", "semiconductor factory aerial"],
          "treatment": "standard",
          "notes": "Opening shot — needs to be impressive"
        },
        ...
      ]
    }
    """
    try:
        with open(batch_file) as f:
            batch = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: batch file is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print(f"Error: batch file not found: {batch_file}", file=sys.stderr)
        sys.exit(1)

    episode = batch.get("episode", "unknown")
    assets = batch.get("assets", [])
    print(f"\n{'='*60}")
    print(f"Asset sourcing: {episode} ({len(assets)} assets)")
    print(f"{'='*60}\n")

    ep_dir = output_dir / episode.lower().replace(" ", "-")
    ep_dir.mkdir(parents=True, exist_ok=True)

    manifest = []

    for i, asset in enumerate(assets):
        asset_id = asset.get("id", f"asset-{i}")
        priority = asset.get("priority", "P3")
        media_type = asset.get("type", "photo")
        terms = asset.get("search_terms", [])
        treatment = asset.get("treatment", "standard")
        notes = asset.get("notes", "")

        print(f"\n[{i+1}/{len(assets)}] {priority} — {asset_id}")
        if notes:
            print(f"  Notes: {notes}")

        search_result = search_with_fallbacks(terms, media_type)

        entry = {
            "id": asset_id,
            "priority": priority,
            "treatment": treatment,
            "search": search_result,
            "downloaded": [],
        }

        if not preview_only and search_result["results"]:
            # Download top result from each source (max 2)
            sources_downloaded = set()
            for result in search_result["results"]:
                if result["source"] in sources_downloaded:
                    continue
                path = download_asset(result, ep_dir, prefix=f"{asset_id}_")
                if path:
                    entry["downloaded"].append({
                        "path": str(path),
                        "source": result["source"],
                        "photographer": result["photographer"],
                        "license": result["license"],
                        "url": result["url"],
                    })
                    sources_downloaded.add(result["source"])
                else:
                    entry["downloaded"].append({
                        "status": "failed",
                        "source": result["source"],
                        "url": result.get("url", ""),
                    })
                if len(sources_downloaded) >= 2:
                    break

        manifest.append(entry)

    # Save manifest
    manifest_path = ep_dir / "asset-manifest.json"
    with open(manifest_path, "w") as f:
        json.dump({
            "episode": episode,
            "generated": "auto",
            "assets": manifest,
        }, f, indent=2)

    print(f"\n{'='*60}")
    print(f"Manifest saved: {manifest_path}")
    found = sum(1 for m in manifest if m["search"]["total_results"] > 0)
    downloaded = sum(len(m["downloaded"]) for m in manifest)
    print(f"Found results for {found}/{len(assets)} assets")
    if not preview_only:
        print(f"Downloaded {downloaded} files")
    print(f"{'='*60}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Parallax asset sourcing tool")
    parser.add_argument("terms", nargs="*", help="Search terms (most specific first)")
    parser.add_argument("--type", choices=["photo", "video"], default="photo",
                        help="Media type (default: photo)")
    parser.add_argument("--batch", type=str, help="JSON shot list file for batch processing")
    parser.add_argument("--output", "-o", type=str, default="./assets",
                        help="Output directory (default: ./assets)")
    parser.add_argument("--preview", action="store_true",
                        help="Preview results without downloading")
    parser.add_argument("--download-top", type=int, default=0,
                        help="Download top N results (0 = preview only)")

    args = parser.parse_args()

    # Check for at least one API key
    configured = []
    if PEXELS_KEY:
        configured.append("Pexels")
    if PIXABAY_KEY:
        configured.append("Pixabay")
    if UNSPLASH_KEY:
        configured.append("Unsplash")

    if not configured:
        print("⚠ No API keys configured. Set at least one:", file=sys.stderr)
        print("  export PEXELS_API_KEY=your_key      # https://www.pexels.com/api/", file=sys.stderr)
        print("  export PIXABAY_API_KEY=your_key      # https://pixabay.com/api/docs/", file=sys.stderr)
        print("  export UNSPLASH_ACCESS_KEY=your_key  # https://unsplash.com/developers", file=sys.stderr)
        sys.exit(1)

    print(f"Configured sources: {', '.join(configured)}")

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.batch:
        process_batch(Path(args.batch), output_dir, preview_only=args.preview)
    elif args.terms:
        result = search_with_fallbacks(args.terms, args.type)
        print(f"\n{'='*60}")
        print(f"Total: {result['total_results']} results")
        print(f"{'='*60}")

        for r in result["results"]:
            size_info = f"{r['width']}×{r['height']}"
            if r["type"] == "video":
                size_info += f" ({r.get('duration', '?')}s)"
            print(f"  [{r['source']}] {size_info} — {r['photographer']}")
            print(f"    Preview: {r['preview']}")
            print(f"    Page: {r['url']}")
            print()

        if args.download_top > 0:
            for r in result["results"][:args.download_top]:
                download_asset(r, output_dir)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
