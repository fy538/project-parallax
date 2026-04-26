# Parallax — Decisions & Open Questions

## Purpose
Running log of decisions made (with rationale) and questions still to resolve. Helps future conversations understand what's been decided and what needs work.

Last updated: April 26, 2026

---

## Decisions Made

### D1: Narrate yourself (not AI TTS)
**Rationale:** 35% viewer drop-off in first 45 seconds for AI narration vs human. For authority-dependent content (philosophy + geopolitics analysis), human voice carries trust signals that TTS can't replicate. Stock AI voices increasingly recognizable to audiences. Also good practice for speaking skills that compound into consulting/workshop value later.
**Future option:** Voice clone (of Tiger's own voice) for supplementary content once 50+ episodes establish vocal identity.

### D2: English first, Chinese platforms later
**Rationale:** Reduces complexity at launch. English YouTube has larger immediate addressable audience. Chinese platforms (Bilibili/Douyin) have different regulatory requirements (mandatory AI labeling since Sept 2025) and content norms. Expand after English channel is established.

### D3: Clean motion graphics as primary visual (not AI illustration)
**Rationale:** Evidence overwhelmingly shows AI-generated visuals trigger trust drop (~50%) and audience rejection. No successful educational channel found using AI illustration as primary visual. Winning formula in this niche: animated maps + motion graphics + stock footage, narrative-first. AI used as compositing tool only (reference art, backgrounds, textures), never as raw final output.

### D4: AI-assisted but not AI-labeled
**Rationale:** YouTube's policy distinguishes between AI as production tool (no disclosure needed) vs AI as content generator (disclosure required). Our pipeline: AI handles research/drafting/visual reference, human rewrites scripts, records narration, directs visual composition. Final viewer-facing content is substantively human-shaped. This keeps us on the "AI-assisted" side of the line.

### D5: Template-based visual production
**Rationale:** Building 5-6 reusable After Effects/CanvaPro templates (map animations, timelines, framework diagrams, data viz, text overlays, stock footage) that agents populate with structured data. Dramatically faster than bespoke compositing. Consistent brand look. Agents generate the data; templates render the visuals.

### D6: 5-10 hours/week time budget
**Rationale:** Full-time role at Siro. Target ~2-3 hours human time per video. Rest is agent-automated. Batch recording to minimize narration overhead.

### D7: Content positioning = "educated mysticism" (structural patterns, not predictions)
**Rationale:** Professor Jiang's brand is built on bold predictions — fragile, collapses if wrong. Our approach: present historical analogies as thinking tools, not truth claims. Sustainable credibility. "Epistemological humility as brand."

### D8: Three-mode visual grammar
**Rationale:** Historical segments (warm, atmospheric tones), philosophical/analytical segments (clean, cool, diagrammatic), contemporary segments (high-contrast modern). Visual mode shifts signal analytical mode shifts. Builds unconscious brand grammar over time.

### D9: 1 long-form + 3-5 Shorts per week cadence
**Rationale:** Channels using Shorts + long-form grow 41% faster. Shorts serve as discovery engine; long-form converts subscribers. One quality long-form per week is sustainable within time budget.

### D10: Three-track platform architecture (not a single bilingual channel)
**Date:** April 5, 2026
**Rationale:** Claude Research strategic assessment confirms: bilingual content on a single YouTube channel is algorithmically destructive. YouTube's recommendation system operates in largely separate language ecosystems. AIR Media-Tech (major YouTube MCN) warns mixed-language channels create communities where non-primary-language viewers "can watch but can't belong." YouTube's own Help Center advises against it.
**Decision:** Three separate tracks:
- Track 1 — English YouTube channel (primary): launch first, build to 50K+ subs before expanding
- Track 2 — Chinese Bilibili channel (adapted, NOT translated): content substantially reworked for Bilibili's danmu culture and audience expectations. Requires MCN partnership or registered entity for political content. Frame as "knowledge/education."
- Track 3 — Short-form discovery (TikTok, Douyin, Xiaohongshu): 30-60 second clips as traffic drivers
**Key insight:** YouTube's Multi-Language Audio feature allows adding a Mandarin audio track to English videos — useful for diaspora audiences as an interim measure before Bilibili launch.
**Sequencing:** English-only for Phase 1 (months 1-12). Bilibili expansion in Phase 2 (Year 2), timed with registered entity or MCN partnership.

### D11: Bilibili content strategy = Chinese intellectual traditions, not watered-down English content
**Date:** April 5, 2026
**Rationale:** Rather than viewing Chinese censorship (60,000+ documented rules per Citizen Lab) as an obstacle to balanced analysis, treat it as creative discipline. The Bilibili channel should explore Chinese analytical frameworks (Tianxia, Yin-yang dialectics, Legalism), Chinese historical perspectives, and domestic intellectual debates — content genuinely valuable to Chinese audiences on its own terms. Let the English channel do the cross-civilizational synthesis.
**Why this works:** Differentiates from state-aligned incumbents (观察者网, academic lecturers) by offering independent intellectual engagement with Chinese traditions, not just echoing state narratives.

### D12: Anchor in frameworks, not events
**Date:** April 5, 2026
**Rationale:** The temptation is to chase breaking news for algorithmic relevance. But the differentiated value — and what Hardcore History proves endures — is the framework itself. A video titled "What game theory reveals about why deterrence fails" generates views for years; "Analysis of this week's Iran crisis" has a 72-hour shelf life. Evergreen framework videos compound; newsjacking decays. Target 70/30 evergreen-to-timely ratio.

### D13: Budget for 18 months of unprofitability
**Date:** April 5, 2026
**Rationale:** Claude Research Year 1 revenue projections: $2,200 (conservative) to $8,000 (moderate) against 2,000+ hours of labor. This is not economically rational without runway. The channel needs independent income (Tiger's Siro role covers this), time-limited commitment to evaluate viability, and clear milestone gates for continue/pivot decisions.

### D14: Visual production stack = Remotion (React-based video renderer)
**Date:** April 25, 2026
**Rationale:** Evaluated After Effects, CanvaPro, Keynote, and D3.js against requirements (data-driven, template-based, version-controllable, agent-populatable). Remotion won decisively: React components render to MP4, templates accept JSON inputProps, everything is Git-tracked, and Claude can generate both the template code and the data files. AE is more powerful but requires manual compositing. CanvaPro can't do programmatic animation. Remotion's data-driven model means the same template handles different episodes by swapping JSON.
**Resolves:** OQ2 (visual production stack).

### D15: 7 reusable template types cover all visual needs
**Date:** April 25, 2026
**Templates built:** ChoroplethMap (country highlighting), RouteAnimation (trade routes), TimelineComparison (dual timelines), DataChart (bar charts), KineticTypography (text/quotes/stats), FrameworkDiagram (comparisons/flows/matrices), TitleTransition (episode/section/end cards).
**Rationale:** These 7 types, with their sub-variants, can represent any visual segment in a geopolitics video. EP01 validated this: 24 compositions across all 7 types covered every beat in an 18-minute script. New templates should only be added if a visual need genuinely can't be served by existing variants.

### D16: EP01 topic = US-China semiconductor geopolitics ("The Silicon Trap")
**Date:** April 25, 2026
**Rationale:** Script v3 finalized at ~2,700 words (18 min at analytical pace). 5-act structure: The Paradox, The Logic of Denial, The Other Side of the Wall, The Trap, Your Chips. Blends timely (DeepSeek R1/R2, TSMC Arizona, export controls) with evergreen (COCOM historical parallel, game theory framing). Strong hook: "America just bet $280 billion that it caneli—"
**Resolves:** OQ3 (first episode topic).

### D17: Centralized design system in BRAND.md + theme.ts
**Date:** April 25, 2026
**Rationale:** Color consistency across 24+ compositions per episode requires a single source of truth. BRAND.md is the human-readable reference; theme.ts is the code implementation. All JSON data files reference colors from this palette. Retheming globally means updating these two files only.
**Partially resolves:** OQ4 (channel branding). Logo, thumbnail templates, and intro/outro still TBD.

### D18: Skills-based production pipeline (visual-spec, script-audit, persona-eval)
**Date:** April 25, 2026
**Rationale:** Instead of building a custom multi-agent orchestration system (LangChain, ADK, etc.), we're using Claude skills — packaged workflows that run inside Claude sessions. Three skills built: visual-spec (script → JSON data files), script-audit (narrative quality review), persona-eval (audience resonance check). This is lighter-weight than a full agent pipeline but covers the critical production stages. Can evolve toward full orchestration later if needed.
**Partially resolves:** OQ7 (agent pipeline). Full orchestration (topic discovery, deep research, automated assembly) remains future work.

### D20: English-only until EP01 ships and pipeline is proven
**Date:** April 25, 2026
**Rationale:** Reinforces D2 and D10 with a harder constraint. Bilingual doubles everything — scripts, thumbnails, platform management, font systems, audience strategy. The Chinese definition cards (卡脖子, 举国体制) stay in EP01 as analytical content, but the channel identity, branding, and production pipeline are English-only. No Bilibili, no CN-specific assets, no bilingual thumbnail variants until: (a) EP01 is fully shipped, (b) the render pipeline is proven end-to-end, and (c) at least 3 episodes are published. Noto Sans SC stays in the font stack for analytical use but is not a branding concern.
**What this simplifies:** Brand identity exploration (Phase 1) focuses on one language. Thumbnail templates, logo, channel banner — all English. POLISH.md typography rules simplified. Skills don't need CN-specific logic.

### D21: Visual identity to be designed upstream before template polish
**Date:** April 25, 2026
**Rationale:** The Remotion templates were built with a functional color palette (blue=US, red=China) but no channel personality. POLISH.md was written to fix this gap, but the root issue is that visual identity exploration should happen before implementation, not after. Phase 1 (identity exploration via Claude Design or equivalent) → Phase 2 (codify into BRAND.md/POLISH.md/theme.ts) → Phase 3 (apply to templates). This is a one-time investment that compounds into every future episode.

### D22: Meridian brand direction — dual-mode visual identity
**Date:** April 26, 2026
**Rationale:** Evaluated 18 visual identity directions generated in Claude Design across fit, technical feasibility, thumbnail distinctiveness, and sustainability. Narrowed to top 3 (Cartograph, Dialectic, Tectonic), then created 3 hybrid directions (Meridian, Antipode, Stratum). Final system: Meridian as default (Cartograph-led, crosshair reticle, coordinate metadata), with Antipode variant (Dialectic-led, vertical split comparisons) and Stratum variant (Tectonic-led, historical layering). Dual-mode registers: Dark (cinematic, in-video) and Light (editorial, title cards, social). Palette: ink/amber/rust/bone/paper/oxblood. Typography: Space Grotesk (display) + IBM Plex Mono (body/metadata) + JetBrains Mono (data). Brand mark: ∴ (therefore symbol). Image treatment: 4-step pipeline (desaturate → duotone remap → grain/vignette → composite) normalizing all images into brand language. All codified in BRAND.md, implemented in theme.ts, skill updated.
**Resolves:** OQ4 (Channel Branding / Visual Identity) and D21 (Visual identity upstream before polish).

### D23: Format repertoire over single format — 8 identity directions, 7 episode types
**Date:** April 26, 2026
**Rationale:** Rather than locking into one content format, the channel uses a flexible repertoire of episode types unified by a consistent intellectual voice. 8 identity directions brainstormed (Detective, Honest Oracle, Translator Between Worlds, Dialectician, Wargamer, Philosopher's Lens, Time Collapse, Advisor). These map to 7 concrete episode formats with suggested frequency allocation (Detective ~50-60%, Dialectic ~15-20%, Time Collapse ~10-15%, others as specials/Shorts). A meta-layer runs through all formats: subtly teaching the audience how to think, not just what to think about. Full details in CONTENT_IDENTITY.md.

### D24: Prediction markets (Kalshi) as cross-cutting analytical device
**Date:** April 26, 2026
**Rationale:** Prediction markets provide real-time, money-weighted consensus probabilities on geopolitical questions. Integrating Kalshi market prices as a recurring analytical benchmark across all formats creates a genuinely new kind of YouTube analysis: quantified epistemology ("I think 65%, the market says 40%, here's why we disagree"). This isn't a standalone format — it's a layer that enhances every format. Detective episodes can use market mispricings as puzzles. Dialectic episodes use the market price as thesis. Oracle retrospectives get quantitative scorecards. Philosopher's Lens episodes can examine prediction markets themselves (Bayesian reasoning at scale, where wisdom of crowds fails). Community angle: Discord prediction tournaments, forecast clubs, calibration tracking. Natural sponsorship fit with Kalshi long-term, but editorial independence first — use markets organically before pursuing sponsorship. Two standalone episode ideas and two Shorts series concepts added to IDEAS.md. Full integration details in CONTENT_IDENTITY.md Part 3.

### D25: Arc-based topic planning over isolated episodes
**Date:** April 26, 2026
**Rationale:** Topics are planned in arcs of 3-5 episodes orbiting the same macro question from different angles and formats. Benefits: algorithmic topical consistency (critical for early niche identification), binge-friendly for returning viewers, each episode enriches the others (compounding value), Shorts extracted throughout reinforce the theme. First arc: "Great Power Technology Competition" (EP01-EP04). Four additional candidate arcs seeded in IDEAS.md. Standalone ideas can exist but get promoted to arcs when 2+ related ideas cluster.

### D26: Topic scoring rubric — five threshold tests
**Date:** April 26, 2026
**Rationale:** Every topic candidate must pass five tests regardless of format: (1) "Wait, what?" test — at least one moment that disrupts the viewer's mental model; (2) Arguable thesis — stateable in one sentence that a smart person would want to debate; (3) Two-pillar test — serves at least 2 of 3 content pillars; (4) Timely-or-timeless test — know which you're making, title in evergreen framing either way; (5) Compounding test — prioritize topics that build the audience's analytical toolkit for future episodes.

### D27: Negative topic filters — five categories to actively avoid
**Date:** April 26, 2026
**Rationale:** Five types of topics to pass on even if tempting: (1) "Both sides" where one side is clearly wrong (forced balance destroys credibility); (2) Topics where Tiger's identity becomes the story (culture-war framing undermines intellectual brand); (3) Forced framework applications (not everything is a prisoner's dilemma); (4) Pure news cycle with no structural depth (other channels cover news faster); (5) Topics requiring declaring one country right and another wrong (compromises epistemological brand).

### D28: Channel name = Parallax
**Date:** April 26, 2026
**Rationale:** "Parallax" — viewing the same object from different positions — is the perfect single-word encapsulation of the channel's multi-framework analytical approach. Short, memorable, intellectual without being alienating, strong visual brand potential. Research confirmed: existing YouTube channels using "Parallax" are all tiny and in unrelated niches (crypto, astronomy, robotics). The closest content overlap is a podcast ("Parallax Views") with modest reach — podcasts and YouTube are functionally separate namespaces. The word is distinctive enough to own in the geopolitics/education YouTube space once the channel reaches modest scale. Domain: secondary concern for YouTube-first channel; grab parallaxchannel.com or similar. Handles: secure @Parallax or @ParallaxGeo across YouTube, TikTok, X, Instagram.
**Resolves:** OQ1.

### D29: Research workflow = Claude.ai Deep Research + Cowork hybrid
**Date:** April 26, 2026
**Rationale:** Evaluated four tools for the research pipeline: Claude.ai Deep Research (multi-step agentic search, 100-250+ sources per query), Claude.ai Projects (persistent context), Cowork (file system, skills, production), and Claude Agent SDK (custom automation). Decision: use Claude.ai Deep Research for the heavy information gathering (topic discovery, deep research, fact-checking) and Cowork for everything that involves project files and production (scripting, quality review, visual spec, docs). Two Claude.ai Projects defined: "Topic Radar" (weekly scan, lightweight) and "Episode Research" (per-episode deep dive, heavyweight). Custom instructions, file upload lists, and prompt templates for both projects documented in RESEARCH_WORKFLOW.md. Agent SDK automation deferred until 10+ episodes validate the manual workflow. This approach requires zero engineering, leverages the Max plan fully, and the handoff between tools is a simple copy-paste of the research brief.
**Partially resolves:** OQ7 (agent pipeline — research stage now designed; full automation remains future work).

### D30: Research-audit skill — quality gate between research and scripting
**Date:** April 26, 2026
**Rationale:** Identified a gap in the production pipeline: Deep Research produces comprehensive briefs, but there was no structured quality check before scripting began. A script built on a weak brief fails at script-audit and wastes Tiger's limited review time. The research-audit skill runs seven lenses (structural completeness, claims verification with web search, historical parallel integrity, counterargument quality, scoring rubric, risk/editorial, arc coherence) and produces a verdict: READY FOR SCRIPTING / CONDITIONAL / NEEDS MORE RESEARCH. Tested against three briefs: EP01 gold standard (correctly: READY), a deliberately degraded version (correctly: NEEDS MORE RESEARCH), and a stub brief (correctly: NEEDS MORE RESEARCH). Key design decision: explicit verdict criteria with hard triggers for NEEDS MORE RESEARCH (missing sections, unverified load-bearing claims, missing counterarguments, overconfident language). Without these criteria, the skill defaulted to CONDITIONAL for everything — the explicit thresholds were essential. Skill location: `content/skills/research-audit/SKILL.md` (needs installation to plugins directory for auto-triggering).
**Updates pipeline:** Deep Research → **research-audit** → Script Draft → script-audit → persona-eval → visual-spec

### D31: Two-column production script format + visual asset pipeline
**Date:** April 26, 2026
**Rationale:** Identified a gap between "script done" and "video producible." The old script format had `[VISUAL: ...]` cues that were narrative-quality but not production-specific — they didn't specify where assets come from, what treatment to apply, or how to composite them. The new two-column format (SCRIPT_FORMAT.md) puts narration left and visual production specs right, with each visual moment specified by: source type (Remotion template / stock footage / archival / AI), search terms ranked by specificity, brand treatment ramp, composite mode + opacity, duration, and priority tier (P1 hero / P2 supporting / P3 ambient). Three tools built: (1) Python CLI for BRAND.md's 4-step image treatment pipeline (treat.py), (2) Remotion BrandImage component for render-time treatment via SVG filters, (3) asset sourcing tool for batch-searching Pexels/Pixabay/Unsplash from JSON shot lists. EP01 converted to v4 production format as proof of concept: 24 Remotion compositions, 16 stock footage clips, 5 archival images needed. Free stock libraries for launch; paid subscriptions deferred.

### D19: Project memory compounding system (CLAUDE.md + LESSONS.md + BRAND.md)
**Date:** April 25, 2026
**Rationale:** Session-to-session knowledge loss was identified as the biggest drag on productivity. Every technical gotcha, design decision, and iteration insight was being re-discovered. Three-layer memory system: CLAUDE.md (project overview and current state), LESSONS.md (technical gotchas), BRAND.md (design system). Skills reference these files. End-of-session consolidation ensures learnings flow back.

---

## Open Questions

### OQ1: ~~Project Name~~ → RESOLVED (see D28)
**Resolved April 26, 2026.** Channel name = **Parallax**. Viewing the same object from different analytical positions. Candidates considered: Rhyme & Reason, The Echo Chamber, Echoes of Empire, Pattern Language, The Oracle Problem, Cassandra Protocol, The Long Game, Refraction, Azimuth, Oblique, The Parallax Problem. Parallax won on conceptual fit + memorability + search uniqueness in the geopolitics YouTube niche. Next steps: secure handles across platforms, register domain.

### OQ2: ~~Specific Tool Stack for Visual Production~~ → RESOLVED (see D14, D15)
**Resolved April 25, 2026.** Stack is Remotion (React → MP4) with react-simple-maps for geo. 7 template types built. Stock footage and AI reference tools still TBD for supplementary visuals.

### OQ3: ~~First Episode Topic~~ → RESOLVED (see D16)
**Resolved April 25, 2026.** EP01 = "The Silicon Trap" (US-China semiconductor geopolitics). Script v3 finalized, 24 visual data files generated.

### OQ4: ~~Channel Branding / Visual Identity~~ → RESOLVED (see D22)
**Resolved April 26, 2026.** Meridian dual-mode brand system. See BRAND.md for full spec, IMAGES.md for image pipeline, theme.ts for code implementation.

**Details:**
- ~~Color palette (functional)~~ → RESOLVED: Data encoding colors in BRAND.md (see D17)
- ~~Typography (functional)~~ → RESOLVED: Space Grotesk (display) + IBM Plex Mono (body/metadata) + JetBrains Mono (data)
- ~~Channel visual personality/mood~~ → RESOLVED: Meridian default system (Cartograph-led, crosshair reticle, coordinate metadata) + Antipode variant (Dialectic-led vertical splits) + Stratum variant (Tectonic-led layering)
- ~~Brand color palette~~ → RESOLVED: ink/amber/rust/bone/paper/oxblood
- ~~Gradient/shadow/depth system~~ → RESOLVED: Dual-mode registers (Dark cinematic for in-video, Light editorial for title cards/social)
- ~~Image treatment pipeline~~ → RESOLVED: 4-step pipeline (desaturate → duotone remap → grain/vignette → composite)
- ~~Brand mark~~ → RESOLVED: ∴ (therefore symbol)
- Logo/wordmark: Meridian wordmark designed, implementation in progress
- Thumbnail template system: Updated for Meridian palette, deployed
- Intro/outro animations: Dark and Light mode versions produced

### OQ5: Monetization Timeline (Priority: Low — partially answered)
- YouTube threshold: 1K subs + 4K watch hours (est. 6-12 months)
- **Patreon:** Launch at ~1,000 subscribers (likely months 8-12). Tiers: $3 (early access + research notes), $10 (monthly Q&A + source bibliographies), $25 (Discord access + topic voting).
- **Sponsorships:** Framework-driven geopolitics attracts premium sponsors (VPNs, investment platforms, educational services, book publishers). $10-25 CPM for this demographic — 3-7x YouTube average.
- **Nebula:** Creator-owned streaming platform (founded by Wendover et al.) is aspirational Year 2-3 goal after 50K+ subs.
- **Bilibili monetization:** Negligible in Year 1 ($100-500).
- **Year 1 total projection:** $2,200 (conservative) to $8,000 (moderate). Not economically rational without independent income.
- **TLDR News benchmark:** Profitable with 12 FT employees and ~£1M annual revenue at sub-1M subs — proof that this niche can sustain a business at scale.
- **Next step:** Revisit after reaching 500 subscribers. Sponsorship outreach can begin earlier than Patreon.

### OQ6: Growth Hacking for 0-1K Phase (Priority: High)
Key tactics identified but not yet planned:
- Reddit engagement strategy (which subreddits, what contribution ratio)
- TikTok repurposing workflow
- Collaboration outreach plan (target channels 50K-500K subs) — **NOTE from April 5 session:** Collaboration strategy (guest appearances, response videos, cross-pollination with Spaniel, PolyMatter, etc.) is often the single biggest growth lever in Year 1 for analytical channels. The Claude Research doc doesn't cover this — needs dedicated planning.
- SEO keyword research for first 10 episodes
- Shorts strategy: 74% of Shorts views come from non-subscribers — critical discovery funnel. 3-5 per week extracted as compelling clips from long-form. **April 26 update:** 4 Shorts series concepts defined in IDEAS.md (Framework in 45 Seconds, History Rhymes, Both Sides Are Wrong, What Happens Next?) — each maps to a content identity direction and can be standalone discovery content, not just clips.
- Community building: Discord (current events, reading groups, source analysis, bilingual discussion) + WeChat group for Chinese-speaking members. Reading-group model (monthly shared books like Mearsheimer or Tetlock) is a unique differentiator. Target 200 deeply engaged Discord members before focusing on scale.
- **April 26 update:** Arc-based content planning (D23) and topic scoring rubric (D24) now provide a systematic approach to topic selection. 5 arcs seeded in IDEAS.md. See CONTENT_IDENTITY.md for full topic discovery framework.
- **Next step:** Build a 90-day launch plan with specific weekly milestones.

### OQ7: Agent Pipeline Architecture (Priority: High — PARTIALLY RESOLVED)
Conceptual design is complete (see PRODUCTION_PIPELINE.md). **April 26 update:** Research stage now fully designed as Claude.ai Deep Research + Cowork hybrid (see D29, RESEARCH_WORKFLOW.md). Two Claude.ai Projects with custom instructions and prompt templates replace the conceptual "Radar Agents" and "Scholar Agents." Research dossier schema defined via the 8-section brief structure. **Later April 26:** research-audit skill built and tested (D30) — fills the quality-gate gap between research and scripting. Pipeline now has 4 Cowork skills: research-audit → script-audit → persona-eval → visual-spec. Remaining implementation TBD:
- Full Agent SDK automation (deferred until 10+ episodes)
- **Next step:** Use the full pipeline on EP02. Validate that the handoff from Deep Research → research-audit → scripting works smoothly in practice.

### OQ8: ~~Content Risk Playbook~~ → RESOLVED
**Resolved April 26, 2026.** Full playbook written in **CONTENT_RISK_PLAYBOOK.md**. Covers: YouTube monetization risk map (Green/Yellow/Red triggers specific to geopolitical content), the "historical analogy shield" (three-layer framing strategy), propaganda accusation mitigation (6 preemptive defenses + reactive playbook), editorial red lines (7 "never do" + 5 "always do"), platform-specific risk notes (YouTube, TikTok, Bilibili), and 6 crisis scenario response plans. Key finding from research: YouTube's January 2026 guidelines expansion explicitly protects educational/documentary content on controversial issues — favorable for Parallax's format.

### OQ9: Collaboration Strategy (Priority: High — NEW)
**Added:** April 5, 2026
The Claude Research doc and positioning analysis both identify a gap: no collaboration strategy exists. For analytical channels in this space, cross-pollination with adjacent creators is often the single biggest Year 1 growth lever.
- Target creators: William Spaniel (game theory overlap), PolyMatter (format/audience overlap), CaspianReport (genre overlap), Reed Schultz Geo (emerging tier, mutual benefit)
- Format options: guest appearances, response/reaction videos, joint analysis of breaking events, podcast crossovers
- Approach: provide genuine analytical value, not just "collab for collabs sake"
- **Next step:** Develop a ranked outreach list of 10-15 creators in the 50K-500K range, draft a value-proposition pitch template.

### OQ10: Channel Voice and Persona (Priority: High — PARTIALLY ADDRESSED)
**Added:** April 5, 2026
**Updated:** April 26, 2026
The positioning matrix confirms the niche is differentiated, but the research doc says almost nothing about personality and narrative identity — the thing that makes people subscribe. CaspianReport works because of Shirvan's intelligence-briefing deadpan. Kraut works because of obsessive ambition. Dan Carlin works because of theatrical intensity. The niche alone doesn't build an audience; the persona does.
- Tiger's voice profile exists (see Creator Voice Profile section) but needs to be tested against actual content
- "Smart friend explaining over drinks" is the stated target — needs refinement through first 5-10 episodes
- **April 26 brainstorm:** 8 identity directions and 7 episode format types documented in **CONTENT_IDENTITY.md**. Key directions: The Detective (puzzle → investigation → reveal), The Honest Oracle (explicit probability + public tracking), The Translator Between Worlds (cross-civilizational fluency), The Dialectician (Hegelian thesis-antithesis-synthesis), The Wargamer (scenario/decision tree analysis), The Philosopher's Lens (framework-first, geopolitics as case study), The Time Collapse (parallel historical narratives), The Advisor (briefing-style analysis). Strategy: flexible repertoire of formats unified by consistent intellectual voice, not a single rigid format. Meta-layer: every episode subtly teaches the audience how to think, not just what to think about.
- **Next step:** Record a 2-minute test narration and evaluate against the voice profile. Test 2-3 format types against EP01 material. Iterate before Episode 1 launch.

---

## Session Log

### Session 1 — April 2, 2026
**Topics covered:**
- Reviewed project brief and Tiger's resume
- Analyzed Professor Jiang Xueqin's rise and content model
- Discussed agentic pipeline design (5 stages)
- Researched AiTelly's production model
- Researched TTS state of the art; decided on self-narration
- Deep research on visual strategy — original recommendation (cinematic AI illustration) was disconfirmed by evidence; revised to clean motion graphics
- Researched YouTube AI content policies
- Discussed AI disclosure strategy
- Researched audience demographics, growth strategy, first episode strategy
- Created project workspace documents

**Key insight from this session:** The competitive advantage comes from intellectual substance (script quality, philosophical depth, structural analysis) — not visual innovation. Visuals just need to be clean, professional, and consistent. This is good news because it means Tiger's strengths (philosophy + data science + AI orchestration) are the bottleneck, not visual production skills.

### Session 3 — April 5, 2026
**Topics covered:**
- Reviewed Claude Research strategic assessment PDF ("Launching a Bilingual Geopolitics Channel: A Complete Strategic Assessment")
- Critiqued the research doc: strong competitive landscape mapping, good gap analysis, but undersells AI-assisted production advantage and sidesteps the harder Bilibili differentiation question
- Deep analysis of meaningful differentiation against CaspianReport, Zeihan, Spaniel, Kraut, PolyMatter, Jiang Xueqin, and Chinese incumbents
- Built competitive positioning matrix (Excel, 3 sheets: heat-mapped ratings, differentiation map, strategic summary)
- Identified four structural moats: bilingual intellectual fluency, epistemological transparency, AI-augmented pipeline, framework pluralism
- Updated project documents (PROJECT_VISION, DECISIONS_AND_OPEN_QUESTIONS, RESEARCH_LOG) with new findings
- Added 5 new decisions (D10-D13) and 2 new open questions (OQ9-OQ10)

**Key insights from this session:**
- Differentiation is real but structural, not tonal — the combination of framework pluralism + cross-civilizational fluency + epistemological transparency + AI production is unique and hard to copy
- The biggest risk is not being indistinguishable from competitors; it's that the differentiation is too intellectual for algorithmic discovery
- Two critical gaps the research doc missed: collaboration strategy (biggest Year 1 growth lever) and channel persona/voice (the thing that actually makes people subscribe)
- The Bilibili question remains the hardest strategic problem — the research doc's "just launch English first" advice is correct sequencing but doesn't answer what the Bilibili channel actually IS in differentiated terms

### Sessions 4-6 — April 2026 (Remotion template building)
**Topics covered:**
- Built complete Remotion project with 7 template types (ChoroplethMap, RouteAnimation, TimelineComparison, DataChart, KineticTypography, FrameworkDiagram, TitleTransition)
- Resolved TypeScript issues (readonly tuples, react-simple-maps declarations, strict mode)
- Discovered self-render QA loop (Playwright Chromium + remotion still + Claude image reading)
- Fixed DataChart value label positioning bug (visual QA caught floating labels)
- Created visual-spec skill (script → visual breakdown table → JSON data files)
- Generated all 24 EP01 data files from script-v3
- Created BRAND.md centralized design system
- Created LESSONS.md technical gotcha reference
- Updated all project memory documents
- Added decisions D14-D19, resolved OQ2, OQ3, partially resolved OQ4 and OQ7

**Key insights from these sessions:**
- Remotion + data-driven JSON is the right abstraction level — templates are reusable, data is episode-specific, and Claude can generate both
- Self-render QA loop works for non-map templates (maps need CDN access for TopoJSON)
- Session-to-session knowledge loss was the biggest productivity drag — now addressed with 3-layer memory system (CLAUDE.md + LESSONS.md + BRAND.md)
- Skills-based workflow is lighter than full agent orchestration but covers the critical production stages
- 7 template types with sub-variants cover all visual needs for geopolitics content — validated on EP01's 24 compositions
- Reorganized project folder: project docs → project/, episodes → episodes/, skills → skills/, orphan files cleaned up

### Session 7 — April 26, 2026
**Topics covered:**
- Evaluated 18 visual identity directions from Claude Design
- Selected Meridian hybrid (Cartograph × Dialectic × Tectonic)
- Designed dual-mode system (Dark Meridian + Light Dossier)
- Defined 4-step image treatment pipeline (desaturate → duotone → grain → composite)
- Complete rewrite of BRAND.md with Meridian system
- Updated theme.ts: new palette, dark/light mode tokens, Space Grotesk + IBM Plex Mono
- Created IMAGES.md: sourcing, pipeline, per-template guidance, batch workflow
- Updated visual-spec skill and template-schemas for Meridian palette
- Migrated all 7 Remotion templates from legacy colors to palette/dark/semantic tokens
- Updated project docs (CLAUDE.md, DECISIONS.md, POLISH.md)

**Key insight:** The channel's core mechanic (the "parallel" — juxtaposing historical precedent with present) wasn't visually encoded in any initial direction. This led to incorporating the Dialectic direction's vertical split into the Antipode variant. The dual-mode solution resolved the tension between cinematic in-video feel (dark) and editorial credibility (light) by sharing the same palette DNA across both registers.
