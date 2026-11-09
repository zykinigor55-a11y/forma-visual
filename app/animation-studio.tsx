'use client';

import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {ArrowDownToLine,Check,CheckCircle2,Clapperboard,Copy,Film,Info,SlidersHorizontal} from 'lucide-react';

type Selection={camera:string;lens:string;movement:string;filter:string;duration:number};
type IconKind='camera'|'lens'|'movement'|'filter';

const cameras=[
 {id:'alexa35',name:'ALEXA 35',brand:'ARRI',tag:'SUPER 35',note:'Точная работа со светом и полутонами',rig:0},
 {id:'mini-lf',name:'ALEXA Mini LF',brand:'ARRI',tag:'LARGE FORMAT',note:'Мягкая крупноформатная перспектива',rig:1},
 {id:'venice2',name:'VENICE 2',brand:'SONY',tag:'8.6K FULL FRAME',note:'Кинематографичный объём пространства',rig:2},
 {id:'raptorx',name:'V-RAPTOR [X]',brand:'RED',tag:'8K VISTA VISION',note:'Динамичное детальное изображение',rig:3},
 {id:'c400',name:'EOS C400',brand:'CANON',tag:'6K FULL FRAME',note:'Естественные фактуры и цвет',rig:4},
 {id:'ursa',name:'URSA Cine 12K LF',brand:'BLACKMAGIC',tag:'LARGE FORMAT',note:'Большой формат и высокое разрешение',rig:5}
] as const;

const lenses=[
 {id:'18',name:'18 mm',tag:'ULTRA WIDE',note:'Широкий захват архитектуры',zoom:1,angle:'91,4°'},
 {id:'25',name:'25 mm',tag:'WIDE',note:'Дом вместе с окружением',zoom:1.2,angle:'73°'},
 {id:'35',name:'35 mm',tag:'NATURAL WIDE',note:'Спокойный архитектурный план',zoom:1.42,angle:'55,5°'},
 {id:'47',name:'47 mm',tag:'NORMAL',note:'Нейтральная перспектива',zoom:1.66,angle:'42,6°'},
 {id:'75',name:'75 mm',tag:'PORTRAIT',note:'Акцент на композиции фасада',zoom:2.1,angle:'27,5°'},
 {id:'95',name:'95 mm',tag:'TELE',note:'Сжатый план и детали',zoom:2.45,angle:'21,6°'}
] as const;

const movements=[
 {id:'orbit',name:'Orbit',ru:'Облёт по дуге',note:'Плавная дуга вокруг фасада; камера удерживает дом в центре.',path:'M 142 277 C 158 171 315 132 475 228',code:'ORBIT / 120°'},
 {id:'dolly-in',name:'Dolly In',ru:'Наезд',note:'Поступательное приближение к дому без цифрового зума.',path:'M 107 336 L 282 271',code:'PUSH IN'},
 {id:'dolly-out',name:'Dolly Out',ru:'Отъезд',note:'Отъезд с раскрытием окружения и ландшафта.',path:'M 282 271 L 107 336',code:'PULL OUT'},
 {id:'truck',name:'Truck',ru:'Проезд вбок',note:'Параллельный проезд вдоль фасада с постоянной высотой.',path:'M 115 310 L 520 310',code:'TRUCK RIGHT'},
 {id:'crane',name:'Crane Up',ru:'Подъём',note:'Вертикальный подъём, раскрывающий кровлю и участок.',path:'M 468 330 L 468 94',code:'CRANE UP'},
 {id:'flyby',name:'Fly-by',ru:'Диагональный пролёт',note:'Мягкий диагональный проход перед фасадом.',path:'M 85 329 C 238 326 387 231 549 129',code:'DIAGONAL FLY-BY'}
] as const;

const filters=[
 {id:'clean',name:'Clean',ru:'Нейтральный',note:'Чистая оптика, естественный контраст.',style:'none'},
 {id:'promist',name:'Black Pro-Mist 1/8',ru:'Мягкие блики',note:'Лёгкое свечение вокруг ярких источников.',style:'pro-mist'},
 {id:'glimmer',name:'Glimmerglass 1/4',ru:'Мягкий свет',note:'Деликатное смягчение бликов и микроконтраста.',style:'glimmer'},
 {id:'polar',name:'CPL',ru:'Поляризационный',note:'Сдержаннее отражения и насыщеннее небо.',style:'polar'},
 {id:'nd',name:'ND 0.9',ru:'Нейтральная плотность',note:'Оптическое ослабление света на три ступени.',style:'nd'},
 {id:'streak',name:'Blue Streak',ru:'Анаморфный блик',note:'Тонкие горизонтальные световые полосы.',style:'streak'}
] as const;

