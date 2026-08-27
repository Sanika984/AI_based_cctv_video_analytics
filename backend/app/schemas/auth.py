from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class UserProfileResponse(BaseModel):
    user_id: str
    username: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["admin", "operator", "viewer"] = "viewer"


class UserUpdate(BaseModel):
    role: Optional[Literal["admin", "operator", "viewer"]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
