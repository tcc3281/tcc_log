#!/usr/bin/env python3
from app.database import SessionLocal
from app.models import User
from app.crud import create_user
from app.schemas import UserCreate
from passlib.context import CryptContext

def create_test_user():
    db = SessionLocal()
    try:
        # Create password context
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Test user data
        username = "testuser"
        email = "test@example.com"
        password = "Mayyeutao0?"
        
        # Hash password
        hashed_password = pwd_context.hash(password)
        print(f"Hashed password: {hashed_password[:30]}...")
        
        # Test verification
        is_valid = pwd_context.verify(password, hashed_password)
        print(f"Password verification test: {is_valid}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists")
            
            # Test with existing user
            is_valid_existing = pwd_context.verify(password, existing_user.password_hash)
            print(f"Existing user password verification: {is_valid_existing}")
            
            # Let's try to update the existing user's password
            existing_user.password_hash = hashed_password
            db.commit()
            print(f"Updated existing user's password")
        else:
            # Create new user
            user_create = UserCreate(
                username=username,
                email=email,
                password=password
            )
            
            new_user = create_user(db, user_create)
            print(f"Created new user: {new_user.username}")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
