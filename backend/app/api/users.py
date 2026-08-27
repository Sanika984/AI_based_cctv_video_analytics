import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.connection import SessionLocal
from app.models.user import User
from app.core.security import require_role, get_password_hash
from app.schemas.auth import UserCreate, UserUpdate

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    users = db.query(User).all()
    return [
        {
            "user_id": u.user_id,
            "username": u.username,
            "role": u.role,
            "is_active": u.is_active,
            "last_login": u.last_login,
            "created_at": u.created_at
        }
        for u in users
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    existing = db.query(User).filter(User.username == payload.username.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        user_id=f"USR-{uuid.uuid4().hex[:8].upper()}",
        username=payload.username.strip(),
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        created_at=datetime.utcnow(),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "user_id": new_user.user_id,
        "username": new_user.username,
        "role": new_user.role,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at
    }


@router.put("/{user_id}")
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None and payload.password.strip():
        user.password_hash = get_password_hash(payload.password.strip())

    db.commit()
    db.refresh(user)

    return {
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at
    }


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if current_user.user_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return None
