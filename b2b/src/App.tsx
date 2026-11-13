import React,{useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {
 ArrowDownToLine,ArrowRight,Box,Camera,Check,ChevronDown,ChevronRight,Cloud,
 Columns3,Download,FileBox,FileJson,FolderOpen,Grid3X3,Home,Image,
 Info,Layers3,LayoutGrid,Menu,MousePointer2,Package,PanelBottom,PanelLeft,
 PanelRight,Plus,RotateCcw,Ruler,Save,Search,Settings2,SlidersHorizontal,
 SquareStack,Sun,Upload,Undo2,Redo2,X
} from "lucide-react";
import ArchitecturalScene,{CameraPreset,EnvironmentMode,MapSet} from "./ArchitecturalScene";
import {importArchitecture,ImportReport} from "./importArchitecture";
import {clamp,Config,estimate,Finish,getMaterial,INITIAL,MATERIALS,MaterialInfo,Zone,ZONE_NAME,ZONES} from "./model";

type View="studio"|"home";
type CatalogItem={id:string;name:string;config:Config;created:number};
type Variant={id:string;name:string;config:Config};
const copyConfig=(c:Config):Config=>({...c,zoneMaterials:{...c.zoneMaterials}});
function readJSON<T>(key:string,fallback:T):T{
 try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}
}
function num(n:number){return Math.round(n).toLocaleString("ru-RU")}
function currency(n:number){return new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(n)}
function formatSize(v:number){return v.toFixed(2).replace(".",",")}
function chip(zone:Zone){return ZONE_NAME[zone].toUpperCase()}
function exportFile(filename:string,data:unknown){
 const a=document.createElement("a"),blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function Metric({label,value,unit}:{label:string;value:string;unit?:string}){
 return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value} {unit&&<span>{unit}</span>}</div></div>;
}
function NumericControl({label,value,onChange,step=1,min=1,max=50000,disabled=false}:{label:string;value:number;onChange:(v:number)=>void;step?:number;min?:number;max?:number;disabled?:boolean}){
 return <label className="field-row"><span>{label}</span><span className="num-field"><input aria-label={label} type="number" min={min} max={max} step={step} disabled={disabled} value={Math.round(value*1000)} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n))onChange(clamp(n,min,max)/1000)}}/><small>мм</small></span></label>;
}
function MaterialCard({material,active,onClick,compact=false}:{material:MaterialInfo;active:boolean;onClick:()=>void;compact?:boolean}){
 return <button className={"finish-card "+(compact?"compact ":"")+(active?"chosen":"")} onClick={onClick} title={material.name}>
  <span className={"finish-swatch "+material.id} style={{backgroundColor:material.color}}/>
  <span className="finish-data"><b>{material.name}</b><small>{material.sku} · {material.category}</small></span>
  {active&&<Check size={14} className="finish-check"/>}
 </button>;
}

