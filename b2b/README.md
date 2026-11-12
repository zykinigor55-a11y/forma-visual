# FORMA B2B — Studio + Home (prototype)

Two application modes currently share one React application and a Three.js / React Three Fiber viewport. They are not yet separate production deployments.

## Implemented

- **Studio:** procedural architectural house with editable width, wall height, depth, facade-panel width and gap; facade layout orientation; independent facade, roof, plinth, window/door material presets.
- **Home:** same 3D building scene, material selection and reuse of locally published Studio configurations.
- GLB model upload, and GLTF files when external dependencies (BIN, textures) are embedded. GLTFLoader parses the selected file locally in the browser.
- Imported mesh selection, orbit camera, zoom, shadows, viewport grid.
- Export of component settings as JSON. Catalog stored in browser localStorage.

## Start

```bash
cd b2b
npm install
npm run dev
```

## Known limitations (important)

- The procedural house is a **geometry prototype**. Openings and panel placement are not yet production-ready construction geometry. For example, decorative facade slats can cross windows; this is not a valid BOM or cutting layout.
- Imported models can be inspected and meshes selected, but material changes and parametric edits apply **only to the built-in house**, not to imported GLB/GLTF objects.
- GLTF with external .bin or texture image files is not supported in the single-file upload workflow yet; use a self-contained GLB.
- Preview normalizes imported model scale and center for display. It does not yet retain or use certified building dimensions.
- No manufacturer authentication, shared database, object storage, PBR texture ingestion, server-based Blender rendering, or commercial quotation workflow.
- All prices are illustrative. The displayed facade area is a rough single-wall figure, **not** whole-building quantity measurement.
- No production deployment is configured by this folder.

## Engineering plan

1. Building geometry: correct openings, parametric roof, facade cladding layout around apertures, real measurements and tests.
2. Imported GLB materials: named mesh/material slots, assignment, mapping, and persistence.
3. Professional manufacturer UI: object inspector, selection modes, transform gizmos, library, revision history and material PBR inspector.
4. Backend API: manufacturer catalog, user accounts, storage, versioning and publish/approve workflow.
5. Rendering: background Blender Cycles workers, queue, immutable scene snapshot, progress and result gallery.
6. Separate Studio/Home deployments sharing common geometry and types.
