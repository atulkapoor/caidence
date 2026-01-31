#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="dev.caidence.kclub.me"
EMAIL="admin@caidence.ai"

echo -e "${GREEN}Starting SSL Recovery for $DOMAIN...${NC}"

# 1. Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo -e "${RED}Nginx is not running. Restarting...${NC}"
    systemctl restart nginx
fi

# 2. Run Certbot (Non-interactive)
# -n: Non-interactive
# --nginx: Use Nginx plugin
# --agree-tos: Agree to terms
# --redirect: Force HTTP->HTTPS redirect
# -d: Domain
# -m: Email
echo "Running Certbot..."
if certbot --nginx -d "$DOMAIN" -n --agree-tos -m "$EMAIL" --redirect; then
    echo -e "${GREEN}SSL Certificate installed successfully!${NC}"
else
    echo -e "${RED}Certbot failed. Attempting to install certbot if missing...${NC}"
    apt-get install -y certbot python3-certbot-nginx
    
    echo "Retrying Certbot..."
    certbot --nginx -d "$DOMAIN" -n --agree-tos -m "$EMAIL" --redirect
fi

# 3. Reload Nginx
echo "Reloading Nginx..."
systemctl reload nginx

# 4. Verify Port 443
if ss -tuln | grep -q ":443"; then
    echo -e "${GREEN}SUCCESS: Server is listening on SSL (Port 443).${NC}"
    echo -e "You can now access: https://$DOMAIN"
else
    echo -e "${RED}ERROR: Port 443 is NOT open. Check firewall/logs.${NC}"
    ufw allow 'Nginx Full'
    ufw reload
fi
