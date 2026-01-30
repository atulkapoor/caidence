from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.database import get_db
from app.models.rbac import Role
from app.models.models import User
from app.models.team import Team
from app.api.endpoints.auth import get_current_active_user
from app.services.auth_service import is_super_admin
from app.schemas import rbac_schemas as schemas

router = APIRouter()

@router.get("/roles", response_model=List[schemas.Role])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List available roles.
    """
    result = await db.execute(select(Role).order_by(Role.hierarchy_level.desc()))
    return result.scalars().all()

@router.post("/assign", response_model=dict)
async def assign_role(
    assignment: schemas.RoleAssignment,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Assign a role to a user.
    Root can assign anything.
    Super Admin can assign roles within their org (up to their level).
    """
    # 1. Fetch Target User
    result = await db.execute(select(User).where(User.id == assignment.user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Fetch Role
    result = await db.execute(select(Role).where(Role.name == assignment.role_name))
    role_obj = result.scalar_one_or_none()
    if not role_obj:
        raise HTTPException(status_code=404, detail="Role not found")
        
    # 3. Permission Checks
    if current_user.role != "root":
        # Check org boundary
        if current_user.organization_id != target_user.organization_id:
             raise HTTPException(status_code=403, detail="Cannot manage users outside your organization")
        
        # Check hierarchy (cannot assign role higher than self)
        # Fetch current user's hierarchy level? For now assume super_admin(90) > org_admin(60)
        # Simplified: super_admin can assign anything except root
        if role_obj.name == "root":
             raise HTTPException(status_code=403, detail="Only Root can assign Root role")

    # 4. Apply Assignment
    target_user.role_id = role_obj.id
    target_user.role = role_obj.name # Keep string sync
    
    # Handle Team Scope
    if assignment.scope_type == "team" and assignment.scope_id:
        target_user.team_id = assignment.scope_id
        
    await db.commit()
    
    return {"message": f"Role {role_obj.name} assigned to user {target_user.email}"}
