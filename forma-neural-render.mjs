/**
 * FORMA Neural Render — optional, isolated WebGPU still-frame adapter.
 * Uses the MIT three-dlss-nr package, not NVIDIA's official SDK.
 * No bundled model or synthetic weights. Import using the host's Three.js
 * module graph (r180+) and provide a lawfully licensed trained model.
 */
export function createFormaNeuralRender({
  host, getScene, getCamera, modelSource, authorizedModel = false,
  loadLibrary = () => import('three-dlss-nr'),
  onStatus = () => {}, idleMs = 450, maxWidth = 512, maxHeight = 512
}) {
  if (!host || typeof getScene !== 'function' || typeof getCamera !== 'function')
    throw new TypeError('host, getScene and getCamera are required');
  const notify = (state, detail = '') => { try { onStatus({state, detail}); } catch {} };
  let enabled = false, disposed = false, revision = 0, timer = null,
      pending = false, active = null, lib, renderer, model, pass, boundScene,
      boundCamera, dimensions = '', overlay;
  const hide = () => { if (overlay) overlay.style.visibility = 'hidden'; };
  function invalidate() {
    revision++;
    pending = false;
    clearTimeout(timer);
    hide();
  }
  function size() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) throw new Error('Viewport has no visible size');
    const k = Math.min(1, maxWidth/w, maxHeight/h, 1280/w, 720/h);
    return [Math.max(1, Math.round(w*k)), Math.max(1, Math.round(h*k))];
  }
  async function initialize() {
    if (!authorizedModel || !modelSource) throw new Error('Требуется лицензированная обученная модель; без неё режим недоступен');
    if (!globalThis.isSecureContext || !globalThis.navigator?.gpu)
      throw new Error('WebGPU недоступен: необходим HTTPS и совместимый браузер');
    if (!lib) lib = await loadLibrary();
    if (!renderer) {
      const result = await lib.createNRRenderer();
      renderer = result.renderer;
      const reason = lib.tslBackend.unavailableReason(renderer);
      if (reason) throw new Error(reason);
      overlay = renderer.domElement;
      Object.assign(overlay.style, {position:'absolute', inset:'0', width:'100%', height:'100%',
        objectFit:'contain', pointerEvents:'none', visibility:'hidden', zIndex:'2'});
      overlay.setAttribute('aria-hidden','true');
      host.appendChild(overlay);
    }
    if (!model) model = await lib.NRModel.load(modelSource);
  }
  async function renderOnce(ticket) {
    await initialize();
    if (!enabled || disposed || ticket !== revision) return;
    const scene = getScene(), camera = getCamera();
    if (!scene || !camera) throw new Error('Сцена или камера недоступна');
    const [width,height] = size(), key = width+'x'+height;
    if (!pass || scene !== boundScene || camera !== boundCamera || key !== dimensions) {
      pass?.dispose?.();
      pass = null;
      renderer.setSize(width,height,false);
      const next = new lib.DlssNrPass({renderer,scene,camera,width,height,view:'on'});
      pass = next;
      await next.setNetwork(lib.backendBuilder(lib.tslBackend,model));
      next.setSettings({style:2,intensity:0.65,colorStrength:0});
      boundScene = scene; boundCamera = camera; dimensions = key;
    }
    if (!enabled || disposed || ticket !== revision) return;
    pass.resetHistory();
    const start = performance.now();
    const stats = await pass.render();
    if (stats && enabled && !disposed && ticket === revision) {
      overlay.style.visibility = 'visible';
      notify('ready', Math.round(performance.now()-start)+' ms');
    }
  }
  function release() {
    hide();
    overlay?.remove();
    pass?.dispose?.();
    model?.dispose?.();
    renderer?.dispose?.();
    pass = model = renderer = overlay = null;
    boundScene = boundCamera = null; dimensions = '';
  }
  function launch() {
    if (!enabled || disposed) return;
    if (active) { pending = true; return; }
    const ticket = revision;
    notify('processing');
    active = renderOnce(ticket).catch(error => {
      enabled = false; invalidate(); release();
      notify('unavailable', String(error?.message || error));
    }).finally(() => {
      active = null;
      if (disposed) release();
      else if (enabled && pending) { pending = false; launch(); }
    });
  }
  return {
    enable() {
      if (disposed) return false;
      if (!authorizedModel || !modelSource || !globalThis.isSecureContext || !globalThis.navigator?.gpu) {
        notify('unavailable','Нужна обученная модель и WebGPU (HTTPS). Обычный рендер остаётся активен.');
        return false;
      }
      enabled = true; notify('idle'); this.stationary(); return true;
    },
    disable() { enabled = false; invalidate(); notify('off'); },
    moving() { invalidate(); },
    stationary() {
      if (!enabled || disposed) return;
      invalidate();
      timer = setTimeout(launch, idleMs);
    },
    dispose() {
      disposed = true; enabled = false; invalidate();
      if (!active) release();
    }
  };
}
