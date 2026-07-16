import sqlite3
import os

db_path = os.path.join("backend", "services", "auth-service", "fda_local.db")
if not os.path.exists(db_path):
    print(f"Database file not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT email, role, password_hash FROM users")
        users = cursor.fetchall()
        print(f"Found {len(users)} users in {db_path}:")
        for user in users:
            print(f"Email: {user[0]}, Role: {user[1]}, Hash: {user[2][:20]}...")
    except Exception as e:
        print(f"Error reading database: {e}")
    conn.close()
