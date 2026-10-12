import { Composition } from "remotion";
import { HandwrittenLetter } from "./HandwrittenLetter";
import { standardMetadata } from "../../utils/composition";
import { HandwrittenLetterSchema } from "./schema";
import type { HandwrittenLetterData } from "./types";

// Default props — typeset mode demonstrating the Sullivan Ballou letter
// (Maj. Sullivan Ballou to his wife Sarah, July 14, 1861, one week before
// Bull Run). The Burns canonical reference for handwritten correspondence.
// Photograph mode would normally be preferred, but this default avoids
// requiring an external image URL for the catalog preview.
export const handwrittenLetterSampleData: HandwrittenLetterData = {
  episode: "civil-war-correspondence",
  source: "Library of Congress, Sullivan Ballou Papers",
  mode: "typeset",
  dateline: "Camp Clark, Washington · July 14, 1861",
  salutation: "My very dear Sarah,",
  signature: "Yours, ever yours,\nSullivan",
  paragraphs: [
    {
      text:
        "The indications are very strong that we shall move in a few days — perhaps tomorrow. Lest I should not be able to write you again, I feel impelled to write lines that may fall under your eye when I shall be no more.",
      appearAtSec: 0.5,
    },
    {
      text:
        "I have no misgivings about, or lack of confidence in, the cause in which I am engaged, and my courage does not halt or falter.",
      appearAtSec: 5,
    },
    {
      text:
        "Sarah, my love for you is deathless. It seems to bind me with mighty cables that nothing but Omnipotence could break.",
      appearAtSec: 9,
      emphasis: "key",
    },
    {
      text:
        "If I do not return, my dear Sarah, never forget how much I love you. And when my last breath escapes me on the battlefield, it will whisper your name.",
      appearAtSec: 14,
    },
  ],
  durationSec: 20,
};

export const HandwrittenLetterComposition = () => (
  <Composition
    id="HandwrittenLetter"
    component={HandwrittenLetter}
    schema={HandwrittenLetterSchema}
    calculateMetadata={standardMetadata<HandwrittenLetterData>(16)}
    defaultProps={{ data: handwrittenLetterSampleData as HandwrittenLetterData }}
  />
);
