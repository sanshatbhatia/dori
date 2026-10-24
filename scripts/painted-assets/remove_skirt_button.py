# Paints the gold button out of the front of the skirt waistband (run after build.py).
# The waistband is even across, so each row of the button is replaced by a blend of the
# waistband just left and right of it.
import numpy as np
from PIL import Image

PATH = 'public/assets/painted/skirt-texture.png'
CX, CY, R = 697, 50, 18  # button centre and radius in texture pixels

a = np.asarray(Image.open(PATH).convert('RGBA')).astype(float)
for y in range(CY - R, CY + R + 1):
    l, r = a[y, CX - R - 2], a[y, CX + R + 2]
    for x in range(CX - R - 1, CX + R + 2):
        t = (x - (CX - R - 2)) / (2 * R + 4)
        a[y, x] = l * (1 - t) + r * t
Image.fromarray(a.round().astype(np.uint8)).save(PATH)
