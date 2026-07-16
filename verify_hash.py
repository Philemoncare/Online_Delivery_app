import bcrypt

hashed = b"$2b$12$qdNmv0ufVwYkf/1xl.OJ9.7KOda8PD72Y0d60B0ELn08OhrVEcXKm"
password = "password123".encode('utf-8')

if bcrypt.checkpw(password, hashed):
    print("Match!")
else:
    print("No match!")
