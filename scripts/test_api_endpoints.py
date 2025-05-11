#!/usr/bin/env python3
import requests
import time
import random
import sys
import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("api-tester")

# Base URL for API
API_URL = "http://127.0.0.1:8000"

def test_debug_routes():
    """Get all registered routes for debugging"""
    logger.info("Getting all registered routes...")
    response = requests.get(f"{API_URL}/debug/routes")
    if response.status_code == 200:
        routes = response.json()["routes"]
        for route in routes:
            logger.info(f"Route: {route['path']} - Methods: {route['methods']}")
    else:
        logger.error(f"Failed to get routes: {response.status_code}")
    return response.status_code == 200

def test_root():
    """Test the root endpoint"""
    logger.info("Testing root endpoint...")
    response = requests.get(f"{API_URL}/")
    logger.info(f"Status: {response.status_code}, Content: {response.json()}")
    return response.status_code == 200

def test_register_user(username: str, email: str, password: str) -> Optional[Dict[str, Any]]:
    """Test user registration"""
    logger.info(f"Testing user registration with username: {username}...")
    
    # First, test OPTIONS request for preflight
    options_response = requests.options(
        f"{API_URL}/users",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        }
    )
    logger.info(f"OPTIONS status: {options_response.status_code}")
    logger.info(f"OPTIONS headers: {dict(options_response.headers)}")
    
    # Then send the actual POST request
    data = {
        "username": username,
        "email": email,
        "password": password
    }
    
    # Log the exact request details
    logger.info(f"Sending POST to: {API_URL}/users")
    logger.info(f"With data: {data}")
    
    response = requests.post(
        f"{API_URL}/users",
        json=data,
        headers={
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
    )
    
    # Log detailed response
    logger.info(f"Response status code: {response.status_code}")
    logger.info(f"Response headers: {dict(response.headers)}")
    
    try:
        response_json = response.json()
        logger.info(f"Response body: {response_json}")
    except:
        logger.info(f"Response text: {response.text}")
    
    if response.status_code == 201:
        logger.info(f"User created: {response.json()}")
        return response.json()
    else:
        logger.error(f"Failed to create user: {response.status_code}")
        logger.error(f"Response: {response.text}")
        return None

def main():
    """Main function to test various API endpoints"""
    logger.info("Starting API tests...")
    
    # First, get all registered routes
    test_debug_routes()
    
    if not test_root():
        logger.error("Root endpoint test failed. Exiting.")
        sys.exit(1)
    
    # Test user registration with random username to avoid conflicts
    random_suffix = str(int(time.time() * 1000))[-6:]
    test_username = f"testuser_{random_suffix}"
    test_email = f"test_{random_suffix}@example.com"
    test_password = "password123"
    
    user = test_register_user(test_username, test_email, test_password)
    if not user:
        logger.error("User registration test failed. Exiting.")
        sys.exit(1)
    
    # Add more tests here as needed
    
    logger.info("All tests completed successfully!")

if __name__ == "__main__":
    main()