const defaults:Selection={camera:'alexa35',lens:'35',movement:'orbit',filter:'clean',duration:8};
const find=<T extends {id:string}>(arr:readonly T[],id:string):T=>arr.find(v=>v.id===id)||arr[0];

function TechnicalIcon({kind,index,id}:{kind:IconKind;index:number;id:string}){
 const base={width:112,height:65,viewBox:'0 0 112 65',fill:'none',xmlns:'http://www.w3.org/2000/svg'};
 if(kind==='camera'){
  const w=[44,39,42,35,37,46][index],x=(100-w)/2;
  return <svg {...base} aria-hidden="true">
   <g stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
    <path d={'M '+(x+3)+' 17 h '+(w-3)+' v 29 h -'+(w-3)+' z'} fill="currentColor" fillOpacity=".07"/>
    <path d={'M '+(x+7)+' 13 v 4 h '+(w-14)+' v -4 z'}/>
    <rect x={x+8} y="21" width={w-17} height="20" rx="2" strokeOpacity=".6"/>
    <path d={'M '+(x+w)+' 25 h 9 v 12 h -9'} fill="currentColor" fillOpacity=".12"/>
    <ellipse cx={x+w+11} cy="31" rx="5" ry="9"/><ellipse cx={x+w+11} cy="31" rx="2.7" ry="6" strokeOpacity=".6"/>
    <path d={'M '+(x+5)+' 46 v 6 h '+(w-4)+' M '+(x+8)+' 52 h '+(w-11)} strokeOpacity=".7"/>
    <circle cx={x+13} cy="24" r="1.5" fill="currentColor"/>
    {index%2===0?<path d={'M '+(x+9)+' 17 v -7 h 20 v 7 M '+(x+12)+' 10 V 8 h 14 v 2'}/>:<path d={'M '+(x+2)+' 18 v -8 h 25 v 8'}/>}
    {index===2||index===4?<path d={'M '+(x-12)+' 23 h 11 v 18 h -11 z M '+(x-9)+' 27 h 5'}/>:<path d={'M '+(x-7)+' 23 h 6 v 18 h -6 M '+(x-6)+' 28 v 8'}/>}
    {index===3?<path d={'M '+(x+11)+' 19 l 8 5 -8 5 z'}/>:null}
    {index===5?<path d={'M '+(x+12)+' 35 h 15 M '+(x+12)+' 38 h 15'}/>:null}
   </g>
   <text x="7" y="59" fill="currentColor" opacity=".5" fontSize="6" letterSpacing="1.1">CINE / 0{index+1}</text>
  </svg>;
 }
 if(kind==='lens'){
  const lengths=[52,46,42,38,34,30],len=lengths[index],x=56-len/2;
  return <svg {...base} aria-hidden="true">
   <g stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round">
    <path d={'M '+x+' 17 L '+(x+len)+' 20 V 46 L '+x+' 49 Z'} fill="currentColor" fillOpacity=".055"/>
    <ellipse cx={x} cy="33" rx="9" ry="16" fill="currentColor" fillOpacity=".09"/>
    <ellipse cx={x} cy="33" rx="6" ry="12"/><ellipse cx={x} cy="33" rx="3" ry="7" strokeOpacity=".4"/>
    <path d={'M '+(x+12)+' 18 v 30 M '+(x+16)+' 19 v 29 M '+(x+22)+' 19 v 28 M '+(x+25)+' 20 v 26'} strokeOpacity=".7"/>
    <path d={'M '+(x+len-6)+' 20 v 26 M '+(x+len-3)+' 20 v 26'} strokeOpacity=".5"/>
    <path d={'M '+(x+len)+' 21 l 8 2 v 20 l -8 2 Z'}/>
    <path d={'M '+(x+9)+' 15 h 20 M '+(x+9)+' 51 h 20'} strokeOpacity=".25"/>
   </g>
   <text x="8" y="60" fill="currentColor" opacity=".55" fontSize="7" letterSpacing="1.4">T1.8</text>
   <text x="89" y="60" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="600">{id}</text>
  </svg>;
 }
 if(kind==='movement'){
  const tracks=['M16 43 Q56 1 94 40','M16 49 L94 21','M94 21 L16 49','M12 49 L102 49','M94 51 L94 8','M12 54 Q52 52 101 13'];
  return <svg {...base} aria-hidden="true">
   <g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
    <path d="M42 32 L56 22 L73 31 L60 42 Z M42 32 V45 L59 54 V42 M73 31 V44 L59 54" strokeOpacity=".42"/>
    <path d="M49 47 V37 L56 40 V51 M63 37 L69 34 V43 L63 46 Z" strokeOpacity=".42"/>
    <path d={tracks[index]} strokeWidth="1.8" strokeDasharray="3.5 3"/>
    {index===4?<path d="M89 14 L94 8 L99 14"/>:<path d={index===2?'M21 44 L16 49 L24 50':index===0?'M87 34 L94 40 L95 32':index===5?'M93 13 L101 13 L99 21':index===3?'M95 43 L102 49 L95 55':'M86 20 L94 21 L90 28'}/>}
    <circle cx={index===2?94:16} cy={index===2?21:index===4?50:index===5?54:49} r="3" fill="currentColor"/>
   </g>
   <text x="7" y="63" fill="currentColor" opacity=".55" fontSize="6.5" letterSpacing="1">PATH / 0{index+1}</text>
  </svg>;
 }
 return <svg {...base} aria-hidden="true">
  <g stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round">
   <circle cx="56" cy="30" r="20" fill="currentColor" fillOpacity=".05"/>
   <circle cx="56" cy="30" r="16"/><circle cx="56" cy="30" r="10" strokeOpacity=".45"/>
   {index===0?<circle cx="56" cy="30" r="3"/>:null}
   {index===1?<><circle cx="48" cy="22" r="2" fill="currentColor" fillOpacity=".5"/><path d="M30 30 L82 30 M56 4 V56" strokeOpacity=".3"/></>:null}
   {index===2?<><path d="M40 14 L72 46 M40 46 L72 14" strokeOpacity=".45"/><circle cx="57" cy="29" r="3"/></>:null}
   {index===3?<path d="M43 22 Q56 36 70 19 M43 40 Q55 24 69 41" strokeOpacity=".7"/>:null}
   {index===4?<><path d="M41 12 L72 43 M35 19 L65 50" strokeOpacity=".35"/><path d="M56 15 V45" strokeOpacity=".6"/></>:null}
   {index===5?<><path d="M9 30 H103 M17 25 H95 M27 35 H88" stroke="#77a2bc" strokeWidth="1.5" opacity=".95"/></>:null}
  </g>
  <text x="8" y="62" fill="currentColor" opacity=".55" fontSize="6.5" letterSpacing="1">OPTICAL / 0{index+1}</text>
 </svg>;
}

