---
description: Run the 8-lens script audit on a production script
argument-hint: <path-to-script>
---

Audit the script at `$1` using the `script-reviewer` subagent. The 8 lenses are defined in `skills/script-audit/SKILL.md`:

1. **Decoder posture** — analytical lens, not lecture
2. **Connection density** — cross-domain analogies per beat
3. **Pacing variance** — `PACE:` annotations distributed across analytical/urgent/breathing
4. **Visual layer integration** — every visual mode tag (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`) is purposeful
5. **Register pacing** — Analytical/Atmospheric/Grounding balance per `project/VISUAL_LANGUAGE.md`
6. **Direction checks** — `DIR:` annotations follow `project/DIRECTING_LANGUAGE.md` (cam/reveal/hold/cut/mood)
7. **Toxin line** — script avoids the patterns flagged in `project/JIANG_NARRATIVE_RESEARCH.md` NAR-13
8. **Speculation budget** — predictions tagged with falsification criteria per the speculation pipeline

Reference `episodes/EDITORIAL_PLAYBOOK.md` for current channel-level rules; report any newly flagged candidate rules at the end.

Output a verdict (READY / CONDITIONAL / NEEDS REVISION) with specific line references.
