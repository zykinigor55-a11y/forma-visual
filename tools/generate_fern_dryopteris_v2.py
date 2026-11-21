#!/usr/bin/env python3
"""FORMA Dryopteris filix-mas v2: true CC0 photographic leaf PBR + more botanical pinnules.
Inputs: original FORMA fern generator and licensed CC0 photo by Sdjurovic (Wikimedia Commons).
The named GLB roots, placement origin, scale, frond counts and 3 alternate forms remain unchanged.
"""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('forma_original_fern',ROOT/'generate_fern_dryopteris.py')
fern=importlib.util.module_from_spec(spec);sys.modules[spec.name]=fern;spec.loader.exec_module(fern)
PHOTO_URL='https://commons.wikimedia.org/wiki/File:20220531_114609_Dryopteris_filix-mas.jpg'
AUTHOR='Sdjurovic'

def build_photo_atlas(photo_path, size=512):
    photo_path=Path(photo_path)
    if not photo_path.is_file():raise FileNotFoundError('CC0 fern photo missing: '+str(photo_path))
    photo_raw=photo_path.read_bytes()
    photo=Image.open(photo_path).convert('RGB')
    dimensions=list(photo.size)
    if photo.size[0]<2000 or photo.size[1]<1600:
        raise ValueError('Wrong or low-resolution fern photo source: '+str(photo.size))
    image=np.asarray(photo.resize((1152,864),Image.Resampling.LANCZOS),dtype=np.uint8)
    green=(image[:,:,1].astype(np.float32)>image[:,:,0]*1.10)&(image[:,:,1]>image[:,:,2]*.97)&(image[:,:,1]>60)&(image[:,:,0]<150)
    rng=np.random.default_rng(2026112103)
    candidates=[]
    p=28
    for _ in range(2600):
        x=int(rng.integers(18,image.shape[1]-p-18));y=int(rng.integers(18,image.shape[0]-p-18))
        if green[y:y+p,x:x+p].mean()>.74:
            patch=image[y:y+p,x:x+p].astype(np.float32)
            if patch[:,:,1].std()>2.5:candidates.append((x,y))
        if len(candidates)>=105:break
    if len(candidates)<15:raise ValueError('Not enough clean fern leaf photo patches. Check original image. '+str(len(candidates)))
    print('Photo patch candidates',len(candidates),'source size',dimensions,flush=True)
    # Fine green epidermis genuinely originates in the photographed fern. Blend a
    # seamless array of leaf-only micro-crops, never the background/soil pixels.
    pixels=np.zeros((size,size,3),dtype=np.float32)
    weights=np.zeros((size,size),dtype=np.float32)
    tile=64;overlap=9
    window=np.hanning(tile+2*overlap).astype(np.float32)
    alpha=np.outer(window,window)
    for yy in range(-1,size//tile+1):
        for xx in range(-1,size//tile+1):
            cx,cy=candidates[int(rng.integers(len(candidates)))]
            sample=image[cy:cy+p,cx:cx+p].astype(np.float32)
            sample_green=green[cy:cy+p,cx:cx+p]
            foreground=np.median(sample[sample_green],axis=0)
            sample[~sample_green]=foreground
            patch=np.asarray(Image.fromarray(sample.astype(np.uint8),'RGB').resize((tile+2*overlap,tile+2*overlap),Image.Resampling.LANCZOS),dtype=np.float32)
            patch_mean=patch.reshape(-1,3).mean(axis=0)
            patch=(patch-patch_mean)*.79+np.array([75,147,78],dtype=np.float32)
            lft=xx*tile-overlap;top=yy*tile-overlap
            x0=max(0,lft);y0=max(0,top);x1=min(size,lft+tile+2*overlap);y1=min(size,top+tile+2*overlap)
            if x1<=x0 or y1<=y0:continue
            sub=patch[y0-top:y1-top,x0-lft:x1-lft]
            weight=alpha[y0-top:y1-top,x0-lft:x1-lft]
            pixels[y0:y1,x0:x1]+=sub*weight[:,:,None]
            weights[y0:y1,x0:x1]+=weight
    pixels/=np.maximum(weights[:,:,None],.001)
    # Gentle lanceolate leaflet center vein & branching venation track each UV-mapped leaf,
    # with rough/creased microdetail from the true source photo.
    y,x=np.mgrid[0:size,0:size].astype(np.float32);X=x/(size-1);Y=y/(size-1)
    ridge=np.exp(-((Y-.5)/.026)**2)*.115
    sideveins=np.sin((Y-.5)*31*math.pi + np.sign(Y-.5)*(X*20+5))*.028
    light=(ridge*.68 + sideveins*.5)*255
    pixels[:,:,1]+=light
    pixels[:,:,0]+=light*.42;pixels[:,:,2]+=light*.50
    # Natural dark middle seam and mild edge translucency without cartoon outlines.
    edge=(np.abs(Y-.5)/.5)**1.3
    pixels*=((1-.07*edge)*(0.98+.035*np.cos(X*2.8)))[:,:,None]
    albedo=Image.fromarray(np.clip(pixels,0,255).astype(np.uint8),'RGB')
    photo_micro=np.asarray(albedo.filter(ImageFilter.GaussianBlur(1.0)),dtype=np.float32)[:,:,1]/255.
    photo_macro=np.asarray(albedo.filter(ImageFilter.GaussianBlur(6.0)),dtype=np.float32)[:,:,1]/255.
    height=(photo_micro-photo_macro)*.24 + ridge*.46 +sideveins*.20
    dy,dx=np.gradient(height)
    normals=np.stack([
        np.clip(128-dx*180,0,255),np.clip(128-dy*180,0,255),
        np.full((size,size),251,dtype=np.float32)
    ],axis=2).astype(np.uint8)
    normal=Image.fromarray(normals,'RGB')
    detail={'photoSource':PHOTO_URL,'photoAuthor':AUTHOR,'license':'CC0 1.0 public domain',
            'sourcePhotoSHA256':hashlib.sha256(photo_raw).hexdigest(),
            'sourceDimensions':dimensions,'verifiedLeafCropCount':len(candidates),
            'atlasSize':[size,size], 'maps':['baseColor','normal'],
            'technique':'real photograph green-only micro crops, UV-fitted raised leaf vein, photo-derived tangent normal'}
    return albedo,normal,detail

def improved_pinnule(bucket,base,axis,blade_dir,L,w,curve,variation=0):
    # Keep the 8 physical facets/leaf of v1, but sculpt asymmetrical jagged ends,
    # variable edge inflections, and a twisted raised midrib. No paper-flat sprites.
    a=axis/max(1e-9,np.linalg.norm(axis))
    v=blade_dir/max(1e-9,np.linalg.norm(blade_dir))
    n=np.cross(a,v);n/=max(1e-8,np.linalg.norm(n))
    phase=math.sin(base[0]*137.31+base[1]*224.14+base[2]*74.2)*.5+.5
    side=variation*.10+(.5-phase)*.11
    local_w=w*(.83+.28*phase)
    mid=base+v*(.50*L)+n*(curve+.0009)
    v0=base
    v1=base+v*(.18*L)-a*local_w*(.62+side)+n*curve*.21
    v2=base+v*(.44*L)-a*local_w*(1+.11*phase)+n*curve*.38
    # The small indent before the tip breaks the v1 computer-generated rhythm.
    v3=base+v*(.79*L)-a*local_w*(.43+.13*variation)+n*curve*.16
    tip=base+v*(1+.025*variation)*L+a*local_w*(.03+.13*side)+n*curve*.04
    v5=base+v*(.73*L)+a*local_w*(.54-.12*variation)+n*curve*.25
    v6=base+v*(.50*L)+a*local_w*(.88-.08*phase)+n*curve*.42
    v7=base+v*(.19*L)+a*local_w*(.68-side)+n*curve*.23
    faces=[(0,1,8),(1,2,8),(2,3,8),(3,4,8),(4,5,8),(5,6,8),(6,7,8),(7,0,8)]
    uv=[(0,.5),(.18,.16),(.44,.03),(.79,.27),(1,.5),(.73,.74),(.50,.96),(.19,.85),(.50,.5)]
    bucket.add([v0,v1,v2,v3,tip,v5,v6,v7,mid],faces,uv)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('glb',type=Path)
    ap.add_argument('metadata',type=Path)
    ap.add_argument('photo',type=Path)
    args=ap.parse_args()
    albedo,normal,photo_detail=build_photo_atlas(args.photo)
    fern.atlas_png=lambda size=512:(albedo,normal)
    fern.add_pinnule=improved_pinnule
    # Original model keeps exact three root names and center = (0,0,0).
    meta=fern.generate(str(args.glb),str(args.metadata))
    meta['version']='2.0 FORMA TRUE CC0-photographed leaf epidermis, organic asymmetrical fern pinnules'
    meta['source']='Original FORMA 3D geometry enhanced with CC0 Wikimedia male-fern photograph. License: CC0 1.0; photographer Sdjurovic.'
    meta['photoTexture']=photo_detail
    meta['botany']='Dryopteris filix-mas, 3 natural-height rosettes, pinnate-pinnatifid lamina, tapered and irregular toothed pinnules'
    meta['materialNotes']='Embedded original CC0 photographic epidermis and normal map on every 3D pinnule; no AI or texture swap on an image'
    args.metadata.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('FINAL',meta['sha256'],meta['triangleCount'],meta['sizeBytes'])

if __name__=='__main__':main()
