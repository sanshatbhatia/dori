# Repairs the one-shoulder dupatta over the shoulder (run after build.py).
# In the reference painting the sleeve hid part of the dupatta where it crosses the shoulder, so the
# extracted dupatta has a hole there; with any other sleeve the hole showed as a white notch. This
# fills the hole with the dupatta's own cream and drops the stray specks and the white fringe left
# where the hair was cut out. The Studio draws the hair over the dupatta, so the fill can run under it.
from collections import deque

import numpy as np
from PIL import Image, ImageDraw


def blur(x, r=2):
    # box blur by shifting (no scipy in the asset toolchain)
    out = np.zeros_like(x)
    n = 0
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out += np.roll(np.roll(x, dy, 0), dx, 1)
            n += 1
    return out / n


def largest_piece(mask):
    lab = np.zeros(mask.shape, np.int32)
    best, best_n, cur = 0, 0, 0
    h, w = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        cur += 1
        n = 0
        q = deque([(y0, x0)])
        lab[y0, x0] = cur
        while q:
            y, x = q.popleft()
            n += 1
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = cur
                    q.append((yy, xx))
        if n > best_n:
            best, best_n = cur, n
    return lab == best

PATH = 'public/assets/painted/dupatta-one-shoulder.png'
X0, Y0, W, H = 261.0, 145.0, 228.7, 598.0  # placement in stage units (geometry.ts PAINTED.dupattaOneShoulder)
# region over the shoulder that the cloth should cover, in stage units
SHOULDER = [(282, 148), (300, 148), (310, 157), (316, 171), (318, 192), (315, 214), (309, 234), (305, 262), (300, 300), (288, 300), (284, 250), (282, 200)]

im = Image.open(PATH).convert('RGBA')
a = np.asarray(im).astype(float)
h, w = a.shape[:2]
sx, sy = w / W, h / H
alpha = a[..., 3]

# keep the cloth itself: the largest solid piece; specks around it go
solid = alpha > 40
keep = blur(largest_piece(solid).astype(float), 2) > 0
a[..., 3] = np.where(keep, alpha, 0)

# fill the hole over the shoulder
poly = Image.new('L', (w, h), 0)
ImageDraw.Draw(poly).polygon([((x - X0) * sx, (y - Y0) * sy) for x, y in SHOULDER], fill=255)
region = np.asarray(poly) > 0
lum = a[..., :3].mean(-1)
chroma = a[..., :3].max(-1) - a[..., :3].min(-1)
# only solid cream cloth seeds the fill: not hair-dark pixels, not the white fringe left by the cut-out
known = (a[..., 3] > 230) & (lum > 150) & ~((lum > 226) & (chroma < 20))
hole = region & ~known
# the cream the dupatta shows near the shoulder (sampled from the painted cloth), lit from above and shaded toward the hair,
# a little sheer like the painted cloth
CREAM = np.array([214.0, 206.0, 190.0])
yy, xx = np.mgrid[0:h, 0:w]
ys = Y0 + yy / sy
xs = X0 + xx / sx
light = 1.0 + 0.03 * np.clip((200 - ys) / 50, -1, 1) - 0.05 * np.clip((300 - xs) / 18, 0, 1)
fill = CREAM[None, None, :] * light[..., None]
# soften the new edge so it blends with the painted cloth
edge = blur(region.astype(float), 1)
a[..., :3] = np.where(hole[..., None], fill, a[..., :3])
a[..., 3] = np.where(hole, np.maximum(a[..., 3], 225 * np.clip(edge * 1.6, 0, 1)), a[..., 3])
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(PATH)
print('filled', int(hole.sum()), 'px')
