# Visual toolbox: what a generated still can do, and which script calls for it

> **Status: exploration catalogue, 11 October 2026. Nothing here is wired into an episode, a skill or a pipeline document yet.** Every entry has been seen once on the `ai-care-motives` art, in one take. "First read" is Claude's observation from making it.
>
> **Tiger's verdict, 11 October 2026: keep all of these as options; some need polish.** He has not yet said which. The per-row "Verdict" column stays open for anything he later wants to drop or rank. Known faults are listed under "Faults to fix before use".
>
> Watch before reading: three test reels in `remotion-templates/out/ai-care-motives/` — `stills-test-reel.mp4` (R1), `stills-test-reel-2.mp4` (R2), `stills-test-reel-3.mp4` (R3). Timestamps below point into them. Background research: [`reports/AI stills beyond Ken Burns.md`](../reports/AI%20stills%20beyond%20Ken%20Burns.md).

## The idea

Until now a generated still did one thing: sit under the narration with a slow push. The reels show about thirty other things it can do. They sort into six families by **what changes on screen**, and that is the question to ask of any script row: *what is this sentence doing, and which of the six should change to show it?*

| Family | What changes | Techniques |
|---|---|---|
| **A. The frame** | The camera, over one unchanged picture | Slow push or pull · framed details · panorama travel · rack focus · push-through · AI camera arc |
| **B. The picture** | The picture itself, between registered states | State swap · pose swap · pose-to-pose · relight · accumulation build · wipe slider · colour isolation · AI in-between · AI transition |
| **C. Part of the picture** | One region moves; the rest holds | Video inside a still · loop · lit screen · layered depth · cut-out move · line boil · depth-map parallax |
| **D. The layout** | Several pictures share the frame | Two-up · four-panel build · triptych · strip recap · video in one panel · spot illustrations as diagram nodes · unit chart from the figure |
| **E. The sequence** | Pictures follow each other | Rapid-cut montage · matched cut · match dissolve · a cut inside an AI clip |
| **F. Drawing on it** | Code draws on or into the picture | Marks on the picture · spotlight · labels and connectors · type behind the figures · type on a surface |

Two words used throughout:

- **Registered** means two pictures that are pixel-identical except where a change was asked for. They are made by editing a still and pasting only the changed area back (`tools/ai-video/fal_edit.py`). Everything in family B depends on this.
- **Cut-out** means a figure separated from its background with a mask, over a clean plate of the background. Most of family C and half of F depend on this.

## From script to picture

Read down the left column for what the narration is doing. Examples are lines from `ai-care-motives`.

