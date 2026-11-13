# FORMA B2B model import service (development MVP)

FastAPI conversion queue. The input is not a URL: uploads go directly to this local service.
- IFC -> GLB via official **IfcConvert** executable.
- SKP -> GLB via Python **OpenSKP** parser (alpha; validate against your SketchUp file versions).
- FBX / OBJ / BLEND -> GLB via headless **Blender**.
- GLB / GLTF / OBJ / FBX / ZIP packages can be loaded in browser without this server.

## Local setup

Python 3.11+:

\`\`\`bash
cd b2b/import-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Install Blender and IfcConvert on this machine separately.
uvicorn app:app --host 127.0.0.1 --port 8000
\`\`\`

Start Vite from \`b2b\` separately. Configure \`VITE_FORMA_IMPORT_API=http://127.0.0.1:8000\` in \`b2b/.env.local\` and restart Vite (or configure a reverse proxy).

## API

- \`POST /api/imports\`: multipart \`file\`; returns \`202 {id,status,stage,...}\`
- \`GET /api/imports/:id\`: poll queue status.
- \`GET /api/imports/:id/result\`: ready GLB (retained for 1 hour).
- \`GET /api/health\`: binary availability.

The service does **not** ship or install Blender/IfcConvert. If a required converter is missing, its job fails with an error; it does not pretend to convert.

## Security & production deployment blockers

Do **not** expose this example directly to the internet. It has no authentication, billing, distributed jobs, persistent storage, or rate limiting. It starts external binaries on uploaded files; conversion must happen on isolated workers with CPU/RAM/disk/time quotas, no outbound network, and strict limits. The in-memory queue is only safe for a single worker process; it loses jobs on restart. Treat .blend files as potentially executable content and disable them for untrusted public uploads until isolated. The app's import preview is not a source of certified engineering dimensions.
