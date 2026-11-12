import React,{Suspense,useEffect,useRef,useState} from "react";
import {Canvas,ThreeEvent} from "@react-three/fiber";
import {Grid,OrbitControls,ContactShadows,Html} from "@react-three/drei";
import {importArchitecture,ImportReport} from "./importArchitecture";
import * as THREE from "three";
import {Box,Layers,Settings2,Package,Home,Upload,Download,Check,Eye,RotateCcw,Info,FileBox,MousePointer2} from "lucide-react";

type Zone="facade"|"roof"|"plinth"|"frames";
type Material={id:string;name:string;color:string;sku:string;price:number};
type Config={width:number;height:number;depth:number;panelWidth:number;gap:number;orientation:"vertical"|"horizontal";zoneMaterials:Record<Zone,string>};
const materials:Material[]=[
{id:"cedar",name:"Кедр натуральный",color:"#a88a6e",sku:"WD-001",price:5400},
{id:"fiber",name:"Фиброцемент / минерал",color:"#d4d0c9",sku:"FC-204",price:3600},
{id:"metal",name:"Титан сатин",color:"#909da6",sku:"MT-018",price:6200},
{id:"charcoal",name:"Графит",color:"#454c52",sku:"MT-027",price:5800},
{id:"slate",name:"Сланец",color:"#63696b",sku:"ST-006",price:7100},
{id:"oak",name:"Термодерево",color:"#927558",sku:"WD-017",price:6900}
];
const initial:Config={width:9,height:3.2,depth:7,panelWidth:.18,gap:.012,orientation:"vertical",zoneMaterials:{facade:"cedar",roof:"charcoal",plinth:"slate",frames:"charcoal"}};
const zones:Zone[]=["facade","roof","plinth","frames"];
const zoneNames:Record<Zone,string>={facade:"Фасады",roof:"Кровля",plinth:"Цоколь",frames:"Окна и двери"};
const byId=(id:string)=>materials.find(m=>m.id===id)||materials[0];
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function Standard({color,metalness=0,roughness=.77}:{color:string;metalness?:number;roughness?:number}){return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness}/>}
function Building({config,selected,onZone}:{config:Config;selected:Zone;onZone:(z:Zone)=>void}){
 const {width:w,height:h,depth:d}=config;const wallDepth=.18,roofRise=1.85;
 const color=(z:Zone)=>byId(config.zoneMaterials[z]).color;
 const sideWidth=w*.43; const groundHeight=.34;
 const segment=(x:number,y:number,z:number,sw:number,sh:number,sd:number,zone:Zone,key:string)=>(
 <mesh key={key} position={[x,y,z]} castShadow receiveShadow onClick={e=>{e.stopPropagation();onZone(zone)}}><boxGeometry args={[sw,sh,sd]}/><Standard color={zone==="facade"?"#c6c5c0":color(zone)} roughness={.84}/></mesh>);
 const frontOpenings=[{x:-w*.265,y:1.48,ww:1.45,hh:1.73},{x:w*.19,y:1.48,ww:1.45,hh:1.73}];
 const divisions=Array.from(new Set([-w/2,w/2,...frontOpenings.flatMap(o=>[o.x-o.ww/2,o.x+o.ww/2])])).sort((a,b)=>a-b);
 const frontPieces=divisions.slice(0,-1).flatMap((a,i)=>{const b=divisions[i+1],cx=(a+b)/2,sw=b-a;
 const opening=frontOpenings.find(o=>cx>o.x-o.ww/2+.001&&cx<o.x+o.ww/2-.001);
 if(!opening)return [segment(cx,h/2,d/2,sw,h,wallDepth,"facade","front"+i)];
 const bottom=opening.y-opening.hh/2,top=opening.y+opening.hh/2;return [segment(cx,bottom/2,d/2,sw,bottom,wallDepth,"facade","sill"+i),segment(cx,(h+top)/2,d/2,sw,h-top,wallDepth,"facade","header"+i)]});
 const pane=(x:number,y:number,z:number,ww:number,hh:number,rot=0,key="pane")=><group key={key} position={[x,y,z]} rotation={[0,rot,0]} onClick={e=>{e.stopPropagation();onZone("frames")}}><mesh castShadow><boxGeometry args={[ww,hh,.085]}/><Standard color={color("frames")} metalness={.25}/></mesh><mesh position={[0,0,.052]}><boxGeometry args={[ww-.115,hh-.115,.012]}/><Standard color="#78909d" metalness={.5} roughness={.16}/></mesh><mesh position={[0,0,.064]}><boxGeometry args={[.045,hh-.12,.015]}/><Standard color={color("frames")}/></mesh><mesh position={[0,0,.065]}><boxGeometry args={[ww-.12,.04,.016]}/><Standard color={color("frames")}/></mesh></group>;
 const roofGeo=React.useMemo(()=>{const shape=new THREE.Shape();shape.moveTo(-w/2-.35,0);shape.lineTo(0,roofRise);shape.lineTo(w/2+.35,0);shape.lineTo(w/2+.35,-.16);shape.lineTo(0,roofRise-.16);shape.lineTo(-w/2-.35,-.16);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:d+.8,bevelEnabled:false});geo.computeVertexNormals();return geo},[w,d]);
 React.useEffect(()=>()=>roofGeo.dispose(),[roofGeo]);
 const selectedOutline=(zone:Zone)=>selected===zone?"#7a98af":"#a9afb3";
 const slats=React.useMemo(()=>{const step=Math.max(.065,config.panelWidth+config.gap);return Math.min(135,Math.floor((config.orientation==="vertical"?w:h)/step))},[w,h,config.panelWidth,config.gap,config.orientation]);
 const {orientation,panelWidth:pw,gap}=config;
 return <group><group position={[0,groundHeight,0]}>
 {segment(0,h/2,-d/2,w,h,wallDepth,"facade","back")}
 {segment(-w/2,h/2,0,wallDepth,h,d,"facade","left")}
 {segment(w/2,h/2,0,wallDepth,h,d,"facade","right")}
 {frontPieces}
 {Array.from({length:slats},(_,i)=>{const step=pw+gap,isV=orientation==="vertical";
 const xx=isV?-w/2+pw/2+i*step:0,yy=isV?h/2:pw/2+i*step;
 return <mesh key={"clad"+i} position={[xx,yy,d/2+.11]} castShadow receiveShadow onClick={e=>{e.stopPropagation();onZone("facade")}}><boxGeometry args={[isV?pw:w,isV?h:pw,.03]}/><Standard color={color("facade")} metalness={config.zoneMaterials.facade==="metal"?.35:0}/></mesh>})}
 {frontOpenings.map((o,i)=>pane(o.x,o.y,d/2+.155,o.ww,o.hh,0,"frontPane"+i))}
 {pane(w/2+.13,1.55,-d*.1,1.3,1.55,Math.PI/2,"sidePane")}
 <mesh position={[0,h+.02,d/2+.27]} onClick={e=>{e.stopPropagation();onZone("roof")}}><boxGeometry args={[w+.65,.17,.42]}/><Standard color={color("roof")} metalness={.2}/></mesh>
 <mesh position={[0,h,-d/2-.4]} rotation={[0,Math.PI/2,0]} geometry={roofGeo} castShadow receiveShadow onClick={e=>{e.stopPropagation();onZone("roof")}}><Standard color={color("roof")} metalness={.2} roughness={.68}/></mesh>
 {segment(0,-.17,0,w+.06,.34,d+.06,"plinth","plinth")}
 </group>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]} receiveShadow><planeGeometry args={[120,120]}/><Standard color="#e2e6e9" roughness={1}/></mesh>
 {selected&&<mesh position={[0,groundHeight+h/2,d/2+.21]} visible={selected==="facade"}><boxGeometry args={[w+.04,h+.04,.015]}/><meshBasicMaterial color={selectedOutline("facade")} wireframe transparent opacity={.4}/></mesh>}
 </group>
}
function Imported({scene,selectedName,onSelect}:{scene:THREE.Group;selectedName:string;onSelect:(name:string)=>void}){
 return <primitive object={scene} onClick={(event:ThreeEvent<MouseEvent>)=>{event.stopPropagation();onSelect(event.object.name||event.object.uuid)}}/>;
}
function Scene({config,scene,selected,onZone,onMesh}:{config:Config;scene:THREE.Group|null;selected:Zone;onZone:(z:Zone)=>void;onMesh:(s:string)=>void}){
 return <Canvas shadows camera={{position:[13,9,14],fov:37,near:.05,far:300}} gl={{antialias:true,preserveDrawingBuffer:false}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.25}}>
 <color attach="background" args={["#edf0f2"]}/><ambientLight intensity={2.1}/><directionalLight position={[-6,13,9]} intensity={3.2} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25}/>
 <Suspense fallback={<Html center>Загрузка сцены…</Html>}>{scene?<Imported scene={scene} selectedName="" onSelect={onMesh}/>:<Building config={config} selected={selected} onZone={onZone}/>}<Grid infiniteGrid sectionColor="#cad3da" cellColor="#dce2e7" fadeDistance={55} position={[0,-.04,0]}/><ContactShadows opacity={.14} scale={35} blur={2} far={15}/><OrbitControls makeDefault minDistance={2} maxDistance={85} target={[0,1.8,0]}/></Suspense>
 </Canvas>
}
export default function App(){
 const [app,setApp]=useState<"studio"|"home">("studio");const [config,setConfig]=useState<Config>(initial);const [name,setName]=useState("MODUL / 01");const [notice,setNotice]=useState("");
 const [selectedZone,setSelectedZone]=useState<Zone>("facade"),[selectedMesh,setSelectedMesh]=useState("");
 const [imported,setImported]=useState<THREE.Group|null>(null),[fileName,setFileName]=useState(""),[busy,setBusy]=useState(false);
 const [importInfo,setImportInfo]=useState<ImportReport|null>(null),[importStage,setImportStage]=useState("");
 const input=useRef<HTMLInputElement>(null);
 const [catalog,setCatalog]=useState<Config[]>(()=>{try{return JSON.parse(localStorage.getItem("forma-catalog")||"[]")}catch{return []}});
 const update=(key:keyof Config,value:any)=>setConfig(c=>({...c,[key]:value}));
 const updateMaterial=(id:string)=>{
   setConfig(c=>({...c,zoneMaterials:{...c.zoneMaterials,[selectedZone]:id}}));
   if(!imported)return;
   if(!selectedMesh){setNotice("Для импортированной модели сначала выберите объект мышью.");return}
   const mesh=imported.getObjectByProperty("uuid",selectedMesh);
   if(!(mesh instanceof THREE.Mesh)){setNotice("Выбранный элемент не является 3D-сеткой.");return}
   const material=byId(id);
   const assign=(old:THREE.Material)=>{const copy=old.clone();if("color" in copy && copy.color instanceof THREE.Color)copy.color.set(material.color);if("roughness" in copy)(copy as THREE.MeshStandardMaterial).roughness=.72;copy.needsUpdate=true;return copy};
   mesh.material=Array.isArray(mesh.material)?mesh.material.map(assign):assign(mesh.material);
   setNotice("Материал назначен объекту: "+(mesh.name||selectedMesh.slice(0,8)));
 };
 const publish=()=>{const next=[...catalog,structuredClone(config)];setCatalog(next);localStorage.setItem("forma-catalog",JSON.stringify(next));setNotice("Компонент добавлен в локальный каталог")};
 const exportData=()=>{const a=document.createElement("a");const blob=new Blob([JSON.stringify({name,config,source:fileName||"procedural"},null,2)],{type:"application/json"});a.href=URL.createObjectURL(blob);a.download="forma-component.json";a.click();URL.revokeObjectURL(a.href)};
 const upload=async(files:File[])=>{
  setBusy(true);setImportStage("Подготовка файлов…");setNotice("");
  try{
   const result=await importArchitecture(files,setImportStage);
   setImported(result.scene);setImportInfo(result);setFileName(result.sourceName);setSelectedMesh("");
   setNotice("Загружено: "+result.meshCount+" объектов · "+result.triangleCount.toLocaleString("ru-RU")+" полигонов");
  }catch(err){setNotice("Ошибка импорта: "+(err instanceof Error?err.message:"проверьте формат файла"))}
  finally{setBusy(false);setImportStage("");if(input.current)input.current.value=""}
 };
 return <div className="app"><header><div className="brand"><span className="logo">F</span><span><b>FORMA</b> <small>B2B</small><em>{app==="studio"?"STUDIO":"HOME"}</em></span></div><nav><button className={app==="studio"?"active":""} onClick={()=>setApp("studio")}><Package size={15}/> Производитель</button><button className={app==="home"?"active":""} onClick={()=>setApp("home")}><Home size={15}/> Клиент</button></nav><button className="primary" onClick={app==="studio"?publish:exportData}>{app==="studio"?"Опубликовать компонент":"Скачать конфигурацию"}</button></header>
 <div className="workspace"><aside className="left"><h3><Layers size={15}/> {app==="studio"?"Обозреватель сцены":"Материалы и изделия"}</h3><div className="tree"><div>▾ {fileName||name}</div>{zones.map(z=><button key={z} className={"zone "+(selectedZone===z?"selected":"")} onClick={()=>setSelectedZone(z)}>▤　{zoneNames[z]}</button>)}{selectedMesh&&<p>Выбран объект: {imported?.getObjectByProperty("uuid",selectedMesh)?.name||selectedMesh.slice(0,8)}</p>}</div><h3><Box size={15}/> Материалы · {zoneNames[selectedZone]}</h3>{materials.map(m=><button key={m.id} className={"material "+(config.zoneMaterials[selectedZone]===m.id?"selected":"")} onClick={()=>updateMaterial(m.id)}><span className="swatch" style={{background:m.color}}/><span>{m.name}<small>{m.sku} · {m.price.toLocaleString("ru-RU")} ₽/м²</small></span>{config.zoneMaterials[selectedZone]===m.id&&<Check size={14}/>}</button>)}{app==="home"&&<><h3>Каталог Studio</h3><div className="tree">{catalog.length?catalog.map((c,i)=><button key={i} onClick={()=>{setConfig(c);setImported(null);setFileName("")}}>Фасадная система {i+1} · Применить</button>):"Нет опубликованных компонентов"}</div></>}</aside>
 <section className="center" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)upload(Array.from(e.dataTransfer.files))}}><div className="toolbar"><b>{imported?"ИМПОРТИРОВАННАЯ МОДЕЛЬ":app==="studio"?"3D / РЕДАКТОР ЗДАНИЯ":"3D / КОНФИГУРАТОР ДОМА"}</b><span>Мышь — орбита · колесо — масштаб · клик — выбор элемента</span></div><div className="viewport"><Scene config={config} scene={imported} selected={selectedZone} onZone={setSelectedZone} onMesh={setSelectedMesh}/></div><div className="status"><span>Three.js / GLB · метрические единицы</span><span>{fileName||"Процедурная модель"} · фасад {(config.width*config.height).toFixed(2)} м²</span></div></section>
 <aside className="right"><h3><Settings2 size={15}/> {app==="studio"?"Параметры сцены":"Настройки дома"}</h3><div className="uploadbox"><input ref={input} aria-label="Загрузить архитектурную 3D-модель" type="file" multiple accept=".glb,.gltf,.fbx,.obj,.mtl,.bin,.ifc,.skp,.blend,.zip,.png,.jpg,.jpeg,.webp,.ktx2" hidden onChange={e=>{const files=Array.from(e.target.files||[]);if(files.length)upload(files)}}/><button className="secondary" disabled={busy} onClick={()=>input.current?.click()}><Upload size={15}/>{busy?"Обрабатываем…":"Импорт модели"}</button><p>GLB / GLTF / FBX / OBJ / ZIP. IFC / SKP / BLEND — через сервис конвертации. Для GLTF выбирайте модель вместе с BIN и текстурами.</p>{busy&&<div className="import-stage" role="status">{importStage}</div>}{importInfo&&<div className="import-report"><b>{importInfo.sourceName}</b><span>{importInfo.meshCount} объектов · {importInfo.triangleCount.toLocaleString("ru-RU")} треугольников</span><span>Размеры файла: {importInfo.originalSize.map(v=>v.toFixed(2)).join(" × ")} единиц</span><small>{importInfo.note}</small></div>}{imported&&<button className="reset" onClick={()=>{setImported(null);setImportInfo(null);setFileName("");setSelectedMesh("")}}><RotateCcw size={14}/> Вернуться к типовому дому</button>}</div>
 {app==="studio"&&<label>Название проекта<input value={name} onChange={e=>setName(e.target.value)}/></label>}
 {([["Ширина здания","width"],["Высота стен","height"],["Глубина здания","depth"],["Ширина панели","panelWidth"],["Монтажный зазор","gap"]] as const).map(([label,key])=><label key={key}>{label}<div className="number"><input disabled={!!imported} type="number" min=".001" max="100" step={key==="gap"?.001:.01} value={config[key]} onChange={e=>update(key,clamp(Number(e.target.value)||.001,.001,100))}/><span>м</span></div></label>)}
 <label>Раскладка<select disabled={!!imported} value={config.orientation} onChange={e=>update("orientation",e.target.value)}><option value="vertical">Вертикальная</option><option value="horizontal">Горизонтальная</option></select></label>
 <div className="summary"><h3>Спецификация · эскизная</h3><p>Площадь фасада <strong>{(config.width*config.height).toFixed(2)} м²</strong></p><p>Материал <strong>{byId(config.zoneMaterials[selectedZone]).sku}</strong></p><p>Выбранный раздел <strong>{zoneNames[selectedZone]}</strong></p></div><button className="secondary" onClick={exportData}><Download size={15}/> Экспорт JSON</button><p className="disclaimer">В импортированном доме выберите сетку мышью, затем назначьте материал слева. Размеры справа изменяют только типовой дом; масштаб при импорте нормализован для просмотра. IFC/SKP требуют отдельного запущенного API. Расчёты и цены демонстрационные, фоторендер не подключён.</p></aside></div>
 {notice&&<div className="toast" role="status" onClick={()=>setNotice("")}>{notice}</div>}</div>;
}
