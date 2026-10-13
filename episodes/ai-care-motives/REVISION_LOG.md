# Revision Log — ai-care-motives

> Append-only. Each entry records one meaningful structural change: what changed, why, and what it fixed. This feeds the Editorial Playbook — be specific enough that a future reader can extract a pattern from it.
>
> Format: one entry per script version boundary (v1→v2, v2→v3, etc.) or per significant rewrite within a version.

---

## [v1 → v2] [YYYY-MM-DD]

**What changed:**
[One paragraph describing the structural change — not line edits, but meaningful reorganization, beat dissolution, framing shift, etc.]

**Why:**
[What problem or audit finding prompted this change.]

**What it fixed:**
[Observable improvement — pacing issue resolved, weaker beat dissolved, cold open strengthened, etc.]

---

## v1.4 → v1.5 — 2026-10-08

**What changed:** Applied the user's approved six-part edit. Shortened the opening; separated known oversight from measurement of unobserved conduct; defined the Unwatched Test without claiming it guarantees trust; restored the imposed harmful-compliance training objective; distinguished evaluation recognition, behavior change, and model self-report; removed the base-model aside, hint statistic, and extra VW numbers; kept the question of caring open in the ending. Updated visual cues, labels, source notes, shot metadata, and image-prompt narration cues. Existing generated images are preserved.

**Why:** The earlier draft overextended hidden checking into a general theory of trust, compressed away a crucial experimental premise, and overloaded the AI section. Some visuals repeated stronger claims than the narration could support.

**What it fixed:** Narration reduced from 1,792 to 1,390 words. Beat 7 now has three findings with distinct roles. The arithmetic reconstruction is explicitly labelled. Spoken draft v5 matches the canonical narration column. Prior script archived as `drafts/production-script-v1.4-2026-10-07.md`; prior audits retained with revision-scope notes. Timings remain estimates; scratch read and final production validation remain outstanding.

**Verification:** Deterministic script lint: zero findings. All eight beats in the spoken copy match the production narration after stripping claim tags; shot-list JSON parses. Invalidation review flags downstream sourcing metadata only; no sourcing jobs were run because scene compositions and existing images are retained. This is not a timed read, rendered preview, or renewed full editorial audit.

## v1.5 → v1.6 — 2026-10-08

**What changed:** Restored or repaired the items flagged in the critique of v1.5 (spoken draft v5), keeping v5's honest Beat 7 structure and its cuts. (1) Thesis: Beat 5 now carries the pop-quiz / scheduled-exam / "ordinary Tuesday" image and says passing the test "says nothing about whether the helper is good"; Beat 8 opens "You don't need to know whether an AI cares…", restores the behaviorism concession and the Goodhart line. (2) Detail: Glaucon's quote and the fourteen-versus-three percentages are back. (3) Seams: Beat 1 now says what a "test result" is before asking what a good one means; "Could we settle the question…" became "So could we just ask the model why it behaved that way?"; Beat 7's close ties back to what the system does "when it thinks no one is checking"; Beat 4 drops the "known checks still work" sentence. (4) Repetition: Beat 6 no longer says "designed to recognize" twice and "Only then" has an antecedent; Beat 7 no longer restates the notes as a strategy twice; Beat 2's "If that changes your view" returned to "But something you admired just turned into arithmetic."

**Why:** v5 was accurate but flattened the claim (about 13% of declarative sentences carried a qualifier), lost the concrete image and quote, dropped the magnitude of the alignment-faking effect, and left several referent gaps.

