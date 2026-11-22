// FORMA AI · V25. Kinetic Luxury: animate light ON THE ORIGINAL Möbius photograph, do not replace its silhouette.
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
    "float g(float v,float w){return exp(-pow(v/w,2.));}",
    "vec2 cover(vec2 uv){float c=uCanvas.x/uCanvas.y;float i=uSize.x/uSize.y;if(c<i)uv.x=(uv.x-.5)*c/i+.5;else uv.y=(uv.y-.5)*i/c+.5;return uv;}",
    "void main(){",
    "float p=6.2831853*uTime/18.;",
    "vec3 base=texture2D(uImage,clamp(cover(vUv),vec2(.001),vec2(.999))).rgb;",
    "float l=dot(base,vec3(.2126,.7152,.0722));",
    "float chroma=max(base.r,max(base.g,base.b))-min(base.r,min(base.g,base.b));",
    "vec2 a=(vUv-vec2(.665,.59))/vec2(.41,.43);",
    "float shape=(1.-smoothstep(.91,1.20,length(a)))*smoothstep(.34,.43,vUv.x);",
    "float metal=shape*smoothstep(.12,.48,l)*(1.-smoothstep(.17,.40,chroma));",
    "float travel=vUv.x+.3*vUv.y-(.77+.28*sin(p-.95)+uPointer.x*.012);",
    "float reflect=metal*(.16*g(travel,.11)+.26*g(travel-.02,.017)+.05*g(travel+.08,.035));",
    "float yellow=max(0.,base.r-max(base.g,base.b)*1.07);",
    "float channel=shape*smoothstep(.012,.13,yellow)*smoothstep(.08,.35,l);",
    "float beat=g(uTime-7.4,.19)+.57*g(uTime-7.86,.26);",
    "float route=.5+.5*sin(p+vUv.x*10.-vUv.y*7.4);",
    "float amber=channel*(.055+.23*beat+.06*route);",
    "vec2 floorP=(vUv-vec2(.78,.23))/vec2(.21,.105);",
    "float reflection=exp(-dot(floorP,floorP)*1.7)*smoothstep(.035,.17,base.r-base.b*.91)*(.008+.024*beat);",
    "float alpha=clamp(reflect*.51+amber*.38+reflection,0.,.23);",
    "float warmth=clamp((amber+reflection)/(reflect+amber+reflection+.0001),0.,1.);",
    "gl_FragColor=vec4(mix(vec3(.90,.95,1.),vec3(1.,.61,.30),warmth),alpha);",
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