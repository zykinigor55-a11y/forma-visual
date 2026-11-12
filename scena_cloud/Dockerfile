FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 OMP_NUM_THREADS=1 MKL_NUM_THREADS=1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libgomp1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY scena_cloud/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.3.1 torchaudio==2.3.1
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY scena_cloud/server.py /app/server.py
CMD ["sh","-c","uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
