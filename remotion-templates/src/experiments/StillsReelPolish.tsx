/**
 * StillsReelPolish — the five sections that changed in the first polish pass
 * (11 October 2026), cut together so the fixes can be judged on their own.
 * The sections themselves live in StillsReel.tsx, StillsReel2.tsx and
 * StillsReel3.tsx; this file only sequences them. Test only.
 */
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, Series, staticFile } from "remotion";
import { fonts, fontSizes, palette, sec } from "../design/theme";
import { type Line, FRAMED_DETAILS, H, NarrationStrip, SLATE_SEC, STATE_SWAP, Slate, StillShots, W, still } from "./StillsReel";
import { MATCH, MatchAndTriptych, RESCUE } from "./StillsReel2";
import { PushThrough } from "./StillsReel3";

interface Section {
  title: string;
  /** What was wrong, and what changed. */
  today: string;
  durationSec: number;
  body: React.ReactNode;
  lines: Line[];
  linesEndSec: number;
}

/** The three-cases section is shown from the cut to the model onward. */
const CASES_FROM = MATCH.model;

const SECTIONS: Section[] = [
  {
    title: "Framed details",
    today: "Was: the head turned with a pop inside one framing. Now: the turned head arrives on a cut to a closer framing.",
    durationSec: 20,
    body: <StillShots shots={FRAMED_DETAILS} />,
    lines: [
      { atSec: 0, text: "There's another complication." },
      { atSec: 1.6, text: "When a lab says a model behaves well, that's a test result." },
      { atSec: 6.4, text: "And researchers have found that AI models can distinguish test conversations from real ones better than chance." },
      { atSec: 13.2, text: "So what does a good result mean if the system can recognize the test?" },
    ],
    linesEndSec: 18.8,
  },
  {
    title: "State swap",
    today: "Was: the empty street was softer than the window around it. Now: redone at the still's full sharpness.",
    durationSec: 10.2,
    body: <StillShots shots={STATE_SWAP} />,
    lines: [
      { atSec: 1.4, text: "The question is simple." },
      { atSec: 3.2, text: "Take away the watching." },
      { atSec: 5.8, text: "What happens to the behavior?" },
    ],
    linesEndSec: 7.8,
  },
  {
    title: "Three cases side by side",
    today: "Was: a triptych of three small panels. Now: each case as two larger details, the watchers above and the one watched below.",
    durationSec: MATCH.end - CASES_FROM,
    body: (
      <Sequence from={-sec(CASES_FROM)}>
        <MatchAndTriptych />
      </Sequence>
    ),
    lines: [
      { atSec: 0, text: "Now return to the machine." },
      { atSec: MATCH.tri - CASES_FROM, text: "That's why one test isn't enough.   [line borrowed from later in the beat]" },
      { atSec: 9.8 - CASES_FROM, text: "A reassuring answer, a plausible explanation and a good test score each give us something to examine." },
      { atSec: 16.6 - CASES_FROM, text: "None shows what the system does when it thinks no one is checking." },
    ],
    linesEndSec: 21.8 - CASES_FROM,
  },
  {
    title: "Pose-to-pose",
    today: "Was: the rescuer's whole body shifted between the grasp and the pull. Now: only the man in the water changes.",
    durationSec: 12,
    body: <StillShots shots={RESCUE} />,
    lines: [
      { atSec: 0, text: "Now you're the one in the water." },
      { atSec: 2.8, text: "A stranger pulls you out of the river." },
      { atSec: 6, text: "Later you find out he jumped in hoping for a reward." },
    ],
    linesEndSec: 10.4,
  },
  {
    title: "Push-through",
    today: "Was: the two pictures overlapped in a muddle for about a second. Now: they share the screen for five frames.",
    durationSec: 6.5,
    body: <PushThrough />,
    lines: [
      { atSec: 0.3, text: "Go back to the shop." },
      { atSec: 2.4, text: "Picture the street: other customers compare notes." },
    ],
    linesEndSec: 6,
  },
];

export const STILLS_REEL_POLISH_DURATION = SECTIONS.reduce((total, s) => total + sec(SLATE_SEC) + sec(s.durationSec), 0);

export const StillsReelPolish: React.FC = () => (
  <Series>
    {SECTIONS.flatMap((s, i) => [
      <Series.Sequence key={`slate-${i}`} durationInFrames={sec(SLATE_SEC)}>
        <Slate index={i + 1} of={SECTIONS.length} title={s.title} today={s.today} />
      </Series.Sequence>,
      <Series.Sequence key={`body-${i}`} durationInFrames={sec(s.durationSec)}>
        {s.body}
        <NarrationStrip lines={s.lines} endSec={s.linesEndSec} />
      </Series.Sequence>,
    ])}
  </Series>
);

