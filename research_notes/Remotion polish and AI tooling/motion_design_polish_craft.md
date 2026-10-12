# Motion-design polish craft for code-based editorial explainers (Remotion, 30fps, 1920x1080)

Research date: 2026-10-10. Frame conversions assume 30fps (1 frame = 33.3 ms) and are my arithmetic unless a source states frames. "Rule of thumb" marks practitioner convention without a controlled study behind it. "Low authority" marks forum posts, vendor blogs and AI-skill pages whose numbers should be treated as starting points only. Where a search summary reported a number but I could not pin it to one page in the result set, I say "attribution approximate".

---

## 1. Easing and timing: curves, durations, springs, and how duration scales

### Takeaway
Professional systems converge on three curve roles (decelerate for entrances, accelerate for exits, asymmetric ease-in-out for on-screen moves) with the deceleration side much longer than the acceleration side; the After Effects "ease out ~30-40 / ease in ~70" graph-editor convention maps directly to `cubic-bezier(0.3-0.4, 0, 0.3, 1)`. Sources disagree on duration: UI guidance says 100-500 ms, data-visualisation research says about 1 s per stage, so editorial video sits between the two depending on whether the move is decoration or the argument itself.

### Cited Findings

**Curve families with exact values**
- IBM Carbon publishes two registers. Productive: standard `cubic-bezier(0.2, 0, 0.38, 0.9)`, entrance `cubic-bezier(0, 0, 0.38, 0.9)`, exit `cubic-bezier(0.2, 0, 1, 0.9)`. Expressive: standard `cubic-bezier(0.4, 0.14, 0.3, 1)`, entrance `cubic-bezier(0, 0, 0.3, 1)`, exit `cubic-bezier(0.4, 0.14, 1, 1)`. — [Carbon motion overview](https://carbondesignsystem.com/elements/motion/overview/)
- Carbon also gives the same curves as After Effects keyframe influence (outgoing / incoming): standard productive 20% / 62%, standard expressive 40% / 70%, exit productive 20% / 0%, exit expressive 40% / 0%. This is a first-party statement of the "ease 30-40 out, ~70 in" graph-editor convention. — [Carbon motion overview](https://carbondesignsystem.com/elements/motion/overview/)
- Carbon usage rules: expressive motion for significant moments, productive for task focus; exit easing when an element leaves permanently, standard easing when it stays nearby and can return; if viewers notice the motion often, reduce or remove it. — [Carbon motion overview](https://carbondesignsystem.com/elements/motion/overview/)
- Material Design 3 easing tokens as implemented in Flutter's source: standard `Cubic(0.2, 0, 0, 1)`, standardDecelerate `Cubic(0, 0, 0, 1)`, standardAccelerate `Cubic(0.3, 0, 1, 1)`, emphasizedDecelerate `Cubic(0.05, 0.7, 0.1, 1)`, emphasizedAccelerate `Cubic(0.3, 0, 0.8, 0.15)`, legacy `Cubic(0.4, 0, 0.2, 1)`, legacyDecelerate `Cubic(0, 0, 0.2, 1)`, legacyAccelerate `Cubic(0.4, 0, 1, 1)`. — [Flutter material/motion.dart](https://raw.githubusercontent.com/flutter/flutter/master/packages/flutter/lib/src/material/motion.dart)
- Material Design 3 duration tokens (same source): short1-4 = 50/100/150/200 ms; medium1-4 = 250/300/350/400 ms; long1-4 = 450/500/550/600 ms; extralong1-4 = 700/800/900/1000 ms. — [Flutter material/motion.dart](https://raw.githubusercontent.com/flutter/flutter/master/packages/flutter/lib/src/material/motion.dart)
- A secondary reference pairs the M3 emphasized curves with durations: emphasized 500 ms, emphasized decelerate (enter) 400 ms, emphasized accelerate (exit) 200 ms. Low authority (third-party skill page), consistent with the token scale. — [M3 skill reference](https://openskillindex.com/skills/hamen-material-3-skill-material-3)
- Nielsen Norman Group: entering elements should use ease-out (fast start, slow settle), the most common choice; ease-in for exits is only "sometimes" used because a slow start can feel laggy. — [NN/g, animation duration](https://www.nngroup.com/articles/animation-duration/)

**After Effects graph-editor conventions and their bezier equivalents**
- After Effects Easy Ease is zero speed with 33% influence on each side; the expression `ease()` is described as a cubic bezier with handles about (0.33, 0, 0.66, 1). — [Adobe community thread](https://community.adobe.com/t5/after-effects-discussions/ease-vs-eased-keyframes/td-p/7493370)
- Mapping rule from a forum derivation: influence sets the X coordinate of each handle (0-100% of the time between keys); speed relative to the segment's average speed sets Y. With zero speed at both keys: `cubic-bezier(outInfluence, 0, 1 - inInfluence, 1)`. Y below 0 gives anticipation, Y above 1 gives overshoot. Forum source; one poster found real AE bezier keyframes did not match the pure cubic exactly. — [Creative Cow thread](https://creativecow.net/?p=1862048); [Adobe community thread](https://community.adobe.com/t5/after-effects-discussions/translate-keyframeeasing-to-cubic-beziers/m-p/10742885/highlight/true)
- A conversion library exists for exported AE temporal ease data. — [Jam3/ae-temporal-to-cubic-ease](https://github.com/Jam3/ae-temporal-to-cubic-ease)
- Practitioner rule of thumb (forum, low authority): raise influence from the 33.3% default to about 60% for a snappier move; 75% on both sides with zero speed gives a slow start, a fast middle and a gentle stop. — [Creative Cow thread](https://creativecow.net/forums/thread/easy-ease-adjusting-softness/)

**Durations**
- NN/g: most animations should be 100-500 ms; 100-400 ms preferred; about 100 ms for small feedback; 200-300 ms for substantial screen changes; example popup about 300 ms in and 200-250 ms out; entrances slightly longer than exits; animations seen often should be shorter and subtler; a 50 ms change (250 to 300 ms) is perceptible; at 500 ms motion begins to drag; animations are more often too long than too short. — [NN/g, animation duration](https://www.nngroup.com/articles/animation-duration/)
- Carbon duration tokens: 70 ms and 110 ms (micro-interactions, fades), 150 ms (small expansion, short-distance move), 240 ms (expansion, toast), 400 ms (large expansion), 700 ms (background dimming). — [Carbon motion overview](https://carbondesignsystem.com/elements/motion/overview/)
- Duration should grow with travel distance or scale change, on a non-linear scale so perceived timing stays consistent; expressive motion is significantly slower than productive. — [Carbon motion overview](https://carbondesignsystem.com/elements/motion/overview/)
- Data-graphics research gives longer figures. Heer and Robertson's principle is "Make transitions as long as needed, but no longer": prior work recommends about 1 second, with faster timing acceptable when movement is minimal. Their Experiment 1 used 1.25 s animated transitions and Experiment 2 lengthened them to 2 s to fit staged animations. After the experiments they recommend timing each stage at about a full second, not about half a second. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- A UX guide puts interface animation at 200-500 ms and says over 1 s reads as delay, but exempts decorative and attention-drawing motion from that limit. — [UX Collective guide](https://uxdesign.cc/the-ultimate-guide-to-proper-use-of-animation-in-ux-10bd98614fa9)

**Slow-in/slow-out has experimental support**
- Dragicevic et al. compared constant speed, slow-in/slow-out, fast-in/fast-out and an adaptive scheme for object tracking; slow-in/slow-out performed best overall, with differences by transition type. — [Dragicevic et al., Temporal Distortion for Animated Transitions (PDF)](https://cs.au.dk/~elm/pdf/timedistort.pdf)
- Heer and Robertson derive slow-in/slow-out from their predictability principle (a viewer who has seen part of a trajectory should be able to predict the rest) and used it for every transition in their system. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)

**Springs**
- Remotion `spring()` defaults: mass 1, damping 10, stiffness 100, overshootClamping false. Lower mass is faster; stiffness strongly affects bounciness; raising damping removes the default bounce; `overshootClamping: true` prevents passing the target; `durationInFrames` stretches the curve to an exact length; `durationRestThreshold` (default 0.005) defines "finished"; `delay` holds the initial value. Order of operations: stretch, reverse, delay. — [Remotion spring()](https://www.remotion.dev/docs/spring); [Remotion springTiming()](https://www.remotion.dev/docs/transitions/timings/springtiming)
- Remotion's own docs note the default spring overshoots slightly (text "jumps in"). — [Remotion animating properties](https://www.remotion.dev/docs/animating-properties)
- Remotion's canonical non-bouncy example is `config: {damping: 200}`; with default mass and stiffness it measures 23 frames at 30fps. — [Remotion TransitionSeries](https://www.remotion.dev/docs/transitions/transitionseries)
- For spring transitions Remotion suggests lowering `durationRestThreshold` to about 0.001 to avoid a visible snap at the end. — [Remotion springTiming()](https://www.remotion.dev/docs/transitions/timings/springtiming)
- `Easing.spring(config)` exists as an easing for `interpolate()`, measured as a 30-frame spring; `Easing.bezier(x1,y1,x2,y2)` equals CSS `cubic-bezier`; `Easing.ease` is referenced as `.42,0,1,1`; `Easing.elastic(0)` never overshoots; `Easing.in/out/inOut` wrap any easing. — [Remotion Easing](https://www.remotion.dev/docs/easing)
- Apple's WWDC23 session frames springs by duration and bounce (range -1 to 1) and stresses that a spring does not have to bounce; its demos use bounce 0, 0.15 (small) and 0.3 (large); presets are smooth (no bounce), snappy (small bounce) and bouncy. — [Apple WWDC23, Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/); [WWDC notes](https://wwdcnotes.com/notes/wwdc23/10158)
- anime.js, which uses the same perceived-spring model, advises keeping bounce within -0.5 to 0.5. — [anime.js spring easing](https://animejs.com/documentation/easings/spring)

**Overshoot and anticipation (rule of thumb, low authority)**
- AI-skill and tutorial pages give: overshoot 5-15% for restrained work and 20-50% only for expressive styles; anticipation 2-4 frames of reverse motion (stated at 24fps), or 60-120 ms, or about a fifth of the main action; trailing layers settle 4-8 frames after the lead layer. These are not from named practitioners. — [Playbooks animation-principles skill](https://playbooks.com/skills/dylantarre/animation-principles/follow-through-overlapping); [Playbooks video-motion-graphics skill](https://playbooks.com/skills/dylantarre/animation-principles/video-motion-graphics)
- Anticipation defined as a small move in the opposite direction before the main move. — [Alight Creative](https://alightcreative.com/blog/top-animation-techniques)

**Remotion fundamentals**
- All animation must be driven by `useCurrentFrame()`; CSS animations and transitions cause flicker in renders; use `extrapolateRight: "clamp"` on `interpolate()` to stop values running past the range. — [Remotion animating properties](https://www.remotion.dev/docs/animating-properties)

### Inferences
- Bezier presets that can be copied straight into `Easing.bezier()` with a documented origin:
  - Entrance (decelerate): `(0, 0, 0.3, 1)` Carbon expressive, or `(0.05, 0.7, 0.1, 1)` M3 emphasized decelerate.
  - On-screen move or camera move (asymmetric ease-in-out): `(0.4, 0.14, 0.3, 1)` Carbon expressive (AE 40/70), or `(0.2, 0, 0, 1)` M3 standard.
  - Exit (accelerate): `(0.4, 0.14, 1, 1)` Carbon expressive, or `(0.3, 0, 0.8, 0.15)` M3 emphasized accelerate.
  - AE equivalents: Easy Ease = `(0.333, 0, 0.667, 1)`; "60/60" = `(0.6, 0, 0.4, 1)`; "75/75" = `(0.75, 0, 0.25, 1)`; "30 out / 70 in" = `(0.3, 0, 0.3, 1)`.
- Spring damping ratio (standard damped-oscillator formula, my calculation, not from a cited page): zeta = damping / (2 * sqrt(stiffness * mass)). Remotion default (1, 10, 100) gives zeta = 0.5, visibly underdamped. Critical damping at mass 1, stiffness 100 is damping = 20. `damping: 200` gives zeta = 10 (heavily overdamped, no overshoot, a long soft tail). For a non-bouncy editorial feel choose zeta >= 1, or zeta about 0.8-0.9 for a barely perceptible settle; anything near the default 0.5 reads as playful.
- Spring versus bezier: a spring's duration emerges from its physics (Remotion measures 23 frames for damping 200), so it resists exact frame budgeting unless `durationInFrames` is set; a bezier is exact and reproducible. In a narration-locked pipeline, beziers (or springs with `durationInFrames`) are easier to sync and to lint.
- Reconciling the duration disagreement: UI figures (100-500 ms) assume a user waiting on repeated feedback; the data-graphics figure (about 1 s per stage) assumes a viewer who must track which mark became which. For editorial video: decorative entrances and exits of single elements at roughly 200-500 ms (6-15 frames); moves where the viewer must follow correspondence (chart state changes, morphs, camera moves across a map) at roughly 1 s (30 frames) per stage; exits about two thirds of the matching entrance (from NN/g's 300 in / 200-250 out).
- Scaling with distance: no source gives a formula. Carbon's token ladder (150 ms short move, 240 ms expansion, 400 ms large expansion, 700 ms full-field change) is the only numeric ladder found; it grows sub-linearly, so doubling distance should add well under double the time.

### Gaps
- The official Material 3 tokens page and Material 2 speed page are JavaScript-rendered and returned no content; values above come from Flutter's implementation of the spec, not the spec page itself. Material 2's often-quoted "225 ms enter / 195 ms exit" could not be verified.
- No numeric easing or duration guidance was found from School of Motion, Ben Marriott, Jake Bartlett, Motion Hatch, Ryan Summers or Zack Lovatt's Flow presets. School of Motion's graph-editor lesson is conceptual (curve steepness is speed) with no numbers in the retrievable text. The specific influence values in circulation come from forums.
- easings.net returned no bezier values in the fetched text, so named-curve equivalents (easeOutCubic and so on) are not cited here.
- No source gave a duration-versus-distance formula or a duration-versus-element-size rule in numbers.
- No authoritative source for overshoot percentage or anticipation length in editorial motion graphics; the figures above come from low-authority pages.

---

## 2. Choreography: stagger, overlap, reveal order, simultaneity, direction, continuity, holds

### Takeaway
Stagger is a tool for directing attention and reducing overlap, not a comprehension aid: design systems keep it tiny (20 ms per item, 500 ms total), and a controlled study found staggering does not help viewers track objects. Reveal structure first and the most important content last, group things that change the same way so they move together, and keep one identity per mark across consecutive states.

### Cited Findings
- Carbon: stagger entering table rows by 20 ms each and scale the delay to the number of items so the whole cascade stays within 500 ms. — [Carbon choreography](https://carbondesignsystem.com/elements/motion/choreography/)
- Carbon's entrance order: (1) static shell, (2) static body content such as headers, text, images, (3) dynamic content such as table data, (4) primary action, (5) animated content such as data visualisations. Principle: begin with the most stable content, end with the most important. — [Carbon choreography](https://carbondesignsystem.com/elements/motion/choreography/)
- Carbon: elements with the same meaning use the same motion; different sizes get slightly different durations; forward motion in the entrance direction signals affirmation and reversing it signals cancellation; motion paths follow the grid and are never diagonal; shared elements create continuity between screens; large or full-screen transitions should contain continuous elements that guide the eye. — [Carbon choreography](https://carbondesignsystem.com/elements/motion/choreography/); [Carbon motion overview](https://carbondesignsystem.com/elements/motion/overview/)
- Heer and Robertson's apprehension principles: group similar transitions (Gestalt common fate: things that change together are seen as a group); minimise occlusion; maximise predictability; use simple transitions (translation and expand/contract are easier to follow than rotation); use staging for complex transitions; make transitions as long as needed but no longer. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Heer and Robertson used staggering (small onset delays) specifically to reduce overlap when sorting bars and report a small but noticeable reduction in occlusion. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Chevalier, Dragicevic and Franconeri (2014) tested staggering directly on multiple-object tracking under conditions chosen to favour it and found a negligible or even negative effect. Their explanation: staggering removes the grouping cue of common motion and makes each object's start time harder to predict. — [Chevalier et al. 2014 (PDF)](https://visualcognition.psych.northwestern.edu/publications/ChevalierDragicevicFranconeri2014.pdf); [HAL record](https://archivesic.ccsd.cnrs.fr/CRISTAL-MINT/hal-01054408v1)
- Heer and Robertson found over-staging backfires: heavily staged stacked-bar and donut transitions raised error, were not preferred, and made subjects laugh. They conclude it is better to minimise unnecessary motion than to enforce strict one-change-per-stage staging. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Bostock on object constancy: a mark that represents a given datum should persist and move through a transition so the viewer follows motion instead of re-reading labels; animation between unrelated datasets is harmful and a cross-fade or cut is better; animation must be meaningful. — [Bostock, Object Constancy](https://bost.ocks.org/mike/constancy/)
- Heer and Robertson's congruence principles: keep intermediate states valid graphics; use the same transition for the same semantic operation; do not reuse a mark for a different data point; avoid transitions that could be read two ways. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Practitioner stagger figures (rule of thumb, low authority, attribution approximate): 3-5 frames between text lines; 2-4 frames per hierarchy level at 24fps; 2-5 frames for child elements; trailing layers continue 4-8 frames after the lead stops. — [Playbooks animation-principles skill](https://playbooks.com/skills/dylantarre/animation-principles/follow-through-overlapping); [Playbooks video-motion-graphics skill](https://playbooks.com/skills/dylantarre/animation-principles/video-motion-graphics)
- Overlap is defined by a former Pixar animator as two components, drag and follow-through; parts further from the root of the motion lag more. — [Animation Mentor](https://www.animationmentor.com/?p=96605)
- Holds: slow whole-frame zooms in the range 1.1x to 1.3x total are recommended as noticeable without distracting (see section 7 for rates). — [WebshopWorks Ken Burns docs](https://docs.webshopworks.com/creative-popup/66-live-editor/page-options/259-ken-burns-effect)
- 2.5D hold guidance from a BBC/WWF stills animator (Joe Fellows): movement should be very slight with no abrupt gestures; every layer moves at least a little in one shared direction; foreground fastest, background slowest; larger screens exaggerate movement, so less is more. — [PictureCorrect on parallax animation](https://www.picturecorrect.com/parallax-animation-bringing-still-photographs-to-life/); [PetaPixel](https://petapixel.com/2013/11/19/creating-motion-stills-animate-photo-post-parallax-effect)

### Inferences
- At 30fps a 20 ms stagger is below one frame, so the practical minimum is 1 frame (33 ms). Combining Carbon's 500 ms cap with the practitioner 2-5 frame range: stagger = min(3 frames, 15 frames / (N - 1)). Ten items therefore get about 1.5-frame steps, not 4-frame steps that would run to more than a second.
- Given Chevalier et al., use stagger where the goal is reading order or elegance (lines of a title, bars rising left to right), and avoid it where the viewer must track which item went where (sorting, rank changes), except in the small doses Heer and Robertson used to relieve occlusion.
- Reveal order for a chart that follows from Carbon's stable-to-important sequence and Heer and Robertson's axis guidance: frame and title, then axes and gridlines, then data marks, then labels and annotations, with the highlighted series or annotation last.
- "How many things move at once" has no numeric source. The defensible rule from the evidence is: one group of same-kind changes at a time (common fate), at most two stages when a change is complex, never more.
- For holds, no source gives a "breathing scale" range; the nearest sourced bound is the Ken Burns total of 1.1-1.3x over about 10 s, which is roughly 1-3% per second. A hold drift meant to be unnoticed should sit clearly below that.

### Gaps
- No source quantified how many independent elements may move simultaneously.
- No numeric source for hold-beat "breathing" scale or drift amplitude, parallax layer ratios, or follow-through magnitude in 2D editorial work.
- No practitioner source with numbers for match cuts or morphing between consecutive shots; only the principle-level guidance above.

---

## 3. Typography in motion

### Takeaway
Size type for the worst case (a phone held upright showing a letterboxed 16:9 frame): the one explicit 1080p video style guide found sets a floor of 22 px, and an angular-size standard implies considerably larger for comfortable phone reading. Tighten tracking and leading as size grows, reveal by line or word behind a mask with ease-out, hang punctuation on quote cards, and animate numbers in tabular figures with an ease-out count of about 2 s.

### Cited Findings

**Sizes and safe areas**
- A 1920x1080 video style guide specifies: lower-third name 44 px, lower-third role 26 px, captions 28 px, footnotes 20 px, body never below 22 px; double everything for 4K; put captions and supers on a translucent backdrop; sample lower third at x 96 px, y 864 px. — [Towbook video typography guide](https://styleguide.towbook.com/video/typography)
- A 10-foot TV guideline cites a 28 px minimum on a 1080p screen (attribution approximate; reported via an accessibility guideline page). — [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/?p=3285)
- Legibility by angular size: 10 arc minutes is the minimum and 15-20 arc minutes is recommended for the farthest viewer. — [Extron, font size and legibility](https://azwebdev.extron.com/article/videowallfontsize)
- Safe areas on 1920x1080: action-safe 5% margins (1728x972), title-safe 10% margins (1536x864); keep text out of the bottom 8% because of YouTube's player controls. — [dev.to, title-safe and action-safe margins](https://dev.to/utilitylab/how-to-calculate-title-safe-and-action-safe-margins-for-video-1ifj)
- A looser convention: title-safe is the inner 90% and action-safe the inner 95%; 1080p title-safe 1720x1000. — [Xbox screen areas](https://devdocs.xbox.com/build/core-features/graphics/overviews/screen-areas)
- Mobile guidance without numbers: use large sizes and clean typefaces and preview on a phone. — [Headliner mobile design guide](https://learn.headliner.app/hc/en-us/articles/360005863494-How-to-design-a-good-audiogram-video-for-mobile-viewing)

**Tracking, leading, measure**
- Large display type should be tracked tighter because default spacing looks loose at size; one brand guide uses 0 tracking from 14 to 54 pt and -10 or tighter above 72 pt (attribution approximate among brand guides). — [Stanislaus State typography](https://www.csustan.edu/brand/visual-identity/typography)
- A display face tuned for large sizes needs positive tracking added below about 40 px (0 tracking at 80 px). — [Odido typography](https://merk.odido.nl/en/typography)
- Headline leading: 100% for titles and 120% for supporting headlines in one brand guide; another accepts tight leading as long as ascenders and descenders do not collide. — [Altium typography](https://www.altium.com/styleguide/brand-assets/typography); [Vevo, setting type](https://brand.vevo.com/typography/setting-type/)
- Body measure: 45-75 characters per line including spaces, 66 ideal; headlines, captions and labels are exempt and can be shorter. — [Helperbird, line length](https://www.helperbird.com/explained/line-length/)

**Punctuation and figures**
- Hanging punctuation pushes periods, commas, hyphens, dashes, quotation marks and asterisks into the margin so the flush edge looks even; it applies to headings and pull quotes as well as body text. — [Fonts.com, hanging punctuation](https://www.fonts.com/content/learning/fontology/level-4/fine-typography/hanging-punctuation)
- Proportional lining figures suit headlines and all-cap settings; tabular lining figures suit columns of numbers. — [Fonts.com, lining figures](https://www.fonts.com/content/learning/fontology/level-3/numbers/lining-figures)
- `font-variant-numeric: tabular-nums` maps to the OpenType `tnum` feature and gives digits equal widths. — [MDN, font-variant-numeric](https://developer.mozilla.org/docs/Web/CSS/font-variant-numeric)
- Many fonts lack these features, so the property can silently do nothing. — [Tailwind docs, font-variant-numeric](https://tailwindcss.com/docs/font-variant-numeric)

**Number animation**
- countUp.js defaults: 2 s duration, exponential ease-out (easeOutExpo); "smart easing" defers the deceleration on large numbers until near the end value so the easing is visible; the README recommends tabular figures to stop jitter. (Fork README of inorganik/countUp.js.) — [countUp.js README](https://github.com/angelzou/countup.js)
- Another counter library defaults to 3 s. — [react-countup-animate README](https://cdn.jsdelivr.net/npm/react-countup-animate@1.1.2/README.md)

**Text reveal technique (low authority; component libraries and vendor blogs)**
- Mask reveals split text by line, word or character and slide each piece up from behind a clip. Line split is described as subtle and suited to longer text; character split only for short headlines and logos. — [SVGator, kinetic typography guide](https://www.svgator.com/blog/kinetic-typography-a-guide-to-text-in-motion/)
- Reported starting specs (attribution approximate): 10 px upward shift with a 0-to-1 fade over 400 ms on ease-out, each word 100-200 ms after the previous; 30-50 ms per character reads as fluid and 100 ms or more as deliberate; delay the first animation 0.1-0.3 s instead of starting at t=0; bounce and spring easing on text is overused and reads as unpolished. — [Studio Meyer, kinetic typography](https://studiomeyer.io/en/blog/kinetische-typografie.md); [21st.dev text reveal mask](https://21st.dev/@soralabs/components/text-reveal-mask.md)
- Text that moves too fast harms comprehension and retention. — [SVGator, kinetic typography guide](https://www.svgator.com/blog/kinetic-typography-a-guide-to-text-in-motion/)
- Typewriter (letter-by-letter) reveal has been called a cliche since at least 2008, and in 2026 a mainstream tool's default per-character fade drew user complaints for making every text effect look like a typewriter. — [Vegas forum thread](https://www.vegascreativesoftware.info/us/forum/typewriter-effect--64726); [Adobe Express bug report](https://community.adobe.com/bug-reports-328/adobe-express-text-animation-used-typewriter-on-every-effect-now-1552431)

### Inferences
- Phone legibility estimate (my calculation; assumptions: 16:9 video area about 110 x 62 mm on a phone, 30 cm viewing distance, cap height about 0.7 em, Extron's angular figures applied to cap height). Landscape full-screen: 1 px is about 0.66 arc minutes, so the 10 arc-minute minimum needs about 22 px type and the 15-20 arc-minute recommendation needs about 33-43 px. Phone held upright with the video letterboxed across 62 mm: 1 px is about 0.37 arc minutes, so the minimum needs about 38 px and the recommended range about 58-77 px. The 22 px floor in the Towbook guide therefore matches the bare minimum for landscape viewing only; for upright-phone viewers, body text of about 40 px and key labels of about 56 px or more are safer.
- Hierarchy ratio: the only explicit ladder found (44 / 28 / 26 / 20 px) gives a name-to-role ratio of about 1.7 and name-to-footnote of 2.2. No source gave a recommended modular scale for video.
- Premium versus cheap, from the evidence above: per-line or per-word mask slide with ease-out and small stagger reads as considered; per-character reveals on anything longer than a short headline, uniform typewriter rhythm, and bouncy scale-ins read as template work.
- Remotion implementation of a line mask: wrap each line in a `div` with `overflow: hidden`; translate the inner span from about 100% of line height (or the cited 10 px for a subtler version) to 0 with `interpolate(frame - i * stagger, [0, 12], [1, 0], {easing: Easing.bezier(0, 0, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp"})`; 12 frames equals the cited 400 ms.
- Number tickers: use `fontVariantNumeric: "tabular-nums"` plus a fixed min-width for digit-count changes (99 to 100), an ease-out curve, and 45-60 frames for a hero statistic. Confirm the loaded font actually ships `tnum`.
- Hanging punctuation in code: CSS `hanging-punctuation: first` has limited browser support; in Remotion a negative `text-indent` or a negative left margin on the opening quotation mark about equal to the glyph's advance width does the same job (implementation suggestion, not from a cited source).

### Gaps
- No authoritative published standard for on-screen type size in 1080p video viewed on phones; the numbers above are one company style guide, a TV guideline and my angular-size estimate.
- No sourced hierarchy ratios specific to video typography.
- No practitioner source with numbers for tracking-in animation ranges, baseline-shift reveals, or optical kerning in motion.
- The text-reveal numbers come from web component libraries and vendor blogs, not from broadcast or editorial motion designers.

---

## 4. Chart and diagram animation

### Takeaway
Animated transitions measurably help viewers follow what changed, simple two-stage staging is preferred, and each stage wants about a second with slow-in/slow-out. Keep axes fixed where possible and rescale as its own stage when not, preserve one mark per datum, and cut or dissolve between unrelated graphics instead of morphing. Animation is a presentation strength and an analysis weakness, so every animated chart needs narration or annotation telling the viewer what to notice.

### Cited Findings

**Evidence that animation helps, and where it stops helping**
- Heer and Robertson (24 subjects): animated transitions beat static ones for object tracking in every condition; staged animation beat direct animation in all but one case; for estimating value change, animation beat static for scatter plots and grouped bars; subjects rated animation as easier to follow (4.20 of 5) and engaging (4.54 of 5), and preferred staged over direct over static. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- The one case where staging lost was a rescale followed quickly by a value change; two short stages gave more chances to lose the target. Recommendation: about one full second per stage. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Robertson et al. 2008 (Gapminder-style trends): animation was the fastest technique for presentation and viewers found it enjoyable and exciting, but it produced many errors; for analysis it was the least effective, with static traces and small multiples faster and small multiples more accurate. — [Robertson et al. 2008 (PDF)](https://faculty.cc.gatech.edu/~stasko/papers/infovis08-anim.pdf); [Microsoft Research page](https://www.microsoft.com/en-us/research/?p=145396)
- Amini et al. 2018: animation and pictographs each raise viewer engagement with data videos, acting on different engagement factors. — [Hooked on Data Videos](https://www.microsoft.com/en-us/research/?p=486758)
- Amini et al. 2015 analysed 50 professional data videos and found recurring narrative structure built from four roles: establisher, initial, peak, release. — [Understanding Data Videos (PDF)](https://hci.cs.umanitoba.ca/assets/publication_files/DataVideoStorytellingCHI2015_Revision_Final.pdf)

**Axes, gridlines, rescaling**
- Axis rescaling made change estimation harder and produced more "don't know" answers; animation softened but did not remove the cost. Use common scales across states where possible. When rescaling is needed, viewers significantly preferred it staged separately from the value change. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- During a rescale, axis labels and gridlines should move to show the scale change, fading in and out as they are added or removed. The authors suspect that keeping gridlines through the rescale and fading the old ones only after everything else finishes would work better than fading them mid-transition. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)

**Enter, exit, sort, type change**
- Filtering: the authors chose alpha fades for entering and exiting marks over bars growing from the baseline, because growth implies a data change that is not happening. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Sorting: translate marks directly; add small onset staggers only to relieve overlap. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Chart-type change: scatter to bar is staged as move-to-x (forming a dot plot) then grow into bars; stacked to grouped bars as change widths and x first, then drop to baseline. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- When start and end graphics share no data dimension, animation conveys false relationships; use a static cut or a dissolve to signal independence. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Object constancy: bind marks to data by a stable key so persisting items move and only genuinely new or removed items enter and exit; binding by index misleads. — [Bostock, Object Constancy](https://bost.ocks.org/mike/constancy/)

**Labels, highlighting, annotation**
- Label lines directly instead of using a legend; once labels sit beside lines, strong colour is no longer needed to tell series apart. — [vis4, doing the line charts right](https://www.vis4.net/blog/doing-the-line-charts-right/)
- For dense series, label only start and end points and/or maximum and minimum; tint labels to match their lines. — [EU Data Visualisation Guide, labels and marks](https://data.europa.eu/apps/data-visualisation-guide/labels-and-marks)
- Datawrapper supports automatic direct labels, per-line styling, and value labels placed on peaks and troughs. — [Datawrapper line charts](https://datawrapper.de/charts/lines); [Datawrapper blog, value labels](https://www.datawrapper.de/blog/automatically-label-values-in-line-charts)

**Newsroom practice**
- Record narration first because it sets how long each visual stays up; animate only the key data; build a rough animatic from sketches before animating. — [IJNet, ten keys to a newsroom data animation](https://ijnet.org/en/story/ten-keys-creating-data-animation-newsroom)
- John Burn-Murdoch (FT): the FT is sparing with animation because doing it well takes longer, and effective animation cannot be templated and filled with any dataset. — [Eye magazine interview](https://eyemagazine.com/feature/article/conversation-with-john-burn-murdoch)
- FT data-visualisation editor Alan Smith rejects charts as decoration and wants fewer, better-focused charts. — [Digiday, the FT guide to data visualization](https://digiday.com/uk/financial-times-guide-data-visualization/)
- Criticism of bar chart races: attention-grabbing but little is retained. — [Built In, bar chart races](https://builtin.com/data-science/bar-chart-races)

### Inferences
- Default chart build for a narrated explainer, derived from the findings: (1) frame, title, axes and gridlines fade in (stable content first); (2) data marks animate over about 30 frames with slow-in/slow-out; (3) labels and the single annotation that carries the claim arrive last, timed to the narration naming them.
- Line draw-on and bar growth for a first appearance are stylistic entrances, not data transitions, so the Heer and Robertson caution about growth applies to filtering changes inside an existing chart, not to the initial build. For later states of the same chart, fade entering and exiting marks and move persisting ones.
- State-to-state transitions inside one chart: hold the y-axis domain constant across all states of a sequence where the data allows; if a rescale is unavoidable, do it as its own 30-frame stage, then change values in a second 30-frame stage.
- Highlighting one series: desaturate or grey the context series and keep the focal series in the accent colour with a direct label; animate the de-emphasis as an opacity or colour interpolation over a short duration so nothing moves position.
- Implementation notes for Remotion and SVG (my suggestions): line draw-on via `stroke-dasharray` equal to path length with `stroke-dashoffset` interpolated to 0; bar growth via `scaleY` from the baseline with `transform-origin` at the baseline; key every mark by a stable data id so React preserves identity across states.

### Gaps
- No published animation or video-chart style guide was found from The Economist, the FT, Reuters Graphics, NYT, Vox, The Pudding or Our World in Data. What exists publicly is interviews and outside commentary.
- No source gave numeric guidance for line draw-on duration, bar stagger, or annotation timing in video; the one-second-per-stage figure is the only research-backed number.
- Shi et al.'s design space for animated narratives in data videos is described inconsistently by citing papers (82 examples in one, 43 techniques in another) and I could not reach the primary paper; treat as unverified. — [WonderFlow](https://arxiv.org/pdf/2308.04040); [automation survey](https://arxiv.org/pdf/2206.12118)
- The vis4 article could not be fetched (HTTP 403); its points above come from the search excerpt.

---

## 5. Transitions between segments

### Takeaway
The hard cut is the default; a dissolve means time has passed or two images are associated, and it runs about one to two seconds; unrelated graphics should be cut or dissolved, never morphed. Audio should lead or trail picture across cuts by roughly half a second to a second for voiceover-paced material.

### Cited Findings
- Cut is the default because it keeps momentum without drawing attention; dissolves suit elapsed time, gradual tonal shifts, or associative links. — [NYFA, how to use dissolves](https://www.nyfa.edu/student-resources/use-dissolves/); [MasterClass, dissolves](https://www.masterclass.com/articles/what-is-a-dissolve-in-filmmaking-how-to-know-when-to-use-a-dissolve-transition)
- A traditional cross dissolve lasts 24-48 frames; shorter ones behave like hard cuts and longer ones feel dreamlike. — [Adobe, cross dissolve](https://www.adobe.com/creativecloud/video/discover/video-cross-dissolve)
- A dissolve is typically no more than a second or two. — [NYFA, how to use dissolves](https://www.nyfa.edu/student-resources/use-dissolves/)
- Practitioner opinions (forum): a dissolve signals a change of time and a cut the same time; short dissolves can look like mistakes; a 20-30 frame dissolve hides imprecise timing whereas cut-only edits demand precision; journalism-trained editors often avoid dissolves altogether. — [DVinfo forum thread](https://dvinfo.net/forum/open-dv-discussion/500698-cuts-vs-dissolves.html)
- Data graphics with no shared dimension should be joined by a static cut or dissolve, as in cinema, to signal that they are independent. — [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- Murch's Rule of Six weights a cut by emotion 51%, story 23%, rhythm 10%, eye-trace 7%, 2D plane of the screen 5%, 3D space 4%; sacrifice from the bottom up. Eye-trace is where the viewer's attention sits in frame and how it travels. — [No Film School, Murch's six rules](https://nofilmschool.com/2016/11/6-rules-good-cutting-according-oscar-winning-editor-walter-murch); [UT Austin wiki, Rule of Six](https://cloud.wikis.utexas.edu/wiki/spaces/rtf318/pages/80022510/Murch+s+Rule+of+Six)
- Murch's blink idea: a cut works like a blink that separates one idea from the next, so cut when the idea has landed. This is his observation, not tested research. — [PremiumBeat, cutting on the blink](https://www.premiumbeat.com/blog/cutting-on-the-blink-editing-tips-from-walter-murch)
- J-cut: next shot's audio starts before its picture. L-cut: outgoing audio continues over the new picture. — [Wikipedia, J cut](https://www.wikipedia.org/wiki/J_cut)
- Lead lengths (vendor and tutorial sources): 6-12 frames at 30fps for a quick line, half a second to a second for slower voiceover; 1-10 frames to smooth a cut and more than 10 as a style choice; half a second is often enough in dialogue and a two-second J-cut builds anticipation into a major sequence. Make the straight cut first, then split audio. — [CapCut, J-cuts and L-cuts](https://www.capcut.com/create/j-cuts-and-l-cuts-dialogue-edits); [FireCut docs](https://learn.firecut.ai/features/remove-silences/j-cuts); [FilmDaft](https://filmdaft.com/the-l-cut-and-j-cut-how-film-editors-use-audio-to-control-time/)
- Remotion `<TransitionSeries>`: both scenes render during a transition, so total length is the sum of sequences minus transition lengths (40 + 60 - 30 = 70 frames); a transition cannot exceed an adjacent sequence; presentations include `fade()`, `slide()` (the default) and `wipe()`; timings are `linearTiming({durationInFrames})` and `springTiming({config})`; `<TransitionSeries.Overlay>` (from v4.0.415) draws over a cut without changing timing and is centred on the cut by default. — [Remotion TransitionSeries](https://www.remotion.dev/docs/transitions/transitionseries)

### Inferences
- Adobe's 24-48 frames is stated without a frame rate and corresponds to one to two seconds at film rate; at 30fps the equivalent is 30-60 frames. A "soft cut" used only to take the edge off a hard cut is a different device and sits far below that range.
- Common mistakes implied by the sources: dissolving between unrelated beats (a dissolve asserts a relationship); a dissolve short enough to look like an error; morphing between graphics that share no data; forgetting that Remotion transitions shorten the timeline, which shifts every downstream narration cue unless the manifest accounts for it.
- The project's existing default `narrationLeadIn: 0.7` s (21 frames) sits inside the half-second-to-one-second range the sources give for voiceover-paced J-cuts.
- Eye-trace is checkable in graphics: the focal point of the outgoing frame and the entry point of the incoming frame should be near each other in screen space, which is what a match cut or a persistent element achieves.

### Gaps
- No essay-video-specific study or guide on cut versus dissolve versus wipe frequency; guidance is from narrative and documentary editing.
- No numeric source for wipe duration or for when wipes are acceptable in editorial work.
- "Every Frame a Painting" was not retrievable as a text source with numbers.
- The Murch cut-rate figures (about 25 cuts a minute in action, about 6 in dialogue) come from a secondary summary. — [Musicbed, Walter Murch](https://musicbed.com/blog/filmmaking/editing/editing-secrets-from-legendary-editor-walter-murch)

---

## 6. Texture, light and depth

### Takeaway
A faint, low-opacity grain layer does double duty: it breaks the flat vector look and dithers gradients against 8-bit banding. Shadows look right when they share one light direction, are layered, and are tinted toward the background instead of black. Motion blur is contested for 2D type and graphics: use it only on fast moves and keep sample counts low.

### Cited Findings

**Banding and grain**
- 8-bit colour has 256 levels per channel, so smooth ramps band; raising project bit depth helps but an 8-bit export re-quantises. — [Tuts+, noise and grain in After Effects](https://photography.tutsplus.com/tutorials/how-to-add-noise-and-grain-in-after-effects--cms-41486)
- Fix reported by an Adobe community expert: a 50% grey solid with the Noise effect at 100%, layer opacity lowered to 2-6% depending on severity. — [Adobe community thread on banding](https://community.adobe.com/t5/after-effects-discussions/banding-issue-driving-me-insane/m-p/9511523/highlight/true)
- Alternative: an adjustment layer with 1% noise, colour noise off, as the final step. — [4K Shooters](https://www.4kshooters.net/2016/10/08/remove-the-ugly-color-banding-from-your-8-bit-footage-with-this-simple-trick)
- Alternative: gradient ramp scatter about 70 and Add Grain intensity about 0.3. — [PremiumBeat, three ways to fix banding](https://www.premiumbeat.com/blog/quick-tip-3-ways-to-fix-banding-in-after-effects)
- After Effects dithers when converting to 8-bpc on export but not in previews. — [ProVideo Coalition, remove banding](https://www.provideocoalition.com/remove-banding-in-after-effects/)
- H.264/MP4 delivery is 8-bit with block-based chroma compression; a little noise reduces the visible damage. — [Adobe community thread on artifacting](https://community.adobe.com/t5/after-effects-discussions/why-am-i-getting-this-artifacting-how-do-i-render-to-avoid/m-p/14346971/highlight/true)
- Noise concentrated at colour transitions is the strongest anti-banding measure; uniform grain textures flat areas too and sets an analogue mood. — [Instant Gradient, grainy gradients](https://instantgradient.com/blog/grainy-gradients)
- Animated grain helps avoid the default digital 2D look of After Effects work. — [PremiumBeat, five After Effects tips](https://www.premiumbeat.com/blog/5-after-effects-tips-motion-design)
- Overlay grain at 0.05-0.15 opacity with multiply, overlay or soft-light blending; a static seed is advised because per-frame reseeding reads as a noise filter. Low authority (AI skills document). — [grain-overlay skill doc](https://www.skills.sh/gooseworks-ai/gooseworks-ads-skills/grain-overlay)

**Vignette**
- Viewers read bright areas before dark ones, which is what a vignette exploits; build with an inverted, feathered mask on a dark layer or a gradient shape. — [ProVideo Coalition, vignette techniques](https://www.provideocoalition.com/after-effects-classic-course-extended-vignette-techniques-part-1/)
- Vignette gradients band visibly under compression; adding noise prevents it. — [Adobe community feature request](https://community.adobe.com/feature-requests-730/smoother-vignette-through-subtle-noise-1326981)

**Shadows**
- One global light: every shadow shares the same x:y offset ratio (example: vertical offset twice the horizontal). Higher elevation means larger offset, larger blur and lower opacity together. — [Josh Comeau, designing shadows](https://www.joshwcomeau.com/css/designing-shadows/)
- Layer several low-opacity shadows instead of one: `0 1px 1px`, `0 2px 2px`, `0 4px 4px`, `0 8px 8px`, `0 16px 16px`, each at 0.075 alpha, in place of a single `0 6px 6px` at 0.3. — [Josh Comeau, designing shadows](https://www.joshwcomeau.com/css/designing-shadows/)
- Tint shadows with the background hue at lower lightness and saturation instead of black: on `hsl(220 100% 80%)` use about `hsl(220 60% 50%)`. Layered shadows cost render time and should not be animated. `filter: drop-shadow` follows the element's shape. — [Josh Comeau, designing shadows](https://www.joshwcomeau.com/css/designing-shadows/)

**Motion blur**
- After Effects defaults: shutter angle 180 degrees, phase -90; described as best for almost all animation. — [School of Motion, motion blur](https://www.schoolofmotion.com/blog/motion-blur-after-effects)
- Use blur when a layer moves, scales or rotates quickly. — [Jake in Motion docs](https://docs.jakeinmotion.com/motion-state/controls/motion-blur/)
- Counter-view: one contributor keeps blur off for 2D work because it removes detail from 2D objects; blur earns its place with live action and 3D. — [PremiumBeat, motion blur in After Effects](https://www.premiumbeat.com/blog/motion-blur-inside-adobe-after-effects)
- School of Motion's ball-bounce example shows blur weakening the sense of weight at contact. — [School of Motion, motion blur](https://www.schoolofmotion.com/blog/motion-blur-after-effects)
- The 180-degree rule is a convention, not a law. — [Wipster, debunking the 180-degree rule](https://www.wipster.io/blog/debunking-the-180-degree-shutter-rule)
- Remotion `<CameraMotionBlur>`: `shutterAngle` default 180 (lower is less blur; lower fps gives more blur); `samples` default 10; it renders that many time-offset copies and averages them; the technique is destructive to colour, so keep samples low, recommended 5-10; children must be absolutely positioned; uses `mix-blend-mode`. — [Remotion CameraMotionBlur](https://www.remotion.dev/docs/motion-blur/camera-motion-blur)
- Remotion `<Trail>`: `layers`, `lagInFrames` (may be fractional; example 0.1), `trailOpacity`; example uses 50 layers. — [Remotion Trail](https://www.remotion.dev/docs/motion-blur/trail)

**Noise for organic motion**
- `@remotion/noise` `noise2D(seed, x, y)` returns a deterministic value in [-1, 1]; same seed and coordinates give the same result. — [Remotion noise2D](https://www.remotion.dev/docs/noise/noise-2d)

**2.5D parallax for stills**
- Method: cut the subject to its own layer, fill the hole behind it, stack layers in depth, enlarge the pushed-back layers to refill the frame, then move a camera so near layers travel more than far ones. Mask feather 0.5-1 and expansion 10-15 px are suggested for the fill. — [Motion Array, 2.5D parallax](https://blog.motionarray.com/learn/after-effects/animate-flat-2d-images-after-effects/)
- Keep moves small; small camera moves also hide the fill. The 2002 documentary The Kid Stays in the Picture popularised the technique. — [PetaPixel, parallax effect](https://petapixel.com/2013/11/19/creating-motion-stills-animate-photo-post-parallax-effect); [Motion Array, 2.5D parallax](https://blog.motionarray.com/learn/after-effects/animate-flat-2d-images-after-effects/)

### Inferences
- The three grain figures measure different controls and are not interchangeable: 2-6% layer opacity of full-strength noise, 1% effect amount, and 0.05-0.15 opacity of a texture overlay. In CSS terms a monochrome noise layer at roughly 2-6% opacity (or a soft-light texture at 5-15%) is the defensible starting band. Always judge on the encoded file, since compression removes fine grain.
- Static versus animated grain is a source disagreement: PremiumBeat favours moving grain for life; the skills document favours a static seed. A slow or held-for-2-frames grain is a reasonable compromise but is my suggestion.
- At 30fps a 180-degree shutter equals 1/60 s of exposure (arithmetic). `<CameraMotionBlur samples={10}>` multiplies render work per frame by about the sample count (implied by the docs' description). For a pipeline dominated by type and charts, restrict blur to fast transitional moves and leave text settles unblurred.
- `noise2D("seed", frame * 0.01, 0) * amplitude` gives a deterministic slow drift for hold beats without periodic repetition; speed and amplitude constants are mine, not from the docs.
- Shadow rules are directly lintable: a single light-direction ratio across all `box-shadow` values, no pure-black shadows on light paper backgrounds, and no animated layered shadows.

### Gaps
- No sourced numeric guidance for halation, chromatic aberration, light leaks or bloom in 2D editorial graphics.
- No sourced vignette strength (opacity or falloff) figure.
- No sourced paper-texture opacity or scale figure.
- No sourced parallax layer displacement ratios or depth-of-field blur radii for stills.
- `@remotion/noise` docs give no recommended speed or amplitude values.
- No source addresses motion blur for 2D graphics at 30fps specifically; guidance is general After Effects practice and split between "use on fast moves" and "leave off for 2D".

---

## 7. Photo and archival treatment

### Takeaway
Ken Burns moves in the sources total about 1.1x to 1.35x over roughly ten seconds (about 1-3.5% per second), far gentler than amateur defaults; shorter holds force faster moves, so tie the move to the hold length. For 2.5D, every layer moves in one direction and less is more.

### Cited Findings
- A video library's Ken Burns example zooms 1.0 to 1.3 over 10 s with 1.2 as the default end scale. — [movielite zoom docs](https://www.mintlify.com/francozanardi/movielite/api/vfx/zoom)
- Recommended scale range 1.1-1.3: noticeable and engaging without distraction. — [WebshopWorks Ken Burns docs](https://docs.webshopworks.com/creative-popup/66-live-editor/page-options/259-ken-burns-effect)
- A preset uses a final zoom depth of 1.35. — [Zvid zoom docs](https://docs.zvid.io/docs/structure/properties/zoom/)
- An FFmpeg recipe adds 0.001 zoom per frame for 250 frames at 25fps (10 s). — [Bannerbear, Ken Burns with FFmpeg](https://www.bannerbear.com/blog/how-to-do-a-ken-burns-style-effect-with-ffmpeg)
- The shorter a still is displayed, the faster its pan and zoom runs. — [Apple iPhoto help](https://help.apple.com/iphoto/mac/9.6/en.lproj/pht6d9774ac.html)
- Premiere defaults stills to five seconds; slower pacing suits contemplative material. — [Adobe, Ken Burns effect](https://www.adobe.com/learn/premiere-pro/web/ken-burns-effect)
- The Ken Burns move translates the whole picture as one plane, unlike parallax, which moves depth layers at different rates. — [PetaPixel, parallax effect](https://petapixel.com/2013/11/19/creating-motion-stills-animate-photo-post-parallax-effect)
- Text over photographs: either process the image or add a semi-transparent black gradient behind the text, and verify with a contrast analyser. — [NN/g, text over images](https://www.nngroup.com/articles/text-over-images/)
- A black overlay at 60-80% opacity is recommended for most photos carrying text (one university's guidance). — [UW-Madison theme guidance](https://uwtheme.brand.wisc.edu/?p=10451)
- Even with an overlay, text over busy, high-detail image areas is hard to read. — [Smashing Magazine, accessible text over images](https://smashingmagazine.com/2023/08/designing-accessible-text-over-images-part2)

### Inferences
- Rates implied by the sources (arithmetic): 1.0 to 1.3 over 10 s is 3% per second; 0.001 per frame at 25fps is 2.5% per second ending at 1.25x; 1.1 over 10 s is 1% per second. A defensible lint band is total scale 1.05-1.35 and rate at or below about 3.5% per second, with linear or very gentle easing so the move never visibly starts or stops inside the shot.
- Source images need headroom: a 1.3x end scale on a 1920-wide frame needs at least about 2500 px of source width to avoid upscaling softness (arithmetic).
- Consistency across mixed archival sources is best achieved by a shared grade (the project's LUT pipeline already does this); no external numeric source was found for duotone or grade settings.
- Document zoom and highlight: the sourced guidance that applies is the staging principle (move to the region, then reveal the highlight, about a second per stage) and the text-over-image contrast rule.

### Gaps
- No documentary-craft source gave Ken Burns speed in numbers; the figures come from tool documentation and tutorials.
- No sourced numeric pan speed (pixels per second or percent of frame per second).
- No sourced framing rules for archival stills (headroom, direction of move toward the subject) beyond general statements.
- No sourced guidance for duotone or colour-grade parameters, or for document highlight animation timing.

---

## 8. Colour and contrast in motion graphics for video

### Takeaway
Hold text to WCAG contrast (4.5:1, or 3:1 for genuinely large text) measured against the lightest pixels behind it, and treat large luminance swings between adjacent cards as a flash-safety and comfort issue with a hard ceiling of three flashes per second.

### Cited Findings
- WCAG AA: 4.5:1 for regular text and 3:1 for large text (18 pt / 24 px regular, or 14 pt / about 19 px bold). — [W3C, Understanding contrast (minimum)](https://www.w3.org/TR/2016/NOTE-UNDERSTANDING-WCAG20-20161007/visual-audio-contrast-contrast.html)
- Automated checkers cannot assess contrast when the background is a gradient or an image. — [Cornell web accessibility guideline](https://wa-reviews.hosting.cornell.edu/guidelines/33)
- Flash safety: all major guidelines cap flashing at three per second; a general flash is a luminance change of 20 cd/m2 or more where the darker image is below 160 cd/m2; above that the test is a Michelson contrast of 1/17 or more; saturated red has its own stricter test because sensitivity to red flashing is higher. — [W3C, three flashes or below threshold](https://www.w3.org/WAI/WCAG20/Understanding/three-flashes-or-below-threshold)
- ITU-R BT.1702-3 (November 2023) is the current broadcast recommendation on photosensitive seizures. — [ITU-R BT.1702](https://www.itu.int/rec/R-REC-BT.1702)
- Ofcom treats sequences above three flashes per second that exceed intensity thresholds as potentially harmful. — [Ofcom broadcast bulletin](https://www.ofcom.org.uk/__data/assets/pdf_file/0022/45157/issue92.pdf)
- Broadcast legal range puts black at code 16 and white at 235; default text generators often produce 255 white and 0 black, which are illegal for broadcast. — [Paul Howson, video levels](https://tdgq.com.au/film-restore/assessing-the-scans-part-3-video-levels/); [Vegas forum, default text levels](https://www.vegascreativesoftware.info/us/forum/default-text-levels--14165)
- Legacy advice to avoid fully saturated colours (pure red smears on NTSC monitors). Dated. — [Premiere 6.0 help archive](https://discmaster.textfiles.com/file/30729/Digital%20Video%20Collection%20CD.iso/Premiere%206.0/ARCHIVE.Z/c09af25.htm?html=true)
- Motion blur can muddy colours, and averaging-based blur in Remotion is destructive to colour. — [Remotion CameraMotionBlur](https://www.remotion.dev/docs/motion-blur/camera-motion-blur)

### Inferences
- A dual-mode system that alternates light (paper) and dark (ink or midnight) cards creates large full-frame luminance steps at each mode change. A single cut is one transition, not a flash sequence, but several mode flips inside a second would approach the three-per-second ceiling. A lint that counts large mean-luminance reversals per rolling second is a direct check.
- The 16-235 legal range is a broadcast delivery concern; for YouTube the encoder handles range conversion, so its practical value is as a design habit: avoid pure 255 white and pure 0 black fields, which the project's paper and ink palette already does (my inference; no source addresses YouTube specifically).
- Contrast over photographs should be computed from rendered frames by sampling the region behind each text block and taking the worst-case pixels, since design-token contrast says nothing about image backgrounds.

### Gaps
- No sourced "safe saturation" figure for web video.
- No source on perceptual flicker or comfort for light-to-dark card alternation below the seizure thresholds.
- No sourced guidance on matching perceived brightness between light-mode and dark-mode cards.
- The primary Ofcom guidance note and BT.1702 full text were not retrieved; thresholds above come from W3C's description.

---

## 9. Sound as polish

### Takeaway
Viewers detect sound that arrives early far sooner than sound that arrives late (about 45 ms early versus about 125 ms late), so hit sounds should land on the visual frame or a frame after, never before. Mix to about -14 LUFS integrated with a -1 dBTP ceiling and duck music 6-12 dB under narration.

### Cited Findings
- ITU-R BT.1359: average detectability thresholds are about +45 ms (sound early) to -125 ms (sound late); acceptability about +90 ms to -185 ms. — [ITU-R BT.1359 (PDF)](https://itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1359-0-199802-S!!PDF-E.pdf); [Wikipedia, audio-to-video synchronization](https://en.wikipedia.org/wiki/Audio-to-video_synchronization)
- EBU R37 end-to-end limit: +40 ms early to -60 ms late (secondary sources; the R37 text itself was not retrieved). — [EBU R37 publication page](https://tech.ebu.ch/publications/r037); [Wikipedia, audio-to-video synchronization](https://en.wikipedia.org/wiki/Audio-to-video_synchronization)
- ATSC encoder-input limit: audio no more than 15 ms early or 45 ms late; an earlier Bell Labs study put detectability at about 35 ms early and 100 ms late. — [TV Technology, AV synchronization](https://www.tvtechnology.com/opinions/av-synchronization-how-bad-is-bad)
- These thresholds come from speech (newsreader clips); music thresholds for guitar and piano were found to be higher than for speech. — [arXiv, AV desynchronization in sports video](https://arxiv.org/pdf/2212.01686)
- Sign conventions differ between documents (NTIA writes the same window with lag positive), so check before comparing. — [NTIA report](https://its.ntia.gov/publications/download/11-474.pdf)
- Whoosh convention: match the whoosh length to the move and place its peak exactly on the cut; a riser builds and stops dead at the peak so the silence after is the effect; an impact resolves the movement. Transition sounds sit a little back in the mix and must not compete with dialogue. — [Morphic, whoosh sound effect](https://morphic.com/resources/sounds/whoosh-sound-effect)
- YouTube's reference is about -14 LUFS integrated; a true-peak maximum of about -1 dBTP is suggested. YouTube publishes no official figure; this is industry convention. — [Youlean](https://youlean.co/?p=30813)
- Other sources suggest a true-peak ceiling between -1 and -2 dBTP. — [SoundBridge, loudness normalization](https://www.soundbridge.io/loudness-normalization-a-mixing-and-mastering-guide)
- Ducking starting points (vendor guide): reduce music 6-12 dB under speech, attack 30-80 ms, release 250-700 ms. — [CapCut, audio ducking](https://www.capcut.com/create/audio-ducking-for-clear-dialogue-in-video)
- Peak-level guideline table: dialogue -12 to -6 dBFS, music bed -25 to -18 dBFS, sound effects -15 to -10 dBFS, ambience -30 to -20 dBFS. — [Adorama, mastering audio levels](https://www.adorama.com/alc/mastering-audio-levels/)
- Music under interview dialogue sits about 10-20 dB below the voice. — [Syracuse, the art of sound mixing](https://nhtraining.syr.edu/the-art-of-sound-mixing/)
- Mix hierarchy: dialogue on top, effects under it, music under both; dip music a few dB instead of muting, and duck only for the length of an effect cue. — [Morphic, mixing sound effects with music](https://morphic.com/resources/how-to/how-to-mix-sound-effects-with-music)
- Record narration first; it sets the timing for every visual. — [IJNet, ten keys to a newsroom data animation](https://ijnet.org/en/story/ten-keys-creating-data-animation-newsroom)

### Inferences
- In frames at 30fps (arithmetic): the early detection threshold is about 1.4 frames and the late threshold about 3.75 frames. A safe authoring rule for transient hits (stat lands, stamp, cut accent) is offset in [0, +1] frames relative to the visual hit, with +2 still below detection for most material; -1 frame is already at the edge of the early threshold. Whoosh and riser bodies may start as early as the move does, provided the peak lands on the cut or hit.
- The thresholds were measured on speech; for non-speech hits they are an approximation, and the music finding suggests tolerance may be somewhat wider, not narrower.
- The peak-level table and the LUFS target measure different things; set relative balances with the table, then normalise the full mix to the LUFS and true-peak targets.
- No source measured how sound design changes perceived visual quality; the claim that synced sound makes graphics feel more finished is practitioner consensus without a number.

### Gaps
- No controlled evidence found on sound design improving perceived visual polish.
- No motion-design source gives a frame count for leading or trailing SFX against visual hits; the rule above is derived from broadcast lip-sync research.
- No official YouTube loudness documentation was found; -14 LUFS is convention.
- No sourced guidance on UI-style tick, click or pop sound conventions for chart and text events.

---

## 10. Pacing for retention

### Takeaway
There is no study linking cut rate or visual-change frequency to retention in video essays; circulating "change something every N seconds" rules are unsourced. What evidence exists says film shots have shortened to about 3-4 s on average, shorter educational videos hold viewers better, and on-screen text that duplicates narration hurts learning unless it is brief and placed beside what it describes.

### Cited Findings
- Cutting and colleagues measured 150-plus films from 1935 to 2005 (extended to 160 through 2010) and found shot length falling in a gradual, roughly linear trend alongside changes in motion and luminance. — [Cutting et al., PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3485803/); [i-Perception paper](https://journals.sagepub.com/doi/reader/10.1068/i0441aap)
- Reported averages: about 13 s in 1945, 6.8 s in 1965, about 4 s in 1985 and 2005 (small three-genre sample). — [OnFiction research bulletin](https://www.onfiction.ca/2009/04/research-bulletin-making-cut.html)
- A news report on the larger study gives 8-10 s in the 1960s falling to 3-4 s by 2005. The two 1960s figures disagree. — [SBS, Hollywood's secret formula](https://www.sbs.com.au/whats-on/article/hollywoods-secret-formula/el6oxpqmo)
- Genre spread: horror averages 15.7 s per shot, almost four times longer than action (blog dataset). — [Stephen Follows, shots in the average movie](https://stephenfollows.com/many-shots-average-movie/)
- Average shot length is a poor measure of cutting rate, and shot length varies in clusters within a film. — [Redfern, analysing cutting rates](https://widescreenjournal.org/analysing-motion-picture-cutting-rates-by-nick-redfern); [Cinemetrics](https://cinemetrics.uchicago.edu/article/a8d188af-2594-4e1e-9d44-72a2d2812f1b)
- Murch: about 25 cuts a minute reads as action, about 6 a minute as normal dialogue (secondary summary). — [Musicbed, Walter Murch](https://musicbed.com/blog/filmmaking/editing/editing-secrets-from-legendary-editor-walter-murch)
- Guo, Kim and Rubin analysed 6.9 million edX viewing sessions: shorter videos are far more engaging, and informal talking-head and Khan-style tablet-drawing videos out-engage polished lecture recordings. Measures engagement, not learning. — [Guo, Kim and Rubin 2014 (PDF)](https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf)
- Vidyard 2022 data on about 1.78 million business videos: 66% of viewers finish videos under a minute and 22% finish videos over 20 minutes. — [MarketingProfs summary](https://www.marketingprofs.com/charts/2023/49949/business-video-benchmarks-retention-rates-by-length)
- Mayer's principles: redundancy (animation plus narration beats animation plus narration plus on-screen text, unless the text is short, highlights the key action and sits next to the relevant graphic); coherence (cut extra words, images and sounds); signalling (cue the essential material); modality (spoken words over visuals beat on-screen text over visuals). — [NUS summary of Mayer's 12 principles](https://medicine.nus.edu.sg/medixperience/scholarly-article/mayers-12-principles-of-multimedia-instruction/)
- Animation is fastest and most enjoyable for presentation yet error-prone, so viewers need guidance on what to notice. — [Robertson et al. 2008 (PDF)](https://faculty.cc.gatech.edu/~stasko/papers/infovis08-anim.pdf)

### Inferences
- A motion-graphics segment of 6-10 s containing two or three internal reveals produces visual change every 2-4 s without a cut, comparable to contemporary film cutting rates. For a graphics-led essay, "visual change frequency" is better measured as reveals plus cuts per minute than as shot length.
- On-screen text density, from Mayer: labels, key terms and numbers placed beside the thing they describe are supported; sentences that repeat the narration are not. Quote cards are the exception because the text is the evidence, so narration should either read the quote or stay silent, not paraphrase over it.
- Pacing variation matters more than the average (shot lengths cluster in films), which supports alternating dense analytical passages with held, slow beats.

### Gaps
- No study was found that measures shot length, cut frequency, visual-change frequency or "pattern interrupt" intervals in video essays against YouTube retention; the marketing-blog figures in circulation do not name their data.
- No data on shot length norms in video essays or explainer channels specifically.
- No study of on-screen text density in entertainment-oriented essay video; Mayer's work measures learning from instructional material.
- Primary texts of Bordwell's "intensified continuity" figures were not retrieved.

---

## 11. What can be checked automatically

### Takeaway
Most polish rules above reduce to parameter lints (easing, spring damping ratio, durations, stagger totals, type size, safe areas, tabular figures, shadow direction) plus a small set of frame-level and audio measurements (contrast behind text, flash rate, dead holds, banding, loudness, SFX offset). The parameter lints are cheap and deterministic; the frame checks need rendered stills.

### Cited Findings
- Remotion requires frame-driven animation and flags CSS animations and transitions as a flicker source; unclamped `interpolate()` overshoots its range. — [Remotion animating properties](https://www.remotion.dev/docs/animating-properties)
- Spring length is computable: `springTiming().getDurationInFrames({fps})` returns frames (23 for damping 200 at 30fps), and `measureSpring()` exists for `spring()`. — [Remotion TransitionSeries](https://www.remotion.dev/docs/transitions/transitionseries); [Remotion spring()](https://www.remotion.dev/docs/spring)
- Transition arithmetic is deterministic: total = sum of sequences minus transitions; a transition may not exceed an adjacent sequence. — [Remotion TransitionSeries](https://www.remotion.dev/docs/transitions/transitionseries)
- Thresholds available for lints: stagger cascade within 500 ms (Carbon); entrance longer than exit (NN/g); about 1 s per chart stage (Heer and Robertson); body type at least 22 px at 1080p, title-safe 1536x864, bottom 8% clear (Towbook, dev.to); contrast 4.5:1 or 3:1 (WCAG); at most three flashes per second (WCAG, Ofcom); motion-blur samples 5-10 (Remotion); one shadow light ratio (Comeau); about -14 LUFS and -1 dBTP (Youlean); sound no more than about 45 ms early (BT.1359). — [Carbon choreography](https://carbondesignsystem.com/elements/motion/choreography/); [NN/g](https://www.nngroup.com/articles/animation-duration/); [Heer and Robertson 2007 (PDF)](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf); [Towbook](https://styleguide.towbook.com/video/typography); [dev.to](https://dev.to/utilitylab/how-to-calculate-title-safe-and-action-safe-margins-for-video-1ifj); [W3C contrast](https://www.w3.org/TR/2016/NOTE-UNDERSTANDING-WCAG20-20161007/visual-audio-contrast-contrast.html); [W3C flashes](https://www.w3.org/WAI/WCAG20/Understanding/three-flashes-or-below-threshold); [Remotion CameraMotionBlur](https://www.remotion.dev/docs/motion-blur/camera-motion-blur); [Josh Comeau](https://www.joshwcomeau.com/css/designing-shadows/); [Youlean](https://youlean.co/?p=30813); [ITU-R BT.1359 (PDF)](https://itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1359-0-199802-S!!PDF-E.pdf)
- Automated tools cannot judge contrast over gradients or images from styles alone. — [Cornell web accessibility guideline](https://wa-reviews.hosting.cornell.edu/guidelines/33)

### Inferences
All items below are my proposed checks, derived from the cited thresholds.

**From animation parameters or source code (static lint)**
1. No CSS `transition` or `animation` properties or `@keyframes` in templates; every `interpolate()` on opacity, scale or position has both extrapolations clamped.
2. Spring damping ratio: compute zeta = damping / (2 * sqrt(stiffness * mass)); warn below about 0.8, error near the 0.5 default, unless `overshootClamping` is set or the template is whitelisted as intentionally bouncy.
3. Easing role check: entrances use a decelerating curve (bezier x1 near 0, x2 at or below about 0.4); exits use an accelerating curve; no `Easing.linear` on spatial moves longer than a few frames; no `Easing.bounce` or `Easing.elastic` with bounciness above 0 outside a whitelist.
4. Duration bands at 30fps: single-element entrance or exit 6-15 frames (200-500 ms); exit no longer than its entrance; chart state stage 24-36 frames (about 1 s); flag anything under 3 frames (below the 100 ms perceptual floor) or decorative moves over 30 frames.
5. Stagger: per-item offset at least 1 frame; total cascade (N - 1) * offset at or below 15 frames; warn when a stagger is applied to a sort or rank-change transition.
6. Chart continuity: axis domain identical across the states of one sequence unless a rescale stage is declared; every mark has a stable key; a rescale and a value change never share a stage.
7. Transition durations: dissolves within the grammar's declared band (source band 30-60 frames at 30fps for a true dissolve); transition not longer than either neighbour; manifest total equals the sum of segments minus transitions.
8. Type: computed font size at least 22 px (warn under about 40 px for body copy given upright-phone viewing); text boxes inside 1536x864 title-safe and above the bottom 8%; any element whose text content is interpolated numerically has `font-variant-numeric: tabular-nums`; body line length at or under 75 characters.
9. Shadows: every `box-shadow` or `drop-shadow` shares one x:y offset ratio; no pure black shadow colour; no shadow values driven by the frame.
10. Motion blur: `samples` between 5 and 10; blur wrappers not applied around static text.
11. Ken Burns: total scale 1.05-1.35, rate at or below about 3.5% per second, source resolution at least end scale times 1920 wide.
12. Audio manifest: each transient SFX onset offset from its visual hit frame within [0, +1] frames (error if negative); narration lead-in within 15-30 frames on J-cuts.

**From rendered frames**
13. Contrast: for each text bounding box (known from layout), sample the pixels behind it and compute the WCAG ratio against the worst-case background; fail under 4.5:1, or 3:1 for text at or above 24 px.
14. Flash rate: per-frame mean relative luminance; count opposing large changes in any rolling 30-frame window; fail above three. Add a softer warning for more than one full light-to-dark mode flip per second.
15. Dead holds: frame-difference energy; flag any span longer than a chosen threshold (for example 2-3 s) with zero pixel change, which indicates a hold with no drift.
16. Banding: in regions declared as gradients, detect wide runs of identical 8-bit values, or simply assert that a grain layer is present above any large gradient.
17. Start and end states: sample the first and last frame of each segment to confirm entrances start from the intended hidden state and nothing is mid-animation at a cut.

**From the audio mix**
18. Integrated loudness about -14 LUFS and true peak at or below -1 dBTP on the final mix; music level under narration 6-12 dB below its un-ducked level.

**From the manifest (pacing metrics, informational)**
19. Visual-change events per minute (cuts plus reveals), longest stretch without one, and the share of runtime with on-screen sentences that duplicate narration text. Report as metrics, not pass or fail, since no evidence supports a specific threshold.

### Gaps
- No published linter or rule set for motion-graphics polish was found; the checks above are original proposals built on the cited thresholds.
- Flash analysis proper is defined in display luminance (cd/m2) and screen area; a relative-luminance frame check approximates it and is not a substitute for a certified flash analyser.
- Thresholds for dead-hold length, mode-flip frequency and pacing metrics are not evidence-based and need tuning by eye.
