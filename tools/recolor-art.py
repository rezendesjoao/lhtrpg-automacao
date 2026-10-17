"""Recolor the system's sheet artwork into the parchment & green palette of the module's theme.

    python tools/recolor-art.py [path to the lhtrpg system]      (default: ../LHTTRPG)

The shapes stay the same (same alpha); only the colours change: the dark panel fill becomes
parchment (with a light paper grain), the grey outline dark green, the mint lines mid green, the
cream band gold, the inner diamond deep green. Writes assets/ui/*.webp (and the navigation / inventory
icons) next to this module.
"""
import os, sys, random, colorsys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SYSTEM = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), "LHTTRPG")
SRC = os.path.join(SYSTEM, "assets", "ui")
OUT = os.path.join(ROOT, "assets", "ui")

PARCH = (239, 227, 195)
PARCH_DARK = (216, 200, 156)
CREAM = (243, 234, 210)
GREEN_DEEP = (22, 50, 31)
GREEN = (31, 90, 58)
GREEN_MID = (61, 143, 97)
GREEN_LIGHT = (143, 207, 155)
GOLD = (201, 169, 78)
GOLD_DARK = (138, 109, 31)

def classify(r, g, b):
    """Palette colour for an original pixel (None keeps it)."""
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    mx, mn = max(r, g, b), min(r, g, b)
    grey = (mx - mn) < 22
    if mx <= 36: return "fill"                       # the dark panel fill (#101818, #001810, #082018)
    if grey and mx < 150: return GREEN_DEEP          # the panel outline (#202828, #586058, #6f7a72)
    if grey: return CREAM                            # whites (#f8f8f8)
    if l > 0.9 and s < 0.5: return CREAM
    if 0.25 <= h <= 0.55:                            # greens and mints
        return GREEN_MID if l > 0.45 else GREEN      # lines, diamond outer (#78e898, #48d0b0) / deep (#005830)
    if 0.1 <= h < 0.25:                              # cream / olive band (#c0c870)
        return GOLD if l < 0.75 else CREAM
    if 0.6 <= h <= 0.9:                              # purple / blue (equipped frame) -> gold
        return GOLD if l > 0.4 else GOLD_DARK
    return None

def recolor(name, grain=True):
    im = Image.open(os.path.join(SRC, name)).convert("RGBA")
    px = im.load()
    rnd = random.Random(7)
    w, hgt = im.size
    for y in range(hgt):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0: continue
            c = classify(r, g, b)
            if c is None: continue
            if c == "fill":
                n = rnd.randint(-7, 7) if grain else 0
                # a touch darker towards the edges of big panels (vignette)
                v = 0
                if w > 400:
                    dx, dy = abs(x - w / 2) / (w / 2), abs(y - hgt / 2) / (hgt / 2)
                    v = int(-10 * max(dx, dy) ** 2)
                c = tuple(max(0, min(255, ch + n + v)) for ch in PARCH)
            px[x, y] = (c[0], c[1], c[2], a)
    os.makedirs(os.path.dirname(os.path.join(OUT, name)), exist_ok=True)
    im.save(os.path.join(OUT, name), "WEBP", lossless=True)
    return im

FILES = ["bg_charsheet.webp", "bg_charsheet_notitle.webp", "info_window.webp", "info_window_short.webp", "confirm-tab.webp",
         "uncollapse.webp", "button_close.webp", "navigation/skills.webp", "navigation/items.webp", "navigation/bio.webp",
         "inventory/item-bg.webp", "inventory/equipped-bg.webp"]
if __name__ == "__main__":
    done = {}
    for f in FILES:
        done[f] = recolor(f)
        print("ok", f)
    # contact sheet for review: the two frames on top, the small pieces in a row below
    def thumb(im, size):
        t = im.copy()
        t.thumbnail(size)
        bg = Image.new("RGBA", t.size, (90, 90, 90, 255))
        bg.alpha_composite(t)
        return bg.convert("RGB")
    sheet = Image.new("RGB", (1100, 760), (90, 90, 90))
    x = 10
    for f in [f for f in done if "bg_charsheet" in f]:
        sheet.paste(thumb(done[f], (520, 520)), (x, 10)); x += 530
    x = 10
    for f in [f for f in done if "bg_charsheet" not in f]:
        t = thumb(done[f], (200, 100))
        sheet.paste(t, (x, 560)); x += t.size[0] + 12
    preview = os.path.join(HERE, "_preview.png")  # next to this script, outside the packaged assets
    sheet.save(preview)
    print("preview:", preview)
