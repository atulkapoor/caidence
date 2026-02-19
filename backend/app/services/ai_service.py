"""
AI Service with Multi-Provider Support via LiteLLM.

Supports:
- Ollama (local, default)
- OpenAI (gpt-4, gpt-3.5-turbo)
- Anthropic (claude-3)
- Google (gemini-pro)

Configuration via environment variables:
- LLM_PROVIDER: ollama, openai, anthropic, gemini (default: ollama)
- LLM_MODEL: model name (default: auto-detected for ollama)
- OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY: API keys for cloud providers
"""

import asyncio
import base64
from http.client import HTTPException
import os
import json
import random
import logging
from urllib import response
from click import style
import google.generativeai as genai
from typing import Optional, List, Dict
from app.core.config import settings
from dotenv import load_dotenv


import httpx

# LiteLLM for provider abstraction
try:
    import litellm
    from litellm import acompletion
    LITELLM_AVAILABLE = True
    litellm.set_verbose = False  # Reduce noise
except ImportError:
    LITELLM_AVAILABLE = False

logger = logging.getLogger(__name__)

# Configuration from environment
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
LLM_MODEL = os.getenv("LLM_MODEL", "")  # Empty = auto-detect
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Set Ollama API base for LiteLLM
if LLM_PROVIDER == "ollama":
    os.environ["OLLAMA_API_BASE"] = OLLAMA_BASE_URL


