"""
Quick composite preview — overlays a sample EditorialFrame variant="hero"
foreground onto each backdrop in design-references/backdrops/.

This is a POC test only. Production rendering happens in Remotion.
Fonts here approximate (Liberation Sans for Plex Sans).
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ── Paths ────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]
BACKDROPS = ROOT / "remotion-templates/design-references/backdrops"
OUTPUT = ROOT / "remotion-templates/design-references/backdrops/composites"
OUTPUT.mkdir(parents=True, exist_ok=True)

# ── Fonts (Liberation Sans as Plex Sans stand-in) ────────────────────────
F_DISPLAY = "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"
F_HEADING = "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"
F_BODY = "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"
F_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

# ── Palette ──────────────────────────────────────────────────────────────
INK = (28, 24, 20)
AMBER = (229, 165, 68)
RUST = (194, 59, 34)
WALNUT = (92, 74, 61)
UMBER = (139, 115, 85)
PAPER = (245, 240, 232)


def opacity(rgb, alpha):
    """RGB + alpha (0-255) → RGBA tuple."""
    return (rgb[0], rgb[1], rgb[2], alpha)


def composite_frame(backdrop_path: Path, output_path: Path, flipped: bool = False):
    """Composite the EditorialFrame variant='hero' foreground onto a backdrop.

    flipped=True swaps hero-block (left → right) and chart (right → left). Used
    for backdrops with right-side anchor elements (reading-room book wall) so
    foreground doesn't compete with the backdrop's visual interest.
    """
    bg = Image.open(backdrop_path).convert("RGBA")
    bg = bg.resize((1920, 1080), Image.LANCZOS)

    fg = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(fg)

    # Layout zones flip horizontally when flipped=True
    if flipped:
        hero_x = 1080  # hero block on right two-thirds
        chart_x0 = 140  # chart on left two-thirds
        anchor_align = "right"
    else:
        hero_x = 108  # hero block on left two-thirds
        chart_x0 = 1080  # chart on right two-thirds
        anchor_align = "left"

    # Kicker — rust rule + lowercase tracked mono label (channel-default top-left anchor)
    d.rectangle([(108, 96), (188, 100)], fill=RUST + (255,))
    f_kicker = ImageFont.truetype(F_MONO, 22)
    d.text((208, 86), "iterated prisoner's dilemma", font=f_kicker, fill=INK + (255,), spacing=4)

    # Hero number — display weight, large
    f_hero = ImageFont.truetype(F_DISPLAY, 260)
    if flipped:
        # Right-align the hero number
        hero_text = "23%"
        hero_w = d.textbbox((0, 0), hero_text, font=f_hero)[2]
        d.text((1800 - hero_w, 220), hero_text, font=f_hero, fill=INK + (255,))
    else:
        d.text((hero_x, 220), "23%", font=f_hero, fill=INK + (255,))

    # Headline — sentence case question form, two lines
    f_headline = ImageFont.truetype(F_HEADING, 48)
    headline_lines = ["Does cooperation", "need memory?"]
    for i, line in enumerate(headline_lines):
        if flipped:
            line_w = d.textbbox((0, 0), line, font=f_headline)[2]
            d.text((1800 - line_w, 530 + i * 60), line, font=f_headline, fill=INK + (255,))
        else:
            d.text((hero_x, 530 + i * 60), line, font=f_headline, fill=INK + (255,))

    # Body — small, slightly muted
    f_body = ImageFont.truetype(F_BODY, 26)
    body_lines = [
        "Cooperation rate after 200 rounds when",
        "players cannot recall prior moves.",
    ]
    for i, line in enumerate(body_lines):
        if flipped:
            line_w = d.textbbox((0, 0), line, font=f_body)[2]
            d.text(
                (1800 - line_w, 680 + i * 36),
                line,
                font=f_body,
                fill=opacity(INK, 180),
            )
        else:
            d.text((hero_x, 680 + i * 36), line, font=f_body, fill=opacity(INK, 180))

    # Chart — opposite side from hero block. NO PANEL.
    chart_y0 = 240
    chart_w, chart_h = 660, 440
    # Axes
    d.line(
        [(chart_x0, chart_y0 + chart_h), (chart_x0 + chart_w, chart_y0 + chart_h)],
        fill=INK + (255,),
        width=2,
    )
    d.line(
        [(chart_x0, chart_y0), (chart_x0, chart_y0 + chart_h)],
        fill=INK + (255,),
        width=2,
    )
    # Gridlines — dashed, low opacity
    for i in range(1, 4):
        y = chart_y0 + chart_h * i / 4
        for x in range(chart_x0 + 4, chart_x0 + chart_w, 8):
            d.line([(x, y), (x + 3, y)], fill=opacity(INK, 50), width=1)
    # Series 1 — amber rising (tit-for-tat)
    rising = [
        (chart_x0 + chart_w * t / 5, chart_y0 + chart_h - chart_h * v / 100)
        for t, v in enumerate([8, 30, 55, 72, 84, 90])
    ]
    for a, b in zip(rising, rising[1:]):
        d.line([a, b], fill=AMBER + (255,), width=5)
    # Series 2 — rust falling (no memory)
    falling = [
        (chart_x0 + chart_w * t / 5, chart_y0 + chart_h - chart_h * v / 100)
        for t, v in enumerate([48, 32, 22, 14, 9, 6])
    ]
    for a, b in zip(falling, falling[1:]):
        d.line([a, b], fill=RUST + (255,), width=5)

    # Y-axis labels
    f_axis = ImageFont.truetype(F_MONO, 18)
    for label, y in [("100", chart_y0), ("50", chart_y0 + chart_h / 2), ("0", chart_y0 + chart_h)]:
        d.text((chart_x0 - 45, y - 10), label, font=f_axis, fill=opacity(INK, 180))
    # X-axis labels
    for label, x in [("0", chart_x0), ("100", chart_x0 + chart_w / 2), ("200", chart_x0 + chart_w)]:
        d.text((x - 14, chart_y0 + chart_h + 10), label, font=f_axis, fill=opacity(INK, 180))
    # Axis title
    d.text((chart_x0, chart_y0 - 36), "cooperation rate (%)", font=f_axis, fill=opacity(INK, 200))
    # Series labels
    f_series = ImageFont.truetype(F_BODY, 18)
    d.text(
        (chart_x0 + chart_w + 12, chart_y0 + chart_h - chart_h * 90 / 100 - 12),
        "tit-for-tat",
        font=f_series,
        fill=AMBER + (255,),
    )
    d.text(
        (chart_x0 + chart_w + 12, chart_y0 + chart_h - chart_h * 6 / 100 - 12),
        "no memory",
        font=f_series,
        fill=RUST + (255,),
    )

    # Brand mark — ∴ in hairline circle. Opposite corner from hero block.
    if flipped:
        bm_x, bm_y = 160, 880  # lower-left when flipped
    else:
        bm_x, bm_y = 1760, 880  # lower-right (channel default)
    bm_r = 28
    d.ellipse(
        [(bm_x - bm_r, bm_y - bm_r), (bm_x + bm_r, bm_y + bm_r)],
        outline=INK + (255,),
        width=2,
    )
    f_mark = ImageFont.truetype(F_DISPLAY, 38)
    d.text((bm_x - 13, bm_y - 24), "∴", font=f_mark, fill=INK + (255,))

    # Byline — bottom edge, opposite side from brand mark. Channel-default left
    # when not flipped; bottom-right when flipped (so brand-mark can sit lower-left).
    f_byline = ImageFont.truetype(F_MONO, 18)
    byline = "parallax  ·  prisoner's dilemma  ·  2026"
    if flipped:
        byline_w = d.textbbox((0, 0), byline, font=f_byline)[2]
        d.rectangle([(1800 - 80, 950), (1800, 952)], fill=INK + (255,))
        d.text((1800 - byline_w, 980), byline, font=f_byline, fill=opacity(INK, 160), spacing=2)
    else:
        d.rectangle([(108, 950), (188, 952)], fill=INK + (255,))
        d.text((108, 980), byline, font=f_byline, fill=opacity(INK, 160), spacing=2)

    out = Image.alpha_composite(bg, fg)
    out.convert("RGB").save(output_path, "PNG", optimize=True)
    print(f"  → {output_path.name}")


# Pairing rules: which variant works with each backdrop.
# Right-anchored backdrops → flipped (chart on left, away from backdrop anchor).
# Left-anchored backdrops → standard (chart on right, away from anchor).
# Bottom-/centered-/no-anchor backdrops → standard.
PAIRINGS = {
    "horizon": False,           # bottom anchor — either works, default
    "twilight-skyline": False,  # bottom anchor — either works, default
    "cartographic": False,      # subtle texture, left-leaning — standard avoids it
    "empty-plaza": False,       # centered anchor — sits in the gap with standard
    "reading-room": True,       # right-side book wall → flip to put hero on right
    "industrial-yard": False,   # left silhouette — keep hero left so body sits above
}


def main():
    backdrops = sorted(BACKDROPS.glob("editorial-backdrop-*.png"))
    if not backdrops:
        print("No backdrops found.")
        return
    print(f"Compositing foreground onto {len(backdrops)} backdrop(s)…")
    for bd in backdrops:
        slug = bd.stem.replace("editorial-backdrop-", "").replace("-v1", "")
        flipped = PAIRINGS.get(slug, False)
        suffix = "-flipped" if flipped else ""
        out = OUTPUT / f"composite-{slug}{suffix}.png"
        composite_frame(bd, out, flipped=flipped)
    print(f"\nDone. Composites saved to {OUTPUT}")


if __name__ == "__main__":
    main()
