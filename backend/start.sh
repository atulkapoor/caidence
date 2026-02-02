#!/bin/sh
set -e

# Wait for DB
echo "Waiting for postgres connection..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Run Migrations
echo "Running alembic migrations..."
alembic upgrade head

# Initialize AI Models (Auto-pull if missing)
echo "Checking AI models..."
python -m app.utils.init_ollama || echo "AI Model initialization failed, continuing anyway..."

# Start App
echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
