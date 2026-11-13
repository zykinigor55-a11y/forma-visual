import React,{Suspense,useEffect,useMemo,useRef} from "react";
import {Canvas,ThreeEvent,useThree} from "@react-three/fiber";
import {ContactShadows,Grid,OrbitControls,Html} from "@react-three/drei";
import * as THREE from "three";
import {Config,Zone,Opening,frontOpenings,panelParts,subtractOpenings,getMaterial} from "./model";

export type CameraPreset="perspective"|"facade"|"side"|"roof";
export type EnvironmentMode="studio"|"daylight"|"overcast"|"evening";
export type MapSet=Partial<Record<Zone,{base?:THREE.Texture;normal?:THREE.Texture;roughness?:THREE.Texture}>>;

type Props={
 config:Config;
 selected:Zone;
 onSelect:(z:Zone)=>void;
 imported:THREE.Group|null;
 onMesh:(id:string)=>void;
 mode:"studio"|"home";
 cameraPreset:CameraPreset;
 environment:EnvironmentMode;
 showGrid:boolean;
 maps?:MapSet;
 onCanvasReady?:(canvas:HTMLCanvasElement)=>void;
};

function CameraController({preset,width,depth}:{preset:CameraPreset;width:number;depth:number}){
 const {camera,controls,size}=useThree();
 useEffect(()=>{
  const aspect=size.width/Math.max(1,size.height);
  const narrowFactor=aspect<1.2?Math.min(1.85,1.25/Math.max(.5,aspect)):1;
  const distance=Math.max(width,depth)*1.65*narrowFactor;
  const positions:Record<CameraPreset,[number,number,number]>={
   perspective:[distance*.82,distance*.54,distance*.98],
   facade:[0,distance*.32,distance*1.3],
   side:[distance*1.42,distance*.36,0],
   roof:[distance*.68,distance*1.2,distance*.72]
  };
  camera.position.set(...positions[preset]);
  const orbit=controls as {target?:THREE.Vector3;update?:()=>void}|undefined;
  orbit?.target?.set(0,2.05,0);
  orbit?.update?.();
  camera.updateProjectionMatrix();
 },[preset,width,depth,camera,controls,size.width,size.height]);
 return null;
}

