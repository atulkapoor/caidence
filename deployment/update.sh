#!/bin/bash

# ==============================================================================
# C(AI)DENCE - Atomic Deployment Script (update.sh)
# ==============================================================================
# This script handles the atomic deployment of the application using a
# Symlink/Release strategy. It ensures zero-downtime updates and easy rollback.
#
# Usage: ./update.sh [version_tag]
# ==============================================================================

set -e

# --- Configuration ---
APP_DIR="/opt/cadence"
RELEASES_DIR="$APP_DIR/releases"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
NEW_RELEASE_DIR="$RELEASES_DIR/$TIMESTAMP"
CURRENT_SYMLINK="$APP_DIR/current"
REPO_DIR="$APP_DIR/repo"
# Load environment if exists
if [ -f "$APP_DIR/.env" ]; then
    export $(grep -v '^#' "$APP_DIR/.env" | xargs)
fi

# --- Logging Helpers ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}"; }

# --- Error Handling & Rollback ---
cleanup_and_fail() {
    log_error "Deployment failed! Triggering rollback..."
    
    # Removes the incomplete release directory
    if [ -d "$NEW_RELEASE_DIR" ]; then
        log_warn "Removing failed release directory: $NEW_RELEASE_DIR"
        rm -rf "$NEW_RELEASE_DIR"
    fi

    # Restart services to ensure stable state (in case they stopped)
    log_info "Restarting current services..."
    systemctl restart cadence-backend cadence-frontend || true

    log_error "Rollback complete. System state restored."
    exit 1
}

# Trap errors
trap 'cleanup_and_fail' ERR

# --- Main Deployment Flow ---
log_info "Starting deployment: $TIMESTAMP"

# 1. Prepare Release Directory
log_info "Creating release directory..."
mkdir -p "$NEW_RELEASE_DIR"

# 2. Get Latest Code
log_info "Fetching latest code..."

# Strategy: 
# 1. First, check if the script is running FROM a valid source location (e.g. user cloned repo and ran ./deployment/update.sh).
# 2. If valid, use THAT as the source.
# 3. Else, fall back to the config REPO_DIR (e.g. /opt/cadence/repo).

SCRIPT_PATH=$(realpath "$0")
SCRIPT_DIR=$(dirname "$SCRIPT_PATH")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
SOURCE_DIR=""

if [ -d "$PROJECT_ROOT/backend" ] && [ -d "$PROJECT_ROOT/frontend" ]; then
    log_info "Detected valid project structure at $PROJECT_ROOT."
    SOURCE_DIR="$PROJECT_ROOT"
elif [ -d "$REPO_DIR/.git" ]; then
    log_info "Git repo detected at $REPO_DIR. Pulling changes..."
    cd "$REPO_DIR"
    git fetch --all
    git reset --hard origin/main
    SOURCE_DIR="$REPO_DIR"
elif [ -d "$REPO_DIR" ] && [ "$(ls -A $REPO_DIR)" ]; then
    log_info "Local source directory detected at $REPO_DIR (No Git)."
    SOURCE_DIR="$REPO_DIR"
else
    log_error "Could not determine source code location."
    log_error "- Checked $PROJECT_ROOT (Script location) -> Invalid"
    log_error "- Checked $REPO_DIR (Configured Repo Dir) -> Invalid or Empty"
    exit 1
fi


# Sync to release dir
log_info "Copying files from $SOURCE_DIR to $NEW_RELEASE_DIR..."
# Ensure we copy contents, not the folder itself (trailing slash)
rsync -av --exclude '.git' --exclude 'node_modules' --exclude 'venv' --exclude 'storage' "$SOURCE_DIR/" "$NEW_RELEASE_DIR/"

# 3. Setup Backend
log_info "Building Backend..."
# Check if backend dir exists
if [ ! -d "$NEW_RELEASE_DIR/backend" ]; then
    log_error "Backend directory not found in $NEW_RELEASE_DIR! (Source was: $SOURCE_DIR)"
    ls -la "$NEW_RELEASE_DIR"
    exit 1
fi
cd "$NEW_RELEASE_DIR/backend"

# Create venv
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# 4. setup Frontend
log_info "Building Frontend..."
cd "$NEW_RELEASE_DIR/frontend"

# Install deps & Build
npm ci --legacy-peer-deps
npm run build

# 5. Database Migrations
log_info "Running Database Migrations..."
cd "$NEW_RELEASE_DIR/backend"
# Link .env BEFORE migrations so Alembic settings can read it directly
ln -sf "$APP_DIR/.env" "$NEW_RELEASE_DIR/backend/.env"

# Ensure DB url is available
if [ -z "$DATABASE_URL" ]; then
    log_warn "DATABASE_URL not found. Skipping migrations (or fail if critical)."
else
    # Run alembic
    source venv/bin/activate
    alembic upgrade head
fi

# 6. Atomic Switch
log_info "Switching Symlink..."
# Link .env
ln -sf "$APP_DIR/.env" "$NEW_RELEASE_DIR/backend/.env"
ln -sf "$APP_DIR/.env" "$NEW_RELEASE_DIR/frontend/.env.local" # Next.js uses .env.local

# Atomic symlink swap
ln -sfn "$NEW_RELEASE_DIR" "$CURRENT_SYMLINK"

# 7. Service Update
log_info "Reloading Systemd Services..."
systemctl daemon-reload
systemctl restart cadence-backend
systemctl restart cadence-frontend

# 8. Verification
log_info "Verifying Deployment..."
# Simple health checks
sleep 5 # Wait for services to spin up
if curl --fail --silent --max-time 5 http://localhost:8000/health > /dev/null; then
    log_info "Backend is Healthy."
else
    log_error "Backend Health Check Failed!"
    false # Trigger trap
fi

if curl --fail --silent --max-time 5 http://localhost:3000 > /dev/null; then
    log_info "Frontend is Healthy."
else
    log_error "Frontend Health Check Failed!"
    false # Trigger trap
fi

# 9. Cleanup Old Releases
log_info "Cleaning up old releases (keeping last 5)..."
cd "$RELEASES_DIR"
ls -dt * | tail -n +6 | xargs -r rm -rf

log_info "Deployment Successful! Current Release: $TIMESTAMP"
