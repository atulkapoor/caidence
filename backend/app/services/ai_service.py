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
import os
import json
import random
import logging
import google.generativeai as genai
from typing import Optional, List, Dict
from dotenv import load_dotenv
from fastapi import HTTPException


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
AI_WORKER_URL = os.getenv("AI_WORKER_URL", "http://ai_worker:8001")

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
        if "qwen" in compact:
            return "qwen"
        if "sdxs" in compact or "diffusion" in compact or "idkiro" in compact:
            return "diffusion"
        return "unknown"

    @staticmethod
    def _resolve_ollama_model(model: Optional[str]) -> str:
        normalized = (model or "").strip()
        if not normalized:
            return "qwen2.5:0.5b"
        model_key = AIService._normalize_model_name(normalized)
        if model_key == "qwen" and normalized.lower() in {"qwen", "qwen2.5"}:
            return "qwen2.5:0.5b"
        return normalized

    @staticmethod
    def get_effective_content_model_name(model: Optional[str]) -> str:
        if AIService._normalize_model_name(model) == "qwen":
            return AIService._resolve_ollama_model(model)
        return "Gemini"

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
    async def _call_ollama_model(
        prompt: str,
        model: str,
        *,
        system_prompt: Optional[str] = None,
        json_mode: bool = False,
    ) -> str:
        final_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                payload = {
                    "model": model,
                    "prompt": final_prompt,
                    "stream": False,
                }
                if json_mode:
                    payload["format"] = "json"
                response = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except Exception as e:
            logger.error(f"Ollama model '{model}' error: {e}")
            raise

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
        requested_model_name = (model or "").strip()
        model_key = AIService._normalize_model_name(model)

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

        if model_key == "qwen":
            qwen_model = AIService._resolve_ollama_model(requested_model_name)
            draft_text = AIService._clean_text_output(
                await AIService._call_ollama_model(full_prompt, qwen_model)
            )
        else:
            selected_model, _ = AIService._get_google_model(
                model,
                task="content",
            )
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
        if model_key == "qwen":
            qwen_model = AIService._resolve_ollama_model(requested_model_name)
            proofed_text = AIService._clean_text_output(
                await AIService._call_ollama_model(proof_prompt, qwen_model)
            )
            final_text = proofed_text or draft_text
            return final_text or "[Qwen2.5] No response generated."
        selected_model, selected_model_name = AIService._get_google_model(
            model,
            task="content",
        )
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
        model_key = AIService._normalize_model_name(model)

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
        if model_key == "qwen":
            qwen_model = AIService._resolve_ollama_model(model)
            text = AIService._clean_text_output(
                await AIService._call_ollama_model(adapt_prompt, qwen_model)
            )
            return text or "[Qwen2.5] No response generated."

        selected_model, selected_model_name = AIService._get_google_model(
            model,
            task="content",
        )
        response = await asyncio.to_thread(selected_model.generate_content, adapt_prompt)
        text = AIService._clean_text_output(response.text or "")
        return text or f"[{selected_model_name}] No response generated."

    @staticmethod
    async def enhance_text(
        text: str,
        model: Optional[str] = None,
    ) -> str:
        model_key = AIService._normalize_model_name(model)
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
        if model_key == "qwen":
            qwen_model = AIService._resolve_ollama_model(model)
            rewritten = AIService._clean_text_output(
                await AIService._call_ollama_model(enhance_prompt, qwen_model)
            )
            return rewritten or "[Qwen2.5] No response generated."

        selected_model, selected_model_name = AIService._get_google_model(
            model,
            task="content",
        )
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
        return_meta: bool = False,
    ) -> str | Dict[str, object]:
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
        Create a professional {style} marketing visual for social media.
        Use the campaign details only for visual direction, not as literal text:
        - Campaign context: {title}
        - Brief: {prompt}

        Design Requirements:
        - Eye-catching and scroll-stopping
        - High contrast and modern
        - Premium and luxury feel
        - Clear visual hierarchy
        - Strong focal point
        - Clean layout
        - Social media ready
        - Aspect ratio: {aspect_ratio}
        - No on-image text Until unless explicitly requested/tell to put text on Image.
        - No logos, watermarks, UI chrome, or platform labels

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

        async def _generate_via_diffusion_worker() -> Dict[str, object]:
            try:
                async with httpx.AsyncClient(timeout=180.0) as client:
                    res = await client.post(
                        f"{AI_WORKER_URL}/generate",
                        json={
                            "prompt": final_prompt,
                            "negative_prompt": "low quality, blur, distorted",
                            "steps": 1,
                            "guidance_scale": 0.0,
                        },
                    )
                    res.raise_for_status()
                    payload = res.json()
                    image_base64 = payload.get("image_base64")
                    if not image_base64:
                        raise RuntimeError("Diffusion worker returned no image")
                    return {
                        "image_url": f"data:image/png;base64,{image_base64}",
                        "image_model_used": "IDKiro/sdxs-512-0.9",
                        "image_fallback_used": True,
                    }
            except Exception as worker_error:
                logger.error(f"Diffusion worker error: {worker_error}")
                raise HTTPException(
                    status_code=500,
                    detail="Image generation failed on diffusion worker.",
                )

        requested_model_key = AIService._normalize_model_name(model)
        if requested_model_key == "diffusion":
            diffusion_payload = await _generate_via_diffusion_worker()
            diffusion_payload["image_fallback_used"] = False
            return diffusion_payload if return_meta else str(diffusion_payload["image_url"])

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

            selected_model, _ = AIService._get_google_model(
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

                        payload = {
                            "image_url": f"data:image/png;base64,{img_base64}",
                            "image_model_used": "NanoBanana",
                            "image_fallback_used": False,
                        }
                        return payload if return_meta else str(payload["image_url"])

            logger.error("Nano banana returned no image payload.")
            fallback_payload = await _generate_via_diffusion_worker()
            return fallback_payload if return_meta else str(fallback_payload["image_url"])

        except Exception as e:
            logger.error(f"Nano banana error: {e}. Falling back to diffusion worker.")
            fallback_payload = await _generate_via_diffusion_worker()
            return fallback_payload if return_meta else str(fallback_payload["image_url"])
            
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
    async def chat_completion(
        messages: List[dict],
        model: Optional[str] = None,
        return_meta: bool = False,
    ) -> str | Dict[str, str]:
        """
        Sends a chat history to the LLM.
        Messages format: [{"role": "user", "content": "..."}]
        """
        def _result(text: str, model_used: str) -> str | Dict[str, str]:
            cleaned_text = AIService._clean_text_output(text)
            if return_meta:
                return {
                    "text": cleaned_text,
                    "model_used": model_used,
                }
            return cleaned_text

        model_key = AIService._normalize_model_name(model)

        # Explicit Qwen route (Ollama chat)
        if model_key == "qwen":
            qwen_model = AIService._resolve_ollama_model(model)
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    payload = {
                        "model": qwen_model,
                        "messages": messages,
                        "stream": False,
                    }
                    response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
                    response.raise_for_status()
                    result = response.json()
                    text = result.get("message", {}).get("content", "")
                    return _result(text, qwen_model)
            except Exception as e:
                logger.error(f"Qwen chat completion failed for model '{qwen_model}': {e}")
                # Continue to generic fallback below.

        # Explicit Gemini route
        if model_key == "gemini":
            try:
                transcript_lines: List[str] = []
                for msg in messages:
                    role = (msg.get("role") or "user").strip().lower()
                    content = (msg.get("content") or "").strip()
                    if not content:
                        continue
                    if role == "system":
                        transcript_lines.append(f"System: {content}")
                    elif role == "assistant":
                        transcript_lines.append(f"Assistant: {content}")
                    else:
                        transcript_lines.append(f"User: {content}")

                prompt = (
                    "You are C(AI)DENCE, an expert AI Marketing Assistant. "
                    "Answer the user's latest message using relevant prior context. "
                    "Be concise, practical, and professional.\n\n"
                    "Conversation:\n"
                    + "\n".join(transcript_lines)
                    + "\n\nAssistant:"
                )
                selected_model, _ = AIService._get_google_model("Gemini", task="content")
                response = await asyncio.to_thread(selected_model.generate_content, prompt)
                return _result(response.text or "", "Gemini")
            except Exception as e:
                logger.error(f"Gemini chat completion failed: {e}")
                # Continue to generic fallback below.

        # Auto-discover Ollama model if needed
        if LLM_PROVIDER == "ollama" and not AIService._cached_model:
            await AIService._discover_ollama_model()
        
        default_model = AIService._get_model_name()
        
        # Try LiteLLM for cloud providers
        if LITELLM_AVAILABLE and LLM_PROVIDER != "ollama":
            try:
                model_name = default_model
                if LLM_PROVIDER == "anthropic":
                    model_name = f"anthropic/{default_model}"
                elif LLM_PROVIDER == "gemini":
                    model_name = f"gemini/{default_model}" if not default_model.startswith("gemini/") else default_model
                
                response = await acompletion(model=model_name, messages=messages)
                return _result(response.choices[0].message.content, model_name)
            except Exception as e:
                logger.error(f"LiteLLM chat error: {e}")
        
        # Direct Ollama chat API
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                payload = {
                    "model": default_model,
                    "messages": messages,
                    "stream": False,
                }
                response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
                response.raise_for_status()
                result = response.json()
                return _result(result.get("message", {}).get("content", ""), default_model)
        except Exception as e:
            logger.error(f"Chat completion failed: {e}")
            last_msg = messages[-1]["content"] if messages else ""
            return _result(
                f"[Offline Mode] Great point about '{last_msg[:30]}'. Ensure your LLM provider is configured.",
                "offline-fallback",
            )
