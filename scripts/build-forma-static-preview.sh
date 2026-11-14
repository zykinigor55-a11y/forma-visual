#!/usr/bin/env bash
set -euo pipefail
# Separate read-only, browser-only presentation build.
# Never modify the original app or server deployment.
OUT="${1:-forma-preview-site}"
mkdir -p "$OUT"
find . -maxdepth 1 -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.svg' -o -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.gif' -o -name '*.woff' -o -name '*.woff2' -o -name '*.mp4' \) -exec cp -t "$OUT" {} +
cp -R assets "$OUT/assets"
touch "$OUT/.nojekyll"
python3 - "$OUT/index.html" <<'PY'
from pathlib import Path
import sys
path=Path(sys.argv[1]); page=path.read_text(encoding="utf-8")
tag='<script defer src="forma-static-preview.js?v=static-preview-1"></script>'
if tag not in page:
    page=page.replace("</body>", tag+"\n</body>")
path.write_text(page,encoding="utf-8")
PY
echo "Static preview ready in $OUT"
