from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.ai_service import AIService
import json
import random

router = APIRouter()

class AgentInput(BaseModel):
    goal: str
    product: str
    audience: str

class CampaignDraft(BaseModel):
    title: str
    description: str
    budget: str
    channels: List[str]
    agent_logs: List[str] = []
    # Plan B (Tie-Breaker)
    alternative_draft: Optional['CampaignDraft'] = None

@router.post("/draft_campaign", response_model=CampaignDraft)
async def draft_campaign(input: AgentInput):
    """
    Generates a campaign draft based on high-level user inputs using the AI Service.
    Simulates a "Multi-Agent" workflow (Researcher -> Strategist -> Creative).
    """
    # 1. Agent Logs Simulation
    agent_logs = [
        "Researcher Agent: Analyzing current market trends for " + input.product,
        "Researcher Agent: Identified key competitor gaps in " + input.audience + " segment.",
        "Strategist Agent: Formulating core messaging pillars...",
        "Strategist Agent: Allocating budget across high-impact channels...",
        "Creative Agent: Drafting initial campaign hooks...",
        "Creative Agent: Selecting brand voice tone: Bold & Modern.",
        "Reviewer Agent: Validating plan against constraints."
    ]

    # 2. Main Prompt for Plan A
    prompt = (
        f"Act as a team of expert marketing agents (Researcher, Strategist, Creative).\n"
        f"Goal: {input.goal}\n"
        f"Product/Topic: {input.product}\n"
        f"Target Audience: {input.audience}\n\n"
        f"Return a JSON object with these exact keys:\n"
        f"- title: A catchy, professional campaign name.\n"
        f"- description: A 2-sentence strategic summary.\n"
        f"- budget: An estimated budget (integer number as string, e.g. '5000').\n"
        f"- channels: A list of 3-4 best marketing channels.\n"
        f"Return ONLY the JSON. No markdown."
    )

    try:
        # PLAN A
        response_text = await AIService._call_ollama(prompt, json_mode=True)
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(response_text)
        
        # PLAN B (Simulated Aggressive Alternative)
        # In a real system, we'd prompt for a "Contrarian Strategy"
        budget_int = int(''.join(filter(str.isdigit, str(data.get("budget", "5000")))))
        alt_budget = str(int(budget_int * 1.5))
        
        alt_channels = data.get("channels", [])[:1] + ["TikTok", "Influencers", "Guerrilla Marketing"]
        
        plan_b = CampaignDraft(
            title=f"Viral Blitz: {data.get('title')}",
            description=f"An aggressive, high-risk high-reward strategy focusing on viral loops and influencer activation for {input.product}.",
            budget=alt_budget,
            channels=alt_channels[:3],
            agent_logs=[]
        )

        return CampaignDraft(
            title=data.get("title"),
            description=data.get("description"),
            budget=str(budget_int),
            channels=data.get("channels"),
            agent_logs=agent_logs,
            alternative_draft=plan_b
        )

    except Exception as e:
        print(f"AI Generation failed: {e}")
        # Fallback Plan A
        plan_a = CampaignDraft(
            title=f"Strategic Campaign for {input.product}",
            description=f"A targeted approach to drive {input.goal} among {input.audience}. (AI Offline)",
            budget="5000",
            channels=["Email", "Social Media", "Search"],
            agent_logs=agent_logs
        )
        # Fallback Plan B
        plan_b = CampaignDraft(
            title=f"Viral Blitz: {input.product}",
            description="Aggressive viral marketing strategy.",
            budget="8000",
            channels=["TikTok", "Reels", "Influencers"],
            agent_logs=[]
        )
        plan_a.alternative_draft = plan_b
        plan_a.alternative_draft = plan_b
        return plan_a

# --- Phase 12: Real AI Agent Workflow ---

from app.models.models import Project
from app.schemas.schemas import Project as ProjectSchema
from sqlalchemy.orm import Session
from fastapi import Depends
from app.api import deps
import json

class StrategyInput(BaseModel):
    role: str
    project_type: str
    objective: str
    assets: List[str] = []

class StrategyResponse(BaseModel):
    project_id: int
    strategy: dict # JSON object

@router.post("/generate", response_model=StrategyResponse)
async def generate_strategy(
    input: StrategyInput,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Generates a full marketing strategy using Ollama and saves it as a new Project.
    """
    # 1. Generate Strategy via AI Service
    strategy_json_str = await AIService.generate_campaign_strategy(
        role=input.role,
        project_type=input.project_type,
        objective=input.objective
    )
    
    # Verify it's valid JSON (AIService ensures this or returns mock)
    try:
        strategy_data = json.loads(strategy_json_str)
    except:
        strategy_data = {"error": "Failed to parse AI response", "raw": strategy_json_str}

    # 2. Create Project Record
    new_project = Project(
        name=input.project_type, # Use type as default name
        objective=input.objective,
        project_type=input.project_type,
        status="active",
        strategy_json=strategy_json_str,
        owner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return StrategyResponse(
        project_id=new_project.id,
        strategy=strategy_data
    )
