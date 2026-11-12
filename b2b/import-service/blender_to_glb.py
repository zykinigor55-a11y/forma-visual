"""Invoked only as: blender -b --factory-startup --python blender_to_glb.py -- source target"""
import bpy
import sys
from pathlib import Path

arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(arguments) != 2:
    raise SystemExit("Expected source path and target path")
src, target = map(Path, arguments)
if src.suffix.lower() == ".blend":
    # .blend may contain arbitrary drivers/text blocks. NEVER import untrusted
    # .blend on an unsandboxed production worker.
    bpy.ops.wm.open_mainfile(filepath=str(src), load_ui=False)
elif src.suffix.lower() == ".fbx":
    bpy.ops.import_scene.fbx(filepath=str(src))
elif src.suffix.lower() == ".obj":
    bpy.ops.wm.obj_import(filepath=str(src))
else:
    raise SystemExit("Unsupported Blender import format")
meshes = [ob for ob in bpy.context.scene.objects if ob.type == "MESH"]
if not meshes:
    raise RuntimeError("Source contains no meshes")
bpy.ops.export_scene.gltf(filepath=str(target), export_format="GLB", export_yup=True)
