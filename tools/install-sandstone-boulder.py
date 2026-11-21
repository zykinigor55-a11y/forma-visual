#!/usr/bin/env python3
"""Install exact CC0 dry sandstone photogrammetry from Poly Haven, self-hosted GLB.
Material: Namaqualand Boulder 05; original PBR maps and triangulated mesh.
"""
import importlib.util
import hashlib
import json
import pathlib
import struct

source = pathlib.Path("tools/install-real-landscape-models.py")
spec=importlib.util.spec_from_file_location("forma_polyhaven_importer",source)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
slug="namaqualand_boulder_05"
directory=pathlib.Path("assets/landscape-models")
directory.mkdir(parents=True,exist_ok=True)
dest=directory/"sandstone-boulder.glb"
desc=json.loads(module.get("https://api.polyhaven.com/files/"+slug,450000))
gltf_info=desc["gltf"]["1k"]["gltf"]
gltf=json.loads(module.verified_file(gltf_info))
packed=module.embed_gltf(gltf,gltf_info["include"])
assert packed[:4]==b"glTF"
assert struct.unpack_from("<I",packed,4)[0]==2
assert struct.unpack_from("<I",packed,8)[0]==len(packed)
assert 300000 < len(packed) < 30*1024*1024
dest.write_bytes(packed)
proof={"source":"https://polyhaven.com/a/"+slug,"license":"CC0-1.0",
 "assetType":"polyhaven-scanned-3D-sandstone-boulder",
 "gltfTextureResolution":"1k","filepath":str(dest),
 "bytes":len(packed),"sha256":hashlib.sha256(packed).hexdigest()}
(directory/"sandstone-boulder-source.json").write_text(json.dumps(proof,indent=2)+"\n")
print("REAL GEOLOGICAL SANDSTONE GLB INSTALLED",json.dumps(proof))
