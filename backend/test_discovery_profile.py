import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000/api/v1"

async def test_get_profile():
    print("\n--- Testing Get Influencer Profile ---")
    async with aiohttp.ClientSession() as session:
        # Test with a made-up handle
        handle = "@tech_guru_99"
        # Handles in URL typically shouldn't have @ if used as path param depending on routing, 
        # but our mock logic adds it/expects it. Let's send it url encoded or just the name.
        # The logic in get_profile uses the input string to seed.
        
        # NOTE: If we pass "@tech" in URL, fastapi might handle it.
        encoded_handle = "%40tech_guru_99"
        
        url = f"{BASE_URL}/discovery/influencers/{handle}"
        print(f"GET {url}")
        
        async with session.get(url) as resp:
            print(f"Status: {resp.status}")
            if resp.status == 200:
                data = await resp.json()
                print("Profile Found:")
                print(json.dumps(data, indent=2))
                assert data['handle'] == handle
            else:
                print(await resp.text())

async def main():
    await test_get_profile()

if __name__ == "__main__":
    asyncio.run(main())