| The sentence is… | Example | Reach for first | Also works | What it asks of the script |
|---|---|---|---|---|
| Naming parts of one scene in turn | "When a lab says a model behaves well, that's a test result. And researchers have found…" | **Framed details** (R1 0:02) | Marks and spotlight (R2 0:06) | Two to five sentences that each point at something already in the picture, in an order a camera can follow |
| Listing items quickly | "The startup. The essay. The plan you haven't told anyone yet." | **Rapid-cut montage** (R3 0:02) | Type on a surface (R2 1:12) | Short parallel items; the last one longer, so its picture can hold |
| Listing the actors in a place | "Other customers compare notes. Neighbors talk. A competitor would love the story." | **Panorama travel with labels** (R2 0:24) | Spot illustrations as nodes (R3 1:40) | One place, named actors, in the order the travel will pass them |
| Giving two versions of one act | "In the first, he thinks cheating a child is wrong… In the second, he's careful." | **Two-up with a pose difference** (R1 0:37) | Four-panel build when a second variable arrives (R1 1:02) | A visible difference between the versions (where he looks), not only a different caption |
| Taking one thing away, or changing one thing | "Take away the watching." | **State swap** (R1 0:25) | Wipe slider (R3 1:17) · video inside the still (R2 1:23) | The change stated as its own short sentence, so the swap has a word to land on |
| Describing something that happens | "A stranger pulls you out of the river." | **Pose-to-pose** (R2 1:44) | AI in-between of two poses (R3 2:15) | Verbs in sequence; one picture per verb |
| Bringing people or things in | "Start with its training. People compare its answers…" | **Accumulation build** (R2 0:02) | Unit chart from the figure (R3 0:56) | A sentence on which the group arrives |
| Giving a count or a share | "About fourteen percent of the time… and almost never…" | **Unit chart from the figure** (R3 0:56) | Marks on the picture (R2 0:06) | The number in its own clause; both sides of a comparison stated |
| Saying who checks or shapes whom | "Your doctor has a licensing board… Your bank gets examined by regulators." | **Spot illustrations as nodes** (R3 1:40) | Labels and connectors on a picture (R2 0:37) | Parallel pairs |
| Drawing an analogy across cases | "Here's a real case." / "Now return to the machine." | **Matched cut** (R2 0:46) | Match dissolve (R3 2:05) · triptych (R2 0:54) | A returning phrase at each seam; the cases introduced in the same order each time |
| Letting time pass in one place | The desk at night, then at dawn | **Relight** (R2 1:58) | — | A reason to come back to the same place |
| Moving attention from a thing to a person | "And you're about to act on it." | **Rack focus** (R3 0:13) | Framed details | A sentence that turns to the person |
| Naming the idea | "I call that question the Unwatched Test." | **Type behind the figures** (R3 0:22) | Title card (existing) | The name spoken once, cleanly |
| Recapping | "Here's where we are. The help is real…" | **Strip recap** (R3 1:26) | List card (existing) | Each claim tied to a picture the viewer has already seen |
| Leaving a question open | "What happens to the behavior?" | **A slow push on one still.** This is where it earns its place | Colour isolation (R3 0:47) · loop (R3 2:30) | Silence after the question |
| Entering or returning to a place | "Picture the street." / "Go back to the shop." | A cut | Push-through (R3 1:08), which the transition grammar currently rules out | — |
| Opening a scene | "You've probably asked an AI whether your idea is good." | **Layered depth with a lit screen** (R2 1:12) | AI camera arc (R3 2:42) | — |

The row to notice is the open question. A long hold on one picture is still right when the narration wants the viewer to think; the fault in the episode is using it for every other kind of sentence as well.

## What a script can do to set these up

Most techniques are cheap only if the script and the first pictures were written with them in mind.

1. **Return to places.** A place the script visits three times (the shop, the desk) needs one picture and then one edit per visit. A new place needs a new picture and a new style risk every time.
2. **State the change as its own sentence.** "Take away the watching." gives a swap a word to land on. A change buried mid-sentence does not.
3. **Name what is in the picture.** Framed details need sentences that point at things: the cards, the figure, the rater. Abstract sentences leave the camera nowhere to go.
4. **Keep lists parallel and short.** Three items of two or three words cut as a montage; three long clauses do not.
5. **Give analogies a returning phrase and a fixed order.** The matched cut and the triptych both need the cases to line up.
6. **Put the number in its own clause** and state both sides, so a unit chart can count one, then the other.

## What to ask for when making the pictures

1. **Reusable surfaces.** Blank cards, a blank screen, a bare wall and a window are places code can draw on or change later. The rating-cards still and the desk still were the most productive pictures in the tests because they have them.
2. **Clear silhouettes on a flat ground.** Ten figures against a plain wall separated cleanly with one mask; that made the build-up, the lean, the boil, the colour isolation, type behind the figures and the unit chart possible from one picture.
3. **States by edit, never by a second generation.** Edit the original and paste back only the changed area; crop the 4K still before sending so the edit comes back at the still's own sharpness.
4. **Matched compositions by anchor.** Give the model the first still and ask for the same camera, window and light with the subject replaced.
5. **Compose for the layout.** A triptych wants tall pictures and a four-panel build wants the difference large; stills drawn for full frame end up small in panels.
6. **Wide pictures with separated groups.** A 4:1 street with "four clearly separated groups, empty pavement between them" came back usable in one take.

## Catalogue

Cost is generation cost per use on fal at October 2026 prices; code and stills already made are free. "Made with" names the piece of code in `remotion-templates/src/experiments/` (`StillsReel.tsx`, `StillsReel2.tsx`, `StillsReel3.tsx`); all of it is test code.

