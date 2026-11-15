# Landscape and Atmosphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete local landscaping and independent photographic atmosphere in the existing FORMA editor.
**Architecture:** Shared catalog/validation/prompt core, responsive browser editor and canvas compositor, narrow bridge to existing project storage and generation. Existing API Market endpoint handles both operations.
**Tech Stack:** Vanilla JS, Canvas, Node.js test runner, Playwright.
**Spec:** docs/superpowers/specs/2026-11-15-landscape-atmosphere-design.md

## Global Constraints
- Six paving choices; source pixels outside the mask remain unchanged at native dimensions.
- Atmosphere does not change environment, season, weather, geometry or camera.
- No external dependency or secret in browser. Generation only after explicit action.
- Persist edits per project and source/view; prevent late results saving into another project.

## Review Focus
- Source/view changes must invalidate old placement coordinates.
- Resized images and provider output aspect ratios must not corrupt preserved pixels.
- Invalid/oversized placement payloads rejected before provider call.
- Mobile polygon interaction, focus trapping, escape and undo.
- Atmosphere with selective focus must not receive contradictory all-depth-sharp instructions.

### Task 1: Shared contracts and local image protection
**Files:** `forma-art-direction-core.js`, `forma-local-composite.js`, `tests/art-direction.test.mjs`
**Interfaces:** normalizeLandscape(input), landscapePrompt(input), normalizeAtmosphere(input), atmospherePrompt(input), compositePixels(base,edited,mask).
- [x] Write tests for catalog sizes, bounds validation, no scene-change atmosphere, crop bounds and exact preserved pixels; observe failure.
- [x] Implement core and compositor; verify tests pass.

### Task 2: Interactive workspaces and project bridge
**Files:** `forma-landscape-atmosphere.js`, `forma-landscape-atmosphere.css`, `app.js`, `forma-preview.html`
**Interfaces:** FORMA_ART_BRIDGE snapshot/draft/busy/save; FORMA_ART_DIRECTION openLandscape/openAtmosphere/composeMasked.
- [x] Implement object placement, polygon paths, size controls, undo/delete and native-resolution masked composition, plus per-view project drafts.
- [x] Implement photographic look and focus controls, instant labeled color proof, separate apply-to-current-result action.
- [ ] Verify mobile/desktop interactions, persistence, disabled generation without source and project-switch isolation with Playwright.

### Task 3: API integration and delivery
**Files:** `server.mjs`, `tests/art-direction.test.mjs`, `docs/superpowers/plans/2026-11-15-landscape-atmosphere.md`
- [x] Add tests for landscape-only/atmosphere-only prompt dispatch and DOF compatibility; observe failure.
- [x] Validate payloads before usage count; connect prompt builders and suppress incompatible deep-focus defaults.
- [ ] Run unit suite, syntax checks and browser tests; record pre-existing failing test.
- [ ] Review whole diff, fix significant findings, commit, push and verify Render deployment and live assets.

## Verification and review record

- Shared contracts: 11/11 tests passed. Native Canvas test: 609000 outside pixels preserved exactly, padded crop downscale/upscale aligned, mismatched output framing rejected.
- Whole suite: 57/58 passed. Pre-existing `window adds sill and header with a physical opening` fails at tests/plan-to-interior.test.mjs:18 (expected y=2.45); unchanged by this feature.
- Independent review completed. Fixed view-bound drafts and late result identity, padded provider framing and bounded provider copies, compositor dependency on both HTML entry points plus before-charge check, DOF exposure conflict, scene-override conflict, keyboard cursor, and double grading on result.
- Browser checks in local runtime blocked by Chromium Unix socket permissions. Shared browser cannot reach the local port. Live interface verification remains after deployment.
- No paid AI request used in development verification. No automatic artifact-detection capability is claimed. Existing manual architecture overlay remains available.
