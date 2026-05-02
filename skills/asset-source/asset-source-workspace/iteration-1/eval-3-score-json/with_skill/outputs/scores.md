# Asset Source Scoring — "Semiconductor Cleanroom"

**Search Query:** semiconductor cleanroom  
**Source:** Pexels  
**Date:** 2026-04-26  
**Context:** EP01 Beat 1 — P1 cleanroom footage (18s), inset @ 70%, standard treatment

> Opening shot sequence showing wafer handling in cleanroom environment. Macro footage of wafer handling, lithography machines. Slow, deliberate shots. Treatment: standard (ink → bronze → amber)

---

## Results Ranking

| # | Preview | Source | Resolution | Score | Breakdown |
|---|---------|--------|------------|-------|-----------|
| 1 | [View](https://images.pexels.com/photos/5473298/pexels-photo-5473298.jpeg?w=400) | Pexels / Mikhail Nilov | 4000×2667 | 21/25 | Res:5 Frm:5 Trt:4 Rel:3 Div:— |
| 2 | [View](https://images.pexels.com/photos/2588757/pexels-photo-2588757.jpeg?w=400) | Pexels / Pixabay | 5472×3648 | 20/25 | Res:5 Frm:5 Trt:4 Rel:3 Div:— |
| 3 | [View](https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?w=400) | Pexels / ThisIsEngineering | 3024×4032 | 18/25 | Res:4 Frm:2 Trt:4 Rel:4 Div:— |
| 4 | [View](https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?w=400) | Pexels / Flickr | 1920×1280 | 15/25 | Res:4 Frm:5 Trt:3 Rel:3 Div:— |
| 5 | [View](https://images.pexels.com/photos/4219862/pexels-photo-4219862.jpeg?w=400) | Pexels / RF._.studio | 640×427 | 10/25 | Res:2 Frm:4 Trt:2 Rel:3 Div:— |

---

## Scoring Methodology

### Dimension Scores (1-5 each)

#### 1. **Resolution Fit**
Ability to fill 1920×1080 without upscaling artifacts.

#### 2. **Aspect & Framing**
Composition suitability for 16:9 video, subject placement safety.

#### 3. **Treatment Survivability**
Predicted performance after Parallax duotone pipeline (desaturate → standard ramp → grain/vignette). This is critical: a high-resolution photo with flat lighting becomes muddy amber after treatment.

#### 4. **Script Relevance**
Match between image content and narration needs. For this asset: cleanroom environment, wafer handling, macro close-ups of chips/machinery, precision manufacturing atmosphere.

#### 5. **Source Diversity Bonus**
+1 if source differs from top-ranked candidate. All 5 results are Pexels; no diversity bonus applied.

---

## Notes on Ranking

**#1 — Mikhail Nilov (4000×2667):** Highest-scoring candidate. 4K professional photographer, landscape-native composition. Cannot assess actual cleanroom relevance from metadata, but professional photography + resolution + framing all positive. Treatment should hold up well on 4K source.

**#2 — Pixabay (5472×3648):** Marginally lower than #1 due to unknown photographer identity/style. Pixabay archive suggests stock imagery (potentially lower contrast). Highest absolute resolution but slightly lower confidence on treatment survivability.

**#3 — ThisIsEngineering (3024×4032):** Strong photographer brand ("engineering" explicitly in name suggests technical relevance) and good treatment score, but *portrait orientation is significant liability*. A 3024×4032 source cropped to 16:9 loses substantial vertical content. If this image is actually a cleanroom shot, the vertical crop might eliminate key details.

**#4 — Flickr (1920×1280):** Meets minimum resolution but no headroom for cropping. Likely documentary quality (Flickr archive). Tonal uncertainty in treatment phase.

**#5 — RF._.studio (640×427):** Disqualified from practical use. 640px width requires aggressive upscaling even for 1080p. Post-treatment, upscaling artifacts will compound duotone banding. Studio credit is good, but resolution is fatal.

---

## Recommendation

**Pick from #1 or #2** — both are production-ready in terms of resolution and framing. If preview images show:
- #1 (Nilov) has clearly visible cleanroom/precision manufacturing scene → **Select #1**
- #2 (Pixabay) has better macro detail or equipment focus → **Select #2**
- Both are generic stock → **Request alternative search terms** (e.g., "TSMC fab interior," "semiconductor lithography cleanroom," "chip fabrication macro")

**Skip #3–5** unless previews reveal unexpected gem content in #3. Portrait orientation is a structural problem for 16:9 video.

---

## Next Steps

1. **View preview links** for #1 and #2 to confirm content relevance
2. **If both are generic/unhelpful:** Suggest alternative search: "chip fabrication", "lithography machine closeup", "TSMC fab", "wafer manufacturing"
3. **If one scores visually:** Download via Pexels, proceed to `treat.py` image treatment pipeline
4. **If both acceptable but generic:** Select #1 (higher score) and request Tiger's approval before download

---

## Metadata Summary

| ID | Photographer | Resolution | License | URL |
|----|----|------------|---------|-----|
| 5473298 | Mikhail Nilov | 4000×2667 | Pexels License (free) | https://www.pexels.com/photo/5473298 |
| 2588757 | Pixabay | 5472×3648 | Pexels License (free) | https://www.pexels.com/photo/2588757 |
| 3861969 | ThisIsEngineering | 3024×4032 | Pexels License (free) | https://www.pexels.com/photo/3861969 |
| 1108101 | Flickr | 1920×1280 | Pexels License (free) | https://www.pexels.com/photo/1108101 |
| 4219862 | RF._.studio | 640×427 | Pexels License (free) | https://www.pexels.com/photo/4219862 |
