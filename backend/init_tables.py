
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.models import Base
from dotenv import load_dotenv
import os

load_dotenv()

# Get URL from env, ensuring it is set
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/cadence_ai")

async def init_db():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
