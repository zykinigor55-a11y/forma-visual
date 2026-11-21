#!/usr/bin/env python3
"""Convert a few licensed but overweight Poly Haven trees into usable WebGL GLBs.
Runs only on GitHub Actions; no originals are overwritten. Does NOT stage models
that are too heavy, lack photos, or fail glTF structural checks.
"""
import hashlib
import importlib.util
import json
import pathlib
import subprocess
import tempfile
import urllib.parse
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location("forma_tree_installer",ROOT/"tools"/"install-polyhaven-tree-collection.py")
installer=importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)
OUT=ROOT/"assets"/"landscape-models"
OPTIONS={"ph-tree-small":"tree_small_02",
         "ph-island-02":"island_tree_02",
         "ph-jacaranda":"jacaranda_tree"}
MAX_INPUT=275_000_000
MAX_OUTPUT=30_000_000

def fetch_file(entry,path):
 expected=int(entry["size"])
 if expected>MAX_INPUT:raise ValueError(f"single dependency too heavy: {expected}")
 path.parent.mkdir(parents=True,exist_ok=True)
 md5=hashlib.md5()
 req=urllib.request.Request(entry["url"],headers={"User-Agent":"FORMA-Visual-Tree-Optimiser/1.0"})
 with urllib.request.urlopen(req,timeout=130) as response,path.open("wb") as f:
  length=0
  while part:=response.read(1024*1024):
   length+=len(part)
   if length>MAX_INPUT:raise ValueError("unexpected huge download")
   md5.update(part);f.write(part)
 if length!=expected or md5.hexdigest()!=entry["md5"]:
  raise ValueError("source file checksum mismatch: "+entry["url"])

def download_scene(slug,directory):
 api=json.loads(installer.helper.get("https://api.polyhaven.com/files/"+slug,350_000))
 entry=api["gltf"]["1k"]["gltf"]
 files=[entry,*entry["include"].values()]
 total=sum({x["url"]:x["size"] for x in files}.values())
 if total>MAX_INPUT:raise ValueError("source exceeds 275MB")
 scene=directory/"asset.gltf"
 fetch_file(entry,scene)
 for relative,link in entry["include"].items():
  rel=pathlib.PurePosixPath(urllib.parse.unquote(relative))
  if rel.is_absolute() or ".." in rel.parts:raise ValueError("unsafe source path")
  fetch_file(link,directory/pathlib.Path(*rel.parts))
 return scene,total

def convert(binary, output, ratio):
 cmd=["gltf-transform","optimize",str(binary),str(output),
       "--texture-compress","webp","--texture-size","1024",
       "--simplify-ratio",str(ratio),"--simplify-error","0.013",
       "--compress","meshopt"]
 print("RUN",' '.join(cmd),flush=True)
 subprocess.run(cmd,check=True,timeout=420)

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 good=[];fail=[]
 for target,slug in OPTIONS.items():
  dst=OUT/(target+".glb")
  try:
   with tempfile.TemporaryDirectory(prefix="forma-polyhaven-tree-") as folder:
    root=pathlib.Path(folder)
    original,size=download_scene(slug,root)
    src=json.loads(original.read_text())
    n=installer.triangles(src)
    ratio=min(.85,max(.05,320000/max(1,n)))
    if dst.exists():
     data=dst.read_bytes()
    else:
     optimized=root/"optimized.glb"
     convert(original,optimized,ratio)
     data=optimized.read_bytes()
    stats=installer.validate_glb(data)
    if len(data)>MAX_OUTPUT:raise ValueError("optimized GLB still too heavy")
    dst.write_bytes(data)
    record={"id":target,"asset":slug,"sourcePage":"https://polyhaven.com/a/"+slug,
      "license":"CC0 1.0","optimizer":"gltf-transform optimize / meshopt + WebP 1K",
      "originalDownloadBytes":size,"originalTriangles":n,"targetSimplifyRatio":ratio,
      "sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data),"gltf":stats}
    (OUT/(target+".source.json")).write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
    thumb=OUT/"thumbs"/(target+".webp")
    if not thumb.exists():
     try:
      picture=installer.helper.get("https://cdn.polyhaven.com/asset_img/thumbs/"+slug+".png?format=webp&width=280",1_800_000)
      if picture[:4]==b"RIFF" and picture[8:12]==b"WEBP":
       thumb.parent.mkdir(exist_ok=True,parents=True);thumb.write_bytes(picture)
     except Exception as e:print("Thumb failed:",e)
    good.append(record)
    print("OPTIMIZED",target,round(len(data)/1e6,2),"MB",stats,flush=True)
  except Exception as error:
   fail.append({"id":target,"source":slug,"error":str(error)})
   print("NOT INSTALLED",target,str(error),flush=True)
 (OUT/"polyhaven-optimized-trees.json").write_text(json.dumps(
  {"installed":good,"notInstalled":fail,"license":"CC0 1.0"},ensure_ascii=False,indent=2)+"\n")
 if not good:raise SystemExit("No optimized model passed validation; keep originals unchanged")

if __name__=="__main__":main()
