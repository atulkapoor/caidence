#!/bin/bash
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Debugging Deployment ===${NC}"

echo -e "\n${GREEN}1. Service Status${NC}"
systemctl status cadence-frontend --no-pager || echo "Frontend Service NOT FOUND"
systemctl status cadence-backend --no-pager || echo "Backend Service NOT FOUND"

echo -e "\n${GREEN}2. Local Connectivity Check${NC}"
echo "Checking Backend (8000)..."
if curl -s http://127.0.0.1:8000/health | grep "status"; then
    echo "Backend: OK"
else
    echo -e "${RED}Backend: FAIL${NC}"
fi

echo "Checking Frontend (3000)..."
if curl -Is http://127.0.0.1:3000 | head -n 1; then
    echo "Frontend: OK (Running)"
else
    echo -e "${RED}Frontend: FAIL (Not reachable)${NC}"
fi

echo -e "\n${GREEN}3. Frontend Logs (Last 20 lines)${NC}"
journalctl -u cadence-frontend --no-pager -n 20

echo -e "\n${GREEN}4. Nginx Error Log (Last 10 lines)${NC}"
tail -n 10 /var/log/nginx/error.log
