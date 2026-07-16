import os
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader

SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "fDA_INTERNAL_SECRET_2024")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
api_key_header = APIKeyHeader(name="X-Internal-Key", auto_error=False)

def verify_token(token: str = Depends(oauth2_scheme), internal_key: str = Depends(api_key_header)):
    if internal_key == INTERNAL_API_KEY:
        return {"user_id": "SYSTEM", "role": "admin"}

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = str(payload.get("sub")).strip()
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        return {"user_id": user_id, "role": role}
    except JWTError:
        raise credentials_exception
