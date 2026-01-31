#!/bin/bash
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Manual Frontend Start Check ===${NC}"

# 1. Check if Deployment Exists
DEPLOY_DIR="/opt/cadence/current/frontend"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${RED}ERROR: Deployment directory not found at $DEPLOY_DIR${NC}"
    echo "This means 'update.sh' was never run successfully."
    echo "Please run: sudo ./deployment/update.sh"
    exit 1
fi

# 2. Stop Service to free port
echo "Stopping background service..."
systemctl stop cadence-frontend

# 3. switch user and Try Start
echo "Switching to 'cadence' user and starting app..."
echo "Press Ctrl+C to exit if it works!"
echo "---------------------------------------------------"

# We run as the cadence user to match production permissions
sudo -u cadence bash -c "cd $DEPLOY_DIR && source ../backend/venv/bin/activate && export $(grep -v '^#' ../.env | xargs) && npm start"

# If sudo fails (e.g. cadence user issue), fallback to root for debug
if [ $? -ne 0 ]; then
    echo -e "\n${RED}Start failed as 'cadence' user. Trying as root to see error...${NC}"
    cd "$DEPLOY_DIR"
    # Load env manually from production location
    set -a; source /opt/cadence/.env; set +a
    npm start
fi
