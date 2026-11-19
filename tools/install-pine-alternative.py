#!/usr/bin/env python3
"""Stage a second CC0 mature Scots pine for A/B evaluation, without switching runtime."""
import datetime
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("forma_cc0_model_inspection", ROOT/"tools/install-mature-trees.py")
inspector=importlib.util.module_from_spec(spec)
spec.loader.exec_module(inspector)

slug="mature-scots-pine-tree-280307e1"
url=f"https://www.innerscene.com/api/library/{slug}/download"
page=f"https://www.innerscene.com/tools/library/3d-parts/{slug}"
file="pine-mature-innerscene-cc0.glb"
destination=ROOT/"assets"/"landscape-models"
data,resolved=inspector.fetch(url)
report=inspector.inspect(data,"pine-alt")
if not report["meshes"] or report["triangles"]<1000:
    raise RuntimeError("Alternative pine must contain 3D trunk and crown geometry")
out=destination/file
out.write_bytes(data)
metadata={
 "species":"pine","variant":"CC0 alternative for visual comparison, not yet runtime default",
 "sourcePage":page,"sourceDownload":url,"resolvedDownload":resolved,
 "license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/",
 "retrievedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "sha256":hashlib.sha256(data).hexdigest(),"sizeBytes":len(data),
 "analysis":report,
 "note":"Downloaded for A/B visual QA. Existing pine remains active until approved."
}
out.with_suffix(".source.json").write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+"\n")
print("CC0 alternative downloaded, inspected and staged:",metadata,flush=True)
