import requests
import json
import base64
import time
import sys

# Configuration
OLLAMA_URL = "http://localhost:11434"
AI_WORKER_URL = "http://localhost:8001"
TARGET_MODEL = "lfm2.5-thinking"

def print_pass(msg):
    print(f"✅ {msg}")

def print_fail(msg):
    print(f"❌ {msg}")
    return False

def verify_ollama():
    print(f"\n--- Verifying Ollama ({TARGET_MODEL}) ---")
    try:
        # 1. Check Health
        res = requests.get(f"{OLLAMA_URL}")
        if res.status_code == 200:
            print_pass("Ollama Service is UP")
        else:
            return print_fail(f"Ollama returned {res.status_code}")

        # 2. Check Model Availability
        res = requests.get(f"{OLLAMA_URL}/api/tags")
        if res.status_code == 200:
            models = [m['name'] for m in res.json().get('models', [])]
            print(f"   Available Models: {models}")
            
            if TARGET_MODEL not in models and f"{TARGET_MODEL}:latest" not in models:
                print(f"⚠️  Target model '{TARGET_MODEL}' not found.")
                print("   Attempting auto-pull (this might take a while)...")
                
                # Trigger pull
                pull_res = requests.post(f"{OLLAMA_URL}/api/pull", json={"name": TARGET_MODEL}, stream=True)
                if pull_res.status_code == 200:
                    print("   Pulling...", end="", flush=True)
                    # Just read first few chunks to confirm start
                    for _ in zip(range(5), pull_res.iter_lines()):
                        print(".", end="", flush=True)
                    print(" (Assuming pull continues in background)")
                    print_pass(f"Pull Command Issued for {TARGET_MODEL}")
                else:
                    return print_fail(f"Failed to pull model: {pull_res.text}")
            else:
                print_pass(f"Model '{TARGET_MODEL}' is ready")
        
        # 3. Gen Test
        print("   Testing Text Generation...")
        start = time.time()
        gen_res = requests.post(f"{OLLAMA_URL}/api/generate", json={
            "model": TARGET_MODEL,
            "prompt": "Say 'System Operational' in 3 words.",
            "stream": False
        })
        if gen_res.status_code == 200:
            response_text = gen_res.json().get('response', '').strip()
            print_pass(f"Generation Success ({time.time()-start:.2f}s): '{response_text}'")
        else:
            # If 404, likely model not found yet
            print_fail(f"Generation Failed: {gen_res.text}")

    except Exception as e:
        return print_fail(f"Connection Error: {e}")

def verify_ai_worker():
    print(f"\n--- Verifying AI Worker (Stable Diffusion 1.5) ---")
    try:
        # 1. Health
        res = requests.get(f"{AI_WORKER_URL}/health")
        if res.status_code == 200:
            info = res.json()
            print_pass(f"Worker UP | Device: {info.get('device')} | Model: {info.get('model')}")
        else:
            return print_fail(f"Worker returned {res.status_code}")
        
        # 2. Image Gen (Small step count for speed)
        print("   Testing Image Generation (Steps=1)...")
        start = time.time()
        gen_res = requests.post(f"{AI_WORKER_URL}/generate", json={
            "prompt": "A small red cube",
            "steps": 1 # Very fast for test
        })
        
        if gen_res.status_code == 200:
            data = gen_res.json()
            if "image_base64" in data:
                img_len = len(data['image_base64'])
                print_pass(f"Generation Success ({time.time()-start:.2f}s) | Image Size: {img_len} chars")
            else:
                print_fail("No image data in response")
        else:
            print_fail(f"Generation Connection Failed: {gen_res.text}")

    except Exception as e:
        return print_fail(f"Connection Error: {e}")

if __name__ == "__main__":
    print("Starting AI Infrastructure Verification...")
    verify_ollama()
    verify_ai_worker()
    print("\nDone.")
