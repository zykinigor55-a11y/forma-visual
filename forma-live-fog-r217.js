/* R217 · lightweight, terrain-anchored, moving low mist.
 * Instanced, camera-facing soft mist patches, with a raster shoreline mask.
 * This is a realtime approximation, not volumetric ray marching.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function seeded(seed){let x=seed>>>0;return ()=>((x=(1664525*x+1013904223)>>>0)/4294967296);}
function waterMask(T,surfaces,w,d){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,256,256);ctx.fillStyle='#fff';
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 const draw=(v)=>[256*(v.x/w+.5),256*(v.z/d+.5)];
 for(const mesh of surfaces){
  const g=mesh.geometry,p=g?.attributes?.position;if(!p)continue;mesh.updateWorldMatrix(true,false);
  const ix=g.index,n=ix?ix.count:p.count;
  for(let i=0;i+2<n;i+=3){
   const get=(j,v)=>v.fromBufferAttribute(p,ix?ix.getX(j):j).applyMatrix4(mesh.matrixWorld);
   get(i,a);get(i+1,b);get(i+2,c);const A=draw(a),B=draw(b),C=draw(c);
   ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);ctx.lineTo(...C);ctx.closePath();ctx.fill();
  }
 }
 const map=new T.CanvasTexture(canvas);map.flipY=false;map.generateMipmaps=false;map.minFilter=T.LinearFilter;map.magFilter=T.LinearFilter;map.needsUpdate=true;return {map,ctx};
}
function layer(T,count,mask,w,d,water){
 const geometry=new T.PlaneGeometry(1,1);
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,
 uniforms:{clock:{value:0},density:{value:0},drift:{value:.2},tint:{value:new T.Color('#c1ced2')},mask:{value:mask},site:{value:new T.Vector2(w,d)},water:{value:water?1:0}},
 vertexShader:`varying vec2 vUv; varying vec3 vWorld;
 void main(){vUv=uv;vec4 center=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
 vec4 viewCenter=viewMatrix*center;
 vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
 right.y=0.;right=normalize(right+vec3(.00001,0.,0.));
 float sx=length(instanceMatrix[0].xyz),sy=length(instanceMatrix[1].xyz);
 vWorld=center.xyz+right*position.x*sx+vec3(0.,position.y*sy,0.);
 gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
 fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float clock,density,drift,water;
 uniform vec3 tint;uniform sampler2D mask;uniform vec2 site;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec2 uv=vUv*2.-1.;float edge=pow(max(0.,1.-dot(uv,uv)),1.7);
 vec2 p=vWorld.xz*.31-vec2(clock*drift*.65,clock*drift*.22)+vec2(0.,vWorld.y*.6);
 float n=noise(p)*.65+noise(p*2.7)*.35;
 float a=edge*smoothstep(.13,.8,n)*density*.27;
 vec2 m=vWorld.xz/site+.5;
 float shore=texture2D(mask,clamp(m,0.,1.)).r;
 if(water>.5)a*=smoothstep(.05,.92,shore)*step(0.,m.x)*step(m.x,1.)*step(0.,m.y)*step(m.y,1.);
 else a*=1.-shore*.65;
 if(a<.003)discard;gl_FragColor=vec4(tint,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new T.InstancedMesh(geometry,material,count);mesh.count=0;mesh.frustumCulled=false;mesh.renderOrder=4;mesh.userData.formaWeatherPreview=true;mesh.raycast=()=>{};return mesh;
}
export function createLiveFogR217(T,scene,{width,depth,terrainAt,waterSurfaces=[],mobile=false}){
 const w=Math.max(1,width),d=Math.max(1,depth),{map}=waterMask(T,waterSurfaces,w,d);
 const group=new T.Group();group.name='forma-live-mist-r217';group.userData.formaWeatherPreview=true;scene.add(group);
 const ground=layer(T,mobile?60:120,map,w,d,false),water=layer(T,mobile?50:100,map,w,d,true);
 group.add(ground,water);
 const rnd=seeded(901722),dummy=new T.Object3D();
 const groundSeeds=Array.from({length:ground.instanceMatrix.count},()=>({x:(rnd()-.5)*w,z:(rnd()-.5)*d,size:.6+rnd()*.9,phase:rnd()}));
 // Sample existing water triangles directly: tiny ponds must work even on a huge parcel.
 const waterSeeds=[],triangles=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3();let totalArea=0;
 for(const mesh of waterSurfaces){
  const g=mesh.geometry,p=g?.attributes?.position;if(!p)continue;mesh.updateWorldMatrix(true,false);
  const index=g.index,n=index?index.count:p.count;
  for(let i=0;i+2<n;i+=3){
   const get=(j,v)=>v.fromBufferAttribute(p,index?index.getX(j):j).applyMatrix4(mesh.matrixWorld);
   get(i,a);get(i+1,b);get(i+2,c);ab.subVectors(b,a);ac.subVectors(c,a);
   const area=Math.abs(ab.x*ac.z-ab.z*ac.x)*.5;if(area<1e-6)continue;
   totalArea+=area;triangles.push({a:a.clone(),b:b.clone(),c:c.clone(),end:totalArea});
  }
 }
 if(totalArea>0){
  const count=Math.min(water.instanceMatrix.count,Math.max(12,Math.ceil(totalArea/2)));
  for(let i=0;i<count;i++){
   const target=(i+rnd())/count*totalArea;let lo=0,hi=triangles.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(triangles[mid].end<target)lo=mid+1;else hi=mid;}
   const tr=triangles[lo],u=Math.sqrt(rnd()),v=rnd(),wa=1-u,wb=u*(1-v),wc=u*v;
   waterSeeds.push({x:tr.a.x*wa+tr.b.x*wb+tr.c.x*wc,y:tr.a.y*wa+tr.b.y*wb+tr.c.y*wc,z:tr.a.z*wa+tr.b.z*wb+tr.c.z*wc,size:.6+rnd()*.9,phase:rnd()});
  }
 }
 let previous='',last=0,frame=0,flow=0;
 const wrap=(v,extent)=>((v+extent*.5)%extent+extent)%extent-extent*.5;
 function update(settings,now,visible,tint){
  group.visible=visible;
  const density=[settings.groundDensity,settings.waterDensity],height=[settings.groundHeight,settings.waterHeight];
  const sig=JSON.stringify([density,height]);
  const dt=frame?Math.min(.12,Math.max(0,(now-frame)*.001)):0;frame=now;
  if(visible)flow+=dt*settings.driftSpeed/100;
  const stepMotion=visible&&settings.driftSpeed>0&&now-last>(mobile?110:60);
  for(const [i,m,seeds] of [[0,ground,groundSeeds],[1,water,waterSeeds]]){
   m.visible=visible&&density[i]>0&&seeds.length>0;
   m.material.uniforms.density.value=density[i]/100;
   m.material.uniforms.drift.value=1;
   m.material.uniforms.clock.value=flow;
   if(tint?.isColor)m.material.uniforms.tint.value.copy(tint).lerp(new T.Color('#d3d8d9'),.25);
   if(sig!==previous||stepMotion&&m.visible){
    const h=height[i],spread=i===0?Math.sqrt(w*d/seeds.length)*2.8:Math.max(.5,Math.min(7,Math.sqrt(totalArea/Math.max(1,seeds.length))*3.2));
    m.count=density[i]>0?seeds.length:0;
    for(let j=0;j<m.count;j++){const p=seeds[j];
     const x=i?p.x+Math.sin(flow*.22+p.phase*1.5)*1.4:wrap(p.x+flow*.83,w),z=i?p.z+Math.sin(flow*.16+p.phase)*.65:wrap(p.z+flow*.28,d);
     const base=i?p.y:terrainAt(x,z);
     dummy.position.set(x,base+h*.5,z);dummy.scale.set(spread*p.size,h*(.75+.25*p.size),1);dummy.updateMatrix();m.setMatrixAt(j,dummy.matrix);
    }m.instanceMatrix.needsUpdate=true;
   }
  }
  const changed=sig!==previous;previous=sig;
  const active=visible&&(ground.visible||water.visible);
  const moving=active&&stepMotion;
  if(moving)last=now;return changed||moving;
 }
 return {update,dispose(){scene.remove(group);for(const mesh of [ground,water]){mesh.geometry.dispose();mesh.material.dispose();}map.dispose();},diagnostics:()=>({groundPatches:ground.count,waterPatches:water.count,waterSamples:waterSeeds.length,visible:group.visible})};
}
