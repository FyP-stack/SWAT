"""
Script to seed dummy user data into the database for testing/development
"""
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, User, engine, Base

def seed_users():
    """Create dummy users in the database"""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Import after creating tables
        from auth_utils import hash_password

        # Create dummy users - update password if admin user exists with wrong password
        dummy_users = [
            {
                "email": "test@example.com",
                "password": "TestPassword123!",
                "full_name": "Test User"
            },
            {
                "email": "admin@swat.local",
                "password": "admin123",
                "full_name": "Admin User"
            },
            {
                "email": "demo@swat.local",
                "password": "DemoPassword123!",
                "full_name": "Demo User"
            }
        ]
        
        # Special handling for admin user - update password if it exists with wrong password
        admin_data = next(u for u in dummy_users if u["email"] == "admin@swat.local")
        existing_admin = db.query(User).filter(User.email == admin_data["email"]).first()
        if existing_admin:
            # Update admin password to ensure it's correct
            from auth_utils import verify_password
            if not verify_password(admin_data["password"], existing_admin.hashed_password):
                existing_admin.hashed_password = hash_password(admin_data["password"])
                print(f"✓ Updated admin password for: {admin_data['email']}")

        for user_data in dummy_users:
            # Check if user already exists
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing:
                hashed_pwd = hash_password(user_data["password"])
                new_user = User(
                    email=user_data["email"],
                    hashed_password=hashed_pwd,
                    full_name=user_data["full_name"],
                    is_active=True
                )
                db.add(new_user)
                print(f"✓ Created user: {user_data['email']}")
            else:
                print(f"✓ User already exists: {user_data['email']}")
        
        db.commit()
        print("\n✓ Database seeded successfully!")
        print("\nYou can login with:")
        for user_data in dummy_users:
            print(f"  Email: {user_data['email']}")
            print(f"  Password: {user_data['password']}")
            print()
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
