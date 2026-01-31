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

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["./start.sh"]
