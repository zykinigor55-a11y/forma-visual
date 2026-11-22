// NEIRO STUDIO | Interactive titanium spiral. No external model files required.
const video = document.getElementById('quantum-video');
const sound = document.getElementById('sound-toggle');
const soundText = sound.querySelector('.sound-label');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let audioEnabled = false;
const updateSound = () => {
  video.muted = !audioEnabled;
  sound.setAttribute('aria-pressed', String(audioEnabled));
  sound.setAttribute('aria-label', audioEnabled ? 'Выключить звук реактора' : 'Включить звук реактора');
  soundText.textContent = audioEnabled ? 'Звук вкл.' : 'Звук выкл.';
};
updateSound();
sound.addEventListener('click', async () => {
  audioEnabled = !audioEnabled;
  updateSound();
  try { if(video.paused) await video.play(); }
  catch(e) { audioEnabled = false; updateSound(); console.warn('Видео заблокировано браузером:',e); }
});
video.addEventListener('error', () => {
  document.getElementById('video-error').hidden=false;
  sound.disabled=true;
  sound.title='Видеофайл не загружен';
});
video.addEventListener('canplay', ()=>{ document.getElementById('video-error').hidden=true; });
if (reduceMotion.matches) { video.pause(); video.controls=true; }
else {
  const watcher = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) video.pause();
      else video.play().catch(()=>{});
    }
  }, {threshold:.06});
  watcher.observe(video);
}

// TITANIUM SPIRAL V16 — engineered double helix; V14 video logic above stays intact.
const visual = document.getElementById('spiral-visual');
const canvas = document.getElementById('spiral-canvas');

