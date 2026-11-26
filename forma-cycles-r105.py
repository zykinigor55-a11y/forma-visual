# SPDX-License-Identifier: GPL-3.0-or-later
# FORMA Cycles R105 - local, no network requests.
import bpy, json, math, os
from pathlib import Path
from mathutils import Matrix, Quaternion, Vector

folder = Path(__file__).resolve().parent
job = json.loads((folder / "job.json").read_text(encoding="utf-8"))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(folder / "scene.glb"))
scene = bpy.context.scene
C = Matrix(((1,0,0),(0,0,-1),(0,1,0)))
def vec(v): return C @ Vector(v)
def rotation(q): return C @ Quaternion((q[3],q[0],q[1],q[2])).to_matrix() @ C.inverted()

# Geometry Nodes preserve instancing; do not expand each blade into full meshes.
def build_batch(batch):
    obj = bpy.data.objects.get(batch["name"])
    if obj is None or obj.type != "MESH":
        raise RuntimeError("Missing prototype: " + batch["name"])
    data = batch["data"]
    count = len(data)//13
    if not count: return
    mesh = bpy.data.meshes.new(batch["name"]+"_points")
    mesh.vertices.add(count)
    coords, angles, scales = [], [], []
    for i in range(count):
        a = data[i*13:(i+1)*13]
        coords.extend(vec(a[:3]))
        angles.extend(rotation(a[3:7]).to_euler("XYZ"))
        scales.extend((a[7],a[9],a[8]))
    mesh.vertices.foreach_set("co", coords)
    for name, values in (("forma_rotation",angles),("forma_scale",scales)):
        attr = mesh.attributes.new(name,"FLOAT_VECTOR","POINT")
        attr.data.foreach_set("vector",values)
    mesh.update()
    points = bpy.data.objects.new(batch["name"]+"_instances",mesh)
    scene.collection.objects.link(points)
    tree = bpy.data.node_groups.new(batch["name"]+"_GN","GeometryNodeTree")
    tree.interface.new_socket(name="Geometry",in_out="INPUT",socket_type="NodeSocketGeometry")
    tree.interface.new_socket(name="Geometry",in_out="OUTPUT",socket_type="NodeSocketGeometry")
    ns, ls = tree.nodes, tree.links
    inp,out = ns.new("NodeGroupInput"),ns.new("NodeGroupOutput")
    inst = ns.new("GeometryNodeInstanceOnPoints")
    info = ns.new("GeometryNodeObjectInfo")
    info.transform_space = "ORIGINAL"
    info.inputs["Object"].default_value = obj
    info.inputs["As Instance"].default_value = False
    ls.new(inp.outputs["Geometry"],inst.inputs["Points"])
    ls.new(info.outputs["Geometry"],inst.inputs["Instance"])
    for attrname, socket in (("forma_rotation","Rotation"),("forma_scale","Scale")):
        attr = ns.new("GeometryNodeInputNamedAttribute")
        attr.data_type = "FLOAT_VECTOR"
        attr.inputs["Name"].default_value = attrname
        ls.new(attr.outputs["Attribute"],inst.inputs[socket])
    ls.new(inst.outputs["Instances"],out.inputs["Geometry"])
    points.modifiers.new("FORMA instances","NODES").node_group = tree
    # Source object is retained for the Object Info node but never rendered directly.
    obj.hide_render = True
    obj.hide_set(True)
    # Average tint retained in initial bridge; individual variation is a later upgrade.
    tint = batch.get("tint",[1,1,1])
    for slot in obj.material_slots:
        if not slot.material or not slot.material.use_nodes: continue
        mat = slot.material.copy(); slot.material = mat
        nt = mat.node_tree
        shader = next((n for n in nt.nodes if n.type=="BSDF_PRINCIPLED"),None)
        if not shader: continue
        base = shader.inputs["Base Color"]
        if base.is_linked:
            source = base.links[0].from_socket
            mix = nt.nodes.new("ShaderNodeMixRGB")
            mix.blend_type="MULTIPLY"; mix.inputs[0].default_value=1
            mix.inputs[2].default_value=(*tint,1)
            nt.links.new(source,mix.inputs[1]); nt.links.new(mix.outputs[0],base)
        else:
            old = base.default_value[:]
            base.default_value = tuple(old[i]*tint[i] for i in range(3))+(old[3],)

