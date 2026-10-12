import { Composition } from "remotion";
import { TelegramCable } from "./TelegramCable";
import { standardMetadata } from "../../utils/composition";
import { TelegramCableSchema } from "./schema";
import type { TelegramCableData } from "./types";

// Default props — Kennan's Long Telegram (excerpt). The canonical
// diplomatic cable for the Parallax register: George F. Kennan to
// Secretary of State, 22 February 1946, Moscow Embassy. Diagnoses
// the structural sources of Soviet conduct; becomes the intellectual
// foundation for containment doctrine.
export const telegramCableSampleData: TelegramCableData = {
  episode: "containment-doctrine",
  source: "Foreign Relations of the United States, 1946, Vol. VI",
  title: "THE LONG TELEGRAM",
  subtitle: "Kennan to Washington, 22 February 1946 — excerpt.",
  header: {
    from: "AMEMBASSY MOSCOW",
    to: "SECRETARY OF STATE WASHINGTON",
    subject: "SOURCES OF SOVIET CONDUCT",
    dateTimeGroup: "220900Z FEB 46",
    fileNumber: "861.00/2-2246",
    transmissionType: "INCOMING TELEGRAM",
  },
  classification: "SECRET",
  declassified: true,
  declassifiedDate: "1972",
  beginEndMarkers: { begin: "SUMMARY", end: "SUMMARY" },
  body:
    "At bottom of Kremlin's neurotic view of world affairs is traditional and instinctive Russian sense of insecurity.\n\nOriginally, this was insecurity of a peaceful agricultural people trying to live on vast exposed plain in neighborhood of fierce nomadic peoples.\n\nTo this was added, as Russia came into contact with economically advanced West, fear of more competent, more powerful, more highly organized societies in that area.\n\nBut this latter type of insecurity was one which afflicted rather Russian rulers than Russian people; for Russian rulers have invariably sensed that their rule was relatively archaic in form, fragile and artificial in its psychological foundation.",
  numberedParagraphs: true,
  paper: "onionskin",
  aged: 0.35,
  punchHoles: true,
  annotations: [
    {
      target: "TRADITIONAL AND INSTINCTIVE RUSSIAN SENSE OF INSECURITY",
      type: "highlight",
      appearAtSec: 4,
    },
    {
      target: "FIERCE NOMADIC PEOPLES",
      type: "circle",
      appearAtSec: 7,
    },
    {
      target: "FIERCE NOMADIC PEOPLES",
      type: "margin-note",
      note:
        "Kennan's geographic determinism — the open steppe as a recurring source of strategic anxiety.",
      appearAtSec: 8.5,
    },
    {
      target: "ARCHAIC IN FORM, FRAGILE AND ARTIFICIAL",
      type: "numbered",
      note:
        "Foreshadows Kennan's collapse thesis — Soviet legitimacy is structurally unsustainable. Restated in 'Sources of Soviet Conduct' (1947).",
      appearAtSec: 13,
    },
  ],
  redactions: [
    // Demonstration redaction — a phrase blacked out with exemption code.
    {
      target: "RUSSIAN RULERS HAVE INVARIABLY SENSED",
      exemptionCode: "(b)(1)",
    },
  ],
  durationSec: 22,
};

export const TelegramCableComposition = () => (
  <Composition
    id="TelegramCable"
    component={TelegramCable}
    schema={TelegramCableSchema}
    calculateMetadata={standardMetadata<TelegramCableData>(20)}
    defaultProps={{ data: telegramCableSampleData as TelegramCableData }}
  />
);
