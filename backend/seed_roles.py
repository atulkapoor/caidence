import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.rbac import Role

ROLES_CONFIG = [
    {
        "name": "root", 
        "hierarchy": 100, 
        "desc": "Global Administrator",
        "perms": {"*": ["*"]}
    },
    {
        "name": "super_admin", 
        "hierarchy": 90, 
        "desc": "Organization Administrator",
        "perms": {"org": ["manage"], "users": ["manage"], "teams": ["manage"]}
    },
    {
        "name": "agency_admin", 
        "hierarchy": 80, 
        "desc": "Legacy Agency Admin (maps to Super Admin)",
        "perms": {"org": ["manage"]}
    },
    {
        "name": "org_admin", 
        "hierarchy": 60, 
        "desc": "Team/Project Administrator",
        "perms": {"team": ["manage"], "users": ["read"]}
    },
    {
        "name": "agency_member", 
        "hierarchy": 50, 
        "desc": "Standard Member",
        "perms": {"campaigns": ["read", "write"]}
    },
    {
        "name": "viewer", 
        "hierarchy": 10, 
        "desc": "Read-only Access",
        "perms": {"*": ["read"]}
    }
]

async def seed_roles():
    async with AsyncSessionLocal() as session:
        print("Seeding roles...")
        for r in ROLES_CONFIG:
            stmt = select(Role).where(Role.name == r["name"])
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if not existing:
                print(f"Creating role: {r['name']}")
                new_role = Role(
                    name=r["name"],
                    hierarchy_level=r["hierarchy"],
                    description=r["desc"],
                    permissions_json=r["perms"]
                )
                session.add(new_role)
            else:
                print(f"Role {r['name']} already exists. Updating permissions...")
                existing.hierarchy_level = r["hierarchy"]
                existing.permissions_json = r["perms"]
        
        await session.commit()
        print("Roles seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_roles())
