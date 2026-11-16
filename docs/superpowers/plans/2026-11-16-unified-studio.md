# FORMA Unified Studio Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the approved compact studio and large consistent tool workspaces, usable landscape placement, visible-only detail frames and project series, image-based plan visualization, local node settings and one coherent brand intro.

**Architecture:** Retain existing project/media storage and rendering bridges. Add a single workspace controller that moves existing live panels, rather than cloning controls or losing listeners. Share validated image task contracts between UI and server; protect unchanged pixels through existing composition.

**Tech Stack:** Vanilla ES modules, Node HTTP server, Canvas/SVG, existing API Market adapter.

**Spec:** docs/audits/2026-11-16-studio-redesign.md plus the user's subsequent approved landscape, animation, plan-to-image, detail/series and intro requirements.

## Global Constraints
- Keep original geometry and camera; a new side requires its own source.
- Same dark/light tokens in every workspace; one active tool, no permanent global right inspector.
- Landscape photographic cutouts are placement guides, not the generated output; preserve pixels outside influence masks.
- Do not silently substitute models. GPT Image 2.6 requires an explicitly configured provider/model.
- Do not lose saved projects, original plan editor, renders, masks or animation settings.

## Review Focus
- Source/project switching during async operations must not apply stale results.
- Brush strokes, undo and proportional scaling survive draft save/restore.
- Closing a moved workspace restores live controls and keyboard focus.
- Detail/series requests cannot request unseen architecture or inferred frontal views.
- Unconfigured plan image model produces an actionable state without a paid fallback.

### Task 1: shared image workflow contract and provider routing
- [x] Add RED tests for crop limits, plan presentation/style, room-view validation and forbidden inferred front.
- [x] Implement workflow normalization/prompts and explicit configurable plan provider; add generation route to existing quota path.
- [x] Verify contracts and existing suite.

### Task 2: compact home, one workspace and consistent theme
- [x] Build compact launcher/recent projects with SVG navigation and large reusable workspaces.
- [x] Move existing panels instead of duplicate controls; source picker first for Materials/Interiors/Animation.
- [x] Replace disconnected circle-A intro with continuous brand-mark animation.
- [x] Verify browser dark/light, navigation, escape, mobile, uploads and source persistence.

### Task 3: landscape editor
- [x] RED tests for brush bounds/normalization, influence region and proportional scale.
- [x] Add photographic cutout atlas, trees/rocks/fills, one scale control, drag placement, fill brush/eraser, editable paving vertices and texture orientation.
- [x] Use union mask of object plus editable shadow/reflection influence and include clean scene + reference board in AI request.
- [x] Verify canvas pixel preservation and browser placement/undo.

### Task 4: frames, series and plan image workspace
- [x] Add image-space crop selection, local crop/resize and optional AI details, no hidden-side generation.
- [x] Add configurable project series with each view's own source, pinned approved reference, per-frame saved result and retry.
- [x] Add plan upload → presentation/style → image → room/direction workflow, preserve legacy exact 3D editor as advanced tool.
- [x] Verify missing sources, provider status and error recovery without paid test calls.

### Task 5: animation and nodes
- [x] Reuse camera/lens artwork with equal card geometry, six options per group, illustrated motion and same-frame grades.
- [x] Move node inspector to explicit node dialog, add visible source upload and visual scene options; keep Run recovery.
- [x] Verify node settings, source actions, animation options and full tests.

### Task 6: delivery
- [x] Run full Node tests, native canvas checks, JS syntax and browser checks.
- [ ] Commit/push GitHub and deploy Render (implementation and independent review complete).
- [ ] Report actual verification limits and model configuration accurately after deployment.
