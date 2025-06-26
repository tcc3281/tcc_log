"""
Simple API Tests for Topics and Entries
"""
import pytest
import sys
import os

# Add the project root to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.config.simple_test_config import test_client, db_session, test_db


class TestTopicsAPI:
    """Test Topics API endpoints"""
    
    def test_create_topic_success(self, test_client, db_session):
        """Test successful topic creation"""
        # Create and login user first
        user_data = {
            "username": "topicuser",
            "email": "topic@example.com",
            "password": "testpassword123"
        }
        response = test_client.post("/users/", json=user_data)
        assert response.status_code == 201
        
        # Login to get token
        login_data = {"username": "topicuser", "password": "testpassword123"}
        response = test_client.post("/auth/token", data=login_data)
        assert response.status_code == 200
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create topic
        topic_data = {
            "topic_name": "Test Topic",
            "description": "This is a test topic"
        }
        response = test_client.post("/topics/", json=topic_data, headers=headers)
        assert response.status_code == 200
        assert response.json()["topic_name"] == "Test Topic"
    
    def test_get_user_topics(self, test_client, db_session):
        """Test getting user's topics"""
        # Create and login user
        user_data = {
            "username": "topiclistuser",
            "email": "topiclist@example.com",
            "password": "testpassword123"
        }
        response = test_client.post("/users/", json=user_data)
        assert response.status_code == 201
        
        # Login to get token
        login_data = {"username": "topiclistuser", "password": "testpassword123"}
        response = test_client.post("/auth/token", data=login_data)
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create topic
        topic_data = {"topic_name": "List Topic", "description": "Topic for listing test"}
        response = test_client.post("/topics/", json=topic_data, headers=headers)
        assert response.status_code == 200
        
        # Get topics
        response = test_client.get("/topics/", headers=headers)
        assert response.status_code == 200
        topics = response.json()
        assert len(topics) == 1
        assert topics[0]["topic_name"] == "List Topic"


class TestEntriesAPI:
    """Test Entries API endpoints"""
    
    def test_create_entry_success(self, test_client, db_session):
        """Test successful entry creation"""
        # Create and login user
        user_data = {
            "username": "entryuser",
            "email": "entry@example.com",
            "password": "testpassword123"
        }
        response = test_client.post("/users/", json=user_data)
        assert response.status_code == 201
        
        # Login
        login_data = {"username": "entryuser", "password": "testpassword123"}
        response = test_client.post("/auth/token", data=login_data)
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create topic first
        topic_data = {"topic_name": "Entry Topic", "description": "Topic for entries"}
        response = test_client.post("/topics/", json=topic_data, headers=headers)
        assert response.status_code == 200
        topic_id = response.json()["topic_id"]
          # Create entry
        entry_data = {
            "title": "Test Entry",
            "content": "This is a test entry content",
            "topic_id": topic_id,
            "mood": "happy",
            "weather": "sunny",
            "entry_date": "2024-01-01",
            "is_public": False
        }
        response = test_client.post("/entries/", json=entry_data, headers=headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Test Entry"
    
    def test_get_user_entries(self, test_client, db_session):
        """Test getting user's entries"""
        # Create and login user
        user_data = {
            "username": "entrylistuser",
            "email": "entrylist@example.com",
            "password": "testpassword123"
        }
        response = test_client.post("/users/", json=user_data)
        assert response.status_code == 201
        
        # Login
        login_data = {"username": "entrylistuser", "password": "testpassword123"}
        response = test_client.post("/auth/token", data=login_data)
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create topic
        topic_data = {"topic_name": "List Entries Topic", "description": "Topic for listing entries"}
        response = test_client.post("/topics/", json=topic_data, headers=headers)
        topic_id = response.json()["topic_id"]
          # Create entry
        entry_data = {
            "title": "List Entry",
            "content": "Entry for listing test",
            "topic_id": topic_id,
            "mood": "content",
            "weather": "cloudy",
            "entry_date": "2024-01-01",
            "is_public": False
        }
        response = test_client.post("/entries/", json=entry_data, headers=headers)
        assert response.status_code == 200
        
        # Get entries
        response = test_client.get("/entries/", headers=headers)
        assert response.status_code == 200
        entries = response.json()
        assert len(entries) == 1
        assert entries[0]["title"] == "List Entry"
    
    def test_unauthorized_access(self, test_client, db_session):
        """Test unauthorized access to protected endpoints"""
        # Try to create topic without authentication
        topic_data = {"topic_name": "Unauthorized Topic", "description": "Should fail"}
        response = test_client.post("/topics/", json=topic_data)
        assert response.status_code == 401
        
        # Try to create entry without authentication
        entry_data = {
            "title": "Unauthorized Entry",
            "content": "Should fail",
            "topic_id": 1,
            "entry_date": "2024-01-01"
        }
        response = test_client.post("/entries/", json=entry_data)
        assert response.status_code == 401
