"""Builds the scroll-scrubbed film reel for The Collection.

Placeholder version: a graded Ken Burns pass over the six car plates with short crossfades,
written as a JPEG frame sequence the section draws to a canvas as you scroll. Replace with a
real render / footage export (same file naming) when the final plates exist.

    python scripts/build-reel.py

Writes public/reel/f_000.jpg … and public/reel/manifest.json.
"""
import json
import os
from PIL import Image, ImageEnhance, ImageOps, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "img")
OUT = os.path.join(ROOT, "public", "reel")
W, H = 1024, 576
FPC = 16          # frames per car
XF = 4            # crossfade length (frames) centred on each cut
QUALITY = 68

# same order as CARS in src/content/site.ts
CARS = [
    ("car_etype.jpg", 0.50, 0.56),
    ("car_300sl.jpg", 0.50, 0.44),
    ("car_356.jpg", 0.52, 0.55),
    ("car_db5.jpg", 0.50, 0.55),
    ("car_250.jpg", 0.50, 0.55),
    ("car_maserati.jpg", 0.50, 0.55),
]


def lerp(a, b, t):
    return a + (b - a) * t


def vignette():
    m = Image.new("L", (W, H), 0)
    px = m.load()
    cx, cy = W / 2, H / 2
    for y in range(H):
        for x in range(W):
            d = (((x - cx) / cx) ** 2 + ((y - cy) / cy) ** 2) ** 0.5
            v = 255 - int(max(0.0, d - 0.5) / 0.9 * 90)
            px[x, y] = max(150, min(255, v))
    return m.filter(ImageFilter.GaussianBlur(40))


VIG = vignette()
BLACK = Image.new("RGB", (W, H), (8, 7, 6))


def grade(img):
    img = ImageEnhance.Color(img).enhance(0.8)
    img = ImageEnhance.Contrast(img).enhance(1.2)
    img = ImageEnhance.Brightness(img).enhance(1.02)
    warm = ImageOps.colorize(ImageOps.grayscale(img), black=(16, 12, 8), white=(255, 244, 224))
    img = Image.blend(img, warm, 0.22)
    return Image.composite(img, BLACK, VIG)


def frame(src, cx, cy, t, k):
    """Ken Burns frame t (0..1, may run slightly outside) of plate k."""
    sw, sh = src.size
    base = max(W / sw, H / sh)
    if k % 2 == 0:
        z = lerp(1.0, 1.16, t)
        x = lerp(cx - 0.03, cx + 0.03, t)
    else:
        z = lerp(1.16, 1.0, t)
        x = lerp(cx + 0.03, cx - 0.03, t)
    y = lerp(cy - 0.015, cy + 0.015, t)
    cw, ch = W / (base * z), H / (base * z)
    left = min(max(0, x * sw - cw / 2), sw - cw)
    top = min(max(0, y * sh - ch / 2), sh - ch)
    return src.crop((left, top, left + cw, top + ch)).resize((W, H), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    plates = [Image.open(os.path.join(SRC, f)).convert("RGB") for f, _, _ in CARS]
    total = FPC * len(CARS)
    half = XF // 2

    def car_frame(k, g):
        """frame of car k at global index g (t extrapolates through the crossfade)."""
        t = (g - k * FPC) / (FPC - 1)
        return frame(plates[k], CARS[k][1], CARS[k][2], t, k)

    for g in range(total):
        k = g // FPC
        img = car_frame(k, g)
        # blend into the next car around each cut
        cut = (k + 1) * FPC
        if k + 1 < len(CARS) and g >= cut - half:
            a = (g - (cut - half) + 0.5) / XF
            img = Image.blend(img, car_frame(k + 1, g), a)
        cut = k * FPC
        if k > 0 and g < cut + half:
            a = (cut + half - g - 0.5) / XF
            img = Image.blend(img, car_frame(k - 1, g), a)
        grade(img).save(os.path.join(OUT, f"f_{g:03d}.jpg"), "JPEG", quality=QUALITY, optimize=True, progressive=True)
        print(f"\r{g + 1}/{total}", end="")

    manifest = {
        "width": W,
        "height": H,
        "count": total,
        "fpc": FPC,
        "segments": [{"index": i, "start": i * FPC, "end": (i + 1) * FPC} for i in range(len(CARS))],
    }
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)
    size = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"\n{total} frames, {size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
