# Parallax — Pre-Launch Checklist

> Runnable in ~1 day. Complete before episode 1 publishes.
>
> **Purpose:** Consolidate the high-confidence operational findings from the May 2026 channel-operations research (RESEARCH_LOG §§18, 20, 21) into one actionable list. This checklist exists so that the security, compliance, and channel-setup work happens *once*, before launch, rather than reactively after the first incident.
>
> **What this is not:** This is not the launch decision (single video / batch / when). That decision relies on weaker evidence and stays open for Tiger's editorial judgment. This checklist is only the high-confidence prerequisites.
>
> Last updated: 2026-05-10

---

## 1. Account Security (≈3 hours, ≈$50–100)

> Source: `project/research/2026-05-operational-risk-management.md`. The documented case study: a creator hacked via phishing recovered email in 12 hours but waited **3.5 weeks** for YouTube to restore the channel. Phishing via fake brand-deal emails is the documented primary attack vector against creators. Pre-launch security investment is small; post-incident recovery is weeks.

- [ ] **Strong unique password + password manager.** Random 15+ character password for the Google account that owns the channel; stored in Bitwarden / 1Password / equivalent. No reuse, no public sharing.
- [ ] **Disable SMS 2FA.** SMS is vulnerable to SIM-swap attacks. Use a TOTP authenticator app (Authy / Google Authenticator) at minimum.
- [ ] **Buy two FIDO2 hardware keys** (~$50–100 total). YubiKey 5 series or Google Titan. Two keys so one is the daily-use key and one is the offline backup. Register both with the Google account.
- [ ] **Enroll in Google Advanced Protection Program** (free). Disables weaker MFA methods, requires hardware keys for sign-in. Once enrolled, weaker recovery routes are locked out.
- [ ] **Lock the SIM** on the phone tied to the recovery number. Set a SIM PIN with the carrier to deter SIM-swap attacks.
- [ ] **Configure recovery email and recovery phone** — both set, neither identical to public business contact.
- [ ] **Generate and store backup codes offline** (physical safe or encrypted vault). Note channel ID, channel creation date, and a typical IP for identity verification if locked out.
- [ ] **Set up Brand Account / channel permissions structure.** The Owner role stays on the primary Google account that's logged out of daily devices. Create a secondary Google account with Editor role for routine uploads. If a daily-use session is hijacked, the attacker hits the Editor account, not the Owner. (See risk-management report for the rationale.)
- [ ] **Off-platform audience contact pathway.** Newsletter signup form (Beehiiv / ConvertKit free tier) or RSS feed live before episode 1, with a link in every video description and the channel About page. This is the *only* way to reach subscribers if the channel is ever locked or terminated.
- [ ] **Backup raw masters off-platform.** Master video projects, narration audio, source files, licenses on an external drive or cloud. If the channel is terminated, downloads via Google Takeout become impossible — backups are the only continuity path.
- [ ] **Threat-aware inbox discipline.** Treat every brand-deal email as suspect: never click attachments, never paste session cookies, verify any "YouTube Partner" emails by going directly to studio.youtube.com rather than clicking links. Phishing brand-deal emails are how most creator hijacks happen.

---

## 2. AI Content Compliance (≈30 minutes)

> Source: `project/research/2026-05-ai-content-compliance.md`. The TL;DR: YouTube's help center *explicitly lists* the AI use cases Parallax actually has as **exempt from disclosure**. Parallax is far inside the safe zone. The 16-channel termination event (January 2026) targeted entirely-AI workflows with zero human editorial input — Parallax is nowhere near that line.

- [ ] **Confirm Parallax's AI use case is in the exempt category.** The exempt categories per YouTube's documentation:
  - Generative AI used for production assistance (script ideation, outline help, research synthesis) — exempt
  - Stylized / animated illustration that is not photorealistic — exempt
  - Motion graphics, charts, abstract data visualization — exempt
  - AI-cleaned audio of *your own* voice (noise reduction, repair) — exempt
  - AI-assisted thumbnails when underlying photography is human — exempt
