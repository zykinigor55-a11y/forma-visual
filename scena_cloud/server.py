from __future__ import annotations
import os, time, json, hmac, secrets, shutil, uuid, tempfile, threading, subprocess, sys, importlib.util, re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

app=FastAPI(title="SCENA Karaoke Cloud",version="1.2.1", docs_url=None,redoc_url=None)
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["GET","POST","DELETE","OPTIONS"],allow_headers=["Authorization","Content-Type"])
BASE=Path(tempfile.gettempdir())/"scena-jobs"; BASE.mkdir(exist_ok=True)
TOKEN=os.getenv("SCENA_ACCESS_TOKEN","")
TTL=7200
MAX_FILE=90*1024*1024
jobs={}; guard=threading.RLock(); pool=ThreadPoolExecutor(max_workers=1)
def require(request:Request):
    if not TOKEN: raise HTTPException(503,"Сервер не настроен")
    if not hmac.compare_digest(request.headers.get("authorization",""),"Bearer "+TOKEN): raise HTTPException(401,"Неверный личный код")
def checkid(jobid):
    if not re.fullmatch(r"[a-f0-9]{32}",jobid): raise HTTPException(404,"Задача не найдена")
    with guard:
        rec=jobs.get(jobid)
        if not rec: raise HTTPException(404,"Задача не найдена или удалена")
        return dict(rec)
def update(jobid,**kw):
    with guard:
        if jobid in jobs: jobs[jobid].update(kw)
def dependencies():
    return {"ffmpeg": bool(shutil.which("ffmpeg")), "ffprobe":bool(shutil.which("ffprobe")), "demucs":importlib.util.find_spec("demucs") is not None, "faster_whisper":importlib.util.find_spec("faster_whisper") is not None}
def prune():
    while True:
        try:
            with guard: old=[jid for jid,r in jobs.items() if time.time()-r["created_ts"]>TTL and r["status"] not in ("queued","processing","uploading")]
            for jid in old:
                with guard: jobs.pop(jid,None)
                shutil.rmtree(BASE/jid,ignore_errors=True)
        except Exception: pass
        time.sleep(90)
threading.Thread(target=prune,daemon=True).start()
def lrc_time(t):
    c=int(max(0,t)*100+.5)
    return f"{c//6000:02}:{(c//100)%60:02}.{c%100:02}"
def make_lrc(words):
    lines=[]; row=[]
    for w in words:
        if row and (len(row)>6 or w["start"]-row[-1]["end"]>1.1):
            lines.append("["+lrc_time(row[0]["start"])+"]"+" ".join("<"+lrc_time(x["start"])+">"+x["word"] for x in row));row=[]
        row.append(w)
    if row: lines.append("["+lrc_time(row[0]["start"])+"]"+" ".join("<"+lrc_time(x["start"])+">"+x["word"] for x in row))
    return "\n".join(lines)+"\n"
def work(jid, src):
    folder=BASE/jid
    try:
        update(jid,status="processing",stage="Проверяем длительность аудио")
        p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(src)],capture_output=True,text=True,timeout=30)
        try: duration=float(p.stdout.strip())
        except Exception: raise RuntimeError("Аудиофайл не распознан")
        if duration<1 or duration>900: raise RuntimeError("Поддерживаются песни длительностью до 15 минут")
        update(jid,stage="Разделяем вокал и инструменты")
        out=folder/"separated"
        model=os.getenv("SCENA_DEMUCS_MODEL","htdemucs")
        proc=subprocess.run([sys.executable,"-m","demucs","-n",model,"--two-stems","vocals","--segment","7","--mp3","--mp3-bitrate","192","-o",str(out),str(src)],capture_output=True,text=True,timeout=3600,cwd=folder)
        if proc.returncode: raise RuntimeError("Ошибка разделения музыки: "+(proc.stderr or proc.stdout)[-280:])
        stemdir=out/model/src.stem
        stems={"no_vocals.mp3":"instrumental.mp3","vocals.mp3":"vocals.mp3"}
        for source,dest in stems.items():
            if not (stemdir/source).exists():raise RuntimeError("ИИ не сформировал аудиодорожку "+source)
            shutil.move(str(stemdir/source),str(folder/dest))
        update(jid,stage="Распознаём слова")
        from faster_whisper import WhisperModel
        model=WhisperModel(os.getenv("SCENA_WHISPER_MODEL","tiny"),device="cpu",compute_type="int8")
        segments,info=model.transcribe(str(folder/"vocals.mp3"),word_timestamps=True,vad_filter=False,beam_size=3)
        words=[]
        for seg in segments:
            for w in seg.words or []:
                if w.word.strip() and w.start is not None and w.end is not None:
                    words.append({"start":round(float(w.start),2),"end":round(float(w.end),2),"word":w.word.strip()})
        (folder/"lyrics.json").write_text(json.dumps({"words":words,"language":info.language},ensure_ascii=False),encoding="utf-8")
        (folder/"lyrics.lrc").write_text(make_lrc(words),encoding="utf-8")
        update(jid,status="ready",stage="Караоке готово",words=words,language=info.language)
    except Exception as e:
        update(jid,status="error",stage="Ошибка",error=str(e)[:400])
    finally:
        src.unlink(missing_ok=True);shutil.rmtree(folder/"separated",ignore_errors=True)
