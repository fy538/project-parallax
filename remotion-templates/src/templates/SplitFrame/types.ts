import type { z } from "zod";
import type { SplitPaneSchema, SplitFrameDataSchema } from "./schema";

export type SplitPane = z.infer<typeof SplitPaneSchema>;
export type SplitFrameData = z.infer<typeof SplitFrameDataSchema>;
