"""
Build a 3x2 contact sheet of all backdrop composites for side-by-side viewing.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
COMPOSITES = ROOT / "remotion-templates/design-references/backdrops/composites"
OUT = COMPOSITES / "contact-sheet.png"

# Order optimized so most successful examples are top-left, conflict cases bottom
ORDER = [
    "composite-cartographic.png",
    "composite-horizon.png",
    "composite-twilight-skyline.png",
    "composite-empty-plaza.png",
    "composite-industrial-yard.png",
    "composite-reading-room-flipped.png",
]

LABEL_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def main():
    tile_w, tile_h = 960, 540  # half-resolution for sheet (6 tiles @ 1920x1080 each)
    label_h = 38
    cols, rows = 3, 2
    gap = 16
    sheet_w = cols * tile_w + (cols + 1) * gap
    sheet_h = rows * (tile_h + label_h) + (rows + 1) * gap

    sheet = Image.new("RGB", (sheet_w, sheet_h), (245, 240, 232))
    d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype(LABEL_FONT, 18)

    for i, name in enumerate(ORDER):
        col = i % cols
        row = i // cols
        x = gap + col * (tile_w + gap)
        y = gap + row * (tile_h + label_h + gap)
        img = Image.open(COMPOSITES / name).convert("RGB").resize((tile_w, tile_h), Image.LANCZOS)
        sheet.paste(img, (x, y))
        label = name.replace("composite-", "").replace(".png", "")
        d.text((x + 4, y + tile_h + 8), label, font=f, fill=(28, 24, 20))

    sheet.save(OUT, "PNG", optimize=True)
    print(f"Contact sheet → {OUT}")


if __name__ == "__main__":
    main()
