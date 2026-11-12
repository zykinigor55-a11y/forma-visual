import * as THREE from "three";
import JSZip from "jszip";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader.js";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader.js";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader.js";

export type Stage = (text: string) => void;
export type ImportReport = {
  scene: THREE.Group;
  sourceName: string;
  format: string;
  meshCount: number;
  triangleCount: number;
  originalSize: [number,number,number];
  previewScale: number;
  note: string;
};

const DIRECT = new Set(["glb","gltf","obj","fbx"]);
const SERVER = new Set(["ifc","skp","blend"]);
const MAX_FILE_SIZE = 150 * 1024 * 1024;
const MAX_ZIP_CONTENTS = 250 * 1024 * 1024;
const sleep = (ms: number) => new Promise<void>(resolve=>setTimeout(resolve,ms));
const extension = (name: string) => name.split(".").pop()?.toLowerCase() || "";
const normalize = (path:string) => {
  let result=path.split(/[?#]/)[0].replace(/\\/g,"/").replace(/^(\.\/)+/,"");
  try{result=decodeURIComponent(result)}catch{}
  return result.toLowerCase();
};
function report(scene:THREE.Group,sourceName:string,format:string):ImportReport{
  const box=new THREE.Box3().setFromObject(scene);
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  if(!Number.isFinite(size.length())||size.length()<1e-7)throw new Error("Модель не содержит корректной геометрии.");
  let meshCount=0,triangleCount=0;
  scene.traverse(obj=>{
    if(obj instanceof THREE.Mesh){
      meshCount++;
      obj.castShadow=true;obj.receiveShadow=true;
      const geom=obj.geometry as THREE.BufferGeometry;
      const n=geom.index?.count || geom.getAttribute("position")?.count || 0;
      triangleCount+=Math.floor(n/3);
    }
  });
  if(meshCount===0)throw new Error("В файле нет объектов Mesh.");
  // Preview-only transform. Geometry remains unchanged so names / UVs survive.
  const scale=10/Math.max(size.x,size.y,size.z);
  const preview=new THREE.Group();
  preview.name="FORMA Preview (not for engineering dimensions)";
  preview.add(scene);
  preview.scale.setScalar(scale);
  preview.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  const unitWarning=(format==="glb"||format==="gltf")?"glTF принято считать метрическим; проверьте размер по чертежу.":"Единицы исходного файла не подтверждены — масштаб просмотра нормализован.";
  return {scene:preview,sourceName,format,meshCount,triangleCount,originalSize:[size.x,size.y,size.z],previewScale:scale,note:unitWarning};
}

async function unpackZip(file:File,stage:Stage):Promise<File[]>{
  if(file.size>MAX_FILE_SIZE)throw new Error("ZIP слишком большой (предел 150 МБ).");
  stage("Читаем архив с моделью и текстурами…");
  const zip=await JSZip.loadAsync(file);
  const entries=Object.values(zip.files).filter(entry=>!entry.dir);
  if(entries.length>200)throw new Error("В архиве слишком много файлов (более 200).");
  const included=entries.filter(entry=>!entry.name.startsWith("__MACOSX/"));
  const results:File[]=[];let total=0;
  for(const entry of included){
    const name=entry.name.replace(/\\/g,"/");
    if(name.startsWith("/")||name.split("/").includes(".."))throw new Error("Недопустимый путь в ZIP.");
    // Limit uncompressed totals to mitigate ZIP bombs.
    const declared=(entry as any)._data?.uncompressedSize as number|undefined;
    if(declared && total+declared>MAX_ZIP_CONTENTS)throw new Error("Распакованная модель превышает 250 МБ.");
    const content=await entry.async("uint8array");
    total+=content.byteLength;
    if(total>MAX_ZIP_CONTENTS)throw new Error("Распакованная модель превышает 250 МБ.");
    results.push(new File([new Uint8Array(content)],name,{type:"application/octet-stream"}));
  }
  return results;
}

function fileMap(files:File[]){
  const map=new Map<string,File>();
  for(const file of files){map.set(normalize(file.name),file);map.set(normalize(file.name).split("/").pop()||"",file)}
  return map;
}

async function directImport(files:File[],stage:Stage):Promise<ImportReport>{
  const main=files.find(f=>DIRECT.has(extension(f.name)));
  if(!main)throw new Error("Нет поддерживаемой 3D-модели внутри выбранных файлов.");
  if(main.size>MAX_FILE_SIZE)throw new Error("Модель превышает 150 МБ.");
  const type=extension(main.name);
  stage("Читаем геометрию и связанные текстуры…");
  const related=fileMap(files);
  const urls=new Set<string>();
  const manager=new THREE.LoadingManager();
  const dependencyUrls=new Map<string,string>();
  for(const [key,file] of related){
    if(file===main)continue;
    const url=URL.createObjectURL(file);urls.add(url);dependencyUrls.set(key,url);
  }
  manager.setURLModifier(url=>{
    if(/^data:|^blob:/i.test(url))return url;
    const clean=normalize(url);
    return dependencyUrls.get(clean)||dependencyUrls.get(clean.split("/").pop()||"")||url;
  });
  try{
    let scene:THREE.Group;
    if(type==="gltf"||type==="glb"){
      const bytes=await main.arrayBuffer();
      stage("Собираем структуру glTF…");
      const loader=new GLTFLoader(manager);
      const gltf=await new Promise<{scene:THREE.Group}>((resolve,reject)=>{
        loader.parse(type==="gltf"?new TextDecoder().decode(bytes):bytes,"",resolve,reject);
      });
      scene=gltf.scene;
    } else if(type==="obj"){
      stage("Разбираем сетку OBJ…");
      const loader=new OBJLoader(manager);
      const materialFile=files.find(f=>extension(f.name)==="mtl");
      if(materialFile){
        const mtl=new MTLLoader(manager);
        const materials=mtl.parse(await materialFile.text(),"");
        materials.preload();
        loader.setMaterials(materials);
      }
      scene=loader.parse(await main.text());
    }else{
      stage("Декодируем FBX, материалы и структуру объектов…");
      scene=new FBXLoader(manager).parse(await main.arrayBuffer(),"");
    }
    stage("Проверяем геометрию и подготавливаем просмотр…");
    return report(scene,main.name,type);
  }finally{
    // Release after parse and textures are prepared; the 3D data is held by Three.js.
    for(const url of urls)URL.revokeObjectURL(url);
  }
}

type Job={id:string;status:string;stage:string;message?:string;output_url?:string};
const base=(import.meta as any).env?.VITE_FORMA_IMPORT_API?.replace(/\/$/,"")||"";
async function responseError(resp:Response):Promise<string>{
  try{const body=await resp.json();return String(body.detail||body.message||resp.statusText)}catch{return resp.status===404?"Сервис конвертации не подключён. Запустите import-service и настройте VITE_FORMA_IMPORT_API.":resp.statusText}
}
async function convertedImport(file:File,stage:Stage):Promise<ImportReport>{
  const ext=extension(file.name);if(!SERVER.has(ext))throw new Error("Этот формат не поддерживается.");
  if(file.size>MAX_FILE_SIZE)throw new Error("Размер файла не должен превышать 150 МБ.");
  stage("Загружаем файл в сервис конвертации…");
  const data=new FormData();data.append("file",file);
  let resp:Response;
  try{resp=await fetch(base+"/api/imports",{method:"POST",body:data})}catch{throw new Error("Нет связи с сервисом конвертации. Проверьте адрес API.")}
  if(!resp.ok)throw new Error(await responseError(resp));
  if(!(resp.headers.get("content-type")||"").includes("application/json"))throw new Error("Сервис конвертации не отвечает. Запустите import-service или настройте API.");
  let job=await resp.json() as Job;
  for(let attempt=0;attempt<120;attempt++){
    if(job.status==="failed")throw new Error(job.message||"Ошибка преобразования модели.");
    if(job.status==="ready"){
      stage("Скачиваем подготовленную GLB-модель…");
      const url=base+(job.output_url||("/api/imports/"+job.id+"/result"));
      const result=await fetch(url);
      if(!result.ok)throw new Error(await responseError(result));
      const glb=new File([await result.blob()],file.name.replace(/\.[^.]+$/,"")+".glb",{type:"model/gltf-binary"});
      const parsed=await directImport([glb],stage);
      return {...parsed,sourceName:file.name,format:ext,note:"Модель преобразована в GLB. Проверьте единицы и сохранность материалов."};
    }
    stage(job.stage||"Конвертация модели…");
    await sleep(1500);
    const status=await fetch(base+"/api/imports/"+encodeURIComponent(job.id));
    if(!status.ok)throw new Error(await responseError(status));
    job=await status.json() as Job;
  }
  throw new Error("Конвертация выполняется слишком долго. Повторите позже.");
}

export async function importArchitecture(files:File[],stage:Stage):Promise<ImportReport>{
  if(!files.length)throw new Error("Выберите файл модели.");
  if(files.some(f=>f.size>MAX_FILE_SIZE))throw new Error("Максимальный размер одного файла — 150 МБ.");
  if(files.length===1&&extension(files[0].name)==="zip"){
    const entries=await unpackZip(files[0],stage);
    return directImport(entries,stage);
  }
  const main=files.find(f=>DIRECT.has(extension(f.name)));
  if(main)return directImport(files,stage);
  if(files.length===1&&SERVER.has(extension(files[0].name)))return convertedImport(files[0],stage);
  throw new Error("Выберите GLB, GLTF, OBJ, FBX, IFC, SKP, BLEND или ZIP с моделью.");
}
