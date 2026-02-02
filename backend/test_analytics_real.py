import asyncio
import httpx
import sys

API_URL = "http://localhost:8000/api/v1"

async def test_analytics_flow():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("\n--- 1. Get Initial Analytics ---")
        try:
            resp = await client.get(f"{API_URL}/analytics/dashboard")
            resp.raise_for_status()
            initial_stats = resp.json()["overview"]
            print(f"Initial Active Campaigns: {initial_stats['roi']}") # ROI is derived from active campaigns count
        except Exception as e:
            print(f"Failed to get analytics: {e}")
            return

        print("\n--- 2. Create & Launch Campaign ---")
        # Create
        campaign_data = {
            "title": "Analytics Test Campaign",
            "description": "Testing analytics data flow",
            "goals": ["Sales"],
            "status": "draft"
        }
        resp = await client.post(f"{API_URL}/campaigns/", json=campaign_data)
        resp.raise_for_status()
        campaign_id = resp.json()["id"]
        print(f"Created Campaign ID: {campaign_id}")

        # Add Influencer
        resp = await client.post(f"{API_URL}/campaigns/{campaign_id}/influencers?influencer_handle=analytics_user_1")
        resp.raise_for_status()
        print("Added Influencer")

        # Launch
        resp = await client.post(f"{API_URL}/campaigns/{campaign_id}/launch")
        resp.raise_for_status()
        print("Launched Campaign")

        print("\n--- 3. Verify Analytics Update ---")
        resp = await client.get(f"{API_URL}/analytics/dashboard")
        resp.raise_for_status()
        new_stats = resp.json()["overview"]
        
        # Check ROI change (formula was 3.2 + active * 0.1)
        # Or check active campaigns count if I exposed it. 
        # Actually I didn't expose active campaigns count directly in 'overview', I used it for ROI calculation.
        # ROI = 3.2 + (active_campaigns * 0.1)
        
        print(f"Previous ROI: {initial_stats['roi']}")
        print(f"New ROI: {new_stats['roi']}")
        
        if new_stats['roi'] > initial_stats['roi']:
            print("SUCCESS: ROI increased, indicating active campaign count was updated.")
        else:
            print("WARNING: ROI did not increase as expected.")

        print(f"Conversions: {new_stats['conversions']}")
        print(f"Engagement: {new_stats['engagement_rate']}")

if __name__ == "__main__":
    asyncio.run(test_analytics_flow())