### A. The frame changes

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Slow push, pull or pan | Throughout | One still | $0 | Right for a held question; wrong as the default | |
| Framed details | R1 0:02–0:22 | A still with several things worth naming; 4K copy for close framings | $0 | Strongest single change; five shots where there was one | |
| Panorama travel | R2 0:24–0:44 | One 4:1 picture with separated groups | $0.16 | Distinctive. The wide picture came out flatter than the house stills. Travel must stay near 13 px a frame or it strobes | |
| Rack focus | R3 0:13–0:20 | A still split into two planes | $0.05 (the layer split) | Reads clearly and quietly | |
| Push-through | R3 1:08–1:15 | A window or door in one still; a second picture to land on | $0 | The middle second is a muddle of two pictures. The transition grammar rules zoom moves out | |
| AI camera arc | R3 2:42–2:48 | One still | $0.48 | The model moved the camera around the figure and kept the texture of the suit and the wood, which the May tests said it could not. As the face came into view it gained a nose, a brow and a mouth, and the model invented a door and a notebook | |

### B. The picture changes

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| State swap (soft) | R1 0:25–0:31 | Two registered states | $0.08–0.12 per state | Clean with a plain 0.4 s cross-fade | |
| Pose swap | R1 0:11–0:13 | One edited pose, same framing | $0.12 | A hard pop. Clean when only a head moves | |
| Pose-to-pose | R2 1:44–1:56 | Two to four poses of one scene | $0.12 per pose | Reads as an event. Larger pose changes also shift the rest of the body | |
| Relight | R2 1:58–2:07 | The same frame in two lights | $0 here (the two desk stills already line up); otherwise one edit | Free and effective | |
| Accumulation build | R2 0:02–0:06 | A clean plate and cut-out figures | $0.12 plus a mask | Clean. One mask separated ten figures | |
| Wipe slider | R3 1:17–1:24 | Two registered states | $0 | Reads as a comparison tool; more "interface" than the soft swap | |
| Colour isolation | R3 0:47–0:54 | Cut-outs | $0 | Clear on this picture because the wall is one saturated colour | |
| AI in-between of two poses | R3 2:15–2:21 | Two registered poses as first and last frame | $0.48 | Moves, and lands on the last frame, but the swimmer dips under on the way | |
| AI transition between matched stills | R3 2:23–2:29 | Two matched compositions | $0.48 | The in-between is strange: the shopkeeper ends up sitting in the car. A cut or a dissolve between the same two pictures is better | |

### C. Part of the picture moves

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Video inside a still | R2 1:23–1:33 | A clip of the scene and the sharp still; the moving area bounded by something dark (a window frame) | $0 with an existing clip, else $0.48 | No visible seam; sharper than the clip played full frame | |
| Loop (first frame = last frame) | R3 2:30–2:40 | One still | $0.48 | The water moves and the picture returns to its start; check the join at five seconds | |
| Lit screen | R2 1:12–1:21 | The screen's four corners | $0 | Subtle; no video model | |
| Layered depth | R2 1:12–1:21 | A still split into planes | $0.05 | Works and is subtle. Both planes must scale about the point where they touch (hands on keys) | |
| Cut-out move | R3 0:31–0:38 | Cut-outs | $0 | Figures lean as rigid pieces. Rejected once in September; shown again with clean cut-outs | |
| Line boil | R3 0:40–0:45 | Cut-outs | $0 | The figures shimmer while the wall holds | |
| Depth-map parallax | R3 1:58–2:03 | A depth map | about $0 | For comparison. The automatic effect the project blacklisted | |

### D. Several pictures at once

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Two-up with a pose difference | R1 0:37–1:02 | Two states of one still | $0.12 | The two panes now differ by picture, not caption | |
| Four-panel build | R1 1:02–1:10 | Four states | $0.12–0.24 | Reads as a grid; the difference between rows is small at phone size | |
| Triptych | R2 0:54–1:09 | Three matched pictures | $0.24 and up | Panels are small unless the pictures are drawn tall | |
| Strip recap | R3 1:26–1:38 | Pictures the viewer has already seen | $0 | Earlier pictures stay on screen as the claims add up | |
| Video in one panel | R2 1:33–1:41 | A clip and a panel layout | $0 | One moving panel among three still ones | |
| Spot illustrations as diagram nodes | R3 1:40–1:57 | One generated sheet of small drawings | $0.12 for six | The sheet came back usable in one take; the diagram now lives in the illustrated world | |
| Unit chart from the figure | R3 0:56–1:07 | One cut-out figure | $0 | A statistic counted in the episode's own character | |

