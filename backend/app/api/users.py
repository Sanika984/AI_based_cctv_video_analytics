from fastapi import APIRouter, Depends
from app.db.connection import SessionLocal
from app.models.user import User

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_users(db=Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "user_id": u.user_id,
            "username": u.username,
            "role": u.role
        }
        for u in users
    ]
