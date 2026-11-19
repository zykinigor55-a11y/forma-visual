#!/usr/bin/env python3
"""Fetch a CC0, species-correct, dense Norway spruce GLB for comparison.
Keep production spruce untouched until mobile WebGL visual tests pass.
"""
import datetime, hashlib, json, pathlib
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import importlib.util

ROOT=pathlib.Path(__file__).resolve().parents[1]
DEST=ROOT/"assets"/"landscape-models"
URL="https://tevy.dev/models/norway-spruce/v1/lod0.glb"
PAGE="https://tevy.dev/models/norway-spruce"
FILENAME="spruce-tevy-cc0.glb"
spec=importlib.util.spec_from_file_location("tevy_validate",ROOT/"tools/install-tevy-trees.py")
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def main():
    binary,final_url=mod.get(URL)
    if urlparse(final_url).hostname not in ("tevy.dev","www.tevy.dev"):
        raise RuntimeError("Unexpected remote host")
    report=mod.validate(binary,"spruce")
    if report["triangles"]<30000 or report["alphaMaterials"]<1 or report["images"]<2:
        raise RuntimeError("The spruce replacement must have dense, alpha-masked textured needles")
    (DEST/FILENAME).write_bytes(binary)
    meta={
      "species":"spruce","name":"Norway spruce · Tevy · dense alpha needle sprays",
      "sourcePage":PAGE,"sourceDownload":URL,"resolvedDownload":final_url,
      "license":"CC0 1.0",
      "licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/",
      "retrievedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "sha256":hashlib.sha256(binary).hexdigest(),
      "sizeBytes":len(binary),"analysis":report,
      "status":"candidate; production model unchanged until WebGL visual QA passes",
      "runtime":"self-hosted local GLB with KTX2 and Meshopt decoders"
    }
    (DEST/"spruce-tevy-cc0.source.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
    print("VERIFIED NORWAY SPRUCE",json.dumps(meta,ensure_ascii=False))
if __name__=="__main__":main()
