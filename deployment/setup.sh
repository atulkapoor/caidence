#!/bin/bash

# ==============================================================================
# C(AI)DENCE - System Setup Script (setup.sh)
# ==============================================================================
# Bootstraps a fresh Ubuntu 24 server for the C(AI)DENCE platform.
# Installs dependencies, configures firewall, setup DB, and installs simple services.
#
# Usage: sudo ./setup.sh
# ==============================================================================

set -e

# --- Colors ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[SETUP] $1${NC}"; }
success() { echo -e "${GREEN}[OK] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; }

# --- Environment ---
export DEBIAN_FRONTEND=noninteractive

# --- Check Root ---
if [ "$EUID" -ne 0 ]; then
  error "Please run as root"
  exit 1
fi

APP_DIR="/opt/cadence"
# Robustly find script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/templates"

# --- 1. System Dependencies ---
log "Updating Apt and Installing Dependencies..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw nginx postgresql postgresql-contrib certbot python3-certbot-nginx python3-venv python3-pip make build-essential acl php-cli php-fpm php-pgsql unzip

# Install Node.js (Late Ubuntu versions have newer node, but let's ensure LTS)
if ! command -v node &> /dev/null; then
    log "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
success "Dependencies Installed"

# --- 2. Security (UFW) ---
log "Configuring Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
# ufw enable # Ask user or auto-enable? Safer to auto-enable if SSH is allowed.
# echo "y" | ufw enable
success "Firewall Configured"

# --- 3. Directory Structure ---
log "Creating Directory Structure at $APP_DIR..."
# Create User if not exists to own the app? 
# For simplicity, we run as root/www-data or a dedicated user 'cadence'.
if ! id "cadence" &>/dev/null; then
    useradd -m -s /bin/bash cadence
fi

mkdir -p "$APP_DIR/releases"
mkdir -p "$APP_DIR/storage"
mkdir -p "$APP_DIR/repo"

# Permissions
chown -R cadence:cadence "$APP_DIR"
chmod -R 755 "$APP_DIR"
success "Directories Created"

# --- 4. Database Setup ---
log "Configuring PostgreSQL..."
# Default credentials - CHANGE THESE IN PRODUCTION via ENV
DB_USER="cadence_user"
DB_PASS="cadence_pass"
DB_NAME="cadence_db"

# Check if user exists
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
else
    log "User '$DB_USER' already exists."
fi

# Check if database exists
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
else
    log "Database '$DB_NAME' already exists."
fi
success "Database Configured"

# --- 5. Environment Config ---
if [ ! -f "$APP_DIR/.env" ]; then
    log "Creating default .env file..."
    cat > "$APP_DIR/.env" <<EOF
# Production Environment Variables
DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@localhost/$DB_NAME
SECRET_KEY=$(openssl rand -hex 32)
NEXT_PUBLIC_API_URL=https://dev.caidence.kclub.me/api
ALLOWED_ORIGINS="http://localhost:3000,https://dev.caidence.kclub.me"
FIRST_SUPERUSER=admin@cadence.ai
FIRST_SUPERUSER_PASSWORD=$(openssl rand -hex 12)
# Add other keys...
EOF
    chown cadence:cadence "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    log "Created .env at $APP_DIR/.env - PLEASE EDIT IT!"
fi

# --- 6. Nginx & Systemd ---
log "Installing Systemd Services..."
cp "$TEMPLATE_DIR/cadence-backend.service" /etc/systemd/system/
cp "$TEMPLATE_DIR/cadence-frontend.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable cadence-backend
systemctl enable cadence-frontend

# Determine PHP version for FPM socket
PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
FPM_SOCKET="/run/php/php$PHP_VERSION-fpm.sock"
log "Detected PHP version: $PHP_VERSION. Socket: $FPM_SOCKET"

if [ -f "$TEMPLATE_DIR/nginx.conf" ]; then
    log "Updating Nginx Config with correct PHP socket..."
    sed -i "s|unix:/run/php/php.*-fpm.sock|unix:$FPM_SOCKET|g" "$TEMPLATE_DIR/nginx.conf"
fi

log "Installing Nginx Config..."
cp "$TEMPLATE_DIR/nginx.conf" /etc/nginx/sites-available/cadence
ln -sf /etc/nginx/sites-available/cadence /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx


# --- 6.1 Adminer Setup ---
log "Setting up Adminer..."
mkdir -p /opt/cadence/adminer
if [ ! -f "/opt/cadence/adminer/adminer.php" ]; then
    wget https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1.php -O /opt/cadence/adminer/adminer.php
    chown -R www-data:www-data /opt/cadence/adminer
fi
success "Adminer Installed"

success "Configuration Installed"

# --- 7. Deployment ---
log "Running initial deployment (via update.sh)..."
chmod +x ./update.sh
# ./update.sh # Uncomment to auto-deploy immediately if logic permits

success "Setup Complete!"
echo -e "\n${GREEN}Next Steps:${NC}"
echo "1. Edit $APP_DIR/.env with real secrets."
echo "2. Run './update.sh' to deploy the application."
echo "3. Setup SSL: 'certbot --nginx -d dev.caidence.kclub.me'"
