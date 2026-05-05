#!/usr/bin/env node
/**
 * create-template.mjs — Scaffold a new Remotion template with all conventions baked in.
 *
 * Usage:
 *   node scripts/create-template.mjs MyNewTemplate
 *   node scripts/create-template.mjs MyNewTemplate --camera    # Include virtual camera hook
 *   node scripts/create-template.mjs MyNewTemplate --dark      # Default to dark mode
 *
 * Generates:
 *   src/templates/MyNewTemplate/
 *   ├── types.ts           — Data interface with standard fields
 *   ├── MyNewTemplate.tsx  — Component with all hooks + conventions pre-wired
 *   └── index.tsx          — Composition wrapper with calculateMetadata
 *
 * All generated code uses:
 *   - useCompositionAnimation() for Ken Burns + exit fade
 *   - TitleBlock with safeAreaTier="generous"
 *   - Background with atmosphere
 *   - layout.safeAreaTier.generous for all positioning
 *   - exitFade for consistent composition endings
 *   - Proper TypeScript types
 *
 * After generating, you still need to:
 *   1. Add to Root.tsx (import + <Composition /> in appropriate folder)
 *   2. Add to FullEpisode.tsx TEMPLATE_COMPONENTS map
 *   3. Create a sample JSON data file in data/episodes/
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../src/templates");

// ── Parse args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const positional = args.filter((a) => !a.startsWith("--"));

if (positional.length === 0 || args.includes("--help")) {
  console.log(`
create-template — Scaffold a new Remotion template

Usage:
  node scripts/create-template.mjs <TemplateName> [flags]

Flags:
  --camera    Include useTimelineCamera or useTreeCamera hook setup
  --dark      Default to dark background mode
  --help      Show this message

Examples:
  node scripts/create-template.mjs ConflictMatrix
  node scripts/create-template.mjs SupplyChainFlow --camera --dark
`);
  process.exit(0);
}

const templateName = positional[0];
const useCamera = flags.includes("--camera");
const defaultDark = flags.includes("--dark");

// Validate name
if (!/^[A-Z][a-zA-Z0-9]+$/.test(templateName)) {
  console.error(
    `Error: Template name must be PascalCase (e.g., "MyTemplate"). Got: "${templateName}"`
  );
  process.exit(1);
}

const templateDir = path.join(TEMPLATES_DIR, templateName);

if (fs.existsSync(templateDir)) {
  console.error(`Error: Template directory already exists: ${templateDir}`);
  process.exit(1);
}

// ── Generate files ─────────────────────────────────────────────────────────

const defaultMode = defaultDark ? "dark" : "light";

// types.ts
const typesContent = `/**
 * ${templateName} — [DESCRIBE YOUR TEMPLATE HERE]
 *
 * [What does this template visualize? What's the animation sequence?]
 */

export interface ${templateName}Data {
  /** Composition title */
  title: string;
  /** Chinese translation of title */
  titleCn?: string;
  /** Optional subtitle */
  subtitle?: string;

  // ── Template-specific fields ──
  // TODO: Add your data fields here

  // ── Styling ──
  /** Background mode: "light" or "dark" */
  backgroundVariant?: "light" | "dark";
  /** Background tint color */
  backgroundTint?: string;
  /** Primary accent color */
  accentColor?: string;

  // ── Meta ──
  /** Episode identifier */
  episode?: string;
  /** Total duration in seconds */
  durationSec?: number;
}
`;

// Component.tsx
const componentContent = `/**
 * ${templateName} — [DESCRIBE YOUR TEMPLATE HERE]
 *
 * Animation sequence:
 * 1. [Phase 1]
 * 2. [Phase 2]
 * 3. [Exit fade (last 15 frames)]
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  cardPresets,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  slideIn,
  exitFade,
  CLAMP,
  CLAMP_QUAD,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import type { ${templateName}Data } from "./types";

export const ${templateName}: React.FC<{
  data: ${templateName}Data;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mode = (data.backgroundVariant || "${defaultMode}") as "light" | "dark";
  const theme = useThemeMode(mode);
  const { style: compStyle } = useCompositionAnimation();

  // ── Derived values ───────────────────────────────────────────────────
  const accentColor = data.accentColor || "#E5A544"; // brand amber
  const exitOpacity = exitFade(frame, durationInFrames, 15);

  return (
    <Background
      variant={mode}
      tint={data.backgroundTint}
      atmosphere={mode === "dark" ? "normal" : "subtle"}
    >
      <AbsoluteFill style={{ ...compStyle, opacity: exitOpacity }}>
        {/* ── Title ─────────────────────────────────────────────────── */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={mode}
          safeAreaTier="generous"
        />

        {/* ── Main content area ─────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: layout.safeAreaTier.generous.top + layout.spacing.xl,
            left: layout.safeAreaTier.generous.left,
            right: layout.safeAreaTier.generous.right,
            bottom: layout.safeAreaTier.generous.bottom + layout.spacing.lg,
          }}
        >
          {/* TODO: Your template content here */}
        </div>

        {/* ── Episode label ─────────────────────────────────────────── */}
        {data.episode && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeAreaTier.generous.bottom,
              left: layout.safeAreaTier.generous.left,
              fontSize: fontSizes.label,
              color: theme.text.muted,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: fadeIn(frame, 0, sec(1)),
              transform: \`translateY(\${slideIn(frame, 0, 10, sec(0.8))}px)\`,
            }}
          >
            {data.episode}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
`;

// index.tsx
const indexContent = `import { Composition } from "remotion";
import { ${templateName} } from "./${templateName}";
import { layout, sec } from "../../design/theme";
import type { ${templateName}Data } from "./types";

export { ${templateName} } from "./${templateName}";
export type { ${templateName}Data } from "./types";

// TODO: Import sample data JSON once created:
// import sampleData from "../../../data/episodes/YOUR_EPISODE/YOUR_DATA.json";

const PLACEHOLDER_DATA: ${templateName}Data = {
  title: "${templateName} Title",
  subtitle: "Subtitle goes here",
  backgroundVariant: "${defaultMode}",
  episode: "episode-slug",
  durationSec: 10,
};

export const ${templateName}Composition = () => (
  <Composition
    id="${templateName}"
    component={${templateName}}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as ${templateName}Data).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: PLACEHOLDER_DATA as ${templateName}Data }}
  />
);
`;

// ── Write files ────────────────────────────────────────────────────────────

fs.mkdirSync(templateDir, { recursive: true });

fs.writeFileSync(path.join(templateDir, "types.ts"), typesContent);
fs.writeFileSync(
  path.join(templateDir, `${templateName}.tsx`),
  componentContent
);
fs.writeFileSync(path.join(templateDir, "index.tsx"), indexContent);

console.log(`
✓ Created template: ${templateName}

  ${templateDir}/
  ├── types.ts
  ├── ${templateName}.tsx
  └── index.tsx

Next steps:
  1. Edit types.ts — add your data fields
  2. Edit ${templateName}.tsx — build the visualization
  3. Create sample JSON in data/episodes/
  4. Update index.tsx to import the sample data
  5. Add to Root.tsx:
     import { ${templateName}Composition } from "./templates/${templateName}";
     <${templateName}Composition />
  6. Add to FullEpisode.tsx TEMPLATE_COMPONENTS map:
     import { ${templateName} } from "../${templateName}/${templateName}";
     ${templateName},
  7. Run: npx tsc --noEmit
  8. Preview: npm run snapshot ${templateName}
`);
