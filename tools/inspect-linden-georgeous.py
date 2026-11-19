#!/usr/bin/env python3
"""Inspect the *user-authorized* original Sketchfab asset before inclusion in FORMA.
Accept a Sketchfab ZIP, glTF JSON, or GLB; never download from gated APIs.
No changes to production assets, textures or author credits are made.
Usage: python3 tools/inspect-linden-georgeous.py path/to/download.zip
"""
import argparse
import json
import pathlib
import struct
import zipfile
from collections import Counter


def describe_gltf(obj):
    data = {
        "generator": obj.get("asset", {}).get("generator"),
        "meshes": len(obj.get("meshes", [])),
        "materials": len(obj.get("materials", [])),
        "images": len(obj.get("images", [])),
        "textures": len(obj.get("textures", [])),
        "extensions": obj.get("extensionsUsed", []),
        "named_nodes": [n.get("name", "") for n in obj.get("nodes", []) if n.get("name")],
        "lod_names": [n.get("name", "") for n in obj.get("nodes", [])
                      if "lod" in n.get("name", "").lower()],
        "mesh_primitives": sum(len(m.get("primitives", [])) for m in obj.get("meshes", [])),
    }
    if not data["meshes"]:
        raise ValueError("No glTF meshes found; do not install")
    return data


def read_glb(contents):
    if len(contents) < 20 or contents[:4] != b"glTF":
        raise ValueError("Not a GLB file")
    version, size = struct.unpack_from("<II", contents, 4)
    if version != 2 or size != len(contents):
        raise ValueError("Invalid or incomplete GLB 2.0")
    length, kind = struct.unpack_from("<II", contents, 12)
    if kind != 0x4E4F534A or 20 + length > len(contents):
        raise ValueError("Missing glTF JSON chunk")
    return json.loads(contents[20:20 + length])


def inspect(path):
    path = pathlib.Path(path)
    if not path.is_file():
        raise FileNotFoundError(path)
    if path.suffix.lower() == ".glb":
        return {"format": "glb", "asset": describe_gltf(read_glb(path.read_bytes()))}
    if path.suffix.lower() in (".gltf", ".json"):
        return {"format": "gltf", "asset": describe_gltf(json.loads(path.read_text("utf-8")))}
    if path.suffix.lower() != ".zip":
        raise ValueError("Expected .zip, .gltf or .glb")
    with zipfile.ZipFile(path) as archive:
        entries = [name for name in archive.namelist()
                   if not name.endswith("/") and not name.startswith("__MACOSX/")]
        files = Counter(pathlib.PurePosixPath(name).suffix.lower() for name in entries)
        models = []
        for name in entries:
            try:
                if name.lower().endswith(".glb"):
                    models.append({"name": name, **describe_gltf(read_glb(archive.read(name)))})
                elif name.lower().endswith(".gltf"):
                    models.append({"name": name,
                                   **describe_gltf(json.loads(archive.read(name).decode("utf-8")))})
            except (ValueError, json.JSONDecodeError, struct.error) as error:
                models.append({"name": name, "error": str(error)})
        if not any(m.get("meshes", 0) > 0 for m in models):
            raise ValueError("No valid glTF/GLB model in archive: cannot safely import")
        return {"format": "zip", "files": dict(files), "models": models,
                "license_files": [x for x in entries if
                                  "license" in x.lower() or "readme" in x.lower()]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Original source archive downloaded with permission")
    args = parser.parse_args()
    print(json.dumps(inspect(args.file), indent=2, ensure_ascii=False))