function Group({title,eyebrow,children}:{title:string;eyebrow:string;children:ReactNode}){
 return <section className="cine-group"><div className="cine-group-title"><div><span>{eyebrow}</span><h3>{title}</h3></div><span>06</span></div>{children}</section>;
}

function RouteStage({path,duration,angle,movement}:{path:string;duration:number;angle:string;movement:string}){
 return <div className="cine-stage">
  <div className="cine-stage-heading"><span><span className="cine-live"/>CINEMATIC PRE-VIS</span><span>ISO / CAMERA PATH</span></div>
  <svg viewBox="0 0 640 390" role="img" aria-label={'Условная объёмная схема дома и анимированная траектория камеры: '+movement}>
   <defs>
    <pattern id="cine-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#b2c4be" strokeOpacity=".13" strokeWidth=".65"/></pattern>
    <linearGradient id="cine-roof" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#8b9c99"/><stop offset="1" stopColor="#445753"/></linearGradient>
    <linearGradient id="cine-wall" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#d5d9ce"/><stop offset="1" stopColor="#8e9c92"/></linearGradient>
    <marker id="cine-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6" stroke="#d2bd86" fill="none" strokeWidth="1.25"/></marker>
   </defs>
   <rect x="0" y="0" width="640" height="390" fill="url(#cine-grid)"/>
   <path d="M38 330 L321 194 L611 327 L323 377 Z" fill="#b9d0c0" fillOpacity=".035" stroke="#81958b" strokeOpacity=".2" strokeDasharray="4 7"/>
   <path d="M85 311 L315 199 L546 306" stroke="#8fa9a1" strokeOpacity=".12" fill="none"/>
   <ellipse cx="324" cy="326" rx="168" ry="32" fill="#000" fillOpacity=".28"/>
   <g strokeLinejoin="round">
    <path d="M201 220 L320 161 L466 225 L347 288 Z" fill="#253631" stroke="#5d7167" strokeWidth="1"/>
    <path d="M201 219 L201 293 L347 356 L347 287 Z" fill="url(#cine-wall)" stroke="#6d7c71" strokeWidth="1.1"/>
    <path d="M347 287 L466 225 L466 299 L347 356 Z" fill="#6d857a" stroke="#50665c" strokeWidth="1.1"/>
    <path d="M184 215 L318 144 L485 222 L348 292 Z" fill="url(#cine-roof)" stroke="#a8b7a9" strokeWidth="1.6"/>
    <path d="M183 217 L349 294 L349 300 L183 224 Z" fill="#34453d"/>
    <path d="M349 294 L484 223 L484 230 L349 300 Z" fill="#273b35"/>
    <path d="M224 257 L264 274 L264 318 L224 301 Z M286 283 L329 302 L329 344 L286 325 Z" fill="#172a2c" stroke="#d3d9cb" strokeWidth="2"/>
    <path d="M244 265 L244 311 M306 292 L306 334" stroke="#aac3bc" strokeOpacity=".75"/>
    <path d="M372 287 L410 266 L410 316 L372 336 Z" fill="#20363a" stroke="#b9c6bd" strokeWidth="2"/>
    <path d="M389 278 L389 327" stroke="#a6b9b4" strokeWidth="1.5"/>
    <path d="M192 300 L348 369 L473 307" stroke="#d1b985" strokeOpacity=".65" strokeWidth="1.3" strokeDasharray="2 5" fill="none"/>
   </g>
   <g opacity=".55" stroke="#91a69d" strokeWidth="1" strokeDasharray="3 6"><path d="M35 345 H605 M320 40 V370"/></g>
   <path d={path} stroke="#1e2926" strokeWidth="8" strokeOpacity=".8" strokeLinecap="round" fill="none"/>
   <path d={path} stroke="#e1c688" strokeWidth="2.1" strokeDasharray="6 6" fill="none" markerEnd="url(#cine-arrow)"/>
   <g>
    <path d="M -4 0 L 60 -22 L 60 22 Z" fill="#c1d6d1" fillOpacity=".09" stroke="#e6d7af" strokeOpacity=".5" strokeWidth=".8" strokeDasharray="3 3"/>
    <rect x="-11" y="-8" width="20" height="16" rx="2.2" fill="#e2c990" stroke="#0e1917" strokeWidth="1.3"/>
    <rect x="-16" y="-5" width="6" height="10" rx="1" fill="#b59b6b"/>
    <circle cx="12" cy="0" r="5" fill="#e0cd9e" stroke="#0e1917" strokeWidth="1.2"/>
    <path d="M-4 -8 L0 -14 L7 -14 L9 -8" stroke="#dcc593" strokeWidth="2" fill="none"/>
    <animateMotion key={path} dur={duration+'s'} path={path} repeatCount="indefinite" rotate="auto"/>
   </g>
   <g fontSize="10" fill="#b9cbc1" letterSpacing="1.3"><text x="38" y="42">SCENE / 01</text><text x="600" y="42" textAnchor="end">FOV {angle}</text><text x="38" y="362">SCALE / DIAGRAM</text><text x="600" y="362" textAnchor="end">PATH LOCKED</text></g>
  </svg>
  <div className="cine-stage-bottom"><span>Траектория камеры · {movement}</span><span>{duration}s <span className="cine-bottom-sep">/</span> 24 FPS</span></div>
 </div>;
}