### E. Pictures in sequence

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Rapid-cut montage | R3 0:02–0:11 | One new picture per item | $0.12 each | Works at about a second per picture. New pictures came out smoother than the house stills | |
| Matched cut | R2 0:46–0:54 | Pictures drawn to one composition | $0.12 each | The layout matches. The car picture is greyer than the shop; the first take stood the car on the counter | |
| Match dissolve | R3 2:05–2:13 | The same matched pictures | $0 | Softer than the cut; shows the shared layout for longer | |
| A cut inside an AI clip | R3 2:49–2:55 | One still | $0.48 | The model cut to a close-up it drew itself, in style. The turned face gained features | |

### F. Code draws on the picture

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Marks on the picture | R2 0:06–0:12 | A blank surface in the still, measured once | $0 | Ticks sit on the cards without nudging. Use the text-safe gold, not gold, on cream | |
| Spotlight | R2 0:12–0:21 | Nothing | $0 | Isolates two figures in a row of ten | |
| Labels and connectors | R2 0:24–0:44 | Points on the picture | $0 | Labels ride with the travel. Connectors read on a dark band, not across the picture | |
| Type behind the figures | R3 0:22–0:29 | A clean plate and cut-outs | $0 | The title sits on the wall with heads in front of it | |
| Type on a surface | R2 1:12–1:21 | The surface's four corners | $0 | Bars "typed" in the plane of the laptop screen | |

## Faults to fix before use

From the first reads above. "Kind" says what the fix needs: code only, a new picture, a new edit, or a new clip. Rows marked **Fixed** were done in the first polish pass on 11 October and can be watched in `stills-test-polish.mp4` (P), which shows only the changed sections. The AI clip retakes are in `stills-test-retakes.mp4` (T), first take beside retake.

| Technique | Fault seen | Fix | Kind |
|---|---|---|---|
| Panorama travel · rapid-cut montage · matched cut (the car) | The new pictures are smoother and flatter than the house stills, and the car picture is greyer than the shop | Make from-scratch pictures where the house stills were made (ChatGPT, with the style block and reference images). Prompts are written: `episodes/ai-care-motives/prompts/chatgpt-prompts-toolbox.md` | New pictures (open) |
| Four-panel build | The difference between the watched and unwatched rows is small at phone size | Draw the shop with the street closer and larger in the window (shot 4 in the same prompts file) | New picture (open) |
| Triptych | Panels are small in the frame | **Fixed (P 0:37).** Each case is now two larger details in a three-by-two grid: the watchers above, the one watched below; the watchers vanish from the top row | Code |
| Pose-to-pose | The rescuer's body shifts between the grasp and the pull | **Fixed (P 0:58).** New edit in which only the man in the water changes | New edit, $0.12 |
| Pose swap | A hard pop when it happens in the same framing | **Fixed (P 0:02).** The turned head now arrives on a cut to a closer framing | Code |
| State swap (the empty street) | The pasted street is slightly softer than the window around it in close framings | **Fixed (P 0:25).** Redone from a crop of the 4K still. The new edit tinted one building green, so the result takes its colour from the first edit and its fine detail from the new one | New edit, $0.08 |
| Push-through | The two pictures overlap in a muddle for about a second | **Fixed (P 1:13).** The camera goes through one clear pane, blurring as it goes, and the two pictures share the screen for five frames | Code |
| AI in-between of two poses | The swimmer dips under before coming up | **Fixed (T 0:02).** Retake stating that his head and shoulders stay above the water the whole time, pinned to the corrected last frame | New clip, $0.48 |
| A cut inside an AI clip | The close-up the model draws gives the blank face a nose and mouth | **Fixed by changing the method (T 0:11).** Telling the model the face stays blank did not work (second take, same fault). What works: make the cut in Remotion, to a clip pinned between two of the episode's own stills cropped to the close framing | Two new clips, $0.96 |
| AI camera arc | The model invents things as the camera moves: a door and a notebook, and features on the face | **Not fixed (T 0:21).** Two retakes moving behind the figure hid his face, but both put a face in the dark window, the second after being told the windows stay empty. Three takes, three inventions. Layered depth (R2 1:12) gives a controlled version of the same shot | Two new clips, $0.96 |
| Any head that turns (pose swap · the moving close-up · AI camera arc · a cut inside an AI clip) | A head in profile shows a nose-like protrusion. This is true of the edited head turn, of the last frame the "fixed" close-up is pinned to, and of several raters in the original still | Not fixed. Tiger's face rule, recorded in the visual-identity handoff (`project/visual-identity/handoff-2026-10-11/`, section 2), allows no facial parts from any angle, profiles included. The toolbox tests judged these heads against the existing stills, not against that rule. Needs a profile treatment that passes before any turning head is used | New pictures (open) |
| AI transition between matched stills | The in-between is strange by nature | None found; prefer a cut or a dissolve | — |
| Depth-map parallax | Shown for comparison only | None | — |

