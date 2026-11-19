#!/usr/bin/env python3
"""Add vetted CC0 Tevy botanical models to FORMA without remote runtime dependencies."""
import datetime
import hashlib
import json
import pathlib
import struct
import time
from urllib.request import Request, urlopen
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "assets" / "landscape-models"
MANIFEST_PATH = DEST / "tevy-trees.sources.json"
MAX_BYTES = 10 * 1024 * 1024

def validate(data, species):
    if not 50_000 <= len(data) <= MAX_BYTES:
        raise ValueError(f"{species}: GLB outside safety bounds ({len(data)} bytes)")
    if len(data) < 20: raise ValueError("Truncated GLB")
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or length != len(data):
        raise ValueError(f"{species}: invalid GLB v2 header")
    chunk_length, kind = struct.unpack_from("<I4s", data, 12)
    if kind != b"JSON" or 20 + chunk_length > len(data):
        raise ValueError("Corrupted GLB JSON chunk")
    gltf = json.loads(data[20:20+chunk_length])
    meshes, materials = gltf.get("meshes", []), gltf.get("materials", [])
    if not meshes or len(materials) < 1:
        raise ValueError(f"{species}: no mesh or PBR material")
    tris = 0
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            accessor = primitive.get("indices", primitive.get("attributes", {}).get("POSITION"))
            if accessor is not None: tris += gltf["accessors"][accessor]["count"] // 3
    if tris < 5000 or tris > 400_000:
        raise ValueError(f"{species}: triangle count not credible for adult tree: {tris}")
    for asset in gltf.get("images", []) + gltf.get("buffers", []):
        uri = asset.get("uri")
        if uri and not uri.startswith("data:"):
            raise ValueError(f"{species}: GLB must not reference external textures/meshes")
    return {
        "meshCount":len(meshes),"triangles":tris,
        "materials":len(materials),"images":len(gltf.get("images",[])),
        "extensionsUsed":gltf.get("extensionsUsed",[]),
        "alphaMaterials":sum(m.get("alphaMode") in ("MASK","BLEND") for m in materials)
    }

def get(url):
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent":"FORMA-botany-CC0/1.0"})
            with urlopen(request,timeout=40) as response:
                final_url=response.url
                parsed=urlparse(final_url)
                if parsed.scheme!="https" or parsed.hostname not in ("tevy.dev","www.tevy.dev"):
                    raise ValueError("Download redirected outside trusted publisher: "+final_url)
                return response.read(MAX_BYTES+1),final_url
        except Exception as exc:
            if attempt==2: raise
            print("Retry",url,str(exc),flush=True)
            time.sleep(2+attempt*3)

def main():
    manifest=json.loads(MANIFEST_PATH.read_text())
    if manifest.get("license")!="CC0 1.0":raise ValueError("Unlicensed asset catalogue")
    expected={"apple":"apple-tree","rowan":"rowan","aspen":"aspen"}
    if {m.get("species") for m in manifest["trees"]}!=set(expected):
        raise ValueError("Unreviewed/missing adult tree")
    for model in manifest["trees"]:
        species=model["species"];slug=expected[species]
        source=f"https://tevy.dev/models/{slug}"
        url=f"https://tevy.dev/models/{slug}/v1/lod0.glb"
        if model["sourcePage"]!=source or model["download"]!=url or model["file"]!=f"{species}-mature-cc0.glb":
            raise ValueError("Expected pinned and verified Tevy CC0 source")
        data,final_url=get(url)
        analysis=validate(data,species)
        file=DEST / model["file"]
        file.write_bytes(data)
        audit={
            "species":species,"name":model["name"],"origin":"Tevy",
            "license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/",
            "sourcePage":source,"sourceDownload":url,"resolvedDownload":final_url,
            "sha256":hashlib.sha256(data).hexdigest(),"sizeBytes":len(data),
            "retrievedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "analysis":analysis,"runtime":"self-hosted local GLB; KTX2+Meshopt decoders bundled"
        }
        file.with_suffix(".source.json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n")
        print("VERIFIED",species,json.dumps(analysis),flush=True)
if __name__=="__main__":main()
