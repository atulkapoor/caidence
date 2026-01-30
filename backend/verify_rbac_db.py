import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def verify_rbac_tables():
    async with AsyncSessionLocal() as session:
        # Check tables
        tables = ["roles", "teams", "permissions", "users"]
        print("Checking tables...")
        for t in tables:
            try:
                # Use standard SQL to check existence or just select count to ensure it works
                result = await session.execute(text(f"SELECT * FROM {t} LIMIT 1"))
                print(f"Table '{t}' exists. Rows: {result.rowcount}")
            except Exception as e:
                print(f"Table '{t}' Error: {e}")
        
        # Check User columns for team_id
        try:
            # Query pg_attribute to check columns specifically if needed, or just select team_id
            await session.execute(text("SELECT team_id, role_id FROM users LIMIT 1"))
            print("Columns 'team_id' and 'role_id' exist in 'users'.")
        except Exception as e:
            print(f"Column check failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify_rbac_tables())
