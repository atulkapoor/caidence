from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.database import get_db
from app.models import models
from app.models.models import User
from app.schemas import schemas
from app.api.deps import get_current_active_user
from app.services.rbac_scope import visible_user_filter

router = APIRouter()

@router.post("/", response_model=schemas.Project)
async def create_project(
    project: schemas.ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_project = models.Project(**project.model_dump(), owner_id=current_user.id)
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[schemas.Project])
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(models.Project)
        .where(visible_user_filter(current_user, models.Project.owner_id))
        .offset(skip)
        .limit(limit)
    )
    projects = result.scalars().all()
    return projects
