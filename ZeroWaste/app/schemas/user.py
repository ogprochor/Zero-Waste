from pydantic import BaseModel, EmailStr, Field, validator
import re
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=30, description="Nazwa użytkownika (3-30 znaków)")
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72, description="Hasło (8-72 znaków)")
    phone: Optional[str] = None

    @validator('username')
    def validate_username(cls, v):

        v = v.strip()
        if not v:
            raise ValueError("Nazwa użytkownika nie może być pusta")
        if not re.match(r'^[a-zA-Z0-9_.-]+$', v):
            raise ValueError("Nazwa użytkownika może zawierać tylko litery, cyfry oraz znaki _ . -")
        return v

    @validator('password')
    def validate_password(cls, v):
        errors = []

        if len(v) < 8:
            errors.append("Hasło musi mieć co najmniej 8 znaków")


        if not any(c.isupper() for c in v):
            errors.append("Hasło musi zawierać co najmniej jedną wielką literę")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            errors.append("Hasło musi zawierać co najmniej jeden znak specjalny")

        if errors:
            raise ValueError("; ".join(errors))

        return v

    @validator("phone")
    def validate_phone(cls, v):
        if v is None:
            return v

        if not re.fullmatch(r"\+?\d{7,15}", v):
            raise ValueError("Invalid phone number")

        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)
    bio: Optional[str] = None
    phone: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if v is None:
            return v

        errors = []
        if len(v) < 8:
            errors.append("Hasło musi mieć co najmniej 8 znaków")

        if not any(c.isupper() for c in v):
            errors.append("Hasło musi zawierać co najmniej jedną wielką literę")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            errors.append("Hasło musi zawierać co najmniej jeden znak specjalny")

        if errors:
            raise ValueError("; ".join(errors))

        return v

    @validator('phone')
    def validate_phone(cls, v):
        if not v:
            return v

        if not re.match(r'^\+?[0-9]{7,15}$', v):
            raise ValueError("Nieprawidłowy numer telefonu")

        return v


class User(UserBase):
    id: int
    created_at: datetime
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True