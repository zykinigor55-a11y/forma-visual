#!/usr/bin/env python3
"""Audit all 51 FORMА landscape assets and build only truly approved native 2K masters.

Usage:
 python scripts/landscape_asset_quality.py --audit --report /tmp/landscape.json
 python scripts/landscape_asset_quality.py --build-approved --report /tmp/landscape.json

Important: upscaling low-res thumbnails is NOT true 2K detail. This script never
labels an interpolated thumbnail as a high-quality approved botanical asset.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parent.parent
CATALOG=ROOT/"forma-art-direction-core.js"
SOURCE=ROOT/"assets/landscape/items"
MASTERS=ROOT/"assets/landscape/masters"
HD=ROOT/"assets/landscape/hd"
JS=ROOT/"forma-landscape-hd.js"
CATEGORIES=("PLANTS","TREES","FILLS","PAVINGS","EDGES","OBJECTS","LIGHTS","EXTRA_LIGHTS")
BOTANICAL={"PLANTS","TREES"}
TEXTURE={"FILLS","PAVINGS"}

def inventory():
    text=CATALOG.read_text(encoding="utf-8")
    entries={}
    for category in CATEGORIES:
        match=re.search(r"export const "+category+r"=Object\.freeze\(\[([\s\S]*?)\]\);",text)
        if not match: raise ValueError(f"Catalog category missing: {category}")
        for item_id,name in re.findall(r"\{id:'([^']+)',name:'([^']+)'",match.group(1)):
            if item_id in entries: raise ValueError(f"Duplicate catalog ID: {item_id}")
            entries[item_id]={"id":item_id,"name":name,"category":category}
    if len(entries)!=51: raise ValueError(f"Expected 51 selectable assets; found {len(entries)}")
    return entries

def get_master(item_id):
    files=[MASTERS/(item_id+ext) for ext in (".png",".webp",".jpg",".jpeg")]
    found=[p for p in files if p.is_file()]
    if len(found)>1: raise ValueError(f"Ambiguous masters for {item_id}")
    return found[0] if found else None

def measure(path):
    with Image.open(path) as image:
        image.load()
        rgba=image.convert("RGBA")
        alpha=rgba.getchannel("A")
        lo,hi=alpha.getextrema()
        return {"width":image.width,"height":image.height,"mode":image.mode,
                "has_transparency":lo<255,"alpha_min":lo,
                "alpha_max":hi,"bytes":path.stat().st_size}

def audit(items):
    extra=sorted(x.stem for x in SOURCE.glob("*.webp") if x.stem not in items)
    if extra: raise ValueError(f"Orphan landscape image files: {extra}")
    records=[]
    for item_id,entry in items.items():
        filename=SOURCE/(item_id+".webp")
        if not filename.is_file():raise FileNotFoundError(f"Missing catalog image {filename}")
        image=measure(filename)
        master=get_master(item_id)
        verified=None
        warning=[]
        if master:
            verified=measure(master)
            if max(verified["width"],verified["height"])<2000:
                warning.append("master_not_native_2k")
            if entry["category"] in BOTANICAL and not verified["has_transparency"]:
                warning.append("botanical_master_not_transparent")
        if max(image["width"],image["height"])<1800:
            warning.append("preview_is_low_resolution")
        if entry["category"] in BOTANICAL and not image["has_transparency"]:
            warning.append("botanical_preview_without_alpha")
        records.append({**entry,"preview":image,
                        "master":str(master.relative_to(ROOT)) if master else None,
                        "master_info":verified,"warnings":warning})
    return {"catalog_count":len(records),
            "botanical_count":sum(x["category"] in BOTANICAL for x in records),
            "master_count":sum(x["master"] is not None for x in records),
            "approved_master_count":sum(x["master"] is not None and not any(y.endswith("not_native_2k") or y.endswith("not_transparent") for y in x["warnings"]) for x in records),
            "records":records}

def make_hd(src, dest, is_botanical):
    # Only accepts real >=2K master inputs; never 4x-resize a 256px WebP.
    with Image.open(src) as source:
        source.load()
        if max(source.size)<2000:
            raise ValueError(f"Not a native >=2K source: {src} {source.size}")
        source=source.convert("RGBA")
        if is_botanical and source.getchannel("A").getextrema()[0]>=255:
            raise ValueError(f"Transparent cutout is required: {src}")
        if is_botanical:
            image=Image.new("RGBA",(2048,2048),(0,0,0,0))
            bounded=ImageOps.contain(source,(1938,1938),method=Image.Resampling.LANCZOS)
            image.alpha_composite(bounded,((2048-bounded.width)//2,(2048-bounded.height)//2))
        else:
            image=ImageOps.fit(source,(2048,2048),method=Image.Resampling.LANCZOS,centering=(.5,.5))
        dest.parent.mkdir(parents=True,exist_ok=True)
        image.save(dest,"WEBP",lossless=False,quality=93,method=6)
        with Image.open(dest) as check:
            if check.size!=(2048,2048):raise ValueError(f"Wrong output size: {dest}")

def build_approved(items):
    ids=[]
    for item_id,entry in items.items():
        master=get_master(item_id)
        if not master:continue
        dest=HD/(item_id+".webp")
        make_hd(master,dest,entry["category"] in BOTANICAL)
        ids.append(item_id)
    # This generated file is consumed by the editor. Only successfully built
    # true 2K assets are referenced. All other items use original thumbnails.
    JS.write_text("/* Generated by scripts/landscape_asset_quality.py. No fake 2K from low-res. */\n"
                  +"export const READY_HD_ASSETS=Object.freeze("+json.dumps(ids,ensure_ascii=False)+");\n",
                  encoding="utf-8")
    return ids

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--audit",action="store_true")
    p.add_argument("--build-approved",action="store_true")
    p.add_argument("--report",type=Path)
    args=p.parse_args()
    items=inventory()
    report=audit(items)
    if args.build_approved:
        report["built_hd"]=build_approved(items)
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Assets: {report['catalog_count']}, botanical: {report['botanical_count']}, "
          f"available approved 2K masters: {report['approved_master_count']}")
    for row in report["records"]:
        if row["warnings"]:
            print(f" - {row['id']:18s} {row['preview']['width']}x{row['preview']['height']} "
                  f"{', '.join(row['warnings'])}")
    return 0

if __name__=="__main__":
    sys.exit(main())
