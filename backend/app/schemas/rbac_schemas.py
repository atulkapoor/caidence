from pydantic import BaseModel, Field
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

class RoleCreate(RoleBase):
    """Create a new custom role."""
    pass

class RoleUpdate(BaseModel):
    """Update an existing role (all fields optional)."""
    display_name: Optional[str] = None
    description: Optional[str] = None
    hierarchy_level: Optional[int] = None
    permissions_json: Optional[Dict[str, Any]] = None

class Role(RoleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Permission Assignment Schema ---
class RoleAssignment(BaseModel):
    user_id: int
    role_name: str
    scope_type: Optional[str] = "organization"
    scope_id: Optional[int] = None

# --- Permission Override Schemas ---
class PermissionOverrideCreate(BaseModel):
    """Create a per-user permission override."""
    user_id: int
    resource: str = Field(..., description="Resource name, e.g. 'campaign', 'content'")
    action: str = Field(..., description="Action: 'read', 'write', or 'none'")
    scope_type: str = Field(default="global", description="'global', 'organization', 'brand', 'team'")
    scope_id: Optional[int] = Field(default=None, description="ID of the org/brand/team for scoped overrides")
    is_allowed: bool = Field(default=True, description="True=grant, False=explicit deny")

class PermissionOverrideUpdate(BaseModel):
    """Update an existing permission override."""
    action: Optional[str] = None
    is_allowed: Optional[bool] = None

class PermissionOverride(BaseModel):
    id: int
    user_id: int
    resource: str
    action: str
    scope_type: str
    scope_id: Optional[int]
    is_allowed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Effective Permissions Response ---
class EffectivePermissions(BaseModel):
    user_id: int
    role: str
    organization_id: Optional[int]
    team_id: Optional[int]
    permissions: List[str] = Field(description="Sorted list of 'resource:action' strings")
    is_super_admin: bool

# --- Permission Check ---
class PermissionCheckRequest(BaseModel):
    resource: str
    action: str
    scope_type: Optional[str] = None
    scope_id: Optional[int] = None

class PermissionCheckResponse(BaseModel):
    allowed: bool
    resource: str
    action: str
    reason: str = Field(description="Why the permission was granted/denied")

# --- Bulk Permission Update ---
class BulkPermissionItem(BaseModel):
    user_id: int
    resource: str
    action: str
    is_allowed: bool = True

class BulkPermissionUpdate(BaseModel):
    permissions: List[BulkPermissionItem]

class BulkPermissionResult(BaseModel):
    updated: int
    created: int
    errors: List[str] = []

# --- Audit Log ---
class AuditLogEntry(BaseModel):
    id: int
    actor_id: int
    actor_email: str
    action: str = Field(description="e.g. 'role_assigned', 'permission_granted', 'permission_revoked'")
    target_user_id: Optional[int]
    target_user_email: Optional[str]
    details: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

# --- Role Permissions Update ---
class RolePermissionsUpdate(BaseModel):
    """Update the permissions_json for a role."""
    permissions_json: Dict[str, List[str]] = Field(
        ...,
        description="Map of resource to list of actions, e.g. {'campaign': ['read', 'write']}"
    )
