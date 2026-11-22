// NEIRO STUDIO | Quantum Kinetic V14 video + independent Möbius sculpture. No external model files required.
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
// NEIRO STUDIO / FORMA AI — MOBIUS KINETIC V17
// Unlike a helix, each band is one genuine half-twisted closed Möbius loop.
// The manufactured thick ribbon uses a rounded rectangular cross-section.
// A 180° section twist maps section j to j + C/2 at the closed seam.
const visual = document.getElementById('spiral-visual');
const canvas = document.getElementById('spiral-canvas');

async function initMobius() {
  if (!visual || !canvas) return;
  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (error) {
    console.info('3D engine unavailable; using the built-in Möbius SVG.', error);
    return;
  }
  if (!visual.isConnected) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, powerPreference: 'high-performance'
    });
  } catch (error) {
    console.info('WebGL unavailable; using the Möbius SVG.', error);
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = () => visual.clientWidth < 520;
  const DPR = () => Math.min(window.devicePixelRatio || 1, isMobile() ? 1.35 : 1.7);
  renderer.setPixelRatio(DPR());
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 80);
  camera.position.set(0, .02, 11.1);
  camera.lookAt(0, 0, 0);
  const sculpture = new THREE.Group();
  scene.add(sculpture);
  scene.add(new THREE.HemisphereLight(0xc8d7e6, 0x13151d, 1.05));
  const key = new THREE.DirectionalLight(0xf1f4f8, 3.2);
  key.position.set(-4, 5.5, 7);
  scene.add(key);
  const back = new THREE.DirectionalLight(0x9eb7d1, 3.0);
  back.position.set(5, 1, -5);
  scene.add(back);
  const amberBounce = new THREE.DirectionalLight(0xd8b9a1, .65);
  amberBounce.position.set(-2, -4, 4);
  scene.add(amberBounce);
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), .05);
    scene.environment = env.texture;
    pmrem.dispose();
  } catch (error) {
    console.info('Studio reflection environment unavailable.', error);
  }

  // Reproducible micro-brushing, supplied locally without external texture assets.
  const grain = document.createElement('canvas');
  grain.width = grain.height = 256;
  const g = grain.getContext('2d');
  if (g) {
    const pixels = g.createImageData(256, 256);
    let seed = 932117;
    const rand = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let y = 0; y < 256; y++) {
      const brushedLine = 193 + 23 * (rand() - .5) + 7 * Math.sin(y * .41);
      for (let x = 0; x < 256; x++) {
        const j = (y * 256 + x) * 4;
        const v = Math.max(120, Math.min(240, brushedLine + 15 * (rand() - .5)));
        pixels.data[j] = pixels.data[j + 1] = pixels.data[j + 2] = v;
        pixels.data[j + 3] = 255;
      }
    }
    g.putImageData(pixels, 0, 0);
  }
  const brushMap = new THREE.CanvasTexture(grain);
  brushMap.wrapS = brushMap.wrapT = THREE.RepeatWrapping;
  brushMap.colorSpace = THREE.NoColorSpace;
  brushMap.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xa5afba, metalness: .97, roughness: .29,
    roughnessMap: brushMap, clearcoat: .13,
    clearcoatRoughness: .24, envMapIntensity: 1.8
  });
  const graphite = new THREE.MeshPhysicalMaterial({
    color: 0x67717d, metalness: .97, roughness: .37,
    roughnessMap: brushMap, clearcoat: .10,
    envMapIntensity: 1.55
  });
  const edgeMetal = new THREE.MeshPhysicalMaterial({
    color: 0xd8dfe6, metalness: .96, roughness: .17, envMapIntensity: 2
  });
  const darkChannel = new THREE.MeshStandardMaterial({
    color: 0x111a23, metalness: .75, roughness: .45
  });
  const screwMetal = new THREE.MeshStandardMaterial({
    color: 0x242d36, metalness: .86, roughness: .28
  });
  const shaftMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x566675, metalness: .95, roughness: .23, envMapIntensity: 1.5
  });
  const makeLight = (color, opacity) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const blue = makeLight(0x84cbdf, .63);
  const warm = makeLight(0xd9b08b, .48);
  const blueHalo = makeLight(0x72bfdb, .085);
  const warmHalo = makeLight(0xdda376, .075);

  const TAU = Math.PI * 2;
  const Z = new THREE.Vector3(0, 0, 1);
  const signPow = (v, exponent) => Math.sign(v) * Math.pow(Math.abs(v), exponent);
  const segments = isMobile() ? 240 : 320;
  const sides = 24; // Must be even, for the Möbius closure.
  const loops = [];

  function makeBand(index, position, initialRotation, radius, material, energy, halo) {
    const band = new THREE.Group();
    band.position.set(...position);
    band.rotation.set(...initialRotation);
    sculpture.add(band);
    const width = .405, thickness = .050;
    const point = (u) => {
      const a = u, half = u * .5;
      const r = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
      const center = r.clone().multiplyScalar(radius);
      const across = r.clone().multiplyScalar(Math.cos(half)).addScaledVector(Z, Math.sin(half));
      const normal = r.clone().multiplyScalar(-Math.sin(half)).addScaledVector(Z, Math.cos(half));
      return { center, across, normal };
    };
    const positions = [], uvs = [], indices = [];
    // A flattened superellipse gives a real chamfered titanium plate, not a wire.
    for (let i = 0; i < segments; i++) {
      const u = i / segments * TAU;
      const { center, across, normal } = point(u);
      for (let j = 0; j < sides; j++) {
        const a = TAU * j / sides;
        const w = width * signPow(Math.cos(a), .33);
        const t = thickness * signPow(Math.sin(a), .33);
        const p = center.clone().addScaledVector(across, w).addScaledVector(normal, t);
        positions.push(p.x, p.y, p.z);
        uvs.push(u * 1.55, j / sides);
      }
    }
    for (let i = 0; i < segments; i++) {
      const following = (i + 1) % segments;
      const flipped = i === segments - 1 ? sides / 2 : 0;
      for (let j = 0; j < sides; j++) {
        const nextJ = (j + 1) % sides;
        const a = i * sides + j;
        const b = i * sides + nextJ;
        const c = following * sides + (j + flipped) % sides;
        const d = following * sides + (nextJ + flipped) % sides;
        indices.push(a, c, b, b, c, d);
      }
    }
    const surface = new THREE.BufferGeometry();
    surface.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    surface.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    surface.setIndex(indices);
    surface.computeVertexNormals();
    const plate = new THREE.Mesh(surface, material);
    plate.material.side = THREE.DoubleSide;
    band.add(plate);

    // Unlike a helix, a Möbius band has one continuous boundary:
    // follow the SAME side over TWO full turns (0 .. 4π).
    const outline = [];
    const crest = [];
    const samples = 440;
    for (let i = 0; i < samples; i++) {
      const u = i / samples * TAU * 2;
      const { center, across, normal } = point(u);
      outline.push(center.clone().addScaledVector(across, width + .005));
      crest.push(center.clone().addScaledVector(across, width + .013)
        .addScaledVector(normal, .011));
    }
    const outlineCurve = new THREE.CatmullRomCurve3(outline, true, 'centripetal');
    const energyCurve = new THREE.CatmullRomCurve3(crest, true, 'centripetal');
    const pipe = (curve, size, mat, radial = 6) => {
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 560, size, radial, true), mat
      );
      band.add(mesh);
    };
    pipe(outlineCurve, .014, edgeMetal, 7);
    pipe(energyCurve, .020, darkChannel);
    pipe(energyCurve, .032, halo, 6);
    pipe(energyCurve, .008, energy, 6);

    // Recessed seams and captive micro-fasteners are attached to the twisting faces.
    const jointMaterial = new THREE.LineBasicMaterial({
      color: 0x343d48, transparent: true, opacity: .58
    });
    const studGeometry = new THREE.CylinderGeometry(.019, .019, .010, 10);
    for (let i = 0; i < 14; i++) {
      const u = (i + .30) / 14 * TAU;
      const { center, across, normal } = point(u);
      const seam = [
        center.clone().addScaledVector(across, -.31).addScaledVector(normal, thickness + .006),
        center.clone().addScaledVector(across, .31).addScaledVector(normal, thickness + .006)
      ];
      band.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(seam), jointMaterial
      ));
      for (const side of [-1, 1]) {
        const stud = new THREE.Mesh(studGeometry, screwMetal);
        stud.position.copy(center).addScaledVector(across, side * .315)
          .addScaledVector(normal, thickness + .006);
        stud.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        band.add(stud);
      }
    }

    // Nine physically-positioned light packets travel along the single Möbius edge.
    const sparks = new THREE.InstancedMesh(
      new THREE.SphereGeometry(.024, 8, 6), energy.clone(), 9
    );
    sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    sparks.frustumCulled = false;
    band.add(sparks);
    loops.push({ band, curve: energyCurve, sparks, index });
  }

  // Two true closed Möbius bands, stacked and interlocked as a vertical emblem.
  makeBand(0, [0, 1.02, 0], [.20, .33, -.19], 1.36, metal, blue, blueHalo);
  makeBand(1, [0, -1.02, 0], [-.22, -.29, .16], 1.36, graphite, warm, warmHalo);

  // Fine internal machinery: precision axle, collars and concentric kinetic rings.
  const machine = new THREE.Group();
  sculpture.add(machine);
  const spindle = new THREE.Mesh(
    new THREE.CylinderGeometry(.065, .065, 4.85, 24), shaftMaterial
  );
  machine.add(spindle);
  const collar = new THREE.CylinderGeometry(.135, .135, .055, 28);
  for (const y of [-2.15, -1.45, -.76, .76, 1.45, 2.15]) {
    const m = new THREE.Mesh(collar, edgeMetal);
    m.position.y = y;
    machine.add(m);
  }
  const rotor = new THREE.Group();
  machine.add(rotor);
  const addRing = (r, thickness, y, mat, owner = rotor) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, thickness, 10, 96), mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    owner.add(ring);
    return ring;
  };
  addRing(.39, .025, -.24, edgeMetal);
  addRing(.39, .025, .24, edgeMetal);
  addRing(.30, .014, 0, shaftMaterial);
  const capacitor = new THREE.Mesh(
    new THREE.CylinderGeometry(.19, .19, .62, 32, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0x8abac9, metalness: .22, roughness: .14, transparent: true,
      opacity: .23, transmission: .25, side: THREE.DoubleSide, depthWrite: false
    })
  );
  rotor.add(capacitor);
  const emitter = new THREE.Mesh(
    new THREE.IcosahedronGeometry(.145, 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x8ec9d3, metalness: .7, roughness: .18,
      clearcoat: .7, envMapIntensity: 1.5
    })
  );
  rotor.add(emitter);
  const coreLight = new THREE.PointLight(0x89c6d9, 1.0, 2.7);
  machine.add(coreLight);

  // Controlled motion: visible mechanical inertia, no flashing and no camera wobble.
  let last = 0, elapsed = 0, raf = 0, inView = false, running = false;
  let lost = false, scroll = .5, pointerX = 0, pointerY = 0;
  let targetX = 0, targetY = 0, dragged = 0, dragX = 0, dragId = -1;
  let dragging = false;
  const dummy = new THREE.Object3D();
  const beat = t => {
    const p = t % 1.48;
    return Math.exp(-Math.pow((p - .18) / .066, 2)) +
      .55 * Math.exp(-Math.pow((p - .39) / .09, 2));
  };
  const updateScroll = () => {
    const rect = visual.getBoundingClientRect();
    scroll = THREE.MathUtils.clamp(
      (window.innerHeight * .65 - rect.top) / (window.innerHeight + rect.height), 0, 1
    );
  };
  const onMove = e => {
    const rect = visual.getBoundingClientRect();
    targetX = THREE.MathUtils.clamp(
      ((e.clientX - rect.left) / rect.width - .5) * 2, -1, 1
    );
    targetY = THREE.MathUtils.clamp(
      ((e.clientY - rect.top) / rect.height - .5) * 2, -1, 1
    );
    if (dragging && e.pointerId === dragId) {
      dragged += (e.clientX - dragX) * .006;
      dragX = e.clientX;
    }
  };
  const release = () => {
    dragging = false;
    dragId = -1;
    visual.classList.remove('dragging');
  };
  function draw(dt) {
    const move = !prefersReducedMotion.matches;
    if (move) elapsed += dt;
    const smoothing = Math.min(1, dt * 4 + .04);
    pointerX += (targetX - pointerX) * smoothing;
    pointerY += (targetY - pointerY) * smoothing;
    const goalY = -.16 + scroll * .65 + dragged + pointerX * .14 +
      (move ? elapsed * .045 : 0);
    sculpture.rotation.y += (goalY - sculpture.rotation.y) * smoothing;
    sculpture.rotation.x += (-.055 - pointerY * .095 - sculpture.rotation.x) * smoothing;
    loops[0].band.rotation.z = -.19 + (move ? Math.sin(elapsed * .16) * .038 : 0);
    loops[1].band.rotation.z = .16 - (move ? Math.sin(elapsed * .16) * .038 : 0);
    rotor.rotation.y = move ? -elapsed * .25 : 0;
    rotor.rotation.z = move ? Math.sin(elapsed * .20) * .11 : 0;
    const pulse = move ? beat(elapsed) : 0;
    coreLight.intensity = .90 + .65 * pulse;
    emitter.scale.setScalar(1 + .055 * pulse);
    blue.opacity = .55 + .10 * pulse;
    warm.opacity = .42 + .07 * pulse;
    for (const item of loops) {
      const speed = item.index === 0 ? .065 : -.055;
      for (let i = 0; i < 9; i++) {
        const t = i / 9 + elapsed * speed;
        const u = ((t % 1) + 1) % 1;
        dummy.position.copy(item.curve.getPointAt(u));
        dummy.scale.setScalar(.72 + .25 * Math.sin(elapsed * 1.3 + i * 1.5));
        dummy.updateMatrix();
        item.sparks.setMatrixAt(i, dummy.matrix);
      }
      item.sparks.instanceMatrix.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }
  function frame(timestamp) {
    if (!running || lost) return;
    const dt = last ? Math.min((timestamp - last) / 1000, .05) : 0;
    last = timestamp;
    draw(dt);
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    last = 0;
  }
  function start() {
    if (lost || !inView || document.hidden || running) return;
    if (prefersReducedMotion.matches) { draw(0); return; }
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function resize() {
    if (lost) return;
    const w = Math.max(1, visual.clientWidth), h = Math.max(1, visual.clientHeight);
    renderer.setPixelRatio(DPR());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 510 ? 44 : 35;
    camera.updateProjectionMatrix();
    updateScroll();
    draw(0);
    visual.classList.add('loaded');
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  visual.addEventListener('pointermove', onMove, { passive: true });
  visual.addEventListener('pointerleave', () => {
    if (!dragging) { targetX = 0; targetY = 0; }
  });
  visual.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || prefersReducedMotion.matches) return;
    dragging = true;
    dragId = e.pointerId;
    dragX = e.clientX;
    visual.setPointerCapture(dragId);
    visual.classList.add('dragging');
  });
  visual.addEventListener('pointerup', release);
  visual.addEventListener('pointercancel', release);
  visual.addEventListener('lostpointercapture', release);
  canvas.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') dragged -= .22;
    else if (e.key === 'ArrowRight') dragged += .22;
    else if (e.key === 'Home') dragged = 0;
    else return;
    e.preventDefault();
    if (prefersReducedMotion.matches) draw(0);
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(visual);
  resize();
  const visibilityObserver = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) start();
    else stop();
  }, { rootMargin: '120px' });
  visibilityObserver.observe(visual);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  prefersReducedMotion.addEventListener('change', () => {
    stop();
    start();
  });
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    lost = true;
    stop();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    visual.classList.remove('loaded');
  });
}
initMobius();
