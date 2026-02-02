import os
import logging
import httpx
import asyncio
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config from environment
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:0.5b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

async def check_and_pull_model():
    if LLM_PROVIDER != "ollama":
        logger.info(f"LLM_PROVIDER is {LLM_PROVIDER}, skipping Ollama initialization.")
        return

    if not LLM_MODEL:
        logger.warning("LLM_MODEL is not set. Skipping automatic pull.")
        return

    logger.info(f"Checking Ollama model: {LLM_MODEL} at {OLLAMA_BASE_URL}")

    async with httpx.AsyncClient(timeout=300.0) as client:
        # 1. Check if Ollama is reachable
        try:
            resp = await client.get(f"{OLLAMA_BASE_URL}/")
            if resp.status_code != 200:
                 logger.warning(f"Ollama reachable but returned status {resp.status_code}. Proceeding with caution.")
        except httpx.RequestError as e:
             logger.error(f"Could not connect to Ollama at {OLLAMA_BASE_URL}. Is the service running? Error: {e}")
             # We don't exit here because network might be momentary, or maybe we just want to fail soft
             # But if we can't connect, we can't pull.
             return

        # 2. Check if model exists
        try:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
            models = resp.json().get("models", [])
            model_names = [m["name"] for m in models]
            
            # Simple check: Does any model name contain our target? 
            # Ollama model names often have :latest assumed, so exact match checking needs care.
            # Example: qwen2.5:0.5b might match qwen2.5:0.5b
            
            if any(LLM_MODEL in m for m in model_names):
                logger.info(f"Model '{LLM_MODEL}' is already available.")
                return
            
            logger.info(f"Model '{LLM_MODEL}' not found. Pulling now... (This may take a while)")

        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return

        # 3. Pull model
        try:
            # stream=True to avoid timeout on long pulls, though we just wait for it here
            async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/pull", json={"name": LLM_MODEL}) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line: continue
                    # Optional: Parse JSON line for progress "status": "pulling layer ..."
                    # For now just let it proceed.
                    pass
            
            logger.info(f"Successfully pulled model: {LLM_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to pull model '{LLM_MODEL}': {e}")

def main():
    asyncio.run(check_and_pull_model())

if __name__ == "__main__":
    main()
