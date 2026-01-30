import httpx
import asyncio

BASE_URL = "http://localhost:8000/api/v1"

async def test_rbac():
    async with httpx.AsyncClient() as client:
        # 1. Login as Root
        print("Logging in...")
        resp = await client.post(f"{BASE_URL}/auth/login", data={"username": "admin@cadence.ai", "password": "admin123"})
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
            
        token = resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("Login success.")

        # 2. List Roles
        print("\nFetching Roles...")
        resp = await client.get(f"{BASE_URL}/rbac/roles", headers=headers)
        if resp.status_code == 200:
            roles = resp.json()
            print(f"Found {len(roles)} roles:")
            for r in roles:
                print(f" - {r['name']} (Level {r['hierarchy_level']})")
        else:
            print(f"Failed to list roles: {resp.text}")

        # 3. Create Team
        print("\nCreating Team 'Alpha Squad'...")
        # Need org_id. Assume admin is in org 1.
        me = await client.get(f"{BASE_URL}/auth/me", headers=headers)
        user = me.json()
        org_id = user['organization_id'] or 1 # Fallback if null (though admin should have one)
        
        team_data = {"name": "Alpha Squad", "organization_id": org_id}
        resp = await client.post(f"{BASE_URL}/teams/", json=team_data, headers=headers)
        if resp.status_code == 200:
            team = resp.json()
            print(f"Team created: ID {team['id']}, Name {team['name']}")
        else:
            print(f"Failed to create team: {resp.text}")

        # 4. List Teams
        print("\nListing Teams...")
        resp = await client.get(f"{BASE_URL}/teams/", headers=headers)
        if resp.status_code == 200:
            teams = resp.json()
            print(f"Found {len(teams)} teams.")
        else:
            print(f"Failed to list teams: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_rbac())
