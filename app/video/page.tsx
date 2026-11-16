'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowUpRight, Check, Clapperboard, Download, Film, ImagePlus, Loader2, Lock, Play, RefreshCw, Sparkles} from 'lucide-react';
import './video.css';

type Availability = {ready?: boolean; reason?: string; durations?: number[]; error?: string};
type Job = {id: string; status: string; error?: string; downloadUrl?: string | null};
const STORAGE = 'forma-wan-last-job';
const VIDEO_PROMPT = 'Slow cinematic dolly-in towards the house with a subtle lateral camera drift. Sunlit garden foliage sways naturally in a gentle breeze, physically realistic movement and lighting, stable architecture, no morphing, no new objects.';

async function requestJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {...init, cache: 'no-store'});
  const data = await response.json() as T & {error?: string};
  if (!response.ok) throw new Error(data.error || 'Сервис временно недоступен.');
  return data;
}
function statusLabel(s: string) {
  return s === 'pending' ? 'Ожидаем запуска'
    : s === 'in_progress' ? 'Wan 2.6 создаёт видео'
      : s === 'completed' ? 'Видео готово'
        : s === 'failed' ? 'Генерация завершилась с ошибкой'
          : s === 'cancelled' ? 'Задание отменено'
            : s === 'expired' ? 'Время задания истекло' : 'Проверяем статус';
}
function terminal(s: string) {return ['completed', 'failed', 'cancelled', 'expired'].includes(s);}

