import sqlite3
import sys
import os

# Connect to the SQLite database
# Adjust path if needed (backend/sql_app.db)
DB_PATH = "backend/sql_app.db"

def approve_user(email):
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        sys.exit(1)
        
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id, is_approved FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"User {email} not found.")
            sys.exit(1)
            
        if user[1]:
            print(f"User {email} is already approved.")
        else:
            cursor.execute("UPDATE users SET is_approved = 1 WHERE email = ?", (email,))
            conn.commit()
            print(f"Successfully approved user {email}")
            
        conn.close()
    except Exception as e:
        print(f"Error approving user: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python approve_test_user.py <email>")
        sys.exit(1)
        
    approve_user(sys.argv[1])
