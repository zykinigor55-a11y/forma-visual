#!/usr/bin/env python3
"""Installer for verified Innerscene CC0 GLBs; no runtime dependency on outside hosts."""
import datetime
import hashlib
import json
import pathlib
import struct
import time
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "assets" / "landscape-models"
SOURCES = json.loads((DEST / "mature-trees.sources.json").read_text())
LIMIT = 15 * 1024 * 1024


def inspect(data, species):
    if not (50_000 <= len(data) <= LIMIT):
        raise ValueError(f"{species}: bad binary size {len(data)}")
    if len(data) < 20:
        raise ValueError("Incomplete GLB header")
    magic, version, length = struct.unpack_from("<4sII", data)
    if magic != b"glTF" or version != 2 or length != len(data):
        raise ValueError("Invalid GLB 2.0 file")
    chunk_length, chunk_type = struct.unpack_from("<I4s", data, 12)
    if chunk_type != b"JSON" or 20 + chunk_length > len(data):
        raise ValueError("Missing JSON chunk")
    scene = json.loads(data[20:20 + chunk_length])
    meshes, materials = scene.get("meshes", []), scene.get("materials", [])
    if not meshes or not materials:
        raise ValueError("Mesh or material missing")
    triangles = 0
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            accessor = primitive.get("indices", primitive.get("attributes", {}).get("POSITION"))
            if accessor is not None:
                triangles += scene["accessors"][accessor]["count"] // 3
    if not 1000 <= triangles <= 800000:
        raise ValueError(f"Unacceptable {species} polygon count: {triangles}")
    for value in scene.get("images", []) + scene.get("buffers", []):
        uri = value.get("uri", "")
        if uri and not uri.startswith("data:"):
            raise ValueError("External mesh/texture dependency forbidden")
    return {"meshes": len(meshes), "triangles": triangles, "materials": len(materials),
            "images": len(scene.get("images", [])),
            "alphaMaterials": sum(m.get("alphaMode") in ("MASK", "BLEND") for m in materials)}


def fetch(url):
    for i in range(3):
        try:
            req = Request(url, headers={"User-Agent": "FORMA-licensed-CC0-model-importer/1.0"})
            with urlopen(req, timeout=40) as response:
                resolved = response.url
                p = urlparse(resolved)
                if p.scheme != "https" or p.hostname not in ("files.innerscene.com", "www.innerscene.com"):
                    raise ValueError("Untrusted download redirect: " + resolved)
                data = response.read(LIMIT + 1)
            return data, resolved
        except Exception as error:
            if i == 2:
                raise
            print("Retry after", error, flush=True)
            time.sleep(3 + 2 * i)


def main():
    if SOURCES.get("license") != "CC0 1.0":
        raise ValueError("CC0 sources expected")
    if {o["species"] for o in SOURCES["trees"]} != {"spruce", "birch", "oak"}:
        raise ValueError("Missing or unreviewed species")
    for item in SOURCES["trees"]:
        species = item["species"]
        if item["file"] != species + "-mature-cc0.glb":
            raise ValueError("Unexpected file name")
        if not item["sourcePage"].startswith("https://www.innerscene.com/tools/library/3d-parts/"):
            raise ValueError("Unverified source page")
        if not item["download"].startswith("https://www.innerscene.com/api/library/"):
            raise ValueError("Unverified download URL")
        data, resolved = fetch(item["download"])
        report = inspect(data, species)
        digest = hashlib.sha256(data).hexdigest()
        target = DEST / item["file"]
        target.write_bytes(data)
        provenance = {
            "species": species, "sourcePage": item["sourcePage"],
            "sourceDownload": item["download"], "resolvedDownload": resolved,
            "license": "CC0 1.0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
            "retrievedUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "sizeBytes": len(data), "sha256": digest, "analysis": report,
            "note": "Downloaded from original CC0 publisher and served locally by FORMA."
        }
        target.with_suffix(".source.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n")
        print("VERIFIED", species, report, digest, flush=True)


if __name__ == "__main__":
    main()
