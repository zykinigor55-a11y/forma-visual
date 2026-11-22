// FORMA AI · V26. Animate existing mechanical gear pixels and gliding titanium edge light on the original photograph.
// The original img remains visible at full opacity. Transparent WebGL adds material-aware light only.
(() => {
  const hero=document.querySelector('#hero'), art=hero?.querySelector('.hero-art');
  const photo=art?.querySelector('img'), canvas=document.querySelector('#hero-kinetic-canvas');
  if(!hero||!art||!photo||!canvas)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(navigator.connection?.saveData){art.classList.add('kinetic-low-data');return;}
  if(reduced.matches||!window.WebGLRenderingContext)return;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power',premultipliedAlpha:false});
  if(!gl)return;
  const vertex='attribute vec2 aP;varying vec2 vUv;void main(){vUv=aP*.5+.5;gl_Position=vec4(aP,0.,1.);}';
  const fragment=[
    "precision highp float;",
    "varying vec2 vUv;uniform sampler2D uImage;uniform vec2 uCanvas,uSize,uPointer;uniform float uTime;",
    "const float TAU=6.28318530718;",
    "float g(float x,float w){return exp(-pow(x/w,2.));}",
    "float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}",
    "vec2 cover(vec2 uv){float c=uCanvas.x/uCanvas.y,i=uSize.x/uSize.y;if(c<i)uv.x=(uv.x-.5)*c/i+.5;else uv.y=(uv.y-.5)*i/c+.5;return uv;}",
    "vec2 turnGear(vec2 uv,vec2 center,vec2 radius,float a){vec2 q=(uv-center)/radius;float co=cos(a),si=sin(a);return center+vec2(co*q.x-si*q.y,si*q.x+co*q.y)*radius;}",
    "void main(){",
    "float phase=TAU*uTime/18.;",
    "vec2 uv=clamp(cover(vUv),vec2(.001),vec2(.999));",
    "vec3 base=texture2D(uImage,uv).rgb;",
    "float l=luma(base);",
    "float chroma=max(base.r,max(base.g,base.b))-min(base.r,min(base.g,base.b));",
    "vec2 zone=(uv-vec2(.67,.54))/vec2(.46,.47);",
    "float ribbon=(1.-smoothstep(.96,1.20,length(zone)))*smoothstep(.33,.42,uv.x);",
    "float metal=ribbon*smoothstep(.14,.52,l)*(1.-smoothstep(.19,.38,chroma));",
    "float stream=uv.x+.33*uv.y-(.78+.30*sin(phase-1.05)+uPointer.x*.009);",
    "float brushed=metal*(.15*g(stream,.12)+.32*g(stream-.016,.023)+.042*g(stream+.078,.041));",
    "vec2 px=vec2(2.5)/uSize;",
    "float dx=abs(luma(texture2D(uImage,clamp(uv+vec2(px.x,0.),vec2(.001),vec2(.999))).rgb)-l);",
    "float dy=abs(luma(texture2D(uImage,clamp(uv+vec2(0.,px.y),vec2(.001),vec2(.999))).rgb)-l);",
    "float ridge=metal*smoothstep(.045,.19,dx+dy);",
    "float travelling=exp(-pow((uv.x-.39-.44*(.5+.5*sin(phase-.9)))/.15,2.));",
    "float edgeLight=ridge*(.045+.44*travelling);",
    "float yellow=max(0.,base.r-max(base.g,base.b)*1.075);",
    "float channel=ribbon*smoothstep(.013,.12,yellow)*smoothstep(.06,.33,l);",
    "float beat=g(uTime-7.45,.18)+.58*g(uTime-7.88,.22);",
    "float route=.5+.5*sin(phase+uv.x*12.-uv.y*6.);",
    "float amber=channel*(.055+.24*beat+.06*route);",
    "vec2 floorP=(uv-vec2(.79,.16))/vec2(.25,.105);",
    "float floorLight=g(length(floorP),.93)*smoothstep(.025,.17,base.r-base.b*.91)*(.011+.032*beat);",
    "float lightAlpha=clamp((brushed*.58+edgeLight*.50+amber*.39+floorLight),0.,.27);",
    "float warmMix=clamp((amber+floorLight)/(brushed+edgeLight+amber+floorLight+.0001),0.,1.);",
    "vec3 lightColor=mix(vec3(.91,.95,1.),vec3(1.,.61,.33),warmMix);",
    "// Sub-pixel accurate photo-texture gear rotation in the existing upper-left mechanism.",
    "vec2 g1=vec2(.482,.745),r1=vec2(.029,.050);",
    "vec2 g2=vec2(.544,.814),r2=vec2(.023,.039);",
    "float dist1=length((uv-g1)/r1),dist2=length((uv-g2)/r2);",
    "float mask1=1.-smoothstep(.76,.96,dist1);",
    "float mask2=1.-smoothstep(.77,.96,dist2);",
    "vec3 gear=base;float spin=0.;",
    "if(mask1>.002){vec2 p=turnGear(uv,g1,r1,-phase);gear=mix(gear,texture2D(uImage,clamp(p,vec2(.001),vec2(.999))).rgb,mask1);spin=mask1;}",
    "if(mask2>.002){vec2 p=turnGear(uv,g2,r2,phase*2.);vec3 part=texture2D(uImage,clamp(p,vec2(.001),vec2(.999))).rgb;gear=mix(gear,part,mask2);spin=1.-(1.-spin)*(1.-mask2);}",
    "// Cover only the moving gear interiors: the original titanium ribbon stays untouched.",
    "float outA=spin+(1.-spin)*lightAlpha;",
    "vec3 outRGB=(gear*spin+lightColor*lightAlpha*(1.-spin))/max(outA,.00001);",
    "gl_FragColor=vec4(outRGB,outA);",
    "}"
  ].join('\n');
  const compile=(type,source)=>{
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  let program,texture;
  try{
    const v=compile(gl.VERTEX_SHADER,vertex),f=compile(gl.FRAGMENT_SHADER,fragment);
    program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
    gl.deleteShader(v);gl.deleteShader(f);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'aP');gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program,'uImage'),0);
  }catch(error){console.info('FORMA AI: using static hero lighting fallback',error);return;}
  const uSize=gl.getUniformLocation(program,'uSize'),uCanvas=gl.getUniformLocation(program,'uCanvas');
  const uTime=gl.getUniformLocation(program,'uTime'),uPointer=gl.getUniformLocation(program,'uPointer');
  let elapsed=0,last=0,lastPaint=0,request=0,visible=false,active=true;
  const current=[0,0],target=[0,0];
  const frameInterval=matchMedia('(max-width:900px)').matches?1000/22:1000/30;
  const render=()=>{gl.useProgram(program);gl.uniform1f(uTime,elapsed%18);gl.uniform2f(uPointer,current[0],current[1]);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);};
  const resize=()=>{
    if(!active)return;
    const rect=art.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,rect.width<680?1:1.35);
    const cap=Math.min(1,Math.sqrt(1600000/(rect.width*rect.height*dpr*dpr)));
    const width=Math.max(1,Math.round(rect.width*dpr*cap)),height=Math.max(1,Math.round(rect.height*dpr*cap));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);gl.uniform2f(uCanvas,width,height);render();
  };
  const tick=now=>{
    if(!active||!visible||document.hidden||reduced.matches){request=0;return;}
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed=(elapsed+dt)%18;
    const smoothing=Math.min(1,dt*3.5+.025);
    current[0]+=(target[0]-current[0])*smoothing;current[1]+=(target[1]-current[1])*smoothing;
    if(!lastPaint||now-lastPaint>=frameInterval){render();lastPaint=now;}
    request=requestAnimationFrame(tick);
  };
  const stop=()=>{cancelAnimationFrame(request);request=0;last=lastPaint=0;};
  const start=()=>{if(visible&&active&&!document.hidden&&!reduced.matches&&!request)request=requestAnimationFrame(tick);};
  const resizeObserver=new ResizeObserver(resize);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();},{rootMargin:'90px'});
  const begin=()=>{
    if(!active||!photo.naturalWidth)return;
    try{
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,photo);
      gl.uniform2f(uSize,photo.naturalWidth,photo.naturalHeight);resize();
    }catch(e){console.warn('Hero image could not be used as a texture',e);return;}
    art.classList.add('kinetic-ready');resizeObserver.observe(art);observer.observe(hero);
    if(matchMedia('(pointer:fine)').matches){
      hero.addEventListener('pointermove',event=>{
        const rect=hero.getBoundingClientRect();
        target[0]=Math.max(-1,Math.min(1,2*(event.clientX-rect.left)/rect.width-1));
        target[1]=Math.max(-1,Math.min(1,2*(event.clientY-rect.top)/rect.height-1));
      },{passive:true});
      hero.addEventListener('pointerleave',()=>{target[0]=target[1]=0;});
    }
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
    reduced.addEventListener('change',()=>{if(reduced.matches){stop();art.classList.remove('kinetic-ready');}else{art.classList.add('kinetic-ready');start();}});
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();active=false;stop();observer.disconnect();resizeObserver.disconnect();art.classList.remove('kinetic-ready');
    },{once:true});
  };
  if(photo.complete)begin();else photo.addEventListener('load',begin,{once:true});
})();