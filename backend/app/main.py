from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
import app.models # Import all models to register them with Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Create tables on startup (optional if using alembic, but keeps dev easy)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
print(f"DEBUG: Allowed Origins: {settings.allowed_origins_list}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

