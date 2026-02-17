# C(AI)DENCE Deployment Guide

This document covers production deployment of the C(AI)DENCE platform. The stack is FastAPI (backend) + Next.js 14 (frontend) + PostgreSQL + Redis + Ollama, orchestrated with Docker Compose.

---

## 1. Production Environment Variables

All environment variables are loaded from `backend/.env` (via `pydantic_settings` with `env_file=".env"`). The backend will **refuse to start** in production if `SECRET_KEY` or `FIRST_SUPERUSER_PASSWORD` are left at their default values (enforced by `model_validator` in `backend/app/core/config.py`).

### Required — Application

| Variable | Default | Production Value |
|---|---|---|
| `ENVIRONMENT` | `development` | `production` |
| `SECRET_KEY` | `your-super-secret-key-...` | **Must override.** Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Recommended: `30`–`60` |
| `ALLOWED_ORIGINS` | `http://localhost:3000,...` | Your public frontend URL(s), comma-separated (e.g., `https://app.caidence.ai`). In production, CORS is set to this exact list; in development it defaults to `*`. |

### Required — Database

| Variable | Default | Production Value |
|---|---|---|
| `DATABASE_URL` | *(derives from parts below)* | `postgresql+asyncpg://USER:PASSWORD@HOST:5432/DB_NAME` — preferred over individual parts |
| `POSTGRES_SERVER` | `localhost` | Hostname of your Postgres container or managed DB |
| `POSTGRES_USER` | `postgres` | A dedicated application user (not `postgres`) |
| `POSTGRES_PASSWORD` | `postgres` | A strong random password |
| `POSTGRES_DB` | `cadence_ai` | Your database name |
| `POSTGRES_PORT` | `5432` | `5432` |

> Note: If `DATABASE_URL` starts with `postgresql://` (sync driver), the config automatically rewrites it to `postgresql+asyncpg://` for the async engine.
> If neither `DATABASE_URL` nor Postgres variables are set, the app falls back to a local SQLite file (`sql_app.db`). **Do not use SQLite in production.**

### Required — First Superuser

| Variable | Default | Production Value |
|---|---|---|
| `FIRST_SUPERUSER` | `admin@caidence.ai` | Your admin email address |
| `FIRST_SUPERUSER_PASSWORD` | `admin123` | **Must override.** A strong password (minimum 12 characters). |

The app refuses to start in production with the default `admin123` password.

### Required — AI (LLM)

| Variable | Default | Production Value |
|---|---|---|
| `LLM_PROVIDER` | `ollama` | `ollama` (self-hosted) or future cloud provider |
| `LLM_MODEL` | *(empty — auto-detect)* | E.g., `qwen2.5:0.5b` for the lightweight model used in `docker-compose.prod.yml` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | `http://ollama:11434` (Docker service name) |

### Optional — Redis (Job Queue)

| Variable | Default | Production Value |
|---|---|---|
| `REDIS_HOST` | `localhost` | `redis` (Docker service name) |
| `REDIS_PORT` | `6379` | `6379` |
| `REDIS_DB` | `0` | `0` |

If Redis is unavailable, background jobs execute synchronously as a fallback. For production workloads with heavy AI generation, Redis is strongly recommended.

### Optional — Discovery Integration

| Variable | Default | Production Value |
|---|---|---|
| `INFLUENCERS_CLUB_API_KEY` | *(not set)* | Your Influencers Club API key. Without this, all `/api/v1/discovery` endpoints return 503. |

### Frontend Environment Variables

Set in `docker-compose.prod.yml` or a `.env.local` file at the Next.js root:

| Variable | Development | Production |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | `https://your-domain.com/api` |
| `INTERNAL_API_URL` | `http://backend:8000` | `http://backend:8000` (internal Docker network) |
| `NODE_ENV` | `development` | `production` |

---

## 2. Docker Production Deployment

A `docker-compose.prod.yml` exists at the repository root. It defines the following services:

| Service | Image | Port(s) | Notes |
|---|---|---|---|
| `backend` | Built from `./backend` | `8000:8000` | Runs `start.sh`: waits for Postgres, runs `alembic upgrade head`, then starts uvicorn. |
| `frontend` | Built from `./frontend` | `3000:3000` | Next.js production build. |
| `db` | `postgres:15-alpine` | `5432:5432` | Data persisted in `postgres_data` named volume. |
| `ollama` | `ollama/ollama:latest` | `11434:11434` | Models persisted in `ollama_models` named volume. |
| `ai_worker` | Built from `./ai_worker` | `8001:8001` | Supplementary AI worker service. |
| `adminer` | `adminer` | `8080:8080` | Database UI — **disable or restrict access in production.** |

### Starting Production Services

```bash
# Build and start all services in the background
docker compose -f docker-compose.prod.yml up -d --build

# Watch logs
docker compose -f docker-compose.prod.yml logs -f backend

# Stop all services
docker compose -f docker-compose.prod.yml down
```

