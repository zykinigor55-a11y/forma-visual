# ALFA A-frame · implementation record (22 Nov 2026)

**Source specification:** [ALFA-WINDOW-WALL-RECESS-SUPER-TZ.md](./ALFA-WINDOW-WALL-RECESS-SUPER-TZ.md)

This document distinguishes **implemented and code-tested** from **not yet verified in actual browser screenshots**.

## Delivered in branch `dom-render-nanobanana`

- `forma-landscape-3d-alpha-openings.js` — one parameter contract: front outdoor `+Z`; 240 mm wall, 140 mm window inset, 82 mm frame depth, two 6 mm panes with 20 mm visual cavity, 4° door sill, 30 mm outer drip and 3 mm tolerance.
- Real 240 mm wall volume at the front gable: outer existing PBR facade and a new rear face with **exactly matching TWO holes**, closed triangular perimeter and independent outer/inner material sections of door and gable returns.
- Additional closed rear facade cassette of 240 mm, so side/rear views no longer show a paper-thin surface.
- Exterior reveal from face to frame is 140 mm; 20 mm visual cladding edge and 30 mm ventilation strip (only within the reveal); inner reveal goes from frame back to inner wall.
- Upper gable glazing has matching triangular reveal surfaces, slim frames/transoms/mullions, glass seals and structural timber mounted **behind** the inner glass and wall.
- Four wide sliding leaves with two physical transparent panes each, spacer, black rubber seals, consistent inward aluminium jamb/head/sash mounting, draining two-rail threshold, recessed handles, dark metal outer quarters and 4° outwards-sloped sill with projecting hem.
- No renewed separate 3D exterior slats. Existing UV-mapped graphite PBR wall texture is preserved.
- Closing end-cap surfaces on both roof planes plus underside shift to give **0.22 m visual vertical roof edge depth**. All four slotted rooflight apertures remain.
- No change to main house width/depth, terrain/site object positions, saved layout transform or other house presets.
- Explicit new-version query imports along page → buildings → house → windows/openings to break old Android cache.

## Automated geometry regression

`tests/alpha-openings.test.mjs`:
1. Nominal 7.5×9.5 m: outer and inner gable share two equal hole contours; wall thickness 0.240 m; frame inset 0.140 m; centres of double glazing 0.026 m apart; four exterior and four interior door panes; four skylights; closed roof cassettes; no old opaque glazing or individual exterior boards.
2. Multiple dimensions 2×2, 5.5×6.2, 7.5×9.5, 12×15 m: no non-finite vertices/positions or negative primitive dimensions; facade holes, glazing and skylights retained.

Both assertions were executed with a headless Three.js-compatible API mock, and passed. Browser/WebGL pixel appearance and runtime FPS are **not** inferred from this mock.

## Visual acceptance still required

Actual screenshots from the published DOM.RENDER program (not generated concepts) at:
- normal 3/4 front angle;
- close exterior jamb with 140 mm reveal;
- 4° threshold/sill;
- upper triangular glass corner;
- side-on showing 240 mm wall/closed roof edge;
- narrow Android viewport (390×844), open scene.

Inspect real shadows/texture loading, roof/window junctions and Android FPS. Do not claim final 10/10 or construction compliance before that inspection. Architectural design details are visual guides, **not licensed construction/shop documentation**.
