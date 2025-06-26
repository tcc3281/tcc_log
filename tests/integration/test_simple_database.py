"""
Simple Database Integration Tests using SQLite
"""
import pytest
import sys
import os

# Add the project root to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.config.simple_test_config import test_client, db_session, test_db, create_test_user


class TestSimpleDatabase:
    """Simple database integration tests using SQLite"""
    
    def test_user_creation(self, test_client, db_session):
        """Test user creation with valid data"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = test_client.post("/users/", json=user_data)
        assert response.status_code == 201
        assert response.json()["username"] == "testuser"
        assert response.json()["email"] == "test@example.com"
    
    def test_user_creation_duplicate_username(self, test_client, db_session):
        """Test user creation with duplicate username"""
        # Create first user
        user_data = {
            "username": "duplicate",
            "email": "first@example.com",
            "password": "testpassword123"
        }
        response1 = test_client.post("/users/", json=user_data)
        assert response1.status_code == 201
        
        # Try to create user with same username
        user_data2 = {
            "username": "duplicate",
            "email": "second@example.com",
            "password": "testpassword123"
        }
        response2 = test_client.post("/users/", json=user_data2)
        assert response2.status_code == 400
        assert "Username already registered" in response2.json()["detail"]
    
    def test_user_login_success(self, test_client, db_session):
        """Test successful user login"""
        # Create test user
        user_data = {
            "username": "loginuser",
            "email": "login@example.com",
            "password": "testpassword123"
        }
        response = test_client.post("/users/", json=user_data)
        assert response.status_code == 201
        
        # Login with credentials
        login_data = {
            "username": "loginuser",
            "password": "testpassword123"
        }
        response = test_client.post("/auth/token", data=login_data)
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert response.json()["token_type"] == "bearer"
    
    def test_user_login_wrong_password(self, test_client, db_session):
        """Test login with wrong password"""
        # Create test user
        user_data = {
            "username": "wrongpassuser",
            "email": "wrongpass@example.com",
            "password": "correctpassword"
        }
        response = test_client.post("/users/", json=user_data)
        assert response.status_code == 201
        
        # Try login with wrong password
        login_data = {
            "username": "wrongpassuser",
            "password": "wrongpassword"
        }
        response = test_client.post("/auth/token", data=login_data)
        assert response.status_code == 401
    
    def test_protected_endpoint_with_valid_token(self, test_client, db_session):
        """Test accessing protected endpoint with valid token"""
        # Create and login user
        user_data = {
            "username": "protecteduser",
            "email": "protected@example.com",
            "password": "testpassword123"
        }
        response = test_client.post("/users/", json=user_data)
        assert response.status_code == 201
        
        # Login to get token
        login_data = {
            "username": "protecteduser",
            "password": "testpassword123"
        }
        response = test_client.post("/auth/token", data=login_data)
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # Access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = test_client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        assert response.json()["username"] == "protecteduser"
