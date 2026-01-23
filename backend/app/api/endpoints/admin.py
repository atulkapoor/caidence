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
from app.models import User, Organization, Brand, Creator
from app.api.endpoints.auth import get_current_active_user
from app.services.auth_service import is_super_admin, get_password_hash

router = APIRouter()


# --- Schemas ---
class PlatformOverview(BaseModel):
    total_organizations: int
    total_users: int
    total_brands: int
    total_creators: int
    total_campaigns: int
    pending_approvals: int
    mrr: float
    active_subscriptions: int


class UserAdminResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    organization_id: Optional[int]
    is_active: bool
    is_approved: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None
    organization_id: Optional[int] = None


class TeamInvite(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    organization_id: Optional[int] = None
    password: str  # Direct password set (no email)


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


# --- Middleware: Require Super Admin ---
async def require_super_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if not is_super_admin(current_user.role):
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user


# --- Endpoints ---
@router.get("/overview", response_model=PlatformOverview)
async def get_platform_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get platform-wide KPIs.
    """
    orgs = await db.execute(select(Organization))
    users = await db.execute(select(User))
    brands = await db.execute(select(Brand))
    creators = await db.execute(select(Creator))
    pending = await db.execute(select(User).where(User.is_approved == False))
    
    return PlatformOverview(
        total_organizations=len(orgs.scalars().all()),
        total_users=len(users.scalars().all()),
        total_brands=len(brands.scalars().all()),
        total_creators=len(creators.scalars().all()),
        total_campaigns=47,  # Mock
        pending_approvals=len(pending.scalars().all()),
        mrr=12500.00,  # Mock
        active_subscriptions=15,  # Mock
    )


@router.get("/organizations", response_model=List[dict])
async def list_all_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    List all organizations with user counts.
    """
    result = await db.execute(select(Organization))
    orgs = result.scalars().all()
    
    response = []
    for org in orgs:
        users_result = await db.execute(
            select(User).where(User.organization_id == org.id)
        )
        user_count = len(users_result.scalars().all())
        
        response.append({
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "plan_tier": org.plan_tier,
            "is_active": org.is_active,
            "user_count": user_count,
        })
    
    return response


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
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    if is_approved is not None:
        query = query.where(User.is_approved == is_approved)
    
    result = await db.execute(query)
    return result.scalars().all()


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
    result = await db.execute(select(User).where(User.id == user_id))
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


@router.post("/invite", response_model=UserAdminResponse)
async def invite_team_member(
    invite_data: TeamInvite,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Invite a new team member by creating their account directly.
    """
    # Check if email exists
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
