"""Step 2: cut textures and trims from the reference painting into public/assets/painted.

Prints the stage placements; copy them into PAINTED in src/data/geometry.ts.
Run segment.py first. Needs numpy and Pillow.
"""
import json, numpy as np
from PIL import Image, ImageFilter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
S=str(ROOT/'scripts'/'painted-assets'/'.work')
OUT=str(ROOT/'public'/'assets'/'painted')
a=np.asarray(Image.open(S+'/fig.png').convert('RGB')).astype(float)
m=np.load(S+'/masks.npz')
green,hair,gold,skin,other,dbg=[m[k] for k in ['green','hair','gold','skin','other','dbg']]
H,W,_=a.shape
Y,X=np.mgrid[0:H,0:W]
CX=254.5  # painted body axis (the face sits ~5px right of it)
lum=a.mean(2)

def pullpush(img, known):
    """Fill unknown pixels smoothly from known ones (multi-scale average)."""
    w=known.astype(float)
    levels=[(img*w[...,None], w)]
    while min(levels[-1][1].shape)>1:
        ci,cw=levels[-1]
        h,wd=cw.shape
        h2,w2=(h+1)//2,(wd+1)//2
        pi=np.zeros((h2*2,w2*2,3)); pw=np.zeros((h2*2,w2*2))
        pi[:h,:wd]=ci; pw[:h,:wd]=cw
        ni=pi.reshape(h2,2,w2,2,3).sum((1,3)); nw=pw.reshape(h2,2,w2,2).sum((1,3))
        levels.append((ni,nw))
    ci,cw=levels[-1]; cur=ci/np.maximum(cw,1e-6)[...,None]
    for li,lw in reversed(levels[:-1]):
        h,wd=lw.shape
        up=np.dstack([np.asarray(Image.fromarray(cur[...,c].astype(np.float32),'F').resize((cur.shape[1]*2,cur.shape[0]*2),Image.BILINEAR))[:h,:wd] for c in range(3)])
        val=li/np.maximum(lw,1e-6)[...,None]
        alpha=np.clip(lw,0,1)[...,None]
        cur=val*alpha+up*(1-alpha)
    return cur

def mirror_fill(img, known):
    out=img.copy(); k=known.copy()
    mx=np.clip((2*CX-X).round().astype(int),0,W-1)
    take=~known & known[Y,mx] & (X>CX)
    out[take]=img[Y[take],mx[take]]; k|=take
    return out,k

def extend(img, known, pad):
    """Place on a padded canvas so textures cover shapes larger than the painting."""
    t,rt,bt,lt=pad
    big=np.zeros((H+t+bt,W+lt+rt,3)); kb=np.zeros((H+t+bt,W+lt+rt),bool)
    big[t:t+H,lt:lt+W]=img; kb[t:t+H,lt:lt+W]=known
    return big,kb

def save(name, rgb, alpha, ox, oy, scale=2):
    im=np.dstack([np.clip(rgb,0,255),np.clip(alpha,0,1)*255]).astype(np.uint8)
    p=Image.fromarray(im,'RGBA')
    p=p.resize((p.width*scale,p.height*scale),Image.LANCZOS)
    p.save(f'{OUT}/{name}.png',optimize=True)
    h,w=alpha.shape
    # crop px -> stage units
    sx=188.5+BODY_SHIFT+(ox-212)*0.873; sy=30.6+(oy-4)*0.873
    place[name]=dict(x=round(sx,1),y=round(sy,1),w=round(w*0.873,1),h=round(h*0.873,1))

place={}
BODY_SHIFT=4.4  # moves the painted body axis onto the stage centre line
def erode(mk,n=2):
    im=Image.fromarray((mk*255).astype(np.uint8))
    for _ in range(n): im=im.filter(ImageFilter.MinFilter(3))
    return np.asarray(im)>0
def mirror_mask(mk):
    mx=np.clip((2*CX-X).round().astype(int),0,W-1)
    return mk|(mk[Y,mx]&(X>CX))
sleeve_zone=(Y<340)&((X<172)|(X>350))
# --- skirt texture
latkan_zone=(X>=168)&(X<=222)&(Y>=286)&(Y<=500)
from PIL import ImageDraw
poly_crop=[(296,150),(330,140),(352,165),(400,300),(440,420),(480,560),(520,700),(545,805),(525,812),(470,765),(420,700),(380,620),(345,520),(330,420),(318,310),(306,230)]
dup_poly=Image.new('L',(W,H),0); ImageDraw.Draw(dup_poly).polygon(poly_crop,fill=255); dup_poly=np.asarray(dup_poly)>0
hair_strands=hair&(X>282)&(Y<312)   # the long hair hangs over the waistband's right end
# skirt hull: each row spans from the painted left edge to its mirror about the body axis
hull=np.zeros((H,W),bool)
for yy in range(283,H):
    xs=np.where(green[yy,:int(CX)]&~sleeve_zone[yy,:int(CX)])[0]
    if len(xs): hull[yy,xs[0]:int(2*CX-xs[0])+1]=True
