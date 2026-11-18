#!/usr/bin/env python3
"""Build self-contained, CC0 PBR GLBs for FORMA landscape editor.
Source: https://polyhaven.com/license (CC0).
Run on GitHub Actions; outputs are public site assets. No API keys required.
"""
import hashlib
import json
import mimetypes
import pathlib
import struct
import urllib.parse
import urllib.request

ASSETS = {
    "pine": "pine_sapling_small",
    "spruce": "fir_sapling",
    "fern": "fern_02",
    "wild-shrub": "shrub_01",
    "periwinkle": "periwinkle_plant",
    "granite-boulder": "boulder_01",
    "outdoor-dining": "outdoor_table_chair_set_01",
    "picnic-table": "wooden_picnic_table",
    "shrub-02": "shrub_02",
    "shrub-03": "shrub_03",
    "shrub-04": "shrub_04",
    "nettle": "nettle_plant",
    "dandelion": "dandelion_01",
    "empodium": "flower_empodium",
    "gazania": "flower_gazania",
    "ursinia": "flower_ursinia",
    "weed-plant": "weed_plant_02",
    "calathea": "calathea_orbifolia_01",
    "anthurium": "anthurium_botany_01",
    "rock-grey": "rock_07",
    "rock-rough": "rock_09",
    "rock-moss": "rock_moss_set_01",
    "tree-stump": "tree_stump_01",
    "garden-bench": "painted_wooden_bench",
    "street-bench": "modular_street_seating",
    "round-garden-table": "round_wooden_table_01",
    "garden-stool": "folding_wooden_stool",
    "gallinera-table": "gallinera_table",
    "gallinera-chair": "gallinera_chair",
    "fire-pit": "stone_fire_pit",
    "planter-small": "planter_box_01",
    "planter-medium": "planter_box_02",
    "planter-large": "planter_box_03",
    "sprinkler": "garden_sprinkler_01",
    "watering-can": "watering_can_metal_01",
    "garden-hose": "garden_hose_wall_mounted_01",
    "wicker-basket": "wicker_basket_01",
    "compost-bags": "compost_bags",
    "street-lamp-one": "street_lamp_01",
    "street-lamp-two": "street_lamp_02",
}
OUT = pathlib.Path("assets/landscape-models")
MAX_FILE = 42 * 1024 * 1024

def get(url, limit=MAX_FILE):
    if not url.startswith("https://"):
        raise ValueError("HTTPS URL required")
    req = urllib.request.Request(url, headers={"User-Agent": "FORMA-Visual-CC0-Importer/1.0"})
    with urllib.request.urlopen(req, timeout=100) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError("Download exceeds per-file limit: " + url)
    return data

def verified_file(entry):
    data = get(entry["url"])
    if len(data) != entry["size"]:
        raise ValueError("Size mismatch: " + entry["url"])
    if hashlib.md5(data).hexdigest() != entry["md5"]:
        raise ValueError("Checksum mismatch: " + entry["url"])
    return data

def pad4(data, fill=b"\x00"):
    return data + fill * ((-len(data)) % 4)

def embed_gltf(source, include):
    # Preserve all mesh vertices, PBR materials and texture maps. Build one
    # portable GLB with no external image or bin paths and +Y-up coordinates.
    binary = bytearray()
    for buffer_index, buffer in enumerate(source.get("buffers", [])):
        uri = urllib.parse.unquote(buffer.pop("uri"))
        if uri not in include:
            raise ValueError("Unlisted buffer: " + uri)
        chunk = verified_file(include[uri])
        base = len(binary)
        binary.extend(pad4(chunk))
        if len(chunk) < buffer.get("byteLength", 0):
            raise ValueError("Buffer shorter than declared")
        for view in source.get("bufferViews", []):
            if view.get("buffer") == buffer_index:
                view["byteOffset"] = int(view.get("byteOffset", 0)) + base
                view["buffer"] = 0
    source["buffers"] = [{"byteLength": len(binary)}]
    views = source.setdefault("bufferViews", [])
    for item in source.get("images", []):
        uri = item.pop("uri", None)
        if uri is None:
            continue
        uri = urllib.parse.unquote(uri)
        if uri not in include:
            raise ValueError("Unlisted image: " + uri)
        content = verified_file(include[uri])
        base = len(binary)
        binary.extend(pad4(content))
        item["bufferView"] = len(views)
        item["mimeType"] = "image/png" if uri.lower().endswith(".png") else "image/jpeg"
        views.append({"buffer": 0, "byteOffset": base, "byteLength": len(content)})
    source["buffers"][0]["byteLength"] = len(binary)
    # Reject extensions unsupported by the built-in GLTFLoader.
    required = set(source.get("extensionsRequired", []))
    if required & {"KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_texture_basisu"}:
        raise ValueError("Unexpected compressed extension")
    js = pad4(json.dumps(source, ensure_ascii=False, separators=(",", ":")).encode(), b" ")
    bn = pad4(bytes(binary))
    total = 12 + 8 + len(js) + 8 + len(bn)
    return (struct.pack("<4sII", b"glTF", 2, total)
            + struct.pack("<I4s", len(js), b"JSON") + js
            + struct.pack("<I4s", len(bn), b"BIN\x00") + bn)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    installed = []
    for target, source_id in ASSETS.items():
        out = OUT / (target + ".glb")
        if out.is_file() and 20 < out.stat().st_size < MAX_FILE and out.read_bytes()[:4] == b"glTF":
            # Reuse already downloaded licensed assets. Rebuilding every huge
            # model on each run wastes bandwidth and risks unnecessary retries.
            result = out.read_bytes()
        else:
            descriptor = json.loads(get("https://api.polyhaven.com/files/" + source_id, 350_000))
            one_k = descriptor["gltf"]["1k"]["gltf"]
            content = verified_file(one_k)
            gltf = json.loads(content)
            result = embed_gltf(gltf, one_k["include"])
            if len(result) > MAX_FILE:
                raise ValueError("Output GLB exceeds 42MB for " + target)
            out.write_bytes(result)
        if out.read_bytes()[:4] != b"glTF":
            raise ValueError("Invalid GLB output")
        # Official Poly Haven preview is a licensed representation of this
        # exact model. Keep it on our server, never hotlink at runtime.
        thumb_path = OUT / "thumbs" / (target + ".webp")
        if not thumb_path.is_file():
            try:
                info = json.loads(get("https://api.polyhaven.com/info/" + source_id, 120_000))
                thumb_url = str(info.get("thumbnail_url", ""))
                if urllib.parse.urlparse(thumb_url).hostname != "cdn.polyhaven.com":
                    raise ValueError("Unexpected thumbnail host")
                raw = get(thumb_url, 2_000_000)
                if raw[:4] != b"RIFF" or raw[8:12] != b"WEBP":
                    raise ValueError("Thumbnail is not WEBP")
                thumb_path.parent.mkdir(parents=True, exist_ok=True)
                thumb_path.write_bytes(raw)
            except Exception as exc:
                print("Thumbnail unavailable for", target, str(exc))
        print(f"{target}: {source_id}, {len(result)/1e6:.2f} MB")
        installed.append({"catalogId": target, "file": str(out), "source": "https://polyhaven.com/a/" + source_id,
                          "license": "CC0-1.0", "bytes": len(result), "sha256": hashlib.sha256(result).hexdigest()})
    (OUT / "sources.json").write_text(json.dumps(installed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
