/* ALFA · physically based graphite timber facade, 2026-11-22.
 * UV-mapped PBR surface instead of ~130 separate rectangular facade slats.
 * A fine 120-135 mm board rhythm, subtle fibre/grain and weathered variation
 * live IN the textures; actual flashing/glazing remain real geometry.
 * Deterministic. No network or third-party image dependency. Low GPU cost.
 */
const atlasCache=new WeakMap();
const photographedNormalCache=new WeakMap();
// This 1K photographic wood-grain normal is already self-hosted and used by
// the Scandinavian home. Layer it subtly beneath the texel-scale seam bump.
function photographicNormal(T){
 if(!T.TextureLoader)return null;
 let t=photographedNormalCache.get(T);
 if(!t){
  t=new T.TextureLoader().load('/assets/house-pbr/wood-nor_gl-1k.jpg');
  t.wrapS=t.wrapT=T.RepeatWrapping;
  t.anisotropy=8;
  t.center.set(.5,.5);
  t.rotation=-Math.PI/2;
  photographedNormalCache.set(T,t);
 }
 return t;
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function rng(seed){
 let n=seed>>>0;
 return ()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296};
}
function color(v){return 'rgb('+v.map(x=>clamp(Math.round(x),0,255)).join(',')+')'}
function canvas(size){
 const c=document.createElement('canvas');c.width=c.height=size;return c;
}
function buildAtlas(T,boards){
 const size=1024,albedo=canvas(size),height=canvas(size),rough=canvas(size);
 const c=albedo.getContext('2d'),b=height.getContext('2d'),r=rough.getContext('2d');
 const random=rng(0xA1FA2026+boards),pitch=size/boards;
 c.fillStyle='#42494C';c.fillRect(0,0,size,size);
 b.fillStyle='#808080';b.fillRect(0,0,size,size);
 r.fillStyle='#dedede';r.fillRect(0,0,size,size);
 for(let i=0;i<boards;i++){
  const x=i*pitch,end=x+pitch,variation=Math.floor((random()-.5)*17);
  const shade=[62+variation,69+variation,72+variation];
  const grad=c.createLinearGradient(x,0,end,0);
  grad.addColorStop(0,color(shade.map(v=>v-4)));
  grad.addColorStop(.15,color(shade.map(v=>v+2)));
  grad.addColorStop(.52,color(shade));
  grad.addColorStop(.85,color(shade.map(v=>v+2)));
  grad.addColorStop(1,color(shade.map(v=>v-3)));
  c.fillStyle=grad;c.fillRect(x,0,pitch+.75,size);
  const elevation=122+Math.floor(random()*13);
  b.fillStyle='rgb('+elevation+','+elevation+','+elevation+')';
  b.fillRect(x,0,pitch+.6,size);
  const roughness=205+Math.floor(random()*21);
  r.fillStyle='rgb('+roughness+','+roughness+','+roughness+')';
  r.fillRect(x,0,pitch+.7,size);
  // Grain follows Y, with broken, slightly wandering photographic fibres.
  // Never paint thick relief stripes or repeated glossy cartoon lines.
  const fibres=3+Math.floor(random()*4);
  for(let k=0;k<fibres;k++){
   const px=x+1+random()*(pitch-2),waviness=.30+random()*.9;
   const yStart=-60+random()*95;
   c.beginPath();b.beginPath();r.beginPath();
   for(let y=yStart;y<size+75;y+=18){
    const xx=px+Math.sin(y*.014+i+k)*waviness+Math.sin(y*.042+k)*.20;
    if(y===yStart){c.moveTo(xx,y);b.moveTo(xx,y);r.moveTo(xx,y)}
    else{c.lineTo(xx,y);b.lineTo(xx,y);r.lineTo(xx,y)}
   }
   c.strokeStyle=random()>.5?'rgba(231,232,221,.052)':'rgba(8,15,18,.095)';
   c.lineWidth=.35+random()*.65;c.stroke();
   b.strokeStyle=random()>.5?'rgba(223,223,223,.15)':'rgba(26,26,26,.17)';
   b.lineWidth=.5;b.stroke();
   r.strokeStyle='rgba(30,30,30,.065)';r.lineWidth=.6;r.stroke();
  }
  // Narrow painted seam: dark 1-2mm in texture space, not real bars.
  c.fillStyle='rgba(12,19,22,.52)';c.fillRect(x,0,1.15,size);
  c.fillStyle='rgba(220,227,224,.067)';c.fillRect(x+1.15,0,.85,size);
  b.fillStyle='#434343';b.fillRect(x,0,1.25,size);
  r.fillStyle='#f0f0f0';r.fillRect(x,0,1.15,size);
 }
 // End grain / weather spots are subtle, diffuse and unique, not tiled knots.
 for(let i=0;i<boards*.8;i++){
  const x=random()*size,y=random()*size;
  const radius=.5+random()*1.6;
  c.fillStyle='rgba(10,19,20,.065)';
  c.fillRect(x,y,radius,2+random()*9);
 }
 const colorMap=new T.CanvasTexture(albedo);
 colorMap.colorSpace=T.SRGBColorSpace;
 const bumpMap=new T.CanvasTexture(height);
 const roughnessMap=new T.CanvasTexture(rough);
 for(const map of [colorMap,bumpMap,roughnessMap]){
  map.wrapS=map.wrapT=T.ClampToEdgeWrapping;
  map.anisotropy=8;
  map.generateMipmaps=true;
  map.needsUpdate=true;
 }
 return {colorMap,bumpMap,roughnessMap,boards};
}
export function alphaGraphitePBR(T,width=7.5){
 const boards=clamp(Math.round(width/.125),24,120);
 let keyed=atlasCache.get(T);
 if(!keyed){keyed=new Map();atlasCache.set(T,keyed)}
 let atlas=keyed.get(boards);
 if(!atlas&&typeof document!=='undefined'){
  atlas=buildAtlas(T,boards);keyed.set(boards,atlas);
 }
 const mat=new T.MeshStandardMaterial({
  color:atlas?'#FFFFFF':'#42494C',
  map:atlas?.colorMap||null,
  bumpMap:atlas?.bumpMap||null,
  bumpScale:.009,
  roughnessMap:atlas?.roughnessMap||null,
  normalMap:photographicNormal(T),
  normalScale:T.Vector2?new T.Vector2(.14,.14):null,
  roughness:.91,metalness:.018,
  side:T.DoubleSide
 });
 mat.userData.alphaCladding={
  method:'UV-mapped graphite wood PBR; NO individual board meshes',
  atlasBoards:boards,boardPitchMeters:width/boards,
  colorMap:!!atlas,roughnessMap:!!atlas,bumpMap:!!atlas,photoNormal:!!mat.normalMap
 };
 return mat;
}
/* True ShapeGeometry opening means facade never renders over glazing.
 * Use one contour for each face and 2 polygonal holes on the glazed face.
 * Front and rear share the same PBR UV scale.
 */
