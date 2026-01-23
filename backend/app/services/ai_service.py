import random
import json
import httpx
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"

class AIService:
    _cached_model = None

    @staticmethod
    async def _get_model() -> str:
        """Dynamically find an available model, preferring mistral or llama3"""
        if AIService._cached_model:
            return AIService._cached_model

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                res.raise_for_status()
                models = [m["name"] for m in res.json().get("models", [])]
                
                # Preference order: User specifically requested qwen3:0.6b
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
        
        return "llama3" # Default fallback

    @staticmethod
    async def _call_ollama(prompt: str, json_mode: bool = False) -> str:
        """Helper to call Ollama API"""
        model = await AIService._get_model()
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
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
                return f"[Ollama Unavailable] Mock response for: {prompt[:20]}..."
            except Exception as e:
                logger.error(f"Ollama error: {e}")
                return f"Error from AI: {e}"

    @staticmethod
    async def generate_content(platform: str, content_type: str, prompt: str) -> str:
        """Generates content using Ollama"""
        full_prompt = (
            f"You are a professional marketing assistant. "
            f"Create a {platform} {content_type} based on this topic: '{prompt}'. "
            f"Make it engaging, professional, and viral. "
            f"Include relevant hashtags. Return ONLY the content."
        )
        return await AIService._call_ollama(full_prompt)

    @staticmethod
    async def generate_image(style: str, prompt: str) -> str:
        """Simulates Image Generation (Ollama is text-only)"""
        # Kept as mock for now unless we switch to Stable Diffusion
        styles = {
            "Photorealistic": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
            "3D Render": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
            "Minimalist": "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85",
            "Cyberpunk": "https://images.unsplash.com/photo-1515630278258-407f66498911"
        }
        return styles.get(style, "https://via.placeholder.com/1024x1024")

    @staticmethod
    async def generate_presentation_slides(source_type: str, title: str) -> str:
        """Generates Slide JSON using Ollama"""
        prompt = (
            f"Create a presentation outline about '{title}'. "
            f"Generate a JSON array of 4-6 slides. "
            f"Each slide must have a 'title' (string) and 'points' (array of strings). "
            f"Example format: [{{ 'title': 'Intro', 'points': ['Point 1'] }}]. "
            f"Respond with ONLY the JSON."
        )

        try:
            json_str = await AIService._call_ollama(prompt, json_mode=True)
            return json_str
            
        except Exception as e:
            logger.error(f"Presentation generation failed: {e}")
            return """
            [
                {"title": "Error generating slides", "points": ["Check server logs"]},
                {"title": "Backup Slide", "points": ["Fallback response"]}
            ]
            """
            


    @staticmethod
    async def generate_campaign_strategy(role: str, project_type: str, objective: str) -> str:
        """Generates a comprehensive marketing strategy as JSON"""
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
            json_str = await AIService._call_ollama(prompt, json_mode=True)
            # Validate JSON if possible, but for MVP we assume AI follows instructions or catch error downstream
            return json_str
            
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
                    {"title": "Launch Announcement", "format": "Press Release", "description": "Official announcement of the new initiative"},
                    {"title": "Behind the Scenes", "format": "Video", "description": "Showcasing the development process"}
                ],
                "strategic_recommendations": [
                    "Focus on thought leadership content",
                    "Engage with micro-influencers in the niche"
                ]
            })



    @staticmethod
    async def generate_marcom_content(tool_id: str, inputs: dict) -> str:
        """Generates content for standard Marcom tools"""
        
        # Simple prompt mapping (or use registry if we sync'd it)
        # For MVP, we reconstruct simple prompts here or trust inputs are descriptive
        
        prompt_text = ""
        
        # Construct dynamic prompt based on inputs
        input_str = ", ".join([f"{k.replace('_', ' ').capitalize()}: {v}" for k, v in inputs.items()])
        
        if tool_id == "facebook-ad-headline":
            prompt_text = f"Generate 5 catchy Facebook Ad headlines. Context: {input_str}"
        elif tool_id == "website-headline":
            prompt_text = f"Generate 5 powerful H1 homepage headlines. Context: {input_str}"
        elif tool_id == "email-subject-line":
            prompt_text = f"Generate 5 high-converting email subject lines. Context: {input_str}"
        elif tool_id == "seo-meta-description":
            prompt_text = f"Write 3 SEO meta descriptions (under 160 chars). Context: {input_str}"
        elif tool_id == "social-post-idea":
            prompt_text = f"Generate 5 engaging social media post ideas. Context: {input_str}"
        elif tool_id == "product-description":
            prompt_text = f"Write a compelling product description (approx 100 words). Context: {input_str}"
        elif tool_id == "blog-post-intro":
            prompt_text = f"Write 3 engaging blog post introductions. Context: {input_str}"
        else:
            prompt_text = f"Act as a professional copywriter. Generate content for {tool_id}. Context: {input_str}"

        full_prompt = f"{prompt_text}. Return ONLY the content in a clear, numbered list format."

        return await AIService._call_ollama(full_prompt)

    @staticmethod
    async def get_system_status() -> dict:
        """Checks Ollama connection and returns active model"""
        model = await AIService._get_model()
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{OLLAMA_BASE_URL}")
                is_up = res.status_code == 200
                return {
                    "ai_engine": "Ollama (Local)",
                    "status": "online" if is_up else "offline",
                    "model": model,
                    "url": OLLAMA_BASE_URL
                }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "ai_engine": "Ollama (Local)", 
                "status": "offline", 
                "model": model, 
                "url": OLLAMA_BASE_URL,
                "error": str(e)
            }

    @staticmethod
    async def chat_completion(messages: list[dict]) -> str:
        """
        Sends a chat history to Ollama and gets a response.
        Messages format: [{"role": "user", "content": "..."}]
        """
        model = await AIService._get_model()
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
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
                # Fallback implementation for testing when Ollama is offline
                last_msg = messages[-1]["content"] if messages else ""
                return f"[Offline Mode] That's a great point about '{last_msg}'. In a real scenario, I would analyze your campaign data to provide a specific recommendation. (Ensure Ollama is running for real AI)."
