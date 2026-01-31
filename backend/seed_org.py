import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import User, Organization

async def seed_org():
    async with AsyncSessionLocal() as session:
        # Check if org exists
        result = await session.execute(select(Organization).limit(1))
        org = result.scalar_one_or_none()
        
        if not org:
            print("Creating default organization...")
            org = Organization(
                name="Cadence AI",
                slug="cadence-ai",
                plan_tier="enterprise",
                is_active=True
            )
            session.add(org)
            await session.commit()
            await session.refresh(org)
            print(f"Created Org: {org.name} (ID: {org.id})")
        else:
            print(f"Organization exists: {org.name} (ID: {org.id})")
            
        # Assign admin to this org
        result = await session.execute(select(User).where(User.email == "admin@caidence.ai"))
        user = result.scalar_one_or_none()
        
        if user:
            if user.organization_id != org.id:
                print(f"Updating user {user.email} to Org ID {org.id}...")
                user.organization_id = org.id
                await session.commit()
            else:
                print(f"User {user.email} is already in Org ID {org.id}.")
        else:
            print("Admin user not found!")

if __name__ == "__main__":
    asyncio.run(seed_org())