export default function VideoPage() {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [image, setImage] = useState('');
  const [filename, setFilename] = useState('');
  const [prompt, setPrompt] = useState(VIDEO_PROMPT);
  const [duration, setDuration] = useState<5 | 10>(5);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {setAvailability(await requestJSON<Availability>('/api/wan-video?action=availability'));}
    catch (error) {setAvailability({ready: false, reason: (error as Error).message});}
  }, []);
  const refreshJob = useCallback(async (id: string) => {
    try {
      const data = await requestJSON<Job>('/api/wan-video?action=job&id=' + encodeURIComponent(id));
      setJob(data);
      if (terminal(data.status)) {
        if (data.status !== 'completed' && data.error) setMessage(data.error);
        if (data.status === 'completed') setMessage('Готово. Скачайте MP4.');
      }
    } catch (error) {setMessage((error as Error).message);}
  }, []);
  useEffect(() => {
    refresh();
    try {
      const id = localStorage.getItem(STORAGE);
      if (id && /^[a-f0-9-]{36}$/i.test(id)) refreshJob(id);
    } catch {/* private browsing may disable storage */}
  }, [refresh, refreshJob]);
  useEffect(() => {
    if (!job || terminal(job.status)) return;
    const id = window.setInterval(() => refreshJob(job.id), 12000);
    return () => window.clearInterval(id);
  }, [job?.id, job?.status, refreshJob]);

  function upload(file?: File) {
    if (!file) return;
    setMessage('');
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {
      setMessage('Выберите фотографию JPG, PNG или WebP.'); return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage('Размер изображения не должен превышать 8 МБ.'); return;
    }
    const reader = new FileReader();
    reader.onload = () => {setImage(String(reader.result)); setFilename(file.name);};
    reader.onerror = () => setMessage('Не удалось открыть изображение.');
    reader.readAsDataURL(file);
  }
  async function generate() {
    if (!image || !availability?.ready || busy) return;
    setBusy(true); setMessage('Отправляем фотографию в Wan 2.6…'); setJob(null);
    try {
      const data = await requestJSON<Job>('/api/wan-video', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({image, prompt, duration})
      });
      setJob(data);
      try {localStorage.setItem(STORAGE, data.id);} catch {}
      setMessage('Задание принято. Статус обновляется автоматически.');
      await refreshJob(data.id);
    } catch (error) {setMessage((error as Error).message);}
    finally {setBusy(false);}
  }

  return <div className="wan-page">
    <header className="wan-topbar">
      <a href="/" className="wan-back"><ArrowLeft size={16}/> Forma Визуал</a>
      <div className="wan-top-title"><Clapperboard size={16}/> Анимация изображения</div>
      <span className="wan-provider">OpenRouter · Wan 2.6 Free</span>
    </header>
    <div className="wan-content">
      <div className="wan-heading">
        <div className="wan-eyebrow"><Film size={14}/> IMAGE TO VIDEO</div>
        <h1>Оживите архитектурный рендер</h1>
        <p>Загрузите готовый кадр, задайте движение камеры и получите видеоролик MP4. Окна и геометрия должны оставаться неизменными — результат следует проверять.</p>
      </div>
      <div className="wan-columns">
        <section className="wan-card">
          <div className="wan-card-title"><span>01 / Изображение</span><ImagePlus size={17}/></div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
            onChange={e => upload(e.target.files?.[0])}/>
          <button className={'wan-upload ' + (image ? 'has-image' : '')}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {e.preventDefault(); upload(e.dataTransfer.files?.[0]);}}>
            {image ? <img src={image} alt="Первый кадр видео"/> :
              <div className="wan-empty"><ImagePlus size={34} strokeWidth={1.3}/><strong>Выберите рендер или фото</strong><span>JPG, PNG, WebP · до 8 МБ</span></div>}
          </button>
          <div className="wan-file"><span>{filename || 'Изображение не выбрано'}</span><button onClick={() => fileRef.current?.click()}>Заменить <ArrowUpRight size={13}/></button></div>

          <div className="wan-card-title wan-section-title"><span>02 / Движение камеры</span><Sparkles size={17}/></div>
          <label className="wan-label" htmlFor="wan-prompt">Сценарий движения</label>
          <textarea id="wan-prompt" rows={6} maxLength={1500} value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Опишите движение камеры и окружения…" />
          <div className="wan-row"><span>Длительность</span><div className="wan-segment">
            {[5, 10].map(n => <button type="button" key={n} aria-pressed={duration === n}
              className={duration === n ? 'selected' : ''} onClick={() => setDuration(n as 5 | 10)}>{n} сек</button>)}
          </div></div>
          <button className="wan-generate" disabled={!image || !availability?.ready || busy || prompt.trim().length < 12}
            onClick={generate}>{busy ? <Loader2 size={18} className="wan-spin"/> : <Play size={17} fill="currentColor"/>}
            {busy ? 'Отправляем…' : 'Создать видео'}<ArrowUpRight size={17}/></button>
          <div className="wan-small"><Lock size={13}/> API-ключ хранится только на сервере. Платная модель не запускается автоматически.</div>
        </section>
        <section className="wan-card wan-result">
          <div className="wan-card-title"><span>03 / Результат</span><Clapperboard size={18}/></div>
          <div className="wan-preview">
            {image ? <img src={image} alt="Предпросмотр исходного кадра"/> :
              <div className="wan-placeholder"><Clapperboard size={37} strokeWidth={1.1}/><span>Здесь появится результат генерации</span></div>}
            {job && <div className="wan-preview-state">
              {job.status === 'completed' ? <Check size={17}/> : <Loader2 size={17} className={terminal(job.status) ? '' : 'wan-spin'}/>}
              {statusLabel(job.status)}
            </div>}
          </div>
          <div className="wan-status">
            <div><span className={'wan-dot ' + (availability?.ready ? 'active' : '')}/><strong>{availability ? availability.ready ? 'Wan 2.6 доступна' : 'Ожидает подключения' : 'Проверяем OpenRouter…'}</strong></div>
            {availability?.reason && <p>{availability.reason}</p>}
            {availability?.ready && <p>Прямой бесплатный API. Разрешения и длительности проверяются при запуске.</p>}
            {job && <p>{statusLabel(job.status)} · {job.id.slice(0,8)}</p>}
            {message && <p className="wan-message" role="status">{message}</p>}
          </div>
          <div className="wan-result-actions">
            {job?.status === 'completed' && job.downloadUrl ?
              <a href={job.downloadUrl} className="wan-download"><Download size={17}/> Скачать MP4</a> :
              <button disabled className="wan-download"><Download size={17}/> Скачать MP4</button>}
            <button className="wan-refresh" disabled={!job || busy} onClick={() => job && refreshJob(job.id)}><RefreshCw size={15}/> Проверить статус</button>
          </div>
          <p className="wan-footnote">Реальные проценты генерации OpenRouter не сообщает: отображаются только стадии выполнения. Задание можно продолжить после обновления страницы.</p>
        </section>
      </div>
    </div>
  </div>;
}
