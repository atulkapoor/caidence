import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.database import engine, Base
# Import ALL models to ensure they are registered with Base
from app.models import models 

async def init():
    print("Initializing database...")
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
        # Verify tables
        def inspect_tables(connection):
            from sqlalchemy import inspect
            inspector = inspect(connection)
            tables = inspector.get_table_names()
            print("Existing tables:", tables)
            return tables

        await conn.run_sync(inspect_tables)

    print("Database initialization complete.")

if __name__ == "__main__":
    try:
        asyncio.run(init())
    except Exception as e:
        print(f"Error: {e}")
