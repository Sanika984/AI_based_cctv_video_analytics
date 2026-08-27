import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uuid
from datetime import datetime
from app.db.connection import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


def seed_users():
    db = SessionLocal()
    try:
        users_to_seed = [
            {
                "username": "admin",
                "password": "admin123",
                "role": "admin"
            },
            {
                "username": "operator",
                "password": "operator123",
                "role": "operator"
            },
            {
                "username": "viewer",
                "password": "viewer123",
                "role": "viewer"
            }
        ]

        print("Seeding users...")
        for u_data in users_to_seed:
            user = db.query(User).filter(User.username == u_data["username"]).first()
            hashed = get_password_hash(u_data["password"])
            if user:
                print(f"Updating existing user: {u_data['username']} (role: {u_data['role']})")
                user.password_hash = hashed
                user.role = u_data["role"]
                user.is_active = True
            else:
                print(f"Creating user: {u_data['username']} (role: {u_data['role']})")
                new_user = User(
                    user_id=f"USR-{uuid.uuid4().hex[:8].upper()}",
                    username=u_data["username"],
                    password_hash=hashed,
                    role=u_data["role"],
                    created_at=datetime.utcnow(),
                    is_active=True
                )
                db.add(new_user)
        
        db.commit()
        print("Users successfully seeded!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
