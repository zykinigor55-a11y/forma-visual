# Forma Визуал Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship the approved usable workspace and a secure, explicitly disconnected Google adapter.

**Architecture:** React workspace, pure shared prompt catalog, authenticated server APIs. D1 stores project ownership and usage; R2 stores source and generated assets.

**Tech Stack:** Vinext, React, TypeScript, Cloudflare D1/R2, native fetch, Node tests.

**Spec:** docs/superpowers/specs/2026-11-02-forma-design.md

## Global Constraints
- Russian UI and warm ivory/olive branding.
- No architectural studio subtitle, no fake generation or billing.
- API keys remain server-only. Every private asset checks project ownership.
- Original house image is supplied to every generation.

## Review Focus
- Invalid/oversized image bytes rejected before storage or Google requests.
- Cross-user project IDs never reveal records or assets.
- Changed settings never relabel an old result as a new result.
- Failed Google requests refund reserved usage and preserve previous results.
- Mobile navigation, keyboard dialogs and long project names remain usable.

### Task 1: Prompt catalog and validation
Files: lib/prompts.ts, lib/validation.ts, tests/core.test.mjs.
Interfaces: buildPrompt(settings) -> string; normalizeSettings(input) -> Settings; parseImage(dataUrl) -> {bytes,mimeType}; buildGeminiRequest(settings,image) -> request body.
- [x] Write failing assertions for geometry lock, exclusive scene choices, explicit colors, winter-vs-summer instructions and invalid files.
- [x] Run node --experimental-strip-types --test tests/*.test.mjs; observe failures.
- [x] Implement the catalog, validation and request assembly; run the whole suite.

### Task 2: Authenticated persistence and provider adapter
Files: db/schema.ts, lib/server.ts, app/api/**, .env.example.
Interfaces: GET status; GET/POST projects; GET/DELETE project; GET asset; POST generation. Server routes derive owner from hosted identity only.
- [x] Define schema and generate migrations; inspect bounded SQL.
- [x] Implement private project/asset access, input limits, disabled-provider state and atomic monthly quota.
- [x] Validate types and route error paths.

### Task 3: Responsive working application
Files: app/page.tsx, app/studio.tsx, app/globals.css, public/images/*.
Interfaces: settings from shared catalog; persisted projects from API; generated result includes its immutable settings and prompt.
- [x] Implement the approved program layout, sample scenarios, upload, settings, compare, undo/reset, save, projects and help dialogs.
- [x] Add prompt inspection, copy and Markdown export; clearly display disconnected billing and demo state.
- [ ] Verify browser interactions and mobile rendering on deployed URL (local preview daemon unavailable).

### Task 4: Verify and publish
- [x] Run full core suite, TypeScript, build, browser QA; review authorization and quota paths.
- [ ] Package and push matching source via Sites helper; publish owner-private version.
- [ ] Confirm successful deployment and report remaining provider/payment setup.
