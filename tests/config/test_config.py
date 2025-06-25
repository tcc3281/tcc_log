"""
Test Configuration
Provides test database connection and utilities that don't affect production data
"""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv
from fastapi.testclient import TestClient

# Load test environment
load_dotenv(".env.test")

from app.database import Base, get_db
from app.main import app

# Test database configuration
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql+psycopg2://postgres:Mayyeutao0%3F@127.0.0.1:5432/tcc_log_test")

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False} if "sqlite" in TEST_DATABASE_URL else {}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override the dependency
app.dependency_overrides[get_db] = override_get_db

# Test client
client = TestClient(app)

@pytest.fixture(scope="session")
def test_db():
    """Create test database tables"""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a clean database session for each test"""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def test_client():
    """Create test client for each test"""
    return client

# Test data factory functions
def create_test_user(db_session, username="testuser", email="test@example.com"):
    """Create a test user"""
    from app import crud, schemas
    from app.crud import get_password_hash
    
    user_data = schemas.UserCreate(
        username=username,
        email=email,
        password="testpassword123"
    )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user directly in database
    from app.models import User
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    db_session.add(db_user)
    db_session.commit()
    db_session.refresh(db_user)
    
    return db_user

def create_test_topic(db_session, user_id, topic_name="Test Topic"):
    """Create a test topic"""
    from app.models import Topic
    
    topic = Topic(
        user_id=user_id,
        topic_name=topic_name,
        description="Test topic description"
    )
    db_session.add(topic)
    db_session.commit()
    db_session.refresh(topic)
    
    return topic

def create_test_entry(db_session, user_id, topic_id, title="Test Entry"):
    """Create a test entry"""
    from app.models import Entry
    from datetime import date
    
    entry = Entry(
        user_id=user_id,
        topic_id=topic_id,
        title=title,
        content="Test entry content for testing purposes",
        entry_date=date.today(),
        mood="happy",
        weather="sunny"
    )
    db_session.add(entry)
    db_session.commit()
    db_session.refresh(entry)
    
    return entry

def get_auth_headers(test_client, username="testuser", password="testpassword123"):
    """Get authentication headers for API testing"""
    response = test_client.post(
        "/auth/token",
        data={"username": username, "password": password}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}

# Mock AI responses for testing
class MockAIResponse:
    @staticmethod
    def mock_chat_response():
        return {
            "think": "This is a test AI thinking process",
            "answer": "This is a test AI response",
            "model": "test-model",
            "tokens_per_second": 100,
            "inference_time": 0.5
        }
    
    @staticmethod
    def mock_analysis_response():
        return {
            "think": "Analyzing the test content...",
            "answer": "This test content shows positive sentiment and learning progress.",
            "analysis_type": "general",
            "confidence": 0.95
        }
