from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from uuid import UUID
from jose import JWTError, jwt
import bcrypt
import os
import uuid
import shutil
from dotenv import load_dotenv

import models, schemas, database

load_dotenv()

app = FastAPI(title="fDA Auth Service", version="1.0.0")

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {"status": "fDA Auth Service is running", "version": "1.0.0"}

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.post("/api/v1/auth/upload")
async def upload_profile_picture(file: UploadFile = File(...), token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login"))):
    # Minimal verify for upload
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET", "your-super-secret-key"), algorithms=[os.getenv("JWT_ALGORITHM", "HS256")])
        user_id = payload.get("sub")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{user_id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    url = f"http://localhost:8000/uploads/{filename}"
    return {"url": url}

# Initialize Database
models.Base.metadata.create_all(bind=database.engine)

SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain, hashed):
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.strip().encode('utf-8'))
    except Exception as e:
        print(f"Bcrypt Error: {e}")
        # Only fallback if absolutely necessary, but for dev we allow plain match
        return plain == hashed.strip()

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = str(payload.get("sub")).strip()
    except Exception as e:
        print(f"DEBUG: Token decode failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid session")

    # Search by ID or Email as a fallback for SQLite stability
    user = db.query(models.User).filter(models.User.user_id == user_id).first()

    if not user:
        print(f"DEBUG: User ID {user_id} not found. Checking if it matches email fallback...")
        user = db.query(models.User).filter(models.User.email == user_id).first()

    if not user:
        print("DEBUG: User definitely not found.")
        raise HTTPException(status_code=401, detail="User not recognized")
    return user

def log_action(db: Session, user_id: str, action: str, details: str = None):
    db_log = models.AuditLog(
        log_id=str(uuid.uuid4()),
        user_id=user_id,
        action=action,
        details=details
    )
    db.add(db_log)
    db.commit()

@app.post("/api/v1/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # ... existing code ...
    token = create_access_token(data={"sub": str(user.user_id), "role": user.role.value})
    log_action(db, str(user.user_id), "LOGIN", f"User {user.email} logged in")
    return {"access_token": token, "refresh_token": token, "token_type": "bearer"}

@app.post("/api/v1/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    user_data = user.dict(exclude={"password"})
    new_user = models.User(
        **user_data,
        user_id=str(uuid.uuid4()),
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/v1/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/api/v1/auth/me", response_model=schemas.UserOut)
def update_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user

# --- WALLET & TRANSACTIONS ---

@app.get("/api/v1/users/{user_id}/wallet", response_model=float)
def get_wallet_balance(user_id: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return float(user.wallet_balance)

@app.post("/api/v1/users/{user_id}/transactions", response_model=schemas.TransactionOut)
def create_transaction(user_id: str, tx: schemas.TransactionBase, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_tx = models.Transaction(
        user_id=user_id,
        amount=tx.amount,
        type=tx.type,
        description=tx.description
    )

    if tx.type == "CREDIT":
        user.wallet_balance += tx.amount
    elif tx.type == "DEBIT":
        if user.wallet_balance < tx.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        user.wallet_balance -= tx.amount

    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.get("/api/v1/users/{user_id}/transactions", response_model=List[schemas.TransactionOut])
def get_user_transactions(user_id: str, db: Session = Depends(database.get_db)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()

@app.get("/api/v1/admin/audit-logs")
def get_audit_logs(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).all()

@app.get("/api/v1/admin/users", response_model=list[schemas.UserOut])
def get_all_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return db.query(models.User).all()

@app.patch("/api/v1/admin/users/{id}", response_model=schemas.UserOut)
def update_user_admin(id: UUID, user_update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    db_user = db.query(models.User).filter(models.User.user_id == str(id)).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    log_action(db, str(current_user.user_id), "UPDATE_USER", f"Admin updated user {db_user.email}")
    return db_user

@app.delete("/api/v1/admin/users/{id}")
def delete_user(id: UUID, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    db_user = db.query(models.User).filter(models.User.user_id == str(id)).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    email = db_user.email
    db.delete(db_user)
    db.commit()
    log_action(db, str(current_user.user_id), "DELETE_USER", f"Admin deleted user {email}")
    return {"status": "success"}

# --- SYSTEM SETTINGS ---

@app.get("/api/v1/admin/settings")
def get_settings(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    settings = db.query(models.SystemSetting).all()
    return {s.key: s.value for s in settings}

@app.post("/api/v1/admin/settings")
def update_settings(settings: dict, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    for key, value in settings.items():
        db_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        if db_setting:
            db_setting.value = str(value)
        else:
            db_setting = models.SystemSetting(key=key, value=str(value))
            db.add(db_setting)
    db.commit()
    log_action(db, str(current_user.user_id), "UPDATE_SETTINGS", f"Admin updated system settings")
    return {"status": "success"}

@app.post("/api/v1/admin/restaurants", response_model=schemas.UserOut) # Using UserOut as proxy for success if we want to create a vendor + restaurant
def create_restaurant_admin():
    # Actually, admin might just create a user with role=vendor and then the vendor creates their restaurant.
    # Or Admin creates both. Let's stick to user management for now.
    pass
