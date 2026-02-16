"""
Seed the roles table with all 8 roles and their permissions_json.

Usage:
    python -m app.seeds.seed_roles

Or call seed_roles() from within an async context.
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.rbac import Role

# All 8 roles with hierarchy levels and permissions
ROLE_DEFINITIONS = [
    {
        "name": "root",
        "display_name": "Root",
        "description": "Platform root with unrestricted access",
        "hierarchy_level": 110,
        "permissions_json": {
            "admin": ["read", "write"],
            "agency": ["read", "write"],
            "brand": ["read", "write"],
            "creators": ["read", "write"],
            "campaign": ["read", "write"],
            "content": ["read", "write"],
            "analytics": ["read", "write"],
            "discovery": ["read", "write"],
            "crm": ["read", "write"],
            "design_studio": ["read", "write"],
            "marcom": ["read", "write"],
            "workflow": ["read", "write"],
            "ai_agent": ["read", "write"],
            "ai_chat": ["read", "write"],
            "content_studio": ["read", "write"],
            "presentation_studio": ["read", "write"],
        },
    },
    {
        "name": "super_admin",
        "display_name": "Super Admin",
        "description": "Platform administrator with full access",
        "hierarchy_level": 100,
        "permissions_json": {
            "admin": ["read", "write"],
            "agency": ["read", "write"],
            "brand": ["read", "write"],
            "creators": ["read", "write"],
            "campaign": ["read", "write"],
            "content": ["read", "write"],
            "analytics": ["read", "write"],
            "discovery": ["read", "write"],
            "crm": ["read", "write"],
            "design_studio": ["read", "write"],
            "marcom": ["read", "write"],
            "workflow": ["read", "write"],
            "ai_agent": ["read", "write"],
            "ai_chat": ["read", "write"],
            "content_studio": ["read", "write"],
            "presentation_studio": ["read", "write"],
        },
    },
    {
        "name": "agency_admin",
        "display_name": "Agency Admin",
        "description": "Agency-level administrator managing brands, creators, and campaigns",
        "hierarchy_level": 80,
        "permissions_json": {
            "agency": ["read", "write"],
            "brand": ["read", "write"],
            "creators": ["read", "write"],
            "campaign": ["read", "write"],
            "content": ["read", "write"],
            "analytics": ["read"],
            "discovery": ["read", "write"],
            "crm": ["read", "write"],
            "design_studio": ["read", "write"],
            "marcom": ["read", "write"],
            "workflow": ["read", "write"],
            "ai_agent": ["read", "write"],
            "ai_chat": ["read", "write"],
            "content_studio": ["read", "write"],
            "presentation_studio": ["read", "write"],
        },
    },
    {
        "name": "agency_member",
        "display_name": "Agency Member",
        "description": "Agency team member with limited write access",
        "hierarchy_level": 60,
        "permissions_json": {
            "agency": ["read"],
            "brand": ["read"],
            "creators": ["read"],
            "campaign": ["read", "write"],
            "content": ["read", "write"],
            "analytics": ["read"],
            "discovery": ["read"],
            "design_studio": ["read", "write"],
            "workflow": ["read"],
            "ai_chat": ["read"],
            "content_studio": ["read"],
            "presentation_studio": ["read"],
        },
    },
    {
        "name": "brand_admin",
        "display_name": "Brand Admin",
        "description": "Brand-level administrator managing their brand's resources",
        "hierarchy_level": 50,
        "permissions_json": {
            "brand": ["read", "write"],
            "creators": ["read", "write"],
            "campaign": ["read", "write"],
            "content": ["read", "write"],
            "analytics": ["read"],
            "discovery": ["read"],
            "crm": ["read", "write"],
            "design_studio": ["read", "write"],
            "ai_chat": ["read"],
            "content_studio": ["read", "write"],
        },
    },
    {
        "name": "brand_member",
        "display_name": "Brand Member",
        "description": "Brand team member with read-heavy access",
        "hierarchy_level": 40,
        "permissions_json": {
            "brand": ["read"],
            "creators": ["read"],
            "campaign": ["read"],
            "content": ["read", "write"],
            "analytics": ["read"],
            "discovery": ["read"],
            "design_studio": ["read"],
            "ai_chat": ["read"],
        },
    },
    {
        "name": "creator",
        "display_name": "Creator",
        "description": "Content creator with access to content tools",
        "hierarchy_level": 20,
        "permissions_json": {
            "content": ["read", "write"],
            "design_studio": ["read"],
            "ai_chat": ["read"],
        },
    },
    {
        "name": "viewer",
        "display_name": "Viewer",
        "description": "Read-only access to selected resources",
        "hierarchy_level": 10,
        "permissions_json": {
            "campaign": ["read"],
            "content": ["read"],
            "analytics": ["read"],
            "discovery": ["read"],
            "design_studio": ["read"],
        },
    },
]


async def seed_roles(db: AsyncSession) -> None:
    """Insert or update all role definitions."""
    for role_def in ROLE_DEFINITIONS:
        result = await db.execute(
            select(Role).where(Role.name == role_def["name"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.display_name = role_def["display_name"]
            existing.description = role_def["description"]
            existing.hierarchy_level = role_def["hierarchy_level"]
            existing.permissions_json = role_def["permissions_json"]
        else:
            db.add(Role(**role_def))

    await db.commit()
    print(f"Seeded {len(ROLE_DEFINITIONS)} roles")


async def main():
    async with AsyncSessionLocal() as session:
        await seed_roles(session)


if __name__ == "__main__":
    asyncio.run(main())