- [ ] **Default upload disclosure: "Altered content: No."** Choose No on the disclosure checkbox unless an episode contains a *photorealistic* synthetic depiction of a real person, place, or event that a viewer could mistake for actual footage. Parallax's constructivist illustration aesthetic does not meet that bar.
- [ ] **If a single episode ever contains a photorealistic AI scene** (e.g. a fabricated city skyline that looks real), choose Yes for that episode and add a brief description-line note. Per YouTube: disclosure has *no* algorithmic penalty. The risk is from under-disclosing, not from over-disclosing.
- [ ] **Maintain a backstage human-authorship audit trail.** For each episode, archive: script drafts (showing Tiger's writing), narration audio, project files with timestamped edits, and a one-line note on which AI tools were used for what. Not required by policy, but provides receipts if a video is ever flagged as inauthentic.
- [ ] **Voice cloning policy: only Tiger's own voice.** Cloning Tiger's own voice is exempt. Cloning anyone else's voice, including a public figure's, is either disclosure-required or disallowed depending on context. Parallax's policy is to never use AI to imitate any voice other than Tiger's.
- [ ] **Title and description discipline:** unique per episode, no template repetition. The "mass-produced, template-driven" pattern is what triggers the inauthentic-content classifier. Each title uniquely reflects its episode subject.

---

## 3. Channel Page Setup (≈2–3 hours)

> Source: `project/research/2026-05-launch-operations.md` (Section: Channel-Page Setup). High-confidence — based on YouTube's own best-practice documentation.

- [ ] **Channel banner (2560×1440 with safe-area guidelines).** Includes channel name, ∴ brand mark, and release cadence ("New essays every two weeks"). Up to 5 sidebar links — at minimum: newsletter, primary social handle, About-page-equivalent off-platform.
- [ ] **Channel icon / avatar.** ∴ symbol or wordmark, legible at thumbnail scale. Appears on every video and every comment, so legibility at small sizes is non-negotiable.
- [ ] **About page.** 200+ words minimum, first 100 characters as the hook. Keywords integrated naturally (geopolitics, historical analogy, philosophy, structural patterns, etc.) — YouTube uses About-page text for search SEO. Include the elevator pitch verbatim from PROJECT_VISION.
- [ ] **Custom channel handle (`@parallax` or equivalent)** claimed.
- [ ] **Channel trailer decision.** Two options — (a) record a 30–60s pitch video before episode 1 and use it as the unsubscribed-visitor trailer, or (b) leave the unsubscribed trailer slot blank at launch and let episode 1 fill it by default. Either is acceptable; (b) is the lower-friction option for solo launch. If choosing (a), keep it short, theme-promising, and replace once a strong episode exists.
- [ ] **Featured video for subscribers.** After episode 1 is live, set it as the subscribers-returning featured video. Update as new flagship episodes ship.
- [ ] **Initial playlists.** Create 1–2 thematic playlists from day one, even if each contains only episode 1. Examples for Parallax: "Episodes — All," "Philosopher's Lens" (format), arc-specific playlists once arcs have multiple episodes.
- [ ] **Channel sections / shelves on the Home layout.** Set at least: Latest Videos, the primary playlist. Avoid empty sections — the channel page should not look hollow on first visit.

---

## 4. First-Week Operations Awareness (no pre-launch action required, but be ready)

> Source: `project/research/2026-05-launch-operations.md` (algorithmic-dynamics section). High-confidence — sourced from TubeAnalytics 2026 algorithm analyses.

- [ ] **Know the test-audience mechanics:** Episode 1 will be shown to 100–500 initial impressions in the first 24–48 hours. To pass the test and expand distribution, the video needs to clear roughly **CTR ≳ 4%** and **AVD ≳ 40%** on those impressions. Below those thresholds, distribution stalls.
- [ ] **Plan external traffic seeding for the first 48 hours.** Reddit (r/geopolitics, r/AskHistorians, r/CredibleDefense as appropriate to the episode topic), the newsletter list once it has any size, X/Twitter, LinkedIn. Google research found videos receiving early external traffic are ~2× more likely to rank in search within 30 days.
- [ ] **Don't iterate title/thumbnail in the first 48 hours.** The signal is too noisy. Wait until at least 2–4K impressions accumulate before considering a Test & Compare run. (See PROD-06 in EDITORIAL_PLAYBOOK.)
- [ ] **Comment-management plan for launch week:** within the first hours, post a pinned creator comment that anchors the discussion (FAQ-style, link to next episode if relevant, soft subscribe ask). Reply to the first wave of top comments. Heart genuine supportive comments. Do not commit to replying to every comment — quality over quantity.
- [ ] **Set comment moderation to "Hold potentially inappropriate comments for review."** One toggle in YouTube Studio, takes 30 seconds, reduces spam/hate cleanup burden.

---

## 5. Geopolitics-Specific Demonetization Framing Check

> Source: `project/research/2026-05-operational-risk-management.md` (Monetization & Demonetization section). High-confidence — based on YouTube's documented advertiser-friendly content guidelines and post-Ukraine/Gaza policy tightening.

For every episode that touches contemporary conflict — wars, terrorism, sanctions, named ongoing crises — run this check before publish:

- [ ] **Title scan.** Does the title contain trigger words: war, massacre, genocide, killed, attack, bombing, atrocity? If yes, can the structural-framing rule (PROJECT_VISION title rule) replace them with a structure word (collapse, brittleness, succession, overstretch, sclerosis)?
- [ ] **Thumbnail scan.** Does the thumbnail show graphic conflict imagery — bodies, explosions, weapons aimed, visible casualties? If yes, replace with abstract / map / portrait / symbolic imagery. The constructivist visual style does this naturally; the check is whether a specific thumbnail drifted toward sensationalism.
- [ ] **Description scan.** First 150 characters (the visible portion in search) — same trigger words check.
- [ ] **Self-certification ("Checks") at upload.** Use YouTube Studio's pre-publish Checks questionnaire honestly. Lying to Checks is a separate policy violation; using Checks correctly often pre-clears benign content that would otherwise auto-flag.
- [ ] **If yellow icon appears anyway:** request manual review via Studio. Average resolution time ~7 days. 60–70% of disputed Content ID claims resolve in the creator's favor; ad-suitability appeals have less public data but the path is the same. Don't delete or re-upload — appeal first.

The framing rule is structurally compatible with the existing title rule ("answer what structure am I revealing, not what topic am I covering"). Episodes named for structures rather than events naturally avoid most demonetization triggers.

---

## 6. What This Checklist Does Not Cover

These remain Tiger's editorial decisions, not pre-launch checklist items:

- **Launch sequence** (single video / 3-video batch / trickle) — the launch-operations report's recommendation is Medium-Low confidence; the credibility-niche comparables (CaspianReport, Asianometry) both launched single-video and grew slowly. Treat as informational input, not a rule.
- **Content cadence** — biweekly is the planned default; the 12-month playbook's milestone timing should be treated as aspirational rather than expected.
- **Newsletter / Patreon / sponsorship** — covered in `2026-05-12-month-operational-playbook.md` as month-by-month operational guidance, not pre-launch.
- **Insurance** — flagged as low priority pre-launch; revisit at ~50K subs.

---

## Cross-references

- `project/research/2026-05-launch-operations.md` — Tier A research report
- `project/research/2026-05-12-month-operational-playbook.md` — Tier B research report
- `project/research/2026-05-ai-content-compliance.md` — AI compliance report
- `project/research/2026-05-operational-risk-management.md` — risk management report
- `episodes/EDITORIAL_PLAYBOOK.md` PROD-05 (demonetization framing), PROD-06 (iteration timing)
- `project/RESEARCH_LOG.md` §§18, 20, 21