### Providing Secrets at Runtime

Do not commit secrets to the repository. Pass them via environment or a `.env` file that is excluded from version control:

```bash
# backend/.env (production)
ENVIRONMENT=production
SECRET_KEY=<generated-value>
FIRST_SUPERUSER_PASSWORD=<strong-password>
DATABASE_URL=postgresql+asyncpg://cadence_user:STRONG_PW@db:5432/cadence_ai
ALLOWED_ORIGINS=https://app.caidence.ai
INFLUENCERS_CLUB_API_KEY=<your-api-key>
REDIS_HOST=redis
```

The `docker-compose.prod.yml` already includes `env_file: - ./backend/.env` for the backend service.

---

## 3. Database Migrations

The project uses **Alembic** for schema versioning. The migration script location is `backend/alembic/`, configured via `backend/alembic.ini`.

### Automatic Migration on Container Start

The `backend/start.sh` script automatically runs `alembic upgrade head` before starting uvicorn:

```bash
alembic upgrade head
```

This ensures the database schema is always current before the application receives traffic.

### Manual Migration Commands

Run these from within the backend container or from the `backend/` directory with the virtualenv active:

```bash
# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Roll back to a specific revision
alembic downgrade <revision_id>

# Check current revision
alembic current

# Show migration history
alembic history

# Create a new migration (auto-detect model changes)
alembic revision --autogenerate -m "description of change"
```

### Running Migrations via Docker Compose

