// R221: non-destructive closed lake and straight coastal sea, metric terrain modifiers.
import {buildingProtection} from './forma-river-r219.js';
const clamp=(v,a,b,d)=>v==null||v===''||!Number.isFinite(Number(v))?d:Math.max(a,Math.min(b,Number(v)));
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function normalizeBasin(o={}){
 const p=o.basin||o,sea=o.type==='sea'||p.kind==='sea';
 return {kind:sea?'sea':'lake',depth:clamp(p.depth,.2,12,sea?5:3),level:clamp(p.level,-12,8,-.8),bankHeight:clamp(p.bankHeight,0,6,1),beachWidth:clamp(p.beachWidth,.5,30,sea?8:3),influence:clamp(p.influence,1,50,sea?20:10),bank:['grass','sand','gravel','rock','soil'].includes(p.bank)?p.bank:sea?'sand':'grass',side:p.side==='right'?'right':'left',waves:clamp(p.waves,0,100,sea?45:12),speed:clamp(p.speed,0,100,sea?45:15),foam:clamp(p.foam,0,100,sea?55:0)};
}
export function basinPoints(points,sea=false){
 let p=(points||[]).filter(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)).filter((v,i,a)=>!i||Math.hypot(v.x-a[i-1].x,v.y-a[i-1].y)>.15);
 if(sea)return p.length>1?[p[0],p.at(-1)]:p;
 if(p.length>80)p=p.filter((_,i)=>i%Math.ceil(p.length/80)===0||i===p.length-1);
 if(p.length>3&&Math.hypot(p[0].x-p.at(-1).x,p[0].y-p.at(-1).y)<.5)p.pop();
 return p;
}
export function polygonArea(p){let a=0;for(let i=0;i<p.length;i++){const v=p[i],u=p[(i+1)%p.length];a+=v.x*u.y-u.x*v.y;}return Math.abs(a)*.5;}
function intersect(a,b,c,d){const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;}
export function basinValid(o){
 const p=o.points||[];if(o.type==='sea')return p.length===2&&Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)>=2;
 if(p.length<3||polygonArea(p)<2)return false;
 for(let i=0;i<p.length;i++)for(let j=i+2;j<p.length;j++){if(i===0&&j===p.length-1)continue;if(intersect(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))return false;}return true;
}
export function prepareBasin(o){
 const r=normalizeBasin(o),p=o.points||[],sea=r.kind==='sea',a=p[0]||{x:0,y:0},b=p[1]||a,l=Math.hypot(b.x-a.x,b.y-a.y)||1,dx=(b.x-a.x)/l,dy=(b.y-a.y)/l,sign=r.side==='left'?-1:1;
 const minX=Math.min(...p.map(v=>v.x)),maxX=Math.max(...p.map(v=>v.x)),minY=Math.min(...p.map(v=>v.y)),maxY=Math.max(...p.map(v=>v.y)),reach=r.beachWidth+r.influence+2;
 const edges=p.map((v,i)=>{const u=p[(i+1)%p.length],x=u.x-v.x,y=u.y-v.y;return {v,u,x,y,l:x*x+y*y||1}});
 const signed=(x,y)=>{if(sea)return sign*(dx*(y-a.y)-dy*(x-a.x));
 if(x<minX-reach||x>maxX+reach||y<minY-reach||y>maxY+reach)return -Infinity;
 let inside=false,d2=Infinity;for(const e of edges){const v=e.v,u=e.u,t=Math.max(0,Math.min(1,((x-v.x)*e.x+(y-v.y)*e.y)/e.l)),d=(x-v.x-e.x*t)**2+(y-v.y-e.y*t)**2;d2=Math.min(d2,d);if((v.y>y)!==(u.y>y)&&x<(u.x-v.x)*(y-v.y)/(u.y-v.y)+v.x)inside=!inside;}return Math.sqrt(d2)*(inside?1:-1);};
 return {o,r,p,signed,a,dx,dy,sign};
}
export function basinConflict(p,buildings){
 // Check a rotated foundation footprint plus 1.5 m protection collar.
 for(const b of buildings){if(!b)continue;const a=(Number(b.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),w=(Number(b.width)||8)/2+1.5,h=(Number(b.height)||8)/2+1.5,nx=Math.max(2,Math.ceil(w*2/.65)),ny=Math.max(2,Math.ceil(h*2/.65));for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){const u=-w+2*w*i/nx,v=-h+2*h*j/ny;if(p.signed(b.x+u*c-v*s,b.y+u*s+v*c)>=0)return true;}}return false;
}
export function basinTerrain(base,x,y,basins,buildings){
 if(!basins.length)return base;const protect=buildingProtection(x,y,buildings);if(!protect)return base;
 let result=base,best=0;
 for(const p of basins){const d=p.signed(x,y),r=p.r;let target,weight;
 if(d>=0){target=r.level-.04-r.depth*smooth(d/Math.max(.5,r.beachWidth));weight=1;}
 else{const k=-d;if(k>r.beachWidth+r.influence)continue;target=r.level+r.bankHeight*smooth(k/r.beachWidth);weight=1-smooth(Math.max(0,k-r.beachWidth)/r.influence);}
 if(weight>best){best=weight;result=base+(target-base)*weight*protect;}}
 return result;
}
export function seaPolygon(p,w,h,extent){
 const x=w/2,y=h/2,b=extent/2;const corners=[{x:x-b,y:y-b},{x:x+b,y:y-b},{x:x+b,y:y+b},{x:x-b,y:y+b}],out=[];
 for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],da=p.signed(a.x,a.y),db=p.signed(b.x,b.y);if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}return out;
}
export function basinMesh(T,p,{pos,width,height,extent,texture,terrainAt,groundExtent=Math.max(width,height)}){
 const g=new T.Group(),r=p.r,sea=r.kind==='sea',points=sea?seaPolygon(p,width,height,extent):p.p;
 const poly=(pts)=>{const shape=new T.Shape();pts.forEach((v,i)=>{const q=pos(v.x,v.y);if(i)shape.lineTo(q.x,-q.z);else shape.moveTo(q.x,-q.z);});shape.closePath();const geo=new T.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);const uv=geo.attributes.uv,vert=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,vert.getX(i)/4,vert.getZ(i)/4);uv.needsUpdate=true;return geo;};
 if(points.length<3)return {group:g,water:null};
 const mat=new T.MeshPhysicalMaterial({color:sea?'#487780':'#567e82',roughness:.16,metalness:.02,transparent:true,opacity:sea?.91:.84,depthWrite:false,clearcoat:.8,side:T.DoubleSide,bumpMap:texture,bumpScale:.04,envMapIntensity:1});
 const clock={value:0},origin=pos(p.a.x,p.a.y),normal=new T.Vector2(-p.dy*p.sign,p.dx*p.sign);
 if(sea){mat.onBeforeCompile=shader=>{shader.uniforms.coastTime=clock;shader.uniforms.coastOrigin={value:new T.Vector2(origin.x,origin.z)};shader.uniforms.coastNormal={value:normal};shader.uniforms.coastFoam={value:r.foam/100};shader.uniforms.coastSpeed={value:r.speed/100};shader.uniforms.coastWidth={value:r.beachWidth};shader.uniforms.coastWaves={value:r.waves/100};shader.vertexShader='varying vec2 coastXZ;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncoastXZ=position.xz;');shader.fragmentShader='varying vec2 coastXZ; uniform float coastTime,coastFoam,coastSpeed,coastWidth,coastWaves; uniform vec2 coastOrigin,coastNormal;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat cd=max(0.,dot(coastXZ-coastOrigin,coastNormal)); float phase=cd*2.1+coastTime*coastSpeed*2.8+sin(dot(coastXZ,vec2(.31,.27)))*.45; float bands=smoothstep(.80,.99,sin(phase)); float coastMask=exp(-cd/max(.8,coastWidth*.75)); float foam=bands*coastMask*coastFoam*coastWaves; diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.84,.83),foam*.82);');};mat.customProgramCacheKey=()=> 'forma-sea-foam-r221';}
 const water=new T.Mesh(poly(points),mat);water.position.y=r.level;water.userData.formaWater=true;water.userData.basinWave={clock,waves:r.waves,speed:r.speed,sea};water.renderOrder=2;g.add(water);
 // A separate near-parcel mesh is used for fog sampling, not the ocean horizon.
 if(sea){water.userData.fogFootprint=seaPolygon(p,width,height,Math.max(width,height)*1.05).map(v=>({x:v.x-width/2,z:v.y-height/2}));}
 // Real shoreline material follows the modified ground; no floating flat beach decal.
 if(r.bank!=='grass'&&typeof terrainAt==='function'){
  const color={sand:'#b2a58a',gravel:'#8f9086',rock:'#777a76',soil:'#78644e'}[r.bank],verts=[],uv=[],indices=[];
  const shoreWidth=r.beachWidth;
  let shore=sea?seaPolygon(p,width,height,groundExtent).filter(v=>Math.abs(p.signed(v.x,v.y))<.001):p.p;
  if(shore.length>=2){
   let area=0;for(let i=0;i<shore.length;i++){const a=shore[i],b=shore[(i+1)%shore.length];area+=a.x*b.y-b.x*a.y;}
   const closed=!sea,edges=closed?shore.length:shore.length-1;
   const samples=[];
   for(let i=0;i<edges;i++){
    const a=shore[i],b=shore[(i+1)%shore.length],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);if(l<.001)continue;
    const n=Math.max(1,Math.ceil(l/.8));for(let k=0;k<n;k++){const t=k/n;const x=a.x+dx*t,y=a.y+dy*t,nx=sea?p.dy*p.sign:(area>0?dy:-dy)/l,ny=sea?-p.dx*p.sign:(area>0?-dx:dx)/l;samples.push({x,y,nx,ny});}
   }
   if(sea){const a=shore.at(-1);samples.push({x:a.x,y:a.y,nx:p.dy*p.sign,ny:-p.dx*p.sign});}else if(samples.length)samples.push({...samples[0]});
   const cols=Math.max(2,Math.min(14,Math.ceil(shoreWidth/.7)));
   for(let i=0;i<samples.length;i++){const a=samples[i];for(let j=0;j<=cols;j++){const d=.04+shoreWidth*j/cols,q=pos(a.x+a.nx*d,a.y+a.ny*d);verts.push(q.x,terrainAt(q.x,q.z)+.026,q.z);uv.push(q.x*.8,q.z*.8);if(i&&j){const b=i*(cols+1)+j;indices.push(b-cols-2,b-1,b-cols-1,b-cols-1,b-1,b);}}}
   if(indices.length){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const beach=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.94,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));beach.userData.formaWeatherableSurface=true;beach.receiveShadow=true;g.add(beach);}
  }
 }
 return {group:g,water};
}
export function basinPrompt(objects,video=false){
 if(!Array.isArray(objects)||!objects.length)return '';
 return 'AUTHORED LAKES AND SEA: '+objects.slice(0,8).map(o=>{const r=normalizeBasin(o);return (r.kind==='sea'?'Sea coastline, water on '+r.side+' side':'Closed lake')+'; depth '+r.depth+' m; water level '+r.level+' m; bank height '+r.bankHeight+' m; beach width '+r.beachWidth+' m; bank material '+r.bank+'; wave strength '+r.waves+'%; wave speed '+r.speed+'%; foam '+r.foam+'%; exact contour '+JSON.stringify((o.points||[]).filter((_,i,a)=>i%Math.max(1,Math.ceil(a.length/12))===0||i===a.length-1).map(v=>[+v.x.toFixed(2),+v.y.toFixed(2)]));}).join('; ')+'. Preserve architecture, water boundary and protected terrain. '+(video?'Lake waves ripple naturally; ocean waves travel toward the existing beach and break into animated white foam, then dissipate, with stable shoreline and reflections. Respect zero wave and foam settings.':'Realistic water optical depth, reflections, existing shore materials and physically plausible wave appearance. Do not add islands, boats or objects.');
}
