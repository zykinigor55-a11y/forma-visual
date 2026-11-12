FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 OMP_NUM_THREADS=1 MKL_NUM_THREADS=1
ENV TORCH_HOME=/opt/torch-cache SCENA_WHISPER_MODEL_PATH=/opt/models/whisper-tiny
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libgomp1 ca-certificates curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY scena_cloud/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.3.1 torchaudio==2.3.1
RUN pip install --no-cache-dir -r /app/requirements.txt
# The original Demucs download host presents an expired certificate. Bake the same
# weights into PyTorch's model cache from a TLS-verified mirror. SHA256 is pinned
# to the upstream Demucs checkpoint 955717e8-8726e21a.th; never bypass TLS.
RUN mkdir -p /opt/torch-cache/hub/checkpoints && \
    curl --fail --location --retry 4 --retry-all-errors --connect-timeout 20 --max-time 600 \
    'https://huggingface.co/iBoostAI/Demucs-v4/resolve/main/955717e8-8726e21a.th' \
    -o /opt/torch-cache/hub/checkpoints/955717e8-8726e21a.th && \
    echo '8726e21a993978c7ba086d3872e7608d7d5bfca646ca4aca459ffda844faa8b4  /opt/torch-cache/hub/checkpoints/955717e8-8726e21a.th' | sha256sum -c -
# Also bake speech weights, to avoid downloading them during the first request.
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='Systran/faster-whisper-tiny',local_dir='/opt/models/whisper-tiny',allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.txt','preprocessor_config.json'])" && \
    echo 'dcb76c6586fc06cbdac6dd21f14cfd129cc4cdd9dce19bf4ffa62e59cbe6e6d1  /opt/models/whisper-tiny/model.bin' | sha256sum -c -
COPY scena_cloud/server.py /app/server.py
COPY scena_app/index.html /app/site/index.html
CMD ["sh","-c","uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
