"""
Job Queue Service - Async Task Management with ARQ.

ARQ is a lightweight Redis-based job queue.
For production, consider migrating to Celery for more features.

Usage:
    1. Start Redis: docker run -d -p 6379:6379 redis:alpine
    2. Start Worker: arq app.services.job_queue.WorkerSettings
    3. Enqueue jobs via the job_service singleton
"""

import os
import json
import logging
from typing import Optional, Dict, Any, Callable
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Optional ARQ import - graceful fallback
try:
    from arq import create_pool
    from arq.connections import RedisSettings, ArqRedis
    ARQ_AVAILABLE = True
except ImportError:
    ARQ_AVAILABLE = False
    logger.warning("ARQ not installed. Job queue will run synchronously.")


# Redis configuration from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))


class JobStatus:
    """Job status constants."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobResult:
    """Represents the result of a background job."""
    def __init__(self, job_id: str, status: str, result: Any = None, error: Optional[str] = None):
        self.job_id = job_id
        self.status = status
        self.result = result
        self.error = error
        self.created_at = datetime.utcnow()
    
    def to_dict(self) -> Dict:
        return {
            "job_id": self.job_id,
            "status": self.status,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat()
        }


# In-memory job store for synchronous fallback mode
_job_store: Dict[str, JobResult] = {}


class JobQueue:
    """
    Async Job Queue Service.
    
    Uses ARQ (Redis-based) when available.
    Falls back to synchronous execution when Redis unavailable.
    """
    
    def __init__(self):
        self.redis_pool: Optional[ArqRedis] = None
        self._connected = False
    
    async def connect(self) -> bool:
        """Initialize connection to Redis."""
        if not ARQ_AVAILABLE:
            logger.warning("ARQ not available. Running in sync mode.")
            return False
        
        try:
            self.redis_pool = await create_pool(
                RedisSettings(
                    host=REDIS_HOST,
                    port=REDIS_PORT,
                    database=REDIS_DB
                )
            )
            self._connected = True
            logger.info(f"Job queue connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._connected = False
            return False
    
    async def disconnect(self):
        """Close Redis connection."""
        if self.redis_pool:
            await self.redis_pool.close()
            self._connected = False
    
    def is_connected(self) -> bool:
        """Check if Redis is connected."""
        return self._connected
    
    async def enqueue(
        self,
        task_name: str,
        *args,
        _job_id: Optional[str] = None,
        _defer_by: Optional[timedelta] = None,
        **kwargs
    ) -> str:
        """
        Enqueue a job for async execution.
        
        Args:
            task_name: Name of the task function to run
            *args: Positional arguments for the task
            _job_id: Optional custom job ID
            _defer_by: Optional delay before executing
            **kwargs: Keyword arguments for the task
        
        Returns:
            job_id: Unique identifier for the job
        """
        import uuid
        job_id = _job_id or str(uuid.uuid4())
        
        if self._connected and self.redis_pool:
            try:
                job = await self.redis_pool.enqueue_job(
                    task_name,
                    *args,
                    _job_id=job_id,
                    _defer_by=_defer_by,
                    **kwargs
                )
                logger.info(f"Enqueued job {job_id} for task '{task_name}'")
                return job_id
            except Exception as e:
                logger.error(f"Failed to enqueue job: {e}")
                # Fall through to sync execution
        
        # Synchronous fallback - execute immediately
        logger.info(f"[Sync Mode] Executing task '{task_name}' immediately")
        return await self._execute_sync(job_id, task_name, args, kwargs)
    
    async def _execute_sync(
        self,
        job_id: str,
        task_name: str,
        args: tuple,
        kwargs: dict
    ) -> str:
        """Execute a task synchronously (fallback mode)."""
        from app.services.job_tasks import TASK_REGISTRY
        
        _job_store[job_id] = JobResult(job_id, JobStatus.RUNNING)
        
        try:
            task_func = TASK_REGISTRY.get(task_name)
            if not task_func:
                raise ValueError(f"Unknown task: {task_name}")
            
            result = await task_func(None, *args, **kwargs)  # ctx is None in sync mode
            _job_store[job_id] = JobResult(job_id, JobStatus.COMPLETED, result=result)
            logger.info(f"[Sync] Job {job_id} completed")
        except Exception as e:
            logger.error(f"[Sync] Job {job_id} failed: {e}")
            _job_store[job_id] = JobResult(job_id, JobStatus.FAILED, error=str(e))
        
        return job_id
    
    async def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get the status of a job."""
        # Check in-memory store first (sync mode)
        if job_id in _job_store:
            return _job_store[job_id].to_dict()
        
        # Check Redis if connected
        if self._connected and self.redis_pool:
            try:
                job = await self.redis_pool.get_job(job_id)
                if job:
                    return {
                        "job_id": job_id,
                        "status": job.status if hasattr(job, 'status') else "unknown",
                        "result": job.result if hasattr(job, 'result') else None
                    }
            except Exception as e:
                logger.error(f"Failed to get job status: {e}")
        
        return None
    
    async def get_queue_health(self) -> Dict:
        """Get queue health status."""
        return {
            "connected": self._connected,
            "backend": "ARQ/Redis" if self._connected else "Synchronous (Fallback)",
            "redis_host": f"{REDIS_HOST}:{REDIS_PORT}" if ARQ_AVAILABLE else None,
            "pending_jobs": len([j for j in _job_store.values() if j.status == JobStatus.PENDING])
        }


# Singleton instance
job_queue = JobQueue()


# ARQ Worker Settings (for running the worker process)
class WorkerSettings:
    """ARQ Worker configuration."""
    
    redis_settings = RedisSettings(
        host=REDIS_HOST,
        port=REDIS_PORT,
        database=REDIS_DB
    ) if ARQ_AVAILABLE else None
    
    # Import tasks dynamically
    @staticmethod
    def get_functions():
        from app.services.job_tasks import TASK_FUNCTIONS
        return TASK_FUNCTIONS
    
    functions = property(get_functions)
    
    # Worker settings
    max_jobs = 10
    job_timeout = 300  # 5 minutes
    keep_result = 3600  # 1 hour