skirt_sil=hull&~sleeve_zone&~dup_poly&~skin&(green|hair|(gold&(X<300))|((dbg>14)&(Y<310)&(Y>=286)))
skirt_known=skirt_sil&~latkan_zone&~hair_strands
# only trim the anti-aliased outer edge against the background, not seams, trims or the waist edge
skirt_known&=erode(skirt_sil|latkan_zone|hair_strands|dup_poly|(Y<292))
img,k=mirror_fill(a,skirt_known)
pad=(0,90,170,90)
big,kb=extend(img,k,pad)
fill=pullpush(big,kb)
y0=270
sk=fill[y0:, :]
save('skirt-texture',sk,np.ones(sk.shape[:2]),-pad[3],y0)
# --- blouse texture (left half mirrored; hair and dupatta cover the right)
bl_known=green&(((Y<282)&(Y>130))|sleeve_zone)&(Y>130)
bl_known=erode(bl_known)
# the painted centre seam sits a little right of the body axis; build the texture from the
# left half only so it is symmetric, and draw the centre seam in code at the stage centre
img,k=mirror_fill(a,bl_known&(X<=CX-1))
pad=(0,140,0,140)
big,kb=extend(img,k,(0,140,200,140))
fill=pullpush(big,kb)
y0,y1=120,600
bt=fill[y0:y1]
save('blouse-texture',bt,np.ones(bt.shape[:2]),-140,y0)
# --- skin (torso + neck) texture
sk_known=skin&(X>175)&(X<345)&(Y>110)&(Y<305)
# keep clear of the painted neckline edge, whose pale shading would show inside lower necklines
sk_known=erode(sk_known,4)
big,kb=extend(a,sk_known,(0,0,0,0))
fill=pullpush(big,kb)
y0,y1,x0,x1=110,520,150,370
save('skin-texture',fill[y0:y1,x0:x1],np.ones((y1-y0,x1-x0)),x0,y0)
# --- painted forearms and hands (stretch pose): left arm cut out, mirrored for the right
from PIL import ImageDraw
lz=Image.new('L',(W,H),0)
ImageDraw.Draw(lz).polygon([(128,318),(150,328),(120,370),(80,410),(60,428),(14,428),(14,380),(40,360),(70,335),(105,300),(122,300)],fill=255)
lz=np.asarray(lz)>0
arm=lz&(dbg>8)&~green
# drop the pale anti-aliased fringe against the background
arm&=~((dbg<26)&(m['dbg']>0))
arm=np.asarray(Image.fromarray((arm*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7)))/255.
# The painting hides the elbow under the sleeve, so the cut-out stops at the hem.
# Extend the forearm up its own axis so its top always tucks under the sleeve.
solid=(arm>0.6)&(Y>=318)&(Y<=360)
ys,xs=np.nonzero(solid)
pts=np.stack([xs,ys],1).astype(float); mean=pts.mean(0)
_,_,vt=np.linalg.svd(pts-mean,full_matrices=False)
d=vt[0]/np.linalg.norm(vt[0])
if d[1]<0: d=-d                      # point down the arm, toward the hand
arm_rgb=a.copy(); ext=arm.copy()
for yy in range(262,345):
    for xx in range(60,175):
        if arm[yy,xx]>0.6: continue
        for k in range(1,60):
            qx=int(round(xx+d[0]*k)); qy=int(round(yy+d[1]*k))
            if qy>=H or qx<0: break
            if solid[qy,qx]:
                if k>2:              # only fill above the painted forearm, not beside it
                    arm_rgb[yy,xx]=a[qy,qx]; ext[yy,xx]=arm[qy,qx]
                break
