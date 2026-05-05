---
name: asset-source
description: >
  Search Pexels, Pixabay, and Unsplash for stock footage and archival images, score candidates across 5 dimensions, and present a ranked shortlist for human selection. Use whenever someone asks to 'source assets', 'find stock footage', 'find B-roll', 'get photos for the episode', 'run the shot list', 'source the remaining shots', or any request to search for production images or video clips. Also trigger when shot-list.json exists and the next pipeline step is asset sourcing, or when someone says 'what visuals do we still need'. Handles both batch mode (full shot list) and single-asset searches. This is distinct from source-feedback (which audits results after sourcing).
---

# Asset Source & Rank

You are sourcing production assets (photos and video clips) from free stock libraries, scoring them against production requirements, and presenting a ranked shortlist for Tiger to choose from. Your job is to be the filter between hundreds of generic stock results and the 1-3 images per shot that actually work for the Parallax brand.

## Why This Matters

Every image in a Parallax video passes through a 4-step brand treatment pipeline (desaturate → duotone remap → grain/vignette → composite). Not all stock photos survive that pipeline well. A vibrant lifestyle photo with flat lighting turns to mud after duotone. A high-contrast architectural shot with strong geometric lines looks incredible. Your scoring exists to predict which images will look good *after* treatment — not which ones look good raw.

## Inputs

1. **Shot list** (preferred) — a `shot-list.json` file in the episode folder. Each entry has:
   - `id`: unique asset identifier
   - `priority`: P1 (must-have), P2 (should-have), P3 (nice-to-have)
   - `type`: "photo" or "video"
   - `search_terms`: array of terms, most specific first
   - `treatment`: "standard" (ink→bronze→amber), "conflict" (ink→rust-mid→rust), or "editorial" (folder→bone→paper)
   - `notes`: context about what this shot needs to accomplish

2. **Ad-hoc request** — a plain-language description like "find me aerial shots of semiconductor factories." Convert this to search terms and run.

3. **Project context** (read as needed):
   - `remotion-templates/IMAGES.md` — sourcing decision tree, treatment pipeline, what to avoid
   - `remotion-templates/BRAND.md` — color ramps, visual identity
   - The episode script — for understanding what the narration says over this image

## The Sourcing Tool

The project includes `tools/asset-source/source.py`, a CLI that searches Pexels, Pixabay, and Unsplash. API keys are in `tools/asset-source/.env`.

### Running source.py

```bash
# Load API keys
source tools/asset-source/.env && export PEXELS_API_KEY

# Single search
python tools/asset-source/source.py "semiconductor cleanroom" --type photo --preview

# Batch mode (full shot list)
python tools/asset-source/source.py --batch episodes/silicon-trap/shot-list.json --output assets/ --preview
```

**If the sandbox blocks API calls** (403 proxy errors), tell Tiger and suggest:
1. Running `source.py` locally in their terminal (outside the sandbox)
2. Pasting the JSON output back so you can score and rank it
3. Or: using Claude in Chrome to browse Pexels/Pixabay directly

Don't waste time retrying blocked network calls. Acknowledge the limitation and pivot.

### Output format

`source.py` returns results as JSON (or prints them). Each result has:
```json
{
  "source": "pexels",
  "type": "photo",
  "id": 12345,
  "url": "https://www.pexels.com/photo/...",
  "preview": "https://images.pexels.com/...?w=400",
  "download": "https://images.pexels.com/...?auto=compress",
  "width": 5472,
  "height": 3648,
  "photographer": "Name",
  "license": "Pexels License (free, no attribution required)"
}
```

## Scoring

Score each candidate on 5 dimensions, each 1-5. The total (out of 25) determines ranking.

### 1. Resolution Fit (1-5)

Can this image fill a 1920×1080 frame without upscaling?

| Score | Criteria |
|-------|----------|
| 5 | ≥3840×2160 (4K+) — can crop freely |
| 4 | ≥1920×1080 — fits 1080p, some crop room |
| 3 | ≥1280×720 — usable but tight |
| 2 | ≥640×480 — needs upscaling, visible softness |
| 1 | <640 on any axis — unusable |