## Tools and prices used

| Job | Tool | Price | Note |
|---|---|---:|---|
| Edit one thing in a still | `fal-ai/nano-banana-2/edit` through `tools/ai-video/fal_edit.py` | $0.08 at 1K, $0.12 at 2K, $0.16 at 4K | Registered on the first take in every test |
| New picture in the house style | The same endpoint, with a house still as reference | as above | Layout obeys; texture comes out smoother than the ChatGPT stills |
| Very wide picture | The same endpoint at 4:1 | $0.16 | 8256×2048 |
| Split a still into layers | `fal-ai/qwen-image-layered` | $0.05 | Right split, but 864×480; use its outlines over the original |
| Cut figures out | `fal-ai/birefnet/v2` | about $0 | Wants clear silhouettes |
| Depth map | `fal-ai/image-preprocessors/depth-anything/v2` | about $0 | For the comparison only |
| Five-second clip from a still | MiniMax H3 Max through `tools/ai-video/fal_i2v.py` | $0.48 at 1080p (a promotional rate until 15 October 2026) | Accepts a pinned last frame and a "CUT" between two shots |

Spend across all three reels: about $4.20. The first polish pass added $0.20 and the five retake clips $2.40.

## Not yet seen

- Any video model other than MiniMax H3 Max.
- More than two pinned frames in one clip.
- Type set in perspective on a wall or sign (the tests set type flat on a wall and in perspective on a screen).
- A hand-drawn, scribbled annotation style.
- A cutaway or "see inside" state.
- Every technique above with recorded narration: all cuts here follow a word-count estimate.

## Where this stands in the engine

On 11 October the episode player began drawing stills in Remotion with a framing per use (`src/components/StillFrame.tsx`, by the other session), so slow moves and framed details no longer need a baked clip. Everything else in this file exists only as test code in `src/experiments/`.

## Round 4: six more kinds of move

> Added 11 October 2026 from a fourth reel, `remotion-templates/out/ai-care-motives/stills-test-reel-4.mp4` (R4, 3 min 58 s; composition `stills-reel-4-ai-care`, code in `src/experiments/StillsReel4.tsx`). Same status as everything above: one take each, nothing wired into an episode, verdicts open. Spend on this round: about $3.74, which brings the exploration to about $7.95.

The first three reels kept one camera angle per scene and pictures that show what the narration says. This round looks at the kinds that were missing. It adds six families to the six above, and it covers three items from "Not yet seen": other video models, a scribbled annotation style, and a see-inside state.

| Family | What changes | Techniques |
|---|---|---|
| **G. The angle** | Where the camera stands in the same scene | Reverse angle · insert · plan view with sightlines |
| **H. The meaning** | The picture stops being literal | The shadow does something else · giant watchers · x-ray · sketch to colour · double exposure · onion skin |
| **I. The sheet** | One generation yields a whole sequence | Storyboard sheet |
| **J. The world** | One picture contains the next | Into the screen |
| **K. The hand** | Motion and marks that look made by hand | Card flip · stepped time · scribble · paper theatre · picture through type · multiply · passing light · light-lapse · stepped walk from edits · AI clip, stepped |
| **L. The machine** | A different model does the work | Three video models on one shot · morph without a video model · stock footage restyled · a figure animated on green |

