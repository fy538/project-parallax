# AGENTS.md — Parallax

> Read this **first**. For Parallax content/pipeline context, read [CLAUDE.md](./CLAUDE.md) after.

Parallax is a solo YouTube channel pipeline: **Python tools** (`tools/`) + **Remotion** (React→MP4) video templates (`remotion-templates/`) + **Markdown content** (`episodes/`, `project/`).

## Stack

- **Python 3.13** — CLI tools, manifest generator, asset sourcing, brand treatment
- **TypeScript** (strict mode) + **Remotion 4** — video templates
- **Pytest** for Python, **Vitest** for visual regression

## Table of contents

- [Daily build commands](#daily-build-commands)
- [Pipeline tools](#pipeline-tools) (grouped by stage)
  - [Topic discovery (weekly cadence)](#topic-discovery-weekly-cadence)
  - [Research → script](#research--script)
  - [Visual production + manifest](#visual-production--manifest)
  - [Narration + audio](#narration--audio)
  - [Render + episode validation](#render--episode-validation)
  - [Publish](#publish)
  - [Post-publish + learning loop](#post-publish--learning-loop)
  - [Cross-episode + sources](#cross-episode--sources)
  - [Editorial AI review](#editorial-ai-review)
  - [Cost tracking](#cost-tracking)
  - [Dev hygiene + misc](#dev-hygiene--misc)
- [Manifest doctrine (M-* rules)](#manifest-doctrine-m-rules)
- [Cross-document drift checks](#cross-document-drift-checks)
- [Slash commands and subagents](#slash-commands-and-subagents)
- [GitHub Actions (CI)](#github-actions-ci)
- [Pipeline state](#pipeline-state)
- [Code style](#code-style)
- [Testing](#testing)
- [Commits](#commits)
- [Security boundaries](#security-boundaries)
- [Things NOT to do](#things-not-to-do)
- [Architecture pointers](#architecture-pointers)
- [Manual-only tools (not auto-invoked)](#manual-only-tools-not-auto-invoked)

---

## Daily build commands

From repo root:

| Task | Command |
|---|---|
| Run all tests | `./scripts/test.sh` |
| TypeScript typecheck | `./scripts/typecheck.sh` |
| TS lint conventions | `./scripts/lint.sh` |
| Remotion preview | `cd remotion-templates && npm start` |
| Render an episode | `cd remotion-templates && npm run build silicon-trap-full out/ep.mp4` |

Per-stack (when you need granular control):

- Python tests: `pytest tools/ -q` (1900+ tests across modules, <12s)
- Python tests in watch mode: `./scripts/test-watch.sh` (requires `entr`)
- TS typecheck: `cd remotion-templates && npx tsc --noEmit`
- TS lint: `cd remotion-templates && npm run lint`
- TS visual regression: `cd remotion-templates && npm test`
- TS **real-data** PNG regression (all manifest `data/episodes` JSONs wired in `*-real-data.test.ts`): `cd remotion-templates && npm run test:real-data` — requires Playwright Chromium. **`map-real-data.test.ts` skips** unless `MAPBOX_ACCESS_TOKEN` is set to a public token (`pk....`). Example: `MAPBOX_ACCESS_TOKEN=pk.... npm run test:real-data`.
- JSON validation: `python3 tools/validate_data.py` (or `--files a.json b.json` for a subset)

---

## Pipeline tools

Tools are grouped by where they fit in the production pipeline. Most are CLI-runnable standalone; many are also auto-invoked by skills or `check-episode.sh`.

### Topic discovery (weekly cadence)

- **Signal monitor** (weekly topic pipeline): `python3 tools/topic/signal_monitor.py [--since YYYY-MM-DD] [--no-state-write] [--json]` — polls the RSS/Atom sources listed in `data/signal-sources.json` (default: Foreign Affairs, War on the Rocks, Carnegie, Brookings, Asia Times, RAND, CSIS) and emits a weekly digest of items posted since the last run. Tracks state in `data/signal-watch-state.json` (last_run + FIFO-trimmed seen_urls capped at 2000 to prevent unbounded growth). Read-only on `project/IDEAS.md` — the operator promotes selected items to the Signal Watch List manually. `--since` allows retroactive scans without clobbering the forward-moving last_run cursor. Uses stdlib `urllib` + `xml.etree` (no `feedparser` dep); sends proper `Accept: application/rss+xml` header for modern CDN-served feeds.
- **Idea-invalidation checker** (MKBHD video-board kill-list): `python3 tools/topic/idea_invalidation.py [--stale-only] [--strict] [--quiet] [--json]` — parses `project/IDEAS.md` (Signal Watch + per-arc topic tables) and flags each tracked topic with a freshness verdict (🟢 < 30d / 🟡 30-90d / 🔴 ≥ 90d since last check). Generates a YouTube search URL per topic for competing-coverage scanning; if `YOUTUBE_API_KEY` env var is set, ALSO calls the YouTube Data API for the top 3 hits (title + channel + view count + published date). Distinguishes API quota-exceeded errors (wait 24h) from generic API failures (fix the key). Read-only on IDEAS.md — operator updates the "Last Checked" column after acting on the verdict. Table-header detection is anchored by the separator row (not loose substring) so a data row whose cell happens to be "state" doesn't re-arm parsing; warns when an IDEAS.md table has no recognized column headers (catches schema drift).

### Research → script

- **Visual-hook lint**: `python3 tools/lint/check_visual_hook.py [--episode <slug>] [--strict] [--soft]` — verifies every episode's `viability.md` articulates its cold-open visual hook (the misconception-first image + sourcing estimate). Borrows Veritasium's discipline: no topic should cross from INCUBATING → VIABLE without the visual hook on paper. Defends against the most expensive failure mode in the pipeline (script-locked-but-visuals-don't-land). Severity: ERROR if missing for episodes at VIABLE state or beyond, WARN for INCUBATING. `--strict` upgrades warnings to errors; `--soft` always exits 0 (informational use). Template at `episodes/EPISODE_TEMPLATE/viability.md` includes the required section.
- **Anchor-bridge lint**: `python3 tools/lint/check_anchor_bridge.py <slug> [--strict] [--json] [--stdout] [--script PATH]` — script-audit lens for Johnny Harris's anchor-bridge editorial discipline. Classifies every visual cell in each beat as ANCHOR (footage / archival / AI-gen scene / data chart / framework diagram / map) vs TEXT-HEAVY (KineticTypography / Quote / Definition / etc.), then flags two failure modes: 🔴 NO anchor at all in a beat with ≥100 words narration, and 🟡 wall-of-typography (>60% text-heavy cells with ≤1 anchor). The anchor supplies the "this is real" credibility signal that narration bridges between; walls of typography make the viewer read what they're already hearing. `--strict` exits 1 on warnings as well as errors. LAYERED and unknown-MG templates are treated as neutral so brand-new templates don't silently penalize scripts.
- **Sayability lint** (pre-booth catch): `python3 tools/narration/sayability_lint.py <slug> [--threshold 60] [--top N] [--json] [--strict]` — scores every script sentence for read-aloud difficulty using 7 weighted metrics (word count, breath gap, alliteration runs, consonant clusters, sibilance ratio, unique long words, syllables/word). Sentences above the threshold are flagged BEFORE the booth so script-draft can revise hotspots instead of paying for them in retakes. Severity bands: 🟢 (<60) / 🟡 (60-75) / 🔴 (≥75). Sibilance pattern excludes /sk/ clusters (school / scope / scheme) which are stops, not sibilants. Alliteration scoring is banded (1 run = 5 pts, 2+ runs = full weight) so intentional rhetorical runs aren't double-penalized. Smoke against prisoners-dilemma v6.3 surfaced exactly 1 borderline sentence in Beat 5 at score 64.

### Visual production + manifest

- Manifest gen: `python3 tools/assembly/generate_manifest.py --script <path> --episode <slug> --output <path>`
- **Manifest-aware invalidation reporter**: `python3 tools/assembly/invalidate.py` — walks a git diff (default: working tree vs HEAD, **including untracked-but-not-ignored files** via `git ls-files --others --exclude-standard`) and reports which downstream artifacts are now stale per the declarative dependency graph at `tools/assembly/dependency-graph.json`. Run before commits, before recording sessions, and after script revisions to catch "the manifest still references the old script" / "the AI-gen clip was generated against last week's narration" failure modes. Closes the Kurzgesagt cancelled-halfway problem in our pipeline. Modes: default (`working tree vs HEAD + untracked`), `--from=REF --to=REF`, `--paths <files>`, `--episode <slug>` filter, `--json` for downstream tooling, `--soft` (alias `--no-fail`) for informational pre-commit use. Exits 1 when high-confidence stale artifacts exist, 0 otherwise. Does NOT auto-regenerate — emits the minimum command set you'd run to refresh.
- **Manifest schema migration**: `python3 tools/migrate_manifest.py` — status mode lists current versions of all manifests. `--to-version <X>` runs the migration planner; `--write` persists the result (default is dry-run). Migrations are registered in `MIGRATIONS` inside the script; the registry is empty today (schema is at 1.0) but the framework is wired so the first schema evolution doesn't become ad-hoc.
- Backdrop pick list: `python3 tools/assembly/print_backdrop_catalog.py` (add `--dark-register`, `--tag TAG`, `--tone-prefix dark`, `--chart-at-least high|medium|low`, `--markdown`). Pairing rules: `remotion-templates/design-references/backdrops/BACKDROP_CHART_PAIRING.md`
- **Sourcing brief generator**: `python3 tools/sourcing_brief.py <slug> [--pending-only] [--priority P1] [--source pexels] [--format csv] [--output FILE]` — reads `assembly-manifest.json` + `shot-list.json`, joins per shotListId, and emits a Markdown (default) or CSV brief grouped by beat. Each asset shows pre-built search URLs for the target platform (Pexels/Pixabay/Wikimedia/Archive.org), priority, treatment, notes, and status. Re-run after updating `asset.file` / `asset.status` to see only what's still pending. Use this to direct human or skill-driven asset sourcing.
- **AI-gen critic loop** (VISTA-style): `python3 tools/ai-video/critic_loop.py --dry-run [--json]` (CLI is for smoke testing; the loop is consumed programmatically by future Recraft / Flux / Kling wrappers). Wraps any AI generator in a generate → critique → re-prompt cycle. Four built-in critics evaluate the generated artifact against the brand brief: `palette_critic` (sampled pixels within Meridian palette tolerance), `prompt_spec_critic` (required terms present in the prompt), `dimension_critic` (output size matches spec), and `register_critic` (analytical / atmospheric / grounding keywords present). Hints from failed critiques are wrapped in `<<critic-loop:name>>` markers and REPLACE prior hints from the same critic on each iteration (preventing wall-of-imperatives bloat). Bounded by `max_iters` (default 4). Generator exceptions are captured as synthetic critiques so partial history is preserved instead of crashing mid-run. Adaptation of the VISTA research pattern: visual inspector with self-iteration, non-LLM critics so the loop is fast / free / deterministic in tests.
- **Orphan episode JSON** (files under `remotion-templates/data/episodes/<slug>/` not referenced as `template.dataFile` in `assembly-manifest.json`): `python3 tools/list_orphan_episode_json.py` (optional `--episode <slug>`, `--json`). Triage only — drafts and alternates may be intentional.

### Narration + audio

- **Scratch-narration pass** (Wendover discipline): `python3 tools/narration/scratch_pass.py <slug> [--wav PATH] [--skip-alignment] [--no-manifest] [-o REPORT] [--stdout]` — record narration EARLY (right after script lock, before visual-spec finalizes timing) and promote the assembly manifest to Whisper-precise mode against the scratch take. Verifies the scratch WAV via `whisper_alignment`, invokes `generate_manifest.py --audio` (600s subprocess timeout), and reports the drift between the 150-wpm estimate and the actual scratch runtime (🟢 within 5% / 🟡 5-10% / 🔴 ≥10%). Default scratch path: `episodes/<slug>/assets/narration-scratch.wav`. Re-run with `--wav narration.wav` once the final take is recorded to update the manifest with final timestamps. Closes the "late narration drift forces visual-spec rework" failure mode that the SOTA research surfaced as one of the highest-leverage borrows from Wendover.
- **Session planner**: `python3 tools/narration/session_planner.py <slug> [--wpm 150] [--overhead 1.8] [--break-every 15] [--json]` — given the script + target WPM + overhead multiplier, outputs estimated wall-clock session time, per-beat duration breakdown, suggested break points at beat boundaries (oversized beats land alone to respect the ~20-min voice-fatigue ceiling), and a warm-up reading order (easiest beat — lowest sayability avg — first so voice settles in before harder passages). Default overhead 1.8 reflects the solo-pickup workflow (no co-host, no producer-driven momentum); scratch-pass workflow can use `--overhead 1.3`. Composes with sayability_lint for the per-beat flag count.
- **Pickup script generator** (close the re-record loop): `python3 tools/narration/pickup_script.py <slug> --wav PATH | --alignment-json PATH [--merge-window 8] [--labels LABELS.txt] [--json]` — reads an `AlignmentReport` (live from `whisper_alignment` OR a cached JSON), finds each pickup candidate's surrounding script context, and emits a focused pickup-only document with lead-in / pickup-text / trail-out per chunk. Consecutive pickups within `--merge-window` seconds of each other fuse into one chunk (default 8s ≈ adjacent-sentence pickups; 15s+ apart stay separate). `--labels` also writes an Audacity .txt label track for snap-to-pickup editing. Context lookup uses longest-word-overlap matching so common phrases like "the rational actor" bind to the correct sentence, not the first substring hit. Forward-compatible JSON loader filters unknown `AlignmentIssue` fields so cached alignment JSONs survive future schema additions.
- **Audio QA (pre-mastering pre-flight)**: `python3 tools/narration/audio_qa.py [<slug> | --wav PATH] [--silence-min 2.5] [--strict] [--no-envelope] [--no-noise-floor]` — runs ffmpeg/ffprobe measurement passes against a narration WAV and emits `_audio-qa.md` with structured findings. Checks: LUFS vs YouTube target (-14 ±1), true peak vs -1 dBTP ceiling, channels (mono), sample rate (48 kHz preferred / 44.1 kHz acceptable), codec (PCM/FLAC preferred), silence gaps ≥ `--silence-min`s, RMS envelope std-dev across 5s windows (catches mid-session loudness drift Auphonic can't normalize), noise-floor RMS during detected silences (catches room-tone issues — target ≤ -55 dBFS; > -45 audible; > -35 unsalvageable). Composite **Auphonic-ready** banner gates on errors AND specific warnings that Auphonic can't paper over (wrong channels / lossy source / RMS drift / noisy floor). `--no-envelope` and `--no-noise-floor` skip the slower extra passes when only the cheap pre-flight matters.
- **Take comparator**: `python3 tools/narration/take_comparator.py <slug> [--beat N] --takes take1.wav take2.wav [...] [--wpm 150] [--json]` — when you record N takes of the same passage, ranks them objectively on 5 weighted metrics: word_accuracy (40 pts — fraction of script words present in the Whisper transcript), loudness_match (15 pts — distance from -16 LUFS Auphonic target), pace_stability (20 pts — std-dev of words/sec across 10s windows, lower is better), silence_pattern (15 pts — count of long silences, fewer is better), duration_match (10 pts — closeness to script-estimated duration). Composite 0-100 with the highest-scoring take recommended; tiebreak favors fewer long silences (cleaner edit). Reuses `audio_qa` for probe/loudness/silences and `whisper_alignment` for transcription. A corrupt WAV in the set is recorded as a synthetic 0-score "failed" take so one bad file doesn't abort the comparison. `--beat N` scopes the comparison to one beat's script text (useful when comparing pickup takes); default compares against the full script.
- **SFX generator** (Layer 2 + 3): `python3 tools/generate_sfx.py` — synthesises all 22 transition SFX + 7 texture-hit WAV files at 48 kHz · 24-bit · stereo. `--cue <name>` for one type, `--dry-run` to preview. Run after any sound design change; output goes directly to `remotion-templates/public/audio/sfx/`. Requires `numpy` + `scipy`.

### Render + episode validation

- **Episode validator (all checks, one command):** `./scripts/check-episode.sh <slug>` — chains JSON validation, manifest doctrine, _direction orphans, Zod schemas, concept registry, TS typecheck, convention lint, **asset preflight**. Use before every render. `--list` to see known slugs.
- **Asset preflight** (run standalone too): `python3 tools/preflight.py <slug>` — verifies every asset path referenced by a manifest (narration audio, music bed, FOOTAGE/AI-GEN clips) AND every asset path inside referenced `dataFile` JSONs (`imageSrc`, `illustrationSrc`, etc.) resolves to an on-disk file. Catches the "render dies 8 minutes in" failure mode. Pending-sourcing assets reported separately; `--strict` treats them as failures, `--json` for machine output.
- **Render postflight** (after `npm run build`): `python3 tools/postflight.py <path-to-mp4> [--episode <slug>]` — verifies the rendered MP4 isn't silently corrupted (size ≥ bytes/sec floor, has a video stream, duration matches `manifest.totalDurationSec` ± 0.5s, resolution = 1920×1080 by default or `--resolution 1080x1920` for Shorts). Requires `ffprobe` (degrades gracefully if missing). `--json` for machine output.
- **Logged render** (wrap any render command): `python3 tools/render_log.py --episode <slug> [--output <mp4>] [--label <suffix>] -- <command...>` — tees stdout/stderr to `episodes/<slug>/render-logs/<timestamp>[-<label>].log` AND the terminal, propagates the wrapped command's exit code, and (when `--output` is set) appends a postflight report to the log. Use this for any real render so a permanent record exists.

### Publish

- **Shorts proposer**: `python3 tools/publish/shorts_proposer.py <slug> [--top N] [--emit-manifest] [--llm-score] [--llm-model claude-sonnet-4-5] [--llm-dry-run] [--json]` — scans the assembly manifest for high-signal moments that make good standalone Shorts (TEMPLATE/DataChart + StatCaption → StatRevealShort, TEMPLATE/Quote → KineticShort, TEMPLATE/FrameworkDiagram → FrameworkDiagram-Short, plus beat-opener candidates from the first 30s of each beat). Heuristic path scores each on duration sweet-spot (25-45s), priority, and anchor presence; top-N proposed. **`--llm-score`** re-ranks the heuristic top-N via Claude against the Parallax bounded-analogy rubric (snap moment / bounded moment / self-contained / visual hook) — same I/O contract, smarter selection brain (heuristic finds WHAT to score, LLM judges WHICH deserves attention). Requires `ANTHROPIC_API_KEY`; `--llm-dry-run` previews the prompt without an API call. `--emit-manifest` writes a skeleton `episodes/<slug>/shorts-manifest-proposed.json` with TODO markers for the operator to fill in. Beat-opener candidates with no anchor visual AND below-band duration are skipped — a 30s talking-head opener isn't a Short worth proposing. Warns to stderr when a TEMPLATE component isn't in the proposer's mapping table.
- **YouTube description generator**: `python3 tools/publish/youtube_description.py <slug> [--no-intro] [--json]` — generates the YouTube description (chapter markers, concept callbacks, source footer placeholder, channel boilerplate). Chapters built from `assembly-manifest.beats[]`, auto-injecting an `0:00 Intro` synthetic chapter when the first beat starts > 1s. Duplicate-timestamp beats are deduped (would otherwise silently disable YouTube's chapter UI). Acronym-preserving title casing (US / WTO / TSMC / RAND / USSR / etc. stay upper-cased even when the title was ALL-CAPS). Concept callbacks pulled from `data/concepts.json` and capped at 8 with "…and N more" footer so long lists don't push chapters past the above-the-fold cutoff. Source-tag count from script `{✅}` markers — emits a per-claim placeholder section the operator fills in. Exits 1 if fewer than 3 chapters (below YouTube's chapter-UI activation minimum).
- **Publish state tracker**: `python3 tools/publish/publish_state.py [--slug <slug>] [--strict] [--json]` — walks `episodes/publish-order.json` and inspects each episode's filesystem footprint to surface the gap between declared state and actual artifacts. Checks 10 artifacts: brief / viability / angle-memo / script (canonical or versioned) / script-audit / assembly-manifest / narration (final or scratch with partial note) / thumbnail-spec / shorts-manifest (final or proposed with partial note) / rendered MP4 (≥ 1MB to reject truncated renders). The `STATE_REQUIREMENTS` table defines per-state minimums; `--strict` exits 1 when any episode's declared state requires artifacts that don't exist. `audited` state now requires `script-audit.md` (was previously identical to `scripted` and meaningless). Warns when `publish-order.json` has neither `queue` nor `published` keys (likely corruption).

### Post-publish + learning loop

- **Analytics ingest** (post-publish): `python3 tools/learn/analytics_ingest.py <slug> --csv retention.csv [--drop-threshold 3] [--window-sec 10] [--strict] [--json]` — parses a YouTube Studio retention CSV export, maps drops to assembly-manifest beat boundaries, and emits a findings report (🔴 material ≥10pp, 🟡 noticeable ≥5pp, 🟢 normal). Handles both `Time (seconds)` and `Video position (%)` header formats, with UTF-16 BOM fallback for Windows-locale exports. Each window-sized drop event is reported separately (no over-merging into giant spans that lose per-beat attribution). Retention values > 100% are clamped and warned. The `--json` output includes the full `points[]` series so downstream tools (learning_log per-third averages) get the data they need.
- **Learning-log scaffolding**: `python3 tools/learn/learning_log.py <slug> --retention retention.json --published-at YYYY-MM-DD [--overwrite] [--dry-run]` — pre-populates a `LEARNING_LOG.md` entry following the publish-retro skill's template. Derives retention profile (Hook 0-30s, Engagement 30s-3min, Body 3min-end — matching YouTube Studio's own band framing), top-3 findings from material drops (or top minors with explicit `[minor]` tag when no material drops exist), and visual-effectiveness notes from drop-to-beat mapping. Smart insertion: replaces the placeholder on first entry, appends before the template-comment marker on subsequent. `--overwrite` replaces an existing entry; absent that, duplicate slug exits 1.
- **Prediction tracker**: `python3 tools/learn/prediction_tracker.py {record|actual|report} <slug> [--field NAME --value V] [--drift-threshold 15] [--strict] [--json]` — three-mode CLI for tracking per-episode predictions vs actuals over time. `record` stores a predicted value (e.g. `expected_runtime_sec=770`); `actual` stores the actual (e.g. `actual_runtime_sec=812`); `report` computes per-field calibration drift across all episodes that have both. Auto-pairs fields by `expected_<X>` ↔ `actual_<X>` convention so new prediction dimensions work without code changes (warns on field names that don't follow the convention — likely typos). Writes atomically via tempfile + os.replace to prevent partial-file corruption. `--strict` exits 1 if any field's |mean Δ%| exceeds `--drift-threshold` (default ±15%). Useful for calibrating persona-eval, script-audit, and visual-spec predictions against post-publish reality.

### Cross-episode + sources

- **Source sheet generator** (Kurzgesagt discipline): `python3 tools/sourcing/source_sheet.py <slug> [--registry PATH] [--no-suggest] [--json] [--stdout] [-o sources.md]` — walks the production script for `{✅}` verified-claim tags and emits a per-episode `sources.md` ordered chronologically by narration timecode. Each claim becomes a numbered section with timecode + claim text + a `**Source:**` placeholder. When the concept registry has `type='source'` entries, claims that mention the source's author (word-boundary match on last name, so "Nash" hits but "us" doesn't false-match "trust") or title (multi-word substring ≥ 4 chars) are AUTO-POPULATED with the citation instead of the fill-in placeholder; the operator confirms before publishing. `--no-suggest` opts out. Timecodes use beat boundaries from the assembly manifest (positional indexing — works with non-numeric beat IDs like `opening`); without a manifest, falls back to word-count / 150wpm. Sentence splitter handles real-script edge cases: leading-tag migration (`{✅}` at end of sentence stays with the right claim, no duplicates across multi-claim cells) + empty-fragment merging (`[VISUAL-FIRST:]` directives in narration aren't surfaced as claims). Real-script smoke: prisoners-dilemma → 21 claims, 0 duplicates, 0 false positives; auto-suggestion fires the moment a matching `type=source` registry entry is added.
- **Typed concept lookups** (Casey Newton typed-object pattern): extends `tools/concepts/lookup.py` with three new subcommands — `person <name>`, `quote <substr>`, `source <author>` — that filter the registry by `type` ∈ {person, quote, source} and surface cross-episode appearances inline. Schema extension at `data/concept-registry.schema.json` adds the three new type enum values + optional `attribution` (for quotes) and `sourceMeta` (for sources — author/year/publisher/url/page). Hides `_status: "draft"` entries by default; `--include-drafts` opts in. Critical fix from review: extended `cmd_validate`'s `valid_types` list to match the schema enum — otherwise the pre-commit hook would have rejected every new typed entry. Operators can now run `lookup.py person Kennan` to see every prior mention of Kennan across episodes, or `lookup.py quote "self-help system"` to find every prior use of a quote.

### Editorial AI review

- **Episode-watch** (Twelve Labs Pegasus editorial AI): `python3 tools/episode_watch/episode_watch.py <slug> [--mp4 PATH | --video-id ID] [--dry-run] [--strict] [--json]` — uploads the rendered MP4 to Twelve Labs (Marengo 3.0 indexing), queries Pegasus 1.2 with a structured Parallax-doctrine prompt (pacing dead zones / visual register monotony / missed callbacks / AV desync / closing-third energy drops), parses findings into a markdown report keyed to assembly-manifest segment IDs. `--dry-run` prints the prompt without uploading (no API key needed — useful for prompt iteration). `--video-id` reuses an already-indexed video, skipping the ~$0.50 indexing pass for repeat queries. Requires `TWELVELABS_API_KEY` + `TWELVELABS_INDEX_ID` env vars for live calls. Pluggable HTTP layer for testability. Bounded retry on unknown poll-status responses — won't silently consume the 15-min poll budget on a misbehaving backend. Closes the "we never watch the finished video" gap — `script-audit` audits the script, `visual-spec` audits stills, but no other tool watches the assembled MP4.

### Cost tracking

- Cost log: `python3 tools/cost_tracker.py summary` and `python3 tools/cost_tracker.py add --episode <slug> --service claude --amount 12.50 --note "..."`
- **Cost forecaster**: `python3 tools/cost_forecast.py <slug> [--ai-video-tool {pika,kling,sora,runway,seedance}] [--still-tool {recraft,flux}] [--budget N] [--strict] [--compare-actual] [--json]` — projects pre-production spend BEFORE the AI-gen and mastering credits start burning. Reads shot-list.json (asset counts by type), ai-gen-briefs.md (per-shot `Target tool:` line determines still vs video split — no more 80/20 heuristic), assembly-manifest.json (totalDurationSec → Auphonic minutes), and script-production.md (word-count → narration runtime fallback when no manifest). Emits LOW/MID/HIGH bands per service (Claude / Stock / Recraft|Flux stills / Kling|Pika|Sora|Runway|Seedance clips / Auphonic). Claim-tag filtering in the script word count so `{✅}` / `{verified}` don't inflate the runtime projection. `--compare-actual` joins against COST_LOG.md spend-to-date via an explicit service→ledger-key map (no substring leak). `--budget N` adds a 🟢/🟡/🔴 banner; `--strict` exits 1 if MID exceeds budget. Warns when Sora $0 LOW band is amortized via ChatGPT Pro subscription (footgun if operator doesn't already have that). Silicon-trap baseline: MID ~$14 (LOW $7 / HIGH $25).

### Dev hygiene + misc

- Worktree for parallel work: `./scripts/worktree.sh new <slug>` / `remove <slug>` / `list`
- Clean regenerable artifacts (renders, caches, coverage): `./scripts/clean.sh`
- Clean episode cruft (`.DS_Store`, duplicate version files): `./scripts/clean-episode-cruft.sh [slug] [--apply]` (dry-run by default; reports duplicate `*-v2.{json,md}` files but doesn't auto-promote)
- Repo-wide doc consistency lint: `./scripts/check-docs.sh [--strict]` — catches four drift classes the May-17 audits surfaced: (1) template names in family SELECTORs that don't exist as folders under `src/templates/`, (2) palette hex values in BRAND.md that disagree with `tools/brand-treatment/palette.json`, (3) `npm run X` mentions in docs that aren't real scripts in `package.json`, (4) persona names from `data/personas.json` that don't appear in BOTH persona-eval and publish-retro skills. Wired into `check-episode.sh` as W9.
- Pipeline tracker refresh: `python3 tools/pipeline_validator.py --write-status [slug] --update-tracker` — regenerates per-episode `episodes/<slug>/_status.md` dashboard + the Health column in `episodes/PIPELINE.md`. Pure-read from `pipeline-state.json` + filesystem + COST_LOG + manifest mtimes; no writes outside the targeted markdown. Wired into `check-episode.sh` as the post-check refresh so the tracker is never more than one validation run out of date.
- Regenerate visual regression baselines (after intentional visual changes): `./scripts/regen-baselines.sh`

---

## Manifest doctrine (M-* rules)

**Manifest doctrine lint**: `python3 tools/lint/manifest_lint.py [--episode <slug>]` — runs all `M-*` doctrine rules against assembly manifests. Also runs automatically via pre-commit when `assembly-manifest.json` is staged. Rules:

- `M-D18` — music enters only after the opening setup concludes (POLISH.md D18)
- `M-CROSSFADE` — music crossfades land near beat boundaries
- `M-OVERLAP` — foreground segments that overlap must have an explicit transition
- `M-DATAFILE` — `template.dataFile` references exist on disk
- `M-CUE` — soundCue / textureCue types are canonical enum values
- `M-DURATION` — max(segments[].endSec) matches totalDurationSec ±0.5s
- `M-TEXT-ANIM` — textAnimation technique is canonical and matches template variant (see `project/TEXT_ANIMATION_REGISTER.md`)
- `M-SYNC-MISSING` / `M-SYNC-COUNT` — per-element anticipatory reveal sync coverage
- `M-DRIFT-DEFAULT` — driftPreset overrides don't contradict the template's editorial register (see `project/HOLD_MOTION_REGISTER.md`)
- `M-BGMODE` — foreground TEMPLATE segments within the same beat must share a backgroundVariant (light/dark); unintentional mode switches mid-beat fire a warning
- `M-TRANSITION-DEPRECATED` — deprecated transition types (`wipe-*`, `blur-through`, `whip-pan`, `spatial-zoom`) in `.in` or `.out`
- `M-TRANSITION-IRIS-CHART` — iris on a chart-category template (no focal-point anchor)
- `M-TRANSITION-DISSOLVE-CREEP` — >2 consecutive dissolve-in segments
- `M-TRANSITION-IRIS-OVERUSE` — >2 iris-in transitions episode-wide
- `M-TRANSITION-COLOR-WASH-TOKEN` — color-wash without `washColor` field (renders as transparent)

(See `project/TRANSITION_GRAMMAR.md` for full transition doctrine.)

---

## Cross-document drift checks

All soft / informational by default; `--strict` to fail.

- `python3 tools/check_script_manifest.py <slug>` — script + `shot-list.json` ↔ manifest. Catches renamed `shotListId`s and stale `[<slug>/*.json]` references.
- `python3 tools/check_concept_coverage.py <slug>` — concepts in `data/concepts.json` claiming `introduced.episode == <slug>` must have their `term.en` / `term.cn` / `term.pinyin` appear in the script (diacritic-insensitive substring match).
- `python3 tools/check_audio_cues.py <slug>` — `audio-cue-sheet.md` ↔ manifest. Cross-checks music-bed mood vocabulary, track count, and SFX/texture cue names against the canonical enum.

---

## Slash commands and subagents

The `.claude/commands/` directory has prompt templates for common workflows: `/new-episode`, `/new-template`, `/concept-search`, `/render-preview`, `/audit-script`. The `.claude/agents/` directory has `script-reviewer` and `visual-spec-reviewer` subagents for delegated audit tasks.

## GitHub Actions (CI)

- **Pull requests:** Linux [`scripts/test.sh`](./scripts/test.sh) + macOS **`macos-smoke`** (typecheck, unit Vitest, `templates.test.ts` visual smoke). Does **not** run the heavy **`test:real-data`** PNG suite (keeps PRs fast).
- **`test:real-data` in CI:** Job **`macos-real-data`** in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — runs on **push to `main`**, **daily schedule** (UTC), and **`workflow_dispatch`**. Installs Playwright and runs `npm run test:real-data` (same as local full PNG regression). On the **daily cron**, the lighter **`macos-smoke`** job is skipped so only **`macos-real-data`** uses a macOS runner that day (Linux **`test`** still runs).
- **Mapbox maps in CI:** Add repository secret **`MAPBOX_ACCESS_TOKEN`** with a **public** token (`pk....`): GitHub → repo **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Without it, **`map-real-data.test.ts`** skips in CI (same as local).

## Pipeline state

Episode state lives in [`episodes/PIPELINE.md`](./episodes/PIPELINE.md) — read it on session start to know what's queued and what action is next.

## Code style

### Python

- PEP 8, 4-space indent, type hints on public functions.
- Errors → `print(..., file=sys.stderr)` then `sys.exit(1)`. Don't return error sentinels.
- Catch specific exceptions; **never** `except Exception: pass` (log to stderr at minimum).
- Shared utilities live in `tools/shared/` (e.g. `color_utils.py`). Don't redefine.
- API-key-using tools must guard for missing keys before dispatching subcommands.

### TypeScript / Remotion

- **Strict mode is on.** Don't disable. Add `?? 0` / `?? ""` for optional fields where you need a value.
- **Per-frame cost matters.** Components re-render every frame at 30fps. Wrap in `useMemo`:
  - Any `Math.max(...arr)` / `Math.min(...arr)` / `arr.sort()` / `arr.filter()` over data props
  - Lookup-map construction
- Pure sub-components rendered in a loop → `React.memo`.
- Hooks (incl. `useMemo`) must be called **before** any conditional `return`. Rules of Hooks.
- **Magic numbers**: pull animation/timing constants from `src/design/theme.ts` (`timing.entrance.*`) and `src/utils/animation.ts` (`KEN_BURNS_MAX_SCALE`, `PAN_DRIFT_MAX_OFFSET`, `EXIT_FADE_DURATION`). Don't reintroduce hardcoded `1.02`, `15`, etc.
- **Brand colors** come from `tools/brand-treatment/palette.json` → loaded by `theme.ts`. Don't hex-hardcode brand colors anywhere else.
- **`console.warn` in render**: use `warnIf()` from `utils/dataWarnings.ts`. Raw `console.warn` fires 30× per second.

## Testing

- Repo root **`./scripts/test.sh`** runs Python, `tsc`, and a **narrow Vitest subset** (fast checks). It does **not** run `*-real-data` PNG suites; use `cd remotion-templates && npm run test:real-data` locally, or rely on the **`macos-real-data`** CI job (main / nightly / manual — see GitHub Actions above).
- Python tests are <12s. **New parsing/state logic must come with a test.** Patterns to copy: `tools/assembly/test_generate_manifest.py` (parsing-heavy), `tools/test_cost_tracker.py` (markdown round-trip), `tools/brand-treatment/test_treat.py` (numeric image processing invariants).
- **Visual regression baselines** live in `remotion-templates/src/__tests__/baselines/`. Run `./scripts/regen-baselines.sh` after any intentional visual change (palette, animation timing, template refactor) and commit the resulting PNGs. `cd remotion-templates && npm test` then catches future drift via pixelmatch at a 0.5% pixel-diff threshold (see `render-helper.ts → compareFramesPixel`).
- Visual regression baselines live in `remotion-templates/src/__tests__/baselines/`. After intentional visual changes, regenerate with `npm run test:baseline`.
- Pre-commit hook runs typecheck on changed `.ts/.tsx` and Python tests on changed `.py`. Don't skip with `--no-verify` unless you have a specific reason worth stating.

## Commits

- Conventional-ish: `Sprint X: brief summary`, `Fix N issues from review`, `feat: ...`, `fix: ...`.
- Atomic — one concern per commit.
- AI co-author trailer:
  ```
  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  ```
- Never `git push --force` to `main`. Don't `--no-verify` without saying why.

## Security boundaries

- API keys live in `.env` (gitignored). `.env`, `.env.local`, `.env.*.local` are all ignored.
- `tools/asset-source/source.py` and `tools/recraft/recraft.py` exit early with a readable message if their key is unset.
- Never log API keys (no `key[:20]...` previews — they leak).
- All subprocess calls use list form (no `shell=True`). Don't reintroduce shell-string subprocess.

## Things NOT to do

- Don't reintroduce `react-simple-maps` (replaced by Mapbox GL via `MapGL` shared component).
- Don't write to `.durationSec` without `?? 0` fallback (optional in many Zod schemas). Enforced by `lint-conventions.mjs` rule `no-bare-durationSec`; suppress with `// eslint-disable-next-line no-bare-durationSec` for rare intentional cases.
- Don't use `as any` in template files. Disables TypeScript safety and the bug surfaces only at render time. Enforced by `lint-conventions.mjs` rule `no-as-any-in-templates`; suppress with `// no-as-any-ok: <reason>` on the same line for documented exceptions (Mapbox expression arrays, d3-geo interop). The existing `// eslint-disable-next-line @typescript-eslint/no-explicit-any` pattern is also accepted.
- Don't use `console.warn/error/log` in render bodies — fires 30× per second. Use `warnIf()` from `utils/dataWarnings.ts` instead. Enforced by `lint-conventions.mjs` rule `no-console-in-render`.
- Don't put hooks (`useMemo`, `useState`, `useId`) **after** an early return.
- Don't catch with bare `except Exception: pass` in Python.
- Don't paste hex colors when there's a palette token.
- Don't expand abbreviations into magic numbers when there's a named constant.

## Architecture pointers

- Project overview, pipeline, identity: [`CLAUDE.md`](./CLAUDE.md)
- Remotion-specific design system + templates: [`remotion-templates/CLAUDE.md`](./remotion-templates/CLAUDE.md)
- Production pipeline stages (script → render → publish): [`project/PRODUCTION_PIPELINE.md`](./project/PRODUCTION_PIPELINE.md)
- Brand system: [`remotion-templates/BRAND.md`](./remotion-templates/BRAND.md) + [`tools/brand-treatment/palette.json`](./tools/brand-treatment/palette.json) (machine-readable source of truth)
- Decisions log: [`project/DECISIONS.md`](./project/DECISIONS.md)
- Lessons learned (Remotion gotchas): [`remotion-templates/LESSONS.md`](./remotion-templates/LESSONS.md)

## Manual-only tools (not auto-invoked)

These tools exist in `tools/` but no skill or script auto-invokes them. Run by hand when the named recovery scenario applies:

- **`tools/assembly/fill_manifest_holds.py <slug>`** — Manual HOLD-segment repair. Use when an assembly manifest is missing HOLD segments after timing drift (e.g., narration ran longer than estimate-mode predicted). Reads the manifest, computes gaps, inserts HOLDs to bridge.
- **`tools/assembly/sync_episode_clips.py <slug>`** — Manual clip-attachment to a manifest. Use when stock/AI-gen clips landed in `assets/` after `generate_manifest.py` ran and you need to back-fill `file:` paths on FOOTAGE segments without re-running the full generator.
- **`tools/parallax/parallax.py`** — Experimental AI depth-based parallax video generator (own `.venv` with torch/numpy; ~5 GB install). Standalone; not part of the standard B-roll pipeline. Use for one-off effects.
- **`tools/postflight.py <mp4-path> --episode <slug>`** — Verify a rendered MP4 isn't silently broken (zero-frame, truncated tail, wrong resolution). Auto-invoked by `render-episode.mjs` after the final concat; also runnable standalone.
- **`tools/asset-source/zerohit_fallback.py <slug>`** — Generate AI-gen briefs for stock-search zero-hit shots. Wired into `check-episode.sh` as W8 (count only); run standalone to write `episodes/<slug>/ai-gen-briefs.md`.

Tools that were retired during the May 17, 2026 audit are at [`tools/_archive/`](./tools/_archive/README.md) — kept for provenance, not invoked anywhere.
