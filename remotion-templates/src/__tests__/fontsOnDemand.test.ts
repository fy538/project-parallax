import { describe, expect, it, vi } from "vitest";

// The real loaders register FontFace objects and fetch files; here we only
// need to know which families were asked for.
const loaded: string[] = [];
const fake = (family: string) => ({
  loadFont: () => {
    loaded.push(family);
    return { fontFamily: family };
  },
});
vi.mock("@remotion/google-fonts/IBMPlexSans", () => fake("IBM Plex Sans"));
vi.mock("@remotion/google-fonts/IBMPlexSerif", () => fake("IBM Plex Serif"));
vi.mock("@remotion/google-fonts/IBMPlexMono", () => fake("IBM Plex Mono"));
vi.mock("@remotion/google-fonts/JetBrainsMono", () => fake("JetBrains Mono"));
vi.mock("@remotion/google-fonts/NotoSansSC", () => fake("Noto Sans SC"));
vi.mock("@remotion/google-fonts/NotoSerifSC", () => fake("Noto Serif SC"));
vi.mock("@remotion/google-fonts/NotoSansJP", () => fake("Noto Sans JP"));
vi.mock("@remotion/google-fonts/Oswald", () => fake("Oswald"));
vi.mock("@remotion/google-fonts/Caveat", () => fake("Caveat"));
vi.mock("@remotion/google-fonts/SpecialElite", () => fake("Special Elite"));

describe("Chinese and Japanese fonts load on demand", () => {
  it("does not load them when the theme is imported, only when the Chinese face is read", async () => {
    const { cjkFontsWereRequested } = await import("../design/fonts");
    const { fonts } = await import("../design/theme");
    expect(loaded).toContain("IBM Plex Sans");
    expect(loaded.filter((f) => f.startsWith("Noto"))).toEqual([]);
    expect(cjkFontsWereRequested()).toBe(false);

    // Latin faces never trigger it.
    void fonts.display;
    void fonts.body;
    expect(cjkFontsWereRequested()).toBe(false);

    expect(fonts.chinese).toContain("Noto Sans SC");
    expect(cjkFontsWereRequested()).toBe(true);
    expect(loaded.filter((f) => f.startsWith("Noto")).sort()).toEqual([
      "Noto Sans JP",
      "Noto Sans SC",
      "Noto Serif SC",
    ]);

    // Asking again loads nothing more.
    void fonts.chinese;
    expect(loaded.filter((f) => f.startsWith("Noto")).length).toBe(3);
  });
});
