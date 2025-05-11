#!/usr/bin/env python3
import sys
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import time

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import crud, models, schemas
from app.database import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("user-crud-test")

def main():
    """Test user CRUD operations directly with the database"""
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL not found in environment")
        sys.exit(1)
    
    logger.info(f"Connecting to database: {database_url.split('@')[-1].split('/')[0]}")
    
    # Create engine and session
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Create a test user
    test_username = f"testuser_{int(time.time())}"
    test_email = f"test_{int(time.time())}@example.com"
    test_password = "password123"
    
    user_create = schemas.UserCreate(
        username=test_username,
        email=test_email,
        password=test_password
    )
    
    # Get a session
    db = SessionLocal()
    
    try:
        # Create user
        logger.info(f"Creating user with username: {test_username}")
        user = crud.create_user(db, user_create)
        logger.info(f"User created with ID: {user.user_id}")
        
        # Get user by username
        found_user = crud.get_user_by_username(db, test_username)
        if found_user:
            logger.info(f"Found user by username: {found_user.username}, Email: {found_user.email}")
        else:
            logger.error("User not found by username")
        
        logger.info("User CRUD test completed successfully!")
    except Exception as e:
        logger.error(f"Error during user CRUD test: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
