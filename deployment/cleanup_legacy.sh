#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Cleaning Legacy Systemd Deployment ===${NC}"

# 1. Stop and Disable Services
echo "Stopping legacy services..."
services=("cadence-backend" "cadence-frontend")

for service in "${services[@]}"; do
    if systemctl list-units --full -all | grep -Fq "$service.service"; then
        echo "Stopping $service..."
        sudo systemctl stop "$service" || true
        sudo systemctl disable "$service" || true
        
        echo "Removing unit file..."
        sudo rm -f "/etc/systemd/system/$service.service"
    else
        echo "$service not found, skipping."
    fi
done

# 2. Reload Daemons
sudo systemctl daemon-reload
sudo systemctl reset-failed

# 3. Clean Filesystem
# We keep .env and storage, but remove releases
echo "Cleaning old release files..."
if [ -d "/opt/cadence/releases" ]; then
    echo "Removing /opt/cadence/releases..."
    sudo rm -rf "/opt/cadence/releases"
fi

if [ -L "/opt/cadence/current" ]; then
    echo "Removing symlink /opt/cadence/current..."
    sudo unlink "/opt/cadence/current"
fi

echo -e "${GREEN}Legacy deployment cleaned up!${NC}"
echo "Ports 3000 and 8000 are now free for Docker."
