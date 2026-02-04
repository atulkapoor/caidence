"""
Admin panel endpoints for super admin.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime

from app.core.database import get_db
from sqlalchemy.orm import selectinload
from app.models import User, Organization, Brand, Creator
from app.models.rbac import Permission
from app.api.endpoints.auth import get_current_active_user
from app.services.auth_service import is_super_admin, get_password_hash

router = APIRouter()

# --- Schemas ---
# ... (schemas are here) ...

# --- Middleware: Require Super Admin ---
async def require_super_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if not is_super_admin(current_user.role):
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user
class PlatformOverviewResponse(BaseModel):
    total_organizations: int
    total_users: int
    total_brands: int
    pending_approvals: int
    mrr: float
    active_subscriptions: int


class PermissionSchema(BaseModel):
    id: int
    resource: str
    action: str
    scope_type: str
    
    class Config:
        from_attributes = True

class UserAdminResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    organization_id: Optional[int]
    is_active: bool
    is_approved: bool
    created_at: Optional[datetime]
    custom_permissions: List[PermissionSchema] = [] # Changed from permissions

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None
    organization_id: Optional[int] = None

class UserPermissionUpdate(BaseModel):
    module: str
    access_level: str

class TeamInvite(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    organization_id: Optional[int] = None
    password: str

class BillingOverview(BaseModel):
    mrr: float
    arr: float
    total_customers: int
    free_tier: int
    pro_tier: int
    enterprise_tier: int
    churn_rate: float

class SubscriptionResponse(BaseModel):
    org_id: int
    org_name: str
    plan_tier: str
    monthly_amount: float
    status: str

# ...

@router.get("/overview", response_model=PlatformOverviewResponse)
async def get_platform_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get platform overview statistics.
    """
    from sqlalchemy import func
    
    # Count all users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0
    
    # Count pending approvals
    pending_result = await db.execute(
        select(func.count(User.id)).where(User.is_approved == False)
    )
    pending_approvals = pending_result.scalar() or 0
    
    # Count organizations
    total_orgs_result = await db.execute(select(func.count(Organization.id)))
    total_organizations = total_orgs_result.scalar() or 0
    
    # Count brands
    total_brands_result = await db.execute(select(func.count(Brand.id)))
    total_brands = total_brands_result.scalar() or 0
    
    # Count active subscriptions (active organizations)
    active_subs_result = await db.execute(
        select(func.count(Organization.id)).where(Organization.is_active == True)
    )
    active_subscriptions = active_subs_result.scalar() or 0
    
    # Calculate MRR based on plan tiers
    orgs_result = await db.execute(select(Organization))
    orgs = orgs_result.scalars().all()
    plan_prices = {"free": 0, "pro": 99, "enterprise": 499}
    mrr = sum(plan_prices.get(org.plan_tier, 0) for org in orgs if org.is_active)
    
    return PlatformOverviewResponse(
        total_organizations=total_organizations,
        total_users=total_users,
        total_brands=total_brands,
        pending_approvals=pending_approvals,
        mrr=float(mrr),
        active_subscriptions=active_subscriptions
    )


