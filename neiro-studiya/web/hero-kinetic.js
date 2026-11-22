// FORMA AI · Kinetic Luxury V19. Cinematic 12-second 2.5D material/light loop.
// The approved photograph stays intact; independent 3D motion requires real geometry.
(() => {
  const hero=document.querySelector('#hero'), art=hero?.querySelector('.hero-art');
  const photo=art?.querySelector('img'), canvas=document.querySelector('#hero-kinetic-canvas');
  if(!hero||!art||!photo||!canvas)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(navigator.connection?.saveData){art.classList.add('kinetic-low-data');return;}
  if(reduced.matches||!window.WebGLRenderingContext)return;
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
  if(!gl)return;
  const vertex='attribute vec2 aP;varying vec2 vUv;void main(){vUv=aP*.5+.5;gl_Position=vec4(aP,0.,1.);}';
  const fragment=[
    'precision highp float;',
    'varying vec2 vUv;uniform sampler2D uImage;uniform vec2 uCanvas,uSize,uPointer;uniform float uTime;',
    'vec2 cover(vec2 uv){float c=uCanvas.x/uCanvas.y;float i=uSize.x/uSize.y;if(c<i)uv.x=(uv.x-.5)*c/i+.5;else uv.y=(uv.y-.5)*i/c+.5;return uv;}',
    'float beat(float t,float at,float w){return exp(-pow((t-at)/w,2.));}',
    'void main(){',
    'float a=6.2831853*uTime/12.;float right=smoothstep(.33,.57,vUv.x);',
    'vec2 drift=vec2((.0028*sin(a)+uPointer.x*.002)*right,(.0019*sin(a+.52)+uPointer.y*.0015)*right);',
    'vec3 src=texture2D(uImage,clamp(cover(vUv+drift),vec2(.001),vec2(.999))).rgb;',
    'float luminosity=dot(src,vec3(.2126,.7152,.0722));',
    'float saturation=max(src.r,max(src.g,src.b))-min(src.r,min(src.g,src.b));',
    'float metallic=smoothstep(.14,.46,luminosity)*(1.-smoothstep(.13,.34,saturation))*right;',
    'float amber=smoothstep(.055,.22,src.r-src.b)*smoothstep(.10,.31,src.r)*right;',
    'float stripe=vUv.x+.43*vUv.y-(.82+.24*sin(a-.67));',
    'float glint=metallic*(.10*exp(-pow(stripe/.038,2.))+.026*exp(-pow(stripe/.13,2.)));',
    'float doubleBeat=beat(uTime,6.15,.10)+.62*beat(uTime,6.51,.14);',
    'float current=.5+.5*sin(a+vUv.x*9.4-vUv.y*6.3);',
    'float energy=amber*(.026*current+.12*doubleBeat);',
    'float hub=exp(-pow((vUv.x-.72)/.20,2.)-pow((vUv.y-.52)/.31,2.));',
    'vec3 result=src+vec3(.88,.92,.96)*glint+vec3(1.,.55,.16)*energy+vec3(.35,.53,.72)*metallic*hub*(.012+.012*sin(a+1.2));',
    'gl_FragColor=vec4(min(result,vec3(1.)),1.);',
    '}'
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
  const frameInterval=matchMedia('(max-width:700px)').matches?1000/24:1000/30;
  const render=()=>{gl.useProgram(program);gl.uniform1f(uTime,elapsed%12);gl.uniform2f(uPointer,current[0],current[1]);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);};
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
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed=(elapsed+dt)%12;
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