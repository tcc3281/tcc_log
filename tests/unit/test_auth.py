"""
Unit Tests for Authentication
Tests user registration, login, and JWT token functionality
"""

import pytest
from tests.config.test_config import test_client, db_session, test_db, create_test_user

class TestAuthentication:
    """Test authentication endpoints and functionality"""
    
    def test_user_registration_success(self, test_client, db_session):
        """Test successful user registration"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "strongpassword123"
        }
        
        response = test_client.post("/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert "user_id" in data
        assert "password" not in data  # Password should not be returned
    
    def test_user_registration_duplicate_username(self, test_client, db_session):
        """Test registration with duplicate username"""
        # Create first user
        create_test_user(db_session, username="duplicate", email="first@example.com")
        
        # Try to create second user with same username
        user_data = {
            "username": "duplicate",
            "email": "second@example.com", 
            "password": "password123"
        }
        
        response = test_client.post("/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_user_registration_duplicate_email(self, test_client, db_session):
        """Test registration with duplicate email"""
        # Create first user
        create_test_user(db_session, username="user1", email="duplicate@example.com")
        
        # Try to create second user with same email
        user_data = {
            "username": "user2",
            "email": "duplicate@example.com",
            "password": "password123"
        }
        
        response = test_client.post("/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_user_registration_invalid_data(self, test_client):
        """Test registration with invalid data"""
        invalid_data = {
            "username": "",  # Empty username
            "email": "invalid-email",  # Invalid email format
            "password": "123"  # Too short password
        }
        
        response = test_client.post("/auth/register", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_user_login_success(self, test_client, db_session):
        """Test successful user login"""
        # Create test user
        test_user = create_test_user(db_session)
        
        login_data = {
            "username": test_user.username,
            "password": "testpassword123"
        }
        
        response = test_client.post("/auth/token", data=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_user_login_wrong_password(self, test_client, db_session):
        """Test login with wrong password"""
        # Create test user
        test_user = create_test_user(db_session)
        
        login_data = {
            "username": test_user.username,
            "password": "wrongpassword"
        }
        
        response = test_client.post("/auth/token", data=login_data)
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_user_login_nonexistent_user(self, test_client):
        """Test login with non-existent user"""
        login_data = {
            "username": "nonexistent",
            "password": "anypassword"
        }
        
        response = test_client.post("/auth/token", data=login_data)
        
        assert response.status_code == 401
    
    def test_get_current_user_with_valid_token(self, test_client, db_session):
        """Test getting current user info with valid token"""
        # Create test user and get token
        test_user = create_test_user(db_session)
        
        login_response = test_client.post("/auth/token", data={
            "username": test_user.username,
            "password": "testpassword123"
        })
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = test_client.get("/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["user_id"] == test_user.user_id
    
    def test_get_current_user_with_invalid_token(self, test_client):
        """Test getting current user info with invalid token"""
        headers = {"Authorization": "Bearer invalidtoken"}
        
        response = test_client.get("/auth/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_get_current_user_without_token(self, test_client):
        """Test getting current user info without token"""
        response = test_client.get("/auth/me")
        
        assert response.status_code == 401
    
    def test_token_expiration_format(self, test_client, db_session):
        """Test that token contains proper expiration"""
        from jose import jwt
        from app.api.auth import SECRET_KEY, ALGORITHM
        
        # Create test user and login
        test_user = create_test_user(db_session)
        
        login_response = test_client.post("/auth/token", data={
            "username": test_user.username,
            "password": "testpassword123"
        })
        
        token = login_response.json()["access_token"]
        
        # Decode token to check structure
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert "sub" in payload  # Subject (username)
        assert "exp" in payload  # Expiration time
        assert payload["sub"] == test_user.username
