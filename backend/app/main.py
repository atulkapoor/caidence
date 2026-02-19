from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
import app.models # Import all models to register them with Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed by Alembic migrations (run via start.sh before uvicorn).
    # Do NOT use Base.metadata.create_all here — it conflicts with Alembic
    # by creating tables that migrations expect to create, causing "already exists" errors.

    # Seed roles with permissions_json
    from app.core.database import AsyncSessionLocal
    from app.seeds.seed_roles import seed_roles
    async with AsyncSessionLocal() as session:
        await seed_roles(session)

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
# In production, use explicit origins from settings
# In development, allow_origins_list defaults to localhost:3000
cors_origins = settings.allowed_origins_list if settings.is_production else ["*"]
print(f"DEBUG: Environment: {settings.ENVIRONMENT}, CORS Origins: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if settings.is_production else ["*"],  # Restrictive in prod, permissive in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add ProxyHeadersMiddleware to trust headers from the proxy (Traefik/Nginx/Next.js)
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

@app.get("/")
async def root():
    return {"message": "Welcome to C(AI)DENCE Dashboard API"}

# We will include routers here later
from app.api.api import api_router

from app.services.ai_service import AIService

@app.get("/health")
async def health_check():
    ai_status = await AIService.get_system_status()
    return {
        "status": "ok", 
        "version": settings.PROJECT_VERSION,
        "ai": ai_status
    }

app.include_router(api_router, prefix=settings.API_V1_STR)

