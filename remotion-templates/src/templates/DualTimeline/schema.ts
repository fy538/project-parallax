import { z } from "zod";

export const DualTimelineSchema = z.object({
  data: z.object({
    title: z.string().describe("Main title of the dual timeline"),
    titleCn: z.string().optional().describe("Chinese translation of title"),
    subtitle: z.string().optional().describe("Optional subtitle"),
    eraATitle: z.string().describe("Label for era A column"),
    eraBTitle: z.string().describe("Label for era B column"),
    eraAColor: z.string().describe("Accent color for era A (hex)"),
    eraBColor: z.string().describe("Accent color for era B (hex)"),
    pairs: z.array(
      z.object({
        eraA: z.object({
          label: z.string().describe("Year/date label for era A event"),
          text: z.string().describe("Event description for era A"),
          textCn: z.string().optional().describe("Chinese translation"),
        }),
        eraB: z.object({
          label: z.string().describe("Year/date label for era B event"),
          text: z.string().describe("Event description for era B"),
          textCn: z.string().optional().describe("Chinese translation"),
        }),
        connection: z.string().optional().describe("Label for connecting line between events"),
      })
    ),
    episode: z.string().optional().describe("Episode identifier"),
    backgroundVariant: z.enum(["light", "dark"]).optional().default("light"),
    durationSec: z.number().optional().describe("Total duration in seconds"),
    _direction: z.unknown().optional(),
  }),
});
