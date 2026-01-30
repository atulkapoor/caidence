import asyncio
import sys
import os

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import AsyncSessionLocal
from app.models import User, Role, Organization
from app.services.auth_service import get_password_hash
from sqlalchemy import select

async def reset_admin():
    print("Connecting to database...")
    async with AsyncSessionLocal() as session:
        # 1. Define target credentials
        target_email = "admin@caidence.ai"
        target_password = "admin123"
        print(f"Target Credentials: {target_email} / {target_password}")

        # 2. Get dependencies (Role/Org)
        print("Fetching Root Role and Organization...")
        role_result = await session.execute(select(Role).where(Role.name == "root"))
        root_role = role_result.scalar_one_or_none()
        
        org_result = await session.execute(select(Organization).where(Organization.slug == "cadence-ai"))
        cadence_org = org_result.scalar_one_or_none()

        if not root_role or not cadence_org:
            print("ERROR: Root Role or Cadence Organization not found. Re-run migrations first.")
            return

        # 3. Check for existing user (correct email)
        print(f"Checking for existing user: {target_email}")
        result = await session.execute(select(User).where(User.email == target_email))
        user = result.scalar_one_or_none()

        if user:
            print("User found. Updating password...")
            user.hashed_password = get_password_hash(target_password)
            user.role_id = root_role.id
            user.organization_id = cadence_org.id
            user.is_active = True
            user.is_approved = True
            session.add(user)
        else:
            print("User NOT found. Creating new user...")
            # Check if there's an 'old' admin to delete or rename? 
            # Let's just create the new one to be safe.
            new_user = User(
                email=target_email,
                full_name="System Admin",
                role="root",
                role_id=root_role.id,
                organization_id=cadence_org.id,
                hashed_password=get_password_hash(target_password),
                is_active=True,
                is_approved=True
            )
            session.add(new_user)
        
        await session.commit()
        print("✅ Success! Admin user updated/created.")

if __name__ == "__main__":
    asyncio.run(reset_admin())
