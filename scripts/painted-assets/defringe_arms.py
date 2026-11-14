# Removes the pale fringe around the painted forearms and hands (run after build.py / build_back.py).
# Pixels along the cut-out edge kept some of the white background of the reference painting, so the
# arms showed a whitish outline. Each see-through edge pixel takes the colour of the solid skin
# next to it; its transparency is unchanged.
import sys

import numpy as np
from PIL import Image


def blur(x, r):
    out = np.zeros_like(x)
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out += np.roll(np.roll(x, dy, 0), dx, 1)
    return out / (2 * r + 1) ** 2


for path in sys.argv[1:] or ['public/assets/painted/arms-stretch.png', 'public/assets/painted/arms-stretch-back.png']:
    a = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    solid = (a[..., 3] > 235).astype(float)
    rgb = a[..., :3]
    acc, wt = rgb * solid[..., None], solid.copy()
    for r in (2, 4, 8):
        acc, wt = blur(acc, r), blur(wt, r)
    near = acc / np.maximum(wt, 1e-6)[..., None]
    edge = (a[..., 3] > 0) & (a[..., 3] <= 235) & (wt > 1e-3)
    a[..., :3] = np.where(edge[..., None], near, rgb)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(path)
    print(path, int(edge.sum()), 'edge px recoloured')
