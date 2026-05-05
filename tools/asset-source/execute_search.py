#!/usr/bin/env python3
"""
Direct execution of aerial semiconductor search using the Pexels API
"""

import json
import os
from pathlib import Path
from urllib.parse import quote_plus
import urllib.request
import sys

# Load API key from .env
env_file = Path(__file__).parent / ".env"
api_key = None

if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("PEXELS_API_KEY="):
                api_key = line.split("=", 1)[1]
                break

if not api_key:
    print("Error: PEXELS_API_KEY not found in .env", file=sys.stderr)
    sys.exit(1)

print("API key loaded.")

# Search queries
search_queries = [
    "aerial semiconductor factory desert",
    "aerial chip manufacturing plant",
    "drone technology factory",
    "aerial industrial facility",
    "bird's eye view factory"
]

results = []

for query in search_queries:
    print(f"\nSearching: {query}")

    url = f"https://api.pexels.com/v1/search?query={quote_plus(query)}&per_page=5&orientation=landscape"

    req = urllib.request.Request(url)
    req.add_header("Authorization", api_key)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))

            for photo in data.get("photos", []):
                result_entry = {
                    "source": "pexels",
                    "id": photo["id"],
                    "query": query,
                    "photographer": photo.get("photographer", "Unknown"),
                    "width": photo.get("width", 0),
                    "height": photo.get("height", 0),
                    "url": photo.get("url", ""),
                    "preview_url": photo.get("src", {}).get("medium", ""),
                    "download_url": photo.get("src", {}).get("original", ""),
                    "license": "Pexels License (free, no attribution required)"
                }
                results.append(result_entry)
                print(f"  ✓ Found: {photo.get('photographer')} — {photo['width']}×{photo['height']}")

    except Exception as e:
        print(f"  Error: {e}", file=sys.stderr)

# Remove duplicates by photo ID
seen_ids = set()
unique_results = []
for r in results:
    if r["id"] not in seen_ids:
        seen_ids.add(r["id"])
        unique_results.append(r)

print(f"\n{'='*60}")
print(f"Total unique results: {len(unique_results)}")
print(f"{'='*60}\n")

# Save results
output_file = Path(__file__).parent / "search_results.json"
with open(output_file, "w") as f:
    json.dump({
        "search_queries": search_queries,
        "total_results": len(unique_results),
        "results": unique_results
    }, f, indent=2)

print(f"Results saved to: {output_file}\n")

# Display top 5
print("Top 5 Results:\n")
for i, r in enumerate(unique_results[:5], 1):
    print(f"{i}. {r['photographer']}")
    print(f"   Resolution: {r['width']}×{r['height']}")
    print(f"   Search Query: {r['query']}")
    print(f"   Preview: {r['preview_url']}")
    print(f"   Page: {r['url']}")
    print()