arm=ext; a_arm=arm_rgb
y0,y1,x0,x1=262,430,10,175
left=a_arm[y0:y1,x0:x1]; la=arm[y0:y1,x0:x1]
# right arm: mirror around the centre line
rx0=int(round(2*CX-x1)); rx1=rx0+(x1-x0)
full=np.zeros((y1-y0, rx1-x0, 3)); fa=np.zeros((y1-y0, rx1-x0))
full[:, :x1-x0]=left; fa[:, :x1-x0]=la
full[:, rx0-x0:]=left[:, ::-1]; fa[:, rx0-x0:]=la[:, ::-1]
save('arms-stretch',full,fa,x0,y0)
# --- latkan: everything in its zone that isn't skirt fabric
skirt_full=pullpush(*extend(*mirror_fill(a,skirt_known),(0,0,0,0)))
dsk=np.sqrt(((a-skirt_full)**2).sum(2))
lz=(X>=170)&(X<=222)&(Y>=290)&(Y<=495)
lat=(dsk>28)&lz&(((a[...,0]-a[...,2])>35)|((lum<120)&~green))
lat=np.asarray(Image.fromarray((lat*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6)))/255.
y0,y1,x0,x1=288,497,168,224
save('latkan',a[y0:y1,x0:x1],lat[y0:y1,x0:x1],x0,y0)
place['latkan']['anchor']=[round(188.5+BODY_SHIFT+(196-212)*0.873,1), round(30.6+(296-4)*0.873,1)]
# --- dupatta (one shoulder) un-blended from what lies behind it
bl_full=pullpush(*extend(*mirror_fill(a,bl_known),(0,0,0,0)))
bl_sil=mirror_mask(green&(((Y<282)&(Y>130))|sleeve_zone)&(X<CX))
sk_sil=mirror_mask(green&(Y>=283)&~sleeve_zone&(X<CX))
B=np.where(bl_sil[...,None], bl_full, np.array([247,246,242.]))
B=np.where(sk_sil[...,None], skirt_full, B)
D=np.array([250,244,232.])
diff=a-B; dirv=D-B
al=np.clip((diff*dirv).sum(2)/np.maximum((dirv*dirv).sum(2),1),0,1)
# dupatta extent: everything on the right that isn't plain skirt, background, hair, rack or arm (the rack itself isn't used)
reg=(X>296)&(Y>=138)&(Y<=815)&~((X>=458)&(Y<690))&~hair
reg&=(((dbg>8)&~(green&(dsk<18)))|gold)
arm_skin=np.asarray(Image.fromarray((skin&(Y>280)&(X>330)&(X<500)&(Y<440)).astype(np.uint8)*255).filter(ImageFilter.MaxFilter(7)))>0
reg&=~arm_skin
# keep the right forearm (mirror of the left arm outline, extended up under the sleeve) out of the dupatta
ra=Image.new('L',(W,H),0)
ImageDraw.Draw(ra).polygon([(int(2*CX)-x,y) for x,y in [(150,300),(158,330),(120,372),(80,412),(58,432),(10,432),(10,378),(38,356),(68,330),(100,292),(130,286)]],fill=255)
reg&=~(np.asarray(ra.filter(ImageFilter.MaxFilter(5)))>0)
reg=np.asarray(Image.fromarray((reg*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)))>0
# outer (right) limit of the dupatta, notched where the right forearm comes out of the sleeve
clamp=Image.new('L',(W,H),0)
ImageDraw.Draw(clamp).polygon([(290,130),(340,130),(356,150),(398,280),(382,300),(382,352),(444,420),(486,560),(526,700),(552,815),(290,815)],fill=255)
reg&=np.asarray(clamp)>0
pm=reg|(dup_poly&(np.asarray(clamp)>0))
al=np.where(pm,al,0)
al=np.where(gold&pm,1,al)
al=np.where(hair,0,al)
al=np.where(al<0.08,0,al)
# drop isolated specks (bits of the rack edge and background noise) outside the main cloth
from collections import deque
grow=np.asarray(Image.fromarray(((al>0.05)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)))>0
keep=np.zeros_like(grow)
seed=np.argwhere(grow&pm&(Y>500))[0]
q=deque([tuple(seed)])
while q:
    yy,xx=q.popleft()
    if yy<0 or xx<0 or yy>=H or xx>=W or keep[yy,xx] or not grow[yy,xx]: continue
    keep[yy,xx]=True
    q.extend(((yy+1,xx),(yy-1,xx),(yy,xx+1),(yy,xx-1)))
al=np.where(keep,al,0)
col=np.where(al[...,None]>0, (a-(1-al[...,None])*B)/np.maximum(al[...,None],0.05), D)
col=np.where((gold&pm)[...,None],a,np.clip(col,0,255))
y0,y1,x0,x1=135,820,290,552
save('dupatta-one-shoulder',col[y0:y1,x0:x1],al[y0:y1,x0:x1],x0,y0)
print(json.dumps(place))
