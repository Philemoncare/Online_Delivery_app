import bcrypt
import sqlite3

def verify_password(plain, hashed):
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")
        return False

conn = sqlite3.connect('fda_local.db')
cursor = conn.cursor()
cursor.execute("SELECT email, password_hash FROM users WHERE email='admin@example.com'")
row = cursor.fetchone()
conn.close()

if row:
    email, hashed = row
    print(f"User: {email}")
    print(f"Hash: {hashed}")
    if verify_password("password123", hashed):
        print("Verification SUCCESS!")
    else:
        print("Verification FAILED!")
else:
    print("User not found!")