### More rows for "From script to picture"

| The sentence is… | Example | Reach for first | Also works | What it asks of the script |
|---|---|---|---|---|
| Turning to the viewer | "Notice whether you do." | **Reverse angle** (R4 0:05) | — | A line addressed to "you" while someone in the scene is being judged |
| Pointing at something too small for the wide | "The child was treated no worse." | **Insert** (R4 0:08) | Framed details, if the still resolves it | A concrete object named in the sentence |
| Saying who can see whom | "It was a fact about his street." | **Plan view with sightlines** (R4 0:16) | Labels and connectors | A scene with watchers and a watched |
| Naming what something really is | "Something you admired just turned into arithmetic." | **The shadow does something else** (R4 0:27) | Double exposure (R4 1:02) | A sentence that re-describes the same act |
| Saying how a situation feels | "Children have parents. Parents talk." | **Giant watchers** (R4 0:35) | — | A pressure the character feels and the viewer should too |
| Revealing a hidden mechanism | "Software designed to recognize an official test." | **X-ray** (R4 0:45) | Spotlight | The hidden part named as a thing |
| Starting a scene | "A child walks into a shop to buy bread." | **Sketch to colour** (R4 0:54) | Layered depth | — |
| Compressing an action into one picture | "A stranger pulls you out of the river." | **Onion skin** (R4 1:10) | Pose-to-pose | Verbs in sequence |
| Telling a short story inside the argument | "A shepherd finds a ring. Turn it, and you vanish." | **Storyboard sheet** (R4 1:20) | Pose-to-pose | Four to six beats, each one picture |
| Entering an example | "It starts with a shopkeeper." | **Into the screen** (R4 1:39) | A cut | A line that hands over to the example |
| Showing judging as it happens | "People compare its answers and pick the better ones." | **Card flip** (R4 1:49) | Marks on the picture | — |
| Using real footage | "The testers were real. The tests were real." | **Stock footage restyled** (R4 3:41) | The footage as it is, kept as a separate register | A decision on whether real footage should look real |
| Having someone cross a place | — | **A figure animated on green** (R4 3:53) | Video inside a still | — |

### G. The angle changes

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Reverse angle | R4 0:05–0:08 | One new picture, with the first still as reference | $0.12 | Came back right in one take: the street side of the same window, watchers in the foreground. It makes the viewer one of the watchers | |
| Insert | R4 0:08–0:11 | One new picture | $0.12 | A coin between two hands, in style. Shows what no crop of the wide could | |
| Plan view with sightlines | R4 0:16–0:25 | One new picture from above; head positions measured once | $0.12 | The clearest picture of "watched" so far: three cones meet on the shopkeeper, then go | |

### H. The picture stops being literal

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| The shadow does something else | R4 0:27–0:33 | One edit; only the wall is pasted back | $0.12 | The shadow counts coins while he stands still. The edit also put coins on the counter, which were left out | |
| Giant watchers | R4 0:35–0:43 | One edit of the window | $0.08 | Three hatted giants fill the window. Strong, and far from the channel's usual literalness | |
| X-ray | R4 0:45–0:52 | One edit; a scan line in code | $0.12 | The chip glows inside a see-through car | |
| Sketch to colour | R4 0:54–1:00 | One edit to a line drawing | $0.12 | The line drawing sat on the original's edges, so the colour arrives without a jump | |
| Double exposure | R4 1:02–1:09 | Two registered states | $0 | Two heads on one body for three seconds. Reads as "two versions"; a little uncanny | |
| Onion skin | R4 1:10–1:18 | Registered poses | $0 | The earlier poses stay as ghosts. Busy where the figures overlap | |

### I. One sheet, many shots

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Storyboard sheet | R4 1:20–1:37 | One 4K generation of a six-panel grid; panels cropped by code | $0.16 | The most useful find of the round. Six panels, one consistent shepherd, the story exactly as asked, in one take. Each panel is 1648×1328, enough for a full-height picture. This is the cheap answer to keeping a character consistent across pictures | |

### J. One picture contains the next

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Into the screen | R4 1:39–1:48 | A screen (or window, or card) in one still, and the next still | $0 | The fix for the push-through: the destination is already on the screen, so there is no muddle. The screen swings up to face the camera as it fills the frame | |

