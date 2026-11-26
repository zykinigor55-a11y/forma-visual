# SPDX-License-Identifier: GPL-3.0-or-later
# FORMA Cycles R108 - architectural lighting and foliage refinement; local only.
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

# Material reconstruction: keep original imported texture and base color.
def principled(mat):
    if not mat or not mat.use_nodes: return None
    return next((n for n in mat.node_tree.nodes if n.type=="BSDF_PRINCIPLED"),None)

def set_input(node,name,value):
    if name in node.inputs: node.inputs[name].default_value=value

def bump_noise(nt,shader,scale,distance,strength,detail=3):
    n=nt.nodes.new("ShaderNodeTexNoise");n.inputs["Scale"].default_value=scale
    n.inputs["Detail"].default_value=detail
    coords=nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(coords.outputs["Object"],n.inputs["Vector"])
    bump=nt.nodes.new("ShaderNodeBump");bump.inputs["Strength"].default_value=strength
    bump.inputs["Distance"].default_value=distance
    nt.links.new(n.outputs["Fac"],bump.inputs["Height"])
    normal=shader.inputs["Normal"]
    if normal.is_linked: nt.links.new(normal.links[0].from_socket,bump.inputs["Normal"])
    nt.links.new(bump.outputs["Normal"],normal)

def upgrade(mat,kind):
    p=principled(mat)
    if p is None: return
    nt=mat.node_tree
    if kind in ("water","glass"):
        for name in ("Alpha","Transmission Weight","Roughness","Metallic"):
            if name in p.inputs:
                for link in list(p.inputs[name].links): nt.links.remove(link)
        set_input(p,"Alpha",1);set_input(p,"Metallic",0);set_input(p,"Transmission Weight",1)
        set_input(p,"IOR",1.333 if kind=="water" else 1.45)
        set_input(p,"Roughness",.045 if kind=="water" else .035)
        if kind=="water":
            base=p.inputs["Base Color"]
            for link in list(base.links):nt.links.remove(link)
            base.default_value=(.91,.97,.985,1)
            bump_noise(nt,p,12,.018,.23,4)
            bump_noise(nt,p,75,.003,.16,2)
    elif kind=="foliage":
        set_input(p,"Roughness",.62);set_input(p,"Metallic",0)
        set_input(p,"Specular IOR Level",.27)
        # Thin-leaf transmission, preserving any imported alpha cutout.
        output=next((n for n in nt.nodes if n.type=="OUTPUT_MATERIAL"),None)
        if output and output.inputs["Surface"].is_linked:
            old=output.inputs["Surface"].links[0].from_socket
            trans=nt.nodes.new("ShaderNodeBsdfTranslucent")
            base=p.inputs["Base Color"]
            if base.is_linked: nt.links.new(base.links[0].from_socket,trans.inputs["Color"])
            else: trans.inputs["Color"].default_value=base.default_value
            mix=nt.nodes.new("ShaderNodeMixShader");mix.inputs[0].default_value=.18
            nt.links.new(old,mix.inputs[1]);nt.links.new(trans.outputs[0],mix.inputs[2])
            # Preserve cutout silhouette: mask the translucent lobe as well.
            alpha=p.inputs["Alpha"]
            if alpha.is_linked or alpha.default_value<.99:
                mask=nt.nodes.new("ShaderNodeMixShader")
                transparent=nt.nodes.new("ShaderNodeBsdfTransparent")
                nt.links.new(transparent.outputs[0],mask.inputs[1])
                nt.links.new(trans.outputs[0],mask.inputs[2])
                if alpha.is_linked: nt.links.new(alpha.links[0].from_socket,mask.inputs[0])
                else: mask.inputs[0].default_value=alpha.default_value
                nt.links.new(mask.outputs[0],mix.inputs[2])
            nt.links.new(mix.outputs[0],output.inputs["Surface"])
    elif kind=="bark":
        bump_noise(nt,p,33,.014,.35,4)
        bump_noise(nt,p,115,.002,.16,2)
    elif kind=="ground":
        bump_noise(nt,p,45,.009,.23,3)
        bump_noise(nt,p,160,.0015,.12,2)