@app.get("/")
def index():
    d=dependencies()
    return {"service":"СЦЕНА • личное караоке","status":"online","engine_ready":bool(TOKEN) and all(d.values()),"api":"/api/health"}
@app.get("/api/health")
def health():
    d=dependencies()
    return {"ok":True,"engine_ready":bool(TOKEN) and all(d.values()),"dependencies":d,"cloud":True,"private":True,"retention_seconds":TTL,"model":"Demucs + Faster-Whisper"}
@app.post("/api/process",status_code=202)
async def submit(request:Request,file:UploadFile=File(...)):
    require(request)
    if not all(dependencies().values()):raise HTTPException(503,"ИИ на сервере не готов")
    ext=Path(file.filename or "").suffix.lower()
    if ext not in (".mp3",".wav",".flac",".m4a",".ogg",".aac",".opus"): raise HTTPException(415,"Этот аудиоформат не поддерживается")
    with guard:
        if sum(r["status"] in ("uploading","queued","processing") for r in jobs.values())>=1: raise HTTPException(429,"Сервер занят другим треком")
        jid=uuid.uuid4().hex;folder=BASE/jid;folder.mkdir();src=folder/("original"+ext)
        jobs[jid]={"id":jid,"status":"uploading","stage":"Получаем файл","created_ts":time.time(),"ticket":secrets.token_urlsafe(28),"filename":(file.filename or "")[:120]}
    received=0
    try:
        with src.open("wb") as f:
            while True:
                chunk=await file.read(1024*1024)
                if not chunk:break
                received+=len(chunk)
                if received>MAX_FILE:raise HTTPException(413,"Файл слишком большой")
                f.write(chunk)
        if received<128: raise HTTPException(400,"Пустой файл")
        update(jid,status="queued",stage="В очереди")
        pool.submit(work,jid,src)
        return {"job_id":jid,"status":"queued"}
    except Exception:
        with guard:jobs.pop(jid,None)
        shutil.rmtree(folder,ignore_errors=True);raise
    finally: await file.close()
@app.get("/api/jobs/{jobid}")
def state(jobid:str, request:Request):
    require(request)
    rec=checkid(jobid);ticket=rec.pop("ticket");rec.pop("created_ts",None)
    if rec["status"]=="ready":
        rec.update({"instrumental_url":f"/api/files/{jobid}/instrumental.mp3?ticket={ticket}","vocals_url":f"/api/files/{jobid}/vocals.mp3?ticket={ticket}","lrc_url":f"/api/files/{jobid}/lyrics.lrc?ticket={ticket}"})
    return rec
@app.get("/api/files/{jobid}/{filename}")
def download(jobid:str,filename:str,request:Request,ticket:str=""):
    if filename not in ("instrumental.mp3","vocals.mp3","lyrics.lrc","lyrics.json"):raise HTTPException(404,"Не найдено")
    rec=checkid(jobid)
    if not ticket or not hmac.compare_digest(ticket,rec["ticket"]):require(request)
    if rec["status"]!="ready":raise HTTPException(409,"Обработка не завершена")
    path=BASE/jobid/filename
    if not path.is_file():raise HTTPException(404,"Файл отсутствует")
    return FileResponse(path,headers={"Cache-Control":"no-store"})
@app.delete("/api/jobs/{jobid}")
def delete(jobid:str,request:Request):
    require(request)
    rec=checkid(jobid)
    if rec["status"] in ("queued","processing","uploading"):raise HTTPException(409,"Обработка ещё идёт")
    with guard:jobs.pop(jobid,None)
    shutil.rmtree(BASE/jobid,ignore_errors=True)
    return {"deleted":True}
