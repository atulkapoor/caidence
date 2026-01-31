import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import User
from app.core.security import get_password_hash

async def create_superuser():
    async with AsyncSessionLocal() as session:
        email = "admin@caidence.ai"
        print(f"Checking for user {email}...")
        
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print("Creating superuser...")
            user = User(
                email=email,
                hashed_password=get_password_hash("admin123"), # Default password
                full_name="System Admin",
                is_active=True,
                role="root" # Ensure this matches a valid role from seed_roles.py
            )
            session.add(user)
            await session.commit()
            print(f"Superuser created! Email: {email} | Pass: admin123")
        else:
            print("Superuser already exists. Resetting password to default...")
            user.hashed_password = get_password_hash("admin123")
            user.role = "root"
            session.add(user)
            await session.commit()
            print("Superuser updated.")

if __name__ == "__main__":
    asyncio.run(create_superuser())
