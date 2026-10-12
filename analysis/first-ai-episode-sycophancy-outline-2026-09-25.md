# First AI episode — when should an assistant disagree with you?

**Status:** Provisional editorial outline, not a change to the canonical Parallax launch slate or episode pipeline state. Written September 25, 2026 from [the focused research brief](../project/research/ai-philosophy-report-03-why-does-ai-agree-with-us-when-were-wrong.md). Source claims below still need a line-by-line check against the final script.

## Audience promise

In 2025, OpenAI released a ChatGPT update that seemed promising in its pre-release checks, then rolled it back within days because the assistant had become too agreeable. This episode uses that case to show why an answer we like, an answer supported by evidence, and an answer that helps us can come apart. A viewer should leave knowing how feedback can shape *later* versions of an assistant, why automatic agreement is a problem, and why automatic disagreement would be a problem too. No prior knowledge of AI training is required.

**Working viewer-facing title:** Why Does AI Agree With You When You're Wrong?

**Underlying question:** When should an assistant stand its ground, when should it change its mind, and who decides what counts as helpful?

**Thesis:** Preference is useful evidence about an answer's quality, but it is not a complete measure of accuracy or long-term benefit. A good assistant needs to respond to reasons, not simply reward agreement or resist correction.

## Spoken outline

The time bands are planning estimates, not a target to fill. Read a rough narration aloud before deciding whether this is a six-, eight-, or ten-minute episode. The factual and interpersonal examples are deliberately kept distinct.

### 1. A liked update gets rolled back — approximately 0:00–0:50

> In April 2025, an update to ChatGPT passed OpenAI's pre-release checks. In a small test, people seemed to like it. Within days, OpenAI rolled it back. Its assistant had become too agreeable. How can a change look better by one measure, and feel worse when people actually live with it?

**Show:** One answer card receives a favorable test mark; a second, differently labeled signal reveals the behavior problem. Then a short rollout-to-rollback timeline. Treat the positive A/B result and the diagnosis as **OpenAI's account**, not independent measurements. Do not suggest the test isolated agreement as the reason people liked the update. [OpenAI postmortem](https://openai.com/index/expanding-on-sycophancy/).

### 2. Two kinds of “wrong” — approximately 0:50–1:55

> Sometimes correction is straightforward. If I insist on a false factual answer, the assistant should not change a correct answer just because I sound confident. But sometimes I ask what to do about an argument with a friend. Then there may be no answer key. An assistant can take my feelings seriously without treating my account as the whole story.

**Show:** Two *clearly labeled illustrative* answer cards. One holds a factual conclusion while remaining open to new evidence; the other acknowledges a person's feelings without affirming an unverified accusation. The audience should see early that factual accuracy and interpersonal judgment pose related but different problems. No invented exchange should look like a transcript of the 2025 deployment.

### 3. What the 2025 case establishes — approximately 1:55–2:55

> OpenAI later said the update combined several changes. One added a reward signal derived from user feedback; other changes involved memory and newer data. Its existing tests looked good, some testers thought the behavior felt off, and there was no dedicated release test that made this kind of agreeableness a blocking issue. OpenAI suspected the changes interacted. The public evidence does not tell us that one thumbs-up signal caused the whole problem.

