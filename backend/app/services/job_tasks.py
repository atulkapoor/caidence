"""
Background Job Tasks.

Define async tasks that can be executed by the job queue.
Each task should be registered in TASK_REGISTRY and TASK_FUNCTIONS.
"""

import logging
from typing import Any, Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


# --- Task Implementations ---

async def generate_content_task(ctx, platform: str, content_type: str, prompt: str, title: str) -> Dict:
    """Background task for AI content generation."""
    from app.services.ai_service import AIService
    
    logger.info(f"[Task] Generating content: {title}")
    
    try:
        result = await AIService.generate_content(
            title=title,
            platform=platform,
            content_type=content_type,
            prompt=prompt,
        )
        return {
            "success": True,
            "title": title,
            "content": result,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Content generation failed: {e}")
        return {"success": False, "error": str(e)}


async def generate_design_task(ctx, style: str, prompt: str, title: str) -> Dict:
    """Background task for AI design generation."""
    from app.services.ai_service import AIService
    
    logger.info(f"[Task] Generating design: {title}")
    
    try:
        image_url = await AIService.generate_image(
            title=title,
            style=style,
            prompt=prompt,
        )
        return {
            "success": True,
            "title": title,
            "image_url": image_url,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Design generation failed: {e}")
        return {"success": False, "error": str(e)}


async def generate_presentation_task(ctx, source_type: str, title: str) -> Dict:
    """Background task for presentation generation."""
    from app.services.ai_service import AIService
    
    logger.info(f"[Task] Generating presentation: {title}")
    
    try:
        slides_json = await AIService.generate_presentation_slides(source_type, title)
        return {
            "success": True,
            "title": title,
            "slides_json": slides_json,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Presentation generation failed: {e}")
        return {"success": False, "error": str(e)}


async def send_campaign_emails_task(ctx, campaign_id: int, recipients: list, subject: str, body: str) -> Dict:
    """Background task for sending bulk campaign emails."""
    from app.services.cpaas_service import cpaas_service
    
    logger.info(f"[Task] Sending {len(recipients)} emails for campaign {campaign_id}")
    
    sent_count = 0
    failed_count = 0
    
    for email in recipients:
        try:
            result = await cpaas_service.send_email(email, subject, body)
            if result.get("status") == "sent":
                sent_count += 1
            else:
                failed_count += 1
        except Exception as e:
            logger.error(f"Failed to send to {email}: {e}")
            failed_count += 1
    
    return {
        "success": True,
        "campaign_id": campaign_id,
        "sent": sent_count,
        "failed": failed_count,
        "completed_at": datetime.utcnow().isoformat()
    }


async def execute_workflow_task(ctx, workflow_id: int, steps_json: str) -> Dict:
    """Background task for executing a workflow."""
    import json
    from app.services.ai_service import AIService
    
    logger.info(f"[Task] Executing workflow {workflow_id}")
    
    try:
        steps = json.loads(steps_json) if isinstance(steps_json, str) else steps_json
        results = []
        
        for i, step in enumerate(steps):
            step_type = step.get("type", "unknown")
            logger.info(f"  Step {i+1}: {step_type}")
            
            # Execute step based on type
            if step_type == "ai_generate":
                result = await AIService.generate_content(
                    title=step.get("title", "Workflow Content"),
                    platform=step.get("platform", "general"),
                    content_type=step.get("content_type", "post"),
                    prompt=step.get("prompt", ""),
                )
                results.append({"step": i+1, "type": step_type, "result": result[:100]})
            else:
                results.append({"step": i+1, "type": step_type, "result": "skipped (unknown type)"})
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "steps_executed": len(results),
            "results": results,
            "completed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}")
        return {"success": False, "workflow_id": workflow_id, "error": str(e)}


# --- Task Registry ---

# Map task names to functions (for sync fallback and routing)
TASK_REGISTRY = {
    "generate_content": generate_content_task,
    "generate_design": generate_design_task,
    "generate_presentation": generate_presentation_task,
    "send_campaign_emails": send_campaign_emails_task,
    "execute_workflow": execute_workflow_task,
}

# List of task functions (for ARQ worker)
TASK_FUNCTIONS = [
    generate_content_task,
    generate_design_task,
    generate_presentation_task,
    send_campaign_emails_task,
    execute_workflow_task,
]