class AIService:
    """
    Multi-provider AI Service.
    Uses LiteLLM for abstraction when available, with fallback to direct Ollama calls.
    """
    
    _cached_model: Optional[str] = None
    
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=GEMINI_API_KEY)

    
    nano_model = genai.GenerativeModel("nano-banana-pro-preview")
    gemini_model = genai.GenerativeModel("gemini-pro-latest")

    @staticmethod
    def _get_model_name() -> str:
        """Get the configured or auto-detected model name."""
        if LLM_MODEL:
            return LLM_MODEL
        
        if LLM_PROVIDER == "ollama":
            return AIService._cached_model or "llama3"
        elif LLM_PROVIDER == "openai":
            return "gpt-3.5-turbo"
        elif LLM_PROVIDER == "anthropic":
            return "claude-3-haiku-20240307"
        elif LLM_PROVIDER == "gemini":
            return "gemini/gemini-pro"
        else:
            return "llama3"

    @staticmethod
    async def _discover_ollama_model() -> str:
        """Dynamically find an available Ollama model, preferring specific ones."""
        if AIService._cached_model:
            return AIService._cached_model

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                res.raise_for_status()
                models = [m["name"] for m in res.json().get("models", [])]
                
                # Preference order
                for pref in ["qwen", "mistral", "llama3", "gemma"]:
                    matches = [m for m in models if pref in m]
                    if matches:
                        AIService._cached_model = matches[0]
                        logger.info(f"Selected Ollama model: {AIService._cached_model}")
                        return AIService._cached_model
                
                # Fallback to first available
                if models:
                    AIService._cached_model = models[0]
                    logger.warning(f"No preferred model found. Using: {AIService._cached_model}")
                    return AIService._cached_model
                    
        except Exception as e:
            logger.error(f"Failed to fetch Ollama models: {e}")
        
        return "llama3"

    @staticmethod
    async def _call_llm(prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        """
        Call LLM using LiteLLM abstraction layer.
        Falls back to direct Ollama API if LiteLLM unavailable.
        """
        # Auto-discover Ollama model if needed
        if LLM_PROVIDER == "ollama" and not AIService._cached_model:
            await AIService._discover_ollama_model()
        
        model = AIService._get_model_name()
        
        # Build messages
        messages: List[Dict] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Try LiteLLM first (for cloud providers)
        if LITELLM_AVAILABLE and LLM_PROVIDER != "ollama":
            try:
                # LiteLLM model naming convention
                if LLM_PROVIDER == "openai":
                    model_name = model
                elif LLM_PROVIDER == "anthropic":
                    model_name = f"anthropic/{model}"
                elif LLM_PROVIDER == "gemini":
                    model_name = f"gemini/{model}" if not model.startswith("gemini/") else model
                else:
                    model_name = model
                
                response = await acompletion(
                    model=model_name,
                    messages=messages,
                    response_format={"type": "json_object"} if json_mode else None
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.error(f"LiteLLM error: {e}")
                # Fall through to Ollama fallback
        
        # Direct Ollama API call (default or fallback)
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                }
                if json_mode:
                    payload["format"] = "json"

                response = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except httpx.RequestError as e:
            logger.error(f"Ollama connection failed: {e}")
            return f"[AI Unavailable] Mock response for: {prompt[:50]}..."
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return f"Error from AI: {e}"

    # @staticmethod
    # async def generate_content(platform: str, content_type: str, prompt: str) -> str:
    #     """Generates marketing content."""
    #     system = "You are a professional marketing assistant."
    #     full_prompt = (
    #         f"Create a {platform} {content_type} based on this topic: '{prompt}'. "
    #         f"Make it engaging, professional, and viral. "
    #         f"Include relevant hashtags. Return ONLY the content."
    #     )
    #     return await AIService._call_llm(full_prompt, system_prompt=system)
    
    @staticmethod
    async def generate_content(platform, content_type, prompt):
        print("🔥 Gemini called")
        print("Gemini key:", settings.GEMINI_API_KEY)

        full_prompt = f"""
            You are a world-class viral social media copywriter.

        Create ONLY one {platform} {content_type}.

        Topic: {prompt}

        Rules:
        - Ready to post immediately
        - No multiple options
        - No explanation
        - No Spelling mistakes
        - No tips
        - No extra headings
        - Strong emotional hook
        - High engagement
        - Clear CTA
        - Relevant hashtags
        - Modern tone
        """

        # 🔥 Force Gemini for now
        response = AIService.gemini_model.generate_content(full_prompt)

        return response.text

    # @staticmethod
    # async def generate_image(style: str, prompt: str, aspect_ratio: str = "1:1") -> str:
    #     """Generates an image via Stable Diffusion (AI Worker)."""
    #     ai_worker_url = os.getenv("AI_WORKER_URL", "http://ai_worker:8001")
        
    #     # Enhanced prompt based on style
    #     style_modifiers = {
    #         "Photorealistic": "photorealistic, 8k, detailed, unreal engine 5",
    #         "3D Render": "3d render, blender, octave render, clay",
    #         "Minimalist": "minimalist, flat design, vector art",
    #         "Cyberpunk": "cyberpunk, neon, futuristic, high tech"
    #     }
        
    #     final_prompt = f"{prompt}, {style_modifiers.get(style, '')}"
        
    #     # Map aspect ratios to dimensions (assuming SDXL or similar 1024x1024 base)
    #     ratio_map = {
    #         "1:1": {"width": 1024, "height": 1024},
    #         "16:9": {"width": 1024, "height": 576},
    #         "9:16": {"width": 576, "height": 1024},
    #         "4:3": {"width": 1024, "height": 768},
    #         "3:4": {"width": 768, "height": 1024}
    #     }
    #     dims = ratio_map.get(aspect_ratio, {"width": 1024, "height": 1024})
        
    #     try:
    #         async with httpx.AsyncClient(timeout=120.0) as client: # Long timeout for generation
    #             res = await client.post(
    #                 f"{ai_worker_url}/generate",
    #                 json={
    #                     "prompt": final_prompt, 
    #                     "steps": 25,  # Increased steps for better quality
    #                     "width": dims["width"], 
    #                     "height": dims["height"]
    #                 } 
    #             )
    #             res.raise_for_status()
    #             data = res.json()
    #             base64_img = data.get("image_base64")
    #             return f"data:image/png;base64,{base64_img}"
    #     except Exception as e:
    #         logger.error(f"Image generation failed: {e}")
    #         # Fallback to placeholder if worker is down
    #         return f"https://via.placeholder.com/{dims['width']}x{dims['height']}?text=Generation+Failed"

    @staticmethod
    async def generate_image(
    style: str,
    prompt: str,
    aspect_ratio: str = "1:1",
    reference_image: str | None = None,
) -> str:

        style_map = {
        "Photorealistic": "ultra realistic, 8k, product photography, studio lighting",
        "3D Render": "3d render, blender, cinematic lighting",
        "Minimalist": "flat design, clean, vector",
        "Cyberpunk": "cyberpunk, neon, futuristic",
        }
    
        final_prompt = f"""
        Create a {style} high-quality marketing image.

        Topic: {prompt}

        Requirements:
        - Eye-catching
        - High contrast
        - Modern and premium
        - Aspect ratio {aspect_ratio}
        - {style_map.get(style, '')}
        """

        try:
            content = []

            # ✅ Add reference image
            if reference_image:
                if "base64," in reference_image:
                    reference_image = reference_image.split("base64,")[1]

                image_bytes = base64.b64decode(reference_image)

                content.append({
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": image_bytes
                    }
                })

            content.append({"text": final_prompt})

            response = await asyncio.to_thread(
                AIService.nano_model.generate_content,
                content
            )

            #  Extract image
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if hasattr(part, "inline_data") and part.inline_data:
                        img_base64 = base64.b64encode(
                            part.inline_data.data
                        ).decode("utf-8")

                        return f"data:image/png;base64,{img_base64}"

           
            raise HTTPException(
                status_code=500,
                detail="Image generation failed. No image returned from AI."
            )

        except Exception as e:
            logger.error(f"Nano banana error: {e}")
            raise HTTPException(
            status_code=500,
            detail="Image generation failed. Please try again."
            )
    
    @staticmethod
    async def generate_presentation_slides(source_type: str, title: str) -> str:
        """Generates Slide JSON."""
        prompt = (
            f"Create a presentation outline about '{title}'. "
            f"Generate a JSON array of 4-6 slides. "
            f"Each slide must have a 'title' (string) and 'points' (array of strings). "
            f"Example format: [{{ 'title': 'Intro', 'points': ['Point 1'] }}]. "
            f"Respond with ONLY the JSON."
        )
        return await AIService._call_llm(prompt, json_mode=True)

    @staticmethod
    async def generate_campaign_strategy(role: str, project_type: str, objective: str) -> str:
        """Generates a comprehensive marketing strategy as JSON."""
        prompt = (
            f"Act as an expert {role}. Create a detailed marketing strategy for a '{project_type}' "
            f"with the following objective: '{objective}'. "
            f"Response MUST be a valid JSON object with the following structure: "
            f"{{ "
            f"  'target_audience': [ {{ 'name': 'Persona Name', 'description': '...' }} ], "
            f"  'key_channels': [ 'Channel 1', 'Channel 2' ], "
            f"  'content_ideas': [ {{ 'title': 'Idea 1', 'format': 'Blog/Video', 'description': '...' }} ], "
            f"  'strategic_recommendations': [ 'Rec 1', 'Rec 2' ] "
            f"}} "
            f"Return ONLY the JSON. Do not include markdown formatting or explanations."
        )
        
        try:
            return await AIService._call_llm(prompt, json_mode=True)
        except Exception as e:
            logger.error(f"Strategy generation failed: {e}")
            # Mock fallback
            return json.dumps({
                "target_audience": [
                    {"name": "Young Professionals", "description": "Tech-savvy individuals aged 25-35"},
                    {"name": "Industry Experts", "description": "Decision makers looking for innovation"}
                ],
                "key_channels": ["LinkedIn", "Twitter/X", "Industry Blogs"],
                "content_ideas": [
                    {"title": "Launch Announcement", "format": "Press Release", "description": "Official announcement"},
                    {"title": "Behind the Scenes", "format": "Video", "description": "Showcasing the process"}
                ],
                "strategic_recommendations": [
                    "Focus on thought leadership content",
                    "Engage with micro-influencers in the niche"
                ]
            })

    @staticmethod
    async def generate_marcom_content(tool_id: str, inputs: dict) -> str:
        """Generates content for standard Marcom tools."""
        input_str = ", ".join([f"{k.replace('_', ' ').capitalize()}: {v}" for k, v in inputs.items()])
        
        prompt_map = {
            "facebook-ad-headline": f"Generate 5 catchy Facebook Ad headlines. Context: {input_str}",
            "website-headline": f"Generate 5 powerful H1 homepage headlines. Context: {input_str}",
            "email-subject-line": f"Generate 5 high-converting email subject lines. Context: {input_str}",
            "seo-meta-description": f"Write 3 SEO meta descriptions (under 160 chars). Context: {input_str}",
            "social-post-idea": f"Generate 5 engaging social media post ideas. Context: {input_str}",
            "product-description": f"Write a compelling product description (approx 100 words). Context: {input_str}",
            "blog-post-intro": f"Write 3 engaging blog post introductions. Context: {input_str}",
        }
        
        prompt_text = prompt_map.get(tool_id, f"Generate content for {tool_id}. Context: {input_str}")
        full_prompt = f"{prompt_text}. Return ONLY the content in a clear, numbered list format."
        
        return await AIService._call_llm(full_prompt)

    @staticmethod
    async def get_system_status() -> dict:
        """Returns LLM engine status."""
        # Get current provider and model info
        provider = LLM_PROVIDER
        model = AIService._get_model_name()
        
        # Check Ollama health if using it
        if provider == "ollama":
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    res = await client.get(f"{OLLAMA_BASE_URL}")
                    is_up = res.status_code == 200
                    return {
                        "ai_engine": f"Ollama (Local)",
                        "provider": provider,
                        "status": "online" if is_up else "offline",
                        "model": model,
                        "url": OLLAMA_BASE_URL,
                        "litellm_available": LITELLM_AVAILABLE
                    }
            except Exception as e:
                logger.error(f"Health check failed: {e}")
                return {
                    "ai_engine": "Ollama (Local)",
                    "provider": provider,
                    "status": "offline",
                    "model": model,
                    "error": str(e)
                }
        else:
            # Cloud provider - assume available if API key is set
            key_var = f"{provider.upper()}_API_KEY"
            has_key = bool(os.getenv(key_var))
            return {
                "ai_engine": f"{provider.title()} Cloud",
                "provider": provider,
                "status": "configured" if has_key else "missing_key",
                "model": model,
                "litellm_available": LITELLM_AVAILABLE
            }

    @staticmethod
    async def chat_completion(messages: List[dict]) -> str:
        """
        Sends a chat history to the LLM.
        Messages format: [{"role": "user", "content": "..."}]
        """
        # Auto-discover Ollama model if needed
        if LLM_PROVIDER == "ollama" and not AIService._cached_model:
            await AIService._discover_ollama_model()
        
        model = AIService._get_model_name()
        
        # Try LiteLLM for cloud providers
        if LITELLM_AVAILABLE and LLM_PROVIDER != "ollama":
            try:
                model_name = model
                if LLM_PROVIDER == "anthropic":
                    model_name = f"anthropic/{model}"
                elif LLM_PROVIDER == "gemini":
                    model_name = f"gemini/{model}" if not model.startswith("gemini/") else model
                
                response = await acompletion(model=model_name, messages=messages)
                return response.choices[0].message.content
            except Exception as e:
                logger.error(f"LiteLLM chat error: {e}")
        
        # Direct Ollama chat API
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                payload = {
                    "model": model,
                    "messages": messages,
                    "stream": False,
                }
                response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
                response.raise_for_status()
                result = response.json()
                return result.get("message", {}).get("content", "")
        except Exception as e:
            logger.error(f"Chat completion failed: {e}")
            last_msg = messages[-1]["content"] if messages else ""
            return f"[Offline Mode] Great point about '{last_msg[:30]}'. Ensure your LLM provider is configured."
