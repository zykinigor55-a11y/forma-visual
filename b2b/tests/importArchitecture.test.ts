import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {importArchitecture} from "../src/importArchitecture";

function makeGLB(){
  const positions=new Float32Array([0,0,0,2,0,0,0,2,0]);
  const raw=new Uint8Array(positions.buffer);
  const doc={
    asset:{version:"2.0",generator:"FORMA B2B test fixture"},
    scene:0,
    scenes:[{nodes:[0]}],
    nodes:[{mesh:0,name:"Facade_shell",translation:[10,0,0]}],
    meshes:[{primitives:[{attributes:{POSITION:0},material:0}]}],
    buffers:[{byteLength:raw.byteLength}],
    bufferViews:[{buffer:0,byteOffset:0,byteLength:raw.byteLength}],
    accessors:[{bufferView:0,componentType:5126,count:3,type:"VEC3",min:[0,0,0],max:[2,2,0]}],
    materials:[{name:"Wood_PBR",pbrMetallicRoughness:{baseColorFactor:[.75,.45,.25,1],metallicFactor:.4,roughnessFactor:.7}}]
  };
  const encoder=new TextEncoder(),json=encoder.encode(JSON.stringify(doc));
  const jsonSize=(json.byteLength+3)&~3,binSize=(raw.byteLength+3)&~3;
  const total=12+8+jsonSize+8+binSize;
  const data=new Uint8Array(total);
  const view=new DataView(data.buffer);
  view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,total,true);
  view.setUint32(12,jsonSize,true);view.setUint32(16,0x4e4f534a,true);
  data.fill(0x20,20,20+jsonSize);data.set(json,20);
  const offset=20+jsonSize;
  view.setUint32(offset,binSize,true);view.setUint32(offset+4,0x004e4942,true);
  data.set(raw,offset+8);
  return new File([data],"architectural-sample.glb",{type:"model/gltf-binary"});
}

test("GLB preserves object hierarchy, mesh geometry and PBR parameters",async()=>{
  const messages:string[]=[];
  const result=await importArchitecture([makeGLB()],msg=>messages.push(msg));
  assert.equal(result.sourceName,"architectural-sample.glb");
  assert.equal(result.meshCount,1);
  assert.equal(result.triangleCount,1);
  assert.equal(result.originalSize[0],2);
  assert.equal(result.originalSize[1],2);
  assert.equal(result.previewScale,5);
  let node:THREE.Mesh|undefined;
  result.scene.traverse(n=>{if(n instanceof THREE.Mesh&&n.name==="Facade_shell")node=n});
  assert.ok(node,"Object name must survive GLB import");
  const mesh=node!;
  const material=mesh.material as THREE.MeshStandardMaterial;
  assert.equal(material.name,"Wood_PBR");
  assert.ok(Math.abs(material.metalness-.4)<.001);
  assert.ok(Math.abs(material.roughness-.7)<.001);
  assert.ok(messages.some(x=>x.includes("геометрию")));
});
test("OBJ supports a separate named MTL material",async()=>{
  const obj=new File(["mtllib facade.mtl\n","o Brick_Wall\n","v 0 0 0\nv 1 0 0\nv 0 1 0\n","usemtl Brick_Material\nf 1 2 3\n"],"scene.obj");
  const mtl=new File(["newmtl Brick_Material\nKd 0.5 0.4 0.3\nNs 50\n"],"facade.mtl");
  const result=await importArchitecture([obj,mtl],()=>{});
  assert.equal(result.meshCount,1);
  assert.equal(result.triangleCount,1);
  let found=false;
  result.scene.traverse(n=>{if(n instanceof THREE.Mesh){const mat=n.material as THREE.Material;found ||= mat.name==="Brick_Material"}});
  assert.ok(found,"Material name should survive OBJ/MTL import");
});
test("Reject empty GLB instead of displaying it as a model",async()=>{
  const empty=new File([new Uint8Array()],"empty.glb");
  await assert.rejects(()=>importArchitecture([empty],()=>{}));
});
test("Reject unknown formats",async()=>{
  await assert.rejects(()=>importArchitecture([new File(["foo"],"house.rvt")],()=>{}),/GLB.*GLTF/);
});
