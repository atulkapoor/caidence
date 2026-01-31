#!/bin/bash
# deep_diagnose.sh
# Comprehensive system check for C(AI)DENCE deployment

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

heading() { echo -e "\n${YELLOW}=== $1 ===${NC}"; }
ok() { echo -e "${GREEN}[OK] $1${NC}"; }
fail() { echo -e "${RED}[FAIL] $1${NC}"; }

echo "Starting Deep Diagnostic at $(date)..."

# 1. Permission Checks
heading "1. Permission & User Checks"
if id "cadence" &>/dev/null; then ok "User 'cadence' exists"; else fail "User 'cadence' MISSING"; fi

# Check .env permissions
ENV_FILE="/opt/cadence/.env"
if [ -f "$ENV_FILE" ]; then
    ok ".env file exists"
    # Can cadence read it?
    if sudo -u cadence test -r "$ENV_FILE"; then
        ok "User 'cadence' can read .env"
    else
        fail "User 'cadence' CANNOT read .env (Permission Denied)"
        ls -l "$ENV_FILE"
    fi
else
    fail ".env file NOT FOUND at $ENV_FILE"
fi

# 2. Directory & Build Checks
heading "2. Build Artifacts"
CURRENT_DIR="/opt/cadence/current"
FRONTEND_DIR="$CURRENT_DIR/frontend"

if [ -L "$CURRENT_DIR" ]; then ok "'current' symlink exists"; else fail "'current' symlink missing"; fi
if [ -d "$FRONTEND_DIR" ]; then ok "Frontend directory exists"; else fail "Frontend dir missing"; fi

# Check specific Next.js build
if [ -d "$FRONTEND_DIR/.next" ]; then
    ok "Next.js build directory (.next) exists"
    # Check if not empty
    if [ "$(ls -A $FRONTEND_DIR/.next)" ]; then
        ok ".next directory is not empty"
    else
        fail ".next directory is EMPTY (Build Failed?)"
    fi
else
    fail ".next directory MISSING (Build Failed?)"
fi

# 3. Node/NPM Paths
heading "3. Environment Paths"
NPM_PATH=$(which npm)
echo "NPM is at: $NPM_PATH"
SERVICE_EXEC=$(grep "ExecStart" /etc/systemd/system/cadence-frontend.service | cut -d= -f2)
echo "Service uses: $SERVICE_EXEC"

# 4. Port Checks
heading "4. Network Status"
if ss -tuln | grep ":3000" >/dev/null; then
    ok "Port 3000 is LISTENING"
    pid=$(lsof -t -i:3000 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Process on 3000: $(ps -p $pid -o comm=)"
    fi
else
    fail "Port 3000 is NOT LISTENING (Frontend not running)"
fi

# 5. Service Logs (Dump recent errors)
heading "5. Recent Service Errors"
full_logs=$(journalctl -u cadence-frontend --no-pager -n 50)

if echo "$full_logs" | grep -q "Error:"; then
    echo -e "${RED}Found Traceback/Error in logs:${NC}"
    echo "$full_logs" | grep -C 5 "Error:" | tail -n 20
elif echo "$full_logs" | grep -q "sh: 1:"; then
    echo -e "${RED}Found Shell Error:${NC}"
    echo "$full_logs" | grep "sh: 1:"
else
    echo "No obvious 'Error:' keyword in last 50 lines. Dumping last 10:"
    echo "$full_logs" | tail -n 10
fi

echo -e "\n${YELLOW}Diagnostic Complete.${NC}"
