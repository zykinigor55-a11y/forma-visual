#!/usr/bin/env python3
"""Prepare native-size 1080×1080 JPG surface cards from existing 1080 masters.

This preserves the project's accurate material labels and camera-facing
pattern arrangement. Botanical cutouts are intentionally excluded and must
remain transparent PNG. Never overwrite a user-supplied photographic JPG.
"""
from pathlib import Path
from PIL import Image, ImageOps

SOURCE=Path("assets/landscape-premium")
TARGET=Path("assets/landscape-photo")
IDS=(
 "concrete-pavers","granite-setts","clinker-herringbone",
 "slate-pavers","radial-setts","grass-grid",
 "marble-chips","granite-chips","river-pebble",
 "slate-chips","pine-bark",
 "formal","universal","shade","meadow"
)

def build():
 TARGET.mkdir(parents=True,exist_ok=True)
 results=[]
 for asset_id in IDS:
  target=TARGET/(asset_id+".jpg")
  if target.exists():
   im=Image.open(target)
   if im.format!="JPEG" or im.size!=(1080,1080):
    raise ValueError(f"Existing photo is not a 1080 JPG: {target}")
   results.append((target.name,"preserved"));continue
  original=SOURCE/(asset_id+".png")
  if not original.exists():raise FileNotFoundError(original)
  im=Image.open(original).convert("RGBA")
  base=Image.new("RGBA",im.size,(229,228,221,255))
  base.alpha_composite(im)
  jpg=ImageOps.fit(base.convert("RGB"),(1080,1080),Image.Resampling.LANCZOS)
  jpg.save(target,"JPEG",quality=93,subsampling=0,optimize=True,progressive=True)
  results.append((target.name,"created"))
 for name,status in results:print(status,name,flush=True)
 assert len(results)==15
if __name__=="__main__":build()
