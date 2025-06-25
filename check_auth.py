#!/usr/bin/env python3
from app.database import SessionLocal
from app.models import User
from app.api.auth import verify_password
from app.crud import get_user_by_username

def check_user_auth():
    db = SessionLocal()
    try:
        username = "tcc3281"
        password = "Mayyeutao0?"
        
        # Get user from database
        user = get_user_by_username(db, username=username)
        if user:
            print(f"Found user: {user.username}")
            print(f"Password hash: {user.password_hash[:20]}...")
            
            # Test password verification
            is_valid = verify_password(password, user.password_hash)
            print(f"Password verification: {is_valid}")
            
            if not is_valid:
                # Try some common variations
                test_passwords = [
                    "Mayyeutao0?",
                    "Mayyeutao0",
                    "mayyeutao0?",
                    "test123",
                    "password"
                ]
                
                print("\nTrying common password variations:")
                for test_pw in test_passwords:
                    is_valid = verify_password(test_pw, user.password_hash)
                    print(f"'{test_pw}': {is_valid}")
        else:
            print(f"User '{username}' not found")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user_auth()
