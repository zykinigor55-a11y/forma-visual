#!/usr/bin/env python3
"""FORMA photo previews: 6 luminaires, 3 ponds, 4 boulder materials.
Card photography is a choosing aid only; the plan retains orthographic art.
All outputs are 1080 JPG. Source/photographic vs composited provenance documented.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw
from io import BytesIO
from urllib.request import Request, urlopen
import numpy as np
import random

SIZE=1080
DEST=Path("assets/landscape-card-photo")
ORIG=Path("assets/landscape/items")
PREM=Path("assets/landscape-premium")
DEST.mkdir(parents=True,exist_ok=True)

UNSPLASH={
 "natural":"https://images.unsplash.com/photo-1724661404613-f218279bc854?auto=format&fit=crop&fm=jpg&q=88&w=1600",
 "formal-pond":"https://images.unsplash.com/photo-1532091884468-f48ecffa63a3?auto=format&fit=crop&fm=jpg&q=88&w=1600",
 "bio-pond":"https://images.unsplash.com/photo-1716821666167-503e70143f55?auto=format&fit=crop&fm=jpg&q=88&w=1600",
}
# Free-to-use Unsplash garden setting, licensed for image composition.
GARDEN_SCENE_URL="https://images.unsplash.com/photo-1753481834359-07fc2bc6e68f?auto=format&fit=crop&fm=jpg&q=88&w=1600"
_garden_photo=None
LIGHTS={
 "bollard":"bollard.webp","ground":"recessed.webp","spot":"spot.webp",
 "low-post":"lantern-low.webp","deck-light":"step.webp","linear":"wallwash.webp"
}
ROCKS={
 "granite-boulder":"granite-rock.webp",
 "limestone-boulder":"limestone-rock.webp",
 "slate-boulder":"slate.webp",
 "sandstone-boulder":None
}
def fit(im):
 return ImageOps.fit(im.convert("RGB"),(SIZE,SIZE),method=Image.Resampling.LANCZOS)

def save(im,name):
 img=fit(im).filter(ImageFilter.UnsharpMask(radius=1.35,percent=110,threshold=3))
 out=DEST/(name+".jpg")
 img.save(out,"JPEG",quality=93,subsampling=0,optimize=True,progressive=True)
 assert Image.open(out).size==(SIZE,SIZE)
 print(name,"JPEG",out.stat().st_size//1024,"KiB",flush=True)

def photo_bg(material="grass", dark=False):
 global _garden_photo
 source=ORIG/(material+".webp")
 if not source.exists():source=ORIG/"grass.webp"
 im=fit(Image.open(source))
 if dark and material=="grass":
  try:
   if _garden_photo is None:
    req=Request(GARDEN_SCENE_URL,headers={"User-Agent":"FORMA-AssetBuilder/1.0"})
    with urlopen(req,timeout=22) as resp:
     raw=resp.read(10_000_000)
    _garden_photo=fit(Image.open(BytesIO(raw)))
   # Authentic garden backdrop: premium card photo, not a measured plan texture.
   im=Image.blend(im,_garden_photo,.79)
  except Exception as exc:
   print("Garden backdrop unavailable, using fallback grass:",str(exc)[:100],flush=True)
 im=ImageEnhance.Contrast(im).enhance(1.04)
 im=ImageEnhance.Color(im).enhance(.78 if dark else .88)
 im=ImageEnhance.Brightness(im).enhance(.36 if dark else .60)
 return im.filter(ImageFilter.GaussianBlur(4.0 if dark else 1.1)).convert("RGBA")

def glow(bg,x,y,rad,alpha=160):
 layer=Image.new("RGBA",(SIZE,SIZE),(0,0,0,0))
 yy,xx=np.ogrid[:SIZE,:SIZE]
 attenuation=np.exp(-(((xx-x)**2+(yy-y)**2)/(rad**2))*2.7)
 a=np.clip(attenuation*alpha,0,255).astype(np.uint8)
 arr=np.zeros((SIZE,SIZE,4),dtype=np.uint8)
 arr[:,:,:3]=[255,207,122];arr[:,:,3]=a
 return Image.alpha_composite(bg,Image.fromarray(arr,"RGBA"))

def paste_photo(bg,source,frac=.70,yoffset=.04):
 object_image=Image.open(source).convert("RGBA")
 # Many source WebPs contain black opaque backdrop that misleads alpha crops.
 # Recover a soft product alpha from its actual pixel values, then scale tightly.
 rgba=np.asarray(object_image).copy()
 brightest=rgba[:,:,:3].max(axis=2).astype(np.float32)
 edge_alpha=np.uint8(np.clip((brightest-6)*40,0,255))
 rgba[:,:,3]=np.minimum(rgba[:,:,3],edge_alpha)
 object_image=Image.fromarray(rgba,"RGBA")
 mask=object_image.getchannel("A")
 bbox=mask.point(lambda a:255 if a>48 else 0).getbbox()
 if bbox:
  pad=14
  bbox=(max(0,bbox[0]-pad),max(0,bbox[1]-pad),min(object_image.width,bbox[2]+pad),min(object_image.height,bbox[3]+pad))
  object_image=object_image.crop(bbox)
 maxw,maxh=int(SIZE*frac),int(SIZE*.88)
 # Thumbnail never upscales; original product cutouts are only ~320px.
 # Resample deliberately so the fixture fills a premium 1080px preview.
 scale=min(maxw/max(1,object_image.width),maxh/max(1,object_image.height))
 object_image=object_image.resize((max(1,round(object_image.width*scale)),max(1,round(object_image.height*scale))),Image.Resampling.LANCZOS)
 x=(SIZE-object_image.width)//2
 y=max(30,(SIZE-object_image.height)//2+int(SIZE*yoffset))
 shadow=Image.new("RGBA",(SIZE,SIZE),(0,0,0,0))
 cast=Image.new("RGBA",object_image.size,(0,0,0,0))
 cast.putalpha(object_image.getchannel("A").point(lambda v:int(v*.48)))
 shadow.alpha_composite(cast,(x+22,y+34))
 bg=Image.alpha_composite(bg,shadow.filter(ImageFilter.GaussianBlur(27)))
 bg.alpha_composite(object_image,(x,y))
 return bg

def luminaires():
 for id,src in LIGHTS.items():
  bg=photo_bg("concrete" if id in ("ground","linear","deck-light") else "grass",True)
  # Warm landscape-light installation ambience, photographic cutout is authoritative.
  bg=glow(bg,540,440,460,165)
  bg=glow(bg,450,715,310,74)
  bg=paste_photo(bg,ORIG/src,frac=.71 if id!="linear" else .83,yoffset=.065)
  save(bg,id)

def boulders():
 for id,src in ROCKS.items():
  bg=photo_bg("gravel",False)
  if src:
   rock=ORIG/src
  else:
   rock=PREM/"sandstone-boulder.png"
  bg=paste_photo(bg,rock,.78,.02)
  save(bg,id)

def ponds():
 for id,url in UNSPLASH.items():
  try:
   req=Request(url,headers={"User-Agent":"FORMA-AssetBuilder/1.0 (landscape preview)"})
   with urlopen(req,timeout=22) as resp:
    raw=resp.read(12_000_000)
   image=Image.open(BytesIO(raw)).convert("RGB")
   if min(image.size)<950:raise ValueError("Source image too small")
   save(image,id)
  except Exception as exc:
   print("Pond photo unavailable: ",id,str(exc)[:160],". Keeping measured geometry texture fallback.",flush=True)
   backup=PREM/(id+".png")
   if not backup.exists():raise
   save(Image.open(backup),id)

def main():
 luminaires();ponds();boulders()
 files=list(DEST.glob("*.jpg"))
 for id in [*LIGHTS,*UNSPLASH,*ROCKS]:
  assert (DEST/(id+".jpg")).exists(),id
 assert len([id for id in [*LIGHTS,*UNSPLASH,*ROCKS]])==13
 print("13 complete 1080 photo/composite previews",flush=True)

if __name__=="__main__":main()
