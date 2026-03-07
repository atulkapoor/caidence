"""
Helpers for user-visibility and role-assignment scope rules.
"""
from typing import Optional, Set

from sqlalchemy import exists, or_, true
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.models import User
from app.services.auth_service import ROLE_HIERARCHY, is_super_admin


STRICT_CHILD_ROLE_MAP = {
    "agency_admin": {"agency_member"},
    "org_admin": {"agency_member"},
    "brand_admin": {"brand_member"},
}


def descendant_ids_cte(root_user_id: int):
    """Recursive CTE containing all descendants of root_user_id."""
    users = User.__table__
    descendants = (
        select(users.c.id)
        .where(users.c.parent_user_id == root_user_id)
        .cte(name="descendants", recursive=True)
    )
    descendants = descendants.union_all(
        select(users.c.id).where(users.c.parent_user_id == descendants.c.id)
    )
    return descendants


def visible_users_where_clause(current_user: User):
    """SQLAlchemy WHERE clause for users visible to current_user."""
    if is_super_admin(current_user.role):
        return None

    descendants = descendant_ids_cte(current_user.id)
    return or_(
        User.id == current_user.id,
        User.id.in_(select(descendants.c.id)),
    )


def visible_user_ids_subquery(current_user: User):
    """
    Returns a SELECT of visible user IDs for current_user.
    For super users, returns None (unrestricted).
    """
    if is_super_admin(current_user.role):
        return None

    descendants = descendant_ids_cte(current_user.id)
    return (
        select(User.id)
        .where(
            or_(
                User.id == current_user.id,
                User.id.in_(select(descendants.c.id)),
            )
        )
    )


def visible_user_filter(current_user: User, user_id_column):
    """
    SQL filter for rows owned by visible users.
    """
    subq = visible_user_ids_subquery(current_user)
    if subq is None:
        return true()
    return user_id_column.in_(subq)


async def can_manage_user(current_user: User, target_user_id: int, db: AsyncSession) -> bool:
    """Whether current_user can manage target_user_id."""
    if is_super_admin(current_user.role):
        return True
    if current_user.id == target_user_id:
        return True

    descendants = descendant_ids_cte(current_user.id)
    result = await db.execute(
        select(
            exists(
                select(descendants.c.id).where(descendants.c.id == target_user_id)
            )
        )
    )
    return bool(result.scalar())


def is_role_assignable(assigner_role: str, target_role: str) -> bool:
    """
    Role assignment policy:
    - root can assign all roles
    - super_admin can assign all roles except root/super_admin
    - agency_admin/org_admin can assign only agency_member
    - brand_admin can assign only brand_member
    - all others follow strict hierarchy (must assign lower role)
    """
    if assigner_role == "root":
        return True

    if assigner_role == "super_admin":
        return target_role not in {"root", "super_admin"}

    strict_roles: Optional[Set[str]] = STRICT_CHILD_ROLE_MAP.get(assigner_role)
    if strict_roles is not None:
        return target_role in strict_roles

    assigner_level = ROLE_HIERARCHY.get(assigner_role, 0)
    target_level = ROLE_HIERARCHY.get(target_role, 0)
    return target_level < assigner_level
