"""Cut the back-view textures and trims from design/reference-lehenga-back.webp.

The back painting is drawn at a slightly different size from the front one, so it is
first warped onto the front painting's frame (same body axis, head, shoulders, waist
and hem), then cut with the same stage mapping as build.py. Prints the placements
for PAINTED_BACK in src/data/geometry.ts. Needs numpy and Pillow.
"""
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'scripts' / 'painted-assets' / '.work'
WORK.mkdir(exist_ok=True)
OUT = ROOT / 'public' / 'assets' / 'painted'

# --- 1. warp the back screenshot onto the front painting's frame
FRONT_Y = [346, 476, 590, 616, 1198]  # head top, shoulder, blouse hem, waistband, hem (front screenshot px)
BACK_Y = [352, 496, 625, 647, 1258]
FRONT_AXIS, BACK_AXIS, X_SCALE = 434.5, 438.0, 0.923
src = np.asarray(Image.open(ROOT / 'design' / 'reference-lehenga-back.webp').convert('RGB')).astype(np.float32)
SH, SW, _ = src.shape
yy, xx = np.mgrid[0:SH, 0:SW].astype(np.float32)
by = np.interp(yy, FRONT_Y, BACK_Y, left=None, right=None)
# extend linearly past the outer landmarks
by = np.where(yy < FRONT_Y[0], BACK_Y[0] + (yy - FRONT_Y[0]) * (BACK_Y[1] - BACK_Y[0]) / (FRONT_Y[1] - FRONT_Y[0]), by)
by = np.where(yy > FRONT_Y[-1], BACK_Y[-1] + (yy - FRONT_Y[-1]) * (BACK_Y[-1] - BACK_Y[-2]) / (FRONT_Y[-1] - FRONT_Y[-2]), by)
bx = BACK_AXIS + (xx - FRONT_AXIS) / X_SCALE


def sample(img, x, y):
    x0 = np.clip(np.floor(x).astype(int), 0, SW - 2); y0 = np.clip(np.floor(y).astype(int), 0, SH - 2)
    fx = np.clip(x - x0, 0, 1)[..., None]; fy = np.clip(y - y0, 0, 1)[..., None]
    return (img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x0 + 1] * fx * (1 - fy)
            + img[y0 + 1, x0] * (1 - fx) * fy + img[y0 + 1, x0 + 1] * fx * fy)


aligned = sample(src, bx, by)
Image.fromarray(np.clip(aligned, 0, 255).astype(np.uint8)).save(WORK / 'back-aligned.png')

# --- 2. crop the figure exactly like the front (crop px = screenshot px - (180, 330))
a = aligned[330:1210, 180:800].copy()
H, W, _ = a.shape
Y, X = np.mgrid[0:H, 0:W]
CX = 254.5
BODY_SHIFT = 4.4
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = a.mean(2)
dbg = np.sqrt(((a - np.array([247, 246, 242.])) ** 2).sum(2))
green = (g - r > 10) & (g - b > 4) & (lum < 205)
hair = lum < 75
gold = (r - b > 55) & (r > 130) & ~green
skin = (r > 205) & (r - b > 18) & (r - b < 75) & (g > 165) & ~gold


def erode(mk, n=2):
    im = Image.fromarray((mk * 255).astype(np.uint8))
    for _ in range(n):
        im = im.filter(ImageFilter.MinFilter(3))
    return np.asarray(im) > 0


def mirror_fill(img, known):
    out = img.copy(); k = known.copy()
    mx = np.clip((2 * CX - X).round().astype(int), 0, W - 1)
    take = ~known & known[Y, mx]
    out[take] = img[Y[take], mx[take]]; k |= take
    return out, k


def pullpush(img, known):
    w = known.astype(float)
    levels = [(img * w[..., None], w)]
    while min(levels[-1][1].shape) > 1:
        ci, cw = levels[-1]
        h, wd = cw.shape
        h2, w2 = (h + 1) // 2, (wd + 1) // 2
        pi = np.zeros((h2 * 2, w2 * 2, 3)); pw = np.zeros((h2 * 2, w2 * 2))
        pi[:h, :wd] = ci; pw[:h, :wd] = cw
        levels.append((pi.reshape(h2, 2, w2, 2, 3).sum((1, 3)), pw.reshape(h2, 2, w2, 2).sum((1, 3))))
    ci, cw = levels[-1]; cur = ci / np.maximum(cw, 1e-6)[..., None]
    for li, lw in reversed(levels[:-1]):
        h, wd = lw.shape
        up = np.dstack([np.asarray(Image.fromarray(cur[..., c].astype(np.float32), 'F').resize((cur.shape[1] * 2, cur.shape[0] * 2), Image.BILINEAR))[:h, :wd] for c in range(3)])
        val = li / np.maximum(lw, 1e-6)[..., None]
        al = np.clip(lw, 0, 1)[..., None]
        cur = val * al + up * (1 - al)
    return cur