type FinishMap=Record<Zone,THREE.MeshStandardMaterial>;
function Building({config,mats,selected,onSelect,mode}:{config:Config;mats:FinishMap;selected:Zone;onSelect:(z:Zone)=>void;mode:Props["mode"]}){
 const {width:w,height:h,depth:d,panelWidth:pw,gap,orientation}=config;
 const elevation=.52,roofRise=Math.max(1.4,w*.165);
 const windows=frontOpenings(w,h);
 const sideHole:Opening={x0:-d*.27,x1:-d*.27+1.7,y0:h*.28,y1:h*.77};
 const wall=new THREE.MeshStandardMaterial({color:"#c5c5c1",roughness:.88});
 const coreFront=useMemo(()=>subtractOpenings({x0:-w/2,x1:w/2,y0:0,y1:h},windows),[w,h]);
 const coreSide=useMemo(()=>subtractOpenings({x0:-d/2,x1:d/2,y0:0,y1:h},[sideHole]),[d,h]);
 const frontPanels=useMemo(()=>panelParts(w,h,pw,gap,orientation,windows),[w,h,pw,gap,orientation]);
 const sidePanels=useMemo(()=>panelParts(d,h,pw,gap,orientation,[sideHole]),[d,h,pw,gap,orientation]);
 useEffect(()=>()=>wall.dispose(),[wall]);
 const trigger=(e:ThreeEvent<MouseEvent>,zone:Zone)=>{e.stopPropagation();onSelect(zone)};
 const tile=(r:Opening,index:number,side=false)=>(
  <mesh key={(side?"side-":"front-")+index}
   position={side?[w/2+.14,elevation+(r.y0+r.y1)/2,(r.x0+r.x1)/2]:[(r.x0+r.x1)/2,elevation+(r.y0+r.y1)/2,d/2+.14]}
   castShadow receiveShadow material={mats.facade} onClick={e=>trigger(e,"facade")}>
   <boxGeometry args={side?[.045,r.y1-r.y0,r.x1-r.x0]:[r.x1-r.x0,r.y1-r.y0,.045]}/>
  </mesh>
 );
 const frame=(x:number,y:number,z:number,sw:number,sh:number,rotationY:number,key:string,kind:"window"|"door"="window")=>(
 <group key={key} position={[x,elevation+y,z]} rotation={[0,rotationY,0]} onClick={e=>trigger(e,"frames")}>
  <mesh material={mats.frames} castShadow><boxGeometry args={[sw,sh,.125]}/></mesh>
  <mesh position={[0,0,.067]}><boxGeometry args={[Math.max(.1,sw-.145),Math.max(.1,sh-.145),.014]}/>
   <meshPhysicalMaterial color={kind==="door"?"#374147":"#586f7b"} metalness={.22} roughness={.1} transparent opacity={.94} clearcoat={.92} clearcoatRoughness={.15}/>
  </mesh>
  {kind==="window"&&<><mesh position={[0,0,.086]} material={mats.frames}><boxGeometry args={[.042,sh-.13,.03]}/></mesh>
   <mesh position={[0,0,.087]} material={mats.frames}><boxGeometry args={[sw-.13,.033,.025]}/></mesh>
  </>}
  {kind==="door"&&<mesh position={[sw*.32,0,.11]}><boxGeometry args={[.022,.17,.025]}/><meshStandardMaterial color="#b9b8b2" metalness={.6} roughness={.35}/></mesh>}
 </group>);
 const half=w/2+.46,roofLen=Math.hypot(half,roofRise),roofAngle=Math.atan2(roofRise,half);
 const edgeColor=new THREE.MeshStandardMaterial({color:"#3a4247",roughness:.62,metalness:.12});
 useEffect(()=>()=>edgeColor.dispose(),[edgeColor]);
 const gable=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,roofRise*(w/2)/half);s.closePath();return s},[w,roofRise,half]);
 const slab=(r:Opening,i:number,side=false)=>{
  if(side) return <mesh key={"side-wall"+i} position={[w/2,elevation+(r.y0+r.y1)/2,(r.x0+r.x1)/2]} material={wall}>
   <boxGeometry args={[.24,r.y1-r.y0,r.x1-r.x0]}/></mesh>;
  return <mesh key={"front-wall"+i} position={[(r.x0+r.x1)/2,elevation+(r.y0+r.y1)/2,d/2]} material={wall}>
   <boxGeometry args={[r.x1-r.x0,r.y1-r.y0,.2]}/></mesh>;
 };
 return <group>
  <group>
   <mesh position={[0,elevation/2,0]} receiveShadow castShadow material={mats.plinth} onClick={e=>trigger(e,"plinth")}><boxGeometry args={[w+.12,elevation,d+.12]}/></mesh>
   <mesh position={[0,elevation+h/2,-d/2]} castShadow receiveShadow material={wall}><boxGeometry args={[w,h,.25]}/></mesh>
   <mesh position={[-w/2,elevation+h/2,0]} castShadow receiveShadow material={wall}><boxGeometry args={[.25,h,d]}/></mesh>
   {coreFront.map((p,i)=>slab(p,i))}
   {coreSide.map((p,i)=>slab(p,i,true))}
   {frontPanels.map((p,i)=>tile(p,i))}
   {sidePanels.map((p,i)=>tile(p,i,true))}
   {windows.map((p,i)=>frame((p.x0+p.x1)/2,(p.y0+p.y1)/2,d/2+.12,p.x1-p.x0,p.y1-p.y0,0,p.key,p.kind))}
   {frame(w/2+.075,(sideHole.y0+sideHole.y1)/2,(sideHole.x0+sideHole.x1)/2,sideHole.x1-sideHole.x0,sideHole.y1-sideHole.y0,Math.PI/2,"side-window")}
   {[-1,1].map(side=><group key={"roof"+side}>
    <mesh position={[side*half/2,elevation+h+roofRise/2,0]} rotation={[0,0,side===-1?roofAngle:-roofAngle]} castShadow receiveShadow material={mats.roof} onClick={e=>trigger(e,"roof")}>
     <boxGeometry args={[roofLen,.11,d+1.1]}/>
    </mesh>
    {Array.from({length:Math.max(3,Math.floor(d/.92))},(_,i)=>(
     <mesh key={i} position={[side*(half/2+.085*Math.sin(roofAngle)),elevation+h+roofRise/2+.085*Math.cos(roofAngle),-d/2-.4+i*.92]} rotation={[0,0,side===-1?roofAngle:-roofAngle]} material={edgeColor}>
      <boxGeometry args={[roofLen,.018,.018]}/>
     </mesh>
    ))}
    <mesh position={[side*half,elevation+h-.08,0]} material={edgeColor}><boxGeometry args={[.06,.18,d+1.13]}/></mesh>
   </group>)}
   {[-1,1].map(side=><mesh key={"gable"+side} position={[0,elevation+h,side*(d/2+.02)]}>
    <shapeGeometry args={[gable]}/><meshStandardMaterial color="#c5c5c1" roughness={.88} side={THREE.DoubleSide}/>
   </mesh>)}
   <mesh position={[0,elevation+h+roofRise+.01,0]} material={edgeColor}>
    <boxGeometry args={[.1,.10,d+1.12]}/>
   </mesh>
   <mesh position={[0,.14,d/2+1.75]} castShadow receiveShadow>
    <boxGeometry args={[w*.7,.28,3.15]}/><meshStandardMaterial color="#c8c6be" roughness={.95}/>
   </mesh>
   {Array.from({length:8},(_,i)=><mesh key={i} position={[(-w*.35)+i*(w*.7/7),.29,d/2+1.75]}>
    <boxGeometry args={[.012,.012,3.1]}/><meshStandardMaterial color="#aaa69d" roughness={.95}/>
   </mesh>)}
   <mesh position={[-w*.025,.065,d/2+3.98]} receiveShadow castShadow>
    <boxGeometry args={[1.55,.12,1.65]}/><meshStandardMaterial color="#c2c3c0" roughness={.9}/>
   </mesh>
  </group>
  <mesh position={[0,-.085,0]} receiveShadow rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[180,180]}/><meshStandardMaterial color={mode==="studio"?"#e8ebee":"#e0e5e0"} roughness={1}/>
  </mesh>
  {mode==="studio"&&selected==="facade"&&<group position={[0,elevation+h/2,d/2+.235]}>
   {[-1,1].map(v=><mesh key={"vertical-edge"+v} position={[v*w/2,0,0]}>
    <boxGeometry args={[.018,h+.04,.018]}/><meshBasicMaterial color="#7b9fb8" depthTest={false}/>
   </mesh>)}
   {[-1,1].map(v=><mesh key={"horizontal-edge"+v} position={[0,v*h/2,0]}>
    <boxGeometry args={[w+.04,.018,.018]}/><meshBasicMaterial color="#7b9fb8" depthTest={false}/>
   </mesh>)}
  </group>}
 </group>;
}

