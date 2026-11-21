/* FORMA VISUAL / opal garden globe optical shell, based on user's uploaded
 * reference showing several white, internally glowing lawn spheres.
 * Real authored three.js meshes, no baked visual representation.
 */
export function createTranslucentOpalGlobe(T,group,{diameter=.4,night=false,brightness=1,kelvin=2700}={}){
 const radius=diameter*.5;
 const power=night?Math.max(0,Math.min(2,Number(brightness)||0)):0;
 const tints={2200:'#ffd5a0',2700:'#ffe6c4',3000:'#ffecdb',4000:'#f4f4f1'};
 const tint=tints[Number(kelvin)]||tints[2700];
 const vec=(c)=>new T.Color(c);
 const material=new T.ShaderMaterial({
  uniforms:{
   glow:{value:power},
   nightMode:{value:night?1:0},
   warm:{value:vec(tint)},
   cold:{value:vec('#d7dbd5')},
   milky:{value:vec('#f4f1ea')}
  },
  vertexShader:`
   varying vec3 vNormalView;
   varying vec3 vViewDirection;
   varying float vUp;
   void main(){
    vec4 mv=modelViewMatrix*vec4(position,1.0);
    vNormalView=normalize(normalMatrix*normal);
    vViewDirection=normalize(-mv.xyz);
    vUp=normal.y;
    gl_Position=projectionMatrix*mv;
   }`,
  fragmentShader:`
   uniform float glow,nightMode;
   uniform vec3 warm,cold,milky;
   varying vec3 vNormalView,vViewDirection;
   varying float vUp;
   void main(){
    float face=clamp(abs(dot(normalize(vNormalView),normalize(vViewDirection))),0.0,1.0);
    float rim=pow(1.0-face,1.65);
    float lit=clamp(glow,0.0,1.9);
    vec3 offColor=mix(cold,milky,clamp(.50+vUp*.10,0.0,1.0));
    // At night an unpowered ball must not be permanently bright white.
    // Daylight still shows natural pale-grey opal polyethylene.
    offColor*=mix(1.0,.14+.86*min(1.0,lit),nightMode);
    // Warm luminous volume is strongest in the center, where the real
    // translucent polyethylene carries shortest light path to the eye.
    vec3 onColor=mix(milky,warm,.18+.08*(1.0-face));
    vec3 colour=mix(offColor,onColor,min(1.0,lit)*.86);
    colour+=warm*(lit*.30)*(.48+.52*face);
    colour*=.91+.07*face;
    float opacity=mix(.74,.965,rim);
    gl_FragColor=vec4(colour,opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`,
  side:T.FrontSide,transparent:true,depthWrite:false,toneMapped:true
 });
 // Soft-focus inner emitting volume; its edge fades rather than showing a
 // solid opaque ball through the translucent polyethylene.
 if(power>0){
  const coreMaterial=new T.ShaderMaterial({
   uniforms:{glow:{value:Math.min(1.8,power)},warm:{value:vec(tint)}},
   vertexShader:`
    varying vec3 vN,vV;
    void main(){
     vec4 mv=modelViewMatrix*vec4(position,1.0);
     vN=normalize(normalMatrix*normal);
     vV=normalize(-mv.xyz);
     gl_Position=projectionMatrix*mv;
    }`,
   fragmentShader:`
    uniform float glow;
    uniform vec3 warm;
    varying vec3 vN,vV;
    void main(){
     float face=abs(dot(normalize(vN),normalize(vV)));
     float feather=smoothstep(.12,.84,face);
     gl_FragColor=vec4(warm*(.94+.12*glow),min(.34,glow*.27)*feather);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`,
   side:T.FrontSide,transparent:true,depthWrite:false,toneMapped:true
  });
  const core=new T.Mesh(new T.SphereGeometry(radius*.87,40,28),coreMaterial);
  core.position.y=radius*.99;
  core.castShadow=false;core.receiveShadow=false;core.renderOrder=1;
  core.userData.fixturePart='soft-diffusing-inner-LED-volume';
  group.add(core);
 }
 const baseMat=new T.MeshStandardMaterial({color:'#222529',roughness:.84,metalness:.1});
 const disk=new T.Mesh(new T.CylinderGeometry(radius*.27,radius*.30,.009,48),baseMat);
 disk.position.y=-.027;
 disk.castShadow=false;disk.receiveShadow=false;
 disk.userData.fixturePart='buried-IP-rated-support';
 group.add(disk);
 const globe=new T.Mesh(new T.SphereGeometry(radius,72,48),material);
 globe.scale.y=.99;globe.position.y=radius*.99;
 globe.castShadow=false; // critical: don't occlude the actual internal point light
 globe.receiveShadow=false;globe.renderOrder=2;
 globe.userData.fixturePart='uniform-seamless-opal-polyethylene-ball';
 group.add(globe);
 if(power>0&&typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createRadialGradient(64,64,15,64,64,64);
  grad.addColorStop(0,'rgba(255,243,219,0.0)');
  grad.addColorStop(.40,'rgba(255,232,203,.035)');
  grad.addColorStop(.78,'rgba(255,229,192,.045)');
  grad.addColorStop(1,'rgba(255,229,192,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const sprite=new T.Sprite(new T.SpriteMaterial({
   map:new T.CanvasTexture(canvas),transparent:true,
   blending:T.AdditiveBlending,opacity:Math.min(.40,power*.25),
   color:tint,depthWrite:false,depthTest:true,toneMapped:false
  }));
  sprite.scale.set(diameter*2.25,diameter*2.25,1);
  sprite.position.y=radius*.99;
  sprite.renderOrder=3;
  sprite.userData.fixturePart='subtle-photographic-halo';
  group.add(sprite);
 }
 group.userData.sphereDiameter=diameter;
 group.userData.globeOptics={
  diffuseShell:true,visibleLightVolume:true,noOpaqueSelfShadow:true,
  shellMaterial:'angular milky polyethylene scattering',diameter
 };
 return globe;
}
