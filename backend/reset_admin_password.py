import asyncio
from app.core.database import AsyncSessionLocal
from app.models.models import User
from sqlalchemy import select
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def reset_password():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "admin@cadence.ai"))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"User found: {user.email}")
            user.hashed_password = get_password_hash("admin123")
            session.add(user)
            await session.commit()
            print("Password updated successfully.")
        else:
            print("User admin@cadence.ai not found. Seeding now...")
            user = User(
                email="admin@cadence.ai",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                role="super_admin",
                is_active=True,
                is_approved=True
            )
            session.add(user)
            await session.commit()
            print("User created successfully.")

if __name__ == "__main__":
    asyncio.run(reset_password())
