# FORMA B2B — Studio + Home

**Status: development prototype, NOT a deployed production system.** Two roles share a React / Three.js application, data models and material catalog.

## Working locally

Prerequisites: Node.js 22+, npm.

```bash
cd b2b
npm install
npm run dev
```

The development Vite server proxies `/api` to `http://127.0.0.1:8000`. A separate import service is required for IFC / SKP / BLEND.

## Loading architectural models

Open either Studio or Home, select **«Импорт модели»** or drag files into the viewport.

| Format | Current import pathway | Limitations |
| --- | --- | --- |
| GLB | Browser, Three.js GLTFLoader | Recommended; geometry, object names and embedded PBR materials |
| GLTF | Browser | Choose GLTF **together with** external BIN and textures, or use a ZIP containing all of them |
| OBJ | Browser OBJLoader | Choose associated MTL/textures too, or ZIP |
| FBX | Browser FBXLoader | Some uncommon FBX variants and texture paths may not load correctly |
| ZIP | Browser JSZip + loaders | One GLB / GLTF / OBJ / FBX scene per archive, plus its resources |
| IFC | Server IfcConvert -> GLB | Install IfcConvert and run the Python import service |
| SKP | Server OpenSKP -> GLB | OpenSKP is alpha: SketchUp version coverage and fidelity must be verified |
| BLEND | Server Blender -> GLB | Only in a trusted isolated conversion environment |

For a local IFC / SKP / BLEND server:

```bash
cd b2b/import-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

For IFC, separately install the IfcConvert binary. For BLEND and server conversion of OBJ/FBX, install Blender. See [import-service/README.md](import-service/README.md) for production security restrictions.

## Working features

- Procedural house with gable roof, facade, windows and plinth.
- Facade panel layout **cut around the two front window openings** in the procedural preview.
- Select facade / roof / plinth / frames on the sample building and assign independent catalog materials.
- Orbit / pan / zoom, import of meshes with object names, local diagnostics (mesh and triangle count, source extents).
- Click an imported mesh, then select a material on the left to reassign its base color; other original PBR characteristics are retained where the loader exposes them. Imported files are not edited on disk.
- Importers normalize **viewport display only**; dimensions shown for imported models are source-unit extents, not verified meters.
- Local project JSON export; Studio publishing into localStorage for another mode in the **same browser only**.

## Known blockers before commercial release

- Neither Studio nor Home is separately deployed, despite two role modes existing in code.
- Render service is source code only and NOT deployed. No real-time % progress for server conversions, only stage labels.
- No certified BIM unit/axis normalization or validation. BIM metadata extraction and revision tracking are pending.
- Mesh selection/material assignment works only on selected imported meshes, not on whole semantic construction systems. Material editor currently changes base color, not authoring full PBR maps.
- The procedural demo cladding has simplified corner, fastener, roof, side opening and quantity logic. Not engineering-grade layouts or estimates.
- This release does not include cloud manufacturer accounts, shared catalog, image textures upload screen, pricing backend or Blender Cycles rendering.
- A public conversion server requires authenticated uploads, sandboxed converter workers, persistent queue and storage, metrics and resource quotas.

## Project direction

Keep GLB / glTF 2.0 as the canonical preview format, retain original source (IFC / SKP / FBX / etc) plus structured metadata for future engineering editability. Next priorities: materials PBR editor, object/zone material slots, persistent projects and backend catalog, accurate building assemblies, server-rendered photography.
