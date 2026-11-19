#!/usr/bin/env python3
"""Stage publisher-pinned CC0 Silver Birch, with standalone audit.
Do not replace production's existing birch until side-by-side WebGL QA passes.
"""
import datetime, hashlib, json, pathlib
import importlib.util
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"/"landscape-models"
URL="https://tevy.dev/models/silver-birch/v1/lod0.glb"
PAGE="https://tevy.dev/models/silver-birch"
SPEC=importlib.util.spec_from_file_location("tevy_validate",ROOT/"tools/install-tevy-trees.py")
validator=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(validator)
def main():
 data,final_url=validator.get(URL)
 report=validator.validate(data,"birch")
 if report["triangles"]<32000 or report["alphaMaterials"]<1 or report["images"]<2:
  raise RuntimeError("Real birch must have 32k+ triangles, masked leaves and embedded PBR textures")
 file=OUT/"birch-tevy-cc0.glb"
 file.write_bytes(data)
 metadata={
  "species":"birch","name":"Silver Birch (Betula pendula) · natural drooping twigs",
  "sourcePage":PAGE,"sourceDownload":URL,"resolvedDownload":final_url,
  "license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/",
  "retrievedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "sha256":hashlib.sha256(data).hexdigest(),"sizeBytes":len(data),
  "analysis":report,"status":"candidate; old birch retained until browser visual QA passes",
  "runtime":"self-hosted glTF with KTX2+Meshopt loaders"}
 (OUT/"birch-tevy-cc0.source.json").write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+"\n")
 print("VERIFIED SILVER BIRCH",json.dumps(metadata,ensure_ascii=False),flush=True)
if __name__=="__main__":main()
