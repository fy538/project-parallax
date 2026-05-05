# Backup & Recovery

> What happens if the MacBook dies tomorrow. Solo founder reality check.

## Tier 1 — irreplaceable (must have off-machine backups)

| Asset | Location | Recovery if lost |
|---|---|---|
| **Narration WAV files** | `episodes/<slug>/narration.wav` (gitignored — too large) | Re-record. Hours of work per episode. |
| **`.env` files with API keys** | `tools/asset-source/.env`, `tools/recraft/.env`, etc. (gitignored) | Regenerate keys at each provider; update payment methods, rate limits, etc. |
| **NLE projects + final masters** | (lives outside repo) | Re-edit from rendered clips + narration. Multi-day setback. |
| **Original sourced media** | `assets/<episode>/raw/` (currently in repo, may grow large) | Re-source via `source.py` if URLs still valid; may need to re-pay or re-attribute. |
| **Concept registry** | `data/concepts.json` | Tracked in git. Recoverable from clone. |

**Action required:** ensure these are backed up to (a) cloud (iCloud / Drive / S3 with versioning) and (b) at least one external drive. Test recovery once per quarter.

## Tier 2 — regenerable but expensive

| Asset | Location | Regeneration |
|---|---|---|
| Rendered MP4 clips | `remotion-templates/out/<slug>/` (gitignored) | `node remotion-templates/scripts/render-episode.mjs --episode=<slug>` (~5–15 min/episode locally; faster on Lambda but costs $) |
| Treated images | `assets/<slug>/treated/` | `python tools/brand-treatment/treat.py` per image |
| AI-generated illustrations | `assets/<slug>/illust/` | `python tools/recraft/recraft.py` per prompt — costs API credits |
| AI-generated video | `tools/ai-video/clips/<slug>/` | Re-prompt Kling/Sora/Runway — costs API credits |
| Assembly manifests | `remotion-templates/data/episodes/<slug>/assembly-manifest.json` | `python tools/assembly/generate_manifest.py` (free, instant) |

## Tier 3 — fully regenerable from source

| Asset | Where it comes from |
|---|---|
| `node_modules/` | `npm install` |
| `__pycache__/`, `*.pyc` | Python re-compiles on next run |
| Remotion render cache | Auto-rebuilt by Remotion |
| LUT `.cube` files | `python tools/brand-treatment/treat_video.py --all-luts` |

## Recovery sequence (new MacBook, clean state)

```bash
# 1. Get the repo
git clone <repo-url> project-parallax
cd project-parallax

# 2. Restore Tier 1 from cloud/external
#    - Copy .env files into tools/asset-source/, tools/recraft/, etc.
#    - Copy episodes/<slug>/narration.wav files into place
#    - Copy assets/<slug>/raw/ if present

# 3. Install deps
cd remotion-templates && npm install && cd ..
pip install pytest jsonschema  # plus whatever else tools/ needs

# 4. Activate the git hook
git config core.hooksPath .githooks

# 5. Verify
./scripts/test.sh
python3 tools/validate_data.py

# 6. Regenerate Tier 2 as needed
#    - Renders, AI assets, illustrations, treated images
```

## What not to back up

- `node_modules/` — gigabytes, regenerable
- `out/` — regenerable
- `__pycache__/` — auto-built
- Anything matched in `.gitignore` except the explicit Tier 1 list above

## TODO

- [ ] Confirm `.env` files are in cloud backup (verify each one)
- [ ] Set up a `scripts/backup.sh` that rsyncs Tier 1 to an external drive
- [ ] Document the API key rotation procedure (per provider)
