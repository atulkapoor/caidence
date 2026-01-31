FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# libpq-dev and gcc are needed for psycopg2 (postgres driver) compilation
# netcat-openbsd is useful for checking if db is ready
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
# Use 0.0.0.0 to bind to all interfaces inside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
