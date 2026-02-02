import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000/api/v1"

async def test_enhance_description():
    print("\n--- Testing Enhance Description ---")
    async with aiohttp.ClientSession() as session:
        text = "we want to sell more coffee to people who work from home"
        async with session.post(f"{BASE_URL}/agent/enhance_description", json={"text": text}) as resp:
            print(f"Status: {resp.status}")
            if resp.status == 200:
                data = await resp.json()
                print(f"Original: {text}")
                print(f"Enhanced: {data.get('enhanced_text')}")
            else:
                print(await resp.text())

async def test_campaign_flow():
    print("\n--- Testing Campaign Creation Flow ---")
    async with aiohttp.ClientSession() as session:
        # 1. Create Campaign
        campaign_data = {
            "title": "Frontend Integration Test Campaign",
            "description": "Testing the full flow from script",
            "status": "draft",
            "budget": "1000",
            "channels": "[\"Instagram\", \"TikTok\"]"
        }
        async with session.post(f"{BASE_URL}/campaigns/", json=campaign_data) as resp:
            if resp.status != 200:
                print(f"Create Failed: {await resp.text()}")
                return
            campaign = await resp.json()
            campaign_id = campaign['id']
            print(f"Created Campaign ID: {campaign_id}")

        # 2. Add Influencers
        influencers = ["@tech_guru", "@coffee_lover"]
        for handle in influencers:
            stripped = handle.replace("@", "")
            # Note: The frontend sends query param '?influencer_handle=...'
            url = f"{BASE_URL}/campaigns/{campaign_id}/influencers?influencer_handle={stripped}"
            async with session.post(url) as resp:
                print(f"Add Influencer {stripped}: {resp.status}")

        # 3. Launch
        async with session.post(f"{BASE_URL}/campaigns/{campaign_id}/launch") as resp:
            print(f"Launch Status: {resp.status}")
            if resp.status == 200:
                print("Campaign Launched!")
            else:
                print(await resp.text())
        
        # 4. Verify Final State
        async with session.get(f"{BASE_URL}/campaigns/{campaign_id}") as resp:
            data = await resp.json()
            print(f"Final Status: {data['status']}")
            print(f"Influencers Count: {len(data.get('influencers', []))}")
            print(f"Events Count: {len(data.get('events', []))}")

async def main():
    await test_enhance_description()
    await test_campaign_flow()

if __name__ == "__main__":
    asyncio.run(main())
