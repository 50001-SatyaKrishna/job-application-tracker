from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from email_validator import validate_email, EmailNotValidError

from .. import models, security, schemas
from ..auth.oauth2 import get_current_user
from ..database import get_db
router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        validate_email(user.email, check_deliverability=True)
    except EmailNotValidError:
        raise HTTPException(
            status_code=400,
            detail="Email domain cannot receive email"
        )
    existing_user = db.execute(select(models.User).where(models.User.email == user.email)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    hashed_password = security.hash_password(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me",response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this user"
        )
    statement = select(models.User).where(models.User.id == user_id)
    user = db.execute(statement).scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user

@router.delete("/{user_id}",status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db),current_user: models.User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to delete this user"
        )
    statement = select(models.User).where(models.User.id == user_id)
    user = db.execute(statement).scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    db.delete(user)
    db.commit()

