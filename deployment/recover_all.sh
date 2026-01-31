#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== C(AI)DENCE Master Recovery Script ===${NC}"

# 1. Location Check
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Checking project structure at $PROJECT_ROOT..."
if [ ! -d "$PROJECT_ROOT/backend" ] || [ ! -d "$PROJECT_ROOT/frontend" ]; then
    echo -e "${RED}ERROR: Cannot find source code!${NC}"
    echo "This script must be inside 'deployment/' folder within the project."
    exit 1
fi

echo -e "${GREEN}step 1: Restarting Nginx (Fix Connection Refused)${NC}"
if ! systemctl restart nginx; then
    echo -e "${RED}Nginx failed to start! Attempting re-install/fix...${NC}"
    apt-get install -y --reinstall nginx
    systemctl enable nginx
    systemctl start nginx
fi

echo -e "${GREEN}Step 2: Checking SSL${NC}"
if ! grep -q "ssl_certificate" /etc/nginx/sites-enabled/cadence 2>/dev/null; then
    echo "SSL missing. Running fix_ssl.sh..."
    chmod +x "$SCRIPT_DIR/fix_ssl.sh"
    "$SCRIPT_DIR/fix_ssl.sh"
else
    echo "SSL seems configured."
fi

echo -e "${GREEN}Step 3: Re-Deploying Application${NC}"
chmod +x "$SCRIPT_DIR/update.sh"
"$SCRIPT_DIR/update.sh"

echo -e "\n${GREEN}=== Recovery Complete ===${NC}"
echo "Please wait 10 seconds for services to settle, then check:"
echo "https://dev.caidence.kclub.me"
