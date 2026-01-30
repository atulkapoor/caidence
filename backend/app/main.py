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
        
    # Seed Data
    from app.core.database import AsyncSessionLocal
    from app.models import User, Organization, Role
    from app.services.auth_service import get_password_hash
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        # 1. Ensure Root Role Exists
        result = await session.execute(select(Role).where(Role.name == "root"))
        root_role = result.scalar_one_or_none()
        if not root_role:
            root_role = Role(
                name="root",
                display_name="Root Admin",
                description="Global system administrator with full access.",
                hierarchy_level=110,
                permissions_json={"all": True}
            )
            session.add(root_role)
            await session.commit()
            await session.refresh(root_role)
            
        # 2. Ensure Default Organization Exists
        result = await session.execute(select(Organization).where(Organization.slug == "cadence-ai"))
        cadence_org = result.scalar_one_or_none()
        if not cadence_org:
            cadence_org = Organization(
                name="Cadence AI",
                slug="cadence-ai",
                plan_tier="enterprise",
                is_active=True
            )
            session.add(cadence_org)
            await session.commit()
            await session.refresh(cadence_org)

        # 3. Ensure Root User Exists
        # Only seed if configured (avoids hardcoding credentials in codebase)
        initial_user_email = settings.FIRST_SUPERUSER
        initial_user_password = settings.FIRST_SUPERUSER_PASSWORD
        
        result = await session.execute(select(User).where(User.email == initial_user_email))
        user = result.scalar_one_or_none()
        if not user and initial_user_email and initial_user_password:
            # Seed default user
            demo_user = User(
                id=1, 
                email=initial_user_email, 
                full_name="System Admin", 
                role="root", # Legacy field
                role_id=root_role.id,
                organization_id=cadence_org.id,
                hashed_password=get_password_hash(initial_user_password), 
                is_active=True,
                is_approved=True
            )
            session.add(demo_user)
            await session.commit()
            print(f"Seeded '{initial_user_email}' user.")

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

