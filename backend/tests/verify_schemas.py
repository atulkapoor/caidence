
from app.schemas.schemas import CampaignFullResponse, Influencer, CampaignEvent
from datetime import datetime

def test_schemas():
    try:
        # Mock data (like what ORM would return or API would receive)
        mock_data = {
            "id": 1,
            "title": "Test Campaign",
            "owner_id": 100,
            "created_at": datetime.now(),
            "status": "active",
            "budget": "5000",
            "influencers": [
                {
                    "id": 5, 
                    "handle": "@test", 
                    "platform": "IG", 
                    "followers": 1000
                }
            ],
            "events": [
                {
                    "id": 99,
                    "type": "launch",
                    "campaign_id": 1,
                    "created_at": datetime.now()
                }
            ]
        }
        
        # Validate
        res = CampaignFullResponse(**mock_data)
        
        print(f"Validated JSON: {res.model_dump_json(indent=2)}")
        assert len(res.influencers) == 1
        assert res.influencers[0].handle == "@test"
        assert res.events[0].type == "launch"
        
        print("SUCCESS: Schemas validated.")
    except Exception as e:
        print(f"FAILED: {e}")
        raise e

if __name__ == "__main__":
    test_schemas()
