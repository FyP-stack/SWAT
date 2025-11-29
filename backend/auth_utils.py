"""
Authentication utilities for SWaT API
"""
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from database import User

# Configuration
SECRET_KEY = "your-super-secret-key-change-in-production"  # Change in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class AuthError(Exception):
    """Custom authentication error"""
    pass

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password

def create_access_token(email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": email,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_token(token: str) -> Optional[str]:
    """Decode and validate JWT token, return email if valid"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return None
        return email
    except jwt.ExpiredSignatureError:
        raise AuthError("Token has expired")
    except jwt.InvalidTokenError:
        raise AuthError("Invalid token")

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user from database by email"""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, password: str, full_name: str = "") -> User:
    """Create new user in database"""
    hashed_password = hash_password(password)
    user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    # Update last login (will be persisted via db.commit() in the login endpoint if needed)
    user.last_login = datetime.utcnow()
    db.add(user)  # Explicitly mark for update
    # Don't commit here - let the endpoint handle it with proper error handling
    return user

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength
    Returns: (is_valid, message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    if not (has_upper and has_lower and has_digit):
        return False, "Password must contain uppercase, lowercase, and numbers"
    
    return True, "Password is strong"
