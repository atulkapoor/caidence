# Deployment Guide

This guide details how to deploy the C(AI)DENCE platform on a fresh Ubuntu 24.04 LTS server.

## Defaults
- **App Directory:** `/opt/cadence`
- **User:** `cadence`
- **Database:** PostgreSQL (`cadence_db`)
- **Web Server:** Nginx (Reverse Proxy)
- **SSL:** Certbot (Let's Encrypt)
- **Ports:** 80/443 (Public), 3000 (Frontend), 8000 (Backend)

## 1. Prerequisites
- A fresh **Ubuntu 24.04** server.
- Root access (SSH key recommended).
- A domain name pointing to the server IP (required for SSL).

## 2. Initial Setup
1.  **Clone or Copy** the repository to the server (e.g., in `/tmp` or `/root`).
2.  **Run the Setup Script**:
    ```bash
    cd deployment
    sudo chmod +x setup.sh update.sh
    sudo ./setup.sh
    ```
    This will:
    - Install system dependencies (Nginx, Python, Node, Postgres).
    - Create the `cadence` user and directory structure at `/opt/cadence`.
    - Setup the database and firewall.
    - Install Systemd services and Nginx config.
    - Create a default `.env` file.

## 3. Configuration
1.  **Edit Environment Variables**:
    Open `/opt/cadence/.env` and update secrets:
    ```bash
    sudo nano /opt/cadence/.env
    ```
    *Update `DATABASE_URL`, `SECRET_KEY`, and `NEXT_PUBLIC_API_URL`.*

2.  **Setup SSL (HTTPS)**:
    Run Certbot to secure your domain:
    ```bash
    sudo certbot --nginx -d your-domain.com
    ```

## 4. First Deployment
Deploy the application code:
```bash
sudo /opt/cadence/repo/deployment/update.sh
```
*(Note: You might need to copy your code to `/opt/cadence/repo` first if not using git, or configure the `REPO_DIR` variable in `update.sh`)*.

## 5. Updates & Rollbacks
The system uses an atomic **Blue/Green** deployment strategy via symlinks.

### To Update:
Run `update.sh` with the new code available in the repo:
```bash
sudo ./deployment/update.sh
```
This accepts a version tag (optional) but defaults to a timestamp.
- **Success:** Traffic is switched to the new code instantly.
- **Failure:** The script auto-rolls back, keeping the old code active.

### Manual Rollback:
If you need to manually revert to the previous release:
1.  Check releases: `ls -l /opt/cadence/releases`
2.  Update symlink:
    ```bash
    ln -sfn /opt/cadence/releases/<previous-timestamp> /opt/cadence/current
    systemctl restart cadence-backend cadence-frontend
    ```
