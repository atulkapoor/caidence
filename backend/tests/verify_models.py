
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Base, Campaign, Influencer, CampaignInfluencer, CampaignEvent, User

# Create in-memory SQLite database
engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)

def test_models():
    session = SessionLocal()
    try:
        # Create a User (owner)
        user = User(email="test@example.com", full_name="Test Owner")
        session.add(user)
        session.flush()

        # Create a Campaign
        campaign = Campaign(title="Test Campaign", owner_id=user.id)
        session.add(campaign)
        session.flush()

        # Create an Influencer
        influencer = Influencer(handle="@test_influencer", platform="Instagram", followers=1000)
        session.add(influencer)
        session.flush()

        # Link them (CampaignInfluencer)
        # Using the append method if relationship is defined, or direct association object creation
        # Since we defined secondary, we can try direct list append first
        campaign.influencers.append(influencer)
        
        # Create an Event
        event = CampaignEvent(campaign_id=campaign.id, type="launch", value=1)
        session.add(event)
        
        session.commit()

        # Verify
        c_query = session.query(Campaign).first()
        print(f"Campaign: {c_query.title}")
        print(f"Influencers: {[i.handle for i in c_query.influencers]}")
        print(f"Events: {[e.type for e in c_query.events]}")

        assert len(c_query.influencers) == 1
        assert c_query.influencers[0].handle == "@test_influencer"
        assert len(c_query.events) == 1
        assert c_query.events[0].type == "launch"

        print("SUCCESS: All models created and linked correctly.")
    except Exception as e:
        print(f"FAILED: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    test_models()
