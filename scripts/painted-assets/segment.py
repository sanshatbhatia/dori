"""Step 1: segment the reference painting into fabric, hair, gold, skin and other pixels."""
import numpy as np
from PIL import Image
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
S=str(ROOT/'scripts'/'painted-assets'/'.work')
Path(S).mkdir(exist_ok=True)
# crop the figure out of the full reference screenshot (crop px (x, y) = screenshot px (x + 180, y + 330))
Image.open(ROOT/'design'/'reference-lehenga.webp').convert('RGB').crop((180,330,800,1210)).save(S+'/fig.png')
a=np.asarray(Image.open(S+'/fig.png').convert('RGB')).astype(float)
r,g,b=a[...,0],a[...,1],a[...,2]
lum=a.mean(2)
H,W=lum.shape
Y,X=np.mgrid[0:H,0:W]
bg=np.array([247,246,242.])
dbg=np.sqrt(((a-bg)**2).sum(2))
green=(g-r>10)&(g-b>4)&(lum<205)
hair=lum<75
gold=(r-b>55)&(r>130)&~green
skin=(r>215)&(r-b>18)&(r-b<70)&(g>175)&~gold
lab=np.zeros((H,W,3),np.uint8)+255
lab[green]=[60,160,90]; lab[hair]=[0,0,0]; lab[gold]=[220,160,0]; lab[skin]=[255,150,150]
other=(dbg>12)&~green&~hair&~gold&~skin
lab[other]=[120,120,255]
Image.fromarray(lab).save(S+'/labels.png')
np.savez(S+'/masks.npz',green=green,hair=hair,gold=gold,skin=skin,other=other,dbg=dbg)
