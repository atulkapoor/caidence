"""
Jobs API Endpoints.

Provides REST API for enqueuing and monitoring background jobs.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

router = APIRouter()


# --- Pydantic Models ---

class JobEnqueueRequest(BaseModel):
    task_name: str
    args: Optional[List[Any]] = []
    kwargs: Optional[Dict[str, Any]] = {}


class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: Optional[str] = None


# --- Endpoints ---

@router.post("/enqueue", response_model=JobResponse)
async def enqueue_job(request: JobEnqueueRequest):
    """
    Enqueue a new background job.
    
    Available tasks:
    - generate_content: AI content generation
    - generate_design: AI design/image generation
    - generate_presentation: AI presentation slides
    - send_campaign_emails: Bulk email sending
    - execute_workflow: Workflow automation
    """
    from app.services.job_queue import job_queue
    from app.services.job_tasks import TASK_REGISTRY
    
    # Validate task name
    if request.task_name not in TASK_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown task: {request.task_name}. Available: {list(TASK_REGISTRY.keys())}"
        )
    
    # Enqueue the job
    try:
        job_id = await job_queue.enqueue(
            request.task_name,
            *request.args,
            **request.kwargs
        )
        return JobResponse(
            job_id=job_id,
            status="queued" if job_queue.is_connected() else "completed",
            message="Job enqueued successfully" if job_queue.is_connected() else "Job executed synchronously (Redis unavailable)"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a background job."""
    from app.services.job_queue import job_queue
    
    result = await job_queue.get_job_status(job_id)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    
    return JobStatusResponse(**result)


@router.get("/health")
async def queue_health():
    """Get the health status of the job queue."""
    from app.services.job_queue import job_queue
    
    return await job_queue.get_queue_health()


# --- Convenience Endpoints for Common Tasks ---

class ContentGenerationRequest(BaseModel):
    title: str
    platform: str
    content_type: str
    prompt: str


@router.post("/generate-content", response_model=JobResponse)
async def enqueue_content_generation(request: ContentGenerationRequest):
    """Enqueue a content generation job."""
    from app.services.job_queue import job_queue
    
    job_id = await job_queue.enqueue(
        "generate_content",
        request.platform,
        request.content_type,
        request.prompt,
        request.title
    )
    
    return JobResponse(
        job_id=job_id,
        status="queued" if job_queue.is_connected() else "completed",
        message="Content generation job enqueued"
    )


class DesignGenerationRequest(BaseModel):
    title: str
    style: str
    prompt: str


@router.post("/generate-design", response_model=JobResponse)
async def enqueue_design_generation(request: DesignGenerationRequest):
    """Enqueue a design generation job."""
    from app.services.job_queue import job_queue
    
    job_id = await job_queue.enqueue(
        "generate_design",
        request.style,
        request.prompt,
        request.title
    )
    
    return JobResponse(
        job_id=job_id,
        status="queued" if job_queue.is_connected() else "completed",
        message="Design generation job enqueued"
    )
