FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Torch: using CPU version by default to keep image smaller. 
# In production with GPU, user should modify to install cuda version.
# For Mac users (local), Docker runs linux so it uses CPU unless specific setup.
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir \
    diffusers \
    transformers \
    accelerate \
    fastapi \
    uvicorn \
    pydantic

COPY . .

EXPOSE 8001

CMD ["python", "main.py"]