@router.get("/users", response_model=List[UserAdminResponse])
async def list_all_users(
    role: Optional[str] = Query(None),
    is_approved: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    List all users with optional filters.
    """
    query = select(User).options(selectinload(User.custom_permissions)) # Changed from permissions
    
    if role:
        query = query.where(User.role == role)
    if is_approved is not None:
        query = query.where(User.is_approved == is_approved)
    
    result = await db.execute(query)
    return result.scalars().all()

# ...

@router.patch("/users/{user_id}", response_model=UserAdminResponse)
async def update_user(
    user_id: int,
    user_data: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Update user role, status, or approval.
    """
    # Load custom_permissions
    result = await db.execute(select(User).options(selectinload(User.custom_permissions)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.is_approved is not None:
        user.is_approved = user_data.is_approved
    if user_data.organization_id is not None:
        user.organization_id = user_data.organization_id
    
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/users/{user_id}/permissions")
async def update_user_permission(
    user_id: int,
    perm_data: UserPermissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Update or create a permission override (granular).
    Maps module->resource, access_level->action.
    """
    # Check if permission exists
    result = await db.execute(
        select(Permission).where(
            Permission.user_id == user_id,
            Permission.resource == perm_data.module # Mapping
        )
    )
    existing_perm = result.scalar_one_or_none()

    if existing_perm:
        existing_perm.action = perm_data.access_level
    else:
        new_perm = Permission(
            user_id=user_id,
            resource=perm_data.module,
            action=perm_data.access_level,
            scope_type="global" # Default for admin panel overrides
        )
        db.add(new_perm)
    
    await db.commit()
    return {"message": "Permission updated"}


@router.post("/invite", response_model=UserAdminResponse)
async def invite_team_member(
    invite_data: TeamInvite,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Invite a new team member by creating their account directly.
    """
    from app.services.email_service import send_invite_email

    # Handle organization_id=0 from frontend
    if invite_data.organization_id == 0:
        invite_data.organization_id = None
    result = await db.execute(select(User).where(User.email == invite_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=invite_data.email,
        hashed_password=get_password_hash(invite_data.password),
        full_name=invite_data.full_name,
        role=invite_data.role,
        organization_id=invite_data.organization_id,
        is_active=True,
        is_approved=True,  # Admin-invited users are auto-approved
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    await db.refresh(new_user)
    
    # Send email
    try:
        await send_invite_email(new_user.email, invite_data.password)
    except Exception as e:
        print(f"Failed to send email: {e}")

    return new_user


@router.get("/billing", response_model=BillingOverview)
async def get_billing_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get billing and subscription overview (mock data).
    """
    orgs = await db.execute(select(Organization))
    all_orgs = orgs.scalars().all()
    
    free = len([o for o in all_orgs if o.plan_tier == "free"])
    pro = len([o for o in all_orgs if o.plan_tier == "pro"])
    enterprise = len([o for o in all_orgs if o.plan_tier == "enterprise"])
    
    return BillingOverview(
        mrr=12500.00,
        arr=150000.00,
        total_customers=len(all_orgs),
        free_tier=free,
        pro_tier=pro,
        enterprise_tier=enterprise,
        churn_rate=2.5,
    )


@router.get("/subscriptions", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    List all subscriptions.
    """
    result = await db.execute(select(Organization))
    orgs = result.scalars().all()
    
    plan_prices = {"free": 0, "pro": 99, "enterprise": 499}
    
    return [
        SubscriptionResponse(
            org_id=org.id,
            org_name=org.name,
            plan_tier=org.plan_tier,
            monthly_amount=plan_prices.get(org.plan_tier, 0),
            status="active" if org.is_active else "inactive"
        )
        for org in orgs
    ]


@router.patch("/organizations/{org_id}/plan")
async def update_organization_plan(
    org_id: int,
    plan_tier: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Update organization's plan tier.
    """
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if plan_tier not in ["free", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan tier")
    
    org.plan_tier = plan_tier
    await db.commit()
    
    return {"message": f"Organization plan updated to {plan_tier}"}


@router.get("/usage")
async def get_platform_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get platform usage analytics (mock data).
    """
    return {
        "daily_active_users": [
            {"date": "2026-01-15", "count": 145},
            {"date": "2026-01-16", "count": 162},
            {"date": "2026-01-17", "count": 158},
            {"date": "2026-01-18", "count": 171},
            {"date": "2026-01-19", "count": 189},
            {"date": "2026-01-20", "count": 142},
            {"date": "2026-01-21", "count": 198},
        ],
        "api_calls_today": 24567,
        "storage_used_gb": 45.7,
        "bandwidth_used_gb": 128.3,
    }