// ── AI clip retakes: first take beside the retake ───────────────────────────

const PANE = { w: 928, h: 522, y: 250, leftX: 24, rightX: 968 };
const clipFile = (name: string) => staticFile(`episodes/ai-care-motives/stills-test/clip-${name}.mp4`);

/** A full-frame clip, minus the first few frames, which carry a brightness pop. */
const FullClip: React.FC<{ name: string }> = ({ name }) => (
  <OffthreadVideo src={clipFile(name)} muted startFrom={3} style={{ position: "absolute", inset: 0, width: W, height: H, objectFit: "cover" }} />
);

const Pane: React.FC<{ x: number; label: string; children: React.ReactNode }> = ({ x, label, children }) => (
  <>
    <div style={{ position: "absolute", left: x, top: PANE.y, width: PANE.w, height: PANE.h, overflow: "hidden", boxShadow: `0 0 0 1px ${palette.walnut}` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `scale(${PANE.w / W})` }}>{children}</div>
    </div>
    <div style={{ position: "absolute", left: x, top: PANE.y + PANE.h + 22, width: PANE.w, color: palette.bone, fontFamily: fonts.metadata, fontSize: fontSizes.readable, letterSpacing: 2.5, textTransform: "uppercase" }}>
      {label}
    </div>
  </>
);

const TakePair: React.FC<{ first: React.ReactNode; firstLabel: string; retake: React.ReactNode; retakeLabel: string }> = ({ first, firstLabel, retake, retakeLabel }) => (
  <AbsoluteFill style={{ backgroundColor: palette.ink }}>
    <Pane x={PANE.leftX} label={firstLabel}>{first}</Pane>
    <Pane x={PANE.rightX} label={retakeLabel}>{retake}</Pane>
  </AbsoluteFill>
);

/** Both pinned frames of the close-up are the crowd still cropped to cx 0.529, cy 0.385, zoom 2.6. */
const WIDE_SEC = 2;

const RETAKES: { title: string; today: string; durationSec: number; body: React.ReactNode }[] = [
  {
    title: "AI video: in-between of two poses",
    today: "First take: the swimmer dipped under on the way. Retake: told that he stays above the water, and pinned to the corrected last frame.",
    durationSec: 6.6,
    body: <TakePair first={<FullClip name="aigen-04-inbetween" />} firstLabel="First take" retake={<FullClip name="aigen-04-inbetween2" />} retakeLabel="Retake" />,
  },
  {
    title: "AI video: a moving close-up",
    today: "First take: the model cut to a close-up it drew itself, and the blank face gained a nose and mouth. Retake: a cut made in Remotion to a clip pinned between two of the episode's own stills.",
    durationSec: 7.4,
    body: (
      <TakePair
        first={<FullClip name="aigen-06-two-shots" />}
        firstLabel="First take: the model's own cut"
        retake={
          <>
            <Sequence durationInFrames={sec(WIDE_SEC)} layout="none">
              <Img src={still("crowd-4k")} style={{ position: "absolute", inset: 0, width: W, height: H, objectFit: "cover" }} />
            </Sequence>
            <Sequence from={sec(WIDE_SEC)} layout="none">
              <FullClip name="aigen-06-close-turn" />
            </Sequence>
          </>
        }
        retakeLabel="Retake: pinned between two stills"
      />
    ),
  },
  {
    title: "AI video: camera arc",
    today: "Not fixed. First take: a door and a notebook appeared, and the face gained features. Third take, moving behind him with the windows described as empty: a face appears in the window.",
    durationSec: 6,
    body: <TakePair first={<FullClip name="aigen-10-arc" />} firstLabel="First take" retake={<FullClip name="aigen-10-arc3" />} retakeLabel="Third take" />,
  },
];

export const STILLS_REEL_RETAKES_DURATION = RETAKES.reduce((total, s) => total + sec(SLATE_SEC) + sec(s.durationSec), 0);

export const StillsReelRetakes: React.FC = () => (
  <Series>
    {RETAKES.flatMap((s, i) => [
      <Series.Sequence key={`slate-${i}`} durationInFrames={sec(SLATE_SEC)}>
        <Slate index={i + 1} of={RETAKES.length} title={s.title} today={s.today} />
      </Series.Sequence>,
      <Series.Sequence key={`body-${i}`} durationInFrames={sec(s.durationSec)}>
        {s.body}
      </Series.Sequence>,
    ])}
  </Series>
);
