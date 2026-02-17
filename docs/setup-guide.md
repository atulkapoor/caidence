# C(AI)DENCE Setup Guide

## 1. Prerequisites

Ensure the following are installed before proceeding:

| Tool | Minimum Version | Notes |
|---|---|---|
| Python | 3.11+ | Needed for the FastAPI backend |
| Node.js | 18+ | Needed for the Next.js frontend |
| Docker + Docker Compose | Any recent version | Optional; required for full-stack Docker setup |
| Ollama | Any recent version | Optional; required for local AI/LLM features |

Verify your versions:

```bash
python --version     # Python 3.11.x or higher
node --version       # v18.x or higher
docker --version     # optional
ollama --version     # optional
```

---

## 2. Clone & Directory Structure

```bash
git clone <repository-url> caidence
cd caidence
```

The project root is organised as follows:

```
caidence/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/           # Routers and endpoint handlers
│   │   ├── core/          # Config, database, decorators, tenant_filter
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── seeds/         # Database seed scripts
│   │   ├── services/      # Business logic (auth, permission_engine, etc.)
│   │   └── main.py        # FastAPI app factory and lifespan startup
│   ├── alembic/           # Database migration scripts
│   ├── alembic.ini        # Alembic configuration
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile
├── frontend/              # Next.js 14 application
│   ├── src/
│   │   ├── app/           # Next.js App Router pages and layouts
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React context providers (PermissionContext)
│   │   ├── lib/           # API client, permissions, utilities
│   │   └── types/         # TypeScript type definitions
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml     # Dev full-stack Docker setup
├── docker-compose.prod.yml
└── docs/                  # This directory
```

---

## 3. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt
```

---

## 4. Environment Variables

Create a `.env` file inside the `backend/` directory. The backend reads this file automatically via `pydantic-settings`.

### All Environment Variables

| Variable | Default | Required in Prod | Description |
|---|---|---|---|
| `ENVIRONMENT` | `development` | Yes | `development`, `staging`, or `production`. Controls CORS and mock auth. |
| `SECRET_KEY` | `your-super-secret-key-change-in-production-at-least-32-chars` | **Yes** | JWT signing key. App **crashes on startup** in production if this is still the default. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | No | JWT token lifetime in minutes. |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Yes (prod) | Comma-separated list of allowed CORS origins. Only enforced when `ENVIRONMENT=production`. |
| `DATABASE_URL` | _(auto: SQLite)_ | No | Full async DB URL. If not set, defaults to `sqlite+aiosqlite:///./sql_app.db`. If a `postgresql://` URL is provided it is automatically rewritten to `postgresql+asyncpg://`. |
| `POSTGRES_SERVER` | `localhost` | No | Used to assemble the PostgreSQL URL if `DATABASE_URL` is not set explicitly. |
| `POSTGRES_USER` | `postgres` | No | PostgreSQL username. |
| `POSTGRES_PASSWORD` | `postgres` | No | PostgreSQL password. |
| `POSTGRES_DB` | `cadence_ai` | No | PostgreSQL database name. |
| `POSTGRES_PORT` | `5432` | No | PostgreSQL port. |
| `FIRST_SUPERUSER` | `admin@caidence.ai` | No | Email for the initial superuser account created on first seed. |
| `FIRST_SUPERUSER_PASSWORD` | `admin123` | **Yes** | Password for the initial superuser. App **crashes on startup** in production if this is still the default. |
| `LLM_PROVIDER` | `ollama` | No | LLM backend provider. Currently `ollama`. |
| `LLM_MODEL` | _(empty, auto-detect)_ | No | Specific Ollama model to use, e.g. `qwen2.5:0.5b`. Empty string triggers auto-detection. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | No | Base URL for the Ollama API. |
| `REDIS_HOST` | `localhost` | No | Redis server hostname for the job queue. |
| `REDIS_PORT` | `6379` | No | Redis server port. |
| `REDIS_DB` | `0` | No | Redis database index. |

### Sample `.env` file (development)

Create `backend/.env` with the following content, adjusting as needed:

```dotenv
# Environment
ENVIRONMENT=development

# Security (change in production)
SECRET_KEY=your-super-secret-key-change-in-production-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (comma-separated, only enforced in production)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Database — leave unset to use SQLite (default), or set for PostgreSQL
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cadence_ai

# PostgreSQL individual fields (only used if DATABASE_URL is not set)
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=cadence_ai
POSTGRES_PORT=5432

# Initial superuser
FIRST_SUPERUSER=admin@caidence.ai
FIRST_SUPERUSER_PASSWORD=admin123

# LLM / Ollama
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:0.5b
OLLAMA_BASE_URL=http://localhost:11434

# Redis (optional, for background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### Generating a secure SECRET_KEY for production

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 5. Database

### SQLite (default — no setup required)

By default, the backend uses SQLite stored at `backend/sql_app.db`. No database installation is needed. Tables are created automatically on startup via the lifespan `create_all` call.

### PostgreSQL (for production or team development)

**Option A — Docker (recommended)**

```bash
docker run -d \
  --name cadence-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cadence_ai \
  -p 5432:5432 \
  postgres:15-alpine
```

Then set in `backend/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cadence_ai
```

**Option B — Manual PostgreSQL install**

Install PostgreSQL 15 from https://www.postgresql.org/download/, create the database, and update `DATABASE_URL` accordingly.

### Alembic Migrations

The project includes Alembic for schema migrations. The `alembic.ini` is located at `backend/alembic.ini`.

```bash
cd backend