export default function App(){
 const [view,setView]=useState<View>(()=>new URLSearchParams(location.search).get("view")==="home"?"home":"studio");
 const [config,setConfig]=useState<Config>(()=>readJSON("forma-b2b-config-v3",copyConfig(INITIAL)));
 const [projectName,setProjectName]=useState("FORMA HOUSE / 001");
 const [selected,setSelected]=useState<Zone>("facade"),[selectedMesh,setSelectedMesh]=useState("");
 const [inspectorTab,setInspectorTab]=useState<"geometry"|"material">("geometry");
 const [cameraPreset,setCameraPreset]=useState<CameraPreset>("perspective");
 const [environment,setEnvironment]=useState<EnvironmentMode>("daylight");
 const [grid,setGrid]=useState(true),[sceneOpen,setSceneOpen]=useState(()=>innerWidth>1050),[inspectorOpen,setInspectorOpen]=useState(()=>innerWidth>620);
 const [trayOpen,setTrayOpen]=useState(true),[search,setSearch]=useState("");
 const [history,setHistory]=useState<Config[]>([]),[future,setFuture]=useState<Config[]>([]);
 const [notice,setNotice]=useState(""),[stage,setStage]=useState(""),[busy,setBusy]=useState(false);
 const [sourceName,setSourceName]=useState(""),[imported,setImported]=useState<THREE.Group|null>(null);
 const [report,setReport]=useState<ImportReport|null>(null);
 const [maps,setMaps]=useState<MapSet>({});
 const [baseComparison,setBaseComparison]=useState(false);
 const [catalog,setCatalog]=useState<CatalogItem[]>(()=>readJSON<CatalogItem[]>("forma-b2b-catalog-v3",[]));
 const [variants,setVariants]=useState<Variant[]>(()=>readJSON<Variant[]>("forma-b2b-variants-v3",[]));
 const fileRef=useRef<HTMLInputElement>(null),textureRef=useRef<HTMLInputElement>(null),canvasRef=useRef<HTMLCanvasElement|null>(null);
 const stats=useMemo(()=>estimate(config),[config]);
 const activeMaterial=getMaterial(config.zoneMaterials[selected]);
 const displayedConfig=baseComparison&&view==="home"?{...config,zoneMaterials:{...config.zoneMaterials,facade:"ivory" as Finish}}:config;
 const filtered=MATERIALS.filter(m=>(m.name+" "+m.category+" "+m.sku).toLowerCase().includes(search.toLowerCase()));
 useEffect(()=>{const sync=()=>{setSceneOpen(innerWidth>1050);setInspectorOpen(innerWidth>620)};window.addEventListener("resize",sync);return()=>window.removeEventListener("resize",sync)},[]);
 useEffect(()=>{localStorage.setItem("forma-b2b-config-v3",JSON.stringify(config))},[config]);
 useEffect(()=>{localStorage.setItem("forma-b2b-catalog-v3",JSON.stringify(catalog))},[catalog]);
 useEffect(()=>{localStorage.setItem("forma-b2b-variants-v3",JSON.stringify(variants))},[variants]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(""),4400);return()=>clearTimeout(id)},[notice]);
 function changeView(next:View){
  setView(next);
  const url=new URL(location.href);url.searchParams.set("view",next);historyAPI(url);
  setCameraPreset("perspective");setBaseComparison(false);
 }
 function historyAPI(url:URL){window.history.replaceState(null,"",url.pathname+url.search+url.hash)}
 function update(next:Config){
  setHistory(h=>[...h.slice(-29),copyConfig(config)]);setFuture([]);setConfig(copyConfig(next));
 }
 function patch<K extends keyof Config>(key:K,value:Config[K]){update({...config,[key]:value})}
 function undo(){if(!history.length)return;setFuture(f=>[...f,copyConfig(config)]);setConfig(history[history.length-1]);setHistory(h=>h.slice(0,-1))}
 function redo(){if(!future.length)return;setHistory(h=>[...h,copyConfig(config)]);setConfig(future[future.length-1]);setFuture(f=>f.slice(0,-1))}
 function applyFinish(id:Finish){
  if(imported&&selectedMesh){
   const node=imported.getObjectByProperty("uuid",selectedMesh);
   if(node instanceof THREE.Mesh){
    const data=getMaterial(id);
    const change=(m:THREE.Material)=>{const material=m.clone() as THREE.MeshStandardMaterial;if("color" in material&&material.color)material.color.set(data.color);material.needsUpdate=true;return material};
    node.material=Array.isArray(node.material)?node.material.map(change):change(node.material);
    setNotice("Материал применён к объекту "+(node.name||selectedMesh.slice(0,6)));
   }
  } else if(imported){
   setNotice("Для импортированной модели сначала выберите объект мышью.");
   return;
  }
  update({...config,zoneMaterials:{...config.zoneMaterials,[selected]:id}});
 }
 function saveComponent(){
  const item={id:String(Date.now()),name:projectName,config:copyConfig(config),created:Date.now()};
  setCatalog(c=>[item,...c].slice(0,30));
  setNotice("Компонент добавлен в локальный каталог и доступен в FORMA Home.");
 }
 function saveVariant(){
  const name="Концепция "+String(variants.length+1).padStart(2,"0");
  setVariants(v=>[{id:String(Date.now()),name,config:copyConfig(config)},...v].slice(0,6));
  setNotice("Вариант сохранён на этом устройстве.");
 }
 function resetScene(){setImported(null);setReport(null);setSourceName("");setSelectedMesh("");setNotice("Открыт демонстрационный архитектурный проект.")}
 async function upload(files:File[]){
  setBusy(true);setStage("Подготавливаем исходные файлы…");setNotice("");
  try{
   const result=await importArchitecture(files,setStage);
   setImported(result.scene);setSourceName(result.sourceName);setReport(result);setSelectedMesh("");
   setNotice("Модель загружена: "+result.meshCount+" объектов, "+num(result.triangleCount)+" треугольников.");
  }catch(e){setNotice(e instanceof Error?e.message:"Не удалось импортировать модель.")}
  finally{setBusy(false);setStage("");if(fileRef.current)fileRef.current.value=""}
 }
 async function uploadMaps(files:File[]){
  if(!files.length)return;
  const loader=new THREE.TextureLoader();
  const uploaded:MapSet={};
  let count=0;
  for(const file of files){
   if(!file.type.startsWith("image/"))continue;
   let slot:"base"|"normal"|"roughness"="base";
   const n=file.name.toLowerCase();
   if(/normal|_nrm|_nor/.test(n))slot="normal";
   else if(/rough|_rgh/.test(n))slot="roughness";
   const url=URL.createObjectURL(file);
   try{
    const texture=await new Promise<THREE.Texture>((resolve,reject)=>loader.load(url,resolve,undefined,reject));
    texture.colorSpace=slot==="base"?THREE.SRGBColorSpace:THREE.NoColorSpace;
    texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
    texture.anisotropy=8;texture.needsUpdate=true;
    uploaded[selected]={...(uploaded[selected]||{}),[slot]:texture};
    count++;
   }catch{setNotice("Не удалось прочитать текстуру: "+file.name)}
   finally{URL.revokeObjectURL(url)}
  }
  if(count){setMaps(m=>({...m,[selected]:{...(m[selected]||{}),...(uploaded[selected]||{})}}));setNotice("PBR-карты загружены в "+ZONE_NAME[selected]+": "+count+". Изменения пока локальные.")}
  if(textureRef.current)textureRef.current.value="";
 }
 function exportScene(){
  exportFile("forma-b2b-component.json",{schema:"forma-b2b/0.3",project:projectName,config,previewSource:sourceName||"forma-procedural-house",measurement:"m",illustrativeEstimate:stats});
  setNotice("Параметры проекта сохранены в JSON.");
 }
 function capture(){
  const canvas=canvasRef.current;
  if(!canvas){setNotice("3D-сцена ещё не готова.");return}
  try{
   const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="forma-"+view+"-preview.png";a.click();
  }catch{setNotice("Не удалось сохранить изображение с видеокарты.")}
 }
 const cameraButtons:[CameraPreset,string][]=[["perspective","3D"],["facade","Фасад"],["side","Боковой"],["roof","Кровля"]];
 const input=<><input ref={fileRef} type="file" hidden multiple aria-label="Импортировать трёхмерную модель" accept=".glb,.gltf,.fbx,.obj,.mtl,.bin,.ifc,.skp,.blend,.zip,.png,.jpg,.jpeg,.webp,.ktx2" onChange={e=>{const files=Array.from(e.target.files||[]);if(files.length)void upload(files)}}/><input ref={textureRef} type="file" hidden multiple accept="image/*" aria-label="Добавить PBR текстуры" onChange={e=>{void uploadMaps(Array.from(e.target.files||[]))}}/></>;
 const scene=<ArchitecturalScene config={displayedConfig} selected={selected} onSelect={setSelected} imported={imported} onMesh={setSelectedMesh} mode={view} cameraPreset={cameraPreset} environment={view==="studio"?"studio":environment} showGrid={view==="studio"&&grid} maps={maps} onCanvasReady={el=>{canvasRef.current=el}}/>;
 return <div className={"shell "+(view==="home"?"home-shell":"studio-shell")}>
  {input}
  <header className="global-header">
   <div className="global-brand"><div className="brand-mark">F<span>.</span></div><div><div className="brand-name">FORMA <span>B2B</span></div><div className="brand-sub">ARCHITECTURAL TECHNOLOGY</div></div></div>
   <div className="global-separator"/>
   <div className="project-context"><span className="micro-label">PROJECT / 01</span><strong>{view==="studio"?"ПРОИЗВОДСТВЕННЫЙ РЕДАКТОР":"КОНФИГУРАТОР АРХИТЕКТУРЫ"}</strong></div>
   <div className="global-spacer"/>
   <nav className="global-switch" aria-label="Режим приложения">
    <button className={view==="studio"?"active":""} onClick={()=>changeView("studio")}><Package size={14}/> Studio</button>
    <button className={view==="home"?"active":""} onClick={()=>changeView("home")}><Home size={14}/> Home</button>
   </nav>
   <div className="global-separator hide-mobile"/>
   <span className="local-indicator"><i/> LOCAL WORKSPACE</span>
   <button className="header-cta" onClick={view==="studio"?saveComponent:saveVariant}>{view==="studio"?<Save size={15}/>:<Plus size={15}/>}<span>{view==="studio"?"Сохранить в каталог":"Сохранить вариант"}</span></button>
  </header>

  {view==="studio"? <div className="studio-main">
   <div className="cad-rail">
    <button className="rail-item active" title="Сцена" onClick={()=>setSceneOpen(x=>!x)}><Layers3 size={19}/></button>
    <div className="rail-divider"/>
    <button className="rail-item" title="Перспектива" onClick={()=>setCameraPreset("perspective")}><Box size={19}/></button>
    <button className="rail-item" title="Фасад" onClick={()=>setCameraPreset("facade")}><Columns3 size={19}/></button>
    <button className="rail-item" title="Кровля" onClick={()=>setCameraPreset("roof")}><Home size={19}/></button>
    <div className="rail-divider"/>
    <button className={"rail-item "+(grid?"active-muted":"")} title="Переключить сетку" onClick={()=>setGrid(x=>!x)}><Grid3X3 size={19}/></button>
    <button className="rail-item" title="Инспектор" onClick={()=>setInspectorOpen(x=>!x)}><SlidersHorizontal size={19}/></button>
    <div className="rail-grow"/>
    <button className="rail-item" title="Импорт модели" onClick={()=>fileRef.current?.click()}><Upload size={19}/></button>
    <button className="rail-item" title="Экспорт JSON" onClick={exportScene}><Download size={19}/></button>
   </div>
   {sceneOpen&&<aside className="cad-explorer mobile-open">
    <div className="panel-heading"><span>SCENE EXPLORER</span><button title="Скрыть" onClick={()=>setSceneOpen(false)}><PanelLeft size={15}/></button></div>
    <div className="explorer-tabs"><button className="active">Объекты</button><button onClick={()=>setNotice("Библиотека компонентов: используйте нижнюю панель материалов.")}>Библиотека</button></div>
    <div className="scene-search"><Search size={14}/><input placeholder="Найти объект..." aria-label="Поиск в дереве" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="explorer-path"><ChevronDown size={13}/><FolderOpen size={15}/><span>{sourceName||"FORMA HOUSE / 001"}</span><small>01</small></div>
    <div className="scene-layer-list">
     {ZONES.filter(z=>ZONE_NAME[z].toLowerCase().includes(search.toLowerCase())).map((z,i)=><button className={"scene-layer "+(selected===z?"active":"")} key={z} onClick={()=>{setSelected(z);setInspectorTab(z==="facade"?"geometry":"material")}}>
      <span className="tree-line"/><Layers3 size={15}/><span className="layer-name"><b>{String(i+1).padStart(2,"0")}</b> {ZONE_NAME[z]}<small>{getMaterial(config.zoneMaterials[z]).sku}</small></span><span className={"layer-dot "+(selected===z?"on":"")}/>
     </button>)}
    </div>
    <div className="explorer-group-title">СЛОИ ПРОЕКТА <span>4</span></div>
    <div className="layer-simple"><span className="indicator-swatch"/> ARCH_BASE</div>
    <div className="layer-simple"><span className="indicator-swatch pale"/> FACADE_SYSTEM</div>
    <div className="layer-simple"><span className="indicator-swatch sand"/> MATERIAL_LIB</div>
    {imported&&<div className="import-mini"><FileBox size={17}/><div><b>{sourceName}</b><small>{report?.meshCount} объектов · {num(report?.triangleCount||0)} граней</small></div></div>}
    <div className="explorer-bottom"><span className="status-led"/> Модель сохранена локально</div>
   </aside>}
   <div className="cad-center" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)void upload(Array.from(e.dataTransfer.files))}}>
    <div className="cad-command">
     <div className="command-title"><span className="command-kicker">EDIT MODE</span><strong>{projectName}</strong><span className="command-stamp">v 0.3</span></div>
     <div className="cmd-space"/>
     <button className="command-icon" title="Отменить" disabled={!history.length} onClick={undo}><Undo2 size={17}/></button>
     <button className="command-icon" title="Повторить" disabled={!future.length} onClick={redo}><Redo2 size={17}/></button>
     <span className="command-separator"/>
     <button className="command-icon" title="Снимок в PNG" onClick={capture}><Camera size={17}/></button>
     <button className="command-icon" title="Импорт" onClick={()=>fileRef.current?.click()}><Upload size={17}/></button>
     <button className="command-icon" title="Скрыть нижнюю панель" onClick={()=>setTrayOpen(x=>!x)}><PanelBottom size={17}/></button>
    </div>
    <div className="cad-viewport">
     {scene}
     <div className="viewport-corner upper-left"><span className="viewport-caption">01 / LIVE VIEWPORT</span><b>{sourceName||"Architectural envelope"}</b><small>Shaded + PBR · миллиметры в инспекторе</small></div>
     <div className="viewport-corner upper-right">
      <div className="camera-chooser">{cameraButtons.map(([id,label])=><button key={id} className={cameraPreset===id?"active":""} onClick={()=>setCameraPreset(id)}>{label}</button>)}</div>
     </div>
     <div className="axis-hint"><b>Y</b><span>X</span><i>Z</i></div>
     <div className="viewport-footnote"><span className="view-led"/> REAL-TIME 3D <span className="view-sep"/> ORBIT / ZOOM / SELECT</div>
     {busy&&<div className="busy-overlay"><div className="loading-ring"/><b>Подготовка геометрии</b><small>{stage}</small></div>}
    </div>
    {trayOpen&&<div className="cad-tray">
     <div className="tray-header"><b>MATERIAL LIBRARY</b><span>{MATERIALS.length} образцов · PBR слоты</span><button onClick={()=>textureRef.current?.click()}><Upload size={13}/> Загрузить текстуры</button></div>
     <div className="tray-grid">{MATERIALS.map(m=><MaterialCard key={m.id} material={m} compact active={config.zoneMaterials[selected]===m.id} onClick={()=>applyFinish(m.id)}/>)}</div>
    </div>}
    <div className="cad-status">
     <span className="state-text"><i/> WEBGL / THREE.JS</span>
     <span>Объект: {imported?(selectedMesh?imported.getObjectByProperty("uuid",selectedMesh)?.name||"Mesh":"не выбран"):ZONE_NAME[selected]}</span>
     <span className="hide-mobile">X: 0.000　Y: 0.000　Z: 0.000</span>
     <span className="status-right">1 UNIT = 1 M <span>·</span> DEMO GEOMETRY</span>
    </div>
   </div>
   {inspectorOpen&&<aside className="cad-inspector mobile-open">
    <div className="panel-heading"><span>OBJECT PROPERTIES</span><button onClick={()=>setInspectorOpen(false)} title="Скрыть"><PanelRight size={15}/></button></div>
    <div className="selected-object"><span className="obj-icon"><Box size={19}/></span><div><small>SELECTED OBJECT / {selected.toUpperCase()}</small><strong>{imported&&selectedMesh?imported.getObjectByProperty("uuid",selectedMesh)?.name||"Imported mesh":ZONE_NAME[selected]}</strong><span>ARCHITECTURAL SYSTEM</span></div></div>
    <div className="inspector-tabs"><button className={inspectorTab==="geometry"?"active":""} onClick={()=>setInspectorTab("geometry")}>Геометрия</button><button className={inspectorTab==="material"?"active":""} onClick={()=>setInspectorTab("material")}>Материал</button></div>
    {inspectorTab==="geometry"?<div className="inspector-scroll">
     <div className="property-section"><span>ПАРАМЕТРЫ ЗДАНИЯ</span><ChevronDown size={15}/></div>
     <NumericControl label="Ширина здания" value={config.width} onChange={n=>patch("width",n)} disabled={!!imported}/>
     <NumericControl label="Высота стен" value={config.height} onChange={n=>patch("height",n)} disabled={!!imported}/>
     <NumericControl label="Глубина здания" value={config.depth} onChange={n=>patch("depth",n)} disabled={!!imported}/>
     <div className="property-section bordered"><span>ФАСАДНАЯ СИСТЕМА</span><ChevronDown size={15}/></div>
     <NumericControl label="Ширина панели" value={config.panelWidth} min={20} max={1200} onChange={n=>patch("panelWidth",n)} disabled={!!imported}/>
     <NumericControl label="Монтажный шов" value={config.gap} min={1} max={80} onChange={n=>patch("gap",n)} disabled={!!imported}/>
     <div className="property-row"><span>Направление</span><select disabled={!!imported} value={config.orientation} onChange={e=>patch("orientation",e.target.value as Config["orientation"])}><option value="vertical">Вертикальное</option><option value="horizontal">Горизонтальное</option></select></div>
     <div className="property-section bordered"><span>СМЕТА / ПРЕДВАРИТЕЛЬНО</span><ChevronDown size={15}/></div>
     <div className="cad-metrics"><Metric label="Площадь фасада" value={formatSize(stats.net)} unit="м²"/><Metric label="Фрагментов раскладки" value={num(stats.pieces)}/></div>
     <div className="estimate-note">Эскизные значения по переднему фасаду; монтажные отходы и доборные элементы не рассчитаны.</div>
    </div>:<div className="inspector-scroll">
     <div className="property-section"><span>НАЗНАЧЕННЫЙ МАТЕРИАЛ</span><ChevronDown size={15}/></div>
     <div className="selected-finish"><span style={{background:activeMaterial.color}}/><div><b>{activeMaterial.name}</b><small>{activeMaterial.manufacturer}<br/>{activeMaterial.sku}</small></div></div>
     <div className="property-row"><span>Roughness</span><strong>{activeMaterial.roughness.toFixed(2)}</strong></div>
     <div className="property-row"><span>Metallic</span><strong>{activeMaterial.metalness.toFixed(2)}</strong></div>
     <div className="property-section bordered"><span>КАРТЫ PBR</span><ChevronDown size={15}/></div>
     {(["base","normal","roughness"] as const).map(k=><div className="map-slot" key={k}><span className="map-placeholder"><Image size={14}/></span><div><b>{k==="base"?"Base Color":k==="normal"?"Normal":"Roughness"}</b><small>{maps[selected]?.[k]?"Загружена":"Не загружена"}</small></div>{maps[selected]?.[k]&&<Check size={14}/>}</div>)}
     <button className="wide-button" onClick={()=>textureRef.current?.click()}><Upload size={15}/> Импортировать PBR-карты</button>
     <small className="editor-help">Имена файлов с «normal» и «roughness» автоматически заполняют соответствующие слоты.</small>
    </div>}
    <div className="inspector-action">
     <button className="wide-button" onClick={()=>fileRef.current?.click()}><Upload size={15}/> Импорт CAD / BIM</button>
     {imported&&<button className="wide-button subtle" onClick={resetScene}><RotateCcw size={15}/> Открыть демонстрационный дом</button>}
     {report&&<p className="editor-help">{report.meshCount} mesh · исходные размеры: {report.originalSize.map(x=>x.toFixed(2)).join(" × ")} единиц. {report.note}</p>}
     <button className="export-button" onClick={exportScene}><FileJson size={15}/> Экспорт проекта / JSON <ArrowDownToLine size={14}/></button>
    </div>
   </aside>}
  </div> :
  <div className="home-main">
   <div className="home-topline"><span>FORMA HOME / CONFIGURATOR</span><span><i/> ИНТЕРАКТИВНЫЙ ПРОЕКТ</span></div>
   <div className="home-heading"><div><div className="eyebrow">АРХИТЕКТУРА · МАТЕРИАЛЫ · ТЕХНОЛОГИИ</div><h1>Ваш дом. <span>В вашем материале.</span></h1><p>Выбирайте фактуры реальных фасадных систем и оценивайте сочетания на объёмной модели.</p></div><div className="home-heading-actions"><button onClick={saveVariant}><Plus size={15}/> Сохранить вариант</button><button onClick={capture}><Camera size={15}/> Снимок PNG</button></div></div>
   <div className="home-content">
    <main className="home-preview" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)void upload(Array.from(e.dataTransfer.files))}}>
     {scene}
     <div className="home-preview-label"><div className="preview-label-kicker">DESIGN SERIES / 001</div><b>Scandinavian Residence</b><span>10,8 × 8,2 м · демонстрационная модель</span></div>
     <div className="home-view-tabs">{cameraButtons.map(([id,label])=><button key={id} onClick={()=>setCameraPreset(id)} className={cameraPreset===id?"active":""}>{label}</button>)}</div>
     <div className="home-preview-bottom">
      <div className="home-lighting"><Sun size={15}/><select aria-label="Освещение" value={environment} onChange={e=>setEnvironment(e.target.value as EnvironmentMode)}><option value="daylight">Ясный день</option><option value="overcast">Пасмурно</option><option value="evening">Вечерний свет</option></select></div>
      <div className="home-compare"><button className={baseComparison?"active":""} onClick={()=>setBaseComparison(x=>!x)}>{baseComparison?"Исходный вариант":"Сравнить «до»"}</button><span>Drag to rotate · Scroll to zoom</span></div>
     </div>
     {busy&&<div className="busy-overlay"><div className="loading-ring"/><b>Загружаем 3D</b><small>{stage}</small></div>}
    </main>
    <aside className="home-material-panel">
     <div className="home-panel-index">01 / МАТЕРИАЛЫ ЗДАНИЯ</div>
     <h2>Подберите отделку</h2>
     <p className="home-panel-description">Выберите конструкцию, затем материал. Изменения сразу отображаются на доме.</p>
     <div className="home-zone-picker">{ZONES.map(z=><button key={z} className={selected===z?"active":""} onClick={()=>setSelected(z)}><span style={{backgroundColor:getMaterial(config.zoneMaterials[z]).color}}/>{ZONE_NAME[z]}<ChevronRight size={15}/></button>)}</div>
     <div className="home-palette-header"><span>КОЛЛЕКЦИЯ / {chip(selected)}</span><span>{MATERIALS.length} вариантов</span></div>
     <div className="home-palette">{MATERIALS.map(m=><MaterialCard key={m.id} material={m} active={config.zoneMaterials[selected]===m.id} onClick={()=>applyFinish(m.id)}/>)}</div>
     <div className="home-spec"><div><span>Выбранный материал</span><b>{activeMaterial.name}</b></div><div><span>Артикул</span><b>{activeMaterial.sku}</b></div><div><span>Ориентир по материалу</span><b>{currency(activeMaterial.price)} ₽/м²</b></div></div>
     <button className="home-primary" onClick={saveVariant}><Plus size={15}/> Сохранить концепцию <ArrowRight size={16}/></button>
     <p className="home-footnote">Каталог демонстрационный. Стоимость приблизительная, не является офертой.</p>
    </aside>
   </div>
   <div className="home-bottom">
    <div className="home-bottom-heading"><span>02 / СОХРАНЁННЫЕ КОНЦЕПЦИИ</span><button onClick={()=>fileRef.current?.click()}><Upload size={15}/> Загрузить свой проект</button></div>
    <div className="variant-list">
     <button className="variant-default" onClick={()=>{setConfig(copyConfig(INITIAL));setBaseComparison(false)}}><span className="variant-color-sample" style={{background:"#ab886b"}}/><div><b>Исходная концепция</b><small>FORMA / STUDIO HOUSE</small></div><ArrowRight size={16}/></button>
     {variants.map(v=><div className="variant-card" key={v.id}><button onClick={()=>{setConfig(copyConfig(v.config));setBaseComparison(false);setNotice("Концепция открыта.")}}><span className="variant-color-sample" style={{background:getMaterial(v.config.zoneMaterials.facade).color}}/><span><b>{v.name}</b><small>{getMaterial(v.config.zoneMaterials.facade).sku}</small></span></button><button className="variant-delete" title="Удалить" onClick={()=>setVariants(x=>x.filter(t=>t.id!==v.id))}><X size={14}/></button></div>)}
     {!variants.length&&<div className="variant-empty">Ваши варианты отделки появятся здесь после сохранения.</div>}
    </div>
    {catalog.length>0&&<div className="catalog-row"><span>МАТЕРИАЛЫ ИЗ STUDIO</span>{catalog.map(x=><button key={x.id} onClick={()=>{setConfig(copyConfig(x.config));setBaseComparison(false);setNotice("Конфигурация Studio применена.")}}>{x.name} <ArrowRight size={13}/></button>)}</div>}
   </div>
  </div>}
  {notice&&<div role="status" className="notice"><Info size={16}/><span>{notice}</span><button title="Закрыть" onClick={()=>setNotice("")}><X size={14}/></button></div>}
 </div>;
}
