# C(AI)DENCE Deployment Guide

This guide outlines the steps to deploy the recent `Design Studio` image loading fixes (and other changes) to your production/staging server.

## Prerequisites

*   Docker and Docker Compose installed on the server.
*   SSH access to the server.
*   The repository is cloned on the server (e.g., at `/opt/cadence` or `~/caidence`).

## Deployment Steps

### 1. Commit and Push Changes (Local Machine)

First, ensure your local changes (including the fixes to `backend/app/api/endpoints/design.py` and potentially `frontend/package-lock.json` if npm install ran) are committed and pushed to your git repository.

```bash
# 1. Check status
git status

# 2. Add changes
git add backend/app/api/endpoints/design.py
# Add any other modified files as needed

# 3. Commit
git commit -m "Fix: Design Studio image loading issue (Backend API route & Pydantic schema)"

# 4. Push to remote
git push origin main
```

### 2. Update Server

Connect to your server and verify the deployment.

```bash
# 1. SSH into the server
ssh user@your-server-ip

# 2. Navigate to project directory
cd /path/to/caidence  # e.g., cd /opt/cadence

# 3. Pull latest changes
git pull origin main
```

### 3. Rebuild and Restart Containers

Since we modified the backend code and it's running in Docker, we need to rebuild the containers to apply the changes.

**Option A: Using the Deployment Script (Recommended)**

If you have the `deployment/` scripts on the server:

```bash
cd deployment
chmod +x deploy_docker.sh
./deploy_docker.sh
```

**Option B: Manual Docker Compose**

If you prefer running commands manually:

```bash
# 1. Rebuild and restart backend and frontend
docker-compose up -d --build backend frontend

# 2. Verify containers are running
docker-compose ps
```

### 4. Verification

After the deployment completes:

1.  Open your browser and navigate to your production URL.
2.  Go to the **Design Studio**.
3.  Open the **Design Library** tab.
4.  Verify that images are loading correctly and you no longer see the "No designs found" error or broken images.

## Troubleshooting

*   **Images still broken?**
    *   Clear your browser cache.
    *   Run `docker-compose logs -f backend` to check for any server-side errors.
    *   Ensure the `API_BASE_URL` in `frontend/.env` (or env vars) matches your production domain/proxy setup.

*   **"No such file or directory" during build?**
    *   Ensure you are in the root directory where `docker-compose.yml` resides.
