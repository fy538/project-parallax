/**
 * resolveSeams — what a manifest transition renders as on the FullEpisode
 * timeline. Locks the rules: fade dips through ink, color-wash keeps its
 * colour, a one-sided dip is completed on the adjoining segment, a dissolve
 * becomes a real cross-dissolve through a short tail on the outgoing segment,
 * a layered card can sit over the held picture before it, and iris /
 * match-cut resolve to a cut.
 */
import { describe, it, expect, afterEach } from "vitest";
import { resolveSeams, DEFAULT_DISSOLVE_SEC } from "../utils/resolveSeams";
import { exitFade, setSeamsOwnedByEpisode } from "../utils/animation";
import { palette } from "../design/theme";

describe("resolveSeams", () => {
  it("defaults to cuts", () => {
    const r = resolveSeams([{ id: "a", startSec: 0, endSec: 5 }]);
    expect(r.a.transitionIn).toBe("cut");
    expect(r.a.transitionOut).toBe("cut");
  });

  it("resolves iris and the match-cuts to a cut, with no tail", () => {
    for (const t of ["iris", "match-cut", "match-cut-still"] as const) {
      const r = resolveSeams([
        { id: "a", startSec: 0, endSec: 5, transition: { out: t } },
        { id: "b", startSec: 5, endSec: 9, transition: { in: t } },
      ]);
      expect(r.a.transitionOut).toBe("cut");
      expect(r.b.transitionIn).toBe("cut");
      expect(r.a.tailSec).toBeUndefined();
    }
  });

  it("cross-dissolves by fading the incoming segment in over a held tail", () => {
    const r = resolveSeams([
      { id: "a", startSec: 0, endSec: 5, layer: "background" },
      { id: "b", startSec: 5, endSec: 9, layer: "background", transition: { in: "dissolve", durationSec: 0.4 } },
    ]);
    expect(r.a.tailSec).toBe(0.4);
    expect(r.a.transitionOut).toBe("cut");
    expect(r.b.transitionIn).toBe("fade");
    expect(r.b.inDurationSec).toBe(0.4);
  });

  it("fades a foreground card OUT over an incoming picture, since the card is on top", () => {
    const r = resolveSeams([
      { id: "card", startSec: 0, endSec: 5, layer: "foreground", transition: { out: "dissolve", durationSec: 1 } },
      { id: "pic", startSec: 5, endSec: 9, layer: "background" },
    ]);
    expect(r.card.tailSec).toBe(1);
    expect(r.card.transitionOut).toBe("fade");
    expect(r.card.outDurationSec).toBe(1);
    expect(r.pic.transitionIn).toBe("cut");
  });

  it("uses the default dissolve length, and lets the incoming side own the seam", () => {
    const r = resolveSeams([
      { id: "a", startSec: 0, endSec: 5, layer: "foreground", transition: { out: "dissolve", durationSec: 2 } },
      { id: "b", startSec: 5, endSec: 9, layer: "foreground", transition: { in: "dissolve" } },
    ]);
    expect(r.a.tailSec).toBe(DEFAULT_DISSOLVE_SEC);
    expect(r.b.inDurationSec).toBe(DEFAULT_DISSOLVE_SEC);
  });

  it("cuts instead of dissolving across a gap, and lets a dip win the seam", () => {
    const gap = resolveSeams([
      { id: "a", startSec: 0, endSec: 5 },
      { id: "b", startSec: 6, endSec: 9, transition: { in: "dissolve" } },
    ]);
    expect(gap.b.transitionIn).toBe("cut");
    expect(gap.a.tailSec).toBeUndefined();

    const dip = resolveSeams([
      { id: "a", startSec: 0, endSec: 5, transition: { out: "color-wash", washColor: "#123456" } },
      { id: "b", startSec: 5, endSec: 9, transition: { in: "dissolve" } },
    ]);
    expect(dip.b.transitionIn).toBe("color-wash");
    expect(dip.a.tailSec).toBeUndefined();
  });

  it("holds a picture under the layered card that follows it", () => {
    const r = resolveSeams([
      { id: "pic", startSec: 0, endSec: 5, layer: "background" },
      { id: "card", startSec: 5, endSec: 12, layer: "foreground", layered: { backgroundSegmentId: "pic" } },
    ]);
    expect(r.card.holdUnder).toBe(true);
    expect(r.pic.tailSec).toBe(7);
    expect(r.pic.transitionOut).toBe("cut");
    // A layered card over a picture that is not the one before it is not hold-under.
    const other = resolveSeams([
      { id: "pic", startSec: 0, endSec: 5, layer: "background" },
      { id: "card", startSec: 5, endSec: 12, layer: "foreground", layered: { backgroundSegmentId: "elsewhere" } },
    ]);
    expect(other.card.holdUnder).toBeUndefined();
    expect(other.pic.tailSec).toBeUndefined();
  });

  it("keeps the picture under a hold-under card while that card dissolves out", () => {
    const r = resolveSeams([
      { id: "pic", startSec: 0, endSec: 5, layer: "background" },
      {
        id: "card", startSec: 5, endSec: 12, layer: "foreground",
        layered: { backgroundSegmentId: "pic" },
        transition: { out: "dissolve", durationSec: 0.5 },
      },
      { id: "diagram", startSec: 12, endSec: 20, layer: "foreground" },
    ]);
    // The card is held for the dissolve and the diagram fades in over it…
    expect(r.card.tailSec).toBe(0.5);
    expect(r.card.transitionOut).toBe("cut");
    expect(r.diagram.transitionIn).toBe("fade");
    expect(r.diagram.inDurationSec).toBe(0.5);
    // …so the picture stays for the card and for the card's tail.
    expect(r.pic.tailSec).toBe(7.5);
  });

  it("turns fade into a dip through ink on both sides of the seam", () => {
    const r = resolveSeams([
      { id: "a", startSec: 0, endSec: 5 },
      { id: "b", startSec: 5, endSec: 9, transition: { in: "fade", durationSec: 0.6 } },
    ]);
    expect(r.b.transitionIn).toBe("color-wash");
    expect(r.b.inWashColor).toBe(palette.ink);
    expect(r.a.transitionOut).toBe("color-wash");
    expect(r.a.outWashColor).toBe(palette.ink);
    expect(r.a.outDurationSec).toBe(0.6);
    // The outgoing segment's own entry is untouched.
    expect(r.a.transitionIn).toBe("cut");
  });

  it("completes a dip that only the outgoing side asked for", () => {
    const r = resolveSeams([
      { id: "a", startSec: 0, endSec: 5, transition: { out: "color-wash", washColor: "#123456" } },
      { id: "b", startSec: 5, endSec: 9 },
    ]);
    expect(r.b.transitionIn).toBe("color-wash");
    expect(r.b.inWashColor).toBe("#123456");
  });

  it("leaves an already-paired dip and non-adjacent segments alone", () => {
    const r = resolveSeams([
      { id: "a", startSec: 0, endSec: 5, transition: { out: "color-wash", washColor: "#111111", durationSec: 0.4 } },
      { id: "b", startSec: 5, endSec: 9, transition: { in: "color-wash", washColor: "#222222", durationSec: 0.7 } },
      { id: "c", startSec: 12, endSec: 15, transition: { in: "fade" } },
    ]);
    expect(r.a.outWashColor).toBe("#111111");
    expect(r.b.inWashColor).toBe("#222222");
    expect(r.b.transitionOut).toBe("cut"); // 3s gap before c — nothing to pair with
  });

  it("is order-independent", () => {
    const r = resolveSeams([
      { id: "b", startSec: 5, endSec: 9, transition: { in: "fade" } },
      { id: "a", startSec: 0, endSec: 5 },
    ]);
    expect(r.a.transitionOut).toBe("color-wash");
  });
});

describe("seam ownership", () => {
  afterEach(() => setSeamsOwnedByEpisode(false));

  it("exitFade stays at 1 while an episode owns the seams", () => {
    expect(exitFade(90, 90)).toBe(0);
    setSeamsOwnedByEpisode(true);
    expect(exitFade(90, 90)).toBe(1);
    expect(exitFade(80, 90)).toBe(1);
    setSeamsOwnedByEpisode(false);
    expect(exitFade(90, 90)).toBe(0);
  });
});
