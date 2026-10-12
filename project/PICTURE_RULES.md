# Pictures and clips: the rules, and what works

> One page. Read it before you write a prompt for, generate, edit or accept any picture, AI clip or synthetic voice. Started October 12, 2026.
>
> **Rules** are Tiger's and are binding. **What works** is what we have seen so far. Each line names its evidence, and none of it is a measured rate. When an experiment ends, add its result here in one line.

## Rules

1. **No facial parts, from any angle.** No eyes, eyebrows, eyelids or eye sockets. No nose, nostrils or nose ridge. No mouth, lips or teeth. No lines or holes inside the ear. A head in profile has no bump where a nose or lips would be. Shadows and reflections of heads follow the same rule. A plain filled outer-ear shape is fine.
2. **Bodies are anatomically coherent.** Shoulders, elbows, wrists, hands and legs connect believably. Each hand can be traced to its own arm. Every figure has support. In a prompt, write "not photorealistic" for the rendering and "anatomically coherent" for the body. Never write "no realistic anatomy".
3. **Richness in a head comes from painted planes, never from features.** The reference is `project/visual-identity/2026-10-10/context-tests/02c-desk-faceted-face.png`.
4. **No lettering inside a generated picture.** Type is set in Remotion.
5. **Nothing new goes into an episode, a skill or a pipeline document without Tiger's go-ahead.** A technique in the catalogue is an option, not a decision (D50 in [DECISIONS.md](DECISIONS.md)).
6. **State the expected spend before each paid round and the actual spend after.** An approval covers that round only.
7. **Keep failed attempts and mark their status.** A gallery shows everything that was tried, not only what worked.
8. **A synthetic voice is a timing aid only.** It never appears in an episode and is never presented as narration. Its files are named `SYNTHETIC-…`.

Rules 1, 2, 3 and 7 are recorded in the [visual-identity handoff](visual-identity/handoff-2026-10-11/parallax-visual-research-handoff.md), section 2.

**Rule 1 and episode 1.** The twelve `ai-care-motives` stills were made before the rule was written, and eleven of them breach it somewhere. Tiger's decision (October 12, 2026): fix only the heads that read as a face part, which is done, and apply the rule in full from the new look onward. Do not treat those stills as references for how a head should look. See [the audit](visual-identity/face-audit-2026-10-12/README.md).

## Not decided yet

- The palette of the new look: evening amber or daylight.
- The look itself. "Painted constructivism" is a direction under test, not the channel's identity. See the [critique](visual-identity/handoff-2026-10-11/critique-2026-10-11.md).

## What works

**Making and changing pictures**

1. To change one thing in a still, edit it and paste back only the changed region. Regenerating the whole picture gives a near match, never the same picture. Tool: `tools/ai-video/fal_edit.py composite`. (Toolbox reels 1 and 2.)
2. Correcting a head in words has not worked in three tries. Paste a reviewed head over the failing one, or repaint it. (Handoff section 12.)
3. Give each reference image one role in a single line, and upload only references in the look you want. (Roles: handoff section 11. Limiting the set is advice we have not tested yet.)
4. Pictures made from scratch on fal came out smoother and flatter than the ChatGPT stills. Make new pictures where the episode's stills were made. (`episodes/ai-care-motives/prompts/chatgpt-prompts-toolbox.md`.)
5. A style pass over a realistic pose render brings the realism with it: cloth folds, boot laces, a face that looks erased. (Critique section 1.)
6. Counts are unreliable. Three piers came back as four. Ask for small numbers, check them, and fix by edit. (Handoff section 13.)
7. Words such as "exact" and "do not redraw" lock in whatever is wrong. Protect a part only after it has passed review. (Handoff section 11.)

**People in action**

8. Design hand ownership into the costume: a cuff, a sleeve against skin, or two people in different values. The one two-person pull with traceable arms has a pale cuff on each dark sleeve. The rejected one has two bare forearms of the same colour. (Toolbox reel 5, 0:02; handoff section 11.)
9. For a pose with contact, a whole-body reference gave simpler grips than text alone, in two samples against two. (Handoff section 12.)

**AI video**

10. A clip is dependable when it is pinned between frames that are edits of one trusted picture. It is unreliable when it has to draw something new: it invents objects and gives blank faces features. (Toolbox, "Faults to fix before use".)
11. No turning head has passed rule 1 yet. With only the two ends pinned, the profile in between grew a nose. Do not plan a shot that needs one until a test with a pinned middle frame passes. (Handoff section 10; critique, experiment 1.)
12. Three pinned frames in one clip carried a whole action from pose to pose. (Toolbox reel 5, 0:02.)

**Reviewing**

13. Enlarge every head and every hand contact before accepting a picture with a person in it. At thumbnail size we passed a nose and a grip nobody could trace. `tools/qa/contact_sheet.sh --crop X,Y,W,H out.jpg in.png` enlarges a region, and the same script tiles pictures into a sheet. (Handoff section 10; critique section 9.)

## Before an experiment

Write four lines first, in the experiment's own folder.

1. The question, and the decision it feeds.
2. The one thing that varies. Everything else is held fixed.
3. What passes, in terms someone else could check.
4. The budget, and the rule we adopt if it fails.

When it ends, add one line under "What works" above.

**Status words.** Use these four and no others, so a file from one session means the same thing in the next.

- *Explored*: made and looked at.
- *Liked*: Tiger responded well. Not a decision.
- *Approved for use*: Tiger said it can go into an episode.
- *Rejected*: Tiger said no. It stays in the gallery, marked.

## Where the detail is

- The catalogue of about 70 techniques, with reels, prices and faults: [VISUAL_TOOLBOX.md](VISUAL_TOOLBOX.md).
- The look under development, what was tried and what Tiger rejected: the [handoff](visual-identity/handoff-2026-10-11/parallax-visual-research-handoff.md) and the [critique](visual-identity/handoff-2026-10-11/critique-2026-10-11.md).
- Prompt structure for stills and clips: [ASSET_GENERATION_REGISTER.md](ASSET_GENERATION_REGISTER.md).
- Labels for any exchange shown on screen: VIS-12 in [`episodes/EDITORIAL_PLAYBOOK.md`](../episodes/EDITORIAL_PLAYBOOK.md).
