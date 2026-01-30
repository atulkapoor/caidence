import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000"
API_V1 = "/api/v1"

async def test_endpoints():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        print(f"Testing API at {BASE_URL}...\n")
        
        # 1. Health Check
        try:
            resp = await client.get("/health")
            print(f"[GET /health] Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"  Response: {resp.json()}")
            else:
                print(f"  Error: {resp.text}")
        except Exception as e:
            print(f"[GET /health] Failed: {e}")
            return

        # 2. Login (Get Token)
        token = None
        try:
            # Login with form data as OAuth2PasswordRequestForm expects
            resp = await client.post(f"{API_V1}/auth/login", data={
                "username": "admin@cadence.ai",
                "password": "admin123"
            })
            print(f"\n[POST /auth/login] Status: {resp.status_code}")
            if resp.status_code == 200:
                token_data = resp.json()
                token = token_data["access_token"]
                print("  Login Successful. Token received.")
            else:
                print(f"  Login Failed: {resp.text}")
                return
        except Exception as e:
            print(f"  Login Exception: {e}")
            return

        headers = {"Authorization": f"Bearer {token}"}

        # 3. Dashboard Stats
        try:
            resp = await client.get(f"{API_V1}/dashboard/stats?range=6m", headers=headers)
            print(f"\n[GET /dashboard/stats] Status: {resp.status_code}")
            if resp.status_code == 200:
                 data = resp.json()
                 print(f"  Success. Stats keys: {list(data.keys())}")
            else:
                 print(f"  Failed: {resp.text}")
        except Exception as e:
             print(f"  Exception: {e}")

        # 4. Profile / Auth Me
        try:
            resp = await client.get(f"{API_V1}/auth/me", headers=headers)
            print(f"\n[GET /auth/me] Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"  User: {resp.json()['email']}")
            else:
                print(f"  Failed: {resp.text}")
        except Exception as e:
            print(f"  Exception: {e}")

        # 5. Discovery (Mocked)
        try:
            resp = await client.post(f"{API_V1}/discovery/search", headers=headers, json={"query": "tech reviewers", "platform": "youtube"})
            print(f"\n[POST /discovery/search] Status: {resp.status_code}")
            if resp.status_code == 200:
                results = resp.json()
                print(f"  Success. Found {len(results)} creators.")
            else:
                print(f"  Failed: {resp.text}")
        except Exception as e:
            print(f"  Exception: {e}")

        # 6. Campaigns List
        try:
            resp = await client.get(f"{API_V1}/campaigns/", headers=headers)
            print(f"\n[GET /campaigns/] Status: {resp.status_code}")
            if resp.status_code == 200:
                camps = resp.json()
                print(f"  Success. Campaigns count: {len(camps)}")
            else:
                print(f"  Failed: {resp.text}")
        except Exception as e:
            print(f"  Exception: {e}")

        # 8. Chat Message (Ollama might be offline, so expect 500 or error, but endpoint reachable)
        try:
            resp = await client.post(f"{API_V1}/chat/message", headers=headers, json={"message": "ping", "history": []})
            print(f"\n[POST /chat/message] Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"  Response: {resp.json()['response'][:50]}...")
            elif resp.status_code == 503:
                 print("  Service Unavailable (Expected if Ollama is down).")
            else:
                 print(f"  Response Code: {resp.status_code} (Likely Ollama connection issue, which is OK for now)")
        except Exception as e:
            print(f"  Exception: {e}")

        print("\n--- API Test Complete ---")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