for batch in job["batches"]: build_batch(batch)
# Three camera local axes agree with Blender camera; convert only world basis.
camdata=bpy.data.cameras.new("FORMA Camera")
cam=bpy.data.objects.new("FORMA Camera",camdata); scene.collection.objects.link(cam)
c=job["camera"]; cam.location=vec(c["position"])
q=c["quaternion"]; cam.rotation_mode="QUATERNION"
cam.rotation_quaternion=(C @ Quaternion((q[3],q[0],q[1],q[2])).to_matrix()).to_quaternion()
camdata.clip_start=max(.005,c["near"]); camdata.clip_end=max(100,c["far"])
if c["ortho"]:
    camdata.type="ORTHO"; camdata.ortho_scale=c["orthoWidth"]
else:
    camdata.sensor_fit="VERTICAL"; camdata.angle_y=math.radians(c["fov"])
scene.camera=cam
world=bpy.data.worlds.new("FORMA Sky"); scene.world=world; world.use_nodes=True
nt=world.node_tree; bg=nt.nodes.get("Background")
sun=job.get("sun")
if sun and sun["energy"]>.2:
    direction=vec(sun["direction"]).normalized()
    sky=nt.nodes.new("ShaderNodeTexSky"); sky.sky_type="NISHITA"
    sky.sun_elevation=max(.025, math.asin(max(-1,min(1,direction.z))))
    sky.sun_rotation=math.atan2(direction.y,direction.x)
    sky.sun_disc=False
    nt.links.new(sky.outputs["Color"],bg.inputs["Color"]); bg.inputs["Strength"].default_value=.45
else:
    bg.inputs["Color"].default_value=(.045,.065,.12,1); bg.inputs["Strength"].default_value=.25
for light in job["lights"]:
    typ=light["type"]; ld=bpy.data.lights.new(light["name"],typ)
    ob=bpy.data.objects.new(light["name"],ld); scene.collection.objects.link(ob)
    ob.location=vec(light["position"]); ld.color=light["color"]
    ld.energy=light["energy"]
    if typ in ("SUN","SPOT","AREA"):
        direction=vec(light["direction"])
        if direction.length>0: ob.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
    if typ=="SUN": ld.angle=math.radians(.7)
    if typ=="SPOT": ld.spot_size=light.get("angle",.9); ld.spot_blend=.25
    if typ=="AREA": ld.shape="RECTANGLE";ld.size=light.get("width",1);ld.size_y=light.get("height",1)
scene.render.engine="CYCLES"
pref=bpy.context.preferences.addons["cycles"].preferences
chosen="CPU"
requested=job.get("device","AUTO")
if requested!="CPU":
    order=["OPTIX","CUDA","HIP","ONEAPI","METAL"] if requested=="AUTO" else [requested]
    for backend in order:
        try:
            pref.compute_device_type=backend;pref.get_devices()
            devices=[d for d in pref.devices if d.type==backend]
            if not devices: continue
            for d in pref.devices: d.use=d in devices
            scene.cycles.device="GPU";chosen=backend;break
        except Exception as e: print("Device unavailable:",backend,e)
if chosen=="CPU": scene.cycles.device="CPU"
print("FORMA Cycles backend:",chosen,flush=True)
settings=job["render"]
scene.cycles.samples=settings["samples"]
scene.cycles.use_denoising=True
scene.cycles.max_bounces=settings["bounces"]
scene.cycles.diffuse_bounces=min(6,settings["bounces"])
scene.cycles.glossy_bounces=min(8,settings["bounces"])
scene.cycles.transmission_bounces=min(8,settings["bounces"])
scene.render.resolution_x=settings["width"];scene.render.resolution_y=settings["height"]
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(folder/"FORMA-render.png")
try: scene.view_settings.view_transform="AgX"
except: pass
bpy.ops.wm.save_as_mainfile(filepath=str(folder/"FORMA-scene.blend"))
bpy.ops.render.render(write_still=True)
