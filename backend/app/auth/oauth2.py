from app.database import get_db
from .. import models
from ..config import settings
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
import jwt
from sqlalchemy.orm import Session
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='login')

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

def get_current_user_id(token: str = Depends(oauth2_scheme)):
    return verify_access_token(token)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    user_id = verify_access_token(token)

    user = db.get(models.User, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
