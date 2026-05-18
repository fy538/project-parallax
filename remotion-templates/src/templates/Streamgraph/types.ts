/**
 * Streamgraph — stacked area chart with a CENTERED baseline (silhouette
 * offset) so the total composition flows as a "river" rather than rising
 * from a zero axis. Canonical NYT / Pudding form for "X composition
 * shifted over decades" stories.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  StreamPointSchema,
  StreamSeriesSchema,
  StreamOffsetSchema,
  StreamValueFormatSchema,
  StreamAggregateOtherSchema,
  StreamgraphDataSchema,
} from "./schema";

export type StreamPoint = z.infer<typeof StreamPointSchema>;
export type StreamSeries = z.infer<typeof StreamSeriesSchema>;
export type StreamOffset = z.infer<typeof StreamOffsetSchema>;
export type StreamValueFormat = z.infer<typeof StreamValueFormatSchema>;
export type StreamAggregateOther = z.infer<typeof StreamAggregateOtherSchema>;
export type StreamgraphData = z.infer<typeof StreamgraphDataSchema>;
