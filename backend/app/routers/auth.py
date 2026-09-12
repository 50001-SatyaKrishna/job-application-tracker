from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from .. import models, security, schemas
from ..database import get_db

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login_user(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    statement = select(models.User).where(models.User.email == user_credentials.email)
    user = db.execute(statement).scalar_one_or_none()
    if user is None or not security.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code = 401,
            detail="Invalid email or password"
        )
    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

