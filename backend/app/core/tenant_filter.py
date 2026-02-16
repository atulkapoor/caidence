"""
Centralized tenant isolation utilities.

Provides reusable query filters for multi-tenancy (org/brand/team scoping)
so individual endpoints don't need manual WHERE clauses.
"""
from typing import Optional, TypeVar, Type
from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException

from app.models.models import User
from app.services.auth_service import is_super_admin

T = TypeVar("T")


def apply_org_filter(
    query: Select,
    model_class: Type[T],
    current_user: User,
    org_field: str = "organization_id",
) -> Select:
    """
    Apply organization-level tenant filter to a SQLAlchemy Select query.
    Super admins / root bypass the filter (see all orgs).

    Usage:
        query = select(Campaign)
        query = apply_org_filter(query, Campaign, current_user)
        result = await db.execute(query)
    """
    if is_super_admin(current_user.role):
        return query

    if not current_user.organization_id:
        # User without an org can only see unscoped data
        return query.where(getattr(model_class, org_field).is_(None))

    return query.where(
        getattr(model_class, org_field) == current_user.organization_id
    )


def apply_brand_filter(
    query: Select,
    model_class: Type[T],
    current_user: User,
    brand_field: str = "brand_id",
) -> Select:
    """
    Apply brand-level tenant filter. Agency-level users see all brands in their org.
    Brand-level users only see their assigned brand (if user has brand_id).
    """
    if is_super_admin(current_user.role):
        return query

    # Agency-level users see all brands within their org (org filter handles isolation)
    if current_user.role in ("agency_admin", "agency_member"):
        return query

    # Brand-level users: filter by their brand if the field exists on the user
    user_brand_id = getattr(current_user, "brand_id", None)
    if user_brand_id and hasattr(model_class, brand_field):
        return query.where(getattr(model_class, brand_field) == user_brand_id)

    return query


def apply_team_filter(
    query: Select,
    model_class: Type[T],
    current_user: User,
    team_field: str = "team_id",
) -> Select:
    """
    Apply team-level tenant filter if the model supports it.
    Admins skip team filtering. Team members only see their team's data.
    """
    if is_super_admin(current_user.role):
        return query

    if current_user.role in ("agency_admin",):
        return query  # Agency admins see all teams

    if current_user.team_id and hasattr(model_class, team_field):
        return query.where(getattr(model_class, team_field) == current_user.team_id)

    return query


def apply_tenant_filters(
    query: Select,
    model_class: Type[T],
    current_user: User,
    org_field: str = "organization_id",
    brand_field: str = "brand_id",
    team_field: str = "team_id",
) -> Select:
    """
    Apply all relevant tenant filters (org + brand + team) in one call.
    Only applies filters for fields that exist on the model.

    Usage:
        query = select(Creator)
        query = apply_tenant_filters(query, Creator, current_user)
        result = await db.execute(query)
    """
    if hasattr(model_class, org_field):
        query = apply_org_filter(query, model_class, current_user, org_field)

    if hasattr(model_class, brand_field):
        query = apply_brand_filter(query, model_class, current_user, brand_field)

    if hasattr(model_class, team_field):
        query = apply_team_filter(query, model_class, current_user, team_field)

    return query


async def ensure_tenant_access(
    current_user: User,
    resource_id: int,
    db: AsyncSession,
    model_class: Type[T],
    id_field: str = "id",
) -> T:
    """
    Verify the current user has access to a specific resource instance.
    Returns the resource if access is granted, raises 403/404 otherwise.

    Usage:
        campaign = await ensure_tenant_access(current_user, campaign_id, db, Campaign)
    """
    result = await db.execute(
        select(model_class).where(getattr(model_class, id_field) == resource_id)
    )
    resource = result.scalar_one_or_none()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if is_super_admin(current_user.role):
        return resource

    # Check org boundary
    if hasattr(resource, "organization_id"):
        if resource.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied to this resource")

    # Check brand boundary
    user_brand_id = getattr(current_user, "brand_id", None)
    if user_brand_id and hasattr(resource, "brand_id"):
        if resource.brand_id != user_brand_id:
            raise HTTPException(status_code=403, detail="Access denied to this resource")

    # Check owner
    if hasattr(resource, "owner_id"):
        if resource.owner_id == current_user.id:
            return resource
        # Non-owner access depends on org membership (already checked above)

    return resource
