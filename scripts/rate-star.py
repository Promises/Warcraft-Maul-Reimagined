#!/usr/bin/env python3
"""Draws the gold 5-point star used by the rating panel's star flavour and writes it as a DDS.

A filled gold star with a dark border on a transparent background, supersampled and downscaled
for smooth edges, then converted to DXT5 (alpha-preserving) with ImageMagick. The panel shows it
at full alpha when a star is lit and dimmed when it is empty (see RatePanel.ts, RateStar).

Usage: python3 scripts/rate-star.py [maps/map.w3x/uiImport/Rate/star.dds]
Needs: Pillow and ImageMagick (`magick`).
"""
import math
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

SUPERSAMPLE = 512
OUT_SIZE = 128
OUTER = 0.47      # outer radius as a fraction of the canvas
INNER_RATIO = 0.40  # inner radius as a fraction of the outer
GOLD = (246, 207, 90, 255)
BORDER = (60, 40, 10, 255)


def star_points(cx: float, cy: float, outer: float, inner: float) -> list:
    pts = []
    for i in range(10):
        ang = math.radians(-90 + i * 36)
        rad = outer if i % 2 == 0 else inner
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    return pts


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "maps", "map.w3x", "uiImport", "Rate", "star.dds")
    cx = cy = SUPERSAMPLE / 2
    outer = SUPERSAMPLE * OUTER
    inner = outer * INNER_RATIO
    img = Image.new("RGBA", (SUPERSAMPLE, SUPERSAMPLE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.polygon(star_points(cx, cy, outer + 10, inner + 10), fill=BORDER)
    draw.polygon(star_points(cx, cy, outer, inner), fill=GOLD)
    img = img.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        png = tmp.name
    img.save(png)
    subprocess.run(["magick", png, "-define", "dds:compression=dxt5",
                    "-define", "dds:mipmaps=4", out], check=True)
    os.remove(png)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
