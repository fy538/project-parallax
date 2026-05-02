#!/usr/bin/env python3
"""
Run asset search for aerial semiconductor factory shots
"""

import sys
import json
import os
from pathlib import Path

# Load environment
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key] = val

# Now import the source module
sys.path.insert(0, str(Path(__file__).parent))
from source import search_with_fallbacks

# Search terms for aerial semiconductor factory shots in desert
search_terms = [
    "aerial semiconductor factory desert",
    "aerial chip manufacturing plant",
    "drone view tech factory desert",
    "aerial industrial facility technology",
    "bird's eye view semiconductor plant"
]

print("Starting search for aerial semiconductor factory shots...")
print(f"Search terms: {search_terms}\n")

result = search_with_fallbacks(search_terms, media_type="photo")

# Save full results
output_dir = Path(__file__).parent / "search_results"
output_dir.mkdir(parents=True, exist_ok=True)

results_file = output_dir / "search_results.json"
with open(results_file, "w") as f:
    json.dump(result, f, indent=2)

print(f"\n{'='*60}")
print(f"Total results found: {result['total_results']}")
print(f"Results saved to: {results_file}")
print(f"{'='*60}\n")

# Display top 5 results
if result['results']:
    print("Top 5 Results for Selection:\n")
    for i, r in enumerate(result['results'][:5], 1):
        print(f"{i}. [{r['source'].upper()}] {r['width']}×{r['height']} px")
        print(f"   Photographer: {r['photographer']}")
        print(f"   Preview: {r['preview']}")
        print(f"   Page: {r['url']}")
        print(f"   License: {r['license']}")
        print()
