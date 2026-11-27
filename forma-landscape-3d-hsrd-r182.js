// HSRD-100, Digital Reality Lab (2025), CC BY 4.0.
// Original LOD2 geometry and photographic diffuse UV texture; converted at load.
// https://huggingface.co/datasets/digitalrealitylab/HSRD-100
import * as THREE from 'three';
import {unzip} from 'three/addons/libs/fflate.module.js';
const base='https://huggingface.co/datasets/digitalrealitylab/HSRD-100/resolve/main/';
const dataset='https://huggingface.co/datasets/digitalrealitylab/HSRD-100';
const rows=[
['HSR0015-Body-015','Женщина · зимняя прогулка',1.693,'Куртка, шапка, джинсы; шаг'],
['HSR0015-Body-032','Женщина · с сумкой',1.711,'Зелёный свитер, джинсы; шаг'],
['HSR0023-Body-017','Мужчина · прогулка',1.669,'Синий свитер, тёмные брюки; шаг'],
['HSR0027-Body-006','Женщина · зимняя куртка',1.657,'Шарф и перчатки, скрещённые руки'],
['HSR0027-Body-039','Женщина · приветствие',1.663,'Красная толстовка, жест рукой'],
['HSR0028-Body-010','Женщина · с телефоном',1.686,'Серое пальто, зимняя одежда'],
['HSR0028-Body-055','Женщина · фотографирует',1.634,'Рубашка, джинсы, стоя'],
['HSR0040-Body-004','Мужчина · в куртке',1.868,'Зелёная куртка, руки скрещены'],
['HSR0042-Body-002','Мужчина · повседневный',1.837,'Зелёная куртка, рука в кармане'],
['HSR0081-Body-010','Мужчина · селфи',1.765,'Пальто, панама, смартфон'],
['HSR0081-Body-054','Мужчина · летний образ',1.792,'Светлая футболка, руки на бёдрах'],
['HSR0102-Body-019','Женщина · смотрит в телефон',1.708,'Зелёный свитер, джинсы'],
['HSR0112-Body-018','Женщина · стоит',1.698,'Зелёный свитер, рука в кармане'],
['HSR0161-Body-009','Мужчина · разговаривает по телефону',1.787,'Чёрная толстовка, панама']
];
export const HSRD_PEOPLE=Object.freeze(rows.map(([scan,name,height,notes])=>Object.freeze({
 id:'creature-'+scan.toLowerCase(),scan,group:'people',species:'Homo sapiens',name,height,notes:notes+' · статическая поза',emoji:'🧍',lod:2,license:'CC BY 4.0',origin:'Digital Reality Lab / HSRD-100',
 source:dataset+'/tree/main/data/'+scan.split('-')[0]+'/'+scan,
 preview:base+'preview/'+scan+'-Cover.jpg',
 zip:base+'data/'+scan.split('-')[0]+'/'+scan+'/scans/'+scan+'-Scan-LOD2.zip'
})));
const cacheName='forma-hsrd-lod2-r182';
async function getZip(url){
 let cache=null;
 try{cache=await caches.open(cacheName);const hit=await cache.match(url);if(hit)return await hit.arrayBuffer()}catch{}
 const response=await fetch(url,{mode:'cors',credentials:'omit'});
 if(!response.ok)throw Error('HSRD HTTP '+response.status);
 if(cache)try{await cache.put(url,response.clone())}catch{}
 return await response.arrayBuffer();
}
function unzipAsync(bytes){return new Promise((resolve,reject)=>unzip(new Uint8Array(bytes),(err,data)=>err?reject(err):resolve(data)))}
function geometryFromObj(text){
 const points=[],uvs=[],faces=[];
 for(const line of text.split(/\r?\n/)){
  const a=line.trim().split(/\s+/);if(a[0]==='v')points.push(a.slice(1,4).map(Number));
  else if(a[0]==='vt')uvs.push(a.slice(1,3).map(Number));
  else if(a[0]==='f'){const f=a.slice(1).map(x=>x.split('/').map(Number));for(let i=1;i+1<f.length;i++)faces.push([f[0],f[i],f[i+1]])}
 }
 if(!points.length||!uvs.length||faces.length<1000)throw Error('Неполный OBJ');
 // Z-up scan -> Y-up, preserving winding and UV seams; smooth normals on original vertex IDs.
 const p=points.map(([x,y,z])=>new THREE.Vector3(x,z,-y));
 const n=p.map(()=>new THREE.Vector3());const ab=new THREE.Vector3(),ac=new THREE.Vector3(),normal=new THREE.Vector3();
 for(const f of faces){const [a,b,c]=f.map(x=>x[0]-1);ab.subVectors(p[b],p[a]);ac.subVectors(p[c],p[a]);normal.crossVectors(ab,ac);n[a].add(normal);n[b].add(normal);n[c].add(normal)}
 n.forEach(x=>x.normalize());const position=[],normals=[],uv=[],index=[],map=new Map();
 for(const f of faces)for(const [vi,ti] of f){const key=vi+'/'+ti;if(!map.has(key)){map.set(key,position.length/3);position.push(...p[vi-1].toArray());normals.push(...n[vi-1].toArray());uv.push(...uvs[ti-1]);}index.push(map.get(key))}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeBoundingBox();g.computeBoundingSphere();return g;
}
async function photographicTexture(bytes,maxSize){
 const blob=new Blob([bytes],{type:'image/png'}),url=URL.createObjectURL(blob);
 try{
  const img=new Image();img.src=url;await img.decode();
  const ratio=Math.min(1,maxSize/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*ratio);canvas.height=Math.round(img.naturalHeight*ratio);
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
 }finally{URL.revokeObjectURL(url)}
}
export async function loadHsrdPerson(entry,textureSize=2048,localBytes=null){
 const zip=await unzipAsync(localBytes||await getZip(entry.zip));const keys=Object.keys(zip);
 const obj=keys.find(k=>k.endsWith('.obj')),png=keys.find(k=>/_diffuse\.png$/i.test(k));
 if(!obj||!png)throw Error('В архиве нет OBJ или исходной текстуры');
 const geometry=geometryFromObj(new TextDecoder().decode(zip[obj]));
 const map=await photographicTexture(zip[png],textureSize);
 const mat=new THREE.MeshStandardMaterial({map,roughness:.86,metalness:0,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,mat);mesh.castShadow=true;mesh.receiveShadow=true;
 const group=new THREE.Group();group.add(mesh);group.name=entry.scan;group.userData={source:'HSRD-100 / Digital Reality Lab',license:'CC BY 4.0',scan:entry.scan};
 return {scene:group};
}