def extend(img, known, pad):
    t, rt, bt, lt = pad
    big = np.zeros((H + t + bt, W + lt + rt, 3)); kb = np.zeros((H + t + bt, W + lt + rt), bool)
    big[t:t + H, lt:lt + W] = img; kb[t:t + H, lt:lt + W] = known
    return big, kb


place = {}


def save(name, rgb, alpha, ox, oy, scale=2):
    im = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    p = Image.fromarray(im, 'RGBA')
    p = p.resize((p.width * scale, p.height * scale), Image.LANCZOS)
    p.save(OUT / f'{name}.png', optimize=True)
    h, w = alpha.shape
    place[name] = dict(x=round(188.5 + BODY_SHIFT + (ox - 212) * 0.873, 1), y=round(30.6 + (oy - 4) * 0.873, 1),
                       w=round(w * 0.873, 1), h=round(h * 0.873, 1))


# dupatta region (screen right of the body), kept out of the fabric textures
dup_poly = Image.new('L', (W, H), 0)
ImageDraw.Draw(dup_poly).polygon([
    # left (inner) edge down to the wavy gold hem, then back up the outer edge
    (298, 148), (316, 200), (312, 260), (313, 320), (323, 350), (328, 410), (332, 470), (337, 520), (343, 545),
    (358, 560), (370, 590), (374, 620), (403, 650), (412, 680), (423, 710), (450, 740), (462, 770), (503, 802),
    # the outer edge falls straight from the shoulder; the sleeve and arm beside it stay out
    (524, 802), (336, 146)], fill=255)
