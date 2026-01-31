import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import User
from app.services.auth_service import get_password_hash
from app.models.rbac import Role

async def create_superuser():
    async with AsyncSessionLocal() as session:
        email = "admin@caidence.ai"
        print(f"Checking for user {email}...")
        
        # 1. Get Root Role
        role_result = await session.execute(select(Role).where(Role.name == "root"))
        root_role = role_result.scalar_one_or_none()
        
        if not root_role:
             print("ERROR: 'root' role not found! Run seed_roles.py first.")
             return

        # 2. Check/Create User
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print("Creating superuser...")
            user = User(
                email=email,
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                is_active=True,
                role="root",
                role_id=root_role.id # Important: Link FK
            )
            session.add(user)
            await session.commit()
            print(f"✅ Superuser created! Email: {email} | Pass: admin123")
        else:
            print("Superuser already exists. Resetting password/role...")
            user.hashed_password = get_password_hash("admin123")
            user.role = "root"
            user.role_id = root_role.id
            session.add(user)
            await session.commit()
            print("✅ Superuser updated.")

if __name__ == "__main__":
    asyncio.run(create_superuser())
