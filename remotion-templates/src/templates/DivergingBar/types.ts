import type { z } from "zod";
import type { DivergingBarDataSchema, DivergingBarItemSchema } from "./schema";

export type DivergingBarData = z.infer<typeof DivergingBarDataSchema>;
export type DivergingBarItem = z.infer<typeof DivergingBarItemSchema>;
