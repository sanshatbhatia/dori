# Repairs the one-shoulder dupatta over the shoulder and drapes it over the upper arm (run after build.py).
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
# over the shoulder and down the outside of the upper arm to the elbow, then falling into the drape
SHOULDER = [(283, 157), (293, 160), (299, 164), (305, 172), (309, 182), (319, 211), (332, 238), (345, 268), (347, 284), (342, 302), (334, 305), (300, 250), (283, 200)]

im = Image.open(PATH).convert('RGBA')
a = np.asarray(im).astype(float)
h, w = a.shape[:2]
sx, sy = w / W, h / H
alpha = a[..., 3]

# keep the cloth itself: the largest solid piece; specks around it go
solid = alpha > 40
keep = blur(largest_piece(solid).astype(float), 2) > 0
a[..., 3] = np.where(keep, alpha, 0)

# the white fringe left where the hair (and the sleeve) were cut out of the painting: whitish,
# see-through pixels along the cloth's edge
al = a[..., 3]
lum0 = a[..., :3].mean(-1)
chroma0 = a[..., :3].max(-1) - a[..., :3].min(-1)
near_edge = blur((al < 30).astype(float), 3) > 0.02
fringe = near_edge & (al > 0) & (lum0 > 214) & (chroma0 < 24)
a[..., 3] = np.where(fringe, 0, al)

# the painted strip widened over the top of the sleeve and stopped in a straight line where the
# sleeve began; taper it along a diagonal instead, so the cloth narrows smoothly into its fall
yy0, xx0 = np.mgrid[0:h, 0:w]
ys0, xs0 = Y0 + yy0 / sy, X0 + xx0 / sx
taper_x = 309 - (ys0 - 184) * 10 / 42
taper = (ys0 > 184) & (ys0 < 232) & (xs0 > taper_x)
soft = np.clip((xs0 - taper_x) / 1.2, 0, 1)
a[..., 3] = np.where(taper, a[..., 3] * (1 - soft), a[..., 3])

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
# soft folds running along the arm from the shoulder, as the cloth hangs over it
ax, ay = 0.42, 0.91  # arm direction
across = (xs - 294) * ay - (ys - 190) * ax
fold = np.exp(-((across - 6) / 3.0) ** 2) + 0.8 * np.exp(-((across - 18) / 3.4) ** 2) + 0.6 * np.exp(-((across - 30) / 3.0) ** 2)
light = 1.0 + 0.03 * np.clip((200 - ys) / 50, -1, 1) - 0.05 * np.clip((300 - xs) / 18, 0, 1) - 0.07 * fold
fill = CREAM[None, None, :] * light[..., None]
# soften the new edge so it blends with the painted cloth
edge = blur(blur(region.astype(float), 2), 2)
a[..., :3] = np.where(hole[..., None], fill, a[..., :3])
a[..., 3] = np.where(hole, np.maximum(a[..., 3], 190 * np.clip(edge * 1.4, 0, 1)), a[..., 3])
# the painted fall starts with a straight top edge (the sleeve hid what was above it); blend it into
# the sheer cloth over the arm so the cloth gets gradually denser instead of changing at a line
band = region & ~hole & (ys > 205) & (ys < 292)
t = np.clip((ys - 248) / 40, 0, 1)
mix = 190 + (a[..., 3] - 190) * t
a[..., 3] = np.where(band, np.minimum(a[..., 3], mix), a[..., 3])
a[..., :3] = np.where(band[..., None], a[..., :3] * t[..., None] + fill * (1 - t[..., None]), a[..., :3])

Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(PATH)
print('filled', int(hole.sum()), 'px')
