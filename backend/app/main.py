from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
import app.models.models # Import models to register them with Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed Data
    from app.core.database import AsyncSessionLocal
    from app.models.models import User
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == 1))
        user = result.scalar_one_or_none()
        if not user:
            # Seed default user
            demo_user = User(id=1, email="demo@example.com", full_name="Demo User", is_active=True)
            session.add(demo_user)
            await session.commit()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
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