dup_poly = np.asarray(dup_poly) > 0
dup_zone = ((dbg > 10) & ~green & ~skin & ~hair & (X > 262)) | dup_poly
dup_zone = np.asarray(Image.fromarray((dup_zone * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
sleeve_zone = (Y < 340) & ((X < 172) | (X > 340))

# --- skirt texture (left half mirrored; the dupatta and hair cover parts of the right)
hull = np.zeros((H, W), bool)
for y in range(286, H):
    xs = np.where(green[y, :int(CX)] & ~sleeve_zone[y, :int(CX)])[0]
    if len(xs):
        hull[y, xs[0]:int(2 * CX - xs[0]) + 1] = True
skirt_sil = hull & ~sleeve_zone & ~skin & (green | gold | ((dbg > 14) & (Y < 312)))
# the left half is clear of the dupatta and hair; mirror it for the right
skirt_known = skirt_sil & (X <= CX - 1) & ~hair & (Y >= 286)
skirt_known &= erode(skirt_sil | hair | (Y < 296))
img, k = mirror_fill(a, skirt_known)
big, kb = extend(img, k, (0, 90, 170, 90))
fill = pullpush(big, kb)
sk = fill[270:]
save('skirt-texture-back', sk, np.ones(sk.shape[:2]), -90, 270)
skirt_full = pullpush(*extend(*mirror_fill(a, skirt_known), (0, 0, 0, 0)))

# --- blouse texture
skin_near = np.asarray(Image.fromarray((skin * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
bl_known = green & (Y > 130) & (Y < 282) & ~dup_zone & ~hair & ~skin_near & (X <= CX - 1)
bl_known = erode(bl_known)
img, k = mirror_fill(a, bl_known)
big, kb = extend(img, k, (0, 140, 200, 140))
fill = pullpush(big, kb)
save('blouse-texture-back', fill[120:600], np.ones((480, fill.shape[1])), -140, 120)

# --- back skin (V opening, shoulders, midriff), mirrored around the spine
sk_known = skin & (X > 175) & (X < 335) & (Y > 120) & (Y < 300) & ~hair
sk_known = erode(sk_known, 3)
img, k = mirror_fill(a, sk_known)
fill = pullpush(*extend(img, k, (0, 0, 0, 0)))
save('skin-texture-back', fill[110:520, 150:370], np.ones((410, 220)), 150, 110)

# --- head, hair, neck and earring: everything above the shoulders, only hair below
hair_wide = lum < 100
# the long hair dips behind the blouse strap, so bridge small gaps when tracing it down
hair_bridge = np.asarray(Image.fromarray(((hair_wide & (X > 270)) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
head_known = np.zeros((H, W), bool)
q = deque([(30, int(CX))])
while q:
    yy_, xx_ = q.popleft()
    if yy_ < 0 or xx_ < 0 or yy_ >= H or xx_ >= W or head_known[yy_, xx_]:
        continue
    if yy_ <= 118:
        ok = dbg[yy_, xx_] > 12                      # face-free back of the head, ears, earring
    elif yy_ <= 140:
        ok = hair_wide[yy_, xx_] or (abs(xx_ - CX) < 14 and dbg[yy_, xx_] > 12)  # hair and the neck
    else:
        ok = (hair_wide[yy_, xx_] or hair_bridge[yy_, xx_]) and yy_ < 330  # only the long hair below the neck
    if not ok:
        continue
    head_known[yy_, xx_] = True
    q.extend(((yy_ + 1, xx_), (yy_ - 1, xx_), (yy_, xx_ + 1), (yy_, xx_ - 1)))
fade = np.clip((140 - Y) / 12.0, 0, 1)
# the long strand reappears below the blouse strap and falls to the waist
strand = hair_wide & (X >= 285) & (X <= 325) & (Y > 140) & (Y <= 320)
alpha = np.where(Y > 140, ((head_known & hair_wide) | strand).astype(float), np.where(hair_wide, head_known.astype(float), head_known * fade))
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))) / 255.
ys, xs = np.nonzero(alpha > 0.02)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
save('head-back', a[y0:y1, x0:x1], alpha[y0:y1, x0:x1], x0, y0, scale=3)

# --- forearms and hands (left arm cut out, mirrored for the right)
lz = Image.new('L', (W, H), 0)
ImageDraw.Draw(lz).polygon([(150, 300), (158, 330), (120, 372), (80, 412), (58, 440), (10, 440), (10, 378), (38, 356), (68, 330), (100, 292), (130, 286)], fill=255)
lz = np.asarray(lz) > 0
arm = lz & (dbg > 8) & ~green
arm &= ~(dbg < 26)
arm = np.asarray(Image.fromarray((arm * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))) / 255.
solid = (arm > 0.6) & (Y >= 318) & (Y <= 360)
ys_, xs_ = np.nonzero(solid)
pts = np.stack([xs_, ys_], 1).astype(float); mean = pts.mean(0)
_, _, vt = np.linalg.svd(pts - mean, full_matrices=False)
d = vt[0] / np.linalg.norm(vt[0])
if d[1] < 0:
    d = -d
arm_rgb = a.copy(); ext = arm.copy()
for y_ in range(262, 345):
    for x_ in range(60, 175):
        if arm[y_, x_] > 0.6:
            continue
        for kk in range(1, 60):
            qx = int(round(x_ + d[0] * kk)); qy = int(round(y_ + d[1] * kk))
            if qy >= H or qx < 0:
                break
            if solid[qy, qx]:
                if kk > 2:
                    arm_rgb[y_, x_] = a[qy, qx]; ext[y_, x_] = arm[qy, qx]
                break
y0, y1, x0, x1 = 262, 440, 10, 175
left = arm_rgb[y0:y1, x0:x1]; la = ext[y0:y1, x0:x1]
rx0 = int(round(2 * CX - x1)); rx1 = rx0 + (x1 - x0)
full = np.zeros((y1 - y0, rx1 - x0, 3)); fa = np.zeros((y1 - y0, rx1 - x0))
full[:, :x1 - x0] = left; fa[:, :x1 - x0] = la
full[:, rx0 - x0:] = left[:, ::-1]; fa[:, rx0 - x0:] = la[:, ::-1]
save('arms-stretch-back', full, fa, x0, y0)

# --- dupatta: un-blend the sheer cloth from the blouse/skirt/background behind it
bl_full = pullpush(*extend(*mirror_fill(a, bl_known), (0, 0, 0, 0)))
mirror = lambda mk: mk | (mk[Y, np.clip((2 * CX - X).round().astype(int), 0, W - 1)] & (X > CX))
bl_sil = mirror(green & (Y > 130) & (Y < 282) & (X < CX))
sk_sil = mirror(green & (Y >= 286) & ~sleeve_zone & (X < CX))
B = np.where(bl_sil[..., None], bl_full, np.array([247, 246, 242.]))
B = np.where(sk_sil[..., None], skirt_full, B)
# the painted right sleeve sits under the dupatta; treat it as backdrop so the cut-out
# carries only the sheer cloth, never the sleeve (it would show over bare arms)
# a green tint means sleeve fabric under the cloth; no tint means arm or background
tint = (a[..., 1] - a[..., 0]) > 2
upper_side = (X > CX + 20) & (Y > 140) & (Y < 330)
B = np.where((upper_side & tint)[..., None], bl_full, np.where((upper_side & ~tint & ~sk_sil)[..., None], np.array([247, 246, 242.]), B))
D = np.array([250, 244, 232.])
diff = a - B; dirv = D - B
al = np.clip((diff * dirv).sum(2) / np.maximum((dirv * dirv).sum(2), 1), 0, 1)
reg = (X > 262) & (Y >= 140) & ~hair & ((((dbg > 8) & ~(green & (np.sqrt(((a - skirt_full) ** 2).sum(2)) < 18))) | gold))
reg &= ~(np.asarray(Image.fromarray((skin & (X > 330)).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7))) > 0)
reg = np.asarray(Image.fromarray((reg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))) > 0
dup_near = np.asarray(Image.fromarray((dup_poly * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
pm = (reg | dup_poly) & dup_near
al = np.where(pm, al, 0)
al = np.where(gold & pm, 1, al)
al = np.where(hair, 0, al)
al = np.where(green & (Y < 300), 0, al)  # bare sleeve or blouse, not cloth
al = np.where(al < 0.08, 0, al)
grow = np.asarray(Image.fromarray(((al > 0.05) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
keep = np.zeros_like(grow)
seed = np.argwhere(grow & dup_poly & (Y > 500))[0]
q = deque([tuple(seed)])
while q:
    yy_, xx_ = q.popleft()
    if yy_ < 0 or xx_ < 0 or yy_ >= H or xx_ >= W or keep[yy_, xx_] or not grow[yy_, xx_]:
        continue
    keep[yy_, xx_] = True
    q.extend(((yy_ + 1, xx_), (yy_ - 1, xx_), (yy_, xx_ + 1), (yy_, xx_ - 1)))
al = np.where(keep, al, 0)
col = np.where(al[..., None] > 0, (a - (1 - al[..., None]) * B) / np.maximum(al[..., None], 0.05), D)
col = np.where((gold & pm)[..., None], a, np.clip(col, 0, 255))
# the painted right elbow shows through the cloth here as a pink wedge; the app draws its own
# arm elsewhere, so fill it in smoothly from the surrounding cloth (colour and sheerness)
elbow = (X >= 356) & (X <= 418) & (Y >= 282) & (Y <= 364)
ghost = elbow & (((a[..., 0] - a[..., 1]) > 8) | ((a[..., 0] - a[..., 2]) > 28)) & ~gold & (al > 0)
ghost = np.asarray(Image.fromarray((ghost * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
ghost &= elbow & (al > 0)
known = (al > 0.05) & ~ghost & ~gold & (Y > 250) & (Y < 400) & (X > 330)
fill_col = pullpush(col, known)
fill_al = pullpush(np.dstack([al] * 3), known)[..., 0]
feather = np.asarray(Image.fromarray((ghost * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))) / 255.0
feather = np.maximum(feather, ghost.astype(float))
col = col * (1 - feather[..., None]) + fill_col * feather[..., None]
al = np.where(al > 0, al * (1 - feather) + fill_al * feather, al)
ys, xs = np.nonzero(al > 0)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
save('dupatta-one-shoulder-back', col[y0:y1, x0:x1], al[y0:y1, x0:x1], x0, y0)

np.savez(WORK / 'back-masks.npz', green=green, hair=hair, gold=gold, skin=skin, dbg=dbg)
Image.fromarray(a.astype(np.uint8)).save(WORK / 'back-fig.png')
# scalloped hem, left half from the outer corner to centre back, in stage units
hem = []
for x in range(4, int(CX), 4):
    ys = np.where((green | hair)[600:, x])[0]
    if len(ys):
        hem.append([round(188.5 + BODY_SHIFT + (x - 212) * 0.873, 1), round(30.6 + (600 + ys[-1] - 4) * 0.873, 1)])
place['hem'] = hem
print(json.dumps(place))