async function initSpiral() {
  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (error) {
    console.info('Three.js unavailable; keeping the SVG titanium spiral.', error);
    return;
  }
  if (!visual || !canvas || !visual.isConnected) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, powerPreference: 'high-performance'
    });
  } catch (error) {
    console.info('WebGL unavailable; keeping the SVG spiral.', error);
    return;
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = () => window.innerWidth < 740;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile() ? 1.3 : 1.7));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 90);
  camera.position.set(0, .05, 11.35);
  camera.lookAt(0, 0, 0);
  const stage = new THREE.Group();
  const helix = new THREE.Group();
  const inner = new THREE.Group();
  stage.add(helix, inner);
  scene.add(stage);
  scene.add(new THREE.HemisphereLight(0xc9d7e6, 0x14191f, 1.05));
  const key = new THREE.DirectionalLight(0xf0f5fa, 3.6);
  key.position.set(-3.5, 6, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9db9d4, 3.8);
  rim.position.set(4, 1, -5);
  scene.add(rim);
  const low = new THREE.DirectionalLight(0xd5bba1, 1.0);
  low.position.set(1.5, -5, 3);
  scene.add(low);
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), .05);
    scene.environment = environment.texture;
    pmrem.dispose();
  } catch (error) {
    console.warn('Procedural studio reflections unavailable.', error);
  }

  // Procedural fine horizontal grain: brushed titanium, no external textures.
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 256;
  grainCanvas.height = 256;
  const context = grainCanvas.getContext('2d');
  if (context) {
    const grain = context.createImageData(256, 256);
    let seed = 81733;
    const rand = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    for (let y = 0; y < 256; y++) {
      const line = 194 + 26 * (rand() - .5) + 10 * Math.sin(y * .49);
      for (let x = 0; x < 256; x++) {
        const i = (y * 256 + x) * 4;
        const v = Math.max(125, Math.min(240, line + (rand() - .5) * 17));
        grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = v;
        grain.data[i + 3] = 255;
      }
    }
    context.putImageData(grain, 0, 0);
  }
  const brushing = new THREE.CanvasTexture(grainCanvas);
  brushing.wrapS = brushing.wrapT = THREE.RepeatWrapping;
  brushing.colorSpace = THREE.NoColorSpace;
  brushing.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);

  const titanium = new THREE.MeshPhysicalMaterial({
    color: 0x9eaab8, metalness: .96, roughness: .28, roughnessMap: brushing,
    clearcoat: .14, clearcoatRoughness: .21, envMapIntensity: 1.65, side: THREE.DoubleSide
  });
  const titaniumShadow = new THREE.MeshPhysicalMaterial({
    color: 0x65707c, metalness: .97, roughness: .36, roughnessMap: brushing,
    clearcoat: .10, envMapIntensity: 1.48, side: THREE.DoubleSide
  });
  const polished = new THREE.MeshPhysicalMaterial({
    color: 0xd0d9df, metalness: .95, roughness: .16, envMapIntensity: 1.9
  });
  const gasket = new THREE.MeshStandardMaterial({
    color: 0x19242e, metalness: .76, roughness: .42
  });
  const metalCore = new THREE.MeshPhysicalMaterial({
    color: 0x4f6574, metalness: .94, roughness: .28, envMapIntensity: 1.7
  });
  const energyBlue = new THREE.MeshBasicMaterial({
    color: 0x8ccddd, transparent: true, opacity: .74,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const energyWarm = new THREE.MeshBasicMaterial({
    color: 0xcbb49a, transparent: true, opacity: .51,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const glowBlue = energyBlue.clone();
  glowBlue.opacity = .13;
  const glowWarm = energyWarm.clone();
  glowWarm.opacity = .09;
  const silverHaze = new THREE.MeshBasicMaterial({
    color: 0xa2c9d4, transparent: true, opacity: .27, depthWrite: false
  });

  const TAU = Math.PI * 2, HEIGHT = 5.0, TURNS = 2.35;
  const SEGMENTS = mobile() ? 285 : 365, SIDES = 20;
  const winding = (u, phase) => {
    const a = TAU * TURNS * u + phase;
    const radius = 1.055 + .062 * Math.cos(u * TAU);
    const deriv = -.062 * TAU * Math.sin(u * TAU);
    const center = new THREE.Vector3(radius * Math.cos(a), (u - .5) * HEIGHT, radius * Math.sin(a));
    const tangent = new THREE.Vector3(
      deriv * Math.cos(a) - radius * Math.sin(a) * TAU * TURNS,
      HEIGHT,
      deriv * Math.sin(a) + radius * Math.cos(a) * TAU * TURNS
    ).normalize();
    const radial = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const across = radial.addScaledVector(tangent, -radial.dot(tangent)).normalize();
    const depth = new THREE.Vector3().crossVectors(tangent, across).normalize();
    return { center, across, depth };
  };
  const routes = [];
  function makeRibbon(phase, material, mainGlow, haloGlow) {
    const positions = [], uvs = [], faces = [];
    const left = [], right = [], inset = [], seam = [], lit = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const u = i / SEGMENTS;
      const { center, across, depth } = winding(u, phase);
      for (let j = 0; j < SIDES; j++) {
        const a = TAU * j / SIDES;
        const p = center.clone().addScaledVector(across, .242 * Math.cos(a))
          .addScaledVector(depth, .054 * Math.sin(a));
        positions.push(p.x, p.y, p.z);
        uvs.push(u * 9, j / (SIDES - 1));
      }
      left.push(center.clone().addScaledVector(across, .243));
      right.push(center.clone().addScaledVector(across, -.243));
      inset.push(center.clone().addScaledVector(across, .192).addScaledVector(depth, .026));
      seam.push(center.clone().addScaledVector(depth, .055));
      lit.push(center.clone().addScaledVector(depth, .069));
    }
    for (let i = 0; i < SEGMENTS; i++) {
      for (let j = 0; j < SIDES; j++) {
        const a = i * SIDES + j, b = i * SIDES + (j + 1) % SIDES;
        const c = (i + 1) * SIDES + j, d = (i + 1) * SIDES + (j + 1) % SIDES;
        faces.push(a, c, b, b, c, d);
      }
    }
    for (const cap of [0, SEGMENTS]) {
      const start = cap * SIDES;
      for (let j = 1; j < SIDES - 1; j++) {
        if (cap === 0) faces.push(start, start + j + 1, start + j);
        else faces.push(start, start + j, start + j + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(faces);
    geo.computeVertexNormals();
    helix.add(new THREE.Mesh(geo, material));
    const tube = (points, radius, mat, radial = 6) => {
      const curve = new THREE.CatmullRomCurve3(points);
      helix.add(new THREE.Mesh(new THREE.TubeGeometry(curve, SEGMENTS, radius, radial, false), mat));
      return curve;
    };
    tube(left, .010, polished);
    tube(right, .010, polished);
    tube(inset, .007, gasket);
    tube(seam, .027, gasket);
    tube(lit, .048, haloGlow, 7);
    const route = tube(lit, .0105, mainGlow, 7);
    routes.push(route);
  }
  makeRibbon(0, titanium, energyBlue, glowBlue);
  makeRibbon(Math.PI, titaniumShadow, energyWarm, glowWarm);

  // A small, precise machine inside the open helix, not a decorative giant orb.
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(.063, .063, 4.65, 20), metalCore);
  inner.add(spindle);
  const rotor = new THREE.Group();
  inner.add(rotor);
  const ring = (radius, thick, y, mat, parent = rotor) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thick, 9, 80), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = y;
    parent.add(mesh);
    return mesh;
  };
  for (const y of [-2.1, -1.35, -.6, .6, 1.35, 2.1]) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .052, 24), polished);
    collar.position.y = y;
    inner.add(collar);
    ring(.18, .009, y, gasket, inner);
  }
  ring(.39, .026, -.16, polished);
  ring(.39, .026, .16, polished);
  ring(.325, .014, 0, metalCore);
  const nucleus = new THREE.Mesh(
    new THREE.IcosahedronGeometry(.21, 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x7cbaca, metalness: .65, roughness: .14,
      clearcoat: .8, transmission: .10, thickness: .4, envMapIntensity: 1.2
    })
  );
  rotor.add(nucleus);
  const coreLight = new THREE.PointLight(0x78c9dd, 1.25, 3.3);
  inner.add(coreLight);

  // GPU-instanced spark packets travel directly inside the two milled channels.
  const dummy = new THREE.Object3D();
  const packetGeometry = new THREE.SphereGeometry(.021, 8, 6);
  const packets = [energyBlue, energyWarm].map(mat => {
    const instanced = new THREE.InstancedMesh(packetGeometry, mat.clone(), 9);
    instanced.frustumCulled = false;
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    helix.add(instanced);
    return instanced;
  });
  const moteGeometry = new THREE.SphereGeometry(.011, 5, 4);
  const motes = new THREE.InstancedMesh(moteGeometry, silverHaze, 42);
  let noise = 12733;
  const random = () => { noise = (noise * 16807) % 2147483647; return noise / 2147483647; };
  for (let i = 0; i < 42; i++) {
    const angle = random() * TAU, radius = 1.25 + random() * .55;
    dummy.position.set(Math.cos(angle) * radius, (random() - .5) * 5.3, Math.sin(angle) * radius);
    dummy.scale.setScalar(.55 + random() * 1.45);
    dummy.updateMatrix(); motes.setMatrixAt(i, dummy.matrix);
  }
  motes.instanceMatrix.needsUpdate = true;
  helix.add(motes);

  let inView = false, running = false, raf = 0;
  let elapsed = 0, last = 0, scroll = 0, pointerX = 0, pointerY = 0;
  let targetX = 0, targetY = 0, dragAngle = 0, dragging = false, dragX = 0;
  let disposed = false;
  function updateScroll() {
    const rect = visual.getBoundingClientRect();
    scroll = THREE.MathUtils.clamp(
      (window.innerHeight * .64 - rect.top) / (window.innerHeight + rect.height), 0, 1
    );
  }
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });
  const onMove = event => {
    const rect = visual.getBoundingClientRect();
    targetX = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width - .5) * 2, -1, 1);
    targetY = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height - .5) * 2, -1, 1);
    if (dragging && event.pointerId === dragId) {
      dragAngle += (event.clientX - dragX) * .007;
      dragX = event.clientX;
    }
  };
  let dragId = -1;
  visual.addEventListener('pointermove', onMove, { passive: true });
  visual.addEventListener('pointerleave', () => {
    if (!dragging) { targetX = 0; targetY = 0; }
  });
  visual.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || reducedMotion.matches) return;
    dragging = true;
    dragId = event.pointerId;
    dragX = event.clientX;
    visual.setPointerCapture(event.pointerId);
    visual.classList.add('dragging');
  });
  const release = () => {
    dragging = false;
    dragId = -1;
    visual.classList.remove('dragging');
  };
  visual.addEventListener('pointerup', release);
  visual.addEventListener('pointercancel', release);
  visual.addEventListener('lostpointercapture', release);
  canvas.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') dragAngle -= .24;
    else if (event.key === 'ArrowRight') dragAngle += .24;
    else if (event.key === 'Home') dragAngle = 0;
    else return;
    event.preventDefault();
    if (reducedMotion.matches) draw(0);
  });

  const beat = t => {
    const phase = t % 1.38;
    return Math.exp(-Math.pow((phase - .16) / .063, 2)) +
      .55 * Math.exp(-Math.pow((phase - .35) / .081, 2));
  };
  function draw(dt) {
    const moving = !reducedMotion.matches;
    if (moving) elapsed += dt;
    pointerX += (targetX - pointerX) * Math.min(1, dt * 4.8 + .035);
    pointerY += (targetY - pointerY) * Math.min(1, dt * 4.8 + .035);
    const targetRotation = .3 + scroll * 1.05 + dragAngle +
      pointerX * .23 + (moving ? elapsed * .065 : 0);
    stage.rotation.y += (targetRotation - stage.rotation.y) * Math.min(1, dt * 3.3 + .035);
    stage.rotation.x += (-.09 - pointerY * .14 - stage.rotation.x) * Math.min(1, dt * 3.3 + .035);
    stage.rotation.z = moving ? Math.sin(elapsed * .24) * .016 : 0;
    helix.rotation.y = moving ? Math.sin(elapsed * .18) * .028 : 0;
    rotor.rotation.y = moving ? -elapsed * .16 : 0;
    rotor.rotation.x = moving ? Math.sin(elapsed * .26) * .085 : 0;
    const pulse = moving ? beat(elapsed) : 0;
    coreLight.intensity = 1.15 + pulse * 1.0;
    nucleus.scale.setScalar(1 + pulse * .065);
    energyBlue.opacity = .58 + .13 * pulse;
    energyWarm.opacity = .39 + .11 * pulse;
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < 9; i++) {
        const u = ((i / 9) + elapsed * (side ? -.07 : .09) + 1) % 1;
        dummy.position.copy(routes[side].getPointAt(u));
        dummy.scale.setScalar((.6 + .35 * Math.sin(i * 2.3 + elapsed * 1.8)) * (1 + pulse * .27));
        dummy.updateMatrix();
        packets[side].setMatrixAt(i, dummy.matrix);
      }
      packets[side].instanceMatrix.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }
  const frame = time => {
    if (!running || disposed) return;
    const dt = last ? Math.min((time - last) / 1000, .05) : 0;
    last = time;
    draw(dt);
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };
  const start = () => {
    if (disposed || !inView || document.hidden || running) return;
    if (reducedMotion.matches) { draw(0); return; }
    running = true;
    raf = requestAnimationFrame(frame);
  };
  const onResize = () => {
    if (disposed) return;
    const width = Math.max(1, visual.clientWidth), height = Math.max(1, visual.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile() ? 1.3 : 1.7));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 510 ? 42 : 34;
    camera.updateProjectionMatrix();
    updateScroll();
    draw(0);
    visual.classList.add('loaded');
  };
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(visual);
  onResize();
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) start();
    else stop();
  }, { rootMargin: '100px' });
  observer.observe(visual);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  reducedMotion.addEventListener('change', () => {
    stop();
    start();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    disposed = true;
    stop();
    resizeObserver.disconnect();
    observer.disconnect();
    visual.classList.remove('loaded');
  });
}
initSpiral();
