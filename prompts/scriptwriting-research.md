# Scriptwriting Research Prompt — Paste into Claude.ai Research Mode

*Enable Research Mode (blue button, bottom-left) before pasting.*

---

I'm building an AI-assisted scriptwriting workflow for a bilingual (English/Chinese) analytical video essay channel. The channel uses historical analogy and philosophical frameworks (game theory, complex systems, Stoicism, Bayesian epistemology) to analyze geopolitics — think CaspianReport's depth meets Kurzgesagt's accessibility, with a distinctive narrator voice.

The core challenge: I want AI to produce scripts that are 80-90% usable for human narration — structurally sound, tonally distinctive, and written for the *ear* rather than the *eye* — so my editing pass is about fine-tuning rather than rewriting. I need to understand what's actually possible, what workflows top creators use, and what specific techniques produce narrated-quality output.

## 1. How Top Analytical/Educational Channels Actually Use AI

Research how the following types of channels use AI in their scriptwriting (if publicly documented). I want specifics — not "they use ChatGPT" but *how* they integrate it into their workflow:

- **Analytical geopolitics channels**: CaspianReport, VisualPolitik, PolyMatter, RealLifeLore, Wendover Productions, TLDR News
- **History/essay channels**: Kraut, Kings and Generals, Historia Civilis, Fall of Civilizations
- **Science/explainer channels**: Kurzgesagt, Veritasium, 3Blue1Brown, Primer
- **Philosophy/ideas channels**: Pursuit of Wonder, Einzelgänger, Academy of Ideas
- **Chinese-language analytical channels** on Bilibili: 观视频工作室, 半佛仙人, 回形针PaperClip (if still active), 所长林超

For each channel where information is available:
- Do they use AI at all? If so, at which stage? (research, outline, first draft, editing, localization)
- What do they say publicly about AI in their workflow?
- What's their scripting process regardless of AI? (How do they go from research to final narration script?)

## 2. The "Written for Speaking" Problem

This is the central technical challenge. AI defaults to *written* prose. Narration requires *spoken* prose. Research:

- **What are the specific linguistic differences** between text meant to be read and text meant to be narrated? (Sentence length, rhythm, information density, use of questions, paragraph structure, transitions)
- **How do professional scriptwriters for documentary and video essays structure narration differently from articles?** Look for craft guides, interviews with documentary writers, or educational content about voiceover writing.
- **What does the research say about "oral vs. literate" modes of communication?** (Walter Ong's work on orality and literacy may be relevant — how oral cultures structure argument vs. literate ones)
- **Are there specific prompting techniques** that reliably shift LLM output from "written" to "spoken" register? Look for experiments, blog posts from creators, or academic/technical writing on this.

## 3. Voice and Personality in AI Output

The biggest complaint about AI scripts is they sound generic. Research:

- **What specific techniques do creators use to make AI output match their personal voice?** Look for detailed case studies, not just "add your personality." I want specifics: Do they provide writing samples? Style guides? Anti-pattern lists? Persona descriptions?
- **The "style guide" approach**: How detailed does a voice/style document need to be for AI to reliably reproduce a distinctive voice? What should it contain? Are there examples of effective ones shared publicly?
- **The "few-shot example" approach**: How many writing samples does an LLM need to credibly mimic a voice? What's the diminishing returns curve? Do 3 examples work nearly as well as 10?
- **Claude Projects and system prompts**: Are there documented workflows where creators use Claude's Projects feature (persistent context) to maintain voice consistency across multiple scripts?

## 4. The Bilingual Challenge

Our channel produces content in both English and Chinese. This isn't translation — it's adaptation. Research:

- **How do bilingual content creators handle scripting in two languages?** Do they write in one language and adapt, or script independently for each?
- **What are the specific challenges of AI-assisted localization** for analytical/educational content? (Not just vocabulary — rhetorical structure, audience expectations, cultural references, humor)
- **Chinese video essay conventions**: How does the scripting style for successful Chinese analytical content (Bilibili) differ from English YouTube conventions? Pacing, argument structure, use of literary references, formality level?
- **Can AI reliably adapt (not translate) a script from one cultural-linguistic context to another?** What are the current limitations? What works, what needs human intervention?

## 5. The Editing Protocol

If AI produces an 80-90% draft, what does the human 10-20% look like?

- **What do experienced creators say they always have to fix** in AI-generated scripts? Are there consistent patterns?
- **How long does the human editing pass take** relative to writing from scratch? What's the actual time savings reported by creators?
- **Is there a documented "editing checklist" or protocol** that creators use for polishing AI scripts for narration? (Read-aloud test, personality injection points, pacing checks, etc.)
- **The authenticity question**: Do audiences notice or care if scripts are AI-assisted? Is there research or creator testimony on audience reception? Does disclosure matter?

## 6. Prompt Engineering for Narration Scripts Specifically

I want to build a reusable prompt template for our channel. Research:

- **What are the most effective prompt structures for generating video essay scripts?** (Not marketing copy or blog posts — specifically narrated analytical content)
- **What role do "negative constraints" play?** (e.g., "never use the phrase 'in today's world'", "avoid rhetorical questions in the first 30 seconds", "don't use more than two adjectives per sentence")
- **How should the prompt handle pacing and structure?** Should it specify beat-by-beat timing, or let the AI determine flow?
- **What about emotional arc?** Can you prompt for genuine intellectual tension, moments of surprise, and epistemic humility — or do those always need to be human-injected?
- **Are there specific differences between prompting ChatGPT vs. Claude for scriptwriting?** Any evidence that one produces more natural-sounding narration than the other?

## 7. Emerging Techniques and Tools (2025-2026)

- **Are there specialized AI tools for video script writing** that go beyond general-purpose LLMs? (e.g., tools that understand pacing, retention curves, visual cues)
- **Voice cloning and script optimization**: Are creators using AI voice tools to test how scripts *sound* before recording? How does this change the writing process?
- **Feedback loops**: Are there creators who feed analytics data (retention curves, drop-off points) back into their AI prompting to improve future scripts?
- **What's the state of the art** as of early 2026? What's possible now that wasn't possible a year ago?

Please provide citations for all claims, tools mentioned, creator testimonials, and research findings. I need to verify everything and trace it back to its source.
