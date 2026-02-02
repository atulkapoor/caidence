
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_backend_gap_features():
    print("--- Testing Backend Gap Features ---")
    
    # 1. Get a Campaign ID (or create one)
    # Getting list
    print("\n1. Fetching Campaigns...")
    try:
        r = requests.get(f"{BASE_URL}/campaigns/")
        if r.status_code != 200:
            print(f"Failed to fetch campaigns: {r.status_code} {r.text}")
            return
        
        campaigns = r.json()
        if not campaigns:
            print("No campaigns found. Creating one...")
            c_data = {"title": "Test Gap Campaign", "status": "draft"}
            r = requests.post(f"{BASE_URL}/campaigns/", json=c_data)
            cid = r.json()["id"]
        else:
            cid = campaigns[0]["id"]
        print(f"Using Campaign ID: {cid}")
        
    except requests.exceptions.ConnectionError:
        print("CRITICAL: Cannot connect to Backend at localhost:8000. Is it running?")
        return

    # 2. Add Influencer
    print(f"\n2. Testing POST /campaigns/{cid}/influencers ...")
    inf_data = {"influencer_handle": "@backend_test_guru"}
    # Note: query param vs body? The endpoint defined: 
    # async def add_influencer_to_campaign(campaign_id: int, influencer_handle: str
    # FastAPI defaults 'str' parameters to QUERY params if not Pydantic model.
    # So url should be ...?influencer_handle=@backend_test_guru
    
    r = requests.post(f"{BASE_URL}/campaigns/{cid}/influencers", params=inf_data)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
    
    if r.status_code not in [200, 422]: 
         print("FAILED: Influencer endpoint possibly missing or error.")

    # 3. Launch Campaign
    print(f"\n3. Testing POST /campaigns/{cid}/launch ...")
    r = requests.post(f"{BASE_URL}/campaigns/{cid}/launch")
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")

    # 4. Verify Full Response (Influencers + Events)
    print(f"\n4. Verifying GET /campaigns/{cid} includes new fields...")
    r = requests.get(f"{BASE_URL}/campaigns/{cid}")
    data = r.json()
    
    # Check keys
    has_influencers = "influencers" in data
    has_events = "events" in data
    print(f"Has 'influencers' key? {has_influencers}")
    print(f"Has 'events' key? {has_events}")
    
    if has_influencers and has_events:
        print("SUCCESS: Backend seems to have the schema changes!")
    else:
        print("FAILURE: Response schema missing new keys.")
        print(data.keys())

if __name__ == "__main__":
    test_backend_gap_features()
