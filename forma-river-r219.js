// Procedural river modifier. Source heightmap is never mutated.
const clamp=(v,a,b,d)=>v==null||v===''||!Number.isFinite(Number(v))?d:Math.max(a,Math.min(b,Number(v)));
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function normalizeRiver(o={}){
 const p=o.river||o;
 return {width:clamp(p.width,.5,50,8),depth:clamp(p.depth,.1,5,1.5),left:clamp(p.left,0,6,1.2),right:clamp(p.right,0,6,1.2),slope:clamp(p.slope,0,100,45),influence:clamp(p.influence,1,50,12),variation:clamp(p.variation,0,100,15),flow:clamp(p.flow,0,100,35),reverse:!!p.reverse,mode:['local','natural','high'].includes(p.mode)?p.mode:'natural',bank:['grass','sand','gravel','rock','soil'].includes(p.bank)?p.bank:'grass',level:clamp(p.level,-12,8,-1),widthKeys:Array.isArray(p.widthKeys)?p.widthKeys.slice(0,64).map(k=>({t:clamp(k.t,0,1,0),width:clamp(k.width,.5,50,8)})).sort((a,b)=>a.t-b.t):[]};
}
export function riverPath(points){
 let p=(Array.isArray(points)?points:[]).filter(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)).filter((v,i,a)=>!i||Math.hypot(v.x-a[i-1].x,v.y-a[i-1].y)>.08);
 if(p.length<2)return p;
 // Corner cutting, endpoints fixed; bound path complexity.
 if(p.length>80)p=p.filter((_,i)=>i%Math.ceil(p.length/80)===0||i===p.length-1);
 for(let pass=0;pass<2;pass++){const q=[p[0]];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];q.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75});}q.push(p.at(-1));p=q;}
 return p;
}
export function prepareRiver(o){
 const r=normalizeRiver(o),p=o.points||[],segments=[];let length=0;
 for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);if(l<.001)continue;segments.push({a,b,dx,dy,l,start:length});length+=l;}
 const widthAt=t=>{const keys=[{t:0,width:r.width},...r.widthKeys,{t:1,width:r.width}].sort((a,b)=>a.t-b.t);let v=r.width;for(let i=1;i<keys.length;i++)if(t<=keys[i].t){const a=keys[i-1],b=keys[i];v=a.width+(b.width-a.width)*((t-a.t)/Math.max(.0001,b.t-a.t));break;}return Math.max(.5,v*(1+r.variation/100*.22*(Math.sin(t*17.3)+.45*Math.sin(t*39.1))));};
 const maxWidth=Math.max(r.width,...r.widthKeys.map(k=>k.width))*1.32,reach=maxWidth/2+r.influence+2;
 // Spatial hash: query only nearby centerline segments.
 const cell=Math.max(2,Math.min(12,reach/2)),bins=new Map();
 for(const s of segments){for(let x=Math.floor((Math.min(s.a.x,s.b.x)-reach)/cell);x<=Math.floor((Math.max(s.a.x,s.b.x)+reach)/cell);x++)for(let y=Math.floor((Math.min(s.a.y,s.b.y)-reach)/cell);y<=Math.floor((Math.max(s.a.y,s.b.y)+reach)/cell);y++){const key=x+','+y;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(s);}}
 return {r,segments,length,widthAt,nearest(x,y){let best=null,d2=Infinity;for(const s of bins.get(Math.floor(x/cell)+','+Math.floor(y/cell))||[]){const u=Math.max(0,Math.min(1,((x-s.a.x)*s.dx+(y-s.a.y)*s.dy)/(s.l*s.l))),vx=x-s.a.x-u*s.dx,vy=y-s.a.y-u*s.dy,d=vx*vx+vy*vy;if(d<d2){d2=d;best={distance:Math.sqrt(d),left:s.dx*vy-s.dy*vx<0,t:(s.start+u*s.l)/length};}}if(best)best.half=widthAt(best.t)/2;return best;}};
}
export function buildingProtection(x,y,buildings){
 let weight=1;for(const b of buildings){if(!b||!Number.isFinite(Number(b.x))||!Number.isFinite(Number(b.y)))continue;const a=(Number(b.rotation)||0)*Math.PI/180,dx=x-b.x,dy=y-b.y,u=Math.cos(a)*dx+Math.sin(a)*dy,v=-Math.sin(a)*dx+Math.cos(a)*dy;
 const d=Math.hypot(Math.max(0,Math.abs(u)-(Number(b.width)||8)/2-1.5),Math.max(0,Math.abs(v)-(Number(b.height)||8)/2-1.5));weight=Math.min(weight,smooth(d/3));}return weight;
}
export function riverTerrain(base,x,y,rivers,buildings){
 if(!rivers.length)return base;const protection=buildingProtection(x,y,buildings);if(protection===0)return base;
 let result=base,bestWeight=0;
 for(const p of rivers){const n=p.nearest(x,y);if(!n)continue;const r=p.r,dist=n.distance,half=n.half,bank=(n.left?r.left:r.right)*(r.mode==='high'?1.35:1);
 const shoulder=Math.max(.35,Math.min(r.influence*.65,bank*(1.9-r.slope/65)+.4)),outer=r.mode==='local'?Math.min(r.influence,shoulder+1.5):r.influence;
 let target,weight;if(dist<=half){const q=dist/Math.max(.25,half);target=r.level-r.depth*(1-Math.pow(q,3));weight=1;}else{const d=dist-half;if(d>=outer)continue;target=r.level+bank*smooth(d/shoulder);weight=1-smooth(d/outer);}
 if(weight>bestWeight){result=base+(target-base)*weight*protection;bestWeight=weight;}
 }return result;
}
export function riverRows(p,step=.5){
 const out=[];for(const s of p.segments){const n=Math.max(1,Math.ceil(s.l/step));for(let i=0;i<n;i++){const u=i/n;out.push({x:s.a.x+s.dx*u,y:s.a.y+s.dy*u,tx:s.dx/s.l,ty:s.dy/s.l,t:(s.start+s.l*u)/p.length});}}const s=p.segments.at(-1);if(s)out.push({x:s.b.x,y:s.b.y,tx:s.dx/s.l,ty:s.dy/s.l,t:1});
 for(let i=1;i<out.length-1;i++){const a=out[i-1],b=out[i+1],l=Math.hypot(b.x-a.x,b.y-a.y)||1;out[i].tx=(b.x-a.x)/l;out[i].ty=(b.y-a.y)/l;}
 return out.map(v=>({...v,half:p.widthAt(v.t)/2}));
}
export function riverConflict(p,buildings){
 for(const v of riverRows(p,.3))for(const k of [-1,-.5,0,.5,1])if(buildingProtection(v.x-v.ty*v.half*k,v.y+v.tx*v.half*k,buildings)<.01)return true;return false;
}
export function riverMesh(T,p,{pos,terrainAt,texture}){
 const g=new T.Group(),r=p.r,rows=riverRows(p,.45);
 if(rows.length<2)return {group:g,water:null};
 const strip=(range,material,water=false)=>{const vs=[],uv=[],ix=[];for(let i=0;i<rows.length;i++){const v=rows[i],offsets=range(v);for(let j=0;j<2;j++){const k=offsets[j],a=pos(v.x-v.ty*k,v.y+v.tx*k);vs.push(a.x,water?r.level+.018:terrainAt(a.x,a.z)+.018,a.z);uv.push(v.t*p.length/4,j);}if(i){const a=(i-1)*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vs,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();const m=new T.Mesh(geo,material);g.add(m);return m;};
 const mat=new T.MeshPhysicalMaterial({color:'#527c83',roughness:.19,metalness:.02,transparent:true,opacity:.86,depthWrite:false,clearcoat:.8,side:T.DoubleSide,bumpMap:texture,bumpScale:.019,envMapIntensity:1});
 const water=strip(v=>[-v.half,v.half],mat,true);water.userData.formaWater=true;water.userData.riverFlow=r.flow;water.userData.riverReverse=r.reverse;water.renderOrder=2;
 if(r.bank!=='grass'){const color={sand:'#b0a184',gravel:'#8a8980',rock:'#777a77',soil:'#77624b'}[r.bank];for(const sign of [-1,1])strip(v=>[sign*(v.half+.06),sign*(v.half+Math.min(2,r.influence*.23))],new T.MeshStandardMaterial({color,roughness:.98,side:T.DoubleSide}));}
 return {group:g,water};
}
export function riverPrompt(rivers,video=false){
 if(!Array.isArray(rivers)||!rivers.length)return '';
 return 'EXISTING PROCEDURAL RIVERS: preserve exact source centerline, width, terrain contours, bank elevations and building platform. '+rivers.slice(0,15).map(o=>{const r=normalizeRiver(o);return 'River width '+r.width+' m; width variations '+r.variation+'%; local width stations '+JSON.stringify(r.widthKeys)+'; depth '+r.depth+' m; left/right bank heights '+r.left+'/'+r.right+' m; bank material '+r.bank+'; level '+r.level+' m; flow '+r.flow+'%, '+(r.reverse?'reverse':'along drawn line')+'; centerline '+JSON.stringify((o.points||[]).filter((_,i,a)=>i%Math.max(1,Math.ceil(a.length/20))===0||i===a.length-1).map(v=>[+v.x.toFixed(2),+v.y.toFixed(2)]));}).join('; ')+'. '+(video?'Visible coherent downstream surface motion along bends, natural ripple advection, stable banks, fog follows existing river; no changes to geometry.':'Photographically natural water depth, reflections and existing shoreline; never add bridges, move house or invent water.');
}
