# Build context: ./backend (see docker-compose.yml)
FROM python:3.11-slim

ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV GIT_COMMIT=${GIT_COMMIT} \
    BUILD_TIME=${BUILD_TIME}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN printf '{"git_commit":"%s","image_built_at":"%s","backend_entry":"app.main:app"}\n' \
    "${GIT_COMMIT}" "${BUILD_TIME}" > /app/build_meta.json

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
