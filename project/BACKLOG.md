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

### [BL-01] Thumbnail image generator
**Priority:** P1  
**What it is:** Remotion compositions that render final thumbnail images automatically. The `thumbnail-concept` skill already generates composition briefs (visual layout, text overlay, A/B variants), but the actual image is created manually.  
**Why it matters:** Thumbnails are the highest-leverage CTR lever. Manual creation is the current bottleneck between brief and YouTube upload.  
**Current workaround:** Manual design from the thumbnail-concept brief.  
**Dependencies:** Thumbnail-concept skill (done). Remotion template (not started).  
**Notes:** Should produce 1280×720 PNG. Three compositions per episode (Juxtaposition, Data Provocation, Symbolic) with A/B text variants.

---

### [BL-02] Shorts platform adapter
**Priority:** P1  
**What it is:** Automated Remotion rendering of Shorts from `shorts-adaptation` briefs into 9:16 video (1080×1920). The `shorts-adaptation` skill generates 3-4 standalone Shorts briefs per episode, but rendering to vertical video is manual.  
**Why it matters:** Shorts are the discovery engine for the channel. Manual rendering creates a bottleneck that limits Shorts output to 1-2/week instead of the target 3-5/week.  
**Current workaround:** Manual NLE export from brief.  
**Dependencies:** shorts-adaptation skill (done). Remotion 9:16 templates (3 Shorts variants exist but not wired to briefs end-to-end).  
**Notes:** See `remotion-templates/` — Shorts template variants are built; the missing piece is a brief-to-JSON-to-render pipeline mirroring the long-form flow.

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
