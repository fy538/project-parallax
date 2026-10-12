import { z } from "zod";

const label = z.string().min(1).max(36);
const pause = z.number().min(1).max(8).step(0.1);

export const whatWeCountSchema = z.object({
  title: z.string().min(1).max(42),
  labels: z.object({ machine: label, goal: label, reward: label, forest: label }),
  positions: z.object({
    machineX: z.number().min(220).max(350).step(10),
    forestX: z.number().min(1330).max(1470).step(10),
  }),
  pauses: z.object({ goal: pause, rule: pause, plant: pause, loophole: pause, repeat: pause, diagnosis: pause, repair: pause, mirror: pause }),
  endingHoldSec: z.number().min(1).max(8).step(0.1),
  narrationVolume: z.number().min(0).max(1).step(0.05),
});

export type WhatWeCountProps = z.infer<typeof whatWeCountSchema>;
