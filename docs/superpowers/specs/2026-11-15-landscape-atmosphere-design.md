# Ландшафт и атмосфера FORMA

User request: finish shrubs, paths (six paving choices), lamps, localized editing; add a separate Atmosphere control for cinematic photographic style, color and depth of field, inspired by the publicly available ANT Archviz work. Continue the existing DOM.RENDER editor and API Market integration.

Approach: use the existing application and gallery, add two responsive dialog workspaces and a small shared validation/prompt module. An alternative 3D object editor would require camera calibration and models not available in the source photo; freeform text alone cannot place objects reliably. Implementation choice: normalized 2D guides, with AI converting those guides into photography.

Landscape: catalog of named plants, six paving materials and six fixture types. Place/resize plant and fixture regions, polygon paths, select/delete/undo, persist per project and source/view. Send a clean crop and transparent edit mask with explicit normalized object geometry. Composite only masked pixels back into the original full-resolution canvas and store a lossless PNG in existing gallery. Never imply 3D-accurate placement. Fixtures do not change daytime into night.

Atmosphere: independent of environment, season, weather and time. Six photographic looks; strength, contrast, color saturation/temperature, depth of field with focus point, atmospheric distance, highlight bloom and grain. Instant color proof is labeled as a preview. Parameters are included in initial renders and can be applied to an existing render without changing architecture or the site. No unrequested weather, plants, composition or camera changes. Materials editing uses the same exact unmasked-pixel compositing protection.

Constraints: retain existing provider limits/keys, no new paid provider, no external image dependency, mobile/touch and keyboard support, no AI charge until explicit generation. Existing geometry baseline test failure is unrelated and must be reported rather than silently changed.
