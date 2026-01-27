import sqlite3
import sys
import os
from passlib.context import CryptContext

# Configuration
DB_PATH = "backend/sql_app.db"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def upsert_admin_user(email, password):
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        sys.exit(1)
        
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        hashed_password = get_password_hash(password)

        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if user:
            cursor.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (hashed_password, email))
            print(f"Updated password for existing user {email}")
        else:
            # Create new super admin
            cursor.execute(
                "INSERT INTO users (email, hashed_password, full_name, role, is_active, is_approved) VALUES (?, ?, ?, ?, ?, ?)",
                (email, hashed_password, "Admin User", "super_admin", 1, 1)
            )
            print(f"Created new admin user {email}")
            
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error upserting admin user: {e}")
        sys.exit(1)

if __name__ == "__main__":
    upsert_admin_user("admin@cadence.ai", "admin123")
