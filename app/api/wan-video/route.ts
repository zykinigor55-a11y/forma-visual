import {bindings, identity, json} from '@/lib/server';
import {parseImage, readJsonBody} from '@/lib/validation';

export const dynamic = 'force-dynamic';
const BASE = 'https://openrouter.ai/api/v1';
const MODEL = 'alibaba/wan-2.6:free';
const EXPIRY_MS = 2 * 60 * 60 * 1000;
const isUUID = (value: string) => /^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(value);
const config = () => bindings() as ReturnType<typeof bindings> & {
  OPENROUTER_API_KEY?: string; WAN_VIDEO_ENABLED?: string; WAN_DAILY_LIMIT?: string;
};
type VideoJob = {id: string; providerId: string; owner: string; createdAt: string; prompt: string; frameId: string};
type VideoStatus = {id?: string; status?: string; error?: string; [key: string]: unknown};

function dailyLimit(): number {
  const n = Number(config().WAN_DAILY_LIMIT || 3);
  return Number.isInteger(n) && n >= 1 && n <= 20 ? n : 3;
}
function imageKey(id: string) {return 'wan-frames/' + id;}
function jobKey(owner: string, id: string) {return 'wan-jobs/' + owner + '/' + id + '.json';}
function authHeaders(key: string): HeadersInit {
  return {'Authorization': 'Bearer ' + key};
}
async function getModel(key: string) {
  const response = await fetch(BASE + '/videos/models', {headers: authHeaders(key), signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error('Не удалось получить список видео-моделей OpenRouter (' + response.status + ').');
  const body = await response.json() as {data?: Array<Record<string, unknown>>};
  return body.data?.find(x => x.id === MODEL) || null;
}
async function readJob(owner: string, id: string): Promise<VideoJob | null> {
  if (!isUUID(id)) return null;
  const object = await config().BUCKET?.get(jobKey(owner, id));
  return object ? await object.json<VideoJob>() : null;
}
async function providerStatus(key: string, remoteId: string): Promise<VideoStatus> {
  const response = await fetch(BASE + '/videos/' + encodeURIComponent(remoteId), {
    headers: authHeaders(key), signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error('OpenRouter не вернул статус задания (' + response.status + ').');
  return response.json<VideoStatus>();
}
function guardedOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
function fail(message: string, status = 400) {return json({error: message}, status);}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'availability';
  const e = config();

  // Capability URL: unguessable, temporary, read-only. OpenRouter can fetch a first frame.
  if (action === 'frame') {
    const id = url.searchParams.get('id') || '';
    if (!isUUID(id) || !e.BUCKET) return fail('Кадр не найден.', 404);
    const object = await e.BUCKET.get(imageKey(id));
    if (!object || Number(object.customMetadata?.expiresAt || 0) < Date.now()) {
      return fail('Ссылка на кадр устарела.', 410);
    }
    return new Response(object.body, {
      headers: {'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'}
    });
  }

  const user = await identity();
  if (!user) return fail('Войдите в аккаунт для генерации видео.', 401);
  const enabled = !!e.OPENROUTER_API_KEY && e.WAN_VIDEO_ENABLED === 'true';

  if (action === 'availability') {
    if (!enabled) return json({ready: false, reason: 'Видеогенерация ожидает подключения ключа OpenRouter.'});
    try {
      const model = await getModel(e.OPENROUTER_API_KEY!);
      const ready = !!model && Array.isArray(model.supported_frame_images)
        && model.supported_frame_images.includes('first_frame');
      return json({
        ready, model: MODEL,
        reason: ready ? '' : 'Wan 2.6 Free сейчас недоступна для Image-to-Video через API. Платные модели автоматически не используются.',
        durations: model?.supported_durations || [], resolutions: model?.supported_resolutions || []
      });
    } catch (error) {
      return json({ready: false, reason: (error as Error).message});
    }
  }

  const id = url.searchParams.get('id') || '';
  const job = await readJob(user.userId, id);
  if (!job || job.owner !== user.userId) return fail('Видео не найдено.', 404);
  if (!enabled) return fail('Ключ OpenRouter не настроен.', 503);

  if (action === 'job') {
    try {
      const current = await providerStatus(e.OPENROUTER_API_KEY!, job.providerId);
      return json({
        id: job.id, status: current.status || 'pending', error: current.error || '',
        downloadUrl: current.status === 'completed' ? '/api/wan-video?action=content&id=' + id : null
      });
    } catch (error) {return fail((error as Error).message, 502);}
  }
  if (action === 'content') {
    try {
      const current = await providerStatus(e.OPENROUTER_API_KEY!, job.providerId);
      if (current.status !== 'completed') return fail('Видео ещё не готово.', 409);
      const response = await fetch(BASE + '/videos/' + encodeURIComponent(job.providerId) + '/content?index=0', {
        headers: authHeaders(e.OPENROUTER_API_KEY!), signal: AbortSignal.timeout(45000)
      });
      if (!response.ok || !response.body) return fail('Не удалось скачать видео из OpenRouter (' + response.status + ').', 502);
      return new Response(response.body, {headers: {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Content-Disposition': 'attachment; filename="forma-wan-video.mp4"',
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
      }});
    } catch (error) {return fail((error as Error).message, 502);}
  }
  return fail('Неизвестное действие.');
}

export async function POST(request: Request) {
  if (!guardedOrigin(request)) return fail('Недопустимый источник запроса.', 403);
  const user = await identity();
  if (!user) return fail('Войдите в аккаунт для генерации видео.', 401);
  const e = config();
  if (!e.OPENROUTER_API_KEY || e.WAN_VIDEO_ENABLED !== 'true') return fail('Сначала добавьте OPENROUTER_API_KEY и включите WAN_VIDEO_ENABLED.', 503);
  if (!e.DB || !e.BUCKET) return fail('Хранилище сервиса не подключено.', 503);
  if (Number(request.headers.get('content-length') || 0) > 12 * 1024 * 1024) return fail('Изображение слишком большое.', 413);

  let input: Record<string, unknown>;
  try {
    const payload = await readJsonBody(request);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid body');
    input = payload as Record<string, unknown>;
  } catch {return fail('Не удалось прочитать изображение.', 400);}

  let image: ReturnType<typeof parseImage>;
  try {image = parseImage(input.image);} catch (error) {return fail((error as Error).message);}
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim().slice(0, 1500) : '';
  if (prompt.length < 12) return fail('Добавьте описание движения камеры.');
  const duration = Number(input.duration || 5);
  if (![5, 10].includes(duration)) return fail('Выберите 5 или 10 секунд.');

  let model: Record<string, unknown> | null;
  try {model = await getModel(e.OPENROUTER_API_KEY);}
  catch (error) {return fail((error as Error).message, 503);}
  if (!model) return fail('Бесплатной Wan 2.6 нет в текущем списке OpenRouter. Платный вариант не запускаем.', 503);
  const frames = model.supported_frame_images as string[] | undefined;
  if (!Array.isArray(frames) || !frames.includes('first_frame')) return fail('Эта Wan 2.6 не принимает начальный кадр. Попробуйте позже.', 503);
  const durations = model.supported_durations as number[] | undefined;
  if (durations?.length && !durations.includes(duration)) return fail('Доступная длительность: ' + durations.join(', ') + ' с.');
  const ratios = model.supported_aspect_ratios as string[] | undefined;
  if (ratios?.length && !ratios.includes('16:9')) return fail('Модель сейчас не поддерживает формат 16:9.', 503);
  const resolutions = model.supported_resolutions as string[] | undefined;
  const resolution = resolutions?.includes('720p') ? '720p' : resolutions?.includes('1080p') ? '1080p' : undefined;
  if (resolutions?.length && !resolution) return fail('Для модели недоступно ожидаемое разрешение.', 503);

  const owner = 'wan-video:' + user.userId, date = new Date().toISOString().slice(0, 10);
  const reservation = await e.DB.prepare(
    'INSERT INTO usage (owner, month, used) VALUES (?,?,1) ON CONFLICT(owner,month) DO UPDATE SET used=used+1 WHERE used < ? RETURNING used'
  ).bind(owner, date, dailyLimit()).first<{used: number}>();
  if (!reservation) return fail('Лимит пробных видео на сегодня исчерпан.', 429);

  const frameId = crypto.randomUUID(), id = crypto.randomUUID();
  try {
    const origin = new URL(request.url);
    if (origin.protocol !== 'https:') throw new Error('Для отправки изображения требуется HTTPS.');
    await e.BUCKET.put(imageKey(frameId), image.bytes, {
      httpMetadata: {contentType: image.mimeType},
      customMetadata: {expiresAt: String(Date.now() + EXPIRY_MS)}
    });
    const firstFrameUrl = origin.origin + '/api/wan-video?action=frame&id=' + frameId;
    const body: Record<string, unknown> = {
      model: MODEL,
      prompt: prompt + '\nPreserve the original building geometry, all windows and exterior materials exactly. Natural coherent camera motion.',
      duration, aspect_ratio: '16:9', generate_audio: false,
      frame_images: [{type: 'image_url', image_url: {url: firstFrameUrl}, frame_type: 'first_frame'}]
    };
    if (resolution) body.resolution = resolution;
    const response = await fetch(BASE + '/videos', {
      method: 'POST',
      headers: {...authHeaders(e.OPENROUTER_API_KEY), 'Content-Type': 'application/json'},
      body: JSON.stringify(body), signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) {
      if (response.status === 402) throw new Error('OpenRouter требует оплату. Платная генерация не запущена.');
      if (response.status === 429) throw new Error('Бесплатная модель сейчас перегружена. Попробуйте позже.');
      throw new Error('OpenRouter отклонил генерацию (HTTP ' + response.status + ').');
    }
    const remote = await response.json() as {id?: string; status?: string};
    if (!remote.id) throw new Error('OpenRouter не вернул ID видео.');
    const job: VideoJob = {id, providerId: remote.id, owner: user.userId, frameId,
      createdAt: new Date().toISOString(), prompt};
    await e.BUCKET.put(jobKey(user.userId, id), JSON.stringify(job), {
      httpMetadata: {contentType: 'application/json'}
    });
    return json({id, status: remote.status || 'pending', model: MODEL}, 202);
  } catch (error) {
    await e.BUCKET.delete(imageKey(frameId));
    await e.DB.prepare('UPDATE usage SET used=MAX(used-1,0) WHERE owner=? AND month=?').bind(owner, date).run();
    return fail((error as Error).message || 'Не удалось создать видео.', 502);
  }
}
