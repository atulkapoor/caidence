import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "admin@caidence.ai"
PASSWORD = "admin123"
LOG_FILE = "ai_generation_log.md"

def log_to_file(header, content):
    with open(LOG_FILE, "a") as f:
        f.write(f"\n## {header}\n\n")
        f.write(f"{content}\n\n")
        f.write("---\n")

def print_header(title):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")
    with open(LOG_FILE, "a") as f:
        f.write(f"# {title}\n\n")

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg):
    print(f"❌ FAIL: {msg}")

def get_token():
    print("🔑 Logging in...")
    try:
        # Endpoint: /api/v1/auth/login
        res = requests.post(f"{BASE_URL}/auth/login", data={
            "username": EMAIL, "password": PASSWORD
        })
        if res.status_code == 200:
            token = res.json()["access_token"]
            print_pass("Login successful")
            return token
        else:
            print_fail(f"Login failed: {res.text}")
            return None
    except Exception as e:
        print_fail(f"Connection error: {e}")
        return None

def test_chat(headers, title):
    print_header(title)
    try:
        # Realistic User Question
        prompt = "Explain the concept of 'Growth Hacking' to a non-technical marketing intern. Keep it under 200 words."
        payload = {
            "message": prompt,
        }
        print(f"   Request: {prompt}")
        start = time.time()
        res = requests.post(f"{BASE_URL}/chat/message", json=payload, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            response_text = data.get("response", "")
            duration = time.time() - start
            print_pass(f"Chat Response ({duration:.2f}s)")
            log_to_file(f"Chat: {prompt} ({duration:.2f}s)", response_text)
        else:
            print_fail(f"API Error: {res.status_code} - {res.text}")
    except Exception as e:
        print_fail(f"Chat Error: {e}")

def test_marcom(headers, title):
    print_header(title)
    try:
        # Realistic Content Generation
        tool_id = "blog-post-intro"
        inputs = {
            "topic": "The Impact of Generative AI on Graphic Design", 
            "tone": "Visionary and Optimistic"
        }
        payload = {
            "tool_id": tool_id,
            "inputs": inputs
        }
        print(f"   Request: {inputs}")
        start = time.time()
        res = requests.post(f"{BASE_URL}/marcom/generate", json=payload, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            content = data.get("content", "")
            duration = time.time() - start
            
            if "Error" in content or "Offline" in content:
                 print_fail(f"AI Error: {content}")
                 log_to_file(f"Blog Post Intro ({duration:.2f}s)", f"**ERROR**: {content}")
            else:
                 print_pass(f"Content Generated ({duration:.2f}s)")
                 log_to_file(f"Blog Post Intro ({duration:.2f}s)", content)
        else:
            print_fail(f"API Error: {res.status_code} - {res.text}")
    except Exception as e:
        print_fail(f"Marcom Error: {e}")

def test_design(headers, title):
    print_header(title)
    try:
        # Realistic Image Prompt
        prompt = "A sleek, modern smartwatch floating in zero gravity, neon blue lighting, 8k resolution"
        style = "Photorealistic"
        payload = {
            "title": "Smartwatch Ad",
            "style": style,
            "aspect_ratio": "1:1",
            "prompt": prompt,
            "brand_colors": "#00C2FF",
            "reference_image": None
        }
        print(f"   Request: {prompt}")
        start = time.time()
        res = requests.post(f"{BASE_URL}/design/generate", json=payload, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            image_url = data.get("image_url", "")
            duration = time.time() - start
            if image_url.startswith("data:image"):
                print_pass(f"Image Generated ({duration:.2f}s) | Size: {len(image_url)} chars")
                log_to_file(f"Image: {prompt} ({duration:.2f}s)", f"Image generated successfully. (Base64 data hidden for brevity)") 
            else:
                print_fail(f"Invalid Image URL format: {image_url[:50]}...")
        else:
            print_fail(f"API Error: {res.status_code} - {res.text}")
    except Exception as e:
        print_fail(f"Design Error: {e}")

def test_presentation(headers, title):
    print_header(title)
    try:
        # Realistic Topic
        topic = "Quarterly Business Review: Q4 2025"
        payload = {
            "title": topic,
            "source_type": "topic"
        }
        print(f"   Request: {topic}")
        start = time.time()
        res = requests.post(f"{BASE_URL}/presentation/generate", json=payload, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            slides = data.get("slides_json", "")
            duration = time.time() - start
            print_pass(f"Slides Generated ({duration:.2f}s)")
            
            if isinstance(slides, str):
                try:
                    slides = json.loads(slides)
                    formatted_slides = json.dumps(slides, indent=2)
                except:
                    formatted_slides = slides
            else:
                formatted_slides = json.dumps(slides, indent=2)
                
            log_to_file(f"Presentation: {topic} ({duration:.2f}s)", f"```json\n{formatted_slides}\n```")
        else:
            print_fail(f"API Error: {res.status_code} - {res.text}")
    except Exception as e:
        print_fail(f"Presentation Error: {e}")

def test_strategy(headers, title):
    print_header(title)
    try:
        # Realistic Strategy Request
        payload = {
            "role": "Marketing Director",
            "project_type": "Product Launch",
            "objective": "Launch a new eco-friendly coffee brand in San Francisco targeting millennials.",
            "assets": []
        }
        print(f"   Request: {payload['objective']}")
        start = time.time()
        res = requests.post(f"{BASE_URL}/agent/generate", json=payload, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            strategy = data.get("strategy", {})
            duration = time.time() - start
            print_pass(f"Strategy Generated ({duration:.2f}s)")
            formatted_strategy = json.dumps(strategy, indent=2)
            log_to_file(f"Strategy: {payload['project_type']} ({duration:.2f}s)", f"```json\n{formatted_strategy}\n```")
        else:
            print_fail(f"API Error: {res.status_code} - {res.text}")
    except Exception as e:
        print_fail(f"Strategy Error: {e}")

def main():
    # Reset Log File
    with open(LOG_FILE, "w") as f:
        f.write("# AI Generation Log\n\nGenerated by `test_application_ai.py`\n\n")

    token = get_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Chat (Liquid AI)
    test_chat(headers, "Liquid AI Chat")

    # 2. Marcom Content (Liquid AI)
    test_marcom(headers, "Content Studio (Blog)")

    # 3. Design Studio (SDXS)
    test_design(headers, "Design Studio (Image)")

    # 4. Presentation Studio (Liquid AI)
    test_presentation(headers, "Presentation Studio (Slides)")

    # 5. Campaign Strategy (Liquid AI)
    test_strategy(headers, "Campaign Strategy (Agent)")

if __name__ == "__main__":
    main()
