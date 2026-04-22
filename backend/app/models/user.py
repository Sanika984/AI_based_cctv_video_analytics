from sqlalchemy import Column, String, Text, DateTime, Boolean
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True)
    username = Column(Text, nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)