# Detach shared GLB materials by semantic category so water cannot change walls.
mat_cache={}
for item in job.get("objects",[]):
    ob=bpy.data.objects.get(item["name"])
    if ob is None or ob.type!="MESH": continue
    kind=item["kind"]
    for slot in ob.material_slots:
        if not slot.material: continue
        key=(slot.material.name,kind)
        if key not in mat_cache:
            m=slot.material.copy();upgrade(m,kind);mat_cache[key]=m
        slot.material=mat_cache[key]

# Preserve instance colors by grouping near-identical tints, not expanding meshes.
def build_batch(batch):
    obj=bpy.data.objects.get(batch["name"])
    if obj is None or obj.type!="MESH": raise RuntimeError("Missing prototype: "+batch["name"])
    data=batch["data"]; groups={}
    for i in range(0,len(data),13):
        a=data[i:i+13]
        tint=tuple(round(max(0,min(1,v))*5)/5 for v in a[10:13])
        groups.setdefault(tint,[]).append(a)
    # Keep each prototype in a non-scene collection so Object Info can reference
    # its original mesh without directly rendering it.
    source_collection=bpy.data.collections.get("FORMA prototypes") or bpy.data.collections.new("FORMA prototypes")
    for tint, rows in groups.items():
        prototype=obj.copy();prototype.data=obj.data.copy()
        source_collection.objects.link(prototype)
        prototype.name=batch["name"]+"_prototype"
        prototype.hide_render=False;prototype.hide_viewport=False
        for slot in prototype.material_slots:
            if not slot.material or not slot.material.use_nodes:continue
            mat=slot.material.copy();slot.material=mat;nt=mat.node_tree
            shader=principled(mat)
            if not shader:continue
            base=shader.inputs["Base Color"]
            if base.is_linked:
                source=base.links[0].from_socket
                mix=nt.nodes.new("ShaderNodeMixRGB");mix.blend_type="MULTIPLY"
                mix.inputs[0].default_value=1;mix.inputs[2].default_value=(*tint,1)
                nt.links.new(source,mix.inputs[1]);nt.links.new(mix.outputs[0],base)
            else:
                old=base.default_value[:];base.default_value=tuple(old[i]*tint[i] for i in range(3))+(old[3],)
        mesh=bpy.data.meshes.new(batch["name"]+"_points")
        mesh.vertices.add(len(rows));coords=[];angles=[];scales=[]
        for a in rows:
            coords.extend(vec(a[:3]));angles.extend(rotation(a[3:7]).to_euler("XYZ"));scales.extend((a[7],a[9],a[8]))
        mesh.vertices.foreach_set("co",coords)
        for name,values in (("forma_rotation",angles),("forma_scale",scales)):
            attr=mesh.attributes.new(name,"FLOAT_VECTOR","POINT");attr.data.foreach_set("vector",values)
        mesh.update()
        points=bpy.data.objects.new(batch["name"]+"_instances",mesh);scene.collection.objects.link(points)
        tree=bpy.data.node_groups.new(batch["name"]+"_GN","GeometryNodeTree")
        tree.interface.new_socket(name="Geometry",in_out="INPUT",socket_type="NodeSocketGeometry")
        tree.interface.new_socket(name="Geometry",in_out="OUTPUT",socket_type="NodeSocketGeometry")
        ns,ls=tree.nodes,tree.links
        inp,out=ns.new("NodeGroupInput"),ns.new("NodeGroupOutput")
        inst=ns.new("GeometryNodeInstanceOnPoints");info=ns.new("GeometryNodeObjectInfo")
        info.transform_space="ORIGINAL";info.inputs["Object"].default_value=prototype;info.inputs["As Instance"].default_value=False
        ls.new(inp.outputs["Geometry"],inst.inputs["Points"]);ls.new(info.outputs["Geometry"],inst.inputs["Instance"])
        for attrname,socket in (("forma_rotation","Rotation"),("forma_scale","Scale")):
            attr=ns.new("GeometryNodeInputNamedAttribute");attr.data_type="FLOAT_VECTOR";attr.inputs["Name"].default_value=attrname
            ls.new(attr.outputs["Attribute"],inst.inputs[socket])
        ls.new(inst.outputs["Instances"],out.inputs["Geometry"])
        points.modifiers.new("FORMA instances","NODES").node_group=tree
    bpy.data.objects.remove(obj,do_unlink=True)