```bash
# Run migrations without restarting the full stack
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Important Notes

- The app also calls `Base.metadata.create_all` in the FastAPI lifespan startup event (`backend/app/main.py`). In production, rely on Alembic for schema changes — `create_all` will not apply incremental migrations.
- Always create a database backup before running migrations in production.
- Test migrations on a staging database before applying to production.

---

## 4. HTTPS and Reverse Proxy Setup

The backend includes `ProxyHeadersMiddleware` (from uvicorn) to correctly trust `X-Forwarded-For` and `X-Forwarded-Proto` headers from a reverse proxy:

```python
# backend/app/main.py
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")
```

### Nginx Configuration

The existing `DEPLOY.md` documents an Nginx + Certbot (Let's Encrypt) setup. A minimal Nginx config for the C(AI)DENCE stack:

```nginx
# /etc/nginx/sites-available/caidence
server {
    listen 80;
    server_name app.caidence.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.caidence.ai;

    ssl_certificate     /etc/letsencrypt/live/app.caidence.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.caidence.ai/privkey.pem;

    # Frontend (Next.js)
    location / {
        proxy_pass         http://localhost:3000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass         http://localhost:8000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Adminer — restrict access by IP in production
    location /adminer/ {
        allow 203.0.113.0/24;   # Your office IP range
        deny  all;
        proxy_pass http://localhost:8080/;
    }
}
```

### Obtaining an SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.caidence.ai
# Certbot auto-configures Nginx and sets up renewal
sudo systemctl enable certbot.timer
```

### Traefik (Alternative)

The app already supports Traefik via `ProxyHeadersMiddleware`. Add standard Traefik labels to the `backend` and `frontend` services in `docker-compose.prod.yml` to enable automatic TLS.

---

## 5. Security Checklist

### SECRET_KEY

Generate a cryptographically secure key before deploying:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Set this as `SECRET_KEY` in `backend/.env`. The `model_validator` in `config.py` will raise a `ValueError` at startup if the default placeholder is detected in production.

### CORS Origins

In production, `ALLOWED_ORIGINS` is enforced strictly. The app sets:

```python
# backend/app/main.py
cors_origins = settings.allowed_origins_list if settings.is_production else ["*"]
```

Set `ALLOWED_ORIGINS` to only the exact origin(s) your frontend serves from:

```bash
ALLOWED_ORIGINS=https://app.caidence.ai
```

Multiple origins are comma-separated:

```bash
ALLOWED_ORIGINS=https://app.caidence.ai,https://admin.caidence.ai
```

### Disable Debug / Mock User

The development mock user (`admin@demo.com`) is explicitly disabled in production:

```python
# backend/app/api/deps.py
if not token:
    if disable_mock_user or settings.is_production:
        raise credentials_exception
```

Setting `ENVIRONMENT=production` is sufficient. You can also set `DISABLE_MOCK_USER=true` explicitly in non-production environments where you want to enforce real authentication.

### Database Password

- Use a dedicated PostgreSQL user (not the `postgres` superuser) for the application.
- Use a strong random password (minimum 32 characters).
- Restrict the database user's privileges to only the `cadence_ai` database.

### Adminer

Adminer is included in `docker-compose.prod.yml` for convenience. In production:
- Restrict access by IP in your reverse proxy config.
- Consider removing it from the production compose file entirely after initial setup.

### Firewall

Expose only ports 80 and 443 publicly. Keep ports 5432 (Postgres), 6379 (Redis), 8000 (backend), 3000 (frontend), 8080 (Adminer), and 11434 (Ollama) bound to `localhost` or the internal Docker network only.

---

## 6. Backup Strategy

### PostgreSQL Backups

**Daily logical backup using `pg_dump`:**

```bash
#!/bin/bash
# /opt/cadence/scripts/backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/cadence/backups
mkdir -p $BACKUP_DIR

docker exec caidence_db_1 pg_dump \
  -U postgres cadence_ai \
  | gzip > "$BACKUP_DIR/cadence_ai_$DATE.sql.gz"

# Retain only the last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Schedule with cron:

```bash
# Run at 2:00 AM daily
0 2 * * * /opt/cadence/scripts/backup.sh >> /var/log/cadence_backup.log 2>&1
```

**Restore from backup:**

```bash
gunzip -c cadence_ai_20260217_020000.sql.gz \
  | docker exec -i caidence_db_1 psql -U postgres cadence_ai
```

### Volume Backups

The `postgres_data` and `ollama_models` named volumes contain persistent state. Back up the Docker volumes using standard volume backup techniques:

```bash
# Backup postgres_data volume
docker run --rm \
  -v caidence_postgres_data:/data \
  -v /opt/cadence/backups:/backup \
  alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz -C /data .

# Backup ollama models volume
docker run --rm \
  -v caidence_ollama_models:/data \
  -v /opt/cadence/backups:/backup \
  alpine tar czf /backup/ollama_models_$(date +%Y%m%d).tar.gz -C /data .
```

### Blue/Green Deployment Rollback

The `deployment/` directory contains an `update.sh` script that implements an atomic blue/green deployment using symlinks at `/opt/cadence/releases`. To roll back:

```bash
# List available releases
ls -lt /opt/cadence/releases

# Point current symlink to a previous release
ln -sfn /opt/cadence/releases/<previous-timestamp> /opt/cadence/current
systemctl restart cadence-backend cadence-frontend
```

---

## 7. Monitoring and Observability

### Health Endpoint

The backend exposes a health check endpoint at `GET /health` (no authentication required):

```json
{
  "status": "ok",
  "version": "0.1.0",
  "ai": {
    "provider": "ollama",
    "model": "qwen2.5:0.5b",
    "status": "connected"
  }
}
```

Use this endpoint in:
- **Docker health checks:** `HEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1`
- **Load balancer health probes** (e.g., Nginx `upstream` health checks, AWS ALB target group checks)
- **Uptime monitoring** services (e.g., UptimeRobot, Betterstack, Checkly)

### Job Queue Health

The background job queue exposes its own health endpoint:

```
GET /api/v1/jobs/health
```

Returns Redis connectivity status and queue depth.

### Log Aggregation

The backend logs to stdout/stderr. Docker Compose captures all logs via the default `json-file` driver. For production log aggregation:

**Option 1 — Loki + Grafana (self-hosted)**

```yaml
# In docker-compose.prod.yml, add to each service:
logging:
  driver: loki
  options:
    loki-url: "http://loki:3100/loki/api/v1/push"
    labels: "service"
```

**Option 2 — Forward to a log management service**

Configure the Docker daemon or use a sidecar (Fluentd, Fluent Bit, Vector) to forward container logs to Datadog, Papertrail, Logtail, or similar.

**Option 3 — Systemd Journal (bare-metal deployment)**

When deployed via systemd (as documented in `DEPLOY.md`), logs are captured by the journal:

```bash
journalctl -u cadence-backend -f
journalctl -u cadence-frontend -f
```

### Recommended Metrics to Monitor

| Metric | Source | Alert Threshold |
|---|---|---|
| API response time (p95) | Nginx / reverse proxy access logs | > 2 seconds |
| `/health` uptime | Uptime monitor | Any 5xx response |
| `GET /api/v1/jobs/health` queue depth | Job queue endpoint | Queue depth > 1000 |
| PostgreSQL connections | `pg_stat_activity` | > 80% of `max_connections` |
| Disk usage (`postgres_data` volume) | Host metrics | > 75% |
| Redis memory usage | `INFO memory` command | > 80% of `maxmemory` |
| Ollama model load time | App logs | Model pull on first request in production |

### Startup Sequence

The `backend/start.sh` script executes in this order on container start:

1. Wait for PostgreSQL to accept connections on port 5432.
2. Run `alembic upgrade head` to apply pending schema migrations.
3. Run `python -m app.utils.init_ollama` to auto-pull any missing AI models (non-fatal if it fails).
4. Start uvicorn on `0.0.0.0:8000`.

On application startup (FastAPI lifespan), the app also:
- Calls `Base.metadata.create_all` to create any tables not yet handled by Alembic.
- Seeds default roles via `app.seeds.seed_roles.seed_roles`.