function createBrief(s:Selection){
 const cam=find(cameras,s.camera),lens=find(lenses,s.lens),move=find(movements,s.movement),filter=find(filters,s.filter);
 return 'АРХИТЕКТУРНАЯ КИНОАНИМАЦИЯ — ТЕХНИЧЕСКОЕ ЗАДАНИЕ\n\n'+
  'Кинокамера (визуальный референс): '+cam.brand+' '+cam.name+' ('+cam.tag+').\n'+
  'Кинообъектив (визуальный референс): ARRI Signature Prime '+lens.name+' T1.8.\n'+
  'Движение: '+move.name+' — '+move.note+'\n'+
  'Оптический фильтр (референс): '+filter.name+' — '+filter.note+'\n'+
  'Длительность: '+s.duration+' секунд. Частота: 24 кадра/с. Соотношение сторон: 16:9.\n\n'+
  'Use the uploaded architecture image as the exact visual reference. Preserve the building geometry, roof, fenestration, proportions, facade materials, landscaping layout and visual identity without changes. '+move.note+
  ' Physically plausible camera movement, continuous smooth trajectory, natural motion blur, stable exposure, cinematic color and realistic parallax. No warping or morphing of the house, no invented windows or elements, no texture swimming. Natural subtle movement of trees, leaves, grass and clouds; if present, physically realistic water surface. Controlled lighting transitions, no artificial camera shakes. '+filter.note+
  ' Keep the original source image as a reference for architectural consistency. Output a single continuous shot with no cuts.\n\n'+
  'Важно: камера, объектив и фильтр заданы как художественные референсы. Это ТЗ для внешней видеогенерации, а не запись с настоящего оборудования.';
}

