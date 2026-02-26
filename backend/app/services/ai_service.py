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
from dotenv import load_dotenv
import asyncio


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
    def _normalize_model_name(model: Optional[str]) -> str:
        if not model:
            return "unknown"
        normalized = model.strip().lower()
        compact = "".join(ch for ch in normalized if ch.isalnum())

        if "nanobanana" in compact or compact == "nano":
            return "nanobanana"
        if "gemini" in compact:
            return "gemini"
        return "unknown"

    @staticmethod
    def _get_google_model(model: Optional[str], task: str = "content"):
        model_key = AIService._normalize_model_name(model)

        # Enforce task-to-model mapping:
        # - content => Gemini
        # - image   => NanoBanana
        if task == "image":
            if model_key != "nanobanana":
                logger.info(
                    f"Model '{model}' requested for image generation. Using NanoBanana."
                )
            return AIService.nano_model, "NanoBanana"

        if model_key == "nanobanana":
            logger.info(
                "NanoBanana selected for content generation. Using Gemini for text output."
            )
        return AIService.gemini_model, "Gemini"

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

    @staticmethod
    def _clean_text_output(text: str) -> str:
        # Keep formatting but remove common wrapper noise from model outputs.
        cleaned = (text or "").strip()
        cleaned = cleaned.replace("```markdown", "").replace("```", "").strip()
        return cleaned

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
    async def generate_content(
        title: str,
        platform: Optional[str] = None,
        content_type: Optional[str] = None,
        prompt: Optional[str] = None,
        model: Optional[str] = None,
    ):
        # Backward compatibility for older call pattern:
        # generate_content(platform, content_type, prompt)
        if prompt is None and platform and content_type:
            prompt = content_type
            content_type = platform
            platform = title
            title = "Generated Content"

        platform = platform or "General"
        content_type = content_type or "Post"
        prompt = prompt or ""
        selected_model, selected_model_name = AIService._get_google_model(
            model,
            task="content",
        )

        full_prompt = f"""
You are a senior social media copywriter.

Write exactly one polished, ready-to-post {platform} {content_type} in fluent English.

Campaign Title:
{title}

Topic / Brief:
{prompt}

Quality requirements:
- Zero spelling mistakes and correct grammar.
- Clear structure: hook, value, CTA.
- Platform-native tone for {platform}.
- Keep it specific and practical, not generic filler.
- Add only relevant hashtags (3-8 max).
- Return only final post text. No explanations, no markdown fences.
"""

        response = await asyncio.to_thread(selected_model.generate_content, full_prompt)
        draft_text = AIService._clean_text_output(response.text or "")

        # Second pass proofreading to reduce spelling/grammar errors.
        proof_prompt = f"""
Proofread and lightly improve the social post below.
Rules:
- Fix spelling and grammar mistakes.
- Preserve meaning, platform, and intent.
- Keep hashtags relevant.
- Return only the final corrected post text.

Post:
{draft_text}
"""
        proofed = await asyncio.to_thread(selected_model.generate_content, proof_prompt)
        final_text = AIService._clean_text_output(proofed.text or draft_text)
        return final_text or f"[{selected_model_name}] No response generated."

    @staticmethod
    async def adapt_content_for_platform(
        base_text: str,
        platform: str,
        content_type: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        platform = platform or "General"
        content_type = content_type or "Post"
        selected_model, selected_model_name = AIService._get_google_model(
            model,
            task="content",
        )

        adapt_prompt = f"""
You are a senior social copy editor.

Adapt the post below for {platform} as a {content_type}.
Rules:
- Keep the same core message and meaning.
- Keep tone clear and professional.
- Add/adjust hashtags and formatting to fit {platform}.
- Do not change factual claims.
- Return only the final post text.

Base Post:
{base_text}
"""
        response = await asyncio.to_thread(selected_model.generate_content, adapt_prompt)
        text = AIService._clean_text_output(response.text or "")
        return text or f"[{selected_model_name}] No response generated."

    @staticmethod
    async def enhance_text(
        text: str,
        model: Optional[str] = None,
    ) -> str:
        selected_model, selected_model_name = AIService._get_google_model(
            model,
            task="content",
        )
        enhance_prompt = f"""
You are an expert marketing copy editor.

Rewrite the text below to be more engaging, professional, and persuasive.
Rules:
- Keep the original meaning and intent.
- Keep it concise.
- Improve clarity, grammar, and flow.
- Return only the rewritten text.

Text:
{text}
"""
        response = await asyncio.to_thread(selected_model.generate_content, enhance_prompt)
        rewritten = AIService._clean_text_output(response.text or "")
        return rewritten or f"[{selected_model_name}] No response generated."

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
        title: str,
        style: Optional[str] = None,
        prompt: Optional[str] = None,
        aspect_ratio: str = "1:1",
        brand_colors: str | None = None,
        reference_image: str | None = None,
        model: Optional[str] = None,
    ) -> str:
        # Backward compatibility for older call pattern:
        # generate_image(style, prompt)
        if prompt is None and style is not None:
            prompt = style
            style = title
            title = "Generated Design"

        style = style or "Minimalist"
        prompt = prompt or ""

        style_map = {
            "Photorealistic": "ultra realistic, 8k, product photography, studio lighting",
            "3D Render": "3d render, blender, cinematic lighting",
            "Minimalist": "flat design, clean, vector",
            "Cyberpunk": "cyberpunk, neon, futuristic",
        }

        # 🎯 Structured marketing prompt
        final_prompt = f"""
        Create a professional {style} marketing design.

        Headline / Title:
        {title}

        Description:
        {prompt}

        Design Requirements:
        - Eye-catching and scroll-stopping
        - High contrast and modern
        - Premium and luxury feel
        - Clear visual hierarchy
        - Strong focal point
        - Clean layout
        - Social media ready
        - Aspect ratio: {aspect_ratio}
        - Do not include platform words like LinkedIn, Twitter, Instagram, Facebook in on-image text unless explicitly requested.

        Brand Guidelines:
        - Use these brand colors: {brand_colors if brand_colors else "modern vibrant palette"}

        Visual Style:
        {style_map.get(style, "")}

        Composition:
        - Balanced layout
        - Proper spacing
        - Focus on product or message
        - Suitable for ads and marketing
        """

        try:
            content = []

            # ✅ Reference image support
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

            selected_model, selected_model_name = AIService._get_google_model(
                model,
                task="image",
            )
            response = await asyncio.to_thread(selected_model.generate_content, content)

            # ✅ Extract image
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if hasattr(part, "inline_data") and part.inline_data:
                        img_base64 = base64.b64encode(
                            part.inline_data.data
                        ).decode("utf-8")

                        return f"data:image/png;base64,{img_base64}"

            raise HTTPException(
                status_code=500,
                detail=f"Image generation failed. No image returned from {selected_model_name}."
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