**What it fixed:** Restored a committed reading without reintroducing the overreaches v5 removed (no base-model aside, no hint statistic, no second Volkswagen number, the model's notes still labelled as its own account). Visual rows changed: Beat 5 Glaucon card (now a quote-attribution card), Beat 5 definition card (three lines), Beat 7 ConditionalArgument (shows ≈14% / ≈3%). The prior v1.5 narration is preserved as `drafts/spoken-draft-v5-2026-10-08.md`; v1.5 visual rows were edited in place (no separate archive).

**Verification:** Deterministic script lint run after the edit; narration in `script.md` compared with the spoken copy. Not a timed read or a renewed full audit.

## v1.6 → v1.7 — 2026-10-08

**What changed:** Applied eight fact-check and clarity fixes from the independent fact-check and script review of v1.6. (1) Beat 6: West Virginia University is now "Earlier… had put… and driven them on roads across California" (its testing predates the EPA accusation; routes covered more than Los Angeles). (2) Beat 6: the EU line no longer says the scandal "accelerated" road testing; it says work had already begun and testing was required from September 2017 (the first RDE package was adopted in May 2015, before the scandal; verified Oct 8). (3) Beat 4: Kant's word is "prudent"; "Picture the street" marks the street as an illustration. (4) Beat 7: the tracing study is named as Claude 3.5 Haiku. (5) Beat 4: the raters are "part of its training," not "its street," so the street metaphor keeps one meaning. (6) Beat 7: "Could we just ask a model to explain itself?" replaces the bridge that pointed at the wrong experiment. (7) Beat 3: "Neither the help nor the admiration tells you, on its own, what the machine will do next time." (8) Beat 7: "It hadn't worked that out for itself" replaces the jargon.

**Why:** The fact-check found one claim with no source ("accelerated"), two overstated details (routes; Kant's street), and a timing order that implied West Virginia University's testing followed the EPA accusation; the review found referent gaps and one metaphor with two functions.

**What it fixed:** Narration now claims no more than its sources support. Not changed: the committed-claim question raised by the review (the episode never runs the Unwatched Test on a deployed assistant) and the visual/spoken sync items (14%/3% shown before spoken; mood and pace pairings). Beat windows and five row budgets were also recomputed.

**Verification:** Lint, narration comparison with the spoken copy, and prompt-cue check run after the edit. Not a timed read.

## v1.7, visual column only — 2026-10-12

**What changed:** The two Beat 7 cards for the 36 + 59 example are no longer set as an exchange. Each is now a statement in our own words, subtitled "Our summary of a published example · Anthropic, 2025": the first says what was asked and what the model described; the second sets out the method it described and marks the sums ("the sums are right") apart from the claim about how it computed ("a separate question"). Data files renamed from `recon-36-59-*` to `summary-36-59-*`. Narration is unchanged.

**Why:** The exchange cards held a paraphrase under the label "Illustrative reconstruction". VIS-12 allows a reconstruction only when it is word for word, and the published wording was not typed in. Tiger chose a plain statement over pasting the lines.

**What it fixed:** Nothing on screen now reads as the model's own words unless it is. The cost is that the viewer no longer sees the model's explanation as an exchange.

**Verification:** Both segments rendered from the live manifest and checked frame by frame; data validation, type-check and the measured visual QA run after the edit.

## v1.7, pace and cutting — 2026-10-12

**What changed:** After watching the first full draft Tiger found the narration a little slow and the picture thin on generated imagery. The synthetic timing read was re-paced from 140 to 160 words a minute with shorter pauses (11:04 to 9:36). Eighteen still segments were cut into two to five framings each on sentence boundaries, two clips already made during the toolbox exploration were placed where the script has action (the river pull, the walk away), the VW statistic card was moved to start with its subject, and the two two-second stills were given the pause before their line. 53 segments became 89. Narration is unchanged.

**Why:** In the first draft there was one cut every 12.5 seconds, sixteen stills were held longer than 8 seconds (the rating-cards still for about 19 seconds, three times), and only one generated clip was in the cut while eleven more sat unused.

**What it fixed:** One cut every 6.5 seconds; no still held longer than 7. The statistic card is empty for under a second instead of three. Not fixed: text-heavy cards have less reading time at the faster pace, and the laptop close-up recurs five times.

**Verification:** Built on a copy of the manifest first; a frame from each of the 57 new or changed shots was checked; Tiger compared the two full renders and adopted the second.

## v1.7, changed states and two clips — 2026-10-13

**What changed:** Six moments gained motion or a change in the picture. Four use an edited state of an existing still: the assessors dissolve away on "and another way elsewhere", the shepherd dissolves to his outline on "you vanish", the window lights on "cares", and the desk is empty on "when it thinks no one is checking". Two use new five-second clips pinned at both ends: the coin going down on the counter, and the hands typing. 89 segments became 92. Narration is unchanged.

**Why:** Tiger wanted more generated picture and motion in the cut. The rating-cards still and the desk still each appear four or five times, and a repeat with a change in it reads as a new picture.

**What it fixed:** Seven generated clip shots (28 s) where there were three, and four state changes that land on the word they illustrate. Not fixed: the empty desk's chair sits in a different place from the shot with the man in it, so it is used as its own wide shot, not a dissolve.

**Verification:** Built on a copy; frames before, during and after each change were checked, then frames from the full render; Tiger compared it with the adopted cut and adopted it. Cost about $1.44 on fal.

