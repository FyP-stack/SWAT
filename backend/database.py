"""
Database models for SWaT application
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, JSON, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

Base = declarative_base()

class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationship to evaluations
    evaluations = relationship("Evaluation", back_populates="user")

class Evaluation(Base):
    """Model evaluation results"""
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_name = Column(String, nullable=False, index=True)
    model_type = Column(String)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    threshold_used = Column(Float)
    confusion_matrix = Column(JSON)
    class_labels = Column(JSON)
    curves_data = Column(JSON)  # ROC and PR curve data
    n_samples = Column(Integer)
    n_anomalies = Column(Integer)
    file_name = Column(String)
    raw_score_summary = Column(JSON)
    evaluation_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship back to user
    user = relationship("User", back_populates="evaluations")

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./swat_auth.db")

# SQLite connection args with proper timeout and isolation for concurrent access
if "sqlite" in DATABASE_URL:
    connect_args = {
        "check_same_thread": False,
        "timeout": 30.0,  # 30 second timeout for locked database
    }
else:
    connect_args = {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Test connections before use
    pool_recycle=3600,  # Recycle connections every hour
    # For SQLite, use serializable isolation with timeout
    echo_pool=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