# Apply all pending migrations to bring the schema up to date
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "describe your change"
```

> Note: In development with SQLite, `Base.metadata.create_all` on startup handles table creation automatically. Alembic is primarily used for production deployments and schema evolution.

---

## 6. Start the Backend

With the virtual environment activated and `.env` in place:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The backend will:
1. Create all database tables (if they do not exist).
2. Seed all 8 system roles with their default permissions.
3. Start listening on `http://localhost:8000`.

Verify with:
- Root: `http://localhost:8000/` → `{"message": "Welcome to C(AI)DENCE Dashboard API"}`
- Health: `http://localhost:8000/health` → `{"status": "ok", "version": "0.1.0", "ai": {...}}`
- API Docs: `http://localhost:8000/api/v1/openapi.json`
- Swagger UI: `http://localhost:8000/docs`

---

## 7. Frontend Setup

```bash
cd frontend

# Install dependencies (--legacy-peer-deps resolves peer dep conflicts)
npm ci --legacy-peer-deps

# Start the development server
npm run dev
```

The frontend starts at `http://localhost:3000`.

The frontend proxies API calls to the backend. The API base URL is set in `frontend/src/lib/api/core.ts` as `/api/v1`, which routes through Next.js's built-in proxy (defined in `next.config.js`) to `http://localhost:8000`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server (requires build first) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests in watch mode |
| `npm run test:run` | Run Vitest unit tests once (CI mode) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright end-to-end tests |

---

## 8. Docker (Full-Stack)

The `docker-compose.yml` at the project root starts the entire stack:

```bash
# From the project root
docker compose up --build
```

This starts the following services:

| Service | Port | Description |
|---|---|---|
| `backend` | 8000 | FastAPI app, connected to `db` and `ollama` |
| `frontend` | 3000 | Next.js app |
| `db` | 5432 | PostgreSQL 15 (persisted via `postgres_data` volume) |
| `adminer` | 8080 | Lightweight DB admin UI |
| `ollama` | 11434 | Local LLM server (models persisted via `ollama_models` volume) |
| `ai_worker` | 8001 | Background AI worker service |

The Docker backend is pre-configured with:

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/cadence_ai
OLLAMA_BASE_URL=http://ollama:11434
LLM_MODEL=qwen2.5:0.5b
```

To stop all services and remove containers:

```bash
docker compose down
```

To also remove volumes (database data, Ollama models):

```bash
docker compose down -v
```

---

## 9. Seed Data

### Role Seeding (Automatic)

All 8 system roles are seeded **automatically on every backend startup** — no manual step required. The `seed_roles()` function performs an upsert (insert if not exists, update if exists) for each role definition.

Roles seeded:

| Role | Hierarchy Level | Description |
|---|---|---|
| `root` | 110 | Platform root with unrestricted access |
| `super_admin` | 100 | Platform administrator with full access |
| `agency_admin` | 80 | Agency-level administrator |
| `agency_member` | 60 | Agency team member with limited write access |
| `brand_admin` | 50 | Brand-level administrator |
| `brand_member` | 40 | Brand team member, read-heavy |
| `creator` | 20 | Content creator with content tools access |
| `viewer` | 10 | Read-only access to selected resources |

### Initial Superuser

The `FIRST_SUPERUSER` and `FIRST_SUPERUSER_PASSWORD` env vars define the initial admin account. This account is used to log in and approve other users, assign roles, and manage organisations.

The superuser account is not auto-created on startup by the application code. To create it manually, use the helper script at the project root:

```bash
cd backend
python create_superuser.py
```

Or use the `reset_admin_password.py` script at the project root if the admin account exists but the password needs resetting:

```bash
python reset_admin_password.py
```

### User Approval

New user registrations require super admin approval. The `is_approved` flag on the `User` model defaults to `False`. Users cannot log in until approved.

To approve a test user from the backend directory:

```bash
python approve_test_user.py
```

---

## 10. Ollama (AI Features)

If you want to use the local AI features (content generation, AI agent, AI chat), Ollama must be running.

**Install Ollama**: https://ollama.com/download

```bash
# Start Ollama (runs on port 11434 by default)
ollama serve

# Pull the default model
ollama pull qwen2.5:0.5b

# Verify
ollama list
```

Set `OLLAMA_BASE_URL=http://localhost:11434` in `backend/.env` (this is the default). Optionally set `LLM_MODEL=qwen2.5:0.5b` to pin a specific model.

The `/health` endpoint reports the AI system status:

```bash
curl http://localhost:8000/health
# {"status": "ok", "version": "0.1.0", "ai": {"provider": "ollama", "model": "...", "status": "available"}}
```

---

## 11. Verification Checklist

After completing setup, verify each layer:

### Backend
- [ ] `http://localhost:8000/` returns `{"message": "Welcome to C(AI)DENCE Dashboard API"}`
- [ ] `http://localhost:8000/health` returns `{"status": "ok", ...}`
- [ ] `http://localhost:8000/docs` shows the Swagger UI with all 24 router groups
- [ ] `http://localhost:8000/api/v1/openapi.json` is accessible

### Frontend
- [ ] `http://localhost:3000` loads the login page
- [ ] Login with `FIRST_SUPERUSER` credentials succeeds and redirects to `/dashboard`

### Database
- [ ] `backend/sql_app.db` exists (SQLite) or PostgreSQL connection succeeds
- [ ] Tables created: `users`, `roles`, `permissions`, `organizations`, `brands`, `creators`, `teams`, `campaigns`, etc.
- [ ] Roles table has 8 rows after startup

### Docker (if used)
- [ ] `docker compose ps` shows all services as `running`
- [ ] `http://localhost:8080` (Adminer) connects to the `cadence_ai` database
- [ ] Ollama: `curl http://localhost:11434/api/tags` returns available models