export default function ArchitecturalScene({config,selected,onSelect,imported,onMesh,mode,cameraPreset,environment,showGrid,maps,onCanvasReady}:Props){
 const materials=useMemo(()=>{
  const make=(zone:Zone)=>{
   const data=getMaterial(config.zoneMaterials[zone]);
   return new THREE.MeshStandardMaterial({color:maps?.[zone]?.base?"#ffffff":data.color,map:maps?.[zone]?.base||null,normalMap:maps?.[zone]?.normal||null,roughnessMap:maps?.[zone]?.roughness||null,roughness:data.roughness,metalness:data.metalness});
  };
  return {facade:make("facade"),roof:make("roof"),plinth:make("plinth"),frames:make("frames")};
 },[config.zoneMaterials.facade,config.zoneMaterials.roof,config.zoneMaterials.plinth,config.zoneMaterials.frames,maps]);
 useEffect(()=>()=>Object.values(materials).forEach(m=>m.dispose()),[materials]);
 const evening=environment==="evening";
 const overcast=environment==="overcast";
 const ambient=evening?.75:overcast?2.2:1.75;
 return <Canvas shadows dpr={[1,1.8]} camera={{position:[15,9,18],fov:36,near:.05,far:450}} gl={{antialias:true,powerPreference:"high-performance",preserveDrawingBuffer:true}} onCreated={({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=evening?1.1:1.55;onCanvasReady?.(gl.domElement)}}>
  <color attach="background" args={[mode==="studio"?"#eceff2":evening?"#aab0b5":overcast?"#dfe3e5":"#e7eceb"]}/>
  <fog attach="fog" args={[mode==="studio"?"#eceff2":evening?"#aab0b5":"#e7eceb",40,140]}/>
  <hemisphereLight args={["#ffffff","#a3a6a1",ambient]}/>
  <directionalLight position={evening?[-7,6,5]:[-8,14,10]} intensity={evening?1.7:overcast?2.0:3.3} color={evening?"#f5c4a5":"#fff8ed"} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-bias={-.0001}/>
  <Suspense fallback={<Html center>Загрузка 3D-сцены…</Html>}>
   {imported?<primitive object={imported} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onMesh(e.object.uuid)}}/>:
    <Building config={config} mats={materials} selected={selected} onSelect={onSelect} mode={mode}/>}
   {mode==="studio"&&showGrid&&<Grid infiniteGrid sectionColor="#c9d1d9" cellColor="#dbe1e6" fadeDistance={52} fadeStrength={1.8} position={[0,-.05,0]}/>}
   <ContactShadows opacity={mode==="studio"?.18:.26} scale={40} blur={2.5} far={18} position={[0,-.055,0]}/>
   <OrbitControls makeDefault enableDamping dampingFactor={.09} minDistance={4} maxDistance={90} maxPolarAngle={Math.PI*.49} target={[0,2.05,0]}/>
   <CameraController preset={cameraPreset} width={config.width} depth={config.depth}/>
  </Suspense>
 </Canvas>;
}