### K. Handmade motion

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Card flip | R4 1:49–1:56 | Card rectangles and the card's colour, measured once | $0 | Cards turn over in place to show the marks | |
| Stepped time | R4 1:58–2:06 | Any cut-out motion | $0 | The same move every frame, then every fourth frame. Yours to judge which suits paper figures | |
| Scribble | R4 2:08–2:14 | Nothing | $0 | A wobbly loop and arrow, redrawn every fourth frame. The arrowhead is rough | |
| Paper theatre | R4 2:15–2:22 | A plate and cut-outs | $0 | The planes swing in real perspective, like a toy theatre | |
| Picture through type | R4 2:24–2:30 | One still | $0 | The street shows only inside the letters | |
| Multiply | R4 2:32–2:38 | One cut-out figure | $0 | One figure becomes rows of it. No line in this script calls for it yet | |
| Passing light | R4 2:40–2:46 | A still split into planes | $0 | A window-shaped light crosses the wall behind him | |
| Light-lapse | R4 2:48–2:58 | Two relighting edits | $0.24 | Noon, evening and night on one frame; the edits stayed registered | |
| Stepped walk from edits | R4 2:59–3:04 | Each picture edited from the one before | $0.32 | **Does not hold.** The figures change coat, count and position from step to step, and a tree appears | |
| AI clip, stepped | R4 3:06–3:13 | An existing clip | $0 | Held on every fifth frame, the clip moves like a drawing and its smoothness stops showing | |

### L. A different model does the work

| Technique | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---:|---|---|
| Three video models on one shot | R4 3:14–3:29 | One still, one prompt | $0.48 / $0.56 / $0.30 | The same camera-arc prompt. MiniMax H3 Max moved most, kept the texture, and invented a door, a notebook and a face. Kling 3.0 Pro moved as far with a smoother, flatter picture and a face that stayed nearly blank. Veo 3.1 Lite barely moved the camera and kept the picture almost untouched | |
| Morph without a video model | R4 3:31–3:40 | Two registered states | 2 to 18 cents | Frame interpolation turns the head in one second. FILM took 14 seconds and about 2 cents; RIFE took over two minutes and about 18 cents for a similar result | |
| Stock footage restyled | R4 3:41–3:51 | A stock clip and one house picture as reference | $0.84 for 5 s | Kling's video-edit model redrew the dynamometer clip as paper craft, keeping the camera and the motion. It is rounder and more three-dimensional than the flat house style, but far closer to it than the footage was | |
| A figure animated on green | R4 3:53–3:58 | One cut-out figure on a green ground | $0.24 | The figure walks in place with a believable stride and keys cleanly; code moves him along the street. His speed across the picture has to be matched to his stride by eye | |

### What this round says about the tools

- **A sheet beats a chain.** Asking for six panels in one picture kept the character consistent. Editing one picture into the next three times did not.
- **A second picture from a reference works.** The reverse angle, the insert and the plan view each came back usable in one take from the same instruction: this still as the style reference, the camera somewhere else.
- **Video models differ in kind, not only in quality.** On the same prompt one moves a lot and invents, one moves and smooths, one hardly moves. Pick the model for the shot.
- **Restyling real footage is now possible for under a dollar.** It was not on the list of options before.
- **Stepping hides the machine.** An AI clip held on every fifth frame reads as drawn.
- New endpoints used: `fal-ai/kling-video/v3/pro/image-to-video` ($0.112/s), `fal-ai/veo3.1/lite/image-to-video` ($0.05/s at 1080p without audio), `fal-ai/kling-video/o3/pro/video-to-video/edit` ($0.168/s), `fal-ai/film` and `fal-ai/rife` ($0.0013 per compute second).

### Still not seen after round 4

- More than two pinned frames in one clip, and Seedance, Luma and Wan.
- Type set in perspective on a wall or sign.
- A picture turned into a three-dimensional model and filmed.
- Real photographs or documents placed inside an illustrated scene.
- Every technique with recorded narration.

## Round 5: the five things still unseen

