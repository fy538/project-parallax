#!/usr/bin/env python3
"""
Asset search runner: aerial semiconductor factory shots
Executes the search directly and saves results.
"""

import os
import subprocess
import sys
from pathlib import Path

# Step 1: Load environment variables from .env
env_file = Path(__file__).parent / ".env"
env = os.environ.copy()

if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                env[key] = val
                print(f"Loaded: {key}")

print("\nRunning search...\n")

# Step 2: Call source.py with search terms
cmd = [
    sys.executable,
    str(Path(__file__).parent / "source.py"),
    "aerial semiconductor factory desert",
    "aerial chip manufacturing plant",
    "drone view technology factory",
    "aerial industrial facility",
    "--type", "photo",
    "--preview"
]

result = subprocess.run(cmd, env=env, capture_output=True, text=True)

print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr, file=sys.stderr)

print(f"\nExit code: {result.returncode}")
