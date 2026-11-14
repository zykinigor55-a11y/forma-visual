#!/usr/bin/env python3
"""Create an original 3840×2160 dark-graphite mineral-plaster wall.
The FA logotype and foliage shadows remain separate HTML/SVG layers.
"""
from pathlib import Path
import numpy as np, cv2
from PIL import Image

OUT=Path(__file__).resolve().parent.parent/'assets'/'brand'
OUT.mkdir(parents=True,exist_ok=True)
W,H=3840,2160
rng=np.random.default_rng(198712)

def fbm():
    layers=[(8,.72),(18,.68),(42,.56),(90,.44),(190,.29),(380,.16),(900,.085),(2100,.04)]
    result=np.zeros((H,W),dtype=np.float32)
    for size,amount in layers:
        sw=max(2,round(W/size));sh=max(2,round(H/size))
        field=rng.normal(0,1,(sh,sw)).astype(np.float32)
        field=cv2.resize(field,(W,H),interpolation=cv2.INTER_CUBIC)
        field/=max(.05,float(field.std()))
        result+=field*amount
    return result

surface=fbm()
chips=cv2.resize(rng.normal(0,1,(180,320)).astype(np.float32),(W,H),interpolation=cv2.INTER_CUBIC)
chips=cv2.GaussianBlur(chips,(0,0),1.5)
chips=(chips>0.45).astype(np.float32)
chips=cv2.GaussianBlur(chips,(0,0),1.0)
mortar=np.zeros((H,W),dtype=np.uint8)
for i in range(2900):
    x=int(rng.integers(-300,W));y=int(rng.integers(-300,H))
    length=int(rng.integers(30,320));bend=int(rng.integers(-21,22))
    cv2.line(mortar,(x,y),(x+length,y+bend),int(rng.integers(28,78)),int(rng.choice([1,1,1,2,3])),cv2.LINE_AA)
mortar=cv2.GaussianBlur(mortar,(0,0),1.2).astype(np.float32)/255
cracks=np.zeros((H,W),dtype=np.float32)
for i in range(65):
    x=int(rng.integers(0,W));y=int(rng.integers(0,H))
    if .26*W<x<.73*W and .24*H<y<.71*H:continue
    steps=int(rng.integers(4,15));direction=float(rng.uniform(-np.pi,np.pi))
    for j in range(steps):
        nx=int(x+np.cos(direction)*rng.uniform(13,58));ny=int(y+np.sin(direction)*rng.uniform(13,58))
        cv2.line(cracks,(x,y),(nx,ny),1.0,int(rng.choice([1,1,2])),cv2.LINE_AA)
        direction+=rng.uniform(-.65,.65);x,y=nx,ny
cracks=cv2.GaussianBlur(cracks,(0,0),.32)
height=surface*.95+mortar*3.8+chips*3.2-cracks*2.4
gx=cv2.Sobel(height,cv2.CV_32F,1,0,ksize=3)*.48
gy=cv2.Sobel(height,cv2.CV_32F,0,1,ksize=3)*.48
relief=np.clip(.55*gx-.75*gy,-1.7,1.7)

xs=np.linspace(0,1,W,dtype=np.float32)[None,:]
ys=np.linspace(0,1,H,dtype=np.float32)[:,None]
sun=np.exp(-((xs-.09)**2/(.29**2)+(ys-.12)**2/(.62**2))*1.5)
soft=np.exp(-((xs-.32)**2/(.56**2)+(ys-.42)**2/(.83**2)))
vignette=np.clip(((xs-.5)/.72)**2+((ys-.5)/.76)**2,0,1)
grain=rng.standard_normal((H,W)).astype(np.float32)
texture=surface*4.7+relief*12.5+grain*2.5+mortar*8+chips*2.1-cracks*26
light=31+47*sun+8*soft-12*vignette
luma=np.clip(light+texture,13,132)
r=np.clip(luma*1.039+4.0*sun,0,255).astype(np.uint8)
g=np.clip(luma*.999+1.8*sun,0,255).astype(np.uint8)
b=np.clip(luma*.956-.3*sun,0,255).astype(np.uint8)
full=Image.fromarray(np.dstack((r,g,b)),'RGB')
full.save(OUT/'intro-graphite-wall-4k.webp','WEBP',quality=90,method=6)
full.resize((1080,1920),Image.Resampling.LANCZOS,box=(1250,0,2590,2160)).save(OUT/'intro-graphite-wall-mobile.webp','WEBP',quality=85,method=6)
print('generated',full.size,'wall 4k, mobile',round((OUT/'intro-graphite-wall-4k.webp').stat().st_size/1e6,2),'MB')