export function alphaFacadePanel(T,g,{
 half,base,peak,z,width,glassHalf,glassBase,glassTop,doorHalf,doorBottom,doorTop,
 front=false,material
}){
 const s=new T.Shape();
 s.moveTo(-half,base);s.lineTo(half,base);s.lineTo(0,peak);s.closePath();
 if(front){
  // Door rectangle: real void for all four sliding leaves.
  const door=new T.Path();
  door.moveTo(-doorHalf,doorBottom);
  door.lineTo(-doorHalf,doorTop);
  door.lineTo(doorHalf,doorTop);
  door.lineTo(doorHalf,doorBottom);
  door.closePath();s.holes.push(door);
  // Roof gable glazing: triangular aperture, not a blue pane over cladding.
  const glazed=new T.Path();
  glazed.moveTo(-glassHalf,glassBase);
  glazed.lineTo(0,glassTop);
  glazed.lineTo(glassHalf,glassBase);
  glazed.closePath();s.holes.push(glazed);
 }
 const geometry=new T.ShapeGeometry(s,8);
 const pos=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i);
  pos.setXYZ(i,x,y,z);
  uv.setXY(i,(x+half)/(2*half),clamp((y-base)/(peak-base),0,1));
 }
 pos.needsUpdate=true;uv.needsUpdate=true;geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,material);
 mesh.castShadow=mesh.receiveShadow=true;
 mesh.userData.architecturePart=front?'alpha-front-single-pbr-textured-facade':'alpha-rear-single-pbr-textured-facade';
 mesh.userData.openings=front?['sliding-door','triangular-glazing']:[];
 g.add(mesh);
 return mesh;
}
