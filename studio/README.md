# FORMA STUDIO v0.3 · Auto Editorial Art Director

One architectural image → visual AI analysis → multi-source architecture image search → visual ranking → one suitable DAYLIGHT reference → specific scene staging → Nano Banana image-to-image prompt.

Publicly described ANT Archviz-inspired principles: one original building and the SAME original camera, transformed through daylight, landscape, depth, colour and editorial storytelling. This does NOT reproduce the private masterclass or its proprietary material.

New output includes an architecture-specific focal point and original editorial story, and individually directed near/middle/far scene layers, light direction, setting, palette and camera treatment. No fixed list of forest or plant types. Night, blue hour, twilight and dusk are forbidden. Do not show generic website cards; display only one confirmed visual choice, otherwise an honest status message.

For genuine visual analysis supply VISION_API_KEY, VISION_API_BASE, VISION_MODEL as needed; for five-site image search supply SERPER_API_KEY (recommended no-card: 2,500 one-off free searches), or TAVILY_API_KEY / BRAVE_SEARCH_API_KEY. Configure on Render server, never expose keys in browser/GitHub. Without keys this is a labelled draft prompt, NOT AI-selected photography. Nano Banana generation remains a separate workflow and is not wired through API Market yet.

Deploy: Node 20+, build 'cd studio && npm run check', start 'cd studio && npm start', GitHub branch forma-studio-v1, Render service forma-studio-architect.

## v0.3 verification

Checked Node syntax and local /api/health. The shot plan is shown only after real AI visual curation and a daylight verification. Render auto-deploy follows updates to this branch.


## Free architecture image search (Tavily)

Sign up at https://app.tavily.com/ and add the server-side environment variable `TAVILY_API_KEY` in Render > Environment. The Tavily Researcher free tier provides 1,000 monthly API credits and does not require a credit card. The app performs up to five basic, domain-restricted searches per new uncached query (about 5 credits; repeated queries are cached for 15 minutes). It only considers source-linked image results attached to pages from the five allowed professional domains, and never invents photos when images are unavailable. `BRAVE_SEARCH_API_KEY` remains an optional fallback, and Tavily takes priority when both are configured. For actual visual image comparison, also configure `VISION_API_KEY`, `VISION_API_BASE` and `VISION_MODEL` with a vision-capable model. No keys are stored in the repository.


## No-card search option: Serper.dev (v0.5)

Visit https://serper.dev/ and create a free account. Serper advertises 2,500 one-off free Google Search queries, **no credit card required**; this is not a monthly replenishing allowance. Store the API key **only** as `SERPER_API_KEY` in Render > Environment. FORMA STUDIO sends up to five Google Images requests with `site:allowed-domain` on each unique uncached query, about 500 full five-domain searches per free allowance, and filters returned page links against the five allowlisted architectural domains. The selected image must still pass the separate vision-model daylight check. Providers are selected in this order: Serper > Tavily > Brave; previous keys remain optional. No API key is baked into GitHub. A vision-capable model remains separately necessary for analyzing the original house and judging photographs.

Note: Tavily's pricing page may say 'no credit card' but sign-up has shown a payment-card request to at least one user; we therefore do not recommend Tavily to users with no international payment card.


## v0.6 — Two-stage image analysis (November 2026)

Fixes large-image and model timeout failures: the browser sends a camera-geometry-preserving JPEG rendition up to 1800px long edge, rather than a raw multi-megabyte upload. The server performs a short photo-caption pass with Gemini 4 Argon (VISION_MODEL), then uses Gemini 3.8 Flash (VISION_TEXT_MODEL, text only) to produce a structured architectural brief, English reference search query, and daytime editorial direction. If structuring fails, it preserves a clearly low-confidence caption-based analysis instead of inventing AI-ranked references. The Serper search and one-reference curation remain separate; candidate visual ranking requires the multimodal model to confirm daylight and a suitable image. Configure both model IDs in Render, with only VISION_API_KEY secret. A one-time smoke test successfully returned an image-based description and search query; test code was removed before production deployment.


## v0.7: Step-based AI percentages and asynchronous jobs

POST /api/jobs creates a limited background analysis job (HTTP 202); GET /api/jobs/:uuid returns status, progress, phase, analysis and photo curation. This avoids holding open a single browser request during slow model inference. Two concurrent jobs maximum; job result retention 15 minutes, in-memory only (a Render restart clears jobs). The upload bar uses XHR byte progress; remaining percentages are explicit stage milestones (not exact model token progress), and reach 100% only after the pipeline completes. Client downscales uploads to 1280px at JPEG quality .82; Serper and AI credentials remain server-side. No new charges/subscriptions.


## v0.8 — Behance and verified ANT Archviz only / silhouette fallback

The two search tracks are Behance editorial architecture and ANT Archviz's publicly attributed Behance portfolio. Source-filtering verifies six known ANT portfolio gallery IDs before displaying the ANT label, rather than trusting search-result titles. A best-effort query first seeks an architectural match. When no photo with confirmed daytime conditions fits, a second Serper search uses a broader form-based roof/silhouette/material query. At most 3 images (2 general Behance, 1 verified ANT where available) are sent to the vision model; its instruction permits an approximate massing match and prioritizes excellent light, setting and camera staging, while explicitly preserving the original house. If photo inspection is unavailable, do not pretend a photo was selected: a text-based art direction plan is presented from the visual analysis, including foreground/midground/background, daylight, and a geometry-locked prompt. No night or blue hour. No fake reference or copied project geometry.
