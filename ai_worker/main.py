import os
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from diffusers import StableDiffusionPipeline
from io import BytesIO
import base64

app = FastAPI(title="C(AI)DENCE AI Worker")

# Configuration
# Switching to SDXS-512-0.9 for fast CPU inference
MODEL_ID = os.getenv("SD_MODEL_ID", "IDKiro/sdxs-512-0.9") 
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# On Mac with MPS:
if torch.backends.mps.is_available():
    DEVICE = "mps"

print(f"Loading Fast SDXS ({MODEL_ID}) on {DEVICE}...")

# Load Pipeline
try:
    pipe = StableDiffusionPipeline.from_pretrained(MODEL_ID, torch_dtype=torch.float32)
    pipe.to(DEVICE)
    # Enable memory saving optimizations
    if DEVICE == "cpu":
        pipe.enable_attention_slicing()
    print("Model loaded successfully.")
except Exception as e:
    print(f"Failed to load model: {e}")
    pipe = None

class ImageRequest(BaseModel):
    prompt: str
    negative_prompt: str = "low quality, blur"
    steps: int = 1         # SDXS is 1-step model
    guidance_scale: float = 0.0 # SDXS usually works best with 0 guidance (distilled)

@app.get("/health")
def health():
    return {"status": "ok", "device": DEVICE, "model": MODEL_ID}

@app.post("/generate")
def generate(req: ImageRequest):
    if not pipe:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # SDXS is optimized for 512x512
        image = pipe(
            req.prompt, 
            negative_prompt=req.negative_prompt, 
            num_inference_steps=req.steps,
            guidance_scale=req.guidance_scale,
            height=512,
            width=512
        ).images[0]
        
        # Convert to Base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return {"image_base64": img_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
