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


## v0.9: Verified source-page search and truthful approximate-shape suggestions

Serper free-tier Images ignores the site filter for landing pages and Behance returns HTTP 403 on direct HTML fetch in Render. Instead, query Serper organic search with 10 results maximum, accept only real Behance /gallery/<ID> pages and verify author attribution for ANT via known original profile gallery IDs. When indexed thumbnails are unavailable, match projects approximately by roof silhouette, scale and material words in the search titles/snippets. Clearly label these as unverified-image metadata suggestions, link to the publisher's project and never claim that the remote photo or daylight has been visually verified. Independently generate a high-end daylit art-direction plan using the visual analysis of the USER'S house and preserve exact architecture and camera. No fake source thumbnails or nightly lighting. Startup diagnostic probes were removed.


## v1.0 — Stable fast image caption with graceful timeout fallback

- First multimodal call now requests only a short architectural caption in Russian (maximum 45 words, 180 output tokens, low image detail) and aborts after 28 seconds instead of holding the job for 85 seconds.
- If the vision provider times out, the server returns a **non-visual, explicitly unverified** brief based on the user-entered project type/materials (or leaves them unknown), never invents building geometry, and continues Serper/Behance/ANT photography-quality curation and generation of an art-direction prompt. Full job runs as a polling task to avoid an open browser HTTP request. 100% indicates finished workflow, not verified visual understanding.
- If image caption returns, the secondary text structuring pass has a shorter 14 second limit; any failure uses the verified image caption rather than treating the pipeline as failed.
- Visual ranking of downloaded reference photographs is skipped when the source house was not visually analyzed. Metadata-only reference suggestions are explicitly labeled as unverified photography and only used to influence high-end art-direction, never the building's geometry. The editing prompt is transparent about the fallback.
- The prompt now emphasizes architectural-photo-level realism, sculptural daylight, realistic shadows, physically plausible facade microtextures, glazed reflections and natural landscape depth, not generic CGI.


## v1.0.1 — Gateway compatibility / input sizing (13 November 2026)

Gemini 3.8 Flash is used **only for text** (the structured brief and art-direction), and is known to answer text promptly. Repeated gateway tests with a base64 image in the OpenAI image_url format returned HTTP 400 (invalid request). A non-standard native-style image part returned HTTP 200 but only a tool_calls finish, not a usable visual caption. gpt-4o-mini and gpt-4.1-mini were unavailable (model_not_found) on the current API Market key. Other Gemini models Carbon/Hydrogen did not give a usable image caption within the probe windows. Gemini 4 Argon remains the conditional vision provider, with explicit timeout-to-brief fallback; it previously produced one successful visual description but is not consistently responsive. The frontend now creates a dedicated 768px JPEG (quality 0.74) ONLY for AI analysis and retains the larger 1280px source rendition for preview and any later editing. The original local file remains in memory without server persistence. No startup API probes remain; no repeated test credit usage on Render deploy.


## v1.1 — Real Google Lens reverse image search (no GPT Image 2)

The main "Найти по фотографии" action does **NOT** generate images or invoke Gemini vision. The browser uploads its 768px JPEG analysis copy to an in-memory job. A temporary, unguessable HTTPS URL under /api/lens-photo/:uuid.jpg serves that copy only while Google Lens fetches it (at most 3 minutes, usually expired earlier, no file write/durable storage). The uploaded image is transmitted to Google Lens via Serper POST /lens (3 Serper credits per fresh image request); repeats are cached in memory for 12 minutes. Visual matches are parsed from visualMatches/visual_matches, filtered to architectural context, priority to genuine Behance project pages. Each returned match includes a source link and thumbnail when provided, displayed in the new grid. A match is **not** labelled a photo-quality or daylight verified selection. When no architectural visual matches exist, the app may show separate metadata-only Behance/ANT editorial sources, explicitly not a photo match. The optional Gemini 3.8 Flash text model only helps prepare scene guidance; its failure uses the safe local fallback direction. User photo search requires Serper, not GPT Image, and should not be confused with image generation.


### Google Lens provider schema confirmed

A live one-off provider test on a public architectural photo returned HTTP 200 in ~2.9s; unlike some third-party documentation, **Serper returns its Lens results as `organic[]`**, each containing `title`, `link`, `source`, `thumbnailUrl` and possibly `imageUrl`. The implementation reads `organic[]` first, retaining compatibility with `visualMatches` and `visual_matches`. It keeps real visual matches even if publication titles lack architecture terms, while ranking architecture-related matches first. Removed the one-time credit-spending diagnostic from startup. This provider check does NOT verify the whole uploaded-photo flow end-to-end.
