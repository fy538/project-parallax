import { z } from "zod";

const shortLabel = z.string().min(1).max(32);
const pause = z.number().min(1).max(8).step(0.1);
const position = z.object({
  x: z.number().min(150).max(1720).step(10),
  y: z.number().min(390).max(780).step(10),
});

export const promiseAndCopySchema = z.object({
  title: z.string().min(1).max(46),
  labels: z.object({
    promise: z.string().min(1).max(48),
    original: shortLabel,
    successorA: shortLabel,
    successorB: shortLabel,
    forest: shortLabel,
  }),
  // Empty means the bundled, code-drawn forest. Otherwise a path under public/.
  imageSrc: z.string(),
  positions: z.object({
    original: position,
    successorA: position,
    successorB: position,
    forest: z.object({
      x: z.number().min(1270).max(1580).step(10),
      y: z.number().min(560).max(630).step(10),
      size: z.number().min(320).max(500).step(10),
    }),
  }),
  pauses: z.object({
    promise: pause,
    copy: pause,
    question: pause,
    possibility: pause,
    human: pause,
    closing: pause,
  }),
  endingHoldSec: z.number().min(1).max(8).step(0.1),
  narrationVolume: z.number().min(0).max(1).step(0.05),
});

export type PromiseAndCopyProps = z.infer<typeof promiseAndCopySchema>;
