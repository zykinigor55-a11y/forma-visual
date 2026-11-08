#!/usr/bin/env python3
"""Pixel-aligned SketchUp-style source from the exact demo After image.
Geometry, roof position, pool and all pixel coordinates stay fixed.
This is a photographic stylization, not an SKP export.
"""
from pathlib import Path
from PIL import Image
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parent
src=cv2.imread(str(ROOT/'assets/residence-render.jpg'))
if src is None:
    raise SystemExit('Missing approved After image')
h,w=src.shape[:2]
small=cv2.resize(src,(w//2,h//2),interpolation=cv2.INTER_AREA)
smooth=cv2.bilateralFilter(small,9,45,42)
smooth=cv2.bilateralFilter(smooth,9,35,40)
flat=cv2.resize(smooth,(w,h),interpolation=cv2.INTER_CUBIC)
lab=cv2.cvtColor(flat,cv2.COLOR_BGR2LAB).astype(np.float32)
lab[:,:,0]=np.clip(lab[:,:,0]*.64+83,45,248)
lab[:,:,1]=128+(lab[:,:,1]-128)*.22
lab[:,:,2]=128+(lab[:,:,2]-128)*.23
out=cv2.cvtColor(lab.astype('uint8'),cv2.COLOR_LAB2BGR)
# Sky remains crisp, light bluish, with no reprojection.
for y in range(min(h,470)):
    bb,gg,rr=cv2.split(flat[y:y+1])
    mask=(bb.astype(np.int16)-rr.astype(np.int16)>18)&(bb.astype(np.int16)-gg.astype(np.int16)>-10)&(gg>70)
    if mask.any():
        t=y/470
        out[y,mask[0]]=np.array([245-9*t,234-8*t,220-6*t])
gray=cv2.cvtColor(src,cv2.COLOR_BGR2GRAY)
edge=cv2.Canny(cv2.GaussianBlur(gray,(3,3),.45),75,175,L2gradient=True)
out[edge>0]=np.clip(out[edge>0].astype(np.float32)*.16+np.array([42,45,48])*.84,0,255).astype('uint8')
lines=cv2.HoughLinesP(edge,1,np.pi/1800,threshold=115,minLineLength=180,maxLineGap=12)
if lines is not None:
    for [[x1,y1,x2,y2]] in lines:
        if np.hypot(x1-x2,y1-y2)<195 or (y1+y2)*.5>865*h/1143: continue
        theta=np.degrees(np.arctan2(y2-y1,x2-x1))
        if abs(theta)<30 or abs(theta)>61:
            cv2.line(out,(x1,y1),(x2,y2),(37,39,43),1,cv2.LINE_AA)
target=ROOT/'assets/residence-model-v32.webp'
Image.fromarray(cv2.cvtColor(out,cv2.COLOR_BGR2RGB)).save(target,'WEBP',quality=94,method=6)
print('New pixel-aligned source:',target,w,h,target.stat().st_size)
