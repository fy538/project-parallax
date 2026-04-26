/**
 * Data types for the KineticTypography template.
 *
 * Animated quotes, definitions, and bilingual text displays.
 */

export interface QuoteData {
  episode: string;
  variant: "quote" | "definition" | "bilingual" | "statistic";

  // For quotes
  text?: string;
  attribution?: string;
  attributionContext?: string; // e.g., "Founder of TSMC, 2024"

  // For definitions
  term?: string;
  termPinyin?: string; // For Chinese terms: "kǎ bózi"
  termTranslation?: string; // "Stranglehold technology"
  definitionText?: string;

  // For bilingual display
  chineseText?: string;
  englishText?: string;

  // For statistics
  statValue?: string; // "7%"
  statLabel?: string; // "of US chip demand"
  statContext?: string; // "Despite $165B investment"

  // Styling
  accentColor?: string;
  backgroundVariant?: "dark" | "light";
  durationSec?: number;
}
