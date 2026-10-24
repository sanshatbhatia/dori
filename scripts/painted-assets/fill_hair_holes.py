# Fills small enclosed holes in the painted head/hair image (dori-face.png). Two gaps near the hair tips
# let the background show through as white dashes. Any transparent area not connected to the image
# border is a hole: it gets the colour of the hair around it.
from collections import deque

import numpy as np
from PIL import Image

PATH = 'public/assets/dori-face.png'
im = np.asarray(Image.open(PATH).convert('RGBA')).astype(float)
h, w = im.shape[:2]
clear = im[..., 3] < 128

outside = np.zeros((h, w), bool)
q = deque()
for y in range(h):
    for x in (0, w - 1):
        if clear[y, x] and not outside[y, x]:
            outside[y, x] = True
            q.append((y, x))
for x in range(w):
    for y in (0, h - 1):
        if clear[y, x] and not outside[y, x]:
            outside[y, x] = True
            q.append((y, x))
while q:
    y, x = q.popleft()
    for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
        if 0 <= yy < h and 0 <= xx < w and clear[yy, xx] and not outside[yy, xx]:
            outside[yy, xx] = True
            q.append((yy, xx))

holes = clear & ~outside
ys, xs = np.nonzero(holes)
for y, x in zip(ys, xs):
    y0, y1, x0, x1 = max(0, y - 6), min(h, y + 7), max(0, x - 6), min(w, x + 7)
    blk = im[y0:y1, x0:x1]
    m = blk[..., 3] >= 200
    if m.any():
        im[y, x, :3] = blk[..., :3][m].mean(0)
        im[y, x, 3] = 255
Image.fromarray(im.astype(np.uint8)).save(PATH)
print('filled', len(ys), 'px')
