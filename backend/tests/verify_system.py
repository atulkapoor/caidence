
import asyncio
import httpx
import uuid
import sys
import sqlite3
import os
from datetime import datetime

BASE_URL = "http://127.0.0.1:8080/api/v1"
DB_PATH = "../sql_app.db" # Relative to backend/tests/

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

REPORT_LINES = []

def log(message):
    print(message)
    REPORT_LINES.append(message)

def print_result(test_name, success, details=""):
    symbol = "✅" if success else "❌"
    color = GREEN if success else RED
    clean_msg = f"[{'PASS' if success else 'FAIL'}] {test_name} {details}"
    log(f"{color}{symbol} {test_name}{RESET} {details}")
    if not success:
        log(f"{RED}   Error: {details}{RESET}")

def approve_user_in_db(email):
    try:
        # absolute path hack
        db_path = os.path.join(os.path.dirname(__file__), "..", "sql_app.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # Approve AND assign to default organization (ID 1)
        cursor.execute("UPDATE users SET is_approved = 1, organization_id = 1 WHERE email = ?", (email,))
        conn.commit()
        conn.close()
        log(f"   ℹ️  Manually approved user {email} and assigned to Org ID 1 in DB.")
        return True
    except Exception as e:
        log(f"   ⚠️  Failed to approve/update user in DB: {e}")
        return False

async def run_verification():
    log(f"# C(AI)DENCE System Verification Report")
    log(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    log("## Execution Log")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Health Check
        try:
            resp = await client.get(f"http://127.0.0.1:8080/health")
            if resp.status_code == 200:
                print_result("System Health", True)
            else:
                print_result("System Health", False, f"Status: {resp.status_code}")
        except Exception as e:
             print_result("System Health", False, f"Connection Failed: {e}")
             return

        # Generate unique user
        unique_id = str(uuid.uuid4())[:8]
        email = f"agent_{unique_id}@test.com"
        password = "testpassword123"
        
        # 2. Register
        reg_data = {
            "email": email,
            "password": password,
            "full_name": f"Test Agent {unique_id}",
            "role": "agency_admin"
        }
        resp = await client.post(f"{BASE_URL}/auth/register", json=reg_data)
        if resp.status_code == 200:
            print_result("User Registration", True, f"({email})")
        else:
            print_result("User Registration", False, f"- {resp.text}")
            return

        # 2b. Approve User
        approve_user_in_db(email)
        
        # 3. Login
        login_data = {"username": email, "password": password}
        resp = await client.post(f"{BASE_URL}/auth/login", data=login_data)
        
        token = None
        if resp.status_code == 200:
             print_result("User Login", True)
             token = resp.json()["access_token"]
        else:
             print_result("User Login", False, f"- {resp.text}")
             return

        auth_headers = {"Authorization": f"Bearer {token}"}

        # 4. Create Organization
        resp = await client.get(f"{BASE_URL}/auth/me", headers=auth_headers)
        if resp.status_code == 404:
            resp = await client.get(f"{BASE_URL}/users/me", headers=auth_headers)
            
        if resp.status_code == 200:
            me = resp.json()
            org_id = me.get("organization_id")
        else:
            print_result("Fetch Profile", False, f"- {resp.status_code}")
            return

        if not org_id:
            org_slug = f"agency-{unique_id}"
            org_data = {
                "name": f"Agency {unique_id}", 
                "type": "agency",
                "slug": org_slug
            }
            resp = await client.post(f"{BASE_URL}/organizations/", json=org_data, headers=auth_headers)
            if resp.status_code == 200:
                org_id = resp.json()["id"]
                print_result("Create Organization", True, f"ID: {org_id}")
            else:
                 print_result("Create Organization", False, f"- {resp.text}")

        # 5. Create Brand
        brand_name = f"Brand {unique_id}"
        brand_data = {
            "name": brand_name,
            "industry": "Technology",
            "organization_id": org_id 
        }
        resp = await client.post(f"{BASE_URL}/brands/", json=brand_data, headers=auth_headers)
        brand_id = None
        if resp.status_code == 200:
            brand_id = resp.json()["id"]
            print_result("Create Brand", True, f"ID: {brand_id}")
        else:
            print_result("Create Brand", False, f"- {resp.text}")

        # 6. List Brands
        resp = await client.get(f"{BASE_URL}/brands/", headers=auth_headers)
        if resp.status_code == 200:
            brands = resp.json()
            found = any(b["id"] == brand_id for b in brands)
            if found:
                print_result("List Brands", True, f"Found {brand_name}")
            else:
                print_result("List Brands", False, "Created brand not found in list")
        else:
            print_result("List Brands", False, f"- {resp.text}")

    # Write Report
    with open("verification_report.md", "w") as f:
        import re
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        for line in REPORT_LINES:
            clean_line = ansi_escape.sub('', line)
            f.write(clean_line + "\n")
    
    print(f"\n{GREEN}✨ Verification Completed. Report generated: verification_report.md{RESET}")

if __name__ == "__main__":
    asyncio.run(run_verification())
