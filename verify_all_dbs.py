import sqlite3
import os

BASE_DIR = os.getcwd()
dbs = {
    "AUTH": os.path.join(BASE_DIR, 'backend', 'services', 'auth-service', "fda_local.db"),
    "ORDER": os.path.join(BASE_DIR, 'backend', 'services', 'order-service', "fda_local.db"),
    "REST": os.path.join(BASE_DIR, 'backend', 'services', 'restaurant-service', "fda_local.db")
}

for name, path in dbs.items():
    print(f"\n--- Checking {name} DB at {path} ---")
    if not os.path.exists(path):
        print("FILE MISSING!")
        continue

    conn = sqlite3.connect(path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables: {[t[0] for t in tables]}")

        if ('users',) in tables:
            cursor.execute("SELECT email, role FROM users")
            print(f"Users: {cursor.fetchall()}")

        if ('orders',) in tables:
            cursor.execute("SELECT order_id, status FROM orders")
            print(f"Orders: {cursor.fetchall()}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
