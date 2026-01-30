import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.models import User

async def update_admin_role():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "admin@cadence.ai"))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"Current role: {user.role}")
            user.role = "root"
            await session.commit()
            print(f"Updated role to: {user.role}")
        else:
            print("User admin@cadence.ai not found")

if __name__ == "__main__":
    asyncio.run(update_admin_role())