> Added 11 October 2026 from a fifth reel, `remotion-templates/out/ai-care-motives/stills-test-reel-5.mp4` (R5, 1 min 56 s; composition `stills-reel-5-ai-care`, code in `src/experiments/StillsReel5.tsx`). Same status as everything above. Spend on this round: about $0.43, which brings the five exploration reels to about $8.38 (the polish pass and its retakes are counted separately).

Round 4 ended with a list of five things nobody had tried. This round tries each once. The last three sections of the reel have sound.

| Technique | Family | Where to watch | Needs | Cost | First read | Verdict |
|---|---|---|---|---:|---|---|
| Three pinned frames in one clip | L. The machine | R5 0:02–0:08 | Three registered pictures of one scene | $0.36 for 6 s | Pikaframes took the lone swimmer, the grasp and the pull as keyframes and made one continuous shot through all three: the rescuer walks in, kneels, clasps, pulls. This is pose-to-pose with the in-betweens drawn for you | |
| A picture turned into a model | M. The object | R5 0:10–0:25 | One figure or object on a plain ground | $0.02 each | Trellis made a clean low-poly model from the shopkeeper spot illustration and from the car, cropped out of its scene. Drawn without lighting they keep the flat colours, and a real camera can orbit them. The sides the picture never showed are invented but plausible. The figure is a bust, because the drawing stopped at the waist | |
| A real document on the screen | N. The real thing | R5 0:27–0:37 | A screen, card or sheet in the still; the document | $0 | The EPA notice sits on the drawn laptop, the camera goes in, and the notice takes the frame with its two phrases marked. Evidence arrives from inside the scene instead of on a separate card | |
| A real portrait on the wall | N. The real thing | R5 0:39–0:46 | A bare wall in the still; the picture | $0 | The 1791 engraving of Kant, framed and hung in the shop, with the wall's light across the glass. It reads as part of the room | |
| Drawn figures, real photograph | N. The real thing | R5 0:48–0:55 | Cut-outs and a photograph | $0 | The cut-out raters stand in front of the Wolfsburg plant. It works as a collage; the photograph has to be toned toward the drawing or the two fight | |
| Type in perspective | F. Drawing on it | R5 0:57–1:06 | Four corners of a receding surface, picked once | $0 | Kant's phrase lettered on the panelled wall under the window, receding with it. The corners were picked by eye from a gridded copy of the still | |
| Cut to a voice | (process) | R5 1:08–1:56 | A voice track with word timings | about 3 cents for three beats | Three beats re-cut on the word timings of a synthetic scratch read: the list montage, the framed details and the storyboard. Every cut sits a tenth of a second before its word, and the head turn lands on "distinguish". Cutting to words is mechanical once the timings exist | |

### More rows for "From script to picture"

| The sentence is… | Example | Reach for first | Also works |
|---|---|---|---|
| Showing the evidence itself | "Its diesel cars carried software designed to recognize an official test." | **A real document on the screen** (R5 0:27) | The document card (existing) |
| Citing a thinker | "Immanuel Kant described a shop like this." | **A real portrait on the wall** (R5 0:39) | Portrait with typed quotation (existing) |
| Quoting | "So that a child buys of him as well as any other." | **Type in perspective** (R5 0:57) | Type behind the figures |
| Describing something that happens | "A stranger pulls you out of the river." | Pose-to-pose | **Three pinned frames in one clip** (R5 0:02) when the movement itself matters |
| Turning an object over | — | **A picture turned into a model** (R5 0:10) | Framed details |

### What the voice test showed

- The scratch read ran at 2.8 to 3.5 words a second, against the 2.5 the manifest assumes, so every beat came out shorter than its slot. Your own read will have its own pace; the point is that the estimate is not the timing.
- Sentences are separated by pauses of 0.6 to 1.2 seconds. Those pauses are where the cuts want to sit.
- The timings came back with the audio (ElevenLabs through fal returns a start time for every character). The same numbers can come from a recording of you through the project's existing Whisper alignment.
- The voice is a timing aid. It is not the narration and nothing in the episode uses it. Files: `episodes/ai-care-motives/assets/scratch-voice/`.

### What is left

Every item on the earlier "not yet seen" lists has now been tried once, except Seedance, Luma and Wan as video models. What remains is no longer a kind of technique but a matter of doing these with your voice and deciding which to keep.
