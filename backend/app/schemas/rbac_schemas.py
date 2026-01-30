from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Team Schemas ---
class TeamBase(BaseModel):
    name: str
    organization_id: int

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None

class Team(TeamBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Role Schemas ---
class RoleBase(BaseModel):
    name: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    hierarchy_level: int = 0
    permissions_json: Dict[str, Any] = {}

class Role(RoleBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Permission Assignment Schema ---
class RoleAssignment(BaseModel):
    user_id: int
    role_name: str # e.g. "org_admin"
    scope_type: Optional[str] = "organization" # organization, team
    scope_id: Optional[int] = None # which org or team
