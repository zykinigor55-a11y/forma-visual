# FORMA B2B · Studio + Home

An architectural B2B platform under active development. **Two distinct UI workspaces share one React/Three.js engine and catalog.** No production manufacturer's backend or physically certified BIM yet.

## Open the interfaces

On a running development site:

- `?view=studio` — **FORMA B2B Studio**, manufacturer's engineering workspace.
- `?view=home` — **FORMA B2B Home**, consumer architectural material configurator.

Switch at the top of either app. Both interfaces work without a user-supplied model: a procedural demonstration house is included.

## Studio — available now

- Professional light CAD workspace: object tree, viewport controls, properties inspector, material tray, status bar.
- Dimension editing in millimeters: width, wall height, building depth, facade panel width and installation seam.
- Front and side facade panel preview with window/door opening cutouts, standing-seam gable roof, glazing and plinth.
- Independent facade, roof, plinth and window finish slots; standard material roughness/metalness.
- **PBR upload** in Studio: base color, normal and roughness texture files. Filename detection for `normal` and `roughness`; the rest fills base color. Stored in memory only.
- Undo/redo (parameter history, not scene mesh changes), grid, camera presets, PNG viewport capture, JSON export.
- Save a component into a **localStorage-only** catalog, available in Home in the same browser.

## Home — available now

- Large live 3D architectural preview, independent surface materials, camera presets and lighting options.
- Compare the working facade with an ivory-plaster baseline.
- Save up to six visual variants in local browser storage, restore or remove them.
- Preview PNG export.
- Pricing is purely illustrative; **not** supplier quotations or an engineering estimate.

## Import support

Browser import: GLB, GLTF, OBJ, FBX and ZIP packages with auxiliary model files. Server conversion support is implemented for IFC (IfcConvert), SKP (OpenSKP, version coverage varies), and BLEND (Blender), **but the conversion server is not deployed**. Open the local importer if you want to try those formats; see [import-service/README.md](import-service/README.md).

## Development

```bash
cd b2b
npm install
npm run dev
```

```bash
npm test
npm run build
```

Browser smoke testing (Chromium required):

```bash
npx playwright install chromium
npm run smoke
```

Screenshots are uploaded as GitHub Actions artifact `forma-b2b-visual-smoke` after browser smoke passes.

## Current limitations

1. The included building is a visually detailed **parametric demonstration house**, not a complete engineering/BIM assembly. Panel cutting and quantities must be independently verified before construction use.
2. PBR texture uploads and imported-model material edits are local to the browser; cloud storage and revision publishing do not exist yet.
3. The shared materials catalog is sample data. Prices, brands, specifications and inventory are not verified suppliers.
4. GLB/glTF preview is the scene interchange format. IFC/SKP conversion requires external binaries and a sandboxed server; tests of real source files remain outstanding.
5. There is no server-side Blender Cycles photo renderer yet. Downloaded PNG is a **live viewport screenshot**, not a final photoreal render.
6. Both UIs are distinct but run inside one codebase and deploy target; independent deployments and manufacturer/customer authentication follow later.

## Preview publication

A GitHub Actions workflow [forma-b2b-preview.yml](../.github/workflows/forma-b2b-preview.yml) builds a standalone frontend and pushes it to `gh-pages`. GitHub Pages must be enabled in repository settings (Deploy from branch `gh-pages`, root) to make the preview publicly accessible. A separate Render static site could not be created because the workspace reached its service quota; existing live services were not modified.

## Next milestones

Real source-file validation, IFC metadata preservation, accurate facade quantities and connections, proprietary catalog/approvals, cloud storage/authentication, and Blender Cycles render workers.
