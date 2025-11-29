"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str

class UserResponse(UserBase):
    """User response schema"""
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    expires_in: int

class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    error_code: Optional[str] = None

class PasswordValidationResponse(BaseModel):
    """Password validation response"""
    is_valid: bool
    message: str
