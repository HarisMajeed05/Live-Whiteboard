from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime


class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class BoardCreate(BaseModel):
    name: str


class BoardOut(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime


class ElementData(BaseModel):
    id: str
    type: str  # "pen" | "rect" | "circle" | "line" | "text"
    data: dict[str, Any]
    color: str
    stroke_width: int = 3
    created_by: Optional[str] = None
    deleted: bool = False
