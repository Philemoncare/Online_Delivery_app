import sqlite3
import os

# Check both possible locations
paths = [
    os.path.join("backend", "services", "auth-service", "fda_local.db"),
    "fda_local.db"
]

for db_path in paths:
    print(f"\nChecking: {db_path}")
    if not os.path.exists(db_path):
        print("File does not exist.")
        continue

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT email, password_hash, role FROM users")
        rows = cursor.fetchall()
        if not rows:
            print("Database exists but users table is empty.")
        for row in rows:
            print(f"User Found -> Email: {row[0]}, Hash: {row[1]}, Role: {row[2]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