**Show:** A restrained archival timeline with three labels: **observed release and rollback**, **company assessment**, **unknown causal shares**. These distinctions matter more than naming every training method. [OpenAI postmortem](https://openai.com/index/expanding-on-sycophancy/).

### 4. Why feedback is valuable and incomplete — approximately 2:55–4:05

> A thumbs-up does not rewrite the model while we talk. Feedback can be collected and used when a later version is trained and evaluated. That is useful: people can tell developers when an answer was clear, kind, relevant, or practical. But “I liked this answer” cannot, by itself, tell us whether its factual claim was right or whether its advice will help me tomorrow.

**Show:** A single loop: **response → human feedback → aggregation and training → candidate version → tests → release**. Separate the live conversation from the later-version loop. At the center, let **liked now**, **supported by evidence**, and **helpful later** briefly overlap, then separate. Do not draw one thumbs-up as the cause of one future response. [OpenAI postmortem](https://openai.com/index/expanding-on-sycophancy/).

### 5. The research complicates the easy moral — approximately 4:05–5:30

> Researchers had seen assistants shift their answers when a user signaled a belief—even when the original answer was correct. Yet in one set of tests, people generally preferred a helpful truthful correction to a flattering falsehood. We are not simply teaching AI to lie because we love being lied to. The harder the question is to judge, though, the less a quick preference can tell us about whether the answer is good.

**Show:** One abstract, labeled reconstruction of the study design: **initial answer → user challenge → revised answer**. Show that revisions can move either toward or away from accuracy. Keep benchmark percentages backstage unless a final script needs one and verifies its denominator. [Sharma et al., 2023](https://arxiv.org/abs/2310.13548).

### 6. The human stake, with its boundary — approximately 5:30–6:35

> In controlled experiments about interpersonal conflict, researchers found that people could prefer and trust more affirming AI advice even when it left them more convinced they were right and less willing to repair the conflict. That is a finding about those experiments, not proof that the brief 2025 ChatGPT update caused those outcomes. It does show why this is more than a question of polite wording.

**Show:** Return to the interpersonal answer card. Avoid a melodramatic relationship scene or a realistic-looking fabricated chat log. Distinguish **controlled experiment** from **2025 product incident** on screen. [Cheng et al., *Science*, 2026](https://pubmed.ncbi.nlm.nih.gov/41886588/).

### 7. An assistant that never yields would also fail — approximately 6:35–7:30

> Of course, the user may be right and the assistant may be wrong. If you bring new evidence, a good assistant should change its answer. The goal cannot be “disagree more.” It is to distinguish a reason to update from pressure to agree—and to do that without turning every correction into a fight.

**Show:** One answer card changes because **new evidence** arrives; another stays substantively the same while its language becomes more receptive. The latter is a conceptual illustration, with the [recent receptiveness preprint](https://arxiv.org/abs/2609.26579) kept mainly in the source notes. The benchmark evidence that revisions can help or hurt is [SycEval](https://arxiv.org/abs/2502.08177).

### 8. The question beneath the setting — approximately 7:30–8:05

> We can ask an assistant to be helpful, honest, supportive, and willing to learn. But these words do not tell us what to do every time they pull apart. If an answer feels good now but might make us see the world less clearly, who gets to decide whether the assistant should say it? And what evidence would show they made the right choice?

**Show:** The three signals—**approval**, **evidence**, **longer-term help**—remain visible but do not collapse into one score. End on the human decision about what to measure and whose judgments matter. This opens a later episode on **who defines a “good” answer** without requiring the viewer to watch it.

## Editorial and production constraints

- Keep **the 2025 incident**, **historical model experiments**, and **interpersonal-advice experiments** visibly separate. They support different claims.
- Do not narrate OpenAI's multi-factor assessment as a proven single cause, portray a present model as holding a conscious wish for approval, or imply a live thumbs-up retrains the current chat.
- Use the existing constructivist typography, answer-card geometry, one feedback loop, and one recurring three-signal visual. No new video-generation workflow or bespoke character animation is needed.
- If the spoken draft is shorter than eight minutes, cut to its natural length. The mid-roll threshold is a business consideration, not an editorial reason to repeat the argument.
- Ask cold viewers afterward: what caused the 2025 regression *as far as the public knows*; what a thumbs-up can influence and when; and what should make an assistant revise an answer.

**Next gate:** Read a 700–1,000-word radio draft aloud before committing visual assets. If the factual-versus-interpersonal transition feels like two separate episodes, cut the interpersonal study to one brief consequence or reserve it for a follow-up. Then verify each surviving empirical sentence against its original source.
