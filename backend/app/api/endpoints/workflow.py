from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from typing import List

router = APIRouter()

@router.get("", response_model=List[schemas.Workflow])
async def get_workflows(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Workflow).order_by(models.Workflow.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("", response_model=schemas.Workflow)
async def create_workflow(request: schemas.WorkflowCreate, db: AsyncSession = Depends(get_db)):
    db_workflow = models.Workflow(
        name=request.name,
        description=request.description,
        steps_json=request.steps_json,
        status="active",
        user_id=1 # Default User
    )
    db.add(db_workflow)
    await db.commit()
    await db.refresh(db_workflow)
    return db_workflow

@router.patch("/{workflow_id}", response_model=schemas.Workflow)
async def update_workflow(workflow_id: int, request: schemas.WorkflowCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Workflow).where(models.Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow.name = request.name
    workflow.description = request.description
    workflow.steps_json = request.steps_json
    # status can be handled separately if needed, keeping simple for now
    
    await db.commit()
    await db.refresh(workflow)
    return workflow

@router.get("/{workflow_id}", response_model=schemas.Workflow)
async def get_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Workflow).where(models.Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.get("/{workflow_id}/history", response_model=List[schemas.WorkflowRun])
async def get_workflow_history(workflow_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.WorkflowRun).where(models.WorkflowRun.workflow_id == workflow_id).order_by(models.WorkflowRun.started_at.desc()))
    return result.scalars().all()

@router.post("/{workflow_id}/run", response_model=schemas.WorkflowRun)
async def run_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    # Check workflow exists
    result = await db.execute(select(models.Workflow).where(models.Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Create Run Record
    run = models.WorkflowRun(
        workflow_id=workflow.id,
        status="completed", # Mocking instant completion
        logs="[INFO] Starting workflow...\n[INFO] Step 1 executed successfully.\n[SUCCESS] Workflow completed.",
        completed_at=func.now()
    )
    db.add(run)
    
    # Update Stats
    workflow.run_count += 1
    # workflow.last_run = func.now() # This might be tricky with async update, let's see
    
    await db.commit()
    await db.refresh(run)
    # Refresh workflow to return fresh state if needed, but we return run here
    
    return run
