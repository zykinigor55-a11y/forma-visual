import fs from 'node:fs';
const p='assets/landscape-models/pine-mature-cc0.glb';
const b=fs.readFileSync(p);const jsonLen=b.readUInt32LE(12),jsonType=b.toString('ascii',16,20);
if(jsonType!=='JSON')throw new Error('not JSON GLB');
const d=JSON.parse(b.subarray(20,20+jsonLen).toString('utf8'));
console.log('MODEL_SUMMARY',JSON.stringify({meshes:d.meshes?.length,nodes:d.nodes?.length,materials:d.materials?.map((m,i)=>({i,name:m.name,alphaMode:m.alphaMode,alphaCutoff:m.alphaCutoff,baseColor:m.pbrMetallicRoughness?.baseColorFactor,texture:m.pbrMetallicRoughness?.baseColorTexture?.index})),extensionsUsed:d.extensionsUsed,assets:d.images?.length}));
for(const [i,n] of (d.nodes||[]).entries())if(n.mesh!==undefined){
 const me=d.meshes[n.mesh];
 console.log('MESH_NODE',JSON.stringify({i,name:n.name,mesh:n.mesh,primitives:me?.primitives?.map(pr=>({material:pr.material,attributes:pr.attributes,indexed:pr.indices!==undefined}))}));
}
