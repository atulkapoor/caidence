#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== C(AI)DENCE Docker Deployment ===${NC}"

# 1. Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    # Add user to docker group if not root
    if [ "$USER" != "root" ]; then
        sudo usermod -aG docker $USER
        echo "Docker installed. You may need to logout/login for group changes."
    fi
else
    echo "Docker is already installed."
fi

# 1.1 Stop conflicting services
if systemctl is-active --quiet postgresql; then
    echo "Stopping system PostgreSQL to free up port 5432..."
    sudo systemctl stop postgresql
    sudo systemctl disable postgresql
fi

# 2. Setup Environment
APP_DIR="/var/www/cadence" # Changing to standard var/www or stick to /opt?
# Let's stick to current structure to minimize friction
APP_DIR="/opt/cadence"

echo "Ensuring .env exists..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${RED}Error: $APP_DIR/.env missing! Run setup.sh first.${NC}"
    exit 1
fi

# 3. Prepare Docker Environment
echo "Preparing docker-compose environment..."
# Ensure backend expects .env at specific place or we create a link
# docker-compose.yml looks for ./backend/.env
# We will copy the system .env to there for the build context
cp "$APP_DIR/.env" "backend/.env"

# 4. Build and Run
echo -e "${GREEN}Building and Starting Containers...${NC}"
docker compose down --remove-orphans || true
docker compose up -d --build

echo -e "${GREEN}Deployment Complete!${NC}"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "Adminer: http://localhost:8080"
