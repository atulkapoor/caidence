
import random
import os
import aiohttp
from typing import List, Optional
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.schemas import InfluencerProfile, DiscoveryFilter
from app.models.models import Influencer
from app.models.creator import Creator
from dotenv import load_dotenv

load_dotenv()

MODASH_API_KEY = os.getenv("MODASH_API_KEY")
MODASH_BASE_URL = "https://api.modash.io/v1/influencer/search"

class DiscoveryService:
    """
    Discovery service with 3-tier data strategy:
    1. Database (Creator/Influencer tables) - Real, owned data
    2. Modash API - External influencer database (requires API key)
    3. Mock data - Fallback for demos/development
    """
    
    @staticmethod
    async def get_profile(handle: str, db: AsyncSession = None) -> Optional[InfluencerProfile]:
        """
        Fetches a single influencer profile by handle.
        Priority: DB -> Modash API -> Mock
        """
        clean_handle = handle.lstrip("@")
        
        # 1. Try database first
        if db:
            # Check Creators table (richer data)
            result = await db.execute(
                select(Creator).where(
                    or_(Creator.handle == handle, Creator.handle == clean_handle)
                )
            )
            creator = result.scalar_one_or_none()
            if creator:
                return DiscoveryService._creator_to_profile(creator)
            
            # Check Influencers table (simpler data)
            result = await db.execute(
                select(Influencer).where(
                    or_(Influencer.handle == handle, Influencer.handle == clean_handle)
                )
            )
            influencer = result.scalar_one_or_none()
            if influencer:
                return DiscoveryService._influencer_to_profile(influencer)
        
        # 2. Try Modash API
        if MODASH_API_KEY and not MODASH_API_KEY.startswith("mock_"):
             # In real impl, fetch specific user from Modash
             pass
        
        # 3. Fallback to deterministic mock
        return DiscoveryService._generate_mock_profile(handle)

    @staticmethod
    async def search_influencers(
        query: str, 
        filters: Optional[DiscoveryFilter] = None,
        db: AsyncSession = None
    ) -> List[InfluencerProfile]:
        """
        Searches for influencers.
        Priority: DB -> Modash API -> Mock
        """
        profiles = []
        
        # 1. Try database first
        if db:
            db_profiles = await DiscoveryService._search_database(query, filters, db)
            if db_profiles:
                profiles.extend(db_profiles)
        
        # 2. Supplement with Modash API if we have key and need more results
        if MODASH_API_KEY and not MODASH_API_KEY.startswith("mock_") and len(profiles) < 10:
            try:
                api_profiles = await DiscoveryService._search_modash_api(query, filters)
                # Avoid duplicates by handle
                existing_handles = {p.handle for p in profiles}
                for p in api_profiles:
                    if p.handle not in existing_handles:
                        profiles.append(p)
            except Exception as e:
                print(f"Modash API Error: {e}")
        
        # 3. Fill with mock data only if no results at all
        if not profiles:
            profiles = await DiscoveryService._generate_mock_profiles(query, filters)
        
        # Sort by match score descending
        profiles.sort(key=lambda x: x.match_score, reverse=True)
        return profiles[:12]  # Cap at 12 results

    @staticmethod
    async def _search_database(
        query: str, 
        filters: Optional[DiscoveryFilter],
        db: AsyncSession
    ) -> List[InfluencerProfile]:
        """
        Search Creators and Influencers tables in database.
        """
        profiles = []
        search_term = f"%{query.lower()}%"
        
        # Search Creators table
        stmt = select(Creator).where(
            or_(
                Creator.handle.ilike(search_term),
                Creator.name.ilike(search_term),
                Creator.category.ilike(search_term),
                Creator.bio.ilike(search_term)
            )
        )
        
        # Apply filters
        if filters:
            if filters.min_reach:
                stmt = stmt.where(Creator.follower_count >= filters.min_reach)
            if filters.platform:
                stmt = stmt.where(Creator.platform.ilike(f"%{filters.platform}%"))
        
        stmt = stmt.limit(10)
        
        result = await db.execute(stmt)
        creators = result.scalars().all()
        
        for creator in creators:
            profiles.append(DiscoveryService._creator_to_profile(creator))
        
        # Also search Influencers table for additional results
        if len(profiles) < 10:
            stmt = select(Influencer).where(
                Influencer.handle.ilike(search_term)
            ).limit(10 - len(profiles))
            
            result = await db.execute(stmt)
            influencers = result.scalars().all()
            
            for influencer in influencers:
                profiles.append(DiscoveryService._influencer_to_profile(influencer))
        
        return profiles

    @staticmethod
    def _creator_to_profile(creator: Creator) -> InfluencerProfile:
        """Convert Creator model to InfluencerProfile schema."""
        import json
        tags = creator.tags if isinstance(creator.tags, list) else []
        
        return InfluencerProfile(
            handle=f"@{creator.handle.lstrip('@')}",
            platform=creator.platform or "Instagram",
            avatar_color=f"hsl({hash(creator.handle) % 360}, 70%, 50%)",
            followers=creator.follower_count or 0,
            engagement_rate=float(creator.engagement_rate or 0.0),
            content_style_match=[creator.category or "General"],
            voice_analysis=[creator.tier or "Micro"] if creator.tier else ["Micro"],
            image_recognition_tags=tags[:3] if tags else ["Brand Roster"],
            audience_demographics=f"{creator.category or 'General'}, Mixed",
            match_score=90 if creator.status == "vetted" else 85
        )

    @staticmethod
    def _influencer_to_profile(influencer: Influencer) -> InfluencerProfile:
        """Convert Influencer model to InfluencerProfile schema."""
        import json
        metrics = {}
        if influencer.metrics_json:
            try:
                metrics = json.loads(influencer.metrics_json)
            except:
                pass
        
        return InfluencerProfile(
            handle=f"@{influencer.handle.lstrip('@')}",
            platform=influencer.platform or "Instagram",
            avatar_color=f"hsl({hash(influencer.handle) % 360}, 70%, 50%)",
            followers=influencer.followers or 0,
            engagement_rate=float(influencer.engagement_rate or 0.0) if influencer.engagement_rate else 0.0,
            content_style_match=metrics.get("styles", ["Authentic"]),
            voice_analysis=metrics.get("voice", ["Trending"]),
            image_recognition_tags=metrics.get("tags", ["Campaign Member"]),
            audience_demographics=metrics.get("demographics", "Unknown"),
            match_score=metrics.get("match_score", 80)
        )

    @staticmethod
    def _generate_mock_profile(handle: str) -> InfluencerProfile:
        """Generate a single deterministic mock profile."""
        seed_value = sum(ord(c) for c in handle)
        random.seed(seed_value)
        
        platforms = ["Instagram", "TikTok", "YouTube", "LinkedIn"]
        styles = ["High Energy", "Minimalist", "Educational", "Cinematic", "Raw/Vlog", "Professional"]
        voices = ["Authoritative", "Relatable", "Fast-paced", "Humorous", "Inspirational", "Analytic"]
        tags_pool = ["Outdoors", "Luxury", "Tech Gadgets", "Fashion", "Food", "Travel", "Fitness", "Decor"]
        
        return InfluencerProfile(
            handle=handle if handle.startswith("@") else f"@{handle}",
            platform=random.choice(platforms),
            avatar_color=f"hsl({random.randint(0, 360)}, 70%, 50%)",
            followers=random.randint(10000, 5000000),
            engagement_rate=round(random.uniform(1.5, 12.0), 1),
            content_style_match=random.sample(styles, 2),
            voice_analysis=random.sample(voices, 2),
            image_recognition_tags=random.sample(tags_pool, 3),
            audience_demographics=f"{random.choice(['18-24', '25-34', '35-44'])}, {random.choice(['Female', 'Male', 'Mixed'])}",
            match_score=random.randint(75, 99)
        )

    @staticmethod
    async def _search_modash_api(query: str, filters: Optional[DiscoveryFilter]) -> List[InfluencerProfile]:
        """
        Internal method to call Modash API.
        """
        headers = {
            "Authorization": f"Bearer {MODASH_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "filter": {
                "keyword": query,
                "network": "instagram"
            },
            "limit": 10
        }

        if filters:
             if filters.min_reach:
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
                    profiles.append(InfluencerProfile(
                        handle=f"@{user.get('username')}",
                        platform="Instagram",
                        avatar_color="#8338ec",
                        followers=user.get("followers", 0),
                        engagement_rate=user.get("engagementRate", 0.0),
                        content_style_match=["Authentic"],
                        voice_analysis=["Trending"],
                        image_recognition_tags=[],
                        audience_demographics="Unknown",
                        match_score=85
                    ))
                return profiles

    @staticmethod
    async def _generate_mock_profiles(query: str, filters: Optional[DiscoveryFilter]) -> List[InfluencerProfile]:
        """
        Deterministic mock generator for demos and dev/test without API keys.
        """
        seed_value = len(query) + (filters.min_reach if filters and filters.min_reach else 0)
        random.seed(seed_value)

        profiles = []
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
            
            profile_tags = random.sample(tags_pool, 3)
            profile_style = random.sample(styles, 2)
            profile_voice = random.sample(voices, 2)
            
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
        
        profiles.sort(key=lambda x: x.match_score, reverse=True)
        return profiles

    @staticmethod
    async def search_by_image(filename: str, db: AsyncSession = None) -> List[InfluencerProfile]:
        """
        Simulates finding influencers matching the visual style of an uploaded image.
        In production, this would use image recognition + vector search.
        """
        random.seed(len(filename))
        
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

