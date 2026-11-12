# FORMA STUDIO / Architectural AI Art Director v0.2

One original house image → image-aware analysis → balanced professional-domain photo search → visual comparison by a multimodal AI model → **one best compatible daylight editorial direction** → accurate Nano Banana prompt.

Separate folder `studio` on the `forma-studio-v1` branch of `zykinigor55-a11y/forma-visual`. Does not modify the previous FORMA VISUAL project in the default branch.

## Publicly described ANT Archviz principles (independent implementation)

The creative direction follows the high-level publicly described ideas of [ANT Archviz's AI Masterclass](https://antarchviz.com/masterclass/): keep the original building and camera while intentionally directing light, atmosphere, landscape, visual hierarchy, and editorial storytelling. This project is not affiliated with ANT Archviz, does not claim access to its private courses or private prompts and does not copy their imagery or software.

## What changed in 0.2

- Removed the five visible fake source cards and manually selectable three lighting presets.
- User sees one selected reference with original source link, explanation, composition, lighting, and landscape **only after a real visual selection**.
- Source websites (Behance, Divisare, ArchDaily, CGconnect, Dezeen) are searched separately using `site:<domain>` in Brave Image Search and domain-checking of the linked results.
- `/api/direct` balances available thumbnails across websites, includes the real original uploaded house image, asks a vision model to visually compare, and returns exactly one candidate or none.
- Natural bright daylight only: sunlit, soft diffused, warm late afternoon before sunset, or bright atmospheric cloudy weather. No night, dark blue hour, dusk, or dramatic artificial night lighting.
- Environment is chosen to suit the specific architecture and project; no generic mandatory trees or shrubs.
- Strict original camera, proportion and building geometry preservation in the prompt. **Prompts cannot guarantee architectural fidelity on an external image model; visually verify results.**
- Honest offline configuration status: without API keys no made-up 'best reference' is shown; it is a labelled **draft** prompt.
- Responsive website with a single large shortlisted professional reference instead of placeholder cards.

## Configuration

Node.js 20+ web service (no npm dependencies). Server-side variables:

| Key | Why |
|---|---|
| `BRAVE_SEARCH_API_KEY` | Fetch search images from five targeted professional domains |
| `VISION_API_KEY` | Actual house analysis and comparative visual image understanding |
| `VISION_API_BASE` | Compatible Chat Completions URL prefix; default `https://api.openai.com/v1` |
| `VISION_MODEL` | Vision-capable multimodal model identifier; default `gpt-4.1-mini` |
| `PORT` | Server port, default 3000 |

Never put provider keys in public JavaScript. Set usage limits and budget with providers. Brave and vision costs depend on plan and usage. No images are stored by this application; uploaded photos may be sent to the configured model provider for analysis.

## Render configuration

- Repository `https://github.com/zykinigor55-a11y/forma-visual`
- Branch `forma-studio-v1`
- Runtime Node
- Build: `cd studio && npm run check`
- Start: `cd studio && npm start`
- Live: https://forma-studio-architect.onrender.com
- Auto deploy from that branch is enabled.

## API

- `GET /api/health`
- `GET /api/config` (booleans, no keys)
- `POST /api/analyze` `{image:dataURL, project:{type,materials,description,lockGeometry:true}}`
- `GET /api/references?q=...` image search (for diagnostic uses; no visible source-card UI)
- `POST /api/direct` `{image:dataURL, project:{...}, query:"..."}` ranks up to 10 genuine search thumbnails via visual model and returns `reference` and `direction`, or an explicit unavailable status.

**Constraints:** Searches can return zero results; image hosts and model providers might reject externally linked thumbnails. A failed visual assessment is reported explicitly rather than silently choosing the first picture. The external Nano Banana generation endpoint is **not yet wired**, so this version prepares a prompt for manual image-to-image generation. No guarantee of literal 4K rendering from an external model.
