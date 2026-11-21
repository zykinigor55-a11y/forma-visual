#!/usr/bin/env python3
"""Import honest low-resolution CC0 Poly Haven tree GLBs for DOM.RENDER.
Safe to run repeatedly: no original FORMA models are replaced.
The official Poly Haven /files JSON supplies URLs, size and MD5 verification.
"""
from __future__ import annotations
import hashlib
import importlib.util
import json
import pathlib
import struct
import sys

ROOT=pathlib.Path(__file__).resolve().parent.parent
HELPER=ROOT/"tools"/"install-real-landscape-models.py"
spec=importlib.util.spec_from_file_location("forma_polyhaven_helper",HELPER)
helper=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)
OUT=ROOT/"assets"/"landscape-models"
MAX_TOTAL=30_000_000
MAX_TRIANGLES=480_000
# This is a separate collection. Its exact IDs never replace pine/spruce/etc.
TREES={
 "ph-tree-small":"tree_small_02",
 "ph-jacaranda":"jacaranda_tree",
 "ph-fir-forest":"fir_tree_01",
 "ph-pine-forest":"pine_tree_01",
 "ph-fir-sapling":"fir_sapling",
 "ph-fir-medium":"fir_sapling_medium",
 "ph-pine-sapling":"pine_sapling_small",
 "ph-pine-medium":"pine_sapling_medium",
 "ph-island-01":"island_tree_01",
 "ph-island-02":"island_tree_02",
 "ph-island-03":"island_tree_03",
 "ph-quiver-01":"quiver_tree_01",
 "ph-quiver-02":"quiver_tree_02",
}
def triangles(doc):
 total=0
 for mesh in doc.get("meshes",[]):
  for prim in mesh.get("primitives",[]):
   if prim.get("mode",4)!=4:continue
   index=prim.get("indices")
   if index is None:index=prim.get("attributes",{}).get("POSITION")
   if index is None:continue
   total+=int(doc["accessors"][index]["count"])//3
 return total

def validate_glb(data):
 if len(data)<80000 or data[:4]!=b"glTF" or struct.unpack_from("<II",data,4)!=(2,len(data)):
  raise ValueError("not a self-contained GLB v2")
 length,chunk=struct.unpack_from("<I4s",data,12)
 if chunk!=b"JSON":raise ValueError("GLB JSON chunk absent")
 doc=json.loads(data[20:20+length])
 tris=triangles(doc)
 if tris>MAX_TRIANGLES or tris<500:raise ValueError(f"unreasonable triangles {tris}")
 images=doc.get("images",[])
 textured=sum(bool(m.get("pbrMetallicRoughness",{}).get("baseColorTexture")) for m in doc.get("materials",[]))
 if not images or not textured:raise ValueError("model has no photographic glTF materials")
 if any("uri" in im and not im["uri"].startswith("data:") for im in images):
  raise ValueError("unpacked external image")
 return {"triangles":tris,"meshes":len(doc.get("meshes",[])),"images":len(images),"texturedMaterials":textured}

def fetch_model(slug):
 description=json.loads(helper.get("https://api.polyhaven.com/files/"+slug,380_000))
 res=description["gltf"]["1k"]["gltf"]
 entries=[res,*res["include"].values()]
 # Multiple dependencies may have the same URL; count once.
 sizes={p["url"]:p["size"] for p in entries}
 total=sum(sizes.values())
 if total>MAX_TOTAL:raise ValueError(f"Too large for interactive editor: {total/1e6:.1f} MB")
 gltf=json.loads(helper.verified_file(res))
 if triangles(gltf)>MAX_TRIANGLES:
  raise ValueError(f"Too many triangles for editor: {triangles(gltf)}")
 result=helper.embed_gltf(gltf,res["include"])
 if len(result)>MAX_TOTAL:raise ValueError("packed GLB too large")
 return result,validate_glb(result),res["url"]

def main():
 OUT.mkdir(exist_ok=True,parents=True)
 (OUT/"thumbs").mkdir(exist_ok=True,parents=True)
 success=[]
 failures=[]
 for name,slug in TREES.items():
  path=OUT/(name+".glb")
  try:
   if path.exists():
    data=path.read_bytes()
    stats=validate_glb(data)
    srcurl="https://api.polyhaven.com/files/"+slug
   else:
    data,stats,srcurl=fetch_model(slug)
    path.write_bytes(data)
   record={"id":name,"asset":slug,"sourcePage":"https://polyhaven.com/a/"+slug,
     "api":"https://api.polyhaven.com/files/"+slug,"download":srcurl,
     "license":"CC0 1.0","sha256":hashlib.sha256(data).hexdigest(),
     "bytes":len(data),"gltf":stats}
   (OUT/(name+".source.json")).write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
   # Official preview of this exact asset, self-hosted to avoid a hotlink.
   thumb=OUT/"thumbs"/(name+".webp")
   if not thumb.exists():
    try:
     thumbnail=helper.get("https://cdn.polyhaven.com/asset_img/thumbs/"+slug+".png?format=webp&width=280",1_800_000)
     if thumbnail[:4]==b"RIFF" and thumbnail[8:12]==b"WEBP":thumb.write_bytes(thumbnail)
     else:print("Thumbnail returned a different format:",slug)
    except Exception as exc:print("Thumbnail unavailable:",slug,exc)
   success.append(record)
   print("INSTALLED",name,slug,round(len(data)/1e6,2),"MB",stats,flush=True)
  except Exception as exc:
   failures.append({"id":name,"asset":slug,"reason":str(exc)})
   print("SKIPPED",name,slug,str(exc),flush=True)
 (OUT/"polyhaven-trees-manifest.json").write_text(json.dumps(
   {"source":"https://polyhaven.com/models/nature/trees",
    "license":"CC0 1.0","installed":success,"notInstalled":failures},
   ensure_ascii=False,indent=2)+"\n")
 print(f"Imported {len(success)}/{len(TREES)} Poly Haven trees; skipped {len(failures)}")
 if len(success)<2:raise SystemExit("Too few validated real trees, do not publish a fake catalogue")

if __name__=="__main__": main()
