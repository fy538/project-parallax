# Parallax — Engineering Backlog

> Items documented in the pipeline that don't yet exist as runnable tools. Prioritized by production impact. Update priority when the channel trajectory changes.
>
> Last updated: 2026-05-06

---

## Priority key

| Priority | Meaning |
|---|---|
| **P1** | Blocks or significantly slows weekly production |
| **P2** | Saves meaningful time or closes a quality gap, but has a workable manual path |
| **P3** | Nice to have; defer until P1/P2 are done or until scale justifies it |

---

## Open items

### [BL-01] Thumbnail image generator — **DONE May 14, 2026**
**Priority:** P1 (shipped)
**Shipped:** `remotion-templates/scripts/generate-thumbnails.mjs` reads `episodes/<slug>/thumbnail-spec.json` (schema at `remotion-templates/data/episodes/_schemas/thumbnail-spec.schema.json`) and batch-renders every concept to `episodes/<slug>/thumbnails/concept-<id>.png` at 1280×720 via the existing `Thumbnail` composition. CLI: `npm run thumbnails -- --episode=<slug> [--only=a,c]`. All three layouts wired (juxtaposition, data-provocation, symbolic); each concept's `data` block is a complete `ThumbnailData` object. Non-zero exit on any failure. Verified end-to-end on `silicon-trap` (3 concepts, ~3-4s each, output bytes-distinct).

---

### [BL-02] Shorts platform adapter — **DONE May 14, 2026**
**Priority:** P1 (shipped)
**Shipped:** `remotion-templates/scripts/render-shorts.mjs` reads `episodes/<slug>/shorts-manifest.json` (schema at `remotion-templates/data/episodes/_schemas/shorts-manifest.schema.json`) and renders each entry to 1080×1920 MP4 in `episodes/<slug>/shorts/short-NN.mp4`. CLI: `npm run shorts -- --episode=<slug> [--preview] [--only=01,02] [--from=03]`. All 9 Shorts compositions (KineticShort, DataChartShort, SplitShort, StatRevealShort, FrameworkDiagram-Short, TimelineComparison-Short, ChoroplethMap-Short, SplitComposition-Short, ProbabilityGauge-Short) wired through. Verified end-to-end with 3 silicon-trap shorts (stat reveal, Morris Chang quote, chips-by-node chart).

---

### [BL-03] RAG fact-checking pipeline
**Priority:** P2  
**What it is:** Automated claim verification against a structured source database. Currently the `research-audit` skill does web search + flags unverified claims, but there's no persistent source corpus to check against.  
**Why it matters:** As episode count grows, cross-episode claim consistency becomes harder to maintain manually. A source database also enables provenance tracking (which sources anchored which claims).  
**Current workaround:** `research-audit` skill web search + human judgment (~10 min per episode).  
**Dependencies:** None blocking. Requires choosing a vector store (e.g., Chroma, Pinecone) and a chunking/embedding pipeline for research briefs and cited sources.  
**Notes:** Defer until 5+ episodes have shipped and the source corpus is large enough to be useful. Don't build infrastructure for a database of 3 episodes.

---

### [BL-04] Full Agent SDK orchestration
**Priority:** P3  
**What it is:** A custom multi-agent pipeline replacing the manual Claude.ai Projects + Cowork workflow. Each stage (research → angle memo → script → visual-spec → audio-spec) runs as an orchestrated agent, with state managed programmatically rather than via file-based PIPELINE.md.  
**Why it matters:** Would reduce human coordination overhead, enable parallel stage execution (e.g., asset sourcing running while script is in review), and make the pipeline reproducible.  
**Current workaround:** Claude.ai Projects + Cowork + manual PIPELINE.md updates. Works well for the current volume.  
**When to revisit:** After 10+ episodes validate the manual workflow and identify the highest-friction handoffs. See `project/RESEARCH_WORKFLOW.md → "Future Evolution"` section.  
**Dependencies:** All manual-workflow skills must be stable before automating them. Don't automate a workflow that's still changing.

---

## Retired / completed

*(Move items here when they ship, with the date and a one-line note.)*
