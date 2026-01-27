
import random
import os
import aiohttp
from typing import List, Optional
from app.schemas.schemas import InfluencerProfile, DiscoveryFilter
from dotenv import load_dotenv

load_dotenv()

MODASH_API_KEY = os.getenv("MODASH_API_KEY")
MODASH_BASE_URL = "https://api.modash.io/v1/influencer/search"

class DiscoveryService:
    @staticmethod
    async def search_influencers(query: str, filters: Optional[DiscoveryFilter] = None) -> List[InfluencerProfile]:
        """
        Searches for influencers.
        If a valid MODASH_API_KEY is present and not matching 'mock_', it calls the real Modash API.
        Otherwise, it falls back to the deterministic mock generator.
        """
        # Check if we should use Real API
        if MODASH_API_KEY and not MODASH_API_KEY.startswith("mock_"):
            try:
                return await DiscoveryService._search_modash_api(query, filters)
            except Exception as e:
                print(f"Modash API Error: {e}. Falling back to mock data.")
                # Fallback to mock on error
        
        return await DiscoveryService._generate_mock_profiles(query, filters)

    @staticmethod
    async def _search_modash_api(query: str, filters: Optional[DiscoveryFilter]) -> List[InfluencerProfile]:
        """
        Internal method to call Modash API.
        This is a simplified implementation mapping their complex filter structure.
        """
        headers = {
            "Authorization": f"Bearer {MODASH_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Construct Modash-compatible payload
        # Note: This is a simplified mapping. Real Modash API uses complex filter objects.
        payload = {
            "filter": {
                "keyword": query,
                "network": "instagram" # Defaulting for this MVP
            },
            "limit": 10
        }

        if filters:
             if filters.min_reach:
                 # Modash specific path for followers
                 pass 
             if filters.location:
                 pass

        async with aiohttp.ClientSession() as session:
            async with session.post(MODASH_BASE_URL, json=payload, headers=headers) as resp:
                if resp.status != 200:
                    raise Exception(f"Modash API returned {resp.status}")
                
                data = await resp.json()
                profiles = []
                for user in data.get("users", []):
                    # Map Modash user to our schema
                    profiles.append(InfluencerProfile(
                        handle=f"@{user.get('username')}",
                        platform="Instagram",
                        avatar_color="#8338ec", # Default or extract from image url
                        followers=user.get("followers", 0),
                        engagement_rate=user.get("engagementRate", 0.0),
                        content_style_match=["Authentic"], # Placeholder
                        voice_analysis=["Trending"],
                        image_recognition_tags=[],
                        audience_demographics="Unknown",
                        match_score=85 # Mocked relevance
                    ))
                return profiles

    @staticmethod
    async def _generate_mock_profiles(query: str, filters: Optional[DiscoveryFilter]) -> List[InfluencerProfile]:
        """
        Deterministic mock generator for demos and dev/test without API keys.
        """
        # Deterministic seed for consistency based on query length and filter params
        seed_value = len(query) + (filters.min_reach if filters and filters.min_reach else 0)
        random.seed(seed_value)

        profiles = []
        # Generate 6-12 mock results
        num_results = random.randint(6, 12)
        
        platforms = ["Instagram", "TikTok", "YouTube", "LinkedIn"]
        styles = ["High Energy", "Minimalist", "Educational", "Cinematic", "Raw/Vlog", "Professional"]
        voices = ["Authoritative", "Relatable", "Fast-paced", "Humorous", "Inspirational", "Analytic"]
        tags_pool = ["Outdoors", "Luxury", "Tech Gadgets", "Fashion", "Food", "Travel", "Fitness", "Decor"]
        
        for i in range(num_results):
            base_handle = query.split(" ")[0] if query else "creator"
            if len(base_handle) > 10: base_handle = base_handle[:10]
            clean_handle = "".join(e for e in base_handle if e.isalnum())
            handle = f"@{clean_handle}_{random.randint(100, 999)}_{i}"
            
            # Mock logic to generate "AI Analysis" tags
            profile_tags = random.sample(tags_pool, 3)
            profile_style = random.sample(styles, 2)
            profile_voice = random.sample(voices, 2)
            
            # Simulate match score
            match_score = random.randint(75, 99)
            
            profiles.append(InfluencerProfile(
                handle=handle,
                platform=random.choice(platforms),
                avatar_color=f"hsl({random.randint(0, 360)}, 70%, 50%)",
                followers=random.randint(10000, 5000000),
                engagement_rate=round(random.uniform(1.5, 12.0), 1),
                content_style_match=profile_style,
                voice_analysis=profile_voice,
                image_recognition_tags=profile_tags,
                audience_demographics=f"{random.choice(['18-24', '25-34', '35-44'])}, {random.choice(['Female', 'Male', 'Mixed'])}",
                match_score=match_score
            ))
        
        # Sort by match score descending
        profiles.sort(key=lambda x: x.match_score, reverse=True)
        return profiles

    @staticmethod
    async def search_by_image(filename: str) -> List[InfluencerProfile]:
        """
        Simulates finding influencers matching the visual style of an uploaded image.
        """
        random.seed(len(filename)) # Seed based on filename length
        
        profiles = []
        num_results = 5
        
        platforms = ["Instagram", "Pinterest", "TikTok"]
        styles = ["Aesthetic", "Visual", "Cinematic"]
        tags_pool = ["Visual Match", "Color Palette Match", "Object Match"]

        for i in range(num_results):
            handle = f"@visual_creator_{random.randint(100, 999)}"
            
            profiles.append(InfluencerProfile(
                handle=handle,
                platform=random.choice(platforms),
                avatar_color=f"hsl({random.randint(0, 360)}, 70%, 50%)",
                followers=random.randint(50000, 1000000),
                engagement_rate=round(random.uniform(3.0, 15.0), 1),
                content_style_match=random.sample(styles, 2),
                voice_analysis=["Visual Storytelling"],
                image_recognition_tags=tags_pool,
                audience_demographics="25-34, Mixed",
                match_score=random.randint(85, 98)
            ))
            
        return profiles