for batch in job["batches"]:build_batch(batch)
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
atm=job.get("atmosphere",{})
weather=atm.get("weather","sunny")
time=atm.get("time","day")
cloudy=weather in ("overcast","rain","fog","snow")
hdri=folder/"environment.hdr"
if hdri.exists():
    env=nt.nodes.new("ShaderNodeTexEnvironment");env.image=bpy.data.images.load(str(hdri))
    nt.links.new(env.outputs["Color"],bg.inputs["Color"]);bg.inputs["Strength"].default_value=.8
elif time not in ("night","blue-hour") and sun:
    direction=vec(sun["direction"]).normalized()
    sky=nt.nodes.new("ShaderNodeTexSky");sky.sky_type="NISHITA"
    sky.sun_elevation=max(.018,math.asin(max(-1,min(1,direction.z))))
    sky.sun_rotation=math.atan2(direction.y,direction.x)
    sky.sun_disc=False
    sky.air_density=1.05;sky.dust_density=2.8 if cloudy else 1.1
    nt.links.new(sky.outputs["Color"],bg.inputs["Color"])
    bg.inputs["Strength"].default_value=.27 if cloudy else .38
else:
    bg.inputs["Color"].default_value=(.09,.15,.30,1) if time=="blue-hour" else (.025,.043,.095,1)
    bg.inputs["Strength"].default_value=.45 if time=="blue-hour" else .18
for light in job["lights"]:
    typ=light["type"]; ld=bpy.data.lights.new(light["name"],typ)
    ob=bpy.data.objects.new(light["name"],ld); scene.collection.objects.link(ob)
    ob.location=vec(light["position"]); ld.color=light["color"]
    # Reduce the direct component in diffuse weather rather than washing out
    # the shaded side of buildings with extra artificial fill.
    sun_factor=.12 if cloudy else .65
    if time in ("blue-hour","night"): sun_factor=0.0
    ld.energy=light["energy"]*(sun_factor if typ=="SUN" and light["name"]=="sun" else 1.0)
    if typ in ("SUN","SPOT","AREA"):
        direction=vec(light["direction"])
        if direction.length>0: ob.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
    if typ=="SUN": ld.angle=math.radians(25 if cloudy else .53)
    if typ in ("POINT","SPOT"): ld.shadow_soft_size=.045
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
if chosen=="CPU":
    if requested!="AUTO" and requested!="CPU":raise RuntimeError("Requested GPU unavailable: "+requested+". Select AUTO or install the correct driver.")
    scene.cycles.device="CPU"
print("FORMA Cycles backend:",chosen,flush=True)
settings=job["render"]
scene.cycles.samples=settings["samples"]
scene.cycles.use_denoising=True
scene.cycles.use_adaptive_sampling=True
scene.cycles.adaptive_threshold=.004 if settings["samples"]>=1024 else .008 if settings["samples"]>=256 else .025
scene.cycles.adaptive_min_samples=64 if settings["samples"]>=256 else 8
try:
    scene.cycles.denoiser="OPTIX" if chosen=="OPTIX" else "OPENIMAGEDENOISE"
except Exception:pass
scene.cycles.max_bounces=settings["bounces"]
scene.cycles.diffuse_bounces=min(6,settings["bounces"])
scene.cycles.glossy_bounces=min(8,settings["bounces"])
scene.cycles.transmission_bounces=min(12,settings["bounces"])
# Dense overlapping cutout foliage needs its own bounce budget.
scene.cycles.transparent_max_bounces=16 if settings["samples"]>=256 else 8
scene.cycles.sample_clamp_indirect=8.0
scene.cycles.blur_glossy=.35
scene.render.resolution_x=settings["width"];scene.render.resolution_y=settings["height"]
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.image_settings.color_depth="16"
scene.render.film_transparent=False
scene.view_settings.exposure=job.get("exposure",0)
scene.render.filepath=str(folder/"FORMA-render.png")
try: scene.view_settings.view_transform="AgX"
except: pass
try: scene.view_settings.look="AgX - Medium High Contrast" if time in ("blue-hour","night") else "AgX - Medium Low Contrast"
except Exception: pass
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(folder/"FORMA-scene.blend"))
bpy.ops.render.render(write_still=True)
