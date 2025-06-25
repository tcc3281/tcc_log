#!/usr/bin/env python3
from app.database import SessionLocal
from app.models import User
from app.crud import get_user_by_username
import os

def check_database():
    db = SessionLocal()
    try:
        # Check if we can connect to database
        print("=== Database Connection Test ===")
        users = db.query(User).all()
        print(f"Total users in database: {len(users)}")
        
        if users:
            print("\nExisting users:")
            for user in users:
                print(f"- ID: {user.user_id}, Username: {user.username}, Email: {user.email}")
        else:
            print("No users found in database")
            
        # Check database URL
        print(f"\nDatabase URL: {os.getenv('DATABASE_URL', 'Not set')}")
        
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_database()
