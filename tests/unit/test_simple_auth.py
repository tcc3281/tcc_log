"""
Simple Authentication Tests
"""
import pytest
import sys
import os

# Add the project root to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from tests.config.simple_test_config import test_client, db_session, test_db, create_test_user


class TestSimpleAuth:
    """Simple authentication tests without complex database setup"""
    
    def test_invalid_token_access(self, test_client):
        """Test accessing protected endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = test_client.get("/auth/me", headers=headers)
        assert response.status_code == 401
    
    def test_no_token_access(self, test_client):
        """Test accessing protected endpoint without token"""
        response = test_client.get("/auth/me")
        assert response.status_code == 401
    
    def test_registration_endpoint_exists(self, test_client):
        """Test that registration endpoint exists"""
        response = test_client.post("/users/", json={})
        # Should not be 404 (endpoint exists), could be 422 (validation error)
        assert response.status_code != 404
    
    def test_login_endpoint_exists(self, test_client):
        """Test that login endpoint exists"""
        response = test_client.post("/auth/token", data={})
        # Should not be 404 (endpoint exists), could be 422 (validation error)
        assert response.status_code != 404
