/* R227: isolated WebGL lighting, focused directional shadow frustum.
 * All values are relative scene-linear design controls, not lux measurements. */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function shadowBoundsR227(points,textureSize=2048,margin=.65){
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(const p of points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);}
 if(!Number.isFinite(minX))return null;
 const width=Math.max(2,maxX-minX+margin*2),height=Math.max(2,maxY-minY+margin*2),n=Math.max(1,textureSize);
 const texel=Math.max(width,height)/Math.max(1,n-4),cx=Math.round((minX+maxX)/2/texel)*texel,cy=Math.round((minY+maxY)/2/texel)*texel;
 const half=Math.max(width,height)/2+texel*2;
 return {left:cx-half,right:cx+half,bottom:cy-half,top:cy+half,near:Math.max(.1,-maxZ-3),far:Math.max(10,-minZ+6),texel};
}
export function fitSakuraShadowR227(T,sun,trees,terrainAt,softness=2.8){
 if(!sun?.shadow||!trees.length||sun.position.y<4)return false;
 sun.updateMatrixWorld(true);sun.target.updateMatrixWorld(true);sun.shadow.updateMatrices(sun);
 const cam=sun.shadow.camera,points=[],dir=sun.position.clone().sub(sun.target.position).normalize();
 for(const o of trees){
  const x=o.x,z=o.z,h=Math.max(.8,o.height),r=Math.max(.4,o.diameter/2),y=terrainAt(x,z);
  for(const dx of [-r,r])for(const dz of [-r,r])for(const dy of [0,h]){
   const p=new T.Vector3(x+dx,y+dy,z+dz);points.push(p.clone().applyMatrix4(cam.matrixWorldInverse));
   // The shadow of the top of the crown must also remain inside the depth range.
   if(dy>0){const length=Math.min(70,dy/Math.max(.06,dir.y));const ground=p.clone().addScaledVector(dir,-length);ground.y=terrainAt(ground.x,ground.z);points.push(ground.applyMatrix4(cam.matrixWorldInverse));}
  }
 }
 const b=shadowBoundsR227(points,sun.shadow.mapSize.x);if(!b)return false;
 Object.assign(cam,{left:b.left,right:b.right,bottom:b.bottom,top:b.top,near:b.near,far:Math.max(b.near+2,b.far)});cam.updateProjectionMatrix();
 sun.shadow.normalBias=clamp(b.texel*.30,.0015,.010);sun.shadow.bias=-clamp(b.texel/(cam.far-cam.near)*.18,.000015,.00013);
 // Approximate a small physical penumbra, not a global large blur.
 sun.shadow.radius=clamp((.022+.105*Math.pow(clamp((softness-1)/4,0,1),1.5))/b.texel,1.2,7.0);
 sun.shadow.needsUpdate=true;return true;
}
export function sakuraLightProfileR227({day=1,direct=1,weather='sunny',strength=1,clouds=.35,fill=1}={}){
 const wet=['rain','snow','fog','overcast'].includes(weather),trans=clamp(1-clouds*.42,.55,1);
 const weatherDirect=({sunny:1,'after-rain':.70,overcast:.32,rain:.22,fog:.18,snow:.30})[weather]??1;
 return {sun:3.10*direct*weatherDirect*strength*trans,sky:(.14+1.15*day)*fill*(wet?1.20:1),bounce:.035+.25*day,environment:.10+.30*day,exposure:(wet?1.03:.96)*Math.pow(2,.32*day),shadowIntensity:wet?.76:.88,sunWeight:clamp(direct*weatherDirect,0,1)};
}
