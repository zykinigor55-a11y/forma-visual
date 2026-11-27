// R194: independent raised lawn surfaces. Local XZ grass geometry follows the primitive.
import {LAWN_PROFILES} from './forma-lawn-profiles-r89.js?v=R89';
import {createDenseLawn,tickDenseLawn} from './forma-dense-lawn-r106.js?v=R161';
export const isSurfacePrimitive=o=>o?.type==='primitive-plane'||o?.type==='primitive-box';
const num=(v,d,min,max)=>v!==null&&v!==''&&Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):d;
export function normalizePrimitive(o){
 const box=o.type==='primitive-box';
 return {...o,width:num(o.width,3,.2,40),depth:num(o.depth,3,.2,40),elevation:num(o.elevation,box?1:.04,-5,50),thickness:num(o.thickness,box?1:.04,.01,20),rotation:num(o.rotation,0,-360,360),lawn:LAWN_PROFILES[o.lawn]?o.lawn:'none',grassHeight:num(o.grassHeight,100,25,250),grassDensity:num(o.grassDensity,100,25,150)};
}
export function primitiveLabel(o){return o.type==='primitive-box'?'Объёмный блок':'Плоскость';}
export function primitiveInspector(o){
 o=normalizePrimitive(o);
 const n=(key,label,step,min,max)=>'<label>'+label+'<input type="number" data-primitive="'+key+'" step="'+step+'" min="'+min+'" max="'+max+'" value="'+Number(o[key]||0)+'"></label>';
 return '<div class="property-section"><strong>'+primitiveLabel(o)+' · R194</strong><p>Отметка верхней поверхности относительно земли. Газон растёт только на верхней грани.</p><div class="scene-climate-grid">'+n('x','X, м',.05,0,10000)+n('y','Y, м',.05,0,10000)+n('width','Ширина, м',.1,.2,40)+n('depth','Длина, м',.1,.2,40)+n('elevation','Высота верха, м',.05,-5,50)+n('thickness','Толщина, м',.05,.01,20)+n('rotation','Поворот, °',1,-360,360)+'</div><label>Покрытие<select data-primitive="lawn"><option value="none">Без газона · нейтральная поверхность</option>'+Object.entries(LAWN_PROFILES).map(([id,p])=>'<option value="'+id+'" '+(id===o.lawn?'selected':'')+'>'+p.name+'</option>').join('')+'</select></label><div class="scene-climate-grid">'+n('grassHeight','Высота травы, %',5,25,250)+n('grassDensity','Плотность, %',5,25,150)+'</div><p>Размер, высота, поворот и газон независимы от участка.</p><div class="scene-climate-actions"><button type="button" data-primitive-action="duplicate">Дублировать</button><button type="button" data-primitive-action="delete">Удалить</button></div></div>';
}
export function createSurfacePrimitive(T,input,{season='summer',mobile=false,low=false,detail=true}={}){
 const o=normalizePrimitive(input),group=new T.Group();group.name='forma-raised-surface-r194';
 const p=LAWN_PROFILES[o.lawn],isWinter=season==='winter';
 const sideMat=new T.MeshStandardMaterial({color:'#a39f94',roughness:.93});
 const topMat=new T.MeshStandardMaterial({color:p?(isWinter?'#b8c0bc':season==='autumn'?'#8d8058':p.palette[1]):'#b2aea3',roughness:.95});
 const materials=[sideMat,sideMat,topMat,sideMat,sideMat,sideMat];
 const base=new T.Mesh(new T.BoxGeometry(o.width,o.thickness,o.depth),materials);base.position.y=-o.thickness/2;base.castShadow=base.receiveShadow=true;group.add(base);
 if(p&&!isWinter){
  const profile={...p,integrated:true,season,height:p.height*o.grassHeight/100,density:p.density*o.grassDensity/100,pressedAmount:25,flowerAmount:65};
  const bounds={x0:-o.width/2,x1:o.width/2,z0:-o.depth/2,z1:o.depth/2};
  const contains=(x,z)=>x>bounds.x0+.025&&x<bounds.x1-.025&&z>bounds.z0+.025&&z<bounds.z1-.025;
  // Bounded instances on each local surface, no terrain mask or heightfield.
  if(detail&&o.width*o.depth<=144){
   const grass=createDenseLawn(T,{profile,focus:{x:0,z:0},mobile:true,low:mobile||low,terrainAt:()=>.004,contains,bounds});grass.name='forma-raised-grass-r194';group.add(grass);group.userData.raisedGrass=grass;
  }else{
   // Economy mode for very large planes and many surfaces: real instanced
   // crossed grass clumps with the same profile palette and height.
   const g=new T.BufferGeometry(),verts=[];
   for(let k=0;k<3;k++){const a=k*Math.PI/3,dx=Math.cos(a)*.35,dz=Math.sin(a)*.35;verts.push(-dx,0,-dz,dx,0,dz,dx*.5,1,dz*.5,-dx,0,-dz,dx*.5,1,dz*.5,-dx*.5,.65,-dz*.5);}
   g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.computeVertexNormals();
   const step=Math.max(.10,Math.sqrt(o.width*o.depth/(mobile?5500:13000)))/Math.sqrt(Math.min(1.5,profile.density));
   const nx=Math.max(1,Math.floor(o.width/step)),nz=Math.max(1,Math.floor(o.depth/step));
   const mat=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.95}),m=new T.InstancedMesh(g,mat,nx*nz),d=new T.Object3D(),c=new T.Color();let seed=78231,i=0;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const r=rnd();d.position.set(-o.width/2+(x+.22+rnd()*.56)*o.width/nx,.004,-o.depth/2+(z+.22+rnd()*.56)*o.depth/nz);d.rotation.y=rnd()*Math.PI*2;d.scale.set(step*.75,profile.height*(.65+r*.7),step*.75);d.updateMatrix();m.setMatrixAt(i,d.matrix);m.setColorAt(i,c.set(profile.palette[Math.min(profile.palette.length-1,Math.floor(r*profile.palette.length))]));i++;}
   m.castShadow=false;m.receiveShadow=true;m.computeBoundingSphere();group.add(m);
  }
 }
 group.userData.formaPrimitive={...o};return group;
}
export function tickRaisedGrass(group,now,strength){return tickDenseLawn(group?.userData?.raisedGrass,now,strength);}
