# Celery Production Setup Guide

This document outlines how to migrate from ARQ (development) to Celery (production) for the C(AI)DENCE job queue.

## Current Development Setup (ARQ)

ARQ is a lightweight Redis-based job queue, ideal for development:

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start ARQ Worker
arq app.services.job_queue.WorkerSettings
```

## Production Setup (Celery)

For production, Celery provides more features: monitoring, priority queues, retries, and better scalability.

### 1. Install Dependencies

```bash
pip install celery[redis] flower
```

### 2. Create Celery App (`app/celery_app.py`)

```python
from celery import Celery
import os

celery_app = Celery(
    "cadence",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    worker_prefetch_multiplier=1,
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.services"])
```

### 3. Convert Tasks (`app/services/celery_tasks.py`)

```python
from app.celery_app import celery_app

@celery_app.task(bind=True, max_retries=3)
def generate_content_task(self, platform: str, content_type: str, prompt: str, title: str):
    from app.services.ai_service import AIService
    import asyncio
    
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(
        AIService.generate_content(platform, content_type, prompt)
    )
    return {"success": True, "title": title, "content": result}
```

### 4. Environment Variables

```env
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### 5. Running Workers

```bash
# Start Celery Worker
celery -A app.celery_app worker --loglevel=info --concurrency=4

# Start Flower Monitoring (optional)
celery -A app.celery_app flower --port=5555
```

### 6. Docker Compose (Production)

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
  
  celery-worker:
    build: ./backend
    command: celery -A app.celery_app worker --loglevel=info
    depends_on:
      - redis
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
  
  celery-beat:
    build: ./backend
    command: celery -A app.celery_app beat --loglevel=info
    depends_on:
      - redis
```

## Migration Path

1. **Phase 1 (Current)**: ARQ for development simplicity
2. **Phase 2**: Add Celery alongside ARQ, test in staging
3. **Phase 3**: Full Celery in production with Flower monitoring
