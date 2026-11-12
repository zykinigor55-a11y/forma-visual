# FORMA B2B — Studio + Home (MVP)

Two interfaces share one Three.js model, a material catalog, and a common facade configuration schema.

- **Studio:** edit facade dimensions, panel layout and materials; publish to local browser catalog.
- **Home:** preview a basic house and apply Studio-published facade configurations.
- Real-time 3D rendering with React Three Fiber, orbit/zoom, shadows and grid.
- Export component JSON.

## Run

```bash
cd b2b
npm install
npm run dev
```

## Current limitations

This is an initial browser-only MVP, **not production software**. Catalog publication uses localStorage and is only visible in the same browser, not across devices or accounts. The house is a simplified procedural model. There is no GLB/CAD import, PBR texture upload, server, accounts, product pricing backend, physically accurate openings/cutouts, or Blender render pipeline yet. Pricing shown in the sample catalog is illustrative.

## Next engineering milestones

1. Extract shared 3D engine, schemas, and domain modules into packages; automated tests.
2. GLB/glTF import, geometry validation, mesh picking and material slots.
3. Manufacturer auth, object storage, catalog and publish API.
4. Real building assemblies, cutouts, corners and accurate quantities.
5. Render queue with Blender Cycles workers, progress and immutable scene snapshots.
6. Customer quotation, supplier lead and order workflow.