### 2. Aspect & Framing (1-5)

Does the composition work for 16:9 video framing?

| Score | Criteria |
|-------|----------|
| 5 | Native 16:9 landscape, strong subject placement |
| 4 | Landscape, may need minor crop but subject is safe |
| 3 | Square or wide landscape — cropping loses some context |
| 2 | Portrait — significant content loss in 16:9 crop |
| 1 | Extreme portrait or panoramic — unusable without severe crop |

### 3. Treatment Survivability (1-5)

Will this image look good after the Parallax brand treatment pipeline? This is the most important dimension — a beautiful photo that turns to mush after duotone is worthless.

| Score | Criteria |
|-------|----------|
| 5 | High contrast, strong geometric forms, clear light/dark separation. Architectural shots, silhouettes, macro photography, dramatic lighting. These are duotone gold. |
| 4 | Good contrast, recognizable subjects. Landscapes with clear horizon, industrial scenes, well-lit portraits. |
| 3 | Medium contrast, some flat areas but overall readable. Most well-shot stock photos land here. |
| 2 | Flat lighting, low contrast, pastel or washed-out. The duotone remap will compress these into a narrow tonal band — everything becomes the same shade of amber/rust. |
| 1 | Extremely flat, heavily filtered, neon/artificial colors that carry all the visual information (which gets stripped in desaturation). |

Predict this from metadata and description. Keywords that signal high survivability: "silhouette," "dramatic," "contrast," "industrial," "architecture," "macro," "black and white," "moody." Keywords that signal low survivability: "pastel," "flat lay," "bright," "colorful," "neon," "lifestyle."

### 4. Script Relevance (1-5)

How well does this image match what the narration needs?

| Score | Criteria |
|-------|----------|
| 5 | Exact match — the image shows precisely what the script describes |
| 4 | Strong match — right subject, right mood, minor differences (e.g., different angle) |
| 3 | Acceptable — right category but generic (e.g., "any semiconductor factory" when script needs "TSMC Arizona") |
| 2 | Tangential — broadly related topic but different context |
| 1 | Wrong subject — stock engine returned something off-topic |

Use the shot list `notes` field and the script context to judge this. A shot described as "Opening shot — needs to be cinematic. Desert landscape with massive industrial construction." demands more than a generic factory photo.

### 5. Source Diversity Bonus (0 or 1)

Add +1 to the total if this candidate comes from a different source than the current top-ranked candidate. This encourages variety in the shortlist so Tiger sees different options, not 5 slight variations from the same photographer on Pexels.

### Scoring from preview images

If you can fetch and view the preview image (via web_fetch or similar), use visual judgment to refine scores — especially Treatment Survivability and Aspect & Framing. Metadata-only scoring is the fallback when images can't be viewed.

## Workflow

### Batch Mode (full shot list)

1. **Read the shot list** — load `shot-list.json` from the episode folder
2. **Read IMAGES.md** — refresh your understanding of the sourcing decision tree and what to avoid
3. **Prioritize** — process P1 assets first, then P2, then P3
4. **Search** — run source.py for each asset (or batch mode for all at once)
5. **Score** — score every result on the 5 dimensions
6. **Rank** — sort by total score descending within each asset
7. **Present** — show Tiger the top 5 candidates per asset (see Presentation Format below)
8. **Collect picks** — Tiger selects 1 per asset (or asks for more options)
9. **Download** — download selected assets to the episode's `assets/` folder
10. **Update manifest** — write `asset-manifest.json` with selections, scores, and attribution

### Single Asset Mode

Same as above but for one search at a time. Skip the batch machinery.

## Presentation Format

For each asset in the shot list, present candidates like this:

```
### beat1-tsmc-aerial (P1 — photo)
> Opening shot — needs to be cinematic. Desert landscape with massive industrial construction.
> Treatment: standard (ink → bronze → amber)

| # | Preview | Source | Resolution | Score | Breakdown |
|---|---------|--------|------------|-------|-----------|
| 1 | [View](preview_url) | Pexels / John Smith | 5472×3648 | 22/25 | Res:5 Frm:5 Trt:5 Rel:4 Div:— |
| 2 | [View](preview_url) | Pixabay / JaneDoe | 3840×2160 | 19/25 | Res:5 Frm:4 Trt:4 Rel:4 Div:+1 |
| 3 | [View](preview_url) | Pexels / PhotoPro | 2400×1600 | 17/25 | Res:4 Frm:4 Trt:4 Rel:4 Div:— |
| 4 | [View](preview_url) | Unsplash / ArtShot | 4000×2667 | 16/25 | Res:5 Frm:4 Trt:3 Rel:3 Div:+1 |
| 5 | [View](preview_url) | Pexels / StockImg | 1920×1080 | 14/25 | Res:4 Frm:4 Trt:3 Rel:2 Div:— |

Pick a number (or "more" for additional results, "skip" to move on):
```

Key presentation rules:
- Always show the preview link so Tiger can visually confirm
- Show score breakdown so Tiger can see *why* something ranked high
- Include the shot list notes as a reminder of what this asset needs to accomplish
- Note the treatment ramp — it affects which images will work
- Group by asset, not by source
- If no results scored above 15/25, flag the asset and suggest alternative search terms

## After Selection

Once Tiger picks winners:

1. **Download** each selected asset via source.py or direct URL
2. **Save** to `episodes/EPXX-slug/assets/` with naming: `{asset-id}_{source}_{id}.{ext}`
3. **Write asset-manifest.json** to the same folder:

```json
{
  "episode": "EP01",
  "sourced_at": "2026-04-26",
  "assets": [
    {
      "id": "beat1-tsmc-aerial",
      "selected": {
        "source": "pexels",
        "source_id": 12345,
        "photographer": "John Smith",
        "license": "Pexels License (free, no attribution required)",
        "url": "https://www.pexels.com/photo/...",
        "file": "beat1-tsmc-aerial_pexels_12345.jpg",
        "resolution": "5472x3648",
        "score": 22,
        "score_breakdown": { "resolution": 5, "framing": 5, "treatment": 5, "relevance": 4, "diversity": 0 }
      },
      "treatment": "standard",
      "alternatives_considered": 5,
      "search_terms_used": ["TSMC Arizona construction aerial drone", "semiconductor factory aerial desert"]
    }
  ]
}
```

4. **Suggest next step** — remind Tiger that downloaded assets need to go through `treat.py` before use in Remotion compositions. Offer to run the treatment pipeline if treat.py is available.

## Edge Cases

- **No results for an asset**: suggest broadening search terms. Offer 2-3 alternative term sets based on the script context. If still nothing, flag for archival sourcing (Wikimedia Commons, Library of Congress) or AI-generated engraved illustration (per IMAGES.md sourcing decision tree).
- **All results score below 15**: present them with a warning. Suggest the asset might need non-stock sourcing.
- **Video assets**: scoring is the same, but also note duration. Clips under 5 seconds are usually too short for B-roll. Prefer 10-30 second clips.
- **Archival/historical shots**: stock libraries rarely have these. Flag immediately and suggest Wikimedia Commons or Library of Congress. Don't waste API calls searching Pexels for "FDR signing executive order 1941."
- **Portrait/person shots**: check the license carefully. Pexels and Unsplash licenses allow commercial use but editorial-only images exist. Note any restrictions.

## What NOT to Source

Per IMAGES.md, avoid:
- Photorealistic AI generations
- Generic "handshake over globe" stock photography
- Logos/brand marks as hero images
- Screenshots of news articles or social media
- Memes or internet-culture imagery

If a stock result looks like it belongs in a corporate PowerPoint, score it 1 on Treatment Survivability regardless of technical quality.
