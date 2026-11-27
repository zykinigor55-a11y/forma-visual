"""Prepare local transparent photo belts from official CC0 downloads."""
from pathlib import Path
from PIL import Image, ImageChops
from urllib.request import Request, urlopen
import io, zipfile
out=Path('assets/panoramas/r200')
out.mkdir(parents=True,exist_ok=True)
for asset in ('Backdrop006',):
    url='https://ambientcg.com/get?file='+asset+'_8K-PNG.zip'
    with urlopen(Request(url,headers={'User-Agent':'FORMA-asset-import/1.0'}),timeout=120) as r:
        z=zipfile.ZipFile(io.BytesIO(r.read()))
    names=[n for n in z.namelist() if n.lower().endswith('.png') and '__macosx' not in n.lower()]
    if not names: raise RuntimeError(f'{asset}: no PNG')
    imgs=[(n,Image.open(io.BytesIO(z.read(n)))) for n in names]
    imgs.sort(key=lambda q:q[1].width*q[1].height,reverse=True)
    masks=[(n,i) for n,i in imgs if any(k in n.lower() for k in ('opacity','alpha','mask'))]
    candidates=[(n,i) for n,i in imgs if not any(k in n.lower() for k in ('opacity','alpha','mask','normal','roughness','height'))]
    if not candidates: raise RuntimeError(f'{asset}: no color PNG: {names}')
    name,im=candidates[0];im=im.convert('RGBA')
    if im.getchannel('A').getextrema()[0]==255:
        if not masks: raise RuntimeError(f'{asset}: no transparency: {names}')
        mask=masks[0][1].convert('L').resize(im.size,Image.Resampling.LANCZOS);im.putalpha(mask)
    if im.getchannel('A').getextrema()[0]>=250: raise RuntimeError(f'{asset}: opaque photo rejected')
    box=im.getchannel('A').getbbox()
    if not box: raise RuntimeError(f'{asset}: empty alpha')
    im=im.crop((0,box[1],im.width,box[3]))
    for w,tag in [(4096,'4k'),(8192,'8k')]:
        width=min(im.width,w);height=max(1,round(im.height*width/im.width))
        im.resize((width,height),Image.Resampling.LANCZOS).save(out/f'{asset}-{tag}.png',optimize=True)
        print(asset,tag,width,height)

# Real 360-degree panorama by Tiia Monto, CC BY-SA 4.0.
# Retain the original 360-degree azimuth projection and mask only the sky.
import numpy as np
import cv2
urls=['https://upload.wikimedia.org/wikipedia/commons/9/9b/Mountains_panorama.jpg','https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Mountains_panorama.jpg/3840px-Mountains_panorama.jpg']
for url in urls:
    try:
        with urlopen(Request(url,headers={'User-Agent':'FORMA Visual Asset Import/1.0 (https://github.com/zykinigor55-a11y/forma-visual)'}),timeout=90) as r:
            im=Image.open(io.BytesIO(r.read())).convert('RGB')
        break
    except Exception as e: print(e)
else: raise RuntimeError('Mountain panorama download failed')
width=min(8192,im.width)
im=im.resize((width,round(im.height*width/im.width)),Image.Resampling.LANCZOS)
# Guide trace on the published 1000x127 preview; refine edge with constrained GrabCut.
pts=[(0,83),(15,81),(30,82),(43,83),(60,81),(75,76),(89,65),(103,56),(118,49),(130,38),(145,38),(157,35),(170,36),(181,50),(196,60),(217,70),(245,82),(267,84),(280,78),(290,73),(307,62),(320,60),(336,53),(348,54),(360,48),(372,43),(381,49),(394,48),(405,38),(419,54),(435,59),(451,67),(465,70),(481,68),(496,72),(512,77),(533,86),(546,81),(557,75),(573,70),(595,69),(609,66),(625,70),(641,73),(652,68),(664,73),(679,77),(694,87),(709,91),(725,84),(742,73),(754,65),(766,65),(781,54),(798,53),(812,58),(828,65),(847,69),(862,79),(877,89),(894,90),(910,87),(930,84),(948,82),(966,81),(984,79),(1000,83)]
rgb=np.array(im)
hh,ww=rgb.shape[:2]
# Work at 2K for a constrained sky-edge refinement, upscale the alpha afterwards.
workw=min(2048,ww);workh=round(hh*workw/ww)
work=cv2.resize(rgb,(workw,workh),interpolation=cv2.INTER_AREA)
curve=np.interp(np.arange(workw)*1000/workw,[p[0] for p in pts],[p[1] for p in pts])*workh/127
yy=np.arange(workh)[:,None]
delta=yy-curve[None,:]
mask=np.full((workh,workw),cv2.GC_PR_BGD,np.uint8)
mask[delta>0]=cv2.GC_PR_FGD;mask[delta<-workh*.045]=cv2.GC_BGD;mask[delta>workh*.055]=cv2.GC_FGD
try:
    cv2.grabCut(work,mask,None,np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),4,cv2.GC_INIT_WITH_MASK)
    alpha=np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD),255,0).astype(np.uint8)
    # Enforce continuous ground below the first persistent mountain pixels in each column.
    for x in range(workw):
        ids=np.flatnonzero(alpha[:,x]>0)
        start=next((int(y) for y in ids if y+3<workh and np.all(alpha[y:y+4,x]>0)),int(curve[x]))
        alpha[:,x]=0;alpha[start:,x]=255
except cv2.error:
    alpha=np.where(delta>=0,255,0).astype(np.uint8)
alpha=cv2.GaussianBlur(alpha,(3,3),.55)
alpha=Image.fromarray(alpha).resize(im.size,Image.Resampling.LANCZOS)
im.putalpha(alpha);box=alpha.getbbox()
# Crop off the field and most of the village: ground is supplied by the 3D editor.
bottom=round(hh*94/127)
im=im.crop((0,box[1],ww,bottom))
for w,tag in [(4096,'4k'),(8192,'8k')]:
    target=min(w,im.width);h=round(im.height*target/im.width)
    im.resize((target,h),Image.Resampling.LANCZOS).save(out/f'Alpine360-{tag}.png',optimize=True)
    print('Alpine360',target,h)
