import httpx
import asyncio

BASE_URL = "http://localhost:8000/api/v1"

async def test_brands():
    async with httpx.AsyncClient() as client:
        # Login
        resp = await client.post(f"{BASE_URL}/auth/login", data={"username": "admin@cadence.ai", "password": "admin123"})
        token = resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Details
        resp = await client.get(f"{BASE_URL}/brands/", headers=headers)
        print(f"Fetch Brands Status: {resp.status_code}")
        print(f"Response: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_brands())
