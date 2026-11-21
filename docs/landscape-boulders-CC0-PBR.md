# FORMA VISUAL · 4 природных 3D-валуна (photogrammetry / PBR)

Updated: 22 Nov 2026. User request: improve the rocks in the same 3D
landscape editor used for plants and lights, at photo-realistic quality.

## Live rock identity / source

| Native editor catalog ID | Name (RU) | Actual local GLB | Original CC0 Poly Haven source | Geo material treatment |
|---|---|---|---|---|
| `granite-boulder` | Гранитный валун | `assets/landscape-models/granite-boulder.glb` | https://polyhaven.com/a/boulder_01 | Full photogrammetry profile, re-tinted toward weathered grey/cool granite, micro-pitting and normal-map detail retained |
| `limestone-boulder` | Известняковый валун | `assets/landscape-models/rock-moss.glb` | https://polyhaven.com/a/rock_moss_set_01 | ONE stone from the six-scanned-rock source (not the entire cluster), lightly limestone-tinted; eroded bright fractures and patina |
| `slate-boulder` | Слоистый сланец | `assets/landscape-models/rock-rough.glb` | https://polyhaven.com/a/rock_09 | Broad, low flat-ridged natural rock, dark/cool PBR coloration |
| `sandstone-boulder` | Песчаник тёплый | `assets/landscape-models/rock-grey.glb` | https://polyhaven.com/a/rock_07 | Ochre-toned rugged natural stone with weathered uneven surfaces |

The source assets were installed by `tools/install-real-landscape-models.py`;
all four GLBs are bundled with their source PBR textures, independently
licensed CC0 1.0 by Poly Haven. No live external download is needed at runtime.
These are **real scanned rock forms** with geologically styled color; they are
not claimed to be scientifically identified specimens of each rock mineral.
For exact geological rock type certification, a reference scan of a verified
sample of that mineral would be required.

## Editor behavior

- `forma-landscape-3d-rocks.js` keeps Four stable catalog IDs and adds exact
  CC0 GLBs, original photo texture map(s), split-normal roughness and natural
  rocky geometry.
- `forma-landscape-3d.html` imports and loads each source GLB in place, once
  per type, while leaving a deterministic physically separate fallback if
  a network or decoding failure occurs. Every instance is a distinct editable
  selected object, not a flat image or a billboard.
- Original `x`, `y`, `rotation`, `diameter`, `height`, `id` preserved,
  including in pre-existing project data. No house/road/plant repositioning.
- Properties: **four natural variations** of scanned rock orientation (or
  independently scanned limestone stone), **0–36% burial** with terrain contact,
  diameter, height, and full rotation.
- `normalizeProject` now retains boulder `variant` and `burial` on project
  reload, plus the previously lost globe-size/dimmer/Kelvin settings for lights.
- Fallback `createGeologicalFallbackBoulder` is a real 3D displaced sphere
  with deterministic polygonal mineral fractures and slate/sandstone cleavage.
- The local model boxes are recentered under their wrapper root; setting
  different rock variants or colors never writes new site coordinates.

## Real visual proof

`forma-boulders-v2-studio.html?id=granite-boulder` and the other three IDs
show the exact native PBR GLB meshes under photographic studio light. Chromium
captures four actual WebGL canvases in
`assets/landscape-screenshots/boulder-v2-*-actual-pbr-webgl.png`.
The comparison `boulder-v2-all-four-real-PBR-WebGL-board.png` is assembled
from these real WebGL screenshots, not AI-concept renders.

The same test runner then opens the actual `forma-landscape-3d.html`
with four rocks and saves `boulder-v2-real-editor-four-photogrammetry-rocks.png`,
including a proof JSON of model triangles, source and PBR map counts.
Run `node --test tests/landscape-3d-boulders.test.mjs` to verify the mapping
and coordinate-preservation behavior.

## Remaining design-review points

- Evaluate actual 3D screenshots at multiple angles, especially the lighter
  limestone and slate's expected cleaved silhouette.
- Adjust aspect ratio and burial of each source scan only if a user reference
  photo makes the desired species-specific dimensions clear.
- Render service deployment is a separate step; GitHub commits alone do not
  prove that the public Render service is showing the newest version.
