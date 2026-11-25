/* FORMA original metric pool geometry. Visual references: Intex Prism Frame and Easy Set.
 No third-party meshes, textures or trademarks; dimensions are editable visualization presets. */
export const POOL_IDS=['pool-frame','pool-inflatable','pool-inground'];
export const isPool=id=>POOL_IDS.includes(id);
export function createPool(T,o){
 const g=new T.Group(),r=o.diameter/2,h=o.height,w=o.width||3,l=o.diameter;
 const mat=(color,roughness=.6,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness,side:T.DoubleSide});
 const wall=mat(o.catalogId==='pool-frame'?0x969c9f:0x1761a4,.58),liner=mat(0x7fb3c7,.43),steel=mat(0xced0ce,.35,.48),joint=mat(0x70787c,.65),coping=mat(0xd5d0c1,.82);
 const water=new T.MeshPhysicalMaterial({color:0x549bb1,roughness:.21,metalness:.08,clearcoat:.7,clearcoatRoughness:.19,side:T.DoubleSide});
 const add=(geo,m,x=0,y=0,z=0)=>{const q=new T.Mesh(geo,m);q.position.set(x,y,z);q.castShadow=m!==water;q.receiveShadow=true;g.add(q);return q};
 const box=(x,y,z,a,b,c,m)=>add(new T.BoxGeometry(a,b,c),m,x,y,z);
 const profile=(pts,m)=>add(new T.LatheGeometry(pts.map(p=>new T.Vector2(...p)),96),m);
 const ring=(radius,tube,y,m)=>{const q=add(new T.TorusGeometry(radius,tube,12,96),m,0,y);q.rotation.x=Math.PI/2;return q};
 const disk=(radius,y,m)=>{const q=add(new T.CircleGeometry(radius,96),m,0,y);q.rotation.x=-Math.PI/2;return q};
 const rod=(a,b,radius,m)=>{const d=new T.Vector3(...b).sub(new T.Vector3(...a)),q=add(new T.CylinderGeometry(radius,radius,d.length(),12),m,...a.map((v,i)=>(v+b[i])/2));q.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return q};
 if(o.catalogId==='pool-frame'){
  profile([[r-.045,.015],[r-.02,.06],[r-.012,h*.9],[r-.025,h-.035]],wall);
  profile([[r-.047,.025],[r-.047,h-.035]],liner);disk(r-.048,.025,liner);
  ring(r-.018,.037,h-.03,steel);ring(r-.024,.012,.04,joint);
  const n=Math.max(8,Math.round(2*Math.PI*r/.93));
  for(let i=0;i<n;i++){const a=i*2*Math.PI/n,x=Math.cos(a),z=Math.sin(a);
   rod([x*r,h-.05,z*r],[x*(r+.065),.025,z*(r+.065)],.026,steel);
   add(new T.BoxGeometry(.13,.035,.11),joint,x*(r+.065),.022,z*(r+.065)).rotation.y=-a;
   add(new T.SphereGeometry(.045,12,8),joint,x*(r-.012),h-.03,z*(r-.012));
  }
  disk(r-.05,Math.max(.06,h-.14),water);
 }else if(o.catalogId==='pool-inflatable'){
  const rt=r*.82,t=Math.min(.10,h*.15);
  profile([[r*.82,.015],[r*.95,h*.08],[r,h*.24],[r*.985,h*.43],[r*.93,h*.62],[rt,h*.87]],wall);
  profile([[r*.80,.02],[r*.91,h*.2],[r*.90,h*.43],[rt-.025,h*.86]],liner);
  ring(rt,t,h-t,wall);ring(r*.95,.008,h*.08,wall);disk(rt-.02,h-t*1.65,water);
 }else{
  const d=h,t=.21,y=.07;
  box(0,-d/2, l/2+.065,w+.26,d,.13,liner);box(0,-d/2,-l/2-.065,w+.26,d,.13,liner);
  box(w/2+.065,-d/2,0,.13,d,l,liner);box(-w/2-.065,-d/2,0,.13,d,l,liner);
  box(0,-d-.04,0,w+.26,.08,l+.26,liner);
  box(0,y/2,l/2+t/2,w+2*t,y,t,coping);box(0,y/2,-l/2-t/2,w+2*t,y,t,coping);
  box(w/2+t/2,y/2,0,t,y,l,coping);box(-w/2-t/2,y/2,0,t,y,l,coping);
  box(0,-.15,0,w-.015,.018,l-.015,water);
 }
 g.userData.formaPool=o.catalogId;return g;
}
// Subtract exact rotated basin rectangles from triangle surfaces, retaining interpolated UVs and normals.
// Terrain data itself remains untouched; removing the pool restores the original ground.
export function cutPoolOpenings(T,geometry,doc){
 const pools=doc.objects.filter(o=>o.catalogId==='pool-inground').map(o=>({x:o.x-doc.site.width/2,z:o.y-doc.site.height/2,c:Math.cos((o.rotation||0)*Math.PI/180),s:Math.sin((o.rotation||0)*Math.PI/180),w:o.width/2,l:o.diameter/2}));
 if(!pools.length)return geometry;
 const src=geometry.index?geometry.toNonIndexed():geometry;
 const attrs=Object.entries(src.attributes).filter(([k])=>['position','normal','uv'].includes(k));
 const stride=attrs.reduce((n,[,a])=>n+a.itemSize,0);
 const out=[],p=src.attributes.position;
 const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 function split(poly,f){
  const inside=[],outside=[];
  for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],fa=f(a),fb=f(b);
   (fa<=0?inside:outside).push(a);
   if((fa<=0)!==(fb<=0)){const q=lerp(a,b,fa/(fa-fb));inside.push(q);outside.push(q)}
  }return [inside,outside];
 }
 const read=i=>attrs.flatMap(([,a])=>Array.from(a.array.slice(i*a.itemSize,(i+1)*a.itemSize)));
 for(let i=0;i<p.count;i+=3){
  let parts=[[read(i),read(i+1),read(i+2)]];
  for(const q of pools){
   const x=v=>(v[0]-q.x)*q.c+(v[2]-q.z)*q.s,z=v=>-(v[0]-q.x)*q.s+(v[2]-q.z)*q.c;
   const planes=[v=>x(v)-q.w,v=>-x(v)-q.w,v=>z(v)-q.l,v=>-z(v)-q.l];
   parts=parts.flatMap(poly=>{if(planes.some(f=>poly.every(v=>f(v)>0)))return [poly];let rest=poly,result=[];for(const f of planes){if(rest.length<3)break;const [a,b]=split(rest,f);if(b.length>=3)result.push(b);rest=a}return result});
  }
  for(const poly of parts)for(let k=1;k<poly.length-1;k++)out.push(...poly[0],...poly[k],...poly[k+1]);
 }
 const result=new T.BufferGeometry();let offset=0;
 for(const [name,a] of attrs){const values=[];for(let i=0;i<out.length;i+=stride)values.push(...out.slice(i+offset,i+offset+a.itemSize));result.setAttribute(name,new T.Float32BufferAttribute(values,a.itemSize));offset+=a.itemSize;}
 if(src!==geometry)src.dispose();geometry.dispose();return result;
}
