from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.database import get_db
from app.models.team import Team
from app.models.models import User
from app.api.endpoints.auth import get_current_active_user
from app.services.auth_service import is_super_admin, is_agency_level
from app.schemas import rbac_schemas as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Team])
async def list_teams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List teams. Root sees all. Org Admin sees their org's teams.
    """
    if current_user.role == "root":
        result = await db.execute(select(Team))
        return result.scalars().all()
    
    if is_agency_level(current_user.role) and current_user.organization_id:
        result = await db.execute(select(Team).where(Team.organization_id == current_user.organization_id))
        return result.scalars().all()
    
    # Regular members see their own team
    if current_user.team_id:
        result = await db.execute(select(Team).where(Team.id == current_user.team_id))
        return result.scalars().all()
        
    return []

@router.post("/", response_model=schemas.Team)
async def create_team(
    team_data: schemas.TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new team. Requires Super Admin or Root.
    """
    # Permission check
    if current_user.role != "root":
        if not is_agency_level(current_user.role):
            raise HTTPException(status_code=403, detail="Not authorized to create teams")
        if team_data.organization_id != current_user.organization_id:
             raise HTTPException(status_code=403, detail="Cannot create team for another organization")

    new_team = Team(**team_data.dict())
    db.add(new_team)
    await db.commit()
    await db.refresh(new_team)
    return new_team

@router.get("/{team_id}", response_model=schemas.Team)
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Access check (simple version)
    if current_user.role == "root":
        return team
    if current_user.organization_id == team.organization_id:
        return team
        
    raise HTTPException(status_code=403, detail="Not authorized to view this team")
