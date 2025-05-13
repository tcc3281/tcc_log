"""
Seed data script for initializing the database with sample data
"""

import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .database import get_db, engine
from .models import Base, User, Topic
from .crud import create_user, get_user_by_email
from passlib.context import CryptContext

# Setup logging
logger = logging.getLogger("backend.seed_data")

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_data():
    """
    Seed the database with initial data if it's empty
    """
    logger.info("Checking if database needs seeding...")
    db = next(get_db())
    
    # Check if we have any users
    try:
        seed_users(db)
        seed_topics(db)
        logger.info("Database seeding completed")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

def seed_users(db: Session):
    """Seed sample users"""
    # Check if we already have users
    user_count = db.query(User).count()
    if user_count > 0:
        logger.info(f"Found {user_count} existing users, skipping user seeding")
        return
    
    logger.info("Seeding users...")
    
    # Create demo user
    try:
        demo_user = {
            "username": "demo_user",
            "email": "demo@example.com",
            "password": pwd_context.hash("password123")
        }
        
        user_obj = User(
            username=demo_user["username"],
            email=demo_user["email"],
            hashed_password=demo_user["password"]
        )
        
        db.add(user_obj)
        db.commit()
        db.refresh(user_obj)
        logger.info(f"Created demo user: {demo_user['username']}")
    except IntegrityError:
        logger.info("Demo user already exists")
        db.rollback()

def seed_topics(db: Session):
    """Seed sample topics"""
    # Check if we already have topics
    topic_count = db.query(Topic).count()
    if topic_count > 0:
        logger.info(f"Found {topic_count} existing topics, skipping topic seeding")
        return
    
    logger.info("Seeding topics...")
    
    # Get the user (should be created by seed_users)
    user = db.query(User).filter(User.email == "demo@example.com").first()
    
    if not user:
        logger.warning("Demo user not found, cannot seed topics")
        return
    
    # Sample topics
    sample_topics = [
        {
            "topic_name": "Work Notes",
            "description": "Notes and thoughts related to my professional work"
        },
        {
            "topic_name": "Learning Journal",
            "description": "Tracking my learning progress on various subjects"
        },
        {
            "topic_name": "Project Ideas",
            "description": "Collection of project ideas and brainstorming sessions"
        }
    ]
    
    for topic_data in sample_topics:
        try:
            topic = Topic(
                topic_name=topic_data["topic_name"],
                description=topic_data["description"],
                user_id=user.user_id
            )
            db.add(topic)
            logger.info(f"Created topic: {topic_data['topic_name']}")
        except IntegrityError:
            logger.info(f"Topic '{topic_data['topic_name']}' already exists")
            db.rollback()
    
    db.commit()
