
import random
from typing import List, Optional
from app.schemas.schemas import InfluencerProfile, DiscoveryFilter

class DiscoveryService:
    @staticmethod
    async def search_influencers(query: str, filters: Optional[DiscoveryFilter] = None) -> List[InfluencerProfile]:
        """
        Simulates AI-powered search by matching 'content vibes' and voice.
        In a real app, this would query a vector DB or external API like Modash/HypeAuditor.
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
            handle = f"@{base_handle}_{random.randint(100, 999)}_{i}"
            
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
