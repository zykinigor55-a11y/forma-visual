"""FORMA B2B prototype conversion API.

Runs fixed allowlisted converters in worker threads. An in-memory queue is for
single-process development only; use persistent jobs and sandboxed workers in production.
"""
from __future__ import annotations

import asyncio
import logging
import os
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

log = logging.getLogger("forma.import")
app = FastAPI(title="FORMA B2B import service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[v.strip() for v in os.getenv("FORMA_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if v.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
MAX_BYTES = 150 * 1024 * 1024
MAX_RUNNING = 2
TTL_SECONDS = 60 * 60
ALLOWED = {".ifc", ".skp", ".fbx", ".obj", ".blend"}
jobs: dict[str, dict] = {}
semaphore = asyncio.Semaphore(MAX_RUNNING)


class JobView(BaseModel):
    id: str
    status: str
    stage: str
    original_name: str
    message: str = ""
    output_url: str | None = None


def view(job_id: str) -> JobView:
    item = jobs[job_id]
    return JobView(
        id=job_id,
        status=item["status"],
        stage=item["stage"],
        original_name=item["original_name"],
        message=item.get("message", ""),
        output_url=f"/api/imports/{job_id}/result" if item["status"] == "ready" else None,
    )


def cleanup_expired() -> None:
    now = time.time()
    for job_id, item in list(jobs.items()):
        if item["status"] not in {"queued", "processing"} and now - item["updated"] > TTL_SECONDS:
            shutil.rmtree(item["directory"], ignore_errors=True)
            jobs.pop(job_id, None)


def convert(src: Path, target: Path) -> None:
    ext = src.suffix.lower()
    if ext == ".ifc":
        executable = os.getenv("FORMA_IFCCONVERT_BIN", "IfcConvert")
        command = [executable, "--yes", "--center-model", str(src), str(target)]
        subprocess.run(command, check=True, timeout=240, capture_output=True, text=True)
    elif ext == ".skp":
        from openskp import SkpFile
        from openskp.export import glb

        skp = SkpFile.open(str(src))
        skp.parse()
        glb.export(skp, str(target))
    elif ext in {".fbx", ".obj", ".blend"}:
        blender = os.getenv("FORMA_BLENDER_BIN", "blender")
        script = Path(__file__).with_name("blender_to_glb.py")
        command = [blender, "--background", "--factory-startup", "--python-exit-code", "3", "--python", str(script), "--", str(src), str(target)]
        subprocess.run(command, check=True, timeout=240, capture_output=True, text=True)
    else:
        raise ValueError("Этот формат не поддерживается конвертером.")
    if not target.is_file() or target.stat().st_size < 24:
        raise ValueError("Конвертер не создал GLB. Проверьте исходную модель.")


async def worker(job_id: str) -> None:
    item = jobs.get(job_id)
    if item is None:
        return
    try:
        async with semaphore:
            item.update(status="processing", stage="Конвертация геометрии", updated=time.time())
            await asyncio.to_thread(convert, item["source"], item["result"])
            item.update(status="ready", stage="Готово", message="GLB подготовлен", updated=time.time())
            # Avoid retaining uploaded CAD after successful conversion.
            item["source"].unlink(missing_ok=True)
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        log.warning("Conversion failed for %s: %r", job_id, exc)
        item.update(status="failed", stage="Ошибка конвертации", message="Конвертер отсутствует, превысил время ожидания или не смог открыть файл.", updated=time.time())
        item["source"].unlink(missing_ok=True)
    except Exception as exc:
        log.exception("Import error for %s", job_id)
        item.update(status="failed", stage="Ошибка импорта", message=str(exc)[:220], updated=time.time())
        item["source"].unlink(missing_ok=True)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "ifc": bool(shutil.which(os.getenv("FORMA_IFCCONVERT_BIN", "IfcConvert"))), "blender": bool(shutil.which(os.getenv("FORMA_BLENDER_BIN", "blender")))}


@app.post("/api/imports", response_model=JobView, status_code=202)
async def start_import(file: UploadFile = File(...)) -> JobView:
    cleanup_expired()
    raw_name = Path(file.filename or "model").name
    ext = Path(raw_name).suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(415, detail="Сервер принимает IFC, SKP, FBX, OBJ и BLEND.")
    if len(jobs) >= 30:
        raise HTTPException(503, detail="Очередь заполнена. Повторите позже.")
    job_id = uuid.uuid4().hex
    directory = Path(tempfile.mkdtemp(prefix=f"forma-{job_id[:8]}-"))
    source = directory / f"source{ext}"
    result = directory / "model.glb"
    try:
        received = 0
        with source.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                received += len(chunk)
                if received > MAX_BYTES:
                    raise HTTPException(413, detail="Максимальный размер исходной модели — 150 МБ.")
                output.write(chunk)
        if received == 0:
            raise HTTPException(400, detail="Файл пуст.")
    except Exception:
        shutil.rmtree(directory, ignore_errors=True)
        raise
    finally:
        await file.close()
    jobs[job_id] = {
        "status": "queued",
        "stage": "Ожидание конвертера",
        "original_name": raw_name[:160],
        "source": source,
        "result": result,
        "directory": directory,
        "updated": time.time(),
    }
    asyncio.create_task(worker(job_id))
    return view(job_id)


@app.get("/api/imports/{job_id}", response_model=JobView)
def get_import(job_id: str) -> JobView:
    cleanup_expired()
    if job_id not in jobs:
        raise HTTPException(404, detail="Задание не найдено или срок хранения истёк.")
    return view(job_id)


@app.get("/api/imports/{job_id}/result")
def get_result(job_id: str):
    item = jobs.get(job_id)
    if item is None or item["status"] != "ready" or not item["result"].is_file():
        raise HTTPException(404, detail="GLB ещё не готов или уже удалён.")
    return FileResponse(item["result"], media_type="model/gltf-binary", filename="forma-model.glb")