export default function AnimationStudio({sourceUrl}:{sourceUrl:string}){
 const [selection,setSelection]=useState<Selection>(defaults),[message,setMessage]=useState(''),[hydrated,setHydrated]=useState(false);
 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('forma-cinema-v1')||'null') as Partial<Selection>|null;if(!s)return;const secs=typeof s.duration==='number'&&Number.isFinite(s.duration)?s.duration:8;setSelection({
  camera:find(cameras,String(s.camera||'')).id,lens:find(lenses,String(s.lens||'')).id,
  movement:find(movements,String(s.movement||'')).id,filter:find(filters,String(s.filter||'')).id,
  duration:Math.max(3,Math.min(20,Math.round(secs)))
 });}catch{}finally{setHydrated(true);}},[]);
 useEffect(()=>{if(!hydrated)return;try{localStorage.setItem('forma-cinema-v1',JSON.stringify(selection));}catch{}},[hydrated,selection]);
 useEffect(()=>{if(!message)return;const t=setTimeout(()=>setMessage(''),3300);return()=>clearTimeout(t);},[message]);
 const cam=find(cameras,selection.camera),lens=find(lenses,selection.lens),move=find(movements,selection.movement),filter=find(filters,selection.filter);
 const brief=useMemo(()=>createBrief(selection),[selection]);
 const groups=[
  {key:'camera',eyebrow:'01 / CAMERA BODIES',title:'Кинокамера',entries:cameras},
  {key:'lens',eyebrow:'02 / CINEMA OPTICS',title:'Кинообъектив',entries:lenses},
  {key:'movement',eyebrow:'03 / CAMERA MOVEMENT',title:'Движение камеры',entries:movements},
  {key:'filter',eyebrow:'04 / OPTICAL FILTERS',title:'Фильтр',entries:filters}
 ] as const;
 function select(key:IconKind,id:string){setSelection(s=>({...s,[key]:id}));}
 async function copy(){try{await navigator.clipboard.writeText(brief);setMessage('Техническое задание скопировано.');}catch{setMessage('Не удалось скопировать. Используйте скачивание ТЗ.');}}
 function download(){const url=URL.createObjectURL(new Blob([brief],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Forma-Cinema-Animation-TZ.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Техническое задание скачано.');}
 return <>
  <aside className="cine-controls">
   <div className="cine-panel-header"><div><span className="cine-overline">FILM PRODUCTION / 01</span><strong>Анимация</strong></div><Clapperboard size={19} strokeWidth={1.4}/></div>
   <div className="cine-controls-scroll">
    <div className="cine-intro"><span className="cine-intro-dot"/>Кинематографический кадр. Настоящее оборудование как референс, точная траектория и сдержанная оптика.</div>
    {groups.map(group=><Group key={group.key} title={group.title} eyebrow={group.eyebrow}>
     <div className="cine-card-grid">{group.entries.map((item,i)=><button key={item.id} type="button"
      className={'cine-choice '+(selection[group.key]===item.id?'is-selected':'')}
      aria-pressed={selection[group.key]===item.id}
      title={item.note}
      onClick={()=>select(group.key,item.id)}>
      <span className="cine-choice-icon"><TechnicalIcon kind={group.key} index={i} id={item.id}/></span>
      <span className="cine-choice-info"><strong>{group.key==='camera'?('brand' in item?item.brand+' · ':'')+item.name:item.name}</strong><small>{'ru' in item?item.ru:'tag' in item?item.tag:item.note}</small></span>
      {selection[group.key]===item.id&&<span className="cine-choice-check"><Check size={11}/></span>}
     </button>)}</div>
    </Group>)}
   </div>
   <div className="cine-mobile-actions"><button onClick={copy}><Copy size={14}/>Скопировать ТЗ</button><button onClick={download}><ArrowDownToLine size={14}/>Скачать ТЗ</button></div>
  </aside>
  <section className="cine-center" aria-label="Предпросмотр анимации">
   <div className="cine-main-heading"><div><span className="cine-overline">CAMERA MOTION DESIGN</span><h2>Режиссура кадра</h2></div><span className="cine-production-tag"><Film size={13}/> PRE-VIS / 24 FPS</span></div>
   <div className="cine-viewport-scroll">
    <RouteStage path={move.path} duration={selection.duration} angle={lens.angle} movement={move.ru}/>
    <div className="cine-frame-caption"><div><span>ОПТИЧЕСКИЙ ПРЕДПРОСМОТР</span><strong>{cam.brand} {cam.name} <span>·</span> {lens.name}</strong></div><span className="cine-caption-filter">{filter.name}</span></div>
    <div className={'cine-image-preview cine-filter-'+filter.id}>
     <img src={sourceUrl} alt="Условное кадрирование исходного изображения дома" style={{transform:'scale('+lens.zoom+')'}}/>
     <div className="cine-frame-lines"><span/><span/><span/><span/></div>
     <span className="cine-frame-top">FRAME 001 <span>●</span> REC SIMULATION</span>
     <span className="cine-frame-bottom">ARRI SIGNATURE PRIME / {lens.name} <span>16:9</span></span>
    </div>
    <div className="cine-disclaimer"><Info size={15}/><span>Движение показано на условной схеме дома, а объектив и фильтр — приближённо на исходном кадре. Это не 3D-реконструкция и не готовый видеоролик.</span></div>
   </div>
  </section>
  <aside className="cine-inspector">
   <div className="cine-inspector-heading"><SlidersHorizontal size={16}/> Параметры кадра</div>
   <div className="cine-spec-list">
    <div><span>CAMERA</span><strong>{cam.brand} {cam.name}</strong><small>{cam.tag}</small></div>
    <div><span>LENS</span><strong>Signature Prime {lens.name}</strong><small>ARRI · T1.8 · FOV {lens.angle} (LF)</small></div>
    <div><span>CAMERA MOVE</span><strong>{move.name}</strong><small>{move.ru}</small></div>
    <div><span>OPTICAL LOOK</span><strong>{filter.name}</strong><small>{filter.ru}</small></div>
   </div>
   <div className="cine-timeline-settings">
    <label htmlFor="cine-duration"><span>ДЛИТЕЛЬНОСТЬ</span><strong>{selection.duration} сек.</strong></label>
    <input id="cine-duration" type="range" min="3" max="20" step="1" value={selection.duration} onChange={e=>setSelection(s=>({...s,duration:Number(e.target.value)}))}/>
    <div className="cine-duration-ends"><span>03s</span><span>20s</span></div>
   </div>
   <div className="cine-project-note"><CheckCircle2 size={15}/><div><strong>Геометрию сохраняем</strong><span>В инструкции зафиксированы форма дома, окна, кровля, материалы и живое окружение.</span></div></div>
   <div className="cine-inspector-bottom">
    <button className="cine-copy" onClick={copy}><Copy size={15}/> Скопировать ТЗ</button>
    <button className="cine-download" onClick={download}><ArrowDownToLine size={15}/> Скачать ТЗ .txt</button>
    <p>Параметры выбора сохраняются в этом браузере. Для создания видео потребуется подключить отдельный генератор.</p>
   </div>
  </aside>
  {message&&<div role="status" className="cine-toast"><CheckCircle2 size={15}/>{message}</div>}
 </>;
}
